// Reactions of methylation / one-carbon / choline / glycine / gastric-acid biochemistry.
// Content agent C2. Stoichiometry is balanced for the listed participants (heavy atoms, hydrogen and charge, using
// the ionisation states of Rhea/ChEBI at pH ~7.3; compound:proton is therefore listed where Rhea lists H+).
// The engine derives substrate-of / product-of / catalyzes from the `reaction` block, so those relations are not repeated.
// Rhea ids are master ids unless the repository's one-carbon model already uses a directional id (MTHFR RHEA:19819,
// MTR RHEA:11173); the master id is then given in facts["rhea-master"].

export default [
  // ------------------------------------------------------------------ SAM-dependent methyl transfers
  {
    id: "reaction:gnmt-glycine-methylation",
    type: "reaction",
    name: "GNMT: SAM + glycine -> SAH + sarcosine",
    aliases: ["SAM + glicina → SAH + sarcosina", "metilação da glicina", "dreno de metil GNMT"],
    summary: "Glycine N-methyltransferase moves a SAM methyl group onto glycine, forming sarcosine and SAH; the hepatic methyl-sink reaction.",
    body: [
      "Net: [[compound:glycine]] + [[compound:sam]] -> [[compound:sarcosine]] + [[compound:sah]] + H+. The reaction is effectively irreversible and is catalysed by [[enzyme:gnmt]]. Sarcosine is converted back to glycine by [[enzyme:sardh]] in mitochondria ([[reaction:sardh-sarcosine-demethylation]]), so the methyl carbon is conserved as 5,10-methylene-THF while SAM is irreversibly spent."
    ],
    evidence: "established",
    facts: {
      ec: "2.1.1.20",
      rhea: "RHEA:19937",
      reactome: "R-HSA-6798317",
      compartment: "cytosol",
      direction: "irreversible",
      "delta-g-note": "strongly favourable (SAM group-transfer potential)"
    },
    reaction: {
      reactants: [{ id: "compound:glycine", n: 1 }, { id: "compound:sam", n: 1 }],
      products: [{ id: "compound:sarcosine", n: 1 }, { id: "compound:sah", n: 1 }, { id: "compound:proton", n: 1 }],
      ec: "2.1.1.20",
      rhea: "RHEA:19937",
      reactome: "R-HSA-6798317",
      reversible: false,
      compartment: "cytosol",
      enzymes: ["enzyme:gnmt"]
    },
    relations: [
      { rel: "part-of", to: "pathway:methyl-budget" },
      { rel: "part-of", to: "pathway:methionine-cycle" },
      { rel: "interacts-with", to: "reaction:sardh-sarcosine-demethylation", note: "sarcosine is returned to glycine, recapturing the methyl as 5,10-CH2-THF" }
    ],
    refs: ["article:melendez-hevia-2009-glycine-weak-link"]
  },
  {
    id: "reaction:pemt-pe-to-pc",
    type: "reaction",
    name: "PEMT: PE + 3 SAM -> PC + 3 SAH",
    aliases: ["PE + 3 SAM → PC + 3 SAH", "três metilações da fosfatidiletanolamina", "síntese de PC por metilação"],
    summary: "Three successive SAM-dependent N-methylations convert phosphatidylethanolamine into phosphatidylcholine in hepatic ER/MAM.",
    body: [
      "Net: [[compound:phosphatidylethanolamine]] + 3 [[compound:sam]] -> [[compound:phosphatidylcholine]] + 3 [[compound:sah]] + 3 H+. [[enzyme:pemt]] performs the three steps through phosphatidyl-N-methylethanolamine and phosphatidyl-N,N-dimethylethanolamine (Rhea RHEA:11164, RHEA:32735, RHEA:32739). It is therefore the most SAM-expensive reaction per product molecule in liver ([[pathway:methyl-budget]]); the stoichiometry 3:1 is what makes PEMT a major methyl sink."
    ],
    evidence: "established",
    facts: {
      ec: "2.1.1.17; 2.1.1.71",
      rhea: "RHEA:11164; RHEA:32735; RHEA:32739",
      reactome: "R-HSA-1483174",
      compartment: "endoplasmic reticulum / mitochondria-associated membrane (hepatocyte)",
      direction: "irreversible (net of three steps)"
    },
    reaction: {
      reactants: [{ id: "compound:phosphatidylethanolamine", n: 1 }, { id: "compound:sam", n: 3 }],
      products: [{ id: "compound:phosphatidylcholine", n: 1 }, { id: "compound:sah", n: 3 }, { id: "compound:proton", n: 3 }],
      ec: "2.1.1.17",
      rhea: "RHEA:11164",
      reactome: "R-HSA-1483174",
      reversible: false,
      compartment: "endoplasmic reticulum / mitochondria-associated membrane",
      enzymes: ["enzyme:pemt"]
    },
    relations: [
      { rel: "part-of", to: "pathway:pemt-pc-synthesis" },
      { rel: "part-of", to: "pathway:methyl-budget", note: "3 methyl groups per PC" },
      { rel: "interacts-with", to: "reaction:chpt1-cdp-choline-to-pc", note: "parallel route to PC (CDP-choline)" }
    ]
  },
  {
    id: "reaction:bhmt-betaine-homocysteine",
    type: "reaction",
    name: "BHMT: betaine + homocysteine -> dimethylglycine + methionine",
    aliases: ["betaína + homocisteína → DMG + metionina", "remetilação por betaína", "TMG + Hcy"],
    summary: "Zinc-dependent transfer of one betaine methyl group to homocysteine, forming methionine and dimethylglycine; folate- and B12-independent remethylation.",
    body: [
      "[[compound:betaine]] + [[compound:homocysteine]] -> [[compound:dimethylglycine]] + [[compound:methionine]], catalysed by [[enzyme:bhmt]] (liver, kidney; cytosol). The dimethylglycine is imported into mitochondria for [[reaction:dmgdh-dimethylglycine-demethylation]]. Remethylation here bypasses [[enzyme:mthfr]] and [[enzyme:mtr]]."
    ],
    evidence: "established",
    facts: {
      ec: "2.1.1.5",
      rhea: "RHEA:22336",
      reactome: "R-HSA-1614654",
      compartment: "cytosol",
      direction: "essentially irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:betaine", n: 1 }, { id: "compound:homocysteine", n: 1 }],
      products: [{ id: "compound:dimethylglycine", n: 1 }, { id: "compound:methionine", n: 1 }],
      ec: "2.1.1.5",
      rhea: "RHEA:22336",
      reactome: "R-HSA-1614654",
      reversible: false,
      compartment: "cytosol",
      enzymes: ["enzyme:bhmt"]
    },
    relations: [
      { rel: "part-of", to: "pathway:methionine-cycle" },
      { rel: "part-of", to: "pathway:choline-oxidation" }
    ]
  },
  {
    id: "reaction:bhmt2-smm-homocysteine",
    type: "reaction",
    name: "BHMT2: S-methylmethionine + homocysteine -> 2 methionine",
    aliases: ["SMM + homocisteína → 2 metionina", "vitamina U", "S-metilmetionina"],
    summary: "BHMT2 methylates homocysteine with S-methylmethionine (plant vitamin U), giving two methionine; a minor remethylation route.",
    body: [
      "[[compound:s-methylmethionine]] + [[compound:homocysteine]] -> 2 [[compound:methionine]] + H+, by [[enzyme:bhmt2]]. A mammalian methionine S-methyltransferase that would regenerate S-methylmethionine is not well established, so this cycle depends on dietary intake (for example from cabbage, celery, tomato)."
    ],
    evidence: "plausible",
    facts: {
      ec: "2.1.1.10",
      rhea: "RHEA:26337",
      reactome: "R-HSA-5696838",
      compartment: "cytosol"
    },
    reaction: {
      reactants: [{ id: "compound:s-methylmethionine", n: 1 }, { id: "compound:homocysteine", n: 1 }],
      products: [{ id: "compound:methionine", n: 2 }, { id: "compound:proton", n: 1 }],
      ec: "2.1.1.10",
      rhea: "RHEA:26337",
      reactome: "R-HSA-5696838",
      reversible: false,
      compartment: "cytosol",
      enzymes: ["enzyme:bhmt2"]
    },
    relations: [
      { rel: "part-of", to: "pathway:methionine-cycle" },
      { rel: "interacts-with", to: "reaction:bhmt-betaine-homocysteine", note: "parallel homocysteine remethylation" }
    ]
  },
  {
    id: "reaction:mtr-methionine-synthase",
    type: "reaction",
    name: "MTR: 5-methyl-THF + homocysteine -> THF + methionine",
    aliases: ["5-MTHF + Hcy → THF + Met", "metionina sintase", "remetilação dependente de B12"],
    summary: "Cobalamin-dependent methyl transfer from 5-methyltetrahydrofolate to homocysteine; the only route that releases THF from 5-MTHF.",
    body: [
      "[[compound:5-methyl-thf]] + [[compound:homocysteine]] -> [[compound:thf]] + [[compound:methionine]], catalysed by [[enzyme:mtr]] through the cob(I)alamin/methylcobalamin cycle (net transfer shown; methylcobalamin is an enzyme-bound carrier, [[compound:vitamin-b12-methylcobalamin]]). The repository's one-carbon model lumps this step with folate regeneration (Rhea RHEA:11173 plus conversion back to 5,10-methylene-THF), so its lumped product differs from this single-reaction record."
    ],
    evidence: "established",
    facts: {
      ec: "2.1.1.13",
      rhea: "RHEA:11173",
      "rhea-master": "RHEA:11172",
      reactome: "R-HSA-3149539; R-HSA-174374",
      compartment: "cytosol",
      direction: "irreversible in vivo"
    },
    reaction: {
      reactants: [{ id: "compound:5-methyl-thf", n: 1 }, { id: "compound:homocysteine", n: 1 }],
      products: [{ id: "compound:thf", n: 1 }, { id: "compound:methionine", n: 1 }],
      ec: "2.1.1.13",
      rhea: "RHEA:11173",
      reactome: "R-HSA-3149539",
      reversible: false,
      compartment: "cytosol",
      enzymes: ["enzyme:mtr"]
    },
    relations: [
      { rel: "part-of", to: "pathway:methionine-cycle" },
      { rel: "part-of", to: "pathway:folate-cycle" }
    ]
  },
  {
    id: "reaction:mtrr-cobalamin-reactivation",
    type: "reaction",
    name: "MTRR: reductive methylation of cob(II)alamin by NADPH and SAM",
    aliases: ["reativação da metionina sintase", "cob(II)alamina → metilcobalamina", "MTRR + SAM"],
    summary: "Methionine synthase reductase reduces oxidised cob(II)alamin with NADPH and re-methylates it from SAM, restoring active methylcobalamin.",
    body: [
      "2 cob(II)alamin (bound to [[enzyme:mtr]]) + NADPH + 2 [[compound:sam]] -> 2 [[compound:vitamin-b12-methylcobalamin]] + 2 [[compound:sah]] + NADP+ + H+, catalysed by [[enzyme:mtrr]]. The two sequential steps (one-electron reduction to cob(I)alamin, then methyl transfer from SAM) are written as a net reaction. Rhea RHEA:23908 is this reaction written in the reverse direction."
    ],
    evidence: "established",
    facts: {
      ec: "1.16.1.8",
      rhea: "RHEA:23908",
      reactome: "R-HSA-3149518",
      compartment: "cytosol",
      direction: "irreversible (reductive methylation)"
    },
    reaction: {
      reactants: [{ id: "compound:cob-ii-alamin", n: 2 }, { id: "compound:nadph", n: 1 }, { id: "compound:sam", n: 2 }],
      products: [{ id: "compound:vitamin-b12-methylcobalamin", n: 2 }, { id: "compound:sah", n: 2 }, { id: "compound:nadp", n: 1 }, { id: "compound:proton", n: 1 }],
      ec: "1.16.1.8",
      rhea: "RHEA:23908",
      reactome: "R-HSA-3149518",
      reversible: false,
      compartment: "cytosol",
      enzymes: ["enzyme:mtrr"]
    },
    relations: [
      { rel: "part-of", to: "pathway:methionine-cycle" },
      { rel: "interacts-with", to: "reaction:mtr-methionine-synthase", note: "keeps the cobalamin cofactor active" }
    ]
  },
  {
    id: "reaction:mthfr-methylene-thf-reduction",
    type: "reaction",
    name: "MTHFR: 5,10-methylene-THF + NADPH + H+ -> 5-methyl-THF + NADP+",
    aliases: ["5,10-metileno-THF → 5-MTHF", "redução da metilenotetraidrofolato", "MTHFR"],
    summary: "FAD-dependent, effectively irreversible reduction of 5,10-methylene-THF to 5-methyl-THF, the methyl donor for homocysteine remethylation.",
    body: [
      "[[compound:5-10-methylene-thf]] + [[compound:nadph]] + H+ -> [[compound:5-methyl-thf]] + [[compound:nadp]], catalysed by [[enzyme:mthfr]] (Rhea master RHEA:19817 is written in the opposite, oxidative direction; RHEA:19819 is this physiological direction and is the id used by the repository's one-carbon model). SAM inhibits the enzyme allosterically."
    ],
    evidence: "established",
    facts: {
      ec: "1.5.1.53",
      rhea: "RHEA:19819",
      "rhea-master": "RHEA:19817",
      reactome: "R-HSA-200676",
      compartment: "cytosol",
      direction: "irreversible (reductive)"
    },
    reaction: {
      reactants: [{ id: "compound:5-10-methylene-thf", n: 1 }, { id: "compound:nadph", n: 1 }, { id: "compound:proton", n: 1 }],
      products: [{ id: "compound:5-methyl-thf", n: 1 }, { id: "compound:nadp", n: 1 }],
      ec: "1.5.1.53",
      rhea: "RHEA:19819",
      reactome: "R-HSA-200676",
      reversible: false,
      compartment: "cytosol",
      enzymes: ["enzyme:mthfr"]
    },
    relations: [
      { rel: "part-of", to: "pathway:folate-cycle" },
      { rel: "part-of", to: "pathway:methionine-cycle" }
    ]
  },
  {
    id: "reaction:mat-sam-synthesis",
    type: "reaction",
    name: "MAT: methionine + ATP + H2O -> SAM + phosphate + pyrophosphate",
    aliases: ["Met + ATP → SAMe", "síntese de S-adenosilmetionina", "metionina adenosiltransferase"],
    summary: "Methionine adenosyltransferase builds SAM by transferring the adenosyl group of ATP to methionine's sulfur, releasing triphosphate as Pi and PPi.",
    body: [
      "[[compound:methionine]] + [[compound:atp]] + [[compound:water]] -> [[compound:sam]] + [[compound:phosphate]] + [[compound:pyrophosphate]]. Catalysed by [[enzyme:mat1a]] (liver) and [[enzyme:mat2a]] (other tissues), which require Mg2+ ([[compound:magnesium]]) and K+. Hydrolysis of the tripolyphosphate intermediate makes the reaction essentially irreversible."
    ],
    evidence: "established",
    facts: {
      ec: "2.5.1.6",
      rhea: "RHEA:21080",
      reactome: "R-HSA-174391",
      compartment: "cytosol",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:methionine", n: 1 }, { id: "compound:atp", n: 1 }, { id: "compound:water", n: 1 }],
      products: [{ id: "compound:sam", n: 1 }, { id: "compound:phosphate", n: 1 }, { id: "compound:pyrophosphate", n: 1 }],
      ec: "2.5.1.6",
      rhea: "RHEA:21080",
      reactome: "R-HSA-174391",
      reversible: false,
      compartment: "cytosol",
      enzymes: ["enzyme:mat1a", "enzyme:mat2a"]
    },
    relations: [
      { rel: "part-of", to: "pathway:methionine-cycle" },
      { rel: "part-of", to: "pathway:methyl-budget", note: "supply side of the methyl budget" }
    ]
  },
  {
    id: "reaction:ahcy-sah-hydrolysis",
    type: "reaction",
    name: "AHCY: SAH + H2O <-> homocysteine + adenosine",
    aliases: ["SAH → Hcy + adenosina", "hidrólise da S-adenosil-homocisteína"],
    summary: "Reversible hydrolysis of SAH to homocysteine and adenosine; equilibrium favours SAH, so it runs forward only while products are cleared.",
    body: [
      "[[compound:sah]] + [[compound:water]] <-> [[compound:homocysteine]] + [[compound:adenosine]] by [[enzyme:ahcy]]. Removal of homocysteine ([[reaction:mtr-methionine-synthase]], [[reaction:bhmt-betaine-homocysteine]], [[reaction:cbs-cystathionine-synthesis]]) and adenosine (adenosine kinase, deaminase) pulls the reaction forward. When homocysteine rises, SAH accumulates and lowers the SAM:SAH ratio (methylation index; [[pathway:methyl-budget]])."
    ],
    evidence: "established",
    facts: {
      ec: "3.13.2.1",
      rhea: "RHEA:21708",
      reactome: "R-HSA-174401",
      compartment: "cytosol",
      direction: "reversible; equilibrium towards SAH"
    },
    reaction: {
      reactants: [{ id: "compound:sah", n: 1 }, { id: "compound:water", n: 1 }],
      products: [{ id: "compound:homocysteine", n: 1 }, { id: "compound:adenosine", n: 1 }],
      ec: "3.13.2.1",
      rhea: "RHEA:21708",
      reactome: "R-HSA-174401",
      reversible: true,
      compartment: "cytosol",
      enzymes: ["enzyme:ahcy"]
    },
    relations: [
      { rel: "part-of", to: "pathway:methionine-cycle" },
      { rel: "part-of", to: "pathway:methyl-budget", note: "determines SAM:SAH methylation index" }
    ]
  },
  {
    id: "reaction:hnmt-histamine-methylation",
    type: "reaction",
    name: "HNMT: histamine + SAM -> N-tau-methylhistamine + SAH",
    aliases: ["histamina + SAM → metilistamina + SAH", "inativação intracelular da histamina"],
    summary: "SAM-dependent methylation of the histamine imidazole ring; the intracellular inactivation step and the only route in brain and airway.",
    body: [
      "[[compound:histamine]] + [[compound:sam]] -> [[compound:methylhistamine]] + [[compound:sah]] + H+ by [[enzyme:hnmt]]. The product is further oxidised by monoamine oxidase B and an aldehyde dehydrogenase to methylimidazoleacetic acid. Competes for SAM with other methyltransferases ([[pathway:methyl-budget]])."
    ],
    evidence: "established",
    facts: {
      ec: "2.1.1.8",
      rhea: "RHEA:19301",
      reactome: "R-HSA-175993",
      compartment: "cytosol",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:histamine", n: 1 }, { id: "compound:sam", n: 1 }],
      products: [{ id: "compound:methylhistamine", n: 1 }, { id: "compound:sah", n: 1 }, { id: "compound:proton", n: 1 }],
      ec: "2.1.1.8",
      rhea: "RHEA:19301",
      reactome: "R-HSA-175993",
      reversible: false,
      compartment: "cytosol",
      enzymes: ["enzyme:hnmt"]
    },
    relations: [
      { rel: "part-of", to: "pathway:histamine-degradation" },
      { rel: "part-of", to: "pathway:methyl-budget" }
    ]
  },
  {
    id: "reaction:gamt-creatine-synthesis",
    type: "reaction",
    name: "GAMT: guanidinoacetate + SAM -> creatine + SAH",
    aliases: ["guanidinoacetato + SAM → creatina + SAH", "metilação do GAA"],
    summary: "Second step of creatine biosynthesis; liver GAMT methylates guanidinoacetate with SAM, one of the biggest consumers of methyl groups.",
    body: [
      "[[compound:guanidinoacetate]] + [[compound:sam]] -> [[compound:creatine]] + [[compound:sah]] + H+, catalysed by [[enzyme:gamt]]. Follows [[reaction:agat-guanidinoacetate-synthesis]] in kidney. Dietary creatine reduces the flux; the relative size of this methyl sink versus PEMT is debated ([[pathway:methyl-budget]])."
    ],
    evidence: "established",
    facts: {
      ec: "2.1.1.2",
      rhea: "RHEA:10656",
      reactome: "R-HSA-71286",
      compartment: "cytosol",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:guanidinoacetate", n: 1 }, { id: "compound:sam", n: 1 }],
      products: [{ id: "compound:creatine", n: 1 }, { id: "compound:sah", n: 1 }, { id: "compound:proton", n: 1 }],
      ec: "2.1.1.2",
      rhea: "RHEA:10656",
      reactome: "R-HSA-71286",
      reversible: false,
      compartment: "cytosol",
      enzymes: ["enzyme:gamt"]
    },
    relations: [
      { rel: "part-of", to: "pathway:creatine-synthesis" },
      { rel: "part-of", to: "pathway:methyl-budget" }
    ]
  },
  {
    id: "reaction:agat-guanidinoacetate-synthesis",
    type: "reaction",
    name: "AGAT: arginine + glycine <-> guanidinoacetate + ornithine",
    aliases: ["arginina + glicina → guanidinoacetato + ornitina", "transamidinação", "primeiro passo da creatina"],
    summary: "Mitochondrial transfer of the arginine amidino group to glycine, forming guanidinoacetate; the glycine-consuming first step of creatine synthesis.",
    body: [
      "[[compound:arginine]] + [[compound:glycine]] <-> [[compound:guanidinoacetate]] + [[compound:ornithine]] by [[enzyme:gatm]], mainly in kidney. About one glycine is used per creatine made, so creatine synthesis is a continuous modest sink of glycine as well as methyl groups ([[pathway:creatine-synthesis]])."
    ],
    evidence: "established",
    facts: {
      ec: "2.1.4.1",
      rhea: "RHEA:13201",
      reactome: "R-HSA-71275",
      compartment: "mitochondrial intermembrane space",
      direction: "reversible in vitro; forward in vivo"
    },
    reaction: {
      reactants: [{ id: "compound:arginine", n: 1 }, { id: "compound:glycine", n: 1 }],
      products: [{ id: "compound:guanidinoacetate", n: 1 }, { id: "compound:ornithine", n: 1 }],
      ec: "2.1.4.1",
      rhea: "RHEA:13201",
      reactome: "R-HSA-71275",
      reversible: true,
      compartment: "mitochondrial intermembrane space",
      enzymes: ["enzyme:gatm"]
    },
    relations: [
      { rel: "part-of", to: "pathway:creatine-synthesis" },
      { rel: "interacts-with", to: "reaction:gamt-creatine-synthesis", note: "next step: methylation" }
    ]
  },
  {
    id: "reaction:comt-dopamine-methylation",
    type: "reaction",
    name: "COMT: dopamine + SAM -> 3-methoxytyramine + SAH",
    aliases: ["dopamina + SAM → 3-metoxitiramina + SAH", "metilação de catecóis", "COMT"],
    summary: "COMT methylates a catechol hydroxyl of dopamine with SAM; representative of catecholamine and catechol-oestrogen inactivation.",
    body: [
      "[[compound:dopamine]] + [[compound:sam]] -> 3-methoxytyramine ([[compound:3-methoxytyramine]]) + [[compound:sah]] + H+ by [[enzyme:comt]] with Mg2+. The same chemistry applies to noradrenaline, adrenaline, L-DOPA and catechol oestrogens (Rhea generic RHEA:17877)."
    ],
    evidence: "established",
    facts: {
      ec: "2.1.1.6",
      rhea: "RHEA:72255",
      reactome: "R-HSA-379387",
      compartment: "cytosol / plasma membrane",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:dopamine", n: 1 }, { id: "compound:sam", n: 1 }],
      products: [{ id: "compound:3-methoxytyramine", n: 1 }, { id: "compound:sah", n: 1 }, { id: "compound:proton", n: 1 }],
      ec: "2.1.1.6",
      rhea: "RHEA:72255",
      reactome: "R-HSA-379387",
      reversible: false,
      compartment: "cytosol",
      enzymes: ["enzyme:comt"]
    },
    relations: [
      { rel: "part-of", to: "pathway:methyl-budget" },
      { rel: "interacts-with", to: "reaction:hnmt-histamine-methylation", note: "both draw on the same SAM pool and are inhibited by SAH" }
    ]
  },

  // ------------------------------------------------------------------ transsulfuration
  {
    id: "reaction:cbs-cystathionine-synthesis",
    type: "reaction",
    name: "CBS: homocysteine + serine -> cystathionine + H2O",
    aliases: ["Hcy + serina → cistationina", "transsulfuração", "CBS"],
    summary: "PLP- and heme-dependent condensation of homocysteine with serine, the first and committing step of transsulfuration.",
    body: [
      "[[compound:homocysteine]] + [[compound:serine]] -> [[compound:cystathionine]] + [[compound:water]] by [[enzyme:cbs]] (cytosol; [[compound:plp]]). Activated by SAM, so high methionine/SAM routes homocysteine away from remethylation and towards cysteine and glutathione ([[pathway:transsulfuration]])."
    ],
    evidence: "established",
    facts: {
      ec: "4.2.1.22",
      rhea: "RHEA:10112",
      reactome: "R-HSA-1614524",
      compartment: "cytosol",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:homocysteine", n: 1 }, { id: "compound:serine", n: 1 }],
      products: [{ id: "compound:cystathionine", n: 1 }, { id: "compound:water", n: 1 }],
      ec: "4.2.1.22",
      rhea: "RHEA:10112",
      reactome: "R-HSA-1614524",
      reversible: false,
      compartment: "cytosol",
      enzymes: ["enzyme:cbs"]
    },
    relations: [
      { rel: "part-of", to: "pathway:transsulfuration" },
      { rel: "interacts-with", to: "reaction:mtr-methionine-synthase", note: "competes for homocysteine; SAM sets the partition" }
    ]
  },
  {
    id: "reaction:cth-cystathionine-cleavage",
    type: "reaction",
    name: "CTH: cystathionine + H2O -> cysteine + 2-oxobutanoate + NH3",
    aliases: ["cistationina → cisteína + α-cetobutirato + amônia", "gama-cistationase"],
    summary: "PLP-dependent gamma-elimination that releases cysteine, 2-oxobutanoate and ammonia from cystathionine.",
    body: [
      "[[compound:cystathionine]] + [[compound:water]] -> [[compound:cysteine]] + [[compound:2-oxobutanoate]] + [[compound:ammonia]] + H+ by [[enzyme:cth]] ([[compound:plp]]). Written with neutral ammonia, a proton appears on the product side (Rhea writes NH4+). The cysteine feeds [[reaction:gcl-gamma-glutamylcysteine-synthesis]] and taurine synthesis."
    ],
    evidence: "established",
    facts: {
      ec: "4.4.1.1",
      rhea: "RHEA:14005",
      reactome: "R-HSA-1614583",
      compartment: "cytosol",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:cystathionine", n: 1 }, { id: "compound:water", n: 1 }],
      products: [{ id: "compound:cysteine", n: 1 }, { id: "compound:2-oxobutanoate", n: 1 }, { id: "compound:ammonia", n: 1 }, { id: "compound:proton", n: 1 }],
      ec: "4.4.1.1",
      rhea: "RHEA:14005",
      reactome: "R-HSA-1614583",
      reversible: false,
      compartment: "cytosol",
      enzymes: ["enzyme:cth"]
    },
    relations: [
      { rel: "part-of", to: "pathway:transsulfuration" },
      { rel: "part-of", to: "pathway:glutathione-synthesis", note: "supplies cysteine" }
    ]
  },

  // ------------------------------------------------------------------ folate / glycine
  {
    id: "reaction:shmt-serine-glycine-interconversion",
    type: "reaction",
    name: "SHMT: serine + THF <-> glycine + 5,10-methylene-THF + H2O",
    aliases: ["serina + THF ⇌ glicina + 5,10-metileno-THF", "serina hidroximetiltransferase"],
    summary: "Reversible PLP-dependent transfer of the serine side-chain carbon to THF, linking serine, glycine and the folate one-carbon pool.",
    body: [
      "[[compound:serine]] + [[compound:thf]] <-> [[compound:glycine]] + [[compound:5-10-methylene-thf]] + [[compound:water]], by cytosolic [[enzyme:shmt1]] and mitochondrial [[enzyme:shmt2]] ([[compound:plp]]). In mitochondria the net direction is usually serine breakdown (feeding one-carbon units to the cytosol as formate); in cytosol of liver and kidney it may run toward serine when glycine and methylene-THF are abundant. Rhea lists the serine-forming direction as the master record (RHEA:15481). Because the reverse reaction consumes glycine and 5,10-methylene-THF, a large glycine load could in principle compete with MTHFR for methylene-THF; the net effect in humans is not established."
    ],
    evidence: "established",
    facts: {
      ec: "2.1.2.1",
      rhea: "RHEA:15481",
      reactome: "R-HSA-200651",
      compartment: "cytosol; mitochondrial matrix",
      direction: "reversible"
    },
    reaction: {
      reactants: [{ id: "compound:serine", n: 1 }, { id: "compound:thf", n: 1 }],
      products: [{ id: "compound:glycine", n: 1 }, { id: "compound:5-10-methylene-thf", n: 1 }, { id: "compound:water", n: 1 }],
      ec: "2.1.2.1",
      rhea: "RHEA:15481",
      reactome: "R-HSA-200651",
      reversible: true,
      compartment: "cytosol; mitochondrial matrix",
      enzymes: ["enzyme:shmt1", "enzyme:shmt2"]
    },
    relations: [
      { rel: "part-of", to: "pathway:folate-cycle" },
      { rel: "part-of", to: "pathway:glycine-serine-route" }
    ]
  },
  {
    id: "reaction:glycine-cleavage-system",
    type: "reaction",
    name: "Glycine cleavage system: glycine + THF + NAD+ -> 5,10-methylene-THF + CO2 + NH3 + NADH + H+",
    aliases: ["GCS", "clivagem da glicina", "glicina + THF + NAD+ → CH2-THF + CO2 + NH3 + NADH", "glicina descarboxilase mitocondrial"],
    summary: "Mitochondrial four-protein system that oxidatively cleaves glycine to CO2, ammonia and a methylene-THF one-carbon unit, reducing NAD+.",
    body: [
      "Net: [[compound:glycine]] + [[compound:thf]] + [[compound:nad]] -> [[compound:5-10-methylene-thf]] + [[compound:carbon-dioxide]] + [[compound:ammonia]] + [[compound:nadh]] + H+. Sequence: [[enzyme:gldc]] decarboxylates glycine onto the lipoyl arm of [[enzyme:gcsh]] (Rhea RHEA:24304), [[enzyme:amt]] transfers the methylene to THF and releases NH3 (RHEA:16945), and [[enzyme:dld]] re-oxidises dihydrolipoamide with NAD+ (RHEA:15045). It is the main glycine-catabolic route in liver, and it needs both folate (THF) and B6 (PLP in GLDC)."
    ],
    evidence: "established",
    facts: {
      ec: "1.4.4.2; 2.1.2.10; 1.8.1.4",
      rhea: "RHEA:24304; RHEA:16945; RHEA:15045",
      reactome: "R-HSA-5693967; R-HSA-5693977",
      compartment: "mitochondrial matrix",
      direction: "reversible in principle (glycine synthase direction in some organisms); catabolic in humans"
    },
    reaction: {
      reactants: [{ id: "compound:glycine", n: 1 }, { id: "compound:thf", n: 1 }, { id: "compound:nad", n: 1 }],
      products: [{ id: "compound:5-10-methylene-thf", n: 1 }, { id: "compound:carbon-dioxide", n: 1 }, { id: "compound:ammonia", n: 1 }, { id: "compound:nadh", n: 1 }, { id: "compound:proton", n: 1 }],
      ec: "1.4.4.2",
      reactome: "R-HSA-5693967",
      reversible: false,
      compartment: "mitochondrial matrix",
      enzymes: ["enzyme:gldc", "enzyme:amt", "enzyme:gcsh", "enzyme:dld"]
    },
    relations: [
      { rel: "part-of", to: "pathway:glycine-cleavage" },
      { rel: "part-of", to: "pathway:folate-cycle", note: "source of mitochondrial methylene-THF" },
      { rel: "interacts-with", to: "reaction:shmt-serine-glycine-interconversion", note: "alternative glycine fates" }
    ]
  },
  {
    id: "reaction:mthfd1-methylene-thf-oxidation",
    type: "reaction",
    name: "MTHFD1 dehydrogenase: 5,10-methylene-THF + NADP+ <-> 5,10-methenyl-THF + NADPH",
    aliases: ["metileno-THF desidrogenase", "5,10-CH2-THF → 5,10-CH=THF"],
    summary: "NADP+-dependent oxidation of 5,10-methylene-THF to 5,10-methenyl-THF by the dehydrogenase domain of MTHFD1.",
    body: [
      "[[compound:5-10-methylene-thf]] + [[compound:nadp]] <-> [[compound:5-10-methenyl-thf]] + [[compound:nadph]] by [[enzyme:mthfd1]]. First of the three activities that convert methylene-THF to formyl-THF; fully reversible, so cytosolic one-carbon flux can run toward 10-formyl-THF (purines) or back to methylene-THF."
    ],
    evidence: "established",
    facts: {
      ec: "1.5.1.5",
      rhea: "RHEA:22812",
      reactome: "R-HSA-200661",
      compartment: "cytosol"
    },
    reaction: {
      reactants: [{ id: "compound:5-10-methylene-thf", n: 1 }, { id: "compound:nadp", n: 1 }],
      products: [{ id: "compound:5-10-methenyl-thf", n: 1 }, { id: "compound:nadph", n: 1 }],
      ec: "1.5.1.5",
      rhea: "RHEA:22812",
      reactome: "R-HSA-200661",
      reversible: true,
      compartment: "cytosol",
      enzymes: ["enzyme:mthfd1"]
    },
    relations: [
      { rel: "part-of", to: "pathway:folate-cycle" },
      { rel: "interacts-with", to: "reaction:mthfd1-methenyl-thf-cyclohydrolase", note: "next step" }
    ]
  },
  {
    id: "reaction:mthfd1-methenyl-thf-cyclohydrolase",
    type: "reaction",
    name: "MTHFD1 cyclohydrolase: 5,10-methenyl-THF + H2O <-> 10-formyl-THF + H+",
    aliases: ["metenil-THF ciclo-hidrolase", "formação de 10-formil-THF"],
    summary: "Hydrolytic ring opening of 5,10-methenyl-THF to 10-formyl-THF, the one-carbon donor for purine synthesis.",
    body: [
      "[[compound:5-10-methenyl-thf]] + [[compound:water]] <-> [[compound:10-formyl-thf]] + H+, catalysed by the cyclohydrolase domain of [[enzyme:mthfd1]]. Together with [[reaction:mthfd1-methylene-thf-oxidation]] it forms the oxidative arm that feeds purine biosynthesis."
    ],
    evidence: "established",
    facts: {
      ec: "3.5.4.9",
      rhea: "RHEA:23700",
      reactome: "R-HSA-200661",
      compartment: "cytosol"
    },
    reaction: {
      reactants: [{ id: "compound:5-10-methenyl-thf", n: 1 }, { id: "compound:water", n: 1 }],
      products: [{ id: "compound:10-formyl-thf", n: 1 }, { id: "compound:proton", n: 1 }],
      ec: "3.5.4.9",
      rhea: "RHEA:23700",
      reactome: "R-HSA-200661",
      reversible: true,
      compartment: "cytosol",
      enzymes: ["enzyme:mthfd1"]
    },
    relations: [
      { rel: "part-of", to: "pathway:folate-cycle" },
      { rel: "interacts-with", to: "reaction:mthfd1-formate-thf-ligase", note: "alternative entry of formate into 10-formyl-THF" }
    ]
  },
  {
    id: "reaction:mthfd1-formate-thf-ligase",
    type: "reaction",
    name: "MTHFD1 synthetase: THF + formate + ATP <-> 10-formyl-THF + ADP + phosphate",
    aliases: ["formil-THF sintetase", "assimilação de formato", "THF + formato + ATP"],
    summary: "ATP-driven ligation of formate to THF, giving 10-formyl-THF; the route by which mitochondrial formate re-enters cytosolic folate metabolism.",
    body: [
      "[[compound:thf]] + [[compound:formate]] + [[compound:atp]] <-> [[compound:10-formyl-thf]] + [[compound:adp]] + [[compound:phosphate]] by the synthetase domain of [[enzyme:mthfd1]]. Formate is generated in mitochondria from serine via [[enzyme:shmt2]] and exported to the cytosol."
    ],
    evidence: "established",
    facts: {
      ec: "6.3.4.3",
      rhea: "RHEA:20221",
      compartment: "cytosol"
    },
    reaction: {
      reactants: [{ id: "compound:thf", n: 1 }, { id: "compound:formate", n: 1 }, { id: "compound:atp", n: 1 }],
      products: [{ id: "compound:10-formyl-thf", n: 1 }, { id: "compound:adp", n: 1 }, { id: "compound:phosphate", n: 1 }],
      ec: "6.3.4.3",
      rhea: "RHEA:20221",
      reversible: true,
      compartment: "cytosol",
      enzymes: ["enzyme:mthfd1"]
    },
    relations: [
      { rel: "part-of", to: "pathway:folate-cycle" },
      { rel: "interacts-with", to: "reaction:shmt-serine-glycine-interconversion", note: "mitochondrial SHMT2 is the main formate source" }
    ]
  },

  // ------------------------------------------------------------------ choline oxidation
  {
    id: "reaction:dmgdh-dimethylglycine-demethylation",
    type: "reaction",
    name: "DMGDH: dimethylglycine + THF + ETF(ox) -> sarcosine + 5,10-methylene-THF + ETF(red)",
    aliases: ["DMG → sarcosina", "demetilação da dimetilglicina", "segundo metil da betaína"],
    summary: "Oxidative demethylation of dimethylglycine to sarcosine; the removed carbon is trapped as 5,10-methylene-THF and electrons go to ETF.",
    body: [
      "[[compound:dimethylglycine]] + [[compound:thf]] + oxidised ETF -> [[compound:sarcosine]] + [[compound:5-10-methylene-thf]] + reduced ETF, by mitochondrial [[enzyme:dmgdh]]. The ETF pair is [[compound:etf-oxidized]] / [[compound:etf-reduced]] (reduced ETF = oxidised ETF + 2H, here written without a separate proton). Reactome R-HSA-6797653 depicts FAD/FADH2 in place of ETF."
    ],
    evidence: "established",
    facts: {
      ec: "1.5.8.4",
      rhea: "RHEA:52856",
      reactome: "R-HSA-6797653",
      compartment: "mitochondrial matrix",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:dimethylglycine", n: 1 }, { id: "compound:thf", n: 1 }, { id: "compound:etf-oxidized", n: 1 }],
      products: [{ id: "compound:sarcosine", n: 1 }, { id: "compound:5-10-methylene-thf", n: 1 }, { id: "compound:etf-reduced", n: 1 }],
      ec: "1.5.8.4",
      rhea: "RHEA:52856",
      reactome: "R-HSA-6797653",
      reversible: false,
      compartment: "mitochondrial matrix",
      enzymes: ["enzyme:dmgdh"]
    },
    relations: [
      { rel: "part-of", to: "pathway:choline-oxidation" },
      { rel: "part-of", to: "pathway:glycine-serine-route" }
    ]
  },
  {
    id: "reaction:sardh-sarcosine-demethylation",
    type: "reaction",
    name: "SARDH: sarcosine + THF + ETF(ox) -> glycine + 5,10-methylene-THF + ETF(red)",
    aliases: ["sarcosina → glicina", "demetilação da sarcosina", "terceiro metil da betaína"],
    summary: "Last demethylation of the betaine route: sarcosine becomes glycine and its methyl carbon becomes 5,10-methylene-THF.",
    body: [
      "[[compound:sarcosine]] + [[compound:thf]] + [[compound:etf-oxidized]] -> [[compound:glycine]] + [[compound:5-10-methylene-thf]] + [[compound:etf-reduced]], catalysed by [[enzyme:sardh]]. Handles sarcosine from both the betaine route and [[reaction:gnmt-glycine-methylation]], returning glycine intracellularly in the mitochondrion. This intracellular glycine is the origin of the conversation's 'clean' glycine from choline."
    ],
    evidence: "established",
    facts: {
      ec: "1.5.8.3",
      rhea: "RHEA:19793",
      reactome: "R-HSA-6797913",
      compartment: "mitochondrial matrix",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:sarcosine", n: 1 }, { id: "compound:thf", n: 1 }, { id: "compound:etf-oxidized", n: 1 }],
      products: [{ id: "compound:glycine", n: 1 }, { id: "compound:5-10-methylene-thf", n: 1 }, { id: "compound:etf-reduced", n: 1 }],
      ec: "1.5.8.3",
      rhea: "RHEA:19793",
      reactome: "R-HSA-6797913",
      reversible: false,
      compartment: "mitochondrial matrix",
      enzymes: ["enzyme:sardh"]
    },
    relations: [
      { rel: "part-of", to: "pathway:choline-oxidation" },
      { rel: "part-of", to: "pathway:glycine-serine-route" }
    ]
  },
  {
    id: "reaction:chdh-choline-oxidation",
    type: "reaction",
    name: "CHDH: choline + acceptor -> betaine aldehyde + reduced acceptor",
    aliases: ["colina → betaína aldeído", "oxidação da colina", "colina desidrogenase"],
    summary: "Mitochondrial dehydrogenation of choline to betaine aldehyde, the first step of the choline-to-betaine route.",
    body: [
      "[[compound:choline]] + hydrogen acceptor -> [[compound:betaine-aldehyde]] + reduced acceptor, catalysed by the inner-membrane [[enzyme:chdh]]. The physiological electron acceptor is not firmly known; Rhea and Reactome use a generic acceptor A/AH2 (here [[compound:hydrogen-acceptor]] / [[compound:hydrogen-acceptor-reduced]], reduced form = acceptor + 2H)."
    ],
    evidence: "established",
    facts: {
      ec: "1.1.99.1",
      rhea: "RHEA:17433",
      reactome: "R-HSA-6797961",
      compartment: "mitochondrial inner membrane / matrix",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:choline", n: 1 }, { id: "compound:hydrogen-acceptor", n: 1 }],
      products: [{ id: "compound:betaine-aldehyde", n: 1 }, { id: "compound:hydrogen-acceptor-reduced", n: 1 }],
      ec: "1.1.99.1",
      rhea: "RHEA:17433",
      reactome: "R-HSA-6797961",
      reversible: false,
      compartment: "mitochondrial matrix",
      enzymes: ["enzyme:chdh"]
    },
    relations: [
      { rel: "part-of", to: "pathway:choline-oxidation" },
      { rel: "interacts-with", to: "reaction:choline-kinase-phosphocholine", note: "competes for free choline" }
    ]
  },
  {
    id: "reaction:badh-betaine-aldehyde-oxidation",
    type: "reaction",
    name: "BADH: betaine aldehyde + NAD+ + H2O -> betaine + NADH + 2 H+",
    aliases: ["betaína aldeído → betaína", "BADH", "TMG a partir de colina"],
    summary: "NAD+-dependent oxidation of betaine aldehyde to betaine (trimethylglycine), the second step of choline oxidation.",
    body: [
      "[[compound:betaine-aldehyde]] + [[compound:nad]] + [[compound:water]] -> [[compound:betaine]] + [[compound:nadh]] + 2 H+, by [[enzyme:aldh7a1]] (paralogue ALDH9A1 also active). The betaine formed is the BHMT methyl donor ([[reaction:bhmt-betaine-homocysteine]])."
    ],
    evidence: "established",
    facts: {
      ec: "1.2.1.8",
      rhea: "RHEA:15305",
      reactome: "R-HSA-6797955",
      compartment: "mitochondrion; cytosol",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:betaine-aldehyde", n: 1 }, { id: "compound:nad", n: 1 }, { id: "compound:water", n: 1 }],
      products: [{ id: "compound:betaine", n: 1 }, { id: "compound:nadh", n: 1 }, { id: "compound:proton", n: 2 }],
      ec: "1.2.1.8",
      rhea: "RHEA:15305",
      reactome: "R-HSA-6797955",
      reversible: false,
      compartment: "mitochondrion; cytosol",
      enzymes: ["enzyme:aldh7a1"]
    },
    relations: [
      { rel: "part-of", to: "pathway:choline-oxidation" },
      { rel: "interacts-with", to: "reaction:bhmt-betaine-homocysteine", note: "betaine product is the BHMT methyl donor" }
    ]
  },

  // ------------------------------------------------------------------ serine route
  {
    id: "reaction:phgdh-3pg-oxidation",
    type: "reaction",
    name: "PHGDH: 3-phosphoglycerate + NAD+ <-> 3-phosphohydroxypyruvate + NADH + H+",
    aliases: ["3-fosfoglicerato → 3-fosfo-hidroxipiruvato", "primeiro passo da síntese de serina"],
    summary: "NAD+-dependent oxidation of the glycolytic intermediate 3-phosphoglycerate, the first committed step of serine biosynthesis.",
    body: [
      "[[compound:3-phosphoglycerate]] + [[compound:nad]] <-> [[compound:3-phosphohydroxypyruvate]] + [[compound:nadh]] + H+ by [[enzyme:phgdh]]. The equilibrium is unfavourable and is pulled forward by the subsequent transamination and irreversible dephosphorylation ([[reaction:psat1-phosphoserine-transamination]], [[reaction:psph-phosphoserine-hydrolysis]])."
    ],
    evidence: "established",
    facts: {
      ec: "1.1.1.95",
      rhea: "RHEA:12641",
      reactome: "R-HSA-977348",
      compartment: "cytosol",
      direction: "reversible; pulled forward"
    },
    reaction: {
      reactants: [{ id: "compound:3-phosphoglycerate", n: 1 }, { id: "compound:nad", n: 1 }],
      products: [{ id: "compound:3-phosphohydroxypyruvate", n: 1 }, { id: "compound:nadh", n: 1 }, { id: "compound:proton", n: 1 }],
      ec: "1.1.1.95",
      rhea: "RHEA:12641",
      reactome: "R-HSA-977348",
      reversible: true,
      compartment: "cytosol",
      enzymes: ["enzyme:phgdh"]
    },
    relations: [
      { rel: "part-of", to: "pathway:glycine-serine-route" },
      { rel: "interacts-with", to: "reaction:psat1-phosphoserine-transamination", note: "next step" }
    ]
  },
  {
    id: "reaction:psat1-phosphoserine-transamination",
    type: "reaction",
    name: "PSAT1: 3-phosphohydroxypyruvate + glutamate <-> 3-phosphoserine + 2-oxoglutarate",
    aliases: ["transaminação do fosfo-hidroxipiruvato", "fosfoserina aminotransferase"],
    summary: "PLP-dependent transamination converting 3-phosphohydroxypyruvate to 3-phosphoserine using glutamate as amino donor.",
    body: [
      "[[compound:3-phosphohydroxypyruvate]] + [[compound:glutamate]] <-> [[compound:3-phosphoserine]] + [[compound:2-oxoglutarate]] by [[enzyme:psat1]] ([[compound:plp]]). The Rhea master record (RHEA:14329) is written in the opposite direction (phosphoserine to the keto acid); the biosynthetic direction is shown here."
    ],
    evidence: "established",
    facts: {
      ec: "2.6.1.52",
      rhea: "RHEA:14329",
      compartment: "cytosol",
      direction: "reversible"
    },
    reaction: {
      reactants: [{ id: "compound:3-phosphohydroxypyruvate", n: 1 }, { id: "compound:glutamate", n: 1 }],
      products: [{ id: "compound:3-phosphoserine", n: 1 }, { id: "compound:2-oxoglutarate", n: 1 }],
      ec: "2.6.1.52",
      rhea: "RHEA:14329",
      reversible: true,
      compartment: "cytosol",
      enzymes: ["enzyme:psat1"]
    },
    relations: [
      { rel: "part-of", to: "pathway:glycine-serine-route" },
      { rel: "interacts-with", to: "reaction:psph-phosphoserine-hydrolysis", note: "next step" }
    ]
  },
  {
    id: "reaction:psph-phosphoserine-hydrolysis",
    type: "reaction",
    name: "PSPH: 3-phosphoserine + H2O -> serine + phosphate",
    aliases: ["fosfoserina → serina", "última etapa da síntese de serina"],
    summary: "Irreversible dephosphorylation of 3-phosphoserine, releasing serine.",
    body: [
      "[[compound:3-phosphoserine]] + [[compound:water]] -> [[compound:serine]] + [[compound:phosphate]] by [[enzyme:psph]] (Mg2+). Serine then enters protein, phospholipid, or glycine/one-carbon metabolism via [[reaction:shmt-serine-glycine-interconversion]]."
    ],
    evidence: "established",
    facts: {
      ec: "3.1.3.3",
      rhea: "RHEA:21208",
      compartment: "cytosol",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:3-phosphoserine", n: 1 }, { id: "compound:water", n: 1 }],
      products: [{ id: "compound:serine", n: 1 }, { id: "compound:phosphate", n: 1 }],
      ec: "3.1.3.3",
      rhea: "RHEA:21208",
      reversible: false,
      compartment: "cytosol",
      enzymes: ["enzyme:psph"]
    },
    relations: [
      { rel: "part-of", to: "pathway:glycine-serine-route" },
      { rel: "interacts-with", to: "reaction:shmt-serine-glycine-interconversion", note: "serine feeds glycine synthesis" }
    ]
  },

  // ------------------------------------------------------------------ Kennedy pathway
  {
    id: "reaction:choline-kinase-phosphocholine",
    type: "reaction",
    name: "Choline kinase: choline + ATP -> phosphocholine + ADP + H+",
    aliases: ["colina + ATP → fosfocolina + ADP", "fosforilação da colina", "Kennedy passo 1"],
    summary: "First step of the CDP-choline (Kennedy) pathway: ATP-dependent phosphorylation of choline.",
    body: [
      "[[compound:choline]] + [[compound:atp]] -> [[compound:phosphocholine]] + [[compound:adp]] + H+ by [[enzyme:choline-kinase]]. Traps choline in the cell and commits it to PC synthesis ([[pathway:kennedy-pathway]]); competes with oxidation ([[reaction:chdh-choline-oxidation]]) and acetylation ([[reaction:chat-acetylcholine-synthesis]])."
    ],
    evidence: "established",
    facts: {
      ec: "2.7.1.32",
      rhea: "RHEA:12837",
      compartment: "cytosol",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:choline", n: 1 }, { id: "compound:atp", n: 1 }],
      products: [{ id: "compound:phosphocholine", n: 1 }, { id: "compound:adp", n: 1 }, { id: "compound:proton", n: 1 }],
      ec: "2.7.1.32",
      rhea: "RHEA:12837",
      reversible: false,
      compartment: "cytosol",
      enzymes: ["enzyme:choline-kinase"]
    },
    relations: [
      { rel: "part-of", to: "pathway:kennedy-pathway" },
      { rel: "interacts-with", to: "reaction:chdh-choline-oxidation", note: "competition for free choline" }
    ]
  },
  {
    id: "reaction:pcyt1a-cdp-choline-synthesis",
    type: "reaction",
    name: "PCYT1A: phosphocholine + CTP + H+ -> CDP-choline + pyrophosphate",
    aliases: ["fosfocolina + CTP → CDP-colina + PPi", "citicolina endógena", "CCT"],
    summary: "Rate-regulating step of the Kennedy pathway: cytidylyl transfer from CTP to phosphocholine, producing CDP-choline (citicoline).",
    body: [
      "[[compound:phosphocholine]] + [[compound:ctp]] + H+ -> [[compound:cdp-choline]] + [[compound:pyrophosphate]] by [[enzyme:pcyt1a]]. CDP-choline is chemically the same molecule sold as the supplement citicoline; oral citicoline is hydrolysed to cytidine and choline in the gut and re-synthesised in tissues."
    ],
    evidence: "established",
    facts: {
      ec: "2.7.7.15",
      rhea: "RHEA:18997",
      reactome: "R-HSA-1483081",
      compartment: "nucleus / endoplasmic reticulum",
      direction: "reversible in vitro, forward in vivo"
    },
    reaction: {
      reactants: [{ id: "compound:phosphocholine", n: 1 }, { id: "compound:ctp", n: 1 }, { id: "compound:proton", n: 1 }],
      products: [{ id: "compound:cdp-choline", n: 1 }, { id: "compound:pyrophosphate", n: 1 }],
      ec: "2.7.7.15",
      rhea: "RHEA:18997",
      reactome: "R-HSA-1483081",
      reversible: false,
      compartment: "nucleus / endoplasmic reticulum",
      enzymes: ["enzyme:pcyt1a"]
    },
    relations: [
      { rel: "part-of", to: "pathway:kennedy-pathway", note: "rate-regulating step" },
      { rel: "interacts-with", to: "reaction:choline-kinase-phosphocholine", note: "previous step" }
    ]
  },
  {
    id: "reaction:chpt1-cdp-choline-to-pc",
    type: "reaction",
    name: "CHPT1/CEPT1: CDP-choline + diacylglycerol -> phosphatidylcholine + CMP + H+",
    aliases: ["CDP-colina + DAG → fosfatidilcolina", "Kennedy passo 3", "colinafosfotransferase"],
    summary: "Final Kennedy-pathway step: transfer of phosphocholine from CDP-choline to diacylglycerol, forming phosphatidylcholine.",
    body: [
      "[[compound:cdp-choline]] + [[compound:diacylglycerol]] -> [[compound:phosphatidylcholine]] + [[compound:cmp]] + H+ by [[enzyme:chpt1]] (Golgi) and [[enzyme:cept1]] (ER). Supplies most cellular PC; the PEMT route is an additional source in liver ([[reaction:pemt-pe-to-pc]])."
    ],
    evidence: "established",
    facts: {
      ec: "2.7.8.2",
      rhea: "RHEA:32939",
      reactome: "R-HSA-1482973; R-HSA-1482961",
      compartment: "Golgi; endoplasmic reticulum",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:cdp-choline", n: 1 }, { id: "compound:diacylglycerol", n: 1 }],
      products: [{ id: "compound:phosphatidylcholine", n: 1 }, { id: "compound:cmp", n: 1 }, { id: "compound:proton", n: 1 }],
      ec: "2.7.8.2",
      rhea: "RHEA:32939",
      reactome: "R-HSA-1482973",
      reversible: false,
      compartment: "Golgi; endoplasmic reticulum",
      enzymes: ["enzyme:chpt1", "enzyme:cept1"]
    },
    relations: [
      { rel: "part-of", to: "pathway:kennedy-pathway" },
      { rel: "interacts-with", to: "reaction:pemt-pe-to-pc", note: "parallel route to PC; PEMT costs 3 SAM" }
    ]
  },
  {
    id: "reaction:etnk1-ethanolamine-phosphorylation",
    type: "reaction",
    name: "ETNK1: ethanolamine + ATP -> phosphoethanolamine + ADP + H+",
    aliases: ["etanolamina + ATP → fosfoetanolamina", "Kennedy ramo PE passo 1"],
    summary: "ATP-dependent phosphorylation of ethanolamine, first step of the CDP-ethanolamine branch.",
    body: [
      "[[compound:ethanolamine]] + [[compound:atp]] -> [[compound:phosphoethanolamine]] + [[compound:adp]] + H+ by [[enzyme:etnk1]] (and the choline/ethanolamine kinases). Starts the branch that supplies PE, the PEMT substrate."
    ],
    evidence: "established",
    facts: {
      ec: "2.7.1.82",
      rhea: "RHEA:13069",
      compartment: "cytosol",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:ethanolamine", n: 1 }, { id: "compound:atp", n: 1 }],
      products: [{ id: "compound:phosphoethanolamine", n: 1 }, { id: "compound:adp", n: 1 }, { id: "compound:proton", n: 1 }],
      ec: "2.7.1.82",
      rhea: "RHEA:13069",
      reversible: false,
      compartment: "cytosol",
      enzymes: ["enzyme:etnk1"]
    },
    relations: [
      { rel: "part-of", to: "pathway:kennedy-pathway" },
      { rel: "interacts-with", to: "reaction:pcyt2-cdp-ethanolamine-synthesis", note: "next step" }
    ]
  },
  {
    id: "reaction:pcyt2-cdp-ethanolamine-synthesis",
    type: "reaction",
    name: "PCYT2: phosphoethanolamine + CTP + H+ -> CDP-ethanolamine + pyrophosphate",
    aliases: ["fosfoetanolamina + CTP → CDP-etanolamina", "Kennedy ramo PE passo 2"],
    summary: "Rate-limiting cytidylyl transfer of the CDP-ethanolamine branch.",
    body: [
      "[[compound:phosphoethanolamine]] + [[compound:ctp]] + H+ -> [[compound:cdp-ethanolamine]] + [[compound:pyrophosphate]] by [[enzyme:pcyt2]]."
    ],
    evidence: "established",
    facts: {
      ec: "2.7.7.14",
      rhea: "RHEA:24592",
      reactome: "R-HSA-1483190",
      compartment: "cytosol",
      direction: "reversible in vitro, forward in vivo"
    },
    reaction: {
      reactants: [{ id: "compound:phosphoethanolamine", n: 1 }, { id: "compound:ctp", n: 1 }, { id: "compound:proton", n: 1 }],
      products: [{ id: "compound:cdp-ethanolamine", n: 1 }, { id: "compound:pyrophosphate", n: 1 }],
      ec: "2.7.7.14",
      rhea: "RHEA:24592",
      reactome: "R-HSA-1483190",
      reversible: false,
      compartment: "cytosol",
      enzymes: ["enzyme:pcyt2"]
    },
    relations: [
      { rel: "part-of", to: "pathway:kennedy-pathway" },
      { rel: "interacts-with", to: "reaction:ept-cdp-ethanolamine-to-pe", note: "next step" }
    ]
  },
  {
    id: "reaction:ept-cdp-ethanolamine-to-pe",
    type: "reaction",
    name: "EPT1/CEPT1: CDP-ethanolamine + diacylglycerol -> phosphatidylethanolamine + CMP + H+",
    aliases: ["CDP-etanolamina + DAG → fosfatidiletanolamina", "Kennedy ramo PE passo 3"],
    summary: "Final step of the CDP-ethanolamine branch, making phosphatidylethanolamine, the PEMT substrate.",
    body: [
      "[[compound:cdp-ethanolamine]] + [[compound:diacylglycerol]] -> [[compound:phosphatidylethanolamine]] + [[compound:cmp]] + H+ by [[enzyme:selenoi]] and [[enzyme:cept1]]. PE is also produced by decarboxylation of phosphatidylserine in mitochondria."
    ],
    evidence: "established",
    facts: {
      ec: "2.7.8.1",
      rhea: "RHEA:32943",
      reactome: "R-HSA-1482962",
      compartment: "Golgi; endoplasmic reticulum",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:cdp-ethanolamine", n: 1 }, { id: "compound:diacylglycerol", n: 1 }],
      products: [{ id: "compound:phosphatidylethanolamine", n: 1 }, { id: "compound:cmp", n: 1 }, { id: "compound:proton", n: 1 }],
      ec: "2.7.8.1",
      rhea: "RHEA:32943",
      reactome: "R-HSA-1482962",
      reversible: false,
      compartment: "Golgi; endoplasmic reticulum",
      enzymes: ["enzyme:selenoi", "enzyme:cept1"]
    },
    relations: [
      { rel: "part-of", to: "pathway:kennedy-pathway" },
      { rel: "part-of", to: "pathway:pemt-pc-synthesis", note: "provides the PE substrate" }
    ]
  },

  // ------------------------------------------------------------------ bile acids
  {
    id: "reaction:bacs-cholate-coa-ligation",
    type: "reaction",
    name: "BACS: cholate + ATP + CoA -> choloyl-CoA + AMP + pyrophosphate",
    aliases: ["colato + ATP + CoA → colil-CoA", "ativação do ácido biliar"],
    summary: "ATP-dependent activation of cholate to its CoA thioester, prerequisite for amino-acid conjugation.",
    body: [
      "[[compound:cholate]] + [[compound:atp]] + [[compound:coa]] -> [[compound:choloyl-coa]] + [[compound:amp]] + [[compound:pyrophosphate]] by [[enzyme:slc27a5]] in the hepatocyte ER ([[pathway:bile-acid-conjugation]]). The same enzyme re-activates bile acids returned from the gut after bacterial deconjugation."
    ],
    evidence: "established",
    facts: {
      ec: "6.2.1.7",
      rhea: "RHEA:23532",
      reactome: "R-HSA-159425",
      compartment: "endoplasmic reticulum",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:cholate", n: 1 }, { id: "compound:atp", n: 1 }, { id: "compound:coa", n: 1 }],
      products: [{ id: "compound:choloyl-coa", n: 1 }, { id: "compound:amp", n: 1 }, { id: "compound:pyrophosphate", n: 1 }],
      ec: "6.2.1.7",
      rhea: "RHEA:23532",
      reactome: "R-HSA-159425",
      reversible: false,
      compartment: "endoplasmic reticulum",
      enzymes: ["enzyme:slc27a5"]
    },
    relations: [
      { rel: "part-of", to: "pathway:bile-acid-conjugation" },
      { rel: "associated-with", to: "system:bile" }
    ]
  },
  {
    id: "reaction:baat-glycine-conjugation",
    type: "reaction",
    name: "BAAT: choloyl-CoA + glycine -> glycocholate + CoA + H+",
    aliases: ["colil-CoA + glicina → glicocolato", "glicoconjugação biliar"],
    summary: "Amide-bond formation between choloyl-CoA and glycine, producing glycocholate; the dominant bile-acid conjugation in humans.",
    body: [
      "[[compound:choloyl-coa]] + [[compound:glycine]] -> [[compound:glycocholate]] + [[compound:coa]] + H+ by [[enzyme:baat]]. About three quarters of human conjugated bile acids are glycine conjugates. The conversation proposes that a glycine bolus enriches glycine over taurine conjugates and makes bile more irritant; this is conversation-only and unquantified."
    ],
    evidence: "established",
    facts: {
      ec: "2.3.1.65",
      rhea: "RHEA:14001",
      reactome: "R-HSA-192312",
      compartment: "peroxisome / cytosol",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:choloyl-coa", n: 1 }, { id: "compound:glycine", n: 1 }],
      products: [{ id: "compound:glycocholate", n: 1 }, { id: "compound:coa", n: 1 }, { id: "compound:proton", n: 1 }],
      ec: "2.3.1.65",
      rhea: "RHEA:14001",
      reactome: "R-HSA-192312",
      reversible: false,
      compartment: "peroxisome / cytosol",
      enzymes: ["enzyme:baat"]
    },
    relations: [
      { rel: "part-of", to: "pathway:bile-acid-conjugation" },
      { rel: "associated-with", to: "system:bile", note: "glycine conjugates dominate human bile" }
    ]
  },
  {
    id: "reaction:baat-taurine-conjugation",
    type: "reaction",
    name: "BAAT: choloyl-CoA + taurine -> taurocholate + CoA + H+",
    aliases: ["colil-CoA + taurina → taurocolato", "tauroconjugação biliar"],
    summary: "Amide-bond formation between choloyl-CoA and taurine, producing taurocholate; competes with glycine conjugation.",
    body: [
      "[[compound:choloyl-coa]] + [[compound:taurine]] -> [[compound:taurocholate]] + [[compound:coa]] + H+ by [[enzyme:baat]]. Taurine conjugation rises with taurine intake (taurine supplementation shifts the glycine:taurine ratio toward taurine conjugates)."
    ],
    evidence: "established",
    facts: {
      ec: "2.3.1.65",
      rhea: "RHEA:47100",
      reactome: "R-HSA-192312",
      compartment: "peroxisome / cytosol",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:choloyl-coa", n: 1 }, { id: "compound:taurine", n: 1 }],
      products: [{ id: "compound:taurocholate", n: 1 }, { id: "compound:coa", n: 1 }, { id: "compound:proton", n: 1 }],
      ec: "2.3.1.65",
      rhea: "RHEA:47100",
      reactome: "R-HSA-192312",
      reversible: false,
      compartment: "peroxisome / cytosol",
      enzymes: ["enzyme:baat"]
    },
    relations: [
      { rel: "part-of", to: "pathway:bile-acid-conjugation" },
      { rel: "interacts-with", to: "reaction:baat-glycine-conjugation", note: "alternative acceptor amino acid" }
    ]
  },
  {
    id: "reaction:bsh-glycocholate-deconjugation",
    type: "reaction",
    name: "Bacterial BSH: glycocholate + H2O -> cholate + glycine",
    aliases: ["desconjugação bacteriana", "glicocolato → colato + glicina", "BSH"],
    summary: "Gut-bacterial hydrolysis of glycine-conjugated bile acids, regenerating free bile acid and releasing free glycine in the lumen.",
    body: [
      "[[compound:glycocholate]] + [[compound:water]] -> [[compound:cholate]] + [[compound:glycine]] by bacterial [[enzyme:bile-salt-hydrolase]]. Occurs predominantly in the distal gut in health but proximally in bacterial overgrowth ([[disease:sibo]]), where it contributes to fat malabsorption and to a local pool of free glycine."
    ],
    evidence: "established",
    facts: {
      ec: "3.5.1.24",
      rhea: "RHEA:19353",
      compartment: "intestinal lumen (bacterial cytoplasm)",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:glycocholate", n: 1 }, { id: "compound:water", n: 1 }],
      products: [{ id: "compound:cholate", n: 1 }, { id: "compound:glycine", n: 1 }],
      ec: "3.5.1.24",
      rhea: "RHEA:19353",
      reversible: false,
      compartment: "intestinal lumen (bacterial cytoplasm)",
      enzymes: ["enzyme:bile-salt-hydrolase"]
    },
    relations: [
      { rel: "part-of", to: "pathway:bile-acid-conjugation", note: "reverses conjugation" },
      { rel: "part-of", to: "pathway:gut-bacterial-glycine-fates", note: "luminal source of free glycine" }
    ]
  },

  // ------------------------------------------------------------------ neurotransmitters
  {
    id: "reaction:gad-glutamate-decarboxylation",
    type: "reaction",
    name: "GAD: glutamate + H+ -> GABA + CO2",
    aliases: ["glutamato → GABA + CO2", "descarboxilação do glutamato", "GAD65/GAD67"],
    summary: "PLP-dependent alpha-decarboxylation of glutamate to GABA, converting the main excitatory transmitter into the main inhibitory one.",
    body: [
      "[[compound:glutamate]] + H+ -> [[compound:gaba]] + [[compound:carbon-dioxide]] by [[enzyme:gad1]] and [[enzyme:gad2]], both PLP-dependent ([[compound:plp]]). The reaction is irreversible; its rate in GABAergic neurons depends on PLP saturation of GAD65."
    ],
    evidence: "established",
    facts: {
      ec: "4.1.1.15",
      rhea: "RHEA:17785",
      reactome: "R-HSA-888577",
      compartment: "cytosol / synaptic vesicle membrane",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:glutamate", n: 1 }, { id: "compound:proton", n: 1 }],
      products: [{ id: "compound:gaba", n: 1 }, { id: "compound:carbon-dioxide", n: 1 }],
      ec: "4.1.1.15",
      rhea: "RHEA:17785",
      reactome: "R-HSA-888577",
      reversible: false,
      compartment: "cytosol",
      enzymes: ["enzyme:gad1", "enzyme:gad2"]
    },
    relations: [
      { rel: "part-of", to: "pathway:gaba-shunt" },
      { rel: "associated-with", to: "state:b6-functional-deficiency", note: "PLP-dependent; low PLP lowers GABA output" }
    ]
  },
  {
    id: "reaction:abat-gaba-transamination",
    type: "reaction",
    name: "ABAT: GABA + 2-oxoglutarate <-> succinic semialdehyde + glutamate",
    aliases: ["GABA-T", "transaminação do GABA"],
    summary: "PLP-dependent transamination of GABA with 2-oxoglutarate, regenerating glutamate and producing succinic semialdehyde.",
    body: [
      "[[compound:gaba]] + [[compound:2-oxoglutarate]] <-> [[compound:succinate-semialdehyde]] + [[compound:glutamate]] by mitochondrial [[enzyme:abat]]. Regenerates the glutamate consumed by [[reaction:gad-glutamate-decarboxylation]], closing the GABA shunt."
    ],
    evidence: "established",
    facts: {
      ec: "2.6.1.19",
      rhea: "RHEA:23352",
      reactome: "R-HSA-916855",
      compartment: "mitochondrial matrix",
      direction: "reversible"
    },
    reaction: {
      reactants: [{ id: "compound:gaba", n: 1 }, { id: "compound:2-oxoglutarate", n: 1 }],
      products: [{ id: "compound:succinate-semialdehyde", n: 1 }, { id: "compound:glutamate", n: 1 }],
      ec: "2.6.1.19",
      rhea: "RHEA:23352",
      reactome: "R-HSA-916855",
      reversible: true,
      compartment: "mitochondrial matrix",
      enzymes: ["enzyme:abat"]
    },
    relations: [
      { rel: "part-of", to: "pathway:gaba-shunt" },
      { rel: "interacts-with", to: "reaction:gad-glutamate-decarboxylation", note: "regenerates the glutamate used by GAD" }
    ]
  },
  {
    id: "reaction:aldh5a1-succinate-semialdehyde-oxidation",
    type: "reaction",
    name: "SSADH: succinic semialdehyde + NAD+ + H2O -> succinate + NADH + 2 H+",
    aliases: ["semialdeído succínico → succinato", "fim do shunt do GABA"],
    summary: "NAD+-dependent oxidation of succinic semialdehyde to succinate, returning GABA-derived carbon to the TCA cycle.",
    body: [
      "[[compound:succinate-semialdehyde]] + [[compound:nad]] + [[compound:water]] -> [[compound:succinate]] + [[compound:nadh]] + 2 H+ by [[enzyme:aldh5a1]]. Completes the GABA shunt that bypasses 2-oxoglutarate dehydrogenase and succinyl-CoA synthetase."
    ],
    evidence: "established",
    facts: {
      ec: "1.2.1.24",
      rhea: "RHEA:13217",
      reactome: "R-HSA-888548",
      compartment: "mitochondrial matrix",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:succinate-semialdehyde", n: 1 }, { id: "compound:nad", n: 1 }, { id: "compound:water", n: 1 }],
      products: [{ id: "compound:succinate", n: 1 }, { id: "compound:nadh", n: 1 }, { id: "compound:proton", n: 2 }],
      ec: "1.2.1.24",
      rhea: "RHEA:13217",
      reactome: "R-HSA-888548",
      reversible: false,
      compartment: "mitochondrial matrix",
      enzymes: ["enzyme:aldh5a1"]
    },
    relations: [
      { rel: "part-of", to: "pathway:gaba-shunt" },
      { rel: "interacts-with", to: "reaction:abat-gaba-transamination", note: "previous step" }
    ]
  },
  {
    id: "reaction:chat-acetylcholine-synthesis",
    type: "reaction",
    name: "ChAT: choline + acetyl-CoA -> acetylcholine + CoA",
    aliases: ["colina + acetil-CoA → acetilcolina + CoA", "síntese de acetilcolina"],
    summary: "Acetyl transfer from acetyl-CoA to choline in cholinergic neurons, producing the vagal transmitter acetylcholine.",
    body: [
      "[[compound:choline]] + [[compound:acetyl-coa]] -> [[compound:acetylcholine]] + [[compound:coa]] by [[enzyme:chat]]. Acetylcholine mediates vagal control of gastric motility, lower oesophageal sphincter tone, acid secretion and cardiac slowing via M2 receptors ([[system:vagal-tone]])."
    ],
    evidence: "established",
    facts: {
      ec: "2.3.1.6",
      rhea: "RHEA:18821",
      reactome: "R-HSA-264622",
      compartment: "cytosol (cholinergic terminals)",
      direction: "reversible in vitro, forward in vivo"
    },
    reaction: {
      reactants: [{ id: "compound:choline", n: 1 }, { id: "compound:acetyl-coa", n: 1 }],
      products: [{ id: "compound:acetylcholine", n: 1 }, { id: "compound:coa", n: 1 }],
      ec: "2.3.1.6",
      rhea: "RHEA:18821",
      reactome: "R-HSA-264622",
      reversible: true,
      compartment: "cytosol",
      enzymes: ["enzyme:chat"]
    },
    relations: [
      { rel: "part-of", to: "pathway:acetylcholine-synthesis" },
      { rel: "associated-with", to: "system:vagal-tone", note: "acetylcholine is the vagal transmitter" }
    ]
  },

  // ------------------------------------------------------------------ histamine
  {
    id: "reaction:dao-histamine-oxidation",
    type: "reaction",
    name: "DAO: histamine + O2 + H2O -> imidazole acetaldehyde + NH3 + H2O2",
    aliases: ["histamina + O2 → imidazol-acetaldeído + NH3 + H2O2", "desaminação oxidativa da histamina"],
    summary: "Oxidative deamination of histamine by diamine oxidase in the gut mucosa and kidney.",
    body: [
      "[[compound:histamine]] + [[compound:oxygen]] + [[compound:water]] -> [[compound:imidazole-acetaldehyde]] + [[compound:ammonia]] + [[compound:hydrogen-peroxide]] by [[enzyme:dao]] (copper/TPQ amine oxidase). The aldehyde is oxidised further to imidazoleacetic acid. Hydrogen peroxide and ammonia are by-products."
    ],
    evidence: "established",
    facts: {
      ec: "1.4.3.22",
      rhea: "RHEA:25625",
      reactome: "R-HSA-5696131",
      compartment: "extracellular / mucosal",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:histamine", n: 1 }, { id: "compound:oxygen", n: 1 }, { id: "compound:water", n: 1 }],
      products: [{ id: "compound:imidazole-acetaldehyde", n: 1 }, { id: "compound:ammonia", n: 1 }, { id: "compound:hydrogen-peroxide", n: 1 }],
      ec: "1.4.3.22",
      rhea: "RHEA:25625",
      reactome: "R-HSA-5696131",
      reversible: false,
      compartment: "extracellular / mucosal",
      enzymes: ["enzyme:dao"]
    },
    relations: [
      { rel: "part-of", to: "pathway:histamine-degradation" },
      { rel: "associated-with", to: "disease:histamine-intolerance", note: "low DAO activity is the proposed mechanism; contested" }
    ]
  },

  // ------------------------------------------------------------------ vitamin B6 activation
  {
    id: "reaction:pdxk-pyridoxal-phosphorylation",
    type: "reaction",
    name: "PDXK: pyridoxal + ATP -> pyridoxal 5'-phosphate (PLP) + ADP + H+",
    aliases: ["piridoxal + ATP → P5P + ADP", "fosforilação da B6"],
    summary: "ATP-dependent phosphorylation of pyridoxal to the active coenzyme PLP (P5P).",
    body: [
      "[[compound:pyridoxal]] + [[compound:atp]] -> [[compound:plp]] + [[compound:adp]] + H+ by [[enzyme:pdxk]]. Pyridoxine and pyridoxamine are phosphorylated by the same enzyme (RHEA:25104, RHEA:25108) and then oxidised to PLP by PNPO ([[reaction:pnpo-pnp-oxidation]]). Oral PLP is hydrolysed to pyridoxal in the gut and re-phosphorylated by this reaction in tissues."
    ],
    evidence: "established",
    facts: {
      ec: "2.7.1.35",
      rhea: "RHEA:10224",
      compartment: "cytosol",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:pyridoxal", n: 1 }, { id: "compound:atp", n: 1 }],
      products: [{ id: "compound:plp", n: 1 }, { id: "compound:adp", n: 1 }, { id: "compound:proton", n: 1 }],
      ec: "2.7.1.35",
      rhea: "RHEA:10224",
      reversible: false,
      compartment: "cytosol",
      enzymes: ["enzyme:pdxk"]
    },
    relations: [
      { rel: "part-of", to: "pathway:vitamin-b6-activation" },
      { rel: "associated-with", to: "state:b6-functional-deficiency", note: "kinase inhibition (theophylline, hydrazides) lowers PLP" }
    ]
  },
  {
    id: "reaction:pnpo-pnp-oxidation",
    type: "reaction",
    name: "PNPO: pyridoxine 5'-phosphate + O2 -> PLP + H2O2",
    aliases: ["PNP → P5P", "oxidação do piridoxina-fosfato", "PNPO"],
    summary: "FMN-dependent oxidation of pyridoxine 5'-phosphate (or pyridoxamine 5'-phosphate) to PLP.",
    body: [
      "[[compound:pyridoxine-5-phosphate]] + [[compound:oxygen]] -> [[compound:plp]] + [[compound:hydrogen-peroxide]] by FMN-dependent [[enzyme:pnpo]] (RHEA:15149). The pyridoxamine 5'-phosphate branch (RHEA:15817) also releases ammonia. Riboflavin status therefore influences PLP supply."
    ],
    evidence: "established",
    facts: {
      ec: "1.4.3.5",
      rhea: "RHEA:15149",
      compartment: "cytosol",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:pyridoxine-5-phosphate", n: 1 }, { id: "compound:oxygen", n: 1 }],
      products: [{ id: "compound:plp", n: 1 }, { id: "compound:hydrogen-peroxide", n: 1 }],
      ec: "1.4.3.5",
      rhea: "RHEA:15149",
      reversible: false,
      compartment: "cytosol",
      enzymes: ["enzyme:pnpo"]
    },
    relations: [
      { rel: "part-of", to: "pathway:vitamin-b6-activation" },
      { rel: "associated-with", to: "state:b6-functional-deficiency", note: "riboflavin (FMN) limitation lowers PLP formation" }
    ]
  },

  // ------------------------------------------------------------------ acid / bicarbonate / CO2
  {
    id: "reaction:proton-bicarbonate-protonation",
    type: "reaction",
    name: "H+ + HCO3- <-> H2CO3 (non-enzymatic)",
    aliases: ["H+ + HCO3− ⇌ H2CO3", "protonação do bicarbonato", "ácido carbônico"],
    summary: "Fast, uncatalysed protonation of bicarbonate to carbonic acid, the first step of acid-bicarbonate neutralisation.",
    body: [
      "[[compound:proton]] + [[compound:bicarbonate]] <-> [[compound:carbonic-acid]]. Proton transfer to bicarbonate is diffusion-limited and needs no enzyme. At gastric and duodenal pH the equilibrium lies on the side of carbonic acid, which dehydrates to CO2 and water ([[reaction:carbonic-acid-dehydration]]). This is the first half of the reaction written in the source conversation, H+ + HCO3- -> H2CO3 -> H2O + CO2 ([[pathway:acid-bicarbonate-neutralisation]])."
    ],
    evidence: "established",
    facts: {
      pka: "H2CO3/HCO3- apparent pKa ~3.5 (true pKa ~3.45); the CO2(aq)/HCO3- apparent pKa is ~6.35",
      compartment: "any aqueous phase (gastric lumen, duodenal lumen, blood)",
      catalysis: "none required"
    },
    reaction: {
      reactants: [{ id: "compound:proton", n: 1 }, { id: "compound:bicarbonate", n: 1 }],
      products: [{ id: "compound:carbonic-acid", n: 1 }],
      reversible: true,
      compartment: "aqueous phase (lumen, plasma)",
      enzymes: []
    },
    relations: [
      { rel: "part-of", to: "pathway:acid-bicarbonate-neutralisation" },
      { rel: "interacts-with", to: "reaction:carbonic-acid-dehydration", note: "next step" }
    ]
  },
  {
    id: "reaction:carbonic-acid-dehydration",
    type: "reaction",
    name: "H2CO3 <-> H2O + CO2 (non-enzymatic)",
    aliases: ["H2CO3 ⇌ H2O + CO2", "desidratação do ácido carbônico", "liberação de CO2"],
    summary: "Uncatalysed dehydration of carbonic acid to water and dissolved CO2, the step that can release gaseous CO2 when acid meets bicarbonate.",
    body: [
      "[[compound:carbonic-acid]] <-> [[compound:water]] + [[compound:carbon-dioxide]]. Slow compared with proton transfer but fast enough (seconds) at acidic pH to release CO2 where acid meets bicarbonate; [[enzyme:carbonic-anhydrase]] accelerates it ([[reaction:carbonic-anhydrase-bicarbonate-dehydration]]). Dissolved CO2 is very soluble and diffuses rapidly across mucosa, so most physiological acid-bicarbonate CO2 is absorbed rather than released as gas; only when its partial pressure exceeds what the mucosa can clear (for example after sodium bicarbonate taken with food or acid) does it contribute to gas ([[pathway:acid-bicarbonate-neutralisation]])."
    ],
    evidence: "established",
    facts: {
      compartment: "any aqueous phase (gastric lumen, duodenal lumen)",
      catalysis: "uncatalysed; accelerated by carbonic anhydrase"
    },
    reaction: {
      reactants: [{ id: "compound:carbonic-acid", n: 1 }],
      products: [{ id: "compound:water", n: 1 }, { id: "compound:carbon-dioxide", n: 1 }],
      reversible: true,
      compartment: "aqueous phase (lumen, plasma)",
      enzymes: []
    },
    relations: [
      { rel: "part-of", to: "pathway:acid-bicarbonate-neutralisation" },
      { rel: "interacts-with", to: "reaction:carbonic-anhydrase-bicarbonate-dehydration", note: "enzyme-catalysed equivalent of the two uncatalysed steps" }
    ]
  },
  {
    id: "reaction:carbonic-anhydrase-bicarbonate-dehydration",
    type: "reaction",
    name: "Carbonic anhydrase: HCO3- + H+ <-> CO2 + H2O",
    aliases: ["CO2 + H2O ⇌ HCO3− + H+", "anidrase carbônica", "hidratação do CO2"],
    summary: "Zinc-catalysed interconversion of bicarbonate plus proton and CO2 plus water; in parietal cells it hydrates CO2 to supply protons and bicarbonate.",
    body: [
      "[[compound:bicarbonate]] + [[compound:proton]] <-> [[compound:carbon-dioxide]] + [[compound:water]], catalysed by [[enzyme:carbonic-anhydrase]] (Rhea writes the dehydration direction). In parietal cells it runs toward hydration (CO2 + H2O -> HCO3- + H+), fuelling [[reaction:gastric-hcl-secretion]]; in the lumen it runs toward dehydration when acid meets bicarbonate. It accelerates CO2 hydration/dehydration by many orders of magnitude at neutral pH, whereas at gastric pH the uncatalysed route ([[reaction:proton-bicarbonate-protonation]] plus [[reaction:carbonic-acid-dehydration]]) is already fast."
    ],
    evidence: "established",
    facts: {
      ec: "4.2.1.1",
      rhea: "RHEA:10748",
      reactome: "R-HSA-1475022",
      compartment: "cytosol; membrane-bound (luminal)",
      direction: "reversible; kcat ~10^6 per second for CA II"
    },
    reaction: {
      reactants: [{ id: "compound:bicarbonate", n: 1 }, { id: "compound:proton", n: 1 }],
      products: [{ id: "compound:carbon-dioxide", n: 1 }, { id: "compound:water", n: 1 }],
      ec: "4.2.1.1",
      rhea: "RHEA:10748",
      reactome: "R-HSA-1475022",
      reversible: true,
      compartment: "cytosol; luminal membrane",
      enzymes: ["enzyme:carbonic-anhydrase"]
    },
    relations: [
      { rel: "part-of", to: "pathway:acid-bicarbonate-neutralisation" },
      { rel: "part-of", to: "pathway:gastric-acid-secretion", note: "supplies H+ and HCO3- in parietal cells" }
    ]
  },
  {
    id: "reaction:hcl-bicarbonate-neutralisation",
    type: "reaction",
    name: "HCl + HCO3- -> CO2 + H2O + Cl- (net acid-bicarbonate neutralisation)",
    aliases: ["HCl + bicarbonato → CO2 + H2O + Cl−", "neutralização ácido-bicarbonato", "efervescência"],
    summary: "Net result of gastric acid meeting pancreatic, biliary or ingested bicarbonate: chloride, water and dissolved CO2.",
    body: [
      "[[compound:hydrochloric-acid]] + [[compound:bicarbonate]] -> [[compound:carbon-dioxide]] + [[compound:water]] + [[compound:chloride]]; the sum of [[reaction:proton-bicarbonate-protonation]] and [[reaction:carbonic-acid-dehydration]] with chloride as spectator ion. This is the physiological reaction in the duodenum (acid chyme + pancreatic and biliary bicarbonate) and, if bicarbonate or alkaline duodenal fluid refluxes into the stomach or an antacid is taken, in the gastric lumen.",
      "The source conversation attributes belching after glycine to CO2 produced by this reaction after glycine-stimulated acid secretion. The chemistry is certain, but its role as the cause of eructation is speculative: the amount of extra acid that glycine would trigger is unknown, CO2 is rapidly absorbed across mucosa, and the standard explanation of belching is swallowed air ([[outcome:belching]])."
    ],
    evidence: "established",
    facts: {
      compartment: "gastric lumen; duodenal lumen",
      catalysis: "spontaneous; accelerated by carbonic anhydrase",
      note: "chemistry established; role in eructation after glycine is conversation-only"
    },
    reaction: {
      reactants: [{ id: "compound:hydrochloric-acid", n: 1 }, { id: "compound:bicarbonate", n: 1 }],
      products: [{ id: "compound:carbon-dioxide", n: 1 }, { id: "compound:water", n: 1 }, { id: "compound:chloride", n: 1 }],
      reversible: false,
      compartment: "gastric lumen; duodenal lumen",
      enzymes: []
    },
    relations: [
      { rel: "part-of", to: "pathway:acid-bicarbonate-neutralisation" },
      { rel: "associated-with", to: "outcome:belching", note: "conversation-proposed mechanism; contribution of this CO2 to eructation unproven" }
    ]
  },
  {
    id: "reaction:h-k-atpase-proton-pumping",
    type: "reaction",
    name: "H+/K+-ATPase: ATP + H2O -> ADP + phosphate + H+ (coupled to H+ out, K+ in)",
    aliases: ["bomba de prótons gástrica", "ATP4A", "transporte H+/K+", "hidrólise de ATP pela H+/K+ ATPase"],
    summary: "ATP hydrolysis by the parietal-cell proton pump, coupled to electroneutral exchange of cytosolic H+ for luminal K+.",
    body: [
      "Net chemistry: [[compound:atp]] + [[compound:water]] -> [[compound:adp]] + [[compound:phosphate]] + [[compound:proton]] by [[enzyme:h-k-atpase]]. Rhea RHEA:22044 gives the transport stoichiometry as H+(in) + K+(out) + ATP + H2O = H+(out)x2 + K+(in) + ADP + Pi, in which one extra proton from ATP hydrolysis appears on the luminal side. The H+ and K+ movements across the canalicular membrane cancel in a compartment-blind balance, leaving the ATP hydrolysis as the net chemical change; the transported ions are described in [[reaction:gastric-hcl-secretion]]. The pump is inhibited by proton-pump inhibitors and potassium-competitive acid blockers."
    ],
    evidence: "established",
    facts: {
      ec: "7.2.2.19",
      rhea: "RHEA:22044",
      compartment: "parietal cell: cytosol -> canalicular lumen (H+); lumen -> cytosol (K+)",
      stoichiometry: "1 H+ out : 1 K+ in per ATP (electroneutral)"
    },
    reaction: {
      reactants: [{ id: "compound:atp", n: 1 }, { id: "compound:water", n: 1 }],
      products: [{ id: "compound:adp", n: 1 }, { id: "compound:phosphate", n: 1 }, { id: "compound:proton", n: 1 }],
      ec: "7.2.2.19",
      rhea: "RHEA:22044",
      reversible: false,
      compartment: "parietal-cell canalicular membrane",
      enzymes: ["enzyme:h-k-atpase"]
    },
    relations: [
      { rel: "part-of", to: "pathway:gastric-acid-secretion" },
      { rel: "associated-with", to: "state:hypochlorhydria", note: "inhibition by PPIs lowers acid output" }
    ]
  },
  {
    id: "reaction:gastric-hcl-secretion",
    type: "reaction",
    name: "Gastric HCl secretion: CO2 + 2 H2O + ATP + Cl- -> HCl(lumen) + HCO3-(plasma) + ADP + phosphate + H+",
    aliases: ["secreção de HCl", "maré alcalina", "célula parietal", "CO2 + H2O + Cl− → HCl + HCO3−"],
    summary: "Whole-cell parietal reaction: CO2 hydration (CA II) supplies H+ for the proton pump, giving luminal HCl and basolateral bicarbonate ('alkaline tide').",
    body: [
      "[[compound:carbon-dioxide]] + 2 [[compound:water]] + [[compound:atp]] + [[compound:chloride]] -> [[compound:hydrochloric-acid]] + [[compound:bicarbonate]] + [[compound:adp]] + [[compound:phosphate]] + [[compound:proton]]. Cytosolic CO2 is hydrated by [[enzyme:carbonic-anhydrase]] to HCO3- and H+; H+ is pumped into the canaliculus by [[enzyme:h-k-atpase]] ([[reaction:h-k-atpase-proton-pumping]]), Cl- follows through apical channels, and HCO3- leaves across the basolateral membrane in exchange for Cl- (AE2). The net ATP-hydrolysis proton stays in the cell compartment and is not separately pumped. Postprandial bicarbonate release into venous blood is the 'alkaline tide'.",
      "Stimulated by histamine (H2 receptors), acetylcholine (M3) and gastrin (via CCK2 receptors on ECL and parietal cells); the conversation claims that free glycine and collagen peptides amplify gastrin release. Peptides and aromatic amino acids stimulate G cells via the calcium-sensing receptor, but free glycine is a weak stimulus, so this link is conversation-only ([[pathway:gastric-acid-secretion]])."
    ],
    evidence: "established",
    facts: {
      compartment: "parietal cell -> canalicular lumen; basolateral membrane -> blood",
      "max-gradient": "luminal pH ~1 vs cytosol ~7.2 (about 10^6-fold)",
      note: "lumped net reaction of CA II, H+/K+-ATPase, AE2 and Cl- channels"
    },
    reaction: {
      reactants: [{ id: "compound:carbon-dioxide", n: 1 }, { id: "compound:water", n: 2 }, { id: "compound:atp", n: 1 }, { id: "compound:chloride", n: 1 }],
      products: [{ id: "compound:hydrochloric-acid", n: 1 }, { id: "compound:bicarbonate", n: 1 }, { id: "compound:adp", n: 1 }, { id: "compound:phosphate", n: 1 }, { id: "compound:proton", n: 1 }],
      reversible: false,
      compartment: "parietal cell / gastric lumen / plasma",
      enzymes: ["enzyme:carbonic-anhydrase", "enzyme:h-k-atpase"]
    },
    relations: [
      { rel: "part-of", to: "pathway:gastric-acid-secretion" },
      { rel: "associated-with", to: "system:gastric-physiology" }
    ]
  },
  {
    id: "reaction:urease-urea-hydrolysis",
    type: "reaction",
    name: "Urease: urea + H2O -> 2 NH3 + CO2",
    aliases: ["ureia + H2O → 2 NH3 + CO2", "hidrólise da ureia", "urease de H. pylori"],
    summary: "Nickel urease hydrolyses urea (via carbamate) to two ammonia and CO2, buffering H. pylori against gastric acid.",
    body: [
      "[[compound:urea]] + [[compound:water]] -> 2 [[compound:ammonia]] + [[compound:carbon-dioxide]], by [[enzyme:h-pylori-urease]]. Rhea RHEA:20557 writes the ionised form urea + 2 H2O + H+ -> HCO3- + 2 NH4+. Carbamate formed first decomposes spontaneously. The labelled CO2 from 13C-urea is the basis of the urea breath test for [[disease:h-pylori-infection]]. Ammonia raises local pH and the CO2 joins the dissolved gas pool; whether this contributes to belching is unproven."
    ],
    evidence: "established",
    facts: {
      ec: "3.5.1.5",
      rhea: "RHEA:20557",
      compartment: "H. pylori cytoplasm / periplasm in gastric mucus",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:urea", n: 1 }, { id: "compound:water", n: 1 }],
      products: [{ id: "compound:ammonia", n: 2 }, { id: "compound:carbon-dioxide", n: 1 }],
      ec: "3.5.1.5",
      rhea: "RHEA:20557",
      reversible: false,
      compartment: "bacterial cytoplasm / periplasm",
      enzymes: ["enzyme:h-pylori-urease"]
    },
    relations: [
      { rel: "part-of", to: "pathway:h-pylori-urease-activity" },
      { rel: "associated-with", to: "disease:h-pylori-infection", note: "diagnostic via urea breath test" }
    ]
  },

  // ------------------------------------------------------------------ glutathione
  {
    id: "reaction:gcl-gamma-glutamylcysteine-synthesis",
    type: "reaction",
    name: "GCL: glutamate + cysteine + ATP -> gamma-glutamylcysteine + ADP + phosphate + H+",
    aliases: ["glutamato + cisteína + ATP → γ-glutamilcisteína", "primeiro passo da glutationa"],
    summary: "Rate-limiting step of glutathione synthesis: ATP-dependent ligation of glutamate's gamma-carboxyl to cysteine.",
    body: [
      "[[compound:glutamate]] + [[compound:cysteine]] + [[compound:atp]] -> [[compound:gamma-glutamylcysteine]] + [[compound:adp]] + [[compound:phosphate]] + H+ by [[enzyme:glutamate-cysteine-ligase]]. Cysteine supply (from diet or transsulfuration) and feedback inhibition by [[compound:glutathione]] control the rate."
    ],
    evidence: "established",
    facts: {
      ec: "6.3.2.2",
      rhea: "RHEA:13285",
      compartment: "cytosol",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:glutamate", n: 1 }, { id: "compound:cysteine", n: 1 }, { id: "compound:atp", n: 1 }],
      products: [{ id: "compound:gamma-glutamylcysteine", n: 1 }, { id: "compound:adp", n: 1 }, { id: "compound:phosphate", n: 1 }, { id: "compound:proton", n: 1 }],
      ec: "6.3.2.2",
      rhea: "RHEA:13285",
      reversible: false,
      compartment: "cytosol",
      enzymes: ["enzyme:glutamate-cysteine-ligase"]
    },
    relations: [
      { rel: "part-of", to: "pathway:glutathione-synthesis", note: "rate-limiting" },
      { rel: "interacts-with", to: "reaction:cth-cystathionine-cleavage", note: "cysteine from transsulfuration" }
    ]
  },
  {
    id: "reaction:gss-glutathione-synthesis",
    type: "reaction",
    name: "GSS: gamma-glutamylcysteine + glycine + ATP -> glutathione + ADP + phosphate + H+",
    aliases: ["γ-glutamilcisteína + glicina + ATP → GSH", "síntese de glutationa"],
    summary: "Second ATP-dependent step of glutathione synthesis, adding glycine to gamma-glutamylcysteine.",
    body: [
      "[[compound:gamma-glutamylcysteine]] + [[compound:glycine]] + [[compound:atp]] -> [[compound:glutathione]] + [[compound:adp]] + [[compound:phosphate]] + H+ by [[enzyme:gss]]. One of the continuous glycine sinks, together with collagen, creatine, bile-acid conjugation and purine synthesis ([[article:melendez-hevia-2009-glycine-weak-link]])."
    ],
    evidence: "established",
    facts: {
      ec: "6.3.2.3",
      rhea: "RHEA:13557",
      compartment: "cytosol",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:gamma-glutamylcysteine", n: 1 }, { id: "compound:glycine", n: 1 }, { id: "compound:atp", n: 1 }],
      products: [{ id: "compound:glutathione", n: 1 }, { id: "compound:adp", n: 1 }, { id: "compound:phosphate", n: 1 }, { id: "compound:proton", n: 1 }],
      ec: "6.3.2.3",
      rhea: "RHEA:13557",
      reversible: false,
      compartment: "cytosol",
      enzymes: ["enzyme:gss"]
    },
    relations: [
      { rel: "part-of", to: "pathway:glutathione-synthesis" },
      { rel: "interacts-with", to: "reaction:gcl-gamma-glutamylcysteine-synthesis", note: "previous step" }
    ],
    refs: ["article:melendez-hevia-2009-glycine-weak-link"]
  },

  // ------------------------------------------------------------------ collagen
  {
    id: "reaction:p4h-prolyl-hydroxylation",
    type: "reaction",
    name: "P4H: peptidyl-proline + 2-oxoglutarate + O2 -> peptidyl-4-hydroxyproline + succinate + CO2",
    aliases: ["prolina → 4-hidroxiprolina", "hidroxilação do colágeno", "P4HA1"],
    summary: "Iron/ascorbate-dependent hydroxylation of procollagen proline residues; recorded at the free-amino-acid level for stoichiometry.",
    body: [
      "[[compound:proline]] + [[compound:2-oxoglutarate]] + [[compound:oxygen]] -> [[compound:hydroxyproline]] + [[compound:succinate]] + [[compound:carbon-dioxide]], catalysed by [[enzyme:p4ha1]] in the ER lumen. In reality the substrate and product are proline and 4-hydroxyproline residues within procollagen chains (Rhea RHEA:18945, Reactome R-HSA-1650808); the monomer-level form shown here balances atoms without a protein formula. Ascorbate (not a stoichiometric reactant) re-reduces the active-site iron."
    ],
    evidence: "established",
    facts: {
      ec: "1.14.11.2",
      rhea: "RHEA:18945",
      reactome: "R-HSA-1650808",
      compartment: "endoplasmic reticulum lumen",
      direction: "irreversible",
      representation: "free-amino-acid level for peptidyl residues"
    },
    reaction: {
      reactants: [{ id: "compound:proline", n: 1 }, { id: "compound:2-oxoglutarate", n: 1 }, { id: "compound:oxygen", n: 1 }],
      products: [{ id: "compound:hydroxyproline", n: 1 }, { id: "compound:succinate", n: 1 }, { id: "compound:carbon-dioxide", n: 1 }],
      ec: "1.14.11.2",
      rhea: "RHEA:18945",
      reactome: "R-HSA-1650808",
      reversible: false,
      compartment: "endoplasmic reticulum lumen",
      enzymes: ["enzyme:p4ha1"]
    },
    relations: [
      { rel: "part-of", to: "pathway:collagen-synthesis" },
      { rel: "interacts-with", to: "reaction:collagen-chain-assembly", note: "modifies the translated chain" }
    ]
  },
  {
    id: "reaction:collagen-chain-assembly",
    type: "reaction",
    name: "Collagen chain assembly (lumped): glycine + 2 proline -> collagen repeat unit + 3 H2O",
    aliases: ["montagem da cadeia de colágeno", "Gly-X-Y", "demanda de glicina do colágeno"],
    summary: "Lumped residue-level reaction showing the glycine demand of collagen: one glycine for every two other residues in the Gly-X-Y repeat.",
    body: [
      "[[compound:glycine]] + 2 [[compound:proline]] -> [[compound:collagen]] (one Gly-Pro-Pro repeat equivalent) + 3 [[compound:water]]. A deliberately lumped representation: ribosomal translation uses aminoacyl-tRNAs and GTP, and the Y-position proline is hydroxylated afterwards ([[reaction:p4h-prolyl-hydroxylation]]). The point is stoichiometric: one residue in three is glycine, so collagen turnover and synthesis impose a large, continuous demand for glycine that biosynthesis (about 3 g/day) may not meet ([[article:melendez-hevia-2009-glycine-weak-link]]); it also is the context in which the conversation recommends collagen peptides or gelatine."
    ],
    evidence: "established",
    facts: {
      compartment: "rough ER / cytosol (translation)",
      representation: "lumped; collagen = Gly-Pro-Pro repeat equivalent",
      direction: "irreversible (net polymerisation)"
    },
    reaction: {
      reactants: [{ id: "compound:glycine", n: 1 }, { id: "compound:proline", n: 2 }],
      products: [{ id: "compound:collagen", n: 1 }, { id: "compound:water", n: 3 }],
      reversible: false,
      compartment: "rough endoplasmic reticulum",
      enzymes: []
    },
    relations: [
      { rel: "part-of", to: "pathway:collagen-synthesis" },
      { rel: "interacts-with", to: "reaction:p4h-prolyl-hydroxylation", note: "post-translational hydroxylation" }
    ],
    refs: ["article:melendez-hevia-2009-glycine-weak-link"]
  },

  // ------------------------------------------------------------------ gut bacteria (proposed fates of free glycine)
  {
    id: "reaction:bacterial-glycine-reductase",
    type: "reaction",
    name: "Bacterial glycine reductase: glycine + Pi + thioredoxin(red) -> acetyl phosphate + NH3 + H2O + thioredoxin(ox)",
    aliases: ["redução de Stickland da glicina", "glicina → acetil-fosfato + NH3", "glycine reductase"],
    summary: "Stickland-type reductive deamination of glycine by certain anaerobic Clostridia; yields ammonia and acetyl phosphate, not CO2.",
    body: [
      "[[compound:glycine]] + [[compound:phosphate]] + [[compound:thioredoxin-dithiol]] -> [[compound:acetyl-phosphate]] + [[compound:ammonia]] + [[compound:water]] + [[compound:thioredoxin-disulfide]], by [[enzyme:bacterial-glycine-reductase]]. Rhea RHEA:12232 lists the reverse (glycine-forming) direction, but the organisms run it reductively, driven by thioredoxin reduced in Stickland oxidations of other amino acids. Acetyl phosphate gives ATP by substrate-level phosphorylation. CO2 arises from the oxidative branch (other amino acids), not from glycine here.",
      "This is one of the two 'proposed gut-bacterial fates' of free glycine; the conversation's claim that it produces CO2 and NH3 is only half correct. Occurrence in the human upper gut is unproven, so the evidence is recorded as plausible capability, speculative for belching."
    ],
    evidence: "plausible",
    facts: {
      ec: "1.21.4.2",
      rhea: "RHEA:12232",
      compartment: "bacterial cytoplasm",
      direction: "irreversible (reductive), reverse of Rhea master direction",
      "human-relevance": "speculative"
    },
    reaction: {
      reactants: [{ id: "compound:glycine", n: 1 }, { id: "compound:phosphate", n: 1 }, { id: "compound:thioredoxin-dithiol", n: 1 }],
      products: [{ id: "compound:acetyl-phosphate", n: 1 }, { id: "compound:ammonia", n: 1 }, { id: "compound:water", n: 1 }, { id: "compound:thioredoxin-disulfide", n: 1 }],
      ec: "1.21.4.2",
      rhea: "RHEA:12232",
      reversible: false,
      compartment: "bacterial cytoplasm",
      enzymes: ["enzyme:bacterial-glycine-reductase"]
    },
    relations: [
      { rel: "part-of", to: "pathway:gut-bacterial-glycine-fates" },
      { rel: "associated-with", to: "outcome:belching", note: "conversation-only; produces NH3 not CO2; no direct evidence for oral glycine" }
    ]
  },
  {
    id: "reaction:bacterial-glycine-cleavage",
    type: "reaction",
    name: "Bacterial glycine cleavage: glycine + THF + NAD+ -> 5,10-methylene-THF + CO2 + NH3 + NADH + H+",
    aliases: ["glicina descarboxilase bacteriana", "GCV bacteriano", "glicina → CO2 + NH3 por bactérias"],
    summary: "Bacterial homologue of the mitochondrial glycine cleavage system; releases CO2 and NH3 from glycine, mainly as an anabolic one-carbon source.",
    body: [
      "[[compound:glycine]] + [[compound:thf]] + [[compound:nad]] -> [[compound:5-10-methylene-thf]] + [[compound:carbon-dioxide]] + [[compound:ammonia]] + [[compound:nadh]] + H+, by [[enzyme:bacterial-glycine-cleavage-system]] (GcvP, GcvT, GcvH, Lpd). Same stoichiometry as [[reaction:glycine-cleavage-system]]. The only known 'glycine decarboxylase' that liberates CO2 and NH3 from glycine is this system; no simple glycine decarboxylase to methylamine is established. The conversation's SIBO-driven rapid gas production from free glycine via this enzyme is plausible in principle but unquantified (speculative)."
    ],
    evidence: "plausible",
    facts: {
      ec: "1.4.4.2; 2.1.2.10; 1.8.1.4",
      compartment: "bacterial cytoplasm",
      direction: "oxidative (catabolic) direction; reversible in some bacteria",
      "human-relevance": "speculative"
    },
    reaction: {
      reactants: [{ id: "compound:glycine", n: 1 }, { id: "compound:thf", n: 1 }, { id: "compound:nad", n: 1 }],
      products: [{ id: "compound:5-10-methylene-thf", n: 1 }, { id: "compound:carbon-dioxide", n: 1 }, { id: "compound:ammonia", n: 1 }, { id: "compound:nadh", n: 1 }, { id: "compound:proton", n: 1 }],
      ec: "1.4.4.2",
      reversible: false,
      compartment: "bacterial cytoplasm",
      enzymes: ["enzyme:bacterial-glycine-cleavage-system"]
    },
    relations: [
      { rel: "part-of", to: "pathway:gut-bacterial-glycine-fates" },
      { rel: "associated-with", to: "disease:sibo", note: "conversation-only: rapid proximal fermentation of free glycine in overgrowth" }
    ]
  },

  // ------------------------------------------------------------------ TMA / TMAO
  {
    id: "reaction:choline-tma-lyase",
    type: "reaction",
    name: "CutC: choline -> trimethylamine + acetaldehyde + H+",
    aliases: ["colina → TMA + acetaldeído", "formação bacteriana de TMA", "choline TMA-lyase"],
    summary: "Glycyl-radical C-N bond cleavage of choline by anaerobic gut bacteria, producing trimethylamine and acetaldehyde.",
    body: [
      "[[compound:choline]] -> [[compound:trimethylamine]] + [[compound:acetaldehyde]] + H+ by [[enzyme:cutc]] (activated by the radical-SAM enzyme CutD). Rhea RHEA:35095 gives the neutral form. Choline that escapes absorption in the small intestine, particularly with large supplement doses of choline salts, reaches the TMA-producing colonic flora; lipid-bound forms (phosphatidylcholine, GPC) and citicoline are largely absorbed earlier."
    ],
    evidence: "established",
    facts: {
      ec: "4.3.99.4",
      rhea: "RHEA:35095",
      compartment: "bacterial cytoplasm (anaerobic gut)",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:choline", n: 1 }],
      products: [{ id: "compound:trimethylamine", n: 1 }, { id: "compound:acetaldehyde", n: 1 }, { id: "compound:proton", n: 1 }],
      ec: "4.3.99.4",
      rhea: "RHEA:35095",
      reversible: false,
      compartment: "bacterial cytoplasm",
      enzymes: ["enzyme:cutc"]
    },
    relations: [
      { rel: "part-of", to: "pathway:tma-tmao-axis" },
      { rel: "associated-with", to: "system:gut-microbiota" }
    ]
  },
  {
    id: "reaction:fmo3-tma-n-oxidation",
    type: "reaction",
    name: "FMO3: trimethylamine + NADPH + O2 + H+ -> TMAO + NADP+ + H2O",
    aliases: ["TMA → TMAO", "N-oxidação da trimetilamina"],
    summary: "Hepatic flavin monooxygenase oxidation of volatile trimethylamine to odourless trimethylamine N-oxide.",
    body: [
      "[[compound:trimethylamine]] + [[compound:nadph]] + [[compound:oxygen]] + H+ -> [[compound:tmao]] + [[compound:nadp]] + [[compound:water]], by [[enzyme:fmo3]]. Deficiency allows TMA to accumulate in sweat, urine and breath (trimethylaminuria)."
    ],
    evidence: "established",
    facts: {
      ec: "1.14.13.148",
      rhea: "RHEA:31979",
      reactome: "R-HSA-139970",
      compartment: "endoplasmic reticulum (hepatocyte)",
      direction: "irreversible"
    },
    reaction: {
      reactants: [{ id: "compound:trimethylamine", n: 1 }, { id: "compound:nadph", n: 1 }, { id: "compound:oxygen", n: 1 }, { id: "compound:proton", n: 1 }],
      products: [{ id: "compound:tmao", n: 1 }, { id: "compound:nadp", n: 1 }, { id: "compound:water", n: 1 }],
      ec: "1.14.13.148",
      rhea: "RHEA:31979",
      reactome: "R-HSA-139970",
      reversible: false,
      compartment: "endoplasmic reticulum",
      enzymes: ["enzyme:fmo3"]
    },
    relations: [
      { rel: "part-of", to: "pathway:tma-tmao-axis" },
      { rel: "associated-with", to: "disease:trimethylaminuria", note: "deficiency causes the disorder" }
    ]
  }
]
