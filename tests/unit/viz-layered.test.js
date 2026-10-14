import { describe, expect, it } from 'vitest'
import { layoutLayered } from '../../src/viz/layout/layered.js'
import { causalSample } from '../../src/viz/samples/causal.js'

const size = { nodeWidth: 100, nodeHeight: 40 }
const node = (id, extra = {}) => ({ id, ...extra })
const edge = (from, to) => ({ from, to })

function overlaps(a, b, gap = 0) {
  return a.x < b.x + b.width + gap && b.x < a.x + a.width + gap && a.y < b.y + b.height + gap && b.y < a.y + a.height + gap
}

function segmentHitsRect(p, q, rect) {
  // sample along the segment (paths are made of straight runs and smooth curves)
  for (let t = 0; t <= 1; t += 0.05) {
    const x = p.x + (q.x - p.x) * t
    const y = p.y + (q.y - p.y) * t
    if (x > rect.x + 1 && x < rect.x + rect.width - 1 && y > rect.y + 1 && y < rect.y + rect.height - 1) return true
  }
  return false
}

describe('layoutLayered', () => {
  it('lays a chain out one layer per step, top to bottom', () => {
    const out = layoutLayered({ nodes: [node('a'), node('b'), node('c')], edges: [edge('a', 'b'), edge('b', 'c')] }, size)
    const byId = Object.fromEntries(out.nodes.map((entry) => [entry.id, entry]))
    expect([byId.a.layer, byId.b.layer, byId.c.layer]).toEqual([0, 1, 2])
    expect(byId.a.y).toBeLessThan(byId.b.y)
    expect(byId.b.y).toBeLessThan(byId.c.y)
    expect(out.edges.every((entry) => !entry.reversed && !entry.flat)).toBe(true)
  })

  it('goes left to right when asked', () => {
    const out = layoutLayered({ nodes: [node('a'), node('b')], edges: [edge('a', 'b')] }, { ...size, direction: 'LR' })
    const [a, b] = out.nodes
    expect(a.x + a.width).toBeLessThan(b.x)
    expect(out.edges[0].endAngle).toBeCloseTo(0, 1)
  })

  it('respects tiers: a node on a lower tier is never placed after one on a higher tier', () => {
    const nodes = [node('drug', { tier: 0 }), node('enzyme', { tier: 1 }), node('state', { tier: 2 }), node('outcome', { tier: 3 }), node('x', { tier: 1 }), node('y', { tier: 3 })]
    const edges = [edge('drug', 'enzyme'), edge('enzyme', 'state'), edge('state', 'outcome'), edge('drug', 'x'), edge('x', 'y'), edge('outcome', 'enzyme')]
    const out = layoutLayered({ nodes, edges }, size)
    const layer = Object.fromEntries(out.nodes.map((entry) => [entry.id, entry.layer]))
    expect(layer.drug).toBeLessThan(layer.enzyme)
    expect(layer.enzyme).toBe(layer.x)
    expect(layer.enzyme).toBeLessThan(layer.state)
    expect(layer.state).toBeLessThan(layer.outcome)
    expect(layer.outcome).toBe(layer.y)
    expect(out.edges.find((entry) => entry.from === 'outcome').reversed).toBe(true)
  })

  it('accepts named tiers in the order given', () => {
    const out = layoutLayered({ nodes: [node('b', { tier: 'late' }), node('a', { tier: 'early' })], edges: [] }, { ...size, tiers: ['early', 'late'] })
    const layer = Object.fromEntries(out.nodes.map((entry) => [entry.id, entry.layer]))
    expect(layer.a).toBeLessThan(layer.b)
  })

  it('breaks cycles by reversing a back-edge and still layers every node', () => {
    const out = layoutLayered({ nodes: [node('a'), node('b'), node('c')], edges: [edge('a', 'b'), edge('b', 'c'), edge('c', 'a')] }, size)
    expect(out.nodes.map((entry) => entry.layer).sort()).toEqual([0, 1, 2])
    expect(out.edges.filter((entry) => entry.reversed)).toHaveLength(1)
    const back = out.edges.find((entry) => entry.reversed)
    // The path still runs from the original source to the original target.
    const source = out.nodes.find((entry) => entry.id === back.from)
    expect(Math.abs(back.start.y - (source.y + source.height / 2))).toBeLessThanOrEqual(source.height / 2 + 1)
  })

  it('draws same-layer edges as arcs and self loops as small loops', () => {
    const out = layoutLayered({ nodes: [node('a', { tier: 0 }), node('b', { tier: 0 }), node('c', { tier: 1 })], edges: [edge('a', 'b'), edge('a', 'c'), edge('c', 'c')] }, size)
    expect(out.edges[0].flat).toBe(true)
    expect(out.edges[2].selfLoop).toBe(true)
    expect(out.edges.every((entry) => entry.d.startsWith('M'))).toBe(true)
  })

  it('never overlaps two nodes, and keeps the node gap inside a layer', () => {
    const out = layoutLayered(causalSample(), { nodeWidth: 130, nodeHeight: 40, nodeGap: 20 })
    for (let i = 0; i < out.nodes.length; i += 1) {
      for (let j = i + 1; j < out.nodes.length; j += 1) {
        expect(overlaps(out.nodes[i], out.nodes[j]), `${out.nodes[i].id} / ${out.nodes[j].id}`).toBe(false)
        if (out.nodes[i].layer === out.nodes[j].layer) expect(overlaps(out.nodes[i], out.nodes[j], 19), `${out.nodes[i].id} / ${out.nodes[j].id} gap`).toBe(false)
      }
    }
    expect(out.nodes.every((entry) => entry.x >= 0 && entry.y >= 0)).toBe(true)
  })

  it('does not route edges through unrelated nodes', () => {
    const out = layoutLayered(causalSample(), { nodeWidth: 130, nodeHeight: 40 })
    const byId = new Map(out.nodes.map((entry) => [entry.id, entry]))
    for (const route of out.edges) {
      if (route.flat || route.selfLoop) continue
      for (let i = 0; i + 1 < route.points.length; i += 1) {
        for (const other of out.nodes) {
          if (other.id === route.from || other.id === route.to) continue
          expect(segmentHitsRect(route.points[i], route.points[i + 1], other), `${route.from}>${route.to} crosses ${other.id}`).toBe(false)
        }
      }
      expect(byId.has(route.from)).toBe(true)
    }
  })

  it('removes crossings that a naive order has', () => {
    // a1-b2, a2-b1 cross in input order; the layout swaps one layer.
    const out = layoutLayered({ nodes: [node('a1', { tier: 0 }), node('a2', { tier: 0 }), node('b1', { tier: 1 }), node('b2', { tier: 1 })], edges: [edge('a1', 'b2'), edge('a2', 'b1')] }, size)
    expect(out.crossings).toBe(0)
    const x = Object.fromEntries(out.nodes.map((entry) => [entry.id, entry.cx]))
    expect((x.a1 - x.a2) * (x.b2 - x.b1)).toBeGreaterThan(0)
  })

  it('keeps a long edge out of the way with dummy points through the middle layers', () => {
    const out = layoutLayered({ nodes: [node('a', { tier: 0 }), node('b', { tier: 1 }), node('c', { tier: 2 }), node('d', { tier: 3 })], edges: [edge('a', 'b'), edge('b', 'c'), edge('c', 'd'), edge('a', 'd')] }, size)
    const long = out.edges[3]
    expect(long.points.length).toBeGreaterThan(2)
    const b = out.nodes.find((entry) => entry.id === 'b')
    const c = out.nodes.find((entry) => entry.id === 'c')
    expect(Math.abs(long.points[2].x - b.cx)).toBeGreaterThan(b.width / 2)
    expect(Math.abs(long.points[4].x - c.cx)).toBeGreaterThan(c.width / 2)
  })

  it('is deterministic', () => {
    const first = layoutLayered(causalSample(), { nodeWidth: 130 })
    const second = layoutLayered(causalSample(), { nodeWidth: 130 })
    expect(JSON.stringify(second)).toBe(JSON.stringify(first))
  })

  it('routes orthogonal paths with rounded corners', () => {
    const out = layoutLayered(causalSample(), { nodeWidth: 130, routing: 'orthogonal' })
    expect(out.edges.some((entry) => entry.d.includes('Q'))).toBe(true)
  })

  it('ignores edges to unknown nodes and handles an empty graph', () => {
    expect(layoutLayered({ nodes: [], edges: [] }).nodes).toEqual([])
    const out = layoutLayered({ nodes: [node('a')], edges: [edge('a', 'zzz')] })
    expect(out.edges).toEqual([])
    expect(out.nodes).toHaveLength(1)
  })
})
