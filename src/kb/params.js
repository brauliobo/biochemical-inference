// Kinetic parameters for enzyme and reaction pages. The simulation work (src/sim/data/parameters-b1.js, -b2.js) holds
// literature-sourced Michaelis-Menten constants per reaction law; this module finds the ones that belong to an
// enzyme or a reaction and turns them into curves a page can draw. Pure except `loadParameters`, which loads the two
// (large) datasets lazily so only enzyme and reaction pages pay for them.
//
// A curve is v/Vmax against the concentration of one substrate with every other substrate held non-limiting
// (that is what one Km means). Km carries its literature range and provenance; Vmax is added when the dataset has one
// in the same concentration/time units.

let loaded = null

/** Both parameter datasets, loaded once: [{ id: 'b1' | 'b2', data }]. */
export function loadParameters() {
  loaded ??= Promise.all([import('../sim/data/parameters-b1.js'), import('../sim/data/parameters-b2.js')])
    .then(([b1, b2]) => [{ id: 'b1', data: b1.default }, { id: 'b2', data: b2.default }])
  return loaded
}

const MICRO = /^[µμu]M$/
const UNIT_TO_UM = { nM: 1e-3, mM: 1e3, M: 1e6 }

/** Value in µM for a concentration unit string ('uM', 'µM', 'mM', 'uM (nmol/g)'), or null when it is not a concentration. */
export function toMicromolar(value, unit) {
  if (!Number.isFinite(value)) return null
  const head = String(unit ?? '').trim().split(/\s+/)[0]
  if (MICRO.test(head)) return value
  return head in UNIT_TO_UM ? value * UNIT_TO_UM[head] : null
}

const KM_PATTERN = /(^|[._@-])(km|s0\.5|ks|k05)([._@-]|$)|km_|_km|\.km|-km-/i
const EXCLUDED = /ki|kd|kact|ka_|kcat|k_n|ic50|inh|@|-ic50-|-ki-/i

/** Is this parameter a Michaelis constant (a half-saturation concentration) of the base variant? */
export function isMichaelisConstant(param) {
  if (!KM_PATTERN.test(param.id) || /uptake/i.test(param.id) || EXCLUDED.test(param.id.replace(/km/gi, ''))) return false
  return toMicromolar(param.value, param.unit) !== null
}

const VMAX_PATTERN = /vmax|\.vf$|^[a-z0-9]+\.a0$/i

function isVmax(param) {
  return VMAX_PATTERN.test(param.id) && !/@/.test(param.id) && /µM\/h|uM\/h/.test(param.unit ?? '')
}

const SUBSTRATE_NAMES = Object.freeze({
  gly: 'glycine', sam: 'SAM', sah: 'SAH', met: 'methionine', hcy: 'homocysteine', bet: 'betaine', ser: 'serine', arg: 'arginine',
  gaa: 'guanidinoacetate', nam: 'nicotinamide', dmg: 'dimethylglycine', pe: 'phosphatidylethanolamine', '5mthf': '5-methyl-THF',
  ch2thf: 'methylene-THF', chthf: 'methenyl-THF', thf: 'THF', '10fthf': '10-formyl-THF', dump: 'dUMP', '3pg': '3-phosphoglycerate',
  'cholyl-coa': 'cholyl-CoA', nadph: 'NADPH'
})

/** 'Km_Met' -> 'methionine', 'gnmt-km-gly' -> 'glycine', 'Km_5mTHF' -> '5-methyl-THF'; unknown tokens stay as written. */
export function substrateOf(id) {
  const match = /(?:^|[._-])(?:km|ks|s0\.5|k05)[._-]?(.+)$/i.exec(id.replace(/@.*$/, ''))
  const token = match?.[1]?.replace(/^[._-]+/, '') ?? ''
  if (!token) return 'substrate'
  return SUBSTRATE_NAMES[token.toLowerCase()] ?? token
}

/** Look up every parameter by id across the datasets: Map id -> { ...param, dataset }. */
export function indexParameters(sets) {
  const map = new Map()
  for (const { id: dataset, data } of sets) for (const param of data.parameters ?? []) map.set(param.id, { ...param, dataset })
  return map
}

/** Reaction laws of the datasets that belong to the given enzymes or reactions. */
export function lawsFor(sets, { enzymeIds = [], reactionIds = [] }) {
  const enzymes = new Set(enzymeIds)
  const reactions = new Set(reactionIds)
  const found = []
  for (const { id: dataset, data } of sets) {
    for (const law of data.reactionLaws ?? []) {
      if ((law.enzymeId && enzymes.has(law.enzymeId)) || (law.ontologyId && reactions.has(law.ontologyId))) found.push({ ...law, dataset })
    }
  }
  return found
}

const cleanParam = (param) => ({
  id: param.id,
  value: param.value,
  low: param.low ?? param.value,
  high: param.high ?? param.value,
  unit: param.unit,
  tissue: param.tissue ?? null,
  species: param.species ?? null,
  source: param.source ?? null,
  extraSources: param.extraSources ?? [],
  locator: param.locator ?? null,
  confidence: param.confidence ?? null,
  note: param.note ?? null
})

/**
 * Curves for an enzyme or reaction page. `ctx` is { enzymeIds, reactionIds }. Result:
 *   [{ key, lawId, dataset, substrate, km (µM), kmLow, kmHigh, kmParam, vmax (µM/h | null), vmaxParam, law, rateExpression, caveats, refs }]
 * one per Michaelis constant of the matching laws (base variant only), or [] when the datasets have none.
 */
export function curvesFor(sets, ctx) {
  const index = indexParameters(sets)
  const curves = []
  for (const law of lawsFor(sets, ctx)) {
    const params = (law.paramIds ?? []).map((id) => index.get(id)).filter(Boolean)
    const vmax = params.find(isVmax)
    for (const param of params.filter(isMichaelisConstant)) {
      const km = toMicromolar(param.value, param.unit)
      const low = toMicromolar(param.low ?? param.value, param.unit)
      const high = toMicromolar(param.high ?? param.value, param.unit)
      if (!(km > 0)) continue
      curves.push({
        key: `${law.dataset}:${law.id}:${param.id}`,
        lawId: law.id,
        dataset: law.dataset,
        substrate: substrateOf(param.id),
        km,
        kmLow: low > 0 ? Math.min(low, km) : km,
        kmHigh: high > 0 ? Math.max(high, km) : km,
        kmParam: cleanParam(param),
        vmax: vmax ? vmax.value : null,
        vmaxParam: vmax ? cleanParam(vmax) : null,
        law: law.law,
        rateExpression: law.rateExpression ?? null,
        caveats: Array.isArray(law.caveats) ? law.caveats : law.caveats ? [law.caveats] : [],
        refs: law.refs ?? []
      })
    }
  }
  return curves
}

/** Fraction of Vmax at substrate concentration `s` for a Michaelis constant `km` (both in the same unit). */
export const saturation = (s, km) => (s > 0 && km > 0 ? s / (km + s) : 0)

/** Points of the curve on [0, max]: { x: number[], y: number[] } in percent of Vmax. */
export function curvePoints(km, max, count = 41) {
  const x = Array.from({ length: count }, (_, index) => (max * index) / (count - 1))
  return { x, y: x.map((s) => 100 * saturation(s, km)) }
}
