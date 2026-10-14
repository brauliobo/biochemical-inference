// Time-course uncertainty ribbons for the methylation dashboards.
//
// methylationEnsemble() (models/methylation-ensemble.js) reports one effect number per member. A ribbon
// needs the whole time course, so this module runs the same members (same sampler, same recalibration to
// each member's own steady state) and keeps, per observable, the member trajectory divided by its own value
// at t = 0. The bands are therefore bands of the RESPONSE (a ratio to the starting state): the dashboards
// multiply them by the shown run's starting value, so the ribbon says "how much of this response survives
// the parameter uncertainty" and does not mix in the (calibrated, fixed) baseline.
//
//   const out = await ensembleBands({ scenario, variants, observables: ['samSahRatio', 'sam'], n: 100, onProgress })
//   out.bands.samSahRatio  // { p5: number[], p50: number[], p95: number[] } ratios, same length as out.time
//
// Runs in a Web Worker (ensemble.worker.js); without Worker support the caller can run it on the main thread
// with `yieldEvery` > 0, which gives control back to the event loop between members.
import { createRng, quantile } from './rng.js'
import { getModel } from './models/methylation.js'
import { drawMember, ensembleSpace, steadyResidual } from './models/methylation-ensemble.js'
import { runScenario } from './models/methylation-run.js'

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0))

/**
 * options: { scenario (stages, optional background), variants = {}, observables = [], n = 100, seed = 7, fixed = {},
 *   samplesPerHour = 2, onProgress(done, n), cancelled() -> boolean, yieldEvery = 0 }
 * Returns { n, ok, failures, time, bands, ms, cancelled } (bands undefined when cancelled).
 */
export async function ensembleBands(options) {
  const { scenario, variants = {}, observables = [], n = 100, seed = 7, fixed = {}, samplesPerHour = 2, onProgress, cancelled, yieldEvery = 0 } = options
  const started = Date.now()
  const rng = createRng(seed)
  const space = ensembleSpace()
  const members = []
  let time = null
  let failures = 0
  for (let i = 0; i < n; i += 1) {
    if (cancelled?.()) return { n, ok: members.length, failures, time, ms: Date.now() - started, cancelled: true }
    const draw = drawMember(rng, space, fixed)
    try {
      const model = getModel(variants, draw)
      if (steadyResidual(model) > 1e-6) throw new Error('reference state is not a steady state')
      const run = runScenario(scenario, { model, rtol: 1e-3, atol: 1e-6, samplesPerHour })
      if (!run.ok) throw new Error('run failed')
      time ??= run.time
      if (run.time.length !== time.length) throw new Error('time grid differs')
      members.push(Object.fromEntries(observables.map((id) => {
        const series = run.series[id] ?? run.fluxes[id]
        const start = series[0]
        return [id, start > 0 && Number.isFinite(start) ? series.map((v) => v / start) : null]
      })))
    } catch {
      failures += 1
    }
    onProgress?.(i + 1, n)
    if (yieldEvery && (i + 1) % yieldEvery === 0) await nextTick()
  }
  const bands = {}
  for (const id of observables) {
    const rows = members.map((m) => m[id]).filter(Boolean)
    if (!rows.length || !time) continue
    const at = (q) => time.map((_, k) => quantile(rows.map((row) => row[k]), q))
    bands[id] = { p5: at(5), p50: at(50), p95: at(95) }
  }
  return { n, ok: members.length, failures, time, bands, ms: Date.now() - started, cancelled: false }
}
