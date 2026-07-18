import { readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { canonicalJson } from '../../shared/canonical-json.js'
import { GOAL15_SCALE_COUNTS, createGoal15ScaleCampaign } from '../../server/revalidation/scale-campaign.js'
import { createRevalidationCampaignEngine } from '../../server/revalidation/service.js'
import { objectPath } from '../../server/workspace/object-store.js'
import { runBoundedProcess } from '../fixtures/bounded-process.js'
import { isolatedTestRoot } from '../fixtures/test-root.js'
import { campaignRequest, scaleCampaignRequest } from './fixture.js'

const roots = []
const engines = []

afterEach(async () => {
  await Promise.allSettled(engines.splice(0).map((engine) => engine.close()))
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

async function testRoot(name) {
  const value = await isolatedTestRoot(name)
  roots.push(value)
  return value
}

async function openEngine(root, options = {}) {
  const value = await createRevalidationCampaignEngine({
    root,
    env: { NODE_ENV: 'test', BIOCHEMICAL_REVALIDATION_CONCURRENCY: '2' },
    maximumWorkerRuntimeMs: 60000,
    exposeTesting: true,
    ...options
  })
  engines.push(value)
  return value
}

async function killRunningSubprocess(root, campaignId) {
  return runBoundedProcess('nice', ['-n', '10', process.execPath, resolve(process.cwd(), 'tests/revalidation/kill-runner.js'), root, campaignId], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'test' },
    timeoutMs: 30_000,
    killOnStdout: 'RUNNING',
    readySignal: 'SIGKILL',
    expectedSignal: 'SIGKILL'
  })
}

async function waitFor(read, predicate, label, attempts = 12000) {
  for (let index = 0; index < attempts; index += 1) {
    const value = await read()
    if (predicate(value)) return value
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 10))
  }
  throw new Error(`${label} did not reach its expected state`)
}

describe('Goal 15 declared scale acceptance gate', () => {
  it('recovers 1024 durable work IDs through lease expiry, process SIGKILL, retry, restart, and exact acceptance', async () => {
    const planning = createGoal15ScaleCampaign()
    expect(planning.impactPlan.work_items).toHaveLength(GOAL15_SCALE_COUNTS.work_items)
    expect(planning.impactPlan.impacts.filter((impact) => impact.relation === 'direct')).toHaveLength(384)
    expect(planning.impactPlan.impacts.filter((impact) => impact.relation === 'transitive')).toHaveLength(640)
    expect(planning.impactPlan.impacts.some((impact) => impact.locator.startsWith('registration:negative-control:'))).toBe(false)
    expect(planning.dependencySnapshot.snapshot_id).toBe('sha256:97747e9efa483b6dfe980eafd9aac71e641237b59ba93014647e24bfe48f9dfc')
    expect(planning.changeSet.change_set_id).toBe('sha256:a9585aaf4eb1636252d6f90ac8cbe5740e7a8bc436fd301d03b33c8de3764fa0')
    expect(planning.impactPolicy.policy_id).toBe('sha256:d8b572f17b9a44781715b2d2b647e99f7448bbdb82a1614edfd576ff215a3e84')
    expect(planning.impactPlan.plan_id).toBe('sha256:92c376fd835b2a13183908c457964483b8ae0fb976e6e0414848047510fc0241')

    let clock = Date.now()
    const root = await testRoot('revalidation-scale-acceptance')
    let engine = await openEngine(root, { autoStart: false, nowMilliseconds: () => clock })
    const delayedWorkId = planning.impactPlan.work_items[1].work_id
    const transientWorkId = planning.impactPlan.work_items[2].work_id
    const created = await engine.createCampaign(await scaleCampaignRequest({ mode: 'success', delay_ms: 30000, delay_work_id: delayedWorkId, transient_work_id: transientWorkId }))
    const initialPage = engine.workPage(created.campaign_id, { limit: 1 })
    const leased = engine.testing.claimWork()
    await expect(() => engine.workPage(created.campaign_id, { limit: 1, cursor: initialPage.next_cursor })).toThrow(/different snapshot/)
    clock += 902000
    expect(engine.recoverExpiredLeases()).toBe(1)
    const leaseWorkId = leased.work_id
    await engine.close()
    engines.splice(engines.indexOf(engine), 1)

    const killed = await killRunningSubprocess(root, created.campaign_id)
    expect(killed).toMatchObject({ code: null, signal: 'SIGKILL' })
    expect(killed.stderr).not.toMatch(/RevalidationEngineError|TypeError/)

    engine = await openEngine(root, { nowMilliseconds: () => clock })
    await waitFor(() => engine.campaignState(created.campaign_id), (campaign) => campaign.state === 'terminal', 'scale campaign')
    const terminal = engine.getCampaign(created.campaign_id)
    expect(created.campaign_id).toBe('sha256:954baa5a841060dce0ab1d8b41ddb75e0fc47bf9b06686607cd308dfeaf7e692')
    expect(terminal.work).toHaveLength(GOAL15_SCALE_COUNTS.work_items)
    expect(terminal.work.every((work) => work.outcome === 'succeeded')).toBe(true)
    expect(engine.attempts(leaseWorkId, created.campaign_id)).toMatchObject([
      { attempt_number: 1, failure: { code: 'lease-expired', retryable: true } },
      { attempt_number: 2, outcome: 'succeeded' }
    ])
    const workerLost = terminal.work.find((work) => engine.attempts(work.work_id, created.campaign_id).some((attempt) => attempt.failure?.code === 'worker-lost'))
    expect(workerLost).toBeTruthy()
    expect(workerLost.work_id).toBe('sha256:00630aa9546004f4a01d4e8c8c1486a66de316eb99339452ca292689be21be6f')
    expect(leaseWorkId).toBe('sha256:00096428bcdc71982d55f97d1701c1b2a83c60022a5335495e9caabe64289b55')
    expect(transientWorkId).toBe('sha256:0070f3bbc7d3f2d0849e674f6c9005c55c7ee0d7533a623506d4dfd1d6249ca5')
    expect(engine.attempts(workerLost.work_id, created.campaign_id).map((attempt) => attempt.attempt_number)).toEqual([1, 2])
    expect(engine.attempts(transientWorkId, created.campaign_id)).toMatchObject([
      { attempt_number: 1, failure: { code: 'transient', retryable: true } },
      { attempt_number: 2, outcome: 'succeeded' }
    ])

    const fullWorkIds = terminal.work.map((work) => work.work_id)
    const pagedWorkIds = []
    let page = engine.workPage(created.campaign_id, { limit: 1 })
    const snapshotId = page.snapshot_id
    expect(() => engine.workPage(created.campaign_id, { limit: 1, cursor: `${page.next_cursor}x` })).toThrow(/invalid or tampered/)
    while (true) {
      expect(page.snapshot_id).toBe(snapshotId)
      pagedWorkIds.push(...page.items.map((work) => work.work_id))
      if (!page.next_cursor) break
      page = engine.workPage(created.campaign_id, { limit: 1, cursor: page.next_cursor })
    }
    expect(pagedWorkIds).toEqual(fullWorkIds)

    const selected = terminal.work[3]
    const attempt = engine.attempts(selected.work_id, created.campaign_id).at(-1)
    const result = await engine.result(selected.work_id, created.campaign_id)
    await expect(engine.acceptResult(attempt.attempt_id, {
      execution_status: result.execution_status,
      scientific_conclusion: result.scientific_conclusion,
      output: result.output
    })).resolves.toMatchObject({ accepted: false, idempotent: true, result: { result_id: result.result_id } })
    await expect(engine.acceptResult(attempt.attempt_id, {
      execution_status: 'succeeded', scientific_conclusion: 'review-required', output: { conflicting: true }
    })).rejects.toMatchObject({ code: 'conflicting-result' })

    const cancellationRoot = await testRoot('revalidation-scale-cancellation')
    const cancellationEngine = await openEngine(cancellationRoot, { autoStart: false })
    const cancellation = await cancellationEngine.createCampaign(await campaignRequest({ mode: 'delay', delay_ms: 1000 }))
    const cancelledWorkId = cancellation.work[0].work_id
    expect(cancellationEngine.cancelWork(cancelledWorkId, cancellation.campaign_id)).toMatchObject({ state: 'terminal', outcome: 'cancelled' })
    cancellationEngine.cancelCampaign(cancellation.campaign_id)
    expect(cancellationEngine.getCampaign(cancellation.campaign_id).work.every((work) => work.outcome === 'cancelled')).toBe(true)

    const report = await engine.campaignReport(created.campaign_id)
    expect(report.technical_execution.progress).toMatchObject({ total: 1024, succeeded: 1024 })
    expect(report.technical_execution.selection).toMatchObject({
      direct: 384,
      transitive: 640,
      by_node_kind: { run: 384, assertion: 320, report: 320 },
      registration_negative_controls: 64,
      registration_controls_selected: 0,
      all_and_only_verified: true
    })
    expect(report.technical_execution.recovery).toMatchObject({
      attempts: 1027,
      retries: 3,
      by_failure_code: { 'lease-expired': 1, 'worker-lost': 1, transient: 1 }
    })
    expect(report.technical_execution.accepted_results).toEqual({
      count: 1024,
      unique_work_ids: 1024,
      duplicate_work_ids: 0,
      missing_successful_work_ids: 0,
      unexpected_non_success_results: 0,
      exactly_once: true
    })
    expect(report.technical_execution.storage).toMatchObject({ object_count: expect.any(Number), object_bytes: expect.any(Number), sqlite_bytes: expect.any(Number), wal_bytes: expect.any(Number) })
    expect(report.technical_execution.storage.object_count).toBeGreaterThanOrEqual(1029)
    expect(report.technical_execution.storage.object_count).toBeLessThanOrEqual(1100)
    expect(report.technical_execution.storage.object_bytes).toBeLessThanOrEqual(16 * 1024 * 1024)
    expect(report.technical_execution.storage.sqlite_bytes + report.technical_execution.storage.wal_bytes).toBeLessThanOrEqual(256 * 1024 * 1024)
    expect(report.technical_execution.resources.acceptance).toEqual({ mode: 'isolated-worker', evidence_only: false })
    expect(report.technical_execution.resources.enforcement).toMatchObject({ process_rss: { enforced: true }, runtime: { enforced: true } })
    expect(report.scientific_review).toEqual({ support: 'unsupported', review_required: true, automatically_accepted: false, producer_labeled_outcomes: 0 })
    if (process.env.GOAL15_REPORT === 'true') process.stdout.write(`${JSON.stringify({
      campaign_id: created.campaign_id,
      plan_id: planning.impactPlan.plan_id,
      first_work_id: planning.impactPlan.work_items[0].work_id,
      last_work_id: planning.impactPlan.work_items.at(-1).work_id,
      killed_work_id: workerLost.work_id,
      lease_expired_work_id: leaseWorkId,
      transient_retry_work_id: transientWorkId,
      cancelled_campaign_id: cancellation.campaign_id,
      cancelled_work_id: cancelledWorkId,
      report
    })}\n`)

    const artifact = engine.resultArtifact(selected.work_id, created.campaign_id)
    const path = objectPath(root, artifact.artifact_digest)
    const original = await readFile(path)
    await writeFile(path, 'corrupt')
    await expect(engine.integrity()).rejects.toThrow(/content-address|digest|result/i)
    await writeFile(path, original)
    await expect(engine.integrity()).resolves.toMatchObject({ status: 'valid', accepted_results: 1024 })
    expect(canonicalJson(report.scientific_review)).toContain('unsupported')
  }, 180000)
})
