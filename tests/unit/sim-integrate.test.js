// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { compileModel, integrate, simulate } from '../../src/sim/index.js'

const grid = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1))
const species = (id, initial, extra = {}) => ({ id, name: id, initial, unit: 'uM', ...extra })
const sub = (s, n = 1) => ({ species: s, n })

// principal-branch Lambert W by Halley iteration (x >= 0)
function lambertW(x) {
  let w = x < 1 ? x : Math.log(x)
  for (let i = 0; i < 60; i += 1) {
    const e = Math.exp(w)
    const f = w * e - x
    w -= f / (e * (w + 1) - ((w + 2) * f) / (2 * w + 2))
  }
  return w
}

describe('integrator against analytic solutions', () => {
  it('exponential decay incl. dense output between steps', () => {
    const times = grid(0, 10, 501)
    const res = integrate((t, y) => [-0.7 * y[0]], [3], times, { rtol: 1e-8, atol: 1e-12 })
    expect(res.stats.status).toBe('ok')
    times.forEach((t, i) => expect(res.y[i][0]).toBeCloseTo(3 * Math.exp(-0.7 * t), 6))
    expect(res.stats.steps).toBeLessThan(times.length / 4) // several samples per step: the dense output is doing the work
  })

  it('harmonic oscillator with positivity off', () => {
    const times = grid(0, 20, 81)
    const res = integrate((t, y) => [y[1], -y[0]], [1, 0], times, { rtol: 1e-10, atol: 1e-12, nonneg: false })
    times.forEach((t, i) => {
      expect(res.y[i][0]).toBeCloseTo(Math.cos(t), 6)
      expect(res.y[i][1]).toBeCloseTo(-Math.sin(t), 6)
    })
  })

  it('Michaelis-Menten time course matches the Lambert-W closed form', () => {
    const [S0, Km, Vmax] = [2, 1, 0.5]
    const model = {
      species: [species('S', S0), species('P', 0)],
      parameters: [{ id: 'V', value: Vmax }, { id: 'K', value: Km }],
      reactions: [{ id: 'r', substrates: [sub('S')], products: [sub('P')], rate: { law: 'michaelisMenten', params: { Vmax: 'V', Km: 'K' } } }]
    }
    const run = simulate(model, { duration: 8, samples: 33, rtol: 1e-10, atol: 1e-13 })
    run.time.forEach((t, k) => {
      const exact = Km * lambertW((S0 / Km) * Math.exp((S0 - Vmax * t) / Km))
      expect(run.series.S[k]).toBeCloseTo(exact, 7)
      expect(run.series.S[k] + run.series.P[k]).toBeCloseTo(S0, 9)
    })
  })

  it('reversible isomerisation relaxes to the analytic equilibrium', () => {
    const [kf, kr, total] = [2, 1, 6]
    const model = {
      species: [species('A', total), species('B', 0)],
      parameters: [{ id: 'kf', value: kf }, { id: 'kr', value: kr }],
      reactions: [{ id: 'iso', substrates: [sub('A')], products: [sub('B')], rate: { law: 'reversibleMassAction', params: { kf: 'kf', kr: 'kr' } } }]
    }
    const run = simulate(model, { duration: 5, samples: 26, rtol: 1e-10, atol: 1e-13 })
    const Aeq = (kr / (kf + kr)) * total
    run.time.forEach((t, k) => expect(run.series.A[k]).toBeCloseTo(Aeq + (total - Aeq) * Math.exp(-(kf + kr) * t), 7))
  })

  it('a conservative 3-species cycle conserves the sum to 1e-8', () => {
    const ring = (id, a, b, k) => ({ id, substrates: [sub(a)], products: [sub(b)], rate: { law: 'massAction', params: { k } } })
    const model = {
      species: [species('A', 5), species('B', 2), species('C', 1)],
      reactions: [ring('ab', 'A', 'B', 1.3), ring('bc', 'B', 'C', 0.4), ring('ca', 'C', 'A', 0.9)]
    }
    const run = simulate(model, { duration: 60, samples: 121 })
    expect(run.ok).toBe(true)
    for (let k = 0; k < run.time.length; k += 1) expect(Math.abs(run.series.A[k] + run.series.B[k] + run.series.C[k] - 8)).toBeLessThan(1e-8)
  })

  it('the Rosenbrock solver is accurate on its own', () => {
    const times = grid(0, 5, 11)
    const res = integrate((t, y) => [-2 * y[0]], [1], times, { method: 'rosenbrock', rtol: 1e-7, atol: 1e-10, autonomous: true })
    expect(res.stats.method).toBe('rosenbrock')
    times.forEach((t, i) => expect(res.y[i][0]).toBeCloseTo(Math.exp(-2 * t), 4))
  })
})

describe('positivity, events, guards and determinism', () => {
  it('stays non-negative and finite with an oversized first step', () => {
    const times = grid(0, 1, 21)
    const res = integrate((t, y) => [-1e4 * y[0]], [1], times, { h0: 1 })
    expect(res.stats.status).toBe('ok')
    for (const y of res.y) { expect(Number.isFinite(y[0])).toBe(true); expect(y[0]).toBeGreaterThanOrEqual(0) }
  })

  it('clamps a zero-order drain at 0 and warns when the step cannot shrink further', () => {
    const res = integrate(() => [-1], [1], [0, 1, 2, 3], { hMin: 0.01, maxSteps: 1000 })
    expect(res.stats.status).toBe('ok')
    expect(res.warnings.some((w) => /clamped/.test(w))).toBe(true)
    for (const y of res.y) expect(y[0]).toBeGreaterThanOrEqual(0)
    expect(res.y[3][0]).toBe(0)
  })

  it('applies events exactly at their time, including between and on sample times', () => {
    const model = { species: [species('x', 1)], parameters: [{ id: 'k', value: 0.5 }], reactions: [{ id: 'd', substrates: [sub('x')], products: [], rate: { law: 'firstOrder', params: { k: 'k' } } }] }
    const run = simulate(model, {
      duration: 10, times: [0, 2, 5, 5.5, 8, 10], rtol: 1e-10, atol: 1e-13,
      events: [{ time: 5, add: { x: 1 } }, { time: 6.5, set: { k: 0 } }]
    })
    const x5 = Math.exp(-0.5 * 5) + 1 // sample at the event time shows the post-event state
    expect(run.series.x[1]).toBeCloseTo(Math.exp(-1), 8)
    expect(run.series.x[2]).toBeCloseTo(x5, 8)
    expect(run.series.x[3]).toBeCloseTo(x5 * Math.exp(-0.25), 8)
    expect(run.series.x[4]).toBeCloseTo(x5 * Math.exp(-0.75), 8) // k set to 0 at 6.5: frozen afterwards
    expect(run.series.x[5]).toBeCloseTo(run.series.x[4], 10)
  })

  it('an event at t=0 acts as an initial dose', () => {
    const res = integrate((t, y) => [-y[0]], [1], [0, 1], { events: [{ time: 0, apply: (y) => { y[0] += 2 } }], rtol: 1e-10, atol: 1e-13 })
    expect(res.y[0][0]).toBe(3)
    expect(res.y[1][0]).toBeCloseTo(3 * Math.exp(-1), 8)
  })

  it('stops with a warning at the step limit instead of hanging or throwing', () => {
    const res = integrate((t, y) => [Math.cos(50 * t) * 50 + 100 + y[0] * 0], [0], [0, 1000], { maxSteps: 50 })
    expect(res.stats.status).toBe('max_steps')
    expect(res.warnings[0]).toMatch(/exceeded 50/)
    expect(res.y.length).toBe(1)
  })

  it('is deterministic', () => {
    const model = { species: [species('a', 4), species('b', 1)], parameters: [{ id: 'k', value: 0.3 }], reactions: [{ id: 'r', substrates: [sub('a')], products: [sub('b')], rate: { law: 'massAction', params: { k: 'k' } } }] }
    const a = simulate(model, { duration: 30, samples: 40 })
    const b = simulate(model, { duration: 30, samples: 40 })
    expect(a).toEqual(b)
  })
})

describe('stiff problems', () => {
  const robertson = (t, y) => [-0.04 * y[0] + 1e4 * y[1] * y[2], 0.04 * y[0] - 1e4 * y[1] * y[2] - 3e7 * y[1] * y[1], 3e7 * y[1] * y[1]]

  it('Robertson completes via the stiff fallback and matches the reference values', () => {
    const times = [0, 0.4, 4, 40, 400, 4000, 1e5]
    const res = integrate(robertson, [1, 0, 0], times, { rtol: 1e-6, atol: 1e-12 })
    expect(res.stats.status).toBe('ok')
    expect(res.stats.method).toBe('dopri5->rosenbrock')
    expect(res.notes.some((w) => /Stiff/.test(w))).toBe(true)
    expect(res.warnings).toEqual([])
    expect(res.stats.steps).toBeLessThan(20000)
    const at40 = res.y[3]
    expect(at40[0]).toBeCloseTo(0.7158270687, 3)
    expect(at40[1]).toBeCloseTo(9.185534764e-6, 8)
    expect(at40[2]).toBeCloseTo(0.2841637457, 3)
    for (const y of res.y) expect(y[0] + y[1] + y[2]).toBeCloseTo(1, 5)
  })

  it('plain Dormand-Prince on the same problem reports the step limit and the stiffness hint', () => {
    const res = integrate(robertson, [1, 0, 0], [0, 1e5], { method: 'dopri5', maxSteps: 3000, atol: 1e-12 })
    expect(res.stats.status).toBe('max_steps')
    expect(res.warnings.join(' ')).toMatch(/Stiff dynamics detected/)
  })

  it('compiled models can be stiff too (fast equilibrium plus slow drain)', () => {
    const model = {
      species: [species('A', 1), species('B', 0), species('C', 0)],
      parameters: [{ id: 'fast', value: 1e6 }, { id: 'slow', value: 1e-3 }],
      reactions: [
        { id: 'ab', substrates: [sub('A')], products: [sub('B')], rate: { law: 'reversibleMassAction', params: { kf: 'fast', kr: 'fast' } } },
        { id: 'bc', substrates: [sub('B')], products: [sub('C')], rate: { law: 'massAction', params: { k: 'slow' } } }
      ]
    }
    const run = simulate(model, { duration: 3000, samples: 7 })
    expect(run.ok).toBe(true)
    // A and B equilibrate instantly, so C(t) = 1 - exp(-slow/2 * t)
    expect(run.series.C[6]).toBeCloseTo(1 - Math.exp(-0.5e-3 * 3000), 3)
    expect(run.summary.steps).toBeLessThan(5000)
    expect(compileModel(model).names).toEqual(['A', 'B', 'C'])
  })
})
