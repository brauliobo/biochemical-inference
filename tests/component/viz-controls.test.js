import { fireEvent, screen, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import LegendToggle from '../../src/viz/LegendToggle.vue'
import ScenarioPicker from '../../src/viz/ScenarioPicker.vue'
import SliderField from '../../src/viz/SliderField.vue'
import { seriesLook } from '../../src/viz/shapes.js'
import { expectAccessible } from '../helpers/axe.js'
import { mountVapor } from '../helpers/mount-vapor.js'

describe('SliderField', () => {
  const props = { id: 'dose', label: 'Glycine dose', unit: 'g', min: 0, max: 10, step: 0.5, modelValue: 4, hint: 'Per day' }

  it('is a labelled range input with the value, unit and limits printed', async () => {
    const { container } = mountVapor(SliderField, { props })
    const slider = screen.getByLabelText('Glycine dose')
    expect(slider.getAttribute('type')).toBe('range')
    expect([slider.getAttribute('min'), slider.getAttribute('max'), slider.getAttribute('step')]).toEqual(['0', '10', '0.5'])
    expect(slider.getAttribute('aria-valuetext')).toBe('4 g')
    expect(slider.getAttribute('aria-describedby')).toBe('dose-hint')
    expect(container.querySelector('output').textContent).toBe('4 g')
    expect(container.textContent).toContain('0 g')
    expect(container.textContent).toContain('10 g')
    expect(container.textContent).toContain('Per day')
    await expectAccessible(container)
  })

  it('emits the new number when moved', async () => {
    const seen = []
    mountVapor(SliderField, { props: { ...props, onInput: () => (value) => seen.push(value) } })
    const slider = screen.getByLabelText('Glycine dose')
    await fireEvent.update(slider, '7.5')
    expect(seen).toEqual([7.5])
  })

  it('can be disabled', () => {
    mountVapor(SliderField, { props: { ...props, disabled: true } })
    expect(screen.getByLabelText('Glycine dose').hasAttribute('disabled')).toBe(true)
  })
})

describe('ScenarioPicker', () => {
  const options = [{ value: 'base', label: 'Baseline' }, { value: 'gly', label: 'Glycine 5 g' }, { value: 'chol', label: 'Choline 1 g' }]

  it('is a fieldset of radio buttons with the current one checked', async () => {
    const { container } = mountVapor(ScenarioPicker, { props: { label: 'Scenario', options, modelValue: 'gly' } })
    const group = screen.getByRole('group', { name: 'Scenario' })
    const radios = within(group).getAllByRole('radio')
    expect(radios.map((radio) => radio.checked)).toEqual([false, true, false])
    expect(new Set(radios.map((radio) => radio.name)).size).toBe(1)
    await expectAccessible(container)
  })

  it('reports the chosen value', async () => {
    const seen = []
    mountVapor(ScenarioPicker, { props: { label: 'Scenario', options, modelValue: 'base', onChange: () => (value) => seen.push(value) } })
    await fireEvent.update(screen.getByLabelText('Choline 1 g'))
    expect(seen).toEqual(['chol'])
  })

  it('can keep its label for screen readers only', () => {
    const { container } = mountVapor(ScenarioPicker, { props: { label: 'Scenario', options, hideLabel: true } })
    expect(container.querySelector('legend').className).toContain('visually-hidden')
  })
})

describe('LegendToggle', () => {
  const items = [{ id: 'a', label: 'Scenario', look: seriesLook(0) }, { id: 'b', label: 'Baseline', look: seriesLook(6), dashed: true }, { id: 'c', label: 'Enzyme', kind: 'node', node: 'hexagon', tone: 'viz-s2' }, { id: 'd', label: 'Decreases', kind: 'sign', sign: 'decrease' }]

  it('has a pressed toggle button per entry with a swatch that is not only colour', async () => {
    const { container } = mountVapor(LegendToggle, { props: { items, hidden: ['b'] } })
    const buttons = within(container).getAllByRole('button')
    expect(buttons.map((button) => button.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'true', 'true'])
    expect(container.querySelectorAll('svg.viz-swatch')).toHaveLength(4)
    expect(container.querySelector('.viz-swatch__node')).toBeTruthy()
    expect(container.querySelector('.viz-swatch__head--filled')).toBeFalsy()
    expect(container.querySelector('.viz-swatch__head')).toBeTruthy()
    expect(container.querySelector('.viz-legend').getAttribute('aria-label')).toBe('Show or hide series')
    await expectAccessible(container)
  })

  it('says which entry was toggled', async () => {
    const seen = []
    const { container } = mountVapor(LegendToggle, { props: { items, onToggle: () => (id) => seen.push(id) } })
    await fireEvent.click(within(container).getByRole('button', { name: 'Baseline' }))
    expect(seen).toEqual(['b'])
  })
})
