// Scenario layer on top of the compiled model and the integrator: time courses, steady states,
// dose-response sweeps, run comparison, parameter-uncertainty ensembles, one-at-a-time
// sensitivity and mass-balance checks. Everything is deterministic (the ensemble uses a seeded PRNG).

import { integrate } from './integrate.js'
import { luFactor, luSolve } from './linalg.js'
import { asCompiled } from './model.js'
import { createRng, quantile, sampleRange } from './rng.js'

const linspace = (a, b, n) => Array.from({ length: n }, (_, i) => (n === 1 ? a : a + ((b - a) * i) / (n - 1)))

function runtimeEvents(c, sys, specs) {
  return specs.map((e) => ({
    time: e.time,
    apply(y) {
      for (const mode of ['set', 'add']) {
        for (const [id, v] of Object.entries(e[mode] ?? {})) {
          const si = c.speciesIndex.get(id)
          if (si !== undefined) y[si] = mode === 'set' ? v : y[si] + v
          else if (c.paramIndex.has(id)) sys.setParam(id, mode === 'set' ? v : sys.getParam(id) + v)
          else throw new Error(`Event target "${id}" is neither a species nor a parameter`)
        }
      }
    }
  }))
}

/**
 * Time course. options: controls {id: value}, duration, samples (default 200) or times [..],
 * events [{time,set,add}] (replaces model.events when given), params {id: value} overrides,
 * rtol, atol, method 'auto'|'dopri5'|'rosenbrock', maxSteps.
 * Returns { ok, time, series: {speciesOrObservableId: number[]}, fluxes: {reactionId: number[]},
 *   summary: {final, min, max, steps, rejected, method, status}, warnings, notes }.
 * warnings = clamping / step limit / underflow (ok is false when the run stopped early);
 * notes = informational, e.g. the hand-over to the stiff solver.
 */
export function simulate(model, options = {}) {
  const c = asCompiled(model)
  const sys = c.bind(options.controls ?? {}, options.params ?? {})
  const duration = options.duration ?? c.model.time?.duration ?? 100
  const times = options.times ?? linspace(0, duration, Math.max(2, options.samples ?? 200))
  const events = runtimeEvents(c, sys, options.events ?? c.model.events ?? [])
  const res = integrate(sys.derivative, sys.y0, times, {
    rtol: options.rtol, atol: options.atol, method: options.method, maxSteps: options.maxSteps, events, names: c.names, autonomous: true
  })
  const reached = res.y.length
  const time = times.slice(0, reached)
  const series = {}; const fluxes = {}
  for (const id of [...c.names, ...c.observableIds]) series[id] = new Array(reached)
  for (const id of c.reactionIds) fluxes[id] = new Array(reached)
  const flux = new Float64Array(c.reactionIds.length)
  for (let k = 0; k < reached; k += 1) {
    sys.fluxes(time[k], res.y[k], flux)
    const vals = c.values(res.y[k], flux)
    for (const id of Object.keys(series)) series[id][k] = vals[id]
    for (const id of c.reactionIds) fluxes[id][k] = vals[id]
  }
  const summary = { final: {}, min: {}, max: {}, steps: res.stats.steps, rejected: res.stats.rejected, method: res.stats.method, status: res.stats.status }
  for (const [id, arr] of Object.entries({ ...series, ...fluxes })) {
    summary.final[id] = arr[reached - 1]
    summary.min[id] = Math.min(...arr)
    summary.max[id] = Math.max(...arr)
  }
  return { ok: res.stats.status === 'ok', time, series, fluxes, summary, warnings: res.warnings, notes: res.notes }
}

// --- steady state ---

const maxAbs = (a) => a.reduce((m, v) => Math.max(m, Math.abs(v)), 0)

function newtonPolish(sys, y, free, tol, maxIter) {
  const m = free.length
  const n = y.length
  const f = new Float64Array(n); const fp = new Float64Array(n); const fm = new Float64Array(n)
  const scale = () => 1e-9 + 1e-6 * maxAbs(y)
  const resid = (yy, ff) => { let r = 0; const s = scale(); for (const i of free) r = Math.max(r, Math.abs(ff[i]) / (Math.abs(yy[i]) + s)); return r }
  let r0 = resid(y, sys.derivative(0, y, f))
  const J = new Float64Array(m * m); const piv = new Int32Array(m); const rhs = new Float64Array(m); const dx = new Float64Array(m)
  let it = 0
  for (; it < maxIter && r0 > tol; it += 1) {
    for (let jj = 0; jj < m; jj += 1) {
      const j = free[jj]
      const h = 1e-6 * Math.max(Math.abs(y[j]), 1e-6)
      const keep = y[j]
      y[j] = keep + h; sys.derivative(0, y, fp)
      const lower = keep - h >= 0
      y[j] = lower ? keep - h : keep; sys.derivative(0, y, fm)
      y[j] = keep
      const width = lower ? 2 * h : h
      for (let ii = 0; ii < m; ii += 1) J[ii * m + jj] = (fp[free[ii]] - fm[free[ii]]) / width
    }
    sys.derivative(0, y, f)
    // Levenberg-style ridge keeps the solve defined (and conservation-preserving) when J is singular
    const ridge = 1e-10 * maxAbs(J) + 1e-300
    for (let i = 0; i < m; i += 1) { J[i * m + i] += ridge; rhs[i] = -f[free[i]] }
    if (!luFactor(J, m, piv)) break
    luSolve(J, m, piv, rhs, dx)
    let accepted = false
    const trial = Float64Array.from(y)
    for (let alpha = 1; alpha > 1 / 128; alpha /= 2) {
      for (let i = 0; i < m; i += 1) trial[free[i]] = Math.max(0, y[free[i]] + alpha * dx[i])
      const r = resid(trial, sys.derivative(0, trial, fp))
      if (r < r0) { y.set(trial); r0 = r; accepted = true; break }
    }
    if (!accepted) break
  }
  return { residual: r0, iterations: it }
}

/**
 * Steady state by integration-to-convergence followed by a damped Newton polish.
 * options: params, tol (1e-10, max relative |dy/dt| per time unit), span (first chunk length),
 * tMax, method. Returns { converged, residual, state, observables, fluxes, values, y, warnings }.
 * Models with conserved moieties are fine: the answer then depends on the initial totals.
 */
export function steadyState(model, controls = {}, options = {}) {
  const c = asCompiled(model)
  const sys = c.bind(controls, options.params ?? {})
  const n = c.names.length
  const free = c.names.map((_, i) => i).filter((i) => !c.fixed[i])
  const tol = options.tol ?? 1e-10
  const y = Float64Array.from(sys.y0)
  const warnings = []
  const base = options.span ?? c.model.time?.duration ?? 100
  const tMax = options.tMax ?? base * 1e5
  let span = base
  let spent = 0
  let residual = Infinity
  let iterations = 0
  const f = new Float64Array(n)
  const measure = () => {
    sys.derivative(0, y, f)
    let r = 0; const s = 1e-9 + 1e-6 * maxAbs(y)
    for (const i of free) r = Math.max(r, Math.abs(f[i]) / (Math.abs(y[i]) + s))
    return r
  }
  residual = measure()
  while (residual > tol && spent < tMax) {
    const res = integrate(sys.derivative, y, [0, span], { rtol: 1e-8, atol: 1e-11, method: options.method, names: c.names, autonomous: true })
    if (res.y.length < 2) { warnings.push(...res.warnings); break }
    y.set(res.y[1])
    spent += span
    residual = measure()
    if (residual > tol && residual < 1e-2) {
      const trial = Float64Array.from(y)
      const polished = newtonPolish(sys, trial, free, tol, 30)
      if (polished.residual <= tol) { y.set(trial); iterations += polished.iterations; residual = measure(); break }
    }
    span *= 4
  }
  if (residual > tol) {
    const polished = newtonPolish(sys, y, free, tol, 50)
    iterations += polished.iterations
    residual = measure()
  }
  const converged = residual <= tol * 10
  if (!converged) warnings.push(`No steady state within tolerance (residual ${residual.toExponential(2)}); the system may oscillate, drift or accumulate.`)
  const flux = sys.fluxes(0, y)
  const values = c.values(y, flux)
  return {
    converged, residual, iterations, warnings, y,
    state: Object.fromEntries(c.names.map((id) => [id, values[id]])),
    observables: Object.fromEntries(c.observableIds.map((id) => [id, values[id]])),
    fluxes: Object.fromEntries(c.reactionIds.map((id) => [id, values[id]])),
    values
  }
}

// --- scalar observables for sweeps / sensitivity / ensembles ---

/** Reduce a sampled series: 'final' | 'max' | 'min' | 'mean' (time-weighted) | 'auc'. */
export function reduceSeries(time, arr, how = 'final') {
  if (how === 'final') return arr[arr.length - 1]
  if (how === 'max') return Math.max(...arr)
  if (how === 'min') return Math.min(...arr)
  let area = 0
  for (let k = 1; k < arr.length; k += 1) area += 0.5 * (arr[k] + arr[k - 1]) * (time[k] - time[k - 1])
  if (how === 'auc') return area
  if (how === 'mean') return time[time.length - 1] > time[0] ? area / (time[time.length - 1] - time[0]) : arr[0]
  throw new Error(`Unknown reducer "${how}"`)
}

function scalar(c, observable, controls, params, o) {
  const sel = typeof observable === 'string' ? { id: observable } : observable
  if ((o.mode ?? 'steady') === 'steady') {
    const st = steadyState(c, controls, { ...o.steady, params })
    return { value: st.converged ? st.values[sel.id] : NaN, ok: st.converged, warnings: st.warnings }
  }
  const run = simulate(c, { controls, params, duration: o.duration, samples: o.samples ?? 100, events: o.events })
  const arr = run.series[sel.id] ?? run.fluxes[sel.id]
  if (!arr) throw new Error(`Unknown observable "${sel.id}"`)
  return { value: run.ok ? reduceSeries(run.time, arr, sel.reduce ?? o.reduce ?? 'final') : NaN, ok: run.ok, warnings: run.warnings }
}

/**
 * Dose-response: evaluate `observable` (species, flux or model-observable id, or {id, reduce}) over
 * `values` of control `controlId`. options: controls (other settings), mode 'steady' (default) |
 * 'transient' (duration, samples, reduce, events). Returns { controlId, observable, values, y, ok, warnings }.
 */
export function sweep(model, controlId, values, observable, options = {}) {
  const c = asCompiled(model)
  if (!c.controlIds.includes(controlId)) throw new Error(`Unknown control "${controlId}"`)
  const y = []; const warnings = []; let ok = true
  for (const v of values) {
    const r = scalar(c, observable, { ...options.controls, [controlId]: v }, options.params, options)
    y.push(r.value); ok = ok && r.ok; warnings.push(...r.warnings)
  }
  return { controlId, observable: typeof observable === 'string' ? observable : observable.id, values: [...values], y, ok, warnings: [...new Set(warnings)] }
}

/**
 * Compare two runs on the same time grid. Returns { time, delta: {id: number[]}, final: {id: {base,
 * perturbed, delta, relChange}}, ranked: ids ordered by |relChange| of the final value }.
 */
export function compare(baseRun, perturbedRun) {
  if (baseRun.time.length !== perturbedRun.time.length) throw new Error('compare needs runs on the same time grid')
  const delta = {}; const final = {}
  for (const group of ['series', 'fluxes']) {
    for (const id of Object.keys(baseRun[group])) {
      const b = baseRun[group][id]; const p = perturbedRun[group][id]
      if (!p) continue
      delta[id] = b.map((v, k) => p[k] - v)
      const last = b.length - 1
      final[id] = { base: b[last], perturbed: p[last], delta: p[last] - b[last], relChange: b[last] !== 0 ? (p[last] - b[last]) / Math.abs(b[last]) : (p[last] === 0 ? 0 : Infinity) }
    }
  }
  const ranked = Object.keys(final).sort((x, y) => Math.abs(final[y].relChange) - Math.abs(final[x].relChange) || (x < y ? -1 : 1))
  return { time: baseRun.time, delta, final, ranked }
}

/**
 * Parameter-uncertainty ensemble. Each run draws every parameter that has low < high
 * log-uniformly (uniformly if low <= 0) with a seeded PRNG. options: n (50), seed (1),
 * paramRanges {id: [low, high]} (overrides/extends the model ranges), only [ids], quantiles
 * [5, 50, 95], mode 'time' (default; duration, samples, controls, events) | 'steady' (controls).
 * Returns { n, ok, failures, seed, paramIds, samples, time, bands: {id: {p5, p50, p95}} } where
 * band values are arrays over time (mode 'time') or numbers (mode 'steady'); flux bands are in fluxBands.
 */
export function ensemble(model, options = {}) {
  const c = asCompiled(model)
  const n = options.n ?? 50
  const qs = options.quantiles ?? [5, 50, 95]
  const rng = createRng(options.seed ?? 1)
  const ranges = {}
  for (const p of c.model.parameters ?? []) if (Number.isFinite(p.low) && Number.isFinite(p.high) && p.low < p.high) ranges[p.id] = [p.low, p.high]
  for (const [id, r] of Object.entries(options.paramRanges ?? {})) { if (!c.paramIndex.has(id)) throw new Error(`Unknown parameter "${id}"`); ranges[id] = r }
  const paramIds = c.paramIds.filter((id) => ranges[id] && (!options.only || options.only.includes(id)))
  const steady = options.mode === 'steady'
  const runs = []; const samples = []; let failures = 0; let time = null
  for (let i = 0; i < n; i += 1) {
    const params = {}
    for (const id of paramIds) params[id] = sampleRange(rng, ranges[id][0], ranges[id][1])
    if (steady) {
      const st = steadyState(c, options.controls ?? {}, { ...options.steady, params })
      if (!st.converged) { failures += 1; continue }
      runs.push({ vals: st.values }); samples.push(paramIds.map((id) => params[id]))
    } else {
      const run = simulate(c, { controls: options.controls, duration: options.duration, samples: options.samples, times: options.times, events: options.events, params })
      if (!run.ok) { failures += 1; continue }
      time = run.time; runs.push(run); samples.push(paramIds.map((id) => params[id]))
    }
  }
  const band = (pick) => {
    const out = {}
    const sample = runs[0] ? pick(runs[0]) : {}
    for (const id of Object.keys(sample)) {
      const column = (k) => runs.map((r) => (k === null ? pick(r)[id] : pick(r)[id][k]))
      out[id] = {}
      for (const q of qs) out[id][`p${q}`] = steady ? quantile(column(null), q) : time.map((_, k) => quantile(column(k), q))
    }
    return out
  }
  return {
    n, ok: runs.length, failures, seed: options.seed ?? 1, paramIds, samples, time,
    bands: steady ? band((r) => Object.fromEntries(c.names.concat(c.observableIds).map((id) => [id, r.vals[id]]))) : band((r) => r.series),
    fluxBands: steady ? {} : band((r) => r.fluxes)
  }
}

/**
 * One-at-a-time elasticity ranking: (d obs / obs) / (d p / p), central difference with relative step
 * `delta` (0.05). options: params [ids], mode/controls/duration as for sweep. Returns
 * [{ param, elasticity, base, up, down }] sorted by |elasticity| (non-finite last).
 */
export function sensitivity(model, observable, options = {}) {
  const c = asCompiled(model)
  const delta = options.delta ?? 0.05
  const controls = options.controls ?? {}
  const base = scalar(c, observable, controls, options.params, options).value
  const out = []
  for (const id of options.only ?? c.paramIds) {
    const v0 = (options.params && options.params[id]) ?? c.bind().getParam(id)
    if (v0 === 0) continue
    const up = scalar(c, observable, controls, { ...options.params, [id]: v0 * (1 + delta) }, options).value
    const down = scalar(c, observable, controls, { ...options.params, [id]: v0 * (1 - delta) }, options).value
    const elasticity = base !== 0 ? (up - down) / base / (2 * delta) : NaN
    out.push({ param: id, elasticity, base, up, down })
  }
  const key = (e) => (Number.isFinite(e.elasticity) ? Math.abs(e.elasticity) : -1)
  return out.sort((a, b) => key(b) - key(a) || (a.param < b.param ? -1 : 1))
}

/**
 * Mass-balance helper. groups: [{ id, name?, weights: {speciesId: n} } | { id, species: [ids] }].
 * Structural check: for each reaction sum_i w_i * N[i][j] must be 0 (fixed species are ignored
 * because they are buffers); reactions that break it are listed in `violations` (restrict the check to
 * the closed part of a model with options.reactions). With a `run`, also returns the weighted total
 * over time, its absolute `drift` (max |total - total[0]|) and `relativeDrift`.
 */
export function conservedSums(model, groups, run, options = {}) {
  const c = asCompiled(model)
  return groups.map((g) => {
    const weights = g.weights ?? Object.fromEntries((g.species ?? []).map((id) => [id, 1]))
    for (const id of Object.keys(weights)) if (!c.speciesIndex.has(id)) throw new Error(`Group "${g.id}": unknown species "${id}"`)
    const violations = []
    c.reactionIds.forEach((rid, j) => {
      if (options.reactions && !options.reactions.includes(rid)) return
      let d = 0
      for (const [id, w] of Object.entries(weights)) { const i = c.speciesIndex.get(id); if (!c.fixed[i]) d += w * c.stoichiometry[i][j] }
      if (Math.abs(d) > 1e-12) violations.push({ reaction: rid, delta: d })
    })
    const result = { id: g.id, name: g.name, balanced: violations.length === 0, violations }
    if (run) {
      const total = run.time.map((_, k) => Object.entries(weights).reduce((s, [id, w]) => s + w * run.series[id][k], 0))
      const drift = total.reduce((m, v) => Math.max(m, Math.abs(v - total[0])), 0)
      Object.assign(result, { totals: total, drift, relativeDrift: total[0] !== 0 ? drift / Math.abs(total[0]) : drift })
    }
    return result
  })
}
