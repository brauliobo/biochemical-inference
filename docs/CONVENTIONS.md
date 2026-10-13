# Front-end conventions

Short rules for everything under `src/`. Background: [VAPOR.md](VAPOR.md),
[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), [USABILITY.md](USABILITY.md).

## Single-file components

Every SFC is Vapor and Pug:

```vue
<script setup vapor>
import { computed } from 'vue'
import { useRoute } from '../router.js'

const route = useRoute()
const title = computed(() => route.params.slug)
</script>

<template lang="pug">
.stack
  h1 {{ title }}
  p.lede.
    Multi-line text uses the trailing dot.
  RouterLink.button(to="/kb") Back
</template>
```

Pug conventions:

- Classes and ids use the shorthand (`.stack`, `main#main`), attributes go in
  parentheses (`a(:href="url" :aria-current="state")`), directives as usual
  (`v-if`, `v-for`, `@click`, `v-model`).
- Prefer semantic elements (`header`, `nav`, `section`, `ul`, `button`, `a`)
  and layout primitives over `div` plus custom classes.
- Inline markup in text: `#[code npm ci]`. A literal pipe line: `| text`.
- Two-space indentation, one root element where possible.
- Logic stays in `<script setup>` (or a `.js` module); templates hold no
  business rules.
- Styles: layout primitives and semantic tokens only; see the design system.

Do not add a non-Vapor SFC. If Vapor cannot do something, document it in
[VAPOR.md](VAPOR.md) with the evidence.

## Routes

Hash router (`src/router.js`): URLs look like `https://host/base/#/kb/glycine`,
so it works from any base path with no server rewrites. Registering a page is
one line in `src/routes.js` plus the view file:

```js
{ name: 'kb-entity', path: '/kb/:type/:slug', title: 'Knowledge base', load: () => import('./views/kb/KbEntityView.vue') }
```

- `useRoute()` returns the reactive route: `path`, `params`, `query`, `route`,
  `title`. Read `route.params` inside templates or `computed`/`watch`, never once
  in setup, because the same view instance is reused when only a param changes.
- `setPageTitle(text)` sets the page title once data is known; the shell updates
  `document.title` and announces it.
- Link with `<RouterLink to="/kb/enzymes">`; add `section` on navigation links
  that should stay marked while on a descendant route. Plain in-page anchors
  (`#id`) are ignored by the router.
- `navigate('/kb')` for programmatic navigation.
- Workbenches register in `src/workbenches.js`, not in `routes.js`.

## Static mode

`npm run build:static` (also what the Pages workflow runs) sets
`VITE_STATIC_MODE=true`: there is no API. Use `isStaticMode()` from
`src/runtime-mode.js`; render `ui/ApiRequired.vue` instead of anything that calls
`src/api.js`. Knowledge pages must never need the API.

## Tests

- Vapor components: `mountVapor()` from `tests/helpers/mount-vapor.js`, or
  `render()` from `@testing-library/vue` (which delegates to it).
- Navigate in tests with `navigate('/path')` before mounting `App.vue`.
- Add every new knowledge route to `ROUTES` in `tests/e2e/shell.spec.js`
  (axe, keyboard, 44 px targets).
- `npm test`, `npm run check:syntax`, `npm run build`, `npm run build:static`
  must stay green.
