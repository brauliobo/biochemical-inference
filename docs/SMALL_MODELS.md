# Small models and calculators (`src/sim/models/gastric.js`, `pk.js`, `histamine.js`, `src/sim/calculators.js`)

Four self-contained pieces next to the big methylation model (agent B3a). They answer the questions of the glycine / belching conversation (`tmp/base-talk.txt`): *can bicarbonate-derived CO2 explain upper-gut gas after glycine or collagen powder, what do a PPI, betaine HCl, a bicarbonate rinse or an alginate do to stomach pH and CO2, how much choline would replace glycine, how big is a SAM-histamine link*. Everything is an **illustrative educational model**, never a measurement of a person or medical advice. Parameters come from [SIM_PARAMETERS_B2.md](SIM_PARAMETERS_B2.md) (`src/sim/data/parameters-b2.js`); a parameter's `source` says `b2:<id>`, `fit:` (tuned here to a cited number) or `assumed`, and `confidence` is `high` (measured), `medium` (estimated), `low` (fitted here) or `assumed`. Engine format and API: [SIMULATION_ENGINE.md](SIMULATION_ENGINE.md).

| File | Content | gzip (minified, all four together 11.9 kB) |
| --- | --- | --- |
| `models/gastric.js` | stomach / duodenum acid-base and CO2 ODE model, scenarios, `analyzeGastric`, `gastricPh`, mass-balance groups | 5.3 kB |
| `models/pk.js` | betaine, choline and glycine oral PK sketches | 2.0 kB |
| `models/histamine.js` | histamine turnover (DAO gut, HNMT with SAM / SAH), optional diurnal rhythm | 2.4 kB |
| `calculators.js` | pure functions returning `{ value, low, high, unit, sources, status }` | 3.3 kB |

Tests: `tests/unit/sim-gastric-model.test.js`, `sim-gastric-small-models.test.js` (PK and histamine), `sim-calculators.test.js` (45 tests, about 12 s in total, mostly the gastric day runs).

```js
import { compileModel, simulate, conservedSums } from '../sim/index.js'
import { gastricModel, gastricScenarios, gastricSimOptions, gastricConservedGroups, analyzeGastric } from '../sim/models/gastric.js'

const c = compileModel(gastricModel)
const run = simulate(c, { controls: { ppiInhibitionPct: 60, betaineHclG: 1 }, duration: 8, ...gastricSimOptions })
const a = analyzeGastric(run)              // a.ph[], a.acidOutputMmolPerH[], a.co2.{stomachMl, gasPocketMl[], absorbedStomachMl, ...}
```

`gastricSimOptions = { rtol: 1e-4, atol: 1e-9 }`: the model is stiff (fast buffer equilibria); with these tolerances an 8 h run takes about 0.3 s, with the engine defaults (`rtol` 1e-6) about 2 s and the same result to three digits.

## 1. Gastric acid, bicarbonate and CO2 (`gastric.js`)

### Structure

Amounts in mmol, volumes in mL, time in hours, concentrations in mol/L. 39 species (3 fixed inputs and 16 tally species that count what left a pool or came from outside, so every H+, HCO3-, CO2 and air molecule is accounted for), 45 reactions, 27 parameters, 12 controls.

```
Plate --eat--> stomach {V, Food, meal buffer Bm/HBm, free H, HCO3, CO2d <-> CO2g (+Air), BHCl and Antacid pools}
parietal H+ = (BAO + (PAO-BAO) Stim) x active pumps x luminal-acid feedback x (1 + what-if boost)
H + Bm <-> HBm                          meal buffer (one pKa 4.5, 0.0375 mmol base/mL meal, about 20 mmol/L/pH)
H + HCO3 <-> CO2d                        pK 6.1, fast equilibrium
CO2d: absorbed (net of the back-flux from blood at 40 mmHg), emptied with the fluid, or exchanged with the gas pocket
gas pocket (CO2g + Air): belching (distension-dependent) + distal passage
emptying Michaelis-Menten in V -> duodenum {Hd, HCO3d, CO2dd}: Hd + HCO3d -> CO2dd, acid-stimulated HCO3- secretion
```

Equations (the engine rate laws, written out):

* Secretion `S = (bao + dpao * Stim) * Pump * AA / (1 + (Hc/ki_fb)^n_fb)` mmol/h; each mmol H+ comes with 6.33 mL of 158 mM juice. `Hc = H/V` is a fast-tracking concentration signal. `Stim' = k_stim_off * Food/(km_food_stim + Food) - k_stim_off * Stim`.
* PPI: `Pump` (active) and `PumpInh` (inhibited) fractions; the control `ppiInhibitionPct` sets the inhibited fraction at t = 0; `Pump' = +k_pump_rec * PumpInh` with `k_pump_rec = ln2/28 h` multiplied by the control `ppiRecovers` (0: dosing continues and the inhibition stays; 1: dosing stopped, the pump pool recovers with t1/2 28 h; B2 gives 28-46 h).
* Buffer and bicarbonate: association `kf/V * H * Bm` (the 1/V comes from the modifier `allostericInhibition(I=V, Ki=1e-3 mL)`), dissociation `kr * HBm`, with `kf/kr = 1/Ka`; the same for `H + HCO3 <-> CO2d`. Free H+ is therefore a real state and `pH = -log10(H/V)` (`gastricPh`, capped to [0, 8]).
* CO2: absorption `Kabs * (CO2d - kH * 40 mmHg * V/1000)` (net, so a gastric fluid in equilibrium with blood holds 1.33 mM), gas exchange `Kx * (CO2d - 0.76 * kH * V * CO2g/(CO2g+Air))`, i.e. Henry's law with `PCO2(gas) = 760 mmHg * CO2g/(CO2g + Air)` and `kH = 0.0332 mmol/L/mmHg`; `Kabs` and `Kx` are *fixed species* so that the back-flux and Henry's law remain consistent when they are changed (control `co2AbsorptionRate`, or an event that sets `Kx`).
* Gas: `CO2g` and `Air` leave by belching (`k_belch` times a Hill factor in the gas content, fold 4 above about 50 mL) and by distal passage (`k_pass` = 0.8/h against 0.2/h for belching: B2's 80% distal fraction); swallowed air enters at 0.8 mmol/h (about 20 mL/h net, **assumed**: B2 says "do not multiply swallows by mL").
* Emptying: every solute leaves at `k_empty * Km/(Km + V)` per hour, the fluid at `k_empty * Km * V/(Km + V)` mL/h (saturating, about zero order for a 400 mL meal: T50 about 1.3 h). Protonated buffer reaching the duodenum releases its H+ there.
* Duodenum (100 mL, lumped): `Hd + HCO3d -> CO2dd` (fast), bicarbonate 0.74 mmol/h basal + `33 * Hd/(1 + Hd)` stimulated (B2 pancreatic maximum 33 mmol/h), CO2 absorbed at 60/h or carried on at 4/h.

### Controls

`mealMl` (0-800, default 400, eaten at t = 1 h), `ppiInhibitionPct`, `ppiRecovers`, `basalAcidX`, `glycineAcidBoostPct` (**hypothesis, default 0**), `betaineHclG` (6.51 mmol H+/g, released at t = 1 h), `bicarbonateMg` (released at t = 0.5 h), `alginateMl` (0.4 mmol CO2-yielding base/mL, assumed from a UK Gaviscon Advance leaflet: 1 mmol KHCO3 + 1 mmol CaCO3 per 5 mL), `co2AbsorptionRate`, `dgReflux` (duodeno-gastric reflux, 0 = healthy), `emptyingX`, `airSwallowX`. Doses are released by events that switch the first-order rates `eat_k`, `bhcl_k`, `antacid_k`; pass your own `events` to `simulate` to change the times (a 24 h day with three meals is in the test file).

The *glycine acid what-if* multiplies the whole acid output by `1 + X/100` (fixed species `AA`). Human data: intragastric glycine 100 mM gave 5.6 vs 3.3 mmol/h acid and **no gastrin change** (Wald 1982), glycine is not a gastrin stimulant (Taylor 1982), intravenous glycine hardly stimulates acid (McArthur 1983). The default is therefore 0 and every output that uses a non-zero value must be shown as a hypothesis.

### What was fitted and what was predicted

| quantity | B2 anchor | model | role |
| --- | --- | --- | --- |
| fasting pH, volume | 1.7 (1-2.5), 35 mL | 1.61, 34 mL | `ki_fb`, `fluid_in` tuned |
| 24 h acid with three meals | 208 (190-227) mmol | 195 mmol | fitted (`ki_fb`) |
| median pH on omeprazole 20 mg (60% of pumps) | 4.6 (Delchier 1997) | 4.6 | fitted (`alk_other`) |
| basal gastric PCO2 | 63 (44-82) mmHg | 63.7 | fitted (`Kabs` = 100/h) |
| meal drive | meal acid 15.8 (14.1-17.5) mmol/h | peak 16.1 | fitted (`km_food_stim`) |
| PPI 60%: 24 h acid | -60% (Cederberg 1993, day 5) | -53% | **prediction** |
| PPI 60%: time at pH < 4 | 89% -> 35% | 94% -> 41% | **prediction** |
| meal pH peak | median 6.7 (5-7.4) | 5.3 | prediction, low end of the range |
| pH back to fasting after the meal | < 2 h | 3.5 at 1 h, 1.9 at 1.5 h, fasting value at 2 h after the meal starts | prediction |
| PCO2 after 500 mg NaHCO3 | 144 (100-188) mmHg | 103-106 on an empty stomach, 261 at 1 mmol/h alkali | prediction (the fluid volume of the study is unknown) |

Mass balance (tests): H+ supplied = free + buffered + duodenal + passed on + made into CO2 + capsule left (drift below 1e-4 mmol over 10 h with every dose on), the same for HCO3- plus CO2, the meal buffer and the swallowed air; 1 mmol H+ neutralised by bicarbonate gives exactly 1 mmol CO2 = 25.45 mL at 37 C.

### What the model says about CO2 and belching

The question of the conversation: *is CO2 from H+ + HCO3- the cause of belching after glycine?* In the model the answer is **no, not by itself, and glycine adds nothing to it unless an unproven acid effect is assumed.**

1. **Almost all stomach CO2 is absorbed.** Over 8 h on an empty stomach the model forms about 590 mL CO2 in the stomach (assumed alkali 2.5 mmol/h plus 0.38 mmol/h mucosal HCO3-); 93% crosses the gastric wall, about 4% leaves with the fluid and is absorbed in the duodenum, **2.4% leaves as gas (0.6% belched = about 4 mL, 1.8% passed distally)**. Counting the duodenum, 95-96% of all CO2 formed is absorbed inside the model and the rest is carried on to the jejunum, where B2 expects rapid absorption (flatus CO2 is about 70 mL/day).
2. **Gas pocket.** The CO2 part of the gastric gas pocket is 1.7 mL (peak) against about 19 mL of swallowed air, i.e. 8-9% of the gas pocket, and about 6-8% of the belched gas is CO2 (3-4 mL of about 45 mL in 8 h).
3. **500 mg NaHCO3 (5.95 mmol, up to 151 mL CO2) on an empty stomach** adds only 87 mL of CO2 in the stomach (58%: the rest empties as unreacted bicarbonate once the pH rises above 6), the CO2 gas pocket peaks at 4 mL, and the extra CO2 belched is **0.2 mL** over 8 h. A *rinse* with a pinch of bicarbonate (50 mg swallowed) is 10 times smaller.
4. **Alginate-carbonate 20 mL** (8 mmol base) adds about 130 mL CO2 in the stomach and a 4 mL gas peak (the model does not contain the raft, which traps gas and reduces reflux; this is a limitation, not a result).
5. **More acid does not mean more stomach CO2.** Stomach CO2 formation is limited by the *bicarbonate* supply, not by acid: the "+70% acid" what-if leaves the stomach CO2 unchanged (590 mL) and increases the duodenal CO2 from 867 to 1327 mL, absorbed there. Betaine HCl 650 mg (4.2 mmol, 0.8 h of basal output) changes the duodenal CO2 (+55 mL) but not the stomach CO2. A PPI changes where the CO2 forms, not the fraction vented.
6. **Scale against real gas.** A carbonated drink gives about 600 mL gastric gas (B2: 800 mL cola); gross swallowed air if every one of the 21.5 air swallows/h carried 20 mL would be 430 mL/h (an upper bound, not a net rate); the model's CO2 gas pocket is 2-10 mL.

**How robust is it?** The vented fraction depends on the CO2 absorption rate, which is tied by the basal PCO2 (63 mmHg) to the assumed alkali input. Refitting `Kabs` for each alkali input (0.5, 1, 2.5, 5 mmol/h gives `Kabs` = 35, 55, 103, 160/h) gives a fasting vented fraction of 7.6, 4.9, 2.4 and 1.4%, belched CO2 3.6-3.8 mL/8 h in every case, and after 500 mg NaHCO3 an extra belched CO2 of 1.1, 0.6, 0.2 and 0 mL and a gas-pocket peak of 10, 8, 4 and 2 mL. If absorption were 10 times slower (`Kabs` 10/h, outside the anchor) the same dose would give 18 mL CO2 gas and a third of the belched gas would be CO2: the hypothesis is not impossible, but it needs a gastric wall that absorbs CO2 far more slowly than the basal PCO2 allows. More swallowed air (`airSwallowX` 3) reduces the CO2 share of belches and raises the absolute belched CO2 (4 -> 15 mL), because a larger pocket vents more of everything.

**What the model cannot say.** It has no microbiota: gas from bacterial fermentation of free glycine in a hypochlorhydric stomach or duodenum (SIBO) is a separate hypothesis that this model neither supports nor excludes; it has no oesophagus (transient LES relaxations, supragastric belching, laryngopharyngeal reflux) and no pepsin; belch volume per belch and the net swallowed air per day were not found in the literature. In the sense of the question, the model's honest summary is: *bicarbonate-derived CO2 is a small and fast-vanishing part of the gas pocket; if glycine powder makes someone belch, swallowed air (powder drunk fast, dissolving, aerophagia), gas from bacterial fermentation or a change in belching reflexes are better candidates than effervescence.* These are suggestions for what to test, not findings.

### PPI, betaine HCl and the other controls

* **PPI** (24 h, three meals): acid 195 / 151 / 92 / 45 / 22 mmol at 0 / 30 / 60 / 80 / 90% of pumps blocked, median pH 1.6 / 1.9 / 4.6 / 6.7 / 7.2 (pH capped at 8, the model is outside the data above 7.5; the 80-90% rows are extrapolation: omeprazole 20 mg gives 60%). The acid output falls monotonically (tested). The strong nonlinearity of the median pH (1.9 -> 4.6 between 30 and 60%) comes from the alkali input: once acid secretion drops below it, pH collapses. That input (`alk_other`) is **fitted to two numbers**, so it is the weakest part of the PPI result.
* **Betaine HCl**: 650 mg = 4.2 mmol H+ (6.51 mmol/g, 153.61 g/mol) = 0.8 h of basal output (0.65-1.4 h), 2% of a day's output; it delivers its acid with the meal and is not limited by feedback, so under a 60% PPI 3.25 g (21 mmol) keeps the pH below 4 for 6.3 h of 8 against 4.0 h without it. The burning the user reports with betaine HCl after ulcers is a mucosal sensitivity question that a lumen model cannot address.
* **Slower emptying** (`emptyingX` 0.4) keeps the stomach full for longer (peak volume 407 -> 656 mL, 628 mL instead of 210 mL at 5 h) and, because the meal drive follows the meal volume, raises the acid secreted in 14 h by 39% (88 -> 121 mmol); the buffered phase is not prolonged (acid still wins within about an hour). **Duodeno-gastric reflux** (`dgReflux` 1-3) raises the gastric PCO2 from 63.7 to 65-68 mmHg and the CO2 attributed to the stomach by 6-15% (refluxed CO2 is counted as formed there; a hypothesis: zero in health).

Scenarios with their evidence status are in `gastricScenarios` (`measured-anchor`: reproduces a cited number; `model-prediction`; `hypothesis`): meal, fasting, PPI 60%, betaine HCl 650 mg, betaine HCl 3.25 g under a PPI, NaHCO3 500 mg, bicarbonate rinse 50 mg, alginate 20 mL, the +70% acid what-if (hypothesis) and duodeno-gastric reflux (hypothesis). Stopping a PPI is the control `ppiRecovers` (run 100 h or more).

### Limitations

One well-mixed stomach and duodenum, a single food buffer (pKa 4.5), no mucus layer or mucosal surface pH, no pepsin, no gastrin / somatostatin hormones (luminal-acid feedback is lumped), saliva and dietary alkali as one constant, the peak meal pH is lower than the median of Dressman 1990 (5.3 against 6.7, inside the 5-7.4 range), swallowed air is a constant, gastric gas exchange `Kx` is assumed (the result barely depends on it: 5-120/h changes the vented fraction from 2.1 to 2.5%), ideal-gas volumes (25.45 mL/mmol, dry; 27.1 mL/mmol water saturated), healthy-volunteer data only.

## 2. Oral PK sketches (`pk.js`)

Each model carries `quality` (the strength of the underlying data) and `validRange`.

| model | data | equations | result vs data |
| --- | --- | --- | --- |
| `betainePkModel` | **measured**, Schwahn 2003 (n = 12 men, 50 mg/kg) | first-order absorption `ka` 2.48/h, central `Vc` 0.302 L/kg, `k10` 0.286, `k12` 0.346, `k21` 0.111/h (fitted to Cmax, Tmax, t1/2, CL/F and Vss together: the published values are not mutually consistent in a two-compartment model) | Cmax 921 uM (939; range 663-1300), Tmax 0.8 h (0.9), terminal t1/2 15.2 h (14.4), baseline 32 uM added |
| `cholinePkModel` | **illustrative**: four numbers of Modinger 2019 (620 mg choline as bitartrate) | Bateman curve for plasma choline (`ka` 0.55/h, loss 0.243/h) with 22.5% of the loss oxidised to betaine through two transit steps (2.8/h) and elimination 0.125/h; apparent choline volume 12 L/kg | choline +3.68 uM at 2.65 h (3.67 at 2.67), betaine +19.3 uM at 8.7 h (18.9 at 7.7). **No CDP-choline or alpha-GPC kinetics exist in the parameter set**; treat a citicoline or alpha-GPC dose as an elemental-choline bolus *hypothesis* (see `elementalFromSalt`) |
| `glycinePkModel` | **weak, second-hand**: 217 -> 909 uM at 40 min, 414 uM at 120 min after about 0.77 mmol/kg (Gannon 2002; B2 did not see the paper), n = 9 | Bateman curve for the excess: `ka` 4/h, `ke` 0.945/h (t1/2 0.73 h), apparent volume 0.675 L/kg | peak 937 uM at 28 min, 899 uM at 40 min, 439 uM at 2 h; linear, valid up to about 0.15 g/kg: chronic 0.8 g/kg/day gives about 640 +/- 340 uM, not the linear 8 mM; response SD about half the mean; 2 of 14 men vomited at 0.8 g/kg/day |

Controls: `doseMgPerKg` and `eliminationSlowdown` (0.35 imitates repeated dosing, t1/2 about 41 h; B2: DMG inhibits BHMT, so real disposal is saturable), `doseMgCholine`, `doseGPerKg`. Observables `plasma`, `excess`, `cholinePlasma`, `betainePlasma`. Limitations: single dose, healthy men only (betaine); no women, no chronic dosing beyond the slowdown control; no glycine to SAM link (B2: **no human data**).

## 3. Histamine turnover (`histamine.js`)

Qualitative model in uM-equivalents: gut pool (mast cells, food) -> DAO (Km 19 uM, capacity 20/h, SAM-independent) or absorption (2/h, diluted 20-fold into the systemic pool); systemic pool cleared by HNMT (competitive vs SAM, SAH-inhibited: `v = Vmax * His/(Km_His + His) * SAM/(Km_SAM (1 + SAH/Ki_SAH) + SAM)` with Km_His 3.7, Km_SAM 13.1, Ki_SAH 6.9 uM, all human) and an "other" first-order route; a CNS pool cleared by HNMT only (B2: the CNS has no usable DAO) plus a small efflux. Calibration: plasma baseline 0.00875 uM, plasma half-life 4 min (clearance 10.4/h) with an **assumed** HNMT share of 60% (CNS 80%) and 20% of the input arriving through the gut pool. SAM (default 60 uM tissue, rat liver 60-90, human tissue not measured) and SAH (12 uM) are fixed inputs, set by the controls `samUM` and `sahUM`: the methylation model drives them with `simulate(histamineModel, { controls: { samUM: sam, sahUM: sah } })`.

Results (steady state, relative to baseline): SAM 60 -> 30 uM (SAM:SAH 5 -> 2.5) raises systemic histamine **1.20x** and CNS histamine **1.28x**; SAM 10 uM gives 1.64x and 2.11x; SAH 24 uM at SAM 30 gives 1.38x / 1.59x; HNMT at half activity gives 1.43x / 1.68x. The effect follows SAM:SAH, not SAM alone, and is modest in the periphery, where DAO and other routes buffer it, and larger in the CNS. Blocking DAO raises the gut pool 10.9-fold and systemic histamine 3-fold (the 3 is a consequence of the assumed 20% gut share), and a histamine-rich meal (100 uM-equivalents in the gut pool) lifts systemic histamine 54-fold at normal DAO and 81-fold with DAO blocked (pool dilution assumed).

**Diurnal rhythm**: off by default (`diurnalAmplitude` 0, labelled "weakly supported"). B2: plasma histamine was about 2x higher at 04:00 than at 16:00 (Szefler 1991) and a 5 a.m. peak with two daytime maxima exists (Rehn 1987), but urinary histamine and 1-methylhistamine show no rhythm (Schulze 1992, children) and urinary metabolites follow meals; "2-4 am" is not supported as such. With amplitude 0.42 the release is modulated by a cosine with its peak at 04:00 (`circadianEvents({ peakHour })`; the mean release is unchanged) and plasma histamine is exactly 2.0x higher at 04:00 than at 16:00; it is a documented *possible* pattern, not a finding.

Limitations: pools are lumped concentration-equivalents with an assumed 20:1 volume ratio; plasma DAO activity is below detection in healthy people and serum DAO ELISA values are not activities (B2); no mast-cell degranulation dynamics, no H1/H2 receptors, no gut flora histamine; the link from glycine to SAM to histamine has **no human data** (B2).

## 4. Calculators (`calculators.js`)

All functions are pure and return `{ value, low, high, unit, sources: [...], status: 'computed' | 'estimate' | 'hypothesis' }` plus structured extras. Constants are embedded and checked against `src/knowledge/data/quant.js` and B2 by tests.

| function | what it does | key result |
| --- | --- | --- |
| `cholineForGlycine({ glycineG, conversion })` | choline (g, cation) needed for glycine at a conversion fraction; `low` at 100%, `high` at 25%; salt masses; `alternatives` = the partitions (100% ceiling `computed`, oxidation flux 74% and Melendez-Hevia 44.7% `estimate`, the quoted 40-50% and 25% `hypothesis`) | 10 g glycine = **13.88 g** choline at 100% (3.96 x the IOM UL of 3.5 g), 30.8 g at 45%, 33.8 g choline bitartrate at 100% |
| `glycineFromCholine({ cholineG, conversion })` | the inverse | the UL of 3.5 g gives at most **2.52 g** glycine |
| `cholineCoverageOfDeficit({ conversion, ulMg, dietMg, deficitG })` | fraction of the glycine-deficit estimate (10.08 g/day, low 2.08 with collagen need 4 instead of 12 g/day) that choline within the UL (3500 mg minus 333 mg diet) could cover; `rangeBar` (AI band, UL, diet, 10 g marker) and `stackedBar` (covered / uncovered) data | **10%** at 44.7% conversion (5-100%, capped at 1), 23% at the stoichiometric ceiling. IOM UL 3.5 g/day; EFSA set none (`quant:choline-ul-efsa` is null) |
| `elementalFromSalt({ salt, mg, reverse })` | bitartrate 41.1%, alpha-GPC 40.5%, citicoline 21.3%, pure PC 13-14%, betaine HCl 76.3% betaine, magnesium glycinate 14.1% Mg; `reverse` gives the salt needed | 1000 mg bitartrate = 411 mg choline |
| `magnesiumGlycinateGlycine({ magnesiumMg })` | glycine from magnesium glycinate (87.1% by mass) | 400 mg Mg = 2837 mg salt = **2.47 g glycine** |
| `collagenGlycine({ powderG })`, `ucIIGlycine({ mg })` | collagen peptides: 33% of the *residues* but 20-25% of the *mass*; UC-II 40 mg | 10 g peptides = 2.0-2.5 g glycine (not 3.3 g); UC-II 40 mg = 9 mg, 0.4% of dietary glycine |
| `betaineHclAcidLoad({ grams })` | H+ from betaine HCl vs basal output (5.1 mmol/h, 3-6.5) and the 24 h output (208 mmol) | 650 mg = **4.23 mmol H+ = 0.83 h** (0.65-1.41 h) of basal output, 2% of a day |
| `glycineBudget(fluxBudgets)` | sinks and sources (g/day) from the B2 `fluxBudgets` array that you pass in; items whose range is 3-fold or more are flagged `wide`; the five synthesis estimates; balance and B2's contested statements | uses 15.23, supply 5.16, deficit **10.07 g/day**, range from -40.6 (a surplus: tracer synthesis up to 44.3 g/day) to +24.0; "no direct test of the deficit exists" |
| `niacinMethylDemand({ niacinG })` | methyl groups taken by NNMT (4.38 mmol/g lower bound, 6.3 upper) against 20 mmol/day (15-23.5) | 2 g/day = **8.76 mmol methyl** (8.76-12.6) = 44% (37-84%) of total SAM use; the effect on SAM / SAH is a **hypothesis**: no human data |

Where a number is a stoichiometric identity (`computed`) it is exact; where it combines literature ranges (`estimate`) the `low` / `high` give the extremes of the inputs, not a confidence interval.

## Verification and size

* `npx vitest run tests/unit/sim-gastric-model.test.js tests/unit/sim-gastric-small-models.test.js tests/unit/sim-calculators.test.js`: 45 tests. Hand-computed calculator values (13.876 g, 2.522 g, 0.1012, 411 mg, 2470.9 mg, 4.2315 mmol, 8.76 mmol), B2 parameter identity, model validation (`validateModel`: no errors, no warnings), fasting steady state and anchors, pH return to baseline after a meal, PPI monotonicity of acid output and median pH, pump recovery against `1 - 0.9 * 2^(-t/28)`, mass balance with every dose on, 25.45 mL/mmol stoichiometry, Henry equilibrium of the gas pocket, sweep monotonicity in the bicarbonate dose, PK targets, histamine closed forms.
* Bundle: 11.9 kB gzip for the four files together (Vite build, minified, no engine). The engine itself adds 7.9-10.5 kB, see SIMULATION_ENGINE.md.
