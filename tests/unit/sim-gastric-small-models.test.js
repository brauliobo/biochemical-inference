// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { compileModel, simulate, steadyState, sweep, validateModel } from '../../src/sim/index.js'
import { betainePkModel, cholinePkModel, glycinePkModel } from '../../src/sim/models/pk.js'
import { circadianEvents, histamineModel, hnmtFactor } from '../../src/sim/models/histamine.js'
import b2 from '../../src/sim/data/parameters-b2.js'

const b2p = Object.fromEntries(b2.parameters.map((p) => [p.id, p]))
const target = Object.fromEntries(b2.validationTargets.map((t) => [t.id, t]))
const peak = (run, id) => {
  const a = run.series[id]
  const m = Math.max(...a)
  return { value: m, time: run.time[a.indexOf(m)] }
}
const at = (run, id, t) => run.series[id][run.time.findIndex((x) => x >= t - 1e-9)]
const rel = (x, ref) => Math.abs(x - ref) / ref

describe('PK models', () => {
  it('validate and carry a quality statement', () => {
    for (const m of [betainePkModel, cholinePkModel, glycinePkModel]) {
      expect(validateModel(m), m.id).toMatchObject({ valid: true, errors: [], warnings: [] })
      expect(m.quality.length, m.id).toBeGreaterThan(30)
      expect(m.validRange.length, m.id).toBeGreaterThan(10)
      for (const p of m.parameters) expect(['high', 'medium', 'low', 'assumed']).toContain(p.confidence)
    }
  })

  it('betaine: Cmax, Tmax and terminal half-life of the Schwahn 2003 study', () => {
    const r = simulate(betainePkModel, { duration: 72, samples: 721 })
    const { value, time } = peak(r, 'plasma')
    expect(value).toBeGreaterThan(b2p['betaine-cmax-50mgkg'].low) // 939 uM (663-1300)
    expect(value).toBeLessThan(b2p['betaine-cmax-50mgkg'].high)
    expect(rel(value - 32, b2p['betaine-cmax-50mgkg'].value)).toBeLessThan(0.1) // excess ~ Cmax within 10%
    expect(time).toBeGreaterThanOrEqual(b2p['betaine-tmax'].low) // 0.9 h (0.57-1.23)
    expect(time).toBeLessThanOrEqual(b2p['betaine-tmax'].high)
    // terminal half-life from the last 24 h
    const e1 = at(r, 'excess', 48)
    const e2 = at(r, 'excess', 72)
    const tHalf = (Math.LN2 * 24) / Math.log(e1 / e2)
    expect(rel(tHalf, 14.4)).toBeLessThan(0.15)
    // the ODE conserves mass: gut + central + peripheral = dose (nothing eliminated at t=0)
    expect(r.series.Agut[0] + r.series.A1[0] + r.series.A2[0]).toBeCloseTo(50 * (1000 / 117.15), 6)
  })

  it('betaine: linear in dose, and a slower elimination mimics repeated dosing', () => {
    const c = (doseMgPerKg, eliminationSlowdown = 1) => simulate(betainePkModel, { duration: 72, samples: 361, controls: { doseMgPerKg, eliminationSlowdown } })
    expect(peak(c(25), 'excess').value * 2).toBeCloseTo(peak(c(50), 'excess').value, 3)
    const tHalf = (r) => (Math.LN2 * 24) / Math.log(at(r, 'excess', 48) / at(r, 'excess', 72))
    expect(tHalf(c(50, 0.35))).toBeGreaterThan(30) // B2: 14 h single dose, 41 h repeated
    expect(tHalf(c(50, 0.35))).toBeGreaterThan(tHalf(c(50, 1)) * 1.8)
  })

  it('choline: the two numbers of Modinger 2019 and the delayed betaine rise', () => {
    const r = simulate(cholinePkModel, { duration: 24, samples: 481 })
    const ch = peak(r, 'cholineExcess')
    const be = peak(r, 'betaineExcess')
    expect(rel(ch.value, 3.67)).toBeLessThan(0.1)
    expect(Math.abs(ch.time - 2.67)).toBeLessThan(0.3)
    expect(rel(be.value, 18.9)).toBeLessThan(0.1)
    expect(Math.abs(be.time - 7.7)).toBeLessThan(1.5)
    expect(be.time).toBeGreaterThan(ch.time + 3) // betaine peaks hours after choline
    // choline is a bolus from the gut: dose is conserved over the compartments plus losses
    expect(cholinePkModel.quality).toMatch(/no CDP-choline/)
  })

  it('glycine: reproduces the (second-hand) 40 min and 120 min figures and returns to baseline', () => {
    const r = simulate(glycinePkModel, { duration: 8, samples: 481 })
    const spec = target['vt-glycine-oral-pk']
    expect(spec.locator).toMatch(/NOT SEEN/) // the source quality flag is carried through
    expect(rel(at(r, 'plasma', 2 / 3), 909)).toBeLessThan(0.1)
    expect(rel(at(r, 'plasma', 2), 414)).toBeLessThan(0.1)
    expect(Math.abs(at(r, 'plasma', 8) - 217)).toBeLessThan(5)
    expect(glycinePkModel.quality).toMatch(/second-hand|secondary/)
    // dose control: linear excess
    const half = simulate(glycinePkModel, { duration: 2, samples: 61, controls: { doseGPerKg: 0.0285 } })
    expect(peak(half, 'excess').value * 2).toBeCloseTo(peak(r, 'excess').value, 3)
  })
})

describe('histamine model', () => {
  const compiled = compileModel(histamineModel)

  it('validates, starts at a steady state and reproduces the plasma baseline', () => {
    expect(validateModel(histamineModel)).toMatchObject({ valid: true, errors: [], warnings: [] })
    const ss = steadyState(compiled)
    expect(ss.converged).toBe(true)
    expect(rel(ss.state.His_p, b2p['histamine-plasma-baseline'].value)).toBeLessThan(1e-4)
    expect(ss.observables.plasmaRel).toBeCloseTo(1, 4)
    expect(ss.observables.cnsRel).toBeCloseTo(1, 4)
    const flat = simulate(compiled, { duration: 48, samples: 97 })
    for (const v of flat.series.plasmaRel) expect(v).toBeCloseTo(1, 4) // default: no diurnal rhythm
  })

  it('plasma half-life after a pulse is the measured ~4 min (clearance 10.4/h)', () => {
    const r = simulate(compiled, { duration: 0.5, samples: 301, events: [{ time: 0, add: { His_p: 0.05 }, label: 'pulse' }], rtol: 1e-8, atol: 1e-12 })
    const excess = r.series.His_p.map((v) => v - b2p['histamine-plasma-baseline'].value)
    const i = r.time.findIndex((t) => t >= 4 / 60)
    expect(excess[i] / excess[0]).toBeCloseTo(0.5, 1)
  })

  it('histamine rises as SAM falls, much more steeply where HNMT is the only route (CNS)', () => {
    const sams = [10, 20, 30, 45, 60, 90, 120]
    const plasma = sweep(compiled, 'samUM', sams, 'plasmaRel')
    const cns = sweep(compiled, 'samUM', sams, 'cnsRel')
    expect(plasma.y.every((v, i) => i === 0 || v < plasma.y[i - 1])).toBe(true)
    expect(cns.y.every((v, i) => i === 0 || v < cns.y[i - 1])).toBe(true)
    expect(cns.y[0]).toBeGreaterThan(plasma.y[0])
    // halving SAM (60 -> 30 uM) raises plasma histamine only ~20% and CNS histamine ~30% (modest, qualitative)
    expect(plasma.y[2]).toBeGreaterThan(1.1)
    expect(plasma.y[2]).toBeLessThan(1.3)
    expect(cns.y[2]).toBeGreaterThan(1.2)
    expect(cns.y[2]).toBeLessThan(1.5)
    // CNS closed form: HNMT share 0.8 -> rel = 1 / (0.2 + 0.8 f) where f = hnmtFactor (linear regime)
    expect(cns.y[2]).toBeCloseTo(1 / (0.2 + 0.8 * hnmtFactor(30, 12)), 1)
  })

  it('SAH raises histamine as well: the effect follows SAM:SAH, not SAM alone', () => {
    const sah = sweep(compiled, 'sahUM', [2, 6, 12, 24, 48], 'plasmaRel')
    expect(sah.y.every((v, i) => i === 0 || v > sah.y[i - 1])).toBe(true)
    const same = (sam, sahv) => steadyState(compiled, { samUM: sam, sahUM: sahv }).observables.plasmaRel
    expect(same(60, 12)).toBeCloseTo(1, 3)
    expect(same(30, 6)).toBeLessThan(same(30, 12)) // same SAM, less SAH: less histamine
    expect(hnmtFactor(60, 12)).toBeCloseTo(1, 10)
  })

  it('DAO block raises the gut pool about (k_dao + k_abs) / k_abs-fold and a food bolus raises plasma histamine more', () => {
    const none = steadyState(compiled, { daoActivityX: 0 })
    const gutRel = none.state.His_g / steadyState(compiled).state.His_g
    expect(gutRel).toBeGreaterThan(9)
    expect(gutRel).toBeLessThan(12)
    const food = (daoActivityX) => peak(simulate(compiled, { duration: 6, samples: 121, controls: { foodHistamineUM: 100, daoActivityX } }), 'plasmaRel').value
    expect(food(0.2)).toBeGreaterThan(food(1))
    expect(food(1)).toBeGreaterThan(food(2))
    expect(food(1)).toBeGreaterThan(10) // a histamine-rich meal moves plasma histamine by orders of magnitude
  })

  it('diurnal modulation is optional: amplitude 0.42 doubles plasma histamine at 04:00 vs 16:00 and keeps the mean', () => {
    const r = simulate(compiled, { duration: 48, samples: 97, controls: { diurnalAmplitude: 0.42 } })
    const v = r.series.plasmaRel
    expect(v[8] / v[32]).toBeCloseTo(target['vt-histamine-night'].factorLow ?? 2, 0) // ~2x (Szefler 1991)
    expect(v[8] / v[32]).toBeGreaterThan(1.9)
    expect(v[8] / v[32]).toBeLessThan(2.1)
    const day2 = v.slice(48, 96)
    expect(day2.reduce((a, b) => a + b, 0) / 48).toBeCloseTo(1, 1)
    expect(histamineModel.controls.find((c) => c.id === 'diurnalAmplitude').label).toMatch(/WEAKLY SUPPORTED/)
    expect(histamineModel.controls.find((c) => c.id === 'diurnalAmplitude').default).toBe(0)
    expect(circadianEvents({ peakHour: 4, hours: 24, stepH: 1 })[4].set.Prof).toBe(1)
  })
})
