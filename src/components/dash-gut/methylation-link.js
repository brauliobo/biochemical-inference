// SAM and SAH from a methylation-model scenario, to drive the histamine model (lazy: loads the methylation model).
//
// The histamine model works in tissue concentrations (SAM 60 uM, SAH 12 uM: rat-liver scale), the methylation model in
// the Reed hepatic liver scale (SAM 24 uM, SAH 3.9 uM). The two are therefore linked by RATIOS to the reference state:
// histamine SAM = 60 x (SAM in the scenario / SAM at baseline), the same for SAH. Chronic scenarios only (steady state of
// the scenario's controls); single doses are transients and would need a time-varying link.
import { methylationModel } from '../../sim/models/methylation.js'
import { steady } from '../../sim/models/methylation-run.js'
import { scenarioIndex } from '../../sim/scenarios.js'
import { SAH_LIMITS, SAH_REF_UM, SAM_LIMITS, SAM_REF_UM } from './histamine-presets.js'

const clamp = (value, { min, max }) => Math.min(max, Math.max(min, value))

/** The controls a chronic scenario holds at its end: its background plus the controls of its last stage. */
export function chronicControls(scenario) {
  const stages = scenario.stages ?? []
  return { ...(scenario.background ?? {}), ...(stages.length ? stages[stages.length - 1].controls ?? {} : {}) }
}

let reference = null
const cache = new Map()

/**
 * { sam, sah, relSam, relSah, ratio, ratio0, status, summary, label } for a scenario id; `sam` and `sah` are the
 * histamine-model values (uM), clamped to the sliders' ranges.
 */
export function methylationSamSah(scenarioId) {
  if (cache.has(scenarioId)) return cache.get(scenarioId)
  const scenario = scenarioIndex[scenarioId]
  if (!scenario) throw new Error(`Unknown methylation scenario "${scenarioId}"`)
  reference ??= steady(methylationModel, {})
  const state = steady(methylationModel, chronicControls(scenario))
  const relSam = state.state.sam / reference.state.sam
  const relSah = state.state.sah / reference.state.sah
  const result = {
    scenario: scenarioId,
    label: scenario.label,
    sam: clamp(SAM_REF_UM * relSam, SAM_LIMITS),
    sah: clamp(SAH_REF_UM * relSah, SAH_LIMITS),
    relSam,
    relSah,
    ratio: state.state.sam / state.state.sah,
    ratio0: reference.state.sam / reference.state.sah,
    status: scenario.evidence?.status ?? 'hypothesis',
    summary: scenario.evidence?.summary ?? ''
  }
  cache.set(scenarioId, result)
  return result
}
