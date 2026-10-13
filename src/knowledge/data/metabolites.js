// Small molecules, cofactors, redox carriers and pathway intermediates that appear as reaction participants.
// Added so every `reaction.reactants/products` id resolves. Identity data (formula, ChEBI, PubChem) come from
// ChEBI and PubChem; physiological statements cite the specific review or database named in `refs`.
// Charge states follow the Rhea/ChEBI convention used in reactions.js (pH about 7.3), so H+ and water are explicit.
export default [
  // ------------------------------------------------------------------ water, protons, ions, gases
  {
    id: "compound:water",
    type: "compound",
    name: "Water",
    aliases: ["H2O", "água", "agua"],
    summary: "Solvent of all biochemistry and an explicit reactant or product in hydrolysis, hydration and condensation steps of methyl, folate and acid-secretion chemistry.",
    body: [
      "Water is consumed by hydrolases such as [[enzyme:ahcy]] (SAH to homocysteine and adenosine) and [[enzyme:h-pylori-urease]] (urea to ammonia and CO2), and released by condensations such as [[enzyme:cbs]] (homocysteine plus serine) and the reverse [[enzyme:shmt]] reaction. Reaction entries list it explicitly because Rhea balances atoms and charge.",
      "In the parietal cell [[enzyme:carbonic-anhydrase]] hydrates CO2 with water to carbonic acid, which dissociates into the proton secreted as stomach acid and the bicarbonate returned to blood ([[pathway:gastric-acid-secretion]])."
    ],
    evidence: "established",
    facts: { formula: "H2O", molarMass: "18.015 g/mol", chebi: "CHEBI:15377", pubchem: "CID 962" },
    relations: [
      { rel: "precursor-of", to: "compound:carbonic-acid", note: "Hydration of CO2 (CO2 + H2O <-> H2CO3)" },
      { rel: "interacts-with", to: "compound:proton", note: "Ionisation of water and proton transfer underlie every acid-base step in these pathways" }
    ],
    refs: ["article:rhea-2022", "article:chebi-2016"]
  },
  {
    id: "compound:proton",
    type: "compound",
    name: "Proton (hydron, H+)",
    aliases: ["H+", "hydron", "hydrogen ion", "próton", "íon hidrogênio"],
    summary: "The hydrogen ion: pumped into the stomach lumen by the gastric H+/K+-ATPase to make acid, and listed explicitly in reactions where Rhea shows H+.",
    body: [
      "The gastric [[enzyme:h-k-atpase]] exchanges luminal K+ for cytosolic H+, concentrating protons about a million-fold above plasma; with [[compound:chloride]] they form [[compound:hydrochloric-acid]]. Proton-pump inhibitors ([[intervention:ppi-therapy]]) covalently block this step.",
      "In reaction equations the proton is bookkeeping: Rhea and ChEBI write ionised species at about pH 7.3, so H+ appears where a charged reactant or product changes protonation. It is not a measurement of pH and should not be read as free H+ concentration."
    ],
    evidence: "established",
    facts: { formula: "H+", molarMass: "1.008 g/mol", chebi: "CHEBI:15378", pubchem: "CID 1038" },
    relations: [
      { rel: "precursor-of", to: "compound:hydrochloric-acid", note: "With chloride in the parietal-cell canaliculus" },
      { rel: "part-of", to: "pathway:gastric-acid-secretion", note: "The secreted ion" }
    ],
    refs: ["article:schubert-2008-gastric-acid-secretion-control", "article:rhea-2022"]
  },
  {
    id: "compound:chloride",
    type: "compound",
    name: "Chloride",
    aliases: ["Cl-", "cloreto"],
    summary: "Major extracellular anion and the counter-ion of gastric acid: secreted with H+ by parietal cells to form HCl.",
    body: [
      "Chloride enters the parietal cell from plasma in exchange for bicarbonate and leaves through apical channels into the canaliculus, where it pairs with the protons delivered by [[enzyme:h-k-atpase]] ([[reaction:gastric-hcl-secretion]]). Its movement is part of [[pathway:gastric-acid-secretion]].",
      "Because bicarbonate leaves the cell on the blood side in exchange for chloride, secretion of acid causes a transient rise in plasma pH after meals (the alkaline tide)."
    ],
    evidence: "established",
    facts: { formula: "Cl-", molarMass: "35.45 g/mol", chebi: "CHEBI:17996", pubchem: "CID 312" },
    relations: [
      { rel: "precursor-of", to: "compound:hydrochloric-acid", note: "Counter-ion of the secreted proton" },
      { rel: "part-of", to: "pathway:gastric-acid-secretion" }
    ],
    refs: ["article:schubert-2008-gastric-acid-secretion-control"]
  },
  {
    id: "compound:oxygen",
    type: "compound",
    name: "Oxygen (dioxygen, O2)",
    aliases: ["O2", "dioxygen", "oxigênio"],
    summary: "Molecular oxygen: the oxidant for amine oxidases, hydroxylases and monooxygenases that appear here, such as DAO, PNPO, FMO3 and prolyl hydroxylase.",
    body: [
      "Oxygen is a substrate of [[enzyme:dao]] (histamine oxidation, producing hydrogen peroxide), [[enzyme:pnpo]] (PNP to PLP), [[enzyme:fmo3]] (TMA to TMAO) and [[enzyme:p4ha1]] (proline hydroxylation, which also needs 2-oxoglutarate and vitamin C).",
      "Oxygen-dependent steps are the main sources of reactive oxygen species in these pathways, for example the [[compound:hydrogen-peroxide]] released by amine oxidases."
    ],
    evidence: "established",
    facts: { formula: "O2", molarMass: "31.999 g/mol", chebi: "CHEBI:15379", pubchem: "CID 977" },
    relations: [
      { rel: "precursor-of", to: "compound:hydrogen-peroxide", note: "Reduced by amine oxidases such as DAO" },
      { rel: "cofactor-of", to: "enzyme:p4ha1", note: "Co-substrate for proline hydroxylation" }
    ],
    refs: ["article:rhea-2022", "article:chebi-2016"]
  },
  {
    id: "compound:hydrogen-peroxide",
    type: "compound",
    name: "Hydrogen peroxide (H2O2)",
    aliases: ["H2O2", "peróxido de hidrogênio", "água oxigenada"],
    summary: "A reactive oxygen species and signalling molecule released by oxidases such as DAO and PNPO; protective at nanomolar levels, damaging above them.",
    body: [
      "[[reaction:dao-histamine-oxidation]] and [[reaction:pnpo-pnp-oxidation]] both release H2O2 alongside their main product. Cells remove it with catalase, peroxiredoxins and the glutathione and thioredoxin systems ([[compound:glutathione]]).",
      "Sies distinguishes oxidative eustress (about 1-10 nM, signalling) from distress (above about 100 nM, damage). The amount produced by DAO in the gut is small relative to the enzyme's role in clearing dietary [[compound:histamine]]."
    ],
    evidence: "established",
    facts: { formula: "H2O2", molarMass: "34.015 g/mol", chebi: "CHEBI:16240", pubchem: "CID 784" },
    relations: [
      { rel: "product-of", to: "enzyme:dao", note: "Released alongside imidazole acetaldehyde and ammonia" },
      { rel: "decreases", to: "compound:glutathione", note: "Oxidises GSH when peroxide removal outpaces regeneration (peroxidase reaction)" }
    ],
    refs: ["article:sies-2017-h2o2-redox-signaling"]
  },
  // ------------------------------------------------------------------ nucleotides, phosphates, CoA
  {
    id: "compound:phosphate",
    type: "compound",
    name: "Inorganic phosphate (Pi)",
    aliases: ["Pi", "orthophosphate", "hydrogenphosphate", "fosfato", "fosfato inorgânico"],
    summary: "Inorganic orthophosphate: released when ATP is hydrolysed or phosphate esters are cleaved, and a co-substrate in bacterial glycine reductase.",
    body: [
      "[[reaction:mat-sam-synthesis]] splits the triphosphate of [[compound:atp]] into phosphate and [[compound:pyrophosphate]]; [[reaction:psph-phosphoserine-hydrolysis]] releases it from phosphoserine; and [[reaction:mthfd1-formate-thf-ligase]] and [[reaction:h-k-atpase-proton-pumping]] produce it from ATP. In bacterial glycine reductase it is consumed to make acetyl phosphate ([[reaction:bacterial-glycine-reductase]]).",
      "At pH 7.3 inorganic phosphate is mostly the monoprotonated hydrogenphosphate anion, which is the ChEBI form Rhea uses."
    ],
    evidence: "established",
    facts: { formula: "HPO4 2- (with H2PO4-) at pH 7.3", chebi: "CHEBI:43474 (hydrogenphosphate, as in Rhea)", pubchem: "CID 1061" },
    relations: [
      { rel: "product-of", to: "enzyme:psph", note: "Released when phosphoserine is hydrolysed to serine" },
      { rel: "interacts-with", to: "compound:magnesium", note: "Phosphate species chelate Mg2+" }
    ],
    refs: ["article:rhea-2022", "article:chebi-2016"]
  },
  {
    id: "compound:pyrophosphate",
    type: "compound",
    name: "Pyrophosphate (diphosphate, PPi)",
    aliases: ["PPi", "diphosphate", "pirofosfato"],
    summary: "Two linked phosphates released when ATP or CTP is cleaved to the monophosphate; its hydrolysis by pyrophosphatases drives nucleotidyl-transfer steps forward.",
    body: [
      "PPi is a by-product of [[reaction:mat-sam-synthesis]] (alongside phosphate), of CTP-dependent activation in [[reaction:pcyt1a-cdp-choline-synthesis]] and [[reaction:pcyt2-cdp-ethanolamine-synthesis]], and of bile-acid activation ([[reaction:bacs-cholate-coa-ligation]]). Rapid cleavage to two phosphates makes these steps effectively irreversible."
    ],
    evidence: "established",
    facts: { formula: "HP2O7 3- at pH 7.3", chebi: "CHEBI:33019 (diphosphate(3-), as in Rhea)", pubchem: "CID 644102" },
    relations: [
      { rel: "product-of", to: "enzyme:mat", note: "Released when ATP is consumed to make SAM" },
      { rel: "associated-with", to: "compound:phosphate", note: "Hydrolysed to two phosphates by pyrophosphatases" }
    ],
    refs: ["article:rhea-2022", "article:chebi-2016"]
  },
  {
    id: "compound:adp",
    type: "compound",
    name: "Adenosine diphosphate (ADP)",
    aliases: ["ADP", "adenosina difosfato"],
    summary: "Product of ATP-dependent kinases and ligases such as choline kinase, ETNK1, PDXK and MTHFD1 synthetase, and of the H+/K+-ATPase.",
    body: [
      "[[reaction:choline-kinase-phosphocholine]], [[reaction:etnk1-ethanolamine-phosphorylation]] and [[reaction:pdxk-pyridoxal-phosphorylation]] transfer the terminal phosphate of [[compound:atp]] to a substrate and leave ADP. [[reaction:h-k-atpase-proton-pumping]] leaves ADP and phosphate when ATP drives the proton pump.",
      "The ADP:ATP ratio, together with AMP, signals cellular energy state; here it matters only as the product of the kinases that activate choline, ethanolamine and vitamin B6."
    ],
    evidence: "established",
    facts: { formula: "C10H15N5O10P2", molarMass: "427.20 g/mol", chebi: "CHEBI:16761", pubchem: "CID 6022" },
    relations: [
      { rel: "product-of", to: "enzyme:h-k-atpase", note: "Left when ATP drives proton pumping" },
      { rel: "product-of", to: "enzyme:choline-kinase", note: "Co-product of choline phosphorylation" }
    ],
    refs: ["article:rhea-2022", "article:chebi-2016"]
  },
  {
    id: "compound:amp",
    type: "compound",
    name: "Adenosine monophosphate (AMP)",
    aliases: ["AMP", "adenosina monofosfato", "5'-AMP"],
    summary: "Product when ATP is split into AMP and pyrophosphate in ligase reactions such as bile-acid CoA activation.",
    body: [
      "[[reaction:bacs-cholate-coa-ligation]] consumes [[compound:atp]] and [[compound:coa]] to form [[compound:choloyl-coa]], [[compound:amp]] and [[compound:pyrophosphate]], using an adenylate intermediate. AMP is later recycled to ADP and ATP; it also activates the energy sensor AMPK, which is outside this knowledge base.",
      "AMP is the nucleotide part of the adenosine moiety found in coenzyme A, NAD and FAD."
    ],
    evidence: "established",
    facts: { formula: "C10H14N5O7P", molarMass: "347.22 g/mol", chebi: "CHEBI:16027", pubchem: "CID 6083" },
    relations: [
      { rel: "precursor-of", to: "compound:adenosine", note: "Dephosphorylation by 5'-nucleotidases" }
    ],
    refs: ["article:rhea-2022", "article:chebi-2016"]
  },
  {
    id: "compound:ctp",
    type: "compound",
    name: "Cytidine triphosphate (CTP)",
    aliases: ["CTP", "citidina trifosfato"],
    summary: "Activating nucleotide of the Kennedy pathway: transfers a cytidylyl group to phosphocholine or phosphoethanolamine to make CDP-choline and CDP-ethanolamine.",
    body: [
      "[[enzyme:pcyt1a]] and [[enzyme:pcyt2]] combine CTP with [[compound:phosphocholine]] or [[compound:phosphoethanolamine]], releasing [[compound:pyrophosphate]]. The CTP:phosphocholine cytidylyltransferase step is rate limiting for phosphatidylcholine synthesis by the CDP-choline route.",
      "CTP is made by CTP synthetase from UTP and glutamine, linking phospholipid synthesis to nucleotide and amino acid supply."
    ],
    evidence: "established",
    facts: { formula: "C9H16N3O14P3", molarMass: "483.16 g/mol", chebi: "CHEBI:17677", pubchem: "CID 6176" },
    relations: [
      { rel: "substrate-of", to: "pathway:kennedy-pathway", note: "Activating nucleotide" },
      { rel: "precursor-of", to: "compound:cdp-choline", note: "With phosphocholine" }
    ],
    refs: ["article:kennedy-1956-cytidine-coenzymes", "article:vance-2014-phospholipid-methylation"]
  },
  {
    id: "compound:cmp",
    type: "compound",
    name: "Cytidine monophosphate (CMP)",
    aliases: ["CMP", "citidina monofosfato", "5'-CMP"],
    summary: "Product released when a CDP-linked head group is transferred to diacylglycerol in the final Kennedy-pathway steps.",
    body: [
      "[[reaction:chpt1-cdp-choline-to-pc]] and [[reaction:ept-cdp-ethanolamine-to-pe]] transfer phosphocholine or phosphoethanolamine from the CDP-carrier to [[compound:diacylglycerol]], releasing CMP. The CMP is recycled to CTP through nucleotide kinases.",
      "CMP therefore tracks one cycle of the cytidine-coenzyme strategy described by Kennedy and Weiss."
    ],
    evidence: "established",
    facts: { formula: "C9H14N3O8P", molarMass: "323.20 g/mol", chebi: "CHEBI:17361", pubchem: "CID 6131" },
    relations: [
      { rel: "part-of", to: "pathway:kennedy-pathway", note: "By-product of the phosphotransferase steps" }
    ],
    refs: ["article:kennedy-1956-cytidine-coenzymes"]
  },
  {
    id: "compound:coa",
    type: "compound",
    name: "Coenzyme A (CoA, CoASH)",
    aliases: ["CoA", "CoASH", "coenzima A"],
    summary: "Acyl-carrier cofactor derived from pantothenate; carries acetyl and bile-acyl groups in ChAT and bile-acid conjugation reactions.",
    body: [
      "CoA forms thioesters with acyl groups. Here it supplies the acetyl donor [[compound:acetyl-coa]] for [[enzyme:chat]] and is the carrier that activates [[compound:cholate]] to [[compound:choloyl-coa]] before conjugation with glycine or taurine ([[pathway:bile-acid-conjugation]]).",
      "Free CoA is released when the acyl group is transferred, for example in [[reaction:chat-acetylcholine-synthesis]] and [[reaction:baat-glycine-conjugation]]."
    ],
    evidence: "established",
    facts: { formula: "C21H36N7O16P3S", molarMass: "767.5 g/mol", chebi: "CHEBI:15346", pubchem: "CID 87642" },
    relations: [
      { rel: "precursor-of", to: "compound:acetyl-coa", note: "Acetylation of the thiol" },
      { rel: "cofactor-of", to: "enzyme:slc27a5", note: "Co-substrate for bile-acid CoA ligation" }
    ],
    refs: ["article:shi-2015-acetyl-coa-metabolism", "article:chebi-2016"]
  },
  {
    id: "compound:acetyl-coa",
    type: "compound",
    name: "Acetyl-CoA",
    aliases: ["acetyl-CoA", "acetil-CoA", "acetyl coenzyme A"],
    summary: "Two-carbon thioester and central metabolic node; the acetyl donor for acetylcholine synthesis by ChAT.",
    body: [
      "[[enzyme:chat]] transfers the acetyl group of acetyl-CoA to [[compound:choline]], forming [[compound:acetylcholine]] and free [[compound:coa]] ([[reaction:chat-acetylcholine-synthesis]]). Acetyl-CoA is generated in mitochondria from pyruvate and fatty acids and must be exported (as citrate) for cytosolic uses, so acetylcholine synthesis depends on energy metabolism as well as choline supply.",
      "More generally, nucleocytosolic acetyl-CoA levels signal a fed state and drive lipid synthesis and histone acetylation."
    ],
    evidence: "established",
    facts: { formula: "C23H38N7O17P3S", molarMass: "809.6 g/mol", chebi: "CHEBI:15351", pubchem: "CID 444493" },
    relations: [
      { rel: "precursor-of", to: "compound:acetylcholine", note: "Acetyl donor via ChAT" },
      { rel: "substrate-of", to: "pathway:acetylcholine-synthesis" }
    ],
    refs: ["article:shi-2015-acetyl-coa-metabolism"]
  },
  // ------------------------------------------------------------------ nicotinamide redox carriers
  {
    id: "compound:nad",
    type: "compound",
    name: "NAD+ (nicotinamide adenine dinucleotide, oxidised)",
    aliases: ["NAD+", "NAD", "NAD(+)", "nicotinamida adenina dinucleotídeo", "DPN"],
    summary: "Oxidised nicotinamide coenzyme: the hydride acceptor in dehydrogenases such as PHGDH, BADH, SSADH and the glycine cleavage system; made from niacin or nicotinamide.",
    body: [
      "NAD+ accepts a hydride to become [[compound:nadh]] in [[reaction:phgdh-3pg-oxidation]], [[reaction:badh-betaine-aldehyde-oxidation]], [[reaction:aldh5a1-succinate-semialdehyde-oxidation]] and in the L protein ([[enzyme:dld]]) step of the [[enzyme:glycine-cleavage-system]]. It is also consumed by sirtuins and PARPs, which are outside this knowledge base.",
      "Dietary [[compound:niacin]] and [[compound:nicotinamide]] are its precursors. The methylation of nicotinamide by [[enzyme:nnmt]] is one of the SAM-consuming reactions that connect vitamin B3 handling to the methyl budget ([[pathway:methyl-budget]])."
    ],
    evidence: "established",
    facts: { formula: "C21H27N7O14P2 (zwitterion)", molarMass: "663.4 g/mol", chebi: "CHEBI:15846", pubchem: "CID 5892" },
    relations: [
      { rel: "cofactor-of", to: "enzyme:dld", note: "Terminal oxidant for dihydrolipoamide in the glycine cleavage system" },
      { rel: "cofactor-of", to: "enzyme:phgdh", note: "Hydride acceptor in serine biosynthesis" }
    ],
    refs: ["article:ying-2008-nad-nadp", "article:chebi-2016"]
  },
  {
    id: "compound:nadh",
    type: "compound",
    name: "NADH (reduced nicotinamide adenine dinucleotide)",
    aliases: ["NADH", "NAD(H)", "DPNH"],
    summary: "Reduced form of NAD; carries hydride from dehydrogenases to the respiratory chain.",
    body: [
      "NADH is produced by the dehydrogenases listed under [[compound:nad]], including [[enzyme:aldh7a1]] (betaine aldehyde oxidation) and [[enzyme:phgdh]]. Its oxidation by mitochondrial complex I regenerates NAD+ and yields ATP.",
      "NADH and NAD+ together set the cytosolic and mitochondrial redox state that regulates the direction of reversible steps such as the PHGDH reaction."
    ],
    evidence: "established",
    facts: { formula: "C21H29N7O14P2", molarMass: "665.4 g/mol", chebi: "CHEBI:16908", pubchem: "CID 439153" },
    relations: [
      { rel: "associated-with", to: "compound:nad", note: "Redox partner; interconverted by dehydrogenases" }
    ],
    refs: ["article:ying-2008-nad-nadp"]
  },
  {
    id: "compound:nadp",
    type: "compound",
    name: "NADP+ (oxidised)",
    aliases: ["NADP+", "NADP", "NADP(+)", "TPN"],
    summary: "Phosphorylated analogue of NAD+ used in reductive biosynthesis and antioxidant systems; the oxidised product when NADPH donates hydride in MTHFR, MTRR and FMO3.",
    body: [
      "[[reaction:mthfr-methylene-thf-reduction]], [[reaction:mtrr-cobalamin-reactivation]] and [[reaction:fmo3-tma-n-oxidation]] all convert [[compound:nadph]] to NADP+. The NADP+/NADPH pool is kept highly reduced by the pentose-phosphate pathway, so these reductive steps are supported as long as glucose metabolism is intact.",
      "NADP+ also acts as the oxidant in [[reaction:mthfd1-methylene-thf-oxidation]] (the NADP-dependent dehydrogenase of MTHFD1)."
    ],
    evidence: "established",
    facts: { formula: "C21H28N7O17P3", molarMass: "743.4 g/mol", chebi: "CHEBI:18009", pubchem: "CID 5885" },
    relations: [
      { rel: "cofactor-of", to: "enzyme:mthfd1", note: "Oxidant of the methylene-THF dehydrogenase activity" }
    ],
    refs: ["article:ying-2008-nad-nadp"]
  },
  {
    id: "compound:nadph",
    type: "compound",
    name: "NADPH (reduced)",
    aliases: ["NADPH", "NADP(H)", "TPNH"],
    summary: "Reduced nicotinamide coenzyme that powers reductive biosynthesis and antioxidant defence; supplies the electrons for MTHFR, MTRR and FMO3.",
    body: [
      "NADPH provides the hydride that [[enzyme:mthfr]] uses to reduce methylene-THF to [[compound:5-mthf]], the electrons that [[enzyme:mtrr]] uses to reactivate [[enzyme:mtr]], and the reducing equivalents for [[enzyme:fmo3]]. It also drives the thioredoxin and glutathione systems.",
      "Riboflavin-derived FAD is a cofactor of MTHFR and FMO3, so flavin status and NADPH supply both limit these steps ([[compound:riboflavin]])."
    ],
    evidence: "established",
    facts: { formula: "C21H30N7O17P3", molarMass: "745.4 g/mol", chebi: "CHEBI:16474", pubchem: "CID 5884" },
    relations: [
      { rel: "cofactor-of", to: "enzyme:mthfr", note: "Hydride donor" },
      { rel: "cofactor-of", to: "enzyme:mtrr", note: "Electron donor for cob(II)alamin reduction" }
    ],
    refs: ["article:ying-2008-nad-nadp", "article:lu-2014-thioredoxin-system"]
  },
  // ------------------------------------------------------------------ thiol/electron carriers and generic acceptors
  {
    id: "compound:thioredoxin-dithiol",
    type: "compound",
    name: "Thioredoxin (reduced, dithiol form)",
    aliases: ["Trx-(SH)2", "reduced thioredoxin", "tioredoxina reduzida"],
    summary: "Small redox protein with a dithiol active site that donates electrons to reductases; the electron source for bacterial glycine reductase.",
    body: [
      "Reduced thioredoxin is regenerated from the oxidised form by thioredoxin reductase and [[compound:nadph]]. In the proposed gut-bacterial route, [[reaction:bacterial-glycine-reductase]] uses it to reduce a glycine-derived intermediate to [[compound:acetyl-phosphate]] and [[compound:ammonia]].",
      "Modelled as a single compound entity for stoichiometry; the actual species is a protein (human TXN is UniProt P10599) whose bacterial homologue is used in these fermentations."
    ],
    evidence: "established",
    facts: { class: "protein cofactor (redox)", uniprot: "P10599 (human TXN)", "active-site": "Cys-Gly-Pro-Cys" },
    relations: [
      { rel: "associated-with", to: "compound:thioredoxin-disulfide", note: "Redox partner" },
      { rel: "cofactor-of", to: "enzyme:bacterial-glycine-reductase", note: "Electron donor" }
    ],
    refs: ["article:lu-2014-thioredoxin-system"]
  },
  {
    id: "compound:thioredoxin-disulfide",
    type: "compound",
    name: "Thioredoxin (oxidised, disulfide form)",
    aliases: ["Trx-S2", "oxidised thioredoxin", "tioredoxina oxidada"],
    summary: "Oxidised thioredoxin with an intramolecular disulfide; the product after it donates electrons, recycled by thioredoxin reductase and NADPH.",
    body: [
      "In [[reaction:bacterial-glycine-reductase]] reduced thioredoxin becomes this form while glycine is reduced to acetyl phosphate. Thioredoxin reductase then restores the dithiol using [[compound:nadph]].",
      "The oxidised protein is the species that thioredoxin-interacting protein binds to regulate redox signalling and cell death in mammalian cells."
    ],
    evidence: "established",
    facts: { class: "protein cofactor (redox)", uniprot: "P10599 (human TXN)" },
    relations: [
      { rel: "associated-with", to: "compound:thioredoxin-dithiol", note: "Redox partner" }
    ],
    refs: ["article:lu-2014-thioredoxin-system"]
  },
  {
    id: "compound:etf-oxidized",
    type: "compound",
    name: "Electron transfer flavoprotein (oxidised, ETF)",
    aliases: ["ETF", "ETF ox", "flavoproteína transferidora de elétrons"],
    summary: "Mitochondrial flavoprotein that accepts electrons from DMGDH and SARDH (and other flavoenzymes) and passes them to ubiquinone via ETF-QO.",
    body: [
      "[[enzyme:dmgdh]] and [[enzyme:sardh]] reduce ETF while demethylating [[compound:dimethylglycine]] and [[compound:sarcosine]] ([[reaction:dmgdh-dimethylglycine-demethylation]], [[reaction:sardh-sarcosine-demethylation]]). ETF carries FAD and AMP and is a heterodimer (ETFA, ETFB).",
      "The reactions here treat ETF as a simple oxidised/reduced pair; Reactome depicts FAD/FADH2 in the same position."
    ],
    evidence: "established",
    facts: { class: "flavoprotein (FAD + AMP)", uniprot: "P13804 (ETFA); P38117 (ETFB)", compartment: "mitochondrial matrix" },
    relations: [
      { rel: "associated-with", to: "compound:etf-reduced", note: "Redox partner" }
    ],
    refs: ["article:watmough-2010-etf-qo"]
  },
  {
    id: "compound:etf-reduced",
    type: "compound",
    name: "Electron transfer flavoprotein (reduced)",
    aliases: ["ETF red", "ETFH2", "ETF reduzida"],
    summary: "Reduced ETF produced when mitochondrial flavoprotein dehydrogenases such as DMGDH and SARDH oxidise their substrates; reoxidised by ETF-QO.",
    body: [
      "Reduced ETF hands its electrons to ETF:ubiquinone oxidoreductase, which feeds the ubiquinone pool of the respiratory chain. A defect in this shared route causes multiple acyl-CoA dehydrogenase deficiency.",
      "In this knowledge base it appears as the product of [[reaction:dmgdh-dimethylglycine-demethylation]] and [[reaction:sardh-sarcosine-demethylation]] ([[compound:etf-oxidized]] is the substrate)."
    ],
    evidence: "established",
    facts: { class: "flavoprotein (FAD + AMP)", uniprot: "P13804 (ETFA); P38117 (ETFB)", compartment: "mitochondrial matrix" },
    relations: [
      { rel: "associated-with", to: "compound:etf-oxidized", note: "Redox partner" }
    ],
    refs: ["article:watmough-2010-etf-qo"]
  },
  {
    id: "compound:hydrogen-acceptor",
    type: "compound",
    name: "Generic hydrogen acceptor (A)",
    aliases: ["A", "acceptor", "hydrogen acceptor", "aceitador de hidrogênio"],
    summary: "Placeholder for the unspecified electron/hydrogen acceptor of choline dehydrogenase in Rhea and Reactome; the physiological acceptor is not firmly established.",
    body: [
      "[[enzyme:chdh]] oxidises [[compound:choline]] to [[compound:betaine-aldehyde]] while reducing an acceptor, written generically as A / AH2 in database records ([[reaction:chdh-choline-oxidation]]). In the mitochondrial inner membrane the electrons enter the respiratory chain, probably via ubiquinone, but databases do not specify it.",
      "This entry is a modelling convenience so the reaction balances; it is not a real compound."
    ],
    evidence: "plausible",
    facts: { class: "generic placeholder", "reduced-form": "compound:hydrogen-acceptor-reduced" },
    relations: [
      { rel: "associated-with", to: "compound:hydrogen-acceptor-reduced", note: "Redox partner" }
    ]
  },
  {
    id: "compound:hydrogen-acceptor-reduced",
    type: "compound",
    name: "Generic hydrogen acceptor, reduced (AH2)",
    aliases: ["AH2", "reduced acceptor", "aceitador reduzido"],
    summary: "Reduced form of the generic acceptor in the choline dehydrogenase reaction; a placeholder for whatever the enzyme reduces.",
    body: [
      "Product of [[reaction:chdh-choline-oxidation]] alongside [[compound:betaine-aldehyde]]. The reduced acceptor equals [[compound:hydrogen-acceptor]] plus two hydrogens, so no separate proton is written.",
      "As with its oxidised partner it is a bookkeeping entity, kept so the reaction balances."
    ],
    evidence: "plausible",
    facts: { class: "generic placeholder" },
    relations: [
      { rel: "associated-with", to: "compound:hydrogen-acceptor", note: "Redox partner" }
    ]
  },
  // ------------------------------------------------------------------ carbon units and folates
  {
    id: "compound:10-formyl-thf",
    type: "compound",
    name: "10-Formyltetrahydrofolate (10-formyl-THF)",
    aliases: ["10-CHO-THF", "10-formil-THF", "formyl-THF"],
    summary: "Folate form carrying a formyl group at the oxidation level of formate; supplies carbon for purine synthesis and is interconverted with formate by MTHFD1.",
    body: [
      "[[enzyme:mthfd1]] makes 10-formyl-THF from [[compound:thf]], [[compound:formate]] and ATP ([[reaction:mthfd1-formate-thf-ligase]]) and from [[compound:5-10-methenyl-thf]] by cyclohydrolysis ([[reaction:mthfd1-methenyl-thf-cyclohydrolase]]). In the opposite direction it releases formate, the mitochondrial output of one-carbon metabolism.",
      "It is a donor for two steps of purine synthesis, so folate depletion impairs DNA synthesis independently of methylation. See [[pathway:folate-cycle]]."
    ],
    evidence: "established",
    facts: { formula: "C20H23N7O7", molarMass: "473.4 g/mol", chebi: "CHEBI:15637", pubchem: "CID 135450591" },
    relations: [
      { rel: "part-of", to: "pathway:folate-cycle" },
      { rel: "precursor-of", to: "compound:formate", note: "Reversible release of formate" }
    ],
    refs: ["article:reactome-folate-pterine-metabolism"]
  },
  {
    id: "compound:5-10-methenyl-thf",
    type: "compound",
    name: "5,10-Methenyltetrahydrofolate",
    aliases: ["5,10-CH=THF", "metenil-THF", "methenyl-THF"],
    summary: "Folate form at the oxidation level of formate; an intermediate between 5,10-methylene-THF and 10-formyl-THF in the MTHFD1 reactions.",
    body: [
      "[[enzyme:mthfd1]] oxidises [[compound:5-10-methylene-thf]] to this cation using NADP+ ([[reaction:mthfd1-methylene-thf-oxidation]]), and then hydrates it to [[compound:10-formyl-thf]] ([[reaction:mthfd1-methenyl-thf-cyclohydrolase]]). The two activities are on the same polypeptide, so free methenyl-THF is a short-lived channelled intermediate.",
      "Its location between methylene-THF and formyl-THF is why MTHFD1 variants can alter both nucleotide synthesis and methyl supply."
    ],
    evidence: "established",
    facts: { formula: "C20H22N7O6+", molarMass: "456.4 g/mol", chebi: "CHEBI:15638", pubchem: "CID 135398657" },
    relations: [
      { rel: "part-of", to: "pathway:folate-cycle" }
    ],
    refs: ["article:reactome-folate-pterine-metabolism"]
  },
  // ------------------------------------------------------------------ amino acids, serine route, and related
  {
    id: "compound:2-oxoglutarate",
    type: "compound",
    name: "2-Oxoglutarate (alpha-ketoglutarate)",
    aliases: ["alpha-ketoglutarate", "alfa-cetoglutarato", "2-OG", "AKG"],
    summary: "Tricarboxylic acid cycle intermediate and the amino group acceptor in GABA transaminase and prolyl hydroxylase reactions.",
    body: [
      "[[enzyme:abat]] transfers the amino group of [[compound:gaba]] to 2-oxoglutarate, regenerating [[compound:glutamate]] and forming [[compound:succinate-semialdehyde]] ([[reaction:abat-gaba-transamination]]), which closes the GABA shunt around the TCA cycle ([[pathway:gaba-shunt]]). [[enzyme:p4ha1]] needs it, with oxygen and iron, to hydroxylate collagen proline ([[reaction:p4h-prolyl-hydroxylation]]).",
      "It is converted to succinate in the decarboxylation reaction of prolyl hydroxylase, linking collagen maturation to vitamin C and TCA-cycle supply."
    ],
    evidence: "established",
    facts: { formula: "C5H6O5", molarMass: "146.10 g/mol", chebi: "CHEBI:30915", pubchem: "CID 51" },
    relations: [
      { rel: "precursor-of", to: "compound:glutamate", note: "Transamination" },
      { rel: "cofactor-of", to: "enzyme:p4ha1", note: "Co-substrate that becomes succinate" }
    ],
    refs: ["article:petroff-2002-gaba-glutamate", "article:rahimi-2026-statpearls-collagen-synthesis"]
  },
  {
    id: "compound:succinate",
    type: "compound",
    name: "Succinate",
    aliases: ["succinic acid", "succinato", "ácido succínico"],
    summary: "TCA cycle intermediate; the end product of the GABA shunt when succinic semialdehyde is oxidised by SSADH, and a by-product of prolyl hydroxylation.",
    body: [
      "[[enzyme:aldh5a1]] oxidises [[compound:succinate-semialdehyde]] with [[compound:nad]] to succinate ([[reaction:aldh5a1-succinate-semialdehyde-oxidation]]), which re-enters the TCA cycle ([[pathway:gaba-shunt]]). It is also the by-product that arises from 2-oxoglutarate in the collagen prolyl hydroxylase reaction.",
      "Defects in SSADH raise GABA and gamma-hydroxybutyrate and are a rare cause of neurological disease."
    ],
    evidence: "established",
    facts: { formula: "C4H6O4", molarMass: "118.09 g/mol", chebi: "CHEBI:15741", pubchem: "CID 1110" },
    relations: [
      { rel: "product-of", to: "pathway:gaba-shunt", note: "Final carbon product" }
    ],
    refs: ["article:petroff-2002-gaba-glutamate", "article:hmdb-2022"]
  },
  {
    id: "compound:succinate-semialdehyde",
    type: "compound",
    name: "Succinic semialdehyde (SSA)",
    aliases: ["succinate semialdehyde", "4-oxobutanoate", "semialdeído succínico", "SSA"],
    summary: "Intermediate of GABA catabolism formed by GABA transaminase and oxidised to succinate by SSADH.",
    body: [
      "[[enzyme:abat]] converts [[compound:gaba]] and [[compound:2-oxoglutarate]] into SSA and [[compound:glutamate]]; [[enzyme:aldh5a1]] then oxidises SSA to [[compound:succinate]]. If SSADH is deficient, SSA is instead reduced to gamma-hydroxybutyrate.",
      "SSA is the only carbon route from GABA back into the TCA cycle ([[pathway:gaba-shunt]])."
    ],
    evidence: "established",
    facts: { formula: "C4H6O3", molarMass: "102.09 g/mol", chebi: "CHEBI:16265", pubchem: "CID 1112" },
    relations: [
      { rel: "part-of", to: "pathway:gaba-shunt" }
    ],
    refs: ["article:petroff-2002-gaba-glutamate"]
  },
  {
    id: "compound:3-phosphoglycerate",
    type: "compound",
    name: "3-Phosphoglycerate (3-PG)",
    aliases: ["3-PGA", "3-fosfoglicerato", "3-phosphoglyceric acid"],
    summary: "Glycolytic intermediate diverted by PHGDH into the serine biosynthesis pathway.",
    body: [
      "[[enzyme:phgdh]] oxidises 3-PG with [[compound:nad]] to [[compound:3-phosphohydroxypyruvate]], the committed step toward [[compound:serine]] ([[reaction:phgdh-3pg-oxidation]]). Serine made this way supplies glycine and one-carbon units through [[enzyme:shmt]], so glycolytic flux feeds folate metabolism.",
      "The pathway is highly active in proliferating cells; in healthy adults most serine comes from diet, protein turnover and glycine."
    ],
    evidence: "established",
    facts: { formula: "C3H7O7P", molarMass: "186.06 g/mol", chebi: "CHEBI:17050", pubchem: "CID 724" },
    relations: [
      { rel: "precursor-of", to: "compound:serine", note: "Via PHGDH, PSAT1 and PSPH" },
      { rel: "substrate-of", to: "enzyme:phgdh" }
    ],
    refs: ["article:mattaini-2016-serine-metabolism"]
  },
  {
    id: "compound:3-phosphohydroxypyruvate",
    type: "compound",
    name: "3-Phosphohydroxypyruvate",
    aliases: ["3-PHP", "3-fosfo-hidroxipiruvato", "3-phosphonooxypyruvate"],
    summary: "Keto-acid intermediate of serine biosynthesis between PHGDH and PSAT1.",
    body: [
      "Formed by [[enzyme:phgdh]] from [[compound:3-phosphoglycerate]], it is transaminated by [[enzyme:psat1]] with [[compound:glutamate]] to [[compound:3-phosphoserine]] and [[compound:2-oxoglutarate]] ([[reaction:psat1-phosphoserine-transamination]]). PSAT1 is PLP-dependent, linking serine synthesis to vitamin B6.",
      "The PHGDH step is thermodynamically unfavourable and is pulled forward by the downstream steps."
    ],
    evidence: "established",
    facts: { formula: "C3H5O7P", molarMass: "184.04 g/mol", chebi: "CHEBI:30933", pubchem: "CID 105" },
    relations: [
      { rel: "precursor-of", to: "compound:3-phosphoserine" }
    ],
    refs: ["article:mattaini-2016-serine-metabolism"]
  },
  {
    id: "compound:3-phosphoserine",
    type: "compound",
    name: "3-Phosphoserine (O-phosphoserine)",
    aliases: ["O-phospho-L-serine", "fosfoserina", "P-Ser"],
    summary: "Phosphorylated serine precursor released as free serine by PSPH in the last step of serine biosynthesis.",
    body: [
      "[[enzyme:psph]] hydrolyses the phosphate ester to give [[compound:serine]] and [[compound:phosphate]] ([[reaction:psph-phosphoserine-hydrolysis]]), an essentially irreversible step that commits the pathway.",
      "Deficiency of any of the three enzymes causes Neu-Laxova-spectrum disorders and serine-deficiency syndromes treated with serine and glycine."
    ],
    evidence: "established",
    facts: { formula: "C3H8NO6P", molarMass: "185.07 g/mol", chebi: "CHEBI:15811", pubchem: "CID 68841" },
    relations: [
      { rel: "precursor-of", to: "compound:serine" },
      { rel: "substrate-of", to: "enzyme:psph" }
    ],
    refs: ["article:mattaini-2016-serine-metabolism"]
  },
  {
    id: "compound:arginine",
    type: "compound",
    name: "L-Arginine",
    aliases: ["Arg", "arginina"],
    summary: "Amino acid that donates its amidino group to glycine in the first step of creatine synthesis (AGAT), leaving ornithine.",
    body: [
      "[[enzyme:gatm]] transfers the guanidino group of arginine to [[compound:glycine]] to form [[compound:guanidinoacetate]] and [[compound:ornithine]] ([[reaction:agat-guanidinoacetate-synthesis]]); [[enzyme:gamt]] then methylates guanidinoacetate with [[compound:sam]] to make [[compound:creatine]]. Creatine synthesis is therefore both a glycine sink and a major methyl sink ([[pathway:creatine-synthesis]]).",
      "Arginine is also the precursor of nitric oxide and urea; in healthy adults supplemental intakes up to 20 g/day were reported without adverse effects in an Observed Safe Level assessment."
    ],
    evidence: "established",
    facts: { formula: "C6H14N4O2", molarMass: "174.20 g/mol", chebi: "CHEBI:16467", pubchem: "CID 6322" },
    relations: [
      { rel: "precursor-of", to: "compound:guanidinoacetate", note: "Amidino group donor" },
      { rel: "precursor-of", to: "compound:ornithine", note: "Amidino transfer leaves ornithine" }
    ],
    refs: ["article:brosnan-2007-creatine-review", "article:shao-2008-osl-taurine-glutamine-arginine", "article:hmdb-2022"]
  },
  {
    id: "compound:ornithine",
    type: "compound",
    name: "L-Ornithine",
    aliases: ["Orn", "ornitina"],
    summary: "Non-proteinogenic amino acid released by AGAT when arginine donates its amidino group to glycine; part of the urea cycle.",
    body: [
      "Ornithine is the by-product of [[reaction:agat-guanidinoacetate-synthesis]]. It is recycled through the urea cycle back to [[compound:arginine]] and is also the precursor of polyamines.",
      "In the creatine route it marks the step that spends glycine and arginine before the SAM-dependent methylation by GAMT."
    ],
    evidence: "established",
    facts: { formula: "C5H12N2O2", molarMass: "132.16 g/mol", chebi: "CHEBI:15729", pubchem: "CID 6262" },
    relations: [
      { rel: "product-of", to: "enzyme:gatm", note: "Co-product of guanidinoacetate formation" }
    ],
    refs: ["article:brosnan-2007-creatine-review", "article:hmdb-2022"]
  },
  {
    id: "compound:gamma-glutamylcysteine",
    type: "compound",
    name: "Gamma-glutamylcysteine (gamma-Glu-Cys)",
    aliases: ["gamma-GC", "g-glutamilcisteína", "γ-glutamylcysteine"],
    summary: "Dipeptide formed by glutamate-cysteine ligase, the rate-limiting step of glutathione synthesis; glycine is then added by glutathione synthetase.",
    body: [
      "[[enzyme:glutamate-cysteine-ligase]] joins the gamma-carboxyl of [[compound:glutamate]] to [[compound:cysteine]] ([[reaction:gcl-gamma-glutamylcysteine-synthesis]]), and [[enzyme:gss]] adds [[compound:glycine]] to give [[compound:glutathione]] ([[reaction:gss-glutathione-synthesis]]). Cysteine supply, which comes from methionine through [[pathway:transsulfuration]], is usually limiting.",
      "Glycine, by contrast, is typically saturating for GSS in healthy people, although glycine and cysteine together restored glutathione synthesis in older adults in one small study."
    ],
    evidence: "established",
    facts: { formula: "C8H14N2O5S", molarMass: "250.27 g/mol", chebi: "CHEBI:17515", pubchem: "CID 123938" },
    relations: [
      { rel: "precursor-of", to: "compound:glutathione" },
      { rel: "part-of", to: "pathway:glutathione-synthesis" }
    ],
    refs: ["article:sekhar-2011-glynac-glutathione", "article:rhea-2022"]
  },
  {
    id: "compound:2-oxobutanoate",
    type: "compound",
    name: "2-Oxobutanoate (alpha-ketobutyrate)",
    aliases: ["alpha-ketobutyrate", "2-ketobutyrate", "alfa-cetobutirato", "2-oxobutyric acid"],
    summary: "Keto acid formed when cystathionine is cleaved by CTH in transsulfuration; it is further oxidised to propionyl-CoA.",
    body: [
      "[[enzyme:cth]] splits [[compound:cystathionine]] into [[compound:cysteine]], [[compound:ammonia]] and 2-oxobutanoate ([[reaction:cth-cystathionine-cleavage]]), completing the conversion of homocysteine sulfur into cysteine ([[pathway:transsulfuration]]).",
      "The carbon skeleton originates from methionine and ends in propionyl-CoA, where its metabolism overlaps with that of [[compound:methylmalonic-acid]]."
    ],
    evidence: "established",
    facts: { formula: "C4H6O3", molarMass: "102.09 g/mol", chebi: "CHEBI:30831", pubchem: "CID 58" },
    relations: [
      { rel: "product-of", to: "enzyme:cth" },
      { rel: "part-of", to: "pathway:transsulfuration" }
    ],
    refs: ["article:reactome-sulfur-amino-acid-metabolism"]
  },
  {
    id: "compound:s-methylmethionine",
    type: "compound",
    name: "S-Methylmethionine (SMM, vitamin U)",
    aliases: ["SMM", "vitamin U", "S-metilmetionina", "vitamina U"],
    summary: "Plant-derived methionine sulfonium compound that BHMT2 can use as methyl donor for homocysteine, yielding two methionines.",
    body: [
      "[[enzyme:bhmt2]] transfers a methyl group from SMM to [[compound:homocysteine]], forming two molecules of [[compound:methionine]] ([[reaction:bhmt2-smm-homocysteine]]). SMM is abundant in cabbage, celery and other vegetables, but the importance of this route to human methylation is not established.",
      "In vitro, the enzyme cannot use [[compound:betaine]], and betaine does not inhibit it, so SMM and betaine use different enzymes."
    ],
    evidence: "plausible",
    facts: { class: "methionine-derived sulfonium compound", chebi: "CHEBI:67050", pubchem: "CID 10197842" },
    relations: [
      { rel: "precursor-of", to: "compound:methionine", note: "Methyl donor in the BHMT2 reaction" },
      { rel: "decreases", to: "compound:homocysteine", note: "Via BHMT2 remethylation" }
    ],
    refs: ["article:szegedi-2008-bhmt2-smm"]
  },
  // ------------------------------------------------------------------ choline, bile acid and phospholipid intermediates
  {
    id: "compound:diacylglycerol",
    type: "compound",
    name: "Diacylglycerol (DAG)",
    aliases: ["DAG", "1,2-diacylglycerol", "diacilglicerol", "diglyceride"],
    summary: "Glycerolipid that receives the phosphocholine or phosphoethanolamine head group from the CDP-carrier in the last Kennedy-pathway step.",
    body: [
      "[[enzyme:chpt1]], [[enzyme:cept1]] and [[enzyme:selenoi]] transfer the head group from [[compound:cdp-choline]] or [[compound:cdp-ethanolamine]] onto DAG, releasing [[compound:cmp]] and forming [[compound:phosphatidylcholine]] or [[compound:phosphatidylethanolamine]]. The fatty-acyl composition determines which molecular species are formed.",
      "DAG itself is also a second messenger activating protein kinase C; here it appears only as the lipid acceptor."
    ],
    evidence: "established",
    facts: { class: "glycerolipid (generic; acyl chains vary)", chebi: "CHEBI:18035" },
    relations: [
      { rel: "precursor-of", to: "compound:phosphatidylcholine", note: "Acceptor of phosphocholine" },
      { rel: "precursor-of", to: "compound:phosphatidylethanolamine", note: "Acceptor of phosphoethanolamine" }
    ],
    refs: ["article:vance-2014-phospholipid-methylation", "article:kennedy-1956-cytidine-coenzymes"]
  },
  {
    id: "compound:ethanolamine",
    type: "compound",
    name: "Ethanolamine",
    aliases: ["2-aminoethanol", "etanolamina", "monoethanolamine"],
    summary: "Amino alcohol head group of phosphatidylethanolamine; phosphorylated by ETNK1 to start the CDP-ethanolamine branch of the Kennedy pathway.",
    body: [
      "[[enzyme:etnk1]] uses [[compound:atp]] to phosphorylate ethanolamine to [[compound:phosphoethanolamine]] ([[reaction:etnk1-ethanolamine-phosphorylation]]). Ethanolamine comes from dietary phospholipids, from sphingosine-1-phosphate breakdown and from serine decarboxylation within phosphatidylserine.",
      "PE made from ethanolamine is the methyl acceptor of [[enzyme:pemt]], so ethanolamine supply indirectly affects PEMT-dependent phosphatidylcholine synthesis."
    ],
    evidence: "established",
    facts: { formula: "C2H7NO", molarMass: "61.08 g/mol", chebi: "CHEBI:16000", pubchem: "CID 700" },
    relations: [
      { rel: "precursor-of", to: "compound:phosphoethanolamine" },
      { rel: "part-of", to: "pathway:kennedy-pathway" }
    ],
    refs: ["article:vance-2014-phospholipid-methylation"]
  },
  {
    id: "compound:phosphoethanolamine",
    type: "compound",
    name: "Phosphoethanolamine (PEA)",
    aliases: ["O-phosphoethanolamine", "fosfoetanolamina", "PEA", "ethanolamine phosphate"],
    summary: "Phosphorylated ethanolamine; activated by CTP to CDP-ethanolamine, the rate-limiting step of the CDP-ethanolamine branch.",
    body: [
      "Made by [[enzyme:etnk1]] from [[compound:ethanolamine]], PEA reacts with [[compound:ctp]] in the [[enzyme:pcyt2]] reaction ([[reaction:pcyt2-cdp-ethanolamine-synthesis]]) to give [[compound:cdp-ethanolamine]] and [[compound:pyrophosphate]].",
      "PEA is chemically similar to [[compound:phosphocholine]] and the two Kennedy branches run in parallel."
    ],
    evidence: "established",
    facts: { formula: "C2H8NO4P", molarMass: "141.06 g/mol", chebi: "CHEBI:17553", pubchem: "CID 1015" },
    relations: [
      { rel: "precursor-of", to: "compound:cdp-ethanolamine", note: "With CTP via PCYT2" },
      { rel: "part-of", to: "pathway:kennedy-pathway" }
    ],
    refs: ["article:vance-2014-phospholipid-methylation", "article:kennedy-1956-cytidine-coenzymes"]
  },
  {
    id: "compound:cdp-ethanolamine",
    type: "compound",
    name: "CDP-ethanolamine",
    aliases: ["cytidine diphosphate ethanolamine", "CDP-etanolamina"],
    summary: "Activated ethanolamine donor for phosphatidylethanolamine synthesis in the Kennedy pathway.",
    body: [
      "Produced from [[compound:phosphoethanolamine]] and [[compound:ctp]] by [[enzyme:pcyt2]], it donates phosphoethanolamine to [[compound:diacylglycerol]] through [[enzyme:selenoi]] or [[enzyme:cept1]], forming [[compound:phosphatidylethanolamine]] ([[reaction:ept-cdp-ethanolamine-to-pe]]).",
      "PE made this way can in liver be converted by PEMT to phosphatidylcholine, using three SAM-derived methyl groups ([[reaction:pemt-pe-to-pc]])."
    ],
    evidence: "established",
    facts: { formula: "C11H20N4O11P2", molarMass: "446.24 g/mol", chebi: "CHEBI:16732", pubchem: "CID 123727" },
    relations: [
      { rel: "precursor-of", to: "compound:phosphatidylethanolamine" },
      { rel: "part-of", to: "pathway:kennedy-pathway" }
    ],
    refs: ["article:kennedy-1956-cytidine-coenzymes", "article:vance-2014-phospholipid-methylation"]
  },
  {
    id: "compound:cholate",
    type: "compound",
    name: "Cholic acid (cholate)",
    aliases: ["cholate", "ácido cólico", "colato", "3,7,12-trihydroxycholanic acid"],
    summary: "Primary trihydroxy bile acid synthesised in liver; activated to choloyl-CoA and conjugated with glycine or taurine, and released by bacterial deconjugation in the gut.",
    body: [
      "[[enzyme:slc27a5]] activates cholate with CoA to [[compound:choloyl-coa]]; [[enzyme:baat]] then conjugates it with [[compound:glycine]] or [[compound:taurine]] to form [[compound:glycocholic-acid]] or [[compound:taurocholic-acid]] ([[pathway:bile-acid-conjugation]]). Bacterial bile salt hydrolase reverses the conjugation in the gut ([[reaction:bsh-glycocholate-deconjugation]]), returning free cholate and glycine.",
      "In humans glycine conjugates typically outnumber taurine conjugates roughly three to one, a ratio that shifts with dietary glycine and taurine in older feeding studies ([[article:sjovall-1959-glycine-taurine-bile-conjugation]])."
    ],
    evidence: "established",
    facts: { formula: "C24H40O5", molarMass: "408.6 g/mol", chebi: "CHEBI:16359", pubchem: "CID 221493" },
    relations: [
      { rel: "precursor-of", to: "compound:choloyl-coa", note: "CoA ligation by BACS" },
      { rel: "part-of", to: "compound:bile-acids" }
    ],
    refs: ["article:hofmann-2008-bile-acids-biology", "article:chiang-2013-bile-acid-metabolism-signaling"]
  },
  {
    id: "compound:choloyl-coa",
    type: "compound",
    name: "Choloyl-CoA",
    aliases: ["cholyl-CoA", "colil-CoA", "cholic acid CoA thioester"],
    summary: "Activated thioester of cholate; the substrate of BAAT, which transfers the cholyl group to glycine or taurine.",
    body: [
      "Formed from [[compound:cholate]], [[compound:atp]] and [[compound:coa]] by [[enzyme:slc27a5]] ([[reaction:bacs-cholate-coa-ligation]]), choloyl-CoA is attacked by the amine of glycine or taurine in [[reaction:baat-glycine-conjugation]] and [[reaction:baat-taurine-conjugation]], releasing CoA.",
      "Choice between glycine and taurine depends on substrate availability and species; humans conjugate with both."
    ],
    evidence: "established",
    facts: { formula: "C45H74N7O20P3S", molarMass: "1158.1 g/mol", chebi: "CHEBI:15519", pubchem: "CID 644071" },
    relations: [
      { rel: "precursor-of", to: "compound:glycocholic-acid", note: "Glycine conjugation by BAAT" },
      { rel: "precursor-of", to: "compound:taurocholic-acid", note: "Taurine conjugation by BAAT" }
    ],
    refs: ["article:hofmann-2008-bile-acids-biology"]
  },
  // ------------------------------------------------------------------ histamine, catecholamine and B6 intermediates
  {
    id: "compound:methylhistamine",
    type: "compound",
    name: "N-tau-methylhistamine",
    aliases: ["1-methylhistamine", "tele-methylhistamine", "metilhistamina", "N(tele)-methylhistamine"],
    summary: "The inactive methylated metabolite of histamine produced by HNMT with SAM; excreted in urine and further oxidised by MAO-B.",
    body: [
      "[[enzyme:hnmt]] methylates the imidazole ring of [[compound:histamine]] using [[compound:sam]] ([[reaction:hnmt-histamine-methylation]]), leaving [[compound:sah]]. This intracellular route handles histamine in brain and tissues, while [[enzyme:dao]] handles extracellular and dietary histamine ([[pathway:histamine-degradation]]).",
      "Urinary methylhistamine can be used as a research marker of histamine turnover, but it is not a routine diagnostic for histamine intolerance."
    ],
    evidence: "established",
    facts: { formula: "C6H11N3", molarMass: "125.17 g/mol", chebi: "CHEBI:29009", pubchem: "CID 3614" },
    relations: [
      { rel: "decreases", to: "state:histamine-excess", note: "Methylation inactivates histamine" },
      { rel: "part-of", to: "pathway:histamine-degradation" }
    ],
    refs: ["article:maintz-2007-histamine-intolerance", "article:yoshikawa-2019-hnmt-brain"]
  },
  {
    id: "compound:imidazole-acetaldehyde",
    type: "compound",
    name: "Imidazole-4-acetaldehyde",
    aliases: ["imidazole acetaldehyde", "imidazol-acetaldeído"],
    summary: "Product of DAO action on histamine; oxidised onward to imidazole acetic acid.",
    body: [
      "[[reaction:dao-histamine-oxidation]] converts [[compound:histamine]], [[compound:oxygen]] and [[compound:water]] into imidazole acetaldehyde, [[compound:ammonia]] and [[compound:hydrogen-peroxide]]. Aldehyde dehydrogenase converts the aldehyde to imidazole acetic acid, which is excreted.",
      "It is a short-lived intermediate and is not measured clinically."
    ],
    evidence: "established",
    facts: { formula: "C5H6N2O", molarMass: "110.11 g/mol", chebi: "CHEBI:27398", pubchem: "CID 150841" },
    relations: [
      { rel: "part-of", to: "pathway:histamine-degradation" },
      { rel: "product-of", to: "enzyme:dao" }
    ],
    refs: ["article:maintz-2007-histamine-intolerance"]
  },
  {
    id: "compound:dopamine",
    type: "compound",
    name: "Dopamine",
    aliases: ["DA", "dopamina", "3-hydroxytyramine"],
    summary: "Catecholamine neurotransmitter; one of the COMT substrates that consume SAM when methylated to 3-methoxytyramine.",
    body: [
      "[[enzyme:comt]] transfers a methyl group from [[compound:sam]] to the 3-hydroxyl of dopamine, forming [[compound:3-methoxytyramine]] and [[compound:sah]] ([[reaction:comt-dopamine-methylation]]). COMT also methylates noradrenaline, adrenaline and catechol oestrogens, so catecholamine turnover contributes to the methyl budget.",
      "The size of that contribution is small compared with PEMT, GNMT and creatine synthesis in liver ([[pathway:methyl-budget]]); claims that COMT variants cause under- or over-methylation are weakly supported."
    ],
    evidence: "established",
    facts: { formula: "C8H11NO2", molarMass: "153.18 g/mol", chebi: "CHEBI:18243", pubchem: "CID 681" },
    relations: [
      { rel: "substrate-of", to: "enzyme:comt" },
      { rel: "precursor-of", to: "compound:3-methoxytyramine" }
    ],
    refs: ["article:meiser-2013-dopamine-metabolism", "article:hmdb-2022"]
  },
  {
    id: "compound:3-methoxytyramine",
    type: "compound",
    name: "3-Methoxytyramine (3-MT)",
    aliases: ["3-MT", "3-metoxitiramina", "3-O-methyldopamine"],
    summary: "O-methylated, largely inactive metabolite of dopamine formed by COMT; further oxidised by MAO to homovanillic acid.",
    body: [
      "Produced in [[reaction:comt-dopamine-methylation]], 3-MT leaves [[compound:sah]] as the co-product of the SAM-dependent methylation. Plasma or urinary 3-MT is a research marker of dopamine turnover and a useful tumour marker for dopamine-secreting paragangliomas.",
      "It is not a measure of methylation capacity."
    ],
    evidence: "established",
    facts: { formula: "C9H13NO2", molarMass: "167.20 g/mol", chebi: "CHEBI:1582", pubchem: "CID 1669" },
    relations: [
      { rel: "product-of", to: "enzyme:comt" }
    ],
    refs: ["article:meiser-2013-dopamine-metabolism"]
  },
  {
    id: "compound:adenosine",
    type: "compound",
    name: "Adenosine",
    aliases: ["Ado", "adenosina"],
    summary: "Purine nucleoside released together with homocysteine when AHCY hydrolyses SAH; cleared by adenosine deaminase and kinase.",
    body: [
      "[[enzyme:ahcy]] hydrolyses [[compound:sah]] to adenosine and [[compound:homocysteine]] ([[reaction:ahcy-sah-hydrolysis]]). The equilibrium lies toward SAH, so removal of both products is needed to keep the methylation cycle moving; high adenosine can therefore raise SAH.",
      "Adenosine is also a signalling molecule acting on A1/A2A receptors in brain and gut, a role outside the methylation pathway."
    ],
    evidence: "established",
    facts: { formula: "C10H13N5O4", molarMass: "267.24 g/mol", chebi: "CHEBI:16335", pubchem: "CID 60961" },
    relations: [
      { rel: "product-of", to: "enzyme:ahcy" },
      { rel: "part-of", to: "pathway:methionine-cycle" }
    ],
    refs: ["article:selhub-1999-homocysteine-metabolism", "article:rhea-2022", "article:hmdb-2022"]
  },
  {
    id: "compound:acetyl-phosphate",
    type: "compound",
    name: "Acetyl phosphate",
    aliases: ["acetyl-P", "acetilfosfato", "acetyl dihydrogen phosphate"],
    summary: "High-energy mixed anhydride made by bacterial glycine reductase; converted to acetate and ATP by acetate kinase in Stickland fermentation.",
    body: [
      "[[reaction:bacterial-glycine-reductase]] reduces glycine to acetyl phosphate with release of [[compound:ammonia]]; acetate kinase then transfers the phosphate to ADP to make [[compound:atp]], a substrate-level phosphorylation that lets anaerobes such as Clostridia gain energy from amino acids.",
      "Occurrence of this route in the human upper small intestine is unproven; it is described here as a capability of some gut anaerobes, not a demonstrated cause of gas or belching."
    ],
    evidence: "plausible",
    facts: { formula: "C2H5O5P", molarMass: "140.03 g/mol", chebi: "CHEBI:15350", pubchem: "CID 186" },
    relations: [
      { rel: "product-of", to: "enzyme:bacterial-glycine-reductase" },
      { rel: "part-of", to: "pathway:gut-bacterial-glycine-fates" }
    ],
    refs: ["article:neis-2015-microbial-amino-acid-metabolism", "article:rizvi-2023-glycine-fermentation-c-difficile"]
  },
  {
    id: "compound:acetaldehyde",
    type: "compound",
    name: "Acetaldehyde",
    aliases: ["ethanal", "acetaldeído"],
    summary: "Two-carbon aldehyde released with trimethylamine when gut bacteria cleave choline with CutC; also an intermediate of ethanol metabolism.",
    body: [
      "[[enzyme:cutc]], a glycyl-radical enzyme, converts [[compound:choline]] to [[compound:trimethylamine]] and acetaldehyde ([[reaction:choline-tma-lyase]]). The TMA is absorbed and oxidised in liver by [[enzyme:fmo3]] to [[compound:tmao]] ([[pathway:tma-tmao-axis]]).",
      "The acetaldehyde from this reaction is oxidised by bacteria or host aldehyde dehydrogenases and has no established clinical significance at the quantities involved."
    ],
    evidence: "established",
    facts: { formula: "C2H4O", molarMass: "44.05 g/mol", chebi: "CHEBI:15343", pubchem: "CID 177" },
    relations: [
      { rel: "product-of", to: "enzyme:cutc" }
    ],
    refs: ["article:craciun-2012-choline-tma-glycyl-radical"]
  },
  {
    id: "compound:pyridoxal",
    type: "compound",
    name: "Pyridoxal (PL)",
    aliases: ["PL", "piridoxal", "vitamin B6 aldehyde"],
    summary: "B6 vitamer that PDXK phosphorylates to PLP; the form that circulates after dephosphorylation of PLP.",
    body: [
      "[[enzyme:pdxk]] converts pyridoxal to [[compound:plp]] with [[compound:atp]] ([[reaction:pdxk-pyridoxal-phosphorylation]]). Plasma PLP is hydrolysed to pyridoxal for cell uptake and re-phosphorylated inside cells.",
      "Pyridoxal is a vitamer of [[compound:vitamin-b6]] and is oxidised in liver to 4-pyridoxic acid, the main urinary B6 catabolite."
    ],
    evidence: "established",
    facts: { formula: "C8H9NO3", molarMass: "167.16 g/mol", chebi: "CHEBI:17310", pubchem: "CID 1050" },
    relations: [
      { rel: "precursor-of", to: "compound:plp", note: "Phosphorylation by PDXK" },
      { rel: "part-of", to: "compound:vitamin-b6" }
    ],
    refs: ["article:parra-2018-vitamin-b6-metabolism", "article:ueland-2015-b6-biomarkers"]
  },
  {
    id: "compound:pyridoxine-5-phosphate",
    type: "compound",
    name: "Pyridoxine 5'-phosphate (PNP)",
    aliases: ["PNP", "piridoxina 5'-fosfato", "pyridoxine phosphate"],
    summary: "Phosphorylated pyridoxine that PNPO oxidises to the active coenzyme PLP, using FMN and oxygen.",
    body: [
      "[[enzyme:pdxk]] phosphorylates [[compound:pyridoxine]] to PNP, and [[enzyme:pnpo]] then oxidises the 4'-alcohol to the aldehyde, giving [[compound:plp]] and [[compound:hydrogen-peroxide]] ([[reaction:pnpo-pnp-oxidation]]). PNPO needs flavin mononucleotide, so [[compound:riboflavin]] status affects conversion of dietary pyridoxine.",
      "This is the step that dietary pyridoxine, unlike preformed P5P, must pass through in the liver ([[pathway:vitamin-b6-activation]])."
    ],
    evidence: "established",
    facts: { formula: "C8H12NO6P", molarMass: "249.16 g/mol", chebi: "CHEBI:28803", pubchem: "CID 1055" },
    relations: [
      { rel: "precursor-of", to: "compound:plp", note: "PNPO oxidation" },
      { rel: "part-of", to: "pathway:vitamin-b6-activation" }
    ],
    refs: ["article:parra-2018-vitamin-b6-metabolism"]
  },
  {
    id: "compound:cob-ii-alamin",
    type: "compound",
    name: "Cob(II)alamin (vitamin B12r)",
    aliases: ["cob(II)alamina", "B12r", "oxidised cobalamin intermediate"],
    summary: "Inactive one-electron oxidised cobalamin that accumulates on methionine synthase and is reductively methylated back to methylcobalamin by MTRR.",
    body: [
      "Occasional oxidation of cob(I)alamin on [[enzyme:mtr]] leaves cob(II)alamin, which [[enzyme:mtrr]] reactivates using [[compound:nadph]] and [[compound:sam]] to regenerate [[compound:methylcobalamin]] ([[reaction:mtrr-cobalamin-reactivation]]). This SAM-dependent reactivation is the point where methionine synthase activity depends on the methyl-donor state.",
      "Defects in this cycle underlie cblE-type remethylation disorders and contribute to the functional folate trap ([[state:folate-trap]])."
    ],
    evidence: "established",
    facts: { formula: "C62H88CoN13O14P", molarMass: "1329.3 g/mol", chebi: "CHEBI:16304", pubchem: "CID 16058317" },
    relations: [
      { rel: "precursor-of", to: "compound:methylcobalamin", note: "Via MTRR and SAM" },
      { rel: "part-of", to: "compound:vitamin-b12" }
    ],
    refs: ["article:selhub-1999-homocysteine-metabolism", "article:chebi-2016"]
  },
  {
    id: "compound:carbonic-acid",
    type: "compound",
    name: "Carbonic acid (H2CO3)",
    aliases: ["H2CO3", "ácido carbônico"],
    summary: "Short-lived hydrated form of CO2 that dissociates into bicarbonate and a proton; the link between stomach acid, bicarbonate neutralisation and CO2 release.",
    body: [
      "CO2 and water form carbonic acid, which carbonic anhydrase speeds up: [[enzyme:carbonic-anhydrase]] in parietal cells generates the proton for [[pathway:gastric-acid-secretion]] and the [[compound:bicarbonate]] returned to blood. In the duodenum the reaction runs the other way when pancreatic and biliary bicarbonate meets gastric acid, giving CO2 ([[pathway:acid-bicarbonate-neutralisation]], [[reaction:carbonic-acid-dehydration]]).",
      "Only a tiny fraction of dissolved CO2 exists as H2CO3 at equilibrium; the species is written explicitly in these reactions so the stoichiometry of acid-bicarbonate neutralisation is balanced. How much of the CO2 released in the duodenum reaches the stomach and appears as belching is uncertain."
    ],
    evidence: "established",
    facts: { formula: "H2CO3", molarMass: "62.025 g/mol", chebi: "CHEBI:28976", pubchem: "CID 767" },
    relations: [
      { rel: "precursor-of", to: "compound:bicarbonate", note: "Loses a proton" },
      { rel: "precursor-of", to: "compound:carbon-dioxide", note: "Dehydration, catalysed by carbonic anhydrase" }
    ],
    refs: ["article:kaunitz-2006-duodenal-co2-carbonic-anhydrase", "article:chebi-2016"]
  }
]
