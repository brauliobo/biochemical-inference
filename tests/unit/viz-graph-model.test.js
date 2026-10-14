import { describe, expect, it } from 'vitest'
import { adjacency, adjacencyRows, describeGraph, filterGraph, measureNode, reach, stepAlong, wrapLabel } from '../../src/viz/graph-model.js'
import { layoutLayered } from '../../src/viz/layout/layered.js'
import { nearestInDirection } from '../../src/viz/nav.js'
import { causalSample } from '../../src/viz/samples/causal.js'

const sample = causalSample()

describe('labels', () => {
  it('wraps on words and ellipsises beyond three lines', () => {
    expect(wrapLabel('Acid suppression (PPI)', 14)).toEqual(['Acid', 'suppression', '(PPI)'])
    expect(wrapLabel('one two three four five six seven eight nine ten', 8)).toHaveLength(3)
    expect(wrapLabel('', 10)).toEqual([''])
  })

  it('sizes a node box to its label', () => {
    const short = measureNode('SAM')
    const long = measureNode('Phosphatidylcholine')
    expect(long.width).toBeGreaterThan(short.width)
    expect(measureNode('a b c d e f g h i j k l m n o p q r s t u v w x y z', { maxChars: 8 }).height).toBeGreaterThan(short.height)
  })
})

describe('filterGraph', () => {
  it('drops nodes by type with their edges, edges by sign, and hypothesis edges', () => {
    const noEnzymes = filterGraph(sample, { hiddenTypes: ['enzyme'] })
    expect(noEnzymes.nodes.some((node) => node.type === 'enzyme')).toBe(false)
    expect(noEnzymes.edges.every((edge) => !['gnmt', 'pemt'].includes(edge.from) && !['gnmt', 'pemt'].includes(edge.to))).toBe(true)
    const noDecrease = filterGraph(sample, { hiddenSigns: ['decrease'] })
    expect(noDecrease.edges.some((edge) => edge.sign === 'decrease')).toBe(false)
    const solid = filterGraph(sample, { hypothesis: 'hide' })
    expect(solid.edges.every((edge) => !edge.hypothesis)).toBe(true)
    expect(solid.edges.length).toBeLessThan(sample.edges.length)
    expect(filterGraph(sample).edges).toHaveLength(sample.edges.length)
  })
})

describe('reach', () => {
  const adj = adjacency(sample.nodes, sample.edges)

  it('collects everything downstream and upstream, with the edges used', () => {
    const down = reach(adj, 'gnmt', 'down')
    expect(down.nodes.has('belching')).toBe(true)
    expect(down.nodes.has('glycine-powder')).toBe(false)
    const up = reach(adj, 'gnmt', 'up')
    expect(up.nodes.has('glycine-powder')).toBe(true)
    expect(up.nodes.has('belching')).toBe(false)
    expect(down.edges.size).toBeGreaterThan(3)
  })

  it('terminates on a cycle', () => {
    const cycle = reach(adj, 'belching', 'down')
    expect(cycle.nodes.has('throat-burn')).toBe(true)
    expect(cycle.nodes.has('belching')).toBe(true)
  })
})

describe('keyboard traversal along edges', () => {
  const layout = layoutLayered({ nodes: sample.nodes.map((node) => ({ id: node.id, tier: node.tier, width: 120, height: 40 })), edges: sample.edges.map((edge) => ({ from: edge.from, to: edge.to })) }, { direction: 'LR' })
  const adj = adjacency(sample.nodes, sample.edges)
  const go = (current, key, direction = 'LR') => stepAlong({ layout, adj, current, key, direction })

  it('follows an edge forward and backward', () => {
    const forward = go('glycine-powder', 'ArrowRight')
    expect(forward).toBe('glycine')
    expect(go(forward, 'ArrowLeft')).toBe('glycine-powder')
    expect(go('belching', 'ArrowRight')).toBe('throat-burn')
  })

  it('stays put at a dead end and moves within a tier with the other axis', () => {
    expect(go('glycine-powder', 'ArrowLeft')).toBe('glycine-powder')
    const mate = go('glycine-powder', 'ArrowDown')
    const layer = (id) => layout.nodes.find((node) => node.id === id).layer
    expect(mate).not.toBe('glycine-powder')
    expect(layer(mate)).toBe(layer('glycine-powder'))
    expect(go(mate, 'ArrowUp')).toBe('glycine-powder')
  })

  it('swaps the axes for a top-to-bottom layout, jumps to the ends and ignores other keys', () => {
    const top = layoutLayered({ nodes: sample.nodes.map((node) => ({ id: node.id, tier: node.tier })), edges: sample.edges.map((edge) => ({ from: edge.from, to: edge.to })) })
    expect(stepAlong({ layout: top, adj, current: 'glycine-powder', key: 'ArrowDown', direction: 'TB' })).toBe('glycine')
    expect(stepAlong({ layout, adj, current: 'glycine', key: 'Home', direction: 'LR' })).toBe(layout.nodes.filter((node) => node.layer === 0).sort((a, b) => a.order - b.order)[0].id)
    expect(go('glycine', 'q')).toBeNull()
  })
})

describe('text alternative', () => {
  it('lists each node with what it leads to and comes from, in words', () => {
    const rows = adjacencyRows(sample)
    const gnmt = rows.find((row) => row.id === 'gnmt')
    expect(gnmt.leadsTo).toEqual([{ id: 'sam', label: 'SAM', sign: 'Decreases', edgeLabel: undefined }])
    expect(gnmt.comesFrom[0].label).toBe('Glycine')
    expect(rows.find((row) => row.id === 'belching').comesFrom.map((step) => step.sign)).toContain('Increases (hypothesis)')
  })

  it('describes the graph', () => {
    const text = describeGraph({ nodes: sample.nodes, edges: sample.edges })
    expect(text).toMatch(/^17 nodes and 21 links/)
    expect(text).toContain('hypotheses')
  })
})

describe('nearestInDirection', () => {
  const points = [{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 100, y: 5 }, { id: 'c', x: 50, y: 80 }, { id: 'd', x: -60, y: 0 }]
  it('picks the nearest point in the cone and stays when there is none', () => {
    expect(nearestInDirection(points, 'a', 'ArrowRight')).toBe('b')
    expect(nearestInDirection(points, 'a', 'ArrowDown')).toBe('c')
    expect(nearestInDirection(points, 'a', 'ArrowLeft')).toBe('d')
    expect(nearestInDirection(points, 'a', 'ArrowUp')).toBe('a')
    expect(nearestInDirection(points, 'a', 'x')).toBeNull()
  })
})
