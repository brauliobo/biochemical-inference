// View models: everything a page needs, pre-grouped and framework-free.
// Components render these shapes; they never touch the graph directly.
import { TYPES, typeLabel, typeMeta } from './types.js'
import { EVIDENCE_KEYS, claimStatusInfo, evidenceInfo } from './evidence.js'
import { relationOrder } from './relations.js'
import { resolveMentions } from './mentions.js'
import { parseId } from './ids.js'
import { describeFacts } from './facts.js'

export { search } from './search.js'

const SEE_ALSO_LIMIT = 8
const FEATURED_LIMIT = 6
const EVIDENCE_RELS = new Set(['has-evidence', 'has-counterevidence'])

const byName = (a, b) => a.name.localeCompare(b.name)

/** Compact card for an entity, used in lists, groups and search-like results. */
export function brief(entity) {
  return { id: entity.id, type: entity.type, typeLabel: typeLabel(entity.type), name: entity.name, summary: entity.summary, evidence: entity.evidence }
}

const nameOf = (graph, id) => graph.get(id)?.name ?? parseId(id)?.slug ?? id

export function formatCitation(article) {
  const authors = article.authors ?? []
  const who = authors.length > 2 ? `${authors[0]} et al.` : authors.join(' & ')
  return `${who} (${article.year}). ${article.journal}.`
}

function referenceItem(article, stance) {
  const { authors, year, journal, doi, pmid, url, verified, takeaways } = article
  return { ...brief(article), stance, citation: formatCitation(article), authors, year, journal, doi, pmid, url, verified, takeaways: takeaways ?? [] }
}

function relationGroups(graph, id) {
  const groups = new Map()
  const references = []
  for (const link of graph.links(id)) {
    const other = graph.get(link.other)
    if (EVIDENCE_RELS.has(link.rel) && other.type === 'article') {
      references.push(referenceItem(other, link.rel === 'has-evidence' ? 'supports' : 'contradicts'))
      continue
    }
    let group = groups.get(link.label)
    if (!group) {
      group = { rel: link.rel, label: link.label, direction: link.direction, items: [] }
      groups.set(link.label, group)
    }
    if (group.items.some((item) => item.id === other.id)) continue
    group.items.push({ ...brief(other), ...(link.note ? { note: link.note } : {}), origin: link.origin })
  }
  const sorted = [...groups.values()].sort((a, b) => relationOrder(a.rel) - relationOrder(b.rel))
  for (const group of sorted) group.items.sort(byName)
  references.sort((a, b) => (a.stance === b.stance ? b.year - a.year : a.stance === 'supports' ? -1 : 1))
  return { groups: sorted, references }
}

/** Entities two hops away (not already linked), ranked Adamic-Adar style: shared neighbours count, hubs count less. */
export function seeAlso(graph, id, limit = SEE_ALSO_LIMIT) {
  const direct = new Set([id, ...graph.neighbors(id)])
  const scores = new Map()
  for (const middle of graph.neighbors(id)) {
    if (graph.get(middle).type === 'article') continue
    const weight = 1 / Math.log(1 + graph.degree(middle))
    for (const candidate of graph.neighbors(middle)) {
      if (direct.has(candidate) || graph.get(candidate).type === 'article') continue
      const entry = scores.get(candidate) ?? { score: 0, via: [] }
      entry.score += weight
      entry.via.push(middle)
      scores.set(candidate, entry)
    }
  }
  return [...scores]
    .map(([candidate, { score, via }]) => ({ ...brief(graph.get(candidate)), score: Math.round(score * 1000) / 1000, via: via.map((m) => ({ id: m, name: nameOf(graph, m) })) }))
    .sort((a, b) => b.score - a.score || byName(a, b))
    .slice(0, limit)
}

function equation(graph, reaction) {
  const side = (list) => list.map(({ id, n }) => `${n === 1 ? '' : `${n} `}${nameOf(graph, id)}`).join(' + ')
  return `${side(reaction.reactants)} ${reaction.reversible ? '⇌' : '→'} ${side(reaction.products)}`
}

function reactionSection(graph, reaction) {
  const participants = (list) => list.map(({ id, n }) => ({ id, n, name: nameOf(graph, id) }))
  return {
    equation: equation(graph, reaction),
    reactants: participants(reaction.reactants),
    products: participants(reaction.products),
    enzymes: (reaction.enzymes ?? []).map((id) => ({ id, name: nameOf(graph, id) })),
    reversible: Boolean(reaction.reversible),
    compartment: reaction.compartment ?? null,
    identifiers: describeFacts({ ...(reaction.ec ? { ec: reaction.ec } : {}), ...(reaction.rhea ? { rhea: reaction.rhea } : {}), ...(reaction.reactome ? { reactome: reaction.reactome } : {}) })
  }
}

function articleSection(entity) {
  const { authors, year, journal, doi, pmid, url, verified, takeaways } = entity
  return {
    citation: formatCitation(entity),
    authors,
    year,
    journal,
    verified,
    takeaways,
    identifiers: describeFacts({ ...(doi ? { doi } : {}), ...(pmid ? { pmid } : {}) }),
    url: url ?? null
  }
}

function breadcrumbs(entity) {
  return [
    { kind: 'home', label: 'Home' },
    { kind: 'hub', type: entity.type, label: typeMeta(entity.type)?.plural ?? entity.type },
    { kind: 'entity', id: entity.id, label: entity.name }
  ]
}

/** Everything one entity page needs, or null if the id is unknown. */
export function pageModel(graph, id) {
  const entity = graph.get(id)
  if (!entity) return null
  const { groups, references } = relationGroups(graph, id)
  return {
    id,
    type: entity.type,
    typeLabel: typeLabel(entity.type),
    typeIcon: typeMeta(entity.type)?.icon ?? null,
    name: entity.name,
    aliases: entity.aliases ?? [],
    summary: entity.summary,
    evidence: evidenceInfo(entity.evidence),
    facts: describeFacts(entity.facts),
    body: (entity.body ?? []).map((paragraph) => resolveMentions(paragraph, graph.get)),
    relationGroups: groups,
    references,
    mentionedBy: graph.mentionedBy(id).map((other) => brief(graph.get(other))).sort(byName),
    seeAlso: seeAlso(graph, id),
    breadcrumbs: breadcrumbs(entity),
    reaction: entity.reaction ? reactionSection(graph, entity.reaction) : null,
    article: entity.type === 'article' ? articleSection(entity) : null,
    claim: entity.type === 'claim' ? { statement: entity.statement, source: entity.source, status: claimStatusInfo(entity.status) } : null,
    entity
  }
}

function evidenceCounts(entities) {
  const counts = Object.fromEntries(EVIDENCE_KEYS.map((key) => [key, 0]))
  for (const entity of entities) counts[entity.evidence] = (counts[entity.evidence] ?? 0) + 1
  return counts
}

/** Listing page for one entity type, or null for an unknown type. */
export function hubModel(graph, type) {
  const meta = typeMeta(type)
  if (!meta) return null
  const entities = graph.byType.get(type) ?? []
  return {
    type,
    label: meta.label,
    plural: meta.plural,
    description: meta.description,
    icon: meta.icon,
    count: entities.length,
    evidenceCounts: evidenceCounts(entities),
    items: entities
      .map((entity) => ({ ...brief(entity), aliases: entity.aliases ?? [], degree: graph.degree(entity.id) }))
      .sort(byName),
    breadcrumbs: [{ kind: 'home', label: 'Home' }, { kind: 'hub', type, label: meta.plural }]
  }
}

/** Landing page: type cards, most-connected entities, totals. */
export function homeModel(graph) {
  const featuredTypes = new Set(['claim', 'article'])
  return {
    totals: { ...graph.stats, byEvidence: evidenceCounts(graph.entities) },
    types: TYPES.map((meta) => ({
      type: meta.id,
      label: meta.label,
      plural: meta.plural,
      description: meta.description,
      icon: meta.icon,
      count: graph.byType.get(meta.id)?.length ?? 0
    })),
    featured: graph.entities
      .filter((entity) => !featuredTypes.has(entity.type))
      .map((entity) => ({ ...brief(entity), degree: graph.degree(entity.id) }))
      .sort((a, b) => b.degree - a.degree || byName(a, b))
      .slice(0, FEATURED_LIMIT)
  }
}
