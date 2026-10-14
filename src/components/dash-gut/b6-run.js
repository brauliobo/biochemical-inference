// B6 / PLP sensitivity from the methylation model (lazy: loads the engine, the model, the scenarios and the validation
// targets). The B6 status control `b6Status` is cellular PLP relative to baseline; it scales CBS, CTH, SHMT and the glycine
// cleavage system through f(P) = (P / (K + P)) / (1 / (K + 1)).
import { methylationModel } from '../../sim/models/methylation.js'
import { effect, runScenario, steady } from '../../sim/models/methylation-run.js'
import { scenarioIndex } from '../../sim/scenarios.js'
import { validationIndex } from '../../sim/validation-targets.js'

/** PLP as % of baseline: the grid of the effects chart. */
export const PLP_GRID = Object.freeze([15, 20, 25, 30, 35, 41, 50, 60, 70, 80, 90, 100, 115, 130, 150])
export const MARKERS = Object.freeze([
  { id: 'cysta', label: 'Cystathionine (liver)', unit: 'uM', validation: 'D-b6-cysta', observed: '+52% and +66% when plasma PLP fell from 52.6 to 21.5 nM', article: 'article:gregory-2013-b6-restriction-metabolomics' },
  { id: 'tHcy', label: 'Fasting total homocysteine', unit: 'uM', validation: 'D-b6-thcy', observed: 'unchanged (6.97 uM) in B6 restriction', article: 'article:lamers-2011-b6-restriction-methionine-cycle' },
  { id: 'gly', label: 'Glycine (liver)', unit: 'uM', validation: 'D-b6-glycine', observed: 'plasma glycine +10 to +29%', article: 'article:davis-2005-b6-restriction-homocysteine' }
])
export const STEPS = Object.freeze([
  { id: 'cbs', label: 'CBS (homocysteine to cystathionine)', param: 'kplp_cbs', reaction: 'cbs' },
  { id: 'cth', label: 'CTH (cystathionine to cysteine)', param: 'kplp_cth', reaction: 'cth' },
  { id: 'shmt', label: 'SHMT (serine to glycine)', param: 'kplp_shmt', reaction: 'shmt' },
  { id: 'gcs', label: 'Glycine cleavage system', param: 'kplp_gcs', reaction: 'gcs' }
])

/** Remaining enzyme activity (fraction of baseline) at cellular PLP `p` (1 = baseline) for a half-saturation `k`. */
export const plpActivity = (p, k) => (p / (k + p)) / (1 / (k + 1))

const change = (value, base) => (base ? (value / base - 1) * 100 : 0)
const parameter = (id) => methylationModel.parameters.find((item) => item.id === id)

function stepRows(plp) {
  return STEPS.map((step) => {
    const k = parameter(step.param)
    return { id: step.id, label: step.label, k: k.value, low: k.low, high: k.high, confidence: k.confidence, activity: plpActivity(plp, k.value) }
  })
}

/** Pre-load vs peak tHcy for the methionine load test in a given B6 state (the sensitive clinical test of B6 status). */
function loadIncrement(scenarioId, background) {
  const base = scenarioIndex[scenarioId]
  const run = runScenario(background ? { ...base, background } : base)
  const stage = effect(run, 'tHcy', { from: run.stages[1].start })
  return { before: stage.ref, peak: stage.peak, increment: stage.peak - stage.ref }
}

export function createB6Runner() {
  let cached = null
  const setup = () => {
    const reference = steady(methylationModel, {})
    const sweep = PLP_GRID.map((percent) => {
      const state = steady(methylationModel, { b6Status: percent / 100 })
      return {
        plp: percent,
        cysta: change(state.observables.cysta ?? state.state.cysta, reference.observables.cysta ?? reference.state.cysta),
        tHcy: change(state.observables.tHcy, reference.observables.tHcy),
        gly: change(state.state.gly, reference.state.gly),
        ser: change(state.state.ser, reference.state.ser),
        ratio: change(state.observables.samSahRatio, reference.observables.samSahRatio)
      }
    })
    const load = {
      normal: loadIncrement('methionine-load-test', null),
      restricted: loadIncrement('methionine-load-test-b6', null)
    }
    return { reference, sweep, load }
  }
  return function run(controls) {
    cached ??= setup()
    const { reference, sweep, load } = cached
    const state = steady(methylationModel, { b6Status: controls.plp / 100 })
    const now = {
      cysta: change(state.state.cysta, reference.state.cysta),
      tHcy: change(state.observables.tHcy, reference.observables.tHcy),
      gly: change(state.state.gly, reference.state.gly),
      ser: change(state.state.ser, reference.state.ser),
      ratio: change(state.observables.samSahRatio, reference.observables.samSahRatio)
    }
    const at = (percent) => sweep.find((row) => row.plp === percent)
    const restriction = at(41)
    const rows = MARKERS.map((marker) => {
      const target = validationIndex[marker.validation]
      return {
        ...marker,
        model: restriction[marker.id === 'cysta' ? 'cysta' : marker.id],
        modelAt: 41,
        verdict: target.expectedStatus === 'pass' ? 'matches' : 'disagrees',
        why: target.why ?? '',
        expected: target.expected
      }
    })
    const postload = validationIndex['D-b6-postload']
    rows.push({
      id: 'postload',
      label: 'tHcy rise after a methionine load',
      unit: 'uM',
      observed: 'larger increment in B6 restriction (Ubbink 1996)',
      article: 'article:ubbink-1996-b6-methionine-load',
      validation: 'D-b6-postload',
      model: change(load.restricted.increment, load.normal.increment),
      modelAt: 41,
      verdict: postload.expectedStatus === 'pass' ? 'matches' : 'disagrees',
      why: postload.why ?? '',
      expected: postload.expected
    })
    return { plp: controls.plp, now, sweep, rows, steps: stepRows(controls.plp / 100), load, warnings: [] }
  }
}
