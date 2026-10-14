// Literature layer for the simulation parameter research (agent B1): methionine cycle, folate cycle,
// transsulfuration, GNMT, MAT, BHMT, MTHFR, MS, CBS. Bibliographic fields were fetched from PubMed and
// the DOIs cross-checked with Crossref; takeaways are paraphrased. Where only the abstract was accessible this
// is stated in the takeaways. Not yet wired into data/index.js.
export default [
  {
    "id": "article:mudd-1975-labile-methyl-balances",
    "type": "article",
    "name": "Labile methyl balances for normal humans on various dietary regimens",
    "aliases": [
      "Mudd and Poole 1975"
    ],
    "summary": "Methyl-balance study in normal adults on controlled diets concluding methylneogenesis is normal and homocysteine cycles at least 1.5-1.9 times before cystathionine.",
    "evidence": "established",
    "authors": [
      "Mudd SH",
      "Poole JR"
    ],
    "year": 1975,
    "journal": "Metabolism: clinical and experimental",
    "doi": "10.1016/0026-0495(75)90040-2",
    "url": "https://doi.org/10.1016/0026-0495(75)90040-2",
    "pmid": "1128236",
    "verified": true,
    "takeaways": [
      "De novo methyl formation matters in normal diets and dominates when preformed methyl intake is low.",
      "Cycles through methionine per homocysteine rise to 3.0-3.9 on curtailed methyl intake."
    ],
    "facts": {
      "design": "cohort",
      "population": "Healthy young men and women on fixed diets"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:methyl-budget",
        "note": "Classic methyl-balance calculation."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:methionine-cycle"
      }
    ]
  },
  {
    "id": "article:finkelstein-1986-methionine-excess",
    "type": "article",
    "name": "Methionine metabolism in mammals. Adaptation to methionine excess",
    "aliases": [
      "Finkelstein and Martin 1986"
    ],
    "summary": "In rats, hepatic SAM and methionine rise only on a 3% methionine diet; BHMT, CBS and MAT rise and MS falls, so cystathionine synthesis rises 12-fold.",
    "evidence": "established",
    "authors": [
      "Finkelstein JD",
      "Martin JJ"
    ],
    "year": 1986,
    "journal": "The Journal of biological chemistry",
    "doi": "10.1016/s0021-9258(17)35979-3",
    "url": "https://doi.org/10.1016/s0021-9258(17)35979-3",
    "pmid": "3080429",
    "verified": true,
    "takeaways": [
      "SAH rises first (1.5% diet); SAM and methionine only at 3%.",
      "Betaine and serine in liver fall with a higher methionine diet.",
      "Modelled homocysteine disposal goes up 550% at 3%, mostly through CBS."
    ],
    "facts": {
      "design": "animal",
      "population": "Rats fed 0.3-3.0% methionine"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:methionine",
        "note": "Hepatic methionine buffering."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam"
      },
      {
        "rel": "evidence-for",
        "to": "pathway:transsulfuration"
      }
    ]
  },
  {
    "id": "article:cabrero-1987-mat-forms-rat-liver",
    "type": "article",
    "name": "Purification and comparison of two forms of S-adenosyl-L-methionine synthetase from rat liver",
    "aliases": [
      "Cabrero 1987"
    ],
    "summary": "The two rat-liver SAM synthetase forms are built from similar subunits yet regulated differently: high-Mr form inhibited by SAM, low-Mr form activated or inhibited depending on dose.",
    "evidence": "established",
    "authors": [
      "Cabrero C",
      "Puerta J",
      "Alemany S"
    ],
    "year": 1987,
    "journal": "European journal of biochemistry",
    "doi": "10.1111/j.1432-1033.1987.tb13699.x",
    "url": "https://doi.org/10.1111/j.1432-1033.1987.tb13699.x",
    "pmid": "3121322",
    "verified": true,
    "takeaways": [
      "High-molecular-mass form is a tetramer inhibited by SAM and pyrophosphate.",
      "Low-molecular-mass dimer is dose-dependently activated or inhibited by SAM.",
      "Specific activities differ at physiological methionine."
    ],
    "facts": {
      "design": "in-vitro",
      "population": "Rat liver enzymes"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:mat1a",
        "note": "Oligomer-dependent regulation by SAM."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam"
      }
    ]
  },
  {
    "id": "article:storch-1988-methionine-cycle-humans",
    "type": "article",
    "name": "Quantitative study in vivo of methionine cycle in humans using [methyl-2H3]- and [1-13C]methionine",
    "aliases": [
      "Storch 1988"
    ],
    "summary": "Human isotope study: postabsorptive transmethylation 5.8, remethylation 1.8, transsulfuration 4.0 umol/kg/h; fed values 14, 5.7, 8.3.",
    "evidence": "established",
    "authors": [
      "Storch KJ",
      "Wagner DA",
      "Burke JF",
      "Young VR"
    ],
    "year": 1988,
    "journal": "The American journal of physiology",
    "doi": "10.1152/ajpendo.1988.255.3.E322",
    "url": "https://doi.org/10.1152/ajpendo.1988.255.3.E322",
    "pmid": "3421329",
    "verified": true,
    "takeaways": [
      "Total daily transmethylation is about 238 umol/kg, matching a methyl-balance estimate of 241.",
      "Feeding doubles the partition of methionine to transmethylation.",
      "Remethylation is under half of transmethylation in the fasted state.",
      "Very small groups; whole-body, not liver-specific."
    ],
    "facts": {
      "design": "cohort",
      "population": "8 healthy young men (4 fasted, 4 fed)"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:methionine-cycle",
        "note": "Whole-body human flux anchors."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:transsulfuration"
      },
      {
        "rel": "evidence-for",
        "to": "compound:methionine"
      }
    ]
  },
  {
    "id": "article:jencks-1987-mthfr-adomet-inhibition",
    "type": "article",
    "name": "Allosteric inhibition of methylenetetrahydrofolate reductase by adenosylmethionine. Effects of adenosylmethionine and NADPH on the equilibrium between active and inactive forms of the enzyme and on the kinetics of approach to equilibrium",
    "aliases": [
      "Jencks and Matthews 1987"
    ],
    "summary": "MTHFR is allosterically inhibited by SAM; NADPH recruits active forms and SAM inactive forms; activity vs SAM is sigmoidal at high NADPH.",
    "evidence": "established",
    "authors": [
      "Jencks DA",
      "Mathews RG"
    ],
    "year": 1987,
    "journal": "The Journal of biological chemistry",
    "doi": "10.1016/s0021-9258(18)61530-3",
    "url": "https://doi.org/10.1016/s0021-9258(18)61530-3",
    "pmid": "3818603",
    "verified": true,
    "takeaways": [
      "Two-state (R/T) model with antagonistic binding of NADPH and SAM.",
      "Inhibition develops slowly and in two phases.",
      "Abstract-only access; numeric constants not in it."
    ],
    "facts": {
      "design": "in-vitro",
      "population": "Pig liver enzyme"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:mthfr",
        "note": "Allosteric SAM inhibition."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam"
      }
    ]
  },
  {
    "id": "article:finkelstein-1984-homocysteine-distribution",
    "type": "article",
    "name": "Methionine metabolism in mammals. Distribution of homocysteine between competing pathways",
    "aliases": [
      "Finkelstein and Martin 1984"
    ],
    "summary": "Reconstituted rat-liver conditions: methionine synthase, BHMT and CBS handled 27, 27 and 46% of homocysteine; SAM-activated CBS regulates the split.",
    "evidence": "established",
    "authors": [
      "Finkelstein JD",
      "Martin JJ"
    ],
    "year": 1984,
    "journal": "The Journal of biological chemistry",
    "doi": "10.1016/s0021-9258(17)42728-1",
    "url": "https://doi.org/10.1016/s0021-9258(17)42728-1",
    "pmid": "6746658",
    "verified": true,
    "takeaways": [
      "Under control conditions about 46% of homocysteine goes to cystathionine and 54% back to methionine.",
      "A low-protein diet raises BHMT, cuts CBS 83% and total homocysteine use by 55%.",
      "SAM activation of CBS contributes to regulation."
    ],
    "facts": {
      "design": "in-vitro",
      "population": "Enzyme mixture mimicking rat liver"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:transsulfuration",
        "note": "Partition of homocysteine flux."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:cbs"
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:bhmt"
      },
      {
        "rel": "evidence-for",
        "to": "compound:homocysteine"
      }
    ]
  },
  {
    "id": "article:ogawa-1982-gnmt-rat-liver",
    "type": "article",
    "name": "Purification and properties of glycine N-methyltransferase from rat liver",
    "aliases": [
      "Ogawa and Fujioka 1982"
    ],
    "summary": "Purified rat liver GNMT: hyperbolic in glycine (half-max 0.13 mM) but positively cooperative in SAM (half-max 30 uM) at pH 7.4.",
    "evidence": "established",
    "authors": [
      "Ogawa H",
      "Fujioka M"
    ],
    "year": 1982,
    "journal": "The Journal of biological chemistry",
    "doi": "10.1016/s0021-9258(18)34798-7",
    "url": "https://doi.org/10.1016/s0021-9258(18)34798-7",
    "pmid": "6801046",
    "verified": true,
    "takeaways": [
      "Tetramer of identical subunits, pH optimum 9.0.",
      "Glycine dependence is Michaelis-Menten; SAM dependence is positively cooperative.",
      "Half-maximal velocity at 0.13 mM glycine and 30 uM SAM (pH 7.4, 25 C).",
      "Only the abstract was read; later reviews quote far higher glycine Km values."
    ],
    "facts": {
      "design": "in-vitro",
      "population": "Purified rat liver enzyme"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:gnmt",
        "note": "Basic kinetics of the liver enzyme."
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Km for glycine 0.13 mM in this assay."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam"
      }
    ]
  },
  {
    "id": "article:sullivan-1983-mat-isozymes",
    "type": "article",
    "name": "Fractionation and kinetic properties of rat liver and kidney methionine adenosyltransferase isozymes",
    "aliases": [
      "Sullivan and Hoffman 1983"
    ],
    "summary": "Rat liver has three MAT isozymes: MAT-I (Km Met 41 uM, mild SAM inhibition), MAT-II (S0.5 8 uM, strongly inhibited) and MAT-III (S0.5 215 uM, Hill 1.8, SAM-activated).",
    "evidence": "established",
    "authors": [
      "Sullivan DM",
      "Hoffman JL"
    ],
    "year": 1983,
    "journal": "Biochemistry",
    "doi": "10.1021/bi00276a017",
    "url": "https://doi.org/10.1021/bi00276a017",
    "pmid": "6849873",
    "verified": true,
    "takeaways": [
      "MAT-III is the predominant liver form; MAT-I and -II are about 15% and 5% of activity.",
      "MAT-III is activated by SAM and by DMSO.",
      "These opposing SAM effects underlie the substrate-switch models.",
      "Only the abstract was read."
    ],
    "facts": {
      "design": "in-vitro",
      "population": "Rat liver and kidney"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:mat1a",
        "note": "MAT-I and MAT-III kinetics."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:mat2a",
        "note": "MAT-II kinetics."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam"
      },
      {
        "rel": "evidence-for",
        "to": "compound:methionine"
      }
    ]
  },
  {
    "id": "article:finkelstein-1982-methionine-metabolite-concentrations",
    "type": "article",
    "name": "Methionine metabolism in mammals: concentration of metabolites in rat tissues",
    "aliases": [
      "Finkelstein 1982"
    ],
    "summary": "Rat tissue concentrations of methionine, SAM, SAH and thiols: liver methionine is protein-independent, SAM:SAH is about 6 across tissues.",
    "evidence": "established",
    "authors": [
      "Finkelstein JD",
      "Kyle WE",
      "Harris BJ",
      "Martin JJ"
    ],
    "year": 1982,
    "journal": "The Journal of nutrition",
    "doi": "10.1093/jn/112.5.1011",
    "url": "https://doi.org/10.1093/jn/112.5.1011",
    "pmid": "7077413",
    "verified": true,
    "takeaways": [
      "SAM:SAH approximated 6.0 on the stock diet and stayed at or above 5 on varying casein diets.",
      "Earlier work overestimated SAH.",
      "Liver methionine barely changes with protein intake while SAM and SAH increase."
    ],
    "facts": {
      "design": "animal",
      "population": "Rat liver, brain, kidney, muscle"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:sam"
      },
      {
        "rel": "evidence-for",
        "to": "compound:sah",
        "note": "Corrected tissue SAH values."
      },
      {
        "rel": "evidence-for",
        "to": "compound:methionine"
      }
    ]
  },
  {
    "id": "article:chen-1994-methionine-synthase-pig-liver",
    "type": "article",
    "name": "Purification and kinetic mechanism of a mammalian methionine synthase from pig liver",
    "aliases": [
      "Chen 1994"
    ],
    "summary": "Pig liver methionine synthase is a monomeric cobalamin enzyme needing SAM, with an ordered mechanism: 5-methyl-THF binds first, homocysteine second, methionine leaves before THF.",
    "evidence": "established",
    "authors": [
      "Chen Z",
      "Crippen K",
      "Gulati S",
      "Banerjee R"
    ],
    "year": 1994,
    "journal": "The Journal of biological chemistry",
    "doi": "10.1016/s0021-9258(18)46968-2",
    "url": "https://doi.org/10.1016/s0021-9258(18)46968-2",
    "pmid": "7961628",
    "verified": true,
    "takeaways": [
      "Mechanism is ordered sequential, not random.",
      "Only cobalt, no other metal.",
      "Kinetic constants are not in the abstract."
    ],
    "facts": {
      "design": "in-vitro",
      "population": "Purified pig liver enzyme"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:mtr",
        "note": "Mechanism."
      },
      {
        "rel": "evidence-for",
        "to": "compound:5-mthf"
      }
    ]
  },
  {
    "id": "article:garrow-1996-bhmt-purification",
    "type": "article",
    "name": "Purification, kinetic properties, and cDNA cloning of mammalian betaine-homocysteine methyltransferase",
    "aliases": [
      "Garrow 1996"
    ],
    "summary": "Pig liver BHMT: Km 23 uM betaine and 32 uM homocysteine; human cDNA cloned.",
    "evidence": "established",
    "authors": [
      "Garrow TA"
    ],
    "year": 1996,
    "journal": "The Journal of biological chemistry",
    "doi": "10.1074/jbc.271.37.22831",
    "url": "https://doi.org/10.1074/jbc.271.37.22831",
    "pmid": "8798461",
    "verified": true,
    "takeaways": [
      "Dimethylacetothetin is used 47-fold faster than betaine.",
      "The pig betaine Km is about 100 times lower than the later human recombinant value, a species or assay discrepancy."
    ],
    "facts": {
      "design": "in-vitro",
      "population": "Porcine liver enzyme"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:bhmt",
        "note": "First kinetic constants (pig)."
      },
      {
        "rel": "evidence-for",
        "to": "compound:betaine"
      }
    ]
  },
  {
    "id": "article:millian-1998-human-bhmt-zinc",
    "type": "article",
    "name": "Human betaine-homocysteine methyltransferase is a zinc metalloenzyme",
    "aliases": [
      "Millian and Garrow 1998"
    ],
    "summary": "Recombinant and liver-purified human BHMT is a zinc enzyme with Km 2.2 mM for betaine and 4 uM for homocysteine.",
    "evidence": "established",
    "authors": [
      "Millian NS",
      "Garrow TA"
    ],
    "year": 1998,
    "journal": "Archives of biochemistry and biophysics",
    "doi": "10.1006/abbi.1998.0757",
    "url": "https://doi.org/10.1006/abbi.1998.0757",
    "pmid": "9681996",
    "verified": true,
    "takeaways": [
      "A betaine Km in the millimolar range means BHMT flux rises almost linearly with liver betaine.",
      "Zinc is required for activity.",
      "Abstract-only access."
    ],
    "facts": {
      "design": "in-vitro",
      "population": "Human recombinant and partly purified liver enzyme"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:bhmt",
        "note": "Human Km values."
      },
      {
        "rel": "evidence-for",
        "to": "compound:betaine",
        "note": "Km 2.2 mM."
      },
      {
        "rel": "evidence-for",
        "to": "compound:homocysteine"
      }
    ]
  },
  {
    "id": "article:yamada-1999-rat-methionine-synthase",
    "type": "article",
    "name": "Heterologous high level expression, purification, and enzymological properties of recombinant rat cobalamin-dependent methionine synthase",
    "aliases": [
      "Yamada 1999"
    ],
    "summary": "Recombinant rat methionine synthase purified as the methylcobalamin holoenzyme has specific activity and apparent Km values matching the native liver enzyme.",
    "evidence": "established",
    "authors": [
      "Yamada K",
      "Yamada S",
      "Tobimatsu T",
      "Toraya T"
    ],
    "year": 1999,
    "journal": "The Journal of biological chemistry",
    "doi": "10.1074/jbc.274.50.35571",
    "url": "https://doi.org/10.1074/jbc.274.50.35571",
    "pmid": "10585432",
    "verified": true,
    "takeaways": [
      "Confirms the recombinant enzyme is a valid stand-in for rat liver kinetics.",
      "SAM is needed to keep the cobalamin reduced; numeric Km values are not in the abstract."
    ],
    "facts": {
      "design": "in-vitro",
      "population": "Recombinant rat enzyme"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:mtr",
        "note": "Rat enzyme kinetics and cofactor handling."
      }
    ]
  },
  {
    "id": "article:martinov-2000-substrate-switch",
    "type": "article",
    "name": "A substrate switch: a new mode of regulation in the methionine metabolic pathway",
    "aliases": [
      "Martinov 2000"
    ],
    "summary": "First model showing methionine itself can switch liver SAM metabolism between a low-rate conserving mode and a high-rate disposal mode.",
    "evidence": "plausible",
    "authors": [
      "Martinov MV",
      "Vitvitsky VM",
      "Mosharov EV",
      "Banerjee R",
      "Ataullakhanov FI"
    ],
    "year": 2000,
    "journal": "Journal of theoretical biology",
    "doi": "10.1006/jtbi.2000.2035",
    "url": "https://doi.org/10.1006/jtbi.2000.2035",
    "pmid": "10833353",
    "verified": true,
    "takeaways": [
      "Two regimes can coexist: low SAM and slow turnover, or high SAM and fast turnover, selected by methionine.",
      "The switch arises from MAT-I (inhibited by SAM) versus MAT-III (activated by SAM) and from highly cooperative GNMT.",
      "GNMT is essential for removing excess methionine in the high mode.",
      "Only the abstract could be accessed here (journal paywall); its equations were taken from their later restatement in Korendyaseva 2008."
    ],
    "facts": {
      "design": "mathematical model",
      "population": "Liver (rat parameters)"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:gnmt",
        "note": "Cooperative GNMT is the key removal route in the high mode."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:mat1a"
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam"
      },
      {
        "rel": "evidence-for",
        "to": "pathway:methionine-cycle"
      }
    ]
  },
  {
    "id": "article:mosharov-2000-transsulfuration-glutathione",
    "type": "article",
    "name": "The quantitatively important relationship between homocysteine metabolism and glutathione synthesis by the transsulfuration pathway and its regulation by redox changes",
    "aliases": [
      "Mosharov 2000"
    ],
    "summary": "In human hepatoma cells cystathionine production was 82 umol/h per litre of cells, 1.6-2.1 fold higher under oxidants; about half of glutathione derives from it.",
    "evidence": "established",
    "authors": [
      "Mosharov E",
      "Cranford MR",
      "Banerjee R"
    ],
    "year": 2000,
    "journal": "Biochemistry",
    "doi": "10.1021/bi001088w",
    "url": "https://doi.org/10.1021/bi001088w",
    "pmid": "11041866",
    "verified": true,
    "takeaways": [
      "Gives a direct homocysteine transsulfuration flux for a human liver-derived cell.",
      "Oxidative challenge increases it, implying redox regulation of CBS.",
      "Abstract-only access."
    ],
    "facts": {
      "design": "in-vitro",
      "population": "Human hepatoma cell line"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:transsulfuration",
        "note": "Measured flux and redox control."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:cbs"
      },
      {
        "rel": "evidence-for",
        "to": "compound:cysteine"
      }
    ]
  },
  {
    "id": "article:yamada-2001-mthfr-polymorphisms",
    "type": "article",
    "name": "Effects of common polymorphisms on the properties of recombinant human methylenetetrahydrofolate reductase",
    "aliases": [
      "Yamada 2001"
    ],
    "summary": "Common MTHFR variants (A222V, E429A) do not alter kinetics or SAM inhibition, but A222V loses FAD faster; SAM protects and SAH reverses that protection.",
    "evidence": "established",
    "authors": [
      "Yamada K",
      "Chen Z",
      "Rozen R",
      "Matthews RG"
    ],
    "year": 2001,
    "journal": "Proceedings of the National Academy of Sciences of the United States of America",
    "doi": "10.1073/pnas.261469998",
    "url": "https://doi.org/10.1073/pnas.261469998",
    "pmid": "11742092",
    "verified": true,
    "takeaways": [
      "Km values for NADPH and CH2-THF and Ki(SAM) are unchanged by the variants.",
      "SAM slows flavin loss and SAH blocks this effect, so enzyme stability may follow the SAM:SAH ratio.",
      "Intracellular SAM about 100 uM and SAH about 50 uM are quoted from rat liver."
    ],
    "facts": {
      "design": "in-vitro",
      "population": "Recombinant human enzyme"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:mthfr",
        "note": "Effect of polymorphisms and SAM/SAH on stability."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam"
      },
      {
        "rel": "evidence-for",
        "to": "compound:sah"
      }
    ]
  },
  {
    "id": "article:evande-2002-cbs-regulatory-domain",
    "type": "article",
    "name": "Alleviation of intrasteric inhibition by the pathogenic activation domain mutation, D444N, in human cystathionine beta-synthase",
    "aliases": [
      "Evande 2002"
    ],
    "summary": "Human CBS is activated about 2-fold by SAM with an activation constant near 7.4 uM; a regulatory-domain mutant needs 460 uM.",
    "evidence": "established",
    "authors": [
      "Evande R",
      "Blom H",
      "Boers GH",
      "Banerjee R"
    ],
    "year": 2002,
    "journal": "Biochemistry",
    "doi": "10.1021/bi026248d",
    "url": "https://doi.org/10.1021/bi026248d",
    "pmid": "12269827",
    "verified": true,
    "takeaways": [
      "Activation requires the C-terminal regulatory domain, which is autoinhibitory.",
      "Wild-type Kact for AdoMet 7.4 uM vs 460 uM for D444N.",
      "Abstract-only access."
    ],
    "facts": {
      "design": "in-vitro",
      "population": "Recombinant human enzyme and fibroblasts"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:cbs",
        "note": "SAM activation constant and magnitude."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam"
      }
    ]
  },
  {
    "id": "article:reed-2004-methionine-cycle-model",
    "type": "article",
    "name": "A mathematical model of the methionine cycle",
    "aliases": [
      "Reed 2004"
    ],
    "summary": "Four-variable ODE model of the methionine cycle (Met, SAM, SAH, Hcy) built on Martinov 2000, with its regulatory interactions explored under genetic and dietary change.",
    "evidence": "plausible",
    "authors": [
      "Reed MC",
      "Nijhout HF",
      "Sparks R",
      "Ulrich CM"
    ],
    "year": 2004,
    "journal": "Journal of theoretical biology",
    "doi": "10.1016/j.jtbi.2003.08.001",
    "url": "https://doi.org/10.1016/j.jtbi.2003.08.001",
    "pmid": "14637052",
    "verified": true,
    "takeaways": [
      "Starting point of the Reed/Nijhout methionine-cycle lineage whose constants are reused in later liver models.",
      "Shows how products regulate their own producers (MAT) and how SAM steers homocysteine between remethylation and transsulfuration.",
      "Only the abstract was accessed (journal paywall)."
    ],
    "facts": {
      "design": "mathematical model",
      "population": "Liver (mixed mammalian parameters)"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:methionine-cycle"
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam"
      },
      {
        "rel": "evidence-for",
        "to": "compound:homocysteine"
      }
    ]
  },
  {
    "id": "article:luka-2003-human-gnmt-mutations",
    "type": "article",
    "name": "Effect of naturally occurring mutations in human glycine N-methyltransferase on activity and conformation",
    "aliases": [
      "Luka and Wagner 2003"
    ],
    "summary": "Recombinant human GNMT shows hyperbolic kinetics for both SAM and glycine at neutral pH; three disease mutations reduce activity to 0.5-75%.",
    "evidence": "established",
    "authors": [
      "Luka Z",
      "Wagner C"
    ],
    "year": 2003,
    "journal": "Biochemical and biophysical research communications",
    "doi": "10.1016/j.bbrc.2003.11.037",
    "url": "https://doi.org/10.1016/j.bbrc.2003.11.037",
    "pmid": "14651980",
    "verified": true,
    "takeaways": [
      "L49P keeps 10%, N140S under 0.5% and H176N 75% of wild-type activity.",
      "No cooperativity is seen with the recombinant human enzyme at neutral pH, in contrast with the liver enzyme.",
      "Abstract-only access; Km values are not in the abstract."
    ],
    "facts": {
      "design": "in-vitro",
      "population": "Recombinant human enzyme"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:gnmt",
        "note": "Human GNMT kinetics and deficiency mutations."
      }
    ]
  },
  {
    "id": "article:stabler-2004-sam-sah-lcms",
    "type": "article",
    "name": "Quantification of serum and urinary S-adenosylmethionine and S-adenosylhomocysteine by stable-isotope-dilution liquid chromatography-mass spectrometry",
    "aliases": [
      "Stabler and Allen 2004"
    ],
    "summary": "LC-MS assay with reference intervals in 48 volunteers: serum SAM 71-168 nmol/L and SAH 8-26 nmol/L; samples degrade if stored warm or long.",
    "evidence": "established",
    "authors": [
      "Stabler SP",
      "Allen RH"
    ],
    "year": 2004,
    "journal": "Clinical chemistry",
    "doi": "10.1373/clinchem.2003.026252",
    "url": "https://doi.org/10.1373/clinchem.2003.026252",
    "pmid": "14656903",
    "verified": true,
    "takeaways": [
      "Serum SAM:SAH ratios therefore span roughly 3-20.",
      "SAM falls and SAH rises on storage, so handling is critical.",
      "Urinary SAM:SAH is far higher than serum."
    ],
    "facts": {
      "design": "cohort",
      "population": "48 healthy volunteers"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:sam",
        "note": "Human serum reference interval."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sah",
        "note": "Human serum reference interval."
      }
    ]
  },
  {
    "id": "article:guttormsen-2004-plasma-cystathionine",
    "type": "article",
    "name": "Variation in plasma cystathionine and its relation to changes in plasma concentrations of homocysteine and methionine in healthy subjects during a 24-h observation period",
    "aliases": [
      "Guttormsen 2004"
    ],
    "summary": "In 12 healthy adults fasting plasma cystathionine was 0.12 uM and rose to 140% after breakfast and about 280% after a protein meal.",
    "evidence": "established",
    "authors": [
      "Guttormsen AB",
      "Solheim E",
      "Refsum H"
    ],
    "year": 2004,
    "journal": "The American journal of clinical nutrition",
    "doi": "10.1093/ajcn/79.1.76",
    "url": "https://doi.org/10.1093/ajcn/79.1.76",
    "pmid": "14684400",
    "verified": true,
    "takeaways": [
      "Cystathionine responds to food more than homocysteine or methionine do.",
      "Fasting sampling is advisable when measuring it."
    ],
    "facts": {
      "design": "cohort",
      "population": "12 healthy adults aged 22-29"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:cystathionine",
        "note": "Human plasma fasting value and meal response."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:transsulfuration"
      }
    ]
  },
  {
    "id": "article:nijhout-2004-folate-cycle-model",
    "type": "article",
    "name": "A mathematical model of the folate cycle: new insights into folate homeostasis",
    "aliases": [
      "Nijhout 2004"
    ],
    "summary": "First Nijhout/Reed folate-cycle model: reproduces folate pools and fluxes, the methyl trap in B12 deficiency, and homeostasis from folate binding and allosteric inhibition.",
    "evidence": "plausible",
    "authors": [
      "Nijhout HF",
      "Reed MC",
      "Budu P",
      "Ulrich CM"
    ],
    "year": 2004,
    "journal": "The Journal of biological chemistry",
    "doi": "10.1074/jbc.M410818200",
    "url": "https://doi.org/10.1074/jbc.M410818200",
    "pmid": "15496403",
    "verified": true,
    "takeaways": [
      "B12 deficiency is modelled as lowering methionine synthase Vmax, which traps folate as 5-methyl-THF.",
      "Binding of folates to enzymes and allosteric inhibition keep folate fluxes nearly constant as total folate falls.",
      "Almost total DHFR inhibition is needed before thymidylate synthesis drops (methotrexate relevance).",
      "Only the abstract could be accessed here; folate-cycle constants were read from the later Reed 2008/2015 supplements that reuse them."
    ],
    "facts": {
      "design": "mathematical model",
      "population": "Liver/cell (mixed mammalian parameters)"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:folate-cycle"
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:mtr",
        "note": "B12 deficiency represented as a Vmax reduction of methionine synthase."
      },
      {
        "rel": "evidence-for",
        "to": "state:folate-trap",
        "note": "Methyl-trap behaviour reproduced."
      },
      {
        "rel": "evidence-for",
        "to": "compound:5-mthf"
      }
    ]
  },
  {
    "id": "article:reed-2006-folate-one-carbon-model",
    "type": "article",
    "name": "A mathematical model gives insights into nutritional and genetic aspects of folate-mediated one-carbon metabolism",
    "aliases": [
      "Reed 2006"
    ],
    "summary": "Folate-mediated one-carbon model used to predict how folate status and MTHFR polymorphism change SAM, SAH, homocysteine and DNA methylation.",
    "evidence": "plausible",
    "authors": [
      "Reed MC",
      "Nijhout HF",
      "Neuhouser ML",
      "Gregory JF",
      "Shane B",
      "James SJ",
      "Boynton A",
      "Ulrich CM"
    ],
    "year": 2006,
    "journal": "The Journal of nutrition",
    "doi": "10.1093/jn/136.10.2653",
    "url": "https://doi.org/10.1093/jn/136.10.2653",
    "pmid": "16988141",
    "verified": true,
    "takeaways": [
      "Homocysteine depends strongly on folate only at low folate; at high folate there is little association.",
      "DNA methylation rate is relatively insensitive to folate pool size.",
      "Lower MTHFR activity lowers SAM and 5-MTHF and modestly raises SAH and homocysteine.",
      "Only the abstract was accessed."
    ],
    "facts": {
      "design": "mathematical model",
      "population": "Liver/cell (mixed mammalian parameters)"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:folate-cycle"
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:mthfr",
        "note": "Predicted effect of reduced MTHFR activity."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam"
      }
    ]
  },
  {
    "id": "article:nijhout-2006-long-range-interactions-dna-methylation",
    "type": "article",
    "name": "Long-range allosteric interactions between the folate and methionine cycles stabilize DNA methylation reaction rate",
    "aliases": [
      "Nijhout 2006"
    ],
    "summary": "Model analysis showing that SAM/5-MTHF cross-talk (long-range interactions) stabilises the DNA-methylation rate against large swings in methionine input.",
    "evidence": "plausible",
    "authors": [
      "Nijhout HF",
      "Reed MC",
      "Anderson DF",
      "Mattingly JC",
      "James SJ",
      "Ulrich CM"
    ],
    "year": 2006,
    "journal": "Epigenetics",
    "doi": "10.4161/epi.1.2.2677",
    "url": "https://doi.org/10.4161/epi.1.2.2677",
    "pmid": "17998813",
    "verified": true,
    "takeaways": [
      "Interactions such as SAM inhibition of MTHFR and BHMT and activation of CBS keep methylation flux steady when methionine input varies.",
      "They help most under low and very low protein input.",
      "Only the abstract was accessed."
    ],
    "facts": {
      "design": "mathematical model",
      "population": "Liver (mixed mammalian parameters)"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:mthfr"
      },
      {
        "rel": "evidence-for",
        "to": "pathway:methionine-cycle"
      },
      {
        "rel": "evidence-for",
        "to": "pathway:folate-cycle"
      }
    ]
  },
  {
    "id": "article:reed-2008-glutathione-model",
    "type": "article",
    "name": "A mathematical model of glutathione metabolism",
    "aliases": [
      "Reed 2008",
      "Reed glutathione model"
    ],
    "summary": "Liver model combining folate cycle, methionine cycle, transsulfuration and glutathione; full parameter tables and steady-state values are given.",
    "evidence": "plausible",
    "authors": [
      "Reed MC",
      "Thomas RL",
      "Pavisic J",
      "James SJ",
      "Ulrich CM",
      "Nijhout HF"
    ],
    "year": 2008,
    "journal": "Theoretical biology & medical modelling",
    "doi": "10.1186/1742-4682-5-8",
    "url": "https://doi.org/10.1186/1742-4682-5-8",
    "pmid": "18442411",
    "verified": true,
    "takeaways": [
      "Normal steady state: Met 49, SAM 81, SAH 19, Hcy 1.1, cystathionine 37, cysteine 195 uM; about half of homocysteine flux (103 of 205 uM/h) goes to cystathionine.",
      "Gives rate laws and constants for MAT, GNMT, BHMT, CBS, CTH, MS, MTHFR and the folate enzymes; most reproduce the reported velocities, the printed CBS and GNMT laws do not.",
      "Oxidative stress (H2O2) activates CBS and inhibits MS and BHMT, creating a methyl trap.",
      "Glutathione synthesis from methionine and cysteine inputs is roughly equal in this model."
    ],
    "facts": {
      "design": "mathematical model",
      "population": "Liver (mixed mammalian parameters)"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:methionine-cycle"
      },
      {
        "rel": "evidence-for",
        "to": "pathway:transsulfuration"
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:cbs",
        "note": "Rate law and Vmax with SAM activation."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:cth",
        "note": "Km and Vmax of cystathionine cleavage."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:gnmt"
      },
      {
        "rel": "evidence-for",
        "to": "compound:cystathionine",
        "note": "Model steady state about 37 uM."
      }
    ]
  },
  {
    "id": "article:korendyaseva-2008-methionine-switch-allosteric",
    "type": "article",
    "name": "An allosteric mechanism for switching between parallel tracks in mammalian sulfur metabolism",
    "aliases": [
      "Korendyaseva 2008",
      "Martinov-Korendyaseva methionine model"
    ],
    "summary": "Mouse hepatocyte data and an extended model show a sharp switch from methionine conservation to disposal at 50-100 uM Met, driven by MAT-I/III, GNMT and 5-MTHF.",
    "evidence": "established",
    "authors": [
      "Korendyaseva TK",
      "Kuvatov DN",
      "Volkov VA",
      "Martinov MV",
      "Vitvitsky VM",
      "Banerjee R",
      "Ataullakhanov FI"
    ],
    "year": 2008,
    "journal": "PLoS computational biology",
    "doi": "10.1371/journal.pcbi.1000076",
    "url": "https://doi.org/10.1371/journal.pcbi.1000076",
    "pmid": "18451990",
    "verified": true,
    "takeaways": [
      "Intracellular SAM and methionine consumption rise about 10-fold between roughly 50 and 100 uM external methionine, far steeper than a hyperbola.",
      "In the model the switch needs MAT-III (activated by SAM) taking over from MAT-I (inhibited by SAM), a cooperative GNMT, and MTHFR inhibition by SAM that lowers 5-methyl-THF and so releases GNMT.",
      "At normal methionine the cell conserves it by remethylation and runs almost no GNMT flux; above the threshold flux is sent to transsulfuration, stabilising blood methionine over a several-fold change in intake.",
      "Full rate laws and constants are only in supplementary Word files; models reproduced elsewhere use different scale and values."
    ],
    "facts": {
      "design": "in-vitro",
      "population": "Isolated mouse hepatocytes plus mathematical model"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:gnmt",
        "note": "Cooperative GNMT inhibited by 5-methyl-THF is a core component of the switch."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:mat1a",
        "note": "MAT-I and MAT-III respond oppositely to SAM."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:cbs",
        "note": "SAM-activated CBS takes the excess flux."
      },
      {
        "rel": "evidence-for",
        "to": "compound:methionine",
        "note": "Dose-response of hepatocyte methionine metabolism."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam"
      },
      {
        "rel": "evidence-for",
        "to": "pathway:methionine-cycle"
      }
    ]
  },
  {
    "id": "article:luka-2008-gnmt-acetylation-folate",
    "type": "article",
    "name": "Acetylation of N-terminal valine of glycine N-methyltransferase affects enzyme inhibition by folate",
    "aliases": [
      "Luka 2008"
    ],
    "summary": "Native N-acetylated liver GNMT is 50% inhibited by 1.3 uM 5-MTHF pentaglutamate vs 590 uM for the non-acetylated recombinant enzyme.",
    "evidence": "established",
    "authors": [
      "Luka Z",
      "Loukachevitch LV",
      "Wagner C"
    ],
    "year": 2008,
    "journal": "Biochimica et biophysica acta",
    "doi": "10.1016/j.bbapap.2008.04.016",
    "url": "https://doi.org/10.1016/j.bbapap.2008.04.016",
    "pmid": "18501206",
    "verified": true,
    "takeaways": [
      "N-terminal acetylation does not change basal activity or folate binding but changes the strength of inhibition by about 450-fold.",
      "The pentaglutamate binds more tightly than the monoglutamate.",
      "Folate binding makes SAM dependence cooperative (Hill 1.5).",
      "Only the abstract was read."
    ],
    "facts": {
      "design": "in-vitro",
      "population": "Rat GNMT, native and recombinant"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:gnmt"
      },
      {
        "rel": "evidence-for",
        "to": "compound:5-mthf",
        "note": "Potency of inhibition depends on glutamate chain length and enzyme form."
      }
    ]
  },
  {
    "id": "article:duncan-2013-intracellular-plasma-methionine-cycle",
    "type": "article",
    "name": "The relationship between intracellular and plasma levels of folate and metabolites in the methionine cycle: a model",
    "aliases": [
      "Duncan 2013 plasma model"
    ],
    "summary": "Three-compartment (liver, tissue, plasma) methionine-cycle model giving model steady states and how plasma markers relate to cell levels.",
    "evidence": "plausible",
    "authors": [
      "Duncan TM",
      "Reed MC",
      "Nijhout HF"
    ],
    "year": 2013,
    "journal": "Molecular nutrition & food research",
    "doi": "10.1002/mnfr.201200125",
    "url": "https://doi.org/10.1002/mnfr.201200125",
    "pmid": "23143835",
    "verified": true,
    "takeaways": [
      "Model steady state: plasma Met 33.8 uM, SAM 91 nM, SAH 24.5 nM, Hcy 8.8 uM; liver Met 88, SAM 85, SAH 14, Hcy 3.3 uM.",
      "A methionine load raising plasma methionine about 3-fold raises plasma homocysteine to just above 30 uM in the model.",
      "Plasma values are weak proxies for liver values."
    ],
    "facts": {
      "design": "mathematical model",
      "population": "Whole-body model"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:sam"
      },
      {
        "rel": "evidence-for",
        "to": "compound:sah"
      },
      {
        "rel": "evidence-for",
        "to": "compound:methionine"
      },
      {
        "rel": "evidence-for",
        "to": "pathway:methionine-cycle"
      }
    ]
  },
  {
    "id": "article:duncan-2013-population-model-folate",
    "type": "article",
    "name": "A population model of folate-mediated one-carbon metabolism",
    "aliases": [
      "Duncan 2013 population model"
    ],
    "summary": "Whole-body model (liver, tissue, plasma) with 10,000 virtual individuals whose plasma folate and homocysteine match NHANES distributions.",
    "evidence": "plausible",
    "authors": [
      "Duncan TM",
      "Reed MC",
      "Nijhout HF"
    ],
    "year": 2013,
    "journal": "Nutrients",
    "doi": "10.3390/nu5072457",
    "url": "https://doi.org/10.3390/nu5072457",
    "pmid": "23857220",
    "verified": true,
    "takeaways": [
      "Mean plasma homocysteine 7.1 uM in the model vs NHANES 7.0-7.3 uM; plasma folate about 28-30 nmol/L; red-cell folate about 600 nmol/L.",
      "Plasma homocysteine tracks peripheral tissue homocysteine, not liver.",
      "Oxidative stress produces a methyl trap that is invisible in plasma 5-MTHF."
    ],
    "facts": {
      "design": "mathematical model",
      "population": "Virtual US population vs NHANES"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:homocysteine",
        "note": "NHANES means and model comparison."
      },
      {
        "rel": "evidence-for",
        "to": "compound:5-mthf"
      },
      {
        "rel": "evidence-for",
        "to": "pathway:folate-cycle"
      }
    ]
  },
  {
    "id": "article:reed-2015-competing-methyltransferases",
    "type": "article",
    "name": "Mathematical analysis of the regulation of competing methyltransferases",
    "aliases": [
      "Reed 2015",
      "competing methyltransferases model"
    ],
    "summary": "Liver folate/methionine model with five competing methyltransferases; long-range interactions and 5-MTHF binding to GNMT keep methylation fluxes independent.",
    "evidence": "plausible",
    "authors": [
      "Reed MC",
      "Gamble MV",
      "Hall MN",
      "Nijhout HF"
    ],
    "year": 2015,
    "journal": "BMC systems biology",
    "doi": "10.1186/s12918-015-0215-6",
    "url": "https://doi.org/10.1186/s12918-015-0215-6",
    "pmid": "26467983",
    "verified": true,
    "takeaways": [
      "GNMT binds two 5-MTHF; modelling the inhibition curve suggests once-bound GNMT keeps about half its activity and twice-bound none.",
      "At the model steady state GNMT carries 44%, PEMT 27% and GAMT 25% of SAM flux; DNMT 2%.",
      "When one methyltransferase is removed or boosted, GNMT absorbs most of the change, acting as a salvage valve; without the long-range interactions SAM swings far more.",
      "Methionine input of 50 uM/h gives SAM 24 uM, SAH 3.9 uM, transsulfuration half of cycle flux.",
      "Several printed constants disagree with the paper own table (DNMT Vmax, GAMT Vmax, a 5-MTHF value)."
    ],
    "facts": {
      "design": "mathematical model",
      "population": "Liver (mixed mammalian parameters)"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:gnmt",
        "note": "Source of the binding scheme and the 44% flux share."
      },
      {
        "rel": "evidence-for",
        "to": "compound:5-mthf",
        "note": "Binds GNMT at two sites in the model."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:pemt"
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:gamt"
      },
      {
        "rel": "evidence-for",
        "to": "pathway:methyl-budget",
        "note": "Model-based split of SAM flux."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam"
      }
    ]
  },
  {
    "id": "article:sadre-marandi-2018-hepatic-one-carbon-sex",
    "type": "article",
    "name": "Sex differences in hepatic one-carbon metabolism",
    "aliases": [
      "Sadre-Marandi 2018"
    ],
    "summary": "Extends the Reed liver model with choline/betaine synthesis and uses it to explain male-female differences; gives a full constants list.",
    "evidence": "plausible",
    "authors": [
      "Sadre-Marandi F",
      "Dahdoul T",
      "Reed MC",
      "Nijhout HF"
    ],
    "year": 2018,
    "journal": "BMC systems biology",
    "doi": "10.1186/s12918-018-0621-7",
    "url": "https://doi.org/10.1186/s12918-018-0621-7",
    "pmid": "30355281",
    "verified": true,
    "takeaways": [
      "Folate raises SAM largely because 5-MTHF inhibits GNMT.",
      "Folate and betaine lower homocysteine mainly through SAM and betaine activation of CBS, not through faster remethylation.",
      "Uses Km(betaine) 2000 uM for BHMT, unlike the 100 uM in the earlier models.",
      "Reports a male steady state of SAM 29, Hcy 1.8, betaine 315 uM; several Vmax values are not printed."
    ],
    "facts": {
      "design": "mathematical model",
      "population": "Liver; male and female virtual individuals"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:bhmt",
        "note": "Betaine Km and betaine-dependent activation."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:cbs",
        "note": "CBS activation by SAM and betaine."
      },
      {
        "rel": "evidence-for",
        "to": "compound:betaine"
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:gnmt"
      },
      {
        "rel": "evidence-for",
        "to": "pathway:methionine-cycle"
      }
    ]
  }
]
