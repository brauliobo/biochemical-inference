// Immutable knowledge graph built from entity arrays.
//
// Edges are stored once in their FORWARD direction (symmetric ones once per pair). Inverses are
// not stored; they are exposed through links(id), which presents every edge from the point of
// view of the given entity. Edges come from three places:
//   declared  entity.relations
//   ref       entity.refs            -> article --evidence-for--> entity
//   reaction  reaction.reactants/products/enzymes -> substrate-of / product-of / catalyzes
// Body mentions ([[id]]) are separate "mention" links; they make pages navigable and count for
// connectivity but are not relations.
//
// buildGraph never throws on bad references: it records them (dangling, duplicates,
// malformedMentions) so validation can report them, and leaves them out of the adjacency data.
import { TYPE_IDS } from './types.js'
import { EDGE_FIELDS, edgeSign, inverseOf, isAuthorable, labelFor, relationInfo } from './relations.js'
import { extractMentions } from './mentions.js'

const EMPTY = Object.freeze([])
export const MENTION_STEP = Object.freeze({ rel: 'mentions', label: 'Mentions' })
export const MENTIONED_BY_STEP = Object.freeze({ rel: 'mentioned-by', label: 'Mentioned by' })

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}

function readonlyMap(entries) {
  const map = new Map(entries)
  for (const method of ['set', 'delete', 'clear']) {
    map[method] = () => { throw new TypeError('the knowledge graph is immutable') }
  }
  return Object.freeze(map)
}

function pushTo(map, key, value) {
  const list = map.get(key)
  if (list) list.push(value)
  else map.set(key, [value])
}

function edgeKey({ from, rel, to }) {
  if (relationInfo(rel)?.symmetric) return `${rel}|${[from, to].sort().join('|')}`
  return `${from}|${rel}|${to}`
}

function* declaredEdges(entity) {
  for (const [index, item] of (entity.relations ?? []).entries()) {
    const extra = {}
    for (const field of EDGE_FIELDS) if (item[field] !== undefined) extra[field] = item[field]
    yield { from: entity.id, rel: item.rel, to: item.to, note: item.note, ...extra, origin: 'declared', kind: 'relation', owner: entity.id, path: `relations[${index}]` }
  }
}

function* derivedEdges(entity) {
  for (const [index, ref] of (entity.refs ?? []).entries()) {
    yield { from: ref, rel: 'evidence-for', to: entity.id, origin: 'ref', kind: 'ref', owner: entity.id, path: `refs[${index}]` }
  }
  const reaction = entity.reaction
  if (!reaction) return
  const derive = (list, listName, rel) => (list ?? []).map((item, index) => ({
    from: typeof item === 'string' ? item : item.id,
    rel,
    to: entity.id,
    origin: 'reaction',
    kind: 'reaction',
    owner: entity.id,
    path: `reaction.${listName}[${index}]`
  }))
  yield* derive(reaction.reactants, 'reactants', 'substrate-of')
  yield* derive(reaction.products, 'products', 'product-of')
  yield* derive(reaction.enzymes, 'enzymes', 'catalyzes')
}

/** Causal-model properties of an edge (sign, hypothesis, claim, strength), only those that are set. */
function causalProps(edge) {
  const props = {}
  const sign = edgeSign(edge)
  if (sign) props.sign = sign
  if (edge.hypothesis !== undefined) props.hypothesis = edge.hypothesis
  if (edge.claim !== undefined) props.claim = edge.claim
  if (edge.strength !== undefined) props.strength = edge.strength
  return props
}

function linkViews(edge) {
  const symmetric = relationInfo(edge.rel).symmetric
  const base = { ...(edge.note === undefined ? {} : { note: edge.note }), origin: edge.origin, ...causalProps(edge) }
  const forward = { rel: edge.rel, label: labelFor(edge.rel), direction: symmetric ? 'sym' : 'out', other: edge.to, ...base }
  const reverseRel = inverseOf(edge.rel)
  const reverse = { rel: reverseRel, label: labelFor(reverseRel), direction: symmetric ? 'sym' : 'in', other: edge.from, ...base }
  return [forward, reverse]
}

export function buildGraph(input = []) {
  const entities = []
  const byId = new Map()
  const duplicates = []
  for (const raw of input) {
    if (byId.has(raw.id)) {
      duplicates.push(raw.id)
      continue
    }
    const entity = deepFreeze(structuredClone(raw))
    byId.set(entity.id, entity)
    entities.push(entity)
  }

  const byType = new Map(TYPE_IDS.map((type) => [type, []]))
  for (const entity of entities) pushTo(byType, entity.type, entity)

  const dangling = []
  const unknownRelations = []
  const edges = []
  const seen = new Set()
  const outgoing = new Map()
  const incoming = new Map()
  const linkMap = new Map()

  const addEdge = (candidate) => {
    const { kind, owner, path, ...rest } = candidate
    if (!isAuthorable(rest.rel)) {
      unknownRelations.push({ owner, rel: rest.rel, path })
      return
    }
    const missing = [rest.from, rest.to].find((id) => !byId.has(id))
    if (missing) {
      dangling.push({ owner, target: missing, kind, rel: rest.rel, path })
      return
    }
    if (rest.claim !== undefined && byId.get(rest.claim)?.type !== 'claim') {
      dangling.push({ owner, target: rest.claim, kind: 'claim', rel: rest.rel, path: `${path}.claim` })
      delete rest.claim
    }
    const key = edgeKey(rest)
    if (seen.has(key)) return
    seen.add(key)
    const { note, ...withoutNote } = rest
    const edge = deepFreeze(note === undefined ? withoutNote : rest)
    edges.push(edge)
    pushTo(outgoing, edge.from, edge)
    pushTo(incoming, edge.to, edge)
    const [forward, reverse] = linkViews(edge)
    pushTo(linkMap, edge.from, deepFreeze(forward))
    pushTo(linkMap, edge.to, deepFreeze(reverse))
  }

  for (const entity of entities) for (const candidate of declaredEdges(entity)) addEdge(candidate)
  for (const entity of entities) for (const candidate of derivedEdges(entity)) addEdge(candidate)

  const mentionsOut = new Map()
  const mentionsIn = new Map()
  const malformedMentions = []
  for (const entity of entities) {
    for (const [index, paragraph] of (entity.body ?? []).entries()) {
      const path = `body[${index}]`
      const { ids, malformed } = extractMentions(paragraph)
      for (const raw of malformed) malformedMentions.push({ owner: entity.id, path, raw })
      for (const target of ids) {
        if (!byId.has(target)) dangling.push({ owner: entity.id, target, kind: 'mention', path })
        else if (target !== entity.id && !(mentionsOut.get(entity.id) ?? []).includes(target)) {
          pushTo(mentionsOut, entity.id, target)
          pushTo(mentionsIn, target, entity.id)
        }
      }
    }
  }

  const neighborMap = new Map()
  for (const entity of entities) {
    const ids = new Set([
      ...(linkMap.get(entity.id) ?? []).map((link) => link.other),
      ...(mentionsOut.get(entity.id) ?? []),
      ...(mentionsIn.get(entity.id) ?? [])
    ])
    ids.delete(entity.id)
    neighborMap.set(entity.id, Object.freeze([...ids]))
  }

  const lookup = (map) => {
    for (const list of map.values()) Object.freeze(list)
    return (id) => map.get(id) ?? EMPTY
  }
  const graph = {
    entities: Object.freeze(entities),
    byId: readonlyMap(byId),
    byType: readonlyMap([...byType].map(([type, list]) => [type, Object.freeze(list)])),
    edges: Object.freeze(edges),
    dangling: deepFreeze(dangling),
    duplicates: Object.freeze(duplicates),
    unknownRelations: deepFreeze(unknownRelations),
    malformedMentions: deepFreeze(malformedMentions),
    stats: Object.freeze({
      entities: entities.length,
      edges: edges.length,
      declared: edges.filter((edge) => edge.origin === 'declared').length,
      derived: edges.filter((edge) => edge.origin !== 'declared').length,
      mentions: [...mentionsOut.values()].reduce((sum, list) => sum + list.length, 0)
    }),
    get: (id) => byId.get(id),
    has: (id) => byId.has(id),
    /** Forward edges whose source is id (symmetric edges appear on the declaring side only). */
    outgoing: lookup(outgoing),
    /** Forward edges whose target is id; the inverse relations, derived. */
    incoming: lookup(incoming),
    /** Every relation as seen from id: { rel, label, direction: 'out'|'in'|'sym', other, note?, origin }. */
    links: lookup(linkMap),
    /** Entities mentioned in id's body / entities whose body mentions id. */
    mentions: lookup(mentionsOut),
    mentionedBy: lookup(mentionsIn),
    /** Distinct entities linked to id by a relation or a mention, in either direction. */
    neighbors: lookup(neighborMap),
    degree: (id) => (neighborMap.get(id) ?? EMPTY).length
  }
  return Object.freeze(graph)
}

function describeStep(graph, from, to) {
  const link = graph.links(from).find((candidate) => candidate.other === to)
  if (link) return { from, to, rel: link.rel, label: link.label, kind: 'relation' }
  const step = graph.mentions(from).includes(to) ? MENTION_STEP : MENTIONED_BY_STEP
  return { from, to, rel: step.rel, label: step.label, kind: 'mention' }
}

/**
 * Shortest chain of links (relations and mentions, any direction) between two entities.
 * Returns { ids, steps } (steps: { from, to, rel, label, kind }) or null if unknown/unreachable.
 * Options: avoidTypes - entity types that may not be used as intermediate stops (e.g. ['article']).
 */
export function shortestPath(graph, from, to, { avoidTypes = [] } = {}) {
  if (!graph.has(from) || !graph.has(to)) return null
  if (from === to) return { ids: [from], steps: [] }
  const previous = new Map([[from, null]])
  const queue = [from]
  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head]
    for (const next of graph.neighbors(current)) {
      if (previous.has(next)) continue
      if (next !== to && avoidTypes.includes(graph.get(next).type)) continue
      previous.set(next, current)
      if (next === to) {
        const ids = [to]
        for (let id = current; id !== null; id = previous.get(id)) ids.unshift(id)
        return { ids, steps: ids.slice(1).map((id, index) => describeStep(graph, ids[index], id)) }
      }
      queue.push(next)
    }
  }
  return null
}

/** Connected components (relations + mentions, undirected): arrays of ids, largest first. */
export function connectedComponents(graph) {
  const seen = new Set()
  const components = []
  for (const entity of graph.entities) {
    if (seen.has(entity.id)) continue
    const component = []
    const stack = [entity.id]
    seen.add(entity.id)
    while (stack.length) {
      const id = stack.pop()
      component.push(id)
      for (const next of graph.neighbors(id)) {
        if (!seen.has(next)) {
          seen.add(next)
          stack.push(next)
        }
      }
    }
    components.push(component)
  }
  const position = new Map(graph.entities.map((item, index) => [item.id, index]))
  for (const component of components) component.sort((a, b) => position.get(a) - position.get(b))
  return components.sort((a, b) => b.length - a.length || position.get(a[0]) - position.get(b[0])).map((list) => Object.freeze(list))
}
