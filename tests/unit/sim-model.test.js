// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { compileModel, simulate, validateModel } from '../../src/sim/index.js'
import { toyModel } from '../../src/sim/models/_toy.js'

const clone = (m) => JSON.parse(JSON.stringify(m))

describe('model validation', () => {
  it('accepts the toy model', () => {
    const v = validateModel(toyModel)
    expect(v.errors).toEqual([])
    expect(v.valid).toBe(true)
  })

  it.each([
    ['unknown species in a reaction', (m) => { m.reactions[1].substrates[0].species = 'nope' }, /not declared/, true],
    ['duplicate id across kinds', (m) => { m.parameters[0].id = 'met' }, /already used/],
    ['undeclared parameter reference', (m) => { m.reactions[1].rate.params.Vmax = 'ghost' }, /parameter "ghost"/, true],
    ['missing rate parameter', (m) => { delete m.reactions[1].rate.params.Km }, /needs param "Km"/, true],
    ['unknown law', (m) => { m.reactions[1].rate.law = 'magic' }, /unknown law/, true],
    ['wrong ontology prefix', (m) => { m.species[0].ontologyId = 'enzyme:mat' }, /compound:/],
    ['reaction ontology prefix', (m) => { m.reactions[1].ontologyId = 'compound:x' }, /reaction:/],
    ['negative initial', (m) => { m.species[0].initial = -1 }, /initial/],
    ['inverted parameter range', (m) => { m.parameters[0].low = 100; m.parameters[0].high = 1 }, /low > high/],
    ['unbound inhibitor role', (m) => { delete m.reactions[3].rate.species.I }, /role "I"/, true],
    ['control target missing', (m) => { m.controls[0].effects[0].id = 'ghost' }, /not declared/, true],
    ['control scales a reaction by "set"', (m) => { m.controls[0].effects[0].op = 'set' }, /only be scaled/],
    ['control default out of range', (m) => { m.controls[0].default = 99 }, /min <= default <= max/],
    ['event on unknown id', (m) => { m.events[0].add = { ghost: 1 } }, /neither a species nor a parameter/],
    ['observable on unknown term', (m) => { m.observables[0].expr = { ratio: ['sam', 'ghost'] } }, /ghost/]
  ])('rejects %s', (_, mutate, pattern, compileThrows) => {
    const m = clone(toyModel)
    mutate(m)
    const v = validateModel(m)
    expect(v.valid).toBe(false)
    expect(v.errors.join('\n')).toMatch(pattern)
    // compileModel trips over structural errors itself; the rest is validateModel's job
    if (compileThrows) expect(() => compileModel(m)).toThrow(/Invalid model/)
  })

  it('rejects non-objects without throwing', () => {
    expect(validateModel(null).valid).toBe(false)
    expect(validateModel({}).valid).toBe(false)
  })
})

describe('compileModel', () => {
  const c = compileModel(toyModel)

  it('exposes names, initial state and the stoichiometry matrix', () => {
    expect(c.names).toEqual(['met', 'sam', 'sah', 'gly', 'sar'])
    expect([...c.y0]).toEqual([30, 60, 10, 100, 0])
    const col = (id) => c.stoichiometry.map((row) => row[c.reactionIndex.get(id)])
    expect(col('mat')).toEqual([-1, 1, 0, 0, 0])
    expect(col('gnmt')).toEqual([0, -1, 1, -1, 1])
    expect(col('met_in')).toEqual([1, 0, 0, 0, 0])
    expect(c.fixed).toEqual([false, false, false, false, true])
  })

  it('derivative equals stoichiometry times fluxes, and fixed species do not move', () => {
    const y = Float64Array.from([25, 50, 12, 80, 0])
    const v = c.fluxes(0, y)
    const dy = c.derivative(0, y)
    c.stoichiometry.forEach((row, i) => {
      const expected = c.fixed[i] ? 0 : row.reduce((s, coef, j) => s + coef * v[j], 0)
      expect(dy[i]).toBeCloseTo(expected, 12)
    })
    expect(dy[4]).toBe(0)
  })

  it('evaluates rate laws with hand-computed values, including modifiers', () => {
    const y = Float64Array.from([30, 60, 10, 100, 0])
    const v = c.fluxes(0, y)
    const idx = (id) => c.reactionIndex.get(id)
    const mm = (40 * 30) / (40 + 30)
    expect(v[idx('mat')]).toBeCloseTo(mm * (500 / (500 + 60)), 10)
    expect(v[idx('gnmt')]).toBeCloseTo((12 * 60 * 100) / ((40 + 60) * (60 + 100)), 10)
    expect(v[idx('mt_other')]).toBeCloseTo((20 * 60) / (5 * (1 + 10 / 8) + 60), 10)
    expect(v[idx('drain')]).toBeCloseTo(0.2 * 30, 10)
    expect(v[idx('met_in')]).toBe(6)
  })

  it('controls scale reactions and parameters; unknown controls and overrides are errors', () => {
    const base = c.bind({}).fluxes(0, c.y0)
    const off = c.bind({ gnmtActivity: 0 }).fluxes(0, c.y0)
    const gnmt = c.reactionIndex.get('gnmt')
    expect(base[gnmt]).toBeGreaterThan(0)
    expect(off[gnmt]).toBe(0)
    expect(c.bind({ metIntake: 2 }).fluxes(0, c.y0)[c.reactionIndex.get('met_in')]).toBe(12)
    expect(c.bind({}, { vmax_mat: 80 }).getParam('vmax_mat')).toBe(80)
    expect(() => c.bind({ nope: 1 })).toThrow(/Unknown control/)
    expect(() => c.bind({}, { nope: 1 })).toThrow(/Unknown parameter/)
    expect(c.derivative(0, c.y0, { gnmtActivity: 0 })[1]).toBeGreaterThan(c.derivative(0, c.y0)[1])
  })

  it('species controls set initial conditions and fixed buffers', () => {
    const m = clone(toyModel)
    m.controls.push({ id: 'startGly', label: 'start glycine', min: 0, max: 1000, default: 100, unit: 'uM', effects: [{ target: 'species', id: 'gly', op: 'set' }] })
    const cm = compileModel(m)
    expect(cm.bind({ startGly: 400 }).y0[3]).toBe(400)
  })

  it('observables are evaluated from species, fluxes and earlier observables', () => {
    const run = simulate(toyModel, { duration: 10, samples: 3, events: [] })
    expect(run.series.samSahRatio[0]).toBeCloseTo(6, 12)
    expect(run.series.corePool[0]).toBe(100)
    expect(run.series.methylFlux[1]).toBeCloseTo(run.fluxes.gnmt[1] + run.fluxes.mt_other[1], 12)
  })

  it('the toy bolus event appears in the default run and can be replaced', () => {
    const withBolus = simulate(toyModel, { duration: 120, samples: 13 })
    const none = simulate(toyModel, { duration: 120, samples: 13, events: [] })
    expect(Math.max(...withBolus.series.gly)).toBeGreaterThan(500)
    expect(Math.max(...none.series.gly)).toBeLessThan(110)
    expect(withBolus.ok).toBe(true)
    expect(withBolus.warnings).toEqual([]) // a stiff hand-over is a note, not a warning
    expect(withBolus.summary.min.sam).toBeGreaterThan(0)
  })
})
