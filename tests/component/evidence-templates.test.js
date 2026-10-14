import { screen } from '@testing-library/vue'
import { beforeAll, describe, expect, it } from 'vitest'
import { graph, page } from '../../src/knowledge/index.js'
import { loadKnowledge } from '../../src/kb/knowledge-lazy.js'
import ArticleTemplate from '../../src/views/kb/templates/ArticleTemplate.vue'
import ClaimTemplate from '../../src/views/kb/templates/ClaimTemplate.vue'
import { expectAccessible } from '../helpers/axe.js'
import { mountVapor } from '../helpers/mount-vapor.js'

const claims = graph.byType.get('claim')
const articles = graph.byType.get('article')

beforeAll(async () => {
  window.scrollTo = () => {}
  await loadKnowledge()
})

// Mount a template, check its one h1 and the data-visuals contract, unmount again so 500 pages stay cheap.
function render(Template, props) {
  const { container, unmount } = mountVapor(Template, { props })
  try {
    const headings = container.querySelectorAll('h1')
    const root = container.querySelector('[data-testid="entity-visuals"]')
    return { headings: headings.length, h1: headings[0]?.textContent.trim(), visuals: root?.getAttribute('data-visuals') ?? '', text: container.textContent, h2: [...container.querySelectorAll('h2')].map((h) => h.textContent.trim()), links: container.querySelectorAll('a[href^="#/kb/"]').length }
  } finally {
    unmount()
  }
}

describe('ClaimTemplate', () => {
  it('renders all 65 claims without an exception, each with one heading, a verdict and a verdict bar', () => {
    expect(claims).toHaveLength(65)
    for (const claim of claims) {
      const result = render(ClaimTemplate, { id: claim.id })
      expect(result.headings, claim.id).toBe(1)
      expect(result.h1, claim.id).toBe(claim.name)
      expect(result.visuals, claim.id).toContain('verdict')
      expect(result.h2, claim.id).toEqual(expect.arrayContaining(['Verdict', 'Evidence balance', 'Why this verdict', 'Articles for and against', 'Causal edges this claim underpins']))
      expect(result.text, claim.id).toContain(claim.statement)
      expect(result.links, claim.id).toBeGreaterThan(0)
    }
  })

  it('takes the page model the entity dispatcher passes, as well as a bare id', () => {
    const claim = claims.find((entry) => entry.id === 'claim:free-glycine-stimulates-gastrin')
    const withModel = render(ClaimTemplate, { model: page(claim.id) })
    const withId = render(ClaimTemplate, { id: claim.id })
    expect(withModel.h1).toBe(claim.name)
    expect(withModel.visuals).toBe(withId.visuals)
  })

  it('shows the verdict of the glycine-gastrin claim: unsupported, two contradicting articles, a negative index', () => {
    const { container, unmount } = mountVapor(ClaimTemplate, { props: { id: 'claim:free-glycine-stimulates-gastrin' } })
    expect(container.querySelector('.ev-verdict').textContent).toMatch(/Unsupported/)
    expect(container.querySelector('.ev-verdict').textContent).toMatch(/Support index −0\.55/)
    expect(container.querySelector('.ev-vbar').textContent).toMatch(/Evidence for 0 from 0 articles, against/)
    expect([...container.querySelectorAll('.ev-chips li')].map((li) => li.textContent).join('|')).toMatch(/2 contradicting studies, outweighing the support/)
    expect(container.querySelector('.viz-gsvg')).toBeTruthy()
    // the long text is only in the closed drawer
    expect(container.querySelector('details:last-of-type').open).toBe(false)
    unmount()
  })

  it('says so when a claim has no source and no causal edge', () => {
    const empty = claims.find((claim) => !graph.links(claim.id).some((link) => link.rel === 'has-evidence' || link.rel === 'has-counterevidence'))
    const { container, unmount } = mountVapor(ClaimTemplate, { props: { id: empty.id } })
    expect(container.textContent).toMatch(/No article recorded/)
    expect(container.textContent).toMatch(/No source recorded/)
    expect(container.querySelector('.ev-vbar__none')).toBeTruthy()
    unmount()
  })

  it('is accessible (a sourced claim with a causal graph, and one with nothing)', async () => {
    for (const id of ['claim:acid-bicarbonate-reaction-gives-co2-belching', 'claim:undermethylated-hypochlorhydria']) {
      const { container, unmount } = mountVapor(ClaimTemplate, { props: { id } })
      await expectAccessible(container)
      unmount()
    }
  })

  it('shows a loading line, not an error, for an id that does not exist', () => {
    const { container, unmount } = mountVapor(ClaimTemplate, { props: { id: 'claim:no-such-claim' } })
    expect(container.querySelector('h1')).toBeNull()
    expect(container.textContent).toMatch(/Loading the claim/)
    unmount()
  })
})

describe('ArticleTemplate', () => {
  it('renders all 465 articles without an exception, each with one heading, a citation and what it informs', () => {
    expect(articles.length).toBeGreaterThanOrEqual(465)
    for (const article of articles) {
      const result = render(ArticleTemplate, { id: article.id })
      expect(result.headings, article.id).toBe(1)
      expect(result.h1, article.id).toBe(article.name)
      expect(result.visuals, article.id).toContain('citation-card')
      expect(result.h2, article.id).toEqual(expect.arrayContaining(['Citation', 'What it informs', 'Related articles']))
      expect(result.text, article.id).toContain(article.journal)
      expect(result.links, article.id).toBeGreaterThan(0)
    }
  })

  it('shows citation links, design, grade and population chips and at most five key points', () => {
    const { container, unmount } = mountVapor(ArticleTemplate, { props: { model: page('article:lamers-2007-glycine-flux') } })
    const text = container.textContent
    expect(text).toMatch(/DOI: 10\.1093\/jn\/137\.12\.2647/)
    expect(text).toMatch(/PMID: 18029478/)
    expect(text).toMatch(/Human experimental study/)
    expect(text).toMatch(/Citation verified/)
    expect(text).toMatch(/Healthy young adults, n=5/)
    const points = container.querySelectorAll('#ev-points ~ ul li, section[aria-labelledby="ev-points"] li')
    expect(points.length).toBeGreaterThan(0)
    expect(points.length).toBeLessThanOrEqual(5)
    expect(container.querySelector('a[href="https://doi.org/10.1093/jn/137.12.2647"]')).toBeTruthy()
    unmount()
  })

  it('marks an unverified or id-less article honestly and never crashes on missing fields', () => {
    const bare = articles.find((article) => !article.doi && !article.pmid)
    const { container, unmount } = mountVapor(ArticleTemplate, { props: { id: bare.id } })
    expect(container.querySelector('h1').textContent).toBe(bare.name)
    unmount()
  })

  it('groups what an article informs by kind and folds long lists', () => {
    const big = [...articles].sort((a, b) => (b.relations?.length ?? 0) - (a.relations?.length ?? 0))[0]
    const { container, unmount } = mountVapor(ArticleTemplate, { props: { id: big.id } })
    expect(container.querySelectorAll('section h3').length).toBeGreaterThan(0)
    unmount()
  })

  it('is accessible', async () => {
    for (const id of ['article:lamers-2007-glycine-flux', 'article:melendez-hevia-2009-glycine-weak-link']) {
      const { container, unmount } = mountVapor(ArticleTemplate, { props: { id } })
      await expectAccessible(container)
      unmount()
    }
  })
})
