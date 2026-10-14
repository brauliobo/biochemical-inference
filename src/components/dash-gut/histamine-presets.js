// Light data for the histamine/night dashboard (no engine): default controls, preset SAM situations and the links
// to the methylation model scenarios. The values mirror the histamine model's reference state (SAM 60 uM, SAH 12 uM).

export const SAM_REF_UM = 60
export const SAH_REF_UM = 12

export const HISTAMINE_DEFAULTS = Object.freeze({
  samUM: SAM_REF_UM,
  sahUM: SAH_REF_UM,
  hnmtX: 1, // HNMT activity relative to normal
  daoX: 1, // gut DAO activity
  releaseX: 1, // mast-cell release relative to normal
  diurnal: false // WEAK evidence: plasma histamine about 2x higher at 04:00 than at 16:00 in one study
})

/** Dashboard controls -> histamine model controls. */
export function toHistamineControls(c) {
  return {
    samUM: c.samUM,
    sahUM: c.sahUM,
    hnmtActivityX: c.hnmtX,
    daoActivityX: c.daoX,
    releaseX: c.releaseX,
    diurnalAmplitude: c.diurnal ? 0.42 : 0
  }
}

const preset = (id, label, controls, note, status = 'model-prediction') => ({ id, label, status, controls: { ...HISTAMINE_DEFAULTS, ...controls }, note })

/** Direct presets: the controls are known now. */
export const HISTAMINE_PRESETS = Object.freeze([
  preset('reference', 'Reference (SAM 60, SAH 12 uM)', {}, 'Calibration state of the model.', 'measured-anchor'),
  preset('low-sam', 'SAM halved (30 uM)', { samUM: 30 }, 'SAM:SAH 5 to 2.5.'),
  preset('very-low-sam', 'SAM very low (10 uM)', { samUM: 10 }, 'Extreme end of the range.'),
  preset('high-sah', 'SAH doubled, SAM halved', { samUM: 30, sahUM: 24 }, 'The ratio matters more than SAM alone.'),
  preset('hnmt-half', 'HNMT at half activity', { hnmtX: 0.5 }, 'A lower-activity HNMT variant.'),
  preset('dao-blocked', 'Gut DAO blocked', { daoX: 0 }, 'DAO inhibitors or a deficiency.')
])

/**
 * Presets that take SAM and SAH from the methylation model: `scenario` is a scenario id of src/sim/scenarios.js, resolved
 * on demand by methylation-link.js. Their evidence status is the scenario's own (glycine and niacin are hypotheses).
 */
export const METHYLATION_LINKS = Object.freeze([
  { id: 'm-glycine-10g-day', scenario: 'glycine-10g-day', label: 'Methylation model: glycine 10 g/day' },
  { id: 'm-niacin-2g', scenario: 'niacin-2g', label: 'Methylation model: niacin 2 g/day' },
  { id: 'm-glycine-niacin-low-folate', scenario: 'glycine-niacin-low-folate', label: 'Methylation model: glycine + niacin, low folate' },
  { id: 'm-mthfr', scenario: 'mthfr-677tt-low-folate', label: 'Methylation model: MTHFR 677TT-like, low folate' },
  { id: 'm-betaine', scenario: 'betaine-6g-day', label: 'Methylation model: betaine 6 g/day' }
])

export const SAM_LIMITS = Object.freeze({ min: 1, max: 150 })
export const SAH_LIMITS = Object.freeze({ min: 0, max: 60 })
