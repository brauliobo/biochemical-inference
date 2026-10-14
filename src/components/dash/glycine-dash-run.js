// Runner of the glycine dashboard (lazy, with the simulator): the oral plasma kinetics sketch for a dose and the
// methylation model's response to the same dose. The kinetics sketch is a second-hand single-study fit (weak); the
// SAM:SAH response is a hypothesis (no human SAM or SAH data after glycine).
import { compileModel, simulate } from '../../sim/index.js'
import { glycinePkModel } from '../../sim/models/pk.js'
import { runScenario } from '../../sim/models/methylation-run.js'
import { doseScenario } from './glycine-model.js'
import { referenceState } from './methylation-dash-run.js'

export const BODY_KG = 70
export { doseScenario }
const pk = compileModel(glycinePkModel)

const peak = (values, time) => values.reduce((best, v, k) => (v > best.value ? { value: v, time: time[k] } : best), { value: -Infinity, time: 0 })

export function runGlycineDash({ doseG, variants }) {
  const kinetics = simulate(pk, { controls: { doseGPerKg: doseG / BODY_KG }, duration: 8, samples: 161 })
  const run = runScenario(doseScenario(doseG), { variants })
  const ref = referenceState(variants)
  const series = (id) => run.series[id]
  return {
    ok: run.ok && kinetics.ok,
    warnings: [...run.warnings, ...kinetics.warnings],
    pk: { time: kinetics.time, plasma: kinetics.series.plasma, baseline: kinetics.series.plasma[0],peak: peak(kinetics.series.plasma, kinetics.time) },
    time: run.time,
    series: { samSahRatio: series('samSahRatio'), sam: series('sam'), gly: series('gly'), sar: series('sar'), gnmt: run.fluxes.gnmt },
    reference: { samSahRatio: ref.observables.samSahRatio, sam: ref.state.sam, gly: ref.state.gly, sar: ref.state.sar, gnmt: ref.fluxes.gnmt },
    events: run.events.map((event) => ({ x: event.time, label: event.label }))
  }
}

export default runGlycineDash
