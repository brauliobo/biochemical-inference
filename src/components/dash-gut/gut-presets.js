// Light data for the gut/acid dashboard (no engine, no model): the default controls, the preset scenarios and the
// evidence chips. Mirrors gastricScenarios in src/sim/models/gastric.js (a unit test keeps the two in step) so the
// page can draw its controls before the model chunk has loaded.
import { withEvidence } from './preset-evidence.js'

/** Dashboard controls (what the page's sliders hold). `toModelControls` maps them to the gastric model's controls. */
export const GUT_DEFAULTS = Object.freeze({
  ppi: 0, // % of proton pumps inhibited
  meal: true, // a 400 mL meal at hour 1
  bicarbonateMg: 0,
  betaineHclG: 0,
  alginate: false, // 20 mL alginate-carbonate antacid
  airSwallowX: 1,
  glycineAcidBoostPct: 0 // HYPOTHESIS: no human data
})

export const GUT_DURATION_H = 8
export const MEAL_ML = 400
export const ALGINATE_ML = 20

/** The gastric model controls for the dashboard controls. */
export function toModelControls(c) {
  return {
    mealMl: c.meal ? MEAL_ML : 0,
    ppiInhibitionPct: c.ppi,
    bicarbonateMg: c.bicarbonateMg,
    betaineHclG: c.betaineHclG,
    alginateMl: c.alginate ? ALGINATE_ML : 0,
    airSwallowX: c.airSwallowX,
    glycineAcidBoostPct: c.glycineAcidBoostPct
  }
}

const preset = (id, label, status, controls, note) => ({ id, label, status, controls: { ...GUT_DEFAULTS, ...controls }, note })

/** `status` follows the gastric scenarios: measured-anchor, model-prediction, hypothesis. */
export const GUT_PRESETS = withEvidence([
  preset('meal', 'Standard meal', 'measured-anchor', {}, 'Meal pH peak 5-7, back to acid within 2 h (Dressman).'),
  preset('fasting', 'Fasting', 'measured-anchor', { meal: false }, 'Fasting pH 1.7, basal output 5.1 mmol/h.'),
  preset('ppi-60', 'PPI, 60% of pumps blocked', 'measured-anchor', { ppi: 60 }, 'Omeprazole 20 mg: median pH 4.6, acid down 60%.'),
  preset('bhcl-650', 'Betaine HCl 650 mg with the meal', 'model-prediction', { betaineHclG: 0.65 }, '4.2 mmol H+, about 0.8 h of basal output.'),
  preset('bhcl-3250-ppi', 'Betaine HCl 3.25 g under a PPI', 'model-prediction', { betaineHclG: 3.25, ppi: 60 }, 'Capsule acid escapes the luminal feedback.'),
  preset('nahco3-500', 'Sodium bicarbonate 500 mg, fasting', 'measured-anchor', { bicarbonateMg: 500, meal: false }, 'PCO2 63 to 144 mmHg (Kolkman).'),
  preset('alginate-20', 'Alginate-carbonate antacid 20 mL', 'model-prediction', { alginate: true }, 'The raft that traps gas is not modelled.'),
  preset('glycine-acid-70', 'What-if: glycine adds 70% more acid', 'hypothesis', { glycineAcidBoostPct: 70 }, 'No human data for the size; Wald 1982 gave 5.6 vs 3.3 mmol/h.')
])

export const presetById = Object.freeze(Object.fromEntries(GUT_PRESETS.map((item) => [item.id, item])))

/** The preset a set of controls equals, or '' (the dashboard shows "Custom"). */
export function presetFor(controls) {
  const keys = Object.keys(GUT_DEFAULTS)
  return GUT_PRESETS.find((item) => keys.every((key) => item.controls[key] === controls[key]))?.id ?? ''
}

export const STATUS_WORD = Object.freeze({
  'measured-anchor': { word: 'Reproduces a measurement', tone: 'success' },
  'model-prediction': { word: 'Model prediction', tone: 'info' },
  hypothesis: { word: 'Hypothesis', tone: 'warning' },
  recorded: { word: 'From recorded data', tone: 'success' }
})

/** Human data on the glycine -> acid hypothesis, shown beside its slider. `article` ids exist in the knowledge base. */
export const GLYCINE_ACID_EVIDENCE = Object.freeze([
  { article: 'article:wald-1982-glycine-gastric-acid', label: 'Wald 1982: glycine 100 mM in the stomach, acid 5.6 vs 3.3 mmol/h, gastrin unchanged' },
  { article: 'article:taylor-1982-amino-acids-gastric-acid', label: 'Taylor 1982: glycine is not a gastrin stimulant' },
  { article: 'article:mcarthur-1983-iv-amino-acids-gastric-acid', label: 'McArthur 1983: intravenous glycine hardly stimulates acid' }
])
