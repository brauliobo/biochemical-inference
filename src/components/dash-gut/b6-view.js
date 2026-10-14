// Presets, tiles, chart series and map inputs of the B6/GABA dashboard (pure; the numbers come from b6-run.js).
import { articlePath } from './causal-view.js'
import { timesUl } from './dose-rows.js'

export const B6_DEFAULTS = Object.freeze({ plp: 100 })
export const B6_PRESETS = Object.freeze([
  Object.freeze({ id: 'normal', label: 'Normal B6 status (100%)', status: 'measured-anchor', controls: { plp: 100 }, note: 'The calibrated reference state.' }),
  Object.freeze({ id: 'restriction', label: 'B6 restriction (41%)', status: 'measured-anchor', controls: { plp: 41 }, note: 'Plasma PLP 52.6 to 21.5 nM in 28 days of restriction (Gregory 2013).' }),
  Object.freeze({ id: 'severe', label: 'Severe deficiency (15%)', status: 'model-prediction', controls: { plp: 15 }, note: 'Outside the data: a model extrapolation.' }),
  Object.freeze({ id: 'high', label: 'Supplemented (150%)', status: 'model-prediction', controls: { plp: 150 }, note: 'Enzymes are close to saturated, so the gain is small.' })
])
export const b6PresetFor = (controls) => B6_PRESETS.find((item) => item.controls.plp === controls.plp)?.id ?? ''

/** The generic PLP-affinity used for the GABA-shunt enzymes (not in the methylation model): the CBS value, ASSUMED. */
export const GENERIC_K = 0.43
/** Steps drawn at 100% for reference: they do not need PLP (SSADH needs NAD+, PDXK ATP, PNPO FMN). */
const REFERENCE_STEPS = ['reaction:aldh5a1-succinate-semialdehyde-oxidation', 'reaction:pdxk-pyridoxal-phosphorylation', 'reaction:pnpo-pnp-oxidation']
export const PLP_STEPS = ['reaction:gad-glutamate-decarboxylation', 'reaction:abat-gaba-transamination']
export const PLP_SUFFIX = Object.freeze({
  'reaction:gad-glutamate-decarboxylation': ' (PLP)',
  'reaction:abat-gaba-transamination': ' (PLP)',
  'enzyme:shmt': ' (PLP)',
  'enzyme:glycine-cleavage-system': ' (PLP)',
  'enzyme:cbs': ' (PLP)'
})

const activity = (p, k) => (p / (k + p)) / (1 / (k + 1))

/** Map flux: remaining activity (% of normal) of the PLP-dependent shunt steps, with PLP-independent steps at 100%. */
export function mapFlux(plpPercent) {
  const value = activity(plpPercent / 100, GENERIC_K) * 100
  return Object.fromEntries([...PLP_STEPS.map((id) => [id, value]), ...REFERENCE_STEPS.map((id) => [id, 100])])
}

export function b6Tiles(run, dose, uls) {
  const pct = (value) => `${value > 0 ? '+' : ''}${value.toFixed(0)}%`
  const efsa = timesUl(dose, uls.efsa)
  const iom = timesUl(dose, uls.iom)
  return [
    { label: 'Cystathionine (liver)', value: pct(run.now.cysta), unit: 'vs normal', delta: '', tone: '', note: 'Rises in B6 deficiency (CTH is the most PLP-sensitive step).' },
    { label: 'Fasting total homocysteine', value: pct(run.now.tHcy), unit: 'vs normal', delta: '', tone: '', note: 'Humans show no change on B6 restriction: the model overshoots.' },
    { label: 'Glycine (liver)', value: pct(run.now.gly), unit: 'vs normal', delta: '', tone: '', note: 'Humans show +10 to +29% in plasma: the model barely moves.' },
    { label: 'Your B6 dose against the EFSA UL (12 mg)', value: efsa.times === null ? 'n/a' : efsa.times.toFixed(1), unit: 'x the UL', delta: efsa.word, tone: efsa.times > 1 ? 'warning' : '', note: 'Critical effect: sensory neuropathy.' },
    { label: 'Your B6 dose against the IOM UL (100 mg)', value: iom.times === null ? 'n/a' : iom.times.toFixed(1), unit: 'x the UL', delta: iom.word, tone: iom.times > 1 ? 'warning' : '', note: 'IOM 1998, set on the same effect.' }
  ]
}

/** LineChartPlus series (% change in liver markers against PLP, % of normal). */
export function effectSeries(run) {
  return {
    x: run.sweep.map((row) => row.plp),
    series: [
      { id: 'cysta', label: 'Cystathionine', values: run.sweep.map((row) => row.cysta), look: 0 },
      { id: 'thcy', label: 'Fasting total homocysteine', values: run.sweep.map((row) => row.tHcy), look: 1 },
      { id: 'gly', label: 'Glycine', values: run.sweep.map((row) => row.gly), look: 2 },
      { id: 'ratio', label: 'SAM:SAH', values: run.sweep.map((row) => row.ratio), look: 3 }
    ]
  }
}

/** Rows of the model-against-data table. */
export function validationRows(run) {
  return run.rows.map((row) => ({
    id: row.id,
    label: row.label,
    model: `${row.model > 0 ? '+' : ''}${row.model.toFixed(0)}%`,
    observed: row.observed,
    verdict: row.verdict === 'matches' ? { word: 'Model matches', tone: 'success' } : { word: 'Model disagrees', tone: 'warning' },
    why: row.why,
    href: articlePath(row.article)
  }))
}

/** Bars of the remaining activity of the modelled PLP steps. */
export function stepBars(run) {
  return run.steps.map((step) => ({
    id: step.id,
    label: step.label,
    percent: Math.round(step.activity * 100),
    fill: `${Math.min(100, Math.round(step.activity * 100))}%`,
    note: `K ${step.k} x PLP (${step.low} to ${step.high}), confidence ${step.confidence}`
  }))
}
