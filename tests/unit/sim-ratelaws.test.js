// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  MODIFIER_LAWS, RATE_LAWS, allostericActivation, allostericInhibition, competitiveInhibition, constantInput, firstOrder,
  hill, ligandModifier, massAction, michaelisMenten, mixedInhibition, noncompetitiveInhibition, orderedBiBi, pingPong,
  randomBiBi, reversibleMassAction, reversibleMM, substrateInhibition, uncompetitiveInhibition
} from '../../src/sim/index.js'

describe('rate laws against hand-computed values', () => {
  it('mass action and first order', () => {
    expect(massAction(2, 3, 4)).toBe(24)
    expect(massAction(0.5, 8)).toBe(4)
    expect(firstOrder(0.25, 8)).toBe(2)
    expect(reversibleMassAction(2, 1, 3, 4)).toBe(2)
    expect(reversibleMassAction(2, 1, 1, 4)).toBe(-2)
    expect(constantInput(5)).toBe(5)
  })

  it('Michaelis-Menten', () => {
    expect(michaelisMenten(10, 5, 5)).toBe(5)
    expect(michaelisMenten(10, 5, 15)).toBeCloseTo(7.5, 12)
    expect(michaelisMenten(10, 5, 1e12)).toBeCloseTo(10, 6)
  })

  it('reversible MM obeys the Haldane relationship', () => {
    expect(reversibleMM(10, 2, 4, 3, 6, 3)).toBeCloseTo((5 * 5) / 4.75, 12)
    expect(reversibleMM(10, 2, 4, 3, 2, 6)).toBeCloseTo(0, 12) // P/S = Keq: equilibrium
    expect(reversibleMM(10, 2, 4, 3, 1, 6)).toBeCloseTo(-5 / 3, 12) // beyond equilibrium: reverse flux
  })

  it('bi-substrate laws', () => {
    expect(orderedBiBi(10, 2, 3, 4, 6, 8)).toBeCloseTo(480 / 104, 12)
    expect(randomBiBi(10, 3, 4, 6, 8)).toBeCloseTo(480 / 108, 12)
    expect(pingPong(10, 3, 4, 6, 8)).toBeCloseTo(5, 12)
    expect(orderedBiBi(10, 2, 3, 4, 0, 8)).toBe(0)
  })

  it('inhibition modes', () => {
    // Vmax 10, Km 5, Ki 2, S 10, I 4
    expect(competitiveInhibition(10, 5, 2, 10, 4)).toBeCloseTo(4, 12)
    expect(uncompetitiveInhibition(10, 5, 2, 10, 4)).toBeCloseTo(100 / 35, 12)
    expect(noncompetitiveInhibition(10, 5, 2, 10, 4)).toBeCloseTo(100 / 45, 12)
    expect(mixedInhibition(10, 5, 2, 1, 10, 4)).toBeCloseTo(100 / 65, 12)
    expect(competitiveInhibition(10, 5, 2, 10, 0)).toBeCloseTo(michaelisMenten(10, 5, 10), 12)
    expect(substrateInhibition(10, 5, 20, 10)).toBeCloseTo(5, 12)
  })

  it('Hill and the multiplicative modifiers', () => {
    expect(hill(10, 5, 2, 10)).toBeCloseTo(8, 12)
    expect(hill(10, 5, 1, 5)).toBeCloseTo(5, 12)
    expect(allostericActivation(5, 5, 1, 3)).toBeCloseTo(2, 12)
    expect(allostericActivation(0, 5, 1, 3)).toBe(1)
    expect(allostericInhibition(5, 5, 1, 0.2)).toBeCloseTo(0.6, 12)
    expect(allostericInhibition(0, 5)).toBe(1)
    expect(allostericInhibition(1e9, 5)).toBeCloseTo(0, 6)
    expect(ligandModifier(5, 5, 0.5)).toBeCloseTo(0.75, 12)
    expect(ligandModifier(10, 5, 3, 2)).toBeCloseTo(2.6, 12)
  })

  it('guards against negative, zero and NaN inputs', () => {
    const laws = [
      () => massAction(2, -1, 4), () => massAction(Number.NaN, 1), () => michaelisMenten(10, 5, -3), () => michaelisMenten(10, 5, Number.NaN),
      () => michaelisMenten(10, 0, 0), () => hill(10, 5, 2, -4), () => hill(10, 0, 2, 0), () => orderedBiBi(10, 2, 3, 4, -1, Number.NaN),
      () => competitiveInhibition(10, 5, 0, 10, 4), () => substrateInhibition(10, 5, 20, Number.NaN), () => reversibleMM(10, 0, 4, 3, 6, 3),
      () => pingPong(10, 3, 4, Number.POSITIVE_INFINITY, 1), () => constantInput(-2), () => constantInput(Number.NaN)
    ]
    for (const law of laws) {
      const v = law()
      expect(Number.isFinite(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(0)
    }
    expect(michaelisMenten(10, 5, -3)).toBe(0)
    expect(competitiveInhibition(10, 5, 0, 10, 4)).toBeCloseTo(michaelisMenten(10, 5, 10), 12) // unusable Ki = no inhibitor
    expect(allostericInhibition(-5, 5)).toBe(1)
  })

  it('the registry evaluates the same functions', () => {
    expect(RATE_LAWS.michaelisMenten.eval({ Vmax: 10, Km: 5 }, { S: 5 })).toBe(5)
    expect(RATE_LAWS.hill.eval({ Vmax: 10, K: 5, n: 2 }, { S: 10 })).toBeCloseTo(8, 12)
    expect(RATE_LAWS.massAction.eval({ k: 2 }, { sub: 12 })).toBe(24)
    expect(MODIFIER_LAWS.allostericInhibition.eval({ Ki: 5, n: 1, residual: 0.2 }, { I: 5 })).toBeCloseTo(0.6, 12)
    for (const [name, law] of Object.entries({ ...RATE_LAWS, ...MODIFIER_LAWS })) {
      expect(Array.isArray(law.params), name).toBe(true)
      expect(typeof law.eval, name).toBe('function')
    }
  })
})
