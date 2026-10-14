import { describe, expect, it } from 'vitest'
import { boundaryPoint, buildMap, concentrationBins, connectedTo, describeMap, reactionEquations } from '../../src/viz/metabolic-model.js'
import { methylationMap, methylationValues } from '../../src/viz/samples/methylation.js'

const map = methylationMap()
const { flux, concentration } = methylationValues()

describe('sample layout', () => {
  it('has about 25 to 30 nodes of every kind and only edges between known nodes', () => {
    expect(map.nodes.length).toBeGreaterThanOrEqual(25)
    for (const kind of ['compound', 'enzyme', 'reaction', 'pool']) expect(map.nodes.some((node) => node.kind === kind)).toBe(true)
    const ids = new Set(map.nodes.map((node) => node.id))
    expect(new Set(map.nodes.map((node) => node.id)).size).toBe(map.nodes.length)
    expect(map.edges.every((edge) => ids.has(edge.from) && ids.has(edge.to))).toBe(true)
  })

  it('keeps every node inside the view box', () => {
    const [x, y, w, h] = map.viewBox
    expect(map.nodes.every((node) => node.x >= x && node.x <= x + w && node.y >= y && node.y <= y + h)).toBe(true)
  })
})

describe('buildMap', () => {
  it('hides currency molecules and their edges until asked', () => {
    const hidden = buildMap({ map })
    const shown = buildMap({ map, showCurrency: true })
    expect(hidden.hiddenCount).toBe(4)
    expect(hidden.nodes.some((node) => node.currency)).toBe(false)
    expect(shown.nodes.some((node) => node.currency)).toBe(true)
    expect(shown.edges.length).toBeGreaterThan(hidden.edges.length)
  })

  it('classifies edges as substrate, product, catalysis or direct', () => {
    const edges = buildMap({ map }).edges
    const kind = (from, to) => edges.find((edge) => edge.from === from && edge.to === to).kind
    expect(kind('met', 'r-mat')).toBe('substrate')
    expect(kind('r-mat', 'sam')).toBe('product')
    expect(kind('e-mat', 'r-mat')).toBe('catalysis')
    expect(kind('diet', 'met')).toBe('direct')
  })

  it('draws arrowheads on product ends, and both ends for a reversible reaction', () => {
    const edges = buildMap({ map }).edges
    const edge = (from, to) => edges.find((candidate) => candidate.from === from && candidate.to === to)
    expect(edge('r-mat', 'sam').head).not.toBe('')
    expect(edge('met', 'r-mat').head).toBe('')
    expect(edge('met', 'r-mat').tail).toBe('')
    expect(edge('sah', 'r-ahcy').tail).not.toBe('')
    expect(edge('e-mat', 'r-mat').head).toBe('')
  })

  it('starts and ends edges on the node borders, through waypoints', () => {
    const built = buildMap({ map })
    const via = built.edges.find((edge) => edge.from === 'r-shmt' && edge.to === 'gly')
    expect(via.d.split('L').length).toBe(4)
    const box = { x: 100, y: 100, w: 40, h: 20 }
    const right = boundaryPoint(box, 200, 100)
    expect(right.x).toBeCloseTo(121.5)
    expect(right.y).toBe(100)
    const diagonal = boundaryPoint(box, 200, 200)
    expect(diagonal.y).toBeCloseTo(111.5, 0)
  })

  it('encodes flux as stroke width and colour class, and a negative flux as a reversed arrow', () => {
    const built = buildMap({ map, flux })
    const width = (reaction) => built.edges.find((edge) => edge.reaction === reaction && edge.kind === 'product').width
    expect(width('r-mat')).toBeGreaterThan(width('r-mthfr'))
    expect(built.edges.find((edge) => edge.reaction === 'r-mat' && edge.kind === 'product').fluxClass).toBe('viz-flux-3')
    expect(built.edges.find((edge) => edge.reaction === 'r-mthfr' && edge.kind === 'product').fluxClass).toBe('viz-flux-1')
    expect(built.fluxLegend).toHaveLength(3)
    const reversed = buildMap({ map, flux: { 'r-mat': -3 } })
    expect(reversed.edges.find((edge) => edge.from === 'r-mat' && edge.to === 'sam').head).toBe('')
    expect(reversed.edges.find((edge) => edge.from === 'met' && edge.to === 'r-mat').tail).not.toBe('')
  })

  it('encodes concentration as fill bin and a little size, with a legend', () => {
    const built = buildMap({ map, concentration, concUnit: 'uM' })
    const node = (id) => built.nodes.find((entry) => entry.id === id)
    expect(node('gly').bin).toBe('s6')
    expect(node('ade').bin).toBe('s1')
    expect(node('gly').h).toBeGreaterThan(node('ade').h * 1.2)
    expect(node('gly').valueText).toBe('280 uM')
    expect(built.concentration.legend).toHaveLength(6)
    expect(node('r-mat')?.bin ?? '').toBe('')
  })

  it('uses a log scale only for values that span more than fifty fold', () => {
    expect(concentrationBins({ a: 1, b: 10 }).log).toBe(false)
    expect(concentrationBins({ a: 1, b: 1000 }).log).toBe(true)
    expect(concentrationBins({})).toBeNull()
  })

  it('draws a group box around its nodes and a stoichiometry label when it is not one', () => {
    const built = buildMap({ map: { ...map, edges: [...map.edges, { from: 'ser', to: 'r-shmt', stoich: 2 }] } })
    expect(built.groups.map((group) => group.id).sort()).toEqual(['Folate cycle', 'Methionine cycle'])
    expect(built.edges.some((edge) => edge.stoich?.text === '2')).toBe(true)
    expect(built.edges.every((edge) => edge.stoich?.text !== '1')).toBe(true)
  })
})

describe('connectedTo', () => {
  it('lights the reactions around a compound and everything on those reactions', () => {
    const around = connectedTo(map, 'sam')
    expect(around.nodes.has('r-mat')).toBe(true)
    expect(around.nodes.has('r-gnmt')).toBe(true)
    expect(around.nodes.has('e-gnmt')).toBe(true)
    expect(around.nodes.has('r-mtr')).toBe(false)
    expect(connectedTo(map, 'r-mtr').nodes.has('mthf')).toBe(true)
    expect(connectedTo(map, 'nope').nodes.size).toBe(0)
  })
})

describe('text alternative', () => {
  it('writes each reaction as an equation with its enzyme, currency molecules included', () => {
    const rows = reactionEquations({ map, flux, fluxUnit: 'umol/h' })
    expect(rows).toHaveLength(6)
    const mat = rows.find((row) => row.id === 'r-mat')
    expect(mat.equation).toBe('Methionine + ATP → SAM + PPi + Pi')
    expect(mat.enzymes).toEqual(['MAT1A / MAT2A'])
    expect(mat.flux).toBe('6.2 umol/h')
    expect(rows.find((row) => row.id === 'r-ahcy').equation).toContain('⇌')
  })

  it('describes the map and mentions hidden currency molecules', () => {
    const built = buildMap({ map })
    const text = describeMap({ map, equations: reactionEquations({ map }), built })
    expect(text).toContain('6 reactions')
    expect(text).toContain('4 currency molecules')
  })
})
