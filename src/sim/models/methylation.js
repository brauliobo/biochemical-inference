// Integrated human-liver-scale methylation model (methionine cycle + folate cycle + transsulfuration +
// choline/betaine + glycine/serine + SAM consumers + B6/B12/MTHFR/niacin controls).
// ILLUSTRATIVE EDUCATIONAL MODEL: literature-parameterised, calibrated to published steady states, not a
// measurement of any person and not medical advice. Units: concentration uM (per litre of hepatic cell
// water), time hours, flux uM/h; "depot" species (gut) are in umol. Documentation: docs/METHYLATION_MODEL.md.
//
// How the model is assembled (see the doc for the full account):
//  * Kinetic constants (Km, Ki, Hill n, ...) come from parameters-b1 (Reed 2015 base set) and parameters-b2.
//  * Maximal rates (Vmax / first-order k / input rates) are NOT literature values: each is calibrated, at model
//    construction, so that the reference concentration state is an exact steady state with the published flux
//    split (Reed 2015: MAT 100 uM/h; GNMT 44, PEMT 27.5, GAMT 25.4, DNMT 2; CBS 50; BHMT 24; ...).
//  * Rate laws are compositions of the engine's laws and modifiers. A saturation factor x/(K+x) that must be
//    zero at x = 0 is written as allostericActivation with a very large fold (SATF); the extra scale is
//    absorbed by the calibrated Vmax, so reported Vmax of such reactions = Vmax_true / SATF^(number of SAT factors).

import { compileModel } from '../model.js'

export const MODEL_LABEL = 'Illustrative educational model - not measurable physiology or medical advice'
export const SATF = 1000

// ---- reference state (uM; depots umol). Liver values: Reed 2015 Table 1 + parameters-b2 species -------------
export const REF = {
  met: 17.97, sam: 23.97, sah: 3.89, hcy: 2.27, cysta: 17.2, cys: 195,
  thf: 4.6, ch2thf: 1.0, mthf: 5.35, f10: 3.4, dhf: 0.04,
  gly: 1660, ser: 468, cho: 84, bet: 1158, dmg: 48.2, sar: 20.2, pe: 5000, pc: 17317,
  nam: 0.26, mna: 0.1875,
  gly_p: 240, bet_p: 39.5, hcy_p: 7.0,
  gly_gut: 0, bet_gut: 0, cho_gut: 0, met_gut: 0, nic_gut: 0,
  gaa: 10, formate: 900, plp: 1, creatine: 0
}

// [id, name, unit, ontologyId, kind]  kind: 'fixed' buffers; 'depot' gut compartments (umol)
const SPECIES = [
  ['met', 'Methionine (liver)', 'uM', 'compound:methionine'],
  ['sam', 'S-adenosylmethionine (liver)', 'uM', 'compound:sam'],
  ['sah', 'S-adenosylhomocysteine (liver)', 'uM', 'compound:sah'],
  ['hcy', 'Homocysteine (liver)', 'uM', 'compound:homocysteine'],
  ['cysta', 'Cystathionine (liver)', 'uM', 'compound:cystathionine'],
  ['cys', 'Cysteine (liver)', 'uM', 'compound:cysteine'],
  ['thf', 'Tetrahydrofolate', 'uM', 'compound:thf'],
  ['ch2thf', '5,10-Methylene-THF', 'uM', 'compound:5-10-methylene-thf'],
  ['mthf', '5-Methyl-THF', 'uM', 'compound:5-mthf'],
  ['f10', '10-Formyl-THF (incl. methenyl-THF)', 'uM', 'compound:10-formyl-thf'],
  ['dhf', 'Dihydrofolate', 'uM', 'compound:dhf'],
  ['gly', 'Glycine (liver)', 'uM', 'compound:glycine'],
  ['ser', 'Serine (liver)', 'uM', 'compound:serine'],
  ['cho', 'Choline (liver)', 'uM', 'compound:choline'],
  ['bet', 'Betaine (liver)', 'uM', 'compound:betaine'],
  ['dmg', 'Dimethylglycine (liver)', 'uM', 'compound:dimethylglycine'],
  ['sar', 'Sarcosine (liver)', 'uM', 'compound:sarcosine'],
  ['pe', 'Phosphatidylethanolamine (lumped pool)', 'uM', 'compound:phosphatidylethanolamine'],
  ['pc', 'Phosphatidylcholine (lumped pool)', 'uM', 'compound:phosphatidylcholine'],
  ['nam', 'Nicotinamide (liver)', 'uM', 'compound:nicotinamide'],
  ['mna', 'N1-Methylnicotinamide (liver)', 'uM', 'compound:1-methylnicotinamide'],
  ['gly_p', 'Glycine (plasma/body-water pool)', 'uM', 'compound:glycine'],
  ['bet_p', 'Betaine (plasma/body-water pool)', 'uM', 'compound:betaine'],
  ['hcy_p', 'Total homocysteine (plasma)', 'uM', 'compound:homocysteine'],
  ['gly_gut', 'Glycine, gut depot', 'umol', 'compound:glycine', 'depot'],
  ['bet_gut', 'Betaine, gut depot', 'umol', 'compound:betaine', 'depot'],
  ['cho_gut', 'Choline, gut depot', 'umol', 'compound:choline', 'depot'],
  ['met_gut', 'Methionine, gut depot', 'umol', 'compound:methionine', 'depot'],
  ['nic_gut', 'Niacin, gut depot', 'umol', 'compound:niacin', 'depot'],
  ['gaa', 'Guanidinoacetate (held constant)', 'uM', 'compound:guanidinoacetate', 'fixed'],
  ['formate', 'Formate (held constant)', 'uM', 'compound:formate', 'fixed'],
  ['plp', 'Relative cellular PLP (1 = baseline; B6 status)', 'x', 'compound:plp', 'fixed'],
  ['creatine', 'Creatine (sink, held constant)', 'uM', 'compound:creatine', 'fixed']
]

// ---- kinetic / transport / PK constants: [id, value, low, high, unit, confidence] ---------------------------
// confidence: h measured, m measured-in-another-system or fitted-in-model, l estimated, a assumed
const KIN = [
  ['km_mat1_met', 41, 14, 720, 'uM', 'h'], ['ki_mat1_sam', 270, 150, 500, 'uM', 'l'], ['n_mat1_sam', 1.45, 1, 2, '', 'l'], ['resid_mat1', 0.23, 0.23, 0.23, '', 'm'],
  ['s05_mat3_met', 111.4, 111.4, 215, 'uM', 'm'], ['n_mat3_met', 1.21, 1.21, 1.8, '', 'm'], ['ka_mat3_sam', 360, 360, 360, 'uM', 'm'], ['fold_mat3_sam', 8.2, 8.2, 8.2, '', 'm'],
  ['ks_gnmt_sam', 100, 30, 460, 'uM', 'h'], ['n_gnmt_sam', 2, 1, 2.3, '', 'h'], ['ki_gnmt_sah', 17.5, 6.5, 97, 'uM', 'm'], ['km_gnmt_gly', 130, 12.2, 20000, 'uM', 'h'],
  ['ki_gnmt_mthf1', 0.04, 0.01, 0.2, 'uM', 'm'], ['ki_gnmt_mthf2', 1.5, 0.27, 590, 'uM', 'm'], ['resid_gnmt_mthf1', 0.5, 0.5, 0.5, '', 'm'],
  ['km_pemt_sam', 18.2, 18.2, 302, 'uM', 'h'], ['ki_pemt_sah', 3.8, 3.8, 68, 'uM', 'h'], ['km_pemt_pe', 5000, 5000, 5000, 'uM', 'h'],
  ['km_gamt_sam', 49, 6.73, 49, 'uM', 'h'], ['ki_gamt_sah', 16, 16, 16, 'uM', 'h'],
  ['km_dnmt_sam', 1.4, 1.4, 7.2, 'uM', 'h'], ['ki_dnmt_sah', 1.4, 0.7, 14, 'uM', 'h'],
  ['km_mto_sam', 50, 20.2, 50, 'uM', 'h'], ['ki_mto_sah', 10, 3, 30, 'uM', 'a'],
  ['km_nnmt_sam', 1.8, 1.8, 5, 'uM', 'h'], ['km_nnmt_nam', 430, 380, 430, 'uM', 'h'], ['ic50_nnmt_mna', 60, 30, 60, 'uM', 'h'],
  ['km_ahcy_sah', 6.5, 0.75, 15.2, 'uM', 'h'], ['km_ahcy_hcy', 150, 56.6, 200, 'uM', 'h'],
  ['km_mtr_mthf', 25, 22, 34, 'uM', 'h'], ['km_mtr_hcy', 1, 0.1, 6, 'uM', 'h'],
  ['km_bhmt_bet', 2200, 23, 2200, 'uM', 'h'], ['km_bhmt_hcy', 12, 4, 32, 'uM', 'h'], ['ki_bhmt_dmg', 100, 10, 1000, 'uM', 'a'], ['ki_bhmt_samsah', 365, 200, 800, 'uM', 'l'],
  ['km_cbs_hcy', 1000, 1000, 25000, 'uM', 'h'], ['km_cbs_ser', 2000, 2000, 4000, 'uM', 'h'], ['ka_cbs_sam', 30, 7.4, 60, 'uM', 'm'], ['fold_cbs_sam', 3, 2, 5, '', 'a'], ['kplp_cbs', 0.43, 0.3, 0.6, 'x PLP', 'l'],
  ['km_cth_cysta', 500, 500, 500, 'uM', 'h'], ['kplp_cth', 0.86, 0.43, 1.4, 'x PLP', 'l'],
  ['km_mthfr_ch2', 50, 50, 50, 'uM', 'h'], ['ki_mthfr_sam', 10, 5, 20, 'uM', 'm'], ['resid_mthfr', 0.046, 0.046, 0.046, '', 'm'],
  ['km_shmt_thf', 50, 45, 300, 'uM', 'h'], ['km_shmt_ser', 600, 350, 1300, 'uM', 'h'], ['km_shmt_gly', 10000, 3000, 10000, 'uM', 'h'], ['km_shmt_ch2', 3200, 3000, 10000, 'uM', 'h'], ['kplp_shmt', 0.1, 0.03, 0.14, 'x PLP', 'l'],
  ['km_gcs_gly', 6000, 5800, 6600, 'uM', 'h'], ['km_gcs_thf', 100, 10, 1000, 'uM', 'a'], ['kplp_gcs', 0.1, 0.03, 0.14, 'x PLP', 'a'],
  ['km_mtd_ch2', 2, 2, 5, 'uM', 'h'], ['km_mtd_f10', 100, 10, 250, 'uM', 'h'],
  ['km_fts_thf', 3, 0.1, 600, 'uM', 'h'], ['km_fts_formate', 43, 8, 1000, 'uM', 'h'],
  ['km_ftd_f10', 20, 0.9, 20, 'uM', 'h'], ['km_pur_f10', 5, 4.9, 58, 'uM', 'h'],
  ['km_ts_ch2', 14, 10, 45, 'uM', 'h'], ['km_dhfr_dhf', 0.5, 0.12, 1.9, 'uM', 'h'],
  ['k_fol_loss', 0.002, 0.0005, 0.005, '1/h', 'a'],
  ['km_chdh_cho', 7000, 3500, 14000, 'uM', 'l'], ['km_chok_cho', 200, 160, 240, 'uM', 'h'],
  ['km_dmgdh_dmg', 300, 40, 1400, 'uM', 'h'], ['km_dmgdh_thf', 10, 3, 50, 'uM', 'a'],
  ['km_sardh_sar', 500, 250, 1000, 'uM', 'l'], ['km_sardh_thf', 10, 3, 50, 'uM', 'a'],
  ['km_gly_up', 1000, 300, 3000, 'uM', 'a'], ['k_gly_efl', 0.15, 0.05, 0.5, '1/h', 'a'], ['k_gly_use', 0.0602, 0.02, 0.15, '1/h', 'a'],
  ['km_bet_up', 500, 200, 1500, 'uM', 'a'], ['ki_bet_trans', 3000, 1500, 10000, 'uM', 'a'], ['k_bet_efl', 0.05, 0.01, 0.2, '1/h', 'a'],
  ['k_gly_per', 0.9, 0.5, 1.5, '1/h', 'm'], ['k_bet_ren', 0.045, 0.022, 0.115, '1/h', 'h'],
  ['ka_gly', 3, 1.5, 6, '1/h', 'l'], ['ka_bet', 5.2, 1.54, 6.3, '1/h', 'm'], ['ka_cho', 0.7, 0.3, 1.5, '1/h', 'l'], ['ka_met', 0.7, 0.3, 1.5, '1/h', 'a'], ['ka_nic', 2, 0.7, 4, '1/h', 'l'],
  ['k_ser_use', 0.128, 0.05, 0.3, '1/h', 'a'], ['k_pe_out', 0.002, 0.0005, 0.01, '1/h', 'a'],
  ['k_mna_out', 2, 0.5, 5, '1/h', 'a'], ['vmax_nam_salv', 38, 15, 80, 'uM/h', 'a'], ['km_nam_salv', 1, 0.3, 3, 'uM', 'a'],
  ['k_dmg_out', 0.0207, 0.005, 0.1, '1/h', 'a'], ['k_sar_out', 0.0495, 0.01, 0.2, '1/h', 'a'],
  ['k_hcy_p_out', 0.05, 0.02, 0.1, '1/h', 'a'], ['km_ems_mthf', 25, 22, 34, 'uM', 'h']
]

// structural constants (stoichiometric scale factors; fixed per built model, not engine parameters)
export const STRUCT = {
  loadScale: 5,    // uM/h per mmol/day whole-body: the model liver carries a proportional share of CHRONIC (flux) loads
  dose_met: 0.0125, // uM liver per umol of an ACUTE methionine dose (1/80 L: apparent volume of Met-load kinetics)
  dose_cho: 0.05,  // uM liver per umol acute choline (1/20 L: portal first-pass, assumed)
  dose_nic: 0.025, // uM liver per umol acute niacin (1/40 L, assumed)
  vd_gly: 51,      // L apparent volume (calc from Gannon 2002 peak: unverified)
  vd_bet: 30.7,    // L (calc from Schwahn 2003 Cmax with ka 5.2/h so that tmax = 0.9 h)
  rho_hcy: 0.4667  // plasma-pool scaling of Hcy export (assumed so that plasma tHcy 7 uM ~ 3.1 x liver Hcy)
}
const MMOL_TO_UMOL = 1000
const S0 = 5 // mapping used for the whole-body flux anchors of the baseline calibration

// ---- modifier helpers --------------------------------------------------------------------------------------
const SAT = (L, K, n = 1) => ({ law: 'allostericActivation', species: { A: L }, params: { Ka: K, n, fold: SATF } })
const INH = (I, Ki, residual = 0, n = 1) => ({ law: 'allostericInhibition', species: { I }, params: { Ki, n, residual } })
const ACT = (A, Ka, fold, n = 1) => ({ law: 'allostericActivation', species: { A }, params: { Ka, n, fold } })

// Reference-state flux partition (uM/h): [value, low, high]. Values: Reed 2015 liver cycle (parameters-b1) and
// parameters-b2 flux budgets scaled at 5 uM/h per mmol/day; ranges are the published disagreement (GNMT share 15-44%,
// SHMT exchange and one-carbon sinks unconstrained). Vmax values are re-derived for any choice (calibration).
export const PLAN = {
  gnmt: [43.97, 15, 44], pemtSam: [27.53, 12.5, 33], gamt: [25.42, 12.7, 73], dnmt: [2.05, 1, 10], mto: [1.28, 0.5, 10],
  cbs: [50, 30, 75], bhmt: [24, 19.5, 31.5], ahcyRev: [19.5, 5, 40], hcyExp: [1.5, 0.5, 5],
  shmtExchange: [210, 20, 1000], gcs: [100, 30, 400], ts: [40, 10, 130], pur: [120, 40, 600], ftd: [40, 10, 80], mtdF: [250, 150, 600],
  chok: [100, 20, 300]
}
const PLAN_DEFAULTS = Object.fromEntries(Object.entries(PLAN).map(([k, v]) => [k, v[0]]))

/** Flux plan (uM/h) of the reference steady state: reaction id -> target flux. Pure arithmetic. */
function fluxPlan(ref, kin, st) {
  const T = {}
  const pl = { ...PLAN_DEFAULTS, ...(st.plan ?? {}) }
  T.gnmt = pl.gnmt; T.pemt = pl.pemtSam / 3; T.gamt = pl.gamt; T.dnmt = pl.dnmt; T.mto = pl.mto; T.nnmt = 0.075 * S0
  const samUse = T.gnmt + 3 * T.pemt + T.gamt + T.dnmt + T.mto + T.nnmt
  T.mat1 = 0.7757 * samUse; T.mat3 = samUse - T.mat1
  T.ahcy_r = pl.ahcyRev; T.ahcy_f = samUse + T.ahcy_r
  T.hcy_exp = pl.hcyExp; T.bhmt = pl.bhmt; T.cbs = pl.cbs
  T.mtr = samUse - T.bhmt - T.cbs - T.hcy_exp
  T.cth = T.cbs; T.cys_out = T.cth
  T.met_in = samUse - T.mtr - T.bhmt
  // plasma tHcy: hepatic export + extra-hepatic production (50:50, assumed) are removed by kidney (25%) and
  // extra-hepatic B12/folate-dependent remethylation (75%, assumed): the extra-hepatic arm makes tHcy B12-sensitive
  T.hcy_p_ms = 0.15 * ref.hcy_p
  T.hcy_ext = T.hcy_p_ms + kin.k_hcy_p_out * ref.hcy_p - T.hcy_exp * st.rho_hcy
  // folate / one-carbon
  T.fol_loss = kin.k_fol_loss * (ref.thf + ref.ch2thf + ref.mthf + ref.f10 + ref.dhf); T.fol_in = T.fol_loss
  T.mthfr = T.mtr + kin.k_fol_loss * ref.mthf - T.fol_in // 5-MTHF balance: MTHFR + supply = MTR + its loss
  const L = (f) => kin.k_fol_loss * ref[f] // folate loss fluxes (tiny; keep the reference state exact)
  T.ts = pl.ts; T.dhfr = T.ts - L('dhf'); T.shmt_f = pl.shmtExchange; T.shmt_r = pl.shmtExchange; T.gcs = pl.gcs
  T.dmg_out = kin.k_dmg_out * ref.dmg; T.sar_out = kin.k_sar_out * ref.sar
  T.dmgdh = T.bhmt - T.dmg_out; T.sardh = T.gnmt + T.dmgdh - T.sar_out
  const mtdNet = (T.shmt_f - T.shmt_r) + T.gcs + T.dmgdh + T.sardh - T.mthfr - T.ts - L('ch2thf')
  T.ftd = pl.ftd; T.pur = pl.pur; T.fts = T.ftd + T.pur + L('f10') - mtdNet
  T.mtd_f = Math.max(pl.mtdF, mtdNet * 1.2); T.mtd_r = T.mtd_f - mtdNet
  // glycine / serine
  T.gly_use = kin.k_gly_use * ref.gly; T.gly_efl = kin.k_gly_efl * ref.gly
  T.gly_up = T.gcs + T.gnmt + T.gly_use + T.gly_efl - T.sardh - (T.shmt_f - T.shmt_r)
  T.ser_out = kin.k_ser_use * ref.ser
  T.ser_in = T.cbs + T.ser_out + (T.shmt_f - T.shmt_r)
  const rg = 1 / st.vd_gly * 1 // plasma-pool stoichiometry per hepatic flux (V_liver = 1 L)
  T.gly_p_out = kin.k_gly_per * ref.gly_p
  T.gly_p_in = T.gly_p_out + (T.gly_up - T.gly_efl) * rg
  // choline / betaine
  // Kennedy synthesis and PC turnover run as a large gross cycle (liver PC t1/2 ~ days: ~100 uM/h, assumed); the net
  // choline release from PC = PEMT-made PC minus PC secretion (B2: 1.25 vs 1.0 mmol/day)
  T.chdh = 3.3 * S0; T.chok = pl.chok; T.pc_out = 1.0 * S0; T.pld = T.chok + T.pemt - T.pc_out
  T.cho_out = 3.677
  T.cho_in = T.chdh + T.chok + T.cho_out - T.pld
  T.pe_out = kin.k_pe_out * ref.pe; T.pe_in = T.pemt + T.pe_out
  T.bet_efl = kin.k_bet_efl * ref.bet
  T.bet_up = T.bhmt - T.chdh + T.bet_efl
  const rb = 1 / st.vd_bet
  T.bet_p_out = kin.k_bet_ren * ref.bet_p
  T.bet_p_in = T.bet_p_out + (T.bet_up - T.bet_efl) * rb
  // niacin / NNMT
  T.nam_salv = kin.vmax_nam_salv * ref.nam / (kin.km_nam_salv + ref.nam)
  T.nam_in = T.nam_salv + T.nnmt
  T.mna_out = T.nnmt
  return T
}

/** Species/parameter/reaction tables -> model object. `scales` maps scale-parameter id -> value. */
function assemble(st) {
  const rg = 1 / st.vd_gly; const rb = 1 / st.vd_bet
  const s = (species, n = 1) => ({ species, n })
  const rx = []
  // add(id, name, substrates, products, rate, extras); extras: ont, enz, target (flux key), scale ('Vmax'|'k'|'rate')
  const add = (id, name, subs, prods, rate, extra = {}) => rx.push({ id, name, subs, prods, rate, ...extra })

  // --- methionine cycle ---
  add('met_in', 'Dietary methionine input (to liver)', [], [s('met')], { law: 'constantInput', params: { rate: 'rate_met_in' } }, { target: 'met_in', unit: 'uM/h' })
  add('met_abs', 'Methionine meal absorption (gut depot -> liver)', [s('met_gut')], [s('met', st.dose_met)], { law: 'firstOrder', params: { k: 'ka_met' } })
  add('mat1', 'MAT I (MAT1A tetramer), SAM-inhibited', [s('met')], [s('sam')], { law: 'michaelisMenten', params: { Vmax: 'vmax_mat1', Km: 'km_mat1_met' }, modifiers: [INH('sam', 'ki_mat1_sam', 'resid_mat1', 'n_mat1_sam')] }, { ont: 'reaction:mat-sam-synthesis', enz: 'enzyme:mat1a', target: 'mat1', unit: 'uM/h' })
  add('mat3', 'MAT III (MAT1A dimer), SAM-activated', [s('met')], [s('sam')], { law: 'hill', params: { Vmax: 'vmax_mat3', K: 's05_mat3_met', n: 'n_mat3_met' }, modifiers: [ACT('sam', 'ka_mat3_sam', 'fold_mat3_sam', 2)] }, { ont: 'reaction:mat-sam-synthesis', enz: 'enzyme:mat1a', target: 'mat3', unit: 'uM/h' })
  add('gnmt', 'Glycine N-methyltransferase', [s('sam'), s('gly')], [s('sah'), s('sar')], { law: 'hill', params: { Vmax: 'vmax_gnmt', K: 'ks_gnmt_sam', n: 'n_gnmt_sam' }, species: { S: 'sam' }, modifiers: [SAT('gly', 'km_gnmt_gly'), INH('sah', 'ki_gnmt_sah'), INH('mthf', 'ki_gnmt_mthf1', 'resid_gnmt_mthf1'), INH('mthf', 'ki_gnmt_mthf2')] }, { ont: 'reaction:gnmt-glycine-methylation', enz: 'enzyme:gnmt', target: 'gnmt', unit: 'uM/h (scaled)' })
  add('pemt', 'PEMT: PE -> PC (3 SAM per PC; flux in PC/h)', [s('sam', 3), s('pe')], [s('sah', 3), s('pc')], { law: 'competitiveInhibition', params: { Vmax: 'vmax_pemt', Km: 'km_pemt_sam', Ki: 'ki_pemt_sah' }, species: { S: 'sam', I: 'sah' }, modifiers: [SAT('pe', 'km_pemt_pe')] }, { ont: 'reaction:pemt-pe-to-pc', enz: 'enzyme:pemt', target: 'pemt', unit: 'uM/h (scaled)' })
  add('gamt', 'Creatine synthesis (GAMT, lumped)', [s('sam')], [s('sah'), s('creatine')], { law: 'competitiveInhibition', params: { Vmax: 'vmax_gamt', Km: 'km_gamt_sam', Ki: 'ki_gamt_sah' }, species: { S: 'sam', I: 'sah' } }, { ont: 'reaction:gamt-creatine-synthesis', enz: 'enzyme:gamt', target: 'gamt', unit: 'uM/h' })
  add('dnmt', 'DNA/protein methyltransferases (DNMT, lumped)', [s('sam')], [s('sah')], { law: 'competitiveInhibition', params: { Vmax: 'vmax_dnmt', Km: 'km_dnmt_sam', Ki: 'ki_dnmt_sah' }, species: { S: 'sam', I: 'sah' } }, { ont: 'reaction:dnmt-dna-cytosine-methylation', enz: 'enzyme:dnmt', target: 'dnmt', unit: 'uM/h' })
  add('mt_other', 'Other methyltransferases (COMT/HNMT/AS3MT, lumped)', [s('sam')], [s('sah')], { law: 'competitiveInhibition', params: { Vmax: 'vmax_mto', Km: 'km_mto_sam', Ki: 'ki_mto_sah' }, species: { S: 'sam', I: 'sah' } }, { target: 'mto', unit: 'uM/h' })
  add('nnmt', 'NNMT: nicotinamide + SAM -> 1-methylnicotinamide + SAH', [s('sam'), s('nam')], [s('sah'), s('mna')], { law: 'randomBiBi', params: { Vmax: 'vmax_nnmt', Kma: 'km_nnmt_sam', Kmb: 'km_nnmt_nam' }, modifiers: [INH('mna', 'ic50_nnmt_mna')] }, { ont: 'reaction:nnmt-nicotinamide-methylation', enz: 'enzyme:nnmt', target: 'nnmt', unit: 'uM/h' })
  add('ahcy_f', 'AHCY hydrolysis: SAH -> homocysteine', [s('sah')], [s('hcy')], { law: 'michaelisMenten', params: { Vmax: 'vmax_ahcy_f', Km: 'km_ahcy_sah' } }, { ont: 'reaction:ahcy-sah-hydrolysis', enz: 'enzyme:ahcy', target: 'ahcy_f', unit: 'uM/h' })
  add('ahcy_r', 'AHCY reverse synthesis: homocysteine -> SAH', [s('hcy')], [s('sah')], { law: 'michaelisMenten', params: { Vmax: 'vmax_ahcy_r', Km: 'km_ahcy_hcy' } }, { ont: 'reaction:ahcy-sah-hydrolysis', enz: 'enzyme:ahcy', target: 'ahcy_r', unit: 'uM/h' })
  add('mtr', 'Methionine synthase (MTR; B12-dependent)', [s('mthf'), s('hcy')], [s('met'), s('thf')], { law: 'randomBiBi', params: { Vmax: 'vmax_mtr', Kma: 'km_mtr_mthf', Kmb: 'km_mtr_hcy' } }, { ont: 'reaction:mtr-methionine-synthase', enz: 'enzyme:mtr', target: 'mtr', unit: 'uM/h' })
  add('bhmt', 'Betaine-homocysteine methyltransferase', [s('bet'), s('hcy')], [s('met'), s('dmg')], { law: 'competitiveInhibition', params: { Vmax: 'vmax_bhmt', Km: 'km_bhmt_bet', Ki: 'ki_bhmt_dmg' }, species: { S: 'bet', I: 'dmg' }, modifiers: [SAT('hcy', 'km_bhmt_hcy'), INH('sam', 'ki_bhmt_samsah'), INH('sah', 'ki_bhmt_samsah')] }, { ont: 'reaction:bhmt-betaine-homocysteine', enz: 'enzyme:bhmt', target: 'bhmt', unit: 'uM/h (scaled)' })
  add('cbs', 'Cystathionine beta-synthase (SAM-activated, PLP-dependent)', [s('hcy'), s('ser')], [s('cysta')], { law: 'michaelisMenten', params: { Vmax: 'vmax_cbs', Km: 'km_cbs_hcy' }, species: { S: 'hcy' }, modifiers: [SAT('ser', 'km_cbs_ser'), ACT('sam', 'ka_cbs_sam', 'fold_cbs_sam', 2), SAT('plp', 'kplp_cbs')] }, { ont: 'reaction:cbs-cystathionine-synthesis', enz: 'enzyme:cbs', target: 'cbs', unit: 'uM/h (scaled)' })
  add('cth', 'Cystathionine gamma-lyase (PLP-dependent)', [s('cysta')], [s('cys')], { law: 'michaelisMenten', params: { Vmax: 'vmax_cth', Km: 'km_cth_cysta' }, modifiers: [SAT('plp', 'kplp_cth')] }, { ont: 'reaction:cth-cystathionine-cleavage', enz: 'enzyme:cth', target: 'cth', unit: 'uM/h (scaled)' })
  add('cys_out', 'Cysteine disposal (glutathione, taurine, protein; lumped)', [s('cys')], [], { law: 'firstOrder', params: { k: 'k_cys_out' } }, { target: 'cys_out', unit: '1/h' })
  add('hcy_exp', 'Homocysteine export to plasma', [s('hcy')], [s('hcy_p', st.rho_hcy)], { law: 'firstOrder', params: { k: 'k_hcy_exp' } }, { target: 'hcy_exp', unit: '1/h' })
  add('hcy_p_out', 'Plasma homocysteine clearance (kidney, other tissues)', [s('hcy_p')], [], { law: 'firstOrder', params: { k: 'k_hcy_p_out' } })
  add('hcy_ext', 'Extra-hepatic homocysteine production (export into plasma)', [], [s('hcy_p')], { law: 'constantInput', params: { rate: 'rate_hcy_ext' } }, { target: 'hcy_ext', unit: 'uM/h (plasma units)' })
  add('hcy_p_ms', 'Extra-hepatic remethylation of plasma homocysteine (B12/folate-dependent, lumped)', [s('hcy_p')], [], { law: 'firstOrder', params: { k: 'k_hcy_p_ms' }, modifiers: [SAT('mthf', 'km_ems_mthf')] }, { ont: 'reaction:mtr-methionine-synthase', enz: 'enzyme:mtr', target: 'hcy_p_ms', unit: '1/h (scaled)' })

  // --- folate cycle ---
  add('mthfr', 'MTHFR: 5,10-methylene-THF -> 5-methyl-THF (SAM-inhibited)', [s('ch2thf')], [s('mthf')], { law: 'michaelisMenten', params: { Vmax: 'vmax_mthfr', Km: 'km_mthfr_ch2' }, modifiers: [INH('sam', 'ki_mthfr_sam', 'resid_mthfr')] }, { ont: 'reaction:mthfr-methylene-thf-reduction', enz: 'enzyme:mthfr', target: 'mthfr', unit: 'uM/h' })
  add('shmt_f', 'SHMT forward: serine + THF -> glycine + CH2-THF', [s('thf'), s('ser')], [s('gly'), s('ch2thf')], { law: 'randomBiBi', params: { Vmax: 'vmax_shmt_f', Kma: 'km_shmt_thf', Kmb: 'km_shmt_ser' }, modifiers: [SAT('plp', 'kplp_shmt')] }, { ont: 'reaction:shmt-serine-glycine-interconversion', enz: 'enzyme:shmt', target: 'shmt_f', unit: 'uM/h (scaled)' })
  add('shmt_r', 'SHMT reverse: glycine + CH2-THF -> serine + THF', [s('gly'), s('ch2thf')], [s('ser'), s('thf')], { law: 'randomBiBi', params: { Vmax: 'vmax_shmt_r', Kma: 'km_shmt_gly', Kmb: 'km_shmt_ch2' }, modifiers: [SAT('plp', 'kplp_shmt')] }, { ont: 'reaction:shmt-serine-glycine-interconversion', enz: 'enzyme:shmt', target: 'shmt_r', unit: 'uM/h (scaled)' })
  add('gcs', 'Glycine cleavage: glycine + THF -> CH2-THF + CO2 + NH3', [s('gly'), s('thf')], [s('ch2thf')], { law: 'michaelisMenten', params: { Vmax: 'vmax_gcs', Km: 'km_gcs_gly' }, species: { S: 'gly' }, modifiers: [SAT('thf', 'km_gcs_thf'), SAT('plp', 'kplp_gcs')] }, { ont: 'reaction:glycine-cleavage-system', enz: 'enzyme:glycine-cleavage-system', target: 'gcs', unit: 'uM/h (scaled)' })
  add('mtd_f', 'MTHFD1 (dehydrogenase + cyclohydrolase) forward: CH2-THF -> 10-formyl-THF', [s('ch2thf')], [s('f10')], { law: 'michaelisMenten', params: { Vmax: 'vmax_mtd_f', Km: 'km_mtd_ch2' } }, { ont: 'reaction:mthfd1-methylene-thf-oxidation', enz: 'enzyme:mthfd1', target: 'mtd_f', unit: 'uM/h' })
  add('mtd_r', 'MTHFD1 reverse: 10-formyl-THF -> CH2-THF', [s('f10')], [s('ch2thf')], { law: 'michaelisMenten', params: { Vmax: 'vmax_mtd_r', Km: 'km_mtd_f10' } }, { ont: 'reaction:mthfd1-methenyl-thf-cyclohydrolase', enz: 'enzyme:mthfd1', target: 'mtd_r', unit: 'uM/h' })
  add('fts', 'MTHFD1 formate-THF ligase: THF + formate -> 10-formyl-THF', [s('thf'), s('formate')], [s('f10')], { law: 'randomBiBi', params: { Vmax: 'vmax_fts', Kma: 'km_fts_thf', Kmb: 'km_fts_formate' } }, { ont: 'reaction:mthfd1-formate-thf-ligase', enz: 'enzyme:mthfd1', target: 'fts', unit: 'uM/h' })
  add('ftd', '10-Formyl-THF dehydrogenase (oxidation to CO2)', [s('f10')], [s('thf')], { law: 'michaelisMenten', params: { Vmax: 'vmax_ftd', Km: 'km_ftd_f10' } }, { ont: 'reaction:aldh1l1-10-formyl-thf-oxidation', enz: 'enzyme:aldh1l1', target: 'ftd', unit: 'uM/h' })
  add('pur', 'Purine synthesis (GART + ATIC, lumped formyl-THF use)', [s('f10')], [s('thf')], { law: 'michaelisMenten', params: { Vmax: 'vmax_pur', Km: 'km_pur_f10' } }, { ont: 'reaction:gart-gar-formylation', enz: 'enzyme:gart', target: 'pur', unit: 'uM/h' })
  add('ts', 'Thymidylate synthase: CH2-THF -> DHF', [s('ch2thf')], [s('dhf')], { law: 'michaelisMenten', params: { Vmax: 'vmax_ts', Km: 'km_ts_ch2' } }, { ont: 'reaction:tyms-thymidylate-synthesis', enz: 'enzyme:tyms', target: 'ts', unit: 'uM/h' })
  add('dhfr', 'Dihydrofolate reductase: DHF -> THF', [s('dhf')], [s('thf')], { law: 'michaelisMenten', params: { Vmax: 'vmax_dhfr', Km: 'km_dhfr_dhf' } }, { ont: 'reaction:dhfr-dihydrofolate-reduction', enz: 'enzyme:dhfr', target: 'dhfr', unit: 'uM/h' })
  add('fol_in', 'Folate supply (5-methyl-THF) from blood/diet', [], [s('mthf')], { law: 'constantInput', params: { rate: 'rate_fol_in' } }, { target: 'fol_in', unit: 'uM/h' })
  for (const f of ['thf', 'ch2thf', 'mthf', 'f10', 'dhf']) add(`fol_loss_${f}`, `Folate loss (bile, urine, catabolism) of ${f}`, [s(f)], [], { law: 'firstOrder', params: { k: 'k_fol_loss' } })

  // --- glycine, serine ---
  add('gly_up', 'Hepatic glycine uptake from plasma pool', [s('gly_p', rg)], [s('gly')], { law: 'michaelisMenten', params: { Vmax: 'vmax_gly_up', Km: 'km_gly_up' } }, { target: 'gly_up', unit: 'uM/h' })
  add('gly_efl', 'Hepatic glycine efflux to plasma pool', [s('gly')], [s('gly_p', rg)], { law: 'firstOrder', params: { k: 'k_gly_efl' } })
  add('gly_use', 'Glycine use for glutathione, haem, bile/hippurate conjugation (lumped)', [s('gly')], [], { law: 'firstOrder', params: { k: 'k_gly_use' } })
  add('gly_p_in', 'Endogenous/dietary glycine appearance in plasma pool', [], [s('gly_p')], { law: 'constantInput', params: { rate: 'rate_gly_p_in' } }, { target: 'gly_p_in', unit: 'uM/h' })
  add('gly_p_out', 'Glycine clearance outside the liver (muscle, kidney, ...)', [s('gly_p')], [], { law: 'firstOrder', params: { k: 'k_gly_per' } })
  add('gly_abs', 'Glycine absorption (gut depot -> plasma pool)', [s('gly_gut')], [s('gly_p', rg)], { law: 'firstOrder', params: { k: 'ka_gly' } })
  add('gly_diet', 'Chronic extra glycine intake (control)', [], [s('gly_gut')], { law: 'constantInput', params: { rate: 'rate_gly_diet' } })
  add('ser_in', 'Serine synthesis and uptake', [], [s('ser')], { law: 'constantInput', params: { rate: 'rate_ser_in' } }, { target: 'ser_in', unit: 'uM/h' })
  add('ser_out', 'Serine use for protein and lipids (lumped)', [s('ser')], [], { law: 'firstOrder', params: { k: 'k_ser_use' } })

  // --- choline, betaine, DMG, sarcosine ---
  add('cho_in', 'Dietary choline to liver (baseline)', [], [s('cho')], { law: 'constantInput', params: { rate: 'rate_cho_in' } }, { target: 'cho_in', unit: 'uM/h' })
  add('cho_diet', 'Chronic extra choline intake (control; proportional liver share of the flux)', [], [s('cho')], { law: 'constantInput', params: { rate: 'rate_cho_diet' } })
  add('cho_abs', 'Acute choline dose absorption (gut depot -> liver, first pass)', [s('cho_gut')], [s('cho', st.dose_cho)], { law: 'firstOrder', params: { k: 'ka_cho' } })
  add('chdh', 'Choline dehydrogenase + betaine aldehyde dehydrogenase (lumped)', [s('cho')], [s('bet')], { law: 'michaelisMenten', params: { Vmax: 'vmax_chdh', Km: 'km_chdh_cho' } }, { ont: 'reaction:chdh-choline-oxidation', enz: 'enzyme:chdh', target: 'chdh', unit: 'uM/h' })
  add('chok', 'Kennedy pathway: choline -> PC (choline kinase, CCT, CPT lumped)', [s('cho')], [s('pc')], { law: 'michaelisMenten', params: { Vmax: 'vmax_chok', Km: 'km_chok_cho' } }, { ont: 'reaction:choline-kinase-phosphocholine', enz: 'enzyme:choline-kinase', target: 'chok', unit: 'uM/h' })
  add('pld', 'PC turnover to free choline (PLD, lumped)', [s('pc')], [s('cho')], { law: 'firstOrder', params: { k: 'k_pld' } }, { ont: 'reaction:pld-phosphatidylcholine-hydrolysis', enz: 'enzyme:pld', target: 'pld', unit: '1/h' })
  add('pc_out', 'PC secretion (VLDL, bile) and other loss', [s('pc')], [], { law: 'firstOrder', params: { k: 'k_pc_out' } }, { target: 'pc_out', unit: '1/h' })
  add('cho_out', 'Choline efflux, gut TMA and acetylcholine (lumped)', [s('cho')], [], { law: 'firstOrder', params: { k: 'k_cho_out' } }, { target: 'cho_out', unit: '1/h' })
  add('pe_in', 'PE supply (CDP-ethanolamine pathway, lumped)', [], [s('pe')], { law: 'constantInput', params: { rate: 'rate_pe_in' } }, { target: 'pe_in', unit: 'uM/h' })
  add('pe_out', 'PE use for other lipids (lumped)', [s('pe')], [], { law: 'firstOrder', params: { k: 'k_pe_out' } })
  add('bet_up', 'Hepatic betaine uptake (BGT1-like, trans-inhibited)', [s('bet_p', rb)], [s('bet')], { law: 'michaelisMenten', params: { Vmax: 'vmax_bet_up', Km: 'km_bet_up' }, modifiers: [INH('bet', 'ki_bet_trans', 0, 2)] }, { target: 'bet_up', unit: 'uM/h' })
  add('bet_efl', 'Hepatic betaine efflux to plasma pool', [s('bet')], [s('bet_p', rb)], { law: 'firstOrder', params: { k: 'k_bet_efl' } })
  add('bet_p_in', 'Dietary/endogenous betaine appearance in plasma', [], [s('bet_p')], { law: 'constantInput', params: { rate: 'rate_bet_p_in' } }, { target: 'bet_p_in', unit: 'uM/h' })
  add('bet_p_out', 'Betaine renal/other clearance from plasma pool', [s('bet_p')], [], { law: 'firstOrder', params: { k: 'k_bet_ren' } })
  add('bet_abs', 'Betaine absorption (gut depot -> plasma pool)', [s('bet_gut')], [s('bet_p', rb)], { law: 'firstOrder', params: { k: 'ka_bet' } })
  add('bet_diet', 'Chronic extra betaine intake (control)', [], [s('bet_gut')], { law: 'constantInput', params: { rate: 'rate_bet_diet' } })
  add('dmgdh', 'Dimethylglycine dehydrogenase: DMG + THF -> sarcosine + CH2-THF', [s('dmg'), s('thf')], [s('sar'), s('ch2thf')], { law: 'michaelisMenten', params: { Vmax: 'vmax_dmgdh', Km: 'km_dmgdh_dmg' }, species: { S: 'dmg' }, modifiers: [SAT('thf', 'km_dmgdh_thf')] }, { ont: 'reaction:dmgdh-dimethylglycine-demethylation', enz: 'enzyme:dmgdh', target: 'dmgdh', unit: 'uM/h (scaled)' })
  add('sardh', 'Sarcosine dehydrogenase: sarcosine + THF -> glycine + CH2-THF', [s('sar'), s('thf')], [s('gly'), s('ch2thf')], { law: 'michaelisMenten', params: { Vmax: 'vmax_sardh', Km: 'km_sardh_sar' }, species: { S: 'sar' }, modifiers: [SAT('thf', 'km_sardh_thf')] }, { ont: 'reaction:sardh-sarcosine-demethylation', enz: 'enzyme:sardh', target: 'sardh', unit: 'uM/h (scaled)' })
  add('dmg_out', 'DMG loss (urine, lumped)', [s('dmg')], [], { law: 'firstOrder', params: { k: 'k_dmg_out' } })
  add('sar_out', 'Sarcosine loss (urine, lumped)', [s('sar')], [], { law: 'firstOrder', params: { k: 'k_sar_out' } })

  // --- niacin / nicotinamide ---
  add('nic_diet', 'Chronic niacin intake converted to nicotinamide (control; proportional liver share of the flux)', [], [s('nam')], { law: 'constantInput', params: { rate: 'rate_nic_diet' } })
  add('nic_abs', 'Acute niacin dose absorption and conversion to nicotinamide (gut depot -> liver)', [s('nic_gut')], [s('nam', st.dose_nic)], { law: 'firstOrder', params: { k: 'ka_nic' } })
  add('nam_in', 'Nicotinamide supply from NAD turnover (baseline)', [], [s('nam')], { law: 'constantInput', params: { rate: 'rate_nam_in' } }, { target: 'nam_in', unit: 'uM/h' })
  add('nam_salv', 'Nicotinamide salvage to NAD+ (NAMPT, saturable)', [s('nam')], [], { law: 'michaelisMenten', params: { Vmax: 'vmax_nam_salv', Km: 'km_nam_salv' } })
  add('mna_out', 'MNA excretion', [s('mna')], [], { law: 'firstOrder', params: { k: 'k_mna_out' } }, { target: 'mna_out', unit: '1/h' })
  return rx
}

const SCALE_NAMES = ['Vmax', 'k', 'rate']
const CONF = { h: 'high', m: 'medium', l: 'low', a: 'assumed' }

/** Controls: what the UI sliders change (dose gains convert natural units to model inputs). */
function controlsFor(st) {
  const mul = (id, label, min, max, unit, target, extra = {}) => ({ id, label, min, max, default: 1, unit, effects: [{ target, id: extra.on, op: 'multiply' }] })
  return [
    { id: 'glycineLoad', label: 'Dietary glycine load (extra g/day, continuous)', min: 0, max: 30, default: 0, unit: 'g/day', effects: [{ target: 'param', id: 'rate_gly_diet', op: 'add', gain: 555.05 }] },
    { id: 'cholineIntake', label: 'Extra choline intake (mg choline/day, continuous)', min: 0, max: 4000, default: 0, unit: 'mg/day', effects: [{ target: 'param', id: 'rate_cho_diet', op: 'add', gain: st.loadScale / 104.17 }] }, // (mg/day) / 104.17 mg/mmol x loadScale uM/h per mmol/day
    { id: 'betaineIntake', label: 'Betaine intake (extra g/day, continuous)', min: 0, max: 12, default: 0, unit: 'g/day', effects: [{ target: 'param', id: 'rate_bet_diet', op: 'add', gain: 355.7 }] },
    { id: 'niacinDose', label: 'Niacin dose (g/day, continuous; NNMT load)', min: 0, max: 4, default: 0, unit: 'g/day', effects: [{ target: 'param', id: 'rate_nic_diet', op: 'add', gain: 8.123 * st.loadScale }] }, // g/day x 8.123 mmol/g x loadScale
    { id: 'folateSupply', label: 'Folate (5-MTHF) supply', min: 0, max: 4, default: 1, unit: 'x baseline', effects: [{ target: 'param', id: 'rate_fol_in', op: 'multiply' }] },
    { id: 'methionineIntake', label: 'Dietary methionine intake', min: 0, max: 2.5, default: 1, unit: 'x baseline', effects: [{ target: 'param', id: 'rate_met_in', op: 'multiply' }] },
    { id: 'b12Activity', label: 'B12 activity (methionine synthase multiplier)', min: 0, max: 1.5, default: 1, unit: 'x', effects: [{ target: 'reaction', id: 'mtr', op: 'multiply' }, { target: 'reaction', id: 'hcy_p_ms', op: 'multiply' }] },
    { id: 'b6Status', label: 'B6 status (relative cellular PLP; scales CBS, CTH, SHMT, GCS)', min: 0.05, max: 3, default: 1, unit: 'x baseline PLP', effects: [{ target: 'species', id: 'plp', op: 'set' }] },
    mul('mthfrActivity', 'MTHFR activity (variant: 677TT ~ 0.3-0.5)', 0.1, 1.5, 'x', 'reaction', { on: 'mthfr' }),
    mul('gnmtActivity', 'GNMT activity', 0, 3, 'x', 'reaction', { on: 'gnmt' }),
    mul('bhmtActivity', 'BHMT activity', 0, 3, 'x', 'reaction', { on: 'bhmt' }),
    mul('pemtActivity', 'PEMT activity', 0, 4, 'x', 'reaction', { on: 'pemt' })
  ]
}

const OBS = [
  // [id, label, unit, expr, group]
  ['samSahRatio', 'SAM:SAH ratio (methylation index)', 'ratio', { ratio: ['sam', 'sah'] }, 'status'],
  ['methylationIndex', 'Methylation index (= SAM:SAH)', 'ratio', { ref: 'samSahRatio' }, 'status'],
  ['methylationPotential', 'Methylation potential (SAM - SAH)', 'uM', { diff: ['sam', 'sah'] }, 'status'],
  ['tHcy', 'Plasma total homocysteine', 'uM', { ref: 'hcy_p' }, 'status'],
  ['samUsePemt', 'PEMT SAM use (3 per PC)', 'uM/h', { sum: ['pemt', 'pemt', 'pemt'] }, 'flux'],
  ['samUseTotal', 'Total methyl (SAM) flux', 'uM/h', { sum: ['gnmt', 'samUsePemt', 'gamt', 'dnmt', 'mt_other', 'nnmt'] }, 'flux'],
  ['gnmtShare', 'GNMT share of SAM use', 'fraction', { ratio: ['gnmt', 'samUseTotal'] }, 'flux'],
  ['pemtShare', 'PEMT share of SAM use', 'fraction', { ratio: ['samUsePemt', 'samUseTotal'] }, 'flux'],
  ['gamtShare', 'GAMT (creatine) share of SAM use', 'fraction', { ratio: ['gamt', 'samUseTotal'] }, 'flux'],
  ['dnmtShare', 'DNMT share of SAM use', 'fraction', { ratio: ['dnmt', 'samUseTotal'] }, 'flux'],
  ['nnmtShare', 'NNMT share of SAM use', 'fraction', { ratio: ['nnmt', 'samUseTotal'] }, 'flux'],
  ['ahcyNet', 'Net SAH hydrolysis', 'uM/h', { diff: ['ahcy_f', 'ahcy_r'] }, 'flux'],
  ['remethylation', 'Homocysteine remethylation (MTR + BHMT)', 'uM/h', { sum: ['mtr', 'bhmt'] }, 'flux'],
  ['transsulfuration', 'Transsulfuration flux (CBS)', 'uM/h', { ref: 'cbs' }, 'flux'],
  ['transsulfurationFraction', 'Transsulfuration share of homocysteine disposal', 'fraction', { ratio: ['cbs', 'ahcyNet'] }, 'flux'],
  ['remethylationFraction', 'Remethylation share of homocysteine disposal', 'fraction', { ratio: ['remethylation', 'ahcyNet'] }, 'flux'],
  ['bhmtShareOfRemethylation', 'BHMT share of remethylation', 'fraction', { ratio: ['bhmt', 'remethylation'] }, 'flux'],
  ['folateTotal', 'Total folate pool', 'uM', { sum: ['thf', 'ch2thf', 'mthf', 'f10', 'dhf'] }, 'pool'],
  ['mthfFraction', '5-MTHF fraction of folate', 'fraction', { ratio: ['mthf', 'folateTotal'] }, 'pool'],
  ['glycineLiver', 'Hepatic glycine', 'uM', { ref: 'gly' }, 'pool'],
  ['betaineLiver', 'Hepatic betaine', 'uM', { ref: 'bet' }, 'pool'],
  ['sarcosineLiver', 'Hepatic sarcosine', 'uM', { ref: 'sar' }, 'pool'],
  ['cystathionineLiver', 'Hepatic cystathionine', 'uM', { ref: 'cysta' }, 'pool'],
  ['mnaLiver', 'N1-methylnicotinamide (liver)', 'uM', { ref: 'mna' }, 'pool']
]

/**
 * Build the model object. options: { params: {id: value} constants to override, ref: {species: uM} reference state
 * override, struct: {loadScale, vd_gly, vd_bet, rho_hcy}, events }. Returns a fresh plain model object.
 */
export function buildMethylationModel(options = {}) {
  const st = { ...STRUCT, ...(options.struct ?? {}), plan: options.plan }
  const ref = { ...REF, ...(options.ref ?? {}) }
  const kin = {}
  const parameters = []
  for (const [id, value, low, high, unit, conf] of KIN) {
    const v = options.params && options.params[id] !== undefined ? options.params[id] : value
    kin[id] = v
    parameters.push({ id, value: v, low: Math.min(low, v), high: Math.max(high, v), unit, confidence: CONF[conf] })
  }
  const T = fluxPlan(ref, kin, st)
  const reactions = assemble(st)
  const scaleIds = []
  const model = {
    id: 'methylation-liver', name: 'Integrated hepatic methylation model',
    label: MODEL_LABEL, time: { unit: 'h', duration: 72 },
    species: SPECIES.map(([id, name, unit, ontologyId, kind]) => ({ id, name, initial: ref[id], unit, compartment: kind === 'depot' ? 'gut' : (id === 'gly_p' || id === 'bet_p' || id === 'hcy_p' ? 'plasma' : 'liver'), ontologyId, ...(kind === 'fixed' ? { fixed: true } : {}) })),
    parameters,
    reactions: [],
    controls: controlsFor(st),
    events: [],
    observables: OBS.map(([id, label, unit, expr]) => ({ id, label, unit, expr }))
  }
  // zero-valued extra inputs and scale parameters
  const addParam = (id, value, unit, extra = {}) => {
    if (!parameters.some((p) => p.id === id)) parameters.push({ id, value, low: value, high: value, unit, confidence: 'assumed', ...extra })
  }
  for (const [id, value, unit] of [['rate_gly_diet', 0, 'umol/h'], ['rate_cho_diet', 0, 'umol/h'], ['rate_bet_diet', 0, 'umol/h'], ['rate_nic_diet', 0, 'umol/h']]) addParam(id, value, unit)
  for (const rx of reactions) {
    const rate = rx.rate
    const scaleName = SCALE_NAMES.find((n) => typeof rate.params[n] === 'string' && !parameters.some((p) => p.id === rate.params[n]))
    // reactions whose k/rate/Vmax parameter already exists as a literature constant keep it; others are calibrated
    const pid = scaleName ? rate.params[scaleName] : null
    if (pid) { scaleIds.push({ pid, rx, unit: rx.unit ?? (scaleName === 'k' ? '1/h' : 'uM/h') }); parameters.push({ id: pid, value: 1, low: 1, high: 1, unit: rx.unit ?? '', confidence: 'medium' }) }
    model.reactions.push({
      id: rx.id, name: rx.name, ...(rx.ont ? { ontologyId: rx.ont } : {}), ...(rx.enz ? { enzymeId: rx.enz } : {}),
      substrates: rx.subs, products: rx.prods, rate: { ...rate, refs: [] }
    })
  }
  // calibrate: scale = target flux / flux at unit scale, evaluated at the reference state
  const draft = compileModel(model)
  const sys = draft.bind()
  const f = sys.fluxes(0, Float64Array.from(draft.y0))
  for (const { pid, rx } of scaleIds) {
    const target = T[rx.target ?? rx.id]
    const unit = f[draft.reactionIndex.get(rx.id)]
    const p = parameters.find((q) => q.id === pid)
    if (target === undefined) throw new Error(`methylation: no flux target for ${rx.id}`)
    if (!(unit > 0)) throw new Error(`methylation: reaction ${rx.id} has zero flux at the reference state`)
    p.value = target / unit; p.low = p.value; p.high = p.value
    p.source = 'calibrated'; p.unit = (rx.unit ?? p.unit)
  }
  model.reference = { fluxes: T, state: ref, satf: SATF, struct: st }
  return model
}

// ---- structural variants (contested constants), selectable per scenario -------------------------------------
export const variants = {
  gnmtGlycineKm: {
    label: 'GNMT glycine Km (contested 130 uM vs mM)',
    default: 'reed130',
    options: {
      reed130: { label: 'Reed: Km(glycine) 130 uM (rat liver GNMT, Ogawa & Fujioka 1982)', params: { km_gnmt_gly: 130 } },
      luka2000: { label: 'Luka-style: Km(glycine) 2 mM (review range 2-20 mM, Luka 2009)', params: { km_gnmt_gly: 2000 } }
    }
  },
  bhmtBetaineKm: {
    label: 'BHMT betaine Km (contested 100 uM vs 2.2 mM)',
    default: 'human2200',
    options: {
      reed100: { label: 'Reed: Km(betaine) 100 uM (saturated at liver betaine ~1 mM; Vmax recalibrated)', params: { km_bhmt_bet: 100 } },
      human2200: { label: 'Human recombinant BHMT: Km(betaine) 2.2 mM (Millian 1998; Vmax recalibrated)', params: { km_bhmt_bet: 2200 } }
    }
  },
  samConsumerBudget: {
    label: 'Share of SAM use by GNMT (Reed 2015 liver model vs parameters-b2 whole-body budget)',
    default: 'reed2015',
    options: {
      reed2015: { label: 'Reed 2015: GNMT 44%, PEMT 27%, GAMT 25%, DNMT 2%', plan: {} },
      b2budget: { label: 'B2 budget (Mudd 2007, Stead 2006, Brosnan 2011): GNMT ~15%, creatine ~36%, PEMT ~19%', plan: { gnmt: 14.5, pemtSam: 18.75, gamt: 36.5, mto: 9.5, dnmt: 2.05 } }
    }
  }
}

/** Build options for a variant selection { variantKey: optionKey }; unspecified keys use the default option. */
export function variantOptions(selection = {}) {
  const out = { params: {}, plan: {} }
  for (const [key, v] of Object.entries(variants)) {
    const opt = v.options[selection[key] ?? v.default]
    if (!opt) throw new Error(`methylation: unknown option "${selection[key]}" for variant ${key}`)
    Object.assign(out.params, opt.params ?? {}); Object.assign(out.plan, opt.plan ?? {})
  }
  return out
}

const cache = new Map()
/**
 * Model for a variant selection (default: Reed GNMT Km, human BHMT Km, Reed consumer budget); cached per selection.
 * getModel({ gnmtGlycineKm: 'luka2000' }) -> model. Pass `options` (params/ref/struct/plan) to bypass the cache.
 */
export function getModel(selection = {}, options = null) {
  if (options) {
    const v = variantOptions(selection)
    return buildMethylationModel({ ...options, params: { ...v.params, ...(options.params ?? {}) }, plan: { ...v.plan, ...(options.plan ?? {}) } })
  }
  const key = Object.keys(variants).map((k) => selection[k] ?? variants[k].default).join('|')
  if (!cache.has(key)) cache.set(key, buildMethylationModel(variantOptions(selection)))
  return cache.get(key)
}
export const methylationModel = getModel()
export default methylationModel
export { KIN, SPECIES, OBS, fluxPlan }
