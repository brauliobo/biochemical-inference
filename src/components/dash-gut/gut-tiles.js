// Result tiles and chart series of the gut/acid dashboard from a gut-run.js result (pure).
import { GUT_DURATION_H } from './gut-presets.js'

const f1 = (value) => value.toFixed(1)
const sign = (value) => (value > 0 ? '+' : value < 0 ? '-' : '')
const delta = (value, base, unit, digits = 1) => {
  const d = value - base
  return Math.abs(d) < 0.05 * 10 ** -(digits - 1) ? 'same as the standard meal' : [`${sign(d)}${Math.abs(d).toFixed(digits)}`, unit, 'vs the standard meal'].filter(Boolean).join(' ')
}

/** Tiles for ResultTiles: { label, value, unit, delta, tone, note }. */
export function gutTiles(run, controls) {
  const base = run.baseline
  const hypothesis = controls.glycineAcidBoostPct > 0
  const tiles = [
    {
      label: 'Time with stomach pH below 4',
      value: f1(run.hoursBelow4),
      unit: `h of ${GUT_DURATION_H}`,
      delta: delta(run.hoursBelow4, base.hoursBelow4, 'h'),
      tone: '',
      note: 'Measured anchor: a 60% PPI cuts the day from 89% to 35% below pH 4.'
    },
    { label: 'Median pH', value: f1(run.medianPh), unit: '', delta: delta(run.medianPh, base.medianPh, ''), tone: '', note: 'Measured anchor: median pH 4.6 on omeprazole 20 mg.' },
    {
      label: 'Acid secreted',
      value: String(Math.round(run.acidSecretedMmol)),
      unit: 'mmol H+',
      delta: delta(run.acidSecretedMmol, base.acidSecretedMmol, 'mmol', 0),
      tone: hypothesis ? 'warning' : '',
      note: hypothesis ? 'Includes the glycine what-if: a hypothesis.' : 'Basal output 5.1 mmol/h.'
    }
  ]
  tiles.push(run.capsuleAcidMmol > 0
    ? { label: 'Capsule acid', value: f1(run.capsuleAcidMmol), unit: 'mmol H+', delta: `${f1(run.capsuleHoursOfBasal)} h of basal output`, tone: '', note: 'Betaine HCl: 6.51 mmol H+ per gram.' }
    : { label: 'Capsule acid', value: 'none', unit: '', delta: '', tone: '', note: 'Move the betaine HCl slider to add a capsule.' })
  tiles.push(
    { label: 'CO2 formed from acid + bicarbonate', value: String(Math.round(run.co2.formedMl)), unit: 'mL', delta: delta(run.co2.formedMl, base.co2.formedMl, 'mL', 0), tone: '', note: 'Stomach plus duodenum; almost all is absorbed.' },
    {
      label: 'CO2 belched',
      value: run.co2.belchedMl < 10 ? f1(run.co2.belchedMl) : String(Math.round(run.co2.belchedMl)),
      unit: 'mL',
      delta: run.co2.shareOfBelchedGas === null ? 'no gas belched' : `${Math.round(run.co2.shareOfBelchedGas * 100)}% of the belched gas`,
      tone: '',
      note: `Swallowed air: ${Math.round(run.co2.swallowedAirMl)} mL (assumed).`
    }
  )
  return tiles
}

/** pH chart series: this scenario and the standard-meal baseline. */
export function phSeries(run) {
  return [
    { id: 'ph', label: 'This scenario', values: run.ph, look: 0 },
    { id: 'ph-base', label: 'Standard meal, no drug', values: run.baseline.ph, baseline: true }
  ]
}

/** Acid output chart series (mmol/h). */
export function acidSeries(run) {
  return [
    { id: 'acid', label: 'This scenario', values: run.acid, look: 1 },
    { id: 'acid-base', label: 'Standard meal, no drug', values: run.baseline.acid, baseline: true }
  ]
}
