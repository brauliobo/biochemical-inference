// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { compare, compileModel, conservedSums, createRng, ensemble, quantile, simulate, steadyState, sensitivity, sweep } from '../../src/sim/index.js'
import { toyConservedGroups, toyModel } from '../../src/sim/models/_toy.js'

const noEvents = { ...toyModel, events: [] }
const nondecreasing = (a) => a.every((v, i) => i === 0 || v >= a[i - 1] - 1e-9)
const nonincreasing = (a) => a.every((v, i) => i === 0 || v <= a[i - 1] + 1e-9)

describe('steadyState', () => {
  it('finds the toy methionine-cycle steady state with balanced fluxes', () => {
    const ss = steadyState(toyModel)
    expect(ss.converged).toBe(true)
    expect(ss.residual).toBeLessThan(1e-8)
    expect(ss.state.met).toBeCloseTo(30, 5) // met_in = k_drain * met  ->  6 / 0.2
    const f = ss.fluxes
    expect(f.gly_in).toBeCloseTo(f.gly_out + f.gnmt, 6) // glycine is supplied, cleared and spent by GNMT
    expect(f.mat).toBeCloseTo(f.recycle, 6)
    expect(f.mat).toBeCloseTo(f.gnmt + f.mt_other, 6)
    expect(f.met_in).toBeCloseTo(f.drain, 6)
    expect(ss.observables.samSahRatio).toBeCloseTo(ss.state.sam / ss.state.sah, 10)
    expect(ss.state.sam).toBeGreaterThan(0)
    expect(ss.state.sah).toBeGreaterThan(0)
  })

  it('is a fixed point of the dynamics: simulating from it does not move', () => {
    const ss = steadyState(toyModel)
    const model = { ...noEvents, species: noEvents.species.map((s) => ({ ...s, initial: ss.state[s.id] })) }
    const run = simulate(model, { duration: 200, samples: 5 })
    for (const id of ['met', 'sam', 'sah', 'gly']) expect(run.series[id][4]).toBeCloseTo(ss.state[id], 5)
  })

  it('handles conserved moieties (closed cycle keeps the initial total)', () => {
    const closed = {
      species: [{ id: 'A', initial: 5 }, { id: 'B', initial: 1 }, { id: 'C', initial: 0 }],
      parameters: [{ id: 'k1', value: 2 }, { id: 'k2', value: 1 }, { id: 'k3', value: 0.5 }],
      reactions: [
        { id: 'ab', substrates: [{ species: 'A', n: 1 }], products: [{ species: 'B', n: 1 }], rate: { law: 'massAction', params: { k: 'k1' } } },
        { id: 'bc', substrates: [{ species: 'B', n: 1 }], products: [{ species: 'C', n: 1 }], rate: { law: 'massAction', params: { k: 'k2' } } },
        { id: 'ca', substrates: [{ species: 'C', n: 1 }], products: [{ species: 'A', n: 1 }], rate: { law: 'massAction', params: { k: 'k3' } } }
      ]
    }
    const ss = steadyState(closed)
    expect(ss.converged).toBe(true)
    expect(ss.state.A + ss.state.B + ss.state.C).toBeCloseTo(6, 6)
    expect(ss.state.A * 2).toBeCloseTo(ss.state.B * 1, 5)
    expect(ss.state.B * 1).toBeCloseTo(ss.state.C * 0.5, 5)
  })

  it('reports non-convergence for an accumulating system', () => {
    const grow = { species: [{ id: 'X', initial: 1 }], reactions: [{ id: 'in', substrates: [], products: [{ species: 'X', n: 1 }], rate: { law: 'constantInput', params: { rate: 1 } } }] }
    const ss = steadyState(grow, {}, { tMax: 1e3 })
    expect(ss.converged).toBe(false)
    expect(ss.warnings[0]).toMatch(/No steady state/)
  })

  it('a glycine load lowers SAM:SAH and a GNMT knock-down raises it (directional)', () => {
    const base = steadyState(toyModel).observables.samSahRatio
    expect(steadyState(toyModel, { glycineIntake: 4 }).observables.samSahRatio).toBeLessThan(base)
    expect(steadyState(toyModel, { gnmtActivity: 0 }).observables.samSahRatio).toBeGreaterThan(base)
  })
})

describe('sweep', () => {
  it('steady-state dose-response is monotone in glycine intake and GNMT activity', () => {
    const doses = [0, 0.5, 1, 2, 3, 5]
    const gly = sweep(toyModel, 'glycineIntake', doses, 'samSahRatio')
    expect(gly.ok).toBe(true)
    expect(gly.y).toHaveLength(doses.length)
    expect(nonincreasing(gly.y)).toBe(true)
    expect(gly.y[0]).toBeGreaterThan(gly.y[5])
    expect(nonincreasing(sweep(toyModel, 'gnmtActivity', [0, 1, 2, 3], 'samSahRatio').y)).toBe(true)
    expect(nondecreasing(sweep(toyModel, 'gnmtActivity', [0, 1, 2, 3], 'gnmt').y)).toBe(true)
  })

  it('transient mode reduces a time course (peak SAH after a bolus)', () => {
    const r = sweep(toyModel, 'gnmtActivity', [0, 1, 2], { id: 'sah', reduce: 'max' }, { mode: 'transient', duration: 120, samples: 121 })
    expect(r.y[0]).toBeLessThan(r.y[2])
    expect(() => sweep(toyModel, 'ghost', [1], 'sah')).toThrow(/Unknown control/)
  })
})

describe('compare', () => {
  it('ranks the species most changed by the perturbation', () => {
    const base = simulate(noEvents, { duration: 120, samples: 25 })
    const loaded = simulate(noEvents, { duration: 120, samples: 25, controls: { glycineIntake: 5 } })
    const cmp = compare(base, loaded)
    expect(cmp.final.gly.delta).toBeGreaterThan(0)
    expect(cmp.final.samSahRatio.delta).toBeLessThan(0)
    expect(cmp.ranked[0]).toBe('gly')
    expect(cmp.delta.sam).toHaveLength(25)
    expect(() => compare(base, simulate(noEvents, { duration: 120, samples: 10 }))).toThrow(/same time grid/)
  })
})

describe('ensemble', () => {
  const opts = { n: 12, seed: 7, duration: 120, samples: 13 }

  it('gives ordered percentile bands over time', () => {
    const e = ensemble(toyModel, opts)
    expect(e.ok).toBe(12)
    expect(e.failures).toBe(0)
    expect(e.paramIds).toContain('vmax_gnmt')
    for (const id of ['sam', 'sah', 'samSahRatio']) {
      const b = e.bands[id]
      b.p5.forEach((_, k) => {
        expect(b.p5[k]).toBeLessThanOrEqual(b.p50[k])
        expect(b.p50[k]).toBeLessThanOrEqual(b.p95[k])
      })
      expect(b.p95[12]).toBeGreaterThan(b.p5[12]) // parameters differ, so the band has width
    }
    expect(e.fluxBands.gnmt.p50).toHaveLength(13)
  })

  it('is reproducible with a seed and differs between seeds', () => {
    const a = ensemble(toyModel, opts)
    const b = ensemble(toyModel, opts)
    expect(b).toEqual(a)
    expect(ensemble(toyModel, { ...opts, seed: 8 }).bands.sam.p50).not.toEqual(a.bands.sam.p50)
  })

  it('samples inside the declared ranges, log-uniformly, and honours overrides', () => {
    const e = ensemble(toyModel, { ...opts, n: 20, paramRanges: { k_drain: [0.15, 0.25] }, only: ['k_drain', 'vmax_mat'] })
    expect(e.paramIds).toEqual(['vmax_mat', 'k_drain'])
    for (const [vmax, drain] of e.samples) {
      expect(vmax).toBeGreaterThanOrEqual(20); expect(vmax).toBeLessThanOrEqual(80)
      expect(drain).toBeGreaterThanOrEqual(0.15); expect(drain).toBeLessThanOrEqual(0.25)
    }
    expect(() => ensemble(toyModel, { paramRanges: { ghost: [1, 2] } })).toThrow(/Unknown parameter/)
  })

  it('steady mode returns scalar bands', () => {
    const e = ensemble(toyModel, { n: 8, seed: 3, mode: 'steady', only: ['vmax_gnmt', 'k_drain'] })
    expect(e.ok).toBe(8)
    const b = e.bands.samSahRatio
    expect(b.p5).toBeLessThanOrEqual(b.p50)
    expect(b.p50).toBeLessThanOrEqual(b.p95)
    expect(b.p95).toBeGreaterThan(b.p5)
  })

  it('the PRNG and quantile helpers behave', () => {
    const r1 = createRng(42); const r2 = createRng(42)
    expect([r1(), r1(), r1()]).toEqual([r2(), r2(), r2()])
    expect(quantile([1, 2, 3, 4, 5], 50)).toBe(3)
    expect(quantile([1, 2, 3, 4], 25)).toBeCloseTo(1.75, 12)
  })
})

describe('sensitivity', () => {
  it('ranks parameters by elasticity of a steady observable', () => {
    const s = sensitivity(toyModel, 'met', { only: ['met_in_rate', 'k_drain', 'vmax_gnmt', 'km_gnmt_gly'] })
    const by = Object.fromEntries(s.map((e) => [e.param, e.elasticity]))
    expect(by.met_in_rate).toBeCloseTo(1, 2)
    expect(by.k_drain).toBeCloseTo(-1, 2)
    expect(Math.abs(by.vmax_gnmt)).toBeLessThan(0.01) // met pool is set by input/drain only
    expect(s.map((e) => e.param).slice(0, 2).sort()).toEqual(['k_drain', 'met_in_rate'])
  })

  it('finds GNMT parameters matter for SAM:SAH', () => {
    const s = sensitivity(toyModel, 'samSahRatio')
    expect(s).toHaveLength(toyModel.parameters.length)
    expect(Math.abs(s[0].elasticity)).toBeGreaterThanOrEqual(Math.abs(s[s.length - 1].elasticity))
    expect(s.find((e) => e.param === 'vmax_gnmt').elasticity).toBeLessThan(0)
  })
})

describe('conservedSums', () => {
  const core = ['mat', 'gnmt', 'mt_other', 'recycle']

  it('flags exactly the open reactions of the toy cycle', () => {
    const [g] = conservedSums(toyModel, toyConservedGroups)
    expect(g.balanced).toBe(false)
    expect(g.violations.map((v) => v.reaction).sort()).toEqual(['drain', 'met_in'])
    expect(conservedSums(toyModel, toyConservedGroups, undefined, { reactions: core })[0].balanced).toBe(true)
  })

  it('the closed core conserves its total through a simulation (to 1e-8)', () => {
    const closed = {
      ...toyModel,
      reactions: toyModel.reactions.filter((r) => core.includes(r.id)),
      controls: toyModel.controls.filter((c) => c.id === 'gnmtActivity'),
      events: [{ time: 30, add: { gly: 300, sam: 40 } }]
    }
    const run = simulate(closed, { duration: 200, samples: 101, controls: { gnmtActivity: 2 } })
    expect(run.ok).toBe(true)
    const [g] = conservedSums(closed, toyConservedGroups, run, { reactions: core })
    expect(g.balanced).toBe(true)
    // the +40 uM SAM bolus is an intentional input, so compare before/after the event separately
    const before = g.totals.slice(0, 15)
    expect(Math.max(...before) - Math.min(...before)).toBeLessThan(1e-8)
    const after = g.totals.slice(15)
    expect(Math.max(...after) - Math.min(...after)).toBeLessThan(1e-8)
    expect(g.totals[15] - g.totals[14]).toBeCloseTo(40, 6)
  })

  it('reports drift when a run is not mass balanced', () => {
    const run = simulate(noEvents, { duration: 100, samples: 11, controls: { metIntake: 3 } })
    const [g] = conservedSums(noEvents, toyConservedGroups, run)
    expect(g.drift).toBeGreaterThan(1)
    expect(() => conservedSums(noEvents, [{ id: 'x', species: ['ghost'] }])).toThrow(/unknown species/)
    expect(compileModel(noEvents).stoichiometry).toHaveLength(5)
  })
})
