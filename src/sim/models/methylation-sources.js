// Lazy provenance for the methylation model's parameters (inspector panel). Kept apart from the model so that the
// large literature tables (parameters-b1.js, parameters-b2.js; ~330 kB) are only fetched when a user opens the panel.
//
//   const sources = await getSources()          // loads the literature tables once
//   sources.get('km_gnmt_gly')                   // -> { id, value, low, high, unit, confidence, origin, sourceArticle, locator, ... }
//   await parameterSource('vmax_gnmt')           // convenience: default model
//
// Origins: 'b1:<id>' / 'b2:<id>' = value taken from parameters-b1 (Reed 2015 base set) / parameters-b2 (see docs/SIM_PARAMETERS_B*.md);
// 'fit:' = shape-matched approximation of a published law; 'as:' = project assumption (stated); calibrated parameters
// (maximal rates, first-order constants of boundary reactions) carry the target flux they were solved for.

import { methylationModel } from './methylation.js'

/** paramId -> [origin, ...] with an optional trailing note. */
const ORIGIN = {
  km_mat1_met: ['b1:MAT1A.Km_Met'], ki_mat1_sam: ['fit:Reed 2015 SAM-inhibition factor 0.23 + 0.8 exp(-0.0026 SAM) as residual + (1-residual)/(1+(SAM/Ki)^n); max deviation 3% over 0-600 uM', 'b1:MAT1A.inh_k'],
  n_mat1_sam: ['fit:see ki_mat1_sam'], resid_mat1: ['b1:MAT1A.inh_floor'],
  s05_mat3_met: ['b1:MAT3.K_n', 'fit:S0.5 = K_n^(1/n) = 300^(1/1.21) = 111.4 uM; enzymology S0.5 215 uM (b1:MAT3.S0.5_Met@enzymology)'], n_mat3_met: ['b1:MAT3.n'],
  ka_mat3_sam: ['b1:MAT3.act_Ka'], fold_mat3_sam: ['b1:MAT3.act_amp', 'fit:fold = 1 + amplitude 7.2'],
  ks_gnmt_sam: ['b1:GNMT.K_SAM', 'b2:gnmt-km-sam'], n_gnmt_sam: ['b1:GNMT.n', 'b2:gnmt-hill-sam'],
  ki_gnmt_sah: ['b1:GNMT.Ki_SAH', 'fit:apparent SAH constant = Ki/n so that (1+SAH/Ki)^-n ~ 1/(1+n SAH/Ki) at small SAH; Reed 35/2 = 17.5 uM; Luka 95/1.1'],
  km_gnmt_gly: ['b1:GNMT.Km_gly', 'b2:gnmt-km-gly', 'b1:GNMT.Km_gly@luka2009'],
  ki_gnmt_mthf1: ['fit:two-step 5-MTHF binding of Reed 2015 (k1 50, k2 1, k3 1, k4 1.6; b1:GNMT.k1) approximated by two inhibition factors; first step (half-active GF state) Ki 0.04 uM', 'b1:GNMT.k1'],
  ki_gnmt_mthf2: ['b2:gnmt-ic50-5mthf-pentaglu', 'b1:GNMT.IC50_5mTHFGlu5@native', 'fit:second step of the Reed binding model gives Ki ~1.5 uM; recombinant enzyme 590 uM (b1:GNMT.IC50_5mTHFGlu5@recombinant) sets the upper bound'],
  resid_gnmt_mthf1: ['b1:GNMT.act_once_bound'],
  km_pemt_sam: ['b1:PEMT.Km_SAM', 'b2:pemt-km-sam'], ki_pemt_sah: ['b1:PEMT.Ki_SAH', 'b2:pemt-ki-sah'], km_pemt_pe: ['b1:PEMT.Km_PE'],
  km_gamt_sam: ['b1:GAMT.Km_SAM', 'b2:gamt-km-sam'], ki_gamt_sah: ['b1:GAMT.Ki_SAH'],
  km_dnmt_sam: ['b1:DNMT.Km_SAM', 'b2:dnmt1-km-sam'], ki_dnmt_sah: ['b1:DNMT.Ki_SAH', 'as:range x/÷10 around the single measurement'],
  km_mto_sam: ['b1:AS3MT.Km_SAM', 'b2:comt-ks-sam'], ki_mto_sah: ['b1:AS3MT.Ki_SAH'],
  km_nnmt_sam: ['b2:nnmt-km-sam'], km_nnmt_nam: ['b2:nnmt-km-nam'], ic50_nnmt_mna: ['b2:nnmt-ic50-mnam'],
  km_ahcy_sah: ['b1:AHCY.Km_SAH'], km_ahcy_hcy: ['b1:AHCY.Km_Hcy'],
  km_mtr_mthf: ['b1:MTR.Km_5mTHF'], km_mtr_hcy: ['b1:MTR.Km_Hcy'],
  km_bhmt_bet: ['b2:bhmt-km-betaine', 'b1:BHMT.Km_Bet', 'b1:BHMT.Km_Bet@pig'], km_bhmt_hcy: ['b1:BHMT.Km_Hcy', 'b2:bhmt-km-hcy'],
  ki_bhmt_dmg: ['b2:bhmt-ki-dmg', 'as:geometric middle of the stated 10 uM - 1 mM range (second-hand)'], ki_bhmt_samsah: ['b1:BHMT.inh_k', 'fit:exp(-0.0021 (SAM+SAH)) approximated as 1/(1+X/Ki) per metabolite, Ki 365 uM'],
  km_cbs_hcy: ['b1:CBS.Km_Hcy'], km_cbs_ser: ['b1:CBS.Km_Ser'], ka_cbs_sam: ['b1:CBS.act_K', 'b1:CBS.Kact_SAM@enzymology'],
  fold_cbs_sam: ['as:SAM activates CBS ~2-5 fold (Reed 2015 uses a zero floor); floor kept non-zero so that CBS stays finite at low SAM'], kplp_cbs: ['b2:cbs-plp-keff-fraction'],
  km_cth_cysta: ['b1:CTH.Km_Cystathionine'], kplp_cth: ['b2:plp-kd-cystathionase', 'fit:Kd ratio CTH/CBS = 2 (1.4/0.7 uM) applied to the effective half-saturation 0.43'],
  km_mthfr_ch2: ['b1:MTHFR.Km_CH2THF'], ki_mthfr_sam: ['b1:MTHFR.SAM_Ki_eff', 'fit:SAM - SAH replaced by SAM'], resid_mthfr: ['b1:MTHFR.residual@korendyaseva2008'],
  km_shmt_thf: ['b1:SHMT.Km_THF'], km_shmt_ser: ['b1:SHMT.Km_Ser'], km_shmt_gly: ['b1:SHMT.Km_Gly'], km_shmt_ch2: ['b1:SHMT.Km_CH2THF'], kplp_shmt: ['b2:shmt1-plp-keff-fraction'],
  km_gcs_gly: ['b2:gcs-km-glycine'], km_gcs_thf: ['as:no source for the THF Km of the glycine cleavage system; 100 uM (10-1000)'], kplp_gcs: ['as:same PLP sensitivity as SHMT'],
  km_mtd_ch2: ['b1:MTD.Km_CH2THF'], km_mtd_f10: ['b1:MTCH.Km_10fTHF'],
  km_fts_thf: ['b1:FTS.Km_THF'], km_fts_formate: ['b1:FTS.Km_formate'], km_ftd_f10: ['b1:FTD.Km_10fTHF'], km_pur_f10: ['b1:PGT.Km_10fTHF'],
  km_ts_ch2: ['b1:TS.Km_CH2THF'], km_dhfr_dhf: ['b1:DHFR.Km_DHF'],
  k_fol_loss: ['as:total folate turnover ~0.5-0.7 %/day-equivalent (half-life ~ 1-2 months); applied to every folate form'],
  km_chdh_cho: ['b2:chdh-km-choline'], km_chok_cho: ['b2:chka-km-choline'],
  km_dmgdh_dmg: ['b2:dmgdh-km-dmg'], km_dmgdh_thf: ['as:THF assumed non-limiting (Km 10 uM)'], km_sardh_sar: ['b2:sardh-km-sarcosine'], km_sardh_thf: ['as:THF assumed non-limiting (Km 10 uM)'],
  km_gly_up: ['as:hepatic glycine transporter Km; only the net uptake is constrained (flux balance)'], k_gly_efl: ['as:efflux/uptake split is unconstrained'], k_gly_use: ['b2:glycine-glutathione-net-use-g-day', 'as:lumped glutathione + haem + bile + hippurate use ~ 0.06 /h of the hepatic pool'],
  km_bet_up: ['as:BGT1-like uptake; Km ~0.5 mM (assumed)'], ki_bet_trans: ['as:osmolyte-regulated uptake: trans-inhibition by intracellular betaine bounds the liver pool at a few mM'], k_bet_efl: ['as:efflux constant, unconstrained'],
  k_gly_per: ['b2:flux-glycine-whole-body-fed', 'as:first-order peripheral clearance 0.9 /h so that the apparent excess half-life is ~45 min (Gannon 2002, secondhand)'], k_bet_ren: ['b2:betaine-ke'],
  ka_gly: ['as:fitted to tmax 40 min (Gannon 2002, secondhand)'], ka_bet: ['b2:betaine-ka', 'as:5.2 /h reproduces tmax 0.9 h in a one-compartment model'], ka_cho: ['b2:modinger-2019', 'as:choline tmax 2.7-4.2 h'], ka_met: ['as:methionine absorption ~1 h'], ka_nic: ['as:immediate-release niacin tmax ~1 h'],
  rate_gly_diet: ['as:input rate of the glycineLoad control (umol/h into the gut depot); zero at baseline'], rate_cho_diet: ['as:input rate of the cholineIntake control (uM/h, proportional liver share); zero at baseline'], rate_bet_diet: ['as:input rate of the betaineIntake control (umol/h into the gut depot); zero at baseline'], rate_nic_diet: ['as:input rate of the niacinDose control (uM/h, proportional liver share); zero at baseline'],
  k_ser_use: ['as:serine use for protein/lipids, balances CBS and SHMT'], k_pe_out: ['as:PE pool turnover ~ 2 weeks'],
  k_mna_out: ['as:fast renal secretion of N1-methylnicotinamide'], vmax_nam_salv: ['as:NAMPT salvage capacity, sized so that niacin 2 g/day leaves ~54-64% to NNMT'], km_nam_salv: ['as:NAMPT Km ~1 uM'],
  k_dmg_out: ['as:urinary DMG loss, ~2% of BHMT flux'], k_sar_out: ['as:urinary sarcosine loss, ~2% of GNMT flux'], k_hcy_p_out: ['as:kidney/other clearance of plasma tHcy = 25% of plasma removal'], km_ems_mthf: ['b1:MTR.Km_5mTHF']
}

/** Reaction -> note on how its maximal rate / constant was calibrated (target flux comes from model.reference.fluxes). */
const TARGET_NOTE = 'calibrated: solved so that the reference state is an exact steady state with the target flux'

const parseOrigin = (o) => { const i = o.indexOf(':'); return { kind: o.slice(0, i), ref: o.slice(i + 1) } }

let loaded = null
/** Load the literature tables once. Returns { get(paramId, model?), all(model?), tables }. */
export async function getSources() {
  if (loaded) return loaded
  loaded = (async () => {
    const [b1, b2] = await Promise.all([import('../data/parameters-b1.js'), import('../data/parameters-b2.js')])
    const tables = { b1: new Map(b1.default.parameters.map((p) => [p.id, p])), b2: new Map(b2.default.parameters.map((p) => [p.id, p])) }
    const describe = (model, id) => {
      const p = model.parameters.find((q) => q.id === id)
      if (!p) return null
      const out = { id, value: p.value, low: p.low, high: p.high, unit: p.unit, confidence: p.confidence, origin: [], sourceArticle: null, locator: null, evidence: null, extraSources: [], note: '' }
      if (p.source === 'calibrated') {
        const cal = model.reference.calibration[id]
        out.origin.push('calibrated'); out.note = `${TARGET_NOTE}: reaction ${cal.reaction}, target flux ${cal.targetFlux.toPrecision(4)} uM/h`
        out.evidence = 'calibrated'; out.sourceArticle = 'article:reed-2015-competing-methyltransferases'; out.locator = 'Table 1 steady-state fluxes; flux partition in docs/METHYLATION_MODEL.md'
        return out
      }
      const entries = ORIGIN[id] ?? []
      for (const e of entries) {
        const { kind, ref } = parseOrigin(e)
        if (kind === 'b1' || kind === 'b2') {
          const rec = tables[kind].get(ref)
          out.origin.push(e)
          if (rec) {
            if (!out.sourceArticle) { out.sourceArticle = rec.source; out.locator = rec.locator; out.evidence = rec.confidence; if (rec.note) out.note = rec.note } else out.extraSources.push(rec.source)
          } else out.note += ` [${e} not found]`
        } else { out.origin.push(`${kind}`); out.note = (out.note ? `${out.note} ` : '') + ref; if (!out.evidence) out.evidence = kind === 'fit' ? 'fitted-shape' : 'assumed' }
      }
      if (!entries.length) { out.evidence = 'assumed'; out.note = 'boundary or structural constant without a source' }
      return out
    }
    return { tables, get: (id, model = methylationModel) => describe(model, id), all: (model = methylationModel) => model.parameters.map((p) => describe(model, p.id)) }
  })()
  return loaded
}

/** Provenance record for one parameter of the default model (or of `model`). */
export async function parameterSource(id, model = methylationModel) {
  return (await getSources()).get(id, model)
}

export { ORIGIN }
