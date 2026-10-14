import { fireEvent, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import B6GabaDashboard from '../../src/views/dash/B6GabaDashboard.vue'
import BileAcidsDashboard from '../../src/views/dash/BileAcidsDashboard.vue'
import GutAcidDashboard from '../../src/views/dash/GutAcidDashboard.vue'
import HistamineNightDashboard from '../../src/views/dash/HistamineNightDashboard.vue'
import TmaTmaoDashboard from '../../src/views/dash/TmaTmaoDashboard.vue'
import { expectAccessible } from '../helpers/axe.js'
import { mountVapor } from '../helpers/mount-vapor.js'

// The five gut / histamine / B6 / bile / TMA dashboards with mocked model runs (the engine and the models are covered
// by tests/unit/dash-b-runs.test.js and the sim tests). The knowledge data and the layouts are real.
vi.setConfig({ testTimeout: 120000 })

const calls = vi.hoisted(() => ({ gut: [], histamine: [], b6: [], bile: [], link: [] }))
vi.mock('../../src/components/dash-gut/gut-run.js', async () => {
  const fixtures = await import('../helpers/dash-b-fixtures.js')
  return { createGutRunner: () => (controls) => { calls.gut.push({ ...controls }); return fixtures.gutResult(controls) } }
})
vi.mock('../../src/components/dash-gut/histamine-run.js', async () => {
  const fixtures = await import('../helpers/dash-b-fixtures.js')
  return { createHistamineRunner: () => (controls) => { calls.histamine.push({ ...controls }); return fixtures.histamineResult(controls) } }
})
vi.mock('../../src/components/dash-gut/b6-run.js', async () => {
  const fixtures = await import('../helpers/dash-b-fixtures.js')
  return { createB6Runner: () => (controls) => { calls.b6.push({ ...controls }); return fixtures.b6Result(controls) } }
})
vi.mock('../../src/components/dash-gut/bile-run.js', async () => {
  const fixtures = await import('../helpers/dash-b-fixtures.js')
  return { createBileRunner: () => (controls) => { calls.bile.push({ ...controls }); return fixtures.bileResult(controls) } }
})
vi.mock('../../src/components/dash-gut/methylation-link.js', () => ({
  methylationSamSah: (scenario) => {
    calls.link.push(scenario)
    return { scenario, label: 'Glycine 10 g/day (test)', sam: 37.2, sah: 14.6, relSam: 0.62, relSah: 1.22, ratio: 3.1, ratio0: 6.2, status: 'partly', summary: 'Test summary of the scenario.' }
  }
}))

beforeEach(() => {
  window.scrollTo = () => {}
  for (const list of Object.values(calls)) list.length = 0
})

const slow = { timeout: 30000 }
const main = () => document.body
const text = () => document.body.textContent.replace(/\s+/g, ' ')
// A preset row is a radio whose label also carries the evidence chip of the shared ScenarioPresets ("... Supported"), so
// find it by the start of its accessible name.
const preset = (label) => screen.getByRole('radio', { name: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`) })
const slider = (name) => screen.getByLabelText(name, { selector: 'input[type="range"]' })

async function open(View, heading) {
  const view = mountVapor(View)
  await screen.findByRole('heading', { level: 1, name: heading })
  return view
}

describe('/dash/gut-acid', () => {
  it('shows the question, the tiles, both charts, the CO2 budget, the explanations, the causal map and the acid map', async () => {
    const view = await open(GutAcidDashboard, 'Gut, acid and belching')
    expect(text()).toContain('Why would glycine powder make me belch? What do the models say?')
    await screen.findByRole('heading', { level: 2, name: 'What the model says' }, slow)
    const headings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent.trim())
    for (const wanted of ['Stomach pH and acid', 'Where the CO2 goes', 'Competing explanations for belching', 'From glycine powder to throat burning', 'Acid, bicarbonate and CO2 in the stomach']) expect(headings).toContain(wanted)
    for (const chart of ['Stomach pH over 8 hours', 'Acid secreted by the stomach wall', 'CO2 budget over 8 hours (mL at 37 C)']) expect(screen.getByText(chart)).toBeTruthy()
    expect(text()).toContain('Time with stomach pH below 4')
    expect(text()).toContain('CO2 belched')
    // the honest CO2 sentence is the chart summary
    expect(text()).toMatch(/Over 8 hours the model forms 1457 mL of CO2 from acid and bicarbonate; 1385 mL is absorbed through the gut wall and 2\.8 mL is belched/)
    await waitFor(() => expect(document.querySelector('#gut-causal-map-caption')).toBeTruthy(), slow)
    await waitFor(() => expect(document.querySelector('#gut-acid-map-caption')).toBeTruthy(), slow)
    expect(view.container.querySelectorAll('figure').length).toBeGreaterThanOrEqual(5)
  })

  it('moving the PPI slider re-runs the model and updates the time below pH 4 (the keyboard task)', async () => {
    await open(GutAcidDashboard, 'Gut, acid and belching')
    await screen.findByRole('heading', { level: 2, name: 'What the model says' }, slow)
    expect(text()).toMatch(/Time with stomach pH below 4\s*7\.2/)
    await fireEvent.update(slider('PPI: acid pumps blocked'), '60')
    await waitFor(() => expect(calls.gut.at(-1).ppi).toBe(60), slow)
    await waitFor(() => expect(text()).toMatch(/Time with stomach pH below 4\s*5\.2/), slow)
    // the controls now equal the "PPI, 60%" preset
    await waitFor(() => expect(preset('PPI, 60% of pumps blocked').checked).toBe(true))
  })

  it('a preset sets the sliders and says how well it is supported; the glycine hypothesis is 0 by default and labelled', async () => {
    await open(GutAcidDashboard, 'Gut, acid and belching')
    await screen.findByRole('heading', { level: 2, name: 'What the model says' }, slow)
    expect(slider('Glycine raises acid output by').value).toBe('0')
    expect(text()).toContain('Hypothesis, not a finding')
    expect(text()).toContain('Reproduces a measurement')
    await fireEvent.click(preset('What-if: glycine adds 70% more acid'))
    await waitFor(() => expect(slider('Glycine raises acid output by').value).toBe('70'))
    expect(text()).toContain('No human data for the size; Wald 1982 gave 5.6 vs 3.3 mmol/h.')
    await waitFor(() => expect(calls.gut.some((call) => call.glycineAcidBoostPct === 70)).toBe(true), slow)
    // the human data are chips that link to the evidence pages
    const wald = await screen.findByRole('link', { name: /Wald 1982/ }, slow)
    expect(wald.getAttribute('href')).toBe('#/evidence/article/wald-1982-glycine-gastric-acid')
  })

  it('lists the competing explanations with the verdicts of their claims, and every hypothesis link with its claim', async () => {
    await open(GutAcidDashboard, 'Gut, acid and belching')
    const strip = await screen.findByRole('list', { name: 'Competing explanations for belching' }, slow)
    for (const title of ['Swallowed air and supragastric belching', 'Transient lower sphincter relaxations (TLESR)', 'Bacterial fermentation of free glycine (SIBO)', 'Acid + bicarbonate gives CO2']) expect(within(strip).getByText(title)).toBeTruthy()
    await waitFor(() => expect(within(strip).getAllByText('Unsupported').length).toBeGreaterThanOrEqual(2), slow)
    expect(within(strip).getAllByText('Supported').length).toBeGreaterThanOrEqual(1)
    expect(within(strip).getByText(/Modelled: 163 mL of air in 8 h \(assumed rate\) against 2\.8 mL of belched CO2/)).toBeTruthy()
    const link = await screen.findByRole('link', { name: 'See the claim: Glycine powder to Belching' }, slow)
    expect(link.getAttribute('href')).toBe('#/evidence/claim/glycine-powder-low-dose-belching-reports')
    const row = link.closest('li')
    expect(row.textContent).toContain('Hypothesis')
    expect(row.textContent).toContain('Unsupported')
  })

  it('has no accessibility violations once populated', async () => {
    const view = await open(GutAcidDashboard, 'Gut, acid and belching')
    await screen.findByRole('heading', { level: 2, name: 'What the model says' }, slow)
    await screen.findByRole('link', { name: 'See the claim: Glycine powder to Belching' }, slow)
    await waitFor(() => expect(document.querySelector('#gut-acid-map-caption')).toBeTruthy(), slow)
    await expectAccessible(view.container, { page: false })
  })
})

describe('/dash/histamine-night', () => {
  it('shows the histamine tiles, the SAM sweep, who clears histamine and the evidence with the rhythm marked weak', async () => {
    await open(HistamineNightDashboard, 'Histamine and night waking')
    await screen.findByRole('heading', { level: 2, name: 'What the model says' }, slow)
    expect(text()).toContain('Systemic histamine')
    expect(text()).toContain('Brain (CNS) histamine')
    expect(screen.getByText('Steady-state histamine against SAM')).toBeTruthy()
    expect(screen.getByText('Who clears histamine')).toBeTruthy()
    expect(screen.getByText('Weak evidence: one study')).toBeTruthy()
    const against = await screen.findByRole('link', { name: 'Schulze 1992: urinary histamine shows no rhythm' }, slow)
    expect(against.getAttribute('href')).toBe('#/evidence/article/schulze-1992-urinary-histamine-no-rhythm')
    expect(against.closest('li').textContent).toContain('against')
    expect(screen.getByRole('list', { name: 'Assumptions behind the split' })).toBeTruthy()
  })

  it('SAM from the methylation model: choosing a preset sets SAM and SAH and shows its evidence status', async () => {
    await open(HistamineNightDashboard, 'Histamine and night waking')
    await screen.findByRole('heading', { level: 2, name: 'What the model says' }, slow)
    expect(slider('SAM available to HNMT').value).toBe('60')
    await fireEvent.click(preset('Methylation model: niacin 2 g/day'))
    await waitFor(() => expect(slider('SAM available to HNMT').value).toBe('37.2'), slow)
    expect(slider('SAH (HNMT is inhibited by it)').value).toBe('14.6')
    expect(calls.link).toEqual(['niacin-2g'])
    expect(text()).toContain('Glycine 10 g/day (test): SAM:SAH 6.2 to 3.1')
    expect(text()).toContain('Model prediction')
    await waitFor(() => expect(calls.histamine.at(-1)).toMatchObject({ samUM: 37.2, sahUM: 14.6 }), slow)
    // moving a slider by hand leaves the preset
    await fireEvent.update(slider('SAM available to HNMT'), '30')
    await waitFor(() => expect(preset('Methylation model: niacin 2 g/day').checked).toBe(false))
  })

  it('the day-night rhythm is off until asked for, then the day chart appears with the two clock markers', async () => {
    await open(HistamineNightDashboard, 'Histamine and night waking')
    await screen.findByRole('heading', { level: 2, name: 'What the model says' }, slow)
    expect(screen.queryByText('Histamine by clock hour, relative to the reference')).toBeNull()
    await fireEvent.click(screen.getByRole('button', { name: 'Show the weak day-night rhythm' }))
    await screen.findByText('Histamine by clock hour, relative to the reference', {}, slow)
    await waitFor(() => expect(screen.getByLabelText('Add the weak day-night rhythm').checked).toBe(true))
    await waitFor(() => expect(calls.histamine.at(-1).diurnal).toBe(true), slow)
    await waitFor(() => expect(text()).toContain('Plasma at 04:00 against 16:00'), slow)
    expect(text()).toContain('Weak evidence: urinary markers show no rhythm.')
  })

  it('has no accessibility violations once populated', async () => {
    const view = await open(HistamineNightDashboard, 'Histamine and night waking')
    await screen.findByRole('heading', { level: 2, name: 'What the model says' }, slow)
    await screen.findAllByRole('link', { name: /See the claim/ }, slow)
    await expectAccessible(view.container, { page: false })
  })
})

describe('/dash/b6-gaba', () => {
  it('marks every row of the model-against-data table as matching or disagreeing, with the study to open', async () => {
    await open(B6GabaDashboard, 'Vitamin B6 and GABA')
    const table = await screen.findByRole('table', { name: 'The model at 41% PLP against human data' }, slow)
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows.map((row) => row.querySelector('th').textContent)).toEqual(['Cystathionine (liver)', 'Fasting total homocysteine', 'Glycine (liver)'])
    expect(rows.map((row) => row.querySelectorAll('td')[2].textContent)).toEqual(['Model matches', 'Model disagrees', 'Model disagrees'])
    expect(within(rows[0]).getByRole('link', { name: 'Open the study: Cystathionine (liver)' }).getAttribute('href')).toBe('#/evidence/article/gregory-2013-b6-restriction-metabolomics')
  })

  it('shows the dose against IOM UL 100 and EFSA UL 12, with P5P and pyridoxine label doses and the evidence chips', async () => {
    await open(B6GabaDashboard, 'Vitamin B6 and GABA')
    await screen.findByRole('heading', { level: 2, name: 'What the model says' }, slow)
    await screen.findByText('B6 dose against reference intakes and upper limits', {}, slow)
    expect(text()).toContain('IOM 1998 (US), adults')
    expect(text()).toContain('EFSA 2017 and 2023 (EU), adults')
    expect(text()).toContain('UL 100')
    expect(text()).toContain('UL 12')
    await fireEvent.update(slider('Your B6 dose'), '100')
    await waitFor(() => expect(text()).toContain('On a P5P label: 146.1 mg'), slow)
    expect(text()).toContain('On a pyridoxine (base) label: 100.0 mg')
    await waitFor(() => expect(text()).toContain('Above the UL'), slow)
    expect(text()).toContain('8.3 times the UL')
    const claim = await screen.findByRole('link', { name: 'P5P is better than pyridoxine' }, slow)
    expect(claim.getAttribute('href')).toBe('#/evidence/claim/p5p-bypasses-hepatic-activation')
    expect(claim.closest('li').textContent).toContain('not tested head to head')
    const pyroluria = await screen.findByRole('link', { name: 'Pyroluria (KPU) causes functional B6 and zinc deficiency' }, slow)
    expect(pyroluria.getAttribute('href')).toBe('#/evidence/claim/pyroluria-causes-b6-zinc-deficiency')
    expect(pyroluria.closest('li').textContent).toContain('Contested')
  })

  it('moving PLP re-runs the model and the map colours follow the PLP slider', async () => {
    await open(B6GabaDashboard, 'Vitamin B6 and GABA')
    await screen.findByRole('heading', { level: 2, name: 'What the model says' }, slow)
    await fireEvent.click(preset('B6 restriction (41%)'))
    await waitFor(() => expect(slider('Cellular PLP').value).toBe('41'))
    await waitFor(() => expect(calls.b6.at(-1).plp).toBe(41), slow)
    await waitFor(() => expect(document.querySelector('#b6-shunt-map-caption')).toBeTruthy(), slow)
    expect(text()).toContain('Reproduces a measurement')
    expect(text()).toMatch(/Cystathionine \(liver\)\s*\+59%/)
  })

  it('has no accessibility violations once populated', async () => {
    const view = await open(B6GabaDashboard, 'Vitamin B6 and GABA')
    await screen.findByRole('table', { name: 'The model at 41% PLP against human data' }, slow)
    await screen.findByText('B6 dose against reference intakes and upper limits', {}, slow)
    await screen.findAllByRole('link', { name: /See the claim/ }, slow)
    await waitFor(() => expect(document.querySelector('#b6-shunt-map-caption')).toBeTruthy(), slow)
    await expectAccessible(view.container, { page: false })
  })
})

describe('/dash/bile-acids', () => {
  it('flags the what-if as having no human data and shows the observed range beside it', async () => {
    await open(BileAcidsDashboard, 'Bile acids: glycine or taurine')
    await screen.findByRole('heading', { level: 2, name: 'What the model says' }, slow)
    expect(text()).toContain('No human data')
    expect(text()).toContain('Hypothesis')
    expect(screen.getByText('Share of conjugated bile acids')).toBeTruthy()
    expect(screen.getByText('Glycine-conjugated share against the glycine supplement')).toBeTruthy()
    expect(text()).toContain('Observed range')
    expect(text()).toContain('Glycine-conjugated bile acids')
    await screen.findByRole('table', { name: 'BAAT kinetics: what they imply' }, slow)
    expect(text()).toContain('Hepatic glycine and taurine pools in people: not found')
  })

  it('moving the glycine slider re-runs the what-if and leaves the preset', async () => {
    await open(BileAcidsDashboard, 'Bile acids: glycine or taurine')
    await screen.findByRole('heading', { level: 2, name: 'What the model says' }, slow)
    expect(preset('Glycine 10 g a day').checked).toBe(true)
    await fireEvent.update(slider('Extra glycine a day'), '4')
    await waitFor(() => expect(calls.bile.at(-1).glycineG).toBe(4), slow)
    await waitFor(() => expect(preset('Glycine 10 g a day').checked).toBe(false))
    await fireEvent.click(preset('Taurine supply x3'))
    await waitFor(() => expect(slider('Liver taurine supply').value).toBe('3'))
  })

  it('shows the duodenogastric reflux slice with the claim that glycine overload causes it as unsupported', async () => {
    await open(BileAcidsDashboard, 'Bile acids: glycine or taurine')
    const link = await screen.findByRole('link', { name: 'See the claim: Glycine to Bile reflux into the stomach' }, slow)
    expect(link.getAttribute('href')).toBe('#/evidence/claim/glycine-overload-shifts-bile-conjugation-and-reflux')
    expect(link.closest('li').textContent).toContain('Unsupported')
  })

  it('has no accessibility violations once populated', async () => {
    const view = await open(BileAcidsDashboard, 'Bile acids: glycine or taurine')
    await screen.findByRole('heading', { level: 2, name: 'What the model says' }, slow)
    await screen.findAllByRole('link', { name: /See the claim/ }, slow)
    await waitFor(() => expect(document.querySelector('#bile-conjugation-map-caption')).toBeTruthy(), slow)
    await expectAccessible(view.container, { page: false })
  })
})

describe('/dash/tma-tmao', () => {
  it('draws choline against the IOM UL of 3500 mg and EFSA with no upper limit, and the claim against the UL', async () => {
    await open(TmaTmaoDashboard, 'Choline, TMA and TMAO')
    await screen.findByText('Choline intake against the IOM and EFSA limits', {}, slow)
    expect(text()).toContain('UL 3500')
    expect(text()).toContain('No upper limit established')
    expect(text()).toContain('The claim: 28 to 35 g')
    expect(text()).toContain('At 100% conversion: 13.9 g of choline (4.0 times the IOM UL).')
    expect(text()).toContain('At 45% conversion: 30.8 g of choline (8.8 times the UL).')
    expect(text()).toContain('Every choline becomes glycine (ceiling): 13.9 g')
    expect(screen.getByText('TMA + TMAO output against choline intake')).toBeTruthy()
    expect(text()).toContain('An extrapolation, not a prediction')
  })

  it('the claim presets move the intake: 35 g is ten times the UL, the TMA output rises and the status is a hypothesis', async () => {
    await open(TmaTmaoDashboard, 'Choline, TMA and TMAO')
    await screen.findByText('Choline intake against the IOM and EFSA limits', {}, slow)
    await fireEvent.click(preset('The claim, high (35 g)'))
    await waitFor(() => expect(slider('Choline intake').value).toBe('35000'), slow)
    expect(text()).toContain('10.0 times the IOM UL, above the 7.5 g/day level where hypotension appeared')
    expect(text()).toMatch(/TMA \+ TMAO if the bolus yield held\s*212 mmol a day/)
    expect(text()).toContain('Hypothesis')
    await fireEvent.click(preset('At the IOM upper limit (3.5 g)'))
    await waitFor(() => expect(slider('Choline intake').value).toBe('3500'), slow)
    expect(text()).toContain('From recorded data')
    expect(text()).toContain('100% of the IOM UL')
  })

  it('shows the markers (fishy odour, TMAO, FMO3) with grades and the verdicts of the claims, including that EFSA set no UL', async () => {
    await open(TmaTmaoDashboard, 'Choline, TMA and TMAO')
    const odour = await screen.findByRole('link', { name: 'Fishy body odour' }, slow)
    expect(odour.getAttribute('href')).toBe('#/kb/outcome/fishy-odor')
    await screen.findByRole('link', { name: 'FMO3 clears TMA' }, slow)
    const ul = await screen.findByRole('link', { name: /The choline UL is 3\.5 g\/day/ }, slow)
    expect(ul.closest('li').textContent).toContain('EFSA set no UL')
    expect(ul.closest('li').textContent).toContain('Partly supported')
    const tmao = await screen.findByRole('link', { name: /TMAO is a strong marker of endothelial stress/ }, slow)
    expect(tmao.closest('li').textContent).toContain('Contested')
  })

  it('has no accessibility violations once populated', async () => {
    const view = await open(TmaTmaoDashboard, 'Choline, TMA and TMAO')
    await screen.findByText('Choline intake against the IOM and EFSA limits', {}, slow)
    await screen.findAllByRole('link', { name: /See the claim/ }, slow)
    await waitFor(() => expect(document.querySelector('#tma-axis-map-caption')).toBeTruthy(), slow)
    await expectAccessible(view.container, { page: false })
  })
})
