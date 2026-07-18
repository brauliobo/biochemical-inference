import { REVALIDATION_CONTRACT_VERSION, REVALIDATION_NODE_KINDS } from '../../shared/revalidation-contracts.js'
import { immutable, revalidationIdentity } from './identity.js'
import { recomputeImpactPlan } from './planning.js'

export const GOAL15_SCALE_COUNTS = Object.freeze({
  runs: 384,
  assertions: 320,
  reports: 320,
  registration_negative_controls: 64,
  direct_impacts: 384,
  transitive_impacts: 640,
  work_items: 1024
})

export const GOAL15_SCALE_RESOURCE_PROFILE = Object.freeze({
  profile_id: 'goal15-scale-bounded',
  cpu_cores: 2,
  memory_mib: 1024,
  scratch_mib: 256,
  maximum_runtime_seconds: 900
})

const classOrder = new Map(['scientific', 'provenance', 'rights', 'packaging', 'trust'].map((value, index) => [value, index]))
const kindOrder = new Map(REVALIDATION_NODE_KINDS.map((value, index) => [value, index]))
const compareText = (left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right))
const ordinal = (value) => String(value).padStart(4, '0')
const reference = (release_id, marker) => ({ family: 'factory', release_id, schema_version: '2.0.0', digest: `sha256:${marker.repeat(64)}` })

function identified(payload, field) {
  return { ...payload, [field]: revalidationIdentity(payload) }
}

function node(kind, locator, index, dependency_count) {
  return identified({
    node_schema_version: REVALIDATION_CONTRACT_VERSION,
    kind,
    locator,
    content_digest: revalidationIdentity({ campaign: 'goal15-scale-v1', kind, index }),
    dependency_count
  }, 'node_id')
}

function edge(dependent_node_id, dependency_node_id, role, impact_classes) {
  return identified({ edge_schema_version: REVALIDATION_CONTRACT_VERSION, dependent_node_id, dependency_node_id, role, impact_classes }, 'edge_id')
}

function change(subject, path, before, after, reasons) {
  return identified({ change_schema_version: REVALIDATION_CONTRACT_VERSION, class: 'scientific', subject, path, before, after, reasons }, 'change_id')
}

export function createGoal15ScaleCampaign() {
  const anchor = node('record', 'scale:record:changed-authority', 0, 0)
  const runs = Array.from({ length: GOAL15_SCALE_COUNTS.runs }, (_, index) => node('run', `scale:run:${ordinal(index)}`, index, 1))
  const assertions = Array.from({ length: GOAL15_SCALE_COUNTS.assertions }, (_, index) => node('assertion', `scale:assertion:${ordinal(index)}`, index, 1))
  const reports = Array.from({ length: GOAL15_SCALE_COUNTS.reports }, (_, index) => node('report', `scale:report:${ordinal(index)}`, index, 1))
  const controls = Array.from({ length: GOAL15_SCALE_COUNTS.registration_negative_controls }, (_, index) => node('transform', `registration:negative-control:${ordinal(index)}`, index, 1))
  const edges = [
    ...runs.map((run) => edge(run.node_id, anchor.node_id, 'run-input', ['scientific'])),
    ...assertions.map((assertion, index) => edge(assertion.node_id, runs[index].node_id, 'run-input', ['scientific'])),
    ...reports.map((report, index) => edge(report.node_id, assertions[index].node_id, 'report-input', ['scientific'])),
    ...controls.map((control) => edge(control.node_id, anchor.node_id, 'spatial-input', ['packaging']))
  ].sort((left, right) => compareText(left.edge_id, right.edge_id))
  const nodes = [anchor, ...runs, ...assertions, ...reports, ...controls].sort((left, right) => compareText(left.node_id, right.node_id))
  const root_node_ids = [...runs.slice(assertions.length), ...reports, ...controls].map((item) => item.node_id).sort(compareText)
  const snapshotPayload = { snapshot_schema_version: REVALIDATION_CONTRACT_VERSION, closure_complete: true, root_node_ids, nodes, edges }
  const dependencySnapshot = identified(snapshotPayload, 'snapshot_id')

  const changes = [
    change('scale:record:changed-authority', '$.authority', 'baseline', 'candidate', ['goal15:scale-positive-control']),
    change('registration:unrelated-source', '$.registration', 'unregistered', 'candidate', ['goal15:registration-negative-control'])
  ].sort((left, right) => classOrder.get(left.class) - classOrder.get(right.class) || compareText(left.subject, right.subject) || compareText(left.path, right.path) || compareText(left.change_id, right.change_id))
  const changePayload = {
    change_set_schema_version: REVALIDATION_CONTRACT_VERSION,
    source_diff_digest: revalidationIdentity({ campaign: 'goal15-scale-v1', source: 'semantic-diff' }),
    baseline: reference('goal15-scale-baseline-v1.0.0', 'a'),
    candidate: reference('goal15-scale-candidate-v1.0.1', 'b'),
    changes
  }
  const changeSet = identified(changePayload, 'change_set_id')
  const work_rules = [
    { node_kind: 'run', action: 'reproduce', expected_artifact_class: 'run-revalidation', resource_profile: GOAL15_SCALE_RESOURCE_PROFILE },
    { node_kind: 'assertion', action: 'review', expected_artifact_class: 'assertion-revalidation', resource_profile: GOAL15_SCALE_RESOURCE_PROFILE },
    { node_kind: 'report', action: 'reproduce', expected_artifact_class: 'report-revalidation', resource_profile: GOAL15_SCALE_RESOURCE_PROFILE }
  ].sort((left, right) => kindOrder.get(left.node_kind) - kindOrder.get(right.node_kind))
  const policyPayload = {
    policy_schema_version: REVALIDATION_CONTRACT_VERSION,
    change_classes: ['scientific'],
    traversal: 'transitive',
    maximum_depth: 3,
    impact_kinds: ['transform', 'run', 'assertion', 'report'].sort((left, right) => kindOrder.get(left) - kindOrder.get(right)),
    work_rules
  }
  const impactPolicy = identified(policyPayload, 'policy_id')
  const unrelated = changes.find((item) => item.subject === 'registration:unrelated-source')
  const unrelatedChanges = [{
    change_id: unrelated.change_id,
    subject: unrelated.subject,
    dependency_snapshot_id: dependencySnapshot.snapshot_id,
    disposition: 'unrelated-to-dependency-closure',
    closure_evidence: { snapshot_closure_complete: true, matching_node_ids: [] },
    reason: 'The complete dependency snapshot contains no node with this registration-source locator.'
  }]
  const planning = { dependencySnapshot, changeSet, impactPolicy, unrelatedChanges }
  return immutable({ ...planning, impactPlan: recomputeImpactPlan(planning) })
}
