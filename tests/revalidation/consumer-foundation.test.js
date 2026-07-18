import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { canonicalDigest, canonicalJson } from '../../shared/canonical-json.js'
import {
  DependencySnapshotSchema,
  RevalidationGoldenFixtureSchema
} from '../../shared/revalidation-contracts.js'
import {
  createCampaignSpecification,
  verifyCampaignSpecification
} from '../../server/revalidation/identity.js'
import { recomputeImpactPlan, verifyImpactPlan } from '../../server/revalidation/planning.js'
import {
  parseCanonicalRevalidation,
  verifyDependencySnapshot,
  verifyImpactPolicy,
  verifyNormalizedChangeSet
} from '../../server/revalidation/verification.js'

const fixturePath = resolve(process.cwd(), 'server/revalidation/fixtures/goal11-producer-golden.json.gz.base64')
const retryPolicy = {
  maximum_attempts: 3,
  initial_backoff_seconds: 5,
  maximum_backoff_seconds: 60,
  backoff_multiplier: 2,
  retryable_failure_codes: ['lease-expired', 'transient', 'worker-lost']
}
const executionLimits = { maximum_concurrency: 2, maximum_output_bytes: 262144, lease_duration_seconds: 901 }
const producerCampaign = { campaign_id: `sha256:${'9'.repeat(64)}`, name: 'goal15-foundation', reason: 'Bind the producer campaign identity into local execution.' }
const executorBindings = ['assertion', 'model', 'release', 'report', 'run'].map((kind) => ({
  expected_artifact_class: `${kind}-revalidation`,
  executor_id: 'closure-verification',
  executor_version: '1.0.0',
  checkpoint_mode: 'none'
}))
const inputArtifacts = ['change-set.json', 'dependency-snapshot.json', 'impact-plan.json', 'impact-policy.json'].map((name, index) => ({
  name,
  digest: `sha256:${String(index + 1).repeat(64)}`,
  bytes: index + 1,
  media_type: 'application/json'
}))

async function goldenBytes() {
  const encoded = (await readFile(fixturePath, 'utf8')).replace(/\s/g, '')
  return gunzipSync(Buffer.from(encoded, 'base64'))
}

async function golden() {
  return parseCanonicalRevalidation(await goldenBytes(), RevalidationGoldenFixtureSchema, 'Goal 11 revalidation golden fixture')
}

function replaceIdentity(value, field) {
  const copy = structuredClone(value)
  delete copy[field]
  copy[field] = canonicalDigest(copy)
  return copy
}

function planInputs(fixture) {
  return {
    dependencySnapshot: fixture.dependency_snapshot,
    changeSet: fixture.change_set,
    impactPolicy: fixture.impact_policy
  }
}

describe('Goal 15 producer contract verification', () => {
  it('strictly parses the canonical fixture and rejects noncanonical or excessive wire shapes', async () => {
    const bytes = await goldenBytes()
    const fixture = await golden()
    expect(Buffer.byteLength(bytes)).toBe(19976)
    expect(canonicalJson(fixture)).toBe(bytes.toString('utf8'))

    expect(() => parseCanonicalRevalidation(Buffer.from(JSON.stringify(fixture, null, 2)), RevalidationGoldenFixtureSchema, 'fixture')).toThrow(/RFC 8785/)
    expect(() => parseCanonicalRevalidation(Buffer.from(canonicalJson({ ...fixture, unexpected: true })), RevalidationGoldenFixtureSchema, 'fixture')).toThrow(/strict revalidation contract/)
    expect(() => parseCanonicalRevalidation(Buffer.from([0xc3, 0x28]), RevalidationGoldenFixtureSchema, 'fixture')).toThrow(/strict UTF-8/)
  })

  it('independently reproduces every pinned Goal 11 identity and ordered plan closure', async () => {
    const fixture = await golden()
    expect(verifyDependencySnapshot(fixture.dependency_snapshot).snapshot_id).toBe('sha256:a2de0e96c103476b619e42e961dec0b6686d7866685c724dd6502f3727ab9071')
    expect(verifyNormalizedChangeSet(fixture.change_set).change_set_id).toBe('sha256:501c6fb6f9711cc9378878eb556fb4b5fe17cba25a7dfcacea56e362d7068e72')
    expect(verifyImpactPolicy(fixture.impact_policy).policy_id).toBe('sha256:a58a6ae14d401337b222e8067a9480086e737c1c2878253b3e295beec3799147')

    const plan = recomputeImpactPlan(planInputs(fixture))
    expect(plan.plan_id).toBe(fixture.expected.plan_id)
    expect(plan.impacts.map((item) => item.impact_id)).toEqual(fixture.expected.ordered_impact_ids)
    expect(plan.work_items.map((item) => item.work_id)).toEqual(fixture.expected.ordered_work_ids)
    expect(verifyImpactPlan({ ...planInputs(fixture), impactPlan: plan })).toEqual(plan)
    expect(Object.isFrozen(plan)).toBe(true)
    expect(Object.isFrozen(plan.work_items[0].resource_profile)).toBe(true)
  })

  it('fails on incomplete closure and cycles before trusting a snapshot identity', async () => {
    const fixture = await golden()
    const incomplete = structuredClone(fixture.dependency_snapshot)
    incomplete.edges.splice(0, 1)
    expect(() => verifyDependencySnapshot(incomplete)).toThrow(/closure is incomplete/)

    const node = (character, locator) => replaceIdentity({
      node_schema_version: '1.0.0',
      node_id: `sha256:${'0'.repeat(64)}`,
      kind: 'model',
      locator,
      content_digest: `sha256:${character.repeat(64)}`,
      dependency_count: 1
    }, 'node_id')
    const left = node('a', 'cycle:model:left')
    const right = node('b', 'cycle:model:right')
    const edge = (dependent, dependency) => replaceIdentity({
      edge_schema_version: '1.0.0',
      edge_id: `sha256:${'0'.repeat(64)}`,
      dependent_node_id: dependent.node_id,
      dependency_node_id: dependency.node_id,
      role: 'model-input',
      impact_classes: ['scientific']
    }, 'edge_id')
    const cycle = {
      snapshot_schema_version: '1.0.0',
      snapshot_id: `sha256:${'0'.repeat(64)}`,
      closure_complete: true,
      root_node_ids: [left.node_id],
      nodes: [left, right].sort((a, b) => Buffer.compare(Buffer.from(a.node_id), Buffer.from(b.node_id))),
      edges: [edge(left, right), edge(right, left)].sort((a, b) => Buffer.compare(Buffer.from(a.edge_id), Buffer.from(b.edge_id)))
    }
    expect(DependencySnapshotSchema.safeParse(cycle).success).toBe(true)
    expect(() => verifyDependencySnapshot(cycle)).toThrow(/cycle/)
  })

  it('fails on impact/work order tampering and incomplete all-and-only closure', async () => {
    const fixture = await golden()
    const plan = recomputeImpactPlan(planInputs(fixture))

    const impactOrder = structuredClone(plan)
    impactOrder.impacts.reverse()
    const reboundImpactOrder = replaceIdentity(impactOrder, 'plan_id')
    expect(() => verifyImpactPlan({ ...planInputs(fixture), impactPlan: reboundImpactOrder })).toThrow(/impact order tampering/)

    const workOrder = structuredClone(plan)
    workOrder.work_items.reverse()
    const reboundWorkOrder = replaceIdentity(workOrder, 'plan_id')
    expect(() => verifyImpactPlan({ ...planInputs(fixture), impactPlan: reboundWorkOrder })).toThrow(/work order tampering/)

    const incomplete = structuredClone(plan)
    const removedImpact = incomplete.impacts.pop()
    incomplete.work_items = incomplete.work_items.filter((item) => item.impact_id !== removedImpact.impact_id)
    const reboundIncomplete = replaceIdentity(incomplete, 'plan_id')
    expect(() => verifyImpactPlan({ ...planInputs(fixture), impactPlan: reboundIncomplete })).toThrow(/impact closure is incomplete/)
  })

  it('fails on self-consistent class drift and stale work identities', async () => {
    const fixture = await golden()
    const plan = recomputeImpactPlan(planInputs(fixture))
    const drifted = structuredClone(plan)
    const impact = drifted.impacts[0]
    impact.classes = [...impact.classes, 'trust']
    const reboundImpact = replaceIdentity(impact, 'impact_id')
    drifted.impacts[0] = reboundImpact
    const workIndex = drifted.work_items.findIndex((item) => item.impact_id === impact.impact_id)
    drifted.work_items[workIndex].impact_id = reboundImpact.impact_id
    drifted.work_items[workIndex].impact_classes = reboundImpact.classes
    drifted.work_items[workIndex] = replaceIdentity(drifted.work_items[workIndex], 'work_id')
    drifted.work_items.sort((left, right) => Buffer.compare(Buffer.from(left.work_id), Buffer.from(right.work_id)))
    const reboundPlan = replaceIdentity(drifted, 'plan_id')
    expect(() => verifyImpactPlan({ ...planInputs(fixture), impactPlan: reboundPlan })).toThrow(/class drift/)

    const workDrift = structuredClone(plan)
    workDrift.work_items[0].expected_artifact_class = 'changed-revalidation'
    const reboundWorkDrift = replaceIdentity(workDrift, 'plan_id')
    expect(() => verifyImpactPlan({ ...planInputs(fixture), impactPlan: reboundWorkDrift })).toThrow(/work identity drift/)
  })
})

describe('Goal 15 local campaign identity foundation', () => {
  it('immutably binds the producer plan, one uniform resource profile, retry policy, and ordered work IDs', async () => {
    const fixture = await golden()
    const plan = recomputeImpactPlan(planInputs(fixture))
    const campaign = createCampaignSpecification({
      producerPlan: plan,
      producerCampaign,
      resourceProfile: plan.work_items[0].resource_profile,
      retryPolicy,
      executionLimits,
      executorBindings,
      inputArtifacts
    })
    expect(campaign).toMatchObject({
      producer_plan_id: fixture.expected.plan_id,
      retry_policy: retryPolicy,
      ordered_work_ids: fixture.expected.ordered_work_ids
    })
    expect(campaign.producer_campaign).toEqual(producerCampaign)
    expect(campaign.campaign_id).toBe('sha256:f16974819e2096a82662f69125e629211eb36ba0d1567cda028df3beb66e3b52')
    expect(verifyCampaignSpecification(campaign, plan)).toEqual(campaign)
    expect(Object.isFrozen(campaign.retry_policy)).toBe(true)

    const reordered = structuredClone(campaign)
    reordered.ordered_work_ids.reverse()
    const rebound = replaceIdentity(reordered, 'campaign_id')
    expect(() => verifyCampaignSpecification(rebound, plan)).toThrow(/ordered work identity closure/)
  })

  it('rejects a campaign resource profile that differs from producer work requirements', async () => {
    const fixture = await golden()
    const plan = recomputeImpactPlan(planInputs(fixture))
    expect(() => createCampaignSpecification({
      producerPlan: plan,
      producerCampaign,
      resourceProfile: { ...plan.work_items[0].resource_profile, memory_mib: 2048 },
      retryPolicy,
      executionLimits,
      executorBindings,
      inputArtifacts
    })).toThrow(/exactly match every producer work item/)
  })
})
