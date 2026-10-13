import { rm } from 'node:fs/promises'
import { canonicalJson } from '../../shared/canonical-json.js'
import {
  CalibrationArtifactSchema,
  CommitmentResponseSchema,
  ConsumerArtifactContentSchema,
  ConsumerCommitmentSchema,
  EvaluationRequestSchema,
  FreezeIntentSchema,
  FreezeResponseSchema,
  FrozenArtifactRefsSchema,
  MEASURED_API_VIEW_SPECS,
  MEASURED_CATALOG_DIGEST,
  MEASURED_ENVELOPE_DIGEST,
  MEASURED_HELDOUT_PARTITION_DIGEST,
  MEASURED_HELDOUT_PARTITION_ID,
  MEASURED_MANIFEST_DIGEST,
  MEASURED_PAGE_SCHEMAS,
  MEASURED_PINS,
  MEASURED_RELEASE_DIGEST,
  MEASURED_RELEASE_ID,
  MEASURED_SELECTED_LINEAGE_IDS,
  MEASURED_SIGNER_KEY_ID,
  MEASURED_TRUST_DIGEST,
  MeasuredLineageSchema
} from '../../shared/measured-contracts.js'
import { createDataPlaneObjectStore } from '../data-plane/object-store.js'
import { canonicalSha256Hex, sha256Hex } from '../commons/digest.js'
import { decodeCursor as verifyCursor, decodeSecret, encodeCursor } from '../commons/cursor.js'
import { defineRequestError } from '../commons/errors.js'
import { isoNow as now } from '../commons/clock.js'
import { transaction } from '../commons/sqlite.js'
import { selectStorageRoot, testRootParent } from '../commons/storage.js'
import { createMeasuredClient, validateMeasuredProtectedConfig } from './client.js'
import { runMeasuredCalibration } from './calibration.js'
import { openMeasuredDatabase } from './database.js'
import { clearMeasuredJournal, recoverMeasuredJournal, writeMeasuredJournal } from './journal.js'
import {
  MeasuredVerificationError,
  verifyMeasuredCatalog,
  verifyMeasuredDiscovery,
  verifyMeasuredEnvelope,
  verifyMeasuredRelease,
  verifyMeasuredSignedViews,
  verifyMeasuredTrust
} from './verification.js'

const EXPECTED_RECORDS = 1669
const EXPECTED_LINEAGES = 35
const TEST_SECRET = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
const FORBIDDEN_HELDOUT_IDENTIFIERS = [
  'measurement:zenodo7648975:c:gsh', 'measurement:zenodo7648975:d200:gsh', 'measurement:zenodo7648975:d250:gsh',
  'measurement:zenodo7648975:prc-d200:gsh', 'measurement:zenodo7648975:prc-d250:gsh', 'measurement:zenodo7648975:prc:gsh',
  'uncertainty:zenodo7648975:c:gsh', 'uncertainty:zenodo7648975:d200:gsh', 'uncertainty:zenodo7648975:d250:gsh',
  'uncertainty:zenodo7648975:prc-d200:gsh', 'uncertainty:zenodo7648975:prc-d250:gsh', 'uncertainty:zenodo7648975:prc:gsh'
]
const FORBIDDEN_HELDOUT_VALUES = ['2.63', '2.74', '2.700', '2.57', '2.49', '2.47'].map((value) => `"reported_value":"${value}"`)

export const MeasuredRequestError = defineRequestError('MeasuredRequestError', 422)

const rootInSource = () => new MeasuredRequestError('MEASURED_ROOT_IN_SOURCE', 'Measured storage root must be outside the source tree.', 500)

function selectRoot(options, env) {
  return selectStorageRoot({
    configured: options.root ?? env.BIOCHEMICAL_MEASURED_ROOT,
    test: env.NODE_ENV === 'test' ? { parent: testRootParent(env.BIOCHEMICAL_TEST_MEASURED_ROOT), prefix: 'measured-' } : null,
    defaultName: 'measured-commons-v2',
    secure: true,
    inSourceError: rootInSource
  })
}

function cursorSecret(env) {
  const value = env.BIOCHEMICAL_MEASURED_CURSOR_SECRET ?? (env.NODE_ENV === 'test' ? TEST_SECRET : undefined)
  return decodeSecret(value, (reason) => {
    throw new MeasuredRequestError('MEASURED_CURSOR_SECRET_INVALID', reason === 'shape' ? 'BIOCHEMICAL_MEASURED_CURSOR_SECRET must be canonical unpadded base64url for 32 bytes.' : 'BIOCHEMICAL_MEASURED_CURSOR_SECRET is not canonical base64url.', 500)
  })
}

const decodeCursor = (value, secret) => verifyCursor(value, secret, () => {
  throw new MeasuredRequestError('MEASURED_CURSOR_INVALID', 'Measured local cursor is invalid or tampered.')
})

function parseEncoded(row, schema, label, field = 'encoded') {
  const text = Buffer.from(row[field]).toString('utf8')
  const value = JSON.parse(text)
  if (canonicalJson(value) !== text) throw new MeasuredVerificationError(`${label} is not canonical JSON.`)
  return schema.parse(value)
}

function containsHeldoutOutcome(value) {
  const text = Buffer.isBuffer(value) ? value.toString('utf8') : String(value)
  return [...FORBIDDEN_HELDOUT_IDENTIFIERS, ...FORBIDDEN_HELDOUT_VALUES].some((fragment) => text.includes(fragment))
}

function artifactResponse(content, digest) {
  return CalibrationArtifactSchema.parse({ ...content, artifactDigest: digest })
}

export async function createMeasuredService(options = {}) {
  const env = options.env ?? process.env
  validateMeasuredProtectedConfig(env)
  const selectedRoot = await selectRoot(options, env)
  const secret = cursorSecret(env)
  const database = openMeasuredDatabase(selectedRoot.root)
  const objects = await createDataPlaneObjectStore(selectedRoot.root, options.objectHooks)
  const upstream = options.client ?? (options.clientFactory ?? ((clientOptions) => createMeasuredClient(env, clientOptions)))(options.clientOptions)
  const hooks = options.hooks ?? {}
  let lifecycle = 'empty'
  let integrityState = 'empty'
  let lastSyncAt = null
  let lastError = null
  let syncController
  let syncGeneration = 0
  let closed = false
  let storageTail = Promise.resolve()
  const active = new Set()

  function track(promise) {
    active.add(promise)
    promise.finally(() => active.delete(promise)).catch(() => {})
    return promise
  }

  function withStorage(action) {
    const result = storageTail.then(action, action)
    storageTail = result.catch(() => {})
    return result
  }

  const snapshot = () => database.prepare('SELECT * FROM snapshot WHERE singleton=1').get()
  const objectBytes = async (digest, assertOwner = () => {}) => {
    const row = database.prepare('SELECT bytes FROM objects WHERE digest=?').get(digest)
    if (!row) throw new MeasuredVerificationError(`Measured object ${digest} is not indexed.`)
    const bytes = await objects.get(digest, row.bytes)
    assertOwner()
    return bytes
  }

  async function loadArtifact(digest, expectedKind, assertOwner = () => {}) {
    const row = database.prepare('SELECT * FROM immutable_artifacts WHERE digest=?').get(digest)
    if (!row || row.kind !== expectedKind || row.object_digest !== digest) throw new MeasuredRequestError('MEASURED_ARTIFACT_NOT_FOUND', `Immutable ${expectedKind} artifact ${digest} is not available.`, 404)
    const bytes = await objectBytes(digest, assertOwner)
    if (bytes.length !== row.bytes || sha256Hex(bytes) !== digest) throw new MeasuredVerificationError(`Immutable ${expectedKind} artifact ${digest} failed CAS verification.`)
    if (expectedKind === 'calibration') return artifactResponse(parseEncoded({ encoded: bytes }, CalibrationArtifactSchema.omit({ artifactDigest: true }), `Calibration artifact ${digest}`), digest)
    const content = parseEncoded({ encoded: bytes }, ConsumerArtifactContentSchema, `Immutable ${expectedKind} artifact ${digest}`)
    if (content.artifactKind !== expectedKind) throw new MeasuredVerificationError(`Immutable artifact ${digest} content kind does not match its index.`)
    return content
  }

  async function scanIntegrity(assertOwner = () => {}) {
    const findings = []
    try {
      const sqlite = database.prepare('PRAGMA integrity_check').all()
      if (sqlite.length !== 1 || sqlite[0].integrity_check !== 'ok' || database.prepare('PRAGMA foreign_key_check').all().length) throw new MeasuredVerificationError('Measured SQLite integrity checks failed.')
      const row = snapshot()
      const recordRows = database.prepare('SELECT * FROM records ORDER BY record_type,id').all()
      const lineageRows = database.prepare('SELECT * FROM lineages ORDER BY measurement_id').all()
      const objectRows = database.prepare('SELECT * FROM objects ORDER BY digest').all()
      const artifactRows = database.prepare('SELECT * FROM immutable_artifacts ORDER BY digest').all()
      const freezeRows = database.prepare('SELECT * FROM freezes ORDER BY commitment_digest').all()
      const disclosureRows = database.prepare('SELECT * FROM disclosures ORDER BY commitment_digest').all()
      if (!row) {
        if (recordRows.length || lineageRows.length || objectRows.length || artifactRows.length || freezeRows.length || disclosureRows.length || database.prepare('SELECT COUNT(*) AS count FROM sync_objects').get().count) throw new MeasuredVerificationError('Empty measured state contains extra rows.')
        const inventory = await objects.inventory()
        assertOwner()
        if (inventory.length) throw new MeasuredVerificationError('Empty measured CAS contains unindexed files.')
        return { status: 'valid', records: 0, objects: 0, findings: [] }
      }
      if (row.release_id !== MEASURED_RELEASE_ID || row.release_digest !== MEASURED_RELEASE_DIGEST || row.catalog_digest !== MEASURED_CATALOG_DIGEST || row.trust_digest !== MEASURED_TRUST_DIGEST || row.manifest_digest !== MEASURED_MANIFEST_DIGEST || row.envelope_digest !== MEASURED_ENVELOPE_DIGEST || row.signer_key_id !== MEASURED_SIGNER_KEY_ID) throw new MeasuredVerificationError('Measured snapshot pins do not match the independent v1.0.1 closure.')
      const syncRows = database.prepare('SELECT * FROM sync_objects ORDER BY path').all()
      const byPath = new Map(syncRows.map((item) => [item.path, item.digest]))
      const required = ['/api/measured/v1', '/api/measured/v1/trust', '/api/measured/v1/releases', `/api/measured/v1/releases/${MEASURED_RELEASE_ID}`, `/api/measured/v1/releases/${MEASURED_RELEASE_ID}/envelope`]
      if (required.some((path) => !byPath.has(path))) throw new MeasuredVerificationError('Measured signed metadata response closure is incomplete.')
      const discovery = verifyMeasuredDiscovery(await objectBytes(byPath.get(required[0]), assertOwner))
      const trust = verifyMeasuredTrust(await objectBytes(byPath.get(required[1]), assertOwner))
      const catalogBytes = await objectBytes(byPath.get(required[2]), assertOwner)
      const { entry } = verifyMeasuredCatalog(catalogBytes, trust.trust)
      if (discovery.catalog_digest !== sha256Hex(catalogBytes)) throw new MeasuredVerificationError('Stored measured discovery and catalog disagree.')
      const release = verifyMeasuredRelease(await objectBytes(byPath.get(required[3]), assertOwner), entry)
      const envelope = verifyMeasuredEnvelope(await objectBytes(byPath.get(required[4]), assertOwner), entry, release.manifest, trust.trust)
      if (envelope.envelope.signature.signed_at !== row.signed_at) throw new MeasuredVerificationError('Stored measured signer time changed.')
      if (recordRows.length !== EXPECTED_RECORDS || lineageRows.length !== EXPECTED_LINEAGES) throw new MeasuredVerificationError('Measured local record or selected-lineage count is incomplete.')
      const records = Object.fromEntries(Object.keys(MEASURED_PAGE_SCHEMAS).map((type) => [type, []]))
      for (const record of recordRows) {
        const schema = MEASURED_PAGE_SCHEMAS[record.record_type]
        const value = parseEncoded(record, schema, `Measured ${record.record_type}/${record.id}`)
        if (value.id !== record.id || (value.role ?? null) !== record.role) throw new MeasuredVerificationError(`Measured record index mismatch for ${record.id}.`)
        if (['measurements', 'missingness'].includes(record.record_type) && !['development', 'calibration'].includes(value.role)) throw new MeasuredVerificationError('Heldout outcome is present in measured local state.')
        if (containsHeldoutOutcome(record.encoded)) throw new MeasuredVerificationError('Heldout outcome identity is present in measured SQLite records.')
        records[record.record_type].push(value)
      }
      const lineages = new Map()
      for (const lineage of lineageRows) {
        const value = parseEncoded(lineage, MeasuredLineageSchema, `Measured lineage ${lineage.measurement_id}`)
        if (value.measurement.id !== lineage.measurement_id || value.measurement.role !== lineage.role || canonicalSha256Hex(value) !== lineage.digest || containsHeldoutOutcome(lineage.encoded)) throw new MeasuredVerificationError(`Measured lineage index mismatch or heldout leakage for ${lineage.measurement_id}.`)
        lineages.set(lineage.measurement_id, { value, digest: lineage.digest })
      }
      const traversals = new Map(MEASURED_API_VIEW_SPECS.map((spec) => [spec.viewId, records[spec.recordType].filter((item) => Object.entries(spec.query).filter(([, value]) => value !== null).every(([key, value]) => item[key] === value))]))
      verifyMeasuredSignedViews(release.manifest, traversals, lineages)
      for (const artifact of artifactRows) {
        const bytes = await objectBytes(artifact.digest, assertOwner)
        if (artifact.object_digest !== artifact.digest || artifact.bytes !== bytes.length || sha256Hex(bytes) !== artifact.digest || containsHeldoutOutcome(bytes)) throw new MeasuredVerificationError(`Immutable artifact ${artifact.digest} has invalid CAS identity or heldout leakage.`)
        if (artifact.kind === 'calibration') artifactResponse(parseEncoded({ encoded: bytes }, CalibrationArtifactSchema.omit({ artifactDigest: true }), `Calibration artifact ${artifact.digest}`), artifact.digest)
        else {
          const content = parseEncoded({ encoded: bytes }, ConsumerArtifactContentSchema, `Immutable ${artifact.kind} artifact ${artifact.digest}`)
          if (content.artifactKind !== artifact.kind) throw new MeasuredVerificationError(`Immutable artifact ${artifact.digest} content kind does not match its index.`)
        }
      }
      for (const freeze of freezeRows) {
        const frozen = parseEncoded(freeze, ConsumerCommitmentSchema, `Frozen request ${freeze.commitment_digest}`, 'frozen_request')
        const refs = parseEncoded(freeze, FrozenArtifactRefsSchema, `Frozen artifact references ${freeze.commitment_digest}`, 'artifact_refs')
        if (frozen.model_digest !== refs.model.digest || frozen.parameter_policy_digest !== refs.parameterPolicy.digest || frozen.endpoint_mapping_digest !== refs.endpointMapping.digest || frozen.metric_threshold_policy_digest !== refs.metricThresholdPolicy.digest || frozen.prediction_digest !== refs.prediction.digest) throw new MeasuredVerificationError(`Frozen request ${freeze.commitment_digest} digest fields do not match its immutable artifact references.`)
        const intent = FreezeIntentSchema.parse({ calibrationArtifactDigest: refs.model.digest, targetPartitionId: frozen.target_partition_id, nonce: frozen.nonce, createdAt: frozen.created_at })
        const receipt = parseEncoded(freeze, CommitmentResponseSchema, `Freeze receipt ${freeze.commitment_digest}`, 'receipt')
        if (freeze.nonce !== frozen.nonce || canonicalSha256Hex(frozen) !== freeze.commitment_digest || canonicalSha256Hex(intent) !== freeze.intent_digest || receipt.commitment_digest !== freeze.commitment_digest || receipt.created_at !== frozen.created_at || receipt.target_partition_digest !== frozen.target_partition_digest || containsHeldoutOutcome(freeze.frozen_request) || containsHeldoutOutcome(freeze.receipt)) throw new MeasuredVerificationError(`Frozen request ${freeze.commitment_digest} has invalid intent/receipt identity or heldout leakage.`)
        for (const ref of Object.values(refs)) {
          const indexed = artifactRows.find((artifact) => artifact.digest === ref.digest)
          if (!indexed || indexed.kind !== ref.kind || indexed.bytes !== ref.bytes) throw new MeasuredVerificationError(`Frozen request ${freeze.commitment_digest} references an invalid immutable artifact.`)
        }
        const model = await loadArtifact(refs.model.digest, 'calibration', assertOwner)
        const parameterPolicy = await loadArtifact(refs.parameterPolicy.digest, 'parameter-policy', assertOwner)
        const endpointMapping = await loadArtifact(refs.endpointMapping.digest, 'endpoint-mapping', assertOwner)
        const metricThresholdPolicy = await loadArtifact(refs.metricThresholdPolicy.digest, 'metric-threshold-policy', assertOwner)
        const prediction = await loadArtifact(refs.prediction.digest, 'prediction', assertOwner)
        if (frozen.release_id !== MEASURED_RELEASE_ID || frozen.release_digest !== MEASURED_RELEASE_DIGEST || frozen.target_partition_id !== MEASURED_HELDOUT_PARTITION_ID || frozen.target_partition_digest !== MEASURED_HELDOUT_PARTITION_DIGEST || frozen.target_partition_role !== 'external-held-out' || canonicalJson(frozen.family_ids) !== canonicalJson(['family:zenodo:7648975']) || canonicalJson(frozen.observable_ids) !== canonicalJson(['observable:renal-gsh'])) throw new MeasuredVerificationError(`Frozen request ${freeze.commitment_digest} release or heldout selection is invalid.`)
        const expectedRelease = { id: frozen.release_id, schema_version: '1.0.0', digest: frozen.release_digest }
        const expectedTarget = { closure_digest: frozen.target_partition_digest, family_ids: frozen.family_ids, id: frozen.target_partition_id, role: frozen.target_partition_role, study_ids: ['study:zenodo:7648975'] }
        if (model.artifactDigest !== refs.model.digest || model.status !== 'not-evaluable' || model.fit !== null || model.conclusion !== 'no-validation-conclusion' || canonicalJson(model.release) !== canonicalJson(expectedRelease)) throw new MeasuredVerificationError(`Frozen request ${freeze.commitment_digest} model artifact is not the exact not-evaluable calibration artifact.`)
        for (const [name, ref, content] of [['parameter policy', refs.parameterPolicy, parameterPolicy], ['endpoint mapping', refs.endpointMapping, endpointMapping], ['metric/threshold policy', refs.metricThresholdPolicy, metricThresholdPolicy], ['prediction', refs.prediction, prediction]]) {
          if (content.artifactKind !== ref.kind || content.calibrationArtifactDigest !== refs.model.digest || content.status !== 'not-evaluable' || canonicalJson(content.release) !== canonicalJson(expectedRelease) || canonicalJson(content.targetPartition) !== canonicalJson(expectedTarget)) throw new MeasuredVerificationError(`Frozen request ${freeze.commitment_digest} ${name} artifact relationship is invalid.`)
        }
        if (prediction.predictionCount !== 0 || prediction.predictions.length !== 0) throw new MeasuredVerificationError(`Frozen request ${freeze.commitment_digest} prediction artifact is not explicitly empty.`)
      }
      for (const disclosure of disclosureRows) {
        const freeze = freezeRows.find((item) => item.commitment_digest === disclosure.commitment_digest)
        if (!freeze) throw new MeasuredVerificationError('Disclosure digest state is orphaned.')
        const frozenRequest = parseEncoded(freeze, ConsumerCommitmentSchema, `Disclosure frozen request ${disclosure.commitment_digest}`, 'frozen_request')
        const evaluation = EvaluationRequestSchema.parse({ evaluation_schema_version: '1.0.0', commitment_digest: disclosure.commitment_digest, frozen_request: frozenRequest })
        if (disclosure.request_digest !== canonicalSha256Hex(evaluation)) throw new MeasuredVerificationError(`Disclosure ${disclosure.commitment_digest} request identity is invalid.`)
      }
      const referenced = new Set([...syncRows.map((item) => item.digest), ...artifactRows.map((item) => item.object_digest)])
      if (objectRows.some((item) => !referenced.has(item.digest))) throw new MeasuredVerificationError('Measured CAS index contains an unreferenced object.')
      for (const object of objectRows) {
        const bytes = await objectBytes(object.digest, assertOwner)
        if (containsHeldoutOutcome(bytes)) throw new MeasuredVerificationError('Heldout outcome identity is present in measured CAS.')
      }
      const inventory = await objects.inventory()
      assertOwner()
      if (canonicalJson(inventory) !== canonicalJson(objectRows.map((item) => item.digest))) throw new MeasuredVerificationError('Measured CAS files do not equal the object index.')
      return { status: 'valid', records: recordRows.length, objects: objectRows.length, findings: [] }
    } catch (error) {
      findings.push(error instanceof Error ? error.message : 'Unknown measured integrity failure.')
      return { status: 'failed', records: 0, objects: 0, findings }
    }
  }

  function applyIntegrity(result) {
    integrityState = result.status === 'failed' ? 'failed' : result.records ? 'valid' : 'empty'
    if (result.status === 'failed') lastError = result.findings[0] ?? 'Measured integrity failed.'
  }

  await recoverMeasuredJournal(selectedRoot.root, database, objects)
  await objects.clearStaging()
  const startup = await scanIntegrity()
  applyIntegrity(startup)
  if (startup.status === 'failed') lifecycle = 'failed'
  else if (startup.records) {
    lifecycle = 'ready'
    lastSyncAt = snapshot().synced_at
    lastError = null
  }

  function requireReady() {
    if (closed) throw new MeasuredRequestError('MEASURED_CLOSED', 'Measured service is closed.', 503)
    if (integrityState === 'failed') throw new MeasuredRequestError('MEASURED_INTEGRITY_FAILED', 'Measured local integrity failed; reads are disabled.', 503)
    const row = snapshot()
    if (!row) throw new MeasuredRequestError('MEASURED_NOT_SYNCED', 'Measured commons has not been explicitly synchronized.', 404)
    return row
  }

  async function publish(bundle, assertOwner) {
    await recoverMeasuredJournal(selectedRoot.root, database, objects)
    assertOwner()
    const existing = snapshot()
    if (existing) {
      const current = database.prepare('SELECT record_type,id,encoded FROM records ORDER BY record_type,id').all()
      const expected = Object.entries(bundle.records).flatMap(([type, values]) => values.map((record) => ({ type, record }))).sort((left, right) => left.type.localeCompare(right.type) || left.record.id.localeCompare(right.record.id))
      if (current.length !== expected.length || current.some((row, index) => row.record_type !== expected[index].type || row.id !== expected[index].record.id || Buffer.from(row.encoded).toString('utf8') !== canonicalJson(expected[index].record))) throw new MeasuredVerificationError('Explicit sync conflicts with the immutable measured local snapshot.')
      return existing.synced_at
    }
    const syncedAt = now()
    const digests = bundle.objects.map((artifact) => sha256Hex(artifact.bytes))
    await writeMeasuredJournal(selectedRoot.root, { publicationType: 'sync', objectDigests: digests })
    assertOwner()
    await hooks.afterJournal?.({ digests })
    assertOwner()
    for (let index = 0; index < bundle.objects.length; index += 1) {
      const artifact = bundle.objects[index]
      await objects.put(artifact.bytes)
      assertOwner()
      await hooks.afterObject?.({ index, artifact })
      assertOwner()
    }
    await hooks.afterCas?.({ bundle })
    assertOwner()
    transaction(database, () => {
      assertOwner()
      const insertObject = database.prepare('INSERT OR IGNORE INTO objects VALUES (?, ?, ?, ?)')
      const insertSync = database.prepare('INSERT INTO sync_objects VALUES (?, ?)')
      for (const artifact of bundle.objects) {
        const digest = sha256Hex(artifact.bytes)
        insertObject.run(digest, artifact.bytes.length, 'application/json', syncedAt)
        insertSync.run(artifact.path, digest)
      }
      database.prepare('INSERT INTO snapshot VALUES (1,?,?,?,?,?,?,?,?,?)').run(MEASURED_RELEASE_ID, MEASURED_RELEASE_DIGEST, MEASURED_CATALOG_DIGEST, MEASURED_TRUST_DIGEST, MEASURED_MANIFEST_DIGEST, MEASURED_ENVELOPE_DIGEST, bundle.envelope.signature.key_id, bundle.envelope.signature.signed_at, syncedAt)
      const insertRecord = database.prepare('INSERT INTO records VALUES (?,?,?,?)')
      for (const [type, values] of Object.entries(bundle.records)) for (const record of values) insertRecord.run(type, record.id, record.role ?? null, Buffer.from(canonicalJson(record)))
      const insertLineage = database.prepare('INSERT INTO lineages VALUES (?,?,?,?)')
      for (const [measurementId, lineage] of bundle.lineages) insertLineage.run(measurementId, lineage.value.measurement.role, lineage.digest, Buffer.from(canonicalJson(lineage.value)))
      hooks.beforeCommit?.({ database, bundle })
    })
    await hooks.afterDatabaseCommit?.({ database, bundle })
    assertOwner()
    await clearMeasuredJournal(selectedRoot.root)
    assertOwner()
    return syncedAt
  }

  async function executeSync() {
    if (closed) throw new MeasuredRequestError('MEASURED_CLOSED', 'Measured service is closed.', 503)
    if (integrityState === 'failed') throw new MeasuredRequestError('MEASURED_INTEGRITY_FAILED', 'Measured integrity must be repaired before sync.', 503)
    const generation = ++syncGeneration
    syncController?.abort(new MeasuredRequestError('MEASURED_SYNC_SUPERSEDED', 'A newer measured sync superseded this request.', 409))
    const controller = new AbortController()
    syncController = controller
    lifecycle = 'syncing'
    lastError = null
    const assertOwner = () => {
      if (generation !== syncGeneration || controller.signal.aborted || closed) throw controller.signal.reason ?? new DOMException('Measured sync was superseded.', 'AbortError')
    }
    try {
      const bundle = await upstream.synchronize(controller.signal, assertOwner)
      assertOwner()
      const result = await withStorage(async () => {
        assertOwner()
        const syncedAt = await publish(bundle, assertOwner)
        assertOwner()
        await hooks.afterPublish?.({ database, bundle })
        assertOwner()
        const integrity = await scanIntegrity(assertOwner)
        assertOwner()
        return { syncedAt, integrity }
      })
      assertOwner()
      applyIntegrity(result.integrity)
      if (result.integrity.status !== 'valid') throw new MeasuredVerificationError(result.integrity.findings[0] ?? 'Measured publication failed integrity verification.')
      lifecycle = 'ready'
      lastSyncAt = result.syncedAt
      lastError = null
      return status()
    } catch (error) {
      if (generation === syncGeneration && !closed) {
        lifecycle = 'failed'
        if (integrityState !== 'failed') lastError = error instanceof Error ? error.message : 'Measured sync failed.'
      }
      throw error
    }
  }

  function status() {
    const row = snapshot()
    return { contractVersion: '1.0.0', integrity: integrityState, lastError, lastSyncAt, release: row ? { id: row.release_id, schema_version: '1.0.0', digest: row.release_digest } : null, state: integrityState === 'failed' ? 'failed' : lifecycle }
  }

  function calibrationRepository() {
    const row = requireReady()
    const calls = { applicability: 0, calibrationMeasurements: 0, calibrationMissingness: 0, exclusions: 0, partition: 0, release: 0 }
    const rows = { calibrationMeasurements: 0, calibrationMissingness: 0, exclusions: 0 }
    const roles = new Set()
    return Object.freeze({
      release() { calls.release += 1; return { id: row.release_id, schema_version: '1.0.0', digest: row.release_digest } },
      partition(id) { calls.partition += 1; const record = database.prepare("SELECT encoded FROM records WHERE record_type='partitions' AND id=?").get(id); return record ? parseEncoded(record, MEASURED_PAGE_SCHEMAS.partitions, `Measured partition ${id}`) : null },
      applicability(studyId, observableId) { calls.applicability += 1; return database.prepare("SELECT encoded FROM records WHERE record_type='applicability' ORDER BY id").all().map((item) => parseEncoded(item, MEASURED_PAGE_SCHEMAS.applicability, 'Measured applicability')).find((item) => item.study_id === studyId && item.observable_id === observableId) },
      calibrationMeasurements(selection) {
        calls.calibrationMeasurements += 1
        const calibrationIds = MEASURED_SELECTED_LINEAGE_IDS.slice(1)
        const placeholders = calibrationIds.map(() => '?').join(',')
        const selected = database.prepare(`SELECT records.encoded,lineages.encoded AS lineage_encoded,lineages.digest FROM records JOIN lineages ON lineages.measurement_id=records.id WHERE records.record_type='measurements' AND records.role='calibration' AND records.id IN (${placeholders}) ORDER BY records.id`).all(...calibrationIds).map((item) => ({ measurement: parseEncoded(item, MEASURED_PAGE_SCHEMAS.measurements, 'Calibration measurement'), lineage: parseEncoded(item, MeasuredLineageSchema, 'Calibration lineage', 'lineage_encoded'), lineageDigest: item.digest })).filter((item) => item.measurement.family_id === selection.familyId && item.measurement.study_id === selection.studyId && item.measurement.observable_id === selection.observableId && selection.groupIds.includes(item.measurement.group_id) && item.lineage.specimen?.collection_time_value === selection.timeValue && item.lineage.specimen?.collection_time_unit === selection.timeUnit)
        rows.calibrationMeasurements += selected.length
        selected.forEach((item) => roles.add(item.measurement.role))
        return selected
      },
      calibrationMissingness(selection) {
        calls.calibrationMissingness += 1
        const selected = database.prepare("SELECT encoded FROM records WHERE record_type='missingness' AND role='calibration' AND id LIKE 'missingness:cebs0004:%:h24:alt' ORDER BY id").all().map((item) => parseEncoded(item, MEASURED_PAGE_SCHEMAS.missingness, 'Calibration missingness')).filter((item) => item.family_id === selection.familyId && item.study_id === selection.studyId && item.observable_id === selection.observableId && selection.groupIds.includes(item.group_id) && item.id.includes(`:h${selection.timeValue}:`))
        rows.calibrationMissingness += selected.length
        selected.forEach((item) => roles.add(item.role))
        return selected
      },
      exclusions() { calls.exclusions += 1; const selected = database.prepare("SELECT encoded FROM records WHERE record_type='exclusions' ORDER BY id").all().map((item) => parseEncoded(item, MEASURED_PAGE_SCHEMAS.exclusions, 'Measured exclusion')); rows.exclusions += selected.length; return selected },
      accessReport() { return { calls: { ...calls }, rows: { ...rows }, rolesObserved: [...roles].sort() } }
    })
  }

  async function storeArtifact(kind, content) {
    const bytes = Buffer.from(canonicalJson(content))
    const digest = sha256Hex(bytes)
    await recoverMeasuredJournal(selectedRoot.root, database, objects)
    const existing = database.prepare('SELECT * FROM immutable_artifacts WHERE digest=?').get(digest)
    if (existing) {
      const indexed = database.prepare('SELECT * FROM objects WHERE digest=?').get(digest)
      if (existing.kind !== kind || existing.object_digest !== digest || existing.bytes !== bytes.length || !indexed || indexed.bytes !== bytes.length || indexed.media_type !== 'application/json' || !(await objects.get(digest, bytes.length)).equals(bytes)) throw new MeasuredVerificationError(`Immutable ${kind} artifact conflicts for ${digest}.`)
      return { kind, digest, bytes: bytes.length }
    }
    await writeMeasuredJournal(selectedRoot.root, { publicationType: 'immutable-artifact', publicationId: digest, artifactKind: kind, objectDigests: [digest] })
    await hooks.afterArtifactJournal?.({ kind, digest })
    await objects.put(bytes)
    await hooks.afterArtifactCas?.({ kind, digest })
    transaction(database, () => {
      const indexed = database.prepare('SELECT * FROM objects WHERE digest=?').get(digest)
      if (indexed && (indexed.bytes !== bytes.length || indexed.media_type !== 'application/json')) throw new MeasuredVerificationError(`Measured CAS index conflicts with immutable ${kind} artifact ${digest}.`)
      database.prepare('INSERT OR IGNORE INTO objects VALUES (?,?,?,?)').run(digest, bytes.length, 'application/json', now())
      database.prepare('INSERT INTO immutable_artifacts VALUES (?,?,?,?,?)').run(digest, kind, digest, bytes.length, now())
    })
    await hooks.afterArtifactDatabaseCommit?.({ kind, digest })
    await clearMeasuredJournal(selectedRoot.root)
    return { kind, digest, bytes: bytes.length }
  }

  function compareFrozenRow(existing, expected) {
    if (existing.intent_digest !== expected.intentDigest) throw new MeasuredRequestError('MEASURED_NONCE_CONFLICT', 'Freeze nonce is already bound to a different artifact intent.', 409)
    if (!Buffer.from(existing.frozen_request).equals(expected.encodedRequest) || !Buffer.from(existing.artifact_refs).equals(expected.encodedRefs) || !Buffer.from(existing.receipt).equals(expected.encodedReceipt)) throw new MeasuredVerificationError('Exact freeze retry returned a different immutable identity.')
  }

  async function persistFreeze(expected) {
    const locate = () => database.prepare('SELECT * FROM freezes WHERE commitment_digest=? OR nonce=?').get(expected.commitmentDigest, expected.nonce)
    const existing = locate()
    if (existing) {
      compareFrozenRow(existing, expected)
      return
    }
    try {
      transaction(database, () => database.prepare('INSERT INTO freezes VALUES (?,?,?,?,?,?,?)').run(expected.commitmentDigest, expected.intentDigest, expected.nonce, expected.encodedRequest, expected.encodedRefs, expected.encodedReceipt, now()))
    } catch (error) {
      const raced = locate()
      if (!raced) throw error
      compareFrozenRow(raced, expected)
    }
  }

  async function executeFreeze(intent) {
    const row = requireReady()
    const intentDigest = canonicalSha256Hex(intent)
    const priorNonce = database.prepare('SELECT * FROM freezes WHERE nonce=?').get(intent.nonce)
    if (priorNonce && priorNonce.intent_digest !== intentDigest) throw new MeasuredRequestError('MEASURED_NONCE_CONFLICT', 'Freeze nonce is already bound to a different artifact intent.', 409)
    const assembled = await withStorage(async () => {
      const calibration = await loadArtifact(intent.calibrationArtifactDigest, 'calibration')
      if (calibration.status !== 'not-evaluable' || calibration.fit !== null || calibration.conclusion !== 'no-validation-conclusion' || calibration.release.id !== row.release_id || calibration.release.digest !== row.release_digest) throw new MeasuredRequestError('MEASURED_CALIBRATION_NOT_FREEZABLE', 'Freeze requires an immutable not-evaluable calibration artifact with no fit or validation conclusion.', 409)
      const partitionRow = database.prepare("SELECT encoded FROM records WHERE record_type='partitions' AND id=?").get(intent.targetPartitionId)
      const targetPartition = partitionRow ? parseEncoded(partitionRow, MEASURED_PAGE_SCHEMAS.partitions, 'Heldout target partition') : null
      if (!targetPartition || targetPartition.id !== MEASURED_HELDOUT_PARTITION_ID || targetPartition.closure_digest !== MEASURED_HELDOUT_PARTITION_DIGEST || targetPartition.role !== 'external-held-out' || canonicalJson(targetPartition.family_ids) !== canonicalJson(['family:zenodo:7648975']) || canonicalJson(targetPartition.study_ids) !== canonicalJson(['study:zenodo:7648975'])) throw new MeasuredRequestError('MEASURED_TARGET_INVALID', 'Freeze target is not the exact pinned heldout partition.', 409)
      const base = { artifactSchemaVersion: '1.0.0', calibrationArtifactDigest: calibration.artifactDigest, release: calibration.release, targetPartition, status: 'not-evaluable' }
      const contents = {
        parameterPolicy: ConsumerArtifactContentSchema.parse({ ...base, artifactKind: 'parameter-policy', policy: 'no-heldout-parameter-selection' }),
        endpointMapping: ConsumerArtifactContentSchema.parse({ ...base, artifactKind: 'endpoint-mapping', sourceObservableId: 'observable:renal-gsh', endpoint: 'renal-gsh-provenance-only', mapping: 'no-scoring-mapping' }),
        metricThresholdPolicy: ConsumerArtifactContentSchema.parse({ ...base, artifactKind: 'metric-threshold-policy', metric: null, threshold: null, scoring: 'none', conclusion: 'no-validation-conclusion' }),
        prediction: ConsumerArtifactContentSchema.parse({ ...base, artifactKind: 'prediction', predictionCount: 0, predictions: [], reason: 'Calibration was not evaluable; no predictions were generated.' })
      }
      const refs = FrozenArtifactRefsSchema.parse({
        model: { kind: 'calibration', digest: calibration.artifactDigest, bytes: Buffer.byteLength(canonicalJson(Object.fromEntries(Object.entries(calibration).filter(([key]) => key !== 'artifactDigest')))) },
        parameterPolicy: await storeArtifact('parameter-policy', contents.parameterPolicy),
        endpointMapping: await storeArtifact('endpoint-mapping', contents.endpointMapping),
        metricThresholdPolicy: await storeArtifact('metric-threshold-policy', contents.metricThresholdPolicy),
        prediction: await storeArtifact('prediction', contents.prediction)
      })
      await loadArtifact(refs.parameterPolicy.digest, 'parameter-policy')
      await loadArtifact(refs.endpointMapping.digest, 'endpoint-mapping')
      await loadArtifact(refs.metricThresholdPolicy.digest, 'metric-threshold-policy')
      await loadArtifact(refs.prediction.digest, 'prediction')
      const frozenRequest = ConsumerCommitmentSchema.parse({
        commitment_schema_version: '1.0.0', release_id: MEASURED_RELEASE_ID, release_digest: MEASURED_RELEASE_DIGEST,
        consumer_id: 'biochemical-inference:goal12-workbench', model_digest: refs.model.digest,
        parameter_policy_digest: refs.parameterPolicy.digest, endpoint_mapping_digest: refs.endpointMapping.digest,
        metric_threshold_policy_digest: refs.metricThresholdPolicy.digest, prediction_digest: refs.prediction.digest,
        target_partition_id: targetPartition.id, target_partition_digest: targetPartition.closure_digest, target_partition_role: targetPartition.role,
        family_ids: targetPartition.family_ids, observable_ids: ['observable:renal-gsh'], nonce: intent.nonce, created_at: intent.createdAt
      })
      return { frozenRequest, refs }
    })
    const receipt = await upstream.commit(assembled.frozenRequest)
    const commitmentDigest = canonicalSha256Hex(assembled.frozenRequest)
    if (receipt.commitment_digest !== commitmentDigest || receipt.created_at !== assembled.frozenRequest.created_at || receipt.target_partition_digest !== assembled.frozenRequest.target_partition_digest) throw new MeasuredVerificationError('Measured commitment receipt does not bind the exact frozen request.')
    const response = FreezeResponseSchema.parse({ freezeContract: 'artifact-bound-measured-freeze-v1', frozenRequest: assembled.frozenRequest, artifacts: assembled.refs, receipt })
    const encodedRequest = Buffer.from(canonicalJson(response.frozenRequest))
    const encodedRefs = Buffer.from(canonicalJson(response.artifacts))
    const encodedReceipt = Buffer.from(canonicalJson(response.receipt))
    await withStorage(() => persistFreeze({ commitmentDigest, intentDigest, nonce: intent.nonce, encodedRequest, encodedRefs, encodedReceipt }))
    return response
  }

  function compareDisclosureRow(existing, expected) {
    if (existing.request_digest !== expected.requestDigest || existing.response_digest !== expected.responseDigest || existing.disclosed_at !== expected.disclosedAt) throw new MeasuredVerificationError('Exact disclosure retry returned a different immutable identity.')
  }

  async function persistDisclosure(expected) {
    const locate = () => database.prepare('SELECT * FROM disclosures WHERE commitment_digest=?').get(expected.commitmentDigest)
    const existing = locate()
    if (existing) {
      compareDisclosureRow(existing, expected)
      return
    }
    try {
      transaction(database, () => database.prepare('INSERT INTO disclosures VALUES (?,?,?,?)').run(expected.commitmentDigest, expected.requestDigest, expected.responseDigest, expected.disclosedAt))
    } catch (error) {
      const raced = locate()
      if (!raced) throw error
      compareDisclosureRow(raced, expected)
    }
  }

  async function executeDisclosure(intent) {
    requireReady()
    const frozen = database.prepare('SELECT * FROM freezes WHERE commitment_digest=?').get(intent.commitmentDigest)
    if (!frozen) throw new MeasuredRequestError('MEASURED_FREEZE_NOT_FOUND', 'Disclosure requires an existing artifact-bound freeze.', 404)
    const frozenRequest = parseEncoded(frozen, ConsumerCommitmentSchema, 'Frozen disclosure request', 'frozen_request')
    const evaluation = EvaluationRequestSchema.parse({ evaluation_schema_version: '1.0.0', commitment_digest: intent.commitmentDigest, frozen_request: frozenRequest })
    const requestDigest = canonicalSha256Hex(evaluation)
    const response = await upstream.evaluate(evaluation)
    const responseDigest = canonicalSha256Hex(response)
    await withStorage(() => persistDisclosure({ commitmentDigest: intent.commitmentDigest, requestDigest, responseDigest, disclosedAt: response.disclosed_at }))
    return response
  }

  const service = {
    status,
    sync() { return track(executeSync()) },
    discovery() { return { contractVersion: '1.0.0', explicitSync: true, localOnlyReads: true, dataflowIsolationNotSecrecy: true, pins: MEASURED_PINS, status: status() } },
    page(recordType, query) {
      const row = requireReady()
      if (!MEASURED_PAGE_SCHEMAS[recordType]) throw new MeasuredRequestError('MEASURED_RECORD_TYPE_INVALID', `Unknown measured record type: ${recordType}.`)
      if (query.role && !['measurements', 'missingness', 'families', 'partitions'].includes(recordType)) throw new MeasuredRequestError('MEASURED_FILTER_INVALID', `Role is not a supported filter for ${recordType}.`)
      const filters = query.role ? { role: query.role } : {}
      const identity = { pageContract: 'measured-local-records-v1', releaseId: row.release_id, releaseDigest: row.release_digest, recordType, filters, sort: 'id:asc', limit: query.limit }
      let afterId = ''
      if (query.cursor) { const decoded = decodeCursor(query.cursor, secret); if (typeof decoded.afterId !== 'string' || canonicalJson(decoded) !== canonicalJson({ ...identity, afterId: decoded.afterId })) throw new MeasuredRequestError('MEASURED_CURSOR_BINDING_INVALID', 'Measured local cursor is bound to a different release, query, sort, or limit.'); afterId = decoded.afterId }
      const rows = query.role ? database.prepare('SELECT id,encoded FROM records WHERE record_type=? AND role=? AND id>? ORDER BY id LIMIT ?').all(recordType, query.role, afterId, query.limit + 1) : database.prepare('SELECT id,encoded FROM records WHERE record_type=? AND id>? ORDER BY id LIMIT ?').all(recordType, afterId, query.limit + 1)
      const selected = rows.slice(0, query.limit)
      return { pageContract: 'measured-local-records-v1', release: { id: row.release_id, schema_version: '1.0.0', digest: row.release_digest }, recordType, filters, sort: 'id:asc', limit: query.limit, items: selected.map((item) => parseEncoded(item, MEASURED_PAGE_SCHEMAS[recordType], `Measured ${recordType}/${item.id}`)), nextCursor: rows.length > query.limit ? encodeCursor({ ...identity, afterId: selected.at(-1).id }, secret) : null, source: 'verified-local-mirror' }
    },
    lineage(measurementId) { requireReady(); const row = database.prepare('SELECT encoded,digest FROM lineages WHERE measurement_id=?').get(measurementId); if (!row) throw new MeasuredRequestError('MEASURED_LINEAGE_NOT_FOUND', 'Selected non-heldout lineage is not mirrored locally.', 404); return { release: { id: MEASURED_RELEASE_ID, schema_version: '1.0.0', digest: MEASURED_RELEASE_DIGEST }, lineage: parseEncoded(row, MeasuredLineageSchema, `Measured lineage ${measurementId}`), lineageDigest: row.digest, source: 'verified-local-mirror' } },
    calibrate(selection) { return track((async () => { const artifact = runMeasuredCalibration(calibrationRepository(), selection); const content = Object.fromEntries(Object.entries(artifact).filter(([key]) => key !== 'artifactDigest')); const ref = await withStorage(() => storeArtifact('calibration', content)); if (ref.digest !== artifact.artifactDigest) throw new MeasuredVerificationError('Calibration artifact identity does not equal its CAS digest.'); return artifact })()) },
    listCalibrations() { return track(withStorage(async () => { requireReady(); await recoverMeasuredJournal(selectedRoot.root, database, objects); const rows = database.prepare("SELECT digest FROM immutable_artifacts WHERE kind='calibration' ORDER BY created_at,digest").all(); return Promise.all(rows.map((row) => loadArtifact(row.digest, 'calibration'))) })) },
    calibration(digest) { return track(withStorage(async () => { requireReady(); await recoverMeasuredJournal(selectedRoot.root, database, objects); return loadArtifact(digest, 'calibration') })) },
    freeze(intent) { return track(executeFreeze(intent)) },
    disclose(intent) { return track(executeDisclosure(intent)) },
    integrity(signal) { return track(withStorage(async () => { signal?.throwIfAborted(); await recoverMeasuredJournal(selectedRoot.root, database, objects); signal?.throwIfAborted(); const result = await scanIntegrity(() => signal?.throwIfAborted()); signal?.throwIfAborted(); applyIntegrity(result); return result })) },
    async close() { if (closed) return; closed = true; syncGeneration += 1; syncController?.abort(new MeasuredRequestError('MEASURED_CLOSED', 'Measured service is closing.', 503)); await Promise.allSettled([...active]); await storageTail.catch(() => {}); await objects.close(); database.close(); if (selectedRoot.ephemeral) await rm(selectedRoot.root, { recursive: true, force: true }) },
    testing: options.exposeTesting ? { root: selectedRoot.root, database, objects, scanIntegrity, upstream, recoverJournal: () => recoverMeasuredJournal(selectedRoot.root, database, objects) } : undefined
  }
  return service
}
