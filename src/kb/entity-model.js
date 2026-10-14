// Data the visual templates draw, gathered from the graph: reactions of a compound, the model of one reaction,
// of an enzyme, of a pathway. Pure functions over the shipped graph (framework-free, tested without a DOM).
import { getEntity, graph } from '../knowledge/index.js'
import { balanceOf } from './balance.js'
import { shortLabel } from './layout-map.js'

const nameOf = (id) => getEntity(id)?.name ?? id

/** Equation parts of a reaction entity with names and short labels: [{ id, n, name, label }]. */
function parts(list) {
  return list.map(({ id, n }) => ({ id, n, name: nameOf(id), label: shortLabel(nameOf(id), id) }))
}

/** Plain-text equation: '2 A + B ⇌ C'. */
export function equationText(reaction) {
  const side = (list) => list.map((part) => `${part.n === 1 ? '' : `${part.n} `}${part.label}`).join(' + ')
  return `${side(parts(reaction.reactants))} ${reaction.reversible ? '⇌' : '→'} ${side(parts(reaction.products))}`
}

/** Everything one reaction card draws. */
export function reactionModel(id) {
  const entity = getEntity(id)
  if (!entity?.reaction) return null
  const reaction = entity.reaction
  const pathways = graph.links(id).filter((link) => link.rel === 'part-of' && getEntity(link.other)?.type === 'pathway').map((link) => ({ id: link.other, name: nameOf(link.other) }))
  return {
    id,
    name: entity.name,
    evidence: entity.evidence,
    reactants: parts(reaction.reactants),
    products: parts(reaction.products),
    reversible: Boolean(reaction.reversible),
    compartment: reaction.compartment ?? null,
    enzymes: (reaction.enzymes ?? []).map((enzyme) => ({ id: enzyme, name: nameOf(enzyme), label: shortLabel(nameOf(enzyme)) })),
    pathways,
    ids: Object.fromEntries(['ec', 'rhea', 'reactome'].filter((key) => reaction[key]).map((key) => [key, reaction[key]])),
    balance: balanceOf(reaction, getEntity),
    text: equationText(reaction)
  }
}

/** Reactions in which a compound is consumed or produced: [{ id, name, role, text, enzymes }]. A reversible reaction counts both ways. */
export function reactionsOfCompound(id) {
  const found = new Map()
  for (const link of graph.links(id)) {
    if (!['substrate-of', 'product-of', 'has-substrate', 'has-product'].includes(link.rel)) continue
    const other = getEntity(link.other)
    if (other?.type !== 'reaction') continue
    const entry = found.get(other.id) ?? { id: other.id, name: other.name, consumes: false, produces: false }
    if (link.rel === 'substrate-of') entry.consumes = true
    if (link.rel === 'product-of') entry.produces = true
    found.set(other.id, entry)
  }
  return [...found.values()].map((entry) => {
    const model = reactionModel(entry.id)
    const reversible = model.reversible
    return {
      ...model,
      consumes: entry.consumes || (reversible && entry.produces),
      produces: entry.produces || (reversible && entry.consumes),
      role: entry.consumes && entry.produces ? 'both' : entry.consumes ? 'consumed' : 'produced'
    }
  }).sort((a, b) => a.name.localeCompare(b.name))
}

/** Reaction entities an enzyme catalyses (declared on the enzyme or listed in the reaction). */
export function reactionsOfEnzyme(id) {
  const ids = new Set(graph.links(id).filter((link) => link.rel === 'catalyzes' && getEntity(link.other)?.type === 'reaction').map((link) => link.other))
  return [...ids].map(reactionModel).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name))
}

const split = (text) => String(text ?? '').split(/[;,]/).map((item) => item.trim()).filter(Boolean)

/** Facts of an enzyme as chips: gene, EC, tissue, compartment, cofactors (linked when they are compounds). */
export function enzymeChips(id) {
  const entity = getEntity(id)
  const facts = entity.facts ?? {}
  const cofactors = graph.links(id).filter((link) => link.rel === 'requires-cofactor').map((link) => ({ id: link.other, name: nameOf(link.other) }))
  return {
    gene: facts.gene ?? null,
    ec: facts.ec ?? null,
    uniprot: facts.uniprot ?? null,
    compartment: facts.compartment ?? null,
    tissues: split(facts.tissue),
    cofactors,
    cofactorText: cofactors.length ? [] : split(facts.cofactors)
  }
}

/** A pathway: member reactions, enzymes, compounds (by part-of), plus the states and diseases linked to it. */
export function pathwayModel(id) {
  const members = (type) => graph.links(id).filter((link) => link.rel === 'has-part' && getEntity(link.other)?.type === type).map((link) => link.other)
  const reactionIds = members('reaction')
  return {
    id,
    reactions: reactionIds.map(reactionModel).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name)),
    enzymes: members('enzyme').map((enzyme) => ({ id: enzyme, name: nameOf(enzyme) })),
    compounds: members('compound').map((compound) => ({ id: compound, name: nameOf(compound) }))
  }
}

/**
 * A small reaction network as LayeredGraph input, for entities no hand-laid map places: compounds and reactions as nodes,
 * substrate to reaction to product as unsigned edges. At most `limit` reactions (the first ones given).
 */
export function reactionNetwork(reactionIds) {
  const nodes = new Map()
  const edges = []
  const addCompound = (part) => {
    if (!nodes.has(part.id)) nodes.set(part.id, { id: part.id, label: part.label, type: 'compound', grade: getEntity(part.id)?.evidence })
  }
  for (const id of reactionIds) {
    const model = reactionModel(id)
    if (!model) continue
    nodes.set(id, { id, label: model.enzymes[0]?.label ?? shortLabel(model.name), type: 'reaction', grade: model.evidence })
    for (const part of model.reactants) {
      addCompound(part)
      edges.push({ from: part.id, to: id, sign: 'neutral' })
    }
    for (const part of model.products) {
      addCompound(part)
      edges.push({ from: id, to: part.id, sign: 'neutral' })
    }
  }
  return { nodes: [...nodes.values()], edges }
}

/** Short role line for a quantity-less entity card: type word and evidence. */
export const briefOf = (id) => {
  const entity = getEntity(id)
  return entity ? { id, type: entity.type, name: entity.name, summary: entity.summary, evidence: entity.evidence } : null
}
