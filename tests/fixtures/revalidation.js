import { createProducerCampaign } from '../../server/revalidation/client.js'
import { loadGoal11RevalidationFixture } from '../../server/revalidation/fixture.js'
import { revalidationIdentity } from '../../server/revalidation/identity.js'

export const revalidationAuthor = { id: 'inference:campaign-author', role: 'campaign-author', organization: 'Biochemical Inference' }

export async function revalidationView({ terminal = false, submitted = 0 } = {}) {
  const planning = await loadGoal11RevalidationFixture()
  const impacts = new Map(planning.impactPlan.impacts.map((impact) => [impact.impact_id, impact]))
  const producerCampaign = createProducerCampaign({ name: 'goal15-browser-test', reason: 'Exercise the bounded browser campaign contract.', planning, actor: revalidationAuthor })
  const campaignId = revalidationIdentity({ local: 'goal15-browser-test' })
  const eventBody = {
    event_schema_version: '1.0.0', sequence: 1, previous_event_digest: null, occurred_at: '2026-07-17T12:00:00.000Z',
    actor: revalidationAuthor, reason: 'Create the browser fixture campaign.', role_policy_id: revalidationIdentity({ policy: 'goal15-browser-test' }),
    signing_key_id: revalidationIdentity({ key: 'goal15-browser-test' }), algorithm: 'Ed25519',
    payload: { action: 'campaign-created', campaign_id: producerCampaign.specification.campaign_id, plan_id: planning.impactPlan.plan_id }
  }
  const event = { ...eventBody, event_digest: revalidationIdentity(eventBody), signature: Buffer.alloc(64).toString('base64') }
  const work = planning.impactPlan.work_items.map((item, ordinal) => ({
    work_id: item.work_id,
    campaign_id: campaignId,
    ordinal,
    state: terminal ? 'terminal' : 'queued',
    attempt_count: terminal ? 1 : 0,
    cancellation_requested: false,
    available_at: '2026-07-17T12:00:00.000Z',
    current_attempt_id: null,
    outcome: terminal ? 'succeeded' : null,
    failure: null,
    accepted_result_id: terminal ? revalidationIdentity({ result: item.work_id }) : null,
    completed_at: terminal ? '2026-07-17T12:01:00.000Z' : null,
    work: item,
    attempts: [],
    checkpoint_count: 0,
    impact: impacts.get(item.impact_id),
    producer_receipt: null
  }))
  return {
    campaign_id: campaignId,
    state: terminal ? 'terminal' : 'active',
    cancellation_requested: false,
    producer: {
      local_campaign_id: campaignId,
      producer_campaign_id: producerCampaign.specification.campaign_id,
      producer_plan_id: planning.impactPlan.plan_id,
      campaign: { ...producerCampaign, event_sequence: 1 },
      receipt: { created: true, campaign_id: producerCampaign.specification.campaign_id, event_sequence: 1, event },
      event_head: { sequence: 1, digest: event.event_digest },
      submitted_outcomes: submitted
    },
    review: { required: terminal, automatically_accepted: false, labeled_outcomes: 0 },
    projection: {
      projection_schema_version: '1.0.0',
      snapshot_id: revalidationIdentity({ projection: campaignId, terminal }),
      total: work.length,
      limit: 50,
      next_cursor: null
    },
    summary: {
      total: work.length,
      queued: terminal ? 0 : work.length,
      running: 0,
      succeeded: terminal ? work.length : 0,
      failed: 0,
      resource_exhausted: 0,
      skipped: 0,
      submitted
    },
    work,
    last_error: null
  }
}

export function revalidationStatus(campaigns = 0) {
  return {
    mode: 'producer-bound-local-revalidation',
    producer_origin: 'http://127.0.0.1:47831',
    bootstrap_key_id: revalidationIdentity({ key: 'goal15-browser-test' }),
    campaigns,
    last_error: null,
    review_automatic_acceptance: false
  }
}

export async function revalidationReport(campaignId) {
  const planning = await loadGoal11RevalidationFixture()
  return {
    report_schema_version: 'goal15-scale-acceptance-v1',
    campaign_id: campaignId,
    technical_execution: {
      state: 'terminal',
      progress: { total: 6, queued: 0, running: 0, succeeded: 6, failed: 0, resource_exhausted: 0, skipped: 0, submitted: 6 },
      selection: {
        direct: 3,
        transitive: 3,
        by_node_kind: { release: 1, model: 1, run: 1, assertion: 1, report: 2 },
        by_action: { verify: 1, recompute: 1, reproduce: 3, review: 1 },
        registration_negative_controls: 0,
        registration_controls_selected: 0,
        all_and_only_verified: true
      },
      resources: {
        declared: planning.impactPlan.work_items[0].resource_profile,
        execution_limits: { maximum_concurrency: 2, maximum_output_bytes: 262144, lease_duration_seconds: 901 },
        acceptance: { mode: 'isolated-worker', evidence_only: false },
        enforcement: {
          cpu: { mode: 'concurrency-ceiling', cpu_time_limit_enforced: false },
          process_rss: { limit_bytes: 1073741824, enforced: true, observed_peak_bytes: 67108864 },
          runtime: { limit_ms: 900000, enforced: true, observed_max_ms: 42 },
          output: { limit_bytes: 262144, enforced: true },
          storage: { limit_bytes: 268435456, enforced: true }
        }
      },
      recovery: { attempts: 6, retries: 0, by_failure_code: {} },
      accepted_results: { count: 6, unique_work_ids: 6, duplicate_work_ids: 0, missing_successful_work_ids: 0, unexpected_non_success_results: 0, exactly_once: true },
      storage: { object_count: 10, object_bytes: 1000, campaign_logical_bytes: 1000, campaign_limit_bytes: 268435456, sqlite_bytes: 4096, wal_bytes: 0 },
      projection: { snapshot_id: revalidationIdentity({ projection: campaignId, terminal: true }), total: 6 }
    },
    scientific_review: { support: 'unsupported', review_required: true, automatically_accepted: false, producer_labeled_outcomes: 0 }
  }
}
