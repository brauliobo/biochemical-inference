import { describe, expect, it } from 'vitest'
import { graph } from '../../src/knowledge/index.js'
import {
  ARTICLE_SORTS, DESIGN_CLASSES, DESIGN_IDS, PRIOR_WEIGHT, SCORING, UNVERIFIED_FACTOR, articleWeight, buildEvidenceModel, designInfo, normalizeDesign, supportIndex
} from '../../src/kb/evidence.js'

// Every free-text `facts.design` in the data, with the class it must land in. The list is the policy:
// a new design text that is not covered fails the "no unclassified article" test below.
const EXPECTED = {
  'meta-analysis': 'meta-analysis',
  'meta-analysis of observational studies': 'meta-analysis',
  'systematic-review': 'systematic review',
  'systematic review': 'systematic review',
  RCT: 'RCT',
  rct: 'RCT',
  guideline: 'guideline',
  consensus: 'guideline',
  'consensus statement': 'guideline',
  cohort: 'cohort/observational',
  'case-control': 'cohort/observational',
  'cross-sectional': 'cohort/observational',
  survey: 'cohort/observational',
  'genetic-association': 'cohort/observational',
  'genetic association with functional work': 'cohort/observational',
  'autopsy study': 'cohort/observational',
  'case report': 'case report',
  'case series': 'case report',
  animal: 'mechanistic/animal',
  'animal study': 'mechanistic/animal',
  'knockout mouse': 'mechanistic/animal',
  'mathematical model': 'mechanistic/animal',
  'modelling study': 'mechanistic/animal',
  'in-vitro': 'in-vitro',
  'in vitro': 'in-vitro',
  enzymology: 'in-vitro',
  'in-vitro enzymology': 'in-vitro',
  biochemistry: 'in-vitro',
  review: 'review',
  'workshop review': 'review',
  'expert review': 'review',
  'expert opinion': 'review',
  textbook: 'database/reference',
  database: 'database/reference',
  'risk assessment': 'database/reference',
  'analytical method': 'database/reference',
  'assay validation with cohort comparison': 'database/reference',
  'food composition analysis': 'database/reference',
  'physiology study': 'human experimental',
  'physiological study (pH telemetry)': 'human experimental',
  'human physiology study': 'human experimental',
  'tracer-study': 'human experimental',
  'imaging study': 'human experimental',
  'pharmacokinetic study': 'human experimental',
  'human pharmacokinetic study': 'human experimental',
  'controlled human study': 'human experimental',
  'controlled crossover study': 'human experimental',
  'controlled trial': 'human experimental',
  'controlled feeding trial': 'human experimental',
  'controlled feeding study': 'human experimental',
  'controlled depletion study': 'human experimental',
  'controlled depletion study with genetic association': 'human experimental',
  'metabolic-ward study': 'human experimental',
  'dose-escalation study': 'human experimental',
  'before-after trial': 'human experimental',
  'human intervention study': 'human experimental',
  'intervention study': 'human experimental',
  'clinical study': 'human experimental',
  'uncontrolled outcome study': 'human experimental'
}

describe('normalizeDesign', () => {
  for (const [raw, expected] of Object.entries(EXPECTED)) {
    it(`"${raw}" is ${expected}`, () => expect(normalizeDesign(raw)).toBe(expected))
  }

  it('is case-insensitive and tolerant of padding, and never throws on odd input', () => {
    expect(normalizeDesign('  Randomised Controlled Trial ')).toBe('RCT')
    expect(normalizeDesign('META-ANALYSIS')).toBe('meta-analysis')
    expect(normalizeDesign(undefined)).toBe('unclassified')
    expect(normalizeDesign(null)).toBe('unclassified')
    expect(normalizeDesign('')).toBe('unclassified')
    expect(normalizeDesign(42)).toBe('unclassified')
    expect(normalizeDesign('completely unknown wording')).toBe('unclassified')
  })

  it('gives every article in the dataset one of the canonical classes (no "unclassified")', () => {
    const articles = graph.byType.get('article')
    expect(articles.length).toBeGreaterThan(0)
    const bad = articles.filter((article) => !DESIGN_IDS.includes(normalizeDesign(article.facts?.design))).map((article) => `${article.id}: ${article.facts?.design}`)
    expect(bad).toEqual([])
  })

  it('collapses the many free-text variants into the canonical set and uses every class', () => {
    const articles = graph.byType.get('article')
    const raw = new Set(articles.map((article) => article.facts.design))
    const classes = new Set(articles.map((article) => normalizeDesign(article.facts.design)))
    expect(raw.size).toBeGreaterThan(40)
    expect(classes.size).toBeLessThanOrEqual(DESIGN_CLASSES.length)
    for (const id of DESIGN_IDS) expect(classes.has(id), id).toBe(true)
  })

  it('covers the ten classes the dashboards promise, plus human experimental', () => {
    expect(DESIGN_IDS).toEqual(expect.arrayContaining(['RCT', 'meta-analysis', 'systematic review', 'guideline', 'cohort/observational', 'mechanistic/animal', 'in-vitro', 'review', 'database/reference', 'case report']))
    expect(DESIGN_IDS).toContain('human experimental')
  })
})

describe('design weights and the support index', () => {
  it('orders the designs from strongest to weakest evidence in the hierarchy it documents', () => {
    const weight = (id) => designInfo(id).weight
    expect(weight('meta-analysis')).toBeGreaterThan(weight('systematic review'))
    expect(weight('systematic review')).toBeGreaterThan(weight('RCT'))
    expect(weight('RCT')).toBeGreaterThan(weight('human experimental'))
    expect(weight('human experimental')).toBeGreaterThan(weight('cohort/observational'))
    expect(weight('cohort/observational')).toBeGreaterThan(weight('mechanistic/animal'))
    expect(weight('mechanistic/animal')).toBeGreaterThan(weight('in-vitro'))
    for (const design of DESIGN_CLASSES) {
      expect(design.weight, design.id).toBeGreaterThan(0)
      expect(design.weight, design.id).toBeLessThanOrEqual(1)
    }
  })

  it('weights an article by its design and halves it when the citation is unverified', () => {
    expect(articleWeight({ design: 'RCT', verified: true })).toBe(0.85)
    expect(articleWeight({ design: 'RCT', verified: false })).toBeCloseTo(0.85 * UNVERIFIED_FACTOR)
    expect(articleWeight({ design: 'something else' })).toBe(designInfo('unclassified').weight)
  })

  it('computes (for - against) / (for + against + prior): zero without sources, antisymmetric, bounded, slow to saturate', () => {
    expect(PRIOR_WEIGHT).toBe(1)
    expect(supportIndex(0, 0)).toBe(0)
    expect(supportIndex(1, 0)).toBeCloseTo(0.5)
    expect(supportIndex(0, 1)).toBeCloseTo(-0.5)
    expect(supportIndex(3, 1)).toBeCloseTo(2 / 5)
    for (const [a, b] of [[0.3, 2], [5, 0.1], [12, 12], [40, 0]]) {
      expect(supportIndex(a, b)).toBeCloseTo(-supportIndex(b, a))
      expect(Math.abs(supportIndex(a, b))).toBeLessThan(1)
    }
    expect(supportIndex(10, 0)).toBeGreaterThan(supportIndex(1, 0))
    expect(supportIndex(1, 1)).toBe(0)
  })

  it('states the formula and says plainly that it is not a meta-analysis', () => {
    expect(SCORING.formula).toBe('support index = (for - against) / (for + against + 1)')
    expect(SCORING.summary).toMatch(/not a meta-analysis/i)
    expect(SCORING.steps.length).toBeGreaterThanOrEqual(3)
  })
})

describe('buildEvidenceModel on the real data', () => {
  const model = buildEvidenceModel(graph)

  it('covers every article and claim and is cached per graph', () => {
    expect(model.articles).toHaveLength(graph.byType.get('article').length)
    expect(model.claims).toHaveLength(graph.byType.get('claim').length)
    expect(buildEvidenceModel(graph)).toBe(model)
  })

  it('counts the claim statuses the dashboards advertise', () => {
    const count = (status) => model.claims.filter((claim) => claim.status === status).length
    expect([count('supported'), count('partly-supported'), count('unsupported'), count('contested')]).toEqual([11, 33, 14, 7])
  })

  it('gives every article a year, a canonical design, a topic and a weight', () => {
    for (const article of model.articles) {
      expect(Number.isInteger(article.year), article.id).toBe(true)
      expect(DESIGN_IDS, article.id).toContain(article.design)
      expect(article.topic, article.id).toBeTruthy()
      expect(article.weight, article.id).toBeGreaterThan(0)
      expect(article.nInforms, article.id).toBeGreaterThan(0)
    }
  })

  it('computes the support of a claim from exactly its linked articles', () => {
    for (const claim of model.claims) {
      const links = graph.links(claim.id)
      expect(claim.nFor, claim.id).toBe(links.filter((link) => link.rel === 'has-evidence' && graph.get(link.other).type === 'article').length)
      expect(claim.nAgainst, claim.id).toBe(links.filter((link) => link.rel === 'has-counterevidence' && graph.get(link.other).type === 'article').length)
      expect(claim.evidenceFor, claim.id).toBeCloseTo(claim.supporting.reduce((total, article) => total + article.weight, 0), 2)
      expect(claim.index, claim.id).toBeCloseTo(supportIndex(claim.evidenceFor, claim.evidenceAgainst), 2)
    }
  })

  it('ranks the glycine-gastrin claim as contradicted and a claim with no sources at zero', () => {
    const gastrin = model.claimById.get('claim:free-glycine-stimulates-gastrin')
    expect(gastrin.status).toBe('unsupported')
    expect(gastrin.nFor).toBe(0)
    expect(gastrin.nAgainst).toBeGreaterThan(0)
    expect(gastrin.index).toBeLessThan(0)
    const unsourced = model.claims.filter((claim) => claim.nFor + claim.nAgainst === 0)
    expect(unsourced.length).toBeGreaterThan(0)
    for (const claim of unsourced) {
      expect(claim.index).toBe(0)
      expect(claim.bestDesign).toBeNull()
    }
  })

  it('assigns every claim to one of the six topics', () => {
    const topics = new Set(model.claims.map((claim) => claim.topic))
    expect([...topics].sort()).toEqual(['b6-gaba', 'choline', 'gastric', 'histamine', 'methylation', 'supplements'])
  })

  it('lists the sort options once', () => {
    expect(new Set(ARTICLE_SORTS.map((sort) => sort.id)).size).toBe(ARTICLE_SORTS.length)
  })
})
