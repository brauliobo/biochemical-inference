# Atlas and visual entity pages

The knowledge site is pictures first. Entity pages are built from maps, causal graphs, dose bars, equation graphics
and kinetic curves; the prose that used to be the page is folded into one "Notes & sources" drawer. The atlas
(`/#/atlas`) browses the whole ontology the same way. Everything is static-build safe (no API) and lazy: Home loads
none of it.

Components come from [VIZ_COMPONENTS.md](VIZ_COMPONENTS.md) (`src/viz`); data from [KNOWLEDGE_MODEL.md](KNOWLEDGE_MODEL.md)
(structured quantities, signed causal edges, hand-laid layouts); rules from [CONVENTIONS.md](CONVENTIONS.md) and
[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

## Atlas

| Route | View | What it does |
|---|---|---|
| `/atlas` | `views/atlas/AtlasView.vue` | The kind-by-kind relation `Matrix` (2,421 relations; "include articles" adds the evidence links). Click or press Enter on a cell: the relations behind it are listed below (by relation word, hypothesis marked) and the cell is in the URL (`?from=compound&to=enzyme`). Chips start the causal map from each guided path |
| `/atlas/causal` | `AtlasCausalView.vue` | The layered causal map explorer, below |
| `/atlas/network` | `AtlasNetworkView.vue` | The six hand-laid metabolic maps with `MetabolicMap` |
| `/atlas/search` | `AtlasSearchView.vue` | Engine search narrowed by kind and evidence grade; hits as a compact table (kind badge, grade dot, what matched, link count, link to the causal map), no prose |

`AtlasNav` is the in-page navigation (`aria-current` on the open view); "Atlas" is also in the primary navigation.

### Causal map explorer

State lives in the URL query, so a map can be shared: `?topic=<slice id>` or `?focus=<entity id>`, `&depth=1|2|3`,
`&dir=up|down` (default both), `&hyp=0` (hide hypothesis links), `&sign=mitigate|aggravate|increase|decrease`,
`&kinds=intervention,compound,...`. Defaults are omitted. `kb/atlas-model.js` reads and writes it (`readCausal`,
`writeCausal`) and builds the view (`causalView`).

- Topics are the 9 guided paths and the 14 hub topics of `causalSlices()` (under- and over-methylation, glycine,
  choline, betaine, GNMT, PEMT, BHMT, peptic ulcer, SIBO, LPR, belching, choline oxidation, methyl budget). A topic is
  a slice of at most 40 nodes. Searching an entry (the pick-mode `SearchBox`) focuses on it: `causalGraph({ focus,
  depth, direction })`, at most 40 nodes. Claims and articles are evidence, not causes, so picking one explains that
  instead of drawing it.
- Filters: direction and depth (focus only), hypothesis links on or off, one sign, kinds (checkboxes; none ticked
  shows all). Nodes left without a link are dropped, the focus is kept.
- Edges are signed (colour, end marker and word); a hypothesis edge is dashed, carries a `?` and the status of the claim
  behind it ("+? unsupported"), and is coloured by that status (`LayeredGraph` accepts `claimStatus` on an edge and adds
  `viz-status--<status>`; the colours are in `styles/entity.css`).
- Choosing a node (click, or Enter on the focused graph) shows `EntityMiniCard` beside the graph: type, evidence, summary,
  top three quantities (each opens to its provenance) and "Open page: ...". For a reaction the card also draws its
  equation with the enzyme.
- The same links are a table below the graph (`Links in this map`, first 40 with a button for all). It is the keyboard
  and screen-reader route: Tab reaches each link.

Keyboard task, checked in `tests/e2e/atlas.spec.js`: Atlas in the primary navigation, "Causal map", the search box,
type "belching", Enter, the sign select set to "Mitigates", Tab to the first link in the table, Enter. No pointer.

### Metabolic network explorer

Map select (`LAYOUTS`) and pathway select (pathways with at least two reactions placed on that map; choosing one crops
the map to those reactions and their substrates and products), in the URL as `?map=` and `?pathway=`. The map's own
"Currency molecules" toggle shows ATP, NADPH, water and the other pooled molecules, which `toMetabolicMap` adds back as
`currency` nodes. Choosing a reaction or compound shows its `EntityMiniCard`.

## Entity pages

`views/kb/KbEntityView.vue` is a dispatcher: it finds the entity (`page(id)`), draws the breadcrumbs and a lazy template
chosen by type, passing the page model as the one prop `model`. Each template renders everything below the breadcrumbs,
including the one `h1`.

| Type | Template | Visuals (each hidden when its data is missing) |
|---|---|---|
| compound | `CompoundTemplate` | `NeighbourhoodMap` (metabolic map cropped to the compound's reactions, those reactions lit); `DoseBars` (IOM and EFSA rows, "No upper limit established" in words); key-number chips (molar mass, content fractions, ranges, pKa); `CausalMini`; condition chips grouped by relation; reaction table with consumed/produced roles |
| enzyme | `EnzymeTemplate` | identity, tissue and cofactor tags; reaction equation cards; the pathway on the map; `KineticsPanel` (Michaelis-Menten explorer); `CausalMini`; condition chips |
| reaction | `ReactionTemplate` | `ReactionGraphic` (boxes with stoichiometric coefficients, enzymes above the arrow, compartment below); pathway and identifier chips; `BalanceIndicator`; pathway context map; `KineticsPanel` |
| pathway | `PathwayTemplate` | member reactions on the map (or a small layered network); reaction table; enzyme and compound chips; `CausalMini`; condition chips |
| state, disease, outcome, system | `ConditionTemplate` | `CausalMini` with up to 28 nodes (what leads to it on the left, what it leads to on the right, interventions at the top); "What helps and what worsens it" chips; reference-range chips of the entry and of what measures it; the signed links as a table |
| intervention | `InterventionTemplate` | `DoseBars` (usual and trial doses against the upper limit of what the product delivers, scaled by its content fraction); signed effects table; `CausalMini` (downstream); cautions as chips; forms and contents |
| claim, article | `ClaimTemplate`, `ArticleTemplate` | owned by the evidence work, same contract (prop `model`, renders its own `h1`) |

Every page starts with `EntityHeader` (type and evidence badges, `h1`, the one-line summary, other names including
Portuguese as tags) and `EvidenceStrip` (the four grades as a scale with the current one marked by letter and word, the
number of sources for and against, the claims about it with their statuses). Every page ends with `NotesDrawer`: the guided
paths it belongs to and the "How is this connected to...?" control stay visible; everything prose or long (body text,
facts and identifiers, connections by relation, sources, mentions, see also) is in one collapsed `<details>` "Notes &
sources".

### How the pictures are found

- `kb/layout-map.js` converts a hand-laid layout to the `MetabolicMap` shape (`toMetabolicMap`), finds where an entity
  sits (`neighbourhoodIn`, `pathwayIn`, `contextAround`), crops with a readable minimum view box (`fitBox`) and writes
  small molecules as formulas (`H+`, `H2O`, `CO2`). A compound shows its reactions and what they touch; a reaction or
  enzyme the pathway within 170 layout units; a pathway its member reactions. An entity no layout places gets a small
  `LayeredGraph` of its reactions (`reactionNetwork`); one with no reactions gets none.
- `kb/causal-view.js`: `causalFor` (a neighbourhood as `LayeredGraph` input, with an unsigned fallback), `effectRows`
  (signed effects from the entity's point of view), `conditionsFor` (states, diseases and outcomes by relation).
- `kb/quantities.js`: `chipsFor` (a quantity as a chip with its provenance), `limitRows` (RangeBar rows per authority and
  adult sex, an adult UL applied to each sex row), `doseRows` (doses against the UL of the compound a product delivers,
  divided by its content fraction).
- `kb/params.js` and `components/kb/KineticsPanel.vue`: the simulation parameter sets (`src/sim/data/parameters-b1.js`,
  `-b2.js`, large, loaded only on enzyme and reaction pages) are searched for the laws of the enzyme or its reactions;
  every Michaelis constant (`Km`, `S0.5`, `Ks`; base variants, in micromolar) becomes a curve. The explorer plots percent
  of Vmax against substrate with the literature range of Km as a ribbon, the cited Km dashed, and sliders for substrate
  and Km (log scale). The other substrates are held non-limiting, which is what one Km means. Each constant opens to
  its source, tissue, species, confidence and range. A visible note says the curve is illustrative, not physiology or
  advice. No parameters, no panel: 35 of 77 enzymes and 32 of 75 reactions have one.
- `kb/balance.js`: atoms, hydrogens and charge from the compounds' `formula` facts. The verdict is one of balanced,
  heavy atoms only (formulas use different ionisation forms), not balanced, or not checked (a participant has no plain
  formula); the element counts are behind a disclosure.

### Type listings

`/kb/:type` is a sortable table (`views/kb/KbTypeView.vue`, `components/kb/EntityTable.vue`, `kb/listing-table.js`):
name, an evidence grade dot, count bars, and a sparkline of how many relations of each kind the entry has; type
columns add reactions and quantities (compounds), EC and reactions (enzymes), the equation drawn inline and the
pathway (reactions), status (claims), year, citation and verified (articles). Column headers are buttons (`aria-sort`).
`?q=&grade=&status=&sort=&dir=` keep the view shareable.

## Accessibility and performance

Each chart sits in `ChartFrame` (summary and data table); the causal and metabolic views are one tab stop with arrow keys;
every graph has a table equivalent; colour never carries a meaning alone (letters on grade dots, glyphs and words on
signs). Axe runs in jsdom per template and in the browser over every route in light, dark and 360 px
(`tests/e2e/shell.spec.js`, `atlas.spec.js`, `entity-templates.spec.js`), and 320 px reflow is checked on all of them.
Pages are lazy: Home (36 kB gzip of JavaScript before the entity data) loads no template, map, graph or parameter
file; a compound page loads its template, the viz chunks and the layouts but not the kinetic parameters; an enzyme page
adds them (`entity-templates.spec.js` asserts this from the network log).

## Coverage

`tests/component/kb-entity-visuals.test.js` renders every entity that uses a visual template (480: all kinds but claims
and articles) in one mounted view and fails on an exception, on a second `h1`, or when fewer than 90 percent show a
visual. Result: 480 of 480 show at least one map, graph, bar, curve, table or chips, and every one shows a chart-type
visual (not only chips). Counts by visual: metabolic map 253, causal graph 405, reaction table 143, effect table 126,
Michaelis-Menten curve 67, dose bar 43, reaction network 42. Entities without a Michaelis-Menten curve (85 of 152
enzymes and reactions) lack published constants in the parameter sets; compounds without a dose bar (all but 12) lack
mass-per-day intake limits.

## Changes to shared pieces

- `viz/LayeredGraph.vue`: an edge may carry `claimStatus` (adds the class `viz-status--<status>`).
- `viz/range-model.js`: a row may be `doseOnly` (a dose bracket): it does not print "No upper limit established".
- `kb/paths.js`: `atlasPath(view, query)`.
- `styles/entity.css`: chips, evidence scale, equation graphic, provenance, atlas layout; `.data-table`, `.scroll-x` and
  the equation graphic are positioned so visually hidden text cannot widen the page; `h1` wraps long terms.
- `App.vue`, `routes.js`: the Atlas navigation link and four routes.
