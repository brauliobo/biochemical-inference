// Logic behind LayeredGraph that is not drawing: node measuring, filtering,
// upstream/downstream reach, keyboard traversal along edges and the text
// alternative (an adjacency list). Pure functions.
import { edgeSign, signWords } from './shapes.js'

const CHAR_WIDTH = 6.8
const LINE_HEIGHT = 15

/** Wrap a label on word boundaries into at most `maxLines` lines of about `maxChars`. */
export function wrapLabel(text, maxChars = 20, maxLines = 3) {
  const words = String(text ?? '').split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const word of words) {
    if (line && `${line} ${word}`.length > maxChars) {
      lines.push(line)
      line = word
    } else line = line ? `${line} ${word}` : word
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    kept[maxLines - 1] = `${kept[maxLines - 1].slice(0, Math.max(maxChars - 1, 1))}…`
    return kept
  }
  return lines.length ? lines : ['']
}

/** { lines, width, height } of a node box for its label. */
export function measureNode(label, { maxChars = 20, minWidth = 84, padX = 18, padY = 12 } = {}) {
  const lines = wrapLabel(label, maxChars)
  const widest = Math.max(...lines.map((line) => line.length))
  return { lines, width: Math.max(minWidth, Math.ceil(widest * CHAR_WIDTH + padX * 2)), height: Math.max(40, lines.length * LINE_HEIGHT + padY * 2) }
}

/**
 * The nodes and edges left after the filters. hiddenTypes / hiddenSigns are lists;
 * `hypothesis: 'hide'` drops edges marked as hypotheses. An edge also goes when
 * one of its ends is gone.
 */
export function filterGraph({ nodes, edges }, { hiddenTypes = [], hiddenSigns = [], hypothesis = 'show' } = {}) {
  const keptNodes = nodes.filter((node) => !hiddenTypes.includes(node.type))
  const ids = new Set(keptNodes.map((node) => node.id))
  const keptEdges = edges.filter((edge) => {
    if (!ids.has(edge.from) || !ids.has(edge.to)) return false
    const { sign, hypothesis: isHypothesis } = edgeSign(edge)
    if (hiddenSigns.includes(sign)) return false
    return !(hypothesis === 'hide' && isHypothesis)
  })
  return { nodes: keptNodes, edges: keptEdges }
}

/** { out: Map(id -> [{ edge, other }]), in: Map(...) } over edge indices of the given list. */
export function adjacency(nodes, edges) {
  const out = new Map(nodes.map((node) => [node.id, []]))
  const incoming = new Map(nodes.map((node) => [node.id, []]))
  edges.forEach((edge, index) => {
    if (!out.has(edge.from) || !out.has(edge.to)) return
    out.get(edge.from).push({ edge, index, other: edge.to })
    incoming.get(edge.to).push({ edge, index, other: edge.from })
  })
  return { out, in: incoming }
}

/** Everything reachable from `start` following edges forward ('down') or backward ('up'): { nodes: Set, edges: Set of edge indices }. */
export function reach(adj, start, direction) {
  const seen = new Set([start])
  const used = new Set()
  const queue = [start]
  const table = direction === 'up' ? adj.in : adj.out
  while (queue.length) {
    const id = queue.shift()
    for (const step of table.get(id) ?? []) {
      used.add(step.index)
      if (!seen.has(step.other)) {
        seen.add(step.other)
        queue.push(step.other)
      }
    }
  }
  return { nodes: seen, edges: used }
}

/**
 * The next node for an arrow key. In a top-to-bottom layout Down follows an edge
 * forward and Up backward, Left/Right step to the neighbour in the same layer;
 * left-to-right swaps the roles. Home/End go to the first/last node. Returns the
 * current id when there is nowhere to go, null for other keys.
 */
export function stepAlong({ layout, adj, current, key, direction = 'TB' }) {
  const byId = new Map(layout.nodes.map((node) => [node.id, node]))
  const here = byId.get(current)
  if (!here) return layout.nodes[0]?.id ?? null
  const forward = direction === 'LR' ? 'ArrowRight' : 'ArrowDown'
  const backward = direction === 'LR' ? 'ArrowLeft' : 'ArrowUp'
  const next = direction === 'LR' ? 'ArrowDown' : 'ArrowRight'
  const previous = direction === 'LR' ? 'ArrowUp' : 'ArrowLeft'
  const crossOf = (node) => (direction === 'LR' ? node.cy : node.cx)
  const ordered = [...layout.nodes].sort((a, b) => a.layer - b.layer || a.order - b.order)

  if (key === 'Home') return ordered[0].id
  if (key === 'End') return ordered.at(-1).id
  if (key === forward || key === backward) {
    const table = key === forward ? adj.out : adj.in
    const candidates = (table.get(current) ?? []).map((step) => byId.get(step.other)).filter((node) => node && node !== here)
    if (!candidates.length) return current
    return candidates.reduce((best, node) => (Math.abs(crossOf(node) - crossOf(here)) < Math.abs(crossOf(best) - crossOf(here)) ? node : best)).id
  }
  if (key === next || key === previous) {
    const mates = layout.nodes.filter((node) => node.layer === here.layer).sort((a, b) => a.order - b.order)
    const index = mates.indexOf(here) + (key === next ? 1 : -1)
    return mates[Math.min(Math.max(index, 0), mates.length - 1)].id
  }
  return null
}

/** The adjacency list as text rows: [{ id, label, type, grade, leadsTo: [{ label, sign }], comesFrom: [...] }]. */
export function adjacencyRows({ nodes, edges }) {
  const adj = adjacency(nodes, edges)
  const label = new Map(nodes.map((node) => [node.id, node.label]))
  return nodes.map((node) => ({
    id: node.id,
    label: node.label,
    type: node.type,
    grade: node.grade,
    leadsTo: adj.out.get(node.id).map((step) => ({ id: step.other, label: label.get(step.other), sign: signWords(step.edge), edgeLabel: step.edge.label })),
    comesFrom: adj.in.get(node.id).map((step) => ({ id: step.other, label: label.get(step.other), sign: signWords(step.edge), edgeLabel: step.edge.label }))
  }))
}

export function describeGraph({ nodes, edges, hiddenCount = 0 }) {
  const signs = new Map()
  let hypotheses = 0
  for (const edge of edges) {
    const { sign, hypothesis } = edgeSign(edge)
    signs.set(sign, (signs.get(sign) ?? 0) + 1)
    if (hypothesis) hypotheses += 1
  }
  const parts = [...signs].map(([sign, count]) => `${count} ${sign}`).join(', ')
  return `${nodes.length} nodes and ${edges.length} links${parts ? ` (${parts})` : ''}${hypotheses ? `; ${hypotheses} of the links are hypotheses` : ''}.${hiddenCount ? ` ${hiddenCount} nodes are hidden by the filters.` : ''}`
}
