import { randomUUID } from 'node:crypto'
import { homedir } from 'node:os'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { mkdir, mkdtemp, realpath, rm } from 'node:fs/promises'
import { canonicalDigest, canonicalJson } from '../../shared/canonical-json.js'
import {
  ArtifactRecordSchema,
  AttemptDetailSchema,
  AttemptRecordSchema,
  BundleExportResponseSchema,
  ComparisonRecordSchema,
  ComparisonRequestSchema,
  ExperimentCreateRequestSchema,
  ExperimentDetailSchema,
  ExperimentRecordSchema,
  HistoryFilterSchema,
  HistoryResponseSchema,
  ReportDocumentSchema,
  ReportRecordSchema,
  ResourceProfileSchema,
  RevisionCreateRequestSchema,
  RevisionRecordSchema,
  RunRecordSchema,
  SpecificationCheckpointSchema,
  WorkspaceEventSchema,
  WorkspaceRunResultSchema,
  WorkspaceSpecificationSchema
} from '../../shared/workspace-contracts.js'
import { PortfolioResultSchema } from '../../shared/portfolio-contracts.js'
import { verifyKnowledgeSnapshot } from '../knowledge/snapshot.js'
import { executeInWorker, validateExperimentForModel } from '../portfolio/execution.js'
import { modelDigest } from '../portfolio/identity.js'
import { getModel } from '../portfolio/registry.js'
import { exportPortableBundle, importPortableBundle } from './bundle.js'
import { openWorkspaceDatabase } from './database.js'
import {
  artifactIdentity,
  attemptIdentity,
  checkpointIdentity,
  engineIdentity,
  revisionIdentity,
  scientificRunIdentity,
  specificationIdentity
} from './identity.js'
import { createObjectStore } from './object-store.js'
import { generateReportFiles, REPORT_CSP } from './report.js'

const DEFAULT_PROFILE = Object.freeze({
  id: 'local-default',
  name: 'Local bounded CPU',
  cpuCores: 2,
  concurrency: 2,
  gpu: 'disabled',
  memoryMb: 96,
  wallTimeMs: 10_000,
  maxOutputBytes: 2_000_000,
  maxStorageBytes: 50_000_000,
  isDefault: true
})

const now = () => new Date().toISOString()
const parseJson = (value) => value === null ? null : JSON.parse(value)

export class WorkspaceRequestError extends Error {
  constructor(code, message, statusCode = 422) {
    super(message)
    this.name = 'WorkspaceRequestError'
    this.code = code
    this.statusCode = statusCode
  }
}

function inside(parent, child) {
  const path = relative(parent, child)
  return path === '' || (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path))
}

async function selectRoot(options) {
  const configured = options.root ?? options.env?.BIOCHEMICAL_WORKSPACE_ROOT
  if (!configured && options.env?.NODE_ENV === 'test') {
    const testRoot = resolve(options.env.BIOCHEMICAL_TEST_WORKSPACE_ROOT ?? resolve(process.cwd(), '..', '.biochemical-inference-test-workspaces'))
    await mkdir(testRoot, { recursive: true, mode: 0o700 })
    return { root: await mkdtemp(resolve(testRoot, 'workspace-')), ephemeral: true }
  }
  const root = resolve(configured ?? resolve(homedir(), '.local', 'share', 'biochemical-inference', 'workspace-v1'))
  if (inside(resolve(process.cwd()), root)) throw new WorkspaceRequestError('workspace_root_in_source', 'BIOCHEMICAL_WORKSPACE_ROOT must be outside the source tree.', 500)
  await mkdir(root, { recursive: true, mode: 0o700 })
  const [sourceRealPath, rootRealPath] = await Promise.all([realpath(process.cwd()), realpath(root)])
  if (inside(sourceRealPath, rootRealPath)) throw new WorkspaceRequestError('workspace_root_in_source', 'BIOCHEMICAL_WORKSPACE_ROOT must be outside the source tree.', 500)
  return { root: rootRealPath, ephemeral: false }
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

function experimentRecord(row) {
  return ExperimentRecordSchema.parse({
    experimentId: row.experiment_id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    latestRevisionId: row.latest_revision_id
  })
}

function revisionRecord(row) {
  return RevisionRecordSchema.parse({
    revisionId: row.revision_id,
    experimentId: row.experiment_id,
    ordinal: row.ordinal,
    parentRevisionId: row.parent_revision_id,
    specificationDigest: row.specification_digest,
    specificationObjectDigest: row.specification_object_digest,
    snapshotDigest: row.snapshot_digest,
    snapshotObjectDigest: row.snapshot_object_digest,
    modelDigests: parseJson(row.model_digests_json),
    engineDigests: parseJson(row.engine_digests_json),
    resourceProfileId: row.resource_profile_id,
    source: row.source,
    createdAt: row.created_at,
    specification: parseJson(row.specification_json)
  })
}

function attemptRecord(row) {
  return AttemptRecordSchema.parse({
    attemptId: row.attempt_id,
    runId: row.run_id,
    revisionId: row.revision_id,
    attemptNumber: row.attempt_number,
    kind: row.kind,
    restartMode: row.restart_mode,
    checkpointId: row.checkpoint_id,
    state: row.state,
    outcome: row.outcome,
    resourceProfileId: row.resource_profile_id,
    createdAt: row.created_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    cancellationRequested: Boolean(row.cancellation_requested),
    failure: parseJson(row.failure_json),
    resultArtifactId: row.result_artifact_id,
    rerunVerification: row.rerun_verification
  })
}

function artifactRecord(row) {
  return ArtifactRecordSchema.parse({
    artifactId: row.artifact_id,
    attemptId: row.attempt_id,
    name: row.name,
    kind: row.kind,
    mediaType: row.media_type,
    digest: row.digest,
    bytes: row.bytes,
    createdAt: row.created_at
  })
}

function checkpointRecord(row) {
  return SpecificationCheckpointSchema.parse({
    checkpointId: row.checkpoint_id,
    runId: row.run_id,
    attemptId: row.attempt_id,
    kind: 'specification',
    continuation: false,
    restartMode: 'from-specification',
    specificationDigest: row.specification_digest,
    specificationObjectDigest: row.specification_object_digest,
    snapshotDigest: row.snapshot_digest,
    modelDigests: parseJson(row.model_digests_json),
    engineDigests: parseJson(row.engine_digests_json),
    createdAt: row.created_at
  })
}

function eventRecord(row) {
  return WorkspaceEventSchema.parse({ eventId: row.event_id, attemptId: row.attempt_id, sequence: row.sequence, type: row.type, at: row.at, data: parseJson(row.data_json) })
}

export function compareNumerical(left, right, contract) {
  const differences = []
  let structural = true
  let allWithinContract = true
  const visit = (a, b, path) => {
    if (typeof a === 'number' && typeof b === 'number') {
      if (Object.is(a, b)) return
      const absoluteDifference = Math.abs(a - b)
      const withinContract = contract.kind === 'exact' ? false : absoluteDifference <= contract.absolute + contract.relative * Math.max(Math.abs(a), Math.abs(b))
      if (!withinContract) allWithinContract = false
      if (differences.length < 10_000) differences.push({ path, left: a, right: b, absoluteDifference, withinContract })
      return
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) structural = false
      for (let index = 0; index < Math.min(a.length, b.length); index += 1) visit(a[index], b[index], `${path}[${index}]`)
      return
    }
    if (a && b && typeof a === 'object' && typeof b === 'object') {
      const leftKeys = Object.keys(a).sort()
      const rightKeys = Object.keys(b).sort()
      if (leftKeys.join('\0') !== rightKeys.join('\0')) {
        structural = false
        return
      }
      for (const key of leftKeys) visit(a[key], b[key], path ? `${path}.${key}` : key)
      return
    }
    if (!Object.is(a, b)) structural = false
  }
  visit(left, right, '')
  return { structural, differences, pass: structural && allWithinContract }
}

export async function createWorkspaceService(options = {}) {
  const env = options.env ?? process.env
  const { root, ephemeral } = await selectRoot({ ...options, env })
  const database = openWorkspaceDatabase(root)
  const objects = await createObjectStore(root, options.objectStoreHooks)
  const knowledge = options.knowledgeClient
  const queueConcurrency = Number(env.BIOCHEMICAL_WORKSPACE_CONCURRENCY ?? 1)
  if (!Number.isInteger(queueConcurrency) || queueConcurrency < 1 || queueConcurrency > 16) throw new WorkspaceRequestError('invalid_workspace_concurrency', 'BIOCHEMICAL_WORKSPACE_CONCURRENCY must be an integer from 1 to 16.', 500)
  const active = new Map()
  const tasks = new Set()
  let running = 0
  let scheduling = false
  let closing = false

  const profile = ResourceProfileSchema.parse(DEFAULT_PROFILE)
  database.prepare('INSERT OR IGNORE INTO resource_profiles (id, payload_json, created_at) VALUES (?, ?, ?)').run(profile.id, canonicalJson(profile), now())

  const objectMetadata = (published, createdAt = now()) => database.prepare('INSERT OR IGNORE INTO objects (digest, bytes, created_at) VALUES (?, ?, ?)').run(published.digest, published.bytes, createdAt)
  const profileRow = (id) => {
    const row = database.prepare('SELECT payload_json FROM resource_profiles WHERE id = ?').get(id)
    if (!row) throw new WorkspaceRequestError('resource_profile_not_found', `Resource profile ${id} does not exist.`, 404)
    return ResourceProfileSchema.parse(JSON.parse(row.payload_json))
  }
  const revisionRow = (id) => {
    const row = database.prepare('SELECT * FROM revisions WHERE revision_id = ?').get(id)
    if (!row) throw new WorkspaceRequestError('revision_not_found', 'Experiment revision does not exist.', 404)
    return row
  }
  const assertRevisionWritable = (revision) => {
    const unsupported = revision.specification.entries.find((entry) => getModel(entry.model.id)?.digest !== entry.model.digest)
    if (unsupported) throw new WorkspaceRequestError('unsupported_embedded_model', `Embedded model ${unsupported.model.id} at ${unsupported.model.digest} is not in the exact executable registry; this revision is inspectable and exportable only.`, 409)
  }
  const attemptRow = (id) => {
    const row = database.prepare('SELECT * FROM attempts WHERE attempt_id = ?').get(id)
    if (!row) throw new WorkspaceRequestError('attempt_not_found', 'Run attempt does not exist.', 404)
    return row
  }
  const appendEvent = (attemptId, type, data = {}, at = now()) => {
    const sequence = Number(database.prepare('SELECT COALESCE(MAX(sequence), 0) + 1 AS value FROM events WHERE attempt_id = ?').get(attemptId).value)
    const eventId = canonicalDigest({ attemptId, sequence, type })
    const event = WorkspaceEventSchema.parse({ eventId, attemptId, sequence, type, at, data })
    database.prepare('INSERT INTO events (event_id, attempt_id, sequence, type, at, data_json) VALUES (?, ?, ?, ?, ?, ?)').run(eventId, attemptId, sequence, type, at, canonicalJson(event.data))
    return event
  }

  async function prepareRevision(specificationInput, snapshotInput) {
    const specification = WorkspaceSpecificationSchema.parse(specificationInput)
    for (const entry of specification.entries) {
      if (modelDigest(entry.model) !== entry.model.digest) throw new WorkspaceRequestError('model_digest_mismatch', `Embedded model ${entry.model.id} does not match its canonical digest.`)
      validateExperimentForModel(entry.model, entry.experiment)
    }
    const snapshot = snapshotInput ?? await knowledge.snapshot(Number(specification.context.taxonId.slice('NCBITaxon:'.length)))
    verifyKnowledgeSnapshot(snapshot, { expectedTaxonId: specification.context.taxonId })
    const specificationBytes = Buffer.from(canonicalJson(specification))
    const snapshotBytes = Buffer.from(canonicalJson(snapshot))
    const specificationObject = await objects.put(specificationBytes)
    const snapshotObject = await objects.put(snapshotBytes)
    const createdAt = now()
    objectMetadata(specificationObject, createdAt)
    objectMetadata(snapshotObject, createdAt)
    return {
      specification,
      specificationDigest: specificationIdentity(specification),
      specificationObject,
      snapshot,
      snapshotDigest: `sha256:${snapshot.snapshot_digest}`,
      snapshotObject,
      modelDigests: [...new Set(specification.entries.map((entry) => entry.model.digest))],
      engineDigests: [...new Set(specification.entries.map((entry) => engineIdentity(entry.experiment.engine)))],
      releaseIds: [...new Set([snapshot.release.id, ...specification.entries.map((entry) => entry.model.knowledgeRelease.id)])],
      modelIds: [...new Set(specification.entries.map((entry) => entry.model.id))]
    }
  }

  async function insertRevision(experimentId, specificationInput, resourceProfileId, source, snapshotInput, expectedResultBytes) {
    profileRow(resourceProfileId)
    const prepared = await prepareRevision(specificationInput, snapshotInput)
    let expectedResultObject = null
    if (expectedResultBytes) {
      WorkspaceRunResultSchema.parse(JSON.parse(expectedResultBytes.toString('utf8')))
      expectedResultObject = await objects.put(expectedResultBytes)
      objectMetadata(expectedResultObject)
    }
    const current = database.prepare('SELECT latest_revision_id FROM experiments WHERE experiment_id = ?').get(experimentId)
    if (!current) throw new WorkspaceRequestError('experiment_not_found', 'Experiment does not exist.', 404)
    const ordinal = Number(database.prepare('SELECT COALESCE(MAX(ordinal), 0) + 1 AS value FROM revisions WHERE experiment_id = ?').get(experimentId).value)
    const createdAt = now()
    const revisionId = revisionIdentity(experimentId, ordinal, prepared.specificationDigest)
    transaction(database, () => {
      database.prepare(`INSERT INTO revisions (
        revision_id, experiment_id, ordinal, parent_revision_id, specification_digest, specification_object_digest,
        snapshot_digest, snapshot_object_digest, model_digests_json, engine_digests_json, release_ids_json,
        model_ids_json, taxon_id, tissue_id, resource_profile_id, source, specification_json,
        expected_result_object_digest, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        revisionId, experimentId, ordinal, current.latest_revision_id, prepared.specificationDigest, prepared.specificationObject.digest,
        prepared.snapshotDigest, prepared.snapshotObject.digest, canonicalJson(prepared.modelDigests), canonicalJson(prepared.engineDigests), canonicalJson(prepared.releaseIds),
        canonicalJson(prepared.modelIds), prepared.specification.context.taxonId, prepared.specification.context.tissueId, resourceProfileId, source,
        canonicalJson(prepared.specification), expectedResultObject?.digest ?? null, createdAt
      )
      database.prepare('UPDATE experiments SET latest_revision_id = ?, updated_at = ? WHERE experiment_id = ?').run(revisionId, createdAt, experimentId)
    })
    return revisionRecord(revisionRow(revisionId))
  }

  async function createExperiment(input, extras = {}) {
    const request = ExperimentCreateRequestSchema.parse(input)
    const experimentId = randomUUID()
    const createdAt = now()
    database.prepare('INSERT INTO experiments (experiment_id, name, description, created_at, updated_at, latest_revision_id) VALUES (?, ?, ?, ?, ?, NULL)').run(experimentId, request.name, request.description, createdAt, createdAt)
    try {
      const revision = await insertRevision(experimentId, request.specification, request.resourceProfileId, extras.source ?? 'local', extras.snapshot, extras.expectedResultBytes)
      return ExperimentDetailSchema.parse({ experiment: experimentRecord(database.prepare('SELECT * FROM experiments WHERE experiment_id = ?').get(experimentId)), revisions: [revision] })
    } catch (error) {
      database.prepare('DELETE FROM experiments WHERE experiment_id = ?').run(experimentId)
      throw error
    }
  }

  function createAttempt(revisionId, resourceProfileId, explicitKind, sourceCheckpointId) {
    const row = revisionRow(revisionId)
    profileRow(resourceProfileId)
    const revision = revisionRecord(row)
    const runId = scientificRunIdentity(revision)
    const createdAt = now()
    return transaction(database, () => {
      database.prepare('INSERT OR IGNORE INTO runs (run_id, revision_id, identity_version, created_at) VALUES (?, ?, ?, ?)').run(runId, revisionId, 'workspace-scientific-run-v1', createdAt)
      const attemptNumber = Number(database.prepare('SELECT COALESCE(MAX(attempt_number), 0) + 1 AS value FROM attempts WHERE run_id = ?').get(runId).value)
      const kind = explicitKind ?? (attemptNumber === 1 ? 'initial' : 'rerun')
      const attemptId = attemptIdentity(runId, attemptNumber)
      const checkpointId = checkpointIdentity(attemptId, revision.specificationDigest)
      const verification = row.expected_result_object_digest ? 'pending' : 'not-declared'
      database.prepare(`INSERT INTO attempts (
        attempt_id, run_id, revision_id, attempt_number, kind, restart_mode, checkpoint_id, state, outcome,
        resource_profile_id, created_at, started_at, completed_at, cancellation_requested, failure_json,
        result_artifact_id, rerun_verification
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'queued', NULL, ?, ?, NULL, NULL, 0, NULL, NULL, ?)`).run(
        attemptId, runId, revisionId, attemptNumber, kind, kind === 'restart' ? 'from-specification' : null, checkpointId, resourceProfileId, createdAt, verification
      )
      database.prepare(`INSERT INTO checkpoints (
        checkpoint_id, run_id, attempt_id, specification_digest, specification_object_digest,
        snapshot_digest, model_digests_json, engine_digests_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        checkpointId, runId, attemptId, revision.specificationDigest, revision.specificationObjectDigest,
        revision.snapshotDigest, canonicalJson(revision.modelDigests), canonicalJson(revision.engineDigests), createdAt
      )
      appendEvent(attemptId, 'queued', sourceCheckpointId ? { restartFromCheckpointId: sourceCheckpointId } : {})
      return attemptRecord(database.prepare('SELECT * FROM attempts WHERE attempt_id = ?').get(attemptId))
    })
  }

  function finalizeWithoutArtifact(attemptId, outcome, failure, eventType) {
    const completedAt = now()
    return transaction(database, () => {
      const current = attemptRow(attemptId)
      if (current.state === 'terminal') return attemptRecord(current)
      const cancellation = Boolean(current.cancellation_requested)
      const finalOutcome = cancellation ? 'cancelled' : outcome
      const finalFailure = cancellation ? { code: 'cancelled_by_request', message: 'Execution was cancelled before terminal publication.' } : failure
      database.prepare("UPDATE attempts SET state = 'terminal', outcome = ?, completed_at = ?, failure_json = ? WHERE attempt_id = ?").run(finalOutcome, completedAt, canonicalJson(finalFailure), attemptId)
      appendEvent(attemptId, cancellation ? 'cancelled' : eventType, { outcome: finalOutcome }, completedAt)
      return attemptRecord(attemptRow(attemptId))
    })
  }

  async function executeAttempt(attemptId) {
    const startedAt = now()
    const start = transaction(database, () => {
      const current = attemptRow(attemptId)
      if (current.state !== 'queued') return null
      database.prepare("UPDATE attempts SET state = 'running', started_at = ? WHERE attempt_id = ?").run(startedAt, attemptId)
      appendEvent(attemptId, 'started', {}, startedAt)
      return attemptRecord(attemptRow(attemptId))
    })
    if (!start) return
    const row = revisionRow(start.revisionId)
    const revision = revisionRecord(row)
    const profileValue = profileRow(start.resourceProfileId)
    if (profileValue.gpu === 'required') {
      finalizeWithoutArtifact(attemptId, 'resource-exhausted', { code: 'gpu_unavailable', message: 'The bundled portfolio engines do not provide a GPU execution backend.' }, 'resource-exhausted')
      return
    }

    const slots = Array(revision.specification.entries.length)
    const executions = new Set()
    let nextIndex = 0
    let completed = 0
    active.set(attemptId, {
      cancel() {
        for (const execution of executions) execution.cancel()
      },
      interrupt() {
        for (const execution of executions) execution.interrupt()
      }
    })
    const lane = async () => {
      while (true) {
        if (Boolean(attemptRow(attemptId).cancellation_requested)) return
        const index = nextIndex
        nextIndex += 1
        if (index >= revision.specification.entries.length) return
        const entry = revision.specification.entries[index]
        let execution
        try {
          execution = executeInWorker(entry.model, entry.experiment, { timeoutMs: profileValue.wallTimeMs, maxOutputBytes: profileValue.maxOutputBytes, memoryMb: profileValue.memoryMb })
          executions.add(execution)
          const result = PortfolioResultSchema.parse(await execution.promise)
          if (closing) return
          slots[index] = { entryId: entry.id, result }
        } catch (error) {
          throw new WorkspaceRequestError('worker_start_failed', error instanceof Error ? error.message : 'Worker could not start.', 500)
        } finally {
          if (execution) executions.delete(execution)
        }
        if (closing) return
        completed += 1
        transaction(database, () => appendEvent(attemptId, 'progress', { completed, total: revision.specification.entries.length }))
      }
    }

    try {
      await Promise.all(Array.from({ length: Math.min(profileValue.concurrency, revision.specification.entries.length) }, lane))
    } catch (error) {
      active.delete(attemptId)
      if (closing) return
      finalizeWithoutArtifact(attemptId, 'failed', { code: 'worker_execution', message: error instanceof Error ? error.message : 'Portfolio worker failed.' }, 'failed')
      return
    }
    active.delete(attemptId)
    if (closing) return
    if (Boolean(attemptRow(attemptId).cancellation_requested)) {
      finalizeWithoutArtifact(attemptId, 'cancelled', { code: 'cancelled_by_request', message: 'Execution was cancelled before terminal publication.' }, 'cancelled')
      return
    }
    const entries = slots.filter(Boolean)
    if (entries.length !== revision.specification.entries.length) {
      finalizeWithoutArtifact(attemptId, 'failed', { code: 'incomplete_portfolio', message: 'The portfolio ended without a result for every entry.' }, 'failed')
      return
    }
    const aggregate = WorkspaceRunResultSchema.parse({
      contractVersion: '1.0.0',
      runId: start.runId,
      attemptId,
      revisionId: start.revisionId,
      entries,
      numericalContract: revision.specification.numericalContract
    })
    const resultBytes = Buffer.from(canonicalJson(aggregate))
    const usedStorage = Number(database.prepare('SELECT COALESCE(SUM(bytes), 0) AS value FROM artifacts').get().value)
    if (usedStorage + resultBytes.length > profileValue.maxStorageBytes) {
      finalizeWithoutArtifact(attemptId, 'resource-exhausted', { code: 'storage_limit', message: `Artifact publication would exceed the ${profileValue.maxStorageBytes} byte workspace storage budget.` }, 'resource-exhausted')
      return
    }
    const published = await objects.put(resultBytes)
    if (closing) return
    objectMetadata(published)
    const artifactId = artifactIdentity(attemptId, 'result.json', published.digest)
    const nonSuccessful = entries.find((entry) => entry.result.outcome !== 'successful')
    let outcome = nonSuccessful?.result.outcome ?? 'successful'
    let failure = nonSuccessful ? { code: 'portfolio_entry_failure', message: `Portfolio entry ${nonSuccessful.entryId} ended with ${nonSuccessful.result.outcome}.` } : null
    let rerunVerification = row.expected_result_object_digest ? 'pending' : 'not-declared'
    if (row.expected_result_object_digest) {
      const expected = WorkspaceRunResultSchema.parse(JSON.parse((await objects.get(row.expected_result_object_digest)).toString('utf8')))
      if (closing) return
      const comparison = compareNumerical(expected.entries, aggregate.entries, revision.specification.numericalContract)
      rerunVerification = comparison.pass ? 'pass' : 'fail'
      if (!comparison.pass) {
        outcome = 'failed'
        failure = { code: 'rerun_contract_mismatch', message: comparison.structural ? 'Rerun numerical output is outside the declared contract.' : 'Rerun output structure is incompatible with the exported result.' }
      }
    }
    const completedAt = now()
    transaction(database, () => {
      const current = attemptRow(attemptId)
      if (current.state === 'terminal') return
      if (current.cancellation_requested) {
        database.prepare("UPDATE attempts SET state = 'terminal', outcome = 'cancelled', completed_at = ?, failure_json = ? WHERE attempt_id = ?").run(completedAt, canonicalJson({ code: 'cancelled_by_request', message: 'Execution was cancelled before terminal publication.' }), attemptId)
        appendEvent(attemptId, 'cancelled', { outcome: 'cancelled' }, completedAt)
        return
      }
      database.prepare('INSERT INTO artifacts (artifact_id, attempt_id, name, kind, media_type, digest, bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(artifactId, attemptId, 'result.json', 'result', 'application/vnd.biochemical-workspace.result+json', published.digest, published.bytes, completedAt)
      database.prepare("UPDATE attempts SET state = 'terminal', outcome = ?, completed_at = ?, failure_json = ?, result_artifact_id = ?, rerun_verification = ? WHERE attempt_id = ?").run(outcome, completedAt, failure ? canonicalJson(failure) : null, artifactId, rerunVerification, attemptId)
      if (rerunVerification !== 'not-declared') appendEvent(attemptId, 'rerun-verified', { verification: rerunVerification }, completedAt)
      appendEvent(attemptId, outcome === 'successful' ? 'completed' : outcome === 'resource-exhausted' ? 'resource-exhausted' : 'failed', { outcome }, completedAt)
    })
  }

  function schedule() {
    if (scheduling || closing) return
    scheduling = true
    queueMicrotask(() => {
      scheduling = false
      while (!closing && running < queueConcurrency) {
        const queued = database.prepare("SELECT attempt_id FROM attempts WHERE state = 'queued' ORDER BY created_at, attempt_number LIMIT 1").get()
        if (!queued) break
        running += 1
        const task = executeAttempt(queued.attempt_id).catch((error) => {
          active.delete(queued.attempt_id)
          const row = database.prepare('SELECT state FROM attempts WHERE attempt_id = ?').get(queued.attempt_id)
          if (row?.state !== 'terminal') finalizeWithoutArtifact(queued.attempt_id, 'failed', { code: 'workspace_execution', message: error instanceof Error ? error.message : 'Workspace execution failed.' }, 'failed')
        }).finally(() => {
          running -= 1
          tasks.delete(task)
          schedule()
        })
        tasks.add(task)
      }
    })
  }

  async function validateCheckpoint(checkpointId) {
    const row = database.prepare('SELECT * FROM checkpoints WHERE checkpoint_id = ?').get(checkpointId)
    if (!row) throw new WorkspaceRequestError('checkpoint_not_found', 'Specification checkpoint does not exist.', 404)
    const checkpoint = checkpointRecord(row)
    const attempt = attemptRow(checkpoint.attemptId)
    const revision = revisionRecord(revisionRow(attempt.revision_id))
    if (checkpoint.specificationDigest !== revision.specificationDigest || checkpoint.specificationObjectDigest !== revision.specificationObjectDigest) throw new WorkspaceRequestError('checkpoint_specification_incompatible', 'Checkpoint specification digest is incompatible with its immutable revision.', 409)
    if (checkpoint.snapshotDigest !== revision.snapshotDigest) throw new WorkspaceRequestError('checkpoint_snapshot_incompatible', 'Checkpoint knowledge snapshot digest is incompatible with its immutable revision.', 409)
    if (canonicalJson([...checkpoint.modelDigests].sort()) !== canonicalJson([...revision.modelDigests].sort())) throw new WorkspaceRequestError('checkpoint_model_incompatible', 'Checkpoint model digests are incompatible with its immutable revision.', 409)
    if (canonicalJson([...checkpoint.engineDigests].sort()) !== canonicalJson([...revision.engineDigests].sort())) throw new WorkspaceRequestError('checkpoint_engine_incompatible', 'Checkpoint engine digests are incompatible with its immutable revision.', 409)
    let specificationBytes
    try {
      specificationBytes = await objects.get(checkpoint.specificationObjectDigest)
    } catch {
      throw new WorkspaceRequestError('checkpoint_specification_incompatible', 'Checkpoint specification object failed content-address verification.', 409)
    }
    const specification = WorkspaceSpecificationSchema.parse(JSON.parse(specificationBytes.toString('utf8')))
    if (Buffer.from(canonicalJson(specification)).compare(specificationBytes) !== 0 || specificationIdentity(specification) !== checkpoint.specificationDigest) throw new WorkspaceRequestError('checkpoint_specification_incompatible', 'Checkpoint specification object failed canonical digest verification.', 409)
    const modelDigests = [...new Set(specification.entries.map((entry) => modelDigest(entry.model)))]
    const engineDigests = [...new Set(specification.entries.map((entry) => engineIdentity(entry.experiment.engine)))]
    if (canonicalJson(modelDigests.sort()) !== canonicalJson([...checkpoint.modelDigests].sort())) throw new WorkspaceRequestError('checkpoint_model_incompatible', 'Checkpoint embedded model digest no longer matches.', 409)
    if (canonicalJson(engineDigests.sort()) !== canonicalJson([...checkpoint.engineDigests].sort())) throw new WorkspaceRequestError('checkpoint_engine_incompatible', 'Checkpoint embedded engine digest no longer matches.', 409)
    let snapshot
    try {
      snapshot = verifyKnowledgeSnapshot(JSON.parse((await objects.get(revision.snapshotObjectDigest)).toString('utf8')))
    } catch {
      throw new WorkspaceRequestError('checkpoint_snapshot_incompatible', 'Checkpoint knowledge snapshot object failed content-address verification.', 409)
    }
    if (`sha256:${snapshot.snapshot_digest}` !== checkpoint.snapshotDigest) throw new WorkspaceRequestError('checkpoint_snapshot_incompatible', 'Checkpoint knowledge snapshot object failed digest verification.', 409)
    return { checkpoint, revision }
  }

  async function restart(checkpointId, resourceProfileId) {
    const { checkpoint, revision } = await validateCheckpoint(checkpointId)
    assertRevisionWritable(revision)
    const attempt = createAttempt(revision.revisionId, resourceProfileId ?? revision.resourceProfileId, 'restart', checkpoint.checkpointId)
    schedule()
    return attempt
  }

  async function recover() {
    const interrupted = database.prepare("SELECT * FROM attempts WHERE state = 'running' ORDER BY created_at").all()
    for (const row of interrupted) {
      const completedAt = now()
      transaction(database, () => {
        database.prepare("UPDATE attempts SET state = 'terminal', outcome = 'failed', completed_at = ?, failure_json = ? WHERE attempt_id = ?").run(completedAt, canonicalJson({ code: 'process_restart', message: 'The process stopped while this attempt was running; no engine state was continued.' }), row.attempt_id)
        appendEvent(row.attempt_id, 'interrupted', { continuation: false }, completedAt)
      })
      try {
        const recovered = await restart(row.checkpoint_id, row.resource_profile_id)
        transaction(database, () => appendEvent(recovered.attemptId, 'recovered', { interruptedAttemptId: row.attempt_id, continuation: false }))
      } catch {
        // The interrupted attempt remains auditable when its immutable checkpoint is incompatible.
      }
    }
  }

  await recover()
  schedule()

  return {
    root,
    async close() {
      closing = true
      for (const execution of active.values()) execution.interrupt()
      await Promise.allSettled([...tasks])
      database.close()
      if (ephemeral) await rm(root, { recursive: true, force: true })
    },
    listResourceProfiles() {
      return database.prepare('SELECT payload_json FROM resource_profiles ORDER BY id').all().map((row) => ResourceProfileSchema.parse(JSON.parse(row.payload_json)))
    },
    createResourceProfile(input) {
      const value = ResourceProfileSchema.parse(input)
      if (database.prepare('SELECT 1 FROM resource_profiles WHERE id = ?').get(value.id)) throw new WorkspaceRequestError('resource_profile_exists', `Resource profile ${value.id} already exists.`, 409)
      database.prepare('INSERT INTO resource_profiles (id, payload_json, created_at) VALUES (?, ?, ?)').run(value.id, canonicalJson(value), now())
      return value
    },
    listExperiments() {
      return database.prepare('SELECT * FROM experiments ORDER BY updated_at DESC, experiment_id').all().map(experimentRecord)
    },
    createExperiment,
    async getExperiment(experimentId) {
      const row = database.prepare('SELECT * FROM experiments WHERE experiment_id = ?').get(experimentId)
      if (!row) throw new WorkspaceRequestError('experiment_not_found', 'Experiment does not exist.', 404)
      const revisions = database.prepare('SELECT * FROM revisions WHERE experiment_id = ? ORDER BY ordinal').all(experimentId).map(revisionRecord)
      return ExperimentDetailSchema.parse({ experiment: experimentRecord(row), revisions })
    },
    async createRevision(experimentId, input) {
      const request = RevisionCreateRequestSchema.parse(input)
      const current = database.prepare('SELECT latest_revision_id FROM experiments WHERE experiment_id = ?').get(experimentId)
      if (!current) throw new WorkspaceRequestError('experiment_not_found', 'Experiment does not exist.', 404)
      if (current.latest_revision_id) assertRevisionWritable(revisionRecord(revisionRow(current.latest_revision_id)))
      return insertRevision(experimentId, request.specification, request.resourceProfileId, 'local')
    },
    async cloneExperiment(experimentId, name) {
      const detail = await this.getExperiment(experimentId)
      const revision = detail.revisions.at(-1)
      assertRevisionWritable(revision)
      const snapshot = JSON.parse((await objects.get(revision.snapshotObjectDigest)).toString('utf8'))
      return createExperiment({ name: name ?? `${detail.experiment.name} clone`, description: detail.experiment.description, specification: revision.specification, resourceProfileId: revision.resourceProfileId }, { source: 'clone', snapshot })
    },
    queueRun(input) {
      const revision = revisionRecord(revisionRow(input.revisionId))
      assertRevisionWritable(revision)
      const attempt = createAttempt(revision.revisionId, input.resourceProfileId ?? revision.resourceProfileId)
      schedule()
      return attempt
    },
    getAttempt(attemptId) {
      const attempt = attemptRecord(attemptRow(attemptId))
      const revision = revisionRecord(revisionRow(attempt.revisionId))
      const experiment = experimentRecord(database.prepare('SELECT * FROM experiments WHERE experiment_id = ?').get(revision.experimentId))
      return AttemptDetailSchema.parse({ attempt, revision, experiment })
    },
    getRun(runId) {
      const run = database.prepare('SELECT * FROM runs WHERE run_id = ?').get(runId)
      if (!run) throw new WorkspaceRequestError('run_not_found', 'Scientific run does not exist.', 404)
      const attempts = database.prepare('SELECT * FROM attempts WHERE run_id = ? ORDER BY attempt_number').all(runId).map(attemptRecord)
      return RunRecordSchema.parse({ runId: run.run_id, revisionIds: [...new Set(attempts.map((attempt) => attempt.revisionId))], scientificIdentityVersion: run.identity_version, createdAt: run.created_at, attempts })
    },
    listHistory(input = {}) {
      const filters = HistoryFilterSchema.parse(input)
      const conditions = []
      const parameters = []
      if (filters.release) { conditions.push('EXISTS (SELECT 1 FROM json_each(r.release_ids_json) WHERE value = ?)'); parameters.push(filters.release) }
      if (filters.model) { conditions.push('EXISTS (SELECT 1 FROM json_each(r.model_ids_json) WHERE value = ?)'); parameters.push(filters.model) }
      if (filters.taxon) { conditions.push('r.taxon_id = ?'); parameters.push(filters.taxon) }
      if (filters.tissue) { conditions.push('r.tissue_id = ?'); parameters.push(filters.tissue) }
      if (filters.status) {
        if (['queued', 'running', 'terminal'].includes(filters.status)) conditions.push('a.state = ?')
        else conditions.push('a.outcome = ?')
        parameters.push(filters.status)
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
      const from = `FROM attempts a JOIN revisions r ON r.revision_id = a.revision_id JOIN experiments e ON e.experiment_id = r.experiment_id ${where}`
      const total = Number(database.prepare(`SELECT COUNT(*) AS value ${from}`).get(...parameters).value)
      const rows = database.prepare(`SELECT a.*, e.experiment_id, e.name AS experiment_name, r.taxon_id, r.tissue_id, r.model_ids_json, r.release_ids_json ${from} ORDER BY a.created_at DESC, a.attempt_number DESC LIMIT ? OFFSET ?`).all(...parameters, filters.limit, filters.offset)
      return HistoryResponseSchema.parse({
        items: rows.map((row) => ({ attempt: attemptRecord(row), experimentId: row.experiment_id, experimentName: row.experiment_name, taxonId: row.taxon_id, tissueId: row.tissue_id, modelIds: parseJson(row.model_ids_json), releaseIds: parseJson(row.release_ids_json) })),
        total,
        limit: filters.limit,
        offset: filters.offset
      })
    },
    events(attemptId) {
      attemptRow(attemptId)
      return database.prepare('SELECT * FROM events WHERE attempt_id = ? ORDER BY sequence').all(attemptId).map(eventRecord)
    },
    cancel(attemptId) {
      const cancelled = transaction(database, () => {
        const row = attemptRow(attemptId)
        if (row.state === 'terminal') return false
        const requestedAt = now()
        database.prepare('UPDATE attempts SET cancellation_requested = 1 WHERE attempt_id = ?').run(attemptId)
        appendEvent(attemptId, 'cancellation-requested', {}, requestedAt)
        if (row.state === 'queued') {
          database.prepare("UPDATE attempts SET state = 'terminal', outcome = 'cancelled', completed_at = ?, failure_json = ? WHERE attempt_id = ?").run(requestedAt, canonicalJson({ code: 'cancelled_by_request', message: 'Queued execution was cancelled before it started.' }), attemptId)
          appendEvent(attemptId, 'cancelled', { outcome: 'cancelled' }, requestedAt)
        }
        return true
      })
      if (cancelled) active.get(attemptId)?.cancel()
      return cancelled ? attemptRecord(attemptRow(attemptId)) : null
    },
    checkpoints(attemptId) {
      attemptRow(attemptId)
      return database.prepare('SELECT * FROM checkpoints WHERE attempt_id = ? ORDER BY created_at').all(attemptId).map(checkpointRecord)
    },
    restart,
    artifacts(attemptId) {
      attemptRow(attemptId)
      return database.prepare('SELECT * FROM artifacts WHERE attempt_id = ? ORDER BY created_at, name').all(attemptId).map(artifactRecord)
    },
    async artifactContent(artifactId) {
      const row = database.prepare('SELECT * FROM artifacts WHERE artifact_id = ?').get(artifactId)
      if (!row) throw new WorkspaceRequestError('artifact_not_found', 'Artifact does not exist.', 404)
      return { artifact: artifactRecord(row), content: await objects.get(row.digest) }
    },
    async compare(input) {
      const request = ComparisonRequestSchema.parse(input)
      const loadResult = async (attemptId) => {
        const attempt = attemptRow(attemptId)
        if (!attempt.result_artifact_id) throw new WorkspaceRequestError('result_artifact_not_found', `Attempt ${attemptId} has no published result artifact.`, 409)
        const artifact = database.prepare('SELECT * FROM artifacts WHERE artifact_id = ?').get(attempt.result_artifact_id)
        return { attempt, result: WorkspaceRunResultSchema.parse(JSON.parse((await objects.get(artifact.digest)).toString('utf8'))) }
      }
      const left = await loadResult(request.leftAttemptId)
      const right = await loadResult(request.rightAttemptId)
      const scientificOutput = (result) => result.entries.map((entry) => ({ entryId: entry.entryId, outcome: entry.result.outcome, data: entry.result.data }))
      const comparison = compareNumerical(scientificOutput(left.result), scientificOutput(right.result), request.contract)
      const comparisonId = canonicalDigest(request)
      const createdAt = now()
      const record = ComparisonRecordSchema.parse({
        comparisonId,
        leftAttemptId: request.leftAttemptId,
        rightAttemptId: request.rightAttemptId,
        contract: request.contract,
        status: comparison.structural ? comparison.pass ? 'pass' : 'fail' : 'incompatible',
        specificationChanged: revisionRow(left.attempt.revision_id).specification_digest !== revisionRow(right.attempt.revision_id).specification_digest,
        differences: comparison.differences,
        createdAt
      })
      database.prepare('INSERT OR IGNORE INTO comparisons (comparison_id, left_attempt_id, right_attempt_id, payload_json, created_at) VALUES (?, ?, ?, ?, ?)').run(comparisonId, request.leftAttemptId, request.rightAttemptId, canonicalJson(record), createdAt)
      const stored = database.prepare('SELECT payload_json FROM comparisons WHERE comparison_id = ?').get(comparisonId)
      return ComparisonRecordSchema.parse(JSON.parse(stored.payload_json))
    },
    getComparison(comparisonId) {
      const row = database.prepare('SELECT payload_json FROM comparisons WHERE comparison_id = ?').get(comparisonId)
      if (!row) throw new WorkspaceRequestError('comparison_not_found', 'Comparison does not exist.', 404)
      return ComparisonRecordSchema.parse(JSON.parse(row.payload_json))
    },
    async createReport(attemptId) {
      const detail = this.getAttempt(attemptId)
      if (!detail.attempt.resultArtifactId) throw new WorkspaceRequestError('result_artifact_not_found', 'A report requires a published result artifact.', 409)
      const existing = database.prepare('SELECT payload_json FROM reports WHERE attempt_id = ?').get(attemptId)
      if (existing) return ReportRecordSchema.parse(JSON.parse(existing.payload_json))
      const resultArtifact = database.prepare('SELECT * FROM artifacts WHERE artifact_id = ?').get(detail.attempt.resultArtifactId)
      const result = WorkspaceRunResultSchema.parse(JSON.parse((await objects.get(resultArtifact.digest)).toString('utf8')))
      const reportId = canonicalDigest({ attemptId, resultDigest: resultArtifact.digest, reportVersion: '1.0.0' })
      const warnings = result.entries.flatMap((entry) => entry.result.diagnostics.warnings)
      const scientificBoundaries = [...new Set(result.entries.flatMap((entry) => [...entry.result.assumptions, ...entry.result.limitations]))]
      const document = ReportDocumentSchema.parse({
        reportVersion: '1.0.0',
        reportId,
        experiment: { experimentId: detail.experiment.experimentId, name: detail.experiment.name, description: detail.experiment.description },
        revision: { revisionId: detail.revision.revisionId, specificationDigest: detail.revision.specificationDigest, snapshotDigest: detail.revision.snapshotDigest },
        attempt: detail.attempt,
        result,
        warnings,
        scientificBoundaries
      })
      const files = generateReportFiles(document)
      const profileValue = profileRow(detail.attempt.resourceProfileId)
      const reportBytes = Object.values(files).reduce((sum, value) => sum + value.length, 0)
      const usedStorage = Number(database.prepare('SELECT COALESCE(SUM(bytes), 0) AS value FROM artifacts').get().value)
      if (usedStorage + reportBytes > profileValue.maxStorageBytes) throw new WorkspaceRequestError('storage_limit', 'Report publication would exceed the workspace storage budget.', 413)
      const createdAt = detail.attempt.completedAt
      const definitions = [
        ['html', 'report.html', 'report-html', 'text/html; charset=utf-8'],
        ['json', 'report.json', 'report-json', 'application/json'],
        ['csv', 'report.csv', 'report-csv', 'text/csv; charset=utf-8'],
        ['svg', 'report.svg', 'report-svg', 'image/svg+xml']
      ]
      const records = []
      for (const [format, name, kind, mediaType] of definitions) {
        const published = await objects.put(files[format])
        objectMetadata(published, createdAt)
        records.push(ArtifactRecordSchema.parse({ artifactId: artifactIdentity(attemptId, name, published.digest), attemptId, name, kind, mediaType, digest: published.digest, bytes: published.bytes, createdAt }))
      }
      const report = ReportRecordSchema.parse({ reportId, attemptId, createdAt, artifacts: records, csp: REPORT_CSP })
      transaction(database, () => {
        for (const item of records) database.prepare('INSERT INTO artifacts (artifact_id, attempt_id, name, kind, media_type, digest, bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(item.artifactId, attemptId, item.name, item.kind, item.mediaType, item.digest, item.bytes, item.createdAt)
        database.prepare('INSERT INTO reports (report_id, attempt_id, payload_json, created_at) VALUES (?, ?, ?, ?)').run(reportId, attemptId, canonicalJson(report), createdAt)
      })
      return report
    },
    getReport(reportId) {
      const row = database.prepare('SELECT payload_json FROM reports WHERE report_id = ?').get(reportId)
      if (!row) throw new WorkspaceRequestError('report_not_found', 'Report does not exist.', 404)
      return ReportRecordSchema.parse(JSON.parse(row.payload_json))
    },
    async exportExperiment(experimentId) {
      const detail = await this.getExperiment(experimentId)
      const revision = detail.revisions.at(-1)
      if (!revision) throw new WorkspaceRequestError('revision_not_found', 'Experiment has no revision to export.', 409)
      const latestArtifact = database.prepare(`SELECT ar.* FROM artifacts ar JOIN attempts a ON a.attempt_id = ar.attempt_id WHERE a.revision_id = ? AND ar.kind = 'result' ORDER BY a.attempt_number DESC LIMIT 1`).get(revision.revisionId)
      const bundle = await exportPortableBundle({
        experiment: detail.experiment,
        revision,
        specificationBytes: await objects.get(revision.specificationObjectDigest),
        snapshotBytes: await objects.get(revision.snapshotObjectDigest),
        resultBytes: latestArtifact ? await objects.get(latestArtifact.digest) : null
      })
      return BundleExportResponseSchema.parse({ profile: 'biochemical-workspace-portable-1.0', fileName: `${detail.experiment.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'experiment'}.zip`, bundleBase64: bundle.toString('base64') })
    },
    async importExperiment(buffer) {
      let imported
      try {
        imported = await importPortableBundle(buffer)
      } catch (error) {
        throw new WorkspaceRequestError('invalid_portable_bundle', error instanceof Error ? error.message : 'Portable bundle validation failed.', 422)
      }
      if (canonicalJson(imported.manifest.rerun.contract) !== canonicalJson(imported.specification.numericalContract)) throw new WorkspaceRequestError('bundle_contract_mismatch', 'Portable bundle rerun contract does not match its specification.', 422)
      return createExperiment({
        name: `${imported.manifest.experiment.name} (imported)`,
        description: imported.manifest.experiment.description,
        specification: imported.specification,
        resourceProfileId: 'local-default'
      }, { source: 'import', snapshot: imported.snapshot, expectedResultBytes: imported.expectedResultBytes })
    }
  }
}
