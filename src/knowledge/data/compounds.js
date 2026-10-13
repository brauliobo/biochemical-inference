// Content agent C1: compounds (metabolites, nutrients, neurotransmitters, molecules).
// Educational, neutral entries; evidence levels are assigned per claim.
export default [
  {
    id: "compound:glycine",
    type: "compound",
    name: "Glycine",
    aliases: ["Gly", "G", "glicina", "aminoacetic acid", "glicocola", "zwitterion", "anfótero", "glicina livre"],
    summary: "Smallest proteinogenic amino acid; a collagen building block, inhibitory neurotransmitter, GNMT methyl acceptor and precursor of glutathione, creatine, heme, purines and bile-acid conjugates.",
    body: [
      "In plain words: glycine is the smallest amino acid. The body makes it, eats it and uses it for collagen, the antioxidant glutathione, bile salts, creatine and as a calming messenger in the nervous system. Glycine powder (3 g at bedtime up to 10 g or more a day) is taken for sleep or \"collagen support\". In the source conversation it produced belching. This page separates what is known about glycine (how it is made and used) from the proposed reasons for the gas: a drain on methyl groups, extra stomach acid, CO2, and gas-forming bacteria. Most of those are unproven. It also shows the route that makes glycine inside liver cells from choline and betaine without passing through the gut.",
      "Glycine (H2N-CH2-COOH) is made in the body mainly from [[compound:serine]] by [[enzyme:shmt]] (a PLP-dependent reaction that also transfers a one-carbon unit onto [[compound:thf]]), and is broken down chiefly by the mitochondrial [[enzyme:glycine-cleavage-system|glycine cleavage system]], which yields CO2, ammonia and [[compound:5-10-methylene-thf]]. It can also be formed from [[compound:betaine]] through [[compound:dimethylglycine]] and [[compound:sarcosine]] (the [[pathway:choline-oxidation]] route), and from [[compound:hydroxyproline]] catabolism via glyoxylate.",
      "Glycine is consumed in many places: [[compound:collagen]] (about one residue in three), [[compound:glutathione]] synthesis, [[compound:guanidinoacetate]] and hence [[compound:creatine]], heme and purine synthesis, [[compound:bile-acids|bile acid]] conjugation ([[compound:glycocholic-acid]]), and xenobiotic conjugation such as [[compound:hippuric-acid]]. In the central nervous system it is an inhibitory neurotransmitter at strychnine-sensitive glycine receptors and a co-agonist at NMDA receptors. Glycine is the methyl acceptor of [[enzyme:gnmt]], which converts [[compound:sam]] to [[compound:sah]] and [[compound:sarcosine]].",
      "Evidence note: Melendez-Hevia and colleagues argued that endogenous synthesis (about 3 g/day) falls short of the glycine needed for collagen turnover, leaving a deficit near 10 g/day; this is a modelling argument and is contested, not a settled requirement. The idea that extra glycine strongly depletes methyl groups through GNMT is plausible but unproven in humans: GNMT is already near-saturated by hepatic glycine and is chiefly regulated by SAM and 5-methyl-THF. Gram-scale glycine has no formal UL; trials used about 3 g at bedtime for sleep and far larger daily doses in psychiatric research, with GI complaints reported at high doses."
    ],
    evidence: "established",
    facts: {
      formula: "C2H5NO2",
      molarMass: "75.07 g/mol",
      chebi: "CHEBI:15428",
      pubchem: "CID 750",
      hmdb: "HMDB0000123",
      "dosing-range": "Sleep trials about 3 g before bed; larger doses studied in psychiatry; no formal UL",
      pKa: "2.34 (COOH), 9.60 (NH3+)"
    },
    relations: [
      { rel: "substrate-of", to: "enzyme:gnmt", note: "Methyl acceptor; product is sarcosine" },
      { rel: "substrate-of", to: "enzyme:glycine-cleavage-system", note: "Mitochondrial cleavage to CO2, NH3 and methylene-THF" },
      { rel: "substrate-of", to: "enzyme:shmt", note: "Reversible interconversion with serine" },
      { rel: "product-of", to: "enzyme:sardh", note: "Final step of choline-oxidation route" },
      { rel: "part-of", to: "compound:collagen" },
      { rel: "part-of", to: "compound:glutathione" },
      { rel: "precursor-of", to: "compound:guanidinoacetate" },
      { rel: "precursor-of", to: "compound:glycocholic-acid" },
      { rel: "precursor-of", to: "compound:hippuric-acid", note: "Glycine conjugation of benzoate" },
      { rel: "precursor-of", to: "compound:oxalate", note: "Minor flux via glyoxylate" },
      { rel: "contraindicated-in", to: "disease:nonketotic-hyperglycinemia", note: "Glycine accumulates because the glycine cleavage system is defective; supplements are avoided." },
      { rel: "mitigates", to: "state:glycine-insufficiency", note: "Direct repletion; whether a shortfall exists in healthy adults is contested." },
      { rel: "increases", to: "compound:glutathione", note: "Glycine is a substrate of glutathione synthetase; with cysteine it restored glutathione synthesis in older adults in one small study." },
      { rel: "part-of", to: "compound:elastin" },
      { rel: "aggravates", to: "disease:nonketotic-hyperglycinemia", note: "Glycine accumulates because the cleavage system is defective." },
      { rel: "causes", to: "outcome:improved-sleep-quality", note: "About 3 g before bed improved subjective sleep in small trials." }
    ],
    refs: ["article:melendez-hevia-2009-glycine-weak-link", "article:mudd-2007-methyl-balance", "article:bannai-2012-glycine-sleep"]
  },
  {
    id: "compound:serine",
    type: "compound",
    name: "L-Serine",
    aliases: ["Ser", "serina", "L-serina"],
    summary: "Non-essential amino acid and the main source of one-carbon units for folate metabolism; interconverts with glycine through SHMT.",
    body: [
      "[[enzyme:shmt]] converts serine plus [[compound:thf]] into [[compound:glycine]] plus [[compound:5-10-methylene-thf]] (and back). The mitochondrial isoform makes serine the principal supplier of one-carbon units for purines, thymidylate and, through [[pathway:folate-cycle]] flux, for [[compound:5-mthf]] and [[compound:sam]]. Serine also condenses with [[compound:homocysteine]] in the [[enzyme:cbs]] reaction to start [[pathway:transsulfuration]], and is a precursor of phosphatidylserine, sphingolipids and D-serine.",
      "Because the SHMT reaction is reversible and PLP-dependent, glycine and serine pools buffer each other; a high-glycine load can be partly converted to serine if folate one-carbon units are available, which couples glycine handling to [[compound:plp]] and folate status."
    ],
    evidence: "established",
    facts: { formula: "C3H7NO3", molarMass: "105.09 g/mol", chebi: "CHEBI:17115", pubchem: "CID 5951", hmdb: "HMDB0000187" },
    relations: [
      { rel: "substrate-of", to: "enzyme:shmt", note: "Gives glycine and 5,10-methylene-THF" },
      { rel: "substrate-of", to: "enzyme:cbs", note: "Condenses with homocysteine to cystathionine" },
      { rel: "precursor-of", to: "compound:glycine" },
      { rel: "precursor-of", to: "compound:cysteine", note: "Carbon skeleton donor via transsulfuration" }
    ],
    refs: ["article:mattaini-2016-serine-metabolism", "article:wang-2013-glycine-metabolism"]
  },
  {
    id: "compound:sarcosine",
    type: "compound",
    name: "Sarcosine (N-methylglycine)",
    aliases: ["N-methylglycine", "monometilglicina", "sarcosina", "N-metilglicina"],
    summary: "Mono-methylated glycine; the product of GNMT and an intermediate on the betaine-to-glycine route, oxidised back to glycine by SARDH.",
    body: [
      "Sarcosine arises in two ways: [[enzyme:gnmt]] transfers a methyl group from [[compound:sam]] onto [[compound:glycine]], and the mitochondrial [[enzyme:dmgdh]] removes one methyl from [[compound:dimethylglycine]]. [[enzyme:sardh]] then oxidises sarcosine to glycine, releasing the methyl carbon as [[compound:5-10-methylene-thf]] (via formaldehyde captured by THF). Net, GNMT plus SARDH form a futile-looking cycle that burns SAM into SAH and one-carbon units without net glycine loss.",
      "Sarcosine inhibits the glycine transporter GlyT1 and has been tested as an add-on in schizophrenia (about 2 g/day) with modest, inconsistent results. Inherited SARDH deficiency (sarcosinaemia) is biochemically benign. Reports linking urinary sarcosine to prostate cancer have not held up as a reliable diagnostic."
    ],
    evidence: "established",
    facts: { formula: "C3H7NO2", molarMass: "89.09 g/mol", chebi: "CHEBI:15611", pubchem: "CID 1088", hmdb: "HMDB0000271" },
    relations: [
      { rel: "product-of", to: "enzyme:gnmt" },
      { rel: "product-of", to: "enzyme:dmgdh" },
      { rel: "substrate-of", to: "enzyme:sardh" },
      { rel: "precursor-of", to: "compound:glycine" }
    ],
    refs: ["article:lane-2008-sarcosine-schizophrenia"]
  },
  {
    id: "compound:dimethylglycine",
    type: "compound",
    name: "Dimethylglycine (DMG)",
    aliases: ["N,N-dimethylglycine", "DMG", "dimetilglicina"],
    summary: "Product of BHMT demethylation of betaine; oxidised by mitochondrial DMGDH to sarcosine while releasing a one-carbon unit onto folate.",
    body: [
      "[[enzyme:bhmt]] moves one methyl from [[compound:betaine]] onto [[compound:homocysteine]], giving [[compound:methionine]] and DMG. In mitochondria [[enzyme:dmgdh]] (FAD-dependent) removes a further methyl as [[compound:5-10-methylene-thf]], leaving [[compound:sarcosine]]. Plasma DMG rises with betaine or choline intake and in renal impairment, and is sometimes used as a marker of BHMT flux.",
      "DMG is sold as a supplement (often marketed as 'vitamin B15' or pangamic acid, an unapproved term). Controlled evidence for performance, immune or behavioural benefits is weak or negative. Rare DMGDH deficiency causes DMG accumulation and a fishy body odour."
    ],
    evidence: "established",
    facts: { formula: "C4H9NO2", molarMass: "103.12 g/mol", chebi: "CHEBI:17724", pubchem: "CID 673", hmdb: "HMDB0000092" },
    relations: [
      { rel: "product-of", to: "enzyme:bhmt" },
      { rel: "substrate-of", to: "enzyme:dmgdh" },
      { rel: "precursor-of", to: "compound:sarcosine" },
      { rel: "part-of", to: "pathway:choline-oxidation" }
    ],
    refs: ["article:reactome-choline-catabolism", "article:craig-2004-betaine-human-nutrition"]
  },
  {
    id: "compound:betaine",
    type: "compound",
    name: "Betaine (trimethylglycine, TMG)",
    aliases: ["TMG", "trimethylglycine", "glycine betaine", "betaína", "betaína anidra", "trimetilglicina"],
    summary: "Fully methylated glycine; an osmolyte and the methyl donor for BHMT, formed from choline in liver and kidney mitochondria.",
    body: [
      "In plain words: betaine, also called TMG or trimethylglycine, is glycine carrying three methyl groups. Liver and kidney make it from choline, and it gives one methyl to homocysteine to rebuild methionine, then loses its other two methyls and ends as plain glycine. \"Betaine anhydrous\" (TMG) is a neutral supplement. \"Betaine HCl\" is a different product that releases hydrochloric acid in the stomach. Confusing the two matters: the burning after betaine HCl described in the conversation is an acid effect, not a property of TMG.",
      "Betaine is N,N,N-trimethylglycine. It is made from [[compound:choline]] by [[enzyme:chdh]] (to [[compound:betaine-aldehyde]]) and [[enzyme:aldh7a1|BADH]], or taken in from foods such as wheat bran, spinach, beets and shellfish. In liver and kidney [[enzyme:bhmt]] transfers one methyl to [[compound:homocysteine]] giving [[compound:methionine]] and [[compound:dimethylglycine]]; the two remaining methyls are shed as one-carbon units by [[enzyme:dmgdh]] and [[enzyme:sardh]], ending at [[compound:glycine]]. So one mole of choline can in principle yield one mole of glycine plus one remethylation event and two folate-bound one-carbon units.",
      "Betaine is also an organic osmolyte protecting renal medullary and hepatic cells. Pharmacologically, anhydrous betaine (about 6 g/day in divided doses) is an approved treatment for homocystinuria. Do not confuse it with betaine hydrochloride, a different salt that releases HCl ([[intervention:betaine-hcl]]); anhydrous betaine is a neutral zwitterion ([[intervention:betaine-anhydrous]])."
    ],
    evidence: "established",
    facts: {
      formula: "C5H11NO2",
      molarMass: "117.15 g/mol",
      chebi: "CHEBI:17750",
      pubchem: "CID 247",
      hmdb: "HMDB0000043",
      "dosing-range": "Homocystinuria 6 g/day divided (prescription); EU health claim at 1.5 g/day; trials up to ~20 g/day in liver disease"
    },
    relations: [
      { rel: "product-of", to: "enzyme:aldh7a1" },
      { rel: "substrate-of", to: "enzyme:bhmt", note: "Methyl donor to homocysteine" },
      { rel: "precursor-of", to: "compound:dimethylglycine" },
      { rel: "decreases", to: "compound:homocysteine" },
      { rel: "part-of", to: "pathway:choline-oxidation" },
      { rel: "mitigates", to: "state:undermethylation", note: "Methyl donor for BHMT; lowers homocysteine in trials, but an effect on tissue SAM:SAH in people classed as under-methylated has not been shown." },
      { rel: "mitigates", to: "state:hyperhomocysteinemia", note: "Lowers plasma homocysteine, including at low doses; anhydrous betaine is a prescription treatment in classical homocystinuria." },
      { rel: "decreases", to: "outcome:elevated-homocysteine", note: "Randomised studies show lowering of fasting and post-methionine-load homocysteine." },
      { rel: "mitigates", to: "disease:cbs-deficiency", note: "Established treatment for classical homocystinuria; it raises methionine, which is monitored." },
      { rel: "increases", to: "compound:methionine", note: "BHMT remethylates homocysteine to methionine." }
    ],
    refs: ["article:olthof-2003-betaine-low-dose-homocysteine"]
  },
  {
    id: "compound:betaine-aldehyde",
    type: "compound",
    name: "Betaine aldehyde",
    aliases: ["betaína aldeído"],
    summary: "Short-lived reactive intermediate between choline and betaine in the choline oxidation pathway.",
    body: [
      "[[enzyme:chdh]] oxidises [[compound:choline]] on the inner mitochondrial membrane to betaine aldehyde, which [[enzyme:aldh7a1|BADH]] (principally ALDH7A1) converts to [[compound:betaine]]. The aldehyde is reactive and normally present only at trace levels, which is why the second step is efficient. It is a useful teaching example of how [[pathway:choline-oxidation]] is hard-wired to mitochondria of liver and kidney."
    ],
    evidence: "established",
    facts: { formula: "C5H12NO+", chebi: "CHEBI:15710" },
    relations: [
      { rel: "product-of", to: "enzyme:chdh" },
      { rel: "substrate-of", to: "enzyme:aldh7a1" },
      { rel: "precursor-of", to: "compound:betaine" }
    ],
    refs: ["article:reactome-choline-catabolism"]
  },
  {
    id: "compound:choline",
    type: "compound",
    name: "Choline",
    aliases: ["colina", "trimethylethanolamine"],
    summary: "Essential nutrient and quaternary amine feeding phosphatidylcholine, acetylcholine, sphingomyelin and (via betaine) the methyl and glycine pool.",
    body: [
      "In plain words: choline is an essential nutrient found in eggs, liver, fish and soy. The body uses it to build cell membranes, to make acetylcholine (the messenger of the vagus nerve, which also steers digestion and the heartbeat) and, through betaine, to supply methyl groups and finally glycine. In the source conversation choline is the nutrient that seemed to help (night-time waking, racing heart) and the proposed \"clean\" source of glycine. This page covers the four routes of choline, safe intake levels (a US upper limit of 3.5 g a day; none set by EFSA), why 10 g of glycine from choline is not realistic, and what too much choline does.",
      "Choline has four main metabolic fates. (1) Phosphorylation by choline kinase starts the [[pathway:kennedy-pathway]] to [[compound:phosphatidylcholine]]; this is the dominant route in most tissues and makes membranes, bile phospholipid and VLDL. (2) Acetylation by choline acetyltransferase gives [[compound:acetylcholine]], the vagal and enteric neurotransmitter. (3) Irreversible oxidation by [[enzyme:chdh]] and [[enzyme:aldh7a1|BADH]] to [[compound:betaine]] ([[pathway:choline-oxidation]]), which connects to [[enzyme:bhmt]] and the [[pathway:methionine-cycle]]. (4) Gut bacterial cleavage to [[compound:trimethylamine]], which the liver oxidises to [[compound:tmao]]. The body can also make choline de novo through [[enzyme:pemt]], but this uses three [[compound:sam]] methyls per molecule and does not cover needs, so choline is a dietary requirement.",
      "Intake: adequate intake is 550 mg/day (men) and 425 mg/day (women) in the US (IOM 1998) and 400 mg/day for adults in the EU (EFSA 2016). The IOM UL is 3.5 g/day for adults, based on hypotension, fishy odour, sweating, salivation and GI effects. EFSA did not set an upper level, contrary to some secondary summaries. Good sources are eggs, liver, meat, fish and soy ([[intervention:dietary-choline-sources]]); typical intakes in many populations fall below the AI. Isolated salts such as [[intervention:choline-bitartrate]] are the usual supplement form.",
      "Evidence note: one mole of choline can yield at most one mole of glycine, so reaching 10 g glycine (about 0.133 mol) from choline would need about 14 g of choline cation (roughly 34 g choline bitartrate) at 100 % conversion, far above the UL and above realistic hepatic partitioning, because most choline goes to the Kennedy pathway. The arithmetic in the source conversation is therefore right in direction, and the conclusion (not a practical glycine source) is sound; glycine formed in liver mitochondria is also largely consumed locally by the glycine cleavage system rather than exported."
    ],
    evidence: "established",
    facts: {
      formula: "C5H14NO+ (cation)",
      molarMass: "104.17 g/mol (cation)",
      chebi: "CHEBI:15354",
      pubchem: "CID 305",
      hmdb: "HMDB0000097",
      "dosing-range": "AI 400-550 mg/day (EFSA/IOM); supplements commonly 250-1000 mg choline",
      ul: "3.5 g/day adults (IOM 1998); no UL set by EFSA 2016"
    },
    relations: [
      { rel: "substrate-of", to: "enzyme:chdh" },
      { rel: "precursor-of", to: "compound:betaine" },
      { rel: "precursor-of", to: "compound:phosphatidylcholine" },
      { rel: "precursor-of", to: "compound:acetylcholine" },
      { rel: "precursor-of", to: "compound:trimethylamine", note: "Via gut microbial CutC/D" },
      { rel: "part-of", to: "pathway:kennedy-pathway" },
      { rel: "precursor-of", to: "compound:phosphocholine", note: "Choline kinase step" },
      { rel: "mitigates", to: "state:undermethylation", note: "Supplies methyl groups through betaine and BHMT, mainly when folate-dependent remethylation is limited; indirect and unproven for the state as defined clinically." },
      { rel: "contraindicated-in", to: "disease:trimethylaminuria", note: "Gut bacteria convert surplus choline to trimethylamine, which people with reduced FMO3 activity cannot oxidise; intake is usually restricted." },
      { rel: "causes", to: "outcome:fishy-odor", note: "Dose-dependent: with intakes above the upper limit or reduced FMO3 activity, excess trimethylamine produces a fishy odour." },
      { rel: "increases", to: "compound:tmao", note: "Via gut bacterial trimethylamine (CutC) and hepatic FMO3." },
      { rel: "decreases", to: "compound:homocysteine", note: "Through betaine and BHMT; phosphatidylcholine lowered fasting homocysteine in a randomised study." },
      { rel: "mitigates", to: "disease:choline-deficiency", note: "Repletion corrects the deficiency syndrome." },
      { rel: "mitigates", to: "outcome:hepatic-steatosis", note: "Steatosis from choline deficiency (for example on parenteral nutrition) reverses with repletion." },
      { rel: "mitigates", to: "state:methyl-donor-depletion", note: "Supplies betaine for BHMT and, indirectly, SAM." },
      { rel: "aggravates", to: "disease:trimethylaminuria", note: "Choline is the substrate for gut TMA; dietary restriction is part of management." }
    ],
    refs: ["article:iom-1998-choline-dri", "article:efsa-2016-choline-dri", "article:zeisel-2009-choline-essential-nutrient"]
  },
  {
    id: "compound:phosphatidylcholine",
    type: "compound",
    name: "Phosphatidylcholine (PC, lecithin)",
    aliases: ["PC", "lecitina", "fosfatidilcolina"],
    summary: "Main membrane phospholipid and biliary phospholipid; made by the Kennedy pathway and, in liver, by PEMT using three SAM methyl groups.",
    body: [
      "PC is built from diacylglycerol and CDP-choline in the [[pathway:kennedy-pathway]] (about two-thirds or more of hepatic PC) or by three successive methylations of [[compound:phosphatidylethanolamine]] by [[enzyme:pemt]], consuming three [[compound:sam]] and releasing three [[compound:sah]]. This makes PEMT one of the largest SAM-using processes in liver. PC is essential for VLDL secretion (choline deficiency causes fatty liver), for bile (biliary PC buffers bile-acid toxicity) and as a store of choline for [[compound:acetylcholine]] synthesis under demand.",
      "Dietary PC (and the supplement form, [[intervention:phosphatidylcholine-supplement]]) is hydrolysed in the gut to [[compound:glycerophosphocholine]] and free choline; the portion reaching the colon can feed microbial [[compound:trimethylamine]] production and, via [[compound:tmao]], the cardiovascular-risk associations described by Wang and colleagues (association, not proven causation)."
    ],
    evidence: "established",
    facts: { formula: "variable acyl chains (e.g. C42H82NO8P for 16:0/18:1)", chebi: "CHEBI:64482", "choline-content": "about 13-14 % choline by mass for typical PC" },
    relations: [
      { rel: "product-of", to: "enzyme:pemt" },
      { rel: "product-of", to: "pathway:kennedy-pathway" },
      { rel: "part-of", to: "system:bile", note: "Biliary phospholipid" },
      { rel: "precursor-of", to: "compound:choline", note: "Reservoir released by phospholipases" },
      { rel: "precursor-of", to: "compound:glycerophosphocholine", note: "Deacylation product" }
    ],
    refs: ["article:wang-2011-gut-flora-phosphatidylcholine-cvd"]
  },
  {
    id: "compound:phosphatidylethanolamine",
    type: "compound",
    name: "Phosphatidylethanolamine (PE)",
    aliases: ["PE", "fosfatidiletanolamina"],
    summary: "Aminophospholipid that PEMT methylates three times to phosphatidylcholine; made via the CDP-ethanolamine branch of the Kennedy pathway or by phosphatidylserine decarboxylation.",
    body: [
      "PE is the substrate of [[enzyme:pemt]], which converts it to [[compound:phosphatidylcholine]] using three [[compound:sam]] methyls. The ethanolamine route of the [[pathway:kennedy-pathway]] and the mitochondrial decarboxylation of phosphatidylserine supply PE. Because PEMT-derived PC carries more long-chain polyunsaturated acyl groups, this route matters for DHA delivery, a point sometimes used to argue for [[compound:sam]] sufficiency in liver."
    ],
    evidence: "established",
    facts: { chebi: "CHEBI:16038" },
    relations: [
      { rel: "substrate-of", to: "enzyme:pemt" },
      { rel: "precursor-of", to: "compound:phosphatidylcholine" },
      { rel: "part-of", to: "pathway:kennedy-pathway", note: "Ethanolamine branch" }
    ],
    refs: ["article:vance-2014-phospholipid-methylation"]
  },
  {
    id: "compound:cdp-choline",
    type: "compound",
    name: "CDP-choline (citicoline)",
    aliases: ["citicolina", "citicoline", "cytidine diphosphocholine", "CDP-colina"],
    summary: "Rate-limited intermediate of the Kennedy pathway and the basis of the citicoline supplement; hydrolysed in the gut to cytidine and choline.",
    body: [
      "In the [[pathway:kennedy-pathway]], phosphocholine plus CTP gives CDP-choline (CCT is the regulated step) and CDP-choline plus diacylglycerol gives [[compound:phosphatidylcholine]]. As a supplement ([[intervention:citicoline-supplement]]) it is hydrolysed in the intestine and liver; circulating cytidine and choline are taken up and resynthesised into CDP-choline in brain. Choline is only about one fifth of its mass.",
      "Clinical evidence for cognition or stroke recovery is mixed; the large ICTUS trial in acute ischaemic stroke was neutral."
    ],
    evidence: "established",
    facts: { formula: "C14H26N4O11P2", molarMass: "488.32 g/mol", chebi: "CHEBI:16436", pubchem: "CID 13804" },
    relations: [
      { rel: "precursor-of", to: "compound:phosphatidylcholine" },
      { rel: "precursor-of", to: "compound:choline", note: "After hydrolysis" },
      { rel: "part-of", to: "pathway:kennedy-pathway" }
    ],
    refs: ["article:vance-2014-phospholipid-methylation", "article:kennedy-1956-cytidine-coenzymes"]
  },
  {
    id: "compound:glycerophosphocholine",
    type: "compound",
    name: "Glycerophosphocholine (alpha-GPC)",
    aliases: ["alpha-GPC", "alfa-GPC", "GPC", "choline alfoscerate", "L-alfa-glicerilfosforilcolina", "glicerofosfocolina"],
    summary: "Water-soluble phosphatidylcholine breakdown product and choline supplement, about 40 % choline by mass.",
    body: [
      "GPC is produced when phospholipases strip both fatty acids from [[compound:phosphatidylcholine]] and is normally further cleaved to [[compound:choline]] and glycerol-3-phosphate. In milk and many tissues it is a natural choline reservoir. As a supplement ([[intervention:alpha-gpc-supplement]]) it is water-soluble and is generally described as absorbed without needing gastric acid and as delivering choline efficiently; that description rests on manufacturer and review statements, not on the sources used here ([[claim:alpha-gpc-pc-absorbed-without-acid]]). An observational Korean claims-data study reported higher stroke incidence in users; it is confounded by indication and not proof of harm."
    ],
    evidence: "established",
    facts: { formula: "C8H20NO6P", molarMass: "257.22 g/mol", chebi: "CHEBI:16870", pubchem: "CID 657272", "choline-content": "about 40 % choline by mass" },
    relations: [
      { rel: "precursor-of", to: "compound:choline" },
      { rel: "precursor-of", to: "compound:acetylcholine", note: "Via choline" }
    ],
    refs: ["article:vance-2014-phospholipid-methylation", "article:zeisel-2009-choline-essential-nutrient"]
  },
  {
    id: "compound:phosphocholine",
    type: "compound",
    name: "Phosphocholine",
    aliases: ["fosfocolina", "choline phosphate"],
    summary: "First product of choline kinase and the headgroup donor precursor in the Kennedy pathway; also released from sphingomyelin.",
    body: [
      "Choline kinase traps [[compound:choline]] inside the cell as phosphocholine using [[compound:atp]]. CTP:phosphocholine cytidylyltransferase then forms [[compound:cdp-choline]], so phosphocholine is the committed intermediate of the [[pathway:kennedy-pathway]]. Choline kinase activity is elevated in many tumours, which is the basis of choline PET imaging."
    ],
    evidence: "established",
    facts: { formula: "C5H15NO4P+", molarMass: "184.15 g/mol", pubchem: "CID 1014",
    "chebi": "CHEBI:18132" },
    relations: [
      { rel: "part-of", to: "pathway:kennedy-pathway" },
      { rel: "precursor-of", to: "compound:cdp-choline" }
    ],
    refs: ["article:vance-2014-phospholipid-methylation", "article:kennedy-1956-cytidine-coenzymes"]
  },
  {
    id: "compound:acetylcholine",
    type: "compound",
    name: "Acetylcholine (ACh)",
    aliases: ["ACh", "acetilcolina"],
    summary: "Neurotransmitter of the vagus and enteric nervous system, driving gastric acid secretion, antral motility and cardiac vagal braking.",
    body: [
      "Choline acetyltransferase joins [[compound:choline]] with acetyl-CoA to make ACh; acetylcholinesterase ends the signal. Vagal ACh acts on M3 receptors of parietal, ECL and smooth-muscle cells (stimulating [[compound:hydrochloric-acid]] secretion and gastric contraction), on enteric neurons in the [[system:enteric-nervous-system]], and on M2 receptors in the sinoatrial node to slow heart rate ([[system:vagal-tone]]). Lower-oesophageal-sphincter tone is partly cholinergic, but the transient relaxations that vent gas are a vagovagal reflex mediated by nitric oxide and VIP, not simply a deficit of ACh ([[system:lower-esophageal-sphincter]]).",
      "Evidence note: in healthy people with adequate diet, brain ACh synthesis is not clearly limited by choline supply, and the chain 'less methylation, less PEMT, less choline, less ACh, gastroparesis and belching' is plausible but speculative. It is not an established mechanism for glycine-related belching."
    ],
    evidence: "established",
    facts: { formula: "C7H16NO2+", molarMass: "146.21 g/mol", chebi: "CHEBI:15355", pubchem: "CID 187", hmdb: "HMDB0000895" },
    relations: [
      { rel: "increases", to: "pathway:gastric-acid-secretion", note: "Via M3 receptors on parietal and ECL cells" },
      { rel: "associated-with", to: "system:vagal-tone" },
      { rel: "increases", to: "system:gastric-physiology", note: "Antral contraction and emptying" },
      { rel: "associated-with", to: "system:lower-esophageal-sphincter" }
    ]
  },
  {
    id: "compound:sam",
    type: "compound",
    name: "S-adenosylmethionine (SAMe)",
    aliases: ["SAMe", "SAM", "AdoMet", "S-adenosil-metionina", "doador de metil", "S-adenosilmetionina"],
    summary: "Universal methyl donor made by MAT from methionine and ATP; allosterically regulates MTHFR, CBS and BHMT.",
    body: [
      "[[enzyme:mat]] (MAT1A in liver, MAT2A elsewhere) makes SAM from [[compound:methionine]] and [[compound:atp]], consuming the whole triphosphate chain; Mg2+ is required ([[compound:magnesium]]). More than 50 methyltransferases use SAM: [[enzyme:gnmt]] ([[compound:sarcosine]]), [[enzyme:pemt]] ([[compound:phosphatidylcholine]]), GAMT ([[compound:creatine]]), NNMT ([[compound:1-methylnicotinamide]]), [[enzyme:hnmt]] ([[compound:histamine]]), COMT, DNA and histone methyltransferases, and others. Each reaction yields [[compound:sah]].",
      "SAM also acts as a regulator: it activates [[enzyme:cbs]] (sending homocysteine to [[pathway:transsulfuration]]), inhibits [[enzyme:mthfr]] and [[enzyme:bhmt]], thereby tuning the [[pathway:methionine-cycle]]. The SAM:SAH ratio ('methylation index') matters more than SAM alone because SAH inhibits most methyltransferases. SAM is chemically unstable at neutral pH and oral supplements ([[intervention:same-supplement]]) are enteric-coated salts. Plasma SAM is a poor proxy of tissue methylation capacity.",
      "'Under-methylation' as a clinical state is discussed at [[state:undermethylation]]; its biochemical definitions are inconsistent and measurement is rarely standardised."
    ],
    evidence: "established",
    facts: { formula: "C15H23N6O5S+ (cation; neutral zwitterion C15H22N6O5S)", molarMass: "399.45 g/mol (cation); 398.44 g/mol (zwitterion)", chebi: "CHEBI:15414", pubchem: "CID 34755", hmdb: "HMDB0001185" },
    relations: [
      { rel: "product-of", to: "enzyme:mat" },
      { rel: "substrate-of", to: "enzyme:gnmt" },
      { rel: "substrate-of", to: "enzyme:pemt" },
      { rel: "substrate-of", to: "enzyme:hnmt" },
      { rel: "part-of", to: "pathway:methionine-cycle" },
      { rel: "precursor-of", to: "compound:sah" }
    ]
  },
  {
    id: "compound:sah",
    type: "compound",
    name: "S-adenosylhomocysteine (SAH)",
    aliases: ["AdoHcy", "SAH", "S-adenosil-homocisteína"],
    summary: "Product of every SAM-dependent methylation and a potent methyltransferase inhibitor; hydrolysed reversibly by AHCY to homocysteine and adenosine.",
    body: [
      "[[enzyme:ahcy]] converts SAH to [[compound:homocysteine]] and adenosine. The equilibrium favours SAH formation, so removal of homocysteine (by [[enzyme:mtr]], [[enzyme:bhmt]] or [[enzyme:cbs]]) and adenosine is needed to keep the reaction moving. Accumulating SAH binds methyltransferases tighter than [[compound:sam]] does, so a raised SAH (or low SAM:SAH) reduces methylation capacity even when SAM is normal. This is why hyperhomocysteinaemia and renal impairment can impair methylation.",
      "SAH can be measured in plasma by LC-MS but is not part of routine clinical practice; see [[intervention:homocysteine-mma-testing]] for the routine surrogates."
    ],
    evidence: "established",
    facts: { formula: "C14H20N6O5S", molarMass: "384.41 g/mol", chebi: "CHEBI:16680", pubchem: "CID 439155", hmdb: "HMDB0000939" },
    relations: [
      { rel: "product-of", to: "enzyme:gnmt" },
      { rel: "substrate-of", to: "enzyme:ahcy" },
      { rel: "precursor-of", to: "compound:homocysteine" },
      { rel: "associated-with", to: "state:undermethylation", note: "Raised SAH (low SAM:SAH) is the biochemical definition of impaired methylation capacity" }
    ]
  },
  {
    id: "compound:homocysteine",
    type: "compound",
    name: "Homocysteine (Hcy)",
    aliases: ["Hcy", "tHcy", "homocisteína"],
    summary: "Sulfur amino acid at the metabolic branch point between remethylation to methionine and transsulfuration to cysteine.",
    body: [
      "Homocysteine is generated by [[enzyme:ahcy]] from [[compound:sah]]. It is remethylated to [[compound:methionine]] by [[enzyme:mtr]] (methylcobalamin, [[compound:5-mthf]], zinc) or by [[enzyme:bhmt]] ([[compound:betaine]], liver and kidney), or committed to [[pathway:transsulfuration]] by [[enzyme:cbs]] (needs [[compound:plp]]) giving [[compound:cystathionine]] and then [[compound:cysteine]]. Plasma total Hcy is typically 5-15 micromol/L; elevations arise from folate, B12 or B6 insufficiency, MTHFR 677TT, renal dysfunction, and drugs (metformin, PPIs through B12, fibrates).",
      "Hcy is a convenient biomarker of one-carbon status, but lowering it with B-vitamins did not reduce cardiovascular events in large trials, so it is best seen as a marker rather than a proven causal target. Measure with [[intervention:homocysteine-mma-testing]]."
    ],
    evidence: "established",
    facts: { formula: "C4H9NO2S", molarMass: "135.18 g/mol", chebi: "CHEBI:17230", pubchem: "CID 91552", hmdb: "HMDB0000742", "reference-range": "about 5-15 micromol/L (lab dependent)" },
    relations: [
      { rel: "product-of", to: "enzyme:ahcy" },
      { rel: "substrate-of", to: "enzyme:mtr" },
      { rel: "substrate-of", to: "enzyme:bhmt" },
      { rel: "substrate-of", to: "enzyme:cbs" },
      { rel: "measured-by", to: "intervention:homocysteine-mma-testing" }
    ]
  },
  {
    id: "compound:methionine",
    type: "compound",
    name: "L-Methionine",
    aliases: ["Met", "metionina", "L-metionina"],
    summary: "Essential sulfur amino acid, precursor of SAM and, through the methionine cycle, of homocysteine and cysteine.",
    body: [
      "Methionine comes from protein (meat, fish, eggs, dairy, Brazil nuts) at roughly 1-2 g/day in typical diets and from remethylation of [[compound:homocysteine]]. [[enzyme:mat]] activates it to [[compound:sam]]. Excess methionine is catabolised via [[pathway:transsulfuration]] to [[compound:cysteine]] and [[compound:taurine]]. A methionine loading test (post-load Hcy and [[compound:cystathionine]]) is a research tool for transsulfuration and B6 function ([[state:b6-functional-deficiency]]).",
      "Supplementing methionine is generally not a way to treat suspected under-methylation: it raises homocysteine and, in susceptible people, can worsen symptoms."
    ],
    evidence: "established",
    facts: { formula: "C5H11NO2S", molarMass: "149.21 g/mol", chebi: "CHEBI:16643", pubchem: "CID 6137", hmdb: "HMDB0000696" },
    relations: [
      { rel: "substrate-of", to: "enzyme:mat" },
      { rel: "product-of", to: "enzyme:mtr" },
      { rel: "product-of", to: "enzyme:bhmt" },
      { rel: "precursor-of", to: "compound:sam" }
    ],
    refs: ["article:mudd-2007-methyl-balance", "article:reactome-sulfur-amino-acid-metabolism"]
  },
  {
    id: "compound:cysteine",
    type: "compound",
    name: "L-Cysteine",
    aliases: ["Cys", "cisteína"],
    summary: "Conditionally essential thiol amino acid made by transsulfuration; the rate-limiting building block of glutathione and precursor of taurine.",
    body: [
      "Cysteine is synthesised from [[compound:homocysteine]] and [[compound:serine]] by [[enzyme:cbs]] and cystathionine gamma-lyase (both [[compound:plp]]-dependent), via [[compound:cystathionine]] ([[pathway:transsulfuration]]). It is the limiting amino acid for [[compound:glutathione]] synthesis ([[pathway:glutathione-synthesis]]) and is decarboxylated, after oxidation, to [[compound:taurine]]. N-acetylcysteine is a common oral precursor."
    ],
    evidence: "established",
    facts: { formula: "C3H7NO2S", molarMass: "121.16 g/mol", chebi: "CHEBI:17561", pubchem: "CID 5862", hmdb: "HMDB0000574" },
    relations: [
      { rel: "product-of", to: "pathway:transsulfuration" },
      { rel: "precursor-of", to: "compound:glutathione" },
      { rel: "precursor-of", to: "compound:taurine" }
    ],
    refs: ["article:reactome-sulfur-amino-acid-metabolism", "article:sekhar-2011-glynac-glutathione"]
  },
  {
    id: "compound:cystathionine",
    type: "compound",
    name: "Cystathionine",
    aliases: ["cistationina"],
    summary: "Thioether intermediate of transsulfuration; accumulates when B6-dependent cystathionine gamma-lyase is limited.",
    body: [
      "[[enzyme:cbs]] condenses [[compound:homocysteine]] with [[compound:serine]] to form cystathionine, which cystathionine gamma-lyase cleaves to [[compound:cysteine]], alpha-ketobutyrate and ammonia. Both enzymes need [[compound:plp]], and cystathionine (with Hcy after a methionine load) is therefore a functional marker of B6 insufficiency ([[state:b6-functional-deficiency]])."
    ],
    evidence: "established",
    facts: { formula: "C7H14N2O4S", molarMass: "222.26 g/mol", pubchem: "CID 834",
    "chebi": "CHEBI:17482" },
    relations: [
      { rel: "product-of", to: "enzyme:cbs" },
      { rel: "part-of", to: "pathway:transsulfuration" },
      { rel: "precursor-of", to: "compound:cysteine" }
    ],
    refs: ["article:reactome-sulfur-amino-acid-metabolism", "article:selhub-1999-homocysteine-metabolism"]
  },
  {
    id: "compound:taurine",
    type: "compound",
    name: "Taurine",
    aliases: ["taurina", "2-aminoethanesulfonic acid"],
    summary: "Sulfonic amino acid made from cysteine; conjugates bile acids alongside glycine and acts as an osmolyte and inhibitory modulator.",
    body: [
      "Taurine is formed from [[compound:cysteine]] via cysteine dioxygenase and cysteine sulfinate decarboxylase (a [[compound:plp]] enzyme) and obtained from meat and seafood. In humans bile acids are conjugated with [[compound:glycine]] and taurine in roughly a 3:1 ratio (see [[pathway:bile-acid-conjugation]]); the ratio shifts toward taurine with higher taurine intake. Taurine is also an osmolyte, a retinal and cardiac nutrient, and a GABA-A / glycine receptor agonist.",
      "Beta-alanine ([[compound:beta-alanine]]) competes with taurine for transport and can lower tissue taurine at high doses in animals. Risk assessment (Shao and Hathcock) proposed an observed safe level of about 3 g/day; trials used up to 6 g/day."
    ],
    evidence: "established",
    facts: { formula: "C2H7NO3S", molarMass: "125.15 g/mol", chebi: "CHEBI:15891", pubchem: "CID 1123", hmdb: "HMDB0000251", "dosing-range": "1-3 g/day typical; OSL about 3 g/day" },
    relations: [
      { rel: "precursor-of", to: "compound:taurocholic-acid" },
      { rel: "interacts-with", to: "compound:beta-alanine", note: "Shared transporter" }
    ],
    refs: ["article:shao-2008-osl-taurine-glutamine-arginine"]
  },
  {
    id: "compound:glutathione",
    type: "compound",
    name: "Glutathione (GSH)",
    aliases: ["GSH", "glutationa", "gamma-glutamylcysteinylglycine"],
    summary: "Tripeptide Glu-Cys-Gly; the major cellular antioxidant and detoxification conjugate, made in two ATP-dependent steps that use glycine and cysteine.",
    body: [
      "Glutamate-cysteine ligase (rate-limiting, feedback-inhibited by GSH) joins [[compound:glutamate]] and [[compound:cysteine]]; glutathione synthetase then adds [[compound:glycine]] ([[pathway:glutathione-synthesis]]). Cysteine is usually limiting, but glycine can become limiting in deficiency states; Sekhar and colleagues found that GlyNAC (glycine plus N-acetylcysteine) restored GSH in older adults. GSH is regenerated by glutathione reductase (NADPH) and used by peroxidases and glutathione S-transferases.",
      "Oral glutathione itself has debated bioavailability; liposomal and sublingual products are marketed with limited independent data."
    ],
    evidence: "established",
    facts: { formula: "C10H17N3O6S", molarMass: "307.32 g/mol", chebi: "CHEBI:16856", pubchem: "CID 124886", hmdb: "HMDB0000125" },
    relations: [
      { rel: "product-of", to: "pathway:glutathione-synthesis" },
      { rel: "associated-with", to: "pathway:transsulfuration", note: "Cysteine supply" },
      { rel: "associated-with", to: "compound:glycine", note: "Synthetase step consumes glycine" }
    ],
    refs: ["article:sekhar-2011-glynac-glutathione"]
  },
  {
    id: "compound:glutamate",
    type: "compound",
    name: "Glutamate",
    aliases: ["glutamic acid", "glutamato", "Glu", "ácido glutâmico"],
    summary: "Main excitatory neurotransmitter and metabolic hub; decarboxylated by PLP-dependent GAD to GABA and amidated to glutamine.",
    body: [
      "Glutamate is the precursor of [[compound:gaba]] via [[enzyme:gad]] (GAD65/67 require [[compound:plp]]; see [[pathway:gaba-shunt]]) and of [[compound:glutamine]] via glutamine synthetase; it is also a constituent of [[compound:glutathione]] and an amino-group sink for transaminases. Histidine catabolism ends in glutamate via formimino-glutamate (FIGLU) and consumes [[compound:thf]].",
      "Evidence note: the popular idea that a functional B6 shortfall causes glutamate excess and thereby anxiety is plausible biochemistry but weakly evidenced in healthy adults; brain glutamate and GABA are tightly compartmentalised and not readily inferred from blood or supplement response."
    ],
    evidence: "established",
    facts: { formula: "C5H9NO4", molarMass: "147.13 g/mol", chebi: "CHEBI:16015", pubchem: "CID 33032", hmdb: "HMDB0000148" },
    relations: [
      { rel: "substrate-of", to: "enzyme:gad" },
      { rel: "precursor-of", to: "compound:gaba" },
      { rel: "precursor-of", to: "compound:glutamine" },
      { rel: "part-of", to: "compound:glutathione" },
      { rel: "precursor-of", to: "compound:proline" }
    ],
    refs: ["article:petroff-2002-gaba-glutamate"]
  },
  {
    id: "compound:glutamine",
    type: "compound",
    name: "L-Glutamine",
    aliases: ["Gln", "glutamina", "L-glutamina"],
    summary: "Most abundant free amino acid in blood; fuel for enterocytes and immune cells and the brain's glutamate-GABA reservoir.",
    body: [
      "Glutamine is made from [[compound:glutamate]] and ammonia by glutamine synthetase and hydrolysed by glutaminase back to glutamate plus [[compound:ammonia]]. Enterocytes and lymphocytes oxidise it as a primary fuel; in neurons the glutamate-glutamine cycle replenishes [[compound:gaba]] and glutamate. Oral use as a gut-healing agent is discussed at [[intervention:l-glutamine-supplement]]; evidence in peptic ulcer healing is old and thin."
    ],
    evidence: "established",
    facts: { formula: "C5H10N2O3", molarMass: "146.14 g/mol", chebi: "CHEBI:18050" },
    relations: [
      { rel: "precursor-of", to: "compound:ammonia", note: "Via glutaminase" },
      { rel: "precursor-of", to: "compound:gaba", note: "Glutamate-GABA cycle" }
    ],
    refs: ["article:shao-2008-osl-taurine-glutamine-arginine"]
  },
  {
    id: "compound:gaba",
    type: "compound",
    name: "Gamma-aminobutyric acid (GABA)",
    aliases: ["GABA", "ácido gama-aminobutírico"],
    summary: "Principal inhibitory neurotransmitter; synthesised by PLP-dependent GAD and broken down by GABA transaminase, also active in the gut and lower oesophageal sphincter reflexes.",
    body: [
      "[[enzyme:gad]] decarboxylates [[compound:glutamate]] to GABA in the [[pathway:gaba-shunt]]; GABA transaminase (also [[compound:plp]]-dependent) degrades it to succinic semialdehyde. Severe B6 deficiency can cause seizures through lowered GABA synthesis, which is the best-established link of P5P to calming effects. In the gut, GABA-B receptor activation reduces transient lower-oesophageal-sphincter relaxations (baclofen is used off-label to cut reflux and belching), tying GABA to [[system:lower-esophageal-sphincter]] physiology. Oral GABA crosses the blood-brain barrier poorly; its efficacy as a supplement is unproven."
    ],
    evidence: "established",
    facts: { formula: "C4H9NO2", molarMass: "103.12 g/mol", chebi: "CHEBI:16865", pubchem: "CID 119", hmdb: "HMDB0000112" },
    relations: [
      { rel: "product-of", to: "enzyme:gad" },
      { rel: "part-of", to: "pathway:gaba-shunt" },
      { rel: "mitigates", to: "disease:anxiety-disorder", note: "Inhibitory tone; supplement-level evidence weak" }
    ]
  },
  {
    id: "compound:histamine",
    type: "compound",
    name: "Histamine",
    aliases: ["histamina"],
    summary: "Biogenic amine from histidine that drives gastric acid secretion, wakefulness, vasodilation and allergic responses; inactivated by HNMT (SAM-dependent) and DAO.",
    body: [
      "Histidine decarboxylase ([[compound:plp]]-dependent) makes histamine from [[compound:histidine]] in mast cells, enterochromaffin-like (ECL) cells and neurons. ECL histamine, released after [[compound:gastrin]] and [[compound:acetylcholine]] signals, activates H2 receptors on parietal cells to secrete [[compound:hydrochloric-acid]], the target of H2 blockers ([[intervention:h2-receptor-antagonists]]). H1 and H2 receptors also mediate vasodilation, flushing and tachycardia.",
      "Degradation proceeds by two enzymes: [[enzyme:hnmt]] methylates histamine intracellularly using [[compound:sam]], while [[enzyme:dao]] oxidatively deaminates extracellular, mostly gut-derived histamine ([[pathway:histamine-degradation]]). This is the biochemical rationale for linking methylation status to histamine tolerance ([[disease:histamine-intolerance]]); the link is plausible but the clinical entity remains poorly defined.",
      "Evidence note: the claim that histamine peaks at 2-4 a.m. and causes night waking via low SAM is weakly supported; central histaminergic neurons are least active in sleep, and peripheral circadian findings are inconsistent ([[outcome:night-waking]], [[outcome:tachycardia]])."
    ],
    evidence: "established",
    facts: { formula: "C5H9N3", molarMass: "111.15 g/mol", chebi: "CHEBI:18295", pubchem: "CID 774", hmdb: "HMDB0000870" },
    relations: [
      { rel: "substrate-of", to: "enzyme:hnmt" },
      { rel: "substrate-of", to: "enzyme:dao" },
      { rel: "increases", to: "pathway:gastric-acid-secretion", note: "H2 receptor on parietal cells" },
      { rel: "associated-with", to: "disease:histamine-intolerance" },
      { rel: "part-of", to: "pathway:histamine-degradation" }
    ]
  },
  {
    id: "compound:histidine",
    type: "compound",
    name: "L-Histidine",
    aliases: ["His", "histidina", "L-histidina", "histidina tecidual"],
    summary: "Essential amino acid; precursor of histamine and carnosine, metal chelator, and the substrate of the histidine load (FIGLU) test of folate status.",
    body: [
      "Decarboxylation of histidine gives [[compound:histamine]]; ligation with [[compound:beta-alanine]] gives [[compound:carnosine]]. Histidine catabolism via urocanate to formiminoglutamate (FIGLU) hands a one-carbon unit to [[compound:thf]], so urinary FIGLU after a histidine load was historically used to detect folate deficiency. Free histidine supplementation raises histamine only modestly in most data but is generally avoided in suspected histamine intolerance ([[disease:histamine-intolerance]])."
    ],
    evidence: "established",
    facts: { formula: "C6H9N3O2", molarMass: "155.15 g/mol", chebi: "CHEBI:15971", pubchem: "CID 6274", hmdb: "HMDB0000177" },
    relations: [
      { rel: "precursor-of", to: "compound:histamine" },
      { rel: "precursor-of", to: "compound:carnosine" },
      { rel: "associated-with", to: "compound:thf", note: "Catabolism via FIGLU hands a one-carbon unit to THF" }
    ],
    refs: ["article:maintz-2007-histamine-intolerance", "article:trexler-2015-issn-beta-alanine"]
  },
  {
    id: "compound:formate",
    type: "compound",
    name: "Formate",
    aliases: ["formato", "formic acid", "ácido fórmico"],
    summary: "One-carbon unit exported from mitochondria to supply cytosolic 10-formyl-THF; the carbon liberated from serine, glycine, sarcosine and DMG.",
    body: [
      "Methylene groups removed from [[compound:dimethylglycine]], [[compound:sarcosine]] or [[compound:glycine]] (via [[enzyme:glycine-cleavage-system|GCS]]) enter the mitochondrial folate pool as [[compound:5-10-methylene-thf]] and can be oxidised to formate, which leaves the organelle and is re-attached to [[compound:thf]] in the cytosol. This is how the choline-to-glycine route and glycine catabolism feed purine and thymidylate synthesis in the [[pathway:folate-cycle]]."
    ],
    evidence: "established",
    facts: { formula: "CHO2-", molarMass: "45.02 g/mol", pubchem: "CID 283",
    "chebi": "CHEBI:15740" },
    relations: [
      { rel: "part-of", to: "pathway:folate-cycle" },
      { rel: "associated-with", to: "compound:thf", note: "Re-enters the cytosolic pool as 10-formyl-THF" }
    ],
    refs: ["article:reactome-folate-pterine-metabolism"]
  },
  {
    id: "compound:folate",
    type: "compound",
    name: "Folate (vitamin B9) - overview",
    aliases: ["vitamin B9", "folato", "B9", "folates", "vitamina B9"],
    summary: "Family of pteridine-glutamate cofactors that carry one-carbon units; natural folates in food differ from the synthetic folic acid in supplements and fortified flour.",
    body: [
      "Natural folates are reduced, polyglutamated molecules ([[compound:thf]], [[compound:5-10-methylene-thf]], [[compound:5-mthf]], 10-formyl-THF, 5-formyl-THF) found in leafy greens, legumes, liver and eggs. They are deconjugated in the gut and absorbed mainly in the proximal jejunum by the acid-optimum proton-coupled folate transporter. Synthetic [[compound:folic-acid]] is fully oxidised and must be reduced by DHFR, and [[compound:folinic-acid]] is the stable 5-formyl form. The reduced folate pool runs the [[pathway:folate-cycle]], which supplies one-carbon units for purines, thymidylate, [[compound:serine]]/[[compound:glycine]] interconversion and, via [[enzyme:mthfr]], methyl groups for the [[pathway:methionine-cycle]].",
      "Dietary folate equivalents (DFE) count food folate 1:1, folic acid with food 1.7:1; adult RDA is 400 micrograms DFE. Preventing neural-tube defects is the best-established benefit (400 micrograms folic acid around conception). Folate deficiency causes megaloblastic anaemia and raises [[compound:homocysteine]]."
    ],
    evidence: "established",
    facts: { forms: "THF, 5,10-methylene-THF, 5-methyl-THF, 10-formyl-THF, 5-formyl-THF (folinic acid), folic acid (synthetic)", "dosing-range": "RDA 400 micrograms DFE; pregnancy 600", ul: "1000 micrograms/day as folic acid (IOM; EU), not applied to natural food folate" },
    relations: [
      { rel: "cofactor-of", to: "enzyme:shmt" },
      { rel: "cofactor-of", to: "enzyme:mtr", note: "As 5-methyl-THF" },
      { rel: "part-of", to: "pathway:folate-cycle" },
      { rel: "decreases", to: "compound:homocysteine" }
    ],
    refs: ["article:reactome-folate-pterine-metabolism", "article:efsa-2022-5-mthf-dietary-folate-equivalents"]
  },
  {
    id: "compound:thf",
    type: "compound",
    name: "Tetrahydrofolate (THF)",
    aliases: ["THF", "tetraidrofolato", "FH4"],
    summary: "Fully reduced folate that accepts one-carbon units from serine, glycine, sarcosine and DMG to form methylene-THF; regenerated by DHFR, MTR and thymidylate cycling.",
    body: [
      "THF is the acceptor in [[enzyme:shmt]] (from [[compound:serine]]), [[enzyme:glycine-cleavage-system|GCS]] (from [[compound:glycine]]), [[enzyme:dmgdh]] and [[enzyme:sardh]]; each reaction yields [[compound:5-10-methylene-thf]]. It is regenerated when [[enzyme:mtr]] transfers the methyl of [[compound:5-mthf]] to [[compound:homocysteine]]. When B12 is lacking, THF accumulates trapped as 5-MTHF (the 'methyl-folate trap'), because the MTHFR reaction is effectively irreversible, which is why B12 deficiency produces a functional folate deficiency."
    ],
    evidence: "established",
    facts: { formula: "C19H23N7O6", molarMass: "445.43 g/mol", chebi: "CHEBI:20506" },
    relations: [
      { rel: "cofactor-of", to: "enzyme:glycine-cleavage-system" },
      { rel: "cofactor-of", to: "enzyme:shmt" },
      { rel: "part-of", to: "pathway:folate-cycle" },
      { rel: "product-of", to: "enzyme:mtr" }
    ],
    refs: ["article:reactome-folate-pterine-metabolism"]
  },
  {
    id: "compound:5-10-methylene-thf",
    type: "compound",
    name: "5,10-Methylenetetrahydrofolate",
    aliases: ["5,10-CH2-THF", "metilenotetraidrofolato", "methylene-THF", "5,10-metilenotetraidrofolato", "metileno-THF"],
    summary: "Central one-carbon folate: fed by SHMT, GCS, DMGDH and SARDH; consumed by thymidylate synthase, MTHFD and MTHFR.",
    body: [
      "Methylene-THF is a crossroads of the [[pathway:folate-cycle]]. It is produced by [[enzyme:shmt]], [[enzyme:glycine-cleavage-system|GCS]], [[enzyme:dmgdh]] and [[enzyme:sardh]] and is consumed by thymidylate synthase (dUMP to dTMP, for DNA), by MTHFD1 toward 10-formyl-THF and purines (with exported [[compound:formate]]), or by [[enzyme:mthfr]] (FAD, NADPH) which irreversibly reduces it to [[compound:5-mthf]] for [[compound:homocysteine]] remethylation. SAM inhibits MTHFR, steering carbon toward nucleotides when methylation capacity is replete.",
      "In the choline-to-glycine route, the second and third methyl groups of betaine end here, which is why choline and betaine contribute to one-carbon supply independently of dietary folate."
    ],
    evidence: "established",
    facts: { formula: "C20H23N7O6", molarMass: "457.44 g/mol", chebi: "CHEBI:15636" },
    relations: [
      { rel: "product-of", to: "enzyme:glycine-cleavage-system" },
      { rel: "product-of", to: "enzyme:dmgdh" },
      { rel: "substrate-of", to: "enzyme:mthfr" },
      { rel: "part-of", to: "pathway:folate-cycle" },
      { rel: "precursor-of", to: "compound:formate", note: "After oxidation in mitochondria" },
      { rel: "substrate-of", to: "pathway:nucleotide-synthesis", note: "Methylene donor for thymidylate synthase." }
    ],
    refs: ["article:reactome-folate-pterine-metabolism"]
  },
  {
    id: "compound:5-mthf",
    type: "compound",
    name: "5-Methyltetrahydrofolate (5-MTHF, methylfolate)",
    aliases: ["5-MTHF", "L-methylfolate", "metilfolato", "L-5-MTHF", "levomefolate", "5-metiltetraidrofolato", "L-metilfolato"],
    summary: "Predominant circulating folate and the methyl donor to homocysteine via methionine synthase; made irreversibly by MTHFR.",
    body: [
      "[[enzyme:mthfr]] reduces [[compound:5-10-methylene-thf]] to 5-MTHF, which [[enzyme:mtr]] uses together with [[compound:methylcobalamin]] to convert [[compound:homocysteine]] to [[compound:methionine]]. 5-MTHF polyglutamates also inhibit [[enzyme:gnmt]], so folate status modulates how readily glycine can drain [[compound:sam]], a regulatory link relevant to glycine-supplement discussions. The common MTHFR C677T variant lowers enzyme activity (about 30 % residual in TT homozygotes) mainly when folate and riboflavin status are low.",
      "Supplemental L-methylfolate (calcium or glucosamine salts) bypasses DHFR and MTHFR and is used at 0.4-1 mg for general purposes and 7.5-15 mg as a prescription adjunct in depression. It can mask B12 deficiency, so B12 status should be known; reports of irritability, anxiety or insomnia at high doses exist but are anecdotal. See [[intervention:methylfolate-supplement]]."
    ],
    evidence: "established",
    facts: { formula: "C20H25N7O6", molarMass: "459.46 g/mol", chebi: "CHEBI:15641", hmdb: "HMDB0001396" },
    relations: [
      { rel: "product-of", to: "enzyme:mthfr" },
      { rel: "substrate-of", to: "enzyme:mtr" },
      { rel: "decreases", to: "compound:homocysteine" },
      { rel: "interacts-with", to: "enzyme:gnmt", note: "Polyglutamate form inhibits GNMT" },
      { rel: "decreases", to: "enzyme:gnmt", note: "The polyglutamate form inhibits purified rat GNMT noncompetitively; human significance unverified." }
    ]
  },
  {
    id: "compound:folic-acid",
    type: "compound",
    name: "Folic acid (synthetic pteroylglutamic acid)",
    aliases: ["ácido fólico", "pteroylglutamic acid", "vitamin B9 synthetic"],
    summary: "Oxidised synthetic folate used in fortification and supplements; requires slow human DHFR for activation and can appear unmetabolised in plasma at higher doses.",
    body: [
      "Folic acid is not a natural cofactor. After absorption it must be reduced to DHF and THF by dihydrofolate reductase, an activity that is low and variable in human liver (Bailey and Ayling 2009), so doses above roughly 200-400 micrograms can leave unmetabolised folic acid in circulation. The health significance of this is unresolved. Folic acid binds folate receptor alpha with high affinity, which is the basis of the speculation that it might compete with reduced folates; direct clinical evidence of impaired methylation is lacking, so treat that claim as plausible but unproven.",
      "Established facts: 400 micrograms preconception prevents neural-tube defects; fortification reduced their incidence; large doses can mask the haematological sign of B12 deficiency. UL is 1000 micrograms/day for folic acid (IOM and EU). Methotrexate and some antiepileptics antagonise folate metabolism. See [[intervention:folic-acid-supplement]]."
    ],
    evidence: "established",
    facts: { formula: "C19H19N7O6", molarMass: "441.40 g/mol", chebi: "CHEBI:27470", pubchem: "CID 6037", hmdb: "HMDB0000121", ul: "1000 micrograms/day (IOM; EU)" },
    relations: [
      { rel: "precursor-of", to: "compound:thf", note: "Via DHFR, slowly in humans" },
      { rel: "decreases", to: "compound:homocysteine" },
      { rel: "interacts-with", to: "compound:5-mthf", note: "Possible receptor competition (speculative)" }
    ],
    refs: ["article:bailey-2009-dhfr-slow-human-liver"]
  },
  {
    id: "compound:folinic-acid",
    type: "compound",
    name: "Folinic acid (5-formyl-THF, leucovorin)",
    aliases: ["ácido folínico", "leucovorin", "calcium folinate", "5-formyltetrahydrofolate"],
    summary: "Stable 5-formyl reduced folate that enters the folate pool without DHFR; used as methotrexate rescue and, experimentally, in cerebral folate deficiency.",
    body: [
      "Folinic acid is converted by methenyl-THF synthetase to 5,10-methenyl-THF and then feeds the [[pathway:folate-cycle]] and [[compound:5-mthf]] without needing DHFR. Clinically it rescues normal cells from methotrexate and potentiates 5-fluorouracil (so oncology patients should not self-dose). Supplement versions are usually the racemic calcium salt, of which only the 6S form is active. An RCT in autism with cerebral folate receptor autoantibodies reported benefit for language (Frye 2018); generalisation beyond that subgroup is not supported. See [[intervention:folinic-acid-supplement]]."
    ],
    evidence: "established",
    facts: { formula: "C20H23N7O7", molarMass: "473.44 g/mol", pubchem: "CID 6006",
    "chebi": "CHEBI:15640" },
    relations: [
      { rel: "precursor-of", to: "compound:5-10-methylene-thf" },
      { rel: "part-of", to: "compound:folate" },
      { rel: "interacts-with", to: "compound:folic-acid", note: "Bypasses DHFR step" }
    ],
    refs: ["article:reactome-folate-pterine-metabolism", "article:howard-2016-high-dose-methotrexate"]
  },
  {
    id: "compound:vitamin-b12",
    type: "compound",
    name: "Vitamin B12 (cobalamin) - overview",
    aliases: ["cobalamina", "B12", "cobalamin", "vitamina B12"],
    summary: "Cobalt-containing cofactor for methionine synthase (methylcobalamin) and methylmalonyl-CoA mutase (adenosylcobalamin); absorption depends on gastric acid, intrinsic factor and the ileum.",
    body: [
      "Food B12 is bound to protein and released by [[compound:hydrochloric-acid]] and [[compound:pepsin]] in the stomach, binds haptocorrin, is handed to intrinsic factor (secreted by parietal cells) in the duodenum and is absorbed in the terminal ileum. About 1 % of an oral dose is absorbed passively without intrinsic factor, so 250-1000 micrograms/day oral works even in malabsorption. Crystalline B12 in supplements does not need acid, so [[intervention:ppi-therapy]], atrophic gastritis ([[disease:h-pylori-infection]]) and [[state:hypochlorhydria]] mainly impair absorption of food-bound B12.",
      "All dietary forms ([[compound:methylcobalamin]], [[compound:adenosylcobalamin]], [[compound:cyanocobalamin]], hydroxocobalamin) are converted inside cells into the two coenzyme forms. Deficiency causes megaloblastic anaemia and neuropathy and raises [[compound:homocysteine]] and [[compound:methylmalonic-acid]]. Recommended intake is 2.4 micrograms/day; no UL has been set."
    ],
    evidence: "established",
    facts: { forms: "methylcobalamin, adenosylcobalamin, hydroxocobalamin, cyanocobalamin", "dosing-range": "RDA 2.4 micrograms; supplements 250-1000 micrograms oral", ul: "None established" },
    relations: [
      { rel: "cofactor-of", to: "enzyme:mtr" },
      { rel: "decreases", to: "compound:homocysteine" },
      { rel: "measured-by", to: "intervention:homocysteine-mma-testing" },
      { rel: "associated-with", to: "state:hypochlorhydria", note: "Food-B12 release needs acid" }
    ],
    refs: ["article:lam-2013-ppi-b12-deficiency"]
  },
  {
    id: "compound:methylcobalamin",
    type: "compound",
    name: "Methylcobalamin",
    aliases: ["MeCbl", "metilcobalamina", "methyl B12"],
    summary: "Cytosolic B12 coenzyme that carries the methyl group to homocysteine in the methionine synthase reaction.",
    body: [
      "Methylcobalamin is the form directly used by [[enzyme:mtr]]. Supplement methylcobalamin is dealkylated and recycled into the intracellular cobalamin pool like other forms, so claims that it is categorically superior to [[compound:cyanocobalamin]] are not well supported; it is however light-sensitive and costlier. Oral doses of 500-1000 micrograms are common; no UL exists. See [[intervention:methylcobalamin-supplement]]."
    ],
    evidence: "established",
    facts: { formula: "C63H91CoN13O14P", molarMass: "1344.4 g/mol", chebi: "CHEBI:28115" },
    relations: [
      { rel: "cofactor-of", to: "enzyme:mtr" },
      { rel: "part-of", to: "compound:vitamin-b12" },
      { rel: "decreases", to: "compound:homocysteine" }
    ],
    refs: ["article:stabler-2013-vitamin-b12-deficiency", "article:selhub-1999-homocysteine-metabolism"]
  },
  {
    id: "compound:adenosylcobalamin",
    type: "compound",
    name: "Adenosylcobalamin (5'-deoxyadenosylcobalamin)",
    aliases: ["AdoCbl", "adenosilcobalamina", "cobamamide", "dibencozide"],
    summary: "Mitochondrial B12 coenzyme for methylmalonyl-CoA mutase, converting methylmalonyl-CoA to succinyl-CoA.",
    body: [
      "Adenosylcobalamin is the cofactor of methylmalonyl-CoA mutase, which sits at the end of propionate catabolism (odd-chain fatty acids, valine, isoleucine, cholesterol side chain). Loss of function raises [[compound:methylmalonic-acid]], the functional B12 marker. It is not required by [[enzyme:mtr]]. It is light-sensitive and is typically sold sublingually or in combination with [[compound:methylcobalamin]]."
    ],
    evidence: "established",
    facts: { formula: "C72H100CoN18O17P", chebi: "CHEBI:18408" },
    relations: [
      { rel: "part-of", to: "compound:vitamin-b12" },
      { rel: "decreases", to: "compound:methylmalonic-acid" },
      { rel: "interacts-with", to: "compound:methylcobalamin", note: "Co-supplemented; separate enzymes" }
    ],
    refs: ["article:stabler-2013-vitamin-b12-deficiency"]
  },
  {
    id: "compound:cyanocobalamin",
    type: "compound",
    name: "Cyanocobalamin",
    aliases: ["cianocobalamina", "CNCbl", "synthetic B12"],
    summary: "Stable synthetic B12 with a cyanide ligand; the most studied supplement form, decyanated inside cells by MMACHC.",
    body: [
      "Cyanocobalamin is chemically stable and inexpensive, the form used in most B12 trials and fortified foods. The cyanide released is about 2 % of the molecular mass, a trivial quantity at supplement doses. The cobalamin is decyanated by MMACHC and converted into [[compound:methylcobalamin]] and [[compound:adenosylcobalamin]]. Concerns about slower conversion exist in rare inborn errors (cblC) and theoretical issues in advanced renal disease or smoking-related optic neuropathy; for most people it works as well as other forms. See [[intervention:cyanocobalamin-supplement]]."
    ],
    evidence: "established",
    facts: { formula: "C63H88CoN14O14P", molarMass: "1355.4 g/mol", chebi: "CHEBI:17439", pubchem: "CID 5311498" },
    relations: [
      { rel: "precursor-of", to: "compound:methylcobalamin" },
      { rel: "precursor-of", to: "compound:adenosylcobalamin" },
      { rel: "part-of", to: "compound:vitamin-b12" },
      { rel: "mitigates", to: "disease:vitamin-b12-deficiency", note: "Standard, inexpensive supplement form; converted to active forms in cells." },
      { rel: "decreases", to: "compound:methylmalonic-acid", note: "Falls with effective B12 repletion." }
    ],
    refs: ["article:stabler-2013-vitamin-b12-deficiency"]
  },
  {
    id: "compound:vitamin-b6",
    type: "compound",
    name: "Vitamin B6 - overview",
    aliases: ["B6", "vitamina B6"],
    summary: "Group of pyridine vitamers (pyridoxine, pyridoxal, pyridoxamine and their phosphates) whose active coenzyme is pyridoxal 5'-phosphate.",
    body: [
      "Dietary B6 occurs as pyridoxal and pyridoxamine in animal foods and as [[compound:pyridoxine]] and its glucoside in plants. Pyridoxal kinase ([[enzyme:pdxk]]) phosphorylates the vitamers and PNPO (an FMN-dependent enzyme, linking to [[compound:riboflavin]]) oxidises PNP/PMP to [[compound:plp]]. Inflammation, alcohol, renal disease, oral contraceptives and drugs such as isoniazid, hydralazine and penicillamine lower PLP or inactivate it ([[state:b6-functional-deficiency]]).",
      "Neuropathy occurs with chronic high intakes; the US UL is 100 mg/day, while EFSA (2023) lowered its UL to 12 mg/day, which explains differing label limits."
    ],
    evidence: "established",
    facts: { forms: "pyridoxine, pyridoxal, pyridoxamine, PLP, PMP", "dosing-range": "RDA 1.3-1.7 mg; supplements 1.5-50 mg typical", ul: "100 mg/day (IOM); 12 mg/day (EFSA 2023)" },
    relations: [
      { rel: "precursor-of", to: "compound:plp" },
      { rel: "cofactor-of", to: "enzyme:cbs", note: "As PLP" },
      { rel: "associated-with", to: "state:b6-functional-deficiency" }
    ],
    refs: ["article:parra-2018-vitamin-b6-metabolism", "article:ueland-2015-b6-biomarkers"]
  },
  {
    id: "compound:pyridoxine",
    type: "compound",
    name: "Pyridoxine",
    aliases: ["piridoxina", "pyridoxine HCl", "vitamin B6 alcohol"],
    summary: "Common supplemental B6 vitamer; phosphorylated by PDXK and oxidised by PNPO to the active coenzyme PLP.",
    body: [
      "Pyridoxine hydrochloride is the form in most multivitamins. In liver it is converted by [[enzyme:pdxk]] and PNPO to [[compound:plp]]; the pathway needs [[compound:riboflavin]] (FMN) and [[compound:atp]]/[[compound:zinc]]-dependent steps. The popular claim that people need pre-activated P5P to bypass an impaired conversion is plausible in rare PNPO variants but unestablished for the general public. Chronic intake above the UL has caused sensory neuropathy; see [[intervention:p5p-supplement]] for comparison with oral PLP."
    ],
    evidence: "established",
    facts: { formula: "C8H11NO3", molarMass: "169.18 g/mol", chebi: "CHEBI:16709", pubchem: "CID 1054", hmdb: "HMDB0000239" },
    relations: [
      { rel: "substrate-of", to: "enzyme:pdxk" },
      { rel: "precursor-of", to: "compound:plp" },
      { rel: "part-of", to: "compound:vitamin-b6" }
    ],
    refs: ["article:parra-2018-vitamin-b6-metabolism", "article:ueland-2015-b6-biomarkers"]
  },
  {
    id: "compound:plp",
    type: "compound",
    name: "Pyridoxal 5'-phosphate (PLP, P5P)",
    aliases: ["P5P", "P-5-P", "piridoxal-5-fosfato", "pyridoxal phosphate", "active B6", "B6 ativa"],
    summary: "Active B6 coenzyme for transaminases, decarboxylases (GAD, HDC), SHMT, CBS/CTH and the glycine cleavage system.",
    body: [
      "PLP forms a Schiff base with substrate amino acids and enables transamination, decarboxylation, racemisation and beta/gamma-elimination. In this ontology it matters for [[enzyme:gad]] ([[compound:glutamate]] to [[compound:gaba]]), histidine decarboxylase ([[compound:histamine]]), [[enzyme:shmt]] ([[compound:glycine]] and [[compound:serine]]), the glycine cleavage system P-protein ([[enzyme:glycine-cleavage-system|GCS]]), [[enzyme:cbs]] and cystathionine lyase ([[pathway:transsulfuration]]), heme synthesis and serotonin/dopamine synthesis (aromatic amino acid decarboxylase). Oral PLP is dephosphorylated to pyridoxal in the gut and plasma before cellular uptake, then rephosphorylated by [[enzyme:pdxk]], so the supposed 'bypass' is partial.",
      "Evidence note: the conversation attributes anxiolytic and cognitive responses to GAD support. The mechanism is plausible and small trials of B6 for anxiety exist, but responses can also be placebo, and chronic high doses risk neuropathy. See [[intervention:p5p-supplement]]."
    ],
    evidence: "established",
    facts: { formula: "C8H10NO6P", molarMass: "247.14 g/mol", chebi: "CHEBI:18405", pubchem: "CID 1051", hmdb: "HMDB0001491" },
    relations: [
      { rel: "cofactor-of", to: "enzyme:gad" },
      { rel: "cofactor-of", to: "enzyme:shmt" },
      { rel: "cofactor-of", to: "enzyme:glycine-cleavage-system" },
      { rel: "cofactor-of", to: "enzyme:cbs" },
      { rel: "product-of", to: "enzyme:pdxk" },
      { rel: "part-of", to: "compound:vitamin-b6" }
    ]
  },
  {
    id: "compound:kryptopyrrole",
    type: "compound",
    name: "Kryptopyrrole (hydroxyhemopyrrolin-2-one, 'mauve factor')",
    aliases: ["KPU", "pirolúria", "pyroluria", "HPL", "mauve factor"],
    summary: "Urinary pyrrole proposed in the pyroluria hypothesis to bind pyridoxal and zinc; its clinical validity is not established.",
    body: [
      "The pyroluria hypothesis (Pfeiffer, Irvine) proposes that excess urinary pyrrole excretion depletes B6 and zinc and causes psychiatric and neurological symptoms. The urinary assay uses Ehrlich-type colour reactions that react with many substances; the identity of the measured species (hydroxyhemopyrrolin-2-one rather than kryptopyrrole) and its correlation with symptoms are disputed, and good controlled evidence is lacking. It is included here because the source conversation links 'pirolúria/KPU' to functional B6 deficiency ([[state:b6-functional-deficiency]]); treat this as speculative."
    ],
    evidence: "speculative",
    facts: { assay: "Ehrlich-reagent urinary pyrrole (mauve factor)" },
    relations: [
      { rel: "associated-with", to: "state:b6-functional-deficiency", note: "Hypothesised link only" },
      { rel: "interacts-with", to: "compound:plp", note: "Proposed binding of pyridoxal" },
      { rel: "interacts-with", to: "compound:zinc", note: "Proposed co-depletion" },
      { rel: "measured-by", to: "outcome:urinary-hpl", note: "The assay is non-specific and its link to symptoms is disputed." },
      { rel: "associated-with", to: "disease:pyroluria-kpu" }
    ]
  },
  {
    id: "compound:riboflavin",
    type: "compound",
    name: "Riboflavin (vitamin B2)",
    aliases: ["vitamin B2", "riboflavina", "FAD", "FMN", "vitamina B2"],
    summary: "Precursor of FAD and FMN, flavin cofactors of MTHFR, DMGDH, SARDH, CHDH and PNPO, linking it to methylation, choline oxidation and B6 activation.",
    body: [
      "FAD is the cofactor of [[enzyme:mthfr]] (and a stabiliser of the C677T variant), the covalently flavinylated [[enzyme:dmgdh]] and [[enzyme:sardh]], and of glutathione reductase; FMN is needed by PNPO for converting dietary B6 to [[compound:plp]]. Riboflavin supplementation lowers homocysteine in MTHFR 677TT individuals, an established gene-nutrient interaction. RDA is 1.1-1.3 mg; no UL; urine turns bright yellow at supplement doses."
    ],
    evidence: "established",
    facts: { formula: "C17H20N4O6", molarMass: "376.36 g/mol", pubchem: "CID 493570", "dosing-range": "RDA 1.1-1.3 mg; trials 1.6-10 mg for MTHFR 677TT", ul: "None established",
    "chebi": "CHEBI:17015" },
    relations: [
      { rel: "cofactor-of", to: "enzyme:mthfr", note: "As FAD" },
      { rel: "cofactor-of", to: "enzyme:dmgdh", note: "As covalent FAD" },
      { rel: "cofactor-of", to: "enzyme:sardh", note: "As covalent FAD" },
      { rel: "associated-with", to: "compound:plp", note: "FMN needed in the PNPO activation step" },
      { rel: "mitigates", to: "state:hyperhomocysteinemia", note: "In MTHFR 677TT carriers, riboflavin supplementation lowered homocysteine by up to 22% in a randomised trial." }
    ],
    refs: ["article:mcnulty-2006-riboflavin-mthfr"]
  },
  {
    id: "compound:niacin",
    type: "compound",
    name: "Niacin (nicotinic acid, vitamin B3)",
    aliases: ["nicotinic acid", "niacina", "vitamin B3", "vitamina B3", "ácido nicotínico"],
    summary: "NAD precursor; high-dose nicotinic acid lowers LDL but causes flushing and raises methyl-group demand through nicotinamide methylation.",
    body: [
      "Niacin is converted to NAD+ and NADP+. Surplus nicotinamide is methylated by NNMT using [[compound:sam]] to [[compound:1-methylnicotinamide]], excreted in urine, so gram-scale niacin acts as a methyl sink (classic estimates; the quantitative impact on SAM:SAH in people with adequate folate is modest and variable). Nicotinic-acid flushing (prostaglandin D2) limits dosing: UL 10 mg/day in the EU and 35 mg/day (total niacin) in the US. Large slow-release doses cause hepatotoxicity. See [[intervention:niacin-nicotinamide-supplement]]."
    ],
    evidence: "established",
    facts: { formula: "C6H5NO2", molarMass: "123.11 g/mol", chebi: "CHEBI:15940", pubchem: "CID 938", hmdb: "HMDB0001488", ul: "35 mg/day (IOM, total niacin); 10 mg/day nicotinic acid (EU SCF)" },
    relations: [
      { rel: "precursor-of", to: "compound:nicotinamide" },
      { rel: "increases", to: "compound:homocysteine", note: "Reported with gram doses; methyl sink effect" },
      { rel: "interacts-with", to: "compound:sam", note: "Via NNMT consumption of nicotinamide" },
      { rel: "aggravates", to: "state:undermethylation", note: "NNMT uses SAM to methylate nicotinamide, so gram doses add a dose-dependent methyl load; relevance at ordinary doses is not established." },
      { rel: "mitigates", to: "state:overmethylation", note: "Proposed to drain methyl groups through NNMT; the mechanism is real but its use for this purpose is unvalidated." },
      { rel: "aggravates", to: "state:methyl-donor-depletion", note: "Nicotinamide is cleared by NNMT using SAM." }
    ]
  },
  {
    id: "compound:nicotinamide",
    type: "compound",
    name: "Nicotinamide (niacinamide)",
    aliases: ["niacinamide", "nicotinamida", "NAM", "niacinamida"],
    summary: "Amide form of niacin; NAD precursor without flushing, cleared partly by NNMT methylation, hence a methyl sink at large doses.",
    body: [
      "[[enzyme:gnmt]] is not the only major hepatic methyl sink; NNMT methylates nicotinamide using [[compound:sam]] giving [[compound:1-methylnicotinamide]]. At the 100s of mg to g/day used for skin cancer chemoprevention (500 mg twice daily in the ONTRAC trial) or other indications, this can add a measurable load, and high nicotinamide inhibits sirtuins and PARPs. The EU SCF UL is 900 mg/day for nicotinamide; the US UL (35 mg/day) is expressed as total niacin and based on flushing from nicotinic acid. See [[intervention:niacin-nicotinamide-supplement]]."
    ],
    evidence: "established",
    facts: { formula: "C6H6N2O", molarMass: "122.12 g/mol", chebi: "CHEBI:17154", pubchem: "CID 936", hmdb: "HMDB0001406", ul: "900 mg/day (EU SCF 2002)" },
    relations: [
      { rel: "precursor-of", to: "compound:1-methylnicotinamide" },
      { rel: "interacts-with", to: "compound:sam", note: "Consumed as methyl acceptor via NNMT" },
      { rel: "part-of", to: "compound:niacin" }
    ],
    refs: ["article:pissios-2017-nnmt-methyl-sink", "article:chen-2015-nicotinamide-skin-cancer"]
  },
  {
    id: "compound:1-methylnicotinamide",
    type: "compound",
    name: "1-Methylnicotinamide (MNA)",
    aliases: ["MNA", "N1-methylnicotinamide", "1-metilnicotinamida"],
    summary: "Urinary product of NNMT-mediated nicotinamide methylation and a marker of this methyl sink.",
    body: [
      "NNMT transfers a methyl from [[compound:sam]] to [[compound:nicotinamide]], yielding MNA and [[compound:sah]]. MNA is excreted or further oxidised to pyridones. It is used as a readout of NNMT activity and NAD turnover; NNMT is abundant in liver and adipose tissue and elevated in obesity and some cancers. Modest anti-inflammatory activities have been described for MNA itself."
    ],
    evidence: "established",
    facts: { formula: "C7H9N2O+", molarMass: "137.16 g/mol", pubchem: "CID 457",
    "chebi": "CHEBI:16797" },
    relations: [
      { rel: "associated-with", to: "compound:sam", note: "Consumes SAM" }
    ],
    refs: ["article:pissios-2017-nnmt-methyl-sink"]
  },
  {
    id: "compound:creatine",
    type: "compound",
    name: "Creatine",
    aliases: ["creatina", "creatine monohydrate"],
    summary: "Energy-buffer molecule synthesised from glycine, arginine and SAM; its synthesis is one of the largest SAM-methyl consumers, and dietary creatine spares glycine and methyl groups.",
    body: [
      "Kidney AGAT transfers the amidino group of arginine to [[compound:glycine]] giving [[compound:guanidinoacetate]]; liver GAMT then methylates it using [[compound:sam]], releasing [[compound:sah]]. Creatine is phosphorylated to phosphocreatine in muscle and brain (buffering [[compound:atp]]) and spontaneously cyclises to creatinine at about 1.5-2 % of the pool per day, so roughly 1-2 g/day of creatine must be replaced from diet (meat, fish) or synthesis. Classic estimates attributed a large fraction (up to roughly 40 %) of SAM-derived methyl use to creatine synthesis; later estimates are lower but it remains major.",
      "Creatine supplementation (3-5 g/day monohydrate) down-regulates AGAT, which plausibly saves glycine, arginine and methyl groups; small studies saw lower homocysteine. It is well studied and generally safe in healthy adults; kidney disease needs medical review. See [[intervention:creatine-supplement]]."
    ],
    evidence: "established",
    facts: { formula: "C4H9N3O2", molarMass: "131.13 g/mol", chebi: "CHEBI:16919", pubchem: "CID 586", hmdb: "HMDB0000064", "dosing-range": "3-5 g/day monohydrate", pathway: "pathway:creatine-synthesis" },
    relations: [
      { rel: "part-of", to: "pathway:creatine-synthesis" },
      { rel: "decreases", to: "compound:glycine", note: "Synthesis uses glycine" },
      { rel: "decreases", to: "compound:sam", note: "Large methyl consumer" }
    ],
    refs: ["article:stead-2006-methyl-balance-reevaluation", "article:mudd-2007-methyl-balance"]
  },
  {
    id: "compound:guanidinoacetate",
    type: "compound",
    name: "Guanidinoacetate (GAA)",
    aliases: ["glycocyamine", "guanidinoacetic acid", "GAA", "guanidinoacetato", "ácido guanidinoacético"],
    summary: "Intermediate of creatine synthesis formed from glycine and arginine; methylated by GAMT using SAM.",
    body: [
      "AGAT makes GAA from [[compound:glycine]] and arginine (releasing ornithine); GAMT converts it to [[compound:creatine]] and [[compound:sah]] at the expense of [[compound:sam]] ([[pathway:creatine-synthesis]]). GAA is sold as a supplement in sport and animal feed; it raises homocysteine because it consumes SAM, which is a reason for caution in under-methylation scenarios. GAMT deficiency is a rare inborn error causing creatine deficiency."
    ],
    evidence: "established",
    facts: { formula: "C3H7N3O2", molarMass: "117.11 g/mol", pubchem: "CID 763",
    "chebi": "CHEBI:16344" },
    relations: [
      { rel: "precursor-of", to: "compound:creatine" },
      { rel: "increases", to: "compound:homocysteine", note: "Via SAM consumption" },
      { rel: "part-of", to: "pathway:creatine-synthesis" }
    ],
    refs: ["article:brosnan-2007-creatine-review"]
  },
  {
    id: "compound:carnosine",
    type: "compound",
    name: "Carnosine",
    aliases: ["beta-alanyl-L-histidine", "carnosina"],
    summary: "Dipeptide of beta-alanine and histidine abundant in muscle and brain; buffers pH, chelates metals and scavenges reactive aldehydes.",
    body: [
      "Carnosine synthase joins [[compound:beta-alanine]] (limiting) and [[compound:histidine]]; serum carnosinase (CNDP1) hydrolyses circulating carnosine, so oral carnosine mostly arrives as its constituents. Its imidazole group buffers near physiological pH, it binds Cu and [[compound:zinc]], and it traps lipid peroxidation aldehydes. Raising muscle carnosine with [[intervention:beta-alanine-supplement]] improves high-intensity exercise capacity; claims of generalised 'tissue repair' or protection from reactive nitrogen species in the gut are plausible but not clinically demonstrated.",
      "Zinc-carnosine (polaprezinc) is a distinct chelate with local mucosal activity; see [[intervention:zinc-carnosine]]."
    ],
    evidence: "established",
    facts: { formula: "C9H14N4O3", molarMass: "226.23 g/mol", chebi: "CHEBI:15727", pubchem: "CID 439224", hmdb: "HMDB0000033" },
    relations: [
      { rel: "associated-with", to: "intervention:zinc-carnosine", note: "Ligand of the chelate" },
      { rel: "precursor-of", to: "compound:beta-alanine", note: "After carnosinase hydrolysis" },
      { rel: "interacts-with", to: "compound:zinc" }
    ],
    refs: ["article:trexler-2015-issn-beta-alanine"]
  },
  {
    id: "compound:beta-alanine",
    type: "compound",
    name: "Beta-alanine",
    aliases: ["β-alanine", "beta-alanina", "3-aminopropanoic acid"],
    summary: "Non-proteinogenic amino acid that is the rate-limiting precursor of carnosine; high single doses cause paraesthesia and it competes with taurine transport.",
    body: [
      "Endogenously it comes from uracil catabolism and carnosine hydrolysis. As a supplement (3.2-6.4 g/day in divided or sustained-release doses, ISSN position stand) it raises muscle carnosine by about 40-80 % over weeks. Doses above roughly 800 mg at once cause transient tingling via sensory-neuron receptors. It shares the taurine transporter ([[compound:taurine]]) and can lower tissue taurine in animals at high doses. See [[intervention:beta-alanine-supplement]]."
    ],
    evidence: "established",
    facts: { formula: "C3H7NO2", molarMass: "89.09 g/mol", chebi: "CHEBI:16958", pubchem: "CID 239", hmdb: "HMDB0000056", "dosing-range": "3.2-6.4 g/day divided" },
    relations: [
      { rel: "precursor-of", to: "compound:carnosine" },
      { rel: "interacts-with", to: "compound:taurine", note: "Shared transporter" },
      { rel: "part-of", to: "compound:carnosine" }
    ],
    refs: ["article:trexler-2015-issn-beta-alanine"]
  },
  {
    id: "compound:bile-acids",
    type: "compound",
    name: "Bile acids - overview",
    aliases: ["ácidos biliares", "bile salts", "sais biliares"],
    summary: "Cholesterol-derived detergents conjugated in liver with glycine or taurine, secreted in bile, recycled in the enterohepatic circulation and modified by gut bacteria.",
    body: [
      "Primary bile acids (cholic and chenodeoxycholic) are made from cholesterol (CYP7A1) and conjugated by BAAT to [[compound:glycine]] or [[compound:taurine]] (about 3:1 in humans; [[pathway:bile-acid-conjugation]]). Conjugates are secreted into [[system:bile]], emulsify fat in the small intestine and are about 95 % reabsorbed in the ileum, so the large daily flux (tens of grams) costs little net glycine (fecal losses are roughly 0.5 g bile acid/day). Gut bacterial bile salt hydrolases deconjugate them, re-releasing glycine/taurine, and 7-alpha-dehydroxylation forms secondary bile acids (deoxycholic, lithocholic) ([[system:gut-microbiota]]). Overgrowth ([[disease:sibo]]) increases deconjugation and can cause fat malabsorption.",
      "Bile reflux into stomach or oesophagus can injure mucosa. Glycine conjugates are weaker acids (pKa about 4) than taurine conjugates (pKa about 1.5-2) and are more mucosa-damaging in acidic conditions. Claims in the source conversation that glycine loading shifts the conjugation ratio enough to cause irritative reflux belong to the speculative category; ratios are mainly governed by taurine availability."
    ],
    evidence: "established",
    facts: { forms: "cholic, chenodeoxycholic, deoxycholic, lithocholic, ursodeoxycholic; glyco- and tauro-conjugates", "gly-tau-ratio": "about 3:1 in humans" },
    relations: [
      { rel: "part-of", to: "system:bile" },
      { rel: "substrate-of", to: "pathway:bile-acid-conjugation" },
      { rel: "interacts-with", to: "system:gut-microbiota" },
      { rel: "associated-with", to: "disease:sibo" }
    ]
  },
  {
    id: "compound:glycocholic-acid",
    type: "compound",
    name: "Glycocholic acid (glycocholate)",
    aliases: ["glico-colato", "glycocholate", "glyco-conjugated bile acid", "ácido glicocólico", "glicocolato"],
    summary: "Cholic acid conjugated to glycine; the major human bile acid conjugate, more lipophilic and mucosa-irritating than taurine conjugates at low pH.",
    body: [
      "BAAT conjugates cholic acid with [[compound:glycine]] in hepatocyte peroxisomes ([[pathway:bile-acid-conjugation]]). Its pKa is about 4, so at the acidic pH of a stomach affected by duodenogastric reflux it is partly protonated and can enter epithelial cells, which is why acid plus glycine-conjugated bile salts is a damaging combination in oesophageal research. Gut bacterial hydrolases release glycine from it, which re-enters the portal circulation."
    ],
    evidence: "established",
    facts: { formula: "C26H43NO6", molarMass: "465.62 g/mol", chebi: "CHEBI:17687", pubchem: "CID 10140" },
    relations: [
      { rel: "part-of", to: "compound:bile-acids" },
      { rel: "product-of", to: "pathway:bile-acid-conjugation" },
      { rel: "associated-with", to: "disease:gerd", note: "Acid plus bile reflux injury" }
    ],
    refs: ["article:hofmann-2008-bile-acids-biology", "article:sjovall-1959-glycine-taurine-bile-conjugation"]
  },
  {
    id: "compound:taurocholic-acid",
    type: "compound",
    name: "Taurocholic acid (taurocholate)",
    aliases: ["tauro-colato", "taurocholate", "ácido taurocólico", "taurocolato"],
    summary: "Cholic acid conjugated to taurine; fully ionised at gastric pH and a substrate for bacterial deconjugation that releases taurine.",
    body: [
      "BAAT forms taurocholate from cholic acid and [[compound:taurine]] ([[pathway:bile-acid-conjugation]]). Its sulfonate group keeps it ionised even at pH 1-2, making it less able to penetrate acid-exposed mucosa than [[compound:glycocholic-acid]]. Taurine supply shifts the glycine:taurine conjugation ratio; some mouse data link taurine-conjugated bile acids to expansion of sulfite-reducing bacteria, a hypothesis not established in people."
    ],
    evidence: "established",
    facts: { formula: "C26H45NO7S", molarMass: "515.70 g/mol", chebi: "CHEBI:36257", pubchem: "CID 6675" },
    relations: [
      { rel: "part-of", to: "compound:bile-acids" },
      { rel: "product-of", to: "pathway:bile-acid-conjugation" },
      { rel: "interacts-with", to: "system:gut-microbiota", note: "Substrate for bile salt hydrolases" }
    ],
    refs: ["article:hofmann-2008-bile-acids-biology", "article:sjovall-1959-glycine-taurine-bile-conjugation"]
  },
  {
    id: "compound:gastrin",
    type: "compound",
    name: "Gastrin",
    aliases: ["gastrina", "gastrin-17", "gastrin-34"],
    summary: "Antral G-cell hormone that stimulates ECL histamine release and parietal-cell acid secretion; raised by high gastric pH, peptides, aromatic amino acids and PPI therapy.",
    body: [
      "G cells in the gastric antrum release gastrin in response to vagal GRP, distension, luminal peptides and certain amino acids (notably aromatic ones and calcium, sensed through the calcium-sensing receptor), and are restrained by acid through somatostatin from D cells ([[compound:somatostatin]]). Gastrin acts at CCK2 receptors mainly on ECL cells, which release [[compound:histamine]] to drive [[compound:hydrochloric-acid]] secretion ([[pathway:gastric-acid-secretion]]). Chronic hypochlorhydria or [[intervention:ppi-therapy]] raises gastrin (hypergastrinaemia) with ECL hyperplasia and rebound acid hypersecretion on withdrawal. [[disease:h-pylori-infection]] also alters gastrin and acid output.",
      "Evidence note: the conversation states that free glycine and collagen peptides are 'potent' G-cell secretagogues. The gastrin response to protein digestion products is real, but a specific potent effect of glycine or collagen peptides on gastrin in humans is not established, so treat this as speculative. Do not confuse dietary glycine with 'glycine-extended gastrin', a hormone processing intermediate whose C-terminal glycine is removed by PAM to produce amidated gastrin."
    ],
    evidence: "established",
    facts: { type: "Peptide hormone, 17 or 34 amino acids; amidated C-terminus", "gastrin-17-mass": "about 2.1 kDa" },
    relations: [
      { rel: "increases", to: "pathway:gastric-acid-secretion" },
      { rel: "associated-with", to: "state:hypochlorhydria", note: "Rises when acid is low" },
      { rel: "interacts-with", to: "compound:histamine", note: "Acts via ECL histamine release" },
      { rel: "associated-with", to: "system:gastric-physiology" }
    ]
  },
  {
    id: "compound:hydrochloric-acid",
    type: "compound",
    name: "Hydrochloric acid (gastric acid)",
    aliases: ["HCl", "ácido clorídrico", "gastric acid", "ácido gástrico"],
    summary: "Parietal-cell secretion (H+/K+-ATPase) creating gastric pH 1-2; activates pepsin, sterilises ingesta and aids B12, iron, calcium and protein handling.",
    body: [
      "Parietal cells use carbonic anhydrase ([[enzyme:carbonic-anhydrase]]) to form H+ and bicarbonate from CO2 and water; the H+/K+-ATPase pumps H+ into the lumen against a million-fold gradient, with Cl- following, and bicarbonate is exported to blood (the 'alkaline tide'). Stimuli are [[compound:acetylcholine]], [[compound:gastrin]] (via [[compound:histamine]]) and inhibition by [[compound:somatostatin]] and duodenal [[compound:secretin]] feedback ([[pathway:gastric-acid-secretion]]). Basal output is a few mmol/h and stimulated peak 20-40 mmol/h; fasting pH is about 1-2 and rises transiently with meals.",
      "Acid activates pepsinogen to [[compound:pepsin]], releases food-bound [[compound:vitamin-b12]], aids absorption of iron and [[compound:zinc]], and limits upper-GI bacteria; low acid ([[state:hypochlorhydria]]) is associated with bacterial overgrowth ([[disease:sibo]]) though the strength of that link is debated. Acid is also essential to peptic ulcer disease ('no acid, no ulcer'), which is why betaine HCl in a damaged mucosa is a concern ([[intervention:betaine-hcl]])."
    ],
    evidence: "established",
    facts: { formula: "HCl", molarMass: "36.46 g/mol", chebi: "CHEBI:17883", pubchem: "CID 313", "gastric-pH-fasting": "about 1-2" },
    relations: [
      { rel: "product-of", to: "pathway:gastric-acid-secretion" },
      { rel: "increases", to: "compound:pepsin", note: "Activation of pepsinogen" },
      { rel: "aggravates", to: "disease:peptic-ulcer" },
      { rel: "decreases", to: "disease:sibo", note: "Bacterial barrier; evidence moderate" }
    ],
    refs: ["article:schubert-2008-gastric-acid-secretion-control", "article:martinsen-2005-gastric-acid-barrier", "article:fordtran-1973-gastric-buffer-meal"]
  },
  {
    id: "compound:bicarbonate",
    type: "compound",
    name: "Bicarbonate",
    aliases: ["HCO3-", "bicarbonato", "hydrogen carbonate", "bicarbonato de sódio", "sodium bicarbonate", "baking soda", "hidrogenocarbonato"],
    summary: "Buffer base secreted by gastric surface cells, duodenal mucosa (Brunner glands) and pancreas; neutralises acid and, with H+, forms CO2.",
    body: [
      "Bicarbonate is secreted in a mucus gel layer over the gastric epithelium (maintaining near-neutral pH at the cell surface), by duodenal enterocytes (stimulated by prostaglandin E2, [[compound:prostaglandin-e2]]) and by pancreatic ducts in response to [[compound:secretin]]. In the duodenum H+ + HCO3- becomes H2CO3, which carbonic anhydrase ([[enzyme:carbonic-anhydrase]]) converts to water and [[compound:carbon-dioxide]]; most of that CO2 is absorbed locally across the highly permeable mucosa. Most gas generated by this neutralisation therefore enters blood, not the belch.",
      "Evidence note: a chemical effervescence of acid with bicarbonate in the stomach is real when bicarbonate is swallowed (baking soda, some antacids and alginate-carbonate preparations), but for duodenal bicarbonate to generate a gastric-belch volume it would require substantial duodenogastric reflux; this is plausible only in some patients and is not established for glycine users."
    ],
    evidence: "established",
    facts: { formula: "HCO3-", molarMass: "61.02 g/mol", chebi: "CHEBI:17544", pubchem: "CID 769" },
    relations: [
      { rel: "decreases", to: "compound:hydrochloric-acid", note: "Neutralises H+" },
      { rel: "precursor-of", to: "compound:carbon-dioxide", note: "H+ + HCO3- reaction" },
      { rel: "part-of", to: "system:gastric-physiology", note: "Mucus-bicarbonate barrier" }
    ],
    refs: ["article:kaunitz-2006-duodenal-co2-carbonic-anhydrase", "article:allen-2005-mucus-bicarbonate-barrier"]
  },
  {
    id: "compound:carbon-dioxide",
    type: "compound",
    name: "Carbon dioxide (CO2)",
    aliases: ["CO2", "gás carbônico", "dióxido de carbono"],
    summary: "Gas produced when acid meets bicarbonate or carbonated drinks, by glycine decarboxylation in GCS and by bacterial fermentation; rapidly absorbed but distends the stomach if swallowed in bulk.",
    body: [
      "Belched gas is mostly swallowed air (nitrogen and oxygen), with CO2 added from carbonated drinks, from H+ + [[compound:bicarbonate]] and from metabolism. Gastric distension triggers transient lower-oesophageal-sphincter relaxations (TLESR), a vagovagal reflex that vents gas ([[system:lower-esophageal-sphincter]], [[outcome:belching]]); GABA-B agonists such as baclofen reduce them. Supragastric belching, in which air is sucked into the oesophagus and expelled without reaching the stomach, is a distinct behavioural disorder (Rome IV) that often responds to diaphragmatic-breathing therapy, and should be considered whenever belching is the dominant complaint.",
      "In metabolism CO2 is released by [[enzyme:glycine-cleavage-system|GCS]] when [[compound:glycine]] is cleaved, by H. pylori-type urease via urea ([[compound:urea]], [[enzyme:h-pylori-urease|H. pylori urease]]) and by fermentation, but whether any of these produce a clinically relevant gastric CO2 volume after 2-3 g of glycine is unestablished."
    ],
    evidence: "established",
    facts: { formula: "CO2", molarMass: "44.01 g/mol", chebi: "CHEBI:16526", pubchem: "CID 280" },
    relations: [
      { rel: "causes", to: "outcome:belching", note: "Through distension and TLESR when produced or swallowed in bulk" },
      { rel: "product-of", to: "enzyme:glycine-cleavage-system" },
      { rel: "product-of", to: "enzyme:h-pylori-urease" },
      { rel: "product-of", to: "enzyme:carbonic-anhydrase", note: "H2CO3 dehydration" }
    ],
    refs: ["article:stanghellini-2016-rome-iv-gastroduodenal"]
  },
  {
    id: "compound:ammonia",
    type: "compound",
    name: "Ammonia",
    aliases: ["NH3", "NH4+", "amônia"],
    summary: "Nitrogen waste released by deamination, GCS, glutaminase and urease; detoxified to urea in liver and a local acid buffer around H. pylori.",
    body: [
      "Ammonia arises from amino acid catabolism, from the [[enzyme:glycine-cleavage-system|GCS]] reaction (glycine to CO2, NH3 and methylene-THF), from [[compound:glutamine]] hydrolysis and from bacterial urease. In stomach, [[enzyme:h-pylori-urease|H. pylori urease]] hydrolyses [[compound:urea]] to ammonia and [[compound:carbon-dioxide]], raising the pH around the bacterium, which is how H. pylori survives acid ([[disease:h-pylori-infection]]). The liver converts ammonia into urea; failure causes hepatic encephalopathy. The conversation implies H. pylori urease is a leading cause of belching; urease CO2 and NH3 are real but a large causal role in belching is unproven."
    ],
    evidence: "established",
    facts: { formula: "NH3", molarMass: "17.03 g/mol", chebi: "CHEBI:16134", pubchem: "CID 222", hmdb: "HMDB0000051" },
    relations: [
      { rel: "product-of", to: "enzyme:h-pylori-urease" },
      { rel: "product-of", to: "enzyme:glycine-cleavage-system" },
      { rel: "associated-with", to: "disease:h-pylori-infection" }
    ],
    refs: ["article:weeks-2000-urei-h-pylori-urease", "article:kikuchi-2008-glycine-cleavage-system"]
  },
  {
    id: "compound:urea",
    type: "compound",
    name: "Urea",
    aliases: ["ureia", "carbamide"],
    summary: "End product of the urea cycle; its hydrolysis by bacterial urease underlies the 13C-urea breath test for H. pylori.",
    body: [
      "Urea circulates and enters saliva and gastric juice. [[enzyme:h-pylori-urease|H. pylori urease]] splits it to [[compound:ammonia]] and [[compound:carbon-dioxide]]. In the urea breath test the patient drinks 13C- or 14C-labelled urea; labelled CO2 in exhaled breath indicates urease activity and thus infection ([[intervention:h-pylori-testing]]). PPIs, bismuth and recent antibiotics can cause false negatives."
    ],
    evidence: "established",
    facts: { formula: "CH4N2O", molarMass: "60.06 g/mol", pubchem: "CID 1176",
    "chebi": "CHEBI:16199" },
    relations: [
      { rel: "substrate-of", to: "enzyme:h-pylori-urease" },
      { rel: "measured-by", to: "intervention:h-pylori-testing" },
      { rel: "precursor-of", to: "compound:ammonia", note: "Via urease" }
    ],
    refs: ["article:weeks-2000-urei-h-pylori-urease"]
  },
  {
    id: "compound:trimethylamine",
    type: "compound",
    name: "Trimethylamine (TMA)",
    aliases: ["TMA", "trimetilamina"],
    summary: "Volatile fishy-smelling amine produced by gut microbes from choline, carnitine and betaine and oxidised to TMAO by hepatic FMO3.",
    body: [
      "Gut bacterial enzymes (CutC/D for [[compound:choline]], CntA/B for [[compound:l-carnitine]], betaine reductase for [[compound:betaine]]) release TMA, which is absorbed and N-oxidised in liver by FMO3 to [[compound:tmao]]. People with FMO3 deficiency or overload have trimethylaminuria with a fish-like body odour ([[disease:trimethylaminuria]]); the IOM's 3.5 g/day choline UL partly reflects this. Large doses of poorly absorbed free choline salts deliver more substrate to the colon ([[system:gut-microbiota]]) than phospholipid-bound forms."
    ],
    evidence: "established",
    facts: { formula: "C3H9N", molarMass: "59.11 g/mol", chebi: "CHEBI:18139", pubchem: "CID 1146", hmdb: "HMDB0000906" },
    relations: [
      { rel: "precursor-of", to: "compound:tmao" },
      { rel: "causes", to: "disease:trimethylaminuria", note: "When FMO3 capacity is exceeded or deficient" }
    ]
  },
  {
    id: "compound:tmao",
    type: "compound",
    name: "Trimethylamine N-oxide (TMAO)",
    aliases: ["TMAO", "óxido de trimetilamina"],
    summary: "Hepatic oxidation product of TMA; elevated levels associate with cardiovascular and renal risk in cohorts, though causality remains debated.",
    body: [
      "FMO3 in liver oxidises [[compound:trimethylamine]] to TMAO, which is renally cleared. Wang (2011) and Koeth (2013) linked microbial metabolism of [[compound:phosphatidylcholine]] and [[compound:l-carnitine]] to atherosclerosis in mice and to higher TMAO with cardiovascular events in people. Fish and seafood contain preformed TMAO and also raise plasma TMAO without evidence of harm, which complicates interpretation. Whether lowering TMAO is beneficial is untested in randomised trials. It does not make moderate choline intake harmful by itself; the conversation's description of TMAO as a 'strong marker of endothelial stress' overstates what is known."
    ],
    evidence: "plausible",
    facts: { formula: "C3H9NO", molarMass: "75.11 g/mol", chebi: "CHEBI:15724", pubchem: "CID 1145", hmdb: "HMDB0000925" },
    relations: [
      { rel: "associated-with", to: "system:gut-microbiota" },
      { rel: "associated-with", to: "compound:phosphatidylcholine", note: "Dietary precursor route" }
    ],
    refs: ["article:wang-2011-gut-flora-phosphatidylcholine-cvd", "article:koeth-2013-carnitine-tmao-atherosclerosis"]
  },
  {
    id: "compound:l-carnitine",
    type: "compound",
    name: "L-Carnitine",
    aliases: ["carnitina", "levocarnitine", "L-carnitina"],
    summary: "Carrier of long-chain fatty acids into mitochondria, made from lysine and methionine (three SAM methyls) and a gut-microbial TMA precursor.",
    body: [
      "Carnitine is synthesised from protein-bound trimethyllysine (methylated by [[compound:sam]], three methyl groups per molecule) and obtained from red meat and dairy. Gut microbes convert surplus carnitine to [[compound:trimethylamine]] and thus [[compound:tmao]] (Koeth 2013). Its biosynthesis is a minor but real SAM sink."
    ],
    evidence: "established",
    facts: { formula: "C7H15NO3", molarMass: "161.20 g/mol", pubchem: "CID 10917",
    "chebi": "CHEBI:16347" },
    relations: [
      { rel: "precursor-of", to: "compound:trimethylamine", note: "Via gut microbial CntA/B" },
      { rel: "associated-with", to: "compound:methionine", note: "Biosynthesis uses lysine and methionine-derived SAM methyls" },
      { rel: "interacts-with", to: "compound:sam", note: "Biosynthesis consumes three methyls" },
      { rel: "part-of", to: "pathway:tma-tmao-axis", note: "Gut bacteria can cleave carnitine to TMA." },
      { rel: "interacts-with", to: "system:gut-microbiota" },
      { rel: "associated-with", to: "disease:cardiovascular-disease", note: "Carnitine-TMAO link reported in cohorts and mice; causality debated." }
    ],
    refs: ["article:koeth-2013-carnitine-tmao-atherosclerosis"]
  },
  {
    id: "compound:pepsin",
    type: "compound",
    name: "Pepsin",
    aliases: ["pepsina", "pepsinogen"],
    summary: "Gastric protease activated from pepsinogen by acid, optimal at pH 1.5-2.5 and irreversibly denatured at neutral pH; refluxed pepsin is proposed to injure laryngeal tissue in LPR.",
    body: [
      "Chief cells secrete pepsinogen; [[compound:hydrochloric-acid]] converts it to active pepsin, which cleaves peptide bonds next to hydrophobic and aromatic residues and begins protein digestion. Native triple-helical collagen is largely resistant to pepsin (the telopeptides are cleaved), whereas gelatin and hydrolysed [[compound:collagen]] are digestible, so cooking denatures collagen into gelatin and makes it more readily digestible. Pepsin is stable but inactive at pH 4-6.5 and can be reactivated by re-acidification; above about pH 7 it is irreversibly denatured.",
      "Laryngopharyngeal reflux research suggests that refluxed pepsin is taken up by laryngeal epithelial cells by receptor-mediated endocytosis and reactivated in acidic intracellular compartments, reducing protective proteins (Johnston 2007). Salivary pepsin tests are used as markers but have modest accuracy. Claims that alkaline rinses or alginate 'deactivate pepsin on the throat' are mechanistically plausible but clinical benefit is not well demonstrated ([[intervention:bicarbonate-rinse]], [[intervention:sodium-alginate]], [[disease:lpr]])."
    ],
    evidence: "established",
    facts: { type: "Aspartic protease; pepsin A about 34.6 kDa", "pH-optimum": "1.5-2.5; irreversible denaturation above about pH 7" },
    relations: [
      { rel: "increases", to: "disease:lpr", note: "Proposed mechanism of laryngeal injury" },
      { rel: "associated-with", to: "compound:hydrochloric-acid", note: "Pepsinogen activation requires acid" },
      { rel: "associated-with", to: "outcome:throat-burning" },
      { rel: "associated-with", to: "compound:collagen", note: "Digests denatured but not native collagen" }
    ],
    refs: ["article:johnston-2006-pepsin-laryngeal-epithelium"]
  },
  {
    id: "compound:hydroxyproline",
    type: "compound",
    name: "Hydroxyproline (4-hydroxy-L-proline)",
    aliases: ["Hyp", "hidroxiprolina", "trans-4-hydroxy-L-proline"],
    summary: "Collagen-specific amino acid made post-translationally by vitamin C-dependent prolyl hydroxylase; its catabolism yields glycine and, partly, oxalate.",
    body: [
      "Proline residues in collagen are hydroxylated by prolyl 4-hydroxylase (needs Fe2+, ascorbate, alpha-ketoglutarate and O2); free Hyp is released only by collagen breakdown and is a urinary marker of bone/connective turnover. Hyp oxidase converts it eventually to glyoxylate and pyruvate; glyoxylate can be transaminated to [[compound:glycine]] or oxidised to [[compound:oxalate]]. Controlled feeding studies show gelatin or hydroxyproline loads raise urinary oxalate and glycolate (Knight 2006), a point of caution for kidney-stone formers using high-dose [[intervention:collagen-peptides]]."
    ],
    evidence: "established",
    facts: { formula: "C5H9NO3", molarMass: "131.13 g/mol", chebi: "CHEBI:18095", pubchem: "CID 5810", hmdb: "HMDB0000725" },
    relations: [
      { rel: "part-of", to: "compound:collagen" },
      { rel: "precursor-of", to: "compound:glycine", note: "Via glyoxylate transamination" },
      { rel: "precursor-of", to: "compound:oxalate" },
      { rel: "product-of", to: "pathway:collagen-synthesis" }
    ],
    refs: ["article:knight-2006-hydroxyproline-oxalate"]
  },
  {
    id: "compound:proline",
    type: "compound",
    name: "L-Proline",
    aliases: ["Pro", "prolina"],
    summary: "Cyclic amino acid abundant in collagen (frequently the X position of Gly-X-Y triplets), made from glutamate or ornithine and hydroxylated to hydroxyproline.",
    body: [
      "Proline is synthesised from [[compound:glutamate]] (via P5C synthase) or ornithine. About 12 % of collagen residues are proline and a similar share hydroxyproline; collagen peptides in blood include the dipeptide Pro-Hyp, which has signalling activity in fibroblasts in vitro (Iwai 2005 identified such food-derived peptides). Proline is absorbed by the same PAT1/IMINO transporters as [[compound:glycine]] and sarcosine."
    ],
    evidence: "established",
    facts: { formula: "C5H9NO2", molarMass: "115.13 g/mol", chebi: "CHEBI:17203", pubchem: "CID 145742", hmdb: "HMDB0000162" },
    relations: [
      { rel: "part-of", to: "compound:collagen" },
      { rel: "precursor-of", to: "compound:hydroxyproline" }
    ],
    refs: ["article:iwai-2005-collagen-peptides-blood"]
  },
  {
    id: "compound:collagen",
    type: "compound",
    name: "Collagen",
    aliases: ["colágeno", "gelatin precursor", "collagen peptides", "colágeno hidrolisado"],
    summary: "Triple-helical structural protein built from Gly-X-Y repeats; gelatin is its denatured form and collagen peptides its enzymatic hydrolysate.",
    body: [
      "Collagen α-chains repeat Gly-X-Y, with [[compound:glycine]] at every third position (about one third of residues, roughly a fifth to a quarter of mass), [[compound:proline]] and [[compound:hydroxyproline]] frequent in X and Y. Synthesis ([[pathway:collagen-synthesis]]) needs vitamin C, iron, copper (lysyl oxidase) and large glycine supply. Collagen lacks tryptophan and is a nutritionally incomplete protein. Native helix is pepsin-resistant; cooking forms soluble gelatin, and hydrolysis gives small peptides (typically 2-5 kDa) that are largely absorbed intact as di- and tripeptides such as Pro-Hyp and Hyp-Gly (Iwai 2005), without needing gastric pepsin.",
      "Hydrolysed collagen at 2.5-15 g/day has modest, industry-funded evidence for skin hydration/elasticity and joint pain; the evidence for a specific benefit over any protein is weak. The source conversation suggests collagen peptides need large peptic cleavage; that holds for gelatin or native collagen, much less for hydrolysates. See [[intervention:collagen-peptides]], [[compound:collagen-type-ii]]; whole-food sources are covered at [[intervention:dietary-glycine-sources]]."
    ],
    evidence: "established",
    facts: { composition: "Gly about 33 mol %, Pro about 12 %, Hyp about 10 %; no tryptophan", "dosing-range": "2.5-15 g/day hydrolysate in trials" },
    relations: [
      { rel: "product-of", to: "pathway:collagen-synthesis" },
      { rel: "precursor-of", to: "compound:glycine", note: "Digestion releases glycine" },
      { rel: "interacts-with", to: "compound:pepsin", note: "Only after denaturation" }
    ],
    refs: ["article:iwai-2005-collagen-peptides-blood", "article:clark-2008-collagen-hydrolysate"]
  },
  {
    id: "compound:collagen-type-ii",
    type: "compound",
    name: "Type II collagen (undenatured and hydrolysed)",
    aliases: ["colágeno tipo 2", "UC-II", "undenatured type II collagen", "chicken sternum collagen", "colágeno tipo 2 em pó"],
    summary: "Cartilage collagen sold either as milligram-dose undenatured form (oral tolerance claim) or gram-dose hydrolysate; the two behave differently.",
    body: [
      "Undenatured type II collagen (UC-II) is dosed at about 40 mg/day, a trivially small glycine load (roughly 10 mg); its proposed mechanism is oral tolerance via gut-associated lymphoid tissue, with small trials in knee osteoarthritis symptoms (Lugo 2016). Hydrolysed type II collagen is taken at about 1-10 g/day and behaves like other [[compound:collagen]] hydrolysates. Because glycine delivery from UC-II is minimal, a glycine-load explanation of any belching with a 40 mg product is unlikely; the product's other ingredients (excipients, sweeteners, capsule fill) are likelier culprits.",
      "Evidence: modest, mostly manufacturer-sponsored trials. See [[intervention:type-ii-collagen]]."
    ],
    evidence: "plausible",
    facts: { "dosing-range": "UC-II 40 mg/day; hydrolysed 1-10 g/day" },
    relations: [
      { rel: "part-of", to: "compound:collagen" },
      { rel: "precursor-of", to: "compound:glycine", note: "Negligible at 40 mg doses" },
      { rel: "associated-with", to: "intervention:type-ii-collagen" },
      { rel: "associated-with", to: "disease:osteoarthritis" },
      { rel: "associated-with", to: "pathway:collagen-synthesis" }
    ],
    refs: ["article:lugo-2016-uc-ii-knee-osteoarthritis"]
  },
  {
    id: "compound:magnesium",
    type: "compound",
    name: "Magnesium",
    aliases: ["Mg", "Mg2+", "magnésio"],
    summary: "Divalent cation required with ATP in most kinase and ATPase reactions including MAT; low in PPI users and measured poorly by serum levels.",
    body: [
      "As Mg-ATP, magnesium is the real substrate of [[enzyme:mat]] (making [[compound:sam]]), pyridoxal kinase ([[enzyme:pdxk]]) and hundreds of other enzymes; it also modulates NMDA and GABA-A receptors. Intake adequacy is common; deficiency risks include chronic [[intervention:ppi-therapy]] (FDA 2011 warning for hypomagnesaemia), diuretics, alcohol and malabsorption. Supplemental UL is 350 mg/day (IOM, supplements only) or 250 mg/day (EU SCF), set because of osmotic diarrhoea. Serum magnesium is an insensitive indicator of tissue stores.",
      "Evidence note: the conversation says Mg is the 'obligatory cofactor of MAT'. True in the Mg-ATP sense, but ordinary dietary magnesium is not rate-limiting for SAM synthesis outside overt deficiency. Forms differ: [[intervention:magnesium-malate]], [[intervention:magnesium-l-threonate]], [[intervention:magnesium-glycinate]]."
    ],
    evidence: "established",
    facts: { symbol: "Mg2+", molarMass: "24.305 g/mol", chebi: "CHEBI:18420", pubchem: "CID 888", ul: "350 mg/day supplemental (IOM); 250 mg/day (EU SCF)" },
    relations: [
      { rel: "cofactor-of", to: "enzyme:mat" },
      { rel: "cofactor-of", to: "enzyme:pdxk" },
      { rel: "associated-with", to: "state:b6-functional-deficiency", note: "PDXK uses Mg-ATP" },
      { rel: "interacts-with", to: "compound:atp" }
    ],
    refs: ["article:cheungpasitporn-2015-ppi-hypomagnesemia"]
  },
  {
    id: "compound:zinc",
    type: "compound",
    name: "Zinc",
    aliases: ["Zn", "Zn2+", "zinco"],
    summary: "Essential trace metal in carbonic anhydrase, BHMT, methionine synthase, alcohol dehydrogenase and PDXK; gastric acid helps its absorption.",
    body: [
      "[[enzyme:bhmt]], [[enzyme:mtr]], [[enzyme:carbonic-anhydrase]] (needed for parietal-cell [[compound:hydrochloric-acid]] production) and [[enzyme:pdxk]] are zinc enzymes, tying zinc status to methylation, acid secretion and B6 activation. Zinc is also a mucosal-healing nutrient and is delivered as zinc-carnosine ([[intervention:zinc-carnosine]]). Excess zinc causes copper deficiency; the UL is 40 mg/day (IOM) or 25 mg/day (EU SCF). Taken on an empty stomach it commonly causes nausea. Zinc and B6 co-depletion is a pillar of the speculative pyroluria hypothesis ([[compound:kryptopyrrole]]). Supplement notes: [[intervention:zinc-supplement]]."
    ],
    evidence: "established",
    facts: { symbol: "Zn2+", molarMass: "65.38 g/mol", chebi: "CHEBI:29105", "dosing-range": "RDA 8-11 mg; supplements 15-30 mg typical", ul: "40 mg/day (IOM); 25 mg/day (EU SCF)" },
    relations: [
      { rel: "cofactor-of", to: "enzyme:bhmt" },
      { rel: "cofactor-of", to: "enzyme:mtr" },
      { rel: "cofactor-of", to: "enzyme:carbonic-anhydrase" },
      { rel: "cofactor-of", to: "enzyme:pdxk" }
    ],
    refs: ["article:plum-2010-zinc-human-health", "article:iom-2001-micronutrients-zinc"]
  },
  {
    id: "compound:atp",
    type: "compound",
    name: "Adenosine triphosphate (ATP)",
    aliases: ["ATP", "adenosina trifosfato"],
    summary: "Cellular energy currency and, uniquely, the adenosyl donor for SAM synthesis (MAT consumes the full triphosphate chain).",
    body: [
      "[[enzyme:mat]] transfers the adenosyl moiety of ATP onto [[compound:methionine]], releasing inorganic pyrophosphate and phosphate, thus consuming all three phosphates. ATP also powers the parietal-cell H+/K+-ATPase ([[compound:hydrochloric-acid]]), creatine phosphorylation ([[compound:creatine]]), choline kinase ([[compound:phosphocholine]]) and glutathione synthesis; its Mg2+ chelate is the substrate form ([[compound:magnesium]])."
    ],
    evidence: "established",
    facts: { formula: "C10H16N5O13P3", molarMass: "507.18 g/mol", chebi: "CHEBI:15422", pubchem: "CID 5957", hmdb: "HMDB0000538" },
    relations: [
      { rel: "substrate-of", to: "enzyme:mat" },
      { rel: "precursor-of", to: "compound:sam" },
      { rel: "interacts-with", to: "compound:magnesium" }
    ],
    refs: ["article:rhea-2022", "article:chebi-2016"]
  },
  {
    id: "compound:serotonin",
    type: "compound",
    name: "Serotonin (5-HT)",
    aliases: ["5-HT", "5-hidroxitriptamina", "serotonina"],
    summary: "Most serotonin is made by gut enterochromaffin cells (TPH1) and drives peristalsis via 5-HT4 and nausea via 5-HT3 receptors.",
    body: [
      "Enterochromaffin cells release 5-HT in response to luminal stimuli and the vagus; 5-HT4 receptors on enteric neurons facilitate acetylcholine release and propulsion ([[system:enteric-nervous-system]]), the target of prokinetics ([[intervention:prokinetic-drugs]]); 5-HT3 antagonists (ondansetron) suppress nausea. Brain synthesis needs [[compound:plp]] for aromatic amino acid decarboxylase. Gingerols have 5-HT3 antagonist activity in vitro ([[compound:gingerols]]); an effect on 5-HT4 or on the migrating motor complex, as asserted in the conversation, is not demonstrated."
    ],
    evidence: "established",
    facts: { formula: "C10H12N2O", molarMass: "176.21 g/mol", pubchem: "CID 5202",
    "chebi": "CHEBI:28790" },
    relations: [
      { rel: "increases", to: "system:enteric-nervous-system", note: "5-HT4 facilitation of motility" },
      { rel: "associated-with", to: "system:gastric-physiology" },
      { rel: "associated-with", to: "compound:gingerols", note: "5-HT3 antagonism (in vitro)" }
    ],
    refs: ["article:gershon-2007-serotonin-gi"]
  },
  {
    id: "compound:prostaglandin-e2",
    type: "compound",
    name: "Prostaglandin E2 (PGE2)",
    aliases: ["PGE2", "prostaglandina E2", "prostaglandinas"],
    summary: "COX-derived mediator that stimulates mucus and bicarbonate secretion, increases mucosal blood flow and reduces acid; depleted by NSAIDs.",
    body: [
      "Gastric mucosal PGE2 (largely via COX-1) acts on EP receptors to enhance the mucus-bicarbonate barrier ([[compound:gastric-mucus]], [[compound:bicarbonate]]), maintain blood flow and inhibit parietal-cell acid secretion. NSAIDs deplete it, which explains NSAID ulcers, and misoprostol (a PGE1 analogue) replaces it. Herbal mucosal protectants such as [[intervention:espinheira-santa]] and [[intervention:dgl-licorice]] are proposed to act partly through prostaglandin or mucus effects; the human data are limited."
    ],
    evidence: "established",
    facts: { formula: "C20H32O5", molarMass: "352.5 g/mol", pubchem: "CID 5280360",
    "chebi": "CHEBI:15551" },
    relations: [
      { rel: "increases", to: "compound:gastric-mucus" },
      { rel: "decreases", to: "disease:peptic-ulcer" },
      { rel: "decreases", to: "pathway:gastric-acid-secretion" }
    ],
    refs: ["article:allen-2005-mucus-bicarbonate-barrier"]
  },
  {
    id: "compound:gastric-mucus",
    type: "compound",
    name: "Gastric mucus (MUC5AC/MUC6 gel)",
    aliases: ["muco gástrico", "mucus barrier", "mucin"],
    summary: "Adherent gel of MUC5AC and MUC6 mucins trapping bicarbonate, keeping the epithelial surface near pH 7 against a lumen of pH 1-2.",
    body: [
      "Surface mucous cells secrete MUC5AC and neck cells MUC6; together with HCO3- ([[compound:bicarbonate]]) they create a pH gradient. Stimuli include [[compound:prostaglandin-e2]], vagal [[compound:acetylcholine]] and luminal factors; damage from NSAIDs, alcohol, bile and [[disease:h-pylori-infection]] thins the layer. Agents claimed to enhance it include [[intervention:dgl-licorice]], [[intervention:espinheira-santa]] and [[intervention:zinc-carnosine]] (the latter has the best human data, in Japan)."
    ],
    evidence: "established",
    facts: { components: "MUC5AC, MUC6, bicarbonate, trefoil peptides, phospholipids" },
    relations: [
      { rel: "decreases", to: "disease:peptic-ulcer", note: "Protective barrier" },
      { rel: "part-of", to: "system:gastric-physiology" },
      { rel: "decreases", to: "compound:hydrochloric-acid", note: "Local neutralisation at surface" }
    ],
    refs: ["article:allen-2005-mucus-bicarbonate-barrier"]
  },
  {
    id: "compound:somatostatin",
    type: "compound",
    name: "Somatostatin",
    aliases: ["SST", "somatostatina"],
    summary: "Peptide from antral/oxyntic D cells that inhibits gastrin, histamine and parietal-cell acid secretion; its loss in H. pylori antral gastritis contributes to hyperacidity.",
    body: [
      "Luminal acid stimulates D cells to release somatostatin, which suppresses [[compound:gastrin]] from G cells (negative feedback), ECL [[compound:histamine]] release and [[compound:hydrochloric-acid]] secretion directly ([[pathway:gastric-acid-secretion]]). When pH rises, this brake lifts and gastrin climbs, one reason PPIs cause hypergastrinaemia. H. pylori antral infection reduces D-cell somatostatin, one route to duodenal-ulcer-associated acid excess ([[disease:h-pylori-infection]], [[disease:peptic-ulcer]])."
    ],
    evidence: "established",
    facts: { type: "Peptide, 14 or 28 amino acids" },
    relations: [
      { rel: "decreases", to: "compound:gastrin" },
      { rel: "decreases", to: "pathway:gastric-acid-secretion" },
      { rel: "associated-with", to: "disease:h-pylori-infection" },
      { rel: "decreases", to: "system:gastric-g-cells", note: "Paracrine brake on gastrin release as the stomach acidifies." }
    ],
    refs: ["article:schubert-2008-gastric-acid-secretion-control"]
  },
  {
    id: "compound:secretin",
    type: "compound",
    name: "Secretin",
    aliases: ["secretina"],
    summary: "Duodenal S-cell hormone released when duodenal pH falls below about 4.5; stimulates pancreatic and biliary bicarbonate and inhibits gastric acid, gastrin and motility.",
    body: [
      "Acid entering the duodenum triggers secretin release, which drives pancreatic duct [[compound:bicarbonate]] secretion (the neutralising reflex) and slows gastric emptying and acid output ([[pathway:gastric-acid-secretion]]). Secretin is therefore part of the feedback that links acid delivery, bicarbonate and CO2 formation in the duodenum. It is not the trigger of the migrating motor complex; the conversation lumps secretin with [[compound:motilin]] in that role, which overstates secretin's part."
    ],
    evidence: "established",
    facts: { type: "27-amino-acid peptide hormone" },
    relations: [
      { rel: "increases", to: "compound:bicarbonate" },
      { rel: "decreases", to: "pathway:gastric-acid-secretion" },
      { rel: "associated-with", to: "system:gastric-physiology" }
    ],
    refs: ["article:schubert-2008-gastric-acid-secretion-control"]
  },
  {
    id: "compound:motilin",
    type: "compound",
    name: "Motilin",
    aliases: ["motilina"],
    summary: "Upper-gut peptide released in cycles during fasting, initiating phase III of the migrating motor complex; erythromycin is a motilin-receptor agonist.",
    body: [
      "Motilin from duodenal M cells peaks roughly every 90-120 minutes in the fasted state, coinciding with phase III of the migrating motor complex (MMC), the 'housekeeper' wave that sweeps residue from stomach to ileum and may limit bacterial build-up (reduced MMC is associated with [[disease:sibo]]). Feeding abolishes the cycle. Erythromycin and related motilides trigger gastric contractions via the motilin receptor ([[intervention:prokinetic-drugs]]). The statement that acid in the duodenum is what triggers motilin and the MMC, so that PPIs make the gut 'lazy', is not an established mechanism."
    ],
    evidence: "established",
    facts: { type: "22-amino-acid peptide hormone" },
    relations: [
      { rel: "increases", to: "system:enteric-nervous-system", note: "Initiates MMC phase III" },
      { rel: "decreases", to: "disease:sibo", note: "Via MMC clearing, evidence moderate" },
      { rel: "associated-with", to: "state:gastric-dysmotility" },
      { rel: "increases", to: "pathway:migrating-motor-complex", note: "Triggers antral phase III of the fasting cycle." }
    ],
    refs: ["article:mondal-2017-duodenal-ph-mmc-motilin"]
  },
  {
    id: "compound:hippuric-acid",
    type: "compound",
    name: "Hippuric acid (benzoylglycine)",
    aliases: ["hippurate", "benzoylglycine", "ácido hipúrico"],
    summary: "Glycine conjugate of benzoate formed in mitochondria; benzoate loading consumes glycine, which is exploited therapeutically in glycine encephalopathy.",
    body: [
      "Benzoate (from diet, preservatives, toluene or gut metabolism of polyphenols) is conjugated to [[compound:glycine]] by glycine N-acyltransferase and excreted as hippurate. Sodium benzoate is used to lower glycine in non-ketotic hyperglycinaemia and ammonia in urea-cycle disorders. For ordinary diets the glycine drain is small (about 0.6 g glycine per gram benzoate), but it is one of several glycine sinks alongside [[compound:glutathione]], [[compound:creatine]] and [[pathway:bile-acid-conjugation]]."
    ],
    evidence: "established",
    facts: { formula: "C9H9NO3", molarMass: "179.17 g/mol", pubchem: "CID 464",
    "chebi": "CHEBI:18089" },
    relations: [
      { rel: "decreases", to: "compound:glycine", note: "Conjugation consumes glycine" },
      { rel: "associated-with", to: "system:gut-microbiota", note: "Microbial polyphenol metabolism supplies benzoate" }
    ],
    refs: ["article:wang-2013-glycine-metabolism"]
  },
  {
    id: "compound:methylmalonic-acid",
    type: "compound",
    name: "Methylmalonic acid (MMA)",
    aliases: ["MMA", "ácido metilmalônico"],
    summary: "Metabolite that accumulates when adenosylcobalamin-dependent methylmalonyl-CoA mutase is impaired; the best functional marker of B12 status along with homocysteine.",
    body: [
      "Serum or urinary MMA rises in B12 deficiency before serum B12 becomes clearly low, and is also raised by renal impairment, bacterial overgrowth that produces propionate and genetic defects. Combining MMA with [[compound:homocysteine]] helps distinguish B12 from folate deficiency (both raise Hcy, only B12 raises MMA). See [[intervention:homocysteine-mma-testing]] and [[compound:adenosylcobalamin]]."
    ],
    evidence: "established",
    facts: { formula: "C4H6O4", molarMass: "118.09 g/mol", pubchem: "CID 487", "reference-range": "serum about 0.07-0.27 micromol/L, lab dependent",
    "chebi": "CHEBI:30860" },
    relations: [
      { rel: "measured-by", to: "intervention:homocysteine-mma-testing" },
      { rel: "associated-with", to: "compound:vitamin-b12" },
      { rel: "associated-with", to: "disease:sibo", note: "Bacterial propionate can raise MMA" }
    ],
    refs: ["article:stabler-2013-vitamin-b12-deficiency", "article:refsum-2004-homocysteine-recommendations"]
  },
  {
    id: "compound:oxalate",
    type: "compound",
    name: "Oxalate",
    aliases: ["oxalic acid", "oxalato", "ácido oxálico"],
    summary: "End product from glyoxylate, ascorbate and hydroxyproline; elevated urinary oxalate drives calcium-oxalate stones.",
    body: [
      "About half or more of urinary oxalate is endogenous, from glyoxylate derived from [[compound:glycine]] (via glycine oxidase and transamination), [[compound:hydroxyproline]] and ascorbate. Hydroxyproline-rich gelatin or [[compound:collagen]] loads raise urinary oxalate acutely in feeding studies (Knight 2006). People with a history of calcium-oxalate stones, primary hyperoxaluria or enteric hyperoxaluria should be cautious with large doses of collagen and glycine ([[intervention:glycine-powder]], [[intervention:collagen-peptides]])."
    ],
    evidence: "established",
    facts: { formula: "C2H2O4", molarMass: "90.03 g/mol", pubchem: "CID 971",
    "chebi": "CHEBI:16995" },
    relations: [
      { rel: "associated-with", to: "intervention:collagen-peptides", note: "Caution in stone formers" }
    ],
    refs: ["article:knight-2006-hydroxyproline-oxalate"]
  },
  {
    id: "compound:carvacrol",
    type: "compound",
    name: "Carvacrol",
    aliases: ["carvacrol", "oregano phenol", "timol e carvacrol"],
    summary: "Phenolic monoterpene of oregano oil with in vitro antimicrobial action and TRPA1/TRPV3 irritant activity.",
    body: [
      "Carvacrol (with its isomer thymol) disrupts bacterial membranes in vitro at sub-mg/mL concentrations and is the main active in [[intervention:oregano-oil]]. It activates TRPA1/TRPV3 sensory channels, so pungency and burning in the mouth, throat or oesophagus are expected, particularly in inflamed mucosa such as in [[disease:lpr]] or oesophagitis. Human trial data on gastrointestinal bacterial overgrowth are minimal."
    ],
    evidence: "plausible",
    facts: { formula: "C10H14O", molarMass: "150.22 g/mol", pubchem: "CID 10364",
    "chebi": "CHEBI:3440" },
    relations: [
      { rel: "aggravates", to: "outcome:throat-burning", note: "Irritant on inflamed mucosa" },
      { rel: "decreases", to: "disease:sibo", note: "In vitro / limited clinical data" },
      { rel: "interacts-with", to: "system:gut-microbiota" }
    ]
  },
  {
    id: "compound:gingerols",
    type: "compound",
    name: "Gingerols and shogaols",
    aliases: ["[6]-gingerol", "6-shogaol", "gingeróis", "ginger pungent compounds"],
    summary: "Pungent phenolics of ginger with 5-HT3 antagonism, TRPV1 agonism and modest effects on gastric emptying.",
    body: [
      "[6]-Gingerol converts to [6]-shogaol on drying or heating. Mechanisms proposed include 5-HT3 and muscarinic M3 antagonism, TRPV1 activation and anti-inflammatory COX effects. Human trials show faster gastric emptying with about 1.2 g ginger in functional dyspepsia (Wu 2008), antiemetic activity for nausea and pregnancy nausea. Evidence for 5-HT4 agonism or MMC stimulation is lacking. See [[intervention:ginger-extract]]."
    ],
    evidence: "plausible",
    facts: { formula: "C17H26O4", molarMass: "294.39 g/mol", pubchem: "CID 442793", "dosing-range": "0.5-2 g ginger root/day in trials",
    "chebi": "CHEBI:10136" },
    relations: [
      { rel: "increases", to: "system:gastric-physiology", note: "Faster gastric emptying in small trials" },
      { rel: "mitigates", to: "state:gastric-dysmotility" },
      { rel: "interacts-with", to: "compound:serotonin", note: "5-HT3 antagonism" }
    ],
    refs: ["article:wu-2008-ginger-gastric-emptying"]
  },
  {
    id: "compound:cynarin",
    type: "compound",
    name: "Cynarin (1,3-dicaffeoylquinic acid)",
    aliases: ["cinarina", "cynarine", "artichoke caffeoylquinic acids"],
    summary: "Characteristic caffeoylquinic acid of artichoke leaf extract, with chlorogenic acid and luteolin implicated in choleretic and antioxidant effects.",
    body: [
      "Cynarin is present in artichoke at low concentrations (and partly formed during extraction), and the choleretic and lipid-lowering effects of [[intervention:artichoke-leaf-extract]] cannot be attributed to it alone. In humans, artichoke leaf extract (about 320-640 mg three times daily) improved functional dyspepsia symptom scores in a randomised trial (Holtmann 2003). Bile duct obstruction or gallstones with obstruction contraindicate it. Interaction with [[system:bile]] flow explains the proposed benefit for digestion."
    ],
    evidence: "plausible",
    facts: { formula: "C25H24O12", molarMass: "516.4 g/mol", pubchem: "CID 5281769",
    "chebi": "CHEBI:520" },
    relations: [
      { rel: "increases", to: "system:bile", note: "Choleretic effect" },
      { rel: "mitigates", to: "state:gastric-dysmotility", note: "Dyspepsia symptom trial evidence" },
      { rel: "part-of", to: "intervention:artichoke-leaf-extract" },
      { rel: "associated-with", to: "disease:functional-dyspepsia", note: "Extract trial in dyspepsia; the role of cynarin itself is untested." }
    ],
    refs: ["article:holtmann-2003-artichoke-leaf-functional-dyspepsia"]
  },
  {
    id: "compound:glycyrrhizin",
    type: "compound",
    name: "Glycyrrhizin (and glycyrrhetinic acid)",
    aliases: ["glicirrizina", "glycyrrhizic acid", "licorice saponin", "ácido glicirrízico"],
    summary: "Sweet saponin of licorice root; its aglycone inhibits 11-beta-HSD2, causing sodium retention, hypokalaemia and hypertension, and is removed in DGL.",
    body: [
      "Glycyrrhetinic acid blocks 11-beta-hydroxysteroid dehydrogenase type 2, letting cortisol activate renal mineralocorticoid receptors (pseudo-aldosteronism). The WHO and EU scientific committees suggest not exceeding about 100 mg glycyrrhizin/day, roughly 50 g of licorice sweets. Deglycyrrhizinated licorice (DGL) products reduce glycyrrhizin to typically 1-3 % or less, so the pressor effect is largely absent, though labels vary ([[intervention:dgl-licorice]])."
    ],
    evidence: "established",
    facts: { formula: "C42H62O16", molarMass: "822.9 g/mol", pubchem: "CID 14982", ul: "about 100 mg/day glycyrrhizin (WHO / EU SCF advice)",
    "chebi": "CHEBI:15939" },
    relations: [
      { rel: "causes", to: "outcome:tachycardia", note: "Palpitations or arrhythmia via hypokalaemia with excess intake (rare)" },
      { rel: "part-of", to: "intervention:dgl-licorice", note: "Removed (mostly) in DGL; residual amount matters in hypertension or hypokalaemia" },
      { rel: "associated-with", to: "disease:peptic-ulcer", note: "Licorice derivative carbenoxolone was an ulcer drug but caused mineralocorticoid effects" },
      { rel: "associated-with", to: "outcome:ulcer-healing", note: "Licorice derivatives were used for ulcers; DGL removes most glycyrrhizin." },
      { rel: "interacts-with", to: "compound:prostaglandin-e2" }
    ],
    refs: ["article:isbrucker-2006-licorice-glycyrrhizin-safety"]
  },
  {
    id: "compound:berberine",
    type: "compound",
    name: "Berberine",
    aliases: ["berberina"],
    summary: "Quaternary isoquinoline alkaloid with AMPK-activating metabolic effects and in vitro antimicrobial activity; poorly absorbed and an inhibitor of CYP2D6/3A4 and P-gp.",
    body: [
      "Berberine (from Berberis, goldenseal, Coptis) lowers glucose and LDL in meta-analyses of modest-quality trials, at typical doses of 500 mg two to three times daily. Oral bioavailability is below 1 %, so gut-lumen effects, including shifts in [[system:gut-microbiota]], may dominate. It was part of herbal regimens in a small SIBO study compared with rifaximin (Chedid 2014). It inhibits CYP2D6 and CYP3A4, interacts with cyclosporine and may potentiate hypoglycaemics. See [[intervention:berberine-supplement]]."
    ],
    evidence: "plausible",
    facts: { formula: "C20H18NO4+", molarMass: "336.4 g/mol", pubchem: "CID 2353", "dosing-range": "500 mg 2-3 times/day in trials",
    "chebi": "CHEBI:16118" },
    relations: [
      { rel: "decreases", to: "disease:sibo", note: "Small, low-quality trial evidence" },
      { rel: "interacts-with", to: "system:gut-microbiota" },
      { rel: "part-of", to: "intervention:berberine-supplement" },
      { rel: "interacts-with", to: "intervention:oregano-oil", note: "Combined in herbal antimicrobial regimens for suspected SIBO." },
      { rel: "associated-with", to: "outcome:breath-hydrogen-methane", note: "Herbal-versus-rifaximin study used breath-test normalisation." }
    ],
    refs: ["article:chedid-2014-herbal-vs-rifaximin"]
  },
  {
    id: "compound:alginate",
    type: "compound",
    name: "Alginic acid / sodium alginate",
    aliases: ["alginato de sódio", "alginic acid", "sodium alginate"],
    summary: "Polysaccharide from brown algae that gels in acid; in reflux formulations it forms a buoyant raft on the gastric contents, displacing the acid pocket.",
    body: [
      "Alginate is a copolymer of mannuronic and guluronic acid; at gastric pH below about 4 it precipitates as a gel, entrapping CO2 bubbles from bicarbonate/carbonate in the formulation, and floats on top of the meal as a 'raft' that lies at the oesophagogastric junction ([[intervention:sodium-alginate]]). In vitro, rafts can bind pepsin and bile acids. The CO2 evolved to float the raft can itself increase eructation in some users, and each dose carries a few mmol of sodium."
    ],
    evidence: "established",
    facts: { type: "Linear polysaccharide of M and G uronic acids", mechanism: "pH-triggered gelation" },
    relations: [
      { rel: "mitigates", to: "disease:gerd" },
      { rel: "mitigates", to: "disease:lpr", note: "Plausible; modest evidence" },
      { rel: "interacts-with", to: "compound:pepsin", note: "In vitro binding" },
      { rel: "part-of", to: "intervention:sodium-alginate" },
      { rel: "decreases", to: "outcome:reflux-episodes", note: "Raft impedes reflux without lowering acid; clinical effect sizes vary." },
      { rel: "interacts-with", to: "compound:hydrochloric-acid", note: "Gels on contact with acid." }
    ],
    refs: ["article:leiman-2017-alginate-meta-analysis"]
  },
  {
    id: "compound:elastin",
    type: "compound",
    name: "Elastin",
    aliases: ["elastina", "tropoelastina", "fibras elásticas", "tropoelastin"],
    summary: "Cross-linked extracellular protein that gives skin, arteries and lungs their recoil; like collagen it is glycine-rich (about 29 % glycine in the human precursor sequence).",
    body: [
      "Elastin is what lets skin, blood vessels and lungs stretch and spring back. Cells secrete a soluble precursor, tropoelastin, which is cross-linked outside the cell into a durable polymer in the [[system:connective-tissue]] ([[article:debelle-1999-elastin-molecular-description]]). Unlike [[compound:collagen]], elastin is built mainly during development and turns over very slowly in adults.",
      "Composition, counted from the human ELN precursor sequence (UniProt P15502, 786 residues): about 29 % glycine, 21 % alanine, 13 % proline and 13 % valine. The conversation lists elastin together with collagen and glutathione as places where [[compound:glycine]] is consumed. That is correct in kind, but glycine-budget arguments such as [[outcome:glycine-deficit-estimate]] are dominated by collagen, the largest sink ([[pathway:collagen-synthesis]])."
    ],
    evidence: "established",
    facts: {
      class: "extracellular matrix protein",
      uniprot: "P15502 (human ELN precursor)",
      composition: "Gly 28.6 %, Ala 21.2 %, Pro 12.7 %, Val 12.5 % of residues (counted from UniProt P15502)"
    },
    relations: [
      { rel: "part-of", to: "system:connective-tissue" },
      {
        rel: "interacts-with",
        to: "compound:collagen",
        note: "Both are glycine-rich extracellular matrix proteins."
      }
    ],
    refs: ["article:debelle-1999-elastin-molecular-description"]
  },
  {
    id: "compound:thymol",
    type: "compound",
    name: "Thymol",
    aliases: ["timol", "2-isopropil-5-metilfenol", "thyme phenol", "fenol do tomilho"],
    summary: "Volatile phenol, isomer of carvacrol, found in thyme and oregano oils; antimicrobial in vitro and a pungent TRP-channel activator that can burn inflamed mucosa.",
    body: [
      "Thymol (5-methyl-2-isopropylphenol) is a structural isomer of [[compound:carvacrol]]: the same atoms with the hydroxyl and isopropyl groups swapped. Both are major phenols of oregano and thyme essential oils and together make up much of [[intervention:oregano-oil]]. In test tubes both damage bacterial membranes at low concentrations, which is the basis for their use in herbal gut-antimicrobial regimens ([[disease:sibo]]).",
      "The same chemistry explains the burning sensation. Thymol and carvacrol switch on warmth- and pungency-sensing TRP channels (TRPV3, and TRPA1 for carvacrol) ([[article:xu-2006-carvacrol-thymol-trp-channels]]). On inflamed or damaged lining, such as in oesophagitis or laryngopharyngeal reflux, that pungency is felt as burning. The source conversation reported that oregano oil \"burned\" and gave this reason; the explanation is plausible but is inferred from receptor experiments, not tested in reflux patients ([[claim:oregano-phenols-burn-inflamed-mucosa]])."
    ],
    evidence: "plausible",
    facts: { formula: "C10H14O", molarMass: "150.22 g/mol", chebi: "CHEBI:27607", pubchem: "CID 6989" },
    relations: [
      {
        rel: "interacts-with",
        to: "compound:carvacrol",
        note: "Structural isomers that co-occur in oregano and thyme oils."
      },
      { rel: "part-of", to: "intervention:oregano-oil" },
      {
        rel: "aggravates",
        to: "outcome:throat-burning",
        note: "Pungent TRP-channel activator; effect on inflamed throat mucosa is inferred, not trialled."
      },
      {
        rel: "aggravates",
        to: "disease:esophagitis",
        note: "General caution for pungent oils on inflamed oesophageal lining; no trial."
      }
    ],
    refs: ["article:xu-2006-carvacrol-thymol-trp-channels"]
  },
  {
    id: "compound:tannins-flavonoids",
    type: "compound",
    name: "Tannins and flavonoids (plant polyphenols)",
    aliases: ["taninos", "flavonoides", "polifenóis", "taninos e flavonoides", "polyphenols"],
    summary: "Plant polyphenols: tannins bind proteins and metals (astringent, can lower iron absorption); flavonoids are antioxidant pigments. The fractions credited for espinheira-santa.",
    body: [
      "Polyphenols are plant compounds built from phenol rings. Tannins are the larger ones that bind proteins and metal ions, which gives tea and unripe fruit their astringency and explains why tannin-rich herbs can reduce absorption of iron and some medicines. Flavonoids are a large family of polyphenol pigments (catechins and others) that act as antioxidants in test systems.",
      "The conversation credits the tannins and flavonoids of espinheira-santa with a \"pro-prostaglandin\" action that thickens mucus and bicarbonate. In the rat study usually cited, a flavonoid-rich fraction protected the stomach by inhibiting the proton pump and nitric oxide formation, not by raising mucus ([[article:baggio-2007-maytenus-ilicifolia-gastroprotection]], [[claim:espinheira-santa-prostaglandin-mucus]]). Human evidence for these fractions in ulcer healing is thin ([[intervention:espinheira-santa]])."
    ],
    evidence: "plausible",
    facts: { class: "plant polyphenols (tannins, flavonoids incl. catechins)" },
    relations: [
      {
        rel: "part-of",
        to: "intervention:espinheira-santa",
        note: "Named constituents of Maytenus ilicifolia leaves."
      },
      {
        rel: "decreases",
        to: "enzyme:h-k-atpase",
        note: "A flavonoid-rich fraction inhibited H+/K+-ATPase activity in rats; not shown in people."
      },
      { rel: "associated-with", to: "outcome:ulcer-healing" },
      { rel: "associated-with", to: "pathway:gastric-acid-secretion" }
    ],
    refs: ["article:baggio-2007-maytenus-ilicifolia-gastroprotection"]
  },
];
