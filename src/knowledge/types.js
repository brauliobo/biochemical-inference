// Entity type metadata. The single source of truth for which types exist.
// Adding a type = adding one row here (see docs/KNOWLEDGE_MODEL.md).

const rows = [
  ['compound', 'Compound', 'Compounds', 'Molecules, nutrients, metabolites and drugs.', 'flask-conical'],
  ['enzyme', 'Enzyme', 'Enzymes', 'Proteins that catalyse reactions, with their genes.', 'cog'],
  ['reaction', 'Reaction', 'Reactions', 'Individual biochemical transformations with stoichiometry.', 'arrow-right-left'],
  ['pathway', 'Pathway', 'Pathways', 'Connected sets of reactions and cycles.', 'route'],
  ['state', 'State', 'States', 'Physiological or functional states, such as under-methylation.', 'gauge'],
  ['disease', 'Disease', 'Diseases', 'Clinical conditions and disorders.', 'stethoscope'],
  ['outcome', 'Outcome', 'Outcomes', 'Observable symptoms, signs and measurable results.', 'activity'],
  ['system', 'System', 'Systems', 'Organs, tissues, compartments and microbial communities.', 'network'],
  ['intervention', 'Intervention', 'Interventions', 'Supplements, drugs, diets and other things one can do.', 'pill'],
  ['claim', 'Claim', 'Claims', 'Statements to be checked against the literature.', 'message-square-quote'],
  ['article', 'Article', 'Articles', 'Scientific papers and other citable sources.', 'book-open']
]

export const TYPES = Object.freeze(rows.map(([id, label, plural, description, icon], index) => Object.freeze({
  id, label, plural, description, icon, order: index + 1
})))

export const TYPE_IDS = Object.freeze(TYPES.map((type) => type.id))

const byId = new Map(TYPES.map((type) => [type.id, type]))

export function isType(type) {
  return byId.has(type)
}

/** Metadata for a type id, or undefined when the type is unknown. */
export function typeMeta(type) {
  return byId.get(type)
}

/** Human label for a type id; falls back to the raw id for unknown types. */
export function typeLabel(type) {
  return byId.get(type)?.label ?? String(type)
}
