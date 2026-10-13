import { describe, expect, it } from 'vitest'
import { buildGraph } from '../../src/knowledge/graph.js'
import { hubModel } from '../../src/knowledge/page-model.js'
import { countBy, enrichItems, filterItems, groupItems, readFilters, sortItems, writeFilters } from '../../src/kb/listing.js'
import { valid } from '../fixtures/knowledge/helpers.js'

const graph = buildGraph(valid)
const items = (type) => enrichItems(graph, hubModel(graph, type))

describe('enrichItems', () => {
  it('adds claim status and statement', () => {
    const [claim] = items('claim')
    expect(claim.status).toBe('partly-supported')
    expect(claim.statusInfo.label).toBe('Partly supported')
    expect(claim.detail).toMatch(/depletes SAMe/)
  })

  it('adds the equation and pathway to reactions', () => {
    const reaction = items('reaction').find((item) => item.id === 'reaction:gnmt-methylation')
    expect(reaction.equation).toBe('Glycine + S-adenosylmethionine → Sarcosine + S-adenosylhomocysteine')
    expect(reaction.pathway).toBe('Methionine cycle')
  })

  it('adds citation, year and verified to articles', () => {
    const article = items('article').find((item) => item.id === 'article:fixture-gnmt-review')
    expect(article.citation).toBe('Ada Fixture et al. (2001). Journal of Fixtures.')
    expect(article.verified).toBe(true)
    expect(article.year).toBe(2001)
  })

  it('leaves other types untouched', () => {
    expect(items('compound')[0].status).toBeUndefined()
  })
})

describe('filterItems', () => {
  const compounds = items('compound')

  it('matches every word, ignoring case and accents, in name, aliases and summary', () => {
    expect(filterItems(compounds, { q: 'HOMOCISTEÍNA' }).map((item) => item.name)).toEqual(['Homocysteine'])
    expect(filterItems(compounds, { q: 'amino acid' }).map((item) => item.name).sort()).toEqual(['Glycine', 'Homocysteine', 'Methionine'])
    expect(filterItems(compounds, { q: 'amino zzz' })).toEqual([])
  })

  it('filters by evidence grade and claim status', () => {
    expect(filterItems(items('state'), { grade: 'plausible' }).map((item) => item.name)).toEqual(['Under-methylation'])
    expect(filterItems(items('claim'), { status: 'supported' })).toEqual([])
    expect(filterItems(items('claim'), { status: 'partly-supported' })).toHaveLength(1)
  })

  it('searches the claim statement', () => {
    expect(filterItems(items('claim'), { q: 'large doses' })).toHaveLength(1)
  })

  it('returns everything for an empty filter', () => {
    expect(filterItems(compounds)).toHaveLength(compounds.length)
  })
})

describe('sortItems', () => {
  const compounds = items('compound')

  it('sorts by name, by evidence strength and by number of links', () => {
    expect(sortItems(compounds, 'name')[0].name).toBe('Betaine')
    const byEvidence = sortItems(items('intervention'), 'evidence')
    expect(byEvidence.map((item) => item.evidence)).toEqual(['plausible', 'plausible'])
    const linked = sortItems(compounds, 'linked')
    expect(linked[0].degree).toBeGreaterThanOrEqual(linked[linked.length - 1].degree)
  })

  it('does not mutate its input', () => {
    const copy = [...compounds]
    sortItems(compounds, 'linked')
    expect(compounds).toEqual(copy)
  })
})

describe('groupItems', () => {
  it('groups claims by status in audit order', () => {
    const groups = groupItems(items('claim'), { type: 'claim' })
    expect(groups.map((group) => group.label)).toEqual(['Partly supported'])
  })

  it('groups articles by year, newest first', () => {
    expect(groupItems(items('article'), { type: 'article' }).map((group) => group.label)).toEqual(['2015', '2001'])
  })

  it('groups reactions by pathway', () => {
    expect(groupItems(items('reaction'), { type: 'reaction' }).map((group) => `${group.label}:${group.items.length}`)).toEqual(['Methionine cycle:2'])
  })

  it('groups other types by initial letter', () => {
    expect(groupItems(items('compound'), { type: 'compound' }).map((group) => group.label)).toEqual(['B', 'D', 'G', 'H', 'M', 'S'])
  })

  it('groups by grade when sorted by evidence and gives one headless list when sorted by links', () => {
    const states = items('state')
    expect(groupItems(states, { type: 'state', sort: 'evidence' }).map((group) => group.label)).toEqual(['Established', 'Plausible'])
    expect(groupItems(states, { type: 'state', sort: 'linked' })).toMatchObject([{ label: null }])
  })

  it('returns no groups for an empty list', () => {
    expect(groupItems([], { type: 'claim' })).toEqual([])
  })
})

describe('filter query state', () => {
  it('keeps only known values', () => {
    expect(readFilters({ q: 'x', grade: 'bogus', status: 'contested', sort: 'linked' })).toEqual({ q: 'x', grade: '', status: 'contested', sort: 'linked' })
    expect(readFilters({ sort: 'nope', q: ['a'] })).toEqual({ q: '', grade: '', status: '', sort: 'name' })
    expect(readFilters()).toEqual({ q: '', grade: '', status: '', sort: 'name' })
  })

  it('omits defaults when writing', () => {
    expect(writeFilters({ q: '', grade: 'established', status: '', sort: 'name' })).toEqual({ grade: 'established' })
    expect(writeFilters({ q: 'a', grade: '', status: '', sort: 'linked' })).toEqual({ q: 'a', sort: 'linked' })
  })

  it('counts items per field value', () => {
    expect(countBy(items('state'), 'evidence')).toEqual({ plausible: 1, established: 1 })
  })
})
