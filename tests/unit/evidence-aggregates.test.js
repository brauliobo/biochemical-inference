import { describe, expect, it } from 'vitest'
import { graph } from '../../src/knowledge/index.js'
import {
  DESIGN_IDS, TOPIC_IDS, buildEvidenceModel, coverageGaps, coverageMatrix, dumbbellRows, filterArticles, filterClaims, informsByType, readArticleFilters, readClaimFilters,
  relatedArticles, shortAuthors, signed, sortArticles, sortClaims, statusCounts, timelineGroups, timelineItems, typeGradeMatrix, verdictBar, verdictBarText, whyChips, writeArticleFilters, writeClaimFilters, yearExtent
} from '../../src/kb/evidence.js'

const model = buildEvidenceModel(graph)

describe('headline numbers', () => {
  it('counts claims by status in display order with shares that add to one', () => {
    const counts = statusCounts(model.claims)
    expect(counts.map((entry) => [entry.status, entry.count])).toEqual([['supported', 11], ['partly-supported', 33], ['unsupported', 14], ['contested', 7]])
    expect(counts.reduce((total, entry) => total + entry.share, 0)).toBeCloseTo(1)
    expect(counts[0]).toMatchObject({ label: 'Supported', tone: 'success' })
  })

  it('builds the type by grade matrix from every entity', () => {
    const { rows, cols, values } = typeGradeMatrix(graph)
    expect(rows.map((row) => row.id)).toContain('article')
    expect(cols.map((col) => col.id)).toEqual(['established', 'plausible', 'speculative', 'conversation-only'])
    let total = 0
    for (const row of rows) for (const col of cols) total += values(row.id, col.id)
    expect(total).toBe(graph.entities.length)
    expect(values('claim', 'speculative') + values('claim', 'established') + values('claim', 'plausible') + values('claim', 'conversation-only')).toBe(65)
  })
})

describe('coverage', () => {
  const matrix = coverageMatrix(model.articles)

  it('counts every article exactly once across topics and designs', () => {
    let total = 0
    for (const row of matrix.rows) for (const col of matrix.cols) total += matrix.values(row.id, col.id)
    expect(total).toBe(model.articles.length)
    expect(matrix.rows.map((row) => row.id)).toEqual(TOPIC_IDS)
    expect(matrix.cols.map((col) => col.id)).toEqual(DESIGN_IDS)
  })

  it('names the gaps: histamine and sleep has no meta-analysis and only one RCT', () => {
    const gaps = coverageGaps(model.articles)
    expect(gaps).toHaveLength(TOPIC_IDS.length)
    const histamine = gaps.find((entry) => entry.topic === 'histamine')
    expect(histamine.gaps).toContain('no meta-analysis')
    expect(histamine.gaps.some((gap) => /RCT/.test(gap))).toBe(true)
    expect(gaps[0].trials).toBeLessThanOrEqual(gaps.at(-1).trials)
  })
})

describe('dumbbell and timeline data', () => {
  it('has one row per conversation claim, from least to best supported', () => {
    const rows = dumbbellRows(model.claims)
    expect(rows).toHaveLength(model.claims.filter((claim) => claim.source === 'conversation').length)
    expect(rows.map((row) => row.index)).toEqual([...rows.map((row) => row.index)].sort((a, b) => a - b))
    expect(rows.some((row) => row.noSource)).toBe(true)
  })

  it('makes timeline items and only the lanes that occur', () => {
    const items = timelineItems(model.articles, { topic: 'histamine' }, (id) => `#/kb/article/${id}`)
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((item) => item.href.startsWith('#/kb/article/'))).toBe(true)
    const groups = timelineGroups(items)
    expect(groups.map((group) => group.id).every((id) => DESIGN_IDS.includes(id))).toBe(true)
    expect(new Set(items.map((item) => item.group))).toEqual(new Set(groups.map((group) => group.id)))
    const [from, to] = yearExtent(model.articles)
    expect(timelineItems(model.articles, { yearFrom: to, yearTo: to }).every((item) => item.year === to)).toBe(true)
    expect(from).toBeLessThan(to)
  })
})

describe('why this verdict', () => {
  it('always yields three to five chips with a known tone, for every claim', () => {
    for (const claim of model.claims) {
      const chips = whyChips(claim)
      expect(chips.length, claim.id).toBeGreaterThanOrEqual(3)
      expect(chips.length, claim.id).toBeLessThanOrEqual(5)
      for (const chip of chips) {
        expect(['success', 'info', 'warning', 'danger', 'muted'], claim.id).toContain(chip.tone)
        expect(chip.label.length).toBeGreaterThan(3)
      }
    }
  })

  it('says so when there is no source and when contradiction outweighs support', () => {
    const unsourced = model.claims.find((claim) => claim.nFor + claim.nAgainst === 0)
    expect(whyChips(unsourced).map((chip) => chip.label)).toEqual(expect.arrayContaining(['No source recorded', 'No human data']))
    const gastrin = model.claimById.get('claim:free-glycine-stimulates-gastrin')
    expect(whyChips(gastrin).some((chip) => /outweighing the support/.test(chip.label))).toBe(true)
  })
})

describe('verdict bar', () => {
  it('draws a bar as long as the evidence and split by direction', () => {
    const claims = model.claims
    const max = Math.max(...claims.map((claim) => claim.evidenceFor + claim.evidenceAgainst))
    const gastrin = model.claimById.get('claim:free-glycine-stimulates-gastrin')
    const bar = verdictBar(gastrin, max)
    expect(bar.forShare).toBe(0)
    expect(bar.againstShare).toBe(1)
    expect(bar.length).toBeGreaterThan(0)
    expect(bar.length).toBeLessThanOrEqual(1)
    const none = verdictBar(claims.find((claim) => claim.nFor + claim.nAgainst === 0), max)
    expect(none).toMatchObject({ length: 0, forShare: 0, againstShare: 0 })
    for (const claim of claims) {
      const shares = verdictBar(claim, max)
      expect(shares.forShare + shares.againstShare).toBeCloseTo(claim.nFor + claim.nAgainst ? 1 : 0)
      expect(verdictBarText(claim).length).toBeGreaterThan(10)
    }
  })

  it('writes signed numbers with a real minus', () => {
    expect(signed(0.456)).toBe('+0.46')
    expect(signed(-0.2)).toBe('−0.20')
    expect(signed(0)).toBe('0.00')
  })
})

describe('claim table filters and sorting', () => {
  it('filters by status, topic, source, grade and words, all at once', () => {
    expect(filterClaims(model.claims, { status: 'contested' })).toHaveLength(7)
    expect(filterClaims(model.claims, { status: 'unsupported', topic: 'gastric' }).every((claim) => claim.status === 'unsupported' && claim.topic === 'gastric')).toBe(true)
    expect(filterClaims(model.claims, { source: 'literature' })).toHaveLength(3)
    const found = filterClaims(model.claims, { q: 'free glycine gastrin' })
    expect(found.map((claim) => claim.id)).toContain('claim:free-glycine-stimulates-gastrin')
    expect(filterClaims(model.claims, { q: 'zzzzzz' })).toEqual([])
    expect(filterClaims(model.claims, {})).toHaveLength(65)
  })

  it('sorts without losing or duplicating claims', () => {
    for (const sort of ['topic', 'status', 'index', 'for', 'against', 'design', 'name']) {
      const sorted = sortClaims(model.claims, sort)
      expect(new Set(sorted.map((claim) => claim.id)).size, sort).toBe(65)
    }
    expect(sortClaims(model.claims, 'index')[0].index).toBe(Math.max(...model.claims.map((claim) => claim.index)))
    expect(sortClaims(model.claims, 'status')[0].status).toBe('supported')
    expect(sortClaims(model.claims, 'for')[0].nFor).toBe(Math.max(...model.claims.map((claim) => claim.nFor)))
  })

  it('reads only known values from a hostile query and writes short URLs', () => {
    expect(readClaimFilters({ status: 'nope', topic: '<x>', sort: 'DROP', q: 'a'.repeat(500) })).toEqual({ q: 'a'.repeat(200), status: '', topic: '', source: '', grade: '', sort: 'topic' })
    expect(readClaimFilters({ status: 'contested', topic: 'gastric', sort: 'index' })).toMatchObject({ status: 'contested', topic: 'gastric', sort: 'index' })
    expect(writeClaimFilters({ q: '', status: 'contested', topic: '', source: '', grade: '', sort: 'topic' })).toEqual({ status: 'contested' })
  })
})

describe('literature filters and sorting', () => {
  const extent = yearExtent(model.articles)

  it('filters by words, topic, design, grade, years and informed entity', () => {
    expect(filterArticles(model.articles, {})).toHaveLength(model.articles.length)
    expect(filterArticles(model.articles, { design: 'RCT' }).every((article) => article.design === 'RCT')).toBe(true)
    const recent = filterArticles(model.articles, { yearFrom: 2020 })
    expect(recent.length).toBeGreaterThan(0)
    expect(recent.every((article) => article.year >= 2020)).toBe(true)
    const glycine = filterArticles(model.articles, { entity: 'compound:glycine' })
    expect(glycine.length).toBeGreaterThan(5)
    expect(glycine.every((article) => article.informs.some((item) => item.id === 'compound:glycine'))).toBe(true)
    const byName = filterArticles(model.articles, { entity: 'glycine' })
    expect(byName.length).toBeGreaterThanOrEqual(glycine.length)
    expect(filterArticles(model.articles, { q: 'lamers' }).length).toBeGreaterThan(0)
    expect(filterArticles(model.articles, { topic: 'gastric', design: 'RCT', grade: 'established' }).every((article) => article.topic === 'gastric')).toBe(true)
  })

  it('sorts by year, design, entries informed and grade', () => {
    const newest = sortArticles(model.articles, 'newest')
    expect(newest[0].year).toBe(extent[1])
    expect(sortArticles(model.articles, 'oldest')[0].year).toBe(extent[0])
    expect(sortArticles(model.articles, 'informs')[0].nInforms).toBe(Math.max(...model.articles.map((article) => article.nInforms)))
    expect(sortArticles(model.articles, 'design')[0].design).toBe('meta-analysis')
    expect(sortArticles(model.articles, 'grade')[0].grade).toBe('established')
  })

  it('clamps the year query to the data and keeps URLs short', () => {
    const filters = readArticleFilters({ from: '1900', to: '3000', design: 'RCT', sort: 'nope' }, extent)
    expect(filters).toMatchObject({ yearFrom: extent[0], yearTo: extent[1], design: 'RCT', sort: 'newest' })
    expect(writeArticleFilters(filters, extent)).toEqual({ design: 'RCT' })
    expect(writeArticleFilters({ ...filters, yearFrom: 2000, yearTo: 2010, sort: 'design' }, extent)).toEqual({ design: 'RCT', from: '2000', to: '2010', sort: 'design' })
  })
})

describe('article page data', () => {
  const article = model.articles.find((entry) => entry.nInforms > 3)

  it('finds related articles that share an informed entity, never the article itself', () => {
    const related = relatedArticles(model, article.id)
    expect(related.length).toBeGreaterThan(0)
    expect(related.every((entry) => entry.article.id !== article.id && entry.shared > 0)).toBe(true)
    expect(related.map((entry) => entry.shared)).toEqual([...related.map((entry) => entry.shared)].sort((a, b) => b - a))
    expect(relatedArticles(model, 'article:nope')).toEqual([])
  })

  it('groups what an article informs by type, claims first', () => {
    const groups = informsByType(article)
    expect(groups.reduce((total, group) => total + group.items.length, 0)).toBe(article.nInforms)
    const withClaim = model.articles.find((entry) => entry.claimIds.length && entry.nInforms > entry.claimIds.length)
    expect(informsByType(withClaim)[0].type).toBe('claim')
  })

  it('shortens author lists', () => {
    expect(shortAuthors(['Mudd SH'])).toBe('Mudd')
    expect(shortAuthors(['Mudd SH', 'Poole JR'])).toBe('Mudd & Poole')
    expect(shortAuthors(['Mudd SH', 'Poole JR', 'Stead LM'])).toBe('Mudd et al.')
    expect(shortAuthors(['EFSA Panel on Dietetic Products'])).toBe('EFSA Panel on Dietetic Products')
    expect(shortAuthors([])).toBe('Anonymous')
  })
})
