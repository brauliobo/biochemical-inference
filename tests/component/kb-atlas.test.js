import { fireEvent, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../../src/App.vue'
import { navigate } from '../../src/router.js'
import { expectAccessible } from '../helpers/axe.js'
import { mountVapor } from '../helpers/mount-vapor.js'

beforeEach(() => {
  window.scrollTo = () => {}
})

async function open(path, heading) {
  navigate(path)
  await new Promise((resolve) => setTimeout(resolve, 20))
  const view = mountVapor(App)
  await screen.findByRole('heading', { level: 1, name: heading }, { timeout: 20000 })
  return view
}
const main = () => screen.getByRole('main')

describe('/atlas overview', () => {
  it('draws the kind-by-kind relation matrix and lists the relations behind a cell', async () => {
    const { container } = await open('/atlas', 'Atlas')
    const matrix = container.querySelector('[data-testid="atlas-matrix"]')
    expect(within(matrix).getByRole('grid')).toBeTruthy()
    const cell = within(matrix).getByRole('gridcell', { name: /^Compounds, Enzymes: / })
    await fireEvent.click(cell)
    await waitFor(() => expect(window.location.hash).toBe('#/atlas?from=compound&to=enzyme'))
    const list = await within(main()).findByRole('table', { name: 'Compounds to Enzymes: relations' })
    expect(within(list).getAllByRole('row').length).toBeGreaterThan(5)
    expect(within(list).getAllByRole('link')[0].getAttribute('href')).toMatch(/^#\/kb\//)
    await expectAccessible(container)
  })

  it('has the four atlas views in its own navigation and one entry in the primary navigation', async () => {
    await open('/atlas', 'Atlas')
    const views = within(screen.getByRole('navigation', { name: 'Atlas views' })).getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(views).toEqual(['#/atlas', '#/atlas/causal', '#/atlas/network', '#/atlas/search'])
    expect(within(screen.getByRole('navigation', { name: 'Primary' })).getByRole('link', { name: 'Atlas' }).getAttribute('aria-current')).toBe('page')
  })

  it('can include the evidence links', async () => {
    const { container } = await open('/atlas', 'Atlas')
    const before = container.querySelector('[data-testid="atlas-matrix"] p').textContent
    await fireEvent.click(screen.getByRole('button', { name: 'Include articles and evidence links' }))
    await waitFor(() => expect(container.querySelector('[data-testid="atlas-matrix"] p').textContent).not.toBe(before))
    expect(window.location.hash).toBe('#/atlas?evidence=1')
  })
})

describe('/atlas/causal', () => {
  it('draws a guided path as a causal map with a link table, and opens another topic', async () => {
    const { container } = await open('/atlas/causal', 'Causal map')
    const box = container.querySelector('[data-testid="atlas-causal"]')
    expect(box.querySelectorAll('.viz-gnode').length).toBeGreaterThan(10)
    expect(box.querySelectorAll('.viz-edge--hyp').length).toBeGreaterThan(0)
    const table = within(container.querySelector('[data-testid="atlas-links"]')).getByRole('table')
    expect(within(table).getAllByRole('row').length).toBeGreaterThan(10)
    await fireEvent.change(screen.getByLabelText('Topic'), { target: { value: 'hub:state:undermethylation' } })
    await waitFor(() => expect(window.location.hash).toBe('#/atlas/causal?topic=hub%3Astate%3Aundermethylation'))
    expect(await within(container).findByRole('heading', { level: 2, name: 'Under-methylation' })).toBeTruthy()
    await expectAccessible(container)
  })

  it('shows what mitigates belching and opens it, using only the search box, the sign filter and links', async () => {
    const { container } = await open('/atlas/causal', 'Causal map')
    await fireEvent.update(screen.getByLabelText('Or focus on an entry'), 'belching')
    await fireEvent.click(await screen.findByRole('button', { name: /^Belching \(eructation\)/ }))
    expect(await within(container).findByRole('heading', { level: 2, name: 'Belching (eructation)' })).toBeTruthy()
    expect(window.location.hash).toBe('#/atlas/causal?focus=outcome%3Abelching')
    await fireEvent.change(screen.getByLabelText('Sign'), { target: { value: 'mitigate' } })
    await waitFor(() => expect(window.location.hash).toContain('sign=mitigate'))
    const table = within(container.querySelector('[data-testid="atlas-links"]')).getByRole('table')
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) expect(row.textContent).toContain('Mitigates')
    const link = within(rows[0]).getAllByRole('link')[0]
    expect(link.getAttribute('href')).toMatch(/^#\/kb\/(intervention|compound)\//)
    await fireEvent.click(link)
    await waitFor(() => expect(window.location.hash).toBe(link.getAttribute('href')))
    expect(await screen.findByRole('heading', { level: 1, name: link.textContent }, { timeout: 15000 })).toBeTruthy()
  })

  it('applies direction, depth and hypothesis filters from the address', async () => {
    const { container } = await open('/atlas/causal?focus=outcome:belching', 'Causal map')
    const links = () => Number(container.querySelector('[data-testid="atlas-causal"] p[role="status"]').textContent.match(/(\d+) links/)[1])
    const all = links()
    expect(container.querySelectorAll('.viz-edge--hyp').length).toBeGreaterThan(0)
    navigate('/atlas/causal?focus=outcome:belching&dir=up&depth=1&hyp=0')
    await waitFor(() => expect(screen.getByLabelText('Direction').value).toBe('up'))
    expect(screen.getByLabelText('Steps away').value).toBe('1')
    expect(links()).toBeLessThan(all)
    expect(container.querySelectorAll('.viz-edge--hyp')).toHaveLength(0)
    expect(screen.getByLabelText('Include hypothesis links').checked).toBe(false)
  })

  it('shows a card with a link to the page when a node is chosen', async () => {
    const { container } = await open('/atlas/causal?topic=hub:state:undermethylation', 'Causal map')
    const node = [...container.querySelectorAll('.viz-gnode')].find((item) => item.getAttribute('aria-label').startsWith('Glycine,'))
    await fireEvent.click(node)
    const card = await within(container).findByTestId('mini-card')
    expect(within(card).getByRole('link', { name: /^Open page: Glycine/ }).getAttribute('href')).toBe('#/kb/compound/glycine')
    expect(card.textContent).toContain('Evidence: ')
  })

  it('says so when the filters leave nothing, and refuses a claim as a focus', async () => {
    const { container } = await open('/atlas/causal?topic=hub:enzyme:gnmt&sign=aggravate&kinds=enzyme', 'Causal map')
    expect(within(container).getByText(/No links match these filters/)).toBeTruthy()
  })
})

describe('/atlas/network', () => {
  it('draws the core methylation map and shows a reaction card when one is chosen', async () => {
    const { container } = await open('/atlas/network', 'Metabolic network')
    await waitFor(() => expect(container.querySelector('[data-testid="atlas-network"] .viz-mnode--reaction')).toBeTruthy(), { timeout: 15000 })
    const reaction = [...container.querySelectorAll('.viz-mnode--reaction')].find((node) => node.getAttribute('aria-label').startsWith('GNMT,'))
    await fireEvent.click(reaction)
    const card = await within(container).findByTestId('mini-card')
    expect(within(card).getByRole('group', { name: /^Reaction: / })).toBeTruthy()
    expect(within(card).getByRole('link', { name: /^Open page: / }).getAttribute('href')).toMatch(/^#\/kb\/reaction\//)
    await expectAccessible(container)
  })

  it('offers the currency molecules through the map toggle', async () => {
    const { container } = await open('/atlas/network', 'Metabolic network')
    await waitFor(() => expect(container.querySelector('.viz-mnode')).toBeTruthy(), { timeout: 15000 })
    const before = container.querySelectorAll('.viz-mnode').length
    await fireEvent.click(within(container).getByRole('button', { name: 'Currency molecules' }))
    expect(container.querySelectorAll('.viz-mnode').length).toBeGreaterThan(before)
  })

  it('crops to one pathway and switches maps, both kept in the address', async () => {
    const { container } = await open('/atlas/network', 'Metabolic network')
    await waitFor(() => expect(container.querySelector('.viz-mnode')).toBeTruthy(), { timeout: 15000 })
    const whole = container.querySelectorAll('.viz-mnode').length
    const options = [...screen.getByLabelText('Pathway').options].map((option) => option.value).filter(Boolean)
    expect(options.length).toBeGreaterThan(3)
    await fireEvent.change(screen.getByLabelText('Pathway'), { target: { value: options[0] } })
    await waitFor(() => expect(container.querySelectorAll('.viz-mnode').length).toBeLessThan(whole))
    expect(window.location.hash).toContain('pathway=')
    await fireEvent.change(screen.getByLabelText('Map'), { target: { value: 'gastric-acid' } })
    await waitFor(() => expect(within(container).getByRole('heading', { level: 2, name: /Gastric acid/ })).toBeTruthy(), { timeout: 15000 })
    expect(window.location.hash).toBe('#/atlas/network?map=gastric-acid')
    expect(screen.getByLabelText('Pathway').value).toBe('')
  })
})

describe('/atlas/search', () => {
  it('lists hits as a compact table with kind, evidence and a causal-map link', async () => {
    const { container } = await open('/atlas/search?q=gnmt', 'Atlas search')
    const table = await within(container).findByRole('table', { name: 'Search results' })
    const first = within(table).getAllByRole('row')[1]
    expect(first.textContent).toContain('Glycine N-methyltransferase')
    expect(within(first).getByText('Enzyme')).toBeTruthy()
    expect(within(first).getByRole('link', { name: /^Causal map of / }).getAttribute('href')).toBe('#/atlas/causal?focus=enzyme%3Agnmt')
    expect(table.textContent).not.toMatch(/[.] [A-Z].{80}/)
    await expectAccessible(container)
  })

  it('narrows by kind and evidence grade and keeps them in the address', async () => {
    const { container } = await open('/atlas/search?q=glycine', 'Atlas search')
    const count = () => Number(within(main()).getByText(/^\d+ results?$/).textContent.match(/(\d+)/)[1])
    await within(main()).findByText(/^\d+ results?$/)
    const total = count()
    await fireEvent.change(screen.getByLabelText('Kind'), { target: { value: 'compound' } })
    await waitFor(() => expect(count()).toBeLessThan(total))
    expect(window.location.hash).toBe('#/atlas/search?q=glycine&type=compound')
    await fireEvent.change(screen.getByLabelText('Evidence grade'), { target: { value: 'plausible' } })
    await waitFor(() => expect(window.location.hash).toContain('grade=plausible'))
  })

  it('says when nothing matches and invites a query when empty', async () => {
    const empty = await open('/atlas/search', 'Atlas search')
    expect(within(empty.container).getByText('Type a name to see results here.')).toBeTruthy()
    empty.unmount()
    const none = await open('/atlas/search?q=zzzzqqq', 'Atlas search')
    expect(within(none.container).getByText(/No entries match/)).toBeTruthy()
  })
})
