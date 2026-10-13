import { describe, expect, it } from 'vitest'
import { graph } from '../../src/knowledge/index.js'
import { search } from '../../src/knowledge/search.js'

const entity = (id, name, extra = {}) => ({ id, type: id.split(':')[0], name, summary: '', ...extra })
const fixture = (...entities) => ({ entities })
const ids = (g, query) => search(g, query).map((result) => result.id)

describe('search ranking', () => {
  it('ranks an exact head name above longer names that merely start with it', () => {
    const g = fixture(
      entity('compound:betaine-aldehyde', 'Betaine aldehyde'),
      entity('compound:betaine', 'Betaine (trimethylglycine, TMG)'),
      entity('intervention:betaine-hcl', 'Betaine hydrochloride (betaine HCl)')
    )
    expect(ids(g, 'betaine')[0]).toBe('compound:betaine')
  })

  it('ranks an acronym in parentheses above a name that only starts with it', () => {
    const g = fixture(
      entity('claim:gnmt-valve', "GNMT is a methyl 'escape valve'"),
      entity('enzyme:gnmt', 'Glycine N-methyltransferase (GNMT)')
    )
    expect(ids(g, 'gnmt')[0]).toBe('enzyme:gnmt')
  })

  it('ranks an exact alias above a prefix match on a name', () => {
    const g = fixture(entity('compound:same', 'SAMe supplement'), entity('compound:sam', 'S-adenosylmethionine', { aliases: ['SAM'] }))
    expect(ids(g, 'sam')[0]).toBe('compound:sam')
  })

  it('still matches words and substrings, below exact matches', () => {
    const g = fixture(entity('compound:a', 'Alpha betaine'), entity('compound:b', 'Betaine'), entity('compound:c', 'Isobetaines'))
    expect(ids(g, 'betaine')).toEqual(['compound:b', 'compound:a', 'compound:c'])
  })

  it('requires every word of the query to match', () => {
    const g = fixture(entity('compound:a', 'Betaine (TMG)'), entity('compound:b', 'Betaine aldehyde'))
    expect(ids(g, 'betaine tmg')).toEqual(['compound:a'])
  })
})

describe('search ranking on the real knowledge base', () => {
  it.each([
    ['GNMT', 'enzyme:gnmt'],
    ['betaine', 'compound:betaine'],
    ['SAM', 'compound:sam'],
    ['MTHFR', 'enzyme:mthfr'],
    ['homocysteine', 'compound:homocysteine'],
    ['glycine', 'compound:glycine']
  ])('puts the entity named %s first', (query, id) => {
    expect(search(graph, query)[0].id).toBe(id)
  })
})
