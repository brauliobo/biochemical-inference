// A layered graph layout (Sugiyama style), written for this project, no
// dependencies, deterministic: the same input always gives the same output.
//
//   layoutLayered({ nodes: [{ id, tier?, width?, height? }], edges: [{ from, to }] }, options)
//
// Steps: (1) break cycles by reversing the back-edges found by a depth-first
// search; (2) assign layers, from a node's `tier` (a number, or a name listed in
// `options.tiers`) where it has one, else longest path from the sources; (3) split
// edges that span several layers with dummy nodes; (4) reduce crossings with
// barycenter sweeps and adjacent swaps; (5) assign coordinates by pulling each
// node toward the mean of its neighbours subject to a minimum gap (a weighted
// isotonic regression per layer); (6) route each edge as a smooth curve or a
// rounded orthogonal path through its dummy nodes.
//
// Options: direction 'TB' (layers are rows, default) or 'LR' (layers are
// columns); nodeGap (space between nodes in a layer); layerGap (space between
// layers); padding; sweeps; routing 'curve' | 'orthogonal'; tiers; width and
// height used for a node that gives none.

const DEFAULTS = Object.freeze({
  direction: 'TB',
  nodeGap: 28,
  layerGap: 84,
  padding: 24,
  sweeps: 24,
  routing: 'curve',
  tiers: [],
  nodeWidth: 140,
  nodeHeight: 44,
  edgeGap: 14,
  cornerRadius: 10
})

const DUMMY_CROSS = 8

/** Layout a graph. Returns { nodes, edges, layers, width, height, crossings }. */
export function layoutLayered(graph, options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const horizontal = opts.direction === 'LR'
  const nodes = graph.nodes.map((node, index) => {
    const width = node.width ?? opts.nodeWidth
    const height = node.height ?? opts.nodeHeight
    return { id: node.id, index, tier: node.tier, width, height, main: horizontal ? width : height, cross: horizontal ? height : width }
  })
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const edges = graph.edges
    .map((edge, index) => ({ ...edge, index, u: byId.get(edge.from), v: byId.get(edge.to) }))
    .filter((edge) => edge.u && edge.v)

  const layerOf = assignLayers(nodes, edges, opts)
  const chains = buildChains(nodes, edges, layerOf)
  const layers = orderLayers(chains, layerOf, opts)
  const crossings = countAllCrossings(layers, chains.links)
  const cross = placeCross(layers, chains.links, opts)
  const main = placeMain(layers, opts)

  return finish({ nodes, edges, layers, chains, cross, main, layerOf, opts, horizontal, crossings })
}

// ---- 1 and 2: cycles and layers ----

function tierRank(node, opts) {
  if (node.tier === undefined || node.tier === null) return undefined
  if (typeof node.tier === 'number') return node.tier
  const index = opts.tiers.indexOf(node.tier)
  return index < 0 ? undefined : index
}

function assignLayers(nodes, edges, opts) {
  const rank = new Map(nodes.map((node) => [node.id, tierRank(node, opts)]))
  const outgoing = new Map(nodes.map((node) => [node.id, []]))
  for (const edge of edges) {
    if (edge.u !== edge.v) outgoing.get(edge.u.id).push(edge)
  }

  // Depth-first search: an edge into a node still on the stack closes a cycle and is reversed.
  const state = new Map()
  const oriented = []
  for (const root of nodes) {
    if (state.has(root.id)) continue
    const stack = [{ node: root, cursor: 0 }]
    state.set(root.id, 'open')
    while (stack.length) {
      const frame = stack.at(-1)
      const list = outgoing.get(frame.node.id)
      if (frame.cursor >= list.length) {
        state.set(frame.node.id, 'done')
        stack.pop()
        continue
      }
      const edge = list[frame.cursor++]
      const target = edge.v
      if (state.get(target.id) === 'open') {
        oriented.push({ from: target, to: frame.node })
      } else {
        oriented.push({ from: frame.node, to: target })
        if (!state.has(target.id)) {
          state.set(target.id, 'open')
          stack.push({ node: target, cursor: 0 })
        }
      }
    }
  }

  const incoming = new Map(nodes.map((node) => [node.id, []]))
  const successors = new Map(nodes.map((node) => [node.id, []]))
  for (const edge of oriented) {
    incoming.get(edge.to.id).push(edge.from)
    successors.get(edge.from.id).push(edge.to)
  }

  // Topological order (Kahn), ties by input index.
  const remaining = new Map(nodes.map((node) => [node.id, incoming.get(node.id).length]))
  const ready = nodes.filter((node) => remaining.get(node.id) === 0)
  const topo = []
  while (ready.length) {
    ready.sort((a, b) => a.index - b.index)
    const node = ready.shift()
    topo.push(node)
    for (const next of successors.get(node.id)) {
      remaining.set(next.id, remaining.get(next.id) - 1)
      if (remaining.get(next.id) === 0) ready.push(next)
    }
  }

  const layer = new Map(nodes.map((node) => [node.id, rank.get(node.id) ?? 0]))
  for (const node of topo) {
    for (const next of successors.get(node.id)) {
      if (rank.get(next.id) === undefined) layer.set(next.id, Math.max(layer.get(next.id), layer.get(node.id) + 1))
    }
  }
  // A free source sits just before its earliest consumer rather than at the far edge.
  for (const node of [...topo].reverse()) {
    if (rank.get(node.id) !== undefined || incoming.get(node.id).length || !successors.get(node.id).length) continue
    const nearest = Math.min(...successors.get(node.id).map((next) => layer.get(next.id)))
    if (nearest - 1 > layer.get(node.id)) layer.set(node.id, nearest - 1)
  }

  // Close gaps between used layers, keeping their order.
  const used = [...new Set(layer.values())].sort((a, b) => a - b)
  const compact = new Map(used.map((value, index) => [value, index]))
  return new Map(nodes.map((node) => [node.id, compact.get(layer.get(node.id))]))
}

// ---- 3: chains with dummy nodes ----

function buildChains(nodes, edges, layerOf) {
  const items = nodes.map((node) => ({ key: node.id, node, dummy: false, layer: layerOf.get(node.id), cross: node.cross }))
  const itemOf = new Map(items.map((item) => [item.key, item]))
  const links = [] // [upper item, lower item]
  const paths = new Map() // edge index -> items from the lower layer to the higher layer, or null
  for (const edge of edges) {
    if (edge.u === edge.v) continue
    const a = layerOf.get(edge.u.id)
    const b = layerOf.get(edge.v.id)
    if (a === b) continue
    const [top, bottom] = a < b ? [edge.u, edge.v] : [edge.v, edge.u]
    const chain = [itemOf.get(top.id)]
    for (let layer = layerOf.get(top.id) + 1; layer < layerOf.get(bottom.id); layer += 1) {
      const dummy = { key: `~${edge.index}~${layer}`, dummy: true, layer, cross: DUMMY_CROSS, edge: edge.index }
      items.push(dummy)
      chain.push(dummy)
    }
    chain.push(itemOf.get(bottom.id))
    for (let i = 0; i + 1 < chain.length; i += 1) links.push([chain[i], chain[i + 1]])
    paths.set(edge.index, chain)
  }
  return { items, links, paths }
}

// ---- 4: crossing minimisation ----

function orderLayers(chains, layerOf, opts) {
  const count = Math.max(-1, ...chains.items.map((item) => item.layer)) + 1
  const layers = Array.from({ length: count }, () => [])
  const down = new Map(chains.items.map((item) => [item, []]))
  const up = new Map(chains.items.map((item) => [item, []]))
  for (const [a, b] of chains.links) {
    down.get(a).push(b)
    up.get(b).push(a)
  }

  // Initial order: depth-first from the first layer so connected nodes start close together.
  const placed = new Set()
  const visit = (item) => {
    if (placed.has(item)) return
    placed.add(item)
    layers[item.layer].push(item)
    for (const next of down.get(item)) visit(next)
  }
  const real = chains.items.filter((item) => !item.dummy)
  for (const item of real.filter((candidate) => !up.get(candidate).length)) visit(item)
  for (const item of chains.items) visit(item)

  const position = () => {
    const map = new Map()
    for (const layer of layers) layer.forEach((item, index) => map.set(item, index))
    return map
  }
  const sweep = (order, neighbours) => {
    const pos = position()
    for (const layerIndex of order) {
      const layer = layers[layerIndex]
      const keyed = layer.map((item, index) => {
        const around = neighbours.get(item)
        return { item, index, bary: around.length ? around.reduce((sum, other) => sum + pos.get(other), 0) / around.length : index }
      })
      keyed.sort((a, b) => a.bary - b.bary || a.index - b.index)
      layers[layerIndex] = keyed.map((entry) => entry.item)
      layers[layerIndex].forEach((item, index) => pos.set(item, index))
    }
  }

  let best = layers.map((layer) => [...layer])
  let bestCrossings = countAllCrossings(layers, chains.links)
  for (let iteration = 0; iteration < opts.sweeps && bestCrossings > 0; iteration += 1) {
    sweep(range(1, count), up)
    sweep(range(count - 2, -1, -1), down)
    transpose(layers, up, down)
    const crossings = countAllCrossings(layers, chains.links)
    if (crossings < bestCrossings) {
      bestCrossings = crossings
      best = layers.map((layer) => [...layer])
    }
  }
  return best
}

function range(from, to, step = 1) {
  const list = []
  for (let value = from; step > 0 ? value < to : value > to; value += step) list.push(value)
  return list
}

function pairCrossings(upperLayer, lowerLayer, links) {
  const upperPos = new Map(upperLayer.map((item, index) => [item, index]))
  const lowerPos = new Map(lowerLayer.map((item, index) => [item, index]))
  const pairs = links.filter(([a, b]) => upperPos.has(a) && lowerPos.has(b)).map(([a, b]) => [upperPos.get(a), lowerPos.get(b)])
  let total = 0
  for (let i = 0; i < pairs.length; i += 1) {
    for (let j = i + 1; j < pairs.length; j += 1) {
      if ((pairs[i][0] - pairs[j][0]) * (pairs[i][1] - pairs[j][1]) < 0) total += 1
    }
  }
  return total
}

export function countAllCrossings(layers, links) {
  let total = 0
  for (let index = 0; index + 1 < layers.length; index += 1) total += pairCrossings(layers[index], layers[index + 1], links)
  return total
}

// Swap neighbours while that removes crossings with the layers above and below.
function transpose(layers, up, down) {
  const local = (index) => {
    const here = layers[index]
    const links = []
    for (const item of here) {
      for (const other of up.get(item)) links.push([other, item])
      for (const other of down.get(item)) links.push([item, other])
    }
    return (index > 0 ? pairCrossings(layers[index - 1], here, links) : 0) + (index + 1 < layers.length ? pairCrossings(here, layers[index + 1], links) : 0)
  }
  for (let round = 0; round < 8; round += 1) {
    let improved = false
    for (let index = 0; index < layers.length; index += 1) {
      const layer = layers[index]
      for (let i = 0; i + 1 < layer.length; i += 1) {
        const before = local(index)
        ;[layer[i], layer[i + 1]] = [layer[i + 1], layer[i]]
        if (local(index) < before) improved = true
        else [layer[i], layer[i + 1]] = [layer[i + 1], layer[i]]
      }
    }
    if (!improved) break
  }
}

// ---- 5: coordinates ----

function separation(a, b, opts) {
  const gap = a.dummy || b.dummy ? opts.edgeGap : opts.nodeGap
  return (a.cross + b.cross) / 2 + gap
}

/** Positions minimising the squared distance to `desired` with a minimum gap between neighbours (pool adjacent violators). */
function placeLayer(layer, desired, opts) {
  const offsets = [0]
  for (let i = 1; i < layer.length; i += 1) offsets.push(offsets[i - 1] + separation(layer[i - 1], layer[i], opts))
  const blocks = []
  layer.forEach((_, index) => {
    blocks.push({ sum: desired[index] - offsets[index], count: 1, start: index })
    while (blocks.length > 1) {
      const last = blocks.at(-1)
      const before = blocks.at(-2)
      if (before.sum / before.count <= last.sum / last.count) break
      blocks.splice(-2, 2, { sum: before.sum + last.sum, count: before.count + last.count, start: before.start })
    }
  })
  const out = new Array(layer.length)
  for (const block of blocks) {
    for (let i = block.start; i < block.start + block.count; i += 1) out[i] = block.sum / block.count + offsets[i]
  }
  return out
}

function placeCross(layers, links, opts) {
  const down = new Map()
  const up = new Map()
  for (const layer of layers) for (const item of layer) { down.set(item, []); up.set(item, []) }
  for (const [a, b] of links) { down.get(a).push(b); up.get(b).push(a) }

  const pos = new Map()
  for (const layer of layers) {
    const start = placeLayer(layer, layer.map(() => 0), opts)
    layer.forEach((item, index) => pos.set(item, start[index]))
  }
  const run = (order, sides) => {
    for (const index of order) {
      const layer = layers[index]
      const desired = layer.map((item) => {
        const around = sides.flatMap((side) => side.get(item))
        return around.length ? around.reduce((sum, other) => sum + pos.get(other), 0) / around.length : pos.get(item)
      })
      const placed = placeLayer(layer, desired, opts)
      layer.forEach((item, i) => pos.set(item, placed[i]))
    }
  }
  const count = layers.length
  for (let round = 0; round < 6; round += 1) {
    run(range(1, count), [up])
    run(range(count - 2, -1, -1), [down])
  }
  run(range(0, count), [up, down])
  run(range(count - 1, -1, -1), [up, down])
  return pos
}

function placeMain(layers, opts) {
  const thickness = layers.map((layer) => Math.max(0, ...layer.filter((item) => !item.dummy).map((item) => item.node.main)))
  const centers = []
  let cursor = 0
  thickness.forEach((size, index) => {
    centers.push(cursor + size / 2)
    cursor += size + opts.layerGap
    if (!layers[index].length) cursor -= opts.layerGap
  })
  return { thickness, centers }
}

// ---- 6: output and routing ----

function finish({ nodes, edges, layers, chains, cross, main, layerOf, opts, horizontal, crossings }) {
  let low = Infinity
  for (const layer of layers) for (const item of layer) low = Math.min(low, cross.get(item) - item.cross / 2)
  const shift = Number.isFinite(low) ? opts.padding - low : 0
  const crossOf = (item) => cross.get(item) + shift
  const mainOf = (item) => main.centers[item.layer] + opts.padding
  const toXY = (m, c) => (horizontal ? { x: m, y: c } : { x: c, y: m })

  const itemOf = new Map(chains.items.filter((item) => !item.dummy).map((item) => [item.key, item]))
  const outNodes = nodes.map((node) => {
    const item = itemOf.get(node.id)
    const center = toXY(mainOf(item), crossOf(item))
    return { id: node.id, x: center.x - node.width / 2, y: center.y - node.height / 2, width: node.width, height: node.height, cx: center.x, cy: center.y, layer: item.layer, order: layers[item.layer].indexOf(item) }
  })
  const outById = new Map(outNodes.map((node) => [node.id, node]))

  const ports = portOffsets(layers, chains, cross, opts)
  const outEdges = edges.map((edge) => routeEdge({ edge, chains, layerOf, crossOf, mainOf, main, ports, outById, toXY, opts, horizontal }))

  const right = Math.max(0, ...outNodes.map((node) => node.x + node.width), ...outEdges.flatMap((edge) => edge.points.map((point) => point.x)))
  const bottom = Math.max(0, ...outNodes.map((node) => node.y + node.height), ...outEdges.flatMap((edge) => edge.points.map((point) => point.y)))
  const layerBands = layers.map((layer, index) => {
    const size = main.thickness[index]
    const center = main.centers[index] + opts.padding
    const half = size / 2 + opts.layerGap / 2
    return { index, from: center - half, to: center + half, center, nodeIds: layer.filter((item) => !item.dummy).map((item) => item.key) }
  })
  return { nodes: outNodes, edges: outEdges, layers: layerBands, width: right + opts.padding, height: bottom + opts.padding, crossings, direction: opts.direction }
}

// Where each edge leaves and enters a node: spread along the node's side so arrowheads do not stack.
function portOffsets(layers, chains, cross, opts) {
  const slots = new Map() // `${edge}|${item.key}|${side}` -> offset
  const groups = new Map()
  for (const [index, chain] of chains.paths) {
    chain.forEach((item, position) => {
      if (item.dummy) return
      const nextOther = chain[position + 1] ?? null
      const prevOther = chain[position - 1] ?? null
      const side = nextOther ? 'after' : 'before'
      const other = nextOther ?? prevOther
      const key = `${item.key}|${side}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push({ index, other, item })
    })
  }
  for (const [key, list] of groups) {
    list.sort((a, b) => cross.get(a.other) - cross.get(b.other) || a.index - b.index)
    const item = list[0].item
    const usable = Math.max(0, item.cross - 2 * opts.cornerRadius)
    const step = list.length > 1 ? Math.min(14, usable / (list.length - 1)) : 0
    list.forEach((entry, i) => slots.set(`${entry.index}|${key}`, (i - (list.length - 1) / 2) * step))
  }
  return slots
}

function routeEdge({ edge, chains, layerOf, crossOf, mainOf, main, ports, outById, toXY, opts, horizontal }) {
  const base = { index: edge.index, from: edge.from, to: edge.to, reversed: false, flat: false, selfLoop: false }
  const source = outById.get(edge.from)
  const target = outById.get(edge.to)

  if (edge.u === edge.v) return selfLoop(base, source, horizontal)
  const chain = chains.paths.get(edge.index)
  if (!chain) return flatEdge(base, source, target, horizontal, opts)

  // Points in (main, cross) from the lower layer to the higher layer.
  const reversed = layerOf.get(edge.u.id) > layerOf.get(edge.v.id)
  const abstract = []
  chain.forEach((item, position) => {
    if (item.dummy) {
      const half = main.thickness[item.layer] / 2
      abstract.push([mainOf(item) - half, crossOf(item)], [mainOf(item) + half, crossOf(item)])
      return
    }
    const side = position === 0 ? 'after' : 'before'
    const offset = ports.get(`${edge.index}|${item.key}|${side}`) ?? 0
    abstract.push([mainOf(item) + (side === 'after' ? 1 : -1) * item.node.main / 2, crossOf(item) + offset])
  })
  const ordered = reversed ? [...abstract].reverse() : abstract
  const points = ordered.map(([m, c]) => toXY(m, c))
  const path = opts.routing === 'orthogonal' ? orthogonalPath(ordered, toXY, opts.cornerRadius) : curvePath(ordered, toXY)
  return { ...base, reversed, points, d: path, ...ends(points), labelAt: midpoint(points) }
}

function ends(points) {
  const [a, b] = [points.at(-2), points.at(-1)]
  const [c, d] = [points[0], points[1]]
  return { endAngle: Math.atan2(b.y - a.y, b.x - a.x), startAngle: Math.atan2(c.y - d.y, c.x - d.x), end: b, start: c }
}

function midpoint(points) {
  const lengths = points.slice(1).map((point, i) => Math.hypot(point.x - points[i].x, point.y - points[i].y))
  const half = lengths.reduce((sum, value) => sum + value, 0) / 2
  let travelled = 0
  for (let i = 0; i < lengths.length; i += 1) {
    if (travelled + lengths[i] >= half) {
      const t = lengths[i] ? (half - travelled) / lengths[i] : 0
      return { x: points[i].x + (points[i + 1].x - points[i].x) * t, y: points[i].y + (points[i + 1].y - points[i].y) * t }
    }
    travelled += lengths[i]
  }
  return points[0]
}

const num = (value) => Math.round(value * 10) / 10

function curvePath(abstract, toXY) {
  let d = ''
  abstract.forEach(([m, c], index) => {
    const here = toXY(m, c)
    if (index === 0) {
      d += `M${num(here.x)} ${num(here.y)}`
      return
    }
    const [pm, pc] = abstract[index - 1]
    if (m === pm) {
      d += `L${num(here.x)} ${num(here.y)}`
      return
    }
    const mid = (pm + m) / 2
    const a = toXY(mid, pc)
    const b = toXY(mid, c)
    d += `C${num(a.x)} ${num(a.y)} ${num(b.x)} ${num(b.y)} ${num(here.x)} ${num(here.y)}`
  })
  return d
}

function orthogonalPath(abstract, toXY, radius) {
  const route = [abstract[0]]
  for (let i = 1; i < abstract.length; i += 1) {
    const [pm, pc] = abstract[i - 1]
    const [m, c] = abstract[i]
    if (m !== pm && c !== pc) {
      const mid = (pm + m) / 2
      route.push([mid, pc], [mid, c])
    }
    route.push([m, c])
  }
  const xy = route.map(([m, c]) => toXY(m, c))
  let d = `M${num(xy[0].x)} ${num(xy[0].y)}`
  for (let i = 1; i < xy.length; i += 1) {
    const prev = xy[i - 1]
    const here = xy[i]
    const next = xy[i + 1]
    if (!next) {
      d += `L${num(here.x)} ${num(here.y)}`
      continue
    }
    const inLength = Math.hypot(here.x - prev.x, here.y - prev.y)
    const outLength = Math.hypot(next.x - here.x, next.y - here.y)
    const r = Math.min(radius, inLength / 2, outLength / 2)
    if (!r) {
      d += `L${num(here.x)} ${num(here.y)}`
      continue
    }
    const before = { x: here.x - ((here.x - prev.x) / inLength) * r, y: here.y - ((here.y - prev.y) / inLength) * r }
    const after = { x: here.x + ((next.x - here.x) / outLength) * r, y: here.y + ((next.y - here.y) / outLength) * r }
    d += `L${num(before.x)} ${num(before.y)}Q${num(here.x)} ${num(here.y)} ${num(after.x)} ${num(after.y)}`
  }
  return d
}

function flatEdge(base, source, target, horizontal, opts) {
  const reach = 26 + Math.min(40, Math.abs(source.order - target.order) * 8)
  let a
  let b
  let c1
  let c2
  if (horizontal) {
    a = { x: source.x, y: source.cy }
    b = { x: target.x, y: target.cy }
    c1 = { x: a.x - reach, y: a.y }
    c2 = { x: b.x - reach, y: b.y }
  } else {
    a = { x: source.cx, y: source.y }
    b = { x: target.cx, y: target.y }
    c1 = { x: a.x, y: a.y - reach }
    c2 = { x: b.x, y: b.y - reach }
  }
  const points = [a, c1, c2, b]
  return {
    ...base,
    flat: true,
    points,
    d: `M${num(a.x)} ${num(a.y)}C${num(c1.x)} ${num(c1.y)} ${num(c2.x)} ${num(c2.y)} ${num(b.x)} ${num(b.y)}`,
    endAngle: Math.atan2(b.y - c2.y, b.x - c2.x),
    startAngle: Math.atan2(a.y - c1.y, a.x - c1.x),
    end: b,
    start: a,
    labelAt: { x: (a.x + b.x) / 2 + (horizontal ? -reach * 0.75 : 0), y: (a.y + b.y) / 2 + (horizontal ? 0 : -reach * 0.75) }
  }
}

function selfLoop(base, node, horizontal) {
  const a = horizontal ? { x: node.cx + 8, y: node.y + node.height } : { x: node.x + node.width, y: node.cy - 8 }
  const b = horizontal ? { x: node.cx - 8, y: node.y + node.height } : { x: node.x + node.width, y: node.cy + 8 }
  const c1 = horizontal ? { x: a.x + 14, y: a.y + 28 } : { x: a.x + 28, y: a.y - 14 }
  const c2 = horizontal ? { x: b.x - 14, y: b.y + 28 } : { x: b.x + 28, y: b.y + 14 }
  return {
    ...base,
    selfLoop: true,
    points: [a, c1, c2, b],
    d: `M${num(a.x)} ${num(a.y)}C${num(c1.x)} ${num(c1.y)} ${num(c2.x)} ${num(c2.y)} ${num(b.x)} ${num(b.y)}`,
    endAngle: Math.atan2(b.y - c2.y, b.x - c2.x),
    startAngle: Math.atan2(a.y - c1.y, a.x - c1.x),
    end: b,
    start: a,
    labelAt: { x: (c1.x + c2.x) / 2, y: (c1.y + c2.y) / 2 }
  }
}
