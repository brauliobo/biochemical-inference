// Named scenario presets for the methylation model (src/sim/models/methylation.js). Pure data: no imports.
// Run them with runScenario() from ./models/methylation-run.js. Every scenario states
//   expected: qualitative outcomes the model is meant to show (checked in tests/unit/sim-methylation-scenarios.test.js)
//   evidence: how well the outcome is supported - 'supported' (human tracer or clinical data for the direction),
//             'partly' (direction supported, size or mechanism not), 'animal' (animal data only),
//             'hypothesis' (mechanistic prediction without human data; shown as hypothesis in the UI).
// Structure: background = controls held for the whole run (the run starts from that steady state, e.g. a low-folate
// diet); stages = consecutive periods, each with its own controls and timed events; doses are grams of the compound.
// Hours are model hours; the first stage is the baseline period before the intervention starts.

const base = (label = 'baseline', hours = 8) => ({ label, hours })
const after = (label, hours, extra = {}) => ({ label, hours, ...extra })

export const scenarios = [
  {
    id: 'baseline-fed', label: 'Baseline fed state', group: 'reference',
    description: 'Reference hepatic steady state (Reed 2015 liver cycle, calibrated): the model stays put for 72 h. Use it as the comparison curve.',
    stages: [after('baseline', 72)],
    expected: [{ observable: 'samSahRatio', direction: 'flat', note: 'steady state: no drift' }],
    evidence: { status: 'supported', summary: 'Reproduces published steady-state ranges (see validation table); a calibration, not a prediction.', refs: ['article:reed-2015-competing-methyltransferases'] }
  },
  ...[3, 5, 10].map((g) => ({
    id: `glycine-${g}g`, label: `Glycine load ${g} g (single oral dose)`, group: 'glycine', observables: ['gly_p', 'gly', 'sar', 'gnmt', 'sam', 'sah', 'samSahRatio', 'tHcy'],
    description: `${g} g glycine at hour 8. Plasma glycine PK is calibrated to Gannon 2002 (1 mmol/kg lean mass: 217 -> 909 uM at 40 min, unverified secondhand value). The hepatic response (GNMT flux, sarcosine, SAM:SAH) is a model prediction: it depends on the contested GNMT glycine Km (switch the gnmtGlycineKm variant) and on the hepatic glycine rise (ensemble).`,
    stages: [base(), after('glycine', 64, { events: [{ at: 0, dose: { glycine: g }, label: `${g} g glycine` }] })],
    expected: [
      { observable: 'gly_p', direction: 'up', note: 'plasma glycine peaks within about an hour and falls back in a few hours' },
      { observable: 'gly', direction: 'up', note: 'hepatic glycine rises (size depends on transporter assumptions)' },
      { observable: 'gnmt', direction: 'up (Luka mM Km) / ~flat (Reed 130 uM Km)', note: 'with Km 130 uM GNMT is already ~93% glycine-saturated' },
      { observable: 'samSahRatio', direction: 'small change (|d| < 10%)', note: 'SAM feedback on GNMT and the folate/serine arms buffer the glycine effect' }
    ],
    evidence: { status: 'hypothesis', summary: 'No human study measured SAM, SAH, sarcosine or SAM:SAH after glycine. Human tHcy +0.6 uM after 14 d of 7 g/day (Tan 2025); mouse liver sarcosine +86% (Alves 2022).', refs: ['article:luka-2009-gnmt-sam-regulation', 'article:tan-2025-glycine-supplement-obesity-hcy', 'article:alves-2022-glycine-mouse-sarcosine', 'article:gannon-2002-glycine-insulin'] }
  })),
  {
    id: 'glycine-10g-day', label: 'Glycine 10 g/day (chronic, continuous)', group: 'glycine', observables: ['gly', 'sar', 'gnmt', 'sam', 'samSahRatio', 'tHcy', 'ser'],
    description: 'Continuous extra glycine intake of 10 g/day from hour 8 (about 140 mg/kg/day). Compare with Tan 2025 (100 mg/kg/day for 14 d: tHcy +0.6 uM).',
    stages: [base(), after('glycine 10 g/day', 64, { controls: { glycineLoad: 10 } })],
    expected: [{ observable: 'gly', direction: 'up' }, { observable: 'tHcy', direction: 'small change', note: 'human data: +0.6 uM (n.s. to small)' }],
    evidence: { status: 'hypothesis', summary: 'Plasma glycine rise is supported by chronic-dosing studies; the methyl-pool response is a prediction (no human SAM/SAH data after glycine).', refs: ['article:tan-2025-glycine-supplement-obesity-hcy', 'article:olsson-2025-glycine-alcohol-use-disorder'] }
  },
  ...[[0.5, '500 mg'], [2, '2 g']].map(([g, name]) => ({
    id: `choline-${name.replace(' ', '')}`, label: `Choline ${name} (single oral dose)`, group: 'choline', observables: ['cho', 'bet', 'bet_p', 'dmg', 'bhmt', 'hcy', 'tHcy', 'sam'],
    description: `${name} choline at hour 8, absorbed over a few hours into the hepatic choline pool (first pass). Choline is oxidised to betaine (CHDH, Km 7 mM) or enters the Kennedy pathway; betaine then feeds BHMT. Acute size depends on the assumed first-pass volume (structural constant dose_cho).`,
    stages: [base(), after('choline', 64, { events: [{ at: 0, dose: { choline: g }, label: `${name} choline` }] })],
    expected: [{ observable: 'bet', direction: 'up' }, { observable: 'bhmt', direction: 'up' }, { observable: 'hcy', direction: 'down' }],
    evidence: { status: 'partly', summary: 'Choline raises plasma betaine (Modinger 2019) and chronic choline lowers tHcy 18% (Olthof 2005); acute hepatic exposure is assumed.', refs: ['article:modinger-2019-choline-bitartrate-vs-krill-pc', 'article:olthof-2005-phosphatidylcholine-homocysteine'] }
  })),
  {
    id: 'betaine-3g', label: 'Betaine 3 g (single oral dose)', group: 'choline', observables: ['bet_p', 'bet', 'dmg', 'bhmt', 'hcy', 'tHcy', 'sam', 'samSahRatio'],
    description: 'Single 3 g betaine dose at hour 8. Plasma PK follows Schwahn 2003 (Cmax 939 uM at 50 mg/kg). tHcy falls within hours at 3 g (Schwab 2006). The size of the BHMT response depends on the contested betaine Km (variant bhmtBetaineKm).',
    stages: [base(), after('betaine', 64, { events: [{ at: 0, dose: { betaine: 3 }, label: '3 g betaine' }] })],
    expected: [{ observable: 'bet_p', direction: 'up', note: 'Cmax of several hundred uM at ~1 h' }, { observable: 'bhmt', direction: 'up' }, { observable: 'tHcy', direction: 'down' }],
    evidence: { status: 'supported', summary: 'Single and chronic betaine doses lower tHcy in humans; the model reproduces the direction and a size of the right order.', refs: ['article:schwab-2006-betaine-acute-homocysteine', 'article:schwahn-2003-betaine-pharmacokinetics', 'article:olthof-2003-betaine-low-dose-homocysteine'] }
  },
  {
    id: 'betaine-6g-day', label: 'Betaine 6 g/day (chronic)', group: 'choline', observables: ['bet', 'dmg', 'bhmt', 'hcy', 'tHcy', 'sam'],
    description: 'Continuous 6 g/day betaine (the Olthof 2003 dose). Chronic steady state is better read from the dose-response (sweep) than from 72 h.',
    stages: [base(), after('betaine 6 g/day', 64, { controls: { betaineIntake: 6 } })],
    expected: [{ observable: 'tHcy', direction: 'down', note: 'human: about -20% fasting, -40% after a methionine load (6 weeks)' }],
    evidence: { status: 'supported', summary: 'Randomised trials: tHcy -12% / -15% / -20% at 1.5 / 3 / 6 g/day.', refs: ['article:olthof-2003-betaine-low-dose-homocysteine', 'article:steenge-2003-betaine-homocysteine'] }
  },
  {
    id: 'mthfr-677tt', label: 'MTHFR 677TT-like (0.4x activity)', group: 'folate', observables: ['mthf', 'thf', 'ch2thf', 'hcy', 'tHcy', 'sam', 'samSahRatio', 'gnmt'],
    description: 'MTHFR activity drops to 0.4x (677TT homozygote ~0.3-0.5x) at hour 8. 5-methyl-THF falls, other folates rise, homocysteine rises. 5-MTHF inhibits GNMT, so SAM use partly relaxes.',
    stages: [base(), after('MTHFR 0.4x', 64, { controls: { mthfrActivity: 0.4 } })],
    expected: [{ observable: 'mthf', direction: 'down' }, { observable: 'tHcy', direction: 'up' }, { observable: 'samSahRatio', direction: 'down' }],
    evidence: { status: 'supported', summary: 'tHcy is higher in 677TT homozygotes, most clearly with low folate; SAM:SAH in humans is not well characterised.', refs: ['article:yamada-2001-mthfr-polymorphisms', 'article:sadre-marandi-2018-hepatic-one-carbon-sex'] }
  },
  {
    id: 'mthfr-677tt-low-folate', label: 'MTHFR 677TT-like in a low-folate state', group: 'folate', observables: ['mthf', 'folateTotal', 'hcy', 'tHcy', 'sam', 'samSahRatio'],
    description: 'Low-folate background (folate supply 0.5x, steady state) with MTHFR 0.4x from hour 8: the gene-nutrient interaction.',
    background: { folateSupply: 0.5 },
    stages: [base(), after('MTHFR 0.4x', 64, { controls: { mthfrActivity: 0.4 } })],
    expected: [{ observable: 'tHcy', direction: 'up (more than at normal folate)' }, { observable: 'samSahRatio', direction: 'down' }],
    evidence: { status: 'supported', summary: 'The TT genotype effect on tHcy is larger at low folate.', refs: ['article:yamada-2001-mthfr-polymorphisms'] }
  },
  ...[[0.41, 'B6 restriction (PLP at 41% of baseline)', 'b6-restriction'], [0.15, 'Severe B6 deficiency (PLP at 15%)', 'b6-severe']].map(([plp, label, id]) => ({
    id, label, group: 'b6', observables: ['cysta', 'hcy', 'tHcy', 'gly', 'ser', 'sam', 'samSahRatio', 'cbs', 'cth'],
    description: `${label} from hour 8; scales CBS (K 0.43), CTH (0.86), SHMT and GCS (0.10) through f(PLP) = (P/(K+P))/(1/(K+1)). Cystathionine rises because CTH is more PLP-sensitive than CBS (classical cystathioninuria of B6 deficiency); the 'cystathionine falls' pattern belongs to CBS deficiency, not to B6 deficiency.`,
    stages: [base(), after('B6 low', 64, { controls: { b6Status: plp } })],
    expected: [{ observable: 'cysta', direction: 'up' }, { observable: 'tHcy', direction: 'up (model) vs ~unchanged (restriction study)', note: 'fasting tHcy was unchanged after 28 d of B6 restriction; post-methionine-load tHcy rises' }],
    evidence: { status: 'supported', summary: 'Cystathionine +52-66% and PLP 52.6 -> 21.5 nM with B6 restriction (Gregory 2013); fasting tHcy unchanged; glycine +10-29%. The model overshoots fasting tHcy.', refs: ['article:gregory-2013-b6-restriction-metabolomics', 'article:lamers-2011-b6-restriction-methionine-cycle', 'article:davis-2005-b6-restriction-homocysteine'] }
  })),
  ...[[0.2, 'B12 deficiency (methionine synthase at 20%)', 'b12-deficiency'], [0.05, 'Severe B12 deficiency (methionine synthase at 5%)', 'b12-severe']].map(([v, label, id]) => ({
    id, label, group: 'b12', observables: ['mthf', 'thf', 'f10', 'folateTotal', 'hcy', 'tHcy', 'met', 'sam', 'sah', 'samSahRatio', 'mtr'],
    description: `${label} from hour 8. Methionine synthase is the only exit of 5-methyl-THF and MTHFR is irreversible, so folate is trapped as 5-MTHF (methyl-folate trap): 5-MTHF rises, THF and formyl-folates fall, homocysteine rises. In the model the trapped 5-MTHF also inhibits GNMT, which can raise SAM:SAH - a prediction that contradicts the low SAM:SAH usually assumed in B12 deficiency (parameter-dependent, see ensemble).`,
    stages: [base(), after('B12 low', 64, { controls: { b12Activity: v } })],
    expected: [{ observable: 'mthf', direction: 'up' }, { observable: 'thf', direction: 'down' }, { observable: 'tHcy', direction: 'up' }],
    evidence: { status: 'supported', summary: 'Methyl-folate trap and hyperhomocysteinaemia in cobalamin deficiency are textbook; SAM:SAH direction is not settled.', refs: ['article:nijhout-2004-folate-cycle-model'] }
  })),
  ...[[0.5, '500 mg', 'niacin-500mg'], [2, '2 g', 'niacin-2g']].map(([g, name, id]) => ({
    id, label: `Niacin ${name}/day (chronic NNMT load)`, group: 'niacin', observables: ['nam', 'mna', 'nnmt', 'sam', 'sah', 'samSahRatio', 'hcy', 'tHcy', 'samUseTotal'],
    description: `Continuous niacin ${name}/day from hour 8: about 54% of the dose is methylated by NNMT (4.38 mmol methyl per g, parameters-b2), i.e. ${(g * 4.38).toFixed(1)} mmol/day of methyl groups (${((g * 4.38) / 20 * 100).toFixed(0)}% of whole-body transmethylation). The liver model carries a proportional share (loadScale). SAH rises, SAM and SAM:SAH fall, tHcy rises.`,
    stages: [base(), after('niacin', 64, { controls: { niacinDose: g } })],
    expected: [{ observable: 'nnmt', direction: 'up' }, { observable: 'samSahRatio', direction: 'down' }, { observable: 'tHcy', direction: 'up', note: 'Garg 1999: +17% at up to 1 g/day' }],
    evidence: { status: 'partly', summary: 'Niacin raises tHcy 17-55% (Garg 1999) and NNMT methylation of niacin is measured in urine; no human SAM/SAH data after niacin exist (documented gap).', refs: ['article:garg-1999-niacin-homocysteine', 'article:pissios-2017-nnmt-methyl-sink'] }
  })),
  {
    id: 'pemt-upregulation', label: 'PEMT upregulation (2x)', group: 'choline', observables: ['pemt', 'samUsePemt', 'pe', 'pc', 'cho', 'sam', 'samSahRatio', 'tHcy'],
    description: 'PEMT activity doubles (as with oestrogen-driven induction) at hour 8: SAM use by PC synthesis rises, SAM:SAH falls somewhat, PE is consumed.',
    stages: [base(), after('PEMT 2x', 64, { controls: { pemtActivity: 2 } })],
    expected: [{ observable: 'samUsePemt', direction: 'up' }, { observable: 'samSahRatio', direction: 'down' }],
    evidence: { status: 'partly', summary: 'PEMT is a major SAM consumer in animals (human PEMT flux 0.53%/h of the liver PC pool, n = 4); the effect of induction on SAM:SAH is a model prediction.', refs: ['article:pynn-2011-human-pemt-flux', 'article:stead-2006-methyl-balance-reevaluation'] }
  },
  {
    id: 'methionine-meal', label: 'High-methionine meal (1.5 g methionine)', group: 'methionine', observables: ['met', 'sam', 'sah', 'samSahRatio', 'hcy', 'tHcy', 'cbs', 'gnmt'],
    description: '1.5 g methionine at hour 8 (about a day of typical intake in one meal). Methionine, SAM and SAH rise transiently, SAM:SAH dips, CBS and GNMT surge (substrate switch), tHcy peaks several hours later.',
    stages: [base(), after('meal', 64, { events: [{ at: 0, dose: { methionine: 1.5 }, label: '1.5 g methionine' }] })],
    expected: [{ observable: 'sam', direction: 'up (transient)' }, { observable: 'samSahRatio', direction: 'down (transient)' }, { observable: 'tHcy', direction: 'up (transient, peak ~4-8 h)' }],
    evidence: { status: 'partly', summary: 'The oral methionine load test raises tHcy for 6-8 h (clinical standard, 100 mg/kg); hepatic SAM/SAH are inferred from rodent data (Finkelstein 1982, Korendyaseva 2008).', refs: ['article:korendyaseva-2008-methionine-switch-allosteric', 'article:finkelstein-1982-methionine-metabolite-concentrations'] }
  },
  {
    id: 'methionine-load-test', label: 'Oral methionine load test (100 mg/kg, 7 g)', group: 'methionine', observables: ['met', 'sam', 'sah', 'samSahRatio', 'hcy', 'tHcy'],
    description: 'Standard 100 mg/kg load (7 g for 70 kg) at hour 8: tHcy rises about 1.5-2x at 6-8 h, the post-load increment being the sensitive readout for B6 status and betaine effects (Olthof 2003: -40% with 6 g/day betaine).',
    stages: [base(), after('load', 64, { events: [{ at: 0, dose: { methionine: 7 }, label: 'methionine 100 mg/kg' }] })],
    expected: [{ observable: 'tHcy', direction: 'up (peak 4-8 h after the load)' }],
    evidence: { status: 'supported', summary: 'Post-load tHcy increments of roughly +8-15 uM at 6 h are standard clinical data.', refs: ['article:ubbink-1996-b6-methionine-load', 'article:olthof-2003-betaine-low-dose-homocysteine'] }
  },
  {
    id: 'methionine-load-test-b6', label: 'Methionine load test in B6 restriction', group: 'b6', observables: ['tHcy', 'cysta', 'sam', 'samSahRatio'],
    description: 'The same 7 g load with PLP at 41% (restriction): the post-load tHcy increment is larger than with normal B6 (CBS limited), the established sensitive test of B6 status.',
    background: { b6Status: 0.41 },
    stages: [base(), after('load', 64, { events: [{ at: 0, dose: { methionine: 7 }, label: 'methionine 100 mg/kg' }] })],
    expected: [{ observable: 'tHcy', direction: 'up, larger than at normal B6' }],
    evidence: { status: 'supported', summary: 'Post-load tHcy is raised in B6 deficiency while fasting tHcy is little changed (Ubbink 1996, Lamers 2011).', refs: ['article:ubbink-1996-b6-methionine-load', 'article:lamers-2011-b6-restriction-methionine-cycle'] }
  },
  {
    id: 'glycine-niacin-low-folate', label: 'Glycine 10 g/day + niacin 2 g/day in a low-folate state', group: 'combination', observables: ['sam', 'sah', 'samSahRatio', 'tHcy', 'gnmt', 'nnmt', 'gly', 'mthf'],
    description: "'Under-methylation-like' profile: low folate supply (0.5x, steady state) + chronic glycine + niacin from hour 8. Two methyl sinks (GNMT/NNMT) act on a reduced remethylation capacity; SAM and SAM:SAH fall, tHcy rises. The glycine part is hypothesis-only; the niacin part rests on NNMT stoichiometry.",
    background: { folateSupply: 0.5 },
    stages: [base(), after('combination', 64, { controls: { glycineLoad: 10, niacinDose: 2 } })],
    expected: [{ observable: 'samSahRatio', direction: 'down' }, { observable: 'tHcy', direction: 'up' }],
    evidence: { status: 'hypothesis', summary: 'No human data combine these exposures; the profile is a model-generated hypothesis, not a measured syndrome.', refs: ['article:luka-2009-gnmt-sam-regulation', 'article:pissios-2017-nnmt-methyl-sink', 'article:garg-1999-niacin-homocysteine'] }
  },
  {
    id: 'glycine-low-folate', label: 'Glycine 10 g/day in a low-folate state', group: 'combination', observables: ['sam', 'samSahRatio', 'tHcy', 'gnmt', 'gly', 'mthf'],
    description: 'Chronic glycine on a low-folate background (5-MTHF falls, GNMT is less folate-inhibited). Isolates the glycine part of the combination.',
    background: { folateSupply: 0.5 },
    stages: [base(), after('glycine', 64, { controls: { glycineLoad: 10 } })],
    expected: [{ observable: 'samSahRatio', direction: 'small change' }],
    evidence: { status: 'hypothesis', summary: 'Mechanistic prediction (GNMT folate inhibition relieved at low 5-MTHF); no human data.', refs: ['article:luka-2009-gnmt-sam-regulation'] }
  }
]

export const scenarioIndex = Object.fromEntries(scenarios.map((s) => [s.id, s]))
export default scenarios
