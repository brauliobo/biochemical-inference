import { describe, expect, it } from 'vitest'
import { getEntity, graph, quantFor } from '../../src/knowledge/index.js'
import { buildEvidenceModel } from '../../src/kb/evidence.js'
import { claimGraph, claimQuantities, quantText, vizSign } from '../../src/kb/evidence-graph.js'
import { SIGN_IDS } from '../../src/viz/shapes.js'

const model = buildEvidenceModel(graph)

describe('claimGraph', () => {
  it('holds exactly the edges a claim asserts, with endpoints that exist and valid viz signs', () => {
    let withEdges = 0
    for (const claim of model.claims) {
      const result = claimGraph(graph, claim.id)
      expect(result.edges, claim.id).toHaveLength(claim.edges)
      const ids = new Set(result.nodes.map((node) => node.id))
      for (const edge of result.edges) {
        expect(ids.has(edge.from) && ids.has(edge.to), claim.id).toBe(true)
        expect(SIGN_IDS, claim.id).toContain(edge.sign)
        expect(typeof edge.hypothesis).toBe('boolean')
      }
      if (result.edges.length) withEdges += 1
    }
    expect(withEdges).toBeGreaterThan(20)
  })

  it('draws an edge as a hypothesis when the data flags it, and every edge of an unsupported claim is one', () => {
    const result = claimGraph(graph, 'claim:free-glycine-stimulates-gastrin')
    expect(result.edges.length).toBeGreaterThan(0)
    expect(result.edges.every((edge) => edge.hypothesis)).toBe(true)
    expect(result.rows[0]).toMatchObject({ hypothesis: true })
    expect(result.nodes.every((node) => typeof node.label === 'string' && node.type)).toBe(true)
  })

  it('returns an empty graph for a claim with no edges', () => {
    const none = model.claims.find((claim) => claim.edges === 0)
    expect(claimGraph(graph, none.id)).toMatchObject({ nodes: [], edges: [], rows: [] })
  })

  it('maps relations to signs', () => {
    expect(vizSign({ rel: 'increases' })).toBe('increase')
    expect(vizSign({ rel: 'causes' })).toBe('increase')
    expect(vizSign({ rel: 'decreases' })).toBe('decrease')
    expect(vizSign({ rel: 'mitigates' })).toBe('mitigate')
    expect(vizSign({ rel: 'aggravates' })).toBe('aggravate')
    expect(vizSign({ rel: 'cofactor-of', sign: '+' })).toBe('increase')
    expect(vizSign({ rel: 'cofactor-of', sign: '-' })).toBe('decrease')
    expect(vizSign({ rel: 'associated-with' })).toBe('neutral')
  })
})

describe('quantities of a claim', () => {
  const api = { quantFor, getEntity }

  it('formats numbers, ranges and approximations', () => {
    expect(quantText({ value: 3500, unit: 'mg/day' })).toBe('3500 mg/day')
    expect(quantText({ value: 0.141, unit: 'fraction' })).toBe('0.141')
    expect(quantText({ value: null, low: 3, high: 10, unit: 'g/day' })).toBe('3 to 10 g/day')
    expect(quantText({ value: 5, unit: 'g', approximate: true })).toBe('about 5 g')
    expect(quantText({ value: null, unit: 'mg' })).toBe('')
  })

  it('finds the limits and doses of the entries a claim is about, most authoritative first', () => {
    const claim = { ...model.claimById.get('claim:choline-ul-3-5g-iom-efsa'), graphIds: [] }
    const chips = claimQuantities(api, claim)
    expect(chips.length).toBeGreaterThan(0)
    expect(chips.length).toBeLessThanOrEqual(8)
    expect(chips.some((chip) => chip.kind === 'UL' && chip.subject === 'compound:choline' && chip.text === '3500 mg/day')).toBe(true)
    for (const chip of chips) {
      expect(chip.subjectName).toBeTruthy()
      expect(chip.text).toBeTruthy()
    }
  })

  it('returns nothing for a claim about entries that carry no quantity', () => {
    const claim = { associated: ['state:undermethylation'], graphIds: [] }
    expect(claimQuantities(api, claim)).toEqual([])
  })
})
