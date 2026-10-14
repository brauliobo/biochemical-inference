import { describe, expect, it } from 'vitest'
import { LAYOUT_IDS, loadLayout } from '../../src/viz/layouts/index.js'
import { buildMap, connectedTo } from '../../src/viz/metabolic-model.js'
import { contextAround, fitBox, loadAllLayouts, neighbourhoodIn, participantsOf, pathwayIn, reactionsOfCompound, shortLabel, spread, toMetabolicMap } from '../../src/kb/layout-map.js'
import { graph } from '../../src/knowledge/index.js'

const layouts = await loadAllLayouts()
const core = layouts.find((layout) => layout.id === 'core-methylation')

describe('layout to metabolic map', () => {
  it('converts every shipped layout into a map the renderer accepts, with all its edges', () => {
    expect(layouts).toHaveLength(LAYOUT_IDS.length)
    for (const layout of layouts) {
      const map = toMetabolicMap(layout, { currency: false })
      expect(map.nodes.length, layout.id).toBe(layout.nodes.length)
      expect(map.edges.length, layout.id).toBe(layout.edges.length)
      expect(map.viewBox).toEqual([0, 0, layout.viewBox.width, layout.viewBox.height])
      const built = buildMap({ map })
      expect(built.edges.length, layout.id).toBe(layout.edges.length)
    }
  })

  it('carries stoichiometry, reversibility and group labels', () => {
    const map = toMetabolicMap(core, { currency: false })
    const reversible = map.nodes.find((node) => node.id === 'reaction:ahcy-sah-hydrolysis')
    expect(reversible.reversible).toBe(true)
    expect(map.nodes.find((node) => node.id === 'compound:sam').group).toBe('Methionine cycle')
    expect(map.edges.some((edge) => edge.stoich === 2)).toBe(true)
  })

  it('adds the pooled currency molecules as hidden nodes tied to their reaction', () => {
    const map = toMetabolicMap(core, { labelOf: (id) => shortLabel(graph.get(id).name, id) })
    const currency = map.nodes.filter((node) => node.currency)
    expect(currency.length).toBeGreaterThan(50)
    expect(buildMap({ map }).nodes.filter((node) => node.currency)).toHaveLength(0)
    expect(buildMap({ map, showCurrency: true }).nodes.filter((node) => node.currency)).toHaveLength(currency.length)
    const atp = currency.filter((node) => node.label === 'ATP')[0]
    expect(map.edges.some((edge) => edge.from === atp.id || edge.to === atp.id)).toBe(true)
  })

  it('writes small molecules as formulas and long names short', () => {
    expect(shortLabel('Hydron (proton)', 'compound:proton')).toBe('H+')
    expect(shortLabel('S-adenosylmethionine (SAM, SAMe)')).toBe('SAM')
    expect(shortLabel('A very long compound name that will not fit')).toMatch(/\.$/)
  })
})

describe('neighbourhoods', () => {
  it('finds the reactions and neighbours of a compound in the best layout', () => {
    const found = neighbourhoodIn(layouts, { id: 'compound:glycine' })
    expect(found.layout.id).toBe('core-methylation')
    expect(found.include.has('compound:glycine')).toBe(true)
    expect([...reactionsOfCompound(found.layout, 'compound:glycine')].every((id) => found.include.has(id))).toBe(true)
    expect(found.include.size).toBeLessThan(found.layout.nodes.length / 3)
    expect(found.spread).toBeLessThan(0.6)
  })

  it('gives a reaction its pathway context without dragging in distant participants', () => {
    const own = neighbourhoodIn(layouts, { id: 'reaction:gnmt-glycine-methylation' })
    const context = neighbourhoodIn(layouts, { id: 'reaction:gnmt-glycine-methylation', radius: 170 })
    expect(own.include.size).toBe(5)
    expect(context.include.size).toBeGreaterThan(own.include.size)
    expect(context.include.size).toBeLessThan(40)
    const seeds = participantsOf(core, ['reaction:gnmt-glycine-methylation'])
    expect(contextAround(core, seeds, 0).size).toBeGreaterThanOrEqual(seeds.size)
  })

  it('crops a pathway to its member reactions and says no when it is not placed', () => {
    const members = graph.links('pathway:methionine-cycle').filter((link) => link.rel === 'has-part' && graph.get(link.other).type === 'reaction').map((link) => link.other)
    const found = pathwayIn(layouts, members)
    expect(found.include.size).toBeGreaterThan(8)
    expect(pathwayIn(layouts, ['reaction:not-there', 'reaction:neither'])).toBeNull()
    expect(neighbourhoodIn(layouts, { id: 'compound:not-placed-anywhere' })).toBeNull()
  })

  it('never makes a map smaller than a readable minimum, so a few nodes are not blown up', () => {
    const [x, y, width, height] = fitBox([{ id: 'a', kind: 'compound', x: 100, y: 100, label: 'A' }])
    expect(width).toBeGreaterThanOrEqual(760)
    expect(height).toBeGreaterThanOrEqual(380)
    expect(x + width / 2).toBeCloseTo(100, 0)
    expect(y + height / 2).toBeCloseTo(100, 0)
    expect(spread(core, new Set(['compound:sam']))).toBe(0)
  })

  it('keeps every part of a map connected to its own nodes (no edge to a missing node)', async () => {
    const layout = await loadLayout('gastric-acid')
    const found = neighbourhoodIn([layout], { id: 'compound:carbon-dioxide' })
    const map = toMetabolicMap(layout, { include: found.include, currency: false })
    const ids = new Set(map.nodes.map((node) => node.id))
    expect(map.edges.every((edge) => ids.has(edge.from) && ids.has(edge.to))).toBe(true)
    expect(connectedTo(map, 'compound:carbon-dioxide').nodes.size).toBeGreaterThan(1)
  })
})
