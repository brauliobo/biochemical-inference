// Entry point of the methylation model for the UI: model data, structural variants, scenarios, observable metadata,
// ontology bindings and lazy parameter provenance. Data only - importing this does not load the engine, the
// literature tables or the scenario runner:
//
//   import { methylationModel, variants, scenarios, observablesMeta, ontologyBindings, parameterSources } from '../sim/models/index.js'
//   import { runScenario } from '../sim/models/methylation-run.js'       // engine-side helpers (loaded with the engine)
//   import { methylationEnsemble } from '../sim/models/methylation-ensemble.js'
//   import { runValidation } from '../sim/models/methylation-validate.js'   // tests / validation panel
//
// parameterSources(id) is async because it loads the literature tables on first use (getSources()).

import { OBS, SPECIES, STRUCT, PLAN, methylationModel, getModel, variants, variantOptions } from './methylation.js'
import { scenarios, scenarioIndex } from '../scenarios.js'
import { validationTargets } from '../validation-targets.js'

export { methylationModel, getModel, variants, variantOptions, scenarios, scenarioIndex, validationTargets, STRUCT, PLAN }

/** Lazy provenance (see methylation-sources.js): resolves to { id, value, low, high, unit, confidence, origin, sourceArticle, locator, ... }. */
export const parameterSources = (id, model = methylationModel) => import('./methylation-sources.js').then((m) => m.parameterSource(id, model))
/** Lazy loader of the whole provenance table: { get(id), all(), tables }. */
export const getSources = () => import('./methylation-sources.js').then((m) => m.getSources())

/**
 * Observables for the UI: derived observables (groups status / flux / pool) plus the key species.
 * higher: which direction is "more methylation capacity" for colouring (null = neutral).
 */
const KEY_SPECIES = [
  ['sam', 'SAM (liver)', 'uM', null], ['sah', 'SAH (liver)', 'uM', null], ['met', 'Methionine (liver)', 'uM', null], ['hcy', 'Homocysteine (liver)', 'uM', null],
  ['cysta', 'Cystathionine (liver)', 'uM', null], ['mthf', '5-Methyl-THF', 'uM', null], ['thf', 'THF', 'uM', null], ['gly', 'Glycine (liver)', 'uM', null],
  ['gly_p', 'Glycine (plasma)', 'uM', null], ['ser', 'Serine (liver)', 'uM', null], ['sar', 'Sarcosine (liver)', 'uM', null], ['bet', 'Betaine (liver)', 'uM', null],
  ['bet_p', 'Betaine (plasma)', 'uM', null], ['cho', 'Choline (liver)', 'uM', null], ['dmg', 'DMG (liver)', 'uM', null], ['nam', 'Nicotinamide (liver)', 'uM', null], ['mna', 'MNA (liver)', 'uM', null]
]
export const observablesMeta = [
  ...OBS.map(([id, label, unit, , group]) => ({ id, label, unit, group, kind: 'observable', higher: id === 'samSahRatio' || id === 'methylationIndex' || id === 'methylationPotential' ? 'good' : null })),
  ...KEY_SPECIES.map(([id, label, unit]) => ({ id, label, unit, group: 'species', kind: 'species', higher: null }))
]

/** species / reaction -> ontology (and enzyme) ids, plus the reverse maps. */
function bindings(model) {
  const species = {}; const reactions = {}; const bySpecies = {}; const byReaction = {}
  for (const s of model.species) if (s.ontologyId) { species[s.id] = s.ontologyId; (bySpecies[s.ontologyId] ??= []).push(s.id) }
  for (const r of model.reactions) {
    if (r.ontologyId || r.enzymeId) reactions[r.id] = { ontologyId: r.ontologyId ?? null, enzymeId: r.enzymeId ?? null }
    if (r.ontologyId) (byReaction[r.ontologyId] ??= []).push(r.id)
  }
  return { species, reactions, bySpeciesOntology: bySpecies, byReactionOntology: byReaction }
}
export const ontologyBindings = bindings(methylationModel)

export { SPECIES }
