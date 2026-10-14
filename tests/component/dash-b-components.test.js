import { fireEvent, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CausalMap from '../../src/components/dash-gut/CausalMap.vue'
import Co2Budget from '../../src/components/dash-gut/Co2Budget.vue'
import EvidenceChips from '../../src/components/dash-gut/EvidenceChips.vue'
import ExplanationStrip from '../../src/components/dash-gut/ExplanationStrip.vue'
import LayoutMap from '../../src/components/dash-gut/LayoutMap.vue'
import RunStatus from '../../src/components/dash-gut/RunStatus.vue'
import SourceTable from '../../src/components/dash-gut/SourceTable.vue'
import { BILE_MAP, GUT_ACID_MAP } from '../../src/components/dash-gut/map-sets.js'
import { expectAccessible } from '../helpers/axe.js'
import { gutResult } from '../helpers/dash-b-fixtures.js'
import { mountVapor } from '../helpers/mount-vapor.js'

vi.setConfig({ testTimeout: 120000 })
const slow = { timeout: 30000 }

beforeEach(() => {
  window.scrollTo = () => {}
})

describe('EvidenceChips', () => {
  it('links claims and articles to the evidence pages and other entries to the knowledge base, with the verdict of a claim and a grade', async () => {
    const items = [
      { id: 'claim:free-glycine-stimulates-gastrin' },
      { id: 'article:wald-1982-glycine-gastric-acid', label: 'Wald 1982' },
      { id: 'outcome:belching' },
      { id: 'claim:belching-mostly-swallowed-air', note: 'tested', tone: 'info' }
    ]
    const { container } = mountVapor(EvidenceChips, { props: { items, label: 'Test chips' } })
    // links are there at once; grades and verdicts follow when the knowledge data has loaded
    const links = within(container).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '#/evidence/claim/free-glycine-stimulates-gastrin',
      '#/evidence/article/wald-1982-glycine-gastric-acid',
      '#/kb/outcome/belching',
      '#/evidence/claim/belching-mostly-swallowed-air'
    ])
    await waitFor(() => expect(container.textContent).toContain('Unsupported'), slow)
    const chips = within(container).getByRole('list', { name: 'Test chips' }).querySelectorAll('li')
    expect(chips[0].textContent).toContain('Free glycine stimulates gastrin release')
    expect(chips[0].textContent).toContain('Unsupported')
    expect(chips[1].textContent).toContain('Wald 1982')
    expect(chips[1].textContent).not.toMatch(/Supported|Unsupported/) // an article has a grade, not a verdict
    expect(chips[2].textContent).toContain('Belching (eructation)'.split(' (')[0])
    expect(chips[3].textContent).toContain('Supported')
    expect(chips[3].textContent).toContain('tested')
    expect(chips[0].querySelector('.ev-grade')).toBeTruthy()
    await expectAccessible(container, { page: false })
  })
})

describe('ExplanationStrip', () => {
  it('shows a card per explanation with its evidence chips and the model chip', async () => {
    const items = [
      { id: 'a', title: 'Swallowed air', evidence: [{ id: 'claim:belching-mostly-swallowed-air' }], model: { label: 'Modelled: small', tone: 'success' } },
      { id: 'b', title: 'Not in the model', evidence: [{ id: 'outcome:transient-les-relaxations', label: 'TLESR' }], model: { label: 'Not modelled', tone: 'muted' } }
    ]
    const { container } = mountVapor(ExplanationStrip, { props: { items } })
    const cards = within(container).getByRole('list', { name: 'Competing explanations for belching' }).children
    expect(cards).toHaveLength(2)
    expect(within(cards[0]).getByText('Swallowed air')).toBeTruthy()
    expect(within(cards[1]).getByText('Not modelled')).toBeTruthy()
    await waitFor(() => expect(cards[0].textContent).toContain('Supported'), slow)
    await expectAccessible(container, { page: false })
  })
})

describe('Co2Budget', () => {
  it('draws the three bars on one absolute scale and writes the honest sentence as the summary', async () => {
    const { container } = mountVapor(Co2Budget, { props: { co2: gutResult().co2 } })
    expect(container.textContent).toContain('CO2 budget over 8 hours (mL at 37 C)')
    expect(container.textContent).toContain('CO2 absorbed through the gut wall')
    expect(container.textContent).toContain('Swallowed air (assumed)')
    expect(container.textContent).toContain('2.8 mL is belched (0.2% of what formed)')
    expect(container.textContent).toContain('mL')
    await expectAccessible(container, { page: false })
  })
})

describe('LayoutMap', () => {
  it('loads a layout lazily, draws model flux on it and lists the regulation links that the map cannot draw', async () => {
    const flux = gutResult().flux
    const { container } = mountVapor(LayoutMap, { props: { layoutId: 'gastric-acid', id: 'test-map', title: 'Gastric acid map', flux, fluxUnit: 'mmol/h' } })
    expect(container.textContent).toContain('Loading the map.')
    await waitFor(() => expect(container.querySelector('#test-map-caption')).toBeTruthy(), slow)
    expect(container.textContent).toContain('Gastric acid map')
    expect(container.textContent).toContain('mmol/h') // the flux key
    const links = within(container).getByText(/Regulation links on this map \(4\)/)
    expect(links.closest('details').textContent).toContain('PPI lowers H+/K+-ATPase (blocks)')
    // the text alternative lists pooled participants too, so no equation has an unknown side
    await waitFor(() => expect(container.textContent).toContain('ATP'), slow)
    await expectAccessible(container, { page: false })
  })

  it('applies label suffixes (PLP-dependent steps)', async () => {
    const { container } = mountVapor(LayoutMap, { props: { layoutId: 'gaba-shunt-b6', id: 'plp-map', title: 'B6 map', suffix: { 'reaction:gad-glutamate-decarboxylation': ' (PLP)' } } })
    await waitFor(() => expect(container.querySelector('#plp-map-caption')).toBeTruthy(), slow)
    expect(container.textContent).toContain('GAD (PLP)')
  })

  it('says so when the layout does not exist', async () => {
    const { container } = mountVapor(LayoutMap, { props: { layoutId: 'no-such-map', id: 'none', title: 'Missing' } })
    await waitFor(() => expect(within(container).getByRole('alert').textContent).toContain('The map could not be loaded.'))
    expect(container.querySelector('figure')).toBeNull()
  })
})

describe('CausalMap', () => {
  it('lists every hypothesis link with its claim verdict, and a chosen node narrows the list to its own links', async () => {
    const { container } = mountVapor(CausalMap, { props: { id: 'test-causal', title: 'Gut causal map', include: GUT_ACID_MAP.include, labels: GUT_ACID_MAP.labels } })
    const all = await within(container).findByRole('heading', { name: 'Hypothesis links and the verdict of their claims' }, slow)
    const rows = () => all.closest('section').querySelectorAll('.dg-edges > li')
    const total = rows().length
    expect(total).toBeGreaterThan(10)
    expect([...rows()].every((row) => row.textContent.includes('Hypothesis'))).toBe(true)
    const belching = [...container.querySelectorAll('.viz-gnode')].find((node) => node.getAttribute('aria-label').startsWith('Belching,'))
    await fireEvent.click(belching)
    await waitFor(() => expect(within(container).getByRole('heading', { name: 'Links at "Belching"' })).toBeTruthy())
    expect(rows().length).toBeGreaterThan(3)
    // links at a node include established ones, which are not hypotheses
    expect([...rows()].some((row) => !row.textContent.includes('Hypothesis'))).toBe(true)
    expect(rows()[0].textContent).toContain('Hypothesis') // hypotheses come first
    await expectAccessible(container, { page: false })
  })

  it('the bile slice has the reflux hypothesis with an unsupported claim', async () => {
    const { container } = mountVapor(CausalMap, { props: { id: 'bile-causal', title: 'Bile causal map', include: BILE_MAP.include, labels: BILE_MAP.labels } })
    const link = await within(container).findByRole('link', { name: 'See the claim: Glycine to Bile reflux into the stomach' }, slow)
    expect(link.closest('li').textContent).toContain('Unsupported')
  })
})

describe('SourceTable and RunStatus', () => {
  it('lists numbers with their status and a study link, or says it is an assumption', async () => {
    const rows = [
      { id: 'a', label: 'Bolus yield', value: '63%', range: '32 to 100%', status: 'measured once', tone: 'info', article: 'article:zhang-1999-choline-tma-urine' },
      { id: 'b', label: 'Diet yield', value: '5%', range: '1 to 30%', status: 'assumed', tone: 'warning', article: null }
    ]
    const { container } = mountVapor(SourceTable, { props: { caption: 'Numbers', rows } })
    expect(within(container).getByRole('link', { name: 'Open the study: Bolus yield' }).getAttribute('href')).toBe('#/evidence/article/zhang-1999-choline-tma-urine')
    expect(container.textContent).toContain('Assumption')
    await expectAccessible(container, { page: false })
  })

  it('RunStatus: a polite message while running, an alert on failure, the solver warnings', () => {
    const running = mountVapor(RunStatus, { props: { running: true, what: 'the stomach model' } })
    expect(within(running.container).getByRole('status').textContent).toContain('Running the stomach model.')
    running.unmount()
    const failed = mountVapor(RunStatus, { props: { error: new Error('Stiff solver gave up'), what: 'the stomach model' } })
    expect(within(failed.container).getByRole('alert').textContent).toContain('Could not run the stomach model')
    expect(failed.container.textContent).toContain('Stiff solver gave up')
    failed.unmount()
    const warned = mountVapor(RunStatus, { props: { warnings: ['step limit', { message: 'clamped' }] } })
    expect(warned.container.textContent).toContain('step limit')
    expect(warned.container.textContent).toContain('clamped')
  })
})
