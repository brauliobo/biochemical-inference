// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { entityIds, layoutToMap, linkRows, reactionIds, slugLabel } from '../../src/components/dash-gut/layout-map.js'
import { buildMap, reactionEquations } from '../../src/viz/metabolic-model.js'
import { LAYOUT_IDS, loadLayout } from '../../src/viz/layouts/index.js'

describe('layoutToMap (hand-laid layout -> MetabolicMap input)', () => {
  for (const id of LAYOUT_IDS.filter((item) => item !== 'core-methylation')) {
    it(`${id}: nodes keep their positions, edges point at placed nodes, MetabolicMap can build it`, async () => {
      const layout = await loadLayout(id)
      const map = layoutToMap(layout)
      expect(map.viewBox).toEqual([0, 0, layout.viewBox.width, layout.viewBox.height])
      const placed = new Map(map.nodes.map((node) => [node.id, node]))
      expect(map.nodes.filter((node) => !node.currency)).toHaveLength(layout.nodes.length)
      for (const source of layout.nodes) expect(placed.get(source.id)).toMatchObject({ x: source.x, y: source.y })
      for (const edge of map.edges) {
        expect(placed.has(edge.from), edge.from).toBe(true)
        expect(placed.has(edge.to), edge.to).toBe(true)
      }
      for (const node of map.nodes) expect(['compound', 'reaction', 'enzyme', 'pool']).toContain(node.kind)
      const built = buildMap({ map })
      expect(built.nodes.length).toBe(map.nodes.filter((node) => !node.currency).length)
      expect(built.hiddenCount).toBe(map.nodes.filter((node) => node.currency).length)
      const equations = reactionEquations({ map })
      expect(equations).toHaveLength(reactionIds(layout).length)
      // the text alternative names every participant, pooled ones included
      for (const row of equations) expect(row.equation, row.id).not.toContain('?')
    })
  }

  it('turns group ids into the group labels and flags reversible reactions', async () => {
    const layout = await loadLayout('gastric-acid')
    const map = layoutToMap(layout)
    expect(map.nodes.find((node) => node.id === 'compound:proton').group).toBe('Carbonic acid steps (uncatalysed or carbonic anhydrase)')
    expect(map.nodes.find((node) => node.id === 'reaction:proton-bicarbonate-protonation').reversible).toBe(true)
    expect(map.nodes.find((node) => node.id === 'reaction:gastric-hcl-secretion').reversible).toBeUndefined()
  })

  it('draws a drug that acts on a reaction as a regulator tether and other non-chemistry entries as pools', async () => {
    const layout = await loadLayout('gastric-acid')
    const map = layoutToMap(layout)
    expect(map.nodes.find((node) => node.id === 'intervention:ppi-therapy').kind).toBe('enzyme')
    expect(map.nodes.find((node) => node.id === 'outcome:belching').kind).toBe('pool')
    const bile = layoutToMap(await loadLayout('bile-acid-conjugation'))
    expect(bile.nodes.find((node) => node.id === 'intervention:taurine-supplement').kind).toBe('pool')
  })

  it('applies label suffixes, overrides and hidden nodes, and carries stoichiometry', async () => {
    const layout = await loadLayout('gaba-shunt-b6')
    const map = layoutToMap(layout, { suffix: { 'reaction:gad-glutamate-decarboxylation': ' (PLP)' }, labels: { 'compound:plp': 'Active B6' }, hide: ['state:b6-functional-deficiency'] })
    expect(map.nodes.find((node) => node.id === 'reaction:gad-glutamate-decarboxylation').label).toBe('GAD (PLP)')
    expect(map.nodes.find((node) => node.id === 'compound:plp').label).toBe('Active B6')
    expect(map.nodes.some((node) => node.id === 'state:b6-functional-deficiency')).toBe(false)
    expect(map.edges.some((edge) => edge.from === 'state:b6-functional-deficiency' || edge.to === 'state:b6-functional-deficiency')).toBe(false)
    const gastric = layoutToMap(await loadLayout('gastric-acid'))
    expect(gastric.edges.find((edge) => edge.from === 'reaction:urease-urea-hydrolysis' && edge.to === 'compound:ammonia').stoich).toBe(2)
  })

  it('places pooled participants as hidden currency nodes beside their reaction, named by the lookup', async () => {
    const layout = await loadLayout('gastric-acid')
    const map = layoutToMap(layout, { names: (id) => (id === 'compound:atp' ? 'ATP (energy)' : undefined) })
    const atp = map.nodes.find((node) => node.id === 'reaction:h-k-atpase-proton-pumping|pool|substrate|compound:atp')
    expect(atp).toMatchObject({ kind: 'compound', currency: true, label: 'ATP (energy)' })
    const reaction = map.nodes.find((node) => node.id === 'reaction:h-k-atpase-proton-pumping')
    expect(atp.x).toBeLessThan(reaction.x)
    const noPool = layoutToMap(layout, { pooled: false })
    expect(noPool.nodes.some((node) => node.currency)).toBe(false)
    expect(entityIds(layout)).toContain('compound:water')
    expect(slugLabel('compound:atp')).toBe('ATP')
    expect(slugLabel('compound:carbon-dioxide')).toBe('carbon dioxide')
  })

  it('lists the signed links as text rows', async () => {
    const rows = linkRows(await loadLayout('gastric-acid'))
    expect(rows.find((row) => row.from === 'intervention:ppi-therapy')).toMatchObject({ sign: 'decrease', label: 'blocks' })
  })
})
