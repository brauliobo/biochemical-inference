// Adaptive ODE integrator: Dormand-Prince 5(4) with FSAL, Hairer-style step control and
// 4th-order dense output, a Hairer stiffness detector that hands over to a Rosenbrock 2(3)
// solver (Shampine-Reichelt "ode23s" scheme, numeric Jacobian), non-negativity handling,
// exact-time events and a max-steps guard. Pure and deterministic; no imports from server/.
// The Dormand-Prince tableau is the one in server/portfolio/engines/ode.js.

import { luFactor, luSolve, numericJacobian } from './linalg.js'

const A21 = 1 / 5
const A31 = 3 / 40; const A32 = 9 / 40
const A41 = 44 / 45; const A42 = -56 / 15; const A43 = 32 / 9
const A51 = 19372 / 6561; const A52 = -25360 / 2187; const A53 = 64448 / 6561; const A54 = -212 / 729
const A61 = 9017 / 3168; const A62 = -355 / 33; const A63 = 46732 / 5247; const A64 = 49 / 176; const A65 = -5103 / 18656
const B1 = 35 / 384; const B3 = 500 / 1113; const B4 = 125 / 192; const B5 = -2187 / 6784; const B6 = 11 / 84
const E1 = 71 / 57600; const E3 = -71 / 16695; const E4 = 71 / 1920; const E5 = -17253 / 339200; const E6 = 22 / 525; const E7 = -1 / 40
// dense output (Hairer dopri5 contd5)
const D1 = -12715105075 / 11282082432; const D3 = 87487479700 / 32700410799; const D4 = -10690763975 / 1880347072
const D5 = 701980252875 / 199316789632; const D6 = -1453857185 / 822651844; const D7 = 69997945 / 29380423
const ROS_D = 1 / (2 + Math.SQRT2)
const ROS_E32 = 6 + Math.SQRT2

const buf = (n) => new Float64Array(n)

/**
 * Integrate y' = f(t, y) from times[0], returning the state at every entry of `times` (ascending).
 *
 * f(t, y, out) may fill and return `out` or return a fresh array.
 * options: rtol (1e-6), atol (1e-9), method 'auto' | 'dopri5' | 'rosenbrock' (auto), maxSteps (200000),
 *   hMax, h0, nonneg (true: states are kept >= 0), autonomous (skip the df/dt estimate),
 *   events: [{ time, apply(y, t) }] applied exactly at `time` (apply mutates y in place; a sample at
 *   exactly an event time shows the post-event state).
 * returns { y: Float64Array[] (one per reached output time), warnings: string[], notes: string[], stats }.
 * notes are informational (stiff-solver hand-over); warnings flag clamping, step limits or underflow.
 * stats.status: 'ok' | 'max_steps' | 'step_underflow'; on failure y holds only the reached samples.
 */
export function integrate(f, y0, times, options = {}) {
  const n = y0.length
  const rtol = options.rtol ?? 1e-6
  const atol = options.atol ?? 1e-9
  const method = options.method ?? 'auto'
  const nonneg = options.nonneg !== false
  const maxSteps = options.maxSteps ?? 200000
  const t0 = times[0]
  const tEnd = times[times.length - 1]
  const span = Math.max(tEnd - t0, 0)
  const tol = 1e-12 * Math.max(1, Math.abs(tEnd))
  const hMin = options.hMin ?? 1e-14 * span
  const hMax = options.hMax ?? Infinity
  const negTol = Math.max(10 * atol, 1e-12)
  const warnings = []
  const notes = [] // informational (e.g. "switched to the stiff solver"); warnings mean the result may be incomplete or distorted
  const seen = new Set()
  const warn = (key, message, list = warnings) => { if (!seen.has(key)) { seen.add(key); list.push(message) } }
  const stats = { steps: 0, rejected: 0, fEvals: 0, jEvals: 0, method: 'dopri5', status: 'ok', switchedAt: null, tFinal: t0 }

  const feval = (t, y, out) => {
    stats.fEvals += 1
    const r = f(t, y, out)
    if (r !== out) out.set(r)
    return out
  }
  const events = (options.events ?? []).filter((e) => e.time >= t0 - tol && e.time <= tEnd + tol).sort((a, b) => a.time - b.time)
  const out = []
  let oi = 0
  let ei = 0
  let t = t0
  let y = Float64Array.from(y0)
  let ynew = buf(n)

  const clampNonneg = (v, label, time) => {
    if (!nonneg) return false
    let clamped = false
    for (let i = 0; i < n; i += 1) {
      if (v[i] < 0) {
        if (v[i] < -negTol) warn(`neg${i}`, `State ${label ? label(i) : i} went negative (${v[i].toPrecision(3)}) near t=${time.toPrecision(4)} and was clamped to 0.`)
        v[i] = 0
        clamped = true
      }
    }
    return clamped
  }
  const label = options.names ? (i) => options.names[i] : null
  const applyEvents = (upTo) => {
    let any = false
    while (ei < events.length && events[ei].time <= upTo + tol) {
      events[ei].apply(y, events[ei].time)
      ei += 1
      any = true
    }
    if (any) clampNonneg(y, label, upTo)
    return any
  }

  applyEvents(t0)
  while (oi < times.length && times[oi] <= t0 + tol) { out.push(Float64Array.from(y)); oi += 1 }
  const result = () => ({ y: out, warnings, notes, stats })
  if (oi >= times.length) return result()

  // work arrays
  const k1 = buf(n); const k2 = buf(n); const k3 = buf(n); const k4 = buf(n); const k5 = buf(n); const k6 = buf(n); const k7 = buf(n)
  const ytmp = buf(n); const y6 = buf(n); const err = buf(n)
  const r2 = buf(n); const r3 = buf(n); const r4 = buf(n); const r5 = buf(n)
  let ros = null // allocated when the stiff solver is first needed

  const errNorm = (e, a, b) => {
    let s = 0
    for (let i = 0; i < n; i += 1) {
      const sc = atol + rtol * Math.max(Math.abs(a[i]), Math.abs(b[i]))
      s += (e[i] / sc) * (e[i] / sc)
    }
    const r = Math.sqrt(s / n)
    return Number.isNaN(r) ? Infinity : r
  }

  // --- initial step (Hairer & Wanner II.4) ---
  feval(t, y, k1)
  let h
  if (options.h0 > 0) h = options.h0
  else {
    let d0 = 0; let d1 = 0
    for (let i = 0; i < n; i += 1) {
      const sc = atol + rtol * Math.abs(y[i])
      d0 += (y[i] / sc) ** 2; d1 += (k1[i] / sc) ** 2
    }
    d0 = Math.sqrt(d0 / n); d1 = Math.sqrt(d1 / n)
    const h0 = d0 < 1e-5 || d1 < 1e-5 ? 1e-6 : 0.01 * d0 / d1
    for (let i = 0; i < n; i += 1) ytmp[i] = y[i] + h0 * k1[i]
    feval(t + h0, ytmp, k2)
    let d2 = 0
    for (let i = 0; i < n; i += 1) {
      const sc = atol + rtol * Math.abs(y[i])
      d2 += ((k2[i] - k1[i]) / sc) ** 2
    }
    d2 = Math.sqrt(d2 / n) / h0
    const m = Math.max(d1, d2)
    const h1 = m <= 1e-15 ? Math.max(1e-6, h0 * 1e-3) : (0.01 / m) ** (1 / 5)
    h = Math.min(100 * h0, h1)
  }
  h = Math.min(Math.max(h, hMin), span || 1, hMax)

  let mode = method === 'rosenbrock' ? 'ros' : 'dp'
  let stiffHits = 0
  let nonStiff = 0
  let jacValid = false
  let denseReady = false
  const snap = (v) => { const c = Float64Array.from(v); if (nonneg) for (let i = 0; i < n; i += 1) if (c[i] < 0) c[i] = 0; return c }

  // --- Dormand-Prince step: fills ynew, err; returns false on a non-finite stage ---
  const dpStep = (hh) => {
    for (let i = 0; i < n; i += 1) ytmp[i] = y[i] + hh * A21 * k1[i]
    feval(t + hh / 5, ytmp, k2)
    for (let i = 0; i < n; i += 1) ytmp[i] = y[i] + hh * (A31 * k1[i] + A32 * k2[i])
    feval(t + hh * 3 / 10, ytmp, k3)
    for (let i = 0; i < n; i += 1) ytmp[i] = y[i] + hh * (A41 * k1[i] + A42 * k2[i] + A43 * k3[i])
    feval(t + hh * 4 / 5, ytmp, k4)
    for (let i = 0; i < n; i += 1) ytmp[i] = y[i] + hh * (A51 * k1[i] + A52 * k2[i] + A53 * k3[i] + A54 * k4[i])
    feval(t + hh * 8 / 9, ytmp, k5)
    for (let i = 0; i < n; i += 1) y6[i] = y[i] + hh * (A61 * k1[i] + A62 * k2[i] + A63 * k3[i] + A64 * k4[i] + A65 * k5[i])
    feval(t + hh, y6, k6)
    for (let i = 0; i < n; i += 1) ynew[i] = y[i] + hh * (B1 * k1[i] + B3 * k3[i] + B4 * k4[i] + B5 * k5[i] + B6 * k6[i])
    feval(t + hh, ynew, k7)
    for (let i = 0; i < n; i += 1) err[i] = hh * (E1 * k1[i] + E3 * k3[i] + E4 * k4[i] + E5 * k5[i] + E6 * k6[i] + E7 * k7[i])
  }

  // --- Rosenbrock 2(3) step ---
  const allocRos = () => ({
    J: buf(n * n), W: buf(n * n), piv: new Int32Array(n), work: { yp: buf(n), fp: buf(n) },
    T: buf(n), rhs: buf(n), ka: buf(n), kb: buf(n), kc: buf(n), F1: buf(n), F2: buf(n), fcur: buf(n)
  })
  if (mode === 'ros') { stats.method = 'rosenbrock'; ros = allocRos(); ros.fcur.set(k1) }
  const rosStep = (hh) => {
    const { J, W, piv, work, T, rhs, ka, kb, kc, F1, F2, fcur } = ros
    if (!jacValid) {
      numericJacobian((tt, yy, o) => feval(tt, yy, o), t, y, fcur, J, work)
      stats.jEvals += 1
      if (options.autonomous) T.fill(0)
      else {
        const dt = 1e-7 * Math.max(Math.abs(t), 1)
        feval(t + dt, y, work.fp)
        for (let i = 0; i < n; i += 1) T[i] = (work.fp[i] - fcur[i]) / dt
      }
      jacValid = true
    }
    const hd = hh * ROS_D
    for (let i = 0; i < n * n; i += 1) W[i] = -hd * J[i]
    for (let i = 0; i < n; i += 1) W[i * n + i] += 1
    if (!luFactor(W, n, piv)) return false
    for (let i = 0; i < n; i += 1) rhs[i] = fcur[i] + hd * T[i]
    luSolve(W, n, piv, rhs, ka)
    for (let i = 0; i < n; i += 1) ytmp[i] = y[i] + 0.5 * hh * ka[i]
    feval(t + 0.5 * hh, ytmp, F1)
    for (let i = 0; i < n; i += 1) rhs[i] = F1[i] - ka[i]
    luSolve(W, n, piv, rhs, kb)
    for (let i = 0; i < n; i += 1) kb[i] += ka[i]
    for (let i = 0; i < n; i += 1) ynew[i] = y[i] + hh * kb[i]
    feval(t + hh, ynew, F2)
    for (let i = 0; i < n; i += 1) rhs[i] = F2[i] - ROS_E32 * (kb[i] - F1[i]) - 2 * (ka[i] - fcur[i]) + hd * T[i]
    luSolve(W, n, piv, rhs, kc)
    for (let i = 0; i < n; i += 1) err[i] = (hh / 6) * (ka[i] - 2 * kb[i] + kc[i])
    return true
  }

  // --- dense output for the step just accepted (yo = state at step start, ynew at end) ---
  const interpolate = (stepMode, yo, tOld, hh, tq, into) => {
    const theta = (tq - tOld) / hh
    if (stepMode === 'dp') {
      if (!denseReady) {
        for (let i = 0; i < n; i += 1) {
          const diff = ynew[i] - yo[i]
          const bspl = hh * k1[i] - diff
          r2[i] = diff
          r3[i] = bspl
          r4[i] = -hh * k7[i] + diff - bspl
          r5[i] = hh * (D1 * k1[i] + D3 * k3[i] + D4 * k4[i] + D5 * k5[i] + D6 * k6[i] + D7 * k7[i])
        }
        denseReady = true
      }
      const s1 = 1 - theta
      for (let i = 0; i < n; i += 1) into[i] = yo[i] + theta * (r2[i] + s1 * (r3[i] + theta * (r4[i] + s1 * r5[i])))
    } else {
      const t2 = theta * theta; const t3 = t2 * theta
      const h00 = 2 * t3 - 3 * t2 + 1; const h10 = t3 - 2 * t2 + theta; const h01 = -2 * t3 + 3 * t2; const h11 = t3 - t2
      for (let i = 0; i < n; i += 1) into[i] = h00 * yo[i] + h10 * hh * ros.fcur[i] + h01 * ynew[i] + h11 * hh * ros.F2[i]
    }
    if (nonneg) for (let i = 0; i < n; i += 1) if (into[i] < 0) into[i] = 0
    return into
  }

  while (oi < times.length) {
    if (stats.steps + stats.rejected >= maxSteps) {
      stats.status = 'max_steps'
      warn('max', `Stopped at t=${t.toPrecision(5)}: exceeded ${maxSteps} integration steps. The model may be too stiff or the tolerances too tight.`)
      break
    }
    const target = Math.min(tEnd, ei < events.length ? events[ei].time : Infinity)
    let hh = Math.min(h, hMax)
    let hitTarget = false
    if (hh >= target - t - 1e-14 * Math.max(1, Math.abs(t))) { hh = target - t; hitTarget = true }
    if (!(hh > 0) || t + hh === t) {
      stats.status = 'step_underflow'
      warn('underflow', `Stopped at t=${t.toPrecision(5)}: the step size underflowed.`)
      break
    }

    let ok = true
    if (mode === 'dp') dpStep(hh)
    else ok = rosStep(hh)
    let en = ok ? errNorm(err, y, ynew) : Infinity
    let accept = en <= 1

    // positivity: reject steps that go materially negative while the step can still shrink
    if (accept && nonneg) {
      let low = 0
      for (let i = 0; i < n; i += 1) if (ynew[i] < low) low = ynew[i]
      if (low < -negTol && hh > 16 * hMin) { accept = false; en = Infinity; stats.posRejected = (stats.posRejected ?? 0) + 1 }
    }

    if (!accept) {
      stats.rejected += 1
      const fac = Number.isFinite(en) ? Math.max(0.2, 0.9 * en ** (mode === 'dp' ? -0.2 : -1 / 3)) : 0.25
      h = hh * Math.min(fac, 0.9)
      if (h < hMin || t + h === t) {
        stats.status = 'step_underflow'
        warn('underflow', `Stopped at t=${t.toPrecision(5)}: the step size underflowed (stiff or discontinuous right-hand side).`)
        break
      }
      continue
    }

    // --- accepted ---
    stats.steps += 1
    const tOld = t
    const tNew = hitTarget ? target : t + hh
    const yo = y
    const modeAtStep = mode
    let facUp
    if (mode === 'dp') facUp = en === 0 ? 5 : Math.min(5, 0.9 * en ** -0.2)
    else facUp = en === 0 ? 5 : Math.min(5, 0.9 * en ** (-1 / 3))
    h = hitTarget ? Math.max(h, hh * facUp) : hh * Math.max(0.2, facUp)

    // stiffness detector (Hairer): h * |f(ynew)-f(y6)| / |ynew-y6| near the stability boundary
    if (mode === 'dp') {
      let num = 0; let den = 0
      for (let i = 0; i < n; i += 1) { num += (k7[i] - k6[i]) ** 2; den += (ynew[i] - y6[i]) ** 2 }
      if (den > 0 && hh * Math.sqrt(num / den) > 3.25) {
        nonStiff = 0
        stiffHits += 1
        if (stiffHits >= 15) {
          if (method === 'auto') {
            mode = 'ros'
            stats.method = 'dopri5->rosenbrock'
            stats.switchedAt = tNew
            warn('stiff', `Stiff dynamics detected near t=${tNew.toPrecision(4)}; switched to a semi-implicit Rosenbrock solver (lower order, larger steps).`, notes)
          } else warn('stiff', `Stiff dynamics detected near t=${tNew.toPrecision(4)} with method "dopri5"; the run may need very many steps. Use method "auto".`)
          stiffHits = 0
        }
      } else {
        nonStiff += 1
        if (nonStiff >= 6) stiffHits = 0
      }
    }

    // interpolate outputs, then move on. Dense data must be read before buffers are reused.
    denseReady = false
    const evHit = hitTarget && ei < events.length && events[ei].time <= tNew + tol
    while (oi < times.length && (evHit ? times[oi] < tNew - tol : times[oi] <= tNew + tol)) {
      const tq = times[oi]
      out.push(tq >= tNew - tol ? snap(ynew) : interpolate(modeAtStep, yo, tOld, hh, tq, buf(n)))
      oi += 1
    }
    // commit the step
    t = tNew
    y = ynew
    ynew = yo
    let derivativeStale = false
    if (clampNonneg(y, label, t)) derivativeStale = true
    if (evHit) {
      applyEvents(t)
      derivativeStale = true
      while (oi < times.length && times[oi] <= t + tol) { out.push(Float64Array.from(y)); oi += 1 }
    }
    stats.tFinal = t
    jacValid = false
    if (oi >= times.length) break
    if (mode === 'dp') {
      if (derivativeStale) feval(t, y, k1)
      else k1.set(k7)
    } else {
      if (!ros) ros = allocRos()
      if (derivativeStale || modeAtStep === 'dp') feval(t, y, ros.fcur)
      else ros.fcur.set(ros.F2)
    }
  }
  return result()
}
