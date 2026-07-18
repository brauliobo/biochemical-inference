import { TextDecoder } from 'node:util'
import { canonicalJson } from '../../shared/canonical-json.js'
import {
  DependencySnapshotSchema,
  ImpactPolicySchema,
  NormalizedChangeSetSchema,
  REVALIDATION_CHANGE_CLASSES,
  REVALIDATION_NODE_KINDS
} from '../../shared/revalidation-contracts.js'
import { assertRevalidationIdentity, identityPayload, immutable } from './identity.js'

export const MAX_REVALIDATION_WIRE_BYTES = 16 * 1024 * 1024
const utf8 = new TextDecoder('utf-8', { fatal: true })
const classOrder = new Map(REVALIDATION_CHANGE_CLASSES.map((value, index) => [value, index]))
const kindOrder = new Map(REVALIDATION_NODE_KINDS.map((value, index) => [value, index]))

export class RevalidationVerificationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'RevalidationVerificationError'
    this.code = 'REVALIDATION_VERIFICATION_FAILED'
    this.statusCode = 409
  }
}

export function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(left, 'utf8'), Buffer.from(right, 'utf8'))
}

export function parseRevalidation(schema, value, label) {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw new RevalidationVerificationError(`${label} does not match the strict revalidation contract: ${parsed.error.issues[0].message}`)
  return parsed.data
}

export function parseCanonicalRevalidation(bytes, schema, label) {
  const byteArray = Buffer.isBuffer(bytes) || bytes instanceof Uint8Array || ArrayBuffer.isView(bytes)
  if (!byteArray || bytes.byteLength === 0 || bytes.byteLength > MAX_REVALIDATION_WIRE_BYTES) {
    throw new RevalidationVerificationError(`${label} exceeds its bounded canonical JSON contract`)
  }
  let text
  let value
  try {
    text = utf8.decode(bytes)
    value = JSON.parse(text)
  } catch {
    throw new RevalidationVerificationError(`${label} is not strict UTF-8 JSON`)
  }
  let canonical
  try {
    canonical = canonicalJson(value)
  } catch {
    throw new RevalidationVerificationError(`${label} cannot be RFC 8785 canonical JSON`)
  }
  if (canonical !== text) throw new RevalidationVerificationError(`${label} is not RFC 8785 canonical JSON`)
  return parseRevalidation(schema, value, label)
}

function assertIdentity(actual, payload, label) {
  try {
    assertRevalidationIdentity(actual, payload, label)
  } catch (error) {
    throw new RevalidationVerificationError(error.message)
  }
}

function assertOrderedUnique(values, compare, label) {
  for (let index = 1; index < values.length; index += 1) {
    if (compare(values[index - 1], values[index]) >= 0) throw new RevalidationVerificationError(`${label} must be uniquely ordered`)
  }
}

function compareChange(left, right) {
  return classOrder.get(left.class) - classOrder.get(right.class) ||
    compareUtf8(left.subject, right.subject) ||
    compareUtf8(left.path, right.path) ||
    compareUtf8(left.change_id, right.change_id)
}

export function verifyDependencySnapshot(value) {
  const snapshot = parseRevalidation(DependencySnapshotSchema, value, 'dependency snapshot')
  assertOrderedUnique(snapshot.nodes.map((item) => item.node_id), compareUtf8, 'dependency snapshot nodes')
  assertOrderedUnique(snapshot.edges.map((item) => item.edge_id), compareUtf8, 'dependency snapshot edges')
  assertOrderedUnique(snapshot.root_node_ids, compareUtf8, 'dependency snapshot roots')
  if (new Set(snapshot.nodes.map((item) => item.locator)).size !== snapshot.nodes.length) throw new RevalidationVerificationError('dependency snapshot locators must be unique')

  const nodes = new Map(snapshot.nodes.map((node) => [node.node_id, node]))
  const outgoing = new Map(snapshot.nodes.map((node) => [node.node_id, []]))
  const dependentCounts = new Map(snapshot.nodes.map((node) => [node.node_id, 0]))
  for (const node of snapshot.nodes) assertIdentity(node.node_id, identityPayload(node, 'node_id'), 'dependency node')
  for (const edge of snapshot.edges) {
    assertOrderedUnique(edge.impact_classes, (left, right) => classOrder.get(left) - classOrder.get(right), 'dependency edge impact classes')
    assertIdentity(edge.edge_id, identityPayload(edge, 'edge_id'), 'dependency edge')
    if (edge.dependent_node_id === edge.dependency_node_id) throw new RevalidationVerificationError('dependency edge cannot reference itself')
    if (!nodes.has(edge.dependent_node_id) || !nodes.has(edge.dependency_node_id)) throw new RevalidationVerificationError('dependency snapshot has a dangling edge')
    outgoing.get(edge.dependent_node_id).push(edge.dependency_node_id)
    dependentCounts.set(edge.dependency_node_id, dependentCounts.get(edge.dependency_node_id) + 1)
  }
  for (const node of snapshot.nodes) {
    if (outgoing.get(node.node_id).length !== node.dependency_count) throw new RevalidationVerificationError(`dependency snapshot closure is incomplete for ${node.locator}`)
  }
  for (const root of snapshot.root_node_ids) if (!nodes.has(root)) throw new RevalidationVerificationError('dependency snapshot has an unknown root')

  const visiting = new Set()
  const visited = new Set()
  function visit(nodeId) {
    if (visiting.has(nodeId)) throw new RevalidationVerificationError('dependency snapshot contains a cycle')
    if (visited.has(nodeId)) return
    visiting.add(nodeId)
    for (const dependency of outgoing.get(nodeId)) visit(dependency)
    visiting.delete(nodeId)
    visited.add(nodeId)
  }
  for (const root of snapshot.root_node_ids) visit(root)
  if (visited.size !== snapshot.nodes.length) throw new RevalidationVerificationError('dependency snapshot closure has unreachable nodes')
  const expectedRoots = snapshot.nodes.filter((node) => dependentCounts.get(node.node_id) === 0).map((node) => node.node_id).sort(compareUtf8)
  if (canonicalJson(expectedRoots) !== canonicalJson(snapshot.root_node_ids)) throw new RevalidationVerificationError('dependency snapshot root closure mismatch')
  assertIdentity(snapshot.snapshot_id, identityPayload(snapshot, 'snapshot_id'), 'dependency snapshot')
  return immutable(snapshot)
}

export function verifyNormalizedChangeSet(value) {
  const changeSet = parseRevalidation(NormalizedChangeSetSchema, value, 'normalized change set')
  assertOrderedUnique(changeSet.changes, compareChange, 'normalized changes')
  for (const change of changeSet.changes) {
    assertOrderedUnique(change.reasons, compareUtf8, 'normalized change reasons')
    assertIdentity(change.change_id, identityPayload(change, 'change_id'), 'normalized change')
  }
  assertIdentity(changeSet.change_set_id, identityPayload(changeSet, 'change_set_id'), 'normalized change set')
  return immutable(changeSet)
}

export function verifyImpactPolicy(value) {
  const policy = parseRevalidation(ImpactPolicySchema, value, 'impact policy')
  assertOrderedUnique(policy.change_classes, (left, right) => classOrder.get(left) - classOrder.get(right), 'impact policy change classes')
  assertOrderedUnique(policy.impact_kinds, (left, right) => kindOrder.get(left) - kindOrder.get(right), 'impact policy kinds')
  assertOrderedUnique(policy.work_rules, (left, right) => kindOrder.get(left.node_kind) - kindOrder.get(right.node_kind), 'impact policy work rules')
  if (policy.work_rules.some((rule) => !policy.impact_kinds.includes(rule.node_kind))) throw new RevalidationVerificationError('impact policy work rules must select an impact kind')
  if ((policy.traversal === 'direct' && policy.maximum_depth !== 1) || (policy.traversal === 'transitive' && policy.maximum_depth < 2)) {
    throw new RevalidationVerificationError('impact policy traversal and maximum depth conflict')
  }
  assertIdentity(policy.policy_id, identityPayload(policy, 'policy_id'), 'impact policy')
  return immutable(policy)
}
