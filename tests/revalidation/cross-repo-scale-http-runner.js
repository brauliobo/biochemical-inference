import { once } from 'node:events'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '../../../biochemical-db/service-js/node_modules/@hono/node-server/dist/index.mjs'
import {
  createGoal15ScaleCampaign,
  createNodeRevalidationAuthorization,
  createRevalidationApp,
  REVALIDATION_CONTRACT_VERSION as PRODUCER_REVALIDATION_CONTRACT_VERSION
} from '../../../biochemical-db/service-js/src/domains/revalidation/index.js'
import { REVALIDATION_CONTRACT_VERSION as INFERENCE_REVALIDATION_CONTRACT_VERSION } from '../../shared/revalidation-contracts.js'
import {
  actors,
  applyLifecycle,
  stateFixture
} from '../../../biochemical-db/service-js/tests/domains/revalidation-state-fixtures.js'
import { createRevalidationProducerClient } from '../../server/revalidation/client.js'
import { assertRssMeasurementAvailable } from '../../server/revalidation/execution.js'
import { createRevalidationIntegrationService } from '../../server/revalidation/integration.js'
import { createRevalidationCampaignEngine } from '../../server/revalidation/service.js'

function assert(value, message) {
  if (!value) throw new Error(message)
}

const diagnostic = (label) => {
  if (process.env.GOAL15_DIAGNOSTICS === '1') process.stderr.write(`[goal15 ${new Date().toISOString()}] ${label}\n`)
}

function inlineExecutor(request) {
  return {
    pid: process.pid,
    promise: Promise.resolve({
      type: 'result',
      result: {
        execution_status: 'succeeded',
        scientific_conclusion: 'review-required',
        output: { work_id: request.work.work_id, closure_verified: true }
      },
      metrics: { peak_rss_bytes: 0, runtime_ms: 0 }
    }),
    cancel: () => false,
    interrupt: () => false
  }
}

async function waitFor(read, predicate, label) {
  for (let index = 0; index < 6000; index += 1) {
    const value = await read()
    if (predicate(value)) return value
    if (process.env.GOAL15_DIAGNOSTICS === '1' && index % 250 === 0) diagnostic(`${label}: ${JSON.stringify(value.summary ?? value)}`)
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 20))
  }
  throw new Error(`${label} did not reach its expected state`)
}

export async function runCrossRepoScaleAcceptance() {
  assertRssMeasurementAvailable()
  const expectedContract = process.env.GOAL15_REVALIDATION_CONTRACT ?? '1.0.0'
  assert(PRODUCER_REVALIDATION_CONTRACT_VERSION === expectedContract && INFERENCE_REVALIDATION_CONTRACT_VERSION === expectedContract, 'Pinned cross-repository revalidation contract version drifted.')
  const root = await mkdtemp(resolve(tmpdir(), 'goal15-cross-repo-http-'))
  let producer
  let server
  let integration
  try {
    const scale = await createGoal15ScaleCampaign()
    const producerPlan = {
      dependency_snapshot: scale.dependencySnapshot,
      change_set: scale.changeSet,
      impact_policy: scale.impactPolicy,
      plan: scale.impactPlan
    }
    producer = await stateFixture(undefined, { producerPlan })
    await applyLifecycle(producer)
    diagnostic('producer initialized')

    const origin = 'http://127.0.0.1:5173'
    const authorBearerToken = 'goal15-cross-repo-author-token-0001'
    const executorBearerToken = 'goal15-cross-repo-executor-token-0001'
    const authorization = createNodeRevalidationAuthorization({ allowedOrigin: origin, bearerCredentials: [
      { token: authorBearerToken, actor: actors.author, capabilities: ['read', 'campaign:create'] },
      { token: executorBearerToken, actor: actors.executor, capabilities: ['read', 'outcome:create'] }
    ] })
    const app = createRevalidationApp({ store: producer.store, authorization })
    server = serve({ fetch: app.fetch, hostname: '127.0.0.1', port: 0 })
    if (!server.listening) await once(server, 'listening')
    const producerOrigin = `http://127.0.0.1:${server.address().port}`

    const engine = await createRevalidationCampaignEngine({
      root: resolve(root, 'inference'),
      env: { NODE_ENV: 'test', BIOCHEMICAL_REVALIDATION_CONCURRENCY: '2' },
      executeWorker: inlineExecutor,
      exposeTesting: true
    })
    const env = {
      NODE_ENV: 'test',
      BIOCHEMICAL_REVALIDATION_URL: producerOrigin,
      BIOCHEMICAL_REVALIDATION_ALLOWED_ORIGIN: origin,
      BIOCHEMICAL_REVALIDATION_AUTHOR_BEARER_TOKEN: authorBearerToken,
      BIOCHEMICAL_REVALIDATION_EXECUTOR_BEARER_TOKEN: executorBearerToken,
      BIOCHEMICAL_REVALIDATION_BOOTSTRAP_KEY_ID: producer.bootstrap.key.key_id,
      BIOCHEMICAL_REVALIDATION_BOOTSTRAP_PUBLIC_KEY: producer.bootstrap.key.public_key,
      BIOCHEMICAL_REVALIDATION_ROLE_POLICY_ID: producer.rolePolicy.role_policy_id,
      BIOCHEMICAL_REVALIDATION_AUTHOR_ID: actors.author.id,
      BIOCHEMICAL_REVALIDATION_AUTHOR_ORGANIZATION: actors.author.organization
    }
    const client = createRevalidationProducerClient(env)
    const loaded = await client.activePlan()
    diagnostic('active plan loaded')
    assert(loaded.impactPlan.plan_id === scale.impactPlan.plan_id, 'Configured producer plan identity drifted over HTTP.')
    assert(loaded.impactPlan.work_items.length === 1024, 'Configured producer plan did not contain 1,024 work items.')

    integration = await createRevalidationIntegrationService({ env, engine, reconcileIntervalMs: 50, exposeTesting: true })
    const created = await integration.sync({ name: 'goal15-cross-repo-scale', reason: 'Exercise every configured Goal 15 work item through real producer HTTP outcomes.' })
    diagnostic('campaign synchronized')
    await waitFor(
      () => integration.testing.engine.progress(created.campaign_id),
      (progress) => progress.succeeded === 1024 && progress.submitted === 1024,
      'cross-repository scale campaign'
    )
    const terminal = await integration.detail(created.campaign_id)
    diagnostic('local execution and submission terminal')
    const state = await producer.store.replay()
    diagnostic('producer replay complete')
    const events = await client.events()
    diagnostic('producer events verified')
    const report = await integration.report(created.campaign_id)
    diagnostic('campaign report complete')
    let localEventPage = integration.events({ limit: 100 })
    let localSignedEvents = 0
    while (true) {
      localSignedEvents += localEventPage.items.length
      if (localEventPage.next_cursor === null) break
      localEventPage = integration.events({ limit: 100, cursor: localEventPage.next_cursor })
    }
    const outcomes = state.campaigns[0]?.outcomes ?? []
    assert(terminal.summary.total === 1024 && terminal.summary.succeeded === 1024, 'Local campaign did not succeed exactly 1,024 work items.')
    assert(state.head_sequence === 1029 && events.head.sequence === 1029 && events.head.digest === state.head_digest, 'Signed producer ledger did not close at exactly 1,029 events.')
    assert(localSignedEvents === 1029, 'Bounded local event API pages did not reconstruct all 1,029 signed events.')
    assert(outcomes.length === 1024 && new Set(outcomes.map((outcome) => outcome.work_id)).size === 1024, 'Producer outcomes were not exact by campaign and work identity.')
    assert(outcomes.every((outcome) => outcome.scientific_label === null), 'Technical acceptance fabricated producer scientific labels.')
    return {
      configured_work: loaded.impactPlan.work_items.length,
      local_succeeded: terminal.summary.succeeded,
      producer_outcomes: outcomes.length,
      unique_producer_work: new Set(outcomes.map((outcome) => outcome.work_id)).size,
      signed_events: state.head_sequence,
      local_signed_events: localSignedEvents,
      producer_labels: outcomes.filter((outcome) => outcome.scientific_label !== null).length,
      exact_results: report.technical_execution.accepted_results.exactly_once,
      acceptance_mode: report.technical_execution.resources.acceptance.mode,
      evidence_only: report.technical_execution.resources.acceptance.evidence_only,
      cpu_time_limit_enforced: report.technical_execution.resources.enforcement.cpu.cpu_time_limit_enforced,
      process_rss_enforced: report.technical_execution.resources.enforcement.process_rss.enforced,
      runtime_enforced: report.technical_execution.resources.enforcement.runtime.enforced,
      rss_available: true
    }
  } finally {
    await integration?.close().catch(() => undefined)
    if (server) await new Promise((resolvePromise) => server.close(() => resolvePromise()))
    await producer?.store.close().catch(() => undefined)
    await rm(root, { recursive: true, force: true })
  }
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const result = await runCrossRepoScaleAcceptance()
  process.stdout.write(`${JSON.stringify(result)}\n`)
}
