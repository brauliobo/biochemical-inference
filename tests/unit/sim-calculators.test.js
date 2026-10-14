// @vitest-environment node
import { describe, expect, it } from 'vitest'
import * as calc from '../../src/sim/calculators.js'
import quantRecords from '../../src/knowledge/data/quant.js'
import { cholineForGlycine as quantCholineForGlycine, glycineFromCholine as quantGlycineFromCholine, makeQuantIndex, quantOf } from '../../src/knowledge/quant.js'
import b2 from '../../src/sim/data/parameters-b2.js'

const index = makeQuantIndex(quantRecords)
const q = (id) => quantOf(index, `quant:${id}`)
const b2p = Object.fromEntries(b2.parameters.map((p) => [p.id, p]))
const budget = Object.fromEntries(b2.fluxBudgets.map((b) => [b.id, b]))
const STATUS = ['computed', 'estimate', 'hypothesis']

const expectResultShape = (r) => {
  for (const k of ['value', 'low', 'high', 'unit', 'sources', 'status']) expect(r, k).toHaveProperty(k)
  expect(typeof r.value).toBe('number')
  expect(r.low).toBeLessThanOrEqual(r.value + 1e-9)
  expect(r.high).toBeGreaterThanOrEqual(r.value - 1e-9)
  expect(r.sources.length).toBeGreaterThan(0)
  expect(STATUS).toContain(r.status)
}

describe('embedded constants agree with the knowledge and B2 data', () => {
  it('molar masses, content fractions, UL and AI', () => {
    expect(calc.CONSTANTS.glycineMolarMass).toBe(q('glycine-molar-mass').value)
    expect(calc.CONSTANTS.cholineMolarMass).toBe(q('choline-molar-mass').value)
    expect(calc.CONSTANTS.betaineHclMolarMass).toBe(q('betaine-hcl-molar-mass').value)
    expect(calc.CONSTANTS.betaineHclMmolPerG).toBe(q('betaine-hcl-conversion-mmol-h-per-g').value)
    expect(calc.CONSTANTS.cholineUlMgPerDay).toBe(q('choline-ul-iom-adults').value)
    expect(q('choline-ul-efsa').value).toBeNull() // EFSA: no UL
    expect(calc.CONSTANTS.cholineAiMgPerDay.menIom).toBe(q('choline-ai-iom-men').value)
    expect(calc.CONSTANTS.cholineAiMgPerDay.womenIom).toBe(q('choline-ai-iom-women').value)
    expect(calc.CONSTANTS.cholineAiMgPerDay.efsa).toBe(q('choline-ai-efsa-adults').value)
    const frac = (id) => q(id)
    expect(calc.SALT_FRACTIONS['choline-bitartrate'].value).toBe(frac('choline-bitartrate-content-fraction-choline').value)
    expect(calc.SALT_FRACTIONS['alpha-gpc'].value).toBe(frac('alpha-gpc-supplement-content-fraction-choline').value)
    expect(calc.SALT_FRACTIONS.citicoline.value).toBe(frac('citicoline-supplement-content-fraction-choline').value)
    expect(calc.SALT_FRACTIONS['phosphatidylcholine-pure'].low).toBe(frac('phosphatidylcholine-supplement-content-fraction-choline').low)
    expect(calc.SALT_FRACTIONS['phosphatidylcholine-pure'].high).toBe(frac('phosphatidylcholine-supplement-content-fraction-choline').high)
    expect(calc.SALT_FRACTIONS['betaine-hcl'].value).toBe(frac('betaine-hcl-content-fraction-betaine').value)
    expect(calc.SALT_FRACTIONS['magnesium-glycinate'].value).toBe(frac('magnesium-glycinate-content-fraction-magnesium').value)
    expect(q('magnesium-glycinate-content-fraction-glycine').value).toBeCloseTo(0.871, 10)
    expect(q('collagen-peptides-content-fraction-glycine').low).toBe(0.2)
    expect(q('collagen-peptides-content-fraction-glycine').high).toBe(0.25)
    expect(q('type-ii-collagen-trial-dose-uc-ii').value).toBe(40)
  })

  it('B2 acid, methyl and choline numbers', () => {
    for (const [k, id] of [['basalAcidMmolPerH', 'gastric-bao'], ['acid24hMmol', 'gastric-acid-24h'], ['dietaryCholineMmolPerDay', 'choline-intake-mmol-day'], ['transmethylationMmolPerDay', 'flux-transmethylation-total']]) {
      expect(calc.CONSTANTS[k].value, k).toBe(b2p[id].value)
      expect(calc.CONSTANTS[k].low, k).toBe(b2p[id].low)
      expect(calc.CONSTANTS[k].high, k).toBe(b2p[id].high)
    }
    const per = b2p['nnmt-methyl-per-g-niacin']
    expect([calc.CONSTANTS.niacinMethylMmolPerG.value, calc.CONSTANTS.niacinMethylMmolPerG.high]).toEqual([per.value, per.high])
  })

  it('the deficit constant equals B2 sinks minus sources (collagen 12 g/day; 4 g/day for the low end)', () => {
    const sinks = budget['glycine-sinks'].items
    const sum = (list, key) => list.reduce((a, i) => a + i[key], 0)
    const supply = sum(budget['glycine-sources'].items, 'value')
    expect(calc.GLYCINE_DEFICIT.value).toBeCloseTo(sum(sinks, 'value') - supply, 1) // 15.23 - 5.156 = 10.07 (authors round to 10.08 / 10)
    expect(calc.GLYCINE_DEFICIT.low).toBeCloseTo(sum(sinks, 'value') - 8 - supply, 1) // collagen at its low end (4 instead of 12)
    expect(sinks[0].low).toBe(4)
  })
})

describe('glycine <-> choline', () => {
  it('10 g glycine needs 13.88 g choline at 100% conversion (hand: 10 / 75.07 x 104.17)', () => {
    const r = calc.cholineForGlycine({ glycineG: 10 })
    expectResultShape(r)
    expect(r.value).toBeCloseTo((10 / 75.07) * 104.17, 10)
    expect(r.value).toBeCloseTo(13.876, 3)
    expect(r.status).toBe('computed')
    expect(r.unit).toBe('g choline/day')
    expect(r.low).toBe(r.value) // the stoichiometric floor
    expect(r.ulMultiple).toBeCloseTo(13.876 / 3.5, 3) // about 4 times the UL
    expect(r.saltGrams['choline-bitartrate']).toBeCloseTo(13.876 / 0.411, 2) // 33.76 g
    expect(r.saltGrams.citicoline).toBeCloseTo(13.876 / 0.213, 1)
    // identical to the knowledge-layer function
    expect(r.value).toBeCloseTo(quantCholineForGlycine(index, { glycineGrams: 10 }).cholineGrams, 10)
  })

  it('conversion slider: 50% doubles, 45% gives ~30.8 g, and the alternatives list is labelled', () => {
    const half = calc.cholineForGlycine({ glycineG: 10, conversion: 0.5 })
    expect(half.value).toBeCloseTo(2 * 13.8763, 3)
    expect(half.status).toBe('estimate')
    expect(half.high).toBeCloseTo(4 * 13.8763, 3) // conversion 0.25
    expect(calc.cholineForGlycine({ glycineG: 10, conversion: 0.45 }).value).toBeCloseTo(30.836, 2)
    const ids = half.alternatives.map((a) => a.id)
    expect(ids).toEqual(expect.arrayContaining(['stoichiometric', 'melendez-hevia', 'practitioner']))
    for (const a of half.alternatives) {
      expect(STATUS).toContain(a.status)
      expect(a.cholineG).toBeCloseTo(13.8763 / a.conversion, 3)
    }
    expect(half.alternatives.find((a) => a.id === 'practitioner').status).toBe('hypothesis')
    expect(calc.CONVERSION_PARTITIONS.find((a) => a.id === 'melendez-hevia').conversion).toBeCloseTo(1.43 / 3.2, 3)
    expect(() => calc.cholineForGlycine({ glycineG: 10, conversion: 0 })).toThrow(RangeError)
    expect(() => calc.cholineForGlycine({ glycineG: 10, conversion: 1.2 })).toThrow(RangeError)
  })

  it('glycineFromCholine inverts it: the 3.5 g UL gives 2.52 g glycine at most', () => {
    const r = calc.glycineFromCholine({ cholineG: 3.5 })
    expectResultShape(r)
    expect(r.value).toBeCloseTo((3.5 / 104.17) * 75.07, 10)
    expect(r.value).toBeCloseTo(2.522, 3)
    expect(r.value).toBeCloseTo(quantGlycineFromCholine(index, { cholineGrams: 3.5 }), 10)
    expect(calc.glycineFromCholine({ cholineG: 3.5, conversion: 0.447 }).value).toBeCloseTo(2.522 * 0.447, 3)
    const round = calc.glycineFromCholine({ cholineG: calc.cholineForGlycine({ glycineG: 7 }).value })
    expect(round.value).toBeCloseTo(7, 10)
  })

  it('choline within the UL covers about 10% of the 10 g/day deficit estimate at 44.7% conversion', () => {
    const r = calc.cholineCoverageOfDeficit()
    expectResultShape(r)
    // hand: headroom 3500 - 3.2 mmol x 104.17 = 3166.656 mg -> x 75.07/104.17 x 0.447 = 1020.1 mg glycine; deficit 15.23 - 5.15 = 10.08 g
    const headroom = 3500 - 3.2 * 104.17
    const glycine = (headroom / 1000 / 104.17) * 75.07 * 0.447
    expect(r.headroomMg).toBeCloseTo(headroom, 6)
    expect(r.glycineAtUlG).toBeCloseTo(glycine, 8)
    expect(r.value).toBeCloseTo(glycine / 10.08, 8)
    expect(r.value).toBeCloseTo(0.1012, 3)
    expect(r.low).toBeLessThan(r.value)
    expect(r.high).toBeLessThanOrEqual(1) // capped at the whole deficit
    expect(r.high).toBeGreaterThan(r.value)
    // a stoichiometric ceiling (100%) covers about 22% of the deficit, never the whole deficit
    const ceiling = calc.cholineCoverageOfDeficit({ conversion: 1 })
    expect(ceiling.value).toBeCloseTo(((headroom / 1000 / 104.17) * 75.07) / 10.08, 6)
    expect(ceiling.value).toBeLessThan(0.25)
    // structured data for the charts
    expect(r.rangeBar.markers.map((m) => m.label)).toEqual(expect.arrayContaining(['IOM UL', 'Typical diet']))
    expect(r.rangeBar.bands.some((b) => /AI/.test(b.label))).toBe(true)
    expect(r.rangeBar.markers.find((m) => m.label === 'IOM UL').value).toBe(3500)
    const sum = r.stackedBar.items.reduce((a, i) => a + i.value, 0)
    expect(sum).toBeCloseTo(r.stackedBar.total, 8)
    expect(r.sources).toContain('quant:choline-ul-efsa') // EFSA: none
    expect(calc.GLYCINE_DEFICIT.value).toBeCloseTo(15.23 - 5.15, 10)
  })
})

describe('salts and products', () => {
  it('elemental choline: bitartrate 41.1%, alpha-GPC 40.5%, citicoline 21.3%, PC 13-14%', () => {
    const e = (salt, mg) => calc.elementalFromSalt({ salt, mg })
    expect(e('choline-bitartrate', 1000).value).toBeCloseTo(411, 8)
    expect(e('alpha-gpc', 1000).value).toBeCloseTo(405, 8)
    expect(e('citicoline', 500).value).toBeCloseTo(106.5, 8)
    const pc = e('phosphatidylcholine-pure', 1000)
    expect([pc.low, pc.value, pc.high]).toEqual([130, 135, 140])
    expectResultShape(pc)
    // fractions come from molar masses: 104.17 / 253.25 etc.
    expect(104.17 / 253.25).toBeCloseTo(0.411, 3)
    expect(104.17 / 257.22).toBeCloseTo(0.405, 3)
    expect(104.17 / 488.32).toBeCloseTo(0.213, 3)
    expect(calc.elementalFromSalt({ salt: 'choline-bitartrate', mg: 411, reverse: true }).value).toBeCloseTo(1000, 6)
    const pcRev = calc.elementalFromSalt({ salt: 'phosphatidylcholine-pure', mg: 135, reverse: true })
    expect([pcRev.value, pcRev.low, pcRev.high].map((x) => Math.round(x * 1e6) / 1e6)).toEqual([1000, Math.round((135 / 0.14) * 1e6) / 1e6, Math.round((135 / 0.13) * 1e6) / 1e6])
    expect(pcRev.unit).toBe('mg salt')
    expect(() => calc.elementalFromSalt({ salt: 'unobtainium', mg: 1 })).toThrow(RangeError)
  })

  it('magnesium glycinate: 400 mg Mg is 2837 mg salt and 2.47 g glycine', () => {
    const r = calc.magnesiumGlycinateGlycine({ magnesiumMg: 400 })
    expectResultShape(r)
    expect(r.saltMg).toBeCloseTo(400 / 0.141, 6)
    expect(r.value).toBeCloseTo((400 / 0.141) * 0.871, 6)
    expect(r.value).toBeCloseTo(2470.9, 1)
    expect(r.value / r.saltMg).toBeCloseTo((2 * 75.07) / 172.43, 3)
    expect(calc.magnesiumGlycinateGlycine({ magnesiumMg: 100 }).value).toBeCloseTo(617.7, 1)
  })

  it('collagen peptides: 33% of residues but 20-25% of the mass; UC-II 40 mg is trivial', () => {
    const r = calc.collagenGlycine({ powderG: 10 })
    expectResultShape(r)
    expect([r.low, r.value, r.high]).toEqual([2, 2.25, 2.5])
    expect(r.residueFraction).toBeCloseTo(1 / 3, 10)
    expect(r.value).toBeLessThan(10 * r.residueFraction) // not 3.3 g
    const u = calc.ucIIGlycine({ mg: 40 })
    expectResultShape(u)
    expect(u.value).toBeCloseTo(9, 8)
    expect(u.unit).toBe('mg glycine')
    expect(u.value / 2250).toBeLessThan(0.005) // 0.4% of the dietary glycine (~2250 mg/day)
  })
})

describe('betaine HCl against the acid output', () => {
  it('650 mg is 4.23 mmol H+, about 0.8 h of basal output', () => {
    const r = calc.betaineHclAcidLoad({ grams: 0.65 })
    expectResultShape(r)
    expect(r.value).toBeCloseTo(650 / 153.61, 8) // 4.2315
    expect(r.value).toBeCloseTo(4.2315, 3)
    expect(calc.betaineHclAcidLoad({ grams: 1 }).value).toBeCloseTo(6.51, 2)
    expect(r.basalHoursEquivalent.value).toBeCloseTo(4.2315 / 5.1, 4) // 0.83 h
    expect(r.basalHoursEquivalent.low).toBeCloseTo(4.2315 / 6.5, 4)
    expect(r.basalHoursEquivalent.high).toBeCloseTo(4.2315 / 3, 4)
    expect(r.shareOf24h.value).toBeCloseTo(4.2315 / 208.3, 4)
    expect(calc.betaineHclAcidLoad({ grams: 3.25 }).basalHoursEquivalent.value).toBeCloseTo(21.16 / 5.1, 2)
  })
})

describe('glycine budget and SAM methyl accounting', () => {
  it('uses 15.23 g/day, supply 5.16 g/day, deficit ~10.07 g/day from the B2 flux budgets, with wide and contested items flagged', () => {
    const b = calc.glycineBudget(b2.fluxBudgets)
    expectResultShape(b.sinks.total)
    expectResultShape(b.sources.total)
    expectResultShape(b.balance)
    expect(b.sinks.total.value).toBeCloseTo(12 + 1 + 0.57 + 0.55 + 0.24 + 0.21 + 0.6 + 0.06, 10)
    expect(b.sources.total.value).toBeCloseTo(2.54 + 0.14 + 0.09 + 0.11 + 0.02 + 0.006 + 2.25, 10)
    expect(b.balance.value).toBeCloseTo(15.23 - 5.156, 3)
    expect(b.balance.low).toBeLessThan(0) // a surplus is within the ranges (tracer synthesis up to 44 g/day)
    expect(b.balance.high).toBeGreaterThan(b.balance.value)
    expect(b.sinks.items.filter((i) => i.wide).map((i) => i.label.split(' ')[0])).toEqual(expect.arrayContaining(['Collagen', 'Other']))
    expect(b.sinks.items.find((i) => /Haem/.test(i.label)).wide).toBe(false)
    expect(b.synthesisEstimates).toMatchObject({ additive: false })
    expect(b.synthesisEstimates.items.map((i) => i.value)).toEqual([2.9, 7.4, 11.2, 24.5, 44.3])
    expect(b.balance.contested.join(' ')).toMatch(/deficit/)
    expect(b.balance.contested.join(' ')).toMatch(/tracer/i)
    expect(() => calc.glycineBudget()).toThrow(RangeError) // the B2 fluxBudgets must be passed in
  })

  it('niacin 2 g/day takes 8.76 mmol methyl, 44% of 20 mmol/day (a lower bound; the SAM effect is a hypothesis)', () => {
    const r = calc.niacinMethylDemand({ niacinG: 2 })
    expectResultShape(r)
    expect(r.value).toBeCloseTo(2 * 4.38, 10)
    expect(r.high).toBeCloseTo(2 * 6.3, 10)
    expect(r.shareOfTransmethylation.value).toBeCloseTo(8.76 / 20, 10)
    expect(r.shareOfTransmethylation.low).toBeCloseTo(8.76 / 23.5, 10)
    expect(r.shareOfTransmethylation.high).toBeCloseTo(12.6 / 15, 10)
    expect(r.note).toMatch(/hypothesis/)
    expect(calc.niacinMethylDemand({ niacinG: 2, totalMmolPerDay: 10 }).shareOfTransmethylation.value).toBeCloseTo(0.876, 10)
    expect(calc.niacinMethylDemand({ niacinG: 0 }).value).toBe(0)
  })

  it('every public calculator returns the provenance fields', () => {
    for (const r of [calc.cholineForGlycine(), calc.glycineFromCholine(), calc.cholineCoverageOfDeficit(), calc.elementalFromSalt({ salt: 'citicoline', mg: 250 }), calc.elementalFromSalt({ salt: 'alpha-gpc', mg: 100, reverse: true }), calc.magnesiumGlycinateGlycine(), calc.collagenGlycine(), calc.ucIIGlycine(), calc.betaineHclAcidLoad(), calc.niacinMethylDemand()]) expectResultShape(r)
  })
})
