// Geometry, encodings and text of the metabolic map (MetabolicMap). Pure functions.
//
//   map = {
//     nodes: [{ id, kind: 'compound' | 'enzyme' | 'reaction' | 'pool', x, y, label, currency?, group?, reversible? }],
//     edges: [{ from, to, reaction?, stoich?, via?: [[x, y], ...] }],
//     viewBox: [x, y, width, height]
//   }
//
// An edge from a compound (or pool) to a reaction is a substrate, from a reaction
// to a compound a product; an edge with an enzyme at either end is catalysis (a
// dotted tether, no arrow). An edge between two non-reaction nodes is a direct
// step; give it `reaction` to tie it to a reaction id. `via` are waypoints.
import { endMarker } from './shapes.js'
import { formatNumber, textWidth, withUnit } from './scale.js'
import { SEQ_BINS } from './heat-model.js'

export const KINDS = Object.freeze(['compound', 'enzyme', 'reaction', 'pool'])
const REACTION_SIZE = 12
const ARROW = 8

function sizeOf(node, scale = 1) {
  switch (node.kind) {
    case 'reaction': return { w: REACTION_SIZE, h: REACTION_SIZE }
    case 'enzyme': return { w: textWidth(node.label, 11) + 6, h: 16 }
    case 'pool': return { w: Math.max(84, textWidth(node.label, 12) + 28), h: 32 }
    default: return { w: Math.max(52, textWidth(node.label, 12) + 18) * scale, h: 26 * scale }
  }
}

/** Where a line from the centre of `box` toward (tx, ty) leaves the box. */
export function boundaryPoint(box, tx, ty, gap = 1.5) {
  const dx = tx - box.x
  const dy = ty - box.y
  if (!dx && !dy) return { x: box.x, y: box.y }
  const scale = Math.min(dx ? (box.w / 2 + gap) / Math.abs(dx) : Infinity, dy ? (box.h / 2 + gap) / Math.abs(dy) : Infinity)
  return { x: box.x + dx * scale, y: box.y + dy * scale }
}

/** Bin 1..6 of a concentration on the map's scale: log when the values span more than 50x. */
export function concentrationBins(values) {
  const finite = Object.values(values ?? {}).filter((value) => Number.isFinite(value))
  if (!finite.length) return null
  const low = Math.min(...finite)
  const high = Math.max(...finite)
  const log = low > 0 && high / low > 50
  const t = (value) => {
    if (high === low) return 0.5
    return log ? (Math.log(value) - Math.log(low)) / (Math.log(high) - Math.log(low)) : (value - low) / (high - low)
  }
  const edge = (index) => (log ? Math.exp(Math.log(low) + ((Math.log(high) - Math.log(low)) * index) / SEQ_BINS) : low + ((high - low) * index) / SEQ_BINS)
  return {
    log,
    low,
    high,
    binOf: (value) => `s${Math.min(SEQ_BINS, Math.max(1, Math.floor(t(value) * SEQ_BINS) + 1))}`,
    norm: (value) => Math.min(1, Math.max(0, t(value))),
    legend: Array.from({ length: SEQ_BINS }, (_, index) => ({ bin: `s${index + 1}`, from: edge(index), to: edge(index + 1) }))
  }
}

/** Visible-node map of everything the component draws. */
export function buildMap({ map, showCurrency = false, flux = {}, concentration = {}, showValues = false, concUnit = '', fluxUnit = '' }) {
  const conc = concentrationBins(concentration)
  const maxFlux = Math.max(0, ...Object.values(flux).filter(Number.isFinite).map(Math.abs))
  const hiddenIds = new Set(map.nodes.filter((node) => node.currency && !showCurrency).map((node) => node.id))

  const nodes = map.nodes.filter((node) => !hiddenIds.has(node.id)).map((node) => {
    const value = concentration[node.id]
    const hasValue = conc && node.kind === 'compound' && Number.isFinite(value)
    const scale = hasValue ? 0.92 + 0.28 * conc.norm(value) : 1
    const { w, h } = sizeOf(node, scale)
    return {
      ...node,
      w,
      h,
      bin: hasValue ? conc.binOf(value) : '',
      value: hasValue ? value : undefined,
      valueText: hasValue ? withUnit(value, concUnit) : '',
      showValue: hasValue && showValues
    }
  })
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const reactionOf = (edge, from, to) => edge.reaction ?? (to.kind === 'reaction' ? to.id : from.kind === 'reaction' ? from.id : undefined)

  const edges = []
  map.edges.forEach((edge, index) => {
    const from = byId.get(edge.from)
    const to = byId.get(edge.to)
    if (!from || !to) return
    const catalysis = from.kind === 'enzyme' || to.kind === 'enzyme'
    const kind = catalysis ? 'catalysis' : to.kind === 'reaction' ? 'substrate' : from.kind === 'reaction' ? 'product' : 'direct'
    const reaction = reactionOf(edge, from, to) ?? (catalysis ? (from.kind === 'reaction' ? from.id : to.id) : undefined)
    const reactionNode = byId.get(reaction) ?? map.nodes.find((node) => node.id === reaction)
    const value = reaction !== undefined ? flux[reaction] : undefined
    const hasFlux = Number.isFinite(value) && kind !== 'catalysis'
    const backward = hasFlux && value < 0
    const reversible = Boolean(reactionNode?.reversible)

    const waypoints = (edge.via ?? []).map(([x, y]) => ({ x, y }))
    const first = waypoints[0] ?? { x: to.x, y: to.y }
    const last = waypoints.at(-1) ?? { x: from.x, y: from.y }
    const start = boundaryPoint(from, first.x, first.y)
    const end = boundaryPoint(to, last.x, last.y)
    const points = [start, ...waypoints, end]
    const angleAt = (a, b) => Math.atan2(b.y - a.y, b.x - a.x)
    const endAngle = angleAt(points.at(-2), points.at(-1))
    const startAngle = angleAt(points[1], points[0])
    const headEnd = (kind === 'product' || kind === 'direct') && !backward
    const headStart = (kind === 'substrate' && (reversible || backward)) || (kind === 'direct' && (reversible || backward))
    const ratio = hasFlux && maxFlux ? Math.abs(value) / maxFlux : 0
    const compoundEnd = kind === 'substrate' ? 0 : kind === 'product' ? 1 : 0.5
    const stoich = edge.stoich !== undefined && edge.stoich !== 1 && kind !== 'catalysis' ? edge.stoich : undefined
    const stoichAt = stoich === undefined ? null : pointAlong(points, kind === 'substrate' ? 0.3 : kind === 'product' ? 0.72 : 0.5)

    edges.push({
      index,
      from: edge.from,
      to: edge.to,
      kind,
      reaction,
      d: `M${points.map((point) => `${round(point.x)} ${round(point.y)}`).join('L')}`,
      head: headEnd ? endMarker('arrow', end.x, end.y, endAngle, ARROW).d : '',
      tail: headStart ? endMarker('arrow', start.x, start.y, startAngle, ARROW).d : '',
      width: hasFlux ? 1.5 + 5 * ratio : kind === 'catalysis' ? 1 : 2,
      fluxClass: hasFlux ? `viz-flux-${ratio < 0.34 ? 1 : ratio < 0.67 ? 2 : 3}` : '',
      moving: kind !== 'catalysis' && (!hasFlux || value !== 0),
      stoich: stoichAt ? { x: stoichAt.x, y: stoichAt.y, text: String(stoich) } : null,
      compoundEnd,
      flux: hasFlux ? value : undefined
    })
  })

  // Value text beside a reaction when asked for.
  const reactionValues = new Map()
  if (showValues) {
    for (const node of nodes) {
      if (node.kind === 'reaction' && Number.isFinite(flux[node.id])) reactionValues.set(node.id, withUnit(flux[node.id], fluxUnit))
    }
  }

  const groups = []
  for (const name of [...new Set(nodes.map((node) => node.group).filter(Boolean))]) {
    const members = nodes.filter((node) => node.group === name)
    const left = Math.min(...members.map((node) => node.x - node.w / 2)) - 16
    const right = Math.max(...members.map((node) => node.x + node.w / 2)) + 16
    const top = Math.min(...members.map((node) => node.y - node.h / 2)) - 22
    const bottom = Math.max(...members.map((node) => node.y + node.h / 2)) + 16
    groups.push({ id: name, x: left, y: top, w: right - left, h: bottom - top })
  }

  return {
    viewBox: map.viewBox ?? fitView(nodes),
    nodes,
    edges,
    groups,
    reactionValues,
    hiddenCount: hiddenIds.size,
    concentration: conc,
    fluxLegend: maxFlux ? [0, 1, 2].map((step) => ({ cls: `viz-flux-${step + 1}`, text: `${formatNumber((maxFlux * step) / 3)} to ${formatNumber((maxFlux * (step + 1)) / 3)}`, width: 1.5 + 5 * ((step + 0.5) / 3) })) : null
  }
}

const round = (value) => Math.round(value * 10) / 10

function fitView(nodes) {
  if (!nodes.length) return [0, 0, 400, 300]
  const left = Math.min(...nodes.map((node) => node.x - node.w / 2)) - 20
  const top = Math.min(...nodes.map((node) => node.y - node.h / 2)) - 20
  const right = Math.max(...nodes.map((node) => node.x + node.w / 2)) + 20
  const bottom = Math.max(...nodes.map((node) => node.y + node.h / 2)) + 20
  return [left, top, right - left, bottom - top]
}

/** The point at fraction t of the polyline's length. */
function pointAlong(points, t) {
  const lengths = points.slice(1).map((point, index) => Math.hypot(point.x - points[index].x, point.y - points[index].y))
  const target = lengths.reduce((sum, value) => sum + value, 0) * t
  let travelled = 0
  for (let index = 0; index < lengths.length; index += 1) {
    if (travelled + lengths[index] >= target) {
      const f = lengths[index] ? (target - travelled) / lengths[index] : 0
      const a = points[index]
      const b = points[index + 1]
      const nx = -(b.y - a.y) / (lengths[index] || 1)
      const ny = (b.x - a.x) / (lengths[index] || 1)
      return { x: a.x + (b.x - a.x) * f + nx * 9, y: a.y + (b.y - a.y) * f + ny * 9 }
    }
    travelled += lengths[index]
  }
  return points[0]
}

/** Nodes and edges connected to a node: reactions around a compound; a reaction's own edges, compounds and enzymes. */
export function connectedTo(map, id) {
  const node = map.nodes.find((entry) => entry.id === id)
  if (!node) return { nodes: new Set(), edges: new Set() }
  const reactionIds = new Set()
  if (node.kind === 'reaction') reactionIds.add(id)
  for (const edge of map.edges) {
    if (edge.from !== id && edge.to !== id) continue
    const other = edge.from === id ? edge.to : edge.from
    const otherNode = map.nodes.find((entry) => entry.id === other)
    if (otherNode?.kind === 'reaction') reactionIds.add(other)
    if (edge.reaction) reactionIds.add(edge.reaction)
  }
  const nodes = new Set([id, ...reactionIds])
  const edges = new Set()
  map.edges.forEach((edge, index) => {
    const involves = reactionIds.has(edge.from) || reactionIds.has(edge.to) || reactionIds.has(edge.reaction)
    if (!involves) return
    edges.add(index)
    nodes.add(edge.from)
    nodes.add(edge.to)
  })
  return { nodes, edges }
}

/** One row per reaction, for the text alternative: equation, enzymes, flux. Currency molecules are always listed here. */
export function reactionEquations({ map, flux = {}, fluxUnit = '' }) {
  const byId = new Map(map.nodes.map((node) => [node.id, node]))
  const term = (edge, other) => `${edge.stoich !== undefined && edge.stoich !== 1 ? `${edge.stoich} ` : ''}${other.label}`
  return map.nodes.filter((node) => node.kind === 'reaction').map((reaction) => {
    const substrates = []
    const products = []
    const enzymes = []
    for (const edge of map.edges) {
      const from = byId.get(edge.from)
      const to = byId.get(edge.to)
      if (!from || !to) continue
      if (to.id === reaction.id && from.kind === 'enzyme') enzymes.push(from.label)
      else if (from.id === reaction.id && to.kind === 'enzyme') enzymes.push(to.label)
      else if (to.id === reaction.id) substrates.push(term(edge, from))
      else if (from.id === reaction.id) products.push(term(edge, to))
      else if (edge.reaction === reaction.id) {
        substrates.push(from.label)
        products.push(to.label)
      }
    }
    const arrow = reaction.reversible ? '⇌' : '→'
    return {
      id: reaction.id,
      label: reaction.label,
      group: reaction.group ?? '',
      enzymes,
      equation: `${substrates.join(' + ') || '?'} ${arrow} ${products.join(' + ') || '?'}`,
      flux: Number.isFinite(flux[reaction.id]) ? withUnit(flux[reaction.id], fluxUnit) : ''
    }
  })
}

export function describeMap({ map, equations, built, selected }) {
  const counts = KINDS.map((kind) => ({ kind, n: map.nodes.filter((node) => node.kind === kind).length })).filter((entry) => entry.n)
  const parts = counts.map((entry) => `${entry.n} ${entry.kind}${entry.n === 1 ? '' : 's'}`).join(', ')
  return `Metabolic map with ${parts}. ${equations.length} reactions are listed as equations in the data table.${built.hiddenCount ? ` ${built.hiddenCount} currency molecules (such as ATP or water) are hidden; use the toggle to show them.` : ''}${selected ? ` Selected: ${selected}.` : ''}`
}
