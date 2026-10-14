// Bile-acid conjugation what-if (pure). BAAT joins choloyl-CoA to glycine or to taurine; the two amino acids compete for
// one enzyme, so in the linear regime (both well below their Km) the ratio of the two conjugation rates is
//     r = (Vg / Kg x Gly) / (Vt / Kt x Tau) = c x Gly / Tau.
// Human hepatic glycine and taurine pools were not found (docs/SIM_PARAMETERS_B2.md), so the absolute ratio cannot be
// predicted from the kinetics. The what-if is therefore CALIBRATED to the observed bile (about 75% glycine conjugates,
// 3 : 1) and only the CHANGE with the glycine and taurine supply is computed. There is no human data on glycine
// supplements; taurine 3 g/day for two weeks reversed the ratio in 6 men (Hardison 1983), so the sign of the taurine
// effect is measured and its size is not.
//
// Constants mirror src/sim/data/parameters-b2.js (baat-km-glycine, baat-km-taurine, bile-glycine-conjugate-fraction,
// glycine-bile-conjugation-gross-mmol-day); tests/unit/dash-b-bile-model.test.js compares them with that file.

/** Kinetic sets: Vmax in nmol/min/mg, Km in mM. */
export const BAAT_SETS = Object.freeze([
  Object.freeze({ id: 'johnson-1991', label: 'Johnson 1991 (purified human liver)', article: 'article:johnson-1991-baat-human-liver', vmaxGly: 770, vmaxTau: 330, kmGly: 5.8, kmTau: 1.1 }),
  Object.freeze({ id: 'styles-2016', label: 'Styles 2016 (recombinant human)', article: 'article:styles-2016-baat-recombinant', vmaxGly: 8.69, vmaxTau: 21.7, kmGly: 3.95, kmTau: 1.86 })
])

export const GLYCINE_SHARE = Object.freeze({ value: 0.75, low: 0.7, high: 0.8, article: 'article:chiang-2013-bile-acid-metabolism-signaling', paramId: 'bile-glycine-conjugate-fraction' })
export const GROSS_GLYCINE_MMOL_PER_DAY = Object.freeze({ value: 6, article: 'article:hepner-1972-glycine-conjugated-dihydroxy-bile-acids', paramId: 'glycine-bile-conjugation-gross-mmol-day' })
export const GLYCINE_MOLAR_MASS = 75.07

/** c of r = c x Gly / Tau for a kinetic set. */
export const rateCoefficient = (set) => (set.vmaxGly / set.kmGly) / (set.vmaxTau / set.kmTau)

/** Hepatic Gly/Tau the set would need to give the observed share. */
export function impliedGlyTau(set, share = GLYCINE_SHARE.value) {
  return (share / (1 - share)) / rateCoefficient(set)
}

/**
 * Share of glycine conjugates after the glycine supply is multiplied by `glyX` and the taurine supply by `tauX`,
 * calibrated so that glyX = tauX = 1 gives `base`.
 */
export function glycineShare({ glyX = 1, tauX = 1, base = GLYCINE_SHARE.value } = {}) {
  if (!(glyX >= 0) || !(tauX > 0)) throw new RangeError('glyX must be >= 0 and tauX > 0')
  const ratio = (base / (1 - base)) * (glyX / tauX)
  return ratio / (1 + ratio)
}

/** "3.0 : 1" for a glycine share. */
export function ratioText(share) {
  if (share >= 1) return 'all glycine'
  const ratio = share / (1 - share)
  return ratio >= 1 ? `${ratio.toFixed(1)} : 1 glycine to taurine` : `1 : ${(1 / ratio).toFixed(1)} glycine to taurine`
}

/** Conjugation rates (mmol/day) split by the share, scaled so the glycine part equals the observed gross use at the base share. */
export function conjugationRates(share, { gross = GROSS_GLYCINE_MMOL_PER_DAY.value, base = GLYCINE_SHARE.value } = {}) {
  const total = gross / base
  return { glycine: total * share, taurine: total * (1 - share), total }
}

/** Grams of glycine the bile-acid conjugation uses per day at a given rate (mmol/day). */
export const glycineGrams = (mmolPerDay) => (mmolPerDay * GLYCINE_MOLAR_MASS) / 1000

/** The what-if curve for a chart: share (%) against the hepatic glycine multiplier for one taurine multiplier. */
export function shareCurve(glyGrid, tauX) {
  return glyGrid.map((glyX) => glycineShare({ glyX, tauX }) * 100)
}
