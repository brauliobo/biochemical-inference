# Vue Vapor mode

The whole app is mounted in Vapor mode (`createVaporApp(App).mount('#app')`,
`src/main.js`). Vapor compiles templates to direct DOM operations instead of a
virtual DOM.

## Versions

- `vue` is pinned to **3.6.0-rc.11**. Vapor ships in the 3.6 line, which is a
  release candidate; npm's `latest` tag is still 3.5.x. Upgrade deliberately:
  bump the exact version, run `npm test`, `npm run build` and
  `tests/component/vapor-support.test.js`.
- `@vitejs/plugin-vue` 6.0.10 compiles `<script setup vapor>`.
- `package.json` has `"overrides": { "vue": "$vue" }`. `@vue/test-utils` peers
  `vue@3.x`, which semver does not satisfy with a prerelease, so without the
  override `npm install` fails with ERESOLVE. Delete the override when Vue 3.6
  is stable.
- The same `overrides` block pins every `@vue/*` package to 3.6.0-rc.11 and
  `@vue/server-renderer` is an explicit devDependency. Without them npm resolves
  `@vue/test-utils`' peer `@vue/compiler-dom@3.x` to 3.5.x, hoists mixed 3.5/3.6
  copies, and leaves `@vue/server-renderer` nested under `node_modules/vue/`, so a
  clean `npm ci` makes every vitest file fail with `Could not resolve
  "@vue/server-renderer" imported by "@vue/test-utils"`. Keep these versions in
  step with `vue` when upgrading.

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

`<script setup vapor>` and `<template lang="pug">` on every SFC.
`tests/component/vapor-support.test.js` verifies pug templates, props,
`defineEmits`, slots with props, `v-model` (text and select), `v-for`, `v-if`,
template refs, `provide`/`inject`, `<style scoped>`, and events from a vdom child
received with `$event`. The shell and the converted single-page workbench
(`tests/component/shell.test.js`, `app-hardening.test.js`) also exercise
`v-model.number`, `<component :is>`, class fallthrough to a component's root,
and `defineVaporAsyncComponent` loading both Vapor and vdom components.

## Legacy components and the interop plugin

The 19 components in `src/components/` are virtual-DOM components that have not
been migrated yet. A Vapor tree can host them only with `vaporInteropPlugin`,
which also loads the vdom runtime. That is isolated in one file,
`src/vapor-interop.js`, called from `src/main.js` and from
`tests/helpers/mount-vapor.js`. Delete the file and those two calls when
`tests/unit/sfc-conventions.allowlist.json` is empty.

Verified: all 19 render and behave identically under interop (their existing
component tests pass unchanged), and the old single-page app, converted to
Vapor, passes `tests/component/app-hardening.test.js`.

## Testing Vapor components

Use `tests/helpers/mount-vapor.js`:

```js
import { mountVapor } from '../helpers/mount-vapor.js'
const { container, unmount } = mountVapor(MyView, { props: { id: 'a' } })
```

and query with `screen` / `fireEvent` from `@testing-library/vue`. Existing
tests that call `render(Component)` also work: `render` mounts a Vapor
component through `mountVapor`. Mounted components are unmounted after each
test by `tests/setup.js`.

### Why the vitest config looks unusual

Evidence and narrowest workaround for each:

1. **The Node entry of `vue` has no Vapor.** `vue/index.mjs` re-exports the CJS
   build; `createVaporApp` appears only in the ESM bundler/browser builds.
   Under vitest, `import { createVaporApp } from 'vue'` is `undefined`.
   Workaround (`vite.config.js`, `test.alias`): resolve `vue`,
   `@vue/runtime-dom`, `runtime-core`, `reactivity` and `shared` to their
   `*.esm-bundler.js` files, and inline `@vue/*` and `vue` so there is a single
   Vue instance.
2. **`@vue/test-utils` cannot mount Vapor components.** Its `mount` uses the
   vdom `createApp` and its dist has no Vapor code (2.4.11 installed; 2.5.1 is
   the latest and also has none). Workaround: `mountVapor()` uses
   `createVaporApp`, exactly like production. Vdom components are still mounted
   with `@vue/test-utils`.
3. **`@testing-library/vue` is CommonJS.** It `require`s `@vue/test-utils`,
   which resolves to the CJS build and a second CJS copy of Vue with separate
   reactivity: components render but never update (observed: components stuck
   on their loading state). Workaround: `tests/helpers/testing-library-vue.js`,
   an ESM drop-in with the same API (`render`, `fireEvent` incl. `update`,
   `cleanup`, all of `@testing-library/dom`), aliased in `vite.config.js`. Its
   promise chain deliberately matches the original's microtask count, because
   `tests/component/evidence-panel.test.js` is sensitive to it.

## Known Vapor limits that apply to this project

From the [Vue 3.6.0-rc.1 release notes](https://github.com/vuejs/core/releases/tag/v3.6.0-rc.1);
items marked "not exercised" were not tried here.

- Vapor supports `<script setup>` and template-only SFCs only. No Options API,
  no `setup()` function, no render functions or JSX (those stay vdom and need
  interop). Not exercised.
- `getCurrentInstance()` returns `null`, and `app.config.globalProperties`,
  `v-memo` and `@vue:mounted`-style vnode hooks are unavailable. Not exercised;
  none are used in `src/`.
- `<Suspense>` is not supported in a pure Vapor app. Not used; code-splitting
  uses `defineVaporAsyncComponent` (`src/ui/lazy.js`).
- Custom directives take reactive getters, not binding objects. None exist.
- Event listeners attach to the element, not the document (since 3.6.0-rc.2);
  use `.delegate` to opt in to delegation. Nothing here depends on it.
- Vapor slots cannot be called as `slots.default()` from inside a vdom
  component. When a legacy component needs slot content from a Vapor parent,
  migrate it rather than working around this.

- Root props of `createVaporApp` (so `mountVapor(Component, { props })`) are read
  as getters: a function value is called at mount and its return value used, so an
  `onSomething` callback is invoked once with no arguments and never receives the
  event, and the props cannot change after mount. Drive a component that emits
  events or needs prop changes through a small host component with a shared
  `reactive` store (`tests/fixtures/vapor/SpatialTissueHost.vue`, used by
  `tests/component/spatial-tissue-workbench.test.js`); `render().emitted()` and
  `rerender()` are not available for Vapor.
- Whitespace at the start or end of an element's text is trimmed. A space between
  inline elements, or after one, must come from an interpolation:
  ``span {{ ` ${relation} ` }}``, not `span  text`.
- A virtual-DOM component that hosts a migrated (Vapor) child needs
  `vaporInteropPlugin` in its test mount; `tests/helpers/testing-library-vue.js`
  installs it for every vdom `render()`.

If you meet something that does not work, add it here with the failing snippet
or test name and the narrowest workaround. Do not silently fall back to a
non-Vapor component.
