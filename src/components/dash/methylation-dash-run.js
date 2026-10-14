// The runner behind the methylation dashboard: one scenario run (preset doses plus slider positions), the reference
// steady state it is compared with, and everything the page draws from them (series, consumer shares, node-keyed fluxes and
// levels for the map). Loaded lazily with the simulator (useModelRun); the page's view code never imports the model.
import { ontologyBindings } from '../../sim/models/index.js'
import { getModel } from '../../sim/models/methylation.js'
import { runScenario, steady } from '../../sim/models/methylation-run.js'
import { concentrationByNode, fluxByNode } from './map-binding.js'
import { scenarioFor } from './methylation-state.js'

export const SERIES_IDS = ['samSahRatio', 'sam', 'sah', 'tHcy', 'mthf', 'gly_p', 'bet_p', 'gly', 'sar', 'bet', 'cho', 'hcy']
export const SHARE_IDS = ['gnmt', 'pemt', 'gamt', 'dnmt', 'nnmt']

const references = new Map()
/** Reference steady state of a variant selection (cached; 10 to 150 ms the first time). */
export function referenceState(variants = {}) {
  const key = JSON.stringify(variants)
  if (!references.has(key)) references.set(key, steady(getModel(variants), {}))
  return references.get(key)
}

const sharesOf = (observables) => {
  const shares = Object.fromEntries(SHARE_IDS.map((id) => [id, observables[`${id}Share`] ?? 0]))
  shares.other = Math.max(0, 1 - SHARE_IDS.reduce((sum, id) => sum + shares[id], 0))
  return shares
}

/** The two structural alternatives for the SAM-consumer split (Reed 2015 vs the whole-body budget), for the share range. */
function shareRange(variants) {
  const other = variants.samConsumerBudget === 'b2budget' ? 'reed2015' : 'b2budget'
  const here = sharesOf(referenceState(variants).observables)
  const there = sharesOf(referenceState({ ...variants, samConsumerBudget: other }).observables)
  return Object.fromEntries(Object.keys(here).map((id) => [id, [Math.min(here[id], there[id]), Math.max(here[id], there[id])]]))
}

/** Index of the sample furthest from the reference SAM:SAH (the last one when nothing moves by more than 0.3%). */
export function focusIndex(ratio, reference) {
  let best = ratio.length - 1
  let deviation = 0.003
  for (let k = 0; k < ratio.length; k += 1) {
    const d = Math.abs(ratio[k] / reference - 1)
    if (d > deviation) { deviation = d; best = k }
  }
  return best
}

/**
 * state: { presetId, controls, variants }. Returns the plain, serialisable result the page draws.
 */
export function runMethylationDash(state) {
  const scenario = scenarioFor(state.presetId, state.controls)
  const run = runScenario(scenario, { variants: state.variants })
  const ref = referenceState(state.variants)
  const refValue = (id) => ref.observables[id] ?? ref.state[id]
  const series = {}
  for (const id of SERIES_IDS) series[id] = run.series[id]
  const reference = Object.fromEntries(SERIES_IDS.map((id) => [id, refValue(id)]))
  const k = focusIndex(run.series.samSahRatio, ref.observables.samSahRatio)

  const fluxesAt = Object.fromEntries(Object.entries(run.fluxes).map(([id, values]) => [id, values[k]]))
  const stateAt = Object.fromEntries(Object.keys(ref.state).map((id) => [id, run.series[id]?.[k]]))
  const observableAt = (id) => run.series[id][k]
  const byReaction = ontologyBindings.byReactionOntology
  const bySpecies = ontologyBindings.bySpeciesOntology

  return {
    ok: run.ok,
    warnings: run.warnings,
    ms: Math.round(run.ms),
    label: scenario.label,
    time: run.time,
    series,
    reference,
    events: run.events.map((event) => ({ x: event.time, label: event.label })),
    stages: run.stages,
    focus: { index: k, time: run.time[k] },
    shares: {
      baseline: sharesOf(ref.observables),
      scenario: sharesOf(Object.fromEntries(SHARE_IDS.map((id) => [`${id}Share`, observableAt(`${id}Share`)]))),
      range: shareRange(state.variants)
    },
    map: {
      baseFlux: fluxByNode(ref.fluxes, byReaction),
      flux: fluxByNode(fluxesAt, byReaction),
      baseConc: concentrationByNode(ref.state, bySpecies),
      conc: concentrationByNode(stateAt, bySpecies)
    }
  }
}

export default runMethylationDash
