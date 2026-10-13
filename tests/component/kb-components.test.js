import { fireEvent, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import ArticleBlock from '../../src/components/kb/ArticleBlock.vue'
import Badge from '../../src/ui/Badge.vue'
import BodyText from '../../src/components/kb/BodyText.vue'
import Breadcrumbs from '../../src/components/kb/Breadcrumbs.vue'
import ClaimBlock from '../../src/components/kb/ClaimBlock.vue'
import ClaimStatusBadge from '../../src/components/kb/ClaimStatusBadge.vue'
import EntityItem from '../../src/components/kb/EntityItem.vue'
import EntityLink from '../../src/components/kb/EntityLink.vue'
import EntityNotFound from '../../src/components/kb/EntityNotFound.vue'
import EvidenceBadge from '../../src/components/kb/EvidenceBadge.vue'
import FactsTable from '../../src/components/kb/FactsTable.vue'
import GroupedList from '../../src/components/kb/GroupedList.vue'
import ItemList from '../../src/components/kb/ItemList.vue'
import PathFinder from '../../src/components/kb/PathFinder.vue'
import PathSteps from '../../src/components/kb/PathSteps.vue'
import RadialGraph from '../../src/components/kb/RadialGraph.vue'
import ReactionEquation from '../../src/components/kb/ReactionEquation.vue'
import ReferenceList from '../../src/components/kb/ReferenceList.vue'
import RelationGroups from '../../src/components/kb/RelationGroups.vue'
import SearchBox from '../../src/components/kb/SearchBox.vue'
import TypeBadge from '../../src/components/kb/TypeBadge.vue'
import TypeCards from '../../src/components/kb/TypeCards.vue'
import VerifiedBadge from '../../src/components/kb/VerifiedBadge.vue'
import { buildGraph } from '../../src/knowledge/graph.js'
import { getEntity, home, page, pathBetween } from '../../src/knowledge/index.js'
import { pageModel } from '../../src/knowledge/page-model.js'
import { navigate } from '../../src/router.js'
import { mountVapor } from '../helpers/mount-vapor.js'
import PickHost from '../fixtures/vapor/PickHost.vue'
import { valid } from '../fixtures/knowledge/helpers.js'

const fixtureGraph = buildGraph(valid)
const mount = (component, props) => mountVapor(component, { props })

beforeEach(() => navigate('/'))

describe('badges', () => {
  it('renders a label with a tone class, none for muted', () => {
    const { container } = mount(Badge, { label: 'Hello', tone: 'success' })
    expect(container.querySelector('.badge.badge--success').textContent).toBe('Hello')
    mount(Badge, { label: 'Plain' })
    expect(screen.getByText('Plain').className).toBe('badge')
  })

  it('shows the entity type label', () => {
    mount(TypeBadge, { type: 'enzyme' })
    expect(screen.getByText('Enzyme')).toBeTruthy()
  })

  it('shows an evidence grade, with its plain-language meaning on request', () => {
    mount(EvidenceBadge, { grade: 'plausible' })
    expect(screen.getByText('Evidence: Plausible').classList.contains('badge--info')).toBe(true)
    expect(screen.queryByText(/Mechanistically reasonable/)).toBeNull()
    mount(EvidenceBadge, { grade: 'speculative', explain: true })
    expect(screen.getByText('Evidence: Speculative').classList.contains('badge--warning')).toBe(true)
    expect(screen.getByText(/little or no direct support/)).toBeTruthy()
  })

  it('shows claim status and citation verification', () => {
    mount(ClaimStatusBadge, { status: 'unsupported' })
    expect(screen.getByText('Claim: Unsupported').classList.contains('badge--danger')).toBe(true)
    mount(VerifiedBadge, { verified: true })
    mount(VerifiedBadge, { verified: false })
    expect(screen.getByText('Citation verified').classList.contains('badge--success')).toBe(true)
    expect(screen.getByText('Citation not verified').classList.contains('badge--warning')).toBe(true)
  })
})

describe('EntityLink', () => {
  it('links to the entity page, using the entity name by default', () => {
    mount(EntityLink, { id: 'enzyme:gnmt' })
    const link = screen.getByRole('link', { name: 'Glycine N-methyltransferase (GNMT)' })
    expect(link.getAttribute('href')).toBe('#/kb/enzyme/gnmt')
  })

  it('uses a custom label', () => {
    mount(EntityLink, { id: 'enzyme:gnmt', label: 'GNMT' })
    expect(screen.getByRole('link', { name: 'GNMT' })).toBeTruthy()
  })

  it('renders plain text, not a dead link, for a target that does not exist', () => {
    const { container } = mount(EntityLink, { id: 'compound:no-such-thing', label: 'Ghost' })
    expect(container.querySelector('a')).toBeNull()
    expect(container.textContent).toBe('Ghost')
  })
})

describe('EntityItem', () => {
  it('shows link, type, note and optional evidence and summary', () => {
    mount(EntityItem, { item: { id: 'enzyme:gnmt', type: 'enzyme', name: 'GNMT', evidence: 'established', summary: 'Buffers SAMe.', note: 'because' }, showEvidence: true, showSummary: true })
    expect(screen.getByRole('link', { name: 'GNMT' })).toBeTruthy()
    expect(screen.getByText('Enzyme')).toBeTruthy()
    expect(screen.getByText('Evidence: Established')).toBeTruthy()
    expect(screen.getByText('Buffers SAMe.')).toBeTruthy()
    expect(screen.getByText('because')).toBeTruthy()
  })

  it('shows the status of a claim even when the item does not carry it', () => {
    mount(EntityItem, { item: { id: 'claim:belching-mostly-swallowed-air', type: 'claim', name: 'Swallowed air' } })
    expect(screen.getByText('Claim: Supported')).toBeTruthy()
  })
})

describe('BodyText', () => {
  it('renders mentions as router links and everything else as text, never HTML', () => {
    const { container } = mount(BodyText, {
      paragraphs: [
        [{ text: 'Uses ' }, { link: { id: 'compound:glycine', label: 'glycine', type: 'compound' } }, { text: ' and <b>bold</b>.' }],
        [{ text: 'Second.' }]
      ]
    })
    expect(container.querySelectorAll('p')).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'glycine' }).getAttribute('href')).toBe('#/kb/compound/glycine')
    expect(container.querySelector('b')).toBeNull()
    expect(container.querySelector('p').textContent).toBe('Uses glycine and <b>bold</b>.')
  })

  it('caps the number of paragraphs', () => {
    const { container } = mount(BodyText, { paragraphs: Array.from({ length: 100 }, (_, index) => [{ text: `p${index}` }]) })
    expect(container.querySelectorAll('p')).toHaveLength(60)
  })

  it('renders the resolved body of a real entity with working links', () => {
    const model = page('state:undermethylation')
    const { container } = mount(BodyText, { paragraphs: model.body })
    const links = [...container.querySelectorAll('a')]
    expect(links.length).toBeGreaterThan(3)
    expect(links.every((link) => link.getAttribute('href').startsWith('#/kb/'))).toBe(true)
  })
})

describe('FactsTable', () => {
  it('renders a captioned table with header cells and external links', () => {
    mount(FactsTable, { facts: page('enzyme:gnmt').facts })
    const table = screen.getByRole('table', { name: 'Facts and identifiers' })
    expect(within(table).getAllByRole('rowheader').length).toBeGreaterThan(1)
    const link = within(table).getByRole('link', { name: /2\.1\.1\.20/ })
    expect(link.getAttribute('href')).toBe('https://enzyme.expasy.org/EC/2.1.1.20')
    expect(link.getAttribute('rel')).toContain('noopener')
  })

  it('renders no table for no facts', () => {
    const { container } = mount(FactsTable, { facts: [] })
    expect(container.querySelector('table')).toBeNull()
  })
})

describe('ReactionEquation', () => {
  it('shows reactants and products as links, the arrow, enzymes, direction and identifiers', () => {
    const { container } = mount(ReactionEquation, { reaction: page('reaction:gnmt-glycine-methylation').reaction })
    const equation = container.querySelector('.equation')
    expect(within(equation).getByRole('link', { name: 'Glycine' }).getAttribute('href')).toBe('#/kb/compound/glycine')
    expect(equation.textContent).toContain('→')
    expect(equation.textContent).toContain('is converted to')
    expect(screen.getByRole('link', { name: /Glycine N-methyltransferase/ }).getAttribute('href')).toBe('#/kb/enzyme/gnmt')
    expect(screen.getByText(/one-way/)).toBeTruthy()
    expect(screen.getByText('cytosol')).toBeTruthy()
    expect(screen.getByRole('link', { name: /2\.1\.1\.20/ })).toBeTruthy()
  })

  it('shows stoichiometry and a reversible arrow, and keeps unknown participants as text', () => {
    const { container } = mount(ReactionEquation, {
      reaction: {
        reactants: [{ id: 'compound:glycine', n: 2, name: 'Glycine' }, { id: 'compound:nope', n: 1, name: 'Nope' }],
        products: [{ id: 'compound:betaine', n: 3, name: 'Betaine' }],
        enzymes: [],
        reversible: true,
        compartment: null,
        identifiers: []
      }
    })
    const equation = container.querySelector('.equation')
    expect(equation.textContent).toContain('2 Glycine')
    expect(equation.textContent).toContain('3 Betaine')
    expect(equation.textContent).toContain('⇌')
    expect(within(equation).queryByRole('link', { name: 'Nope' })).toBeNull()
    expect(screen.getByText(/Reversible/)).toBeTruthy()
    expect(screen.queryByText('Catalysed by')).toBeNull()
  })
})

describe('article and claim blocks', () => {
  const articleModel = pageModel(fixtureGraph, 'article:fixture-gnmt-review')

  it('shows the citation, DOI and PMID links, takeaways and a verified badge', () => {
    mount(ArticleBlock, { article: articleModel.article })
    expect(screen.getByText('Ada Fixture et al. (2001). Journal of Fixtures.')).toBeTruthy()
    expect(screen.getByText('Citation verified')).toBeTruthy()
    expect(screen.getByRole('link', { name: /10\.0000\/fixture-1/ }).getAttribute('href')).toBe('https://doi.org/10.0000/fixture-1')
    expect(screen.getByRole('link', { name: /12345678/ }).getAttribute('href')).toBe('https://pubmed.ncbi.nlm.nih.gov/12345678/')
    expect(screen.getByText('GNMT buffers SAMe.')).toBeTruthy()
  })

  it('warns when the citation is not verified', () => {
    mount(ArticleBlock, { article: pageModel(fixtureGraph, 'article:fixture-unverified').article })
    expect(screen.getByText('Citation not verified')).toBeTruthy()
    expect(screen.getByText(/has not been checked yet/)).toBeTruthy()
  })

  it('shows a claim statement with its status and where it came from', () => {
    mount(ClaimBlock, { claim: pageModel(fixtureGraph, 'claim:glycine-depletes-sam').claim })
    expect(screen.getByText(/Taking large doses of glycine/)).toBeTruthy()
    expect(screen.getByText('Claim: Partly supported')).toBeTruthy()
    expect(screen.getByText('Raised in the source conversation.')).toBeTruthy()
  })

  it('lists references with stance, verified badge, citation and identifiers', () => {
    const references = pageModel(fixtureGraph, 'claim:glycine-depletes-sam').references
    mount(ReferenceList, { references })
    expect(screen.getByText('Supports')).toBeTruthy()
    expect(screen.getByText('Contradicts')).toBeTruthy()
    expect(screen.getByText('Citation not verified')).toBeTruthy()
    expect(screen.getByRole('link', { name: /DOI: 10\.0000\/fixture-1/ })).toBeTruthy()
  })
})

describe('Breadcrumbs', () => {
  it('shows Home > Knowledge base > type > current, the last not a link', () => {
    mount(Breadcrumbs, { crumbs: page('enzyme:gnmt').breadcrumbs })
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    const links = within(nav).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['#/', '#/kb', '#/kb/enzyme'])
    expect(within(nav).getAllByRole('listitem')).toHaveLength(4)
    expect(nav.querySelector('span[aria-current="page"]').textContent).toMatch(/Glycine N-methyltransferase/)
  })
})

describe('RelationGroups and ItemList', () => {
  it('shows labelled groups with counts, type badges and notes', () => {
    const groups = page('compound:glycine').relationGroups
    const substrate = groups.find((group) => group.label === 'Substrate of')
    expect(substrate.items.length).toBeGreaterThan(0)
    const { container } = mount(RelationGroups, { groups })
    const headings = [...container.querySelectorAll('h3')].map((heading) => heading.textContent.trim())
    expect(headings).toContain(`Substrate of (${substrate.items.length})`)
    expect(container.querySelectorAll('.badge').length).toBeGreaterThan(10)
  })

  it('keeps long lists short with a "show more" disclosure that still holds the links', () => {
    const items = Array.from({ length: 12 }, (_, index) => ({ id: 'compound:glycine', type: 'compound', name: `Item ${index}` }))
    const { container } = mount(ItemList, { items, limit: 5 })
    expect(container.querySelectorAll('li')).toHaveLength(12)
    expect(container.querySelectorAll('li')[4].closest('details')).toBeNull()
    expect(container.querySelectorAll('li')[5].closest('details')).toBeTruthy()
    expect(container.querySelector('summary').textContent).toBe('Show 7 more')
    expect(container.querySelectorAll('details li')).toHaveLength(7)
  })

  it('has no disclosure when everything fits', () => {
    const { container } = mount(ItemList, { items: [{ id: 'compound:glycine', type: 'compound', name: 'Glycine' }] })
    expect(container.querySelector('details')).toBeNull()
  })
})

describe('GroupedList, TypeCards, EntityNotFound', () => {
  it('renders headed groups and a headless one', () => {
    const item = { id: 'compound:glycine', type: 'compound', name: 'Glycine', evidence: 'established', summary: 'Smallest.' }
    const { container } = mount(GroupedList, { groups: [{ key: 'a', label: 'A', items: [item] }, { key: 'all', label: null, items: [item] }] })
    expect([...container.querySelectorAll('h2')].map((heading) => heading.textContent.trim())).toEqual(['A (1)'])
    expect(container.querySelectorAll('li')).toHaveLength(2)
    expect(screen.getAllByText('Evidence: Established')).toHaveLength(2)
  })

  it('renders a card per type with its count', () => {
    mount(TypeCards, { types: home().types })
    const link = screen.getByRole('link', { name: /Enzymes/ })
    expect(link.getAttribute('href')).toBe('#/kb/enzyme')
    expect(link.textContent).toMatch(/\d+ entries/)
    expect(screen.getAllByRole('link')).toHaveLength(11)
  })

  it('offers a search and the ways back from a 404', () => {
    mount(EntityNotFound, { what: 'glycin', query: 'glycin' })
    expect(screen.getByRole('heading', { level: 1, name: 'We could not find that entry' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Browse the knowledge base' })).toBeTruthy()
    expect(screen.getByRole('searchbox').value).toBe('glycin')
  })
})

describe('SearchBox', () => {
  const type = (text) => fireEvent.update(screen.getByRole('searchbox'), text)

  it('finds entries by abbreviation, case-insensitively, and links to them', async () => {
    mount(SearchBox)
    await type('gnmt')
    const results = await screen.findAllByRole('link')
    expect(results[0].getAttribute('href')).toBe('#/kb/enzyme/gnmt')
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/\d+ results?/))
  })

  it('matches Portuguese aliases without accents and says why', async () => {
    mount(SearchBox)
    await type('arroto')
    expect((await screen.findAllByText(/^Also known as Arroto/)).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /Belching/ }).getAttribute('href')).toBe('#/kb/outcome/belching')
  })

  it('says when nothing matches', async () => {
    mount(SearchBox)
    await type('zzzzqqq')
    expect(await screen.findByText(/No entries match/)).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe('No results')
  })

  it('opens the best match on Enter', async () => {
    mount(SearchBox)
    await type('gnmt')
    await screen.findAllByRole('link')
    await fireEvent.submit(screen.getByRole('search'))
    await waitFor(() => expect(window.location.hash).toBe('#/kb/enzyme/gnmt'))
  })

  it('moves between input and results with the arrow keys and back with Escape', async () => {
    mount(SearchBox)
    const input = screen.getByRole('searchbox')
    await type('glycine')
    const links = await screen.findAllByRole('link')
    await fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(links[0])
    await fireEvent.keyDown(links[0], { key: 'ArrowDown' })
    expect(document.activeElement).toBe(links[1])
    await fireEvent.keyDown(links[1], { key: 'ArrowUp' })
    expect(document.activeElement).toBe(links[0])
    await fireEvent.keyDown(links[0], { key: 'ArrowUp' })
    expect(document.activeElement).toBe(input)
    await fireEvent.keyDown(input, { key: 'ArrowDown' })
    await fireEvent.keyDown(document.activeElement, { key: 'Escape' })
    expect(document.activeElement).toBe(input)
  })

  it('in pick mode emits the chosen result to its parent instead of navigating', async () => {
    const { container } = mount(PickHost)
    expect(screen.queryByRole('search')).toBeNull()
    await type('betaine')
    const [button] = await screen.findAllByRole('button', { name: /^Betaine \(trimethylglycine/ })
    await fireEvent.click(button)
    await waitFor(() => expect(container.querySelector('.picked').textContent).toBe('compound:betaine'))
    expect(window.location.hash).toBe('#/')
  })

  it('leaves out the excluded entry', async () => {
    mount(SearchBox, { mode: 'pick', exclude: 'compound:betaine' })
    await type('betaine')
    const buttons = await screen.findAllByRole('button', { name: /etaine/ })
    expect(buttons.map((button) => button.textContent)).not.toContain(`${getEntity('compound:betaine').name} (Compound)`)
  })
})

describe('PathSteps and PathFinder', () => {
  it('shows each step as from, relationship, to', () => {
    const path = pathBetween('compound:glycine', 'outcome:belching', { avoidTypes: ['article'] })
    const { container } = mount(PathSteps, { path })
    const rows = container.querySelectorAll('li')
    expect(rows).toHaveLength(path.steps.length)
    expect(rows[0].querySelector('.badge').textContent).toBe(path.steps[0].label)
    expect(within(rows[0]).getAllByRole('link')).toHaveLength(2)
  })

  it('shows the labelled chain for the target in the address, open and announced', async () => {
    navigate('/kb/compound/glycine?to=outcome%3Abelching')
    const { container } = mount(PathFinder, { from: 'compound:glycine' })
    expect(container.querySelector('details').open).toBe(true)
    expect(screen.getByRole('heading', { level: 3, name: /^Glycine to Belching/ })).toBeTruthy()
    expect(container.querySelectorAll('ol li').length).toBeGreaterThan(0)
    expect(screen.getByText(/Connection found in \d+ steps?\./)).toBeTruthy()
  })

  it('is collapsed with no target, and writes the chosen target to the address', async () => {
    navigate('/kb/compound/glycine')
    const { container } = mount(PathFinder, { from: 'compound:glycine' })
    expect(container.querySelector('details').open).toBe(false)
    await fireEvent.update(screen.getByRole('searchbox'), 'belching')
    await fireEvent.click(await screen.findByRole('button', { name: /^Belching \(eructation\)/ }))
    await waitFor(() => expect(window.location.hash).toBe('#/kb/compound/glycine?to=outcome%3Abelching'))
    expect(await screen.findByRole('heading', { level: 3, name: /^Glycine to Belching/ })).toBeTruthy()
    await fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    await waitFor(() => expect(window.location.hash).toBe('#/kb/compound/glycine'))
  })

  it('says so when the target is this page, unknown, or not connected', async () => {
    navigate('/kb/compound/glycine?to=compound%3Aglycine')
    mount(PathFinder, { from: 'compound:glycine' })
    expect(screen.getByText(/That is this page/)).toBeTruthy()
    navigate('/kb/compound/glycine?to=compound%3Anope')
    expect(await screen.findByText(/could not be found/)).toBeTruthy()
  })
})

describe('RadialGraph', () => {
  it('draws the centre and every node as a link with an accessible name', () => {
    const nodes = [
      { id: 'compound:betaine', name: 'Betaine', type: 'compound', label: 'Precursor of' },
      { id: 'enzyme:gnmt', name: 'Glycine N-methyltransferase (GNMT)', type: 'enzyme', label: 'Substrate of' }
    ]
    const { container } = mount(RadialGraph, { center: { id: 'compound:glycine', name: 'Glycine' }, nodes })
    const links = [...container.querySelectorAll('svg a')]
    expect(links).toHaveLength(3)
    expect(links.map((link) => link.getAttribute('aria-label'))).toEqual([
      'Betaine (Precursor of)',
      'Glycine N-methyltransferase (GNMT) (Substrate of)',
      'Glycine (this entry)'
    ])
    expect(links[0].getAttribute('href')).toBe('#/kb/compound/betaine')
    expect(container.querySelectorAll('line')).toHaveLength(2)
    expect(container.querySelector('svg').getAttribute('aria-label')).toMatch(/Glycine/)
    expect(container.querySelector('figcaption')).toBeTruthy()
  })
})
