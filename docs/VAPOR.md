# Vue Vapor mode

The whole app is mounted in Vapor mode (`createVaporApp(App).mount('#app')`,
`src/main.js`). Vapor compiles templates to direct DOM operations instead of a
virtual DOM. Every single-file component is `<script setup vapor>` with a Pug
template (`tests/unit/sfc-conventions.test.js` enforces it), so the virtual DOM
runtime and `vaporInteropPlugin` are gone: there is no interop layer to maintain.

## Versions

- `vue` is pinned to **3.6.0-rc.11**. Vapor ships in the 3.6 line, which is a
  release candidate; npm's `latest` tag is still 3.5.x. Upgrade deliberately:
  bump the exact version, run `npm test`, `npm run build` and
  `tests/component/vapor-support.test.js`.
- `@vitejs/plugin-vue` 6.0.10 compiles `<script setup vapor>`.
- `package.json` has `"overrides": { "vue": "$vue" }`. `@vitejs/plugin-vue` peers
  `vue@^3.2.25`, which semver does not satisfy with a prerelease, so without the
  override `npm install` fails with ERESOLVE. Delete the override when Vue 3.6 is
  stable.

## Writing a component

```vue
<script setup vapor>
import { ref } from 'vue'
const props = defineProps({ id: { type: String, required: true } })
const open = ref(false)
</script>

<template lang="pug">
button(type="button" :aria-expanded="open" @click="open = !open") {{ props.id }}
</template>
```

No `<style>` blocks: look comes from `src/styles` (see DESIGN_SYSTEM.md).
`tests/component/vapor-support.test.js` verifies pug templates, props, `defineEmits`,
slots with props, `v-model` (text and select), `v-for`, `v-if`, template refs and
`provide`/`inject`. `tests/component/ui-kit.test.js` covers `defineModel`, `$attrs`
forwarding, named slots and events across the shared components in `src/ui`.

## Testing Vapor components

Use `tests/helpers/mount-vapor.js`:

```js
import { mountVapor } from '../helpers/mount-vapor.js'
const { container, unmount } = mountVapor(MyView, { props: { id: 'a' } })
```

and query with `screen` / `fireEvent` from `@testing-library/vue`. `render(Component)`
also works: it mounts through `mountVapor`. Mounted components are unmounted after
each test by `tests/setup.js`. To test a composable with real lifecycle hooks run it
inside `tests/fixtures/vapor/Setup.vue` (see `tests/component/composables.test.js`).

Accessibility: `expectAccessible()` from `tests/helpers/axe.js` runs axe (WCAG 2.2 AA
and best practices) over what is mounted. Every workbench test calls it in a populated
state.

### Why the vitest config looks unusual

1. **The Node entry of `vue` has no Vapor.** `vue/index.mjs` re-exports the CJS
   build; `createVaporApp` appears only in the ESM bundler/browser builds. Under vitest,
   `import { createVaporApp } from 'vue'` is `undefined`. Workaround (`vite.config.js`,
   `test.alias`): resolve `vue`, `@vue/runtime-dom`, `runtime-core`, `reactivity` and
   `shared` to their `*.esm-bundler.js` files, and inline `@vue/*` and `vue` so there is
   a single Vue instance.
2. **`@vue/test-utils` cannot mount Vapor components** (its `mount` uses the vdom
   `createApp`), and `@testing-library/vue` is CommonJS and requires it. So neither is
   a dependency: `tests/helpers/testing-library-vue.js` is a small ESM replacement with
   the same `render`, `screen`, `fireEvent` (including `fireEvent.update`) API on top of
   `@testing-library/dom`, aliased to `@testing-library/vue` in `vite.config.js`.
   `mountVapor()` uses `createVaporApp`, exactly like production.

## Vapor behaviour that matters in this project

Found by running the code; each has a test or a comment where it is handled.

- Vapor supports `<script setup>` and template-only SFCs only (no Options API,
  `setup()`, render functions or JSX). `getCurrentInstance()` returns `null`;
  `<Suspense>` is not supported (code-splitting uses `defineVaporAsyncComponent`, see
  `src/ui/lazy.js`).
- Root props of `createVaporApp` (so `mountVapor(Component, { props })`) are read as
  getters: a function value is called, so pass a listener as `() => listener`. They
  cannot change after mount; drive prop changes and events through a small host
  component with a shared `reactive` store (`tests/fixtures/vapor/SpatialTissueHost.vue`).
  `render().emitted()` and `rerender()` do not exist.
- Whitespace at the start or end of an element's text is trimmed. A space between
  inline elements, or after one, must come from an interpolation:
  ``span {{ ` ${relation} ` }}``, not `span  text`.
- `v-model:name` on a component needs the camelCase prop name (`v-model:taxonId`, not
  `v-model:taxon-id`); the kebab form does not bind the initial value.
- A listener on the native element runs **before** `v-model` has updated the bound
  state. Handlers of `InputField` and `SelectField` therefore receive the new value as
  their argument (`@input="use($event)"`); never re-read the bound ref inside them.
- `$attrs` forwarding works: `defineOptions({ inheritAttrs: false })` plus
  `v-bind="$attrs"` on the inner control (`src/ui/InputField.vue`, `SelectField.vue`).
- A `<div role="status">` that is empty adds no gap in a `.stack`, so keep live regions
  in the DOM and put the message inside them (`src/ui/LiveMessage.vue`).
- Async work resolves a few microtasks later than the same code written inline. Show
  data and the state that goes with it in one step (`done` in `useTask`/`useWorkflow`)
  and have tests wait for the control they use (`tests/helpers/interactions.js`)
  rather than counting ticks.

If you meet something that does not work, add it here with the failing snippet or
test name and the narrowest workaround. Do not silently fall back to a non-Vapor
component.
