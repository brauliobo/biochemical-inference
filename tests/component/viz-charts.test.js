import { fireEvent, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import RangeBar from '../../src/viz/RangeBar.vue'
import Sparkline from '../../src/viz/Sparkline.vue'
import StackedBar from '../../src/viz/StackedBar.vue'
import Timeline from '../../src/viz/Timeline.vue'
import { rangeSample, sharesSample, sparkSample, timelineSample } from '../../src/viz/samples/charts.js'
import { expectAccessible } from '../helpers/axe.js'
import { mountVapor } from '../helpers/mount-vapor.js'

describe('RangeBar', () => {
  const range = rangeSample()
  const props = { id: 'range-test', title: 'Intake against two authorities', rows: range.rows, unit: range.unit, min: 0, max: 4000 }

  it('draws a row per authority with AI and UL markers, the typical range and the regions', async () => {
    const { container } = mountVapor(RangeBar, { props })
    expect(container.textContent).toContain('IOM (US), adults (sample)')
    expect(container.textContent).toContain('EFSA (EU), adults (sample)')
    expect(container.textContent).toContain('AI 500')
    expect(container.textContent).toContain('UL 3500')
    expect(container.textContent).toContain('AI 400')
    expect(container.querySelectorAll('.viz-bracket')).toHaveLength(2)
    expect(container.querySelectorAll('.viz-region--above')).toHaveLength(1)
    expect(container.querySelectorAll('.viz-region--within')).toHaveLength(1)
    await expectAccessible(container)
  })

  it('says "No upper limit established" in words for a row without a UL', () => {
    const { container } = mountVapor(RangeBar, { props })
    expect(container.textContent).toContain('No upper limit established')
    expect(container.querySelectorAll('.viz-region--no-limit')).toHaveLength(1)
    const summary = container.querySelector('figure > p').textContent
    expect(summary).toContain('no upper limit established (insufficient data)')
    expect(container.querySelector('details table').textContent).toContain('none established (insufficient data)')
  })

  it('adds a labelled slider, a marker across the rows and a status word per row when given a value', async () => {
    const { container } = mountVapor(RangeBar, { props: { ...props, modelValue: 3800, valueLabel: 'Your intake', step: 50 } })
    const slider = within(container).getByRole('slider', { name: 'Your intake' })
    expect(slider.getAttribute('min')).toBe('0')
    expect(slider.getAttribute('aria-valuetext')).toBe('3800 mg/day')
    expect(container.querySelector('.viz-user')).toBeTruthy()
    expect(container.querySelectorAll('.viz-user-mark')).toHaveLength(2)
    expect(container.querySelector('.viz-status').textContent).toContain('Above the UL')
    expect(container.querySelector('.viz-status').textContent).toContain('No UL to compare')
    await expectAccessible(container)
  })

  it('has no slider and no user marker without a value', () => {
    const { container } = mountVapor(RangeBar, { props })
    expect(container.querySelector('input[type="range"]')).toBeNull()
    expect(container.querySelector('.viz-user')).toBeNull()
  })
})

describe('StackedBar', () => {
  const { bars } = sharesSample()

  it('draws one segment per item in each bar with a key that carries the numbers', async () => {
    const { container } = mountVapor(StackedBar, { props: { id: 'stack-test', title: 'Where the methyl groups go', bars } })
    expect(container.querySelectorAll('.viz-seg')).toHaveLength(8)
    expect(container.querySelector('.viz-seg title').textContent).toContain('GNMT: 38%')
    const keys = [...container.querySelectorAll('.viz-key--button')].map((key) => key.textContent)
    expect(keys[0]).toContain('GNMT')
    expect(keys[0]).toContain('Baseline: 38% (range 28 to 48)')
    expect(keys[0]).toContain('Glycine 5 g: 52%')
    expect(container.textContent).toContain('Share ranges')
    await expectAccessible(container)
  })

  it('offers a data table and reports a click on a segment or key entry', async () => {
    const picked = []
    const { container } = mountVapor(StackedBar, { props: { title: 'Shares', bars, onSelect: () => (id) => picked.push(id) } })
    const table = container.querySelector('details table')
    expect(within(table).getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual(['Item', 'Baseline', 'Glycine 5 g'])
    await fireEvent.click(container.querySelector('.viz-seg'))
    await fireEvent.click(container.querySelectorAll('.viz-key--button')[1])
    expect(picked).toEqual(['gnmt', 'pemt'])
  })

  it('draws a single bar without ranges when the items have none', () => {
    const { container } = mountVapor(StackedBar, { props: { title: 'Plain', bars: [{ id: 'a', label: '', items: [{ id: 'x', label: 'X', value: 1 }, { id: 'y', label: 'Y', value: 3 }] }] } })
    expect(container.querySelectorAll('.viz-seg')).toHaveLength(2)
    expect(container.textContent).not.toContain('Share ranges')
    expect(container.querySelector('figure > p').textContent).toBe('X 25%, Y 75%.')
  })
})

describe('Sparkline', () => {
  const spark = sparkSample()

  it('is an image whose name says where the series starts, ends, and its extremes', async () => {
    const { container } = mountVapor(Sparkline, { props: { label: 'SAM', values: spark.values, unit: 'uM', showValue: true } })
    const svg = container.querySelector('svg')
    expect(svg.getAttribute('role')).toBe('img')
    expect(svg.getAttribute('aria-label')).toBe('SAM: from 4.1 uM to 6.1 uM, lowest 4.1, highest 6.1, 12 values.')
    expect(container.querySelector('.viz-spark__value').textContent).toBe('6.1 uM')
    expect(container.querySelector('.viz-spark__band')).toBeNull()
    await expectAccessible(container)
  })

  it('draws a band when given bounds', () => {
    const { container } = mountVapor(Sparkline, { props: { values: spark.values, lower: spark.lower, upper: spark.upper } })
    expect(container.querySelector('.viz-spark__band')).toBeTruthy()
  })
})

describe('Timeline', () => {
  const { items, groups } = timelineSample()
  const props = { id: 'timeline-test', title: 'Articles by year and design', items, groups }

  it('draws a lane per design and one marker per article, with a key and a data table', async () => {
    const { container } = mountVapor(Timeline, { props })
    expect(container.querySelectorAll('.viz-lane')).toHaveLength(groups.length)
    expect(container.querySelectorAll('.viz-dot-mark')).toHaveLength(items.length)
    expect(container.querySelector('figure > p').textContent).toContain(`${items.length} articles`)
    expect(container.querySelectorAll('.viz-toggle')).toHaveLength(groups.length)
    const table = container.querySelector('details table')
    expect(within(table).getAllByRole('columnheader').map((cell) => cell.textContent)).toContain('Review')
    await expectAccessible(container)
  })

  it('hides a design from the key', async () => {
    const { container } = mountVapor(Timeline, { props })
    await fireEvent.click(within(container).getByRole('button', { name: /^Review/ }))
    expect(container.querySelectorAll('.viz-lane')).toHaveLength(groups.length - 1)
  })

  it('moves along a lane and between lanes from the keyboard, names the article and selects it', async () => {
    const picked = []
    const { container } = mountVapor(Timeline, { props: { ...props, onSelect: () => (item) => picked.push(item.id) } })
    const plot = container.querySelector('.viz-plot')
    const readout = container.querySelector('.viz-readout')
    plot.focus()
    await fireEvent.focus(plot)
    expect(readout.textContent).toContain('(sample)')
    const first = readout.querySelector('strong').textContent
    await fireEvent.keyDown(plot, { key: 'ArrowRight' })
    expect(readout.querySelector('strong').textContent).not.toBe(first)
    await fireEvent.keyDown(plot, { key: 'ArrowDown' })
    expect(readout.textContent).toContain('Cohort study')
    await fireEvent.keyDown(plot, { key: 'Home' })
    await fireEvent.keyDown(plot, { key: 'Enter' })
    expect(picked).toHaveLength(1)
    expect(container.querySelectorAll('.is-active')).toHaveLength(1)
    await fireEvent.blur(plot)
    expect(container.querySelectorAll('.is-active')).toHaveLength(0)
  })

  it('names an article when the pointer is over its marker', async () => {
    const { container } = mountVapor(Timeline, { props })
    await fireEvent.pointerEnter(container.querySelectorAll('.viz-dot-mark')[3])
    expect(container.querySelector('.viz-readout').textContent).toContain('Made-up record.')
  })
})
