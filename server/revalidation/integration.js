import { canonicalJson } from '../../shared/canonical-json.js'
import {
  ProducerEventMetadataSchema,
  ProducerOutcomeWriteRequestSchema,
  ProducerRevalidationActorSchema,
  RevalidationSyncRequestSchema
} from '../../shared/revalidation-contracts.js'
import {
  createProducerCampaign,
  createProducerOutcome,
  createRevalidationProducerClient,
  RevalidationProducerError,
  verifyProducerCampaign,
  verifyProducerEventChain,
  verifyProducerEventExtensions,
  verifyProducerOutcome
} from './client.js'
import { createRevalidationCampaignEngine, RevalidationEngineError } from './service.js'

const DEFAULT_PROFILE = Object.freeze({ cpu_cores: 2, memory_mib: 1024, scratch_mib: 256, maximum_runtime_seconds: 900 })
const GOAL15_PRODUCTION_PINS = Object.freeze({
  dependency_snapshot_id: 'sha256:97747e9efa483b6dfe980eafd9aac71e641237b59ba93014647e24bfe48f9dfc',
  change_set_id: 'sha256:a9585aaf4eb1636252d6f90ac8cbe5740e7a8bc436fd301d03b33c8de3764fa0',
  impact_policy_id: 'sha256:d8b572f17b9a44781715b2d2b647e99f7448bbdb82a1614edfd576ff215a3e84',
  plan_id: 'sha256:92c376fd835b2a13183908c457964483b8ae0fb976e6e0414848047510fc0241',
  baseline: Object.freeze({ release_id: 'goal15-scale-baseline-v1.0.0', digest: `sha256:${'a'.repeat(64)}` }),
  candidate: Object.freeze({ release_id: 'goal15-scale-candidate-v1.0.1', digest: `sha256:${'b'.repeat(64)}` })
})

function verifyProductionPlanningPins(planning) {
  const actual = {
    dependency_snapshot_id: planning.dependencySnapshot.snapshot_id,
    change_set_id: planning.changeSet.change_set_id,
    impact_policy_id: planning.impactPolicy.policy_id,
    plan_id: planning.impactPlan.plan_id,
    baseline: { release_id: planning.changeSet.baseline.release_id, digest: planning.changeSet.baseline.digest },
    candidate: { release_id: planning.changeSet.candidate.release_id, digest: planning.changeSet.candidate.digest }
  }
  if (canonicalJson(actual) !== canonicalJson(GOAL15_PRODUCTION_PINS)) throw new RevalidationIntegrationError('producer-production-pin-drift', 'Producer planning differs from the independently pinned Goal 15 production closure.')
}

export class RevalidationIntegrationError extends Error {
  constructor(code, message, statusCode = 409) {
    super(message)
    this.name = 'RevalidationIntegrationError'
    this.code = code
    this.statusCode = statusCode
  }
}

function actor(env, role) {
  const defaults = role === 'campaign-author'
    ? { id: 'inference:campaign-author', organization: 'Biochemical Inference' }
    : { id: 'inference:executor', organization: 'Biochemical Inference' }
  return ProducerRevalidationActorSchema.parse({
    id: role === 'campaign-author' ? env.BIOCHEMICAL_REVALIDATION_AUTHOR_ID ?? defaults.id : env.BIOCHEMICAL_REVALIDATION_EXECUTOR_ID ?? defaults.id,
    role,
    organization: role === 'campaign-author'
      ? env.BIOCHEMICAL_REVALIDATION_AUTHOR_ORGANIZATION ?? env.BIOCHEMICAL_REVALIDATION_ORGANIZATION ?? defaults.organization
      : env.BIOCHEMICAL_REVALIDATION_EXECUTOR_ORGANIZATION ?? env.BIOCHEMICAL_REVALIDATION_ORGANIZATION ?? defaults.organization
  })
}

function eventMetadata(actorValue, signingKeyId, reason) {
  return ProducerEventMetadataSchema.parse({ actor: actorValue, reason, signing_key_id: signingKeyId })
}

function localExecutionStatus(work) {
  if (work.outcome === 'succeeded') return 'succeeded'
  if (work.outcome === 'cancelled') return 'not-evaluable'
  return 'failed'
}

export async function createRevalidationIntegrationService(options = {}) {
  const env = options.env ?? process.env
  const engine = options.engine ?? await createRevalidationCampaignEngine({
    env,
    root: options.root,
    maximumConcurrency: options.maximumConcurrency,
    maximumWorkerRuntimeMs: options.maximumWorkerRuntimeMs
  })
  let client
  let planning
  let author
  let executor
  try {
    client = options.producerClient ?? createRevalidationProducerClient(env, options.producerClientOptions)
    planning = options.planning ?? await client.activePlan()
    if (options.planning === undefined) verifyProductionPlanningPins(planning)
    author = actor(env, 'campaign-author')
    executor = actor(env, 'inference-executor')
  } catch (error) {
    await engine.close()
    throw error
  }
  let closed = false
  let reconciling = null
  let timer = null
  let lastError = null
  let producerChain = null

  function activeSigningKeyId(chain) {
    const sequence = chain.head.sequence + 1
    const activeKeys = [...chain.keys.values()].filter((value) => value.activeFrom <= sequence && (value.retiredFrom === null || value.retiredFrom > sequence) && (value.revokedFrom === null || value.revokedFrom > sequence))
      .sort((left, right) => right.activeFrom - left.activeFrom || left.key.key_id.localeCompare(right.key.key_id))
    if (!activeKeys.length) throw new RevalidationIntegrationError('producer-signing-key-unavailable', 'Producer has no active signing key for the next event sequence.', 503)
    return activeKeys[0].key.key_id
  }

  async function submitRotationSafe(actorValue, reason, submit) {
    let lastError
    for (let attempt = 0; attempt < 3; attempt += 1) {
      producerChain ??= await client.events()
      const metadata = eventMetadata(actorValue, activeSigningKeyId(producerChain), reason)
      try { return { receipt: await submit(metadata), metadata } }
      catch (error) {
        lastError = error
        if (!(error instanceof RevalidationProducerError) || error.statusCode !== 409) throw error
        producerChain = await client.events()
      }
    }
    throw lastError
  }

  async function refreshProducerChain(localCampaignId, signal) {
    producerChain = await client.events(signal)
    engine.recordProducerChain(localCampaignId, producerChain.events, producerChain.head)
    return producerChain
  }

  async function verifiedTransitions(receipts, expectedPayloads) {
    const events = receipts.map((receipt, index) => {
      const event = receipt.event
      if (event.sequence !== receipt.event_sequence || canonicalJson(event.payload) !== canonicalJson(expectedPayloads[index])) throw new RevalidationIntegrationError('producer-event-binding-invalid', `Producer event ${receipt.event_sequence} does not bind the submitted transition.`)
      return event
    })
    let persistEvents
    if (producerChain === null) {
      producerChain = await client.events()
      persistEvents = producerChain.events
    }
    const extensions = events.filter((event) => event.sequence > producerChain.head.sequence)
    if (extensions.length && extensions[0].sequence === producerChain.head.sequence + 1 && extensions.every((event, index) => index === 0 || event.sequence === extensions[index - 1].sequence + 1)) {
      producerChain = verifyProducerEventExtensions(producerChain, extensions)
      persistEvents ??= extensions
    } else if (extensions.length) {
      producerChain = await client.events()
      persistEvents = producerChain.events
    }
    for (const event of events) {
      if (producerChain.events[event.sequence - 1]?.event_digest !== event.event_digest) throw new RevalidationIntegrationError('producer-event-binding-invalid', `Producer event ${event.sequence} conflicts with the verified chain.`)
    }
    return { events, persistEvents: persistEvents ?? [], chain: producerChain }
  }

  async function verifiedTransition(receipt, expectedPayload) {
    const transitions = await verifiedTransitions([receipt], [expectedPayload])
    return { event: transitions.events[0], events: transitions.chain.events }
  }

  async function resumeBinding(binding, signal) {
    signal?.throwIfAborted()
    const storedEvents = engine.producerEvents()
    const stored = verifyProducerEventChain(storedEvents, client.bootstrapKey, client.rolePolicyId)
    if (stored.head.sequence < binding.event_head.sequence || stored.events[binding.event_head.sequence - 1]?.event_digest !== binding.event_head.digest) throw new RevalidationIntegrationError('producer-resume-pin-invalid', 'Persisted producer event chain does not contain the campaign resume head.')
    await client.verifyHead(binding.event_head.sequence, binding.event_head.digest, signal)
    await refreshProducerChain(binding.local_campaign_id, signal)
    const producerCampaign = await client.campaign(binding.producer_campaign_id, signal)
    signal?.throwIfAborted()
    verifyProducerCampaign(producerCampaign, binding.campaign)
  }

  async function buildOutcome(binding, localCampaign, work, workById, impactById) {
    const producerWork = workById.get(work.work_id)
    if (!producerWork) throw new RevalidationIntegrationError('producer-plan-work-missing', `Producer plan lacks local work ${work.work_id}.`)
    const impact = impactById.get(producerWork.impact_id)
    if (!impact) throw new RevalidationIntegrationError('producer-plan-impact-missing', `Producer plan lacks impact ${producerWork.impact_id}.`)
    const result = work.outcome === 'succeeded' ? await engine.result(work.work_id, localCampaign.campaign_id) : null
    const artifact = work.outcome === 'succeeded' ? engine.resultArtifact(work.work_id, localCampaign.campaign_id) : null
    return createProducerOutcome({
      campaign_id: binding.producer_campaign_id,
      work_id: work.work_id,
      execution_status: localExecutionStatus(work),
      artifact: artifact ? { artifact_class: producerWork.expected_artifact_class, digest: artifact.artifact_digest } : null,
      diagnostics: {
        diagnostics_schema_version: 'inference-revalidation-outcome-v1',
        local_campaign_id: localCampaign.campaign_id,
        local_result_id: result?.result_id ?? null,
        local_execution_outcome: work.outcome,
        local_failure: work.failure,
        attempt_count: work.attempt_count,
        impact_classes: producerWork.impact_classes,
        impact_reasons: impact.reasons,
        scientific_conclusion: result?.scientific_conclusion ?? 'not-evaluated',
        review_required: true,
        automatically_accepted: false
      },
      executor
    })
  }

  async function reconcileCampaign(localCampaignId) {
    const binding = engine.producerBinding(localCampaignId)
    if (!binding) throw new RevalidationIntegrationError('producer-binding-missing', 'Local campaign is not bound to a producer campaign.')
    if (engine.campaignState(localCampaignId).state !== 'terminal') return detail(localCampaignId)
    const localCampaign = engine.getCampaign(localCampaignId)
    producerChain ??= await client.events()
    let submitted = false
    const workById = new Map(binding.campaign.plan.work_items.map((work) => [work.work_id, work]))
    const impactById = new Map(binding.campaign.plan.impacts.map((impact) => [impact.impact_id, impact]))
    const submittedWorkIds = engine.producerReceiptWorkIds(localCampaignId)
    const pending = localCampaign.work.filter((work) => !submittedWorkIds.has(work.work_id))
    for (let offset = 0; offset < pending.length; offset += 100) {
      const workBatch = pending.slice(offset, offset + 100)
      const outcomes = await Promise.all(workBatch.map((work) => buildOutcome(binding, localCampaign, work, workById, impactById)))
      const submittedBatch = await submitRotationSafe(executor, 'Record the exact artifact-bound local revalidation execution outcome.', (metadata) => client.submitOutcomes(outcomes, metadata))
      const metadata = submittedBatch.metadata
      const requests = outcomes.map((outcome) => {
        const rawOutcome = { ...outcome }
        delete rawOutcome.outcome_id
        delete rawOutcome.outcome_schema_version
        return ProducerOutcomeWriteRequestSchema.parse({ outcome: rawOutcome, event: metadata })
      })
      const receipts = submittedBatch.receipt
      if (receipts.length !== outcomes.length) throw new RevalidationIntegrationError('producer-outcome-receipt-drift', 'Producer outcome batch receipt cardinality drifted.')
      const expectedPayloads = workBatch.map((work, index) => ({ action: 'outcome-recorded', campaign_id: binding.producer_campaign_id, work_id: work.work_id, outcome_id: outcomes[index].outcome_id }))
      const transitions = await verifiedTransitions(receipts, expectedPayloads)
      engine.recordProducerChain(localCampaignId, transitions.persistEvents, transitions.chain.head)
      const persisted = []
      for (let index = 0; index < workBatch.length; index += 1) {
        const work = workBatch[index]
        const outcome = outcomes[index]
        const receipt = receipts[index]
        if (canonicalJson(verifyProducerOutcome(receipt.outcome)) !== canonicalJson(outcome)) throw new RevalidationIntegrationError('producer-outcome-receipt-drift', `Producer receipt for ${work.work_id} differs from the submitted outcome.`)
        persisted.push({ localCampaignId, workId: work.work_id, request: requests[index], receipt, events: [], event: transitions.events[index] })
        submitted = true
      }
      engine.recordProducerOutcomes(persisted)
    }
    if (submitted) {
      const previousHead = producerChain.head.sequence
      const verified = await client.verifyHead(producerChain.head.sequence, producerChain.head.digest)
      engine.recordProducerChain(localCampaignId, verified.chain.events.slice(previousHead), verified.chain.head)
    } else await refreshProducerChain(localCampaignId)
    return detail(localCampaignId)
  }

  async function reconcileAll() {
    if (closed) return
    if (reconciling) return reconciling
    reconciling = (async () => {
      for (const binding of engine.producerBindings()) await reconcileCampaign(binding.local_campaign_id)
      lastError = null
    })().catch((error) => {
      lastError = error instanceof Error ? error.message : 'Producer reconciliation failed.'
      throw error
    }).finally(() => { reconciling = null })
    return reconciling
  }

  function schedule() {
    clearTimeout(timer)
    if (closed) return
    timer = setTimeout(() => {
      reconcileAll().catch(() => undefined).finally(schedule)
    }, options.reconcileIntervalMs ?? 250)
    timer.unref?.()
  }

  async function detail(localCampaignId, pagination = {}) {
    const campaign = engine.campaignState(localCampaignId)
    const binding = engine.producerBinding(localCampaignId)
    const plan = binding?.campaign.plan ?? await engine.campaignPlan(localCampaignId)
    const impacts = new Map(plan.impacts.map((impact) => [impact.impact_id, impact]))
    const projection = engine.workPage(localCampaignId, pagination)
    return Object.freeze({
      campaign_id: localCampaignId,
      state: campaign.state,
      cancellation_requested: campaign.cancellation_requested,
      producer: binding,
      review: { required: campaign.state === 'terminal', automatically_accepted: false, labeled_outcomes: engine.producerLabelCount(localCampaignId) },
      summary: engine.progress(localCampaignId),
      projection: {
        projection_schema_version: projection.projection_schema_version,
        snapshot_id: projection.snapshot_id,
        total: projection.total,
        limit: projection.limit,
        next_cursor: projection.next_cursor
      },
      work: projection.items.map((work) => ({
        ...work,
        attempts: engine.attempts(work.work_id, localCampaignId),
        checkpoint_count: engine.checkpoints(work.work_id, localCampaignId).length,
        impact: impacts.get(work.work.impact_id),
        producer_receipt: engine.producerReceipt(localCampaignId, work.work_id)
      })),
      last_error: lastError
    })
  }

  try {
    for (const binding of engine.producerBindings()) await resumeBinding(binding)
    schedule()
  } catch (error) {
    await engine.close()
    throw error
  }

  return Object.freeze({
    async sync(input = {}) {
      const request = RevalidationSyncRequestSchema.parse(input)
      const producerCampaign = createProducerCampaign({ name: request.name, reason: request.reason, planning, actor: author })
      const submitted = await submitRotationSafe(author, 'Create the immutable producer-bound local revalidation campaign.', (metadata) => client.submitCampaign(producerCampaign, metadata))
      const receipt = submitted.receipt
      const persistedCampaign = verifyProducerCampaign(await client.campaign(receipt.campaign_id), producerCampaign)
      const transition = await verifiedTransition(receipt, { action: 'campaign-created', campaign_id: receipt.campaign_id, plan_id: planning.impactPlan.plan_id })
      if (canonicalJson(transition.event.actor) !== canonicalJson(persistedCampaign.specification.requested_by)) throw new RevalidationIntegrationError('producer-campaign-actor-invalid', 'Producer campaign event actor differs from requested_by.')
      const expectedClasses = [...new Set(planning.impactPlan.work_items.map((item) => item.expected_artifact_class))].sort()
      const local = await engine.createCampaign({
        ...planning,
        producerCampaign: {
          campaign_id: persistedCampaign.specification.campaign_id,
          name: persistedCampaign.specification.name,
          reason: persistedCampaign.specification.reason
        },
        resourceProfile: { profile_id: planning.impactPlan.work_items[0].resource_profile.profile_id, ...DEFAULT_PROFILE },
        retryPolicy: { maximum_attempts: 3, initial_backoff_seconds: 1, maximum_backoff_seconds: 30, backoff_multiplier: 2, retryable_failure_codes: ['lease-expired', 'transient', 'worker-lost'] },
        executionLimits: { maximum_concurrency: 2, maximum_output_bytes: 262144, lease_duration_seconds: 930 },
        executorBindings: expectedClasses.map((expected_artifact_class) => ({ expected_artifact_class, executor_id: 'closure-verification', executor_version: '1.0.0', checkpoint_mode: 'none' })),
        inputArtifacts: []
      })
      engine.recordProducerCampaign({
        localCampaignId: local.campaign_id,
        campaign: persistedCampaign,
        receipt,
        events: transition.events,
        event: transition.event
      })
      reconcileAll().catch(() => undefined)
      return detail(local.campaign_id)
    },
    async reconcile(localCampaignId) { return reconcileCampaign(localCampaignId) },
    async detail(localCampaignId, pagination = {}) { return detail(localCampaignId, pagination) },
    async report(localCampaignId) {
      const binding = engine.producerBinding(localCampaignId)
      if (!binding) throw new RevalidationIntegrationError('producer-binding-missing', 'Local campaign is not bound to a producer campaign.')
      const chain = await refreshProducerChain(localCampaignId)
      const verified = await client.verifyHead(chain.head.sequence, chain.head.digest)
      engine.recordProducerChain(localCampaignId, verified.chain.events, verified.chain.head)
      const materialized = verified.state.campaigns.find((campaign) => campaign.campaign_id === binding.producer_campaign_id)
      if (!materialized) throw new RevalidationIntegrationError('producer-state-closure-invalid', 'Verified producer state does not contain the bound campaign.')
      return engine.campaignReport(localCampaignId, {
        campaignId: binding.producer_campaign_id,
        head: verified.chain.head,
        labeledOutcomes: materialized.outcomes.filter((outcome) => outcome.scientific_label !== null).length
      })
    },
    campaigns() { return engine.producerBindings().map((binding) => ({ local_campaign_id: binding.local_campaign_id, producer_campaign_id: binding.producer_campaign_id, event_head: binding.event_head })) },
    async status() {
      return Object.freeze({
        mode: 'producer-bound-local-revalidation',
        producer_origin: client.root,
        bootstrap_key_id: client.bootstrapKey.key_id,
        campaigns: engine.producerBindings().length,
        last_error: lastError,
        review_automatic_acceptance: false
      })
    },
    async integrity(signal) {
      signal?.throwIfAborted()
      const local = await engine.integrity(signal)
      for (const binding of engine.producerBindings()) await resumeBinding(binding, signal)
      signal?.throwIfAborted()
      return Object.freeze({ ...local, producer: 'valid', event_heads: engine.producerBindings().map((binding) => binding.event_head) })
    },
    async cancel(localCampaignId) { engine.cancelCampaign(localCampaignId); return detail(localCampaignId) },
    events(pagination = {}) { return engine.producerEventPage(pagination) },
    async close() { closed = true; clearTimeout(timer); await engine.close() },
    testing: options.exposeTesting ? { engine, client, reconcileAll } : undefined
  })
}

export function revalidationIntegrationError(error) {
  if (error instanceof RevalidationIntegrationError || error instanceof RevalidationProducerError || error instanceof RevalidationEngineError) return error
  return new RevalidationIntegrationError('revalidation-integration-failed', error instanceof Error ? error.message : 'Revalidation integration failed.', 500)
}
