import { fireEvent, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../../src/App.vue'
import { graph, page } from '../../src/knowledge/index.js'
import { TYPE_IDS } from '../../src/knowledge/types.js'
import { START_HERE } from '../../src/kb/start-here.js'
import { navigate } from '../../src/router.js'
import { mountVapor } from '../helpers/mount-vapor.js'

beforeEach(() => {
  window.scrollTo = () => {}
})

async function open(path) {
  navigate(path)
  const view = mountVapor(App)
  await screen.findByRole('heading', { level: 1 })
  return view
}

const main = () => screen.getByRole('main')
const h1 = () => screen.getByRole('heading', { level: 1 })
const headings = (level) => within(main()).getAllByRole('heading', { level }).map((heading) => heading.textContent.trim())
const links = () => within(main()).getAllByRole('link')

describe('home', () => {
  it('explains the topic, warns it is not medical advice and offers the start-here path', async () => {
    await open('/')
    await screen.findByRole('heading', { name: 'Browse by kind' })
    expect(h1().textContent).toMatch(/Methylation biochemistry/)
    expect(within(main()).getByRole('note').textContent).toMatch(/not medical advice/i)
    expect(headings(2)).toEqual(expect.arrayContaining(['Start here', 'What is methylation?', 'Browse by kind', 'Claims audit', 'How sure are we?', 'Workbenches']))
    const start = within(screen.getByRole('heading', { name: 'Start here' }).closest('section')).getAllByRole('link')
    expect(start.map((link) => link.textContent)).toEqual(START_HERE.map((step) => step.name))
    expect(start.every((link) => link.getAttribute('href').startsWith('#/kb'))).toBe(true)
    expect(screen.getByRole('searchbox')).toBeTruthy()
    expect(within(main()).getByRole('link', { name: 'About the workbenches' }).getAttribute('href')).toBe('#/workbench')
  })

  it('shows an entry point with a count for every entity type once the data has loaded', async () => {
    await open('/')
    const cards = await screen.findByRole('link', { name: /Compounds/ })
    expect(cards.getAttribute('href')).toBe('#/kb/compound')
    const section = screen.getByRole('heading', { name: 'Browse by kind' }).closest('section')
    for (const type of TYPE_IDS) {
      const link = section.querySelector(`a[href="#/kb/${type}"]`)
      expect(link, type).toBeTruthy()
      expect(link.textContent).toMatch(/\d+ entr(y|ies)/)
    }
    expect(screen.getByRole('link', { name: 'Open the claims audit' }).getAttribute('href')).toBe('#/kb/claim')
  })

  it('gets from the search box to GNMT in two interactions', async () => {
    await open('/')
    await fireEvent.update(screen.getByRole('searchbox'), 'GNMT')
    // Several articles are titled "Glycine N-methyltransferase ..."; the enzyme itself must be the best match.
    const enzyme = await within(main()).findByRole('link', { name: 'Glycine N-methyltransferase (GNMT)' })
    expect(enzyme.closest('ul').querySelector('a')).toBe(enzyme)
    await fireEvent.click(enzyme)
    expect(await screen.findByRole('heading', { level: 1, name: /Glycine N-methyltransferase/ })).toBeTruthy()
  })
})

describe('/kb hub', () => {
  it('lists all 11 types with descriptions and counts, search and the claims audit', async () => {
    await open('/kb')
    expect(h1().textContent).toBe('Knowledge base')
    const kinds = screen.getByRole('heading', { level: 2, name: 'Browse by kind' }).closest('section')
    expect(within(kinds).getAllByRole('heading', { level: 3 })).toHaveLength(TYPE_IDS.length)
    expect(within(main()).getByText('Statements to be checked against the literature.')).toBeTruthy()
    expect(screen.getByRole('searchbox')).toBeTruthy()
    expect(within(main()).getByRole('link', { name: /\d+ unsupported/ }).getAttribute('href')).toBe('#/kb/claim?status=unsupported')
    expect(within(main()).getByRole('link', { name: /map/i }).getAttribute('href')).toBe('#/kb/map')
  })
})

describe('/kb/:type listing', () => {
  it('lists every entry of the type, grouped, with a count', async () => {
    await open('/kb/compound')
    expect(h1().textContent).toBe('Compounds')
    expect(within(main()).getByRole('status').textContent).toBe(`Showing ${graph.byType.get('compound').length} of ${graph.byType.get('compound').length} compounds`)
    expect(headings(2)[0]).toMatch(/^A \(\d+\)$/)
  })

  it('filters by text, and says when nothing matches', async () => {
    await open('/kb/compound')
    await fireEvent.update(screen.getByLabelText('Filter by name or text'), 'betaine')
    await waitFor(() => expect(within(main()).getByRole('status').textContent).toMatch(/^Showing \d+ of/))
    const shown = Number(within(main()).getByRole('status').textContent.match(/Showing (\d+)/)[1])
    expect(shown).toBeGreaterThan(0)
    expect(shown).toBeLessThan(graph.byType.get('compound').length)
    expect(screen.getByRole('link', { name: /Betaine \(trimethylglycine/ })).toBeTruthy()

    await fireEvent.update(screen.getByLabelText('Filter by name or text'), 'zzzzqqq')
    expect(await screen.findByText('No entries match these filters.')).toBeTruthy()
    await fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    await waitFor(() => expect(screen.queryByText('No entries match these filters.')).toBeNull())
  })

  it('filters by evidence grade and keeps the filter in the address', async () => {
    await open('/kb/compound')
    const established = graph.byType.get('compound').filter((entity) => entity.evidence === 'established').length
    await fireEvent.update(screen.getByLabelText('Evidence grade'), 'established')
    await waitFor(() => expect(within(main()).getByRole('status').textContent).toContain(`Showing ${established} of`))
    expect(window.location.hash).toBe('#/kb/compound?grade=established')
    expect(within(main()).queryAllByText('Evidence: Plausible')).toHaveLength(0)
  })

  it('applies filters from the address, and sorts by evidence into grade groups', async () => {
    await open('/kb/compound?grade=plausible&sort=evidence')
    expect(screen.getByLabelText('Evidence grade').value).toBe('plausible')
    expect(headings(2)).toEqual([expect.stringMatching(/^Plausible \(\d+\)$/)])
  })

  it('shows claim status badges, groups claims by status and filters on status', async () => {
    await open('/kb/claim')
    expect(headings(2)).toEqual(expect.arrayContaining([expect.stringMatching(/^Supported \(\d+\)$/), expect.stringMatching(/^Unsupported \(\d+\)$/)]))
    expect(within(main()).getAllByText('Claim: Unsupported').length).toBeGreaterThan(1)
    await fireEvent.update(screen.getByLabelText('Claim status'), 'contested')
    await waitFor(() => expect(headings(2)).toEqual([expect.stringMatching(/^Contested \(\d+\)$/)]))
    expect(window.location.hash).toBe('#/kb/claim?status=contested')
  })

  it('opens the claims audit already filtered from a link such as the one on the hub', async () => {
    await open('/kb/claim?status=unsupported')
    expect(screen.getByLabelText('Claim status').value).toBe('unsupported')
    expect(headings(2)).toEqual([expect.stringMatching(/^Unsupported \(\d+\)$/)])
  })

  it('shows the equation of each reaction', async () => {
    await open('/kb/reaction')
    expect(within(main()).getAllByText(/→|⇌/).length).toBeGreaterThan(10)
    expect(headings(2).every((text) => /\(\d+\)$/.test(text))).toBe(true)
  })

  it('says so when a type has no entries yet', async () => {
    await open('/kb/article')
    if (graph.byType.get('article').length === 0) expect(screen.getByText(/no articles in the knowledge base yet/)).toBeTruthy()
  })

  it('accepts the plural type name and reports an unknown type with a way out', async () => {
    await open('/kb/enzymes')
    expect(h1().textContent).toBe('Enzymes')
    navigate('/kb/not-a-type')
    expect(await screen.findByRole('heading', { level: 1, name: 'We have no entries of that kind' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Browse the knowledge base' })).toBeTruthy()
  })
})

describe('/kb/:type/:slug entity page', () => {
  const firstOf = (type) => graph.byType.get(type)[0].id
  const idsToCheck = [
    'compound:glycine', 'enzyme:gnmt', 'reaction:gnmt-glycine-methylation', 'pathway:methyl-budget',
    'state:undermethylation', 'outcome:belching', 'claim:belching-mostly-swallowed-air',
    firstOf('disease'), firstOf('system'), firstOf('intervention')
  ]

  it.each(idsToCheck)('renders %s with name, type, evidence, summary, breadcrumbs and a title', async (id) => {
    const model = page(id)
    const [, slug] = id.split(':')
    await open(`/kb/${model.type}/${slug}`)

    expect(h1().textContent).toBe(model.name)
    expect(document.title).toBe(`${model.name} · Biochemical Inference`)
    expect(within(main()).getAllByText(model.typeLabel).length).toBeGreaterThan(0)
    expect(within(main()).getByText(`Evidence: ${model.evidence.label}`)).toBeTruthy()
    expect(within(main()).getByText(model.evidence.description)).toBeTruthy()
    expect(within(main()).getByText(model.summary)).toBeTruthy()
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(crumbs).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(['#/', '#/kb', `#/kb/${model.type}`])
    expect(headings(1)).toHaveLength(1)
    expect(links().length).toBeGreaterThan(3)
  })

  it('shows aliases, facts with external links, connections and the path control for an enzyme', async () => {
    await open('/kb/enzyme/gnmt')
    expect(within(main()).getByText(/Also known as:/).parentElement.textContent).toMatch(/GNMT/)
    expect(within(main()).getByRole('link', { name: /2\.1\.1\.20/ }).getAttribute('href')).toContain('expasy.org')
    expect(headings(2)).toEqual(expect.arrayContaining(['Details', 'Facts and identifiers', 'Connections', 'See also']))
    expect(headings(2).some((text) => text.startsWith('How is'))).toBe(true)
    expect(headings(3).length).toBeGreaterThan(2)
  })

  it('resolves body mentions to router links to existing entities', async () => {
    await open('/kb/state/undermethylation')
    const body = screen.getByRole('heading', { name: 'Details' }).closest('section')
    const bodyLinks = within(body).getAllByRole('link')
    expect(bodyLinks.length).toBeGreaterThan(3)
    for (const link of bodyLinks) {
      const [type, slug] = link.getAttribute('href').split('/').slice(2)
      expect(graph.has(`${type}:${slug}`), link.getAttribute('href')).toBe(true)
    }
  })

  it('shows the reaction block with equation, enzymes and identifiers, without repeating them in the facts', async () => {
    await open('/kb/reaction/gnmt-glycine-methylation')
    const block = screen.getByRole('heading', { name: 'Reaction' }).closest('section')
    expect(within(block).getByRole('link', { name: 'Glycine' }).getAttribute('href')).toBe('#/kb/compound/glycine')
    expect(within(block).getByText('Catalysed by')).toBeTruthy()
    expect(within(block).getAllByRole('link', { name: /2\.1\.1\.20/ })).toHaveLength(1)
    expect(within(main()).getAllByRole('link', { name: /2\.1\.1\.20/ })).toHaveLength(1)
  })

  it('shows the claim block with status, evidence sections and the missing-source warning', async () => {
    await open('/kb/claim/glycine-gnmt-depletes-sam-in-undermethylated')
    const model = page('claim:glycine-gnmt-depletes-sam-in-undermethylated')
    expect(within(main()).getByText(model.claim.statement)).toBeTruthy()
    expect(within(main()).getAllByText(`Claim: ${model.claim.status.label}`).length).toBeGreaterThan(0)
    expect(headings(2)).toEqual(expect.arrayContaining(['The claim', 'Evidence for this claim', 'Evidence against this claim']))
    if (model.references.length === 0) expect(within(main()).getByText(/No supporting source is recorded yet/)).toBeTruthy()
  })

  it('offers a labelled path to another entity, deep-linkable through ?to=', async () => {
    await open('/kb/compound/glycine?to=outcome%3Abelching')
    const section = screen.getByRole('heading', { level: 2, name: /How is Glycine connected/ }).closest('details')
    expect(section.open).toBe(true)
    const steps = within(section).getAllByRole('listitem')
    expect(steps.length).toBeGreaterThan(0)
    expect(within(steps[0]).getByText(/Increased by|Causes|Aggravates|Substrate of|Product of|Precursor of|Associated with|Mentions|Mentioned by|Interacts with|Part of|Has /)).toBeTruthy()
    expect(within(steps[steps.length - 1]).getAllByRole('link').pop().getAttribute('href')).toBe('#/kb/outcome/belching')
  })

  it('lets the reader choose the target in the page', async () => {
    await open('/kb/state/undermethylation')
    await fireEvent.click(screen.getByText(/How is Under-methylation connected/))
    await fireEvent.update(screen.getByLabelText('Connect to'), 'over-methylation')
    await fireEvent.click(await screen.findByRole('button', { name: /^Over-methylation/ }))
    expect(await screen.findByRole('heading', { level: 3, name: 'Under-methylation to Over-methylation' })).toBeTruthy()
  })

  it('reuses the view when only the entity changes, updating heading and title', async () => {
    await open('/kb/compound/glycine')
    navigate('/kb/compound/betaine')
    await waitFor(() => expect(h1().textContent).toBe(page('compound:betaine').name))
    expect(document.title).toContain(page('compound:betaine').name)
  })

  it('shows a helpful 404 with a search seeded from the address for an unknown entity', async () => {
    await open('/kb/compound/glycin')
    expect(h1().textContent).toBe('We could not find that entry')
    expect(document.title).toBe('Page not found · Biochemical Inference')
    expect(screen.getByRole('searchbox').value).toBe('glycin')
    expect(await screen.findByRole('link', { name: 'Glycine' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Browse the knowledge base' })).toBeTruthy()
  })

  it('treats an unknown type in an entity address the same way', async () => {
    await open('/kb/nonsense/glycine')
    expect(h1().textContent).toBe('We could not find that entry')
  })
})

describe('/kb/map', () => {
  it('invites a choice when no entry is chosen', async () => {
    await open('/kb/map')
    expect(h1().textContent).toBe('Knowledge map')
    expect(headings(2)).toEqual(['Try one of these'])
    expect(within(main()).getByRole('link', { name: 'Glycine' }).getAttribute('href')).toBe('#/kb/map?id=compound%3Aglycine')
  })

  it('shows the neighbourhood by relationship, a picture of nodes that are links, and the path control', async () => {
    await open('/kb/map?id=compound%3Aglycine')
    expect(document.title).toBe('Map of Glycine · Biochemical Inference')
    expect(headings(2)).toEqual(expect.arrayContaining(['Around Glycine', 'Neighbours by relationship']))
    expect(headings(3)).toEqual(expect.arrayContaining([expect.stringMatching(/^Substrate of \(\d+\)$/), expect.stringMatching(/^Mentions \(\d+\)$/)]))
    const nodes = [...main().querySelectorAll('svg a')]
    expect(nodes.length).toBe(15)
    expect(nodes.every((node) => node.getAttribute('href').startsWith('#/kb/'))).toBe(true)
    expect(within(main()).getByRole('link', { name: 'Open the Glycine page' }).getAttribute('href')).toBe('#/kb/compound/glycine')
    expect(headings(2).some((text) => text.startsWith('How is'))).toBe(true)
  })

  it('maps another entry when one is picked', async () => {
    await open('/kb/map?id=enzyme%3Agnmt')
    await fireEvent.update(screen.getByLabelText('Entry to map'), 'betaine')
    await fireEvent.click((await screen.findAllByRole('button', { name: /^Betaine \(trimethylglycine/ }))[0])
    await waitFor(() => expect(window.location.hash).toBe('#/kb/map?id=compound%3Abetaine'))
    expect(await screen.findByRole('heading', { level: 2, name: /Around Betaine/ })).toBeTruthy()
  })

  it('reports an unknown id without breaking', async () => {
    await open('/kb/map?id=compound%3Anope')
    expect(screen.getByText(/No entry matches/)).toBeTruthy()
    expect(headings(2)).toEqual(['Try one of these'])
  })
})
