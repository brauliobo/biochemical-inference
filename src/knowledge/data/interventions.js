// Content agent C1: interventions (supplements, foods, drugs, practices, tests).
// Educational, neutral entries; evidence levels are assigned per claim.
export default [
  {
    id: "intervention:glycine-powder",
    type: "intervention",
    name: "Glycine powder (free L-glycine)",
    aliases: ["glicina em pó", "glycine supplement", "glicina"],
    summary: "Free glycine taken in gram doses for sleep, collagen or methyl-balance goals; commonly causes GI complaints, including belching, in a subset of users.",
    body: [
      "Mechanism and use: free [[compound:glycine]] is absorbed within the proximal small intestine via PAT1, B0AT1 and related transporters and raises plasma glycine several-fold transiently. Human trials used about 3 g shortly before bed for subjective sleep quality (Bannai 2012, mediated by NMDA receptors in the suprachiasmatic nucleus lowering core temperature, Kawai 2015), and far larger doses in psychiatric add-on studies. There is no formal UL; the powder is sweet, dissolves readily and is generally well tolerated at 3-5 g. Gastrointestinal complaints (nausea, soft stools, bloating, belching) occur in some users and anecdotally with doses as low as 2-3 g.",
      "Why belching? Several explanations are plausible and none is proven: swallowed air while drinking a sweet powder solution, osmotic load and gastric distension triggering TLESR, supragastric belching ([[compound:carbon-dioxide]], [[outcome:belching]]), slowed gastric emptying with a dense amino acid solution, and [[state:gastric-dysmotility]]. Mechanisms asserted in the source conversation are classed as speculative: glycine-driven gastrin release ([[compound:gastrin]]) lacks direct human evidence; bacterial decarboxylation of glycine by overgrown upper-gut flora is chemically possible (glycine cleavage by anaerobes releases CO2 and NH3; Stickland-type glycine reductase produces ammonia and acetyl phosphate) but unproven as a cause of belching, and free glycine is absorbed quickly in the jejunum where bacterial counts are normally low; a methylation drain through [[enzyme:gnmt]] is plausible in principle but GNMT is already near-saturated and regulated by SAM and 5-methyl-THF ([[compound:5-mthf]]).",
      "Cautions: glycine may reduce the efficacy of clozapine (it is an NMDA co-agonist, Evins 2000); avoid in non-ketotic hyperglycinaemia; in kidney-stone formers glycine adds to glyoxylate/oxalate flux ([[compound:oxalate]]); large doses can cause nausea. Taking with food or in divided small doses is the usual remedy ([[intervention:amino-acids-with-meals]]), as is getting glycine from food ([[intervention:dietary-glycine-sources]]); the sequencing proposed in the source conversation is described at [[intervention:phased-reintroduction-protocol]]."
    ],
    evidence: "plausible",
    facts: { "dosing-range": "3 g before bed (sleep trials); 3-10 g/day in collagen-oriented use; psychiatric trials use far higher", ul: "None established", forms: "Free-form L-glycine powder; glycinate chelates deliver less" },
    relations: [
      { rel: "increases", to: "compound:glycine" },
      { rel: "increases", to: "compound:sarcosine", note: "Via GNMT; extent in humans unmeasured" },
      { rel: "causes", to: "outcome:belching", note: "Anecdotal GI complaint in some users; mechanism unresolved" },
      { rel: "mitigates", to: "outcome:night-waking", note: "Sleep-quality trials at 3 g; modest evidence" },
      { rel: "interacts-with", to: "enzyme:gnmt" },
      { rel: "contraindicated-in", to: "disease:nonketotic-hyperglycinemia", note: "Adds to an already pathological glycine load." },
      { rel: "increases", to: "outcome:improved-sleep-quality", note: "About 3 g before bed improved subjective sleep quality in small trials from one research group." },
      { rel: "causes", to: "outcome:glycine-intolerance", note: "Dose-related GI complaints (nausea, bloating, belching) in a subset of users." }
    ],
    refs: ["article:melendez-hevia-2009-glycine-weak-link", "article:bannai-2012-glycine-sleep", "article:kawai-2015-glycine-sleep-nmda"]
  },
  {
    id: "intervention:collagen-peptides",
    type: "intervention",
    name: "Collagen peptides (hydrolysed collagen)",
    aliases: ["colágeno hidrolisado", "collagen hydrolysate", "gelatin hydrolysate", "colágeno em pó"],
    summary: "Enzymatically hydrolysed collagen (types I/III from bovine, marine or porcine sources) supplying glycine, proline and hydroxyproline in gram doses; modest evidence for skin and joint outcomes.",
    body: [
      "Hydrolysates of 2-5 kDa are digested without needing much pepsin and are absorbed partly as di- and tripeptides (Pro-Hyp, Hyp-Gly) that appear in blood after ingestion (Iwai 2005). Typical doses are 2.5-15 g/day. Each 10 g supplies roughly 2-2.5 g [[compound:glycine]], about 1 g [[compound:hydroxyproline]] and no tryptophan, so it is not a complete protein ([[compound:collagen]]). Trials (Clark 2008 and others) suggest modest improvements in skin hydration/elasticity and activity-related joint pain; quality is mixed and often industry-funded.",
      "Practical tolerance: unflavoured peptides dissolve in hot or cold liquid, and some users report fullness or belching; plausible contributors are swallowed air during stirring/drinking, gastric volume and slowed emptying of a protein bolus. The suggestion in the source conversation that collagen peptides require extensive peptic cleavage or are 'potent gastrin stimulators' is not well supported for hydrolysates ([[compound:pepsin]], [[compound:gastrin]]). Cautions: fish/shellfish allergy for marine sources; hydroxyproline raises urinary oxalate ([[compound:oxalate]]) so stone formers should be cautious; some products have heavy-metal or sweetener contamination issues, so third-party testing is advisable."
    ],
    evidence: "plausible",
    facts: { "dosing-range": "2.5-15 g/day in trials", glycine: "about 20-25 % of mass", ul: "None established" },
    relations: [
      { rel: "increases", to: "compound:glycine" },
      { rel: "increases", to: "compound:hydroxyproline" },
      { rel: "increases", to: "pathway:collagen-synthesis", note: "Substrate supply; clinical benefit modest" },
      { rel: "causes", to: "outcome:belching", note: "Reported by some users; mechanism unresolved" },
      { rel: "increases", to: "compound:oxalate", note: "Raises urinary oxalate via hydroxyproline" }
    ],
    refs: ["article:iwai-2005-collagen-peptides-blood", "article:clark-2008-collagen-hydrolysate", "article:knight-2006-hydroxyproline-oxalate"]
  },
  {
    id: "intervention:type-ii-collagen",
    type: "intervention",
    name: "Type II collagen supplements (UC-II and hydrolysed)",
    aliases: ["colágeno tipo 2", "UC-II", "colágeno tipo II não desnaturado"],
    summary: "Chicken-sternum type II collagen used for joint support, either as 40 mg undenatured capsules (oral tolerance concept) or as gram-dose hydrolysate.",
    body: [
      "Undenatured type II collagen (UC-II, about 40 mg/day) is thought to act by oral tolerance at Peyer's patches, inducing regulatory T cells; small trials show reductions in knee osteoarthritis symptoms (Lugo 2016) of uncertain generalisability. Hydrolysed type II products are dosed in the gram range and act like other collagen hydrolysates. See [[compound:collagen-type-ii]].",
      "At 40 mg the glycine contribution (about 10 mg) is negligible, so belching with such a capsule is unlikely to reflect the glycine load; consider excipients, swallowed air or unrelated GI factors. Cautions: avoid in people allergic to chicken or egg, and use caution in autoimmune disease because the proposed mechanism is immunomodulatory (data are insufficient to recommend either way)."
    ],
    evidence: "plausible",
    facts: { "dosing-range": "UC-II 40 mg/day; hydrolysed 1-10 g/day" },
    relations: [
      { rel: "associated-with", to: "compound:collagen-type-ii" },
      { rel: "increases", to: "compound:glycine", note: "Negligible at 40 mg" },
      { rel: "causes", to: "outcome:belching", note: "Reported by some users; likely not a glycine-load effect at 40 mg" }
    ],
    refs: ["article:lugo-2016-uc-ii-knee-osteoarthritis"]
  },
  {
    id: "intervention:dietary-glycine-sources",
    type: "intervention",
    name: "Dietary glycine sources (gelatin, bone broth, slow-cooked meats)",
    aliases: ["gelatina", "caldo de ossos", "carnes de cozimento lento", "bone broth", "gelatin"],
    summary: "Whole-food routes to glycine: gelatin, skin and connective tissue, long-simmered broths and slow-cooked tough cuts, which deliver collagen-derived glycine within a solid food matrix.",
    body: [
      "A typical mixed diet provides roughly 3-5 g glycine/day from protein (glycine is about 4 % of average protein but about 20-25 % of gelatin and connective tissue). Slow cooking converts collagen to gelatin, which is more digestible than native collagen, while giving amino acids gradually within a mixed meal ([[compound:collagen]], [[compound:glycine]]). This is the practical basis for the advice to obtain glycine from food rather than concentrated powders in people who are sensitive to the latter ([[intervention:amino-acids-with-meals]]).",
      "Cautions: long-simmered broths and protein left standing accumulate biogenic amines including [[compound:histamine]] and are unsuitable for people with histamine intolerance ([[disease:histamine-intolerance]]); broth content of collagen, sodium and (in one small study) lead varies widely; gelatin supplies hydroxyproline, so stone formers should moderate ([[compound:oxalate]]). Gelatin lacks tryptophan, so it complements but cannot replace complete protein."
    ],
    evidence: "established",
    facts: { "gelatin-glycine": "about 20-25 g/100 g protein", "typical-dietary-glycine": "about 3-5 g/day" },
    relations: [
      { rel: "increases", to: "compound:glycine" },
      { rel: "increases", to: "pathway:collagen-synthesis", note: "Substrate supply" },
      { rel: "aggravates", to: "disease:histamine-intolerance", note: "Long-cooked broths are histamine-rich" },
      { rel: "mitigates", to: "outcome:belching", note: "Plausible relative to free powder; no direct trial" }
    ],
    refs: ["article:wang-2013-glycine-metabolism"]
  },
  {
    id: "intervention:betaine-anhydrous",
    type: "intervention",
    name: "Betaine anhydrous (TMG) supplement",
    aliases: ["TMG", "betaína anidra", "trimethylglycine supplement", "Cystadane"],
    summary: "Neutral zwitterionic betaine used to lower homocysteine (prescription 6 g/day in homocystinuria) or as a methyl donor; unlike betaine HCl it does not acidify the stomach.",
    body: [
      "Anhydrous [[compound:betaine]] donates a methyl group to [[compound:homocysteine]] via [[enzyme:bhmt]] (liver and kidney), forming [[compound:methionine]] and [[compound:dimethylglycine]], and thereafter feeds [[compound:glycine]] and the folate one-carbon pool ([[pathway:choline-oxidation]]). Doses: 1.5-6 g/day lowers fasting Hcy by roughly 10-20 % in healthy subjects (Olthof 2003); 6 g/day in two doses is the approved homocystinuria regimen; 15-20 g/day was tested in fatty liver trials. The EU recognises a claim for 1.5 g/day contributing to normal homocysteine metabolism.",
      "Cautions: doses of 4-6 g can raise LDL cholesterol and triglycerides modestly; large amounts cause nausea, diarrhoea and a fishy odour; in CBS-deficient homocystinuria monitor methionine (cerebral oedema has been reported with hypermethioninaemia). Betaine anhydrous contains no chloride and is not an acid, so the burning attributed to betaine HCl is not expected, though individual intolerance can occur. Betaine's role in the 'choline to glycine' chain is stoichiometrically real, but supplemental doses of 3-6 g (26-51 mmol) contribute only about 1.9-3.8 g glycine at best ([[intervention:betaine-hcl]] is a different product)."
    ],
    evidence: "established",
    facts: { "dosing-range": "1.5-6 g/day divided; trials up to 20 g/day", "approved-use": "Homocystinuria (prescription, 6 g/day)", ul: "None established" },
    relations: [
      { rel: "increases", to: "compound:betaine" },
      { rel: "decreases", to: "compound:homocysteine" },
      { rel: "interacts-with", to: "enzyme:bhmt" },
      { rel: "mitigates", to: "state:undermethylation", note: "Plausible: supports remethylation independent of folate/B12" }
    ],
    refs: ["article:olthof-2003-betaine-low-dose-homocysteine"]
  },
  {
    id: "intervention:betaine-hcl",
    type: "intervention",
    name: "Betaine hydrochloride (betaine HCl)",
    aliases: ["betaína HCl", "betaine HCl", "cloridrato de betaína"],
    summary: "Acidifying supplement releasing about 6.5 mmol HCl per gram, marketed for hypochlorhydria; unvalidated and generally avoided with ulcers, gastritis, reflux or NSAID use.",
    body: [
      "Betaine HCl (molar mass 153.6 g/mol; 76 % betaine) dissociates in the stomach, delivering about 6.5 mmol H+ per gram, so a 650 mg capsule gives about 4.2 mmol acid, comparable to a few minutes of stimulated parietal output ([[compound:hydrochloric-acid]]). In volunteers with PPI-induced hypochlorhydria it transiently lowered gastric pH for under an hour (Yago 2013). The 'challenge' protocol of escalating capsules until warmth is felt is not validated ([[intervention:hcl-challenge-test]]), and no controlled trial shows clinical benefit in digestion, B12 or mineral absorption.",
      "Cautions and contraindications: it is avoided in active or recent peptic ulcer ([[disease:peptic-ulcer]]), gastritis, oesophagitis/GERD/LPR ([[disease:gerd]], [[disease:lpr]]), and with NSAIDs or corticosteroids, and is pointless during acid suppression. Burning after a dose should prompt stopping. The conversation labels recent ulcer plus burning an 'absolute contraindication'; formal regulatory language is not that strong, but avoidance in that setting is standard and well founded mechanistically, and ongoing symptoms deserve medical evaluation. Betaine HCl is a different substance from [[intervention:betaine-anhydrous]]; confusing the two is common."
    ],
    evidence: "speculative",
    facts: { "H+ per gram": "about 6.5 mmol", "betaine content": "76 % by mass", "dosing-range": "Practitioner protocols 650-3250 mg with protein meals; no validated dose" },
    relations: [
      { rel: "increases", to: "compound:hydrochloric-acid", note: "Transient intragastric acidification" },
      { rel: "contraindicated-in", to: "disease:peptic-ulcer" },
      { rel: "contraindicated-in", to: "disease:gerd" },
      { rel: "contraindicated-in", to: "disease:lpr" },
      { rel: "aggravates", to: "outcome:throat-burning", note: "Via reflux of acidified contents; plausible" },
      { rel: "mitigates", to: "state:hypochlorhydria", note: "Transient pH effect only; clinical value unproven" },
      { rel: "contraindicated-in", to: "disease:gastritis", note: "Acid on inflamed lining; convention and mechanism, not trial evidence." },
      { rel: "contraindicated-in", to: "disease:esophagitis" }
    ],
    refs: ["article:yago-2013-betaine-hcl-reacidification"]
  },
  {
    id: "intervention:choline-bitartrate",
    type: "intervention",
    name: "Choline bitartrate",
    aliases: ["bitartarato de colina", "choline salts", "sais de colina", "BulkSupplements", "Extreme Suplementos", "colina bitartarato em pó"],
    summary: "Inexpensive choline salt (41 % choline by mass) used in doses of a few hundred mg; at high doses it causes diarrhoea, fishy odour and raises TMAO.",
    body: [
      "Choline bitartrate delivers 41 % choline ([[compound:choline]]), so 1 g supplies about 410 mg; choline chloride is 75 % choline and phosphatidylcholine about 13 %. The adequate intake is 400-550 mg/day and the US UL 3.5 g/day, with the main toxic signs hypotension, sweating, salivation, diarrhoea and fishy odour ([[disease:trimethylaminuria]]). Free choline salts are largely absorbed in the small intestine but surplus reaches the colon where microbes make [[compound:trimethylamine]] and, in liver, [[compound:tmao]] ([[system:gut-microbiota]]).",
      "Clinical rationale in the source conversation: choline feeds [[compound:acetylcholine]] (vagal tone, [[system:vagal-tone]]) and, via [[compound:betaine]] and [[enzyme:bhmt]], supports remethylation. Reports of improvement with choline fit this, but are anecdotal and compatible with a placebo or unrelated effects. Cautions: low-blood-pressure, depression (cholinergic excess may worsen mood in susceptible people), kidney or liver disease, TMAU, and anticholinergic drug interactions.",
      "The source conversation pointed to retail listings of this form (BulkSupplements choline bitartrate powder sold through Mercado Livre, and a pure choline bitartrate powder from Extreme Suplementos). They are recorded because they were mentioned, not as endorsements or quality assessments: supplement purity, dosing and labelling vary between products and sellers, and prices or availability change."
    ],
    evidence: "established",
    facts: { "choline content": "41 % by mass", "dosing-range": "250-1000 mg choline/day typical", ul: "3.5 g/day choline (IOM); EFSA none set" },
    relations: [
      { rel: "increases", to: "compound:choline" },
      { rel: "increases", to: "compound:trimethylamine", note: "Dose-dependent; more with free choline salts" },
      { rel: "increases", to: "compound:acetylcholine", note: "Plausible; evidence in adults with adequate intake weak" },
      { rel: "contraindicated-in", to: "disease:trimethylaminuria" }
    ],
    refs: ["article:iom-1998-choline-dri", "article:efsa-2016-choline-dri"]
  },
  {
    id: "intervention:alpha-gpc-supplement",
    type: "intervention",
    name: "Alpha-GPC supplement",
    aliases: ["alfa-GPC", "L-alfa-glicerilfosforilcolina", "choline alfoscerate", "suplemento de alfa-GPC"],
    summary: "Glycerophosphocholine (about 40 % choline) taken at 300-1200 mg/day for cognition or sport; absorbed without gastric acid but with limited quality evidence.",
    body: [
      "Alpha-GPC ([[compound:glycerophosphocholine]]) is hydrolysed to choline and glycerol phosphate and raises circulating choline efficiently. Italian trials used 1,200 mg/day in dementia; sports data show small effects on growth hormone and power output. Side effects include headache, heartburn, insomnia and irritability. A 2021 observational Korean claims analysis reported an association with stroke (confounded; mechanism uncertain). It does not require gastric acid for absorption.",
      "Cautions: large intake increases microbial TMA/TMAO production like other choline sources ([[compound:tmao]]); avoid with cholinergic overload symptoms; discuss with a clinician in cardiovascular disease."
    ],
    evidence: "plausible",
    facts: { "dosing-range": "300-600 mg once or twice daily", "choline content": "about 40 %" },
    relations: [
      { rel: "increases", to: "compound:choline" },
      { rel: "increases", to: "compound:acetylcholine", note: "Plausible" },
      { rel: "increases", to: "compound:tmao", note: "Smaller effect than free choline in some data; not settled" }
    ]
  },
  {
    id: "intervention:citicoline-supplement",
    type: "intervention",
    name: "Citicoline (CDP-choline) supplement",
    aliases: ["citicolina", "Cognizin", "CDP-colina", "suplemento de citicolina", "Elysx", "citicolina lipossomal", "gotas de citicolina"],
    summary: "CDP-choline taken at 250-1000 mg/day; supplies choline and cytidine (uridine) for membrane synthesis, with mixed clinical evidence.",
    body: [
      "Oral [[compound:cdp-choline]] is hydrolysed in the gut into cytidine and choline, absorbed and resynthesised in brain. Choline is only about 20 % of its mass, so it is a smaller choline source than alpha-GPC per mg. Trials in stroke recovery (ICTUS) were neutral; small trials in cognitive impairment are mixed. Liquid and liposomal forms are marketed for tolerability, but absorption by the intestinal route is already good. Adverse effects are generally mild (headache, insomnia, GI upset). Cautions: additive cholinergic effects; unknown in pregnancy.",
      "The source conversation pointed to retail listings of this form (Elysx 500 mg citicoline drops sold through Mercado Livre, and a liposomal liquid citicoline (Cognizin) from iHerb). They are recorded because they were mentioned, not as endorsements or quality assessments: supplement purity, dosing and labelling vary between products and sellers, and prices or availability change."
    ],
    evidence: "plausible",
    facts: { "dosing-range": "250-500 mg once or twice daily", "choline content": "about 20 %" },
    relations: [
      { rel: "increases", to: "compound:choline" },
      { rel: "increases", to: "compound:phosphatidylcholine", note: "Via Kennedy pathway in brain" },
      { rel: "interacts-with", to: "pathway:kennedy-pathway" }
    ]
  },
  {
    id: "intervention:phosphatidylcholine-supplement",
    type: "intervention",
    name: "Phosphatidylcholine / lecithin supplement",
    aliases: ["lecitina", "fosfatidilcolina", "sunflower lecithin", "liquid phosphatidylcholine", "BodyBio PC", "suplemento de fosfatidilcolina", "fosfatidilcolina líquida", "lecitina de girassol"],
    summary: "Phospholipid choline source (13 % choline in pure PC; lecithin granules contain 20-25 % PC), delivered in soft gels, granules or liquids and absorbed independently of stomach acid.",
    body: [
      "Dietary [[compound:phosphatidylcholine]] is hydrolysed in the small intestine by pancreatic phospholipase A2 to [[compound:glycerophosphocholine]] and lysophosphatidylcholine. It supplies choline for the [[pathway:kennedy-pathway]], biliary phospholipid ([[system:bile]]) and VLDL assembly, and was associated with TMAO increases in the study that popularised the gut-flora link (Wang 2011). Lecithin granules (1-2 tablespoons) also deliver significant calories and phytoestrogens in soy products.",
      "Cautions: soy and egg allergy for relevant products; diarrhoea and nausea at high doses; unusual systemic effects of intravenous PC are not relevant to oral use. Claims that PC 'repairs mucosa' are plausible for biliary-gastric barrier lipids but not demonstrated.",
      "The source conversation pointed to retail listings of this form (an iHerb Brazil catalogue of liquid phosphatidylcholine and lecithin, including BodyBio PC and a purified liquid sunflower lecithin). They are recorded because they were mentioned, not as endorsements or quality assessments: supplement purity, dosing and labelling vary between products and sellers, and prices or availability change."
    ],
    evidence: "plausible",
    facts: { "dosing-range": "Lecithin 5-15 g/day; pure PC 1-3 g/day", "choline content": "13-14 % in pure PC" },
    relations: [
      { rel: "increases", to: "compound:phosphatidylcholine" },
      { rel: "increases", to: "compound:choline" },
      { rel: "interacts-with", to: "system:bile" }
    ],
    refs: ["article:wang-2011-gut-flora-phosphatidylcholine-cvd"]
  },
  {
    id: "intervention:dietary-choline-sources",
    type: "intervention",
    name: "Dietary choline sources (eggs, liver, meat, fish, soy)",
    aliases: ["ovos", "fígado", "alimentos ricos em colina", "dietary choline"],
    summary: "Food route to choline: egg yolk (about 150 mg/egg), beef liver (about 350 mg/85 g), meats, fish, soy and cruciferous vegetables; the primary way most people meet the adequate intake.",
    body: [
      "Whole foods supply choline as phosphatidylcholine, glycerophosphocholine and free choline together with betaine (in grains and spinach). Intake in many countries is below the EFSA adequate intake of 400 mg/day. Eggs and liver are the densest sources; vegetarians and pregnant women are at greater risk of low intake. Food forms are absorbed without acid and are less likely than isolated salts to cause GI effects or odour ([[compound:choline]], [[compound:phosphatidylcholine]], [[compound:betaine]]).",
      "A food-first approach is a gentle way to support [[pathway:choline-oxidation]] and methyl supply, but an egg-heavy diet is not a route to 10 g/day glycine: the stoichiometry of the conversion rules that out ([[compound:glycine]])."
    ],
    evidence: "established",
    facts: { "egg": "about 147 mg choline per large egg", "beef liver": "about 356 mg per 85 g", "AI": "400 mg/day (EFSA); 425-550 mg/day (IOM)" },
    relations: [
      { rel: "increases", to: "compound:choline" },
      { rel: "increases", to: "compound:betaine", note: "Via choline oxidation and dietary betaine" },
      { rel: "mitigates", to: "state:undermethylation", note: "Plausible" }
    ],
    refs: ["article:efsa-2016-choline-dri", "article:iom-1998-choline-dri"]
  },
  {
    id: "intervention:p5p-supplement",
    type: "intervention",
    name: "P5P (pyridoxal 5'-phosphate) supplement",
    aliases: ["P5P", "P-5-P", "piridoxal-5-fosfato", "active B6", "vitamin B6 (P5P)", "suplemento de P5P", "vitamina B6 ativa"],
    summary: "Pre-phosphorylated B6 coenzyme taken at 5-50 mg; supports GAD, SHMT and transsulfuration enzymes, but chronic high doses risk sensory neuropathy.",
    body: [
      "[[compound:plp]] is dephosphorylated to pyridoxal in the gut and plasma and taken up before rephosphorylation by [[enzyme:pdxk]], so its advantage over [[compound:pyridoxine]] is mainly relevant in rare PNPO-related conversion defects or hepatic dysfunction. Biochemical rationale for effects on anxiety, irritability, mental fog and sleep: [[enzyme:gad]] and the [[pathway:gaba-shunt]], histamine and serotonin synthesis/metabolism, and [[enzyme:shmt]]/[[enzyme:glycine-cleavage-system|GCS]] glycine flux. Small trials of B6 (about 100 mg pyridoxine) reduced self-reported anxiety; whether P5P specifically is superior is untested.",
      "Safety: the US UL is 100 mg/day, the EFSA UL (2023) only 12 mg/day, and neuropathy has been reported with chronic doses of 50-200 mg; any persistent tingling or numbness warrants stopping. Interactions: lowers levodopa efficacy without a decarboxylase inhibitor, reduces phenytoin and phenobarbital levels, and is used as an antidote for isoniazid neurotoxicity. Prefer low doses (5-25 mg) and keep total B6 from all supplements within label limits."
    ],
    evidence: "plausible",
    facts: { "dosing-range": "5-50 mg/day typical in supplements", ul: "100 mg/day (IOM); 12 mg/day (EFSA 2023)" },
    relations: [
      { rel: "increases", to: "compound:plp" },
      { rel: "mitigates", to: "state:b6-functional-deficiency" },
      { rel: "increases", to: "compound:gaba", note: "Via GAD; effect size in humans uncertain" },
      { rel: "mitigates", to: "outcome:brain-fog", note: "Anecdotal; plausible" },
      { rel: "mitigates", to: "disease:anxiety-disorder", note: "Weak trial evidence at about 100 mg B6" }
    ]
  },
  {
    id: "intervention:methylfolate-supplement",
    type: "intervention",
    name: "L-methylfolate (5-MTHF) supplement",
    aliases: ["metilfolato", "L-5-MTHF", "Metafolin", "Quatrefolic", "levomefolate", "suplemento de metilfolato"],
    summary: "Active reduced folate (0.4-1 mg OTC; 7.5-15 mg prescription for depression adjunct) that bypasses DHFR and MTHFR; can mask B12 deficiency.",
    body: [
      "[[compound:5-mthf]] feeds [[enzyme:mtr]] directly for [[compound:homocysteine]] remethylation and independently of the MTHFR C677T variant. It is the preferred supplemental form when folic acid is poorly tolerated or when the genotype is of concern, although plain folic acid raises red-cell folate as well in most people. Evidence for high-dose L-methylfolate as an antidepressant adjunct is mixed (large trials of 15 mg were inconclusive). Established cautions: masking of B12 deficiency, interaction with methotrexate and antiepileptics, and unspecific reports of irritability, insomnia or anxiety at higher doses in sensitive individuals.",
      "The UL of 1,000 micrograms applies to folic acid, not to natural folate or reduced forms, but no long-term safety data support very high chronic doses. Consider testing [[compound:vitamin-b12]] status first ([[intervention:homocysteine-mma-testing]])."
    ],
    evidence: "established",
    facts: { "dosing-range": "0.4-1 mg general; 7.5-15 mg prescription (medical food)", ul: "1000 micrograms/day applies to folic acid only", forms: "Calcium salt, glucosamine salt, magnesium salt" },
    relations: [
      { rel: "increases", to: "compound:5-mthf" },
      { rel: "decreases", to: "compound:homocysteine" },
      { rel: "interacts-with", to: "enzyme:mthfr", note: "Bypasses the step" },
      { rel: "mitigates", to: "state:undermethylation", note: "Plausible when folate-limited" },
      { rel: "aggravates", to: "state:overmethylation", note: "Proposed within the Walsh framework (methyl donors worsen over-methylation); independent evidence is lacking." }
    ]
  },
  {
    id: "intervention:folic-acid-supplement",
    type: "intervention",
    name: "Folic acid supplementation",
    aliases: ["ácido fólico", "folic acid supplement", "ácido fólico sintético"],
    summary: "Synthetic folate at 0.4-5 mg: established for preventing neural tube defects and lowering homocysteine; ULs apply, and DHFR saturation may leave unmetabolised folic acid.",
    body: [
      "Folic acid ([[compound:folic-acid]]) reliably raises folate status and lowers homocysteine by roughly 25 % at 0.8-5 mg/day, and 400 micrograms/day before conception prevents neural tube defects. It needs reduction by the slow DHFR step (Bailey 2009), so unmetabolised folic acid appears at higher doses; the clinical relevance is uncertain. Masking of B12 deficiency, interaction with methotrexate, phenytoin and some antifolates, and possible acceleration of existing neoplasia are the main cautions.",
      "The statement that folic acid 'slows methylation in high-performance brains' is not supported by evidence; at standard doses folic acid is effective and well studied. Choose between folic acid, [[intervention:methylfolate-supplement]] and [[intervention:folinic-acid-supplement]] based on dose, genotype/health context and prescriber input."
    ],
    evidence: "established",
    facts: { "dosing-range": "0.4 mg (NTD prevention); 4-5 mg for high-risk pregnancy under prescription", ul: "1000 micrograms/day (IOM; EU)" },
    relations: [
      { rel: "increases", to: "compound:thf", note: "After DHFR reduction" },
      { rel: "decreases", to: "compound:homocysteine" },
      { rel: "interacts-with", to: "compound:5-mthf", note: "Possible receptor competition at high doses (speculative)" }
    ],
    refs: ["article:bailey-2009-dhfr-slow-human-liver"]
  },
  {
    id: "intervention:folinic-acid-supplement",
    type: "intervention",
    name: "Folinic acid (leucovorin) supplement",
    aliases: ["ácido folínico", "leucovorin", "calcium folinate"],
    summary: "5-formyl-THF that enters the folate pool without DHFR; used clinically for methotrexate rescue and cerebral folate deficiency, and as a low-dose supplement form.",
    body: [
      "[[compound:folinic-acid]] is converted to methenyl-THF and then to other reduced folates, bypassing DHFR but not the MTHFR step. Prescription doses range from 15 mg (methotrexate rescue) to 0.5-2 mg/kg/day in cerebral folate deficiency. Supplemental products at 400-1,000 micrograms are racemic; take care that the dose is within label limits. Cautions: potentiates 5-FU and capecitabine toxicity; may antagonise phenytoin/primidone; may mask B12 deficiency."
    ],
    evidence: "established",
    facts: { "dosing-range": "0.4-1 mg supplement; 15 mg and higher in medical settings" },
    relations: [
      { rel: "increases", to: "compound:5-10-methylene-thf" },
      { rel: "interacts-with", to: "compound:folic-acid", note: "DHFR bypass" },
      { rel: "decreases", to: "compound:homocysteine" }
    ],
    refs: ["article:reactome-folate-pterine-metabolism", "article:howard-2016-high-dose-methotrexate"]
  },
  {
    id: "intervention:methylcobalamin-supplement",
    type: "intervention",
    name: "Methylcobalamin supplement",
    aliases: ["metilcobalamina", "methyl B12", "metilcobalamina sublingual", "suplemento de metilcobalamina"],
    summary: "Methyl B12 at 500-5000 micrograms oral/sublingual; as effective as other B12 forms for status, with no established UL.",
    body: [
      "[[compound:methylcobalamin]] is the coenzyme for [[enzyme:mtr]]. Crystalline B12 in supplements does not depend on gastric acid for release, so it is a reasonable choice in people on [[intervention:ppi-therapy]] or with [[state:hypochlorhydria]], where food-bound B12 absorption falls. Passive absorption of about 1 % allows 500-1000 microgram daily doses to correct deficiency even without intrinsic factor; injections are used for neurological involvement or pernicious anaemia. Established cautions are few (rare acne or itch); verify B12 status with [[compound:methylmalonic-acid]] and Hcy rather than serum B12 alone ([[intervention:homocysteine-mma-testing]]).",
      "Claims that methyl B12 is superior to [[intervention:cyanocobalamin-supplement]] are weakly evidenced; both reach the intracellular pool."
    ],
    evidence: "established",
    facts: { "dosing-range": "500-1000 micrograms/day oral; 1000+ sublingual", ul: "None established" },
    relations: [
      { rel: "increases", to: "compound:methylcobalamin" },
      { rel: "decreases", to: "compound:homocysteine" },
      { rel: "associated-with", to: "state:hypochlorhydria", note: "Crystalline B12 bypasses acid-dependent food-B12 release" },
      { rel: "mitigates", to: "state:undermethylation", note: "Cofactor form for methionine synthase; benefit documented mainly when B12 is deficient." },
      { rel: "aggravates", to: "state:overmethylation", note: "Proposed within the Walsh framework; independent evidence is lacking." }
    ],
    refs: ["article:stabler-2013-vitamin-b12-deficiency"]
  },
  {
    id: "intervention:cyanocobalamin-supplement",
    type: "intervention",
    name: "Cyanocobalamin supplement",
    aliases: ["cianocobalamina", "synthetic B12", "suplemento de cianocobalamina"],
    summary: "Most studied and stable B12 form; fully effective for correcting deficiency despite the tiny cyanide moiety.",
    body: [
      "[[compound:cyanocobalamin]] is converted intracellularly after decyanation. It is cheap, stable and the form used in most trials and injections; its cyanide content (about 2 % of mass) is trivial at supplement doses. Rare concerns include slower conversion in cblC deficiency and reduced renal retention differences in advanced kidney disease, where hydroxocobalamin or methylcobalamin are sometimes preferred. Smokers have higher cyanide loads but B12 supplementation remains appropriate."
    ],
    evidence: "established",
    facts: { "dosing-range": "250-1000 micrograms/day oral", ul: "None established" },
    relations: [
      { rel: "increases", to: "compound:cyanocobalamin" },
      { rel: "decreases", to: "compound:methylmalonic-acid" },
      { rel: "decreases", to: "compound:homocysteine" }
    ],
    refs: ["article:stabler-2013-vitamin-b12-deficiency"]
  },
  {
    id: "intervention:magnesium-l-threonate",
    type: "intervention",
    name: "Magnesium L-threonate",
    aliases: ["treonato de magnésio", "Magtein", "magnesium threonate"],
    summary: "Magnesium salt with about 7-8 % elemental Mg, marketed for brain delivery; rodent data show raised CSF Mg, but human evidence is limited.",
    body: [
      "Magnesium L-threonate (typical 1.5-2 g/day providing about 100-144 mg elemental Mg) raised brain magnesium and synaptic density in rats (Slutsky 2010), and a small randomised trial reported cognitive improvements in older adults. The claim of 'exclusive' blood-brain-barrier tropism is overstated; other magnesium salts also raise CSF Mg modestly, and the dose of elemental Mg is low. It provides [[compound:magnesium]] as a cofactor for [[enzyme:mat]] and [[enzyme:pdxk]] only in the Mg-ATP sense.",
      "Cautions: renal impairment (hypermagnesaemia), diarrhoea, chelation interactions with tetracyclines, quinolones, bisphosphonates and levothyroxine (separate by 2-4 h). Supplemental UL 350 mg/day (IOM) or 250 mg/day (EU SCF)."
    ],
    evidence: "speculative",
    facts: { "elemental Mg": "about 7-8 % by mass (144 mg per 2 g of commercial Magtein)", "dosing-range": "1.5-2 g/day of the salt", ul: "350 mg/day supplemental Mg (IOM); 250 mg/day (EU SCF)" },
    relations: [
      { rel: "increases", to: "compound:magnesium" },
      { rel: "interacts-with", to: "enzyme:mat", note: "Mg-ATP substrate" },
      { rel: "mitigates", to: "outcome:brain-fog", note: "Weak evidence" }
    ],
    refs: ["article:slutsky-2010-magnesium-threonate"]
  },
  {
    id: "intervention:magnesium-malate",
    type: "intervention",
    name: "Magnesium malate",
    aliases: ["malato de magnésio", "magnesium malate"],
    summary: "Well-tolerated organic magnesium salt (about 15 % Mg) marketed for fatigue and muscle symptoms; absorption is comparable to other organic Mg salts.",
    body: [
      "Magnesium malate provides [[compound:magnesium]] with malic acid, a Krebs-cycle intermediate; small fibromyalgia trials were weak. Organic salts (malate, citrate, glycinate) are generally better absorbed and less laxative than oxide. It is an inexpensive way to correct low magnesium intake or PPI-associated losses ([[intervention:ppi-therapy]]). Cautions as for other magnesium salts: renal impairment, chelation interactions, loose stools at higher doses; UL 350 mg/day supplemental (IOM)."
    ],
    evidence: "plausible",
    facts: { "elemental Mg": "about 15 %", "dosing-range": "100-400 mg elemental Mg/day", ul: "350 mg/day supplemental Mg (IOM); 250 mg/day (EU SCF)" },
    relations: [
      { rel: "increases", to: "compound:magnesium" },
      { rel: "interacts-with", to: "enzyme:mat" },
      { rel: "interacts-with", to: "intervention:ppi-therapy", note: "Replaces PPI-associated magnesium depletion (adverse-effect mitigation)" }
    ]
  },
  {
    id: "intervention:magnesium-glycinate",
    type: "intervention",
    name: "Magnesium glycinate (bisglycinate)",
    aliases: ["glicinato de magnésio", "bisglicinato de magnésio", "magnesium bisglycinate"],
    summary: "Chelate of magnesium with two glycine molecules (14 % Mg, 87 % glycine by mass); well tolerated, but 400 mg Mg delivers about 2.5 g glycine.",
    body: [
      "Magnesium bisglycinate (molar mass 172.4 g/mol) is popular for sleep and tolerability. Arithmetic: 400 mg elemental [[compound:magnesium]] requires about 2.8 g of the salt, which carries about 2.4 g [[compound:glycine]]. For someone who reacts to 2-3 g of free glycine, this magnesium form could contribute a comparable glycine dose, although bound glycine may be taken up differently and less osmotically; it is a point worth considering when troubleshooting intolerance ([[intervention:glycine-powder]]).",
      "Cautions as for other magnesium salts: renal impairment, chelation of tetracyclines/quinolones, supplemental UL 350 mg/day (IOM). Some products are blends with magnesium oxide rather than true chelates."
    ],
    evidence: "plausible",
    facts: { formula: "Mg(C2H4NO2)2", molarMass: "172.43 g/mol", "elemental Mg": "14.1 % by mass", "glycine content": "87 % by mass", ul: "350 mg/day supplemental Mg (IOM)" },
    relations: [
      { rel: "increases", to: "compound:magnesium" },
      { rel: "increases", to: "compound:glycine", note: "About 2.4 g glycine per 400 mg Mg" },
      { rel: "mitigates", to: "outcome:night-waking", note: "Plausible via magnesium or glycine; evidence modest" }
    ]
  },
  {
    id: "intervention:zinc-carnosine",
    type: "intervention",
    name: "Zinc carnosine (polaprezinc, PepZin GI)",
    aliases: ["zinco carnosina", "polaprezinc", "PepZin GI", "Promac"],
    summary: "Chelate of zinc and L-carnosine approved in Japan for gastric ulcer at 150 mg/day (about 34 mg zinc); local mucosal protection and healing support, with trials as H. pylori adjunct.",
    body: [
      "Polaprezinc adheres to ulcerated mucosa, releasing zinc and carnosine locally; proposed actions include antioxidant effects, stabilisation of mucus, promotion of epithelial repair and anti-H. pylori activity. It has been prescribed in Japan since 1994 at 75 mg twice daily (150 mg/day contains about 34 mg zinc) and has supportive RCTs in gastric ulcer healing, as an adjunct to H. pylori eradication, and for small-bowel NSAID injury (Mahmood 2007). Outside Japan most evidence is smaller and manufacturer-linked, so 'gold standard' overstates it.",
      "Cautions: the zinc dose exceeds the EU UL of 25 mg/day and approaches the IOM UL of 40 mg/day, so long courses risk copper deficiency (monitor copper and keep to short courses); nausea on an empty stomach; chelation binds tetracycline and quinolones (important with [[intervention:h-pylori-eradication-therapy]] containing tetracycline, so separate dosing). Interacts with [[compound:zinc]] from other supplements; additive. See also [[compound:carnosine]], [[compound:gastric-mucus]]."
    ],
    evidence: "plausible",
    facts: { "dosing-range": "75 mg twice daily (about 34 mg Zn/day)", ul: "Zinc UL 40 mg/day (IOM), 25 mg/day (EU SCF)" },
    relations: [
      { rel: "mitigates", to: "disease:peptic-ulcer", note: "Approved in Japan; supportive RCTs" },
      { rel: "increases", to: "compound:gastric-mucus", note: "Proposed mucoprotective action" },
      { rel: "interacts-with", to: "intervention:h-pylori-eradication-therapy", note: "Adjunct; separate from tetracycline" },
      { rel: "increases", to: "compound:zinc" },
      { rel: "increases", to: "outcome:ulcer-healing", note: "Randomised trials in Japan and China support healing; effect sizes are modest and some trials are small." }
    ],
    refs: ["article:mahmood-2007-zinc-carnosine-gut-integrity"]
  },
  {
    id: "intervention:zinc-supplement",
    type: "intervention",
    name: "Zinc supplementation (non-chelated forms)",
    aliases: ["zinco", "zinc picolinate", "zinc gluconate", "zinc citrate", "suplemento de zinco"],
    summary: "Mineral supplement for deficiency (acid suppression and low acid reduce absorption); UL 40 mg/day (IOM) or 25 mg/day (EU).",
    body: [
      "Zinc supports [[enzyme:bhmt]], [[enzyme:mtr]] and [[enzyme:carbonic-anhydrase]] ([[compound:zinc]]). Deficiency is plausible with low acid intake, chronic [[intervention:ppi-therapy]], vegetarian diets and high phytate intake. Typical doses are 10-30 mg/day; chronic intake above the UL depletes copper and causes anaemia and neuropathy. Take with food to limit nausea. Interactions: quinolones, tetracyclines, penicillamine."
    ],
    evidence: "established",
    facts: { "dosing-range": "10-30 mg/day", ul: "40 mg/day (IOM); 25 mg/day (EU SCF)" },
    relations: [
      { rel: "increases", to: "compound:zinc" },
      { rel: "associated-with", to: "compound:kryptopyrrole", note: "Zinc repletion is part of the speculative pyroluria model only" },
      { rel: "interacts-with", to: "compound:magnesium", note: "Competing minerals at high dose" }
    ],
    refs: ["article:plum-2010-zinc-human-health", "article:iom-2001-micronutrients-zinc"]
  },
  {
    id: "intervention:dgl-licorice",
    type: "intervention",
    name: "DGL (deglycyrrhizinated licorice)",
    aliases: ["alcaçuz desglicirrizinado", "DGL", "deglycyrrhizinated licorice"],
    summary: "Licorice extract with most glycyrrhizin removed, chewed before meals as a traditional mucosal protectant; human evidence is old and limited.",
    body: [
      "DGL products (typically 380-760 mg chewable tablets, 20 minutes before meals, up to three times a day) are proposed to stimulate mucus secretion, prostaglandin E2 and epithelial turnover ([[compound:gastric-mucus]], [[compound:prostaglandin-e2]]). Support comes from older ulcer studies of mixed quality (Turpie 1969 positive; later comparisons less convincing) and small functional dyspepsia trials of a flavonoid-rich licorice extract. Chewing matters because saliva is thought to mediate effects.",
      "Safety: glycyrrhizin ([[compound:glycyrrhizin]]) raises blood pressure and lowers potassium through 11-beta-HSD2 inhibition; DGL has typically 1-3 % or less, but labels vary, so people with hypertension, heart failure, renal disease, hypokalaemia or on digoxin/diuretics should check the residual glycyrrhizin and avoid long courses. Not enough data for pregnancy. It has no known antacid effect."
    ],
    evidence: "plausible",
    facts: { "dosing-range": "380-760 mg chewed before meals up to 3 times/day", "residual glycyrrhizin": "typically 1-3 % or less" },
    relations: [
      { rel: "increases", to: "compound:gastric-mucus", note: "Proposed" },
      { rel: "mitigates", to: "disease:peptic-ulcer", note: "Older, limited studies" },
      { rel: "interacts-with", to: "compound:glycyrrhizin", note: "Residual content" }
    ]
  },
  {
    id: "intervention:l-glutamine-supplement",
    type: "intervention",
    name: "L-Glutamine supplement",
    aliases: ["L-glutamina", "glutamine powder", "suplemento de L-glutamina"],
    summary: "Conditionally essential amino acid fuel for enterocytes, used at 5-15 g/day for gut barrier support; best evidence in short-bowel and post-infectious IBS-D.",
    body: [
      "[[compound:glutamine]] is the main fuel of rapidly dividing mucosal cells. A randomised trial in post-infectious IBS-D used 5 g three times daily for 8 weeks with benefit; intravenous/enteral use is established in critical illness and short-bowel syndrome. Evidence in peptic ulcer healing dates from the 1950s and is inadequate. Observed safe level in healthy adults is about 14 g/day (Shao and Hathcock 2008).",
      "Cautions: it is converted to glutamate and ammonia, so avoid in cirrhosis/hepatic encephalopathy and use care in seizure disorder or mania; it may cause bloating, gas and belching in some, and powder is best mixed in small volumes with meals. The conversation includes it under mucosal repair; the human evidence for that specific use is weak ([[compound:glutamate]], [[compound:ammonia]])."
    ],
    evidence: "plausible",
    facts: { "dosing-range": "5 g up to three times daily in trials", ul: "OSL about 14 g/day (Shao and Hathcock 2008)" },
    relations: [
      { rel: "increases", to: "compound:glutamine" },
      { rel: "mitigates", to: "disease:peptic-ulcer", note: "Weak, historical evidence" },
      { rel: "increases", to: "compound:ammonia", note: "Via glutaminase; relevant in liver disease" }
    ],
    refs: ["article:shao-2008-osl-taurine-glutamine-arginine"]
  },
  {
    id: "intervention:sodium-alginate",
    type: "intervention",
    name: "Sodium alginate raft-forming reflux products",
    aliases: ["alginato de sódio", "Gaviscon", "alginate raft", "alginato"],
    summary: "Liquid or chewable alginate/bicarbonate/carbonate products taken after meals and at bedtime; form a floating gel raft that reduces acid and pepsin reflux without lowering acid secretion.",
    body: [
      "On contact with gastric acid, sodium alginate gels and, with CO2 from the bicarbonate/carbonate in the formulation, floats as a raft that displaces the post-prandial acid pocket and impedes reflux ([[compound:alginate]]). A meta-analysis (Leiman 2017) found alginates superior to placebo and antacids for GERD symptoms; evidence against PPIs is mixed, and for [[disease:lpr]] there are only small trials. In vitro, rafts can entrap pepsin and bile acids ([[compound:pepsin]]); clinical benefit for 'neutralising throat pepsin' is plausible but unproven. They do not suppress acid ([[compound:hydrochloric-acid]]).",
      "Cautions: sodium load of several mmol per dose (hypertension, heart failure, renal disease), calcium carbonate can cause constipation or milk-alkali effects, and the CO2 generated can itself cause burping in some users. Separate from tetracyclines, quinolones, iron and levothyroxine by 2 hours. Aluminium-free; some products contain aspartame (phenylketonuria)."
    ],
    evidence: "plausible",
    facts: { "typical dose": "10-20 mL liquid after meals and at bedtime", composition: "Sodium alginate with sodium bicarbonate and calcium carbonate" },
    relations: [
      { rel: "mitigates", to: "disease:gerd" },
      { rel: "mitigates", to: "disease:lpr", note: "Plausible; small trials" },
      { rel: "mitigates", to: "outcome:throat-burning" },
      { rel: "aggravates", to: "outcome:belching", note: "CO2 released to float the raft; occasional" }
    ],
    refs: ["article:leiman-2017-alginate-meta-analysis"]
  },
  {
    id: "intervention:ginger-extract",
    type: "intervention",
    name: "Ginger extract (standardised gingerols)",
    aliases: ["gengibre", "ginger root", "Zingiber officinale extract", "extrato de gengibre"],
    summary: "Ginger root powder or extract at 0.5-2 g/day with antiemetic and modest gastric-emptying effects; claims of 5-HT4 or MMC stimulation are unproven.",
    body: [
      "Gingerols and shogaols ([[compound:gingerols]]) antagonise 5-HT3 and M3 receptors in vitro ([[compound:serotonin]]). In a human study 1.2 g ginger accelerated gastric emptying in functional dyspepsia (Wu 2008), and it has repeatedly outperformed placebo for nausea. A prokinetic effect on the migrating motor complex ([[compound:motilin]], [[state:gastric-dysmotility]]) is not established.",
      "Cautions: heartburn and reflux in some users (pungent compounds can irritate inflamed mucosa), mild antiplatelet effects (caution with anticoagulants), blood-glucose lowering with diabetes drugs, gallstones. In pregnancy doses up to 1 g/day are generally considered acceptable for nausea."
    ],
    evidence: "plausible",
    facts: { "dosing-range": "0.5-2 g/day root powder; extracts standardised to 5 % gingerols" },
    relations: [
      { rel: "mitigates", to: "state:gastric-dysmotility", note: "Small trials of gastric emptying" },
      { rel: "increases", to: "system:gastric-physiology", note: "Faster emptying in some studies" },
      { rel: "aggravates", to: "disease:gerd", note: "Pungent irritant in some people" }
    ],
    refs: ["article:wu-2008-ginger-gastric-emptying"]
  },
  {
    id: "intervention:artichoke-leaf-extract",
    type: "intervention",
    name: "Artichoke leaf extract",
    aliases: ["alcachofra", "Cynara scolymus extract", "folha de alcachofra"],
    summary: "Choleretic herbal extract (320-640 mg, up to three times daily in trials) improving functional dyspepsia symptoms in one RCT; contraindicated in biliary obstruction.",
    body: [
      "Artichoke leaf extract ([[compound:cynarin]], chlorogenic acid, luteolin) increases bile flow ([[system:bile]]) and lowers LDL slightly; a 6-week randomised trial in functional dyspepsia showed improvement in symptom scores (Holtmann 2003). Mechanisms involving 'duodenal emptying' are speculative. It does not substitute for evaluation of persisting upper-GI symptoms.",
      "Contraindications and cautions: bile duct obstruction, acute gallbladder disease with stones (it can provoke colic), and allergy to Asteraceae (daisy family); possible additive effects with lipid-lowering and diuretic drugs; mild GI upset, flatulence."
    ],
    evidence: "plausible",
    facts: { "dosing-range": "320-640 mg extract up to three times daily in trials" },
    relations: [
      { rel: "increases", to: "system:bile", note: "Choleretic" },
      { rel: "mitigates", to: "state:gastric-dysmotility", note: "Functional dyspepsia RCT" },
      { rel: "interacts-with", to: "compound:cynarin" }
    ],
    refs: ["article:holtmann-2003-artichoke-leaf-functional-dyspepsia"]
  },
  {
    id: "intervention:espinheira-santa",
    type: "intervention",
    name: "Espinheira-santa (Maytenus ilicifolia)",
    aliases: ["espinheira santa", "Maytenus ilicifolia", "cancerosa", "holy thorn"],
    summary: "Brazilian medicinal tea/extract traditionally used for gastritis and ulcer; animal gastroprotection is well documented but human trials are few.",
    body: [
      "Leaves contain tannins, flavonoids, triterpenes (friedelin, friedelanol) and catechins. In rodents, extracts protect against ethanol-, indomethacin- and stress-induced gastric lesions, increase mucus, and also reduce acid secretion and gastric volume; the idea that it only increases prostaglandin-mediated mucus without any antisecretory effect is an oversimplification ([[compound:prostaglandin-e2]], [[compound:gastric-mucus]]). Human data comprise small studies on dyspepsia and gastritis. It is on the Brazilian Pharmacopoeia and in the public-health herbal list (RENISUS).",
      "Cautions: regulatory monographs advise against use in pregnancy and breastfeeding (animal studies suggest effects on fertility and uterine activity); tannins can reduce absorption of iron and some medicines, and the plant may cause dry mouth, nausea or constipation. Its place alongside PPIs or in H. pylori disease is unstudied ([[disease:peptic-ulcer]], [[intervention:ppi-therapy]]). The conversation credits it with healing ulcers without 'paralysing peristalsis'; this contrast is not documented in head-to-head human data."
    ],
    evidence: "plausible",
    facts: { "dosing-range": "Traditional infusions and standardised extracts; follow monograph, doses vary by product" },
    relations: [
      { rel: "mitigates", to: "disease:peptic-ulcer", note: "Strong animal data; limited human trials" },
      { rel: "increases", to: "compound:gastric-mucus" },
      { rel: "interacts-with", to: "intervention:ppi-therapy", note: "Unstudied combination" }
    ]
  },
  {
    id: "intervention:oregano-oil",
    type: "intervention",
    name: "Oregano oil (carvacrol)",
    aliases: ["óleo de orégano", "oil of oregano", "carvacrol capsules"],
    summary: "Concentrated essential oil with antimicrobial phenols used in herbal SIBO regimens; irritant to inflamed mucosa and with little clinical evidence.",
    body: [
      "Oregano oil's carvacrol and thymol ([[compound:carvacrol]]) kill bacteria in vitro at sub-mg/mL concentrations; absorption in the upper gut is high so the oil may not reach the distal small bowel unless enteric-coated. Clinical trials are scarce; herbal SIBO regimens that included oregano-type oils showed rates comparable to rifaximin in one small study, not a head-to-head test of the oil ([[disease:sibo]], [[intervention:berberine-supplement]]).",
      "Cautions: strong burning in the mouth, throat and oesophagus, especially in LPR or oesophagitis ([[outcome:throat-burning]]); may aggravate heartburn, interact with anticoagulants and diabetes drugs, and is avoided in pregnancy and in Lamiaceae allergy. Enteric-coated capsules reduce irritation but delay release."
    ],
    evidence: "speculative",
    facts: { "dosing-range": "Enteric-coated 100-200 mg twice daily in practitioner protocols; not standardised" },
    relations: [
      { rel: "decreases", to: "disease:sibo", note: "In vitro and weak clinical data" },
      { rel: "aggravates", to: "outcome:throat-burning", note: "Mucosal irritant" },
      { rel: "aggravates", to: "disease:lpr" },
      { rel: "contraindicated-in", to: "disease:esophagitis", note: "Pungent phenols on inflamed oesophageal lining; general caution." }
    ]
  },
  {
    id: "intervention:berberine-supplement",
    type: "intervention",
    name: "Berberine supplement",
    aliases: ["berberina", "berberine HCl", "suplemento de berberina"],
    summary: "Alkaloid used at 500 mg two to three times daily for glucose and lipids and in herbal SIBO protocols; interacts with CYP enzymes and is avoided in pregnancy.",
    body: [
      "[[compound:berberine]] activates AMPK and modulates the gut microbiota. It improves fasting glucose and LDL in meta-analyses of mostly low-quality trials. One small trial found herbal regimens containing berberine comparable to rifaximin for SIBO breath-test normalisation (Chedid 2014); this is preliminary ([[disease:sibo]]).",
      "Cautions: GI upset, constipation or diarrhoea; inhibits CYP2D6/3A4 and P-gp (cyclosporine, tacrolimus, statins, many others); additive hypoglycaemia; avoid in pregnancy and lactation (neonatal jaundice risk) and in infants. Antimicrobial courses can themselves disturb microbiota ([[system:gut-microbiota]])."
    ],
    evidence: "plausible",
    facts: { "dosing-range": "500 mg 2-3 times daily, typically 8-12 weeks in trials" },
    relations: [
      { rel: "decreases", to: "disease:sibo", note: "Preliminary" },
      { rel: "interacts-with", to: "system:gut-microbiota" },
      { rel: "interacts-with", to: "intervention:ppi-therapy", note: "CYP interactions with some PPIs" }
    ],
    refs: ["article:chedid-2014-herbal-vs-rifaximin"]
  },
  {
    id: "intervention:ppi-therapy",
    type: "intervention",
    name: "Proton pump inhibitors (omeprazole, pantoprazole, esomeprazole, lansoprazole, rabeprazole)",
    aliases: ["IBP", "inibidores da bomba de prótons", "omeprazol", "pantoprazol", "PPI", "proton pump inhibitor"],
    summary: "Prodrugs that irreversibly block parietal-cell H+/K+-ATPase; first-line for ulcer, GERD and H. pylori regimens, with long-term effects on B12, magnesium and the upper-gut microbiome.",
    body: [
      "PPIs are acid-activated, form covalent sulfenamide bonds with the proton pump and suppress [[compound:hydrochloric-acid]] for 24 hours or more; acid recovers over 3-5 days as new pumps appear. Standard courses are 4 weeks for duodenal and 8 weeks for gastric ulcer, 14 days within [[intervention:h-pylori-eradication-therapy]], and 8 weeks for erosive oesophagitis; take 30-60 minutes before the first meal. Hypergastrinaemia is expected ([[compound:gastrin]]) and withdrawal produces rebound acid symptoms (Reimer 2009), so tapering is advisable.",
      "Established adverse associations with long-term use: B12 deficiency (Lam 2013), hypomagnesaemia (FDA 2011 warning), iron and calcium malabsorption, enteric infections including C. difficile, and a higher likelihood of SIBO diagnosis (meta-analysis; Lo 2013, with breath-test caveats). Interactions: clopidogrel with omeprazole/esomeprazole (CYP2C19), methotrexate, levothyroxine, atazanavir. Acid suppression does not directly cause 'lazy' motility; the source conversation's motilin/secretin explanation is speculative ([[compound:motilin]], [[compound:secretin]]). Decisions to stop PPIs after ulcer treatment belong with the prescriber, especially until H. pylori eradication is confirmed ([[intervention:h-pylori-testing]])."
    ],
    evidence: "established",
    facts: { "dosing-range": "Omeprazole 20-40 mg/day typical; pantoprazole 40 mg", class: "H+/K+-ATPase inhibitors", "key trials": "Healing 4 weeks DU, 8 weeks GU" },
    relations: [
      { rel: "decreases", to: "pathway:gastric-acid-secretion" },
      { rel: "causes", to: "state:hypochlorhydria" },
      { rel: "mitigates", to: "disease:peptic-ulcer" },
      { rel: "mitigates", to: "disease:gerd" },
      { rel: "aggravates", to: "disease:sibo", note: "Associated in meta-analysis; mechanism and causality debated" },
      { rel: "decreases", to: "compound:vitamin-b12", note: "Food-bound B12 absorption falls with long-term use" },
      { rel: "decreases", to: "compound:magnesium", note: "Hypomagnesaemia with long-term use" },
      { rel: "mitigates", to: "disease:lpr", note: "Trial evidence is mixed; benefit is likeliest when typical reflux symptoms coexist." },
      { rel: "mitigates", to: "disease:esophagitis", note: "First-line healing therapy for erosive oesophagitis." }
    ],
    refs: ["article:lam-2013-ppi-b12-deficiency", "article:cheungpasitporn-2015-ppi-hypomagnesemia", "article:lo-2013-ppi-sibo-meta-analysis", "article:reimer-2009-ppi-rebound-acid", "article:katz-2022-acg-gerd-guideline"]
  },
  {
    id: "intervention:h2-receptor-antagonists",
    type: "intervention",
    name: "H2-receptor antagonists (famotidine, others)",
    aliases: ["antagonistas H2", "famotidina", "H2 blockers", "bloqueadores H2", "ranitidina"],
    summary: "Competitive blockers of ECL-histamine signalling at parietal cells; quicker but weaker and tolerance-prone acid suppressants compared with PPIs.",
    body: [
      "Famotidine (20-40 mg once or twice daily; renal dosing needed) blocks H2 receptors, reducing acid especially at night ([[compound:histamine]], [[pathway:gastric-acid-secretion]]). Tachyphylaxis develops within days to weeks. Ranitidine was withdrawn in 2020 over NDMA impurity. Also associated with lower B12 absorption in long-term use (Lam 2013). Cimetidine inhibits CYP enzymes. Useful for short-term nocturnal symptoms and as an adjunct; head-to-head they heal ulcers less reliably than PPIs."
    ],
    evidence: "established",
    facts: { "dosing-range": "Famotidine 20-40 mg once or twice daily" },
    relations: [
      { rel: "decreases", to: "pathway:gastric-acid-secretion" },
      { rel: "mitigates", to: "disease:gerd" },
      { rel: "interacts-with", to: "compound:histamine" },
      { rel: "mitigates", to: "disease:peptic-ulcer", note: "Healing agents in meta-analysis, less effective than PPIs." },
      { rel: "decreases", to: "pathway:histamine-receptor-signalling", note: "Block H2 receptors only; H1 effects such as flushing are not blocked." }
    ],
    refs: ["article:lam-2013-ppi-b12-deficiency", "article:schubert-2008-gastric-acid-secretion-control"]
  },
  {
    id: "intervention:prokinetic-drugs",
    type: "intervention",
    name: "Prokinetic drugs (metoclopramide, domperidone, erythromycin, prucalopride)",
    aliases: ["procinéticos", "domperidona", "metoclopramida", "prokinetics"],
    summary: "Medications enhancing upper-GI motility via dopamine antagonism, motilin or 5-HT4 agonism; prescription-only with specific risks.",
    body: [
      "Metoclopramide (D2 antagonist, 5-HT4 agonist) carries a boxed warning for tardive dyskinesia with use over 12 weeks; domperidone is a peripheral D2 antagonist with QT-prolongation risk and is unlicensed in some countries; erythromycin acts at the motilin receptor ([[compound:motilin]]) but tachyphylaxis and antibiotic resistance limit use; prucalopride and others target 5-HT4 ([[compound:serotonin]]). Evidence supports use mainly in gastroparesis and dysmotility ([[state:gastric-dysmotility]]), and low-dose erythromycin or prucalopride is used off-label for SIBO relapse prevention. Not appropriate for self-treatment of belching without evaluation."
    ],
    evidence: "established",
    facts: { class: "Prescription motility agents" },
    relations: [
      { rel: "mitigates", to: "state:gastric-dysmotility" },
      { rel: "interacts-with", to: "compound:motilin" },
      { rel: "mitigates", to: "disease:sibo", note: "Relapse prevention; off-label" }
    ],
    refs: ["article:camilleri-2022-acg-gastroparesis"]
  },
  {
    id: "intervention:h-pylori-eradication-therapy",
    type: "intervention",
    name: "H. pylori eradication therapy",
    aliases: ["erradicação do H. pylori", "terapia tripla", "bismuth quadruple therapy", "tratamento do H. pylori"],
    summary: "14-day PPI-based antibiotic regimens (bismuth quadruple or clarithromycin triple, depending on resistance) that cure H. pylori and sharply reduce ulcer recurrence.",
    body: [
      "Current guidelines (Maastricht VI/Florence 2022; ACG 2024) favour 14-day bismuth quadruple therapy (PPI, bismuth, tetracycline, metronidazole) first-line, or PPI-clarithromycin-amoxicillin only where clarithromycin resistance is below about 15 %; vonoprazan-amoxicillin and rifabutin-based regimens are alternatives. Eradication cures most peptic ulcers and lowers recurrence from over half to under 10 % ([[disease:h-pylori-infection]], [[disease:peptic-ulcer]]). Eradication should be confirmed at least 4 weeks after antibiotics and 2 weeks off PPIs by urea breath or stool antigen testing ([[intervention:h-pylori-testing]]).",
      "Cautions: antibiotics transiently disrupt the microbiota ([[system:gut-microbiota]]); metronidazole with alcohol causes disulfiram-like reactions; tetracycline is avoided in pregnancy and chelated by zinc, magnesium and calcium; bismuth darkens stool; side effects include taste disturbance, nausea and diarrhoea. Residual upper-GI symptoms after successful eradication are common and need separate evaluation ([[outcome:belching]], [[disease:gerd]])."
    ],
    evidence: "established",
    facts: { duration: "14 days", "first-line": "Bismuth quadruple therapy (guideline-dependent)", "test of cure": "UBT or stool antigen at least 4 weeks after antibiotics" },
    relations: [
      { rel: "mitigates", to: "disease:h-pylori-infection" },
      { rel: "mitigates", to: "disease:peptic-ulcer" },
      { rel: "interacts-with", to: "system:gut-microbiota", note: "Short-term dysbiosis" },
      { rel: "interacts-with", to: "intervention:zinc-carnosine", note: "Chelation with tetracycline; adjunct trials" }
    ],
    refs: ["article:malfertheiner-2022-maastricht-vi"]
  },
  {
    id: "intervention:h-pylori-testing",
    type: "intervention",
    name: "H. pylori testing (urea breath test, stool antigen, endoscopy)",
    aliases: ["teste do H. pylori", "teste respiratório da ureia", "UBT", "stool antigen test"],
    summary: "Non-invasive tests to diagnose infection or confirm eradication; PPIs, antibiotics and bismuth cause false negatives.",
    body: [
      "The 13C-urea breath test ([[compound:urea]]) detects urease activity of H. pylori ([[enzyme:h-pylori-urease|H. pylori urease]]) with about 95 % accuracy; stool antigen testing is similar; serology only shows exposure and cannot confirm cure. Stop PPIs 2 weeks, antibiotics and bismuth 4 weeks before testing; H2 blockers should also be withheld for 1-2 days in some protocols. Endoscopy with biopsy is indicated with alarm features (dysphagia, weight loss, bleeding, anaemia, age over 50-60 with new symptoms) and for ulcers.",
      "Testing after ulcer treatment is important when symptoms persist, because incomplete eradication would leave the ulcer's root cause in place ([[disease:h-pylori-infection]], [[intervention:ppi-therapy]])."
    ],
    evidence: "established",
    facts: { sensitivity: "about 90-95 % UBT/stool antigen", "washout": "PPIs 2 weeks; antibiotics/bismuth 4 weeks" },
    relations: [
      { rel: "interacts-with", to: "intervention:ppi-therapy", note: "Causes false negatives" },
      { rel: "interacts-with", to: "intervention:h-pylori-eradication-therapy", note: "Test of cure" },
      { rel: "associated-with", to: "disease:h-pylori-infection" }
    ],
    refs: ["article:malfertheiner-2022-maastricht-vi", "article:chey-2024-acg-h-pylori-treatment"]
  },
  {
    id: "intervention:sibo-breath-test",
    type: "intervention",
    name: "Hydrogen/methane breath testing for SIBO",
    aliases: ["teste respiratório de hidrogênio e metano", "lactulose breath test", "glucose breath test", "SIBO breath test"],
    summary: "Fasting breath collections after glucose or lactulose to detect fermentation gases; limited accuracy and not specific for belching or proximal gastric bacteria.",
    body: [
      "North American consensus (Rezaie 2017) defines a positive test as a rise of at least 20 ppm hydrogen within 90 minutes of substrate (glucose or lactulose), or methane of 10 ppm or more (intestinal methanogen overgrowth). Lactulose can give false positives with fast transit; glucose is absorbed proximally and may miss distal overgrowth; hydrogen-sulfide producers are missed. Preparation: fasting, a low-fermentable diet the day before, no antibiotics for 4 weeks and withholding laxatives ([[disease:sibo]]).",
      "The test does not assess the stomach or detect belching mechanisms; SIBO more typically produces bloating and flatulence, and PPI users have higher positive rates, partly through test limitations (Lo 2013). It is not in itself diagnostic of 'bacterial glycine fermentation'. Treatment of confirmed SIBO is usually rifaximin ± neomycin, and relapse is common; the guideline is Pimentel 2020."
    ],
    evidence: "plausible",
    facts: { criteria: "H2 rise at least 20 ppm by 90 min; CH4 at least 10 ppm", substrates: "Glucose 75 g or lactulose 10 g" },
    relations: [
      { rel: "associated-with", to: "disease:sibo" },
      { rel: "interacts-with", to: "intervention:ppi-therapy", note: "PPI users have higher positive rates" },
      { rel: "interacts-with", to: "system:gut-microbiota" }
    ],
    refs: ["article:rezaie-2017-breath-test-consensus", "article:pimentel-2020-acg-sibo-guideline", "article:lo-2013-ppi-sibo-meta-analysis"]
  },
  {
    id: "intervention:amino-acids-with-meals",
    type: "intervention",
    name: "Taking amino acids with meals versus fasting",
    aliases: ["aminoácidos com refeições", "glicina com as refeições", "amino acids with food"],
    summary: "Practice of dosing free amino acid powders within a meal rather than fasting to dilute osmotic load, slow gastric emptying and reduce GI complaints; plausible but untested for belching.",
    body: [
      "Free amino acid solutions leave the stomach quickly when fasting (liquid half-emptying about 10-20 minutes) and arrive as a concentrated bolus in the jejunum; with a mixed solid meal, emptying is slower and the amino acids are diluted and absorbed gradually. Taking with food is the usual manufacturer advice for [[intervention:glycine-powder]], [[intervention:l-glutamine-supplement]] and [[intervention:taurine-supplement]]. Splitting a dose (for example 1 g three times) and swallowing without swirling in a large volume of air-containing liquid also reduce aerophagia.",
      "The conversation states that fasting contact with water increases gastric exposure and bacterial fermentation; the evidence for that is lacking. Equally, food is not harmless: protein meals strongly stimulate gastrin and acid, so for someone with reflux the meal timing (bedtime dosing near a meal) matters ([[compound:gastrin]], [[intervention:reflux-lifestyle-measures]])."
    ],
    evidence: "speculative",
    facts: { principle: "Dilution and slower delivery reduce osmotic and distension effects" },
    relations: [
      { rel: "mitigates", to: "outcome:belching", note: "Plausible; no trial" },
      { rel: "interacts-with", to: "intervention:glycine-powder" },
      { rel: "interacts-with", to: "system:gastric-physiology", note: "Slows emptying; dilution" }
    ]
  },
  {
    id: "intervention:bicarbonate-rinse",
    type: "intervention",
    name: "Bicarbonate (alkaline) rinse or gargle",
    aliases: ["bochecho com bicarbonato", "alkaline water", "baking soda rinse", "gargle", "água alcalina", "bochechos com água alcalina"],
    summary: "Swish-and-spit of dilute sodium bicarbonate or alkaline water to neutralise acid and denature pepsin in the pharynx; inexpensive and low-risk but with little clinical evidence.",
    body: [
      "Pepsin is irreversibly denatured above about pH 7-8 ([[compound:pepsin]]), and a lab study found pH 8.8 water denatured pepsin and lowered its activity (Koufman 2012), which is the basis of gargles with a pinch (about one-quarter teaspoon in 100-200 mL) of [[compound:bicarbonate]] or drinking alkaline water in LPR ([[disease:lpr]]). Clinical benefit has not been shown in controlled trials; it also cannot affect pepsin already taken up into tissue.",
      "Cautions: spit rather than swallow, because swallowed bicarbonate reacts with gastric acid and releases CO2, which can provoke belching ([[compound:carbon-dioxide]]); sodium load in hypertension, heart failure or kidney disease; frequent large amounts can cause metabolic alkalosis; separate from some medicines; sodium-restricted individuals should avoid."
    ],
    evidence: "speculative",
    facts: { dose: "About 1/4 teaspoon NaHCO3 in 100-200 mL water as rinse; do not swallow large amounts" },
    relations: [
      { rel: "mitigates", to: "outcome:throat-burning", note: "Plausible symptom relief; evidence limited" },
      { rel: "mitigates", to: "disease:lpr", note: "Pepsin denaturation in vitro" },
      { rel: "causes", to: "outcome:belching", note: "If swallowed with acid" }
    ],
    refs: ["article:koufman-2012-alkaline-water-pepsin"]
  },
  {
    id: "intervention:beta-alanine-supplement",
    type: "intervention",
    name: "Beta-alanine supplement",
    aliases: ["beta-alanina", "β-alanina", "suplemento de beta-alanina"],
    summary: "Carnosine precursor at 3.2-6.4 g/day (divided) improving 1-4 minute high-intensity exercise; paraesthesia is dose-dependent.",
    body: [
      "[[compound:beta-alanine]] is the rate-limiting precursor of muscle [[compound:carnosine]]; 4-10 weeks of supplementation raises carnosine by 40-80 % (Trexler 2015). Tingling is common above 800 mg per dose and can be reduced by sustained-release or split dosing. High doses may lower taurine in animals ([[compound:taurine]]). Evidence for exercise capacity is good; claims of mucosal or gut tissue benefit via carnosine are not supported by human studies.",
      "Cautions: avoid with unexplained flushing/paraesthesia disorders; limited safety data in pregnancy. Does not contain glycine."
    ],
    evidence: "established",
    facts: { "dosing-range": "3.2-6.4 g/day in doses of 0.8-1.6 g" },
    relations: [
      { rel: "increases", to: "compound:carnosine" },
      { rel: "interacts-with", to: "compound:taurine" },
      { rel: "mitigates", to: "outcome:brain-fog", note: "Not supported; listed because conversation raised it" }
    ],
    refs: ["article:trexler-2015-issn-beta-alanine"]
  },
  {
    id: "intervention:niacin-nicotinamide-supplement",
    type: "intervention",
    name: "Niacin / nicotinamide supplements",
    aliases: ["niacina", "nicotinamida", "niacinamida", "vitamin B3 supplements", "suplemento de niacina"],
    summary: "NAD precursors; gram-dose use methylates nicotinamide via NNMT and acts as a methyl sink; nicotinic acid causes flushing, nicotinamide does not.",
    body: [
      "Nicotinic acid ([[compound:niacin]]) at 1-3 g/day lowers LDL and raises HDL but causes flushing, hepatotoxicity risk (especially slow-release) and higher homocysteine and uric acid. Nicotinamide ([[compound:nicotinamide]]), 500 mg twice daily, reduced non-melanoma skin cancer recurrence (ONTRAC) and is used in dermatology. The methyl cost is NNMT methylation to [[compound:1-methylnicotinamide]] using [[compound:sam]]; this is a real but moderate burden at gram doses and is more relevant in people with low methyl or folate status.",
      "ULs: 35 mg/day (IOM, total niacin), nicotinic acid 10 mg/day and nicotinamide 900 mg/day (EU SCF). Doses of RDA scale (14-16 mg) pose no methylation concern."
    ],
    evidence: "established",
    facts: { "dosing-range": "RDA 14-16 mg; nicotinamide 500-1000 mg in dermatology trials", ul: "35 mg/day total (IOM); 10 mg nicotinic acid, 900 mg nicotinamide (EU SCF)" },
    relations: [
      { rel: "increases", to: "compound:1-methylnicotinamide" },
      { rel: "decreases", to: "compound:sam", note: "Methyl sink at gram doses" },
      { rel: "increases", to: "compound:homocysteine", note: "Reported with gram doses" },
      { rel: "aggravates", to: "state:undermethylation", note: "Gram-dose use consumes SAM via NNMT; a moderate burden, more relevant when folate or methyl status is already low." },
      { rel: "mitigates", to: "state:overmethylation", note: "Proposed methyl sink via NNMT at gram doses; unvalidated for this indication." }
    ],
    refs: ["article:boden-2011-aim-high-niacin", "article:chen-2015-nicotinamide-skin-cancer", "article:pissios-2017-nnmt-methyl-sink"]
  },
  {
    id: "intervention:taurine-supplement",
    type: "intervention",
    name: "Taurine supplement",
    aliases: ["taurina em cápsulas", "taurine powder"],
    summary: "1-3 g/day amino sulfonic acid with antioxidant and bile-conjugation roles; observed safe level about 3 g/day.",
    body: [
      "Supplemental [[compound:taurine]] raises the taurine fraction of conjugated bile acids ([[compound:taurocholic-acid]], [[pathway:bile-acid-conjugation]]) and may reduce glycine conjugation, which can matter when the glycine pool is stretched. Trials at 1-6 g/day show modest blood-pressure and exercise benefits. Cautions: may lower blood pressure further with antihypertensives; theoretical lithium interaction; high doses may cause GI upset. Observed safe level about 3 g/day (Shao and Hathcock 2008)."
    ],
    evidence: "plausible",
    facts: { "dosing-range": "1-3 g/day", ul: "OSL about 3 g/day" },
    relations: [
      { rel: "increases", to: "compound:taurine" },
      { rel: "increases", to: "compound:taurocholic-acid", note: "Shifts conjugation toward taurine" },
      { rel: "interacts-with", to: "intervention:beta-alanine-supplement" }
    ],
    refs: ["article:shao-2008-osl-taurine-glutamine-arginine"]
  },
  {
    id: "intervention:same-supplement",
    type: "intervention",
    name: "SAMe (S-adenosylmethionine) supplement",
    aliases: ["SAMe", "S-adenosil-metionina", "AdoMet supplement", "suplemento de SAMe"],
    summary: "Enteric-coated SAMe salts at 400-1600 mg/day with evidence in depression and osteoarthritis; avoided in bipolar disorder and with serotonergic drugs.",
    body: [
      "Oral [[compound:sam]] is absorbed poorly (bioavailability about 1 % without enteric coating), but meta-analyses support efficacy in major depression and osteoarthritis pain comparable to some NSAIDs, with heterogeneous trial quality. In people who feel 'over-methylated' (anxiety, insomnia) it can worsen symptoms, whereas for suspected 'under-methylation' evidence is lacking ([[state:undermethylation]], [[state:overmethylation]]). It increases flux through the methyltransferases and raises SAH and homocysteine unless B vitamins are adequate.",
      "Cautions: serotonin syndrome risk with SSRIs/MAOIs/tramadol, mania in bipolar disorder, GI upset, insomnia, may reduce levodopa efficacy; avoid in pregnancy. Prefer evaluating cause (B12, folate, thyroid) before using."
    ],
    evidence: "plausible",
    facts: { "dosing-range": "400-1600 mg/day (butanedisulfonate or tosylate)", forms: "SAMe 1,4-butanedisulfonate, tosylate" },
    relations: [
      { rel: "increases", to: "compound:sam" },
      { rel: "increases", to: "compound:sah", note: "After methyl transfer" },
      { rel: "aggravates", to: "state:overmethylation" },
      { rel: "mitigates", to: "state:undermethylation", note: "Plausible; unproven for the state as defined clinically" }
    ]
  },
  {
    id: "intervention:creatine-supplement",
    type: "intervention",
    name: "Creatine monohydrate supplement",
    aliases: ["creatina", "creatine monohydrate", "suplemento de creatina"],
    summary: "3-5 g/day of creatine; reduces endogenous creatine synthesis, sparing SAM methyl groups and glycine, and is well tolerated in healthy adults.",
    body: [
      "Exogenous [[compound:creatine]] down-regulates kidney AGAT, so less [[compound:guanidinoacetate]] is made from [[compound:glycine]] and arginine and fewer [[compound:sam]] methyls are spent by GAMT ([[pathway:creatine-synthesis]]). Small human studies found lower plasma homocysteine; the size of methyl and glycine sparing at 3-5 g/day is uncertain but biochemically plausible. Well-established benefits: strength and high-intensity performance, some cognitive benefits under stress.",
      "Cautions: loose stools at large single doses, weight gain from water retention; existing kidney disease needs medical review; raises serum creatinine without lowering GFR (use cystatin C if needed)."
    ],
    evidence: "established",
    facts: { "dosing-range": "3-5 g/day (maintenance)" },
    relations: [
      { rel: "increases", to: "compound:creatine" },
      { rel: "decreases", to: "compound:guanidinoacetate", note: "Feedback repression of AGAT" },
      { rel: "mitigates", to: "state:undermethylation", note: "Methyl-sparing; plausible, indirect" }
    ],
    refs: ["article:stead-2006-methyl-balance-reevaluation"]
  },
  {
    id: "intervention:homocysteine-mma-testing",
    type: "intervention",
    name: "Homocysteine, MMA and B-vitamin testing",
    aliases: ["exame de homocisteína", "teste de MMA", "homocysteine test", "ácido metilmalônico"],
    summary: "Fasting blood tests (total homocysteine, MMA, B12/holo-transcobalamin, folate, PLP) that reveal functional B-vitamin status; interpret with renal function and pre-analytical care.",
    body: [
      "Total [[compound:homocysteine]] reflects remethylation and transsulfuration capacity; [[compound:methylmalonic-acid]] adds B12-specificity. Pair with serum B12 or holo-transcobalamin, red-cell or serum folate, plasma PLP (reflects inflammation) and creatinine/eGFR (renal impairment raises Hcy and MMA). Samples must be placed on ice and plasma separated within one hour, otherwise Hcy rises artefactually; fasting is preferred. Reference range for Hcy roughly 5-15 micromol/L (laboratory dependent).",
      "SAM, SAH and the SAM:SAH ratio ([[compound:sam]], [[compound:sah]]) can be measured by LC-MS but plasma values poorly mirror tissue methylation capacity and are not standard clinical tests, so claims of 'under-methylation' based on marketing panels (e.g., urinary histamine or whole-blood histamine) lack validation ([[state:undermethylation]])."
    ],
    evidence: "established",
    facts: { analytes: "tHcy, MMA, B12, holo-TC, folate, PLP, creatinine", handling: "Ice, separate plasma within 1 hour" },
    relations: [
      { rel: "associated-with", to: "compound:homocysteine" },
      { rel: "associated-with", to: "compound:methylmalonic-acid" },
      { rel: "associated-with", to: "state:b6-functional-deficiency", note: "Cystathionine/PLP assays more specific" },
      { rel: "associated-with", to: "state:undermethylation", note: "Indirect surrogate only" }
    ],
    refs: ["article:refsum-2004-homocysteine-recommendations", "article:stabler-2013-vitamin-b12-deficiency"]
  },
  {
    id: "intervention:reflux-lifestyle-measures",
    type: "intervention",
    name: "Reflux and belching lifestyle measures",
    aliases: ["medidas anti-refluxo", "head-of-bed elevation", "elevação da cabeceira", "diaphragmatic breathing"],
    summary: "Weight loss, head-of-bed elevation, avoiding late meals, trigger foods and carbonated drinks, and breathing/speech therapy for supragastric belching.",
    body: [
      "Evidence is strongest for weight loss in those with overweight and head-of-bed elevation (15-20 cm) with night-time symptoms; avoiding meals within 2-3 hours of bedtime, large fatty meals, alcohol and smoking are commonly advised; left-lateral sleeping position lowers nocturnal reflux ([[disease:gerd]], [[disease:lpr]]). Avoiding carbonated drinks, chewing gum, drinking through straws and rapid eating reduces swallowed air. For excessive supragastric belching, diaphragmatic breathing and speech-language therapy have the best evidence (Rome IV; [[compound:carbon-dioxide]], [[outcome:belching]]).",
      "Persisting throat burning with belching, hoarseness or globus should be evaluated for alarm features and alternative diagnoses; ENT assessment is advised because laryngoscopic signs are non-specific ([[outcome:throat-burning]], [[system:lower-esophageal-sphincter]])."
    ],
    evidence: "established",
    facts: { measures: "HOB elevation 15-20 cm; avoid late meals; weight loss; avoid carbonated drinks; diaphragmatic breathing" },
    relations: [
      { rel: "mitigates", to: "disease:gerd" },
      { rel: "mitigates", to: "disease:lpr" },
      { rel: "mitigates", to: "outcome:belching", note: "Especially behavioural/supragastric belching" },
      { rel: "mitigates", to: "outcome:throat-burning" }
    ],
    refs: ["article:katz-2022-acg-gerd-guideline", "article:stanghellini-2016-rome-iv-gastroduodenal"]
  },
  {
    id: "intervention:phased-reintroduction-protocol",
    type: "intervention",
    name: "Phased reintroduction protocol (heal, de-colonise, then re-supplement)",
    aliases: ["protocolo em fases", "fase 1 curar a mucosa", "orthomolecular phased protocol", "medicina ortomolecular", "ortomolecular", "protocolo ortomolecular"],
    summary: "The conversation's three-phase sequence: protect mucosa and stop aggravators, investigate H. pylori/SIBO, then reintroduce methyl and amino-acid supplements; a heuristic with no trial support.",
    body: [
      "The conversation proposes: (1) suspend betaine HCl and free glycine/collagen while using mucosal protectants ([[intervention:zinc-carnosine]], [[intervention:dgl-licorice]], [[intervention:l-glutamine-supplement]]); (2) verify H. pylori eradication and evaluate SIBO ([[intervention:h-pylori-testing]], [[intervention:sibo-breath-test]]); (3) maintain choline, P5P and methylated B vitamins, then retry glycine within meals ([[intervention:p5p-supplement]], [[intervention:betaine-anhydrous]], [[intervention:amino-acids-with-meals]]). The ordering is a sensible clinical heuristic (confirm and treat structural disease before supplements), but it is not a validated protocol and several steps rest on weak evidence.",
      "Safer framing: step 0 is medical evaluation, including endoscopy if alarm features are present, confirmation that H. pylori is gone, and review of ongoing NSAID or PPI use. Supplements are adjuncts that should be introduced one at a time to attribute effects."
    ],
    evidence: "conversation-only",
    facts: { phases: "1: mucosa; 2: upper-gut microbiology; 3: reintroduce methyl/amino-acid support" },
    relations: [
      { rel: "interacts-with", to: "intervention:betaine-hcl", note: "Phase 1 suspends" },
      { rel: "interacts-with", to: "intervention:glycine-powder", note: "Phase 3 re-test" },
      { rel: "mitigates", to: "disease:peptic-ulcer", note: "Intended aim; unproven as a protocol" }
    ]
  },
  {
    id: "intervention:hcl-challenge-test",
    type: "intervention",
    name: "Betaine HCl challenge ('acid challenge') self-test",
    aliases: ["teste de desafio de betaína HCl", "HCl challenge", "HCl test"],
    summary: "Practitioner self-test of escalating betaine HCl capsules with protein meals until warmth is felt; unvalidated and risky with ulcer history.",
    body: [
      "The usual instructions escalate 1 capsule (650 mg) per meal until a warm or burning feeling occurs, then step back one capsule. There are no studies validating the sensation as a measure of hypochlorhydria; objective alternatives are intragastric pH monitoring, the Heidelberg capsule test, or serum pepsinogen I and gastrin to screen for atrophic gastritis ([[state:hypochlorhydria]], [[compound:gastrin]]). Burning after betaine HCl can reflect intact acid sensitivity of a damaged or inflamed mucosa rather than adequate acidity.",
      "It should not be performed with a history of peptic ulcer or active gastritis, with NSAIDs or steroids, or during GERD/LPR ([[intervention:betaine-hcl]], [[disease:peptic-ulcer]]). Recent ulcer plus burning on a dose is a signal to stop and seek evaluation."
    ],
    evidence: "speculative",
    facts: { protocol: "Escalating 650 mg capsules with protein meal (unvalidated)" },
    relations: [
      { rel: "contraindicated-in", to: "disease:peptic-ulcer" },
      { rel: "contraindicated-in", to: "disease:lpr" },
      { rel: "associated-with", to: "state:hypochlorhydria", note: "Claims to detect it; not validated" }
    ]
  },
  {
    id: "intervention:diaphragmatic-breathing",
    type: "intervention",
    name: "Diaphragmatic breathing therapy",
    aliases: ["respiração diafragmática", "breathing retraining", "diaphragmatic breathing", "fonoterapia respiratória"],
    summary: "Behavioural therapy teaching slow abdominal breathing; first-line for supragastric belching and an adjunct for PPI-refractory reflux symptoms.",
    body: [
      "The therapy trains relaxed, low abdominal breathing, often with speech-language pathologist coaching, to stop the learned habit of sucking air into the oesophagus and expelling it again (supragastric belching, see [[disease:aerophagia-belching-disorders]]). Reflux symptoms also improved in the trial below, which may reflect less air swallowing and better crural diaphragm function, but the mechanism is not established.",
      "In a non-randomised open trial of PPI-refractory reflux with belching, 60% of treated patients cut their belching score by half or more versus none on the wait list ([[article:ong-2018-diaphragmatic-breathing-belching]]). The AGA update lists it with cognitive behavioural therapy and neuromodulators for supragastric belching, and states that evidence for all treatments is limited ([[article:moshiree-2023-aga-belching-bloating]]). It has no nutritional or methylation component, which makes it a useful comparison when belching is attributed to supplements ([[outcome:belching]])."
    ],
    evidence: "plausible",
    facts: { "typical-programme": "Several sessions with a speech-language pathologist plus daily home practice", "evidence-base": "One open non-randomised trial; guideline-listed behavioural therapy" },
    relations: [
      { rel: "mitigates", to: "outcome:belching", note: "Reduced belching scores in PPI-refractory GERD with belching" },
      { rel: "mitigates", to: "disease:aerophagia-belching-disorders", note: "Recommended behavioural treatment for supragastric belching" },
      { rel: "mitigates", to: "disease:gerd", note: "Refractory reflux symptoms improved alongside belching in a small trial" },
      { rel: "part-of", to: "intervention:reflux-lifestyle-measures" }
    ],
    refs: ["article:ong-2018-diaphragmatic-breathing-belching", "article:moshiree-2023-aga-belching-bloating", "article:kessing-2014-excessive-belching-review"]
  }
];
