import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createRevalidationCampaignEngine } from '../../server/revalidation/service.js'
import { runBoundedProcess } from '../fixtures/bounded-process.js'
import { isolatedTestRoot } from '../fixtures/test-root.js'
import { campaignRequest } from '../revalidation/fixture.js'

const roots = []
const engines = []

afterEach(async () => {
  await Promise.allSettled(engines.splice(0).map((engine) => engine.close()))
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

async function openEngine(root, options = {}) {
  const engine = await createRevalidationCampaignEngine({
    root,
    env: { NODE_ENV: 'test', BIOCHEMICAL_REVALIDATION_CONCURRENCY: '1' },
    maximumWorkerRuntimeMs: 5_000,
    ...options
  })
  engines.push(engine)
  return engine
}

async function waitFor(read, predicate, label) {
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    const value = await read()
    if (predicate(value)) return value
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 10))
  }
  throw new Error(`${label} did not reach its expected state within 15000 ms`)
}

describe('Goal 15 actual process recovery acceptance', () => {
  it('recovers a subprocess crash after CAS publication and accepts exactly one rerun result', async () => {
    const root = await isolatedTestRoot('revalidation-crash')
    roots.push(root)
    let engine = await openEngine(root, { autoStart: false })
    const created = await engine.createCampaign(await campaignRequest({ mode: 'success' }))
    await engine.close()
    engines.splice(engines.indexOf(engine), 1)

    const crashed = await runBoundedProcess('nice', ['-n', '10', process.execPath, resolve(process.cwd(), 'tests/revalidation/crash-runner.js'), root], {
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'test' },
      timeoutMs: 30_000,
      expectedCode: 73
    })
    expect(crashed.stderr).not.toMatch(/RevalidationEngineError|TypeError/)
    engine = await openEngine(root)
    const terminal = await waitFor(() => engine.getCampaign(created.campaign_id), (campaign) => campaign.state === 'terminal', 'crash recovery campaign')
    expect(terminal.work.every((item) => item.outcome === 'succeeded')).toBe(true)
    expect(engine.attempts(created.work[0].work_id)).toMatchObject([
      { attempt_number: 1, failure: { code: 'worker-lost', retryable: true } },
      { attempt_number: 2, outcome: 'succeeded' }
    ])
    expect((await engine.integrity()).accepted_results).toBe(6)
  }, 45_000)
})
