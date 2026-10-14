// Signed causal model: tiers, filtered causal graphs, upstream/downstream, type matrix, topic slices, and the
// conversation's chains as they exist in the shipped data.
import { describe, expect, it } from 'vitest'
import entities from '../../src/knowledge/data/index.js'
import paths from '../../src/knowledge/data/paths.js'
import { buildGraph } from '../../src/knowledge/graph.js'
import { TYPE_IDS } from '../../src/knowledge/types.js'
import {
  HUB_TOPICS, SLICE_LIMIT, TIERS, causalEdges, causalGraph, causalSlice, causalSlices, downstream, tierOf, typeMatrix, upstream
} from '../../src/knowledge/causal.js'

const e = (id, name, extra = {}) => ({ id, type: id.split(':')[0], name, summary: `${name} summary`, evidence: 'plausible', ...extra })
const small = buildGraph([
  e('intervention:i1', 'I1', { relations: [{ rel: 'increases', to: 'compound:a' }] }),
  e('compound:a', 'A', { relations: [{ rel: 'increases', to: 'enzyme:e', hypothesis: true, claim: 'claim:unsup', strength: 'weak', note: 'proposed' }, { rel: 'associated-with', to: 'system:s' }], refs: ['article:art'] }),
  e('enzyme:e', 'E', { relations: [{ rel: 'decreases', to: 'compound:b' }] }),
  e('compound:b', 'B', { relations: [{ rel: 'mitigates', to: 'state:st', claim: 'claim:supp' }] }),
  e('state:st', 'St', { relations: [{ rel: 'causes', to: 'disease:d' }] }),
  e('disease:d', 'D', { relations: [{ rel: 'manifests-as', to: 'outcome:o' }] }),
  e('outcome:o', 'O'),
  e('system:s', 'S', { relations: [{ rel: 'associated-with', to: 'outcome:o', sign: '+' }] }),
  e('pathway:p', 'P', { relations: [{ rel: 'part-of', to: 'system:s' }] }),
  e('reaction:r', 'R', { reaction: { reactants: [{ id: 'compound:a', n: 1 }], products: [{ id: 'compound:b', n: 1 }], enzymes: ['enzyme:e'] } }),
  e('claim:unsup', 'Unsupported', { status: 'unsupported', statement: 's', source: 'conversation' }),
  e('claim:supp', 'Supported', { status: 'supported', statement: 's', source: 'literature' }),
  e('article:art', 'Art', { authors: ['X'], year: 2000, journal: 'J', verified: true, takeaways: ['t'] })
])
const key = (edge) => `${edge.from} ${edge.rel} ${edge.to}`

describe('tiers', () => {
  it('places interventions first and outcomes last', () => {
    expect(TIERS).toMatchObject({ intervention: 0, compound: 1, enzyme: 1, pathway: 1, system: 2, state: 3, disease: 4, outcome: 5 })
    expect(tierOf('claim')).toBeNull()
    expect(tierOf('article')).toBeNull()
    expect(tierOf('nonsense')).toBeNull()
  })

  it('gives every entity type a tier except the evidence types', () => {
    for (const type of TYPE_IDS) {
      if (type === 'claim' || type === 'article') expect(tierOf(type), type).toBeNull()
      else expect(tierOf(type), type).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('causalGraph over a small graph', () => {
  it('returns signed causal edges between drawable types, with claim status and hypothesis flag', () => {
    const { nodes, edges } = causalGraph(small)
    expect(edges.map(key).sort()).toEqual([
      'compound:a increases enzyme:e', 'compound:b mitigates state:st', 'disease:d manifests-as outcome:o', 'enzyme:e decreases compound:b',
      'intervention:i1 increases compound:a', 'state:st causes disease:d', 'system:s associated-with outcome:o'
    ])
    const hypothesis = edges.find((edge) => edge.from === 'compound:a' && edge.to === 'enzyme:e')
    expect(hypothesis).toEqual({ from: 'compound:a', to: 'enzyme:e', rel: 'increases', sign: '+', hypothesis: true, claimId: 'claim:unsup', claimStatus: 'unsupported', strength: 'weak', note: 'proposed' })
    const supported = edges.find((edge) => edge.rel === 'mitigates')
    expect(supported).toMatchObject({ sign: '-', hypothesis: false, claimId: 'claim:supp', claimStatus: 'supported', strength: null, note: null })
    expect(edges.find((edge) => edge.rel === 'decreases').sign).toBe('-')
    expect(nodes.every((node) => node.tier !== null)).toBe(true)
    expect(nodes.map((node) => node.tier)).toEqual([...nodes.map((node) => node.tier)].sort((a, b) => a - b))
    expect(nodes[0]).toMatchObject({ id: 'intervention:i1', type: 'intervention', tier: 0, name: 'I1', evidence: 'plausible' })
  })

  it('never returns evidence edges, claims, articles or reactions by default', () => {
    const { nodes } = causalGraph(small)
    const types = new Set(nodes.map((node) => node.type))
    expect(types.has('article') || types.has('claim') || types.has('reaction')).toBe(false)
  })

  it('can include unsigned relations, and explicit signs on them', () => {
    const { edges } = causalGraph(small, { signedOnly: false })
    expect(edges.some((edge) => edge.rel === 'associated-with' && edge.sign === null)).toBe(true)
    const signed = edges.find((edge) => edge.from === 'system:s' && edge.to === 'outcome:o')
    expect(signed).toMatchObject({ rel: 'associated-with', sign: '+' })
    expect(causalGraph(small).edges.some((edge) => edge.from === 'system:s')).toBe(true) // the explicit sign makes it a causal edge
    expect(causalGraph(small).edges.some((edge) => edge.rel === 'part-of')).toBe(false)
    expect(edges.some((edge) => edge.rel === 'part-of')).toBe(true)
  })

  it('can drop hypothesis edges', () => {
    const { edges } = causalGraph(small, { includeHypothesis: false })
    expect(edges.some((edge) => edge.hypothesis)).toBe(false)
    expect(edges.length).toBe(causalGraph(small).edges.length - 1)
  })

  it('can include reactions when asked, and restrict the entity types', () => {
    const withReaction = causalGraph(small, { types: [...Object.keys(TIERS)], signedOnly: false })
    expect(withReaction.nodes.some((node) => node.type === 'reaction')).toBe(true)
    const onlyChemistry = causalGraph(small, { types: ['compound', 'enzyme'] })
    expect(onlyChemistry.edges.map(key).sort()).toEqual(['compound:a increases enzyme:e', 'enzyme:e decreases compound:b'])
  })

  it('restricts to relation ids', () => {
    expect(causalGraph(small, { rels: ['causes'] }).edges.map(key)).toEqual(['state:st causes disease:d'])
  })

  it('slices around a focus by depth, in both directions', () => {
    const one = causalGraph(small, { focus: 'enzyme:e', depth: 1 })
    expect(one.nodes.map((node) => node.id).sort()).toEqual(['compound:a', 'compound:b', 'enzyme:e'])
    expect(one.nodes.find((node) => node.id === 'enzyme:e').distance).toBe(0)
    expect(one.nodes.find((node) => node.id === 'compound:a').distance).toBe(1)
    const two = causalGraph(small, { focus: 'enzyme:e', depth: 2 })
    expect(two.nodes.map((node) => node.id)).toContain('intervention:i1')
    expect(two.nodes.map((node) => node.id)).toContain('state:st')
    expect(causalGraph(small, { focus: ['i1-missing'] }).nodes).toEqual([])
    expect(causalGraph(small, { focus: 'enzyme:e', depth: 0 }).nodes.map((node) => node.id)).toEqual(['enzyme:e'])
  })

  it('walks upstream (causes) and downstream (effects)', () => {
    const down = downstream(small, 'compound:a', { depth: 10 })
    expect(down.nodes.map((node) => node.id).sort()).toEqual(['compound:a', 'compound:b', 'disease:d', 'enzyme:e', 'outcome:o', 'state:st'])
    const up = upstream(small, 'compound:b', { depth: 10 })
    expect(up.nodes.map((node) => node.id).sort()).toEqual(['compound:a', 'compound:b', 'enzyme:e', 'intervention:i1'])
    expect(upstream(small, 'intervention:i1').edges).toEqual([])
    expect(downstream(small, 'outcome:o', { depth: 3 }).edges).toEqual([])
    expect(down.edges.every((edge) => down.nodes.some((node) => node.id === edge.from) && down.nodes.some((node) => node.id === edge.to))).toBe(true)
  })

  it('defaults upstream and downstream to three steps', () => {
    expect(downstream(small, 'intervention:i1').nodes.map((node) => node.id).sort()).toEqual(['compound:a', 'compound:b', 'enzyme:e', 'intervention:i1'])
  })

  it('caps the node count, keeping the focus and the nearest nodes', () => {
    const capped = causalGraph(small, { focus: 'enzyme:e', depth: 5, limit: 3 })
    expect(capped.nodes).toHaveLength(3)
    expect(capped.nodes.map((node) => node.id)).toContain('enzyme:e')
    expect(capped.edges.every((edge) => capped.nodes.some((node) => node.id === edge.from) && capped.nodes.some((node) => node.id === edge.to))).toBe(true)
  })

  it('orders nodes by tier then id and edges by endpoints', () => {
    const { nodes, edges } = causalGraph(small)
    const ids = nodes.map((node) => `${node.tier}:${node.id}`)
    expect(ids).toEqual([...ids].sort((a, b) => Number(a.split(':')[0]) - Number(b.split(':')[0]) || a.localeCompare(b)))
    const keys = edges.map(key)
    expect(keys).toEqual([...keys].sort((a, b) => a.localeCompare(b)))
  })

  it('exposes the raw filtered edges for renderers that draw their own', () => {
    expect(causalEdges(small).every((edge) => edge.rel !== 'part-of')).toBe(true)
  })
})

describe('typeMatrix', () => {
  it('counts stored edges by source and target type', () => {
    const { types, matrix, total, cells, max } = typeMatrix(small)
    expect(types).not.toContain('article')
    expect(types.indexOf('compound')).toBeLessThan(types.indexOf('enzyme'))
    expect(matrix.flat().reduce((a, b) => a + b, 0)).toBe(total)
    const cell = (from, to) => matrix[types.indexOf(from)][types.indexOf(to)]
    expect(cell('compound', 'enzyme')).toBe(1)
    expect(cell('enzyme', 'compound')).toBe(1)
    expect(cell('compound', 'reaction')).toBe(2) // substrate-of and product-of
    expect(cell('state', 'disease')).toBe(1)
    expect(cells[0].count).toBe(max)
    expect(cells.reduce((sum, item) => sum + item.count, 0)).toBe(total)
    expect(cells.find((item) => item.from === 'compound' && item.to === 'enzyme').rels).toEqual({ increases: 1 })
  })

  it('can fold the matrix, filter by origin or relation, and include evidence', () => {
    const folded = typeMatrix(small, { symmetric: true })
    const { types, matrix } = folded
    for (let i = 0; i < types.length; i += 1) for (let j = 0; j < i; j += 1) expect(matrix[i][j]).toBe(0)
    expect(typeMatrix(small, { origin: 'reaction' }).total).toBe(3)
    expect(typeMatrix(small, { rels: ['causes'] }).total).toBe(1)
    const withEvidence = typeMatrix(small, { includeEvidence: true })
    expect(withEvidence.types).toContain('article')
    expect(withEvidence.total).toBe(typeMatrix(small).total + 1)
  })
})

describe('topic slices over the shipped data', () => {
  const graph = buildGraph(entities)
  const slices = causalSlices(graph, paths)

  it('offers a slice per guided path and per hub topic', () => {
    expect(slices.filter((slice) => slice.kind === 'path')).toHaveLength(paths.length)
    expect(slices.filter((slice) => slice.kind === 'hub')).toHaveLength(HUB_TOPICS.length)
    for (const slice of slices) {
      expect(slice.title, slice.id).toBeTruthy()
      expect(slice.seeds.length, slice.id).toBeGreaterThan(0)
    }
    expect(new Set(slices.map((slice) => slice.id)).size).toBe(slices.length)
  })

  it('keeps every slice within the node limit and consistent', () => {
    expect(SLICE_LIMIT).toBe(40)
    for (const slice of slices) {
      const result = causalSlice(graph, paths, slice.id)
      expect(result.nodes.length, slice.id).toBeGreaterThan(1)
      expect(result.nodes.length, slice.id).toBeLessThanOrEqual(SLICE_LIMIT)
      expect(result.edges.length, slice.id).toBeGreaterThan(0)
      const ids = new Set(result.nodes.map((node) => node.id))
      for (const edge of result.edges) {
        expect(ids.has(edge.from) && ids.has(edge.to), `${slice.id} ${key(edge)}`).toBe(true)
        expect(edge.sign, `${slice.id} ${key(edge)}`).not.toBeNull()
      }
      for (const node of result.nodes) expect(['article', 'claim', 'reaction']).not.toContain(node.type)
    }
  })

  it('opens each hub slice with the hub itself', () => {
    for (const id of HUB_TOPICS) {
      const result = causalSlice(graph, paths, `hub:${id}`)
      expect(result.nodes.map((node) => node.id), id).toContain(id)
    }
    expect(causalSlice(graph, paths, 'hub:nothing')).toBeNull()
  })

  it('shows the guided path steps that have causal edges', () => {
    const slice = causalSlice(graph, paths, 'path:glycine-belching-question')
    const ids = slice.nodes.map((node) => node.id)
    for (const id of ['intervention:glycine-powder', 'enzyme:gnmt', 'outcome:belching']) expect(ids).toContain(id)
  })

  it('is deterministic', () => {
    const a = causalSlice(graph, paths, 'path:gut-acid-ulcers')
    const b = causalSlice(graph, paths, 'path:gut-acid-ulcers')
    expect(a).toEqual(b)
  })
})

describe("the conversation's causal chains in the shipped data", () => {
  const graph = buildGraph(entities)
  const { edges } = causalGraph(graph)
  const find = (from, rel, to) => edges.find((edge) => edge.from === from && edge.rel === rel && edge.to === to)
  const expectEdge = (from, rel, to, sign, extra = {}) => {
    const edge = find(from, rel, to)
    expect(edge, `${from} ${rel} ${to}`).toBeTruthy()
    expect(edge.sign).toBe(sign)
    expect(edge).toMatchObject(extra)
    return edge
  }

  it('links glycine load to belching through GNMT, SAM, PEMT, phosphatidylcholine, choline, acetylcholine and vagal tone', () => {
    expectEdge('intervention:glycine-powder', 'increases', 'compound:glycine', '+')
    expectEdge('compound:glycine', 'increases', 'enzyme:gnmt', '+', { hypothesis: true, claimId: 'claim:glycine-gnmt-depletes-sam-in-undermethylated', claimStatus: 'unsupported' })
    expectEdge('enzyme:gnmt', 'decreases', 'compound:sam', '-', { claimId: 'claim:gnmt-methyl-sink-valve', claimStatus: 'supported' })
    expectEdge('compound:sam', 'increases', 'enzyme:pemt', '+', { claimId: 'claim:pemt-consumes-three-sam' })
    expectEdge('enzyme:pemt', 'increases', 'compound:phosphatidylcholine', '+')
    expectEdge('compound:phosphatidylcholine', 'increases', 'compound:choline', '+', { hypothesis: true, claimStatus: 'partly-supported' })
    expectEdge('compound:choline', 'increases', 'compound:acetylcholine', '+', { hypothesis: true })
    expectEdge('compound:acetylcholine', 'increases', 'system:vagal-tone', '+', { hypothesis: true })
    expectEdge('system:vagal-tone', 'mitigates', 'state:gastric-dysmotility', '-')
    expectEdge('state:gastric-dysmotility', 'aggravates', 'outcome:belching', '+', { hypothesis: true, claimStatus: 'unsupported' })
  })

  it('reaches belching downstream of the glycine powder through that chain', () => {
    const down = downstream(graph, 'intervention:glycine-powder', { depth: 12 })
    const ids = new Set(down.nodes.map((node) => node.id))
    for (const id of ['enzyme:gnmt', 'compound:sam', 'enzyme:pemt', 'compound:phosphatidylcholine', 'compound:choline', 'compound:acetylcholine', 'system:vagal-tone', 'state:gastric-dysmotility', 'outcome:belching']) {
      expect(ids.has(id), id).toBe(true)
    }
    const hypothesisOnly = downstream(graph, 'intervention:glycine-powder', { depth: 12, includeHypothesis: false })
    expect(hypothesisOnly.nodes.some((node) => node.id === 'system:vagal-tone')).toBe(false)
  })

  it('links histamine degradation (HNMT needs SAM, DAO does not) to histamine excess, night waking and tachycardia', () => {
    expectEdge('compound:sam', 'increases', 'enzyme:hnmt', '+', { claimId: 'claim:hnmt-needs-sam' })
    expectEdge('enzyme:hnmt', 'decreases', 'compound:histamine', '-')
    expectEdge('enzyme:dao', 'decreases', 'compound:histamine', '-')
    expectEdge('pathway:histamine-degradation', 'decreases', 'state:histamine-excess', '-')
    expectEdge('state:undermethylation', 'increases', 'state:histamine-excess', '+', { hypothesis: true })
    expectEdge('state:histamine-excess', 'manifests-as', 'outcome:night-waking', '+', { hypothesis: true, claimId: 'claim:histamine-peaks-2-4am' })
    expectEdge('state:histamine-excess', 'manifests-as', 'outcome:tachycardia', '+', { claimId: 'claim:histamine-h1-h2-tachycardia-flushing', claimStatus: 'supported' })
  })

  it('no longer says the methylation product methylhistamine lowers histamine excess', () => {
    expect(find('compound:methylhistamine', 'decreases', 'state:histamine-excess')).toBeUndefined()
    expectEdge('compound:histamine', 'precursor-of', 'compound:methylhistamine', '+')
  })

  it('moves the creatine sink onto the enzymes instead of the compound', () => {
    expect(find('compound:creatine', 'decreases', 'compound:sam')).toBeUndefined()
    expect(find('compound:creatine', 'decreases', 'compound:glycine')).toBeUndefined()
    expectEdge('enzyme:gamt', 'decreases', 'compound:sam', '-')
    expectEdge('enzyme:gatm', 'decreases', 'compound:glycine', '-')
  })

  it('links choline through betaine and BHMT to methionine, SAM and (as dimethylglycine, sarcosine) glycine', () => {
    expectEdge('compound:choline', 'precursor-of', 'compound:betaine', '+')
    expectEdge('compound:betaine', 'increases', 'enzyme:bhmt', '+')
    expectEdge('enzyme:bhmt', 'increases', 'compound:methionine', '+')
    expectEdge('enzyme:bhmt', 'decreases', 'compound:homocysteine', '-')
    expectEdge('compound:methionine', 'increases', 'compound:sam', '+')
    expectEdge('enzyme:bhmt', 'increases', 'compound:dimethylglycine', '+')
    expectEdge('enzyme:dmgdh', 'increases', 'compound:sarcosine', '+')
    expectEdge('enzyme:sardh', 'increases', 'compound:glycine', '+')
    expectEdge('compound:choline', 'increases', 'compound:glycine', '+', { claimId: 'claim:choline-betaine-glycine-route', strength: 'weak' })
  })

  it('links PPI to acid suppression, hypochlorhydria, SIBO and gas', () => {
    expectEdge('intervention:ppi-therapy', 'causes', 'state:acid-suppression', '+')
    expectEdge('state:acid-suppression', 'causes', 'state:hypochlorhydria', '+')
    expectEdge('state:hypochlorhydria', 'causes', 'disease:sibo', '+')
    expectEdge('state:acid-suppression', 'increases', 'disease:sibo', '+', { claimId: 'claim:ppis-cause-sibo' })
    expectEdge('disease:sibo', 'manifests-as', 'outcome:breath-hydrogen-methane', '+')
    expectEdge('disease:sibo', 'causes', 'outcome:belching', '+', { hypothesis: true, claimStatus: 'unsupported' })
    expectEdge('pathway:migrating-motor-complex', 'decreases', 'disease:sibo', '-')
  })

  it('links acid and bicarbonate through CO2, distension, TLESR and belching to pepsin, LPR and throat burning', () => {
    expectEdge('pathway:acid-bicarbonate-neutralisation', 'increases', 'compound:carbon-dioxide', '+')
    expectEdge('pathway:acid-bicarbonate-neutralisation', 'increases', 'outcome:co2-gastric-distension', '+', { hypothesis: true, claimId: 'claim:acid-bicarbonate-reaction-gives-co2-belching' })
    expectEdge('outcome:co2-gastric-distension', 'causes', 'outcome:transient-les-relaxations', '+', { hypothesis: true })
    expectEdge('outcome:transient-les-relaxations', 'causes', 'outcome:belching', '+')
    expectEdge('outcome:belching', 'increases', 'outcome:salivary-pepsin', '+', { hypothesis: true, claimId: 'claim:belch-aerosol-deposits-pepsin' })
    expectEdge('outcome:belching', 'aggravates', 'disease:lpr', '+', { hypothesis: true })
    expectEdge('outcome:salivary-pepsin', 'aggravates', 'disease:lpr', '+')
    expectEdge('disease:lpr', 'manifests-as', 'outcome:throat-burning', '+', { claimId: 'claim:throat-burning-means-lpr' })
  })

  it('links betaine HCl through acid load to mucosal burn after an ulcer', () => {
    expectEdge('intervention:betaine-hcl', 'increases', 'compound:hydrochloric-acid', '+')
    expectEdge('compound:hydrochloric-acid', 'aggravates', 'state:post-ulcer-mucosal-recovery', '+', { claimId: 'claim:betaine-hcl-contraindicated-post-ulcer' })
    expectEdge('intervention:betaine-hcl', 'aggravates', 'disease:peptic-ulcer', '+')
    expectEdge('state:post-ulcer-mucosal-recovery', 'aggravates', 'outcome:heartburn', '+')
  })

  it('links niacin through nicotinamide and NNMT to a SAM sink', () => {
    expectEdge('intervention:niacin-nicotinamide-supplement', 'increases', 'compound:nicotinamide', '+')
    expectEdge('compound:nicotinamide', 'increases', 'enzyme:nnmt', '+')
    expectEdge('enzyme:nnmt', 'decreases', 'compound:sam', '-', { claimId: 'claim:niacin-drains-methyl-groups' })
    expectEdge('intervention:niacin-nicotinamide-supplement', 'decreases', 'compound:sam', '-', { hypothesis: true })
  })

  it('links vitamin B6 (PLP) to SHMT, the glycine cleavage system, CBS and GAD as signed cofactor edges', () => {
    for (const enzyme of ['enzyme:shmt', 'enzyme:glycine-cleavage-system', 'enzyme:cbs', 'enzyme:gad']) expectEdge('compound:plp', 'cofactor-of', enzyme, '+')
    expectEdge('state:b6-functional-deficiency', 'increases', 'compound:glycine', '+')
    expectEdge('state:b6-functional-deficiency', 'decreases', 'enzyme:gad', '-')
  })

  it('marks every edge asserted by an unsupported claim as a hypothesis, and gives every hypothesis a claim', () => {
    const withClaim = edges.filter((edge) => edge.claimId)
    expect(withClaim.length).toBeGreaterThan(60)
    for (const edge of withClaim.filter((item) => item.claimStatus === 'unsupported')) expect(edge.hypothesis, key(edge)).toBe(true)
    const hypotheses = edges.filter((edge) => edge.hypothesis)
    expect(hypotheses.length).toBeGreaterThanOrEqual(35)
    for (const edge of hypotheses) {
      expect(edge.claimId, key(edge)).toBeTruthy()
      expect(edge.claimStatus, key(edge)).toBeTruthy()
      expect(edge.strength, key(edge)).not.toBeNull()
    }
  })

  it('has a large signed layer to draw', () => {
    const all = causalGraph(graph)
    expect(all.nodes.length).toBeGreaterThan(250)
    expect(all.edges.length).toBeGreaterThan(550)
    expect(new Set(all.nodes.map((node) => node.tier))).toEqual(new Set([0, 1, 2, 3, 4, 5]))
  })
})

describe('typeMatrix over the shipped data', () => {
  const graph = buildGraph(entities)
  const { types, matrix, total, cells } = typeMatrix(graph)

  it('counts every non-evidence edge once', () => {
    const evidence = graph.edges.filter((edge) => edge.rel === 'evidence-for' || edge.rel === 'evidence-against').length
    expect(total).toBe(graph.edges.length - evidence)
    expect(matrix.flat().reduce((a, b) => a + b, 0)).toBe(total)
    expect(types).toEqual(TYPE_IDS.filter((type) => type !== 'article'))
  })

  it('shows the structure of the ontology: compounds feed reactions, enzymes sit in pathways', () => {
    const cell = (from, to) => cells.find((item) => item.from === from && item.to === to)
    expect(cell('compound', 'reaction').count).toBeGreaterThan(250)
    expect(cell('compound', 'reaction').rels).toHaveProperty('substrate-of')
    expect(cell('enzyme', 'pathway').rels['part-of']).toBeGreaterThan(50)
    expect(cell('intervention', 'outcome').count).toBeGreaterThan(20)
  })
})
