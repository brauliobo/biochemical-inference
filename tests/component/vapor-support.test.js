import { fireEvent } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { mountVapor } from '../helpers/mount-vapor.js'
import Parent from '../fixtures/vapor/Parent.vue'

// Documents what works in Vapor mode here (see docs/VAPOR.md). If a Vue
// upgrade breaks one of these, the app needs attention before anything else.
describe('Vapor support', () => {
  it('runs pug templates, slots, emits, v-model, refs and provide/inject', async () => {
    const { container } = mountVapor(Parent)
    const $ = (selector) => container.querySelector(selector)

    expect($('.child').textContent).toBe('slot-Ldark')
    expect(container.querySelectorAll('li')).toHaveLength(2)

    await fireEvent.click($('.child'))
    expect($('.picked').textContent).toBe('7')

    await fireEvent.update($('.text'), 'zed')
    expect($('.upper').textContent).toBe('ZED')
    await fireEvent.update($('.sel'), 'y')
    expect($('.choice').textContent).toBe('y')

    await fireEvent.click($('.focus'))
    expect(document.activeElement).toBe($('.box'))
  })

  it('unmounts cleanly', () => {
    const handle = mountVapor(Parent)
    handle.unmount()
    expect(handle.container.isConnected).toBe(false)
  })
})
