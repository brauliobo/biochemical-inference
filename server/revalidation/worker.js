import { z } from 'zod'
import {
  CampaignCheckpointSchema,
  CampaignSpecificationSchema,
  CampaignWorkerFailureSchema,
  CampaignWorkerResultSchema,
  RevalidationWorkItemSchema,
  ScientificConclusionSchema
} from '../../shared/revalidation-contracts.js'
import { REVALIDATION_EXECUTOR_ALLOWLIST } from './executors.js'

const TestControlsSchema = z.object({
  mode: z.enum(['success', 'transient', 'crash-once', 'delay', 'checkpoint-retry', 'large-output']),
  failures: z.number().int().nonnegative().max(10).default(0),
  delay_ms: z.number().int().nonnegative().max(30000).default(0),
  output_bytes: z.number().int().nonnegative().max(10000000).default(0),
  delay_work_id: z.string().regex(/^sha256:[a-f0-9]{64}$/).optional(),
  transient_work_id: z.string().regex(/^sha256:[a-f0-9]{64}$/).optional(),
  scientific_conclusion: ScientificConclusionSchema.default('review-required')
}).strict()

const RequestSchema = z.object({
  type: z.literal('execute'),
  executor_id: z.enum(['closure-verification', 'test-deterministic']),
  executor_version: z.literal('1.0.0'),
  campaign: CampaignSpecificationSchema,
  work: RevalidationWorkItemSchema,
  attempt_number: z.number().int().positive(),
  inputs: z.array(z.object({ name: z.string(), digest: z.string(), content_base64: z.string() }).strict()).min(4).max(1000),
  checkpoint: z.object({ metadata: CampaignCheckpointSchema, content_base64: z.string() }).strict().nullable()
}).strict()

const CachedRequestSchema = RequestSchema.omit({ campaign: true, inputs: true }).extend({
  campaign_id: z.string().regex(/^sha256:[a-f0-9]{64}$/)
}).strict()

const EnvelopeSchema = z.object({
  type: z.literal('execute'),
  request_id: z.string().min(1).max(100),
  request: z.unknown()
}).strict()

const contexts = new Map()
let running = false
let idleTimer

function send(value) {
  process.send?.(JSON.stringify(value))
}

function armIdleTimeout() {
  clearTimeout(idleTimer)
  idleTimer = setTimeout(() => process.exit(0), 30_000)
  idleTimer.unref?.()
}

process.on('disconnect', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))
process.send?.(JSON.stringify({ type: 'ready', pid: process.pid, protocol_version: '1.0.0', executors: REVALIDATION_EXECUTOR_ALLOWLIST }))
armIdleTimeout()

function failure(code, message, checkpoint = null) {
  return CampaignWorkerFailureSchema.parse({ code, message, checkpoint })
}

function testControls(request) {
  const input = request.inputs.find((item) => item.name === 'test-controls.json')
  if (!input) throw new Error('test-deterministic executor requires test-controls.json')
  return TestControlsSchema.parse(JSON.parse(Buffer.from(input.content_base64, 'base64').toString('utf8')))
}

async function execute(request) {
  if (request.executor_id === 'closure-verification') {
    return CampaignWorkerResultSchema.parse({
      execution_status: 'succeeded',
      scientific_conclusion: 'not-evaluated',
      output: { closure_verified: true, input_count: request.inputs.length, work_id: request.work.work_id }
    })
  }
  const controls = testControls(request)
  if (controls.mode === 'crash-once' && request.attempt_number === 1) process.exit(17)
  if ((controls.mode === 'transient' && request.attempt_number <= controls.failures) || (controls.transient_work_id === request.work.work_id && request.attempt_number === 1)) {
    return { failure: failure('transient', 'Injected deterministic transient failure.') }
  }
  if (controls.mode === 'checkpoint-retry' && request.checkpoint === null) {
    return { failure: failure('transient', 'Injected checkpoint retry.', { completed_step: 1 }) }
  }
  if (controls.mode === 'delay' || (controls.delay_work_id === request.work.work_id && request.attempt_number === 1)) await new Promise((resolve) => setTimeout(resolve, controls.delay_ms))
  return CampaignWorkerResultSchema.parse({
    execution_status: 'succeeded',
    scientific_conclusion: controls.scientific_conclusion,
    output: {
      checkpoint_reused: request.checkpoint !== null,
      value: controls.mode === 'large-output' ? 'x'.repeat(controls.output_bytes) : `deterministic:${request.work.work_id}`
    }
  })
}

process.on('message', async (raw) => {
  let requestId = 'invalid-request'
  try {
    if (running) throw new Error('Revalidation worker received concurrent requests.')
    running = true
    clearTimeout(idleTimer)
    if (typeof raw !== 'string' || Buffer.byteLength(raw) > 16 * 1024 * 1024) throw new Error('Revalidation worker request exceeds its bounded protocol.')
    const envelope = EnvelopeSchema.parse(JSON.parse(raw))
    requestId = envelope.request_id
    let request
    if (envelope.request && typeof envelope.request === 'object' && 'campaign' in envelope.request) {
      request = RequestSchema.parse(envelope.request)
      contexts.set(request.campaign.campaign_id, { campaign: request.campaign, inputs: request.inputs })
    } else {
      const cached = CachedRequestSchema.parse(envelope.request)
      const context = contexts.get(cached.campaign_id)
      if (!context) throw new Error(`Worker campaign context ${cached.campaign_id} is unavailable.`)
      const { campaign_id: _campaignId, ...attempt } = cached
      request = { ...attempt, ...context }
    }
    const outcome = await execute(request)
    send(outcome.failure ? { type: 'failure', request_id: requestId, failure: outcome.failure } : { type: 'result', request_id: requestId, result: outcome })
  } catch (error) {
    send({ type: 'failure', request_id: requestId, failure: failure('invalid-worker-input', error instanceof Error ? error.message : 'Worker input failed.') })
  } finally {
    running = false
    armIdleTimeout()
  }
})
