# Design system

Plain CSS in `src/styles/`, imported once by `src/main.js` through
`src/styles/index.css`. No preprocessor, no utility framework, no per-component
`<style>` blocks. Vue components for the system live in `src/ui/`.

| File | Contains | May contain raw values? |
|---|---|---|
| `tokens.primitive.css` | Raw scales: colour ramps, space, type, radius, border, shadow, motion, z-index, sizes | **Yes, the only file** |
| `tokens.semantic.css` | Role tokens (`--color-text`, `--space-stack`, ...). Each is a `var()` of a primitive; colours are `light-dark(light, dark)` | No |
| `base.css` | Reset and element defaults | No, semantic tokens only |
| `layout.css` | Layout primitives (`.stack`, `.cluster`, `.grid`, ...) | No, semantic tokens only |
| `components.css` | The component classes behind `src/ui` | No, semantic tokens only |

Rules:

1. Write markup with layout primitives, `src/ui` components and component classes
   first. Add CSS only when they cannot express it, and then to `components.css`.
2. In `base`, `layout`, `components` and any inline `style=""`: use semantic tokens.
   Never a primitive token, a hex colour, or a `px`/`rem` literal.
3. Need a value that has no token? Add the primitive, then a semantic token that
   names its role, then use that.
4. Dark mode is automatic (`color-scheme: light dark`). A subtree can force a scheme
   with `color-scheme`.
5. Interactive controls are at least `--target-min` (44 px) tall. Never remove the
   `:focus-visible` outline from `base.css`.
6. Inline `style` is for one custom property only (`--heat`, `--grid-columns`,
   `--swatch-color`), set from data.

Enforced by `tests/unit/design-tokens.test.js` (no raw colour, `px`/`rem` or font
literal outside `tokens.primitive.css`; the exemption list is empty and must stay
empty; token layering) and `tests/unit/sfc-conventions.test.js` (no `<style>` block).
`tests/unit/design-contrast.test.js` checks WCAG contrast of every semantic colour pair
in light and dark.

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
`--container-max`, `--sidebar-width`, `--grid-min`, `--icon-size`.

## Layout primitives

`.container`, `.prose`, `.stack` (`--tight`, `--loose`), `.cluster` (`--tight`), `.repel`, `.grid` (`--compact`, `--end`, `--fixed` with `--grid-columns`),
`.sidebar` (`--end`: side column last in the source), `.scroll-x` (a wide table or
map that scrolls inside its own box; give it `tabindex="0"`, `role="region"` and an
`aria-label`), `.page`, `.visually-hidden`. Tune spacing with the local property, for
example `style="--stack-space: var(--space-stack-loose)"` (also `--cluster-space`,
`--grid-space`). Breakpoints cannot be tokens: prefer `.grid` and `.sidebar`, which
need none; when a media query is unavoidable use `40rem` (narrow) and `64rem` (wide).

## Components (`src/ui/`)

One component per concept, all `<script setup vapor>` + Pug. Use these instead of
writing the markup again.

| Concept | Component | Notes |
|---|---|---|
| Titled container | `Panel` | Named region (`aria-labelledby`): `title`, `titleId`, `eyebrow`, `lede`, `level` (2 to 4), `status` + `tone` (live badge), `flat`; `actions` slot |
| Record box | `Card` | `<article>`; `flat` (sunken) or `tone` (notice colours) |
| Status text | `Badge` | `status` word (tone from `tone.js`) or `label` + `tone`; colour never the only signal |
| Message | `Notice` | `tone`, `title`; add `role` (`alert`, `status`, `note`) |
| Failure | `ErrorNotice` | `role="alert"`, title, message, optional retry button (`retry` event) |
| Progress / result text | `LiveMessage` | Polite live region, hidden by default, `visible` shows a notice |
| Nothing yet | `EmptyState` | Muted line, or dashed box with a `title` |
| Key/value list | `Facts` (+ `Fact`) | `items` of `{ label, value, code, note, mono, large }`; `rows`, `size` |
| Table | `DataTable` | Visible caption, named focusable scroll region, optional empty row |
| Disclosure | `Disclosure` | Native `<details>`; `summary` or slot, `open`, `card`, `flat` |
| Text/number/checkbox | `InputField` | `v-model`; hint and error linked with `aria-describedby`; attributes go to the input |
| Select | `SelectField` | `v-model`, `options` of `{ value, label }`; typed values |
| Any other control | `Field` | Label + slot (textarea, file, ...) |
| Button row | `Toolbar` | Named `role="group"` |
| Paging | `Pagination` | `nav` with previous/next and a summary |
| Mirror status | `SyncCard` | Sync / reload action that fits a local mirror's state |
| Chart | `ChartFrame` + `LineChart` | Figure with caption, text summary and data table behind a disclosure |
| Shell | `RouterLink`, `RouterView`, `ApiRequired`, `LoadError` | |

Helpers: `tone.js` (`statusTone`: state word to `success`/`warning`/`danger`),
`format.js` (`fixed`, `plural`, `list`, `dims`, `humanize`, `yesNo`), `scene-colors.js`
(semantic tokens as three.js colours at runtime), `uid.js`.

Component classes behind them: `.panel`, `.card` (`--flat`), `.badge` (`--success`,
`--warning`, `--danger`, `--info`), `.notice` (same tones), `.empty-state`,
`.facts` (`--rows`, `--wide`, `--compact`), `.field` (`--inline`), `.data-table`,
`.button` (`--secondary`, `--danger`, `--link`), `.tile`, `button.card[aria-pressed]`,
`.heatmap`, `.chart*`, `.swatch`, `.scene`, `.progress`, `.choice`, `.digest`,
`.eyebrow`, `.lede`, `.muted`, `.plain-list`, and the knowledge-base pieces
(`.breadcrumbs`, `.equation`, `.graph*`). `details > summary` shows an arrow.

Heading levels: the page `h1`, one `Panel` (`h2`) per area, `Panel level="3"` or an
`h3` inside it, `h4` below that. Never skip a level.

## Composables (`src/composables/`)

Shared behaviour, not markup: `useTask` (cancellable last-request-wins call: abort,
out-of-order responses, unmount), `useWorkflow` (state word, message, announcement,
busy, `step`), `useMirror` (sync / integrity / offline lifecycle of a local mirror),
`usePolling`, `useWebglScene` (three.js plumbing and the fallback), plus domain
composables for the largest workbenches (`useSimulation`, `useExperimentWorkspace`,
`useAttempts`). See the header comment of each.
