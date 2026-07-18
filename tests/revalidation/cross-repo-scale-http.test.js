import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runBoundedProcess } from '../fixtures/bounded-process.js'

async function runAcceptance() {
  const result = await runBoundedProcess('nice', ['-n', '10', process.execPath, resolve(process.cwd(), 'tests/revalidation/cross-repo-scale-http-runner.js')], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'test', GOAL15_DIAGNOSTICS: '1', TMPDIR: process.env.GOAL15_ACCEPTANCE_TMPDIR ?? '/dev/shm' },
    timeoutMs: 175_000
  })
  try { return JSON.parse(result.stdout.trim()) }
  catch (error) { throw new Error(`Cross-repository Goal 15 runner returned invalid JSON: ${result.stdout}\n${result.stderr}`, { cause: error }) }
}

describe('Goal 15 full cross-repository HTTP scale acceptance', () => {
  it('loads the configured 1024-work plan and records exactly 1024 HTTP outcomes in a 1029-event ledger', async () => {
    const report = await runAcceptance()
    expect(report).toMatchObject({
      configured_work: 1024,
      local_succeeded: 1024,
      producer_outcomes: 1024,
      unique_producer_work: 1024,
      signed_events: 1029,
      local_signed_events: 1029,
      producer_labels: 0,
      exact_results: true,
      acceptance_mode: 'inline-evidence-only',
      evidence_only: true,
      cpu_time_limit_enforced: false,
      process_rss_enforced: false,
      runtime_enforced: false,
      rss_available: true
    })
  }, 180000)
})
