import { describe, expect, it } from 'vitest'
import { TYPES, TYPE_IDS, isType, typeLabel, typeMeta } from '../../src/knowledge/types.js'
import { isId, makeId, parseId, idType } from '../../src/knowledge/ids.js'
import { AUTHORABLE_RELATIONS, RELATIONS, RELATION_IDS, allowedPair, describeAllowed, inverseOf, isAuthorable, isRelation, labelFor, relationInfo, relationOrder } from '../../src/knowledge/relations.js'
import { evidenceInfo } from '../../src/knowledge/evidence.js'
import { describeFacts, factUrl } from '../../src/knowledge/facts.js'

describe('types', () => {
  it('defines the eleven contract types in a stable order', () => {
    expect(TYPE_IDS).toEqual(['compound', 'enzyme', 'reaction', 'pathway', 'state', 'disease', 'outcome', 'system', 'intervention', 'claim', 'article'])
    expect(TYPES.map((type) => type.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    for (const type of TYPES) expect(Object.keys(type)).toEqual(expect.arrayContaining(['id', 'label', 'plural', 'description', 'icon', 'order']))
  })

  it('looks types up and tolerates unknown ones', () => {
    expect(isType('enzyme')).toBe(true)
    expect(isType('gene')).toBe(false)
    expect(typeMeta('enzyme').plural).toBe('Enzymes')
    expect(typeLabel('gene')).toBe('gene')
  })
})

describe('ids', () => {
  it('accepts <type>:<kebab-slug> only', () => {
    expect(isId('compound:5-mthf')).toBe(true)
    expect(isId('enzyme:gnmt')).toBe(true)
    for (const bad of ['gnmt', 'enzyme:', 'enzyme:GNMT', 'enzyme:g_n', 'gene:gnmt', 'enzyme:a--b', 'enzyme:-a', 7, null]) expect(isId(bad)).toBe(false)
  })

  it('splits and builds ids', () => {
    expect(parseId('state:under-methylation')).toEqual({ type: 'state', slug: 'under-methylation' })
    expect(parseId('nope')).toBeNull()
    expect(makeId('claim', 'x')).toBe('claim:x')
    expect(idType('gene:x')).toBe('gene')
    expect(idType('plain')).toBe('')
  })
})

describe('relation vocabulary', () => {
  it('has the contract forward/inverse pairs', () => {
    const pairs = Object.fromEntries(RELATIONS.filter((item) => !item.symmetric).map((item) => [item.id, item.inverse]))
    expect(pairs).toEqual({
      'substrate-of': 'has-substrate',
      'product-of': 'has-product',
      catalyzes: 'catalyzed-by',
      'cofactor-of': 'requires-cofactor',
      'part-of': 'has-part',
      'precursor-of': 'derived-from',
      increases: 'increased-by',
      decreases: 'decreased-by',
      causes: 'caused-by',
      mitigates: 'mitigated-by',
      aggravates: 'aggravated-by',
      'contraindicated-in': 'contraindicates',
      'manifests-as': 'manifestation-of',
      'evidence-for': 'has-evidence',
      'evidence-against': 'has-counterevidence',
      'measured-by': 'measures'
    })
    expect(RELATIONS.filter((item) => item.symmetric).map((item) => item.id)).toEqual(['associated-with', 'interacts-with'])
  })

  it('inverts every relation involutively and labels both directions uniquely', () => {
    for (const id of RELATION_IDS) expect(inverseOf(inverseOf(id))).toBe(id)
    const labels = RELATION_IDS.map(labelFor)
    expect(new Set(labels).size).toBe(labels.length)
    expect(labelFor('substrate-of')).toBe('Substrate of')
    expect(labelFor('has-substrate')).toBe('Has substrate')
    expect(inverseOf('associated-with')).toBe('associated-with')
  })

  it('distinguishes authorable (forward) ids from inverses', () => {
    expect(isAuthorable('catalyzes')).toBe(true)
    expect(isAuthorable('catalyzed-by')).toBe(false)
    expect(isRelation('catalyzed-by')).toBe(true)
    expect(isRelation('likes')).toBe(false)
    expect(AUTHORABLE_RELATIONS).toHaveLength(18)
    expect(relationInfo('catalyzed-by')).toMatchObject({ isInverse: true, forward: 'catalyzes', label: 'Catalyzed by' })
    expect(relationInfo('likes')).toBeNull()
  })

  it('constrains type pairs on the forward direction', () => {
    expect(allowedPair('catalyzes', 'enzyme', 'reaction')).toBe(true)
    expect(allowedPair('catalyzes', 'compound', 'reaction')).toBe(false)
    expect(allowedPair('catalyzes', 'enzyme', 'state')).toBe(false)
    expect(allowedPair('associated-with', 'claim', 'system')).toBe(true)
    expect(allowedPair('part-of', 'reaction', 'pathway')).toBe(true)
    expect(allowedPair('unknown', 'a', 'b')).toBe(false)
    expect(describeAllowed('catalyzes')).toBe('enzyme -> reaction')
    expect(describeAllowed('part-of')).toBe('any -> any')
  })

  it('orders inverse right after forward for presentation', () => {
    expect(relationOrder('has-substrate')).toBe(relationOrder('substrate-of') + 1)
    expect(relationOrder('nope')).toBe(RELATION_IDS.length)
  })
})

describe('evidence and facts', () => {
  it('ranks evidence grades', () => {
    expect(evidenceInfo('established').rank).toBeGreaterThan(evidenceInfo('plausible').rank)
    expect(evidenceInfo('plausible').rank).toBeGreaterThan(evidenceInfo('speculative').rank)
    expect(evidenceInfo('speculative').rank).toBeGreaterThan(evidenceInfo('conversation-only').rank)
    expect(evidenceInfo('weird')).toMatchObject({ label: 'weird', rank: -1 })
  })

  it('labels facts and links known identifiers', () => {
    expect(factUrl('doi', '10.1000/xyz')).toBe('https://doi.org/10.1000/xyz')
    expect(factUrl('pmid', '123')).toBe('https://pubmed.ncbi.nlm.nih.gov/123/')
    expect(factUrl('chebi', '15428')).toContain('CHEBI:15428')
    expect(factUrl('formula', 'C2H5NO2')).toBeNull()
    expect(factUrl('uniprot', 'two words')).toBeNull()
    expect(describeFacts({ ec: '2.1.1.20', 'molar-mass': '75' })).toEqual([
      { key: 'ec', label: 'EC number', value: '2.1.1.20', url: 'https://enzyme.expasy.org/EC/2.1.1.20' },
      { key: 'molar-mass', label: 'Molar mass', value: '75', url: null }
    ])
  })
})
