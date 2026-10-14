// Parameter-uncertainty ensembles for the methylation model.
//
// The engine's ensemble() draws parameters of one fixed model, but here every maximal rate is calibrated to the
// reference steady state, so a sampled Km would also move the baseline. This module therefore samples the
// *inputs* of the calibration - kinetic constants (log-uniform over the literature ranges), the reference flux
// partition (PLAN), the load-scaling constants (STRUCT) and uncertain reference concentrations - and rebuilds the
// calibrated model for every member. Each member is exactly at its own steady state at t = 0, so a scenario
// run gives the response relative to the member's own baseline. Uses the engine's seeded PRNG and quantile.

import { createRng, quantile, sampleRange } from '../rng.js'
import { KIN, PLAN, getModel } from './methylation.js'
import { compiledFor, runScenario } from './methylation-run.js'

/** Ranges of the structural / reference-state constants that are not in KIN or PLAN: [low, high]. */
export const STRUCT_RANGES = {
  loadScale: [3, 8], vd_gly: [30, 80], vd_bet: [20, 40], dose_met: [0.006, 0.025], dose_cho: [0.02, 0.12], dose_nic: [0.012, 0.05]
}
export const REF_RANGES = { gly: [600, 4000], bet: [830, 1490], ser: [250, 900], cho: [71, 97], dmg: [29, 67], sar: [11, 29] }

/** The uncertainty space: [{ group: 'params'|'plan'|'struct'|'ref', id, low, high }]. */
export function ensembleSpace() {
  const space = []
  for (const [id, , low, high] of KIN) if (low < high) space.push({ group: 'params', id, low, high })
  for (const [id, [, low, high]] of Object.entries(PLAN)) space.push({ group: 'plan', id, low, high })
  for (const [id, [low, high]] of Object.entries(STRUCT_RANGES)) space.push({ group: 'struct', id, low, high })
  for (const [id, [low, high]] of Object.entries(REF_RANGES)) space.push({ group: 'ref', id, low, high })
  return space
}

/** Draw one member: model-build options { params, plan, struct, ref } (log-uniform within each range). `fixed` pins values. */
export function drawMember(rng, space = ensembleSpace(), fixed = {}) {
  const options = { params: {}, plan: {}, struct: {}, ref: {} }
  for (const { group, id, low, high } of space) {
    const pinned = fixed[group]?.[id]
    options[group][id] = pinned !== undefined ? pinned : sampleRange(rng, low, high)
  }
  return options
}

/** Safe divide used for relative effects. */
const rel = (v, ref) => (ref ? v / ref - 1 : NaN)

/**
 * Run an ensemble of a scenario. options: { scenario, n = 100, seed = 1, variants (fixed variant selection, applied before
 * sampling; sampled values override), fixed: { params: {km_gnmt_gly: 130}, ... }, metrics: [{ id, observable, stage = last
 * stage start as reference, reduce: 'min'|'max'|'final'|'peakAbs' }], rtol }.
 * Returns { n, ok, failures, seed, members: [{ options, effects: {metricId: relChange} }], summary: {metricId: {p5,p50,p95,mean,
 *   fracDown(x), fracUp(x)}} }.
 */
export function methylationEnsemble(options) {
  const { scenario: full, n = 100, seed = 1, metrics, variants = {}, fixed = {}, rtol = 1e-3, samplesPerHour = 1, hours } = options
  // Every member starts exactly at its own steady state, so an empty baseline stage is skipped (saves ~40% of the run);
  // `hours` shortens the intervention stage (acute doses are over within ~24 h).
  const scenario = { ...full, stages: full.stages.filter((s, i) => i > 0 || s.controls || s.events).map((s, i, a) => (i === a.length - 1 && hours ? { ...s, hours: Math.min(s.hours, hours) } : s)) }
  const rng = createRng(seed)
  const space = ensembleSpace()
  const members = []
  let failures = 0
  const t0 = performance.now()
  for (let i = 0; i < n; i += 1) {
    const opts = drawMember(rng, space, fixed)
    let model
    let run = null
    try {
      model = getModel(variants, opts)
      if (steadyResidual(model) > 1e-6) throw new Error('reference state is not a steady state')
      run = runScenario(scenario, { model, rtol, atol: 1e-6, samplesPerHour })
    } catch (e) { run = null }
    if (!run || !run.ok) { failures += 1; continue }
    const effects = {}
    const iBase = scenario.stages.length === full.stages.length ? baselineIndex(run) : 0
    for (const m of metrics) {
      const arr = run.series[m.observable] ?? run.fluxes[m.observable]
      const base = arr[iBase]
      const tail = arr.slice(iBase)
      const v = m.reduce === 'min' ? Math.min(...tail) : m.reduce === 'max' ? Math.max(...tail) : m.reduce === 'peakAbs' ? tail.reduce((a, b) => (Math.abs(b - base) > Math.abs(a - base) ? b : a), base) : arr[arr.length - 1]
      effects[m.id] = rel(v, base)
    }
    if (Object.values(effects).some((e) => !Number.isFinite(e))) { failures += 1; continue }
    members.push({ options: opts, effects })
  }
  const summary = {}
  for (const m of metrics) {
    const col = members.map((x) => x.effects[m.id])
    summary[m.id] = {
      p5: quantile(col, 5), p25: quantile(col, 25), p50: quantile(col, 50), p75: quantile(col, 75), p95: quantile(col, 95),
      mean: col.reduce((a, b) => a + b, 0) / (col.length || 1),
      fracBelow: (x) => col.filter((v) => v < x).length / (col.length || 1),
      fracAbove: (x) => col.filter((v) => v > x).length / (col.length || 1)
    }
  }
  return { n, ok: members.length, failures, seed, members, summary, ms: performance.now() - t0, space }
}

/** Max relative |dy/dt| of the free species at the reference state (0 for a calibrated model). */
export function steadyResidual(model) {
  const c = compiledFor(model)
  const d = c.bind().derivative(0, Float64Array.from(c.y0))
  let r = 0
  c.names.forEach((n, i) => { if (!c.fixed[i]) r = Math.max(r, Math.abs(d[i]) / (Math.abs(c.y0[i]) + 1e-6)) })
  return r
}

/** Index of the last sample of the first stage (the pre-intervention baseline). */
export function baselineIndex(run) {
  const end = run.stages[0].end
  let k = 0
  for (let i = 0; i < run.time.length; i += 1) if (run.time[i] <= end + 1e-9) k = i
  return k
}

/**
 * Spearman-style sensitivity of a metric to the sampled inputs: rank correlation of each input with the effect.
 * Returns [{ id, group, rho }] sorted by |rho| (needs members from methylationEnsemble).
 */
export function rankSensitivity(result, metricId, top = 12) {
  const ranks = (arr) => { const idx = arr.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]); const r = new Array(arr.length); idx.forEach(([, i], k) => { r[i] = k }); return r }
  const y = ranks(result.members.map((m) => m.effects[metricId]))
  const out = []
  for (const { group, id } of result.space) {
    const x = ranks(result.members.map((m) => m.options[group][id]))
    const mx = (x.length - 1) / 2
    let sxy = 0; let sxx = 0; let syy = 0
    for (let i = 0; i < x.length; i += 1) { sxy += (x[i] - mx) * (y[i] - mx); sxx += (x[i] - mx) ** 2; syy += (y[i] - mx) ** 2 }
    out.push({ id, group, rho: sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0 })
  }
  return out.sort((a, b) => Math.abs(b.rho) - Math.abs(a.rho)).slice(0, top)
}

export { compiledFor }
