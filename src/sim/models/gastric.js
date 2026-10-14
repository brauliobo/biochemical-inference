// Stomach / duodenum acid-base and CO2 model (engine format; docs/SMALL_MODELS.md). ILLUSTRATIVE ONLY.
// Units: amounts mmol, volumes mL, time h, concentrations mol/L (= mmol/mL). Parameter `source`: 'b2:<id>' =
// src/sim/data/parameters-b2.js, 'fit:' tuned here to the cited anchor, 'assumed'. Confidence: high measured, medium
// estimated, low fitted here, assumed.
//
//  Plate -eat-> stomach {V, Food, meal buffer Bm/HBm, H, HCO3, CO2d <-> CO2g (+Air), BHCl / Antacid pools}
//  parietal H+ = (BAO + meal drive) x active pumps x luminal-acid feedback ; H + Bm <-> HBm ; H + HCO3 <-> CO2d
//  CO2d: absorbed (net of the blood PCO2 back-flux), emptied, or exchanged with the gas pocket (Henry's law)
//  gas pocket (CO2g + Air): belching (distension-dependent) + distal passage
//  emptying (saturating in V) -> duodenum {Hd, HCO3d, CO2dd}: H+ + HCO3- -> CO2, acid-stimulated HCO3- secretion
// Fast constants (buffer equilibria, signals, Henry exchange) are literal numbers; the CO2 absorption and exchange rates are
// fixed species (Kabs, Kx) so that the blood back-flux and Henry's law stay consistent when they are changed (control co2AbsorptionRate).
// Rate laws are amount-based, so a bimolecular step divides by the volume through the modifier
// allostericInhibition(I=V, Ki=EV) = EV/(EV+V) ~ EV/V, with the rate constant multiplied by 1/EV.

const EV = 1e-3
const EG = 1e-4
const KSIG = 60 // 1/h, relaxation of the concentration "signal" species
const KH = 0.0332 // mmol/L/mmHg
const VM = 25.45 // mL/mmol CO2 at 37 C
const HCL_ML = 1 / 0.158 // mL of 158 mM parietal juice per mmol H+
const KA_BUF = 10 ** -4.5
const KA_BIC = 10 ** -6.1
const KR = 30 // 1/h, dissociation constant of the fast buffer equilibria
const BUF = 0.0375 // mmol meal buffer base per mL meal (~20 mmol/L/pH)
const BUF_HB = 0.00024 // protonated part: the meal arrives at pH ~6.7

const p = (id, value, low, high, unit, source, confidence) => ({ id, value, low, high, unit, source, confidence })
const S = (id) => (Array.isArray(id) ? { species: id[0], n: id[1] } : { species: id, n: 1 })
const mod = (law, species, params) => ({ law, species, params })
const invV = mod('allostericInhibition', { I: 'V' }, { Ki: EV })
const emptying = mod('allostericInhibition', { I: 'V' }, { Ki: 'km_empty' })
const feedback = mod('allostericInhibition', { I: 'Hc' }, { Ki: 'ki_fb', n: 'n_fb' })
const belchUp = mod('ligandModifier', { L: 'GasT' }, { K: 'gas_thresh', fold: 'belch_fold', n: 2 })
const rx = (id, name, subs, prods, law, params, extra = {}) => ({ id, name, substrates: subs.map(S), products: prods.map(S), rate: { law, params, ...extra } })
const fo = (id, name, from, to, k, extra) => rx(id, name, from ? [from] : [], to, 'firstOrder', { k }, extra)
const sig = (id, from, k, extra) => fo(id, '', null, [id.split('_')[0]], k, { species: { S: from }, ...extra })
const empty = (x, to, name) => fo(`empty_${x}`, `Emptying of ${name ?? x}`, x, to, 'k_empty', { modifiers: [emptying] })
const ctl = (id, label, min, max, def, unit, ...effects) => ({ id, label, min, max, default: def, unit, effects: effects.map(([target, eid, op, gain]) => ({ target, id: eid, op, ...(gain === undefined ? {} : { gain }) })) })

// fasting steady state of the default parameters (mealMl = 0)
const F = { V: 34.32, H: 0.8346, Hc: 0.02431, CO2d: 0.07261, CO2g: 0.0652, Air: 0.7384, GasT: 0.8036, Hd: 0.03282, HCO3d: 0.1693, CO2dd: 0.01905 }
const sp = (id, name, initial = 0, unit = 'mmol', extra = {}) => ({ id, name, initial, unit, ...extra })

const species = [
  sp('Plate', 'Meal not yet eaten', 400, 'mL'), sp('Food', 'Meal fluid in the stomach', 0, 'mL'),
  sp('V', 'Gastric fluid', F.V, 'mL', { compartment: 'stomach' }),
  sp('H', 'Free H+ (stomach)', F.H),
  sp('Bm', 'Meal buffer base'), sp('HBm', 'Meal buffer, protonated'),
  sp('Hc', '[H+] signal = H/V', F.Hc, 'mol/L'), sp('Stim', 'Meal secretory drive', 0, 'fraction'),
  sp('Pump', 'Active parietal pumps', 1, 'fraction'), sp('PumpInh', 'PPI-inhibited pumps', 0, 'fraction'),
  sp('BHCl', 'Betaine HCl not yet dissolved (H+)'), sp('Antacid', 'Bicarbonate / alginate base not yet dissolved'),
  sp('AA', 'Acid multiplier 1 + what-if boost (input)', 1, 'x', { fixed: true }),
  sp('Kabs', 'Gastric CO2 absorption rate (fit: basal PCO2 63 mmHg)', 100, '1/h', { fixed: true }), sp('Kx', 'Gas-liquid CO2 exchange rate (assumed)', 30, '1/h', { fixed: true }),
  sp('HCO3', 'Bicarbonate (stomach)'),
  sp('CO2d', 'Dissolved CO2 (stomach)', F.CO2d),
  sp('CO2g', 'Gas-pocket CO2', F.CO2g), sp('Air', 'Swallowed air in the pocket', F.Air), sp('GasT', 'Pocket total signal', F.GasT),
  sp('Hd', 'Free H+ (duodenum)', F.Hd, 'mmol', { compartment: 'duodenum' }), sp('HCO3d', 'Bicarbonate (duodenum)', F.HCO3d, 'mmol', { compartment: 'duodenum' }),
  sp('CO2dd', 'Dissolved CO2 (duodenum)', F.CO2dd, 'mmol', { compartment: 'duodenum' })
]
// cumulative tallies of what left a pool or came from outside (mmol; Vout in mL)
for (const id of 'H_secreted Buf_out H_dist HCO3_supplied HCO3_dist CO2_abs_s CO2_blood CO2_belch CO2_pass CO2_empt CO2_abs_d CO2_dist Air_in Air_belch Air_pass Betaine_rel'.split(' ')) species.push(sp(id, `${id} (tally)`, 0))

// a(): assumed parameter with a x/÷3 range (the ensemble samples it log-uniformly)
const a = (id, value, unit, source = 'assumed', lo = value / 3, hi = value * 3) => p(id, value, lo, hi, unit, source, 'assumed')
const parameters = [
  p('bao', 5.1, 3, 6.5, 'mmol/h', 'b2:gastric-bao', 'high'),
  p('dpao', 16.9, 8.7, 37, 'mmol/h', 'b2:gastric-pao - bao', 'high'),
  p('km_food_stim', 150, 50, 400, 'mL', 'fit: meal drive 0.73', 'low'),
  a('k_stim_off', 4, '1/h'),
  p('ki_fb', 0.05, 0.01, 0.15, 'mol/L', 'fit: 24 h acid 208 mmol, pH 1.7', 'low'),
  a('n_fb', 2, '', 'assumed', 1, 3),
  p('k_pump_rec', Math.LN2 / 28, Math.LN2 / 46, Math.LN2 / 28, '1/h', 'b2:ppi-pump-recovery-halflife-h', 'high'),
  a('fluid_in', 25, 'mL/h'),
  p('hco3_mucosal', 0.382, 0.32, 0.444, 'mmol/h', 'b2:gastric-hco3-basal-umol-h', 'high'),
  p('alk_other', 2.5, 0.5, 5, 'mmol/h', 'fit: 24 h acid, PPI pH 4.6', 'low'),
  a('k_empty', 2, '1/h'), a('km_empty', 100, 'mL'),
  a('eat_k', 0, '1/h', 'switch set by events', 0, 30), a('bhcl_k', 0, '1/h', 'switch set by events', 0, 30),
  a('antacid_k', 0, '1/h', 'switch set by events', 0, 30),
  a('air_in', 0.8, 'mmol/h', 'assumed (~20 mL/h net)'), a('k_belch', 0.2, '1/h'),
  p('k_pass', 0.8, 0.2, 2, '1/h', 'b2:gastric-gas-fraction-passed-distally', 'medium'),
  a('belch_fold', 4, 'x', 'assumed', 1, 10), a('gas_thresh', 2, 'mmol', 'assumed (~50 mL)'),
  a('k_reflux', 1, '1/h', 'assumed; dgReflux control', 0, 3),
  p('hco3d_basal', 0.74, 0.57, 0.79, 'mmol/h', 'b2:duodenal-hco3-basal-umol-cm-h', 'medium'),
  p('hco3d_max', 33, 29, 37, 'mmol/h', 'b2:pancreatic-hco3-max-mmol-h', 'high'),
  a('k_hd', 1, 'mmol'), a('k_neut', 200, '1/mmol/h'), a('k_abs_d', 60, '1/h'), a('k_transit', 4, '1/h')
]

const reactions = [
  fo('eat', 'Eating', 'Plate', ['Food', 'V', ['Bm', BUF], ['HBm', BUF_HB]], 'eat_k'),
  fo('bhcl_release', 'Betaine HCl dissolves', 'BHCl', ['H', 'Betaine_rel'], 'bhcl_k'),
  fo('antacid_release', 'Bicarbonate / alginate dissolves', 'Antacid', ['HCO3'], 'antacid_k'),
  rx('sec_basal', 'Basal H+ secretion', ['Pump', 'AA'], ['Pump', 'AA', 'H', 'H_secreted', ['V', HCL_ML]], 'massAction', { k: 'bao' }, { modifiers: [feedback] }),
  rx('sec_stim', 'Meal-stimulated H+ secretion', ['Pump', 'Stim', 'AA'], ['Pump', 'Stim', 'AA', 'H', 'H_secreted', ['V', HCL_ML]], 'massAction', { k: 'dpao' }, { modifiers: [feedback] }),
  rx('stim_on', 'Meal drive builds', [], ['Stim'], 'michaelisMenten', { Vmax: 'k_stim_off', Km: 'km_food_stim' }, { species: { S: 'Food' } }),
  fo('stim_off', 'Meal drive decays', 'Stim', [], 'k_stim_off'),
  fo('pump_recovery', 'PPI-inhibited pumps replaced', 'PumpInh', ['Pump'], 'k_pump_rec'),
  rx('in_fluid', 'Saliva and other fluid', [], ['V'], 'constantInput', { rate: 'fluid_in' }),
  rx('buf_assoc', 'H+ + base -> HB', ['H', 'Bm'], ['HBm'], 'massAction', { k: KR / KA_BUF / EV }, { modifiers: [invV] }),
  fo('buf_dissoc', 'HB -> H+ + base', 'HBm', ['H', 'Bm'], KR),
  sig('Hc_up', 'H', KSIG / EV, { modifiers: [invV] }), fo('Hc_down', '', 'Hc', [], KSIG),
  fo('GasT_up_co2', '', null, ['GasT'], KSIG, { species: { S: 'CO2g' } }), fo('GasT_up_air', '', null, ['GasT'], KSIG, { species: { S: 'Air' } }), fo('GasT_down', '', 'GasT', [], KSIG),
  rx('in_hco3_mucosal', 'Mucosal bicarbonate', [], ['HCO3', 'HCO3_supplied'], 'constantInput', { rate: 'hco3_mucosal' }),
  rx('in_alk_other', 'Other alkali (saliva, diet, reflux)', [], ['HCO3', 'HCO3_supplied'], 'constantInput', { rate: 'alk_other' }),
  rx('co2_form', 'H+ + HCO3- -> CO2', ['H', 'HCO3'], ['CO2d'], 'massAction', { k: KR / KA_BIC / EV }, { modifiers: [invV] }),
  fo('co2_dehydr', 'CO2 -> H+ + HCO3-', 'CO2d', ['H', 'HCO3'], KR),
  rx('co2_absorb', 'Gastric CO2 absorption', ['CO2d', 'Kabs'], ['CO2_abs_s', 'Kabs'], 'massAction', { k: 1 }),
  rx('co2_blood', 'CO2 back-flux from blood (40 mmHg)', ['V', 'Kabs'], ['V', 'Kabs', 'CO2d', 'CO2_blood'], 'massAction', { k: (KH * 40) / 1000 }),
  rx('co2_degas', 'Dissolved CO2 -> gas pocket', ['CO2d', 'Kx'], ['CO2g', 'Kx'], 'massAction', { k: 1 }),
  rx('co2_redissolve', 'Gas pocket CO2 -> dissolved (Henry, P = 760 CO2g/Gas)', ['CO2g', 'V', 'Kx'], ['CO2d', 'V', 'Kx'], 'massAction', { k: (0.76 * KH) / EG }, { modifiers: [mod('allostericInhibition', { I: 'GasT' }, { Ki: EG })] }),
  rx('air_swallow', 'Swallowed air', [], ['Air', 'Air_in'], 'constantInput', { rate: 'air_in' }),
  fo('belch_co2', 'Belching of CO2', 'CO2g', ['CO2_belch'], 'k_belch', { modifiers: [belchUp] }), fo('belch_air', 'Belching of air', 'Air', ['Air_belch'], 'k_belch', { modifiers: [belchUp] }),
  fo('pass_co2', 'Distal passage of CO2', 'CO2g', ['CO2_pass'], 'k_pass'), fo('pass_air', 'Distal passage of air', 'Air', ['Air_pass'], 'k_pass'),
  fo('empty_V', 'Emptying of fluid', 'V', [], 'k_empty', { modifiers: [emptying] }),
  empty('Food', []), empty('H', ['Hd']), empty('Bm', ['Buf_out']), empty('HCO3', ['HCO3d']),
  fo('empty_HBm', 'Emptying of HB (releases H+ in the duodenum)', 'HBm', ['Hd', 'Buf_out'], 'k_empty', { modifiers: [emptying] }),
  fo('empty_CO2d', 'Emptying of dissolved CO2', 'CO2d', ['CO2dd', 'CO2_empt'], 'k_empty', { modifiers: [emptying] }),
  rx('in_hco3d_basal', 'Basal duodenal bicarbonate', [], ['HCO3d', 'HCO3_supplied'], 'constantInput', { rate: 'hco3d_basal' }),
  rx('hco3d_stim', 'Acid-stimulated bicarbonate', [], ['HCO3d', 'HCO3_supplied'], 'hill', { Vmax: 'hco3d_max', K: 'k_hd', n: 1 }, { species: { S: 'Hd' } }),
  rx('duo_neut', 'Duodenal H+ + HCO3- -> CO2', ['Hd', 'HCO3d'], ['CO2dd'], 'massAction', { k: 'k_neut' }),
  fo('duo_co2_abs', 'Duodenal CO2 absorption', 'CO2dd', ['CO2_abs_d'], 'k_abs_d'), fo('duo_co2_out', 'Duodenal CO2 carried on', 'CO2dd', ['CO2_dist'], 'k_transit'),
  fo('duo_h_out', 'Duodenal H+ carried on', 'Hd', ['H_dist'], 'k_transit'), fo('duo_hco3_out', 'Duodenal HCO3- carried on', 'HCO3d', ['HCO3_dist'], 'k_transit'),
  fo('reflux_hco3', 'Duodeno-gastric reflux of HCO3-', 'HCO3d', ['HCO3'], 'k_reflux'), fo('reflux_co2', 'Duodeno-gastric reflux of CO2', 'CO2dd', ['CO2d'], 'k_reflux')
]

export const gastricModel = {
  id: 'gastric-acid-co2',
  name: 'Stomach / duodenum acid, bicarbonate and CO2',
  label: 'Illustrative educational model - not measurable physiology or medical advice',
  time: { unit: 'h', duration: 8 },
  species,
  parameters,
  reactions,
  controls: [
    ctl('mealMl', 'Meal (mL; 0 = fasting)', 0, 800, 400, 'mL', ['species', 'Plate', 'set']),
    ctl('ppiInhibitionPct', 'PPI: inhibited pumps', 0, 100, 0, '%', ['species', 'Pump', 'add', -0.01], ['species', 'PumpInh', 'add', 0.01]),
    ctl('ppiRecovers', 'PPI stopped (1: pumps recover)', 0, 1, 0, '0/1', ['param', 'k_pump_rec', 'multiply']),
    ctl('basalAcidX', 'Basal acid (x 5.1 mmol/h)', 0, 3, 1, 'x', ['param', 'bao', 'multiply']),
    ctl('glycineAcidBoostPct', 'HYPOTHESIS what-if: glycine-driven extra acid output (%; human data: none)', 0, 200, 0, '%', ['species', 'AA', 'add', 0.01]),
    ctl('betaineHclG', 'Betaine HCl (g; 6.51 mmol H+/g)', 0, 10, 0, 'g', ['species', 'BHCl', 'add', 6.51]),
    ctl('bicarbonateMg', 'Sodium bicarbonate (mg)', 0, 2000, 0, 'mg', ['species', 'Antacid', 'add', 1 / 84.006]),
    ctl('alginateMl', 'Alginate-carbonate (mL; 0.4 mmol base/mL)', 0, 40, 0, 'mL', ['species', 'Antacid', 'add', 0.4]),
    ctl('co2AbsorptionRate', 'Gastric CO2 absorption rate (1/h; fitted 100)', 5, 400, 100, '1/h', ['species', 'Kabs', 'set']),
    ctl('dgReflux', 'Duodeno-gastric reflux (0 healthy)', 0, 3, 0, 'x', ['param', 'k_reflux', 'multiply']),
    ctl('emptyingX', 'Gastric emptying (x)', 0.25, 3, 1, 'x', ['param', 'k_empty', 'multiply']),
    ctl('airSwallowX', 'Swallowed air (x 20 mL/h)', 0, 5, 1, 'x', ['param', 'air_in', 'multiply'])
  ],
  events: [
    { time: 0.5, set: { antacid_k: 6 }, label: 'Bicarbonate / alginate swallowed' },
    { time: 1, set: { eat_k: 12, bhcl_k: 6 }, label: 'Meal and betaine HCl taken' }
  ],
  observables: [
    { id: 'acidSecretion', label: 'Parietal acid output', unit: 'mmol/h', expr: { sum: ['sec_basal', 'sec_stim'] } },
    { id: 'co2Pools', label: 'CO2 in all pools and sinks', unit: 'mmol', expr: { sum: ['CO2d', 'CO2g', 'CO2dd', 'CO2_abs_s', 'CO2_belch', 'CO2_pass', 'CO2_abs_d', 'CO2_dist'] } },
    { id: 'co2Formed', label: 'CO2 made from H+ + HCO3-', unit: 'mmol', expr: { diff: ['co2Pools', 'CO2_blood'] } },
    { id: 'gasTotal', label: 'Gas pocket content', unit: 'mmol', expr: { sum: ['CO2g', 'Air'] } }
  ]
}

/** Run options that keep an 8 h run near 0.3 s (the default rtol 1e-6 is ~8x slower with the same result to 3 digits). */
export const gastricSimOptions = { rtol: 1e-4, atol: 1e-9 }

const CO2 = { H_secreted: -1, CO2d: 1, CO2g: 1, CO2dd: 1, CO2_abs_s: 1, CO2_belch: 1, CO2_pass: 1, CO2_abs_d: 1, CO2_dist: 1, CO2_blood: -1 }
export const gastricConservedGroups = [
  { id: 'protons', name: 'H+ supplied = free + buffered + made into CO2 + passed on', weights: { ...CO2, Plate: BUF_HB, H: 1, HBm: 1, Hd: 1, H_dist: 1, BHCl: 1 } },
  { id: 'carbon', name: 'HCO3- + CO2', weights: { ...CO2, H_secreted: 0, HCO3: 1, HCO3d: 1, HCO3_dist: 1, Antacid: 1, HCO3_supplied: -1 } },
  { id: 'buffer', name: 'Meal buffer', weights: { Plate: BUF + BUF_HB, Bm: 1, HBm: 1, Buf_out: 1 } },
  { id: 'air', name: 'Swallowed air', weights: { Air: 1, Air_belch: 1, Air_pass: 1, Air_in: -1 } }
]

const sc = (id, label, controls, status, evidence, duration) => ({ id, label, controls, status, evidence, ...(duration ? { duration } : {}) })
/** Evidence-labelled scenarios for simulate(): status measured-anchor | model-prediction | hypothesis. */
export const gastricScenarios = [
  sc('meal', 'Standard meal', {}, 'measured-anchor', 'pH peak 5-7, back < 2 h (Dressman)'),
  sc('fasting', 'Fasting', { mealMl: 0 }, 'measured-anchor', 'pH 1.7, BAO 5.1 mmol/h, PCO2 63 mmHg'),
  sc('ppi-60', 'PPI, 60% pumps inhibited', { ppiInhibitionPct: 60 }, 'measured-anchor', 'acidity -60%, median pH 4.6'),
  sc('bhcl-650', 'Betaine HCl 650 mg with the meal', { betaineHclG: 0.65 }, 'model-prediction', '4.2 mmol H+'),
  sc('bhcl-3250-ppi', 'Betaine HCl 3.25 g under a 60% PPI', { betaineHclG: 3.25, ppiInhibitionPct: 60 }, 'model-prediction', 'capsule acid escapes feedback'),
  sc('nahco3-500', 'Sodium bicarbonate 500 mg, fasting', { bicarbonateMg: 500, mealMl: 0 }, 'measured-anchor', 'PCO2 63 -> 144 mmHg (Kolkman)'),
  sc('rinse-swallowed', 'Bicarbonate rinse, 50 mg swallowed', { bicarbonateMg: 50, mealMl: 0 }, 'model-prediction', 'dose assumed'),
  sc('alginate-20', 'Alginate-carbonate antacid 20 mL', { alginateMl: 20 }, 'model-prediction', 'raft not modelled'),
  sc('glycine-acid-70', 'What-if: +70% acid output', { glycineAcidBoostPct: 70 }, 'hypothesis', 'Wald 1982: 5.6 vs 3.3 mmol/h, no gastrin change'),
  sc('dg-reflux', 'Duodeno-gastric reflux', { dgReflux: 1 }, 'hypothesis', '0 in health (B2)')
]

/** pH series (-log10 of H/V) from a simulate() result, capped to [0, 8]: above pH 7.5 the model is outside any data. */
export const gastricPh = (run) => run.series.H.map((h, i) => (h > 0 && run.series.V[i] > 0 ? Math.min(8, Math.max(0, -Math.log10(h / run.series.V[i]))) : 8))

/**
 * pH series and CO2 / gas budget from a simulate() result (mL of ideal gas at 37 C). `stomach` = CO2 formed in the stomach
 * lumen (absorbed + belched + passed + held + emptied while dissolved, minus the blood back-flux; assumes no reflux),
 * `duodenum` = CO2 formed from emptied acid.
 */
export function analyzeGastric(run, { vm = VM } = {}) {
  const s = run.series
  const L = run.time.length - 1
  const f = (...ids) => ids.reduce((a, id) => a + s[id][L], 0)
  const ph = gastricPh(run)
  const stomach = f('CO2_abs_s', 'CO2_belch', 'CO2_pass', 'CO2d', 'CO2g', 'CO2_empt') - f('CO2_blood')
  const duodenum = f('CO2dd', 'CO2_abs_d', 'CO2_dist') - f('CO2_empt')
  const net = f('CO2_abs_s') - f('CO2_blood')
  const share = (x, y) => (y > 1e-9 ? x / y : null)
  const ml = (a) => a.map((x) => x * vm)
  return {
    time: run.time, ph, phMin: Math.min(...ph), phMax: Math.max(...ph),
    hoursBelow4: run.time.reduce((a, t, i) => (i > 0 && ph[i] < 4 ? a + (t - run.time[i - 1]) : a), 0),
    acidOutputMmolPerH: s.acidSecretion, acidSecretedMmol: f('H_secreted'), capsuleAcidMmol: f('Betaine_rel'),
    pco2DissolvedMmHg: s.CO2d.map((c, i) => (s.V[i] > 0 ? (c * 1000) / (KH * s.V[i]) : NaN)),
    co2: {
      formedMl: (stomach + duodenum) * vm, stomachMl: stomach * vm, duodenumMl: duodenum * vm,
      gasPocketMl: ml(s.CO2g), gasPocketPeakMl: Math.max(...s.CO2g) * vm, airPocketMl: ml(s.Air),
      absorbedStomachMl: net * vm, belchedMl: f('CO2_belch') * vm, passedMl: f('CO2_pass') * vm, emptiedDissolvedMl: f('CO2_empt') * vm, absorbedDuodenumMl: f('CO2_abs_d') * vm,
      stomachFractionAbsorbed: share(net, stomach), stomachFractionBelched: share(f('CO2_belch'), stomach), stomachFractionGasVented: share(f('CO2_belch', 'CO2_pass'), stomach),
      fractionAbsorbedInModel: share(net + f('CO2_abs_d'), stomach + duodenum), shareOfBelchedGas: share(f('CO2_belch'), f('CO2_belch', 'Air_belch')), swallowedAirMl: f('Air_in') * vm
    }
  }
}

export default gastricModel
