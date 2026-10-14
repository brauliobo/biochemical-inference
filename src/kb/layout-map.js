// Bridges the hand-laid metabolic layouts (src/viz/layouts) and the MetabolicMap component, and finds the part of
// a layout that matters for one entity. Pure functions plus one cached loader.
//
// A layout stores compounds and reactions (a reaction mark is labelled with its enzyme) and an `edges` block of
// substrate/product arrows with stoichiometry; small currency molecules (ATP, NADPH, water ...) are pooled on the
// reaction instead of being nodes. MetabolicMap wants { nodes, edges, viewBox }, so `toMetabolicMap` converts and can
// add the pooled currency molecules back as nodes flagged `currency` (MetabolicMap hides them until its toggle).
import { LAYOUT_IDS, loadLayout } from '../viz/layouts/index.js'

let loaded = null

/** All layouts, loaded once (each is its own lazy chunk). Resolves with an array of layout objects. */
export function loadAllLayouts() {
  loaded ??= Promise.all(LAYOUT_IDS.map((id) => loadLayout(id))).then((list) => list.filter(Boolean))
  return loaded
}

const FORMULA_LABELS = Object.freeze({ 'compound:proton': 'H+', 'compound:water': 'H2O', 'compound:carbon-dioxide': 'CO2', 'compound:oxygen': 'O2', 'compound:ammonia': 'NH3', 'compound:phosphate': 'Pi', 'compound:pyrophosphate': 'PPi' })

/** Short label for a compound name: the acronym in parentheses, else the name cut to fit a box. Common small molecules are written as formulas. */
export function shortLabel(name = '', id = '') {
  if (FORMULA_LABELS[id]) return FORMULA_LABELS[id]
  const paren = /\(([^()]*)\)/.exec(name)
  if (paren) {
    const first = paren[1].split(/[;,]/)[0].trim()
    if (first && first.length <= 9) return first
  }
  const head = name.replace(/\([^()]*\)/g, '').trim()
  return head.length <= 16 ? head : `${head.slice(0, 15).trimEnd()}.`
}

const groupLabels = (layout) => new Map((layout.groups ?? []).map((group) => [group.id, group.label]))

/**
 * Convert a layout (or part of it) to the shape MetabolicMap draws.
 *   include   Set of node ids to keep (default all); edges follow
 *   labelOf   (compoundId) => label for pooled currency molecules
 *   currency  add the pooled currency molecules as nodes flagged `currency` (default true)
 *   viewBox   keep the layout's view box (default true for a whole layout, false for a part so the map crops itself)
 */
export function toMetabolicMap(layout, { include, labelOf = (id) => id, currency = true, viewBox } = {}) {
  const groups = groupLabels(layout)
  const keep = (id) => !include || include.has(id)
  const nodes = layout.nodes.filter((node) => keep(node.id)).map((node) => ({
    id: node.id,
    kind: node.kind === 'reaction' ? 'reaction' : 'compound',
    x: node.x,
    y: node.y,
    label: node.label,
    ...(node.group ? { group: groups.get(node.group) ?? node.group } : {}),
    ...(node.kind === 'reaction' && layout.reactions?.[node.id]?.reversible ? { reversible: true } : {})
  }))
  const placed = new Set(nodes.map((node) => node.id))
  const edges = (layout.edges ?? []).filter((edge) => placed.has(edge.from) && placed.has(edge.to)).map((edge) => ({
    from: edge.from,
    to: edge.to,
    ...(edge.n && edge.n !== 1 ? { stoich: edge.n } : {})
  }))

  if (currency) {
    for (const node of layout.nodes) {
      if (node.kind !== 'reaction' || !placed.has(node.id)) continue
      const pooled = layout.reactions?.[node.id]?.pooled
      if (!pooled) continue
      const place = (list, side) => list.forEach((item, index) => {
        const id = `${node.id}~${item.id}`
        const x = node.x + (index - (list.length - 1) / 2) * 62
        const y = node.y + side * 40
        nodes.push({ id, kind: 'compound', x, y, label: labelOf(item.id), currency: true })
        edges.push(side < 0 ? { from: id, to: node.id, ...(item.n !== 1 ? { stoich: item.n } : {}) } : { from: node.id, to: id, ...(item.n !== 1 ? { stoich: item.n } : {}) })
      })
      place(pooled.substrates ?? [], -1)
      place(pooled.products ?? [], 1)
    }
  }

  const whole = !include
  const box = viewBox ?? whole
  return {
    nodes,
    edges,
    viewBox: box ? [0, 0, layout.viewBox.width, layout.viewBox.height] : fitBox(nodes.filter((node) => !node.currency))
  }
}

const MIN_WIDTH = 760
const MIN_HEIGHT = 380

/** View box around the nodes with a margin, never smaller than a readable minimum so a few nodes are not blown up. */
export function fitBox(nodes) {
  if (!nodes.length) return [0, 0, MIN_WIDTH, MIN_HEIGHT]
  const half = (node) => (node.kind === 'reaction' ? 40 : Math.max(52, node.label.length * 7 + 18) / 2 + 30)
  const left = Math.min(...nodes.map((node) => node.x - half(node)))
  const right = Math.max(...nodes.map((node) => node.x + half(node)))
  const top = Math.min(...nodes.map((node) => node.y - 44))
  const bottom = Math.max(...nodes.map((node) => node.y + 44))
  const width = Math.max(MIN_WIDTH, right - left)
  const height = Math.max(MIN_HEIGHT, bottom - top)
  return [(left + right) / 2 - width / 2, (top + bottom) / 2 - height / 2, width, height]
}

/** Ids of the reactions a layout draws that have `compoundId` as substrate or product. */
export function reactionsOfCompound(layout, compoundId) {
  const ids = new Set()
  for (const edge of layout.edges ?? []) {
    if (edge.from === compoundId && edge.to.startsWith('reaction:')) ids.add(edge.to)
    if (edge.to === compoundId && edge.from.startsWith('reaction:')) ids.add(edge.from)
  }
  return ids
}

/** The nodes a set of reactions touches (the reactions themselves plus their placed substrates and products). */
export function participantsOf(layout, reactionIds) {
  const start = new Set(reactionIds)
  const ids = new Set(start)
  for (const edge of layout.edges ?? []) {
    if (start.has(edge.from)) ids.add(edge.to)
    if (start.has(edge.to)) ids.add(edge.from)
  }
  return ids
}

/**
 * Everything of a layout within `radius` layout units of the centre of `seedIds`, completed so that every reaction in the
 * window has its placed substrates and products (unless they lie far outside the window): the pathway context around a
 * reaction or an enzyme.
 */
export function contextAround(layout, seedIds, radius = 300) {
  const seeds = layout.nodes.filter((node) => seedIds.has(node.id))
  if (!seeds.length) return new Set()
  const cx = seeds.reduce((sum, node) => sum + node.x, 0) / seeds.length
  const cy = seeds.reduce((sum, node) => sum + node.y, 0) / seeds.length
  const byId = new Map(layout.nodes.map((node) => [node.id, node]))
  const distance = (id) => Math.hypot(byId.get(id).x - cx, byId.get(id).y - cy)
  const near = new Set(layout.nodes.filter((node) => Math.hypot(node.x - cx, node.y - cy) <= radius).map((node) => node.id))
  for (const id of seedIds) near.add(id)
  const reactions = [...near].filter((id) => id.startsWith('reaction:'))
  // a reaction in the window gets its substrates and products, unless they sit far outside it
  const complete = [...participantsOf(layout, reactions)].filter((id) => near.has(id) || distance(id) <= radius * 1.45)
  return new Set([...near, ...complete])
}

/** Fraction (0 to 1) of the layout's area the given nodes' bounding box covers: how spread out a neighbourhood is. */
export function spread(layout, ids) {
  const found = layout.nodes.filter((node) => ids.has(node.id))
  if (found.length < 2) return 0
  const xs = found.map((node) => node.x)
  const ys = found.map((node) => node.y)
  const area = (Math.max(...xs) - Math.min(...xs) + 120) * (Math.max(...ys) - Math.min(...ys) + 60)
  return Math.min(1, area / (layout.viewBox.width * layout.viewBox.height))
}

/** Layouts that place a node, best (most nodes of `ids` placed) first. */
export function layoutsPlacing(layouts, ids) {
  const wanted = [].concat(ids)
  return layouts
    .map((layout) => ({ layout, hits: layout.nodes.filter((node) => wanted.includes(node.id)).length }))
    .filter((entry) => entry.hits > 0)
    .sort((a, b) => b.hits - a.hits || b.layout.nodes.length - a.layout.nodes.length)
    .map((entry) => entry.layout)
}

/**
 * The neighbourhood of an entity as part of a layout.
 *   compound   its reactions in the layout plus everything those reactions touch
 *   reaction   itself plus its participants
 *   enzyme     the layout reactions it catalyses (`reactionIds`) plus participants
 * Returns { layout, include (Set), focus (node id | ''), spread } or null when the entity is not placed in any layout.
 */
export function neighbourhoodIn(layouts, { id, reactionIds = [], radius = 0 }) {
  const wanted = id.startsWith('reaction:') || id.startsWith('compound:') ? [id, ...reactionIds] : reactionIds
  for (const layout of layoutsPlacing(layouts, wanted)) {
    const placedIds = new Set(layout.nodes.map((node) => node.id))
    let reactions
    if (id.startsWith('compound:')) reactions = reactionsOfCompound(layout, id)
    else if (id.startsWith('reaction:')) reactions = new Set([id])
    else reactions = new Set(reactionIds.filter((rid) => placedIds.has(rid)))
    if (!reactions.size && !(id.startsWith('compound:') && placedIds.has(id))) continue
    let include = participantsOf(layout, reactions)
    if (placedIds.has(id)) include.add(id)
    if (include.size < 2) continue
    if (radius > 0) include = contextAround(layout, include, radius)
    return { layout, include, focus: placedIds.has(id) ? id : [...reactions][0] ?? '', spread: spread(layout, include) }
  }
  return null
}

/** Pathway member reactions as part of the layout that places most of them; null when fewer than two are placed anywhere. */
export function pathwayIn(layouts, reactionIds) {
  const [layout] = layoutsPlacing(layouts, reactionIds)
  if (!layout) return null
  const placed = new Set(layout.nodes.map((node) => node.id))
  const members = reactionIds.filter((id) => placed.has(id))
  if (members.length < 2) return null
  const include = participantsOf(layout, members)
  return { layout, include, focus: '', spread: spread(layout, include) }
}
