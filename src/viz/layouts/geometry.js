// Shared geometry for the hand-laid metabolic maps (src/viz/layouts/*.js).
// Pure functions over layout data; used by scripts/build-layout.js and the layout tests to refuse overlapping nodes,
// and available to renderers that want the same node footprint.

export const COMPOUND_HEIGHT = 30
export const REACTION_SIZE = 26
const CHAR_WIDTH = 6.8
const PADDING_X = 20
const MIN_COMPOUND_WIDTH = 64
const MAX_COMPOUND_WIDTH = 200

/** Width of a labelled box node (compounds, enzymes, systems, ...). Reaction nodes are fixed-size marks. */
export function nodeWidth(node) {
  if (node.kind === 'reaction') return REACTION_SIZE
  const text = String(node.label ?? node.id)
  return Math.min(MAX_COMPOUND_WIDTH, Math.max(MIN_COMPOUND_WIDTH, Math.round(text.length * CHAR_WIDTH + PADDING_X)))
}

export function nodeHeight(node) {
  return node.kind === 'reaction' ? REACTION_SIZE : COMPOUND_HEIGHT
}

/** Axis-aligned footprint of a node centred on (x, y): { x0, y0, x1, y1, width, height }. */
export function nodeBox(node) {
  const width = nodeWidth(node)
  const height = nodeHeight(node)
  return { x0: node.x - width / 2, y0: node.y - height / 2, x1: node.x + width / 2, y1: node.y + height / 2, width, height }
}

/** True when two footprints, grown by `gap`, intersect. */
export function boxesOverlap(a, b, gap = 6) {
  return a.x0 - gap < b.x1 && b.x0 - gap < a.x1 && a.y0 - gap < b.y1 && b.y0 - gap < a.y1
}

/** Pairs of overlapping nodes: [[idA, idB], ...]. */
export function findOverlaps(nodes, gap = 6) {
  const boxes = nodes.map((node) => ({ id: node.id, box: nodeBox(node) }))
  const found = []
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      if (boxesOverlap(boxes[i].box, boxes[j].box, gap)) found.push([boxes[i].id, boxes[j].id])
    }
  }
  return found
}

/** Smallest centre-to-centre distance in a layout and the pair that has it. */
export function closestPair(nodes) {
  let best = { distance: Infinity, pair: null }
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const distance = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y)
      if (distance < best.distance) best = { distance, pair: [nodes[i].id, nodes[j].id] }
    }
  }
  return best
}

/** Nodes whose footprint leaves the viewBox (grown by `margin` inwards). */
export function outOfBounds(nodes, viewBox, margin = 8) {
  return nodes.filter((node) => {
    const box = nodeBox(node)
    return box.x0 < margin || box.y0 < margin || box.x1 > viewBox.width - margin || box.y1 > viewBox.height - margin
  }).map((node) => node.id)
}
