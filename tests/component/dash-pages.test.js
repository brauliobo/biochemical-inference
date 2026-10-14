import { fireEvent, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { navigate } from '../../src/router.js'
import { DASHBOARDS } from '../../src/views/dash/routes.js'
import { routes } from '../../src/routes.js'
import { expectAccessible } from '../helpers/axe.js'
import { mountVapor } from '../helpers/mount-vapor.js'

// The three flagship dashboards, the index and the home cards with MOCKED runners (the simulator is covered by
// tests/unit/dash-*.test.js): headings, tiles, controls, what each control sends to the runner, and axe.
const runners = vi.hoisted(() => ({ methylation: vi.fn(), glycine: vi.fn(), choline: vi.fn() }))
vi.mock('../../src/components/dash/methylation-dash-run.js', async () => {
  const f = await import('../helpers/dash-fixtures.js')
  runners.methylation.mockImplementation(() => f.fakeMethylationResult())
  return { runMethylationDash: runners.methylation, referenceState: () => ({}), focusIndex: () => 0, SERIES_IDS: [], SHARE_IDS: [], default: runners.methylation }
})
vi.mock('../../src/components/dash/glycine-dash-run.js', async () => {
  const f = await import('../helpers/dash-fixtures.js')
  runners.glycine.mockImplementation(() => f.fakeGlycineResult())
  return { runGlycineDash: runners.glycine }
})
vi.mock('../../src/components/dash/choline-dash-run.js', async () => {
  const f = await import('../helpers/dash-fixtures.js')
  runners.choline.mockImplementation(() => f.fakeCholineResult())
  return { runCholineDash: runners.choline }
})

async function open(path) {
  navigate(path)
  const App = (await import('../../src/App.vue')).default
  mountVapor(App)
  // the first visit of a route imports its chunk (the simulator, the charts): slow on a cold transform cache
  await screen.findByRole('heading', { level: 1 }, { timeout: 30_000 })
  await screen.findByRole('main')
}
const lastCall = (mock) => mock.mock.calls.at(-1)[0]

beforeEach(() => {
  window.scrollTo = vi.fn()
  for (const mock of Object.values(runners)) mock.mockClear()
})

describe('routes', () => {
  it('registers the index and every dashboard, including the sibling views', () => {
    expect(routes.find((route) => route.path === '/dashboards')).toBeTruthy()
    for (const dashboard of DASHBOARDS) expect(routes.find((route) => route.path === dashboard.path), dashboard.path).toBeTruthy()
    expect(DASHBOARDS.map((d) => d.path)).toEqual(expect.arrayContaining(['/dash/methylation', '/dash/glycine', '/dash/choline', '/dash/gut-acid', '/dash/histamine-night', '/dash/b6-gaba', '/dash/bile-acids', '/dash/tma-tmao']))
  })
})

describe('/dash/methylation', () => {
  it('shows the result tiles, the charts and the standing disclaimer, and is accessible', async () => {
    await open('/dash/methylation')
    expect(await screen.findByRole('heading', { level: 1, name: 'Methylation balance' }, { timeout: 15_000 })).toBeTruthy()
    const ratio = await screen.findByTestId('tile-samSahRatio', {}, { timeout: 15_000 })
    expect(within(ratio).getByText('SAM:SAH')).toBeTruthy()
    expect(ratio.textContent).toMatch(/−\d/)
    expect(screen.getAllByTestId(/^tile-/)).toHaveLength(6)
    expect(screen.getByRole('note', { name: 'Model limits' }).textContent).toMatch(/not measured physiology or medical advice/)
    for (const heading of ['Who spends the methyl groups?', 'Under- or over-methylation?', 'Time course', 'The network in this scenario', 'What is robust?', 'Contested constants']) {
      expect(screen.getByRole('heading', { level: 2, name: heading }), heading).toBeTruthy()
    }
    expect(document.querySelectorAll('main figure').length).toBeGreaterThanOrEqual(3)
    await expectAccessible(document.body, { page: true })
  })

  it('offers the presets with their evidence chips and the 12 sliders', async () => {
    await open('/dash/methylation')
    await screen.findByTestId('tile-samSahRatio', {}, { timeout: 15_000 })
    const radios = screen.getAllByRole('radio').filter((radio) => radio.closest('.dash-presets'))
    expect(radios).toHaveLength(13)
    const glycine = screen.getByRole('radio', { name: /Glycine 10 g \(single dose\)/ })
    expect(glycine.checked).toBe(true)
    expect(glycine.closest('label').textContent).toContain('Hypothesis')
    expect(screen.getByRole('radio', { name: /^Baseline/ }).closest('label').textContent).toContain('Supported')
    expect(document.querySelectorAll('.dash-sliders input[type="range"]')).toHaveLength(12)
  })

  it('sends the chosen preset and the moved slider to the runner', async () => {
    await open('/dash/methylation')
    await screen.findByTestId('tile-samSahRatio', {}, { timeout: 15_000 })
    await fireEvent.click(screen.getByRole('radio', { name: /Niacin 2 g per day/ }))
    await waitFor(() => expect(lastCall(runners.methylation)).toMatchObject({ presetId: 'niacin-2g', controls: { niacinDose: 2 } }))
    await fireEvent.update(document.querySelector('#dash-c-glycineLoad'), '12')
    await waitFor(() => expect(lastCall(runners.methylation).controls.glycineLoad).toBe(12))
    expect(window.location.hash).toContain('scenario=niacin-2g')
  })

  it('warns that the contested constants change the conclusions and passes the choice on', async () => {
    await open('/dash/methylation')
    await screen.findByTestId('tile-samSahRatio', {}, { timeout: 15_000 })
    expect(screen.getByText('These switches change the conclusions')).toBeTruthy()
    await fireEvent.click(screen.getByRole('radio', { name: 'Km 2 mM (Luka)' }))
    await waitFor(() => expect(lastCall(runners.methylation).variants.gnmtGlycineKm).toBe('luka2000'))
  })

  it('reads the robustness table and the validation dots', async () => {
    await open('/dash/methylation?scenario=glycine-10g')
    await screen.findByTestId('tile-samSahRatio', {}, { timeout: 15_000 })
    expect(screen.getAllByText('parameter-dependent').length).toBeGreaterThan(0)
    expect(screen.getByText(/Validation: 28 of 41 checks pass/)).toBeTruthy()
    expect(document.querySelectorAll('.dash-dots .dash-dot--mismatch')).toHaveLength(13)
  })
})

describe('/dash/glycine', () => {
  it('marks the effect on SAM:SAH as a hypothesis and the plasma curve as a weak source, and is accessible', async () => {
    await open('/dash/glycine')
    expect(await screen.findByRole('heading', { level: 1, name: 'Glycine' })).toBeTruthy()
    await screen.findByTestId('tile-plasma', {}, { timeout: 15_000 })
    expect(screen.getByText('Hypothesis: no human data')).toBeTruthy()
    expect(screen.getByText('Weak source')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: 'The 10 g/day deficit' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: 'Glycine in products' })).toBeTruthy()
    await expectAccessible(document.body, { page: true })
  })

  it('sends the dose to the runner and shows the stated ranges of the deficit', async () => {
    await open('/dash/glycine')
    await screen.findByTestId('tile-plasma', {}, { timeout: 15_000 })
    await fireEvent.update(document.querySelector('#dash-dose'), '4')
    await waitFor(() => expect(lastCall(runners.glycine).doseG).toBe(4))
    const deficit = screen.getByRole('heading', { level: 2, name: 'The 10 g/day deficit' }).closest('section')
    expect(deficit.textContent).toMatch(/10\.1 g\/day \(range -37\.6 to 24\)/)
    expect(deficit.textContent).toMatch(/Gersovitz 1980: 44\.3 g\/day/)
    const products = screen.getByRole('heading', { level: 2, name: 'Glycine in products' }).closest('section')
    expect(products.textContent).toMatch(/Collagen peptides or gelatin, 10 g: 2\.25 g/)
  })
})

describe('/dash/choline', () => {
  it('computes the choline needed for 10 g glycine and compares it with the upper limit, and is accessible', async () => {
    await open('/dash/choline')
    expect(await screen.findByRole('heading', { level: 1, name: 'Choline and betaine' })).toBeTruthy()
    const need = await screen.findByTestId('tile-need', {}, { timeout: 15_000 })
    expect(need.textContent).toMatch(/31/)
    expect(need.textContent).toMatch(/8\.87x the IOM limit/)
    await fireEvent.update(document.querySelector('#calc-conversion'), '1')
    await waitFor(() => expect(screen.getByTestId('tile-need').textContent).toMatch(/13\.9/))
    expect(screen.getByTestId('tile-need').textContent).toMatch(/3\.96x the IOM limit/)
    const salts = screen.getByRole('table', { name: /Salt forms/ })
    expect(within(salts).getAllByRole('row')).toHaveLength(5)
    expect(screen.getByText('No upper limit established')).toBeTruthy()
    await expectAccessible(document.body, { page: true })
  })

  it('sends the intake to the runner', async () => {
    await open('/dash/choline')
    await screen.findByTestId('tile-need', {}, { timeout: 15_000 })
    await fireEvent.update(document.querySelector('#dash-choline'), '1000')
    await waitFor(() => expect(lastCall(runners.choline).cholineMg).toBe(1000))
  })
})

describe('/dashboards and the home cards', () => {
  it('lists every dashboard as a card with a picture and a link, and is accessible', async () => {
    await open('/dashboards')
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboards' })).toBeTruthy()
    for (const dashboard of DASHBOARDS) {
      expect(screen.getByRole('link', { name: dashboard.title }).getAttribute('href')).toBe(`#${dashboard.path}`)
    }
    await waitFor(() => expect(document.querySelectorAll('svg.dash-thumb[role="img"]').length).toBeGreaterThanOrEqual(8))
    await expectAccessible(document.body, { page: true })
  })

  it('answers each home question with a link to its dashboard', async () => {
    await open('/')
    expect(await screen.findByRole('heading', { level: 2, name: 'Questions this site answers' })).toBeTruthy()
    const href = (name) => screen.getByRole('link', { name }).getAttribute('href')
    expect(href('Why does glycine powder make me belch?')).toBe('#/dash/gut-acid')
    expect(href('Who spends the methyl groups?')).toBe('#/dash/methylation')
    expect(href('Can choline replace 10 g of glycine?')).toBe('#/dash/choline')
    expect(href('Why 2-3 am waking and throat burn?')).toBe('#/dash/histamine-night')
    expect(href('What does the evidence really say?')).toBe('#/evidence')
    expect(href('Browse the ontology')).toBe('#/atlas')
  })

  it('has the six primary navigation links', async () => {
    await open('/')
    await screen.findByRole('heading', { level: 1 })
    const nav = within(screen.getByRole('navigation', { name: 'Primary' }))
    expect(nav.getAllByRole('link').map((link) => link.textContent)).toEqual(['Home', 'Dashboards', 'Atlas', 'Evidence', 'Knowledge base', 'Workbenches'])
  })
})
