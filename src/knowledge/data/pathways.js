// Pathways integrating the enzymes (enzymes.js) and reactions (reactions.js).
// Membership is authored from the member side (enzyme/reaction `part-of` -> pathway); the pathway entities here carry
// links to each other and to the states, diseases, outcomes and systems they influence.
// Evidence on a pathway describes the biochemistry of the pathway itself; relation notes flag where the link to a
// symptom or state comes only from the source conversation.

export default [
  {
    id: "pathway:methionine-cycle",
    type: "pathway",
    name: "Methionine cycle (SAM-SAH-homocysteine cycle)",
    aliases: ["ciclo da metionina", "ciclo de metilação", "ciclo SAMe-SAH-homocisteína", "transmetilação e remetilação", "methionine cycle"],
    summary: "Cycle in which methionine is activated to SAM, SAM donates a methyl group and becomes SAH, SAH is hydrolysed to homocysteine, and homocysteine is remethylated to methionine.",
    body: [
      "[[enzyme:mat1a]] and [[enzyme:mat2a]] convert [[compound:methionine]] and ATP into [[compound:sam]] ([[reaction:mat-sam-synthesis]]). Dozens of methyltransferases ([[enzyme:gnmt]], [[enzyme:pemt]], [[enzyme:gamt]], [[enzyme:comt]], [[enzyme:hnmt]] and others) transfer the methyl group, leaving [[compound:sah]], which [[enzyme:ahcy]] hydrolyses to [[compound:homocysteine]] and adenosine ([[reaction:ahcy-sah-hydrolysis]]). Homocysteine is either remethylated to methionine, by [[enzyme:mtr]] using 5-methyl-THF and methylcobalamin ([[reaction:mtr-methionine-synthase]]) or by [[enzyme:bhmt]] using betaine ([[reaction:bhmt-betaine-homocysteine]]), or leaves the cycle through transsulfuration ([[pathway:transsulfuration]]).",
      "Because SAH inhibits almost every methyltransferase, the cell's methylation capacity depends on the SAM:SAH ratio (the 'methylation index') rather than on SAM alone, and the ratio depends on how quickly homocysteine and adenosine are cleared ([[pathway:methyl-budget]]). SAM also controls the cycle: it inhibits [[enzyme:mthfr]] (less 5-MTHF, less remethylation), activates [[enzyme:cbs]] (more transsulfuration) and, indirectly, [[enzyme:gnmt]] (through reduced 5-MTHF inhibition), a coherent negative feedback that holds SAM within narrow limits. The repository's one-carbon simulation is a bounded, illustrative implementation of this cycle."
    ],
    evidence: "established",
    facts: {
      kegg: "hsa00270",
      reactome: "R-HSA-1614635; R-HSA-156581",
      compartment: "cytosol (mainly liver, kidney); nucleus",
      tissue: "all tissues; liver quantitatively dominant"
    },
    relations: [
      { rel: "part-of", to: "pathway:methyl-budget" },
      { rel: "interacts-with", to: "pathway:folate-cycle", note: "5-MTHF is the methyl donor to homocysteine" },
      { rel: "interacts-with", to: "pathway:transsulfuration", note: "homocysteine partition set by SAM" },
      { rel: "associated-with", to: "state:undermethylation", note: "low SAM:SAH is the biochemical correlate of reduced methylation capacity" },
      { rel: "associated-with", to: "state:overmethylation", note: "high SAM:SAH; GNMT and CBS are the safety valves" }
    ]
  },
  {
    id: "pathway:folate-cycle",
    type: "pathway",
    name: "Folate cycle (one-carbon metabolism)",
    aliases: ["ciclo do folato", "metabolismo de um carbono", "metabolismo monocarbonado", "pool de folato", "one-carbon metabolism"],
    summary: "Interconversion of tetrahydrofolate one-carbon forms (methylene, methenyl, formyl, methyl) that supplies carbons for purines, thymidylate and, via 5-methyl-THF, homocysteine remethylation.",
    body: [
      "One-carbon units enter the folate pool from serine ([[enzyme:shmt1]], [[enzyme:shmt2]]; [[reaction:shmt-serine-glycine-interconversion]]), from glycine cleavage ([[reaction:glycine-cleavage-system]]), from choline-derived methyl groups ([[reaction:dmgdh-dimethylglycine-demethylation]], [[reaction:sardh-sarcosine-demethylation]]) and from formate. [[enzyme:mthfd1]] interconverts methylene-THF, methenyl-THF and 10-formyl-THF (purine synthesis), thymidylate synthase uses methylene-THF for dTMP, and [[enzyme:mthfr]] irreversibly reduces methylene-THF to [[compound:5-methyl-thf]], which [[enzyme:mtr]] uses to remethylate homocysteine, releasing [[compound:thf]].",
      "The cycle explains several statements in the source conversation: glycine cleavage needs THF (so folate limitation slows glycine catabolism), the betaine route feeds two one-carbon units to mitochondrial THF, and unmetabolised synthetic folic acid can compete with natural folates for transporters and DHFR (the advice to prefer L-methylfolate or folinic acid is reasonable but does not mean folic acid 'slows methylation' in healthy people). B12 deficiency traps folate as 5-MTHF because MTR is the only exit."
    ],
    evidence: "established",
    facts: {
      kegg: "hsa00670",
      reactome: "R-HSA-196757",
      compartment: "cytosol, mitochondrion, nucleus",
      tissue: "all tissues"
    },
    relations: [
      { rel: "interacts-with", to: "pathway:methionine-cycle", note: "5-MTHF supplies the methyl for homocysteine remethylation" },
      { rel: "interacts-with", to: "pathway:glycine-cleavage", note: "glycine cleavage generates methylene-THF and needs THF" },
      { rel: "interacts-with", to: "pathway:glycine-serine-route", note: "SHMT couples serine, glycine and folate" },
      { rel: "associated-with", to: "state:undermethylation", note: "folate/B12 limitation lowers remethylation capacity (established in deficiency; subtler in health)" }
    ]
  },
  {
    id: "pathway:transsulfuration",
    type: "pathway",
    name: "Transsulfuration pathway (homocysteine to cysteine)",
    aliases: ["transsulfuração", "via da transsulfuração", "homocisteína a cisteína", "CBS-CTH"],
    summary: "Irreversible conversion of homocysteine and serine to cystathionine and then cysteine, using two PLP enzymes; the sulfur outlet of the methionine cycle.",
    body: [
      "[[enzyme:cbs]] condenses [[compound:homocysteine]] and [[compound:serine]] to cystathionine ([[reaction:cbs-cystathionine-synthesis]]) and [[enzyme:cth]] cleaves it to [[compound:cysteine]], 2-oxobutanoate and ammonia ([[reaction:cth-cystathionine-cleavage]]). Both enzymes use [[compound:plp]]; CBS is activated by [[compound:sam]], so the pathway turns on when methionine and SAM are plentiful. The cysteine formed is the precursor of [[compound:glutathione]] and [[compound:taurine]].",
      "Functional vitamin B6 insufficiency impairs both enzymes: homocysteine rises after a methionine load and cystathionine accumulates, which clinicians use as functional markers ([[state:b6-functional-deficiency]]). Transsulfuration is a mostly hepatic and renal pathway; many tissues, including brain, rely on cysteine delivered from the blood."
    ],
    evidence: "established",
    facts: {
      kegg: "hsa00270",
      reactome: "R-HSA-1614635",
      compartment: "cytosol",
      tissue: "liver, kidney, pancreas, brain (low)"
    },
    relations: [
      { rel: "interacts-with", to: "pathway:methionine-cycle", note: "diverts homocysteine from remethylation when SAM is high" },
      { rel: "interacts-with", to: "pathway:glutathione-synthesis", note: "provides cysteine" },
      { rel: "associated-with", to: "state:b6-functional-deficiency", note: "PLP-dependent; post-methionine-load homocysteine is a functional marker" }
    ]
  },
  {
    id: "pathway:choline-oxidation",
    type: "pathway",
    name: "Choline oxidation to betaine and glycine",
    aliases: ["oxidação da colina", "colina → betaína → glicina", "via da betaína", "via colina-TMG-glicina", "catabolismo da betaína"],
    summary: "Mitochondrial and cytosolic route in liver and kidney that oxidises choline to betaine, then strips its three methyl groups (BHMT, DMGDH, SARDH), leaving glycine.",
    body: [
      "[[enzyme:chdh]] oxidises [[compound:choline]] to [[compound:betaine-aldehyde]] and [[enzyme:aldh7a1]] oxidises that to [[compound:betaine]]. [[enzyme:bhmt]] transfers the first methyl to homocysteine, making methionine and [[compound:dimethylglycine]]; [[enzyme:dmgdh]] removes the second methyl and [[enzyme:sardh]] the third, each into the mitochondrial folate pool as 5,10-methylene-THF, leaving [[compound:glycine]]. The source conversation describes exactly this route and the three methyl-carbon fates; the biochemistry is accurate.",
      "The conversation then argues that glycine made this way inside hepatocytes avoids the gut lumen and so cannot cause belching. That inference is sound for the route (it never contacts luminal bacteria), but the quantity is small: choline is also needed for membranes ([[pathway:kennedy-pathway]]) and acetylcholine, only part of dietary choline is oxidised, and the conversation's own stoichiometric estimate shows that choline cannot supply 10 g/day of glycine without exceeding the tolerable upper intake of 3.5 g/day. Excess free choline also feeds gut TMA production ([[pathway:tma-tmao-axis]])."
    ],
    evidence: "established",
    facts: {
      reactome: "R-HSA-6798163",
      kegg: "hsa00260",
      compartment: "mitochondrial inner membrane and matrix; cytosol (BHMT)",
      tissue: "liver, kidney"
    },
    relations: [
      { rel: "interacts-with", to: "pathway:kennedy-pathway", note: "membrane synthesis competes with oxidation for choline" },
      { rel: "interacts-with", to: "pathway:glycine-serine-route", note: "yields intracellular glycine" },
      { rel: "interacts-with", to: "pathway:methionine-cycle", note: "BHMT remethylation" },
      { rel: "mitigates", to: "state:undermethylation", note: "plausible: betaine remethylation supports SAM; trial evidence mixed" }
    ]
  },
  {
    id: "pathway:kennedy-pathway",
    type: "pathway",
    name: "Kennedy pathway (CDP-choline and CDP-ethanolamine routes)",
    aliases: ["via de Kennedy", "via CDP-colina", "síntese de fosfatidilcolina", "Kennedy pathway", "citicolina endógena"],
    summary: "De novo synthesis of phosphatidylcholine and phosphatidylethanolamine from choline/ethanolamine, ATP, CTP and diacylglycerol; the main route to membrane PC.",
    body: [
      "Choline is phosphorylated by [[enzyme:choline-kinase]], activated to CDP-choline by [[enzyme:pcyt1a]] (the regulated step) and combined with diacylglycerol by [[enzyme:chpt1]] or [[enzyme:cept1]] to make [[compound:phosphatidylcholine]]. The parallel ethanolamine branch ([[enzyme:etnk1]], [[enzyme:pcyt2]], [[enzyme:selenoi]]/[[enzyme:cept1]]) makes [[compound:phosphatidylethanolamine]]. CDP-choline here is the same molecule as the supplement citicoline.",
      "Phosphatidylcholine is the main phospholipid of membranes, lipoproteins and bile (biliary PC secreted through ABCB4 protects bile-duct epithelium from bile-acid detergency, [[system:bile]]). In liver the pathway is supplemented by methylation of PE ([[pathway:pemt-pc-synthesis]]); supplements such as choline salts, alpha-GPC and phosphatidylcholine feed this pathway and, to a smaller extent, acetylcholine synthesis ([[pathway:acetylcholine-synthesis]])."
    ],
    evidence: "established",
    facts: {
      reactome: "R-HSA-1483191; R-HSA-1483213",
      kegg: "hsa00564",
      compartment: "cytosol, endoplasmic reticulum, Golgi, nuclear envelope",
      tissue: "all cells; liver, brain, muscle"
    },
    relations: [
      { rel: "interacts-with", to: "pathway:pemt-pc-synthesis", note: "second route to PC in hepatocytes; supplies its PE substrate" },
      { rel: "interacts-with", to: "pathway:choline-oxidation", note: "competition for choline" },
      { rel: "associated-with", to: "system:bile", note: "biliary phosphatidylcholine" }
    ]
  },
  {
    id: "pathway:pemt-pc-synthesis",
    type: "pathway",
    name: "PEMT route to phosphatidylcholine (methylation of PE)",
    aliases: ["via PEMT", "metilação da fosfatidiletanolamina", "síntese de PC dependente de SAMe", "PE → PC"],
    summary: "Hepatic route that methylates phosphatidylethanolamine three times with SAM to produce roughly a third of liver phosphatidylcholine and make choline in effect de novo.",
    body: [
      "[[enzyme:pemt]] converts [[compound:phosphatidylethanolamine]] to [[compound:phosphatidylcholine]] in three steps using three [[compound:sam]] and producing three [[compound:sah]] ([[reaction:pemt-pe-to-pc]]). The PE comes from the CDP-ethanolamine pathway or phosphatidylserine decarboxylation ([[reaction:ept-cdp-ethanolamine-to-pe]]). The PC is exported in VLDL and bile and can be hydrolysed to free choline.",
      "In the conversation's causal chain, low SAM reduces PEMT PC, lowers choline and acetylcholine, and weakens vagal drive to the stomach and sphincters. The first and last links are plausible but each is weakened by redundancy: dietary choline and CDP-choline synthesis ([[pathway:kennedy-pathway]]) buffer PC, and neuronal acetylcholine depends on choline uptake from blood. The chain is therefore a hypothesis rather than an established mechanism."
    ],
    evidence: "established",
    facts: {
      reactome: "R-HSA-1483174",
      kegg: "hsa00564",
      compartment: "endoplasmic reticulum / mitochondria-associated membrane",
      tissue: "liver (major)"
    },
    relations: [
      { rel: "part-of", to: "pathway:methyl-budget", note: "a major SAM consumer (3 SAM per PC)" },
      { rel: "interacts-with", to: "pathway:kennedy-pathway", note: "parallel route to PC" },
      { rel: "associated-with", to: "state:undermethylation", note: "conversation-proposed: low SAM reduces PEMT PC and downstream choline/ACh; weak links" },
      { rel: "associated-with", to: "system:vagal-tone", note: "conversation-only: PC to choline to acetylcholine chain" }
    ]
  },
  {
    id: "pathway:acetylcholine-synthesis",
    type: "pathway",
    name: "Acetylcholine synthesis and vagal signalling",
    aliases: ["síntese de acetilcolina", "colina → acetilcolina", "tônus vagal colinérgico", "acetylcholine synthesis"],
    summary: "Neuronal acetylation of choline by ChAT, supplied by choline uptake, that provides the transmitter of the vagus and enteric nervous system.",
    body: [
      "Cholinergic neurons import [[compound:choline]] through the high-affinity transporter SLC5A7 and acetylate it with [[compound:acetyl-coa]] using [[enzyme:chat]] ([[reaction:chat-acetylcholine-synthesis]]), packaging [[compound:acetylcholine]] into vesicles. Acetylcholinesterase cleaves released acetylcholine and much of the resulting choline is taken up again. Vagal acetylcholine acting on M3 receptors drives antral contraction, gastric emptying, parietal-cell acid secretion and lower-oesophageal-sphincter tone, and on M2 receptors slows the heart.",
      "The source conversation attributes the patient's night-time tachycardia and gastric dysmotility to low acetylcholine from methylation and choline deficiency, and its relief to choline supplementation. The pathway is real and choline is its substrate, but the chain from SAM or glycine to clinically relevant changes in vagal tone is not demonstrated; severe choline deficiency in controlled feeding studies produces liver and muscle dysfunction rather than selective autonomic symptoms."
    ],
    evidence: "established",
    facts: {
      kegg: "hsa04725",
      reactome: "R-HSA-264622",
      compartment: "cytosol of cholinergic terminals",
      tissue: "vagal efferents, enteric neurons, brain"
    },
    relations: [
      { rel: "associated-with", to: "system:vagal-tone", note: "acetylcholine is the vagal transmitter" },
      { rel: "associated-with", to: "state:gastric-dysmotility", note: "conversation-proposed: low choline/ACh slows gastric emptying; indirect evidence" },
      { rel: "associated-with", to: "system:lower-esophageal-sphincter", note: "cholinergic tone sustains LES pressure" },
      { rel: "associated-with", to: "outcome:tachycardia", note: "conversation-proposed: reduced vagal brake at night; unproven" }
    ]
  },
  {
    id: "pathway:glycine-cleavage",
    type: "pathway",
    name: "Glycine cleavage system (glycine degradation)",
    aliases: ["sistema de clivagem da glicina", "GCS", "catabolismo da glicina", "glicina → CO2 + NH3 + CH2-THF"],
    summary: "Mitochondrial four-protein system (GLDC, AMT, GCSH, DLD) that oxidatively cleaves glycine to CO2, ammonia and a methylene-THF one-carbon unit.",
    body: [
      "In the sequence [[enzyme:gldc]] decarboxylates [[compound:glycine]] onto [[enzyme:gcsh]], [[enzyme:amt]] transfers the methylene to [[compound:thf]] and releases ammonia, and [[enzyme:dld]] regenerates the lipoyl arm with [[compound:nad]] ([[reaction:glycine-cleavage-system]]). It is the main route by which excess glycine is removed and is the origin of much of the one-carbon pool in liver. It needs both [[compound:plp]] (GLDC) and folate (AMT), as correctly emphasised in the conversation.",
      "Glycine cleavage is reversible in principle but runs catabolically in humans; failure of the system causes non-ketotic hyperglycinaemia. Because the carbon ends up as methylene-THF, which can be reduced to 5-methyl-THF and used to remethylate homocysteine, glycine can feed methylation indirectly; its metabolic effect on SAM is thus the sum of GNMT use (negative) and cleavage/folate use (positive), the sign of which is not established in humans."
    ],
    evidence: "established",
    facts: {
      reactome: "R-HSA-6783984",
      kegg: "hsa00260",
      compartment: "mitochondrial matrix",
      tissue: "liver, kidney, brain"
    },
    relations: [
      { rel: "interacts-with", to: "pathway:folate-cycle", note: "generates methylene-THF and requires THF" },
      { rel: "interacts-with", to: "pathway:glycine-serine-route", note: "alternative fates of glycine" },
      { rel: "associated-with", to: "state:b6-functional-deficiency", note: "GLDC is PLP-dependent" }
    ]
  },
  {
    id: "pathway:glycine-serine-route",
    type: "pathway",
    name: "Endogenous glycine biosynthesis (serine route and choline-derived route)",
    aliases: ["biossíntese de glicina", "via da serina", "síntese endógena de glicina", "glicina endógena", "fonte limpa de glicina"],
    summary: "Glycine is made from serine (from 3-phosphoglycerate via PHGDH/PSAT1/PSPH) by SHMT and from choline via betaine, DMG and sarcosine; synthesis (~3 g/day) is argued to fall short of demand.",
    body: [
      "Serine is synthesised from the glycolytic intermediate [[compound:3-phosphoglycerate]] by [[enzyme:phgdh]], [[enzyme:psat1]] (a [[compound:plp]] enzyme) and [[enzyme:psph]], and converted to [[compound:glycine]] with transfer of one carbon to THF by [[enzyme:shmt1]] (cytosol) and [[enzyme:shmt2]] (mitochondria) ([[reaction:shmt-serine-glycine-interconversion]]). A second route runs through choline oxidation: betaine to dimethylglycine to sarcosine to glycine ([[pathway:choline-oxidation]]); sarcosine is also produced by [[enzyme:gnmt]] and returned to glycine by [[enzyme:sardh]]. Minor routes include threonine degradation and glyoxylate transamination.",
      "Meléndez-Hevia et al. (2009) argued that glycine synthesis (about 3 g/day) plus diet cannot meet the needs of collagen, glutathione, creatine, purines, haem and bile-acid conjugation, leaving a shortfall of roughly 10 g/day, which is the basis for 10 g/day glycine supplementation ([[article:melendez-hevia-2009-glycine-weak-link]]). The estimate is a theoretical calculation, not a measured deficit, and is contested. The same logic underlies the conversation's calculation that the choline route could not substitute for oral glycine."
    ],
    evidence: "established",
    facts: {
      reactome: "R-HSA-977347",
      kegg: "hsa00260",
      compartment: "cytosol; mitochondrial matrix",
      tissue: "liver, kidney, brain",
      "synthesis-estimate": "~3 g/day endogenous (Meléndez-Hevia 2009), contested"
    },
    relations: [
      { rel: "interacts-with", to: "pathway:folate-cycle", note: "SHMT links serine/glycine with the folate pool" },
      { rel: "interacts-with", to: "pathway:collagen-synthesis", note: "collagen is the largest single glycine sink" },
      { rel: "interacts-with", to: "pathway:glutathione-synthesis", note: "glycine sink" },
      { rel: "interacts-with", to: "pathway:creatine-synthesis", note: "glycine sink" },
      { rel: "associated-with", to: "state:b6-functional-deficiency", note: "PSAT1 and SHMT are PLP-dependent" }
    ],
    refs: ["article:melendez-hevia-2009-glycine-weak-link"]
  },
  {
    id: "pathway:bile-acid-conjugation",
    type: "pathway",
    name: "Bile-acid activation, amino-acid conjugation and bacterial deconjugation",
    aliases: ["conjugação de ácidos biliares", "glicoconjugação", "tauroconjugação", "razão glicina:taurina da bile", "circulação êntero-hepática"],
    summary: "Hepatic activation of bile acids to CoA thioesters and conjugation to glycine or taurine, reversed by gut bacterial bile salt hydrolases in the enterohepatic cycle.",
    body: [
      "In hepatocytes [[enzyme:slc27a5]] activates [[compound:cholate]] to choloyl-CoA ([[reaction:bacs-cholate-coa-ligation]]) and [[enzyme:baat]] conjugates it with [[compound:glycine]] or [[compound:taurine]] ([[reaction:baat-glycine-conjugation]], [[reaction:baat-taurine-conjugation]]), giving [[compound:glycocholate]] or [[compound:taurocholate]]. Conjugated bile acids are secreted into bile ([[system:bile]]), aid fat digestion, and are reabsorbed in the ileum; the fraction reaching the colon is deconjugated by bacterial [[enzyme:bile-salt-hydrolase]] ([[reaction:bsh-glycocholate-deconjugation]]), releasing free glycine or taurine and bile acids that are partly returned to the liver and re-conjugated.",
      "The conversation proposes that a bolus of oral glycine raises the glycine:taurine conjugate ratio and makes bile an irritant, favouring alkaline duodenogastric reflux and eructation. Human bile is already about 75% glycine-conjugated and hepatic glycine is not obviously limiting, so a significant shift from a few grams of oral glycine is unproven; the proposal is conversation-only. The pathway is more securely relevant to the gut because bacterial overgrowth deconjugates bile acids early ([[disease:sibo]])."
    ],
    evidence: "established",
    facts: {
      reactome: "R-HSA-192105; R-HSA-194068",
      kegg: "hsa00120; hsa04976",
      compartment: "hepatocyte ER and peroxisome; intestinal lumen (bacterial BSH)",
      tissue: "liver, small intestine, colon"
    },
    relations: [
      { rel: "associated-with", to: "system:bile", note: "determines conjugate composition of bile" },
      { rel: "associated-with", to: "system:gut-microbiota", note: "BSH-mediated deconjugation" },
      { rel: "associated-with", to: "disease:sibo", note: "early deconjugation is a classical SIBO finding" },
      { rel: "associated-with", to: "outcome:belching", note: "conversation-only: glycoconjugated bile, reflux and eructation after glycine" },
      { rel: "interacts-with", to: "pathway:glycine-serine-route", note: "conjugation is a glycine sink" }
    ]
  },
  {
    id: "pathway:histamine-degradation",
    type: "pathway",
    name: "Histamine degradation (DAO and HNMT routes)",
    aliases: ["degradação da histamina", "metabolismo da histamina", "HNMT e DAO", "histamina noturna"],
    summary: "Two routes inactivate histamine: extracellular oxidative deamination by DAO in the gut and kidney, and intracellular SAM-dependent methylation by HNMT elsewhere, the only route in brain.",
    body: [
      "[[enzyme:dao]] (copper amine oxidase, intestinal mucosa) deaminates histamine to imidazole acetaldehyde ([[reaction:dao-histamine-oxidation]]); [[enzyme:hnmt]] methylates it with [[compound:sam]] to [[compound:methylhistamine]] ([[reaction:hnmt-histamine-methylation]]), which monoamine oxidase B and an aldehyde dehydrogenase then oxidise. Histamine is released from mast cells, enterochromaffin-like cells and neurons and acts through H1-H4 receptors on vessels, heart, airway, stomach and brain.",
      "The conversation links a night-time histamine peak (2-4 am), SAM supply through choline, betaine and BHMT, and the patient's 2-3 am awakenings with tachycardia and flushing. Histamine has a circadian rhythm and H1/H2 cardiac effects, so the symptom pattern is coherent; but whether choline measurably raises brain or vascular HNMT capacity, and whether histamine is the cause, is untested, so these links are marked as plausible or conversation-only. Practical histamine intolerance is a contested construct ([[disease:histamine-intolerance]])."
    ],
    evidence: "established",
    facts: {
      kegg: "hsa00340",
      compartment: "extracellular / intestinal mucosa (DAO); cytosol (HNMT)",
      tissue: "gut, liver, kidney, airway, brain"
    },
    relations: [
      { rel: "associated-with", to: "disease:histamine-intolerance", note: "reduced DAO/HNMT capacity is the proposed mechanism" },
      { rel: "associated-with", to: "outcome:night-waking", note: "conversation-only: nocturnal histamine peak, relieved by choline" },
      { rel: "associated-with", to: "outcome:tachycardia", note: "conversation-only: histamine H1/H2 cardiac effect at night" },
      { rel: "interacts-with", to: "pathway:methyl-budget", note: "HNMT competes for SAM and is inhibited by SAH" }
    ]
  },
  {
    id: "pathway:gaba-shunt",
    type: "pathway",
    name: "GABA synthesis and GABA shunt (glutamate to GABA to succinate)",
    aliases: ["derivação do GABA", "shunt do GABA", "glutamato → GABA", "eixo glutamato/GABA", "GAD-ABAT-SSADH"],
    summary: "Glutamate is decarboxylated to GABA by PLP-dependent GAD; GABA is transaminated and oxidised back to succinate, bypassing two TCA steps.",
    body: [
      "[[enzyme:gad1]] and [[enzyme:gad2]] convert [[compound:glutamate]] to [[compound:gaba]] ([[reaction:gad-glutamate-decarboxylation]]); [[enzyme:abat]] transaminates GABA with 2-oxoglutarate to succinic semialdehyde ([[reaction:abat-gaba-transamination]]) and [[enzyme:aldh5a1]] oxidises that to succinate ([[reaction:aldh5a1-succinate-semialdehyde-oxidation]]). GAD and ABAT depend on [[compound:plp]]; the shunt returns GABA-derived carbon to the TCA cycle and recycles glutamate.",
      "The source conversation explains the patient's response to P5P as relief of a GAD bottleneck that lowered GABA and left excitatory glutamate unopposed (anxiety, mental fog). This is mechanistically plausible: B6 depletion lowers GABA and causes seizures, and GAD65 is partly apoenzyme. However, a measurable GAD deficit in an adult with ordinary diet and mild symptoms has not been shown, and the response may have other explanations; it is recorded as plausible. Gut bacteria also synthesise GABA, so luminal and systemic pools are only loosely related."
    ],
    evidence: "established",
    facts: {
      kegg: "hsa00250",
      reactome: "R-HSA-888590; R-HSA-916853",
      compartment: "cytosol; mitochondrion",
      tissue: "brain (GABAergic neurons, astrocytes), pancreatic islets, enteric nervous system"
    },
    relations: [
      { rel: "associated-with", to: "state:b6-functional-deficiency", note: "GAD and ABAT are PLP-dependent" },
      { rel: "associated-with", to: "disease:anxiety-disorder", note: "plausible: reduced GABA with low PLP; response to P5P in the conversation is anecdotal" },
      { rel: "associated-with", to: "outcome:brain-fog", note: "conversation-only: glutamate/GABA imbalance and mental fog relieved by P5P" },
      { rel: "interacts-with", to: "pathway:vitamin-b6-activation", note: "supply of PLP" }
    ]
  },
  {
    id: "pathway:gastric-acid-secretion",
    type: "pathway",
    name: "Gastric acid secretion by the parietal cell",
    aliases: ["secreção ácida gástrica", "secreção de HCl", "célula parietal", "gastrina-histamina-acetilcolina", "bomba de prótons"],
    summary: "Parietal cells make HCl from CO2 (carbonic anhydrase) and ATP (H+/K+-ATPase), driven by gastrin, histamine and vagal acetylcholine and restrained by somatostatin at low pH.",
    body: [
      "CO2 is hydrated to H+ and HCO3- by [[enzyme:carbonic-anhydrase]]; [[enzyme:h-k-atpase]] pumps H+ into the canaliculus and Cl- follows, giving [[compound:hydrochloric-acid]] at pH ~1, while bicarbonate leaves basolaterally (alkaline tide; [[reaction:gastric-hcl-secretion]]). Three stimuli converge: vagal [[compound:acetylcholine]] (M3), antral [[compound:gastrin]] (released by peptides, amino acids, distension and vagal GRP; acts largely through histamine from ECL cells) and [[compound:histamine]] (H2 receptor). Antral acidification (pH < 3) releases somatostatin and switches gastrin off, a negative feedback.",
      "The conversation proposes that free glycine and collagen peptides are potent gastrin secretagogues that raise acid output, while in an already hypochlorhydric stomach glycine, an amphoteric buffer, could raise pH and delay sphincter and pyloric function. Peptides and aromatic amino acids do stimulate G cells through the calcium-sensing receptor, but free glycine is not a recognised strong secretagogue, and as a buffer (pKa 2.3 and 9.6) a few grams dissolved in the gastric contents is minor next to HCl and meal proteins, so both effects are unproven. Acid output is lowered by proton-pump inhibitors, which the conversation correctly identifies as a reason for upper-gut bacterial colonisation ([[state:hypochlorhydria]], [[disease:sibo]])."
    ],
    evidence: "established",
    facts: {
      kegg: "hsa04971",
      compartment: "parietal cell: cytosol, canalicular membrane, basolateral membrane",
      tissue: "gastric corpus and fundus"
    },
    relations: [
      { rel: "associated-with", to: "state:hypochlorhydria", note: "low acid output (PPIs, atrophic gastritis, H. pylori) removes the gastric bacterial barrier" },
      { rel: "associated-with", to: "system:gastric-physiology" },
      { rel: "associated-with", to: "system:vagal-tone", note: "acetylcholine via M3 receptors" },
      { rel: "associated-with", to: "disease:peptic-ulcer", note: "acid-peptic ulcer; PPIs and H. pylori eradication are standard therapy" },
      { rel: "interacts-with", to: "pathway:acid-bicarbonate-neutralisation", note: "downstream neutralisation of the acid by bicarbonate" }
    ]
  },
  {
    id: "pathway:acid-bicarbonate-neutralisation",
    type: "pathway",
    name: "Acid-bicarbonate neutralisation and CO2 evolution",
    aliases: ["neutralização do ácido por bicarbonato", "HCl + HCO3−", "liberação de CO2", "efervescência gástrica", "bicarbonato pancreático"],
    summary: "Gastric HCl meets pancreatic and biliary bicarbonate (or an antacid) and is converted via carbonic acid to water and dissolved CO2, catalysed by carbonic anhydrase.",
    body: [
      "H+ + HCO3- -> H2CO3 ([[reaction:proton-bicarbonate-protonation]]) and H2CO3 -> H2O + CO2 ([[reaction:carbonic-acid-dehydration]]), summarised as HCl + HCO3- -> CO2 + H2O + Cl- ([[reaction:hcl-bicarbonate-neutralisation]]). [[enzyme:carbonic-anhydrase]] (CA II, CA IV) speeds the interconversion at epithelial surfaces ([[reaction:carbonic-anhydrase-bicarbonate-dehydration]]). In the duodenum, pancreatic and biliary bicarbonate and Brunner-gland mucus neutralise acid chyme within centimetres of the pylorus. Dissolved CO2 is highly diffusible and mostly absorbed across the mucosa; a minor fraction is carried distally or released.",
      "The source conversation uses this chemistry as one of two proposed gas-generating mechanisms for belching after oral glycine (the other being bacterial fermentation, [[pathway:gut-bacterial-glycine-fates]]). The chemistry is textbook; what is not established is that glycine increases acid output enough, that a significant volume of CO2 escapes absorption in the duodenum, or that duodenal gas is expelled upward as eructation (most eructation is swallowed air or supragastric belching). The mechanism does explain well the effervescence after sodium bicarbonate or carbonated drinks taken with acid ([[outcome:belching]])."
    ],
    evidence: "established",
    facts: {
      compartment: "gastric and duodenal lumen; epithelial surface",
      tissue: "stomach, duodenum, pancreatic duct",
      note: "chemistry established; contribution to eructation after glycine is conversation-only"
    },
    relations: [
      { rel: "associated-with", to: "outcome:belching", note: "conversation-proposed gas source; magnitude unproven" },
      { rel: "associated-with", to: "system:gastric-physiology" },
      { rel: "associated-with", to: "system:bile", note: "biliary bicarbonate contributes to neutralisation" },
      { rel: "interacts-with", to: "pathway:gastric-acid-secretion", note: "acid source" }
    ]
  },
  {
    id: "pathway:glutathione-synthesis",
    type: "pathway",
    name: "Glutathione synthesis",
    aliases: ["síntese de glutationa", "GSH", "γ-glutamilcisteína", "glutationa"],
    summary: "Two ATP-dependent ligations (GCL then GSS) build glutathione from glutamate, cysteine and glycine; cysteine and glycine can both limit the rate.",
    body: [
      "[[enzyme:glutamate-cysteine-ligase]] joins [[compound:glutamate]] and [[compound:cysteine]] ([[reaction:gcl-gamma-glutamylcysteine-synthesis]]) and [[enzyme:gss]] adds [[compound:glycine]] ([[reaction:gss-glutathione-synthesis]]), forming [[compound:glutathione]], the principal thiol antioxidant, conjugation substrate and cysteine store. Cysteine comes from the diet, protein turnover and transsulfuration ([[pathway:transsulfuration]]); GCL is feedback-inhibited by GSH and induced by oxidative stress.",
      "Glycine is one of the long-running sinks that motivates glycine supplementation ([[pathway:glycine-serine-route]]); in glycine-poor, cysteine-poor states GSH synthesis is limited, which is the physiological rationale for glycine plus N-acetylcysteine. Whether free-glycine powder is necessary for this in a person with adequate protein intake is a separate question not answered by the pathway."
    ],
    evidence: "established",
    facts: {
      kegg: "hsa00480",
      reactome: "R-HSA-174403",
      compartment: "cytosol",
      tissue: "all tissues; liver quantitatively dominant"
    },
    relations: [
      { rel: "interacts-with", to: "pathway:transsulfuration", note: "supplies cysteine" },
      { rel: "interacts-with", to: "pathway:glycine-serine-route", note: "glycine demand" },
      { rel: "interacts-with", to: "compound:glycine", note: "glycine can limit GSS flux when supply is short (plausible)" }
    ]
  },
  {
    id: "pathway:collagen-synthesis",
    type: "pathway",
    name: "Collagen synthesis and glycine demand",
    aliases: ["síntese de colágeno", "demanda de glicina do colágeno", "Gly-X-Y", "hidroxiprolina", "colágeno tipo II"],
    summary: "Procollagen chains with a Gly-X-Y repeat are translated, proline residues are hydroxylated by an ascorbate-dependent dioxygenase, and triple helices are assembled; one residue in three is glycine.",
    body: [
      "Each collagen alpha chain is translated as a procollagen repeat of Gly-X-Y, so glycine is about 33% of residues and proline plus hydroxyproline another ~20% ([[reaction:collagen-chain-assembly]]). [[enzyme:p4ha1]] hydroxylates proline in the ER using 2-oxoglutarate, oxygen, iron and ascorbate ([[reaction:p4h-prolyl-hydroxylation]]), which stabilises the triple helix. Collagen is the most abundant protein and therefore the largest long-term sink of glycine ([[pathway:glycine-serine-route]]).",
      "The conversation notes that collagen powder (including type II) provides glycine, proline and hydroxyproline but caused belching in the user and that others report the same. Ingested collagen peptides are absorbed as di- and tripeptides (Gly-Pro-Hyp), which are not a robust gastrin stimulus; the cause of the belching, if not swallowed air from the powder, is unresolved. Dietary collagen does not directly supply collagen synthesis because it is digested to amino acids and peptides like any protein ([[compound:collagen]], [[compound:glycine]], [[compound:proline]], [[compound:hydroxyproline]])."
    ],
    evidence: "established",
    facts: {
      reactome: "R-HSA-1650814",
      compartment: "rough endoplasmic reticulum; Golgi; extracellular",
      tissue: "skin, tendon, bone, cartilage (type II), vessels"
    },
    relations: [
      { rel: "interacts-with", to: "pathway:glycine-serine-route", note: "largest glycine sink" },
      { rel: "interacts-with", to: "compound:glycine", note: "one residue in three" },
      { rel: "interacts-with", to: "compound:proline", note: "Y-position proline hydroxylated" }
    ]
  },
  {
    id: "pathway:creatine-synthesis",
    type: "pathway",
    name: "Creatine synthesis (AGAT-GAMT)",
    aliases: ["síntese de creatina", "guanidinoacetato", "AGAT e GAMT", "creatina endógena"],
    summary: "Kidney AGAT makes guanidinoacetate from arginine and glycine; liver GAMT methylates it with SAM to creatine, consuming one glycine and one methyl group.",
    body: [
      "[[enzyme:gatm]] transfers the amidino group of [[compound:arginine]] to [[compound:glycine]] to give [[compound:guanidinoacetate]] and [[compound:ornithine]] ([[reaction:agat-guanidinoacetate-synthesis]]); [[enzyme:gamt]] methylates it with [[compound:sam]] to [[compound:creatine]] ([[reaction:gamt-creatine-synthesis]]). About 1 g of creatine is made and ~1.7% of the creatine pool is lost per day as creatinine, so the pathway is a continuous glycine and methyl sink. Dietary creatine (meat, supplements) down-regulates AGAT and spares both.",
      "Older estimates attributed over 70% of SAM-derived methyl groups to creatine synthesis; revisions that account for dietary creatine and for PEMT lowered this, while other analyses still place creatine near half of methyl-group flux. This uncertainty is why the 'methyl budget' is better described as a set of competing sinks than as a settled apportionment ([[pathway:methyl-budget]])."
    ],
    evidence: "established",
    facts: {
      reactome: "R-HSA-71288",
      kegg: "hsa00330",
      compartment: "kidney mitochondrial intermembrane space (AGAT); liver cytosol (GAMT)",
      tissue: "kidney, liver, pancreas; stored in muscle and brain"
    },
    relations: [
      { rel: "part-of", to: "pathway:methyl-budget", note: "major SAM sink; share debated" },
      { rel: "interacts-with", to: "pathway:glycine-serine-route", note: "glycine sink" },
      { rel: "associated-with", to: "state:undermethylation", note: "creatine supplementation reduces the methyl cost (plausible)" }
    ]
  },
  {
    id: "pathway:methyl-budget",
    type: "pathway",
    name: "Methyl budget: SAM sources, sinks and the methylation index",
    aliases: ["orçamento de metilas", "dreno de metil", "methyl sink", "índice de metilação", "razão SAM:SAH", "methyl balance"],
    summary: "Integrated view of SAM supply (MAT, remethylation) versus its consumers (PEMT, GAMT, GNMT and minor methyltransferases) and of the SAM:SAH ratio that sets methylation capacity.",
    body: [
      "SAM is supplied by [[enzyme:mat1a]]/[[enzyme:mat2a]] from methionine, itself fed by diet and by remethylation of homocysteine ([[pathway:methionine-cycle]]). It is spent by three large sinks: PEMT (three SAM per phosphatidylcholine; [[pathway:pemt-pc-synthesis]]), GAMT (one SAM per creatine; [[pathway:creatine-synthesis]]) and GNMT, the regulated 'methyl sink' of liver ([[reaction:gnmt-glycine-methylation]]), plus many small consumers such as [[enzyme:comt]], [[enzyme:hnmt]], DNA, histone and RNA methyltransferases. Quantitative shares are debated: classical estimates (Mudd and Poole) gave creatine over 70%, later revisions (Stead et al. 2006) assign PEMT a comparable or larger share, and a rebuttal places creatine near 45%.",
      "What matters for function is the ratio [[compound:sam]]:[[compound:sah]] (the methylation index), because SAH inhibits methyltransferases and is cleared only as fast as homocysteine and adenosine are removed ([[enzyme:ahcy]]). GNMT is the stabiliser: it burns surplus SAM when 5-MTHF is low, and its product sarcosine is demethylated back to glycine so the carbon is retained ([[enzyme:sardh]]). The terms 'under-methylation' and 'over-methylation' in the source conversation come from an orthomolecular framework; they are not standard diagnoses, and the conversation's claim that supplementing glycine by itself pushes people into SAM depletion is a hypothesis built on GNMT biochemistry that has not been tested in humans.",
      "Practical consequences that do follow from the biochemistry: methyl donors (choline/betaine, methionine, folate, B12) and cofactors (B6, riboflavin, magnesium for MAT and COMT) increase supply, whereas high flux through PEMT, GAMT or GNMT increases demand, and creatine supplementation lowers GAMT demand. Measured plasma SAM and SAH, and homocysteine, are the only direct indices."
    ],
    evidence: "established",
    facts: {
      reactome: "R-HSA-156581",
      kegg: "hsa00270",
      compartment: "cytosol (liver dominant)",
      tissue: "liver, kidney, brain, all tissues",
      "key-references": "Mudd & Poole 1975; Stead et al. 2006 (Am J Clin Nutr 83:5-10); Mudd et al. 2007"
    },
    relations: [
      { rel: "associated-with", to: "state:undermethylation", note: "biochemical correlate: low SAM:SAH; the clinical category is not standardised" },
      { rel: "associated-with", to: "state:overmethylation", note: "high SAM:SAH; GNMT is the buffer" },
      { rel: "interacts-with", to: "pathway:folate-cycle", note: "5-MTHF inhibits GNMT and supplies remethylation" },
      { rel: "interacts-with", to: "pathway:choline-oxidation", note: "betaine route regenerates methionine" },
      { rel: "interacts-with", to: "pathway:glycine-serine-route", note: "glycine is the GNMT substrate and its product sarcosine returns to glycine" }
    ],
    refs: ["article:melendez-hevia-2009-glycine-weak-link"]
  },
  {
    id: "pathway:vitamin-b6-activation",
    type: "pathway",
    name: "Vitamin B6 activation to pyridoxal 5'-phosphate (P5P)",
    aliases: ["ativação da vitamina B6", "piridoxina → P5P", "P5P", "PLP", "metabolismo da B6"],
    summary: "Dietary pyridoxine, pyridoxamine and pyridoxal are phosphorylated by PDXK and oxidised by PNPO to PLP, the cofactor of over 140 enzymes including GAD, SHMT, GLDC, CBS and CTH.",
    body: [
      "[[enzyme:pdxk]] phosphorylates the three vitamers ([[reaction:pdxk-pyridoxal-phosphorylation]]) and the FMN-dependent [[enzyme:pnpo]] oxidises pyridoxine and pyridoxamine 5'-phosphates to [[compound:plp]] ([[reaction:pnpo-pnp-oxidation]]). Phosphatases dephosphorylate PLP for transport; PLP binds proteins and is catabolised to 4-pyridoxic acid. Riboflavin status, Mg-ATP, drug inhibitors of PDXK, and PLP-trapping carbonyl compounds can all produce a functional deficiency despite normal intake ([[state:b6-functional-deficiency]]).",
      "In the conversation the patient responded well to P5P, and the explanation offered is that P5P bypasses a hepatic activation step. Because PDXK acts in all tissues and oral P5P is hydrolysed in the gut before absorption, the bypass explanation is oversimplified; a better-supported reading is that more PLP raised PLP-dependent enzymes (GAD, SHMT, GLDC, CBS and others), though the individual benefit can also arise from non-specific causes."
    ],
    evidence: "established",
    facts: {
      reactome: "R-HSA-964975",
      kegg: "hsa00750",
      compartment: "cytosol",
      tissue: "all tissues; liver is the main exporter of PLP to plasma"
    },
    relations: [
      { rel: "associated-with", to: "state:b6-functional-deficiency", note: "kinase or oxidase limitation, riboflavin or drug interference" },
      { rel: "interacts-with", to: "pathway:gaba-shunt", note: "supplies PLP to GAD/ABAT" },
      { rel: "interacts-with", to: "pathway:transsulfuration", note: "supplies PLP to CBS/CTH" },
      { rel: "interacts-with", to: "pathway:glycine-cleavage", note: "supplies PLP to GLDC" }
    ]
  },
  {
    id: "pathway:tma-tmao-axis",
    type: "pathway",
    name: "Gut bacterial TMA formation and hepatic TMAO (choline-TMA-TMAO axis)",
    aliases: ["eixo colina-TMA-TMAO", "trimetilamina", "TMAO", "síndrome do odor de peixe", "trimetilaminúria"],
    summary: "Gut bacteria cleave choline (and carnitine, betaine) to trimethylamine, which hepatic FMO3 oxidises to TMAO; FMO3 deficiency causes trimethylaminuria.",
    body: [
      "Anaerobic gut bacteria carrying CutC/CutD ([[enzyme:cutc]]) cleave [[compound:choline]] to [[compound:trimethylamine]] and acetaldehyde ([[reaction:choline-tma-lyase]]); related enzymes handle carnitine and betaine (Stickland betaine reductase). TMA is absorbed to the portal vein and N-oxidised by [[enzyme:fmo3]] to [[compound:tmao]] ([[reaction:fmo3-tma-n-oxidation]]), then excreted in urine. Free choline and betaine salts reach the colon more than phosphatidylcholine or GPC, which are largely absorbed earlier.",
      "The conversation correctly flags the fish-odour syndrome and the epidemiological association of TMAO with cardiovascular disease as reasons to avoid very high choline intake, but it overstates certainty regarding TMAO as a 'strong marker of endothelial stress'; causality is debated. The pathway matters here mainly because it shows that a choline-rich strategy has a bacterial branch ([[system:gut-microbiota]], [[disease:trimethylaminuria]])."
    ],
    evidence: "established",
    facts: {
      reactome: "R-HSA-139970",
      compartment: "colonic lumen (bacteria); hepatocyte ER (FMO3)",
      tissue: "colon, liver"
    },
    relations: [
      { rel: "associated-with", to: "disease:trimethylaminuria", note: "FMO3 deficiency; high choline or betaine intake aggravates odour" },
      { rel: "associated-with", to: "system:gut-microbiota", note: "TMA-producing taxa" },
      { rel: "interacts-with", to: "pathway:choline-oxidation", note: "bacterial cleavage competes with host oxidation and membrane uses" }
    ]
  },
  {
    id: "pathway:gut-bacterial-glycine-fates",
    type: "pathway",
    name: "Proposed gut-bacterial fates of free glycine (Stickland reduction, bacterial glycine cleavage, BSH release)",
    aliases: ["fermentação bacteriana da glicina", "descarboxilação bacteriana da glicina", "SIBO e glicina", "via de Stickland", "glicina e gás"],
    summary: "Proposed, largely conversation-only route by which overgrown upper-gut bacteria ferment free glycine to NH3 and CO2; supported as bacterial capability only, not as a shown cause of belching.",
    body: [
      "Two real bacterial enzyme systems can consume glycine: the selenium-dependent Stickland glycine reductase of some Clostridia ([[enzyme:bacterial-glycine-reductase]], [[reaction:bacterial-glycine-reductase]]) which gives acetyl phosphate and ammonia, and the bacterial glycine cleavage system ([[enzyme:bacterial-glycine-cleavage-system]], [[reaction:bacterial-glycine-cleavage]]) which gives CO2, ammonia and a folate one-carbon unit. In addition bile-salt hydrolase releases free glycine from glycine-conjugated bile acids in the lumen ([[reaction:bsh-glycocholate-deconjugation]]).",
      "The source conversation reasons that after acid suppression or in SIBO, free glycine powder reaches the proximal bacteria unabsorbed and is rapidly fermented, explaining belching within 15-45 minutes and not flatulence. Three points weaken this: free glycine is rapidly absorbed in the proximal small bowel by amino acid transporters; the Stickland reductase yields no CO2 itself and occurs in strict anaerobes more typical of the colon; and most belching is swallowed air. No breath-test or microbiome study of glycine fermentation after oral doses is known. The pathway is kept as a hypothesis worth testing (for example with a hydrogen/methane breath test, which the conversation also recommends) and is marked speculative ([[disease:sibo]], [[system:gut-microbiota]])."
    ],
    evidence: "speculative",
    facts: {
      compartment: "small-intestinal lumen (proposed); colonic lumen (established for Stickland organisms)",
      tissue: "upper gut bacteria (proposed)",
      note: "capability established; clinical relevance after oral glycine is conversation-only"
    },
    relations: [
      { rel: "associated-with", to: "disease:sibo", note: "conversation-only: overgrowth as the setting for glycine fermentation" },
      { rel: "associated-with", to: "system:gut-microbiota" },
      { rel: "associated-with", to: "outcome:belching", note: "conversation-only mechanism for eructation after glycine or collagen powder" },
      { rel: "associated-with", to: "state:hypochlorhydria", note: "loss of the acid barrier (PPIs) permits upper-gut colonisation; established as a risk, magnitude debated" }
    ]
  },
  {
    id: "pathway:h-pylori-urease-activity",
    type: "pathway",
    name: "Helicobacter pylori urease activity (urea to ammonia and CO2)",
    aliases: ["urease do H. pylori", "ureia → NH3 + CO2", "teste respiratório com ureia", "amônia gástrica"],
    summary: "H. pylori urease converts gastric urea to ammonia and CO2, buffering the bacterium's niche and underlying the urea breath test; proposed in the conversation as a source of belching.",
    body: [
      "[[enzyme:h-pylori-urease]] hydrolyses [[compound:urea]] ([[reaction:urease-urea-hydrolysis]]) into 2 [[compound:ammonia]] and [[compound:carbon-dioxide]]. Ammonia neutralises protons in the bacterium's periplasm and the surrounding mucus, allowing survival at pH 1-2 and permitting colonisation of the antrum; it also contributes to mucosal injury and low acid output when infection extends to the corpus ([[disease:h-pylori-infection]], [[disease:peptic-ulcer]]).",
      "The conversation recommends confirming eradication (breath test, stool antigen) because persistent urease activity 'is one of the largest causes of frequent belching and poor protein digestion'. Confirming eradication is sound clinical advice after ulcer treatment; the belching claim is not supported by controlled data, and the CO2 from urease is a small, rapidly absorbed fraction. It is recorded as conversation-only ([[outcome:belching]])."
    ],
    evidence: "established",
    facts: {
      compartment: "gastric mucus layer; bacterial periplasm and cytoplasm",
      tissue: "gastric antrum and corpus (colonised)",
      note: "urease biochemistry established; contribution to eructation is conversation-only"
    },
    relations: [
      { rel: "associated-with", to: "disease:h-pylori-infection", note: "key colonisation factor; urea breath test" },
      { rel: "associated-with", to: "disease:peptic-ulcer", note: "H. pylori is a major cause of gastric and duodenal ulcers" },
      { rel: "associated-with", to: "outcome:belching", note: "conversation-only: urease gas as a cause of eructation" },
      { rel: "associated-with", to: "state:hypochlorhydria", note: "chronic corpus-predominant infection can reduce acid output" }
    ]
  }
]
