import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { canonicalJson } from '../../shared/canonical-json.js'
import { RevalidationGoldenFixtureSchema } from '../../shared/revalidation-contracts.js'
import { recomputeImpactPlan } from '../../server/revalidation/planning.js'
import { createGoal15ScaleCampaign } from '../../server/revalidation/scale-campaign.js'
import { revalidationIdentity } from '../../server/revalidation/identity.js'
import { parseCanonicalRevalidation } from '../../server/revalidation/verification.js'

const fixturePath = resolve(process.cwd(), 'server/revalidation/fixtures/goal11-producer-golden.json.gz.base64')

export async function revalidationGolden() {
  const encoded = (await readFile(fixturePath, 'utf8')).replace(/\s/g, '')
  const bytes = gunzipSync(Buffer.from(encoded, 'base64'))
  return parseCanonicalRevalidation(bytes, RevalidationGoldenFixtureSchema, 'Goal 11 revalidation golden fixture')
}

export async function campaignRequest(controls = { mode: 'success' }, overrides = {}) {
  const fixture = await revalidationGolden()
  let impactPolicy = fixture.impact_policy
  if (overrides.resourceProfile) {
    const { policy_id: _policyId, ...policy } = impactPolicy
    policy.work_rules = policy.work_rules.map((rule) => ({ ...rule, resource_profile: { ...rule.resource_profile, ...overrides.resourceProfile } }))
    impactPolicy = { ...policy, policy_id: revalidationIdentity(policy) }
  }
  const inputs = {
    dependencySnapshot: fixture.dependency_snapshot,
    changeSet: fixture.change_set,
    impactPolicy
  }
  const impactPlan = recomputeImpactPlan(inputs)
  const expectedClasses = [...new Set(impactPlan.work_items.map((item) => item.expected_artifact_class))].sort()
  const checkpointMode = overrides.checkpointMode ?? 'none'
  const producerCampaign = overrides.producerCampaign ?? {
    campaign_id: revalidationIdentity({ plan_id: impactPlan.plan_id, name: 'goal15-test-campaign', reason: 'Execute the test planning closure.' }),
    name: 'goal15-test-campaign',
    reason: 'Execute the test planning closure.'
  }
  return {
    ...inputs,
    impactPlan,
    producerCampaign,
    resourceProfile: { ...impactPlan.work_items[0].resource_profile, ...overrides.resourceProfile },
    retryPolicy: {
      maximum_attempts: 3,
      initial_backoff_seconds: 0,
      maximum_backoff_seconds: 0,
      backoff_multiplier: 1,
      retryable_failure_codes: ['lease-expired', 'transient', 'worker-lost'],
      ...overrides.retryPolicy
    },
    executionLimits: {
      maximum_concurrency: 2,
      maximum_output_bytes: 262144,
      lease_duration_seconds: 901,
      ...overrides.executionLimits
    },
    executorBindings: expectedClasses.map((expected_artifact_class) => ({
      expected_artifact_class,
      executor_id: overrides.executorId ?? 'test-deterministic',
      executor_version: '1.0.0',
      checkpoint_mode: checkpointMode
    })),
    inputArtifacts: [{ name: 'test-controls.json', mediaType: 'application/json', bytes: Buffer.from(canonicalJson(controls)) }]
  }
}

export async function scaleCampaignRequest(controls = { mode: 'success' }, overrides = {}) {
  const planning = createGoal15ScaleCampaign()
  const expectedClasses = [...new Set(planning.impactPlan.work_items.map((item) => item.expected_artifact_class))].sort()
  const producerCampaign = {
    campaign_id: revalidationIdentity({ plan_id: planning.impactPlan.plan_id, name: 'goal15-scale-acceptance', reason: 'Execute the bounded scale campaign.' }),
    name: 'goal15-scale-acceptance',
    reason: 'Execute the bounded scale campaign.'
  }
  return {
    ...planning,
    producerCampaign,
    resourceProfile: planning.impactPlan.work_items[0].resource_profile,
    retryPolicy: {
      maximum_attempts: 4,
      initial_backoff_seconds: 0,
      maximum_backoff_seconds: 0,
      backoff_multiplier: 1,
      retryable_failure_codes: ['lease-expired', 'transient', 'worker-lost']
    },
    executionLimits: {
      maximum_concurrency: 2,
      maximum_output_bytes: 262144,
      lease_duration_seconds: overrides.leaseDurationSeconds ?? 901
    },
    executorBindings: expectedClasses.map((expected_artifact_class) => ({
      expected_artifact_class,
      executor_id: 'test-deterministic',
      executor_version: '1.0.0',
      checkpoint_mode: 'none'
    })),
    inputArtifacts: [{ name: 'test-controls.json', mediaType: 'application/json', bytes: Buffer.from(canonicalJson(controls)) }]
  }
}
