// Models behind the atlas views (pure functions over the shipped graph): the type-by-type relation matrix and its
// drill-down, the topics and filters of the causal explorer, and the pathways of a metabolic map.
import { causalGraph, causalSlice, causalSlices, getEntity, graph, typeMatrix } from '../knowledge/index.js'
import { DEFAULT_TYPES } from '../knowledge/causal.js'
import { TYPES } from '../knowledge/types.js'
import { labelFor } from '../knowledge/relations.js'
import { toGraph, vizSign } from './causal-view.js'
import { participantsOf } from './layout-map.js'

// ---- the type-by-type matrix ----

/** Matrix input for the Matrix chart: { types: [{ id, label }], counts: { from: { to: n } }, total, strongest }. */
export function matrixModel({ includeEvidence = false } = {}) {
  const result = typeMatrix({ includeEvidence })
  const labels = new Map(TYPES.map((type) => [type.id, type.plural]))
  const counts = {}
  for (const cell of result.cells) (counts[cell.from] ??= {})[cell.to] = cell.count
  return { types: result.types.map((id) => ({ id, label: labels.get(id) ?? id })), counts, total: result.total, strongest: result.cells[0] ?? null, cells: result.cells }
}

const EVIDENCE = new Set(['evidence-for', 'evidence-against'])

/**
 * The relations stored from one type to another: [{ from, to, rel, label, sign, hypothesis, note }] sorted by relation then
 * names, at most `limit`; `total` is how many exist. Derived reaction links are included, evidence links only on request.
 */
export function relationsBetween(from, to, { limit = 150, includeEvidence = false } = {}) {
  const rows = []
  for (const edge of graph.edges) {
    if (!includeEvidence && EVIDENCE.has(edge.rel)) continue
    const a = getEntity(edge.from)
    const b = getEntity(edge.to)
    if (a?.type !== from || b?.type !== to) continue
    rows.push({ from: a.id, fromName: a.name, to: b.id, toName: b.name, rel: edge.rel, label: labelFor(edge.rel), hypothesis: edge.hypothesis === true, note: edge.note ?? '' })
  }
  rows.sort((x, y) => x.label.localeCompare(y.label) || x.fromName.localeCompare(y.fromName) || x.toName.localeCompare(y.toName))
  const byRel = {}
  for (const row of rows) byRel[row.label] = (byRel[row.label] ?? 0) + 1
  return { rows: rows.slice(0, limit), total: rows.length, byRelation: byRel }
}

// ---- the causal explorer ----

export const DIRECTIONS = Object.freeze([{ value: 'both', label: 'Causes and effects' }, { value: 'up', label: 'Only what leads to it' }, { value: 'down', label: 'Only what it leads to' }])
export const SIGN_FILTERS = Object.freeze([{ value: '', label: 'All signs' }, { value: 'mitigate', label: 'Mitigates (eases)' }, { value: 'aggravate', label: 'Aggravates (worsens)' }, { value: 'increase', label: 'Increases (+)' }, { value: 'decrease', label: 'Decreases (−)' }])
export const KIND_CHOICES = Object.freeze(DEFAULT_TYPES.map((id) => ({ id, label: TYPES.find((type) => type.id === id)?.plural ?? id })))

/** Topics to start from: guided paths and hub topics. [{ id, kind, title, summary }]. */
export function topics() {
  return causalSlices().map((slice) => ({ id: slice.id, kind: slice.kind, title: slice.title, summary: slice.summary }))
}

export const DEFAULT_TOPIC = 'path:glycine-belching-question'

/** Normalised explorer state from untrusted query values. */
export function readCausal(query = {}) {
  const topicIds = new Set(topics().map((topic) => topic.id))
  const focus = typeof query.focus === 'string' && getEntity(query.focus) && DEFAULT_TYPES.includes(getEntity(query.focus).type) ? query.focus : ''
  const depth = [1, 2, 3].includes(Number(query.depth)) ? Number(query.depth) : 2
  const kinds = String(query.kinds ?? '').split(',').filter((id) => DEFAULT_TYPES.includes(id))
  return {
    topic: focus ? '' : topicIds.has(query.topic) ? query.topic : DEFAULT_TOPIC,
    focus,
    depth,
    dir: ['both', 'up', 'down'].includes(query.dir) ? query.dir : 'both',
    hyp: query.hyp !== '0',
    sign: SIGN_FILTERS.some((item) => item.value && item.value === query.sign) ? query.sign : '',
    kinds
  }
}

/** Query object for the explorer state; defaults are left out. */
export function writeCausal(state) {
  return Object.fromEntries(Object.entries({
    topic: state.focus || state.topic === DEFAULT_TOPIC ? '' : state.topic,
    focus: state.focus,
    depth: state.depth === 2 ? '' : String(state.depth),
    dir: state.dir === 'both' ? '' : state.dir,
    hyp: state.hyp ? '' : '0',
    sign: state.sign,
    kinds: state.kinds.length ? state.kinds.join(',') : ''
  }).filter(([, value]) => value))
}

const PHRASE = { increase: 'Increases', decrease: 'Decreases', mitigate: 'Mitigates', aggravate: 'Aggravates', neutral: 'Linked to' }

/** Rows for the links table: [{ from, fromName, to, toName, sign, phrase, hypothesis, claimId, claimStatus, rel }]. */
function linkRows(causal) {
  const name = new Map(causal.nodes.map((node) => [node.id, node.name]))
  return causal.edges.map((edge) => {
    const sign = vizSign(edge)
    return { from: edge.from, fromName: name.get(edge.from), to: edge.to, toName: name.get(edge.to), sign, phrase: PHRASE[sign], rel: edge.rel, hypothesis: edge.hypothesis, claimId: edge.claimId, claimStatus: edge.claimStatus, strength: edge.strength }
  })
}

/**
 * The causal map to draw for an explorer state:
 *   { title, summary, nodes, edges, rows, counts: { nodes, edges, hypotheses }, empty }
 * A focus entity gives its neighbourhood (depth, direction, at most 40 nodes); otherwise the topic's slice. The
 * hypothesis, sign and kind filters then remove edges (and nodes left without edges, except the focus).
 */
export function causalView(state) {
  let base
  let title
  let summary
  if (state.focus) {
    base = causalGraph({ focus: state.focus, depth: state.depth, direction: state.dir, includeHypothesis: true, limit: 40 })
    const entity = getEntity(state.focus)
    title = entity.name
    summary = `${state.dir === 'up' ? 'What leads to' : state.dir === 'down' ? 'What follows from' : 'Causes and effects of'} ${entity.name}, up to ${state.depth} ${state.depth === 1 ? 'step' : 'steps'} away.`
  } else {
    const slice = causalSlice(state.topic) ?? causalSlice(DEFAULT_TOPIC)
    base = slice
    title = slice.title
    summary = slice.summary
  }
  const kinds = state.kinds.length ? new Set(state.kinds) : null
  const nodesKept = new Set(base.nodes.filter((node) => !kinds || kinds.has(node.type) || node.id === state.focus).map((node) => node.id))
  const edges = base.edges.filter((edge) => nodesKept.has(edge.from) && nodesKept.has(edge.to) && (state.hyp || !edge.hypothesis) && (!state.sign || vizSign(edge) === state.sign))
  const used = new Set(edges.flatMap((edge) => [edge.from, edge.to]))
  const nodes = base.nodes.filter((node) => used.has(node.id) || (node.id === state.focus && !state.sign))
  const result = { nodes, edges }
  const drawn = toGraph(result)
  return {
    title,
    summary,
    ...drawn,
    rows: linkRows(result).sort((a, b) => (b.from === state.focus || b.to === state.focus) - (a.from === state.focus || a.to === state.focus) || a.fromName.localeCompare(b.fromName)),
    counts: { nodes: nodes.length, edges: edges.length, hypotheses: edges.filter((edge) => edge.hypothesis).length },
    empty: edges.length === 0
  }
}

// ---- the metabolic network explorer ----

/** Pathways whose reactions (two or more) sit on a layout: [{ id, name, reactions: [reaction ids placed] }]. */
export function pathwaysOnLayout(layout) {
  const placed = new Set(layout.nodes.map((node) => node.id))
  return graph.byType.get('pathway').map((pathway) => ({
    id: pathway.id,
    name: pathway.name,
    reactions: graph.links(pathway.id).filter((link) => link.rel === 'has-part' && getEntity(link.other)?.type === 'reaction' && placed.has(link.other)).map((link) => link.other)
  })).filter((item) => item.reactions.length >= 2).sort((a, b) => a.name.localeCompare(b.name))
}

/** Node ids of a layout restricted to a pathway's reactions and what they touch, or null for the whole map. */
export function pathwayInclude(layout, pathwayId) {
  const found = pathwaysOnLayout(layout).find((item) => item.id === pathwayId)
  return found ? participantsOf(layout, found.reactions) : null
}

