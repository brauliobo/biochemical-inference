import { describe, expect, it } from 'vitest'
import { binFor, buildHeat, heatDomain, legendBins, moveCursor } from '../../src/viz/heat-model.js'
import { buildLineModel, describeLines, indexAtPixel, logAllowed, readoutAt, tableHeadings, tableRows } from '../../src/viz/line-model.js'
import { buildRangeModel, describeRanges, limitsOf, rangeTable, statusFor } from '../../src/viz/range-model.js'
import { sparkModel } from '../../src/viz/spark-model.js'
import { buildStack, categoriesOf, describeStack, stackTable } from '../../src/viz/stack-model.js'
import { buildTimeline, describeTimeline, stepDot } from '../../src/viz/timeline-model.js'
import { stagger } from '../../src/viz/labels.js'
import { rangeSample, sharesSample, timelineSample } from '../../src/viz/samples/charts.js'
import { timecourseSample } from '../../src/viz/samples/timecourse.js'

describe('line model', () => {
  const sample = timecourseSample()
  const base = { x: sample.x, series: sample.series, events: sample.events, bands: sample.bands, refLines: sample.refLines, width: 700, height: 300 }

  it('keeps every point inside the plot and builds a ribbon only for a series with a band', () => {
    const model = buildLineModel(base)
    expect(model.lines[0].ribbon).toBe('')
    expect(model.lines[1].ribbon).toMatch(/^M.*Z$/)
    const { left, right, top, bottom } = model.plot
    expect(model.xScale(0)).toBeCloseTo(left)
    expect(model.xScale(24)).toBeCloseTo(right)
    expect(model.yScale(model.yDomain.min)).toBeCloseTo(bottom)
    expect(model.yScale(model.yDomain.max)).toBeCloseTo(top)
  })

  it('stacks overlapping event labels into rows and makes room above the plot', () => {
    const crowded = buildLineModel({ ...base, events: [{ x: 10, label: 'First long event label' }, { x: 10.5, label: 'Second long event label' }] })
    expect(new Set(crowded.events.map((event) => event.row)).size).toBe(2)
    expect(crowded.plot.top).toBeGreaterThan(buildLineModel({ ...base, events: [] }).plot.top)
  })

  it('flips a label near the right edge so it stays inside', () => {
    const edge = buildLineModel({ ...base, events: [{ x: 24, label: 'At the end of the run' }] })
    expect(edge.events[0].anchor).toBe('end')
  })

  it('switches to a log axis only when every value is positive', () => {
    expect(logAllowed(sample.series)).toBe(true)
    expect(buildLineModel({ ...base, yScale: 'log' }).yType).toBe('log')
    const withZero = [{ id: 'z', label: 'Z', values: [0, 1, 2] }]
    expect(logAllowed(withZero)).toBe(false)
    expect(buildLineModel({ x: [0, 1, 2], series: withZero, yScale: 'log' }).yType).toBe('linear')
  })

  it('drops a hidden series from the domain and the drawing', () => {
    const model = buildLineModel({ ...base, hidden: ['scenario'] })
    expect(model.lines[1].visible).toBe(false)
    expect(model.yDomain.max).toBeLessThanOrEqual(buildLineModel(base).yDomain.max)
  })

  it('breaks the line at missing values', () => {
    const model = buildLineModel({ x: [0, 1, 2, 3], series: [{ id: 'g', label: 'G', values: [1, null, 2, 3] }] })
    expect(model.lines[0].path.match(/M/g)).toHaveLength(2)
  })

  it('reads back values, ranges, bands and events at a sample', () => {
    const readout = readoutAt({ x: sample.x, series: sample.series, events: sample.events, bands: sample.bands, xUnit: 'h', unit: 'ratio', index: 4 })
    expect(readout.xText).toBe('2 h')
    expect(readout.rows.map((row) => row.id)).toEqual(['baseline', 'scenario'])
    expect(readout.rows[1].rangeText).toMatch(/^p5–p95 /)
    expect(readout.events.map((event) => event.label)).toEqual(['Glycine 5 g at t = 2 h'])
    expect(readout.text).toContain('Event: Glycine 5 g at t = 2 h')
    expect(readoutAt({ x: sample.x, series: sample.series, hidden: ['baseline'], index: 0 }).rows).toHaveLength(1)
  })

  it('finds the sample under a pixel', () => {
    const model = buildLineModel(base)
    expect(indexAtPixel(model, sample.x, model.plot.left)).toBe(0)
    expect(indexAtPixel(model, sample.x, model.plot.right)).toBe(sample.x.length - 1)
  })

  it('describes the lines, events and reference ranges in words and tabulates them', () => {
    const text = describeLines({ ...base, xUnit: 'h', unit: 'ratio' })
    expect(text).toMatch(/^2 series over 0 to 24 h\./)
    expect(text).toContain('Events: Glycine 5 g at t = 2 h at 2 h')
    expect(text).toContain('Reference ranges: Typical range (sample) 4 to 8')
    const rows = tableRows({ x: sample.x, series: sample.series, limit: 10 })
    expect(rows).toHaveLength(10)
    expect(rows[0].cells).toHaveLength(tableHeadings({ series: sample.series }).length)
  })
})

describe('stagger', () => {
  it('uses another row when labels would overlap', () => {
    const rows = stagger([{ pos: 10, text: 'aaaaaaaaaa' }, { pos: 20, text: 'bbbbbbbbbb' }, { pos: 400, text: 'cc' }], { right: 500, rowLimit: 3 })
    expect(rows.map((row) => row.row)).toEqual([0, 1, 0])
  })
})

describe('range model', () => {
  const { rows } = rangeSample()

  it('reads the limits of a row, and an absent UL as "none established"', () => {
    expect(limitsOf(rows[0])).toEqual({ requirement: 500, ul: 3500, noUl: false })
    expect(limitsOf(rows[1])).toEqual({ requirement: 400, ul: null, noUl: true })
  })

  it('says where a value sits, in words', () => {
    expect(statusFor(rows[0], 100, 'mg').code).toBe('below')
    expect(statusFor(rows[0], 1200, 'mg').code).toBe('within')
    expect(statusFor(rows[0], 4000, 'mg').code).toBe('above-ul')
    expect(statusFor(rows[1], 4000, 'mg').code).toBe('no-ul')
    expect(statusFor(rows[1], 4000, 'mg').text).toContain('no upper limit is established')
    expect(statusFor(rows[0], undefined)).toBeNull()
  })

  it('draws regions, markers and a "no upper limit" row', () => {
    const model = buildRangeModel({ rows, width: 600, max: 4000, value: 1200, unit: 'mg/day' })
    expect(model.rows[0].regions.map((region) => region.kind)).toEqual(['below', 'within', 'above'])
    expect(model.rows[1].regions.map((region) => region.kind)).toEqual(['below', 'no-limit'])
    expect(model.rows[1].noUl).toBe(true)
    expect(model.rows[1].noUlText).toBe('No upper limit established')
    expect(model.userX).toBeCloseTo(model.x(1200))
    expect(model.rows[0].markers.map((marker) => marker.kind)).toEqual(['ai', 'ul'])
    expect(model.rows[0].typical.x1).toBeLessThan(model.rows[0].typical.x2)
  })

  it('puts close markers on different label rows', () => {
    const close = buildRangeModel({ rows: [{ id: 'x', label: 'X', markers: [{ kind: 'ai', value: 100 }, { kind: 'rda', value: 110 }] }], width: 400, max: 1000 })
    expect(new Set(close.rows[0].markers.map((marker) => marker.labelY)).size).toBe(2)
  })

  it('describes and tabulates every authority, including the missing UL', () => {
    expect(describeRanges({ rows, unit: 'mg/day', value: 1200 })).toContain('no upper limit established (insufficient data)')
    const table = rangeTable({ rows, unit: 'mg/day', value: 1200 })
    expect(table.heads.some((head) => head.startsWith('UL'))).toBe(true)
    expect(table.rows[1].cells).toContain('none established (insufficient data)')
  })
})

describe('stack model', () => {
  const { bars } = sharesSample()

  it('scales each bar to its full width and keeps colours per item across bars', () => {
    const model = buildStack({ bars, normalize: true, width: 700 })
    for (const bar of model.bars) {
      const covered = bar.segments.reduce((sum, segment) => sum + segment.w, 0) + bar.segments.length * 2
      expect(covered).toBeCloseTo(model.right - model.left, 0)
    }
    expect(model.bars[0].segments[0].look).toBe(model.bars[1].segments[0].look)
    expect(categoriesOf(bars).map((category) => category.id)).toEqual(['gnmt', 'pemt', 'creatine', 'other'])
  })

  it('adds a ranges strip only for items with low and high', () => {
    expect(buildStack({ bars, width: 700 }).ranges).toHaveLength(8)
    expect(buildStack({ bars: [{ id: 'a', label: 'A', items: [{ id: 'x', label: 'X', value: 1 }] }], width: 700 }).ranges).toEqual([])
    const range = buildStack({ bars: bars.slice(0, 1), width: 700 }).ranges[0]
    expect(range.x1).toBeLessThan(range.xv)
    expect(range.xv).toBeLessThan(range.x2)
  })

  it('moves labels above the bars and stacks the range text on a narrow screen', () => {
    const narrow = buildStack({ bars, width: 320 })
    expect(narrow.stacked).toBe(false)
    expect(narrow.ranges[0].vanchor).toBe('start')
    expect(buildStack({ bars, width: 700 }).stacked).toBe(true)
  })

  it('describes and tabulates the shares with their ranges', () => {
    expect(describeStack({ bars })).toContain('GNMT 38% (range 28 to 48)')
    const table = stackTable({ bars })
    expect(table.heads).toEqual(['Baseline', 'Glycine 5 g'])
    expect(table.rows[0].cells[1]).toBe('52% (range 40 to 62)')
  })

  it('can show absolute amounts on a shared axis', () => {
    const model = buildStack({ bars: [{ id: 'a', label: 'A', items: [{ id: 'x', label: 'X', value: 5 }] }, { id: 'b', label: 'B', items: [{ id: 'x', label: 'X', value: 10 }] }], normalize: false, unit: 'g', width: 600 })
    expect(model.bars[1].segments[0].w).toBeGreaterThan(model.bars[0].segments[0].w * 1.9)
  })
})

describe('heat model', () => {
  it('bins sequential values from 1 to 6 and missing values as none', () => {
    const options = { mode: 'sequential', domain: [0, 12] }
    expect([0, 1.9, 2, 6, 11.9, 12, 99].map((value) => binFor(value, options))).toEqual(['s1', 's1', 's2', 's4', 's6', 's6', 's6'])
    expect(binFor(null, options)).toBe('none')
  })

  it('bins diverging values around the centre with a neutral middle', () => {
    const options = { mode: 'diverging', domain: [-100, 100], center: 0 }
    expect([-100, -50, -20, 0, 20, 50, 100].map((value) => binFor(value, options))).toEqual(['n3', 'n2', 'n1', 'z', 'p1', 'p2', 'p3'])
    expect(heatDomain([[-5, 20]], { mode: 'diverging' })).toEqual([-20, 20])
  })

  it('builds cells, labels, totals and a legend', () => {
    const built = buildHeat({ rows: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], cols: [{ id: 'x', label: 'X' }, { id: 'y', label: 'Y' }], values: [[1, 2], [3, null]], blankZero: true, unit: 'items' })
    expect(built.rowTotals).toEqual([3, 3])
    expect(built.colTotals).toEqual([4, 2])
    expect(built.grandTotal).toBe(6)
    expect(built.cells[1][1]).toMatchObject({ bin: 'none', text: '–', label: 'B, Y: no data' })
    expect(built.cells[0][0].label).toBe('A, X: 1 items')
    expect(built.legend).toHaveLength(6)
    expect(legendBins({ mode: 'diverging', domain: [-10, 10] })).toHaveLength(7)
    const asFunction = buildHeat({ rows: [{ id: 'a', label: 'A' }], cols: [{ id: 'x', label: 'X' }], values: (row, col) => (row === 'a' && col === 'x' ? 0 : null), blankZero: true })
    expect(asFunction.cells[0][0].text).toBe('·')
  })

  it('moves a grid cursor and stops at the edges', () => {
    const size = { rowCount: 3, colCount: 4 }
    expect(moveCursor({ row: 0, col: 0 }, 'ArrowLeft', size)).toEqual({ row: 0, col: 0 })
    expect(moveCursor({ row: 1, col: 1 }, 'ArrowRight', size)).toEqual({ row: 1, col: 2 })
    expect(moveCursor({ row: 1, col: 1 }, 'End', size)).toEqual({ row: 1, col: 3 })
    expect(moveCursor({ row: 1, col: 1 }, 'End', { ...size, ctrl: true })).toEqual({ row: 2, col: 3 })
    expect(moveCursor({ row: 1, col: 1 }, 'Home', { ...size, ctrl: true })).toEqual({ row: 0, col: 0 })
    expect(moveCursor({ row: 2, col: 3 }, 'ArrowDown', size)).toEqual({ row: 2, col: 3 })
    expect(moveCursor({ row: 0, col: 0 }, 'x', size)).toBeNull()
  })
})

describe('timeline model', () => {
  const { items, groups } = timelineSample()

  it('puts every item in its design lane, and every lane on its own band', () => {
    const model = buildTimeline({ items, groups, width: 720 })
    expect(model.lanes.map((lane) => lane.id)).toEqual(groups.map((group) => group.id))
    expect(model.lanes.reduce((sum, lane) => sum + lane.dots.length, 0)).toBe(items.length)
    for (let i = 1; i < model.lanes.length; i += 1) expect(model.lanes[i].top).toBeGreaterThanOrEqual(model.lanes[i - 1].top + model.lanes[i - 1].height)
    expect(model.ticks.length).toBeGreaterThan(2)
  })

  it('hides a design and shares columns between years on a narrow chart', () => {
    expect(buildTimeline({ items, groups, hidden: ['rct'], width: 720 }).lanes).toHaveLength(groups.length - 1)
    const narrow = buildTimeline({ items, groups, width: 320 })
    const wide = buildTimeline({ items, groups, width: 900 })
    const columns = (model) => new Set(model.lanes.flatMap((lane) => lane.dots.map((dot) => Math.round(dot.x)))).size
    expect(columns(narrow)).toBeLessThan(columns(wide))
  })

  it('steps along a lane, between lanes and to the ends', () => {
    const model = buildTimeline({ items, groups, width: 720 })
    const lane = model.lanes[0].dots.map((dot) => dot.id)
    const first = model.order.find((dot) => dot.group === model.lanes[0].id)
    const next = stepDot(model.order, first.id, 'ArrowRight')
    expect(lane).toContain(next)
    expect(stepDot(model.order, first.id, 'ArrowLeft')).toBe(first.id)
    const below = stepDot(model.order, first.id, 'ArrowDown')
    expect(model.order.find((dot) => dot.id === below).group).toBe(model.lanes[1].id)
    expect(stepDot(model.order, first.id, 'ArrowUp')).toBe(first.id)
    expect(stepDot(model.order, first.id, 'End')).toBe(model.lanes[0].dots.map((dot) => dot).sort((a, b) => a.item.year - b.item.year || a.y - b.y).at(-1).id)
    expect(stepDot(model.order, first.id, 'q')).toBeNull()
  })

  it('describes the counts by design', () => {
    expect(describeTimeline({ items, groups })).toContain(`${items.length} articles`)
  })
})

describe('sparkline model', () => {
  it('fits the values in the box and describes them', () => {
    const model = sparkModel({ values: [1, 3, 2], label: 'X', unit: 'u' })
    expect(model.path).toMatch(/^M/)
    expect(model.last.value).toBe(2)
    expect(model.text).toBe('X: from 1 u to 2 u, lowest 1, highest 3, 3 values.')
    expect(sparkModel({ values: [] }).text).toBe('no values.')
    expect(sparkModel({ values: [2, 2, 2] }).path).toMatch(/^M/)
  })
})
