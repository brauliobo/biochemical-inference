import { fireEvent, screen, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import LayeredGraph from '../../src/viz/LayeredGraph.vue'
import { causalSample } from '../../src/viz/samples/causal.js'
import { expectAccessible } from '../helpers/axe.js'
import { mountVapor } from '../helpers/mount-vapor.js'

const sample = causalSample()
const props = { id: 'graph-test', title: 'From glycine to belching', nodes: sample.nodes, edges: sample.edges, tierNames: sample.tierNames }
const nodeEls = (container) => [...container.querySelectorAll('.viz-gnode')]
const nodeByName = (container, name) => nodeEls(container).find((node) => node.getAttribute('aria-label').startsWith(`${name},`))

describe('LayeredGraph', () => {
  it('draws every node as a button with a type shape and an evidence badge, and every edge with its sign', async () => {
    const { container } = mountVapor(LayeredGraph, { props })
    expect(nodeEls(container)).toHaveLength(17)
    expect(nodeByName(container, 'GNMT').getAttribute('aria-label')).toBe('GNMT, enzyme, evidence Established, 1 outgoing and 1 incoming links')
    expect(nodeByName(container, 'GNMT').getAttribute('role')).toBe('button')
    expect(nodeByName(container, 'Belching').querySelector('.viz-badge__text').textContent).toBe('C')
    expect(nodeByName(container, 'Under-methylation').querySelector('.viz-badge__text').textContent).toBe('P')
    expect(container.querySelectorAll('.viz-edge')).toHaveLength(21)
    expect(container.querySelectorAll('.viz-edge--hyp')).toHaveLength(10)
    for (const sign of ['increase', 'decrease', 'mitigate', 'aggravate', 'neutral']) expect(container.querySelectorAll(`g.viz-edge--${sign}`).length).toBeGreaterThan(0)
    expect(container.querySelectorAll('.viz-edge-end')).toHaveLength(21)
    expect(container.textContent).toContain('worsens?')
    expect(container.textContent).toContain('Intervention')
    await expectAccessible(container)
  })

  it('offers the adjacency list as a text alternative', () => {
    const { container } = mountVapor(LayeredGraph, { props })
    const list = container.querySelector('details')
    expect(list.textContent).toContain('GNMT')
    expect(list.textContent).toContain('Decreases SAM')
    expect(list.textContent).toContain('Comes from Glycine (increases)')
    expect(container.querySelector('figure > p').textContent).toContain('17 nodes and 21 links')
  })

  it('highlights what is upstream and downstream of a hovered node and dims the rest', async () => {
    const { container } = mountVapor(LayeredGraph, { props })
    await fireEvent.pointerEnter(nodeByName(container, 'GNMT'))
    expect(nodeByName(container, 'GNMT').getAttribute('class')).toContain('is-focus')
    expect(nodeByName(container, 'Glycine powder 10 g').getAttribute('class')).toContain('is-up')
    expect(nodeByName(container, 'Belching').getAttribute('class')).toContain('is-down')
    expect(nodeByName(container, 'Acid suppression (PPI)').getAttribute('class')).toContain('is-dim')
    expect(container.querySelector('.viz-readout').textContent).toContain('GNMT')
    await fireEvent.pointerLeave(nodeByName(container, 'GNMT'))
    expect(container.querySelectorAll('.viz-gnode.is-dim')).toHaveLength(0)
  })

  it('selects a node by click and reports it', async () => {
    const chosen = []
    const { container } = mountVapor(LayeredGraph, { props: { ...props, onSelect: () => (node) => chosen.push(node.id) } })
    await fireEvent.click(nodeByName(container, 'SAM'))
    expect(chosen).toEqual(['sam'])
    expect(nodeByName(container, 'SAM').getAttribute('aria-pressed')).toBe('true')
  })

  it('moves between nodes along the edges with the arrow keys, and selects with Enter', async () => {
    const focused = []
    const chosen = []
    const { container } = mountVapor(LayeredGraph, { props: { ...props, onFocusNode: () => (node) => focused.push(node.id), onSelect: () => (node) => chosen.push(node.id) } })
    const graph = container.querySelector('.viz-graph')
    graph.focus()
    await fireEvent.focus(graph)
    const active = () => nodeEls(container).find((node) => node.id === graph.getAttribute('aria-activedescendant'))?.getAttribute('aria-label').split(',')[0]
    const first = active()
    expect(first).toBeTruthy()
    // left to right: Right follows an edge forward
    await fireEvent.keyDown(graph, { key: 'ArrowRight' })
    const second = active()
    expect(second).not.toBe(first)
    await fireEvent.keyDown(graph, { key: 'ArrowRight' })
    const third = active()
    expect(third).not.toBe(second)
    await fireEvent.keyDown(graph, { key: 'ArrowLeft' })
    expect(active()).not.toBe(third)
    expect(focused.length).toBe(3)
    await fireEvent.keyDown(graph, { key: 'Enter' })
    expect(chosen).toHaveLength(1)
    await fireEvent.keyDown(graph, { key: 'Escape' })
    expect(container.querySelectorAll('.viz-gnode[aria-pressed="true"]')).toHaveLength(0)
    await fireEvent.keyDown(graph, { key: 'End' })
    expect(active()).toBeTruthy()
  })

  it('lists the neighbours of the focused node as buttons that move the cursor', async () => {
    const { container } = mountVapor(LayeredGraph, { props })
    await fireEvent.pointerEnter(nodeByName(container, 'SAM'))
    const leads = within(container).getAllByRole('button', { name: /^Phosphatidylcholine|^PEMT|^Under-methylation/ })
    expect(leads.length).toBeGreaterThan(0)
    expect(container.textContent).toContain('Comes from:')
  })

  it('filters by kind of node, by sign and by hypothesis', async () => {
    const { container } = mountVapor(LayeredGraph, { props })
    await fireEvent.click(within(container).getByRole('button', { name: 'enzyme' }))
    expect(nodeEls(container)).toHaveLength(15)
    expect(nodeByName(container, 'GNMT')).toBeUndefined()
    expect(within(container).getByRole('button', { name: 'enzyme' }).getAttribute('aria-pressed')).toBe('false')
    await fireEvent.click(within(container).getByRole('button', { name: /Hypothesis links/ }))
    expect(container.querySelectorAll('.viz-edge--hyp')).toHaveLength(0)
    await fireEvent.click(within(container).getByRole('button', { name: /^Decreases/ }))
    expect(container.querySelectorAll('g.viz-edge--decrease')).toHaveLength(0)
    expect(container.querySelector('figure > p').textContent).toContain('2 nodes are hidden by the filters')
    await expectAccessible(container)
  })

  it('can lay out top to bottom, fit to width, and route orthogonally', async () => {
    const { container } = mountVapor(LayeredGraph, { props: { ...props, direction: 'TB', routing: 'orthogonal' } })
    expect(container.querySelector('.viz-edge').getAttribute('d')).toContain('L')
    const fit = within(container).getByRole('button', { name: 'Fit to width' })
    await fireEvent.click(fit)
    expect(fit.getAttribute('aria-pressed')).toBe('true')
    expect(container.querySelector('svg.viz-gsvg--fit')).toBeTruthy()
  })

  it('shows the evidence grades that are present in a key', () => {
    mountVapor(LayeredGraph, { props })
    expect(screen.getByText('Established')).toBeTruthy()
    expect(screen.getByText('Conversation only')).toBeTruthy()
  })
})
