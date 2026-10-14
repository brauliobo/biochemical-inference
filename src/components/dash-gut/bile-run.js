// Hepatic glycine against a glycine supplement, from the methylation model (lazy: loads the engine and the model), and the
// bile-acid what-if on top of it. The what-if itself is bile-model.js (pure).
import { methylationModel } from '../../sim/models/methylation.js'
import { steady } from '../../sim/models/methylation-run.js'
import { conjugationRates, glycineGrams, glycineShare, ratioText, shareCurve } from './bile-model.js'

export const GLYCINE_GRID = Object.freeze([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20])
export const TAURINE_SERIES = Object.freeze([0.5, 1, 2])

/** Piecewise-linear interpolation of y over the grid x at `at`. */
export function interpolate(x, y, at) {
  if (at <= x[0]) return y[0]
  for (let i = 1; i < x.length; i += 1) {
    if (at <= x[i]) return y[i - 1] + ((y[i] - y[i - 1]) * (at - x[i - 1])) / (x[i] - x[i - 1])
  }
  return y[y.length - 1]
}

export function createBileRunner() {
  let curve = null
  const setup = () => {
    const base = steady(methylationModel, {})
    return GLYCINE_GRID.map((grams) => (grams === 0 ? 1 : steady(methylationModel, { glycineLoad: grams }).state.gly / base.state.gly))
  }
  return function run(controls) {
    curve ??= setup()
    const glyX = interpolate(GLYCINE_GRID, curve, controls.glycineG)
    const share = glycineShare({ glyX, tauX: controls.taurineX })
    const rates = conjugationRates(share)
    const taurines = [...new Set([...TAURINE_SERIES, controls.taurineX])].sort((a, b) => a - b)
    return {
      glyX,
      share,
      ratio: ratioText(share),
      rates,
      grossGlycineG: glycineGrams(rates.glycine),
      grid: [...GLYCINE_GRID],
      hepaticGlycine: [...curve],
      curves: taurines.map((tauX) => ({ tauX, values: shareCurve(curve, tauX) })),
      warnings: []
    }
  }
}
