import { fireEvent, screen, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import LineChartPlus from '../../src/viz/LineChartPlus.vue'
import { timecourseSample } from '../../src/viz/samples/timecourse.js'
import { expectAccessible } from '../helpers/axe.js'
import { mountVapor } from '../helpers/mount-vapor.js'

const sample = timecourseSample()
const props = { id: 'line-test', title: 'SAM:SAH ratio', x: sample.x, series: sample.series, events: sample.events, bands: sample.bands, refLines: sample.refLines, unit: 'ratio', xUnit: 'h' }

describe('LineChartPlus', () => {
  it('draws a labelled figure with a text summary, ribbon, events, bands and a data table', async () => {
    const { container } = mountVapor(LineChartPlus, { props })
    expect(screen.getByText('SAM:SAH ratio')).toBeTruthy()
    expect(container.querySelector('svg[role="img"]').getAttribute('aria-label')).toContain('SAM:SAH ratio')
    expect(container.querySelectorAll('.viz-line').length).toBe(2)
    expect(container.querySelectorAll('.viz-ribbon').length).toBe(1)
    expect(container.querySelectorAll('.viz-event').length).toBe(3)
    expect(container.querySelectorAll('.viz-band').length).toBe(1)
    expect(container.querySelectorAll('.viz-refline').length).toBe(1)
    expect(container.textContent).toContain('Glycine 5 g at t = 2 h')
    const summary = container.querySelector('figure > p')
    expect(summary.textContent).toContain('Glycine 5 g with a p5–p95 band')
    const tables = container.querySelectorAll('details table')
    expect(tables.length).toBe(2)
    expect(within(tables[0]).getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual(expect.arrayContaining(['Time (h)', 'Baseline (ratio)', 'Glycine 5 g p5', 'Glycine 5 g p95']))
    expect(tables[0].querySelectorAll('tbody tr').length).toBeLessThanOrEqual(24)
    expect(tables[1].textContent).toContain('Typical range (sample)')
    await expectAccessible(container)
  })

  it('hides a series from the legend toggle and says so with aria-pressed', async () => {
    const { container } = mountVapor(LineChartPlus, { props })
    const button = screen.getByRole('button', { name: /Glycine 5 g/ })
    expect(button.getAttribute('aria-pressed')).toBe('true')
    await fireEvent.click(button)
    expect(button.getAttribute('aria-pressed')).toBe('false')
    expect(container.querySelectorAll('.viz-line').length).toBe(1)
    expect(container.querySelectorAll('.viz-ribbon').length).toBe(0)
    await fireEvent.click(button)
    expect(container.querySelectorAll('.viz-line').length).toBe(2)
  })

  it('switches between linear and log axes', async () => {
    const { container } = mountVapor(LineChartPlus, { props })
    const log = screen.getByRole('button', { name: 'Log scale' })
    const before = [...container.querySelectorAll('.viz-tick')].map((tick) => tick.textContent).join('|')
    await fireEvent.click(log)
    expect(log.getAttribute('aria-pressed')).toBe('true')
    expect([...container.querySelectorAll('.viz-tick')].map((tick) => tick.textContent).join('|')).not.toBe(before)
  })

  it('moves a crosshair with the arrow keys, Home and End and reads the values aloud', async () => {
    const { container } = mountVapor(LineChartPlus, { props })
    const plot = container.querySelector('.viz-plot')
    const readout = container.querySelector('.viz-readout')
    expect(readout.getAttribute('aria-live')).toBe('polite')
    plot.focus()
    await fireEvent.focus(plot)
    expect(readout.textContent).toContain('0 h')
    await fireEvent.keyDown(plot, { key: 'ArrowRight' })
    expect(readout.textContent).toContain('0.5 h')
    await fireEvent.keyDown(plot, { key: 'ArrowRight', shiftKey: true })
    expect(readout.textContent).toContain('5.5 h')
    await fireEvent.keyDown(plot, { key: 'End' })
    expect(readout.textContent).toContain('24 h')
    expect(readout.textContent).toContain('Glycine 5 g')
    expect(readout.textContent).toContain('p5–p95')
    expect(container.querySelectorAll('.viz-crosshair').length).toBe(1)
    await fireEvent.keyDown(plot, { key: 'Home' })
    await fireEvent.keyDown(plot, { key: 'ArrowRight' })
    await fireEvent.keyDown(plot, { key: 'ArrowRight' })
    await fireEvent.keyDown(plot, { key: 'ArrowRight' })
    await fireEvent.keyDown(plot, { key: 'ArrowRight' })
    expect(readout.textContent).toContain('Event: Glycine 5 g at t = 2 h')
    await fireEvent.keyDown(plot, { key: 'Escape' })
    expect(container.querySelectorAll('.viz-crosshair').length).toBe(0)
  })

  it('works with a single series and no extras', async () => {
    const { container } = mountVapor(LineChartPlus, { props: { title: 'One', x: [0, 1, 2], series: [{ id: 'a', label: 'A', values: [1, 2, 1.5] }] } })
    expect(container.querySelectorAll('.viz-line').length).toBe(1)
    expect(container.querySelectorAll('details table').length).toBe(1)
    await expectAccessible(container)
  })
})
