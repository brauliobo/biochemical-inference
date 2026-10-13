// ESM drop-in for '@testing-library/vue' (aliased in vite.config.js), so tests
// import `render`, `screen`, `fireEvent` ... as usual. It is the same small API
// on top of @testing-library/dom, and `render` mounts Vapor components through
// mountVapor(). (The real package is CommonJS and needs @vue/test-utils, which
// cannot mount Vapor components; see docs/VAPOR.md.)
import { fireEvent as domFireEvent, getQueriesForElement, prettyDOM, waitFor } from '@testing-library/dom'
import { cleanupVapor, mountVapor } from './mount-vapor.js'

export * from '@testing-library/dom'

export function render(Component, { container: customContainer, baseElement: customBaseElement, props, global } = {}) {
  const baseElement = customBaseElement || customContainer || document.body
  const container = customContainer || baseElement.appendChild(document.createElement('div'))
  const handle = mountVapor(Component, { props, plugins: global?.plugins, attachTo: container })

  return {
    container,
    baseElement,
    debug: (el = baseElement, maxLength, options) =>
      (Array.isArray(el) ? el : [el]).forEach((item) => console.log(prettyDOM(item, maxLength, options))),
    unmount: () => handle.unmount(),
    html: () => handle.html(),
    ...getQueriesForElement(baseElement)
  }
}

export const cleanup = cleanupVapor

// Vue flushes asynchronously, so every dispatch is followed by a tick. Keep the
// promise chain exactly this long: some component tests are sensitive to the
// number of microtasks between a dispatch and the next query.
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
