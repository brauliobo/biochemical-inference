// Turns the signed causal model (src/knowledge/causal.js) into what the visual templates and the atlas draw:
// LayeredGraph nodes and edges, signed effect rows for tables, and the conditions an entity relates to.
// Pure functions over the shipped graph.
import { causalGraph, getEntity, graph } from '../knowledge/index.js'
import { TIER_LABELS } from '../knowledge/causal.js'
import { relationInfo, edgeSign } from '../knowledge/relations.js'
import { claimStatusInfo } from '../knowledge/evidence.js'

export { TIER_LABELS }

const CONDITION_TYPES = ['state', 'disease', 'outcome']
const NOT_EFFECTS = new Set(['evidence-for', 'evidence-against', 'has-evidence', 'has-counterevidence'])

/** The LayeredGraph sign id of a causal edge. */
export function vizSign(edge) {
  if (edge.rel === 'mitigates') return 'mitigate'
  if (edge.rel === 'aggravates') return 'aggravate'
  if (edge.sign === '-') return 'decrease'
  return edge.sign === '+' ? 'increase' : 'neutral'
}

/** Short label for a graph node: the name, or the acronym in its parentheses when the name is long. */
export function graphLabel(name = '') {
  const head = name.replace(/\([^()]*\)/g, '').replace(/\s+/g, ' ').trim()
  const acronym = /\(([^()]*)\)/.exec(name)?.[1]?.split(/[;,]/)[0].trim()
  if (head.length <= 20 || !acronym || acronym.length > 12) return head || name
  return acronym
}

const STATUS_WORD = Object.freeze({ supported: 'supported', 'partly-supported': 'partly', unsupported: 'unsupported', contested: 'contested' })

/** Edge label on the graph: a hypothesis names how far its claim is supported; other edges use the sign glyph. */
export function edgeLabel(edge) {
  if (!edge.hypothesis) return vizSign(edge) === 'neutral' ? relationInfo(edge.rel)?.label.toLowerCase() : undefined
  const glyph = { increase: '+', decrease: '−', mitigate: 'eases', aggravate: 'worsens', neutral: '' }[vizSign(edge)]
  return `${glyph}? ${STATUS_WORD[edge.claimStatus] ?? 'hypothesis'}`.trim()
}

/** causalGraph result -> { nodes, edges } for LayeredGraph, with the focus kept. */
export function toGraph(causal) {
  return {
    nodes: causal.nodes.map((node) => ({ id: node.id, label: graphLabel(node.name), type: node.type, tier: node.tier ?? 1, grade: node.evidence })),
    edges: causal.edges.map((edge) => ({
      from: edge.from,
      to: edge.to,
      sign: vizSign(edge),
      hypothesis: edge.hypothesis,
      ...(edgeLabel(edge) ? { label: edgeLabel(edge) } : {}),
      claimId: edge.claimId,
      claimStatus: edge.claimStatus,
      rel: edge.rel
    }))
  }
}

/** Causal neighbourhood of one entity ready for LayeredGraph; null when it has no signed edges. */
export function causalFor(id, { depth = 2, direction = 'both', limit = 24, includeHypothesis = true, types, unsignedFallback = false } = {}) {
  let causal = causalGraph({ focus: id, depth, direction, limit, includeHypothesis, ...(types ? { types } : {}) })
  let unsigned = false
  if (!causal.edges.length && unsignedFallback) {
    causal = causalGraph({ focus: id, depth: 1, direction, limit, includeHypothesis, signedOnly: false, ...(types ? { types } : {}) })
    unsigned = true
  }
  if (!causal.edges.length) return null
  return { ...toGraph(causal), unsigned, counts: { nodes: causal.nodes.length, edges: causal.edges.length } }
}

/**
 * Signed effects of an entity as rows, from its own point of view:
 *   { id, name, type, evidence, phrase ('Mitigates', 'Mitigated by'), dir ('out' | 'in'), rel, sign ('+' | '-'), vizSign, hypothesis, claimId, claimStatus, strength, note }
 * Claims, articles and evidence relations are not effects.
 */
export function effectRows(id) {
  const rows = []
  const add = (edge, dir) => {
    const sign = edgeSign(edge)
    if (!sign || NOT_EFFECTS.has(edge.rel)) return
    const other = getEntity(dir === 'out' ? edge.to : edge.from)
    if (!other || other.type === 'claim' || other.type === 'article') return
    const info = relationInfo(edge.rel)
    const claim = edge.claim ? getEntity(edge.claim) : undefined
    rows.push({
      id: other.id,
      name: other.name,
      type: other.type,
      evidence: other.evidence,
      phrase: dir === 'out' ? info.label : relationInfo(info.inverse).label,
      dir,
      rel: edge.rel,
      sign,
      vizSign: vizSign({ ...edge, sign }),
      hypothesis: edge.hypothesis === true,
      claimId: claim?.id ?? null,
      claimStatus: claim?.status ?? null,
      strength: edge.strength ?? null,
      note: edge.note ?? null
    })
  }
  for (const edge of graph.outgoing(id)) add(edge, 'out')
  for (const edge of graph.incoming(id)) add(edge, 'in')
  return rows
}

/** Rows grouped by phrase, in the order of first appearance among the given phrases (then the rest). */
export function groupRows(rows, order = []) {
  const groups = new Map()
  for (const row of rows) {
    if (!groups.has(row.phrase)) groups.set(row.phrase, [])
    groups.get(row.phrase).push(row)
  }
  const rank = (phrase) => (order.includes(phrase) ? order.indexOf(phrase) : order.length)
  return [...groups.entries()].sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0])).map(([phrase, items]) => ({ phrase, items: items.sort((a, b) => a.name.localeCompare(b.name)) }))
}

const SKIP_RELS = new Set(['evidence-for', 'evidence-against', 'has-evidence', 'has-counterevidence', 'part-of', 'has-part', 'substrate-of', 'product-of', 'has-substrate', 'has-product', 'catalyzes', 'catalyzed-by'])

/**
 * States, diseases and outcomes an entity relates to, grouped by relation words
 * ("Mitigates", "Aggravates", "Associated with"): [{ label, items: [{ id, name, type, hypothesis, claimStatus }] }].
 */
export function conditionsFor(id) {
  const groups = new Map()
  for (const link of graph.links(id)) {
    if (SKIP_RELS.has(link.rel)) continue
    const other = getEntity(link.other)
    if (!other || !CONDITION_TYPES.includes(other.type)) continue
    const claim = link.claim ? getEntity(link.claim) : undefined
    if (!groups.has(link.label)) groups.set(link.label, { label: link.label, rel: link.rel, items: [] })
    const group = groups.get(link.label)
    if (!group.items.some((item) => item.id === other.id)) {
      group.items.push({ id: other.id, name: other.name, type: other.type, hypothesis: link.hypothesis === true, claimStatus: claim?.status ?? null, claimLabel: claim ? claimStatusInfo(claim.status).label : null })
    }
  }
  const strength = (label) => ['Causes', 'Caused by', 'Aggravates', 'Aggravated by', 'Mitigates', 'Mitigated by', 'Manifests as', 'Manifestation of', 'Increases', 'Decreases', 'Measured by', 'Measures'].indexOf(label)
  return [...groups.values()]
    .map((group) => ({ ...group, items: group.items.sort((a, b) => a.name.localeCompare(b.name)) }))
    .sort((a, b) => (strength(a.label) < 0 ? 99 : strength(a.label)) - (strength(b.label) < 0 ? 99 : strength(b.label)))
}
