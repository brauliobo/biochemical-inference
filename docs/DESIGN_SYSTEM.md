# Design system

Plain CSS in `src/styles/`, imported once by `src/main.js` through
`src/styles/index.css`. No preprocessor, no utility framework.

| File | Contains | May contain raw values? |
|---|---|---|
| `tokens.primitive.css` | Raw scales: colour ramps, space, type, radius, border, shadow, motion, z-index, sizes | **Yes, the only file** |
| `tokens.semantic.css` | Role tokens (`--color-text`, `--space-stack`, ...). Each is a `var()` of a primitive; colours are `light-dark(light, dark)` | No |
| `base.css` | Reset and element defaults | No, semantic tokens only |
| `layout.css` | Layout primitives (`.stack`, `.cluster`, `.grid`, ...) | No, semantic tokens only |
| `components.css` | The few shared component classes | No, semantic tokens only |
| `legacy-workbench.css` | The old global stylesheet, scoped under `.legacy-workbench`. Loaded only by the workbench routes | Yes, **allowlisted, to be emptied** |

Rules:

1. Write markup with layout primitives and component classes first. Add CSS only
   when they cannot express it.
2. In `base`, `layout`, `components` and any SFC `<style>`: use semantic tokens.
   Never a primitive token, a hex colour, or a `px`/`rem` literal.
3. Need a value that has no token? Add the primitive, then a semantic token that
   names its role, then use that.
4. Dark mode is automatic (`color-scheme: light dark`). A subtree can force a
   scheme with `color-scheme: dark`, which is how `.legacy-workbench` stays dark.
5. Interactive controls are at least `--target-min` (44 px) tall. Never remove
   the `:focus-visible` outline from `base.css`.

`tests/unit/design-tokens.test.js` enforces rules 2 and 3 (raw colours, `px`/`rem`
lengths and font literals in any `src/**/*.css` or `.vue` `<style>`, plus token
layering). `tests/unit/design-contrast.test.js` checks WCAG contrast of every
semantic colour pair in light and dark.

## Semantic tokens

Colour (light/dark pairs; all verified for contrast):
`--color-text`, `--color-text-muted`, `--color-text-inverse`,
`--color-surface`, `--color-surface-raised`, `--color-surface-sunken`,
`--color-border`, `--color-border-strong` (3:1, for control edges),
`--color-selection`, `--color-link`, `--color-link-hover`, `--color-link-visited`,
`--color-focus-ring`, `--color-accent`, `--color-accent-hover`, `--color-accent-text`
(text on accent), and for each of `success`, `warning`, `danger`, `info`:
`--color-<status>-text`, `--color-<status>-surface`, `--color-<status>-border`.

Space: `--space-stack-tight` (.5rem), `--space-stack` (1), `--space-stack-loose` (2),
`--space-cluster` (.75), `--space-cluster-tight` (.25), `--space-inset-tight` (.5),
`--space-inset` (1), `--space-inset-loose` (1.5), `--space-control-inline` (.75),
`--space-gutter` (1), `--space-section` (3).

Type: `--font-body`, `--font-heading`, `--font-code`; sizes `--text-caption` (.75rem),
`--text-small`, `--text-body` (1rem), `--text-lead`, `--text-code`, `--text-h4`,
`--text-h3`, `--text-h2`, `--text-h1`; `--leading-body`, `--leading-prose`,
`--leading-heading`, `--leading-compact`; `--weight-body`, `--weight-strong`,
`--weight-heading`; `--tracking-heading`, `--tracking-label`; `--measure` (68ch).

Shape and depth: `--radius-control`, `--radius-card`, `--radius-pill`,
`--border-width`, `--border-width-strong`, `--border-width-accent`,
`--shadow-card`, `--shadow-raised`, `--shadow-overlay`.

Interaction and motion: `--target-min`, `--focus-ring-width`, `--focus-ring-offset`,
`--motion-fast`, `--motion-base`, `--motion-slow` (all `0ms` under
`prefers-reduced-motion`), `--motion-ease`.

Stacking and layout: `--z-raised`, `--z-sticky`, `--z-overlay`, `--z-skip-link`;
`--container-max`, `--container-prose`, `--container-wide`, `--sidebar-width`,
`--grid-min`, `--icon-size`.

## Layout primitives and components

Layout: `.container` (`--narrow`, `--wide`), `.prose`, `.stack` (`--tight`, `--loose`,
`--section`), `.cluster`, `.repel`, `.grid`, `.sidebar`, `.inset` (`--loose`), `.page`,
`.visually-hidden`. Tune spacing with the local property, for example
`style="--stack-space: var(--space-stack-loose)"` (also `--cluster-space`, `--grid-space`).

Components: `.skip-link`, `.site-header`, `.site-title`, `.site-nav`, `.site-main`,
`.site-footer`, `.eyebrow`, `.lede`, `.muted`, `.button` (`--secondary`), `.card`
(also on `<a>`), `.badge` (`--success`, `--warning`, `--danger`), `.notice`
(`--warning`, `--danger`, `--success`; add `role="status"` or `role="alert"`),
`.plain-list`.

Breakpoints cannot be tokens. Prefer `.grid` and `.sidebar`, which need none; when a
media query is unavoidable use `40rem` (narrow) and `64rem` (wide).

### Workbench patterns

Added while migrating the workbenches; every migrated workbench is built from these.

Layout modifiers: `.cluster--bottom` (align to the bottom edge), `.cluster--tight`,
`.grid--compact` (narrower columns), `.grid--end`, `.grid--fixed` (matrix: set
`--grid-columns`), `.sidebar--end` (side column last in the source order) and
`.scroll-x` (a wide table or map that scrolls inside its own box; give it
`tabindex="0"`, `role="region"` and an `aria-label`).

Component classes: `.card--flat` (nested, sunken box), `.metrics` (`--wide`,
`--compact`: a grid of labelled values, `dl > div > dt + dd`), `.facts` (label left,
value right), `.digest` (long hashes and identifiers), `.form` (label above control,
controls fill the column) and `.choice` (checkbox or radio with its text), `.tile` (a
full-width button that selects one item; `aria-pressed` marks the selection),
`.button--danger`, `.button--secondary[aria-pressed="true"]` (a toggle that is on),
`.progress` (native `<progress>`), `.scene` (WebGL host or its text fallback),
`.chart`, `.chart__axis`, `.chart__gridline`, `.chart__tick`, `.chart__line`
(`--compare`) and `.swatch` (`--dot`, `--diamond`; set `--swatch-color` inline to a
semantic colour). `details > summary` shows an arrow.

Shared Vue components in `src/components/ui/` (`<script setup vapor>` + pug):

| Component | Props and slots | Renders |
|---|---|---|
| `Section` | `title`, `titleId` (required), `eyebrow`, `lede`, `level` (2, 3 or 4), `status`, `tone`, `flat`; default slot | A labelled card (`section` with `aria-labelledby`): eyebrow, heading, state badge announced as `role="status"`, lede, content stacked |
| `Metric` | `label` (required), `value`, `note`, `mono`, `large`; default and `note` slots | One `div > dt + dd` for `dl.metrics` or `dl.facts` |
| `Toolbar` | `label` (required), `end`; default slot | A named `role="group"` row of controls that wraps |
| `ChartFrame` | `id`, `title` (required), `value`, `summary`, `tableLabel`; default, `legend` and `table` slots | A `figure` with caption, the chart, a visible text summary and the data table behind a disclosure |

`ui/tone.js` maps a state word to `success`, `warning` or `danger` (`statusTone`,
`badgeClass`); the word is always printed, colour only reinforces it.
`ui/scene-colors.js` reads semantic tokens as three.js colours at runtime
(`readSceneColors`), so WebGL scenes follow the active light or dark scheme.

Heading levels: the page `h1`, one `Section` (`h2`) per panel, `Section level="3"`
or an `h3` inside it, `h4` below that. Never skip a level.

## Mapping guide: old pattern to system

Use this when migrating a workbench off `legacy-workbench.css`.

### Colours

| Old | New |
|---|---|
| `--ink`, `#dce9e4` | `--color-text` |
| `--muted`, `#8fa8a1`, `#b3c7c1` | `--color-text-muted` |
| `--line`, `#28403c`, `1px solid var(--line)` | `--color-border`; with `var(--border-width) solid` |
| `#3b5752`, `#4b6b64` (control borders) | `--color-border-strong` |
| `--panel`, `rgba(18, 31, 29, .92)` | `--color-surface-raised` |
| `--panel-bright`, `#0d1816`, `#0f1a18`, `#101b19` and similar dark fills | `--color-surface-sunken` |
| `--mint` as link or label text | `--color-link` |
| `--mint` / `--lime` as a fill (primary button, selected state) | `--color-accent` with `--color-accent-text` on it |
| `outline: 3px solid var(--lime)` | delete; `base.css` `:focus-visible` provides it |
| `--amber`, `#e3bc8a`, `#211b14` warning panels | `--color-warning-border`, `-text`, `-surface` (`.notice--warning`) |
| `--danger`, `#2b201e` error panels | `--color-danger-border`, `-text`, `-surface` (`.notice--danger`) |
| `#10231f` ok/verified panels | `--color-success-surface`, `-text`, `-border` |
| `#79a9d4` informational accents | `--color-info-border` |
| Radial or linear gradient backgrounds | remove, or `--color-surface-sunken` |

### Space (rem to token; snap off-scale values to the nearest)

| Old | New |
|---|---|
| up to `.35rem` | `--space-cluster-tight` |
| `.4` to `.6rem` | `--space-inset-tight` (padding) or `--space-stack-tight` (gap) |
| `.65` to `.9rem` | `--space-cluster` (gap) or `--space-control-inline` (padding) |
| `.95` to `1.3rem` | `--space-inset` (padding) or `--space-stack` (gap) |
| `1.4` to `1.8rem` | `--space-inset-loose` |
| `1.9` to `2.5rem` | `--space-stack-loose` |
| `3rem` and up | `--space-section` |

### Type

| Old | New |
|---|---|
| `font: .7rem ui-monospace, ...` (small mono caps) | `font-family: var(--font-code)`, `font-size: var(--text-caption)`; add `text-transform: uppercase; letter-spacing: var(--tracking-label)` |
| `font-size` `.75` to `.9rem` | `--text-small` |
| `font-size: 1rem` | `--text-body` |
| `font-size` `1.05` to `1.25rem` | `--text-lead` or `--text-h4` |
| `clamp(...)` headings | `--text-h2`, `--text-h1` (already fluid) |
| `font-weight: 600` / `700` | `--weight-strong` / `--weight-heading` |
| `line-height` `1.45` / `1.5` to `1.6` | `--leading-compact` / `--leading-body` |
| `Inter, ...` / `ui-monospace, ...` | `--font-body` / `--font-code` |
| `.kicker`, `.eyebrow` | `.eyebrow` |

Text under 12 px (`.62rem` to `.68rem`) rounds up to `--text-caption`. That is a
deliberate readability gain, not a regression.

### Shape and size

| Old | New |
|---|---|
| `border-radius: 2px` | `--radius-control` |
| `border-radius: 999px` | `--radius-pill` |
| `border: 1px solid` | `border: var(--border-width) solid` |
| `border-left: 3px solid` (callout bar) | `.notice`, or `--border-width-accent` |
| `min-height: 44px` / `46px` | `--target-min` |
| `max-width: 1500px` | `.container` |

### Layout and components

| Old | New |
|---|---|
| `display: grid; grid-template-columns: repeat(N, minmax(0, 1fr))` plus a media query that collapses it | `.grid` |
| Fixed side column plus content that collapses | `.sidebar` |
| `display: flex; justify-content: space-between; gap` | `.repel` (`.section-heading` is this) |
| `display: flex; flex-wrap: wrap; gap` (tags, button rows) | `.cluster` |
| `margin-top` between stacked siblings | `.stack` |
| Padded, bordered, raised box | `.card` |
| `.run-button` / `.secondary` | `.button` / `.button.button--secondary` |
| `.status-chip` and its state classes | `.badge` (`--success`, `--warning`, `--danger`) |
| `.alert`, `.alert.error`, `.previous-note` | `.notice`, `.notice--danger`, `.notice--warning` |
| `.sr-only`, `.visually-hidden` | `.visually-hidden` |
| `@media (max-width: 760px)` collapsing grids | delete, `.grid` and `.sidebar` reflow by themselves |
| `@media (prefers-reduced-motion)` block | delete, `base.css` handles it |

### Migrating one workbench

1. Open its component and the matching rules in `legacy-workbench.css` (search by
   the root class, for example `.portfolio-panel`).
2. Rewrite the template with layout primitives and component classes; keep
   existing `data-testid` and accessible names so tests and e2e specs still pass.
3. Move any leftover, truly unique rules into the component's `<style scoped>`
   using semantic tokens only.
4. Delete the migrated rules from `legacy-workbench.css`.
5. If the component had a `<style>` block listed in
   `tests/unit/design-tokens.allowlist.json`, remove it from the list once clean;
   the test fails if a listed file has no violations left.
6. Set `legacy: false` on its entry in `src/workbenches.js` so it is no longer
   wrapped in `.legacy-workbench`, convert it to `<script setup vapor>` +
   `<template lang="pug">`, and delete it from
   `tests/unit/sfc-conventions.allowlist.json`. When the last workbench is done,
   delete `legacy-workbench.css`, its import in `WorkbenchView.vue`, and its
   allowlist entry.
