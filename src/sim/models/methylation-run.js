// Scenario runner for the methylation model: multi-stage time courses (a stage changes the controls, so a chronic
// intervention can start part-way through a run), acute doses as events on the gut depots, and summary statistics.
// Imports the engine, so it is loaded together with the model by the UI but is not part of the model data module.

import { compileModel, simulate, steadyState } from '../index.js'
import { luFactor, luSolve } from '../linalg.js'
import { getModel } from './methylation.js'

/** umol per gram of the orally dosed compounds (molar masses 75.07, 117.15, 104.17 (choline), 149.21, 123.11). */
export const UMOL_PER_G = { glycine: 13321, betaine: 8536, choline: 9600, methionine: 6702, niacin: 8123 }
const DEPOT = { glycine: 'gly_gut', betaine: 'bet_gut', choline: 'cho_gut', methionine: 'met_gut', niacin: 'nic_gut' }

const compiled = new WeakMap()
/** Compile (and memoise per model object) so repeated runs of one variant are cheap. */
export function compiledFor(model) {
  if (!compiled.has(model)) compiled.set(model, compileModel(model))
  return compiled.get(model)
}

/** Expand `{ at, dose: { glycine: 5 }, add, set, label }` into engine events (time offset by `offset`). */
export function expandEvents(events = [], offset = 0) {
  return events.map((e) => {
    const add = { ...(e.add ?? {}) }
    for (const [name, grams] of Object.entries(e.dose ?? {})) {
      if (!DEPOT[name]) throw new Error(`Unknown dose "${name}"`)
      add[DEPOT[name]] = (add[DEPOT[name]] ?? 0) + grams * UMOL_PER_G[name]
    }
    return { time: offset + e.at, ...(Object.keys(add).length ? { add } : {}), ...(e.set ? { set: e.set } : {}), label: e.label }
  })
}

/** Model for a scenario (its `variants` selection, overridable by options.variants). */
export function scenarioModel(scenario, selection = {}) {
  return getModel({ ...(scenario.variants ?? {}), ...selection })
}

/**
 * Pseudo-transient Newton from the reference state: linearly implicit Euler steps (I/dt - J) dy = f(y) whose dt grows
 * while the residual falls, which turns into plain Newton for large dt. The folate/PE/PC pools relax ~6 orders of
 * magnitude slower than the fast folate couplings, so a plain damped Newton step overshoots the fast pools; this
 * continuation takes ~10-60 ms where the engine's integrate-to-convergence steadyState needs 0.2-5 s. Returns the same
 * shape as the engine's steadyState ({ converged, residual, state, observables, fluxes, values, y }) or null.
 */
export function newtonSteady(model, controls = {}, { tol = 1e-9, maxIter = 400, start } = {}) {
  const c = compiledFor(model)
  const sys = c.bind(controls)
  const n = c.names.length
  const free = c.names.map((_, i) => i).filter((i) => !c.fixed[i])
  const m = free.length
  let y = Float64Array.from(start ?? sys.y0)
  if (!start) {
    // the total folate pool is pinned at supply / loss constant (loss acts on every form): start from that total
    const idx = ['thf', 'ch2thf', 'mthf', 'f10', 'dhf'].map((id) => c.speciesIndex.get(id))
    const total = idx.reduce((a, i) => a + y[i], 0)
    const want = sys.getParam('rate_fol_in') / sys.getParam('k_fol_loss')
    if (total > 0 && want > 0) for (const i of idx) y[i] *= want / total
  }
  const f = new Float64Array(n); const fp = new Float64Array(n); const fm = new Float64Array(n); const f2 = new Float64Array(n)
  const J = new Float64Array(m * m); const A = new Float64Array(m * m); const piv = new Int32Array(m); const rhs = new Float64Array(m); const dx = new Float64Array(m)
  const resid = (yy, ff) => { let r = 0; for (const i of free) r = Math.max(r, Math.abs(ff[i]) / (Math.abs(yy[i]) + 1e-6)); return r }
  let r0 = resid(y, sys.derivative(0, y, f))
  let dt = 0.5
  for (let it = 0; it < maxIter && r0 > tol; it += 1) {
    for (let jj = 0; jj < m; jj += 1) {
      const j = free[jj]
      const h = 1e-5 * Math.max(Math.abs(y[j]), 1e-3)
      const keep = y[j]
      y[j] = keep + h; sys.derivative(0, y, fp)
      y[j] = Math.max(0, keep - h); const hm = keep - y[j]; sys.derivative(0, y, fm); y[j] = keep
      for (let ii = 0; ii < m; ii += 1) J[ii * m + jj] = (fp[free[ii]] - fm[free[ii]]) / (h + hm)
    }
    let accepted = false
    for (let tries = 0; tries < 12 && !accepted; tries += 1) {
      for (let k = 0; k < m * m; k += 1) A[k] = -J[k]
      for (let i = 0; i < m; i += 1) { A[i * m + i] += 1 / dt; rhs[i] = f[free[i]] }
      if (!luFactor(A, m, piv)) { dt *= 0.25; continue }
      luSolve(A, m, piv, rhs, dx)
      const trial = Float64Array.from(y)
      for (let i = 0; i < m; i += 1) trial[free[i]] = Math.max(0, y[free[i]] + dx[i])
      const r = resid(trial, sys.derivative(0, trial, f2))
      if (r < r0 * 1.2 || r < tol) { y = trial; f.set(f2); dt = Math.min(dt * (r < r0 ? 3 : 1), 1e12); r0 = r; accepted = true } else dt *= 0.25
    }
    if (!accepted) return null
  }
  if (!(r0 <= tol * 10)) return null
  const flux = sys.fluxes(0, y)
  const values = c.values(y, flux)
  return {
    converged: true, residual: r0, y, warnings: [], values,
    state: Object.fromEntries(c.names.map((id) => [id, values[id]])),
    observables: Object.fromEntries(c.observableIds.map((id) => [id, values[id]])),
    fluxes: Object.fromEntries(c.reactionIds.map((id) => [id, values[id]]))
  }
}

/** Steady state of a control setting: Newton from the reference, falling back to the engine's steadyState. */
export function steady(model, controls = {}) {
  const direct = newtonSteady(model, controls)
  if (direct) return direct
  // pseudo-transient continuation: relax for a while with the stiff solver, then retry Newton
  const c = compiledFor(model)
  let y = null
  for (const hours of [20, 200, 2000]) {
    const events = y ? [{ time: 0, set: Object.fromEntries(c.names.map((id, i) => [id, y[i]]).filter(([id]) => !c.fixed[c.names.indexOf(id)])) }] : []
    const run = simulate(c, { controls, times: [0, hours], events, rtol: 1e-6, atol: 1e-9, method: 'rosenbrock' })
    if (!run.ok) break
    y = c.names.map((id) => run.series[id][1])
    const q = newtonSteady(model, controls, { start: Float64Array.from(y) })
    if (q) return q
  }
  return steadyState(c, controls, { tol: 1e-8, tMax: 5e4 })
}

/**
 * Run a scenario. scenario: { background?: controls (held for the whole run; the run starts from its steady state),
 * stages: [{ label, hours, controls?, events?: [{ at, dose|add|set, label }] }] } (a bare { duration, events } is one stage).
 * options: { model, variants, samplesPerHour = 2, rtol = 1e-4, atol = 1e-7 }.
 * Returns { time, series, fluxes, stages: [{label, start, end}], events: [{time, label}], ok, warnings, ms }.
 */
export function runScenario(scenario, options = {}) {
  const t0 = performance.now()
  const model = options.model ?? scenarioModel(scenario, options.variants)
  const c = compiledFor(model)
  const bg = scenario.background ?? {}
  const stages = scenario.stages ?? [{ label: scenario.label ?? 'run', hours: scenario.duration ?? 72, events: scenario.events }]
  const sph = options.samplesPerHour ?? 2
  let y = Float64Array.from(c.y0)
  if (Object.keys(bg).length) {
    const ss = steady(model, bg)
    if (!ss.converged) throw new Error(`Background state of "${scenario.id ?? 'scenario'}" has no steady state`)
    y = Float64Array.from(ss.y)
  }
  const out = { time: [], series: {}, fluxes: {}, stages: [], events: [], ok: true, warnings: [] }
  for (const id of [...c.names, ...c.observableIds]) out.series[id] = []
  for (const id of c.reactionIds) out.fluxes[id] = []
  let clock = 0
  stages.forEach((stage, si) => {
    const n = Math.max(1, Math.round(stage.hours * sph))
    const times = Array.from({ length: n + 1 }, (_, k) => (stage.hours * k) / n)
    const handoff = {}
    c.names.forEach((id, i) => { if (!c.fixed[i]) handoff[id] = y[i] })
    const events = [{ time: 0, set: handoff }, ...expandEvents(stage.events, 0)]
    // method 'rosenbrock': the folate cycle is stiff from t = 0, and the automatic dopri5 -> Rosenbrock hand-over comes
    // late (7x more steps after a dose); same accuracy, 3-7x faster
    const run = simulate(c, { controls: { ...bg, ...(stage.controls ?? {}) }, times, events, rtol: options.rtol ?? 1e-4, atol: options.atol ?? 1e-7, method: options.method ?? 'rosenbrock' })
    if (!run.ok) { out.ok = false; out.warnings.push(...run.warnings) }
    const m = run.time.length
    const skip = si === 0 ? 0 : 1 // the first sample of a later stage repeats the previous stage's last
    for (let k = skip; k < m; k += 1) {
      out.time.push(clock + run.time[k])
      for (const id of Object.keys(out.series)) out.series[id].push(run.series[id][k])
      for (const id of Object.keys(out.fluxes)) out.fluxes[id].push(run.fluxes[id][k])
    }
    out.stages.push({ label: stage.label ?? `stage ${si + 1}`, start: clock, end: clock + stage.hours })
    for (const e of expandEvents(stage.events, clock)) out.events.push({ time: e.time, label: e.label })
    if (m > 0) c.names.forEach((id, i) => { y[i] = run.series[id][m - 1] })
    clock += stage.hours
    if (!run.ok) return
  })
  out.ms = performance.now() - t0
  return out
}

/** Value of `id` (species, observable or flux) at the end of stage `stageIndex` (default last) and at its start. */
export function stageValue(run, id, stageIndex = run.stages.length - 1, which = 'end') {
  const arr = run.series[id] ?? run.fluxes[id]
  if (!arr) throw new Error(`Unknown series "${id}"`)
  const st = run.stages[stageIndex]
  const t = which === 'start' ? st.start : st.end
  let best = 0
  for (let k = 0; k < run.time.length; k += 1) if (Math.abs(run.time[k] - t) < Math.abs(run.time[best] - t)) best = k
  return arr[best]
}

/**
 * Effect summary of `id` relative to its value `ref` (default: value at t = 0), optionally within [from, to] hours:
 * { ref, peak, trough, final, peakRel, troughRel, finalRel, tPeak, tTrough } (relative = value/ref - 1).
 */
export function effect(run, id, { ref, from = 0, to = Infinity } = {}) {
  const arr = run.series[id] ?? run.fluxes[id]
  if (!arr) throw new Error(`Unknown series "${id}"`)
  const base = ref ?? arr[0]
  let peak = -Infinity; let trough = Infinity; let tPeak = 0; let tTrough = 0; let fin = arr[0]
  for (let k = 0; k < arr.length; k += 1) {
    const t = run.time[k]
    if (t < from || t > to) continue
    fin = arr[k]
    if (arr[k] > peak) { peak = arr[k]; tPeak = t }
    if (arr[k] < trough) { trough = arr[k]; tTrough = t }
  }
  const rel = (v) => (base !== 0 ? v / base - 1 : NaN)
  return { ref: base, peak, trough, final: fin, peakRel: rel(peak), troughRel: rel(trough), finalRel: rel(fin), tPeak, tTrough }
}
