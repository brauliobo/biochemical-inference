// Edge fields (sign, hypothesis, claim, strength): schema, graph, page model and validation.
import { describe, expect, it } from 'vitest'
import { checkEntity } from '../../src/knowledge/schema.js'
import { buildGraph } from '../../src/knowledge/graph.js'
import { pageModel } from '../../src/knowledge/page-model.js'
import { EDGE_FIELDS, EDGE_SIGNS, EDGE_STRENGTHS, CAUSAL_RELATIONS, RELATIONS, edgeSign, intrinsicSign } from '../../src/knowledge/relations.js'
import { RULES, validateKnowledge } from '../../src/knowledge/validate.js'

const entity = (id, extra = {}) => ({ id, type: id.split(':')[0], name: id, summary: `${id} summary`, evidence: 'plausible', aliases: [id], ...extra })
const claim = (slug, status = 'unsupported') => entity(`claim:${slug}`, { statement: 's', source: 'conversation', status })
const article = entity('article:a', { authors: ['X'], year: 2000, journal: 'J', verified: true, takeaways: ['t'], pmid: '1' })

const withRelation = (item) => entity('compound:a', { relations: [item] })
const problems = (item) => checkEntity(withRelation(item)).map((issue) => `${issue.path}: ${issue.message}`)

describe('vocabulary', () => {
  it('lists the optional edge fields, signs and strengths', () => {
    expect(EDGE_FIELDS).toEqual(['sign', 'hypothesis', 'claim', 'strength'])
    expect(EDGE_SIGNS).toEqual(['+', '-'])
    expect(EDGE_STRENGTHS).toEqual(['weak', 'moderate', 'strong'])
  })

  it('gives the effect relations a sign and the structural ones none', () => {
    expect(intrinsicSign('increases')).toBe('+')
    expect(intrinsicSign('causes')).toBe('+')
    expect(intrinsicSign('aggravates')).toBe('+')
    expect(intrinsicSign('precursor-of')).toBe('+')
    expect(intrinsicSign('manifests-as')).toBe('+')
    expect(intrinsicSign('decreases')).toBe('-')
    expect(intrinsicSign('mitigates')).toBe('-')
    for (const rel of ['part-of', 'associated-with', 'interacts-with', 'cofactor-of', 'substrate-of', 'catalyzes', 'measured-by', 'evidence-for']) expect(intrinsicSign(rel), rel).toBeNull()
    for (const rel of CAUSAL_RELATIONS) expect(intrinsicSign(rel), rel).not.toBeNull()
    for (const item of RELATIONS) expect(['+', '-', null]).toContain(intrinsicSign(item.id))
  })

  it('reads the effective sign of an edge: intrinsic first, then explicit', () => {
    expect(edgeSign({ rel: 'increases' })).toBe('+')
    expect(edgeSign({ rel: 'associated-with' })).toBeNull()
    expect(edgeSign({ rel: 'associated-with', sign: '-' })).toBe('-')
    expect(edgeSign({ rel: 'cofactor-of', sign: '+' })).toBe('+')
  })
})

describe('schema', () => {
  it('accepts every field on a relation', () => {
    expect(problems({ rel: 'increases', to: 'enzyme:b', hypothesis: true, claim: 'claim:c', strength: 'weak', note: 'n' })).toEqual([])
    expect(problems({ rel: 'increases', to: 'enzyme:b', claim: 'claim:c' })).toEqual([])
    expect(problems({ rel: 'cofactor-of', to: 'enzyme:b', sign: '+' })).toEqual([])
    expect(problems({ rel: 'associated-with', to: 'enzyme:b', sign: '-', hypothesis: false })).toEqual([])
  })

  it('refuses a sign on a relation that already has one', () => {
    expect(problems({ rel: 'increases', to: 'enzyme:b', sign: '+' }).join(' ')).toMatch(/already means '\+'/)
    expect(problems({ rel: 'decreases', to: 'enzyme:b', sign: '+' }).join(' ')).toMatch(/already means '-'/)
  })

  it('refuses bad values', () => {
    expect(problems({ rel: 'associated-with', to: 'enzyme:b', sign: 'up' }).join(' ')).toMatch(/sign must be one of \+ \| -/)
    expect(problems({ rel: 'increases', to: 'enzyme:b', strength: 'huge' }).join(' ')).toMatch(/strength must be one of weak \| moderate \| strong/)
    expect(problems({ rel: 'increases', to: 'enzyme:b', hypothesis: 'yes', claim: 'claim:c' }).join(' ')).toMatch(/hypothesis must be a boolean/)
    expect(problems({ rel: 'increases', to: 'enzyme:b', claim: 'compound:c' }).join(' ')).toMatch(/must have type 'claim'/)
    expect(problems({ rel: 'increases', to: 'enzyme:b', colour: 'red' }).join(' ')).toMatch(/unknown field: colour/)
  })

  it('requires a claim on every hypothesis edge', () => {
    expect(problems({ rel: 'increases', to: 'enzyme:b', hypothesis: true }).join(' ')).toMatch(/hypothesis edge must name the claim/)
    expect(problems({ rel: 'increases', to: 'enzyme:b', hypothesis: false })).toEqual([])
  })
})

describe('graph', () => {
  const graph = buildGraph([
    entity('compound:a', { relations: [
      { rel: 'increases', to: 'enzyme:b', hypothesis: true, claim: 'claim:c', strength: 'weak', note: 'n' },
      { rel: 'cofactor-of', to: 'enzyme:b', sign: '+' },
      { rel: 'decreases', to: 'enzyme:ghost-claim', claim: 'claim:nope' },
      { rel: 'mitigates', to: 'state:s' }
    ] }),
    entity('enzyme:b'), entity('enzyme:ghost-claim'), entity('state:s'), claim('c')
  ])

  it('keeps the fields on stored edges and omits the ones that are not set', () => {
    const edge = graph.edges.find((item) => item.rel === 'increases')
    expect(edge).toMatchObject({ from: 'compound:a', to: 'enzyme:b', hypothesis: true, claim: 'claim:c', strength: 'weak', note: 'n' })
    const plain = graph.edges.find((item) => item.rel === 'mitigates')
    expect(Object.keys(plain).sort()).toEqual(['from', 'origin', 'rel', 'to'])
  })

  it('exposes the sign and fields on both sides of a link', () => {
    const out = graph.links('compound:a').find((link) => link.rel === 'increases')
    const back = graph.links('enzyme:b').find((link) => link.rel === 'increased-by')
    expect(out).toMatchObject({ direction: 'out', sign: '+', hypothesis: true, claim: 'claim:c', strength: 'weak' })
    expect(back).toMatchObject({ direction: 'in', other: 'compound:a', sign: '+', hypothesis: true, claim: 'claim:c' })
    expect(graph.links('compound:a').find((link) => link.rel === 'cofactor-of').sign).toBe('+')
    expect(graph.links('compound:a').find((link) => link.rel === 'mitigates').sign).toBe('-')
    expect(Object.hasOwn(graph.links('compound:a').find((link) => link.rel === 'mitigates'), 'hypothesis')).toBe(false)
  })

  it('records a missing claim as dangling and drops it from the edge', () => {
    expect(graph.dangling).toContainEqual(expect.objectContaining({ owner: 'compound:a', target: 'claim:nope', kind: 'claim', rel: 'decreases' }))
    expect(graph.edges.find((item) => item.to === 'enzyme:ghost-claim')).not.toHaveProperty('claim')
  })

  it('passes the fields through to page-model relation items', () => {
    const model = pageModel(graph, 'compound:a')
    const group = model.relationGroups.find((item) => item.rel === 'increases')
    expect(group.items[0]).toMatchObject({ id: 'enzyme:b', hypothesis: true, claim: 'claim:c', strength: 'weak', sign: '+' })
    const plain = model.relationGroups.find((item) => item.rel === 'mitigates').items[0]
    expect(Object.hasOwn(plain, 'hypothesis')).toBe(false)
  })
})

describe('validation', () => {
  const base = [entity('compound:a'), entity('enzyme:b'), entity('state:s'), entity('disease:d'), entity('outcome:o'), claim('c'), claim('supported', 'supported'), article]
  const linked = (relations) => [entity('compound:a', { relations, refs: ['article:a'] }), ...base.slice(1)]

  it('flags a claim that does not exist or is not a claim', () => {
    const missing = validateKnowledge(linked([{ rel: 'increases', to: 'enzyme:b', claim: 'claim:nope' }]))
    expect(missing.errors.map((item) => item.rule)).toContain('dangling-claim')
    expect(RULES['dangling-claim'].severity).toBe('error')
    const notClaim = validateKnowledge(linked([{ rel: 'increases', to: 'enzyme:b', claim: 'state:s' }]))
    expect(notClaim.errors.length).toBeGreaterThan(0)
  })

  it('flags an entity pair joined by a raising and a lowering edge', () => {
    const report = validateKnowledge(linked([{ rel: 'increases', to: 'enzyme:b' }, { rel: 'decreases', to: 'enzyme:b' }]))
    expect(report.errors.map((item) => item.rule)).toContain('sign-conflict')
    expect(report.errors.find((item) => item.rule === 'sign-conflict').message).toMatch(/both raises and lowers enzyme:b/)
    const explicit = validateKnowledge(linked([{ rel: 'cofactor-of', to: 'enzyme:b', sign: '+' }, { rel: 'decreases', to: 'enzyme:b' }]))
    expect(explicit.errors.map((item) => item.rule)).toContain('sign-conflict')
  })

  it('allows opposite signs in opposite directions (feedback)', () => {
    const entities = [
      entity('compound:a', { relations: [{ rel: 'increases', to: 'enzyme:b' }], refs: ['article:a'] }),
      entity('enzyme:b', { relations: [{ rel: 'decreases', to: 'compound:a' }] }),
      article
    ]
    expect(validateKnowledge(entities).errors.filter((item) => item.rule === 'sign-conflict')).toEqual([])
  })

  it('requires an edge asserted by an unsupported claim to be a hypothesis', () => {
    const plain = validateKnowledge(linked([{ rel: 'increases', to: 'enzyme:b', claim: 'claim:c' }]))
    expect(plain.errors.map((item) => item.rule)).toContain('edge-claim-status')
    const marked = validateKnowledge(linked([{ rel: 'increases', to: 'enzyme:b', claim: 'claim:c', hypothesis: true }]))
    expect(marked.errors.map((item) => item.rule)).not.toContain('edge-claim-status')
    const supported = validateKnowledge(linked([{ rel: 'increases', to: 'enzyme:b', claim: 'claim:supported' }]))
    expect(supported.errors.map((item) => item.rule)).not.toContain('edge-claim-status')
  })
})
