// Literature-sourced parameters for the second half of the methylation model (agent B2):
// SAM consumers (GNMT, PEMT, GAMT/AGAT, NNMT, COMT, HNMT, DNMT), choline and betaine metabolism, glycine and serine,
// vitamin B6 / PLP, histamine (HNMT/DAO), bile acid conjugation, and gastric acid / bicarbonate / CO2.
//
// Format (assembled with the B1 methionine-cycle set; see docs/SIM_PARAMETERS_B2.md):
//   parameters[]   { id, value, low, high, unit, tissue, species, source, extraSources?, locator, confidence, note }
//   species[]      { id, name, initial, unit, low, high, compartment, species, source, ontologyId, note }
//   reactionLaws[] { id, ontologyId, enzymeId, substrates, products, law, rateExpression, paramIds, modifiers, refs, caveats, fluxTarget?, ontologyGap? }
//   fluxBudgets[]  { id, title, unit, items:[{label,value,low,high,source,note?}], totals?, scenarios?, contested? }
//   validationTargets[], models{}, references{}
// source is 'article:<id>' (an entity in src/knowledge/data), 'calc:<name>' (arithmetic on cited inputs) or
// 'assumption:<name>' (no literature value; wide range). confidence: measured | fitted-in-model | estimated | assumed.
// Concentrations are uM, times h, whole-body fluxes mmol/day for a 70 kg adult unless the unit field says otherwise.
// Values are for an illustrative educational model. They are not measurements of any person and not medical advice.

export default {
  meta: {
    owner: 'B2',
    scope: 'choline, betaine, PEMT, glycine and serine, GCS, creatine, NNMT and niacin, B6, histamine, bile acid conjugation, gastric acid',
    units: { concentration: 'uM', time: 'h', wholeBodyFlux: 'mmol/day (70 kg adult)', glycineBudgets: 'g/day', rateConstants: '1/h' },
    species: 'human unless a parameter says otherwise; rat/mouse values are labelled in the species field',
    confidenceScale: ['measured', 'fitted-in-model', 'estimated', 'assumed'],
    howToUseRanges: 'low and high are the plausible literature range, not a confidence interval. Where a single determination exists the range is either degenerate (low = value = high) or x/÷2 and the note says so. Sample contested kinetic constants on a log scale.',
    ontologyGaps: ['NNMT reaction', 'DNMT / DNA methylation reaction', 'glycine N-acyltransferase (hippurate)', 'phospholipase D (PC to choline)', 'creatine to creatinine', 'pancreatic/duodenal bicarbonate secretion', 'CTP:phosphocholine cytidylyltransferase kinetics']
  },

  parameters: [
  // ---------------------------------------------------------------------------
  // A. Reference constants (assumptions the assembler must harmonise with B1)
  // ---------------------------------------------------------------------------
  { id: 'body-mass-kg', value: 70, low: 55, high: 90, unit: 'kg', tissue: 'whole-body', species: 'human', source: 'assumption:reference-adult-70kg', locator: 'convention', confidence: 'assumed', note: 'Reference adult used by the whole-body flux papers cited here (Meléndez-Hevia 2009, Brosnan 2011, Storch 1988). Every mmol/day figure in this file is for 70 kg; per-kg values are scaled by this.' },
  { id: 'hepatic-cytosolic-volume-L', value: 1.0, low: 0.6, high: 1.6, unit: 'L', tissue: 'liver', species: 'human', source: 'assumption:harmonise-with-b1', locator: 'no B2 literature source', confidence: 'assumed', note: 'NOT SOURCED by B2. Needed only to convert whole-body mmol/day targets into umol/L/h inside a one-liver-compartment model (1 mmol/day = 41.67 umol/h). Take B1 compartment volume if B1 supplies one.' },
  { id: 'mmol-per-day-to-umol-per-h', value: 41.6667, low: 41.6667, high: 41.6667, unit: 'umol/h per mmol/day', tissue: 'whole-body', species: 'human', source: 'calc:unit-conversion', locator: '1000/24', confidence: 'assumed', note: 'Pure unit conversion (exact), listed so scripts do not retype it.' },

  // ---------------------------------------------------------------------------
  // B. SAM consumers: whole-body fluxes (mmol/day, 70 kg adult)
  // ---------------------------------------------------------------------------
  { id: 'flux-transmethylation-total', value: 20.0, low: 15.0, high: 23.5, unit: 'mmol/day', tissue: 'whole-body', species: 'human', source: 'article:mudd-2007-methyl-balance', extraSources: ['article:storch-1988-methionine-cycle-fed-fasted', 'article:maccoss-2001-intracellular-enrichment-correction', 'article:pissios-2017-nnmt-methyl-sink', 'article:mudd-1975-labile-methyl-balance-diets', 'article:bortz-2025-methyl-shuttling-folate-choline'], locator: 'Mudd 2007 range 16.7-23.4 mmol/day (read in Bortz 2025 section on methyl flux, ref. to Mudd 2007; the Mudd 2007 abstract confirms that total transmethylation is an open question). Storch 1988: fed TM 14 umol/kg/h x 70 kg x 24 h = 23.5. MacCoss 2001: tracer values ~40% too low; 16.7 x 1.4 = 23.4. Pissios 2017: ~15 mmol/day total methyl loss', confidence: 'estimated', note: 'Total SAM-dependent transmethylation. Value is the midpoint of 16.7-23.4. Fasted-only extrapolation (5.8 umol/kg/h) would give 9.7 mmol/day, so the daily figure depends on the feeding pattern. CONTESTED: Mudd 2007 itself lists definitive total transmethylation as an open question; an NASH-study control group (fasting 16.7 umol/kg/h = 28 mmol/day if sustained) was not used because the authors say it is uncorrected for intracellular enrichment.' },
  { id: 'flux-creatine-synthesis', value: 7.3, low: 3.7, high: 14.6, unit: 'mmol/day', tissue: 'whole-body', species: 'human', source: 'article:brosnan-2011-creatine-synthesis-burden', extraSources: ['article:melendez-hevia-2009-glycine-weak-link', 'article:stead-2006-methyl-balance-reevaluation'], locator: 'Brosnan 2011 abstract: creatinine loss 14.6 mmol/day, about half replaced by dietary creatine in omnivores, so synthesis ~7.3; low = 3.7 mmol/day (men 60-80 y, Stead 2006 as tabulated in Meléndez-Hevia 2009 section 4.1.3); high = 14.6 (vegetarian, no dietary creatine)', confidence: 'estimated', note: 'GAMT-dependent SAM use = creatine synthesis rate (one methyl per creatine). Stead 2006 values quoted by Meléndez-Hevia: 7.7 (men 20-39 y), 5.6 (40-59), 3.7 (60-80) mmol/day. Brosnan 2011 puts it at ~40% of all SAM methyl groups; the older consensus was >70% (Mudd & Poole). CONTESTED: Mudd 2007 argues a higher share. 40% of the 20 mmol/day total is 8.0, consistent with 7.3.' },
  { id: 'flux-pemt-sam', value: 3.75, low: 2.5, high: 5.0, unit: 'mmol/day', tissue: 'liver', species: 'human', source: 'article:stead-2006-methyl-balance-reevaluation', extraSources: ['article:mudd-2007-methyl-balance', 'article:bortz-2025-methyl-shuttling-folate-choline'], locator: 'Bortz 2025 (read in full): PEMT-mediated PtdCho synthesis may consume 5 mmol SAM/day (Stead 2006), and biliary PtdCho excretion alone ~5 mmol/day with unknown reabsorption; Mudd 2007 total PEMT-dependent estimate 2.5 mmol/day (search summary, not read at source)', confidence: 'estimated', note: 'SAM consumed by PEMT (3 methyls per PC). No direct human measurement exists; both ends are indirect estimates and Mudd 2007 states PC synthesis may be underestimated. Stead 2006 rests on PEMT-null mice (plasma Hcy -50%) and on bile PC output. Value is the midpoint of the two published figures. Lipoprotein-secreted PEMT-PC is not included in the 5 mmol/day, so the true value could be higher.' },
  { id: 'flux-gnmt-glycine-sarcosine', value: 2.9, low: 1.9, high: 6.2, unit: 'mmol/day', tissue: 'liver', species: 'human', source: 'article:mudd-2007-methyl-balance', extraSources: ['article:melendez-hevia-2009-glycine-weak-link'], locator: 'As quoted in Meléndez-Hevia 2009 section 3.2.1 (read in full text): total sarcosine synthesis ~6.2 mmol/day (70 kg), of which 3.3 from choline and 2.9 from glycine (GNMT); 1.9 = endogenous sarcosine on a minimal-choline diet', confidence: 'estimated', note: 'Only the glycine-to-sarcosine (GNMT) share consumes SAM; the choline-derived share enters through betaine -> DMG -> sarcosine and needs no SAM. Low = 1.9 (endogenous sarcosine, minimal-choline diet); high = 6.2 (all sarcosine via GNMT). The primary papers (Mudd 1980 and 2007) were paywalled; values are second-hand. A web summary of Mudd 2007 gives corrected sarcosine formation ~6.1 mmol/day in one sarcosinemic patient, which is the same order.' },
  { id: 'flux-other-methyltransferases', value: 1.9, low: 0.5, high: 5.6, unit: 'mmol/day', tissue: 'whole-body', species: 'human', source: 'assumption:unaccounted-methyltransferases', locator: 'sum of "other transmethylations 1.4" + "polyamines 0.5" attributed to Mudd 1980 in a web summary (NOT verified at source); high = up to 5.6 mmol/day of SAM use left unidentified (web summary of Mudd 2007, NOT verified)', confidence: 'assumed', note: 'DNA/histone/RNA methylation, COMT, HNMT, NNMT, AS3MT, carnitine, polyamines and others lumped. In a published liver model DNMT is ~2% and AS3MT ~1% of methyl flux (Reed 2015, model output, not data). Treat as a small, poorly known residual.' },
  { id: 'flux-nnmt-baseline', value: 0.075, low: 0.04, high: 0.15, unit: 'mmol/day', tissue: 'whole-body', species: 'human', source: 'article:pissios-2017-nnmt-methyl-sink', locator: 'Pissios 2017 methyl-donor discussion: MNAM + 2-py + 4-py excretion ~75 umol/day, <1% of ~15 mmol/day methyl loss (secondary citation of Okamoto 2003)', confidence: 'estimated', note: 'Baseline NNMT methyl use at normal vitamin B3 intake. Range is +/- ~2-fold around the single reported figure (assumed). Compare niacin-loading: see nnmt-methyl-per-g-niacin.' },
  { id: 'nnmt-methyl-per-g-niacin', value: 4.38, low: 4.38, high: 6.3, unit: 'mmol methyl per g niacin', tissue: 'whole-body', species: 'human', source: 'article:menon-2007-niacin-er-pharmacokinetics', extraSources: ['article:garg-1999-niacin-homocysteine', 'article:fukada-2006-gaa-homocysteine-rat', 'article:basu-2002-niacin-rat-homocysteine'], locator: 'Abstract: after 2000 mg extended-release niacin, 96-h urine recovery 69.5% of dose, of which 2PY 37.9% and MNA 16.0%. 2 g / 123.11 g/mol = 16.25 mmol; (37.9+16.0)% = 53.9% = 8.76 mmol methylated = 4.38 mmol/g', confidence: 'estimated', note: 'Lower bound (30% of the dose was not recovered). High = 4.38 x 100/69.5 = 6.30 if the unrecovered dose were handled in the same proportions (calc). One SAM methyl per MNA or 2PY. At a sustained 2 g/day this would draw ~9 mmol/day, i.e. roughly half of the whole-body transmethylation flux, ~100x the baseline NNMT flux. Extended-release formulation, n=12 men; nicotinic acid is partly conjugated with glycine (NUA, 11.6%), which is not a methyl sink. There is NO human SAM/SAH measurement after niacin; indirect readouts: human tHcy +17-55% (Garg 1999) and rat tHcy +39-58% at 5-10 g/kg nicotinic acid (Fukada 2006).' },
  { id: 'flux-hcy-remethylation-total', value: 9.6, low: 3.0, high: 13.4, unit: 'mmol/day', tissue: 'whole-body', species: 'human', source: 'article:davis-2004-remethylation-serine-donor', extraSources: ['article:storch-1988-methionine-cycle-fed-fasted'], locator: 'Davis 2004 abstract: total remethylation ~8 umol/kg/h (13.4 mmol/day at 70 kg), twice previous reports. Storch 1988: fasted 1.8 (3.0 mmol/day), fed 5.7 umol/kg/h (9.6 mmol/day)', confidence: 'estimated', note: 'Cross-check only; B1 owns the methionine cycle. Davis 2004 attributes ~100% of remethylation methyls to serine-derived folate one-carbon units (with a conservative enrichment correction), leaving little room for betaine; the stoichiometric ceiling for betaine supply is flux-bhmt-methyl-ceiling.' },
  { id: 'flux-bhmt-methyl-ceiling', value: 4.8, low: 3.9, high: 6.3, unit: 'mmol/day', tissue: 'liver', species: 'human', source: 'article:cho-2006-framingham-choline-betaine-intake', extraSources: ['article:wallace-2017-us-choline-intake', 'article:ross-2014-betaine-food-sources'], locator: 'calc: dietary choline (Cho 2006 313 mg = 3.0 mmol; EU 291-468 mg = 2.8-4.5 mmol) + dietary betaine (Cho 2006 208 mg = 1.8 mmol; Ross 2014 131 mg = 1.1 mmol)', confidence: 'estimated', note: 'Upper bound on diet-derived betaine methyl available to BHMT if every dietary choline were oxidised to betaine. It excludes PEMT-derived choline (~0.8-1.7 mmol/day) and is not a literature measurement of BHMT flux. CONTESTED: a 2025 review states ~50% of cellular SAM is supplied through BHMT, while Davis 2004 assigns almost all remethylation methyls to serine. No human BHMT flux was found; in an in-vitro rat reconstitution BHMT handled 27% of Hcy consumed (Finkelstein & Martin 1984).' },
  { id: 'sam-plasma-reference', value: 0.12, low: 0.0945, high: 0.139, unit: 'uM', tissue: 'plasma', species: 'human', source: 'article:bravo-2022-sam-sah-reference-values', extraSources: ['article:gellekink-2005-plasma-sam-sah-lcms', 'article:melnyk-2000-plasma-sam-sah-measurement'], locator: 'Bravo 2022 Table 2: SAM 120.6 +/- 18.1 nM (n=33, LC-MS/MS); Gellekink 2005 abstract: 94.5 nM', confidence: 'measured', note: 'Plasma, not tissue. Methods and pre-analytics (acidification, storage) give ~10-fold scatter across the literature; older HPLC values are higher. Use as an observable for SAM:SAH, not as the hepatic pool.' },
  { id: 'sah-plasma-reference', value: 0.0215, low: 0.0123, high: 0.0248, unit: 'uM', tissue: 'plasma', species: 'human', source: 'article:bravo-2022-sam-sah-reference-values', extraSources: ['article:gellekink-2005-plasma-sam-sah-lcms'], locator: 'Bravo 2022 Table 2: SAH 21.5 +/- 3.3 nM; Gellekink 2005 abstract: 12.3 nM', confidence: 'measured', note: 'Plasma SAH. Plasma SAM:SAH ratio 5.6 +/- 1.0 (Bravo 2022).' },
  { id: 'sam-sah-ratio-plasma', value: 5.6, low: 4.6, high: 6.6, unit: 'ratio', tissue: 'plasma', species: 'human', source: 'article:bravo-2022-sam-sah-reference-values', locator: 'Table 2, mean +/- SD', confidence: 'measured', note: 'Plasma SAM:SAH in 33 healthy adults. The hepatic ratio is not available for humans (Hoffman 1981: rat liver 5:1 adult, 12:1 developing, post-mortem artefacts).' },
  { id: 'sam-liver-rat', value: 75, low: 60, high: 90, unit: 'uM (nmol/g)', tissue: 'liver', species: 'rat', source: 'article:hoffman-1979-liver-sam-sah-rat', locator: 'Abstract: rat liver SAM 60-90 nmol/g independent of age; SAH 3-7 (young) and 10-15 (adult) nmol/g', confidence: 'measured', note: 'HUMAN LIVER SAM/SAH WAS NOT FOUND. Rat tissue nmol/g is treated as ~uM. Mouse wild-type liver 37 nmol/g (Luka 2006). SAH rises and SAM falls rapidly post-mortem, so tissue numbers carry artefact.' },
  { id: 'sah-liver-rat', value: 12.5, low: 10, high: 15, unit: 'uM (nmol/g)', tissue: 'liver', species: 'rat', source: 'article:hoffman-1979-liver-sam-sah-rat', locator: 'Abstract (adult)', confidence: 'measured', note: 'Adult rat; young rat 3-7 nmol/g. See sam-liver-rat caveat.' },
  { id: 'sam-liver-mouse', value: 76.4, low: 72.7, high: 80.1, unit: 'uM (nmol/g)', tissue: 'liver', species: 'mouse', source: 'article:teng-2011-bhmt-knockout-liver-pools', locator: 'Table 2 (5-week-old wild-type mice, mean +/- SE, n=5-6): AdoMet 76.4 +/- 3.7, AdoHcy 21.8 +/- 1.7 nmol/g, ratio 3.6 +/- 0.2; Table 5 (1-year-old): 113.1 +/- 14.7 and 31.9 +/- 5.3, ratio 4.05', confidence: 'measured', note: 'Mouse liver, HPLC. Consistent with rat (60-90) and Luka 2006 (mouse 37 nmol/g, a different laboratory and handling). Bhmt knockout: AdoMet -43%, AdoHcy x2.6, ratio 0.9.' },
  { id: 'sah-liver-mouse', value: 21.8, low: 20.1, high: 23.5, unit: 'uM (nmol/g)', tissue: 'liver', species: 'mouse', source: 'article:teng-2011-bhmt-knockout-liver-pools', locator: 'Table 2, 5-week-old wild type', confidence: 'measured', note: 'Mouse liver SAH; SAM:SAH 3.6 (5 weeks) to 4.05 (1 year).' },
  { id: 'glycine-liver-mouse', value: 1659, low: 1531, high: 1787, unit: 'uM (nmol/g)', tissue: 'liver', species: 'mouse', source: 'article:teng-2011-bhmt-knockout-liver-pools', locator: 'Table 2 (5-week-old wild-type mice, GC-MS): glycine 1659 +/- 128 nmol/g; methionine 223 +/- 26; DMG 48.2 +/- 19.0; methylglycine (sarcosine) 20.2 +/- 8.9; tHcy 4.2 +/- 0.3; cysteine 247 +/- 25', confidence: 'measured', note: 'The only tissue free glycine value found (mouse; treated as ~uM). It is ~7x plasma glycine, i.e. ~1.5x Km(glycine) of GNMT (1.1 mM), so GNMT is already well loaded with glycine and an oral glycine bolus raises GNMT flux by well under 2x if hepatic glycine rises in proportion. Unchanged by Bhmt knockout (1561).' },

  // ---------------------------------------------------------------------------
  // C. Methyltransferase kinetics (concentrations in uM; rates per h unless noted)
  // ---------------------------------------------------------------------------
  // GNMT
  { id: 'gnmt-km-sam', value: 100, low: 30, high: 460, unit: 'uM', tissue: 'liver', species: 'rat', source: 'article:zhang-2016-gnmt-kinetics-37c', extraSources: ['article:luka-2008-gnmt-liver-vs-recombinant', 'article:ogawa-1982-gnmt-purification-kinetics'], locator: 'Zhang 2016 Table 1 (recombinant rat GNMT, 37 C, pH 7.4): Km(AdoMet) 108 +/- 18 uM. Ogawa 1982 abstract: S0.5 30 uM (native rat liver, 25 C, pH 7.4). Luka 2008 Table 1: K0.5 280 uM (liver) and 460 uM (recombinant), pH 7.5, 25 C', confidence: 'measured', note: 'CONTESTED 15-fold. Same enzyme, different assay temperature/buffer/folate-loading. No human GNMT Km was found (human GNMT is cooperative for SAM; Ogawa 1993). Value is the 37 C recombinant measurement.' },
  { id: 'gnmt-hill-sam', value: 1.1, low: 1.0, high: 2.0, unit: 'dimensionless', tissue: 'liver', species: 'rat', source: 'article:luka-2008-gnmt-liver-vs-recombinant', extraSources: ['article:ogawa-1982-gnmt-purification-kinetics'], locator: 'Luka 2008 Table 1: Hill coefficient 1.10 (liver) and 1.02-1.05 (recombinant); rises to 1.50 with 1 uM 5-methylTHF-Glu5 (section 3.5). Ogawa 1982: positive cooperativity for SAM', confidence: 'measured', note: 'CONTESTED. Many models use n=2 (high end). Luka 2008 argues earlier cooperativity reflects bound folate. High = 2.0 is the modelling convention, not a measurement.' },
  { id: 'gnmt-km-gly', value: 1100, low: 130, high: 2000, unit: 'uM', tissue: 'liver', species: 'rat', source: 'article:zhang-2016-gnmt-kinetics-37c', extraSources: ['article:luka-2008-gnmt-liver-vs-recombinant', 'article:ogawa-1982-gnmt-purification-kinetics', 'article:luka-2009-gnmt-sam-regulation'], locator: 'Zhang 2016 Table 1: Km(glycine) 1.1 +/- 0.2 mM (37 C, pH 7.4). Ogawa 1982: S0.5 0.13 mM (25 C). Luka 2008 Table 1: 1.9 mM (liver), 1.2 mM (recombinant). Luka 2009 review: half-maximal glycine 2-20 mM across the literature', confidence: 'measured', note: 'CONTESTED 15-fold, and the review range reaches 20 mM (likely assay-pH dependent). Hepatic free glycine is NOT KNOWN for humans (see glycine-liver species), so whether glycine limits GNMT in vivo is unresolved. High range truncated at 2 mM (measured near physiological pH); a 20 mM sensitivity run is advisable.' },
  { id: 'gnmt-kcat', value: 10470, low: 2100, high: 10470, unit: '1/h', tissue: 'liver', species: 'rat', source: 'article:zhang-2016-gnmt-kinetics-37c', extraSources: ['article:luka-2009-gnmt-sam-regulation'], locator: 'Zhang 2016 Table 1: kcat 174.5 min^-1 at 37 C (= 10 470 /h = 2.9 /s). Luka 2009 review: kcat 35-96 min^-1 (25 C range)', confidence: 'measured', note: 'Per subunit. Low = 35 min^-1 x 60. GNMT is 1-3% of liver cytosolic protein (gnmt-fraction-cytosolic-protein), but absolute hepatic enzyme concentration is not known to B2; calibrate Vmax to flux-gnmt-glycine-sarcosine instead.' },
  { id: 'gnmt-fraction-cytosolic-protein', value: 2, low: 1, high: 3, unit: '% of liver cytosolic protein', tissue: 'liver', species: 'rat', source: 'article:luka-2009-gnmt-sam-regulation', locator: 'GNMT section: 1-3% of liver cytosolic protein (0.4% in pancreas)', confidence: 'measured', note: 'Rodent figure; human GNMT abundance not found. Midpoint used as value.' },
  { id: 'gnmt-ki-sah', value: 95, low: 35, high: 97, unit: 'uM', tissue: 'liver', species: 'rat', source: 'article:luka-2008-gnmt-liver-vs-recombinant', locator: 'Section 3.2: inhibition by AdoHcy 97 uM (liver) and 95 uM (recombinant); the text does not say whether this is Ki or IC50. Low = 35 uM is the Ki used in the Reed 2015 liver model (secondary source)', confidence: 'estimated', note: 'Weak product inhibition compared with PEMT (Ki 3.8 uM) and HNMT (6.9 uM); this ordering is why SAH accumulation hits PEMT/HNMT before GNMT.' },
  { id: 'gnmt-ic50-5mthf-pentaglu', value: 1.26, low: 0.2, high: 1.26, unit: 'uM', tissue: 'liver', species: 'rat', source: 'article:luka-2008-gnmt-liver-vs-recombinant', extraSources: ['article:yeo-1999-gnmt-5mthf-inhibition'], locator: 'Luka 2008 Table 2: 50% inhibition by 5-methylTHF-Glu5 1.26 uM (liver GNMT), 590 uM (recombinant). Yeo 1999 abstract: ~0.2 uM at pH 7.0 (liver GNMT)', confidence: 'measured', note: 'Pentaglutamate is the relevant intracellular form; the monoglutamate needs ~50 uM (Luka 2008), i.e. not physiologically relevant. Recombinant enzyme lacks the folate binding that liver enzyme carries.' },
  // PEMT
  { id: 'pemt-km-sam', value: 18.2, low: 18.2, high: 302, unit: 'uM', tissue: 'liver', species: 'rat', source: 'article:hoffman-1981-pemt-kinetic-properties', extraSources: ['article:ridgway-1988-pemt-ordered-mechanism'], locator: 'Abstract: Km(AdoMet) of microsomal PEMT 18.2 uM (rat liver) vs 302 uM (guinea pig liver); rate-limiting first methylation, pH ~9.8', confidence: 'measured', note: 'Rat value used as value (also the value in the Reed 2015 model). 17-fold species difference. Purified rat PEMT is cooperative for substrates (Hill 2.5-4.7 in detergent, ~1 with egg PC added; Ridgway & Vance 1988) so surface-dilution effects dominate in vitro numbers.' },
  { id: 'pemt-ki-sah', value: 3.8, low: 3.8, high: 68, unit: 'uM', tissue: 'liver', species: 'rat', source: 'article:hoffman-1981-pemt-sah-inhibition', locator: 'Abstract: Ki(AdoHcy) for rate-limiting reactions 3.8 uM (rat) and 68 uM (guinea pig); five of six methylation steps bind AdoHcy more tightly than AdoMet', confidence: 'measured', note: 'Rat value as value. Tight SAH binding is why PEMT flux tracks the SAM:SAH ratio (Vance 2014).' },
  { id: 'pemt-flux-fraction-liver-pc-per-h', value: 0.53, low: 0.27, high: 1.06, unit: '% of liver PC pool per h', tissue: 'liver', species: 'human', source: 'article:pynn-2011-human-pemt-flux', locator: 'Results/discussion: 0.53%/h calculated from d9-choline label appearing as PEMT-derived PC in human plasma (n=4: 1 man, 3 women, 3.6 mg/kg d9-choline over 3 h); mouse liver 5.04%/h, mouse plasma 4.71%/h', confidence: 'estimated', note: 'Human PEMT-pathway PC synthesis, assuming plasma PC reflects liver. Range is x/÷2 (assumed; n=4 and no spread reported). Human liver PC pool size is not available, so a mmol/day figure cannot be derived here; see flux-pemt-sam.' },
  { id: 'pemt-share-of-hepatic-pc', value: 0.2, low: 0.1, high: 0.47, unit: 'fraction', tissue: 'liver', species: 'rat', source: 'article:sundler-1975-hepatocyte-pc-synthesis', extraSources: ['article:pynn-2011-human-pemt-flux', 'article:delong-1999-pc-pathways-molecular-species', 'article:yan-2013-pregnancy-d9-choline'], locator: 'Sundler & Akesson 1975 abstract: PEMT pathway 20-40% of the CDP-choline rate in rat hepatocytes at plasma-like methionine (so ~17-29% of the total). Pynn 2011: mouse PEMT 5.04 vs CDP 46.3 %/h (~10%). A 2026 NMR study (not in repo) reports up to 47% in mouse hepatocytes and ~10% in human liver cell lines', confidence: 'estimated', note: 'CONTESTED and not measured in intact human liver. The oft-quoted "about 30%" comes from DeLong 1999 (abstract read; no number). Value 0.2 is the lower-middle of the rodent range.' },
  // GAMT / AGAT
  { id: 'gamt-km-sam', value: 6.73, low: 6.73, high: 49, unit: 'uM', tissue: 'liver', species: 'rat', source: 'article:ogawa-1983-gamt-rat-liver', locator: 'Abstract (rat liver GAMT, pH 8.0, 37 C): Km(AdoMet) 6.73 uM', confidence: 'measured', note: 'CONTESTED 7-fold: the Reed 2015 liver model uses 49 uM (secondary source). Human GAMT constants were not found.' },
  { id: 'gamt-km-gaa', value: 97.5, low: 97.5, high: 97.5, unit: 'uM', tissue: 'liver', species: 'rat', source: 'article:ogawa-1983-gamt-rat-liver', locator: 'Abstract: Km(guanidinoacetate) 97.5 uM', confidence: 'measured', note: 'Single determination; no spread reported.' },
  { id: 'agat-km-gly', value: 2500, low: 2500, high: 2500, unit: 'uM', tissue: 'kidney', species: 'human', source: 'article:gross-1986-agat-human-kidney', locator: 'Abstract: purified human kidney AGAT, Km(glycine) 2.5 mM, Km(arginine) 2.5 mM, Vmax 0.5 umol ornithine/min/mg', confidence: 'measured', note: 'Single determination. Kidney is the main AGAT site; GAMT is hepatic. Km far above plasma glycine (~240 uM), so AGAT runs sub-saturated and responds to glycine supply.' },
  { id: 'agat-km-arg', value: 2500, low: 2500, high: 2500, unit: 'uM', tissue: 'kidney', species: 'human', source: 'article:gross-1986-agat-human-kidney', locator: 'Abstract', confidence: 'measured', note: 'Single determination.' },
  { id: 'agat-residual-activity-high-creatine', value: 26, low: 26, high: 26, unit: '% of control', tissue: 'kidney', species: 'rat', source: 'article:mcguire-1984-agat-creatine-repression', locator: 'Abstract: 0.3% creatine diet leaves 26% of kidney AGAT activity; synthesis rate 21% and mRNA 37% of control', confidence: 'measured', note: 'Rat. Pretranslational repression by dietary creatine means creatine supplementation lowers the endogenous (and SAM-consuming) synthesis rate.' },
  // NNMT
  { id: 'nnmt-km-nam', value: 430, low: 380, high: 430, unit: 'uM', tissue: 'liver', species: 'human', source: 'article:aksoy-1994-human-nnmt', extraSources: ['article:pissios-2017-nnmt-methyl-sink'], locator: 'Aksoy 1994 abstract: apparent Km(nicotinamide) 0.43 mM (human liver) and 0.38 mM (transfected COS-1); Pissios 2017 repeats 430 uM, "not saturated at normal NAM"', confidence: 'measured', note: 'A mutant used for crystallography has 105 uM (Peng 2011) but is not wild type.' },
  { id: 'nnmt-km-sam', value: 1.8, low: 1.8, high: 5.0, unit: 'uM', tissue: 'liver', species: 'human', source: 'article:aksoy-1994-human-nnmt', extraSources: ['article:peng-2011-nnmt-structure-kinetics'], locator: 'Aksoy 1994: Km(SAM) 1.8 uM (liver), 2.2 uM (COS-1). Peng 2011 Table 3 (pH 8.6, 37 C): 5.0 +/- 0.6 uM for the triple mutant tm-wt', confidence: 'measured', note: 'Low-uM Km means NNMT is saturated by SAM and flux is set by nicotinamide supply.' },
  { id: 'nnmt-ic50-mnam', value: 60, low: 30, high: 60, unit: 'uM', tissue: 'liver', species: 'human', source: 'article:aksoy-1994-human-nnmt', locator: 'Abstract: IC50 of N1-methylnicotinamide 60 uM (liver) and 30 uM (COS-1)', confidence: 'measured', note: 'Product inhibition of NNMT by its own product.' },
  // COMT, HNMT, DNMT
  { id: 'comt-ks-sam', value: 20.2, low: 3.4, high: 20.2, unit: 'uM', tissue: 'liver', species: 'human', source: 'article:lotta-1995-comt-kinetics', locator: 'Abstract: dissociation constants for AdoMet 3.4 uM (membrane-bound COMT) and 20.2 uM (soluble COMT), recombinant human', confidence: 'measured', note: 'Catechol Km values (dopamine, noradrenaline) were NOT FOUND in accessible text; S-COMT Km for catecholamines is ~15x higher than MB-COMT.' },
  { id: 'hnmt-km-histamine', value: 3.7, low: 3.7, high: 25.3, unit: 'uM', tissue: 'liver', species: 'human', source: 'article:horton-2001-hnmt-structure-kinetics', extraSources: ['article:girard-1994-hnmt-kidney-cdna'], locator: 'Horton 2001 Table 3: 3.7 uM (Thr105 recombinant, E. coli), 4.7 (Ile105); human COS-1 23.4-25.3, kidney 13-20. Girard 1994 abstract: 20 (kidney), 13 (purified kidney), 14 uM (COS-1)', confidence: 'measured', note: 'CONTESTED 7-fold depending on expression system. Thr105 (allele frequency ~0.9) is the common form.' },
  { id: 'hnmt-km-sam', value: 13.1, low: 2.0, high: 23.6, unit: 'uM', tissue: 'liver', species: 'human', source: 'article:horton-2001-hnmt-structure-kinetics', extraSources: ['article:girard-1994-hnmt-kidney-cdna'], locator: 'Horton 2001 Table 3: 13.1 uM (Thr105), 23.6 (Ile105). Girard 1994: 2.0 uM (kidney), 3.0 (purified kidney), 6.2 (COS-1)', confidence: 'measured', note: 'CONTESTED. Native kidney preparations give 2-6 uM, recombinant 13-24 uM.' },
  { id: 'hnmt-ki-sah', value: 6.9, low: 6.9, high: 9.0, unit: 'uM', tissue: 'liver', species: 'human', source: 'article:horton-2001-hnmt-structure-kinetics', locator: 'Table 4 / Fig 7: AdoHcy competitive with AdoMet, Ki 6.9 uM (Thr105) and 9.0 uM (Ile105); methylhistamine Ki 6.5 and 6.1 uM', confidence: 'measured', note: 'This is the quantitative basis of "HNMT depends on SAM:SAH": with Km(SAM) 13 uM and Ki(SAH) 7 uM, a fall in SAM:SAH slows histamine methylation steeply.' },
  { id: 'dnmt1-km-sam', value: 4.4, low: 2.6, high: 7.2, unit: 'uM', tissue: 'nucleus', species: 'human', source: 'article:pradhan-1999-dnmt1-kinetics', extraSources: ['article:gros-2013-dnmt1-kinetics'], locator: 'Pradhan 1999 abstract: Km(AdoMet) 2.6-7.2 uM, Km(CG) 0.33-1.32 uM, kcat 131-237 /h (poly dI-dC), 1.2-2.3 /h (unmethylated), 8.3-49 /h (hemimethylated). Gros 2013: 4.4 +/- 0.5 uM', confidence: 'measured', note: 'Recombinant human DNMT1. Km far below hepatic SAM, so DNA methylation is rarely SAM-limited by this route; SAH is a competitive inhibitor (not quantified here).' },

  // ---------------------------------------------------------------------------
  // D. Choline / betaine: enzymes, transport, intake, fate, pharmacokinetics
  // ---------------------------------------------------------------------------
  { id: 'chdh-km-choline', value: 7000, low: 3500, high: 14000, unit: 'uM', tissue: 'liver', species: 'rat', source: 'article:tsuge-1980-choline-dehydrogenase-rat-liver', extraSources: ['article:salvi-2013-choline-oxidation-review'], locator: 'Abstract: rat liver mitochondrial choline dehydrogenase purified 240-fold, Km(choline) 7.0 mM, specific activity 6.3 umol O2/min/mg (PMS acceptor, pH 7.6, 30 C)', confidence: 'estimated', note: 'Single rat determination with an artificial electron acceptor; NO kinetic constants exist for purified human CHDH. Range is x/÷2 (assumed). In vivo choline oxidation is fast (about 80% of plasma radioactivity is betaine within 25 min of an IV [11C]choline tracer; Roivainen 2000), so the Km probably does not constrain flux: treat CHDH Vmax as a calibrated parameter. Human CHDH is highest in kidney, ~6-fold lower in liver (Salvi 2013, citing Haubrich 1981).' },
  { id: 'aldh7a1-km-betaine-aldehyde', value: 41.1, low: 31.8, high: 50.4, unit: 'uM', tissue: 'liver', species: 'human', source: 'article:brocker-2010-aldh7a1-betaine-aldehyde', locator: 'Table 1 (full text): human recombinant ALDH7A1, betaine aldehyde Km 41.1 +/- 9.3 uM, Vmax 101.4 +/- 20.6 nmol NADH/min/mg', confidence: 'measured', note: 'Low Km: betaine aldehyde does not accumulate, so BADH is effectively non-limiting once CHDH has acted. Range = +/- 1 SD as printed.' },
  { id: 'bhmt-km-betaine', value: 2200, low: 23, high: 2200, unit: 'uM', tissue: 'liver', species: 'human', source: 'article:millian-1998-human-bhmt-kinetics', extraSources: ['article:garrow-1996-pig-bhmt-purification', 'article:szegedi-2008-bhmt2-smm'], locator: 'Millian & Garrow 1998 abstract: human recombinant BHMT, Km(betaine) 2.2 mM, Km(L-Hcy) 4 uM; partially purified human liver enzyme kinetically indistinguishable. Garrow 1996 abstract: porcine liver 23 uM betaine, 32 uM Hcy. Szegedi 2008 Table 2: kcat 88 /h, kcat/Km 40 mM^-1 h^-1', confidence: 'measured', note: 'CONTESTED 100-fold: pig liver enzyme 23 uM vs human 2.2 mM. The human value is used; with hepatic betaine ~1 mM (mouse; human unknown) human BHMT sits on the steep part of its saturation curve, so betaine supplementation raises flux roughly proportionally.' },
  { id: 'bhmt-km-hcy', value: 4, low: 4, high: 32, unit: 'uM', tissue: 'liver', species: 'human', source: 'article:millian-1998-human-bhmt-kinetics', extraSources: ['article:garrow-1996-pig-bhmt-purification'], locator: 'Millian & Garrow 1998 abstract: 4 uM (human). Garrow 1996: 32 uM (pig)', confidence: 'measured', note: 'High affinity for Hcy: BHMT is saturated by Hcy at normal intracellular concentrations, so its rate depends on betaine and DMG, not on Hcy.' },
  { id: 'bhmt-kcat', value: 88, low: 88, high: 88, unit: '1/h', tissue: 'liver', species: 'human', source: 'article:szegedi-2008-bhmt2-smm', locator: 'Table 2: kcat 88 /h with betaine (1.47 /min); 24 /h with S-methylmethionine', confidence: 'measured', note: 'Single determination, recombinant. Human liver activity 33.4 nmol/h/mg protein (bhmt-liver-specific-activity).' },
  { id: 'bhmt-liver-specific-activity', value: 33.4, low: 33.4, high: 33.4, unit: 'nmol/h/mg protein', tissue: 'liver', species: 'human', source: 'article:wang-1991-bhmt-human-tissues', locator: 'Abstract (human liver, 37 C, pH 7.4)', confidence: 'measured', note: 'Mean only; chicken 50.4, lamb 6.2 in the same paper; <1.4 in lymphocytes and fibroblasts. Useful to calibrate Vmax with a liver protein content.' },
  { id: 'bhmt-ki-dmg', value: 10, low: 10, high: 1000, unit: 'uM', tissue: 'liver', species: 'human', source: 'article:szegedi-2008-bhmt2-smm', extraSources: ['article:schwahn-2003-betaine-pharmacokinetics'], locator: 'Szegedi 2008: 2 mM DMG ("10x betaine") obliterated BHMT activity at 200 uM betaine; BHMT2 reduced only 11%. The Ki of ~10 uM is quoted in Schwahn 2003 from a source B2 could not trace', confidence: 'assumed', note: 'Low = 10 uM (second-hand); high = 1 mM, the bound implied by complete inhibition at 2 mM DMG (calc). Product inhibition by DMG is the proposed reason betaine half-life lengthens from 14 h (single dose) to 41 h (repeated dosing) and DMG accumulates (Schwahn 2003).' },
  { id: 'dmgdh-km-dmg', value: 300, low: 40, high: 1400, unit: 'uM', tissue: 'liver', species: 'human', source: 'article:augustin-2016-human-dmgdh', extraSources: ['article:porter-1985-dmgdh-sardh-rat'], locator: 'Table 1/3: human recombinant DMGDH Km(DMG) 0.3 mM (DCPIP assay) or 1.4 mM (ferrocene); earlier human value 0.04 mM; rat high-affinity Km 0.05 mM (Porter 1985)', confidence: 'measured', note: 'CONTESTED 35-fold across assays. The same paper treats a second Km of ~30 mM as an assay artefact. Electron-acceptor reoxidation (ETF) is rate limiting.' },
  { id: 'dmgdh-kcat', value: 2640, low: 2640, high: 12780, unit: '1/h', tissue: 'liver', species: 'human', source: 'article:augustin-2016-human-dmgdh', locator: 'Table 1: kcat 44 /min (DCPIP) or 213 /min (ferrocene), pH 7.8, 25 C', confidence: 'measured', note: 'Per subunit; specific activity 0.5-2.0 umol/mg/min.' },
  { id: 'sardh-km-sarcosine', value: 500, low: 250, high: 1000, unit: 'uM', tissue: 'liver', species: 'rat', source: 'article:porter-1985-dmgdh-sardh-rat', locator: 'Abstract: rat liver sarcosine dehydrogenase Km 0.5 mM; methoxyacetate Ki 0.26 mM', confidence: 'estimated', note: 'Rat value; human SARDH Km NOT FOUND. Range x/÷2 (assumed).' },
  { id: 'chka-km-choline', value: 200, low: 160, high: 240, unit: 'uM', tissue: 'liver', species: 'human', source: 'article:gallego-ortega-2009-choline-kinase-isoforms', locator: 'Table 1: human recombinant CHKalpha1 Km(choline) 0.20 +/- 0.04 mM; CHKbeta 0.57 +/- 0.08 mM', confidence: 'measured', note: 'Crude lysate, log-time-course estimate; no Ki found. Range = +/- printed SD. CHKalpha prefers choline, CHKbeta ethanolamine (2.0 vs 12.0 mM).' },
  { id: 'choline-uptake-km-hepatocyte', value: 61.4, low: 35, high: 108, unit: 'uM', tissue: 'liver', species: 'mouse', source: 'article:odwyer-2020-hepatocyte-choline-uptake', extraSources: ['article:horie-2014-choline-uptake-ls180', 'article:inazu-2019-choline-transporters-review'], locator: 'Results/Fig 1A: mouse primary hepatocytes Km 61.4 +/- 9.6 uM, Vmax 3.72 +/- 0.34 nmol/mg/min, hemicholinium-3 sensitive, quinine insensitive. Range: Horie 2014 abstract (human LS180 intestinal cells, 108 uM) and Inazu 2019 review (35 uM, CTL1-type uptake in human brain endothelial cells)', confidence: 'measured', note: 'Mouse hepatocyte value as value; human hepatic uptake kinetics NOT FOUND. hCHT1 (EC50 2 uM) is neuronal and irrelevant to liver flux.' },
  { id: 'chat-km-choline', value: 257, low: 225, high: 289, unit: 'uM', tissue: 'nervous-system', species: 'human', source: 'article:shen-2011-human-chat-kinetics', locator: 'Table 2: wild-type human ChAT kcat 195 +/- 5 /s, Km(AcCoA) 11.9 +/- 0.8 uM, Km(choline) 257 +/- 32 uM, KiA 3.7 +/- 1.5 uM', confidence: 'measured', note: 'Units inferred from the table footnote (kcat/KmB 7.6x10^5 /s/M). Acetylcholine synthesis consumes a negligible fraction of body choline; it is shown for completeness.' },
  { id: 'choline-intake-mmol-day', value: 3.2, low: 2.8, high: 4.5, unit: 'mmol/day', tissue: 'whole-body', species: 'human', source: 'article:wallace-2017-us-choline-intake', extraSources: ['article:cho-2006-framingham-choline-betaine-intake', 'article:vennemann-2015-eu-choline-intake'], locator: 'Wallace & Fulgoni 2017 (NHANES 2009-2014): adults 338 +/- 1.86 mg/day = 3.24 mmol; Cho 2006 (Framingham, energy-adjusted): 313 mg = 3.0 mmol; Vennemann 2015 abstract: EU adult survey means 291-468 mg = 2.8-4.5 mmol', confidence: 'measured', note: 'Choline cation, 1 mg = 9.6 umol. About half is phosphatidylcholine. Only ~8% of US adults reach the IOM AI.' },
  { id: 'betaine-intake-mmol-day', value: 1.4, low: 1.1, high: 1.8, unit: 'mmol/day', tissue: 'whole-body', species: 'human', source: 'article:ross-2014-betaine-food-sources', extraSources: ['article:cho-2006-framingham-choline-betaine-intake', 'article:zeisel-2003-food-choline-betaine'], locator: 'Ross 2014 abstract: mean 131 mg/day (1.1 mmol; betaine 1 mg = 8.5 umol); Cho 2006: 208 +/- 90 mg/day (1.8 mmol); Zeisel 2003: wheat bran 1339, wheat germ 1241, spinach 645 mg/100 g', confidence: 'measured', note: 'Cereals supply 60-67% of Western betaine intake (Ross 2014). The value is the midpoint of the two surveys.' },
  { id: 'flux-choline-oxidation-to-betaine', value: 3.3, low: 1.9, high: 3.3, unit: 'mmol/day', tissue: 'liver', species: 'human', source: 'article:melendez-hevia-2009-glycine-weak-link', extraSources: ['article:mudd-2007-methyl-balance'], locator: 'Section 3.2.1 (full text read): of ~6.2 mmol/day sarcosine synthesis, 3.3 mmol/day derives from choline (dietary + endogenous), on a diet of ~3.6 mmol choline/day; 1.9 mmol/day endogenous on a minimal-choline diet; attributed to Mudd 1980/2007', confidence: 'estimated', note: 'Choline passing through betaine -> DMG -> sarcosine -> glycine, inferred from urinary sarcosine in patients with a sarcosine-oxidation defect (secondary citation; primary papers paywalled). It is about the size of dietary choline intake, i.e. most choline carbon seen by this route is oxidised, but sarcosine excretion in one or two patients is a thin basis.' },
  { id: 'flux-pemt-pc-synthesis', value: 1.25, low: 0.83, high: 1.67, unit: 'mmol PC/day', tissue: 'liver', species: 'human', source: 'calc:pemt-sam-over-three', locator: 'flux-pemt-sam (2.5-5.0 mmol/day) divided by 3 methyls per phosphatidylcholine', confidence: 'estimated', note: 'De novo choline moiety formed by PEMT. Inherits all the uncertainty of flux-pemt-sam.' },
  { id: 'tma-fraction-free-choline-bolus', value: 0.63, low: 0.32, high: 1.0, unit: 'fraction of dose', tissue: 'whole-body', species: 'human', source: 'article:zhang-1999-choline-tma-urine', locator: 'Abstract: 63% of a 15 mmol free-choline dose appeared as urinary TMA + TMAO; 31% for DL-carnitine; no rise for betaine or lecithin', confidence: 'estimated', note: 'Gut-microbial TMA yield from a LARGE FREE-choline bolus. Range x/÷2 capped at 1 (assumed; small pilot, n not in abstract). Cho 2020: 600 mg as bitartrate gave ~3x the TMAO AUC of phosphatidylcholine, which did not exceed control; so the yield from habitual dietary choline (about half PC) is much lower.' },
  { id: 'tma-fraction-habitual-diet', value: 0.05, low: 0.01, high: 0.3, unit: 'fraction of dietary choline', tissue: 'whole-body', species: 'human', source: 'assumption:tma-habitual-diet', locator: 'no direct measurement; bounded by Cho 2020 (PC no TMAO rise) and Zhang 1999 (bolus 0.63)', confidence: 'assumed', note: 'NOT FOUND in the literature: whole-diet TMA yield. Wide assumed range. Urinary TMAO is ~96% eliminated within 24 h with turnover time 5.3 h (Taesuwan 2017), so TMAO is a good integrated readout once someone measures it.' },
  { id: 'tmao-urinary-recovery-24h', value: 0.96, low: 0.95, high: 0.96, unit: 'fraction of dose', tissue: 'whole-body', species: 'human', source: 'article:taesuwan-2017-tmao-d9-elimination', extraSources: ['article:al-waiz-1987-tma-tmao-urinary-excretion'], locator: 'Abstract: ~96% of an oral 50 mg d9-TMAO dose recovered in urine within 24 h; turnover time 5.3 h; none in stool (n=40 men)', confidence: 'measured', note: 'Al-Waiz 1987 earlier found ~95% (14C-TMA/TMAO, 3 men).' },
  // Betaine single-dose pharmacokinetics (50 mg/kg)
  { id: 'betaine-dose-pk-mmol-per-kg', value: 0.43, low: 0.43, high: 0.43, unit: 'mmol/kg', tissue: 'whole-body', species: 'human', source: 'article:schwahn-2003-betaine-pharmacokinetics', locator: 'Methods: 50 mg/kg anhydrous betaine (0.43 mmol/kg), 12 healthy men', confidence: 'measured', note: 'Dose used in all rows below. For 70 kg = 3.5 g = 29.9 mmol.' },
  { id: 'betaine-cmax-50mgkg', value: 939, low: 663, high: 1300, unit: 'uM', tissue: 'plasma', species: 'human', source: 'article:schwahn-2003-betaine-pharmacokinetics', locator: 'Table 1: Cmax 0.939 +/- 0.194 mmol/L (range 0.663-1.300); tmax 0.90 +/- 0.33 h', confidence: 'measured', note: 'About 20-30x the fasting plasma betaine (32 +/- 6 uM at baseline in this study).' },
  { id: 'betaine-tmax', value: 0.9, low: 0.57, high: 1.23, unit: 'h', tissue: 'plasma', species: 'human', source: 'article:schwahn-2003-betaine-pharmacokinetics', locator: 'Table 1: 0.90 +/- 0.33 h', confidence: 'measured', note: 'Range +/- SD. Absorption half-life 0.28 h (ka = ln2/0.28 = 2.5 /h, calc, parameter betaine-ka).' },
  { id: 'betaine-ka', value: 2.48, low: 1.54, high: 6.3, unit: '1/h', tissue: 'gut', species: 'human', source: 'article:schwahn-2003-betaine-pharmacokinetics', locator: 'Absorption half-life 0.28 h (Table 1); ka = ln2/0.28 (calc)', confidence: 'estimated', note: 'Absorption half-life 0.28 h (SD 0.17, Table 1) converted with ka = ln2/t1/2; range = ln2/(0.28 + 0.17) to ln2/(0.28 - 0.17).' },
  { id: 'betaine-ke', value: 0.0482, low: 0.0219, high: 0.1148, unit: '1/h', tissue: 'whole-body', species: 'human', source: 'article:schwahn-2003-betaine-pharmacokinetics', locator: 'Table 1: terminal t1/2 14.38 +/- 7.17 h (range 6.04-31.64 h); ke = ln2/t1/2 (calc)', confidence: 'measured', note: 'Elimination is "mainly by metabolism" (BHMT, then DMG demethylation); only 4.0% of the dose appears unchanged in 24-h urine and renal clearance is 5.3% of total. After 5 days of 50 mg/kg twice daily the terminal half-life lengthened to 41.2 +/- 13.5 h: saturable disposal. A linear ke is only valid for a single dose.' },
  { id: 'betaine-clearance-per-kg', value: 0.084, low: 0.063, high: 0.105, unit: 'L/h/kg', tissue: 'whole-body', species: 'human', source: 'article:schwahn-2003-betaine-pharmacokinetics', locator: 'Table 1: CL/F 0.084 L/h/kg; Vss/F 1.32 L/kg; AUC(0-inf) 5.52 mmol h/L', confidence: 'measured', note: 'CL/F 0.084 +/- 0.021 (SD, Table 1). Central distribution volume implied by Cmax is only ~0.46 L/kg (dose 0.43 mmol/kg / 0.939 mmol/L, calc), with a slow second compartment bringing Vss to 1.32 L/kg: use a two-compartment or Cmax-anchored model, not a single volume of 1.32 L/kg.' },
  { id: 'betaine-dmg-peak-after-dose', value: 19, low: 11, high: 27, unit: 'uM', tissue: 'plasma', species: 'human', source: 'article:schwahn-2003-betaine-pharmacokinetics', locator: 'Results: DMG peak 19 +/- 8 uM at 9.7 +/- 7.2 h after a single 50 mg/kg dose (baseline 7 uM)', confidence: 'measured', note: 'Range +/- SD. DMG was measured by a different assay than Allen 1993 (baseline 7 vs 1.4-5.3 uM).' },

  // ---------------------------------------------------------------------------
  // E. Glycine / serine: whole-body fluxes, kinetics, oral-dose response
  // ---------------------------------------------------------------------------
  { id: 'flux-glycine-whole-body-fed', value: 463, low: 408, high: 518, unit: 'umol/kg/h', tissue: 'whole-body', species: 'human', source: 'article:lamers-2007-glycine-flux', locator: 'Abstract/Discussion: 463 +/- 55 umol/kg/h ([1,2-13C2]glycine infusion, fed state, n=5, enrichment correction factor 0.4 applied)', confidence: 'measured', note: '= 34.8 mg/kg/h = 777.8 mmol/day = 58.4 g/day at 70 kg (calc). This is GROSS TURNOVER including release from protein breakdown, not net synthesis. Range +/- printed error (error type not re-checked). Fasting flux is lower: 240 +/- 22 umol/kg/h (Robert 1982).' },
  { id: 'flux-glycine-whole-body-fasting', value: 240, low: 218, high: 262, unit: 'umol/kg/h', tissue: 'whole-body', species: 'human', source: 'article:robert-1982-glycine-synthesis-postabsorptive', locator: 'Abstract: post-absorptive glycine flux 240 +/- 22 umol/kg/h in young men; de novo synthesis 81% of flux; unchanged by glucose infusion', confidence: 'measured', note: '= 30.3 g/day if sustained 24 h. Tan 2022 (fasted, healthy weight) reports 201 (173-234) umol per kg LEAN mass per h.' },
  { id: 'flux-glycine-to-serine-shmt', value: 193, low: 165, high: 221, unit: 'umol/kg/h', tissue: 'whole-body', species: 'human', source: 'article:lamers-2007-glycine-flux', locator: 'Abstract: glycine -> serine (SHMT) 193 +/- 28 umol/kg/h = 41% of flux; 46% of it uses methylene-THF made by the cleavage system', confidence: 'measured', note: '= 324 mmol/day = 24.3 g/day of gross flux. This is the reverse direction of the net serine -> glycine reaction.' },
  { id: 'flux-glycine-gcs-decarboxylation', value: 190, low: 96, high: 231, unit: 'umol/kg/h', tissue: 'whole-body', species: 'human', source: 'article:lamers-2007-glycine-flux', extraSources: ['article:lamers-2009-glycine-decarboxylation-tracer'], locator: 'Lamers 2007 abstract: 190 +/- 41 umol/kg/h (39 +/- 6% of flux, [1,2-13C2] tracer with correction). Lamers 2009b abstract: 96 +/- 8 umol/kg/h (22 +/- 3%) with the [1-13C] tracer; [1,2-13C2] gave 146 +/- 37 in that study', confidence: 'measured', note: 'CONTESTED 2-fold by tracer choice and enrichment correction. 190 umol/kg/h = 319 mmol/day = 24.0 g/day; 96 = 161 mmol/day = 12.1 g/day. Methylene-THF output of the cleavage system is ~20x the Hcy-remethylation demand (Lamers 2009b), so most of the one-carbon units are oxidised, not used for SAM.' },
  { id: 'glycine-de-novo-synthesis-g-day', value: 11.2, low: 2.9, high: 44.3, unit: 'g/day', tissue: 'whole-body', species: 'human', source: 'article:tan-2022-glycine-serine-synthesis-obesity', extraSources: ['article:melendez-hevia-2009-glycine-weak-link', 'article:yu-1985-glycine-synthesis-dispensable-aa', 'article:robert-1982-glycine-synthesis-postabsorptive', 'article:gersovitz-1980-glycine-flux-protein-intake'], locator: 'Five estimates: Meléndez-Hevia 2009 (summed pathway fluxes) 2.9 g/day; Yu 1985 20-59 umol/kg/h = 2.5-7.4 g/day; Tan 2022 124 (103-159) umol/kg LEAN-mass/h = 11.2 g/day at an assumed 50 kg lean mass; Robert 1982 194 umol/kg/h = 24.5 g/day; Gersovitz 1980 351 umol/kg/h = 44.3 g/day', confidence: 'estimated', note: 'MOST CONTESTED NUMBER IN THE GLYCINE MODEL. Value is the median of the five. The tracer studies measure rate of appearance from serine and recycling of the glycine carbon skeleton, while the pathway summation counts only net new glycine; they are not measuring the same thing. See fluxBudgets glycine-synthesis-estimates. No direct rebuttal of the "10 g/day deficit" was found; Gibson 2002 showed glycine production is maintained on a marginal-protein diet but quantifies no deficit.' },
  { id: 'glycine-collagen-net-need-g-day', value: 12, low: 4, high: 12, unit: 'g/day', tissue: 'whole-body', species: 'human', source: 'article:melendez-hevia-2009-glycine-weak-link', locator: 'Table 3 and section 4.3.1 (full text read): net collagen synthesis 96.5 g/day; glycine equivalent 12.04 g/day assuming 95% recycling of glycine released in the procollagen cycle; Table 4 uses -12 g/day', confidence: 'estimated', note: 'Depends entirely on the recycling assumption: at no recycling the gross requirement would be 240 g/day, and the authors state recycling would have to exceed 98% for no deficit at all (then the need would be about the 4 g/day available). Low = 4. High is not bounded above if recycling is below 95%. Procollagen-cycle fraction 30-90% by tissue and age.' },
  { id: 'glycine-glutathione-net-use-g-day', value: 0.57, low: 0.57, high: 3.75, unit: 'g/day', tissue: 'whole-body', species: 'human', source: 'article:melendez-hevia-2009-glycine-weak-link', locator: 'Section 4.1.4: glutathione turnover 30 umol/kg/h = 50 mmol/day (Fukagawa 1996); de novo synthesis ~15% of it, 7.5 mmol/day = 567 mg/day (Table 2)', confidence: 'estimated', note: 'High = gross turnover 50 mmol/day x 75.07 = 3.75 g/day if no cysteine/glycine recycling. 85% recycling is borrowed from cysteine (measured) and assumed for glycine.' },
  { id: 'glycine-heme-use-g-day', value: 0.24, low: 0.24, high: 0.24, unit: 'g/day', tissue: 'whole-body', species: 'human', source: 'article:melendez-hevia-2009-glycine-weak-link', locator: 'Section 4.1.1/Table 2: 0.4 mmol haem/day x 8 glycine = 3.2 mmol = 240 mg/day (London 1950 turnover)', confidence: 'estimated', note: 'Single secondary-derived estimate.' },
  { id: 'glycine-purine-use-g-day', value: 0.21, low: 0.21, high: 0.21, unit: 'g/day', tissue: 'whole-body', species: 'human', source: 'article:melendez-hevia-2009-glycine-weak-link', locator: 'Section 4.1.2/Table 2: uric acid excretion 2.75 mmol/day (low-purine diet) = purine synthesis; one glycine per purine = 206 mg/day', confidence: 'estimated', note: 'Purine synthesis is a net glycine SOURCE in this accounting (2 glycine equivalents released per purine from the two serine-derived one-carbon units) so the net balance effect is +0.21 g/day.' },
  { id: 'glycine-hippurate-use-g-day', value: 0.6, low: 0.4, high: 0.8, unit: 'g/day', tissue: 'whole-body', species: 'human', source: 'article:beyoglu-2012-glycine-conjugation-review', locator: 'Abstract: 400-800 mg glycine/day is excreted as hippurate by glycine N-acyltransferase', confidence: 'estimated', note: '= 5.3-10.7 mmol/day (calc). Driven by dietary benzoate/polyphenols; Meléndez-Hevia 2009 mentions hippurate but does not include it in Table 2. Benzoate 4-10 g oral doses deplete the glycine pool (their reference to Jackson 1996).' },
  { id: 'glycine-bile-conjugation-net-g-day', value: 0.06, low: 0.03, high: 0.11, unit: 'g/day', tissue: 'liver', species: 'human', source: 'article:melendez-hevia-2009-glycine-weak-link', extraSources: ['article:chiang-2009-bile-acid-regulation'], locator: 'Meléndez-Hevia section 4.1.5/Table 2: net faecal loss 0.5 g/day of bile salts, 75% glycine conjugates = 0.8 mmol glycine/day = 60 mg. Chiang 2009 faecal loss 0.2-0.6 g/day (0.49-1.47 mmol/day, calc)', confidence: 'estimated', note: 'Net (de novo) conjugation need. The gross conjugation rate is ~6 mmol/day (0.45 g/day; Hepner 1972) because most conjugates are deconjugated by gut bacteria and reconjugated; the freed glycine is largely oxidised (52% of cholylglycine glycine-14C appeared in breath).' },
  { id: 'glycine-gnmt-sarcosine-use-g-day', value: 0.22, low: 0.14, high: 0.47, unit: 'g/day', tissue: 'liver', species: 'human', source: 'article:mudd-2007-methyl-balance', extraSources: ['article:melendez-hevia-2009-glycine-weak-link'], locator: 'flux-gnmt-glycine-sarcosine (1.9-6.2 mmol/day, central 2.9) x 75.07', confidence: 'estimated', note: 'Glycine consumed by GNMT is returned to the glycine pool when sarcosine is demethylated by SARDH (glycine-sarcosine cycle, "not net glycine synthesis"), so this is a cycling flux, not a net loss.' },
  { id: 'glycine-dietary-protein-g-day', value: 2.25, low: 1.5, high: 3.0, unit: 'g/day', tissue: 'gut', species: 'human', source: 'article:melendez-hevia-2009-glycine-weak-link', locator: 'Section 2.1: hydrolysis of dietary protein supplies 1.5-3 g glycine/day depending on diet quality (Gibson 2002); Table 4', confidence: 'estimated', note: 'Value is the midpoint. Free-glycine supplements are additional to this.' },
  { id: 'glycine-liver-free', value: 1660, low: 600, high: 4000, unit: 'uM', tissue: 'liver', species: 'mouse', source: 'article:teng-2011-bhmt-knockout-liver-pools', locator: 'Table 2: 5-week-old wild-type mouse liver glycine 1659 +/- 128 nmol/g (see glycine-liver-mouse). No human tissue value was found', confidence: 'estimated', note: 'KEY UNKNOWN for humans. The mouse value is used as a stand-in; low 600 and high 4000 are assumed bounds (a human liver sample could easily differ ~2-3x). Because GNMT Km(glycine) is 0.13-2 mM, how much a glycine load changes GNMT flux depends on where hepatic glycine sits relative to Km: at 1.66 mM and Km 1.1 mM the enzyme is ~60% saturated for glycine, so a 2-4x rise in hepatic glycine raises GNMT flux by only ~25-45% (calc). Run the simulation across the whole range rather than at a point value.' },
  { id: 'gcs-km-glycine', value: 6000, low: 5800, high: 6600, unit: 'uM', tissue: 'liver', species: 'chicken/rat', source: 'article:hayasaka-1980-gcs-p-protein-rat', extraSources: ['article:fujiwara-1983-gcs-chicken-liver'], locator: 'Hayasaka 1980 abstract: P-protein exchange reaction Km(glycine) 6.6 mM, H-protein Km 7.4 uM (rat liver). Fujiwara 1983 abstract: 5.8 mM glycine, H-protein 3.4 uM (chicken liver)', confidence: 'measured', note: 'Partial-reaction constants from purified P-protein, not whole-system human kinetics; high relative to intracellular glycine, so GCS flux should rise nearly linearly with hepatic glycine until saturation. A modelling paper (Nijhout 2009) uses the chicken value. GCS is regulated: 8x by free Ca2+ and 3-10x by glucagon in rat liver mitochondria (Jois 1992, abstract only).' },
  { id: 'phgdh-km-3pg', value: 255, low: 255, high: 360, unit: 'uM', tissue: 'liver', species: 'human', source: 'article:murtas-2021-human-phgdh', locator: 'Table 1: human recombinant PHGDH, Km(3-phosphoglycerate) 0.255 +/- 0.059 mM (PSAT-coupled) or 0.360 +/- 0.061 mM (hydrazine trap), kcat 1.48 and 2.97 /s, Km(NAD+) 0.15 mM, 37 C, pH 7.0', confidence: 'measured', note: 'Neither serine nor glycine inhibited the enzyme in this assay, so serine synthesis has no direct end-product brake at these levels. De novo serine synthesis in vivo: 218 (177-284) umol/kg lean mass/h in healthy-weight adults (Tan 2022).' },
  { id: 'glyat-s05-glycine', value: 23000, low: 23000, high: 23000, unit: 'uM', tissue: 'liver', species: 'human', source: 'article:rohwer-2021-human-glyat', locator: 'Table 3: recombinant human GLYAT (156Asn>Ser variant), s0.5 glycine 23 +/- 2 mM, Hill 1.6; s0.5 benzoyl-CoA 97 +/- 3 uM; kcat 0.48 /s', confidence: 'measured', note: 'Cooperative, not Michaelis-Menten. Single variant; earlier literature Km values vary widely. Glycine is far below s0.5 at plasma levels, so hippurate formation (and benzoate toxicity) is sensitive to glycine supply.' },
  { id: 'baat-km-glycine', value: 5800, low: 3950, high: 5800, unit: 'uM', tissue: 'liver', species: 'human', source: 'article:johnson-1991-baat-human-liver', extraSources: ['article:styles-2016-baat-recombinant'], locator: 'Johnson 1991 abstract: purified human liver BAAT Km(glycine) 5.8 mM, Vmax 0.77 umol/min/mg. Styles 2016 Table 1: recombinant human BAAT 3.95 mM, Vmax 8.69 nmol/min/mg', confidence: 'measured', note: 'Glycine Km is above the plasma glycine concentration, so the glycine:taurine conjugation ratio follows the hepatic amino-acid pools (taurine Km is 3-5x lower).' },
  { id: 'baat-km-taurine', value: 1100, low: 1100, high: 1860, unit: 'uM', tissue: 'liver', species: 'human', source: 'article:johnson-1991-baat-human-liver', extraSources: ['article:styles-2016-baat-recombinant'], locator: 'Johnson 1991: 1.1 mM, Vmax 0.33 umol/min/mg. Styles 2016: 1.86 mM, Vmax 21.7 nmol/min/mg', confidence: 'measured', note: 'CONTESTED which amino acid has the higher Vmax: Johnson 1991 (purified liver) gives glycine 0.77 vs taurine 0.33; Styles 2016 (recombinant, ping-pong) gives glycine 8.69 vs taurine 21.7 nmol/min/mg.' },
  { id: 'baat-km-cholyl-coa', value: 185, low: 185, high: 185, unit: 'uM', tissue: 'liver', species: 'human', source: 'article:styles-2016-baat-recombinant', locator: 'Table 1: recombinant human BAAT Km(cholyl-CoA) 0.185 mM', confidence: 'measured', note: 'Single determination (recombinant enzyme).' },

  // ---------------------------------------------------------------------------
  // F. Vitamin B6 / PLP
  // ---------------------------------------------------------------------------
  { id: 'plp-kd-shmt1', value: 0.85, low: 0.85, high: 27.5, unit: 'uM', tissue: 'cell', species: 'human', source: 'article:perry-2007-shmt-plp-mcf7', locator: 'Abstract/Methods: PLP dissociation constant of recombinant human cytosolic SHMT 850 nM (about 100x tighter than the bovine value 27.5 uM, as cited in the Introduction)', confidence: 'measured', note: 'Apo-protein spectroscopic titration. High = bovine value (secondary citation of Jones & Priest 1978).' },
  { id: 'plp-kd-cbs', value: 0.7, low: 0.7, high: 0.7, unit: 'uM', tissue: 'cell', species: 'human', source: 'article:perry-2007-shmt-plp-mcf7', locator: 'Introduction: human CBS PLP Kd 700 nM (citing Taoka 1999)', confidence: 'estimated', note: 'Second-hand: Taoka 1999 abstract states no Kd. CBS also needs heme for PLP binding (Kery 1994).' },
  { id: 'plp-kd-cystathionase', value: 1.4, low: 1.4, high: 1.4, unit: 'uM', tissue: 'cell', species: 'unspecified', source: 'article:perry-2007-shmt-plp-mcf7', locator: 'Introduction: PLP binds tightly to CBS (Kd = 700 nM) and cystathionase (Kd 1.4 uM)', confidence: 'estimated', note: 'Second-hand citation; species and enzyme source of the original measurement are not given, and it may not be the human CTH value. Single determination.' },
  { id: 'shmt1-plp-keff-fraction', value: 0.1, low: 0.03, high: 0.14, unit: 'x baseline cellular PLP', tissue: 'cell', species: 'human', source: 'article:perry-2007-shmt-plp-mcf7', locator: 'calc from abstract/Results: MCF-7 cells cultured 6 months, 49 nM pyridoxine: cellular PLP -72%, total SHMT activity -7%; 4.9 nM pyridoxine: PLP -75%, SHMT activity -27%, SAM -60%. Fitting activity = P/(K+P) to the two points gives K = 0.03 and 0.14 x baseline PLP', confidence: 'estimated', note: 'Effective half-saturation of SHMT activity expressed as a fraction of baseline intracellular PLP: the enzyme is ~88% saturated at baseline, so activity falls only mildly until PLP drops by more than ~70%. Mitochondrial SHMT is even less sensitive. Consistent with human B6 restriction raising glycine only modestly (Davis 2005, Lamers 2009: plasma PLP 55 -> 23 nmol/L, SHMT flux unchanged to +12%). Use as f_PLP = P/(K_eff + P) / (1/(K_eff + 1)) with P in baseline units.' },
  { id: 'cbs-plp-keff-fraction', value: 0.43, low: 0.3, high: 0.6, unit: 'x baseline cellular PLP', tissue: 'cell', species: 'human', source: 'article:lipson-1980-cbs-plp-fibroblasts', locator: 'calc from abstract: cultured human fibroblasts, CBS ~70% holoenzyme in standard medium falling to <10% in pyridoxal-free medium as cellular PLP fell >95%. For f = P/(K+P), f0 = 0.7 gives K = 0.43 x baseline; check: 0.05/(0.43+0.05) = 0.10', confidence: 'estimated', note: 'Cultured fibroblasts, not liver; range +/-~40% assumed. CBS is far more PLP-dependent than SHMT, which fits the observation that B6 restriction raises plasma cystathionine and lowers transsulfuration before it changes glycine or Hcy (Gregory 2013).' },
  { id: 'gad65-holoenzyme-fraction', value: 0.07, low: 0.07, high: 0.07, unit: 'fraction', tissue: 'brain', species: 'human', source: 'article:battaglioli-2003-gad-isoform-kinetics', locator: 'Abstract (existing entity): GAD65 is ~93% apoenzyme, i.e. ~7% holoenzyme; GAD67 ~72% holoenzyme', confidence: 'measured', note: 'Cells, steady state. GAD65 behaves as a PLP reservoir; the holo-to-apo conversion by glutamate is ~15x faster for GAD65, so GABA synthesis from GAD65 can respond to PLP supply within minutes.' },
  { id: 'gad67-holoenzyme-fraction', value: 0.72, low: 0.72, high: 0.72, unit: 'fraction', tissue: 'brain', species: 'human', source: 'article:battaglioli-2003-gad-isoform-kinetics', locator: 'Abstract (existing entity)', confidence: 'measured', note: 'See gad65-holoenzyme-fraction.' },
  { id: 'plp-plasma-baseline', value: 0.0526, low: 0.0215, high: 0.111, unit: 'uM', tissue: 'plasma', species: 'human', source: 'article:gregory-2013-b6-restriction-metabolomics', extraSources: ['article:davis-2005-b6-restriction-homocysteine', 'article:bor-2003-b6-supplement-plp-response'], locator: 'Gregory 2013 abstract/Table 3: 52.6 +/- 14.1 nmol/L (n=23, controlled diet); Davis 2005: 55; Lamers 2011: 49 +/- 4 nmol/L; Bor 2003 range 5-111 nmol/L in 90 CAD patients (CV 45% over 84 days)', confidence: 'measured', note: 'Healthy-adult plasma PLP. Thresholds: ~20 nmol/L usual deficiency cut-off (Ueland 2015); 30 nmol/L adequacy for a population mean (EFSA 2016); ~8.5-10 nmol/L overt deficiency on 0.05 mg/day (Kretsch 1991, via EFSA). Low = restricted-diet value 21.5.' },
  { id: 'plp-plasma-restricted-b6', value: 0.0215, low: 0.0169, high: 0.0261, unit: 'uM', tissue: 'plasma', species: 'human', source: 'article:gregory-2013-b6-restriction-metabolomics', extraSources: ['article:lamers-2011-b6-restriction-methionine-cycle', 'article:lamers-2009-b6-restriction-glycine'], locator: 'Gregory 2013: 52.6 -> 21.5 nmol/L after 28 days at <0.5 mg/day B6; Lamers 2011: 49 -> 19 nmol/L; Lamers 2009: 55 -> 23', confidence: 'measured', note: 'Marginal deficiency. Fall is ~60% in 28 days.' },
  { id: 'plp-plasma-50mg-b6', value: 0.1445, low: 0.0845, high: 0.2367, unit: 'uM', tissue: 'plasma', species: 'human', source: 'article:chiang-2005-b6-ra-plp-response', extraSources: ['article:bor-2003-b6-supplement-plp-response'], locator: 'Chiang 2005 Table 2: median plasma PLP 27.0 (20.4-30.9) -> 144.5 (84.5-236.7) nmol/L after 50 mg/day pyridoxine for 30 days (rheumatoid arthritis patients with low PLP, n=14). Bor 2003: 40 mg/day gave ~10x baseline by day 3 with no further rise to day 84', confidence: 'measured', note: 'Range is the printed interquartile range. B6 supplementation saturates quickly; no data on 1.5 mg vs 25-50 mg head-to-head were found.' },
  { id: 'cystathionine-rise-b6-restriction', value: 52, low: 52, high: 66, unit: '% increase', tissue: 'plasma', species: 'human', source: 'article:gregory-2013-b6-restriction-metabolomics', extraSources: ['article:lamers-2011-b6-restriction-methionine-cycle'], locator: 'Gregory 2013 Table 3: 131 +/- 65 -> 199 +/- 56 nmol/L (+52%), n=23. Lamers 2011 abstract: 142 +/- 8 -> 236 +/- 9 nmol/L (+66%), n=9; PLP 49 -> 19 nmol/L', confidence: 'measured', note: 'The most reliable human functional marker of marginal B6 deficiency in these studies; plasma Hcy (6.97 +/- 1.3 uM, unchanged) and methionine-cycle fluxes did not change.' },
  { id: 'glycine-rise-b6-restriction', value: 29, low: 10, high: 29, unit: '% increase', tissue: 'plasma', species: 'human', source: 'article:davis-2005-b6-restriction-homocysteine', extraSources: ['article:gregory-2013-b6-restriction-metabolomics', 'article:lamers-2009-b6-restriction-glycine'], locator: 'Davis 2005 (existing): plasma glycine 230 -> 296 uM (+29%). Gregory 2013 Table 3: 357 +/- 83 -> 393 +/- 95 uM (+10%, adjusted P=0.28)', confidence: 'measured', note: 'CONTESTED (size and significance). Serine +12% fasting in da Silva 2013, not significant in Gregory 2013. Baseline glycine differs by ~125 uM between cohorts, so method or feeding state differs.' },

  // ---------------------------------------------------------------------------
  // G. Histamine / DAO
  // ---------------------------------------------------------------------------
  { id: 'dao-km-histamine', value: 19, low: 2.8, high: 19, unit: 'uM', tissue: 'gut', species: 'human', source: 'article:biegan-1983-human-intestinal-dao', extraSources: ['article:elmore-2002-human-kidney-dao', 'article:klocker-2004-plasma-dao-heparin'], locator: 'Biegański 1983 abstract: native human colonic mucosa DAO Km(histamine) 1.9x10^-5 M = 19 uM, Km(putrescine) 83 uM, Km(Ntau-methylhistamine) 97 uM, aminoguanidine IC50 11 nM. Elmore 2002: recombinant human kidney DAO 2.8 uM', confidence: 'measured', note: 'CONTESTED 7-fold (native intestine vs recombinant kidney). Intestinal mucosal DAO is the physiologically relevant gut barrier; the plasma enzyme is at the limit of detection in healthy people (Klocker 2004) and heparin-inducible, so circulating DAO is a poor proxy for gut activity. DAO is negligible in the CNS (Yoshikawa 2019; Naganuma 2017).' },
  { id: 'dao-ic50-aminoguanidine', value: 0.011, low: 0.011, high: 0.011, unit: 'uM', tissue: 'gut', species: 'human', source: 'article:biegan-1983-human-intestinal-dao', locator: 'Abstract: IC50 1.1x10^-8 M', confidence: 'measured', note: 'Quantitative anchor for a pharmacological DAO block. No Ki/IC50 values were found for alcohol, isoniazid, verapamil or clavulanate in human DAO.' },
  { id: 'histamine-plasma-baseline', value: 0.00875, low: 0.0042, high: 0.0113, unit: 'uM', tissue: 'plasma', species: 'human', source: 'article:cho-2013-histamine-dao-urticaria', extraSources: ['article:mita-1980-plasma-histamine-gcms'], locator: 'Abstract: 8.75 +/- 2.55 nM in 25 healthy controls (EIA); 0.97 ng/mL x 111.15 g/mol. A GC-MS study gave 0.83 +/- 0.37 ng/mL = 7.5 +/- 3.3 nM (Mita 1980)', confidence: 'measured', note: 'Range is the lower bound of the GC-MS series (7.5-3.3) to the upper bound of the EIA series (8.75+2.55); hence slightly asymmetric about the value. Plasma histamine is ~1 nM-scale and rapidly cleared; tissue (mast cell, ECL) pools are not measured here.' },
  { id: 'histamine-half-life-iv', value: 4.0, low: 3.0, high: 6.2, unit: 'min', tissue: 'plasma', species: 'human', source: 'article:pollock-1991-plasma-histamine-infusion', locator: 'Abstract: half-life after stopping an IV infusion 4.0 +/- 0.7 min (non-atopic), 3.0 +/- 1.2 (atopic), 6.2 +/- 1.3 (urticaria)', confidence: 'measured', note: 'k = ln2/4 min = 0.17 /min = 10.4 /h (calc). A subcutaneous-dose t1/2 of 0.5-1.0 h in another study reflects absorption, not clearance.' },
  { id: 'dao-plasma-elisa-median', value: 18, low: 14, high: 22, unit: 'U/mL', tissue: 'plasma', species: 'human', source: 'article:arih-2023-serum-dao-hit', extraSources: ['article:van-odijk-2023-serum-dao-population'], locator: 'Arih 2023 abstract: healthy controls median 18 (IQR 14-22) U/mL, n=50 (ELISA); van Odijk 2023: population median 11.1 U/mL, 44% of 1051 adults below the 10 U/mL "low DAO" cut-off, no association with histamine-food symptoms', confidence: 'measured', note: 'CONTESTED as a diagnostic. ELISA U/mL measures immunoreactive protein, not activity; the activity unit HDU/mL (1 HDU = 1 pmol/mL histamine degraded; normal >80) is not interchangeable. Not used as a kinetic parameter.' },
  { id: 'histamine-night-plasma-ratio', value: 2.0, low: 1.0, high: 2.0, unit: 'fold (04:00 vs 16:00)', tissue: 'plasma', species: 'human', source: 'article:szefler-1991-nocturnal-histamine', extraSources: ['article:rehn-1987-histamine-circadian', 'article:schulze-1992-urinary-histamine-no-rhythm', 'article:imamura-1984-urinary-histamine-food'], locator: 'Szefler 1991 abstract: plasma histamine ~2x higher at 04:00 than at 16:00 in all groups including 10 normal subjects. Rehn 1987: 12 volunteers, three maxima (acrophases 12.8, 19.3 and 5.4 +/- 1.8 h), early-morning rise ~55% of total. Schulze 1992: no urinary histamine rhythm in 14 children', confidence: 'measured', note: 'Partial support for "histamine peaks 2-4 am" (claim:histamine-peaks-2-4am): the rise is real in plasma and sits around 04:00-06:00, but one study shows three daily maxima and a urine study shows no rhythm; urinary metabolites follow food intake (Imamura 1984, abstract). Low = 1.0 means no rhythm.' },

  // ---------------------------------------------------------------------------
  // H. Bile acids and amino-acid conjugation
  // ---------------------------------------------------------------------------
  { id: 'bile-glycine-conjugate-fraction', value: 0.75, low: 0.7, high: 0.8, unit: 'fraction of conjugated bile acids', tissue: 'bile', species: 'human', source: 'article:chiang-2013-bile-acid-metabolism-signaling', extraSources: ['article:hofmann-2014-enterohepatic-circulation'], locator: 'Chiang 2013 (existing entity): glycine : taurine conjugates about 3 : 1 in human bile. Meléndez-Hevia 2009 uses 75% glycine conjugates', confidence: 'measured', note: 'Range is assumed (+/-0.05). Over 95% taurine-conjugated in mice. Taurine supplementation at 3 g/day reverses the ratio (Hardison & Grundy 1983, 6 men, 2 weeks) with small effects on pool size and faecal loss, so the human ratio is amino-acid-supply sensitive; glycine supplementation effects on the ratio were NOT FOUND.' },
  { id: 'bile-acid-pool-g', value: 3, low: 2, high: 4, unit: 'g', tissue: 'enterohepatic', species: 'human', source: 'article:chiang-2013-bile-acid-metabolism-signaling', extraSources: ['article:chiang-2009-bile-acid-regulation', 'article:hofmann-2014-enterohepatic-circulation', 'article:northfield-1975-bile-acid-pool-size'], locator: 'Chiang 2013: pool ~3 g (about 40% cholic, 40% chenodeoxycholic, 20% deoxycholic); Chiang 2009: recycled 4-12 times/day', confidence: 'estimated', note: 'Range assumed. Pool size and cycling frequency are inversely related so secretion stays roughly constant (Northfield & Hofmann 1975).' },
  { id: 'bile-acid-cycles-per-day', value: 8, low: 4, high: 12, unit: '1/day', tissue: 'enterohepatic', species: 'human', source: 'article:chiang-2009-bile-acid-regulation', locator: 'Enterohepatic circulation text: 4-12 cycles per day', confidence: 'measured', note: 'Value is the midpoint.' },
  { id: 'bile-acid-synthesis-g-day', value: 0.5, low: 0.2, high: 0.6, unit: 'g/day', tissue: 'liver', species: 'human', source: 'article:chiang-2009-bile-acid-regulation', extraSources: ['article:chiang-2013-bile-acid-metabolism-signaling'], locator: 'Chiang 2009: 0.2-0.6 g/day synthesis = faecal loss; Chiang 2013: ~0.5 g/day (about 5% of the pool per day)', confidence: 'measured', note: '= 0.49-1.47 mmol/day at 408.6 g/mol (calc). Hofmann & Hagey 2014: the returning flux is >=20x the new synthesis, and total secretion ~12 g/day from duodenal-perfusion studies (Mayo).' },
  { id: 'bile-acid-secretion-g-day', value: 12, low: 12, high: 12, unit: 'g/day', tissue: 'enterohepatic', species: 'human', source: 'article:hofmann-2014-enterohepatic-circulation', locator: 'Enterohepatic circulation section: ~12 g/day secreted, from duodenal perfusion studies (Go 1970, Brunner 1974) as reported in the review', confidence: 'estimated', note: '~25 mmol/day at a mean conjugate MW of ~470 (calc). Meléndez-Hevia 2009 quotes ~20 g/day, 97.5% reabsorbed. Single estimate; no spread.' },
  { id: 'glycine-bile-conjugation-gross-mmol-day', value: 6, low: 6, high: 6, unit: 'mmol/day', tissue: 'liver', species: 'human', source: 'article:hepner-1972-glycine-conjugated-dihydroxy-bile-acids', extraSources: ['article:hepner-1972-cholylglycine-turnover'], locator: 'Hepner 1972 II abstract (final sentence): about 6 mmol/day of glycine used for bile acid conjugation in healthy people; Hepner 1972 I: glycine moiety turnover 106 +/- 17%/day vs 38 +/- 7%/day for the cholyl moiety', confidence: 'estimated', note: 'Gross (including reconjugation of bacterially deconjugated bile acids); the net de novo need is ~0.4-1.1 mmol/day (calc from 0.2-0.6 g/day synthesis at 75% glycine conjugates). My cross-check: 3 g pool = ~6.4 mmol x 0.75 x 106%/day ~= 5 mmol/day, consistent. Single study, 1970s kinetic assumptions.' },
  { id: 'bile-deconjugation-per-cycle', value: 0.18, low: 0.18, high: 0.18, unit: 'fraction per enterohepatic cycle', tissue: 'gut', species: 'human', source: 'article:hepner-1972-cholylglycine-turnover', extraSources: ['article:hamilton-2007-cecal-bile-acids'], locator: 'Hepner 1972 I abstract: 18% of the cholylglycine pool deconjugated per cycle, absorption 90-95% per cycle, 52 +/- 5% of the cholylglycine glycine-14C dose recovered as breath CO2. Hamilton 2007: caecal bile acids 90 +/- 9% unconjugated', confidence: 'measured', note: 'Freed glycine is largely oxidised (breath CO2), i.e. bile acid cycling is a glycine drain only to the extent of de novo conjugation plus losses.' },

  // ---------------------------------------------------------------------------
  // I. Gastric acid, bicarbonate and gas (algebraic, ODE-ready constants)
  // ---------------------------------------------------------------------------
  { id: 'gastric-bao', value: 5.1, low: 3.0, high: 6.5, unit: 'mmol/h', tissue: 'stomach', species: 'human', source: 'article:katelaris-1993-gastric-acid-age-hpylori', locator: 'Abstract: healthy men without gastric atrophy, basal acid output 5.1 (0.7) mmol/h; with atrophy 3.0 (1.1); n=22 young + 28 old; error type not stated', confidence: 'measured', note: 'Men only. Low = atrophy group mean; high = value + 2 x printed spread (assumed SE). A tertiary reference range quoted in a nursing encyclopaedia is 0-5 (men) and 0-4 (women) mmol/h (not primary; low confidence).' },
  { id: 'gastric-pao', value: 22, low: 13.7, high: 43.4, unit: 'mmol/h', tissue: 'stomach', species: 'human', source: 'article:mccoll-1993-hpylori-negative-duodenal-ulcer', extraSources: ['article:katelaris-1993-gastric-acid-age-hpylori', 'article:dubey-1983-acid-alkali-in-situ-titration', 'article:taylor-1978-pentagastrin-oxo-meal-titration'], locator: 'McColl 1993 abstract: median peak acid output 22 (16-29) mmol/h in H. pylori-negative non-ulcer controls. Katelaris 1993: PAO 43.4 in healthy men without atrophy. Dubey 1983: pentagastrin 17.2 +/- 1.4 (simultaneous) vs 15.4 +/- 1.9 mmol/h (aspiration). Taylor 1978: 13.7 +/- 2.1', confidence: 'measured', note: 'CONTESTED 3-fold across studies: method (pentagastrin dose, peak vs maximal definitions), population (sex, H. pylori status, age) differ. H. pylori-positive subjects secrete more (duodenal ulcer 37-40 mmol/h).' },
  { id: 'gastric-mao', value: 31.4, low: 18.9, high: 35.0, unit: 'mmol/h', tissue: 'stomach', species: 'human', source: 'article:katelaris-1993-gastric-acid-age-hpylori', locator: 'Abstract: pentagastrin-stimulated maximal acid output 31.4 (1.8) mmol/h without atrophy vs 18.9 (4.0) with atrophy', confidence: 'measured', note: 'Men. High = value + 2 x spread (assumed SE).' },
  { id: 'gastric-acid-24h', value: 208.3, low: 189.8, high: 226.8, unit: 'mmol/24 h', tissue: 'stomach', species: 'human', source: 'article:feldman-1986-24h-acid-secretion', extraSources: ['article:kalantzi-2006-gastric-buffer-capacity'], locator: 'Abstract: total 24-h acid secretion 208.3 +/- 18.5 mmol in 7 normal subjects (duodenal ulcer 408.3 +/- 61.7, n=8); aspiration for basal/nocturnal, in-vivo titration for meals', confidence: 'measured', note: 'Range = printed +/- (error type not stated). This is secreted acid, much of which is buffered by food (buffer capacity 14-28 mmol/L/pH unit after a liquid meal; Kalantzi 2006), not neutralised by bicarbonate. Cimetidine 400 mg twice daily brings duodenal-ulcer patients to 235 mmol/day.' },
  { id: 'gastric-meal-acid-output', value: 15.8, low: 14.1, high: 17.5, unit: 'mmol/h', tissue: 'stomach', species: 'human', source: 'article:dubey-1983-acid-alkali-in-situ-titration', locator: 'Abstract: meal-stimulated (food) acid output 15.8 +/- 1.7 mmol/h in 10 controls, alkali 18.2 +/- 1.3 mmol/h; duodenal ulcer 31.9 +/- 2.2 vs alkali 21.9', confidence: 'measured', note: '"Normal subjects secrete equal amounts of acid and alkali" (authors). Range = printed +/- (error type not stated).' },
  { id: 'gastric-hcl-concentration', value: 158, low: 126, high: 200, unit: 'mM', tissue: 'stomach', species: 'human', source: 'article:baratta-2019-parietal-cell-acid-secretion', locator: 'Review text: parietal secretion at pH ~0.8 (from 7.4, ~4 million-fold gradient); [H+] = 10^-0.8 = 158 mM (calc)', confidence: 'estimated', note: 'Range = pH 0.9-0.7 (assumed). Canalicular pH <1.0 (Shin & Kim 2013).' },
  { id: 'gastric-ph-fasting', value: 1.7, low: 1.0, high: 2.5, unit: 'pH', tissue: 'stomach', species: 'human', source: 'article:dressman-1990-upper-gi-ph', extraSources: ['article:delchier-1997-omeprazole-24h-acidity'], locator: 'Dressman 1990 abstract: median fasted gastric pH 1.7 (Heidelberg capsule, young healthy men and women). Delchier 1997: 24-h median 1.7 before omeprazole, time at pH<4 = 89%', confidence: 'measured', note: 'Median only; the range is assumed. Duodenal pH 6.1 fasted, 5.4 fed.' },
  { id: 'gastric-ph-fed-peak', value: 6.7, low: 5.0, high: 7.4, unit: 'pH', tissue: 'stomach', species: 'human', source: 'article:dressman-1990-upper-gi-ph', locator: 'Abstract: after a standard solid-liquid meal gastric pH climbed briefly to a median peak of 6.7 then declined back to fasted values in <2 h', confidence: 'measured', note: 'Median peak value; range assumed. Return time is the model constant gastric-ph-recovery-h.' },
  { id: 'gastric-ph-recovery-h', value: 1.5, low: 0.5, high: 2.0, unit: 'h', tissue: 'stomach', species: 'human', source: 'article:dressman-1990-upper-gi-ph', locator: 'Abstract: back to fasted-state pH over a period of less than 2 hr', confidence: 'estimated', note: 'Only the upper bound (<2 h) is published; value and low are assumed.' },
  { id: 'gastric-time-ph-below-4-untreated', value: 0.89, low: 0.89, high: 0.89, unit: 'fraction of 24 h', tissue: 'stomach', species: 'human', source: 'article:delchier-1997-omeprazole-24h-acidity', locator: 'Abstract: mean percentage of time at pH<4 89% before treatment (n=16 healthy)', confidence: 'measured', note: 'Omeprazole 20 mg once daily for 7 days: median pH 1.7 -> 4.6 and time at pH<4 89% -> 35%; 40 mg: 1.9 -> 4.3 and 89% -> 34%, stable for 3 months.' },
  { id: 'ppi-omeprazole20-acidity-reduction-day1', value: 0.18, low: 0.18, high: 0.18, unit: 'fraction of integrated 24-h acidity', tissue: 'stomach', species: 'human', source: 'article:cederberg-1993-omeprazole-24h-acidity', locator: 'Abstract: oral omeprazole 20 mg reduced integrated intragastric acidity by 18% on day 1 and 60% on day 5 (9 healthy subjects)', confidence: 'measured', note: 'Effect builds over days because covalently inhibited pumps accumulate; IV 40 mg gives 71% on day 1.' },
  { id: 'ppi-omeprazole20-acidity-reduction-day5', value: 0.6, low: 0.6, high: 0.6, unit: 'fraction of integrated 24-h acidity', tissue: 'stomach', species: 'human', source: 'article:cederberg-1993-omeprazole-24h-acidity', locator: 'Abstract (see day 1)', confidence: 'measured', note: 'Steady state ~ day 5-7.' },
  { id: 'ppi-pump-recovery-halflife-h', value: 28, low: 28, high: 46, unit: 'h', tissue: 'stomach', species: 'human', source: 'article:shin-2002-ppi-acid-secretion-recovery', extraSources: ['article:shin-2013-ppi-mechanism-review'], locator: 'Abstract: human half-life of the inhibitory effect on acid secretion ~28 h (omeprazole) and ~46 h (pantoprazole); rat pump protein half-life 54 h, recovery of secretion after omeprazole t1/2 ~15 h', confidence: 'measured', note: 'Pump resynthesis plus disulfide reactivation. Shin & Kim 2013 (review): about 20% of pumps are replaced per 24 h "probably in man"; PPI plasma t1/2 ~1 h; PPI pKa ~4. This is the rebound/recovery time constant for a stop-PPI scenario (see also Reimer 2009 rebound acid hypersecretion, in repo).' },
  { id: 'ppi-relative-potency-esomeprazole', value: 1.6, low: 1.6, high: 1.6, unit: 'x omeprazole (mean 24-h pH)', tissue: 'stomach', species: 'human', source: 'article:kirchheiner-2009-ppi-relative-potency', locator: 'Abstract: meta-analysis of 57 studies; potencies vs omeprazole = 1.00: pantoprazole 0.23, lansoprazole 0.90, esomeprazole 1.60, rabeprazole 1.82; GERD patients need 1.9x the dose, H. pylori-positive ~20% of the dose', confidence: 'measured', note: 'GERD patients, not healthy; potency estimates "must be viewed with caution" (authors).' },
  { id: 'gastric-fasting-volume-ml', value: 35, low: 28, high: 42, unit: 'mL', tissue: 'stomach', species: 'human', source: 'article:mudie-2014-gi-fluid-volumes-fasted', locator: 'Abstract: fasted stomach contained 35 +/- 7 mL (mean +/- SEM) of resting water (n=12, MRI); a 240 mL drink empties with T50% 13 +/- 1 min and gastric volume returns to baseline by 45 min', confidence: 'measured', note: 'Range = +/- SEM; the between-subject SD is ~24 mL (calc).' },
  { id: 'gastric-secretion-net-ml-h-postmeal', value: 52, low: 23, high: 81, unit: 'mL/h', tissue: 'stomach', species: 'human', source: 'article:hoad-2015-gastric-secretion-volume-mri', locator: 'Results: mean increase of gastric content of 52 +/- 29 mL over the first 60 min after a mixed meal (secretion volume 64 +/- 51 mL at 15 min, 110 +/- 40 at 75 min; n=24 MRI)', confidence: 'measured', note: 'NET of emptying; gross secretion is higher. Range = +/- SD.' },
  { id: 'duodenal-hco3-basal-umol-cm-h', value: 185, low: 143, high: 198, unit: 'umol/cm/h', tissue: 'duodenum', species: 'human', source: 'article:isenberg-1987-duodenal-bicarbonate-ulcer', extraSources: ['article:isenberg-1986-duodenal-bulb-bicarbonate', 'article:mertz-nielsen-1996-omeprazole-duodenal-bicarbonate'], locator: 'Isenberg 1987 abstract: basal duodenal bulb bicarbonate 185 +/- 13 umol/cm/h in 16 normal subjects (107 +/- 18 in 12 duodenal ulcer patients); Isenberg 1986: 143 +/- 17 (4-cm isolated segment)', confidence: 'measured', note: 'Per cm of a 4-cm bulb segment; per segment ~0.57-0.74 mmol/h. Whole-duodenum totals are uncertain (a whole-segment perfusion study gives 597 +/- 48 umol/h basal under omeprazole, 351 +/- 39 without).' },
  { id: 'duodenal-hco3-acid-stimulated-umol-cm-h', value: 642, low: 565, high: 719, unit: 'umol/cm/h', tissue: 'duodenum', species: 'human', source: 'article:isenberg-1987-duodenal-bicarbonate-ulcer', extraSources: ['article:isenberg-1986-duodenal-bulb-bicarbonate', 'article:feitelberg-1992-duodenal-bicarbonate-ph-threshold'], locator: 'Isenberg 1987 abstract: peak after 2 mmol HCl in 5 min 642 +/- 77 (normal) vs 263 +/- 65 (duodenal ulcer). Isenberg 1986: 167 / 199 / 278 after 25 / 50 / 100 mM HCl', confidence: 'measured', note: 'Acid-stimulated bicarbonate rises 3-4x within minutes; response threshold at luminal pH ~3.0 (Feitelberg 1992, abstract).' },
  { id: 'gastric-hco3-basal-umol-h', value: 382, low: 320, high: 444, unit: 'umol/h', tissue: 'stomach', species: 'human', source: 'article:mertz-nielsen-1995-gastric-duodenal-bicarbonate', locator: 'Abstract: basal gastric bicarbonate 382 (62) umol/h rising to 959 (224) with sham feeding (n=9); duodenal bulb 191 +/- 14 -> 634 +/- 157 umol/cm/h after 20 mL 0.1 M HCl', confidence: 'measured', note: 'Range = printed spread (SE assumed). Gastric surface bicarbonate concentration in mM was NOT FOUND; only "near-neutral pH" at the mucosal surface.' },
  { id: 'pancreatic-hco3-max-mmol-h', value: 33, low: 29, high: 37, unit: 'mmol/h', tissue: 'pancreas', species: 'human', source: 'article:hacki-1977-secretin-bicarbonate', extraSources: ['article:domschke-1976-pure-pancreatic-juice'], locator: 'Hacki 1977 abstract: maximal secretin-stimulated bicarbonate output 33 +/- 4 mEq/h (n=6, duodenal recovery). Domschke 1976: pure pancreatic juice peak 135 +/- 9 mM, maximum 383 uEq/h/kg (= 26.8 mEq/h at 70 kg, calc)', confidence: 'measured', note: 'Maximal stimulated output; meal-stimulated alkali is about 18 mmol/h (Dubey 1983). Bicarbonate is monovalent so mEq = mmol.' },
  { id: 'pancreatic-juice-hco3-mM', value: 135, low: 126, high: 144, unit: 'mM', tissue: 'pancreas', species: 'human', source: 'article:domschke-1976-pure-pancreatic-juice', locator: 'Abstract: peak bicarbonate concentration 135 +/- 9 mM at 32.2 ng/kg/h secretin (n=7, endoscopic cannulation)', confidence: 'measured', note: 'Maximal concentration; concentration falls at low flow.' },
  { id: 'co2-molar-volume-37c-ml-per-mmol', value: 25.45, low: 25.45, high: 27.13, unit: 'mL/mmol', tissue: 'stomach', species: 'human', source: 'calc:ideal-gas-co2-37c', locator: 'Vm = RT/P with R = 8.314462618 J/mol/K, T = 310.15 K, P = 101.325 kPa = 25.450 L/mol. 24.465 at 298.15 K, 22.414 at 273.15 K. High = 25.45 x 760/(760-47) = 27.13 for a gas phase saturated with water vapour (47 mmHg at 37 C)', confidence: 'estimated', note: 'Brief check: the 24.5 mL/mmol at 25 C and 25.4-25.5 at 37 C figures are both confirmed; 0.1 mL/mmol rounding. The water-vapour pressure at 37 C is a textbook constant, not sourced from an article. Real CO2 is slightly non-ideal (not quantified). 1 mmol HCl neutralised by bicarbonate yields at most 1 mmol CO2.' },
  { id: 'co2-solubility-37c-mmol-l-mmhg', value: 0.0332, low: 0.0303, high: 0.044, unit: 'mmol/L/mmHg', tissue: 'stomach', species: 'in-silico', source: 'article:ltaief-2021-co2-blood-solubility', locator: 'NIST WebBook (Sander compilation) CO2 kH 0.034 mol/kg/bar at 298.15 K (entries 0.031-0.045), d ln kH/d(1/T) = 2400 K -> 0.0249 mol/kg/bar at 310.15 K = 0.0332 mmol/L/mmHg (calc). Blood/plasma: 0.03 mmol/L/mmHg, 0.52 mL/mL (Ltaief 2021)', confidence: 'estimated', note: 'Water value from a compilation without primary citations; range propagates the 0.031-0.045 spread to 37 C (calc). Dissolved CO2 is a fixed offset: 200 mL of fluid at PCO2 144 mmHg holds ~0.96 mmol CO2, so small neutralisation events stay largely dissolved.' },
  { id: 'gastric-pco2-basal-mmhg', value: 63, low: 44, high: 82, unit: 'mmHg', tissue: 'stomach', species: 'human', source: 'article:kolkman-1994-intragastric-pco2', locator: 'Abstract: intragastric PCO2 8.40 +/- 2.53 kPa (= 63 +/- 19 mmHg) basally; 19.2 +/- 5.87 kPa (144 +/- 44 mmHg) after 500 mg NaHCO3 (n=10, saline tonometry); with ranitidine (gastric pH 5.6) 5.60 kPa (42 mmHg), ~blood', confidence: 'measured', note: 'Range +/- SD (calc from kPa). The PCO2 excess over blood comes from acid-bicarbonate buffering in the stomach itself.' },
  { id: 'gastric-pco2-after-nahco3-mmhg', value: 144, low: 100, high: 188, unit: 'mmHg', tissue: 'stomach', species: 'human', source: 'article:kolkman-1994-intragastric-pco2', locator: 'Abstract (see basal)', confidence: 'measured', note: '500 mg NaHCO3 = 5.95 mmol = ~151 mL CO2 at 37 C if all reacted (calc). 1 g NaHCO3 (84.006 g/mol) = 11.90 mmol = 303 mL at 37 C, 291 mL at 25 C, 267 mL at 0 C; the widely quoted "~270 mL/g" is the 0 C value.' },
  { id: 'duodenal-pco2-max-mmhg', value: 400, low: 200, high: 400, unit: 'mmHg', tissue: 'duodenum', species: 'dog/human', source: 'article:akiba-2011-duodenal-co2-sensing', locator: 'Review text: duodenal luminal PCO2 up to ~400 mmHg after acid, falling in the jejunum through rapid absorption', confidence: 'estimated', note: 'Review statement resting on canine data; primary human data not verified. Low is assumed.' },
  { id: 'intestinal-gas-volume-ml', value: 100, low: 71, high: 200, unit: 'mL', tissue: 'gut', species: 'human', source: 'article:bendezu-2015-ct-intestinal-gas', extraSources: ['article:lasser-1975-intestinal-gas-volume', 'article:azpiroz-2005-intestinal-gas-review'], locator: 'Bendezú 2015 abstract: median 95 (IQR 71-141) mL by CT in 37 healthy people. Lasser 1975: 199 +/- 31 mL (washout, n=10). Azpiroz 2005: "about 200 mL"', confidence: 'measured', note: 'CONTESTED 2-fold by method. This is the TOTAL gut gas at any instant, which bounds how much bicarbonate-derived CO2 can ever be present as gas.' },
  { id: 'flatus-ml-per-day', value: 705, low: 476, high: 1491, unit: 'mL/day', tissue: 'colon', species: 'human', source: 'article:tomlin-1991-normal-flatus', locator: 'Abstract (existing entity): total 476-1491 (median 705) mL/24 h on a normal diet plus beans; CO2 median 68 (25-116) mL/24 h; fibre-free diet total 214, CO2 6 mL', confidence: 'measured', note: 'CO2 is only ~10% of flatus. Acid-bicarbonate CO2 is overwhelmingly absorbed: 208 mmol/day of acid, if all neutralised by bicarbonate, could give 5.3 L of CO2 (calc, 208.3 x 25.45 mL), versus ~0.07 L CO2 appearing as flatus.' },
  { id: 'air-swallows-per-hour-fasting', value: 21.5, low: 8.8, high: 34.2, unit: '1/h', tissue: 'oesophagus', species: 'human', source: 'article:bredenoord-2004-belching-impedance-healthy', extraSources: ['article:hemmink-2009-aerophagia-24h-impedance'], locator: 'Table 1: 14 healthy volunteers, fasting: swallows 79.5 (8.5), air swallows 21.5 (3.4), gastric gas reflux 4.7 (1.0) per hour (SEM); postprandial 64.2 (6.1), 24.4 (2.8), 3.0 (0.6)', confidence: 'measured', note: 'About one swallow in three carries air. Range = +/- SD (calc = SEM x sqrt(14)). Gastric belches 3-5 per hour normally (text of the same paper). Patients with suspected aerophagia: 521 air swallows and 126 gastric belches per 24 h (Hemmink 2009).' },
  { id: 'air-per-liquid-swallow-ml', value: 20, low: 8, high: 32, unit: 'mL', tissue: 'oesophagus', species: 'human', source: 'article:pouderoux-1996-swallowed-air-ct', locator: 'Abstract: 8-32 mL of air accompanying each 10 mL liquid swallow (ultrafast CT, n=7)', confidence: 'estimated', note: 'Value is the midpoint. Applies to 10 mL liquid boluses only; do not multiply by swallow counts to get a daily total (would be implausibly large), and the impedance "air swallows" of Bredenoord 2004 are not calibrated in mL. No literature value was found for swallowed air per day or per belch.' },
  { id: 'gastric-gas-fraction-passed-distally', value: 0.8, low: 0.22, high: 1.0, unit: 'fraction', tissue: 'stomach', species: 'human', source: 'article:caballero-2018-gastric-gas-fate', locator: 'Abstract: 1500 mL gas infused; rectal evacuation 1198 +/- 176 mL in 90 min (sham 187 +/- 94); belchers (n=6): 14 +/- 2 belches, 330 +/- 112 mL rectal; non-belchers (n=12): 1 +/- 1 belch, 1630 +/- 147 mL rectal', confidence: 'estimated', note: 'Fraction = 1198/1500. Most gastric gas is passed distally; belching and rectal evacuation are inversely related. The infused gas mixture is not stated in the abstract so applicability to CO2 (rapidly absorbed) is unclear. Gas venting depends on TLESR-like relaxations and posture (Wyman 1990 6.8 vs 1.2 events/10 min seated vs supine, not included).' },
  { id: 'cola-gastric-gas-ml', value: 600, low: 600, high: 600, unit: 'mL', tissue: 'stomach', species: 'human', source: 'article:ploutz-snyder-1999-carbonated-beverage-gastric-gas', locator: 'Abstract: about 600 mL of gas in the stomach after 800 mL cola (MRI, n=8); gastric half-time of cola 107 +/- 8 min vs water 21 +/- 3 min', confidence: 'measured', note: 'A carbonated drink gives ~0.6 L of gastric gas, 2-6x the entire resting gut gas volume, yet a normal day of acid + bicarbonate would generate ~5 L at the extreme: the contrast shows how little of the latter is expected to persist as gas.' },
  ],

  // Pools that appear in reactionLaws but are owned by B1 or treated as fixed inputs. Names follow the ontology compound slug.
  externalSpecies: ['1-methylnicotinamide', '3-methoxytyramine', '3-phosphoglycerate', '3-phosphohydroxypyruvate', '5-10-methylene-thf', '5-mthf', 'acetyl-coa', 'acetylcholine', 'ammonia', 'arginine', 'betaine-aldehyde', 'bicarbonate', 'carbon-dioxide', 'cholate', 'choloyl-coa', 'coa', 'creatine', 'dopamine', 'glycocholic-acid', 'guanidinoacetate', 'hippuric-acid', 'homocysteine', 'hydrochloric-acid', 'imidazole-acetaldehyde', 'methionine', 'methylhistamine', 'nad', 'nadh', 'nicotinamide', 'ornithine', 'oxygen', 'phosphatidylethanolamine', 'phosphocholine', 'proton', 'sah', 'sam', 'taurine', 'taurocholic-acid', 'thf'],

  species: [
  // Compartment suffix: -plasma = circulating pool, -liver = hepatocyte pool. Where only plasma is known the
  // plasma value is given for a pool treated as single (dimethylglycine, sarcosine).
  { id: 'choline-plasma', name: 'Free choline (plasma)', initial: 9.9, unit: 'uM', low: 7.6, high: 12.2, compartment: 'plasma', species: 'human', source: 'article:konstantinova-2008-plasma-choline-betaine-hordaland', ontologyId: 'compound:choline', note: 'Mean +/- SD of 9.9 +/- 2.3 (n=7074, ages 47-74). Fasting 9.5 +/- 0.5 falling to 7.8 after a 7-day fast (Savendahl 1997); 9.6 (8.5-10.6) in 12 adults (Mödinger 2019).' },
  { id: 'choline-liver', name: 'Free choline (liver)', initial: 84, unit: 'uM', low: 71, high: 97, compartment: 'liver', species: 'mouse', source: 'article:teng-2011-bhmt-knockout-liver-pools', ontologyId: 'compound:choline', note: 'MOUSE tissue (1-year-old wild type, Table 5) 84 +/- 13 nmol/g (treated as ~uM). HUMAN LIVER CHOLINE NOT FOUND. Range +/- printed SE. Bhmt knockout lowers liver choline 82% at 5 weeks.' },
  { id: 'betaine-plasma', name: 'Betaine (plasma)', initial: 39.5, unit: 'uM', low: 27, high: 52, compartment: 'plasma', species: 'human', source: 'article:konstantinova-2008-plasma-choline-betaine-hordaland', extraSources: ['article:lever-2010-betaine-clinical-significance', 'article:trujillo-gonzalez-2026-controlled-choline-intake'], ontologyId: 'compound:betaine', note: 'Mean +/- SD 39.5 +/- 12.5 (n=7074). Reference intervals: women 20-60, men 25-75 uM (Lever & Slow 2010); serum 17.6-73.3 (Allen 1993); 33.8 (28.5-39.1) in Mödinger 2019. On betaine therapy 167-3900 uM.' },
  { id: 'betaine-liver', name: 'Betaine (liver)', initial: 1158, unit: 'uM', low: 830, high: 1490, compartment: 'liver', species: 'mouse', source: 'article:teng-2011-bhmt-knockout-liver-pools', ontologyId: 'compound:betaine', note: 'MOUSE 1.158 +/- 0.330 umol/g (1-year-old wild type; Table 5). Bhmt-/- mice accumulate 35 umol/g. HUMAN LIVER BETAINE NOT FOUND; tissue betaine is ~30x plasma, which is why BHMT (human Km 2.2 mM) is far from saturated.' },
  { id: 'dimethylglycine', name: 'Dimethylglycine (plasma)', initial: 3.4, unit: 'uM', low: 1.42, high: 5.27, compartment: 'plasma', species: 'human', source: 'article:allen-1993-serum-betaine-dmg-sarcosine', ontologyId: 'compound:dimethylglycine', note: 'Serum range 1.42-5.27 (60 blood donors); 3.4 (3.0-3.8) in Mödinger 2019; a different assay reports 7 +/- 3 (Schwahn 2003). Betaine therapy 15.1-250 uM. Liver DMG not found (mouse 2.2 nmol/g at 5 weeks).' },
  { id: 'sarcosine', name: 'Sarcosine (plasma)', initial: 1.6, unit: 'uM', low: 0.6, high: 2.67, compartment: 'plasma', species: 'human', source: 'article:allen-1993-serum-betaine-dmg-sarcosine', ontologyId: 'compound:sarcosine', note: 'Serum range 0.60-2.67 uM (value = midpoint, an estimate); GC-MS male controls 1.7-4.8, 0.9 in another series; betaine therapy 2.93-49.3. Urinary sarcosine <0.02 mmol/day in normals (Meléndez-Hevia, via Mudd).' },
  { id: 'phosphatidylcholine-plasma', name: 'Phosphatidylcholine (plasma)', initial: 2200, unit: 'uM', low: 2100, high: 2400, compartment: 'plasma', species: 'human', source: 'article:savendahl-1997-fasting-plasma-choline', extraSources: ['article:trujillo-gonzalez-2026-controlled-choline-intake'], ontologyId: 'compound:phosphatidylcholine', note: '2.2 +/- 0.1 mmol/L fed state, 2.4 +/- 0.2 after a 7-day fast (SEM, n=10). Unchanged across 25-100% of the choline AI in a controlled-intake study (~2210-2280 uM, Trujillo-Gonzalez 2026).' },
  { id: 'phosphatidylcholine-liver', name: 'Phosphatidylcholine (liver)', initial: 17317, unit: 'uM', low: 16634, high: 18000, compartment: 'liver', species: 'mouse', source: 'article:teng-2011-bhmt-knockout-liver-pools', ontologyId: 'compound:phosphatidylcholine', note: 'MOUSE 17.3 +/- 0.68 umol/g (1-year-old wild type). Human liver PC pool NOT FOUND (needed to turn the 0.53%/h PEMT flux fraction into mmol/day).' },
  { id: 'glycine-plasma', name: 'Glycine (plasma)', initial: 240, unit: 'uM', low: 200, high: 300, compartment: 'plasma', species: 'human', source: 'article:alves-2019-glycine-metabolism-review', ontologyId: 'compound:glycine', note: 'Healthy range 200-300; 240 +/- 84 (n=14, range 190-460; Kaufman 2009); 201 (172-227) healthy-weight fasted (Tan 2022); 248 +/- 43 (Olsson 2025). Vegetarians and vegans higher.' },
  { id: 'glycine-liver', name: 'Glycine (liver free pool)', initial: 1660, unit: 'uM', low: 600, high: 4000, compartment: 'liver', species: 'mouse', source: 'article:teng-2011-bhmt-knockout-liver-pools', ontologyId: 'compound:glycine', note: 'MOUSE 1659 +/- 128 nmol/g (5-week-old wild type) used as a stand-in; no human tissue glycine was found; bounds 600-4000 are assumed. See parameter glycine-liver-free.' },
  { id: 'dimethylglycine-liver', name: 'Dimethylglycine (liver)', initial: 48.2, unit: 'uM', low: 29.2, high: 67.2, compartment: 'liver', species: 'mouse', source: 'article:teng-2011-bhmt-knockout-liver-pools', ontologyId: 'compound:dimethylglycine', note: 'MOUSE 48.2 +/- 19.0 nmol/g (5-week-old wild type, Table 2); falls 95% (2.2 nmol/g) when Bhmt is deleted, i.e. BHMT is the main source of hepatic DMG. Human liver DMG not found.' },
  { id: 'sarcosine-liver', name: 'Sarcosine (liver)', initial: 20.2, unit: 'uM', low: 11.3, high: 29.1, compartment: 'liver', species: 'mouse', source: 'article:teng-2011-bhmt-knockout-liver-pools', ontologyId: 'compound:sarcosine', note: 'MOUSE methylglycine 20.2 +/- 8.9 nmol/g (5-week-old wild type); 2.6x higher (52.7) in Bhmt knockout, attributed to GNMT. Human liver sarcosine not found.' },
  { id: 'serine-plasma', name: 'Serine (plasma)', initial: 120, unit: 'uM', low: 90, high: 140, compartment: 'plasma', species: 'human', source: 'article:tan-2022-glycine-serine-synthesis-obesity', ontologyId: 'compound:serine', note: '123 (112-135) median (IQR) in healthy-weight fasted adults; 115 +/- 24 in Gregory 2013.' },
  { id: 'sam-plasma', name: 'SAM (plasma)', initial: 0.12, unit: 'uM', low: 0.0945, high: 0.139, compartment: 'plasma', species: 'human', source: 'article:bravo-2022-sam-sah-reference-values', ontologyId: 'compound:sam', note: 'Observable only. 120.6 +/- 18.1 nM (Bravo 2022), 94.5 nM (Gellekink 2005). B1 owns the cellular SAM pool.' },
  { id: 'sah-plasma', name: 'SAH (plasma)', initial: 0.0215, unit: 'uM', low: 0.0123, high: 0.0248, compartment: 'plasma', species: 'human', source: 'article:bravo-2022-sam-sah-reference-values', ontologyId: 'compound:sah', note: 'Observable only. 21.5 +/- 3.3 nM (Bravo 2022), 12.3 nM (Gellekink 2005).' },
  { id: 'homocysteine-plasma', name: 'Total homocysteine (plasma)', initial: 7.0, unit: 'uM', low: 5.7, high: 8.3, compartment: 'plasma', species: 'human', source: 'article:gregory-2013-b6-restriction-metabolomics', ontologyId: 'compound:homocysteine', note: 'Observable only. 6.97 +/- 1.3 uM (n=23, controlled diet); 7.3 uM in Melnyk 2000. B1 owns the pool.' },
  { id: 'cystathionine-plasma', name: 'Cystathionine (plasma)', initial: 0.131, unit: 'uM', low: 0.066, high: 0.196, compartment: 'plasma', species: 'human', source: 'article:gregory-2013-b6-restriction-metabolomics', ontologyId: 'compound:cystathionine', note: 'Observable for B6 status: 131 +/- 65 nM at baseline (n=23); 142 +/- 8 nM in a second cohort (Lamers 2011). Rises ~52-66% on marginal B6 restriction.' },
  { id: 'plp-plasma', name: 'Pyridoxal 5-phosphate (plasma)', initial: 0.0526, unit: 'uM', low: 0.0215, high: 0.111, compartment: 'plasma', species: 'human', source: 'article:gregory-2013-b6-restriction-metabolomics', ontologyId: 'compound:plp', note: 'See parameter plp-plasma-baseline. Intracellular PLP is not measured; the model should carry a normalised PLP availability f in [0,1].' },
  { id: 'histamine-plasma', name: 'Histamine (plasma)', initial: 0.00875, unit: 'uM', low: 0.0042, high: 0.0113, compartment: 'plasma', species: 'human', source: 'article:cho-2013-histamine-dao-urticaria', ontologyId: 'compound:histamine', note: '8.75 +/- 2.55 nM (n=25 EIA); 7.5 +/- 3.3 nM (GC-MS).' },
  { id: 'gastric-ph-fasted', name: 'Gastric pH (fasted, median)', initial: 1.7, unit: 'pH', low: 1.0, high: 2.5, compartment: 'stomach', species: 'human', source: 'article:dressman-1990-upper-gi-ph', ontologyId: null, note: 'pH is not an ontology compound; the proton pool lives at compound:proton.' },
  { id: 'gastric-volume-fasted', name: 'Gastric fluid volume (fasted)', initial: 35, unit: 'mL', low: 28, high: 42, compartment: 'stomach', species: 'human', source: 'article:mudie-2014-gi-fluid-volumes-fasted', ontologyId: null, note: 'See parameter gastric-fasting-volume-ml.' },
  ],

  reactionLaws: [
  // Species not defined above are "external": pools owned by B1 or treated as constants/fixed inputs.
  // Conventions: S = substrate concentration (uM), P = product, V = volume where needed, f_PLP in [0,1].
  // Vmax is NOT given for any law: B2 found no absolute hepatic enzyme concentrations. Calibrate Vmax so the
  // steady-state flux equals the named flux parameter (fluxTarget), then check the sensitivity to the Km values.
  {
    id: 'law-gnmt',
    ontologyId: 'reaction:gnmt-glycine-methylation',
    enzymeId: 'enzyme:gnmt',
    substrates: ['sam', 'glycine-liver'],
    products: ['sah', 'sarcosine-liver'],
    law: 'Hill in SAM x Michaelis-Menten in glycine, with weak SAH and strong 5-methylTHF-polyglutamate inhibition',
    rateExpression: 'v = Vmax * SAM^n / (K05^n + SAM^n) * Gly / (Kg + Gly) / (1 + SAH/Ki_SAH) / (1 + 5MTHF_Glu5/IC50_folate)',
    paramIds: ['gnmt-km-sam', 'gnmt-hill-sam', 'gnmt-km-gly', 'gnmt-kcat', 'gnmt-ki-sah', 'gnmt-ic50-5mthf-pentaglu', 'gnmt-fraction-cytosolic-protein'],
    fluxTarget: 'flux-gnmt-glycine-sarcosine',
    modifiers: [{ species: '5-mthf', effect: 'inhibits (noncompetitive vs SAM and glycine)' }],
    refs: ['article:luka-2008-gnmt-liver-vs-recombinant', 'article:zhang-2016-gnmt-kinetics-37c', 'article:ogawa-1982-gnmt-purification-kinetics', 'article:yeo-1999-gnmt-5mthf-inhibition', 'article:luka-2009-gnmt-sam-regulation', 'article:martinov-2000-gnmt-methionine-model', 'article:reed-2015-methyltransferase-model'],
    caveats: [
      'All kinetic constants are rat. The 15-fold spread in Km(SAM) and Km(glycine) between laboratories is the largest source of model uncertainty: sample low/high on a log scale.',
      'Cooperativity (Hill) with respect to SAM is small in the best recent measurement (1.1) and ~2 in modelling convention; Luka 2008 argues it appears only with bound folate. The "SAM buffer" behaviour of Martinov 2000 depends on a high Hill coefficient.',
      'Hepatic free glycine is known only for mouse (~1.66 mM, parameter glycine-liver-free): at Km(glycine) 1.1 mM the enzyme is ~60% saturated for glycine, so a 2-4x rise in hepatic glycine raises GNMT flux by only ~25-45% (calc); a bigger effect needs a much lower hepatic glycine or a higher Km (up to 2 mM measured).',
      'GNMT deficiency data show how large the sink is when SAM is high: plasma SAM is ~30-47x normal in a deficient child (Barić 2017) and liver SAM ~36x normal in the knockout mouse (Luka 2006).'
    ]
  },
  {
    id: 'law-pemt',
    ontologyId: 'reaction:pemt-pe-to-pc',
    enzymeId: 'enzyme:pemt',
    substrates: ['sam', 'phosphatidylethanolamine'],
    products: ['sah', 'phosphatidylcholine-liver'],
    stoichiometry: { sam: 3, sah: 3 },
    law: 'Michaelis-Menten in SAM with competitive SAH inhibition; three sequential methylations lumped at the rate-limiting first step',
    rateExpression: 'v = Vmax * SAM / (Km_SAM * (1 + SAH/Ki_SAH) + SAM); SAM consumed = 3 v (per PC)',
    paramIds: ['pemt-km-sam', 'pemt-ki-sah', 'pemt-flux-fraction-liver-pc-per-h', 'pemt-share-of-hepatic-pc'],
    fluxTarget: 'flux-pemt-sam',
    modifiers: [{ species: 'phosphatidylethanolamine', effect: 'substrate pool treated as non-limiting (not measured)' }],
    refs: ['article:hoffman-1981-pemt-kinetic-properties', 'article:hoffman-1981-pemt-sah-inhibition', 'article:pynn-2011-human-pemt-flux', 'article:vance-2014-phospholipid-methylation', 'article:stead-2006-methyl-balance-reevaluation'],
    caveats: [
      'Kinetics are rat microsomal; Km(SAM) differs 17-fold from guinea pig. Purified enzyme shows detergent-dependent cooperativity (Ridgway & Vance 1988), so an in-vitro Hill number should not be transferred.',
      'Ki(SAH) = 3.8 uM is below plasma-scale SAH and close to the hepatic SAH, so PEMT is the first methyltransferase to feel a falling SAM:SAH ratio.',
      'No human flux in mmol/day exists; the two literature estimates (2.5 and 5 mmol SAM/day) differ 2-fold.'
    ]
  },
  {
    id: 'law-gamt',
    ontologyId: 'reaction:gamt-creatine-synthesis',
    enzymeId: 'enzyme:gamt',
    substrates: ['sam', 'guanidinoacetate'],
    products: ['sah', 'creatine'],
    law: 'Ordered bi-substrate Michaelis-Menten (SAM binds first), simplified to a product of saturation terms',
    rateExpression: 'v = Vmax * SAM/(Km_SAM + SAM) * GAA/(Km_GAA + GAA) / (1 + SAH/Ki_SAH_gamt)',
    paramIds: ['gamt-km-sam', 'gamt-km-gaa', 'flux-creatine-synthesis'],
    fluxTarget: 'flux-creatine-synthesis',
    modifiers: [],
    refs: ['article:ogawa-1983-gamt-rat-liver', 'article:brosnan-2011-creatine-synthesis-burden', 'article:brosnan-2007-creatine-review'],
    caveats: [
      'Km(SAM) 6.7 uM (rat) is far below hepatic SAM, so GAMT is nearly saturated and its SAM use is set by guanidinoacetate supply (AGAT activity in kidney, repressed by creatine) rather than SAM. The Reed model uses 49 uM; both values are low enough that this conclusion holds.',
      'Ki(SAH) for GAMT was not found by B2; a model value of 16 uM appears in Reed 2015 (secondary).',
      'Share of SAM use is contested (Brosnan 2011 ~40%; older ~70%).'
    ]
  },
  {
    id: 'law-agat',
    ontologyId: 'reaction:agat-guanidinoacetate-synthesis',
    enzymeId: 'enzyme:gatm',
    substrates: ['glycine-plasma', 'arginine'],
    products: ['guanidinoacetate', 'ornithine'],
    law: 'Random bi-substrate Michaelis-Menten with end-product repression of enzyme level by creatine',
    rateExpression: 'v = Vmax_0 * R(creatine) * Gly/(Km_Gly + Gly) * Arg/(Km_Arg + Arg), R = 0.26 at high creatine intake',
    paramIds: ['agat-km-gly', 'agat-km-arg', 'agat-residual-activity-high-creatine'],
    modifiers: [{ species: 'creatine', effect: 'represses AGAT expression (pretranslational)' }],
    refs: ['article:gross-1986-agat-human-kidney', 'article:mcguire-1984-agat-creatine-repression'],
    caveats: [
      'Kidney enzyme; Km(glycine) 2.5 mM is far above plasma glycine, so AGAT is glycine-sensitive. Glycine + arginine loading raised homocysteine in creatine-transporter deficiency (Villar 2012), presumably through guanidinoacetate -> GAMT -> SAM use; glycine alone was not isolated.',
      'Repression value is from rat and a dietary creatine challenge.'
    ]
  },
  {
    id: 'law-nnmt',
    ontologyId: null,
    ontologyGap: 'enzyme:nnmt exists but no reaction entity (nicotinamide + SAM -> 1-methylnicotinamide + SAH); phase A3 plans to add one.',
    enzymeId: 'enzyme:nnmt',
    substrates: ['nicotinamide', 'sam'],
    products: ['1-methylnicotinamide', 'sah'],
    law: 'Ordered bi-substrate Michaelis-Menten with product inhibition by N1-methylnicotinamide',
    rateExpression: 'v = Vmax * NAM/(Km_NAM + NAM) * SAM/(Km_SAM + SAM) / (1 + MNA/IC50_MNA)',
    paramIds: ['nnmt-km-nam', 'nnmt-km-sam', 'nnmt-ic50-mnam', 'flux-nnmt-baseline', 'nnmt-methyl-per-g-niacin'],
    fluxTarget: 'flux-nnmt-baseline',
    modifiers: [],
    refs: ['article:aksoy-1994-human-nnmt', 'article:peng-2011-nnmt-structure-kinetics', 'article:pissios-2017-nnmt-methyl-sink', 'article:menon-2007-niacin-er-pharmacokinetics', 'article:garg-1999-niacin-homocysteine', 'article:basu-2002-niacin-rat-homocysteine', 'article:fukada-2006-gaa-homocysteine-rat'],
    caveats: [
      'Km(NAM) ~430 uM is well above physiological nicotinamide, so flux is ~linear in nicotinamide supply; Km(SAM) ~2 uM means SAM is saturating.',
      'Niacin loading scenario: 2 g/day niacin methylates ~54% of the dose to MNA + 2-pyridone (~8.8 mmol/day, lower bound). There is NO human SAM or SAH measurement after niacin; the only human methyl-pool readout is plasma tHcy rising 17% during titration and 55% vs placebo at 18 weeks (Garg 1999, PAD patients), and rat data (Basu 2002).'
    ]
  },
  {
    id: 'law-comt',
    ontologyId: 'reaction:comt-dopamine-methylation',
    enzymeId: 'enzyme:comt',
    substrates: ['sam', 'dopamine'],
    products: ['sah', '3-methoxytyramine'],
    law: 'Minor sink: modelled as a constant methyl flux (no catechol kinetics found)',
    rateExpression: 'v = k_comt * SAM/(Ks_SAM + SAM)  (lumped into flux-other-methyltransferases)',
    paramIds: ['comt-ks-sam', 'flux-other-methyltransferases'],
    modifiers: [],
    refs: ['article:lotta-1995-comt-kinetics'],
    caveats: ['Catechol Km values not found in accessible text. Quantitatively minor compared with GNMT/PEMT/GAMT.']
  },
  {
    id: 'law-hnmt',
    ontologyId: 'reaction:hnmt-histamine-methylation',
    enzymeId: 'enzyme:hnmt',
    substrates: ['histamine-plasma', 'sam'],
    products: ['methylhistamine', 'sah'],
    law: 'Ordered bi-substrate Michaelis-Menten with competitive (vs SAM) SAH inhibition',
    rateExpression: 'v = Vmax * His/(Km_His + His) * SAM/(Km_SAM * (1 + SAH/Ki_SAH) + SAM)',
    paramIds: ['hnmt-km-histamine', 'hnmt-km-sam', 'hnmt-ki-sah'],
    modifiers: [],
    refs: ['article:horton-2001-hnmt-structure-kinetics', 'article:girard-1994-hnmt-kidney-cdna', 'article:yoshikawa-2019-hnmt-brain', 'article:naganuma-2017-hnmt-sleep-wake'],
    caveats: [
      'HNMT is the only histamine route in the CNS (DAO negligible), so the SAM:SAH sensitivity applies there; in the gut DAO dominates.',
      'Km(SAM) 13 uM and Ki(SAH) 7 uM: with hepatic SAM:SAH ~5-12 in rat (Hoffman 1981), SAM-dependence of HNMT is real but modest. No human study links SAM status to histamine turnover.'
    ]
  },
  {
    id: 'law-dao',
    ontologyId: 'reaction:dao-histamine-oxidation',
    enzymeId: 'enzyme:dao',
    substrates: ['histamine-plasma', 'oxygen'],
    products: ['imidazole-acetaldehyde'],
    law: 'Michaelis-Menten in histamine; SAM-independent; inhibited by aminoguanidine',
    rateExpression: 'v = Vmax * His/(Km_His + His) / (1 + I/Ki)',
    paramIds: ['dao-km-histamine', 'dao-ic50-aminoguanidine'],
    modifiers: [],
    refs: ['article:biegan-1983-human-intestinal-dao', 'article:elmore-2002-human-kidney-dao'],
    caveats: ['Plasma DAO is at the detection limit in healthy people; use gut mucosal DAO. Serum DAO ELISA values do not measure activity and showed no association with symptoms in a 1051-adult sample (van Odijk 2023).']
  },
  {
    id: 'law-dnmt',
    ontologyId: null,
    ontologyGap: 'No DNMT enzyme or DNA methylation reaction entity in the ontology.',
    enzymeId: null,
    substrates: ['sam'],
    products: ['sah'],
    law: 'Minor sink: modelled as a constant methyl flux',
    rateExpression: 'v = k * SAM/(Km_SAM + SAM)',
    paramIds: ['dnmt1-km-sam', 'flux-other-methyltransferases'],
    modifiers: [],
    refs: ['article:pradhan-1999-dnmt1-kinetics', 'article:gros-2013-dnmt1-kinetics'],
    caveats: ['Km(SAM) 2.6-7.2 uM is far below hepatic SAM; DNMT1 is almost never SAM-limited. In a published liver model DNMT is ~2% of methyl flux.']
  },
  {
    id: 'law-chdh',
    ontologyId: 'reaction:chdh-choline-oxidation',
    enzymeId: 'enzyme:chdh',
    substrates: ['choline-liver'],
    products: ['betaine-aldehyde'],
    law: 'Michaelis-Menten in choline (electron acceptor not limiting)',
    rateExpression: 'v = Vmax * Cho/(Km_Cho + Cho)',
    paramIds: ['chdh-km-choline', 'flux-choline-oxidation-to-betaine'],
    fluxTarget: 'flux-choline-oxidation-to-betaine',
    modifiers: [],
    refs: ['article:tsuge-1980-choline-dehydrogenase-rat-liver', 'article:salvi-2013-choline-oxidation-review', 'article:roivainen-2000-carbon11-choline-metabolism'],
    caveats: ['Km 7 mM is a rat value with an artificial acceptor; at hepatic choline of tens of uM the enzyme is first order in choline. In vivo conversion is fast (82% of plasma radioactivity as betaine at 25 min after IV [11C]choline), so calibrate Vmax to the flux target, not to the Km.']
  },
  {
    id: 'law-badh',
    ontologyId: 'reaction:badh-betaine-aldehyde-oxidation',
    enzymeId: 'enzyme:aldh7a1',
    substrates: ['betaine-aldehyde'],
    products: ['betaine-liver'],
    law: 'Treated as instantaneous (quasi-steady state for betaine aldehyde)',
    rateExpression: 'v_BADH = v_CHDH  (Km 41 uM << any plausible accumulation)',
    paramIds: ['aldh7a1-km-betaine-aldehyde'],
    modifiers: [],
    refs: ['article:brocker-2010-aldh7a1-betaine-aldehyde'],
    caveats: ['ALDH9A1 also oxidises betaine aldehyde but with a 5-fold higher Km (216 uM).']
  },
  {
    id: 'law-bhmt',
    ontologyId: 'reaction:bhmt-betaine-homocysteine',
    enzymeId: 'enzyme:bhmt',
    substrates: ['betaine-liver', 'homocysteine'],
    products: ['dimethylglycine-liver', 'methionine'],
    law: 'Ordered bi-substrate Michaelis-Menten with competitive product inhibition by dimethylglycine',
    rateExpression: 'v = Vmax * Bet/(Km_Bet * (1 + DMG/Ki_DMG) + Bet) * Hcy/(Km_Hcy + Hcy)',
    paramIds: ['bhmt-km-betaine', 'bhmt-km-hcy', 'bhmt-kcat', 'bhmt-liver-specific-activity', 'bhmt-ki-dmg', 'flux-bhmt-methyl-ceiling'],
    modifiers: [{ species: 'dimethylglycine-liver', effect: 'competitive product inhibitor' }],
    refs: ['article:millian-1998-human-bhmt-kinetics', 'article:garrow-1996-pig-bhmt-purification', 'article:szegedi-2008-bhmt2-smm', 'article:wang-1991-bhmt-human-tissues', 'article:finkelstein-1984-homocysteine-partition-rat-liver', 'article:schwahn-2003-betaine-pharmacokinetics'],
    caveats: [
      'Km(betaine) is 100x higher in human recombinant (2.2 mM) than pig (23 uM): with liver betaine ~1 mM (mouse) the enzyme is unsaturated, so betaine dosing raises flux almost linearly until DMG accumulation brakes it.',
      'Only liver and kidney express BHMT in humans (none in brain, muscle, heart).',
      'The share of homocysteine remethylation carried by BHMT in humans is unknown (27% of Hcy consumption in a rat in-vitro reconstitution).',
      'Ki(DMG) is second-hand and uncertain over 100-fold; the saturable betaine disposal seen in repeated dosing (half-life 14 -> 41 h) is the best empirical evidence of DMG inhibition.'
    ]
  },
  {
    id: 'law-dmgdh',
    ontologyId: 'reaction:dmgdh-dimethylglycine-demethylation',
    enzymeId: 'enzyme:dmgdh',
    substrates: ['dimethylglycine-liver', 'thf'],
    products: ['sarcosine-liver', '5-10-methylene-thf'],
    law: 'Michaelis-Menten in dimethylglycine; electron transfer to ETF assumed non-limiting',
    rateExpression: 'v = Vmax * DMG/(Km_DMG + DMG)',
    paramIds: ['dmgdh-km-dmg', 'dmgdh-kcat'],
    modifiers: [],
    refs: ['article:augustin-2016-human-dmgdh', 'article:porter-1985-dmgdh-sardh-rat'],
    caveats: ['Km depends on assay (0.04-1.4 mM). Rate-limiting step is reoxidation of the flavin, so ETF availability could matter.']
  },
  {
    id: 'law-sardh',
    ontologyId: 'reaction:sardh-sarcosine-demethylation',
    enzymeId: 'enzyme:sardh',
    substrates: ['sarcosine-liver', 'thf'],
    products: ['glycine-liver', '5-10-methylene-thf'],
    law: 'Michaelis-Menten in sarcosine; closes the glycine-sarcosine cycle with GNMT',
    rateExpression: 'v = Vmax * Sar/(Km_Sar + Sar)',
    paramIds: ['sardh-km-sarcosine', 'flux-gnmt-glycine-sarcosine'],
    modifiers: [],
    refs: ['article:porter-1985-dmgdh-sardh-rat', 'article:mudd-2007-methyl-balance'],
    caveats: ['Rat Km only. In normal people urinary sarcosine is ~0.01-0.02 mmol/day while total sarcosine flux is ~6 mmol/day (Meléndez-Hevia, via Mudd): SARDH removes almost all of it. Sarcosine accumulates in blood only when SARDH is deficient or GNMT flux is extreme.']
  },
  {
    id: 'law-choline-kinase',
    ontologyId: 'reaction:choline-kinase-phosphocholine',
    enzymeId: 'enzyme:choline-kinase',
    substrates: ['choline-liver'],
    products: ['phosphocholine'],
    law: 'Michaelis-Menten in choline; Kennedy-pathway entry step (CCT, the rate-limiting step, has no kinetics here)',
    rateExpression: 'v = Vmax * Cho/(Km_Cho + Cho)',
    paramIds: ['chka-km-choline', 'choline-uptake-km-hepatocyte', 'pemt-share-of-hepatic-pc'],
    modifiers: [],
    refs: ['article:gallego-ortega-2009-choline-kinase-isoforms', 'article:odwyer-2020-hepatocyte-choline-uptake', 'article:kennedy-1956-cytidine-coenzymes'],
    caveats: ['PCYT1A/CCT and CHPT1 constants were not collected; treat the Kennedy pathway as a flux sink that takes (1 - PEMT share) of hepatic PC synthesis. Hepatocyte uptake Km is mouse.']
  },
  {
    id: 'law-chat',
    ontologyId: 'reaction:chat-acetylcholine-synthesis',
    enzymeId: 'enzyme:chat',
    substrates: ['choline-plasma', 'acetyl-coa'],
    products: ['acetylcholine', 'coa'],
    law: 'Ordered bi-substrate Michaelis-Menten',
    rateExpression: 'v = Vmax * Cho/(Km_Cho + Cho) * AcCoA/(Km_AcCoA + AcCoA)',
    paramIds: ['chat-km-choline'],
    modifiers: [],
    refs: ['article:shen-2011-human-chat-kinetics'],
    caveats: ['Acetylcholine synthesis is a negligible fraction of whole-body choline use; the whole-body share is NOT FOUND in the literature and is set to a token value in the choline-fate budget.']
  },
  {
    id: 'law-shmt',
    ontologyId: 'reaction:shmt-serine-glycine-interconversion',
    enzymeId: 'enzyme:shmt',
    substrates: ['serine-plasma', 'thf'],
    products: ['glycine-liver', '5-10-methylene-thf'],
    law: 'Flux-calibrated reversible exchange with PLP saturation modifier',
    rateExpression: 'v_net = v_fwd - v_rev; v = Vmax * f_PLP * (Ser*THF - Gly*CH2THF/Keq)/(...); f_PLP = P/(Keff + P) / (1/(Keff + 1))',
    paramIds: ['flux-glycine-to-serine-shmt', 'shmt1-plp-keff-fraction', 'plp-kd-shmt1'],
    fluxTarget: 'flux-glycine-to-serine-shmt',
    modifiers: [{ species: 'plp-plasma', effect: 'cofactor availability f_PLP' }],
    refs: ['article:lamers-2007-glycine-flux', 'article:perry-2007-shmt-plp-mcf7', 'article:davis-2005-b6-restriction-homocysteine', 'article:lamers-2009-b6-restriction-glycine'],
    caveats: [
      'No primary Km values for human SHMT1/2 were verified (values found in a secondary source: Km serine 0.40 mM, Km THF 53 uM, kcat 850 /min for SHMT2; NOT used).',
      'The gross exchange glycine -> serine (193 umol/kg/h) is much larger than net serine -> glycine production; do not equate them.',
      'Tracer flux includes the one-carbon units made by the glycine cleavage system (46% of the glycine-to-serine flux).'
    ]
  },
  {
    id: 'law-gcs',
    ontologyId: 'reaction:glycine-cleavage-system',
    enzymeId: 'enzyme:glycine-cleavage-system',
    substrates: ['glycine-liver', 'thf'],
    products: ['5-10-methylene-thf', 'carbon-dioxide', 'ammonia'],
    law: 'Michaelis-Menten in glycine with hormonal/Ca2+ modulation of Vmax',
    rateExpression: 'v = Vmax * f_PLP * Gly/(Km_Gly + Gly)',
    paramIds: ['gcs-km-glycine', 'flux-glycine-gcs-decarboxylation'],
    fluxTarget: 'flux-glycine-gcs-decarboxylation',
    modifiers: [{ species: 'plp-plasma', effect: 'cofactor availability f_PLP (P-protein is PLP-dependent)' }],
    refs: ['article:hayasaka-1980-gcs-p-protein-rat', 'article:fujiwara-1983-gcs-chicken-liver', 'article:lamers-2007-glycine-flux', 'article:lamers-2009-glycine-decarboxylation-tracer', 'article:kikuchi-2008-glycine-cleavage-system', 'article:nijhout-2009-glycine-pulse-model'],
    caveats: [
      'Km(glycine) ~6 mM from purified partial reactions (chicken, rat). If hepatic glycine is ~1 mM the system is first order in glycine, so oral glycine raises GCS flux and CO2/ammonia/one-carbon output almost linearly.',
      'Flux estimates differ 2-fold by tracer. Marginal B6 deficiency did not change cleavage flux in humans (Lamers 2009: 163 vs 151 umol/kg/h).'
    ]
  },
  {
    id: 'law-phgdh',
    ontologyId: 'reaction:phgdh-3pg-oxidation',
    enzymeId: 'enzyme:phgdh',
    substrates: ['3-phosphoglycerate', 'nad'],
    products: ['3-phosphohydroxypyruvate', 'nadh'],
    law: 'Michaelis-Menten in 3-phosphoglycerate; no feedback inhibition by serine or glycine in vitro',
    rateExpression: 'v = Vmax * G3P/(Km + G3P)',
    paramIds: ['phgdh-km-3pg'],
    modifiers: [],
    refs: ['article:murtas-2021-human-phgdh', 'article:mattaini-2016-serine-metabolism', 'article:tan-2022-glycine-serine-synthesis-obesity'],
    caveats: ['Serine synthesis rate in humans: 218 (177-284) umol/kg lean mass/h (Tan 2022).']
  },
  {
    id: 'law-baat-glycine',
    ontologyId: 'reaction:baat-glycine-conjugation',
    enzymeId: 'enzyme:baat',
    substrates: ['choloyl-coa', 'glycine-liver'],
    products: ['glycocholic-acid', 'coa'],
    law: 'Two substrates (glycine, taurine) compete for one enzyme: ratio of conjugation rates = (Vg/Kg * Gly) / (Vt/Kt * Tau)',
    rateExpression: 'v_gly = Vg * Gly/(Kg*(1 + Tau/Kt) + Gly) * ChCoA/(Km_ChCoA + ChCoA)',
    paramIds: ['baat-km-glycine', 'baat-km-taurine', 'baat-km-cholyl-coa', 'bile-glycine-conjugate-fraction', 'glycine-bile-conjugation-gross-mmol-day'],
    modifiers: [{ species: 'taurine', effect: 'competitive alternative substrate' }],
    refs: ['article:johnson-1991-baat-human-liver', 'article:styles-2016-baat-recombinant', 'article:hepner-1972-glycine-conjugated-dihydroxy-bile-acids', 'article:chiang-2013-bile-acid-metabolism-signaling'],
    caveats: [
      'Consistency check (calc): with Johnson 1991 (Vmax 0.77/0.33, Km 5.8/1.1 mM) the rate ratio is 0.44 x Gly/Tau, so the observed ~3:1 glycine:taurine bile ratio needs hepatic Gly/Tau ~ 7; with Styles 2016 (8.69/21.7 nmol/min/mg, Km 3.95/1.86 mM) the rate ratio is 0.19 x Gly/Tau, needing Gly/Tau ~ 16. Hepatic taurine and glycine pools in humans were NOT FOUND, so the ratio cannot be predicted from kinetics alone.',
      'Taurine supplement (3 g/day) reverses the ratio in men within 2 weeks; no data on glycine supplements.'
    ]
  },
  {
    id: 'law-baat-taurine',
    ontologyId: 'reaction:baat-taurine-conjugation',
    enzymeId: 'enzyme:baat',
    substrates: ['choloyl-coa', 'taurine'],
    products: ['taurocholic-acid', 'coa'],
    law: 'Competitive partner of law-baat-glycine',
    rateExpression: 'v_tau = Vt * Tau/(Kt*(1 + Gly/Kg) + Tau) * ChCoA/(Km_ChCoA + ChCoA)',
    paramIds: ['baat-km-taurine', 'baat-km-glycine', 'baat-km-cholyl-coa'],
    modifiers: [{ species: 'glycine-liver', effect: 'competitive alternative substrate' }],
    refs: ['article:johnson-1991-baat-human-liver', 'article:styles-2016-baat-recombinant', 'article:hardison-1983-taurine-supplementation-bile'],
    caveats: ['Liver taurine in humans not found; vegans have lower plasma taurine (45 vs 58 uM) but bile ratios were not measured.']
  },
  {
    id: 'law-bsh',
    ontologyId: 'reaction:bsh-glycocholate-deconjugation',
    enzymeId: 'enzyme:bile-salt-hydrolase',
    substrates: ['glycocholic-acid'],
    products: ['cholate', 'glycine-liver'],
    law: 'First-order fraction per enterohepatic cycle',
    rateExpression: 'v = f_deconj * cycles_per_day * pool_glycine_conjugates (mmol/day)',
    paramIds: ['bile-deconjugation-per-cycle', 'bile-acid-cycles-per-day', 'bile-acid-pool-g'],
    modifiers: [],
    refs: ['article:hepner-1972-cholylglycine-turnover', 'article:hamilton-2007-cecal-bile-acids'],
    caveats: ['Freed glycine is mostly oxidised (52% of the label in breath CO2), so BSH is not a net glycine source for the host.']
  },
  {
    id: 'law-plp-modifier-cbs',
    ontologyId: 'reaction:cbs-cystathionine-synthesis',
    enzymeId: 'enzyme:cbs',
    isModifierOnly: true,
    substrates: [],
    products: [],
    law: 'Multiplicative PLP-availability factor applied to B1\'s CBS rate law',
    rateExpression: 'v_CBS = v_CBS(B1) * f_PLP(CBS), f_PLP = (P/(K+P)) / (1/(K+1)), K = cbs-plp-keff-fraction, P = relative cellular PLP (1 = baseline)',
    paramIds: ['cbs-plp-keff-fraction', 'plp-kd-cbs', 'cystathionine-rise-b6-restriction'],
    modifiers: [{ species: 'plp-plasma', effect: 'cofactor availability' }],
    refs: ['article:lipson-1980-cbs-plp-fibroblasts', 'article:gregory-2013-b6-restriction-metabolomics', 'article:lamers-2011-b6-restriction-methionine-cycle'],
    caveats: ['Derived from cultured fibroblasts. The human readout is plasma cystathionine rising 52-66% when plasma PLP falls ~60%. A rise of cystathionine on B6 restriction implies transsulfuration is NOT reduced overall (flux unchanged in the same cohorts).']
  },
  {
    id: 'law-plp-modifier-gad',
    ontologyId: 'reaction:gad-glutamate-decarboxylation',
    enzymeId: 'enzyme:gad',
    isModifierOnly: true,
    substrates: [],
    products: [],
    law: 'Holo/apo partition of GAD isoforms',
    rateExpression: 'v_GAD = Vmax65 * holo65 + Vmax67 * holo67; holo65 = 0.07 baseline (GAD65 is a PLP reservoir), holo67 = 0.72',
    paramIds: ['gad65-holoenzyme-fraction', 'gad67-holoenzyme-fraction'],
    modifiers: [{ species: 'plp-plasma', effect: 'cofactor availability' }],
    refs: ['article:battaglioli-2003-gad-isoform-kinetics'],
    caveats: ['Only the apo/holo fractions were found; PLP Kd/Km for GAD65 and GAD67 were NOT FOUND.']
  },
  {
    id: 'law-gastric-hcl-secretion',
    ontologyId: 'reaction:gastric-hcl-secretion',
    enzymeId: 'enzyme:h-k-atpase',
    substrates: [],
    products: ['hydrochloric-acid'],
    law: 'Algebraic secretion with stimulus and fractional pump inhibition; PPI inhibition recovers with a first-order time constant',
    rateExpression: 'S(t) = BAO + (PAO - BAO) * stim(t) * (1 - I(t)); dI/dt = k_on * dose_effect * (1 - I) - ln2/t_half * I,  I in [0,1]',
    paramIds: ['gastric-bao', 'gastric-pao', 'gastric-mao', 'gastric-meal-acid-output', 'gastric-acid-24h', 'gastric-hcl-concentration', 'ppi-pump-recovery-halflife-h', 'ppi-omeprazole20-acidity-reduction-day1', 'ppi-omeprazole20-acidity-reduction-day5'],
    modifiers: [{ species: 'proton', effect: 'secreted species' }],
    refs: ['article:katelaris-1993-gastric-acid-age-hpylori', 'article:feldman-1986-24h-acid-secretion', 'article:dubey-1983-acid-alkali-in-situ-titration', 'article:shin-2002-ppi-acid-secretion-recovery', 'article:cederberg-1993-omeprazole-24h-acidity'],
    caveats: [
      'The inhibition dynamics are NOT first order in dose: omeprazole 20 mg reduces integrated acidity 18% on day 1 and 60% on day 5 because inhibited pumps accumulate; use I(t) as a state, not a steady-state dose-response.',
      'Acid output varies 3-fold between studies and by H. pylori status and sex.'
    ]
  },
  {
    id: 'law-acid-bicarbonate-co2',
    ontologyId: 'reaction:hcl-bicarbonate-neutralisation',
    enzymeId: null,
    substrates: ['hydrochloric-acid', 'bicarbonate'],
    products: ['carbon-dioxide'],
    law: 'Stoichiometric neutralisation (instantaneous equilibrium with carbonic anhydrase), then partition of CO2 between dissolved, gas and absorbed',
    rateExpression: 'n_CO2_total = n_HCl_neutralised; n_dissolved = kH * PCO2 * V_liquid; V_gas = max(0, n_CO2_total - n_dissolved - n_absorbed) * Vm(37 C)',
    paramIds: ['co2-molar-volume-37c-ml-per-mmol', 'co2-solubility-37c-mmol-l-mmhg', 'gastric-pco2-basal-mmhg', 'gastric-pco2-after-nahco3-mmhg', 'gastric-gas-fraction-passed-distally', 'intestinal-gas-volume-ml', 'flatus-ml-per-day'],
    modifiers: [],
    refs: ['article:kolkman-1994-intragastric-pco2', 'article:akiba-2011-duodenal-co2-sensing', 'article:caballero-2018-gastric-gas-fate', 'article:ltaief-2021-co2-blood-solubility'],
    caveats: [
      'Stoichiometry is exact: 1 mmol HCl neutralised by bicarbonate gives at most 1 mmol CO2, 25.45 mL at 37 C (27.1 mL if the gas phase is water-saturated).',
      'The absorbed fraction is not measured: duodenal and gastric mucosa absorb CO2 rapidly, and total resting gut gas is only ~100-200 mL. The 24-h acid secretion of ~208 mmol could in principle yield 5.3 L, but only ~0.07 L of CO2 appears as flatus per day, so >98% of any acid-derived CO2 is absorbed or exhaled (calc), not belched.',
      'Most of the acid is buffered by food proteins and phosphate rather than bicarbonate; do not set n_HCl_neutralised equal to acid secreted.'
    ]
  },
  {
    id: 'law-carbonic-anhydrase',
    ontologyId: 'reaction:carbonic-anhydrase-bicarbonate-dehydration',
    enzymeId: 'enzyme:carbonic-anhydrase',
    substrates: ['bicarbonate', 'proton'],
    products: ['carbon-dioxide'],
    law: 'Instantaneous equilibrium (catalysed)',
    rateExpression: '[CO2(aq)] = [H+][HCO3-] / K1 (pK1 ~ 6.1); not rate limiting at physiological carbonic anhydrase activity',
    paramIds: [],
    modifiers: [],
    refs: ['article:kaunitz-2006-duodenal-co2-carbonic-anhydrase'],
    caveats: ['No kinetic constants collected; use equilibrium. The apparent pK1 is a textbook constant, not sourced here.']
  },
  {
    id: 'law-glyat-hippurate',
    ontologyId: null,
    ontologyGap: 'No glycine N-acyltransferase enzyme or hippurate-formation reaction in the ontology (compound:hippuric-acid exists).',
    enzymeId: null,
    substrates: ['glycine-liver'],
    products: ['hippuric-acid'],
    law: 'Cooperative (Hill 1.6) in glycine with s0.5 23 mM',
    rateExpression: 'v = Vmax * Gly^1.6 / (s05^1.6 + Gly^1.6)',
    paramIds: ['glyat-s05-glycine', 'glycine-hippurate-use-g-day'],
    modifiers: [],
    refs: ['article:rohwer-2021-human-glyat', 'article:beyoglu-2012-glycine-conjugation-review'],
    caveats: ['Single variant; at plasma-scale glycine the rate is far below saturation, so hippurate formation rises supra-linearly with glycine load.']
  }
  ],

  fluxBudgets: [
  // Stacked-bar ready: items are additive within a budget unless noted. All carry value, low, high and a source.
  {
    id: 'sam-consumers',
    title: 'Who spends the SAM methyl groups? (adult, 70 kg)',
    unit: 'mmol/day',
    additive: true,
    totals: [{ label: 'Whole-body transmethylation', value: 20.0, low: 15.0, high: 23.5, source: 'article:mudd-2007-methyl-balance' }],
    items: [
      { label: 'Creatine synthesis (GAMT)', value: 7.3, low: 3.7, high: 14.6, source: 'article:brosnan-2011-creatine-synthesis-burden', paramId: 'flux-creatine-synthesis', note: 'About 40% of methyl groups (Brosnan 2011) vs >70% in the older literature; high end is a vegetarian with no dietary creatine.' },
      { label: 'Phosphatidylcholine (PEMT)', value: 3.75, low: 2.5, high: 5.0, source: 'article:stead-2006-methyl-balance-reevaluation', paramId: 'flux-pemt-sam', note: 'Two published estimates (Mudd 2007: 2.5; Stead 2006: ~5 for bile PC alone); no direct human measurement.' },
      { label: 'Sarcosine from glycine (GNMT)', value: 2.9, low: 1.9, high: 6.2, source: 'article:mudd-2007-methyl-balance', paramId: 'flux-gnmt-glycine-sarcosine', note: 'Second-hand figure (Meléndez-Hevia 2009 quoting Mudd). GNMT is the unique sink that rises when SAM is high (GNMT deficiency: plasma SAM 30-47x).' },
      { label: 'Other methyltransferases (DNMT, COMT, HNMT, NNMT, polyamines...)', value: 1.9, low: 0.5, high: 5.6, source: 'assumption:unaccounted-methyltransferases', paramId: 'flux-other-methyltransferases', note: 'Unverified residual; baseline NNMT is only ~0.075 mmol/day.' },
      { label: 'Unaccounted (total minus identified)', value: 4.2, low: 0.0, high: 14.9, source: 'calc:total-minus-identified', note: 'Midpoint total 20.0 minus the four items above (15.85). High = 23.5 minus the lower bounds of the four items.' }
    ],
    scenarios: [
      { id: 'niacin-2g-day', label: 'Niacin 2 g/day', changes: [{ label: 'NNMT (niacin methylation to MNA + 2-pyridone)', value: 8.76, low: 8.76, high: 12.6, source: 'article:menon-2007-niacin-er-pharmacokinetics', note: 'Lower bound from 96-h urinary recovery of 2 g extended-release niacin (53.9% as MNA + 2PY); human SAM/SAH after niacin NOT measured.' }] },
      { id: 'vegetarian', label: 'Vegetarian (no dietary creatine)', changes: [{ label: 'Creatine synthesis (GAMT)', value: 14.6, low: 7.3, high: 14.6, source: 'article:brosnan-2011-creatine-synthesis-burden', note: 'All 14.6 mmol/day creatinine loss must be made endogenously.' }] },
      { id: 'creatine-supplement', label: 'High creatine intake', changes: [{ label: 'Creatine synthesis (GAMT)', value: 1.9, low: 1.9, high: 7.3, source: 'article:mcguire-1984-agat-creatine-repression', note: 'Rat AGAT retains 26% of activity at high creatine intake; applied to the human value 7.3 x 0.26 (assumption, no human data).' }] }
    ],
    contested: [
      'Creatine share: >70% (Mudd & Poole era) vs ~40% (Brosnan 2011) vs 45% of a 13.7 mmol/day minimal total in one patient (Mudd 2007, second-hand).',
      'PEMT: 2.5 vs 5 mmol/day; PEMT-null mice have 50% lower plasma Hcy but no human flux exists.',
      'Total transmethylation: 15-28 mmol/day depending on tracer, enrichment correction (+40%), and fed vs fasted weighting.',
      'Sarcosine: 4.3 observed vs ~6.1-6.2 corrected in one patient; choline/glycine split (53.5/46.5%) is from 1980 data.'
    ]
  },
  {
    id: 'choline-sources',
    title: 'Where body choline comes from (adult, 70 kg)',
    unit: 'mmol/day',
    additive: true,
    items: [
      { label: 'Dietary choline (free + phosphocholine + GPC + PC)', value: 3.2, low: 2.8, high: 4.5, source: 'article:wallace-2017-us-choline-intake', paramId: 'choline-intake-mmol-day', note: 'US 338 mg/day, Framingham 313, EU 291-468 mg/day. Only ~8% of US adults meet the AI.' },
      { label: 'Endogenous de novo choline moiety (PEMT)', value: 1.25, low: 0.83, high: 1.67, source: 'calc:pemt-sam-over-three', paramId: 'flux-pemt-pc-synthesis', note: 'PEMT SAM use divided by three. Inherits the 2-fold PEMT uncertainty.' }
    ],
    related: [
      { label: 'Dietary betaine (methyl donor for BHMT, not a choline source)', value: 1.4, low: 1.1, high: 1.8, source: 'article:ross-2014-betaine-food-sources', paramId: 'betaine-intake-mmol-day' }
    ],
    contested: ['Rat de novo choline synthesis (70 umol/day per 100 g, Wise & Elwyn 1965, as extrapolated in Meléndez-Hevia 2009 to ~49 mmol/day for 70 kg) is inconsistent with a total methyl budget of ~20 mmol/day (3 SAM per choline) and was NOT used.']
  },
  {
    id: 'choline-fate',
    title: 'What happens to body choline (adult, 70 kg)',
    unit: 'mmol/day',
    additive: true,
    totals: [{ label: 'Dietary + endogenous choline supply', value: 4.45, low: 3.6, high: 6.2, source: 'calc:sum-of-choline-sources' }],
    items: [
      { label: 'Oxidised to betaine, then DMG, sarcosine, glycine (CHDH/BADH)', value: 3.3, low: 1.9, high: 3.3, source: 'article:melendez-hevia-2009-glycine-weak-link', paramId: 'flux-choline-oxidation-to-betaine', note: 'Inferred from urinary sarcosine in patients with a sarcosine-oxidation defect (Mudd 1980/2007, second-hand). Betaine -> methionine by BHMT donates one methyl group per betaine to the methionine cycle.' },
      { label: 'Gut-bacterial trimethylamine (urinary TMAO)', value: 0.16, low: 0.03, high: 1.35, source: 'assumption:tma-habitual-diet', paramId: 'tma-fraction-habitual-diet', note: 'ASSUMED: 5% (1-30%) of dietary choline. A large free-choline bolus gives 63% (Zhang 1999); phosphatidylcholine does not raise TMAO (Cho 2020).' },
      { label: 'Acetylcholine synthesis', value: 0.01, low: 0.0, high: 0.1, source: 'assumption:acetylcholine-token', extraSources: ['article:li-2008-choline-metabolism-review'], note: 'Whole-body ACh turnover NOT FOUND; shown as a token so the bar is complete.' },
      { label: 'Residual (net PC/membrane accretion, urinary choline/betaine, faecal loss)', value: 1.0, low: 0.0, high: 2.5, source: 'calc:supply-minus-identified-fates', note: 'Remainder of the midpoint supply; not measured. Renal clearance of betaine is <5% and ~4% of an oral betaine dose is excreted unchanged (Lever 1994; Schwahn 2003).' }
    ],
    contested: [
      'The partition is NOT measured as a whole in humans. Isotope studies give enrichment ratios, not fractions of dose (Yan 2013: d9-betaine:d9-choline 1.24; d9-PC 9.4%, PEMT-derived d3/d6-PC 0.17 of d9-PC).',
      'PEMT share of hepatic PC synthesis: 20-40% of the CDP-choline rate in rat hepatocytes, ~10% in mouse (Pynn 2011), up to 47% in mouse hepatocytes vs ~10% in human liver cell lines (2026 NMR, not in repo). Human in vivo: not measured.',
      'Pregnancy diverts choline toward PC and away from betaine (plasma choline +30%, betaine/DMG/sarcosine -13 to -55%; Yan 2012).'
    ]
  },
  {
    id: 'glycine-sinks',
    title: 'Where glycine goes: net metabolic uses (adult, 70 kg)',
    unit: 'g/day',
    additive: true,
    totals: [
      { label: 'Net glycine supply: synthesis 2.9 + diet 1.5-3.0 (Meléndez-Hevia 2009)', value: 5.15, low: 4.4, high: 5.9, source: 'article:melendez-hevia-2009-glycine-weak-link' }
    ],
    items: [
      { label: 'Collagen synthesis (net of recycling)', value: 12, low: 4, high: 12, source: 'article:melendez-hevia-2009-glycine-weak-link', paramId: 'glycine-collagen-net-need-g-day', note: 'Assumes 95% of glycine released in the procollagen cycle is recycled; at no recycling the gross need is 240 g/day; low = supply-matching 4 g/day (recycling >98%).' },
      { label: 'Other protein synthesis (net)', value: 1, low: 1, high: 10.2, source: 'article:melendez-hevia-2009-glycine-weak-link', note: 'Turnover 203 g/day non-collagen protein, ~5% glycine; 1 g/day net is the authors\' value, high = gross 10.2 g/day (calc).' },
      { label: 'Glutathione synthesis (net)', value: 0.57, low: 0.57, high: 3.75, source: 'article:melendez-hevia-2009-glycine-weak-link', paramId: 'glycine-glutathione-net-use-g-day' },
      { label: 'Creatine synthesis', value: 0.55, low: 0.28, high: 1.1, source: 'article:brosnan-2011-creatine-synthesis-burden', note: '7.3 mmol/day (3.7-14.6) x 75.07; Meléndez-Hevia Table 2 uses 5.6 mmol = 0.42 g. Neutral for glycine in that author\'s one-carbon accounting because the methyl group is made from serine.' },
      { label: 'Haem (porphyrins)', value: 0.24, low: 0.24, high: 0.24, source: 'article:melendez-hevia-2009-glycine-weak-link', paramId: 'glycine-heme-use-g-day' },
      { label: 'Purines', value: 0.21, low: 0.21, high: 0.21, source: 'article:melendez-hevia-2009-glycine-weak-link', paramId: 'glycine-purine-use-g-day', note: 'A net glycine SOURCE overall in that accounting (+0.21 g/day).' },
      { label: 'Hippurate (benzoate conjugation)', value: 0.6, low: 0.4, high: 0.8, source: 'article:beyoglu-2012-glycine-conjugation-review', paramId: 'glycine-hippurate-use-g-day', note: 'Not in Meléndez-Hevia Table 2; diet dependent.' },
      { label: 'Bile acid conjugation (net, de novo)', value: 0.06, low: 0.03, high: 0.11, source: 'article:melendez-hevia-2009-glycine-weak-link', paramId: 'glycine-bile-conjugation-net-g-day', note: 'Gross conjugation is ~0.45 g/day (6 mmol; Hepner 1972) but the freed glycine is largely oxidised after bacterial deconjugation.' }
    ],
    cycling: [
      { label: 'GNMT: glycine to sarcosine (returned to glycine by SARDH)', value: 0.22, low: 0.14, high: 0.47, source: 'article:mudd-2007-methyl-balance', paramId: 'glycine-gnmt-sarcosine-use-g-day', note: 'Glycine-sarcosine cycle; not a net loss.' }
    ],
    contested: [
      'The headline "10 g/day deficit" = items 15.2 g/day (this list, with hippurate) minus 5.15 g/day supply = ~10 g/day; the authors\' own balance is -8.5 to -10 g/day with 14.5 g/day of uses.',
      'Collagen need (the biggest item) rests on a 95% recycling assumption and on net collagen synthesis of 96.5 g/day assembled from rat, rabbit and human tissue data.',
      'Tracer-derived de novo glycine synthesis (7-44 g/day in four studies, see glycine-synthesis-estimates) is 2.5-15x the 2.9 g/day pathway sum; no study has directly tested the deficit.',
      'No study measured whether 3-10 g/day oral glycine changes collagen turnover.'
    ]
  },
  {
    id: 'glycine-sources',
    title: 'Glycine supply in the Meléndez-Hevia 2009 pathway summation (adult, 70 kg)',
    unit: 'g/day',
    additive: true,
    items: [
      { label: 'Serine -> glycine (SHMT, net of one-carbon sinks)', value: 2.54, low: 2.54, high: 2.54, source: 'article:melendez-hevia-2009-glycine-weak-link', note: 'Table 1: 33.69 mmol/day.' },
      { label: 'Sarcosine from endogenous methylation (re-entry)', value: 0.14, low: 0.14, high: 0.14, source: 'article:melendez-hevia-2009-glycine-weak-link', note: 'Table 1: 1.89 mmol/day.' },
      { label: 'Glyoxylate', value: 0.09, low: 0.09, high: 0.09, source: 'article:melendez-hevia-2009-glycine-weak-link', note: 'Table 1: 1.17 mmol/day (from mouse oxalate scaling).' },
      { label: 'Sarcosine from dietary choline', value: 0.11, low: 0.11, high: 0.11, source: 'article:melendez-hevia-2009-glycine-weak-link', note: 'Table 1: 1.43 mmol/day.' },
      { label: 'Dietary threonine (7% to glycine)', value: 0.02, low: 0.02, high: 0.02, source: 'article:melendez-hevia-2009-glycine-weak-link', note: 'Table 1: 0.29 mmol/day.' },
      { label: 'Carnitine synthesis', value: 0.006, low: 0.006, high: 0.006, source: 'article:melendez-hevia-2009-glycine-weak-link', note: 'Table 1: 0.08 mmol/day.' },
      { label: 'Dietary protein glycine', value: 2.25, low: 1.5, high: 3.0, source: 'article:melendez-hevia-2009-glycine-weak-link', paramId: 'glycine-dietary-protein-g-day' }
    ]
  },
  {
    id: 'glycine-flux-partition',
    title: 'Gross whole-body glycine flux and its tracer-derived partition (fed adult, 70 kg)',
    unit: 'g/day',
    additive: true,
    totals: [{ label: 'Whole-body glycine flux (fed)', value: 58.4, low: 51.5, high: 65.3, source: 'article:lamers-2007-glycine-flux' }],
    items: [
      { label: 'Glycine -> serine (SHMT exchange)', value: 24.3, low: 20.8, high: 27.9, source: 'article:lamers-2007-glycine-flux', paramId: 'flux-glycine-to-serine-shmt' },
      { label: 'Glycine cleavage system (decarboxylation)', value: 24.0, low: 12.1, high: 29.1, source: 'article:lamers-2007-glycine-flux', extraSources: ['article:lamers-2009-glycine-decarboxylation-tracer'], paramId: 'flux-glycine-gcs-decarboxylation', note: 'The [1-13C] tracer in the later study gives about half (96 vs 190 umol/kg/h).' },
      { label: 'Protein synthesis, glutathione, creatine and all other uses (remainder)', value: 10.1, low: 0.0, high: 32.4, source: 'calc:flux-minus-shmt-minus-gcs', note: 'Remainder 463 - 193 - 190 = 80 umol/kg/h; the ranges of the three parts are wide enough that it could be zero.' }
    ],
    contested: ['This is turnover (appearance and disappearance), dominated by recycling through protein breakdown, serine exchange and the cleavage system; it is NOT net synthesis or net requirement. Fasting flux is 240 umol/kg/h (30 g/day).']
  },
  {
    id: 'glycine-synthesis-estimates',
    title: 'Five estimates of endogenous glycine synthesis (NOT additive)',
    unit: 'g/day',
    additive: false,
    items: [
      { label: 'Meléndez-Hevia 2009: summed pathway fluxes (net new glycine)', value: 2.9, low: 2.9, high: 2.9, source: 'article:melendez-hevia-2009-glycine-weak-link', note: 'Only net new glycine; counts one-carbon units used.' },
      { label: 'Yu 1985: de novo N-synthesis, low-N diet 0.6 g protein/kg', value: 7.4, low: 2.5, high: 7.4, source: 'article:yu-1985-glycine-synthesis-dispensable-aa', note: '59 vs 20 umol/kg/h with vs without dispensable amino acids; the no-DAA value is the 2.5 g/day end.' },
      { label: 'Tan 2022: de novo synthesis, fasting, healthy weight', value: 11.2, low: 9.3, high: 14.3, source: 'article:tan-2022-glycine-serine-synthesis-obesity', note: '124 (IQR 103-159) umol/kg lean mass/h at an ASSUMED 50 kg lean mass (my assumption).' },
      { label: 'Robert 1982: post-absorptive de novo synthesis', value: 24.5, low: 24.5, high: 24.5, source: 'article:robert-1982-glycine-synthesis-postabsorptive', note: '81% of 240 umol/kg/h flux = 194 umol/kg/h.' },
      { label: 'Gersovitz 1980: fed, 1.5 g protein/kg/day', value: 44.3, low: 44.3, high: 44.3, source: 'article:gersovitz-1980-glycine-flux-protein-intake', note: '351 umol/kg/h of 458 umol/kg/h flux; falls sharply on 0.4 g/kg protein.' }
    ],
    contested: ['The estimates measure different things (net pathway sum vs tracer rate of appearance that includes recycling through serine and one-carbon exchange). Both Gibson 2002 (glycine production maintained on marginal protein) and Tan 2022 are cited against a hard shortage but neither quantifies a deficit.']
  }
  ],

  validationTargets: [
  // Directional and magnitude checks for the model assembler (B3). "expected" is what the cited study observed.
  // type: 'range' = steady-state value should fall inside [low, high]; 'change' = relative/absolute change after a perturbation; 'timecourse' = point(s); 'no-data' = a prediction no human study tests.
  { id: 'vt-plasma-sam-sah-ratio', type: 'range', quantity: 'plasma SAM:SAH', low: 4.6, high: 6.6, unit: 'ratio', source: 'article:bravo-2022-sam-sah-reference-values', locator: 'Table 2, mean +/- SD, n=33', note: 'Plasma only; the hepatic SAM:SAH is not known for humans (rat adult ~5:1).' },
  { id: 'vt-gnmt-deficiency-sam', type: 'change', perturbation: 'GNMT activity ~0', quantity: 'plasma SAM', expected: 'x28-47 (3348 vs 71-118 nM)', factorLow: 28, factorHigh: 47, source: 'article:baric-2017-gnmt-deficiency-case', extraSources: ['article:augoustides-2003-gnmt-deficiency-greek'], locator: 'Barić 2017 case report (full text); Augoustides 2003 abstract gives plasma SAM 1643-2222 nM in a Greek boy, methionine 508-1049 uM, tHcy 9.4-12.1 uM, sarcosine normal', note: 'Also methionine 815-1247 uM (ref 7-47) and tHcy 21-28 uM in the Barić patient. Whole-blood SAM was near normal (1790 nM, ref 1000-1800) because of SAM instability: plasma is the right readout.' },
  { id: 'vt-gnmt-knockout-liver-sam', type: 'change', perturbation: 'Gnmt knockout (mouse)', quantity: 'liver SAM', expected: '37 -> ~1334 nmol/g (36x); SAH 12-15 -> 3-5 nmol/g; Met ~100 -> ~700 nmol/g', factorLow: 30, factorHigh: 40, source: 'article:luka-2006-gnmt-knockout-mouse-sam', locator: 'Results (full text)', note: 'Mouse; SAM:SAH ~3 -> ~300.' },
  { id: 'vt-betaine-6g-fasting-hcy', type: 'change', perturbation: 'betaine 6 g/day, 6 weeks', quantity: 'fasting tHcy', expected: '-20% vs placebo (1.5 g: -12%, 3 g: -15%)', direction: 'down', low: -0.2, high: -0.2, unit: 'fraction', source: 'article:olthof-2003-betaine-low-dose-homocysteine', locator: 'Abstract (existing entity)', note: 'Healthy adults, n=76 (19/group).' },
  { id: 'vt-betaine-6g-postload-hcy', type: 'change', perturbation: 'betaine 6 g/day, 6 weeks', quantity: 'tHcy rise after methionine load', expected: '-40% vs placebo (1.5 g: -23%, 3 g: -30%); day 1: -16/-23/-35%', direction: 'down', low: -0.4, high: -0.4, unit: 'fraction', source: 'article:olthof-2003-betaine-low-dose-homocysteine', locator: 'Abstract', note: 'The post-load response is where BHMT matters most.' },
  { id: 'vt-betaine-mild-hhcy', type: 'change', perturbation: 'betaine 6 g/day, 6 weeks, mild hyperhomocysteinaemia', quantity: 'fasting tHcy; post-load AUC', expected: '-1.8 uM (CI -3.6 to 0.0); AUC -221 umol h/L (CI -425 to -16)', direction: 'down', source: 'article:steenge-2003-betaine-homocysteine', locator: 'Abstract', note: 'Folic acid lowered fasting tHcy 2.7 uM but did not change post-load AUC: the two routes act on different parts of the Hcy curve.' },
  { id: 'vt-betaine-acute-hcy', type: 'timecourse', perturbation: 'single betaine dose 1, 3, 6 g', quantity: 'tHcy', expected: 'lower at 3 g (P=0.019) and 6 g (P<0.001), not 1 g; effect within 2 h; still lower at 24 h after 6 g', direction: 'down', source: 'article:schwab-2006-betaine-acute-homocysteine', locator: 'Abstract', note: 'n=10; abstract only (full text blocked).' },
  { id: 'vt-betaine-pk', type: 'timecourse', perturbation: 'betaine 50 mg/kg single dose', quantity: 'plasma betaine', expected: 'Cmax 939 +/- 194 uM at 0.90 h; terminal t1/2 14.4 h; DMG peak 19 uM at 9.7 h', source: 'article:schwahn-2003-betaine-pharmacokinetics', locator: 'Table 1, Results', note: 'Repeated dosing lengthens t1/2 to 41 h (saturable disposal).' },
  { id: 'vt-bhmt-knockout-mouse', type: 'change', perturbation: 'Bhmt knockout (mouse, 5 weeks)', quantity: 'liver AdoMet, AdoHcy, betaine, DMG; plasma tHcy', expected: 'AdoMet 76.4 -> 43.5 nmol/g (-43%); AdoHcy 21.8 -> 54.4 (x2.6); AdoMet:AdoHcy 3.6 -> 0.9; liver betaine ~x21-30; liver DMG 48.2 -> 2.2 nmol/g (-95%); plasma tHcy 6.5 -> 50.8 uM (abstract: x8); liver choline -82%', source: 'article:teng-2011-bhmt-knockout-liver-pools', locator: 'Tables 1, 2 and 5 (full text)', note: 'Mouse. Shows that BHMT loss cannot be compensated by methionine synthase or transsulfuration and lowers the methylation potential; glycine and methionine are unchanged.' },
  { id: 'vt-choline-pc-hcy', type: 'change', perturbation: 'phosphatidylcholine ~2.6 g choline/day, 2 weeks', quantity: 'fasting tHcy; post-load rise', expected: '-18% (-3.0 uM); post-load -29%', direction: 'down', low: -0.18, high: -0.18, unit: 'fraction', source: 'article:olthof-2005-phosphatidylcholine-homocysteine', locator: 'Abstract (existing entity)', note: 'Men with mildly raised Hcy; choline acts through betaine -> BHMT.' },
  { id: 'vt-choline-oral-betaine', type: 'timecourse', perturbation: 'choline bitartrate 620 mg choline vs krill phosphatidylcholine 572 mg choline', quantity: 'baseline-corrected plasma choline and betaine', expected: 'choline Cmax +3.67 uM at 2.67 h vs +4.21 uM at 4.17 h; betaine +18.9 vs +22.6 uM, tmax 7.7 h in both', source: 'article:modinger-2019-choline-bitartrate-vs-krill-pc', locator: 'Tables 2 and 3 (full text)', note: 'n=12; betaine peaks hours after choline, so the choline-to-betaine step is slower than the choline tracer kinetics suggest (82% of plasma [11C] tracer is betaine at 25 min in Roivainen 2000: tracer dose vs mass dose).' },
  { id: 'vt-choline-fast', type: 'change', perturbation: '7-day fast', quantity: 'plasma choline and PC', expected: 'choline 9.5 -> 7.8 uM; PC unchanged (2.2 -> 2.4 mmol/L)', source: 'article:savendahl-1997-fasting-plasma-choline', locator: 'Abstract', note: 'n=10.' },
  { id: 'vt-pregnancy-choline', type: 'change', perturbation: 'pregnancy (3rd trimester)', quantity: 'plasma choline vs betaine, DMG, sarcosine', expected: 'choline +30%; betaine, DMG, sarcosine, methionine -13 to -55%; urinary choline and betaine losses 2-4x', source: 'article:yan-2012-pregnancy-choline-metabolites', locator: 'Abstract', note: '26 pregnant vs 21 non-pregnant women; also higher choline intake (930 vs 480 mg/day) raised metabolites 12-46%.' },
  { id: 'vt-b6-restriction', type: 'change', perturbation: 'B6 <0.5 mg/day for 28 days', quantity: 'plasma PLP; cystathionine; tHcy; glycine', expected: 'PLP 52.6 -> 21.5 nmol/L; cystathionine +52% (131 -> 199 nM) and +66% in a second cohort; tHcy unchanged (6.97 uM); glycine +10% (n.s.) to +29%; methionine-cycle and cleavage fluxes unchanged', source: 'article:gregory-2013-b6-restriction-metabolomics', extraSources: ['article:lamers-2011-b6-restriction-methionine-cycle', 'article:davis-2005-b6-restriction-homocysteine', 'article:lamers-2009-b6-restriction-glycine', 'article:ubbink-1996-b6-methionine-load'], locator: 'Gregory 2013 Table 3; Lamers 2011 abstract; Davis 2005 and Lamers 2009 (existing entities)', note: 'NOTE the plan\'s "B6 deficiency raises cystathionine/glycine" is true for cystathionine (robust) and only weakly for glycine (+10-29%, not significant in the largest cohort).' },
  { id: 'vt-b6-shmt-activity', type: 'change', perturbation: 'B6 restriction', quantity: 'lymphocyte SHMT activity; cleavage flux', expected: 'SHMT -43% in vitro (Davis 2005); in vivo glycine-to-serine flux 182 -> 205 umol/kg/h and cleavage 163 vs 151 (Lamers 2009)', source: 'article:davis-2005-b6-restriction-homocysteine', extraSources: ['article:lamers-2009-b6-restriction-glycine'], locator: 'Abstracts (existing entities)', note: 'In vitro activity falls but the in vivo flux does not: substrate (glycine) rise compensates. f_PLP therefore must feed back through glycine.' },
  { id: 'vt-b6-supplement', type: 'change', perturbation: 'pyridoxine 50 mg/day, 30 days', quantity: 'plasma PLP', expected: '27.0 -> 144.5 nmol/L (median); 40 mg/day: ~10x by day 3, plateau thereafter', source: 'article:chiang-2005-b6-ra-plp-response', extraSources: ['article:bor-2003-b6-supplement-plp-response'], locator: 'Table 2; Bor abstract', note: 'Low-PLP RA patients and CAD patients respectively.' },
  { id: 'vt-niacin-hcy', type: 'change', perturbation: 'niacin titrated 100 -> 1000 mg/day; 18 weeks', quantity: 'plasma tHcy', expected: '13.1 -> 15.3 uM (+17%); +55% vs -7% placebo at 18 weeks', direction: 'up', source: 'article:garg-1999-niacin-homocysteine', locator: 'Abstract', note: 'PAD patients, n=52. This is the ONLY human methyl-pool readout after niacin; SAM and SAH were not measured.' },
  { id: 'vt-niacin-sam-no-data', type: 'no-data', perturbation: 'niacin or nicotinamide supplementation', quantity: 'human SAM, SAH, SAM:SAH', expected: 'NOT FOUND', source: 'article:pissios-2017-nnmt-methyl-sink', locator: 'Review explicitly notes the gap', note: 'Methyl demand of NNMT under niacin load (~9 mmol/day at 2 g) is computed from urinary metabolites, not from a measured SAM response. A cell-line study found SAM stays within 1.5-fold under high NNMT while SAH rises (Ulanovskaya 2013, not in repo).' },
  { id: 'vt-glycine-oral-pk', type: 'timecourse', perturbation: 'glycine 1 mmol/kg lean mass (mean 4.6 g, 3.6-5.4)', quantity: 'plasma glycine', expected: '217 -> 909 uM at 40 min; 414 uM at 120 min (apparent t1/2 ~45 min, calc)', source: 'article:gannon-2002-glycine-insulin', locator: 'Results (NOT SEEN BY B2: figures from a search-tool summary of the full text; abstract has no numbers)', note: 'n=9; treat as unverified. Implies a fast first-order fall of the excess.' },
  { id: 'vt-glycine-oral-chronic', type: 'range', perturbation: 'glycine 0.1 g/kg/day (14 d, obese), 0.12 g/kg x 3/day (8.4 g/day, 5 d), 0.8 g/kg/day (14 d)', quantity: 'plasma glycine', expected: '138 -> 186 uM; 248 -> 558 +/- 271 uM; 240 -> 640 +/- 340 uM', source: 'article:olsson-2025-glycine-alcohol-use-disorder', extraSources: ['article:tan-2025-glycine-supplement-obesity-hcy', 'article:kaufman-2009-glycine-dose-brain'], locator: 'Olsson 2025 Results (full text); Tan 2025 Table 1; Kaufman 2009 Results', note: 'Response is highly variable (SD about half the mean); sampling times differ; 2 of 14 men vomited at 0.8 g/kg/day.' },
  { id: 'vt-glycine-hcy-human', type: 'change', perturbation: 'glycine 100 mg/kg/day (about 7 g), 14 days, severe obesity', quantity: 'tHcy; methionine', expected: 'tHcy 10.2 -> 10.7 uM (+0.6 +/- 1.2, p=0.034); methionine unchanged; serine +17%', direction: 'up (tiny)', source: 'article:tan-2025-glycine-supplement-obesity-hcy', locator: 'Table 3 (full text)', note: 'The closest human data on glycine and the methionine cycle. SAM, SAH, sarcosine NOT measured.' },
  { id: 'vt-glycine-sarcosine-mouse', type: 'change', perturbation: 'glycine 300 mg/kg/day in water, 6 weeks (mouse, high-fat/high-sucrose)', quantity: 'liver sarcosine', expected: '+86% (p<0.05, n=5); liver glycine -21.7% on HFHS tended to recover (p=0.068); SAM and SAH not reported', direction: 'up', source: 'article:alves-2022-glycine-mouse-sarcosine', locator: 'Results (full text)', note: 'Supports increased flux through GNMT after glycine in an animal, but SAM was not measured.' },
  { id: 'vt-gly-arg-hcy', type: 'change', perturbation: 'glycine 200 + arginine 400 mg/kg/day (about 15 g glycine/day), 3 months, creatine-transporter deficiency', quantity: 'tHcy', expected: '81 uM in one patient (others 10.4, 17.4, 16.7, 6.1); normalised by folic acid 5 mg/day', direction: 'up', source: 'article:villar-2012-gly-arg-hyperhomocysteinemia', locator: 'Results (full text)', note: 'Likely mediated by guanidinoacetate -> GAMT SAM use rather than by glycine alone.' },
  { id: 'vt-glycine-sam-no-data', type: 'no-data', perturbation: 'oral glycine 2-10 g in humans', quantity: 'SAM, SAH, SAM:SAH, sarcosine, choline, PC, PEMT', expected: 'NOT FOUND: no human study measured any of these after glycine', source: 'article:luka-2009-gnmt-sam-regulation', extraSources: ['article:fukada-2006-gaa-homocysteine-rat', 'article:sugiyama-1987-methionine-glycine-rat'], locator: 'Review has no data on dietary glycine loads in humans', note: 'The conversation hypothesis "glycine drains SAM via GNMT" (claim:glycine-gnmt-depletes-sam-in-undermethylated) is mechanistically plausible but has NO direct human evidence. The model prediction should be presented as a hypothesis with the ranges of gnmt-km-gly and glycine-liver-free.' },
  { id: 'vt-gastric-ppi-omeprazole', type: 'change', perturbation: 'omeprazole 20 mg/day, 7 days (healthy)', quantity: '24-h median intragastric pH; % time pH<4', expected: 'median pH 1.7 -> 4.6; time at pH<4 89% -> 35% (40 mg: 1.9 -> 4.3; 89% -> 34%)', source: 'article:delchier-1997-omeprazole-24h-acidity', locator: 'Abstract', note: 'Day 1: integrated acidity -18% (day 5: -60%) at 20 mg orally (Cederberg 1993).' },
  { id: 'vt-gastric-ppi-gerd', type: 'change', perturbation: 'esomeprazole 40 vs 20 vs omeprazole 20 mg (GERD patients, day 5)', quantity: 'hours pH>4; median pH', expected: '16.8 h / 4.9; 12.7 h / 4.1; 10.5 h / 3.6', source: 'article:lind-2000-esomeprazole-vs-omeprazole-ph', extraSources: ['article:miner-2003-five-ppi-crossover'], locator: 'Lind 2000 abstract; Miner 2003: hours pH>4 on day 5 esomeprazole 40 mg 14.0, rabeprazole 20 mg 12.1, omeprazole 20 mg 11.8, lansoprazole 30 mg 11.5, pantoprazole 40 mg 10.1', note: 'GERD patients, not healthy volunteers.' },
  { id: 'vt-gastric-meal-ph', type: 'timecourse', perturbation: 'standard solid + liquid meal', quantity: 'gastric pH', expected: 'median fasted 1.7; peak 6.7; back to fasted value in <2 h; duodenal 6.1 fasted, 5.4 fed', source: 'article:dressman-1990-upper-gi-ph', locator: 'Abstract', note: 'Heidelberg capsule, young healthy adults, no gender effect.' },
  { id: 'vt-gastric-glycine-acid', type: 'change', perturbation: 'intragastric glycine 100 mM; IV glycine', quantity: 'acid output; serum gastrin', expected: 'acid 5.6 vs 3.3 mmol/h (saline), no gastrin change (Wald 1982); IV glycine only a slight acid response, whereas phenylalanine/tryptophan give ~50% of the peptone response (McArthur 1983)', source: 'article:wald-1982-glycine-gastric-acid', extraSources: ['article:mcarthur-1983-iv-amino-acids-gastric-acid', 'article:taylor-1982-amino-acids-gastric-acid'], locator: 'Abstracts (existing entities, numbers re-read)', note: 'Taylor 1982\'s abstract names phenylalanine and tryptophan as the potent stimulants and does not mention glycine, so its relation against compound:glycine rests on absence of an effect rather than a glycine result. Wald 1982 shows glycine itself raised acid modestly via absorbed plasma glycine, not via gastrin.' },
  { id: 'vt-histamine-night', type: 'timecourse', perturbation: 'time of day', quantity: 'plasma histamine', expected: '~2x higher at 04:00 than 16:00 in normal subjects; three maxima per 24 h with the largest early-morning; no rhythm in urinary histamine or 1-methylhistamine of children', source: 'article:szefler-1991-nocturnal-histamine', extraSources: ['article:rehn-1987-histamine-circadian', 'article:schulze-1992-urinary-histamine-no-rhythm'], locator: 'Abstracts', note: 'Partial support for claim:histamine-peaks-2-4am.' },
  { id: 'vt-bile-taurine', type: 'change', perturbation: 'taurine 3 g/day, 2 weeks', quantity: 'biliary glycine:taurine ratio', expected: 'ratio reversed (glycine-conjugated predominance becomes taurine-conjugated); small effects on pool size and faecal loss', direction: 'ratio reversal', source: 'article:hardison-1983-taurine-supplementation-bile', locator: 'Abstract (6 men)', note: 'Evidence that the ratio follows amino acid supply; glycine supplementation effect NOT FOUND.' },
  { id: 'vt-cola-gas', type: 'range', perturbation: '800 mL cola', quantity: 'gastric gas volume', low: 600, high: 600, unit: 'mL', source: 'article:ploutz-snyder-1999-carbonated-beverage-gastric-gas', locator: 'Abstract', note: 'A scale for what a real gas load looks like versus bicarbonate-derived CO2.' }
  ],

  models: {
  // Small algebraic / ODE-ready model descriptions for B3. Equations are text; paramIds refer to parameters above.
  gastricAcidCo2: {
    id: 'gastric-acid-bicarbonate-co2',
    title: 'Illustrative gastric acid, bicarbonate and CO2 budget',
    status: 'illustrative educational model; stoichiometric, not a measurement of any person',
    states: [
      { id: 'n_acid', unit: 'mmol', meaning: 'free H+ in the stomach lumen' },
      { id: 'I', unit: 'fraction', meaning: 'fraction of parietal pumps inhibited by a PPI' },
      { id: 'n_CO2_gas', unit: 'mmol', meaning: 'CO2 present as gas in the stomach' }
    ],
    equations: [
      'S(t) = BAO + (PAO - BAO) * stim(t) * (1 - I)      [mmol/h; stim in 0..1 rises with a meal]',
      'dI/dt = k_in(dose) * (1 - I) - ln(2)/t_half * I      [t_half = ppi-pump-recovery-halflife-h; effect builds over days because inhibited pumps accumulate]',
      'R_buffer = food buffering (kappa ~ 14-28 mmol/L/pH unit after a liquid meal; Kalantzi 2006) removes H+ before bicarbonate does',
      'R_hco3 = mucosal (gastric ~0.4 mmol/h basal, 1.0 with sham feeding) + refluxed duodenal/pancreatic (0 in health; up to 18 mmol/h if duodenogastric reflux is complete)',
      'dn_CO2_total/dt = min(n_acid_available, R_hco3)      [1 mmol H+ + 1 mmol HCO3- -> 1 mmol CO2]',
      'n_dissolved = kH * PCO2 * V_liquid      [kH = co2-solubility-37c-mmol-l-mmhg, V_liquid = gastric volume]',
      'V_gas = max(0, n_CO2_total - n_dissolved - n_absorbed) * Vm      [Vm = co2-molar-volume-37c-ml-per-mmol, 25.45 (dry) to 27.13 (water-saturated) mL/mmol]',
      'belch if V_gas > threshold; distal passage fraction = gastric-gas-fraction-passed-distally'
    ],
    paramIds: ['gastric-bao', 'gastric-pao', 'gastric-meal-acid-output', 'gastric-acid-24h', 'gastric-hcl-concentration', 'ppi-pump-recovery-halflife-h', 'gastric-ph-fasting', 'gastric-ph-fed-peak', 'gastric-ph-recovery-h', 'gastric-fasting-volume-ml', 'gastric-secretion-net-ml-h-postmeal', 'gastric-hco3-basal-umol-h', 'duodenal-hco3-basal-umol-cm-h', 'duodenal-hco3-acid-stimulated-umol-cm-h', 'pancreatic-hco3-max-mmol-h', 'co2-molar-volume-37c-ml-per-mmol', 'co2-solubility-37c-mmol-l-mmhg', 'gastric-pco2-basal-mmhg', 'gastric-pco2-after-nahco3-mmhg', 'intestinal-gas-volume-ml', 'flatus-ml-per-day', 'air-swallows-per-hour-fasting', 'gastric-gas-fraction-passed-distally'],
    worked: [
      { label: 'No dissolved-CO2 correction', formula: 'V = n_HCl * 25.45 mL/mmol (37 C)', examples: [{ n_HCl_mmol: 1, gas_mL: 25.5 }, { n_HCl_mmol: 5.95, gas_mL: 151 }, { n_HCl_mmol: 10, gas_mL: 254 }, { n_HCl_mmol: 20, gas_mL: 509 }] },
      { label: 'With dissolved CO2 for 200 mL fluid at PCO2 144 mmHg (0.96 mmol dissolved)', formula: 'V = (n_HCl - 0.96) * 25.45', examples: [{ n_HCl_mmol: 1, gas_mL: 1 }, { n_HCl_mmol: 5.95, gas_mL: 127 }, { n_HCl_mmol: 10, gas_mL: 230 }, { n_HCl_mmol: 20, gas_mL: 485 }] },
      { label: 'Theoretical upper bound for a day', formula: '208.3 mmol/24 h x 25.45 mL/mmol = 5.3 L', examples: [{ n_HCl_mmol: 208.3, gas_mL: 5301 }], note: 'Versus ~0.07 L CO2 in flatus and a total resting gut gas of ~0.1-0.2 L: more than 98% is absorbed or exhaled, or the acid is buffered by food instead of bicarbonate.' }
    ],
    caveats: [
      'Final-pH correction (unreacted bicarbonate above pH ~6) is ignored; this overstates CO2 when the stomach is only partly acidified.',
      'CO2 non-ideality, mucosal absorption rate and the fraction of acid neutralised by food buffers rather than bicarbonate are not measured.',
      'Nothing here shows that bicarbonate-derived CO2 causes belching; most belching is swallowed air (claim:belching-mostly-swallowed-air).'
    ]
  },
  betainePk: {
    id: 'betaine-pk-two-compartment',
    title: 'Oral betaine pharmacokinetics (single dose)',
    status: 'illustrative; fitted to one study (n=12)',
    equations: [
      'dA_gut/dt = -ka * A_gut',
      'dC_c/dt = ka * A_gut / Vc - (CL/Vc) * C_c - k12 * C_c + k21 * (V2/Vc) * C_p',
      'dC_p/dt = k12 * (Vc/V2) * C_c - k21 * C_p',
      'Vc ~ dose / Cmax = 0.46 L/kg (calc); Vss = 1.32 L/kg; CL/F = 0.084 L/h/kg; ka = 2.5 /h; terminal t1/2 14.4 h; distribution t1/2 0.59 h',
      'Repeated dosing: terminal t1/2 41 h and rising DMG imply saturable disposal (BHMT product inhibition by DMG); a linear model is valid for a single dose only'
    ],
    paramIds: ['betaine-dose-pk-mmol-per-kg', 'betaine-cmax-50mgkg', 'betaine-tmax', 'betaine-ka', 'betaine-ke', 'betaine-clearance-per-kg', 'betaine-dmg-peak-after-dose', 'bhmt-ki-dmg'],
    caveats: ['Healthy men only; no data for women, other doses or chronic use beyond 5 days.']
  }
  },

  references: {
    "article:akiba-2011-duodenal-co2-sensing": "Akiba Y et al. 2011, Digestion 83 Suppl 1:25-31 (PMID 21389725)",
    "article:aksoy-1994-human-nnmt": "Aksoy S et al. 1994, The Journal of biological chemistry 269:14835-14840 (PMID 8182091)",
    "article:al-waiz-1987-tma-tmao-urinary-excretion": "Al-Waiz M et al. 1987, Xenobiotica; the fate of foreign compounds in biological systems 17:551-558 (PMID 3604260)",
    "article:allen-1993-serum-betaine-dmg-sarcosine": "Allen RH et al. 1993, Metabolism: clinical and experimental 42:1448-1460 (PMID 7694037)",
    "article:alves-2019-glycine-metabolism-review": "Alves A et al. 2019, Nutrients 11:E1356 (PMID 31208147)",
    "article:alves-2022-glycine-mouse-sarcosine": "Alves A et al. 2022, Nutrients 15:96 (PMID 36615754)",
    "article:arih-2023-serum-dao-hit": "Arih K et al. 2023, Nutrients 15:4246 (PMID 37836530)",
    "article:augoustides-2003-gnmt-deficiency-greek": "Augoustides-Savvopoulou P et al. 2003, Journal of inherited metabolic disease 26:745-759 (PMID 14739680)",
    "article:augustin-2016-human-dmgdh": "Augustin P et al. 2016, The FEBS journal 283:3587-3603 (PMID 27486859)",
    "article:azpiroz-2005-intestinal-gas-review": "Azpiroz F 2005, Gut 54:893-895 (PMID 15951528)",
    "article:baratta-2019-parietal-cell-acid-secretion": "Baratta V et al. 2019, Frontiers in physiology 10:1497 (PMID 31920702)",
    "article:baric-2017-gnmt-deficiency-case": "Barić I et al. 2017, JIMD reports 31:101-106 (PMID 27207470)",
    "article:basu-2002-niacin-rat-homocysteine": "Basu TK et al. 2002, The British journal of nutrition 87:115-119 (PMID 11895163)",
    "article:battaglioli-2003-gad-isoform-kinetics": "Battaglioli G et al. 2003, Journal of neurochemistry (PMID 12887686)",
    "article:bendezu-2015-ct-intestinal-gas": "Bendezú RA et al. 2015, Neurogastroenterology and motility 27:1249-1257 (PMID 26095329)",
    "article:beyoglu-2012-glycine-conjugation-review": "Beyoğlu D et al. 2012, Pharmacology & therapeutics 135:151-167 (PMID 22584143)",
    "article:biegan-1983-human-intestinal-dao": "Biegański T et al. 1983, Biochimica et biophysica acta 756:196-203 (PMID 6403048)",
    "article:bor-2003-b6-supplement-plp-response": "Bor MV et al. 2003, Clinical chemistry 49:155-161 (PMID 12507972)",
    "article:bortz-2025-methyl-shuttling-folate-choline": "Bortz J et al. 2025, Nutrients 17:2495 (PMID 40806080)",
    "article:bravo-2022-sam-sah-reference-values": "Bravo AC et al. 2022, Metabolites 12:373 (PMID 35629877)",
    "article:bredenoord-2004-belching-impedance-healthy": "Bredenoord AJ et al. 2004, Gut 53:1561-1565 (PMID 15479671)",
    "article:brocker-2010-aldh7a1-betaine-aldehyde": "Brocker C et al. 2010, The Journal of biological chemistry 285:18452-18463 (PMID 20207735)",
    "article:brosnan-2007-creatine-review": "Brosnan JT et al. 2007, Annual review of nutrition (PMID 17430086)",
    "article:brosnan-2011-creatine-synthesis-burden": "Brosnan JT et al. 2011, Amino acids 40:1325-1331 (PMID 21387089)",
    "article:caballero-2018-gastric-gas-fate": "Caballero N et al. 2018, Neurogastroenterology and motility 30:e13408 (PMID 30043526)",
    "article:cederberg-1993-omeprazole-24h-acidity": "Cederberg C et al. 1993, Scandinavian journal of gastroenterology 28:179-184 (PMID 8441912)",
    "article:chiang-2005-b6-ra-plp-response": "Chiang EP et al. 2005, Arthritis research & therapy 7:R1404-11 (PMID 16277693)",
    "article:chiang-2009-bile-acid-regulation": "Chiang JY 2009, Journal of lipid research 50:1955-1966 (PMID 19346330)",
    "article:chiang-2013-bile-acid-metabolism-signaling": "Chiang JY 2013, Comprehensive physiology (PMID 23897684)",
    "article:cho-2006-framingham-choline-betaine-intake": "Cho E et al. 2006, The American journal of clinical nutrition 83:905-911 (PMID 16600945)",
    "article:cho-2013-histamine-dao-urticaria": "Cho HJ et al. 2013, Annals of dermatology 25:189-195 (PMID 23717010)",
    "article:davis-2004-remethylation-serine-donor": "Davis SR et al. 2004, American journal of physiology. Endocrinology and metabolism 286:E272-9 (PMID 14559726)",
    "article:davis-2005-b6-restriction-homocysteine": "Davis SR et al. 2005, The American journal of clinical nutrition (PMID 15755835)",
    "article:delchier-1997-omeprazole-24h-acidity": "Delchier JC et al. 1997, Alimentary pharmacology & therapeutics 11:747-753 (PMID 9305485)",
    "article:delong-1999-pc-pathways-molecular-species": "DeLong CJ et al. 1999, The Journal of biological chemistry 274:29683-29688 (PMID 10514439)",
    "article:domschke-1976-pure-pancreatic-juice": "Domschke S et al. 1976, Gastroenterology 70:533-536 (PMID 176080)",
    "article:dressman-1990-upper-gi-ph": "Dressman JB et al. 1990, Pharmaceutical research 7:756-761 (PMID 2395805)",
    "article:dubey-1983-acid-alkali-in-situ-titration": "Dubey P et al. 1983, Gut 24:1126-1129 (PMID 6642276)",
    "article:elmore-2002-human-kidney-dao": "Elmore BO et al. 2002, Journal of biological inorganic chemistry : JBIC : a publication of the Society of Biological Inorganic Chemistry 7:565-579 (PMID 12072962)",
    "article:feitelberg-1992-duodenal-bicarbonate-ph-threshold": "Feitelberg SP et al. 1992, Gastroenterology 102:1252-1258 (PMID 1551532)",
    "article:feldman-1986-24h-acid-secretion": "Feldman M et al. 1986, Gastroenterology 90:540-544 (PMID 3943686)",
    "article:finkelstein-1984-homocysteine-partition-rat-liver": "Finkelstein JD et al. 1984, The Journal of biological chemistry 259:9508-9513 (PMID 6746658)",
    "article:fujiwara-1983-gcs-chicken-liver": "Fujiwara K et al. 1983, The Journal of biological chemistry 258:8156-8162 (PMID 6863283)",
    "article:fukada-2006-gaa-homocysteine-rat": "Fukada S et al. 2006, The Journal of nutrition 136:2797-2802 (PMID 17056803)",
    "article:gallego-ortega-2009-choline-kinase-isoforms": "Gallego-Ortega D et al. 2009, PloS one 4:e7819 (PMID 19915674)",
    "article:gannon-2002-glycine-insulin": "Gannon MC et al. 2002, The American journal of clinical nutrition (PMID 12450897)",
    "article:garg-1999-niacin-homocysteine": "Garg R et al. 1999, American heart journal 138:1082-1087 (PMID 10577438)",
    "article:garrow-1996-pig-bhmt-purification": "Garrow TA 1996, The Journal of biological chemistry 271:22831-22838 (PMID 8798461)",
    "article:gellekink-2005-plasma-sam-sah-lcms": "Gellekink H et al. 2005, Clinical chemistry 51:1487-1492 (PMID 15919880)",
    "article:gersovitz-1980-glycine-flux-protein-intake": "Gersovitz M et al. 1980, Metabolism: clinical and experimental 29:1087-1094 (PMID 7432172)",
    "article:girard-1994-hnmt-kidney-cdna": "Girard B et al. 1994, Molecular pharmacology 45:461-468 (PMID 8145732)",
    "article:gregory-2013-b6-restriction-metabolomics": "Gregory JF et al. 2013, PloS one 8:e63544 (PMID 23776431)",
    "article:gros-2013-dnmt1-kinetics": "Gros C et al. 2013, Nucleic acids research 41:e185 (PMID 23980028)",
    "article:gross-1986-agat-human-kidney": "Gross MD et al. 1986, Archives of biochemistry and biophysics 251:747-755 (PMID 3800397)",
    "article:hacki-1977-secretin-bicarbonate": "HACKI WH et al. 1977, Gut 18:191-195 (PMID 852751)",
    "article:hamilton-2007-cecal-bile-acids": "Hamilton JP et al. 2007, American journal of physiology. Gastrointestinal and liver physiology 293:G256-63 (PMID 17412828)",
    "article:hardison-1983-taurine-supplementation-bile": "Hardison WG et al. 1983, Gastroenterology 84:617-620 (PMID 6822329)",
    "article:hayasaka-1980-gcs-p-protein-rat": "Hayasaka K et al. 1980, Journal of biochemistry 88:1193-1199 (PMID 6778858)",
    "article:hemmink-2009-aerophagia-24h-impedance": "Hemmink GJ et al. 2009, Clinical gastroenterology and hepatology : the official clinical practice journal of the American Gastroenterological Association 7:1127-1129 (PMID 19602452)",
    "article:hepner-1972-cholylglycine-turnover": "Hepner GW et al. 1972, The Journal of clinical investigation 51:1889-1897 (PMID 5032529)",
    "article:hepner-1972-glycine-conjugated-dihydroxy-bile-acids": "Hepner GW et al. 1972, The Journal of clinical investigation 51:1898-1905 (PMID 5032530)",
    "article:hoad-2015-gastric-secretion-volume-mri": "Hoad CL et al. 2015, Physics in medicine and biology 60:1367-1383 (PMID 25592405)",
    "article:hoffman-1979-liver-sam-sah-rat": "Hoffman DR et al. 1979, Canadian journal of biochemistry 57:56-65 (PMID 427630)",
    "article:hoffman-1981-pemt-kinetic-properties": "Hoffman DR et al. 1981, Lipids 16:533-540 (PMID 7278514)",
    "article:hoffman-1981-pemt-sah-inhibition": "Hoffman DR et al. 1981, Lipids 16:561-567 (PMID 7278517)",
    "article:hofmann-2014-enterohepatic-circulation": "Hofmann AF et al. 2014, Journal of lipid research 55:1553-1595 (PMID 24838141)",
    "article:horie-2014-choline-uptake-ls180": "Horie A et al. 2014, Biopharmaceutics & drug disposition 35:532-542 (PMID 25256443)",
    "article:horton-2001-hnmt-structure-kinetics": "Horton JR et al. 2001, Structure (London, England : 1993) 9:837-849 (PMID 11566133)",
    "article:imamura-1984-urinary-histamine-food": "Imamura I et al. 1984, Journal of biochemistry 96:1931-1937 (PMID 6442293)",
    "article:inazu-2019-choline-transporters-review": "Inazu M 2019, Nutrients 11:E2265 (PMID 31547050)",
    "article:isenberg-1986-duodenal-bulb-bicarbonate": "Isenberg JI et al. 1986, Gastroenterology 91:370-378 (PMID 3087810)",
    "article:isenberg-1987-duodenal-bicarbonate-ulcer": "Isenberg JI et al. 1987, The New England journal of medicine 316:374-379 (PMID 3807974)",
    "article:johnson-1991-baat-human-liver": "Johnson MR et al. 1991, The Journal of biological chemistry 266:10227-10233 (PMID 2037576)",
    "article:kalantzi-2006-gastric-buffer-capacity": "Kalantzi L et al. 2006, Pharmaceutical research 23:165-176 (PMID 16308672)",
    "article:katelaris-1993-gastric-acid-age-hpylori": "Katelaris PH et al. 1993, Gut 34:1032-1037 (PMID 8174948)",
    "article:kaufman-2009-glycine-dose-brain": "Kaufman MJ et al. 2009, Psychiatry research 173:143-149 (PMID 19556112)",
    "article:kaunitz-2006-duodenal-co2-carbonic-anhydrase": "Kaunitz JD et al. 2006, The Keio journal of medicine (PMID 17008801)",
    "article:kennedy-1956-cytidine-coenzymes": "KENNEDY EP et al. 1956, The Journal of biological chemistry (PMID 13366993)",
    "article:kikuchi-2008-glycine-cleavage-system": "Kikuchi G et al. 2008, Proceedings of the Japan Academy. Series B, Physical and biological sciences (PMID 18941301)",
    "article:kirchheiner-2009-ppi-relative-potency": "Kirchheiner J et al. 2009, European journal of clinical pharmacology 65:19-31 (PMID 18925391)",
    "article:klocker-2004-plasma-dao-heparin": "Klocker J et al. 2004, Vascular pharmacology 40:293-300 (PMID 15063833)",
    "article:kolkman-1994-intragastric-pco2": "Kolkman JJ et al. 1994, Gut 35:737-741 (PMID 8020795)",
    "article:konstantinova-2008-plasma-choline-betaine-hordaland": "Konstantinova SV et al. 2008, The Journal of nutrition 138:914-920 (PMID 18424601)",
    "article:lamers-2007-glycine-flux": "Lamers Y et al. 2007, The Journal of nutrition (PMID 18029478)",
    "article:lamers-2009-b6-restriction-glycine": "Lamers Y et al. 2009, The Journal of nutrition (PMID 19158217)",
    "article:lamers-2009-glycine-decarboxylation-tracer": "Lamers Y et al. 2009, The Journal of nutrition 139:666-671 (PMID 19244382)",
    "article:lamers-2011-b6-restriction-methionine-cycle": "Lamers Y et al. 2011, The Journal of nutrition 141:835-842 (PMID 21430249)",
    "article:lasser-1975-intestinal-gas-volume": "Lasser RB et al. 1975, The New England journal of medicine 293:524-526 (PMID 1152877)",
    "article:lever-2010-betaine-clinical-significance": "Lever M et al. 2010, Clinical biochemistry 43:732-744 (PMID 20346934)",
    "article:li-2008-choline-metabolism-review": "Li Z et al. 2008, Journal of lipid research 49:1187-1194 (PMID 18204095)",
    "article:lind-2000-esomeprazole-vs-omeprazole-ph": "Lind T et al. 2000, Alimentary pharmacology & therapeutics 14:861-867 (PMID 10886041)",
    "article:lipson-1980-cbs-plp-fibroblasts": "Lipson MH et al. 1980, The Journal of clinical investigation 66:188-193 (PMID 7400312)",
    "article:lotta-1995-comt-kinetics": "Lotta T et al. 1995, Biochemistry 34:4202-4210 (PMID 7703232)",
    "article:ltaief-2021-co2-blood-solubility": "Ltaief Z et al. 2021, Critical care (London, England) 25:318 (PMID 34461974)",
    "article:luka-2006-gnmt-knockout-mouse-sam": "Luka Z et al. 2006, Transgenic research 15:393-397 (PMID 16779654)",
    "article:luka-2008-gnmt-liver-vs-recombinant": "Luka Z et al. 2008, Biochimica et biophysica acta 1784:1342-1346 (PMID 18501206)",
    "article:luka-2009-gnmt-sam-regulation": "Luka Z et al. 2009, The Journal of biological chemistry (PMID 19483083)",
    "article:maccoss-2001-intracellular-enrichment-correction": "MacCoss MJ et al. 2001, American journal of physiology. Endocrinology and metabolism 280:E947-55 (PMID 11350776)",
    "article:martinov-2000-gnmt-methionine-model": "Martinov MV et al. 2000, Journal of theoretical biology 204:521-532 (PMID 10833353)",
    "article:mattaini-2016-serine-metabolism": "Mattaini KR et al. 2016, The Journal of cell biology (PMID 27458133)",
    "article:mcarthur-1983-iv-amino-acids-gastric-acid": "McArthur KE et al. 1983, The Journal of clinical investigation (PMID 6853713)",
    "article:mccoll-1993-hpylori-negative-duodenal-ulcer": "McColl KE et al. 1993, Gut 34:762-768 (PMID 8314508)",
    "article:mcguire-1984-agat-creatine-repression": "McGuire DM et al. 1984, The Journal of biological chemistry 259:12034-12038 (PMID 6384218)",
    "article:melendez-hevia-2009-glycine-weak-link": "Meléndez-Hevia E et al. 2009, Journal of biosciences (PMID 20093739)",
    "article:melnyk-2000-plasma-sam-sah-measurement": "Melnyk S et al. 2000, Clinical chemistry 46:265-272 (PMID 10657384)",
    "article:menon-2007-niacin-er-pharmacokinetics": "Menon RM et al. 2007, International journal of clinical pharmacology and therapeutics 45:448-454 (PMID 17725178)",
    "article:mertz-nielsen-1995-gastric-duodenal-bicarbonate": "Mertz-Nielsen A et al. 1995, Gut 36:528-533 (PMID 7737558)",
    "article:mertz-nielsen-1996-omeprazole-duodenal-bicarbonate": "Mertz-Nielsen A et al. 1996, Gut 38:6-10 (PMID 8566861)",
    "article:millian-1998-human-bhmt-kinetics": "Millian NS et al. 1998, Archives of biochemistry and biophysics 356:93-98 (PMID 9681996)",
    "article:miner-2003-five-ppi-crossover": "Miner P et al. 2003, The American journal of gastroenterology 98:2616-2620 (PMID 14687806)",
    "article:mita-1980-plasma-histamine-gcms": "Mita H et al. 1980, Journal of chromatography 221:1-7 (PMID 7451611)",
    "article:modinger-2019-choline-bitartrate-vs-krill-pc": "Mödinger Y et al. 2019, Nutrients 11:E2548 (PMID 31652561)",
    "article:mudd-1975-labile-methyl-balance-diets": "Mudd SH et al. 1975, Metabolism: clinical and experimental 24:721-735 (PMID 1128236)",
    "article:mudd-2007-methyl-balance": "Mudd SH et al. 2007, The American journal of clinical nutrition (PMID 17209172)",
    "article:mudie-2014-gi-fluid-volumes-fasted": "Mudie DM et al. 2014, Molecular pharmaceutics 11:3039-3047 (PMID 25115349)",
    "article:murtas-2021-human-phgdh": "Murtas G et al. 2021, International journal of molecular sciences 22:4231 (PMID 33921788)",
    "article:naganuma-2017-hnmt-sleep-wake": "Naganuma F et al. 2017, Scientific reports (PMID 29162912)",
    "article:nijhout-2009-glycine-pulse-model": "Nijhout HF et al. 2009, The Journal of nutrition 139:784-791 (PMID 19244383)",
    "article:northfield-1975-bile-acid-pool-size": "Northfield TC et al. 1975, Gut 16:1-11 (PMID 806491)",
    "article:odwyer-2020-hepatocyte-choline-uptake": "O'Dwyer C et al. 2020, Hepatology communications 4:876-889 (PMID 32490323)",
    "article:ogawa-1982-gnmt-purification-kinetics": "Ogawa H et al. 1982, The Journal of biological chemistry 257:3447-3452 (PMID 6801046)",
    "article:ogawa-1983-gamt-rat-liver": "Ogawa H et al. 1983, Archives of biochemistry and biophysics 226:265-275 (PMID 6639053)",
    "article:olsson-2025-glycine-alcohol-use-disorder": "Olsson Y et al. 2025, Alcohol, clinical & experimental research 49:2836-2854 (PMID 41189445)",
    "article:olthof-2003-betaine-low-dose-homocysteine": "Olthof MR et al. 2003, The Journal of nutrition (PMID 14652361)",
    "article:olthof-2005-phosphatidylcholine-homocysteine": "Olthof MR et al. 2005, The American journal of clinical nutrition (PMID 16002808)",
    "article:peng-2011-nnmt-structure-kinetics": "Peng Y et al. 2011, Biochemistry 50:7800-7808 (PMID 21823666)",
    "article:perry-2007-shmt-plp-mcf7": "Perry C et al. 2007, Archives of biochemistry and biophysics 462:21-27 (PMID 17482557)",
    "article:pissios-2017-nnmt-methyl-sink": "Pissios P 2017, Trends in endocrinology and metabolism: TEM (PMID 28291578)",
    "article:ploutz-snyder-1999-carbonated-beverage-gastric-gas": "Ploutz-Snyder L et al. 1999, European journal of applied physiology and occupational physiology 79:212-220 (PMID 10048625)",
    "article:pollock-1991-plasma-histamine-infusion": "Pollock I et al. 1991, Agents and actions 32:359-365 (PMID 1907427)",
    "article:porter-1985-dmgdh-sardh-rat": "Porter DH et al. 1985, Archives of biochemistry and biophysics 243:396-407 (PMID 2417560)",
    "article:pouderoux-1996-swallowed-air-ct": "Pouderoux P et al. 1996, Gastroenterology 110:1422-1428 (PMID 8613047)",
    "article:pradhan-1999-dnmt1-kinetics": "Pradhan S et al. 1999, The Journal of biological chemistry 274:33002-33010 (PMID 10551868)",
    "article:pynn-2011-human-pemt-flux": "Pynn CJ et al. 2011, Journal of lipid research 52:399-407 (PMID 21068006)",
    "article:reed-2015-methyltransferase-model": "Reed MC et al. 2015, BMC systems biology 9:69 (PMID 26467983)",
    "article:rehn-1987-histamine-circadian": "Rehn D et al. 1987, Agents and actions 22:24-29 (PMID 3687597)",
    "article:ridgway-1988-pemt-ordered-mechanism": "Ridgway ND et al. 1988, The Journal of biological chemistry 263:16864-16871 (PMID 3182819)",
    "article:robert-1982-glycine-synthesis-postabsorptive": "Robert JJ et al. 1982, Metabolism: clinical and experimental 31:1210-1218 (PMID 6815417)",
    "article:rohwer-2021-human-glyat": "Rohwer JM et al. 2021, International journal of molecular sciences 22:3129 (PMID 33803916)",
    "article:roivainen-2000-carbon11-choline-metabolism": "Roivainen A et al. 2000, European journal of nuclear medicine 27:25-32 (PMID 10654143)",
    "article:ross-2014-betaine-food-sources": "Ross AB et al. 2014, Food chemistry 145:859-865 (PMID 24128557)",
    "article:salvi-2013-choline-oxidation-review": "Salvi F et al. 2013, Archives of biochemistry and biophysics 537:243-252 (PMID 23906661)",
    "article:savendahl-1997-fasting-plasma-choline": "Savendahl L et al. 1997, The American journal of clinical nutrition 66:622-625 (PMID 9280183)",
    "article:schulze-1992-urinary-histamine-no-rhythm": "Schulze S et al. 1992, Allergy 47:644-649 (PMID 1285571)",
    "article:schwab-2006-betaine-acute-homocysteine": "Schwab U et al. 2006, The Journal of nutrition 136:34-38 (PMID 16365055)",
    "article:schwahn-2003-betaine-pharmacokinetics": "Schwahn BC et al. 2003, British journal of clinical pharmacology 55:6-13 (PMID 12534635)",
    "article:shen-2011-human-chat-kinetics": "Shen XM et al. 2011, Human mutation 32:1259-1267 (PMID 21786365)",
    "article:shin-2002-ppi-acid-secretion-recovery": "Shin JM et al. 2002, Gastroenterology 123:1588-1597 (PMID 12404233)",
    "article:shin-2013-ppi-mechanism-review": "Shin JM et al. 2013, Journal of neurogastroenterology and motility 19:25-35 (PMID 23350044)",
    "article:stead-2006-methyl-balance-reevaluation": "Stead LM et al. 2006, The American journal of clinical nutrition (PMID 16400042)",
    "article:steenge-2003-betaine-homocysteine": "Steenge GR et al. 2003, The Journal of nutrition 133:1291-1295 (PMID 12730412)",
    "article:storch-1988-methionine-cycle-fed-fasted": "Storch KJ et al. 1988, The American journal of physiology 255:E322-31 (PMID 3421329)",
    "article:styles-2016-baat-recombinant": "Styles NA et al. 2016, Journal of lipid research 57:1133-1143 (PMID 27230263)",
    "article:sugiyama-1987-methionine-glycine-rat": "Sugiyama K et al. 1987, Journal of nutritional science and vitaminology 33:195-205 (PMID 3668700)",
    "article:sundler-1975-hepatocyte-pc-synthesis": "Sundler R et al. 1975, The Journal of biological chemistry 250:3359-3367 (PMID 1123345)",
    "article:szefler-1991-nocturnal-histamine": "Szefler SJ et al. 1991, Clinical pharmacology and therapeutics 49:59-68 (PMID 1846332)",
    "article:szegedi-2008-bhmt2-smm": "Szegedi SS et al. 2008, The Journal of biological chemistry (PMID 18230605)",
    "article:taesuwan-2017-tmao-d9-elimination": "Taesuwan S et al. 2017, The Journal of nutritional biochemistry 45:77-82 (PMID 28433924)",
    "article:tan-2022-glycine-serine-synthesis-obesity": "Tan HC et al. 2022, Frontiers in endocrinology 13:900343 (PMID 35757406)",
    "article:tan-2025-glycine-supplement-obesity-hcy": "Tan HC et al. 2025, Scientific reports 15:36433 (PMID 41107432)",
    "article:taylor-1978-pentagastrin-oxo-meal-titration": "Taylor TV et al. 1978, Gut 19:865-869 (PMID 568584)",
    "article:taylor-1982-amino-acids-gastric-acid": "Taylor IL et al. 1982, Gastroenterology (PMID 6806140)",
    "article:teng-2011-bhmt-knockout-liver-pools": "Teng YW et al. 2011, The Journal of biological chemistry 286:36258-36267 (PMID 21878621)",
    "article:tomlin-1991-normal-flatus": "Tomlin J et al. 1991, Gut (PMID 1648028)",
    "article:trujillo-gonzalez-2026-controlled-choline-intake": "Trujillo-Gonzalez I et al. 2026, The American journal of clinical nutrition 123:101236 (PMID 41687879)",
    "article:tsuge-1980-choline-dehydrogenase-rat-liver": "Tsuge H et al. 1980, Biochimica et biophysica acta 614:274-284 (PMID 6996732)",
    "article:ubbink-1996-b6-methionine-load": "Ubbink JB et al. 1996, The Journal of clinical investigation 98:177-184 (PMID 8690790)",
    "article:van-odijk-2023-serum-dao-population": "van Odijk J et al. 2023, Nutrients 15:2887 (PMID 37447214)",
    "article:vance-2014-phospholipid-methylation": "Vance DE 2014, Biochimica et biophysica acta (PMID 24184426)",
    "article:vennemann-2015-eu-choline-intake": "Vennemann FB et al. 2015, The British journal of nutrition 114:2046-2055 (PMID 26423357)",
    "article:villar-2012-gly-arg-hyperhomocysteinemia": "Villar C et al. 2012, JIMD reports 4:13-16 (PMID 23430891)",
    "article:wald-1982-glycine-gastric-acid": "Wald A et al. 1982, The American journal of physiology (PMID 7065145)",
    "article:wallace-2017-us-choline-intake": "Wallace TC et al. 2017, Nutrients 9:E839 (PMID 28783055)",
    "article:wang-1991-bhmt-human-tissues": "Wang JA et al. 1991, Clinica chimica acta; international journal of clinical chemistry 204:239-249 (PMID 1819467)",
    "article:yan-2012-pregnancy-choline-metabolites": "Yan J et al. 2012, The American journal of clinical nutrition 95:1060-1071 (PMID 22418088)",
    "article:yan-2013-pregnancy-d9-choline": "Yan J et al. 2013, The American journal of clinical nutrition 98:1459-1467 (PMID 24132975)",
    "article:yeo-1999-gnmt-5mthf-inhibition": "Yeo EJ et al. 1999, The Journal of biological chemistry (PMID 10608809)",
    "article:yoshikawa-2019-hnmt-brain": "Yoshikawa T et al. 2019, International journal of molecular sciences (PMID 30744146)",
    "article:yu-1985-glycine-synthesis-dispensable-aa": "Yu YM et al. 1985, The Journal of nutrition 115:399-410 (PMID 3973749)",
    "article:zeisel-2003-food-choline-betaine": "Zeisel SH et al. 2003, The Journal of nutrition 133:1302-1307 (PMID 12730414)",
    "article:zhang-1999-choline-tma-urine": "Zhang AQ et al. 1999, Food and chemical toxicology : an international journal published for the British Industrial Biological Research Association 37:515-520 (PMID 10456680)",
    "article:zhang-2016-gnmt-kinetics-37c": "Zhang J et al. 2016, Journal of the American Chemical Society 138:9158-9165 (PMID 27355841)"
  }
}
