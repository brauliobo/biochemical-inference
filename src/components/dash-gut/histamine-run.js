// The histamine model run for the night dashboard (lazy: pulls in the engine and the histamine model).
//
//   const runner = createHistamineRunner()
//   const result = runner(controls)    // controls: see HISTAMINE_DEFAULTS in histamine-presets.js
import { compileModel, simulate, steadyState } from '../../sim/index.js'
import { histamineModel, hnmtFactor } from '../../sim/models/histamine.js'
import { HISTAMINE_DEFAULTS, toHistamineControls } from './histamine-presets.js'

const SAM_SWEEP = Array.from({ length: 30 }, (_, i) => Math.round((3 + (147 * i) / 29) * 10) / 10)
const DAY_H = 24

/** Clearance routes (uM/h) and shares at a steady state, from the model's fluxes. */
export function clearanceShares(fluxes) {
  const pair = (hnmt, other) => {
    const total = hnmt + other
    return { hnmt, other, total, share: total > 0 ? hnmt / total : 0 }
  }
  return {
    systemic: pair(fluxes.hnmt_p, fluxes.other_p),
    cns: pair(fluxes.hnmt_b, fluxes.efflux_b),
    gut: { dao: fluxes.dao_g, absorbed: fluxes.absorb_g, total: fluxes.dao_g + fluxes.absorb_g }
  }
}

const valueAt = (x, values, at) => {
  let best = 0
  for (let i = 1; i < x.length; i += 1) if (Math.abs(x[i] - at) < Math.abs(x[best] - at)) best = i
  return values[best]
}

export function createHistamineRunner() {
  const compiled = compileModel(histamineModel)
  const flat = (controls) => ({ ...toHistamineControls(controls), diurnalAmplitude: 0 })
  const day = (controls) => {
    const run = simulate(compiled, { controls: toHistamineControls(controls), duration: 2 * DAY_H, samples: 2 * DAY_H * 2 + 1 })
    const from = run.time.findIndex((t) => t >= DAY_H)
    return { x: run.time.slice(from).map((t) => t - DAY_H), plasma: run.series.plasmaRel.slice(from), cns: run.series.cnsRel.slice(from) }
  }
  const state = (controls) => {
    const s = steadyState(compiled, flat(controls))
    return { plasma: s.observables.plasmaRel, cns: s.observables.cnsRel, shares: clearanceShares(s.fluxes) }
  }
  const baselineDay = new Map()
  const baselineState = state(HISTAMINE_DEFAULTS)
  return function run(controls) {
    const key = controls.diurnal ? 'on' : 'off'
    if (!baselineDay.has(key)) baselineDay.set(key, day({ ...HISTAMINE_DEFAULTS, diurnal: controls.diurnal }))
    const own = day(controls)
    const now = state(controls)
    const sweep = SAM_SWEEP.map((sam) => {
      const s = steadyState(compiled, { ...flat(controls), samUM: sam })
      return { sam, plasma: s.observables.plasmaRel, cns: s.observables.cnsRel }
    })
    return {
      day: own,
      baselineDay: baselineDay.get(key),
      state: now,
      baselineState,
      sweep,
      hnmtCapacity: hnmtFactor(controls.samUM, controls.sahUM) * controls.hnmtX,
      ratio: controls.sahUM > 0 ? controls.samUM / controls.sahUM : null,
      at04: valueAt(own.x, own.plasma, 4),
      at16: valueAt(own.x, own.plasma, 16),
      warnings: []
    }
  }
}
