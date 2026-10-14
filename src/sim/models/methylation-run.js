// Scenario runner for the methylation model: multi-stage time courses (a stage changes the controls, so a chronic
// intervention can start part-way through a run), acute doses as events on the gut depots, and summary statistics.
// Imports the engine, so it is loaded together with the model by the UI but is not part of the model data module.

import { compileModel, simulate, steadyState } from '../index.js'
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

/** Steady state of a control setting (the engine's steadyState on the compiled model). */
export function steady(model, controls = {}) {
  return steadyState(compiledFor(model), controls, { tMax: 5e4 })
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
    const ss = steadyState(c, bg, { tMax: 5e4 })
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
    const run = simulate(c, { controls: { ...bg, ...(stage.controls ?? {}) }, times, events, rtol: options.rtol ?? 1e-4, atol: options.atol ?? 1e-7 })
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
