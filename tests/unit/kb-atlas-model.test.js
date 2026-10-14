import { describe, expect, it } from 'vitest'
import { DEFAULT_TOPIC, causalView, matrixModel, pathwayInclude, pathwaysOnLayout, readCausal, relationsBetween, topics, writeCausal } from '../../src/kb/atlas-model.js'
import { atlasPath } from '../../src/kb/paths.js'
import { columnsFor, effectiveDirection, filterRows, firstDirection, readTable, rowsFor, sortRows, writeTable } from '../../src/kb/listing-table.js'
import { graph } from '../../src/knowledge/index.js'
import { loadLayout } from '../../src/viz/layouts/index.js'

describe('atlas matrix', () => {
  it('counts the relations between kinds and matches the drill-down', () => {
    const model = matrixModel()
    expect(model.types.map((type) => type.id)).not.toContain('article')
    expect(model.total).toBe(Object.values(model.counts).flatMap((row) => Object.values(row)).reduce((sum, n) => sum + n, 0))
    const relations = relationsBetween('compound', 'enzyme', { limit: 1000 })
    expect(relations.total).toBe(model.counts.compound.enzyme)
    expect(Object.values(relations.byRelation).reduce((sum, n) => sum + n, 0)).toBe(relations.total)
    expect(relationsBetween('compound', 'enzyme', { limit: 3 }).rows).toHaveLength(3)
  })

  it('adds the articles when asked', () => {
    expect(matrixModel({ includeEvidence: true }).types.map((type) => type.id)).toContain('article')
  })
})

describe('causal explorer state', () => {
  it('reads only valid values from the address and writes only what differs from the defaults', () => {
    expect(readCausal({})).toMatchObject({ topic: DEFAULT_TOPIC, focus: '', depth: 2, dir: 'both', hyp: true, sign: '', kinds: [] })
    expect(readCausal({ focus: 'outcome:belching', depth: '3', dir: 'up', hyp: '0', sign: 'mitigate', kinds: 'compound,bogus' })).toEqual({ topic: '', focus: 'outcome:belching', depth: 3, dir: 'up', hyp: false, sign: 'mitigate', kinds: ['compound'] })
    expect(readCausal({ focus: 'claim:belching-mostly-swallowed-air' }).focus).toBe('')
    expect(readCausal({ topic: 'hub:nope' }).topic).toBe(DEFAULT_TOPIC)
    expect(writeCausal(readCausal({}))).toEqual({})
    expect(writeCausal(readCausal({ focus: 'outcome:belching', dir: 'down' }))).toEqual({ focus: 'outcome:belching', dir: 'down' })
    expect(atlasPath('causal', { focus: 'outcome:belching', dir: '' })).toBe('/atlas/causal?focus=outcome%3Abelching')
  })

  it('lists the guided paths and hub topics as starting points', () => {
    const list = topics()
    expect(list.filter((topic) => topic.kind === 'path')).toHaveLength(9)
    expect(list.some((topic) => topic.id === 'hub:state:undermethylation')).toBe(true)
  })

  it('draws a topic slice of at most 40 nodes, and a focus neighbourhood', () => {
    const topic = causalView(readCausal({ topic: 'hub:state:undermethylation' }))
    expect(topic.nodes.length).toBeLessThanOrEqual(40)
    expect(topic.counts.edges).toBe(topic.edges.length)
    const focus = causalView(readCausal({ focus: 'outcome:belching' }))
    expect(focus.title).toBe('Belching (eructation)')
    expect(focus.rows[0].from === 'outcome:belching' || focus.rows[0].to === 'outcome:belching').toBe(true)
  })

  it('filters by sign, hypothesis, direction and kind, and says when nothing is left', () => {
    const base = causalView(readCausal({ focus: 'outcome:belching' }))
    const mitigates = causalView(readCausal({ focus: 'outcome:belching', sign: 'mitigate' }))
    expect(mitigates.rows.length).toBeGreaterThan(0)
    expect(mitigates.rows.every((row) => row.sign === 'mitigate')).toBe(true)
    expect(mitigates.counts.edges).toBeLessThan(base.counts.edges)
    const solid = causalView(readCausal({ focus: 'outcome:belching', hyp: '0' }))
    expect(solid.edges.some((edge) => edge.hypothesis)).toBe(false)
    expect(base.edges.some((edge) => edge.hypothesis)).toBe(true)
    const upstream = causalView(readCausal({ focus: 'outcome:belching', dir: 'up', depth: '1' }))
    expect(upstream.rows.some((row) => row.to === 'outcome:belching')).toBe(true)
    expect(upstream.rows.some((row) => row.from === 'outcome:belching')).toBe(false)
    const kinds = causalView(readCausal({ focus: 'outcome:belching', kinds: 'intervention' }))
    expect(kinds.nodes.every((node) => node.type === 'intervention' || node.id === 'outcome:belching')).toBe(true)
    expect(causalView(readCausal({ topic: 'hub:enzyme:gnmt', sign: 'aggravate', kinds: 'enzyme' })).empty).toBe(true)
  })
})

describe('metabolic network pathways', () => {
  it('lists the pathways with at least two reactions on a map and crops to one', async () => {
    const layout = await loadLayout('core-methylation')
    const pathways = pathwaysOnLayout(layout)
    expect(pathways.length).toBeGreaterThan(5)
    expect(pathways.every((item) => item.reactions.length >= 2)).toBe(true)
    const include = pathwayInclude(layout, pathways[0].id)
    expect(include.size).toBeLessThan(layout.nodes.length)
    expect(pathwayInclude(layout, 'pathway:not-on-this-map')).toBeNull()
  })
})

describe('type listing table', () => {
  it('has the common columns and the ones of the type', () => {
    expect(columnsFor('compound').map((column) => column.id)).toEqual(['name', 'evidence', 'reactions', 'quantities', 'linked', 'fingerprint'])
    expect(columnsFor('reaction').map((column) => column.id)).toContain('equation')
    expect(columnsFor('article').map((column) => column.id)).toEqual(expect.arrayContaining(['year', 'citation', 'verified']))
    expect(columnsFor('claim').map((column) => column.id)).toContain('status')
  })

  it('has one row per entity with a relation fingerprint that adds up to its links', () => {
    for (const type of ['compound', 'enzyme', 'reaction', 'pathway', 'state', 'intervention', 'claim', 'article']) {
      const rows = rowsFor(type)
      expect(rows).toHaveLength(graph.byType.get(type).length)
      expect(rows.every((row) => row.fingerprint.length === 12)).toBe(true)
    }
    const glycine = rowsFor('compound').find((row) => row.id === 'compound:glycine')
    expect(glycine.reactions).toBeGreaterThan(8)
    expect(rowsFor('reaction')[0].equation.reactants.length).toBeGreaterThan(0)
  })

  it('filters, sorts and flips', () => {
    const rows = rowsFor('compound')
    expect(filterRows(rows, { q: 'betaine' }).length).toBeLessThan(rows.length)
    expect(filterRows(rows, { grade: 'plausible' }).every((row) => row.evidence === 'plausible')).toBe(true)
    const byLinks = sortRows(rows, 'linked', 'desc')
    expect(byLinks[0].linked).toBeGreaterThanOrEqual(byLinks[1].linked)
    const byEvidence = sortRows(rows, 'evidence', 'desc')
    expect(byEvidence[0].evidence).toBe('established')
    expect(sortRows(rows, 'name', 'asc')[0].name.localeCompare(sortRows(rows, 'name', 'desc')[0].name)).toBeLessThanOrEqual(0)
    expect(firstDirection({ id: 'name' })).toBe('asc')
    expect(firstDirection({ id: 'linked', kind: 'count' })).toBe('desc')
  })

  it('reads and writes the table state without keeping defaults', () => {
    const columns = columnsFor('compound')
    expect(readTable({ sort: 'bogus', grade: 'x', dir: 'up' }, columns)).toEqual({ q: '', grade: '', status: '', sort: 'name', dir: '' })
    expect(readTable({ sort: 'linked', dir: 'asc' }, columns).dir).toBe('asc')
    expect(writeTable({ q: '', grade: '', status: '', sort: 'name', dir: '' }, columns)).toEqual({})
    expect(writeTable({ q: '', grade: '', status: '', sort: 'linked', dir: 'desc' }, columns)).toEqual({ sort: 'linked' })
    expect(writeTable({ q: '', grade: '', status: '', sort: 'linked', dir: 'asc' }, columns)).toEqual({ sort: 'linked', dir: 'asc' })
    expect(effectiveDirection({ sort: 'linked', dir: '' }, columns)).toBe('desc')
  })
})
