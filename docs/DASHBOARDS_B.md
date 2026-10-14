# Dashboards B: gut and acid, histamine and night, B6 and GABA, bile acids, choline and TMA

Five question-first dashboards built from the small models ([SMALL_MODELS.md](SMALL_MODELS.md)), the integrated
methylation model ([METHYLATION_MODEL.md](METHYLATION_MODEL.md)), the causal map and the hand-laid metabolic maps
([KNOWLEDGE_MODEL.md](KNOWLEDGE_MODEL.md)), drawn with the chart primitives ([VIZ_COMPONENTS.md](VIZ_COMPONENTS.md)). They answer the
topics of the source conversation (`tmp/base-talk.txt`): glycine or collagen powder and belching, acid and PPIs, throat
burning, betaine HCl, waking at 2-3 am, P5P and GABA, choline and TMAO, bile-acid conjugation. Running text lives only in the
"Notes and sources" drawer of each page; every chart is a `ChartFrame` figure with a text summary and a data table; every
number carries a status chip (measured, model prediction, hypothesis, assumed, recorded).

| Route | View | Question | Status |
|---|---|---|---|
| `/dash/gut-acid` | `views/dash/GutAcidDashboard.vue` | Why would glycine powder make me belch? | model |
| `/dash/histamine-night` | `HistamineNightDashboard.vue` | Does low SAM slow histamine clearance enough to matter at 2-3 am? | model |
| `/dash/b6-gaba` | `B6GabaDashboard.vue` | What does PLP do for GABA, glycine and homocysteine, and how much B6 is too much? | model |
| `/dash/bile-acids` | `BileAcidsDashboard.vue` | Does glycine shift bile conjugation from taurine to glycine? | hypothesis |
| `/dash/tma-tmao` | `TmaTmaoDashboard.vue` | Could 28 to 35 g of choline replace 10 g of glycine, and what happens to TMA and TMAO? | calculator |

Routes are registered by the dashboard-shell work in `src/routes.js` (not here). The views are built against the shared
dashboard components (`components/dash/DashboardShell`, `ModelDisclaimer`, `ProvenancePanel`, `ScenarioPresets`, `ResultTiles`
and `composables/useModelRun`); see "Contract with the shared components" below.

## What each page shows

**Gut, acid and belching.** Controls: a situation picker (`gastricScenarios`), PPI % of pumps blocked, sodium bicarbonate, betaine HCl
capsules, alginate antacid, meal, swallowed air, and the **hypothesis** "glycine raises acid output by X%" (default 0, kept in a dashed
box beside the human data: Wald 1982, Taylor 1982, McArthur 1983, as chips). Tiles: time with pH below 4, median pH, acid secreted,
capsule acid in hours of basal output, CO2 formed, CO2 belched. Charts: pH over 8 h with the meal marker and the pH 4 band; acid output;
a CO2 budget (`StackedBar` on one absolute mL scale: formed, absorbed, carried on, passed, belched, against the swallowed air in the same
gas pocket); a strip of competing explanations (swallowed air and supragastric belching, TLESR, fermentation by gut bacteria and SIBO,
acid + bicarbonate, H. pylori urease, glycine raising acid) each with its evidence grade and claim verdict and a chip for what the model
can say; the causal map from glycine powder, collagen, PPI and betaine HCl through acid, CO2, TLESR and reflux to throat burning (SIBO and
H. pylori branches included) with every dashed hypothesis link listed beside the verdict of its claim; the `gastric-acid` metabolic map with
the run's mean rates as edge width and mean concentrations as node colour. **Honest result:** bicarbonate-derived CO2 is about 0.2% of what
forms and about 6% of what is belched; swallowed air in the same pocket is 50 times larger (an assumed rate), and nothing in the model
supports glycine as the cause.

**Histamine and night waking.** SAM and SAH sliders with presets, including presets taken from the methylation model's steady states
(glycine 10 g a day, niacin 2 g, glycine + niacin at low folate, MTHFR 677TT-like, betaine 6 g a day); the methylation model's SAM and SAH are
scaled to the histamine model by ratio (the two use different tissue scales), and the evidence status of the scenario is shown. HNMT and gut DAO
activity, mast-cell release, and an **optional, weak** day-night rhythm (plasma about 2x higher at 04:00 than at 16:00 in one study; urinary
markers show none). Charts: histamine by clock hour (only when the rhythm is on), steady-state histamine against SAM, and who clears histamine
(HNMT against other routes, reference against scenario; the 60% and 80% shares are assumptions and are chipped as such). The causal map runs from
histamine excess and the H1/H2 receptor to night waking, tachycardia and flushing with the vagal brake, and choline, betaine, P5P, niacin and
glycine as signed levers.

**Vitamin B6 and GABA.** A cellular-PLP slider (presets: normal, 41% = the B6 restriction study, 15%, 150%). The `gaba-shunt-b6` map draws the
PLP-dependent steps by remaining activity (red is full activity, grey nearly none), the steps that do not need PLP stay at 100%; a bar list shows the
remaining activity of the modelled steps CBS, CTH, SHMT and the glycine cleavage system. A line chart gives cystathionine, fasting tHcy,
glycine and SAM:SAH against PLP, and a table sets the model at 41% against the human data with **Model matches** or **Model disagrees**
(the pinned `expectedStatus` of the validation targets: cystathionine and the post-load tHcy rise match; fasting tHcy and glycine do not,
and the table links the study). A `RangeBar` shows the dose in mg of B6 on the pyridoxine basis against IOM 1998 (RDA 1.3, UL 100), EFSA (PRI 1.6,
UL 12 from 2023) and the superseded EU SCF value (UL 25), with the dose on a P5P label and on a pyridoxine label (molar masses). Evidence chips: "P5P is
better than pyridoxine" (partly supported, never tested head to head), pyroluria (contested), the neuropathy critical effect, the Field 2022
trial at about eight times the EFSA UL.

**Bile acids.** BAAT joins choloyl-CoA to glycine or taurine, so the two compete. The what-if is calibrated to observed bile (75% glycine
conjugates, 70-80%) and computes only the change with the glycine and taurine supply (`bile-model.js`); the glycine supply comes from the
methylation model's hepatic glycine (1.33x at 10 g a day). It is flagged **no human data** (no study measured bile conjugation after glycine
supplements; taurine 3 g a day reversed the ratio in 6 men, Hardison 1983). Charts: observed against what-if shares with the ranges, the share
against the supplement for three taurine settings, the `bile-acid-conjugation` map with the conjugation rates as edge width, the kinetics of the two
BAAT studies (which disagree on which amino acid has the higher Vmax; the liver pools needed to predict the absolute ratio were not found), and the
duodenogastric-reflux causal slice, where "glycine overload promotes alkaline reflux" is an unsupported claim. Bile conjugation uses about 0.45 g
of glycine a day gross: a small sink beside a 10 g dose.

**Choline, TMA and TMAO.** A choline intake `RangeBar` (IOM UL 3500 mg, EFSA no UL, AI 550 and 400) with the 28 to 35 g claim marked; presets from the typical diet
to the claim; tiles for the multiple of the UL, TMA + TMAO output, the glycine the choline could make and the share of the glycine "deficit" choline within
the UL could cover (10%); the choline needed for 10 g of glycine (13.88 g at the stoichiometric ceiling, 4.0 times the UL; 30.8 g at the
quoted 45%); a dose-response of TMA + TMAO output (63% of a 15 mmol free-choline bolus in one study, 5% for the habitual diet **assumed**, scaled
linearly and labelled an extrapolation); the `tma-tmao-axis` map with the same output as edge width; chips for fishy odour, TMAO, FMO3 and
trimethylaminuria and for the claims about the UL, including that EFSA set none. Nothing on this page is simulated.

## Code

`src/components/dash-gut/` (page-specific; the shared dashboard components are not here):

| File | Content |
|---|---|
| `gut-presets.js`, `histamine-presets.js`, `b6-view.js`, `bile-view.js`, `tma-view.js` | light data: defaults, presets with a status, tiles, series, bars (no engine; in the route chunk) |
| `gut-run.js`, `histamine-run.js`, `b6-run.js`, `bile-run.js`, `methylation-link.js` | the runners: each loads the engine and a model lazily (`createGutRunner()` and so on return a function from the controls to chart-ready data) |
| `bile-model.js`, `tma-model.js`, `dose-rows.js`, `co2-bars.js`, `gut-tiles.js`, `histamine-view.js`, `gut-explanations.js` | pure helpers; constants mirror `src/sim/data/parameters-b2.js` and the quantities (a test compares them) |
| `causal-view.js`, `map-sets.js` | the induced causal subgraph among named entries as `LayeredGraph` props, with claim verdicts; which entries each page shows |
| `layout-map.js` | a hand-laid layout (`src/viz/layouts`) to the `MetabolicMap` input: group labels, regulator tethers, pooled participants as hidden currency nodes |
| `CausalMap.vue`, `LayoutMap.vue`, `EvidenceChips.vue`, `ExplanationStrip.vue`, `Co2Budget.vue`, `GutControls.vue`, `SourceTable.vue`, `RunStatus.vue`, `DashRelated.vue` | small components |
| `src/styles/dash-gut.css` | chips, cards, verdict rows, bars (semantic tokens only) |

Each runner is called through `useModelRun(getRunner, controlsRef, { debounceMs })`; the gastric run takes about 0.3-0.5 s, the others are
faster than 0.2 s, and the engine and the model are separate lazy chunks (checked in `tests/e2e/dashboards-b.spec.js`: the home page loads no model code).

### Causal maps

`causalView(knowledge, { include, labels })` returns the signed causal edges of the knowledge base among the listed entries (entries with no edge among
the others are left out), shaped for `LayeredGraph` with the claim, its verdict and the strength on every edge. `LayeredGraph` selects nodes, not edges, so
`CausalMap` lists the links of the chosen node (hypotheses first) under the graph, or every hypothesis link when nothing is chosen; each row names the sign,
"Hypothesis", the verdict badge and a link to `/evidence/claim/<slug>`.

## Contract with the shared components

The views use these, with the API below. Until the shell work merges, uncommitted stubs of the same API exist in the working tree
(`components/dash/*.vue`, `composables/useModelRun.js`, `useEnsemble.js`):

- `DashboardShell(title, question, status: 'model'|'hypothesis'|'measured'|'calculator')`, slots `default`, `controls`, `notes`, `related`
- `ScenarioPresets(scenarios: [{ id, label }], v-model, label?)`
- `ResultTiles(tiles: [{ label, value, unit, delta, tone, note }])`
- `ProvenancePanel(model, ids)`
- `useModelRun(getRunner, controlsRef, { debounceMs }) -> { result, running, error, warnings }`, where `getRunner()` returns the runner function or a
  promise of it (`() => import('...-run.js').then((m) => m.createGutRunner())`), and the runner maps the controls to a plain result object.

## Tests

- `tests/unit/dash-b-*.test.js`: the what-if and TMA arithmetic against the B2 data, dose rows and B6 conversions, the causal views (every
  hypothesis edge names its claim; the chains of the conversation exist), the layout adapter for every layout, the runners against the documented model
  numbers (SAM 60 to 30 gives 1.20x systemic histamine; a 60% PPI roughly halves the time below pH 4; 650 mg betaine HCl is 4.2 mmol H+;
  the CO2 budget adds up to the CO2 formed), presets in step with `gastricScenarios`, tiles and series.
- `tests/component/dash-b-*.test.js`: each view with mocked runs (`tests/helpers/dash-b-fixtures.js`), the shared components, jsdom axe on populated states.
- `tests/e2e/dashboards-b.spec.js` (also in `playwright.static.config.js` and the routes in `shell.spec.js`): axe in light, dark and on a phone, with
  every disclosure open, no console errors or warnings, no sideways scroll, 44 px controls, lazy model chunks, and the keyboard-only tasks "set the PPI to
  60% and read the time with pH below 4" (7 Tab presses, 12 arrow presses, 4.0 h of 8 against 7.2 before) and "follow a hypothesis link to its claim".

## Known limits

- The gastric model has no oesophagus, pepsin, gastrin or gut bacteria; swallowed air is an assumed rate; the betaine HCl burning after an ulcer is a mucosal
  question the lumen model cannot answer.
- Histamine pools are lumped, the HNMT share of clearance is assumed (60%, brain 80%), and the link from glycine through SAM to histamine has no human data.
- The GABA-shunt steps GAD and ABAT are drawn with the CBS affinity (K = 0.43 of normal PLP), **assumed**: the methylation model has no GAD or ABAT.
- The bile what-if is linear-regime competition calibrated to 3 : 1; the TMA output is the only human bolus yield scaled linearly.
- `MetabolicMap` draws neither the sign nor the label of a regulation link; they are listed under each map. `LayeredGraph` colours edges by sign and
  hypothesis, not by claim status; the status is printed in the verdict rows.
