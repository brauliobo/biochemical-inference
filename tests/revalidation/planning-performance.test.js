import { performance } from 'node:perf_hooks'
import { describe, expect, it } from 'vitest'
import { recomputeImpactPlan } from '../../server/revalidation/planning.js'
import { revalidationIdentity } from '../../server/revalidation/identity.js'

const COUNT = 10_000
const EDGE_COUNT = 100_000
const release = (release_id, character) => ({ family: 'factory', release_id, schema_version: '1.0.0', digest: `sha256:${character.repeat(64)}` })
const identified = (payload, field) => ({ ...payload, [field]: revalidationIdentity(payload) })

function worstCaseFixture() {
  const edgeInputs = []
  const dependencyCounts = Array(COUNT).fill(0)
  for (let dependent = 1; dependent < COUNT; dependent += 1) {
    edgeInputs.push({ dependent, role: 'scientific-input', impact_classes: ['scientific'] })
    dependencyCounts[dependent] += 1
  }
  const roles = ['provenance-source', 'rights-governance', 'packaging-input', 'trust-envelope', 'model-input', 'transform-input', 'run-input', 'report-input', 'challenge-input', 'spatial-input']
  for (let dependent = 1, remaining = EDGE_COUNT - edgeInputs.length; remaining > 0; dependent += 1) {
    for (const role of roles) {
      if (remaining === 0) break
      edgeInputs.push({ dependent, role, impact_classes: ['packaging'] })
      dependencyCounts[dependent] += 1
      remaining -= 1
    }
  }
  const nodes = Array.from({ length: COUNT }, (_, index) => identified({
    node_schema_version: '1.0.0',
    kind: index === 0 ? 'record' : index === 1 ? 'report' : 'run',
    locator: index === 0 ? 'scale:shared-anchor' : `scale:dependent:${String(index).padStart(5, '0')}`,
    content_digest: revalidationIdentity({ content: index }),
    dependency_count: dependencyCounts[index]
  }, 'node_id')).sort((left, right) => left.node_id.localeCompare(right.node_id))
  const anchor = nodes.find((node) => node.locator === 'scale:shared-anchor')
  const nodeByLocator = new Map(nodes.map((node) => [node.locator, node]))
  const edges = edgeInputs.map(({ dependent, ...edge }) => identified({
    edge_schema_version: '1.0.0',
    dependent_node_id: nodeByLocator.get(`scale:dependent:${String(dependent).padStart(5, '0')}`).node_id,
    dependency_node_id: anchor.node_id,
    ...edge
  }, 'edge_id')).sort((left, right) => left.edge_id.localeCompare(right.edge_id))
  const snapshotPayload = { snapshot_schema_version: '1.0.0', closure_complete: true, root_node_ids: nodes.filter((node) => node !== anchor).map((node) => node.node_id).sort(), nodes, edges }
  const changes = Array.from({ length: COUNT }, (_, index) => identified({
    change_schema_version: '1.0.0',
    class: 'scientific',
    subject: anchor.locator,
    path: `$.field${String(index).padStart(5, '0')}`,
    before: index,
    after: index + 1,
    reasons: ['goal15-repeated-anchor-performance']
  }, 'change_id'))
  const changeSetPayload = {
    change_set_schema_version: '1.0.0',
    source_diff_digest: revalidationIdentity({ source: 'goal15-performance' }),
    baseline: release('goal15-performance-baseline', 'a'),
    candidate: release('goal15-performance-candidate', 'b'),
    changes
  }
  const profile = { profile_id: 'goal15-performance', cpu_cores: 1, memory_mib: 1024, scratch_mib: 1, maximum_runtime_seconds: 60 }
  const policyPayload = {
    policy_schema_version: '1.0.0',
    change_classes: ['scientific'],
    traversal: 'transitive',
    maximum_depth: 2,
    impact_kinds: ['report'],
    work_rules: [{ node_kind: 'report', action: 'reproduce', expected_artifact_class: 'report-revalidation', resource_profile: profile }]
  }
  return {
    dependencySnapshot: identified(snapshotPayload, 'snapshot_id'),
    changeSet: identified(changeSetPayload, 'change_set_id'),
    impactPolicy: identified(policyPayload, 'policy_id')
  }
}

describe('Goal 15 worst-case consumer planner performance', () => {
  it('groups 10k repeated changes over a 100k-edge anchor within the timeout budget', () => {
    const fixture = worstCaseFixture()
    expect(fixture.dependencySnapshot.edges).toHaveLength(EDGE_COUNT)
    expect(fixture.changeSet.changes).toHaveLength(COUNT)
    const started = performance.now()
    const plan = recomputeImpactPlan(fixture)
    const runtimeMs = performance.now() - started
    expect(plan.impacts).toHaveLength(1)
    expect(plan.impacts[0]).toMatchObject({ node_kind: 'report', reasons: expect.any(Array) })
    expect(plan.impacts[0].reasons).toHaveLength(COUNT)
    expect(plan.work_items).toHaveLength(1)
    expect(runtimeMs).toBeLessThan(30_000)
    const { policy_id: _policyId, ...overflowPolicy } = fixture.impactPolicy
    overflowPolicy.impact_kinds = ['run']
    overflowPolicy.work_rules = [{ ...overflowPolicy.work_rules[0], node_kind: 'run', expected_artifact_class: 'run-revalidation' }]
    expect(() => recomputeImpactPlan({ ...fixture, impactPolicy: identified(overflowPolicy, 'policy_id') })).toThrow(/declared 100000 reason cap/)
    if (process.env.GOAL15_REPORT === 'true') process.stdout.write(`${JSON.stringify({ gate: 'consumer-planner-10k-100k', runtime_ms: Math.round(runtimeMs) })}\n`)
  }, 60_000)
})
