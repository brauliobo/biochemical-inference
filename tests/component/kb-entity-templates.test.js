import { fireEvent, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import KbEntityView from '../../src/views/kb/KbEntityView.vue'
import { graph } from '../../src/knowledge/index.js'
import { reactionsOfCompound } from '../../src/kb/entity-model.js'
import { curvesFor, loadParameters } from '../../src/kb/params.js'
import { entityPath } from '../../src/kb/paths.js'
import { doseRows, limitRows } from '../../src/kb/quantities.js'
import { navigate } from '../../src/router.js'
import { expectAccessible } from '../helpers/axe.js'
import { mountVapor } from '../helpers/mount-vapor.js'

// One visual template per kind of entity (src/views/kb/templates). Each is mounted through the dispatcher, once the maps
// and kinetic parameters it loads lazily have arrived, and checked for its visuals, its text equivalents and for
// hiding what it has no data for.
beforeEach(() => {
  window.scrollTo = () => {}
})

async function open(id) {
  navigate(entityPath(id))
  const view = mountVapor(KbEntityView)
  const name = graph.get(id).name
  await waitFor(() => expect(view.container.querySelector('h1')?.textContent).toBe(name), { timeout: 20000 })
  await waitFor(() => expect(view.container.querySelector('[data-loading]')).toBeNull(), { timeout: 20000 })
  return view
}

const visuals = (container) => [...new Set([...container.querySelectorAll('[data-visual]')].map((node) => node.getAttribute('data-visual')))]
const panels = (container) => [...container.querySelectorAll('section.panel')]
const headingsOf = (container) => panels(container).map((panel) => panel.querySelector('h2, h3')?.textContent)
const withoutVisual = (type, test) => graph.byType.get(type).find((entity) => test(entity))

// A panel must hold something besides its heading: an empty chart frame is a bug.
function expectNoEmptyPanels(container) {
  for (const panel of panels(container)) {
    const body = [...panel.children].filter((child) => child.tagName !== 'HEADER')
    expect(body.length, `${panel.querySelector('h2, h3')?.textContent} is empty`).toBeGreaterThan(0)
  }
}

describe('every template keeps the header and folds the prose away', () => {
  it.each(['compound:glycine', 'enzyme:gnmt', 'reaction:gnmt-glycine-methylation', 'pathway:methionine-cycle', 'state:undermethylation', 'disease:lpr', 'intervention:glycine-powder'])('%s', async (id) => {
    const { container } = await open(id)
    const entity = graph.get(id)
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(container.querySelector('.lede').textContent).toBe(entity.summary)
    expect(container.textContent).toContain('Evidence: ')
    for (const alias of (entity.aliases ?? []).slice(0, 3)) expect(container.textContent).toContain(alias)
    const drawer = container.querySelector('details.notes-drawer')
    expect(drawer, 'Notes & sources drawer').toBeTruthy()
    expect(drawer.open).toBe(false)
    expect(drawer.querySelector('summary').textContent).toContain('Notes & sources')
    // no prose outside the drawer except the lede and short panel ledes
    expect([...container.querySelectorAll('.prose')].filter((node) => !drawer.contains(node))).toHaveLength(0)
    expectNoEmptyPanels(container)
  })
})

describe('compound template', () => {
  it('lights up the reactions of glycine on the metabolic map and tabulates them', async () => {
    const { container } = await open('compound:glycine')
    expect(visuals(container)).toEqual(expect.arrayContaining(['metabolic-map', 'causal-graph', 'reaction-table', 'quantity-chips']))
    const map = container.querySelector('[data-visual="metabolic-map"]')
    expect(map.querySelectorAll('.viz-mnode--reaction').length).toBeGreaterThan(2)
    expect(map.querySelector('.viz-mnode.is-selected').getAttribute('aria-label')).toMatch(/^Glycine,/)
    const table = within(container).getByRole('table', { name: /Reactions that consume or produce/ })
    expect(within(table).getAllByRole('row').length - 1).toBe(reactionsOfCompound('compound:glycine').length)
    expect(within(table).getAllByText('Consumed').length).toBeGreaterThan(0)
    expect(within(table).getAllByText('Produced').length).toBeGreaterThan(0)
    await expectAccessible(container)
  })

  it('compares the IOM and EFSA choline limits and says plainly that EFSA set no upper level', async () => {
    const { container } = await open('compound:choline')
    const bars = container.querySelector('[data-visual="range-bar"]')
    expect(bars).toBeTruthy()
    expect(bars.textContent).toContain('IOM 1998, men 19+')
    expect(bars.textContent).toContain('EFSA 2016, adults')
    expect(bars.textContent).toContain('No upper limit established')
    expect(limitRows('compound:choline').rows.map((row) => row.label)).toEqual(['IOM 1998, men 19+', 'IOM 1998, women 19+', 'EFSA 2016, adults'])
    await expectAccessible(container)
  })

  it('opens a key number to its provenance', async () => {
    const { container } = await open('compound:glycine')
    const chip = [...container.querySelectorAll('details.provenance')].find((details) => details.textContent.includes('Molar mass'))
    expect(chip).toBeTruthy()
    expect(chip.open).toBe(false)
    await fireEvent.click(chip.querySelector('summary'))
    chip.open = true
    expect(chip.querySelector('.provenance__body').textContent).toMatch(/Computed from other values|Basis/)
  })

  it('hides every chart a compound has no data for', async () => {
    const bare = withoutVisual('compound', (entity) => !limitRows(entity.id) && !reactionsOfCompound(entity.id).length)
    expect(bare, 'a compound with no limits and no reactions').toBeTruthy()
    const { container } = await open(bare.id)
    expect(visuals(container)).not.toContain('range-bar')
    expect(visuals(container)).not.toContain('reaction-table')
    expect(headingsOf(container)).not.toContain('Reactions')
    expectNoEmptyPanels(container)
  })
})

describe('enzyme template', () => {
  it('shows the reactions as equation cards, the pathway position and a live Michaelis-Menten curve', async () => {
    const { container } = await open('enzyme:gnmt')
    expect(visuals(container)).toEqual(expect.arrayContaining(['reaction-cards', 'metabolic-map', 'mm-curve', 'causal-graph']))
    const cards = container.querySelector('[data-visual="reaction-cards"]')
    expect(within(cards).getByRole('group', { name: /^Reaction: / })).toBeTruthy()
    const explorer = container.querySelector('[data-testid="mm-explorer"]')
    expect(explorer.textContent).toContain('Illustrative model')
    const sentence = () => explorer.querySelector('p[role="status"]').textContent
    const before = sentence()
    await fireEvent.update(explorer.querySelector('#mm-substrate'), '400')
    await waitFor(() => expect(sentence()).not.toBe(before))
    expect(sentence()).toMatch(/% of Vmax/)
    // the constants open to their provenance, with the source article linked
    const km = [...explorer.querySelectorAll('details.provenance')].find((details) => details.textContent.includes('Km ('))
    expect(km.querySelector('.provenance__body').textContent).toMatch(/Range in the literature/)
    expect(km.querySelector('a[href^="#/kb/article/"]')).toBeTruthy()
    await expectAccessible(container)
  })

  it('draws no curve for an enzyme that has no kinetic constants', async () => {
    const sets = await loadParameters()
    const bare = graph.byType.get('enzyme').find((entity) => !curvesFor(sets, { enzymeIds: [entity.id], reactionIds: graph.links(entity.id).filter((link) => link.rel === 'catalyzes').map((link) => link.other) }).length)
    expect(bare, 'an enzyme without parameters').toBeTruthy()
    const { container } = await open(bare.id)
    expect(visuals(container)).not.toContain('mm-curve')
    expect(container.querySelector('[data-testid="mm-explorer"]')).toBeNull()
    expectNoEmptyPanels(container)
  })

  it('offers each substrate of a multi-substrate enzyme in a select', async () => {
    const { container } = await open('enzyme:bhmt')
    const select = container.querySelector('#mm-curve')
    expect(select).toBeTruthy()
    expect(select.options.length).toBeGreaterThan(1)
  })
})

describe('reaction template', () => {
  it('draws the equation graphic with enzyme, compartment, identifiers and a balance verdict', async () => {
    const { container } = await open('reaction:gnmt-glycine-methylation')
    const equation = container.querySelector('[data-testid="reaction-equation"]')
    const graphic = within(equation).getByRole('group', { name: /^Reaction: / })
    expect(within(graphic).getByRole('link', { name: 'GNMT' }).getAttribute('href')).toBe('#/kb/enzyme/gnmt')
    expect(graphic.textContent).toContain('cytosol')
    expect(within(equation).getByText(/Balanced: atoms, hydrogens and charge/)).toBeTruthy()
    expect(within(equation).getAllByRole('link', { name: /2\.1\.1\.20/ })).toHaveLength(1)
    expect(visuals(container)).toEqual(expect.arrayContaining(['equation', 'balance', 'metabolic-map', 'mm-curve']))
    await expectAccessible(container)
  })

  it('says when balance cannot be checked rather than claiming it', async () => {
    const unknown = graph.byType.get('reaction').find((entity) => entity.reaction.reactants.some((part) => !graph.get(part.id)?.facts?.formula))
    if (!unknown) return
    const { container } = await open(unknown.id)
    expect(container.querySelector('[data-visual="balance"]').textContent).toMatch(/not checked/i)
  })
})

describe('pathway template', () => {
  it('shows the member reactions on the map and in a table', async () => {
    const { container } = await open('pathway:methionine-cycle')
    expect(visuals(container)).toEqual(expect.arrayContaining(['metabolic-map', 'reaction-table']))
    const table = within(container).getByRole('table', { name: 'Reactions in this pathway' })
    expect(within(table).getAllByRole('row').length).toBeGreaterThan(3)
    await expectAccessible(container)
  })

  it('falls back to a small reaction network when no layout places the pathway', async () => {
    const unplaced = graph.byType.get('pathway').find((entity) => graph.links(entity.id).some((link) => link.rel === 'has-part' && graph.get(link.other).type === 'reaction'))
    const { container } = await open(unplaced.id)
    expect(visuals(container).some((kind) => ['metabolic-map', 'reaction-network'].includes(kind))).toBe(true)
  })
})

describe('state, disease, outcome and system template', () => {
  it('draws what leads to under-methylation and what it leads to, with helpers and worseners highlighted', async () => {
    const { container } = await open('state:undermethylation')
    expect(visuals(container)).toEqual(expect.arrayContaining(['causal-graph', 'helps-worsens', 'effect-table']))
    const helps = within(container.querySelector('[data-testid="helps-worsens"]'))
    expect(helps.getByRole('list', { name: 'Mitigated by' }).querySelectorAll('li').length).toBeGreaterThan(2)
    expect(helps.getByRole('list', { name: 'Aggravated by' })).toBeTruthy()
    const graphBox = container.querySelector('[data-testid="causal-mini"]')
    expect(graphBox.querySelectorAll('.viz-gnode').length).toBeGreaterThan(10)
    expect(graphBox.querySelectorAll('.viz-edge--hyp').length).toBeGreaterThan(0)
    await expectAccessible(container)
  })

  it('shows reference ranges of what measures the state', async () => {
    const { container } = await open('state:undermethylation')
    expect(container.querySelector('[data-visual="quantity-chips"]')).toBeTruthy()
  })

  it('opens a disease with its causal graph', async () => {
    const { container } = await open('disease:lpr')
    expect(visuals(container)).toContain('causal-graph')
    await expectAccessible(container)
  })
})

describe('intervention template', () => {
  it('shows usual doses against limits, signed effects as a table and the cautions as chips', async () => {
    const { container } = await open('intervention:glycine-powder')
    expect(visuals(container)).toEqual(expect.arrayContaining(['range-bar', 'effect-table', 'causal-graph', 'cautions']))
    const effects = within(container.querySelector('[data-testid="effects"]'))
    expect(effects.getByRole('table', { name: 'Signed effects of this intervention' })).toBeTruthy()
    expect(effects.getAllByText('Hypothesis').length).toBeGreaterThan(0)
    expect(container.querySelector('[data-testid="dose-bars"]').textContent).toContain('Upper limit recorded for this product')
    await expectAccessible(container)
  })

  it('expresses the upper limit of choline in terms of the bitartrate salt', async () => {
    const rows = doseRows('intervention:choline-bitartrate')
    const ul = rows.rows.find((row) => row.markers.some((marker) => marker.kind === 'ul'))
    expect(ul.markers[0].value).toBeCloseTo(3500 / 0.411, -1)
    expect(rows.notes.join(' ')).toMatch(/41\.1 %/)
  })

  it('draws no dose chart for an intervention without dose data', async () => {
    const bare = withoutVisual('intervention', (entity) => !doseRows(entity.id))
    const { container } = await open(bare.id)
    expect(visuals(container)).not.toContain('range-bar')
    expectNoEmptyPanels(container)
  })
})
