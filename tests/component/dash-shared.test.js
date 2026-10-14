import { fireEvent, screen, waitFor, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import ChangeBars from '../../src/components/dash/ChangeBars.vue'
import DashboardShell from '../../src/components/dash/DashboardShell.vue'
import ModelDisclaimer from '../../src/components/dash/ModelDisclaimer.vue'
import ProvenancePanel from '../../src/components/dash/ProvenancePanel.vue'
import RangeList from '../../src/components/dash/RangeList.vue'
import ResultTiles from '../../src/components/dash/ResultTiles.vue'
import RobustnessStrip from '../../src/components/dash/RobustnessStrip.vue'
import ScenarioPresets from '../../src/components/dash/ScenarioPresets.vue'
import StatePlane from '../../src/components/dash/StatePlane.vue'
import ValidationDots from '../../src/components/dash/ValidationDots.vue'
import robustness from '../../src/sim/data/robustness.json'
import { expectAccessible } from '../helpers/axe.js'
import { mountVapor } from '../helpers/mount-vapor.js'
import { fakeMethylationResult } from '../helpers/dash-fixtures.js'
import Harness from '../fixtures/vapor/DashHarness.vue'

// The shared dashboard components (src/components/dash) with the API contract the sibling dashboards code against.
describe('DashboardShell', () => {
  it('renders the title as the only h1, the question, a status badge, the disclaimer and the slots', async () => {
    const { container } = mountVapor(Harness, { props: { which: 'shell' } })
    expect(screen.getByRole('heading', { level: 1, name: 'Gut and acid' })).toBeTruthy()
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(screen.getByText('Does acid make gas?')).toBeTruthy()
    expect(screen.getByText('Hypothesis')).toBeTruthy()
    expect(screen.getByRole('note', { name: 'Model limits' }).textContent).toMatch(/Illustrative educational model/)
    expect(screen.getByRole('region', { name: 'Scenario and controls' }).textContent).toContain('controls here')
    expect(screen.getByText('the visuals')).toBeTruthy()
    expect(screen.getByText('Notes & sources').closest('details')).toBeTruthy()
    expect(screen.getByRole('navigation', { name: 'Related' }).textContent).toContain('related link')
    await expectAccessible(container)
  })

  it('omits the controls column and the drawers when their slots are not given', () => {
    const { container } = mountVapor(Harness, { props: { which: 'bare' } })
    expect(container.querySelector('.dash-controls')).toBeNull()
    expect(container.querySelector('nav[aria-label="Related"]')).toBeNull()
    expect(screen.queryByText('Notes & sources')).toBeNull()
    expect(screen.getByText('Simulation model')).toBeTruthy() // the default status
  })
})

describe('ModelDisclaimer', () => {
  it('states the limit and, once opened, the validation counts', async () => {
    const { container } = mountVapor(ModelDisclaimer)
    expect(screen.getByText(/not measured physiology or medical advice/)).toBeTruthy()
    await waitFor(() => expect(container.textContent).toMatch(/28 of 41 validation checks pass; 13 are documented disagreements/))
    await expectAccessible(container)
  })
})

describe('ScenarioPresets and ResultTiles', () => {
  it('shows each preset with an evidence word and emits the chosen id', async () => {
    const { container } = mountVapor(Harness, { props: { which: 'presets' } })
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(4)
    const labels = radios.map((radio) => radio.closest('label').textContent)
    expect(labels[0]).toMatch(/Baseline.*Supported/)
    expect(labels[1]).toMatch(/Partly supported/)
    expect(labels[2]).toMatch(/Animal data/)
    expect(labels[3]).toMatch(/Hypothesis/)
    await fireEvent.click(radios[3])
    expect(screen.getByRole('status').textContent).toBe('chosen: d')
    await expectAccessible(container)
  })

  it('prints value, unit, change with an arrow, and a note; the tone is only a class', async () => {
    const { container } = mountVapor(ResultTiles, { props: { tiles: () => [{ id: 'ratio', label: 'SAM:SAH', value: '5.9', unit: 'ratio', delta: '−5.0%', tone: 'warning', note: 'at hour 9' }, { label: 'tHcy', value: '7', unit: 'uM', delta: '+12%', tone: 'bad' }, { label: 'Betaine', value: '40' }] } })
    const tiles = container.querySelectorAll('.dash-tile')
    expect(tiles).toHaveLength(3)
    expect(tiles[0].textContent).toContain('SAM:SAH')
    expect(tiles[0].textContent).toContain('5.9')
    expect(tiles[0].textContent).toContain('▼')
    expect(tiles[0].textContent).toContain('at hour 9')
    expect(tiles[0].classList.contains('dash-tile--warning')).toBe(true)
    expect(tiles[1].textContent).toContain('▲')
    expect(tiles[2].querySelector('.dash-tile__delta')).toBeNull()
    expect(container.querySelector('[data-testid="tile-ratio"]')).toBe(tiles[0])
    await expectAccessible(container)
  })
})

describe('ProvenancePanel', () => {
  it('loads the sources only when opened and shows value, range, source link, confidence and the assumed flag', async () => {
    const { container } = mountVapor(ProvenancePanel, { props: { model: 'methylation', ids: () => ['km_gnmt_gly', 'k_gly_use'] } })
    expect(container.querySelector('table')).toBeNull()
    const details = container.querySelector('details')
    details.open = true
    details.dispatchEvent(new Event('toggle'))
    await waitFor(() => expect(container.querySelector('table')).toBeTruthy(), { timeout: 5000 })
    const rows = container.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(2)
    const gnmt = rows[0]
    expect(gnmt.textContent).toContain('km_gnmt_gly')
    expect(gnmt.textContent).toMatch(/130/)
    expect(gnmt.textContent).toMatch(/12\.2 to 2\.0?k|12\.2 to 20k/)
    expect(gnmt.querySelector('a').getAttribute('href')).toMatch(/^#\/kb\/article\//)
    expect(rows[1].textContent).toContain('Hypothesis / assumed')
    await expectAccessible(container)
  })

  it('reads the parameters of the small models by id', async () => {
    const { container } = mountVapor(ProvenancePanel, { props: { model: 'pk', ids: () => ['glycine:ka', 'betaine:ka', 'no:such'] } })
    const details = container.querySelector('details')
    details.open = true
    details.dispatchEvent(new Event('toggle'))
    await waitFor(() => expect(container.querySelectorAll('tbody tr')).toHaveLength(2), { timeout: 5000 })
    expect(container.querySelector('tbody').textContent).toContain('glycine:ka')
    expect(container.querySelector('tbody').textContent).toContain('betaine:ka')
  })
})

describe('charts and strips', () => {
  it('draws the state plane with its three labelled regions, a text summary and a table', async () => {
    const r = fakeMethylationResult({ ratioDepth: 0.4 })
    const { container } = mountVapor(StatePlane, { props: { time: () => r.time, ratio: () => r.series.samSahRatio, thcy: () => r.series.tHcy, referenceRatio: 6.16, referenceThcy: 7, focusIndex: r.focus.index } })
    expect(container.querySelectorAll('.dash-plane__region')).toHaveLength(3)
    for (const word of ['Over-methylation-like', 'Reference-like', 'Under-methylation-like']) expect(container.textContent).toContain(word)
    expect(container.querySelector('figure details table')).toBeTruthy()
    expect(container.textContent).toMatch(/Largest departure at hour/)
    await expectAccessible(container)
  })

  it('lists estimates with their ranges and a data table', async () => {
    const { container } = mountVapor(RangeList, { props: { title: 'Estimates', unit: 'g/day', items: () => [{ id: 'a', label: 'Pathway sum', value: 2.9 }, { id: 'b', label: 'Tracer', value: 11.2, low: 9.3, high: 14.3 }] } })
    expect(container.querySelectorAll('.dash-range:not(.dash-range--axis)')).toHaveLength(2)
    expect(container.textContent).toContain('11.2 g/day (range 9.3 to 14.3)')
    expect(container.querySelectorAll('figure table tbody tr')).toHaveLength(2)
    await expectAccessible(container)
  })

  it('shows the questions of a scenario first with a verdict word, the rest behind a disclosure', async () => {
    const { container } = mountVapor(RobustnessStrip, { props: { rows: () => robustness.rows, scenario: 'niacin-2g' } })
    const mine = container.querySelectorAll('ul[aria-label="Questions for this scenario"] li')
    expect(mine).toHaveLength(2)
    expect(mine[0].textContent).toContain('Niacin 2 g per day')
    expect(mine[0].textContent).toContain('robustly falls')
    expect(mine[0].querySelector('svg[role="img"]').getAttribute('aria-label')).toMatch(/Median −74%/)
    expect(container.querySelector('details > summary').textContent).toMatch(/All other questions \(\d+\)/)
    await expectAccessible(container)
  })

  it('shows the validation table as dots with words and the reason for every disagreement', async () => {
    const { container } = mountVapor(ValidationDots)
    expect(container.querySelector('summary').textContent).toBe('Validation: 28 of 41 checks pass')
    expect(container.querySelectorAll('.dash-dots .dash-dot')).toHaveLength(41)
    const mismatches = [...container.querySelectorAll('li.dash-valid')].filter((li) => li.textContent.startsWith('Documented disagreement'))
    expect(mismatches).toHaveLength(13)
    expect(mismatches.every((li) => li.querySelector('.dash-valid__why')?.textContent.length > 20)).toBe(true)
    await expectAccessible(container)
  })

  it('lists the largest changes with an arrow and a link to the entity page', async () => {
    const { container } = mountVapor(ChangeBars, { props: { items: () => [{ id: 'compound:glycine', label: 'Glycine', kind: 'compound', relative: 0.32 }, { id: 'reaction:bhmt-betaine-homocysteine', label: 'BHMT', kind: 'reaction', relative: -0.14 }] } })
    const rows = container.querySelectorAll('li')
    expect(rows[0].textContent).toContain('+32%')
    expect(rows[1].textContent).toContain('−14%')
    expect(within(rows[0]).getByRole('link', { name: 'Glycine' }).getAttribute('href')).toBe('#/kb/compound/glycine')
    await expectAccessible(container)
  })
})
