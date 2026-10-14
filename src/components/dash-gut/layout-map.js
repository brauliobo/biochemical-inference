// Turns a hand-laid layout module (src/viz/layouts/*.js) into the `map` prop of MetabolicMap. Pure.
//
// A layout has entity-typed nodes (compound, reaction, enzyme, intervention, state, disease, outcome, ...), generated
// substrate/product `edges`, non-reaction `links` with a sign, and per reaction the compounds it only lists as `pooled`
// (water, ATP, NADH ...). MetabolicMap knows four node kinds:
//   compound -> compound, reaction -> reaction, enzyme -> enzyme,
//   an intervention that acts on a reaction (PPI blocking the proton pump) -> enzyme (a dotted tether, like a regulator),
//   everything else (intervention, state, disease, outcome, system, pathway) -> pool (dashed box).
// Pooled participants become small currency nodes beside their reaction: hidden until the map's "Currency molecules"
// toggle is on, but always in the reaction equations of the text alternative. Group ids become the group labels
// MetabolicMap draws as boxes. The sign and label of a link are not drawn by MetabolicMap; `suffix` adds a short text
// to a node label where the page needs one ("GAD (PLP)").

const KIND = { compound: 'compound', reaction: 'reaction', enzyme: 'enzyme' }
const CURRENCY_DX = 78
const CURRENCY_DY = 30

/** "compound:atp" -> "ATP", "compound:carbon-dioxide" -> "carbon dioxide". */
export function slugLabel(id) {
  const slug = String(id).replace(/^[a-z]+:/, '')
  return slug.length <= 4 && !slug.includes('-') ? slug.toUpperCase() : slug.replaceAll('-', ' ')
}

/**
 * @param layout  a layout object (default export of a module in src/viz/layouts)
 * @param options { suffix: { nodeId: ' (PLP)' }, labels: { nodeId: 'text' }, hide: [nodeId], names: (id) => label | undefined, pooled: true }
 */
export function layoutToMap(layout, { suffix = {}, labels = {}, hide = [], names = () => undefined, pooled = true } = {}) {
  const hidden = new Set(hide)
  const groupLabel = new Map((layout.groups ?? []).map((group) => [group.id, group.label]))
  const byId = new Map(layout.nodes.map((node) => [node.id, node]))
  const regulators = new Set(
    (layout.links ?? [])
      .filter((link) => byId.get(link.to)?.kind === 'reaction' && !KIND[byId.get(link.from)?.kind])
      .map((link) => link.from)
  )
  const nodes = layout.nodes
    .filter((node) => !hidden.has(node.id))
    .map((node) => {
      const kind = KIND[node.kind] ?? (regulators.has(node.id) ? 'enzyme' : 'pool')
      const reversible = node.kind === 'reaction' ? Boolean(layout.reactions?.[node.id]?.reversible) : undefined
      return {
        id: node.id,
        kind,
        x: node.x,
        y: node.y,
        label: `${labels[node.id] ?? node.label}${suffix[node.id] ?? ''}`,
        ...(node.group && groupLabel.has(node.group) ? { group: groupLabel.get(node.group) } : {}),
        ...(reversible ? { reversible } : {})
      }
    })
  const present = new Set(nodes.map((node) => node.id))
  const edges = []
  for (const edge of layout.edges ?? []) {
    if (!present.has(edge.from) || !present.has(edge.to)) continue
    edges.push({
      from: edge.from,
      to: edge.to,
      reaction: edge.role === 'substrate' ? edge.to : edge.from,
      ...(edge.n > 1 ? { stoich: edge.n } : {})
    })
  }
  for (const link of layout.links ?? []) {
    if (present.has(link.from) && present.has(link.to)) edges.push({ from: link.from, to: link.to })
  }
  if (pooled) {
    for (const [reactionId, detail] of Object.entries(layout.reactions ?? {})) {
      const at = byId.get(reactionId)
      if (!at || !present.has(reactionId)) continue
      for (const [side, list, sign] of [['substrate', detail.pooled?.substrates ?? [], -1], ['product', detail.pooled?.products ?? [], 1]]) {
        list.forEach((item, index) => {
          const id = `${reactionId}|pool|${side}|${item.id}`
          nodes.push({ id, kind: 'compound', currency: true, x: at.x + sign * CURRENCY_DX, y: at.y + (index - (list.length - 1) / 2) * CURRENCY_DY, label: names(item.id) ?? slugLabel(item.id) })
          edges.push(side === 'substrate' ? { from: id, to: reactionId, reaction: reactionId, ...(item.n > 1 ? { stoich: item.n } : {}) } : { from: reactionId, to: id, reaction: reactionId, ...(item.n > 1 ? { stoich: item.n } : {}) })
        })
      }
    }
  }
  return { viewBox: [0, 0, layout.viewBox.width, layout.viewBox.height], nodes, edges }
}

/** Reaction node ids of a layout (the keys a flux object may use). */
export const reactionIds = (layout) => layout.nodes.filter((node) => node.kind === 'reaction').map((node) => node.id)

/** Entity ids a layout mentions, including pooled participants (to look their names up in the knowledge base). */
export function entityIds(layout) {
  const ids = new Set(layout.nodes.map((node) => node.id))
  for (const detail of Object.values(layout.reactions ?? {})) {
    for (const item of [...(detail.pooled?.substrates ?? []), ...(detail.pooled?.products ?? [])]) ids.add(item.id)
  }
  return [...ids]
}

/** The signed links of a layout as plain rows for a text list ("Proton pump inhibitor blocks H+/K+-ATPase"). */
export function linkRows(layout) {
  const name = new Map(layout.nodes.map((node) => [node.id, node.label]))
  return (layout.links ?? []).map((link) => ({
    from: link.from,
    to: link.to,
    fromName: name.get(link.from) ?? link.from,
    toName: name.get(link.to) ?? link.to,
    sign: link.sign === '-' ? 'decrease' : 'increase',
    label: link.label ?? ''
  }))
}
