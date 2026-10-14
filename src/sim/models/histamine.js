// Small histamine turnover model (engine format; docs/SMALL_MODELS.md). QUALITATIVE: directions and rough sizes only.
// Units: uM (pools lumped as concentration-equivalents), time h.
//   gut pool  -DAO (gut mucosa, SAM-independent)-> destroyed ; -absorption-> systemic pool
//   systemic  -HNMT (intracellular, SAM-dependent, SAH-inhibited)-> methylhistamine ; -other clearance-> (DAO in tissue, uptake, renal)
//   CNS pool  -HNMT only (no usable DAO)- ; small efflux
// SAM and SAH are fixed inputs (controls samUM, sahUM): a methylation model drives them with
//   simulate(histamineModel, { controls: { samUM: sam, sahUM: sah } })
// Diurnal modulation is OFF (amplitude 0): the 2-4 am claim is only partly supported (B2). Sources: 'b2:<id>', 'fit', 'assumed'.

const p = (id, value, low, high, unit, source, confidence) => ({ id, value, low, high, unit, source, confidence })
const S = (id) => ({ species: id, n: 1 })
const sp = (id, name, initial, extra) => ({ id, name, initial, unit: 'uM', ...extra })
const rx = (id, name, subs, prods, law, params, extra) => ({ id, name, substrates: subs.map(S), products: prods.map(S), rate: { law, params, ...extra } })
const ctl = (id, label, min, max, def, unit, ...effects) => ({ id, label, min, max, default: def, unit, effects: effects.map(([target, eid, op, gain]) => ({ target, id: eid, op, ...(gain === undefined ? {} : { gain }) })) })

const KM_HIS = 3.7 // uM, HNMT (b2:hnmt-km-histamine)
const KM_SAM = 13.1
const KI_SAH = 6.9
const KM_DAO = 19
const SAM0 = 60 // uM tissue SAM (rat liver 60-90; human tissue not measured)
const SAH0 = 12
const HIS_P = 0.00875 // uM plasma baseline
const K_TOTAL = Math.LN2 / (4 / 60) // 1/h from the 4 min plasma half-life
const HNMT_SHARE = 0.6 // assumed share of plasma / tissue clearance by HNMT at baseline
const BIG = 1e9 // allostericActivation(fold = BIG + 1) ~ BIG * His/(Km + His); Vmax is divided by BIG
const samFactor = (sam, sah) => sam / (KM_SAM * (1 + sah / KI_SAH) + sam)
const VMAX = (HNMT_SHARE * K_TOTAL * KM_HIS) / samFactor(SAM0, SAH0) // uM/h
const K_DAO = 20
const K_ABS = 2
const V_RATIO = 0.05 // gut pool volume / systemic volume (assumed)
const K_H0 = HNMT_SHARE * K_TOTAL
const K_OTHER = (1 - HNMT_SHARE) * K_TOTAL
const OUT_P = ((K_H0 * KM_HIS) / (KM_HIS + HIS_P) + K_OTHER) * HIS_P // uM/h leaving the systemic pool at baseline
const HIS_G = (0.2 * OUT_P) / (K_ABS * V_RATIO) // gut pool whose absorption supplies 20% of the systemic input
const RP = 0.8 * OUT_P
const RG = (K_ABS + (K_DAO * KM_DAO) / (KM_DAO + HIS_G)) * HIS_G
const HIS_B = 0.1 // arbitrary CNS baseline: only relative values mean anything
const K_EFF = (K_H0 * 0.2) / 0.8 // CNS efflux so that HNMT is 80% of clearance (assumed)
const RB = ((K_H0 * KM_HIS) / (KM_HIS + HIS_B) + K_EFF) * HIS_B

const hnmt = (id, his) => ({
  id, name: 'HNMT', ontologyId: 'reaction:hnmt-histamine-methylation', enzymeId: 'enzyme:hnmt', substrates: [S(his), S('sam')], products: [S('MeHis'), S('sah')],
  rate: { law: 'competitiveInhibition', params: { Vmax: 'vmax_hnmt_s', Km: 'km_sam', Ki: 'ki_sah' }, species: { S: 'sam', I: 'sah' }, modifiers: [{ law: 'allostericActivation', species: { A: his }, params: { Ka: 'km_his', n: 1, fold: BIG + 1 } }] }
})

/** Diurnal profile events: Prof = (1 + cos(2 pi (t - peak) / 24)) / 2 in [0, 1], every `stepH` hours. */
export function circadianEvents({ peakHour = 4, hours = 48, stepH = 0.5 } = {}) {
  const out = []
  for (let t = 0; t <= hours; t += stepH) out.push({ time: t, set: { Prof: +((1 + Math.cos((2 * Math.PI * (t - peakHour)) / 24)) / 2).toFixed(4) } })
  return out
}

export const histamineModel = {
  id: 'histamine-turnover',
  name: 'Histamine turnover: DAO (gut) and HNMT (SAM-dependent)',
  label: 'Illustrative educational model - not measurable physiology or medical advice',
  quality: 'qualitative: enzyme constants measured; tissue pools, the HNMT share of clearance (0.6, CNS 0.8) and gut absorption assumed',
  time: { unit: 'h', duration: 48 },
  species: [
    sp('His_g', 'Histamine, gut', HIS_G, { compartment: 'gut', ontologyId: 'compound:histamine' }),
    sp('His_p', 'Histamine, systemic', HIS_P, { compartment: 'systemic', ontologyId: 'compound:histamine' }),
    sp('His_b', 'Histamine, CNS (arbitrary baseline)', HIS_B, { compartment: 'cns', ontologyId: 'compound:histamine' }),
    sp('MeHis', 'N-methylhistamine (sink)', 0, { fixed: true, ontologyId: 'compound:methylhistamine' }),
    sp('sam', 'SAM available to HNMT (input)', SAM0, { fixed: true, ontologyId: 'compound:sam' }), sp('sah', 'SAH (input)', SAH0, { fixed: true }),
    sp('Amp', 'Diurnal amplitude (input)', 0, { fixed: true }), sp('Prof', 'Diurnal profile (events)', 0.5, { fixed: true }),
    sp('refP', 'Systemic baseline', HIS_P, { fixed: true }), sp('refB', 'CNS baseline', HIS_B, { fixed: true })
  ],
  parameters: [
    p('km_sam', KM_SAM, 2, 23.6, 'uM', 'b2:hnmt-km-sam', 'high'), p('ki_sah', KI_SAH, 6.9, 9, 'uM', 'b2:hnmt-ki-sah', 'high'), p('km_his', KM_HIS, 3.7, 25.3, 'uM', 'b2:hnmt-km-histamine', 'high'),
    p('vmax_hnmt_s', VMAX / BIG, VMAX / BIG / 3, (VMAX / BIG) * 3, 'uM/h/1e9', 'fit: HNMT 60% of the 10.4/h plasma clearance', 'low'),
    p('vmax_dao', K_DAO * KM_DAO, K_DAO * KM_DAO * 0.3, K_DAO * KM_DAO * 3, 'uM/h', 'assumed capacity', 'assumed'), p('km_dao', KM_DAO, 2.8, 19, 'uM', 'b2:dao-km-histamine', 'high'),
    p('k_abs_g', K_ABS, 0.5, 6, '1/h', 'assumed', 'assumed'), p('k_other', K_OTHER, 2, 8, '1/h', 'b2:histamine-half-life-iv x 0.4', 'medium'),
    p('rel_p_flat', RP, RP * 0.3, RP * 3, 'uM/h', 'fit: baseline 0.00875 uM', 'low'), p('rel_p_circ', 2 * RP, 0, 6 * RP, 'uM/h', 'derived: 2 x release (mean unchanged)', 'low'),
    p('rel_g', RG, RG * 0.3, RG * 10, 'uM/h', 'assumed: 20% of input via the gut', 'assumed'), p('k_efflux_b', K_EFF, 0.5, 6, '1/h', 'assumed', 'assumed'),
    p('rel_b', RB, RB * 0.3, RB * 3, 'uM/h', 'derived', 'assumed')
  ],
  reactions: [
    rx('release_g', 'Release into the gut pool', [], ['His_g'], 'constantInput', { rate: 'rel_g' }),
    rx('dao_g', 'DAO (gut mucosa)', ['His_g'], [], 'michaelisMenten', { Vmax: 'vmax_dao', Km: 'km_dao' }),
    { id: 'absorb_g', name: 'Gut to systemic (diluted by the volume ratio)', substrates: [S('His_g')], products: [{ species: 'His_p', n: V_RATIO }], rate: { law: 'firstOrder', params: { k: 'k_abs_g' } } },
    rx('release_p_flat', 'Systemic release, flat part', [], ['His_p'], 'constantInput', { rate: 'rel_p_flat' }),
    rx('release_p_circ', 'Systemic release, diurnal part', ['Amp', 'Prof'], ['His_p'], 'massAction', { k: 'rel_p_circ' }),
    hnmt('hnmt_p', 'His_p'),
    rx('other_p', 'Other systemic clearance', ['His_p'], [], 'firstOrder', { k: 'k_other' }),
    rx('release_b', 'CNS release', [], ['His_b'], 'constantInput', { rate: 'rel_b' }),
    hnmt('hnmt_b', 'His_b'),
    rx('efflux_b', 'CNS efflux', ['His_b'], [], 'firstOrder', { k: 'k_efflux_b' })
  ],
  controls: [
    ctl('diurnalAmplitude', 'WEAKLY SUPPORTED diurnal release amplitude (0 flat; 0.42 = 2x at 04:00 vs 16:00, Szefler 1991)', 0, 0.9, 0, 'fraction', ['species', 'Amp', 'set'], ['param', 'rel_p_flat', 'add', -RP]),
    ctl('samUM', 'SAM available to HNMT (uM; link to the methylation model)', 1, 150, SAM0, 'uM', ['species', 'sam', 'set']),
    ctl('sahUM', 'SAH (uM; link to the methylation model)', 0, 60, SAH0, 'uM', ['species', 'sah', 'set']),
    ctl('hnmtActivityX', 'HNMT activity (x)', 0, 2, 1, 'x', ['reaction', 'hnmt_p', 'multiply'], ['reaction', 'hnmt_b', 'multiply']),
    ctl('daoActivityX', 'Gut DAO activity (x; 0 ~ full block)', 0, 2, 1, 'x', ['reaction', 'dao_g', 'multiply']),
    ctl('releaseX', 'Mast-cell release (x)', 0, 10, 1, 'x', ['param', 'rel_p_flat', 'multiply'], ['param', 'rel_p_circ', 'multiply'], ['param', 'rel_g', 'multiply']),
    ctl('foodHistamineUM', 'Histamine bolus in the gut pool (uM-equivalents)', 0, 500, 0, 'uM', ['species', 'His_g', 'add'])
  ],
  events: circadianEvents(),
  observables: [
    { id: 'plasmaRel', label: 'Systemic histamine vs baseline', unit: 'x', expr: { ratio: ['His_p', 'refP'] } },
    { id: 'cnsRel', label: 'CNS histamine vs baseline (HNMT only)', unit: 'x', expr: { ratio: ['His_b', 'refB'] } }
  ]
}

/** HNMT activity relative to the default (SAM 60, SAH 12 uM): the SAM / SAH factor of the rate law. */
export const hnmtFactor = (sam, sah) => samFactor(sam, sah) / samFactor(SAM0, SAH0)

