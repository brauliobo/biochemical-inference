import { fireEvent, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import MetabolicMap from '../../src/viz/MetabolicMap.vue'
import { methylationMap, methylationValues } from '../../src/viz/samples/methylation.js'
import { expectAccessible } from '../helpers/axe.js'
import { mountVapor } from '../helpers/mount-vapor.js'

const map = methylationMap()
const values = methylationValues()
const props = { id: 'map-test', title: 'Methionine and folate cycles', map, flux: values.flux, concentration: values.concentration, concUnit: 'uM', fluxUnit: 'umol/h' }
const nodes = (container) => [...container.querySelectorAll('.viz-mnode')]
const byName = (container, name) => nodes(container).find((node) => node.getAttribute('aria-label').startsWith(`${name},`))
const scaleOf = (container) => Number(container.querySelector('.viz-msvg > g').getAttribute('transform').match(/scale\(([\d.]+)\)/)[1])

describe('MetabolicMap', () => {
  it('draws compounds, reactions, enzymes and pools, with currency molecules hidden by default', async () => {
    const { container } = mountVapor(MetabolicMap, { props })
    expect(nodes(container)).toHaveLength(map.nodes.length - 4)
    expect(byName(container, 'ATP')).toBeUndefined()
    expect(container.querySelectorAll('.viz-mnode--compound')).toHaveLength(11)
    expect(container.querySelectorAll('.viz-mnode--reaction')).toHaveLength(6)
    expect(container.querySelectorAll('.viz-mnode--pool')).toHaveLength(1)
    expect(container.querySelectorAll('.viz-mnode--enzyme')).toHaveLength(6)
    expect(container.querySelectorAll('.viz-mgroup')).toHaveLength(2)
    expect(container.querySelector('figure > p').textContent).toContain('4 currency molecules')
    await expectAccessible(container)
  })

  it('shows the currency molecules with the toggle', async () => {
    const { container } = mountVapor(MetabolicMap, { props })
    const toggle = within(container).getByRole('button', { name: 'Currency molecules' })
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
    await fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    expect(byName(container, 'ATP')).toBeTruthy()
    expect(nodes(container)).toHaveLength(map.nodes.length)
  })

  it('encodes flux and concentration and explains them in a key', async () => {
    const { container } = mountVapor(MetabolicMap, { props })
    expect(container.querySelectorAll('g.viz-flux-3').length).toBeGreaterThan(0)
    expect(container.querySelectorAll('g.viz-flux-1').length).toBeGreaterThan(0)
    expect(byName(container, 'Glycine').getAttribute('class')).toContain('viz-bin-s6')
    expect(byName(container, 'Glycine').getAttribute('aria-label')).toContain('280 uM')
    expect(container.textContent).toContain('uM')
    expect(container.textContent).toContain('umol/h')
    expect(container.querySelectorAll('.viz-key__chip')).toHaveLength(6)
    await fireEvent.click(within(container).getByRole('button', { name: 'Show values' }))
    expect(container.textContent).toContain('6.2 umol/h')
  })

  it('selects a node, lights its reactions and dims the rest, and reports the selection', async () => {
    const chosen = []
    const { container } = mountVapor(MetabolicMap, { props: { ...props, onSelect: () => (node) => chosen.push(node) } })
    await fireEvent.click(byName(container, 'SAM'))
    expect(chosen).toEqual([{ id: 'sam', kind: 'compound', label: 'SAM' }])
    expect(byName(container, 'SAM').getAttribute('aria-pressed')).toBe('true')
    expect(byName(container, 'GNMT').getAttribute('class')).not.toContain('is-dim')
    expect(byName(container, 'MTR').getAttribute('class')).toContain('is-dim')
    expect(container.querySelector('.viz-readout').textContent).toContain('Methionine + ATP')
    await fireEvent.keyDown(container.querySelector('.viz-map'), { key: 'Escape' })
    expect(container.querySelectorAll('.viz-mnode.is-dim')).toHaveLength(0)
  })

  it('zooms with the buttons and the + - 0 keys, and pans with Shift and the arrow keys', async () => {
    const { container } = mountVapor(MetabolicMap, { props })
    const surface = container.querySelector('.viz-map')
    expect(scaleOf(container)).toBe(1)
    await fireEvent.click(within(container).getByRole('button', { name: 'Zoom in' }))
    expect(scaleOf(container)).toBeCloseTo(1.25)
    await fireEvent.click(within(container).getByRole('button', { name: 'Zoom out' }))
    expect(scaleOf(container)).toBeCloseTo(1)
    await fireEvent.keyDown(surface, { key: '+' })
    await fireEvent.keyDown(surface, { key: '+' })
    expect(scaleOf(container)).toBeCloseTo(1.5625)
    const before = container.querySelector('.viz-msvg > g').getAttribute('transform')
    await fireEvent.keyDown(surface, { key: 'ArrowRight', shiftKey: true })
    expect(container.querySelector('.viz-msvg > g').getAttribute('transform')).not.toBe(before)
    await fireEvent.keyDown(surface, { key: '0' })
    expect(container.querySelector('.viz-msvg > g').getAttribute('transform')).toBe('translate(0 0) scale(1)')
    for (let i = 0; i < 30; i += 1) await fireEvent.keyDown(surface, { key: '-' })
    expect(scaleOf(container)).toBe(0.5)
  })

  it('moves a cursor between nodes with the arrow keys and selects with Enter', async () => {
    const { container } = mountVapor(MetabolicMap, { props })
    const surface = container.querySelector('.viz-map')
    surface.focus()
    await fireEvent.focus(surface)
    const active = () => nodes(container).find((node) => node.id === surface.getAttribute('aria-activedescendant'))?.getAttribute('aria-label').split(',')[0]
    const start = active()
    expect(start).toBeTruthy()
    await fireEvent.keyDown(surface, { key: 'ArrowRight' })
    await fireEvent.keyDown(surface, { key: 'ArrowDown' })
    expect(active()).toBeTruthy()
    await fireEvent.keyDown(surface, { key: 'Enter' })
    expect(container.querySelectorAll('.viz-mnode[aria-pressed="true"]')).toHaveLength(1)
  })

  it('lists every reaction as an equation in the text alternative', () => {
    const { container } = mountVapor(MetabolicMap, { props })
    const table = container.querySelector('details table')
    const rows = [...table.querySelectorAll('tbody tr')].map((row) => [...row.children].map((cell) => cell.textContent))
    expect(rows).toHaveLength(6)
    expect(rows.find((row) => row[0] === 'MAT')).toEqual(['MAT', 'MAT1A / MAT2A', 'Methionine + ATP → SAM + PPi + Pi', '6.2 umol/h'])
    expect(rows.find((row) => row[0] === 'AHCY')[2]).toContain('⇌')
  })

  it('works with a layout that has no values and no groups', async () => {
    const small = { nodes: [{ id: 'a', kind: 'compound', label: 'A', x: 50, y: 50 }, { id: 'r', kind: 'reaction', label: 'R', x: 150, y: 50 }, { id: 'b', kind: 'compound', label: 'B', x: 250, y: 50 }], edges: [{ from: 'a', to: 'r' }, { from: 'r', to: 'b', stoich: 2 }] }
    const { container } = mountVapor(MetabolicMap, { props: { title: 'Tiny', map: small } })
    expect(nodes(container)).toHaveLength(3)
    expect(container.querySelector('.viz-stoich').textContent).toBe('2')
    expect(within(container).queryByRole('button', { name: 'Show values' })).toBeNull()
    await expectAccessible(container)
  })
})
