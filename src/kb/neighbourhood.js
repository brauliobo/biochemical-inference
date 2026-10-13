// The one-hop neighbourhood of an entity, grouped by relation label, plus the
// geometry for the optional radial picture. Pure functions over the graph.
import { MENTIONED_BY_STEP, MENTION_STEP } from '../knowledge/graph.js'
import { brief } from '../knowledge/page-model.js'
import { relationOrder } from '../knowledge/relations.js'

export const MAP_NODE_LIMIT = 14

const byName = (a, b) => a.name.localeCompare(b.name)

/**
 * { id, name, type, groups: [{ rel, label, items }], count } for an entity, or null.
 * Groups use the relation labels of the entity pages ("Substrate of", "Mentions", ...),
 * so the same RelationGroups component renders them. An entity can appear in several groups.
 */
export function neighbourhood(graph, id) {
  const entity = graph.get(id)
  if (!entity) return null
  const groups = new Map()
  const add = (rel, label, otherId, note) => {
    const other = graph.get(otherId)
    if (!other) return
    if (!groups.has(label)) groups.set(label, { rel, label, items: [] })
    const group = groups.get(label)
    if (!group.items.some((item) => item.id === otherId)) group.items.push({ ...brief(other), ...(note ? { note } : {}) })
  }
  for (const link of graph.links(id)) add(link.rel, link.label, link.other, link.note)
  for (const other of graph.mentions(id)) add(MENTION_STEP.rel, MENTION_STEP.label, other)
  for (const other of graph.mentionedBy(id)) add(MENTIONED_BY_STEP.rel, MENTIONED_BY_STEP.label, other)
  const mentionOrder = { [MENTION_STEP.rel]: 1, [MENTIONED_BY_STEP.rel]: 2 }
  const ordered = [...groups.values()].sort((a, b) => (mentionOrder[a.rel] ?? 0) - (mentionOrder[b.rel] ?? 0) || relationOrder(a.rel) - relationOrder(b.rel))
  for (const group of ordered) group.items.sort(byName)
  return { id, name: entity.name, type: entity.type, groups: ordered, count: graph.neighbors(id).length }
}

/**
 * Up to `limit` distinct nodes for the picture, taken round-robin across groups so
 * every kind of relation is represented: [{ id, name, type, label }] (label = first group).
 */
export function pickNodes(groups, limit = MAP_NODE_LIMIT) {
  const picked = new Map()
  const cursors = groups.map(() => 0)
  let progressed = true
  while (picked.size < limit && progressed) {
    progressed = false
    for (const [index, group] of groups.entries()) {
      while (cursors[index] < group.items.length && picked.has(group.items[cursors[index]].id)) cursors[index] += 1
      const item = group.items[cursors[index]]
      if (!item) continue
      cursors[index] += 1
      progressed = true
      picked.set(item.id, { id: item.id, name: item.name, type: item.type, label: group.label })
      if (picked.size >= limit) break
    }
  }
  return [...picked.values()]
}

/**
 * Positions for `count` nodes on an ellipse around a centre, first node at the top, clockwise.
 * `anchor` says on which side of the node its label goes ('start' right, 'end' left, 'middle').
 */
export function radialLayout(count, { width = 760, height = 560, labelRoom = 200 } = {}) {
  const center = { x: width / 2, y: height / 2 }
  const rx = width / 2 - labelRoom
  const ry = height / 2 - 40
  const points = Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / Math.max(count, 1)
    const cos = Math.cos(angle)
    return {
      x: Math.round((center.x + rx * cos) * 10) / 10,
      y: Math.round((center.y + ry * Math.sin(angle)) * 10) / 10,
      anchor: cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle',
      above: Math.sin(angle) < -0.3
    }
  })
  return { width, height, center, points }
}

/** Shorten a label for the picture; the full name stays in the link's accessible name. */
export function truncate(text, max = 22) {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`
}
