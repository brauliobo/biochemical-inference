import { describe, expect, it } from 'vitest'
import { checkEntity, formatIssue } from '../../src/knowledge/schema.js'
import { fixture } from '../fixtures/knowledge/helpers.js'

const get = (id) => fixture().find((entity) => entity.id === id)
const problems = (raw) => checkEntity(raw).map(formatIssue)

describe('entity schema', () => {
  it('accepts every entity of the valid fixture', () => {
    for (const [index, entity] of fixture().entries()) expect(checkEntity(entity, index), entity.id).toEqual([])
  })

  it('names the offending entity id and the field path in every message', () => {
    const entity = get('enzyme:gnmt')
    entity.relations = [{ rel: 'decreases', to: 'compound:sam' }, { rel: 'decreases', to: 'nonsense' }]
    expect(problems(entity)).toEqual([expect.stringMatching(/^enzyme:gnmt relations\[1\]\.to: relation target 'nonsense' is not a valid id/)])
  })

  it('falls back to the array index when the entity has no id', () => {
    const [issue] = checkEntity({ type: 'compound' }, 7)
    expect(issue.id).toBe('#7')
    expect(checkEntity('text', 2)).toEqual([{ id: '#2', path: '', message: 'entity must be an object' }])
  })

  it.each([
    ['id without matching type prefix', (e) => { e.id = 'enzyme:glycine' }, /must start with its type: 'compound:'/],
    ['unknown type', (e) => { e.type = 'gene' }, /type must be one of compound \| enzyme/],
    ['empty name', (e) => { e.name = '  ' }, /name must not be empty/],
    ['summary over 200 chars', (e) => { e.summary = 'x'.repeat(201) }, /at most 200 characters \(is 201\)/],
    ['bad evidence grade', (e) => { e.evidence = 'proven' }, /evidence must be one of established/],
    ['non-string fact value', (e) => { e.facts = { pmid: 123 } }, /fact values must be strings/],
    ['empty body paragraph', (e) => { e.body = [''] }, /body paragraph must not be empty/],
    ['unknown field', (e) => { e.alias = ['x'] }, /unknown field: alias/],
    ['unknown relation', (e) => { e.relations = [{ rel: 'likes', to: 'compound:sam' }] }, /unknown relation 'likes'/],
    ['inverse relation written', (e) => { e.relations = [{ rel: 'has-product', to: 'compound:sam' }] }, /inverse; write the forward form 'product-of'/],
    ['ref that is not an article', (e) => { e.refs = ['compound:sam'] }, /must have type 'article'/],
    ['reaction field on a compound', (e) => { e.reaction = { reactants: [], products: [] } }, /only valid on reaction/],
    ['article field on a compound', (e) => { e.year = 1999 }, /field 'year' is only valid on article entities/]
  ])('rejects %s', (_label, mutate, pattern) => {
    const entity = get('compound:glycine')
    mutate(entity)
    expect(problems(entity).join('\n')).toMatch(pattern)
  })

  it('validates reaction details', () => {
    const base = () => get('reaction:gnmt-methylation')
    const missing = base()
    delete missing.reaction
    expect(problems(missing)).toEqual([expect.stringMatching(/reaction entities require 'reaction'/)])

    const noProducts = base()
    noProducts.reaction.products = []
    expect(problems(noProducts).join()).toMatch(/at least one product/)

    const badParticipant = base()
    badParticipant.reaction.reactants = [{ id: 'enzyme:gnmt', n: 1 }]
    expect(problems(badParticipant).join()).toMatch(/must have type 'compound'/)

    const badN = base()
    badN.reaction.reactants[0].n = 0
    expect(problems(badN).join()).toMatch(/n must be > 0/)

    const badEnzyme = base()
    badEnzyme.reaction.enzymes = ['compound:sam']
    expect(problems(badEnzyme).join()).toMatch(/must have type 'enzyme'/)
  })

  it('validates article details', () => {
    const base = () => get('article:fixture-gnmt-review')
    const missing = base()
    delete missing.authors
    delete missing.verified
    expect(problems(missing)).toEqual([expect.stringMatching(/require 'authors'/), expect.stringMatching(/require 'verified'/)])

    const url = base()
    url.doi = 'https://doi.org/10.0000/x'
    expect(problems(url).join()).toMatch(/bare DOI/)

    const pmid = base()
    pmid.pmid = 'PMC123'
    expect(problems(pmid).join()).toMatch(/pmid must be digits/)

    const year = base()
    year.year = 20.5
    expect(problems(year).join()).toMatch(/year must be an integer/)

    const noTakeaways = base()
    noTakeaways.takeaways = []
    expect(problems(noTakeaways).join()).toMatch(/at least one point/)
  })

  it('validates claim details', () => {
    const badEnums = get('claim:glycine-depletes-sam')
    badEnums.status = 'true'
    badEnums.source = 'rumour'
    expect(problems(badEnums).sort()).toEqual([
      expect.stringMatching(/source: source must be one of conversation \| literature/),
      expect.stringMatching(/status: status must be one of supported/)
    ])
    const missing = get('claim:glycine-depletes-sam')
    delete missing.statement
    expect(problems(missing)).toEqual([expect.stringMatching(/claim entities require 'statement'/)])
  })
})
