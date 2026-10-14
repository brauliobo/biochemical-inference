// Presets, tiles, bars and series of the bile-acid dashboard (pure; numbers from bile-run.js and bile-model.js).
import { BAAT_SETS, GLYCINE_SHARE, GROSS_GLYCINE_MMOL_PER_DAY, glycineGrams, impliedGlyTau, rateCoefficient } from './bile-model.js'

export const BILE_DEFAULTS = Object.freeze({ glycineG: 10, taurineX: 1 })
export const BILE_PRESETS = Object.freeze([
  Object.freeze({ id: 'none', label: 'No supplement', status: 'measured-anchor', controls: { glycineG: 0, taurineX: 1 }, note: 'Observed bile: about 75% glycine conjugates, 3 : 1.' }),
  Object.freeze({ id: 'glycine-10', label: 'Glycine 10 g a day', status: 'hypothesis', controls: { glycineG: 10, taurineX: 1 }, note: 'No human data on glycine supplements and bile conjugation.' }),
  Object.freeze({ id: 'glycine-20', label: 'Glycine 20 g a day', status: 'hypothesis', controls: { glycineG: 20, taurineX: 1 }, note: 'Far above any studied dose; shape only.' }),
  Object.freeze({ id: 'taurine-3', label: 'Taurine supply x3', status: 'model-prediction', controls: { glycineG: 0, taurineX: 3 }, note: 'Taurine 3 g a day reversed the ratio in 6 men (Hardison 1983); the size of the hepatic change is not known.' })
])
export const bilePresetFor = (controls) => BILE_PRESETS.find((item) => item.controls.glycineG === controls.glycineG && item.controls.taurineX === controls.taurineX)?.id ?? ''

const pct = (value) => `${Math.round(value * 100)}%`

export function bileTiles(run, controls) {
  const base = GLYCINE_SHARE.value
  const d = (run.share - base) * 100
  return [
    { label: 'Glycine-conjugated bile acids', value: pct(run.share), unit: 'of conjugates', delta: Math.abs(d) < 0.5 ? 'same as observed bile (75%)' : `${d > 0 ? '+' : '-'}${Math.abs(d).toFixed(0)} points vs observed bile`, tone: controls.glycineG > 0 ? 'warning' : '', note: 'Calibrated to the observed 70 to 80%; only the change is modelled.' },
    { label: 'Glycine to taurine in bile', value: run.ratio.replace(' glycine to taurine', ''), unit: '', delta: 'observed about 3 : 1', tone: '', note: 'Competing substrates of one enzyme (BAAT).' },
    { label: 'Liver glycine against baseline', value: `${run.glyX.toFixed(2)}x`, unit: '', delta: controls.glycineG > 0 ? `at ${controls.glycineG} g a day extra` : 'no supplement', tone: '', note: 'From the methylation model (hepatic glycine pool).' },
    { label: 'Glycine used for bile conjugation', value: run.grossGlycineG.toFixed(2), unit: 'g a day', delta: controls.glycineG > 0 ? `${((run.grossGlycineG / controls.glycineG) * 100).toFixed(1)}% of a ${controls.glycineG} g dose` : '6 mmol a day (Hepner 1972)', tone: '', note: 'A small sink next to a 10 g supplement.' }
  ]
}

/** Observed bile against the what-if, as shares. */
export function shareBars(run) {
  const share = GLYCINE_SHARE
  return [
    { id: 'observed', label: 'Observed bile', items: [
      { id: 'glycine', label: 'Glycine conjugates', value: share.value * 100, low: share.low * 100, high: share.high * 100 },
      { id: 'taurine', label: 'Taurine conjugates', value: (1 - share.value) * 100, low: (1 - share.high) * 100, high: (1 - share.low) * 100 }
    ] },
    { id: 'whatif', label: 'What-if', items: [
      { id: 'glycine', label: 'Glycine conjugates', value: Math.round(run.share * 1000) / 10 },
      { id: 'taurine', label: 'Taurine conjugates', value: Math.round((1 - run.share) * 1000) / 10 }
    ] }
  ]
}

/** Share (%) against the glycine supplement for each taurine setting. */
export function curveSeries(run, controls) {
  return {
    x: run.grid,
    series: run.curves.map((curve, index) => ({
      id: `tau-${curve.tauX}`,
      label: curve.tauX === 1 ? 'Taurine as now' : `Taurine supply x${curve.tauX}`,
      values: curve.values,
      look: curve.tauX === controls.taurineX ? 0 : index + 1
    })),
    events: controls.glycineG > 0 ? [{ x: controls.glycineG, label: `${controls.glycineG} g` }] : []
  }
}

/** Flux of the two BAAT reactions (mmol/day) and the activation step. */
export function bileFlux(run) {
  return {
    'reaction:bacs-cholate-coa-ligation': run.rates.total,
    'reaction:baat-glycine-conjugation': run.rates.glycine,
    'reaction:baat-taurine-conjugation': run.rates.taurine
  }
}

/** Rows of the table of enzyme constants. */
export function kineticRows() {
  return BAAT_SETS.map((set) => ({
    id: set.id,
    label: set.label,
    km: `glycine ${set.kmGly} mM, taurine ${set.kmTau} mM`,
    coefficient: rateCoefficient(set).toFixed(2),
    needs: impliedGlyTau(set).toFixed(0),
    article: set.article
  }))
}

export const GROSS = Object.freeze({ mmol: GROSS_GLYCINE_MMOL_PER_DAY.value, grams: glycineGrams(GROSS_GLYCINE_MMOL_PER_DAY.value) })
