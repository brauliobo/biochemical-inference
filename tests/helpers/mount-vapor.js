// Mounts Vapor components in tests, exactly like src/main.js does
// (`createVaporApp`), because @vue/test-utils only knows the virtual DOM.
// Query the result with @testing-library's `screen` or `container`.
//
//   const { container, unmount } = mountVapor(MyView, { props: { id: 1 } })
import { createVaporApp } from 'vue'

const mounted = new Set()

export function mountVapor(Component, { props, plugins = [], attachTo } = {}) {
  const container = attachTo ?? document.body.appendChild(document.createElement('div'))
  const app = createVaporApp(Component, props)
  for (const plugin of plugins) app.use(plugin)
  app.mount(container)

  const handle = {
    app,
    container,
    html: () => container.innerHTML,
    unmount() {
      if (!mounted.delete(handle)) return
      app.unmount()
      if (!attachTo) container.remove()
    }
  }
  mounted.add(handle)
  return handle
}

export function cleanupVapor() {
  for (const handle of [...mounted]) handle.unmount()
}
