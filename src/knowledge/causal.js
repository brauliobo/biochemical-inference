// Signed causal model over the knowledge graph: the layer the atlas draws.
//
// Nodes are entities placed in tiers (intervention 0 ... outcome 5). Edges are the relations that state an
// effect (increases, decreases, causes, mitigates, aggravates, precursor-of, manifests-as, or any relation carrying
// an explicit sign), with the sign, the hypothesis flag and the claim that asserts them.
//
// Everything here is a pure function of a graph from buildGraph; nothing is cached on the graph.
import { TYPE_IDS } from './types.js'
import { edgeSign } from './relations.js'

/** Vertical order of the layered causal map. Claims and articles have no tier: they are evidence, not causes. */
export const TIERS = Object.freeze({
  intervention: 0,
  compound: 1,
  enzyme: 1,
  reaction: 1,
  pathway: 1,
  system: 2,
  state: 3,
  disease: 4,
  outcome: 5
})

export const TIER_LABELS = Object.freeze(['Interventions', 'Molecules, enzymes and pathways', 'Systems', 'States', 'Diseases', 'Outcomes'])

/** Tier of an entity type, or null for claims, articles and unknown types. */
export function tierOf(type) {
  return Object.hasOwn(TIERS, type) ? TIERS[type] : null
}

/** Types drawn by default: reactions are bookkeeping for the metabolic map, claims and articles are evidence. */
export const DEFAULT_TYPES = Object.freeze(['intervention', 'compound', 'enzyme', 'pathway', 'system', 'state', 'disease', 'outcome'])

const EVIDENCE_RELS = new Set(['evidence-for', 'evidence-against'])
const DEFAULT_LIMIT = 40

function node(graph, id, distance) {
  const entity = graph.get(id)
  return { id, type: entity.type, tier: tierOf(entity.type), name: entity.name, evidence: entity.evidence, ...(distance === undefined ? {} : { distance }) }
}

function edgeView(graph, edge) {
  const claim = edge.claim ? graph.get(edge.claim) : undefined
  return {
    from: edge.from,
    to: edge.to,
    rel: edge.rel,
    sign: edgeSign(edge),
    hypothesis: edge.hypothesis === true,
    claimId: claim ? claim.id : null,
    claimStatus: claim ? claim.status ?? null : null,
    strength: edge.strength ?? null,
    note: edge.note ?? null
  }
}

/**
 * The edges a view may draw, filtered:
 *   types             entity types allowed at both ends (default DEFAULT_TYPES)
 *   signedOnly        keep only edges with a sign (default true); false adds associations, interactions, part-of ...
 *   includeHypothesis keep edges flagged hypothesis (default true)
 *   rels              optional allow-list of relation ids
 * Evidence edges and edges touching claims or articles are never returned.
 */
export function causalEdges(graph, { types = DEFAULT_TYPES, signedOnly = true, includeHypothesis = true, rels } = {}) {
  const allowedTypes = new Set(types)
  const allowedRels = rels ? new Set(rels) : null
  return graph.edges.filter((edge) => {
    if (EVIDENCE_RELS.has(edge.rel)) return false
    if (allowedRels && !allowedRels.has(edge.rel)) return false
    if (signedOnly && !edgeSign(edge)) return false
    if (!includeHypothesis && edge.hypothesis === true) return false
    return allowedTypes.has(graph.get(edge.from).type) && allowedTypes.has(graph.get(edge.to).type)
  })
}

/** Adjacency over a list of edges: id -> [{ id, edge, dir }] with dir 'out' (id is the source) or 'in'. */
function adjacency(edges) {
  const map = new Map()
  const push = (key, value) => {
    const list = map.get(key)
    if (list) list.push(value)
    else map.set(key, [value])
  }
  for (const edge of edges) {
    push(edge.from, { id: edge.to, edge, dir: 'out' })
    push(edge.to, { id: edge.from, edge, dir: 'in' })
  }
  return map
}

const byId = (a, b) => a.id.localeCompare(b.id)
const edgeOrder = (a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to) || a.rel.localeCompare(b.rel)

/** Breadth-first distances from the seeds, following 'out' links, 'in' links or both. Stops at `depth`. */
function reach(adj, seeds, depth, direction) {
  const distance = new Map(seeds.map((id) => [id, 0]))
  const queue = [...seeds]
  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head]
    const here = distance.get(current)
    if (here >= depth) continue
    for (const link of adj.get(current) ?? []) {
      if (direction === 'down' && link.dir !== 'out') continue
      if (direction === 'up' && link.dir !== 'in') continue
      if (distance.has(link.id)) continue
      distance.set(link.id, here + 1)
      queue.push(link.id)
    }
  }
  return distance
}

/** Keep at most `limit` nodes: nearest first, then best connected, then id. Seeds survive when possible. */
function prune(distance, adj, limit, seedIds) {
  if (distance.size <= limit) return distance
  const degree = (id) => (adj.get(id) ?? []).length
  const seeds = new Set(seedIds)
  const ranked = [...distance.entries()].sort((a, b) => (seeds.has(b[0]) - seeds.has(a[0])) || a[1] - b[1] || degree(b[0]) - degree(a[0]) || a[0].localeCompare(b[0]))
  return new Map(ranked.slice(0, limit))
}

function assemble(graph, edges, distance, { dropIsolated = true } = {}) {
  const inside = edges.filter((edge) => distance.has(edge.from) && distance.has(edge.to))
  const used = new Set(inside.flatMap((edge) => [edge.from, edge.to]))
  const nodes = [...distance.entries()]
    .filter(([id, d]) => !dropIsolated || used.has(id) || d === 0)
    .map(([id, d]) => node(graph, id, d))
    .sort((a, b) => (a.tier ?? 99) - (b.tier ?? 99) || byId(a, b))
  return { nodes, edges: inside.map((edge) => edgeView(graph, edge)).sort(edgeOrder) }
}

/**
 * Causal subgraph of a knowledge graph.
 *   causalGraph(graph, { focus, depth, types, signedOnly, includeHypothesis, rels, direction, limit })
 * Without `focus` the whole filtered graph is returned. With `focus` (an id or an array of ids) the nodes within
 * `depth` steps (default 2) are returned; `direction` is 'both' (default), 'up' (causes of the focus) or 'down'
 * (its effects). `limit` caps the node count (nearest, then best connected, are kept).
 * Result: { nodes: [{ id, type, tier, name, evidence, distance? }], edges: [{ from, to, rel, sign, hypothesis,
 * claimId, claimStatus, strength, note }] }, nodes ordered by tier then id, edges by endpoints.
 */
export function causalGraph(graph, options = {}) {
  const { focus, depth = 2, direction = 'both', limit, ...filters } = options
  const edges = causalEdges(graph, filters)
  if (focus === undefined) {
    const ids = new Set(edges.flatMap((edge) => [edge.from, edge.to]))
    return assemble(graph, edges, new Map([...ids].map((id) => [id, 0])), { dropIsolated: false })
  }
  const seeds = [].concat(focus).filter((id) => graph.has(id))
  const adj = adjacency(edges)
  let distance = reach(adj, seeds, depth, direction)
  if (limit !== undefined) distance = prune(distance, adj, limit, seeds)
  return assemble(graph, edges, distance)
}

/** Everything that can lead to `id` (its causes, recursively). Same options and result as causalGraph, direction fixed to 'up'. */
export function upstream(graph, id, options = {}) {
  return causalGraph(graph, { depth: 3, ...options, focus: id, direction: 'up' })
}

/** Everything `id` can lead to (its effects, recursively). Same options and result as causalGraph, direction fixed to 'down'. */
export function downstream(graph, id, options = {}) {
  return causalGraph(graph, { depth: 3, ...options, focus: id, direction: 'down' })
}

/** Types in presentation order, for matrix axes. */
const TYPE_ORDER = TYPE_IDS

/**
 * Type-by-type relation counts. Rows are the source type, columns the target type of each stored (forward) edge.
 *   typeMatrix(graph, { includeEvidence = false, origin, rels, symmetric = false })
 * `origin` limits to 'declared', 'reaction' or 'ref' edges; `rels` to a list of relation ids; `symmetric` folds the
 * matrix onto the upper triangle (an unordered view). Result:
 *   { types, matrix, total, max, cells: [{ from, to, count, rels: { rel: count } }] }
 * where matrix[i][j] counts edges from types[i] to types[j] and cells lists the non-zero ones, largest first.
 */
export function typeMatrix(graph, { includeEvidence = false, origin, rels, symmetric = false } = {}) {
  const types = TYPE_ORDER.filter((type) => (includeEvidence ? true : type !== 'article'))
  const index = new Map(types.map((type, i) => [type, i]))
  const matrix = types.map(() => types.map(() => 0))
  const detail = new Map()
  let total = 0
  const allowed = rels ? new Set(rels) : null
  for (const edge of graph.edges) {
    if (!includeEvidence && EVIDENCE_RELS.has(edge.rel)) continue
    if (origin && edge.origin !== origin) continue
    if (allowed && !allowed.has(edge.rel)) continue
    let a = graph.get(edge.from).type
    let b = graph.get(edge.to).type
    if (!index.has(a) || !index.has(b)) continue
    if (symmetric && index.get(a) > index.get(b)) [a, b] = [b, a]
    matrix[index.get(a)][index.get(b)] += 1
    const key = `${a}|${b}`
    const cell = detail.get(key) ?? { from: a, to: b, count: 0, rels: {} }
    cell.count += 1
    cell.rels[edge.rel] = (cell.rels[edge.rel] ?? 0) + 1
    detail.set(key, cell)
    total += 1
  }
  const cells = [...detail.values()].sort((x, y) => y.count - x.count || x.from.localeCompare(y.from) || x.to.localeCompare(y.to))
  return { types, matrix, total, max: cells[0]?.count ?? 0, cells }
}

// ---------------------------------------------------------------- topic slices

/** Hub topics that get a slice of their own (the same entities the knowledge site opens with a plain-words lead). */
export const HUB_TOPICS = Object.freeze([
  'state:undermethylation', 'state:overmethylation', 'compound:glycine', 'compound:choline', 'compound:betaine', 'enzyme:gnmt', 'enzyme:pemt',
  'enzyme:bhmt', 'disease:peptic-ulcer', 'disease:sibo', 'disease:lpr', 'outcome:belching', 'pathway:choline-oxidation', 'pathway:methyl-budget'
])

export const SLICE_LIMIT = DEFAULT_LIMIT

/**
 * Grow a seed set into a slice of at most `limit` nodes: pinned nodes and seeds with causal edges first (best
 * connected if there are too many), then the neighbours tied to most chosen nodes. `distance` is the number of steps
 * from a seed. Returns the same shape as causalGraph.
 */
function sliceFromSeeds(graph, seeds, { limit = DEFAULT_LIMIT, pinned = [], ...filters } = {}) {
  const edges = causalEdges(graph, filters)
  const adj = adjacency(edges)
  const degree = (id) => (adj.get(id) ?? []).length
  const fixed = [...new Set(pinned)].filter((id) => graph.has(id))
  const rest = [...new Set(seeds)].filter((id) => graph.has(id) && adj.has(id) && !fixed.includes(id)).sort((a, b) => degree(b) - degree(a) || a.localeCompare(b))
  const chosen = new Map()
  for (const id of [...fixed, ...rest].slice(0, limit)) chosen.set(id, 0)
  while (chosen.size < limit) {
    const score = new Map()
    for (const [id, distance] of chosen) {
      for (const link of adj.get(id) ?? []) {
        if (chosen.has(link.id)) continue
        const found = score.get(link.id) ?? { count: 0, distance: Infinity }
        found.count += 1
        found.distance = Math.min(found.distance, distance + 1)
        score.set(link.id, found)
      }
    }
    if (!score.size) break
    // prefer candidates tied to several chosen nodes; break ties by degree then id so the slice is stable
    const [best, info] = [...score.entries()].sort((a, b) => b[1].count - a[1].count || degree(b[0]) - degree(a[0]) || a[0].localeCompare(b[0]))[0]
    chosen.set(best, info.distance)
  }
  return assemble(graph, edges, chosen)
}

/**
 * Curated slices: one per guided path (seeded with the path's steps) and one per hub topic (seeded with the
 * topic itself, or for a pathway with its enzymes and compounds). Each is [{ id, kind: 'path' | 'hub', title,
 * summary, seeds, pinned? }]; a pinned seed is always part of the slice.
 */
export function causalSlices(graph, guidedPaths = []) {
  const slices = []
  for (const path of guidedPaths) {
    const seeds = path.steps.map((step) => step.id).filter((id) => graph.has(id) && DEFAULT_TYPES.includes(graph.get(id).type))
    if (seeds.length) slices.push({ id: `path:${path.id}`, kind: 'path', title: path.title, summary: path.summary, seeds })
  }
  for (const id of HUB_TOPICS) {
    const entity = graph.get(id)
    if (!entity) continue
    // a pathway hub is seeded with the enzymes and compounds that are part of it, since the pathway itself rarely has causal edges
    const members = entity.type === 'pathway'
      ? graph.incoming(id).filter((edge) => edge.rel === 'part-of' && ['enzyme', 'compound'].includes(graph.get(edge.from).type)).map((edge) => edge.from)
      : []
    slices.push({ id: `hub:${id}`, kind: 'hub', title: entity.name, summary: entity.summary, seeds: [id, ...members], pinned: [id] })
  }
  return slices
}

/** The causal subgraph (at most `limit` nodes, default 40) for a slice id from causalSlices, or null. */
export function causalSlice(graph, guidedPaths, sliceId, options = {}) {
  const slice = causalSlices(graph, guidedPaths).find((item) => item.id === sliceId)
  if (!slice) return null
  const { nodes, edges } = sliceFromSeeds(graph, slice.seeds, { pinned: slice.pinned, ...options })
  return { id: slice.id, kind: slice.kind, title: slice.title, summary: slice.summary, seeds: slice.seeds, nodes, edges }
}
