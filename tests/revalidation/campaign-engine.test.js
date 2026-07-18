import { rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { RevalidationCampaignReportSchema } from '../../shared/revalidation-contracts.js'
import { objectPath } from '../../server/workspace/object-store.js'
import { createRevalidationCampaignEngine } from '../../server/revalidation/service.js'
import { isolatedTestRoot } from '../fixtures/test-root.js'
import { campaignRequest } from './fixture.js'

const roots = []
const engines = []

afterEach(async () => {
  await Promise.allSettled(engines.splice(0).map((engine) => engine.close()))
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

async function root(name) {
  const value = await isolatedTestRoot(name)
  roots.push(value)
  return value
}

async function engine(rootPath, options = {}) {
  const value = await createRevalidationCampaignEngine({
    root: rootPath,
    env: { NODE_ENV: 'test', BIOCHEMICAL_REVALIDATION_CONCURRENCY: '2' },
    maximumWorkerRuntimeMs: 5000,
    exposeTesting: true,
    ...options
  })
  engines.push(value)
  return value
}

async function waitFor(read, predicate, label, attempts = 500) {
  for (let index = 0; index < attempts; index += 1) {
    const value = await read()
    if (predicate(value)) return value
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 10))
  }
  throw new Error(`${label} did not reach its expected state`)
}

const terminalCampaign = (value) => value.state === 'terminal'

describe('Goal 15 durable campaign state machine', () => {
  it('persists WAL/FULL state and traverses queued, leased, running, and terminal with deterministic identities', async () => {
    const rootPath = await root('revalidation-lifecycle')
    const service = await engine(rootPath, { autoStart: false })
    const created = await service.createCampaign(await campaignRequest({ mode: 'delay', delay_ms: 100 }))
    const activeReport = await service.campaignReport(created.campaign_id)
    expect(() => RevalidationCampaignReportSchema.parse(activeReport)).not.toThrow()
    expect(activeReport.scientific_review).toEqual({ support: 'pending-technical-execution', review_required: false, automatically_accepted: false, producer_labeled_outcomes: 0 })
    expect(activeReport.technical_execution.resources.acceptance).toEqual({ mode: 'mixed-or-unrecorded-evidence', evidence_only: true })
    expect(activeReport.technical_execution.resources.enforcement).toMatchObject({ process_rss: { enforced: false, observed_peak_bytes: 0 }, runtime: { enforced: false, observed_max_ms: 0 } })
    expect(service.testing.database.prepare('PRAGMA journal_mode').get().journal_mode).toBe('wal')
    expect(service.testing.database.prepare('PRAGMA synchronous').get().synchronous).toBe(2)
    expect(created.work.every((item) => item.state === 'queued')).toBe(true)
    expect(() => service.testing.database.prepare('UPDATE campaign_specs SET created_at = created_at WHERE campaign_id = ?').run(created.campaign_id)).toThrow(/immutable/)

    const leased = service.testing.claimWork()
    expect(service.getWork(leased.work_id)).toMatchObject({ state: 'leased', attempt_count: 1, current_attempt_id: leased.attempt_id })
    const execution = service.testing.executeAttempt(leased.attempt_id)
    await waitFor(() => service.getWork(leased.work_id), (value) => value.state === 'running', 'work')
    await execution
    expect(service.getWork(leased.work_id)).toMatchObject({ state: 'terminal', outcome: 'succeeded' })
    service.start()
    const terminal = await waitFor(() => service.getCampaign(created.campaign_id), terminalCampaign, 'campaign')
    expect(terminal.work.every((item) => item.outcome === 'succeeded')).toBe(true)
    const terminalReport = await service.campaignReport(created.campaign_id)
    expect(() => RevalidationCampaignReportSchema.parse(terminalReport)).not.toThrow()
    expect(terminalReport.technical_execution.resources.enforcement.runtime.observed_max_ms).toBeGreaterThanOrEqual(0)
    expect(created.campaign_id).toBe('sha256:33d6c86f88583e1bf59f0fe9522da17dcf3609dab28bc6c85a7574b523ebabe2')
    const result = await service.result(leased.work_id)
    expect(result.result_id).toBe('sha256:9011220cf254366077418e670a45c297aa962561e21aa54ab491e6bbfa9281f2')
    expect(result).toMatchObject({ execution_status: 'succeeded', scientific_conclusion: 'review-required' })
    expect(result).not.toHaveProperty('attempt_id')
    expect(await service.integrity()).toEqual({ status: 'valid', campaigns: 1, accepted_results: 6 })
  })

  it('uses monotonic retries and only reuses an exact compatible scientific checkpoint', async () => {
    const rootPath = await root('revalidation-checkpoint')
    const service = await engine(rootPath)
    const created = await service.createCampaign(await campaignRequest({ mode: 'checkpoint-retry' }, { checkpointMode: 'exact-input-closure' }))
    const terminal = await waitFor(() => service.getCampaign(created.campaign_id), terminalCampaign, 'checkpoint campaign', 1000)
    for (const work of terminal.work) {
      expect(service.attempts(work.work_id)).toMatchObject([
        { attempt_number: 1, state: 'terminal', outcome: 'failed', failure: { code: 'transient', retryable: true } },
        { attempt_number: 2, state: 'terminal', outcome: 'succeeded' }
      ])
      expect(service.checkpoints(work.work_id)).toHaveLength(1)
      expect((await service.result(work.work_id)).output.checkpoint_reused).toBe(true)
    }
  })

  it('recovers expired leases and crashed workers into monotonic attempts', async () => {
    let clock = Date.parse('2026-07-17T12:00:00Z')
    const rootPath = await root('revalidation-lease')
    const service = await engine(rootPath, { autoStart: false, nowMilliseconds: () => clock })
    const created = await service.createCampaign(await campaignRequest({ mode: 'success' }, { executionLimits: { lease_duration_seconds: 901 } }))
    const leased = service.testing.claimWork()
    clock += 902000
    service.start()
    await waitFor(() => service.attempts(leased.work_id)[0], (attempt) => attempt?.failure?.code === 'lease-expired', 'automatic lease expiry')
    expect(service.attempts(leased.work_id)[0]).toMatchObject({ outcome: 'failed', failure: { code: 'lease-expired', retryable: true } })
    await waitFor(() => service.getCampaign(created.campaign_id), terminalCampaign, 'lease recovery campaign')
    expect(service.attempts(leased.work_id).map((item) => item.attempt_number)).toEqual([1, 2])

    const crashRoot = await root('revalidation-worker-loss')
    const crashed = await engine(crashRoot)
    const crashCampaign = await crashed.createCampaign(await campaignRequest({ mode: 'crash-once' }))
    await waitFor(() => crashed.getCampaign(crashCampaign.campaign_id), terminalCampaign, 'worker-loss campaign', 1000)
    expect(crashed.attempts(crashCampaign.work[0].work_id)).toMatchObject([
      { attempt_number: 1, failure: { code: 'worker-lost', retryable: true } },
      { attempt_number: 2, outcome: 'succeeded' }
    ])
  })

  it('resolves queued, running, campaign, and post-acceptance cancellation races without accepting cancelled work', async () => {
    const rootPath = await root('revalidation-cancel')
    const service = await engine(rootPath, { autoStart: false })
    const created = await service.createCampaign(await campaignRequest({ mode: 'delay', delay_ms: 300 }))
    const queued = created.work[0]
    expect(service.cancelWork(queued.work_id)).toMatchObject({ state: 'terminal', outcome: 'cancelled' })
    service.start()
    const running = await waitFor(
      () => service.getCampaign(created.campaign_id).work.find((item) => item.state === 'running'),
      Boolean,
      'running work'
    )
    service.cancelWork(running.work_id)
    await waitFor(() => service.getWork(running.work_id), (value) => value.state === 'terminal', 'cancelled work')
    expect(service.getWork(running.work_id).outcome).toBe('cancelled')
    expect(await service.result(running.work_id)).toBeNull()
    const terminal = await waitFor(() => service.getCampaign(created.campaign_id), terminalCampaign, 'mixed cancellation campaign')
    const succeeded = terminal.work.find((item) => item.outcome === 'succeeded')
    expect(service.cancelWork(succeeded.work_id)).toMatchObject({ outcome: 'succeeded', cancellation_requested: false })

    const second = await service.createCampaign(await campaignRequest({ mode: 'delay', delay_ms: 300 }, { retryPolicy: { maximum_attempts: 4 } }))
    service.cancelCampaign(second.campaign_id)
    const cancelled = await waitFor(() => service.getCampaign(second.campaign_id), terminalCampaign, 'cancelled campaign')
    expect(cancelled.state).toBe('terminal')
    expect(cancelled.work.every((item) => item.outcome === 'cancelled')).toBe(true)
  })

  it('enforces resource bindings, campaign concurrency, output limits, and the external-root boundary', async () => {
    await expect(createRevalidationCampaignEngine({ root: resolve(process.cwd(), '.revalidation-inside-source'), env: { NODE_ENV: 'test' } })).rejects.toThrow(/outside the source tree/)
    const rootPath = await root('revalidation-resource')
    const service = await engine(rootPath, { maximumConcurrency: 4 })
    const invalid = await campaignRequest({ mode: 'success' }, { executionLimits: { maximum_concurrency: 3 } })
    await expect(service.createCampaign(invalid)).rejects.toThrow(/concurrency exceeds/)

    const bounded = await service.createCampaign(await campaignRequest({ mode: 'delay', delay_ms: 150 }))
    let observedMaximum = 0
    while (service.getCampaign(bounded.campaign_id).state !== 'terminal') {
      observedMaximum = Math.max(observedMaximum, Number(service.testing.database.prepare("SELECT COUNT(*) AS count FROM work_items WHERE campaign_id = ? AND state = 'running'").get(bounded.campaign_id).count))
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 5))
    }
    expect(observedMaximum).toBeLessThanOrEqual(2)

    const limited = await service.createCampaign(await campaignRequest({ mode: 'large-output', output_bytes: 5000 }, { executionLimits: { maximum_output_bytes: 1024 } }))
    const exhausted = await waitFor(() => service.getCampaign(limited.campaign_id), terminalCampaign, 'output-limited campaign')
    expect(exhausted.work.every((item) => item.outcome === 'resource-exhausted')).toBe(true)
  })

  it('accepts one exact idempotent result delivery per work and rejects a conflicting retry', async () => {
    const rootPath = await root('revalidation-idempotency')
    const service = await engine(rootPath)
    const created = await service.createCampaign(await campaignRequest({ mode: 'success' }))
    const terminal = await waitFor(() => service.getCampaign(created.campaign_id), terminalCampaign, 'idempotent campaign')
    const work = terminal.work[0]
    const attempt = service.attempts(work.work_id)[0]
    const result = await service.result(work.work_id)
    const exact = await service.acceptResult(attempt.attempt_id, {
      execution_status: result.execution_status,
      scientific_conclusion: result.scientific_conclusion,
      output: result.output
    })
    expect(exact).toMatchObject({ accepted: false, idempotent: true, result: { result_id: result.result_id } })
    await expect(service.acceptResult(attempt.attempt_id, {
      execution_status: 'succeeded',
      scientific_conclusion: result.scientific_conclusion,
      output: { conflicting: true }
    })).rejects.toMatchObject({ code: 'conflicting-result' })
    expect(Number(service.testing.database.prepare('SELECT COUNT(*) AS count FROM accepted_results WHERE work_id = ?').get(work.work_id).count)).toBe(1)
  })

  it('atomically reserves scratch capacity across concurrent result publication', async () => {
    const rootPath = await root('revalidation-concurrent-storage')
    const service = await engine(rootPath, { autoStart: false })
    const created = await service.createCampaign(await campaignRequest({ mode: 'success' }))
    const limit = created.specification.resource_profile.scratch_mib * 1024 * 1024
    const available = limit - service.testing.campaignLogicalBytes(created.campaign_id)
    service.testing.reserveStorage(created.campaign_id, 'checkpoint:first', available - 100, created.specification)
    await expect(engine(rootPath, { autoStart: false })).rejects.toThrow(/exclusive owner/)
    expect(service.testing.database.prepare('SELECT COUNT(*) AS count FROM storage_reservations').get().count).toBe(1)
    expect(() => service.testing.reserveStorage(created.campaign_id, 'checkpoint:second', 101, created.specification)).toThrow(/scratch resource bound/)
    service.testing.releaseStorage('checkpoint:first')
    expect(() => service.testing.reserveStorage(created.campaign_id, 'checkpoint:second', 101, created.specification)).not.toThrow()
    service.testing.releaseStorage('checkpoint:second')
    expect(service.testing.database.prepare('SELECT COUNT(*) AS count FROM storage_reservations').get().count).toBe(0)
  })

  it('reports campaign-specific object counts instead of the engine-global CAS inventory', async () => {
    const rootPath = await root('revalidation-campaign-object-counts')
    const service = await engine(rootPath, { autoStart: false })
    const firstRequest = await campaignRequest({ mode: 'success' })
    const secondRequest = await campaignRequest({ mode: 'success' }, {
      producerCampaign: {
        campaign_id: `sha256:${'b'.repeat(64)}`,
        name: 'goal15-second-campaign',
        reason: 'Prove report object counts remain campaign-specific.'
      }
    })
    const first = await service.createCampaign(firstRequest)
    const second = await service.createCampaign(secondRequest)
    const firstReport = await service.campaignReport(first.campaign_id)
    const secondReport = await service.campaignReport(second.campaign_id)
    const globalObjects = Number(service.testing.database.prepare('SELECT COUNT(*) AS count FROM objects').get().count)
    expect(firstReport.technical_execution.storage.object_count).toBe(secondReport.technical_execution.storage.object_count)
    expect(firstReport.technical_execution.storage.object_count).toBeLessThan(globalObjects)
  })
})

describe('Goal 15 restart and artifact closure', () => {
  it('persists inline execution evidence so an isolated restart cannot relabel it as enforced', async () => {
    const rootPath = await root('revalidation-inline-evidence-restart')
    const executeWorker = () => ({
      promise: Promise.resolve({
        type: 'result',
        result: { execution_status: 'succeeded', scientific_conclusion: 'review-required', output: { inline: true } },
        metrics: { peak_rss_bytes: 1234, runtime_ms: 7 }
      }),
      cancel: () => false,
      interrupt: () => false
    })
    let service = await engine(rootPath, { executeWorker })
    const created = await service.createCampaign(await campaignRequest({ mode: 'success' }))
    const terminal = await waitFor(() => service.getCampaign(created.campaign_id), terminalCampaign, 'inline evidence campaign')
    const work = terminal.work[0]
    expect(service.attempts(work.work_id)[0]).toMatchObject({ execution_mode: 'inline-evidence-only', peak_rss_bytes: 1234, runtime_ms: 7 })
    expect(service.resultArtifact(work.work_id)).toMatchObject({ execution_mode: 'inline-evidence-only', peak_rss_bytes: 1234, runtime_ms: 7 })
    await service.close()
    engines.splice(engines.indexOf(service), 1)

    service = await engine(rootPath)
    const report = await service.campaignReport(created.campaign_id)
    expect(report.technical_execution.resources.acceptance).toEqual({ mode: 'inline-evidence-only', evidence_only: true })
    expect(report.technical_execution.resources.enforcement).toMatchObject({ process_rss: { enforced: false }, runtime: { enforced: false } })
    expect(service.attempts(work.work_id)[0]).toMatchObject({ execution_mode: 'inline-evidence-only', peak_rss_bytes: 1234, runtime_ms: 7 })
  })

  it('reuses completed work across restart only after full result closure verification and fails closed on corruption', async () => {
    const rootPath = await root('revalidation-restart')
    let service = await engine(rootPath)
    const created = await service.createCampaign(await campaignRequest({ mode: 'success' }))
    await waitFor(() => service.getCampaign(created.campaign_id), terminalCampaign, 'restart campaign')
    const workId = created.work[0].work_id
    const attemptsBefore = service.attempts(workId).length
    const result = await service.result(workId)
    const artifact = service.testing.database.prepare('SELECT artifact_digest FROM accepted_results WHERE result_id = ?').get(result.result_id)
    await service.close()
    engines.splice(engines.indexOf(service), 1)

    service = await engine(rootPath)
    expect(service.attempts(workId)).toHaveLength(attemptsBefore)
    expect((await service.result(workId)).result_id).toBe(result.result_id)
    await service.close()
    engines.splice(engines.indexOf(service), 1)
    await writeFile(objectPath(rootPath, artifact.artifact_digest), 'corrupt')
    await expect(engine(rootPath)).rejects.toThrow(/content-address|digest|result/i)

    const inputRoot = await root('revalidation-input-corruption')
    service = await engine(inputRoot, { autoStart: false })
    const inputCampaign = await service.createCampaign(await campaignRequest({ mode: 'success' }))
    const inputDescriptor = inputCampaign.specification.input_artifacts.find((item) => item.name === 'test-controls.json')
    await service.close()
    engines.splice(engines.indexOf(service), 1)
    await writeFile(objectPath(inputRoot, inputDescriptor.digest), 'corrupt')
    await expect(engine(inputRoot)).rejects.toThrow(/content-address|digest|campaign/i)
  })
})
