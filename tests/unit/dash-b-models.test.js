// @vitest-environment node
import { describe, expect, it } from 'vitest'
import * as bile from '../../src/components/dash-gut/bile-model.js'
import * as tma from '../../src/components/dash-gut/tma-model.js'
import * as knowledge from '../../src/knowledge/index.js'
import * as doses from '../../src/components/dash-gut/dose-rows.js'
import b2 from '../../src/sim/data/parameters-b2.js'

const param = Object.fromEntries(b2.parameters.map((item) => [item.id, item]))

describe('bile-acid what-if (bile-model.js)', () => {
  it('uses the BAAT constants and the bile fractions of the B2 parameter set', () => {
    const [johnson, styles] = bile.BAAT_SETS
    expect(johnson.kmGly).toBe(param['baat-km-glycine'].value / 1000)
    expect(johnson.kmTau).toBe(param['baat-km-taurine'].low / 1000)
    expect(styles.kmGly).toBe(param['baat-km-glycine'].low / 1000)
    expect(styles.kmTau).toBe(param['baat-km-taurine'].high / 1000)
    expect(bile.GLYCINE_SHARE).toMatchObject({ value: param['bile-glycine-conjugate-fraction'].value, low: param['bile-glycine-conjugate-fraction'].low, high: param['bile-glycine-conjugate-fraction'].high })
    expect(bile.GROSS_GLYCINE_MMOL_PER_DAY.value).toBe(param['glycine-bile-conjugation-gross-mmol-day'].value)
  })

  it('reproduces the B2 consistency check: rate ratio 0.44 and 0.19 x Gly/Tau, needing hepatic Gly/Tau about 7 and 16', () => {
    const [johnson, styles] = bile.BAAT_SETS
    expect(bile.rateCoefficient(johnson)).toBeCloseTo(0.44, 2)
    expect(bile.rateCoefficient(styles)).toBeCloseTo(0.19, 2)
    expect(bile.impliedGlyTau(johnson)).toBeCloseTo(6.8, 1)
    expect(bile.impliedGlyTau(styles)).toBeCloseTo(15.9, 1)
  })

  it('is calibrated to the observed 75% and moves in the right direction', () => {
    expect(bile.glycineShare()).toBeCloseTo(0.75, 10)
    expect(bile.glycineShare({ glyX: 2 })).toBeGreaterThan(0.75)
    expect(bile.glycineShare({ glyX: 2 })).toBeCloseTo(6 / 7, 10) // 3 : 1 -> 6 : 1
    expect(bile.glycineShare({ tauX: 4 })).toBeLessThan(0.75)
    expect(bile.glycineShare({ glyX: 0 })).toBe(0)
    // taurine up by the same factor as glycine cancels
    expect(bile.glycineShare({ glyX: 3, tauX: 3 })).toBeCloseTo(0.75, 10)
    expect(() => bile.glycineShare({ tauX: 0 })).toThrow(RangeError)
  })

  it('is monotone in glycine, falling in taurine, and the curve is in percent', () => {
    const grid = [0.5, 1, 2, 4]
    const curve = bile.shareCurve(grid, 1)
    expect(curve).toEqual([...curve].sort((a, b) => a - b))
    expect(curve[1]).toBeCloseTo(75, 8)
    expect(bile.shareCurve(grid, 2)[1]).toBeLessThan(curve[1])
  })

  it('splits the observed gross glycine use (6 mmol/day = 0.45 g) by the share', () => {
    const base = bile.conjugationRates(0.75)
    expect(base.glycine).toBeCloseTo(6, 10)
    expect(base.taurine).toBeCloseTo(2, 10)
    expect(bile.glycineGrams(base.glycine)).toBeCloseTo(0.45, 2)
    expect(bile.ratioText(0.75)).toBe('3.0 : 1 glycine to taurine')
    expect(bile.ratioText(0.2)).toBe('1 : 4.0 glycine to taurine')
  })
})

describe('TMA / TMAO dose response (tma-model.js)', () => {
  it('uses the yields of the B2 parameter set and the choline molar mass of the knowledge data', () => {
    expect(tma.TMA_YIELD.bolus).toMatchObject({ value: param['tma-fraction-free-choline-bolus'].value, low: param['tma-fraction-free-choline-bolus'].low, high: param['tma-fraction-free-choline-bolus'].high })
    expect(tma.TMA_YIELD.habitual).toMatchObject({ value: param['tma-fraction-habitual-diet'].value, low: param['tma-fraction-habitual-diet'].low, high: param['tma-fraction-habitual-diet'].high })
    expect(param['tma-fraction-habitual-diet'].confidence).toBe('assumed')
    expect(tma.URINARY_TMAO_RECOVERY.value).toBe(param['tmao-urinary-recovery-24h'].value)
    expect(tma.CHOLINE_MOLAR_MASS).toBe(knowledge.quantOf('quant:choline-molar-mass').value)
  })

  it('scales linearly with the dose and orders low <= value <= high', () => {
    expect(tma.tmaOutput(0, 0.5)).toBe(0)
    expect(tma.tmaOutput(3.5, 0.63)).toBeCloseTo(21.17, 1) // 33.6 mmol choline x 0.63
    expect(tma.tmaOutput(7, 0.63)).toBeCloseTo(2 * tma.tmaOutput(3.5, 0.63), 10)
    const { x, series } = tma.doseResponse([0, 3.5, 35])
    expect(x).toEqual([0, 3.5, 35])
    for (const item of series) {
      item.values.forEach((value, i) => {
        expect(item.lower[i]).toBeLessThanOrEqual(value)
        expect(item.upper[i]).toBeGreaterThanOrEqual(value)
      })
    }
    expect(() => tma.tmaOutput(-1, 0.5)).toThrow(RangeError)
  })

  it('describes the intake against the IOM UL and LOAEL', () => {
    expect(tma.intakeWords(330).code).toBe('within')
    expect(tma.intakeWords(3500).code).toBe('within')
    expect(tma.intakeWords(5000).code).toBe('above-ul')
    expect(tma.intakeWords(31000).code).toBe('above-loael')
    expect(tma.intakeWords(31000).word).toContain('8.9 times')
  })
})

describe('dose rows from the structured quantities (dose-rows.js)', () => {
  it('builds the B6 rows: IOM UL 100, EFSA UL 12, SCF UL 25', () => {
    const rows = doses.b6Rows(knowledge)
    expect(doses.ulOf(rows, 'iom')).toBe(100)
    expect(doses.ulOf(rows, 'efsa')).toBe(12)
    expect(doses.ulOf(rows, 'scf')).toBe(25)
    expect(rows.find((row) => row.id === 'iom').markers.map((m) => m.kind)).toEqual(['rda', 'ul'])
    expect(rows.find((row) => row.id === 'efsa').markers.map((m) => m.kind)).toEqual(['pri', 'ul'])
  })

  it('builds the choline rows: IOM UL 3500, EFSA no UL (a note instead)', () => {
    const rows = doses.cholineRows(knowledge)
    expect(doses.ulOf(rows, 'iom')).toBe(3500)
    expect(doses.ulOf(rows, 'efsa')).toBeNull()
    expect(rows.find((row) => row.id === 'efsa').noUlNote).toMatch(/no tolerable upper/i)
  })

  it('converts a P5P label dose to B6 on the pyridoxine basis by molar mass', () => {
    const { mg, fraction } = doses.b6Equivalent(knowledge, 'p5p', 100)
    expect(fraction).toBeCloseTo(169.18 / 247.14, 6)
    expect(mg).toBeCloseTo(68.46, 1)
    expect(doses.b6Equivalent(knowledge, 'pyridoxine', 50).mg).toBe(50)
    expect(doses.b6LabelDose(knowledge, 'p5p', mg)).toBeCloseTo(100, 8)
    expect(() => doses.b6Equivalent(knowledge, 'nope', 1)).toThrow(/Unknown B6 form/)
  })

  it('states the dose against a UL in words, and says so when there is none', () => {
    expect(doses.timesUl(24, 12)).toEqual({ times: 2, word: '2.0 times the UL' })
    expect(doses.timesUl(6, 12).word).toBe('50% of the UL')
    expect(doses.timesUl(5, null).word).toBe('No UL to compare')
  })
})
