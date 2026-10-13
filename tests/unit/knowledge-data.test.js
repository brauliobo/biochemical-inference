// Quality gate for the real knowledge base (src/knowledge/data/*.js), as opposed to the fixture-based tests.
import { describe, expect, it } from 'vitest'
import entities from '../../src/knowledge/data/index.js'
import { buildGraph, connectedComponents } from '../../src/knowledge/graph.js'
import { pageModel, search } from '../../src/knowledge/page-model.js'
import { TYPE_IDS } from '../../src/knowledge/types.js'
import { validateKnowledge } from '../../src/knowledge/validate.js'

const report = validateKnowledge(entities)
const graph = buildGraph(entities)

// Floors, not exact counts: they stop content from being deleted by accident but let it grow.
const MINIMUM_PER_TYPE = {
  compound: 130,
  enzyme: 60,
  reaction: 55,
  pathway: 20,
  state: 12,
  disease: 20,
  outcome: 30,
  system: 15,
  intervention: 45,
  claim: 50,
  article: 200
}

describe('the real dataset validates', () => {
  it('has zero validation errors', () => {
    expect(report.errors.map((item) => `${item.rule} ${item.id} ${item.message}`)).toEqual([])
    expect(report.ok).toBe(true)
  })

  it('only warns about claims that are openly flagged as unsupported or conversation-only', () => {
    const rules = new Set(report.warnings.map((item) => item.rule))
    expect([...rules].every((rule) => rule === 'claim-flagged-no-evidence')).toBe(true)
    for (const warning of report.warnings) {
      const claim = graph.get(warning.id)
      expect(claim.type).toBe('claim')
      expect(claim.status === 'unsupported' || claim.evidence === 'conversation-only').toBe(true)
    }
  })

  it('has no duplicate ids and one connected graph', () => {
    expect(graph.duplicates).toEqual([])
    expect(graph.dangling).toEqual([])
    expect(graph.malformedMentions).toEqual([])
    expect(connectedComponents(graph)).toHaveLength(1)
  })
})

describe('type coverage', () => {
  it('has at least one entity of every type', () => {
    for (const type of TYPE_IDS) expect(graph.byType.get(type).length, type).toBeGreaterThan(0)
  })

  it('keeps a minimum number of entities per type', () => {
    for (const [type, floor] of Object.entries(MINIMUM_PER_TYPE)) {
      expect(graph.byType.get(type).length, type).toBeGreaterThanOrEqual(floor)
    }
    expect(Object.keys(MINIMUM_PER_TYPE).sort()).toEqual([...TYPE_IDS].sort())
  })

  it('reports counts that match the graph', () => {
    expect(report.counts.entities).toBe(entities.length)
    for (const type of TYPE_IDS) expect(report.counts.byType[type]).toBe(graph.byType.get(type).length)
  })
})

describe('evidence discipline', () => {
  const articles = entities.filter((entity) => entity.type === 'article')
  const claims = entities.filter((entity) => entity.type === 'claim')

  it('keeps every article verified, with a persistent identifier and at least one takeaway', () => {
    for (const article of articles) {
      expect(article.verified, article.id).toBe(true)
      expect(Boolean(article.doi || article.pmid || article.url), article.id).toBe(true)
      expect(article.takeaways.length, article.id).toBeGreaterThan(0)
    }
  })

  it('gives every claim at least one evidence-for or evidence-against edge unless it is flagged', () => {
    const unflagged = claims.filter((claim) => claim.status !== 'unsupported' && claim.evidence !== 'conversation-only')
    for (const claim of unflagged) {
      const links = graph.links(claim.id).filter((link) => link.rel === 'has-evidence' || link.rel === 'has-counterevidence')
      expect(links.length, claim.id).toBeGreaterThan(0)
    }
  })

  it('never grades an unsupported claim above speculative', () => {
    for (const claim of claims.filter((item) => item.status === 'unsupported')) {
      expect(['speculative', 'conversation-only'], claim.id).toContain(claim.evidence)
    }
  })

  it('records literature that contradicts a claim on the claim', () => {
    const against = (id) => graph.links(id).filter((link) => link.rel === 'has-counterevidence').map((link) => link.other)
    expect(against('claim:free-glycine-stimulates-gastrin')).toEqual(expect.arrayContaining(['article:taylor-1982-amino-acids-gastric-acid', 'article:wald-1982-glycine-gastric-acid']))
    expect(against('claim:pyroluria-causes-b6-zinc-deficiency')).toContain('article:warren-2021-pyroluria-fact-or-fiction')
    expect(against('claim:dgl-ulcer-healing')).toContain('article:engqvist-1973-dgl-gastric-ulcer')
    expect(against('claim:p5p-bypasses-hepatic-activation')).toContain('article:middleton-1986-plp-intestinal-hydrolysis')
  })

  it('references every established non-article entity to at least one article', () => {
    for (const entity of entities.filter((item) => item.evidence === 'established' && item.type !== 'article')) {
      const cited = graph.links(entity.id).some((link) => link.rel === 'has-evidence' && graph.get(link.other).type === 'article')
      expect(cited, entity.id).toBe(true)
    }
  })
})

describe('reactions', () => {
  it('only use compounds as participants and enzymes as catalysts, all of which exist', () => {
    for (const reaction of entities.filter((entity) => entity.type === 'reaction')) {
      const { reactants, products, enzymes = [] } = reaction.reaction
      for (const item of [...reactants, ...products]) expect(graph.get(item.id)?.type, `${reaction.id} ${item.id}`).toBe('compound')
      for (const id of enzymes) expect(graph.get(id)?.type, `${reaction.id} ${id}`).toBe('enzyme')
    }
  })

  it('resolves the small molecules and cofactors that reactions rely on', () => {
    for (const id of ['compound:water', 'compound:proton', 'compound:nad', 'compound:nadph', 'compound:phosphate', 'compound:coa', 'compound:acetyl-coa', 'compound:oxygen', 'compound:hydrogen-peroxide']) {
      expect(graph.get(id), id).toBeDefined()
    }
  })
})

describe('naming', () => {
  it('uses one canonical id per concept (retired aliases stay absent)', () => {
    const retired = [
      'compound:5-methyl-thf', 'enzyme:gcs', 'intervention:ppi', 'intervention:p5p', 'intervention:methylfolate',
      'intervention:alginate', 'intervention:h-pylori-eradication', 'intervention:choline-salts', 'enzyme:badh',
      'compound:glycocholate', 'compound:taurocholate', 'compound:vitamin-b12-methylcobalamin', 'enzyme:urease-h-pylori'
    ]
    for (const id of retired) expect(graph.get(id), id).toBeUndefined()
  })

  it('defines family-level enzymes next to their isoforms', () => {
    for (const id of ['enzyme:shmt', 'enzyme:gad', 'enzyme:mat', 'enzyme:glycine-cleavage-system']) expect(graph.get(id)?.type, id).toBe('enzyme')
  })
})

describe('topic pages are rich', () => {
  const TOPICS = [
    'state:undermethylation', 'state:overmethylation', 'compound:glycine', 'compound:choline', 'compound:betaine',
    'enzyme:gnmt', 'disease:peptic-ulcer', 'disease:sibo', 'disease:lpr', 'outcome:belching'
  ]

  it.each(TOPICS)('%s links to at least 10 distinct non-article entities of at least 4 types', (id) => {
    const others = new Set(graph.links(id).map((link) => link.other).filter((other) => graph.get(other).type !== 'article'))
    const types = new Set([...others].map((other) => graph.get(other).type))
    expect(others.size).toBeGreaterThanOrEqual(10)
    expect(types.size).toBeGreaterThanOrEqual(4)
  })

  it.each(TOPICS)('%s has at least three typed relation groups besides "associated with"', (id) => {
    const page = pageModel(graph, id)
    const groups = page.relationGroups.filter((group) => group.rel !== 'associated-with' && group.rel !== 'interacts-with')
    expect(groups.length).toBeGreaterThanOrEqual(3)
  })

  it('lists the key helps, aggravates and contraindications explicitly', () => {
    const has = (from, rel, to) => expect(graph.links(from).some((link) => link.rel === rel && link.other === to), `${from} ${rel} ${to}`).toBe(true)
    has('compound:niacin', 'aggravates', 'state:undermethylation')
    has('compound:betaine', 'mitigates', 'state:undermethylation')
    has('compound:glycine', 'contraindicated-in', 'disease:nonketotic-hyperglycinemia')
    has('intervention:betaine-hcl', 'contraindicated-in', 'disease:peptic-ulcer')
    has('intervention:sodium-alginate', 'mitigates', 'disease:lpr')
    has('intervention:zinc-carnosine', 'mitigates', 'disease:peptic-ulcer')
    has('intervention:ppi-therapy', 'aggravates', 'disease:sibo')
    has('intervention:diaphragmatic-breathing', 'mitigates', 'outcome:belching')
  })
})

describe('page models and search over the whole dataset', () => {
  it('builds a page for every entity without throwing', () => {
    for (const entity of entities) {
      const page = pageModel(graph, entity.id)
      expect(page, entity.id).not.toBeNull()
      expect(page.name).toBe(entity.name)
    }
  })

  it('finds entities by name, alias and abbreviation', () => {
    expect(search(graph, 'GNMT')[0].id).toBe('enzyme:gnmt')
    expect(search(graph, 'glicina')[0].id).toBe('compound:glycine')
    expect(search(graph, 'P5P').map((hit) => hit.id)).toContain('intervention:p5p-supplement')
  })
})
