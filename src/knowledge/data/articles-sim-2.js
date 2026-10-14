// Literature layer for the simulation parameters (agent B2): verified articles on SAM methyl sinks, choline and betaine,
// glycine and serine, vitamin B6, histamine, bile acid conjugation, and gastric acid / bicarbonate / gas.
// Bibliographic fields (title, authors, year, journal, DOI, PMID) come from Europe PMC / PubMed; takeaways are paraphrased,
// not copied. Each entry says which simulation parameter it supports. Not wired into index.js: import and concatenate it there.
export default [
  {
    "id": "article:maccoss-2001-intracellular-enrichment-correction",
    "type": "article",
    "name": "Measurement of intracellular sulfur amino acid metabolism in humans",
    "aliases": [
      "MacCoss 2001"
    ],
    "summary": "Plasma homocysteine and cystathionine enrichments reach only 54-58% of plasma methionine enrichment; correcting for this raises methionine-cycle kinetics by about 40%.",
    "body": [
      "Justifies the upper end of the transmethylation range used for the [[pathway:methyl-budget|methyl budget]]."
    ],
    "evidence": "established",
    "authors": [
      "MacCoss MJ",
      "Fukagawa NK",
      "Matthews DE"
    ],
    "year": 2001,
    "journal": "American journal of physiology. Endocrinology and metabolism",
    "doi": "10.1152/ajpendo.2001.280.6.e947",
    "pmid": "11350776",
    "url": "https://doi.org/10.1152/ajpendo.2001.280.6.e947",
    "verified": true,
    "takeaways": [
      "Eight post-absorptive volunteers had an 8-hour infusion of [1-13C]- and [methyl-2H3]methionine.",
      "Plasma [13C]homocysteine and [13C]cystathionine rose slowly to plateau (rate constants about 0.4-0.5 per hour) and reached 58% and 54% of plasma methionine enrichment.",
      "Using those enrichments as intracellular methionine enrichment raises previously reported methionine kinetics by roughly 40%.",
      "The correction pushes the whole-body transmethylation estimate from about 16.7 to about 23 mmol/day."
    ],
    "facts": {
      "design": "tracer-study",
      "population": "Healthy post-absorptive adults, n=8"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:methionine-cycle",
        "note": "Intracellular enrichment correction for tracer-derived fluxes."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:methyl-budget",
        "note": "Raises tracer-based total transmethylation by ~40%."
      },
      {
        "rel": "evidence-for",
        "to": "compound:homocysteine",
        "note": "Plasma homocysteine enrichment is used as an intracellular proxy."
      }
    ]
  },
  {
    "id": "article:zhang-2016-gnmt-kinetics-37c",
    "type": "article",
    "name": "Convergent Mechanistic Features between the Structurally Diverse N- and O-Methyltransferases: Glycine N-Methyltransferase and Catechol O-Methyltransferase",
    "aliases": [
      "Zhang 2016"
    ],
    "summary": "Recombinant rat GNMT at 37 C and pH 7.4: Km(AdoMet) 108 uM, Km(glycine) 1.1 mM, kcat 175 per minute; glycine scanned 0.2-200 mM.",
    "body": [
      "The 37 C kinetic constants chosen as the central values for [[enzyme:gnmt|GNMT]]."
    ],
    "evidence": "plausible",
    "authors": [
      "Zhang J",
      "Klinman JP"
    ],
    "year": 2016,
    "journal": "Journal of the American Chemical Society",
    "doi": "10.1021/jacs.6b03462",
    "pmid": "27355841",
    "url": "https://doi.org/10.1021/jacs.6b03462",
    "verified": true,
    "takeaways": [
      "Steady-state kinetics at 37 C and pH 7.4 (40 mM phosphate) gave Km(AdoMet) 108 +/- 18 uM, Km(glycine) 1.1 +/- 0.2 mM and kcat 174.5 per minute.",
      "Glycine was scanned from 0.2 to 200 mM, covering the whole saturation curve.",
      "These values sit between the low native-enzyme estimates of the 1980s and the higher 25 C estimates of 2008."
    ],
    "facts": {
      "design": "in-vitro",
      "population": "Recombinant rat GNMT"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:gnmt",
        "note": "Km and kcat at 37 C, pH 7.4."
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Km(glycine) 1.1 mM."
      }
    ]
  },
  {
    "id": "article:baric-2017-gnmt-deficiency-case",
    "type": "article",
    "name": "Glycine N-Methyltransferase Deficiency: A Member of Dysmethylating Liver Disorders?",
    "aliases": [
      "Barić 2017"
    ],
    "summary": "Case report of GNMT deficiency: plasma SAM 3348 nM (reference 71-118), SAH 63 nM, methionine 815-1247 uM, tHcy 21-28 uM, with near-normal whole-blood SAM.",
    "body": [
      "Validation target for the [[enzyme:gnmt|GNMT]] sink: removing GNMT lets plasma SAM rise ~30-47-fold."
    ],
    "evidence": "plausible",
    "authors": [
      "Barić I",
      "Erdol S",
      "Saglam H",
      "Lovrić M",
      "Belužić R",
      "Vugrek O",
      "Blom HJ",
      "Fumić K"
    ],
    "year": 2017,
    "journal": "JIMD reports",
    "doi": "10.1007/8904_2016_543",
    "pmid": "27207470",
    "url": "https://doi.org/10.1007/8904_2016_543",
    "verified": true,
    "takeaways": [
      "A child with liver involvement and a GNMT mutation showed plasma AdoMet about 30-45 times above the reference range.",
      "Plasma methionine was 815-1247 uM (reference 7-47) and total homocysteine 21-28 uM.",
      "Whole-blood AdoMet was within the reference range (1790 nM), which the authors attribute to AdoMet instability; plasma is the sample of choice.",
      "The finding shows how large the GNMT sink is when SAM is high."
    ],
    "facts": {
      "design": "case report",
      "population": "One child with GNMT deficiency"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:gnmt",
        "note": "GNMT deficiency raises plasma SAM about 30-fold."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam",
        "note": "Plasma SAM 3348 nM vs 71-118 nM."
      },
      {
        "rel": "evidence-for",
        "to": "compound:methionine",
        "note": "Plasma methionine 815-1247 uM."
      }
    ]
  },
  {
    "id": "article:augoustides-2003-gnmt-deficiency-greek",
    "type": "article",
    "name": "Glycine N -methyltransferase deficiency: a new patient with a novel mutation",
    "aliases": [
      "Augoustides-Savvopoulou 2003"
    ],
    "summary": "Greek boy with GNMT deficiency: plasma methionine 508-1049 uM, SAM 1643-2222 nM, tHcy 9.4-12.1 uM, and sarcosine not raised.",
    "body": [
      "Second human anchor for the size of the [[enzyme:gnmt|GNMT]] sink and for the sarcosine readout."
    ],
    "evidence": "plausible",
    "authors": [
      "Augoustides-Savvopoulou P",
      "Luka Z",
      "Karyda S",
      "Stabler SP",
      "Allen RH",
      "Patsiaoura K",
      "Wagner C",
      "Mudd SH"
    ],
    "year": 2003,
    "journal": "Journal of inherited metabolic disease",
    "doi": "10.1023/b:boli.0000009978.17777.33",
    "pmid": "14739680",
    "url": "https://doi.org/10.1023/b:boli.0000009978.17777.33",
    "verified": true,
    "takeaways": [
      "A second family with a different GNMT mutation, found through hypermethioninaemia and mildly raised liver enzymes.",
      "Plasma methionine and AdoMet were many-fold above normal while total homocysteine was only modestly raised.",
      "Sarcosine did not rise, consistent with the enzyme that makes it being absent."
    ],
    "facts": {
      "design": "case report",
      "population": "One Greek boy with GNMT deficiency"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:gnmt",
        "note": "GNMT deficiency: SAM and methionine accumulate, sarcosine does not."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sarcosine",
        "note": "Sarcosine stays normal when GNMT is absent."
      }
    ]
  },
  {
    "id": "article:hoffman-1981-pemt-kinetic-properties",
    "type": "article",
    "name": "Microsomal phosphatidylethanolamine methyltransferase: some physical and kinetic properties",
    "aliases": [
      "Hoffman 1981"
    ],
    "summary": "Microsomal PEMT in rat and guinea pig liver: pH optima 9.3-9.8, Km(SAM) 18.2 uM in rat and 302 uM in guinea pig, rat rate-limiting Vmax 114 pmol/min/mg.",
    "body": [
      "Supplies Km(SAM) for the [[enzyme:pemt|PEMT]] rate law."
    ],
    "evidence": "established",
    "authors": [
      "Hoffman DR",
      "Cornatzer WE"
    ],
    "year": 1981,
    "journal": "Lipids",
    "doi": "10.1007/bf02535052",
    "pmid": "7278514",
    "url": "https://doi.org/10.1007/bf02535052",
    "verified": true,
    "takeaways": [
      "Three sequential methylations by microsomal phosphatidylethanolamine methyltransferase were characterised in rat and guinea pig liver.",
      "The affinity for AdoMet is much higher in rat (Km 18.2 uM) than in guinea pig (302 uM).",
      "Maximal velocity of the first reaction was 114 pmol/min/mg in rat versus 48 in guinea pig."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Rat and guinea pig liver microsomes"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:pemt",
        "note": "Km(SAM) 18.2 uM (rat)."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam",
        "note": "High affinity in rat liver."
      }
    ]
  },
  {
    "id": "article:hoffman-1981-pemt-sah-inhibition",
    "type": "article",
    "name": "Microsomal phosphatidylethanolamine methyltransferase: inhibition by S-adenosylhomocysteine",
    "aliases": [
      "Hoffman 1981"
    ],
    "summary": "PEMT binds SAH more tightly than SAM in five of six steps; Ki(SAH) 3.8 uM (rat) and 68 uM (guinea pig); rat liver AdoMet:AdoHcy falls from 12:1 to 5:1 with age.",
    "body": [
      "Supplies Ki(SAH) for [[enzyme:pemt|PEMT]] and the hepatic SAM:SAH comparison."
    ],
    "evidence": "established",
    "authors": [
      "Hoffman DR",
      "Haning JA",
      "Cornatzer WE"
    ],
    "year": 1981,
    "journal": "Lipids",
    "doi": "10.1007/bf02534900",
    "pmid": "7278517",
    "url": "https://doi.org/10.1007/bf02534900",
    "verified": true,
    "takeaways": [
      "Inhibition by S-adenosylhomocysteine of the three PEMT reactions was measured in rat and guinea pig microsomes.",
      "The Ki for the rate-limiting reactions was 3.8 uM (rat) and 68 uM (guinea pig).",
      "Hepatic AdoMet:AdoHcy was 12:1 in developing and about 5:1 in adult liver, and SAH rises rapidly after death."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Rat and guinea pig liver"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:pemt",
        "note": "Ki(SAH) 3.8 uM (rat)."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sah",
        "note": "Tight product inhibition."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:low-sam-sah-ratio",
        "note": "PEMT activity tracks the SAM:SAH ratio."
      }
    ]
  },
  {
    "id": "article:hoffman-1979-liver-sam-sah-rat",
    "type": "article",
    "name": "Relationship between tissue levels of S-adenosylmethionine, S-adenylhomocysteine, and transmethylation reactions",
    "aliases": [
      "Hoffman 1979"
    ],
    "summary": "Rat liver SAM 60-90 nmol/g at all ages while SAH is 3-7 nmol/g in young and 10-15 in adults; SAM stays far above the Km of most methyltransferases.",
    "body": [
      "Only tissue SAM/SAH values in the set (rat; human liver values were not found)."
    ],
    "evidence": "plausible",
    "authors": [
      "Hoffman DR",
      "Cornatzer WE",
      "Duerre JA"
    ],
    "year": 1979,
    "journal": "Canadian journal of biochemistry",
    "doi": "10.1139/o79-007",
    "pmid": "427630",
    "url": "https://doi.org/10.1139/o79-007",
    "verified": true,
    "takeaways": [
      "Hepatic S-adenosylmethionine stayed in the range 60-90 nmol/g from birth to maturity.",
      "S-adenosylhomocysteine rose from 3-7 nmol/g in the young to 10-15 nmol/g in the adult.",
      "The SAM level is well above the Km of histone and phosphatidylethanolamine methyltransferases, so those enzymes are not SAM-limited."
    ],
    "facts": {
      "design": "animal",
      "population": "Rats of different ages"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:sam",
        "note": "Rat liver SAM 60-90 nmol/g."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sah",
        "note": "Rat liver SAH 10-15 nmol/g in adults."
      }
    ]
  },
  {
    "id": "article:ridgway-1988-pemt-ordered-mechanism",
    "type": "article",
    "name": "Kinetic mechanism of phosphatidylethanolamine N-methyltransferase",
    "aliases": [
      "Ridgway 1988"
    ],
    "summary": "Purified rat liver PEMT follows an ordered bi-bi mechanism (phospholipid binds first, SAH leaves last); apparent cooperativity in detergent disappears when phosphatidylcholine is added.",
    "body": [
      "Warns against transferring in-vitro Hill numbers to the [[enzyme:pemt|PEMT]] law."
    ],
    "evidence": "plausible",
    "authors": [
      "Ridgway ND",
      "Vance DE"
    ],
    "year": 1988,
    "journal": "The Journal of biological chemistry",
    "doi": "10.1016/s0021-9258(18)37471-4",
    "pmid": "3182819",
    "url": "https://doi.org/10.1016/s0021-9258(18)37471-4",
    "verified": true,
    "takeaways": [
      "Hill coefficients of 2.5-4.7 were seen for the three substrates in Triton X-100 and fell to about 1 with egg phosphatidylcholine.",
      "The kinetic mechanism is ordered with the lipid binding first and SAH released last.",
      "In vitro cooperativity therefore reflects surface dilution in detergent and should not be transferred to cells."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Purified rat liver PEMT"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:pemt",
        "note": "Ordered mechanism and detergent-dependent cooperativity."
      },
      {
        "rel": "evidence-for",
        "to": "compound:phosphatidylethanolamine",
        "note": "Substrate lipid binds first in the ordered mechanism."
      }
    ]
  },
  {
    "id": "article:delong-1999-pc-pathways-molecular-species",
    "type": "article",
    "name": "Molecular distinction of phosphatidylcholine synthesis between the CDP-choline pathway and phosphatidylethanolamine methylation pathway",
    "aliases": [
      "DeLong 1999"
    ],
    "summary": "The CDP-choline and PEMT pathways make phosphatidylcholine of different molecular species (PEMT-derived PC carries more polyunsaturated acyl chains).",
    "body": [
      "Context for how [[enzyme:pemt|PEMT]] differs from the Kennedy route; no numbers taken."
    ],
    "evidence": "plausible",
    "authors": [
      "DeLong CJ",
      "Shen YJ",
      "Thomas MJ",
      "Cui Z"
    ],
    "year": 1999,
    "journal": "The Journal of biological chemistry",
    "doi": "10.1074/jbc.274.42.29683",
    "pmid": "10514439",
    "url": "https://doi.org/10.1074/jbc.274.42.29683",
    "verified": true,
    "takeaways": [
      "Hepatocyte phosphatidylcholine from the two routes was analysed by molecular species.",
      "PEMT-derived PC is enriched in polyunsaturated species such as docosahexaenoate-containing PC.",
      "The abstract gives no percentage split of the two pathways; the widely quoted \"about 30%\" for PEMT is a background statement in other papers."
    ],
    "facts": {
      "design": "in-vitro",
      "population": "Rat hepatocytes"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:pemt",
        "note": "PEMT PC is more polyunsaturated."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:kennedy-pathway",
        "note": "The CDP-choline route makes a different PC species mix."
      }
    ]
  },
  {
    "id": "article:sundler-1975-hepatocyte-pc-synthesis",
    "type": "article",
    "name": "Regulation of phospholipid biosynthesis in isolated rat hepatocytes. Effect of different substrates",
    "aliases": [
      "Sundler 1975"
    ],
    "summary": "Isolated rat hepatocytes make phosphatidylcholine mainly via CDP-choline; PEMT adds 20-40% of the CDP-choline rate at plasma-like methionine, and choline is rapidly oxidised to betaine.",
    "body": [
      "Rodent anchor for the PEMT share of hepatic PC synthesis."
    ],
    "evidence": "plausible",
    "authors": [
      "Sundler R",
      "Akesson B"
    ],
    "year": 1975,
    "journal": "The Journal of biological chemistry",
    "doi": "10.1016/s0021-9258(19)41523-8",
    "pmid": "1123345",
    "url": "https://doi.org/10.1016/s0021-9258(19)41523-8",
    "verified": true,
    "takeaways": [
      "Choline incorporation into PC by the CDP-choline route and methylation of phosphatidylethanolamine were measured side by side in rat hepatocytes.",
      "PEMT contributed 20-40% of the CDP-choline rate at plasma methionine concentrations.",
      "Large amounts of choline were needed to stimulate the CDP route because much was oxidised to betaine."
    ],
    "facts": {
      "design": "animal",
      "population": "Isolated rat hepatocytes"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:pemt",
        "note": "PEMT contributes 20-40% of the CDP-choline rate in rat hepatocytes."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:kennedy-pathway",
        "note": "Main route for hepatic PC synthesis."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:choline-oxidation",
        "note": "Choline is rapidly oxidised to betaine in hepatocytes."
      }
    ]
  },
  {
    "id": "article:pynn-2011-human-pemt-flux",
    "type": "article",
    "name": "Specificity and rate of human and mouse liver and plasma phosphatidylcholine synthesis analyzed in vivo",
    "aliases": [
      "Pynn 2011"
    ],
    "summary": "d9-choline given by IV infusion to four volunteers: PEMT-derived PC appeared in plasma at 0.53%/h of the pool (mouse liver 5.0%/h) and favoured polyunsaturated, DHA-containing PC.",
    "body": [
      "Only direct human measurement of the [[enzyme:pemt|PEMT]] pathway rate (as a fractional rate)."
    ],
    "evidence": "plausible",
    "authors": [
      "Pynn CJ",
      "Henderson NG",
      "Clark H",
      "Koster G",
      "Bernhard W",
      "Postle AD"
    ],
    "year": 2011,
    "journal": "Journal of lipid research",
    "doi": "10.1194/jlr.d011916",
    "pmid": "21068006",
    "url": "https://doi.org/10.1194/jlr.d011916",
    "verified": true,
    "takeaways": [
      "Four healthy volunteers received 3.6 mg/kg of methyl-d9 choline over 3 hours; label in plasma phosphatidylcholine species was followed for a week.",
      "Plasma PC made by the PEMT route accumulated at 0.53%/h, taken as a surrogate for human liver PEMT flux (mouse liver 5.04%/h, mouse plasma 4.71%/h).",
      "PEMT synthesis was specific to polyunsaturated, DHA-containing species."
    ],
    "facts": {
      "design": "tracer-study",
      "population": "Four healthy human volunteers plus mice"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:pemt",
        "note": "Human PEMT pathway flux 0.53%/h of liver PC pool."
      },
      {
        "rel": "evidence-for",
        "to": "compound:phosphatidylcholine",
        "note": "PEMT-derived PC is polyunsaturated."
      },
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "d9-choline tracer fate."
      }
    ]
  },
  {
    "id": "article:ogawa-1983-gamt-rat-liver",
    "type": "article",
    "name": "Guanidoacetate methyltransferase from rat liver: purification, properties, and evidence for the involvement of sulfhydryl groups for activity",
    "aliases": [
      "Ogawa 1983"
    ],
    "summary": "Rat liver guanidinoacetate methyltransferase (monomer, 26 kDa) needs reduced thiols; Km 6.7 uM for SAM and 97.5 uM for guanidinoacetate at pH 8.0, 37 C.",
    "body": [
      "Km values for the [[enzyme:gamt|GAMT]] rate law (creatine synthesis)."
    ],
    "evidence": "plausible",
    "authors": [
      "Ogawa H",
      "Ishiguro Y",
      "Fujioka M"
    ],
    "year": 1983,
    "journal": "Archives of biochemistry and biophysics",
    "doi": "10.1016/0003-9861(83)90293-x",
    "pmid": "6639053",
    "url": "https://doi.org/10.1016/0003-9861(83)90293-x",
    "verified": true,
    "takeaways": [
      "GAMT was purified about 800-fold; the isolated enzyme is inactive until reduced by a thiol, and oxidised glutathione inactivates it.",
      "The oxidised enzyme fails to bind SAM.",
      "Km values are 6.73 uM for S-adenosylmethionine and 97.5 uM for guanidinoacetate."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Rat liver GAMT"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:gamt",
        "note": "Km(SAM) 6.73 uM and Km(guanidinoacetate) 97.5 uM."
      },
      {
        "rel": "evidence-for",
        "to": "compound:guanidinoacetate",
        "note": "Substrate Km 97.5 uM."
      }
    ]
  },
  {
    "id": "article:gross-1986-agat-human-kidney",
    "type": "article",
    "name": "The purification and characterization of human kidney L-arginine:glycine amidinotransferase",
    "aliases": [
      "Gross 1986"
    ],
    "summary": "Purified human kidney AGAT is an 89 kDa dimer with Km 2.5 mM for both arginine and glycine and Vmax 0.5 umol ornithine/min/mg.",
    "body": [
      "Km values for the [[enzyme:gatm|AGAT]] step of creatine synthesis."
    ],
    "evidence": "plausible",
    "authors": [
      "Gross MD",
      "Eggen MA",
      "Simon AM",
      "Van Pilsum JF"
    ],
    "year": 1986,
    "journal": "Archives of biochemistry and biophysics",
    "doi": "10.1016/0003-9861(86)90385-1",
    "pmid": "3800397",
    "url": "https://doi.org/10.1016/0003-9861(86)90385-1",
    "verified": true,
    "takeaways": [
      "Human kidney L-arginine:glycine amidinotransferase was purified about 90-fold to homogeneity.",
      "Both substrates have a Km of 2.5 mM, far above plasma glycine, so the enzyme runs unsaturated.",
      "Properties resemble the rat kidney enzyme."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Human kidney"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:gatm",
        "note": "Human kidney AGAT Km 2.5 mM for glycine and arginine."
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Km(glycine) 2.5 mM."
      }
    ]
  },
  {
    "id": "article:mcguire-1984-agat-creatine-repression",
    "type": "article",
    "name": "Repression of rat kidney L-arginine:glycine amidinotransferase synthesis by creatine at a pretranslational level",
    "aliases": [
      "McGuire 1984"
    ],
    "summary": "In rats a 0.3% creatine diet leaves 26% of kidney AGAT activity (synthesis rate 21%, mRNA 37%): creatine represses the enzyme before translation.",
    "body": [
      "Basis for the high-creatine scenario in the SAM budget (animal data only)."
    ],
    "evidence": "plausible",
    "authors": [
      "McGuire DM",
      "Gross MD",
      "Van Pilsum JF",
      "Towle HC"
    ],
    "year": 1984,
    "journal": "The Journal of biological chemistry",
    "doi": "10.1016/s0021-9258(20)71316-5",
    "pmid": "6384218",
    "url": "https://doi.org/10.1016/s0021-9258(20)71316-5",
    "verified": true,
    "takeaways": [
      "Dietary creatine lowered kidney transamidinase activity to about a quarter of control.",
      "The fall was matched by lower enzyme synthesis and lower mRNA, so the control is pretranslational.",
      "Creatine intake therefore reduces endogenous (SAM-consuming) creatine synthesis."
    ],
    "facts": {
      "design": "animal",
      "population": "Rats on creatine-supplemented diets"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:gatm",
        "note": "Creatine represses AGAT."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:creatine-supplement",
        "note": "Supplementation lowers endogenous synthesis (rat)."
      },
      {
        "rel": "evidence-for",
        "to": "compound:creatine",
        "note": "End-product repression."
      }
    ]
  },
  {
    "id": "article:aksoy-1994-human-nnmt",
    "type": "article",
    "name": "Human liver nicotinamide N-methyltransferase. cDNA cloning, expression, and biochemical characterization",
    "aliases": [
      "Aksoy 1994"
    ],
    "summary": "Human liver NNMT cDNA cloned and expressed: Km 0.43 mM for nicotinamide and 1.8 uM for SAM in liver, 0.38 mM and 2.2 uM in COS-1 cells; N1-methylnicotinamide inhibits (IC50 30-60 uM).",
    "body": [
      "Kinetic constants of [[enzyme:nnmt|NNMT]]."
    ],
    "evidence": "plausible",
    "authors": [
      "Aksoy S",
      "Szumlanski CL",
      "Weinshilboum RM"
    ],
    "year": 1994,
    "journal": "The Journal of biological chemistry",
    "doi": "10.1016/s0021-9258(17)36700-5",
    "pmid": "8182091",
    "url": "https://doi.org/10.1016/s0021-9258(17)36700-5",
    "verified": true,
    "takeaways": [
      "Human liver and transfected COS-1 NNMT had similar apparent Km values for the cosubstrates.",
      "Nicotinamide Km is about 0.4 mM and SAM Km about 2 uM.",
      "The methylated product N1-methylnicotinamide is a product inhibitor with an IC50 of 30-60 uM.",
      "Liver NNMT activity has a bimodal distribution in people."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Human liver and transfected cells"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:nnmt",
        "note": "Km(nicotinamide) 0.43 mM, Km(SAM) 1.8 uM, product IC50 60 uM."
      },
      {
        "rel": "evidence-for",
        "to": "compound:nicotinamide",
        "note": "Substrate with high Km."
      },
      {
        "rel": "evidence-for",
        "to": "compound:1-methylnicotinamide",
        "note": "Product inhibitor, IC50 30-60 uM."
      }
    ]
  },
  {
    "id": "article:peng-2011-nnmt-structure-kinetics",
    "type": "article",
    "name": "Structural basis of substrate recognition in human nicotinamide N-methyltransferase",
    "aliases": [
      "Peng 2011"
    ],
    "summary": "Crystal structures and kinetics of human NNMT: a triple mutant has Km 0.105 mM for nicotinamide and 5.0 uM for AdoMet at pH 8.6 and 37 C, kcat 0.083 per second.",
    "body": [
      "Upper end of the Km(SAM) range for [[enzyme:nnmt|NNMT]]."
    ],
    "evidence": "plausible",
    "authors": [
      "Peng Y",
      "Sartini D",
      "Pozzi V",
      "Wilk D",
      "Emanuelli M",
      "Yee VC"
    ],
    "year": 2011,
    "journal": "Biochemistry",
    "doi": "10.1021/bi2007614",
    "pmid": "21823666",
    "url": "https://doi.org/10.1021/bi2007614",
    "verified": true,
    "takeaways": [
      "The paper reports ternary complexes with nicotinamide and SAH and uses a mutant to obtain crystals.",
      "Table 3 lists wild-type values from the earlier literature (0.43 mM, 1.8 uM) alongside the mutant.",
      "The SAM Km of the mutant is about 2.5 times the earlier wild-type value, probably reflecting the mutations and different conditions."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Recombinant human NNMT"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:nnmt",
        "note": "Mutant Km(SAM) 5.0 uM."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam",
        "note": "Low-uM SAM affinity."
      }
    ]
  },
  {
    "id": "article:lotta-1995-comt-kinetics",
    "type": "article",
    "name": "Kinetics of human soluble and membrane-bound catechol O-methyltransferase: a revised mechanism and description of the thermolabile variant of the enzyme",
    "aliases": [
      "Lotta 1995"
    ],
    "summary": "Recombinant human soluble and membrane-bound COMT: SAM dissociation constants 20.2 uM (soluble) and 3.4 uM (membrane-bound); soluble COMT has ~15x higher Km for catecholamines.",
    "body": [
      "SAM affinity of [[enzyme:comt|COMT]], a minor methyl sink."
    ],
    "evidence": "plausible",
    "authors": [
      "Lotta T",
      "Vidgren J",
      "Tilgmann C",
      "Ulmanen I",
      "Melén K",
      "Julkunen I",
      "Taskinen J"
    ],
    "year": 1995,
    "journal": "Biochemistry",
    "doi": "10.1021/bi00013a008",
    "pmid": "7703232",
    "url": "https://doi.org/10.1021/bi00013a008",
    "verified": true,
    "takeaways": [
      "Both COMT forms were expressed in E. coli and insect cells and compared with tight-binding inhibitors to count active sites.",
      "The membrane-bound form binds AdoMet about six times more tightly (Ks 3.4 vs 20.2 uM).",
      "Soluble COMT has higher Vmax but about fifteen times higher Km for catecholamine substrates."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Recombinant human COMT"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:comt",
        "note": "Ks(SAM) 3.4 and 20.2 uM."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam",
        "note": "COMT binds SAM in the low-uM range."
      }
    ]
  },
  {
    "id": "article:horton-2001-hnmt-structure-kinetics",
    "type": "article",
    "name": "Two polymorphic forms of human histamine methyltransferase: structural, thermal, and kinetic comparisons",
    "aliases": [
      "Horton 2001"
    ],
    "summary": "Crystal structure and kinetics of human HNMT (Thr105Ile): Km histamine 3.7-4.7 uM and SAM 13-24 uM; SAH competitive with Ki 6.9-9.0 uM; tables compare other human preparations.",
    "body": [
      "Km and Ki set for the [[enzyme:hnmt|HNMT]] law and its SAM:SAH dependence."
    ],
    "evidence": "established",
    "authors": [
      "Horton JR",
      "Sawada K",
      "Nishibori M",
      "Zhang X",
      "Cheng X"
    ],
    "year": 2001,
    "journal": "Structure (London, England : 1993)",
    "doi": "10.1016/s0969-2126(01)00643-8",
    "pmid": "11566133",
    "url": "https://doi.org/10.1016/s0969-2126(01)00643-8",
    "verified": true,
    "takeaways": [
      "The Thr105 form has Km(histamine) 3.7 uM and Km(AdoMet) 13.1 uM; the Ile105 variant 4.7 and 23.6 uM with lower stability.",
      "S-adenosylhomocysteine is a competitive inhibitor against AdoMet with Ki 6.9 uM (Ile105: 9.0 uM); the product methylhistamine has Ki about 6 uM.",
      "Reported Km values for native human kidney and COS-1 enzyme are 2-10 uM for AdoMet and 13-25 uM for histamine, so the preparation matters."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Recombinant human HNMT"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:hnmt",
        "note": "Km(histamine), Km(SAM) and Ki(SAH)."
      },
      {
        "rel": "evidence-for",
        "to": "compound:histamine",
        "note": "Km 3.7 uM (recombinant)."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sah",
        "note": "Competitive inhibitor with Ki 6.9 uM."
      }
    ]
  },
  {
    "id": "article:girard-1994-hnmt-kidney-cdna",
    "type": "article",
    "name": "Human histamine N-methyltransferase pharmacogenetics: cloning and expression of kidney cDNA",
    "aliases": [
      "Girard 1994"
    ],
    "summary": "Human kidney HNMT cDNA expressed in COS-1 cells: Km for histamine 14-20 uM and for SAM 2.0-6.2 uM, similar to native kidney enzyme.",
    "body": [
      "Native-enzyme Km range for [[enzyme:hnmt|HNMT]]."
    ],
    "evidence": "plausible",
    "authors": [
      "Girard B",
      "Otterness DM",
      "Wood TC",
      "Honchel R",
      "Wieben ED",
      "Weinshilboum RM"
    ],
    "year": 1994,
    "journal": "Molecular pharmacology",
    "doi": "10.1016/s0026-895x(25)10018-7",
    "pmid": "8145732",
    "url": "https://doi.org/10.1016/s0026-895x(25)10018-7",
    "verified": true,
    "takeaways": [
      "Cloned from a human kidney library; the protein is 292 amino acids and 84% identical to rat kidney HNMT.",
      "Human renal cortical, purified renal and transfected-cell HNMT had Km(histamine) 20, 13 and 14 uM and Km(AdoMet) about 2, 3 and 6 uM.",
      "The work set the stage for the HNMT polymorphism that explains the genetic control of red-cell activity."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Human kidney and transfected COS-1 cells"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:hnmt",
        "note": "Native human HNMT Km values."
      },
      {
        "rel": "evidence-for",
        "to": "compound:histamine",
        "note": "Km 13-20 uM."
      }
    ]
  },
  {
    "id": "article:pradhan-1999-dnmt1-kinetics",
    "type": "article",
    "name": "Recombinant human DNA (cytosine-5) methyltransferase. I. Expression, purification, and comparison of de novo and maintenance methylation",
    "aliases": [
      "Pradhan 1999"
    ],
    "summary": "Recombinant human DNMT1: Km(AdoMet) 2.6-7.2 uM, Km(CG) 0.33-1.32 uM, kcat 1.2-2.3 per hour on unmethylated and 8.3-49 on hemimethylated DNA (7-21-fold preference).",
    "body": [
      "Km(SAM) for the DNMT1 minor sink."
    ],
    "evidence": "plausible",
    "authors": [
      "Pradhan S",
      "Bacolla A",
      "Wells RD",
      "Roberts RJ"
    ],
    "year": 1999,
    "journal": "The Journal of biological chemistry",
    "doi": "10.1074/jbc.274.46.33002",
    "pmid": "10551868",
    "url": "https://doi.org/10.1074/jbc.274.46.33002",
    "verified": true,
    "takeaways": [
      "Human DNMT1 was expressed and purified from insect cells without an affinity tag.",
      "Steady-state kinetics gave a Michaelis constant for AdoMet of 2.6-7.2 uM depending on substrate.",
      "The enzyme is slow (turnover 1-240 per hour) and strongly prefers hemimethylated DNA."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Recombinant human DNMT1"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:sam",
        "note": "DNMT1 Km(AdoMet) 2.6-7.2 uM; almost never SAM-limited."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:global-dna-methylation",
        "note": "Kinetic basis for DNA methylation capacity."
      }
    ]
  },
  {
    "id": "article:gros-2013-dnmt1-kinetics",
    "type": "article",
    "name": "Development of a universal radioactive DNA methyltransferase inhibition test for high-throughput screening and mechanistic studies",
    "aliases": [
      "Gros 2013"
    ],
    "summary": "A radioactive DNA methyltransferase test for high-throughput screening also gives kinetics of human DNMT1: Km(SAM) 4.4 uM and Km(hemimethylated DNA) 0.27 uM.",
    "body": [
      "Point estimate for DNMT1 Km(SAM)."
    ],
    "evidence": "plausible",
    "authors": [
      "Gros C",
      "Chauvigné L",
      "Poulet A",
      "Menon Y",
      "Ausseil F",
      "Dufau I",
      "Arimondo PB"
    ],
    "year": 2013,
    "journal": "Nucleic acids research",
    "doi": "10.1093/nar/gkt753",
    "pmid": "23980028",
    "url": "https://doi.org/10.1093/nar/gkt753",
    "verified": true,
    "takeaways": [
      "The assay uses a radiolabelled methyl donor and a hemimethylated DNA duplex with human His-tagged DNMT1.",
      "The Km for AdoMet was 4.4 +/- 0.5 uM, within the Pradhan range."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Recombinant human DNMT1"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:sam",
        "note": "DNMT1 Km(AdoMet) 4.4 uM."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:global-dna-methylation",
        "note": "DNA methylation capacity."
      }
    ]
  },
  {
    "id": "article:menon-2007-niacin-er-pharmacokinetics",
    "type": "article",
    "name": "Plasma and urine pharmacokinetics of niacin and its metabolites from an extended-release niacin formulation",
    "aliases": [
      "Menon 2007"
    ],
    "summary": "After 2 g extended-release niacin in 12 men, 69.5% of the dose reached urine in 96 h: 2-pyridone 37.9%, MNA 16.0%, nicotinuric acid 11.6%, unchanged niacin 3.2%.",
    "body": [
      "Quantifies how much niacin is methylated (and so how much SAM methyl is drawn) for the [[claim:niacin-drains-methyl-groups|niacin methyl-drain claim]]."
    ],
    "evidence": "plausible",
    "authors": [
      "Menon RM",
      "Adams MH",
      "González MA",
      "Tolbert DS",
      "Leu JH",
      "Cefali EA"
    ],
    "year": 2007,
    "journal": "International journal of clinical pharmacology and therapeutics",
    "doi": "10.5414/cpp45448",
    "pmid": "17725178",
    "url": "https://doi.org/10.5414/cpp45448",
    "verified": true,
    "takeaways": [
      "Plasma niacin peaked at 4.6 h; terminal half-lives were 0.9 h (niacin), 1.3 h (nicotinuric acid) and 4.3 h (nicotinamide).",
      "Urinary N-methyl-2-pyridone-5-carboxamide and N-methylnicotinamide, both products of nicotinamide methylation, made up 53.9% of the dose.",
      "Those two methylated products had urinary half-lives near 12.7 h.",
      "About 30% of the dose was not recovered, so the methylated share is a lower bound."
    ],
    "facts": {
      "design": "pharmacokinetic study",
      "population": "Twelve healthy men, 2 g extended-release niacin"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:niacin",
        "note": "More than half of a 2 g dose is excreted as methylated metabolites."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:nnmt",
        "note": "Methylation to MNA and 2PY."
      },
      {
        "rel": "evidence-for",
        "to": "claim:niacin-drains-methyl-groups",
        "note": "Supplies the size of the methyl demand (~9 mmol/day at 2 g/day); no SAM measurement."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:niacin-nicotinamide-supplement",
        "note": "Dose-dependent methyl load."
      }
    ]
  },
  {
    "id": "article:garg-1999-niacin-homocysteine",
    "type": "article",
    "name": "Niacin treatment increases plasma homocyst(e)ine levels",
    "aliases": [
      "Garg 1999"
    ],
    "summary": "In 52 patients with peripheral arterial disease, niacin titrated to 1 g/day raised plasma homocysteine from 13.1 to 15.3 uM and by 55% vs a 7% fall on placebo at 18 weeks; folic acid lowered it.",
    "body": [
      "Only human methyl-pool readout after niacin (a homocysteine rise)."
    ],
    "evidence": "plausible",
    "authors": [
      "Garg R",
      "Malinow M",
      "Pettinger M",
      "Upson B",
      "Hunninghake D"
    ],
    "year": 1999,
    "journal": "American heart journal",
    "doi": "10.1016/s0002-8703(99)70073-6",
    "pmid": "10577438",
    "url": "https://doi.org/10.1016/s0002-8703(99)70073-6",
    "verified": true,
    "takeaways": [
      "A randomised trial in patients with peripheral arterial disease combining niacin with folic acid.",
      "During titration of niacin from 100 to 1000 mg/day, tHcy rose 17%; at 18 weeks the niacin arm was up 55% against a 7% fall with placebo.",
      "Folic acid supplementation lowered homocysteine, pointing to a methyl-group demand effect of niacin.",
      "SAM and SAH were not measured."
    ],
    "facts": {
      "design": "RCT",
      "population": "52 patients with peripheral arterial disease"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:niacin",
        "note": "High-dose niacin raised plasma homocysteine."
      },
      {
        "rel": "evidence-for",
        "to": "compound:homocysteine",
        "note": "Rise of 17-55%."
      },
      {
        "rel": "evidence-for",
        "to": "claim:niacin-drains-methyl-groups",
        "note": "Consistent with a methyl demand effect; indirect."
      }
    ]
  },
  {
    "id": "article:basu-2002-niacin-rat-homocysteine",
    "type": "article",
    "name": "Niacin (nicotinic acid) in non-physiological doses causes hyperhomocysteineaemia in Sprague-Dawley rats",
    "aliases": [
      "Basu 2002"
    ],
    "summary": "In rats a diet with 1000 mg niacin/kg for 3 months raised plasma and urinary homocysteine and lowered plasma B6 and B12.",
    "body": [
      "Rodent support for the niacin methyl-drain hypothesis."
    ],
    "evidence": "plausible",
    "authors": [
      "Basu TK",
      "Makhani N",
      "Sedgwick G"
    ],
    "year": 2002,
    "journal": "The British journal of nutrition",
    "doi": "10.1079/bjn2001486",
    "pmid": "11895163",
    "url": "https://doi.org/10.1079/bjn2001486",
    "verified": true,
    "takeaways": [
      "Sprague-Dawley rats ate niacin-enriched diets for three months.",
      "Plasma and urinary total homocysteine rose, while plasma vitamin B6 and B12 fell.",
      "Rodent evidence that high niacin intake draws on methyl and B-vitamin supply."
    ],
    "facts": {
      "design": "animal",
      "population": "Rats on high-niacin diets"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:niacin",
        "note": "High niacin raised homocysteine in rats."
      },
      {
        "rel": "evidence-for",
        "to": "claim:niacin-drains-methyl-groups",
        "note": "Animal data only."
      }
    ]
  },
  {
    "id": "article:bravo-2022-sam-sah-reference-values",
    "type": "article",
    "name": "Analysis of S-Adenosylmethionine and S-Adenosylhomocysteine: Method Optimisation and Profiling in Healthy Adults upon Short-Term Dietary Intervention",
    "aliases": [
      "Bravo 2022"
    ],
    "summary": "LC-MS/MS plasma reference values in 33 healthy adults: SAM 120.6 +/- 18.1 nM, SAH 21.5 +/- 3.3 nM, SAM:SAH 5.6 +/- 1.0, with a table comparing earlier studies.",
    "body": [
      "Plasma SAM:SAH observable for the [[outcome:low-sam-sah-ratio|SAM:SAH ratio]]."
    ],
    "evidence": "plausible",
    "authors": [
      "Bravo AC",
      "Aguilera MNL",
      "Marziali NR",
      "Moritz L",
      "Wingert V",
      "Klotz K",
      "Schumann A",
      "Grünert SC",
      "Spiekerkoetter U",
      "Berger U",
      "Lederer AK",
      "Huber R",
      "Hannibal L"
    ],
    "year": 2022,
    "journal": "Metabolites",
    "doi": "10.3390/metabo12050373",
    "pmid": "35629877",
    "url": "https://doi.org/10.3390/metabo12050373",
    "verified": true,
    "takeaways": [
      "A validated method and reference intervals for plasma SAM, SAH and their ratio.",
      "Earlier LC-MS/MS and HPLC studies report SAM 73.5-120 nM and SAH 12.7-46.5 nM.",
      "The ratio is stable even when absolute values differ with pre-analytical handling."
    ],
    "facts": {
      "design": "analytical method",
      "population": "33 healthy adults"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "outcome:low-sam-sah-ratio",
        "note": "Plasma SAM:SAH 5.6 +/- 1.0 in healthy adults."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam",
        "note": "Plasma SAM ~121 nM."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sah",
        "note": "Plasma SAH ~21.5 nM."
      }
    ]
  },
  {
    "id": "article:bortz-2025-methyl-shuttling-folate-choline",
    "type": "article",
    "name": "The Shuttling of Methyl Groups Between Folate and Choline Pathways",
    "aliases": [
      "Bortz 2025"
    ],
    "summary": "Review of folate-choline methyl shuttling: body methyl flux 16.7-23.4 mmol/day (Mudd 2007), PEMT-mediated PC synthesis may use ~5 mmol SAM/day, and BHMT is said to supply about half of cellular SAM.",
    "body": [
      "Secondary source (with page-accessible full text) for the Mudd 2007 and Stead 2006 figures used in the [[pathway:methyl-budget|methyl budget]]."
    ],
    "evidence": "plausible",
    "authors": [
      "Bortz J",
      "Obeid R"
    ],
    "year": 2025,
    "journal": "Nutrients",
    "doi": "10.3390/nu17152495",
    "pmid": "40806080",
    "url": "https://doi.org/10.3390/nu17152495",
    "verified": true,
    "takeaways": [
      "Quotes a daily methyl flux of 16.7-23.4 mmol for a 70 kg adult from stable-isotope infusions combining fasting and fed periods.",
      "Biliary phosphatidylcholine excretion was estimated to consume 5 mmol SAM per day, but it is unknown whether that PC is reabsorbed.",
      "Fasting homocysteine is mostly determined by folate, whereas choline and betaine show up in the post-methionine-load response.",
      "The abstract states that about 50% of cellular SAM comes through BHMT; the tracer study of Davis 2004 instead assigns almost all remethylation methyls to serine."
    ],
    "facts": {
      "design": "review",
      "population": "Narrative review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:methyl-budget",
        "note": "Quotes 16.7-23.4 mmol/day total methyl flux and ~5 mmol/day PEMT SAM use."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:bhmt",
        "note": "States that ~50% of cellular SAM is provided via BHMT; contrast with Davis 2004."
      },
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "Folate-choline methyl shuttling."
      }
    ]
  },
  {
    "id": "article:tsuge-1980-choline-dehydrogenase-rat-liver",
    "type": "article",
    "name": "A novel purification and some properties of rat liver mitochondrial choline dehydrogenase",
    "aliases": [
      "Tsuge 1980"
    ],
    "summary": "Rat liver mitochondrial choline dehydrogenase purified 240-fold: Km for choline 7.0 mM (PMS acceptor, pH 7.6, 30 C); dimethylaminoethanol is a competitive inhibitor (Ki 1.0 mM).",
    "body": [
      "Only quantitative CHDH Km in the set (rat, artificial acceptor), for [[enzyme:chdh|CHDH]]."
    ],
    "evidence": "plausible",
    "authors": [
      "Tsuge H",
      "Nakano Y",
      "Onishi H",
      "Futamura Y",
      "Ohashi K"
    ],
    "year": 1980,
    "journal": "Biochimica et biophysica acta",
    "doi": "10.1016/0005-2744(80)90217-x",
    "pmid": "6996732",
    "url": "https://doi.org/10.1016/0005-2744(80)90217-x",
    "verified": true,
    "takeaways": [
      "The enzyme is a flavoprotein that uses phenazine methosulfate as an artificial electron acceptor in vitro; coenzyme Q is the likely acceptor in vivo.",
      "Km for choline is 7.0 mM and specific activity 6.3 umol O2/min/mg.",
      "Dimethylaminoethanol competes with choline (Ki 1.0 mM)."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Rat liver mitochondria"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:chdh",
        "note": "Km(choline) 7.0 mM (rat)."
      },
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "First step of choline oxidation to betaine."
      }
    ]
  },
  {
    "id": "article:salvi-2013-choline-oxidation-review",
    "type": "article",
    "name": "Human choline dehydrogenase: medical promises and biochemical challenges",
    "aliases": [
      "Salvi 2013"
    ],
    "summary": "Review of choline oxidation: human choline dehydrogenase is most abundant in kidney (about 6-fold higher than liver); kinetic data come from crude rat preparations and no pure human enzyme exists.",
    "body": [
      "Caveat for [[enzyme:chdh|CHDH]] kinetics: no human enzyme kinetics and tissue distribution differs from rodents."
    ],
    "evidence": "established",
    "authors": [
      "Salvi F",
      "Gadda G"
    ],
    "year": 2013,
    "journal": "Archives of biochemistry and biophysics",
    "doi": "10.1016/j.abb.2013.07.018",
    "pmid": "23906661",
    "url": "https://doi.org/10.1016/j.abb.2013.07.018",
    "verified": true,
    "takeaways": [
      "Choline oxidation to betaine by CHDH and betaine aldehyde dehydrogenase is the committed route for choline as a methyl donor and osmolyte precursor.",
      "In human tissue activity is highest in kidney and about six times lower in liver; none was detected in muscle or fat (primary report: Haubrich & Gerber 1981).",
      "Kinetic constants are from crude rat mitochondria; mechanism work uses bacterial homologues."
    ],
    "facts": {
      "design": "review",
      "population": "Review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:chdh",
        "note": "Tissue distribution and state of kinetic knowledge."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:choline-oxidation",
        "note": "Overview of the oxidation pathway."
      }
    ]
  },
  {
    "id": "article:brocker-2010-aldh7a1-betaine-aldehyde",
    "type": "article",
    "name": "Aldehyde dehydrogenase 7A1 (ALDH7A1) is a novel enzyme involved in cellular defense against hyperosmotic stress",
    "aliases": [
      "Brocker 2010"
    ],
    "summary": "Human recombinant ALDH7A1 oxidises betaine aldehyde with Km 41 uM and Vmax 101 nmol NADH/min/mg; the enzyme occurs in cytosol, nucleus and mitochondria.",
    "body": [
      "Km of the betaine aldehyde step ([[enzyme:aldh7a1|ALDH7A1]])."
    ],
    "evidence": "plausible",
    "authors": [
      "Brocker C",
      "Lassen N",
      "Estey T",
      "Pappa A",
      "Cantore M",
      "Orlova VV",
      "Chavakis T",
      "Kavanagh KL",
      "Oppermann U",
      "Vasiliou V"
    ],
    "year": 2010,
    "journal": "The Journal of biological chemistry",
    "doi": "10.1074/jbc.m109.077925",
    "pmid": "20207735",
    "url": "https://doi.org/10.1074/jbc.m109.077925",
    "verified": true,
    "takeaways": [
      "ALDH7A1 (antiquitin) was characterised with several aldehydes: betaine aldehyde Km 41.1 +/- 9.3 uM, nonanal 28.5 uM, alpha-aminoadipic semialdehyde 169 uM.",
      "It has a role as a betaine aldehyde dehydrogenase and in lysine catabolism, and is cytosolic, nuclear and mitochondrial.",
      "The low Km means betaine aldehyde is oxidised as fast as CHDH makes it."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Recombinant human ALDH7A1"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:aldh7a1",
        "note": "Km(betaine aldehyde) 41 uM."
      },
      {
        "rel": "evidence-for",
        "to": "compound:betaine-aldehyde",
        "note": "Rapidly oxidised substrate."
      }
    ]
  },
  {
    "id": "article:wang-1991-bhmt-human-tissues",
    "type": "article",
    "name": "Betaine:homocysteine methyltransferase--a new assay for the liver enzyme and its absence from human skin fibroblasts and peripheral blood lymphocytes",
    "aliases": [
      "Wang 1991"
    ],
    "summary": "Human liver BHMT activity is 33.4 nmol/h/mg protein at 37 C (chicken liver 50.4, lamb 6.2); it is below 1.4 in lymphocytes and fibroblasts.",
    "body": [
      "Human liver BHMT specific activity, for scaling [[enzyme:bhmt|BHMT]] Vmax."
    ],
    "evidence": "plausible",
    "authors": [
      "Wang JA",
      "Dudman NP",
      "Lynch J",
      "Wilcken DE"
    ],
    "year": 1991,
    "journal": "Clinica chimica acta; international journal of clinical chemistry",
    "doi": "10.1016/0009-8981(91)90235-5",
    "pmid": "1819467",
    "url": "https://doi.org/10.1016/0009-8981(91)90235-5",
    "verified": true,
    "takeaways": [
      "BHMT activity was assayed in human tissues and cells at 37 C and pH 7.4.",
      "Human liver is the only tissue with substantial activity among those tested; lymphocytes and fibroblasts have almost none.",
      "Cells that lack BHMT depend entirely on methionine synthase for homocysteine remethylation."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Human tissues"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:bhmt",
        "note": "Human liver activity 33.4 nmol/h/mg."
      },
      {
        "rel": "evidence-for",
        "to": "system:liver",
        "note": "Human liver is the main BHMT-expressing tissue."
      }
    ]
  },
  {
    "id": "article:augustin-2016-human-dmgdh",
    "type": "article",
    "name": "Structure and biochemical properties of recombinant human dimethylglycine dehydrogenase and comparison to the disease-related H109R variant",
    "aliases": [
      "Augustin 2016"
    ],
    "summary": "Human recombinant dimethylglycine dehydrogenase: Km for DMG 0.3-1.4 mM depending on the electron acceptor, kcat 44-213 per minute; the H109R variant has a 15-25-fold higher Km.",
    "body": [
      "Km and kcat for [[enzyme:dmgdh|DMGDH]]."
    ],
    "evidence": "plausible",
    "authors": [
      "Augustin P",
      "Hromic A",
      "Pavkov-Keller T",
      "Gruber K",
      "Macheroux P"
    ],
    "year": 2016,
    "journal": "The FEBS journal",
    "doi": "10.1111/febs.13828",
    "pmid": "27486859",
    "url": "https://doi.org/10.1111/febs.13828",
    "verified": true,
    "takeaways": [
      "A mitochondrial flavoenzyme that demethylates dimethylglycine to sarcosine and transfers the methyl group to tetrahydrofolate.",
      "Km is 0.3 mM (DCPIP assay) or 1.4 mM (ferrocene); earlier human values were 0.04 mM.",
      "A second apparent low-affinity Km (~30 mM) is attributed to the assay.",
      "Reoxidation of the flavin is rate limiting."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Human recombinant DMGDH"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:dmgdh",
        "note": "Km(DMG) 0.3-1.4 mM."
      },
      {
        "rel": "evidence-for",
        "to": "compound:dimethylglycine",
        "note": "Substrate."
      }
    ]
  },
  {
    "id": "article:porter-1985-dmgdh-sardh-rat",
    "type": "article",
    "name": "Enzymatic properties of dimethylglycine dehydrogenase and sarcosine dehydrogenase from rat liver",
    "aliases": [
      "Porter 1985"
    ],
    "summary": "Rat liver dimethylglycine and sarcosine dehydrogenases: DMGDH Km about 0.05 mM, sarcosine dehydrogenase Km 0.5 mM; methoxyacetate inhibits SARDH (Ki 0.26 mM).",
    "body": [
      "Only quantitative SARDH Km in the set (rat), for [[enzyme:sardh|SARDH]]."
    ],
    "evidence": "plausible",
    "authors": [
      "Porter DH",
      "Cook RJ",
      "Wagner C"
    ],
    "year": 1985,
    "journal": "Archives of biochemistry and biophysics",
    "doi": "10.1016/0003-9861(85)90516-8",
    "pmid": "2417560",
    "url": "https://doi.org/10.1016/0003-9861(85)90516-8",
    "verified": true,
    "takeaways": [
      "Both dehydrogenases were characterised in rat liver mitochondria.",
      "Dimethylglycine is the preferred substrate of its enzyme; sarcosine and dimethylthetin are poor substrates.",
      "Sarcosine dehydrogenase has Km 0.5 mM for sarcosine."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Rat liver"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:sardh",
        "note": "Rat Km(sarcosine) 0.5 mM."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:dmgdh",
        "note": "Rat DMGDH Km 0.05 mM."
      }
    ]
  },
  {
    "id": "article:gallego-ortega-2009-choline-kinase-isoforms",
    "type": "article",
    "name": "Differential role of human choline kinase alpha and beta enzymes in lipid metabolism: implications in cancer onset and treatment",
    "aliases": [
      "Gallego-Ortega 2009"
    ],
    "summary": "Human recombinant choline kinase alpha prefers choline (Km 0.20 mM) and beta prefers ethanolamine (Km 2.0 vs 0.57 mM for choline); both measured in E. coli lysate.",
    "body": [
      "Entry kinetics of the Kennedy pathway ([[enzyme:choline-kinase|choline kinase]])."
    ],
    "evidence": "plausible",
    "authors": [
      "Gallego-Ortega D",
      "Ramirez de Molina A",
      "Ramos MA",
      "Valdes-Mora F",
      "Barderas MG",
      "Sarmentero-Estrada J",
      "Lacal JC"
    ],
    "year": 2009,
    "journal": "PloS one",
    "doi": "10.1371/journal.pone.0007819",
    "pmid": "19915674",
    "url": "https://doi.org/10.1371/journal.pone.0007819",
    "verified": true,
    "takeaways": [
      "CHK alpha1 has Km(choline) 0.20 +/- 0.04 mM and Km(ethanolamine) 12.0 mM.",
      "CHK beta has Km(choline) 0.57 +/- 0.08 mM and Km(ethanolamine) 2.0 mM.",
      "The two isoforms therefore specialise in choline and ethanolamine phospholipid synthesis."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Human recombinant choline kinase"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:choline-kinase",
        "note": "Isoform Km values for choline."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:kennedy-pathway",
        "note": "First step of the CDP-choline route."
      }
    ]
  },
  {
    "id": "article:odwyer-2020-hepatocyte-choline-uptake",
    "type": "article",
    "name": "Hepatic Choline Transport Is Inhibited During Fatty Acid-Induced Lipotoxicity and Obesity",
    "aliases": [
      "O'Dwyer 2020"
    ],
    "summary": "Mouse primary hepatocytes take up choline with Km 61 uM and Vmax 3.7 nmol/mg/min by a hemicholinium-3-sensitive, quinine-insensitive route; palmitate lowers uptake.",
    "body": [
      "Hepatocyte choline uptake Km (mouse; human not found)."
    ],
    "evidence": "plausible",
    "authors": [
      "O'Dwyer C",
      "Yaworski R",
      "Katsumura S",
      "Ghorbani P",
      "Gobeil Odai K",
      "Nunes JRC",
      "LeBlond ND",
      "Sanjana S",
      "Smith TTK",
      "Han S",
      "Margison KD",
      "Alain T",
      "Morita M",
      "Fullerton MD"
    ],
    "year": 2020,
    "journal": "Hepatology communications",
    "doi": "10.1002/hep4.1516",
    "pmid": "32490323",
    "url": "https://doi.org/10.1002/hep4.1516",
    "verified": true,
    "takeaways": [
      "Choline uptake in hepatocytes is saturable with Km 61.4 +/- 9.6 uM.",
      "It is blocked by hemicholinium-3 and not by an OCT inhibitor.",
      "Fatty acid exposure reduces uptake, linking lipid load to hepatic choline supply."
    ],
    "facts": {
      "design": "in-vitro",
      "population": "Mouse primary hepatocytes"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "Hepatocyte uptake Km 61 uM."
      },
      {
        "rel": "evidence-for",
        "to": "system:liver",
        "note": "Hepatic choline supply."
      }
    ]
  },
  {
    "id": "article:horie-2014-choline-uptake-ls180",
    "type": "article",
    "name": "Membrane transport mechanisms of choline in human intestinal epithelial LS180 cells",
    "aliases": [
      "Horie 2014"
    ],
    "summary": "Human intestinal LS180 cells take up choline by a sodium-independent, saturable route (Km 108 uM) dominated by choline transporter-like protein 1.",
    "body": [
      "Upper bound for choline uptake Km."
    ],
    "evidence": "plausible",
    "authors": [
      "Horie A",
      "Ishida K",
      "Watanabe Y",
      "Shibata K",
      "Hashimoto Y"
    ],
    "year": 2014,
    "journal": "Biopharmaceutics & drug disposition",
    "doi": "10.1002/bdd.1917",
    "pmid": "25256443",
    "url": "https://doi.org/10.1002/bdd.1917",
    "verified": true,
    "takeaways": [
      "Uptake was pH- and energy-dependent and inhibited by structurally related cations.",
      "Km for choline was 108 uM.",
      "CTL1 is the main contributor in this intestinal cell model."
    ],
    "facts": {
      "design": "in-vitro",
      "population": "Human LS180 cells"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "Intestinal uptake Km 108 uM."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:kennedy-pathway",
        "note": "Uptake feeds the CDP-choline route."
      }
    ]
  },
  {
    "id": "article:inazu-2019-choline-transporters-review",
    "type": "article",
    "name": "Functional Expression of Choline Transporters in the Blood-Brain Barrier",
    "aliases": [
      "Inazu 2019"
    ],
    "summary": "Review of choline transporters: CTL1 has intermediate affinity (Km about 35 uM in human brain endothelial cells), CTL2 sits in mitochondria and CHT1 is neuronal with micromolar affinity.",
    "body": [
      "Lower bound for choline uptake Km."
    ],
    "evidence": "established",
    "authors": [
      "Inazu M"
    ],
    "year": 2019,
    "journal": "Nutrients",
    "doi": "10.3390/nu11102265",
    "pmid": "31547050",
    "url": "https://doi.org/10.3390/nu11102265",
    "verified": true,
    "takeaways": [
      "Choline enters cells through high-affinity CHT1, intermediate-affinity CTL1 and low-affinity organic cation transporters.",
      "Km values of 35 uM (CTL1-type) are reported in human brain endothelium.",
      "Transporter expression differs by tissue and so does the cell supply of choline."
    ],
    "facts": {
      "design": "review",
      "population": "Review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "Transporter affinities."
      },
      {
        "rel": "evidence-for",
        "to": "system:vagal-tone",
        "note": "Choline supply to cholinergic neurons depends on CHT1."
      }
    ]
  },
  {
    "id": "article:shen-2011-human-chat-kinetics",
    "type": "article",
    "name": "Functional consequences and structural interpretation of mutations of human choline acetyltransferase",
    "aliases": [
      "Shen 2011"
    ],
    "summary": "Wild-type human choline acetyltransferase: kcat 195 per second, Km(acetyl-CoA) 11.9 uM, Km(choline) 257 uM; used to interpret congenital myasthenic syndrome mutations.",
    "body": [
      "Kinetics for [[enzyme:chat|ChAT]]; acetylcholine is a negligible fraction of choline flux."
    ],
    "evidence": "plausible",
    "authors": [
      "Shen XM",
      "Crawford TO",
      "Brengman J",
      "Acsadi G",
      "Iannaconne S",
      "Karaca E",
      "Khoury C",
      "Mah JK",
      "Edvardson S",
      "Bajzer Z",
      "Rodgers D",
      "Engel AG"
    ],
    "year": 2011,
    "journal": "Human mutation",
    "doi": "10.1002/humu.21560",
    "pmid": "21786365",
    "url": "https://doi.org/10.1002/humu.21560",
    "verified": true,
    "takeaways": [
      "Kinetic constants of the human enzyme were measured with the wild type and 40 mutants.",
      "Km for choline is 257 +/- 32 uM and Km for acetyl-CoA 11.9 +/- 0.8 uM.",
      "The table units were inferred from the stated kcat/Km value."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Human recombinant ChAT"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:chat",
        "note": "Km(choline) 257 uM, kcat 195/s."
      },
      {
        "rel": "evidence-for",
        "to": "compound:acetylcholine",
        "note": "Product."
      }
    ]
  },
  {
    "id": "article:konstantinova-2008-plasma-choline-betaine-hordaland",
    "type": "article",
    "name": "Divergent associations of plasma choline and betaine with components of metabolic syndrome in middle age and elderly men and women",
    "aliases": [
      "Konstantinova 2008"
    ],
    "summary": "In 7074 Norwegians plasma choline averaged 9.9 uM and betaine 39.5 uM; choline rose with adiposity and betaine fell, and both were lower in women and the younger group.",
    "body": [
      "Large-sample plasma choline and betaine for the [[compound:choline|choline]] and [[compound:betaine|betaine]] pools."
    ],
    "evidence": "established",
    "authors": [
      "Konstantinova SV",
      "Tell GS",
      "Vollset SE",
      "Nygård O",
      "Bleie Ø",
      "Ueland PM"
    ],
    "year": 2008,
    "journal": "The Journal of nutrition",
    "doi": "10.1093/jn/138.5.914",
    "pmid": "18424601",
    "url": "https://doi.org/10.1093/jn/138.5.914",
    "verified": true,
    "takeaways": [
      "Population study of two age groups (47-49 and 71-74 years) in the Hordaland Homocysteine Study.",
      "Mean plasma free choline was 9.9 +/- 2.3 uM and betaine 39.5 +/- 12.5 uM.",
      "The opposite association of choline and betaine with adiposity and lipids points to a disturbed choline-to-betaine conversion."
    ],
    "facts": {
      "design": "cohort",
      "population": "7074 adults aged 47-49 and 71-74 years"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "Plasma choline 9.9 uM."
      },
      {
        "rel": "evidence-for",
        "to": "compound:betaine",
        "note": "Plasma betaine 39.5 uM."
      }
    ]
  },
  {
    "id": "article:allen-1993-serum-betaine-dmg-sarcosine",
    "type": "article",
    "name": "Serum betaine, N,N-dimethylglycine and N-methylglycine levels in patients with cobalamin and folate deficiency and related inborn errors of metabolism",
    "aliases": [
      "Allen 1993"
    ],
    "summary": "Serum betaine, dimethylglycine and sarcosine ranges in 60 blood donors (17.6-73.3, 1.42-5.27 and 0.60-2.67 uM) and in patients on betaine therapy (up to 3900, 250 and 49 uM).",
    "body": [
      "Reference ranges for the betaine, DMG and sarcosine pools."
    ],
    "evidence": "established",
    "authors": [
      "Allen RH",
      "Stabler SP",
      "Lindenbaum J"
    ],
    "year": 1993,
    "journal": "Metabolism: clinical and experimental",
    "doi": "10.1016/0026-0495(93)90198-w",
    "pmid": "7694037",
    "url": "https://doi.org/10.1016/0026-0495(93)90198-w",
    "verified": true,
    "takeaways": [
      "Methylglycines were measured by GC-MS in normal subjects, folate-deficient patients and patients on betaine.",
      "Normal ranges: betaine 17.6-73.3 uM, DMG 1.42-5.27 uM, sarcosine 0.60-2.67 uM.",
      "DMG and sarcosine rise in folate deficiency; with betaine therapy betaine reaches 167-3900, DMG 15-250 and sarcosine 2.9-49 uM."
    ],
    "facts": {
      "design": "cross-sectional",
      "population": "60 blood donors plus patients"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:betaine",
        "note": "Serum range 17.6-73.3 uM."
      },
      {
        "rel": "evidence-for",
        "to": "compound:dimethylglycine",
        "note": "Serum range 1.4-5.3 uM."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sarcosine",
        "note": "Serum range 0.6-2.7 uM."
      }
    ]
  },
  {
    "id": "article:lever-2010-betaine-clinical-significance",
    "type": "article",
    "name": "The clinical significance of betaine, an osmolyte with a key role in methyl group metabolism",
    "aliases": [
      "Lever 2010"
    ],
    "summary": "Review of betaine: plasma ranges 20-60 uM in women and 25-75 uM in men, DMG usually below 10 uM, and urinary betaine below 35 mmol/mol creatinine; low plasma betaine is associated with disease.",
    "body": [
      "Reference ranges for plasma [[compound:betaine|betaine]]."
    ],
    "evidence": "established",
    "authors": [
      "Lever M",
      "Slow S"
    ],
    "year": 2010,
    "journal": "Clinical biochemistry",
    "doi": "10.1016/j.clinbiochem.2010.03.009",
    "pmid": "20346934",
    "url": "https://doi.org/10.1016/j.clinbiochem.2010.03.009",
    "verified": true,
    "takeaways": [
      "Betaine is an osmolyte and methyl donor; its plasma concentration is affected by diet, sex and renal function.",
      "Reference intervals: women 20-60 uM, men 25-75 uM; DMG usually under 10 uM.",
      "Renal clearance is low (under 5%), so plasma betaine is regulated mainly by metabolism."
    ],
    "facts": {
      "design": "review",
      "population": "Review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:betaine",
        "note": "Plasma reference ranges by sex."
      },
      {
        "rel": "evidence-for",
        "to": "compound:dimethylglycine",
        "note": "DMG usually below 10 uM."
      }
    ]
  },
  {
    "id": "article:savendahl-1997-fasting-plasma-choline",
    "type": "article",
    "name": "Prolonged fasting in humans results in diminished plasma choline concentrations but does not cause liver dysfunction",
    "aliases": [
      "Savendahl 1997"
    ],
    "summary": "In ten healthy adults plasma free choline was 9.5 uM, fell to 7.8 uM after a 7-day fast, while plasma phosphatidylcholine stayed at about 2.2-2.4 mmol/L.",
    "body": [
      "Plasma choline and phosphatidylcholine reference values."
    ],
    "evidence": "plausible",
    "authors": [
      "Savendahl L",
      "Mar MH",
      "Underwood LE",
      "Zeisel SH"
    ],
    "year": 1997,
    "journal": "The American journal of clinical nutrition",
    "doi": "10.1093/ajcn/66.3.622",
    "pmid": "9280183",
    "url": "https://doi.org/10.1093/ajcn/66.3.622",
    "verified": true,
    "takeaways": [
      "Healthy subjects were studied fed and after seven days of fasting.",
      "Plasma choline fell about 18% on the fast; plasma phosphatidylcholine did not change.",
      "Plasma choline responds to supply but PC is buffered by the liver."
    ],
    "facts": {
      "design": "physiology study",
      "population": "10 healthy adults"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "Plasma choline 9.5 uM; falls 18% on fasting."
      },
      {
        "rel": "evidence-for",
        "to": "compound:phosphatidylcholine",
        "note": "Plasma PC 2.2 mmol/L, unchanged by fasting."
      }
    ]
  },
  {
    "id": "article:modinger-2019-choline-bitartrate-vs-krill-pc",
    "type": "article",
    "name": "Plasma Kinetics of Choline and Choline Metabolites After A Single Dose of Superba Boost (TM) Krill Oil or Choline Bitartrate in Healthy Volunteers",
    "aliases": [
      "Mödinger 2019"
    ],
    "summary": "Crossover in 12 adults: choline bitartrate and krill phosphatidylcholine raised plasma choline 3.7-4.2 uM (2.7-4.2 h) and betaine 19-23 uM (7.7 h); baseline choline 9.6, betaine 33.8, DMG 3.4 uM.",
    "body": [
      "Dose-response check for the choline-to-betaine step, and baseline plasma values."
    ],
    "evidence": "plausible",
    "authors": [
      "Mödinger Y",
      "Schön C",
      "Wilhelm M",
      "Hals PA"
    ],
    "year": 2019,
    "journal": "Nutrients",
    "doi": "10.3390/nu11102548",
    "pmid": "31652561",
    "url": "https://doi.org/10.3390/nu11102548",
    "verified": true,
    "takeaways": [
      "Crossover pharmacokinetics of two choline sources with baseline-corrected plasma choline, betaine, DMG and TMAO.",
      "Free choline peaked earlier with the bitartrate (2.7 h) than the krill phosphatidylcholine (4.2 h).",
      "Betaine rose slowly and peaked at 7.7 h with either source, so betaine is a delayed readout of choline oxidation.",
      "Baseline concentrations: choline 9.6, betaine 33.8, DMG 3.4, TMAO 2.1 uM."
    ],
    "facts": {
      "design": "RCT",
      "population": "12 healthy adults, crossover"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:choline-bitartrate",
        "note": "Faster choline peak than phosphatidylcholine."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:phosphatidylcholine-supplement",
        "note": "Slower, similar betaine response."
      },
      {
        "rel": "evidence-for",
        "to": "compound:betaine",
        "note": "Betaine rises ~19-23 uM, tmax 7.7 h."
      }
    ]
  },
  {
    "id": "article:trujillo-gonzalez-2026-controlled-choline-intake",
    "type": "article",
    "name": "Choline and betaine concentrations in plasma discriminate levels of dietary choline intake in healthy adults: analysis of a double-blind randomized crossover controlled feeding study",
    "aliases": [
      "Trujillo-Gonzalez 2026"
    ],
    "summary": "Controlled-feeding trial of 25%, 50% and 100% of the choline AI with a 2.2 mmol d9-choline bolus: plasma choline and betaine tracked intake, phosphatidylcholine did not.",
    "body": [
      "Plasma betaine and PC across choline intakes."
    ],
    "evidence": "plausible",
    "authors": [
      "Trujillo-Gonzalez I",
      "Horita DA",
      "Stegall J",
      "Coble R",
      "Paules EM",
      "Lulla AA",
      "Baah E",
      "Bottiglieri T",
      "Sha W",
      "Kohlmeier M",
      "Friday WB",
      "Zeisel SH"
    ],
    "year": 2026,
    "journal": "The American journal of clinical nutrition",
    "doi": "10.1016/j.ajcnut.2026.101236",
    "pmid": "41687879",
    "url": "https://doi.org/10.1016/j.ajcnut.2026.101236",
    "verified": true,
    "takeaways": [
      "Plasma betaine was 52, 61 and 78 uM at 25%, 50% and 100% of the adequate intake; plasma phosphatidylcholine stayed near 2210-2280 uM.",
      "After a d9-choline bolus labelled phosphatidylcholine reached about 23-26 uM and labelled betaine about 1.2-2.0 uM; labelled choline was undetectable at 24 h.",
      "The design gives the clearest recent human estimate of choline pools under controlled intake."
    ],
    "facts": {
      "design": "RCT",
      "population": "Adults on controlled diets, 15-day arms"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "Plasma choline tracks intake; PC buffered."
      },
      {
        "rel": "evidence-for",
        "to": "compound:betaine",
        "note": "Plasma betaine 52-78 uM across intakes."
      },
      {
        "rel": "evidence-for",
        "to": "disease:choline-deficiency",
        "note": "Controlled low-choline arms."
      }
    ]
  },
  {
    "id": "article:yan-2013-pregnancy-d9-choline",
    "type": "article",
    "name": "Pregnancy alters choline dynamics: results of a randomized trial using stable isotope methodology in pregnant and nonpregnant women",
    "aliases": [
      "Yan 2013"
    ],
    "summary": "In pregnant and non-pregnant women taking d9-choline, pregnancy shifted label toward phosphatidylcholine and away from betaine; PEMT-derived PC (d3+d6) was about 17% of d9-PC.",
    "body": [
      "Isotope evidence for the PEMT-to-Kennedy PC ratio and choline-to-betaine labelling."
    ],
    "evidence": "plausible",
    "authors": [
      "Yan J",
      "Jiang X",
      "West AA",
      "Perry CA",
      "Malysheva OV",
      "Brenna JT",
      "Stabler SP",
      "Allen RH",
      "Gregory JF",
      "Caudill MA"
    ],
    "year": 2013,
    "journal": "The American journal of clinical nutrition",
    "doi": "10.3945/ajcn.113.066092",
    "pmid": "24132975",
    "url": "https://doi.org/10.3945/ajcn.113.066092",
    "verified": true,
    "takeaways": [
      "Women took 22% of their choline intake as d9-choline for six weeks; enrichment was measured at week 12 of pregnancy.",
      "Non-pregnant women: d9-choline 7.9%, d9-betaine 9.9%, d6-DMG 34%, d3-sarcosine 26%, d9-PC 9.4%; PEMT-derived d3-PC 1.27% and d6-PC 0.31%.",
      "Enrichment ratios cannot be converted directly into fractions of dose because hepatic betaine is diluted by dietary betaine."
    ],
    "facts": {
      "design": "tracer-study",
      "population": "21 non-pregnant and 26 pregnant women"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:pemt",
        "note": "PEMT-derived PC about 17% of the Kennedy-derived label."
      },
      {
        "rel": "evidence-for",
        "to": "compound:betaine",
        "note": "Betaine label diluted by diet."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:choline-oxidation",
        "note": "Pregnancy shifts choline from oxidation to PC."
      }
    ]
  },
  {
    "id": "article:yan-2012-pregnancy-choline-metabolites",
    "type": "article",
    "name": "Maternal choline intake modulates maternal and fetal biomarkers of choline metabolism in humans",
    "aliases": [
      "Yan 2012"
    ],
    "summary": "Third-trimester pregnancy raised plasma choline about 30% and lowered betaine, DMG, sarcosine and methionine by 13-55%; urinary choline and betaine losses were 2-4 times higher.",
    "body": [
      "Validation target for how physiological state shifts choline partitioning."
    ],
    "evidence": "plausible",
    "authors": [
      "Yan J",
      "Jiang X",
      "West AA",
      "Perry CA",
      "Malysheva OV",
      "Devapatla S",
      "Pressman E",
      "Vermeylen F",
      "Stabler SP",
      "Allen RH",
      "Caudill MA"
    ],
    "year": 2012,
    "journal": "The American journal of clinical nutrition",
    "doi": "10.3945/ajcn.111.022772",
    "pmid": "22418088",
    "url": "https://doi.org/10.3945/ajcn.111.022772",
    "verified": true,
    "takeaways": [
      "26 pregnant and 21 non-pregnant women were compared on 480 or 930 mg/day choline for 12 weeks.",
      "Higher intake raised metabolites 12-46%.",
      "Pregnancy diverts choline toward the fetus and phosphatidylcholine and away from oxidation."
    ],
    "facts": {
      "design": "RCT",
      "population": "26 pregnant and 21 non-pregnant women"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "Plasma choline +30% in pregnancy."
      },
      {
        "rel": "evidence-for",
        "to": "compound:betaine",
        "note": "Betaine -13 to -55%."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:choline-oxidation",
        "note": "Less oxidation in pregnancy."
      }
    ]
  },
  {
    "id": "article:roivainen-2000-carbon11-choline-metabolism",
    "type": "article",
    "name": "Blood metabolism of [methyl-11C]choline; implications for in vivo imaging with positron emission tomography",
    "aliases": [
      "Roivainen 2000"
    ],
    "summary": "Positron-emitting [11C]choline given IV to volunteers: 62% of plasma radioactivity was unchanged choline at 5 min and 27% at 15 min, and [11C]betaine reached 82% at 25 min.",
    "body": [
      "Shows that choline oxidation to betaine is fast in vivo."
    ],
    "evidence": "plausible",
    "authors": [
      "Roivainen A",
      "Forsback S",
      "Grönroos T",
      "Lehikoinen P",
      "Kähkönen M",
      "Sutinen E",
      "Minn H"
    ],
    "year": 2000,
    "journal": "European journal of nuclear medicine",
    "doi": "10.1007/pl00006658",
    "pmid": "10654143",
    "url": "https://doi.org/10.1007/pl00006658",
    "verified": true,
    "takeaways": [
      "Metabolites in arterial and venous plasma were separated after an IV tracer dose in human volunteers (and rats).",
      "Betaine was the main metabolite, plateauing by about 20 minutes.",
      "This is a tracer dose and shows speed of oxidation, not the mass fraction of a dietary dose."
    ],
    "facts": {
      "design": "tracer-study",
      "population": "Healthy human volunteers (PET)"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:choline-oxidation",
        "note": "Rapid conversion of tracer choline to betaine."
      },
      {
        "rel": "evidence-for",
        "to": "compound:betaine",
        "note": "Reaches 82% of plasma radioactivity at 25 min."
      }
    ]
  },
  {
    "id": "article:zhang-1999-choline-tma-urine",
    "type": "article",
    "name": "Dietary precursors of trimethylamine in man: a pilot study",
    "aliases": [
      "Zhang 1999"
    ],
    "summary": "A free-choline dose of 15 mmol gave urinary TMA plus TMAO equal to 63% of the dose, versus 31% for DL-carnitine; betaine and lecithin gave no rise.",
    "body": [
      "Bolus TMA yield from free choline (not a habitual-diet figure)."
    ],
    "evidence": "plausible",
    "authors": [
      "Zhang AQ",
      "Mitchell SC",
      "Smith RL"
    ],
    "year": 1999,
    "journal": "Food and chemical toxicology : an international journal published for the British Industrial Biological Research Association",
    "doi": "10.1016/s0278-6915(99)00028-9",
    "pmid": "10456680",
    "url": "https://doi.org/10.1016/s0278-6915(99)00028-9",
    "verified": true,
    "takeaways": [
      "Human volunteers took choline, carnitine, betaine, lecithin or TMAO and urinary methylamines were measured.",
      "The yield of urinary TMA + TMAO from a large free-choline dose was 63%.",
      "Betaine and lecithin did not raise urinary TMA, so the form of choline decides how much is converted by gut bacteria."
    ],
    "facts": {
      "design": "physiology study",
      "population": "Healthy volunteers, small pilot"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:tma-tmao-axis",
        "note": "Gut bacterial conversion of free choline."
      },
      {
        "rel": "evidence-for",
        "to": "compound:trimethylamine",
        "note": "Urinary TMA + TMAO 63% of dose."
      },
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "Fate of free choline."
      }
    ]
  },
  {
    "id": "article:taesuwan-2017-tmao-d9-elimination",
    "type": "article",
    "name": "The metabolic fate of isotopically labeled trimethylamine-N-oxide (TMAO) in humans",
    "aliases": [
      "Taesuwan 2017"
    ],
    "summary": "After an oral d9-TMAO dose in 40 men about 96% was recovered in urine within 24 h, none in stool, with a turnover time of 5.3 h.",
    "body": [
      "Kinetics of the [[pathway:tma-tmao-axis|TMA/TMAO]] end of choline fate."
    ],
    "evidence": "plausible",
    "authors": [
      "Taesuwan S",
      "Cho CE",
      "Malysheva OV",
      "Bender E",
      "King JH",
      "Yan J",
      "Thalacker-Mercer AE",
      "Caudill MA"
    ],
    "year": 2017,
    "journal": "The Journal of nutritional biochemistry",
    "doi": "10.1016/j.jnutbio.2017.02.010",
    "pmid": "28433924",
    "url": "https://doi.org/10.1016/j.jnutbio.2017.02.010",
    "verified": true,
    "takeaways": [
      "Isotope-labelled TMAO was used to measure its fate.",
      "Urine carried about 96% of the dose within 24 hours.",
      "The short turnover time (5.3 h) means urinary TMAO tracks recent TMA production."
    ],
    "facts": {
      "design": "tracer-study",
      "population": "40 healthy men"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:tmao",
        "note": "Urinary elimination ~96% in 24 h."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:tma-tmao-axis",
        "note": "Turnover time 5.3 h."
      }
    ]
  },
  {
    "id": "article:schwahn-2003-betaine-pharmacokinetics",
    "type": "article",
    "name": "Pharmacokinetics of oral betaine in healthy subjects and patients with homocystinuria",
    "aliases": [
      "Schwahn 2003"
    ],
    "summary": "Single 50 mg/kg betaine in 12 men: Cmax 939 uM at 0.9 h, elimination half-life 14.4 h, 4% excreted unchanged; after five days of twice-daily dosing the half-life rose to 41 h.",
    "body": [
      "Source of the betaine pharmacokinetic parameters and of evidence for DMG product inhibition of [[enzyme:bhmt|BHMT]]."
    ],
    "evidence": "plausible",
    "authors": [
      "Schwahn BC",
      "Hafner D",
      "Hohlfeld T",
      "Balkenhol N",
      "Laryea MD",
      "Wendel U"
    ],
    "year": 2003,
    "journal": "British journal of clinical pharmacology",
    "doi": "10.1046/j.1365-2125.2003.01717.x",
    "pmid": "12534635",
    "url": "https://doi.org/10.1046/j.1365-2125.2003.01717.x",
    "verified": true,
    "takeaways": [
      "Betaine is absorbed with a half-life of 0.28 h and distributes to a large volume (Vss/F 1.32 L/kg, central volume about 0.46 L/kg).",
      "Clearance is 0.084 L/h/kg, mostly metabolic; renal excretion is 4% of the dose.",
      "DMG rose from about 7 uM to a peak of 19 uM at nearly 10 h.",
      "Prolonged half-life and 4-fold higher 24-h urinary DMG on repeated dosing indicate saturable disposal and product inhibition of BHMT."
    ],
    "facts": {
      "design": "pharmacokinetic study",
      "population": "12 healthy men"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:betaine-anhydrous",
        "note": "Pharmacokinetics of an oral dose."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:bhmt",
        "note": "Saturable disposal and DMG inhibition."
      },
      {
        "rel": "evidence-for",
        "to": "compound:dimethylglycine",
        "note": "DMG accumulates."
      }
    ]
  },
  {
    "id": "article:schwab-2006-betaine-acute-homocysteine",
    "type": "article",
    "name": "Orally administered betaine has an acute and dose-dependent effect on serum betaine and plasma homocysteine concentrations in healthy humans",
    "aliases": [
      "Schwab 2006"
    ],
    "summary": "Single betaine doses of 1, 3 and 6 g in ten healthy people lowered plasma homocysteine at 3 g and 6 g (not 1 g) within two hours, still lowered 24 h after 6 g.",
    "body": [
      "Acute dose-response of betaine on homocysteine (abstract only)."
    ],
    "evidence": "plausible",
    "authors": [
      "Schwab U",
      "Törrönen A",
      "Meririnne E",
      "Saarinen M",
      "Alfthan G",
      "Aro A",
      "Uusitupa M"
    ],
    "year": 2006,
    "journal": "The Journal of nutrition",
    "doi": "10.1093/jn/136.1.34",
    "pmid": "16365055",
    "url": "https://doi.org/10.1093/jn/136.1.34",
    "verified": true,
    "takeaways": [
      "Serum betaine rose dose-dependently after the oral doses.",
      "tHcy fell at 3 g (P=0.019) and 6 g (P<0.001) but not at 1 g.",
      "The effect appeared within two hours and persisted for a day after 6 g."
    ],
    "facts": {
      "design": "RCT",
      "population": "10 healthy adults, crossover"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:betaine-anhydrous",
        "note": "Acute homocysteine lowering at 3-6 g."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:bhmt",
        "note": "Remethylation stimulated by betaine."
      }
    ]
  },
  {
    "id": "article:steenge-2003-betaine-homocysteine",
    "type": "article",
    "name": "Betaine supplementation lowers plasma homocysteine in healthy men and women",
    "aliases": [
      "Steenge 2003"
    ],
    "summary": "Betaine 6 g/day for 6 weeks in mild hyperhomocysteinaemia lowered fasting homocysteine 1.8 uM and post-load AUC by 221 umol h/L; folic acid lowered fasting tHcy but not the AUC.",
    "body": [
      "Validation target for betaine rescue of homocysteine."
    ],
    "evidence": "plausible",
    "authors": [
      "Steenge GR",
      "Verhoef P",
      "Katan MB"
    ],
    "year": 2003,
    "journal": "The Journal of nutrition",
    "doi": "10.1093/jn/133.5.1291",
    "pmid": "12730412",
    "url": "https://doi.org/10.1093/jn/133.5.1291",
    "verified": true,
    "takeaways": [
      "Randomised trial of betaine, folic acid and placebo in 12 participants per arm.",
      "Betaine: fasting -1.8 uM (CI -3.6 to 0.0) and post-load AUC -221 umol h/L (CI -425 to -16).",
      "Folic acid reduced fasting tHcy by 2.7 uM but did not change the post-load AUC.",
      "The two interventions affect different parts of the homocysteine response."
    ],
    "facts": {
      "design": "RCT",
      "population": "36 adults with mild hyperhomocysteinaemia"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:betaine-anhydrous",
        "note": "Lowers post-load homocysteine."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:bhmt",
        "note": "BHMT remethylation."
      },
      {
        "rel": "evidence-for",
        "to": "compound:homocysteine",
        "note": "Fasting -1.8 uM."
      }
    ]
  },
  {
    "id": "article:wallace-2017-us-choline-intake",
    "type": "article",
    "name": "Usual Choline Intakes Are Associated with Egg and Protein Food Consumption in the United States",
    "aliases": [
      "Wallace 2017"
    ],
    "summary": "NHANES 2009-2014: US adults ingest 338 mg choline/day (men 405, women 273); only 8% meet the AI; egg eaters average 525 mg versus 294 mg.",
    "body": [
      "Dietary choline intake for the choline budget."
    ],
    "evidence": "established",
    "authors": [
      "Wallace TC",
      "Fulgoni VL"
    ],
    "year": 2017,
    "journal": "Nutrients",
    "doi": "10.3390/nu9080839",
    "pmid": "28783055",
    "url": "https://doi.org/10.3390/nu9080839",
    "verified": true,
    "takeaways": [
      "Usual intakes were estimated from two 24-hour recalls with the National Cancer Institute method.",
      "Mean adult intake 338 +/- 1.86 mg/day, men 405, women 273, pregnant women 319.",
      "About 8% of adults reach the adequate intake and virtually nobody exceeds the upper limit."
    ],
    "facts": {
      "design": "survey",
      "population": "US adults, NHANES 2009-2014"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "Mean intake 338 mg/day."
      },
      {
        "rel": "evidence-for",
        "to": "disease:choline-deficiency",
        "note": "Most adults are below the AI."
      }
    ]
  },
  {
    "id": "article:cho-2006-framingham-choline-betaine-intake",
    "type": "article",
    "name": "Dietary choline and betaine assessed by food-frequency questionnaire in relation to plasma total homocysteine concentration in the Framingham Offspring Study",
    "aliases": [
      "Cho 2006"
    ],
    "summary": "Framingham Offspring: energy-adjusted intakes of choline 313 mg/day and betaine 208 mg/day; higher intakes were associated with lower plasma homocysteine, especially at low folate.",
    "body": [
      "Second source of dietary choline and betaine intake."
    ],
    "evidence": "plausible",
    "authors": [
      "Cho E",
      "Zeisel SH",
      "Jacques P",
      "Selhub J",
      "Dougherty L",
      "Colditz GA",
      "Willett WC"
    ],
    "year": 2006,
    "journal": "The American journal of clinical nutrition",
    "doi": "10.1093/ajcn/83.4.905",
    "pmid": "16600945",
    "url": "https://doi.org/10.1093/ajcn/83.4.905",
    "verified": true,
    "takeaways": [
      "Food-frequency data from 1960 adults were combined with food composition tables.",
      "Choline intake averaged 313 +/- 61 mg/day (about half from phosphatidylcholine) and betaine 208 +/- 90 mg/day.",
      "Inverse association with tHcy was strongest in those with low folate intake."
    ],
    "facts": {
      "design": "cohort",
      "population": "1960 Framingham Offspring participants"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "Intake 313 mg/day."
      },
      {
        "rel": "evidence-for",
        "to": "compound:betaine",
        "note": "Intake 208 mg/day."
      },
      {
        "rel": "evidence-for",
        "to": "compound:homocysteine",
        "note": "Inverse association with tHcy."
      }
    ]
  },
  {
    "id": "article:ross-2014-betaine-food-sources",
    "type": "article",
    "name": "Cereal foods are the major source of betaine in the Western diet--analysis of betaine and free choline in cereal foods and updated assessments of betaine intake",
    "aliases": [
      "Ross 2014"
    ],
    "summary": "Cereal products supply 60-67% of betaine in Western diets and quinoa is the richest source; average intake is about 131 mg/day.",
    "body": [
      "Dietary betaine intake."
    ],
    "evidence": "plausible",
    "authors": [
      "Ross AB",
      "Zangger A",
      "Guiraud SP"
    ],
    "year": 2014,
    "journal": "Food chemistry",
    "doi": "10.1016/j.foodchem.2013.08.122",
    "pmid": "24128557",
    "url": "https://doi.org/10.1016/j.foodchem.2013.08.122",
    "verified": true,
    "takeaways": [
      "Betaine content of foods and meal patterns were reviewed.",
      "Wheat bran, wheat germ and spinach are rich sources; typical Western intake is about 131 mg/day.",
      "Cereal products contribute most of the dietary betaine."
    ],
    "facts": {
      "design": "review",
      "population": "Food composition review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:betaine",
        "note": "Mean intake ~131 mg/day."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:dietary-choline-sources",
        "note": "Food sources of choline and betaine overlap."
      }
    ]
  },
  {
    "id": "article:zeisel-2003-food-choline-betaine",
    "type": "article",
    "name": "Concentrations of choline-containing compounds and betaine in common foods",
    "aliases": [
      "Zeisel 2003"
    ],
    "summary": "Food composition database: beef liver 418, chicken liver 290 and egg 251 mg choline/100 g; wheat bran 1339, wheat germ 1241 and spinach 645 mg betaine/100 g.",
    "body": [
      "Food choline and betaine content."
    ],
    "evidence": "established",
    "authors": [
      "Zeisel SH",
      "Mar MH",
      "Howe JC",
      "Holden JM"
    ],
    "year": 2003,
    "journal": "The Journal of nutrition",
    "doi": "10.1093/jn/133.5.1302",
    "pmid": "12730414",
    "url": "https://doi.org/10.1093/jn/133.5.1302",
    "verified": true,
    "takeaways": [
      "Choline-containing compounds and betaine were measured in common foods.",
      "Top choline sources include liver, egg, wheat germ and bacon.",
      "Top betaine sources include wheat bran, wheat germ, spinach and shrimp."
    ],
    "facts": {
      "design": "food composition analysis",
      "population": "145 US foods"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:dietary-choline-sources",
        "note": "Choline per 100 g of common foods."
      },
      {
        "rel": "evidence-for",
        "to": "compound:betaine",
        "note": "Betaine content of foods."
      }
    ]
  },
  {
    "id": "article:vennemann-2015-eu-choline-intake",
    "type": "article",
    "name": "Dietary intake and food sources of choline in European populations",
    "aliases": [
      "Vennemann 2015"
    ],
    "summary": "European surveys: mean adult choline intake 291-468 mg/day and children 3-10 years 177-304 mg/day.",
    "body": [
      "Range of dietary choline intake."
    ],
    "evidence": "plausible",
    "authors": [
      "Vennemann FB",
      "Ioannidou S",
      "Valsta LM",
      "Dumas C",
      "Ocké MC",
      "Mensink GB",
      "Lindtner O",
      "Virtanen SM",
      "Tlustos C",
      "D'Addezio L",
      "Mattison I",
      "Dubuisson C",
      "Siksna I",
      "Héraud F"
    ],
    "year": 2015,
    "journal": "The British journal of nutrition",
    "doi": "10.1017/s0007114515003700",
    "pmid": "26423357",
    "url": "https://doi.org/10.1017/s0007114515003700",
    "verified": true,
    "takeaways": [
      "Intakes were compared across national surveys using harmonised food composition data.",
      "Adult means ranged from 291 to 468 mg/day depending on country."
    ],
    "facts": {
      "design": "survey",
      "population": "European adults and children"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "European intake 291-468 mg/day."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:dietary-choline-sources",
        "note": "Intake by country."
      }
    ]
  },
  {
    "id": "article:davis-2004-remethylation-serine-donor",
    "type": "article",
    "name": "Tracer-derived total and folate-dependent homocysteine remethylation and synthesis rates in humans indicate that serine is the main one-carbon donor",
    "aliases": [
      "Davis 2004"
    ],
    "summary": "Dual-tracer study: total homocysteine remethylation is about 8 umol/kg/h, twice earlier reports, and serine supplied about 100% of the methyl groups (2.8% of serine flux).",
    "body": [
      "Cross-check on how much of remethylation could be BHMT-dependent."
    ],
    "evidence": "plausible",
    "authors": [
      "Davis SR",
      "Stacpoole PW",
      "Williamson J",
      "Kick LS",
      "Quinlivan EP",
      "Coats BS",
      "Shane B",
      "Bailey LB",
      "Gregory JF"
    ],
    "year": 2004,
    "journal": "American journal of physiology. Endocrinology and metabolism",
    "doi": "10.1152/ajpendo.00351.2003",
    "pmid": "14559726",
    "url": "https://doi.org/10.1152/ajpendo.00351.2003",
    "verified": true,
    "takeaways": [
      "A procedure using [U-13C5]methionine with [3-13C]serine measured total and folate-dependent remethylation at once.",
      "Overall remethylation was about 8 umol/kg/h (13.4 mmol/day at 70 kg).",
      "Serine was calculated to provide essentially all remethylation methyl groups after a conservative enrichment correction, leaving little room for betaine in this estimate."
    ],
    "facts": {
      "design": "tracer-study",
      "population": "Young adults"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:methionine-cycle",
        "note": "Total remethylation ~8 umol/kg/h."
      },
      {
        "rel": "evidence-for",
        "to": "compound:serine",
        "note": "Main one-carbon donor."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:bhmt",
        "note": "Leaves little room for betaine in this estimate."
      }
    ]
  },
  {
    "id": "article:teng-2011-bhmt-knockout-liver-pools",
    "type": "article",
    "name": "Deletion of betaine-homocysteine S-methyltransferase in mice perturbs choline and 1-carbon metabolism, resulting in fatty liver and hepatocellular carcinomas",
    "aliases": [
      "Teng 2011"
    ],
    "summary": "Bhmt knockout mice: liver AdoMet falls 43% and AdoHcy rises 2.6-fold (ratio 3.6 to 0.9), plasma tHcy rises ~8-fold, betaine accumulates ~20-30-fold; wild-type pool sizes are tabulated.",
    "body": [
      "Only tissue pool sizes for the choline pathway in the set (mouse; human not found)."
    ],
    "evidence": "plausible",
    "authors": [
      "Teng YW",
      "Mehedint MG",
      "Garrow TA",
      "Zeisel SH"
    ],
    "year": 2011,
    "journal": "The Journal of biological chemistry",
    "doi": "10.1074/jbc.m111.265348",
    "pmid": "21878621",
    "url": "https://doi.org/10.1074/jbc.m111.265348",
    "verified": true,
    "takeaways": [
      "Wild-type liver at 5 weeks (nmol/g): AdoMet 76.4, AdoHcy 21.8 (ratio 3.6), glycine 1659, methionine 223, DMG 48.2, methylglycine 20.2; at 1 year: betaine 1158, choline 84, phosphatidylcholine 17,317.",
      "Without BHMT the liver loses 95% of its DMG, 82% of its choline and 26% of its phosphatidylcholine and gains fat; plasma homocysteine goes from 6.5 to 50.8 uM.",
      "Neither methionine synthase nor transsulfuration compensates, and methylglycine (sarcosine) rises 2.6-fold, attributed to GNMT.",
      "Mouse data with gas-chromatographic and mass-spectrometric measurements; human pool sizes are not available."
    ],
    "facts": {
      "design": "animal",
      "population": "Wild-type and Bhmt-/- mice"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:bhmt",
        "note": "Knockout raises betaine and homocysteine."
      },
      {
        "rel": "evidence-for",
        "to": "compound:betaine",
        "note": "Liver betaine 1.16 umol/g (mouse)."
      },
      {
        "rel": "evidence-for",
        "to": "compound:phosphatidylcholine",
        "note": "Liver PC 17.3 umol/g (mouse)."
      }
    ]
  },
  {
    "id": "article:li-2008-choline-metabolism-review",
    "type": "article",
    "name": "Phosphatidylcholine and choline homeostasis",
    "aliases": [
      "Li 2008"
    ],
    "summary": "Review: the main fate of choline is phosphatidylcholine synthesis; choline is also oxidised to betaine in kidney and liver and converted to acetylcholine in nervous tissue.",
    "body": [
      "Qualitative partition of choline fate."
    ],
    "evidence": "established",
    "authors": [
      "Li Z",
      "Vance DE"
    ],
    "year": 2008,
    "journal": "Journal of lipid research",
    "doi": "10.1194/jlr.r700019-jlr200",
    "pmid": "18204095",
    "url": "https://doi.org/10.1194/jlr.r700019-jlr200",
    "verified": true,
    "takeaways": [
      "Choline is taken up by transporters and phosphorylated by choline kinase for the CDP-choline route.",
      "Oxidation to betaine supplies methyl groups; acetylcholine synthesis is a minor, neuronal fate.",
      "PEMT provides a de novo choline moiety in the liver."
    ],
    "facts": {
      "design": "review",
      "population": "Review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "Fates of choline."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:kennedy-pathway",
        "note": "Main fate: PC synthesis."
      }
    ]
  },
  {
    "id": "article:lamers-2009-glycine-decarboxylation-tracer",
    "type": "article",
    "name": "Production of 1-carbon units from glycine is extensive in healthy men and women",
    "aliases": [
      "Lamers 2009"
    ],
    "summary": "Tracer study: glycine decarboxylation by the cleavage system was 22% of flux (96 umol/kg/h) with [1-13C]glycine, and methylene-THF from it was about 20-fold the homocysteine remethylation demand.",
    "body": [
      "Lower estimate of [[enzyme:glycine-cleavage-system|glycine cleavage]] flux."
    ],
    "evidence": "plausible",
    "authors": [
      "Lamers Y",
      "Williamson J",
      "Theriaque DW",
      "Shuster JJ",
      "Gilbert LR",
      "Keeling C",
      "Stacpoole PW",
      "Gregory JF"
    ],
    "year": 2009,
    "journal": "The Journal of nutrition",
    "doi": "10.3945/jn.108.103580",
    "pmid": "19244382",
    "url": "https://doi.org/10.3945/jn.108.103580",
    "verified": true,
    "takeaways": [
      "Healthy adults received [1,2-13C2]- and [1-13C]glycine infusions.",
      "Decarboxylation was 96 +/- 8 umol/kg/h (22 +/- 3%) with [1-13C]glycine, versus 146 +/- 37 with [1,2-13C2]glycine.",
      "The one-carbon units made by the cleavage system far exceed what homocysteine remethylation needs, so most are oxidised."
    ],
    "facts": {
      "design": "tracer-study",
      "population": "Healthy adults, n=6"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:glycine-cleavage-system",
        "note": "Decarboxylation 22% of glycine flux ([1-13C] tracer)."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:glycine-cleavage",
        "note": "One-carbon output ~20x remethylation demand."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:folate-cycle",
        "note": "Methylene-THF supply."
      }
    ]
  },
  {
    "id": "article:gersovitz-1980-glycine-flux-protein-intake",
    "type": "article",
    "name": "Dynamic aspects of whole body glycine metabolism: influence of protein intake in young adult and elderly males",
    "aliases": [
      "Gersovitz 1980"
    ],
    "summary": "In young and elderly adults oral 15N-glycine gave a glycine flux of 458 and synthesis of 351 umol/kg/h on 1.5 g protein/kg/day, both falling sharply on 0.4 g/kg/day.",
    "body": [
      "Highest tracer-based estimate of endogenous glycine synthesis."
    ],
    "evidence": "plausible",
    "authors": [
      "Gersovitz M",
      "Bier D",
      "Matthews D",
      "Udall J",
      "Munro HN",
      "Young VR"
    ],
    "year": 1980,
    "journal": "Metabolism: clinical and experimental",
    "doi": "10.1016/0026-0495(80)90220-6",
    "pmid": "7432172",
    "url": "https://doi.org/10.1016/0026-0495(80)90220-6",
    "verified": true,
    "takeaways": [
      "Oral 15N-glycine kinetics were measured on adequate and low-protein diets.",
      "On 1.5 g protein/kg/day flux was 458 and synthesis 351 umol/kg/h.",
      "The lowest-protein diet reduced both substantially in young and elderly subjects."
    ],
    "facts": {
      "design": "tracer-study",
      "population": "Young and elderly adults"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Tracer synthesis 351 umol/kg/h on adequate protein."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:glycine-deficit-estimate",
        "note": "Far higher than the pathway sum."
      }
    ]
  },
  {
    "id": "article:robert-1982-glycine-synthesis-postabsorptive",
    "type": "article",
    "name": "Glucose and insulin effects on the novo amino acid synthesis in young men: studies with stable isotope labeled alanine, glycine, leucine, and lysine",
    "aliases": [
      "Robert 1982"
    ],
    "summary": "Post-absorptive young men had a glycine flux of 240 umol/kg/h with de novo synthesis about 81% of it; glucose infusion did not change flux.",
    "body": [
      "Fasting glycine flux and a tracer estimate of de novo synthesis (24.5 g/day)."
    ],
    "evidence": "plausible",
    "authors": [
      "Robert JJ",
      "Bier DM",
      "Zhao XH",
      "Matthews DE",
      "Young VR"
    ],
    "year": 1982,
    "journal": "Metabolism: clinical and experimental",
    "doi": "10.1016/0026-0495(82)90006-3",
    "pmid": "6815417",
    "url": "https://doi.org/10.1016/0026-0495(82)90006-3",
    "verified": true,
    "takeaways": [
      "Constant-infusion tracer study in fasted young men.",
      "Glycine flux was 240 +/- 22 umol/kg/h and de novo synthesis made up 81% of it.",
      "Raising glucose and insulin did not alter glycine flux."
    ],
    "facts": {
      "design": "tracer-study",
      "population": "Young men, post-absorptive"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Fasting flux 240 umol/kg/h."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:glycine-deficit-estimate",
        "note": "Tracer synthesis exceeds the pathway sum."
      }
    ]
  },
  {
    "id": "article:yu-1985-glycine-synthesis-dispensable-aa",
    "type": "article",
    "name": "Quantitative aspects of glycine and alanine nitrogen metabolism in postabsorptive young men: effects of level of nitrogen and dispensable amino acid intake",
    "aliases": [
      "Yu 1985"
    ],
    "summary": "In men on a low-nitrogen diet de novo glycine nitrogen synthesis was 59 umol/kg/h with dispensable amino acids and 20 without them (about 7.4 and 2.5 g glycine/day).",
    "body": [
      "Diet-dependent endogenous glycine synthesis."
    ],
    "evidence": "plausible",
    "authors": [
      "Yu YM",
      "Yang RD",
      "Matthews DE",
      "Wen ZM",
      "Burke JF",
      "Bier DM",
      "Young VR"
    ],
    "year": 1985,
    "journal": "The Journal of nutrition",
    "doi": "10.1093/jn/115.3.399",
    "pmid": "3973749",
    "url": "https://doi.org/10.1093/jn/115.3.399",
    "verified": true,
    "takeaways": [
      "Diets of 0.6 g protein/kg/day with or without dispensable amino acids were compared using 15N tracers.",
      "De novo glycine synthesis rose about three-fold when dispensable amino acids were included.",
      "The no-dispensable-amino-acid value (2.5 g/day) is close to the pathway-summation estimate of about 3 g/day."
    ],
    "facts": {
      "design": "tracer-study",
      "population": "Young men"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Synthesis depends on nitrogen supply."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:glycine-deficit-estimate",
        "note": "20 vs 59 umol/kg/h."
      }
    ]
  },
  {
    "id": "article:tan-2022-glycine-serine-synthesis-obesity",
    "type": "article",
    "name": "De Novo Glycine Synthesis Is Reduced in Adults With Morbid Obesity and Increases Following Bariatric Surgery",
    "aliases": [
      "Tan 2022"
    ],
    "summary": "Fasting tracer study: healthy-weight adults made glycine de novo at 124 umol/kg lean mass/h and serine at 218; glycine synthesis was lower in morbid obesity and recovered after bariatric surgery.",
    "body": [
      "Modern tracer estimate of endogenous glycine and serine synthesis, contrasting with the pathway-sum deficit argument."
    ],
    "evidence": "plausible",
    "authors": [
      "Tan HC",
      "Hsu JW",
      "Tai ES",
      "Chacko S",
      "Wu V",
      "Lee CF",
      "Kovalik JP",
      "Jahoor F"
    ],
    "year": 2022,
    "journal": "Frontiers in endocrinology",
    "doi": "10.3389/fendo.2022.900343",
    "pmid": "35757406",
    "url": "https://doi.org/10.3389/fendo.2022.900343",
    "verified": true,
    "takeaways": [
      "Endogenous glycine flux in healthy-weight adults was 201 (173-234) umol/kg LBM/h, oxidation 55 and non-oxidative disposal 157.",
      "De novo glycine synthesis 124 (103-159) and de novo serine synthesis 218 (177-284) umol/kg LBM/h; de novo glycine fell to 86 in morbid obesity and recovered to 127 six months after surgery.",
      "De novo values are derived by subtracting protein-breakdown glycine estimated from phenylalanine flux, with assumptions about collagen content."
    ],
    "facts": {
      "design": "tracer-study",
      "population": "21 adults with healthy weight or morbid obesity"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "De novo synthesis 124 umol/kg LBM/h."
      },
      {
        "rel": "evidence-for",
        "to": "compound:serine",
        "note": "De novo synthesis 218 umol/kg LBM/h."
      },
      {
        "rel": "evidence-for",
        "to": "claim:glycine-deficit-10g",
        "note": "Tracer-derived synthesis is several times the pathway sum; the two methods measure different quantities."
      }
    ]
  },
  {
    "id": "article:alves-2019-glycine-metabolism-review",
    "type": "article",
    "name": "Glycine Metabolism and Its Alterations in Obesity and Metabolic Diseases",
    "aliases": [
      "Alves 2019"
    ],
    "summary": "Review: plasma glycine 200-300 uM, a glycine budget restated from Meléndez-Hevia, and reduced plasma glycine in metabolic syndrome with sarcosine inversely related.",
    "body": [
      "Plasma glycine reference range."
    ],
    "evidence": "established",
    "authors": [
      "Alves A",
      "Bassot A",
      "Bulteau AL",
      "Pirola L",
      "Morio B"
    ],
    "year": 2019,
    "journal": "Nutrients",
    "doi": "10.3390/nu11061356",
    "pmid": "31208147",
    "url": "https://doi.org/10.3390/nu11061356",
    "verified": true,
    "takeaways": [
      "Normal plasma glycine falls within 200-300 uM and is higher in vegetarians than meat eaters.",
      "The review repeats the endogenous synthesis plus diet budget and the large collagen demand.",
      "Glycine is lower and sarcosine higher in metabolic syndrome."
    ],
    "facts": {
      "design": "review",
      "population": "Review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Plasma 200-300 uM."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:glycine-deficit-estimate",
        "note": "Restates the budget."
      }
    ]
  },
  {
    "id": "article:kaufman-2009-glycine-dose-brain",
    "type": "article",
    "name": "Oral glycine administration increases brain glycine/creatine ratios in men: a proton magnetic resonance spectroscopy study",
    "aliases": [
      "Kaufman 2009"
    ],
    "summary": "Glycine escalated to 0.8 g/kg/day for 14 days in healthy men raised plasma glycine from 240 to 640 uM and brain glycine/creatine 38%; 2 of 14 vomited or felt nauseated.",
    "body": [
      "Plasma glycine response to high-dose oral glycine."
    ],
    "evidence": "plausible",
    "authors": [
      "Kaufman MJ",
      "Prescot AP",
      "Ongur D",
      "Evins AE",
      "Barros TL",
      "Medeiros CL",
      "Covell J",
      "Wang L",
      "Fava M",
      "Renshaw PF"
    ],
    "year": 2009,
    "journal": "Psychiatry research",
    "doi": "10.1016/j.pscychresns.2009.03.004",
    "pmid": "19556112",
    "url": "https://doi.org/10.1016/j.pscychresns.2009.03.004",
    "verified": true,
    "takeaways": [
      "Dose steps of 0.2, 0.4, 0.6 and 0.8 g/kg/day were taken for 14 days.",
      "Plasma glycine rose from 240 +/- 84 to 640 +/- 340 uM 11-20 hours after the last dose; absorption was extensive but variable.",
      "Two of 14 had nausea or emesis at the top dose."
    ],
    "facts": {
      "design": "dose-escalation study",
      "population": "14 healthy men"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:glycine-powder",
        "note": "Plasma glycine ~2.7x at 0.8 g/kg/day; vomiting in 2 of 14."
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Plasma 240 to 640 uM."
      },
      {
        "rel": "evidence-for",
        "to": "claim:glycine-well-tolerated-in-trials",
        "note": "Mostly tolerated; top dose caused emesis in 2 of 14."
      }
    ]
  },
  {
    "id": "article:olsson-2025-glycine-alcohol-use-disorder",
    "type": "article",
    "name": "Evaluation of glycine treatment for reducing alcohol craving and self-administration in individuals with alcohol use disorder: A human laboratory trial",
    "aliases": [
      "Olsson 2025"
    ],
    "summary": "Adults with alcohol use disorder taking 0.12 g/kg glycine three times daily for 5 days raised serum glycine from 248 to 558 uM; responders more than doubled it.",
    "body": [
      "Plasma glycine response to a typical supplemental dose."
    ],
    "evidence": "plausible",
    "authors": [
      "Olsson Y",
      "Lidö H",
      "Ericson M",
      "Söderpalm B"
    ],
    "year": 2025,
    "journal": "Alcohol, clinical & experimental research",
    "doi": "10.1111/acer.70187",
    "pmid": "41189445",
    "url": "https://doi.org/10.1111/acer.70187",
    "verified": true,
    "takeaways": [
      "Dose about 8.4 g/day at 70 kg, with the last dose at 9 a.m. on the sampling day.",
      "Serum glycine rose from 248.4 +/- 43.3 to 557.7 +/- 271.4 uM, with responders at 800 uM and non-responders at 396 uM.",
      "Variability was large (standard deviation about half the mean)."
    ],
    "facts": {
      "design": "RCT",
      "population": "Adults with alcohol use disorder"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:glycine-powder",
        "note": "Plasma glycine ~2.2x at 8.4 g/day."
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Highly variable response."
      }
    ]
  },
  {
    "id": "article:tan-2025-glycine-supplement-obesity-hcy",
    "type": "article",
    "name": "Metabolic impact of dietary glycine supplementation in individuals with severe obesity",
    "aliases": [
      "Tan 2025"
    ],
    "summary": "Glycine 100 mg/kg/day for 14 days in adults with severe obesity raised plasma glycine from 138 to 186 uM and tHcy by 0.6 uM; methionine was unchanged; SAM, SAH and sarcosine were not measured.",
    "body": [
      "Closest human data on glycine supplementation and the methionine cycle (no SAM measurement)."
    ],
    "evidence": "plausible",
    "authors": [
      "Tan HC",
      "Hsu JW",
      "Tai ES",
      "Chacko S",
      "Wu V",
      "Yen PM",
      "Kovalik JP",
      "Jahoor F"
    ],
    "year": 2025,
    "journal": "Scientific reports",
    "doi": "10.1038/s41598-025-20511-x",
    "pmid": "41107432",
    "url": "https://doi.org/10.1038/s41598-025-20511-x",
    "verified": true,
    "takeaways": [
      "Plasma glycine rose 49 +/- 29 uM and serine rose 17%.",
      "tHcy went from 10.2 +/- 3.2 to 10.7 +/- 3.0 uM (p=0.034), methionine did not change.",
      "The authors interpret the Hcy rise as more one-carbon flux; it is also compatible with more methyl-acceptor use."
    ],
    "facts": {
      "design": "before-after trial",
      "population": "19 adults with severe obesity"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:glycine-powder",
        "note": "Small homocysteine rise at 7 g/day."
      },
      {
        "rel": "evidence-for",
        "to": "compound:homocysteine",
        "note": "+0.6 uM."
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Plasma 138 to 186 uM."
      }
    ]
  },
  {
    "id": "article:villar-2012-gly-arg-hyperhomocysteinemia",
    "type": "article",
    "name": "Glycine and L-arginine treatment causes hyperhomocysteinemia in cerebral creatine transporter deficiency patients",
    "aliases": [
      "Villar 2012"
    ],
    "summary": "In creatine-transporter deficiency, glycine 200 + arginine 400 mg/kg/day for 3 months raised homocysteine (one patient 81 uM) and lowered folate; folic acid normalised it.",
    "body": [
      "Shows glycine + arginine loading can raise homocysteine through creatine precursor synthesis."
    ],
    "evidence": "plausible",
    "authors": [
      "Villar C",
      "Campistol J",
      "Fons C",
      "Armstrong J",
      "Mas A",
      "Ormazabal A",
      "Artuch R"
    ],
    "year": 2012,
    "journal": "JIMD reports",
    "doi": "10.1007/8904_2011_41",
    "pmid": "23430891",
    "url": "https://doi.org/10.1007/8904_2011_41",
    "verified": true,
    "takeaways": [
      "Five patients received glycine and arginine to raise brain creatine synthesis.",
      "Total homocysteine rose (81, 17, 17, 10 and 6 uM) and folate fell in one patient from 10 to 4.8 nmol/L.",
      "Urinary guanidinoacetate rose, pointing at GAMT SAM consumption as the driver rather than glycine alone."
    ],
    "facts": {
      "design": "case series",
      "population": "Five patients with creatine-transporter deficiency"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:glycine-powder",
        "note": "High-dose glycine plus arginine raised homocysteine."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:gamt",
        "note": "Guanidinoacetate methylation draws SAM."
      },
      {
        "rel": "evidence-for",
        "to": "compound:homocysteine",
        "note": "Up to 81 uM."
      }
    ]
  },
  {
    "id": "article:alves-2022-glycine-mouse-sarcosine",
    "type": "article",
    "name": "Glycine Supplementation in Obesity Worsens Glucose Intolerance through Enhanced Liver Gluconeogenesis",
    "aliases": [
      "Alves 2022"
    ],
    "summary": "Glycine 300 mg/kg/day for 6 weeks raised liver sarcosine 86% in mice on a high-fat, high-sugar diet and worsened glucose intolerance via gluconeogenesis; SAM and SAH were not reported.",
    "body": [
      "Animal evidence that glycine raises flux through [[enzyme:gnmt|GNMT]] (sarcosine), without a SAM readout."
    ],
    "evidence": "plausible",
    "authors": [
      "Alves A",
      "Lamarche F",
      "Lefebvre R",
      "Drevet Mulard E",
      "Bassot A",
      "Chanon S",
      "Loizon E",
      "Pinteur C",
      "Bloise AMNLG",
      "Godet M",
      "Rautureau GJP",
      "Panthu B",
      "Morio B"
    ],
    "year": 2022,
    "journal": "Nutrients",
    "doi": "10.3390/nu15010096",
    "pmid": "36615754",
    "url": "https://doi.org/10.3390/nu15010096",
    "verified": true,
    "takeaways": [
      "High-fat/high-sucrose feeding lowered liver glycine 22% and Gnmt mRNA 31%; glycine tended to restore liver glycine.",
      "Liver sarcosine rose 86% with glycine, indicating more glycine methylation by GNMT.",
      "Glycine supplementation worsened glucose intolerance through enhanced liver gluconeogenesis in these obese mice.",
      "Choline and phosphocholine were 2-3 times higher on the diet with or without glycine; SAM and SAH were not measured."
    ],
    "facts": {
      "design": "animal",
      "population": "C57BL/6 mice on a high-fat/high-sucrose diet"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:sarcosine",
        "note": "Liver sarcosine +86%."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:gnmt",
        "note": "Increased glycine methylation."
      },
      {
        "rel": "evidence-for",
        "to": "claim:glycine-gnmt-depletes-sam-in-undermethylated",
        "note": "Mouse sarcosine rise supports the mechanism; SAM not measured and no human data."
      }
    ]
  },
  {
    "id": "article:fukada-2006-gaa-homocysteine-rat",
    "type": "article",
    "name": "Dietary eritadenine suppresses guanidinoacetic Acid-induced hyperhomocysteinemia in rats",
    "aliases": [
      "Fukada 2006"
    ],
    "summary": "In rats guanidinoacetate (5-10 g/kg diet) raised plasma homocysteine 255-421% and nicotinic acid 39-58%, but dietary glycine at 25-50 g/kg did not; guanidinoacetate lowered liver SAM and raised SAH.",
    "body": [
      "Rodent contrast between methyl-acceptor loads (guanidinoacetate, nicotinic acid) and glycine for plasma homocysteine."
    ],
    "evidence": "plausible",
    "authors": [
      "Fukada S",
      "Setoue M",
      "Morita T",
      "Sugiyama K"
    ],
    "year": 2006,
    "journal": "The Journal of nutrition",
    "doi": "10.1093/jn/136.11.2797",
    "pmid": "17056803",
    "url": "https://doi.org/10.1093/jn/136.11.2797",
    "verified": true,
    "takeaways": [
      "Methyl-group acceptors and a precursor were fed to Wistar rats for 10 days.",
      "Plasma total homocysteine rose 255% and 421% with 5 and 10 g/kg guanidinoacetic acid and 39% and 58% with 5 and 10 g/kg nicotinic acid, but not with ethanolamine or glycine (25 and 50 g/kg).",
      "Guanidinoacetate dose-dependently lowered hepatic SAM and cystathionine beta-synthase activity and raised hepatic SAH and homocysteine.",
      "Liver SAM and SAH were reported for the guanidinoacetate arms; the abstract gives no SAM or SAH values for the glycine arms."
    ],
    "facts": {
      "design": "animal",
      "population": "Male Wistar rats"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:guanidinoacetate",
        "note": "Raises homocysteine and lowers hepatic SAM in rats."
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Glycine alone did not raise homocysteine in this rat experiment."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:gamt",
        "note": "SAM consumption by guanidinoacetate methylation."
      },
      {
        "rel": "evidence-for",
        "to": "compound:niacin",
        "note": "Nicotinic acid at 5-10 g/kg raised plasma homocysteine 39-58% in rats."
      },
      {
        "rel": "evidence-for",
        "to": "claim:niacin-drains-methyl-groups",
        "note": "Rat data only; liver SAM/SAH in the nicotinic-acid arms are not given in the abstract."
      }
    ]
  },
  {
    "id": "article:sugiyama-1987-methionine-glycine-rat",
    "type": "article",
    "name": "Effect of dietary glycine on methionine metabolism in rats fed a high-methionine diet",
    "aliases": [
      "Sugiyama 1987"
    ],
    "summary": "In weanling rats a 2% methionine diet raised liver methionine and lowered glycine, serine and threonine; adding 2% glycine suppressed the methionine rise and restored glycine.",
    "body": [
      "Rodent link between glycine supply and methionine disposal."
    ],
    "evidence": "plausible",
    "authors": [
      "Sugiyama K",
      "Kushima Y",
      "Muramatsu K"
    ],
    "year": 1987,
    "journal": "Journal of nutritional science and vitaminology",
    "doi": "10.3177/jnsv.33.195",
    "pmid": "3668700",
    "url": "https://doi.org/10.3177/jnsv.33.195",
    "verified": true,
    "takeaways": [
      "Methionine excess depleted hepatic glycine, consistent with glycine use in GNMT-mediated disposal.",
      "Extra glycine blunted the methionine accumulation.",
      "SAM was not reported in the abstract."
    ],
    "facts": {
      "design": "animal",
      "population": "Weanling rats"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Glycine blunts methionine accumulation."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:gnmt",
        "note": "Disposal of excess methionine."
      }
    ]
  },
  {
    "id": "article:hayasaka-1980-gcs-p-protein-rat",
    "type": "article",
    "name": "Purification and properties of glycine decarboxylase, a component of the glycine cleavage system, from rat liver mitochondria and immunochemical comparison of this enzyme from various sources",
    "aliases": [
      "Hayasaka 1980"
    ],
    "summary": "Rat liver P-protein of the glycine cleavage system: exchange reaction Km 6.6 mM for glycine and 7.4 uM for H-protein, pH optimum 6.7.",
    "body": [
      "Km(glycine) of the [[enzyme:glycine-cleavage-system|glycine cleavage system]]."
    ],
    "evidence": "plausible",
    "authors": [
      "Hayasaka K",
      "Kochi H",
      "Hiraga K",
      "Kikuchi G"
    ],
    "year": 1980,
    "journal": "Journal of biochemistry",
    "doi": "10.1093/oxfordjournals.jbchem.a133074",
    "pmid": "6778858",
    "url": "https://doi.org/10.1093/oxfordjournals.jbchem.a133074",
    "verified": true,
    "takeaways": [
      "The glycine-bicarbonate exchange reaction was used to characterise the pyridoxal-phosphate P-protein.",
      "Km for glycine is 6.6 mM and for H-protein 7.4 uM."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Rat liver"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:glycine-cleavage-system",
        "note": "P-protein Km(glycine) 6.6 mM (rat)."
      },
      {
        "rel": "evidence-for",
        "to": "compound:plp",
        "note": "PLP-dependent P-protein."
      }
    ]
  },
  {
    "id": "article:fujiwara-1983-gcs-chicken-liver",
    "type": "article",
    "name": "Mechanism of the glycine cleavage reaction. Steady state kinetic studies of the P-protein-catalyzed reaction",
    "aliases": [
      "Fujiwara 1983"
    ],
    "summary": "Chicken liver glycine cleavage system: P-protein Km 5.8 mM for glycine and H-protein 3.4 uM, pH optimum 7.1.",
    "body": [
      "Km(glycine) of the cleavage system (also used in a published model)."
    ],
    "evidence": "plausible",
    "authors": [
      "Fujiwara K",
      "Motokawa Y"
    ],
    "year": 1983,
    "journal": "The Journal of biological chemistry",
    "doi": "10.1016/s0021-9258(20)82042-0",
    "pmid": "6863283",
    "url": "https://doi.org/10.1016/s0021-9258(20)82042-0",
    "verified": true,
    "takeaways": [
      "The glycine-plus-H-protein reaction was characterised with purified P-protein.",
      "Km(glycine) 5.8 mM, Km(H-protein) 3.4 uM."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Chicken liver"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:glycine-cleavage-system",
        "note": "P-protein Km(glycine) 5.8 mM (chicken)."
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Km(glycine) 5.8 mM."
      }
    ]
  },
  {
    "id": "article:murtas-2021-human-phgdh",
    "type": "article",
    "name": "Biochemical and Biophysical Characterization of Recombinant Human 3-Phosphoglycerate Dehydrogenase",
    "aliases": [
      "Murtas 2021"
    ],
    "summary": "Human recombinant PHGDH: Km 0.26-0.36 mM for 3-phosphoglycerate, kcat 1.5-3.0 per second per monomer; neither serine nor glycine inhibited the enzyme.",
    "body": [
      "Kinetics of the first committed step of serine synthesis ([[enzyme:phgdh|PHGDH]])."
    ],
    "evidence": "plausible",
    "authors": [
      "Murtas G",
      "Marcone GL",
      "Peracchi A",
      "Zangelmi E",
      "Pollegioni L"
    ],
    "year": 2021,
    "journal": "International journal of molecular sciences",
    "doi": "10.3390/ijms22084231",
    "pmid": "33921788",
    "url": "https://doi.org/10.3390/ijms22084231",
    "verified": true,
    "takeaways": [
      "Two assay formats gave Km(3-phosphoglycerate) 0.255 and 0.360 mM and Km(NAD+) 0.15 mM at 37 C, pH 7.0.",
      "Serine and glycine at the tested concentrations did not inhibit the enzyme, in contrast to older reports."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Human recombinant PHGDH"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:phgdh",
        "note": "Km(3PG) 0.26-0.36 mM; no feedback by serine or glycine."
      },
      {
        "rel": "evidence-for",
        "to": "compound:serine",
        "note": "Serine synthesis."
      }
    ]
  },
  {
    "id": "article:rohwer-2021-human-glyat",
    "type": "article",
    "name": "Functional Characterisation of Three Glycine N-Acyltransferase Variants and the Effect on Glycine Conjugation to Benzoyl-CoA",
    "aliases": [
      "Rohwer 2021"
    ],
    "summary": "Human recombinant glycine N-acyltransferase is cooperative for glycine (s0.5 about 23 mM, Hill 1.6; benzoyl-CoA s0.5 97 uM; kcat 0.48 per second).",
    "body": [
      "Kinetics of glycine conjugation with benzoate (hippurate)."
    ],
    "evidence": "plausible",
    "authors": [
      "Rohwer JM",
      "Schutte C",
      "van der Sluis R"
    ],
    "year": 2021,
    "journal": "International journal of molecular sciences",
    "doi": "10.3390/ijms22063129",
    "pmid": "33803916",
    "url": "https://doi.org/10.3390/ijms22063129",
    "verified": true,
    "takeaways": [
      "The enzyme that makes hippurate from benzoyl-CoA and glycine follows cooperative kinetics rather than Michaelis-Menten.",
      "s0.5(glycine) = 23 +/- 2 mM, Hill 1.6; benzoyl-CoA 97 +/- 3 uM.",
      "The measurements are for a single common variant (156Asn>Ser)."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Human recombinant GLYAT"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:hippuric-acid",
        "note": "Hippurate formation requires glycine at mM levels."
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "s0.5 23 mM."
      }
    ]
  },
  {
    "id": "article:beyoglu-2012-glycine-conjugation-review",
    "type": "article",
    "name": "The glycine deportation system and its pharmacological consequences",
    "aliases": [
      "Beyoğlu 2012"
    ],
    "summary": "Review of the glycine conjugation pathway: 400-800 mg glycine per day is excreted as hippurate in humans, using glycine N-acyltransferase.",
    "body": [
      "Glycine sink for hippurate formation."
    ],
    "evidence": "established",
    "authors": [
      "Beyoğlu D",
      "Idle JR"
    ],
    "year": 2012,
    "journal": "Pharmacology & therapeutics",
    "doi": "10.1016/j.pharmthera.2012.05.003",
    "pmid": "22584143",
    "url": "https://doi.org/10.1016/j.pharmthera.2012.05.003",
    "verified": true,
    "takeaways": [
      "Benzoate from diet and gut microbiota is conjugated with glycine to hippurate.",
      "Daily glycine use for hippurate is 400-800 mg.",
      "Genetic and dietary variation in conjugation capacity is large."
    ],
    "facts": {
      "design": "review",
      "population": "Review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:hippuric-acid",
        "note": "400-800 mg glycine/day to hippurate."
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Glycine sink."
      }
    ]
  },
  {
    "id": "article:johnson-1991-baat-human-liver",
    "type": "article",
    "name": "Purification and characterization of bile acid-CoA:amino acid N-acyltransferase from human liver",
    "aliases": [
      "Johnson 1991"
    ],
    "summary": "A single human liver enzyme (BAAT, 50 kDa) conjugates cholyl-CoA with glycine (Km 5.8 mM, Vmax 0.77) and taurine (Km 1.1 mM, Vmax 0.33 umol/min/mg).",
    "body": [
      "Kinetics for glycine versus taurine conjugation ([[enzyme:baat|BAAT]])."
    ],
    "evidence": "plausible",
    "authors": [
      "Johnson MR",
      "Barnes S",
      "Kwakye JB",
      "Diasio RB"
    ],
    "year": 1991,
    "journal": "The Journal of biological chemistry",
    "doi": "10.1016/s0021-9258(18)99213-6",
    "pmid": "2037576",
    "url": "https://doi.org/10.1016/s0021-9258(18)99213-6",
    "verified": true,
    "takeaways": [
      "Bile acid-CoA:amino acid N-acyltransferase was purified 480-fold from human liver.",
      "It also uses 2-fluoro-beta-alanine from fluorouracil catabolism (Km 2.2 mM) but not beta-alanine.",
      "One monomeric enzyme conjugates with both amino acids."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Human liver BAAT"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:baat",
        "note": "Km(taurine) 1.1 mM, Km(glycine) 5.8 mM."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:bile-acid-conjugation",
        "note": "Competition between two amino acids for one enzyme."
      }
    ]
  },
  {
    "id": "article:styles-2016-baat-recombinant",
    "type": "article",
    "name": "Carboxy-terminal mutations of bile acid CoA:N-acyltransferase alter activity and substrate specificity",
    "aliases": [
      "Styles 2016"
    ],
    "summary": "Recombinant human BAAT, ping-pong kinetics: Km 1.86 mM taurine, 3.95 mM glycine, 0.185 mM cholyl-CoA; Vmax is higher for taurine (21.7) than glycine (8.7 nmol/min/mg).",
    "body": [
      "Second set of BAAT constants, and the cholyl-CoA Km."
    ],
    "evidence": "plausible",
    "authors": [
      "Styles NA",
      "Shonsey EM",
      "Falany JL",
      "Guidry AL",
      "Barnes S",
      "Falany CN"
    ],
    "year": 2016,
    "journal": "Journal of lipid research",
    "doi": "10.1194/jlr.m064428",
    "pmid": "27230263",
    "url": "https://doi.org/10.1194/jlr.m064428",
    "verified": true,
    "takeaways": [
      "Kinetic parameters of recombinant human BAAT were measured for the bile acid CoA and both amino acids.",
      "Km: taurine 1.86 mM, glycine 3.95 mM, cholyl-CoA 0.185 mM.",
      "In contrast to the purified liver enzyme, the recombinant enzyme has a higher Vmax for taurine than glycine."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Recombinant human BAAT"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:baat",
        "note": "Km values and ping-pong mechanism."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:bile-acid-conjugation",
        "note": "Glycine and taurine compete for one enzyme."
      }
    ]
  },
  {
    "id": "article:nijhout-2009-glycine-pulse-model",
    "type": "article",
    "name": "A mathematical model gives insights into the effects of vitamin B-6 deficiency on 1-carbon and glutathione metabolism",
    "aliases": [
      "Nijhout 2009"
    ],
    "summary": "Mathematical model of vitamin B-6 deficiency in one-carbon and glutathione metabolism; a simulated glycine pulse returns to baseline in 5-7 h, more slowly when SHMT is impaired.",
    "body": [
      "Comparator for glycine kinetics and the PLP dependence of SHMT; no numbers taken."
    ],
    "evidence": "plausible",
    "authors": [
      "Nijhout HF",
      "Gregory JF",
      "Fitzpatrick C",
      "Cho E",
      "Lamers KY",
      "Ulrich CM",
      "Reed MC"
    ],
    "year": 2009,
    "journal": "The Journal of nutrition",
    "doi": "10.3945/jn.109.104265",
    "pmid": "19244383",
    "url": "https://doi.org/10.3945/jn.109.104265",
    "verified": true,
    "takeaways": [
      "The model couples folate, methionine and glutathione metabolism with PLP-dependent steps and was tuned to published B6 restriction data.",
      "The glycine cleavage system Km for glycine was taken from the chicken enzyme.",
      "Predictions are model output; no new measurements."
    ],
    "facts": {
      "design": "modelling study",
      "population": "Computational model"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:glycine-cleavage",
        "note": "Glycine pulse kinetics."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:shmt",
        "note": "SHMT activity controls glycine return."
      },
      {
        "rel": "evidence-for",
        "to": "state:b6-functional-deficiency",
        "note": "Model of B6 deficiency."
      }
    ]
  },
  {
    "id": "article:perry-2007-shmt-plp-mcf7",
    "type": "article",
    "name": "Effect of vitamin B6 availability on serine hydroxymethyltransferase in MCF-7 cells",
    "aliases": [
      "Perry 2007"
    ],
    "summary": "Human cytosolic SHMT binds PLP with Kd 850 nM; in cells PLP can fall 72% with only 7% loss of SHMT activity (4.9 nM pyridoxine: -75% PLP, -27% SHMT activity, -60% SAM).",
    "body": [
      "Basis of the PLP saturation factor for [[enzyme:shmt|SHMT]]."
    ],
    "evidence": "plausible",
    "authors": [
      "Perry C",
      "Yu S",
      "Chen J",
      "Matharu KS",
      "Stover PJ"
    ],
    "year": 2007,
    "journal": "Archives of biochemistry and biophysics",
    "doi": "10.1016/j.abb.2007.04.005",
    "pmid": "17482557",
    "url": "https://doi.org/10.1016/j.abb.2007.04.005",
    "verified": true,
    "takeaways": [
      "Recombinant human cytosolic SHMT has a PLP dissociation constant of 850 nM, about 100 times tighter than the bovine enzyme.",
      "MCF-7 cells at 49 nM pyridoxine had 72% less PLP and 7% less SHMT activity; at 4.9 nM, 75% less PLP, 27% less activity and 60% less SAM.",
      "Mitochondrial SHMT was less sensitive than cytosolic SHMT."
    ],
    "facts": {
      "design": "in-vitro",
      "population": "Recombinant human SHMT; MCF-7 cells"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:shmt",
        "note": "PLP Kd 850 nM; modest activity loss until PLP falls >70%."
      },
      {
        "rel": "evidence-for",
        "to": "compound:plp",
        "note": "Cellular PLP and SAM fall with B6 restriction."
      },
      {
        "rel": "evidence-for",
        "to": "state:b6-functional-deficiency",
        "note": "Quantifies the cellular response."
      }
    ]
  },
  {
    "id": "article:lipson-1980-cbs-plp-fibroblasts",
    "type": "article",
    "name": "Affinity of cystathionine beta-synthase for pyridoxal 5'-phosphate in cultured cells. A mechanism for pyridoxine-responsive homocystinuria",
    "aliases": [
      "Lipson 1980"
    ],
    "summary": "In human fibroblasts CBS was ~70% holoenzyme in standard medium and <10% in pyridoxal-free medium as cellular PLP fell >95%; pyridoxine-responsive mutants had a 2-4x higher apparent Km for PLP.",
    "body": [
      "Basis of the PLP saturation factor for [[enzyme:cbs|CBS]]."
    ],
    "evidence": "plausible",
    "authors": [
      "Lipson MH",
      "Kraus J",
      "Rosenberg LE"
    ],
    "year": 1980,
    "journal": "The Journal of clinical investigation",
    "doi": "10.1172/jci109843",
    "pmid": "7400312",
    "url": "https://doi.org/10.1172/jci109843",
    "verified": true,
    "takeaways": [
      "Cystathionine beta-synthase apoenzyme saturation with PLP was measured in human fibroblasts.",
      "PLP depletion lowered saturation from ~70% to under 10%.",
      "Mutants from pyridoxine-responsive homocystinuria had apparent Km(PLP) 2-4 times control; unresponsive mutants 16-63 times."
    ],
    "facts": {
      "design": "in-vitro",
      "population": "Human fibroblasts (controls and homocystinuria)"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:cbs",
        "note": "Holoenzyme fraction falls from ~70% to <10% as PLP is depleted."
      },
      {
        "rel": "evidence-for",
        "to": "compound:plp",
        "note": "CBS is strongly PLP-sensitive."
      },
      {
        "rel": "evidence-for",
        "to": "disease:cbs-deficiency",
        "note": "Pyridoxine-responsive mutants have a higher Km(PLP)."
      }
    ]
  },
  {
    "id": "article:gregory-2013-b6-restriction-metabolomics",
    "type": "article",
    "name": "Metabolomic analysis reveals extended metabolic consequences of marginal vitamin B-6 deficiency in healthy human subjects",
    "aliases": [
      "Gregory 2013"
    ],
    "summary": "Marginal B6 restriction (<0.5 mg/day, 28 days, 23 adults) cut plasma PLP from 52.6 to 21.5 nmol/L and raised cystathionine 52%; tHcy, cysteine and glutathione were unchanged.",
    "body": [
      "Quantitative B6 restriction responses ([[state:b6-functional-deficiency|B6 functional deficiency]])."
    ],
    "evidence": "plausible",
    "authors": [
      "Gregory JF",
      "Park Y",
      "Lamers Y",
      "Bandyopadhyay N",
      "Chi YY",
      "Lee K",
      "Kim S",
      "da Silva V",
      "Hove N",
      "Ranka S",
      "Kahveci T",
      "Muller KE",
      "Stevens RD",
      "Newgard CB",
      "Stacpoole PW",
      "Jones DP"
    ],
    "year": 2013,
    "journal": "PloS one",
    "doi": "10.1371/journal.pone.0063544",
    "pmid": "23776431",
    "url": "https://doi.org/10.1371/journal.pone.0063544",
    "verified": true,
    "takeaways": [
      "Controlled-diet trial with metabolomic profiling before and after B6 restriction.",
      "Cystathionine rose from 131 to 199 nmol/L; fasting tHcy stayed at about 6.97 uM; glycine 357 to 393 uM and serine 115 to 125 uM changed non-significantly.",
      "The pattern points to cystathionine as the sensitive marker, with the methionine cycle buffered."
    ],
    "facts": {
      "design": "controlled feeding trial",
      "population": "23 healthy adults"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "state:b6-functional-deficiency",
        "note": "PLP -59%, cystathionine +52%, tHcy unchanged."
      },
      {
        "rel": "evidence-for",
        "to": "compound:plp",
        "note": "PLP 52.6 to 21.5 nmol/L."
      },
      {
        "rel": "evidence-for",
        "to": "compound:cystathionine",
        "note": "+52%."
      }
    ]
  },
  {
    "id": "article:lamers-2011-b6-restriction-methionine-cycle",
    "type": "article",
    "name": "Moderate vitamin B-6 restriction does not alter postprandial methionine cycle rates of remethylation, transmethylation, and total transsulfuration but increases the fractional synthesis rate of cystathionine in healthy young men and women",
    "aliases": [
      "Lamers 2011"
    ],
    "summary": "In nine adults 28 days of B6 restriction lowered plasma PLP from 49 to 19 nmol/L and raised cystathionine from 142 to 236 nM without changing methionine-cycle fluxes.",
    "body": [
      "Second B6-restriction cohort for cystathionine and flux responses."
    ],
    "evidence": "plausible",
    "authors": [
      "Lamers Y",
      "Coats B",
      "Ralat M",
      "Quinlivan EP",
      "Stacpoole PW",
      "Gregory JF"
    ],
    "year": 2011,
    "journal": "The Journal of nutrition",
    "doi": "10.3945/jn.110.134197",
    "pmid": "21430249",
    "url": "https://doi.org/10.3945/jn.110.134197",
    "verified": true,
    "takeaways": [
      "Stable-isotope kinetics showed homocysteine remethylation and transmethylation unchanged.",
      "Cystathionine fractional synthesis rose about 12% in 8 of 9 subjects."
    ],
    "facts": {
      "design": "tracer-study",
      "population": "Nine healthy adults"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "state:b6-functional-deficiency",
        "note": "Cystathionine +66%; methionine-cycle fluxes unchanged."
      },
      {
        "rel": "evidence-for",
        "to": "compound:cystathionine",
        "note": "142 to 236 nM."
      }
    ]
  },
  {
    "id": "article:bor-2003-b6-supplement-plp-response",
    "type": "article",
    "name": "Plasma vitamin B6 vitamers before and after oral vitamin B6 treatment: a randomized placebo-controlled study",
    "aliases": [
      "Bor 2003"
    ],
    "summary": "In 90 coronary patients baseline plasma PLP ranged 5-111 nmol/L (within-person CV 45%); 40 mg/day B6 raised PLP about 10-fold by day 3 and no further to day 84.",
    "body": [
      "Range and supplement response of plasma PLP."
    ],
    "evidence": "plausible",
    "authors": [
      "Bor MV",
      "Refsum H",
      "Bisp MR",
      "Bleie Ø",
      "Schneede J",
      "Nordrehaug JE",
      "Ueland PM",
      "Nygard OK",
      "Nexø E"
    ],
    "year": 2003,
    "journal": "Clinical chemistry",
    "doi": "10.1373/49.1.155",
    "pmid": "12507972",
    "url": "https://doi.org/10.1373/49.1.155",
    "verified": true,
    "takeaways": [
      "PLP was followed over 84 days in patients on 40 mg pyridoxine daily or placebo.",
      "Supplementation raised PLP ~10-fold within three days; 4-pyridoxic acid rose ~50-fold and pyridoxal ~100-fold.",
      "Within-individual variation of PLP was large."
    ],
    "facts": {
      "design": "RCT",
      "population": "90 patients with coronary artery disease"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:plp",
        "note": "PLP 5-111 nmol/L; ~10x on 40 mg/day."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:p5p-supplement",
        "note": "Plasma PLP saturates quickly with supplementation."
      }
    ]
  },
  {
    "id": "article:chiang-2005-b6-ra-plp-response",
    "type": "article",
    "name": "Pyridoxine supplementation corrects vitamin B6 deficiency but does not improve inflammation in patients with rheumatoid arthritis",
    "aliases": [
      "Chiang 2005"
    ],
    "summary": "Pyridoxine 50 mg/day for 30 days took median plasma PLP from 27.0 to 144.5 nmol/L in patients with low PLP and rheumatoid arthritis and lowered the erythrocyte AST activation coefficient 1.80 to 1.33.",
    "body": [
      "Plasma PLP response to a 50 mg/day supplement."
    ],
    "evidence": "plausible",
    "authors": [
      "Chiang EP",
      "Selhub J",
      "Bagley PJ",
      "Dallal G",
      "Roubenoff R"
    ],
    "year": 2005,
    "journal": "Arthritis research & therapy",
    "doi": "10.1186/ar1839",
    "pmid": "16277693",
    "url": "https://doi.org/10.1186/ar1839",
    "verified": true,
    "takeaways": [
      "Randomised trial in rheumatoid arthritis patients with low plasma PLP.",
      "Plasma PLP 27.0 (20.4-30.9) to 144.5 (84.5-236.7) nmol/L; erythrocyte PLP 44.6 to 116.4 nmol/L.",
      "Post-load homocysteine rise showed only a trend (P=0.086)."
    ],
    "facts": {
      "design": "RCT",
      "population": "14 supplemented and placebo rheumatoid arthritis patients"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:plp",
        "note": "27 to 145 nmol/L on 50 mg/day."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:p5p-supplement",
        "note": "Large PLP rise with pyridoxine."
      }
    ]
  },
  {
    "id": "article:ubbink-1996-b6-methionine-load",
    "type": "article",
    "name": "The effect of a subnormal vitamin B-6 status on homocysteine metabolism",
    "aliases": [
      "Ubbink 1996"
    ],
    "summary": "In theophylline-treated asthma patients B6 deficiency enlarged the homocysteine and cystathionine rise after a methionine load, and 20 mg/day B6 for six weeks reduced it.",
    "body": [
      "Qualitative target: low B6 amplifies the post-load response (numerical values not available)."
    ],
    "evidence": "plausible",
    "authors": [
      "Ubbink JB",
      "van der Merwe A",
      "Delport R",
      "Allen RH",
      "Stabler SP",
      "Riezler R",
      "Vermaak WJ"
    ],
    "year": 1996,
    "journal": "The Journal of clinical investigation",
    "doi": "10.1172/jci118763",
    "pmid": "8690790",
    "url": "https://doi.org/10.1172/jci118763",
    "verified": true,
    "takeaways": [
      "Methionine-load tests in 22 patients with low B6 and 24 controls.",
      "The deficient group had larger rises in tHcy (P<0.01) and cystathionine (P<0.05).",
      "Pyridoxine 20 mg/day for six weeks reduced the tHcy rise in the deficient subjects and the cystathionine rise in both groups."
    ],
    "facts": {
      "design": "RCT",
      "population": "22 B6-deficient asthma patients and 24 controls"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "state:b6-functional-deficiency",
        "note": "Larger post-load homocysteine and cystathionine rise."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:transsulfuration",
        "note": "PLP-dependent enzymes limit load handling."
      }
    ]
  },
  {
    "id": "article:elmore-2002-human-kidney-dao",
    "type": "article",
    "name": "Human kidney diamine oxidase: heterologous expression, purification, and characterization",
    "aliases": [
      "Elmore 2002"
    ],
    "summary": "Recombinant human kidney diamine oxidase prefers histamine (Km 2.8 uM) over 1-methylhistamine (3.4 uM) and putrescine (20 uM); copper and TPQ cofactors, 20-26% glycosylated.",
    "body": [
      "Low end of the histamine Km range for [[enzyme:dao|DAO]]."
    ],
    "evidence": "plausible",
    "authors": [
      "Elmore BO",
      "Bollinger JA",
      "Dooley DM"
    ],
    "year": 2002,
    "journal": "Journal of biological inorganic chemistry : JBIC : a publication of the Society of Biological Inorganic Chemistry",
    "doi": "10.1007/s00775-001-0331-1",
    "pmid": "12072962",
    "url": "https://doi.org/10.1007/s00775-001-0331-1",
    "verified": true,
    "takeaways": [
      "First heterologous expression and purification of a catalytically active mammalian copper amine oxidase.",
      "Kinetic studies rank histamine first among substrates, with Km 2.8 uM.",
      "Recombinant enzyme contains TPQ and copper at up to 1.1 and 1.5 mol per homodimer."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Recombinant human DAO"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:dao",
        "note": "Km(histamine) 2.8 uM."
      },
      {
        "rel": "evidence-for",
        "to": "compound:histamine",
        "note": "Preferred substrate."
      }
    ]
  },
  {
    "id": "article:biegan-1983-human-intestinal-dao",
    "type": "article",
    "name": "Distribution and properties of human intestinal diamine oxidase and its relevance for the histamine catabolism",
    "aliases": [
      "Biegański 1983"
    ],
    "summary": "Human colonic mucosa DAO purified 80-fold: Km 19 uM for histamine, 83 uM for putrescine and 97 uM for Ntau-methylhistamine; aminoguanidine IC50 11 nM; activity highest in the intestinal mucosa.",
    "body": [
      "Native intestinal DAO kinetics."
    ],
    "evidence": "plausible",
    "authors": [
      "Biegański T",
      "Kusche J",
      "Lorenz W",
      "Hesterberg R",
      "Stahlknecht CD",
      "Feussner KD"
    ],
    "year": 1983,
    "journal": "Biochimica et biophysica acta",
    "doi": "10.1016/0304-4165(83)90092-2",
    "pmid": "6403048",
    "url": "https://doi.org/10.1016/0304-4165(83)90092-2",
    "verified": true,
    "takeaways": [
      "DAO activity is high in the mucosa of the human intestinal tract and located in the cytoplasm.",
      "pH optima 6.4-6.6 for histamine and 6.6-7.0 for putrescine; aminoguanidine strongly inhibits (IC50 1.1x10^-8 M).",
      "The authors propose a protective role against histamine in ischaemic bowel disease and ulcerative colitis."
    ],
    "facts": {
      "design": "enzymology",
      "population": "Human intestinal tissue"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:dao",
        "note": "Km(histamine) 19 uM; aminoguanidine IC50 11 nM."
      },
      {
        "rel": "evidence-for",
        "to": "compound:histamine",
        "note": "Intestinal histamine degradation."
      },
      {
        "rel": "evidence-for",
        "to": "disease:histamine-intolerance",
        "note": "Enzymatic barrier against dietary histamine."
      }
    ]
  },
  {
    "id": "article:klocker-2004-plasma-dao-heparin",
    "type": "article",
    "name": "Continuous administration of heparin in patients with deep vein thrombosis can increase plasma levels of diamine oxidase",
    "aliases": [
      "Klocker 2004"
    ],
    "summary": "Plasma DAO activity is at the limit of detection in healthy people and heparin infusion raises it variably (43% of patients no rise, 36% persistent elevation).",
    "body": [
      "Why serum DAO is not used as a kinetic parameter."
    ],
    "evidence": "plausible",
    "authors": [
      "Klocker J",
      "Perkmann R",
      "Klein-Weigel P",
      "Mörsdorf G",
      "Drasche A",
      "Klingler A",
      "Fraedrich G",
      "Schwelberger HG"
    ],
    "year": 2004,
    "journal": "Vascular pharmacology",
    "doi": "10.1016/j.vph.2004.02.002",
    "pmid": "15063833",
    "url": "https://doi.org/10.1016/j.vph.2004.02.002",
    "verified": true,
    "takeaways": [
      "The enzyme is mostly tissue bound and is released into plasma by heparin.",
      "Responses to continuous heparin were patient-dependent.",
      "Circulating DAO is therefore a poor proxy for gut mucosal DAO."
    ],
    "facts": {
      "design": "clinical study",
      "population": "Patients receiving heparin"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:dao",
        "note": "Plasma DAO near the detection limit."
      },
      {
        "rel": "evidence-for",
        "to": "disease:histamine-intolerance",
        "note": "Limits serum DAO as a diagnostic."
      }
    ]
  },
  {
    "id": "article:cho-2013-histamine-dao-urticaria",
    "type": "article",
    "name": "Lack of association of plasma histamine with diamine oxidase in chronic idiopathic urticaria",
    "aliases": [
      "Cho 2013"
    ],
    "summary": "In 25 healthy controls plasma histamine was 8.75 nM and plasma DAO activity 81.6 HDU/mL (1 HDU degrades 1 pmol/mL histamine); chronic urticaria patients did not differ in DAO.",
    "body": [
      "Plasma histamine reference value."
    ],
    "evidence": "plausible",
    "authors": [
      "Cho HJ",
      "Cho SI",
      "Kim HO",
      "Park CW",
      "Lee CH"
    ],
    "year": 2013,
    "journal": "Annals of dermatology",
    "doi": "10.5021/ad.2013.25.2.189",
    "pmid": "23717010",
    "url": "https://doi.org/10.5021/ad.2013.25.2.189",
    "verified": true,
    "takeaways": [
      "Plasma histamine and DAO activity were compared in chronic idiopathic urticaria and healthy controls.",
      "Controls: histamine 8.75 +/- 2.55 nM (EIA), DAO 81.6 +/- 9.7 HDU/mL.",
      "The assay unit HDU/mL measures activity and differs from ELISA U/mL."
    ],
    "facts": {
      "design": "case-control",
      "population": "25 healthy controls and chronic urticaria patients"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:histamine",
        "note": "Plasma histamine 8.75 nM."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:dao",
        "note": "DAO activity 81.6 HDU/mL."
      }
    ]
  },
  {
    "id": "article:pollock-1991-plasma-histamine-infusion",
    "type": "article",
    "name": "Plasma histamine and clinical tolerance to infused histamine in normal, atopic and urticarial subjects",
    "aliases": [
      "Pollock 1991"
    ],
    "summary": "IV histamine infusion in normal, atopic and urticarial subjects: after stopping, plasma histamine fell with a half-life of 4.0 min (3.0 atopic, 6.2 urticaria); effects began near 1 ng/mL.",
    "body": [
      "Plasma clearance of histamine."
    ],
    "evidence": "plausible",
    "authors": [
      "Pollock I",
      "Murdoch RD",
      "Lessof MH"
    ],
    "year": 1991,
    "journal": "Agents and actions",
    "doi": "10.1007/bf01980899",
    "pmid": "1907427",
    "url": "https://doi.org/10.1007/bf01980899",
    "verified": true,
    "takeaways": [
      "Infusion rates rose from 0.05 to 0.35 micrograms/kg/min until a clinical end-point.",
      "Resting plasma histamine did not differ between groups.",
      "Half-life after stopping was 4.0 +/- 0.7 min (non-atopic), 3.0 +/- 1.2 (atopic) and 6.2 +/- 1.3 min (urticaria)."
    ],
    "facts": {
      "design": "physiology study",
      "population": "15 subjects (5 urticaria, 5 atopic, 5 controls)"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:histamine",
        "note": "Plasma half-life ~4 min."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:histamine-degradation",
        "note": "Clearance kinetics."
      }
    ]
  },
  {
    "id": "article:rehn-1987-histamine-circadian",
    "type": "article",
    "name": "Biorhythmic changes of plasma histamine levels in healthy volunteers",
    "aliases": [
      "Rehn 1987"
    ],
    "summary": "Twelve volunteers showed three daily peaks of plasma histamine (acrophases about 12.8, 19.3 and 5.4 h), the early-morning rise carrying about 55% of the total.",
    "body": [
      "Timing of the nocturnal histamine rise (partial support for 2-4 am)."
    ],
    "evidence": "plausible",
    "authors": [
      "Rehn D",
      "Reimann HJ",
      "von der Ohe M",
      "Schmidt U",
      "Schmel A",
      "Hennings G"
    ],
    "year": 1987,
    "journal": "Agents and actions",
    "doi": "10.1007/bf01968812",
    "pmid": "3687597",
    "url": "https://doi.org/10.1007/bf01968812",
    "verified": true,
    "takeaways": [
      "Plasma histamine was measured around the clock.",
      "A statistical rhythm analysis found three maxima with the largest in the early morning (5.4 +/- 1.8 h).",
      "The timing sits near, but not specifically at, 2-4 a.m."
    ],
    "facts": {
      "design": "physiology study",
      "population": "12 healthy volunteers"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "claim:histamine-peaks-2-4am",
        "note": "Early-morning peak at about 5 a.m., plus two daytime maxima; not specifically 2-4 a.m."
      },
      {
        "rel": "evidence-for",
        "to": "compound:histamine",
        "note": "Circadian plasma rhythm."
      }
    ]
  },
  {
    "id": "article:szefler-1991-nocturnal-histamine",
    "type": "article",
    "name": "Plasma histamine, epinephrine, cortisol, and leukocyte beta-adrenergic receptors in nocturnal asthma",
    "aliases": [
      "Szefler 1991"
    ],
    "summary": "Plasma histamine was about twice as high at 04:00 as at 16:00 in asthmatics and in 10 normal subjects, with no change in cortisol or epinephrine.",
    "body": [
      "Magnitude of the early-morning plasma histamine rise."
    ],
    "evidence": "plausible",
    "authors": [
      "Szefler SJ",
      "Ando R",
      "Cicutto LC",
      "Surs W",
      "Hill MR",
      "Martin RJ"
    ],
    "year": 1991,
    "journal": "Clinical pharmacology and therapeutics",
    "doi": "10.1038/clpt.1991.11",
    "pmid": "1846332",
    "url": "https://doi.org/10.1038/clpt.1991.11",
    "verified": true,
    "takeaways": [
      "Day-night differences in plasma histamine were compared with hormones in normal and asthmatic people.",
      "Histamine at 04:00 was roughly double that at 16:00 in all groups.",
      "The nocturnal rise was not explained by cortisol or epinephrine."
    ],
    "facts": {
      "design": "physiology study",
      "population": "Asthmatic and normal adults"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "claim:histamine-peaks-2-4am",
        "note": "Plasma histamine ~2x higher at 04:00 than 16:00 in normal subjects."
      },
      {
        "rel": "evidence-for",
        "to": "compound:histamine",
        "note": "Nocturnal rise."
      }
    ]
  },
  {
    "id": "article:schulze-1992-urinary-histamine-no-rhythm",
    "type": "article",
    "name": "Diurnal variation of urinary histamine and 1-methylhistamine excretion in healthy children",
    "aliases": [
      "Schulze 1992"
    ],
    "summary": "In 14 healthy children urinary histamine and 1-methylhistamine showed no circadian rhythm and no response to food, with intra-individual variation of 45% and 24% of baseline.",
    "body": [
      "Counter-evidence to a urinary histamine rhythm."
    ],
    "evidence": "plausible",
    "authors": [
      "Schulze S",
      "Niggemann B",
      "Savaser AN",
      "Wahn U"
    ],
    "year": 1992,
    "journal": "Allergy",
    "doi": "10.1111/j.1398-9995.1992.tb02389.x",
    "pmid": "1285571",
    "url": "https://doi.org/10.1111/j.1398-9995.1992.tb02389.x",
    "verified": true,
    "takeaways": [
      "Two-hour urine collections were analysed over 24 hours.",
      "No rhythm was found for either compound.",
      "The authors conclude that a single timed sample is not reliable."
    ],
    "facts": {
      "design": "physiology study",
      "population": "14 healthy children"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "claim:histamine-peaks-2-4am",
        "note": "No urinary rhythm in children."
      },
      {
        "rel": "evidence-for",
        "to": "compound:histamine",
        "note": "Urinary histamine shows no circadian rhythm in children."
      }
    ]
  },
  {
    "id": "article:arih-2023-serum-dao-hit",
    "type": "article",
    "name": "Evaluation of Serum Diamine Oxidase as a Diagnostic Test for Histamine Intolerance",
    "aliases": [
      "Arih 2023"
    ],
    "summary": "Serum DAO (ELISA) median 18 U/mL in 50 controls versus 8-10 in suspected histamine intolerance; low specificity means it should not be used alone for diagnosis.",
    "body": [
      "Why serum DAO is used only as a rough indicator."
    ],
    "evidence": "plausible",
    "authors": [
      "Arih K",
      "Đorđević N",
      "Košnik M",
      "Rijavec M"
    ],
    "year": 2023,
    "journal": "Nutrients",
    "doi": "10.3390/nu15194246",
    "pmid": "37836530",
    "url": "https://doi.org/10.3390/nu15194246",
    "verified": true,
    "takeaways": [
      "Serum DAO was measured in 249 patients and 50 healthy controls.",
      "Medians: controls 18 (14-22), high-probability HIT 8 (6-10), low-probability HIT 10 (7-16) U/mL.",
      "At a cut-off below 10 U/mL sensitivity was 92% and specificity 71% against controls."
    ],
    "facts": {
      "design": "case-control",
      "population": "249 patients and 50 controls"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:histamine-intolerance",
        "note": "Serum DAO has limited diagnostic value."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:dao",
        "note": "Median 18 U/mL in controls."
      }
    ]
  },
  {
    "id": "article:van-odijk-2023-serum-dao-population",
    "type": "article",
    "name": "The Use of DAO as a Marker for Histamine Intolerance: Measurements and Determinants in a Large Random Population-Based Survey",
    "aliases": [
      "van 2023"
    ],
    "summary": "In 1051 adults from the general population the median serum DAO was 11.1 U/mL, 44% were below the 10 U/mL cut-off, and DAO was not associated with symptoms after histamine-rich foods.",
    "body": [
      "Counter-evidence for serum DAO as a diagnostic."
    ],
    "evidence": "plausible",
    "authors": [
      "van Odijk J",
      "Weisheit A",
      "Arvidsson M",
      "Miron N",
      "Nwaru B",
      "Ekerljung L"
    ],
    "year": 2023,
    "journal": "Nutrients",
    "doi": "10.3390/nu15132887",
    "pmid": "37447214",
    "url": "https://doi.org/10.3390/nu15132887",
    "verified": true,
    "takeaways": [
      "Population sample (West Sweden Asthma Study) with food-symptom questionnaires.",
      "Low serum DAO was common and was not linked to symptoms.",
      "This weakens the case for DAO ELISA as a symptom predictor."
    ],
    "facts": {
      "design": "cross-sectional",
      "population": "1051 adults"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:histamine-intolerance",
        "note": "Low serum DAO is common and symptom-unrelated."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:dao",
        "note": "Population median 11.1 U/mL."
      }
    ]
  },
  {
    "id": "article:imamura-1984-urinary-histamine-food",
    "type": "article",
    "name": "Effect of food intake on urinary excretions of histamine, N tau-methylhistamine, imidazole acetic acid and its conjugate(s) in humans and mice",
    "aliases": [
      "Imamura 1984"
    ],
    "summary": "In young men urinary histamine metabolites rose 1-3 hours after food intake, indicating origin largely in the stomach.",
    "body": [
      "Why urinary histamine does not show a night peak."
    ],
    "evidence": "plausible",
    "authors": [
      "Imamura I",
      "Watanabe T",
      "Maeyama K",
      "Kubota A",
      "Okada A",
      "Wada H"
    ],
    "year": 1984,
    "journal": "Journal of biochemistry",
    "doi": "10.1093/oxfordjournals.jbchem.a135028",
    "pmid": "6442293",
    "url": "https://doi.org/10.1093/oxfordjournals.jbchem.a135028",
    "verified": true,
    "takeaways": [
      "Excretion of histamine and its metabolites followed meals.",
      "The authors interpret the urinary pool as largely gastric in origin."
    ],
    "facts": {
      "design": "physiology study",
      "population": "Young healthy men"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:histamine",
        "note": "Food-linked urinary histamine."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:blood-histamine-level",
        "note": "Urinary histamine metabolites follow food intake."
      }
    ]
  },
  {
    "id": "article:mita-1980-plasma-histamine-gcms",
    "type": "article",
    "name": "Simultaneous determination of histamine and N tau-methylhistamine in human plasma and urine by gas chromatography--mass spectrometry",
    "aliases": [
      "Mita 1980"
    ],
    "summary": "GC-MS measurement of human plasma histamine gave 0.83 +/- 0.37 ng/mL (about 7.5 nM) in five normal subjects.",
    "body": [
      "Second plasma histamine reference."
    ],
    "evidence": "plausible",
    "authors": [
      "Mita H",
      "Yasueda H",
      "Shida T"
    ],
    "year": 1980,
    "journal": "Journal of chromatography",
    "doi": "10.1016/s0378-4347(00)81001-4",
    "pmid": "7451611",
    "url": "https://doi.org/10.1016/s0378-4347(00)81001-4",
    "verified": true,
    "takeaways": [
      "A gas chromatography-mass spectrometry method for plasma histamine.",
      "Normal plasma histamine was 0.83 +/- 0.37 ng/mL."
    ],
    "facts": {
      "design": "analytical method",
      "population": "Five normal subjects"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:histamine",
        "note": "Plasma ~0.8 ng/mL."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:blood-histamine-level",
        "note": "Normal plasma histamine about 0.8 ng/mL."
      }
    ]
  },
  {
    "id": "article:hepner-1972-glycine-conjugated-dihydroxy-bile-acids",
    "type": "article",
    "name": "Metabolism of steroid and amino acid moieties of conjugated bile acids in man. II. Glycine-conjugated dihydroxy bile acids",
    "aliases": [
      "Hepner 1972"
    ],
    "summary": "Labelled glycine-conjugated bile acids in 10 healthy people: the glycine moiety turned over 3x faster than the steroid; about 6 mmol/day of glycine is used for bile acid conjugation.",
    "body": [
      "Gross glycine flux through bile acid conjugation."
    ],
    "evidence": "plausible",
    "authors": [
      "Hepner GW",
      "Hofmann AF",
      "Thomas PJ"
    ],
    "year": 1972,
    "journal": "The Journal of clinical investigation",
    "doi": "10.1172/jci106992",
    "pmid": "5032530",
    "url": "https://doi.org/10.1172/jci106992",
    "verified": true,
    "takeaways": [
      "Glycine-labelled bile acids were followed in bile, faeces and breath.",
      "Daily fractional turnover of the glycine moiety was more than three times that of the steroid.",
      "Intestinal absorption of the glycine-conjugated dihydroxy bile acids is about 95% per cycle.",
      "Healthy subjects use about 6 mmol/day of glycine for bile acid conjugation, most of it reconjugation after bacterial deconjugation."
    ],
    "facts": {
      "design": "tracer-study",
      "population": "10 healthy subjects"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:bile-acid-conjugation",
        "note": "Glycine moiety turns over 3x faster than the steroid."
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "About 6 mmol/day used."
      },
      {
        "rel": "evidence-for",
        "to": "compound:bile-acids",
        "note": "Enterohepatic recycling."
      }
    ]
  },
  {
    "id": "article:hepner-1972-cholylglycine-turnover",
    "type": "article",
    "name": "Metabolism of steroid and amino acid moieties of conjugated bile acids in man. I. Cholylglycine",
    "aliases": [
      "Hepner 1972"
    ],
    "summary": "Tracer study of cholylglycine in man: glycine moiety turnover 106%/day versus 38%/day for the cholyl moiety, 18% deconjugated per cycle, and 52% of the glycine label ended up in breath CO2.",
    "body": [
      "Deconjugation and fate of the glycine moiety."
    ],
    "evidence": "plausible",
    "authors": [
      "Hepner GW",
      "Hofmann AF",
      "Thomas PJ"
    ],
    "year": 1972,
    "journal": "The Journal of clinical investigation",
    "doi": "10.1172/jci106991",
    "pmid": "5032529",
    "url": "https://doi.org/10.1172/jci106991",
    "verified": true,
    "takeaways": [
      "Cholylglycine labelled in both moieties was administered orally to eight subjects.",
      "The glycine moiety turns over about three times as fast as the cholyl moiety.",
      "Eighteen percent of the pool is deconjugated per enterohepatic cycle; 52 +/- 5% of the glycine label was recovered as breath CO2."
    ],
    "facts": {
      "design": "tracer-study",
      "population": "8 healthy subjects"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:bile-acid-conjugation",
        "note": "Deconjugation 18% per cycle."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:bile-salt-hydrolase",
        "note": "Bacterial deconjugation and glycine oxidation."
      }
    ]
  },
  {
    "id": "article:chiang-2009-bile-acid-regulation",
    "type": "article",
    "name": "Bile acids: regulation of synthesis",
    "aliases": [
      "Chiang 2009"
    ],
    "summary": "Review of bile acid synthesis and regulation: faecal loss and de novo synthesis 0.2-0.6 g/day, pool recycled 4-12 times a day.",
    "body": [
      "Bile acid synthesis and cycling rates."
    ],
    "evidence": "established",
    "authors": [
      "Chiang JY"
    ],
    "year": 2009,
    "journal": "Journal of lipid research",
    "doi": "10.1194/jlr.r900010-jlr200",
    "pmid": "19346330",
    "url": "https://doi.org/10.1194/jlr.r900010-jlr200",
    "verified": true,
    "takeaways": [
      "The classical and alternative pathways make cholic and chenodeoxycholic acid.",
      "Daily synthesis equals faecal loss, 0.2-0.6 g/day.",
      "The pool circulates 4-12 times per day."
    ],
    "facts": {
      "design": "review",
      "population": "Review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:bile-acids",
        "note": "Synthesis 0.2-0.6 g/day."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:bile-acid-conjugation",
        "note": "Conjugation within the enterohepatic cycle."
      }
    ]
  },
  {
    "id": "article:hofmann-2014-enterohepatic-circulation",
    "type": "article",
    "name": "Key discoveries in bile acid chemistry and biology and their clinical applications: history of the last eight decades",
    "aliases": [
      "Hofmann 2014"
    ],
    "summary": "Review of bile acid enterohepatic circulation: ~12 g/day secreted, the returning flux at least 20x new synthesis, and taurine conjugates deconjugated more slowly than glycine conjugates.",
    "body": [
      "Bile acid secretion rate and deconjugation."
    ],
    "evidence": "established",
    "authors": [
      "Hofmann AF",
      "Hagey LR"
    ],
    "year": 2014,
    "journal": "Journal of lipid research",
    "doi": "10.1194/jlr.r049437",
    "pmid": "24838141",
    "url": "https://doi.org/10.1194/jlr.r049437",
    "verified": true,
    "takeaways": [
      "Duodenal-perfusion studies suggest about 12 g of bile acids are secreted per day.",
      "New synthesis is a small fraction of the cycling flux.",
      "Bacterial bile salt hydrolases deconjugate taurine conjugates more slowly than glycine conjugates."
    ],
    "facts": {
      "design": "review",
      "population": "Review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:bile-acids",
        "note": "Secretion ~12 g/day."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:bile-acid-conjugation",
        "note": "Deconjugation preferences."
      }
    ]
  },
  {
    "id": "article:hamilton-2007-cecal-bile-acids",
    "type": "article",
    "name": "Human cecal bile acids: concentration and spectrum",
    "aliases": [
      "Hamilton 2007"
    ],
    "summary": "Caecal bile acids in 19 autopsy cases were 90% unconjugated, 7% sulfated and 3% amidated, with concentrations about 0.4-0.6 mM.",
    "body": [
      "Extent of bacterial deconjugation (glycine release)."
    ],
    "evidence": "plausible",
    "authors": [
      "Hamilton JP",
      "Xie G",
      "Raufman JP",
      "Hogan S",
      "Griffin TL",
      "Packard CA",
      "Chatfield DA",
      "Hagey LR",
      "Steinbach JH",
      "Hofmann AF"
    ],
    "year": 2007,
    "journal": "American journal of physiology. Gastrointestinal and liver physiology",
    "doi": "10.1152/ajpgi.00027.2007",
    "pmid": "17412828",
    "url": "https://doi.org/10.1152/ajpgi.00027.2007",
    "verified": true,
    "takeaways": [
      "Bile acids were measured in the human caecum.",
      "Most had been deconjugated by gut bacteria.",
      "Concentrations were about 0.4 mM (3alpha-OH) to 0.6 mM (total)."
    ],
    "facts": {
      "design": "autopsy study",
      "population": "19 autopsy cases"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:bile-salt-hydrolase",
        "note": "Deconjugation ~90% in the caecum."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:bile-acid-conjugation",
        "note": "Glycine released by bacteria."
      }
    ]
  },
  {
    "id": "article:hardison-1983-taurine-supplementation-bile",
    "type": "article",
    "name": "Effect of bile acid conjugation pattern on bile acid metabolism in normal humans",
    "aliases": [
      "Hardison 1983"
    ],
    "summary": "In six men 3 g/day taurine for 2 weeks reversed the biliary glycine:taurine conjugate ratio with only small effects on pool size, faecal loss and biliary secretion.",
    "body": [
      "Shows the glycine:taurine ratio follows amino acid supply."
    ],
    "evidence": "plausible",
    "authors": [
      "Hardison WG",
      "Grundy SM"
    ],
    "year": 1983,
    "journal": "Gastroenterology",
    "doi": "10.1016/0016-5085(83)90088-4",
    "pmid": "6822329",
    "url": "https://doi.org/10.1016/0016-5085(83)90088-4",
    "verified": true,
    "takeaways": [
      "Taurine 0.5 g six times a day was given for two weeks.",
      "The glycine-to-taurine conjugate ratio was reversed.",
      "Effects on bile acid pool and secretion were small and judged physiologically unimportant."
    ],
    "facts": {
      "design": "intervention study",
      "population": "6 men"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:taurine",
        "note": "3 g/day reverses the conjugation ratio."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:bile-acid-conjugation",
        "note": "Ratio is substrate-driven."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:taurine-supplement",
        "note": "Changes bile acid conjugation."
      }
    ]
  },
  {
    "id": "article:northfield-1975-bile-acid-pool-size",
    "type": "article",
    "name": "Biliary lipid output during three meals and an overnight fast. I. Relationship to bile acid pool size and cholesterol saturation of bile in gallstone and control subjects",
    "aliases": [
      "Northfield 1975"
    ],
    "summary": "Pool size and cycling frequency of bile acids are inversely related, so total secretion stays almost constant.",
    "body": [
      "Why pool size and cycles per day are not independent."
    ],
    "evidence": "plausible",
    "authors": [
      "Northfield TC",
      "Hofmann AF"
    ],
    "year": 1975,
    "journal": "Gut",
    "doi": "10.1136/gut.16.1.1",
    "pmid": "806491",
    "url": "https://doi.org/10.1136/gut.16.1.1",
    "verified": true,
    "takeaways": [
      "Bile acid kinetics were analysed in healthy subjects.",
      "A smaller pool recycles more often, keeping secretion about the same."
    ],
    "facts": {
      "design": "physiology study",
      "population": "Healthy subjects"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:bile-acids",
        "note": "Inverse relation of pool size and cycling frequency."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:bile-acid-conjugation",
        "note": "Secretion is nearly constant while pool size and cycling vary."
      }
    ]
  },
  {
    "id": "article:feldman-1986-24h-acid-secretion",
    "type": "article",
    "name": "Total 24-hour gastric acid secretion in patients with duodenal ulcer. Comparison with normal subjects and effects of cimetidine and parietal cell vagotomy",
    "aliases": [
      "Feldman 1986"
    ],
    "summary": "Total 24-hour gastric acid secretion was 208 mmol in 7 normal subjects and 408 mmol in 8 duodenal ulcer patients; cimetidine 400 mg twice daily brought patients to 235 mmol.",
    "body": [
      "Daily acid secretion total for the [[pathway:gastric-acid-secretion|acid]] budget."
    ],
    "evidence": "established",
    "authors": [
      "Feldman M",
      "Richardson CT"
    ],
    "year": 1986,
    "journal": "Gastroenterology",
    "doi": "10.1016/0016-5085(86)91106-6",
    "pmid": "3943686",
    "url": "https://doi.org/10.1016/0016-5085(86)91106-6",
    "verified": true,
    "takeaways": [
      "Basal, interprandial and nocturnal output were measured by aspiration and meal-stimulated output by in vivo titration.",
      "Duodenal ulcer patients secreted about twice normal throughout day and night.",
      "Parietal-cell vagotomy lowered 24-hour output to 87 mmol, below normal."
    ],
    "facts": {
      "design": "physiology study",
      "population": "7 normal subjects and 8 duodenal ulcer patients"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:gastric-acid-secretion",
        "note": "24-h acid secretion ~208 mmol."
      },
      {
        "rel": "evidence-for",
        "to": "compound:hydrochloric-acid",
        "note": "Daily acid load."
      },
      {
        "rel": "evidence-for",
        "to": "disease:peptic-ulcer",
        "note": "Hypersecretion in duodenal ulcer."
      }
    ]
  },
  {
    "id": "article:dubey-1983-acid-alkali-in-situ-titration",
    "type": "article",
    "name": "Simultaneous measurement of gastric acid and duodenal alkali secretion by in situ titration in health and disease",
    "aliases": [
      "Dubey 1983"
    ],
    "summary": "In situ titration: after food healthy people secrete about equal acid and alkali (15.8 vs 18.2 mmol/h); duodenal ulcer patients hypersecrete acid and pancreatitis patients under-secrete alkali.",
    "body": [
      "Matched meal-stimulated acid and alkali output."
    ],
    "evidence": "plausible",
    "authors": [
      "Dubey P",
      "Nundy S"
    ],
    "year": 1983,
    "journal": "Gut",
    "doi": "10.1136/gut.24.12.1126",
    "pmid": "6642276",
    "url": "https://doi.org/10.1136/gut.24.12.1126",
    "verified": true,
    "takeaways": [
      "Pentagastric acid output measured by the new technique was 17.2 mmol/h, matching aspiration (15.4); secretin alkali response 16.0 vs 14.4 mmol/h.",
      "Food response in 10 controls: acid 15.8 +/- 1.7, alkali 18.2 +/- 1.3 mmol/h.",
      "Duodenal ulcer: acid 31.9 vs alkali 21.9; pancreatitis: alkali 11.4 vs acid 19.8 mmol/h."
    ],
    "facts": {
      "design": "physiology study",
      "population": "10 controls, 10 duodenal ulcer, 10 pancreatitis"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:acid-bicarbonate-neutralisation",
        "note": "Acid and alkali are matched after food."
      },
      {
        "rel": "evidence-for",
        "to": "system:pancreas-bicarbonate",
        "note": "Alkali output ~18 mmol/h."
      },
      {
        "rel": "evidence-for",
        "to": "disease:peptic-ulcer",
        "note": "Acid hypersecretion in duodenal ulcer."
      }
    ]
  },
  {
    "id": "article:taylor-1978-pentagastrin-oxo-meal-titration",
    "type": "article",
    "name": "Comparison of an intragastric method of estimating acid output with the pentagastrin test in normal and duodenal ulcer subjects",
    "aliases": [
      "Taylor 1978"
    ],
    "summary": "In 8 controls gastric acid output by Oxo-meal titration was 20.1 mmol/h versus 13.7 mmol/h by pentagastrin; duodenal ulcer patients had 22.7 and 23.0.",
    "body": [
      "Lower value in the range of stimulated acid output."
    ],
    "evidence": "plausible",
    "authors": [
      "Taylor TV",
      "Elder JB",
      "Ganguli PC",
      "Gillespie IE"
    ],
    "year": 1978,
    "journal": "Gut",
    "doi": "10.1136/gut.19.10.865",
    "pmid": "568584",
    "url": "https://doi.org/10.1136/gut.19.10.865",
    "verified": true,
    "takeaways": [
      "Meal-stimulated and pentagastrin-stimulated acid output were compared.",
      "In controls the meal stimulus gave a higher output than pentagastrin."
    ],
    "facts": {
      "design": "physiology study",
      "population": "8 controls and 9 duodenal ulcer patients"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:gastric-acid-secretion",
        "note": "Pentagastrin acid output 13.7 mmol/h in controls."
      },
      {
        "rel": "evidence-for",
        "to": "disease:peptic-ulcer",
        "note": "Duodenal ulcer patients 22.7 and 23.0 mmol/h."
      }
    ]
  },
  {
    "id": "article:katelaris-1993-gastric-acid-age-hpylori",
    "type": "article",
    "name": "Effect of age, Helicobacter pylori infection, and gastritis with atrophy on serum gastrin and gastric acid secretion in healthy men",
    "aliases": [
      "Katelaris 1993"
    ],
    "summary": "Healthy men without gastric atrophy had basal acid output 5.1, sham-fed 9.3, maximal 31.4 and peak 43.4 mmol/h; atrophy cut these to 3.0, 5.4, 18.9 and 25.1.",
    "body": [
      "Basal, maximal and peak acid output."
    ],
    "evidence": "plausible",
    "authors": [
      "Katelaris PH",
      "Seow F",
      "Lin BP",
      "Napoli J",
      "Ngu MC",
      "Jones DB"
    ],
    "year": 1993,
    "journal": "Gut",
    "doi": "10.1136/gut.34.8.1032",
    "pmid": "8174948",
    "url": "https://doi.org/10.1136/gut.34.8.1032",
    "verified": true,
    "takeaways": [
      "22 young and 28 old healthy men were compared for gastrin and acid secretion.",
      "Age had no independent effect once H. pylori-related atrophic gastritis was excluded.",
      "H. pylori-infected subjects had higher serum gastrin."
    ],
    "facts": {
      "design": "physiology study",
      "population": "50 healthy men aged ~23 or ~73"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:gastric-acid-secretion",
        "note": "BAO 5.1, MAO 31.4, PAO 43.4 mmol/h."
      },
      {
        "rel": "evidence-for",
        "to": "disease:atrophic-gastritis",
        "note": "Atrophy lowers output."
      },
      {
        "rel": "evidence-for",
        "to": "disease:h-pylori-infection",
        "note": "Raises gastrin."
      }
    ]
  },
  {
    "id": "article:mccoll-1993-hpylori-negative-duodenal-ulcer",
    "type": "article",
    "name": "A study of the pathogenesis of Helicobacter pylori negative chronic duodenal ulceration",
    "aliases": [
      "McColl 1993"
    ],
    "summary": "H. pylori-negative non-ulcer controls had a median peak acid output of 22 mmol/h (range 16-29), versus 37-40 mmol/h in duodenal ulcer patients.",
    "body": [
      "Median peak acid output in H. pylori-negative controls."
    ],
    "evidence": "plausible",
    "authors": [
      "McColl KE",
      "el-Nujumi AM",
      "Chittajallu RS",
      "Dahill SW",
      "Dorrian CA",
      "el-Omar E",
      "Penman I",
      "Fitzsimons EJ",
      "Drain J",
      "Graham H"
    ],
    "year": 1993,
    "journal": "Gut",
    "doi": "10.1136/gut.34.6.762",
    "pmid": "8314508",
    "url": "https://doi.org/10.1136/gut.34.6.762",
    "verified": true,
    "takeaways": [
      "Gastric function was compared in H. pylori-negative idiopathic ulcer patients, H. pylori-positive ulcer patients and healthy volunteers.",
      "Peak acid output in controls: 22 (16-29) mmol/h.",
      "Gastrin response and liquid and solid gastric emptying also differed."
    ],
    "facts": {
      "design": "case-control",
      "population": "Healthy volunteers and duodenal ulcer patients"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:gastric-acid-secretion",
        "note": "PAO 22 (16-29) mmol/h."
      },
      {
        "rel": "evidence-for",
        "to": "disease:peptic-ulcer",
        "note": "Ulcer patients 37-40 mmol/h."
      }
    ]
  },
  {
    "id": "article:delchier-1997-omeprazole-24h-acidity",
    "type": "article",
    "name": "Twenty-four-hour intragastric acidity and plasma gastrin during 3-month treatment with omeprazole in healthy subjects",
    "aliases": [
      "Delchier 1997"
    ],
    "summary": "In 16 healthy subjects omeprazole 20 or 40 mg/day raised 24-hour median gastric pH from 1.7-1.9 to 4.3-4.6 and cut time at pH below 4 from 89% to about 35%, stable for 3 months.",
    "body": [
      "Healthy-volunteer effect of a PPI on intragastric pH."
    ],
    "evidence": "established",
    "authors": [
      "Delchier JC",
      "Benamouzig R",
      "Stanescu L",
      "Ropert A",
      "Vallot T",
      "Wirquin V",
      "Roudot F",
      "Lamarque D",
      "Hamelin B"
    ],
    "year": 1997,
    "journal": "Alimentary pharmacology & therapeutics",
    "doi": "10.1046/j.1365-2036.1997.00182.x",
    "pmid": "9305485",
    "url": "https://doi.org/10.1046/j.1365-2036.1997.00182.x",
    "verified": true,
    "takeaways": [
      "Gastric pH was recorded for 24 hours before and on days 7, 28 and 90.",
      "Omeprazole 20 mg: median pH 1.7 to 4.6, time at pH<4 89% to 35%; 40 mg: 1.9 to 4.3 and 89% to 34%.",
      "Plasma gastrin rose and stabilised after two months."
    ],
    "facts": {
      "design": "RCT",
      "population": "16 healthy subjects"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:ppi-therapy",
        "note": "Median pH 4.3-4.6 on omeprazole."
      },
      {
        "rel": "evidence-for",
        "to": "state:acid-suppression",
        "note": "Quantified."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:elevated-gastric-ph",
        "note": "Time at pH<4 falls to 35%."
      }
    ]
  },
  {
    "id": "article:cederberg-1993-omeprazole-24h-acidity",
    "type": "article",
    "name": "Effect of once daily intravenous and oral omeprazole on 24-hour intragastric acidity in healthy subjects",
    "aliases": [
      "Cederberg 1993"
    ],
    "summary": "In nine healthy subjects oral omeprazole 20 mg reduced 24-hour integrated acidity by 18% on day 1 and 60% on day 5; IV 40 mg gave 71% on day 1.",
    "body": [
      "Time course of PPI action."
    ],
    "evidence": "plausible",
    "authors": [
      "Cederberg C",
      "Röhss K",
      "Lundborg P",
      "Olbe L"
    ],
    "year": 1993,
    "journal": "Scandinavian journal of gastroenterology",
    "doi": "10.3109/00365529309096067",
    "pmid": "8441912",
    "url": "https://doi.org/10.3109/00365529309096067",
    "verified": true,
    "takeaways": [
      "Repeated once-daily oral and IV omeprazole were compared.",
      "The effect builds over several days (18% to 60% for oral 20 mg).",
      "The first IV 40 mg dose matched the day-5 effect of oral 20 mg."
    ],
    "facts": {
      "design": "RCT",
      "population": "9 healthy subjects"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:ppi-therapy",
        "note": "Acid suppression builds over 5 days."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:h-k-atpase",
        "note": "Inhibited pumps accumulate."
      }
    ]
  },
  {
    "id": "article:lind-2000-esomeprazole-vs-omeprazole-ph",
    "type": "article",
    "name": "Esomeprazole provides improved acid control vs. omeprazole In patients with symptoms of gastro-oesophageal reflux disease",
    "aliases": [
      "Lind 2000"
    ],
    "summary": "In 36 GERD patients esomeprazole 40 mg kept intragastric pH above 4 for 16.8 h (median pH 4.9) versus 10.5 h (3.6) for omeprazole 20 mg on day 5.",
    "body": [
      "PPI pH profile in patients."
    ],
    "evidence": "plausible",
    "authors": [
      "Lind T",
      "Rydberg L",
      "Kylebäck A",
      "Jonsson A",
      "Andersson T",
      "Hasselgren G",
      "Holmberg J",
      "Röhss K"
    ],
    "year": 2000,
    "journal": "Alimentary pharmacology & therapeutics",
    "doi": "10.1046/j.1365-2036.2000.00813.x",
    "pmid": "10886041",
    "url": "https://doi.org/10.1046/j.1365-2036.2000.00813.x",
    "verified": true,
    "takeaways": [
      "Double-blind crossover of three regimens for 5 days.",
      "Esomeprazole 40 and 20 mg: 16.8 h and 12.7 h above pH 4; omeprazole 20 mg: 10.5 h.",
      "Median 24-hour pH: 4.9, 4.1 and 3.6."
    ],
    "facts": {
      "design": "RCT",
      "population": "36 GERD patients"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:ppi-therapy",
        "note": "Esomeprazole 40 mg median pH 4.9."
      },
      {
        "rel": "evidence-for",
        "to": "disease:gerd",
        "note": "Patients with reflux symptoms."
      }
    ]
  },
  {
    "id": "article:miner-2003-five-ppi-crossover",
    "type": "article",
    "name": "Gastric acid control with esomeprazole, lansoprazole, omeprazole, pantoprazole, and rabeprazole: a five-way crossover study",
    "aliases": [
      "Miner 2003"
    ],
    "summary": "In 34 GERD patients on day 5 intragastric pH stayed above 4 for 14.0 h on esomeprazole 40 mg, 12.1 h on rabeprazole, 11.8 h omeprazole, 11.5 h lansoprazole and 10.1 h pantoprazole.",
    "body": [
      "Comparative PPI effect."
    ],
    "evidence": "plausible",
    "authors": [
      "Miner P",
      "Katz PO",
      "Chen Y",
      "Sostek M"
    ],
    "year": 2003,
    "journal": "The American journal of gastroenterology",
    "doi": "10.1111/j.1572-0241.2003.08783.x",
    "pmid": "14687806",
    "url": "https://doi.org/10.1111/j.1572-0241.2003.08783.x",
    "verified": true,
    "takeaways": [
      "Five-way crossover of standard doses once daily before breakfast.",
      "Esomeprazole gave the most time above pH 4.",
      "Differences were statistically significant between esomeprazole and each comparator."
    ],
    "facts": {
      "design": "RCT",
      "population": "34 H. pylori-negative GERD patients"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:ppi-therapy",
        "note": "Time above pH 4 on five PPIs."
      },
      {
        "rel": "evidence-for",
        "to": "disease:gerd",
        "note": "Patients with reflux symptoms."
      }
    ]
  },
  {
    "id": "article:kirchheiner-2009-ppi-relative-potency",
    "type": "article",
    "name": "Relative potency of proton-pump inhibitors-comparison of effects on intragastric pH",
    "aliases": [
      "Kirchheiner 2009"
    ],
    "summary": "Meta-analysis of 57 studies: potencies versus omeprazole 1.00 were pantoprazole 0.23, lansoprazole 0.90, esomeprazole 1.60 and rabeprazole 1.82; GERD patients needed 1.9 times the dose.",
    "body": [
      "Relative PPI potency."
    ],
    "evidence": "established",
    "authors": [
      "Kirchheiner J",
      "Glatt S",
      "Fuhr U",
      "Klotz U",
      "Meineke I",
      "Seufferlein T",
      "Brockmöller J"
    ],
    "year": 2009,
    "journal": "European journal of clinical pharmacology",
    "doi": "10.1007/s00228-008-0576-5",
    "pmid": "18925391",
    "url": "https://doi.org/10.1007/s00228-008-0576-5",
    "verified": true,
    "takeaways": [
      "Dose-effect on mean 24-hour intragastric pH and time at pH>4 was modelled.",
      "H. pylori-positive individuals needed only about 20% of the dose for the same effect.",
      "The authors caution about limited data for some drugs."
    ],
    "facts": {
      "design": "meta-analysis",
      "population": "57 studies in healthy volunteers and GERD patients"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:ppi-therapy",
        "note": "Relative potencies."
      },
      {
        "rel": "evidence-for",
        "to": "disease:gerd",
        "note": "GERD patients need 1.9x the dose."
      }
    ]
  },
  {
    "id": "article:shin-2002-ppi-acid-secretion-recovery",
    "type": "article",
    "name": "Restoration of acid secretion following treatment with proton pump inhibitors",
    "aliases": [
      "Shin 2002"
    ],
    "summary": "Recovery of acid secretion after a PPI has a half-life of about 28 h for omeprazole and 46 h for pantoprazole in humans, limited by pump resynthesis and disulfide reactivation.",
    "body": [
      "Recovery time constant after stopping a PPI (rebound/stop scenario)."
    ],
    "evidence": "plausible",
    "authors": [
      "Shin JM",
      "Sachs G"
    ],
    "year": 2002,
    "journal": "Gastroenterology",
    "doi": "10.1053/gast.2002.36593",
    "pmid": "12404233",
    "url": "https://doi.org/10.1053/gast.2002.36593",
    "verified": true,
    "takeaways": [
      "PPIs bind H+,K+-ATPase covalently; recovery depends on new pump synthesis and reduction of the disulfide.",
      "Rat pump protein half-life is 54 hours and secretion recovers with a half-time of ~15 hours.",
      "Pantoprazole is not reactivated by reducing agents, which may explain its longer duration."
    ],
    "facts": {
      "design": "in-vitro",
      "population": "Rat gastric membranes and human data from the literature"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:h-k-atpase",
        "note": "Pump recovery half-life 28-46 h."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:ppi-therapy",
        "note": "Duration of action."
      }
    ]
  },
  {
    "id": "article:shin-2013-ppi-mechanism-review",
    "type": "article",
    "name": "Pharmacokinetics and pharmacodynamics of the proton pump inhibitors",
    "aliases": [
      "Shin 2013"
    ],
    "summary": "Review of proton pump inhibitor pharmacology: plasma half-life about 1 h, activation by acid at pKa ~4, accumulation in the secretory canaliculus, and about 20% of pumps replaced per 24 h.",
    "body": [
      "Pump turnover for the PPI dynamics."
    ],
    "evidence": "established",
    "authors": [
      "Shin JM",
      "Kim N"
    ],
    "year": 2013,
    "journal": "Journal of neurogastroenterology and motility",
    "doi": "10.5056/jnm.2013.19.1.25",
    "pmid": "23350044",
    "url": "https://doi.org/10.5056/jnm.2013.19.1.25",
    "verified": true,
    "takeaways": [
      "PPIs are weak bases that concentrate in the acidic canaliculus and are activated there.",
      "Plasma half-life is about 1 hour but inhibition lasts much longer because the pump is covalently inhibited.",
      "Roughly 20% of pump molecules are new in 24 hours, \"probably in man\"."
    ],
    "facts": {
      "design": "review",
      "population": "Review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:h-k-atpase",
        "note": "About 20% of pumps replaced per day."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:ppi-therapy",
        "note": "Pharmacology."
      }
    ]
  },
  {
    "id": "article:mudie-2014-gi-fluid-volumes-fasted",
    "type": "article",
    "name": "Quantification of gastrointestinal liquid volumes and distribution following a 240 mL dose of water in the fasted state",
    "aliases": [
      "Mudie 2014"
    ],
    "summary": "MRI in 12 fasted volunteers: resting stomach water 35 mL; a 240 mL drink empties with T50% 13 min and returns to baseline by 45 min.",
    "body": [
      "Fasting gastric volume."
    ],
    "evidence": "plausible",
    "authors": [
      "Mudie DM",
      "Murray K",
      "Hoad CL",
      "Pritchard SE",
      "Garnett MC",
      "Amidon GL",
      "Gowland PA",
      "Spiller RC",
      "Amidon GE",
      "Marciani L"
    ],
    "year": 2014,
    "journal": "Molecular pharmaceutics",
    "doi": "10.1021/mp500210c",
    "pmid": "25115349",
    "url": "https://doi.org/10.1021/mp500210c",
    "verified": true,
    "takeaways": [
      "The fasted stomach held 35 +/- 7 mL (mean +/- SEM) of resting water.",
      "After a 240 mL drink the gastric volume rose to 242 mL and half emptied in 13 minutes.",
      "The fasted small bowel contained about 43 mL of water in scattered pockets."
    ],
    "facts": {
      "design": "imaging study",
      "population": "12 healthy volunteers"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "system:gastric-physiology",
        "note": "Resting volume 35 mL."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:co2-gastric-distension",
        "note": "A small resting volume means little gas distends the stomach."
      }
    ]
  },
  {
    "id": "article:hoad-2015-gastric-secretion-volume-mri",
    "type": "article",
    "name": "Measurement of gastric meal and secretion volumes using magnetic resonance imaging",
    "aliases": [
      "Hoad 2015"
    ],
    "summary": "MRI in 24 healthy volunteers after a mixed meal: gastric secretion volume 64 mL at 15 min and 110 mL at 75 min, a mean net increase of 52 mL over the first hour.",
    "body": [
      "Postprandial gastric secretion volume."
    ],
    "evidence": "plausible",
    "authors": [
      "Hoad CL",
      "Parker H",
      "Hudders N",
      "Costigan C",
      "Cox EF",
      "Perkins AC",
      "Blackshaw PE",
      "Marciani L",
      "Spiller RC",
      "Fox MR",
      "Gowland PA"
    ],
    "year": 2015,
    "journal": "Physics in medicine and biology",
    "doi": "10.1088/0031-9155/60/3/1367",
    "pmid": "25592405",
    "url": "https://doi.org/10.1088/0031-9155/60/3/1367",
    "verified": true,
    "takeaways": [
      "Gastric content was separated into meal and secretion by MRI.",
      "The net rise in content was 52 +/- 29 mL over 60 minutes.",
      "Secretion volume is larger than emptying removes in the first hour."
    ],
    "facts": {
      "design": "imaging study",
      "population": "24 healthy volunteers"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "system:gastric-physiology",
        "note": "Net secretion ~52 mL/h after a meal."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:co2-gastric-distension",
        "note": "Secretion adds volume after a meal."
      }
    ]
  },
  {
    "id": "article:kalantzi-2006-gastric-buffer-capacity",
    "type": "article",
    "name": "Characterization of the human upper gastrointestinal contents under conditions simulating bioavailability/bioequivalence studies",
    "aliases": [
      "Kalantzi 2006"
    ],
    "summary": "In 20 healthy adults buffer capacity in the stomach was 14-28 mmol/L per pH unit after a liquid meal versus 7-18 after water, and in the duodenum 5.6 fasted and 18-30 fed.",
    "body": [
      "Food buffer capacity versus bicarbonate neutralisation."
    ],
    "evidence": "plausible",
    "authors": [
      "Kalantzi L",
      "Goumas K",
      "Kalioras V",
      "Abrahamsson B",
      "Dressman JB",
      "Reppas C"
    ],
    "year": 2006,
    "journal": "Pharmaceutical research",
    "doi": "10.1007/s11095-005-8476-1",
    "pmid": "16308672",
    "url": "https://doi.org/10.1007/s11095-005-8476-1",
    "verified": true,
    "takeaways": [
      "Gastric and duodenal contents were sampled after Ensure Plus or water.",
      "Feeding raises gastric and duodenal buffer capacity.",
      "Food buffering therefore consumes much of the secreted acid before bicarbonate does."
    ],
    "facts": {
      "design": "physiology study",
      "population": "20 healthy adults"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:acid-bicarbonate-neutralisation",
        "note": "Food buffers compete with bicarbonate."
      },
      {
        "rel": "evidence-for",
        "to": "system:gastric-physiology",
        "note": "Buffer capacity 14-28 mmol/L/pH after a meal."
      }
    ]
  },
  {
    "id": "article:isenberg-1986-duodenal-bulb-bicarbonate",
    "type": "article",
    "name": "Human duodenal mucosal bicarbonate secretion. Evidence for basal secretion and stimulation by hydrochloric acid and a synthetic prostaglandin E1 analogue",
    "aliases": [
      "Isenberg 1986"
    ],
    "summary": "Human duodenal bulb secretes bicarbonate at rest (143 umol/cm/h) and 167, 199 and 278 after 25, 50 and 100 mM HCl; misoprostol raised it to 644.",
    "body": [
      "Basal and acid-stimulated duodenal bicarbonate."
    ],
    "evidence": "plausible",
    "authors": [
      "Isenberg JI",
      "Hogan DL",
      "Koss MA",
      "Selling JA"
    ],
    "year": 1986,
    "journal": "Gastroenterology",
    "doi": "10.1016/0016-5085(86)90571-8",
    "pmid": "3087810",
    "url": "https://doi.org/10.1016/0016-5085(86)90571-8",
    "verified": true,
    "takeaways": [
      "Bicarbonate output of a 4-cm isolated segment of the duodenal bulb was titrated.",
      "Acid raised secretion in a graded way.",
      "Output declines distally along the duodenum."
    ],
    "facts": {
      "design": "physiology study",
      "population": "Healthy subjects"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "system:duodenum",
        "note": "Basal 143, stimulated up to 278 umol/cm/h."
      },
      {
        "rel": "evidence-for",
        "to": "compound:bicarbonate",
        "note": "Mucosal secretion."
      }
    ]
  },
  {
    "id": "article:isenberg-1987-duodenal-bicarbonate-ulcer",
    "type": "article",
    "name": "Impaired proximal duodenal mucosal bicarbonate secretion in patients with duodenal ulcer",
    "aliases": [
      "Isenberg 1987"
    ],
    "summary": "Duodenal ulcer patients secrete less duodenal bulb bicarbonate than normal subjects: basal 107 vs 185 and acid-stimulated 263 vs 642 umol/cm/h.",
    "body": [
      "Normal duodenal bicarbonate output."
    ],
    "evidence": "established",
    "authors": [
      "Isenberg JI",
      "Selling JA",
      "Hogan DL",
      "Koss MA"
    ],
    "year": 1987,
    "journal": "The New England journal of medicine",
    "doi": "10.1056/nejm198702123160704",
    "pmid": "3807974",
    "url": "https://doi.org/10.1056/nejm198702123160704",
    "verified": true,
    "takeaways": [
      "16 normal subjects were compared with 12 duodenal ulcer patients.",
      "Acid-stimulated output was 642 +/- 77 in normals and 263 +/- 65 in ulcer patients.",
      "The defect may impair protection against acid."
    ],
    "facts": {
      "design": "case-control",
      "population": "16 normal subjects and 12 duodenal ulcer patients"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "system:duodenum",
        "note": "Normal basal 185, stimulated 642 umol/cm/h."
      },
      {
        "rel": "evidence-for",
        "to": "disease:peptic-ulcer",
        "note": "Lower bicarbonate in ulcer patients."
      }
    ]
  },
  {
    "id": "article:feitelberg-1992-duodenal-bicarbonate-ph-threshold",
    "type": "article",
    "name": "pH threshold for human duodenal bicarbonate secretion and diffusion of CO2",
    "aliases": [
      "Feitelberg 1992"
    ],
    "summary": "Human duodenal bicarbonate secretion switches on at luminal pH 3.0 (about 230 umol/cm/h basal, 560 at pH 2.5-3.0) and not at pH 3.5-4.0; duodenal CO2 loss is small at low PCO2.",
    "body": [
      "pH threshold for duodenal bicarbonate."
    ],
    "evidence": "plausible",
    "authors": [
      "Feitelberg SP",
      "Hogan DL",
      "Koss MA",
      "Isenberg JI"
    ],
    "year": 1992,
    "journal": "Gastroenterology",
    "doi": "10.1016/0016-5085(92)90763-o",
    "pmid": "1551532",
    "url": "https://doi.org/10.1016/0016-5085(92)90763-o",
    "verified": true,
    "takeaways": [
      "The response is determined by luminal pH, not acid load.",
      "CO2 loss from the isolated segment is 4% at a PCO2 of 50 mmHg and plateaus at about 25% at high PCO2."
    ],
    "facts": {
      "design": "physiology study",
      "population": "Healthy subjects"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "system:duodenum",
        "note": "Threshold pH ~3."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:acid-bicarbonate-neutralisation",
        "note": "Duodenal bicarbonate responds to luminal pH below 3."
      }
    ]
  },
  {
    "id": "article:mertz-nielsen-1996-omeprazole-duodenal-bicarbonate",
    "type": "article",
    "name": "Omeprazole promotes proximal duodenal mucosal bicarbonate secretion in humans",
    "aliases": [
      "Mertz-Nielsen 1996"
    ],
    "summary": "Omeprazole raised basal duodenal bicarbonate (597 vs 351 umol/h) and acid-stimulated output (3351 vs 2550 umol/h) in healthy volunteers.",
    "body": [
      "Whole-segment duodenal bicarbonate scale."
    ],
    "evidence": "plausible",
    "authors": [
      "Mertz-Nielsen A",
      "Hillingsø J",
      "Bukhave K",
      "Rask-Madsen J"
    ],
    "year": 1996,
    "journal": "Gut",
    "doi": "10.1136/gut.38.1.6",
    "pmid": "8566861",
    "url": "https://doi.org/10.1136/gut.38.1.6",
    "verified": true,
    "takeaways": [
      "Whole-segment perfusion in 17 healthy subjects.",
      "Basal output 597 +/- 48 with omeprazole versus 351 +/- 39 without."
    ],
    "facts": {
      "design": "RCT",
      "population": "17 healthy volunteers"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "system:duodenum",
        "note": "Basal 351 umol/h; 597 with omeprazole."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:ppi-therapy",
        "note": "Omeprazole raised duodenal bicarbonate."
      }
    ]
  },
  {
    "id": "article:mertz-nielsen-1995-gastric-duodenal-bicarbonate",
    "type": "article",
    "name": "Muscarinic M1 receptor inhibition reduces gastroduodenal bicarbonate secretion and promotes gastric prostaglandin E2 synthesis in healthy volunteers",
    "aliases": [
      "Mertz-Nielsen 1995"
    ],
    "summary": "Gastric basal bicarbonate 382 umol/h rose to 959 with sham feeding; duodenal bulb 191 rose to 634 umol/cm/h after intraluminal acid (9 healthy subjects).",
    "body": [
      "Gastric bicarbonate output."
    ],
    "evidence": "plausible",
    "authors": [
      "Mertz-Nielsen A",
      "Hillingsø J",
      "Eskerod O",
      "Bukhave K",
      "Rask-Madsen J"
    ],
    "year": 1995,
    "journal": "Gut",
    "doi": "10.1136/gut.36.4.528",
    "pmid": "7737558",
    "url": "https://doi.org/10.1136/gut.36.4.528",
    "verified": true,
    "takeaways": [
      "Gastric and duodenal bicarbonate were measured together.",
      "Sham feeding increased gastric bicarbonate 2.5-fold.",
      "Duodenal acid challenge increased bulb bicarbonate 3.3-fold."
    ],
    "facts": {
      "design": "physiology study",
      "population": "9 healthy subjects"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "system:gastric-physiology",
        "note": "Gastric bicarbonate 382 umol/h."
      },
      {
        "rel": "evidence-for",
        "to": "system:duodenum",
        "note": "Bulb 191 to 634 umol/cm/h."
      }
    ]
  },
  {
    "id": "article:hacki-1977-secretin-bicarbonate",
    "type": "article",
    "name": "Plasma secretin and pancreatic bicarbonate response to exogenous secretin in man",
    "aliases": [
      "HACKI 1977"
    ],
    "summary": "Maximal secretin-stimulated pancreatic bicarbonate output was 33 mEq/h in six healthy subjects.",
    "body": [
      "Maximal pancreatic bicarbonate."
    ],
    "evidence": "plausible",
    "authors": [
      "HACKI WH",
      "Bloom SR",
      "Mitznegg P",
      "Domschke W",
      "Domschke S",
      "Belohlavek D",
      "Demling L",
      "Wünsch E"
    ],
    "year": 1977,
    "journal": "Gut",
    "doi": "10.1136/gut.18.3.191",
    "pmid": "852751",
    "url": "https://doi.org/10.1136/gut.18.3.191",
    "verified": true,
    "takeaways": [
      "Graded secretin doses were infused with duodenal recovery.",
      "Maximum bicarbonate output 33 +/- 4 mEq/h."
    ],
    "facts": {
      "design": "physiology study",
      "population": "6 healthy subjects"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "system:pancreas-bicarbonate",
        "note": "Maximum 33 mEq/h."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:acid-bicarbonate-neutralisation",
        "note": "Pancreatic alkali neutralises acid."
      }
    ]
  },
  {
    "id": "article:domschke-1976-pure-pancreatic-juice",
    "type": "article",
    "name": "Bicarbonate and cyclic AMP content of pure human pancreatic juice in response to graded doses of synthetic secretin",
    "aliases": [
      "Domschke 1976"
    ],
    "summary": "Endoscopically collected pure pancreatic juice peaked at 135 mM bicarbonate; maximal output 383 uEq/h/kg (about 27 mEq/h at 70 kg).",
    "body": [
      "Pancreatic juice bicarbonate concentration."
    ],
    "evidence": "plausible",
    "authors": [
      "Domschke S",
      "Domschke W",
      "Rösch W",
      "Konturek SJ",
      "Wünsch E",
      "Demling L"
    ],
    "year": 1976,
    "journal": "Gastroenterology",
    "doi": "10.1016/s0016-5085(76)80491-x",
    "pmid": "176080",
    "url": "https://doi.org/10.1016/s0016-5085(76)80491-x",
    "verified": true,
    "takeaways": [
      "Pure juice was sampled during secretin stimulation in seven volunteers.",
      "Bicarbonate concentration reached 135 +/- 9 mM."
    ],
    "facts": {
      "design": "physiology study",
      "population": "7 healthy volunteers"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "system:pancreas-bicarbonate",
        "note": "Peak 135 mM."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:acid-bicarbonate-neutralisation",
        "note": "Pancreatic juice is the main bicarbonate source."
      }
    ]
  },
  {
    "id": "article:kolkman-1994-intragastric-pco2",
    "type": "article",
    "name": "Effect of ranitidine on basal and bicarbonate enhanced intragastric PCO2: a tonometric study",
    "aliases": [
      "Kolkman 1994"
    ],
    "summary": "Intragastric PCO2 was 63 mmHg basally and 144 mmHg after 500 mg sodium bicarbonate in ten healthy people; ranitidine at gastric pH 5.6 brought PCO2 to about blood levels (42 mmHg).",
    "body": [
      "Gastric PCO2 scale for the CO2 budget."
    ],
    "evidence": "plausible",
    "authors": [
      "Kolkman JJ",
      "Groeneveld AB",
      "Meuwissen SG"
    ],
    "year": 1994,
    "journal": "Gut",
    "doi": "10.1136/gut.35.6.737",
    "pmid": "8020795",
    "url": "https://doi.org/10.1136/gut.35.6.737",
    "verified": true,
    "takeaways": [
      "Saline tonometry measured gastric PCO2.",
      "Basal 8.4 kPa, after bicarbonate 19.2 kPa; with ranitidine 5.6 kPa.",
      "The excess over blood arises from acid-bicarbonate buffering in the stomach."
    ],
    "facts": {
      "design": "physiology study",
      "population": "10 healthy subjects"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:acid-bicarbonate-neutralisation",
        "note": "Measured gastric PCO2 63 to 144 mmHg."
      },
      {
        "rel": "evidence-for",
        "to": "compound:carbon-dioxide",
        "note": "Gastric PCO2."
      }
    ]
  },
  {
    "id": "article:akiba-2011-duodenal-co2-sensing",
    "type": "article",
    "name": "Duodenal chemosensing and mucosal defenses",
    "aliases": [
      "Akiba 2011"
    ],
    "summary": "Review: the duodenum is exposed to acid and PCO2 up to about 400 mmHg after meals, with the CO2 absorbed rapidly in the jejunum.",
    "body": [
      "Duodenal PCO2 scale."
    ],
    "evidence": "established",
    "authors": [
      "Akiba Y",
      "Kaunitz JD"
    ],
    "year": 2011,
    "journal": "Digestion",
    "doi": "10.1159/000323401",
    "pmid": "21389725",
    "url": "https://doi.org/10.1159/000323401",
    "verified": true,
    "takeaways": [
      "Luminal CO2 formed from bicarbonate neutralising acid is sensed by the mucosa.",
      "The duodenal PCO2 estimate rests on canine data."
    ],
    "facts": {
      "design": "review",
      "population": "Review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "system:duodenum",
        "note": "PCO2 up to ~400 mmHg."
      },
      {
        "rel": "evidence-for",
        "to": "compound:carbon-dioxide",
        "note": "Rapid absorption."
      }
    ]
  },
  {
    "id": "article:ltaief-2021-co2-blood-solubility",
    "type": "article",
    "name": "Pathophysiology and clinical implications of the veno-arterial PCO2 gap",
    "aliases": [
      "Ltaief 2021"
    ],
    "summary": "Review of carbon dioxide physiology: blood CO2 solubility is 0.03 mmol/L per mmHg (0.52 mL/mL at 37 C).",
    "body": [
      "CO2 solubility reference."
    ],
    "evidence": "established",
    "authors": [
      "Ltaief Z",
      "Schneider AG",
      "Liaudet L"
    ],
    "year": 2021,
    "journal": "Critical care (London, England)",
    "doi": "10.1186/s13054-021-03671-w",
    "pmid": "34461974",
    "url": "https://doi.org/10.1186/s13054-021-03671-w",
    "verified": true,
    "takeaways": [
      "CO2 transport in blood is mostly as bicarbonate.",
      "The physical solubility coefficient in blood is 0.03 mmol/L/mmHg."
    ],
    "facts": {
      "design": "review",
      "population": "Review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:carbon-dioxide",
        "note": "Solubility 0.03 mmol/L/mmHg."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:acid-bicarbonate-neutralisation",
        "note": "Solubility sets how much CO2 stays dissolved."
      }
    ]
  },
  {
    "id": "article:ploutz-snyder-1999-carbonated-beverage-gastric-gas",
    "type": "article",
    "name": "Gastric gas and fluid emptying assessed by magnetic resonance imaging",
    "aliases": [
      "Ploutz-Snyder 1999"
    ],
    "summary": "MRI after 800 mL cola showed about 600 mL gastric gas; carbonation explained 84% of the variation in gastric emptying time and cola half-time was 107 min versus 21 min for water.",
    "body": [
      "Scale of a real gas load."
    ],
    "evidence": "plausible",
    "authors": [
      "Ploutz-Snyder L",
      "Foley J",
      "Ploutz-Snyder R",
      "Kanaley J",
      "Sagendorf K",
      "Meyer R"
    ],
    "year": 1999,
    "journal": "European journal of applied physiology and occupational physiology",
    "doi": "10.1007/s004210050498",
    "pmid": "10048625",
    "url": "https://doi.org/10.1007/s004210050498",
    "verified": true,
    "takeaways": [
      "Gastric volume, gas and emptying were measured in eight subjects.",
      "The carbonated drink left roughly 600 mL gas in the stomach.",
      "Gas emptying rate was the same for all drinks."
    ],
    "facts": {
      "design": "imaging study",
      "population": "8 healthy subjects"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "outcome:co2-gastric-distension",
        "note": "About 600 mL of gas after 800 mL cola."
      },
      {
        "rel": "evidence-for",
        "to": "system:gastric-physiology",
        "note": "Carbonation slows emptying."
      }
    ]
  },
  {
    "id": "article:lasser-1975-intestinal-gas-volume",
    "type": "article",
    "name": "The role of intestinal gas in functional abdominal pain",
    "aliases": [
      "Lasser 1975"
    ],
    "summary": "Washout measurement: total intestinal gas was 199 mL in 10 controls and not increased in patients with gas complaints (176 mL).",
    "body": [
      "Total intestinal gas volume."
    ],
    "evidence": "established",
    "authors": [
      "Lasser RB",
      "Bond JH",
      "Levitt MD"
    ],
    "year": 1975,
    "journal": "The New England journal of medicine",
    "doi": "10.1056/nejm197509112931103",
    "pmid": "1152877",
    "url": "https://doi.org/10.1056/nejm197509112931103",
    "verified": true,
    "takeaways": [
      "Gut gas was washed out with an argon-containing mixture.",
      "Gas transit time was about 22 minutes.",
      "Patients with gas symptoms did not have more gas."
    ],
    "facts": {
      "design": "physiology study",
      "population": "10 controls and 12 patients"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "outcome:flatulence",
        "note": "Gas volume ~200 mL."
      },
      {
        "rel": "evidence-for",
        "to": "system:colon",
        "note": "Gas transit."
      }
    ]
  },
  {
    "id": "article:azpiroz-2005-intestinal-gas-review",
    "type": "article",
    "name": "Intestinal gas dynamics: mechanisms and clinical relevance",
    "aliases": [
      "Azpiroz 2005"
    ],
    "summary": "Review of intestinal gas dynamics: normal gut contains about 200 mL of gas and healthy subjects tolerate jejunal gas infusion up to 30 mL/min without symptoms.",
    "body": [
      "Gut gas volume context."
    ],
    "evidence": "established",
    "authors": [
      "Azpiroz F"
    ],
    "year": 2005,
    "journal": "Gut",
    "doi": "10.1136/gut.2004.048868",
    "pmid": "15951528",
    "url": "https://doi.org/10.1136/gut.2004.048868",
    "verified": true,
    "takeaways": [
      "Gas is cleared by transit and absorption; most infused gas is cleared.",
      "Symptoms relate to impaired gas handling and sensitivity more than volume."
    ],
    "facts": {
      "design": "review",
      "population": "Review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "outcome:flatulence",
        "note": "Normal gas ~200 mL."
      },
      {
        "rel": "evidence-for",
        "to": "system:colon",
        "note": "Gas handling and transit."
      }
    ]
  },
  {
    "id": "article:bendezu-2015-ct-intestinal-gas",
    "type": "article",
    "name": "Intestinal gas content and distribution in health and in patients with functional gut symptoms",
    "aliases": [
      "Bendezú 2015"
    ],
    "summary": "CT in 37 healthy people found a median intestinal gas volume of 95 mL (IQR 71-141).",
    "body": [
      "Imaging-based gas volume."
    ],
    "evidence": "plausible",
    "authors": [
      "Bendezú RA",
      "Barba E",
      "Burri E",
      "Cisternas D",
      "Malagelada C",
      "Segui S",
      "Accarino A",
      "Quiroga S",
      "Monclus E",
      "Navazo I",
      "Malagelada JR",
      "Azpiroz F"
    ],
    "year": 2015,
    "journal": "Neurogastroenterology and motility",
    "doi": "10.1111/nmo.12618",
    "pmid": "26095329",
    "url": "https://doi.org/10.1111/nmo.12618",
    "verified": true,
    "takeaways": [
      "Gas volume was quantified by abdominal CT.",
      "Median 95 mL, lower than the older washout figure of ~200 mL."
    ],
    "facts": {
      "design": "imaging study",
      "population": "37 healthy subjects"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "outcome:flatulence",
        "note": "Median 95 mL."
      },
      {
        "rel": "evidence-for",
        "to": "system:colon",
        "note": "Gas volume by CT."
      }
    ]
  },
  {
    "id": "article:bredenoord-2004-belching-impedance-healthy",
    "type": "article",
    "name": "Aerophagia, gastric, and supragastric belching: a study using intraluminal electrical impedance monitoring",
    "aliases": [
      "Bredenoord 2004"
    ],
    "summary": "Impedance monitoring in 14 healthy people: about one swallow in three carries air (21.5 air swallows per hour fasting, 24.4 postprandial) and 3-5 gastric gas reflux events occur per hour.",
    "body": [
      "Swallowed-air and belching rates."
    ],
    "evidence": "plausible",
    "authors": [
      "Bredenoord AJ",
      "Weusten BL",
      "Sifrim D",
      "Timmer R",
      "Smout AJ"
    ],
    "year": 2004,
    "journal": "Gut",
    "doi": "10.1136/gut.2004.042945",
    "pmid": "15479671",
    "url": "https://doi.org/10.1136/gut.2004.042945",
    "verified": true,
    "takeaways": [
      "Swallows were 79.5 per hour fasting and 64.2 postprandial.",
      "Gastric gas reflux events were 4.7 per hour fasting and 3.0 postprandial.",
      "Supragastric belches were seen in patients, not in controls."
    ],
    "facts": {
      "design": "physiology study",
      "population": "14 healthy volunteers"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "outcome:belching",
        "note": "Healthy air-swallow and belch rates."
      },
      {
        "rel": "evidence-for",
        "to": "disease:aerophagia-belching-disorders",
        "note": "Reference for normal."
      }
    ]
  },
  {
    "id": "article:hemmink-2009-aerophagia-24h-impedance",
    "type": "article",
    "name": "Aerophagia: excessive air swallowing demonstrated by esophageal impedance monitoring",
    "aliases": [
      "Hemmink 2009"
    ],
    "summary": "Patients with suspected aerophagia had 521 air swallows, 126 gastric belches and 741 swallows per 24 hours on impedance monitoring.",
    "body": [
      "Patient range for belching counts."
    ],
    "evidence": "plausible",
    "authors": [
      "Hemmink GJ",
      "Weusten BL",
      "Bredenoord AJ",
      "Timmer R",
      "Smout AJ"
    ],
    "year": 2009,
    "journal": "Clinical gastroenterology and hepatology : the official clinical practice journal of the American Gastroenterological Association",
    "doi": "10.1016/j.cgh.2009.06.029",
    "pmid": "19602452",
    "url": "https://doi.org/10.1016/j.cgh.2009.06.029",
    "verified": true,
    "takeaways": [
      "24-hour pH-impedance monitoring in patients with excessive belching.",
      "Air swallows were frequent, with many gastric belches."
    ],
    "facts": {
      "design": "physiology study",
      "population": "Patients with suspected aerophagia"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:aerophagia-belching-disorders",
        "note": "521 air swallows and 126 gastric belches per 24 h."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:belching",
        "note": "Pathological counts."
      }
    ]
  },
  {
    "id": "article:pouderoux-1996-swallowed-air-ct",
    "type": "article",
    "name": "Esophageal bolus transit imaged by ultrafast computerized tomography",
    "aliases": [
      "Pouderoux 1996"
    ],
    "summary": "Ultrafast CT showed 8-32 mL of air accompanying each 10 mL liquid swallow in seven healthy subjects.",
    "body": [
      "Swallowed air per swallow."
    ],
    "evidence": "plausible",
    "authors": [
      "Pouderoux P",
      "Ergun GA",
      "Lin S",
      "Kahrilas PJ"
    ],
    "year": 1996,
    "journal": "Gastroenterology",
    "doi": "10.1053/gast.1996.v110.pm8613047",
    "pmid": "8613047",
    "url": "https://doi.org/10.1053/gast.1996.v110.pm8613047",
    "verified": true,
    "takeaways": [
      "Air precedes the bolus into the oesophagus.",
      "Volumes were 8-32 mL per swallow."
    ],
    "facts": {
      "design": "imaging study",
      "population": "7 healthy subjects"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "outcome:belching",
        "note": "Source of swallowed air."
      },
      {
        "rel": "evidence-for",
        "to": "disease:aerophagia-belching-disorders",
        "note": "Swallowed air is the source of aerophagia."
      }
    ]
  },
  {
    "id": "article:caballero-2018-gastric-gas-fate",
    "type": "article",
    "name": "Gastric gas dynamics in healthy humans",
    "aliases": [
      "Caballero 2018"
    ],
    "summary": "When 1500 mL of gas was infused into the stomach 24 healthy people evacuated 1198 mL per rectum in 90 minutes and belched four times; belchers passed less (330 mL) and non-belchers more (1630 mL).",
    "body": [
      "Fate of gastric gas."
    ],
    "evidence": "plausible",
    "authors": [
      "Caballero N",
      "Marin I",
      "Serra J"
    ],
    "year": 2018,
    "journal": "Neurogastroenterology and motility",
    "doi": "10.1111/nmo.13408",
    "pmid": "30043526",
    "url": "https://doi.org/10.1111/nmo.13408",
    "verified": true,
    "takeaways": [
      "Belching and rectal evacuation were inversely related.",
      "Most gas moved distally rather than being belched.",
      "The gas mixture is not stated in the abstract."
    ],
    "facts": {
      "design": "physiology study",
      "population": "24 healthy subjects"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "outcome:belching",
        "note": "Most gastric gas passes distally."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:flatulence",
        "note": "Rectal evacuation of infused gas."
      }
    ]
  },
  {
    "id": "article:baratta-2019-parietal-cell-acid-secretion",
    "type": "article",
    "name": "In Pursuit of the Parietal Cell - An Evolution of Scientific Methodology and Techniques",
    "aliases": [
      "Baratta 2019"
    ],
    "summary": "Review of gastric acid secretion: the parietal cell secretes at pH about 0.8, a 4-million-fold gradient across the apical membrane, and the stomach has about 10^9 parietal cells.",
    "body": [
      "Acid concentration of parietal secretion."
    ],
    "evidence": "established",
    "authors": [
      "Baratta V",
      "Own J",
      "Di Renzo C",
      "Ollodart J",
      "Geibel JP",
      "Barahona M"
    ],
    "year": 2019,
    "journal": "Frontiers in physiology",
    "doi": "10.3389/fphys.2019.01497",
    "pmid": "31920702",
    "url": "https://doi.org/10.3389/fphys.2019.01497",
    "verified": true,
    "takeaways": [
      "Acid is produced by H+,K+-ATPase with carbonic anhydrase-derived protons.",
      "The secreted fluid is about pH 0.8 (about 158 mM).",
      "The parietal cell count is quoted from older literature."
    ],
    "facts": {
      "design": "review",
      "population": "Review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "system:gastric-parietal-cells",
        "note": "Secretion at pH ~0.8."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:h-k-atpase",
        "note": "Proton pump gradient."
      }
    ]
  },
  {
    "id": "article:al-waiz-1987-tma-tmao-urinary-excretion",
    "type": "article",
    "name": "The metabolism of 14C-labelled trimethylamine and its N-oxide in man",
    "aliases": [
      "Al-Waiz 1987"
    ],
    "summary": "After 100 mg of 14C-TMA or 14C-TMAO about 95% was excreted in urine within 24 h, over 95% of it as TMAO.",
    "body": [
      "Earlier confirmation of TMA/TMAO urinary elimination."
    ],
    "evidence": "plausible",
    "authors": [
      "Al-Waiz M",
      "Mitchell SC",
      "Idle JR",
      "Smith RL"
    ],
    "year": 1987,
    "journal": "Xenobiotica; the fate of foreign compounds in biological systems",
    "doi": "10.3109/00498258709043962",
    "pmid": "3604260",
    "url": "https://doi.org/10.3109/00498258709043962",
    "verified": true,
    "takeaways": [
      "Three volunteers took labelled TMA or TMAO.",
      "Urinary recovery was about 95% in 24 hours, nearly all as TMAO."
    ],
    "facts": {
      "design": "tracer-study",
      "population": "Three healthy men"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:tmao",
        "note": "Urine is the main route."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:tma-tmao-axis",
        "note": "Excretion of TMA."
      }
    ]
  }
]
