# Integrated hepatic methylation model (`src/sim/models/methylation.js`)

One human-liver-scale ODE model that joins the methionine cycle, the folate cycle, transsulfuration, choline/betaine, glycine/serine, the SAM consumers (GNMT, PEMT, GAMT, DNMT, NNMT, other methyltransferases) and the B6, B12, MTHFR and niacin controls. Literature parameters come from `src/sim/data/parameters-b1.js` (Reed 2015 base set; `docs/SIM_PARAMETERS_B1.md`) and `parameters-b2.js` (`docs/SIM_PARAMETERS_B2.md`); the engine is documented in `docs/SIMULATION_ENGINE.md`.

**Everything here is an illustrative educational model.** It is calibrated to published steady states and flux budgets; it is not a measurement of any person and not medical advice. The `label` field of the model says so and must stay visible wherever results are shown.

| File | Content |
| --- | --- |
| `src/sim/models/methylation.js` | the model: tables, flux plan, calibration, controls, observables, `variants`, `getModel`, `methylationModel` |
| `src/sim/models/index.js` | UI entry (data only): model, variants, scenarios, `observablesMeta`, `ontologyBindings`, lazy `parameterSources(id)` / `getSources()` / `loadValidationTargets()` |
| `src/sim/models/methylation-sources.js` | lazy provenance (value, range, source article, locator, confidence per parameter); loads the B1/B2 tables on first use |
| `src/sim/models/methylation-run.js` | `runScenario` (multi-stage runs, doses as events), `steady` (fast steady states), `effect`, `stageValue` |
| `src/sim/models/methylation-ensemble.js` | `methylationEnsemble`, `rankSensitivity`, `ensembleSpace` |
| `src/sim/models/methylation-validate.js` | `runValidation()`: evaluates every target in `validation-targets.js` |
| `src/sim/scenarios.js`, `src/sim/validation-targets.js` | scenario presets and validation targets (pure data) |
| `tests/unit/sim-methylation-{model,validation,scenarios,ensemble}.test.js` | 70 tests |

```js
import { methylationModel, variants, scenarios, observablesMeta, ontologyBindings, parameterSources } from '../sim/models/index.js'
import { runScenario, effect } from '../sim/models/methylation-run.js'
const run = runScenario(scenarios.find((s) => s.id === 'glycine-10g'))            // < 150 ms
const luka = runScenario(scenarios.find((s) => s.id === 'glycine-10g'), { variants: { gnmtGlycineKm: 'luka2000' } })
const km = await parameterSources('km_gnmt_gly')   // { value, low, high, unit, confidence, sourceArticle, locator, origin, note }
```

## Structure

```
 diet -> met --MAT1/MAT3--> sam --GNMT (gly -> sarcosine)--> sah --AHCY (forward/reverse)--> hcy --+-- MTR (5-MTHF, B12) --> met
 (liver)                          |  \-PEMT (PE -> PC, 3 SAM)                                    +-- BHMT (betaine) ---> met
                                  |   -GAMT (creatine), DNMT, other MT                          +-- CBS (SAM-activated, PLP) -> cystathionine
                                  \-NNMT (nicotinamide -> MNA)                                  |        -CTH (PLP)-> cys -> sink
 folate: THF <-> CH2-THF -MTHFR (SAM-inhibited)-> 5-MTHF -MTR-> THF ; CH2-THF <-> 10-formyl-THF (MTHFD1) -> purines, CO2 ; TS/DHFR cycle
         SHMT (ser + THF <-> gly + CH2-THF), GCS (gly + THF -> CH2-THF), DMGDH/SARDH (DMG, sarcosine -> CH2-THF)
 choline -> CHDH/BADH -> betaine -> BHMT -> DMG -> DMGDH -> sarcosine -> SARDH -> glycine ;  choline <-> PC (Kennedy, PLD), PE -> PC (PEMT)
 plasma/gut pools: glycine, betaine (PK-calibrated), tHcy (hepatic export + extra-hepatic production and B12/folate-dependent remethylation)
```

33 species (24 dynamic liver and plasma pools, 5 gut depots in umol, 4 held-constant buffers incl. relative PLP), 72 reactions, 140 constants, 12 controls, 24 observables. Methyl and folate accounting is checked structurally and in simulation (tests).

## Units and the reconciliation of B1 and B2

* **Units**: concentration uM (umol per litre of hepatic cell water), time h, flux uM/h. Gut depots are in umol. Both B1 and B2 use uM and h; B2 whole-body fluxes (mmol/day) must be converted.
* **Liver volume**: B1 only used 1.5 L for an illustration; B2 assumes 1.0 L (`hepatic-cytosolic-volume-L`). The model uses **1.0 L** wherever a plasma pool and the liver exchange mass (stoichiometry `V_liver / V_distribution`, e.g. 1/51 for glycine, 1/30.7 for betaine).
* **Flux scale, explicit**: the Reed 2015 liver cycle runs at 100 uM/h = 2.4 mmol/day (1 L), which is **12%** of the whole-body transmethylation of parameters-b2 (20 mmol/day) and of Storch 1988 (16.7 mmol/day). The model keeps the Reed liver numbers for all baseline fluxes and converts whole-body **chronic loads** (niacin, choline, methionine) with a proportional share: `loadScale = 5 uM/h per mmol/day` (= 100 uM/h / 20 mmol/day; ensemble range 3-8). Applying 41.7 uM/h per mmol/day (liver does everything) would put a 2 g niacin load at 365 uM/h, 3.6x the whole liver cycle. Acute **doses** are different: they enter body pools of known apparent volume (glycine 51 L, betaine 30.7 L from the PK papers) or an assumed first-pass volume (methionine 80 L, choline 20 L, niacin 40 L). The validation row `S-scale` records the disagreement (12% vs a plausible liver share of 30-85%).
* **Flux partition conflicts** (documented, `S-shares-b2`): Reed 2015 puts GNMT at 44% of SAM use; the B2 whole-body budget puts it at about 15% (liver-only about 21%) and creatine at 36% (vs 25%). The default follows Reed; the variant `samConsumerBudget: 'b2budget'` switches, and the ensemble samples GNMT flux over 15-44 uM/h.
* **Contested constants carried as variants** (B1/B2 notes): GNMT Km(glycine) 130 uM vs mM; BHMT Km(betaine) 100 uM vs 2.2 mM; PEMT flux (SAM budget vs PC-pool fraction, B2 contested #2).

## Calibration (how Vmax values arise)

No source gives absolute Vmax values. `buildMethylationModel` (a) sets the reference concentrations (Reed 2015 Table 1 for the methionine cycle; parameters-b2 liver values for choline/betaine/glycine), (b) fixes a **flux plan** (`PLAN`, uM/h) from Reed 2015 and the B2 budgets, and (c) solves every maximal rate, first-order constant and boundary input so that each reaction carries its planned flux at the reference state. The reference state is therefore an exact steady state (residual 1e-13), and the fitted Vmax values land near the published ones (MAT-I 262 vs 260, MAT-III 221 vs 220, AHCY forward 321 vs 320 and reverse 1308 vs 1310 uM/h). Variants and ensemble members re-run the calibration, so every one of them starts at its own steady state.

Rate laws are compositions of engine laws and modifiers. A factor `x/(K+x)` that must vanish at x = 0 is written as `allostericActivation` with fold `SATF = 1000`; the factor is absorbed by the calibrated Vmax, so the reported Vmax of such reactions is `Vmax_true / 1000^k` (unit string `uM/h (scaled)`). Shape-matched approximations of published laws (documented in `methylation-sources.js`): MAT-I SAM inhibition `0.23 + 0.8 exp(-0.0026 SAM)` as a Hill factor (residual 0.23, Ki 270 uM, n 1.45; deviation < 3%), BHMT's `exp(-0.0021 (SAM+SAH))` as two `1/(1+X/365)` factors, GNMT's two-step 5-MTHF binding (Reed: k1 50, k2 1, k3 1, k4 1.6) as two inhibition factors (Ki 0.04 uM with residual 0.5, then Ki 1.5 uM; within 5% of the binding model), SAH inhibition of GNMT with Hill n as `Ki/n`, MTHFR's `SAM - SAH` as SAM alone, CBS's SAM activation with a non-zero floor (fold 3).

## Equations (reaction table)

Fluxes in uM/h; `S` = substrate; `sat(x,K)` = `x/(K+x)`; `inh(x,K)` = `K/(K+x)`; PLP factor `f(P) = sat(P, Kplp)` (P relative cellular PLP, 1 at baseline; normalised by calibration).

| Reaction (id) | Ontology | Rate law | Main constants |
| --- | --- | --- | --- |
| MAT-I (`mat1`) | `reaction:mat-sam-synthesis` | `V sat(Met,41) [0.23 + 0.77/(1+(SAM/270)^1.45)]` | Km 41 uM (rat; 14-720) |
| MAT-III (`mat3`) | same | `V Met^n/(111^n+Met^n) [1 + 7.2 SAM^2/(360^2+SAM^2)]` | S0.5 111 uM, n 1.21 (1.8 measured) |
| GNMT (`gnmt`) | `reaction:gnmt-glycine-methylation` | `V SAM^n/(Ks^n+SAM^n) sat(Gly,Km) inh(SAH,Ki/n) h1(5MTHF) h2(5MTHF)`, `h1 = 0.5 + 0.5 inh(.,0.04)`, `h2 = inh(.,1.5)` | Ks 100 uM, n 2 (1-2.3), Km(gly) 130 uM (12-20000), Ki(SAH) 35/2, IC50(5-MTHF) 1.5 uM (0.27-590) |
| PEMT (`pemt`) | `reaction:pemt-pe-to-pc` | `V SAM/(18.2 (1+SAH/3.8)+SAM) sat(PE,5000)`; 3 SAM -> 3 SAH per PC | Km 18.2, Ki(SAH) 3.8 uM |
| GAMT (`gamt`) | `reaction:gamt-creatine-synthesis` | `V SAM/(49 (1+SAH/16)+SAM)` (GAA held constant) | Km 49 (6.7-49) uM |
| DNMT (`dnmt`), other MT (`mt_other`) | `reaction:dnmt-dna-cytosine-methylation` | `V SAM/(Km (1+SAH/Ki)+SAM)` | DNMT Km 1.4, Ki 1.4; other: 50, 10 |
| NNMT (`nnmt`) | `reaction:nnmt-nicotinamide-methylation` | `V SAM NAM/((1.8+SAM)(430+NAM)) inh(MNA,60)` | Km(SAM) 1.8, Km(NAM) 430, IC50(MNA) 60 uM |
| AHCY (`ahcy_f`, `ahcy_r`) | `reaction:ahcy-sah-hydrolysis` | `Vf sat(SAH,6.5)`, `Vr sat(Hcy,150)` (net = difference, Reed form) | Vf 321, Vr 1308 uM/h |
| MTR (`mtr`) | `reaction:mtr-methionine-synthase` | `V 5MTHF Hcy/((25+5MTHF)(1+Hcy))`, B12 control multiplies | Km 25 / 1 uM |
| BHMT (`bhmt`) | `reaction:bhmt-betaine-homocysteine` | `V Bet/(Km (1+DMG/Ki)+Bet) sat(Hcy,12) inh(SAM,365) inh(SAH,365)` | Km(bet) 2200 uM (23-2200), Ki(DMG) 100 uM |
| CBS (`cbs`) | `reaction:cbs-cystathionine-synthesis` | `V Hcy/(1000+Hcy) sat(Ser,2000) [1+2 SAM^2/(30^2+SAM^2)] f_cbs(P)` | Kplp 0.43 |
| CTH (`cth`) | `reaction:cth-cystathionine-cleavage` | `V Cysta/(500+Cysta) f_cth(P)` | Kplp 0.86 |
| MTHFR (`mthfr`) | `reaction:mthfr-methylene-thf-reduction` | `V sat(CH2THF,50) [0.046 + 0.954 inh(SAM,10)]` | SAM Ki 10 uM |
| SHMT (`shmt_f`, `shmt_r`) | `reaction:shmt-serine-glycine-interconversion` | `V THF Ser/((50+THF)(600+Ser)) f_s(P)` and `V Gly CH2THF/((10000+Gly)(3200+CH2THF)) f_s(P)` | exchange flux 210 uM/h each way (20-1000) |
| GCS (`gcs`) | `reaction:glycine-cleavage-system` | `V sat(Gly,6000) sat(THF,100) f_g(P)` | Km(gly) 6 mM |
| MTHFD1 (`mtd_f`, `mtd_r`, `fts`), FTD, purines, TS, DHFR | `reaction:mthfd1-*`, `aldh1l1`, `gart`, `tyms`, `dhfr` | Michaelis-Menten in the folate substrate | B1 constants |
| CHDH+BADH (`chdh`), Kennedy (`chok`), PLD (`pld`) | `reaction:chdh-choline-oxidation`, `choline-kinase-phosphocholine`, `pld-phosphatidylcholine-hydrolysis` | `V sat(Cho,7000)`, `V sat(Cho,200)`, `k PC` | gross Kennedy flux 100 uM/h |
| DMGDH (`dmgdh`), SARDH (`sardh`) | `reaction:dmgdh-*`, `sardh-*` | `V sat(DMG,300) sat(THF,10)`, `V sat(Sar,500) sat(THF,10)`; each yields CH2-THF | B2 Km |
| Transport and PK | - | glycine: MM uptake, first-order efflux, plasma pool (ka 3/h, 51 L, clearance 0.9/h); betaine: MM uptake with trans-inhibition (Ki 3 mM), plasma pool (ka 5.2/h, 30.7 L, ke 0.045/h); tHcy: hepatic export + extra-hepatic production, removed by kidney (25%) and B12/folate-dependent remethylation (75%) | assumed unless stated |
| Folate supply and loss | - | constant 5-MTHF input; first-order loss of every folate form (0.002 /h), so total folate follows supply | assumed |

## Controls and observables

Controls (min / default / max, unit): glycine load 0/0/30 g/day, extra choline 0/0/4000 mg/day, betaine 0/0/12 g/day, niacin 0/0/4 g/day, folate supply 0/1/4 x, methionine intake 0/1/2.5 x, B12 activity (methionine synthase, also the extra-hepatic arm) 0/1/1.5 x, B6 status (relative PLP; CBS, CTH, SHMT, GCS) 0.05/1/3 x, MTHFR activity 0.1/1/1.5 x (677TT ~ 0.3-0.5), GNMT 0/1/3 x, BHMT 0/1/3 x, PEMT 0/1/4 x. Acute doses are events on the gut depots (`dose: { glycine: 5 }` in grams, expanded by `runScenario`).

Observables: `samSahRatio` (= `methylationIndex`), `methylationPotential`, `tHcy`, `samUseTotal`, consumer shares (`gnmtShare`, `pemtShare`, `gamtShare`, `dnmtShare`, `nnmtShare`), `transsulfurationFraction`, `remethylationFraction`, `bhmtShareOfRemethylation`, `folateTotal`, `mthfFraction`, pools. `observablesMeta` carries label, unit and group.

## Variants (scenario switches)

| Variant key | Options | Effect |
| --- | --- | --- |
| `gnmtGlycineKm` | `reed130` (default), `luka2000` | GNMT glycine saturation at 1.66 mM: 93% vs 45%; Vmax recalibrated (2.1x) |
| `bhmtBetaineKm` | `reed100`, `human2200` (default) | BHMT betaine saturation at 1.16 mM: 92% vs 35%; Vmax recalibrated |
| `samConsumerBudget` | `reed2015` (default), `b2budget` | GNMT share 44% -> 18%, PEMT 27% -> 23%, creatine 25% -> 45% (total SAM use 101 -> 82 uM/h; the 21% "unaccounted" part of the B2 budget is not assigned) |

`getModel({ gnmtGlycineKm: 'luka2000' })`, `runScenario(s, { variants })` and `scenario.variants` select them; scenarios `glycine-10g-luka` and `betaine-6g-day-reed100` show them side by side.

## Scenarios

All 25 run 72 h with a baseline stage first (`runScenario`), in 25-120 ms. Evidence: **supported** (human data for the direction), **partly**, **hypothesis** (mechanistic, no human data). Expected outcomes are asserted in `tests/unit/sim-methylation-scenarios.test.js`.

| Scenario | Expected outcome | Evidence |
| --- | --- | --- |
| `baseline-fed` | flat reference state | supported (calibration) |
| `glycine-3g/5g/10g`, `glycine-10g-luka`, `glycine-10g-day` | plasma/hepatic glycine up and back; GNMT flux and sarcosine up only if Km(gly) is mM; SAM:SAH change small (see ensemble) | **hypothesis** |
| `choline-500mg/2g`, `betaine-3g`, `betaine-6g-day` | betaine and BHMT up, Hcy and tHcy down (needs the unsaturated BHMT variant) | partly / supported |
| `mthfr-677tt`, `mthfr-677tt-low-folate` | 5-MTHF down, tHcy up (more at low folate), SAM:SAH down | supported (tHcy) |
| `b6-restriction`, `b6-severe`, `methionine-load-test-b6` | cystathionine up; post-load tHcy increment larger; fasting tHcy up (the study saw none) | supported / known mismatch |
| `b12-deficiency`, `b12-severe` | folate trap (5-MTHF up, THF and formyl-THF down), tHcy up; SAM:SAH direction parameter-dependent | supported (trap) |
| `niacin-500mg`, `niacin-2g` | NNMT flux and MNA up, SAH up, SAM and SAM:SAH down (2 g: about -50%) | partly (no human SAM/SAH) |
| `pemt-upregulation` | SAM use by PC synthesis up 75%, SAM:SAH down about 23% | partly |
| `methionine-meal`, `methionine-load-test` | SAM, SAH, GNMT, CBS surge; SAM:SAH dips; tHcy peaks 4-5 h after the dose (+68% at 100 mg/kg) | partly / supported |
| `glycine-niacin-low-folate`, `glycine-low-folate` | under-methylation-like: SAM and SAM:SAH fall by about half (almost entirely the niacin part) | **hypothesis** |

## Parameter provenance summary

140 constants: 67 carry B1/B2 provenance (value, range, article, locator, confidence; some are shape fits of a published law), 46 are calibrated (derived from the flux plan), 26 are assumptions stated in `methylation-sources.js` (transport splits, absorption rates, folate loss, THF Km of GCS/DMGDH/SARDH, CBS floor, ...). `parameterSources(id)` returns the record for the UI's inspectable panel; a derived constant states its target flux. Engine confidence tokens: B1/B2 `measured` -> `high`, `fitted-in-model`/second-hand -> `medium`, `estimated` -> `low`, `assumed` -> `assumed`.

## Validation results

`runValidation()` evaluates 41 targets: **28 pass, 13 documented disagreements** (`MISMATCH` rows carry a `why`). Each status is pinned in `validation-targets.js` and asserted, so a change that flips a result fails the tests.

| id | check | source | tolerance | model | status |
| --- | --- | --- | --- | --- | --- |
| S-steady | Steady state exists, is positive and converged | reed-2015-competing-methyltransferases | 1e-9 relative | residual 7.6e-14, min species 0.0e+0 | PASS |
| S-stable | Steady state is stable (relaxation from +-30% random perturbations) | - | 1% | max deviation from the steady state: 19.0% at 150 h (folate, PE and PC pools relax with half-lives of weeks), 0.2% at 3000 h; no growth in 3 random +-30% perturbations | PASS |
| S-sam | Hepatic SAM | reed-2015-competing-methyltransferases | +-10% | 23.97 uM | PASS |
| S-sah | Hepatic SAH | reed-2015-competing-methyltransferases | +-10% | 3.89 uM | PASS |
| S-ratio | SAM:SAH ratio | finkelstein-1982-methionine-metabolite-concentrations, bravo-2022-sam-sah-reference-values, teng-2011-bhmt-knockout-liver-pools | range | SAM:SAH 6.16 | PASS |
| S-thcy | Plasma total homocysteine | duncan-2013-population-model-folate | range 5.7-8.3 | 7.00 uM | PASS |
| S-mat | Total MAT (SAM synthesis) flux | reed-2015-competing-methyltransferases | +-5% | MAT-I 78.1 + MAT-III 22.6 = 100.6 uM/h | PASS |
| S-shares-reed | SAM-consumer shares (liver model) | reed-2015-competing-methyltransferases | +-3 percentage points | GNMT 43.7%, PEMT 27.4%, GAMT 25.3%, DNMT 2.0% (Reed 2015: 44 / 27 / 25 / 2); max deviation 0.2% | PASS |
| S-shares-b2 | SAM-consumer shares against the whole-body budget of parameters-b2 | mudd-2007-methyl-balance, brosnan-2011-creatine-synthesis-burden, stead-2006-methyl-balance-reevaluation | ranges | GNMT 43.7% (whole-body budget 14.5%, range 9.5-31%), creatine 25.3% (budget 36%, range 18-73%) | MISMATCH (explained) |
| S-partition | Transmethylation / transsulfuration partition | storch-1988-methionine-cycle-humans, finkelstein-1984-homocysteine-distribution, mudd-1975-labile-methyl-balances | 0.40-0.70 | transsulfuration 49.7% of homocysteine disposal; 2.01 methionine cycles per cystathionine (Mudd >= 1.9) | PASS |
| S-bhmt-share | BHMT share of remethylation | finkelstein-1984-homocysteine-partition-rat-liver | 35-65% | BHMT 48.9% of remethylation | PASS |
| S-met-balance | Methionine balance | - | 1e-6 uM/h | methionine in 51.500 = CBS 50.000 + Hcy export 1.500 uM/h | PASS |
| S-scale | Absolute flux scale: liver share of whole-body transmethylation | mudd-2007-methyl-balance, storch-1988-methionine-cycle-humans | >= 30% | model liver (1 L) transmethylation 101 umol/h = 2.4 mmol/day = 12.1% of whole-body 20 mmol/day | MISMATCH (explained) |
| S-folate-total | Total folate pool | reed-2015-competing-methyltransferases | range | 14.4 uM of modelled folate forms (Reed total 20) | MISMATCH (explained) |
| S-gnmt-gly-sat | GNMT glycine saturation at hepatic glycine | ogawa-1982-gnmt-rat-liver | 90-96% | GNMT glycine saturation 92.7% with Km 130 uM (B1 note: ~93%), 45.4% with Km 2 mM | PASS |
| S-pemt-fraction | PEMT flux as fraction of the liver PC pool | pynn-2011-human-pemt-flux | range | PEMT makes 0.053%/h of the PC pool (Pynn 2011: 0.53%/h, range 0.27-1.06) | MISMATCH (explained) |
| S-gly-pk | Plasma glycine after 4.6 g (1 mmol/kg lean mass) | gannon-2002-glycine-insulin | +-15%, peak 25-55 min | peak 953 uM at 35 min (Gannon 2002, unverified secondhand: 217 -> 909 uM at 40 min; 414 uM at 120 min, model 512) | PASS |
| S-bet-pk | Plasma betaine after 50 mg/kg | schwahn-2003-betaine-pharmacokinetics | Cmax +-15%, t1/2 6-32 h | Cmax 961 uM at 0.88 h, late half-life 22.3 h (Schwahn 2003, 50 mg/kg: 939 uM, 0.9 h, 14.4 h [6-32]) | PASS |
| D-betaine-hcy | Betaine lowers fasting tHcy in a dose-dependent way | olthof-2003-betaine-low-dose-homocysteine | 6 g/day within -28..-10%, monotone | tHcy -12.9% / -14.1% / -14.9% at 1.5 / 3 / 6 g/day (Olthof 2003: -12% / -15% / -20%) | PASS |
| D-betaine-postload | Betaine lowers the post-methionine-load tHcy increment | olthof-2003-betaine-low-dose-homocysteine | -60..-20% | post-load tHcy increment 4.7 -> 3.8 uM with betaine 6 g/day (-20.2%; Olthof 2003: -40%) | PASS |
| D-choline-hcy | Choline lowers fasting tHcy | olthof-2005-phosphatidylcholine-homocysteine | -30..-6% | tHcy -11.8% at +2.6 g choline/day (Olthof 2005: -18%) | PASS |
| D-choline-bhmt | Choline and betaine raise BHMT flux and lower hepatic Hcy | modinger-2019-choline-bitartrate-vs-krill-pc | sign | BHMT flux 36.8% (choline 2 g/day), 52.5% (betaine 3 g/day); liver Hcy -15.7% / -21.3% | PASS |
| D-mthfr | MTHFR 677TT-like (0.4x): tHcy up, 5-MTHF down | yamada-2001-mthfr-polymorphisms, sadre-marandi-2018-hepatic-one-carbon-sex | sign | MTHFR 0.4x: tHcy 52.6%, 5-MTHF -45.6%, SAM:SAH -16.1% | PASS |
| D-b6-cysta | B6 restriction raises cystathionine | gregory-2013-b6-restriction-metabolomics | +30..+90% | cystathionine 68.2% at PLP 41% (Gregory 2013: +52% and +66%) | PASS |
| D-b6-thcy | B6 restriction leaves fasting tHcy unchanged | gregory-2013-b6-restriction-metabolomics, lamers-2011-b6-restriction-methionine-cycle | /change/ < 5% | fasting tHcy 24.3% (restriction study: unchanged) | MISMATCH (explained) |
| D-b6-glycine | B6 restriction raises glycine | davis-2005-b6-restriction-homocysteine, lamers-2009-b6-restriction-glycine | +10..+29% | hepatic glycine 2.4% (plasma glycine +10-29% in restriction studies) | MISMATCH (explained) |
| D-b6-postload | B6 restriction enlarges the post-load tHcy increment | ubbink-1996-b6-methionine-load | sign | post-load tHcy increment 4.7 -> 6.3 uM (B6 restriction: larger, Ubbink 1996) | PASS |
| D-b12-trap | B12 deficiency: methyl-folate trap and hyperhomocysteinaemia | nijhout-2004-folate-cycle-model | signs, total folate +-1% | B12 0.2x: 5-MTHF 113.7%, THF -70.9%, 10-formyl-THF -62.5%, tHcy 87.3%, total folate 0.0% | PASS |
| D-b12-ratio | B12 deficiency lowers SAM:SAH | nijhout-2004-folate-cycle-model | sign | SAM:SAH 28.6% (cobalamin-deficiency literature: SAM low-normal, SAH up; model: trapped 5-MTHF inhibits GNMT) | MISMATCH (explained) |
| D-niacin | Niacin load raises SAH and lowers SAM:SAH | pissios-2017-nnmt-methyl-sink | signs, ratio < -5% | niacin 2 g/day: SAH 21.9%, SAM -38.1%, SAM:SAH -49.2%, NNMT 52 uM/h | PASS |
| D-niacin-thcy | Niacin raises tHcy | garg-1999-niacin-homocysteine | +5..+60% | tHcy 3.7% at 1 g/day niacin (Garg 1999: +17% during titration to 1 g, +55% at 18 weeks) | MISMATCH (explained) |
| D-niacin-methyl | Fraction of niacin methylated by NNMT | menon-2007-niacin-er-pharmacokinetics | 50-80% | 64.1% of niacin methylated at 2 g/day (B2: 4.38-6.3 mmol methyl/g of 8.12 mmol/g = 54-78%) | PASS |
| D-glycine-sarcosine | Glycine bolus raises GNMT flux and sarcosine | luka-2009-gnmt-sam-regulation | Luka Km: both up | 10 g glycine bolus, peak GNMT flux / sarcosine / trough SAM:SAH: Reed Km 1.7% / 0.0% / -1.6%; Luka Km 9.5% / 3.8% / -9.0% | MISMATCH (explained) |
| D-glycine-chronic-sarcosine | Chronic glycine raises hepatic sarcosine | alves-2022-glycine-mouse-sarcosine | > +20% | chronic glycine 10 g/day: liver sarcosine -5.6% (Reed Km), -1.7% (Luka Km); mouse +86% (Alves 2022) | MISMATCH (explained) |
| D-glycine-thcy | Glycine supplementation and tHcy | tan-2025-glycine-supplement-obesity-hcy | 0..+15% | tHcy -8.9% at 7 g/day glycine (Tan 2025: +0.6 uM = +6%); the serine -> CBS arm lowers Hcy in the model | MISMATCH (explained) |
| D-folate-low | Low folate supply: SAM down, tHcy up | nijhout-2004-folate-cycle-model | signs | folate supply 0.5x: total folate -50.0%, tHcy 46.1%, SAM -26.7% | PASS |
| D-met-load | Methionine load test (100 mg/kg) | ubbink-1996-b6-methionine-load | +40..+200%, peak 3-10 h | 100 mg/kg methionine: tHcy peaks 67.8% at 4.8 h after the dose (clinical test: roughly +100% at 4-8 h) | PASS |
| D-gnmt-ko | GNMT loss raises SAM 30-fold | baric-2017-gnmt-deficiency-case, luka-2006-gnmt-knockout-mouse-sam | x28-47 | GNMT activity 0: SAM x2.6 (human deficiency x28-47, mouse x36), SAH -18.0% (mouse: falls 12-15 -> 3-5) | MISMATCH (explained) |
| D-bhmt-ko | BHMT loss: SAM down, SAH and tHcy up | teng-2011-bhmt-knockout-liver-pools | SAM x0.4-0.8, SAH > x1.5, tHcy > x3 | BHMT activity 0: SAM x0.74 (mouse x0.57), SAH x0.87 (mouse x2.6), tHcy x1.47 (mouse x8) | MISMATCH (explained) |
| C-folate | Total folate is conserved by the closed folate reactions | - | exact (stoichiometry) | closed folate reactions conserve total folate; the only open reactions are fol_in, fol_loss_ch2thf, fol_loss_dhf, fol_loss_f10, fol_loss_mthf, fol_loss_thf | PASS |
| C-methyl | Methyl-group accounting with boundary exchanges | - | exact (stoichiometry) | internal methyl transfers (MAT, GNMT, PEMT, BHMT, MTR, MTHFR, DMGDH, SARDH, CHDH, Kennedy, PLD) conserve methyl groups; 26 boundary reactions exchange them: bet_efl, bet_up, cho_abs, cho_diet, cho_in, cho_out, dmg_out, dnmt, fol_in, fol_loss_ch2thf, fol_loss_f10, fol_loss_mthf, ftd, fts, gamt, gcs, met_abs, met_in, mt_other, nnmt, pc_out, pur, sar_out, shmt_f, shmt_r, ts | PASS |

### Reading the disagreements

* **Scale and budgets** (`S-scale`, `S-shares-b2`, `S-pemt-fraction`, `S-folate-total`): inherited from B1 vs B2 (above); not parameter errors.
* **Knockouts** (`D-gnmt-ko`, `D-bhmt-ko`): directions are right (SAM up when GNMT is lost, SAM down when BHMT is lost) but the magnitudes are not: SAM rises x2.6 (x6.5 with GAMT Km 6.7 uM) against x28-47 in GNMT deficiency, and BHMT loss raises tHcy only 1.5x against x8 in the mouse. The net methionine input is fixed (Reed), consumers have spare capacity, and CBS is first-order in Hcy (Km 1 mM) so it absorbs extra Hcy. In the ensemble (below) no member reaches x10. **GNMT/SAM effects from this model should be read as lower bounds.**
* **B6** (`D-b6-thcy`, `D-b6-glycine`): cystathionine +68% (study +52-66%) is reproduced; fasting tHcy rises 24% (study: unchanged) because CBS falls to 70% of baseline at PLP 41% (equating cellular with plasma PLP is probably wrong); hepatic glycine does not rise because SHMT and GCS scale together. The brief's "B6 down -> cystathionine down" is the CBS-deficiency pattern: in B6 deficiency CTH is the more sensitive step and cystathionine rises (classical cystathioninuria).
* **B12 and SAM:SAH** (`D-b12-ratio`): the model's trapped 5-MTHF inhibits GNMT, so SAM use falls and SAM:SAH rises (+29%); the hyperhomocysteinaemia and folate trap are reproduced. Parameter-dependent (ensemble).
* **Glycine** (`D-glycine-sarcosine`, `D-glycine-chronic-sarcosine`, `D-glycine-thcy`): see Key predictions.

## Ensemble: which conclusions are robust

`methylationEnsemble` (n = 100, seed 7, 3.3 s for the 72 h glycine scenario, 34 ms per member) samples the kinetic constants over their literature ranges (log-uniform; 109 inputs in all), the flux partition (`PLAN`: GNMT share 15-44 uM/h, SHMT exchange 20-1000, GCS, one-carbon sinks), the load scale (3-8), body-pool volumes and uncertain reference concentrations (hepatic glycine 600-4000 uM, betaine 830-1490, serine 250-900), recalibrates the model per member, and reports each effect relative to the member's own steady state. The engine's `ensemble()` cannot do this (a sampled Km would move the baseline) and cannot select the stiff solver (about 100 ms per member, 10 s for n = 100); it still runs on the fixed model and is tested.

| Question | Result (median [p5, p95]) | Fraction of members | Verdict |
| --- | --- | --- | --- |
| **10 g glycine bolus: trough SAM:SAH** | **-5% [-24%, 0]** | **below -5%: 0.51; below -10%: 0.30; below -20%: 0.11** | parameter-dependent; GNMT Km(gly) is the driver (rank correlation -0.90) |
| same, Reed Km 130 uM | -1% [-3%, 0] | 0.02 / 0.01 / 0.00 | robustly no effect |
| same, Luka Km 2 mM | -9% [-29%, -4%] | 0.81 / 0.41 / 0.12 | robustly a modest dip (4-30%), transient |
| 5 g bolus (full) | -4% [-18%, 0] | 0.44 / 0.21 / 0.03 | smaller |
| 10 g bolus: SAM trough | -9% [-25%, -2%] | below -5%: 0.77 | SAM falls more robustly than SAM:SAH (SAH falls too) |
| 10 g bolus: peak GNMT flux / sarcosine | +8% [0, +39%] / +8% [0, +38%] | above +5%: 0.61 / 0.58 (Reed Km 0.03 / 0.19, Luka Km 0.97 / 0.70) | direction (never negative) robust, size small |
| glycine 10 g/day (chronic): final SAM:SAH | +2% [-10%, +18%] | below -5%: 0.13; above +5%: 0.31 | sign not robust |
| glycine 10 g/day: tHcy | -13% [-40%, -3%] | below -5%: 0.86 | robust inside the model (serine -> CBS arm), opposite to the human +6% |
| niacin 2 g/day: SAM:SAH | -74% [-98%, -25%] | below -20%: 0.98 | robust (drivers: load scale, NAM salvage capacity); size depends on `loadScale` |
| niacin 500 mg/day: SAM:SAH | -6% [-26%, -1%] | below -5%: 0.58; below -10%: 0.34 | modest |
| MTHFR 0.4x | 5-MTHF -50% [-55, -43]; tHcy +65% [+40, +99]; trough SAM:SAH -8% [-29, 0] | tHcy up and 5-MTHF down in every member; SAM:SAH below -5%: 0.61 | direction robust; SAM:SAH driven by the 5-MTHF inhibition constant of GNMT (+0.79) |
| B12 0.2x | tHcy +94% [+43, +132]; 5-MTHF +123% [+113, +132]; final SAM:SAH +14% [-11, +79] | SAM:SAH above +5%: 0.70; below -5%: 0.11 | trap and tHcy robust; SAM:SAH sign parameter-dependent |
| B6 PLP 0.41 | cystathionine +65% [+46, +84]; tHcy +24% [+10, +46] | all members | cystathionine robust; fasting tHcy rise robust inside the model (conflicts with the study) |
| betaine 6 g/day: tHcy | -3% [-12, 0]; Km(bet) 2.2 mM: -10% [-24, -1]; Km 100 uM: -2% [-7, 0] | below -5%: 0.29 / 0.78 / 0.12 | the human effect (-20%) needs an unsaturated BHMT |
| PEMT 2x | SAM:SAH -24% [-36, -16] | all members below -5% | robust |
| GNMT activity 0 (knockout) | SAM x1.7 [x1.3, x3.1] | no member reaches x10 | structural limitation, not parameters |

## Key predictions

1. **The glycine -> SAM drain is small, transient and Km-dependent.** A 10 g glycine dose lowers SAM:SAH by about 5% (median) for a few hours; more than 5% in half of the parameter sets, more than 20% in about one in ten. With the rat GNMT glycine Km (130 uM) the enzyme is already 93% glycine-saturated and there is no effect; with a mM Km the dip is 4-30% and GNMT flux rises 5-37%. Chronic glycine does not lower SAM:SAH in the model (SAM feedback with Hill n 2 plus higher 5-MTHF, which inhibits GNMT, and the serine -> CBS arm cancel the extra GNMT flux). **There are no human SAM, SAH or sarcosine data after glycine; this stays a hypothesis.**
2. **Niacin is the strong methyl sink**: 2 g/day methylates about 64% of the dose in the base case (NNMT 52 uM/h on a 100 uM/h cycle) and cuts SAM:SAH by about half in the base case. Human SAM/SAH data after niacin do not exist.
3. **BHMT betaine Km decides whether betaine and choline work**: with Km 100 uM, BHMT is saturated by hepatic betaine and betaine barely changes tHcy; with 2.2 mM tHcy falls 15% (6 g/day), close to the trials.
4. **Folate genotype/vitamin effects are robust in direction but not in SAM:SAH**: MTHFR 0.4x and B12 deficiency raise tHcy robustly, while their SAM:SAH effect depends on how strongly 5-MTHF inhibits GNMT (0.27-590 uM).
5. **PEMT induction lowers SAM:SAH by about a quarter** in every member.

## Runtime and bundle size

* 72 h scenario, `method: 'rosenbrock'`, rtol 1e-4: 20-120 ms (all 25 presets; <150 ms asserted); cold start with background steady state adds 10-150 ms (`steady`, pseudo-transient Newton).
* Ensemble n = 100 of the 72 h glycine scenario: 3.3 s (limit 10 s); the other scenarios 1.2-3.5 s.
* Gzip: model module with the engine compile path 13.4 kB; UI entry point (model, variants, scenarios, observable meta, bindings) 19.1 kB (limit 25 kB). Parameter notes and the B1/B2 literature tables (330 kB raw) load lazily through `methylation-sources.js`; validation targets are lazy too.

## Engine notes (worked around; engine files unchanged)

1. `simulate` with `method: 'auto'` hands over from dopri5 to Rosenbrock late on this model (354 steps vs 47 after a dose); with `atol` 1e-3 it never switched (6491 steps) and `rtol` 1e-2 needed 19678 steps. The runner passes `method: 'rosenbrock'`.
2. `steadyState` needs 0.2-5 s because of the weeks-long folate/PE/PC modes and failed (non-convergence after 5 s) for a niacin 3 g + folate 0.3x extreme; `newtonSteady` (pseudo-transient Newton from the reference state) takes 10-150 ms.
3. `ensemble()` has no way to pass the solver method or tolerances and cannot recalibrate; hence `methylationEnsemble`.
4. The rate-law registry cannot express a factor that is zero at zero except as `allostericActivation` with a large fold (`SATF`); a `saturation` modifier law would remove the scaled Vmax.
5. Stoichiometry `n` is a literal (not a parameter id), so body-pool volumes are build-time options, not engine parameters.
6. Controls are fixed per run; time-varying controls are done by stages in `runScenario`.

## Known limitations

* Net methionine input is fixed (Reed); no methionine/protein reservoir. Knockout magnitudes (GNMT, BHMT) are far too small and tHcy in B12/B6/BHMT-deficient states is damped by CBS.
* The folate pool omits methenyl-THF as a separate species, polyglutamates, mitochondrial compartmentation (GCS and SHMT2 are lumped into the cytosolic pool; formate held constant) and thymidylate/purine regulation; one-carbon sink fluxes (TS 40, purines 120, FTD 40 uM/h) are assumptions.
* The SHMT exchange flux (210 uM/h each way), GCS flux (100 uM/h) and the glycine/betaine transporter splits are unconstrained; they strongly shape the glycine response (serine -> CBS arm lowers Hcy after glycine, contrary to the human data).
* Hepatic SAM, SAH, glycine, betaine and choline are rodent values (no human liver measurements); plasma values are human.
* One hepatic compartment: no cytosol/mitochondria, no kidney (AGAT, creatine), no gut microbiota (TMA), no adenosine dynamics, no glutathione/oxidative terms, no extra-hepatic SAM consumers except the lumped tHcy arm.
* No sex, age or genotype structure other than the MTHFR activity multiplier.

## What is hypothesis

* Any glycine effect on SAM, SAH or SAM:SAH (human glycine -> SAM drain has no data); the plasma glycine PK rests on one secondhand datum (Gannon 2002).
* Niacin effects on SAM/SAH (only tHcy is measured); the liver share of the NNMT load (`loadScale`).
* Acute choline, methionine and niacin dose-to-liver conversions (assumed first-pass volumes).
* The size of 5-MTHF inhibition of GNMT in vivo and therefore the SAM:SAH response to folate and B12 states.
* Cellular PLP equal to plasma PLP in the B6 scenarios.
