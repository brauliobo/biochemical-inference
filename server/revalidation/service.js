import { stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { canonicalJson } from '../../shared/canonical-json.js'
import {
  CampaignAttemptSchema,
  CampaignCheckpointSchema,
  CampaignResultSchema,
  CampaignSpecificationSchema,
  CampaignWorkerResultSchema,
  ProducerCampaignReceiptSchema,
  ProducerCampaignResponseSchema,
  ProducerOutcomeReceiptSchema,
  ProducerSignedEventSchema,
  RevalidationWorkItemSchema
} from '../../shared/revalidation-contracts.js'
import { decodeCursor as verifyCursor, decodeSecret, encodeCursor } from '../commons/cursor.js'
import { defineRequestError } from '../commons/errors.js'
import { parseJsonColumn as parseJson, transaction } from '../commons/sqlite.js'
import { selectStorageRoot } from '../commons/storage.js'
import { createObjectStore } from '../workspace/object-store.js'
import { acquireRevalidationEngineRootLock, openRevalidationDatabase } from './database.js'
import { assertRssMeasurementAvailable, createRevalidationWorkerPool, REVALIDATION_EXECUTOR_ALLOWLIST } from './execution.js'
import {
  campaignAttemptIdentity,
  campaignCompatibilityIdentity,
  createCampaignSpecification,
  identityPayload,
  immutable,
  revalidationIdentity,
  verifyCampaignSpecification
} from './identity.js'
import { verifyImpactPlan } from './planning.js'

const PLANNING_INPUTS = Object.freeze([
  ['change-set.json', 'application/vnd.biochemical.revalidation-change-set+json', 'changeSet'],
  ['dependency-snapshot.json', 'application/vnd.biochemical.revalidation-snapshot+json', 'dependencySnapshot'],
  ['impact-plan.json', 'application/vnd.biochemical.revalidation-plan+json', 'impactPlan'],
  ['impact-policy.json', 'application/vnd.biochemical.revalidation-policy+json', 'impactPolicy']
])
const TEST_CURSOR_SECRET = Buffer.alloc(32, 15).toString('base64url')

export const RevalidationEngineError = defineRequestError('RevalidationEngineError', 409)

async function selectRoot(options, env) {
  const { root } = await selectStorageRoot({
    configured: options.root ?? env.BIOCHEMICAL_REVALIDATION_ROOT,
    defaultName: 'revalidation-v1',
    secure: false,
    inSourceError: () => new RevalidationEngineError('root-in-source', 'BIOCHEMICAL_REVALIDATION_ROOT must be outside the source tree.', 500)
  })
  return root
}

const iso = (milliseconds) => new Date(milliseconds).toISOString()
const producerEventBody = (event) => {
  const { event_digest: _digest, signature: _signature, ...body } = event
  return body
}

function failure(code, message, retryable) {
  return { code, message, retryable }
}

function backoffMilliseconds(policy, attemptNumber) {
  const seconds = Math.min(policy.maximum_backoff_seconds, policy.initial_backoff_seconds * policy.backoff_multiplier ** Math.max(0, attemptNumber - 1))
  return Math.round(seconds * 1000)
}

function cursorSecret(options, env) {
  const value = options.cursorSecret ?? env.BIOCHEMICAL_REVALIDATION_CURSOR_SECRET ?? (env.NODE_ENV === 'test' ? TEST_CURSOR_SECRET : null)
  return decodeSecret(value, (reason) => {
    throw new RevalidationEngineError('cursor-secret-invalid', reason === 'shape' ? 'BIOCHEMICAL_REVALIDATION_CURSOR_SECRET must be canonical unpadded base64url for exactly 32 bytes.' : 'BIOCHEMICAL_REVALIDATION_CURSOR_SECRET must encode exactly 32 bytes.', 500)
  })
}

const decodeCursor = (value, secret) => verifyCursor(value, secret, () => {
  throw new RevalidationEngineError('projection-cursor-invalid', 'Campaign projection cursor is invalid or tampered.')
})

async function fileBytes(path) {
  try { return (await stat(path)).size } catch (error) { if (error?.code === 'ENOENT') return 0; throw error }
}

export async function createRevalidationCampaignEngine(options = {}) {
  const env = options.env ?? process.env
  const root = await selectRoot(options, env)
  const objects = await createObjectStore(root, options.objectStoreHooks)
  const projectionCursorSecret = cursorSecret(options, env)
  const nowMilliseconds = options.nowMilliseconds ?? Date.now
  const owner = options.leaseOwner ?? `local-${process.pid}`
  const maximumConcurrency = Number(env.BIOCHEMICAL_REVALIDATION_CONCURRENCY ?? options.maximumConcurrency ?? 1)
  if (!Number.isInteger(maximumConcurrency) || maximumConcurrency < 1 || maximumConcurrency > 16) {
    throw new RevalidationEngineError('invalid-concurrency', 'BIOCHEMICAL_REVALIDATION_CONCURRENCY must be an integer from 1 to 16.', 500)
  }
  const engineRootLock = acquireRevalidationEngineRootLock(root)
  let database
  try {
    database = openRevalidationDatabase(root)
    database.prepare('DELETE FROM storage_reservations').run()
  } catch (error) {
    engineRootLock.release()
    throw error
  }
  const active = new Map()
  const specifications = new Map()
  const campaignInputs = new Map()
  const producerCampaigns = new Map()
  const workerPool = options.executeWorker ? null : createRevalidationWorkerPool({ maximumWorkers: maximumConcurrency })
  const executeWorker = options.executeWorker ?? workerPool.execute
  const processIsolationEnforced = workerPool !== null
  const executionMode = processIsolationEnforced ? 'isolated-worker' : 'inline-evidence-only'
  try {
    if (processIsolationEnforced) assertRssMeasurementAvailable()
  } catch (error) {
    database.close()
    engineRootLock.release()
    throw error
  }
  const tasks = new Set()
  let running = 0
  let scheduling = false
  let closing = false
  let started = options.autoStart !== false
  let wakeTimer = null

  const nowIso = () => iso(nowMilliseconds())
  const objectMetadata = (published, createdAt = nowIso()) => database.prepare('INSERT OR IGNORE INTO objects (digest, bytes, created_at) VALUES (?, ?, ?)').run(published.digest, published.bytes, createdAt)
  const normalizedReceiptJson = (receipt) => canonicalJson({ ...receipt, created: false })
  const normalizedProducerRequestJson = (request) => canonicalJson({ ...request, event: { ...request.event, signing_key_id: null } })
  const persistProducerEvents = (events) => {
    const values = events.map((item) => ProducerSignedEventSchema.parse(item)).sort((left, right) => left.sequence - right.sequence)
    if (new Set(values.map((value) => value.sequence)).size !== values.length) throw new RevalidationEngineError('producer-event-conflict', 'Producer event suffix contains repeated sequences.')
    const latest = database.prepare('SELECT sequence, event_digest FROM producer_events ORDER BY sequence DESC LIMIT 1').get() ?? { sequence: 0, event_digest: null }
    const overlapping = values.filter((value) => value.sequence <= latest.sequence)
    if (overlapping.length) {
      const persisted = new Map(database.prepare('SELECT sequence, event_digest FROM producer_events WHERE sequence >= ? AND sequence <= ? ORDER BY sequence').all(overlapping[0].sequence, overlapping.at(-1).sequence).map((row) => [row.sequence, row.event_digest]))
      for (const value of overlapping) {
        if (persisted.get(value.sequence) !== value.event_digest) throw new RevalidationEngineError('producer-event-conflict', `Producer event sequence ${value.sequence} conflicts with its persisted identity.`)
      }
    }
    let previous = latest.event_digest
    let expectedSequence = latest.sequence + 1
    for (const value of values.filter((item) => item.sequence > latest.sequence)) {
      if (value.sequence !== expectedSequence) throw new RevalidationEngineError('producer-event-conflict', `Producer event sequence ${value.sequence} is not contiguous.`)
      if (previous !== value.previous_event_digest) throw new RevalidationEngineError('producer-event-conflict', `Producer event sequence ${value.sequence} does not extend the persisted chain.`)
      database.prepare('INSERT INTO producer_events VALUES (?, ?, ?)').run(value.sequence, value.event_digest, canonicalJson(value))
      previous = value.event_digest
      expectedSequence += 1
    }
  }
  const campaignSpec = (campaignId) => {
    if (specifications.has(campaignId)) return specifications.get(campaignId)
    const row = database.prepare('SELECT specification_json FROM campaign_specs WHERE campaign_id = ?').get(campaignId)
    if (!row) throw new RevalidationEngineError('campaign-not-found', `Campaign ${campaignId} does not exist.`, 404)
    const specification = CampaignSpecificationSchema.parse(JSON.parse(row.specification_json))
    specifications.set(campaignId, specification)
    return specification
  }
  const workRow = (workId, campaignId = null) => {
    const rows = campaignId
      ? database.prepare('SELECT * FROM work_items WHERE campaign_id = ? AND work_id = ?').all(campaignId, workId)
      : database.prepare('SELECT * FROM work_items WHERE work_id = ? ORDER BY campaign_id').all(workId)
    if (rows.length > 1) throw new RevalidationEngineError('ambiguous-work', `Work item ${workId} belongs to more than one campaign; provide campaign identity.`)
    const row = rows[0]
    if (!row) throw new RevalidationEngineError('work-not-found', `Work item ${workId} does not exist.`, 404)
    return row
  }
  const attemptRow = (attemptId) => {
    const row = database.prepare('SELECT * FROM attempts WHERE attempt_id = ?').get(attemptId)
    if (!row) throw new RevalidationEngineError('attempt-not-found', `Attempt ${attemptId} does not exist.`, 404)
    return row
  }
  const attemptRecord = (row) => CampaignAttemptSchema.parse({
    attempt_id: row.attempt_id,
    campaign_id: row.campaign_id,
    work_id: row.work_id,
    attempt_number: row.attempt_number,
    state: row.state,
    execution_mode: row.execution_mode,
    lease_owner: row.lease_owner,
    lease_expires_at: row.lease_expires_at,
    created_at: row.created_at,
    started_at: row.started_at,
    completed_at: row.completed_at,
    peak_rss_bytes: row.peak_rss_bytes,
    runtime_ms: row.runtime_ms,
    outcome: row.outcome,
    failure: parseJson(row.failure_json)
  })
  const workRecord = (row) => immutable({
    work_id: row.work_id,
    campaign_id: row.campaign_id,
    ordinal: row.ordinal,
    state: row.state,
    attempt_count: row.attempt_count,
    cancellation_requested: Boolean(row.cancellation_requested),
    available_at: row.available_at,
    current_attempt_id: row.current_attempt_id,
    outcome: row.outcome,
    failure: parseJson(row.failure_json),
    accepted_result_id: row.accepted_result_id,
    completed_at: row.completed_at,
    work: RevalidationWorkItemSchema.parse(JSON.parse(row.payload_json))
  })
  const bumpProjection = (campaignId) => database.prepare('UPDATE campaigns SET projection_revision = projection_revision + 1 WHERE campaign_id = ?').run(campaignId)
  const campaignLogicalBytes = (campaignId) => {
    const inputs = Number(database.prepare('SELECT COALESCE(SUM(bytes), 0) AS bytes FROM campaign_inputs WHERE campaign_id = ?').get(campaignId).bytes)
    const results = Number(database.prepare('SELECT COALESCE(SUM(artifact_bytes), 0) AS bytes FROM accepted_results WHERE campaign_id = ?').get(campaignId).bytes)
    const checkpoints = Number(database.prepare('SELECT COALESCE(SUM(o.bytes), 0) AS bytes FROM checkpoints c JOIN objects o ON o.digest = c.state_digest WHERE c.campaign_id = ?').get(campaignId).bytes)
    return inputs + results + checkpoints
  }
  const reserveStorage = (campaignId, reservationId, additionalBytes, specification) => transaction(database, () => {
    const limit = specification.resource_profile.scratch_mib * 1024 * 1024
    const reserved = Number(database.prepare('SELECT COALESCE(SUM(bytes), 0) AS bytes FROM storage_reservations WHERE campaign_id = ?').get(campaignId).bytes)
    if (campaignLogicalBytes(campaignId) + reserved + additionalBytes > limit) throw new RevalidationEngineError('resource-exhausted', 'Campaign logical storage exceeds its scratch resource bound.')
    database.prepare('INSERT INTO storage_reservations VALUES (?, ?, ?)').run(reservationId, campaignId, additionalBytes)
  })
  const releaseStorage = (reservationId) => database.prepare('DELETE FROM storage_reservations WHERE reservation_id = ?').run(reservationId)

  function completeCampaignIfTerminal(campaignId, completedAt) {
    const remaining = Number(database.prepare("SELECT COUNT(*) AS count FROM work_items WHERE campaign_id = ? AND state != 'terminal'").get(campaignId).count)
    if (remaining === 0) database.prepare("UPDATE campaigns SET state = 'terminal', completed_at = COALESCE(completed_at, ?) WHERE campaign_id = ?").run(completedAt, campaignId)
  }

  function executorBinding(specification, work) {
    const binding = specification.executor_bindings.find((item) => item.expected_artifact_class === work.expected_artifact_class)
    if (!binding) throw new RevalidationEngineError('executor-binding-missing', `No executor is bound for ${work.expected_artifact_class}.`)
    if (REVALIDATION_EXECUTOR_ALLOWLIST[binding.executor_id] !== binding.executor_version) throw new RevalidationEngineError('executor-not-allowlisted', `Executor ${binding.executor_id}@${binding.executor_version} is not allowlisted.`)
    if (binding.executor_id === 'test-deterministic' && env.NODE_ENV !== 'test') throw new RevalidationEngineError('test-executor-forbidden', 'The deterministic test executor is disabled outside tests.')
    return binding
  }

  async function loadInputs(specification) {
    if (!campaignInputs.has(specification.campaign_id)) {
      const loading = (async () => {
        const values = []
        for (const descriptor of specification.input_artifacts) {
          let bytes
          try {
            bytes = await objects.get(descriptor.digest)
          } catch (error) {
            throw new RevalidationEngineError('input-artifact-corrupt', `Campaign input ${descriptor.name} failed content-address verification: ${error.message}`)
          }
          if (bytes.length !== descriptor.bytes) throw new RevalidationEngineError('input-artifact-corrupt', `Campaign input ${descriptor.name} byte length drifted.`)
          values.push(Object.freeze({ name: descriptor.name, digest: descriptor.digest, content_base64: bytes.toString('base64') }))
        }
        return Object.freeze(values)
      })()
      campaignInputs.set(specification.campaign_id, loading)
      loading.catch(() => campaignInputs.delete(specification.campaign_id))
    }
    return campaignInputs.get(specification.campaign_id)
  }

  async function compatibleCheckpoint(specification, work, binding) {
    if (binding.checkpoint_mode === 'none') return null
    const compatibilityId = campaignCompatibilityIdentity(specification, work, binding)
    const row = database.prepare('SELECT * FROM checkpoints WHERE campaign_id = ? AND work_id = ? AND compatibility_id = ? ORDER BY created_at DESC, checkpoint_id DESC LIMIT 1').get(specification.campaign_id, work.work_id, compatibilityId)
    if (!row) return null
    const metadata = CampaignCheckpointSchema.parse(JSON.parse(row.checkpoint_json))
    const bytes = await objects.get(row.state_digest)
    if (metadata.state_digest !== row.state_digest || metadata.compatibility_id !== compatibilityId) throw new RevalidationEngineError('checkpoint-incompatible', 'Stored checkpoint compatibility closure drifted.')
    return { metadata, content_base64: bytes.toString('base64') }
  }

  async function publishCheckpoint(attempt, specification, work, binding, state) {
    if (binding.checkpoint_mode !== 'exact-input-closure') throw new RevalidationEngineError('checkpoint-forbidden', 'Executor returned a checkpoint for a work class that forbids continuation.')
    const stateBytes = Buffer.from(canonicalJson(state))
    const reservationId = `checkpoint:${attempt.attempt_id}`
    reserveStorage(specification.campaign_id, reservationId, stateBytes.length, specification)
    try {
      const published = await objects.put(stateBytes)
      objectMetadata(published)
      const payload = {
        checkpoint_schema_version: '1.0.0',
        campaign_id: specification.campaign_id,
        work_id: work.work_id,
        compatibility_id: campaignCompatibilityIdentity(specification, work, binding),
        state_digest: published.digest,
        continuation: true,
        scientifically_valid: true
      }
      const metadata = CampaignCheckpointSchema.parse({ ...payload, checkpoint_id: revalidationIdentity(payload) })
      transaction(database, () => {
        database.prepare('INSERT OR IGNORE INTO checkpoints (checkpoint_id, campaign_id, work_id, attempt_id, compatibility_id, state_digest, checkpoint_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
          metadata.checkpoint_id, specification.campaign_id, work.work_id, attempt.attempt_id, metadata.compatibility_id, metadata.state_digest, canonicalJson(metadata), nowIso()
        )
        releaseStorage(reservationId)
        bumpProjection(specification.campaign_id)
      })
      return metadata
    } catch (error) {
      releaseStorage(reservationId)
      throw error
    }
  }

  function retryDecision(specification, attemptNumber, code) {
    return attemptNumber < specification.retry_policy.maximum_attempts && specification.retry_policy.retryable_failure_codes.includes(code)
  }

  function measuredExecution(metrics, mode, requireComplete = false) {
    const peakRssBytes = metrics?.peak_rss_bytes ?? null
    const runtimeMs = metrics?.runtime_ms ?? null
    if ((peakRssBytes !== null && (!Number.isInteger(peakRssBytes) || peakRssBytes < 0)) || (runtimeMs !== null && (!Number.isInteger(runtimeMs) || runtimeMs < 0))) {
      throw new RevalidationEngineError('execution-measurement-invalid', 'Worker RSS and runtime measurements must be non-negative integers.')
    }
    if (requireComplete && mode === 'isolated-worker' && (peakRssBytes === null || runtimeMs === null)) {
      throw new RevalidationEngineError('execution-measurement-invalid', 'Isolated worker measurements must include both RSS and runtime.')
    }
    return { peakRssBytes, runtimeMs }
  }

  function finalizeFailure(attemptId, rawFailure, metrics = null) {
    const completedAt = nowIso()
    return transaction(database, () => {
      const attempt = attemptRow(attemptId)
      if (attempt.state === 'terminal') return workRecord(workRow(attempt.work_id, attempt.campaign_id))
      const work = workRow(attempt.work_id, attempt.campaign_id)
      const campaign = database.prepare('SELECT * FROM campaigns WHERE campaign_id = ?').get(attempt.campaign_id)
      const specification = campaignSpec(attempt.campaign_id)
      const cancelled = Boolean(work.cancellation_requested || campaign.cancellation_requested || rawFailure.code === 'cancelled')
      const retryable = !cancelled && retryDecision(specification, attempt.attempt_number, rawFailure.code)
      const recordedFailure = failure(rawFailure.code, rawFailure.message, retryable)
      const attemptOutcome = cancelled ? 'cancelled' : rawFailure.code === 'resource-exhausted' ? 'resource-exhausted' : 'failed'
      const measured = measuredExecution(metrics, attempt.execution_mode)
      database.prepare("UPDATE attempts SET state = 'terminal', outcome = ?, failure_json = ?, completed_at = ?, peak_rss_bytes = ?, runtime_ms = ? WHERE attempt_id = ?").run(attemptOutcome, canonicalJson(recordedFailure), completedAt, measured.peakRssBytes, measured.runtimeMs, attemptId)
      if (retryable) {
        const availableAt = iso(nowMilliseconds() + backoffMilliseconds(specification.retry_policy, attempt.attempt_number))
        database.prepare("UPDATE work_items SET state = 'queued', current_attempt_id = NULL, available_at = ?, failure_json = ? WHERE campaign_id = ? AND work_id = ?").run(availableAt, canonicalJson(recordedFailure), attempt.campaign_id, work.work_id)
      } else {
        database.prepare("UPDATE work_items SET state = 'terminal', outcome = ?, failure_json = ?, completed_at = ? WHERE campaign_id = ? AND work_id = ?").run(attemptOutcome, canonicalJson(recordedFailure), completedAt, attempt.campaign_id, work.work_id)
        completeCampaignIfTerminal(attempt.campaign_id, completedAt)
      }
      bumpProjection(attempt.campaign_id)
      return workRecord(workRow(work.work_id, attempt.campaign_id))
    })
  }

  function buildResult(specification, work, binding, workerResult) {
    const parsed = CampaignWorkerResultSchema.parse(workerResult)
    const payload = {
      result_schema_version: '1.0.0',
      campaign_id: specification.campaign_id,
      work_id: work.work_id,
      executor: { id: binding.executor_id, version: binding.executor_version },
      execution_status: parsed.execution_status,
      scientific_conclusion: parsed.scientific_conclusion,
      input_artifact_digests: specification.input_artifacts.map((item) => item.digest),
      output: parsed.output
    }
    return CampaignResultSchema.parse({ ...payload, result_id: revalidationIdentity(payload) })
  }

  async function acceptResult(attemptId, workerResult, metrics = null) {
    const attempt = attemptRow(attemptId)
    const specification = campaignSpec(attempt.campaign_id)
    const row = workRow(attempt.work_id, attempt.campaign_id)
    const work = RevalidationWorkItemSchema.parse(JSON.parse(row.payload_json))
    const binding = executorBinding(specification, work)
    const result = buildResult(specification, work, binding, workerResult)
    const resultBytes = Buffer.from(canonicalJson(result))
    if (resultBytes.length > specification.execution_limits.maximum_output_bytes) throw new RevalidationEngineError('resource-exhausted', 'Canonical result exceeds the campaign output limit.')
    const reservationId = `result:${attemptId}`
    reserveStorage(specification.campaign_id, reservationId, resultBytes.length, specification)
    let published
    try {
      published = await objects.put(resultBytes)
      objectMetadata(published)
    } catch (error) {
      releaseStorage(reservationId)
      throw error
    }
    try {
      await options.hooks?.afterResultArtifact?.({ attemptId, result, published })
    } catch (error) {
      releaseStorage(reservationId)
      error.preserveLease = true
      throw error
    }
    const acceptedAt = nowIso()
    try {
      return transaction(database, () => {
        const currentAttempt = attemptRow(attemptId)
        const currentWork = workRow(currentAttempt.work_id, currentAttempt.campaign_id)
        const campaign = database.prepare('SELECT * FROM campaigns WHERE campaign_id = ?').get(currentAttempt.campaign_id)
        const existing = database.prepare('SELECT * FROM accepted_results WHERE campaign_id = ? AND work_id = ?').get(currentAttempt.campaign_id, currentWork.work_id)
        if (existing) {
          if (existing.result_id !== result.result_id || existing.artifact_digest !== published.digest || existing.result_json !== canonicalJson(result)) {
            throw new RevalidationEngineError('conflicting-result', `Work ${currentWork.work_id} already has a different accepted result.`)
          }
          releaseStorage(reservationId)
          return immutable({ accepted: false, idempotent: true, result })
        }
        if (currentWork.cancellation_requested || campaign.cancellation_requested) throw new RevalidationEngineError('cancelled', 'Cancellation won the terminal publication race.')
        if (currentAttempt.state !== 'running' || currentWork.state !== 'running') throw new RevalidationEngineError('invalid-attempt-state', 'Only the currently running leased attempt can publish a result.')
        if (Date.parse(currentAttempt.lease_expires_at) <= nowMilliseconds()) throw new RevalidationEngineError('lease-expired', 'Worker result arrived after its durable lease expired.')
        const measured = measuredExecution(metrics, currentAttempt.execution_mode, true)
        database.prepare('INSERT INTO accepted_results (result_id, campaign_id, work_id, accepted_attempt_id, artifact_digest, artifact_bytes, result_json, execution_mode, peak_rss_bytes, runtime_ms, accepted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
          result.result_id, specification.campaign_id, work.work_id, attemptId, published.digest, published.bytes, canonicalJson(result), currentAttempt.execution_mode, measured.peakRssBytes, measured.runtimeMs, acceptedAt
        )
        database.prepare("UPDATE attempts SET state = 'terminal', outcome = 'succeeded', completed_at = ?, failure_json = NULL, peak_rss_bytes = ?, runtime_ms = ? WHERE attempt_id = ?").run(acceptedAt, measured.peakRssBytes, measured.runtimeMs, attemptId)
        database.prepare("UPDATE work_items SET state = 'terminal', outcome = 'succeeded', failure_json = NULL, accepted_result_id = ?, completed_at = ? WHERE campaign_id = ? AND work_id = ?").run(result.result_id, acceptedAt, specification.campaign_id, work.work_id)
        completeCampaignIfTerminal(specification.campaign_id, acceptedAt)
        bumpProjection(specification.campaign_id)
        releaseStorage(reservationId)
        return immutable({ accepted: true, idempotent: false, result })
      })
    } finally {
      releaseStorage(reservationId)
    }
  }

  function claimWork() {
    return transaction(database, () => {
      const candidates = database.prepare(`SELECT w.campaign_id, MIN(w.available_at) AS available_at FROM work_items w JOIN campaigns c ON c.campaign_id = w.campaign_id
        WHERE w.state = 'queued' AND w.available_at <= ? AND c.state = 'active' AND c.cancellation_requested = 0
        GROUP BY w.campaign_id ORDER BY available_at, w.campaign_id`).all(nowIso())
      let selected = null
      for (const candidate of candidates) {
        const specification = campaignSpec(candidate.campaign_id)
        const activeCount = Number(database.prepare("SELECT COUNT(*) AS count FROM work_items WHERE campaign_id = ? AND state IN ('leased', 'running')").get(candidate.campaign_id).count)
        if (activeCount < specification.execution_limits.maximum_concurrency) {
          selected = database.prepare("SELECT * FROM work_items WHERE campaign_id = ? AND state = 'queued' AND available_at <= ? ORDER BY available_at, ordinal LIMIT 1").get(candidate.campaign_id, nowIso())
          break
        }
      }
      if (!selected) return null
      const specification = campaignSpec(selected.campaign_id)
      const attemptNumber = selected.attempt_count + 1
      const attemptId = campaignAttemptIdentity(selected.campaign_id, selected.work_id, attemptNumber)
      const createdAt = nowIso()
      const leaseExpiresAt = iso(nowMilliseconds() + specification.execution_limits.lease_duration_seconds * 1000)
      database.prepare("INSERT INTO attempts (attempt_id, campaign_id, work_id, attempt_number, state, execution_mode, lease_owner, lease_expires_at, created_at) VALUES (?, ?, ?, ?, 'leased', ?, ?, ?, ?)").run(
        attemptId, selected.campaign_id, selected.work_id, attemptNumber, executionMode, owner, leaseExpiresAt, createdAt
      )
      database.prepare("UPDATE work_items SET state = 'leased', attempt_count = ?, current_attempt_id = ? WHERE campaign_id = ? AND work_id = ?").run(attemptNumber, attemptId, selected.campaign_id, selected.work_id)
      bumpProjection(selected.campaign_id)
      return attemptRecord(attemptRow(attemptId))
    })
  }

  function renewLease(attemptId) {
    return transaction(database, () => {
      const attempt = attemptRow(attemptId)
      if (!['leased', 'running'].includes(attempt.state) || Date.parse(attempt.lease_expires_at) <= nowMilliseconds()) return false
      const specification = campaignSpec(attempt.campaign_id)
      const renewed = iso(nowMilliseconds() + specification.execution_limits.lease_duration_seconds * 1000)
      database.prepare('UPDATE attempts SET lease_expires_at = ? WHERE attempt_id = ?').run(renewed, attemptId)
      bumpProjection(attempt.campaign_id)
      return true
    })
  }

  async function executeAttempt(attemptId) {
    const startedAt = nowIso()
    const start = transaction(database, () => {
      const attempt = attemptRow(attemptId)
      const work = workRow(attempt.work_id, attempt.campaign_id)
      const campaign = database.prepare('SELECT * FROM campaigns WHERE campaign_id = ?').get(attempt.campaign_id)
      if (attempt.state !== 'leased' || work.state !== 'leased') return null
      if (work.cancellation_requested || campaign.cancellation_requested) return { cancelled: true }
      database.prepare("UPDATE attempts SET state = 'running', started_at = ? WHERE attempt_id = ?").run(startedAt, attemptId)
      database.prepare("UPDATE work_items SET state = 'running' WHERE campaign_id = ? AND work_id = ?").run(attempt.campaign_id, work.work_id)
      bumpProjection(attempt.campaign_id)
      return attemptRecord(attemptRow(attemptId))
    })
    if (!start) return
    if (start.cancelled) { finalizeFailure(attemptId, { code: 'cancelled', message: 'Cancellation preceded worker start.' }); return }
    const specification = campaignSpec(start.campaign_id)
    const work = RevalidationWorkItemSchema.parse(JSON.parse(workRow(start.work_id, start.campaign_id).payload_json))
    const binding = executorBinding(specification, work)
    const inputs = await loadInputs(specification)
    const checkpoint = await compatibleCheckpoint(specification, work, binding)
    const request = {
      type: 'execute',
      executor_id: binding.executor_id,
      executor_version: binding.executor_version,
      campaign: specification,
      work,
      attempt_number: start.attempt_number,
      inputs,
      checkpoint
    }
    if (closing) return
    const launch = transaction(database, () => {
      const currentAttempt = attemptRow(attemptId)
      const currentWork = workRow(currentAttempt.work_id, currentAttempt.campaign_id)
      const campaign = database.prepare('SELECT cancellation_requested FROM campaigns WHERE campaign_id = ?').get(currentAttempt.campaign_id)
      return currentAttempt.state === 'running' && currentWork.state === 'running' && !currentWork.cancellation_requested && !campaign.cancellation_requested && Date.parse(currentAttempt.lease_expires_at) > nowMilliseconds()
    })
    if (!launch) {
      if (attemptRow(attemptId).state !== 'terminal') finalizeFailure(attemptId, { code: 'cancelled', message: 'Cancellation or lease expiry preceded worker spawn.' })
      return
    }
    const execution = executeWorker(request, {
      maximumOutputBytes: specification.execution_limits.maximum_output_bytes,
      timeoutMs: Math.min(specification.resource_profile.maximum_runtime_seconds * 1000, options.maximumWorkerRuntimeMs ?? Number.MAX_SAFE_INTEGER),
      memoryMib: specification.resource_profile.memory_mib
    })
    active.set(attemptId, execution)
    const renewEvery = Math.max(1000, Math.floor(specification.execution_limits.lease_duration_seconds * 1000 / 3))
    const leaseRenewal = setInterval(() => {
      if (!renewLease(attemptId)) execution.interrupt()
    }, renewEvery)
    leaseRenewal.unref?.()
    const outcome = await execution.promise
    clearInterval(leaseRenewal)
    active.delete(attemptId)
    if (closing) return
    const current = attemptRow(attemptId)
    if (current.state === 'terminal') return
    if (outcome.type === 'failure') {
      if (outcome.failure.checkpoint !== null) await publishCheckpoint(start, specification, work, binding, outcome.failure.checkpoint)
      finalizeFailure(attemptId, outcome.failure, outcome.metrics)
      return
    }
    try {
      await acceptResult(attemptId, outcome.result, outcome.metrics)
    } catch (error) {
      if (error.preserveLease) throw error
      if (error.code === 'cancelled') finalizeFailure(attemptId, { code: 'cancelled', message: error.message }, outcome.metrics)
      else if (error.code === 'resource-exhausted') finalizeFailure(attemptId, { code: 'resource-exhausted', message: error.message }, outcome.metrics)
      else if (error.code === 'lease-expired') finalizeFailure(attemptId, { code: 'lease-expired', message: error.message }, outcome.metrics)
      else throw error
    }
  }

  function nextWake() {
    const queued = database.prepare("SELECT MIN(available_at) AS value FROM work_items WHERE state = 'queued'").get().value
    const leased = database.prepare("SELECT MIN(lease_expires_at) AS value FROM attempts WHERE state IN ('leased', 'running')").get().value
    const queuedRemaining = queued ? Date.parse(queued) - nowMilliseconds() : null
    const candidates = [
      ...(queuedRemaining === null || (queuedRemaining <= 0 && running > 0) ? [] : [queuedRemaining]),
      ...(leased ? [Date.parse(leased) - nowMilliseconds()] : [])
    ]
    if (!candidates.length) return
    const remaining = Math.min(...candidates)
    const delay = Math.max(1, Math.min(2147483647, remaining))
    clearTimeout(wakeTimer)
    wakeTimer = setTimeout(schedule, delay)
  }

  function schedule() {
    if (!started || scheduling || closing) return
    scheduling = true
    queueMicrotask(() => {
      scheduling = false
      recoverExpiredLeases(false)
      while (!closing && running < maximumConcurrency) {
        const attempt = claimWork()
        if (!attempt) break
        running += 1
        const task = executeAttempt(attempt.attempt_id).catch((error) => {
          active.delete(attempt.attempt_id)
          if (!error.preserveLease && attemptRow(attempt.attempt_id).state !== 'terminal') finalizeFailure(attempt.attempt_id, { code: 'engine-failure', message: error.message })
        }).finally(() => {
          running -= 1
          tasks.delete(task)
          schedule()
        })
        tasks.add(task)
      }
      nextWake()
    })
  }

  function recoverAttempts(rows, code, message, reschedule = true) {
    for (const row of rows) {
      active.get(row.attempt_id)?.interrupt()
      finalizeFailure(row.attempt_id, { code, message })
    }
    if (reschedule) schedule()
  }

  function recoverExpiredLeases(reschedule = true) {
    const rows = database.prepare("SELECT * FROM attempts WHERE state IN ('leased', 'running') AND lease_expires_at <= ? ORDER BY created_at").all(nowIso())
    recoverAttempts(rows, 'lease-expired', 'The worker lease expired before terminal publication.', reschedule)
    return rows.length
  }

  function progress(campaignId) {
    campaignSpec(campaignId)
    const counts = Object.fromEntries(database.prepare('SELECT state, outcome, COUNT(*) AS count FROM work_items WHERE campaign_id = ? GROUP BY state, outcome').all(campaignId).map((row) => [`${row.state}:${row.outcome ?? 'none'}`, Number(row.count)]))
    return immutable({
      total: Number(database.prepare('SELECT COUNT(*) AS count FROM work_items WHERE campaign_id = ?').get(campaignId).count),
      queued: counts['queued:none'] ?? 0,
      running: (counts['leased:none'] ?? 0) + (counts['running:none'] ?? 0),
      succeeded: counts['terminal:succeeded'] ?? 0,
      failed: counts['terminal:failed'] ?? 0,
      resource_exhausted: counts['terminal:resource-exhausted'] ?? 0,
      skipped: counts['terminal:cancelled'] ?? 0,
      submitted: Number(database.prepare('SELECT COUNT(*) AS count FROM producer_outcome_receipts WHERE local_campaign_id = ?').get(campaignId).count)
    })
  }

  function projectionSnapshot(campaignId) {
    campaignSpec(campaignId)
    const row = database.prepare('SELECT projection_revision FROM campaigns WHERE campaign_id = ?').get(campaignId)
    return revalidationIdentity({ campaign_id: campaignId, projection_revision: row.projection_revision })
  }

  function workPage(campaignId, { limit = 50, cursor = null } = {}) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new RevalidationEngineError('projection-limit-invalid', 'Campaign projection limit must be an integer from 1 to 100.', 422)
    const snapshotId = projectionSnapshot(campaignId)
    let afterOrdinal = -1
    if (cursor !== null) {
      const decoded = decodeCursor(cursor, projectionCursorSecret)
      const expected = { cursor_schema_version: '1.0.0', contract: 'revalidation-work-page-v1', campaign_id: campaignId, snapshot_id: snapshotId, limit, after_ordinal: decoded.after_ordinal }
      if (!Number.isInteger(decoded.after_ordinal) || canonicalJson(decoded) !== canonicalJson(expected)) throw new RevalidationEngineError('projection-cursor-binding-invalid', 'Campaign projection cursor is bound to a different snapshot, campaign, or limit.')
      afterOrdinal = decoded.after_ordinal
    }
    const rows = database.prepare('SELECT * FROM work_items WHERE campaign_id = ? AND ordinal > ? ORDER BY ordinal LIMIT ?').all(campaignId, afterOrdinal, limit + 1)
    const selected = rows.slice(0, limit)
    const total = Number(database.prepare('SELECT COUNT(*) AS count FROM work_items WHERE campaign_id = ?').get(campaignId).count)
    const nextCursor = rows.length > limit ? encodeCursor({
      cursor_schema_version: '1.0.0',
      contract: 'revalidation-work-page-v1',
      campaign_id: campaignId,
      snapshot_id: snapshotId,
      limit,
      after_ordinal: selected.at(-1).ordinal
    }, projectionCursorSecret) : null
    return immutable({ projection_schema_version: '1.0.0', snapshot_id: snapshotId, total, limit, items: selected.map(workRecord), next_cursor: nextCursor })
  }

  function producerEventPage({ limit = 100, cursor = null } = {}) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new RevalidationEngineError('projection-limit-invalid', 'Producer event page limit must be an integer from 1 to 100.', 422)
    let head = database.prepare('SELECT sequence, event_digest AS digest FROM producer_events ORDER BY sequence DESC LIMIT 1').get() ?? { sequence: 0, digest: null }
    let afterSequence = 0
    if (cursor !== null) {
      const decoded = decodeCursor(cursor, projectionCursorSecret)
      const expected = { cursor_schema_version: '1.0.0', contract: 'local-producer-event-page-v1', head_sequence: decoded.head_sequence, head_digest: decoded.head_digest, limit, after_sequence: decoded.after_sequence }
      if (!Number.isInteger(decoded.after_sequence) || canonicalJson(decoded) !== canonicalJson(expected)) throw new RevalidationEngineError('projection-cursor-binding-invalid', 'Producer event cursor is bound to a different head or limit.')
      const persisted = decoded.head_sequence === 0 ? { digest: null } : database.prepare('SELECT event_digest AS digest FROM producer_events WHERE sequence = ?').get(decoded.head_sequence)
      if (!persisted || persisted.digest !== decoded.head_digest) throw new RevalidationEngineError('projection-cursor-binding-invalid', 'Producer event cursor head is unavailable.')
      head = { sequence: decoded.head_sequence, digest: decoded.head_digest }
      afterSequence = decoded.after_sequence
    }
    const rows = database.prepare('SELECT sequence, event_json FROM producer_events WHERE sequence > ? AND sequence <= ? ORDER BY sequence LIMIT ?').all(afterSequence, head.sequence, limit + 1)
    const selected = rows.slice(0, limit)
    const nextCursor = rows.length > limit ? encodeCursor({
      cursor_schema_version: '1.0.0', contract: 'local-producer-event-page-v1', head_sequence: head.sequence,
      head_digest: head.digest, limit, after_sequence: selected.at(-1).sequence
    }, projectionCursorSecret) : null
    return immutable({
      page_schema_version: '1.0.0', head_sequence: head.sequence, head_digest: head.digest, limit,
      items: selected.map((row) => ProducerSignedEventSchema.parse(JSON.parse(row.event_json))), next_cursor: nextCursor
    })
  }

  async function campaignReport(campaignId, producerEvidence = null) {
    const campaign = database.prepare('SELECT * FROM campaigns WHERE campaign_id = ?').get(campaignId)
    if (!campaign) throw new RevalidationEngineError('campaign-not-found', `Campaign ${campaignId} does not exist.`, 404)
    const specification = campaignSpec(campaignId)
    const planning = {}
    for (const [name, _mediaType, key] of PLANNING_INPUTS) {
      const descriptor = specification.input_artifacts.find((item) => item.name === name)
      planning[key] = JSON.parse((await objects.get(descriptor.digest)).toString('utf8'))
    }
    const plan = verifyImpactPlan({
      dependencySnapshot: planning.dependencySnapshot,
      changeSet: planning.changeSet,
      impactPolicy: planning.impactPolicy,
      impactPlan: planning.impactPlan
    })
    const snapshot = planning.dependencySnapshot
    const impacts = new Map(plan.impacts.map((impact) => [impact.impact_id, impact]))
    const byNodeKind = {}
    const byAction = {}
    for (const work of plan.work_items) {
      const kind = impacts.get(work.impact_id).node_kind
      byNodeKind[kind] = (byNodeKind[kind] ?? 0) + 1
      byAction[work.action] = (byAction[work.action] ?? 0) + 1
    }
    const attempts = database.prepare('SELECT attempt_number, execution_mode, failure_json, peak_rss_bytes, runtime_ms FROM attempts WHERE campaign_id = ? ORDER BY work_id, attempt_number').all(campaignId)
    const recoveryByCode = {}
    for (const attempt of attempts) {
      const selected = parseJson(attempt.failure_json)
      if (selected?.code) recoveryByCode[selected.code] = (recoveryByCode[selected.code] ?? 0) + 1
    }
    const accepted = database.prepare('SELECT work_id, COUNT(*) AS count FROM accepted_results WHERE campaign_id = ? GROUP BY work_id ORDER BY work_id').all(campaignId)
    const missingSuccessful = Number(database.prepare("SELECT COUNT(*) AS count FROM work_items w LEFT JOIN accepted_results r ON r.campaign_id=w.campaign_id AND r.work_id=w.work_id WHERE w.campaign_id=? AND w.outcome='succeeded' AND r.result_id IS NULL").get(campaignId).count)
    const unexpectedAccepted = Number(database.prepare("SELECT COUNT(*) AS count FROM work_items w JOIN accepted_results r ON r.campaign_id=w.campaign_id AND r.work_id=w.work_id WHERE w.campaign_id=? AND w.outcome!='succeeded'").get(campaignId).count)
    const objectProfile = database.prepare(`WITH campaign_objects(digest) AS (
      SELECT specification_digest FROM campaign_specs WHERE campaign_id = ?
      UNION SELECT digest FROM campaign_inputs WHERE campaign_id = ?
      UNION SELECT artifact_digest FROM accepted_results WHERE campaign_id = ?
      UNION SELECT state_digest FROM checkpoints WHERE campaign_id = ?
    ) SELECT COUNT(*) AS count, COALESCE(SUM(o.bytes), 0) AS bytes FROM campaign_objects c JOIN objects o ON o.digest = c.digest`).get(campaignId, campaignId, campaignId, campaignId)
    const progressProfile = progress(campaignId)
    const selectedLocators = new Set(plan.impacts.map((impact) => impact.locator))
    const negativeControls = snapshot.nodes.filter((node) => node.locator.startsWith('registration:negative-control:'))
    const queueIds = database.prepare('SELECT work_id FROM work_items WHERE campaign_id = ? ORDER BY ordinal').all(campaignId).map((row) => row.work_id)
    const allAndOnlyVerified = canonicalJson(queueIds) === canonicalJson(plan.work_items.map((work) => work.work_id)) && canonicalJson(queueIds) === canonicalJson(specification.ordered_work_ids)
    const producer = database.prepare('SELECT producer_campaign_id FROM producer_campaigns WHERE local_campaign_id = ?').get(campaignId)
    let producerLabeledOutcomes = 0
    if (producer) {
      const localHead = database.prepare('SELECT sequence, digest FROM producer_head_pins WHERE local_campaign_id = ? ORDER BY sequence DESC LIMIT 1').get(campaignId)
      if (!producerEvidence || producerEvidence.campaignId !== producer.producer_campaign_id || producerEvidence.head.sequence !== localHead?.sequence || producerEvidence.head.digest !== localHead?.digest || !Number.isInteger(producerEvidence.labeledOutcomes) || producerEvidence.labeledOutcomes < 0) {
        throw new RevalidationEngineError('producer-report-evidence-invalid', 'Campaign report requires the verified producer head and campaign-specific materialized labels.')
      }
      producerLabeledOutcomes = producerEvidence.labeledOutcomes
    }
    const scratchLimitBytes = specification.resource_profile.scratch_mib * 1024 * 1024
    const complete = campaign.state === 'terminal'
    const measuredAttempts = attempts.filter((attempt) => attempt.execution_mode === 'isolated-worker' && attempt.peak_rss_bytes !== null && attempt.runtime_ms !== null)
    const attemptModes = new Set(attempts.map((attempt) => attempt.execution_mode))
    const acceptanceMode = attempts.length > 0 && attemptModes.size === 1 ? attempts[0].execution_mode : 'mixed-or-unrecorded-evidence'
    return immutable({
      report_schema_version: 'goal15-scale-acceptance-v1',
      campaign_id: campaignId,
      technical_execution: {
        state: campaign.state,
        progress: progressProfile,
        selection: {
          direct: plan.impacts.filter((impact) => impact.relation === 'direct').length,
          transitive: plan.impacts.filter((impact) => impact.relation === 'transitive').length,
          by_node_kind: byNodeKind,
          by_action: byAction,
          registration_negative_controls: negativeControls.length,
          registration_controls_selected: negativeControls.filter((node) => selectedLocators.has(node.locator)).length,
          all_and_only_verified: allAndOnlyVerified
        },
        resources: {
          declared: specification.resource_profile,
          execution_limits: specification.execution_limits,
          acceptance: { mode: acceptanceMode, evidence_only: acceptanceMode !== 'isolated-worker' },
          enforcement: {
            cpu: { mode: 'concurrency-ceiling', cpu_time_limit_enforced: false },
            process_rss: { limit_bytes: specification.resource_profile.memory_mib * 1024 * 1024, enforced: measuredAttempts.length > 0, observed_peak_bytes: Math.max(0, ...measuredAttempts.map((attempt) => Number(attempt.peak_rss_bytes))) },
            runtime: { limit_ms: specification.resource_profile.maximum_runtime_seconds * 1000, enforced: measuredAttempts.length > 0, observed_max_ms: Math.max(0, ...measuredAttempts.map((attempt) => Number(attempt.runtime_ms))) },
            output: { limit_bytes: specification.execution_limits.maximum_output_bytes, enforced: true },
            storage: { limit_bytes: scratchLimitBytes, enforced: true }
          }
        },
        recovery: {
          attempts: attempts.length,
          retries: attempts.filter((attempt) => attempt.attempt_number > 1).length,
          by_failure_code: recoveryByCode
        },
        accepted_results: {
          count: accepted.length,
          unique_work_ids: new Set(accepted.map((row) => row.work_id)).size,
          duplicate_work_ids: accepted.filter((row) => Number(row.count) !== 1).length,
          missing_successful_work_ids: missingSuccessful,
          unexpected_non_success_results: unexpectedAccepted,
          exactly_once: complete && accepted.every((row) => Number(row.count) === 1) && missingSuccessful === 0 && unexpectedAccepted === 0
        },
        storage: {
          object_count: Number(objectProfile.count),
          object_bytes: Number(objectProfile.bytes),
          campaign_logical_bytes: campaignLogicalBytes(campaignId),
          campaign_limit_bytes: scratchLimitBytes,
          sqlite_bytes: await fileBytes(resolve(root, 'revalidation.sqlite3')),
          wal_bytes: await fileBytes(resolve(root, 'revalidation.sqlite3-wal'))
        },
        projection: { snapshot_id: projectionSnapshot(campaignId), total: progressProfile.total }
      },
      scientific_review: {
        support: complete ? 'unsupported' : 'pending-technical-execution',
        review_required: complete,
        automatically_accepted: false,
        producer_labeled_outcomes: producerLabeledOutcomes
      }
    })
  }

  async function verifyStoredCampaign(row) {
    const specificationBytes = await objects.get(row.specification_digest)
    if (specificationBytes.toString('utf8') !== row.specification_json) throw new RevalidationEngineError('campaign-corrupt', `Campaign ${row.campaign_id} specification bytes drifted.`)
    const specification = CampaignSpecificationSchema.parse(JSON.parse(row.specification_json))
    const inputRows = database.prepare('SELECT * FROM campaign_inputs WHERE campaign_id = ? ORDER BY name').all(row.campaign_id)
    if (canonicalJson(inputRows.map((item) => ({ name: item.name, digest: item.digest, bytes: item.bytes, media_type: item.media_type }))) !== canonicalJson(specification.input_artifacts)) throw new RevalidationEngineError('campaign-corrupt', `Campaign ${row.campaign_id} input index drifted.`)
    const inputBytes = new Map()
    for (const descriptor of specification.input_artifacts) {
      const bytes = await objects.get(descriptor.digest)
      if (bytes.length !== descriptor.bytes) throw new RevalidationEngineError('campaign-corrupt', `Campaign ${row.campaign_id} input ${descriptor.name} byte length drifted.`)
      inputBytes.set(descriptor.name, bytes)
    }
    const decoded = {}
    for (const [name, _mediaType, key] of PLANNING_INPUTS) {
      const descriptor = specification.input_artifacts.find((item) => item.name === name)
      if (!descriptor) throw new RevalidationEngineError('campaign-corrupt', `Campaign ${row.campaign_id} lacks ${name}.`)
      const bytes = inputBytes.get(descriptor.name)
      if (bytes.length !== descriptor.bytes || canonicalJson(JSON.parse(bytes.toString('utf8'))) !== bytes.toString('utf8')) throw new RevalidationEngineError('campaign-corrupt', `Campaign ${row.campaign_id} ${name} is not canonical.`)
      decoded[key] = JSON.parse(bytes.toString('utf8'))
    }
    const plan = verifyImpactPlan({
      dependencySnapshot: decoded.dependencySnapshot,
      changeSet: decoded.changeSet,
      impactPolicy: decoded.impactPolicy,
      impactPlan: decoded.impactPlan
    })
    verifyCampaignSpecification(specification, plan)
    const workRows = database.prepare('SELECT * FROM work_items WHERE campaign_id = ? ORDER BY ordinal').all(row.campaign_id)
    if (canonicalJson(workRows.map((item) => item.work_id)) !== canonicalJson(specification.ordered_work_ids)) throw new RevalidationEngineError('campaign-corrupt', `Campaign ${row.campaign_id} queue closure drifted.`)
    for (const workRowValue of workRows) {
      const work = RevalidationWorkItemSchema.parse(JSON.parse(workRowValue.payload_json))
      if (canonicalJson(work) !== canonicalJson(plan.work_items[workRowValue.ordinal])) throw new RevalidationEngineError('campaign-corrupt', `Campaign ${row.campaign_id} work payload drifted.`)
      const attempts = database.prepare('SELECT * FROM attempts WHERE campaign_id = ? AND work_id = ? ORDER BY attempt_number').all(row.campaign_id, work.work_id)
      if (attempts.length !== workRowValue.attempt_count) throw new RevalidationEngineError('campaign-corrupt', `Campaign ${row.campaign_id} attempt count drifted for ${work.work_id}.`)
      attempts.forEach((attempt, index) => {
        const expectedNumber = index + 1
        if (attempt.attempt_number !== expectedNumber || attempt.attempt_id !== campaignAttemptIdentity(row.campaign_id, work.work_id, expectedNumber)) throw new RevalidationEngineError('campaign-corrupt', `Campaign ${row.campaign_id} attempt identity drifted for ${work.work_id}.`)
      })
      const activeAttempt = attempts.find((attempt) => attempt.state !== 'terminal')
      if ((activeAttempt?.attempt_id ?? null) !== (workRowValue.state === 'leased' || workRowValue.state === 'running' ? workRowValue.current_attempt_id : null)) throw new RevalidationEngineError('campaign-corrupt', `Campaign ${row.campaign_id} active attempt binding drifted for ${work.work_id}.`)
      if (activeAttempt && activeAttempt.state !== workRowValue.state) throw new RevalidationEngineError('campaign-corrupt', `Campaign ${row.campaign_id} active state drifted for ${work.work_id}.`)
    }
    const accepted = database.prepare('SELECT * FROM accepted_results WHERE campaign_id = ? ORDER BY work_id').all(row.campaign_id)
    const acceptedByWork = new Map(accepted.map((item) => [item.work_id, item]))
    const workRowsById = new Map(workRows.map((item) => [item.work_id, item]))
    for (const resultRow of accepted) {
      const bytes = await objects.get(resultRow.artifact_digest)
      if (bytes.length !== resultRow.artifact_bytes || bytes.toString('utf8') !== resultRow.result_json) throw new RevalidationEngineError('result-corrupt', `Accepted result ${resultRow.result_id} artifact drifted.`)
      const result = CampaignResultSchema.parse(JSON.parse(resultRow.result_json))
      if (result.result_id !== revalidationIdentity(identityPayload(result, 'result_id')) || result.work_id !== resultRow.work_id || result.campaign_id !== row.campaign_id) throw new RevalidationEngineError('result-corrupt', `Accepted result ${resultRow.result_id} identity drifted.`)
      const workRowValue = workRowsById.get(result.work_id)
      if (!workRowValue) throw new RevalidationEngineError('result-corrupt', `Accepted result ${resultRow.result_id} references unknown work.`)
      const work = RevalidationWorkItemSchema.parse(JSON.parse(workRowValue.payload_json))
      const binding = executorBinding(specification, work)
      if (canonicalJson(result.executor) !== canonicalJson({ id: binding.executor_id, version: binding.executor_version }) || canonicalJson(result.input_artifact_digests) !== canonicalJson(specification.input_artifacts.map((item) => item.digest))) throw new RevalidationEngineError('result-corrupt', `Accepted result ${resultRow.result_id} closure drifted.`)
      const acceptedAttempt = database.prepare('SELECT execution_mode, peak_rss_bytes, runtime_ms FROM attempts WHERE attempt_id = ?').get(resultRow.accepted_attempt_id)
      if (!acceptedAttempt || resultRow.execution_mode !== acceptedAttempt.execution_mode || resultRow.peak_rss_bytes !== acceptedAttempt.peak_rss_bytes || resultRow.runtime_ms !== acceptedAttempt.runtime_ms) throw new RevalidationEngineError('result-corrupt', `Accepted result ${resultRow.result_id} execution evidence drifted.`)
      if (workRowValue.accepted_result_id !== result.result_id || workRowValue.state !== 'terminal' || workRowValue.outcome !== 'succeeded') throw new RevalidationEngineError('result-corrupt', `Accepted result ${resultRow.result_id} queue binding drifted.`)
    }
    for (const workRowValue of workRows) {
      const acceptedCount = acceptedByWork.has(workRowValue.work_id) ? 1 : 0
      if ((workRowValue.outcome === 'succeeded') !== (acceptedCount === 1) || acceptedCount > 1) throw new RevalidationEngineError('result-corrupt', `Work ${workRowValue.work_id} accepted-result cardinality drifted.`)
    }
    const campaign = database.prepare('SELECT * FROM campaigns WHERE campaign_id = ?').get(row.campaign_id)
    const terminalQueue = workRows.every((item) => item.state === 'terminal')
    if ((campaign.state === 'terminal') !== terminalQueue) throw new RevalidationEngineError('campaign-corrupt', `Campaign ${row.campaign_id} terminal state drifted.`)
    for (const checkpointRow of database.prepare('SELECT * FROM checkpoints WHERE campaign_id = ? ORDER BY checkpoint_id').all(row.campaign_id)) {
      const checkpoint = CampaignCheckpointSchema.parse(JSON.parse(checkpointRow.checkpoint_json))
      const stateBytes = await objects.get(checkpoint.state_digest)
      if (checkpoint.checkpoint_id !== revalidationIdentity(identityPayload(checkpoint, 'checkpoint_id'))) throw new RevalidationEngineError('checkpoint-corrupt', `Checkpoint ${checkpoint.checkpoint_id} identity drifted.`)
      if (canonicalJson(JSON.parse(stateBytes.toString('utf8'))) !== stateBytes.toString('utf8')) throw new RevalidationEngineError('checkpoint-corrupt', `Checkpoint ${checkpoint.checkpoint_id} state is not canonical.`)
      const workRowValue = workRowsById.get(checkpoint.work_id)
      if (!workRowValue) throw new RevalidationEngineError('checkpoint-corrupt', `Checkpoint ${checkpoint.checkpoint_id} references unknown work.`)
      const work = RevalidationWorkItemSchema.parse(JSON.parse(workRowValue.payload_json))
      const binding = executorBinding(specification, work)
      if (binding.checkpoint_mode !== 'exact-input-closure' || checkpoint.compatibility_id !== campaignCompatibilityIdentity(specification, work, binding)) throw new RevalidationEngineError('checkpoint-corrupt', `Checkpoint ${checkpoint.checkpoint_id} compatibility drifted.`)
    }
    const producer = database.prepare('SELECT * FROM producer_campaigns WHERE local_campaign_id = ?').get(row.campaign_id)
    if (producer) {
      const campaign = ProducerCampaignResponseSchema.parse(JSON.parse(producer.campaign_json))
      const receipt = ProducerCampaignReceiptSchema.parse(JSON.parse(producer.receipt_json))
      if (campaign.specification.campaign_id !== revalidationIdentity(identityPayload(campaign.specification, 'campaign_id')) || campaign.specification.campaign_id !== producer.producer_campaign_id || campaign.plan.plan_id !== producer.producer_plan_id || campaign.plan.plan_id !== plan.plan_id || receipt.campaign_id !== producer.producer_campaign_id || receipt.event_sequence !== producer.event_sequence) throw new RevalidationEngineError('producer-binding-corrupt', `Campaign ${row.campaign_id} producer binding drifted.`)
      const event = database.prepare('SELECT event_json FROM producer_events WHERE sequence = ? AND event_digest = ?').get(producer.event_sequence, producer.event_digest)
      if (!event) throw new RevalidationEngineError('producer-binding-corrupt', `Campaign ${row.campaign_id} producer event is missing.`)
      for (const outcomeRow of database.prepare('SELECT * FROM producer_outcome_receipts WHERE local_campaign_id = ? ORDER BY work_id').all(row.campaign_id)) {
        const outcomeReceipt = ProducerOutcomeReceiptSchema.parse(JSON.parse(outcomeRow.receipt_json))
        if (outcomeReceipt.outcome.outcome_id !== revalidationIdentity(identityPayload(outcomeReceipt.outcome, 'outcome_id')) || outcomeReceipt.outcome.outcome_id !== outcomeRow.outcome_id || outcomeReceipt.outcome.work_id !== outcomeRow.work_id || outcomeReceipt.outcome.campaign_id !== producer.producer_campaign_id || outcomeReceipt.event_sequence !== outcomeRow.event_sequence) throw new RevalidationEngineError('producer-receipt-corrupt', `Producer outcome receipt for ${outcomeRow.work_id} drifted.`)
        if (!database.prepare('SELECT 1 FROM producer_events WHERE sequence = ? AND event_digest = ?').get(outcomeRow.event_sequence, outcomeRow.event_digest)) throw new RevalidationEngineError('producer-receipt-corrupt', `Producer outcome event for ${outcomeRow.work_id} is missing.`)
      }
      const latestHead = database.prepare('SELECT sequence, digest FROM producer_head_pins WHERE local_campaign_id = ? ORDER BY sequence DESC LIMIT 1').get(row.campaign_id)
      if (!latestHead || !database.prepare('SELECT 1 FROM producer_events WHERE sequence = ? AND event_digest = ?').get(latestHead.sequence, latestHead.digest)) throw new RevalidationEngineError('producer-head-corrupt', `Campaign ${row.campaign_id} producer head pin drifted.`)
    }
  }

  try {
    for (const row of database.prepare('SELECT * FROM campaign_specs ORDER BY campaign_id').all()) await verifyStoredCampaign(row)
    const abandoned = database.prepare("SELECT * FROM attempts WHERE state IN ('leased', 'running') ORDER BY created_at").all()
    recoverAttempts(abandoned, 'worker-lost', 'The owning process stopped before terminal publication.')
  } catch (error) {
    database.close()
    engineRootLock.release()
    throw error instanceof RevalidationEngineError ? error : new RevalidationEngineError('integrity-failed', error.message)
  }

  if (started) schedule()

  return {
    root,
    start() { started = true; schedule() },
    async close() {
      closing = true
      clearTimeout(wakeTimer)
      for (const execution of active.values()) execution.interrupt()
      await Promise.allSettled([...tasks])
      await workerPool?.close()
      database.close()
      engineRootLock.release()
    },
    async createCampaign(input) {
      const plan = verifyImpactPlan({
        dependencySnapshot: input.dependencySnapshot,
        changeSet: input.changeSet,
        impactPolicy: input.impactPolicy,
        impactPlan: input.impactPlan
      })
      const sourceArtifacts = PLANNING_INPUTS.map(([name, mediaType, key]) => ({ name, mediaType, bytes: Buffer.from(canonicalJson(input[key])) }))
      for (const artifact of input.inputArtifacts ?? []) sourceArtifacts.push({ name: artifact.name, mediaType: artifact.mediaType, bytes: Buffer.from(artifact.bytes) })
      sourceArtifacts.sort((left, right) => left.name.localeCompare(right.name))
      if (new Set(sourceArtifacts.map((item) => item.name)).size !== sourceArtifacts.length) throw new RevalidationEngineError('duplicate-input', 'Campaign input artifact names must be unique.')
      const inputBytes = sourceArtifacts.reduce((total, artifact) => total + artifact.bytes.length, 0)
      if (inputBytes > input.resourceProfile.scratch_mib * 1024 * 1024) throw new RevalidationEngineError('resource-exhausted', 'Campaign inputs exceed the scratch resource bound.')
      const descriptors = []
      const publications = new Map()
      for (const artifact of sourceArtifacts) {
        const published = await objects.put(artifact.bytes)
        objectMetadata(published)
        publications.set(artifact.name, published)
        descriptors.push({ name: artifact.name, digest: published.digest, bytes: published.bytes, media_type: artifact.mediaType })
      }
      const bindings = structuredClone(input.executorBindings).sort((left, right) => left.expected_artifact_class.localeCompare(right.expected_artifact_class))
      for (const binding of bindings) {
        if (REVALIDATION_EXECUTOR_ALLOWLIST[binding.executor_id] !== binding.executor_version) throw new RevalidationEngineError('executor-not-allowlisted', `Executor ${binding.executor_id}@${binding.executor_version} is not allowlisted.`)
        if (binding.executor_id === 'test-deterministic' && env.NODE_ENV !== 'test') throw new RevalidationEngineError('test-executor-forbidden', 'The deterministic test executor is disabled outside tests.')
      }
      const specification = createCampaignSpecification({
        producerPlan: plan,
        producerCampaign: input.producerCampaign,
        resourceProfile: input.resourceProfile,
        retryPolicy: { ...input.retryPolicy, retryable_failure_codes: [...input.retryPolicy.retryable_failure_codes].sort() },
        executionLimits: input.executionLimits,
        executorBindings: bindings,
        inputArtifacts: descriptors
      })
      const specificationBytes = Buffer.from(canonicalJson(specification))
      const specificationObject = await objects.put(specificationBytes)
      objectMetadata(specificationObject)
      const existing = database.prepare('SELECT specification_json FROM campaign_specs WHERE campaign_id = ?').get(specification.campaign_id)
      if (existing) {
        if (existing.specification_json !== canonicalJson(specification)) throw new RevalidationEngineError('campaign-conflict', 'Campaign identity already exists with different bytes.')
        return this.getCampaign(specification.campaign_id)
      }
      const createdAt = nowIso()
      transaction(database, () => {
        database.prepare('INSERT INTO campaign_specs VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
          specification.campaign_id,
          specificationObject.digest,
          canonicalJson(specification),
          publications.get('impact-plan.json').digest,
          publications.get('dependency-snapshot.json').digest,
          publications.get('change-set.json').digest,
          publications.get('impact-policy.json').digest,
          createdAt
        )
        database.prepare("INSERT INTO campaigns (campaign_id, state, cancellation_requested, projection_revision, created_at, completed_at) VALUES (?, 'active', 0, 0, ?, NULL)").run(specification.campaign_id, createdAt)
        for (const descriptor of descriptors) database.prepare('INSERT INTO campaign_inputs VALUES (?, ?, ?, ?, ?)').run(specification.campaign_id, descriptor.name, descriptor.digest, descriptor.bytes, descriptor.media_type)
        plan.work_items.forEach((work, ordinal) => database.prepare("INSERT INTO work_items (work_id, campaign_id, ordinal, payload_json, state, available_at) VALUES (?, ?, ?, ?, 'queued', ?)").run(work.work_id, specification.campaign_id, ordinal, canonicalJson(work), createdAt))
      })
      schedule()
      return this.getCampaign(specification.campaign_id)
    },
    getCampaign(campaignId) {
      const row = database.prepare('SELECT c.*, s.specification_json FROM campaigns c JOIN campaign_specs s ON s.campaign_id = c.campaign_id WHERE c.campaign_id = ?').get(campaignId)
      if (!row) throw new RevalidationEngineError('campaign-not-found', `Campaign ${campaignId} does not exist.`, 404)
      return immutable({
        campaign_id: row.campaign_id,
        state: row.state,
        cancellation_requested: Boolean(row.cancellation_requested),
        created_at: row.created_at,
        completed_at: row.completed_at,
        specification: campaignSpec(campaignId),
        work: database.prepare('SELECT * FROM work_items WHERE campaign_id = ? ORDER BY ordinal').all(campaignId).map(workRecord)
      })
    },
    campaignState(campaignId) {
      const row = database.prepare('SELECT campaign_id, state, cancellation_requested, created_at, completed_at FROM campaigns WHERE campaign_id = ?').get(campaignId)
      if (!row) throw new RevalidationEngineError('campaign-not-found', `Campaign ${campaignId} does not exist.`, 404)
      return immutable({ ...row, cancellation_requested: Boolean(row.cancellation_requested) })
    },
    progress,
    workPage,
    producerEventPage,
    campaignReport,
    async campaignPlan(campaignId) {
      const specification = campaignSpec(campaignId)
      const descriptor = specification.input_artifacts.find((item) => item.name === 'impact-plan.json')
      if (!descriptor) throw new RevalidationEngineError('campaign-corrupt', 'Campaign impact plan artifact is missing.')
      return JSON.parse((await objects.get(descriptor.digest)).toString('utf8'))
    },
    recordProducerCampaign({ localCampaignId, campaign, receipt, events, event }) {
      campaignSpec(localCampaignId)
      const producerCampaign = ProducerCampaignResponseSchema.parse(campaign)
      const producerReceipt = ProducerCampaignReceiptSchema.parse(receipt)
      const signedEvent = ProducerSignedEventSchema.parse(event)
      const expectedPayload = { action: 'campaign-created', campaign_id: producerReceipt.campaign_id, plan_id: producerCampaign.plan.plan_id }
      if (producerReceipt.campaign_id !== producerCampaign.specification.campaign_id || producerReceipt.event_sequence !== signedEvent.sequence || signedEvent.event_digest !== revalidationIdentity(producerEventBody(signedEvent)) || canonicalJson(signedEvent.payload) !== canonicalJson(expectedPayload)) throw new RevalidationEngineError('producer-binding-invalid', 'Producer campaign receipt/event binding is invalid.')
      const localSpecification = campaignSpec(localCampaignId)
      if (canonicalJson(localSpecification.producer_campaign) !== canonicalJson({ campaign_id: producerCampaign.specification.campaign_id, name: producerCampaign.specification.name, reason: producerCampaign.specification.reason })) throw new RevalidationEngineError('producer-binding-invalid', 'Local campaign identity does not bind the producer campaign name and reason.')
      const campaignJson = canonicalJson(producerCampaign)
      const receiptJson = canonicalJson(producerReceipt)
      transaction(database, () => {
        persistProducerEvents(events)
        const existing = database.prepare('SELECT * FROM producer_campaigns WHERE local_campaign_id = ?').get(localCampaignId)
        if (existing) {
          if (existing.producer_campaign_id !== producerCampaign.specification.campaign_id || existing.campaign_json !== campaignJson || normalizedReceiptJson(JSON.parse(existing.receipt_json)) !== normalizedReceiptJson(producerReceipt) || existing.event_digest !== signedEvent.event_digest) throw new RevalidationEngineError('producer-campaign-conflict', 'Local campaign is already bound to different producer content.')
        } else {
          database.prepare('INSERT INTO producer_campaigns VALUES (?, ?, ?, ?, ?, ?, ?)').run(localCampaignId, producerCampaign.specification.campaign_id, producerCampaign.plan.plan_id, campaignJson, receiptJson, signedEvent.sequence, signedEvent.event_digest)
        }
        database.prepare('INSERT OR IGNORE INTO producer_head_pins VALUES (?, ?, ?, ?)').run(localCampaignId, signedEvent.sequence, signedEvent.event_digest, nowIso())
      })
      return this.producerBinding(localCampaignId)
    },
    recordProducerOutcome(value) {
      return this.recordProducerOutcomes([value])[0]
    },
    recordProducerOutcomes(values) {
      if (!Array.isArray(values) || values.length < 1 || values.length > 100) throw new RevalidationEngineError('producer-receipt-batch-invalid', 'Producer outcome persistence requires between 1 and 100 receipts.')
      const localCampaignId = values[0].localCampaignId
      const producer = database.prepare('SELECT * FROM producer_campaigns WHERE local_campaign_id = ?').get(localCampaignId)
      if (!producer) throw new RevalidationEngineError('producer-campaign-missing', 'Local campaign has no verified producer binding.')
      const prepared = values.map(({ localCampaignId: selectedCampaignId, workId, request, receipt, events, event }) => {
        if (selectedCampaignId !== localCampaignId) throw new RevalidationEngineError('producer-receipt-batch-invalid', 'Producer outcome batch spans local campaigns.')
        workRow(workId, localCampaignId)
        const producerReceipt = ProducerOutcomeReceiptSchema.parse(receipt)
        const signedEvent = ProducerSignedEventSchema.parse(event)
        const expectedPayload = { action: 'outcome-recorded', campaign_id: producer.producer_campaign_id, work_id: workId, outcome_id: producerReceipt.outcome.outcome_id }
        if (producerReceipt.outcome.campaign_id !== producer.producer_campaign_id || producerReceipt.outcome.work_id !== workId || producerReceipt.event_sequence !== signedEvent.sequence || signedEvent.event_digest !== revalidationIdentity(producerEventBody(signedEvent)) || canonicalJson(signedEvent.payload) !== canonicalJson(expectedPayload)) throw new RevalidationEngineError('producer-receipt-invalid', 'Producer outcome receipt/event binding is invalid.')
        return { events, producerReceipt, receiptJson: canonicalJson(producerReceipt), request, requestJson: canonicalJson(request), signedEvent, workId }
      })
      transaction(database, () => {
        for (const item of prepared) {
          persistProducerEvents(item.events)
          const existing = database.prepare('SELECT * FROM producer_outcome_receipts WHERE local_campaign_id = ? AND work_id = ?').get(localCampaignId, item.workId)
          if (existing) {
            if (existing.outcome_id !== item.producerReceipt.outcome.outcome_id || normalizedProducerRequestJson(JSON.parse(existing.request_json)) !== normalizedProducerRequestJson(item.request) || normalizedReceiptJson(JSON.parse(existing.receipt_json)) !== normalizedReceiptJson(item.producerReceipt) || existing.event_digest !== item.signedEvent.event_digest) throw new RevalidationEngineError('producer-outcome-conflict', 'Work is already bound to a different producer outcome receipt.')
          } else {
            database.prepare('INSERT INTO producer_outcome_receipts VALUES (?, ?, ?, ?, ?, ?, ?)').run(localCampaignId, item.workId, item.producerReceipt.outcome.outcome_id, item.requestJson, item.receiptJson, item.signedEvent.sequence, item.signedEvent.event_digest)
          }
          database.prepare('INSERT OR IGNORE INTO producer_head_pins VALUES (?, ?, ?, ?)').run(localCampaignId, item.signedEvent.sequence, item.signedEvent.event_digest, nowIso())
        }
        bumpProjection(localCampaignId)
      })
      return prepared.map((item) => immutable({ request: item.request, receipt: item.producerReceipt, event_sequence: item.signedEvent.sequence, event_digest: item.signedEvent.event_digest }))
    },
    producerBinding(localCampaignId) {
      const row = database.prepare('SELECT * FROM producer_campaigns WHERE local_campaign_id = ?').get(localCampaignId)
      if (!row) return null
      const head = database.prepare('SELECT sequence, digest FROM producer_head_pins WHERE local_campaign_id = ? ORDER BY sequence DESC LIMIT 1').get(localCampaignId)
      if (!producerCampaigns.has(localCampaignId)) producerCampaigns.set(localCampaignId, Object.freeze({
        campaign: ProducerCampaignResponseSchema.parse(JSON.parse(row.campaign_json)),
        receipt: ProducerCampaignReceiptSchema.parse(JSON.parse(row.receipt_json))
      }))
      const fixed = producerCampaigns.get(localCampaignId)
      return immutable({
        local_campaign_id: localCampaignId,
        producer_campaign_id: row.producer_campaign_id,
        producer_plan_id: row.producer_plan_id,
        campaign: fixed.campaign,
        receipt: fixed.receipt,
        event_head: head,
        submitted_outcomes: Number(database.prepare('SELECT COUNT(*) AS count FROM producer_outcome_receipts WHERE local_campaign_id = ?').get(localCampaignId).count)
      })
    },
    producerBindings() {
      return database.prepare('SELECT local_campaign_id FROM producer_campaigns ORDER BY local_campaign_id').all().map((row) => this.producerBinding(row.local_campaign_id))
    },
    producerReceipt(localCampaignId, workId) {
      const row = database.prepare('SELECT * FROM producer_outcome_receipts WHERE local_campaign_id = ? AND work_id = ?').get(localCampaignId, workId)
      return row ? immutable({ request: JSON.parse(row.request_json), receipt: ProducerOutcomeReceiptSchema.parse(JSON.parse(row.receipt_json)), event_sequence: row.event_sequence, event_digest: row.event_digest }) : null
    },
    producerEvents() {
      return database.prepare('SELECT event_json FROM producer_events ORDER BY sequence').all().map((row) => ProducerSignedEventSchema.parse(JSON.parse(row.event_json)))
    },
    recordProducerChain(localCampaignId, events, head) {
      if (!database.prepare('SELECT 1 FROM producer_campaigns WHERE local_campaign_id = ?').get(localCampaignId)) throw new RevalidationEngineError('producer-campaign-missing', 'Local campaign has no verified producer binding.')
      transaction(database, () => {
        persistProducerEvents(events)
        if (head.sequence > 0) database.prepare('INSERT OR IGNORE INTO producer_head_pins VALUES (?, ?, ?, ?)').run(localCampaignId, head.sequence, head.digest, nowIso())
        bumpProjection(localCampaignId)
      })
    },
    producerLabelCount(localCampaignId) {
      const producerCampaignId = database.prepare('SELECT producer_campaign_id FROM producer_campaigns WHERE local_campaign_id = ?').get(localCampaignId)?.producer_campaign_id
      return producerCampaignId ? Number(database.prepare("SELECT COUNT(*) AS count FROM producer_events WHERE json_extract(event_json, '$.payload.action') = 'outcome-labeled' AND json_extract(event_json, '$.payload.campaign_id') = ?").get(producerCampaignId).count) : 0
    },
    producerReceiptWorkIds(localCampaignId) {
      return new Set(database.prepare('SELECT work_id FROM producer_outcome_receipts WHERE local_campaign_id = ?').all(localCampaignId).map((row) => row.work_id))
    },
    getWork(workId, campaignId) { return workRecord(workRow(workId, campaignId)) },
    attempts(workId, campaignId) {
      const work = workRow(workId, campaignId)
      return database.prepare('SELECT * FROM attempts WHERE campaign_id = ? AND work_id = ? ORDER BY attempt_number').all(work.campaign_id, workId).map(attemptRecord)
    },
    checkpoints(workId, campaignId) {
      const work = workRow(workId, campaignId)
      return database.prepare('SELECT checkpoint_json FROM checkpoints WHERE campaign_id = ? AND work_id = ? ORDER BY created_at, checkpoint_id').all(work.campaign_id, workId).map((row) => CampaignCheckpointSchema.parse(JSON.parse(row.checkpoint_json)))
    },
    async result(workId, campaignId) {
      const work = workRow(workId, campaignId)
      const row = database.prepare('SELECT * FROM accepted_results WHERE campaign_id = ? AND work_id = ?').get(work.campaign_id, workId)
      if (!row) return null
      const bytes = await objects.get(row.artifact_digest)
      if (bytes.toString('utf8') !== row.result_json) throw new RevalidationEngineError('result-corrupt', 'Accepted result artifact failed closure verification.')
      return CampaignResultSchema.parse(JSON.parse(row.result_json))
    },
    resultArtifact(workId, campaignId) {
      const work = workRow(workId, campaignId)
      const row = database.prepare('SELECT result_id, artifact_digest, artifact_bytes, execution_mode, peak_rss_bytes, runtime_ms FROM accepted_results WHERE campaign_id = ? AND work_id = ?').get(work.campaign_id, workId)
      return row ? immutable(row) : null
    },
    cancelWork(workId, campaignId) {
      const completedAt = nowIso()
      const shouldInterrupt = transaction(database, () => {
        const row = workRow(workId, campaignId)
        if (row.state === 'terminal') return false
        database.prepare('UPDATE work_items SET cancellation_requested = 1 WHERE campaign_id = ? AND work_id = ?').run(row.campaign_id, workId)
        if (row.state === 'queued') {
          const cancelledFailure = failure('cancelled', 'Queued work was cancelled before lease acquisition.', false)
          database.prepare("UPDATE work_items SET state = 'terminal', outcome = 'cancelled', failure_json = ?, completed_at = ? WHERE campaign_id = ? AND work_id = ?").run(canonicalJson(cancelledFailure), completedAt, row.campaign_id, workId)
          completeCampaignIfTerminal(row.campaign_id, completedAt)
        }
        bumpProjection(row.campaign_id)
        return row.state === 'leased' || row.state === 'running'
      })
      const row = workRow(workId, campaignId)
      if (shouldInterrupt) active.get(row.current_attempt_id)?.cancel()
      return workRecord(row)
    },
    cancelCampaign(campaignId) {
      const completedAt = nowIso()
      const activeAttemptIds = transaction(database, () => {
        const row = database.prepare('SELECT * FROM campaigns WHERE campaign_id = ?').get(campaignId)
        if (!row) throw new RevalidationEngineError('campaign-not-found', `Campaign ${campaignId} does not exist.`, 404)
        if (row.state === 'terminal') return []
        database.prepare('UPDATE campaigns SET cancellation_requested = 1 WHERE campaign_id = ?').run(campaignId)
        database.prepare("UPDATE work_items SET cancellation_requested = 1 WHERE campaign_id = ? AND state != 'terminal'").run(campaignId)
        const cancelledFailure = canonicalJson(failure('cancelled', 'Queued work was cancelled by one crash-atomic campaign transaction.', false))
        database.prepare("UPDATE work_items SET state = 'terminal', outcome = 'cancelled', failure_json = ?, completed_at = ? WHERE campaign_id = ? AND state = 'queued'").run(cancelledFailure, completedAt, campaignId)
        completeCampaignIfTerminal(campaignId, completedAt)
        bumpProjection(campaignId)
        return database.prepare("SELECT current_attempt_id FROM work_items WHERE campaign_id = ? AND state IN ('leased', 'running') ORDER BY ordinal").all(campaignId).map((work) => work.current_attempt_id)
      })
      for (const attemptId of activeAttemptIds) active.get(attemptId)?.cancel()
      return this.getCampaign(campaignId)
    },
    recoverExpiredLeases,
    acceptResult,
    async integrity(signal) {
      signal?.throwIfAborted()
      for (const row of database.prepare('SELECT * FROM campaign_specs ORDER BY campaign_id').all()) {
        await verifyStoredCampaign(row)
        signal?.throwIfAborted()
      }
      return immutable({ status: 'valid', campaigns: Number(database.prepare('SELECT COUNT(*) AS count FROM campaigns').get().count), accepted_results: Number(database.prepare('SELECT COUNT(*) AS count FROM accepted_results').get().count) })
    },
    testing: options.exposeTesting ? { database, objects, claimWork, executeAttempt, schedule, projectionSnapshot, campaignLogicalBytes, reserveStorage, releaseStorage } : undefined
  }
}
