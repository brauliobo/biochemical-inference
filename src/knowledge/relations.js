// Relation vocabulary. Authors write only the FORWARD id; the engine derives the inverse.
// `from` / `to` list the allowed entity types for the forward direction (null = any type).
// Edit this table to change the vocabulary; everything else is derived from it.

const BIOLOGICAL = ['compound', 'enzyme', 'reaction', 'pathway', 'state', 'disease', 'outcome', 'system']
const ACTORS = [...BIOLOGICAL, 'intervention']
const CONDITIONS = ['state', 'disease', 'outcome']

function def(id, label, inverse, inverseLabel, from, to, description) {
  return { id, label, inverse, inverseLabel, symmetric: false, from, to, description }
}

function symmetric(id, label, from, to, description) {
  return { id, label, inverse: id, inverseLabel: label, symmetric: true, from, to, description }
}

const definitions = [
  def('substrate-of', 'Substrate of', 'has-substrate', 'Has substrate', ['compound'], ['reaction', 'enzyme', 'pathway'], 'Compound is consumed by the reaction/enzyme/pathway (derived from reaction.reactants).'),
  def('product-of', 'Product of', 'has-product', 'Has product', ['compound'], ['reaction', 'enzyme', 'pathway'], 'Compound is produced by the reaction/enzyme/pathway (derived from reaction.products).'),
  def('catalyzes', 'Catalyzes', 'catalyzed-by', 'Catalyzed by', ['enzyme'], ['reaction'], 'Enzyme catalyses the reaction (derived from reaction.enzymes).'),
  def('cofactor-of', 'Cofactor of', 'requires-cofactor', 'Requires cofactor', ['compound'], ['enzyme', 'reaction'], 'Compound is needed for the enzyme or reaction to work.'),
  def('part-of', 'Part of', 'has-part', 'Has part', null, null, 'Containment: a reaction in a pathway, an organ in a system, a sub-state of a state.'),
  def('precursor-of', 'Precursor of', 'derived-from', 'Derived from', ['compound'], ['compound'], 'Compound is a metabolic precursor of another compound.'),
  def('increases', 'Increases', 'increased-by', 'Increased by', ACTORS, BIOLOGICAL, 'Raises the level or activity of the target.'),
  def('decreases', 'Decreases', 'decreased-by', 'Decreased by', ACTORS, BIOLOGICAL, 'Lowers the level or activity of the target.'),
  def('causes', 'Causes', 'caused-by', 'Caused by', ACTORS, CONDITIONS, 'Brings about a state, disease or outcome.'),
  def('mitigates', 'Mitigates', 'mitigated-by', 'Mitigated by', ACTORS, CONDITIONS, 'Reduces a state, disease or outcome.'),
  def('aggravates', 'Aggravates', 'aggravated-by', 'Aggravated by', ACTORS, CONDITIONS, 'Worsens a state, disease or outcome.'),
  def('contraindicated-in', 'Contraindicated in', 'contraindicates', 'Contraindicates', ['intervention', 'compound'], ['state', 'disease'], 'Intervention should be avoided in the given state or disease.'),
  def('manifests-as', 'Manifests as', 'manifestation-of', 'Manifestation of', ['state', 'disease'], CONDITIONS, 'A state or disease presents with the given outcome (symptom, sign, finding).'),
  def('evidence-for', 'Evidence for', 'has-evidence', 'Supported by', null, [...BIOLOGICAL, 'intervention', 'claim'], 'Source supports the target. Derived from refs: an entity listing an article in refs gets article --evidence-for--> entity.'),
  def('evidence-against', 'Evidence against', 'has-counterevidence', 'Contradicted by', null, [...BIOLOGICAL, 'intervention', 'claim'], 'Source contradicts the target.'),
  def('measured-by', 'Measured by', 'measures', 'Measures', BIOLOGICAL, ['compound', 'outcome', 'intervention', 'state'], 'The way to observe or quantify the source (a marker, a test).'),
  symmetric('associated-with', 'Associated with', null, null, 'Undirected association without a stated mechanism.'),
  symmetric('interacts-with', 'Interacts with', ACTORS, ACTORS, 'Mutual interaction (synergy, competition, binding).')
]

const freezeDef = (item) => Object.freeze({
  ...item,
  from: item.from && Object.freeze([...item.from]),
  to: item.to && Object.freeze([...item.to])
})

export const RELATIONS = Object.freeze(definitions.map(freezeDef))

/** Ids authors may write (forward and symmetric). */
export const AUTHORABLE_RELATIONS = Object.freeze(RELATIONS.map((item) => item.id))

const forwardById = new Map(RELATIONS.map((item) => [item.id, item]))
const inverseById = new Map(RELATIONS.filter((item) => !item.symmetric).map((item) => [item.inverse, item]))

/** Every id the engine can display: forward ids, inverse ids, symmetric ids; in presentation order. */
export const RELATION_IDS = Object.freeze(RELATIONS.flatMap((item) => (item.symmetric ? [item.id] : [item.id, item.inverse])))

export function isAuthorable(rel) {
  return forwardById.has(rel)
}

export function isRelation(rel) {
  return forwardById.has(rel) || inverseById.has(rel)
}

/**
 * Describe any relation id.
 * { id, label, forward, inverse, isInverse, symmetric, from, to, description } or null.
 * `from`/`to` always describe the FORWARD direction.
 */
export function relationInfo(rel) {
  const forward = forwardById.get(rel)
  if (forward) {
    return { id: rel, label: forward.label, forward: forward.id, inverse: forward.inverse, isInverse: false, symmetric: forward.symmetric, from: forward.from, to: forward.to, description: forward.description }
  }
  const owner = inverseById.get(rel)
  if (owner) {
    return { id: rel, label: owner.inverseLabel, forward: owner.id, inverse: owner.id, isInverse: true, symmetric: false, from: owner.from, to: owner.to, description: owner.description }
  }
  return null
}

export function inverseOf(rel) {
  return relationInfo(rel)?.inverse ?? null
}

export function labelFor(rel) {
  return relationInfo(rel)?.label ?? String(rel)
}

/** Position of a (forward or inverse) relation in the presentation order, for sorting groups. */
export function relationOrder(rel) {
  const index = RELATION_IDS.indexOf(rel)
  return index < 0 ? RELATION_IDS.length : index
}

/** True when a forward relation may link a source type to a target type. */
export function allowedPair(rel, fromType, toType) {
  const item = forwardById.get(rel)
  if (!item) return false
  return (!item.from || item.from.includes(fromType)) && (!item.to || item.to.includes(toType))
}

/** Readable summary of the allowed pairs, for error messages. */
export function describeAllowed(rel) {
  const item = forwardById.get(rel)
  if (!item) return ''
  const side = (list) => (list ? list.join('|') : 'any')
  return `${side(item.from)} -> ${side(item.to)}`
}
