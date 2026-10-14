# Chart components (`src/viz`)

Dependency-free SVG and HTML chart primitives for the dashboards and entity pages.
All are Vapor + Pug (`<script setup vapor>`), styled by `src/styles/viz.css` with
semantic tokens only (no raw colour, `px` or `rem`; the token lint stays green).
See them with sample data at `#/dev/viz` (`src/views/dev/VizGallery.vue`), which the
browser accessibility specs scan in light, dark and mobile. The sample data lives in
`src/viz/samples/*` and is **illustrative only**: it is invented for the gallery and
tests, and no component may ship it as content.

## Rules every component follows

- **Text alternative.** Every chart is wrapped in `ui/ChartFrame` (caption, a visible
  text summary, a legend or key, and a data table inside a disclosure). The `<svg>` is
  `role="img"` with a name that points to the summary. The summary is generated from the
  data; pass `summary` to replace it.
- **Never colour alone.** Series differ in colour, dash and marker shape
  (`shapes.js: seriesLook(n)`); edge signs in colour, end marker, label and (hypothesis)
  dash; node types in shape; evidence grades in a letter badge; heat cells print their
  value; dose regions use hatch and dot patterns and carry words.
- **Colour tokens** (`tokens.semantic.css`, light and dark pairs, contrast checked by
  `tests/unit/viz-contrast.test.js`): `--color-viz-1..8` (categorical, Okabe-Ito style),
  `--color-viz-seq-1..6` and `-on` (sequential bins and the text on them),
  `--color-viz-div-n3..p3` and `-on` (diverging), `--color-viz-flux-1..3`,
  `--color-edge-increase|decrease|mitigate|aggravate|neutral|hypothesis`,
  `--color-grade-established|plausible|speculative|conversation`. The raw hex values are the
  `--chart-*` block at the end of `tokens.primitive.css`.
- **Responsive.** `useChartWidth()` measures the box, so the `viewBox` is as wide as the
  pixels and text keeps its real size on a phone. Where a chart cannot shrink (graph,
  heatmap) it scrolls inside its own focusable box; the page never overflows (checked at
  320 px).
- **Keyboard.** Each interactive chart is one tab stop (a focusable `role="group"` with an
  `aria-label` that lists the keys), then arrow keys. Readouts are `aria-live="polite"`.
- **Pure logic is separate.** Geometry, text and navigation are in `*-model.js`,
  `layout/layered.js`, `nav.js`, `scale.js`, `shapes.js` with unit tests; the components only draw.
- **Motion.** The only animation is the optional flow animation of the metabolic map; it is
  off under `prefers-reduced-motion` (the toggle is not offered).

## When to use which chart

| You want to show | Use |
|---|---|
| A quantity over time, with uncertainty, events, a reference range, baseline vs scenario | `LineChartPlus` |
| A dose against reference intakes and upper limits, by authority | `RangeBar` |
| How a total splits into parts (shares), with ranges, or across scenarios | `StackedBar` (never a pie) |
| The shape of one series inside a table row or a sentence | `Sparkline` |
| Values on two categorical axes (rows x columns), or a signed change | `Heatmap` (`mode="diverging"` for change) |
| How many relations exist between each pair of kinds, click to drill down | `Matrix` |
| Articles or events by year and category | `Timeline` |
| Cause and effect, tiers, signs, evidence | `LayeredGraph` (tens of nodes; filter first, never all 759) |
| A hand-laid pathway with reactions, enzymes, flux and levels | `MetabolicMap` |
| Choosing a value, a scenario, or which series to show | `SliderField`, `ScenarioPicker`, `LegendToggle` |

Prefer the table inside `ChartFrame` over a chart when there are fewer than about 4 numbers.

## LineChartPlus

`LineChartPlus(title, x, series, events?, bands?, refLines?, unit?, xUnit?='h', yScale?='linear', yMin?, yMax?, height?=300, allowLog?=true, summary?, id?)`

- `x`: numbers (time). `series`: `[{ id, label, values, lower?, upper?, baseline?, look?, unit?, lowerLabel?='p5', upperLabel?='p95' }]`.
  `lower`/`upper` draw the uncertainty ribbon; `baseline: true` draws a thin dashed line
  with no markers under the others (baseline-vs-scenario overlay). `look` is 0 to 7.
- `events`: `[{ x, label }]` vertical markers with a label (stacked in up to 3 rows, flipped near the edge).
- `bands`: `[{ from, to, label }]` shaded y ranges (normal range). `refLines`: `[{ value, label }]`.
- Legend buttons toggle series (`aria-pressed`); a "Log scale" button appears when every value is positive.
- Crosshair: pointer move, or focus then Left/Right (Shift: 10 samples), Home/End, Escape. The readout lists each
  visible series value, its band and the events at that time.
- Table: sampled rows (at most 24) plus a second table of events and reference ranges.

## RangeBar

`RangeBar(title, rows, unit?, min?=0, max?, step?, valueLabel?='Your value', v-model?)`

- `rows`: `[{ id, label, markers: [{ kind: 'ai'|'rda'|'ear'|'pri'|'ul', value }], typical?: { from, to, label? }, noUlNote? }]`,
  one per authority (IOM, EFSA, ...), same unit. Markers: AI triangle, RDA/PRI circle, EAR square, UL bar.
- **No UL**: a row with no `ul` marker prints "No upper limit established" (with `noUlNote` in the summary and
  table) and its track is dashed, never blank.
- With `v-model` a labelled `SliderField` appears, a marker crosses every row and each row gets a status word badge
  ("Above the UL", "Within the range", "Below the reference intake", "No UL to compare").
- Regions: below requirement (dots), between requirement and UL (green), above UL (hatch).

## StackedBar

`StackedBar(title, bars, normalize?=true, unit?, summary?)`; `bars: [{ id, label, items: [{ id, label, value, low?, high?, look? }] }]`.
Items keep one colour across bars. Items with `low`/`high` add a "Share ranges" strip (point and whisker).
The key doubles as value list; entries are buttons (`select` emits the item id, as does clicking a segment).

## Sparkline

`Sparkline(values, label?, unit?, lower?, upper?, showValue?, min?, max?, look?)`. Inline; the accessible name
is a sentence (first, last, lowest, highest). Use inside tables or text.

## Heatmap and Matrix

`Heatmap(title, rows, cols, values, mode?='sequential', center?, domain?, totals?, blankZero?, diagonal?, rowTitle?, colTitle?, unit?, format?)`.
`rows`/`cols`: `[{ id, label, short? }]`; `values`: matrix or `(rowId, colId) => number | null`. 6 sequential or 7 diverging
bins, each cell prints its value and has an `aria-label` ("Row, Column: value"); a key lists each bin's range.
`role="grid"`, one tab stop (roving), arrows, Home/End (Ctrl: whole grid), Enter/Space or click emits
`select({ row, col, value })`. `totals` adds row and column sums.
`Matrix(title, types, counts, totals?)`: counts as `{ from: { to: n } }` or `[{ from, to, count }]`; emits
`select({ from, to, count })`.

## Timeline

`Timeline(title, items, groups?)`; `items: [{ id, title, year, group, detail?, href? }]`, `groups: [{ id, label, look? }]`.
One lane per group, a marker shape per lane, years bucketed on a narrow screen. Arrow keys move along a lane or between
lanes, Home/End, Enter emits `select(item)`; a readout names the article and links to `href`. Legend buttons hide a lane.

## LayeredGraph and the layout

`LayeredGraph(title, nodes, edges, tierNames?, direction?='LR', routing?='curve', typeStyles?, showEdgeLabels?, v-model:selected?)`

- `nodes`: `[{ id, label, type, tier?, grade? }]` (`tier` a number or a name in `tierNames`; without it, longest path).
  `type` picks a shape (`shapes.js: TYPE_LOOKS`, override with `typeStyles`); `grade` is an evidence grade id.
- `edges`: `[{ from, to, sign?: 'increase'|'decrease'|'mitigate'|'aggravate'|'neutral', hypothesis?, label? }]`.
  Each sign has a colour, an end marker and an on-edge label; hypotheses are dashed with a "?".
- Hover or focus highlights upstream and downstream (the rest dims; the readout counts them and lists the
  neighbours as buttons). Type, sign and "hypothesis links" toggles filter and re-layout; "Fit to width" scales it.
- Keyboard: one tab stop; Right/Left follow an edge forward/back (Down/Up in `direction="TB"`), the other axis moves
  within a tier, Home/End, Enter selects, Escape clears. Events: `select(node)`, `focus-node(node)`.
- Text alternative: an adjacency list ("GNMT: Decreases SAM; Comes from Glycine (increases)").

`src/viz/layout/layered.js` is the layout: `layoutLayered({ nodes, edges }, options)` returns node boxes, routed
edges (`d`, `points`, `end`, `endAngle`, `labelAt`), layer bands and the crossing count. It breaks cycles by reversing
back-edges (flagged `reversed`, still drawn from the original source), assigns layers by tier or longest path, splits long
edges with dummy nodes, orders by barycenter sweeps plus adjacent swaps, places coordinates by a weighted isotonic
regression per layer, and routes curves or rounded orthogonal paths. Options: `direction` ('TB'|'LR'), `nodeGap`,
`layerGap`, `padding`, `sweeps`, `routing`, `tiers`, `nodeWidth`, `nodeHeight`. Deterministic; tested for no overlaps,
tier order, cycles, crossings and routing clearance (`tests/unit/viz-layered.test.js`).

## MetabolicMap

`MetabolicMap(title, map, flux?, concentration?, concUnit?, fluxUnit?, showValues?, animate?, v-model:selected?)`

- `map`: `{ nodes: [{ id, kind: 'compound'|'enzyme'|'reaction'|'pool', x, y, label, currency?, group?, reversible? }], edges: [{ from, to, reaction?, stoich?, via?: [[x, y], ...] }], viewBox: [x, y, w, h] }`.
  Substrate = compound to reaction, product = reaction to compound (arrowhead on the product end, both ends if
  `reversible`, reversed under negative flux), catalysis = an enzyme at either end (dotted tether). `via` are waypoints.
  `group` draws a labelled background box. `stoich` other than 1 is printed on the edge.
- Currency molecules (`currency: true`) are hidden until the "Currency molecules" toggle.
- `flux` `{ reactionId: n }` sets edge width and a 3-step colour; `concentration` `{ compoundId: n }` sets the fill bin
  (log scale when the values span more than 50 times) and a little size; a key lists the ranges with units;
  "Show values" prints them.
- Click selects (connected reactions stay bright). Drag pans; buttons, `+`/`-`/`0`, and the wheel (Ctrl/Meta, or after the
  map has focus) zoom. Keyboard: one tab stop; arrows move between nodes by position, Shift+arrows pan, Enter selects, Escape clears.
- Text alternative: every reaction as an equation with its enzyme and rate (currency molecules included).
- `src/viz/samples/methylation.js` is a sample layout for the gallery and tests only; the real layouts come from the data work.

## Controls

- `SliderField(id, label, unit?, min, max, step, hint?, format?, disabled?, v-model)`: native range input, 44 px, value and
  limits printed, `aria-valuetext` "5 g". Emits `input(number)`.
- `ScenarioPicker(label, options: [{ value, label }], hideLabel?, v-model)`: radios in a fieldset styled as a segmented
  control; the chosen segment has a check mark. Emits `change(value)`.
- `LegendToggle(items, hidden, label?)`: toggle buttons (`aria-pressed`, struck through when off); items
  `{ id, label, look?, kind?: 'line'|'band'|'box'|'node'|'sign', tone?, dashed?, node?, sign?, hypothesis? }`; emits `toggle(id)`.
- `Swatch`: the small key (line with dash and marker, band, box, node outline, signed edge) the legends use.

## Tests

`tests/unit/viz-*.test.js` (scales, shapes, models, layout, graph logic, metabolic geometry, contrast),
`tests/component/viz-*.test.js` (every component incl. keyboard and the table alternative, jsdom axe, the gallery) and
`/#/dev/viz` in `tests/e2e/shell.spec.js` (axe light, dark, mobile).
