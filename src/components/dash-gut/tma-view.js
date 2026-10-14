// Presets, tiles, series and map inputs of the choline / TMA / TMAO dashboard (pure; numbers from tma-model.js and the
// calculators in src/sim/calculators.js).
import { cholineCoverageOfDeficit, cholineForGlycine } from '../../sim/calculators.js'
import { TMA_YIELD, doseResponse, intakeWords, tmaOutput } from './tma-model.js'

export const CLAIM = Object.freeze({ lowG: 28, highG: 35 }) // "28-35 g of choline for 10 g of glycine" (claim:choline-28-35g-for-10g-glycine)
export const UL_MG = 3500
export const DOSE_MAX_MG = 40000

export const TMA_PRESETS = Object.freeze([
  Object.freeze({ id: 'diet', label: 'Typical diet (330 mg)', status: 'recorded', mg: 330, note: 'About 3.2 mmol a day (2.8 to 4.5).' }),
  Object.freeze({ id: 'supplement', label: 'Supplement, 1 g', status: 'recorded', mg: 1000, note: 'Choline bitartrate supplements give 250 to 1000 mg of choline.' }),
  Object.freeze({ id: 'ul', label: 'At the IOM upper limit (3.5 g)', status: 'recorded', mg: 3500, note: 'Set on hypotension, with fishy odour as the secondary effect. EFSA set none.' }),
  Object.freeze({ id: 'claim-low', label: 'The claim, low (28 g)', status: 'hypothesis', mg: 28000, note: 'The quoted need for 10 g of glycine.' }),
  Object.freeze({ id: 'claim-high', label: 'The claim, high (35 g)', status: 'hypothesis', mg: 35000, note: 'Eight to ten times the IOM UL.' })
])
export const tmaPresetFor = (mg) => TMA_PRESETS.find((item) => item.mg === mg)?.id ?? ''

/** Tiles: intake against the UL, TMA + TMAO output, the glycine this could make, and the share of the glycine "deficit" covered. */
export function tmaTiles(mg, conversion) {
  const g = mg / 1000
  const words = intakeWords(mg)
  const bolus = tmaOutput(g, TMA_YIELD.bolus.value)
  const diet = tmaOutput(g, TMA_YIELD.habitual.value)
  const glycine = (g / 104.17) * 75.07 * conversion
  const coverage = cholineCoverageOfDeficit({ conversion })
  return [
    { label: 'Choline intake', value: g.toFixed(g < 10 ? 2 : 1), unit: 'g a day', delta: words.word, tone: words.code === 'within' ? '' : 'warning', note: 'IOM UL 3.5 g; EFSA set no upper limit.' },
    { label: 'TMA + TMAO if the bolus yield held', value: bolus.toFixed(bolus < 10 ? 1 : 0), unit: 'mmol a day', delta: `${diet.toFixed(diet < 10 ? 1 : 0)} mmol with the assumed diet yield`, tone: '', note: `Yield 63% (32 to 100%) from one 15 mmol free-choline bolus; scaled linearly: an assumption.` },
    { label: 'Glycine this choline could make', value: glycine.toFixed(glycine < 10 ? 2 : 1), unit: 'g a day', delta: `at ${Math.round(conversion * 100)}% conversion`, tone: '', note: 'Choline to betaine to glycine is real, but the conversion share is uncertain.' },
    { label: 'Share of the glycine "deficit" choline within the UL could cover', value: `${Math.round(coverage.value * 100)}%`, unit: '', delta: `range ${Math.round(coverage.low * 100)} to ${Math.round(coverage.high * 100)}%`, tone: '', note: 'Against a 10 g a day estimate that has no direct test.' }
  ]
}

/** The claim in numbers: choline for 10 g of glycine at the chosen conversion, against the UL. */
export function claimNumbers(conversion, glycineG = 10) {
  const need = cholineForGlycine({ glycineG, conversion })
  return { needG: need.value, ceilingG: cholineForGlycine({ glycineG, conversion: 1 }).value, ulMultiple: need.ulMultiple, alternatives: need.alternatives }
}

export function responseView(maxG = DOSE_MAX_MG / 1000, step = 1) {
  const grid = Array.from({ length: Math.round(maxG / step) + 1 }, (_, i) => i * step)
  const data = doseResponse(grid)
  return {
    x: data.x,
    series: data.series.map((item, index) => ({ id: item.id, label: item.label, values: item.values, lower: item.lower, upper: item.upper, lowerLabel: 'low yield', upperLabel: 'high yield', look: index === 0 ? 0 : 2 })),
    events: [{ x: 3.5, label: 'IOM UL' }, { x: CLAIM.lowG, label: 'Claim 28 g' }, { x: CLAIM.highG, label: '35 g' }]
  }
}

/** The covered / uncovered split of the glycine deficit (StackedBar items). */
export function coverageBars(conversion) {
  const coverage = cholineCoverageOfDeficit({ conversion })
  const bar = coverage.stackedBar
  return [{
    id: 'deficit',
    label: 'Glycine deficit estimate',
    items: bar.items.map((item, index) => ({ id: index === 0 ? 'covered' : 'uncovered', label: item.label, value: Math.round(item.value * 100) / 100, low: Math.round(item.low * 100) / 100, high: Math.round(item.high * 100) / 100 }))
  }]
}

/** Map flux (mmol a day): TMA made by CutC and oxidised by FMO3 at the chosen intake (bolus yield, working FMO3). */
export function mapFlux(mg) {
  const tma = tmaOutput(mg / 1000, TMA_YIELD.bolus.value)
  return { 'reaction:choline-tma-lyase': tma, 'reaction:fmo3-tma-n-oxidation': tma }
}
