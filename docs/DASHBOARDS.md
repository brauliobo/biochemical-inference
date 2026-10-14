# Simulator dashboards, home page and shared components

Visual-first pages that put charts, maps and simulations in front of the prose. Everything is Vapor + Pug, token-only CSS
(`src/styles/dash.css`), static-build safe (no API), and loads the simulator, the viz primitives and the data lazily.
Every simulation is an **illustrative educational model**; the label, the validation status and the evidence chips are on
every page ([SIMULATION_ENGINE.md](SIMULATION_ENGINE.md), [METHYLATION_MODEL.md](METHYLATION_MODEL.md), [SMALL_MODELS.md](SMALL_MODELS.md)).

| Route | View | Shows |
|---|---|---|
| `/` | `views/home/HomeView.vue` | hero = the core methylation map at the reference steady state (flux = edge width, level = node fill, precomputed); question cards with a picture of the answer; counters; guided paths, start here, browse by kind, claims audit |
| `/dashboards` | `views/dash/DashboardsIndex.vue` | one card per dashboard with a sparkline or mini-map (precomputed, no simulation) |
| `/dash/methylation` | `MethylationBalance.vue` | presets (evidence chips), 12 sliders, result tiles, SAM-consumer stacked bar, SAM:SAH x tHcy plane with labelled state regions, time course (scenario against reference, event markers, optional ensemble ribbons), the map coloured by change, "What is robust?", contested-constant switches, validation dots, provenance |
| `/dash/glycine` | `GlycineDashboard.vue` | dose slider, plasma curve (weak source), SAM:SAH response (hypothesis) with robustness, glycine flux map (net budget or gross turnover), contested budget ranges, the 10 g/day deficit against five synthesis estimates, glycine in products |
| `/dash/choline` | `CholineBetaineDashboard.vue` | fate partition, the choline-betaine-glycine path on the map, the choline-for-glycine calculator (conversion slider, IOM/EFSA limits, salt forms), the TMA marker, tHcy under both BHMT constants, single-dose plasma curves |
| `/dash/gut-acid`, `/dash/histamine-night`, `/dash/b6-gaba`, `/dash/bile-acids`, `/dash/tma-tmao` | sibling views | registered in `views/dash/routes.js` (`DASHBOARDS`), built on the shared components below |

`views/dash/routes.js` is the catalogue (path, title, question, status, thumbnail kind, lazy loader); `src/routes.js` spreads `dashRoutes`.

## Shared components (`src/components/dash`)

| Component | Props and slots |
|---|---|
| `DashboardShell` | `title` (h1 and document title), `question`, `status` (`model` \| `hypothesis` \| `measured` \| `calculator`); slots `default`, `controls` (sticky column from 64 rem), `notes` ("Notes & sources" drawer), `related` (links) |
| `ModelDisclaimer` | none; the standing line plus a validation-status disclosure (counts from the precomputed summary) |
| `ProvenancePanel` | `model` (`methylation` \| `gastric` \| `histamine` \| `pk`), `ids`; loads the sources when opened: value, range, article link to `/kb/article/...`, locator, confidence, assumed flag. PK parameters are addressed as `betaine:ka`, `glycine:ke`, ... |
| `ScenarioPresets` | `scenarios` (`id`, `label`, `evidence`), v-model; radio list with a word chip (supported, partly supported, animal data, hypothesis) |
| `ResultTiles` | `tiles` `[{ id?, label, value, unit, delta, tone, note }]`; arrow in the delta, `data-testid="tile-<id>"` |
| also | `RangeList` (estimates with ranges on one axis), `RobustnessStrip`, `StatePlane`, `ChangeBars`, `LayoutMap`, `MethylationMap`, `ValidationDots`, `VariantSwitches`, `DashThumb` |

`composables/useModelRun.js`: `useModelRun(getRunner, controls, { debounceMs })` returns `{ result, running, error, warnings, run, cancel }`; debounced, last run
wins (a stale result is dropped, `isStale()` is passed to the runner), cancelled on unmount; the runner is imported lazily. `composables/useEnsemble.js`:
`useEnsemble(getJob, enabled)` returns `{ bands, progress, running, error }`; a Web Worker (`sim/ensemble.worker.js`, which runs `sim/ensemble-bands.js`)
per job, terminated when the job changes; without `Worker` it runs on the main thread in slices.

## What the numbers mean

* **Runs.** A preset plus the 12 slider positions become a scenario (`methylation-state.js: scenarioFor`): an 8 h baseline, then 64 h with the sliders that differ
  from the preset background applied and the preset's acute doses as events. About 100 ms per run. Tiles show the value at the largest departure from the
  reference state, the change, the hour and the range over the run (a dose can dip and rebound).
* **State regions** (`methylation-view.js: STATE_DEFINITIONS`): the knowledge-base states give directions, not cut-offs. Under-methylation-like: SAM:SAH below 75% of the
  reference ratio; over-methylation-like: above 133%; tHcy limits 12 and 15 uM (Refsum 2004). The ratio cut-offs are assumed here and stated on the page.
* **Ribbons.** Each ensemble member (`methylation-ensemble.js` sampler, recalibrated to its own steady state) is divided by its own start value; the ribbon is the
  5th to 95th percentile of that response times this run's start value. It shows how much of the response survives the parameter uncertainty, not the uncertainty of the baseline.
* **Contested constants.** `gnmtGlycineKm` (130 uM or 2 mM) and `bhmtBetaineKm` (100 uM or 2.2 mM) are switches with a standing warning and the effect size from the ensemble table.

## Precomputed data (`src/sim/data/*.json`)

| File | Script | Content | Kept current by |
|---|---|---|---|
| `robustness.json` | `node scripts/precompute-robustness.js` (about 1 min) | 19 questions, 31 metrics, 100 members, seed 7: median, 5th to 95th percentile, fractions beyond thresholds, verdict | `tests/unit/dash-precomputed.test.js`: fingerprint of every input (questions, scenarios, sampled ranges, calibration) and one recomputed row; `--check` on the command line |
| `baseline-fluxes.json`, `validation-summary.json`, `budgets.json`, `dash-thumbs.json` | `node scripts/precompute-dash.js` (3 s) | reference fluxes and levels by map node id; 41 validation targets as pass / documented disagreement; the glycine and choline flux budgets; card sparklines and mini-maps | the same test recomputes each one |

Question definitions and the verdict rule (robust at 90% of members agreeing, mostly at 70%, otherwise parameter-dependent) are in `src/sim/robustness-defs.js`.

## Performance

Home JavaScript before the first heading: 53 kB gzip (limit 100 kB, `tests/e2e/dashboards.spec.js`); the hero map, the thumbnails and the knowledge data load afterwards, and the home page
never fetches the simulator or the literature tables (also asserted). Dashboard chunks (static build, gzip): methylation page 7.8 kB plus the engine and model chunk 28 kB,
the literature tables only when a provenance panel is opened (B1 18 kB, B2 57 kB).

## Tests

`tests/unit/dash-composables.test.js` (debounce, stale runs, cancel, worker protocol), `dash-models.test.js` (state, scenarios, runners against the real models, view models, calculator numbers),
`dash-precomputed.test.js`; `tests/component/dash-shared.test.js`, `dash-pages.test.js` (mocked runners, axe); `tests/e2e/dashboards.spec.js` (axe light, dark and phone, console, overflow, 44 px,
bundle, ribbons in a real worker, the keyboard-only task: on Methylation balance pick the glycine 10 g scenario and read the SAM:SAH tile, 11 Tab presses).

## Known gaps

* ProvenancePanel on the methylation page lists the nine constants that decide the headline effects, not all 140.
* The home hero map is the hand-laid layout at its reference state; selecting a node offers its page and the simulator, it does not simulate in place.
* The ensemble ribbons cover the scenario as run (preset plus sliders); a slider change restarts the 100-member run after 350 ms.
