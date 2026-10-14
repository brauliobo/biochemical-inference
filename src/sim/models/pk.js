// Oral PK sketches for betaine, choline and glycine (engine format; docs/SMALL_MODELS.md). ILLUSTRATIVE ONLY.
// Units: amounts umol/kg, volumes L/kg, concentrations uM, time h. `quality` = how good the data are, `validRange` = where the
// maths can be trusted. Sources: 'b2:<id>' = src/sim/data/parameters-b2.js, 'fit:' = fitted here to the cited numbers.

const LABEL = 'Illustrative educational model - not measurable physiology or medical advice'
const p = (id, value, low, high, unit, source, confidence) => ({ id, value, low, high, unit, source, confidence })
const fo = (id, from, to, k) => ({ id, substrates: from ? [{ species: from, n: 1 }] : [], products: to.map((species) => ({ species, n: 1 })), rate: { law: 'firstOrder', params: { k } } })
const sp = (id, name, initial, unit, extra) => ({ id, name, initial, unit, ...extra })
const dose = (id, label, max, def, unit, species, gain) => ({ id, label, min: 0, max, default: def, unit, effects: [{ target: 'species', id: species, op: 'set', gain }] })
const obs = (id, label, unit, expr) => ({ id, label, unit, expr })
const BETAINE = 1000 / 117.15 // umol per mg betaine
const CHOLINE = 1000 / 104.17 // umol per mg choline cation
const GLYCINE = 1e6 / 75.07 // umol per g glycine

// betaine: two compartments, Schwahn 2003 (n = 12 men, 50 mg/kg)
export const betainePkModel = {
  id: 'pk-betaine', name: 'Oral betaine, two-compartment', label: LABEL, time: { unit: 'h', duration: 48 },
  quality: 'measured, one study (n=12, one dose): Cmax 939 uM, Tmax 0.9 h, t1/2 14.4 h, CL/F 0.084, Vss 1.32 L/kg',
  validRange: 'single dose 10-100 mg/kg; repeated dosing: t1/2 ~41 h (use eliminationSlowdown)',
  species: [
    sp('Agut', 'Betaine in gut', 50 * BETAINE, 'umol/kg'), sp('A1', 'Betaine, central', 0, 'umol/kg', { ontologyId: 'compound:betaine' }), sp('A2', 'Betaine, peripheral', 0, 'umol/kg'),
    sp('Vc', 'Central volume', 0.302, 'L/kg', { fixed: true }), sp('base', 'Fasting plasma betaine', 32, 'uM', { fixed: true })
  ],
  parameters: [
    p('ka', 2.48, 1.54, 6.3, '1/h', 'b2:betaine-ka', 'medium'), p('k10', 0.286, 0.2, 0.4, '1/h', 'fit', 'low'),
    p('k12', 0.346, 0.2, 0.6, '1/h', 'fit', 'low'), p('k21', 0.111, 0.05, 0.2, '1/h', 'fit', 'low')
  ],
  reactions: [fo('absorb', 'Agut', ['A1'], 'ka'), fo('elim', 'A1', [], 'k10'), fo('distribute', 'A1', ['A2'], 'k12'), fo('redistribute', 'A2', ['A1'], 'k21')],
  controls: [
    dose('doseMgPerKg', 'Betaine (mg/kg anhydrous; 50 = 3.5 g at 70 kg)', 100, 50, 'mg/kg', 'Agut', BETAINE),
    { id: 'eliminationSlowdown', label: 'Elimination (1 single dose; ~0.35 repeated, t1/2 ~41 h)', min: 0.1, max: 1.5, default: 1, unit: 'x', effects: [{ target: 'param', id: 'k10', op: 'multiply' }] }
  ],
  events: [],
  observables: [obs('excess', 'Plasma betaine above fasting', 'uM', { ratio: ['A1', 'Vc'] }), obs('plasma', 'Plasma betaine', 'uM', { sum: ['excess', 'base'] })]
}

// choline: Bateman curve for the excess, betaine formed through two transit steps (Modinger 2019, n = 12, 620 mg choline)
export const cholinePkModel = {
  id: 'pk-choline', name: 'Oral choline and the betaine it feeds', label: LABEL, time: { unit: 'h', duration: 24 },
  quality: 'illustrative: four fitted numbers (choline +3.67 uM at 2.67 h, betaine +18.9 uM at 7.7 h); no CDP-choline kinetics',
  validRange: 'one dose near 600 mg choline',
  species: [
    sp('Agut', 'Choline in gut', (620 / 70) * CHOLINE, 'umol/kg'), sp('C', 'Plasma choline, excess', 0, 'umol/kg', { ontologyId: 'compound:choline' }),
    sp('T1', 'Transit 1', 0, 'umol/kg'), sp('T2', 'Transit 2', 0, 'umol/kg'), sp('B', 'Betaine, excess', 0, 'umol/kg', { ontologyId: 'compound:betaine' }),
    sp('Vch', 'Apparent choline volume', 12.1, 'L/kg', { fixed: true }), sp('Vb', 'Betaine volume', 0.46, 'L/kg', { fixed: true }),
    sp('chBase', 'Fasting plasma choline', 9.9, 'uM', { fixed: true }), sp('beBase', 'Fasting plasma betaine', 39.5, 'uM', { fixed: true })
  ],
  parameters: [
    p('ka', 0.55, 0.3, 1.2, '1/h', 'fit: choline Tmax', 'low'), p('k_oth', 0.1883, 0.08, 0.4, '1/h', 'fit: PC, tissues, TMA', 'low'),
    p('k_bet', 0.0547, 0.02, 0.12, '1/h', 'fit: oxidation to betaine (22.5% of the loss)', 'low'),
    p('ktr', 2.8, 0.5, 6, '1/h', 'fit: betaine Tmax (descriptive delay)', 'low'), p('keb', 0.125, 0.048, 0.2, '1/h', 'fit (b2:betaine-ke is slower at 50 mg/kg)', 'low')
  ],
  reactions: [fo('absorb', 'Agut', ['C'], 'ka'), fo('other_loss', 'C', [], 'k_oth'), fo('to_betaine', 'C', ['T1'], 'k_bet'), fo('transit1', 'T1', ['T2'], 'ktr'), fo('transit2', 'T2', ['B'], 'ktr'), fo('betaine_loss', 'B', [], 'keb')],
  controls: [dose('doseMgCholine', 'Elemental choline, 70 kg person (mg)', 3500, 620, 'mg', 'Agut', CHOLINE / 70)],
  events: [],
  observables: [
    obs('cholineExcess', 'Plasma choline above fasting', 'uM', { ratio: ['C', 'Vch'] }), obs('cholinePlasma', 'Plasma choline', 'uM', { sum: ['cholineExcess', 'chBase'] }),
    obs('betaineExcess', 'Plasma betaine above fasting', 'uM', { ratio: ['B', 'Vb'] }), obs('betainePlasma', 'Plasma betaine', 'uM', { sum: ['betaineExcess', 'beBase'] })
  ]
}

// glycine: Bateman curve for the excess, SECOND-HAND numbers (Gannon 2002: 217 -> 909 uM at 40 min, 414 uM at 120 min, ~0.77 mmol/kg)
export const glycinePkModel = {
  id: 'pk-glycine', name: 'Oral glycine, plasma excess', label: LABEL, time: { unit: 'h', duration: 8 },
  quality: 'weak: secondary summary of one study (n=9, B2: not seen); chronic data vary (SD ~ half the mean) and saturate',
  validRange: 'single doses up to ~0.15 g/kg; larger doses saturate (not modelled)',
  species: [
    sp('Agut', 'Glycine in gut', 0.057 * GLYCINE, 'umol/kg'), sp('A1', 'Extra glycine in the body', 0, 'umol/kg', { ontologyId: 'compound:glycine' }),
    sp('V', 'Apparent volume', 0.675, 'L/kg', { fixed: true }), sp('base', 'Fasting plasma glycine', 217, 'uM', { fixed: true })
  ],
  parameters: [p('ka', 4, 1.5, 10, '1/h', 'fit: peak by 40 min', 'low'), p('ke', 0.945, 0.5, 1.5, '1/h', 'fit: 692 -> 197 uM excess, 40 -> 120 min', 'low')],
  reactions: [fo('absorb', 'Agut', ['A1'], 'ka'), fo('elim', 'A1', [], 'ke')],
  controls: [dose('doseGPerKg', 'Glycine (g/kg; 0.057 = 4 g at 70 kg)', 0.15, 0.057, 'g/kg', 'Agut', GLYCINE)],
  events: [],
  observables: [obs('excess', 'Plasma glycine above fasting', 'uM', { ratio: ['A1', 'V'] }), obs('plasma', 'Plasma glycine', 'uM', { sum: ['excess', 'base'] })]
}

export const pkModels = { betaine: betainePkModel, choline: cholinePkModel, glycine: glycinePkModel }
