import { fireEvent, screen, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { routes } from '../../src/routes.js'
import VizGallery from '../../src/views/dev/VizGallery.vue'
import { expectAccessible } from '../helpers/axe.js'
import { mountVapor } from '../helpers/mount-vapor.js'

describe('/dev/viz gallery', () => {
  it('is registered as a route', () => {
    expect(routes.find((route) => route.path === '/dev/viz')).toMatchObject({ name: 'dev-viz', title: 'Chart components' })
  })

  it('shows every primitive with sample data, labelled as illustrative', async () => {
    const { container } = mountVapor(VizGallery)
    expect(screen.getByRole('heading', { level: 1, name: 'Chart components' })).toBeTruthy()
    expect(container.querySelector('[role="note"]').textContent).toContain('invented')
    expect(container.querySelectorAll('figure').length).toBeGreaterThanOrEqual(9)
    for (const selector of ['.viz-line', '.viz-region--above', '.viz-seg', '.viz-spark', '.viz-heat', '.viz-lane', '.viz-gnode', '.viz-mnode', '.viz-segmented', 'input[type="range"]']) {
      expect(container.querySelector(selector), selector).toBeTruthy()
    }
    // every chart has a text alternative: a summary line and a table in a disclosure
    for (const figure of container.querySelectorAll('figure')) {
      expect(figure.querySelector('details'), figure.getAttribute('aria-labelledby')).toBeTruthy()
    }
    await expectAccessible(container)
  })

  it('has the heading levels in order', () => {
    const { container } = mountVapor(VizGallery)
    const levels = [...container.querySelectorAll('h1, h2, h3, h4')].map((heading) => Number(heading.tagName[1]))
    expect(levels[0]).toBe(1)
    expect(levels.every((level, index) => index === 0 || level - levels[index - 1] <= 1)).toBe(true)
  })

  it('updates the range chart status when its slider moves', async () => {
    const { container } = mountVapor(VizGallery)
    const section = container.querySelector('section[aria-labelledby="viz-range"]')
    const slider = within(section).getByRole('slider')
    expect(section.querySelector('.viz-status').textContent).toContain('Within the range')
    await fireEvent.update(slider, '3800')
    expect(section.querySelector('.viz-status').textContent).toContain('Above the UL')
    expect(section.querySelector('.viz-slider output').textContent).toBe('3800 mg/day')
  })

  it('selects a scenario with the segmented control', async () => {
    const { container } = mountVapor(VizGallery)
    const picker = container.querySelector('.viz-segmented')
    await fireEvent.update(within(picker).getByLabelText('Baseline'))
    expect(within(picker).getByLabelText('Baseline').checked).toBe(true)
    expect(within(picker).getByLabelText('Glycine 5 g').checked).toBe(false)
  })
})
