// Pure calculators for the glycine / choline / methyl questions (no imports, browser-safe; docs/SMALL_MODELS.md).
// Each returns { value, low, high, unit, sources, status } (see `result`), plus structured fields for RangeBar / StackedBar.
// status: 'computed' (stoichiometry, molar masses), 'estimate' (literature ranges, partly contested), 'hypothesis'.
// sources: 'quant:<id>' = src/knowledge/data/quant.js, 'b2:<id>' = src/sim/data/parameters-b2.js, 'article:<id>', 'calc:'.
// Constants are embedded; tests/unit/sim-calculators.test.js compares them with the knowledge and B2 data.

const r3 = (value, low, high) => ({ value, low, high })
export const CONSTANTS = Object.freeze({
  glycineMolarMass: 75.07, cholineMolarMass: 104.17, betaineHclMolarMass: 153.61, // g/mol
  betaineHclMmolPerG: 6.51, // H+ per g of betaine HCl
  cholineUlMgPerDay: 3500, // IOM 1998; EFSA 2016 set none
  cholineAiMgPerDay: { menIom: 550, womenIom: 425, efsa: 400 },
  basalAcidMmolPerH: r3(5.1, 3, 6.5), acid24hMmol: r3(208.3, 189.8, 226.8),
  dietaryCholineMmolPerDay: r3(3.2, 2.8, 4.5), niacinMethylMmolPerG: r3(4.38, 4.38, 6.3), transmethylationMmolPerDay: r3(20, 15, 23.5)
})

/** Build the common result shape; low / high default to value. */
export const result = (value, low, high, unit, sources, status, extra = {}) => ({ value, low: low ?? value, high: high ?? value, unit, sources, status, ...extra })
const need = (cond, message) => { if (!cond) throw new RangeError(message) }
const MH = 'article:melendez-hevia-2009-glycine-weak-link'

// --- glycine <-> choline ---

/** Fraction of ingested choline ending as glycine (choline -> betaine -> DMG -> sarcosine -> glycine): alternatives. */
export const CONVERSION_PARTITIONS = Object.freeze([
  { id: 'stoichiometric', label: 'Every choline becomes glycine (ceiling)', conversion: 1, status: 'computed', sources: ['quant:glycine-conversion-to-choline-g-per-g'] },
  { id: 'oxidation-flux', label: 'Oxidised to betaine: 3.3 of 4.45 mmol/day (upper bound)', conversion: 0.74, status: 'estimate', sources: ['b2:flux-choline-oxidation-to-betaine'] },
  { id: 'melendez-hevia', label: 'Sarcosine from diet: 1.43 of 3.2 mmol/day', conversion: 0.447, status: 'estimate', sources: [MH] },
  { id: 'practitioner', label: '40-50% often quoted (no source)', conversion: 0.45, status: 'hypothesis', sources: ['assumption:practitioner'] }
])

/** Choline (g, cation) to convert for `glycineG` of glycine at `conversion`; low = conversionHigh, high = conversionLow. */
export function cholineForGlycine({ glycineG = 10, conversion = 1, conversionLow = 0.25, conversionHigh = 1 } = {}) {
  need(glycineG >= 0 && conversion > 0 && conversion <= 1 && conversionLow > 0 && conversionHigh <= 1, 'bad input')
  const g = (c) => ((glycineG / CONSTANTS.glycineMolarMass) * CONSTANTS.cholineMolarMass) / c
  const value = g(conversion)
  const saltGrams = {}
  for (const [id, f] of Object.entries(SALT_FRACTIONS)) if (f.element === 'choline') saltGrams[id] = value / f.value
  return result(value, g(conversionHigh), g(conversionLow), 'g choline/day', ['quant:glycine-molar-mass', 'quant:choline-molar-mass', 'quant:glycine-conversion-to-choline-g-per-g'], conversion === 1 ? 'computed' : 'estimate',
    { conversion, saltGrams, ulMultiple: (value * 1000) / CONSTANTS.cholineUlMgPerDay, alternatives: CONVERSION_PARTITIONS.map((a) => ({ ...a, cholineG: g(a.conversion) })) })
}

/** Glycine (g) obtained from `cholineG` at `conversion`. */
export function glycineFromCholine({ cholineG = 1, conversion = 1, conversionLow = 0.25, conversionHigh = 1 } = {}) {
  need(cholineG >= 0 && conversion > 0 && conversion <= 1, 'bad input')
  const g = (c) => (cholineG / CONSTANTS.cholineMolarMass) * CONSTANTS.glycineMolarMass * c
  return result(g(conversion), g(conversionLow), g(conversionHigh), 'g glycine/day', ['quant:glycine-molar-mass', 'quant:choline-molar-mass'], conversion === 1 ? 'computed' : 'estimate', { conversion })
}

/** The glycine "deficit": uses 15.23 minus supply 5.15 g/day (B2 glycine-sinks); low = collagen need 4 instead of 12 g/day. */
export const GLYCINE_DEFICIT = Object.freeze({ value: 10.08, low: 2.08, high: 10.08, unit: 'g/day', sources: ['b2:fluxBudgets.glycine-sinks', MH], status: 'estimate' })

/**
 * Fraction of the glycine-deficit estimate that choline could cover within the UL (headroom = UL - diet), capped at 1,
 * with data for a RangeBar (intake vs AI / UL) and a StackedBar (the deficit split). low/high span conversion 0.25-1,
 * dietary choline 2.8-4.5 mmol/day and deficit 2.1-10.1 g/day. IOM UL 3.5 g/day; EFSA 2016 set none.
 */
export function cholineCoverageOfDeficit({ conversion = 0.447, ulMg = CONSTANTS.cholineUlMgPerDay, dietMg = null, deficitG = null } = {}) {
  const mm = CONSTANTS.cholineMolarMass
  const d = CONSTANTS.dietaryCholineMmolPerDay
  const diet = dietMg ?? d.value * mm
  const deficit = deficitG ?? GLYCINE_DEFICIT.value
  const gly = (dietMgUsed, c) => glycineFromCholine({ cholineG: Math.max(0, ulMg - dietMgUsed) / 1000, conversion: c }).value
  const cap = (x) => Math.min(1, x)
  const glyMax = gly(diet, conversion)
  return result(cap(glyMax / deficit), cap(gly(d.high * mm, 0.25) / GLYCINE_DEFICIT.high), cap(gly(d.low * mm, 1) / GLYCINE_DEFICIT.low), 'fraction of the deficit',
    ['quant:choline-ul-iom-adults', 'quant:choline-ul-efsa', 'b2:choline-intake-mmol-day', 'b2:fluxBudgets.glycine-sinks'], 'estimate', {
      glycineAtUlG: glyMax, headroomMg: Math.max(0, ulMg - diet), dietMg: diet, deficitG: deficit,
      rangeBar: {
        unit: 'mg choline/day', min: 0, max: 4500,
        bands: [{ label: 'AI (EFSA 400, IOM 425-550)', from: CONSTANTS.cholineAiMgPerDay.efsa, to: CONSTANTS.cholineAiMgPerDay.menIom }, { label: 'Above the IOM UL', from: ulMg, to: 4500 }],
        markers: [{ label: 'Typical diet', value: diet, low: d.low * mm, high: d.high * mm }, { label: 'IOM UL', value: ulMg }, { label: '10 g glycine at 100%', value: cholineForGlycine().value * 1000 }]
      },
      stackedBar: {
        unit: 'g glycine/day', total: deficit,
        items: [{ label: 'Choline within the UL', value: Math.min(glyMax, deficit), low: Math.min(gly(d.high * mm, 0.25), deficit), high: Math.min(gly(d.low * mm, 1), deficit), status: 'estimate' },
          { label: 'Left uncovered', value: Math.max(0, deficit - glyMax), low: Math.max(0, deficit - gly(d.low * mm, 1)), high: deficit, status: 'estimate' }]
      }
    })
}

// --- salts and products ---

const fr = (element, value, low, high, sources, status = 'computed') => ({ element, value, low, high, sources, status })
export const SALT_FRACTIONS = Object.freeze({
  'choline-bitartrate': fr('choline', 0.411, 0.411, 0.411, ['quant:choline-bitartrate-content-fraction-choline']),
  'alpha-gpc': fr('choline', 0.405, 0.405, 0.405, ['quant:alpha-gpc-supplement-content-fraction-choline']),
  citicoline: fr('choline', 0.213, 0.213, 0.213, ['quant:citicoline-supplement-content-fraction-choline']),
  'phosphatidylcholine-pure': fr('choline', 0.135, 0.13, 0.14, ['quant:phosphatidylcholine-supplement-content-fraction-choline']),
  'betaine-hcl': fr('betaine', 0.763, 0.763, 0.763, ['quant:betaine-hcl-content-fraction-betaine']),
  'magnesium-glycinate': fr('magnesium', 0.141, 0.141, 0.141, ['quant:magnesium-glycinate-content-fraction-magnesium'])
})

/** Elemental content (mg) of `mg` of a salt or product (choline bitartrate 1000 mg -> 411 mg choline); `reverse`: salt (mg) that supplies `mg` of the element. */
export function elementalFromSalt({ salt, mg, reverse = false }) {
  const f = SALT_FRACTIONS[salt]
  need(f && mg >= 0, `unknown salt "${salt}"`)
  const x = (v) => (reverse ? mg / v : mg * v)
  return result(x(f.value), x(reverse ? f.high : f.low), x(reverse ? f.low : f.high), reverse ? 'mg salt' : `mg ${f.element}`, f.sources, f.status, { element: f.element, fraction: f.value })
}

/** Glycine from magnesium glycinate given its elemental Mg: 14.1% Mg and 87.1% glycine by mass (400 mg Mg ~ 2.5 g glycine). */
export function magnesiumGlycinateGlycine({ magnesiumMg = 400 } = {}) {
  need(magnesiumMg >= 0, 'magnesiumMg must be >= 0')
  const salt = magnesiumMg / 0.141
  return result(salt * 0.871, null, null, 'mg glycine', ['quant:magnesium-glycinate-content-fraction-glycine', 'quant:magnesium-glycinate-content-fraction-magnesium'], 'computed', { saltMg: salt })
}

/** Collagen peptides: ~33% of the RESIDUES are glycine but 20-25% of the MASS, so 10 g of powder holds 2.0-2.5 g glycine, not 3.3 g. */
export function collagenGlycine({ powderG = 10 } = {}) {
  need(powderG >= 0, 'powderG must be >= 0')
  return result(powderG * 0.225, powderG * 0.2, powderG * 0.25, 'g glycine', ['quant:collagen-peptides-content-fraction-glycine'], 'estimate', { residueFraction: 1 / 3 })
}

/** UC-II (undenatured type II collagen) 40 mg/day: ~9 mg glycine, 0.4% of the ~2250 mg/day in dietary protein. */
export function ucIIGlycine({ mg = 40 } = {}) {
  const g = collagenGlycine({ powderG: mg / 1000 })
  return result(g.value * 1000, g.low * 1000, g.high * 1000, 'mg glycine', ['quant:type-ii-collagen-trial-dose-uc-ii', ...g.sources], 'estimate')
}

// --- betaine HCl against stomach acid output ---

/** H+ from betaine HCl capsules (g of salt) and its size against basal output (5.1 mmol/h, 3-6.5) and the 24 h output (208 mmol). */
export function betaineHclAcidLoad({ grams = 0.65 } = {}) {
  need(grams >= 0, 'grams must be >= 0')
  const mmol = (grams * 1000) / CONSTANTS.betaineHclMolarMass
  const { basalAcidMmolPerH: b, acid24hMmol: a } = CONSTANTS
  return result(mmol, null, null, 'mmol H+', ['quant:betaine-hcl-molar-mass', 'quant:betaine-hcl-conversion-mmol-h-per-g', 'b2:gastric-bao'], 'computed', {
    basalHoursEquivalent: result(mmol / b.value, mmol / b.high, mmol / b.low, 'h of basal output', ['b2:gastric-bao'], 'estimate'),
    shareOf24h: result(mmol / a.value, mmol / a.high, mmol / a.low, 'fraction of 24 h output', ['b2:gastric-acid-24h'], 'estimate')
  })
}

// --- glycine sources and sinks ---

/**
 * Glycine budget (g/day, 70 kg adult) from the B2 `fluxBudgets` array (pass `parameters-b2.js` default export's fluxBudgets):
 * stacked-bar items with ranges (items whose range spans 3x or more are flagged `wide`), totals, the balance
 * (positive = deficit) and B2's contested statements. The supply range uses the pathway sum (2.9 g/day synthesis) at the
 * low end and the highest tracer synthesis estimate (44.3 g/day) at the high end.
 */
export function glycineBudget(fluxBudgets) {
  const get = (id) => {
    const b = (fluxBudgets ?? []).find((x) => x.id === id)
    need(b, `fluxBudgets needs "${id}" (pass the B2 fluxBudgets array)`)
    return b
  }
  const sinks = get('glycine-sinks')
  const sources = get('glycine-sources')
  const synth = get('glycine-synthesis-estimates')
  const mark = (list) => list.map((i) => ({ ...i, wide: i.high >= 3 * i.low && i.high - i.low > 0.5 }))
  const sum = (list, key) => list.reduce((a, i) => a + i[key], 0)
  const diet = sources.items.find((i) => /Dietary/.test(i.label))
  const pathway = sources.items.filter((i) => i !== diet)
  const uses = result(sum(sinks.items, 'value'), sum(sinks.items, 'low'), sum(sinks.items, 'high'), 'g/day', ['b2:fluxBudgets.glycine-sinks', MH], 'estimate')
  const supply = result(sum(sources.items, 'value'), sum(sources.items, 'low'), sum(sources.items, 'high'), 'g/day', ['b2:fluxBudgets.glycine-sources'], 'estimate')
  const tracerHigh = Math.max(...synth.items.map((i) => i.high)) + diet.high
  return {
    sinks: { items: mark(sinks.items), total: uses }, sources: { items: mark(sources.items), total: supply },
    synthesisEstimates: { items: synth.items, additive: false },
    balance: result(uses.value - supply.value, uses.low - tracerHigh, uses.high - supply.low, 'g/day (positive = deficit)', ['calc:uses - supply'], 'estimate', {
      pathwaySynthesis: sum(pathway, 'value'), contested: [...sinks.contested, ...synth.contested]
    })
  }
}

// --- SAM methyl accounting ---

/** Methyl groups NNMT takes from `niacinG` g/day (4.38 mmol/g lower bound, 6.3 upper) against ~20 mmol/day total SAM use. Effect on SAM: hypothesis. */
export function niacinMethylDemand({ niacinG = 2, totalMmolPerDay = null } = {}) {
  need(niacinG >= 0, 'niacinG must be >= 0')
  const per = CONSTANTS.niacinMethylMmolPerG
  const t = CONSTANTS.transmethylationMmolPerDay
  const v = niacinG * per.value
  return result(v, niacinG * per.low, niacinG * per.high, 'mmol methyl/day', ['b2:nnmt-methyl-per-g-niacin', 'article:menon-2007-niacin-er-pharmacokinetics'], 'estimate', {
    shareOfTransmethylation: result(v / (totalMmolPerDay ?? t.value), (niacinG * per.low) / t.high, (niacinG * per.high) / t.low, 'fraction of total SAM use', ['b2:flux-transmethylation-total'], 'estimate'),
    note: 'Lower bound from urinary MNA + 2PY after 2 g ER niacin; human SAM / SAH after niacin not found: the effect on SAM is a hypothesis.'
  })
}

