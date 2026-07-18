import { canonicalJson } from '../../shared/canonical-json.js'
import {
  ImpactPlanSchema,
  MAX_MATERIALIZED_IMPACT_REASONS,
  REVALIDATION_CHANGE_CLASSES,
  REVALIDATION_CONTRACT_VERSION,
  REVALIDATION_NODE_KINDS,
  RevalidationImpactSchema,
  RevalidationWorkItemSchema,
  UnrelatedChangeClosureSchema
} from '../../shared/revalidation-contracts.js'
import { identityPayload, immutable, revalidationIdentity } from './identity.js'
import {
  RevalidationVerificationError,
  compareUtf8,
  parseRevalidation,
  verifyDependencySnapshot,
  verifyImpactPolicy,
  verifyNormalizedChangeSet
} from './verification.js'

const classOrder = new Map(REVALIDATION_CHANGE_CLASSES.map((value, index) => [value, index]))
const kindOrder = new Map(REVALIDATION_NODE_KINDS.map((value, index) => [value, index]))
const compareClasses = (left, right) => classOrder.get(left) - classOrder.get(right)
const comparePaths = (left, right) => compareUtf8(left.join('\0'), right.join('\0'))

function identityObject(schema, payload, identityField, label) {
  return parseRevalidation(schema, { ...payload, [identityField]: revalidationIdentity(payload) }, label)
}

function verifyUnrelatedChanges(snapshot, changes, policy, declarations) {
  const nodesByLocator = new Map(snapshot.nodes.map((node) => [node.locator, node]))
  const unmatched = changes.changes.filter((change) => policy.change_classes.includes(change.class) && !nodesByLocator.has(change.subject)).sort((left, right) => compareUtf8(left.change_id, right.change_id))
  const normalized = declarations.map((value) => parseRevalidation(UnrelatedChangeClosureSchema, value, 'unrelated change closure')).sort((left, right) => compareUtf8(left.change_id, right.change_id))
  if (new Set(normalized.map((value) => value.change_id)).size !== normalized.length) throw new RevalidationVerificationError('unrelated change closures must be unique')
  if (normalized.length !== unmatched.length) throw new RevalidationVerificationError('every unmatched selected-class change requires complete unrelated closure evidence')
  normalized.forEach((declaration, index) => {
    const change = unmatched[index]
    if (declaration.change_id !== change.change_id || declaration.subject !== change.subject || declaration.dependency_snapshot_id !== snapshot.snapshot_id || snapshot.closure_complete !== true || nodesByLocator.has(declaration.subject)) {
      throw new RevalidationVerificationError('unrelated change closure does not prove absence from the complete dependency snapshot')
    }
  })
  return normalized
}

export function recomputeImpactPlan({ dependencySnapshot, changeSet, impactPolicy, unrelatedChanges = [] }) {
  const snapshot = verifyDependencySnapshot(dependencySnapshot)
  const changes = verifyNormalizedChangeSet(changeSet)
  const policy = verifyImpactPolicy(impactPolicy)
  const unrelated = verifyUnrelatedChanges(snapshot, changes, policy, unrelatedChanges)
  const nodes = new Map(snapshot.nodes.map((node) => [node.node_id, node]))
  const locatorNodes = new Map(snapshot.nodes.map((node) => [node.locator, node]))
  const reverseEdges = new Map(snapshot.nodes.map((node) => [node.node_id, new Map()]))
  for (const edge of snapshot.edges) {
    const byClass = reverseEdges.get(edge.dependency_node_id)
    for (const classification of edge.impact_classes) {
      if (!byClass.has(classification)) byClass.set(classification, [])
      byClass.get(classification).push(edge)
    }
  }
  for (const byClass of reverseEdges.values()) {
    for (const edges of byClass.values()) edges.sort((left, right) => compareUtf8(left.edge_id, right.edge_id))
  }

  const selectedClasses = new Set(policy.change_classes)
  const selectedKinds = new Set(policy.impact_kinds)
  const collected = new Map()
  const changeGroups = new Map()
  let materializedReasonCount = 0
  for (const change of changes.changes.filter((item) => selectedClasses.has(item.class))) {
    const anchor = locatorNodes.get(change.subject)
    if (!anchor) continue
    const key = `${anchor.node_id}\0${change.class}`
    if (!changeGroups.has(key)) changeGroups.set(key, { anchor, classification: change.class, changes: [] })
    changeGroups.get(key).changes.push(change)
  }
  for (const group of changeGroups.values()) {
    const best = new Map([[group.anchor.node_id, { distance: 0, edgeIds: [] }]])
    const queue = [group.anchor.node_id]
    for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
      const currentId = queue[queueIndex]
      const current = best.get(currentId)
      for (const edge of reverseEdges.get(currentId).get(group.classification) ?? []) {
        const distance = current.distance + 1
        if (distance > policy.maximum_depth) continue
        const edgeIds = [...current.edgeIds, edge.edge_id]
        const previous = best.get(edge.dependent_node_id)
        if (!previous || distance < previous.distance || (distance === previous.distance && comparePaths(edgeIds, previous.edgeIds) < 0)) {
          best.set(edge.dependent_node_id, { distance, edgeIds })
          queue.push(edge.dependent_node_id)
        }
      }
    }
    for (const [nodeId, route] of best) {
      if (route.distance === 0) continue
      const node = nodes.get(nodeId)
      if (!selectedKinds.has(node.kind)) continue
      materializedReasonCount += group.changes.length
      if (materializedReasonCount > MAX_MATERIALIZED_IMPACT_REASONS) throw new RevalidationVerificationError(`materialized impact reason closure exceeds the declared ${MAX_MATERIALIZED_IMPACT_REASONS} reason cap`)
      const impact = collected.get(nodeId) ?? { node, distance: route.distance, reasons: [] }
      impact.distance = Math.min(impact.distance, route.distance)
      impact.reasons.push(...group.changes.map((change) => ({
        change_id: change.change_id,
        change_class: change.class,
        subject: change.subject,
        path: change.path,
        distance: route.distance,
        edge_ids: route.edgeIds
      })))
      collected.set(nodeId, impact)
    }
  }

  const impacts = []
  for (const { node, distance, reasons } of collected.values()) {
    reasons.sort((left, right) => compareClasses(left.change_class, right.change_class) || compareUtf8(left.change_id, right.change_id) || left.distance - right.distance || comparePaths(left.edge_ids, right.edge_ids))
    const payload = {
      node_id: node.node_id,
      node_kind: node.kind,
      locator: node.locator,
      relation: distance === 1 ? 'direct' : 'transitive',
      distance,
      classes: [...new Set(reasons.map((reason) => reason.change_class))].sort(compareClasses),
      reasons
    }
    impacts.push(identityObject(RevalidationImpactSchema, payload, 'impact_id', 'dependency impact'))
  }
  impacts.sort((left, right) => left.distance - right.distance || kindOrder.get(left.node_kind) - kindOrder.get(right.node_kind) || compareUtf8(left.locator, right.locator) || compareUtf8(left.node_id, right.node_id))

  const rules = new Map(policy.work_rules.map((rule) => [rule.node_kind, rule]))
  const workItems = []
  for (const impact of impacts) {
    const rule = rules.get(impact.node_kind)
    if (!rule) continue
    const payload = {
      work_schema_version: REVALIDATION_CONTRACT_VERSION,
      baseline: changes.baseline,
      candidate: changes.candidate,
      change_set_id: changes.change_set_id,
      dependency_snapshot_id: snapshot.snapshot_id,
      impact_policy_id: policy.policy_id,
      impact_id: impact.impact_id,
      subject_node_id: impact.node_id,
      impact_classes: impact.classes,
      reason_change_ids: [...new Set(impact.reasons.map((reason) => reason.change_id))].sort(compareUtf8),
      action: rule.action,
      expected_artifact_class: rule.expected_artifact_class,
      resource_profile: rule.resource_profile
    }
    workItems.push(identityObject(RevalidationWorkItemSchema, payload, 'work_id', 'revalidation work item'))
  }
  workItems.sort((left, right) => compareUtf8(left.work_id, right.work_id))
  const payload = {
    plan_schema_version: REVALIDATION_CONTRACT_VERSION,
    baseline: changes.baseline,
    candidate: changes.candidate,
    change_set_id: changes.change_set_id,
    dependency_snapshot_id: snapshot.snapshot_id,
    impact_policy_id: policy.policy_id,
    ...(unrelated.length ? { unrelated_changes: unrelated } : {}),
    impacts,
    work_items: workItems
  }
  return immutable(identityObject(ImpactPlanSchema, payload, 'plan_id', 'revalidation impact plan'))
}

function orderedIds(values, key) {
  return values.map((value) => value[key])
}

function same(left, right) {
  return canonicalJson(left) === canonicalJson(right)
}

export function verifyImpactPlan({ dependencySnapshot, changeSet, impactPolicy, impactPlan }) {
  const actual = parseRevalidation(ImpactPlanSchema, impactPlan, 'revalidation impact plan')
  const expected = recomputeImpactPlan({ dependencySnapshot, changeSet, impactPolicy, unrelatedChanges: actual.unrelated_changes ?? [] })
  for (const impact of actual.impacts) {
    if (impact.impact_id !== revalidationIdentity(identityPayload(impact, 'impact_id'))) throw new RevalidationVerificationError('dependency impact identity drift')
  }
  for (const work of actual.work_items) {
    if (work.work_id !== revalidationIdentity(identityPayload(work, 'work_id'))) throw new RevalidationVerificationError('revalidation work identity drift')
  }
  const actualImpactIds = orderedIds(actual.impacts, 'impact_id')
  const expectedImpactIds = orderedIds(expected.impacts, 'impact_id')
  if (!same(actualImpactIds, expectedImpactIds)) {
    const expectedByNode = new Map(expected.impacts.map((impact) => [impact.node_id, impact]))
    const classDrift = actual.impacts.some((impact) => expectedByNode.has(impact.node_id) && !same(impact.classes, expectedByNode.get(impact.node_id).classes))
    if (classDrift) throw new RevalidationVerificationError('revalidation impact class drift')
    if (same([...actualImpactIds].sort(compareUtf8), [...expectedImpactIds].sort(compareUtf8))) throw new RevalidationVerificationError('revalidation impact order tampering')
    throw new RevalidationVerificationError('revalidation impact closure is incomplete or excessive')
  }
  const actualWorkIds = orderedIds(actual.work_items, 'work_id')
  const expectedWorkIds = orderedIds(expected.work_items, 'work_id')
  if (!same(actualWorkIds, expectedWorkIds)) {
    if (same([...actualWorkIds].sort(compareUtf8), [...expectedWorkIds].sort(compareUtf8))) throw new RevalidationVerificationError('revalidation work order tampering')
    throw new RevalidationVerificationError('revalidation work identity closure drift')
  }
  if (!same(actual, expected)) throw new RevalidationVerificationError('revalidation impact plan content drift')
  if (actual.plan_id !== revalidationIdentity(identityPayload(actual, 'plan_id'))) throw new RevalidationVerificationError('revalidation impact plan identity mismatch')
  return immutable(actual)
}
