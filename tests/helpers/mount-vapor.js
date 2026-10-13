// Shared helper for mounting Vapor components in tests.
//
// @vue/test-utils only knows the virtual DOM `createApp`. A Vapor component
// must be mounted with `createVaporApp`, exactly like src/main.js does, so
// this helper does that and nothing else. Query the result with
// @testing-library's `screen` or `container`.
//
//   const { container, unmount } = mountVapor(MyView, { props: { id: 1 } })
import { createVaporApp } from 'vue'
import { installLegacyInterop } from '../../src/vapor-interop.js'

const mounted = new Set()

export function mountVapor(Component, { props, plugins = [], attachTo } = {}) {
  const container = attachTo ?? document.body.appendChild(document.createElement('div'))
  const app = createVaporApp(Component, props)
  installLegacyInterop(app)
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

export function isVaporComponent(Component) {
  return Boolean(Component?.__vapor)
}

export function cleanupVapor() {
  for (const handle of [...mounted]) handle.unmount()
}
