// Structured quantities: pure helpers, validation rules, and the shipped dataset.
import { describe, expect, it } from 'vitest'
import entities from '../../src/knowledge/data/index.js'
import quantData from '../../src/knowledge/data/quant.js'
import { buildGraph } from '../../src/knowledge/graph.js'
import {
  KINDS, UNITS, LIMIT_KINDS, betaineHclAcid, cholineForGlycine, co2VolumeFromAcid, contentFraction, convertDose, convertUnit, gasMolarVolume,
  glycineFromCholine, limitsFor, makeQuantIndex, molarMassOf, parseMolarMassFact, populationRank, quantFor, quantOf
} from '../../src/knowledge/quant.js'
import { checkQuant } from '../../src/knowledge/quant-validate.js'
import { validateKnowledge } from '../../src/knowledge/validate.js'
import * as knowledge from '../../src/knowledge/index.js'

const MICRO = 'µ'

// A tiny graph for rule tests.
const fixtureEntities = [
  { id: 'compound:x', type: 'compound', name: 'X', summary: 's', evidence: 'established', facts: { molarMass: '100.5 g/mol' } },
  { id: 'compound:y', type: 'compound', name: 'Y', summary: 's', evidence: 'established' },
  { id: 'intervention:salt', type: 'intervention', name: 'Salt', summary: 's', evidence: 'plausible' },
  { id: 'article:a1', type: 'article', name: 'A1', summary: 's', evidence: 'established' },
  { id: 'claim:c1', type: 'claim', name: 'C1', summary: 's', evidence: 'plausible' }
]
const fixtureGraph = buildGraph(fixtureEntities)
const base = (extra = {}) => ({ id: 'quant:x-ai', subject: 'compound:x', kind: 'AI', value: 10, unit: 'mg/day', basis: 'elemental', authority: 'IOM 1998', population: 'adults', refs: ['article:a1'], established: true, ...extra })
const molar = { id: 'quant:x-molar-mass', subject: 'compound:x', kind: 'molar-mass', value: 100.5, unit: 'g/mol', basis: 'compound', established: true }
const rules = (records) => checkQuant(records, fixtureGraph).map((issue) => issue.rule)

describe('units', () => {
  it('converts within a dimension', () => {
    expect(convertUnit(1500, 'mg', 'g')).toBeCloseTo(1.5, 10)
    expect(convertUnit(400, `${MICRO}g/day`, 'mg/day')).toBeCloseTo(0.4, 10)
    expect(convertUnit(2.5, 'g/day', 'mg/day')).toBeCloseTo(2500, 8)
    expect(convertUnit(5, `${MICRO}mol/L`, 'mmol/L')).toBeCloseTo(0.005, 10)
    expect(convertUnit(250, 'nmol/L', `${MICRO}mol/L`)).toBeCloseTo(0.25, 10)
    expect(convertUnit(90, 'minutes', 'hours')).toBeCloseTo(1.5, 10)
  })

  it('accepts the greek mu and the ascii u spelling of micro', () => {
    expect(convertUnit(1000, 'μg', 'mg')).toBeCloseTo(1, 10)
    expect(convertUnit(1000, 'ug', 'mg')).toBeCloseTo(1, 10)
  })

  it('refuses to convert across dimensions or unknown units', () => {
    expect(() => convertUnit(1, 'mg', 'mL')).toThrow(/cannot convert/)
    expect(() => convertUnit(1, 'mg', 'stone')).toThrow(/unknown unit/)
  })

  it('has a dimension and a positive factor for every unit', () => {
    for (const [unit, spec] of Object.entries(UNITS)) {
      expect(spec.dimension, unit).toBeTruthy()
      expect(spec.factor, unit).toBeGreaterThan(0)
    }
  })

  it('only lets kinds use dimensions that some unit has', () => {
    const dimensions = new Set(Object.values(UNITS).map((spec) => spec.dimension))
    for (const [kind, spec] of Object.entries(KINDS)) for (const dimension of spec.dimensions) expect(dimensions.has(dimension), `${kind} ${dimension}`).toBe(true)
  })

  it('parses the leading number of a molarMass fact', () => {
    expect(parseMolarMassFact('75.07 g/mol')).toBe(75.07)
    expect(parseMolarMassFact('399.45 g/mol (cation); 398.44 g/mol (zwitterion)')).toBe(399.45)
    expect(parseMolarMassFact(undefined)).toBeNull()
  })
})

describe('index and lookups', () => {
  const records = [
    base({ id: 'quant:x-ul-iom', kind: 'UL', value: 100, authority: 'IOM 1998' }),
    base({ id: 'quant:x-ai-efsa', authority: 'EFSA 2016', population: 'pregnancy', value: 12 }),
    base({ id: 'quant:x-ai-iom-women', authority: 'IOM 1998', population: 'women 19+', value: 9 }),
    base({ id: 'quant:x-ai-iom-men', authority: 'IOM 1998', population: 'men 19+', value: 11 }),
    { ...molar, id: 'quant:x-molar-mass' },
    { id: 'quant:y-molar-mass', subject: 'compound:y', kind: 'molar-mass', value: 50, unit: 'g/mol', basis: 'compound', established: true }
  ]
  const index = makeQuantIndex(records)

  it('looks up one record by id and ignores duplicates', () => {
    expect(quantOf(index, 'quant:x-ul-iom').value).toBe(100)
    const twice = makeQuantIndex([records[0], { ...records[0], value: 1 }])
    expect(twice.records).toHaveLength(1)
    expect(quantOf(twice, 'quant:x-ul-iom').value).toBe(100)
  })

  it('lists a subject ordered by kind, authority, id', () => {
    expect(quantFor(index, 'compound:x').map((record) => record.id)).toEqual(['quant:x-ai-efsa', 'quant:x-ai-iom-men', 'quant:x-ai-iom-women', 'quant:x-ul-iom', 'quant:x-molar-mass'])
    expect(quantFor(index, 'compound:unknown')).toEqual([])
  })

  it('filters by kind, authority, population, basis and established', () => {
    expect(quantFor(index, 'compound:x', { kind: 'UL' })).toHaveLength(1)
    expect(quantFor(index, 'compound:x', { kind: ['AI', 'UL'], authority: 'IOM 1998' })).toHaveLength(3)
    expect(quantFor(index, 'compound:x', { population: 'pregnancy' })).toHaveLength(1)
    expect(quantFor(index, 'compound:x', { basis: 'nothing' })).toEqual([])
    expect(quantFor(index, 'compound:x', { established: false })).toEqual([])
  })

  it('groups limits by authority in year order and kinds in reading order', () => {
    const groups = limitsFor(index, 'compound:x')
    expect(groups.map((group) => group.authority)).toEqual(['IOM 1998', 'EFSA 2016'])
    expect(groups[0].limits.map((record) => record.id)).toEqual(['quant:x-ai-iom-men', 'quant:x-ai-iom-women', 'quant:x-ul-iom'])
    expect(limitsFor(index, 'compound:y')).toEqual([])
  })

  it('ranks populations adults first, then life stages', () => {
    const ranked = ['children 1-3 y', 'pregnancy', 'men 19+', 'lactation', 'adolescents 15-17 y', 'adults', 'infants'].sort((a, b) => populationRank(a) - populationRank(b))
    expect(ranked).toEqual(['men 19+', 'adults', 'pregnancy', 'lactation', 'adolescents 15-17 y', 'children 1-3 y', 'infants'])
  })

  it('reads molar mass by compound and basis', () => {
    expect(molarMassOf(index, 'compound:x')).toBe(100.5)
    expect(molarMassOf(index, 'compound:x', 'cation')).toBeNull()
    expect(molarMassOf(index, 'compound:none')).toBeNull()
  })
})

describe('dose and stoichiometry helpers over synthetic data', () => {
  const index = makeQuantIndex([
    { id: 'quant:g-mm', subject: 'compound:glycine', kind: 'molar-mass', value: 75, unit: 'g/mol', basis: 'compound', established: true },
    { id: 'quant:c-mm', subject: 'compound:choline', kind: 'molar-mass', value: 100, unit: 'g/mol', basis: 'cation', established: true },
    { id: 'quant:salt-fraction', subject: 'intervention:choline-bitartrate', kind: 'content-fraction', value: 0.4, unit: 'fraction', basis: 'by mass', target: 'compound:choline', established: true },
    { id: 'quant:hcl-mm', subject: 'intervention:betaine-hcl', kind: 'molar-mass', value: 150, unit: 'g/mol', basis: 'salt', established: true }
  ])

  it('converts a salt dose to its component and back', () => {
    expect(convertDose(index, { from: 'intervention:choline-bitartrate', to: 'compound:choline', amount: 1000 })).toMatchObject({ amount: 400, unit: 'mg', fraction: 0.4 })
    expect(convertDose(index, { from: 'compound:choline', to: 'intervention:choline-bitartrate', amount: 400, reverse: true })).toMatchObject({ amount: 1000 })
    expect(convertDose(index, { from: 'intervention:choline-bitartrate', to: 'compound:zinc', amount: 1 })).toBeNull()
    expect(contentFraction(index, 'intervention:choline-bitartrate', 'compound:choline')).toBe(0.4)
  })

  it('computes the choline needed for a glycine amount at a conversion fraction', () => {
    const full = cholineForGlycine(index, { glycineGrams: 75 })
    expect(full.moles).toBeCloseTo(1, 10)
    expect(full.cholineGrams).toBeCloseTo(100, 8)
    expect(full.saltGrams).toBeCloseTo(250, 8)
    expect(cholineForGlycine(index, { glycineGrams: 75, conversion: 0.5 }).cholineGrams).toBeCloseTo(200, 8)
    expect(() => cholineForGlycine(index, { glycineGrams: 1, conversion: 0 })).toThrow(RangeError)
    expect(() => cholineForGlycine(index, { glycineGrams: 1, conversion: 1.2 })).toThrow(RangeError)
    expect(glycineFromCholine(index, { cholineGrams: 100 })).toBeCloseTo(75, 8)
    expect(glycineFromCholine(index, { cholineGrams: 100, conversion: 0.4 })).toBeCloseTo(30, 8)
    expect(cholineForGlycine(makeQuantIndex([]), { glycineGrams: 1 })).toBeNull()
  })

  it('computes acid from betaine HCl', () => {
    expect(betaineHclAcid(index, { grams: 1.5 })).toBeCloseTo(10, 10)
    expect(betaineHclAcid(makeQuantIndex([]), { grams: 1 })).toBeNull()
  })
})

describe('gas volume', () => {
  it('uses the ideal gas law at the requested temperature', () => {
    expect(gasMolarVolume()).toBeCloseTo(25.45, 2)
    expect(gasMolarVolume({ celsius: 25 })).toBeCloseTo(24.47, 2)
    expect(gasMolarVolume({ celsius: 0, atm: 1 })).toBeCloseTo(22.414, 2)
    expect(gasMolarVolume({ celsius: 37, atm: 2 })).toBeCloseTo(12.73, 2)
  })

  it('gives one CO2 per proton neutralised', () => {
    expect(co2VolumeFromAcid({ mmol: 4.23 })).toBeCloseTo(107.7, 0)
    expect(co2VolumeFromAcid({ mmol: 0 })).toBe(0)
  })
})

describe('validation rules', () => {
  it('accepts a clean record set', () => {
    expect(checkQuant([base(), molar], fixtureGraph)).toEqual([])
  })

  it('rejects records that are not objects, unknown fields, bad ids and bad kinds', () => {
    expect(rules('nope')).toEqual(['quant-schema'])
    expect(rules([null])).toContain('quant-schema')
    expect(rules([base({ colour: 'red' })])).toContain('quant-schema')
    expect(rules([base({ id: 'quant:Bad Id' })])).toContain('quant-schema')
    expect(rules([base({ id: 'compound:x' })])).toContain('quant-schema')
    expect(rules([base({ kind: 'MAX' })])).toContain('quant-schema')
  })

  it('needs value, unit, basis and the established flag; limits also need authority and population', () => {
    const { value, ...noValue } = base()
    expect(rules([noValue])).toContain('quant-schema')
    expect(rules([base({ value: '5' })])).toContain('quant-schema')
    expect(rules([base({ unit: undefined })])).toContain('quant-schema')
    expect(rules([base({ basis: '' })])).toContain('quant-schema')
    expect(rules([base({ established: 'yes' })])).toContain('quant-schema')
    expect(rules([base({ authority: undefined })])).toContain('quant-schema')
    expect(rules([base({ population: undefined })])).toContain('quant-schema')
  })

  it('flags duplicate ids', () => {
    expect(rules([base(), base()])).toContain('quant-duplicate-id')
  })

  it('checks subjects, refs and targets against the graph', () => {
    expect(rules([base({ subject: 'compound:missing' })])).toContain('quant-dangling-subject')
    expect(rules([base({ subject: 'claim:c1' })])).toContain('quant-dangling-subject')
    expect(rules([base({ subject: 'article:a1' })])).toContain('quant-dangling-subject')
    expect(rules([base({ refs: ['article:missing'] })])).toContain('quant-dangling-ref')
    expect(rules([base({ refs: ['claim:c1'] })])).toContain('quant-dangling-ref')
    expect(rules([base({ target: 'compound:missing' })])).toContain('quant-dangling-ref')
    expect(rules([base({ target: 'compound:y' }), molar])).toEqual([])
  })

  it('checks units against the table and the kind', () => {
    expect(rules([base({ unit: 'stone' })])).toContain('quant-unit')
    expect(rules([base({ unit: 'mmol/L' })])).toContain('quant-unit')
    expect(rules([{ ...molar, unit: 'fraction', value: 0.5 }])).toContain('quant-unit')
    expect(rules([base({ unit: `${MICRO}g/day` }), molar])).toEqual([])
  })

  it('checks ranges, fractions and pH', () => {
    expect(rules([base({ value: null, low: 5, high: 1, established: true })])).toContain('quant-range')
    expect(rules([base({ low: 20, high: 30 })])).toContain('quant-range')
    expect(rules([base({ value: -1 })])).toContain('quant-range')
    expect(rules([{ id: 'quant:x-frac', subject: 'compound:x', kind: 'content-fraction', value: 1.2, unit: 'fraction', basis: 'by mass', established: true }, molar])).toContain('quant-range')
    expect(rules([{ id: 'quant:x-ph', subject: 'compound:x', kind: 'ph', value: 15, unit: 'pH', basis: 'x', refs: ['article:a1'], established: true }, molar])).toContain('quant-range')
    expect(rules([base({ value: null, low: 5, high: 50 }), molar])).toEqual([])
  })

  it("ties established to the value: 'no UL established' is null with a note", () => {
    expect(rules([base({ value: null })])).toContain('quant-established')
    expect(rules([base({ established: false })])).toContain('quant-established')
    expect(rules([base({ established: false, value: null })])).toContain('quant-established')
    expect(rules([base({ kind: 'UL', established: false, value: null, note: 'No UL has been set.' }), molar])).toEqual([])
  })

  it('requires a source article for kinds that quote one but not for derived numbers', () => {
    expect(rules([base({ refs: undefined })])).toContain('quant-no-ref')
    expect(rules([base({ refs: [] })])).toContain('quant-no-ref')
    expect(rules([molar])).toEqual([])
  })

  it('keeps an upper level above the intake it bounds, unless the basis differs', () => {
    const rda = base({ id: 'quant:x-rda', kind: 'RDA', value: 400, basis: 'total elemental' })
    const lowUl = base({ id: 'quant:x-ul', kind: 'UL', value: 350, basis: 'total elemental' })
    expect(rules([rda, lowUl, molar])).toContain('quant-limit-order')
    expect(rules([rda, { ...lowUl, basis: 'supplemental elemental' }, molar])).toEqual([])
    expect(rules([rda, { ...lowUl, value: 4000 }, molar])).toEqual([])
    expect(rules([rda, { ...lowUl, population: 'children 4-8 y' }, molar])).toEqual([])
    expect(rules([base({ id: 'quant:x-rda-g', kind: 'RDA', value: 0.4, unit: 'g/day', basis: 'total elemental' }), { ...lowUl, value: 350 }, molar])).toContain('quant-limit-order')
  })

  it('keeps molar masses in step with facts.molarMass', () => {
    expect(rules([base()])).toContain('quant-fact-mismatch')
    expect(rules([base(), { ...molar, value: 90 }])).toContain('quant-fact-mismatch')
    expect(rules([base(), { ...molar, value: 100.51 }])).toEqual([])
  })

  it('is part of validateKnowledge and counted in the report', () => {
    const report = validateKnowledge(fixtureEntities, { quant: [base({ subject: 'compound:missing' }), molar] })
    expect(report.ok).toBe(false)
    expect(report.errors.map((item) => item.rule)).toContain('quant-dangling-subject')
    expect(report.counts.quant).toBe(2)
    expect(validateKnowledge(fixtureEntities).counts.quant).toBeUndefined()
  })
})

describe('the shipped dataset', () => {
  const graph = buildGraph(entities)
  const index = makeQuantIndex(quantData)

  it('validates with the knowledge base', () => {
    expect(checkQuant(quantData, graph)).toEqual([])
    expect(validateKnowledge(entities, { quant: quantData }).errors).toEqual([])
  })

  it('holds a few hundred records with unique ids', () => {
    expect(quantData.length).toBeGreaterThanOrEqual(200)
    expect(new Set(quantData.map((record) => record.id)).size).toBe(quantData.length)
  })

  it('has a molar mass for every compound fact', () => {
    const withFact = entities.filter((entity) => entity.facts?.molarMass)
    expect(withFact.length).toBeGreaterThan(100)
    for (const entity of withFact) expect(molarMassOf(index, entity.id), entity.id).toBeCloseTo(parseMolarMassFact(entity.facts.molarMass), 2)
  })

  it('cites a source article for every intake limit and measured quantity', () => {
    for (const record of quantData.filter((item) => KINDS[item.kind].refs)) {
      expect(record.refs?.length, record.id).toBeGreaterThan(0)
      for (const ref of record.refs) expect(graph.get(ref).type, `${record.id} ${ref}`).toBe('article')
    }
  })

  it('states the choline limits of the two authorities as the source articles do', () => {
    const iom = quantFor(index, 'compound:choline', { authority: 'IOM 1998' })
    const value = (kind, population) => iom.find((record) => record.kind === kind && record.population === population)?.value
    expect(value('AI', 'men 19+')).toBe(550)
    expect(value('AI', 'women 19+')).toBe(425)
    expect(value('UL', 'adults 19+')).toBe(3500)
    expect(value('LOAEL', 'adults')).toBe(7500)
    const efsa = quantFor(index, 'compound:choline', { authority: 'EFSA 2016' })
    expect(efsa.find((record) => record.kind === 'AI' && record.population === 'adults').value).toBe(400)
    expect(efsa.find((record) => record.kind === 'AI' && record.population === 'pregnancy').value).toBe(480)
    expect(efsa.find((record) => record.kind === 'AI' && record.population === 'lactation').value).toBe(520)
    const efsaUl = efsa.find((record) => record.kind === 'UL')
    expect(efsaUl).toMatchObject({ value: null, established: false })
    expect(efsaUl.note).toMatch(/no tolerable upper intake level/i)
    expect(limitsFor(index, 'compound:choline').map((group) => group.authority)).toEqual(['IOM 1998', 'EFSA 2016'])
  })

  it('never lets an upper level or observed safe level contradict an adequate intake of the same basis', () => {
    for (const subject of new Set(quantData.map((record) => record.subject))) {
      const numeric = quantFor(index, subject).filter((record) => record.established && typeof record.value === 'number' && UNITS[record.unit].dimension === 'mass-per-day')
      const floors = numeric.filter((record) => ['RDA', 'AI', 'PRI', 'EAR'].includes(record.kind))
      for (const upper of numeric.filter((record) => record.kind === 'UL' || record.kind === 'OSL')) {
        for (const floor of floors.filter((item) => item.basis === upper.basis)) {
          expect(convertUnit(upper.value, upper.unit, 'mg/day'), `${upper.id} vs ${floor.id}`).toBeGreaterThanOrEqual(convertUnit(floor.value, floor.unit, 'mg/day'))
        }
      }
    }
  })

  it('derives choline-for-glycine from the stored molar masses: 13.88 g per 10 g glycine at 100 %', () => {
    const result = cholineForGlycine(index, { glycineGrams: 10 })
    expect(result.moles).toBeCloseTo(0.1332, 3)
    expect(result.cholineGrams).toBeCloseTo(13.88, 2)
    expect(result.saltGrams).toBeCloseTo(33.76, 1)
    expect(cholineForGlycine(index, { glycineGrams: 10, conversion: 0.5 }).cholineGrams).toBeCloseTo(27.75, 1)
    expect(cholineForGlycine(index, { glycineGrams: 10, conversion: 0.4 }).cholineGrams).toBeCloseTo(34.69, 1)
    expect(glycineFromCholine(index, { cholineGrams: 3.5 * 1000 })).toBeCloseTo(2522, 0)
    expect(quantFor(index, 'compound:glycine', { kind: 'conversion', target: undefined }).some((record) => record.target === 'compound:choline')).toBe(true)
    const ratio = quantFor(index, 'compound:glycine', { kind: 'conversion' }).find((record) => record.target === 'compound:choline')
    expect(ratio.value).toBeCloseTo(10 / 75.07 * 104.17 / 10, 3)
  })

  it('keeps stored content fractions equal to the molar-mass ratios they were computed from', () => {
    const mass = (id) => molarMassOf(index, id)
    expect(contentFraction(index, 'intervention:alpha-gpc-supplement', 'compound:choline')).toBeCloseTo(mass('compound:choline') / mass('compound:glycerophosphocholine'), 3)
    expect(contentFraction(index, 'intervention:citicoline-supplement', 'compound:choline')).toBeCloseTo(mass('compound:choline') / mass('compound:cdp-choline'), 3)
    expect(contentFraction(index, 'intervention:magnesium-glycinate', 'compound:magnesium')).toBeCloseTo(mass('compound:magnesium') / mass('intervention:magnesium-glycinate'), 3)
    expect(contentFraction(index, 'intervention:betaine-hcl', 'compound:betaine')).toBeCloseTo(mass('compound:betaine') / mass('intervention:betaine-hcl'), 3)
    expect(contentFraction(index, 'intervention:zinc-carnosine', 'compound:zinc')).toBeCloseTo(mass('compound:zinc') / mass('intervention:zinc-carnosine'), 3)
    expect(contentFraction(index, 'intervention:choline-bitartrate', 'compound:choline')).toBeCloseTo(0.411, 3)
    expect(convertDose(index, { from: 'intervention:choline-bitartrate', to: 'compound:choline', amount: 1000 }).amount).toBeCloseTo(411, 0)
  })

  it('gives betaine HCl about 6.5 mmol H+ per gram and 4.2 mmol per 650 mg capsule', () => {
    const conversion = quantFor(index, 'intervention:betaine-hcl', { kind: 'conversion' })[0]
    expect(conversion.value).toBeCloseTo(6.51, 2)
    expect(betaineHclAcid(index, { grams: 0.65 })).toBeCloseTo(4.23, 2)
    expect(co2VolumeFromAcid({ mmol: betaineHclAcid(index, { grams: 0.65 }) })).toBeCloseTo(107.7, 0)
  })

  it('stores the CO2 gas volume per mmol that the helper computes', () => {
    const stored = quantFor(index, 'compound:carbon-dioxide', { kind: 'conversion' })[0]
    expect(stored.unit).toBe('mL/mmol')
    expect(stored.value).toBeCloseTo(gasMolarVolume({ celsius: 37 }), 2)
  })

  it('stores glycine flux shares and the deficit as the source accounting does', () => {
    expect(quantFor(index, 'enzyme:glycine-cleavage-system', { kind: 'flux-share' })[0].value).toBe(0.39)
    expect(quantFor(index, 'pathway:glycine-serine-route', { kind: 'flux' }).map((record) => record.value ?? [record.low, record.high])).toEqual(expect.arrayContaining([3, 10, [1.5, 3]]))
    expect(quantFor(index, 'compound:glycine', { kind: 'flux' })[0].value).toBe(463)
  })

  it('states the vitamin and mineral limits of each authority as the source documents do', () => {
    const find = (subject, filter) => {
      const found = quantFor(index, subject, filter)
      expect(found, JSON.stringify([subject, filter])).toHaveLength(1)
      return found[0]
    }
    const MICRO = '\u00b5'
    // IOM 1998
    expect(find('compound:folate', { kind: 'RDA', authority: 'IOM 1998', population: 'adults 19+' })).toMatchObject({ value: 400, unit: `${MICRO}g/day`, basis: 'DFE' })
    expect(find('compound:folic-acid', { kind: 'UL', authority: 'IOM 1998', population: 'adults 19+' }).value).toBe(1000)
    expect(find('compound:vitamin-b12', { kind: 'RDA', authority: 'IOM 1998', population: 'adults 19+' }).value).toBe(2.4)
    expect(find('compound:vitamin-b12', { kind: 'UL', authority: 'IOM 1998' })).toMatchObject({ value: null, established: false })
    expect(find('compound:vitamin-b6', { kind: 'UL', authority: 'IOM 1998' }).value).toBe(100)
    expect(find('compound:niacin', { kind: 'UL', authority: 'IOM 1998' }).value).toBe(35)
    // EFSA
    expect(find('compound:vitamin-b6', { kind: 'UL', authority: 'EFSA 2023' }).value).toBe(12)
    expect(find('compound:folic-acid', { kind: 'UL', authority: 'EFSA 2023', population: 'adults' }).basis).toMatch(/5-MTHF salts, combined/)
    expect(find('compound:folate', { kind: 'PRI', authority: 'EFSA 2017' }).value).toBe(330)
    expect(find('compound:magnesium', { kind: 'AI', authority: 'EFSA 2017', population: 'men' }).value).toBe(350)
    // EU SCF
    expect(find('compound:nicotinamide', { kind: 'UL', authority: 'EU SCF 2002' }).value).toBe(900)
    expect(find('compound:niacin', { kind: 'UL', authority: 'EU SCF 2002' }).value).toBe(10)
    expect(find('compound:zinc', { kind: 'UL', authority: 'EU SCF 2003' }).value).toBe(25)
    expect(find('compound:glycyrrhizin', { kind: 'UL' }).value).toBe(100)
    // magnesium: the IOM UL sits below the RDA only because it covers supplements alone
    const mgUl = find('compound:magnesium', { kind: 'UL', authority: 'IOM 1997' })
    const mgRda = find('compound:magnesium', { kind: 'RDA', authority: 'IOM 1997', population: 'men 31+' })
    expect(mgUl.value).toBe(350)
    expect(mgRda.value).toBe(420)
    expect(mgUl.basis).not.toBe(mgRda.basis)
    expect(limitsFor(index, 'compound:magnesium').map((group) => group.authority)).toEqual(['IOM 1997', 'EU SCF 2001', 'EFSA 2017'])
    expect(limitsFor(index, 'compound:vitamin-b6').map((group) => group.authority)).toEqual(['IOM 1998', 'EU SCF 2000', 'EFSA 2017', 'EFSA 2023'])
  })

  it('keeps the gastric and methylation reference numbers the verification pass confirmed', () => {
    const one = (subject, filter) => quantFor(index, subject, filter)
    expect(one('compound:hydrochloric-acid', { kind: 'ph' }).map((record) => record.value).sort()).toEqual([1.7, 6.7])
    expect(one('compound:hydrochloric-acid', { kind: 'concentration' })[0].value).toBe(160)
    expect(one('compound:hydrochloric-acid', { kind: 'flux' }).map((record) => record.id)).toEqual(expect.arrayContaining(['quant:hydrochloric-acid-flux-peak-output-range']))
    expect(one('compound:sam', { kind: 'reference-range' })[0]).toMatchObject({ low: 71, high: 168, unit: 'nmol/L' })
    expect(one('compound:sah', { kind: 'reference-range' })[0]).toMatchObject({ low: 8, high: 26 })
    expect(one('enzyme:gnmt', { kind: 'ratio' }).map((record) => record.value).sort((a, b) => a - b)).toEqual([3, 300])
    expect(one('compound:homocysteine', { kind: 'threshold' }).map((record) => record.value)).toEqual(expect.arrayContaining([15, 30, 100]))
    expect(one('compound:methylmalonic-acid', { kind: 'reference-range' })[0]).toMatchObject({ low: 0.073, high: 0.271 })
    expect(one('pathway:creatine-synthesis', { kind: 'flux-share' }).map((record) => record.value).sort()).toEqual([0.4, 0.7])
    expect(one('intervention:betaine-anhydrous', { kind: 'approved-dose' }).map((record) => record.value).sort((a, b) => a - b)).toEqual([1.5, 6, 20])
  })

  it('exposes the helpers bound to the shipped data from the knowledge index', () => {
    expect(knowledge.quantFor('compound:choline', { kind: 'UL' }).length).toBeGreaterThanOrEqual(2)
    expect(knowledge.limitsFor('compound:choline')[0].authority).toBe('IOM 1998')
    expect(knowledge.molarMassOf('compound:glycine')).toBe(75.07)
    expect(knowledge.cholineForGlycine({ glycineGrams: 10 }).cholineGrams).toBeCloseTo(13.88, 2)
    expect(knowledge.convertDose({ from: 'intervention:choline-bitartrate', to: 'compound:choline', amount: 500 }).amount).toBeCloseTo(205.5, 1)
    expect(knowledge.quantOf('quant:glycine-molar-mass').value).toBe(75.07)
    expect(knowledge.quant).toBe(quantData)
    expect(LIMIT_KINDS).toEqual(['EAR', 'RDA', 'PRI', 'AI', 'UL', 'LOAEL', 'OSL'])
  })
})
