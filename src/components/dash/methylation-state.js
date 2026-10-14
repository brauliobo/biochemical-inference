// What the methylation dashboard lets you change, and how a preset plus slider positions become a scenario for the
// runner. Data and pure functions; the simulator itself is not imported here (only the model's data entry point).
import { methylationModel, scenarioIndex, variants as VARIANTS } from '../../sim/models/index.js'

/** Presets in menu order, with the short row label. */
export const PRESET_LIST = [
  ['baseline-fed', 'Baseline'],
  ['mthfr-677tt', 'MTHFR at 0.4x (677TT-like)'],
  ['b12-deficiency', 'B12 deficiency'],
  ['niacin-500mg', 'Niacin 500 mg per day'],
  ['niacin-2g', 'Niacin 2 g per day'],
  ['glycine-10g', 'Glycine 10 g (single dose)'],
  ['glycine-10g-day', 'Glycine 10 g per day (chronic)'],
  ['betaine-3g', 'Betaine 3 g (single dose)'],
  ['betaine-6g-day', 'Betaine 6 g per day'],
  ['choline-2g', 'Choline 2 g (single dose)'],
  ['pemt-upregulation', 'PEMT up (2x)'],
  ['methionine-meal', 'Methionine meal (1.5 g)'],
  ['glycine-niacin-low-folate', 'Glycine + niacin, low folate']
]
export const presetScenarios = () => PRESET_LIST.map(([id, short]) => ({ ...scenarioIndex[id], short }))
export const DEFAULT_PRESET = 'glycine-10g'

/** The 12 sliders: short label, group, step. Range, default and unit come from the model's own controls. */
const CONTROL_META = [
  ['glycineLoad', 'Glycine, continuous', 'supplements', 0.5], ['cholineIntake', 'Choline, continuous', 'supplements', 50],
  ['betaineIntake', 'Betaine, continuous', 'supplements', 0.25], ['niacinDose', 'Niacin, continuous', 'supplements', 0.1],
  ['folateSupply', 'Folate supply', 'vitamins', 0.05], ['b12Activity', 'B12 (methionine synthase)', 'vitamins', 0.05],
  ['b6Status', 'B6 status (PLP)', 'vitamins', 0.05], ['methionineIntake', 'Methionine intake', 'vitamins', 0.05],
  ['mthfrActivity', 'MTHFR activity', 'enzymes', 0.05], ['gnmtActivity', 'GNMT activity', 'enzymes', 0.05],
  ['bhmtActivity', 'BHMT activity', 'enzymes', 0.05], ['pemtActivity', 'PEMT activity', 'enzymes', 0.05]
]
export const CONTROL_GROUPS = [
  { id: 'supplements', label: 'Supplements (extra per day)' },
  { id: 'vitamins', label: 'Vitamins and diet' },
  { id: 'enzymes', label: 'Enzyme activity' }
]

export function controlSpecs(model = methylationModel) {
  return CONTROL_META.map(([id, short, group, step]) => {
    const control = model.controls.find((candidate) => candidate.id === id)
    return { id, short, group, step, label: control.label, min: control.min, max: control.max, default: control.default, unit: control.unit }
  })
}
export const defaultControls = () => Object.fromEntries(controlSpecs().map((spec) => [spec.id, spec.default]))

/** Slider positions that reproduce a preset: defaults, then its background, then its intervention stage. */
export function controlsForPreset(presetId) {
  const preset = scenarioIndex[presetId]
  if (!preset) throw new Error(`Unknown preset "${presetId}"`)
  const last = preset.stages.at(-1)
  return { ...defaultControls(), ...(preset.background ?? {}), ...(preset.stages.length > 1 ? (last.controls ?? {}) : {}) }
}

/** Variant switches a preset starts with (its own selection over the defaults). */
export function variantsForPreset(presetId) {
  const preset = scenarioIndex[presetId]
  return Object.fromEntries(Object.entries(VARIANTS).map(([key, variant]) => [key, preset?.variants?.[key] ?? variant.default]))
}

/** True when every slider is where the preset puts it. */
export function matchesPreset(presetId, controls) {
  const wanted = controlsForPreset(presetId)
  return Object.keys(wanted).every((id) => Math.abs((controls[id] ?? wanted[id]) - wanted[id]) < 1e-9)
}

const BASELINE_HOURS = 8
const INTERVENTION_HOURS = 64

/**
 * Scenario for the runner: the preset's doses (events) and background, a baseline stage, and an intervention stage whose
 * controls are the sliders that differ from the background (or from the model default).
 */
export function scenarioFor(presetId, controls, specs = controlSpecs()) {
  const preset = scenarioIndex[presetId]
  if (!preset) throw new Error(`Unknown preset "${presetId}"`)
  const background = preset.background ?? {}
  const multi = preset.stages.length > 1
  const last = preset.stages.at(-1)
  const changed = {}
  for (const spec of specs) {
    const reference = background[spec.id] ?? spec.default
    const value = controls[spec.id]
    if (Number.isFinite(value) && Math.abs(value - reference) > 1e-9) changed[spec.id] = value
  }
  return {
    id: preset.id, label: preset.label, background, variants: preset.variants,
    stages: [
      multi ? preset.stages[0] : { label: 'baseline', hours: BASELINE_HOURS },
      { label: multi ? last.label : 'scenario', hours: multi ? last.hours : INTERVENTION_HOURS, ...(multi && last.events ? { events: last.events } : {}), controls: changed }
    ]
  }
}

/** Variant switch rows for the UI: key, label and the options with their labels. */
export const variantSwitches = () => Object.entries(VARIANTS).map(([key, variant]) => ({
  key, label: variant.label, default: variant.default,
  options: Object.entries(variant.options).map(([value, option]) => ({ value, label: option.label }))
}))
