// The gastric model run for the gut/acid dashboard. Loaded lazily (it pulls in the simulation engine and the
// gastric model); the page itself only imports gut-presets.js.
//
//   const run = await import('./gut-run.js')
//   const runner = run.createGutRunner()        // compiles the model once, caches the baseline
//   const result = runner(controls)             // ~0.3-0.5 s: pure data for the charts and tiles
import { compileModel, simulate } from '../../sim/index.js'
import { analyzeGastric, gastricModel, gastricSimOptions } from '../../sim/models/gastric.js'
import { GUT_DEFAULTS, GUT_DURATION_H, toModelControls } from './gut-presets.js'

const VM = 25.45 // mL of CO2 per mmol at 37 C (the model's ideal-gas volume)
const SAMPLES = 161 // 0.05 h
export const BASAL_ACID_MMOL_PER_H = 5.1 // b2:gastric-bao

const last = (array) => array[array.length - 1]
const ml = (mmol) => mmol * VM

/** Time average (trapezoid) of a sampled series. */
export function timeMean(time, values) {
  let area = 0
  for (let i = 1; i < time.length; i += 1) area += ((values[i] + values[i - 1]) / 2) * (time[i] - time[i - 1])
  const span = last(time) - time[0]
  return span > 0 ? area / span : values[0]
}

export function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

/**
 * Where the CO2 formed from H+ + HCO3- goes, in mL at 37 C, from a simulate() result of the gastric model.
 * Every term is a tally species of the model, so the parts add up to `formedMl` (tested).
 */
export function co2Budget(run) {
  const f = (id) => last(run.series[id])
  const absorbed = f('CO2_abs_s') - f('CO2_blood') + f('CO2_abs_d')
  const carried = f('CO2_dist')
  const held = f('CO2d') + f('CO2g') + f('CO2dd')
  const passed = f('CO2_pass')
  const belched = f('CO2_belch')
  const airBelched = f('Air_belch')
  const airPassed = f('Air_pass')
  const airHeld = f('Air')
  const co2Gas = belched + passed + f('CO2g')
  return {
    formedMl: ml(absorbed + carried + held + passed + belched),
    absorbedMl: ml(absorbed),
    carriedMl: ml(carried),
    heldMl: ml(held),
    passedMl: ml(passed),
    belchedMl: ml(belched),
    airBelchedMl: ml(airBelched),
    airPassedMl: ml(airPassed),
    airHeldMl: ml(airHeld),
    swallowedAirMl: ml(f('Air_in')),
    co2GasMl: ml(co2Gas),
    shareOfBelchedGas: belched + airBelched > 1e-12 ? belched / (belched + airBelched) : null,
    shareOfFormed: belched / Math.max(absorbed + carried + held + passed + belched, 1e-12)
  }
}

/** Marker rows for the pH chart: the meal, the capsule, the antacid. */
export function eventMarkers(controls) {
  const markers = []
  const antacid = [controls.bicarbonateMg > 0 && 'sodium bicarbonate', controls.alginate && 'alginate antacid'].filter(Boolean)
  if (antacid.length) markers.push({ x: 0.5, label: antacid.join(' + ').replace(/^./, (c) => c.toUpperCase()) })
  const hour1 = [controls.meal && 'Meal', controls.betaineHclG > 0 && 'Betaine HCl'].filter(Boolean)
  if (hour1.length) markers.push({ x: 1, label: hour1.join(' + ') })
  return markers
}

function summarise(run, controls) {
  const a = analyzeGastric(run)
  const mean = (id) => timeMean(run.time, run.fluxes[id])
  const meanSeries = (values) => timeMean(run.time, values)
  const conc = (id) => run.series[id].map((value, i) => (run.series.V[i] > 0 ? (value / run.series.V[i]) * 1000 : 0)) // mmol/mL -> mM
  const capsule = a.capsuleAcidMmol
  const budget = co2Budget(run)
  return {
    time: run.time,
    ph: a.ph,
    acid: a.acidOutputMmolPerH,
    hoursBelow4: a.hoursBelow4,
    medianPh: median(a.ph),
    phMax: a.phMax,
    acidSecretedMmol: a.acidSecretedMmol,
    capsuleAcidMmol: capsule,
    capsuleHoursOfBasal: capsule / BASAL_ACID_MMOL_PER_H,
    co2: budget,
    markers: eventMarkers(controls),
    // MetabolicMap inputs: mean rates (mmol/h) and mean luminal concentrations (mM)
    flux: {
      'reaction:gastric-hcl-secretion': mean('sec_basal') + mean('sec_stim'),
      'reaction:h-k-atpase-proton-pumping': mean('sec_basal') + mean('sec_stim'),
      'reaction:carbonic-anhydrase-bicarbonate-dehydration': mean('co2_form') - mean('co2_dehydr') + mean('duo_neut')
    },
    concentration: {
      'compound:proton': meanSeries(conc('H')),
      'compound:bicarbonate': meanSeries(conc('HCO3')),
      'compound:carbon-dioxide': meanSeries(conc('CO2d'))
    },
    warnings: run.warnings ?? [],
    ok: run.ok
  }
}

/** A function from dashboard controls to chart-ready results; compiles once and caches the baseline run. */
export function createGutRunner() {
  const compiled = compileModel(gastricModel)
  const execute = (controls) => simulate(compiled, { controls: toModelControls(controls), duration: GUT_DURATION_H, samples: SAMPLES, ...gastricSimOptions })
  let baseline = null
  return function run(controls) {
    baseline ??= summarise(execute(GUT_DEFAULTS), GUT_DEFAULTS)
    const isBaseline = Object.keys(GUT_DEFAULTS).every((key) => controls[key] === GUT_DEFAULTS[key])
    const own = isBaseline ? baseline : summarise(execute(controls), controls)
    return { ...own, baseline }
  }
}

export { GUT_DEFAULTS }
