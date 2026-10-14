import { fireEvent, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App.vue'
import { graph } from '../../src/knowledge/index.js'
import { buildEvidenceModel } from '../../src/kb/evidence.js'
import { navigate } from '../../src/router.js'
import { expectAccessible } from '../helpers/axe.js'
import { mountVapor } from '../helpers/mount-vapor.js'

// Big pages (hundreds of markers, 65 table rows) and axe: slow on a loaded machine.
vi.setConfig({ testTimeout: 120000 })

beforeEach(() => {
  window.scrollTo = () => {}
})

async function open(path) {
  navigate(path)
  const view = mountVapor(App)
  await screen.findByRole('heading', { level: 1 }, slow)
  return view
}

const main = () => screen.getByRole('main')
const slow = { timeout: 20000 } // the knowledge data loads lazily and a loaded machine is slow
const TEST_TIMEOUT = 120000

describe('/evidence overview', () => {
  it('shows the headline counters, the audit and every dashboard', async () => {
    const view = await open('/evidence')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Evidence')
    await within(main()).findByRole('button', { name: /^11 Supported/ }, slow)
    const tiles = [...main().querySelectorAll('.ev-tile')].map((tile) => tile.querySelector('.ev-tile__count').textContent)
    expect(tiles).toEqual(['11', '33', '14', '7'])
    const headings = within(main()).getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent.trim())
    expect(headings).toEqual(['Claims audit', 'Claimed against recorded', 'Grades by kind of entry', 'The literature over time', 'Where the evidence is thin'])
    expect(main().querySelectorAll('.ev-table tbody tr:not(.ev-group)').length).toBe(65)
    expect(main().querySelectorAll('.ev-db__row').length).toBe(62)
    expect(main().querySelector('table[role="grid"]')).toBeTruthy()
    expect(main().querySelector('.viz-dot-mark')).toBeTruthy()
    // text is only in the collapsed notes drawer
    const notes = within(main()).getByText('Notes').closest('details')
    expect(notes.open).toBe(false)
    await expectAccessible(view.container, { page: false })
  }, TEST_TIMEOUT)
})

describe('claims audit', () => {
  it('filters with the status tiles and the search box', async () => {
    await open('/evidence/claims')
    await within(main()).findByRole('button', { name: /Contested/ }, slow)
    const rows = () => main().querySelectorAll('.ev-table tbody tr:not(.ev-group)').length
    expect(rows()).toBe(65)
    await fireEvent.click(within(main()).getByRole('button', { name: /Contested/ }))
    await waitFor(() => expect(rows()).toBe(7), slow)
    expect(within(main()).getAllByRole('status').map((node) => node.textContent)).toContain('Showing 7 of 65 claims')
    await fireEvent.click(within(main()).getByRole('button', { name: /Contested/ }))
    await waitFor(() => expect(rows()).toBe(65), slow)
    await fireEvent.update(within(main()).getByLabelText('Find a claim'), 'free glycine gastrin')
    await waitFor(() => expect(rows()).toBe(1), slow)
    const row = main().querySelector('.ev-table tbody tr:not(.ev-group)')
    expect(row.textContent).toMatch(/Free glycine stimulates gastrin release/)
    expect(row.textContent).toMatch(/Unsupported/)
    expect(row.querySelector('a').getAttribute('href')).toBe('#/kb/claim/free-glycine-stimulates-gastrin')
  }, TEST_TIMEOUT)

  it('keeps the filters in the URL', async () => {
    await open('/evidence/claims?status=unsupported&topic=gastric')
    await within(main()).findByRole('button', { name: /Unsupported/ }, slow)
    await waitFor(() => expect(main().querySelectorAll('.ev-table tbody tr:not(.ev-group)').length).toBeGreaterThan(0), slow)
    expect(main().querySelectorAll('.ev-table tbody tr:not(.ev-group)').length).toBeLessThan(14)
    expect(within(main()).getByRole('button', { name: /Unsupported/ }).getAttribute('aria-pressed')).toBe('true')
    await fireEvent.change(within(main()).getByLabelText('Topic'), { target: { value: '' } })
    await waitFor(() => expect(window.location.hash).toBe('#/evidence/claims?status=unsupported'), slow)
  }, TEST_TIMEOUT)

  it('sorts by a column header', async () => {
    await open('/evidence/claims')
    await within(main()).findByRole('button', { name: /Supported/ }, slow)
    await fireEvent.click(within(main()).getByRole('button', { name: 'Against' }))
    await waitFor(() => expect(main().querySelector('th[aria-sort="descending"]')).toBeTruthy(), slow)
    const first = main().querySelector('.ev-table tbody tr:not(.ev-group)')
    expect(first.querySelectorAll('td')[3].textContent.trim()).toBe('2')
  }, TEST_TIMEOUT)
})

describe('literature', () => {
  const evidence = buildEvidenceModel(graph)
  const total = evidence.articles.length
  const metaAnalyses = evidence.articles.filter((article) => article.design === 'meta-analysis').length

  it('lists the articles as a dot plot table and filters them', async () => {
    await open('/evidence/literature')
    await within(main()).findByLabelText('Title, author or journal', {}, slow)
    const rows = () => main().querySelectorAll('.ev-table tbody tr').length
    await waitFor(() => expect(rows()).toBe(60), slow)
    expect(main().querySelector('.ev-yearaxis__dot')).toBeTruthy()
    expect(within(main()).getByRole('status').textContent).toBe(`Showing ${total} of ${total} articles`)
    await fireEvent.change(within(main()).getByLabelText('Study design'), { target: { value: 'meta-analysis' } })
    await waitFor(() => expect(within(main()).getAllByRole('status')[0].textContent).toMatch(new RegExp(`Showing ${metaAnalyses} of ${total}`)), slow)
    expect(rows()).toBe(metaAnalyses)
  }, TEST_TIMEOUT)

  it('pages through the table', async () => {
    await open('/evidence/literature')
    await waitFor(() => expect(main().querySelectorAll('.ev-table tbody tr').length).toBe(60), slow)
    await fireEvent.click(within(main()).getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(window.location.hash).toBe('#/evidence/literature?page=2'), slow)
    expect(main().querySelectorAll('.ev-table tbody tr').length).toBe(60)
  }, TEST_TIMEOUT)
})
