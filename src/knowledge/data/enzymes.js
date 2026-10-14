// Enzymes of methylation / one-carbon / choline / glycine / gastric-acid biochemistry.
// Content agent C2. Stoichiometry lives in reactions.js (reaction.enzymes drives "catalyzes").
// Evidence legend: established = textbook/curated database; plausible = mechanistically sound,
// human relevance not firmly shown; speculative / conversation-only = proposed in the source talk.

export default [
  // ------------------------------------------------------------------ methyl transfer / SAM
  {
    id: "enzyme:gnmt",
    type: "enzyme",
    name: "Glycine N-methyltransferase (GNMT)",
    aliases: ["GNMT", "glicina N-metiltransferase", "GNMT hepática", "dreno de metil", "methyl sink enzyme"],
    summary: "Cytosolic liver enzyme that transfers a methyl group from SAM to glycine, forming sarcosine and SAH; the main hepatic 'methyl sink' that buffers the SAM:SAH ratio.",
    body: [
      "In plain words: GNMT is a liver enzyme that moves a methyl group from SAMe onto glycine, making sarcosine. It works like an overflow valve: when methyl supply is high, GNMT burns the surplus off. The source conversation proposes that glycine powder could force this valve open in someone already short of methyl groups and drain them further. In the body the valve is regulated by folate and the sarcosine is turned back into glycine, so whether a gram-scale glycine dose really drains methyl groups in people has not been shown.",
      "GNMT is a homotetrameric cytosolic enzyme that makes up on the order of 1-3% of soluble protein in liver (less in pancreas, kidney and prostate). It methylates [[compound:glycine]] using [[compound:sam]] to give [[compound:sarcosine]] and [[compound:sah]] ([[reaction:gnmt-glycine-methylation]]). Unlike most methyltransferases it is only weakly inhibited by SAH and has a glycine affinity in the range of hepatic glycine concentrations, so it can dispose of surplus methyl groups when SAM is high.",
      "Its activity is tuned by folate: 5-methyltetrahydrofolate polyglutamates bind GNMT and inhibit it. When SAM is high, [[enzyme:mthfr]] is inhibited by SAM so less [[compound:5-mthf|5-methyl-THF]] is made and GNMT is released; when SAM is low, 5-MTHF rises and GNMT is throttled, sparing methyl groups. Together this makes GNMT a flux-sensing 'methyl sink' ([[pathway:methyl-budget]]). The sarcosine it makes is demethylated back to glycine by [[enzyme:sardh]], so the methyl group is not lost but re-enters the folate one-carbon pool as 5,10-methylene-THF.",
      "Human GNMT deficiency gives a benign hypermethioninaemia with raised SAM, and Gnmt knockout mice develop fatty liver and hepatocellular carcinoma, confirming the role in SAM homeostasis. The source conversation proposed that a large oral glycine dose could over-recruit GNMT in an already under-methylated person and further drain SAM; this is mechanistically conceivable but is not demonstrated in humans (SARDH recapture and folate feedback should blunt it), so it is recorded as conversation-only."
    ],
    evidence: "established",
    facts: {
      gene: "GNMT",
      ec: "2.1.1.20",
      uniprot: "Q14749",
      rhea: "RHEA:19937",
      reactome: "R-HSA-6798317",
      kegg: "ec:2.1.1.20",
      compartment: "cytosol",
      tissue: "liver (very abundant), pancreas, kidney, prostate",
      cofactors: "none (SAM is a co-substrate); inhibited by 5-methyl-THF polyglutamates"
    },
    relations: [
      { rel: "part-of", to: "pathway:methyl-budget", note: "main hepatic methyl sink" },
      { rel: "part-of", to: "pathway:methionine-cycle", note: "transmethylation arm: SAM to SAH" },
      { rel: "interacts-with", to: "compound:5-mthf", note: "5-MTHF polyglutamate binds and inhibits GNMT (established)" },
      { rel: "mitigates", to: "state:overmethylation", note: "disposes of surplus SAM methyl groups" },
      { rel: "associated-with", to: "state:undermethylation", note: "conversation-proposed: bolus free glycine over-recruits GNMT and drains SAM; human evidence lacking" },
      { rel: "decreases", to: "compound:sam", note: "Spends SAM on methylating glycine; the hepatic methyl-sink reaction.", claim: "claim:gnmt-methyl-sink-valve", strength: "strong" },
      { rel: "decreases", to: "compound:glycine", note: "Glycine is its methyl acceptor." },
      { rel: "increases", to: "compound:sah", note: "Co-product of every methylation." },
      { rel: "measured-by", to: "outcome:sarcosine-elevation", note: "Sarcosine is the product; it is raised when GNMT flux is high or sarcosine clearance is impaired." },
      { rel: "increases", to: "compound:sarcosine", note: "Product of glycine methylation.", strength: "strong" }
    ],
    refs: ["article:melendez-hevia-2009-glycine-weak-link"]
  },
  {
    id: "enzyme:pemt",
    type: "enzyme",
    name: "Phosphatidylethanolamine N-methyltransferase (PEMT)",
    aliases: ["PEMT", "PEAMT", "fosfatidiletanolamina N-metiltransferase", "via PEMT", "síntese de novo de fosfatidilcolina"],
    summary: "ER/MAM enzyme of hepatocytes that methylates phosphatidylethanolamine three times with SAM to make phosphatidylcholine; a major hepatic SAM consumer.",
    body: [
      "In plain words: PEMT is a liver enzyme that makes the membrane fat phosphatidylcholine by adding three methyl groups, one at a time, to a related fat. Every molecule costs three SAMe, so it is one of the largest consumers of methyl groups in the body. It appears in the conversation because choline, acetylcholine and gut movement are linked to it; that chain is plausible but weak.",
      "PEMT converts [[compound:phosphatidylethanolamine]] to [[compound:phosphatidylcholine]] by three successive SAM-dependent N-methylations, passing through phosphatidyl-N-methylethanolamine and phosphatidyl-N,N-dimethylethanolamine ([[reaction:pemt-pe-to-pc]]). Each cycle yields one [[compound:sah]], so every PC made de novo costs three [[compound:sam]]. It is a membrane protein of the endoplasmic reticulum and mitochondria-associated membranes and is quantitatively important mainly in liver, where it supplies roughly a third of hepatic PC in rodents (the rest comes from the CDP-choline route, [[pathway:kennedy-pathway]]). PEMT-derived PC is enriched in long-chain polyunsaturated acyl groups such as DHA.",
      "Because of the 3:1 SAM stoichiometry PEMT is one of the two or three largest sinks of methyl groups in the body, alongside creatine synthesis ([[enzyme:gamt]]) and the GNMT sink; the relative shares are debated (older estimates put creatine at over 70% of methyl-group flux, later revisions give PEMT a comparable or larger share). Expression is induced by oestrogen, and a common promoter variant (rs12325817) raises dietary choline requirement, which is why premenopausal women are less prone to choline-deficiency organ dysfunction.",
      "The conversation links PEMT to acetylcholine: low SAM, fewer PC molecules, less choline, less vagal acetylcholine. Choline for [[enzyme:chat]] mostly comes from the circulation and from recycling, with PC breakdown only a secondary reservoir, so the PEMT-to-acetylcholine chain is plausible but weak; it is recorded as a conversation-proposed link."
    ],
    evidence: "established",
    facts: {
      gene: "PEMT",
      ec: "2.1.1.17; 2.1.1.71",
      uniprot: "Q9UBM1",
      rhea: "RHEA:11164; RHEA:32735; RHEA:32739",
      reactome: "R-HSA-1483174",
      kegg: "ec:2.1.1.17",
      compartment: "endoplasmic reticulum / mitochondria-associated membrane",
      tissue: "liver (major), adipose, mammary gland, testis",
      cofactors: "none (SAM co-substrate)"
    },
    relations: [
      { rel: "part-of", to: "pathway:pemt-pc-synthesis" },
      { rel: "part-of", to: "pathway:methyl-budget", note: "consumes 3 SAM per PC" },
      { rel: "associated-with", to: "state:undermethylation", note: "low SAM limits PEMT output; weak link from PC to vagal acetylcholine is conversation-proposed" },
      { rel: "interacts-with", to: "enzyme:chpt1", note: "parallel route to PC (CDP-choline) compensates when PEMT is limited" },
      {
        rel: "increases",
        to: "compound:phosphatidylcholine",
        note: "Hepatic de novo route to phosphatidylcholine; the CDP-choline route runs in parallel.",
        claim: "claim:pemt-consumes-three-sam",
        strength: "strong"
      },
      { rel: "decreases", to: "compound:sam", note: "Three SAM per phosphatidylcholine, one of the largest methyl sinks.", claim: "claim:pemt-consumes-three-sam", strength: "strong" },
      { rel: "increases", to: "compound:sah", note: "Three SAH per phosphatidylcholine." }
    ]
  },
  {
    id: "enzyme:bhmt",
    type: "enzyme",
    name: "Betaine-homocysteine S-methyltransferase (BHMT)",
    aliases: ["BHMT", "BHMT1", "betaína-homocisteína metiltransferase", "remetilação por betaína", "via da betaína"],
    summary: "Zinc enzyme of liver and kidney that remethylates homocysteine to methionine using betaine (TMG), releasing dimethylglycine; folate- and B12-independent.",
    body: [
      "In plain words: BHMT is a zinc-containing enzyme of liver and kidney that uses betaine to turn homocysteine back into methionine. It is a shortcut around the folate and B12 route. This is how choline and TMG help methylation, and the route the conversation uses to explain why choline might clear histamine at night.",
      "BHMT is a cytosolic zinc-dependent homotetramer that transfers one methyl group from [[compound:betaine]] to [[compound:homocysteine]], giving [[compound:methionine]] and [[compound:dimethylglycine]] ([[reaction:bhmt-betaine-homocysteine]]). It is expressed mainly in liver and kidney and provides a remethylation route that needs neither [[compound:5-mthf|5-methyl-THF]] nor [[compound:methylcobalamin]], in parallel with [[enzyme:mtr]]. In liver it accounts for a substantial but variable fraction of homocysteine remethylation; Bhmt knockout mice have raised homocysteine, fatty liver and liver tumours.",
      "Betaine comes from the oxidation of [[compound:choline]] ([[pathway:choline-oxidation]]) or from the diet (anhydrous betaine/TMG supplements, beet, wheat, shellfish). The dimethylglycine product is shuttled to mitochondria where [[enzyme:dmgdh]] and [[enzyme:sardh]] strip the remaining methyls to leave glycine, so one betaine can yield one SAM-regenerating methyl plus two folate-pool one-carbon units plus a glycine molecule.",
      "The conversation's argument that choline supports night-time histamine clearance via betaine, BHMT, SAM and [[enzyme:hnmt]] is mechanistically coherent for liver SAM, but brain and airway HNMT depend on local SAM (these tissues have little BHMT), so the effect on central histamine is plausible rather than demonstrated."
    ],
    evidence: "established",
    facts: {
      gene: "BHMT",
      ec: "2.1.1.5",
      uniprot: "Q93088",
      rhea: "RHEA:22336",
      reactome: "R-HSA-1614654",
      kegg: "ec:2.1.1.5",
      compartment: "cytosol",
      tissue: "liver, kidney",
      cofactors: "Zn2+"
    },
    relations: [
      { rel: "part-of", to: "pathway:methionine-cycle", note: "folate-independent remethylation" },
      { rel: "part-of", to: "pathway:choline-oxidation", note: "first methyl-donating step of betaine catabolism" },
      { rel: "mitigates", to: "state:undermethylation", note: "regenerates methionine/SAM from homocysteine without folate or B12 (plausible; supplement trials mixed)" },
      { rel: "interacts-with", to: "enzyme:mtr", note: "parallel remethylation route" },
      { rel: "decreases", to: "compound:homocysteine", note: "Folate- and B12-independent remethylation, mainly in liver and kidney.", strength: "strong" },
      { rel: "increases", to: "compound:methionine", strength: "strong" },
      { rel: "decreases", to: "compound:betaine" },
      { rel: "increases", to: "compound:dimethylglycine", note: "Co-product; first step of betaine methyl loss on the way to glycine." }
    ]
  },
  {
    id: "enzyme:bhmt2",
    type: "enzyme",
    name: "S-methylmethionine-homocysteine S-methyltransferase (BHMT2)",
    aliases: ["BHMT2", "SMM-Hcy metiltransferase", "homocisteína S-metiltransferase", "betaína-homocisteína metiltransferase 2"],
    summary: "BHMT paralog that remethylates homocysteine using S-methylmethionine; poor activity with betaine, physiological role in humans uncertain.",
    body: [
      "BHMT2 is a close paralog of [[enzyme:bhmt]] that uses S-methylmethionine (vitamin U, from plants) rather than [[compound:betaine]] as methyl donor to convert [[compound:homocysteine]] to two molecules of [[compound:methionine]] ([[reaction:bhmt2-smm-homocysteine]]). It is also zinc-dependent, expressed mainly in liver and kidney, and is much less active than BHMT in tissue extracts.",
      "Because dietary S-methylmethionine intake is modest and the enzyme's contribution to total remethylation is small, BHMT2 is included for completeness and as a reminder that betaine is not the only non-folate methyl donor. It is not discussed in the source conversation."
    ],
    evidence: "plausible",
    facts: {
      gene: "BHMT2",
      ec: "2.1.1.10",
      uniprot: "Q9H2M3",
      rhea: "RHEA:26337",
      reactome: "R-HSA-5696838",
      kegg: "ec:2.1.1.10",
      compartment: "cytosol",
      tissue: "liver, kidney",
      cofactors: "Zn2+"
    },
    relations: [
      { rel: "part-of", to: "pathway:methionine-cycle", note: "minor remethylation route" },
      { rel: "interacts-with", to: "enzyme:bhmt", note: "close paralog; different methyl donor" }
    ]
  },
  {
    id: "enzyme:mthfr",
    type: "enzyme",
    name: "Methylenetetrahydrofolate reductase (MTHFR)",
    aliases: ["MTHFR", "metilenotetraidrofolato redutase", "C677T", "A1298C", "MTHFR NADPH"],
    summary: "FAD enzyme that irreversibly reduces 5,10-methylene-THF to 5-methyl-THF with NADPH, committing one-carbon units to homocysteine remethylation; inhibited by SAM.",
    body: [
      "MTHFR is a cytosolic FAD-containing homodimer that uses NADPH to reduce [[compound:5-10-methylene-thf]] to [[compound:5-mthf|5-methyl-THF]] ([[reaction:mthfr-methylene-thf-reduction]]). The reaction is effectively irreversible in vivo, so it commits folate one-carbon units to the methyl donor used by [[enzyme:mtr]]. The N-terminal catalytic domain binds FAD and the C-terminal regulatory domain binds [[compound:sam]] as an allosteric inhibitor (and is phosphorylated, which also lowers activity). This is the feedback loop that couples SAM status to 5-MTHF supply and, through 5-MTHF inhibition of [[enzyme:gnmt]], to the methyl sink.",
      "The common C677T (A222V) variant is thermolabile and loses FAD more easily; homozygotes (TT) have roughly 30% of wild-type activity and heterozygotes about 65%. Effects on homocysteine are mostly visible with low folate status. Current UniProt/IUBMB nomenclature lists the NADPH enzyme as EC 1.5.1.53 (formerly 1.5.1.20). The repository's one-carbon model uses an MTHFR activity multiplier (baseline 1, reduced 0.35) as its main perturbation."
    ],
    evidence: "established",
    facts: {
      gene: "MTHFR",
      ec: "1.5.1.53",
      uniprot: "P42898",
      rhea: "RHEA:19819",
      "rhea-master": "RHEA:19817",
      reactome: "R-HSA-200676",
      kegg: "ec:1.5.1.53",
      compartment: "cytosol",
      tissue: "ubiquitous (liver, kidney, brain)",
      cofactors: "FAD; NADPH; allosterically inhibited by SAM"
    },
    relations: [
      { rel: "part-of", to: "pathway:folate-cycle" },
      { rel: "part-of", to: "pathway:methionine-cycle", note: "supplies the methyl donor 5-MTHF" },
      { rel: "interacts-with", to: "compound:sam", note: "SAM is an allosteric inhibitor (established)" },
      { rel: "associated-with", to: "state:undermethylation", note: "reduced-activity variants can lower remethylation, mainly when folate is low" },
      { rel: "increases", to: "compound:5-mthf", strength: "strong" },
      { rel: "decreases", to: "compound:5-10-methylene-thf" }
    ]
  },
  {
    id: "enzyme:mtr",
    type: "enzyme",
    name: "Methionine synthase (MTR)",
    aliases: ["MTR", "MS", "metionina sintase", "5-metiltetraidrofolato-homocisteína metiltransferase", "cobalamina-dependente"],
    summary: "Cytosolic cobalamin-dependent enzyme that moves the methyl of 5-methyl-THF onto homocysteine to make methionine and regenerate THF.",
    body: [
      "MTR uses [[compound:methylcobalamin]] as a methyl carrier: cob(I)alamin takes the methyl from [[compound:5-mthf|5-methyl-THF]] to become methylcobalamin, which then methylates [[compound:homocysteine]] to give [[compound:methionine]], regenerating cob(I)alamin ([[reaction:mtr-methionine-synthase]]). The tetrahydrofolate released ([[compound:thf]]) re-enters the folate cycle. It is the only route that releases THF from 5-MTHF, which is why B12 deficiency traps folate as 5-MTHF (the 'methyl-folate trap').",
      "The supernucleophilic cob(I)alamin occasionally oxidises to inactive cob(II)alamin; [[enzyme:mtrr]] restores it by reductive methylation with [[compound:sam]] ([[reaction:mtrr-cobalamin-reactivation]]). In liver MTR works in parallel with [[enzyme:bhmt]]; in most other tissues, including brain, it is the principal remethylation enzyme. Reactome splits the catalytic cycle into two half-reactions; the repository records the net transfer."
    ],
    evidence: "established",
    facts: {
      gene: "MTR",
      ec: "2.1.1.13",
      uniprot: "Q99707",
      rhea: "RHEA:11173",
      "rhea-master": "RHEA:11172",
      reactome: "R-HSA-3149539; R-HSA-174374",
      kegg: "ec:2.1.1.13",
      compartment: "cytosol",
      tissue: "ubiquitous",
      cofactors: "methylcobalamin / cob(I)alamin; Zn2+ (homocysteine binding)"
    },
    relations: [
      { rel: "part-of", to: "pathway:methionine-cycle" },
      { rel: "part-of", to: "pathway:folate-cycle", note: "only enzyme that releases THF from 5-MTHF" },
      { rel: "interacts-with", to: "compound:methylcobalamin", note: "cofactor / methyl carrier" },
      { rel: "interacts-with", to: "enzyme:mtrr", note: "MTRR reactivates oxidised cobalamin" },
      { rel: "decreases", to: "compound:homocysteine", strength: "strong" },
      { rel: "increases", to: "compound:methionine", strength: "strong" },
      { rel: "decreases", to: "compound:5-mthf", note: "Uses 5-methyl-THF as methyl donor; the reaction that traps folate as 5-MTHF when B12 is short." },
      { rel: "increases", to: "compound:thf" }
    ],
    refs: ["article:selhub-1999-homocysteine-metabolism", "article:stabler-2013-vitamin-b12-deficiency"]
  },
  {
    id: "enzyme:mtrr",
    type: "enzyme",
    name: "Methionine synthase reductase (MTRR)",
    aliases: ["MTRR", "MSR", "metionina sintase redutase", "reativação da B12"],
    summary: "FAD/FMN flavoprotein that reduces inactive cob(II)alamin on methionine synthase and re-methylates it using SAM.",
    body: [
      "MTRR is a diflavin (FAD and FMN) reductase related to cytochrome P450 reductase. It passes electrons from NADPH to the cob(II)alamin of [[enzyme:mtr]], forming cob(I)alamin that is then methylated by [[compound:sam]] to methylcobalamin ([[reaction:mtrr-cobalamin-reactivation]]). The net event is a SAM-consuming reductive methylation that keeps methionine synthase active; only a small fraction of SAM flux goes through it.",
      "Loss of MTRR function causes a cblE-type homocystinuria with megaloblastic anaemia, mimicking B12 deficiency despite adequate cobalamin. The common MTRR A66G variant has been studied as a modifier of homocysteine in low-B12 states, with modest effects."
    ],
    evidence: "established",
    facts: {
      gene: "MTRR",
      ec: "1.16.1.8",
      uniprot: "Q9UBK8",
      rhea: "RHEA:23908",
      reactome: "R-HSA-3149518",
      kegg: "ec:1.16.1.8",
      compartment: "cytosol",
      tissue: "ubiquitous",
      cofactors: "FAD; FMN; NADPH"
    },
    relations: [
      { rel: "part-of", to: "pathway:methionine-cycle", note: "keeps methionine synthase active" },
      { rel: "interacts-with", to: "enzyme:mtr", note: "binds and reactivates MTR" },
      { rel: "interacts-with", to: "compound:sam", note: "methyl donor for reactivation" },
      { rel: "increases", to: "compound:methylcobalamin", note: "Reactivates cob(II)alamin by reductive methylation with SAM." }
    ],
    refs: ["article:selhub-1999-homocysteine-metabolism", "article:stabler-2013-vitamin-b12-deficiency"]
  },
  {
    id: "enzyme:mat1a",
    type: "enzyme",
    name: "Methionine adenosyltransferase 1A (MAT1A; MAT I/III)",
    aliases: ["MAT1A", "MAT I/III", "metionina adenosiltransferase hepática", "SAMe sintetase hepática"],
    summary: "Liver-specific isoform of S-adenosylmethionine synthetase; makes SAM from methionine and ATP and tolerates high methionine and SAM.",
    body: [
      "MAT1A is expressed in adult hepatocytes as tetramer (MAT I) and dimer (MAT III). It forms [[compound:sam]] from [[compound:methionine]] and [[compound:atp]], releasing phosphate and pyrophosphate ([[reaction:mat-sam-synthesis]]). Its Km for methionine is much higher than that of [[enzyme:mat2a]], so liver SAM synthesis rises steeply after a protein meal, and the enzyme is not strongly inhibited by its product, supporting the large hepatic methylation load (PEMT, GNMT, GAMT).",
      "Magnesium (with potassium) is an obligatory activator of all MAT isoforms: the real substrate is Mg-ATP. This is the solid biochemical basis for the conversation's remark that magnesium is a cofactor of SAM synthesis, although magnesium deficiency severe enough to limit SAM synthesis in otherwise healthy adults has not been shown. MAT1A deficiency produces isolated persistent hypermethioninaemia; Mat1a knockout mice develop fatty liver and liver cancer."
    ],
    evidence: "established",
    facts: {
      gene: "MAT1A",
      ec: "2.5.1.6",
      uniprot: "Q00266",
      rhea: "RHEA:21080",
      reactome: "R-HSA-174391",
      kegg: "ec:2.5.1.6",
      compartment: "cytosol",
      tissue: "liver (adult hepatocytes)",
      cofactors: "Mg2+ and K+ (substrate is Mg-ATP)"
    },
    relations: [
      { rel: "part-of", to: "pathway:methionine-cycle" },
      { rel: "interacts-with", to: "compound:magnesium", note: "obligatory divalent cation (Mg-ATP)" },
      { rel: "associated-with", to: "state:undermethylation", note: "low methionine, ATP or Mg limit SAM synthesis (plausible)" }
    ],
    refs: ["article:mato-2008-methionine-metabolism-liver", "article:reactome-sulfur-amino-acid-metabolism"]
  },
  {
    id: "enzyme:mat2a",
    type: "enzyme",
    name: "Methionine adenosyltransferase 2A (MAT2A; MAT II)",
    aliases: ["MAT2A", "MAT II", "metionina adenosiltransferase extra-hepática", "MAT2B"],
    summary: "Widely expressed, high-affinity SAM synthetase that supplies SAM in extrahepatic tissues and proliferating cells; feedback-inhibited by SAM and tuned by MAT2B.",
    body: [
      "MAT2A is the isoform of nearly all non-hepatic tissues, foetal liver and many tumours. It has a low-micromolar Km for [[compound:methionine]], is product-inhibited by [[compound:sam]], and is regulated by the regulatory subunit MAT2B. Like [[enzyme:mat1a]] it catalyses [[reaction:mat-sam-synthesis]] and needs Mg-ATP ([[compound:magnesium]], [[compound:atp]]).",
      "In the brain, MAT2A-derived SAM supports methylation of neurotransmitters ([[enzyme:comt]], [[enzyme:hnmt]]), phospholipids and DNA. Its tight feedback means that when methionine is plentiful but methyl-consuming reactions are slow, SAM stays within a narrow range rather than accumulating."
    ],
    evidence: "established",
    facts: {
      gene: "MAT2A",
      ec: "2.5.1.6",
      uniprot: "P31153",
      rhea: "RHEA:21080",
      kegg: "ec:2.5.1.6",
      compartment: "cytosol / nucleus",
      tissue: "ubiquitous except adult liver; brain, kidney, lymphocytes",
      cofactors: "Mg2+ and K+"
    },
    relations: [
      { rel: "part-of", to: "pathway:methionine-cycle" },
      { rel: "interacts-with", to: "compound:magnesium", note: "obligatory divalent cation (Mg-ATP)" },
      { rel: "interacts-with", to: "compound:sam", note: "product feedback inhibition" }
    ],
    refs: ["article:mato-2008-methionine-metabolism-liver", "article:reactome-sulfur-amino-acid-metabolism"]
  },
  {
    id: "enzyme:ahcy",
    type: "enzyme",
    name: "Adenosylhomocysteinase (AHCY; SAH hydrolase)",
    aliases: ["AHCY", "SAH hidrolase", "adenosil-homocisteinase", "S-adenosil-homocisteína hidrolase"],
    summary: "NAD+-dependent enzyme that reversibly hydrolyses SAH to homocysteine and adenosine; removal of its products pulls methyltransferase product inhibition off.",
    body: [
      "AHCY is the only enzyme that disposes of [[compound:sah]] in mammals, hydrolysing it to [[compound:homocysteine]] and [[compound:adenosine]] ([[reaction:ahcy-sah-hydrolysis]]). The equilibrium strongly favours SAH synthesis, so the reaction runs forward only if homocysteine (via [[enzyme:mtr]], [[enzyme:bhmt]], [[enzyme:cbs]]) and adenosine are removed. When homocysteine accumulates (for example in B12 or B6 limitation or in CBS deficiency), SAH rises and the SAM:SAH ratio, the 'methylation index', falls.",
      "Because SAH is a potent product inhibitor of most methyltransferases ([[enzyme:pemt]], [[enzyme:hnmt]], [[enzyme:comt]], [[enzyme:gamt]]), AHCY is the hinge between the methionine cycle and the capacity to methylate ([[pathway:methyl-budget]]). The enzyme holds tightly bound NAD+ as a cofactor. Rare human AHCY deficiency causes hypermethioninaemia with markedly raised SAM and SAH."
    ],
    evidence: "established",
    facts: {
      gene: "AHCY",
      ec: "3.13.2.1",
      uniprot: "P23526",
      rhea: "RHEA:21708",
      reactome: "R-HSA-174401",
      kegg: "ec:3.13.2.1",
      compartment: "cytosol",
      tissue: "ubiquitous (liver highest)",
      cofactors: "NAD+ (tightly bound)"
    },
    relations: [
      { rel: "part-of", to: "pathway:methionine-cycle" },
      { rel: "part-of", to: "pathway:methyl-budget", note: "sets SAM:SAH methylation index" },
      { rel: "associated-with", to: "state:undermethylation", note: "elevated homocysteine pushes equilibrium toward SAH and lowers the SAM:SAH ratio" },
      { rel: "decreases", to: "compound:sah", strength: "strong" },
      { rel: "increases", to: "compound:homocysteine" }
    ],
    refs: ["article:selhub-1999-homocysteine-metabolism", "article:reactome-sulfur-amino-acid-metabolism"]
  },
  {
    id: "enzyme:comt",
    type: "enzyme",
    name: "Catechol-O-methyltransferase (COMT)",
    aliases: ["COMT", "catecol-O-metiltransferase", "Val158Met", "rs4680"],
    summary: "Mg2+-dependent SAM-dependent methyltransferase that inactivates catecholamines and catechol oestrogens; a significant extrahepatic SAM consumer.",
    body: [
      "COMT methylates one hydroxyl of a catechol, for example [[compound:dopamine]] to 3-methoxytyramine ([[reaction:comt-dopamine-methylation]]), using [[compound:sam]] and yielding [[compound:sah]]. It exists as a soluble form (S-COMT, abundant in liver and kidney) and a membrane-bound form (MB-COMT, predominant in brain neurons). Divalent magnesium is required in the active site ([[compound:magnesium]]).",
      "The Val158Met variant (rs4680) changes thermostability and activity several-fold and is the best-studied modifier of prefrontal dopamine. COMT is included here as a general SAM sink: in a methylation-limited state its product, SAH, also feeds back to inhibit it ([[pathway:methyl-budget]]). Quantitatively it consumes far less SAM than PEMT, GAMT or GNMT."
    ],
    evidence: "established",
    facts: {
      gene: "COMT",
      ec: "2.1.1.6",
      uniprot: "P21964",
      rhea: "RHEA:72255; RHEA:17877",
      reactome: "R-HSA-379387",
      kegg: "ec:2.1.1.6",
      compartment: "cytosol (S-COMT); membrane (MB-COMT)",
      tissue: "liver, kidney, brain (prefrontal cortex), placenta",
      cofactors: "Mg2+"
    },
    relations: [
      { rel: "part-of", to: "pathway:methyl-budget" },
      { rel: "interacts-with", to: "compound:magnesium", note: "required divalent cation" },
      { rel: "associated-with", to: "state:undermethylation", note: "SAM-dependent; product SAH inhibits" },
      { rel: "decreases", to: "compound:sam", note: "A small methyl sink; dopamine, catecholamine and oestrogen metabolism." },
      { rel: "increases", to: "compound:sah" }
    ],
    refs: ["article:meiser-2013-dopamine-metabolism"]
  },

  // ------------------------------------------------------------------ transsulfuration
  {
    id: "enzyme:cbs",
    type: "enzyme",
    name: "Cystathionine beta-synthase (CBS)",
    aliases: ["CBS", "cistationina beta-sintase", "homocistinúria clássica", "transsulfuração"],
    summary: "PLP- and heme-dependent enzyme that condenses homocysteine and serine to cystathionine, committing homocysteine to cysteine synthesis; activated by SAM.",
    body: [
      "CBS catalyses [[reaction:cbs-cystathionine-synthesis]]: [[compound:homocysteine]] plus [[compound:serine]] gives cystathionine and water. It is a pyridoxal-phosphate enzyme ([[compound:plp]]) that also carries a regulatory heme and is allosterically activated by [[compound:sam]] (via its C-terminal regulatory domain). High SAM therefore shunts homocysteine into transsulfuration, while low SAM favours remethylation, a classic metabolic switch ([[pathway:transsulfuration]], [[pathway:methionine-cycle]]).",
      "Expression is highest in liver, kidney, pancreas and brain. Classical homocystinuria is CBS deficiency; roughly half of patients are pyridoxine-responsive. In otherwise healthy people CBS activity depends on B6 status, which is why an exaggerated post-methionine-load homocysteine rise is used as a functional marker of vitamin B6 insufficiency ([[state:b6-functional-deficiency]])."
    ],
    evidence: "established",
    facts: {
      gene: "CBS",
      ec: "4.2.1.22",
      uniprot: "P35520",
      rhea: "RHEA:10112",
      reactome: "R-HSA-1614524",
      kegg: "ec:4.2.1.22",
      compartment: "cytosol",
      tissue: "liver, kidney, pancreas, brain",
      cofactors: "PLP; heme; activated by SAM"
    },
    relations: [
      { rel: "part-of", to: "pathway:transsulfuration" },
      { rel: "interacts-with", to: "compound:plp", note: "pyridoxal phosphate cofactor" },
      { rel: "interacts-with", to: "compound:sam", note: "allosteric activator" },
      { rel: "associated-with", to: "state:b6-functional-deficiency", note: "low PLP lowers CBS flux; post-methionine-load homocysteine is a functional marker" },
      { rel: "decreases", to: "compound:homocysteine", strength: "strong" },
      { rel: "increases", to: "compound:cystathionine" }
    ],
    refs: ["article:morris-2017-cbs-deficiency-guidelines", "article:reactome-sulfur-amino-acid-metabolism"]
  },
  {
    id: "enzyme:cth",
    type: "enzyme",
    name: "Cystathionine gamma-lyase (CTH; CSE)",
    aliases: ["CTH", "CSE", "cistationase", "cistationina gama-liase", "gama-cistationase"],
    summary: "PLP enzyme that cleaves cystathionine to cysteine, 2-oxobutanoate and ammonia, completing transsulfuration; supplies cysteine for glutathione and taurine.",
    body: [
      "CTH cleaves cystathionine (made by [[enzyme:cbs]]) into [[compound:cysteine]], 2-oxobutanoate and ammonia ([[reaction:cth-cystathionine-cleavage]]). Like CBS it is a PLP enzyme ([[compound:plp]]) and is particularly sensitive to B6 depletion: cystathionine accumulates in B6 deficiency. It can also generate H2S from cysteine or homocysteine, a signalling function outside the scope here.",
      "The cysteine produced is the rate-limiting precursor of [[compound:glutathione]] ([[pathway:glutathione-synthesis]]) and of [[compound:taurine]], which is relevant because taurine competes with [[compound:glycine]] for bile-acid conjugation ([[pathway:bile-acid-conjugation]])."
    ],
    evidence: "established",
    facts: {
      gene: "CTH",
      ec: "4.4.1.1",
      uniprot: "P32929",
      rhea: "RHEA:14005",
      reactome: "R-HSA-1614583",
      kegg: "ec:4.4.1.1",
      compartment: "cytosol",
      tissue: "liver, kidney",
      cofactors: "PLP"
    },
    relations: [
      { rel: "part-of", to: "pathway:transsulfuration" },
      { rel: "part-of", to: "pathway:glutathione-synthesis", note: "supplies cysteine" },
      { rel: "interacts-with", to: "compound:plp", note: "pyridoxal phosphate cofactor" },
      { rel: "associated-with", to: "state:b6-functional-deficiency", note: "cystathionine rises when PLP is limiting" },
      { rel: "decreases", to: "compound:cystathionine" },
      { rel: "increases", to: "compound:cysteine" }
    ],
    refs: ["article:reactome-sulfur-amino-acid-metabolism"]
  },

  // ------------------------------------------------------------------ folate / serine / glycine
  {
    id: "enzyme:shmt1",
    type: "enzyme",
    name: "Serine hydroxymethyltransferase 1, cytosolic (SHMT1)",
    aliases: ["SHMT1", "cSHMT", "serina hidroximetiltransferase citosólica", "SHMT"],
    summary: "Cytosolic PLP enzyme interconverting serine + THF with glycine + 5,10-methylene-THF; links glycine supply to the folate pool.",
    body: [
      "SHMT1 transfers the hydroxymethyl carbon of [[compound:serine]] to [[compound:thf]], giving [[compound:glycine]] and [[compound:5-10-methylene-thf]] ([[reaction:shmt-serine-glycine-interconversion]]). It is a pyridoxal-phosphate enzyme ([[compound:plp]]); the conversation correctly highlights its dependence on active B6. In liver and kidney the cytosolic isoform can run in either direction depending on the glycine, serine and folate supply, and a fraction translocates to the nucleus to supply thymidylate synthesis.",
      "Because SHMT consumes 5,10-methylene-THF when it converts glycine to serine, a large glycine load could in principle draw down the methylene-THF that [[enzyme:mthfr]] needs; conversely [[enzyme:gldc]]-driven glycine cleavage creates it. The net sign in humans is not established, so any 'glycine depletes folate/methyl' narrative should be treated as hypothesis."
    ],
    evidence: "established",
    facts: {
      gene: "SHMT1",
      ec: "2.1.2.1",
      uniprot: "P34896",
      rhea: "RHEA:15481",
      reactome: "R-HSA-200651",
      kegg: "ec:2.1.2.1",
      compartment: "cytosol (partly nucleus)",
      tissue: "liver, kidney (highest), ubiquitous",
      cofactors: "PLP; folate (THF)"
    },
    relations: [
      { rel: "part-of", to: "pathway:folate-cycle" },
      { rel: "part-of", to: "pathway:glycine-serine-route" },
      { rel: "interacts-with", to: "compound:plp", note: "pyridoxal phosphate cofactor" },
      { rel: "associated-with", to: "state:b6-functional-deficiency", note: "PLP-dependent; limits glycine-serine interconversion" }
    ],
    refs: ["article:reactome-folate-pterine-metabolism", "article:lamers-2007-glycine-flux"]
  },
  {
    id: "enzyme:shmt2",
    type: "enzyme",
    name: "Serine hydroxymethyltransferase 2, mitochondrial (SHMT2)",
    aliases: ["SHMT2", "mSHMT", "serina hidroximetiltransferase mitocondrial"],
    summary: "Mitochondrial PLP enzyme that converts serine to glycine and 5,10-methylene-THF; the main source of one-carbon units (formate) for the cell.",
    body: [
      "SHMT2 is the mitochondrial isoenzyme, strongly expressed in proliferating cells. It breaks down [[compound:serine]] to [[compound:glycine]] and [[compound:5-10-methylene-thf]] in the matrix ([[reaction:shmt-serine-glycine-interconversion]]); the methylene-THF is oxidised to formate, exported to the cytosol and re-attached to THF to feed purine and thymidylate synthesis and, ultimately, [[enzyme:mthfr]] and [[enzyme:mtr]] ([[pathway:folate-cycle]]). It uses [[compound:plp]] as cofactor.",
      "The glycine produced here is one of the three main sources of body glycine, together with the cytosolic reaction ([[enzyme:shmt1]]) and the choline-derived route ([[enzyme:dmgdh]], [[enzyme:sardh]]); the serine itself is built from 3-phosphoglycerate ([[pathway:glycine-serine-route]])."
    ],
    evidence: "established",
    facts: {
      gene: "SHMT2",
      ec: "2.1.2.1",
      uniprot: "P34897",
      rhea: "RHEA:15481",
      kegg: "ec:2.1.2.1",
      compartment: "mitochondrial matrix",
      tissue: "ubiquitous; high in proliferating cells",
      cofactors: "PLP; folate (THF)"
    },
    relations: [
      { rel: "part-of", to: "pathway:folate-cycle", note: "main mitochondrial source of 5,10-methylene-THF" },
      { rel: "part-of", to: "pathway:glycine-serine-route" },
      { rel: "interacts-with", to: "compound:plp", note: "pyridoxal phosphate cofactor" },
      { rel: "associated-with", to: "state:b6-functional-deficiency", note: "PLP-dependent" }
    ],
    refs: ["article:reactome-folate-pterine-metabolism", "article:lamers-2007-glycine-flux"]
  },
  {
    id: "enzyme:mthfd1",
    type: "enzyme",
    name: "Trifunctional C1-tetrahydrofolate synthase (MTHFD1)",
    aliases: ["MTHFD1", "C1-THF sintase", "metilenotetraidrofolato desidrogenase 1", "formil-THF sintetase", "C1-tetraidrofolato sintase"],
    summary: "Cytosolic trifunctional enzyme (dehydrogenase, cyclohydrolase, synthetase) interconverting 5,10-methylene-THF, 10-formyl-THF and formate.",
    body: [
      "MTHFD1 combines three activities: NADP+-dependent oxidation of [[compound:5-10-methylene-thf]] to 5,10-methenyl-THF ([[reaction:mthfd1-methylene-thf-oxidation]]), hydrolysis of methenyl-THF to [[compound:10-formyl-thf]] ([[reaction:mthfd1-methenyl-thf-cyclohydrolase]]), and the ATP-driven formation of 10-formyl-THF from [[compound:formate]] and [[compound:thf]] ([[reaction:mthfd1-formate-thf-ligase]]). 10-formyl-THF is the one-carbon donor for two steps of purine synthesis.",
      "In the cytosol it can run toward formyl-THF (formate assimilation, mitochondrial formate coming from [[enzyme:shmt2]]) or the other way to regenerate methylene-THF for [[enzyme:mthfr]]. A common MTHFD1 variant (R653Q) is a modifier of choline requirement and neural-tube-defect risk."
    ],
    evidence: "established",
    facts: {
      gene: "MTHFD1",
      ec: "1.5.1.5; 3.5.4.9; 6.3.4.3",
      uniprot: "P11586",
      rhea: "RHEA:22812; RHEA:23700; RHEA:20221",
      reactome: "R-HSA-200661; R-HSA-200718",
      kegg: "ec:6.3.4.3",
      compartment: "cytosol",
      tissue: "ubiquitous",
      cofactors: "NADP+; ATP; folate"
    },
    relations: [
      { rel: "part-of", to: "pathway:folate-cycle" },
      { rel: "interacts-with", to: "enzyme:shmt1", note: "supply of methylene-THF for formyl-THF generation" }
    ],
    refs: ["article:reactome-folate-pterine-metabolism"]
  },
  {
    id: "enzyme:gldc",
    type: "enzyme",
    name: "Glycine decarboxylase / P protein of the glycine cleavage system (GLDC)",
    aliases: ["GLDC", "glicina descarboxilase", "proteína P", "glycine dehydrogenase (decarboxylating)", "hiperglicinemia não cetótica"],
    summary: "PLP-dependent mitochondrial decarboxylase of the glycine cleavage system; releases CO2 from glycine and transfers the aminomethyl group to the lipoamide of H protein.",
    body: [
      "GLDC (the P protein) is a pyridoxal-phosphate enzyme ([[compound:plp]]) that decarboxylates [[compound:glycine]] and carries the remaining aminomethyl group onto the lipoyl arm of the H protein ([[enzyme:gcsh]]), releasing [[compound:carbon-dioxide]]. It is the first step of the glycine cleavage system ([[reaction:glycine-cleavage-system]], [[pathway:glycine-cleavage]]), which also needs [[enzyme:amt]] and [[enzyme:dld]].",
      "The system is the main route of glycine catabolism in liver, kidney and brain. Defects in GLDC (and AMT, GCSH) cause non-ketotic hyperglycinaemia (glycine encephalopathy). Note that this is the human mitochondrial 'glycine decarboxylase'; the gas-producing 'glycine decarboxylase' proposed in the conversation for upper-gut bacteria is a bacterial homologue ([[enzyme:bacterial-glycine-cleavage-system]]) and does not occur in the lumen of healthy people."
    ],
    evidence: "established",
    facts: {
      gene: "GLDC",
      ec: "1.4.4.2",
      uniprot: "P23378",
      rhea: "RHEA:24304",
      reactome: "R-HSA-5693967",
      kegg: "ec:1.4.4.2",
      compartment: "mitochondrial matrix",
      tissue: "liver, kidney, brain, placenta",
      cofactors: "PLP"
    },
    relations: [
      { rel: "part-of", to: "pathway:glycine-cleavage" },
      { rel: "interacts-with", to: "compound:plp", note: "pyridoxal phosphate cofactor" },
      { rel: "associated-with", to: "state:b6-functional-deficiency", note: "PLP-dependent step of glycine catabolism" }
    ],
    refs: ["article:kikuchi-2008-glycine-cleavage-system", "article:reactome-glycine-degradation"]
  },
  {
    id: "enzyme:amt",
    type: "enzyme",
    name: "Aminomethyltransferase / T protein of the glycine cleavage system (AMT)",
    aliases: ["AMT", "proteína T", "GCVT", "aminometiltransferase"],
    summary: "Mitochondrial folate-dependent T protein that transfers the aminomethyl group from H protein to THF, releasing ammonia and 5,10-methylene-THF.",
    body: [
      "AMT takes the aminomethyl-lipoamide generated by [[enzyme:gldc]] and transfers the carbon onto [[compound:thf]] to give [[compound:5-10-methylene-thf]], liberating [[compound:ammonia]] and leaving the reduced lipoamide on [[enzyme:gcsh]] (part of [[reaction:glycine-cleavage-system]]). This is the step that links glycine catabolism to the folate cycle, so a block in folate availability slows glycine cleavage, as noted in the conversation.",
      "Together the three reactions turn glycine into CO2, ammonia and one-carbon units, with NADH from [[enzyme:dld]]. AMT deficiency is a cause of non-ketotic hyperglycinaemia."
    ],
    evidence: "established",
    facts: {
      gene: "AMT",
      ec: "2.1.2.10",
      uniprot: "P48728",
      rhea: "RHEA:16945",
      reactome: "R-HSA-5693977",
      kegg: "ec:2.1.2.10",
      compartment: "mitochondrial matrix",
      tissue: "liver, kidney, brain",
      cofactors: "tetrahydrofolate (substrate)"
    },
    relations: [
      { rel: "part-of", to: "pathway:glycine-cleavage" },
      { rel: "part-of", to: "pathway:folate-cycle", note: "generates mitochondrial 5,10-methylene-THF" }
    ],
    refs: ["article:kikuchi-2008-glycine-cleavage-system", "article:reactome-glycine-degradation"]
  },
  {
    id: "enzyme:gcsh",
    type: "enzyme",
    name: "Glycine cleavage system H protein (GCSH)",
    aliases: ["GCSH", "proteína H", "H-protein", "lipoil-proteína de clivagem da glicina"],
    summary: "Small lipoyl-bearing carrier of the glycine cleavage system that shuttles the aminomethyl group between the P, T and L proteins.",
    body: [
      "GCSH is a ~14 kDa mitochondrial carrier protein bearing a lipoyl-lysine arm. It has no catalytic activity of its own: the arm accepts the aminomethyl group from [[enzyme:gldc]], swings to [[enzyme:amt]] for transfer to THF, and finally to [[enzyme:dld]] for re-oxidation of the dihydrolipoamide ([[reaction:glycine-cleavage-system]]).",
      "Its lipoylation is also an upstream requirement for lipoylating other mitochondrial 2-oxoacid dehydrogenases, linking glycine cleavage to energy metabolism. GCSH mutations are a rare cause of non-ketotic hyperglycinaemia."
    ],
    evidence: "established",
    facts: {
      gene: "GCSH",
      ec: "n/a (lipoyl carrier protein)",
      uniprot: "P23434",
      compartment: "mitochondrial matrix",
      tissue: "ubiquitous",
      cofactors: "lipoic acid (covalently bound)"
    },
    relations: [
      { rel: "part-of", to: "pathway:glycine-cleavage" },
      { rel: "interacts-with", to: "enzyme:gldc", note: "accepts aminomethyl group" }
    ],
    refs: ["article:kikuchi-2008-glycine-cleavage-system", "article:reactome-glycine-degradation"]
  },
  {
    id: "enzyme:dld",
    type: "enzyme",
    name: "Dihydrolipoamide dehydrogenase / L protein (DLD)",
    aliases: ["DLD", "proteína L", "dihidrolipoil desidrogenase", "E3"],
    summary: "FAD-dependent mitochondrial flavoenzyme (shared E3 subunit) that re-oxidises dihydrolipoamide with NAD+; the L protein of the glycine cleavage system.",
    body: [
      "DLD re-oxidises the dihydrolipoyl arm of [[enzyme:gcsh]] using FAD and [[compound:nad]], producing [[compound:nadh]] ([[reaction:glycine-cleavage-system]]). The same enzyme is the E3 subunit of pyruvate, 2-oxoglutarate and branched-chain 2-oxoacid dehydrogenases, so it is not specific to glycine metabolism.",
      "Because it supplies NADH to the respiratory chain it ties glycine catabolism to the mitochondrial redox state. DLD deficiency produces a combined 2-oxoacid dehydrogenase defect (maple-syrup-urine-like lactic acidosis)."
    ],
    evidence: "established",
    facts: {
      gene: "DLD",
      ec: "1.8.1.4",
      uniprot: "P09622",
      rhea: "RHEA:15045",
      kegg: "ec:1.8.1.4",
      compartment: "mitochondrial matrix",
      tissue: "ubiquitous",
      cofactors: "FAD; NAD+"
    },
    relations: [
      { rel: "part-of", to: "pathway:glycine-cleavage" },
      { rel: "interacts-with", to: "compound:nad", note: "oxidant; produces NADH" }
    ],
    refs: ["article:kikuchi-2008-glycine-cleavage-system", "article:reactome-glycine-degradation"]
  },
  {
    id: "enzyme:dmgdh",
    type: "enzyme",
    name: "Dimethylglycine dehydrogenase (DMGDH)",
    aliases: ["DMGDH", "dimetilglicina desidrogenase", "DMG desidrogenase", "2º metil da betaína"],
    summary: "Mitochondrial FAD enzyme that demethylates dimethylglycine to sarcosine, transferring the methyl carbon to THF as 5,10-methylene-THF.",
    body: [
      "DMGDH removes the second methyl group of [[compound:betaine]] after [[enzyme:bhmt]] has removed the first: [[compound:dimethylglycine]] plus [[compound:thf]] gives [[compound:sarcosine]] and [[compound:5-10-methylene-thf]], with electrons passed to the electron-transfer flavoprotein ([[reaction:dmgdh-dimethylglycine-demethylation]]). The enzyme has covalently bound FAD and is found in liver and kidney mitochondria.",
      "This is the step the conversation calls the 'second methyl via DMGDH' feeding purine/pyrimidine synthesis. Because the carbon enters the folate pool rather than SAM, it supports one-carbon metabolism but does not by itself increase SAM; to be used for methylation it must be reduced by [[enzyme:mthfr]] and passed through [[enzyme:mtr]]. DMGDH deficiency is a rare benign condition with raised plasma DMG and a fish-like odour."
    ],
    evidence: "established",
    facts: {
      gene: "DMGDH",
      ec: "1.5.8.4",
      uniprot: "Q9UI17",
      rhea: "RHEA:52856",
      reactome: "R-HSA-6797653",
      kegg: "ec:1.5.8.4",
      compartment: "mitochondrial matrix",
      tissue: "liver, kidney",
      cofactors: "FAD (covalent); THF; electron-transfer flavoprotein"
    },
    relations: [
      { rel: "part-of", to: "pathway:choline-oxidation" },
      { rel: "part-of", to: "pathway:glycine-serine-route", note: "choline-derived glycine" },
      { rel: "part-of", to: "pathway:folate-cycle", note: "donates one-carbon unit to mitochondrial THF" },
      { rel: "decreases", to: "compound:dimethylglycine" },
      { rel: "increases", to: "compound:sarcosine" },
      { rel: "increases", to: "compound:5-10-methylene-thf", note: "The methyl carbon enters the folate pool." }
    ],
    refs: ["article:reactome-choline-catabolism", "article:watmough-2010-etf-qo"]
  },
  {
    id: "enzyme:sardh",
    type: "enzyme",
    name: "Sarcosine dehydrogenase (SARDH)",
    aliases: ["SARDH", "sarcosina desidrogenase", "3º metil da betaína", "sarcosinemia"],
    summary: "Mitochondrial FAD enzyme that demethylates sarcosine to glycine with transfer of the methyl carbon to THF; recaptures the methyl released by GNMT.",
    body: [
      "SARDH catalyses the last demethylation of the betaine route: [[compound:sarcosine]] plus [[compound:thf]] gives [[compound:glycine]] and [[compound:5-10-methylene-thf]] ([[reaction:sardh-sarcosine-demethylation]]). The same enzyme handles the sarcosine formed by [[enzyme:gnmt]], so a GNMT-sarcosine-SARDH cycle burns SAM but conserves the carbon as a one-carbon unit and returns the glycine. A peroxisomal sarcosine/pipecolate oxidase (PIPOX) provides a minor second route that yields glycine plus formaldehyde.",
      "SARDH deficiency (sarcosinaemia) is benign and biochemical; it is a consideration when interpreting plasma sarcosine, which is a poor marker of 'methyl drain' because it reflects both GNMT flux and SARDH capacity."
    ],
    evidence: "established",
    facts: {
      gene: "SARDH",
      ec: "1.5.8.3",
      uniprot: "Q9UL12",
      rhea: "RHEA:19793",
      reactome: "R-HSA-6797913",
      kegg: "ec:1.5.8.3",
      compartment: "mitochondrial matrix",
      tissue: "liver, kidney",
      cofactors: "FAD (covalent); THF; electron-transfer flavoprotein"
    },
    relations: [
      { rel: "part-of", to: "pathway:choline-oxidation" },
      { rel: "part-of", to: "pathway:glycine-serine-route" },
      { rel: "interacts-with", to: "enzyme:gnmt", note: "shared metabolite sarcosine; recaptures GNMT-derived methyl as one-carbon unit" },
      { rel: "decreases", to: "compound:sarcosine", note: "Also recaptures the sarcosine made by GNMT." },
      { rel: "increases", to: "compound:glycine", note: "Final step of the choline-derived glycine route." }
    ],
    refs: ["article:reactome-choline-catabolism", "article:watmough-2010-etf-qo"]
  },

  // ------------------------------------------------------------------ choline oxidation
  {
    id: "enzyme:chdh",
    type: "enzyme",
    name: "Choline dehydrogenase (CHDH)",
    aliases: ["CHDH", "colina desidrogenase", "oxidação da colina"],
    summary: "Mitochondrial inner-membrane flavoenzyme of liver and kidney that oxidises choline to betaine aldehyde, the first step of choline-to-betaine conversion.",
    body: [
      "CHDH oxidises [[compound:choline]] to [[compound:betaine-aldehyde]] ([[reaction:chdh-choline-oxidation]]). It sits in the inner mitochondrial membrane and requires choline to be imported into mitochondria (SLC44A1); the physiological electron acceptor is not firmly defined, so databases list a generic hydrogen acceptor. Betaine aldehyde is then oxidised by [[enzyme:aldh7a1]] to [[compound:betaine]].",
      "Choline partitions between phosphorylation (CDP-choline route, [[enzyme:choline-kinase]]), acetylation ([[enzyme:chat]]) and oxidation here. Common CHDH variants (e.g. rs12676) are associated with altered choline requirement and with sperm motility. The oxidation route only becomes a major sink when choline intake is high; at low intake membranes are favoured."
    ],
    evidence: "established",
    facts: {
      gene: "CHDH",
      ec: "1.1.99.1",
      uniprot: "Q8NE62",
      rhea: "RHEA:17433",
      reactome: "R-HSA-6797961",
      kegg: "ec:1.1.99.1",
      compartment: "mitochondrial inner membrane",
      tissue: "liver, kidney",
      cofactors: "FAD"
    },
    relations: [
      { rel: "part-of", to: "pathway:choline-oxidation" },
      { rel: "interacts-with", to: "enzyme:choline-kinase", note: "competes for the free choline pool" },
      { rel: "decreases", to: "compound:choline", note: "Mitochondrial oxidation, the first step to betaine." },
      { rel: "increases", to: "compound:betaine-aldehyde" }
    ]
  },
  {
    id: "enzyme:aldh7a1",
    type: "enzyme",
    name: "Aldehyde dehydrogenase 7A1 (ALDH7A1; betaine aldehyde dehydrogenase / antiquitin)",
    aliases: ["ALDH7A1", "BADH", "antiquitina", "betaína aldeído desidrogenase", "ALDH9A1"],
    summary: "NAD+-dependent aldehyde dehydrogenase that converts betaine aldehyde to betaine; also the lysine-pathway enzyme whose deficiency causes pyridoxine-dependent epilepsy.",
    body: [
      "ALDH7A1 oxidises [[compound:betaine-aldehyde]] to [[compound:betaine]] with [[compound:nad]] ([[reaction:badh-betaine-aldehyde-oxidation]]). Reactome assigns the step to ALDH7A1, but the paralogue ALDH9A1 (trimethylaminobutyraldehyde dehydrogenase) also oxidises betaine aldehyde, so redundancy exists. It is cytosolic, mitochondrial and nuclear.",
      "The enzyme's main metabolic job is alpha-aminoadipic semialdehyde dehydrogenation in lysine catabolism. Its deficiency causes accumulation of piperideine-6-carboxylate, which chemically condenses with [[compound:plp]] and inactivates it, producing pyridoxine-dependent epilepsy: an instructive rare example of a functional B6 deficiency created by a metabolite rather than by low intake ([[state:b6-functional-deficiency]])."
    ],
    evidence: "established",
    facts: {
      gene: "ALDH7A1",
      ec: "1.2.1.8",
      uniprot: "P49419",
      rhea: "RHEA:15305",
      reactome: "R-HSA-6797955",
      kegg: "ec:1.2.1.8",
      compartment: "cytosol / mitochondrion / nucleus",
      tissue: "liver, kidney, brain, ubiquitous",
      cofactors: "NAD+"
    },
    relations: [
      { rel: "part-of", to: "pathway:choline-oxidation" },
      { rel: "associated-with", to: "state:b6-functional-deficiency", note: "ALDH7A1 deficiency traps PLP via P6C (pyridoxine-dependent epilepsy)" },
      { rel: "interacts-with", to: "compound:plp", note: "inactivated by P6C when the enzyme is deficient" },
      { rel: "increases", to: "compound:betaine", note: "Betaine aldehyde dehydrogenase step." }
    ],
    refs: ["article:reactome-choline-catabolism"]
  },

  // ------------------------------------------------------------------ neurotransmitter / histamine
  {
    id: "enzyme:gad1",
    type: "enzyme",
    name: "Glutamate decarboxylase 1 (GAD1; GAD67)",
    aliases: ["GAD1", "GAD67", "glutamato descarboxilase 67", "GAD", "glutamato descarboxilase 1"],
    summary: "PLP-dependent cytosolic isoform that provides baseline GABA by decarboxylating glutamate; largely saturated with PLP.",
    body: [
      "GAD67 is the constitutively active, cytosolic isoform of glutamate decarboxylase ([[reaction:gad-glutamate-decarboxylation]]), producing [[compound:gaba]] and [[compound:carbon-dioxide]] from [[compound:glutamate]] with [[compound:plp]] as cofactor. It is mostly in the holoenzyme form and supplies the tonic, non-vesicular GABA pool and the GABA used in the GABA shunt ([[pathway:gaba-shunt]]).",
      "Both GAD isoforms depend on PLP, so severe B6 limitation lowers GABA and can precipitate seizures (the classical B6-deficiency convulsions). Whether subclinical B6 insufficiency contributes to anxiety or 'brain fog' is plausible but unproven; the conversation's report of marked benefit from P5P is an anecdote consistent with this mechanism, not evidence for it."
    ],
    evidence: "established",
    facts: {
      gene: "GAD1",
      ec: "4.1.1.15",
      uniprot: "Q99259",
      rhea: "RHEA:17785",
      kegg: "ec:4.1.1.15",
      compartment: "cytosol",
      tissue: "GABAergic neurons, pancreatic islets, enteric nervous system",
      cofactors: "PLP"
    },
    relations: [
      { rel: "part-of", to: "pathway:gaba-shunt" },
      { rel: "interacts-with", to: "compound:plp", note: "pyridoxal phosphate cofactor" },
      { rel: "associated-with", to: "state:b6-functional-deficiency", note: "PLP-dependent; low PLP lowers GABA synthesis" }
    ],
    refs: ["article:erlander-1991-two-gad-genes", "article:petroff-2002-gaba-glutamate"]
  },
  {
    id: "enzyme:gad2",
    type: "enzyme",
    name: "Glutamate decarboxylase 2 (GAD2; GAD65)",
    aliases: ["GAD2", "GAD65", "glutamato descarboxilase 65", "anti-GAD", "glutamato descarboxilase 2"],
    summary: "Vesicle-associated PLP-dependent isoform that makes GABA on demand; around half is apoenzyme, so its output tracks PLP availability.",
    body: [
      "GAD65 is anchored to synaptic vesicle membranes and synthesises [[compound:gaba]] for release ([[reaction:gad-glutamate-decarboxylation]]). A large part of the pool is present as inactive apoenzyme that is rapidly activated by binding [[compound:plp]], so it behaves as a reserve that responds to PLP supply and to neuronal activity. This is the biochemical basis for the 'glutamate to GABA' argument in the conversation: excitatory [[compound:glutamate]] is converted to the inhibitory transmitter via a B6-dependent step ([[pathway:gaba-shunt]]).",
      "GAD65 is also an autoantigen in type 1 diabetes and stiff-person syndrome. A direct anxiolytic effect of P5P supplementation via GAD is plausible, but controlled evidence in healthy adults is weak, and the claim that oral P5P bypasses a liver 'bottleneck' is overstated (oral PLP is dephosphorylated in the gut and re-phosphorylated by [[enzyme:pdxk]] in tissues)."
    ],
    evidence: "established",
    facts: {
      gene: "GAD2",
      ec: "4.1.1.15",
      uniprot: "Q05329",
      rhea: "RHEA:17785",
      reactome: "R-HSA-888577",
      kegg: "ec:4.1.1.15",
      compartment: "cytosol (membrane-associated, synaptic vesicles)",
      tissue: "GABAergic neurons, pancreatic beta cells",
      cofactors: "PLP"
    },
    relations: [
      { rel: "part-of", to: "pathway:gaba-shunt" },
      { rel: "interacts-with", to: "compound:plp", note: "apoenzyme reservoir activated by PLP" },
      { rel: "associated-with", to: "disease:anxiety-disorder", note: "plausible GABA deficit with low PLP; conversation-reported benefit of P5P is anecdotal" },
      { rel: "associated-with", to: "state:b6-functional-deficiency", note: "PLP-dependent" }
    ],
    refs: ["article:erlander-1991-two-gad-genes", "article:battaglioli-2003-gad-isoform-kinetics"]
  },
  {
    id: "enzyme:abat",
    type: "enzyme",
    name: "4-aminobutyrate aminotransferase (ABAT; GABA-T)",
    aliases: ["ABAT", "GABA-T", "GABA transaminase", "transaminase do GABA", "vigabatrina"],
    summary: "PLP-dependent mitochondrial transaminase that catabolises GABA to succinic semialdehyde, regenerating glutamate (GABA shunt).",
    body: [
      "ABAT transfers the amino group of [[compound:gaba]] to [[compound:2-oxoglutarate]], giving [[compound:succinate-semialdehyde]] and [[compound:glutamate]] ([[reaction:abat-gaba-transamination]]). It is a PLP enzyme ([[compound:plp]]) and is the target of the antiepileptic vigabatrin, which raises brain GABA by irreversibly inhibiting it.",
      "Together with [[enzyme:gad1]]/[[enzyme:gad2]] and [[enzyme:aldh5a1]] it closes the GABA shunt, a bypass of the TCA cycle between 2-oxoglutarate and succinate ([[pathway:gaba-shunt]]). Gut bacteria also produce and consume GABA, so luminal GABA is not purely host-derived."
    ],
    evidence: "established",
    facts: {
      gene: "ABAT",
      ec: "2.6.1.19",
      uniprot: "P80404",
      rhea: "RHEA:23352",
      reactome: "R-HSA-916855",
      kegg: "ec:2.6.1.19",
      compartment: "mitochondrial matrix",
      tissue: "brain, liver, kidney",
      cofactors: "PLP; [2Fe-2S] cluster"
    },
    relations: [
      { rel: "part-of", to: "pathway:gaba-shunt" },
      { rel: "interacts-with", to: "compound:plp", note: "pyridoxal phosphate cofactor" }
    ],
    refs: ["article:petroff-2002-gaba-glutamate", "article:rhea-2022"]
  },
  {
    id: "enzyme:aldh5a1",
    type: "enzyme",
    name: "Succinate-semialdehyde dehydrogenase (ALDH5A1; SSADH)",
    aliases: ["ALDH5A1", "SSADH", "semialdeído succínico desidrogenase"],
    summary: "Mitochondrial NAD+-dependent enzyme that oxidises succinic semialdehyde to succinate, completing the GABA shunt.",
    body: [
      "ALDH5A1 oxidises [[compound:succinate-semialdehyde]] to [[compound:succinate]] with [[compound:nad]] ([[reaction:aldh5a1-succinate-semialdehyde-oxidation]]), delivering the carbon back into the TCA cycle. When it is deficient, semialdehyde is reduced to gamma-hydroxybutyrate (GHB aciduria) and GABA accumulates.",
      "It is not B6-dependent, so in the GABA shunt ([[pathway:gaba-shunt]]) only the first two steps ([[enzyme:gad1]], [[enzyme:gad2]] and [[enzyme:abat]]) are sensitive to PLP."
    ],
    evidence: "established",
    facts: {
      gene: "ALDH5A1",
      ec: "1.2.1.24",
      uniprot: "P51649",
      rhea: "RHEA:13217",
      reactome: "R-HSA-888548",
      kegg: "ec:1.2.1.24",
      compartment: "mitochondrial matrix",
      tissue: "brain, liver, kidney",
      cofactors: "NAD+"
    },
    relations: [
      { rel: "part-of", to: "pathway:gaba-shunt" },
      { rel: "interacts-with", to: "compound:nad", note: "oxidant; produces NADH" }
    ],
    refs: ["article:petroff-2002-gaba-glutamate", "article:rhea-2022"]
  },
  {
    id: "enzyme:hnmt",
    type: "enzyme",
    name: "Histamine N-methyltransferase (HNMT)",
    aliases: ["HNMT", "histamina N-metiltransferase", "degradação intracelular da histamina", "T105I"],
    summary: "Cytosolic SAM-dependent enzyme that inactivates histamine by ring N-methylation; the only histamine-clearing route in brain and airway.",
    body: [
      "HNMT transfers a methyl group from [[compound:sam]] to the tele nitrogen of the imidazole ring of [[compound:histamine]], forming N-tau-methylhistamine ([[compound:methylhistamine]]) and [[compound:sah]] ([[reaction:hnmt-histamine-methylation]]). It is intracellular, broadly expressed (liver, kidney, colon, airway, brain) and is the sole route of histamine inactivation in the central nervous system and bronchi, which lack [[enzyme:dao]]. Methylhistamine is then oxidised by monoamine oxidase B and an aldehyde dehydrogenase to methylimidazoleacetic acid.",
      "Because HNMT is SAM-dependent and inhibited by SAH, it is a plausible point where the methylation index could influence histamine tone ([[pathway:histamine-degradation]]); a common variant (T105I) lowers activity. The conversation extends this to a night-time mechanism in which choline raises SAM (via betaine and [[enzyme:bhmt]]), lowering histamine-driven tachycardia and awakenings at 2-3 am. The chain is biochemically coherent but each link is unproven in humans and brain SAM is largely set locally, so it is recorded as plausible only."
    ],
    evidence: "established",
    facts: {
      gene: "HNMT",
      ec: "2.1.1.8",
      uniprot: "P50135",
      rhea: "RHEA:19301",
      reactome: "R-HSA-175993",
      kegg: "ec:2.1.1.8",
      compartment: "cytosol",
      tissue: "liver, kidney, colon, airway, brain",
      cofactors: "none (SAM co-substrate)"
    },
    relations: [
      { rel: "part-of", to: "pathway:histamine-degradation" },
      { rel: "part-of", to: "pathway:methyl-budget" },
      { rel: "associated-with", to: "disease:histamine-intolerance", note: "reduced activity variants or low SAM may slow intracellular clearance (plausible)" },
      { rel: "associated-with", to: "state:undermethylation", note: "SAM-dependent; SAH-inhibited" },
      { rel: "decreases", to: "compound:histamine", note: "Intracellular ring N-methylation; the only histamine-clearing route in brain.", claim: "claim:hnmt-needs-sam", strength: "strong" },
      { rel: "decreases", to: "compound:sam", note: "One SAM per histamine methylated; a small methyl sink." },
      { rel: "increases", to: "compound:sah" },
      { rel: "increases", to: "compound:methylhistamine" }
    ]
  },
  {
    id: "enzyme:dao",
    type: "enzyme",
    name: "Diamine oxidase (DAO; AOC1; histaminase)",
    aliases: ["DAO", "AOC1", "diamina oxidase", "histaminase", "ABP1", "DAO intestinal"],
    summary: "Copper/topaquinone amine oxidase secreted by intestinal and renal cells that oxidatively deaminates extracellular histamine and putrescine.",
    body: [
      "DAO oxidises [[compound:histamine]] to imidazole acetaldehyde with consumption of oxygen and release of ammonia and hydrogen peroxide ([[reaction:dao-histamine-oxidation]]). It is a copper-containing amine oxidase with a topaquinone cofactor, stored in vesicles of enterocytes at the villus tip and released into plasma; highest expression is in small intestine, kidney and placenta. Its role is degradation of ingested and bacterially derived histamine at the mucosal barrier ([[pathway:histamine-degradation]]).",
      "Older literature describes DAO as pyridoxal-phosphate-dependent, which is why B6 is sometimes suggested to support it; current structural biochemistry shows copper/TPQ, not PLP, so any benefit of B6 on histamine is more plausibly through other PLP enzymes. DAO is inhibited by alcohol and by several drugs, and low DAO is invoked in histamine intolerance ([[disease:histamine-intolerance]]), a concept whose diagnostic criteria remain contested."
    ],
    evidence: "established",
    facts: {
      gene: "AOC1",
      ec: "1.4.3.22",
      uniprot: "P19801",
      rhea: "RHEA:25625",
      reactome: "R-HSA-5696131",
      kegg: "ec:1.4.3.22",
      compartment: "extracellular / secretory vesicles",
      tissue: "small intestine, kidney, placenta",
      cofactors: "Cu2+; topaquinone (TPQ)"
    },
    relations: [
      { rel: "part-of", to: "pathway:histamine-degradation" },
      { rel: "associated-with", to: "disease:histamine-intolerance", note: "low DAO activity is the proposed mechanism; contested" },
      { rel: "interacts-with", to: "enzyme:hnmt", note: "complementary extracellular vs intracellular clearance" },
      { rel: "decreases", to: "compound:histamine", note: "Extracellular oxidative deamination in gut and kidney; not SAM-dependent.", strength: "strong" }
    ]
  },

  // ------------------------------------------------------------------ vitamin B6 activation
  {
    id: "enzyme:pdxk",
    type: "enzyme",
    name: "Pyridoxal kinase (PDXK)",
    aliases: ["PDXK", "piridoxal quinase", "piridoxina quinase", "ativação da B6"],
    summary: "ATP-dependent kinase that phosphorylates pyridoxal, pyridoxine and pyridoxamine at the 5' position, producing PLP precursors in every tissue.",
    body: [
      "PDXK converts [[compound:pyridoxal]] to [[compound:plp]] ([[reaction:pdxk-pyridoxal-phosphorylation]]) and also phosphorylates pyridoxine and pyridoxamine, consuming Mg-ATP ([[compound:magnesium]], [[compound:atp]]). The pyridoxine- and pyridoxamine-phosphates are oxidised to PLP by [[enzyme:pnpo]] ([[pathway:vitamin-b6-activation]]).",
      "The conversation states that pyridoxine must pass through the liver to be phosphorylated and that P5P supplements bypass this. In fact PDXK is expressed in all tissues, oral P5P is largely dephosphorylated by intestinal alkaline phosphatase before absorption, and cells re-phosphorylate the free vitamers. PDXK activity can be inhibited by drugs such as theophylline and hydrazides (isoniazid) that form PLP hydrazones, one cause of drug-induced functional B6 deficiency."
    ],
    evidence: "established",
    facts: {
      gene: "PDXK",
      ec: "2.7.1.35",
      uniprot: "O00764",
      rhea: "RHEA:10224",
      kegg: "ec:2.7.1.35",
      compartment: "cytosol",
      tissue: "ubiquitous",
      cofactors: "Mg-ATP; Zn2+ or K+ stimulate"
    },
    relations: [
      { rel: "part-of", to: "pathway:vitamin-b6-activation" },
      { rel: "interacts-with", to: "compound:magnesium", note: "Mg-ATP substrate" },
      { rel: "associated-with", to: "state:b6-functional-deficiency", note: "drug inhibition or low kinase flux limits PLP supply" }
    ],
    refs: ["article:parra-2018-vitamin-b6-metabolism", "article:ueland-2015-b6-biomarkers"]
  },
  {
    id: "enzyme:pnpo",
    type: "enzyme",
    name: "Pyridoxine 5'-phosphate oxidase (PNPO)",
    aliases: ["PNPO", "piridoxina fosfato oxidase", "PNP oxidase", "riboflavina e B6"],
    summary: "FMN-dependent oxidase that converts pyridoxine 5'-phosphate and pyridoxamine 5'-phosphate to PLP; ties B6 activation to riboflavin status.",
    body: [
      "PNPO oxidises pyridoxine 5'-phosphate (and pyridoxamine 5'-phosphate) to [[compound:plp]] using oxygen and releasing hydrogen peroxide ([[reaction:pnpo-pnp-oxidation]]). It is a flavoprotein ([[enzyme:pdxk]] makes its substrates) and most abundant in liver, kidney and brain; product PLP feedback-inhibits it.",
      "Because the cofactor is FMN, derived from riboflavin, low riboflavin can produce a functional B6 deficiency despite adequate B6 intake ([[state:b6-functional-deficiency]]). PNPO deficiency causes a neonatal epileptic encephalopathy that responds to PLP but not to pyridoxine, an experiment of nature supporting the pathway order."
    ],
    evidence: "established",
    facts: {
      gene: "PNPO",
      ec: "1.4.3.5",
      uniprot: "Q9NVS9",
      rhea: "RHEA:15149; RHEA:15817",
      kegg: "ec:1.4.3.5",
      compartment: "cytosol",
      tissue: "liver, kidney, brain",
      cofactors: "FMN"
    },
    relations: [
      { rel: "part-of", to: "pathway:vitamin-b6-activation" },
      { rel: "associated-with", to: "state:b6-functional-deficiency", note: "riboflavin (FMN) limitation lowers PLP formation" }
    ],
    refs: ["article:parra-2018-vitamin-b6-metabolism", "article:ueland-2015-b6-biomarkers"]
  },

  // ------------------------------------------------------------------ gastric acid / CO2 / urease
  {
    id: "enzyme:carbonic-anhydrase",
    type: "enzyme",
    name: "Carbonic anhydrase II and relatives (CA2; CA4, CA9, CA12, CA14)",
    aliases: ["CA2", "CA II", "anidrase carbônica", "carbonato desidratase", "CA4", "acetazolamida"],
    summary: "Zinc enzymes that interconvert CO2 + H2O and HCO3- + H+ at up to ~10^6 turnovers per second; supply protons to gastric parietal cells and bicarbonate to pancreas and duodenum.",
    body: [
      "Carbonic anhydrases catalyse [[reaction:carbonic-anhydrase-bicarbonate-dehydration]] in both directions, using an active-site zinc hydroxide; CA II has a kcat of about a million per second, making it among the fastest known enzymes. In the stomach, cytosolic CA II of parietal cells hydrates [[compound:carbon-dioxide]] to bicarbonate and a proton, the proton being pumped out by [[enzyme:h-k-atpase]] and bicarbonate leaving across the basolateral membrane ('alkaline tide'; [[pathway:gastric-acid-secretion]]). Membrane-bound isoforms (CA IV, IX, XII, XIV) and CA II in pancreatic duct and duodenal epithelium support bicarbonate secretion; CA IV also dehydrates luminal bicarbonate at brush borders.",
      "The uncatalysed route (bicarbonate + H+ to carbonic acid to water + CO2; [[reaction:proton-bicarbonate-protonation]], [[reaction:carbonic-acid-dehydration]]) is fast enough at gastric pH that luminal acid-bicarbonate neutralisation ([[pathway:acid-bicarbonate-neutralisation]]) does not depend on the enzyme. The conversation's claim of 'low carbonic anhydrase activity' as part of hypochlorhydria in under-methylated people has no direct support and is recorded as conversation-only. Inhibitors (acetazolamide, topiramate, sulfonamides) reduce acid and bicarbonate secretion."
    ],
    evidence: "established",
    facts: {
      gene: "CA2 (also CA1, CA4, CA9, CA12, CA14)",
      ec: "4.2.1.1",
      uniprot: "P00918",
      rhea: "RHEA:10748",
      reactome: "R-HSA-1475022",
      kegg: "ec:4.2.1.1",
      compartment: "cytosol (CA II); plasma membrane (CA IV, IX, XII, XIV)",
      tissue: "gastric parietal cells, erythrocytes, pancreatic duct, duodenum, kidney",
      cofactors: "Zn2+",
      kinetics: "CA II kcat ~10^6 per second"
    },
    relations: [
      { rel: "part-of", to: "pathway:gastric-acid-secretion" },
      { rel: "part-of", to: "pathway:acid-bicarbonate-neutralisation" },
      { rel: "associated-with", to: "state:hypochlorhydria", note: "conversation-only: low CA activity in under-methylation is unsupported; CA inhibitors do reduce acid output" }
    ],
    refs: ["article:kaunitz-2006-duodenal-co2-carbonic-anhydrase"]
  },
  {
    id: "enzyme:h-k-atpase",
    type: "enzyme",
    name: "Gastric H+/K+-ATPase (proton pump; ATP4A/ATP4B)",
    aliases: ["ATP4A", "ATP4B", "bomba de prótons", "H+/K+ ATPase gástrica", "alvo dos IBPs", "alvo do omeprazol", "vonoprazana"],
    summary: "P-type ATPase of the parietal-cell canalicular membrane that exchanges cytosolic H+ for luminal K+ at the expense of ATP, acidifying gastric juice to pH ~1.",
    body: [
      "The gastric H+/K+-ATPase (alpha subunit ATP4A, beta subunit ATP4B) hydrolyses [[compound:atp]] to pump H+ into the secretory canaliculus in exchange for K+, producing a gradient of roughly a million-fold (cytosol pH ~7.2, lumen pH ~1; [[reaction:h-k-atpase-proton-pumping]]). Chloride follows through apical channels, completing [[compound:hydrochloric-acid]] secretion ([[reaction:gastric-hcl-secretion]], [[pathway:gastric-acid-secretion]]). The supply of protons comes from [[enzyme:carbonic-anhydrase]].",
      "Pump activation is driven by [[compound:histamine]] from ECL cells (H2 receptors), vagal [[compound:acetylcholine]] (M3 receptors) and [[compound:gastrin]] (acting largely through ECL histamine). Proton-pump inhibitors are acid-activated prodrugs that bind luminal cysteines covalently; potassium-competitive blockers (vonoprazan) act reversibly. Prolonged inhibition lowers acid and is associated with bacterial overgrowth, the context in which the conversation locates glycine-related belching ([[state:hypochlorhydria]], [[disease:sibo]])."
    ],
    evidence: "established",
    facts: {
      gene: "ATP4A; ATP4B",
      ec: "7.2.2.19",
      uniprot: "P20648; P51164",
      rhea: "RHEA:22044",
      kegg: "ec:7.2.2.19",
      compartment: "parietal-cell apical canalicular membrane / tubulovesicles",
      tissue: "gastric parietal cells",
      cofactors: "Mg-ATP; K+"
    },
    relations: [
      { rel: "part-of", to: "pathway:gastric-acid-secretion" },
      { rel: "associated-with", to: "state:hypochlorhydria", note: "PPI inhibition is the commonest cause of low acid" },
      { rel: "associated-with", to: "disease:peptic-ulcer", note: "acid-peptic injury; PPIs promote healing" },
      { rel: "associated-with", to: "system:gastric-physiology" },
      { rel: "part-of", to: "system:gastric-parietal-cells" }
    ],
    refs: ["article:schubert-2008-gastric-acid-secretion-control"]
  },
  {
    id: "enzyme:h-pylori-urease",
    type: "enzyme",
    name: "Helicobacter pylori urease (UreAB)",
    aliases: ["urease", "UreA", "UreB", "urease de H. pylori", "teste respiratório da ureia"],
    summary: "Nickel-dependent bacterial urease that hydrolyses urea to ammonia and CO2, buffering the bacterium against gastric acid; also the basis of the urea breath test.",
    body: [
      "Urease from [[disease:h-pylori-infection]] hydrolyses [[compound:urea]] to [[compound:ammonia]] and [[compound:carbon-dioxide]] ([[reaction:urease-urea-hydrolysis]]); the databases write the product as bicarbonate plus ammonium (Rhea RHEA:20557), which is the same reaction after hydration/ionisation. The enzyme has a bi-nickel active site assembled by the accessory proteins UreE-UreG, and a proton-gated urea channel (UreI) increases substrate access in acid. It can make up several percent of the bacterial protein.",
      "The ammonia neutralises the immediate microenvironment, allowing survival in the gastric lumen, and also damages epithelium. Labelled CO2 from 13C-urea in breath is the clinical urea breath test. The conversation suggests urease is 'one of the largest causes of frequent belching' and a source of gas after ulcer treatment; there is no direct evidence that urease CO2 causes eructation (most belching is swallowed air), so the link is recorded as conversation-only. Other urease-positive bacteria (Proteus, Klebsiella) can behave similarly if they colonise the upper gut."
    ],
    evidence: "established",
    facts: {
      gene: "ureA; ureB (accessory ureE, ureF, ureG, ureH, ureI)",
      ec: "3.5.1.5",
      rhea: "RHEA:20557",
      kegg: "ec:3.5.1.5",
      compartment: "bacterial cytoplasm / periplasm",
      tissue: "gastric mucus layer and antral mucosa (colonised)",
      cofactors: "Ni2+"
    },
    relations: [
      { rel: "part-of", to: "pathway:h-pylori-urease-activity" },
      { rel: "associated-with", to: "disease:h-pylori-infection", note: "key virulence/colonisation factor" },
      { rel: "associated-with", to: "disease:peptic-ulcer", note: "ammonia-mediated mucosal injury; H. pylori is a major cause of ulcers" },
      { rel: "associated-with", to: "outcome:belching", note: "conversation-only: urease CO2/NH3 as a driver of eructation, not demonstrated" }
    ]
  },

  // ------------------------------------------------------------------ Kennedy pathway & acetylcholine
  {
    id: "enzyme:choline-kinase",
    type: "enzyme",
    name: "Choline kinase (CHKA / CHKB)",
    aliases: ["CHKA", "CHKB", "colina quinase", "CK", "fosforilação da colina", "via de Kennedy"],
    summary: "Cytosolic ATP-dependent kinase that phosphorylates choline to phosphocholine, committing it to the CDP-choline (Kennedy) route to phosphatidylcholine.",
    body: [
      "Choline kinase transfers phosphate from [[compound:atp]] to [[compound:choline]], forming phosphocholine ([[reaction:choline-kinase-phosphocholine]]); the alpha and beta isoforms also phosphorylate ethanolamine less efficiently. Phosphocholine is converted to CDP-choline by [[enzyme:pcyt1a]] and then to [[compound:phosphatidylcholine]] by [[enzyme:chpt1]]/[[enzyme:cept1]] ([[pathway:kennedy-pathway]]).",
      "Phosphorylation traps choline inside cells and is quantitatively the main fate of free choline, so oxidation to betaine ([[enzyme:chdh]]) and acetylation ([[enzyme:chat]]) compete with it. Biallelic CHKB loss causes a megaconial congenital muscular dystrophy; CHKA is highly expressed in many tumours (phosphocholine peak in MR spectroscopy)."
    ],
    evidence: "established",
    facts: {
      gene: "CHKA; CHKB",
      ec: "2.7.1.32",
      uniprot: "P35790; Q9Y259",
      rhea: "RHEA:12837",
      kegg: "ec:2.7.1.32",
      compartment: "cytosol",
      tissue: "ubiquitous (CHKB muscle, liver)",
      cofactors: "Mg-ATP"
    },
    relations: [
      { rel: "part-of", to: "pathway:kennedy-pathway" },
      { rel: "interacts-with", to: "enzyme:chdh", note: "competition for the free choline pool" }
    ],
    refs: ["article:vance-2014-phospholipid-methylation", "article:kennedy-1956-cytidine-coenzymes"]
  },
  {
    id: "enzyme:pcyt1a",
    type: "enzyme",
    name: "CTP:phosphocholine cytidylyltransferase alpha (PCYT1A; CCT-alpha)",
    aliases: ["PCYT1A", "CCT", "CCT-alfa", "citidililtransferase", "etapa limitante da via de Kennedy"],
    summary: "Rate-regulating enzyme of the CDP-choline pathway; membrane binding by an amphitropic domain senses PC deficiency and switches the enzyme on.",
    body: [
      "PCYT1A condenses phosphocholine with CTP to give CDP-choline and pyrophosphate ([[reaction:pcyt1a-cdp-choline-synthesis]]). It is considered the rate-regulating step of [[compound:phosphatidylcholine]] synthesis by the Kennedy pathway: the enzyme is soluble and inactive when membranes are PC-rich, and binds and is activated by membranes that are PC-poor or enriched in diacylglycerol, a lipid-sensing feedback. It is located in the nucleus or ER depending on cell state.",
      "This regulation matters for the methylation story because PC homeostasis can be maintained by CDP-choline when [[enzyme:pemt]] output falls with low SAM, as long as choline is available ([[pathway:kennedy-pathway]])."
    ],
    evidence: "established",
    facts: {
      gene: "PCYT1A",
      ec: "2.7.7.15",
      uniprot: "P49585",
      rhea: "RHEA:18997",
      reactome: "R-HSA-1483081",
      kegg: "ec:2.7.7.15",
      compartment: "nucleus / endoplasmic reticulum (amphitropic)",
      tissue: "ubiquitous",
      cofactors: "CTP"
    },
    relations: [
      { rel: "part-of", to: "pathway:kennedy-pathway", note: "rate-regulating step" },
      { rel: "interacts-with", to: "compound:phosphatidylcholine", note: "membrane PC content regulates activity" }
    ],
    refs: ["article:vance-2014-phospholipid-methylation", "article:kennedy-1956-cytidine-coenzymes"]
  },
  {
    id: "enzyme:chpt1",
    type: "enzyme",
    name: "Cholinephosphotransferase 1 (CHPT1)",
    aliases: ["CHPT1", "CPT", "colinafosfotransferase", "diacilglicerol colinafosfotransferase"],
    summary: "Golgi enzyme that transfers phosphocholine from CDP-choline to diacylglycerol, forming phosphatidylcholine in the final Kennedy-pathway step.",
    body: [
      "CHPT1 catalyses the last step of the CDP-choline pathway: CDP-choline plus diacylglycerol gives [[compound:phosphatidylcholine]] and CMP ([[reaction:chpt1-cdp-choline-to-pc]]). It is specific for choline; the dual-specificity [[enzyme:cept1]] acts in the ER and nuclear envelope. This PC contrasts with PEMT-made PC in its fatty-acid composition ([[enzyme:pemt]]).",
      "Both enzymes require Mg2+ or Mn2+ and are integral membrane proteins; acyl-chain remodelling by the Lands cycle follows."
    ],
    evidence: "established",
    facts: {
      gene: "CHPT1",
      ec: "2.7.8.2",
      uniprot: "Q8WUD6",
      rhea: "RHEA:32939",
      reactome: "R-HSA-1482973",
      kegg: "ec:2.7.8.2",
      compartment: "Golgi membrane",
      tissue: "ubiquitous",
      cofactors: "Mg2+ / Mn2+"
    },
    relations: [
      { rel: "part-of", to: "pathway:kennedy-pathway" },
      { rel: "interacts-with", to: "enzyme:cept1", note: "paralog acting in the ER" }
    ],
    refs: ["article:vance-2014-phospholipid-methylation", "article:kennedy-1956-cytidine-coenzymes"]
  },
  {
    id: "enzyme:cept1",
    type: "enzyme",
    name: "Choline/ethanolamine phosphotransferase 1 (CEPT1)",
    aliases: ["CEPT1", "CEPT", "colina/etanolamina fosfotransferase"],
    summary: "ER/nuclear-envelope dual-specificity phosphotransferase that makes both phosphatidylcholine and phosphatidylethanolamine from their CDP-derivatives and diacylglycerol.",
    body: [
      "CEPT1 accepts CDP-choline and CDP-ethanolamine, producing [[compound:phosphatidylcholine]] ([[reaction:chpt1-cdp-choline-to-pc]]) and [[compound:phosphatidylethanolamine]] ([[reaction:ept-cdp-ethanolamine-to-pe]]). It is the main PC-forming phosphotransferase of the ER, while [[enzyme:chpt1]] works in the Golgi and [[enzyme:selenoi]] is mostly ethanolamine-specific.",
      "The PE it produces is the substrate for [[enzyme:pemt]] in hepatocytes, tying the two routes to PC together ([[pathway:kennedy-pathway]], [[pathway:pemt-pc-synthesis]])."
    ],
    evidence: "established",
    facts: {
      gene: "CEPT1",
      ec: "2.7.8.1; 2.7.8.2",
      uniprot: "Q9Y6K0",
      rhea: "RHEA:32939; RHEA:32943",
      reactome: "R-HSA-1482961; R-HSA-1482962",
      kegg: "ec:2.7.8.2",
      compartment: "endoplasmic reticulum / nuclear envelope",
      tissue: "ubiquitous",
      cofactors: "Mg2+ / Mn2+"
    },
    relations: [
      { rel: "part-of", to: "pathway:kennedy-pathway" },
      { rel: "interacts-with", to: "enzyme:pemt", note: "CEPT1-derived PE is the substrate for PEMT" }
    ],
    refs: ["article:vance-2014-phospholipid-methylation", "article:kennedy-1956-cytidine-coenzymes"]
  },
  {
    id: "enzyme:etnk1",
    type: "enzyme",
    name: "Ethanolamine kinase 1 (ETNK1)",
    aliases: ["ETNK1", "etanolamina quinase", "EKI1"],
    summary: "Kinase that phosphorylates ethanolamine to phosphoethanolamine, the first step of the CDP-ethanolamine branch of the Kennedy pathway.",
    body: [
      "ETNK1 converts [[compound:ethanolamine]] and [[compound:atp]] to phosphoethanolamine ([[reaction:etnk1-ethanolamine-phosphorylation]]). The product is activated by [[enzyme:pcyt2]] and used by [[enzyme:selenoi]] or [[enzyme:cept1]] to form [[compound:phosphatidylethanolamine]] ([[pathway:kennedy-pathway]]).",
      "ETNK1 is specific for ethanolamine, unlike the dual-specificity choline/ethanolamine kinases ([[enzyme:choline-kinase]]). Somatic ETNK1 mutations are reported in some myeloid neoplasms."
    ],
    evidence: "established",
    facts: {
      gene: "ETNK1",
      ec: "2.7.1.82",
      uniprot: "Q9HBU6",
      rhea: "RHEA:13069",
      kegg: "ec:2.7.1.82",
      compartment: "cytosol",
      tissue: "ubiquitous",
      cofactors: "Mg-ATP"
    },
    relations: [
      { rel: "part-of", to: "pathway:kennedy-pathway", note: "CDP-ethanolamine branch" },
      { rel: "interacts-with", to: "enzyme:pcyt2", note: "next step" }
    ],
    refs: ["article:vance-2014-phospholipid-methylation", "article:kennedy-1956-cytidine-coenzymes"]
  },
  {
    id: "enzyme:pcyt2",
    type: "enzyme",
    name: "CTP:phosphoethanolamine cytidylyltransferase (PCYT2; ECT)",
    aliases: ["PCYT2", "ECT", "citidililtransferase de fosfoetanolamina"],
    summary: "Rate-limiting enzyme of the CDP-ethanolamine branch; condenses phosphoethanolamine with CTP.",
    body: [
      "PCYT2 forms CDP-ethanolamine and pyrophosphate from phosphoethanolamine and CTP ([[reaction:pcyt2-cdp-ethanolamine-synthesis]]). It is the regulatory step of the CDP-ethanolamine pathway that supplies [[compound:phosphatidylethanolamine]], either as the end product or as the substrate for [[enzyme:pemt]].",
      "Biallelic PCYT2 variants cause a complex hereditary spastic paraplegia/leukodystrophy phenotype, underscoring the importance of PE synthesis in neurons ([[pathway:kennedy-pathway]])."
    ],
    evidence: "established",
    facts: {
      gene: "PCYT2",
      ec: "2.7.7.14",
      uniprot: "Q99447",
      rhea: "RHEA:24592",
      reactome: "R-HSA-1483190",
      kegg: "ec:2.7.7.14",
      compartment: "cytosol / ER surface",
      tissue: "ubiquitous",
      cofactors: "CTP"
    },
    relations: [
      { rel: "part-of", to: "pathway:kennedy-pathway", note: "CDP-ethanolamine branch" },
      { rel: "interacts-with", to: "enzyme:etnk1", note: "previous step" }
    ],
    refs: ["article:vance-2014-phospholipid-methylation", "article:kennedy-1956-cytidine-coenzymes"]
  },
  {
    id: "enzyme:selenoi",
    type: "enzyme",
    name: "Ethanolaminephosphotransferase 1 (SELENOI; EPT1)",
    aliases: ["SELENOI", "EPT1", "selenoproteína I", "etanolaminafosfotransferase"],
    summary: "Golgi selenoprotein that transfers phosphoethanolamine from CDP-ethanolamine to diacylglycerol to form phosphatidylethanolamine.",
    body: [
      "SELENOI (EPT1) completes the CDP-ethanolamine branch: CDP-ethanolamine plus diacylglycerol gives [[compound:phosphatidylethanolamine]] and CMP ([[reaction:ept-cdp-ethanolamine-to-pe]]). It is a selenocysteine-containing membrane protein, so selenium status is linked to ether-PE synthesis; loss-of-function causes a hereditary spastic paraplegia.",
      "It works alongside [[enzyme:cept1]] in the ER ([[pathway:kennedy-pathway]]); the PE it provides is the starting material for hepatic [[enzyme:pemt]]."
    ],
    evidence: "established",
    facts: {
      gene: "SELENOI",
      ec: "2.7.8.1",
      uniprot: "Q9C0D9",
      rhea: "RHEA:32943",
      reactome: "R-HSA-1482962",
      kegg: "ec:2.7.8.1",
      compartment: "Golgi membrane",
      tissue: "ubiquitous (brain, liver)",
      cofactors: "Mg2+ / Mn2+; selenocysteine in active protein"
    },
    relations: [
      { rel: "part-of", to: "pathway:kennedy-pathway", note: "CDP-ethanolamine branch" },
      { rel: "interacts-with", to: "enzyme:cept1", note: "overlapping PE synthesis" }
    ],
    refs: ["article:vance-2014-phospholipid-methylation", "article:kennedy-1956-cytidine-coenzymes"]
  },
  {
    id: "enzyme:chat",
    type: "enzyme",
    name: "Choline acetyltransferase (ChAT)",
    aliases: ["CHAT", "ChAT", "colina acetiltransferase", "síntese de acetilcolina"],
    summary: "Cytosolic enzyme of cholinergic neurons that acetylates choline with acetyl-CoA to make acetylcholine, the transmitter of the vagus nerve.",
    body: [
      "ChAT transfers the acetyl group of [[compound:acetyl-coa]] to [[compound:choline]], forming [[compound:acetylcholine]] and [[compound:coa]] ([[reaction:chat-acetylcholine-synthesis]]). It is a marker of cholinergic neurons, including vagal efferents. The usual rate-limiting step for acetylcholine synthesis is neuronal choline uptake (high-affinity choline transporter SLC5A7) rather than ChAT itself.",
      "Choline for this reaction comes mainly from the circulation and from recycling of choline after acetylcholinesterase cleavage; when supply is short, membrane PC is mobilised. The conversation's chain from low SAM to less PEMT-PC to less choline to less vagal acetylcholine and gastric dysmotility is thus a possible but secondary route; dietary choline intake and transporter availability dominate ([[pathway:acetylcholine-synthesis]], [[system:vagal-tone]])."
    ],
    evidence: "established",
    facts: {
      gene: "CHAT",
      ec: "2.3.1.6",
      uniprot: "P28329",
      rhea: "RHEA:18821",
      reactome: "R-HSA-264622",
      kegg: "ec:2.3.1.6",
      compartment: "cytosol (cholinergic nerve terminals)",
      tissue: "cholinergic neurons, enteric neurons, placenta",
      cofactors: "none (acetyl-CoA co-substrate)"
    },
    relations: [
      { rel: "part-of", to: "pathway:acetylcholine-synthesis" },
      { rel: "associated-with", to: "system:vagal-tone", note: "acetylcholine is the vagal transmitter; choline supply plausibly limits output at the margin" },
      { rel: "associated-with", to: "state:gastric-dysmotility", note: "conversation-proposed: low choline/ACh slows gastric emptying; evidence indirect" }
    ],
    refs: ["article:blusztajn-2017-choline-brain", "article:zeisel-2009-choline-essential-nutrient"]
  },

  // ------------------------------------------------------------------ bile-acid conjugation
  {
    id: "enzyme:slc27a5",
    type: "enzyme",
    name: "Bile acid-CoA ligase (SLC27A5; BACS; FATP5)",
    aliases: ["SLC27A5", "BACS", "FATP5", "colato-CoA ligase", "ativação de ácidos biliares"],
    summary: "ER enzyme of hepatocytes that activates bile acids to their CoA thioesters, the obligatory first step before amino-acid conjugation.",
    body: [
      "SLC27A5 activates [[compound:cholate]] (and chenodeoxycholate) with ATP and [[compound:coa]] to give choloyl-CoA, AMP and pyrophosphate ([[reaction:bacs-cholate-coa-ligation]]). The CoA thioester is then conjugated with [[compound:glycine]] or [[compound:taurine]] by [[enzyme:baat]] ([[pathway:bile-acid-conjugation]]).",
      "It also re-activates bile acids that were deconjugated by gut bacteria and returned via the portal vein, so the enterohepatic cycle repeatedly re-conjugates them. It is a very-long-chain acyl-CoA synthetase family member that doubles as a fatty-acid transporter."
    ],
    evidence: "established",
    facts: {
      gene: "SLC27A5",
      ec: "6.2.1.7",
      uniprot: "Q9Y2P5",
      rhea: "RHEA:23532",
      reactome: "R-HSA-159425",
      kegg: "ec:6.2.1.7",
      compartment: "endoplasmic reticulum membrane",
      tissue: "liver",
      cofactors: "Mg-ATP; CoA"
    },
    relations: [
      { rel: "part-of", to: "pathway:bile-acid-conjugation" },
      { rel: "associated-with", to: "system:bile" }
    ],
    refs: ["article:hofmann-2008-bile-acids-biology", "article:chen-2023-statpearls-bile-acids"]
  },
  {
    id: "enzyme:baat",
    type: "enzyme",
    name: "Bile acid-CoA:amino acid N-acyltransferase (BAAT)",
    aliases: ["BAAT", "BAT", "BACAT", "conjugação biliar", "glicina N-colil-transferase"],
    summary: "Hepatic peroxisomal/cytosolic enzyme that conjugates choloyl-CoA with glycine or taurine; the glycine:taurine ratio of human bile is about 3:1.",
    body: [
      "BAAT transfers the bile acyl group from CoA to the amino group of [[compound:glycine]] ([[reaction:baat-glycine-conjugation]], giving [[compound:glycocholic-acid|glycocholate]]) or [[compound:taurine]] ([[reaction:baat-taurine-conjugation]], giving [[compound:taurocholic-acid|taurocholate]]). Human bile is predominantly glycine-conjugated (about three-quarters), but the ratio responds to the relative availability of the two amino acids and shifts toward taurine when taurine intake is high.",
      "Conjugation lowers the pKa of the bile acid so that it stays ionised and membrane-impermeant at intestinal pH ([[pathway:bile-acid-conjugation]]). The conversation suggests that an acute glycine load changes the glycine:taurine ratio and makes bile more irritant, favouring duodenogastric reflux and eructation. Hepatic glycine is not normally limiting for conjugation and a pronounced shift from oral glycine is unproven, so this link is conversation-only. Bacterial bile-salt hydrolases reverse the reaction in the gut ([[enzyme:bile-salt-hydrolase]])."
    ],
    evidence: "established",
    facts: {
      gene: "BAAT",
      ec: "2.3.1.65",
      uniprot: "Q14032",
      rhea: "RHEA:14001; RHEA:47100",
      reactome: "R-HSA-192312; R-HSA-159431",
      kegg: "ec:2.3.1.65",
      compartment: "peroxisome / cytosol",
      tissue: "liver",
      cofactors: "none"
    },
    relations: [
      { rel: "part-of", to: "pathway:bile-acid-conjugation" },
      { rel: "associated-with", to: "system:bile", note: "sets glycine/taurine conjugate composition of bile" },
      { rel: "interacts-with", to: "compound:taurine", note: "competes with glycine as acceptor amino acid" }
    ],
    refs: ["article:hofmann-2008-bile-acids-biology", "article:chiang-2013-bile-acid-metabolism-signaling"]
  },
  {
    id: "enzyme:bile-salt-hydrolase",
    type: "enzyme",
    name: "Bacterial bile salt hydrolase (BSH; choloylglycine hydrolase)",
    aliases: ["BSH", "bile salt hydrolase", "hidrolase de sais biliares", "desconjugação biliar", "colilglicina hidrolase"],
    summary: "Gut-bacterial amidase that deconjugates glycine- and taurine-conjugated bile acids, releasing free glycine or taurine in the intestinal lumen.",
    body: [
      "BSH is produced by many gut bacteria (Lactobacillus, Bifidobacterium, Bacteroides, Clostridium, Enterococcus). It hydrolyses the amide bond of [[compound:glycocholic-acid|glycocholate]] to [[compound:cholate]] and [[compound:glycine]] ([[reaction:bsh-glycocholate-deconjugation]]) or of taurocholate to cholate and [[compound:taurine]]. In health most deconjugation occurs in the distal ileum and colon.",
      "Bacterial overgrowth of the small intestine deconjugates bile acids too early, impairing fat micelle formation (a classical mechanism of fat malabsorption in [[disease:sibo]]) and releasing free glycine locally, which is a real, if small, luminal source of free glycine and thus a bridge to the proposed fermentation by upper-gut bacteria ([[pathway:gut-bacterial-glycine-fates]]). Taurine released is used by sulfate-reducing bacteria (e.g. Bilophila) to make hydrogen sulfide, a different gas."
    ],
    evidence: "established",
    facts: {
      gene: "bsh (cbh)",
      ec: "3.5.1.24",
      rhea: "RHEA:19353",
      kegg: "ec:3.5.1.24",
      compartment: "bacterial cytoplasm",
      tissue: "intestinal lumen (ileum, colon)",
      cofactors: "none"
    },
    relations: [
      { rel: "part-of", to: "pathway:bile-acid-conjugation", note: "reverses conjugation in the lumen" },
      { rel: "part-of", to: "pathway:gut-bacterial-glycine-fates", note: "releases free glycine from conjugates" },
      { rel: "associated-with", to: "system:gut-microbiota" },
      { rel: "associated-with", to: "disease:sibo", note: "early deconjugation is a classical SIBO finding" }
    ],
    refs: ["article:ridlon-2014-bile-acids-microbiome", "article:begley-2005-bacteria-and-bile"]
  },

  // ------------------------------------------------------------------ creatine
  {
    id: "enzyme:gatm",
    type: "enzyme",
    name: "Glycine amidinotransferase (GATM; AGAT)",
    aliases: ["GATM", "AGAT", "arginina:glicina amidinotransferase", "transamidinase", "primeiro passo da creatina"],
    summary: "Mitochondrial enzyme (kidney, pancreas) that transfers the amidino group of arginine to glycine, making guanidinoacetate and ornithine.",
    body: [
      "GATM (AGAT) catalyses the first and rate-limiting step of creatine synthesis: [[compound:arginine]] plus [[compound:glycine]] gives [[compound:guanidinoacetate]] and [[compound:ornithine]] ([[reaction:agat-guanidinoacetate-synthesis]]). In humans it is most active in the kidney, and the guanidinoacetate is carried to the liver where [[enzyme:gamt]] methylates it ([[pathway:creatine-synthesis]]). The reaction does not use SAM; the methyl cost comes at the next step.",
      "Creatine represses AGAT expression, so dietary creatine lowers endogenous synthesis (and thus glycine and SAM consumption). Creatine synthesis uses roughly one glycine and one methyl group per creatine; an adult makes on the order of 1 g creatine per day."
    ],
    evidence: "established",
    facts: {
      gene: "GATM",
      ec: "2.1.4.1",
      uniprot: "P50440",
      rhea: "RHEA:13201",
      reactome: "R-HSA-71275",
      kegg: "ec:2.1.4.1",
      compartment: "mitochondrial intermembrane space",
      tissue: "kidney (highest), pancreas, liver",
      cofactors: "none"
    },
    relations: [
      { rel: "part-of", to: "pathway:creatine-synthesis", note: "rate-limiting first step" },
      { rel: "interacts-with", to: "compound:creatine", note: "end-product repression of expression" },
      { rel: "decreases", to: "compound:glycine", note: "Glycine is the amidino acceptor; creatine synthesis is a continuing glycine sink." },
      { rel: "increases", to: "compound:guanidinoacetate" }
    ],
    refs: ["article:brosnan-2007-creatine-review"]
  },
  {
    id: "enzyme:gamt",
    type: "enzyme",
    name: "Guanidinoacetate N-methyltransferase (GAMT)",
    aliases: ["GAMT", "guanidinoacetato N-metiltransferase", "síntese de creatina", "consumo de metil pela creatina"],
    summary: "Hepatic SAM-dependent methyltransferase that converts guanidinoacetate to creatine, one of the largest consumers of methyl groups.",
    body: [
      "GAMT methylates [[compound:guanidinoacetate]] with [[compound:sam]] to form [[compound:creatine]] and [[compound:sah]] ([[reaction:gamt-creatine-synthesis]]). It is highly expressed in liver and pancreas, with the guanidinoacetate coming from kidney [[enzyme:gatm]] ([[pathway:creatine-synthesis]]). GAMT deficiency is a cerebral creatine deficiency syndrome.",
      "Estimates of how much of the body's SAM-derived methyl flux goes to creatine range from a minority to the majority; classical figures (Mudd and Poole, ~70%) were revised downward when dietary creatine was taken into account, while later work still supports a large share. Together with [[enzyme:pemt]] and [[enzyme:gnmt]] it defines the methyl budget ([[pathway:methyl-budget]]); creatine supplementation reduces demand on this route."
    ],
    evidence: "established",
    facts: {
      gene: "GAMT",
      ec: "2.1.1.2",
      uniprot: "Q14353",
      rhea: "RHEA:10656",
      reactome: "R-HSA-71286",
      kegg: "ec:2.1.1.2",
      compartment: "cytosol",
      tissue: "liver (major), pancreas, kidney",
      cofactors: "none (SAM co-substrate)"
    },
    relations: [
      { rel: "part-of", to: "pathway:creatine-synthesis" },
      { rel: "part-of", to: "pathway:methyl-budget", note: "large SAM consumer; share debated" },
      { rel: "associated-with", to: "state:undermethylation", note: "consumes SAM; creatine supplementation spares methyl groups (plausible)" },
      {
        rel: "decreases",
        to: "compound:sam",
        note: "One SAM per creatine made; creatine synthesis is one of the largest methyl sinks (share debated).",
        claim: "claim:gnmt-methyl-sink-valve",
        strength: "strong"
      },
      { rel: "increases", to: "compound:sah", note: "Co-product of the methylation of guanidinoacetate." },
      { rel: "increases", to: "compound:creatine" }
    ],
    refs: ["article:brosnan-2007-creatine-review"]
  },

  // ------------------------------------------------------------------ TMA / TMAO
  {
    id: "enzyme:cutc",
    type: "enzyme",
    name: "Choline trimethylamine-lyase (CutC/CutD)",
    aliases: ["CutC", "CutD", "colina TMA-liase", "TMA liase", "formação de TMA", "choline TMA-lyase"],
    summary: "Glycyl-radical enzyme of anaerobic gut bacteria that cleaves choline into trimethylamine and acetaldehyde, the precursor of host TMAO.",
    body: [
      "CutC is a glycyl-radical enzyme, activated by the radical-SAM enzyme CutD, found in many anaerobic gut bacteria (Desulfovibrio, Proteus, Klebsiella, Clostridium and others). It cleaves a carbon-nitrogen bond of [[compound:choline]] to give [[compound:trimethylamine]] and [[compound:acetaldehyde]] ([[reaction:choline-tma-lyase]]). Free choline reaching the colon, from large supplement doses or phosphatidylcholine-rich meals, is the substrate.",
      "TMA is absorbed, oxidised in liver by [[enzyme:fmo3]] to [[compound:tmao]] ([[pathway:tma-tmao-axis]]), and in FMO3 deficiency escapes as the odorant causing trimethylaminuria ([[disease:trimethylaminuria]]). The conversation raises this as a reason not to exceed ~3.5 g/day choline; that limit is consistent with the Tolerable Upper Intake Level, which was set on fishy odour, hypotension and GI effects. The related Stickland betaine reductase of Clostridia can similarly convert betaine to TMA."
    ],
    evidence: "established",
    facts: {
      gene: "cutC; cutD (activase)",
      ec: "4.3.99.4",
      uniprot: "Q30W70 (CutC, Oleidesulfovibrio alaskensis); Q30W71 (CutD)",
      rhea: "RHEA:35095",
      kegg: "ec:4.3.99.4",
      compartment: "bacterial cytoplasm",
      tissue: "colonic and distal small-intestinal lumen",
      cofactors: "glycyl radical; CutD radical-SAM (SAM)"
    },
    relations: [
      { rel: "part-of", to: "pathway:tma-tmao-axis" },
      { rel: "associated-with", to: "system:gut-microbiota" },
      { rel: "associated-with", to: "disease:trimethylaminuria", note: "supplies TMA that FMO3-deficient people cannot oxidise" }
    ],
    refs: ["article:craciun-2012-choline-tma-glycyl-radical"]
  },
  {
    id: "enzyme:fmo3",
    type: "enzyme",
    name: "Flavin-containing monooxygenase 3 (FMO3)",
    aliases: ["FMO3", "flavina monooxigenase 3", "trimetilamina monooxigenase", "oxidação de TMA", "TMAU"],
    summary: "Hepatic ER flavoenzyme that N-oxidises dietary- and gut-derived trimethylamine to odourless TMAO.",
    body: [
      "FMO3 oxidises [[compound:trimethylamine]] with NADPH and oxygen to [[compound:tmao]] ([[reaction:fmo3-tma-n-oxidation]]); this detoxifies the volatile, fishy-smelling amine ([[pathway:tma-tmao-axis]]). It is the dominant adult liver FMO and also oxidises many xenobiotics (e.g. nicotine, sulindac sulfide); expression is low in neonates and modulated by sex hormones.",
      "Loss-of-function variants cause trimethylaminuria ([[disease:trimethylaminuria]]); high choline, carnitine or betaine intake then aggravates odour. TMAO is also associated epidemiologically with atherosclerosis and kidney disease, though causality is still debated; the conversation's description of TMAO as a 'strong marker of endothelial stress' reflects this contested literature."
    ],
    evidence: "established",
    facts: {
      gene: "FMO3",
      ec: "1.14.13.148",
      uniprot: "P31513",
      rhea: "RHEA:31979",
      reactome: "R-HSA-139970",
      kegg: "ec:1.14.13.148",
      compartment: "endoplasmic reticulum",
      tissue: "liver",
      cofactors: "FAD; NADPH; O2"
    },
    relations: [
      { rel: "part-of", to: "pathway:tma-tmao-axis" },
      { rel: "associated-with", to: "disease:trimethylaminuria", note: "FMO3 deficiency is the cause" }
    ],
    refs: ["article:mackay-2011-trimethylaminuria", "article:zeisel-2017-tmao-review"]
  },

  // ------------------------------------------------------------------ bacterial glycine fates (proposed)
  {
    id: "enzyme:bacterial-glycine-reductase",
    type: "enzyme",
    name: "Bacterial glycine reductase (Stickland reaction; GrdABCDE)",
    aliases: ["glicina redutase", "via de Stickland", "GrdA", "GrdB", "fermentação de Stickland", "glycine reductase complex"],
    summary: "Selenium-dependent complex in some anaerobic Clostridia that reductively deaminates glycine to acetyl phosphate and ammonia as a Stickland electron acceptor.",
    body: [
      "Glycine reductase is a multi-protein selenoprotein system (GrdA, GrdB, GrdC/D, GrdE) in Clostridia such as Acetoanaerobium sticklandii and Peptoclostridium acidaminophilum. It couples reductive deamination of [[compound:glycine]] with thioredoxin oxidation, yielding [[compound:acetyl-phosphate]] and [[compound:ammonia]] ([[reaction:bacterial-glycine-reductase]]); acetyl phosphate then supports substrate-level ATP formation. In Stickland fermentation glycine, proline or sarcosine/betaine serve as electron acceptors, with other amino acids as donors; the oxidation of those donors, not the glycine reduction, is what releases CO2.",
      "The conversation proposes that upper-gut bacteria (SIBO) rapidly ferment oral free glycine to CO2 and NH3 'via glycine decarboxylase or Stickland pathways', producing belching within 15-45 minutes. This is only partially consistent with the biochemistry: glycine reductase yields ammonia and acetyl phosphate but not CO2, and the organisms carrying it are strict anaerobes more typical of the colon. The step is therefore marked plausible at the level of bacterial capability and speculative as a cause of eructation in people ([[pathway:gut-bacterial-glycine-fates]])."
    ],
    evidence: "plausible",
    facts: {
      gene: "grdA; grdB; grdC; grdD; grdE",
      ec: "1.21.4.2",
      uniprot: "P26971 (GrdA, Acetoanaerobium sticklandii)",
      rhea: "RHEA:12232",
      kegg: "ec:1.21.4.2",
      compartment: "bacterial cytoplasm",
      tissue: "anaerobic gut lumen (colon > small intestine)",
      cofactors: "selenocysteine; pyruvoyl group; thioredoxin system"
    },
    relations: [
      { rel: "part-of", to: "pathway:gut-bacterial-glycine-fates" },
      { rel: "associated-with", to: "system:gut-microbiota", note: "present in some anaerobic Clostridia" },
      { rel: "associated-with", to: "outcome:belching", note: "conversation-only: proposed contribution to upper-gut gas after oral glycine; no direct evidence" }
    ]
  },
  {
    id: "enzyme:bacterial-glycine-cleavage-system",
    type: "enzyme",
    name: "Bacterial glycine cleavage system (GcvP/GcvT/GcvH/Lpd)",
    aliases: ["glicina descarboxilase bacteriana", "GcvP", "GcvT", "sistema de clivagem da glicina bacteriano", "glycine decarboxylase"],
    summary: "Bacterial homologue of the mitochondrial glycine cleavage system that oxidises glycine to CO2, NH3 and a folate one-carbon unit; typically anabolic.",
    body: [
      "Many bacteria, including enteric species, carry the same four-protein glycine cleavage system as mitochondria: a PLP-dependent decarboxylase GcvP, aminomethyltransferase GcvT, lipoyl carrier GcvH and dihydrolipoamide dehydrogenase Lpd. It converts [[compound:glycine]], [[compound:thf]] and [[compound:nad]] into [[compound:carbon-dioxide]], [[compound:ammonia]], [[compound:5-10-methylene-thf]] and [[compound:nadh]] ([[reaction:bacterial-glycine-cleavage]]). In most bacteria its role is to supply one-carbon units for biosynthesis.",
      "This is the real enzymatic basis of the conversation's 'bacterial glycine decarboxylase' that releases CO2 and NH3, but it is an aerobic or facultative-bacterial anabolic enzyme rather than a gas-generating fermentation of free glycine, and strict-anaerobe SIBO flora are not known to run it at a rate that would explain rapid belching. Its presence in the small bowel is plausible; its quantitative effect is speculative ([[pathway:gut-bacterial-glycine-fates]])."
    ],
    evidence: "plausible",
    facts: {
      gene: "gcvP; gcvT; gcvH; lpdA",
      ec: "1.4.4.2; 2.1.2.10; 1.8.1.4",
      uniprot: "P33195 (GcvP, Escherichia coli K-12)",
      kegg: "ec:1.4.4.2",
      compartment: "bacterial cytoplasm",
      tissue: "enteric bacteria in the gut lumen",
      cofactors: "PLP; lipoate; FAD; NAD+; folate"
    },
    relations: [
      { rel: "part-of", to: "pathway:gut-bacterial-glycine-fates" },
      { rel: "interacts-with", to: "enzyme:gldc", note: "homologous to the human mitochondrial system" },
      { rel: "associated-with", to: "disease:sibo", note: "conversation-only: proposed fermentation of free glycine by overgrown small-bowel bacteria" }
    ]
  },

  // ------------------------------------------------------------------ glutathione
  {
    id: "enzyme:glutamate-cysteine-ligase",
    type: "enzyme",
    name: "Glutamate-cysteine ligase (GCLC/GCLM; gamma-glutamylcysteine synthetase)",
    aliases: ["GCLC", "GCLM", "gama-glutamilcisteína sintetase", "GCL", "etapa limitante da glutationa"],
    summary: "Rate-limiting enzyme of glutathione synthesis; ligates glutamate and cysteine to gamma-glutamylcysteine with ATP, feedback-inhibited by GSH.",
    body: [
      "GCL is a heterodimer of a catalytic subunit (GCLC) and a modifier subunit (GCLM) that lowers the Km for glutamate and the sensitivity to feedback. It forms gamma-glutamylcysteine from [[compound:glutamate]], [[compound:cysteine]] and [[compound:atp]] ([[reaction:gcl-gamma-glutamylcysteine-synthesis]]). Cysteine availability, supplied in part by transsulfuration ([[enzyme:cth]]), and feedback inhibition by [[compound:glutathione]] limit its flux; transcription is induced by NRF2 in oxidative stress.",
      "Glutamate and cysteine both rise when the cell is flooded by methionine; the connection to methylation is that [[enzyme:cbs]] diverts homocysteine to cysteine and thereby to glutathione ([[pathway:glutathione-synthesis]], [[pathway:transsulfuration]]). Buthionine sulfoximine is the classical experimental inhibitor."
    ],
    evidence: "established",
    facts: {
      gene: "GCLC; GCLM",
      ec: "6.3.2.2",
      uniprot: "P48506; P48507",
      rhea: "RHEA:13285",
      kegg: "ec:6.3.2.2",
      compartment: "cytosol",
      tissue: "ubiquitous (liver highest)",
      cofactors: "Mg-ATP"
    },
    relations: [
      { rel: "part-of", to: "pathway:glutathione-synthesis", note: "rate-limiting step" },
      { rel: "interacts-with", to: "compound:glutathione", note: "feedback inhibition" }
    ],
    refs: ["article:sekhar-2011-glynac-glutathione", "article:rhea-2022"]
  },
  {
    id: "enzyme:gss",
    type: "enzyme",
    name: "Glutathione synthetase (GSS)",
    aliases: ["GSS", "glutationa sintetase", "GSH sintetase", "síntese de glutationa"],
    summary: "Cytosolic ATP-grasp ligase that adds glycine to gamma-glutamylcysteine, completing glutathione; glycine can be limiting when supply is short.",
    body: [
      "GSS adds [[compound:glycine]] to gamma-glutamylcysteine with [[compound:atp]], forming [[compound:glutathione]] ([[reaction:gss-glutathione-synthesis]], [[pathway:glutathione-synthesis]]). Unlike the first step it is not feedback-regulated. The Km for glycine is within the range of cellular glycine, and experimental work in glycine-depleted older adults suggests that glycine (together with cysteine) can be rate-limiting for GSH, which is the rationale for glycine/NAC supplementation.",
      "That is one reason low endogenous glycine production (about 3 g/day, with a shortfall that Meléndez-Hevia and colleagues put near 10 g/day) matters for the conversation's goal of supplementing glycine ([[article:melendez-hevia-2009-glycine-weak-link]]), and why glycine obtained intracellularly from choline or serine does not touch the gut lumen yet still feeds this step. GSS deficiency causes 5-oxoprolinuria."
    ],
    evidence: "established",
    facts: {
      gene: "GSS",
      ec: "6.3.2.3",
      uniprot: "P48637",
      rhea: "RHEA:13557",
      reactome: "R-HSA-5602901",
      kegg: "ec:6.3.2.3",
      compartment: "cytosol",
      tissue: "ubiquitous (liver highest)",
      cofactors: "Mg-ATP"
    },
    relations: [
      { rel: "part-of", to: "pathway:glutathione-synthesis" },
      { rel: "interacts-with", to: "compound:glycine", note: "glycine can be limiting for GSH when supply is short (plausible)" }
    ],
    refs: ["article:melendez-hevia-2009-glycine-weak-link"]
  },

  // ------------------------------------------------------------------ collagen
  {
    id: "enzyme:p4ha1",
    type: "enzyme",
    name: "Prolyl 4-hydroxylase alpha-1 (P4HA1; collagen prolyl hydroxylase)",
    aliases: ["P4HA1", "prolil 4-hidroxilase", "P4H", "hidroxilação da prolina", "vitamina C e colágeno"],
    summary: "Ascorbate-dependent ER dioxygenase that hydroxylates proline residues of procollagen to 4-hydroxyproline, essential for triple-helix stability.",
    body: [
      "P4HA1 is the catalytic subunit of the alpha-2/beta-2 prolyl 4-hydroxylase of the endoplasmic reticulum. It converts peptidyl-[[compound:proline]] in Xaa-Pro-Gly triplets to 4-[[compound:hydroxyproline]] using 2-oxoglutarate, molecular oxygen and Fe2+, with ascorbate required to keep the iron reduced ([[reaction:p4h-prolyl-hydroxylation]]). Hydroxyproline raises the melting temperature of the collagen triple helix; without it (scurvy, severe vitamin C deficiency) collagen is unstable.",
      "Roughly 10% of collagen residues are hydroxyproline and a third are glycine in the repeating Gly-X-Y motif, which is why collagen turnover is a large, long-term sink of glycine and why the conversation emphasises collagen peptides as glycine- and proline-rich ([[pathway:collagen-synthesis]], [[compound:collagen]]). Hydroxyproline released by degradation is excreted or oxidised and is not re-used for collagen."
    ],
    evidence: "established",
    facts: {
      gene: "P4HA1",
      ec: "1.14.11.2",
      uniprot: "P13674",
      rhea: "RHEA:18945",
      reactome: "R-HSA-1650808",
      kegg: "ec:1.14.11.2",
      compartment: "endoplasmic reticulum lumen",
      tissue: "fibroblasts, chondrocytes, osteoblasts, ubiquitous",
      cofactors: "Fe2+; 2-oxoglutarate; O2; ascorbate"
    },
    relations: [
      { rel: "part-of", to: "pathway:collagen-synthesis" },
      { rel: "interacts-with", to: "compound:collagen", note: "modifies procollagen chains" }
    ],
    refs: ["article:rahimi-2026-statpearls-collagen-synthesis", "article:shoulders-2009-collagen-structure"]
  },

  // ------------------------------------------------------------------ serine route
  {
    id: "enzyme:phgdh",
    type: "enzyme",
    name: "D-3-phosphoglycerate dehydrogenase (PHGDH)",
    aliases: ["PHGDH", "3-fosfoglicerato desidrogenase", "biossíntese de serina"],
    summary: "NAD+-dependent first committed enzyme of the serine synthesis pathway; oxidises 3-phosphoglycerate to 3-phosphohydroxypyruvate.",
    body: [
      "PHGDH diverts the glycolytic intermediate [[compound:3-phosphoglycerate]] into serine synthesis by oxidising it with [[compound:nad]] to [[compound:3-phosphohydroxypyruvate]] ([[reaction:phgdh-3pg-oxidation]]). It is subject to serine feedback inhibition and is amplified in some cancers. Followed by [[enzyme:psat1]] and [[enzyme:psph]] it gives L-serine, the precursor of glycine through [[enzyme:shmt1]]/[[enzyme:shmt2]] ([[pathway:glycine-serine-route]]).",
      "Serine synthesis is the main endogenous source of glycine carbon; the net synthesis capacity (~3 g glycine/day) is the quantitative starting point of the 'glycine is a weak link' argument ([[article:melendez-hevia-2009-glycine-weak-link]])."
    ],
    evidence: "established",
    facts: {
      gene: "PHGDH",
      ec: "1.1.1.95",
      uniprot: "O43175",
      rhea: "RHEA:12641",
      reactome: "R-HSA-977348",
      kegg: "ec:1.1.1.95",
      compartment: "cytosol",
      tissue: "liver, brain (astrocytes), kidney",
      cofactors: "NAD+"
    },
    relations: [
      { rel: "part-of", to: "pathway:glycine-serine-route" },
      { rel: "interacts-with", to: "enzyme:psat1", note: "next step" }
    ],
    refs: ["article:melendez-hevia-2009-glycine-weak-link"]
  },
  {
    id: "enzyme:psat1",
    type: "enzyme",
    name: "Phosphoserine aminotransferase 1 (PSAT1)",
    aliases: ["PSAT1", "fosfoserina aminotransferase", "PSAT", "fosfosserina aminotransferase"],
    summary: "PLP-dependent transaminase of the serine pathway that converts 3-phosphohydroxypyruvate and glutamate into 3-phosphoserine.",
    body: [
      "PSAT1 transfers the amino group of [[compound:glutamate]] onto [[compound:3-phosphohydroxypyruvate]], yielding [[compound:3-phosphoserine]] and [[compound:2-oxoglutarate]] ([[reaction:psat1-phosphoserine-transamination]]). Written in the direction of serine synthesis the equilibrium is nearly neutral and pulled forward by [[enzyme:psph]].",
      "As a pyridoxal-phosphate enzyme ([[compound:plp]]) it is one more B6-dependent step in glycine and serine supply, in addition to [[enzyme:shmt1]], [[enzyme:shmt2]] and [[enzyme:gldc]] ([[pathway:glycine-serine-route]], [[state:b6-functional-deficiency]]). PSAT1 deficiency causes Neu-Laxova-spectrum serine deficiency."
    ],
    evidence: "established",
    facts: {
      gene: "PSAT1",
      ec: "2.6.1.52",
      uniprot: "Q9Y617",
      rhea: "RHEA:14329",
      kegg: "ec:2.6.1.52",
      compartment: "cytosol",
      tissue: "liver, brain, kidney",
      cofactors: "PLP"
    },
    relations: [
      { rel: "part-of", to: "pathway:glycine-serine-route" },
      { rel: "interacts-with", to: "compound:plp", note: "pyridoxal phosphate cofactor" },
      { rel: "associated-with", to: "state:b6-functional-deficiency", note: "PLP-dependent" }
    ],
    refs: ["article:mattaini-2016-serine-metabolism"]
  },
  {
    id: "enzyme:psph",
    type: "enzyme",
    name: "Phosphoserine phosphatase (PSPH)",
    aliases: ["PSPH", "fosfoserina fosfatase", "PSP", "fosfosserina fosfatase"],
    summary: "Mg2+-dependent phosphatase that hydrolyses 3-phosphoserine to serine, the irreversible final step of serine synthesis.",
    body: [
      "PSPH removes the phosphate from [[compound:3-phosphoserine]] to give [[compound:serine]] and [[compound:phosphate]] ([[reaction:psph-phosphoserine-hydrolysis]]). This irreversible step drives the whole route from [[enzyme:phgdh]] onward and is inhibited by serine.",
      "Serine formed here is used for protein, phospholipid (phosphatidylserine, sphingolipids) and one-carbon metabolism, and converted to glycine by SHMT ([[pathway:glycine-serine-route]])."
    ],
    evidence: "established",
    facts: {
      gene: "PSPH",
      ec: "3.1.3.3",
      uniprot: "P78330",
      rhea: "RHEA:21208",
      kegg: "ec:3.1.3.3",
      compartment: "cytosol",
      tissue: "liver, brain, kidney",
      cofactors: "Mg2+"
    },
    relations: [
      { rel: "part-of", to: "pathway:glycine-serine-route", note: "irreversible last step" },
      { rel: "interacts-with", to: "enzyme:psat1", note: "previous step" }
    ],
    refs: ["article:mattaini-2016-serine-metabolism"]
  },
  {
    id: "enzyme:glycine-cleavage-system",
    type: "enzyme",
    name: "Glycine cleavage system (GCS; glycine decarboxylase complex)",
    aliases: ["GCS", "glycine cleavage complex", "glycine decarboxylase complex", "sistema de clivagem da glicina", "complexo da glicina descarboxilase"],
    summary: "Mitochondrial four-protein complex (GLDC, AMT, GCSH, DLD) that degrades glycine to CO2, ammonia and 5,10-methylene-THF; the main route of glycine catabolism in liver.",
    body: [
      "The complex is made of the P protein [[enzyme:gldc]] (PLP-dependent decarboxylase), the lipoate-carrying H protein [[enzyme:gcsh]], the folate-binding T protein [[enzyme:amt]] and the L protein [[enzyme:dld]] (lipoamide dehydrogenase, NAD+-dependent). Together they run [[reaction:glycine-cleavage-system]], so the system needs three cofactors that nutrition can limit: [[compound:plp]], lipoate and [[compound:thf]].",
      "It is the main sink for surplus glycine and a source of [[compound:5-10-methylene-thf]] in mitochondria, linking glycine to the folate pool. Loss of its function causes [[disease:nonketotic-hyperglycinemia]], where glycine accumulates in brain; this rare inborn error is why supplemental glycine is avoided in that disease. In tracer studies of five healthy men and women, glycine decarboxylation accounted for roughly 39% of whole-body glycine flux ([[article:lamers-2007-glycine-flux]]), far more than methylation by GNMT is thought to contribute."
    ],
    evidence: "established",
    facts: {
      gene: "GLDC; AMT; GCSH; DLD",
      ec: "1.4.4.2; 2.1.2.10; 1.8.1.4",
      reactome: "R-HSA-5693967",
      compartment: "mitochondrial matrix",
      tissue: "liver, kidney, brain",
      cofactors: "PLP (P protein); lipoate (H protein); THF (T protein); FAD and NAD+ (L protein)"
    },
    relations: [
      { rel: "catalyzes", to: "reaction:glycine-cleavage-system" },
      { rel: "part-of", to: "pathway:glycine-cleavage" },
      { rel: "decreases", to: "compound:glycine", note: "Main catabolic route" },
      { rel: "increases", to: "compound:5-10-methylene-thf", note: "Provides one-carbon units to the folate pool" },
      { rel: "increases", to: "compound:carbon-dioxide" }
    ],
    refs: ["article:kikuchi-2008-glycine-cleavage-system", "article:reactome-glycine-degradation", "article:applegarth-2004-glycine-encephalopathy"]
  },
  {
    id: "enzyme:shmt",
    type: "enzyme",
    name: "Serine hydroxymethyltransferase (SHMT; SHMT1 and SHMT2)",
    aliases: ["SHMT", "serina hidroximetiltransferase", "SHMT1/SHMT2"],
    summary: "Family-level entry for the PLP-dependent enzyme interconverting serine with glycine while moving one carbon to or from THF; cytosolic SHMT1 and mitochondrial SHMT2.",
    body: [
      "SHMT transfers the hydroxymethyl carbon of [[compound:serine]] to [[compound:thf]], giving [[compound:glycine]] and [[compound:5-10-methylene-thf]] ([[reaction:shmt-serine-glycine-interconversion]]). The cytosolic isoform is [[enzyme:shmt1]] and the mitochondrial isoform is [[enzyme:shmt2]]; this page covers what is common to both, and the isoform pages give gene, tissue and compartment detail.",
      "The reaction needs [[compound:plp]], so glycine and serine handling follows vitamin B6 status. Serine to glycine is the dominant source of glycine in the body, which makes SHMT the usual starting point for estimates of how much glycine the body can make ([[article:melendez-hevia-2009-glycine-weak-link]])."
    ],
    evidence: "established",
    facts: {
      gene: "SHMT1; SHMT2",
      ec: "2.1.2.1",
      rhea: "RHEA:15481",
      reactome: "R-HSA-200651",
      compartment: "cytosol (SHMT1); mitochondrial matrix (SHMT2)",
      cofactors: "PLP; THF (substrate)"
    },
    relations: [
      { rel: "catalyzes", to: "reaction:shmt-serine-glycine-interconversion" },
      { rel: "part-of", to: "pathway:folate-cycle" },
      { rel: "part-of", to: "pathway:glycine-serine-route" },
      { rel: "increases", to: "compound:glycine", note: "Main endogenous source, from serine" },
      { rel: "decreases", to: "compound:serine" },
      { rel: "increases", to: "compound:5-10-methylene-thf", note: "Carries the serine beta-carbon into the folate pool." }
    ],
    refs: ["article:reactome-folate-pterine-metabolism", "article:parra-2018-vitamin-b6-metabolism"]
  },
  {
    id: "enzyme:gad",
    type: "enzyme",
    name: "Glutamate decarboxylase (GAD; GAD65 and GAD67)",
    aliases: ["GAD", "glutamato descarboxilase", "GAD65/GAD67"],
    summary: "Family-level entry for the PLP-dependent enzyme converting glutamate to GABA; two isoforms, GAD1 (GAD67) and GAD2 (GAD65), differ in cofactor saturation and regulation.",
    body: [
      "GAD decarboxylates [[compound:glutamate]] to [[compound:gaba]] and CO2 using [[compound:plp]] as cofactor ([[reaction:gad-glutamate-decarboxylation]]). [[enzyme:gad1]] (GAD67) is mostly saturated with PLP and supplies baseline GABA, while [[enzyme:gad2]] (GAD65) is largely present as the cofactor-free apoenzyme and responds to PLP availability and demand.",
      "Because both isoforms need PLP, severe B6 deficiency lowers brain GABA and can cause seizures. Whether milder low B6 status changes mood or anxiety is plausible but not shown; the review by Petroff describes the neurochemistry rather than any treatment effect."
    ],
    evidence: "established",
    facts: {
      gene: "GAD1; GAD2",
      ec: "4.1.1.15",
      rhea: "RHEA:17785",
      compartment: "cytosol; synaptic vesicle membrane (GAD65)",
      cofactors: "PLP"
    },
    relations: [
      { rel: "catalyzes", to: "reaction:gad-glutamate-decarboxylation" },
      { rel: "part-of", to: "pathway:gaba-shunt" },
      { rel: "increases", to: "compound:gaba", note: "Rate-controlling synthesis step" },
      { rel: "decreases", to: "compound:glutamate" }
    ],
    refs: ["article:erlander-1991-two-gad-genes", "article:battaglioli-2003-gad-isoform-kinetics", "article:petroff-2002-gaba-glutamate"]
  },
  {
    id: "enzyme:mat",
    type: "enzyme",
    name: "Methionine adenosyltransferase (MAT; SAM synthetase)",
    aliases: ["MAT", "SAM synthetase", "metionina adenosiltransferase", "SAMe sintetase", "MAT I/II/III"],
    summary: "Family-level entry for the enzyme that makes SAM from methionine and ATP; liver MAT1A (MAT I/III) and extrahepatic MAT2A (MAT II) share the reaction and Mg-ATP requirement.",
    body: [
      "MAT forms [[compound:sam]] from [[compound:methionine]] and [[compound:atp]], releasing [[compound:phosphate]] and [[compound:pyrophosphate]] ([[reaction:mat-sam-synthesis]]). Two genes encode the catalytic subunits: [[enzyme:mat1a]] in adult liver and [[enzyme:mat2a]] in other tissues, with regulatory differences in affinity for methionine and sensitivity to SAM.",
      "The real substrate is Mg-ATP, so [[compound:magnesium]] is an obligatory cofactor. SAM synthesis is the first step of the methylation cycle and its rate sets the pool from which GNMT, PEMT and creatine synthesis draw ([[pathway:methyl-budget]])."
    ],
    evidence: "established",
    facts: {
      gene: "MAT1A; MAT2A (regulatory MAT2B)",
      ec: "2.5.1.6",
      rhea: "RHEA:21080",
      reactome: "R-HSA-174391",
      compartment: "cytosol",
      cofactors: "Mg2+ and K+ (substrate is Mg-ATP)"
    },
    relations: [
      { rel: "catalyzes", to: "reaction:mat-sam-synthesis" },
      { rel: "part-of", to: "pathway:methionine-cycle" },
      { rel: "increases", to: "compound:sam" },
      { rel: "decreases", to: "compound:methionine" }
    ],
    refs: ["article:mato-2008-methionine-metabolism-liver", "article:reactome-sulfur-amino-acid-metabolism"]
  },
  {
    id: "enzyme:nnmt",
    type: "enzyme",
    name: "Nicotinamide N-methyltransferase (NNMT)",
    aliases: ["NNMT", "nicotinamida N-metiltransferase", "nicotinamide methyltransferase"],
    summary: "SAM-dependent cytosolic enzyme that methylates nicotinamide to 1-methylnicotinamide, clearing excess vitamin B3 and acting as a modest methyl sink.",
    body: [
      "NNMT transfers a methyl group from [[compound:sam]] to [[compound:nicotinamide]], forming [[compound:1-methylnicotinamide]] and [[compound:sah]]. The methylated product is excreted in urine; its excretion rises when nicotinamide or niacin intake is high, which is the biochemical basis for the idea that large [[compound:niacin]] doses consume methyl groups.",
      "Pissios reviews NNMT as more than a clearance enzyme: its level in adipose tissue and some tumours changes the SAM:SAH balance and epigenetic marks. How much NNMT-mediated methyl loss matters at supplemental B3 doses in humans is not established; animal and high-dose data are the main support for the concern ([[claim:niacin-drains-methyl-groups]])."
    ],
    evidence: "established",
    facts: {
      gene: "NNMT",
      ec: "2.1.1.1",
      uniprot: "P40261",
      compartment: "cytosol",
      tissue: "liver (highest), adipose tissue, kidney; overexpressed in several cancers",
      cofactors: "SAM (methyl donor)"
    },
    relations: [
      { rel: "increases", to: "compound:1-methylnicotinamide" },
      { rel: "increases", to: "compound:sah", note: "Co-product of every methylation" },
      { rel: "decreases", to: "compound:sam", note: "Methyl donor consumed", claim: "claim:niacin-drains-methyl-groups", strength: "weak" },
      { rel: "decreases", to: "compound:nicotinamide" },
      { rel: "part-of", to: "pathway:methyl-budget", note: "One of several SAM sinks; relative size in humans is uncertain" }
    ],
    refs: ["article:pissios-2017-nnmt-methyl-sink"]
  },
  {
    id: "enzyme:carns1",
    type: "enzyme",
    name: "Carnosine synthase 1 (CARNS1; ATPGD1)",
    aliases: ["CARNS1", "ATPGD1", "carnosina sintase", "carnosina sintetase"],
    summary: "ATP-grasp ligase that joins beta-alanine and L-histidine into carnosine (and GABA plus histidine into homocarnosine, less efficiently); beta-alanine supply limits it.",
    body: [
      "CARNS1 builds the dipeptide [[compound:carnosine]] from [[compound:beta-alanine]], [[compound:histidine]] and [[compound:atp]], releasing [[compound:adp]] and phosphate ([[reaction:carns1-carnosine-synthesis]]). It prefers beta-alanine over GABA by a factor of 15-25 in catalytic efficiency ([[article:drozak-2010-carnosine-synthase-atpgd1]]).",
      "Because histidine is usually plentiful and beta-alanine is scarce, beta-alanine availability controls how much carnosine tissues can make; this is the reason beta-alanine rather than carnosine itself is the usual supplement ([[intervention:beta-alanine-supplement]], [[article:boldyrev-2013-carnosine-physiology]])."
    ],
    evidence: "established",
    facts: {
      gene: "CARNS1",
      ec: "6.3.2.11",
      uniprot: "A5YM72",
      rhea: "RHEA:19297",
      reactome: "R-HSA-6786245",
      kegg: "ec:6.3.2.11",
      compartment: "cytosol",
      tissue: "skeletal muscle, brain"
    },
    relations: [
      {
        rel: "associated-with",
        to: "intervention:beta-alanine-supplement",
        note: "Supplemental beta-alanine raises the substrate for this enzyme."
      }
    ],
    refs: ["article:drozak-2010-carnosine-synthase-atpgd1", "article:boldyrev-2013-carnosine-physiology"]
  },
  {
    id: "enzyme:tyms",
    type: "enzyme",
    name: "Thymidylate synthase (TYMS)",
    aliases: ["TYMS", "TS", "timidilato sintase", "timidilato sintetase"],
    summary: "Cytosolic enzyme that methylates dUMP with 5,10-methylene-THF to make dTMP and dihydrofolate; the only de novo source of thymine nucleotides for DNA.",
    body: [
      "TYMS transfers a methylene group from [[compound:5-10-methylene-thf]] to [[compound:dump]] and reduces it to a methyl group, producing [[compound:dtmp]] and [[compound:dhf]] ([[reaction:tyms-thymidylate-synthesis]]). Because it is the sole de novo route to thymine nucleotides, cell division depends on it ([[pathway:nucleotide-synthesis]]).",
      "It connects the dietary themes of this site to DNA: the folate pool that [[enzyme:shmt]], the glycine cleavage system and the choline-derived chain ([[enzyme:dmgdh]], [[enzyme:sardh]]) fill is drawn on here. Fluoropyrimidine and antifolate cancer drugs act on this step, which is why it is well characterised ([[article:carreras-1995-thymidylate-synthase]])."
    ],
    evidence: "established",
    facts: {
      gene: "TYMS",
      ec: "2.1.1.45",
      uniprot: "P04818",
      rhea: "RHEA:12104",
      reactome: "R-HSA-73605",
      kegg: "ec:2.1.1.45",
      compartment: "cytosol (and nucleus in S phase)",
      tissue: "proliferating tissues",
      cofactors: "5,10-methylene-THF (co-substrate)"
    },
    relations: [{ rel: "part-of", to: "pathway:nucleotide-synthesis" }],
    refs: ["article:carreras-1995-thymidylate-synthase", "article:ducker-2017-one-carbon-metabolism"]
  }
]
