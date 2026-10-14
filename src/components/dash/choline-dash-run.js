// Runner of the choline and betaine dashboard (lazy, with the simulator): the methylation model under a continuous choline
// and betaine intake (map, tiles), the plasma tHcy under both BHMT betaine constants, and the single-dose plasma kinetics
// sketches of betaine (measured, one study) and choline (illustrative).
import { compileModel, simulate } from '../../sim/index.js'
import { betainePkModel, cholinePkModel } from '../../sim/models/pk.js'
import { controlsForPreset } from './methylation-state.js'
import { runMethylationDash } from './methylation-dash-run.js'

const betainePk = compileModel(betainePkModel)
const cholinePk = compileModel(cholinePkModel)
const BODY_KG = 70

export function runCholineDash({ cholineMg, betaineG, variants }) {
  const controls = { ...controlsForPreset('baseline-fed'), cholineIntake: cholineMg, betaineIntake: betaineG }
  const main = runMethylationDash({ presetId: 'baseline-fed', controls, variants })
  const thcy = {}
  for (const km of ['reed100', 'human2200']) {
    thcy[km] = km === variants.bhmtBetaineKm ? main.series.tHcy : runMethylationDash({ presetId: 'baseline-fed', controls, variants: { ...variants, bhmtBetaineKm: km } }).series.tHcy
  }
  const betaine = simulate(betainePk, { controls: { doseMgPerKg: (betaineG * 1000) / BODY_KG }, duration: 24, samples: 121 })
  const choline = simulate(cholinePk, { controls: { doseMgCholine: cholineMg }, duration: 24, samples: 121 })
  return {
    ...main,
    ok: main.ok && betaine.ok && choline.ok,
    thcyByKm: thcy,
    pk: { time: betaine.time, betaine: betaine.series.plasma, betaineBase: betaine.series.plasma[0], choline: choline.series.cholinePlasma, cholineBetaine: choline.series.betainePlasma, cholineBase: choline.series.cholinePlasma[0], cholineBetaineBase: choline.series.betainePlasma[0] }
  }
}

export default runCholineDash
