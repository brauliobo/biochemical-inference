# Simulation parameters, set B2

Literature-sourced parameters for the second half of the methylation model: SAM consumers (GNMT, PEMT, GAMT/AGAT, NNMT, COMT, HNMT, DNMT), choline and betaine, glycine and serine, vitamin B6 (PLP), histamine (HNMT/DAO), bile acid conjugation, and gastric acid / bicarbonate / CO2. It is assembled with the methionine-cycle set of agent B1 by the model assembler (B3).

Everything here is for an **illustrative educational model**. It is not a measurement of any person and not medical advice. Every number is labelled with a source article, a locator inside it, and a confidence.

## Conventions (no B1 document existed on `main` when this was written)

| quantity | unit |
| --- | --- |
| concentration | uM (umol/L); tissue nmol/g is treated as ~uM |
| time | hours; rate constants 1/h (kcat in 1/h, converted from per-second or per-minute and stated) |
| whole-body flux | mmol/day for a 70 kg adult; tracer fluxes also given as umol/kg/h; glycine budgets in g/day |
| conversion | 1 mmol/day = 41.667 umol/h (`mmol-per-day-to-umol-per-h`) |
| species ids | `<ontology slug>` for single pools, `<slug>-plasma` / `<slug>-liver` where both are known |

`low` and `high` are the plausible **literature range, not a confidence interval**. A single determination has either `low = value = high` or a documented x/÷2 range. Contested kinetic constants span 7- to 100-fold: sample them on a log scale.

## Files

| file | content |
| --- | --- |
| `src/sim/data/parameters-b2.js` | default export `{ meta, parameters, externalSpecies, species, reactionLaws, fluxBudgets, validationTargets, models, references }` |
| `src/knowledge/data/articles-sim-2.js` | `export default [ ...article entities ]`, 155 new verified articles. **Not yet wired into `src/knowledge/data/index.js`**: add `import sim2 from './articles-sim-2.js'` and concatenate when merging (all ids are new; PMIDs and DOIs do not clash with the existing 253 articles) |
| `docs/SIM_PARAMETERS_B2.md` | this document |

Record shapes (all in the first comment of `parameters-b2.js`):

* `parameters[]`: `{ id, value, low, high, unit, tissue, species, source, extraSources?, locator, confidence, note }`. `source` is `article:<id>` (an entity), `calc:<name>` (arithmetic on cited inputs) or `assumption:<name>`. `confidence`: `measured`, `fitted-in-model` (none; B3 sets these), `estimated`, `assumed`.
* `species[]`: `{ id, name, initial, unit, low, high, compartment, species, source, ontologyId, note }`; `ontologyId` is a verified `compound:` id (null for pH and volume).
* `reactionLaws[]`: `{ id, ontologyId, enzymeId, substrates, products, law, rateExpression, paramIds, modifiers, refs, caveats, fluxTarget? }`; `ontologyId: null` carries an `ontologyGap` note.
* `fluxBudgets[]`: stacked-bar ready: `items[{label,value,low,high,source,note?}]`, optional `totals`, `scenarios`, `cycling`, `contested`.
* `validationTargets[]`: observed magnitudes and directions for B3's tests, including two explicit `no-data` entries (niacin and SAM, glycine and SAM).
* `models`: `gastricAcidCo2` and `betainePk` (equations as text plus worked numbers).

## Counts

148 parameters (101 measured, 41 estimated, 6 assumed), 21 species, 28 reaction laws on 25 distinct ontology reactions (3 without an ontology reaction, 2 modifier-only), 7 flux budgets (34 items), 31 validation targets, 2 small models, 39 external species, 155 new articles (182 references including existing ones).

## Key values

| parameter | value | range | unit | organism | confidence |
| --- | --- | --- | --- | --- | --- |
| total transmethylation (`flux-transmethylation-total`) | 20 | 15-23.5 | mmol/day | human | estimated |
| creatine synthesis (GAMT) | 7.3 | 3.7-14.6 | mmol/day | human | estimated |
| PEMT SAM use | 3.75 | 2.5-5.0 | mmol/day | human | estimated |
| GNMT glycine-to-sarcosine | 2.9 | 1.9-6.2 | mmol/day | human | estimated |
| niacin methylation (`nnmt-methyl-per-g-niacin`) | 4.38 | 4.38-6.3 | mmol methyl/g | human | estimated |
| GNMT Km(SAM) / Km(glycine) / Hill | 100 / 1100 / 1.1 | 30-460 / 130-2000 / 1-2 | uM | rat | measured |
| GNMT Ki(SAH) | 95 | 35-97 | uM | rat | estimated |
| PEMT Km(SAM) / Ki(SAH) | 18.2 / 3.8 | to 302 / to 68 | uM | rat | measured |
| GAMT Km(SAM) | 6.73 | 6.73-49 | uM | rat | measured |
| HNMT Ki(SAH), Km(SAM), Km(histamine) | 6.9, 13.1, 3.7 | to 9; 2-24; to 25 | uM | human | measured |
| BHMT Km(betaine) / Km(Hcy) | 2200 / 4 | 23-2200 / 4-32 | uM | human | measured |
| CHDH Km(choline) | 7000 | 3500-14000 | uM | rat | estimated |
| choline oxidised to betaine | 3.3 | 1.9-3.3 | mmol/day | human | estimated |
| betaine 50 mg/kg: Cmax / terminal t1/2 | 939 uM / 14.4 h | 663-1300 / 6-32 | | human | measured |
| glycine flux, fed (`flux-glycine-whole-body-fed`) | 463 | 408-518 | umol/kg/h | human | measured |
| glycine cleavage flux | 190 | 96-231 | umol/kg/h | human | measured |
| glycine de novo synthesis | 11.2 | 2.9-44.3 | g/day | human | estimated |
| hepatic free glycine | 1660 | 600-4000 | uM | mouse | estimated |
| GCS Km(glycine) | 6000 | 5800-6600 | uM | chicken/rat | measured |
| SHMT / CBS PLP effective half-saturation | 0.10 / 0.43 | 0.03-0.14 / 0.3-0.6 | x baseline PLP | human cells | estimated |
| plasma PLP: baseline / restricted / 50 mg/day | 52.6 / 21.5 / 144.5 | | nM | human | measured |
| DAO Km(histamine) | 19 | 2.8-19 | uM | human | measured |
| gastric BAO / PAO / 24-h acid | 5.1 / 22 / 208 | 3-6.5 / 13.7-43.4 / 190-227 | mmol/h; mmol/24 h | human | measured |
| CO2 molar volume at 37 C | 25.45 (27.1 water-saturated) | | mL/mmol | | estimated (calc) |
| PPI pump recovery half-life | 28 | 28-46 | h | human | measured |
| glycine : taurine biliary conjugates | 0.75 : 0.25 | 0.7-0.8 | fraction | human | measured |

## Flux budgets (for stacked bars)

* **`sam-consumers`** (mmol/day, total 20 [15-23.5]): creatine 7.3, PEMT 3.75, GNMT 2.9, other methyltransferases 1.9, unaccounted 4.2. Scenarios: niacin 2 g/day adds 8.8 (lower bound), vegetarian doubles creatine to 14.6, high creatine intake (rat repression) lowers it to 1.9.
* **`choline-sources`** and **`choline-fate`** (mmol/day): sources are dietary choline 3.2 and PEMT-derived 1.25; fates are oxidation to betaine 3.3, gut TMA 0.16 (assumed), acetylcholine ~0 (assumed), residual 1.0 (calc).
* **`glycine-sinks`** (g/day, net): collagen 12 [4-12], other protein 1, glutathione 0.57, creatine 0.55, haem 0.24, purines 0.21, hippurate 0.6, bile acid conjugation 0.06; supply is 2.9 (synthesis) + 2.25 (diet); the GNMT sarcosine loop (0.22) is cycling, not loss. **`glycine-sources`** has the pathway terms; **`glycine-flux-partition`** the gross 58 g/day turnover (SHMT 24, cleavage 24, rest 10); **`glycine-synthesis-estimates`** the five competing synthesis estimates (2.9, 7.4, 11.2, 24.5, 44.3 g/day, not additive).

## Contested numbers

1. **Creatine share of SAM use**: >70% (older), ~40% (Brosnan 2011), ~45% of a 13.7 mmol/day minimal total in one patient (Mudd 2007, second-hand).
2. **PEMT flux**: 2.5 vs 5 mmol SAM/day; no direct human measurement, only 0.53%/h of the liver PC pool (n=4). PEMT share of hepatic PC: 10-47% depending on species and method.
3. **Total transmethylation**: 15-28 mmol/day depending on fed/fasted weighting and intracellular-enrichment correction (+40%).
4. **GNMT constants**: Km(SAM) 30 to 460 uM, Km(glycine) 0.13 to 2 mM (review range up to 20 mM), Hill 1.1 vs 2, Ki(SAH) 35 vs 97 uM; all rat; no human GNMT kinetics found.
5. **BHMT Km(betaine)**: 23 uM (pig) vs 2.2 mM (human): a 100-fold difference that decides whether betaine dosing acts linearly. Ki(DMG) is second-hand (10 uM-1 mM).
6. **Glycine "deficit"**: the 10 g/day gap rests on 95% recycling of collagen glycine and on summed pathway fluxes (2.9 g/day synthesis); tracer studies give 2.5 to 44 g/day synthesis. No direct test of the deficit exists.
7. **Glycine cleavage flux**: 190 vs 96 umol/kg/h depending on tracer.
8. **Gastric**: peak acid output 13.7 to 43.4 mmol/h across studies; healthy vs GERD vs H. pylori status; duodenal PCO2 ~400 mmHg rests on canine data.
9. **Histamine peak at 2-4 am**: plasma histamine is ~2x higher at 04:00 than 16:00 (Szefler 1991) and a 5 a.m. acrophase exists (Rehn 1987, with two daytime maxima), but urinary histamine shows no rhythm; the timing is "pre-dawn", not specifically 2-4 am. Serum DAO ELISA is a poor diagnostic (44% of 1051 adults below the 10 U/mL cut-off, no symptom association).
10. **B6 restriction raises glycine**: robust for cystathionine (+52-66%), weak for glycine (+10% not significant to +29%); tHcy and cycle fluxes do not change.

## What the model assembler must handle

1. **No Vmax is given for any enzyme**: no absolute hepatic enzyme concentrations were found. Calibrate each Vmax so the steady-state flux equals the `fluxTarget` (mmol/day -> umol/h via 41.667, then per hepatic volume `hepatic-cytosolic-volume-L`, an *assumed* 1.0 L that must be reconciled with B1's compartment).
2. **Overlap with B1**: SAM, SAH, homocysteine, methionine, 5-MTHF, THF, methylene-THF, cystathionine and PLP are shared. B2 lists them as `externalSpecies` (ontology slugs) and gives only plasma observables (`sam-plasma`, `sah-plasma`, `homocysteine-plasma`, `cystathionine-plasma`). Liver SAM/SAH comes from mouse and rat only (`sam-liver-mouse` 76.4 / `sah-liver-mouse` 21.8 nmol/g, ratio 3.6; rat 60-90 / 10-15). **No human liver SAM/SAH or tissue glycine exists.**
3. **Hepatic glycine** is only known for mouse (1.66 mM). At that value and Km(glycine) 1.1 mM, GNMT is ~60% saturated for glycine, so a 2-4x rise in hepatic glycine raises GNMT flux by only ~25-45% (calc); a larger effect needs the 130 uM or the 2 mM end of the range. Show results across the whole `gnmt-km-gly` x `glycine-liver-free` grid, not at a point.
4. **Questions with NO human data** (do not present a prediction as measured): (a) oral glycine and plasma/tissue SAM, SAH, SAM:SAH, sarcosine, choline, PC or PEMT; (b) niacin or nicotinamide supplementation and human SAM/SAH; (c) glycine supplementation and the biliary glycine:taurine ratio; (d) whole-diet gut TMA yield; (e) human BHMT flux share; (f) human GNMT kinetics. The closest data are: Tan 2025 (glycine 100 mg/kg/day for 14 days, tHcy +0.6 uM, SAM not measured), Villar 2012 (glycine + arginine caused hyperhomocysteinaemia via guanidinoacetate), Alves 2022 (mouse liver sarcosine +86% after glycine), Fukada 2006 (rat: guanidinoacetate and nicotinic acid raise Hcy, glycine does not), Garg 1999 (niacin raises tHcy 17-55%). The `glycine-gnmt-depletes-sam-in-undermethylated` hypothesis therefore stays a hypothesis.
5. **Choline fate is not measured as a partition**: only the oxidation term (3.3 mmol/day) has a literature anchor (second-hand), and the TMA term is an assumed range. Isotope studies give enrichment ratios, not fractions of dose.
6. **Two-compartment betaine PK**: a single volume of 1.32 L/kg contradicts Cmax; central volume is ~0.46 L/kg. Repeated dosing lengthens the half-life from 14 to 41 h, so use saturable (DMG-inhibited) disposal, not a linear ke.
7. **PLP as a modifier**: use `f_PLP = (P/(K+P)) / (1/(K+1))` with relative cellular PLP P; apply to SHMT, GCS, CBS (and CTH); SHMT is nearly saturated at baseline, CBS far less so. Plasma PLP 52.6 -> 21.5 nM corresponds to ~-60% only if cellular PLP follows plasma, which was not measured.
8. **Ontology gaps** (laws with `ontologyId: null`): NNMT reaction, DNMT/DNA methylation, glycine N-acyltransferase (hippurate). Also absent: phospholipase D (PC to choline), creatine to creatinine, CCT/CPT kinetics, pancreatic bicarbonate secretion. The A3 repair task is expected to add them.
9. **Gastric CO2**: stoichiometry is exact (1 mmol HCl neutralised by bicarbonate = 1 mmol CO2 = 25.45 mL at 37 C, 24.47 at 25 C, 27.1 mL if the gas phase is water-saturated), but most acid is buffered by food, and >98% of any CO2 is absorbed or exhaled (a day's 208 mmol would give 5.3 L; flatus CO2 is ~0.07 L; total gut gas 0.1-0.2 L). Do not equate acid secreted with bicarbonate-neutralised. The brief's "24.5 mL/mmol at 25 C vs 25.4 at 37 C" is confirmed (24.465 and 25.450).
10. **Interpretation of effects**: PPI effect builds over ~5 days (acidity -18% day 1, -60% day 5) and recovers with a ~28-46 h half-life, so model it as a state. Healthy-volunteer and GERD-patient pH data differ.
11. **Existing-entity note**: Taylor 1982 (existing) does not mention glycine in its abstract; its relation against glycine is an inference by absence. No change made.

## Not found

Human GNMT/GAMT/COMT-catechol/PEMT Km values; human liver SAM, SAH, glycine, choline, betaine and PC pools; human CHDH and SARDH kinetics; primary SHMT1/2 and GCS (whole-system) human kinetics; PLP Kd for GCS and GAD isoforms; glycine plasma Cmax across 0.1-0.8 g/kg (only single studies, high variability); Fordtran & Walsh 1973 buffer numbers (full text blocked); swallowed air per day in mL and mL per belch; gastric surface bicarbonate in mM; ethanol/drug IC50 for DAO; Mudd 1975/1980/2007, Stead 2006 and Gannon 2002 full texts (paywalled: figures from them are labelled second-hand or unverified).

## Verification

`/tmp/b2check.mjs` (kept outside the repo, reproducible from this description) checks that: every parameter, species, law, budget item and validation target has a unique id; `low <= value <= high`; every `article:` source exists in the combined knowledge base; every `ontologyId` exists (reactions as `reaction:`, species as `compound:`, external species as `compound:<slug>`); every `paramId`, `fluxTarget` and model `paramId` resolves; every new article passes the entity schema, has unique id/PMID/DOI against all existing entities, has at least two graph neighbours, and is cited by the parameter file; `validateKnowledge` on the combined data reports no new errors (the base 6 warnings are unchanged); and the existing `tests/unit/knowledge-data.test.js` passed unchanged (302 tests) on a temporary copy that imported the extra articles. Latest run: 0 errors, 0 warnings.

Bibliographic fields (authors, year, journal, DOI, PMID, title) were pulled from Europe PMC/PubMed for every PMID. Numbers were read from full text (PMC) where open and from abstracts otherwise; the `locator` of each parameter says which, and values known only through a secondary or web summary say so in `locator`/`note`.
