import { describe, expect, it } from 'vitest'
import {
  apapDerivative,
  buildZonation,
  integrateApap,
  resolveContextBinding
} from '../../server/apap/model.js'

const controls = { durationHours: 4, stepHours: 0.01, outputEveryHours: 0.5, nacStartHours: null }
const human = () => resolveContextBinding('CONTEXT:APAP-HUMAN-LIVER', { cypActivity: 1, adductBinding: 1, zonation: 1, nacGsh: 1 }).values

describe('APAP multiscale equation set', () => {
  it('produces zero NAPQI, adduct, and injury when CYP activity is zero', () => {
    const integrated = integrateApap({ ...human(), cypRate: 0 }, controls)

    expect(integrated.outputs.every((item) => item.liverNapqi === 0 && item.adductBurden === 0 && item.injuredFraction === 0)).toBe(true)
    expect(integrated.state.totalNapqiFormed).toBe(0)
  })

  it('produces zero adduct and injury when binding is zero', () => {
    const integrated = integrateApap({ ...human(), bindingRate: 0 }, controls)

    expect(integrated.outputs.some((item) => item.liverNapqi > 0)).toBe(true)
    expect(integrated.outputs.every((item) => item.adductBurden === 0 && item.injuredFraction === 0)).toBe(true)
  })

  it('makes all metabolic zonation coefficients identical at zero amplitude', () => {
    expect(new Set(buildZonation(0))).toEqual(new Set([1]))
  })

  it('keeps all four cell-state fractions nonnegative and summing to one', () => {
    const integrated = integrateApap(human(), controls)

    for (const snapshot of integrated.snapshots) {
      for (let index = 0; index < 12; index += 1) {
        const fractions = [snapshot.healthy[index], snapshot.stressed[index], snapshot.injured[index], snapshot.recovering[index]]
        expect(Math.min(...fractions)).toBeGreaterThanOrEqual(0)
        expect(fractions.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 8)
      }
    }
    expect(integrated.maximumSumError).toBeLessThanOrEqual(1e-10)
  })

  it('accounts for APAP mass within the declared tolerance', () => {
    const integrated = integrateApap(human(), controls)
    expect(Math.abs(integrated.massResidual)).toBeLessThanOrEqual(integrated.massTolerance)
  })

  it('ignores taxon labels when numerical bindings are identical', () => {
    const values = human()
    const first = integrateApap({ ...values, taxonLabel: 'Homo sapiens' }, controls)
    const second = integrateApap({ ...values, taxonLabel: 'Mus musculus' }, controls)

    expect(second.outputs).toEqual(first.outputs)
    expect(second.snapshots).toEqual(first.snapshots)
  })

  it('limits NAC influence to the explicit NAC and GSH derivative terms', () => {
    const parameters = human()
    const integrated = integrateApap(parameters, { ...controls, durationHours: 1 })
    const withoutNac = apapDerivative(integrated.state, parameters)
    const withNac = apapDerivative({ ...integrated.state, nac: 1 }, parameters)

    for (const key of Object.keys(withoutNac)) {
      if (key === 'nac' || key === 'gsh') continue
      expect(withNac[key]).toEqual(withoutNac[key])
    }
    expect(withNac.gsh).not.toEqual(withoutNac.gsh)
  })

  it('uses visible species-specific parameter bindings', () => {
    const humanBinding = resolveContextBinding('CONTEXT:APAP-HUMAN-LIVER', { cypActivity: 1, adductBinding: 1, zonation: 1, nacGsh: 1 })
    const mouseBinding = resolveContextBinding('CONTEXT:APAP-MOUSE-LIVER', { cypActivity: 1, adductBinding: 1, zonation: 1, nacGsh: 1 })

    expect(mouseBinding.values.cypRate).not.toBe(humanBinding.values.cypRate)
    expect(mouseBinding.effectiveParameters.find((item) => item.symbol === 'initialApap')).toMatchObject({ sourceId: 'PARAMETER:APAP-MOUSE-DOSE', value: 30 })
    expect(humanBinding.effectiveParameters.find((item) => item.symbol === 'eliminationRate')).toMatchObject({ sourceId: 'PARAMETER:APAP-HUMAN-ELIMINATION', value: 0.2 })
  })

  it('is deterministic for identical bindings and numerical controls', () => {
    expect(integrateApap(human(), controls)).toEqual(integrateApap(human(), controls))
  })
})
