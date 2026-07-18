import { homedir } from 'node:os'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { mkdtemp, realpath, rm } from 'node:fs/promises'
import { canonicalJson } from '../../shared/canonical-json.js'
import {
  CHALLENGE_PINS,
  CHALLENGE_RELEASE_ID,
  ChallengeArtifactRefsSchema,
  ChallengeCommitmentRequestSchema,
  ChallengeCommitmentResponseSchema,
  ChallengeDisclosureIntentSchema,
  ChallengeDisclosureRequestSchema,
  ChallengeDisclosureResponseSchema,
  ChallengeFreezeIntentSchema,
  ChallengeResultResponseSchema,
  ChallengeResultSubmissionSchema
} from '../../shared/challenge-contracts.js'
import { createDataPlaneObjectStore } from '../data-plane/object-store.js'
import { assertNoSymlinkAncestors, ensurePrivateDirectory } from '../data-plane/safe-path.js'
import { createChallengeClient, verifyChallengeResult } from './client.js'
import { openChallengeDatabase } from './database.js'
import { buildChallengeArtifacts, buildChallengeCommitment, verifyChallengeArtifactSemantics } from './model.js'
import { buildResultSubmission, independentlyScoreChallenge, verifyProducerScoring } from './scoring.js'
import { ChallengeVerificationError, challengeDigest, verifyChallengeBundle, verifyChallengeDisclosureClosure } from './verification.js'

const TEST_TOKEN = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
const PUBLIC_ARTIFACT_KINDS = new Set(['model', 'equation-set', 'parameter-policy', 'concentration-mapping', 'solver', 'software', 'diagnostics', 'prediction', 'public-lineage'])

export class ChallengeRequestError extends Error {
  constructor(code, message, statusCode = 422) {
    super(message)
    this.name = 'ChallengeRequestError'
    this.code = code
    this.statusCode = statusCode
  }
}

function inside(parent, child) {
  const path = relative(parent, child)
  return path === '' || (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path))
}

async function selectRoot(options, env) {
  const configured = options.root ?? env.BIOCHEMICAL_CHALLENGE_ROOT
  if (!configured && env.NODE_ENV === 'test') {
    const parent = resolve(env.BIOCHEMICAL_TEST_CHALLENGE_ROOT ?? resolve(process.cwd(), '..', '.biochemical-inference-test-workspaces'))
    await assertNoSymlinkAncestors(parent)
    await ensurePrivateDirectory(parent)
    const root = await mkdtemp(resolve(parent, 'goal13-'))
    await ensurePrivateDirectory(root)
    return { root, ephemeral: true }
  }
  const root = resolve(configured ?? resolve(homedir(), '.local', 'share', 'biochemical-inference', 'goal13-challenge-v1'))
  if (inside(resolve(process.cwd()), root)) throw new ChallengeRequestError('CHALLENGE_ROOT_IN_SOURCE', 'Goal 13 storage root must be outside the source tree.', 500)
  await assertNoSymlinkAncestors(root)
  await ensurePrivateDirectory(root)
  const [sourceReal, rootReal] = await Promise.all([realpath(process.cwd()), realpath(root)])
  if (inside(sourceReal, rootReal)) throw new ChallengeRequestError('CHALLENGE_ROOT_IN_SOURCE', 'Goal 13 storage root must be outside the source tree.', 500)
  return { root: rootReal, ephemeral: false }
}

function transaction(database, action) {
  database.exec('BEGIN IMMEDIATE')
  try {
    const result = action()
    database.exec('COMMIT')
    return result
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  }
}

function insertImmutable(database, sql, ...values) {
  return transaction(database, () => database.prepare(sql).run(...values))
}

function parseEncoded(value, schema, label) {
  const text = Buffer.from(value).toString('utf8')
  const parsed = JSON.parse(text)
  if (canonicalJson(parsed) !== text) throw new ChallengeVerificationError(`${label} is not canonical JSON.`)
  return schema ? schema.parse(parsed) : parsed
}

function encoded(value) {
  return Buffer.from(canonicalJson(value))
}

function sameCanonical(left, right) {
  return canonicalJson(left) === canonicalJson(right)
}

function artifactRefs(artifacts) {
  return ChallengeArtifactRefsSchema.parse(Object.fromEntries(Object.entries(artifacts).map(([name, item]) => [name, { kind: item.kind, digest: item.digest, bytes: item.bytes }])))
}

function evaluateChallenge(frozen, disclosure, artifacts) {
  const endpointDiagnostics = artifacts.diagnostics.content.diagnostics.endpoint_diagnostics
  return {
    endpointDiagnostics,
    submission: buildResultSubmission(frozen, disclosure, artifacts),
    independent: independentlyScoreChallenge(frozen, disclosure, endpointDiagnostics)
  }
}

function commitmentResponse(row) {
  return {
    frozenCommitment: parseEncoded(row.frozen_commitment, ChallengeCommitmentRequestSchema, 'Stored Goal 13 commitment'),
    receipt: parseEncoded(row.receipt, ChallengeCommitmentResponseSchema, 'Stored Goal 13 commitment receipt'),
    artifacts: parseEncoded(row.artifact_refs, ChallengeArtifactRefsSchema, 'Stored Goal 13 artifact references')
  }
}

export async function createChallengeService(options = {}) {
  const env = options.env ?? process.env
  const selectedRoot = await selectRoot(options, env)
  const database = openChallengeDatabase(selectedRoot.root)
  const objects = await createDataPlaneObjectStore(selectedRoot.root, options.objectHooks)
  const client = options.client ?? createChallengeClient(env.NODE_ENV === 'test' ? {
    ...env,
    BIOCHEMICAL_CHALLENGE_ALLOWED_ORIGIN: env.BIOCHEMICAL_CHALLENGE_ALLOWED_ORIGIN ?? 'http://127.0.0.1:5173',
    BIOCHEMICAL_CHALLENGE_CSRF_TOKEN: env.BIOCHEMICAL_CHALLENGE_CSRF_TOKEN ?? TEST_TOKEN
  } : env, options.clientOptions)
  const now = options.now ?? (() => new Date().toISOString())
  const buildArtifacts = options.buildArtifacts ?? buildChallengeArtifacts
  let bundle = null
  let state = 'empty'
  let integrityState = 'empty'
  let lastError = null
  let closed = false
  let storageTail = Promise.resolve()

  function withStorage(action) {
    const result = storageTail.then(action, action)
    storageTail = result.catch(() => {})
    return result
  }

  function epochNow() {
    return new Date(now()).toISOString().slice(0, 19) + 'Z'
  }

  function requireReady() {
    if (closed) throw new ChallengeRequestError('CHALLENGE_CLOSED', 'Goal 13 service is closed.', 503)
    if (state !== 'ready' || integrityState !== 'valid' || !bundle) throw new ChallengeRequestError('CHALLENGE_NOT_READY', 'Goal 13 public release is not synchronized and verified.', 409)
  }

  async function registerObject(value, kind, createdAt = now()) {
    const bytes = encoded(value)
    const stored = await objects.put(bytes)
    transaction(database, () => {
      database.prepare('INSERT OR IGNORE INTO objects VALUES (?,?,?)').run(stored.digest, stored.bytes, createdAt)
      database.prepare('INSERT OR IGNORE INTO artifacts VALUES (?,?,?,?)').run(stored.digest, kind, stored.bytes, createdAt)
      const row = database.prepare('SELECT kind,bytes FROM artifacts WHERE digest=?').get(stored.digest)
      if (!row || row.kind !== kind || row.bytes !== stored.bytes) throw new ChallengeVerificationError(`Goal 13 artifact ${stored.digest} conflicts with immutable storage.`)
    })
    return { kind, digest: stored.digest, bytes: stored.bytes, content: value }
  }

  async function loadCanonicalObject(digest, bytes, schema, label) {
    const stored = bytes === undefined ? await objects.get(digest) : await objects.get(digest, bytes)
    return parseEncoded(stored, schema, label)
  }

  async function persistArtifactSet(artifacts, createdAt) {
    for (const item of Object.values(artifacts)) {
      const stored = await registerObject(item.content, item.kind, createdAt)
      if (stored.digest !== item.digest || stored.bytes !== item.bytes) throw new ChallengeVerificationError(`Goal 13 ${item.kind} artifact changed during publication.`)
    }
  }

  async function loadArtifactSet(refs) {
    const checkedRefs = ChallengeArtifactRefsSchema.parse(refs)
    const result = {}
    for (const [name, ref] of Object.entries(checkedRefs)) {
      const row = database.prepare('SELECT kind,bytes FROM artifacts WHERE digest=?').get(ref.digest)
      if (!row || row.kind !== ref.kind || row.bytes !== ref.bytes) throw new ChallengeVerificationError(`Goal 13 ${name} artifact index is invalid.`)
      const content = await loadCanonicalObject(ref.digest, ref.bytes, null, `Goal 13 ${name} artifact`)
      if (challengeDigest(content) !== ref.digest) throw new ChallengeVerificationError(`Goal 13 ${name} artifact identity is invalid.`)
      result[name] = { ...ref, content }
    }
    return result
  }

  function assertTimestampOrder(createdAt, committedAt, disclosedAt, submittedAt = null) {
    if (createdAt > committedAt || committedAt > disclosedAt || (submittedAt !== null && disclosedAt > submittedAt)) throw new ChallengeVerificationError('Goal 13 workflow timestamps do not preserve create, commit, disclose, and submit order.')
  }

  function disclosureEpoch() {
    return database.prepare('SELECT * FROM disclosure_epochs WHERE release_id=? AND partition_digest=?').get(CHALLENGE_PINS.releaseId, CHALLENGE_PINS.partitionDigest)
  }

  function buildDisclosureRequest(frozen, commitmentDigest = challengeDigest(frozen)) {
    return ChallengeDisclosureRequestSchema.parse({ disclosure_schema_version: '1.0.0', commitment_digest: commitmentDigest, frozen_commitment: frozen })
  }

  async function buildFrozenRun(intent) {
    const run        = await buildArtifacts(bundle)
    const commitment = buildChallengeCommitment(run, intent)
    return { run, commitment, commitmentDigest: challengeDigest(commitment), refs: artifactRefs(run.artifacts) }
  }

  async function loadSnapshot() {
    const row = database.prepare('SELECT * FROM snapshot WHERE singleton=1').get()
    if (!row) return
    const value = await loadCanonicalObject(row.bundle_digest, undefined, null, 'Stored Goal 13 public bundle')
    bundle = verifyChallengeBundle(value)
    if (row.release_id !== CHALLENGE_PINS.releaseId || row.release_digest !== CHALLENGE_PINS.releaseDigest || row.catalog_digest !== CHALLENGE_PINS.catalogDigest || row.trust_digest !== CHALLENGE_PINS.trustDigest || row.manifest_digest !== CHALLENGE_PINS.manifestDigest || row.envelope_digest !== CHALLENGE_PINS.envelopeDigest) throw new ChallengeVerificationError('Stored Goal 13 snapshot pins are invalid.')
  }

  async function verifyIntegrity(signal) {
    const assertActive = () => signal?.throwIfAborted()
    assertActive()
    const snapshot = database.prepare('SELECT * FROM snapshot WHERE singleton=1').get()
    if (!snapshot) {
      const counts = ['objects', 'artifacts', 'commitments', 'disclosure_epochs', 'disclosures', 'reports'].map((table) => database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count)
      if (counts.some((count) => count !== 0) || (await objects.inventory()).length !== 0) throw new ChallengeVerificationError('Empty Goal 13 state contains unbound objects or workflow rows.')
      assertActive()
      return { status: 'empty', artifacts: 0, commitments: 0, disclosureEpochs: 0, disclosures: 0, reports: 0 }
    }
    if (!bundle) await loadSnapshot()
    const rows = database.prepare('SELECT * FROM artifacts ORDER BY digest').all()
    const inventory = await objects.inventory()
    assertActive()
    const objectRows = database.prepare('SELECT digest,bytes FROM objects ORDER BY digest').all()
    if (!sameCanonical(inventory, objectRows.map((item) => item.digest)) || rows.length !== objectRows.length || rows.some((row, index) => row.digest !== objectRows[index].digest || row.bytes !== objectRows[index].bytes)) throw new ChallengeVerificationError('Goal 13 CAS and immutable artifact index differ.')
    for (const row of rows) {
      assertActive()
      const value = await loadCanonicalObject(row.digest, row.bytes, null, `Goal 13 ${row.kind} artifact`)
      if (challengeDigest(value) !== row.digest) throw new ChallengeVerificationError(`Goal 13 ${row.kind} artifact digest is invalid.`)
    }
    const referenced = new Set([snapshot.bundle_digest])
    const commitments = database.prepare('SELECT * FROM commitments ORDER BY commitment_digest').all()
    for (const row of commitments) {
      assertActive()
      const stored = commitmentResponse(row)
      if (
        challengeDigest(stored.frozenCommitment) !== row.commitment_digest || stored.receipt.commitment_digest !== row.commitment_digest || stored.frozenCommitment.nonce !== row.nonce ||
        row.release_id !== CHALLENGE_PINS.releaseId || row.partition_digest !== CHALLENGE_PINS.partitionDigest || row.model_digest !== stored.frozenCommitment.consumer_model_digest ||
        row.parameter_policy_digest !== stored.frozenCommitment.parameter_policy_digest || row.artifact_refs_digest !== challengeDigest(stored.artifacts) ||
        stored.receipt.created_at !== row.created_at || stored.receipt.committed_at !== row.committed_at || stored.receipt.partition_digest !== row.partition_digest
      ) throw new ChallengeVerificationError(`Goal 13 commitment ${row.commitment_digest} is invalid.`)
      const artifacts = await loadArtifactSet(stored.artifacts)
      verifyChallengeArtifactSemantics(artifacts, stored.frozenCommitment)
      for (const ref of Object.values(stored.artifacts)) referenced.add(ref.digest)
    }
    const epochs = database.prepare('SELECT * FROM disclosure_epochs ORDER BY release_id,partition_digest').all()
    if (epochs.length > 1) throw new ChallengeVerificationError('Goal 13 state contains more than one release/partition disclosure epoch.')
    if (epochs.length === 1) {
      const epoch = epochs[0]
      const first = commitments.find((item) => item.commitment_digest === epoch.first_commitment_digest)
      if (!first || epoch.release_id !== CHALLENGE_PINS.releaseId || epoch.partition_digest !== CHALLENGE_PINS.partitionDigest || first.committed_at > epoch.opened_at || commitments.some((item) => item.committed_at > epoch.opened_at)) throw new ChallengeVerificationError('Goal 13 disclosure epoch does not close the exact pre-existing commitment set.')
    }
    const disclosures = database.prepare('SELECT * FROM disclosures ORDER BY commitment_digest').all()
    if (disclosures.length > 0 && epochs.length !== 1) throw new ChallengeVerificationError('Goal 13 disclosures exist without a persisted release/partition epoch.')
    for (const row of disclosures) {
      assertActive()
      const commitment = database.prepare('SELECT * FROM commitments WHERE commitment_digest=?').get(row.commitment_digest)
      if (!commitment) throw new ChallengeVerificationError(`Goal 13 disclosure ${row.disclosure_digest} has no commitment.`)
      const frozen = parseEncoded(commitment.frozen_commitment, ChallengeCommitmentRequestSchema, 'Stored Goal 13 commitment')
      const response = await loadCanonicalObject(row.response_artifact_digest, undefined, ChallengeDisclosureResponseSchema, 'Stored Goal 13 disclosure')
      const request = buildDisclosureRequest(frozen, row.commitment_digest)
      verifyChallengeDisclosureClosure(bundle, response, request)
      if (response.disclosure_digest !== row.disclosure_digest || challengeDigest(request) !== row.request_digest || response.disclosed_at !== row.disclosed_at || epochs[0].opened_at > row.disclosed_at) throw new ChallengeVerificationError(`Goal 13 disclosure ${row.disclosure_digest} is invalid.`)
      assertTimestampOrder(commitment.created_at, commitment.committed_at, row.disclosed_at)
      referenced.add(row.response_artifact_digest)
    }
    const reports = database.prepare('SELECT * FROM reports ORDER BY result_digest').all()
    for (const row of reports) {
      assertActive()
      await replayReport(row.result_digest)
      referenced.add(row.report_digest)
    }
    if (!sameCanonical([...referenced].sort(), rows.map((item) => item.digest).sort())) throw new ChallengeVerificationError('Goal 13 artifact index contains an unreferenced or missing immutable object.')
    return {
      status: 'valid',
      artifacts: rows.length,
      commitments: commitments.length,
      disclosureEpochs: epochs.length,
      disclosures: disclosures.length,
      reports: reports.length
    }
  }

  async function loadReport(resultDigest) {
    const row = database.prepare('SELECT * FROM reports WHERE result_digest=?').get(resultDigest)
    if (!row) throw new ChallengeRequestError('CHALLENGE_REPORT_NOT_FOUND', 'Goal 13 report is not available.', 404)
    const report = await loadCanonicalObject(row.report_digest, undefined, null, 'Stored Goal 13 report')
    if (challengeDigest(report) !== row.report_digest || report.producer_result.result_digest !== resultDigest) throw new ChallengeVerificationError('Stored Goal 13 report identity is invalid.')
    return { row, report }
  }

  async function reportValue(resultDigest) {
    return (await loadReport(resultDigest)).report
  }

  async function replayReport(resultDigest) {
    const { row: reportRow, report } = await loadReport(resultDigest)
    const frozen = ChallengeCommitmentRequestSchema.parse(report.frozen_commitment)
    const commitmentReceipt = ChallengeCommitmentResponseSchema.parse(report.commitment_receipt)
    const disclosure = ChallengeDisclosureResponseSchema.parse(report.disclosure)
    const submission = parseEncoded(reportRow.submission, ChallengeResultSubmissionSchema, 'Stored Goal 13 result submission')
    const producerResult = ChallengeResultResponseSchema.parse(report.producer_result)
    const snapshot = database.prepare('SELECT bundle_digest FROM snapshot WHERE singleton=1').get()
    if (
      reportRow.commitment_digest !== challengeDigest(frozen) || reportRow.disclosure_digest !== disclosure.disclosure_digest || reportRow.submitted_at !== producerResult.submitted_at ||
      commitmentReceipt.commitment_digest !== reportRow.commitment_digest || commitmentReceipt.created_at !== frozen.created_at ||
      report.public_bundle_digest !== snapshot.bundle_digest || !sameCanonical(report.pins, CHALLENGE_PINS) ||
      report.lineage.public_lineage_artifact_digest !== report.artifact_refs.publicLineage.digest || report.lineage.concentration_mapping_artifact_digest !== report.artifact_refs.concentrationMapping.digest
    ) throw new ChallengeVerificationError('Stored Goal 13 report lineage, snapshot, or workflow identity is invalid.')
    const disclosureRequest = buildDisclosureRequest(frozen)
    const disclosureVerification = verifyChallengeDisclosureClosure(bundle, disclosure, disclosureRequest).verification
    const storedArtifacts = await loadArtifactSet(report.artifact_refs)
    verifyChallengeArtifactSemantics(storedArtifacts, frozen)
    const rerun = await buildFrozenRun({ nonce: frozen.nonce, createdAt: frozen.created_at })
    if (!sameCanonical(rerun.refs, report.artifact_refs)) throw new ChallengeVerificationError('Goal 13 replay artifact references drifted from the frozen execution.')
    for (const [name, artifact] of Object.entries(rerun.run.artifacts)) {
      if (!sameCanonical(artifact.content, storedArtifacts[name].content)) throw new ChallengeVerificationError(`Goal 13 replay ${name} artifact bytes drifted from the frozen execution.`)
    }
    if (!sameCanonical(rerun.commitment, frozen)) throw new ChallengeVerificationError('Goal 13 replay commitment drifted from the frozen execution.')
    const evaluation = evaluateChallenge(frozen, disclosure, rerun.run.artifacts)
    if (reportRow.submission_digest !== challengeDigest(submission) || !sameCanonical(submission, report.submission) || !sameCanonical(evaluation.submission, submission)) throw new ChallengeVerificationError('Goal 13 replay result submission drifted from the exact stored submission.')
    assertTimestampOrder(frozen.created_at, commitmentReceipt.committed_at, disclosure.disclosed_at, producerResult.submitted_at)
    verifyChallengeResult(producerResult, submission)
    verifyProducerScoring(producerResult, evaluation.independent)
    if (
      !sameCanonical(evaluation.independent, report.independent_scoring) || !sameCanonical(disclosureVerification, report.disclosure_verification) ||
      !sameCanonical(evaluation.endpointDiagnostics, report.endpoint_diagnostics) || !sameCanonical(rerun.run.artifacts.diagnostics.content.diagnostics.availability, report.availability)
    ) throw new ChallengeVerificationError('Stored Goal 13 disclosure, diagnostics, availability, or scoring replay changed.')
    return { verification: 'pass', network_access: false, rerun: { artifactRefs: rerun.refs, conclusion: evaluation.independent.conclusion }, report }
  }

  try {
    await loadSnapshot()
    if (bundle) {
      state = 'verifying'
      integrityState = 'verifying'
      await verifyIntegrity()
      state = 'ready'
      integrityState = 'valid'
    } else {
      await verifyIntegrity()
    }
  } catch (error) {
    state = 'failed'
    integrityState = 'failed'
    lastError = error instanceof Error ? error.message : String(error)
  }

  return {
    discovery() {
      return {
        contractVersion: '1.0.0',
        mode: 'inference-owned-goal13-consumer',
        pins: CHALLENGE_PINS,
        status: this.status(),
        claims: ['failed', 'not-evaluable', 'supported-within-boundary'],
        routes: {
          status: '/api/v11/challenge/status', sync: '/api/v11/challenge/sync', commitments: '/api/v11/challenge/commitments',
          runs: '/api/v11/challenge/runs', disclose: '/api/v11/challenge/commitments/{commitmentDigest}/disclose',
          report: '/api/v11/challenge/reports/{resultDigest}', replay: '/api/v11/challenge/reports/{resultDigest}/replay',
          artifact: '/api/v11/challenge/artifacts/{artifactDigest}', integrity: '/api/v11/challenge/integrity'
        }
      }
    },
    status() {
      const epoch = disclosureEpoch()
      return { state, integrity: integrityState, releaseId: bundle?.releaseResponse.release.id ?? null, disclosureEpoch: epoch ? { openedAt: epoch.opened_at, firstCommitmentDigest: epoch.first_commitment_digest } : null, lastError: lastError ? 'Goal 13 state verification failed.' : null }
    },
    sync(signal) {
      return withStorage(async () => {
        try {
          if (state === 'ready') return this.status()
          if (database.prepare('SELECT COUNT(*) AS count FROM snapshot').get().count !== 0) throw new ChallengeVerificationError('Existing Goal 13 snapshot failed integrity and cannot be overwritten by synchronization.')
          const synchronized = verifyChallengeBundle(await client.synchronize(signal))
          const snapshotArtifact = await registerObject(synchronized, 'release-snapshot')
          insertImmutable(database, 'INSERT INTO snapshot VALUES (1,?,?,?,?,?,?,?,?)',
            CHALLENGE_PINS.releaseId, CHALLENGE_PINS.releaseDigest, CHALLENGE_PINS.catalogDigest, CHALLENGE_PINS.trustDigest,
            CHALLENGE_PINS.manifestDigest, CHALLENGE_PINS.envelopeDigest, snapshotArtifact.digest, epochNow())
          bundle = synchronized
          state = 'verifying'
          integrityState = 'verifying'
          await verifyIntegrity()
          state = 'ready'
          integrityState = 'valid'
          lastError = null
          return this.status()
        } catch (error) {
          state = 'failed'
          integrityState = 'failed'
          lastError = error instanceof Error ? error.message : String(error)
          throw error
        }
      })
    },
    prepare(input, signal) {
      return withStorage(async () => {
        requireReady()
        const intent = ChallengeFreezeIntentSchema.parse(input)
        const existing = database.prepare('SELECT * FROM commitments WHERE nonce=?').get(intent.nonce)
        if (!existing && disclosureEpoch()) throw new ChallengeRequestError('CHALLENGE_DISCLOSURE_EPOCH_CLOSED', 'Goal 13 held-out disclosure epoch is open; new commitments for this release and partition are forbidden.', 409)
        const frozen = await buildFrozenRun(intent)
        verifyChallengeArtifactSemantics(frozen.run.artifacts, frozen.commitment)
        if (existing) {
          let stored
          try {
            stored = commitmentResponse(existing)
          } catch (error) {
            throw new ChallengeRequestError('CHALLENGE_COMMITMENT_MUTATED', 'Goal 13 model or policy changed under an existing commitment nonce.', 409)
          }
          if (existing.commitment_digest !== frozen.commitmentDigest || !sameCanonical(stored.frozenCommitment, frozen.commitment) || !sameCanonical(stored.artifacts, frozen.refs)) throw new ChallengeRequestError('CHALLENGE_COMMITMENT_MUTATED', 'Goal 13 model or policy changed under an existing commitment nonce.', 409)
          return stored
        }
        const receipt = ChallengeCommitmentResponseSchema.parse(await client.commit(frozen.commitment, signal))
        if (receipt.commitment_digest !== frozen.commitmentDigest || receipt.created_at !== frozen.commitment.created_at || receipt.partition_digest !== frozen.commitment.partition_digest) throw new ChallengeVerificationError('Goal 13 producer commitment receipt differs from the frozen consumer identity.')
        if (receipt.created_at > receipt.committed_at) throw new ChallengeVerificationError('Goal 13 producer commitment timestamp precedes the frozen creation time.')
        await persistArtifactSet(frozen.run.artifacts, intent.createdAt)
        insertImmutable(database, 'INSERT INTO commitments VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
          frozen.commitmentDigest, intent.nonce, CHALLENGE_PINS.releaseId, CHALLENGE_PINS.partitionDigest, frozen.commitment.consumer_model_digest,
          frozen.commitment.parameter_policy_digest, challengeDigest(frozen.refs), encoded(frozen.commitment), encoded(frozen.refs), encoded(receipt), intent.createdAt, receipt.committed_at)
        return { frozenCommitment: frozen.commitment, receipt, artifacts: frozen.refs }
      })
    },
    disclose(input, signal) {
      return withStorage(async () => {
        requireReady()
        const intent = ChallengeDisclosureIntentSchema.parse(input)
        const existingReport = database.prepare('SELECT result_digest FROM reports WHERE commitment_digest=?').get(intent.commitmentDigest)
        if (existingReport) return (await replayReport(existingReport.result_digest)).report
        const row = database.prepare('SELECT * FROM commitments WHERE commitment_digest=?').get(intent.commitmentDigest)
        if (!row) throw new ChallengeRequestError('CHALLENGE_COMMITMENT_NOT_FOUND', 'Goal 13 commitment is not available.', 404)
        const stored = commitmentResponse(row)
        const rebuilt = await buildFrozenRun({ nonce: stored.frozenCommitment.nonce, createdAt: stored.frozenCommitment.created_at })
        if (!sameCanonical(rebuilt.commitment, stored.frozenCommitment) || !sameCanonical(rebuilt.refs, stored.artifacts)) throw new ChallengeRequestError('CHALLENGE_COMMITMENT_MUTATED', 'Goal 13 model or policy changed after commitment; disclosure is refused.', 409)
        verifyChallengeArtifactSemantics(rebuilt.run.artifacts, stored.frozenCommitment)
        const disclosureRequest = buildDisclosureRequest(stored.frozenCommitment, intent.commitmentDigest)
        let disclosure
        let disclosureVerification
        const disclosureRow = database.prepare('SELECT * FROM disclosures WHERE commitment_digest=?').get(intent.commitmentDigest)
        if (disclosureRow) {
          disclosure = await loadCanonicalObject(disclosureRow.response_artifact_digest, undefined, ChallengeDisclosureResponseSchema, 'Stored Goal 13 disclosure')
          disclosureVerification = verifyChallengeDisclosureClosure(bundle, disclosure, disclosureRequest).verification
          if (disclosureRow.disclosure_digest !== disclosure.disclosure_digest || disclosureRow.request_digest !== challengeDigest(disclosureRequest)) throw new ChallengeVerificationError('Stored Goal 13 disclosure row does not bind its exact request and response.')
        } else {
          const epoch = disclosureEpoch()
          if (epoch && row.committed_at > epoch.opened_at) throw new ChallengeRequestError('CHALLENGE_DISCLOSURE_EPOCH_CLOSED', 'Goal 13 commitment was not present before the held-out disclosure epoch.', 409)
          if (!epoch) insertImmutable(database, 'INSERT INTO disclosure_epochs VALUES (?,?,?,?)', CHALLENGE_PINS.releaseId, CHALLENGE_PINS.partitionDigest, epochNow(), intent.commitmentDigest)
          disclosure = ChallengeDisclosureResponseSchema.parse(await client.disclose(disclosureRequest, signal, bundle))
          disclosureVerification = verifyChallengeDisclosureClosure(bundle, disclosure, disclosureRequest).verification
          if (disclosureEpoch().opened_at > disclosure.disclosed_at) throw new ChallengeVerificationError('Goal 13 producer disclosed_at precedes the persisted disclosure epoch.')
          const disclosureArtifact = await registerObject(disclosure, 'disclosure', disclosure.disclosed_at)
          insertImmutable(database, 'INSERT INTO disclosures VALUES (?,?,?,?,?)',
            intent.commitmentDigest, disclosure.disclosure_digest, challengeDigest(disclosureRequest), disclosureArtifact.digest, disclosure.disclosed_at)
        }
        const evaluation     = evaluateChallenge(stored.frozenCommitment, disclosure, rebuilt.run.artifacts)
        const producerResult = ChallengeResultResponseSchema.parse(await client.submitResult(evaluation.submission, signal))
        verifyChallengeResult(producerResult, evaluation.submission)
        verifyProducerScoring(producerResult, evaluation.independent)
        const report = {
          report_schema_version: '1.0.0',
          scientific_boundary: 'aggregate parent-APAP Cmax for the two frozen oral formulations and exact published sampling grid only',
          pins: CHALLENGE_PINS,
          public_bundle_digest: database.prepare('SELECT bundle_digest FROM snapshot WHERE singleton=1').get().bundle_digest,
          artifact_refs: stored.artifacts,
          frozen_commitment: stored.frozenCommitment,
          commitment_receipt: stored.receipt,
          disclosure,
          disclosure_verification: disclosureVerification,
          endpoint_diagnostics: evaluation.endpointDiagnostics,
          submission: evaluation.submission,
          independent_scoring: evaluation.independent,
          producer_result: producerResult,
          not_evaluable: bundle.records.not_evaluable,
          availability: rebuilt.run.artifacts.diagnostics.content.diagnostics.availability,
          lineage: {
            release_id: CHALLENGE_RELEASE_ID,
            release_digest: CHALLENGE_PINS.releaseDigest,
            partition_id: stored.frozenCommitment.partition_id,
            partition_digest: stored.frozenCommitment.partition_digest,
            public_lineage_artifact_digest: stored.artifacts.publicLineage.digest,
            concentration_mapping_artifact_digest: stored.artifacts.concentrationMapping.digest,
            committed_at: stored.receipt.committed_at,
            disclosed_at: disclosure.disclosed_at,
            submitted_at: producerResult.submitted_at
          }
        }
        assertTimestampOrder(stored.frozenCommitment.created_at, stored.receipt.committed_at, disclosure.disclosed_at, producerResult.submitted_at)
        const reportArtifact = await registerObject(report, 'report', producerResult.submitted_at)
        insertImmutable(database, 'INSERT INTO reports VALUES (?,?,?,?,?,?,?)',
          producerResult.result_digest, intent.commitmentDigest, disclosure.disclosure_digest, challengeDigest(evaluation.submission), encoded(evaluation.submission), reportArtifact.digest, producerResult.submitted_at)
        return report
      })
    },
    listRuns(limit = 20) {
      requireReady()
      return {
        items: database.prepare(`
          SELECT c.commitment_digest,c.nonce,c.created_at,c.committed_at,d.disclosure_digest,d.disclosed_at,r.result_digest,r.submitted_at
          FROM commitments c LEFT JOIN disclosures d USING (commitment_digest) LEFT JOIN reports r USING (commitment_digest)
          ORDER BY c.committed_at DESC,c.commitment_digest LIMIT ?
        `).all(limit),
        limit
      }
    },
    report(resultDigest) {
      requireReady()
      return reportValue(resultDigest)
    },
    replay(resultDigest) {
      requireReady()
      return replayReport(resultDigest)
    },
    async artifact(digest) {
      requireReady()
      const row = database.prepare('SELECT kind,bytes FROM artifacts WHERE digest=?').get(digest)
      if (!row || !PUBLIC_ARTIFACT_KINDS.has(row.kind)) throw new ChallengeRequestError('CHALLENGE_ARTIFACT_NOT_FOUND', 'Goal 13 public report artifact is not available.', 404)
      return { artifactDigest: digest, kind: row.kind, bytes: row.bytes, content: await loadCanonicalObject(digest, row.bytes, null, `Goal 13 ${row.kind} artifact`) }
    },
    integrity(signal) {
      return withStorage(async () => {
        try {
          const result = await verifyIntegrity(signal)
          integrityState = result.status === 'empty' ? 'empty' : 'valid'
          return result
        } catch (error) {
          if (signal?.aborted) throw signal.reason
          integrityState = 'failed'
          state = 'failed'
          lastError = error instanceof Error ? error.message : String(error)
          return { status: 'failed', findings: [lastError] }
        }
      })
    },
    async close() {
      if (closed) return
      closed = true
      await storageTail
      database.close()
      if (selectedRoot.ephemeral) await rm(selectedRoot.root, { recursive: true, force: true })
    },
    ...(options.exposeTesting ? { testing: { database, objects, client, get bundle() { return bundle } } } : {})
  }
}
