import { describe, expect, it } from 'vitest'
import { buildGraph, connectedComponents, shortestPath } from '../../src/knowledge/graph.js'
import { extractMentions, parseMentions, resolveMentions } from '../../src/knowledge/mentions.js'
import { edited, fixture } from '../fixtures/knowledge/helpers.js'

const graph = buildGraph(fixture())
const linkTo = (from, other, rel) => graph.links(from).find((link) => link.other === other && (!rel || link.rel === rel))

describe('graph building', () => {
  it('indexes entities by id and by type, including empty types', () => {
    expect(graph.entities).toHaveLength(23)
    expect(graph.get('enzyme:gnmt').name).toBe('Glycine N-methyltransferase')
    expect(graph.has('enzyme:nope')).toBe(false)
    expect(graph.byType.get('compound')).toHaveLength(8)
    expect(buildGraph([]).byType.get('claim')).toEqual([])
  })

  it('is immutable and independent of its input', () => {
    const input = fixture()
    const built = buildGraph(input)
    input[0].name = 'changed afterwards'
    expect(built.get('compound:glycine').name).toBe('Glycine')
    expect(() => { built.get('compound:glycine').name = 'x' }).toThrow(TypeError)
    expect(() => built.byId.set('x', {})).toThrow(/immutable/)
    expect(() => built.byType.get('compound').push({})).toThrow(TypeError)
    expect(() => built.links('compound:glycine').push({})).toThrow(TypeError)
    expect(Object.isFrozen(built)).toBe(true)
  })

  it('keeps the first of duplicate ids and records the rest', () => {
    const entities = fixture()
    entities.push({ ...entities[0], name: 'Imposter' })
    const built = buildGraph(entities)
    expect(built.duplicates).toEqual(['compound:glycine'])
    expect(built.get('compound:glycine').name).toBe('Glycine')
    expect(built.entities).toHaveLength(23)
  })

  it('records dangling references instead of throwing and leaves them out of the graph', () => {
    const built = buildGraph(edited((entities, find) => {
      find('compound:glycine').relations.push({ rel: 'increases', to: 'compound:ghost' })
      find('compound:glycine').refs = ['article:ghost']
      find('compound:glycine').body.push('see [[state:ghost]]')
      find('reaction:gnmt-methylation').reaction.enzymes.push('enzyme:ghost')
    }))
    expect(built.dangling.map(({ owner, target, kind, path }) => [owner, target, kind, path])).toEqual(expect.arrayContaining([
      ['compound:glycine', 'compound:ghost', 'relation', 'relations[1]'],
      ['compound:glycine', 'article:ghost', 'ref', 'refs[0]'],
      ['compound:glycine', 'state:ghost', 'mention', 'body[1]'],
      ['reaction:gnmt-methylation', 'enzyme:ghost', 'reaction', 'reaction.enzymes[1]']
    ]))
    expect(built.neighbors('compound:glycine')).not.toContain('compound:ghost')
  })

  it('records malformed mentions and unknown relations', () => {
    const built = buildGraph(edited((entities, find) => {
      find('compound:sam').body.push('broken [[sam]] and [[compound:Sam]]')
      find('compound:sam').relations.push({ rel: 'likes', to: 'compound:glycine' })
    }))
    expect(built.malformedMentions.map((item) => item.raw)).toEqual(['[[sam]]', '[[compound:Sam]]'])
    expect(built.unknownRelations).toEqual([{ owner: 'compound:sam', rel: 'likes', path: 'relations[1]' }])
  })
})

describe('inverse derivation', () => {
  it('exposes declared edges forward and derives inverses in links()', () => {
    expect(graph.outgoing('enzyme:gnmt').map((edge) => edge.rel)).toContain('decreases')
    expect(graph.incoming('compound:sam').some((edge) => edge.from === 'enzyme:gnmt' && edge.rel === 'decreases')).toBe(true)
    expect(linkTo('enzyme:gnmt', 'compound:sam', 'decreases')).toMatchObject({ direction: 'out', label: 'Decreases', origin: 'declared' })
    expect(linkTo('compound:sam', 'enzyme:gnmt', 'decreased-by')).toMatchObject({ direction: 'in', label: 'Decreased by', origin: 'declared' })
  })

  it('carries notes to both directions', () => {
    expect(linkTo('compound:glycine', 'compound:sarcosine', 'precursor-of').note).toBe('via methylation')
    expect(linkTo('compound:sarcosine', 'compound:glycine', 'derived-from').note).toBe('via methylation')
  })

  it('stores symmetric relations once and shows them on both sides', () => {
    const symmetric = graph.edges.filter((edge) => edge.rel === 'interacts-with')
    expect(symmetric).toHaveLength(1)
    expect(linkTo('intervention:glycine-supplement', 'intervention:tmg-supplement', 'interacts-with').direction).toBe('sym')
    expect(linkTo('intervention:tmg-supplement', 'intervention:glycine-supplement', 'interacts-with').direction).toBe('sym')
  })

  it('merges a symmetric relation declared from both sides into one edge', () => {
    const built = buildGraph(edited((entities, find) => {
      find('intervention:tmg-supplement').relations.push({ rel: 'interacts-with', to: 'intervention:glycine-supplement' })
    }))
    expect(built.edges.filter((edge) => edge.rel === 'interacts-with')).toHaveLength(1)
  })
})

describe('derived relations', () => {
  it('derives substrate-of / product-of / catalyzes from the reaction', () => {
    expect(linkTo('compound:glycine', 'reaction:gnmt-methylation', 'substrate-of')).toMatchObject({ origin: 'reaction', direction: 'out' })
    expect(linkTo('compound:sarcosine', 'reaction:gnmt-methylation', 'product-of')).toMatchObject({ origin: 'reaction' })
    expect(linkTo('enzyme:gnmt', 'reaction:gnmt-methylation', 'catalyzes')).toMatchObject({ origin: 'reaction' })
    expect(linkTo('reaction:gnmt-methylation', 'compound:glycine', 'has-substrate')).toMatchObject({ direction: 'in' })
    expect(linkTo('reaction:gnmt-methylation', 'compound:sah', 'has-product')).toBeTruthy()
    expect(linkTo('reaction:gnmt-methylation', 'enzyme:gnmt', 'catalyzed-by')).toBeTruthy()
  })

  it('derives evidence from refs', () => {
    expect(linkTo('article:fixture-gnmt-review', 'compound:glycine', 'evidence-for')).toMatchObject({ origin: 'ref' })
    expect(linkTo('compound:glycine', 'article:fixture-gnmt-review', 'has-evidence')).toMatchObject({ direction: 'in' })
    expect(linkTo('article:fixture-unverified', 'claim:glycine-depletes-sam', 'evidence-against').origin).toBe('declared')
    expect(linkTo('claim:glycine-depletes-sam', 'article:fixture-unverified', 'has-counterevidence')).toBeTruthy()
  })

  it('does not duplicate an edge that is both declared and derivable', () => {
    const built = buildGraph(edited((entities, find) => {
      find('compound:glycine').relations.push({ rel: 'substrate-of', to: 'reaction:gnmt-methylation', note: 'declared too' })
    }))
    const matching = built.edges.filter((edge) => edge.from === 'compound:glycine' && edge.rel === 'substrate-of')
    expect(matching).toHaveLength(1)
    expect(matching[0]).toMatchObject({ origin: 'declared', note: 'declared too' })
  })

  it('counts declared and derived edges', () => {
    expect(graph.stats.declared + graph.stats.derived).toBe(graph.stats.edges)
    expect(graph.stats.derived).toBeGreaterThan(0)
  })
})

describe('mentions', () => {
  it('parses plain, labelled and malformed mentions', () => {
    expect(parseMentions('a [[compound:sam]] b [[enzyme:gnmt|the enzyme]] c [[nope]] d')).toEqual([
      { text: 'a ' },
      { mention: { id: 'compound:sam', label: null } },
      { text: ' b ' },
      { mention: { id: 'enzyme:gnmt', label: 'the enzyme' } },
      { text: ' c ' },
      { malformed: '[[nope]]' },
      { text: ' d' }
    ])
    expect(parseMentions('no mentions')).toEqual([{ text: 'no mentions' }])
    expect(parseMentions('[[ compound:sam | spaced ]]')).toEqual([{ mention: { id: 'compound:sam', label: 'spaced' } }])
  })

  it('extracts distinct ids in order of appearance', () => {
    expect(extractMentions('[[compound:b]] [[compound:a]] [[compound:b|again]] [[oops]]')).toEqual({ ids: ['compound:b', 'compound:a'], malformed: ['[[oops]]'] })
  })

  it('resolves mentions to link segments and degrades unknown ones to text', () => {
    const lookup = (id) => graph.get(id)
    expect(resolveMentions('Uses [[compound:sam]] and [[enzyme:gnmt|GNMT]]; also [[state:ghost|a ghost]] [[oops]].', lookup)).toEqual([
      { text: 'Uses ' },
      { link: { id: 'compound:sam', label: 'S-adenosylmethionine', type: 'compound' } },
      { text: ' and ' },
      { link: { id: 'enzyme:gnmt', label: 'GNMT', type: 'enzyme' } },
      { text: '; also a ghost [[oops]].' }
    ])
  })

  it('indexes mentions both ways without counting self-mentions', () => {
    expect(graph.mentions('compound:glycine')).toEqual(['enzyme:gnmt', 'intervention:glycine-supplement'])
    expect(graph.mentionedBy('enzyme:gnmt')).toContain('compound:glycine')
    const built = buildGraph(edited((entities, find) => { find('compound:sam').body.push('I am [[compound:sam]]') }))
    expect(built.mentions('compound:sam')).not.toContain('compound:sam')
    expect(built.dangling).toEqual([])
  })

  it('treats mentions as navigation links in neighbors()', () => {
    expect(graph.neighbors('pathway:methionine-cycle')).toEqual(expect.arrayContaining(['compound:sam', 'compound:methionine', 'reaction:gnmt-methylation']))
    expect(graph.degree('claim:glycine-depletes-sam')).toBe(graph.neighbors('claim:glycine-depletes-sam').length)
    expect(graph.neighbors('does:not-exist')).toEqual([])
  })
})

describe('shortestPath', () => {
  it('returns the single node for identical endpoints', () => {
    expect(shortestPath(graph, 'compound:sam', 'compound:sam')).toEqual({ ids: ['compound:sam'], steps: [] })
  })

  it('finds a direct link with its relation label', () => {
    const path = shortestPath(graph, 'enzyme:gnmt', 'compound:sam')
    expect(path.ids).toEqual(['enzyme:gnmt', 'compound:sam'])
    expect(path.steps).toEqual([{ from: 'enzyme:gnmt', to: 'compound:sam', rel: 'decreases', label: 'Decreases', kind: 'relation' }])
  })

  it('walks relations backwards using inverse labels and through multiple hops', () => {
    const path = shortestPath(graph, 'compound:sarcosine', 'enzyme:gnmt', { avoidTypes: ['compound', 'article'] })
    expect(path.ids).toEqual(['compound:sarcosine', 'reaction:gnmt-methylation', 'enzyme:gnmt'])
    expect(path.steps[0]).toMatchObject({ from: 'compound:sarcosine', rel: 'product-of', kind: 'relation' })
    expect(path.steps[1]).toMatchObject({ to: 'enzyme:gnmt', rel: 'catalyzed-by' })
  })

  it('reports mention hops', () => {
    const path = shortestPath(graph, 'pathway:methionine-cycle', 'compound:homocysteine', { avoidTypes: ['reaction'] })
    expect(path.ids).toEqual(['pathway:methionine-cycle', 'compound:homocysteine'])
    expect(path.steps[0]).toMatchObject({ rel: 'mentions', kind: 'mention' })
    expect(shortestPath(graph, 'compound:homocysteine', 'pathway:methionine-cycle', { avoidTypes: ['reaction'] }).steps[0]).toMatchObject({ rel: 'mentioned-by', kind: 'mention' })
  })

  it('can avoid hub types as stepping stones', () => {
    const through = shortestPath(graph, 'compound:glycine', 'compound:sah')
    expect(through.ids.length).toBeLessThan(5)
    const avoided = shortestPath(graph, 'compound:glycine', 'compound:sah', { avoidTypes: ['article', 'reaction', 'compound'] })
    expect(avoided === null || avoided.ids.slice(1, -1).every((id) => !['article', 'reaction', 'compound'].includes(graph.get(id).type))).toBe(true)
  })

  it('returns null for unknown or disconnected entities', () => {
    expect(shortestPath(graph, 'compound:sam', 'compound:ghost')).toBeNull()
    const island = buildGraph([...fixture(), { id: 'compound:island', type: 'compound', name: 'Island', summary: 's', evidence: 'plausible' }])
    expect(shortestPath(island, 'compound:island', 'compound:sam')).toBeNull()
  })
})

describe('connectedComponents', () => {
  it('finds one component in the connected fixture', () => {
    const components = connectedComponents(graph)
    expect(components).toHaveLength(1)
    expect(components[0]).toHaveLength(23)
  })

  it('separates islands, largest first', () => {
    const extra = [
      { id: 'compound:island-a', type: 'compound', name: 'A', summary: 's', evidence: 'plausible', relations: [{ rel: 'precursor-of', to: 'compound:island-b' }] },
      { id: 'compound:island-b', type: 'compound', name: 'B', summary: 's', evidence: 'plausible' },
      { id: 'compound:lonely', type: 'compound', name: 'L', summary: 's', evidence: 'plausible' }
    ]
    const components = connectedComponents(buildGraph([...fixture(), ...extra]))
    expect(components.map((component) => component.length)).toEqual([23, 2, 1])
    expect(components[1]).toEqual(['compound:island-a', 'compound:island-b'])
  })
})
