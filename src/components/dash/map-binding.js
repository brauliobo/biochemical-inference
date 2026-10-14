// Turns model results (reaction fluxes and species levels by model id) into the node-keyed objects the MetabolicMap
// takes (reaction node id -> flux, compound node id -> level). The bindings are the model's `ontologyBindings`
// (sim/models/index.js); they are passed in so this file imports no simulator code.

/** Reverse halves of reversible pairs (net flux = forward - reverse). */
export const REVERSE_REACTIONS = new Set(['ahcy_r', 'shmt_r'])

/** Net flux per reaction node: byReactionOntology = { 'reaction:...': ['mat1', 'mat3'] }, fluxes = { mat1: n, ... }. */
export function fluxByNode(fluxes, byReactionOntology) {
  const out = {}
  for (const [node, ids] of Object.entries(byReactionOntology)) {
    let net = 0
    let found = false
    for (const id of ids) {
      if (!(id in fluxes) || !Number.isFinite(fluxes[id])) continue
      net += REVERSE_REACTIONS.has(id) ? -fluxes[id] : fluxes[id]
      found = true
    }
    if (found) out[node] = net
  }
  return out
}

/** Level per compound node (the liver pool when there are several): bySpeciesOntology = { 'compound:sam': ['sam'] }. */
export function concentrationByNode(state, bySpeciesOntology) {
  const out = {}
  for (const [node, ids] of Object.entries(bySpeciesOntology)) {
    const id = ids.find((candidate) => !candidate.endsWith('_gut') && Number.isFinite(state[candidate]))
    if (id !== undefined) out[node] = state[id]
  }
  return out
}

/** Ratio of two node-keyed objects (scenario / baseline) for nodes present and positive in both. */
export function ratioByNode(values, baseline) {
  const out = {}
  for (const [node, value] of Object.entries(values)) {
    const base = baseline[node]
    if (Number.isFinite(value) && Number.isFinite(base) && base > 0) out[node] = value / base
  }
  return out
}

/**
 * Layout of src/viz/layouts/* (nodes, edges with role/n, reactions) as the `map` prop of MetabolicMap:
 * { nodes, edges: [{ from, to, reaction?, stoich? }], viewBox: [x, y, w, h] }. Reaction nodes get `reversible`
 * from the layout's reaction table; enzyme names are already part of the reaction labels.
 */
export function layoutToMap(layout) {
  const groupLabel = new Map((layout.groups ?? []).map((group) => [group.id, group.label]))
  const pool = new Set(layout.pool ?? [])
  const nodes = layout.nodes.filter((node) => !pool.has(node.id)).map((node) => ({
    id: node.id,
    kind: node.kind === 'reaction' ? 'reaction' : node.kind === 'pool' ? 'pool' : 'compound',
    x: node.x,
    y: node.y,
    label: node.label,
    ...(node.group && groupLabel.has(node.group) ? { group: groupLabel.get(node.group) } : {}),
    ...(node.kind === 'reaction' && layout.reactions?.[node.id]?.reversible ? { reversible: true } : {}),
    ...(node.currency ? { currency: true } : {})
  }))
  const known = new Set(nodes.map((node) => node.id))
  const edges = (layout.edges ?? []).filter((edge) => known.has(edge.from) && known.has(edge.to)).map((edge) => {
    const reaction = edge.from.startsWith('reaction:') ? edge.from : edge.to.startsWith('reaction:') ? edge.to : undefined
    return { from: edge.from, to: edge.to, ...(reaction ? { reaction } : {}), ...(edge.n && edge.n !== 1 ? { stoich: edge.n } : {}) }
  })
  return { nodes, edges, viewBox: [0, 0, layout.viewBox.width, layout.viewBox.height] }
}
