import { describe, expect, it } from 'vitest'
import { buildGraph } from '../../src/knowledge/graph.js'
import { MAP_NODE_LIMIT, neighbourhood, pickNodes, radialLayout, truncate } from '../../src/kb/neighbourhood.js'
import { valid } from '../fixtures/knowledge/helpers.js'

const graph = buildGraph(valid)

describe('neighbourhood', () => {
  it('returns null for an unknown entity', () => {
    expect(neighbourhood(graph, 'compound:nope')).toBeNull()
  })

  it('groups direct neighbours by relation label, then mentions', () => {
    const hood = neighbourhood(graph, 'compound:glycine')
    const labels = hood.groups.map((group) => group.label)
    expect(labels).toContain('Substrate of')
    expect(labels).toContain('Precursor of')
    expect(labels[labels.length - 1]).toBe('Mentions')
    const gnmtLabels = neighbourhood(graph, 'enzyme:gnmt').groups.map((group) => group.label)
    expect(gnmtLabels[gnmtLabels.length - 1]).toBe('Mentioned by')
    expect(hood.groups.find((group) => group.label === 'Precursor of').items[0]).toMatchObject({ id: 'compound:sarcosine', note: 'via methylation' })
  })

  it('counts each neighbour once and lists every neighbour in some group', () => {
    const hood = neighbourhood(graph, 'compound:glycine')
    const listed = new Set(hood.groups.flatMap((group) => group.items.map((item) => item.id)))
    expect(listed).toEqual(new Set(graph.neighbors('compound:glycine')))
    expect(hood.count).toBe(listed.size)
  })

  it('does not repeat an entity inside one group', () => {
    for (const group of neighbourhood(graph, 'enzyme:gnmt').groups) {
      expect(new Set(group.items.map((item) => item.id)).size).toBe(group.items.length)
    }
  })
})

describe('pickNodes', () => {
  const groups = [
    { label: 'A', items: [{ id: 'x:1', name: '1', type: 't' }, { id: 'x:2', name: '2', type: 't' }, { id: 'x:3', name: '3', type: 't' }] },
    { label: 'B', items: [{ id: 'x:2', name: '2', type: 't' }, { id: 'x:4', name: '4', type: 't' }] }
  ]

  it('takes round-robin across groups without repeating an entity', () => {
    expect(pickNodes(groups, 10).map((node) => `${node.id}@${node.label}`)).toEqual(['x:1@A', 'x:2@B', 'x:3@A', 'x:4@B'])
  })

  it('honours the limit and the default', () => {
    expect(pickNodes(groups, 2)).toHaveLength(2)
    const many = [{ label: 'A', items: Array.from({ length: 40 }, (_, index) => ({ id: `x:${index}`, name: `n${index}`, type: 't' })) }]
    expect(pickNodes(many)).toHaveLength(MAP_NODE_LIMIT)
    expect(pickNodes([])).toEqual([])
  })
})

describe('radialLayout', () => {
  it('puts the first node at the top and spaces the rest evenly on an ellipse', () => {
    const { center, points, width, height } = radialLayout(4)
    expect(points).toHaveLength(4)
    expect(points[0].x).toBeCloseTo(center.x, 0)
    expect(points[0].y).toBeLessThan(center.y)
    expect(points[2].y).toBeGreaterThan(center.y)
    for (const point of points) {
      expect(point.x).toBeGreaterThan(0)
      expect(point.x).toBeLessThan(width)
      expect(point.y).toBeGreaterThan(0)
      expect(point.y).toBeLessThan(height)
    }
  })

  it('puts labels outside the circle', () => {
    const { points } = radialLayout(4)
    expect(points.map((point) => point.anchor)).toEqual(['middle', 'start', 'middle', 'end'])
  })

  it('handles an empty neighbourhood', () => {
    expect(radialLayout(0).points).toEqual([])
  })
})

describe('truncate', () => {
  it('shortens long labels with an ellipsis and leaves short ones alone', () => {
    expect(truncate('short')).toBe('short')
    expect(truncate('Glycine N-methyltransferase', 12)).toBe('Glycine N-m…')
  })
})
