import { canonicalDigest, canonicalJson } from '../../shared/canonical-json.js'
import {
  CAMPAIGN_CONTRACT_VERSION,
  CampaignSpecificationSchema,
  ImpactPlanSchema
} from '../../shared/revalidation-contracts.js'

export const revalidationIdentity = (value) => canonicalDigest(value)

export function identityPayload(value, identityField) {
  const { [identityField]: _identity, ...payload } = value
  return payload
}

export function assertRevalidationIdentity(actual, payload, label) {
  if (actual !== revalidationIdentity(payload)) throw new TypeError(`${label} identity mismatch`)
}

export function immutable(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const item of Object.values(value)) immutable(item)
    Object.freeze(value)
  }
  return value
}

function parse(schema, value, label) {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw new TypeError(`${label}: ${parsed.error.issues[0].message}`)
  return parsed.data
}

function assertUniformResourceProfile(plan, resourceProfile) {
  const expected = canonicalJson(resourceProfile)
  if (plan.work_items.some((item) => canonicalJson(item.resource_profile) !== expected)) {
    throw new TypeError('campaign resource profile must exactly match every producer work item')
  }
}

function assertProducerPlanIdentities(plan) {
  assertRevalidationIdentity(plan.plan_id, identityPayload(plan, 'plan_id'), 'producer impact plan')
  for (const impact of plan.impacts) assertRevalidationIdentity(impact.impact_id, identityPayload(impact, 'impact_id'), 'producer impact')
  for (const work of plan.work_items) assertRevalidationIdentity(work.work_id, identityPayload(work, 'work_id'), 'producer work item')
  const workIds = plan.work_items.map((item) => item.work_id)
  if (new Set(workIds).size !== workIds.length || workIds.some((value, index) => index > 0 && value <= workIds[index - 1])) {
    throw new TypeError('producer work identities must be uniquely ordered')
  }
}

function assertCampaignBindings(plan, resourceProfile, retryPolicy, executionLimits, executorBindings, inputArtifacts) {
  if (executionLimits.maximum_concurrency > resourceProfile.cpu_cores) throw new TypeError('campaign concurrency exceeds its bound CPU cores')
  if (executionLimits.maximum_output_bytes > resourceProfile.scratch_mib * 1024 * 1024) throw new TypeError('campaign output limit exceeds its scratch resource bound')
  if (executionLimits.lease_duration_seconds <= resourceProfile.maximum_runtime_seconds) throw new TypeError('campaign lease duration must exceed the maximum worker runtime')
  const expectedClasses = [...new Set(plan.work_items.map((item) => item.expected_artifact_class))].sort()
  const boundClasses = executorBindings.map((item) => item.expected_artifact_class)
  if (canonicalJson(boundClasses) !== canonicalJson(expectedClasses)) throw new TypeError('campaign executor bindings must cover every and only expected artifact class in order')
  const names = inputArtifacts.map((item) => item.name)
  if (new Set(names).size !== names.length || names.some((value, index) => index > 0 && value <= names[index - 1])) throw new TypeError('campaign input artifacts must be uniquely ordered by name')
  const retryCodes = retryPolicy.retryable_failure_codes
  if (retryCodes.some((value, index) => index > 0 && value <= retryCodes[index - 1])) throw new TypeError('campaign retryable failure codes must be ordered')
}

export function createCampaignSpecification({ producerPlan, producerCampaign, resourceProfile, retryPolicy, executionLimits, executorBindings, inputArtifacts }) {
  const plan = parse(ImpactPlanSchema, producerPlan, 'producer impact plan')
  assertProducerPlanIdentities(plan)
  if (plan.work_items.length === 0) throw new TypeError('campaign requires producer work items')
  assertUniformResourceProfile(plan, resourceProfile)
  assertCampaignBindings(plan, resourceProfile, retryPolicy, executionLimits, executorBindings, inputArtifacts)
  const payload = {
    campaign_schema_version: CAMPAIGN_CONTRACT_VERSION,
    producer_plan_id: plan.plan_id,
    producer_campaign: structuredClone(producerCampaign),
    resource_profile: structuredClone(resourceProfile),
    retry_policy: structuredClone(retryPolicy),
    execution_limits: structuredClone(executionLimits),
    executor_bindings: structuredClone(executorBindings),
    input_artifacts: structuredClone(inputArtifacts),
    ordered_work_ids: plan.work_items.map((item) => item.work_id)
  }
  return immutable(parse(CampaignSpecificationSchema, {
    ...payload,
    campaign_id: revalidationIdentity(payload)
  }, 'campaign specification'))
}

export function verifyCampaignSpecification(value, producerPlan) {
  const campaign = parse(CampaignSpecificationSchema, value, 'campaign specification')
  const plan = parse(ImpactPlanSchema, producerPlan, 'producer impact plan')
  assertProducerPlanIdentities(plan)
  assertRevalidationIdentity(campaign.campaign_id, identityPayload(campaign, 'campaign_id'), 'campaign specification')
  if (campaign.producer_plan_id !== plan.plan_id) throw new TypeError('campaign producer plan binding mismatch')
  assertUniformResourceProfile(plan, campaign.resource_profile)
  assertCampaignBindings(plan, campaign.resource_profile, campaign.retry_policy, campaign.execution_limits, campaign.executor_bindings, campaign.input_artifacts)
  const expectedWorkIds = plan.work_items.map((item) => item.work_id)
  if (canonicalJson(campaign.ordered_work_ids) !== canonicalJson(expectedWorkIds)) {
    throw new TypeError('campaign ordered work identity closure mismatch')
  }
  return immutable(campaign)
}

export const campaignAttemptIdentity = (campaignId, workId, attemptNumber) => revalidationIdentity({ campaignId, workId, attemptNumber })

export const campaignCompatibilityIdentity = (campaign, work, binding) => revalidationIdentity({
  campaignId: campaign.campaign_id,
  workId: work.work_id,
  executor: { id: binding.executor_id, version: binding.executor_version },
  resourceProfile: campaign.resource_profile,
  inputArtifactDigests: campaign.input_artifacts.map((item) => item.digest)
})
