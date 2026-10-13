import { describe, expect, it } from 'vitest'
import { buildGraph } from '../../src/knowledge/graph.js'
import { homeModel, hubModel, pageModel, search, seeAlso } from '../../src/knowledge/page-model.js'
import { fixture } from '../fixtures/knowledge/helpers.js'

const graph = buildGraph(fixture())
const group = (model, label) => model.relationGroups.find((item) => item.label === label)

describe('pageModel', () => {
  it('returns null for unknown ids', () => {
    expect(pageModel(graph, 'compound:ghost')).toBeNull()
  })

  it('carries the header data: type, evidence badge, facts, aliases', () => {
    const model = pageModel(graph, 'enzyme:gnmt')
    expect(model).toMatchObject({ id: 'enzyme:gnmt', type: 'enzyme', typeLabel: 'Enzyme', typeIcon: 'cog', name: 'Glycine N-methyltransferase', aliases: ['GNMT'] })
    expect(model.evidence).toMatchObject({ grade: 'established', label: 'Established', tone: 'success' })
    expect(model.facts).toEqual([
      { key: 'gene', label: 'Gene', value: 'GNMT', url: null },
      { key: 'ec', label: 'EC number', value: '2.1.1.20', url: 'https://enzyme.expasy.org/EC/2.1.1.20' },
      { key: 'uniprot', label: 'UniProt', value: 'Q14749', url: 'https://www.uniprot.org/uniprotkb/Q14749' }
    ])
  })

  it('resolves body mentions into text/link segments per paragraph', () => {
    const model = pageModel(graph, 'compound:glycine')
    expect(model.body).toHaveLength(1)
    expect(model.body[0]).toEqual([
      { text: 'Glycine is the substrate of ' },
      { link: { id: 'enzyme:gnmt', label: 'GNMT', type: 'enzyme' } },
      { text: ' and is used as a ' },
      { link: { id: 'intervention:glycine-supplement', label: 'Glycine supplement', type: 'intervention' } },
      { text: '.' }
    ])
    expect(pageModel(graph, 'outcome:belching').body).toEqual([])
  })

  it('merges outgoing and incoming relations into labelled groups', () => {
    const model = pageModel(graph, 'compound:sam')
    expect(group(model, 'Substrate of').items.map((item) => item.id)).toEqual(['reaction:gnmt-methylation'])
    expect(group(model, 'Decreased by').items.map((item) => item.id)).toEqual(['enzyme:gnmt'])
    expect(group(model, 'Derived from').items.map((item) => item.id)).toEqual(['compound:methionine'])
    expect(group(model, 'Precursor of').items.map((item) => item.id)).toEqual(['compound:sah'])
    const labels = model.relationGroups.map((item) => item.label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('puts forward groups before their inverses in vocabulary order', () => {
    const labels = pageModel(graph, 'compound:sam').relationGroups.map((item) => item.label)
    expect(labels.indexOf('Substrate of')).toBeLessThan(labels.indexOf('Precursor of'))
    expect(labels.indexOf('Precursor of')).toBeLessThan(labels.indexOf('Derived from'))
    expect(labels.indexOf('Derived from')).toBeLessThan(labels.indexOf('Decreased by'))
  })

  it('keeps notes and origin on group items and sorts items by name', () => {
    const glycine = pageModel(graph, 'compound:glycine')
    expect(group(glycine, 'Precursor of').items[0]).toMatchObject({ id: 'compound:sarcosine', note: 'via methylation', origin: 'declared', typeLabel: 'Compound', evidence: 'established' })
    const sibo = pageModel(graph, 'disease:sibo')
    const names = group(sibo, 'Contraindicates').items.map((item) => item.name)
    expect(names).toEqual(['Glycine supplement'])
    const stomachLike = pageModel(graph, 'outcome:belching')
    const manifestation = group(stomachLike, 'Manifestation of').items.map((item) => item.name)
    expect(manifestation).toEqual([...manifestation].sort((a, b) => a.localeCompare(b)))
  })

  it('shows a symmetric relation once from either side', () => {
    expect(group(pageModel(graph, 'state:hypochlorhydria'), 'Associated with').items.map((item) => item.id)).toEqual(['system:stomach'])
    expect(group(pageModel(graph, 'system:stomach'), 'Associated with').items.map((item) => item.id)).toEqual(['state:hypochlorhydria'])
  })

  it('moves article evidence out of the groups into references', () => {
    const model = pageModel(graph, 'claim:glycine-depletes-sam')
    expect(group(model, 'Supported by')).toBeUndefined()
    expect(group(model, 'Contradicted by')).toBeUndefined()
    expect(model.references.map((item) => [item.id, item.stance])).toEqual([
      ['article:fixture-gnmt-review', 'supports'],
      ['article:fixture-unverified', 'contradicts']
    ])
    expect(model.references[0]).toMatchObject({ citation: 'Ada Fixture et al. (2001). Journal of Fixtures.', verified: true, doi: '10.0000/fixture-1' })
    expect(model.references[1].citation).toBe('Dee Draft (2015). Draft Letters.')
  })

  it('builds the reaction section with an equation', () => {
    const model = pageModel(graph, 'reaction:bhmt-remethylation')
    expect(model.reaction.equation).toBe('Betaine + Homocysteine ⇌ Dimethylglycine + Methionine')
    expect(model.reaction.enzymes).toEqual([{ id: 'enzyme:bhmt', name: 'Betaine-homocysteine methyltransferase' }])
    expect(model.reaction.identifiers).toEqual([{ key: 'ec', label: 'EC number', value: '2.1.1.5', url: 'https://enzyme.expasy.org/EC/2.1.1.5' }])
    expect(pageModel(graph, 'reaction:gnmt-methylation').reaction).toMatchObject({ reversible: false, compartment: 'cytosol' })
    expect(pageModel(graph, 'reaction:gnmt-methylation').reaction.equation).toMatch(/ → /)
    expect(pageModel(graph, 'compound:sam').reaction).toBeNull()
  })

  it('formats stoichiometry in the equation', () => {
    const entities = fixture()
    entities.find((item) => item.id === 'reaction:bhmt-remethylation').reaction.reactants[0].n = 2
    expect(pageModel(buildGraph(entities), 'reaction:bhmt-remethylation').reaction.equation).toMatch(/^2 Betaine \+ Homocysteine/)
  })

  it('builds article and claim sections', () => {
    const article = pageModel(graph, 'article:fixture-gnmt-review')
    expect(article.article).toMatchObject({ year: 2001, verified: true, takeaways: ['GNMT buffers SAMe.'] })
    expect(article.article.identifiers.map((item) => item.key)).toEqual(['doi', 'pmid'])
    expect(group(article, 'Evidence for').items.length).toBeGreaterThan(5)
    const claim = pageModel(graph, 'claim:glycine-depletes-sam')
    expect(claim.claim).toMatchObject({ source: 'conversation', status: { label: 'Partly supported' } })
    expect(claim.article).toBeNull()
  })

  it('lists entities that mention this one', () => {
    expect(pageModel(graph, 'enzyme:gnmt').mentionedBy.map((item) => item.id)).toContain('compound:glycine')
  })

  it('produces breadcrumbs home > hub > entity', () => {
    expect(pageModel(graph, 'enzyme:gnmt').breadcrumbs).toEqual([
      { kind: 'home', label: 'Home' },
      { kind: 'hub', type: 'enzyme', label: 'Enzymes' },
      { kind: 'entity', id: 'enzyme:gnmt', label: 'Glycine N-methyltransferase' }
    ])
  })
})

describe('seeAlso', () => {
  it('ranks 2-hop neighbours, excluding self, direct links and articles', () => {
    const items = seeAlso(graph, 'compound:glycine')
    const direct = new Set(['compound:glycine', ...graph.neighbors('compound:glycine')])
    expect(items.length).toBeGreaterThan(0)
    for (const item of items) {
      expect(direct.has(item.id)).toBe(false)
      expect(item.type).not.toBe('article')
      expect(item.via.length).toBeGreaterThan(0)
    }
    const scores = items.map((item) => item.score)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })

  it('prefers candidates reached through more shared neighbours and honours the limit', () => {
    const items = seeAlso(graph, 'compound:glycine')
    const best = items[0]
    expect(items.every((item) => item.via.length <= best.via.length || item.score <= best.score)).toBe(true)
    expect(seeAlso(graph, 'compound:glycine', 2)).toHaveLength(Math.min(2, items.length))
    expect(pageModel(graph, 'compound:glycine').seeAlso).toEqual(items)
  })
})

describe('hubModel', () => {
  it('lists a type sorted by name with counts and evidence tallies', () => {
    const model = hubModel(graph, 'compound')
    expect(model).toMatchObject({ type: 'compound', label: 'Compound', plural: 'Compounds', icon: 'flask-conical', count: 8 })
    expect(model.items.map((item) => item.name)).toEqual([...model.items.map((item) => item.name)].sort((a, b) => a.localeCompare(b)))
    expect(model.items[0]).toMatchObject({ id: expect.stringMatching(/^compound:/), aliases: expect.any(Array), degree: expect.any(Number) })
    expect(model.evidenceCounts).toEqual({ established: 8, plausible: 0, speculative: 0, 'conversation-only': 0 })
    expect(model.breadcrumbs.at(-1)).toEqual({ kind: 'hub', type: 'compound', label: 'Compounds' })
  })

  it('handles empty and unknown types', () => {
    expect(hubModel(buildGraph([]), 'claim')).toMatchObject({ count: 0, items: [] })
    expect(hubModel(graph, 'gene')).toBeNull()
  })
})

describe('homeModel', () => {
  it('summarises every type and features the best connected entities', () => {
    const model = homeModel(graph)
    expect(model.types.map((item) => item.type)).toHaveLength(11)
    expect(model.types.find((item) => item.type === 'enzyme')).toMatchObject({ plural: 'Enzymes', count: 2 })
    expect(model.totals).toMatchObject({ entities: 23, byEvidence: { established: expect.any(Number) } })
    expect(model.featured).toHaveLength(6)
    const degrees = model.featured.map((item) => item.degree)
    expect(degrees).toEqual([...degrees].sort((a, b) => b - a))
    expect(model.featured.some((item) => item.type === 'article' || item.type === 'claim')).toBe(false)
  })
})

describe('search', () => {
  const ids = (query, options) => search(graph, query, options).map((item) => item.id)

  it('ranks exact name above alias above summary matches', () => {
    expect(ids('glycine')[0]).toBe('compound:glycine')
    const results = search(graph, 'sam')
    expect(results[0]).toMatchObject({ id: 'compound:sam', matched: 'alias', alias: 'SAM' })
  })

  it('searches aliases in Portuguese, ignoring case and accents', () => {
    expect(ids('ARROTO')).toEqual(['outcome:belching'])
    expect(ids('eructacao')).toEqual(['outcome:belching'])
    expect(ids('hipocloridria')).toContain('state:hypochlorhydria')
    expect(ids('estomago')[0]).toBe('system:stomach')
  })

  it('matches ids and requires every word to match', () => {
    expect(ids('under-methylation')[0]).toBe('state:under-methylation')
    expect(ids('bacterial overgrowth')).toEqual(['disease:sibo'])
    expect(ids('bacterial zebra')).toEqual([])
  })

  it('finds by summary text', () => {
    const [first] = search(graph, 'universal methyl donor')
    expect(first).toMatchObject({ id: 'compound:sam', matched: 'summary' })
  })

  it('filters by type, limits, and handles blank queries', () => {
    expect(ids('glycine', { types: ['intervention'] })).toEqual(['intervention:glycine-supplement', 'intervention:tmg-supplement'])
    expect(search(graph, 'methyl', { limit: 2 })).toHaveLength(2)
    expect(search(graph, '   ')).toEqual([])
    expect(search(graph, undefined)).toEqual([])
    expect(search(graph, '???')).toEqual([])
  })

  it('returns display-ready results', () => {
    expect(search(graph, 'gnmt')[0]).toEqual({
      id: 'enzyme:gnmt',
      type: 'enzyme',
      typeLabel: 'Enzyme',
      name: 'Glycine N-methyltransferase',
      summary: 'Liver enzyme that buffers SAMe by methylating glycine.',
      evidence: 'established',
      score: expect.any(Number),
      matched: expect.any(String),
      ...(search(graph, 'gnmt')[0].alias ? { alias: 'GNMT' } : {})
    })
  })
})
