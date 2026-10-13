// Outcomes: symptoms, signs, biomarkers and intervention results.
// Educational content only; nothing here is a diagnosis or medical advice.
export default [
  {
    id: "outcome:belching",
    type: "outcome",
    name: "Belching (eructation)",
    aliases: ["Arrotos", "Eructação", "Burping", "Gas expelled orally", "eructações", "arrotar", "gases em forma de arroto", "arrotos frequentes"],
    summary: "Expulsion of gas through the mouth, mostly swallowed air vented by gastric or supragastric mechanisms; chemical CO2 and bacterial gas add little, so it is not specific to any one cause.",
    body: [
      "Belching is normal after meals: swallowed air and CO2 distend the stomach, triggering a vagally mediated transient LES relaxation ([[system:lower-esophageal-sphincter]]). Excessive belching is typically a swallowed-air problem, often with a behavioural supragastric component ([[disease:aerophagia-belching-disorders]]), and may be aggravated by carbonated drinks, fast eating, chewing gum, reflux ([[disease:gerd]]) or anxiety. Impedance monitoring ([[outcome:reflux-episodes]]) distinguishes the types.",
      "In the conversation, belching rather than flatulence is read as proof that gas originates in the upper gut. That is a reasonable pointer to the stomach or oesophagus, but it does not say whether the gas is air, CO2 or fermentation products, and the specific glycine mechanism is unproven ([[outcome:glycine-intolerance]], [[claim:belching-mostly-swallowed-air]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "disease:aerophagia-belching-disorders" },
      { rel: "associated-with", to: "system:lower-esophageal-sphincter" },
      { rel: "aggravates", to: "disease:lpr", note: "Hypothesised route for refluxate/pepsin to reach the larynx; untested." },
      { rel: "measured-by", to: "outcome:reflux-episodes", note: "Impedance-pH classifies gastric versus supragastric belching." }
    ],
    refs: ["article:stanghellini-2016-rome-iv-gastroduodenal", "article:ong-2018-diaphragmatic-breathing-belching"]
  },
  {
    id: "outcome:night-waking",
    type: "outcome",
    name: "Night waking at 2-3 am",
    aliases: ["Despertar às 2-3h", "Nocturnal awakening", "Early-morning waking", "Insônia de manutenção"],
    summary: "Awakening in the small hours, sometimes with palpitations and heat. Has many causes (sleep apnoea, anxiety, reflux, alcohol, glucose dips); a histamine or vagal-brake explanation is a hypothesis only.",
    body: [
      "The source conversation attributes the user's waking with tachycardia and heat to a nocturnal histamine peak insufficiently cleared by [[enzyme:hnmt]], relieved by choline via [[enzyme:bhmt]], SAM and a vagal acetylcholine 'brake'. Plasma histamine does show circadian variation with a night/early-morning peak in some human data, partly from mast-cell clocks, but brain histaminergic neurons are least active in sleep, and the specific chain has not been tested ([[claim:histamine-peaks-2-4am]], [[claim:choline-fixed-night-waking-via-bhmt-hnmt]], [[claim:choline-supplies-nocturnal-vagal-brake]]).",
      "Common alternative explanations include obstructive sleep apnoea, nocturnal reflux, stress, alcohol, blood-glucose variation and hormonal change. Persistent night waking with palpitations deserves clinical assessment. Educational only."
    ],
    evidence: "plausible",
    relations: [
      { rel: "associated-with", to: "state:histamine-excess" },
      { rel: "associated-with", to: "disease:anxiety-disorder" },
      { rel: "associated-with", to: "system:cardiac-autonomic-control" },
      { rel: "associated-with", to: "outcome:tachycardia" }
    ],
    refs: ["article:nakamura-2017-mast-cell-clock-histamine"]
  },
  {
    id: "outcome:throat-burning",
    type: "outcome",
    name: "Throat burning",
    aliases: ["Queimação na garganta", "Pharyngeal burning", "Laryngeal irritation", "Globus / throat clearing", "pigarro", "bolo na garganta", "globus"],
    summary: "A burning sensation in the throat. A symptom attributed to laryngopharyngeal reflux but with many other causes; reflux needs objective confirmation rather than assumption.",
    body: [
      "The [[system:larynx-pharynx]] has less mucus, bicarbonate and carbonic-anhydrase protection than the oesophagus, so small amounts of acid, [[compound:pepsin]] or bile may irritate it ([[disease:lpr]]). But throat burning also arises from voice overuse, post-nasal drip, allergy, infections, oesophageal motility problems, irritant foods, oregano oil and similar phenols, and anxiety. The AGA 2023 update recommends reflux testing before empiric PPIs when typical heartburn is absent ([[claim:throat-burning-means-lpr]]).",
      "The conversation notes burning with oregano oil and uses it as supporting evidence of LPR; irritants can burn inflamed tissue regardless of cause. Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "disease:lpr" },
      { rel: "associated-with", to: "compound:pepsin" },
      { rel: "associated-with", to: "system:larynx-pharynx" },
      { rel: "measured-by", to: "outcome:salivary-pepsin", note: "Contested adjunct test." }
    ],
    refs: ["article:chen-2023-aga-extraesophageal-reflux"]
  },
  {
    id: "outcome:brain-fog",
    type: "outcome",
    name: "Brain fog",
    aliases: ["Névoa mental", "Cognitive fog", "Mental fatigue", "Poor concentration"],
    summary: "A non-specific complaint of slowed thinking and poor concentration. Not a diagnosis; causes include sleep loss, anxiety, depression, B12 deficiency, thyroid disease and infections.",
    body: [
      "Brain fog is reported with many conditions. Documented nutritional causes include B12 deficiency ([[disease:vitamin-b12-deficiency]]) and, rarely, folate or B6 deficiency ([[state:b6-functional-deficiency]]). The conversation proposes that P5P fixed brain fog by restoring [[enzyme:gad]] activity and the glutamate/GABA balance ([[outcome:glutamate-gaba-imbalance]]); this is a plausible but unproven account of one person's experience ([[claim:p5p-gad-gaba-relieves-anxiety]]).",
      "Persistent cognitive symptoms deserve medical assessment, as the differential includes sleep apnoea, depression, medication effects and thyroid or metabolic disease. Educational only."
    ],
    evidence: "plausible",
    relations: [
      { rel: "associated-with", to: "disease:vitamin-b12-deficiency" },
      { rel: "associated-with", to: "state:b6-functional-deficiency" },
      { rel: "associated-with", to: "outcome:glutamate-gaba-imbalance" },
      { rel: "associated-with", to: "disease:anxiety-disorder" }
    ],
    refs: ["article:stabler-2013-vitamin-b12-deficiency"]
  },
  {
    id: "outcome:tachycardia",
    type: "outcome",
    name: "Tachycardia (palpitations)",
    aliases: ["Taquicardia", "Palpitações", "Racing heart"],
    summary: "Resting heart rate above 100 per minute or a sensation of racing heart. It reflects raised sympathetic or lowered vagal tone, and has cardiac, endocrine, drug, anxiety and histamine-related causes.",
    body: [
      "The sinoatrial node is slowed by vagal [[compound:acetylcholine]] acting on M2 receptors and accelerated by catecholamines ([[system:cardiac-autonomic-control]]). Histamine acting on H1 and H2 receptors also raises heart rate and can cause flushing and hypotension ([[claim:histamine-h1-h2-tachycardia-flushing]]). Night-time episodes should be evaluated for arrhythmia, sleep apnoea, thyroid disease, alcohol or stimulant effects.",
      "The conversation's claim that choline 'supplied the vagal brake' and stopped adrenergic discharge is speculative ([[claim:choline-supplies-nocturnal-vagal-brake]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "state:histamine-excess" },
      { rel: "associated-with", to: "system:cardiac-autonomic-control" },
      { rel: "associated-with", to: "disease:anxiety-disorder" },
      { rel: "associated-with", to: "compound:acetylcholine" }
    ],
    refs: ["article:gordan-2015-autonomic-cardiovascular-control"]
  },
  {
    id: "outcome:flushing",
    type: "outcome",
    name: "Flushing",
    aliases: ["Rubor", "Calor súbito", "Facial flushing", "Hot flush"],
    summary: "Transient redness and warmth caused by vasodilation; with histamine release, it is mediated by H1 and H2 receptors. Menopause, drugs, alcohol, carcinoid and anxiety are other causes.",
    body: [
      "[[compound:histamine]] released from mast cells or absorbed from food dilates vessels, increases permeability and raises heart rate ([[state:histamine-excess]], [[disease:histamine-intolerance]]). Niacin also causes a prostaglandin-mediated flush, which is unrelated to histamine and a reason for caution about niacin as a 'methyl sink' ([[claim:niacin-drains-methyl-groups]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "state:histamine-excess" },
      { rel: "associated-with", to: "compound:histamine" },
      { rel: "associated-with", to: "disease:histamine-intolerance" }
    ],
    refs: ["article:maintz-2007-histamine-intolerance"]
  },
  {
    id: "outcome:anxiety",
    type: "outcome",
    name: "Anxiety (symptom)",
    aliases: ["Ansiedade", "Nervousness", "Hyperarousal", "Sintomas ansiosos"],
    summary: "A feeling of apprehension with physical arousal. It may arise from clinical anxiety disorders, medical illness, stimulants or nutrient problems; the glutamate/GABA balance is one proposed mechanism.",
    body: [
      "Excess excitatory [[compound:glutamate]] relative to inhibitory [[compound:gaba]] is associated with anxiety and hyperarousal ([[outcome:glutamate-gaba-imbalance]]), and [[enzyme:gad]] needs [[compound:plp]]. In the Walsh model, both 'over-' and 'under-methylation' are blamed for anxiety through different mechanisms, which makes the idea hard to test ([[state:undermethylation]], [[state:overmethylation]]). A controlled trial reported lower self-rated anxiety after a month of high-dose vitamin B6 in young adults, but doses used were far above normal intake and the result needs replication. Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "outcome:glutamate-gaba-imbalance" },
      { rel: "associated-with", to: "disease:anxiety-disorder" },
      { rel: "associated-with", to: "system:brain-gaba-glutamate" }
    ],
    refs: ["article:penninx-2021-anxiety-disorders", "article:petroff-2002-gaba-glutamate"]
  },
  {
    id: "outcome:delayed-gastric-emptying",
    type: "outcome",
    name: "Delayed gastric emptying",
    aliases: ["Esvaziamento gástrico lentificado", "Slow gastric emptying", "Gastric stasis", "peso gástrico", "plenitude pós-prandial"],
    summary: "Retention of food in the stomach beyond reference times on scintigraphy or breath tests. Causes include diabetes, drugs, surgery and vagal injury; symptoms correlate poorly with measured delay.",
    body: [
      "Standard testing is a four-hour scintigraphic solid meal study. Delay slows nutrient delivery and may promote bloating, nausea and bacterial stasis. [[intervention:ppi-therapy|PPIs]] therapy delays solid-meal emptying modestly in some studies ([[claim:ppis-slow-gastric-emptying]]), and ginger may accelerate emptying in small trials ([[claim:ginger-prokinetic-5ht4-mmc]]). The conversation proposes undermethylation-linked cholinergic failure as a cause, which is unproven ([[claim:undermethylation-causes-subclinical-vagal-dysfunction]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "state:gastric-dysmotility" },
      { rel: "associated-with", to: "system:gastric-physiology" },
      { rel: "associated-with", to: "disease:gastroparesis" },
      { rel: "aggravates", to: "disease:sibo", note: "Stasis is a predisposing factor." }
    ],
    refs: ["article:camilleri-2022-acg-gastroparesis", "article:sanaka-2010-ppi-gastric-emptying"]
  },
  {
    id: "outcome:elevated-gastric-ph",
    type: "outcome",
    name: "Elevated gastric pH",
    aliases: ["pH gástrico elevado", "Raised intragastric pH", "Less acidic stomach"],
    summary: "Intragastric pH above about 3-4, from acid suppression, atrophic gastritis, H. pylori or buffering. It reduces pepsin activity and bacterial killing; glycine's buffering effect is minor at normal pH.",
    body: [
      "Parietal-cell [[compound:hydrochloric-acid]] output holds the fasting stomach near pH 1-2, rising briefly after meals. Raised pH reduces [[compound:pepsin]] activation and removes the bacterial barrier ([[state:hypochlorhydria]], [[state:acid-suppression]]). The conversation proposes that glycine, as a zwitterionic buffer, raises pH enough to delay LES closure and pyloric opening; glycine does buffer around pH 2-3, but the downstream motor effects are unsupported ([[claim:glycine-buffers-gastric-acid]], [[claim:higher-ph-delays-les-closure-and-pylorus]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "state:hypochlorhydria" },
      { rel: "increases", to: "disease:sibo", note: "Reduced acid barrier; association rather than proven cause." },
      { rel: "decreases", to: "compound:pepsin", note: "Pepsin is activated by acid and reversibly inactive near pH 6.5." },
      { rel: "associated-with", to: "pathway:gastric-acid-secretion" }
    ],
    refs: ["article:schubert-2008-gastric-acid-secretion-control"]
  },
  {
    id: "outcome:co2-gastric-distension",
    type: "outcome",
    name: "CO2 gastric distension",
    aliases: ["Distensão gástrica por CO2", "Effervescence in the stomach", "Gas distension from bicarbonate"],
    summary: "Stomach distension from CO2 released when bicarbonate meets acid; it follows ingested bicarbonate or carbonated drinks, whereas pancreatic bicarbonate acts beyond the pylorus where CO2 is absorbed.",
    body: [
      "H+ + HCO3- yields H2CO3, then water and CO2. Swallowed sodium bicarbonate or effervescent products produce enough CO2 in the stomach to cause belching and discomfort ([[claim:acid-bicarbonate-reaction-gives-co2-belching]]). Pancreatic and biliary [[compound:bicarbonate]] neutralises acid in the duodenum, where CO2 is largely absorbed; retrograde duodeno-gastric flow could in principle bring bicarbonate into the stomach, but that route has not been shown to cause clinical belching. The conversation's chain through glycine-driven acid and duodenal bicarbonate is hypothetical. Educational only."
    ],
    evidence: "plausible",
    relations: [
      { rel: "causes", to: "outcome:belching" },
      { rel: "associated-with", to: "compound:carbon-dioxide" },
      { rel: "associated-with", to: "compound:bicarbonate" },
      { rel: "associated-with", to: "compound:hydrochloric-acid" },
      { rel: "associated-with", to: "system:pancreas-bicarbonate" },
      { rel: "causes", to: "outcome:transient-les-relaxations", note: "Gastric distension is the classical trigger; CO2 from drinks is shown, CO2 from acid-bicarbonate chemistry is not." }
    ]
  },
  {
    id: "outcome:elevated-homocysteine",
    type: "outcome",
    name: "Elevated plasma homocysteine",
    aliases: ["Homocisteína elevada", "High tHcy", "Hyperhomocysteinaemia (lab result)"],
    summary: "A laboratory result of raised total homocysteine, usually above about 15 umol/L. It signals impaired remethylation or transsulfuration, kidney disease or B-vitamin deficiency.",
    body: [
      "Total homocysteine is measured in plasma after fasting. It reflects folate, B12, B6, riboflavin, renal function and genetic factors, and is the best-validated functional marker of [[state:methyl-donor-depletion]] ([[state:hyperhomocysteinemia]]). Raising [[compound:betaine]] intake lowers fasting homocysteine modestly via [[enzyme:bhmt]]. Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "state:hyperhomocysteinemia" },
      { rel: "associated-with", to: "compound:homocysteine" },
      { rel: "associated-with", to: "enzyme:bhmt" },
      { rel: "associated-with", to: "pathway:methionine-cycle" }
    ],
    refs: ["article:refsum-2004-homocysteine-recommendations"]
  },
  {
    id: "outcome:low-sam-sah-ratio",
    type: "outcome",
    name: "Low SAM:SAH ratio",
    aliases: ["Razão SAM/SAH baixa", "Reduced methylation index", "Low methylation index"],
    summary: "A reduced ratio of S-adenosylmethionine to S-adenosylhomocysteine, indicating weaker methylation drive; measurable but not a validated clinical diagnostic and sensitive to sampling.",
    body: [
      "[[compound:sah]] inhibits methyltransferases, so a low [[compound:sam]]:SAH ratio predicts reduced methylation potential. Plasma ratios track the supply side (methionine, folate, B12, choline) and kidney function, but tissue ratios may differ. It is the most direct biochemical form of [[state:undermethylation]], yet no clinical thresholds are standardised. GNMT knockout mice show how large the ratio can swing (about 3 to about 300) when the valve is missing ([[enzyme:gnmt]]). Educational only."
    ],
    evidence: "plausible",
    relations: [
      { rel: "associated-with", to: "state:undermethylation" },
      { rel: "associated-with", to: "compound:sam" },
      { rel: "associated-with", to: "compound:sah" },
      { rel: "associated-with", to: "enzyme:gnmt" }
    ],
    refs: ["article:luka-2009-gnmt-sam-regulation"]
  },
  {
    id: "outcome:fishy-odor",
    type: "outcome",
    name: "Fishy body odour",
    aliases: ["Odor de peixe", "Odor de peixe no suor e hálito", "Fish-malodour"],
    summary: "A body or breath smell of fish from excess trimethylamine (TMA), seen in FMO3 deficiency and in people taking very high choline or carnitine doses.",
    body: [
      "TMA, produced by gut bacteria from choline, carnitine and betaine, is volatile and smells of fish. It is normally oxidised by hepatic FMO3 to [[compound:tmao]] ([[disease:trimethylaminuria]]). The IOM listed fishy odour among adverse effects at 10-16 g/day of choline ([[state:choline-excess]]), but the odour can also arise at lower intakes with FMO3 variants or liver disease. Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "compound:trimethylamine" },
      { rel: "associated-with", to: "disease:trimethylaminuria" },
      { rel: "associated-with", to: "state:choline-excess" }
    ],
    refs: ["article:iom-1998-choline-dri", "article:mackay-2011-trimethylaminuria"]
  },
  {
    id: "outcome:ulcer-healing",
    type: "outcome",
    name: "Ulcer healing",
    aliases: ["Cicatrização da úlcera", "Mucosal healing", "Endoscopic ulcer healing"],
    summary: "Complete re-epithelialisation of an ulcer crater on endoscopy, typically in 4-8 weeks with PPI therapy and removal of the cause; symptom relief can precede true healing.",
    body: [
      "Healing rates with PPIs are high (commonly above 90% for duodenal ulcers in 4 weeks) when H. pylori and NSAIDs are addressed ([[disease:peptic-ulcer]], [[disease:h-pylori-infection]]). Adjuncts such as [[intervention:zinc-carnosine]] (polaprezinc, widely used in Japan) are supported by trials mainly as add-ons to PPIs; [[intervention:dgl-licorice]] has weak evidence ([[claim:zinc-carnosine-ulcer-healing]], [[claim:dgl-ulcer-healing]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "disease:peptic-ulcer" },
      { rel: "associated-with", to: "intervention:zinc-carnosine" },
      { rel: "associated-with", to: "system:mucosal-barrier" }
    ],
    refs: ["article:lanas-2017-peptic-ulcer-disease"]
  },
  {
    id: "outcome:collagen-synthesis-adequacy",
    type: "outcome",
    name: "Collagen synthesis adequacy",
    aliases: ["Adequação da síntese de colágeno", "Collagen turnover supply", "Collagen glycine supply"],
    summary: "Whether the body has enough glycine, proline, vitamin C and cofactors to maintain collagen turnover; Melendez-Hevia argues glycine supply is limiting, a view not confirmed by outcome studies.",
    body: [
      "About one in three residues in [[compound:collagen]] is glycine, and collagen is the body's largest protein pool, so turnover is the main glycine sink ([[state:glycine-insufficiency]]). Practical adequacy also depends on vitamin C for prolyl hydroxylation, copper, and mechanical load. No controlled study shows that adding 10 g/day of glycine improves collagen quality in healthy people. Educational only."
    ],
    evidence: "plausible",
    relations: [
      { rel: "associated-with", to: "compound:collagen" },
      { rel: "associated-with", to: "compound:glycine" },
      { rel: "associated-with", to: "state:glycine-insufficiency" },
      { rel: "associated-with", to: "system:connective-tissue" }
    ],
    refs: ["article:melendez-hevia-2009-glycine-weak-link", "article:shoulders-2009-collagen-structure"]
  },
  {
    id: "outcome:glycine-intolerance",
    type: "outcome",
    name: "Glycine intolerance (GI side effects)",
    aliases: ["Intolerância à glicina", "Gas and belching on glycine powder", "Glycine powder GI upset"],
    summary: "Upper-GI symptoms such as belching, nausea or soft stool after taking glycine powder, reported at high doses and anecdotally at 2-3 g; mechanisms and prevalence are unmeasured.",
    body: [
      "Trials of glycine at 3 g before bed for sleep reported no major problems ([[outcome:improved-sleep-quality]]), and schizophrenia trials used 15-60 g/day with mild upper-GI discomfort in some. No study has characterised belching on 2-3 g, so possible causes (swallowed air while dissolving a sweet powder, hyperosmolar drinking, taste, nausea, sensitivity) cannot be ranked, and the conversation's specific chain through gastrin, bicarbonate and SIBO is not supported ([[claim:free-glycine-stimulates-gastrin]], [[claim:sibo-bacteria-metabolize-glycine-co2-nh3]]). Taking glycine with food is a common suggestion without controlled data ([[intervention:amino-acids-with-meals|glycine with meals]]). Educational only."
    ],
    evidence: "plausible",
    relations: [
      { rel: "associated-with", to: "compound:glycine" },
      { rel: "associated-with", to: "intervention:glycine-powder" },
      { rel: "associated-with", to: "intervention:amino-acids-with-meals" },
      { rel: "associated-with", to: "outcome:belching" }
    ],
    refs: ["article:yamadera-2007-glycine-sleep-psg", "article:bannai-2012-glycine-sleep"]
  },
  {
    id: "outcome:global-dna-methylation",
    type: "outcome",
    name: "Global DNA methylation level",
    aliases: ["Metilação global do DNA", "LINE-1 methylation", "Genomic 5-methylcytosine"],
    summary: "Genome-wide fraction of 5-methylcytosine, a research readout of methylation status. It is tissue-specific, assay-dependent and not a clinical test for under- or over-methylation.",
    body: [
      "DNA methylation uses [[compound:sam]] as donor and is influenced by folate, B12, choline and betaine intake in some studies, but effects on global levels in adults are small and inconsistent. Locus-specific methylation and epigenetic clocks have different meanings. It cannot validate the Walsh biotype ([[state:undermethylation]], [[state:overmethylation]]). Educational only."
    ],
    evidence: "plausible",
    relations: [
      { rel: "associated-with", to: "state:undermethylation" },
      { rel: "associated-with", to: "state:overmethylation" },
      { rel: "associated-with", to: "compound:sam" }
    ]
  },
  {
    id: "outcome:blood-histamine-level",
    type: "outcome",
    name: "Blood histamine level",
    aliases: ["Histamina sanguínea", "Whole-blood histamine", "Plasma histamine"],
    summary: "Measured histamine in blood. The Walsh protocol uses whole-blood histamine as a methylation marker (high = under-, low = over-); the test is not validated for that and plasma histamine is short-lived.",
    body: [
      "Plasma histamine is cleared within minutes, shows circadian variation and is sensitive to sample handling ([[claim:histamine-peaks-2-4am]]). Whole-blood histamine mostly reflects basophil histamine content. It does not reliably indicate [[state:undermethylation]] or [[disease:histamine-intolerance]]. Educational only."
    ],
    evidence: "plausible",
    relations: [
      { rel: "associated-with", to: "compound:histamine" },
      { rel: "associated-with", to: "state:histamine-excess" },
      { rel: "associated-with", to: "state:undermethylation" },
      { rel: "associated-with", to: "state:overmethylation" }
    ],
    refs: ["article:maintz-2007-histamine-intolerance", "article:nakamura-2017-mast-cell-clock-histamine"]
  },
  {
    id: "outcome:sarcosine-elevation",
    type: "outcome",
    name: "Sarcosine elevation",
    aliases: ["Sarcosina elevada", "Raised N-methylglycine"],
    summary: "Raised sarcosine (N-methylglycine), the product of GNMT and betaine/DMG catabolism; seen in sarcosinaemia (SARDH deficiency) and is a candidate marker of GNMT flux, which is poorly validated.",
    body: [
      "[[enzyme:gnmt]] converts glycine and SAM to [[compound:sarcosine]] and [[compound:sah]]; sarcosine dehydrogenase returns it to glycine and passes its methyl group to folate. When methyl intake exceeds demand, excess methyl can appear as sarcosine, as seen in people lacking sarcosine dehydrogenase, supporting GNMT's role as a disposal route ([[claim:gnmt-methyl-sink-valve]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "enzyme:gnmt" },
      { rel: "associated-with", to: "compound:sarcosine" },
      { rel: "associated-with", to: "state:overmethylation" }
    ],
    refs: ["article:mudd-2001-gnmt-deficiency", "article:luka-2009-gnmt-sam-regulation"]
  },
  {
    id: "outcome:low-plp-status",
    type: "outcome",
    name: "Low plasma PLP",
    aliases: ["PLP baixo", "Low vitamin B6 status", "Low pyridoxal phosphate", "P5P baixo"],
    summary: "A low plasma pyridoxal 5'-phosphate concentration, the main marker of vitamin B6 status, lowered by inflammation, alcohol, renal disease and some drugs as well as by poor intake.",
    body: [
      "Plasma [[compound:plp]] below about 20 nmol/L is commonly used for deficiency, although inflammation lowers it independently of stores. It is the sensible test before supplementing B6 ([[state:b6-functional-deficiency]], [[disease:vitamin-b6-deficiency]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "compound:plp" },
      { rel: "associated-with", to: "state:b6-functional-deficiency" },
      { rel: "associated-with", to: "disease:vitamin-b6-deficiency" }
    ],
    refs: ["article:parra-2018-vitamin-b6-metabolism"]
  },
  {
    id: "outcome:glutamate-gaba-imbalance",
    type: "outcome",
    name: "Glutamate/GABA imbalance",
    aliases: ["Desequilíbrio glutamato/GABA", "Excitation-inhibition imbalance", "E/I imbalance"],
    summary: "Shift of cortical excitation/inhibition toward glutamate, associated with anxiety, seizures and hyperarousal; GAD (PLP-dependent) converts glutamate to GABA. Hard to measure clinically.",
    body: [
      "[[enzyme:gad]] decarboxylates [[compound:glutamate]] to [[compound:gaba]] with [[compound:plp]]. Severe B6 deficiency in infants produces seizures; in adults, the link between ordinary B6 status and anxiety is weak. Magnetic resonance spectroscopy can estimate brain GABA and glutamate in research ([[system:brain-gaba-glutamate]]). Educational only."
    ],
    evidence: "plausible",
    relations: [
      { rel: "associated-with", to: "compound:glutamate" },
      { rel: "associated-with", to: "compound:gaba" },
      { rel: "associated-with", to: "enzyme:gad" },
      { rel: "associated-with", to: "system:brain-gaba-glutamate" }
    ],
    refs: ["article:petroff-2002-gaba-glutamate"]
  },
  {
    id: "outcome:glycine-deficit-estimate",
    type: "outcome",
    name: "Estimated glycine deficit (~10 g/day)",
    aliases: ["Déficit de glicina", "Meléndez-Hevia deficit", "Glycine shortfall"],
    summary: "Melendez-Hevia's estimate that endogenous synthesis (about 3 g/day) plus diet (1.5-3 g/day) leaves about 10 g/day unmet for a 70 kg adult; an influential model estimate, not a measured outcome.",
    body: [
      "The estimate comes from comparing modelled glycine use (collagen turnover, glutathione, creatine, bile salts, haem, purines) with the capacity of [[enzyme:shmt]]-based synthesis. Critics note that collagen turnover assumptions are uncertain, that other sources exist, and that no deficiency syndrome in healthy adults has been shown ([[claim:glycine-deficit-10g]], [[state:glycine-insufficiency]]). Educational only."
    ],
    evidence: "plausible",
    relations: [
      { rel: "associated-with", to: "state:glycine-insufficiency" },
      { rel: "associated-with", to: "compound:glycine" },
      { rel: "associated-with", to: "claim:glycine-deficit-10g" }
    ],
    refs: ["article:melendez-hevia-2009-glycine-weak-link"]
  },
  {
    id: "outcome:improved-sleep-quality",
    type: "outcome",
    name: "Improved sleep quality with glycine",
    aliases: ["Melhora do sono com glicina", "Glycine sleep benefit"],
    summary: "Three small crossover trials of 3 g glycine at bedtime reported better subjective sleep quality and shorter sleep latency; evidence is modest, short-term and largely from one research group.",
    body: [
      "Yamadera et al. (2007) found shorter latency to sleep onset and slow-wave sleep on polysomnography; Bannai et al. (2012) found less next-day fatigue after restricted sleep. Proposed mechanisms involve NMDA-receptor effects and a drop in core body temperature. These studies used a mild 3 g dose, and tolerability at that dose was good ([[claim:glycine-well-tolerated-in-trials]]). Educational only."
    ],
    evidence: "plausible",
    relations: [
      { rel: "associated-with", to: "compound:glycine" },
      { rel: "associated-with", to: "intervention:glycine-powder" },
      { rel: "associated-with", to: "outcome:night-waking" }
    ],
    refs: ["article:yamadera-2007-glycine-sleep-psg", "article:bannai-2012-glycine-sleep"]
  },
  {
    id: "outcome:heartburn",
    type: "outcome",
    name: "Heartburn",
    aliases: ["Pirose", "Azia", "Retrosternal burning", "queimação no estômago", "queimação gástrica", "queimação estomacal"],
    summary: "Retrosternal burning from reflux of gastric contents into the oesophagus; the cardinal symptom of GERD, distinct from epigastric burning of ulcers or dyspepsia.",
    body: [
      "Heartburn after meals or when lying down suggests [[disease:gerd]]; persistent burning after ulcer therapy may reflect residual gastritis or acid exposure on healing mucosa ([[state:post-ulcer-mucosal-recovery]]). The conversation's burning on betaine HCl is likely a direct effect of acid on sensitive mucosa ([[claim:betaine-hcl-contraindicated-post-ulcer]]). Alarm symptoms (dysphagia, weight loss, bleeding) require evaluation. Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "disease:gerd" },
      { rel: "associated-with", to: "outcome:reflux-episodes" },
      { rel: "associated-with", to: "state:post-ulcer-mucosal-recovery" }
    ],
    refs: ["article:katz-2022-acg-gerd-guideline"]
  },
  {
    id: "outcome:cholinergic-excess-symptoms",
    type: "outcome",
    name: "Cholinergic excess symptoms",
    aliases: ["Sintomas colinérgicos", "Cholinergic crisis (loosely)", "Sweating, cramps, diarrhoea"],
    summary: "Sweating, salivation, cramps, diarrhoea, nausea and hypotension from parasympathetic stimulation; reported at choline intakes of about 7.5-16 g/day. Not a true cholinergic crisis.",
    body: [
      "Very high choline doses can raise acetylcholine signalling and cause the muscarinic effects above ([[state:choline-excess]]). A true cholinergic crisis follows acetylcholinesterase inhibitors or organophosphates and is far more severe; the conversation's wording overstates the choline picture ([[claim:above-ul-fishy-odor-and-cholinergic-effects]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "compound:acetylcholine" },
      { rel: "associated-with", to: "compound:choline" },
      { rel: "associated-with", to: "state:choline-excess" }
    ],
    refs: ["article:iom-1998-choline-dri"]
  },
  {
    id: "outcome:elevated-tmao",
    type: "outcome",
    name: "Elevated TMAO",
    aliases: ["TMAO elevado", "High trimethylamine N-oxide"],
    summary: "Higher plasma TMAO, made by hepatic FMO3 from microbial TMA; raised by choline, carnitine, fish and kidney impairment, and associated with cardiovascular events though causality is contested.",
    body: [
      "TMAO rose in studies after high-choline or high-carnitine intake, and the Wang 2011 study linked fasting levels to cardiovascular events. Fish intake can raise TMAO more than red meat yet is not associated with higher risk, and kidney function confounds or mediates the association, so TMAO may be a marker rather than a cause ([[claim:above-ul-tmao-endothelial-stress]], [[disease:cardiovascular-disease]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "compound:tmao" },
      { rel: "associated-with", to: "compound:trimethylamine" },
      { rel: "associated-with", to: "disease:cardiovascular-disease" },
      { rel: "associated-with", to: "state:choline-excess" }
    ],
    refs: ["article:wang-2011-gut-flora-phosphatidylcholine-cvd"]
  },
  {
    id: "outcome:h-pylori-test-result",
    type: "outcome",
    name: "H. pylori test result",
    aliases: ["Teste de H. pylori", "Urea breath test result", "Stool antigen result"],
    summary: "Positive or negative result of urea breath, stool antigen or biopsy testing; PPIs and antibiotics in the preceding 2-4 weeks cause false negatives, so tests of cure are timed accordingly.",
    body: [
      "ACG 2024 recommends a test of cure at least four weeks after antibiotics and two weeks off PPIs, using breath, stool antigen or biopsy-based tests ([[claim:confirm-h-pylori-eradication]]). Serology cannot confirm eradication. The urea breath test exploits H. pylori urease; it does not show that urease gas causes belching ([[claim:h-pylori-urease-ammonia-co2]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "disease:h-pylori-infection" },
      { rel: "associated-with", to: "intervention:h-pylori-eradication-therapy" },
      { rel: "associated-with", to: "state:acid-suppression" }
    ],
    refs: ["article:chey-2024-acg-h-pylori-treatment", "article:malfertheiner-2022-maastricht-vi"]
  },
  {
    id: "outcome:breath-hydrogen-methane",
    type: "outcome",
    name: "Breath hydrogen / methane rise",
    aliases: ["Teste respiratório de hidrogênio e metano", "Positive SIBO breath test", "Breath H2 and CH4"],
    summary: "Breath hydrogen rise of 20 ppm or more within 90 minutes, or methane of 10 ppm or more, after glucose or lactulose; the SIBO criterion of the North American consensus, with modest accuracy.",
    body: [
      "Hydrogen and methane come only from microbial fermentation, not from human cells. Lactulose tests can be positive from normal colonic arrival, and prior antibiotics or PPIs change results. The test shows microbial carbohydrate fermentation; it does not measure fermentation of amino acids such as glycine ([[intervention:sibo-breath-test]], [[disease:sibo]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "disease:sibo" },
      { rel: "associated-with", to: "intervention:sibo-breath-test" },
      { rel: "associated-with", to: "system:gut-microbiota" }
    ],
    refs: ["article:rezaie-2017-breath-test-consensus", "article:pimentel-2020-acg-sibo-guideline"]
  },
  {
    id: "outcome:reflux-episodes",
    type: "outcome",
    name: "Reflux episodes",
    aliases: ["Episódios de refluxo", "Acid exposure time", "Impedance-detected reflux"],
    summary: "Measured reflux events or acid exposure time on 24-hour pH-impedance monitoring, used to confirm GERD, classify belching and decide on PPI therapy when diagnosis is unclear.",
    body: [
      "Acid exposure time above 6% on pH monitoring is conclusive for GERD in the Lyon consensus. Impedance detects non-acid and gas reflux events and belches ([[disease:gerd]], [[disease:aerophagia-belching-disorders]]). AGA 2023 recommends this testing instead of empiric PPIs for isolated extra-oesophageal symptoms ([[claim:throat-burning-means-lpr]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "disease:gerd" },
      { rel: "associated-with", to: "system:lower-esophageal-sphincter" },
      { rel: "associated-with", to: "outcome:belching" }
    ],
    refs: ["article:katz-2022-acg-gerd-guideline", "article:chen-2023-aga-extraesophageal-reflux"]
  },
  {
    id: "outcome:salivary-pepsin",
    type: "outcome",
    name: "Pepsin in saliva or laryngeal tissue",
    aliases: ["Pepsina salivar", "Peptest", "Laryngeal pepsin", "pepsina na laringe"],
    summary: "Detection of pepsin outside the stomach as a sign of reflux. It is a research and commercial adjunct for LPR whose diagnostic accuracy is debated and not guideline-endorsed.",
    body: [
      "Pepsin is made only in the stomach, so its presence in saliva or laryngeal tissue implies gastric reflux; cells can take it up ([[compound:pepsin]], [[claim:belch-aerosol-deposits-pepsin]]). Salivary test performance is variable, results are affected by meals, and the AGA update does not endorse it for diagnosis ([[disease:lpr]]). Educational only."
    ],
    evidence: "plausible",
    relations: [
      { rel: "associated-with", to: "compound:pepsin" },
      { rel: "associated-with", to: "disease:lpr" },
      { rel: "associated-with", to: "system:larynx-pharynx" }
    ],
    refs: ["article:johnston-2006-pepsin-laryngeal-epithelium", "article:chen-2023-aga-extraesophageal-reflux"]
  },
  {
    id: "outcome:urinary-tma-tmao-ratio",
    type: "outcome",
    name: "Urinary TMA:TMAO ratio",
    aliases: ["Razão TMA/TMAO urinária", "FMO3 function test"],
    summary: "The urinary ratio of free trimethylamine to its N-oxide after choline load, used to diagnose trimethylaminuria; a raised ratio means impaired FMO3 oxidation.",
    body: [
      "In healthy people, over 90% of urinary TMA-derived material is TMAO. A raised free TMA fraction identifies primary and secondary trimethylaminuria; the test must be done while on a choline-containing diet ([[disease:trimethylaminuria]], [[enzyme:fmo3]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "compound:trimethylamine" },
      { rel: "associated-with", to: "compound:tmao" },
      { rel: "associated-with", to: "disease:trimethylaminuria" }
    ],
    refs: ["article:mackay-2011-trimethylaminuria"]
  },
  {
    id: "outcome:urinary-hpl",
    type: "outcome",
    name: "Urinary HPL (pyrrole) level",
    aliases: ["Pirrois urinários", "Mauve factor", "Kryptopyrrole test"],
    summary: "Urinary hydroxyhemopyrrolin-2-one measured by colorimetric assay; claimed to indicate pyroluria, but the assay suffers interference, is non-specific and is not validated.",
    body: [
      "Elevated HPL has been reported in various psychiatric and non-psychiatric groups. Urobilinogen interferes, specificity is low, and a systematic review found no placebo-controlled treatment trials ([[disease:pyroluria-kpu]], [[claim:pyroluria-causes-b6-zinc-deficiency]]). Educational only."
    ],
    evidence: "speculative",
    relations: [
      { rel: "associated-with", to: "disease:pyroluria-kpu" },
      { rel: "associated-with", to: "state:b6-functional-deficiency" }
    ]
  },
  {
    id: "outcome:hepatic-steatosis",
    type: "outcome",
    name: "Hepatic steatosis",
    aliases: ["Esteatose hepática", "Liver fat", "Fatty liver (finding)"],
    summary: "Fat above 5% of liver weight or imaging-detected hepatic fat; caused by metabolic syndrome, alcohol, drugs and choline deficiency through impaired VLDL export.",
    body: [
      "Detected on ultrasound, MRI-PDFF or elastography. In choline deficiency, reduced phosphatidylcholine limits VLDL assembly, so triglycerides accumulate in hepatocytes ([[disease:choline-deficiency]], [[disease:fatty-liver-nafld]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "disease:fatty-liver-nafld" },
      { rel: "associated-with", to: "system:liver" },
      { rel: "associated-with", to: "disease:choline-deficiency" },
      { rel: "associated-with", to: "enzyme:pemt" }
    ],
    refs: ["article:rinella-2023-fatty-liver-nomenclature", "article:resseguie-2011-pemt-estrogen-choline"]
  },
  {
    id: "outcome:elevated-gastrin",
    type: "outcome",
    name: "Elevated serum gastrin",
    aliases: ["Gastrina elevada", "Hypergastrinaemia"],
    summary: "Raised serum gastrin, most commonly from low acid (PPIs, atrophic gastritis), less often from gastrinoma; amino acids such as phenylalanine and tryptophan stimulate it, glycine did not in human tests.",
    body: [
      "Antral G cells release [[compound:gastrin]] in response to peptides, amino acids, distension and alkaline pH, and are inhibited by acid via somatostatin. In humans, intragastric phenylalanine and tryptophan strongly raised gastrin and acid; glycine did not (Taylor 1982; Wald 1982, 100 mM glycine, [[claim:free-glycine-stimulates-gastrin]]). Chronic hypergastrinaemia commonly signals hypochlorhydria ([[disease:atrophic-gastritis]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "compound:gastrin" },
      { rel: "associated-with", to: "disease:atrophic-gastritis" },
      { rel: "associated-with", to: "claim:free-glycine-stimulates-gastrin" }
    ],
    refs: ["article:taylor-1982-amino-acids-gastric-acid", "article:schubert-2008-gastric-acid-secretion-control"]
  },
  {
    id: "outcome:increased-gastric-acid-output",
    type: "outcome",
    name: "Increased gastric acid output",
    aliases: ["Aumento da secreção ácida", "Acid hypersecretion"],
    summary: "Higher HCl secretion by parietal cells, driven by gastrin, histamine and vagal acetylcholine; some amino acids, caffeine and peptides are secretagogues, glycine only weakly and inconsistently.",
    body: [
      "Parietal cells respond to [[compound:acetylcholine]], [[compound:gastrin]] and [[compound:histamine]] (H2 receptors) via [[pathway:gastric-acid-secretion]]. One glycine infusion study in healthy volunteers observed acid output of 5.6 mmol/h versus 3.3 on saline without any gastrin change, while a second study found no stimulation at all ([[claim:free-glycine-stimulates-gastrin]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "pathway:gastric-acid-secretion" },
      { rel: "associated-with", to: "compound:hydrochloric-acid" },
      { rel: "associated-with", to: "compound:gastrin" }
    ],
    refs: ["article:schubert-2008-gastric-acid-secretion-control", "article:taylor-1982-amino-acids-gastric-acid", "article:wald-1982-glycine-gastric-acid"]
  },
  {
    id: "outcome:transient-les-relaxations",
    type: "outcome",
    name: "Transient lower oesophageal sphincter relaxations (TLESR)",
    aliases: [
      "relaxamentos transitórios do EEI",
      "TLESR",
      "relaxamento transitório do esfíncter esofágico inferior",
      "relaxamentos transitórios do esfíncter",
      "transient LES relaxation"
    ],
    summary: "Brief reflex relaxations of the lower oesophageal sphincter not triggered by swallowing, set off by gastric distension; they let swallowed gas escape as a belch and are a main route of reflux.",
    body: [
      "The valve between oesophagus and stomach normally stays shut. When the stomach fills with food and air, a vagal reflex briefly opens it without a swallow. That relaxation is how swallowed air is vented as a belch, and it is also one of the ways stomach contents can rise into the oesophagus ([[system:lower-esophageal-sphincter]], [[article:mittal-1997-esophagogastric-junction]], [[article:boeckxstaens-2014-symptomatic-reflux-disease]]).",
      "Carbonated drinks raise the frequency: in 18 healthy volunteers 200 ml of cola produced a median 10.5 relaxations per 30 minutes against fewer with water, and lowered sphincter pressure ([[article:shukla-2012-carbonated-beverage-tlesr]]). In the conversation, \"transient relaxations of the LES\" are presented as a consequence of low vagal tone; the classical trigger is simply gastric distension, and a link to under-methylation has not been tested ([[claim:undermethylation-causes-subclinical-vagal-dysfunction]], [[outcome:co2-gastric-distension]])."
    ],
    evidence: "established",
    relations: [
      { rel: "causes", to: "outcome:belching", note: "Vents swallowed or generated gas." },
      { rel: "causes", to: "outcome:reflux-episodes", note: "A main mechanism of reflux events." },
      { rel: "associated-with", to: "system:lower-esophageal-sphincter" },
      { rel: "associated-with", to: "disease:gerd" },
      {
        rel: "associated-with",
        to: "system:vagal-tone",
        note: "Vagovagal reflex; relation to tone itself not established."
      }
    ],
    refs: [
      "article:mittal-1997-esophagogastric-junction",
      "article:boeckxstaens-2014-symptomatic-reflux-disease",
      "article:shukla-2012-carbonated-beverage-tlesr"
    ]
  },
  {
    id: "outcome:flatulence",
    type: "outcome",
    name: "Flatulence (flatus)",
    aliases: ["flatulência", "gases intestinais", "flatos", "gás retal", "passing gas"],
    summary: "Passage of gas through the rectum, mostly hydrogen and CO2 from colonic fermentation; different from belching, which vents swallowed air or gastric gas through the mouth.",
    body: [
      "Everyone passes gas. In ten healthy volunteers on a normal diet the daily volume ranged from about 0.5 to 1.5 litres (median 705 ml), made up mainly of fermentation gases, hydrogen above all, with carbon dioxide, some methane in a few people and a residue of nitrogen. A fibre-free diet for two days cut the volume and nearly abolished hydrogen ([[article:tomlin-1991-normal-flatus]]).",
      "The conversation stresses that the gas appears as belching and not as flatulence, and uses this to place the problem in the upper gut. That is a reasonable reading of where the gas leaves the body, because gas made in the [[system:colon]] is vented below, but the absence of flatulence says nothing about what produced the belched gas ([[outcome:belching]], [[claim:sibo-gas-appears-in-15-45-min-as-belching]]). Flatulence is a typical complaint in carbohydrate-fermenting overgrowth ([[disease:sibo]]). Educational only."
    ],
    evidence: "established",
    facts: { "normal-daily-volume": "median 705 ml (range 476-1491 ml) in ten healthy volunteers" },
    relations: [
      {
        rel: "associated-with",
        to: "outcome:belching",
        note: "Two exits for gas; route does not identify the source."
      },
      { rel: "associated-with", to: "system:colon" },
      {
        rel: "associated-with",
        to: "outcome:breath-hydrogen-methane",
        note: "Breath H2 and CH4 reflect fermentation but are not flatus volumes."
      }
    ],
    refs: ["article:tomlin-1991-normal-flatus"]
  }
];
