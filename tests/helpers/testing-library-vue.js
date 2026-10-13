// ESM drop-in for '@testing-library/vue' (aliased in vite.config.js), so every
// existing `import { render, screen, fireEvent } from '@testing-library/vue'`
// keeps working unchanged.
//
// Why it exists: the real package is CommonJS and `require`s a second, CJS copy
// of Vue (with no Vapor and a different reactivity instance) next to the ESM
// copy our components use. This file is the same small API on top of the ESM
// @vue/test-utils, plus one extra: `render` mounts Vapor components through
// mountVapor().
import { mount } from '@vue/test-utils'
import { fireEvent as domFireEvent, getQueriesForElement, prettyDOM, waitFor } from '@testing-library/dom'
import { cleanupVapor, isVaporComponent, mountVapor } from './mount-vapor.js'

export * from '@testing-library/dom'

const mountedWrappers = new Set()

export function render(Component, { container: customContainer, baseElement: customBaseElement, ...mountOptions } = {}) {
  const baseElement = customBaseElement || customContainer || document.body
  const container = customContainer || baseElement.appendChild(document.createElement('div'))

  let unmount
  let html
  let emitted
  let rerender

  if (isVaporComponent(Component)) {
    const handle = mountVapor(Component, { props: mountOptions.props, plugins: mountOptions.global?.plugins, attachTo: container })
    unmount = () => handle.unmount()
    html = () => handle.html()
    emitted = () => { throw new Error('emitted() is not available for Vapor components; assert on the DOM or a callback prop.') }
    rerender = () => { throw new Error('rerender() is not available for Vapor components; remount instead.') }
  } else {
    const wrapper = mount(Component, { ...mountOptions, attachTo: container })
    // Remove the extra wrapping div VTU adds.
    wrapper.element.parentElement.replaceWith(...wrapper.element.parentElement.childNodes)
    mountedWrappers.add(wrapper)
    unmount = () => wrapper.unmount()
    html = () => wrapper.html()
    emitted = (name) => wrapper.emitted(name)
    rerender = (props) => wrapper.setProps(props)
  }

  return {
    container,
    baseElement,
    debug: (el = baseElement, maxLength, options) =>
      (Array.isArray(el) ? el : [el]).forEach((item) => console.log(prettyDOM(item, maxLength, options))),
    unmount,
    html,
    emitted,
    rerender,
    ...getQueriesForElement(baseElement)
  }
}

export function cleanup() {
  cleanupVapor()
  for (const wrapper of mountedWrappers) {
    const host = wrapper.element?.parentNode
    if (host?.parentNode === document.body) document.body.removeChild(host)
    wrapper.unmount()
  }
  mountedWrappers.clear()
}

// Vue flushes asynchronously, so every dispatch is followed by a tick. Keep the
// promise chain exactly this long: some component tests are sensitive to the
// number of microtasks between a dispatch and the next query, and this matches
// the original package.
const settle = () => waitFor(() => {}).then(() => {})

export function fireEvent(...args) {
  domFireEvent(...args)
  return settle()
}

for (const key of Object.keys(domFireEvent)) {
  fireEvent[key] = (...args) => {
    domFireEvent[key](...args)
    return settle()
  }
}

fireEvent.touch = async (elem) => {
  await fireEvent.focus(elem)
  await fireEvent.blur(elem)
}

// Helper for v-model controls: set the value, then fire the matching event.
fireEvent.update = (elem, value) => {
  switch (elem.tagName) {
    case 'OPTION': {
      elem.selected = true
      const select = elem.parentElement.tagName === 'OPTGROUP' ? elem.parentElement.parentElement : elem.parentElement
      return fireEvent.change(select)
    }
    case 'INPUT':
      if (['checkbox', 'radio'].includes(elem.type)) {
        elem.checked = true
        return fireEvent.change(elem)
      }
      if (elem.type === 'file') return fireEvent.change(elem)
      elem.value = value
      return fireEvent.input(elem)
    case 'TEXTAREA':
      elem.value = value
      return fireEvent.input(elem)
    case 'SELECT':
      elem.value = value
      return fireEvent.change(elem)
    default:
      return null
  }
}
