// Literature layer: verified articles, guidelines and database references.
// Every bibliographic field (title, authors, year, journal, DOI, PMID) was fetched
// from PubMed / Crossref and cross-checked; takeaways are paraphrased, not copied.
// Generated entity list; the engine validates this contract.
export default [
  {
    "id": "article:melendez-hevia-2009-glycine-weak-link",
    "type": "article",
    "name": "A weak link in metabolism: the metabolic capacity for glycine biosynthesis does not satisfy the need for collagen synthesis",
    "aliases": [
      "Meléndez-Hevia 2009"
    ],
    "summary": "Flux accounting argues endogenous glycine synthesis (~3 g/day) plus diet falls roughly 10 g/day short of total metabolic use, chiefly collagen, so glycine is semi-essential.",
    "body": [
      "The paper compares every published flux for glycine production and use in an adult human. Because [[compound:glycine]] is made mostly from serine by [[enzyme:shmt]] and each cycle also yields a one-carbon unit, the authors argue synthesis cannot scale to cover the large demand from [[pathway:collagen-synthesis]].",
      "In this ontology it is the source of the often-quoted 10 g/day glycine gap behind [[intervention:glycine-powder]] and [[intervention:collagen-peptides]]. It is a theoretical argument; it should be read together with tolerability evidence."
    ],
    "evidence": "plausible",
    "authors": [
      "Meléndez-Hevia E",
      "De Paz-Lugo P",
      "Cornish-Bowden A",
      "Cárdenas ML"
    ],
    "year": 2009,
    "journal": "Journal of biosciences",
    "doi": "10.1007/s12038-009-0100-9",
    "pmid": "20093739",
    "url": "https://doi.org/10.1007/s12038-009-0100-9",
    "verified": true,
    "takeaways": [
      "Over 85% of glycine arises from serine through serine hydroxymethyltransferase, and the reaction is stoichiometrically capped by how many one-carbon units the cell can handle.",
      "Summed literature fluxes put endogenous synthesis near 3 g/day and dietary intake at 1.5-3 g/day for a 70 kg adult.",
      "The authors estimate a deficit of about 10 g/day once collagen synthesis is counted, and conclude glycine is semi-essential.",
      "This is a modelling comparison of published fluxes, not an intervention trial: it says nothing about how well powdered glycine is tolerated or whether supplementation fixes any outcome."
    ],
    "facts": {
      "design": "review",
      "population": "Adult human, 70 kg reference (flux model)"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Origin of the 'about 10 g/day shortfall' figure; supports glycine as semi-essential."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:shmt",
        "note": "Serine-to-glycine conversion by SHMT is the dominant source and is stoichiometrically limited."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:collagen-synthesis-adequacy",
        "note": "Collagen turnover is the largest glycine sink in the estimate."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:glycine-powder",
        "note": "Gives the theoretical rationale for supplementing; provides no tolerability or outcome data."
      }
    ]
  },
  {
    "id": "article:wang-2013-glycine-metabolism",
    "type": "article",
    "name": "Glycine metabolism in animals and humans: implications for nutrition and health",
    "aliases": [
      "Wang 2013"
    ],
    "summary": "Review of glycine sources and sinks across tissues, concluding it is conditionally essential; names the glycine cleavage system as the major route releasing ammonia and CO2.",
    "body": [
      "This review is a broad map of [[compound:glycine]] metabolism. It matters here because it places glycine breakdown (via [[enzyme:glycine-cleavage-system|GCS]]) inside cells, so ammonia and CO2 from that route are systemic, not produced in the stomach lumen.",
      "It also lists [[pathway:choline-oxidation]] as a glycine source and bile acid conjugation as a glycine sink."
    ],
    "evidence": "plausible",
    "authors": [
      "Wang W",
      "Wu Z",
      "Dai Z",
      "Yang Y",
      "Wang J",
      "Wu G"
    ],
    "year": 2013,
    "journal": "Amino acids",
    "doi": "10.1007/s00726-013-1493-1",
    "pmid": "23615880",
    "url": "https://doi.org/10.1007/s00726-013-1493-1",
    "verified": true,
    "takeaways": [
      "Glycine is made from serine, threonine, choline and hydroxyproline through liver-kidney inter-organ exchange.",
      "Its main degradation route is the mitochondrial glycine cleavage system, which releases ammonia and CO2 inside tissues; serine hydroxymethyltransferase and a peroxisomal D-amino acid oxidase route to glyoxylate are the other routes.",
      "Glycine feeds glutathione, heme, creatine, nucleic acids, uric acid and bile acid conjugation, so demand is spread across many pathways.",
      "The authors call glycine conditionally essential because endogenous synthesis may not cover demand, especially in disease; much of the supporting data come from animal (pig) nutrition work."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Comprehensive review of synthesis, degradation and functions; conditionally-essential argument."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:glycine-cleavage",
        "note": "GCS identified as the major glycine-degrading pathway producing NH3 and CO2 in tissue."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:glycine-cleavage-system"
      },
      {
        "rel": "evidence-for",
        "to": "pathway:choline-oxidation",
        "note": "Choline is listed as a glycine precursor."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:bile-acid-conjugation",
        "note": "Glycine is a significant component of bile acids secreted into the small intestine."
      }
    ]
  },
  {
    "id": "article:lamers-2007-glycine-flux",
    "type": "article",
    "name": "Glycine turnover and decarboxylation rate quantified in healthy men and women using primed, constant infusions of [1,2-(13)C2]glycine and [(2)H3]leucine",
    "aliases": [
      "Lamers 2007"
    ],
    "summary": "Stable-isotope infusion in five fed adults quantified whole-body glycine flux, showing ~39% is decarboxylated by the glycine cleavage system and a similar share is converted to serine.",
    "body": [
      "First in vivo quantification of how much human [[compound:glycine]] is cleaved by [[enzyme:glycine-cleavage-system|GCS]] versus converted by [[enzyme:shmt]]. It frames glycine as a major feeder of the [[pathway:folate-cycle]] rather than only a methyl sink."
    ],
    "evidence": "plausible",
    "authors": [
      "Lamers Y",
      "Williamson J",
      "Gilbert LR",
      "Stacpoole PW",
      "Gregory JF 3rd"
    ],
    "year": 2007,
    "journal": "The Journal of nutrition",
    "doi": "10.1093/jn/137.12.2647",
    "pmid": "18029478",
    "url": "https://doi.org/10.1093/jn/137.12.2647",
    "verified": true,
    "takeaways": [
      "Whole-body glycine flux was about 463 umol/kg/h in young fed volunteers.",
      "Glycine-to-serine conversion by SHMT accounted for roughly 41% of flux, and nearly half of that used one-carbon units produced by the glycine cleavage system itself.",
      "Breath 13CO2 showed glycine decarboxylation was ~39% of total flux, making the cleavage system a major route for generating one-carbon units.",
      "Only five subjects were studied, so the numbers are indicative."
    ],
    "facts": {
      "design": "tracer-study",
      "population": "Healthy young adults, n=5, fed state"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:glycine-cleavage",
        "note": "Quantifies GCS as a dominant human glycine disposal route."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:glycine-cleavage-system"
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:shmt",
        "note": "SHMT-mediated glycine-to-serine flux measured in vivo."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:folate-cycle",
        "note": "GCS is a major source of one-carbon units entering folate metabolism."
      }
    ]
  },
  {
    "id": "article:lamers-2009-b6-restriction-glycine",
    "type": "article",
    "name": "Moderate dietary vitamin B-6 restriction raises plasma glycine and cystathionine concentrations while minimally affecting the rates of glycine turnover and glycine cleavage in healthy men and women",
    "aliases": [
      "Lamers 2009"
    ],
    "summary": "Marginal vitamin B6 deficiency in healthy adults raised plasma glycine but barely changed glycine cleavage or turnover, arguing against a hard glycine bottleneck at low PLP.",
    "body": [
      "Tests the idea that low [[compound:plp]] bottlenecks [[compound:glycine]] catabolism. Glycine does accumulate in plasma, but the flux through [[enzyme:glycine-cleavage-system|GCS]] and [[enzyme:shmt]] is preserved, so a modest B6 deficit alone is a weak explanation for glycine intolerance."
    ],
    "evidence": "plausible",
    "authors": [
      "Lamers Y",
      "Williamson J",
      "Ralat M",
      "Quinlivan EP",
      "Gilbert LR",
      "Keeling C",
      "Stevens RD",
      "Newgard CB",
      "Ueland PM",
      "Meyer K",
      "et al."
    ],
    "year": 2009,
    "journal": "The Journal of nutrition",
    "doi": "10.3945/jn.108.099184",
    "pmid": "19158217",
    "url": "https://doi.org/10.3945/jn.108.099184",
    "verified": true,
    "takeaways": [
      "Dietary restriction cut plasma PLP from 55 to 23 nmol/L (marginal deficiency) and raised plasma glycine.",
      "Serine formation from glycine by SHMT rose slightly (182 to 205 umol/kg/h); glycine cleavage (163 vs 151) was not significantly changed.",
      "The cleavage system produced one-carbon units at ~140-170 umol/kg/h, far above remethylation and transmethylation demand (4-7).",
      "The authors conclude the cleavage and SHMT reactions are resilient to marginal B6 deficiency, probably because rising substrate compensates."
    ],
    "facts": {
      "design": "tracer-study",
      "population": "Healthy adults, 7 M / 6 F, 20-39 y"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "state:b6-functional-deficiency",
        "note": "Plasma glycine rises with marginal B6 deficiency, supporting it as a functional marker."
      },
      {
        "rel": "evidence-against",
        "to": "enzyme:glycine-cleavage-system",
        "note": "Glycine cleavage flux was not reduced by marginal B6 deficiency in healthy adults."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:shmt",
        "note": "SHMT-catalysed glycine-to-serine flux slightly increased."
      },
      {
        "rel": "evidence-for",
        "to": "compound:plp"
      }
    ]
  },
  {
    "id": "article:davis-2005-b6-restriction-homocysteine",
    "type": "article",
    "name": "Dietary vitamin B-6 restriction does not alter rates of homocysteine remethylation or synthesis in healthy young women and men",
    "aliases": [
      "Davis 2005"
    ],
    "summary": "Four weeks of B6 restriction lowered PLP and raised plasma glycine but did not change in vivo homocysteine remethylation or synthesis in healthy adults.",
    "body": [
      "Directly tests whether low B6 impairs methylation in humans. [[enzyme:shmt]] activity and [[compound:glycine]] respond, but the [[pathway:methionine-cycle]] does not, which weakens a simple 'B6 deficiency causes undermethylation' narrative."
    ],
    "evidence": "plausible",
    "authors": [
      "Davis SR",
      "Scheer JB",
      "Quinlivan EP",
      "Coats BS",
      "Stacpoole PW",
      "Gregory JF 3rd"
    ],
    "year": 2005,
    "journal": "The American journal of clinical nutrition",
    "doi": "10.1093/ajcn/81.3.648",
    "pmid": "15755835",
    "url": "https://doi.org/10.1093/ajcn/81.3.648",
    "verified": true,
    "takeaways": [
      "B6 restriction (<0.5 mg/day) dropped plasma PLP from 55 to 23 nmol/L and raised plasma glycine from 230 to 296 umol/L.",
      "Lymphocyte SHMT activity measured in vitro fell 43% (basal) and 35% (PLP-stimulated), showing the enzyme is PLP-sensitive.",
      "In vivo rates of homocysteine synthesis and remethylation, and plasma homocysteine, did not change significantly.",
      "Moderate B6 deficiency therefore did not impair the methionine cycle in healthy young adults (fasted-state kinetics, no dietary methionine)."
    ],
    "facts": {
      "design": "tracer-study",
      "population": "Healthy adults, 5 F / 4 M, 20-30 y"
    },
    "relations": [
      {
        "rel": "evidence-against",
        "to": "state:undermethylation",
        "note": "Moderate B6 deficiency did not alter homocysteine remethylation rates in healthy adults."
      },
      {
        "rel": "evidence-for",
        "to": "state:b6-functional-deficiency",
        "note": "Plasma glycine rises and SHMT activity falls with B6 restriction."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:shmt",
        "note": "Lymphocyte SHMT activity fell 35-43% under B6 restriction."
      },
      {
        "rel": "evidence-against",
        "to": "pathway:methionine-cycle",
        "note": "Cycle kinetics unaffected by moderate B6 restriction."
      }
    ]
  },
  {
    "id": "article:kikuchi-2008-glycine-cleavage-system",
    "type": "article",
    "name": "Glycine cleavage system: reaction mechanism, physiological significance, and hyperglycinemia",
    "aliases": [
      "Kikuchi 2008"
    ],
    "summary": "Authoritative review of the mitochondrial glycine cleavage system: PLP-dependent P-protein, folate-dependent T-protein, and why defects cause nonketotic hyperglycinemia.",
    "body": [
      "Standard reference on [[enzyme:glycine-cleavage-system|GCS]]. Because it needs [[compound:plp]] and tetrahydrofolate, it is where [[compound:glycine]] and the [[pathway:folate-cycle]] touch. The CO2 and NH3 it releases are produced inside mitochondria."
    ],
    "evidence": "established",
    "authors": [
      "Kikuchi G",
      "Motokawa Y",
      "Yoshida T",
      "Hiraga K"
    ],
    "year": 2008,
    "journal": "Proceedings of the Japan Academy. Series B, Physical and biological sciences",
    "doi": "10.2183/pjab.84.246",
    "pmid": "18941301",
    "url": "https://doi.org/10.2183/pjab.84.246",
    "verified": true,
    "takeaways": [
      "The system catalyses glycine + THF + NAD+ to 5,10-methylene-THF + CO2 + NH3 + NADH and is the most prominent serine/glycine catabolic pathway in vertebrates, humans included.",
      "It has four components: a PLP-containing P-protein (decarboxylase), a THF-dependent T-protein, a lipoate-bearing H-protein, and L-protein (lipoamide dehydrogenase).",
      "The methylene-THF it makes supplies purines, thymidylate and methionine, linking glycine to methylation indirectly.",
      "Congenital defects cause nonketotic hyperglycinemia in infants."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:glycine-cleavage-system",
        "note": "Defines composition and reaction of the human glycine cleavage system."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:glycine-cleavage"
      },
      {
        "rel": "evidence-for",
        "to": "compound:plp",
        "note": "P-protein is a PLP enzyme; B6 availability is a cofactor requirement."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:folate-cycle",
        "note": "Product 5,10-methylene-THF enters the folate pool."
      }
    ]
  },
  {
    "id": "article:inagawa-2006-glycine-sleep",
    "type": "article",
    "name": "Subjective effects of glycine ingestion before bedtime on sleep quality",
    "aliases": [
      "Inagawa 2006"
    ],
    "summary": "Short report: a 3 g glycine dose before bed improved next-morning fatigue and alertness scores in volunteers with sleep complaints in a crossover design.",
    "body": [
      "First of the Japanese human trials of bedtime [[compound:glycine]] and one reason people try [[intervention:glycine-powder]]. It tests only subjective sleep scales at a 3 g dose, a dose range where individual users report belching, which this short report does not address."
    ],
    "evidence": "plausible",
    "authors": [
      "Inagawa K",
      "Hiraoka T",
      "Kohda T",
      "Yamadera W",
      "Takahashi M"
    ],
    "year": 2006,
    "journal": "Sleep and Biological Rhythms",
    "doi": "10.1111/j.1479-8425.2006.00193.x",
    "url": "https://doi.org/10.1111/j.1479-8425.2006.00193.x",
    "verified": true,
    "takeaways": [
      "Volunteers who complained of poor sleep took 3 g glycine or placebo before bedtime in a randomized double-blind crossover.",
      "Next-morning St Mary's Hospital Sleep Questionnaire and fatigue checklist scores improved for fatigue, liveliness and clear-headedness.",
      "All outcomes were subjective; the report is only three pages and small, so it is hypothesis-generating.",
      "Gastrointestinal tolerability is not reported in the short paper."
    ],
    "facts": {
      "design": "RCT",
      "population": "Volunteers with sleep complaints (small crossover)"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:glycine-powder",
        "note": "Single 3 g bolus before bed produced better subjective morning state; no GI data."
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine"
      },
      {
        "rel": "evidence-for",
        "to": "outcome:night-waking",
        "note": "Sleep-quality outcome only; awakenings not measured."
      }
    ]
  },
  {
    "id": "article:yamadera-2007-glycine-sleep-psg",
    "type": "article",
    "name": "Glycine ingestion improves subjective sleep quality in human volunteers, correlating with polysomnographic changes",
    "aliases": [
      "Yamadera 2007"
    ],
    "summary": "Randomized crossover with polysomnography: 3 g glycine before bed shortened latency to stage-2 and slow-wave sleep and improved subjective sleep quality without changing sleep architecture.",
    "body": [
      "Adds polysomnographic support to the subjective results of [[article:inagawa-2006-glycine-sleep]]. It underpins sleep claims for [[intervention:glycine-powder]], but the effect is on sleep onset, not on early-morning awakenings ([[outcome:night-waking]])."
    ],
    "evidence": "plausible",
    "authors": [
      "Yamadera W",
      "Inagawa K",
      "Chiba S",
      "Bannai M",
      "Takahashi M",
      "Nakayama K"
    ],
    "year": 2007,
    "journal": "Sleep and Biological Rhythms",
    "doi": "10.1111/j.1479-8425.2007.00262.x",
    "url": "https://doi.org/10.1111/j.1479-8425.2007.00262.x",
    "verified": true,
    "takeaways": [
      "Single-blind crossover in people with chronic sleep dissatisfaction; glycine granules or placebo within an hour of bedtime.",
      "Polysomnography showed shorter time to first stage-2 sleep (P=0.01) and to slow-wave sleep (P=0.019); REM latency was unchanged.",
      "Subjective sleep quality and sleep efficiency improved while sleep architecture stayed the same; daytime sleepiness decreased.",
      "Small, single-blind crossover, so replication in larger trials is needed."
    ],
    "facts": {
      "design": "RCT",
      "population": "Adults with chronic sleep dissatisfaction (small crossover)"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:glycine-powder",
        "note": "Objective PSG shortening of sleep latency at a 3 g bedtime dose."
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine"
      },
      {
        "rel": "evidence-for",
        "to": "outcome:night-waking",
        "note": "Sleep-onset and depth improved; spontaneous awakenings are not the reported endpoint."
      }
    ]
  },
  {
    "id": "article:kawai-2015-glycine-sleep-nmda",
    "type": "article",
    "name": "The sleep-promoting and hypothermic effects of glycine are mediated by NMDA receptors in the suprachiasmatic nucleus",
    "aliases": [
      "Kawai 2015"
    ],
    "summary": "Rat study: oral glycine promoted NREM sleep and lowered core temperature by acting on NMDA receptors in the suprachiasmatic nucleus, causing skin vasodilation.",
    "body": [
      "Provides the mechanism usually cited for glycine's sleep effect: central NMDA co-agonism leading to peripheral vasodilation, not any GABAergic route. This is relevant to [[compound:gaba]] discussions because it separates glycine's action from GABA synthesis."
    ],
    "evidence": "plausible",
    "authors": [
      "Kawai N",
      "Sakai N",
      "Okuro M",
      "Karakawa S",
      "Tsuneyoshi Y",
      "Kawasaki N",
      "Takeda T",
      "Bannai M",
      "Nishino S"
    ],
    "year": 2015,
    "journal": "Neuropsychopharmacology : official publication of the American College of Neuropsychopharmacology",
    "doi": "10.1038/npp.2014.326",
    "pmid": "25533534",
    "url": "https://doi.org/10.1038/npp.2014.326",
    "verified": true,
    "takeaways": [
      "Oral glycine induced non-REM sleep and shortened sleep latency in rats while lowering core temperature.",
      "Glycine raised cutaneous blood flow (heat loss); the effect was blocked by NMDA antagonists but not by the glycine-receptor antagonist strychnine.",
      "Microinjection into the suprachiasmatic nucleus reproduced the effect and ablating the nucleus abolished it.",
      "Mechanistic animal data only; the human dose-response is unaddressed."
    ],
    "facts": {
      "design": "animal"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Shows NMDA-receptor-mediated central action of ingested glycine on thermoregulation and sleep."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:glycine-powder",
        "note": "Mechanistic rationale for bedtime glycine; does not address gut tolerability."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:night-waking",
        "note": "Rodent mechanism for sleep promotion; no awakening endpoint."
      }
    ]
  },
  {
    "id": "article:soh-2024-glycine-systematic-review",
    "type": "article",
    "name": "The effect of glycine administration on the characteristics of physiological systems in human adults: A systematic review",
    "aliases": [
      "Soh 2024"
    ],
    "summary": "Systematic review of 52 human studies of glycine administration across eleven physiological systems; neurological benefits strongest, sleep data small and at high risk of bias.",
    "body": [
      "Best current summary of what controlled human data exist for oral [[compound:glycine]]. Its abstract does not list gastrointestinal adverse effects, so it neither confirms nor excludes belching with [[intervention:glycine-powder]]."
    ],
    "evidence": "established",
    "authors": [
      "Soh J",
      "Raventhiran S",
      "Lee JH",
      "Lim ZX",
      "Goh J",
      "Kennedy BK",
      "Maier AB"
    ],
    "year": 2024,
    "journal": "GeroScience",
    "doi": "10.1007/s11357-023-00970-8",
    "pmid": "37851316",
    "url": "https://doi.org/10.1007/s11357-023-00970-8",
    "verified": true,
    "takeaways": [
      "Covers glycine given to healthy (18 studies) and diseased (34 studies) adults for up to 14 days and up to four months respectively.",
      "The nervous system showed the most positive effects, including improved psychiatric symptoms with longer-term use in psychiatric patients.",
      "Sleep improvements in healthy people came from studies with small samples and high risk of bias.",
      "The authors call for larger, longer, better-designed trials in healthy populations."
    ],
    "facts": {
      "design": "systematic-review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:glycine-powder",
        "note": "Overview of the human evidence base; mostly short-term studies."
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine"
      },
      {
        "rel": "evidence-against",
        "to": "outcome:night-waking",
        "note": "Healthy-population sleep benefits rest on small, high-risk-of-bias studies."
      }
    ]
  },
  {
    "id": "article:gannon-2002-glycine-insulin",
    "type": "article",
    "name": "The metabolic response to ingested glycine",
    "aliases": [
      "Gannon 2002"
    ],
    "summary": "In nine healthy adults an oral glycine dose raised insulin and glucagon slightly and cut the glucose response to a 25 g glucose load by more than half, hinting at a gut hormone.",
    "body": [
      "An early human study of what a modest oral [[compound:glycine]] dose does to glucose handling. The proposed gut-hormone mediator was not identified, and [[compound:gastrin]] was not measured, so the study does not show that glycine stimulates gastrin."
    ],
    "evidence": "plausible",
    "authors": [
      "Gannon MC",
      "Nuttall JA",
      "Nuttall FQ"
    ],
    "year": 2002,
    "journal": "The American journal of clinical nutrition",
    "doi": "10.1093/ajcn/76.6.1302",
    "pmid": "12450897",
    "url": "https://doi.org/10.1093/ajcn/76.6.1302",
    "verified": true,
    "takeaways": [
      "Nine volunteers took ~1 mmol glycine/kg lean mass, 25 g glucose, both, or water on separate days.",
      "Glycine alone raised plasma glycine and glucagon and slightly raised insulin.",
      "With glucose, the glucose area response fell by more than 50% while the insulin area was not significantly different.",
      "The authors suggest glycine triggers a gut hormone that potentiates insulin action; this was not tested directly."
    ],
    "facts": {
      "design": "RCT",
      "population": "Healthy adults, n=9"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Acute human metabolic response to ingested glycine, ~4-5 g dose scale."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:glycine-powder",
        "note": "Acute physiological effects after a single oral dose; a gut-hormone mediator was proposed but not identified."
      }
    ]
  },
  {
    "id": "article:diaz-flores-2013-glycine-metabolic-syndrome",
    "type": "article",
    "name": "Oral supplementation with glycine reduces oxidative stress in patients with metabolic syndrome, improving their systolic blood pressure",
    "aliases": [
      "Díaz-Flores 2013"
    ],
    "summary": "Sixty metabolic-syndrome patients given 15 g/day glycine for three months showed less lipid peroxidation and lower systolic blood pressure in men than placebo.",
    "body": [
      "One of the few RCTs of multi-gram oral [[compound:glycine]] in a general (non-psychiatric) population. It shows the dose scale discussed for [[intervention:glycine-powder]] can be given for months in a trial, but GI side effects are not described in the abstract."
    ],
    "evidence": "plausible",
    "authors": [
      "Díaz-Flores M",
      "Cruz M",
      "Duran-Reyes G",
      "Munguia-Miranda C",
      "Loza-Rodríguez H",
      "Pulido-Casas E",
      "Torres-Ramírez N",
      "Gaja-Rodriguez O",
      "Kumate J",
      "Baiza-Gutman LA",
      "et al."
    ],
    "year": 2013,
    "journal": "Canadian journal of physiology and pharmacology",
    "doi": "10.1139/cjpp-2012-0341",
    "pmid": "24144057",
    "url": "https://doi.org/10.1139/cjpp-2012-0341",
    "verified": true,
    "takeaways": [
      "Thirty patients took 15 g/day glycine and thirty took placebo for 3 months.",
      "Plasma TBARS (lipid peroxidation) fell 25% versus placebo and superoxide dismutase activity fell 20%.",
      "Systolic blood pressure decreased in glycine-treated men (p=0.043).",
      "The abstract does not report gastrointestinal tolerability, so it cannot rule out mild belching or bloating."
    ],
    "facts": {
      "design": "RCT",
      "population": "Adults with metabolic syndrome, n=60"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:glycine-powder",
        "note": "15 g/day for 3 months in an RCT; abstract is silent on GI symptoms."
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Redox and blood-pressure effects in metabolic syndrome."
      }
    ]
  },
  {
    "id": "article:heresco-levy-1999-glycine-schizophrenia",
    "type": "article",
    "name": "Efficacy of high-dose glycine in the treatment of enduring negative symptoms of schizophrenia",
    "aliases": [
      "Heresco-Levy 1999"
    ],
    "summary": "Double-blind crossover of 0.8 g/kg/day glycine added to antipsychotics in 22 treatment-resistant schizophrenia patients reduced negative symptoms ~30% and was reported as well tolerated.",
    "body": [
      "Human proof that tens of grams of [[compound:glycine]] per day can be administered under supervision. It tempers any assumption that all oral glycine is inherently intolerable, while not telling us about belching, which would be a minor adverse event."
    ],
    "evidence": "established",
    "authors": [
      "Heresco-Levy U",
      "Javitt DC",
      "Ermilov M",
      "Mordel C",
      "Silipo G",
      "Lichtenstein M"
    ],
    "year": 1999,
    "journal": "Archives of general psychiatry",
    "doi": "10.1001/archpsyc.56.1.29",
    "pmid": "9892253",
    "url": "https://doi.org/10.1001/archpsyc.56.1.29",
    "verified": true,
    "takeaways": [
      "Six-week double-blind placebo-controlled crossover; glycine 0.8 g/kg/day (roughly 55-60 g for a 70 kg adult) added to ongoing antipsychotics.",
      "Serum glycine and serine rose; PANSS negative symptoms fell by about 30% and BPRS total by about 30%.",
      "Low baseline serum glycine strongly predicted response (r=0.80).",
      "Treatment was described as well tolerated; the abstract gives no breakdown of mild GI complaints."
    ],
    "facts": {
      "design": "RCT",
      "population": "Treatment-resistant schizophrenia, n=22"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Establishes tolerability signal at very high supervised doses and a NMDA co-agonist mechanism."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:glycine-powder",
        "note": "Shows doses far above 3-10 g/day can be given long enough for a trial; GI events not itemised in abstract."
      }
    ]
  },
  {
    "id": "article:heresco-levy-2004-glycine-olanzapine",
    "type": "article",
    "name": "High-dose glycine added to olanzapine and risperidone for the treatment of schizophrenia",
    "aliases": [
      "Heresco-Levy 2004"
    ],
    "summary": "Six-week crossover of 0.8 g/kg/day glycine added to olanzapine or risperidone in 17 patients lowered negative symptoms 23%, again reported as well tolerated.",
    "body": [
      "Replicates the high-dose [[compound:glycine]] findings of [[article:heresco-levy-1999-glycine-schizophrenia]] with newer antipsychotics. Same caveat: tolerability stated globally, GI detail not in the abstract."
    ],
    "evidence": "established",
    "authors": [
      "Heresco-Levy U",
      "Ermilov M",
      "Lichtenberg P",
      "Bar G",
      "Javitt DC"
    ],
    "year": 2004,
    "journal": "Biological psychiatry",
    "doi": "10.1016/s0006-3223(03)00707-8",
    "pmid": "14732596",
    "url": "https://doi.org/10.1016/s0006-3223(03)00707-8",
    "verified": true,
    "takeaways": [
      "Double-blind, placebo-controlled six-week crossover in 17 patients on olanzapine or risperidone.",
      "Negative symptoms fell by 23% (p<0.0001) with improvements also in cognitive and positive symptoms.",
      "Higher post-treatment serum glycine predicted a better response (r=0.60).",
      "Glycine treatment was reported well tolerated, without a GI-specific breakdown in the abstract."
    ],
    "facts": {
      "design": "RCT",
      "population": "Schizophrenia on olanzapine/risperidone, n=17"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:glycine"
      },
      {
        "rel": "evidence-for",
        "to": "intervention:glycine-powder",
        "note": "Second small RCT with ~0.8 g/kg/day and a general tolerability statement."
      }
    ]
  },
  {
    "id": "article:thomas-2024-collagen-peptides-sleep",
    "type": "article",
    "name": "Collagen peptide supplementation before bedtime reduces sleep fragmentation and improves cognitive function in physically active males with sleep complaints",
    "aliases": [
      "Thomas 2024"
    ],
    "summary": "Randomized crossover in 13 active men with sleep complaints: 15 g collagen peptides one hour before bed reduced polysomnographic awakenings but not latency or efficiency.",
    "body": [
      "Links a glycine-rich supplement, [[intervention:collagen-peptides]], to reduced awakenings ([[outcome:night-waking]]). It is the only controlled sleep result found in this layer that uses collagen rather than free [[compound:glycine]]."
    ],
    "evidence": "plausible",
    "authors": [
      "Thomas C",
      "Kingshott RN",
      "Allott KM",
      "Tang JCY",
      "Dunn R",
      "Fraser WD",
      "Thorley J",
      "Virgilio N",
      "Prawitt J",
      "Hogervorst E",
      "et al."
    ],
    "year": 2024,
    "journal": "European journal of nutrition",
    "doi": "10.1007/s00394-023-03267-w",
    "pmid": "37874350",
    "url": "https://doi.org/10.1007/s00394-023-03267-w",
    "verified": true,
    "takeaways": [
      "Thirteen athletic men with sleep complaints took 15 g/day collagen peptides or placebo 1 hour before bed for 7 nights.",
      "Polysomnography on night 7 showed fewer awakenings (21.3 vs 29.3 counts; P=0.028) and subjective awakenings also fell.",
      "Sleep latency, efficiency and quantity, core temperature, endocrine and inflammatory markers did not differ.",
      "Next-morning Stroop accuracy was higher, but this was a small trial."
    ],
    "facts": {
      "design": "RCT",
      "population": "Physically active men with sleep complaints, n=13"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:collagen-peptides",
        "note": "15 g bedtime dose given for a week; sleep fragmentation reduced."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:night-waking",
        "note": "Fewer PSG-detected awakenings with a glycine-rich collagen supplement (n=13)."
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "The supplement is described as glycine-rich; free glycine was not tested."
      }
    ]
  },
  {
    "id": "article:luka-2009-gnmt-sam-regulation",
    "type": "article",
    "name": "Glycine N-methyltransferase and regulation of S-adenosylmethionine levels",
    "aliases": [
      "Luka 2009"
    ],
    "summary": "Mini-review by the Wagner group naming glycine N-methyltransferase as a major regulator of S-adenosylmethionine levels in mammals.",
    "body": [
      "Core mechanistic reference for [[enzyme:gnmt]] as a buffer on [[compound:sam]]. It supports the biochemical premise that glycine can be a methyl acceptor, but a methyl-acceptor role is not evidence that supplemental glycine depletes methyl groups in people."
    ],
    "evidence": "established",
    "authors": [
      "Luka Z",
      "Mudd SH",
      "Wagner C"
    ],
    "year": 2009,
    "journal": "The Journal of biological chemistry",
    "doi": "10.1074/jbc.R109.019273",
    "pmid": "19483083",
    "url": "https://doi.org/10.1074/jbc.R109.019273",
    "verified": true,
    "takeaways": [
      "SAM is the methyl donor for almost all cellular methylation, including phosphatidylcholine and creatine synthesis and histone and DNA methylation.",
      "Its level must be adjusted to developmental stage and metabolic state, and GNMT has been shown to play a major part in that adjustment.",
      "The review focuses on the latest mechanistic work on how GNMT activity is regulated.",
      "It is a review, with no new clinical data and no data on dietary glycine loads in humans."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:gnmt",
        "note": "Defines GNMT's regulatory role over SAM in mammals."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam",
        "note": "SAM homeostasis depends in part on GNMT."
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Glycine is GNMT's methyl acceptor (substrate)."
      }
    ]
  },
  {
    "id": "article:mudd-2007-methyl-balance",
    "type": "article",
    "name": "Methyl balance and transmethylation fluxes in humans",
    "aliases": [
      "Mudd 2007"
    ],
    "summary": "Review and data on labile methyl balance: the biggest SAM-dependent sinks are creatine (GAMT), phosphatidylcholine (PEMT) and sarcosine (GNMT); SAM accumulates when GNMT is absent.",
    "body": [
      "Mudd's methyl-balance paper is the quantitative backbone for the ontology's 'methyl sink' idea: [[enzyme:gnmt]], [[enzyme:pemt]] and [[pathway:creatine-synthesis]] together set [[compound:sam]] demand. It does not assess supplemented glycine."
    ],
    "evidence": "established",
    "authors": [
      "Mudd SH",
      "Brosnan JT",
      "Brosnan ME",
      "Jacobs RL",
      "Stabler SP",
      "Allen RH",
      "Vance DE",
      "Wagner C"
    ],
    "year": 2007,
    "journal": "The American journal of clinical nutrition",
    "doi": "10.1093/ajcn/85.1.19",
    "pmid": "17209172",
    "url": "https://doi.org/10.1093/ajcn/85.1.19",
    "verified": true,
    "takeaways": [
      "Methyl balance is maintained by methylneogenesis when needed; total transmethylation fluxes in humans remain poorly measured.",
      "Quantitatively dominant SAM-dependent reactions are creatine synthesis, phosphatidylcholine synthesis by PEMT, and sarcosine synthesis by GNMT.",
      "SAM and methionine accumulate abnormally in plasma of people with GNMT deficiency but not in GAMT deficiency or PEMT-null mice.",
      "The authors suggest sarcosine synthesis can remove surplus SAM when the other pathways are blocked, and list experiments needed to resolve remaining uncertainties."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:gnmt",
        "note": "Human GNMT deficiency raises plasma SAM and methionine; GNMT acts as a SAM sink."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:pemt",
        "note": "PEMT is one of the three quantitatively dominant methyl consumers."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:creatine-synthesis",
        "note": "Creatine synthesis by GAMT is a major methyl consumer."
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
    "id": "article:mudd-2001-gnmt-deficiency",
    "type": "article",
    "name": "Glycine N-methyltransferase deficiency: a novel inborn error causing persistent isolated hypermethioninaemia",
    "aliases": [
      "Mudd 2001"
    ],
    "summary": "Two siblings with persistent isolated hypermethioninemia and high SAM but normal sarcosine had a novel GNMT deficiency, showing GNMT is a human SAM sink.",
    "body": [
      "Human inborn error showing that [[enzyme:gnmt]] constrains [[compound:sam]]. It argues the enzyme is a real methyl valve, while the clinical picture (mild liver changes) hints that too much SAM, not too little, is the problem when the valve fails."
    ],
    "evidence": "plausible",
    "authors": [
      "Mudd SH",
      "Cerone R",
      "Schiaffino MC",
      "Fantasia AR",
      "Minniti G",
      "Caruso U",
      "Lorini R",
      "Watkins D",
      "Matiaszuk N",
      "Rosenblatt DS",
      "et al."
    ],
    "year": 2001,
    "journal": "Journal of inherited metabolic disease",
    "doi": "10.1023/a:1010577512912",
    "pmid": "11596649",
    "url": "https://doi.org/10.1023/a:1010577512912",
    "verified": true,
    "takeaways": [
      "Siblings had hypermethioninemia not caused by CBS deficiency, tyrosinemia or liver disease, with abnormally high plasma SAM.",
      "Plasma sarcosine was not raised, unlike in normal people after methionine loading, pointing to deficient GNMT activity.",
      "Clinical findings were mild: hepatomegaly and chronically raised serum transaminases.",
      "This is the closest human model of 'too little GNMT', i.e. SAM excess, not the opposite situation."
    ],
    "facts": {
      "design": "case series",
      "population": "Two Italian siblings"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:gnmt",
        "note": "Loss of GNMT function in humans raises SAM and methionine."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam"
      },
      {
        "rel": "evidence-for",
        "to": "state:overmethylation",
        "note": "Chronic SAM excess from GNMT loss is accompanied by liver enzyme abnormalities; not a dietary 'overmethylation' state."
      }
    ]
  },
  {
    "id": "article:martinez-chantar-2008-gnmt-knockout",
    "type": "article",
    "name": "Loss of the glycine N-methyltransferase gene leads to steatosis and hepatocellular carcinoma in mice",
    "aliases": [
      "Martínez-Chantar 2008"
    ],
    "summary": "GNMT-knockout mice have high SAM and methionine, steatosis, fibrosis and liver cancer with aberrant DNA and histone methylation.",
    "body": [
      "Mouse knockout data that complement [[article:mudd-2001-gnmt-deficiency]]. [[enzyme:gnmt]] protects the liver from [[compound:sam]] excess, so any claim that GNMT activity is harmful by 'draining methyls' has to be weighed against this protective role."
    ],
    "evidence": "plausible",
    "authors": [
      "Martínez-Chantar ML",
      "Vázquez-Chantada M",
      "Ariz U",
      "Martínez N",
      "Varela M",
      "Luka Z",
      "Capdevila A",
      "Rodríguez J",
      "Aransay AM",
      "Matthiesen R",
      "et al."
    ],
    "year": 2008,
    "journal": "Hepatology (Baltimore, Md.)",
    "doi": "10.1002/hep.22159",
    "pmid": "18318442",
    "url": "https://doi.org/10.1002/hep.22159",
    "verified": true,
    "takeaways": [
      "GNMT is described as the main enzyme that removes excess hepatic SAM.",
      "Knockout mice had raised serum aminotransferases, methionine and SAM and developed steatosis, fibrosis and hepatocellular carcinoma.",
      "Ras and JAK/STAT pathways were activated with hypermethylation of the RASSF1 and SOCS2 promoters.",
      "Chronic SAM excess, rather than deficiency, was the driver of pathology in this model."
    ],
    "facts": {
      "design": "animal"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:gnmt",
        "note": "Loss of GNMT leads to SAM excess and liver pathology in mice."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam"
      },
      {
        "rel": "evidence-for",
        "to": "state:overmethylation",
        "note": "Genetic SAM excess produced epigenetic and metabolic disease; animal model only."
      }
    ]
  },
  {
    "id": "article:cook-1984-gnmt-folate-binding",
    "type": "article",
    "name": "Glycine N-methyltransferase is a folate binding protein of rat liver cytosol",
    "aliases": [
      "Cook 1984"
    ],
    "summary": "Showed that a rat-liver folate-binding protein is glycine N-methyltransferase, laying the groundwork for folate regulation of GNMT.",
    "body": [
      "Foundational biochemistry connecting [[enzyme:gnmt]] to folate. It underlies the later demonstration that 5-methyltetrahydrofolate ([[compound:5-mthf|5-methyl-THF]]) inhibits the enzyme."
    ],
    "evidence": "plausible",
    "authors": [
      "Cook RJ",
      "Wagner C"
    ],
    "year": 1984,
    "journal": "Proceedings of the National Academy of Sciences of the United States of America",
    "doi": "10.1073/pnas.81.12.3631",
    "pmid": "6587377",
    "url": "https://doi.org/10.1073/pnas.81.12.3631",
    "verified": true,
    "takeaways": [
      "Amino-acid composition and immunological data showed a rat liver cytosolic folate-binding protein is closely related to GNMT.",
      "Antiserum raised against the folate-binding protein nearly abolished GNMT activity in crude liver cytosol.",
      "Purification yielded two homogeneous GNMT forms, one with bound folate and one without.",
      "Rat tissue and in-vitro evidence; later work (Yeo 1999) characterises the folate inhibition."
    ],
    "facts": {
      "design": "in-vitro"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:gnmt",
        "note": "GNMT is a folate-binding protein in liver."
      },
      {
        "rel": "evidence-for",
        "to": "compound:5-mthf",
        "note": "Folate binding links the methionine and folate cycles through GNMT."
      }
    ]
  },
  {
    "id": "article:yeo-1999-gnmt-5mthf-inhibition",
    "type": "article",
    "name": "Inhibition of glycine N-methyltransferase by 5-methyltetrahydrofolate pentaglutamate",
    "aliases": [
      "Yeo 1999"
    ],
    "summary": "5-methyltetrahydrofolate pentaglutamate noncompetitively inhibits GNMT with strong SAM cooperativity, supporting a role as methyl-group regulator.",
    "body": [
      "In vitro, [[compound:5-mthf|5-methyl-THF]] dials GNMT down when folate is plentiful and SAM is low, which is the opposite of an uncontrolled methyl drain. This is a mechanism for how [[intervention:methylfolate-supplement|methylfolate]] might matter, but it was shown with purified rat enzyme, not in people taking glycine."
    ],
    "evidence": "plausible",
    "authors": [
      "Yeo EJ",
      "Briggs WT",
      "Wagner C"
    ],
    "year": 1999,
    "journal": "The Journal of biological chemistry",
    "doi": "10.1074/jbc.274.53.37559",
    "pmid": "10608809",
    "url": "https://doi.org/10.1074/jbc.274.53.37559",
    "verified": true,
    "takeaways": [
      "Inhibition by 5-methyl-THF pentaglutamate is noncompetitive with respect to both SAM and glycine.",
      "The enzyme shows strong positive cooperativity for SAM, increased by the folate inhibitor.",
      "Half-maximal inhibition of liver GNMT occurs at about 0.2 uM at pH 7; the natural 6S folate form is roughly twice as inhibitory as the racemic mix.",
      "The authors conclude GNMT is an allosteric regulator of methyl-group metabolism in liver and pancreas (purified rat enzymes)."
    ],
    "facts": {
      "design": "in-vitro"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:gnmt",
        "note": "Folate-polyglutamate inhibition and SAM cooperativity define GNMT regulation."
      },
      {
        "rel": "evidence-for",
        "to": "compound:5-mthf",
        "note": "Methyl-folate restrains GNMT in vitro."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:folate-cycle",
        "note": "Links folate status to methyl-group disposal."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:methylfolate-supplement",
        "note": "Mechanistic rationale only: higher cellular 5-methyl-THF could restrain GNMT; no in vivo test here."
      }
    ]
  },
  {
    "id": "article:stead-2006-methyl-balance-reevaluation",
    "type": "article",
    "name": "Is it time to reevaluate methyl balance in humans?",
    "aliases": [
      "Stead 2006"
    ],
    "summary": "Argues creatine synthesis consumes less SAM methyl than the old >70% estimate and that PEMT phosphatidylcholine synthesis is a major consumer.",
    "body": [
      "Reinterpretation of methyl budgets: [[enzyme:pemt]] rather than [[pathway:creatine-synthesis]] may dominate [[compound:sam]] use. Relevant to the ontology's argument that choline and betaine act as methyl donors that spare PEMT."
    ],
    "evidence": "established",
    "authors": [
      "Stead LM",
      "Brosnan JT",
      "Brosnan ME",
      "Vance DE",
      "Jacobs RL"
    ],
    "year": 2006,
    "journal": "The American journal of clinical nutrition",
    "doi": "10.1093/ajcn/83.1.5",
    "pmid": "16400042",
    "url": "https://doi.org/10.1093/ajcn/83.1.5",
    "verified": true,
    "takeaways": [
      "More than 50 SAM-dependent methylation reactions are known in mammals; methyl groups come from diet (methionine, choline, betaine) and methylneogenesis.",
      "Creatine synthesis was thought to use over 70% of SAM-derived methyl groups, but dietary creatine can supply up to half of daily creatine needs, so that share is lower.",
      "PEMT-null mice show a ~50% drop in plasma homocysteine, indicating PEMT is a major SAM consumer.",
      "This reshapes which methyl sink matters most in whole-body methyl balance."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:pemt",
        "note": "PEMT is a major SAM consumer."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:creatine-synthesis",
        "note": "Creatine share of SAM methyl use is smaller than formerly assumed."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam"
      },
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "Choline (with methionine and betaine) is named as a dietary source of SAM methyl groups."
      }
    ]
  },
  {
    "id": "article:brosnan-2004-methylation-demand",
    "type": "article",
    "name": "Methylation demand: a key determinant of homocysteine metabolism",
    "aliases": [
      "Brosnan 2004"
    ],
    "summary": "Review identifying GAMT (creatine) and PEMT (phosphatidylcholine) as the biggest producers of homocysteine through methylation demand.",
    "body": [
      "Links [[compound:homocysteine]] to methyl demand. It explains why choline/betaine (via [[enzyme:bhmt]]) and B vitamins can all move homocysteine."
    ],
    "evidence": "established",
    "authors": [
      "Brosnan JT",
      "Jacobs RL",
      "Stead LM",
      "Brosnan ME"
    ],
    "year": 2004,
    "journal": "Acta biochimica Polonica",
    "pmid": "15218538",
    "url": "https://pubmed.ncbi.nlm.nih.gov/15218538/",
    "verified": true,
    "takeaways": [
      "Plasma homocysteine reflects both production (methylation) and removal (transsulfuration or remethylation).",
      "Of many methyltransferases, guanidinoacetate methyltransferase and PEMT are normally of greatest quantitative importance.",
      "Removal depends on B vitamins: transsulfuration enzymes need PLP, methionine synthase needs cobalamin and folate, and BHMT offers a betaine-dependent alternative.",
      "Genetic variants also shape homocysteine levels."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:homocysteine",
        "note": "Frames homocysteine as a readout of methylation demand and B-vitamin status."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:pemt"
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:bhmt",
        "note": "BHMT is one of two remethylation routes."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:methionine-cycle"
      }
    ]
  },
  {
    "id": "article:jacobs-2005-pemt-homocysteine",
    "type": "article",
    "name": "Physiological regulation of phospholipid methylation alters plasma homocysteine in mice",
    "aliases": [
      "Jacobs 2005"
    ],
    "summary": "In mice lacking hepatic CTP:phosphocholine cytidylyltransferase-alpha, PEMT flux doubled and plasma homocysteine rose 20-40%, showing phospholipid methylation drives homocysteine.",
    "body": [
      "Mouse evidence that [[enzyme:pemt]] methylation demand pushes [[compound:homocysteine]] up and that [[enzyme:bhmt]] compensates. It supports the logic by which choline supply (the [[pathway:kennedy-pathway]] alternative) spares methyl groups."
    ],
    "evidence": "plausible",
    "authors": [
      "Jacobs RL",
      "Stead LM",
      "Devlin C",
      "Tabas I",
      "Brosnan ME",
      "Brosnan JT",
      "Vance DE"
    ],
    "year": 2005,
    "journal": "The Journal of biological chemistry",
    "doi": "10.1074/jbc.M501971200",
    "pmid": "15958390",
    "url": "https://doi.org/10.1074/jbc.M501971200",
    "verified": true,
    "takeaways": [
      "Liver-specific CTalpha knockout mice must make phosphatidylcholine via PEMT, doubling flux through that methylation pathway.",
      "Plasma homocysteine was 20-40% higher and knockout hepatocytes secreted 40% more homocysteine.",
      "BHMT and MAT activities rose, apparently keeping hepatic SAM and SAH normal.",
      "Phospholipid methylation in liver is therefore a major SAM consumer and homocysteine source."
    ],
    "facts": {
      "design": "animal"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:pemt",
        "note": "Higher PEMT flux raised plasma homocysteine in mice."
      },
      {
        "rel": "evidence-for",
        "to": "compound:homocysteine"
      },
      {
        "rel": "evidence-for",
        "to": "state:hyperhomocysteinemia",
        "note": "Increased methylation demand alone can raise plasma homocysteine; mouse model."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:bhmt",
        "note": "BHMT up-regulated as compensation."
      }
    ]
  },
  {
    "id": "article:brosnan-2007-creatine-review",
    "type": "article",
    "name": "Creatine: endogenous metabolite, dietary, and therapeutic supplement",
    "aliases": [
      "Brosnan 2007"
    ],
    "summary": "Review of creatine synthesis and supplementation noting that its synthesis makes major demands on glycine, arginine and methionine metabolism.",
    "body": [
      "Shows [[pathway:creatine-synthesis]] as a competing consumer of [[compound:glycine]] and methyl groups, relevant to the 'methyl sink' discussion around [[compound:creatine]] supplementation."
    ],
    "evidence": "established",
    "authors": [
      "Brosnan JT",
      "Brosnan ME"
    ],
    "year": 2007,
    "journal": "Annual review of nutrition",
    "doi": "10.1146/annurev.nutr.27.061406.093621",
    "pmid": "17430086",
    "url": "https://doi.org/10.1146/annurev.nutr.27.061406.093621",
    "verified": true,
    "takeaways": [
      "Creatine and phosphocreatine act as an energy buffer and shuttle and are continually lost to creatinine, so must be replaced.",
      "Replacement comes from diet plus endogenous synthesis; vegetarians take in almost no creatine.",
      "Creatine synthesis makes major demands on glycine, arginine and methionine (as SAM).",
      "Inborn errors of creatine synthesis or transport cause severe neurological symptoms and brain creatine depletion."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:creatine-synthesis",
        "note": "Describes the glycine, arginine and SAM requirements of synthesis."
      },
      {
        "rel": "evidence-for",
        "to": "compound:creatine"
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Glycine is a direct substrate (via guanidinoacetate)."
      }
    ]
  },
  {
    "id": "article:caudill-2001-sah-dna-methylation",
    "type": "article",
    "name": "Intracellular S-adenosylhomocysteine concentrations predict global DNA hypomethylation in tissues of methyl-deficient cystathionine beta-synthase heterozygous mice",
    "aliases": [
      "Caudill 2001"
    ],
    "summary": "In mice, a rise in S-adenosylhomocysteine, not a fall in SAM alone, tracked tissue DNA hypomethylation, so SAM:SAH is informative mainly when SAH is up.",
    "body": [
      "Refines how to interpret a low [[outcome:low-sam-sah-ratio]]: product inhibition by [[compound:sah]] matters more than substrate shortage ([[compound:sam]]). That caution applies to any use of 'undermethylation' as a label in [[state:undermethylation]]."
    ],
    "evidence": "plausible",
    "authors": [
      "Caudill MA",
      "Wang JC",
      "Melnyk S",
      "Pogribny IP",
      "Jernigan S",
      "Collins MD",
      "Santos-Guzman J",
      "Swendseid ME",
      "Cogger EA",
      "James SJ"
    ],
    "year": 2001,
    "journal": "The Journal of nutrition",
    "doi": "10.1093/jn/131.11.2811",
    "pmid": "11694601",
    "url": "https://doi.org/10.1093/jn/131.11.2811",
    "verified": true,
    "takeaways": [
      "Wild-type and CBS-heterozygous mice were fed control or methyl-deficient diets for 24 weeks and SAM, SAH and global DNA methylation were measured in four tissues.",
      "A SAM decrease alone was not enough to lower DNA methylation; an SAH increase, alone or with low SAM, was most consistently linked to hypomethylation.",
      "A low SAM:SAH ratio predicted reduced methylation capacity only when it came with raised SAH.",
      "Plasma homocysteine correlated with intracellular SAH, and plasma SAH may serve as a methylation-status biomarker."
    ],
    "facts": {
      "design": "animal"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:sah",
        "note": "SAH accumulation, more than SAM depletion, associated with hypomethylation in mice."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:low-sam-sah-ratio",
        "note": "Ratio is informative about methylation capacity only when driven by raised SAH."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam"
      },
      {
        "rel": "evidence-for",
        "to": "state:undermethylation",
        "note": "Supports an SAH-driven (product inhibition) form of low methylation capacity; animal data."
      }
    ]
  },
  {
    "id": "article:james-2004-autism-sam-sah",
    "type": "article",
    "name": "Metabolic biomarkers of increased oxidative stress and impaired methylation capacity in children with autism",
    "aliases": [
      "James 2004"
    ],
    "summary": "Children with autism had lower plasma SAM:SAH and glutathione redox ratios than controls; an uncontrolled nutrient trial normalised the profile in a subset.",
    "body": [
      "One of the most-cited human papers using plasma [[compound:sam]] and [[compound:sah]] to define a methylation deficit. Note the sample size (20 cases) and the uncontrolled design; it is a source for the idea of a low [[outcome:low-sam-sah-ratio]] in a disorder, not proof that supplements correct it."
    ],
    "evidence": "plausible",
    "authors": [
      "James SJ",
      "Cutler P",
      "Melnyk S",
      "Jernigan S",
      "Janak L",
      "Gaylor DW",
      "Neubrander JA"
    ],
    "year": 2004,
    "journal": "The American journal of clinical nutrition",
    "doi": "10.1093/ajcn/80.6.1611",
    "pmid": "15585776",
    "url": "https://doi.org/10.1093/ajcn/80.6.1611",
    "verified": true,
    "takeaways": [
      "Twenty children with autism and 33 controls were compared on plasma methionine-cycle and transsulfuration metabolites.",
      "Autistic children had lower methionine, SAM, homocysteine, cysteine and total glutathione and higher SAH, adenosine and oxidised glutathione.",
      "That pattern means a lower SAM:SAH ratio (impaired methylation capacity) and a lower reduced:oxidised glutathione ratio (oxidative stress).",
      "A targeted folinic acid, betaine and methylcobalamin trial in a subset normalised the profile, but it was uncontrolled and plasma markers do not prove cause."
    ],
    "facts": {
      "design": "case-control",
      "population": "Children with autism (n=20) vs controls (n=33)"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "outcome:low-sam-sah-ratio",
        "note": "Provides a reported clinical example of a low plasma SAM:SAH ratio in a defined group."
      },
      {
        "rel": "evidence-for",
        "to": "state:undermethylation",
        "note": "Small case-control; association only, no causal or tissue-level evidence."
      },
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
        "to": "intervention:betaine-anhydrous",
        "note": "Betaine was one of three nutrients in an uncontrolled intervention; effect not separable."
      }
    ]
  },
  {
    "id": "article:froese-2018-mthfr-structure",
    "type": "article",
    "name": "Structural basis for the regulation of human 5,10-methylenetetrahydrofolate reductase by phosphorylation and S-adenosylmethionine inhibition",
    "aliases": [
      "Froese 2018"
    ],
    "summary": "Crystal structure of human MTHFR reveals a SAM-binding regulatory domain and shows N-terminal phosphorylation raises sensitivity to SAM inhibition.",
    "body": [
      "Explains how high [[compound:sam]] switches off [[enzyme:mthfr]], restraining [[compound:5-mthf|5-methyl-THF]] supply. It is a mechanistic reason why more methylfolate is not automatically more methylation."
    ],
    "evidence": "established",
    "authors": [
      "Froese DS",
      "Kopec J",
      "Rembeza E",
      "Bezerra GA",
      "Oberholzer AE",
      "Suormala T",
      "Lutz S",
      "Chalk R",
      "Borkowska O",
      "Baumgartner MR",
      "et al."
    ],
    "year": 2018,
    "journal": "Nature communications",
    "doi": "10.1038/s41467-018-04735-2",
    "pmid": "29891918",
    "url": "https://doi.org/10.1038/s41467-018-04735-2",
    "verified": true,
    "takeaways": [
      "MTHFR links the folate and methionine cycles by making 5-methyltetrahydrofolate and is allosterically inhibited by its end product SAM.",
      "The 2.5 angstrom structure shows a catalytic TIM-barrel joined to a eukaryote-specific SAM-binding domain that forms the dimer interface.",
      "Eleven N-terminal residues are phosphorylated, which increases sensitivity to SAM binding and inhibition.",
      "A flexible inter-domain linker is proposed as the mediator of SAM regulation."
    ],
    "facts": {
      "design": "in-vitro"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:mthfr",
        "note": "Structural basis for SAM feedback inhibition and phosphorylation control."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam",
        "note": "SAM inhibits MTHFR, braking 5-methyl-THF production when SAM is high."
      },
      {
        "rel": "evidence-for",
        "to": "compound:5-mthf"
      },
      {
        "rel": "evidence-for",
        "to": "pathway:methionine-cycle",
        "note": "Defines the feedback coupling between folate and methionine cycles."
      }
    ]
  },
  {
    "id": "article:selhub-1999-homocysteine-metabolism",
    "type": "article",
    "name": "Homocysteine metabolism",
    "aliases": [
      "Selhub 1999"
    ],
    "summary": "Classic review of homocysteine metabolism: remethylation (folate/B12 or betaine) versus PLP-dependent transsulfuration, coordinated by SAM.",
    "body": [
      "Foundational description of the branch point where [[compound:homocysteine]] is sent back through the [[pathway:methionine-cycle]] or forward through PLP-dependent transsulfuration, with [[compound:sam]] as the switch."
    ],
    "evidence": "established",
    "authors": [
      "Selhub J"
    ],
    "year": 1999,
    "journal": "Annual review of nutrition",
    "doi": "10.1146/annurev.nutr.19.1.217",
    "pmid": "10448523",
    "url": "https://doi.org/10.1146/annurev.nutr.19.1.217",
    "verified": true,
    "takeaways": [
      "Homocysteine sits at the junction of remethylation to methionine and transsulfuration to cystathionine.",
      "SAM coordinates the pathways by inhibiting MTHFR and activating cystathionine beta-synthase.",
      "Mild fasting hyperhomocysteinemia usually reflects folate or B12 deficiency or MTHFR thermolability; post-methionine-load elevation can reflect heterozygous CBS defects or B6 deficiency.",
      "Severe hyperhomocysteinemia arises from rare genetic defects."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:homocysteine",
        "note": "Authoritative map of homocysteine metabolism and its regulation."
      },
      {
        "rel": "evidence-for",
        "to": "state:hyperhomocysteinemia",
        "note": "Mechanisms of mild and severe elevation."
      },
      {
        "rel": "evidence-for",
        "to": "compound:plp",
        "note": "PLP needed for transsulfuration (CBS, cystathionase)."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:mthfr",
        "note": "SAM is an allosteric inhibitor of the MTHFR step."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:methionine-cycle"
      }
    ]
  },
  {
    "id": "article:frosst-1995-mthfr-variant",
    "type": "article",
    "name": "A candidate genetic risk factor for vascular disease: a common mutation in methylenetetrahydrofolate reductase",
    "aliases": [
      "Frosst 1995"
    ],
    "summary": "Identified the common thermolabile MTHFR variant (allele frequency about 38%) that lowers enzyme activity and raises homocysteine in homozygotes.",
    "body": [
      "Defines the common MTHFR variant discussed whenever [[enzyme:mthfr]] genotype is linked to [[state:hyperhomocysteinemia]]. Later work ([[article:klerk-2002-mthfr-chd]], [[article:hickey-2013-acmg-mthfr]]) tempers its clinical weight."
    ],
    "evidence": "established",
    "authors": [
      "Frosst P",
      "Blom HJ",
      "Milos R",
      "Goyette P",
      "Sheppard CA",
      "Matthews RG",
      "Boers GJ",
      "den Heijer M",
      "Kluijtmans LA",
      "van den Heuvel LP"
    ],
    "year": 1995,
    "journal": "Nature genetics",
    "doi": "10.1038/ng0595-111",
    "pmid": "7647779",
    "url": "https://doi.org/10.1038/ng0595-111",
    "verified": true,
    "takeaways": [
      "A common substitution in MTHFR alters a conserved amino acid and was found on about 38% of unselected chromosomes.",
      "Heterozygous and homozygous carriers show reduced activity and increased thermolability in lymphocyte extracts.",
      "In-vitro expression of the mutated cDNA confirmed the thermolability.",
      "Homozygotes had significantly higher plasma homocysteine, leading the authors to propose it as a vascular risk factor (later meta-analyses tempered this)."
    ],
    "facts": {
      "design": "genetic-association"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:mthfr",
        "note": "Original description of the common reduced-activity variant."
      },
      {
        "rel": "evidence-for",
        "to": "state:hyperhomocysteinemia",
        "note": "Homozygotes had higher homocysteine."
      },
      {
        "rel": "evidence-for",
        "to": "compound:homocysteine"
      }
    ]
  },
  {
    "id": "article:froese-2016-mthfr-deficiency",
    "type": "article",
    "name": "Mutation Update and Review of Severe Methylenetetrahydrofolate Reductase Deficiency",
    "aliases": [
      "Froese 2016"
    ],
    "summary": "Mutation update of severe MTHFR deficiency (109 mutations in 171 families); early-onset disease has less residual activity, distinct from the common polymorphism.",
    "body": [
      "Separates the rare, severe disease from the common polymorphism ([[article:frosst-1995-mthfr-variant]]). When popular sources refer to 'MTHFR' problems, the evidence for [[enzyme:mthfr]] pathology applies to the severe forms in this review."
    ],
    "evidence": "established",
    "authors": [
      "Froese DS",
      "Huemer M",
      "Suormala T",
      "Burda P",
      "Coelho D",
      "Guéant JL",
      "Landolt MA",
      "Kožich V",
      "Fowler B",
      "Baumgartner MR"
    ],
    "year": 2016,
    "journal": "Human mutation",
    "doi": "10.1002/humu.22970",
    "pmid": "26872964",
    "url": "https://doi.org/10.1002/humu.22970",
    "verified": true,
    "takeaways": [
      "Severe MTHFR deficiency causes hyperhomocysteinemia with a spectrum from neonatal lethal to adult onset.",
      "109 mutations in 171 families were catalogued: 70 missense, 17 splicing, 11 nonsense and other changes; most are private to a family.",
      "Patients with early onset (before one year) have lower residual enzyme activity than later-onset patients.",
      "The review also covers animal models, diagnosis, clinical presentation and treatment, giving the severe disorder a baseline different from the common thermolabile variant."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:mthfr",
        "note": "Comprehensive review of severe MTHFR deficiency."
      },
      {
        "rel": "evidence-for",
        "to": "state:hyperhomocysteinemia",
        "note": "Severe deficiency causes marked hyperhomocysteinemia."
      },
      {
        "rel": "evidence-against",
        "to": "state:undermethylation",
        "note": "Severe, rare disease; does not show that the common variant produces undermethylation."
      }
    ]
  },
  {
    "id": "article:hickey-2013-acmg-mthfr",
    "type": "article",
    "name": "ACMG Practice Guideline: lack of evidence for MTHFR polymorphism testing",
    "aliases": [
      "Hickey 2013"
    ],
    "summary": "ACMG practice guideline concluding MTHFR polymorphism testing has minimal clinical utility and should not be part of routine thrombophilia evaluation.",
    "body": [
      "Professional-society pushback on over-reading [[enzyme:mthfr]] genotype. It is directly relevant to claims that common variants imply [[state:undermethylation]] or disease risk."
    ],
    "evidence": "established",
    "authors": [
      "Hickey SE",
      "Curry CJ",
      "Toriello HV"
    ],
    "year": 2013,
    "journal": "Genetics in medicine : official journal of the American College of Medical Genetics",
    "doi": "10.1038/gim.2012.165",
    "pmid": "23288205",
    "url": "https://doi.org/10.1038/gim.2012.165",
    "verified": true,
    "takeaways": [
      "MTHFR polymorphism testing was often ordered to assess thrombophilia on the hypothesis that reduced activity leads to hyperhomocysteinemia and vascular events.",
      "The guideline notes recent meta-analyses do not support an association of hyperhomocysteinemia with coronary heart disease or of MTHFR status with venous thromboembolism.",
      "It concludes testing adds little clinically and should not be ordered routinely.",
      "A 2020 addendum is on record; it is a testing-utility statement, not a statement about folate biochemistry."
    ],
    "facts": {
      "design": "guideline"
    },
    "relations": [
      {
        "rel": "evidence-against",
        "to": "enzyme:mthfr",
        "note": "Common-variant genotyping lacks clinical utility in thrombophilia work-up."
      },
      {
        "rel": "evidence-against",
        "to": "state:hyperhomocysteinemia",
        "note": "Meta-analyses cited do not support hyperhomocysteinemia as a CHD cause."
      }
    ]
  },
  {
    "id": "article:klerk-2002-mthfr-chd",
    "type": "article",
    "name": "MTHFR 677C-->T polymorphism and risk of coronary heart disease: a meta-analysis",
    "aliases": [
      "Klerk 2002"
    ],
    "summary": "Individual-participant meta-analysis of 40 studies: MTHFR 677 TT genotype carried 16% higher odds of coronary disease, larger in Europe and absent in North America where folate status is higher.",
    "body": [
      "The best-known genetic evidence for [[enzyme:mthfr]] and vascular disease. The risk is small and appears when folate is low, in line with homocysteine being folate-dependent in these genotypes ([[state:hyperhomocysteinemia]])."
    ],
    "evidence": "established",
    "authors": [
      "Klerk M",
      "Verhoef P",
      "Clarke R",
      "Blom HJ",
      "Kok FJ",
      "Schouten EG",
      "MTHFR Studies Collaboration Group"
    ],
    "year": 2002,
    "journal": "JAMA",
    "doi": "10.1001/jama.288.16.2023",
    "pmid": "12387655",
    "url": "https://doi.org/10.1001/jama.288.16.2023",
    "verified": true,
    "takeaways": [
      "Forty case-control studies with 11,162 cases and 12,758 controls were pooled.",
      "TT versus CC had OR 1.16 (95% CI 1.05-1.28) for coronary heart disease.",
      "Europe showed OR 1.14 whereas North America showed 0.87, a difference the authors attribute to interaction with folate status.",
      "The effect is modest and context-dependent."
    ],
    "facts": {
      "design": "meta-analysis"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:mthfr",
        "note": "Modest, folate-dependent association of the 677TT variant with CHD."
      },
      {
        "rel": "evidence-for",
        "to": "state:hyperhomocysteinemia",
        "note": "Supports a small causal effect through folate-sensitive homocysteine elevation."
      },
      {
        "rel": "evidence-for",
        "to": "compound:5-mthf",
        "note": "Genotype effect interacts with folate status."
      }
    ]
  },
  {
    "id": "article:homocysteine-studies-collaboration-2002-vascular-risk",
    "type": "article",
    "name": "Homocysteine and risk of ischemic heart disease and stroke: a meta-analysis",
    "aliases": [
      "Homocysteine Studies Collaboration 2002"
    ],
    "summary": "Pooled analysis of 30 studies: a 25% lower usual homocysteine (about 3 umol/L) was associated with 11% lower ischemic heart disease risk and 19% lower stroke risk, at most a modest predictor.",
    "body": [
      "Epidemiological baseline for how much [[outcome:elevated-homocysteine]] matters. It is one reason the ontology treats homocysteine as a weak risk marker rather than a prime target ([[compound:homocysteine]])."
    ],
    "evidence": "established",
    "authors": [
      "Homocysteine Studies Collaboration"
    ],
    "year": 2002,
    "journal": "JAMA",
    "doi": "10.1001/jama.288.16.2015",
    "pmid": "12387654",
    "url": "https://doi.org/10.1001/jama.288.16.2015",
    "verified": true,
    "takeaways": [
      "Thirty prospective or retrospective studies with 5,073 IHD and 1,113 stroke events were meta-analysed with correction for regression dilution.",
      "Retrospective studies showed stronger associations than prospective ones.",
      "After adjustment, 3 umol/L lower homocysteine corresponded to OR 0.89 for IHD and 0.81 for stroke.",
      "The authors conclude elevated homocysteine is at most a modest independent predictor in healthy populations and call for genetic and randomised evidence."
    ],
    "facts": {
      "design": "meta-analysis"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "outcome:elevated-homocysteine",
        "note": "Elevated homocysteine carries a modest association with vascular disease."
      },
      {
        "rel": "evidence-for",
        "to": "compound:homocysteine"
      },
      {
        "rel": "evidence-against",
        "to": "state:hyperhomocysteinemia",
        "note": "Association is modest and may include reverse causation, so mild elevations are not strongly pathogenic by themselves."
      }
    ]
  },
  {
    "id": "article:clarke-2010-homocysteine-lowering-trials",
    "type": "article",
    "name": "Effects of lowering homocysteine levels with B vitamins on cardiovascular disease, cancer, and cause-specific mortality: Meta-analysis of 8 randomized trials involving 37 485 individuals",
    "aliases": [
      "Clarke 2010"
    ],
    "summary": "Meta-analysis of 8 trials (37,485 people): folic acid cut homocysteine ~25% but did not change vascular events, cancer or mortality over about five years.",
    "body": [
      "The strongest randomised evidence that correcting [[state:hyperhomocysteinemia]] with folic acid does not by itself reduce disease, which limits how much weight the ontology gives to [[outcome:elevated-homocysteine]] as a treatment target. It tested folic acid, not [[intervention:methylfolate-supplement|methylfolate]]."
    ],
    "evidence": "established",
    "authors": [
      "Clarke R",
      "Halsey J",
      "Lewington S",
      "Lonn E",
      "Armitage J",
      "Manson JE",
      "Bønaa KH",
      "Spence JD",
      "Nygård O",
      "Jamison R",
      "et al."
    ],
    "year": 2010,
    "journal": "Archives of internal medicine",
    "doi": "10.1001/archinternmed.2010.348",
    "pmid": "20937919",
    "url": "https://doi.org/10.1001/archinternmed.2010.348",
    "verified": true,
    "takeaways": [
      "Individual participant data from 8 large placebo-controlled folic acid trials in people at increased vascular risk.",
      "Folic acid allocation lowered homocysteine by an average 25%.",
      "Rate ratios were 1.01 for major vascular events, 1.03 for coronary events, 0.96 for stroke, with no effect on cancer or all-cause mortality.",
      "Lowering homocysteine this way did not improve outcomes within five years in the populations studied."
    ],
    "facts": {
      "design": "meta-analysis"
    },
    "relations": [
      {
        "rel": "evidence-against",
        "to": "outcome:elevated-homocysteine",
        "note": "Lowering homocysteine with folic acid did not reduce vascular events."
      },
      {
        "rel": "evidence-against",
        "to": "state:hyperhomocysteinemia",
        "note": "No outcome benefit from correcting mild elevations in these trials."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:folate-cycle",
        "note": "Folic acid supplementation reliably lowered homocysteine."
      }
    ]
  },
  {
    "id": "article:prinz-langenohl-2009-methylfolate-vs-folic-acid",
    "type": "article",
    "name": "[6S]-5-methyltetrahydrofolate increases plasma folate more effectively than folic acid in women with the homozygous or wild-type 677C-->T polymorphism of methylenetetrahydrofolate reductase",
    "aliases": [
      "Prinz-Langenohl 2009"
    ],
    "summary": "Randomized crossover in women with MTHFR 677TT or CC: 5-methyl-THF raised plasma folate more effectively than folic acid in both genotypes, and unmetabolized folic acid appeared only after folic acid.",
    "body": [
      "Pharmacokinetic evidence for [[intervention:methylfolate-supplement|methylfolate]] over folic acid. It addresses plasma levels only, not clinical outcomes, and the study is a single-dose crossover in women ([[compound:5-mthf|5-methyl-THF]], [[enzyme:mthfr]])."
    ],
    "evidence": "established",
    "authors": [
      "Prinz-Langenohl R",
      "Brämswig S",
      "Tobolski O",
      "Smulders YM",
      "Smith DE",
      "Finglas PM",
      "Pietrzik K"
    ],
    "year": 2009,
    "journal": "British journal of pharmacology",
    "doi": "10.1111/j.1476-5381.2009.00492.x",
    "pmid": "19917061",
    "url": "https://doi.org/10.1111/j.1476-5381.2009.00492.x",
    "verified": true,
    "takeaways": [
      "Sixteen TT and eight CC women received single oral doses of folic acid (400 ug) and [6S]-5-MTHF (416 ug) in a crossover.",
      "AUC and Cmax were higher, and time to peak shorter, for 5-MTHF than for folic acid in both genotypes.",
      "Plasma folate consisted essentially of 5-MTHF whichever form was given.",
      "Unmetabolized folic acid occurred regularly after folic acid but rarely after 5-MTHF, so genotype did not remove 5-MTHF's advantage."
    ],
    "facts": {
      "design": "RCT",
      "population": "Women, MTHFR 677TT (n=16) and CC (n=8)"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:methylfolate-supplement",
        "note": "Better acute bioavailability than folic acid, regardless of MTHFR 677 genotype."
      },
      {
        "rel": "evidence-for",
        "to": "compound:5-mthf"
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:mthfr",
        "note": "Genotype did not change the pharmacokinetic advantage; this does not show a clinical-outcome advantage."
      }
    ]
  },
  {
    "id": "article:bailey-2009-dhfr-slow-human-liver",
    "type": "article",
    "name": "The extremely slow and variable activity of dihydrofolate reductase in human liver and its implications for high folic acid intake",
    "aliases": [
      "Bailey 2009"
    ],
    "summary": "Human liver reduces synthetic folic acid via DHFR at less than 2% of rat-liver rates and with ~5-fold variation, suggesting saturation at high folic acid intakes.",
    "body": [
      "Mechanistic rationale for using [[intervention:methylfolate-supplement|methylfolate]] rather than synthetic folic acid at high doses. It is six liver samples; it neither demonstrates harm nor the claim that folic acid slows methylation by receptor competition ([[pathway:folate-cycle]])."
    ],
    "evidence": "plausible",
    "authors": [
      "Bailey SW",
      "Ayling JE"
    ],
    "year": 2009,
    "journal": "Proceedings of the National Academy of Sciences of the United States of America",
    "doi": "10.1073/pnas.0902072106",
    "pmid": "19706381",
    "url": "https://doi.org/10.1073/pnas.0902072106",
    "verified": true,
    "takeaways": [
      "Liver samples from six human donors were assayed with a sensitive DHFR assay.",
      "Folic acid reduction per gram of liver was on average under 2% of that in rat liver at physiological pH.",
      "Human samples varied almost five-fold in DHFR activity.",
      "The authors argue the limited conversion could saturate at high folic acid doses, consistent with unmetabolized folic acid seen in plasma and urine."
    ],
    "facts": {
      "design": "in-vitro",
      "population": "Six human liver donors"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:methylfolate-supplement",
        "note": "Provides a rationale for preferring reduced folates over folic acid at high intakes; effect on outcomes not shown."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:folate-cycle",
        "note": "Folic acid needs DHFR activation before entering the cycle."
      }
    ]
  },
  {
    "id": "article:papakostas-2012-methylfolate-depression",
    "type": "article",
    "name": "L-methylfolate as adjunctive therapy for SSRI-resistant major depression: results of two randomized, double-blind, parallel-sequential trials",
    "aliases": [
      "Papakostas 2012"
    ],
    "summary": "Two sequential-parallel trials of adjunctive L-methylfolate in SSRI-resistant depression: no benefit in the first (7.5-15 mg), significant benefit at 15 mg in the second (NNT about 6).",
    "body": [
      "Main randomized test of therapeutic-dose [[intervention:methylfolate-supplement|methylfolate]] in a psychiatric condition. It is mixed (one null trial) and concerns depression adjunct therapy, so it should not be read as support for methylfolate in anxiety or for correcting 'undermethylation'."
    ],
    "evidence": "plausible",
    "authors": [
      "Papakostas GI",
      "Shelton RC",
      "Zajecka JM",
      "Etemad B",
      "Rickels K",
      "Clain A",
      "Baer L",
      "Dalton ED",
      "Sacco GR",
      "Schoenfeld D",
      "et al."
    ],
    "year": 2012,
    "journal": "The American journal of psychiatry",
    "doi": "10.1176/appi.ajp.2012.11071114",
    "pmid": "23212058",
    "url": "https://doi.org/10.1176/appi.ajp.2012.11071114",
    "verified": true,
    "takeaways": [
      "148 patients in trial 1 and 75 in trial 2 with SSRI-resistant major depression received L-methylfolate or placebo adjunct.",
      "Trial 1 (7.5 mg for 30 days then 15 mg) showed no significant difference from placebo.",
      "Trial 2 (15 mg throughout) significantly improved response rate and symptom scores, with NNT about 6.",
      "L-methylfolate was well tolerated; the mixed results mean the evidence is promising but not definitive."
    ],
    "facts": {
      "design": "RCT",
      "population": "SSRI-resistant major depression, n=148 and n=75"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:methylfolate-supplement",
        "note": "15 mg/day adjunct improved response in one of two trials; the other was null."
      },
      {
        "rel": "evidence-for",
        "to": "compound:5-mthf",
        "note": "Therapeutic-dose L-methylfolate (7.5-15 mg) given as an adjunct; depression endpoint, not methylation status."
      }
    ]
  },
  {
    "id": "article:pissios-2017-nnmt-methyl-sink",
    "type": "article",
    "name": "Nicotinamide N-Methyltransferase: More Than a Vitamin B3 Clearance Enzyme",
    "aliases": [
      "Pissios 2017"
    ],
    "summary": "Review of nicotinamide N-methyltransferase: it methylates vitamin B3 using SAM and consumes methyl donors, with roles beyond clearance in adipose, liver and cancer.",
    "body": [
      "Mechanistic backing for the idea that [[compound:niacin]] intake can draw on [[compound:sam]]. The review establishes the enzyme's role, not how much supplemental niacin changes methylation status ([[state:undermethylation]]) in people."
    ],
    "evidence": "plausible",
    "authors": [
      "Pissios P"
    ],
    "year": 2017,
    "journal": "Trends in endocrinology and metabolism: TEM",
    "doi": "10.1016/j.tem.2017.02.004",
    "pmid": "28291578",
    "url": "https://doi.org/10.1016/j.tem.2017.02.004",
    "verified": true,
    "takeaways": [
      "NNMT was first known for methylating nicotinamide, one form of vitamin B3, for excretion.",
      "Newer work links it to metabolic regulation in adipose and liver through consumption of methyl donors and generation of active metabolites.",
      "Because it uses SAM, niacin-handling competes with other methylation reactions.",
      "The review notes large knowledge gaps; human supplementation data on SAM depletion by niacin are not its focus."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:niacin",
        "note": "Nicotinamide is the NNMT substrate; niacin handling consumes SAM methyl groups."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam",
        "note": "NNMT is an SAM-dependent methyltransferase that consumes methyl donors."
      },
      {
        "rel": "evidence-for",
        "to": "state:undermethylation",
        "note": "Mechanistic support for niacin as a methyl-consuming nutrient; no human dose-response shown."
      }
    ]
  },
  {
    "id": "article:da-costa-2006-choline-requirement-snps",
    "type": "article",
    "name": "Common genetic polymorphisms affect the human requirement for the nutrient choline",
    "aliases": [
      "da Costa 2006"
    ],
    "summary": "In 57 people fed a low-choline diet, a PEMT promoter variant (rs12325817 C allele) strongly increased the odds of liver or muscle dysfunction, showing genes shift choline needs.",
    "body": [
      "Shows genetic variation in [[enzyme:pemt]] and [[enzyme:chdh]] changes how much dietary [[compound:choline]] a person needs. It supports a rationale for individualised choline intake, but the tested outcome was organ dysfunction on a deficient diet, not methylation status."
    ],
    "evidence": "established",
    "authors": [
      "da Costa KA",
      "Kozyreva OG",
      "Song J",
      "Galanko JA",
      "Fischer LM",
      "Zeisel SH"
    ],
    "year": 2006,
    "journal": "FASEB journal : official publication of the Federation of American Societies for Experimental Biology",
    "doi": "10.1096/fj.06-5734com",
    "pmid": "16816108",
    "url": "https://doi.org/10.1096/fj.06-5734com",
    "verified": true,
    "takeaways": [
      "Fifty-seven adults ate a low-choline diet until organ dysfunction developed or for up to 42 days; SNPs were tested for association.",
      "18 of 23 carriers (78%) of the PEMT -744 G>C (rs12325817) C allele developed dysfunction (odds ratio 25, P=0.002).",
      "A CHDH coding SNP (rs9001) appeared protective while another (rs12676) increased susceptibility.",
      "A PEMT coding SNP and a BHMT SNP (+742 G>A) were not associated with susceptibility."
    ],
    "facts": {
      "design": "RCT",
      "population": "57 adults on controlled low-choline diet"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:pemt",
        "note": "A common PEMT promoter SNP raises dietary choline requirement."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:chdh",
        "note": "CHDH variants modify susceptibility to choline deficiency."
      },
      {
        "rel": "evidence-for",
        "to": "compound:choline"
      },
      {
        "rel": "evidence-against",
        "to": "enzyme:bhmt",
        "note": "The BHMT +742 SNP tested was not associated with susceptibility."
      }
    ]
  },
  {
    "id": "article:fischer-2007-choline-sex-menopause",
    "type": "article",
    "name": "Sex and menopausal status influence human dietary requirements for the nutrient choline",
    "aliases": [
      "Fischer 2007"
    ],
    "summary": "On a choline-poor diet 77% of men and 80% of postmenopausal women (vs 44% of premenopausal women) developed fatty liver or muscle damage; the 550 mg AI did not protect everyone.",
    "body": [
      "A landmark depletion-repletion trial for [[compound:choline]] requirements, relevant to why choline status is individual and why [[enzyme:pemt]] matters. It tested overt deficiency, not whether extra choline improves methylation or vagal function."
    ],
    "evidence": "established",
    "authors": [
      "Fischer LM",
      "daCosta KA",
      "Kwock L",
      "Stewart PW",
      "Lu TS",
      "Stabler SP",
      "Allen RH",
      "Zeisel SH"
    ],
    "year": 2007,
    "journal": "The American journal of clinical nutrition",
    "doi": "10.1093/ajcn/85.5.1275",
    "pmid": "17490963",
    "url": "https://doi.org/10.1093/ajcn/85.5.1275",
    "verified": true,
    "takeaways": [
      "Subjects ate 550 mg choline per 70 kg for 10 days then under 50 mg for up to 42 days, with or without folic acid.",
      "On depletion, 77% of men, 80% of postmenopausal women and 44% of premenopausal women developed organ dysfunction (fatty liver or muscle damage).",
      "Six men developed signs while still consuming the 550 mg AI, so the AI was not sufficient for everyone.",
      "Folic acid supplementation did not change the response; estrogen-induced de novo choline synthesis probably explains the sex difference."
    ],
    "facts": {
      "design": "RCT",
      "population": "26 men, 16 premenopausal and 15 postmenopausal women"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "Demonstrates a human dietary choline requirement and the variability of need."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:pemt",
        "note": "Estrogen-sensitive PEMT-derived choline appears to buffer pre-menopausal women."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:kennedy-pathway",
        "note": "Choline deficiency impairs phosphatidylcholine synthesis and liver fat handling."
      }
    ]
  },
  {
    "id": "article:fischer-2010-choline-estrogen-pemt",
    "type": "article",
    "name": "Dietary choline requirements of women: effects of estrogen and genetic variation",
    "aliases": [
      "Fischer 2010"
    ],
    "summary": "Dose-response of PEMT rs12325817 alleles (80%, 43%, 13% dysfunction with 2, 1, 0 alleles) in premenopausal women, and estrogen cut dysfunction in postmenopausal women from 73% to 18%.",
    "body": [
      "Quantifies how [[enzyme:pemt]] genotype and estrogen modify the [[compound:choline]] requirement. In the ontology it supports the PEMT leg of choline metabolism without addressing glycine or gastric effects."
    ],
    "evidence": "established",
    "authors": [
      "Fischer LM",
      "da Costa KA",
      "Kwock L",
      "Galanko J",
      "Zeisel SH"
    ],
    "year": 2010,
    "journal": "The American journal of clinical nutrition",
    "doi": "10.3945/ajcn.2010.30064",
    "pmid": "20861172",
    "url": "https://doi.org/10.3945/ajcn.2010.30064",
    "verified": true,
    "takeaways": [
      "Premenopausal women (n=27) ate a very-low-choline diet; dysfunction occurred in 80%, 43% and 13% of those with 2, 1 or 0 copies of the rs12325817 allele.",
      "Postmenopausal women (n=22) were randomised to estrogen or placebo; 73% on placebo and 18% on estrogen developed dysfunction.",
      "Lower estrogen therefore raises dietary choline needs, and the PEMT variant adds to the effect.",
      "Evidence is from a depletion diet, so it defines needs under deficiency conditions."
    ],
    "facts": {
      "design": "RCT",
      "population": "49 women, pre- and postmenopausal"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:pemt",
        "note": "Gene-dose effect of PEMT variant on choline requirement; estrogen induces PEMT."
      },
      {
        "rel": "evidence-for",
        "to": "compound:choline"
      },
      {
        "rel": "evidence-for",
        "to": "pathway:kennedy-pathway",
        "note": "De novo PC synthesis via PEMT relieves dietary choline demand."
      }
    ]
  },
  {
    "id": "article:zeisel-2009-choline-essential-nutrient",
    "type": "article",
    "name": "Choline: an essential nutrient for public health",
    "aliases": [
      "Zeisel & da Costa 2009"
    ],
    "summary": "Review stating choline became an essential nutrient in 1998, requirements vary with common polymorphisms, and mean intakes for many groups fall below the adequate intake.",
    "body": [
      "Public-health framing for [[compound:choline]]. It supports the idea that many people do not reach the IOM adequate intake ([[article:iom-1998-choline-dri]]), which matters for any plan that adds choline rather than limits it."
    ],
    "evidence": "established",
    "authors": [
      "Zeisel SH",
      "da Costa KA"
    ],
    "year": 2009,
    "journal": "Nutrition reviews",
    "doi": "10.1111/j.1753-4887.2009.00246.x",
    "pmid": "19906248",
    "url": "https://doi.org/10.1111/j.1753-4887.2009.00246.x",
    "verified": true,
    "takeaways": [
      "The IOM formally recognised choline as essential in 1998.",
      "Wide variation in requirement can be explained by common genetic polymorphisms.",
      "Eggs and meats are rich sources, up to 430 mg per 100 g in the North American diet.",
      "Mean intakes for older children, men, women and pregnant women were far below the adequate intake level, so the authors urge dietary guidance."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "Authoritative overview of choline as an essential nutrient and the intake gap."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:pemt",
        "note": "Polymorphisms in choline genes explain requirement variation."
      }
    ]
  },
  {
    "id": "article:vance-2014-phospholipid-methylation",
    "type": "article",
    "name": "Phospholipid methylation in mammals: from biochemistry to physiological function",
    "aliases": [
      "Vance 2014"
    ],
    "summary": "Review of PEMT: three SAM-dependent methylations make hepatic phosphatidylcholine, regulated by substrates and the AdoMet:AdoHcy ratio, with lessons from PEMT-null mice.",
    "body": [
      "Reference for the PEMT leg of the methyl budget: [[enzyme:pemt]] converts three [[compound:sam]] methyls into phosphatidylcholine unless dietary choline feeds the [[pathway:kennedy-pathway]]. PEMT also links methyl status to lipid handling."
    ],
    "evidence": "established",
    "authors": [
      "Vance DE"
    ],
    "year": 2014,
    "journal": "Biochimica et biophysica acta",
    "doi": "10.1016/j.bbamem.2013.10.018",
    "pmid": "24184426",
    "url": "https://doi.org/10.1016/j.bbamem.2013.10.018",
    "verified": true,
    "takeaways": [
      "PEMT converts phosphatidylethanolamine to phosphatidylcholine using three SAM methyl groups; only the liver has substantial activity.",
      "Activity depends on substrate concentrations and the AdoMet:AdoHcy ratio, and transcription is increased by estrogen.",
      "PEMT is needed to maintain membrane integrity and to form choline when dietary choline is scarce.",
      "Mice lacking PEMT are protected from diet-induced atherosclerosis, obesity and insulin resistance but are prone to fatty liver and steatohepatitis."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:pemt",
        "note": "Authoritative review of PEMT biochemistry and physiology."
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam",
        "note": "Each phosphatidylcholine molecule made by PEMT consumes three SAM methyl groups."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:kennedy-pathway",
        "note": "CDP-choline pathway is the alternative route to phosphatidylcholine."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:low-sam-sah-ratio",
        "note": "PEMT activity is sensitive to the SAM:SAH ratio."
      }
    ]
  },
  {
    "id": "article:buchman-2001-choline-parenteral-nutrition",
    "type": "article",
    "name": "Choline deficiency causes reversible hepatic abnormalities in patients receiving parenteral nutrition: proof of a human choline requirement: a placebo-controlled trial",
    "aliases": [
      "Buchman 2001"
    ],
    "summary": "Placebo-controlled trial: adding 2 g choline chloride to parenteral nutrition reversed liver fat and lowered ALT and AST, proving a human choline requirement.",
    "body": [
      "Interventional evidence that [[compound:choline]] is a required nutrient, one reason it appears in the ontology's DRI context. The setting (TPN) is far from oral supplementation for belching or methylation."
    ],
    "evidence": "established",
    "authors": [
      "Buchman AL",
      "Ament ME",
      "Sohel M",
      "Dubin M",
      "Jenden DJ",
      "Roch M",
      "Pownall H",
      "Farley W",
      "Awal M",
      "Ahn C"
    ],
    "year": 2001,
    "journal": "JPEN. Journal of parenteral and enteral nutrition",
    "doi": "10.1177/0148607101025005260",
    "pmid": "11531217",
    "url": "https://doi.org/10.1177/0148607101025005260",
    "verified": true,
    "takeaways": [
      "Fifteen long-term TPN patients got usual TPN (n=8) or TPN plus 2 g choline chloride (n=7) for 24 weeks.",
      "Liver CT density improved by week 4 (13.3 vs 5.8 HU) and the liver-spleen differential improved.",
      "ALT fell significantly vs placebo from week 6; AST and alkaline phosphatase also fell.",
      "Steatosis recurred 10 weeks after stopping choline, indicating continued requirement."
    ],
    "facts": {
      "design": "RCT",
      "population": "15 long-term home TPN patients"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "Randomised proof of a choline requirement when intake bypasses the gut."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:pemt",
        "note": "Endogenous PEMT synthesis was insufficient when dietary choline was absent."
      }
    ]
  },
  {
    "id": "article:iom-1998-choline-dri",
    "type": "article",
    "name": "Dietary Reference Intakes for Thiamin, Riboflavin, Niacin, Vitamin B6, Folate, Vitamin B12, Pantothenic Acid, Biotin, and Choline",
    "aliases": [
      "IOM 1998"
    ],
    "summary": "IOM Dietary Reference Intakes set choline AI at 550 mg/day (men) and 425 mg/day (women) and an adult UL of 3.5 g/day based on hypotension, with fishy body odor as secondary effect.",
    "body": [
      "Primary regulatory source for [[compound:choline]] intake limits. Because the UL rests on hypotension and fishy odor ([[disease:trimethylaminuria]] phenotype, from [[compound:trimethylamine]]), it frames any plan to take choline in the tens of grams as far outside studied safety.",
      "It should be read with the EFSA documents ([[article:efsa-2016-choline-dri]], [[article:efsa-2023-choline-liver-claim]]), which set an AI but no UL."
    ],
    "evidence": "established",
    "authors": [
      "Institute of Medicine (US) Standing Committee on the Scientific Evaluation of Dietary Reference Intakes and its Panel on Folate, Other B Vitamins, and Choline"
    ],
    "year": 1998,
    "journal": "National Academies Press (choline chapter)",
    "doi": "10.17226/6015",
    "pmid": "23193625",
    "url": "https://www.nationalacademies.org/read/6015/chapter/14",
    "verified": true,
    "takeaways": [
      "Adequate Intake for adults is 550 mg/day of choline for men and 425 mg/day for women.",
      "The Tolerable Upper Intake Level for adults is 3.5 g/day of choline.",
      "Hypotension was the critical effect; a LOAEL of about 7.5 g/day (from a pilot in seven patients) was divided by an uncertainty factor of 2 because of limited data, and fishy body odor was a secondary consideration.",
      "No NOAEL could be identified."
    ],
    "facts": {
      "design": "guideline"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "Defines the AI (550/425 mg/day) and UL (3.5 g/day) for choline."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:choline-bitartrate",
        "note": "UL of 3.5 g/day caps supplemental dosing; the 14-35 g/day of choline needed to make 10 g glycine by stoichiometry would exceed it four- to ten-fold."
      },
      {
        "rel": "evidence-for",
        "to": "disease:trimethylaminuria",
        "note": "Fishy body odor from excess choline (via trimethylamine) was the secondary UL endpoint."
      },
      {
        "rel": "evidence-for",
        "to": "compound:trimethylamine"
      }
    ]
  },
  {
    "id": "article:efsa-2016-choline-dri",
    "type": "article",
    "name": "Dietary Reference Values for choline",
    "aliases": [
      "EFSA 2016",
      "EFSA NDA Panel 2016"
    ],
    "summary": "EFSA could not derive average requirements for choline, set an adequate intake of 400 mg/day for adults (480 pregnancy, 520 lactation), and derived no tolerable upper intake level.",
    "body": [
      "European counterpart to [[article:iom-1998-choline-dri]]. It is useful for correcting a common misstatement: EFSA does not publish a 3.5 g/day UL for [[compound:choline]], so any quoted UL is the IOM's.",
      "Details here were confirmed from secondary summaries and the later EFSA opinion ([[article:efsa-2023-choline-liver-claim]]) because the publisher page blocked automated access."
    ],
    "evidence": "established",
    "authors": [
      "EFSA Panel on Dietetic Products, Nutrition and Allergies (NDA)"
    ],
    "year": 2016,
    "journal": "EFSA Journal",
    "doi": "10.2903/j.efsa.2016.4484",
    "url": "https://doi.org/10.2903/j.efsa.2016.4484",
    "verified": true,
    "takeaways": [
      "EFSA concluded Average Requirements and Population Reference Intakes cannot be derived for choline and set Adequate Intakes instead.",
      "The adult AI is 400 mg/day, based on mean intakes in healthy EU populations (about 370 mg/day) and a depletion-repletion study in which about 70% of subjects were repleted at roughly 400 mg per 70 kg.",
      "AIs for pregnancy and lactation are 480 and 520 mg/day; children range from 140 mg/day (1-3 years) to 400 mg/day (15-17 years).",
      "EFSA has not set a UL for choline; the 3.5 g/day figure sometimes attributed to EFSA is the US IOM value."
    ],
    "facts": {
      "design": "guideline"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "European AI of 400 mg/day for adults."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:choline-bitartrate",
        "note": "No EU UL exists; the only formal ceiling is the IOM UL of 3.5 g/day."
      }
    ]
  },
  {
    "id": "article:efsa-2023-choline-liver-claim",
    "type": "article",
    "name": "Choline and contribution to normal liver function of the foetus and exclusively breastfed infants: evaluation of a health claim pursuant to Article 14 of Regulation (EC) No 1924/2006",
    "aliases": [
      "EFSA NDA 2023"
    ],
    "summary": "EFSA NDA 2023 opinion found a cause-effect link between maternal choline intake and normal liver function of the fetus and breastfed infant, and restates that EFSA has set no choline UL.",
    "body": [
      "Recent EFSA document that explicitly says no UL has been set by EFSA, which settles the attribution of the 3.5 g/day figure ([[article:iom-1998-choline-dri]]). The health-claim topic itself concerns pregnancy, not supplementation for methylation ([[compound:choline]])."
    ],
    "evidence": "established",
    "authors": [
      "EFSA Panel on Nutrition, Novel Foods and Food allergens (NDA)",
      "Turck D",
      "Bohn T",
      "Castenmiller J",
      "De Henauw S",
      "Hirsch-Ernst KI",
      "Knutsen HK",
      "Maciuk A",
      "Mangelsdorf I",
      "McArdle HJ",
      "et al."
    ],
    "year": 2023,
    "journal": "EFSA journal. European Food Safety Authority",
    "doi": "10.2903/j.efsa.2023.8115",
    "pmid": "37502017",
    "url": "https://doi.org/10.2903/j.efsa.2023.8115",
    "verified": true,
    "takeaways": [
      "Evaluated an Article 14 claim submitted by Procter & Gamble BV on maternal choline in pregnancy and lactation.",
      "The Panel found a cause-and-effect relationship between choline intake in pregnant or lactating women and normal liver function of the fetus and exclusively breastfed infant, relying on depletion-repletion studies in adults and a rat study.",
      "It cites AIs of 480 mg/day in pregnancy and 520 mg/day in lactation.",
      "It states that EFSA has not set a tolerable upper intake level for choline, while the IOM has put forward 3.5 g/day for adults."
    ],
    "facts": {
      "design": "guideline"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "Reaffirms choline's role in liver function and pregnancy AIs."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:choline-bitartrate",
        "note": "States no EFSA UL; IOM figure of 3.5 g/day is the reference ceiling."
      }
    ]
  },
  {
    "id": "article:blusztajn-2017-choline-brain",
    "type": "article",
    "name": "Neuroprotective Actions of Dietary Choline",
    "aliases": [
      "Blusztajn 2017"
    ],
    "summary": "Review of preclinical and human data on dietary choline and brain function, noting choline's roles as a precursor of phosphatidylcholine, acetylcholine and (via betaine) SAM.",
    "body": [
      "Supports the biochemical chain [[compound:choline]] to [[compound:acetylcholine]] and, via [[compound:betaine]], to methyl donation. It is a brain-focused review and provides no evidence that dietary choline changes vagal tone or gastric motility, a link often assumed but not shown."
    ],
    "evidence": "plausible",
    "authors": [
      "Blusztajn JK",
      "Slack BE",
      "Mellott TJ"
    ],
    "year": 2017,
    "journal": "Nutrients",
    "doi": "10.3390/nu9080815",
    "pmid": "28788094",
    "url": "https://doi.org/10.3390/nu9080815",
    "verified": true,
    "takeaways": [
      "Choline is a precursor of membrane phosphatidylcholine, the neurotransmitter acetylcholine, and via betaine of the methyl donor SAM.",
      "High choline intake in pregnancy and early life improves adult cognition in rodent models and is protective in models of Alzheimer disease, epilepsy and fetal alcohol syndrome.",
      "These effects correlate with histone and DNA methylation changes, suggesting an epigenomic mechanism.",
      "Adult dietary choline may also influence cognition through DHA/EPA-containing phosphatidylcholine; effects on gastric or vagal function are not covered."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "Summarises choline's neurochemical and methyl-donor roles."
      },
      {
        "rel": "evidence-for",
        "to": "compound:acetylcholine",
        "note": "Choline is the substrate for acetylcholine; the review addresses brain, not gastric motility."
      },
      {
        "rel": "evidence-for",
        "to": "compound:betaine",
        "note": "Choline reaches SAM via betaine."
      }
    ]
  },
  {
    "id": "article:smolders-2019-choline-bitartrate-absorption",
    "type": "article",
    "name": "Natural Choline from Egg Yolk Phospholipids Is More Efficiently Absorbed Compared with Choline Bitartrate; Outcomes of A Randomized Trial in Healthy Adults",
    "aliases": [
      "Smolders 2019"
    ],
    "summary": "In 18 adults, choline from egg-yolk phospholipid raised plasma choline about four-fold more than the same choline dose from choline bitartrate, with matching betaine and DMG rises.",
    "body": [
      "Pharmacokinetic comparison of [[intervention:choline-bitartrate|choline salts]] with food phospholipids. The lower absorption of bitartrate means more could remain in the gut lumen, but this study did not test that, nor TMA or TMAO outcomes ([[compound:choline]])."
    ],
    "evidence": "plausible",
    "authors": [
      "Smolders L",
      "de Wit NJW",
      "Balvers MGJ",
      "Obeid R",
      "Vissers MMM",
      "Esser D"
    ],
    "year": 2019,
    "journal": "Nutrients",
    "doi": "10.3390/nu11112758",
    "pmid": "31766273",
    "url": "https://doi.org/10.3390/nu11112758",
    "verified": true,
    "takeaways": [
      "Randomized double-blind crossover in 18 participants compared a drink with 3 g phospholipid-bound choline (egg yolk) against 3 g choline as bitartrate.",
      "The plasma choline response (incremental AUC) was about four times higher after the egg-yolk phospholipid drink (p<0.01).",
      "Plasma betaine and dimethylglycine responses were also higher.",
      "Choline form therefore changes the amount that is absorbed and metabolised; downstream effects on gut microbial exposure were not assessed."
    ],
    "facts": {
      "design": "RCT",
      "population": "18 healthy adults, crossover"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:choline-bitartrate",
        "note": "Salts such as bitartrate gave a smaller plasma choline response than phospholipid-bound choline at the same dose."
      },
      {
        "rel": "evidence-for",
        "to": "compound:choline"
      },
      {
        "rel": "evidence-for",
        "to": "compound:betaine",
        "note": "Betaine and DMG tracked the choline response."
      }
    ]
  },
  {
    "id": "article:lee-2021-alpha-gpc-stroke",
    "type": "article",
    "name": "Association of L-α Glycerylphosphorylcholine With Subsequent Stroke Risk After 10 Years",
    "aliases": [
      "Lee 2021"
    ],
    "summary": "Korean registry cohort of 12 million adults: prescription alpha-GPC use was associated with about 43% higher 10-year stroke risk after matching, rising with cumulative use.",
    "body": [
      "Relevant because alpha-GPC is often suggested as a gentler [[compound:choline]] source. This large cohort ties its use to stroke risk, with [[compound:tmao]] as an untested possible mechanism; association does not prove the supplement causes stroke."
    ],
    "evidence": "plausible",
    "authors": [
      "Lee G",
      "Choi S",
      "Chang J",
      "Choi D",
      "Son JS",
      "Kim K",
      "Kim SM",
      "Jeong S",
      "Park SM"
    ],
    "year": 2021,
    "journal": "JAMA network open",
    "doi": "10.1001/jamanetworkopen.2021.36008",
    "pmid": "34817582",
    "url": "https://doi.org/10.1001/jamanetworkopen.2021.36008",
    "verified": true,
    "takeaways": [
      "Population-based retrospective cohort of 12,008,977 people aged 50+; 108,877 had alpha-GPC prescriptions in 2006-2008.",
      "After matching, alpha-GPC users had higher risk of total stroke (aHR 1.43), ischemic (1.34) and hemorrhagic stroke (1.37).",
      "Risk increased with duration of use in a dose-response pattern.",
      "Observational design cannot exclude confounding; the authors framed the work around possible microbiota-derived TMAO but did not measure it."
    ],
    "facts": {
      "design": "cohort",
      "population": "Adults 50+, South Korea, n=12,008,977"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "Association of a choline-donor supplement with later stroke; observational."
      },
      {
        "rel": "evidence-for",
        "to": "compound:tmao",
        "note": "TMAO was the motivating hypothesis but was not measured here."
      }
    ]
  },
  {
    "id": "article:craig-2004-betaine-human-nutrition",
    "type": "article",
    "name": "Betaine in human nutrition",
    "aliases": [
      "Craig 2004"
    ],
    "summary": "Review of betaine as an osmolyte and methyl donor: rich in seafood, wheat bran and spinach, and tied to homocysteine, methionine and fat metabolism.",
    "body": [
      "Overview of [[compound:betaine]] as a dietary methyl donor that feeds [[enzyme:bhmt]] in the [[pathway:methionine-cycle]]. It treats betaine as a nutrient and does not discuss [[intervention:betaine-hcl]] acidification."
    ],
    "evidence": "established",
    "authors": [
      "Craig SA"
    ],
    "year": 2004,
    "journal": "The American journal of clinical nutrition",
    "doi": "10.1093/ajcn/80.3.539",
    "pmid": "15321791",
    "url": "https://doi.org/10.1093/ajcn/80.3.539",
    "verified": true,
    "takeaways": [
      "Betaine is found in seafood (~1%), wheat germ or bran (~1%) and spinach (~0.7%).",
      "It acts as an osmolyte and as a methyl donor in the methionine cycle, mostly in liver and kidney.",
      "Inadequate methyl intake leads to hypomethylation: higher homocysteine, lower SAM, and hepatic steatosis with dyslipidemia.",
      "The author concludes betaine is an important nutrient for chronic disease prevention (a review view; later trials are mixed)."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:betaine",
        "note": "Foundational review of betaine nutrition."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:bhmt",
        "note": "Methyl-donor role runs through BHMT in liver and kidney."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:methionine-cycle"
      },
      {
        "rel": "evidence-for",
        "to": "intervention:betaine-anhydrous",
        "note": "Describes the betaine nutrient, not the HCl salt."
      }
    ]
  },
  {
    "id": "article:olthof-2003-betaine-low-dose-homocysteine",
    "type": "article",
    "name": "Low dose betaine supplementation leads to immediate and long term lowering of plasma homocysteine in healthy men and women",
    "aliases": [
      "Olthof 2003"
    ],
    "summary": "Six-week RCT in 76 healthy adults: betaine at 1.5, 3 and 6 g/day lowered fasting homocysteine by 12%, 15% and 20% and post-methionine-load rises by 23-40%.",
    "body": [
      "Core RCT for [[intervention:betaine-anhydrous]] and [[enzyme:bhmt]] in humans. The effect is on [[compound:homocysteine]], which is a modest risk marker (see [[article:clarke-2010-homocysteine-lowering-trials]]); it does not test methylation status or symptoms."
    ],
    "evidence": "established",
    "authors": [
      "Olthof MR",
      "van Vliet T",
      "Boelsma E",
      "Verhoef P"
    ],
    "year": 2003,
    "journal": "The Journal of nutrition",
    "doi": "10.1093/jn/133.12.4135",
    "pmid": "14652361",
    "url": "https://doi.org/10.1093/jn/133.12.4135",
    "verified": true,
    "takeaways": [
      "Four groups of 19 healthy subjects took three doses of betaine (1.5, 3, 6 g/day) or placebo for 6 weeks.",
      "Fasting homocysteine was 12% (1.5 g), 15% (3 g) and 20% (6 g) lower than placebo.",
      "The rise after a methionine load was 23%, 30% and 40% lower after 6 weeks, with effects visible on day 1.",
      "Even doses in the dietary range lowered homocysteine."
    ],
    "facts": {
      "design": "RCT",
      "population": "Healthy adults, n=76"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:betaine-anhydrous",
        "note": "Dose-dependent homocysteine lowering at 1.5-6 g/day."
      },
      {
        "rel": "evidence-for",
        "to": "compound:homocysteine"
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:bhmt",
        "note": "Effect consistent with betaine-dependent remethylation."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:elevated-homocysteine"
      }
    ]
  },
  {
    "id": "article:olthof-2005-betaine-lipids",
    "type": "article",
    "name": "Effect of homocysteine-lowering nutrients on blood lipids: results from four randomised, placebo-controlled studies in healthy humans",
    "aliases": [
      "Olthof 2005 (lipids)"
    ],
    "summary": "Pooled analysis of four RCTs: betaine 6 g/day for 6 weeks raised LDL cholesterol by 0.36 mmol/L and triglycerides by 0.14 mmol/L in healthy adults.",
    "body": [
      "Tempers enthusiasm for [[intervention:betaine-anhydrous]]: high-dose [[compound:betaine]] raised LDL in healthy adults. It is a safety consideration for any long-term high-dose betaine plan."
    ],
    "evidence": "established",
    "authors": [
      "Olthof MR",
      "van Vliet T",
      "Verhoef P",
      "Zock PL",
      "Katan MB"
    ],
    "year": 2005,
    "journal": "PLoS medicine",
    "doi": "10.1371/journal.pmed.0020135",
    "pmid": "15916468",
    "url": "https://doi.org/10.1371/journal.pmed.0020135",
    "verified": true,
    "takeaways": [
      "Data from four placebo-controlled studies (betaine n=151, folic acid n=75, phosphatidylcholine n=26) were combined.",
      "Betaine 6 g/day raised LDL cholesterol by 0.36 mmol/L and triglycerides by 0.14 mmol/L; lower doses also raised LDL but not significantly.",
      "Phosphatidylcholine (about 2.6 g/day choline) for 2 weeks raised triglycerides slightly but not cholesterol.",
      "Folic acid had no lipid effect; the authors note the lipid rise may offset any cardiovascular benefit of homocysteine lowering."
    ],
    "facts": {
      "design": "RCT",
      "population": "Healthy adults, 4 pooled RCTs"
    },
    "relations": [
      {
        "rel": "evidence-against",
        "to": "intervention:betaine-anhydrous",
        "note": "Adverse lipid effect at 6 g/day (higher LDL and triglycerides)."
      },
      {
        "rel": "evidence-for",
        "to": "compound:betaine",
        "note": "Quantifies a dose-related lipid effect of supplemental betaine."
      },
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "Phosphatidylcholine raised triglycerides slightly at about 2.6 g choline/day."
      }
    ]
  },
  {
    "id": "article:olthof-2005-phosphatidylcholine-homocysteine",
    "type": "article",
    "name": "Choline supplemented as phosphatidylcholine decreases fasting and postmethionine-loading plasma homocysteine concentrations in healthy men",
    "aliases": [
      "Olthof 2005 (PC)"
    ],
    "summary": "Crossover in 26 men with mildly raised homocysteine: phosphatidylcholine providing about 2.6 g choline/day lowered fasting homocysteine 18% and post-load rise 29% over two weeks.",
    "body": [
      "Human evidence that [[compound:choline]] (as phosphatidylcholine) supplies methyl groups through [[pathway:choline-oxidation]] and [[enzyme:bhmt]], lowering [[compound:homocysteine]]. It used about 2.6 g/day choline, within the IOM UL."
    ],
    "evidence": "established",
    "authors": [
      "Olthof MR",
      "Brink EJ",
      "Katan MB",
      "Verhoef P"
    ],
    "year": 2005,
    "journal": "The American journal of clinical nutrition",
    "doi": "10.1093/ajcn.82.1.111",
    "pmid": "16002808",
    "url": "https://doi.org/10.1093/ajcn.82.1.111",
    "verified": true,
    "takeaways": [
      "Twenty-six men ingested phosphatidylcholine (about 2.6 g choline/day) or placebo oil for 2 weeks in random order.",
      "Fasting total homocysteine fell 18% (-3.0 umol/L) relative to placebo.",
      "A single 1.5 g choline dose cut the post-methionine-load rise by 15% and two weeks by 29%.",
      "Choline works through its conversion to betaine, so it is a route to BHMT remethylation."
    ],
    "facts": {
      "design": "RCT",
      "population": "26 healthy men, mildly raised homocysteine"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "High-dose dietary choline lowers homocysteine in men with mild elevation."
      },
      {
        "rel": "evidence-for",
        "to": "compound:homocysteine"
      },
      {
        "rel": "evidence-for",
        "to": "pathway:choline-oxidation",
        "note": "Effect consistent with choline oxidation to betaine feeding BHMT."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:bhmt"
      }
    ]
  },
  {
    "id": "article:atkinson-2008-betaine-acute-effects",
    "type": "article",
    "name": "Dietary and supplementary betaine: acute effects on plasma betaine and homocysteine concentrations under standard and postmethionine load conditions in healthy male subjects",
    "aliases": [
      "Atkinson 2008"
    ],
    "summary": "Eight-man crossover: ~500 mg betaine as supplement or food, or choline, raised plasma betaine and blunted the post-methionine-load homocysteine rise; plasma DMG did not rise.",
    "body": [
      "Short crossover that shows the pharmacokinetics of [[compound:betaine]] and the rapid effect on the post-load [[compound:homocysteine]] rise via [[enzyme:bhmt]]. Eight men, acute outcomes."
    ],
    "evidence": "plausible",
    "authors": [
      "Atkinson W",
      "Elmslie J",
      "Lever M",
      "Chambers ST",
      "George PM"
    ],
    "year": 2008,
    "journal": "The American journal of clinical nutrition",
    "doi": "10.1093/ajcn/87.3.577",
    "pmid": "18326594",
    "url": "https://doi.org/10.1093/ajcn/87.3.577",
    "verified": true,
    "takeaways": [
      "Eight healthy men consumed betaine/choline supplements or meals, or a low-betaine control, under standard conditions or after a methionine load.",
      "Betaine from either a supplement or a meal raised plasma betaine without raising plasma dimethylglycine.",
      "Under standard (non-loaded) conditions, small decreases in plasma homocysteine appeared 6 hours after high-betaine meals.",
      "After methionine loading, dietary betaine, supplemental betaine and choline all attenuated the homocysteine rise at 4 and 6 hours."
    ],
    "facts": {
      "design": "RCT",
      "population": "8 healthy men"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:betaine",
        "note": "Acute plasma betaine response to food and supplement doses."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:bhmt",
        "note": "Betaine and choline attenuated post-load homocysteine."
      },
      {
        "rel": "evidence-for",
        "to": "compound:homocysteine"
      },
      {
        "rel": "evidence-for",
        "to": "pathway:choline-oxidation",
        "note": "Choline behaved like a betaine source."
      }
    ]
  },
  {
    "id": "article:ueland-2005-betaine-modulator",
    "type": "article",
    "name": "Betaine: a key modulator of one-carbon metabolism and homocysteine status",
    "aliases": [
      "Ueland 2005"
    ],
    "summary": "Review: plasma betaine is a stronger determinant of post-methionine-load homocysteine than B6 or folate, especially when folate is low, and supplementation reduces fasting and post-load homocysteine.",
    "body": [
      "Frames [[compound:betaine]] status as part of one-carbon metabolism. The betaine-homocysteine link is strongest when folate is limiting, which tells us when [[enzyme:bhmt]] matters most in the [[pathway:methionine-cycle]]."
    ],
    "evidence": "established",
    "authors": [
      "Ueland PM",
      "Holm PI",
      "Hustad S"
    ],
    "year": 2005,
    "journal": "Clinical chemistry and laboratory medicine",
    "doi": "10.1515/CCLM.2005.187",
    "pmid": "16197300",
    "url": "https://doi.org/10.1515/CCLM.2005.187",
    "verified": true,
    "takeaways": [
      "Plasma betaine is about 30 umol/L (range 9-90) and fairly stable within individuals; choline, DMG, folate and gender are major determinants.",
      "It was already used to lower homocysteine in homocystinuria and reduces fasting and especially post-methionine-load homocysteine in healthy people.",
      "The betaine-homocysteine relationship is most pronounced in people with low folate and is attenuated after B-vitamin supplementation.",
      "In pregnancy betaine declines until week 20 and then predicts homocysteine better than folate."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:betaine",
        "note": "Status and determinants of plasma betaine."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:bhmt"
      },
      {
        "rel": "evidence-for",
        "to": "state:hyperhomocysteinemia",
        "note": "Betaine status matters most when folate is low."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:methionine-cycle"
      }
    ]
  },
  {
    "id": "article:lee-2010-choline-betaine-homocysteine-framingham",
    "type": "article",
    "name": "Are dietary choline and betaine intakes determinants of total homocysteine concentration?",
    "aliases": [
      "Lee 2010"
    ],
    "summary": "Framingham Offspring (n=2,732): higher choline-plus-betaine intake was associated with lower homocysteine, only in low-folate or low-B12 participants and not after folic acid fortification.",
    "body": [
      "Population evidence that [[compound:choline]] and [[compound:betaine]] intake matters for [[compound:homocysteine]] mainly when folate or B12 are low. Associations are cross-sectional, with effect sizes of about 0.5 umol/L."
    ],
    "evidence": "plausible",
    "authors": [
      "Lee JE",
      "Jacques PF",
      "Dougherty L",
      "Selhub J",
      "Giovannucci E",
      "Zeisel SH",
      "Cho E"
    ],
    "year": 2010,
    "journal": "The American journal of clinical nutrition",
    "doi": "10.3945/ajcn.2009.28456",
    "pmid": "20219967",
    "url": "https://doi.org/10.3945/ajcn.2009.28456",
    "verified": true,
    "takeaways": [
      "Food-frequency-based choline and betaine intakes were related to fasting and post-methionine-load homocysteine in 2,732 participants.",
      "Top versus bottom quintile choline-plus-betaine intake associated with lower fasting (9.6 vs 10.1 umol/L) and post-load homocysteine (24.1 vs 25.0).",
      "The inverse association was limited to participants with low plasma folate or vitamin B12.",
      "In the post-fortification period the association disappeared."
    ],
    "facts": {
      "design": "cohort",
      "population": "2,732 Framingham Offspring participants"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:betaine",
        "note": "Dietary choline plus betaine is inversely associated with homocysteine when folate/B12 are low."
      },
      {
        "rel": "evidence-for",
        "to": "compound:choline"
      },
      {
        "rel": "evidence-against",
        "to": "intervention:betaine-anhydrous",
        "note": "Little marginal homocysteine benefit when folate is replete (post-fortification)."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:bhmt",
        "note": "BHMT remethylation appears most relevant under folate or B12 limitation."
      }
    ]
  },
  {
    "id": "article:morris-2017-cbs-deficiency-guidelines",
    "type": "article",
    "name": "Guidelines for the diagnosis and management of cystathionine beta-synthase deficiency",
    "aliases": [
      "Morris 2017"
    ],
    "summary": "Systematic-review-based guidelines for CBS deficiency, a classic indication for betaine: severe patients need a low-methionine diet and/or betaine; keep homocysteine below 100 umol/L.",
    "body": [
      "Shows the evidence-backed use of betaine in a rare disease ([[intervention:betaine-anhydrous]]) and the role of B6 ([[compound:plp]]) in CBS deficiency. Doses for homocystinuria are not a guide for healthy people, and anhydrous betaine is a different product from [[intervention:betaine-hcl]]."
    ],
    "evidence": "established",
    "authors": [
      "Morris AA",
      "Kožich V",
      "Santra S",
      "Andria G",
      "Ben-Omran TI",
      "Chakrapani AB",
      "Crushell E",
      "Henderson MJ",
      "Hochuli M",
      "Huemer M",
      "et al."
    ],
    "year": 2017,
    "journal": "Journal of inherited metabolic disease",
    "doi": "10.1007/s10545-016-9979-0",
    "pmid": "27778219",
    "url": "https://doi.org/10.1007/s10545-016-9979-0",
    "verified": true,
    "takeaways": [
      "CBS deficiency causes accumulation of homocysteine; severe cases present in childhood with lens dislocation, learning difficulty and skeletal changes.",
      "Severely affected patients generally need a low-methionine diet and/or betaine; milder adult cases often respond to pyridoxine.",
      "Complications are unlikely if total homocysteine is below 120 umol/L, but the guideline recommends keeping it below 100 umol/L.",
      "The authors note the quality of the evidence is poor, as is common in rare diseases."
    ],
    "facts": {
      "design": "guideline"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:betaine-anhydrous",
        "note": "Betaine anhydrous is a standard treatment in severe CBS deficiency; evidence quality is low."
      },
      {
        "rel": "evidence-for",
        "to": "compound:homocysteine"
      },
      {
        "rel": "evidence-for",
        "to": "state:hyperhomocysteinemia",
        "note": "Severe hyperhomocysteinemia targets and management."
      },
      {
        "rel": "evidence-for",
        "to": "compound:plp",
        "note": "Pyridoxine (PLP precursor) responsiveness defines mild cases."
      }
    ]
  },
  {
    "id": "article:wang-2011-gut-flora-phosphatidylcholine-cvd",
    "type": "article",
    "name": "Gut flora metabolism of phosphatidylcholine promotes cardiovascular disease",
    "aliases": [
      "Wang 2011"
    ],
    "summary": "Metabolomics linked plasma choline, TMAO and betaine to cardiovascular risk; mouse work showed gut flora convert dietary phosphatidylcholine to TMAO, which promotes atherosclerosis.",
    "body": [
      "Origin of the choline-microbiota-[[compound:tmao]] hypothesis. It is the main reason high [[compound:choline]] supplementation raises cardiovascular questions, though the strongest causal evidence is in mice."
    ],
    "evidence": "plausible",
    "authors": [
      "Wang Z",
      "Klipfell E",
      "Bennett BJ",
      "Koeth R",
      "Levison BS",
      "Dugar B",
      "Feldstein AE",
      "Britt EB",
      "Fu X",
      "Chung YM",
      "et al."
    ],
    "year": 2011,
    "journal": "Nature",
    "doi": "10.1038/nature09922",
    "pmid": "21475195",
    "url": "https://doi.org/10.1038/nature09922",
    "verified": true,
    "takeaways": [
      "Unbiased plasma metabolomics found three phosphatidylcholine metabolites (choline, TMAO, betaine) that predicted cardiovascular disease in an independent clinical cohort.",
      "In mice, dietary choline or TMAO promoted atherosclerosis and upregulated macrophage scavenger receptors.",
      "Germ-free mice and antibiotic suppression of gut flora showed intestinal microbes are required for TMAO production and for choline-enhanced atherosclerosis.",
      "Genetic variation in flavin monooxygenases (the liver TMAO-forming enzymes) segregated with atherosclerosis in hyperlipidaemic mice."
    ],
    "facts": {
      "design": "animal"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:tmao",
        "note": "Links TMAO to atherosclerosis in mice and cardiovascular risk in a human cohort."
      },
      {
        "rel": "evidence-for",
        "to": "compound:trimethylamine",
        "note": "Gut-flora-derived TMA is the precursor oxidised to TMAO."
      },
      {
        "rel": "evidence-for",
        "to": "system:gut-microbiota",
        "note": "Microbiota are required for the choline-to-TMAO step."
      },
      {
        "rel": "evidence-for",
        "to": "compound:choline"
      },
      {
        "rel": "evidence-for",
        "to": "intervention:choline-bitartrate",
        "note": "Mouse diets enriched in choline promoted atherosclerosis; human supplement-dose relevance not tested."
      }
    ]
  },
  {
    "id": "article:tang-2013-phosphatidylcholine-cardiovascular-risk",
    "type": "article",
    "name": "Intestinal microbial metabolism of phosphatidylcholine and cardiovascular risk",
    "aliases": [
      "Tang 2013"
    ],
    "summary": "Human phosphatidylcholine challenge showed TMAO production depends on gut microbes, and higher fasting TMAO predicted major cardiovascular events in 4,007 coronary-angiography patients (HR 2.54).",
    "body": [
      "Human validation of the microbiota-dependent route from dietary [[compound:choline]] (as phosphatidylcholine) to [[compound:tmao]], plus a prospective association with events. It underpins caution about very high choline intake, though TMAO's causal role remains debated ([[article:zeisel-2017-tmao-review]])."
    ],
    "evidence": "established",
    "authors": [
      "Tang WH",
      "Wang Z",
      "Levison BS",
      "Koeth RA",
      "Britt EB",
      "Fu X",
      "Wu Y",
      "Hazen SL"
    ],
    "year": 2013,
    "journal": "The New England journal of medicine",
    "doi": "10.1056/NEJMoa1109400",
    "pmid": "23614584",
    "url": "https://doi.org/10.1056/NEJMoa1109400",
    "verified": true,
    "takeaways": [
      "Healthy volunteers ate two hard-boiled eggs plus deuterium-labelled phosphatidylcholine; TMAO and its labelled form rose over time.",
      "Oral broad-spectrum antibiotics suppressed TMAO production, which returned after antibiotics were stopped.",
      "In 4,007 patients, highest-quartile TMAO predicted 3-year major adverse cardiovascular events (HR 2.54, 95% CI 1.96-3.28).",
      "TMAO remained predictive after adjustment for traditional risk factors; the observational design cannot show causation."
    ],
    "facts": {
      "design": "cohort",
      "population": "4,007 patients undergoing elective coronary angiography"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:tmao",
        "note": "Fasting TMAO predicts major adverse cardiovascular events in a large human cohort."
      },
      {
        "rel": "evidence-for",
        "to": "system:gut-microbiota",
        "note": "Antibiotics abolish phosphatidylcholine-to-TMAO conversion in humans."
      },
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "Dietary phosphatidylcholine (eggs) is a TMAO precursor in humans."
      },
      {
        "rel": "evidence-for",
        "to": "compound:trimethylamine"
      }
    ]
  },
  {
    "id": "article:koeth-2013-carnitine-tmao-atherosclerosis",
    "type": "article",
    "name": "Intestinal microbiota metabolism of L-carnitine, a nutrient in red meat, promotes atherosclerosis",
    "aliases": [
      "Koeth 2013"
    ],
    "summary": "Gut microbes convert L-carnitine from red meat to TMAO; omnivores made more TMAO than vegans and TMAO plus carnitine predicted cardiovascular events, with atherosclerosis shown in mice.",
    "body": [
      "Shows TMAO production is not unique to [[compound:choline]]; carnitine feeds the same microbial route to [[compound:trimethylamine]] and [[compound:tmao]]. Habitual diet changes the microbiota's capacity ([[system:gut-microbiota]])."
    ],
    "evidence": "plausible",
    "authors": [
      "Koeth RA",
      "Wang Z",
      "Levison BS",
      "Buffa JA",
      "Org E",
      "Sheehy BT",
      "Britt EB",
      "Fu X",
      "Wu Y",
      "Li L",
      "et al."
    ],
    "year": 2013,
    "journal": "Nature medicine",
    "doi": "10.1038/nm.3145",
    "pmid": "23563705",
    "url": "https://doi.org/10.1038/nm.3145",
    "verified": true,
    "takeaways": [
      "Dietary L-carnitine produced TMAO via gut microbiota and accelerated atherosclerosis in mice.",
      "After a carnitine dose, omnivorous people produced more TMAO than vegans or vegetarians, and specific fecal bacterial taxa tracked plasma TMAO and diet.",
      "In 2,595 patients, plasma carnitine predicted cardiovascular disease and events only when TMAO was also high.",
      "Dietary TMAO, carnitine or choline reduced reverse cholesterol transport in mice."
    ],
    "facts": {
      "design": "animal"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:tmao",
        "note": "Second dietary precursor (carnitine) pathway to TMAO; shows microbial specificity."
      },
      {
        "rel": "evidence-for",
        "to": "compound:trimethylamine"
      },
      {
        "rel": "evidence-for",
        "to": "system:gut-microbiota",
        "note": "Diet shapes microbial capacity to make TMA/TMAO."
      }
    ]
  },
  {
    "id": "article:craciun-2012-choline-tma-glycyl-radical",
    "type": "article",
    "name": "Microbial conversion of choline to trimethylamine requires a glycyl radical enzyme",
    "aliases": [
      "Craciun & Balskus 2012"
    ],
    "summary": "Identified the bacterial gene cluster (including a glycyl radical enzyme) that cleaves choline to trimethylamine, enabling prediction of choline-utilising microbes.",
    "body": [
      "Identifies how gut microbes make [[compound:trimethylamine]] from [[compound:choline]], which later work connects to [[compound:tmao]] production. It was demonstrated in a sulfate-reducing bacterium and bioinformatics, not in a person ([[system:gut-microbiota]])."
    ],
    "evidence": "plausible",
    "authors": [
      "Craciun S",
      "Balskus EP"
    ],
    "year": 2012,
    "journal": "Proceedings of the National Academy of Sciences of the United States of America",
    "doi": "10.1073/pnas.1215689109",
    "pmid": "23151509",
    "url": "https://doi.org/10.1073/pnas.1215689109",
    "verified": true,
    "takeaways": [
      "Conversion of choline to trimethylamine by anaerobes was known for a century but its genetics were not characterised.",
      "A gene cluster for anaerobic choline degradation was found in a sulfate-reducing bacterium and verified by knockout and heterologous expression in E. coli.",
      "EPR spectroscopy and bioinformatics showed a glycyl radical enzyme performs the C-N bond cleavage, new chemistry for that enzyme family.",
      "Such clusters occur in numerous microbial genomes, including the human microbiota."
    ],
    "facts": {
      "design": "in-vitro"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:trimethylamine",
        "note": "Defines the microbial enzymology of TMA formation from choline."
      },
      {
        "rel": "evidence-for",
        "to": "compound:choline"
      },
      {
        "rel": "evidence-for",
        "to": "system:gut-microbiota",
        "note": "Choline-utilisation clusters are widespread in the human microbiota."
      }
    ]
  },
  {
    "id": "article:zeisel-2017-tmao-review",
    "type": "article",
    "name": "Trimethylamine N-Oxide, the Microbiome, and Heart and Kidney Disease",
    "aliases": [
      "Zeisel & Warrier 2017"
    ],
    "summary": "Review of TMAO: microbes make TMA from carnitine and choline, liver FMOs oxidise it, and TMAO correlates with cardiovascular events, but cause versus effect is still debated.",
    "body": [
      "Balanced review of [[compound:tmao]] by a leading choline researcher. It supports the ontology's cautious stance: TMAO is a biomarker of risk, and the question of whether lowering it protects is open ([[compound:trimethylamine]], [[system:gut-microbiota]])."
    ],
    "evidence": "plausible",
    "authors": [
      "Zeisel SH",
      "Warrier M"
    ],
    "year": 2017,
    "journal": "Annual review of nutrition",
    "doi": "10.1146/annurev-nutr-071816-064732",
    "pmid": "28715991",
    "url": "https://doi.org/10.1146/annurev-nutr-071816-064732",
    "verified": true,
    "takeaways": [
      "Gut bacteria produce trimethylamine from carnitine, choline or choline-containing compounds.",
      "Most TMA is absorbed passively into the portal circulation and efficiently oxidised to TMAO by hepatic flavin-dependent monooxygenases.",
      "Observational and experimental studies link higher plasma TMAO with myocardial infarction, stroke and death.",
      "A validated mechanistic link remains lacking; it is debated whether raised TMAO is a cause or a consequence of disease."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:tmao",
        "note": "Concise map of TMAO sources, metabolism and disease associations."
      },
      {
        "rel": "evidence-for",
        "to": "compound:trimethylamine"
      },
      {
        "rel": "evidence-for",
        "to": "system:gut-microbiota"
      },
      {
        "rel": "evidence-against",
        "to": "compound:tmao",
        "note": "Causal role in cardiovascular disease not yet validated."
      }
    ]
  },
  {
    "id": "article:miller-2014-egg-tmao",
    "type": "article",
    "name": "Effect of egg ingestion on trimethylamine-N-oxide production in humans: a randomized, controlled, dose-response study",
    "aliases": [
      "Miller 2014"
    ],
    "summary": "Six volunteers eating 0-6 egg yolks: two or more eggs raised plasma and urinary TMAO, about 14% of egg choline became TMAO, with wide inter-individual variation and no change in hsCRP or oxidised LDL.",
    "body": [
      "Quantifies how much [[compound:choline]] from food is converted to [[compound:tmao]] and shows acute inflammatory/oxidation markers did not change. Six participants only, so it constrains mechanisms more than risk ([[system:gut-microbiota]])."
    ],
    "evidence": "plausible",
    "authors": [
      "Miller CA",
      "Corbin KD",
      "da Costa KA",
      "Zhang S",
      "Zhao X",
      "Galanko JA",
      "Blevins T",
      "Bennett BJ",
      "O'Connor A",
      "Zeisel SH"
    ],
    "year": 2014,
    "journal": "The American journal of clinical nutrition",
    "doi": "10.3945/ajcn.114.087692",
    "pmid": "24944063",
    "url": "https://doi.org/10.3945/ajcn.114.087692",
    "verified": true,
    "takeaways": [
      "In a double-blind dose-response, six volunteers received 0, 1, 2, 4 or 6 egg yolks with other intake controlled.",
      "Plasma and 24-hour urinary TMAO rose with eggs (about 14% of egg choline converted to TMAO).",
      "There was considerable between-person variability, likely microbiota-related.",
      "Neither hs-CRP nor oxidised LDL changed after the doses."
    ],
    "facts": {
      "design": "RCT",
      "population": "6 healthy volunteers"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:tmao",
        "note": "Dietary choline from eggs is converted to TMAO in humans."
      },
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "Roughly 14% of dietary choline in eggs ended up as TMAO."
      },
      {
        "rel": "evidence-for",
        "to": "system:gut-microbiota",
        "note": "Large inter-individual differences suggest microbial influence."
      }
    ]
  },
  {
    "id": "article:heianza-2017-tmao-mace-meta-analysis",
    "type": "article",
    "name": "Gut Microbiota Metabolites and Risk of Major Adverse Cardiovascular Disease Events and Death: A Systematic Review and Meta-Analysis of Prospective Studies",
    "aliases": [
      "Heianza 2017"
    ],
    "summary": "Meta-analysis of 19 prospective studies (n=19,256): high TMAO was associated with relative risk 1.62 for major cardiovascular events and 1.63 for death; its precursors carried RR about 1.3-1.4.",
    "body": [
      "Quantitative support for [[compound:tmao]] as a risk marker. Associations with blood [[compound:choline]] and [[compound:betaine]] reflect circulating levels in cardiac cohorts, so they do not map directly onto supplement intake."
    ],
    "evidence": "established",
    "authors": [
      "Heianza Y",
      "Ma W",
      "Manson JE",
      "Rexrode KM",
      "Qi L"
    ],
    "year": 2017,
    "journal": "Journal of the American Heart Association",
    "doi": "10.1161/JAHA.116.004947",
    "pmid": "28663251",
    "url": "https://doi.org/10.1161/JAHA.116.004947",
    "verified": true,
    "takeaways": [
      "Nineteen prospective studies with 3,315 incident cases were pooled.",
      "Elevated TMAO had pooled RR 1.62 (1.45-1.80) for major adverse cardiovascular events and 1.63 for all-cause mortality.",
      "Elevated carnitine, choline or betaine concentrations carried roughly 1.3-1.4 times higher MACE risk.",
      "Associations were independent of traditional risk factors, but these are observational data."
    ],
    "facts": {
      "design": "meta-analysis",
      "population": "19 prospective studies, n=19,256"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:tmao",
        "note": "Pooled prospective association between TMAO and cardiovascular outcomes."
      },
      {
        "rel": "evidence-for",
        "to": "compound:choline",
        "note": "High blood choline also associated with higher MACE risk."
      },
      {
        "rel": "evidence-for",
        "to": "compound:betaine",
        "note": "Blood betaine similarly associated; blood level is not the same as intake."
      }
    ]
  },
  {
    "id": "article:mackay-2011-trimethylaminuria",
    "type": "article",
    "name": "Trimethylaminuria: causes and diagnosis of a socially distressing condition",
    "aliases": [
      "Mackay 2011"
    ],
    "summary": "Review of trimethylaminuria: inherited or secondary failure to oxidise gut-derived TMA to TMAO, diagnosed by urine TMA/TMAO after a fish meal and treated with diet, antibiotics or charcoal.",
    "body": [
      "Describes the fish-odor condition ([[disease:trimethylaminuria]]) that high-dose [[compound:choline]] can unmask by overloading oxidation of [[compound:trimethylamine]]. It is a clinical reference for the TMA end of the choline pathway."
    ],
    "evidence": "established",
    "authors": [
      "Mackay RJ",
      "McEntyre CJ",
      "Henderson C",
      "Lever M",
      "George PM"
    ],
    "year": 2011,
    "journal": "The Clinical biochemist. Reviews",
    "pmid": "21451776",
    "url": "https://pubmed.ncbi.nlm.nih.gov/21451776/",
    "verified": true,
    "takeaways": [
      "TMA is formed by gut bacteria from TMAO and choline; in primary trimethylaminuria the liver fails to convert it to non-odorous TMAO.",
      "Secondary causes exist, sometimes with genetic variants, and can cause fish-like odor in urine, sweat and breath.",
      "Diagnosis needs TMA and TMAO measured in urine, ideally after a high-substrate meal such as marine fish in mild or intermittent cases.",
      "Symptoms improve with dietary avoidance of precursors, antibiotics to control gut bacteria, or activated charcoal."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:trimethylaminuria",
        "note": "Clinical review of cause, diagnosis and management."
      },
      {
        "rel": "evidence-for",
        "to": "compound:trimethylamine"
      },
      {
        "rel": "evidence-for",
        "to": "compound:tmao"
      },
      {
        "rel": "evidence-for",
        "to": "system:gut-microbiota",
        "note": "Bacterial TMA production is the first step; antibiotics reduce symptoms."
      }
    ]
  },
  {
    "id": "article:erlander-1991-two-gad-genes",
    "type": "article",
    "name": "Two genes encode distinct glutamate decarboxylases",
    "aliases": [
      "Erlander 1991"
    ],
    "summary": "Review establishing that two genes encode glutamate decarboxylase (GAD65 and GAD67), which differ in cellular location and in their interaction with the cofactor pyridoxal phosphate.",
    "body": [
      "Classic description of [[enzyme:gad]] isoforms. Both make [[compound:gaba]] and need [[compound:plp]], which is the biochemical basis for the idea that B6 status could limit GABA synthesis."
    ],
    "evidence": "established",
    "authors": [
      "Erlander MG",
      "Tillakaratne NJ",
      "Feldblum S",
      "Patel N",
      "Tobin AJ"
    ],
    "year": 1991,
    "journal": "Neuron",
    "doi": "10.1016/0896-6273(91)90077-d",
    "pmid": "2069816",
    "url": "https://doi.org/10.1016/0896-6273(91)90077-d",
    "verified": true,
    "takeaways": [
      "GABA is the major inhibitory neurotransmitter and is made from glutamate by GAD.",
      "Two forms, GAD65 and GAD67, come from separate genes and differ in size, sequence, antigenicity and subcellular location.",
      "They also differ in how they interact with the cofactor PLP.",
      "The same distinctions matter for the autoimmune response to GAD in type 1 diabetes."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:gad",
        "note": "Defines GAD65/GAD67 as distinct PLP-dependent enzymes."
      },
      {
        "rel": "evidence-for",
        "to": "compound:gaba"
      },
      {
        "rel": "evidence-for",
        "to": "compound:plp",
        "note": "PLP is the GAD cofactor; isoforms differ in cofactor interaction."
      }
    ]
  },
  {
    "id": "article:battaglioli-2003-gad-isoform-kinetics",
    "type": "article",
    "name": "Kinetic differences between the isoforms of glutamate decarboxylase: implications for the regulation of GABA synthesis",
    "aliases": [
      "Battaglioli 2003"
    ],
    "summary": "Kinetics showing GAD65 is mostly PLP-free apoenzyme (about 93%) in cells whereas GAD67 is mostly holoenzyme (about 72%), so cofactor cycling controls GAD65 activity.",
    "body": [
      "Biochemical basis for linking [[compound:plp]] supply to [[compound:gaba]] synthesis through [[enzyme:gad]]. It is an in vitro kinetic study; it does not show that [[intervention:p5p-supplement|P5P]] increases GABA in people."
    ],
    "evidence": "plausible",
    "authors": [
      "Battaglioli G",
      "Liu H",
      "Martin DL"
    ],
    "year": 2003,
    "journal": "Journal of neurochemistry",
    "doi": "10.1046/j.1471-4159.2003.01910.x",
    "pmid": "12887686",
    "url": "https://doi.org/10.1046/j.1471-4159.2003.01910.x",
    "verified": true,
    "takeaways": [
      "GAD activity is regulated by a cycle of PLP binding and release; holoGAD makes GABA but a side-transamination reaction slowly produces inactive apoGAD.",
      "In cells GAD65 is ~93% apoenzyme while GAD67 is ~72% holoenzyme.",
      "Glutamate-dependent conversion of holoGAD65 to apoGAD is about 15 times faster than for GAD67; ATP slows GAD65 activation and inorganic phosphate opposes ATP.",
      "The apo/holo cycle is therefore more important for regulating GAD65 than GAD67."
    ],
    "facts": {
      "design": "in-vitro"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:gad",
        "note": "Explains why GAD65 is cofactor-limited in cells."
      },
      {
        "rel": "evidence-for",
        "to": "compound:plp",
        "note": "Cofactor availability and cycling set GAD65 output."
      },
      {
        "rel": "evidence-for",
        "to": "compound:gaba"
      },
      {
        "rel": "evidence-for",
        "to": "intervention:p5p-supplement",
        "note": "Mechanistic rationale: an apoGAD65 reserve could respond to PLP; in vitro, no supplementation test."
      }
    ]
  },
  {
    "id": "article:field-2022-b6-anxiety",
    "type": "article",
    "name": "High-dose Vitamin B6 supplementation reduces anxiety and strengthens visual surround suppression",
    "aliases": [
      "Field 2022"
    ],
    "summary": "Double-blind trial: 100 mg/day pyridoxine hydrochloride for a month reduced self-reported anxiety (within-group) and increased visual surround suppression, a putative GABAergic index; exploratory.",
    "body": [
      "Often cited for B6 and anxiety. It supports high-dose B6 repletion generally, with plain pyridoxine, and does not support the claim that [[intervention:p5p-supplement|P5P]] is superior or that [[state:b6-functional-deficiency]] was present. The dose is far above safety limits ([[article:efsa-2023-b6-ul]])."
    ],
    "evidence": "plausible",
    "authors": [
      "Field DT",
      "Cracknell RO",
      "Eastwood JR",
      "Scarfe P",
      "Williams CM",
      "Zheng Y",
      "Tavassoli T"
    ],
    "year": 2022,
    "journal": "Human psychopharmacology",
    "doi": "10.1002/hup.2852",
    "pmid": "35851507",
    "url": "https://doi.org/10.1002/hup.2852",
    "verified": true,
    "takeaways": [
      "478 young adults across five linked phases took a high-dose B6 or B12 tablet or placebo for about a month.",
      "The B6 form was pyridoxine hydrochloride, not pyridoxal-5-phosphate, at 100 mg/day (about 8 times the EFSA UL).",
      "B6 reduced self-reported anxiety (with a trend for depression) and strengthened visual surround suppression, consistent with greater inhibition.",
      "In the main anxiety analysis the group-by-time interaction was not significant, serum B6 was not measured, and there was no multiple-comparison correction, so the result is suggestive."
    ],
    "facts": {
      "design": "RCT",
      "population": "478 healthy young adults"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:gaba",
        "note": "Behavioural/visual marker consistent with increased GABAergic inhibition after B6; no direct GABA measure."
      },
      {
        "rel": "evidence-for",
        "to": "disease:anxiety-disorder",
        "note": "Reduced self-reported anxiety in healthy young adults; not a clinical anxiety-disorder trial."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:p5p-supplement",
        "note": "B6 supplementation helped, but the form used was pyridoxine, so P5P superiority is untested."
      }
    ]
  },
  {
    "id": "article:efsa-2023-b6-ul",
    "type": "article",
    "name": "Scientific opinion on the tolerable upper intake level for vitamin B6",
    "aliases": [
      "EFSA 2023 (B6 UL)"
    ],
    "summary": "EFSA set the adult upper intake level for vitamin B6 at 12 mg/day, based on peripheral neuropathy risk, with intakes above it from supplements a concern.",
    "body": [
      "Safety ceiling for B6 supplements, relevant to [[intervention:p5p-supplement|P5P]] dosing. It is a regulatory UL for total vitamin B6, so doses used in some trials ([[article:field-2022-b6-anxiety]]) exceed it."
    ],
    "evidence": "established",
    "authors": [
      "EFSA Panel on Nutrition, Novel Foods and Food Allergens (NDA)",
      "Turck D",
      "Bohn T",
      "Castenmiller J",
      "de Henauw S",
      "Hirsch-Ernst KI",
      "Knutsen HK",
      "Maciuk A",
      "Mangelsdorf I",
      "McArdle HJ",
      "et al."
    ],
    "year": 2023,
    "journal": "EFSA journal. European Food Safety Authority",
    "doi": "10.2903/j.efsa.2023.8006",
    "pmid": "37207271",
    "url": "https://doi.org/10.2903/j.efsa.2023.8006",
    "verified": true,
    "takeaways": [
      "The relationship between excess vitamin B6 and peripheral neuropathy is well established and is the critical effect.",
      "A reference point of 50 mg/day came from a case-control study, supported by case reports; an uncertainty factor of 4 gives 12.5 mg/day.",
      "Dog data (LOAEL 50 mg/kg/day, factor 300) gave 11.7 mg/day; the Panel set 12 mg/day for adults including pregnancy and lactation.",
      "EU populations are unlikely to exceed it except regular users of high-dose B6 supplements."
    ],
    "facts": {
      "design": "guideline"
    },
    "relations": [
      {
        "rel": "evidence-against",
        "to": "intervention:p5p-supplement",
        "note": "UL of 12 mg/day for adults; high-dose B6 supplements risk neuropathy."
      },
      {
        "rel": "evidence-for",
        "to": "compound:plp",
        "note": "Defines safe upper limits for vitamin B6 intake from supplements."
      }
    ]
  },
  {
    "id": "article:schaumburg-1983-pyridoxine-neuropathy",
    "type": "article",
    "name": "Sensory neuropathy from pyridoxine abuse. A new megavitamin syndrome",
    "aliases": [
      "Schaumburg 1983"
    ],
    "summary": "Seven adults taking high-dose pyridoxine developed ataxia and sensory neuropathy or neuronopathy that improved after withdrawal, the first description of megadose B6 toxicity.",
    "body": [
      "Founding case series for B6 toxicity. It involved pyridoxine; whether [[intervention:p5p-supplement|P5P]] carries the same risk is not established by this report, but total [[compound:plp]]/B6 exposure matters."
    ],
    "evidence": "established",
    "authors": [
      "Schaumburg H",
      "Kaplan J",
      "Windebank A",
      "Vick N",
      "Rasmus S",
      "Pleasure D",
      "Brown MJ"
    ],
    "year": 1983,
    "journal": "The New England journal of medicine",
    "doi": "10.1056/NEJM198308253090801",
    "pmid": "6308447",
    "url": "https://doi.org/10.1056/NEJM198308253090801",
    "verified": true,
    "takeaways": [
      "Seven adults developed ataxia and severe sensory-nervous-system dysfunction after daily high-level pyridoxine intake.",
      "Four were severely disabled; all improved after stopping.",
      "Weakness was not a feature and the central nervous system was clinically spared.",
      "The authors called for safe guidelines for this widely abused vitamin."
    ],
    "facts": {
      "design": "case series"
    },
    "relations": [
      {
        "rel": "evidence-against",
        "to": "intervention:p5p-supplement",
        "note": "Documents sensory neuropathy from megadose B6; applies to pyridoxine, with P5P likely similar but not tested here."
      },
      {
        "rel": "evidence-for",
        "to": "compound:plp"
      }
    ]
  },
  {
    "id": "article:ueland-2015-b6-biomarkers",
    "type": "article",
    "name": "Direct and Functional Biomarkers of Vitamin B6 Status",
    "aliases": [
      "Ueland 2015"
    ],
    "summary": "Review of vitamin B6 status biomarkers: plasma PLP is confounded by inflammation and other factors, so functional markers (cystathionine, glycine/serine, kynurenines) improve assessment.",
    "body": [
      "Gives the lab definition behind [[state:b6-functional-deficiency]]: plasma [[compound:plp]] alone can mislead, and glycine/serine markers reflect [[enzyme:glycine-cleavage-system|GCS]] and SHMT dependence on B6."
    ],
    "evidence": "established",
    "authors": [
      "Ueland PM",
      "Ulvik A",
      "Rios-Avila L",
      "Midttun Ø",
      "Gregory JF"
    ],
    "year": 2015,
    "journal": "Annual review of nutrition",
    "doi": "10.1146/annurev-nutr-071714-034330",
    "pmid": "25974692",
    "url": "https://doi.org/10.1146/annurev-nutr-071714-034330",
    "verified": true,
    "takeaways": [
      "Direct markers measure B6 vitamers (plasma PLP most common); functional markers measure PLP-dependent reactions.",
      "Functional markers include the kynurenine pathway, one-carbon metabolism, transsulfuration (cystathionine) and glycine decarboxylation (serine and glycine).",
      "Inflammation, alkaline phosphatase, low albumin, kidney function and inorganic phosphate can distort plasma PLP.",
      "Combining several markers, including substrate-product ratios such as the PAr index, gives the best status estimate."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "state:b6-functional-deficiency",
        "note": "Defines how functional B6 status is measured beyond plasma PLP."
      },
      {
        "rel": "evidence-for",
        "to": "compound:plp"
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:glycine-cleavage-system",
        "note": "Glycine and serine levels are used as functional markers of PLP-dependent glycine cleavage."
      }
    ]
  },
  {
    "id": "article:maintz-2007-histamine-intolerance",
    "type": "article",
    "name": "Histamine and histamine intolerance",
    "aliases": [
      "Maintz & Novak 2007"
    ],
    "summary": "Review defining histamine intolerance as an imbalance between histamine load and degradation, with DAO handling dietary histamine and intracellular HNMT acting only inside cells.",
    "body": [
      "Key reference for [[disease:histamine-intolerance]] and for the division of labour between [[enzyme:dao]] (extracellular and dietary) and [[enzyme:hnmt]] (intracellular, SAM-dependent). It does not link histamine intolerance to methylation status."
    ],
    "evidence": "established",
    "authors": [
      "Maintz L",
      "Novak N"
    ],
    "year": 2007,
    "journal": "The American journal of clinical nutrition",
    "doi": "10.1093/ajcn/85.5.1185",
    "pmid": "17490952",
    "url": "https://doi.org/10.1093/ajcn/85.5.1185",
    "verified": true,
    "takeaways": [
      "Histamine intolerance arises when accumulated histamine exceeds degradation capacity.",
      "Diamine oxidase is the main enzyme for ingested histamine and may scavenge extracellular histamine; HNMT is cytosolic and can only inactivate histamine inside cells.",
      "Symptoms mimic allergy: diarrhea, headache, rhinitis, asthma, hypotension, arrhythmia, urticaria, flushing.",
      "Symptoms may respond to a histamine-free diet or antihistamines, but the authors say double-blind placebo-controlled provocations are still needed."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:histamine-intolerance",
        "note": "Seminal definition and mechanism."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:dao",
        "note": "DAO is the main enzyme for ingested histamine."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:hnmt",
        "note": "HNMT is intracellular; its role is complementary to DAO."
      },
      {
        "rel": "evidence-for",
        "to": "compound:histamine"
      },
      {
        "rel": "evidence-for",
        "to": "pathway:histamine-degradation"
      }
    ]
  },
  {
    "id": "article:comas-baste-2020-histamine-intolerance",
    "type": "article",
    "name": "Histamine Intolerance: The Current State of the Art",
    "aliases": [
      "Comas-Basté 2020"
    ],
    "summary": "Updated review of histamine intolerance etiology, diagnosis and treatment, concluding more evidence is needed to define, diagnose and manage the condition.",
    "body": [
      "Recent review of [[disease:histamine-intolerance]] that stresses evidence gaps. It centres on [[enzyme:dao]]; methylation-dependent clearance through HNMT is not its focus."
    ],
    "evidence": "established",
    "authors": [
      "Comas-Basté O",
      "Sánchez-Pérez S",
      "Veciana-Nogués MT",
      "Latorre-Moratalla M",
      "Vidal-Carou MDC"
    ],
    "year": 2020,
    "journal": "Biomolecules",
    "doi": "10.3390/biom10081181",
    "pmid": "32824107",
    "url": "https://doi.org/10.3390/biom10081181",
    "verified": true,
    "takeaways": [
      "Histamine intolerance is described as impaired ability to metabolise ingested histamine.",
      "The review focuses on etiology and the existing diagnostic and treatment strategies.",
      "It also covers histamine intoxication outbreaks, which may be better explained by individual susceptibility.",
      "The authors conclude that more scientific evidence is still required to define, diagnose and manage it."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:histamine-intolerance",
        "note": "Current-state review; explicitly flags low evidence for diagnosis and management."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:dao"
      },
      {
        "rel": "evidence-for",
        "to": "compound:histamine"
      }
    ]
  },
  {
    "id": "article:schnedl-2021-histamine-intolerance-gut",
    "type": "article",
    "name": "Histamine Intolerance Originates in the Gut",
    "aliases": [
      "Schnedl & Enko 2021"
    ],
    "summary": "Review arguing histamine intolerance is primarily gastrointestinal and DAO-related; serum DAO does not reliably reflect gut DAO, and diet or DAO capsules help.",
    "body": [
      "Supports a gut-centred model of [[disease:histamine-intolerance]] driven by [[enzyme:dao]] rather than HNMT/SAM. It overlaps with functional GI complaints, which makes nonspecific symptoms hard to attribute."
    ],
    "evidence": "plausible",
    "authors": [
      "Schnedl WJ",
      "Enko D"
    ],
    "year": 2021,
    "journal": "Nutrients",
    "doi": "10.3390/nu13041262",
    "pmid": "33921522",
    "url": "https://doi.org/10.3390/nu13041262",
    "verified": true,
    "takeaways": [
      "Histamine intolerance is assumed to stem from gastrointestinal DAO deficiency, with mucosal disease and some drugs reducing DAO activity.",
      "It causes variable, nonspecific functional GI and extra-intestinal complaints and is rarely considered in unexplained functional GI disorders.",
      "Serum DAO has not been shown to correlate with gut DAO, although a low serum value may support the diagnosis alongside a standardised history.",
      "A histamine-reduced diet and/or oral DAO capsules are described as helpful."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:histamine-intolerance",
        "note": "Gut-origin model with diet and DAO supplementation as treatment."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:dao",
        "note": "DAO deficiency is the proposed mechanism; serum DAO has limited validity."
      },
      {
        "rel": "evidence-for",
        "to": "compound:histamine"
      }
    ]
  },
  {
    "id": "article:izquierdo-casas-2019-dao-migraine",
    "type": "article",
    "name": "Diamine oxidase (DAO) supplement reduces headache in episodic migraine patients with DAO deficiency: A randomized double-blind trial",
    "aliases": [
      "Izquierdo-Casas 2019"
    ],
    "summary": "RCT in 100 migraine patients with low DAO: one month of oral DAO shortened migraine attacks by 1.4 hours, but placebo also improved and the between-group difference was not significant.",
    "body": [
      "Tests the DAO-deficiency hypothesis by supplementing [[enzyme:dao]]. Results are a trend, so it supports but does not confirm [[disease:histamine-intolerance]] as a driver of migraine."
    ],
    "evidence": "plausible",
    "authors": [
      "Izquierdo-Casas J",
      "Comas-Basté O",
      "Latorre-Moratalla ML",
      "Lorente-Gascón M",
      "Duelo A",
      "Soler-Singla L",
      "Vidal-Carou MC"
    ],
    "year": 2019,
    "journal": "Clinical nutrition (Edinburgh, Scotland)",
    "doi": "10.1016/j.clnu.2018.01.013",
    "pmid": "29475774",
    "url": "https://doi.org/10.1016/j.clnu.2018.01.013",
    "verified": true,
    "takeaways": [
      "One hundred episodic-migraine patients with DAO deficiency (<80 HDU/ml) took a DAO enzyme supplement or placebo for one month.",
      "Pain duration fell from 6.14 to 4.76 hours with DAO (p=0.0217); placebo fell from 7.53 to 6.68 hours (not significant).",
      "Number of attacks and pain intensity decreased similarly in both groups.",
      "The authors describe a positive trend and call for longer studies; no adverse effects occurred."
    ],
    "facts": {
      "design": "RCT",
      "population": "100 patients with episodic migraine and DAO deficiency"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:histamine-intolerance",
        "note": "Suggestive benefit of exogenous DAO in migraine with low DAO; between-group effect not significant."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:dao",
        "note": "Exogenous DAO trial; supports a role but is underpowered."
      }
    ]
  },
  {
    "id": "article:yoshikawa-2019-hnmt-brain",
    "type": "article",
    "name": "Histamine N-Methyltransferase in the Brain",
    "aliases": [
      "Yoshikawa 2019"
    ],
    "summary": "Review: Hnmt-knockout mice show HNMT is the essential brain histamine-clearing enzyme (brain histamine rises), and human HNMT variants are linked to Parkinson disease and ADHD.",
    "body": [
      "Establishes [[enzyme:hnmt]] as the brain's route for [[compound:histamine]] clearance. It is silent on whether [[compound:sam]] supply (methylation status) is limiting for HNMT in people."
    ],
    "evidence": "plausible",
    "authors": [
      "Yoshikawa T",
      "Nakamura T",
      "Yanai K"
    ],
    "year": 2019,
    "journal": "International journal of molecular sciences",
    "doi": "10.3390/ijms20030737",
    "pmid": "30744146",
    "url": "https://doi.org/10.3390/ijms20030737",
    "verified": true,
    "takeaways": [
      "Brain histamine is a neurotransmitter; HNMT is the histamine-metabolising enzyme expressed in the brain.",
      "Hnmt disruption in mice caused a robust increase in brain histamine concentration.",
      "Human HNMT SNPs are associated with several brain disorders, including Parkinson disease and attention deficit hyperactivity disorder.",
      "Postmortem studies show altered HNMT expression in human brain diseases; HNMT inhibitors are proposed as brain-histamine boosters."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:hnmt",
        "note": "HNMT is the essential brain histamine-inactivating enzyme."
      },
      {
        "rel": "evidence-for",
        "to": "compound:histamine"
      },
      {
        "rel": "evidence-for",
        "to": "pathway:histamine-degradation",
        "note": "Brain histamine clearance depends on HNMT."
      }
    ]
  },
  {
    "id": "article:naganuma-2017-hnmt-sleep-wake",
    "type": "article",
    "name": "Histamine N-methyltransferase regulates aggression and the sleep-wake cycle",
    "aliases": [
      "Naganuma 2017"
    ],
    "summary": "Hnmt-knockout mice had higher brain histamine, aggression and prolonged awakening in the light (inactive) phase that an H1 antagonist suppressed.",
    "body": [
      "Animal support for a link between [[enzyme:hnmt]], [[compound:histamine]] and fragmented sleep ([[outcome:night-waking]]). Complete loss of the enzyme is far from low methylation, so human relevance of this model is limited."
    ],
    "evidence": "plausible",
    "authors": [
      "Naganuma F",
      "Nakamura T",
      "Yoshikawa T",
      "Iida T",
      "Miura Y",
      "Kárpáti A",
      "Matsuzawa T",
      "Yanai A",
      "Mogi A",
      "Mochizuki T",
      "et al."
    ],
    "year": 2017,
    "journal": "Scientific reports",
    "doi": "10.1038/s41598-017-16019-8",
    "pmid": "29162912",
    "url": "https://doi.org/10.1038/s41598-017-16019-8",
    "verified": true,
    "takeaways": [
      "HNMT deficiency raised brain histamine concentrations, confirming HNMT's role in histamine inactivation.",
      "Knockout mice showed high aggressive behaviour that was suppressed by an H2 receptor antagonist.",
      "Sleep analysis revealed prolonged awakening bouts during the light period with compensatory sleep in the dark period; an H1 antagonist given before the light period normalised this.",
      "Mouse model of complete enzyme loss; human relevance of partial changes is unknown."
    ],
    "facts": {
      "design": "animal"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:hnmt",
        "note": "Loss of HNMT disrupts the sleep-wake cycle via H1 receptors in mice."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:night-waking",
        "note": "Excess histamine from HNMT loss fragments sleep in mice; no human or methylation-status data."
      },
      {
        "rel": "evidence-for",
        "to": "compound:histamine"
      }
    ]
  },
  {
    "id": "article:schubert-2008-gastric-acid-secretion-control",
    "type": "article",
    "name": "Control of gastric acid secretion in health and disease",
    "aliases": [
      "Schubert & Peura 2008"
    ],
    "summary": "Gastroenterology review of how gastric acid secretion is regulated and inhibited in health and disease, covering H2 blockers, proton pump inhibitors and H. pylori.",
    "body": [
      "Textbook-level background for [[pathway:gastric-acid-secretion]], the roles of [[compound:gastrin]], histamine and acetylcholine, and how [[intervention:ppi-therapy|PPIs]] act. Use it to ground discussion of acid as a variable in [[system:gastric-physiology]]."
    ],
    "evidence": "established",
    "authors": [
      "Schubert ML",
      "Peura DA"
    ],
    "year": 2008,
    "journal": "Gastroenterology",
    "doi": "10.1053/j.gastro.2008.05.021",
    "pmid": "18474247",
    "url": "https://doi.org/10.1053/j.gastro.2008.05.021",
    "verified": true,
    "takeaways": [
      "Reviews the physiology and pathophysiology of acid secretion and the evidence for inhibiting it in acid-related disease.",
      "Highlights three milestones: histamine H2-receptor antagonists, the identification of H+/K+-ATPase as the parietal cell proton pump, and H. pylori as the major cause of duodenal ulcer.",
      "Provides the standard picture of neural (vagal/acetylcholine), hormonal (gastrin) and paracrine (histamine) regulation.",
      "A general reference, not specific to amino acid supplements."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:gastric-acid-secretion",
        "note": "Standard review of regulation of parietal cell acid secretion."
      },
      {
        "rel": "evidence-for",
        "to": "compound:gastrin",
        "note": "Gastrin is a core hormonal regulator discussed."
      },
      {
        "rel": "evidence-for",
        "to": "system:gastric-physiology"
      },
      {
        "rel": "evidence-for",
        "to": "intervention:ppi-therapy",
        "note": "Covers the pharmacology and role of PPIs."
      }
    ]
  },
  {
    "id": "article:taylor-1982-amino-acids-gastric-acid",
    "type": "article",
    "name": "Effect of individual L-amino acids on gastric acid secretion and serum gastrin and pancreatic polypeptide release in humans",
    "aliases": [
      "Taylor 1982"
    ],
    "summary": "Intragastric instillation of individual amino acids showed phenylalanine and tryptophan are the most potent stimulants of acid, gastrin and pancreatic polypeptide; glycine was not singled out.",
    "body": [
      "Key human test of which amino acids drive gastric acid and [[compound:gastrin]]. It identifies aromatic amino acids, not [[compound:glycine]], as the potent ones, which weakens the premise that free glycine triggers a large gastrin-acid response that then produces CO2 and belching."
    ],
    "evidence": "established",
    "authors": [
      "Taylor IL",
      "Byrne WJ",
      "Christie DL",
      "Ament ME",
      "Walsh JH"
    ],
    "year": 1982,
    "journal": "Gastroenterology",
    "doi": "10.1016/0016-5085(82)90187-1",
    "pmid": "6806140",
    "url": "https://doi.org/10.1016/0016-5085(82)90187-1",
    "verified": true,
    "takeaways": [
      "Individual L-amino acids were instilled into the stomach of humans to compare effects on acid secretion, gastrin and pancreatic polypeptide.",
      "Phenylalanine and tryptophan were significantly more potent than any other amino acid tested for acid, gastrin and pancreatic polypeptide release.",
      "Smaller but significant responses occurred with threonine (pancreatic polypeptide) and serine (acid).",
      "The authors conclude much of a mixed amino acid solution's acid stimulation is due to the aromatic amino acids."
    ],
    "facts": {
      "design": "controlled human study"
    },
    "relations": [
      {
        "rel": "evidence-against",
        "to": "compound:glycine",
        "note": "Glycine was not among the amino acids reported to stimulate acid or gastrin strongly; it contradicts the 'potent gastrin secretagogue' claim, though glycine's own result isn't named in the abstract."
      },
      {
        "rel": "evidence-for",
        "to": "compound:gastrin",
        "note": "Aromatic amino acids stimulate gastrin release in humans."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:gastric-acid-secretion",
        "note": "Amino acid-specific acid stimulation, mainly Phe and Trp."
      }
    ]
  },
  {
    "id": "article:mcarthur-1983-iv-amino-acids-gastric-acid",
    "type": "article",
    "name": "Intravenous infusion of L-isomers of phenylalanine and tryptophan stimulate gastric acid secretion at physiologic plasma concentrations in normal subjects and after parietal cell vagotomy",
    "aliases": [
      "McArthur 1983"
    ],
    "summary": "Intravenous phenylalanine and tryptophan stimulated gastric acid at physiologic plasma levels via a gastrin-independent, vagus-independent route, while glycine gave only a slight response.",
    "body": [
      "Compares several amino acids including [[compound:glycine]]. Only phenylalanine and tryptophan had a clear effect on [[pathway:gastric-acid-secretion]], and the effect did not need [[compound:gastrin]] or [[system:vagal-tone]]. Intravenous infusions test a systemic route, not glycine in the lumen."
    ],
    "evidence": "established",
    "authors": [
      "McArthur KE",
      "Isenberg JI",
      "Hogan DL",
      "Dreier SJ"
    ],
    "year": 1983,
    "journal": "The Journal of clinical investigation",
    "doi": "10.1172/jci110875",
    "pmid": "6853713",
    "url": "https://doi.org/10.1172/jci110875",
    "verified": true,
    "takeaways": [
      "Nine healthy subjects received graded intravenous infusions of phenylalanine, tryptophan, glycine, alanine, histidine or saline on separate days.",
      "Phenylalanine and tryptophan stimulated acid to about half the response to intragastric peptone; alanine and histidine were without effect and glycine gave a slight response.",
      "Serum gastrin changed only with the highest phenylalanine dose, and after the acid rise, indicating a nongastrin mechanism.",
      "Responses persisted after parietal cell vagotomy, so are not vagally mediated."
    ],
    "facts": {
      "design": "controlled crossover study",
      "population": "9 healthy subjects; 5 after parietal cell vagotomy"
    },
    "relations": [
      {
        "rel": "evidence-against",
        "to": "compound:glycine",
        "note": "Intravenous glycine produced only a slight acid response and no gastrin rise."
      },
      {
        "rel": "evidence-for",
        "to": "compound:gastrin",
        "note": "Gastrin did not explain the aromatic amino acid acid response."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:gastric-acid-secretion",
        "note": "Circulating Phe/Trp stimulate acid at steak-meal plasma concentrations."
      },
      {
        "rel": "evidence-against",
        "to": "system:vagal-tone",
        "note": "The amino acid acid response was independent of the vagus."
      }
    ]
  },
  {
    "id": "article:feng-2010-casr-gastrin-secretion",
    "type": "article",
    "name": "Calcium-sensing receptor is a physiologic multimodal chemosensor regulating gastric G-cell growth and gastrin secretion",
    "aliases": [
      "Feng 2010"
    ],
    "summary": "In mice, the calcium-sensing receptor on gastric G cells mediates gastrin and acid secretion in response to calcium, peptone, phenylalanine and elevated pH.",
    "body": [
      "Identifies the CaSR as the likely luminal sensor linking amino acids (phenylalanine, peptone) and a rise in pH to [[compound:gastrin]] release. This supports the generic mechanism by which higher gastric pH can raise [[pathway:gastric-acid-secretion]] (a negative-feedback loop), but glycine was not tested."
    ],
    "evidence": "plausible",
    "authors": [
      "Feng J",
      "Petersen CD",
      "Coy DH",
      "Jiang JK",
      "Thomas CJ",
      "Pollak MR",
      "Wank SA"
    ],
    "year": 2010,
    "journal": "Proceedings of the National Academy of Sciences of the United States of America",
    "doi": "10.1073/pnas.1009078107",
    "pmid": "20876097",
    "url": "https://doi.org/10.1073/pnas.1009078107",
    "verified": true,
    "takeaways": [
      "CaSR is expressed on gastrin-secreting G cells and is allosterically activated by Ca2+, amino acids and higher pH.",
      "Gavage of Ca2+, peptone, phenylalanine or pH 7.4 buffer, and a calcimimetic, stimulated gastrin and acid in wild-type but not CaSR-null mice; a calcilytic inhibited secretion.",
      "G-cell number fell by more than 65% between 30 and 90 days in CaSR-null mice.",
      "Glycine was not among the tested stimuli in the abstract; this is murine evidence."
    ],
    "facts": {
      "design": "animal"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:gastrin",
        "note": "CaSR is a physiological sensor for nutrient-driven gastrin secretion."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:gastric-acid-secretion",
        "note": "Nutrients and elevated pH raise acid via CaSR on G cells."
      },
      {
        "rel": "evidence-for",
        "to": "system:gastric-physiology",
        "note": "Mechanism for luminal sensing of amino acids and pH by G cells."
      }
    ]
  },
  {
    "id": "article:fordtran-1973-gastric-buffer-meal",
    "type": "article",
    "name": "Gastric acid secretion rate and buffer content of the stomach after eating. Results in normal subjects and in patients with duodenal ulcer",
    "aliases": [
      "Fordtran & Walsh 1973"
    ],
    "summary": "Human study measuring meal buffer content and acid secretion by bicarbonate-controlled intragastric pH: duodenal ulcer patients secreted about twice as much acid and emptied meal buffer faster.",
    "body": [
      "Classic human physiology of how food buffer and [[pathway:gastric-acid-secretion]] set intragastric pH after a protein meal. It describes buffering by food in general, not by free [[compound:glycine]], and shows how complex the gastrin link is ([[compound:gastrin]], [[disease:peptic-ulcer]])."
    ],
    "evidence": "established",
    "authors": [
      "Fordtran JS",
      "Walsh JH"
    ],
    "year": 1973,
    "journal": "The Journal of clinical investigation",
    "doi": "10.1172/JCI107226",
    "pmid": "4685087",
    "url": "https://doi.org/10.1172/JCI107226",
    "verified": true,
    "takeaways": [
      "New methods used sodium bicarbonate infusion to hold intragastric pH constant and measure buffering and net acid secretion after a steak meal.",
      "Duodenal ulcer patients had acid secretion rates roughly twice those of controls, exceeding the peak histamine response.",
      "Meal-stimulated acid correlated only moderately with serum gastrin (r=0.45), so other factors contribute.",
      "Ulcer patients emptied the meal buffer much faster, leading to abnormally high gastric acidity after a meal."
    ],
    "facts": {
      "design": "physiology study",
      "population": "Normal subjects (n=6) and duodenal ulcer patients (n=7)"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:gastric-acid-secretion",
        "note": "Quantifies food buffering and meal-stimulated acid secretion."
      },
      {
        "rel": "evidence-for",
        "to": "disease:peptic-ulcer",
        "note": "Fast buffer emptying plus hypersecretion may contribute to duodenal ulcer."
      },
      {
        "rel": "evidence-for",
        "to": "system:gastric-physiology",
        "note": "Protein and food buffers hold pH up until they empty."
      }
    ]
  },
  {
    "id": "article:allen-2005-mucus-bicarbonate-barrier",
    "type": "article",
    "name": "Gastroduodenal mucus bicarbonate barrier: protection against acid and pepsin",
    "aliases": [
      "Allen & Flemström 2005"
    ],
    "summary": "Review of the gastroduodenal mucus-bicarbonate barrier: bicarbonate in an adherent mucus gel maintains near-neutral pH at the epithelium and blocks pepsin.",
    "body": [
      "Describes the protective layer whose failure underlies [[disease:peptic-ulcer]] and the mucosal irritation seen in [[system:gastric-physiology]]. It also contextualises the idea that products supposedly increasing mucus or bicarbonate (e.g. [[intervention:dgl-licorice]]) would have to act on this layer."
    ],
    "evidence": "established",
    "authors": [
      "Allen A",
      "Flemström G"
    ],
    "year": 2005,
    "journal": "American journal of physiology. Cell physiology",
    "doi": "10.1152/ajpcell.00102.2004",
    "pmid": "15591243",
    "url": "https://doi.org/10.1152/ajpcell.00102.2004",
    "verified": true,
    "takeaways": [
      "Bicarbonate secreted into the adherent mucus gel creates a pH gradient with near-neutral pH at the epithelial surface in stomach and duodenum.",
      "The mucus gel is a stable unstirred layer and a physical barrier to luminal pepsin.",
      "Mucosal bicarbonate neutralises acid diffusing into the gel layer and its secretion is regulated by the mechanisms reviewed.",
      "The barrier is sufficient under normal conditions for the stomach and even more so for the duodenum."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "system:gastric-physiology",
        "note": "Core review of mucosal defence against acid and pepsin."
      },
      {
        "rel": "evidence-for",
        "to": "disease:peptic-ulcer",
        "note": "Ulcer disease reflects barrier failure under acid and pepsin."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:gastric-acid-secretion",
        "note": "Balance between acid secretion and mucosal bicarbonate."
      }
    ]
  },
  {
    "id": "article:kaunitz-2006-duodenal-co2-carbonic-anhydrase",
    "type": "article",
    "name": "Duodenal carbonic anhydrase: mucosal protection, luminal chemosensing, and gastric acid disposal",
    "aliases": [
      "Kaunitz & Akiba 2006"
    ],
    "summary": "Review noting that neutralising stomach acid in the duodenum generates large volumes of CO2, which the duodenal mucosa absorbs via carbonic anhydrase, forming an acid-base buffer zone.",
    "body": [
      "Supports the chemistry behind the [[compound:carbon-dioxide]] idea (acid plus bicarbonate yields CO2) but emphasises that the duodenum absorbs this CO2 efficiently, which argues against large volumes of free duodenal gas reaching the stomach. Not studied in relation to glycine or belching."
    ],
    "evidence": "plausible",
    "authors": [
      "Kaunitz JD",
      "Akiba Y"
    ],
    "year": 2006,
    "journal": "The Keio journal of medicine",
    "doi": "10.2302/kjm.55.96",
    "pmid": "17008801",
    "url": "https://doi.org/10.2302/kjm.55.96",
    "verified": true,
    "takeaways": [
      "Over about 25 cm the duodenum converts large volumes of strong acid into neutral-alkaline chyme.",
      "This generates large volumes of CO2, which the duodenum then absorbs; epithelial cells endure intense acid and CO2 stress.",
      "The duodenum also takes up H+ and CO2 that are recycled by gastric parietal cells.",
      "High expression of cytosolic and membrane carbonic anhydrases is linked to acid absorption, epithelial protection and chemosensing."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:carbon-dioxide",
        "note": "Duodenal acid neutralisation generates CO2, but the review describes it being absorbed across the mucosa."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:gastric-acid-secretion",
        "note": "H+ and CO2 absorbed in the duodenum are recycled by parietal cells."
      },
      {
        "rel": "evidence-for",
        "to": "system:gastric-physiology"
      }
    ]
  },
  {
    "id": "article:martinsen-2005-gastric-acid-barrier",
    "type": "article",
    "name": "Gastric juice: a barrier against infectious diseases",
    "aliases": [
      "Martinsen 2005"
    ],
    "summary": "Review: gastric acid inactivates ingested microbes; acid blockade leads to bacterial overgrowth in the gut, though the clinical significance is uncertain.",
    "body": [
      "Foundation for the argument that [[state:hypochlorhydria]] (or acid suppression with [[intervention:ppi-therapy|PPIs]]) opens the way for upper-gut bacteria ([[disease:sibo]]). The review itself calls the clinical significance controversial."
    ],
    "evidence": "plausible",
    "authors": [
      "Martinsen TC",
      "Bergh K",
      "Waldum HL"
    ],
    "year": 2005,
    "journal": "Basic & clinical pharmacology & toxicology",
    "doi": "10.1111/j.1742-7843.2005.pto960202.x",
    "pmid": "15679471",
    "url": "https://doi.org/10.1111/j.1742-7843.2005.pto960202.x",
    "verified": true,
    "takeaways": [
      "The main function of gastric acid is inactivation of ingested microorganisms, so the stomach is a barrier to most pathogens.",
      "Hypochlorhydria from atrophic gastritis, gastric surgery or acid-suppressing drugs is fairly common.",
      "Drug-induced blockade of acid secretion leads to gastrointestinal bacterial overgrowth, whose clinical significance is still controversial.",
      "Acid protects against non-typhoid salmonellosis and cholera; evidence for viruses, prions and parasites is limited."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "state:hypochlorhydria",
        "note": "Hypochlorhydria weakens the gastric microbial barrier."
      },
      {
        "rel": "evidence-for",
        "to": "system:gut-microbiota",
        "note": "Acid suppression is linked to bacterial overgrowth."
      },
      {
        "rel": "evidence-for",
        "to": "disease:sibo",
        "note": "Acid blockade can lead to bacterial overgrowth; clinical relevance debated."
      }
    ]
  },
  {
    "id": "article:prosapio-2023-statpearls-gastrin",
    "type": "article",
    "name": "Physiology, Gastrin",
    "aliases": [
      "Prosapio 2023 (StatPearls)"
    ],
    "summary": "StatPearls chapter: gastrin from antral G cells is released by vagal and GRP stimulation, peptides, amino acids, distention and high pH, and is inhibited by somatostatin and low pH.",
    "body": [
      "General textbook support for [[compound:gastrin]] regulation by amino acids and pH. It is non-specific: 'amino acids' as a class does not mean every amino acid, as [[article:taylor-1982-amino-acids-gastric-acid]] shows."
    ],
    "evidence": "established",
    "authors": [
      "Prosapio JG",
      "Sankar P",
      "Jialal I"
    ],
    "year": 2023,
    "journal": "StatPearls (NCBI Bookshelf)",
    "pmid": "30521243",
    "url": "https://pubmed.ncbi.nlm.nih.gov/30521243/",
    "verified": true,
    "takeaways": [
      "Gastrin is a peptide hormone that enhances gastric mucosal growth and motility and stimulates acid secretion from parietal cells.",
      "It is released from antral G cells in response to vagal and gastrin-releasing peptide stimulation after ingestion of peptides and amino acids, gastric distention and elevated stomach pH.",
      "Release is decreased by somatostatin and low pH.",
      "Acid is needed to convert pepsinogen to pepsin and to free vitamin B12 from salivary R-protein."
    ],
    "facts": {
      "design": "textbook"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:gastrin",
        "note": "Standard description of stimuli and inhibitors of gastrin."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:gastric-acid-secretion",
        "note": "Gastrin drives parietal acid secretion."
      },
      {
        "rel": "evidence-for",
        "to": "state:hypochlorhydria",
        "note": "Elevated pH is a stimulus for gastrin; a feedback mechanism that follows from acid loss."
      }
    ]
  },
  {
    "id": "article:kessing-2014-excessive-belching-review",
    "type": "article",
    "name": "The pathophysiology, diagnosis and treatment of excessive belching symptoms",
    "aliases": [
      "Kessing 2014"
    ],
    "summary": "Impedance monitoring separates gastric belches (vagal reflex venting stomach air) from supragastric belches (air sucked in and expelled); excessive belchers mostly show supragastric ones.",
    "body": [
      "Core taxonomy for [[outcome:belching]]. Because excessive belching is largely supragastric, chemically generated gas ([[compound:carbon-dioxide]]) is not the usual driver. Ordinary gastric belching is a vagal reflex ([[system:vagal-tone]]); the review does not describe it as a sign of low vagal tone."
    ],
    "evidence": "established",
    "authors": [
      "Kessing BF",
      "Bredenoord AJ",
      "Smout AJ"
    ],
    "year": 2014,
    "journal": "The American journal of gastroenterology",
    "doi": "10.1038/ajg.2014.165",
    "pmid": "25001253",
    "url": "https://doi.org/10.1038/ajg.2014.165",
    "verified": true,
    "takeaways": [
      "Excessive belching may occur alone or with GERD or functional dyspepsia.",
      "The gastric belch is a vagally mediated reflex that relaxes the lower esophageal sphincter to vent gastric air.",
      "The supragastric belch is a behavioural pattern in which pharyngeal air is sucked or injected into the esophagus and expelled before reaching the stomach.",
      "Patients who belch excessively have more supragastric, not gastric, belches; behavioural therapy decreases complaints in isolated excessive belching."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "outcome:belching",
        "note": "Defines gastric vs supragastric belch mechanisms and their clinical weight."
      },
      {
        "rel": "evidence-for",
        "to": "system:lower-esophageal-sphincter",
        "note": "Gastric belch requires LES relaxation; supragastric belch bypasses the stomach."
      },
      {
        "rel": "evidence-against",
        "to": "compound:carbon-dioxide",
        "note": "Excessive belching is dominated by supragastric (air-swallowing) belches, not stomach gas production; not tested in glycine users."
      },
      {
        "rel": "evidence-for",
        "to": "system:vagal-tone",
        "note": "The gastric belch is a vagally mediated reflex, so it depends on intact vagal signalling."
      }
    ]
  },
  {
    "id": "article:bredenoord-2005-air-swallowing-belching",
    "type": "article",
    "name": "Relationships between air swallowing, intragastric air, belching and gastro-oesophageal reflux",
    "aliases": [
      "Bredenoord 2005"
    ],
    "summary": "In 20 healthy volunteers, air swallowing rate correlated with intragastric air bubble size and gaseous reflux, so swallowed air promotes belching but not acid reflux.",
    "body": [
      "Shows normal belching tracks swallowed air ([[outcome:belching]]). Whether taking a powder or drinking while ingesting it changes air swallowing was not tested. Relevant to separating belching from acid reflux ([[disease:gerd]], [[system:lower-esophageal-sphincter]])."
    ],
    "evidence": "plausible",
    "authors": [
      "Bredenoord AJ",
      "Weusten BL",
      "Timmer R",
      "Akkermans LM",
      "Smout AJ"
    ],
    "year": 2005,
    "journal": "Neurogastroenterology and motility",
    "doi": "10.1111/j.1365-2982.2004.00626.x",
    "pmid": "15916621",
    "url": "https://doi.org/10.1111/j.1365-2982.2004.00626.x",
    "verified": true,
    "takeaways": [
      "Impedance and radiography were used in 20 healthy volunteers before and after a meal to quantify air swallows and gastric air.",
      "The rate of air swallowing correlated with the post-meal intragastric air bubble and with gaseous reflux (belching).",
      "Air swallows and bubble size did not correlate with liquid acid or non-acid reflux.",
      "Belching is the stomach's way of venting swallowed air through transient LES relaxation."
    ],
    "facts": {
      "design": "physiology study",
      "population": "20 healthy volunteers"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "outcome:belching",
        "note": "Swallowed air, not gas production, explains much of normal belching."
      },
      {
        "rel": "evidence-for",
        "to": "system:lower-esophageal-sphincter",
        "note": "Belching occurs via transient LES relaxation."
      },
      {
        "rel": "evidence-against",
        "to": "disease:gerd",
        "note": "Air swallowing promoted belching but did not facilitate acid reflux in healthy volunteers."
      }
    ]
  },
  {
    "id": "article:hemmink-2009-supragastric-belching-reflux",
    "type": "article",
    "name": "Supragastric belching in patients with reflux symptoms",
    "aliases": [
      "Hemmink 2009"
    ],
    "summary": "In 50 patients with reflux symptoms, 24 had supragastric belches; about half of these belches were time-linked to reflux episodes, sometimes preceding them.",
    "body": [
      "Supports a two-way relation between [[outcome:belching]] and [[disease:gerd]]: belching may trigger reflux and reflux may trigger belching. LPR ([[disease:lpr]]) symptoms were not measured."
    ],
    "evidence": "plausible",
    "authors": [
      "Hemmink GJ",
      "Bredenoord AJ",
      "Weusten BL",
      "Timmer R",
      "Smout AJ"
    ],
    "year": 2009,
    "journal": "The American journal of gastroenterology",
    "doi": "10.1038/ajg.2009.203",
    "pmid": "19455107",
    "url": "https://doi.org/10.1038/ajg.2009.203",
    "verified": true,
    "takeaways": [
      "Fifty reflux patients and 10 healthy volunteers underwent 24-hour pH-impedance off PPI.",
      "Supragastric belches were found in 24 of 50 patients (median 13 per 24 h) and in 5 of 10 healthy volunteers (median 2).",
      "In patients, 48% of supragastric belches occurred in close temporal association with reflux, often immediately before the reflux (30%).",
      "The authors suggest supragastric belching can elicit reflux in some patients and is a response to unpleasant esophageal sensation in others."
    ],
    "facts": {
      "design": "cohort",
      "population": "50 reflux patients, 10 healthy volunteers"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "outcome:belching",
        "note": "Supragastric belching is common in reflux patients."
      },
      {
        "rel": "evidence-for",
        "to": "disease:gerd",
        "note": "Belches often accompany or precede reflux episodes."
      },
      {
        "rel": "evidence-for",
        "to": "disease:lpr",
        "note": "Plausibility link between belching and extra-esophageal reflux; LPR was not assessed."
      }
    ]
  },
  {
    "id": "article:moshiree-2023-aga-belching-bloating",
    "type": "article",
    "name": "AGA Clinical Practice Update on Evaluation and Management of Belching, Abdominal Bloating, and Distention: Expert Review",
    "aliases": [
      "Moshiree 2023 (AGA CPU)"
    ],
    "summary": "AGA Clinical Practice Update on belching, bloating and distension: use impedance-pH to separate gastric from supragastric belching and treat supragastric belching with brain-gut behavioural therapies.",
    "body": [
      "Current US expert advice on [[outcome:belching]]. It puts SIBO breath testing ([[intervention:sibo-breath-test]], [[disease:sibo]]) in a narrow role, which tempers the assumption that belching signals SIBO."
    ],
    "evidence": "established",
    "authors": [
      "Moshiree B",
      "Drossman D",
      "Shaukat A"
    ],
    "year": 2023,
    "journal": "Gastroenterology",
    "doi": "10.1053/j.gastro.2023.04.039",
    "pmid": "37452811",
    "url": "https://doi.org/10.1053/j.gastro.2023.04.039",
    "verified": true,
    "takeaways": [
      "Clinical history and impedance-pH monitoring help differentiate gastric from supragastric belching.",
      "Treatment options for supragastric belching include cognitive behavioural therapy, diaphragmatic breathing, speech therapy and central neuromodulators.",
      "Small-bowel aspiration or glucose/lactulose breath testing for SIBO is suggested only in a small subset of at-risk patients with bloating.",
      "The authors state there is limited evidence for treatments, and statements are not graded."
    ],
    "facts": {
      "design": "guideline"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "outcome:belching",
        "note": "Best-practice workup and treatment of belching."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:sibo-breath-test",
        "note": "Breath testing for SIBO restricted to at-risk patients with bloating."
      },
      {
        "rel": "evidence-for",
        "to": "disease:sibo",
        "note": "SIBO testing is positioned as a minor part of belching/bloating evaluation."
      }
    ]
  },
  {
    "id": "article:ong-2018-diaphragmatic-breathing-belching",
    "type": "article",
    "name": "Diaphragmatic Breathing Reduces Belching and Proton Pump Inhibitor Refractory Gastroesophageal Reflux Symptoms",
    "aliases": [
      "Ong 2018"
    ],
    "summary": "In 36 patients with PPI-refractory reflux and belching, diaphragmatic breathing therapy cut belching VAS by 50% or more in 60% versus 0% of wait-list controls and improved reflux symptoms.",
    "body": [
      "Demonstrates a non-pharmacological fix for the most common form of excessive [[outcome:belching]]. It is relevant if belching after a supplement partly reflects air swallowing or supragastric belching, which the paper treats in [[disease:gerd]] patients."
    ],
    "evidence": "plausible",
    "authors": [
      "Ong AM",
      "Chua LT",
      "Khor CJ",
      "Asokkumar R",
      "S/O Namasivayam V",
      "Wang YT"
    ],
    "year": 2018,
    "journal": "Clinical gastroenterology and hepatology : the official clinical practice journal of the American Gastroenterological Association",
    "doi": "10.1016/j.cgh.2017.10.038",
    "pmid": "29104130",
    "url": "https://doi.org/10.1016/j.cgh.2017.10.038",
    "verified": true,
    "takeaways": [
      "Fifteen patients received a standardised diaphragmatic breathing protocol and 21 were placed on a wait list.",
      "Nine of 15 treated (60%) and none of 21 controls reached the primary endpoint of at least 50% lower belching VAS.",
      "Mean belching VAS fell from 7.1 to 3.5 with therapy and was unchanged in controls.",
      "Reflux symptoms and quality-of-life scores also improved; the trial was not randomised and was open-label."
    ],
    "facts": {
      "design": "controlled trial",
      "population": "36 patients with PPI-refractory GERD"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "outcome:belching",
        "note": "Behavioural therapy sharply reduces belching in PPI-refractory GERD with supragastric belching."
      },
      {
        "rel": "evidence-for",
        "to": "disease:gerd",
        "note": "Refractory reflux symptoms improved alongside belching."
      }
    ]
  },
  {
    "id": "article:stanghellini-2016-rome-iv-gastroduodenal",
    "type": "article",
    "name": "Gastroduodenal Disorders",
    "aliases": [
      "Rome IV (Stanghellini 2016)"
    ],
    "summary": "Rome IV classification of gastroduodenal disorders: functional dyspepsia, belching disorders (gastric vs supragastric), nausea/vomiting disorders and rumination syndrome.",
    "body": [
      "Defines how clinicians classify [[outcome:belching]] and functional dyspepsia, the categories into which supplement-associated belching would fall. It does not tie belching to any nutrient or to methylation ([[state:gastric-dysmotility]])."
    ],
    "evidence": "established",
    "authors": [
      "Stanghellini V",
      "Chan FK",
      "Hasler WL",
      "Malagelada JR",
      "Suzuki H",
      "Tack J",
      "Talley NJ"
    ],
    "year": 2016,
    "journal": "Gastroenterology",
    "doi": "10.1053/j.gastro.2016.02.011",
    "pmid": "27147122",
    "url": "https://doi.org/10.1053/j.gastro.2016.02.011",
    "verified": true,
    "takeaways": [
      "Functional dyspepsia is defined by postprandial fullness, early satiation, epigastric pain or burning, with postprandial distress and epigastric pain subtypes.",
      "Belching disorders are audible escapes of air from esophagus or stomach and are split into gastric and supragastric belch by impedance.",
      "Nausea and vomiting disorders include chronic nausea and vomiting syndrome, cyclic vomiting syndrome and cannabinoid hyperemesis.",
      "Rumination syndrome is the fourth category."
    ],
    "facts": {
      "design": "consensus"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "outcome:belching",
        "note": "Formal diagnostic definition of belching disorders."
      },
      {
        "rel": "evidence-for",
        "to": "state:gastric-dysmotility",
        "note": "Functional dyspepsia (postprandial distress) is the usual functional correlate of dysmotility symptoms."
      }
    ]
  },
  {
    "id": "article:shukla-2012-carbonated-beverage-tlesr",
    "type": "article",
    "name": "Ingestion of a carbonated beverage decreases lower esophageal sphincter pressure and increases frequency of transient lower esophageal sphincter relaxation in normal subjects",
    "aliases": [
      "Shukla 2012"
    ],
    "summary": "In 18 healthy volunteers, 200 mL of cola raised transient LES relaxations to a median 10.5 per 30 min and cut LES pressure from about 40 to 18 mmHg compared with water.",
    "body": [
      "Direct human evidence that ingested [[compound:carbon-dioxide]] (as carbonation) opens the [[system:lower-esophageal-sphincter]]. If CO2 were produced in the stomach by acid-bicarbonate chemistry it could act similarly, but that has not been demonstrated; see [[article:kaunitz-2006-duodenal-co2-carbonic-anhydrase]]."
    ],
    "evidence": "plausible",
    "authors": [
      "Shukla A",
      "Meshram M",
      "Gopan A",
      "Ganjewar V",
      "Kumar P",
      "Bhatia SJ"
    ],
    "year": 2012,
    "journal": "Indian journal of gastroenterology : official journal of the Indian Society of Gastroenterology",
    "doi": "10.1007/s12664-012-0206-0",
    "pmid": "22791463",
    "url": "https://doi.org/10.1007/s12664-012-0206-0",
    "verified": true,
    "takeaways": [
      "High-resolution manometry was done at baseline, after chilled water and after chilled cola in 18 healthy volunteers.",
      "Median transient LES relaxations were 10.5 after cola versus 1 after water and 0 at baseline.",
      "LES pressure fell to 18.5 mmHg after cola from 40.5 at baseline and 34 after water.",
      "Gastric pressure did not differ, so the effect was on the sphincter rather than gastric pressure."
    ],
    "facts": {
      "design": "controlled crossover study",
      "population": "18 healthy volunteers"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:carbon-dioxide",
        "note": "A CO2-rich beverage increases transient LES relaxations, a route to belching."
      },
      {
        "rel": "evidence-for",
        "to": "system:lower-esophageal-sphincter",
        "note": "Carbonation lowered LES pressure and increased relaxations."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:belching",
        "note": "Provides a plausible mechanism for gas-induced belching."
      }
    ]
  },
  {
    "id": "article:melchior-2026-cola-prandial-belching",
    "type": "article",
    "name": "Physiological belching during impedance-pH monitoring: a meal with Coca-Cola provokes a prompt gastroesophageal reaction with increased prandial belching",
    "aliases": [
      "Melchior 2026"
    ],
    "summary": "In 10 healthy volunteers eating a burger meal, cola increased prandial belching (median 9.5 vs 0) with acid reflux, but did not change post-meal belching over two hours.",
    "body": [
      "A small recent human study supporting the idea that ingested [[compound:carbon-dioxide]] increases [[outcome:belching]] during the meal. The acid component of the cola (pH below 3) is a confounder, and the study is 10 volunteers."
    ],
    "evidence": "plausible",
    "authors": [
      "Melchior AB",
      "Da Cas ME",
      "Surkamp N",
      "Zamprogna V",
      "Silveira MP",
      "Santos TS",
      "Montenegro LZ",
      "Volpi LM",
      "Fornari F"
    ],
    "year": 2026,
    "journal": "Journal of basic and clinical physiology and pharmacology",
    "doi": "10.1515/jbcpp-2024-0050",
    "pmid": "41614646",
    "url": "https://doi.org/10.1515/jbcpp-2024-0050",
    "verified": true,
    "takeaways": [
      "Ten healthy adults ate a burger meal on two days, with or without 500 mL cola, with impedance-pH monitoring.",
      "With cola, the median number of prandial belches rose to 9.5 (vs 0) and most belches coincided with esophageal acidification or acid reflux.",
      "Belches with cola were less often pure gas.",
      "Over the next two hours belching frequency and reflux exposure did not differ between conditions."
    ],
    "facts": {
      "design": "controlled crossover study",
      "population": "10 healthy adults"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "outcome:belching",
        "note": "Dissolved gas raises belching during the meal in healthy people."
      },
      {
        "rel": "evidence-for",
        "to": "compound:carbon-dioxide",
        "note": "Carbonated cola was the CO2 source tested."
      },
      {
        "rel": "evidence-for",
        "to": "system:lower-esophageal-sphincter",
        "note": "Belching coincided with liquid/acid reflux through the LES."
      }
    ]
  },
  {
    "id": "article:kitazawa-2007-muscarinic-receptors-stomach",
    "type": "article",
    "name": "Functional roles of muscarinic M2 and M3 receptors in mouse stomach motility: studies with muscarinic receptor knockout mice",
    "aliases": [
      "Kitazawa 2007"
    ],
    "summary": "In knockout mice both M2 and M3 receptors mediated cholinergic stomach contraction, but gastric emptying stayed normal even without both receptors, due to compensating non-cholinergic pathways.",
    "body": [
      "Mouse evidence that [[compound:acetylcholine]] contributes to stomach contraction but that [[state:gastric-dysmotility]] does not follow automatically when cholinergic signalling is blunted. Applies to receptor loss, not to dietary choline or low [[system:vagal-tone]]."
    ],
    "evidence": "plausible",
    "authors": [
      "Kitazawa T",
      "Hashiba K",
      "Cao J",
      "Unno T",
      "Komori S",
      "Yamada M",
      "Wess J",
      "Taneike T"
    ],
    "year": 2007,
    "journal": "European journal of pharmacology",
    "doi": "10.1016/j.ejphar.2006.10.013",
    "pmid": "17113073",
    "url": "https://doi.org/10.1016/j.ejphar.2006.10.013",
    "verified": true,
    "takeaways": [
      "Mouse stomach strips from M2-, M3- and double-knockout animals were tested with carbachol and electrical field stimulation.",
      "Carbachol-induced contraction required M2 and M3 receptors; double knockouts lost cholinergic contraction.",
      "Atropine-resistant (non-cholinergic) contractions were more prominent in knockout stomachs.",
      "Gastric emptying in double-knockout mice was comparable to wild-type, suggesting compensatory pathways."
    ],
    "facts": {
      "design": "animal"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:acetylcholine",
        "note": "Acetylcholine drives gastric contraction via M2/M3 receptors."
      },
      {
        "rel": "evidence-for",
        "to": "system:vagal-tone",
        "note": "Cholinergic input is one of several contributors to gastric motor function."
      },
      {
        "rel": "evidence-against",
        "to": "state:gastric-dysmotility",
        "note": "Loss of cholinergic receptors did not slow emptying in mice, so an acetylcholine shortfall need not cause gastroparesis."
      }
    ]
  },
  {
    "id": "article:mondal-2017-duodenal-ph-mmc-motilin",
    "type": "article",
    "name": "Underlying mechanism of the cyclic migrating motor complex in Suncus murinus: a change in gastrointestinal pH is the key regulator",
    "aliases": [
      "Mondal 2017"
    ],
    "summary": "In the musk shrew, changes in duodenal pH (alkaline or acidic) trigger gastric fasting contractions via motilin and ghrelin, independent of the vagus, with PGE2 and 5-HT4 involved.",
    "body": [
      "Mechanistic animal data connecting acid and bicarbonate handling to the interdigestive MMC through motilin ([[state:gastric-dysmotility]]). It is partly consistent with the idea that acid flow helps drive the MMC, but it concerns duodenal pH in a shrew, found motilin and ghrelin rather than secretin involved, and showed the effect was vagus-independent ([[system:vagal-tone]])."
    ],
    "evidence": "plausible",
    "authors": [
      "Mondal A",
      "Koyama K",
      "Mikami T",
      "Horita T",
      "Takemi S",
      "Tsuda S",
      "Sakata I",
      "Sakai T"
    ],
    "year": 2017,
    "journal": "Physiological reports",
    "doi": "10.14814/phy2.13105",
    "pmid": "28082431",
    "url": "https://doi.org/10.14814/phy2.13105",
    "verified": true,
    "takeaways": [
      "The migrating motor complex in the shrew mirrors the human pattern and was probed by intraduodenal infusions at different pH.",
      "Intraduodenal saline at pH 8 or lowering duodenal pH to 3 evoked strong gastric contractions that were abolished by motilin and ghrelin receptor antagonists.",
      "The effect was independent of the vagus; PGE2 and 5-HT4 receptors acted as intermediates in pH-evoked motilin release.",
      "The authors propose that an alkaline duodenal pH, produced by acid flow and bicarbonate release, is key to triggering the MMC."
    ],
    "facts": {
      "design": "animal"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "state:gastric-dysmotility",
        "note": "Links duodenal pH to fasting gastric contraction in an animal model."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:gastric-acid-secretion",
        "note": "Gastric acid flow and duodenal bicarbonate together set duodenal pH that triggers the MMC."
      },
      {
        "rel": "evidence-against",
        "to": "system:vagal-tone",
        "note": "The pH-evoked contractions were vagus-independent."
      }
    ]
  },
  {
    "id": "article:zhang-2016-functional-dyspepsia-gastric-emptying",
    "type": "article",
    "name": "Changes in patients' symptoms and gastric emptying after Helicobacter pylori treatment",
    "aliases": [
      "Zhang 2016"
    ],
    "summary": "In 70 functional dyspepsia patients, delayed emptying and more belching than controls were found; H. pylori eradication plus domperidone beat domperidone alone on symptoms and emptying.",
    "body": [
      "One of the few direct links between [[outcome:belching]] and slow emptying ([[state:gastric-dysmotility]]), seen in dyspepsia rather than in supplement users. It also supports testing for [[disease:h-pylori-infection]] and treating with [[intervention:h-pylori-eradication-therapy|H. pylori eradication]] if present."
    ],
    "evidence": "plausible",
    "authors": [
      "Zhang CL",
      "Geng CH",
      "Yang ZW",
      "Li YL",
      "Tong LQ",
      "Gao P",
      "Gao YQ"
    ],
    "year": 2016,
    "journal": "World journal of gastroenterology",
    "doi": "10.3748/wjg.v22.i18.4585",
    "pmid": "27182168",
    "url": "https://doi.org/10.3748/wjg.v22.i18.4585",
    "verified": true,
    "takeaways": [
      "Seventy FD patients (28 H. pylori-negative, 42 positive) and 72 healthy controls were compared using ultrasound gastric emptying.",
      "Belching occurred in 52.9% of FD patients versus 15.3% of controls, and FD half-emptying times were slower; belching was among symptoms that predicted delayed distal emptying.",
      "H. pylori-positive patients were randomised to eradication plus domperidone or domperidone alone.",
      "After treatment, symptom scores and gastric emptying were better in the eradication and H. pylori-negative groups than in the domperidone-only group."
    ],
    "facts": {
      "design": "controlled trial",
      "population": "70 functional dyspepsia patients vs 72 controls"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "outcome:belching",
        "note": "Belching is more common in FD and associated with slower gastric emptying."
      },
      {
        "rel": "evidence-for",
        "to": "state:gastric-dysmotility",
        "note": "Delayed gastric emptying documented in FD."
      },
      {
        "rel": "evidence-for",
        "to": "disease:h-pylori-infection",
        "note": "Eradication was associated with better symptoms and emptying in H. pylori-positive FD."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:h-pylori-eradication-therapy"
      }
    ]
  },
  {
    "id": "article:moayyedi-2017-acg-cag-dyspepsia",
    "type": "article",
    "name": "ACG and CAG Clinical Guideline: Management of Dyspepsia",
    "aliases": [
      "Moayyedi 2017"
    ],
    "summary": "ACG/CAG guideline: investigate dyspepsia over age 60 by endoscopy; test for H. pylori and treat if positive in younger patients, then use PPI, tricyclics or prokinetics.",
    "body": [
      "Standard pathway for dyspepsia work-up and treatment that frames [[intervention:h-pylori-eradication-therapy|H. pylori eradication]] and [[intervention:ppi-therapy|PPIs]] use. It contains no recommendations for amino acid supplements."
    ],
    "evidence": "established",
    "authors": [
      "Moayyedi P",
      "Lacy BE",
      "Andrews CN",
      "Enns RA",
      "Howden CW",
      "Vakil N"
    ],
    "year": 2017,
    "journal": "The American journal of gastroenterology",
    "doi": "10.1038/ajg.2017.154",
    "pmid": "28631728",
    "url": "https://doi.org/10.1038/ajg.2017.154",
    "verified": true,
    "takeaways": [
      "Patients aged 60 or older with dyspepsia are suggested to have upper endoscopy; alarm features alone should not automatically prompt endoscopy in younger patients.",
      "Patients under 60 should have non-invasive H. pylori testing and treatment if positive; those negative or unresponsive should receive a PPI trial.",
      "If PPI fails, tricyclic antidepressants or prokinetic therapy may be tried; in functional dyspepsia H. pylori eradication is offered if infected.",
      "Routine upper GI motility testing is not recommended."
    ],
    "facts": {
      "design": "guideline"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:h-pylori-infection",
        "note": "Test-and-treat strategy for dyspepsia."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:h-pylori-eradication-therapy",
        "note": "Recommended in H. pylori-positive dyspepsia."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:ppi-therapy",
        "note": "PPI trial is a first-line empiric step in H. pylori-negative dyspepsia."
      },
      {
        "rel": "evidence-for",
        "to": "state:gastric-dysmotility",
        "note": "Motility testing not routinely recommended."
      }
    ]
  },
  {
    "id": "article:camilleri-2022-acg-gastroparesis",
    "type": "article",
    "name": "ACG Clinical Guideline: Gastroparesis",
    "aliases": [
      "Camilleri 2022"
    ],
    "summary": "ACG guideline on gastroparesis: symptoms of food retention with objective delayed emptying and no obstruction; covers risk factors, diagnosis, diet, drugs, devices and pylorus-directed therapy.",
    "body": [
      "Anchors the diagnostic bar for [[disease:gastroparesis]]: objective delayed emptying, not belching alone. This matters when mild 'functional gastroparesis' ([[state:gastric-dysmotility]]) is proposed without a gastric emptying test."
    ],
    "evidence": "established",
    "authors": [
      "Camilleri M",
      "Kuo B",
      "Nguyen L",
      "Vaughn VM",
      "Petrey J",
      "Greer K",
      "Yadlapati R",
      "Abell TL"
    ],
    "year": 2022,
    "journal": "The American journal of gastroenterology",
    "doi": "10.14309/ajg.0000000000001874",
    "pmid": "35926490",
    "url": "https://doi.org/10.14309/ajg.0000000000001874",
    "verified": true,
    "takeaways": [
      "Gastroparesis is defined by symptoms of retention with objective delayed gastric emptying in the absence of mechanical outlet obstruction.",
      "The guideline reviews risk factors, diagnosis and management, including dietary, pharmacological, device and pylorus-directed interventions.",
      "Recommendations were graded with GRADE where evidence allowed, and expert key concepts otherwise.",
      "It is the reference for what counts as true gastroparesis versus symptoms without proven delay."
    ],
    "facts": {
      "design": "guideline"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:gastroparesis",
        "note": "Official ACG definition, diagnosis and management."
      },
      {
        "rel": "evidence-for",
        "to": "state:gastric-dysmotility",
        "note": "Delayed emptying is the objective criterion."
      }
    ]
  },
  {
    "id": "article:lo-2013-ppi-sibo-meta-analysis",
    "type": "article",
    "name": "Proton pump inhibitor use and the risk of small intestinal bacterial overgrowth: a meta-analysis",
    "aliases": [
      "Lo & Chan 2013"
    ],
    "summary": "Meta-analysis of 11 studies (n=3,134): PPI use raised SIBO odds 2.3-fold overall, but only when SIBO was diagnosed by small-bowel aspirate culture (OR 7.6), not by glucose breath test.",
    "body": [
      "Core meta-analysis linking [[intervention:ppi-therapy|PPIs]] use to [[disease:sibo]]. The effect is concentrated in culture-based diagnosis, so claims based on breath tests ([[intervention:sibo-breath-test]]) are weaker ([[state:hypochlorhydria]])."
    ],
    "evidence": "established",
    "authors": [
      "Lo WK",
      "Chan WW"
    ],
    "year": 2013,
    "journal": "Clinical gastroenterology and hepatology : the official clinical practice journal of the American Gastroenterological Association",
    "doi": "10.1016/j.cgh.2012.12.011",
    "pmid": "23270866",
    "url": "https://doi.org/10.1016/j.cgh.2012.12.011",
    "verified": true,
    "takeaways": [
      "Eleven studies compared SIBO risk in adult PPI users and nonusers; pooled OR was 2.28 (95% CI 1.24-4.21).",
      "In aspirate-culture studies the OR was 7.59 (1.81-31.89), but with glucose hydrogen breath tests it was 1.93 (0.69-5.42) and not significant.",
      "Funnel-plot analysis pointed to possible publication bias.",
      "The association depends heavily on how SIBO is diagnosed."
    ],
    "facts": {
      "design": "meta-analysis"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:sibo",
        "note": "PPI use associated with SIBO when confirmed by aspirate culture."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:ppi-therapy",
        "note": "Acid suppression is a risk factor for SIBO in aspirate-based studies."
      },
      {
        "rel": "evidence-for",
        "to": "state:hypochlorhydria",
        "note": "Plausible mediator: loss of acid barrier."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:sibo-breath-test",
        "note": "Association vanishes with glucose breath tests, underlining test dependence."
      }
    ]
  },
  {
    "id": "article:su-2018-ppi-sibo-meta-analysis",
    "type": "article",
    "name": "Meta-analysis: proton pump inhibitors moderately increase the risk of small intestinal bacterial overgrowth",
    "aliases": [
      "Su 2018"
    ],
    "summary": "Updated meta-analysis of 19 studies (n=7,055): PPI use moderately raises SIBO risk (OR 1.71) in studies using aspirate cultures or glucose breath tests.",
    "body": [
      "Updates [[article:lo-2013-ppi-sibo-meta-analysis]] with more studies and a smaller but consistent effect ([[intervention:ppi-therapy|PPIs]], [[disease:sibo]]). Together they support a moderate association, not a near-universal consequence of PPI use ([[state:hypochlorhydria]])."
    ],
    "evidence": "established",
    "authors": [
      "Su T",
      "Lai S",
      "Lee A",
      "He X",
      "Chen S"
    ],
    "year": 2018,
    "journal": "Journal of gastroenterology",
    "doi": "10.1007/s00535-017-1371-9",
    "pmid": "28770351",
    "url": "https://doi.org/10.1007/s00535-017-1371-9",
    "verified": true,
    "takeaways": [
      "Nineteen articles with 7,055 subjects were pooled with a random-effects model.",
      "PPI use was associated with SIBO (OR 1.71, 95% CI 1.20-2.43).",
      "Subgroups using small-bowel aspirate culture and glucose hydrogen breath tests were both significant.",
      "The authors conclude PPIs moderately increase SIBO risk and call for appropriate prescribing; heterogeneity and publication bias were assessed."
    ],
    "facts": {
      "design": "meta-analysis"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:sibo",
        "note": "Moderate association of PPI with SIBO across diagnostic tests."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:ppi-therapy"
      },
      {
        "rel": "evidence-for",
        "to": "state:hypochlorhydria"
      }
    ]
  },
  {
    "id": "article:ratuapli-2012-ppi-sibo-breath-test",
    "type": "article",
    "name": "Proton pump inhibitor therapy use does not predispose to small intestinal bacterial overgrowth",
    "aliases": [
      "Ratuapli 2012"
    ],
    "summary": "Large retrospective breath-test study (n=1,191): PPI use was not associated with positive glucose breath tests, which tracked age and antidiarrheal use instead.",
    "body": [
      "Counterpoint to [[article:lo-2013-ppi-sibo-meta-analysis]]: with glucose breath tests, [[intervention:ppi-therapy|PPIs]] use did not predict [[intervention:sibo-breath-test]] positivity. The question of PPI-induced SIBO therefore depends on test choice."
    ],
    "evidence": "plausible",
    "authors": [
      "Ratuapli SK",
      "Ellington TG",
      "O'Neill MT",
      "Umar SB",
      "Harris LA",
      "Foxx-Orenstein AE",
      "Burdick GE",
      "Dibaise JK",
      "Lacy BE",
      "Crowell MD"
    ],
    "year": 2012,
    "journal": "The American journal of gastroenterology",
    "doi": "10.1038/ajg.2012.4",
    "pmid": "22334250",
    "url": "https://doi.org/10.1038/ajg.2012.4",
    "verified": true,
    "takeaways": [
      "Glucose hydrogen/methane breath tests from 2004-2010 were reviewed in 1,191 patients, 48% on PPIs.",
      "Positivity did not differ between PPI users and nonusers under any of four diagnostic criteria.",
      "Positive tests were associated with older age and antidiarrheal use (H2>20), and with diarrhea (H2>10).",
      "The authors call it an adequately powered equivalence-type study showing no link, although it is retrospective and breath test-based."
    ],
    "facts": {
      "design": "cohort",
      "population": "1,191 patients referred for glucose breath testing"
    },
    "relations": [
      {
        "rel": "evidence-against",
        "to": "intervention:ppi-therapy",
        "note": "No association between PPI use and glucose breath-test SIBO."
      },
      {
        "rel": "evidence-against",
        "to": "state:hypochlorhydria",
        "note": "Acid suppression did not predict positive glucose breath tests."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:sibo-breath-test",
        "note": "Shows what breath-test positivity did track (age, diarrhea)."
      }
    ]
  },
  {
    "id": "article:jacobs-2013-dysmotility-ppi-overgrowth",
    "type": "article",
    "name": "Dysmotility and proton pump inhibitor use are independent risk factors for small intestinal bacterial and/or fungal overgrowth",
    "aliases": [
      "Jacobs 2013"
    ],
    "summary": "In 150 patients with unexplained GI symptoms, duodenal overgrowth (bacterial or fungal) was found in 63%; PPI use and dysmotility were independent risk factors, symptoms were not predictive.",
    "body": [
      "Provides manometric evidence that dysmotility and [[intervention:ppi-therapy|PPIs]] each raise overgrowth risk ([[disease:sibo]], [[state:gastric-dysmotility]]). The study is from a referral centre and the symptom profile was similar with or without overgrowth, so belching or bloating alone cannot identify it."
    ],
    "evidence": "plausible",
    "authors": [
      "Jacobs C",
      "Coss Adame E",
      "Attaluri A",
      "Valestin J",
      "Rao SS"
    ],
    "year": 2013,
    "journal": "Alimentary pharmacology & therapeutics",
    "doi": "10.1111/apt.12304",
    "pmid": "23574267",
    "url": "https://doi.org/10.1111/apt.12304",
    "verified": true,
    "takeaways": [
      "All 150 underwent 24-hour antroduodenal manometry with simultaneous duodenal aspirate culture.",
      "Overgrowth occurred in 94 of 150: 40% bacterial, 26% fungal (Candida) and 34% mixed.",
      "PPI use (P=0.0063) and dysmotility (P=0.0003) were each independent risk factors, but together did not add risk.",
      "Symptom profiles did not differ between those with and without overgrowth, so diagnosis requires testing."
    ],
    "facts": {
      "design": "cohort",
      "population": "150 symptomatic patients, tertiary centre"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:sibo",
        "note": "Both PPI use and dysmotility independently predict overgrowth."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:ppi-therapy",
        "note": "PPI use was an independent risk factor for overgrowth."
      },
      {
        "rel": "evidence-for",
        "to": "state:gastric-dysmotility",
        "note": "Dysmotility (impaired MMC and antroduodenal activity) was an independent risk factor."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:sibo-breath-test",
        "note": "Symptoms were poor predictors, supporting objective testing."
      }
    ]
  },
  {
    "id": "article:pimentel-2020-acg-sibo-guideline",
    "type": "article",
    "name": "ACG Clinical Guideline: Small Intestinal Bacterial Overgrowth",
    "aliases": [
      "Pimentel 2020 (ACG)"
    ],
    "summary": "ACG guideline on small intestinal bacterial overgrowth defining it as excess bacteria in the small bowel causing symptoms and addressing diagnostic criteria, testing and treatment using GRADE.",
    "body": [
      "Reference for the standard of care in [[disease:sibo]] diagnosis. Read with the breath-test consensus ([[article:rezaie-2017-breath-test-consensus]]) and the AGA update ([[article:quigley-2020-aga-sibo]]); detailed recommendations are in the full text ([[intervention:sibo-breath-test]])."
    ],
    "evidence": "established",
    "authors": [
      "Pimentel M",
      "Saad RJ",
      "Long MD",
      "Rao SSC"
    ],
    "year": 2020,
    "journal": "The American journal of gastroenterology",
    "doi": "10.14309/ajg.0000000000000501",
    "pmid": "32023228",
    "url": "https://doi.org/10.14309/ajg.0000000000000501",
    "verified": true,
    "takeaways": [
      "SIBO is defined as the presence of excessive numbers of bacteria in the small bowel causing GI symptoms.",
      "The guideline evaluates diagnostic criteria, optimal testing and treatment options using GRADE.",
      "Where evidence did not allow formal GRADE recommendations, expert-consensus key concepts were developed.",
      "It is the US reference for when and how to test for SIBO."
    ],
    "facts": {
      "design": "guideline"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:sibo",
        "note": "Formal US guideline for SIBO."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:sibo-breath-test",
        "note": "Addresses breath-test and other diagnostic methods."
      }
    ]
  },
  {
    "id": "article:rezaie-2017-breath-test-consensus",
    "type": "article",
    "name": "Hydrogen and Methane-Based Breath Testing in Gastrointestinal Disorders: The North American Consensus",
    "aliases": [
      "Rezaie 2017"
    ],
    "summary": "North American consensus on hydrogen and methane breath testing: glucose or lactulose tests are the least invasive SIBO diagnostics, with a hydrogen rise of 20 ppm or more by 90 minutes as positive.",
    "body": [
      "Defines how [[intervention:sibo-breath-test]] should be done and read when investigating [[disease:sibo]]. Thresholds are expert consensus, and test accuracy remains imperfect."
    ],
    "evidence": "established",
    "authors": [
      "Rezaie A",
      "Buresi M",
      "Lembo A",
      "Lin H",
      "McCallum R",
      "Rao S",
      "Schmulson M",
      "Valdovinos M",
      "Zakko S",
      "Pimentel M"
    ],
    "year": 2017,
    "journal": "The American journal of gastroenterology",
    "doi": "10.1038/ajg.2017.46",
    "pmid": "28323273",
    "url": "https://doi.org/10.1038/ajg.2017.46",
    "verified": true,
    "takeaways": [
      "A ten-expert live meeting and working-group vote reached consensus on 26 of 28 statements about indications, preparation, performance and interpretation.",
      "Glucose and lactulose breath tests remain the least invasive ways to diagnose SIBO; doses were set at 75 g glucose and 10 g lactulose.",
      "A hydrogen rise of at least 20 ppm by 90 minutes is positive for SIBO and methane of 10 ppm or more is methane-positive.",
      "Breath tests are useful for gas/bloating evaluation but not for oro-cecal transit; SIBO should be excluded before testing for carbohydrate malabsorption."
    ],
    "facts": {
      "design": "consensus"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:sibo-breath-test",
        "note": "Standardises indications, doses and thresholds."
      },
      {
        "rel": "evidence-for",
        "to": "disease:sibo",
        "note": "Consensus on how to diagnose SIBO with breath tests."
      }
    ]
  },
  {
    "id": "article:quigley-2020-aga-sibo",
    "type": "article",
    "name": "AGA Clinical Practice Update on Small Intestinal Bacterial Overgrowth: Expert Review",
    "aliases": [
      "Quigley 2020 (AGA)"
    ],
    "summary": "AGA Clinical Practice Update: SIBO lacks a precise definition; traditional symptoms are bloating, diarrhea and abdominal pain; normal small-bowel microbiota is poorly understood.",
    "body": [
      "Cautionary expert review that SIBO is loosely defined and over-diagnosed given ready access to breath tests ([[disease:sibo]]). It does not list belching ([[outcome:belching]]) among classical symptoms, though belching can coexist with bloating."
    ],
    "evidence": "established",
    "authors": [
      "Quigley EMM",
      "Murray JA",
      "Pimentel M"
    ],
    "year": 2020,
    "journal": "Gastroenterology",
    "doi": "10.1053/j.gastro.2020.06.090",
    "pmid": "32679220",
    "url": "https://doi.org/10.1053/j.gastro.2020.06.090",
    "verified": true,
    "takeaways": [
      "SIBO is applied to symptoms, signs or lab abnormalities attributed to changed numbers or composition of small-bowel bacteria; the definition lacks precision.",
      "Traditional symptoms are bloating, diarrhea and abdominal pain or discomfort, with steatorrhea in severe cases; belching is not listed.",
      "Fecal calprotectin and other inflammatory markers lack evidence for detecting SIBO.",
      "Lab findings can include elevated folate and, less often, vitamin B12 deficiency; the true prevalence is undefined."
    ],
    "facts": {
      "design": "guideline"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:sibo",
        "note": "Critical appraisal of SIBO definition, symptoms and prevalence."
      },
      {
        "rel": "evidence-against",
        "to": "outcome:belching",
        "note": "Belching is not among the traditionally listed SIBO symptoms."
      },
      {
        "rel": "evidence-for",
        "to": "system:gut-microbiota",
        "note": "Notes limited knowledge of normal small-intestinal flora."
      }
    ]
  },
  {
    "id": "article:gurusamy-2021-sibo-functional-dyspepsia",
    "type": "article",
    "name": "Small Intestinal Bacterial Overgrowth in Functional Dyspepsia: A Systematic Review and Meta-Analysis",
    "aliases": [
      "Gurusamy 2021"
    ],
    "summary": "Meta-analysis of seven studies: SIBO was more frequent in functional dyspepsia (OR 4.3) but the evidence is low quality, and prevalence depends on glucose versus lactulose testing.",
    "body": [
      "Relevant to the claim that upper-gut dysfunction and [[disease:sibo]] go together. The link is statistically fragile and depends on the type of [[intervention:sibo-breath-test]]; gastric motility was not directly measured."
    ],
    "evidence": "established",
    "authors": [
      "Gurusamy SR",
      "Shah A",
      "Talley NJ",
      "Koloski N",
      "Jones MP",
      "Walker MM",
      "Morrison M",
      "Holtmann G"
    ],
    "year": 2021,
    "journal": "The American journal of gastroenterology",
    "doi": "10.14309/ajg.0000000000001197",
    "pmid": "33734110",
    "url": "https://doi.org/10.14309/ajg.0000000000001197",
    "verified": true,
    "takeaways": [
      "Seven studies with 263 functional dyspepsia patients and 84 controls were included.",
      "Odds of SIBO were higher in FD (OR 4.3, 95% CI 1.1-17.5) with moderate heterogeneity; limiting to high-quality glucose breath-test case-control studies gave OR 2.8 (0.8-10.0), not significant.",
      "SIBO prevalence in FD was 53.4% with lactulose breath tests versus 17.2% with glucose breath tests.",
      "The authors judge the link suggestive but low quality."
    ],
    "facts": {
      "design": "meta-analysis"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:sibo",
        "note": "Suggestive association between SIBO and functional dyspepsia."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:sibo-breath-test",
        "note": "Test choice changes the apparent prevalence by about three-fold."
      }
    ]
  },
  {
    "id": "article:gatta-2017-rifaximin-sibo-meta-analysis",
    "type": "article",
    "name": "Systematic review with meta-analysis: rifaximin is effective and safe for the treatment of small intestine bacterial overgrowth",
    "aliases": [
      "Gatta 2017"
    ],
    "summary": "Meta-analysis of 32 studies (n=1,331): rifaximin eradicated SIBO in about 71% with few adverse events (4.6%), but study quality was generally poor.",
    "body": [
      "Best pooled evidence for antibiotic treatment of [[disease:sibo]]. It provides the benchmark against which herbal approaches are compared ([[article:chedid-2014-herbal-vs-rifaximin]]); quality is poor ([[system:gut-microbiota]])."
    ],
    "evidence": "established",
    "authors": [
      "Gatta L",
      "Scarpignato C"
    ],
    "year": 2017,
    "journal": "Alimentary pharmacology & therapeutics",
    "doi": "10.1111/apt.13928",
    "pmid": "28078798",
    "url": "https://doi.org/10.1111/apt.13928",
    "verified": true,
    "takeaways": [
      "Thirty-two studies in 1,331 adults were pooled.",
      "Intention-to-treat eradication was 70.8% and per-protocol 72.9%, with high heterogeneity.",
      "Adverse events occurred in about 4.6%, and symptoms improved or resolved in around two-thirds of those with eradicated SIBO.",
      "Drug dose, study design and co-therapy were associated with eradication; the authors note the evidence base is poor and RCTs are needed."
    ],
    "facts": {
      "design": "meta-analysis",
      "population": "32 studies, 1,331 patients"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:sibo",
        "note": "Pharmacological benchmark for SIBO treatment."
      },
      {
        "rel": "evidence-for",
        "to": "system:gut-microbiota",
        "note": "Antibiotic treatment modulates small-bowel bacterial load."
      }
    ]
  },
  {
    "id": "article:chedid-2014-herbal-vs-rifaximin",
    "type": "article",
    "name": "Herbal therapy is equivalent to rifaximin for the treatment of small intestinal bacterial overgrowth",
    "aliases": [
      "Chedid 2014"
    ],
    "summary": "Retrospective tertiary-care comparison of 104 SIBO patients: herbal antimicrobial protocols cleared lactulose breath tests in 46% versus 34% with rifaximin, a non-significant difference.",
    "body": [
      "The main clinical study cited for herbal SIBO therapy. It is retrospective and the herbal products were multi-ingredient, so it cannot attribute effect to any single herb, such as berberine or oregano oil ([[disease:sibo]], [[intervention:sibo-breath-test]])."
    ],
    "evidence": "speculative",
    "authors": [
      "Chedid V",
      "Dhalla S",
      "Clarke JO",
      "Roland BC",
      "Dunbar KB",
      "Koh J",
      "Justino E",
      "Tomakin E",
      "Mullin GE"
    ],
    "year": 2014,
    "journal": "Global advances in health and medicine",
    "doi": "10.7453/gahmj.2014.019",
    "pmid": "24891990",
    "url": "https://doi.org/10.7453/gahmj.2014.019",
    "verified": true,
    "takeaways": [
      "Lactulose breath test-positive SIBO patients were offered rifaximin 1200 mg/day or herbal therapy for four weeks, with repeat testing.",
      "Of 37 on herbals, 46% had a negative follow-up test versus 34% of 67 rifaximin users (P=0.24).",
      "Adjusted odds of a negative test with herbals versus rifaximin were 1.85 (0.77-4.41); herbal rescue cleared 8 of 14 rifaximin non-responders.",
      "Adverse effects were more frequent with rifaximin, but the design was non-randomised, uncontrolled for placebo effects and used proprietary herbal mixtures."
    ],
    "facts": {
      "design": "cohort",
      "population": "104 SIBO patients (retrospective)"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:sibo",
        "note": "Suggests herbal antimicrobials may match rifaximin for breath-test clearance; low-quality evidence."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:sibo-breath-test",
        "note": "Outcome measure was repeat lactulose breath test, which can fluctuate."
      }
    ]
  },
  {
    "id": "article:vaezi-2017-ppi-complications",
    "type": "article",
    "name": "Complications of Proton Pump Inhibitor Therapy",
    "aliases": [
      "Vaezi 2017"
    ],
    "summary": "Evidence is inadequate to show PPIs causally produce most proposed adverse outcomes (residual confounding likely); use them for proven indications at the lowest effective dose.",
    "body": [
      "Balanced summary of the safety of [[intervention:ppi-therapy|PPIs]] and a useful brake on attributing every GI problem to acid suppression. Small-bowel effects are better dealt with in dedicated SIBO studies ([[disease:gerd]])."
    ],
    "evidence": "established",
    "authors": [
      "Vaezi MF",
      "Yang YX",
      "Howden CW"
    ],
    "year": 2017,
    "journal": "Gastroenterology",
    "doi": "10.1053/j.gastro.2017.04.047",
    "pmid": "28528705",
    "url": "https://doi.org/10.1053/j.gastro.2017.04.047",
    "verified": true,
    "takeaways": [
      "Reviews many proposed adverse consequences of PPI therapy and applies causality criteria.",
      "Evidence is inadequate to establish causal relationships for many of the proposed associations.",
      "Residual confounding and over-extrapolation of small effect sizes probably explain much of the current controversy.",
      "Patients with a proven indication should continue PPI at the lowest effective dose; escalation and chronic use in non-responders is discouraged."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:ppi-therapy",
        "note": "Balanced appraisal of PPI safety and appropriate use."
      },
      {
        "rel": "evidence-for",
        "to": "disease:gerd",
        "note": "Benefits in appropriate reflux indications outweigh unproven risks."
      }
    ]
  },
  {
    "id": "article:reimer-2009-ppi-rebound-acid",
    "type": "article",
    "name": "Proton-pump inhibitor therapy induces acid-related symptoms in healthy volunteers after withdrawal of therapy",
    "aliases": [
      "Reimer 2009"
    ],
    "summary": "RCT in 120 healthy volunteers: eight weeks of esomeprazole then placebo produced acid-related symptoms in 44% versus 15% on placebo during weeks 9-12, consistent with rebound acid hypersecretion.",
    "body": [
      "Shows that stopping [[intervention:ppi-therapy|PPIs]] therapy can cause temporary acid-related symptoms, a confounder when interpreting new upper-GI symptoms after PPI courses ([[pathway:gastric-acid-secretion]], [[state:hypochlorhydria]])."
    ],
    "evidence": "established",
    "authors": [
      "Reimer C",
      "Søndergaard B",
      "Hilsted L",
      "Bytzer P"
    ],
    "year": 2009,
    "journal": "Gastroenterology",
    "doi": "10.1053/j.gastro.2009.03.058",
    "pmid": "19362552",
    "url": "https://doi.org/10.1053/j.gastro.2009.03.058",
    "verified": true,
    "takeaways": [
      "120 healthy volunteers were randomised to 12 weeks of placebo or 8 weeks esomeprazole 40 mg/day followed by 4 weeks of placebo.",
      "Acid-related symptoms (heartburn, regurgitation, dyspepsia) were higher in the PPI group at weeks 10-12.",
      "Forty-four percent of the PPI group versus 15% of placebo had a relevant symptom in weeks 9-12.",
      "The authors infer rebound acid hypersecretion can induce PPI dependency."
    ],
    "facts": {
      "design": "RCT",
      "population": "120 healthy volunteers"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:gastric-acid-secretion",
        "note": "Rebound acid hypersecretion after PPI withdrawal."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:ppi-therapy",
        "note": "Withdrawal symptoms after short courses in healthy people."
      },
      {
        "rel": "evidence-for",
        "to": "state:hypochlorhydria",
        "note": "Acid suppression is reversible but followed by symptoms after stopping."
      }
    ]
  },
  {
    "id": "article:liao-2023-hpylori-sibo-meta-analysis",
    "type": "article",
    "name": "Helicobacter pylori infection and small intestinal bacterial overgrowth: a systematic review and meta-analysis",
    "aliases": [
      "Liao 2023"
    ],
    "summary": "Meta-analysis of eight studies (n=874): H. pylori infection was associated with SIBO (OR 1.82), mainly in younger patients, independent of PPI exposure.",
    "body": [
      "Supports checking for [[disease:h-pylori-infection]] when [[disease:sibo]] is suspected, without implying causation. Observational data."
    ],
    "evidence": "established",
    "authors": [
      "Liao L",
      "Su BB",
      "Xu SP"
    ],
    "year": 2023,
    "journal": "BMC microbiology",
    "doi": "10.1186/s12866-023-03063-w",
    "pmid": "38053022",
    "url": "https://doi.org/10.1186/s12866-023-03063-w",
    "verified": true,
    "takeaways": [
      "Ten datasets from eight observational studies with 874 adults were pooled.",
      "H. pylori infection was linked to higher odds of SIBO (OR 1.82, 95% CI 1.29-2.58) with mild heterogeneity.",
      "The association held in patients under 48 (OR 2.68) but not older patients (OR 1.15).",
      "It was not significantly affected by country, comorbidities, PPI exposure or testing method."
    ],
    "facts": {
      "design": "meta-analysis",
      "population": "8 observational studies, n=874"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:h-pylori-infection",
        "note": "H. pylori is associated with SIBO."
      },
      {
        "rel": "evidence-for",
        "to": "disease:sibo",
        "note": "A candidate cause or marker of upper-gut overgrowth, independent of PPI exposure."
      }
    ]
  },
  {
    "id": "article:wang-2024-hpylori-eradication-sibo",
    "type": "article",
    "name": "Influence of Helicobacter pylori Infection and Eradication on Small Intestinal Bacterial Overgrowth and Abdominal Symptoms",
    "aliases": [
      "Wang 2024"
    ],
    "summary": "In 102 patients, H. pylori positivity doubled SIBO (49% vs 25%) and eradication cleared SIBO in about two-thirds while symptom scores fell.",
    "body": [
      "Clinical cohort that links [[disease:h-pylori-infection]], [[disease:sibo]] and symptom burden, and shows improvement after [[intervention:h-pylori-eradication-therapy|H. pylori eradication]]. Uncontrolled, so it can reflect spontaneous change or regression."
    ],
    "evidence": "plausible",
    "authors": [
      "Wang X",
      "Zhu D",
      "Li S",
      "Dai Y",
      "Teng G",
      "Wang W"
    ],
    "year": 2024,
    "journal": "Digestive diseases and sciences",
    "doi": "10.1007/s10620-024-08279-y",
    "pmid": "38363519",
    "url": "https://doi.org/10.1007/s10620-024-08279-y",
    "verified": true,
    "takeaways": [
      "Patients with GI symptoms had 13C urea breath testing and lactulose hydrogen-methane breath testing.",
      "SIBO was present in 49.1% of H. pylori-positive versus 24.5% of negative patients; intestinal methanogen overgrowth 24.5% vs 8.2%.",
      "Patients with SIBO or IMO had higher symptom scores.",
      "After bismuth quadruple therapy in 50 patients, SIBO resolved in 66.7% and symptom scores fell from 2 to 0 (P<0.001); the study was uncontrolled."
    ],
    "facts": {
      "design": "cohort",
      "population": "102 patients with GI symptoms"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:h-pylori-infection",
        "note": "Prevalence of SIBO higher with H. pylori infection."
      },
      {
        "rel": "evidence-for",
        "to": "disease:sibo",
        "note": "SIBO often resolves after eradication."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:h-pylori-eradication-therapy",
        "note": "Eradication was followed by SIBO clearance and symptom relief in this cohort."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:sibo-breath-test",
        "note": "Lactulose breath test used for SIBO and IMO."
      }
    ]
  },
  {
    "id": "article:malfertheiner-2022-maastricht-vi",
    "type": "article",
    "name": "Management of Helicobacter pylori infection: the Maastricht VI/Florence consensus report",
    "aliases": [
      "Maastricht VI"
    ],
    "summary": "Maastricht VI/Florence consensus: H. pylori infection is an infectious disease to treat in all infected patients, with updated testing, treatment, cancer-prevention and microbiota advice.",
    "body": [
      "Authoritative European guideline for [[disease:h-pylori-infection]]. Ulcer patients ([[disease:peptic-ulcer]]) with infection should receive [[intervention:h-pylori-eradication-therapy|H. pylori eradication]], and cure should be confirmed."
    ],
    "evidence": "established",
    "authors": [
      "Malfertheiner P",
      "Megraud F",
      "Rokkas T",
      "Gisbert JP",
      "Liou JM",
      "Schulz C",
      "Gasbarrini A",
      "Hunt RH",
      "Leja M",
      "O'Morain C",
      "et al."
    ],
    "year": 2022,
    "journal": "Gut",
    "doi": "10.1136/gutjnl-2022-327745",
    "pmid": "35944925",
    "url": "https://doi.org/10.1136/gutjnl-2022-327745",
    "verified": true,
    "takeaways": [
      "H. pylori infection is formally an infectious disease in the ICD-11, supporting treating all infected patients.",
      "Recommendations cover clinical indications, diagnosis, treatment, gastric cancer prevention, and H. pylori and the gut microbiota.",
      "Rising antibiotic resistance demands susceptibility testing and careful choice of first-line and rescue therapies.",
      "Forty-one experts from 29 countries voted in five working groups."
    ],
    "facts": {
      "design": "consensus"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:h-pylori-infection",
        "note": "European consensus on management."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:h-pylori-eradication-therapy",
        "note": "Guidance for treatment regimens and testing."
      },
      {
        "rel": "evidence-for",
        "to": "disease:peptic-ulcer",
        "note": "Ulcer disease is a core indication."
      }
    ]
  },
  {
    "id": "article:chey-2024-acg-h-pylori-treatment",
    "type": "article",
    "name": "ACG Clinical Guideline: Treatment of Helicobacter pylori Infection",
    "aliases": [
      "Chey 2024 (ACG)"
    ],
    "summary": "ACG 2024 guideline: bismuth quadruple therapy for 14 days is the preferred first-line regimen when susceptibility is unknown, with test-of-cure after treatment.",
    "body": [
      "US standard for [[intervention:h-pylori-eradication-therapy|H. pylori eradication]]. Relevant when someone with a past ulcer wants to be sure the bacterium was eradicated: the guideline recommends post-treatment testing ([[disease:h-pylori-infection]], [[disease:peptic-ulcer]])."
    ],
    "evidence": "established",
    "authors": [
      "Chey WD",
      "Howden CW",
      "Moss SF",
      "Morgan DR",
      "Greer KB",
      "Grover S",
      "Shah SC"
    ],
    "year": 2024,
    "journal": "The American journal of gastroenterology",
    "doi": "10.14309/ajg.0000000000002968",
    "pmid": "39626064",
    "url": "https://doi.org/10.14309/ajg.0000000000002968",
    "verified": true,
    "takeaways": [
      "For treatment-naive patients, 14-day bismuth quadruple therapy is preferred when antibiotic susceptibility is unknown.",
      "Rifabutin triple therapy or potassium-competitive acid blocker dual therapy for 14 days are suitable alternatives without penicillin allergy.",
      "Optimised bismuth quadruple therapy is preferred in treatment-experienced patients; clarithromycin or levofloxacin salvage only if susceptibility is confirmed.",
      "The CPG recommends universal post-treatment test-of-cure."
    ],
    "facts": {
      "design": "guideline"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:h-pylori-eradication-therapy",
        "note": "Current North American treatment recommendations."
      },
      {
        "rel": "evidence-for",
        "to": "disease:h-pylori-infection",
        "note": "Defines who to test and the need to confirm cure."
      },
      {
        "rel": "evidence-for",
        "to": "disease:peptic-ulcer",
        "note": "Infection causes dyspepsia, peptic ulcer disease and gastric cancer."
      }
    ]
  },
  {
    "id": "article:weeks-2000-urei-h-pylori-urease",
    "type": "article",
    "name": "A H+-gated urea channel: the link between Helicobacter pylori urease and gastric colonization",
    "aliases": [
      "Weeks 2000"
    ],
    "summary": "Showed acid triggers H. pylori cytoplasmic urease via UreI, an H+-gated urea channel, which is essential for acid resistance and gastric colonization.",
    "body": [
      "Mechanistic basis for [[enzyme:h-pylori-urease|H. pylori urease]] and acid resistance in [[disease:h-pylori-infection]]. Urease hydrolyses urea to ammonia and [[compound:carbon-dioxide]] (standard enzymology); this paper does not address gas production or belching."
    ],
    "evidence": "established",
    "authors": [
      "Weeks DL",
      "Eskandari S",
      "Scott DR",
      "Sachs G"
    ],
    "year": 2000,
    "journal": "Science (New York, N.Y.)",
    "doi": "10.1126/science.287.5452.482",
    "pmid": "10642549",
    "url": "https://doi.org/10.1126/science.287.5452.482",
    "verified": true,
    "takeaways": [
      "Acidic media trigger cytoplasmic urease activity in H. pylori; deleting ureI prevents the activation required for acid resistance.",
      "UreI is an inner membrane protein with six transmembrane segments that forms an acid-stimulated, urea-specific passive channel.",
      "Mutation of periplasmic histidine 123 abolishes the stimulation.",
      "UreI therefore regulates urease so that the organism can survive in the stomach."
    ],
    "facts": {
      "design": "in-vitro"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "enzyme:h-pylori-urease",
        "note": "Defines how acid regulates urease activity and bacterial survival."
      },
      {
        "rel": "evidence-for",
        "to": "disease:h-pylori-infection",
        "note": "Urease-dependent acid resistance is key to colonization."
      }
    ]
  },
  {
    "id": "article:lanas-2017-peptic-ulcer-disease",
    "type": "article",
    "name": "Peptic ulcer disease",
    "aliases": [
      "Lanas 2017"
    ],
    "summary": "Lancet seminar: peptic ulcer prevalence has fallen with H. pylori decline and acid-suppressing drugs, but management is harder because of antibiotic resistance and anti-thrombotic therapy.",
    "body": [
      "Overview of [[disease:peptic-ulcer]] causes (H. pylori, NSAIDs, others) and therapy. It is the clinical context for people with an ulcer history and for deciding when [[intervention:ppi-therapy|PPIs]] or eradication is needed ([[disease:h-pylori-infection]])."
    ],
    "evidence": "established",
    "authors": [
      "Lanas A",
      "Chan FKL"
    ],
    "year": 2017,
    "journal": "Lancet (London, England)",
    "doi": "10.1016/S0140-6736(16)32404-7",
    "pmid": "28242110",
    "url": "https://doi.org/10.1016/S0140-6736(16)32404-7",
    "verified": true,
    "takeaways": [
      "The declining prevalence of H. pylori and widespread potent antisecretory drugs have made peptic ulcer disease less common than two decades ago.",
      "Management has become more challenging because of rising antimicrobial resistance and complex anti-thrombotic therapy in an ageing population.",
      "Ulcers unrelated to H. pylori or NSAIDs now pose diagnostic and therapeutic problems.",
      "The seminar reviews pathogenesis, H. pylori guidelines, and treatment of NSAID- and antithrombotic-related complications."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:peptic-ulcer",
        "note": "Current overview of pathogenesis and management."
      },
      {
        "rel": "evidence-for",
        "to": "disease:h-pylori-infection",
        "note": "Major cause of ulcer; guidelines for therapy."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:ppi-therapy",
        "note": "Potent antisecretory drugs reduce ulcer burden."
      }
    ]
  },
  {
    "id": "article:ford-2016-hpylori-eradication-ulcer-cochrane",
    "type": "article",
    "name": "Eradication therapy for peptic ulcer disease in Helicobacter pylori-positive people",
    "aliases": [
      "Ford 2016 (Cochrane)"
    ],
    "summary": "Cochrane review of 55 trials: H. pylori eradication heals duodenal ulcers better than ulcer-healing drugs alone and prevents recurrence of duodenal and gastric ulcer versus no treatment.",
    "body": [
      "Key meta-analysis behind ulcer practice: [[intervention:h-pylori-eradication-therapy|H. pylori eradication]] improves [[outcome:ulcer-healing]] and recurrence prevention in [[disease:peptic-ulcer]], with some uncertainty for gastric ulcer healing."
    ],
    "evidence": "established",
    "authors": [
      "Ford AC",
      "Gurusamy KS",
      "Delaney B",
      "Forman D",
      "Moayyedi P"
    ],
    "year": 2016,
    "journal": "The Cochrane database of systematic reviews",
    "doi": "10.1002/14651858.CD003840.pub5",
    "pmid": "27092708",
    "url": "https://doi.org/10.1002/14651858.CD003840.pub5",
    "verified": true,
    "takeaways": [
      "Fifty-five trials were analysed for ulcer healing and recurrence in H. pylori-positive patients.",
      "For duodenal ulcer healing, eradication plus ulcer-healing drug was superior to the drug alone (RR persisting 0.66) and to no treatment (RR 0.37); evidence low quality.",
      "Eradication prevented recurrence versus no treatment (duodenal RR 0.20; gastric RR 0.31), though quality was very low.",
      "There was no evidence that eradication helps gastric ulcer healing, or prevents duodenal recurrence better than maintenance ulcer-healing drugs; confidence intervals were wide."
    ],
    "facts": {
      "design": "meta-analysis"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:h-pylori-eradication-therapy",
        "note": "Eradication heals duodenal ulcers and prevents recurrence."
      },
      {
        "rel": "evidence-for",
        "to": "disease:peptic-ulcer",
        "note": "Evidence base for treating H. pylori in ulcer disease."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:ulcer-healing",
        "note": "Healing outcomes by regimen."
      }
    ]
  },
  {
    "id": "article:scally-2018-gastroprotectants-meta-analysis",
    "type": "article",
    "name": "Effects of gastroprotectant drugs for the prevention and treatment of peptic ulcer disease and its complications: a meta-analysis of randomised trials",
    "aliases": [
      "Scally 2018"
    ],
    "summary": "Meta-analysis of 849 trials (142,485 people): PPIs beat H2 blockers and prostaglandin analogues for ulcer healing (OR 5.2) and bleeding prevention, though small-study bias may inflate benefit.",
    "body": [
      "Benchmark for [[outcome:ulcer-healing]] and the standing of [[intervention:ppi-therapy|PPIs]]; it provides the comparator against which nutraceutical gastroprotectants must be judged ([[disease:peptic-ulcer]])."
    ],
    "evidence": "established",
    "authors": [
      "Scally B",
      "Emberson JR",
      "Spata E",
      "Reith C",
      "Davies K",
      "Halls H",
      "Holland L",
      "Wilson K",
      "Bhala N",
      "Hawkey C",
      "et al."
    ],
    "year": 2018,
    "journal": "The lancet. Gastroenterology & hepatology",
    "doi": "10.1016/S2468-1253(18)30037-2",
    "pmid": "29475806",
    "url": "https://doi.org/10.1016/S2468-1253(18)30037-2",
    "verified": true,
    "takeaways": [
      "Pooled data from 849 randomised trials of gastroprotectants versus control or each other.",
      "In prevention trials gastroprotectants reduced endoscopic ulcers (OR 0.27), symptomatic ulcers and upper GI bleeding; mortality was not significantly reduced.",
      "In healing trials all classes improved ulcer healing (OR 3.49) with PPIs more effective (OR 5.22) than H2 antagonists (3.80) and prostaglandin analogues (2.27).",
      "The authors note benefits may be overestimated because of small-study bias."
    ],
    "facts": {
      "design": "meta-analysis"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:ppi-therapy",
        "note": "Most effective drug class for ulcer healing and bleeding prevention."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:ulcer-healing",
        "note": "Quantifies healing with different gastroprotectants."
      },
      {
        "rel": "evidence-for",
        "to": "disease:peptic-ulcer"
      }
    ]
  },
  {
    "id": "article:ford-2022-hpylori-eradication-functional-dyspepsia",
    "type": "article",
    "name": "Efficacy of Helicobacter pylori eradication therapy for functional dyspepsia: updated systematic review and meta-analysis",
    "aliases": [
      "Ford 2022"
    ],
    "summary": "Meta-analysis of 29 RCTs (n=6,781): H. pylori eradication modestly improved functional dyspepsia (NNT 9 for improvement, 14 for cure), with more adverse events.",
    "body": [
      "High-quality meta-analysis showing [[intervention:h-pylori-eradication-therapy|H. pylori eradication]] helps some dyspepsia patients. It supports testing for [[disease:h-pylori-infection]] in persistent upper-GI symptoms, with realistic expectations ([[state:gastric-dysmotility]])."
    ],
    "evidence": "established",
    "authors": [
      "Ford AC",
      "Tsipotis E",
      "Yuan Y",
      "Leontiadis GI",
      "Moayyedi P"
    ],
    "year": 2022,
    "journal": "Gut",
    "doi": "10.1136/gutjnl-2021-326583",
    "pmid": "35022266",
    "url": "https://doi.org/10.1136/gutjnl-2021-326583",
    "verified": true,
    "takeaways": [
      "Twenty-nine RCTs of eradication therapy in H. pylori-positive functional dyspepsia with at least 3 months' follow-up were pooled.",
      "Eradication beat control for symptom cure (RR not cured 0.91; NNT 14) and improvement (RR 0.84; NNT 9).",
      "The effect was larger when eradication was successful (RR 0.65; NNT 4.5).",
      "Adverse events were more common with eradication (RR 2.19), so the benefit is modest."
    ],
    "facts": {
      "design": "meta-analysis"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:h-pylori-eradication-therapy",
        "note": "Modest benefit in H. pylori-positive functional dyspepsia."
      },
      {
        "rel": "evidence-for",
        "to": "disease:h-pylori-infection"
      },
      {
        "rel": "evidence-for",
        "to": "state:gastric-dysmotility",
        "note": "Functional dyspepsia with H. pylori may involve dysmotility; improvement is modest."
      }
    ]
  },
  {
    "id": "article:mahmood-2007-zinc-carnosine-gut-integrity",
    "type": "article",
    "name": "Zinc carnosine, a health food supplement that stabilises small bowel integrity and stimulates gut repair processes",
    "aliases": [
      "Mahmood 2007"
    ],
    "summary": "Zinc carnosine promoted epithelial migration and proliferation in vitro, reduced gastric and small-intestinal injury in rodents, and prevented indomethacin-induced permeability rise in 10 volunteers.",
    "body": [
      "Often-cited mechanistic work for [[intervention:zinc-carnosine]] (polaprezinc). Human data are limited to a 10-person permeability crossover with NSAID-induced injury; ulcer healing in people ([[outcome:ulcer-healing]]) is addressed by later trials."
    ],
    "evidence": "plausible",
    "authors": [
      "Mahmood A",
      "FitzGerald AJ",
      "Marchbank T",
      "Ntatsaki E",
      "Murray D",
      "Ghosh S",
      "Playford RJ"
    ],
    "year": 2007,
    "journal": "Gut",
    "doi": "10.1136/gut.2006.099929",
    "pmid": "16777920",
    "url": "https://doi.org/10.1136/gut.2006.099929",
    "verified": true,
    "takeaways": [
      "In cell assays zinc carnosine stimulated migration and proliferation of gut epithelial cells about three-fold.",
      "Given orally it reduced gastric damage by about 75% and small-intestinal damage by about 50% in rat and mouse models.",
      "In a randomised crossover of 10 healthy volunteers, co-administration (37.5 mg twice daily) prevented the three-fold rise in gut permeability caused by five days of indomethacin.",
      "Authors call for further studies; the human part was small and short."
    ],
    "facts": {
      "design": "RCT",
      "population": "10 healthy volunteers (human arm); rodents and cell lines"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:zinc-carnosine",
        "note": "Preclinical and small human data that zinc carnosine stabilises gut mucosa."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:ulcer-healing",
        "note": "Reduced experimental gastric injury in rats; human ulcer healing not tested."
      },
      {
        "rel": "evidence-for",
        "to": "system:gastric-physiology",
        "note": "Epithelial migration and barrier effects."
      }
    ]
  },
  {
    "id": "article:hewlings-2020-zinc-carnosine-review",
    "type": "article",
    "name": "A Review of Zinc-L-Carnosine and Its Positive Effects on Oral Mucositis, Taste Disorders, and Gastrointestinal Disorders",
    "aliases": [
      "Hewlings & Kalman 2020"
    ],
    "summary": "Narrative review of zinc-L-carnosine (polaprezinc): used for gastric ulcers in Japan, with anti-inflammatory and antioxidant mechanisms and expanding evidence for mucositis and taste disorders.",
    "body": [
      "Convenient summary for [[intervention:zinc-carnosine]] but narrative rather than systematic and mucositis-oriented. The ulcer claims rest on Japanese trials, such as [[article:shen-2022-polaprezinc-vs-rebamipide]] ([[outcome:ulcer-healing]])."
    ],
    "evidence": "plausible",
    "authors": [
      "Hewlings S",
      "Kalman D"
    ],
    "year": 2020,
    "journal": "Nutrients",
    "doi": "10.3390/nu12030665",
    "pmid": "32121367",
    "url": "https://doi.org/10.3390/nu12030665",
    "verified": true,
    "takeaways": [
      "Zinc-L-carnosine (polaprezinc, marketed as PepZin GI) is a chelate of L-carnosine and zinc.",
      "Studies support benefits for restoring the gastric lining, other GI disorders, taste disorders and oral mucositis.",
      "Mechanisms are described as local and tied to anti-inflammatory and antioxidant functions.",
      "The review is non-systematic and its main focus is oral mucositis; it describes safety and efficacy as supported."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:zinc-carnosine",
        "note": "Overview of zinc carnosine as a mucosal protectant approved for gastric ulcer in Japan."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:ulcer-healing",
        "note": "Reports support for use in gastric ulcer."
      }
    ]
  },
  {
    "id": "article:shen-2022-polaprezinc-vs-rebamipide",
    "type": "article",
    "name": "Efficacy and safety of polaprezinc in the treatment of gastric ulcer: A multicenter, randomized, double-blind, double-dummy, positive-controlled clinical trial",
    "aliases": [
      "Shen 2022"
    ],
    "summary": "Multicentre RCT in 224 gastric ulcer patients: polaprezinc healed ulcers in 81.5% at 8 weeks versus 74.3% with rebamipide (not significantly different), with similar safety.",
    "body": [
      "Active-controlled RCT supporting [[intervention:zinc-carnosine]] as a gastric ulcer treatment ([[outcome:ulcer-healing]], [[disease:peptic-ulcer]]). It lacked a placebo arm and a PPI arm, so it cannot say how zinc carnosine compares with acid suppression."
    ],
    "evidence": "established",
    "authors": [
      "Shen W",
      "Zhao X",
      "Han Z",
      "Miao Y",
      "Huang H",
      "Zhang Z",
      "Dong L",
      "Nie Y",
      "Li H",
      "Ni R"
    ],
    "year": 2022,
    "journal": "Medical engineering & physics",
    "doi": "10.1016/j.medengphy.2022.103860",
    "pmid": "35999163",
    "url": "https://doi.org/10.1016/j.medengphy.2022.103860",
    "verified": true,
    "takeaways": [
      "Two hundred twenty-four patients with gastric ulcer in 10 centres were randomised to polaprezinc or rebamipide for 8 weeks.",
      "Gastroscopy-confirmed effective rate was 81.48% with polaprezinc and 74.31% with rebamipide (P=0.156).",
      "GI symptom improvement at 4 and 8 weeks was comparable between groups.",
      "Adverse events and drug reactions were similar; the comparator was another mucosal protectant, not placebo or a PPI."
    ],
    "facts": {
      "design": "RCT",
      "population": "224 gastric ulcer patients, China"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:zinc-carnosine",
        "note": "Polaprezinc performed comparably to rebamipide for gastric ulcer healing."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:ulcer-healing",
        "note": "81% healing at 8 weeks on polaprezinc."
      },
      {
        "rel": "evidence-for",
        "to": "disease:peptic-ulcer",
        "note": "Gastric ulcer subtype."
      }
    ]
  },
  {
    "id": "article:mahmoud-2022-polaprezinc-hpylori-meta-analysis",
    "type": "article",
    "name": "Efficacy and Safety of Polaprezinc-Based Therapy versus the Standard Triple Therapy for Helicobacter pylori Eradication: A Systematic Review and Meta-Analysis of Randomized Controlled Trials",
    "aliases": [
      "Mahmoud 2022"
    ],
    "summary": "Meta-analysis of three RCTs (n=396): adding polaprezinc to standard triple therapy improved H. pylori eradication (ITT OR 2.01) without more adverse events, though evidence is scarce.",
    "body": [
      "Suggests [[intervention:zinc-carnosine]] may improve the success of [[intervention:h-pylori-eradication-therapy|H. pylori eradication]]. Only three small trials; it does not replace antibiotics for [[disease:h-pylori-infection]]."
    ],
    "evidence": "plausible",
    "authors": [
      "Mahmoud A",
      "Abuelazm M",
      "Ahmed AAS",
      "Abdalshafy H",
      "Abdelazeem B",
      "Brašić JR"
    ],
    "year": 2022,
    "journal": "Nutrients",
    "doi": "10.3390/nu14194126",
    "pmid": "36235778",
    "url": "https://doi.org/10.3390/nu14194126",
    "verified": true,
    "takeaways": [
      "Three randomised trials with 396 participants compared polaprezinc plus triple therapy (n=199) with triple therapy alone (n=197).",
      "Eradication odds were higher with polaprezinc (ITT OR 2.01; per-protocol OR 2.65).",
      "Total adverse events did not differ (OR 1.06).",
      "The authors present it as a possible antibiotic-sparing adjuvant but stress larger trials are needed."
    ],
    "facts": {
      "design": "meta-analysis",
      "population": "3 RCTs, n=396"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:zinc-carnosine",
        "note": "Adjuvant polaprezinc improved eradication rates in a small meta-analysis."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:h-pylori-eradication-therapy",
        "note": "Polaprezinc as an add-on to triple therapy."
      },
      {
        "rel": "evidence-for",
        "to": "disease:h-pylori-infection"
      }
    ]
  },
  {
    "id": "article:morgan-1982-caved-s-vs-cimetidine",
    "type": "article",
    "name": "Comparison between cimetidine and Caved-S in the treatment of gastric ulceration, and subsequent maintenance therapy",
    "aliases": [
      "Morgan 1982"
    ],
    "summary": "Single-blind trial in 100 gastric ulcer patients: Caved-S (a deglycyrrhizinated liquorice preparation) healed ulcers like cimetidine (63% at 6 weeks, 91% at 12 weeks).",
    "body": [
      "Positive comparative data for [[intervention:dgl-licorice]], but without a placebo. The earlier double-blind, placebo-controlled test by [[article:engqvist-1973-dgl-gastric-ulcer]] was negative, and the product studied is reported to be a mixture rather than DGL alone ([[outcome:ulcer-healing]], [[disease:peptic-ulcer]])."
    ],
    "evidence": "plausible",
    "authors": [
      "Morgan AG",
      "McAdam WA",
      "Pacsoo C",
      "Darnborough A"
    ],
    "year": 1982,
    "journal": "Gut",
    "doi": "10.1136/gut.23.6.545",
    "pmid": "7042486",
    "url": "https://doi.org/10.1136/gut.23.6.545",
    "verified": true,
    "takeaways": [
      "One hundred patients with benign gastric ulcer received cimetidine 1 g/day or Caved-S six tablets daily; healing was assessed endoscopically.",
      "Healing was about 63% at six weeks and 91% at twelve weeks with no significant difference between the drugs.",
      "Cimetidine relieved night pain better in the first two weeks.",
      "In the maintenance phase 28 per group completed a year, with four recurrences (14%) in each group; the trial was single-blind and had no placebo arm."
    ],
    "facts": {
      "design": "controlled trial",
      "population": "100 gastric ulcer patients"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:dgl-licorice",
        "note": "DGL preparation (Caved-S) performed like cimetidine in an open comparison; the product is reported to contain antacid components."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:ulcer-healing",
        "note": "Healing rates equivalent to cimetidine."
      },
      {
        "rel": "evidence-for",
        "to": "disease:peptic-ulcer",
        "note": "Gastric ulcer subtype."
      }
    ]
  },
  {
    "id": "article:engqvist-1973-dgl-gastric-ulcer",
    "type": "article",
    "name": "Double-blind trial of deglycyrrhizinated liquorice in gastric ulcer",
    "aliases": [
      "Engqvist 1973"
    ],
    "summary": "Double-blind crossover of liquorice extract (Caved-S) 760 mg three times daily in chronic gastric ulcer found no healing effect over placebo.",
    "body": [
      "The negative placebo-controlled counterpart to [[article:morgan-1982-caved-s-vs-cimetidine]]. It argues the ulcer-healing claims for [[intervention:dgl-licorice]] are unsettled ([[outcome:ulcer-healing]], [[disease:peptic-ulcer]]). The trial is old and small."
    ],
    "evidence": "plausible",
    "authors": [
      "Engqvist A",
      "von Feilitzen F",
      "Pyk E",
      "Reichard H"
    ],
    "year": 1973,
    "journal": "Gut",
    "doi": "10.1136/gut.14.9.711",
    "pmid": "4584640",
    "url": "https://doi.org/10.1136/gut.14.9.711",
    "verified": true,
    "takeaways": [
      "Patients with chronic gastric ulcer received liquorice extract and placebo in two consecutive four-week periods in random order (38 patients, 47 ulcers, in period I).",
      "Dose was 760 mg three times daily.",
      "No tendency to quicker healing was seen in change of ulcer area or complete healing; small ulcers healed faster than large ones.",
      "No side effects were observed; the authors concluded they could not demonstrate any healing effect."
    ],
    "facts": {
      "design": "RCT",
      "population": "Chronic gastric ulcer patients, crossover"
    },
    "relations": [
      {
        "rel": "evidence-against",
        "to": "intervention:dgl-licorice",
        "note": "Placebo-controlled trial found no ulcer healing benefit of the DGL preparation."
      },
      {
        "rel": "evidence-against",
        "to": "outcome:ulcer-healing",
        "note": "No faster healing with DGL than placebo over four weeks."
      },
      {
        "rel": "evidence-for",
        "to": "disease:peptic-ulcer"
      }
    ]
  },
  {
    "id": "article:raveendra-2012-glycyrrhiza-glabra-functional-dyspepsia",
    "type": "article",
    "name": "An Extract of Glycyrrhiza glabra (GutGard) Alleviates Symptoms of Functional Dyspepsia: A Randomized, Double-Blind, Placebo-Controlled Study",
    "aliases": [
      "Raveendra 2012"
    ],
    "summary": "RCT of a Glycyrrhiza glabra extract (GutGard) 75 mg twice daily for 30 days in functional dyspepsia: symptom scores, global efficacy and quality of life improved versus placebo.",
    "body": [
      "A positive RCT of a licorice extract in functional dyspepsia ([[intervention:dgl-licorice]]). It addresses symptoms in functional dyspepsia rather than mucosal healing, and the product (GutGard) is a specific extract ([[state:gastric-dysmotility]])."
    ],
    "evidence": "plausible",
    "authors": [
      "Raveendra KR",
      "Jayachandra",
      "Srinivasa V",
      "Sushma KR",
      "Allan JJ",
      "Goudar KS",
      "Shivaprasad HN",
      "Venkateshwarlu K",
      "Geetharani P",
      "Sushma G",
      "et al."
    ],
    "year": 2012,
    "journal": "Evidence-based complementary and alternative medicine : eCAM",
    "doi": "10.1155/2012/216970",
    "pmid": "21747893",
    "url": "https://doi.org/10.1155/2012/216970",
    "verified": true,
    "takeaways": [
      "Patients with functional dyspepsia received GutGard or placebo for 30 days in a double-blind design.",
      "Total symptom scores fell significantly versus placebo at days 15 and 30.",
      "Global assessment of efficacy and Nepean Dyspepsia Index scores also improved versus placebo.",
      "GutGard was generally safe and well tolerated; whether the extract is the same as classic DGL is not stated in the abstract, and ulcers were not studied."
    ],
    "facts": {
      "design": "RCT",
      "population": "Functional dyspepsia patients"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:dgl-licorice",
        "note": "Licorice extract reduced dyspepsia symptoms; the preparation may not equal conventional DGL."
      },
      {
        "rel": "evidence-for",
        "to": "state:gastric-dysmotility",
        "note": "Symptomatic effect in functional dyspepsia, not a measured motility effect."
      }
    ]
  },
  {
    "id": "article:isbrucker-2006-licorice-glycyrrhizin-safety",
    "type": "article",
    "name": "Risk and safety assessment on the consumption of Licorice root (Glycyrrhiza sp.), its extract and powder as a food ingredient, with emphasis on the pharmacology and toxicology of glycyrrhizin",
    "aliases": [
      "Isbrucker & Burdock 2006"
    ],
    "summary": "Safety assessment: glycyrrhizin inhibits 11-beta-HSD and causes reversible mineralocorticoid-like effects at high intake; the authors propose an ADI of 0.015-0.229 mg/kg/day.",
    "body": [
      "Toxicology backing for the safety rationale of [[intervention:dgl-licorice]]: glycyrrhizin raises blood pressure risk, so the deglycyrrhizinated form is preferred. It does not itself test ulcer healing ([[outcome:ulcer-healing]])."
    ],
    "evidence": "established",
    "authors": [
      "Isbrucker RA",
      "Burdock GA"
    ],
    "year": 2006,
    "journal": "Regulatory toxicology and pharmacology : RTP",
    "doi": "10.1016/j.yrtph.2006.06.002",
    "pmid": "16884839",
    "url": "https://doi.org/10.1016/j.yrtph.2006.06.002",
    "verified": true,
    "takeaways": [
      "Licorice and glycyrrhizin are widely used; estimated intake in the US is 0.027-3.6 mg glycyrrhizin/kg/day.",
      "Glycyrrhizinates inhibit 11-beta-hydroxysteroid dehydrogenase, so continuous high exposure can produce hypermineralocorticoid-like effects, which reverse on withdrawal.",
      "Other studies report anti-ulcer, antiviral and hepatoprotective responses; glycyrrhizin is not teratogenic or mutagenic.",
      "Bioavailability from licorice is reduced, hampering dose-effect work; proposed ADI is 0.015-0.229 mg/kg/day."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:dgl-licorice",
        "note": "Explains why glycyrrhizin-removed licorice is used to avoid mineralocorticoid effects."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:ulcer-healing",
        "note": "Notes reported anti-ulcer responses without confirming clinical efficacy."
      }
    ]
  },
  {
    "id": "article:baggio-2007-maytenus-ilicifolia-gastroprotection",
    "type": "article",
    "name": "Flavonoid-rich fraction of Maytenus ilicifolia Mart. ex. Reiss protects the gastric mucosa of rodents through inhibition of both H+,K+ -ATPase activity and formation of nitric oxide",
    "aliases": [
      "Baggio 2007"
    ],
    "summary": "Flavonoid fraction of espinheira-santa (Maytenus ilicifolia) protected rat stomachs mainly by lowering acid secretion and inhibiting H+,K+-ATPase and nitric oxide, not by raising mucus.",
    "body": [
      "Preclinical evidence for espinheira-santa. Its protection is acid-suppressive (proton pump and nitric oxide), not an increase in mucus ([[pathway:gastric-acid-secretion]]), which cuts against descriptions of it as 'gastroprotective without affecting acid'. Intraperitoneal dosing in rodents, so human extrapolation is uncertain ([[outcome:ulcer-healing]])."
    ],
    "evidence": "plausible",
    "authors": [
      "Baggio CH",
      "Freitas CS",
      "Otofuji Gde M",
      "Cipriani TR",
      "Souza LM",
      "Sassaki GL",
      "Iacomini M",
      "Marques MC",
      "Mesia-Vela S"
    ],
    "year": 2007,
    "journal": "Journal of ethnopharmacology",
    "doi": "10.1016/j.jep.2007.06.015",
    "pmid": "17706386",
    "url": "https://doi.org/10.1016/j.jep.2007.06.015",
    "verified": true,
    "takeaways": [
      "The flavonoid-rich fraction protected rats from chronic and acute gastric lesions induced by acetic acid, ethanol and indomethacin.",
      "Protection occurred without altering glutathione or mucus amount in injured mucosa.",
      "It potently reduced gastric acid hypersecretion (ED50 7 mg/kg i.p.) with reduced nitric oxide release.",
      "It inhibited rabbit gastric H+,K+-ATPase in vitro (IC50 41 ug/mL), pointing to an acid-suppressing mechanism."
    ],
    "facts": {
      "design": "animal"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "outcome:ulcer-healing",
        "note": "Gastroprotection in rat ulcer models."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:gastric-acid-secretion",
        "note": "The fraction inhibited acid secretion and the proton pump, contradicting a purely mucus-stimulating narrative."
      },
      {
        "rel": "evidence-for",
        "to": "system:gastric-physiology",
        "note": "Mechanism involves H+,K+-ATPase and NO."
      }
    ]
  },
  {
    "id": "article:johnston-2006-pepsin-laryngeal-epithelium",
    "type": "article",
    "name": "Effect of pepsin on laryngeal stress protein (Sep70, Sep53, and Hsp70) response: role in laryngopharyngeal reflux disease",
    "aliases": [
      "Johnston 2006"
    ],
    "summary": "Pepsin was found in laryngeal tissue of reflux patients but not normal controls, with depletion of protective stress proteins; low pH alone induced them, while pepsin depleted them in cultured tissue.",
    "body": [
      "Mechanistic study explaining why pepsin on the larynx may cause injury beyond acid ([[disease:lpr]], [[outcome:throat-burning]]). Sample sizes are small and symptoms were not the endpoint, so it does not prove belching delivers pepsin to the throat."
    ],
    "evidence": "plausible",
    "authors": [
      "Johnston N",
      "Dettmar PW",
      "Lively MO",
      "Postma GN",
      "Belafsky PC",
      "Birchall M",
      "Koufman JA"
    ],
    "year": 2006,
    "journal": "The Annals of otology, rhinology, and laryngology",
    "doi": "10.1177/000348940611500108",
    "pmid": "16466100",
    "url": "https://doi.org/10.1177/000348940611500108",
    "verified": true,
    "takeaways": [
      "Laryngeal and esophageal specimens from normal controls and pH-documented LPR patients were analysed for stress proteins and pepsin.",
      "Pepsin was not detected in normal control tissue but was present in LPR patients' laryngeal epithelium and associated with depletion of the protective protein Sep70.",
      "In a porcine organ culture model low pH induced Sep70 and Sep53, but pepsin depleted them.",
      "Cultured cells took up pepsin by receptor-mediated endocytosis, suggesting a mechanism for cellular injury."
    ],
    "facts": {
      "design": "case-control"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:lpr",
        "note": "Pepsin in laryngeal tissue and stress-protein disruption in LPR patients."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:throat-burning",
        "note": "Plausible cellular mechanism for reflux-related laryngeal symptoms."
      },
      {
        "rel": "evidence-for",
        "to": "system:gastric-physiology",
        "note": "Pepsin from the stomach can reach and enter laryngeal cells."
      }
    ]
  },
  {
    "id": "article:koufman-2012-alkaline-water-pepsin",
    "type": "article",
    "name": "Potential benefits of pH 8.8 alkaline drinking water as an adjunct in the treatment of reflux disease",
    "aliases": [
      "Koufman 2012"
    ],
    "summary": "In vitro, pH 8.8 bicarbonate water irreversibly inactivated human pepsin and had strong acid-buffering capacity, suggesting a possible role as a reflux adjunct.",
    "body": [
      "In-vitro basis for alkaline rinsing/drinking in [[disease:lpr]], where inactivating pepsin on mucosa is the goal ([[outcome:throat-burning]]). No patients were studied, so it supports a mechanism, not efficacy. A dilute bicarbonate rinse differs from pH 8.8 artesian water."
    ],
    "evidence": "speculative",
    "authors": [
      "Koufman JA",
      "Johnston N"
    ],
    "year": 2012,
    "journal": "The Annals of otology, rhinology, and laryngology",
    "doi": "10.1177/000348941212100702",
    "pmid": "22844861",
    "url": "https://doi.org/10.1177/000348941212100702",
    "verified": true,
    "takeaways": [
      "Human pepsin remains stable at pH 7.4 and may be reactivated by hydrogen ions, so ordinary waters (pH 6.7-7.4) would not inactivate it.",
      "Artesian well water containing natural bicarbonate at pH 8.8 irreversibly denatured human pepsin in laboratory tests.",
      "Its hydrochloric-acid buffering capacity far exceeded that of two popular bottled waters.",
      "The authors suggest therapeutic potential in reflux disease; no patients were tested."
    ],
    "facts": {
      "design": "in-vitro"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:lpr",
        "note": "In-vitro rationale for alkaline-water rinsing or drinking in LPR."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:throat-burning",
        "note": "Mechanistic only; no symptom outcome was measured."
      }
    ]
  },
  {
    "id": "article:strugala-2009-alginate-pepsin-bile-acids",
    "type": "article",
    "name": "The role of an alginate suspension on pepsin and bile acids - key aggressors in the gastric refluxate. Does this have implications for the treatment of gastro-oesophageal reflux disease?",
    "aliases": [
      "Strugala 2009"
    ],
    "summary": "In vitro, the alginate raft Gaviscon Advance inhibited pepsin beyond neutralisation, slowed diffusion of pepsin and bile acids, and removed both from a simulated reflux event.",
    "body": [
      "Mechanistic support for [[intervention:sodium-alginate|alginate]] beyond acid neutralisation: it binds pepsin and [[compound:bile-acids]]. Clinical benefit in [[disease:lpr]] must come from trials such as [[article:leiman-2017-alginate-meta-analysis]]."
    ],
    "evidence": "plausible",
    "authors": [
      "Strugala V",
      "Avis J",
      "Jolliffe IG",
      "Johnstone LM",
      "Dettmar PW"
    ],
    "year": 2009,
    "journal": "The Journal of pharmacy and pharmacology",
    "doi": "10.1211/jpp/61.08.0005",
    "pmid": "19703345",
    "url": "https://doi.org/10.1211/jpp/61.08.0005",
    "verified": true,
    "takeaways": [
      "Gaviscon Advance dose-dependently inhibited pepsin activity beyond its acid-neutralising effect, on protein and collagen substrates.",
      "In a Franz cell model it retarded diffusion of pepsin and multiple bile acids.",
      "Using the raft mode of action it removed both from a simulated reflux event, with capacity for multiple events.",
      "The authors argue alginate could limit damage from non-acid refluxate components; these are laboratory models."
    ],
    "facts": {
      "design": "in-vitro"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:sodium-alginate",
        "note": "In-vitro mechanisms for pepsin and bile acid capture by an alginate raft."
      },
      {
        "rel": "evidence-for",
        "to": "disease:lpr",
        "note": "Targets pepsin, a proposed mediator of laryngopharyngeal injury."
      },
      {
        "rel": "evidence-for",
        "to": "compound:bile-acids",
        "note": "Alginate raft retarded diffusion and removed bile acids in vitro."
      }
    ]
  },
  {
    "id": "article:leiman-2017-alginate-meta-analysis",
    "type": "article",
    "name": "Alginate therapy is effective treatment for gastroesophageal reflux disease symptoms: a systematic review and meta-analysis",
    "aliases": [
      "Leiman 2017"
    ],
    "summary": "Meta-analysis of 14 RCTs (n=2,095): alginate therapies were over four times more likely than placebo or antacids to resolve GERD symptoms and not significantly different from PPI or H2 blockers.",
    "body": [
      "Evidence base for [[intervention:sodium-alginate|alginate]] in [[disease:gerd]]. It covers GERD symptoms, not laryngopharyngeal symptoms specifically, and compares favourably with, but cannot replace, [[intervention:ppi-therapy|PPIs]] for erosive disease."
    ],
    "evidence": "established",
    "authors": [
      "Leiman DA",
      "Riff BP",
      "Morgan S",
      "Metz DC",
      "Falk GW",
      "French B",
      "Umscheid CA",
      "Lewis JD"
    ],
    "year": 2017,
    "journal": "Diseases of the esophagus : official journal of the International Society for Diseases of the Esophagus",
    "doi": "10.1111/dote.12535",
    "pmid": "27671545",
    "url": "https://doi.org/10.1111/dote.12535",
    "verified": true,
    "takeaways": [
      "Fourteen RCTs in 2,095 adults compared alginate-containing compounds with placebo, antacids, H2RAs or PPIs.",
      "Versus placebo or antacids, alginates increased odds of symptom resolution (OR 4.42, 95% CI 2.45-7.97).",
      "Versus PPIs or H2RAs, alginates looked less effective but the difference was not statistically significant (OR 0.58, 0.27-1.22).",
      "Heterogeneity was moderate (I2 71%); the proposed mechanism is displacement of the post-meal gastric acid pocket."
    ],
    "facts": {
      "design": "meta-analysis",
      "population": "14 RCTs, n=2,095"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:sodium-alginate",
        "note": "Effective for GERD symptoms versus placebo or antacid."
      },
      {
        "rel": "evidence-for",
        "to": "disease:gerd",
        "note": "Evidence for symptom relief in GERD."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:ppi-therapy",
        "note": "Alginates were not significantly worse than PPIs or H2RAs; underpowered comparison."
      }
    ]
  },
  {
    "id": "article:wilkie-2018-gaviscon-advance-lpr",
    "type": "article",
    "name": "Gaviscon® Advance alone versus co-prescription of Gaviscon® Advance and proton pump inhibitors in the treatment of laryngopharyngeal reflux",
    "aliases": [
      "Wilkie 2018"
    ],
    "summary": "In 100 patients with laryngopharyngeal reflux, Gaviscon Advance alone and with a PPI both lowered reflux symptom scores by about 9 points at 3 months, with no added benefit from the PPI.",
    "body": [
      "Real-world evidence for [[intervention:sodium-alginate|alginate]] in [[disease:lpr]] and against adding [[intervention:ppi-therapy|PPIs]]. Uncontrolled and without a placebo, so placebo effect and spontaneous change are not excluded."
    ],
    "evidence": "plausible",
    "authors": [
      "Wilkie MD",
      "Fraser HM",
      "Raja H"
    ],
    "year": 2018,
    "journal": "European archives of oto-rhino-laryngology : official journal of the European Federation of Oto-Rhino-Laryngological Societies (EUFOS) : affiliated with the German Society for Oto-Rhino-Laryngology - Head and Neck Surgery",
    "doi": "10.1007/s00405-018-5079-0",
    "pmid": "30062580",
    "url": "https://doi.org/10.1007/s00405-018-5079-0",
    "verified": true,
    "takeaways": [
      "One hundred consecutive LPR patients (RSI above 10) were treated with Gaviscon Advance four times daily; PPI users were optimised to twice daily.",
      "Follow-up RSI was returned by 72 patients: 39 on Gaviscon alone and 33 on Gaviscon plus PPI.",
      "RSI fell by 9.3 with Gaviscon alone and by 8.7 with the combination (no significant difference).",
      "It was not randomised or placebo-controlled and had 28% loss to follow-up."
    ],
    "facts": {
      "design": "cohort",
      "population": "100 LPR patients (72 analysed)"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:sodium-alginate",
        "note": "Alginate alone improved LPR symptom scores."
      },
      {
        "rel": "evidence-for",
        "to": "disease:lpr",
        "note": "Symptom improvement with alginate monotherapy."
      },
      {
        "rel": "evidence-against",
        "to": "intervention:ppi-therapy",
        "note": "Adding a high-dose PPI gave no additional benefit in this cohort."
      }
    ]
  },
  {
    "id": "article:vaezi-2006-esomeprazole-chronic-posterior-laryngitis",
    "type": "article",
    "name": "Treatment of chronic posterior laryngitis with esomeprazole",
    "aliases": [
      "Vaezi 2006"
    ],
    "summary": "Placebo-controlled RCT: esomeprazole 40 mg twice daily for 16 weeks did not improve symptoms or laryngoscopic signs of presumed reflux laryngitis (resolution 14.7% vs 16.0%).",
    "body": [
      "Key RCT showing that [[intervention:ppi-therapy|PPIs]] therapy fails to improve presumed reflux laryngitis, which implies throat symptoms ([[outcome:throat-burning]]) are often not acid-driven. It supports non-acid mechanisms (pepsin, hypersensitivity) in [[disease:lpr]] and cautions against assuming gastric acid is the cause."
    ],
    "evidence": "established",
    "authors": [
      "Vaezi MF",
      "Richter JE",
      "Stasney CR",
      "Spiegel JR",
      "Iannuzzi RA",
      "Crawley JA",
      "Hwang C",
      "Sostek MB",
      "Shaker R"
    ],
    "year": 2006,
    "journal": "The Laryngoscope",
    "doi": "10.1097/01.mlg.0000192173.00498.ba",
    "pmid": "16467715",
    "url": "https://doi.org/10.1097/01.mlg.0000192173.00498.ba",
    "verified": true,
    "takeaways": [
      "Patients with chronic posterior laryngitis symptoms and signs were randomised to esomeprazole 40 mg twice daily or placebo for 16 weeks.",
      "Primary symptom resolved in 14.7% on esomeprazole and 16.0% on placebo (P=0.799).",
      "Change in the laryngoscopic CPL index did not differ (P=0.446), nor did any secondary endpoint.",
      "The authors found no evidence of a therapeutic benefit of PPI for these signs and symptoms."
    ],
    "facts": {
      "design": "RCT",
      "population": "Patients with suspected reflux laryngitis"
    },
    "relations": [
      {
        "rel": "evidence-against",
        "to": "intervention:ppi-therapy",
        "note": "High-dose PPI was no better than placebo for chronic posterior laryngitis."
      },
      {
        "rel": "evidence-for",
        "to": "disease:lpr",
        "note": "Challenges the assumption that LPR symptoms are acid-driven and PPI-responsive."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:throat-burning",
        "note": "Throat symptoms did not respond to acid suppression."
      }
    ]
  },
  {
    "id": "article:yadlapati-2026-san-diego-consensus-lpr",
    "type": "article",
    "name": "The San Diego Consensus for Laryngopharyngeal Symptoms and Laryngopharyngeal Reflux Disease",
    "aliases": [
      "San Diego Consensus (Yadlapati 2026)"
    ],
    "summary": "San Diego Consensus: laryngopharyngeal symptoms are not equal to laryngopharyngeal reflux disease; reflux monitoring is required for diagnosis when symptoms persist or are isolated.",
    "body": [
      "Current consensus that throat burning ([[outcome:throat-burning]]) does not by itself establish [[disease:lpr]]. It supports objective testing and notes a role for [[intervention:sodium-alginate|alginate]] when esophageal reflux symptoms are present."
    ],
    "evidence": "established",
    "authors": [
      "Yadlapati R",
      "Weissbrod P",
      "Walsh E",
      "Carroll TL",
      "Chan WW",
      "Gartner-Schmidt J",
      "Guadagnoli L",
      "Jette M",
      "Myers JC",
      "O'Rourke A",
      "et al."
    ],
    "year": 2026,
    "journal": "The American journal of gastroenterology",
    "doi": "10.14309/ajg.0000000000003482",
    "pmid": "40197644",
    "url": "https://doi.org/10.14309/ajg.0000000000003482",
    "verified": true,
    "takeaways": [
      "A 28-member interdisciplinary group (otolaryngology and gastroenterology) used the RAND Appropriateness Method to reach recommendations.",
      "Laryngopharyngeal symptoms (cough, voice change, throat clearing, phlegm, throat pain) do not by themselves mean laryngopharyngeal reflux disease, which needs objective reflux evidence.",
      "Laryngoscopy cannot diagnose LPRD alone; empiric acid suppression, with or without alginates, is reasonable when typical esophageal reflux symptoms coexist; otherwise endoscopy and ambulatory reflux monitoring are required.",
      "Laryngeal hypervigilance and hyperresponsiveness commonly contribute and respond to laryngeal recalibration therapy and neuromodulators."
    ],
    "facts": {
      "design": "consensus"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:lpr",
        "note": "Modern interdisciplinary diagnostic framework."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:sodium-alginate",
        "note": "Alginates are acceptable as part of empiric therapy when esophageal reflux symptoms coexist."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:throat-burning",
        "note": "Throat symptoms need objective evaluation rather than presumption of reflux."
      }
    ]
  },
  {
    "id": "article:brown-2025-statpearls-laryngopharyngeal-reflux",
    "type": "article",
    "name": "Laryngopharyngeal Reflux",
    "aliases": [
      "Brown 2025 (StatPearls)"
    ],
    "summary": "StatPearls chapter: LPR and GERD may be separate conditions; acid-pepsin contact injury may be only part of LPR, which can also arise from a vagal reflex between esophagus and upper airway.",
    "body": [
      "Textbook-level overview of [[disease:lpr]] noting that acid-pepsin contact is not the only mechanism and that LPR and [[disease:gerd]] can differ ([[outcome:throat-burning]])."
    ],
    "evidence": "established",
    "authors": [
      "Brown J",
      "Matz O",
      "Sutton AE",
      "Shermetaro C"
    ],
    "year": 2025,
    "journal": "StatPearls (NCBI Bookshelf)",
    "pmid": "30137832",
    "url": "https://pubmed.ncbi.nlm.nih.gov/30137832/",
    "verified": true,
    "takeaways": [
      "Hoarseness, cough, globus and throat clearing are laryngopharyngeal manifestations, but many patients have no heartburn or regurgitation.",
      "Current research suggests GERD and LPR may be distinct conditions with different management.",
      "Acid-pepsin injury from direct contact may explain only part of LPR.",
      "LPR may also result from a vagal reflex arc between the esophagus and the upper aerodigestive tract."
    ],
    "facts": {
      "design": "textbook"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:lpr",
        "note": "Study-guide overview, noting multiple mechanisms."
      },
      {
        "rel": "evidence-for",
        "to": "disease:gerd",
        "note": "LPR and GERD may be distinct."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:throat-burning"
      }
    ]
  },
  {
    "id": "article:wu-2008-ginger-gastric-emptying",
    "type": "article",
    "name": "Effects of ginger on gastric emptying and motility in healthy humans",
    "aliases": [
      "Wu 2008"
    ],
    "summary": "Randomized crossover in 24 healthy volunteers: 1.2 g ginger shortened gastric half-emptying from 26.7 to 13.1 minutes and increased antral contractions, without changing symptoms.",
    "body": [
      "The key human evidence that [[intervention:ginger-extract]] speeds gastric emptying. Healthy volunteers and a low-nutrient liquid meal limit generalisation to people with dysmotility ([[state:gastric-dysmotility]])."
    ],
    "evidence": "established",
    "authors": [
      "Wu KL",
      "Rayner CK",
      "Chuah SK",
      "Changchien CS",
      "Lu SN",
      "Chiu YC",
      "Chiu KW",
      "Lee CM"
    ],
    "year": 2008,
    "journal": "European journal of gastroenterology & hepatology",
    "doi": "10.1097/MEG.0b013e3282f4b224",
    "pmid": "18403946",
    "url": "https://doi.org/10.1097/MEG.0b013e3282f4b224",
    "verified": true,
    "takeaways": [
      "Twenty-four healthy volunteers took three ginger capsules (1,200 mg) or placebo one hour before a 500 mL low-nutrient soup, double-blind and crossover.",
      "Ultrasound showed faster antral emptying: half-emptying time 13.1 versus 26.7 minutes (P<0.01) with ginger.",
      "The frequency of antral contractions was higher after ginger (P<0.005).",
      "Fundus dimensions and gastrointestinal symptoms did not differ."
    ],
    "facts": {
      "design": "RCT",
      "population": "24 healthy volunteers"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:ginger-extract",
        "note": "Single 1.2 g ginger dose accelerates liquid gastric emptying in healthy people."
      },
      {
        "rel": "evidence-for",
        "to": "state:gastric-dysmotility",
        "note": "Shows ginger has measurable prokinetic action on the antrum."
      }
    ]
  },
  {
    "id": "article:hu-2011-ginger-functional-dyspepsia-motility",
    "type": "article",
    "name": "Effect of ginger on gastric motility and symptoms of functional dyspepsia",
    "aliases": [
      "Hu 2011"
    ],
    "summary": "Crossover in 11 functional dyspepsia patients: ginger sped gastric emptying (12.3 vs 16.1 minutes) but did not change symptoms or plasma motilin, ghrelin or GLP-1.",
    "body": [
      "Small crossover showing [[intervention:ginger-extract]] speeds emptying in dyspepsia ([[state:gastric-dysmotility]]), but the effect was not accompanied by changes in motilin, so a motilin-driven MMC mechanism is not supported."
    ],
    "evidence": "plausible",
    "authors": [
      "Hu ML",
      "Rayner CK",
      "Wu KL",
      "Chuah SK",
      "Tai WC",
      "Chou YP",
      "Chiu YC",
      "Chiu KW",
      "Hu TH"
    ],
    "year": 2011,
    "journal": "World journal of gastroenterology",
    "doi": "10.3748/wjg.v17.i1.105",
    "pmid": "21218090",
    "url": "https://doi.org/10.3748/wjg.v17.i1.105",
    "verified": true,
    "takeaways": [
      "Eleven patients with functional dyspepsia received 1.2 g ginger or placebo in a double-blind crossover, then a 500 mL low-nutrient soup.",
      "Median gastric half-emptying time was 12.3 minutes after ginger versus 16.1 after placebo (P<=0.05); antral contractions showed a trend.",
      "Plasma GLP-1, motilin and ghrelin did not differ, so the effect was not explained by those hormones.",
      "Gastrointestinal symptoms did not differ between conditions."
    ],
    "facts": {
      "design": "RCT",
      "population": "11 functional dyspepsia patients"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:ginger-extract",
        "note": "Accelerated emptying in dyspepsia patients."
      },
      {
        "rel": "evidence-against",
        "to": "intervention:ginger-extract",
        "note": "No change in symptoms or in motilin, ghrelin and GLP-1 despite the emptying effect; weakens a motilin-driven MMC explanation."
      },
      {
        "rel": "evidence-for",
        "to": "state:gastric-dysmotility",
        "note": "Prokinetic effect shown in functional dyspepsia."
      }
    ]
  },
  {
    "id": "article:giacosa-2015-ginger-artichoke-functional-dyspepsia",
    "type": "article",
    "name": "The Effect of Ginger (Zingiber officinalis) and Artichoke (Cynara cardunculus) Extract Supplementation on Functional Dyspepsia: A Randomised, Double-Blind, and Placebo-Controlled Clinical Trial",
    "aliases": [
      "Giacosa 2015"
    ],
    "summary": "RCT in 126 functional dyspepsia patients: a ginger-artichoke extract improved dyspeptic symptoms at two weeks, particularly nausea, fullness, pain and bloating, versus placebo.",
    "body": [
      "Controlled trial for a combined extract ([[intervention:ginger-extract]] plus artichoke) in functional dyspepsia ([[state:gastric-dysmotility]]). The artichoke 'bile flow' rationale ([[system:bile]]) was not tested here."
    ],
    "evidence": "established",
    "authors": [
      "Giacosa A",
      "Guido D",
      "Grassi M",
      "Riva A",
      "Morazzoni P",
      "Bombardelli E",
      "Perna S",
      "Faliva MA",
      "Rondanelli M"
    ],
    "year": 2015,
    "journal": "Evidence-based complementary and alternative medicine : eCAM",
    "doi": "10.1155/2015/915087",
    "pmid": "25954317",
    "url": "https://doi.org/10.1155/2015/915087",
    "verified": true,
    "takeaways": [
      "A multicentre double-blind placebo-controlled trial randomised 126 patients (65 supplement, 61 placebo) for 4 weeks to 2 capsules/day.",
      "After 14 days only the supplement group had a significant improvement in the symptom score (difference vs placebo P<0.001).",
      "The advantage was seen for nausea, epigastric fullness, epigastric pain and bloating.",
      "The effect of ginger cannot be separated from artichoke and was assessed on symptom scores, not on gastric emptying."
    ],
    "facts": {
      "design": "RCT",
      "population": "126 functional dyspepsia patients"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:ginger-extract",
        "note": "Combined ginger-artichoke extract improved functional dyspepsia symptoms."
      },
      {
        "rel": "evidence-for",
        "to": "state:gastric-dysmotility",
        "note": "Symptom benefit in functional dyspepsia; mechanism unmeasured."
      },
      {
        "rel": "evidence-for",
        "to": "system:bile",
        "note": "Artichoke component is often described as choleretic; this trial did not measure bile flow."
      }
    ]
  },
  {
    "id": "article:pertz-2011-ginger-constituents-receptors",
    "type": "article",
    "name": "Effects of ginger constituents on the gastrointestinal tract: role of cholinergic M3 and serotonergic 5-HT3 and 5-HT4 receptors",
    "aliases": [
      "Pertz 2011"
    ],
    "summary": "Isolated tissue study: gingerols and shogaol weakly blocked M3 and 5-HT3 receptors and showed no 5-HT4 agonist effect, so a 5-HT4 prokinetic mechanism is not supported.",
    "body": [
      "Pharmacological test of [[intervention:ginger-extract]] receptor targets that finds no 5-HT4 agonism. Combined with [[article:wu-2008-ginger-gastric-emptying]], ginger's emptying effect appears real but not 5-HT4-mediated ([[state:gastric-dysmotility]]). Animal tissues, isolated compounds."
    ],
    "evidence": "plausible",
    "authors": [
      "Pertz HH",
      "Lehmann J",
      "Roth-Ehrang R",
      "Elz S"
    ],
    "year": 2011,
    "journal": "Planta medica",
    "doi": "10.1055/s-0030-1270747",
    "pmid": "21305447",
    "url": "https://doi.org/10.1055/s-0030-1270747",
    "verified": true,
    "takeaways": [
      "The ginger constituents [6]-, [8]-, [10]-gingerol and [6]-shogaol were tested on guinea pig M3 and 5-HT3 receptor assays and a rat 5-HT4 assay.",
      "All four compounds slightly depressed carbachol (M3) responses; [10]-gingerol and [6]-shogaol depressed 5-HT3 responses.",
      "None had agonist effect at 5-HT4 receptors and the maximal 5-HT response was unaffected.",
      "The authors conclude ginger's anti-nausea action is probably through weak M3/5-HT3 inhibition and that 5-HT4 receptors, important for gastroduodenal motility, do not seem involved."
    ],
    "facts": {
      "design": "in-vitro"
    },
    "relations": [
      {
        "rel": "evidence-against",
        "to": "intervention:ginger-extract",
        "note": "Contradicts the claim that ginger acts as a 5-HT4 agonist prokinetic."
      },
      {
        "rel": "evidence-against",
        "to": "state:gastric-dysmotility",
        "note": "Receptor profile does not support a 5-HT4-mediated prokinetic mechanism."
      }
    ]
  },
  {
    "id": "article:holtmann-2003-artichoke-leaf-functional-dyspepsia",
    "type": "article",
    "name": "Efficacy of artichoke leaf extract in the treatment of patients with functional dyspepsia: a six-week placebo-controlled, double-blind, multicentre trial",
    "aliases": [
      "Holtmann 2003"
    ],
    "summary": "Double-blind RCT in 244 analysable functional dyspepsia patients: artichoke leaf extract improved overall symptoms and quality of life more than placebo over six weeks.",
    "body": [
      "Randomised support for artichoke leaf extract in functional dyspepsia ([[state:gastric-dysmotility]]). Whether any effect works through bile flow ([[system:bile]]) is not shown."
    ],
    "evidence": "established",
    "authors": [
      "Holtmann G",
      "Adam B",
      "Haag S",
      "Collet W",
      "Grünewald E",
      "Windeck T"
    ],
    "year": 2003,
    "journal": "Alimentary pharmacology & therapeutics",
    "doi": "10.1046/j.1365-2036.2003.01767.x",
    "pmid": "14653829",
    "url": "https://doi.org/10.1046/j.1365-2036.2003.01767.x",
    "verified": true,
    "takeaways": [
      "Two hundred forty-seven patients were randomised to artichoke leaf extract (2 x 320 mg three times daily) or placebo for six weeks.",
      "Overall dyspeptic symptom improvement was larger with the extract (8.3 vs 6.7; P<0.01).",
      "Nepean Dyspepsia Index quality-of-life scores improved more (-41.1 vs -24.8; P<0.01).",
      "The trial measured symptoms, not bile flow or gastric emptying."
    ],
    "facts": {
      "design": "RCT",
      "population": "Functional dyspepsia, n=247"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "state:gastric-dysmotility",
        "note": "Symptom benefit in functional dyspepsia (mechanism not measured)."
      },
      {
        "rel": "evidence-for",
        "to": "system:bile",
        "note": "Artichoke is traditionally choleretic; this RCT did not measure bile secretion."
      }
    ]
  },
  {
    "id": "article:nikkhah-bodagh-2019-ginger-gi-review",
    "type": "article",
    "name": "Ginger in gastrointestinal disorders: A systematic review of clinical trials",
    "aliases": [
      "Nikkhah Bodagh 2019"
    ],
    "summary": "Systematic review of ginger trials in GI disorders: divided daily doses up to about 1.5 g relieve nausea, while evidence for other gastroprotective uses is limited.",
    "body": [
      "Counterweight to enthusiastic claims about [[intervention:ginger-extract]]: nausea benefit is reasonably supported, but evidence for other GI roles, including any effect on [[state:gastric-dysmotility]] in disease, is limited."
    ],
    "evidence": "plausible",
    "authors": [
      "Nikkhah Bodagh M",
      "Maleki I",
      "Hekmatdoost A"
    ],
    "year": 2019,
    "journal": "Food science & nutrition",
    "doi": "10.1002/fsn3.807",
    "pmid": "30680163",
    "url": "https://doi.org/10.1002/fsn3.807",
    "verified": true,
    "takeaways": [
      "Ginger is reported to have anti-inflammatory, antioxidant, antitumor and antiulcer effects, some confirmed in humans.",
      "The review summarises clinical trials of ginger on gastrointestinal disorders.",
      "A divided lower daily dosage of 1,500 mg ginger is beneficial for nausea relief.",
      "For other disorders there are too few studies to show efficacy as a gastroprotective agent; dose-finding trials are needed."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:ginger-extract",
        "note": "Nausea relief supported; other GI claims need more trials."
      },
      {
        "rel": "evidence-for",
        "to": "state:gastric-dysmotility",
        "note": "Evidence for non-nausea GI uses is limited."
      }
    ]
  },
  {
    "id": "article:xu-2006-carvacrol-thymol-trp-channels",
    "type": "article",
    "name": "Oregano, thyme and clove-derived flavors and skin sensitizers activate specific TRP channels",
    "aliases": [
      "Xu 2006"
    ],
    "summary": "Carvacrol, thymol and eugenol from oregano, thyme and clove activate the warm-sensing TRPV3 channel and carvacrol also activates TRPA1, explaining their warm or pungent sensation.",
    "body": [
      "Explains why concentrated oregano oil (carvacrol) can sting mucosal surfaces through TRP channels, relevant to [[outcome:throat-burning]]. The paper concerns oral/skin epithelia, and effects on inflamed upper-airway mucosa in [[disease:lpr]] are inferred."
    ],
    "evidence": "plausible",
    "authors": [
      "Xu H",
      "Delling M",
      "Jun JC",
      "Clapham DE"
    ],
    "year": 2006,
    "journal": "Nature neuroscience",
    "doi": "10.1038/nn1692",
    "pmid": "16617338",
    "url": "https://doi.org/10.1038/nn1692",
    "verified": true,
    "takeaways": [
      "Carvacrol, eugenol and thymol give a warm sensation on the tongue and are known skin sensitizers.",
      "They strongly activate and sensitize TRPV3, a Ca2+-permeable warm-sensitive cation channel expressed in skin, tongue and nose.",
      "Carvacrol also activates and rapidly desensitizes TRPA1, which may explain oregano's pungency.",
      "The work is in cells and isolated tissues; no gastric or laryngeal mucosal data."
    ],
    "facts": {
      "design": "in-vitro"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "outcome:throat-burning",
        "note": "Molecular basis for a burning or warm sensation from oregano phenols on epithelia."
      },
      {
        "rel": "evidence-for",
        "to": "disease:lpr",
        "note": "Plausible mechanism for irritation of inflamed pharyngeal mucosa; not tested in LPR."
      }
    ]
  },
  {
    "id": "article:harmati-2017-oregano-savory-oil-hpylori-mice",
    "type": "article",
    "name": "Binary mixture of Satureja hortensis and Origanum vulgare subsp. hirtum essential oils: in vivo therapeutic efficiency against Helicobacter pylori infection",
    "aliases": [
      "Harmati 2017"
    ],
    "summary": "A savory plus oregano essential oil mixture eradicated H. pylori in 70% of infected mice without detectable toxicity.",
    "body": [
      "Preclinical sign that oregano-containing essential oils kill H. pylori ([[disease:h-pylori-infection]]). It is a mouse study and far from [[intervention:h-pylori-eradication-therapy|H. pylori eradication]] evidence in humans."
    ],
    "evidence": "speculative",
    "authors": [
      "Harmati M",
      "Gyukity-Sebestyen E",
      "Dobra G",
      "Terhes G",
      "Urban E",
      "Decsi G",
      "Mimica-Dukić N",
      "Lesjak M",
      "Simin N",
      "Pap B",
      "et al."
    ],
    "year": 2017,
    "journal": "Helicobacter",
    "doi": "10.1111/hel.12350",
    "pmid": "27578489",
    "url": "https://doi.org/10.1111/hel.12350",
    "verified": true,
    "takeaways": [
      "The anti-H. pylori activity of a 2:1 mixture of Satureja hortensis and Origanum vulgare subsp. hirtum essential oils was tested in vivo.",
      "The mixture eradicated the pathogen in 70% of mice with no toxicity or altered cytokine balance detected.",
      "In-vitro cytotoxicity on mammalian cell lines occurred only at the highest concentration.",
      "Mouse data only; no human trial is described."
    ],
    "facts": {
      "design": "animal"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:h-pylori-infection",
        "note": "Antibacterial activity of oregano-containing oil in a mouse infection model."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:h-pylori-eradication-therapy",
        "note": "Candidate antibiotic-sparing agent; mouse only, not a replacement for guideline regimens."
      }
    ]
  },
  {
    "id": "article:hofmann-2008-bile-acids-biology",
    "type": "article",
    "name": "Bile acids: chemistry, pathochemistry, biology, pathobiology, and therapeutics",
    "aliases": [
      "Hofmann & Hagey 2008"
    ],
    "summary": "Review of bile acids: conjugated end products of cholesterol that cycle enterohepatically, aid lipid absorption and tryptic protein cleavage, and have antimicrobial and signalling roles.",
    "body": [
      "Broad reference for [[compound:bile-acids]] and conjugation ([[pathway:bile-acid-conjugation]]). Its antimicrobial role helps explain why impaired bile flow could favour upper-gut bacteria ([[system:bile]]); it says nothing about glycine supplements shifting conjugation."
    ],
    "evidence": "established",
    "authors": [
      "Hofmann AF",
      "Hagey LR"
    ],
    "year": 2008,
    "journal": "Cellular and molecular life sciences : CMLS",
    "doi": "10.1007/s00018-008-7568-6",
    "pmid": "18488143",
    "url": "https://doi.org/10.1007/s00018-008-7568-6",
    "verified": true,
    "takeaways": [
      "Bile acids and alcohols exist as conjugates and have an enterohepatic circulation that maintains a pool cycling between liver and intestine.",
      "Bile salt anions promote lipid absorption, enhance tryptic cleavage of dietary proteins and have antimicrobial effects.",
      "They act as signalling molecules through nuclear receptors and G-protein coupled receptors in liver and ileum.",
      "Therapeutic bile acids are used for deficiency states, gallstone dissolution and cholestatic liver disease."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:bile-acids",
        "note": "Authoritative review of bile acid structure, circulation and function."
      },
      {
        "rel": "evidence-for",
        "to": "system:bile",
        "note": "Bile salts have antimicrobial effects and aid digestion."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:bile-acid-conjugation",
        "note": "Bile acids occur as amino acid conjugates in the enterohepatic circulation."
      }
    ]
  },
  {
    "id": "article:chiang-2013-bile-acid-metabolism-signaling",
    "type": "article",
    "name": "Bile acid metabolism and signaling",
    "aliases": [
      "Chiang 2013"
    ],
    "summary": "Comprehensive review of bile acid synthesis, enterohepatic circulation and receptor signalling, and how disrupted bile acid metabolism contributes to liver, lipid and metabolic disease.",
    "body": [
      "Physiology review for [[compound:bile-acids]]: synthesis, conjugation and signalling. Useful background to claims that bile composition changes could irritate the stomach ([[system:bile]], [[pathway:bile-acid-conjugation]])."
    ],
    "evidence": "established",
    "authors": [
      "Chiang JY"
    ],
    "year": 2013,
    "journal": "Comprehensive physiology",
    "doi": "10.1002/cphy.c120023",
    "pmid": "23897684",
    "url": "https://doi.org/10.1002/cphy.c120023",
    "verified": true,
    "takeaways": [
      "Bile acids aid intestinal nutrient absorption and biliary secretion of lipids and toxins.",
      "They also act as signalling molecules through nuclear receptors and GPCRs to regulate lipid, glucose and energy homeostasis.",
      "Enterohepatic circulation is regulated by liver and intestinal transporters under nuclear receptor control.",
      "Toxic bile acids cause inflammation and cell death; sequestrants and derivatives are therapeutic."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:bile-acids",
        "note": "Standard physiology reference."
      },
      {
        "rel": "evidence-for",
        "to": "system:bile",
        "note": "Describes bile secretion and circulation."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:bile-acid-conjugation"
      }
    ]
  },
  {
    "id": "article:begley-2005-bacteria-and-bile",
    "type": "article",
    "name": "The interaction between bacteria and bile",
    "aliases": [
      "Begley 2005"
    ],
    "summary": "Review of how bile acts as an antimicrobial barrier in the gut and how commensals and pathogens tolerate it.",
    "body": [
      "Supports the idea that [[system:bile]] helps keep the upper gut microbiota in check ([[system:gut-microbiota]]). Its link to [[disease:sibo]] is an inference."
    ],
    "evidence": "established",
    "authors": [
      "Begley M",
      "Gahan CG",
      "Hill C"
    ],
    "year": 2005,
    "journal": "FEMS microbiology reviews",
    "doi": "10.1016/j.femsre.2004.09.003",
    "pmid": "16102595",
    "url": "https://doi.org/10.1016/j.femsre.2004.09.003",
    "verified": true,
    "takeaways": [
      "Gut bacteria must resist the deleterious actions of bile to survive.",
      "Bile has direct antimicrobial actions and tolerance varies between bacterial genera.",
      "Molecular mechanisms of bile tolerance and the link between bile and virulence are reviewed.",
      "The potential benefits of bile research are briefly discussed."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "system:bile",
        "note": "Bile is an antimicrobial defence in the upper gut."
      },
      {
        "rel": "evidence-for",
        "to": "system:gut-microbiota",
        "note": "Bile exerts selective pressure on microbes."
      },
      {
        "rel": "evidence-for",
        "to": "disease:sibo",
        "note": "Reduced bile effect could favour small-bowel bacterial survival; not tested in this review."
      }
    ]
  },
  {
    "id": "article:fein-2006-duodenogastric-reflux-gord",
    "type": "article",
    "name": "Importance of duodenogastric reflux in gastro-oesophageal reflux disease",
    "aliases": [
      "Fein 2006"
    ],
    "summary": "In 341 GORD patients, 38% had increased gastric bilirubin (duodenogastric reflux) and those with increased gastric and esophageal bilirubin mostly had esophagitis or Barrett's.",
    "body": [
      "Provides prevalence data for bile reflux in [[disease:gerd]] ([[system:bile]]). The study did not link bile reflux to glycine-conjugate ratios or belching."
    ],
    "evidence": "plausible",
    "authors": [
      "Fein M",
      "Maroske J",
      "Fuchs KH"
    ],
    "year": 2006,
    "journal": "The British journal of surgery",
    "doi": "10.1002/bjs.5486",
    "pmid": "17051600",
    "url": "https://doi.org/10.1002/bjs.5486",
    "verified": true,
    "takeaways": [
      "Simultaneous 24-hour gastric and esophageal bilirubin monitoring was done in 341 GORD patients.",
      "Increased gastric bilirubin exposure was found in 130 (38.1%) and increased esophageal bilirubin exposure in 173 (50.7%).",
      "Among 84 with increased exposure at both sites, 89% had esophagitis or Barrett's esophagus (P=0.003).",
      "Effects were mainly related to supine reflux."
    ],
    "facts": {
      "design": "cohort",
      "population": "341 GORD patients"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "system:bile",
        "note": "Duodenogastric reflux of bile is common in GORD."
      },
      {
        "rel": "evidence-for",
        "to": "disease:gerd",
        "note": "Increased duodenogastric reflux is associated with more severe disease."
      }
    ]
  },
  {
    "id": "article:stefaniwsky-1985-udca-alkaline-reflux-gastritis",
    "type": "article",
    "name": "Ursodeoxycholic acid treatment of bile reflux gastritis",
    "aliases": [
      "Stefaniwsky 1985"
    ],
    "summary": "Placebo-controlled crossover in 12 patients with alkaline reflux gastritis: ursodeoxycholic acid 1 g/day almost abolished pain and vomiting without changing mucosal appearance.",
    "body": [
      "Shows that the composition of refluxed [[compound:bile-acids]] matters for symptoms in bile reflux gastritis ([[system:bile]]). It involved post-gastrectomy patients, and says nothing about glycine versus taurine conjugation."
    ],
    "evidence": "plausible",
    "authors": [
      "Stefaniwsky AB",
      "Tint GS",
      "Speck J",
      "Shefer S",
      "Salen G"
    ],
    "year": 1985,
    "journal": "Gastroenterology",
    "doi": "10.1016/0016-5085(85)90200-8",
    "pmid": "4043659",
    "url": "https://doi.org/10.1016/0016-5085(85)90200-8",
    "verified": true,
    "takeaways": [
      "Twelve post-surgical patients with symptomatic alkaline reflux gastritis received placebo for a month and UDCA 1,000 mg/day for a month.",
      "Placebo did not change symptoms; UDCA greatly reduced pain intensity and frequency and almost abolished nausea and vomiting.",
      "UDCA rose to about 50% of gastric bile acids while cholic and deoxycholic acids fell.",
      "Mucosal appearance and histology did not change, suggesting symptoms respond to bile acid composition."
    ],
    "facts": {
      "design": "controlled crossover study",
      "population": "12 patients with symptomatic alkaline reflux gastritis"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "system:bile",
        "note": "Changing the bile acid mix in refluxed bile reduces symptoms in bile reflux gastritis."
      },
      {
        "rel": "evidence-for",
        "to": "compound:bile-acids",
        "note": "Hydrophilic UDCA displaced more irritant bile acids."
      }
    ]
  },
  {
    "id": "article:sjovall-1959-glycine-taurine-bile-conjugation",
    "type": "article",
    "name": "Dietary glycine and taurine on bile acid conjugation in man; bile acids and steroids 75",
    "aliases": [
      "Sjövall 1959"
    ],
    "summary": "Classic 1959 human experiment on how dietary glycine and taurine alter bile acid conjugation; later work cites it as showing taurine feeding shifts conjugation toward taurine conjugates.",
    "body": [
      "Historical basis for the idea that [[compound:glycine]] and taurine supply shapes [[pathway:bile-acid-conjugation]]. Treat claims that extra glycine alters the glycine:taurine ratio of [[compound:bile-acids]] as plausible but unverified; no abstract is available."
    ],
    "evidence": "plausible",
    "authors": [
      "SJOVALL J"
    ],
    "year": 1959,
    "journal": "Proceedings of the Society for Experimental Biology and Medicine. Society for Experimental Biology and Medicine (New York, N.Y.)",
    "doi": "10.3181/00379727-100-24741",
    "pmid": "13645682",
    "url": "https://doi.org/10.3181/00379727-100-24741",
    "verified": true,
    "takeaways": [
      "Title and indexing describe a human study of dietary glycine and taurine effects on bile acid conjugation.",
      "A 1983 Gastroenterology paper summarises it as showing the effect of feeding 1.5-4.5 g/day of taurine was fully apparent within 5 days.",
      "That implies the glycine:taurine conjugation ratio in humans responds to the amino acid supply, at least for taurine.",
      "The glycine-feeding arm and the original abstract could not be verified; the paper is a short report (pp. 676-678)."
    ],
    "facts": {
      "design": "controlled human study"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:bile-acid-conjugation",
        "note": "Human conjugation pattern responds to dietary taurine (as summarised later)."
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Glycine is one of the two conjugating amino acids; the glycine-feeding result was not verified."
      },
      {
        "rel": "evidence-for",
        "to": "compound:bile-acids"
      }
    ]
  },
  {
    "id": "article:chen-2023-statpearls-bile-acids",
    "type": "article",
    "name": "Physiology, Bile Acids",
    "aliases": [
      "Chen 2023 (StatPearls)"
    ],
    "summary": "StatPearls chapter: primary bile acids conjugate with glycine or taurine to form bile salts; their main functions are fat emulsification, cholesterol excretion and antimicrobial effects.",
    "body": [
      "Textbook summary of [[pathway:bile-acid-conjugation]]: [[compound:bile-acids]] are amidated with [[compound:glycine]] or taurine before secretion. It gives no data on how supplemental glycine changes conjugation."
    ],
    "evidence": "established",
    "authors": [
      "Chen I",
      "Cassaro S"
    ],
    "year": 2023,
    "journal": "StatPearls (NCBI Bookshelf)",
    "pmid": "31747172",
    "url": "https://pubmed.ncbi.nlm.nih.gov/31747172/",
    "verified": true,
    "takeaways": [
      "Primary bile acids are made in the liver and conjugated to glycine or taurine (glycocholic and taurocholic acids), forming bile salts with sodium or potassium.",
      "Eating triggers cholecystokinin release and gallbladder contraction, delivering bile acids to the duodenum.",
      "Secondary bile acids are made by colonic bacteria.",
      "Three main functions: emulsify fat, excrete cholesterol and exert an antimicrobial effect; they also signal through FXR and TGR5."
    ],
    "facts": {
      "design": "textbook"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:bile-acid-conjugation",
        "note": "Glycine and taurine conjugation of primary bile acids."
      },
      {
        "rel": "evidence-for",
        "to": "compound:bile-acids"
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Glycine is a conjugating amino acid of bile salts."
      }
    ]
  },
  {
    "id": "article:lugo-2016-uc-ii-knee-osteoarthritis",
    "type": "article",
    "name": "Efficacy and tolerability of an undenatured type II collagen supplement in modulating knee osteoarthritis symptoms: a multicenter randomized, double-blind, placebo-controlled study",
    "aliases": [
      "Lugo 2016"
    ],
    "summary": "RCT in 191 knee-OA volunteers: 40 mg/day undenatured type II collagen (UC-II) reduced WOMAC scores more than placebo or glucosamine plus chondroitin over 180 days.",
    "body": [
      "Shows type II collagen in the 'UC-II' form is dosed at 40 mg, not grams, so it adds negligible glycine ([[compound:collagen]]). It is not interchangeable with gram doses of hydrolysed [[intervention:collagen-peptides]]."
    ],
    "evidence": "established",
    "authors": [
      "Lugo JP",
      "Saiyed ZM",
      "Lane NE"
    ],
    "year": 2016,
    "journal": "Nutrition journal",
    "doi": "10.1186/s12937-016-0130-8",
    "pmid": "26822714",
    "url": "https://doi.org/10.1186/s12937-016-0130-8",
    "verified": true,
    "takeaways": [
      "One hundred ninety-one volunteers received UC-II 40 mg/day, glucosamine+chondroitin, or placebo for 180 days.",
      "UC-II lowered total WOMAC versus placebo (P=0.002) and versus glucosamine+chondroitin (P=0.04), with gains in pain, stiffness and function.",
      "Safety outcomes were similar across groups.",
      "UC-II is a milligram-dose product thought to act via oral tolerance; its dose supplies negligible glycine."
    ],
    "facts": {
      "design": "RCT",
      "population": "191 adults with knee osteoarthritis"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:collagen-peptides",
        "note": "Joint-symptom benefit with undenatured type II collagen; it is a different product from hydrolysed collagen peptides."
      },
      {
        "rel": "evidence-for",
        "to": "compound:collagen",
        "note": "Type II collagen at 40 mg/day acts through an immune mechanism, not amino acid supply."
      }
    ]
  },
  {
    "id": "article:barnett-1998-oral-type-ii-collagen-ra",
    "type": "article",
    "name": "Treatment of rheumatoid arthritis with oral type II collagen. Results of a multicenter, double-blind, placebo-controlled trial",
    "aliases": [
      "Barnett 1998"
    ],
    "summary": "Dose-ranging RCT (n=274) of oral type II collagen in rheumatoid arthritis: only the lowest dose (20 ug/day) showed a significant signal, consistent with oral tolerance.",
    "body": [
      "Shows oral [[compound:collagen]] type II acts at microgram doses by immune tolerance; higher doses were not better. Gram-level collagen powders ([[intervention:collagen-peptides]]) are a different intervention."
    ],
    "evidence": "established",
    "authors": [
      "Barnett ML",
      "Kremer JM",
      "St Clair EW",
      "Clegg DO",
      "Furst D",
      "Weisman M",
      "Fletcher MJ",
      "Chasan-Taber S",
      "Finger E",
      "Morales A",
      "et al."
    ],
    "year": 1998,
    "journal": "Arthritis and rheumatism",
    "doi": "10.1002/1529-0131(199802)41:2<290::AID-ART13>3.0.CO;2-R",
    "pmid": "9485087",
    "url": "https://doi.org/10.1002/1529-0131(199802)41:2<290::AID-ART13>3.0.CO;2-R",
    "verified": true,
    "takeaways": [
      "Two hundred seventy-four RA patients were randomised to placebo or 20, 100, 500 or 2,500 ug/day of oral type II collagen for 24 weeks.",
      "Trends favoured the 20 ug/day group; one composite (Paulus) showed a significant response (P=0.035).",
      "Baseline serum antibodies to type II collagen were associated with likelihood of response.",
      "No treatment-related adverse events were detected, but further controlled studies were needed."
    ],
    "facts": {
      "design": "RCT",
      "population": "274 RA patients"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:collagen",
        "note": "Immune effects of type II collagen occur at microgram doses via oral tolerance."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:collagen-peptides",
        "note": "Dose-response pattern shows lower doses worked best; gram-scale intake is not the mechanism."
      }
    ]
  },
  {
    "id": "article:bello-2006-collagen-hydrolysate-osteoarthritis",
    "type": "article",
    "name": "Collagen hydrolysate for the treatment of osteoarthritis and other joint disorders: a review of the literature",
    "aliases": [
      "Bello & Oesser 2006"
    ],
    "summary": "Narrative review: oral collagen hydrolysate is absorbed, accumulates in cartilage, stimulates chondrocyte matrix synthesis, and showed some pain benefit in small, often open-label OA studies.",
    "body": [
      "Overview of evidence for [[intervention:collagen-peptides]] in joints, with a signalling effect on matrix synthesis ([[pathway:collagen-synthesis]]). Quality is limited by open-label designs and a review author group close to product development ([[outcome:collagen-synthesis-adequacy]])."
    ],
    "evidence": "plausible",
    "authors": [
      "Bello AE",
      "Oesser S"
    ],
    "year": 2006,
    "journal": "Current medical research and opinion",
    "doi": "10.1185/030079906X148373",
    "pmid": "17076983",
    "url": "https://doi.org/10.1185/030079906X148373",
    "verified": true,
    "takeaways": [
      "Orally administered collagen hydrolysate is intestinally absorbed and accumulates in cartilage.",
      "It stimulated a significant increase in extracellular matrix macromolecule synthesis by chondrocytes (P<0.05 vs untreated controls).",
      "Four open-label and three double-blind studies were found; many lacked statistical details.",
      "The studies suggested safety and some improvement in pain and function, but the review calls for clarification of mechanism and target populations."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:collagen-peptides",
        "note": "Absorption and cartilage accumulation of collagen hydrolysate."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:collagen-synthesis-adequacy",
        "note": "Chondrocyte matrix synthesis stimulated in vitro."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:collagen-synthesis"
      }
    ]
  },
  {
    "id": "article:zdzieblik-2015-collagen-peptides-sarcopenia",
    "type": "article",
    "name": "Collagen peptide supplementation in combination with resistance training improves body composition and increases muscle strength in elderly sarcopenic men: a randomised controlled trial",
    "aliases": [
      "Zdzieblik 2015"
    ],
    "summary": "RCT in 53 elderly sarcopenic men: 15 g/day collagen peptides plus resistance training gave larger gains in fat-free mass and leg strength than placebo.",
    "body": [
      "Gram-dose [[intervention:collagen-peptides]] (15 g/day) were used for 12 weeks in older men, indicating this dose is clinically used, though the abstract does not report GI tolerability ([[compound:collagen]])."
    ],
    "evidence": "established",
    "authors": [
      "Zdzieblik D",
      "Oesser S",
      "Baumstark MW",
      "Gollhofer A",
      "König D"
    ],
    "year": 2015,
    "journal": "The British journal of nutrition",
    "doi": "10.1017/S0007114515002810",
    "pmid": "26353786",
    "url": "https://doi.org/10.1017/S0007114515002810",
    "verified": true,
    "takeaways": [
      "Fifty-three men (mean 72 years) with sarcopenia trained for 12 weeks and took 15 g/day collagen peptides or silica placebo.",
      "Fat-free mass rose by 4.2 kg versus 2.9 kg with placebo (P<0.05).",
      "Isokinetic quadriceps strength rose 16.5 versus 7.3 Nm and fat mass fell more with collagen (5.4 vs 3.5 kg).",
      "Both groups improved with training, so the benefit is an add-on to exercise."
    ],
    "facts": {
      "design": "RCT",
      "population": "53 men with sarcopenia"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:collagen-peptides",
        "note": "15 g/day improved muscle outcomes alongside resistance training."
      },
      {
        "rel": "evidence-for",
        "to": "compound:collagen",
        "note": "Hydrolysed collagen taken at gram doses in elderly men."
      }
    ]
  },
  {
    "id": "article:proksch-2014-collagen-peptides-skin",
    "type": "article",
    "name": "Oral intake of specific bioactive collagen peptides reduces skin wrinkles and increases dermal matrix synthesis",
    "aliases": [
      "Proksch 2014"
    ],
    "summary": "RCT in 114 women: 2.5 g/day of specific collagen peptides for 8 weeks reduced eye wrinkle volume by about 20% and raised dermal procollagen I and elastin.",
    "body": [
      "Shows a low dose (2.5 g/day) of [[intervention:collagen-peptides]] can affect [[pathway:collagen-synthesis]] markers, so large doses are not required for skin outcomes ([[outcome:collagen-synthesis-adequacy]])."
    ],
    "evidence": "established",
    "authors": [
      "Proksch E",
      "Schunck M",
      "Zague V",
      "Segger D",
      "Degwert J",
      "Oesser S"
    ],
    "year": 2014,
    "journal": "Skin pharmacology and physiology",
    "doi": "10.1159/000355523",
    "pmid": "24401291",
    "url": "https://doi.org/10.1159/000355523",
    "verified": true,
    "takeaways": [
      "One hundred fourteen women aged 45-65 took 2.5 g/day of a specific bioactive collagen peptide or placebo for 8 weeks.",
      "Eye wrinkle volume fell significantly (about 20%) at 4 and 8 weeks, with an effect persisting 4 weeks after stopping.",
      "In biopsies, procollagen type I increased 65% and elastin 18% versus placebo; the fibrillin increase was non-significant.",
      "The dose is small; the product was a specific peptide, not generic gelatin."
    ],
    "facts": {
      "design": "RCT",
      "population": "114 women aged 45-65"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:collagen-peptides",
        "note": "Skin benefit at only 2.5 g/day."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:collagen-synthesis",
        "note": "Raised markers of dermal procollagen and elastin synthesis."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:collagen-synthesis-adequacy",
        "note": "Suggests low-gram collagen peptides can signal matrix synthesis."
      }
    ]
  },
  {
    "id": "article:de-miranda-2021-collagen-skin-meta-analysis",
    "type": "article",
    "name": "Effects of hydrolyzed collagen supplementation on skin aging: a systematic review and meta-analysis",
    "aliases": [
      "de Miranda 2021"
    ],
    "summary": "Meta-analysis of 19 RCTs (n=1,125): 90 days of hydrolysed collagen supplements improved skin hydration, elasticity and wrinkles versus placebo.",
    "body": [
      "Pooled evidence for skin effects of [[intervention:collagen-peptides]]. It supports modest benefit for skin ([[outcome:collagen-synthesis-adequacy]]); trial doses are typically a few grams per day."
    ],
    "evidence": "established",
    "authors": [
      "de Miranda RB",
      "Weimer P",
      "Rossi RC"
    ],
    "year": 2021,
    "journal": "International journal of dermatology",
    "doi": "10.1111/ijd.15518",
    "pmid": "33742704",
    "url": "https://doi.org/10.1111/ijd.15518",
    "verified": true,
    "takeaways": [
      "Nineteen randomised double-blind trials with 1,125 participants (95% women, aged 20-70) were pooled.",
      "Hydrolysed collagen gave favourable results for hydration, elasticity and wrinkles versus placebo.",
      "Hydration and elasticity improvements were confirmed in subgroup meta-analysis.",
      "Ingestion for about 90 days was effective in reducing skin aging signs; most participants were women."
    ],
    "facts": {
      "design": "meta-analysis",
      "population": "19 RCTs, n=1,125"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:collagen-peptides",
        "note": "Pooled RCT evidence for skin benefit."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:collagen-synthesis-adequacy",
        "note": "Skin matrix outcomes improved with supplementation."
      }
    ]
  },
  {
    "id": "article:shaw-2017-gelatin-collagen-synthesis",
    "type": "article",
    "name": "Vitamin C-enriched gelatin supplementation before intermittent activity augments collagen synthesis",
    "aliases": [
      "Shaw 2017"
    ],
    "summary": "Eight-man crossover: 5 or 15 g vitamin C-enriched gelatin raised blood glycine, proline and hydroxyproline and, at 15 g one hour before exercise, doubled the collagen propeptide marker PINP.",
    "body": [
      "Supports the idea that [[compound:glycine]] and proline supply can limit [[pathway:collagen-synthesis]] and that [[intervention:collagen-peptides]] can raise it ([[outcome:collagen-synthesis-adequacy]]). Only eight men and a surrogate marker; it also included vitamin C."
    ],
    "evidence": "plausible",
    "authors": [
      "Shaw G",
      "Lee-Barthel A",
      "Ross ML",
      "Wang B",
      "Baar K"
    ],
    "year": 2017,
    "journal": "The American journal of clinical nutrition",
    "doi": "10.3945/ajcn.116.138594",
    "pmid": "27852613",
    "url": "https://doi.org/10.3945/ajcn.116.138594",
    "verified": true,
    "takeaways": [
      "Eight healthy men took 5 or 15 g vitamin C-enriched gelatin or placebo before jump-rope exercise three times a day for three days.",
      "Gelatin increased circulating glycine, proline, hydroxyproline and hydroxylysine, peaking at one hour.",
      "Serum collected after 15 g gelatin increased collagen content and improved mechanics in engineered ligaments.",
      "Taking 15 g one hour before exercise doubled blood amino-terminal propeptide of collagen I, suggesting increased collagen synthesis."
    ],
    "facts": {
      "design": "RCT",
      "population": "8 healthy men"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:collagen-peptides",
        "note": "Gram-level gelatin raised collagen synthesis markers when paired with exercise and vitamin C."
      },
      {
        "rel": "evidence-for",
        "to": "pathway:collagen-synthesis",
        "note": "Raised PINP and ligament collagen content."
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Circulating glycine rose after gelatin."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:collagen-synthesis-adequacy",
        "note": "Supports a supply-limited component of collagen synthesis."
      }
    ]
  },
  {
    "id": "article:ohara-2007-hydroxyproline-peptides-blood",
    "type": "article",
    "name": "Comparison of quantity and structures of hydroxyproline-containing peptides in human blood after oral ingestion of gelatin hydrolysates from different sources",
    "aliases": [
      "Ohara 2007"
    ],
    "summary": "Five volunteers ingesting gelatin hydrolysates showed hydroxyproline-containing peptides make up about 30% of blood hydroxyproline, with levels depending on the collagen source.",
    "body": [
      "Pharmacokinetic evidence that [[intervention:collagen-peptides]] are absorbed partly as small hydroxyproline peptides ([[compound:collagen]]). It is a five-person study, and the result does not address the stomach or gas."
    ],
    "evidence": "plausible",
    "authors": [
      "Ohara H",
      "Matsumoto H",
      "Ito K",
      "Iwai K",
      "Sato K"
    ],
    "year": 2007,
    "journal": "Journal of agricultural and food chemistry",
    "doi": "10.1021/jf062834s",
    "pmid": "17253720",
    "url": "https://doi.org/10.1021/jf062834s",
    "verified": true,
    "takeaways": [
      "Five healthy men took type I gelatin hydrolysate from fish scale, fish skin or porcine skin after a 12-hour fast.",
      "Free hydroxyproline and hydroxyproline-containing peptides were measured over 24 hours.",
      "Peptides made up roughly 30% of detected hydroxyproline, with Pro-Hyp the major peptide.",
      "Total exposure was higher for fish scale than for porcine skin hydrolysate."
    ],
    "facts": {
      "design": "controlled human study",
      "population": "5 healthy men"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:collagen-peptides",
        "note": "Collagen-derived di- and tripeptides reach human blood after ingestion."
      },
      {
        "rel": "evidence-for",
        "to": "compound:collagen",
        "note": "Source of collagen affects peptide exposure."
      }
    ]
  },
  {
    "id": "article:rahimi-2026-statpearls-collagen-synthesis",
    "type": "article",
    "name": "Biochemistry, Collagen Synthesis",
    "aliases": [
      "Rahimi 2026 (StatPearls)"
    ],
    "summary": "StatPearls chapter: every third residue of collagen is glycine, vitamin C is needed for proline hydroxylation, and synthesis defects cause conditions like scurvy.",
    "body": [
      "Textbook baseline for [[pathway:collagen-synthesis]]: [[compound:glycine]] at every third position, vitamin C for hydroxylation. Useful for sizing glycine demand ([[compound:collagen]])."
    ],
    "evidence": "established",
    "authors": [
      "Rahimi N",
      "Launico MV"
    ],
    "year": 2026,
    "journal": "StatPearls (NCBI Bookshelf)",
    "pmid": "29939531",
    "url": "https://pubmed.ncbi.nlm.nih.gov/29939531/",
    "verified": true,
    "takeaways": [
      "Collagen is a triple helix whose amino acid composition is rich in glycine, proline and hydroxyproline.",
      "Glycine occupies every third position along the chain, enabling tight packing of the helices.",
      "Synthesis starts intracellularly in fibroblasts with vitamin C-dependent hydroxylation in the rough endoplasmic reticulum, then secretion and propeptide cleavage.",
      "Impaired hydroxylation from vitamin C deficiency causes scurvy and weak connective tissue."
    ],
    "facts": {
      "design": "textbook"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:collagen-synthesis",
        "note": "Describes the steps and cofactors of collagen synthesis."
      },
      {
        "rel": "evidence-for",
        "to": "compound:collagen"
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Glycine occupies every third residue."
      }
    ]
  },
  {
    "id": "article:warren-2021-pyroluria-fact-or-fiction",
    "type": "article",
    "name": "Pyroluria: Fact or Fiction?",
    "aliases": [
      "Warren 2021"
    ],
    "summary": "PRISMA review of 73 articles on pyroluria (urinary HPL): only 3 studies found higher HPL in psychiatric patients, there were no placebo-controlled treatment trials, and HPL testing is not recommended.",
    "body": [
      "Best current critical review of [[disease:pyroluria-kpu]]. It argues against using HPL testing as a screening or treatment tool, and offers no support for supplementing [[intervention:p5p-supplement|P5P]] in pyroluria on current evidence ([[state:b6-functional-deficiency]])."
    ],
    "evidence": "established",
    "authors": [
      "Warren B",
      "Sarris J",
      "Mulder RT",
      "Rucklidge JJ"
    ],
    "year": 2021,
    "journal": "Journal of alternative and complementary medicine (New York, N.Y.)",
    "doi": "10.1089/acm.2020.0151",
    "pmid": "33902305",
    "url": "https://doi.org/10.1089/acm.2020.0151",
    "verified": true,
    "takeaways": [
      "Pyroluria ('mauve factor') was proposed by Hoffer in 1958 as elevated urinary pyrroles (HPL) causing zinc and B6 depletion and psychiatric illness.",
      "Of 73 articles, only three found significantly higher HPL in psychiatric populations; 13 other clinical studies showed no association or inadequate data.",
      "There was no placebo-controlled trial directed at pyroluria.",
      "No robust evidence shows elevated HPL causes mental symptoms, increases urinary zinc/B6 loss, or that high-dose zinc and B6 treat it."
    ],
    "facts": {
      "design": "systematic-review"
    },
    "relations": [
      {
        "rel": "evidence-against",
        "to": "disease:pyroluria-kpu",
        "note": "Evidence for pyroluria as a diagnosable entity and for HPL testing is poor."
      },
      {
        "rel": "evidence-against",
        "to": "intervention:p5p-supplement",
        "note": "No placebo-controlled evidence that B6 (with zinc) treats pyrroluria."
      },
      {
        "rel": "evidence-against",
        "to": "state:b6-functional-deficiency",
        "note": "No robust link between elevated HPL and functional B6 loss."
      }
    ]
  },
  {
    "id": "article:mcginnis-2008-mauve-factor-hpl",
    "type": "article",
    "name": "Discerning the Mauve Factor, Part 1",
    "aliases": [
      "McGinnis 2008"
    ],
    "summary": "Authors of a Mauve Factor review report that urinary HPL correlated inversely with red-cell B6 activity and zinc and plasma glutathione and directly with nitric oxide in mixed patient cohorts.",
    "body": [
      "The main proponent-side source on [[disease:pyroluria-kpu]], reporting correlations between HPL and B6 and zinc markers ([[state:b6-functional-deficiency]]). It should be read alongside [[article:warren-2021-pyroluria-fact-or-fiction]], which found little controlled evidence for the treatment claim ([[intervention:p5p-supplement|P5P]])."
    ],
    "evidence": "speculative",
    "authors": [
      "McGinnis WR",
      "Audhya T",
      "Walsh WJ",
      "Jackson JA",
      "McLaren-Howard J",
      "Lewis A",
      "Lauda PH",
      "Bibus DM",
      "Jurnak F",
      "Lietha R",
      "et al."
    ],
    "year": 2008,
    "journal": "Alternative therapies in health and medicine",
    "pmid": "18383989",
    "url": "https://pubmed.ncbi.nlm.nih.gov/18383989/",
    "verified": true,
    "takeaways": [
      "The 'Mauve Factor' was once mistaken for kryptopyrrole but is hydroxyhemopyrrolin-2-one (HPL).",
      "In mixed-diagnosis cohorts, 24-hour urinary HPL correlated negatively with vitamin B6 activity and red-cell zinc (P<0.0001).",
      "HPL also correlated inversely with plasma glutathione and red-cell catalase and directly with plasma nitric oxide, suggesting an oxidative stress marker.",
      "The authors report B6 and zinc reduce HPL excretion and improve neurobehavioral symptoms; these are non-blinded clinical observations, and a later systematic review found little controlled support."
    ],
    "facts": {
      "design": "cohort"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "disease:pyroluria-kpu",
        "note": "Reports HPL as a correlate of B6/zinc status and oxidative stress."
      },
      {
        "rel": "evidence-for",
        "to": "state:b6-functional-deficiency",
        "note": "Correlation of HPL with low red-cell B6 activity in mixed cohorts."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:p5p-supplement",
        "note": "Claims improvement with B6 and zinc; form of B6 and controls not described in the abstract."
      }
    ]
  },
  {
    "id": "article:neis-2015-microbial-amino-acid-metabolism",
    "type": "article",
    "name": "The role of microbial amino acid metabolism in host metabolism",
    "aliases": [
      "Neis 2015"
    ],
    "summary": "Review: gut bacteria use amino acids from both food and endogenous protein and release others and short-chain fatty acid precursors, shaping host amino acid homeostasis.",
    "body": [
      "General support for microbial use of free amino acids ([[system:gut-microbiota]]). Whether the small intestine or stomach in particular makes gas from [[compound:glycine]] is not addressed."
    ],
    "evidence": "plausible",
    "authors": [
      "Neis EP",
      "Dejong CH",
      "Rensen SS"
    ],
    "year": 2015,
    "journal": "Nutrients",
    "doi": "10.3390/nu7042930",
    "pmid": "25894657",
    "url": "https://doi.org/10.3390/nu7042930",
    "verified": true,
    "takeaways": [
      "Gut bacteria alter amino acid availability by using amino acids from alimentary and endogenous proteins.",
      "In turn they supply amino acids to the host.",
      "Microbial amino acids can serve as precursors for short-chain fatty acids.",
      "The review focuses on aromatic and branched-chain amino acids in insulin resistance and obesity rather than glycine or upper-gut gas."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "system:gut-microbiota",
        "note": "General evidence that microbes metabolise dietary and endogenous amino acids."
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Applies generally; glycine fermentation is not specifically covered in the abstract."
      }
    ]
  },
  {
    "id": "article:rizvi-2023-glycine-fermentation-c-difficile",
    "type": "article",
    "name": "Glycine fermentation by C. difficile promotes virulence and spore formation, and is induced by host cathelicidin",
    "aliases": [
      "Rizvi 2023"
    ],
    "summary": "Glycine reductase (grd) lets C. difficile ferment glycine for energy, promoting growth, toxin and spores in hamsters, and is induced by host cathelicidin.",
    "body": [
      "Demonstrates that a gut bacterium ferments [[compound:glycine]] via glycine reductase ([[system:gut-microbiota]]). This is a colonic pathogen model; it does not show that upper-gut bacteria produce belching gas from supplemental glycine."
    ],
    "evidence": "plausible",
    "authors": [
      "Rizvi A",
      "Vargas-Cuebas G",
      "Edwards AN",
      "DiCandia MA",
      "Carter ZA",
      "Lee CD",
      "Monteiro MP",
      "McBride SM"
    ],
    "year": 2023,
    "journal": "Infection and immunity",
    "doi": "10.1128/iai.00319-23",
    "pmid": "37754683",
    "url": "https://doi.org/10.1128/iai.00319-23",
    "verified": true,
    "takeaways": [
      "Glycine is enriched in the dysbiotic gut and is suspected to contribute to C. difficile infection.",
      "Deleting the glycine reductase genes grdAB prevented glycine fermentation.",
      "The grd pathway promoted growth, toxin production and sporulation, and affected disease in the hamster model.",
      "The locus is regulated by the host peptide LL-37 through the regulator ClnR."
    ],
    "facts": {
      "design": "animal"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "A gut pathogen can use glycine as an energy source by fermentation (Stickland-type chemistry)."
      },
      {
        "rel": "evidence-for",
        "to": "system:gut-microbiota",
        "note": "Glycine fermentation is a recognised microbial metabolic route, shown in one species."
      }
    ]
  },
  {
    "id": "article:yago-2013-betaine-hcl-reacidification",
    "type": "article",
    "name": "Gastric reacidification with betaine HCl in healthy volunteers with rabeprazole-induced hypochlorhydria",
    "aliases": [
      "Yago 2013"
    ],
    "summary": "In six volunteers made hypochlorhydric with rabeprazole, 1,500 mg betaine HCl dropped gastric pH from 5.2 to 0.6 within 30 minutes, kept it below pH 3 for about 73 minutes and was well tolerated.",
    "body": [
      "Pharmacodynamic proof that [[intervention:betaine-hcl]] acidifies the stomach ([[state:hypochlorhydria]]). Tolerability in people with ulcer history is not covered, so burning with betaine HCl in such people has no direct trial evidence here."
    ],
    "evidence": "plausible",
    "authors": [
      "Yago MR",
      "Frymoyer AR",
      "Smelick GS",
      "Frassetto LA",
      "Budha NR",
      "Dresser MJ",
      "Ware JA",
      "Benet LZ"
    ],
    "year": 2013,
    "journal": "Molecular pharmaceutics",
    "doi": "10.1021/mp4003738",
    "pmid": "23980906",
    "url": "https://doi.org/10.1021/mp4003738",
    "verified": true,
    "takeaways": [
      "Six healthy volunteers with induced hypochlorhydria (rabeprazole) were monitored with a Heidelberg pH capsule.",
      "Betaine HCl 1,500 mg with 90 mL water lowered gastric pH by about 4.5 units to 0.6 in the first 30 minutes.",
      "Onset was rapid (pH below 3 in about 6 minutes) and gastric pH stayed below 3 for about 73 minutes.",
      "It was well tolerated by these healthy subjects; patients with ulcer history or gastritis were not studied."
    ],
    "facts": {
      "design": "controlled human study",
      "population": "6 healthy volunteers, induced hypochlorhydria"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:betaine-hcl",
        "note": "Betaine HCl reliably acidifies a PPI-suppressed stomach for about an hour."
      },
      {
        "rel": "evidence-for",
        "to": "state:hypochlorhydria",
        "note": "Demonstrates reversal of drug-induced hypochlorhydria."
      }
    ]
  },
  {
    "id": "article:taylor-2024-betaine-hcl-autoimmune-gastritis",
    "type": "article",
    "name": "Creating a Framework for Treating Autoimmune Gastritis-The Case for Replacing Lost Acid",
    "aliases": [
      "Taylor 2024"
    ],
    "summary": "Narrative review proposing betaine HCl as mealtime acid replacement in autoimmune gastritis; arguments are theoretical and no outcome trials are cited in the abstract.",
    "body": [
      "Defines the setting in which [[intervention:betaine-hcl]] is rationally argued: documented achlorhydria ([[state:hypochlorhydria]]). It does not address safety in people with ulcers or mucosal burning."
    ],
    "evidence": "speculative",
    "authors": [
      "Taylor L",
      "McCaddon A",
      "Wolffenbuttel BHR"
    ],
    "year": 2024,
    "journal": "Nutrients",
    "doi": "10.3390/nu16050662",
    "pmid": "38474790",
    "url": "https://doi.org/10.3390/nu16050662",
    "verified": true,
    "takeaways": [
      "Autoimmune gastritis destroys parietal cells, causing hypochlorhydria then achlorhydria, hypergastrinemia and higher N-nitroso compound formation.",
      "Betaine hydrochloride is a short-acting over-the-counter acidifying agent with historical use at meals.",
      "The authors propose it could ease GI symptoms and possibly lower hypergastrinemia and gastric cancer risk, with vitamin C reducing N-nitroso formation.",
      "These benefits are theoretical, based on narrative reasoning rather than outcome trials."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:betaine-hcl",
        "note": "Argues for acid replacement in achlorhydric patients; proposal, not proven."
      },
      {
        "rel": "evidence-for",
        "to": "state:hypochlorhydria",
        "note": "Describes the consequences of lost gastric acid in autoimmune gastritis."
      }
    ]
  },
  {
    "id": "article:reactome-choline-catabolism",
    "type": "article",
    "name": "Choline catabolism (Reactome pathway R-HSA-6798163)",
    "aliases": [
      "Reactome: Choline catabolism"
    ],
    "summary": "Reactome curated pathway: choline is oxidised by CHDH and ALDH7A1 to betaine, which BHMT uses to methylate homocysteine, then DMGDH and SARDH demethylate dimethylglycine and sarcosine down to glycine.",
    "body": [
      "Database map of [[pathway:choline-oxidation]] from [[compound:choline]] through [[compound:betaine]] and [[enzyme:bhmt]] to [[compound:glycine]]. It shows route topology, not quantitative flux; the route yields glycine inside cells."
    ],
    "evidence": "established",
    "authors": [
      "Reactome Knowledgebase"
    ],
    "year": 2016,
    "journal": "Reactome Pathway Database",
    "url": "https://reactome.org/content/detail/R-HSA-6798163",
    "verified": true,
    "takeaways": [
      "Pathway R-HSA-6798163: choline enters mitochondria (SLC44A1/2), is oxidised by CHDH to betaine aldehyde and by ALDH7A1 to betaine.",
      "BHMT transfers a methyl group from betaine to homocysteine, forming dimethylglycine.",
      "DMGDH oxidatively demethylates dimethylglycine to sarcosine, and SARDH demethylates sarcosine to glycine.",
      "It is a curated reference map of the route, with no rate data or dosing information."
    ],
    "facts": {
      "design": "database",
      "population": "Homo sapiens"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:choline-oxidation",
        "note": "Reference pathway map."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:chdh",
        "note": "CHDH is the first committed oxidation step."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:bhmt",
        "note": "BHMT links betaine to homocysteine remethylation."
      },
      {
        "rel": "evidence-for",
        "to": "compound:betaine"
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine",
        "note": "Glycine is the end product of the demethylation cascade."
      }
    ]
  },
  {
    "id": "article:reactome-glycine-degradation",
    "type": "article",
    "name": "Glycine degradation (Reactome pathway R-HSA-6783984)",
    "aliases": [
      "Reactome: Glycine degradation"
    ],
    "summary": "Reactome curated pathway: glycine is catabolised by several routes, the major being the glycine cleavage system (GLDC, AMT, DLD, GCSH).",
    "body": [
      "Database entry for [[pathway:glycine-cleavage]] and [[enzyme:glycine-cleavage-system|GCS]], based on [[article:kikuchi-2008-glycine-cleavage-system]]. Reactions occur in cells and mitochondria, not in the gastric lumen."
    ],
    "evidence": "established",
    "authors": [
      "Reactome Knowledgebase"
    ],
    "year": 2015,
    "journal": "Reactome Pathway Database",
    "url": "https://reactome.org/content/detail/R-HSA-6783984",
    "verified": true,
    "takeaways": [
      "Pathway R-HSA-6783984 states that glycine is catabolised by several pathways, the major one being the glycine cleavage system.",
      "The system comprises the P protein (GLDC), T protein (AMT/GCST), L protein (DLD) and H protein (GCSH).",
      "Annotated reactions include GLDC decarboxylating glycine and AMT transferring the aminomethyl group to THF.",
      "It cites Kikuchi et al. 2008 and provides a pathway map, not quantitative data."
    ],
    "facts": {
      "design": "database",
      "population": "Homo sapiens"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:glycine-cleavage",
        "note": "Reference pathway for human glycine catabolism."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:glycine-cleavage-system",
        "note": "Components of the cleavage system are annotated."
      },
      {
        "rel": "evidence-for",
        "to": "compound:glycine"
      }
    ]
  },
  {
    "id": "article:reactome-folate-pterine-metabolism",
    "type": "article",
    "name": "Metabolism of folate and pterines (Reactome pathway R-HSA-196757)",
    "aliases": [
      "Reactome: Metabolism of folate and pterines"
    ],
    "summary": "Reactome curated pathway of folate transport, polyglutamylation, DHFR reduction of folic acid and generation of one-carbon folate derivatives, including 5-methyl-THF uptake.",
    "body": [
      "Database map of the [[pathway:folate-cycle]] including DHFR reduction of folic acid and handling of [[compound:5-mthf|5-methyl-THF]]. It illustrates why [[intervention:methylfolate-supplement|methylfolate]] bypasses the DHFR step, without quantifying how much that matters."
    ],
    "evidence": "established",
    "authors": [
      "Reactome Knowledgebase"
    ],
    "year": 2007,
    "journal": "Reactome Pathway Database",
    "url": "https://reactome.org/content/detail/R-HSA-196757",
    "verified": true,
    "takeaways": [
      "Pathway R-HSA-196757 covers folate transport into cells, glutamate conjugation (folate retention) and reduction of folic acid by DHFR to DHF and THF.",
      "Annotated reactions include SLC19A1 transport of 5-methyl-THF and mitochondrial THF import.",
      "Folates provide one-carbon moieties for biosynthetic reactions.",
      "It is a reference map; individual dose-response or variant effects are outside its scope."
    ],
    "facts": {
      "design": "database",
      "population": "Homo sapiens"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:folate-cycle",
        "note": "Reference map of human folate metabolism."
      },
      {
        "rel": "evidence-for",
        "to": "compound:5-mthf",
        "note": "5-methyl-THF transport is annotated."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:methylfolate-supplement",
        "note": "Shows folic acid requires DHFR reduction while 5-methyl-THF is already reduced."
      }
    ]
  },
  {
    "id": "article:reactome-sulfur-amino-acid-metabolism",
    "type": "article",
    "name": "Sulfur amino acid metabolism (Reactome pathway R-HSA-1614635)",
    "aliases": [
      "Reactome: Sulfur amino acid metabolism"
    ],
    "summary": "Reactome curated pathway of sulfur amino acid metabolism, including MAT, AHCY, MTR and BHMT reactions that form and recycle SAM, SAH and homocysteine.",
    "body": [
      "Database map of the [[pathway:methionine-cycle]] and its links to [[compound:sam]], [[compound:sah]] and [[compound:homocysteine]], including the betaine-dependent [[enzyme:bhmt]] route."
    ],
    "evidence": "established",
    "authors": [
      "Reactome Knowledgebase"
    ],
    "year": 2011,
    "journal": "Reactome Pathway Database",
    "url": "https://reactome.org/content/detail/R-HSA-1614635",
    "verified": true,
    "takeaways": [
      "Pathway R-HSA-1614635 covers breakdown, interconversion and synthesis of methionine, cysteine, homocysteine and taurine.",
      "It notes humans cannot synthesise sulfur amino acids de novo nor convert cysteine to methionine (Brosnan & Brosnan 2006).",
      "Annotated reactions include methionine adenosyltransferase, AdoHcy hydrolase, methionine synthase and BHMT.",
      "It is a reference map without rates."
    ],
    "facts": {
      "design": "database",
      "population": "Homo sapiens"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "pathway:methionine-cycle",
        "note": "Reference map of methionine-cycle reactions."
      },
      {
        "rel": "evidence-for",
        "to": "enzyme:bhmt",
        "note": "BHMT remethylation reaction annotated."
      },
      {
        "rel": "evidence-for",
        "to": "compound:homocysteine"
      },
      {
        "rel": "evidence-for",
        "to": "compound:sam"
      }
    ]
  },
  {
    "id": "article:kamiya-2011-omeprazole-gastric-motility",
    "type": "article",
    "name": "The effect of omeprazole on gastric myoelectrical activity and emptying",
    "aliases": [
      "Kamiya 2011"
    ],
    "summary": "In 12 healthy volunteers, seven days of omeprazole 20 mg left gastric emptying half-time unchanged and increased normal gastric rhythm on electrogastrography, arguing against PPI-slowed emptying.",
    "body": [
      "Direct test of the idea that acid suppression slows the stomach. In healthy volunteers [[intervention:ppi-therapy|PPIs]] did not delay emptying after a week ([[state:gastric-dysmotility]]), so the claim that PPIs cause or worsen dysmotility is not supported here. Long-term use and patients with SIBO or dysmotility were not examined."
    ],
    "evidence": "plausible",
    "authors": [
      "Kamiya T",
      "Shikano M",
      "Tanaka M",
      "Tsukamoto H",
      "Ebi M",
      "Hirata Y",
      "Mizushima T",
      "Murakami K",
      "Shimura T",
      "Mizoshita T",
      "et al."
    ],
    "year": 2011,
    "journal": "Journal of smooth muscle research = Nihon Heikatsukin Gakkai kikanshi",
    "doi": "10.1540/jsmr.47.79",
    "pmid": "21979407",
    "url": "https://doi.org/10.1540/jsmr.47.79",
    "verified": true,
    "takeaways": [
      "Twelve healthy volunteers had electrogastrography and 13C-acetic acid breath-test gastric emptying before and after 7 days of omeprazole 20 mg.",
      "Fasting normogastria increased significantly; tachygastria, bradygastria and power ratios did not change significantly.",
      "Gastric emptying parameters, including half-emptying time, did not differ from baseline.",
      "The authors conclude omeprazole did not affect gastric motility and improved myoelectrical activity, a possible mechanism of relief in functional dyspepsia; short-term, healthy subjects only."
    ],
    "facts": {
      "design": "controlled human study",
      "population": "12 healthy volunteers"
    },
    "relations": [
      {
        "rel": "evidence-against",
        "to": "intervention:ppi-therapy",
        "note": "A one-week PPI course did not delay gastric emptying in healthy volunteers."
      },
      {
        "rel": "evidence-against",
        "to": "state:gastric-dysmotility",
        "note": "PPI use did not produce measurable gastric dysmotility in this short study."
      }
    ]
  },
  {
    "id": "article:futagami-2010-mosapride-omeprazole-nerd",
    "type": "article",
    "name": "The prokinetic effect of mosapride citrate combined with omeprazole therapy improves clinical symptoms and gastric emptying in PPI-resistant NERD patients with delayed gastric emptying",
    "aliases": [
      "Futagami 2010"
    ],
    "summary": "In PPI-resistant non-erosive reflux patients, those with delayed gastric emptying improved on adding the prokinetic mosapride to omeprazole, linking delayed emptying to PPI resistance.",
    "body": [
      "Links delayed emptying ([[state:gastric-dysmotility]]) with PPI-resistant [[disease:gerd]]. It suggests belching or reflux that does not respond to [[intervention:ppi-therapy|PPIs]] may reflect motility, but it does not show that PPIs caused the delay."
    ],
    "evidence": "plausible",
    "authors": [
      "Futagami S",
      "Iwakiri K",
      "Shindo T",
      "Kawagoe T",
      "Horie A",
      "Shimpuku M",
      "Tanaka Y",
      "Kawami N",
      "Gudis K",
      "Sakamoto C"
    ],
    "year": 2010,
    "journal": "Journal of gastroenterology",
    "doi": "10.1007/s00535-009-0173-0",
    "pmid": "19997942",
    "url": "https://doi.org/10.1007/s00535-009-0173-0",
    "verified": true,
    "takeaways": [
      "Forty-four PPI-resistant NERD patients and 20 healthy volunteers were evaluated; patients received mosapride 15 mg plus omeprazole 20 mg for 12 weeks.",
      "Gastric emptying (Tmax) was slower in PPI-resistant patients than in healthy volunteers.",
      "In those with Tmax above 65 minutes, combination therapy improved reflux symptoms and emptying time.",
      "Des-acylated ghrelin fell with co-therapy in patients with delayed emptying; the study was uncontrolled for placebo."
    ],
    "facts": {
      "design": "controlled trial",
      "population": "44 PPI-resistant NERD patients, 20 healthy volunteers"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "state:gastric-dysmotility",
        "note": "Delayed emptying is common in PPI-refractory reflux and responds to a prokinetic."
      },
      {
        "rel": "evidence-for",
        "to": "disease:gerd",
        "note": "Gastric emptying delay may contribute to refractory reflux symptoms."
      },
      {
        "rel": "evidence-for",
        "to": "intervention:ppi-therapy",
        "note": "PPI response is limited when delayed emptying coexists."
      }
    ]
  },
  {
    "id": "article:matsukura-2000-zinc-carnosine-complex",
    "type": "article",
    "name": "Applicability of zinc complex of L-carnosine for medical use",
    "aliases": [
      "Matsukura 2000"
    ],
    "summary": "Review of zinc L-carnosine (polaprezinc): a polymeric complex that stays intact in gastric juice, adheres to ulcerous lesions and releases carnosine and zinc; approved as an anti-ulcer drug.",
    "body": [
      "Source of the 'adheres to ulcerous lesions' description of [[intervention:zinc-carnosine]]. It rests on physicochemical characterisation rather than imaging in people, so adhesion and [[outcome:ulcer-healing]] claims are best supported by the trials ([[article:shen-2022-polaprezinc-vs-rebamipide]]) and by [[disease:h-pylori-infection]] data."
    ],
    "evidence": "plausible",
    "authors": [
      "Matsukura T",
      "Tanaka H"
    ],
    "year": 2000,
    "journal": "Biochemistry. Biokhimiia",
    "pmid": "10951100",
    "url": "https://pubmed.ncbi.nlm.nih.gov/10951100/",
    "verified": true,
    "takeaways": [
      "Zinc ion coordinates with L-carnosine to form a polymeric 1:1 quadridentate complex.",
      "The complex can remain in gastric juice without rapid dissociation and adhere specifically to ulcerous lesions, where carnosine and zinc are released.",
      "It was approved as a membrane-protective anti-ulcer drug and showed high clinical efficacy without serious side effects.",
      "It also inhibits Helicobacter pylori; the review is a physicochemical and pharmacological summary, not a controlled-trial synthesis."
    ],
    "facts": {
      "design": "review"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:zinc-carnosine",
        "note": "Physicochemical basis for lesion adhesion and the approved anti-ulcer use."
      },
      {
        "rel": "evidence-for",
        "to": "outcome:ulcer-healing",
        "note": "Reports efficacy in ulcer healing clinically; no trial data in abstract."
      },
      {
        "rel": "evidence-for",
        "to": "disease:h-pylori-infection",
        "note": "Reports an inhibitory effect on H. pylori."
      }
    ]
  },
  {
    "id": "article:pizzorni-2022-alginate-vs-ppi-lpr",
    "type": "article",
    "name": "Magnesium alginate versus proton pump inhibitors for the treatment of laryngopharyngeal reflux: a non-inferiority randomized controlled trial",
    "aliases": [
      "Pizzorni 2022"
    ],
    "summary": "Randomised non-inferiority trial (n=50): an alginate suspension lowered laryngopharyngeal reflux symptom and sign scores about as much as omeprazole over two months.",
    "body": [
      "Fifty patients with laryngopharyngeal symptoms and findings were randomised to a magnesium-alginate suspension taken three times a day or omeprazole 20 mg once daily. Both arms improved and the difference between them was not statistically significant, which the authors read as non-inferiority of [[intervention:sodium-alginate]] to [[intervention:ppi-therapy]] in [[disease:lpr]].",
      "It is a small trial without a placebo arm, so spontaneous improvement and placebo response cannot be separated from drug effect; it supports alginate as a reasonable alternative, not as proof that rafts specifically protect the larynx."
    ],
    "evidence": "plausible",
    "authors": [
      "Pizzorni N",
      "Ambrogi F",
      "Eplite A",
      "Rama S",
      "Robotti C",
      "Lechien J",
      "Schindler A"
    ],
    "year": 2022,
    "journal": "European archives of oto-rhino-laryngology : official journal of the European Federation of Oto-Rhino-Laryngological Societies (EUFOS) : affiliated with the German Society for Oto-Rhino-Laryngology - Head and Neck Surgery",
    "doi": "10.1007/s00405-021-07219-0",
    "pmid": "35032204",
    "url": "https://doi.org/10.1007/s00405-021-07219-0",
    "verified": true,
    "takeaways": [
      "Patients were randomised to alginate suspension (20 ml, three daily doses) or omeprazole 20 mg once daily and assessed after two months.",
      "The Reflux Symptom Index and the Reflux Finding Score fell significantly in both groups, and the between-group differences were not significant.",
      "The authors conclude alginate was non-inferior to omeprazole; with only 50 patients and no placebo group, the result is suggestive rather than definitive."
    ],
    "facts": {
      "design": "rct",
      "population": "50 adults with LPR symptoms (RSI >= 13) and signs (RFS >= 7)"
    },
    "relations": [
      {
        "rel": "evidence-for",
        "to": "intervention:sodium-alginate",
        "note": "Symptom and sign scores improved on alginate to a degree not distinguishable from omeprazole."
      }
    ]
  },
  {
    "id": "article:guilliams-2020-betaine-hcl-evidence",
    "type": "article",
    "name": "Meal-Time Supplementation with Betaine HCl for Functional Hypochlorhydria: What is the Evidence?",
    "aliases": [
      "Guilliams 2020"
    ],
    "summary": "Review of betaine HCl for functional hypochlorhydria: acidifies PPI-treated stomachs quickly, the empirical dose protocol is untested, and it is contraindicated in peptic ulcer.",
    "body": [
      "The authors outline why mealtime \"functional\" hypochlorhydria may matter in older people, then review the thin human evidence for [[intervention:betaine-hcl]]. The key data are small studies in healthy volunteers whose acid was suppressed with a [[intervention:ppi-therapy]]; a 1,500 mg dose of betaine HCl drove gastric pH from about 5 to below 1 within minutes, with the effect lasting roughly an hour in the fasted state.",
      "The paper distinguishes the acidic hydrochloride salt from non-acidic anhydrous [[compound:betaine]] (TMG), whose main use is as a methyl donor, and states that HCl/pepsin products are contraindicated in [[disease:peptic-ulcer]]. One author discloses an adviser role for a supplement company."
    ],
    "evidence": "plausible",
    "authors": [
      "Guilliams TG",
      "Drake LE"
    ],
    "year": 2020,
    "journal": "Integrative medicine (Encinitas, Calif.)",
    "pmid": "32549862",
    "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7238915/",
    "verified": true,
    "takeaways": [
      "Betaine HCl releases about 0.65 mmol of H+ per 100 mg and is a different substance from non-acidic betaine (TMG), which is used as a methyl donor; the two are often confused.",
      "In small volunteer studies, 1,500 mg betaine HCl rapidly re-acidified a PPI-suppressed stomach but the effect faded within roughly 75 minutes when fasting, and was slower in the fed state.",
      "The popular dose-escalation protocol (increase until a burning sensation appears) is described as widely used but not rigorously tested.",
      "HCl/pepsin products are listed as contraindicated in peptic ulcer disease; fasting hypochlorhydria prevalence in older adults varies widely between studies."
    ],
    "facts": {
      "design": "review"
    }
  },
  {
    "id": "article:ueland-2011-choline-betaine",
    "type": "article",
    "name": "Choline and betaine in health and disease",
    "aliases": [
      "Ueland 2011"
    ],
    "summary": "Review linking choline and betaine to one-carbon metabolism: both lower plasma homocysteine, betaine derives from choline, and cardiovascular and cancer associations are inconsistent.",
    "body": [
      "Ueland summarises how [[compound:choline]] is oxidised to [[compound:betaine]], which serves both as an osmolyte and as the methyl donor of [[enzyme:bhmt]], thereby linking choline status to [[compound:homocysteine]] remethylation when folate is limiting. The review covers [[system:liver]] and [[system:kidney]] handling and the evidence on health outcomes."
    ],
    "evidence": "established",
    "authors": [
      "Ueland PM"
    ],
    "year": 2011,
    "journal": "Journal of inherited metabolic disease",
    "doi": "10.1007/s10545-010-9088-4",
    "pmid": "20446114",
    "url": "https://doi.org/10.1007/s10545-010-9088-4",
    "verified": true,
    "takeaways": [
      "Choline is both essential in the diet and made de novo; it is oxidised to betaine, which feeds the BHMT reaction that remethylates homocysteine.",
      "Choline or betaine supplementation lowers plasma total homocysteine in humans, and plasma betaine predicts homocysteine most strongly when folate and other B vitamins are low.",
      "Choline and betaine are important one-carbon donors, especially during folate deficiency.",
      "Intake of choline and betaine shows no consistent relation to cancer or cardiovascular risk, while high choline with low betaine in plasma tracks an unfavourable metabolic profile."
    ],
    "facts": {
      "design": "review"
    }
  },
  {
    "id": "article:shoulders-2009-collagen-structure",
    "type": "article",
    "name": "Collagen structure and stability",
    "aliases": [
      "Shoulders & Raines 2009"
    ],
    "summary": "Review of collagen structure: a triple helix of polyproline II-type chains with glycine at every third position, stabilised by stereoelectronic effects of hydroxyproline.",
    "body": [
      "The review explains the Gly-X-Y repeat that lets three left-handed chains pack into a right-handed triple helix, and why [[compound:hydroxyproline]] stabilises it. This is the structural reason [[compound:glycine]] makes up roughly one residue in three of [[compound:collagen]] and of [[compound:collagen-type-ii]]."
    ],
    "evidence": "established",
    "authors": [
      "Shoulders MD",
      "Raines RT"
    ],
    "year": 2009,
    "journal": "Annual review of biochemistry",
    "doi": "10.1146/annurev.biochem.77.032207.120833",
    "pmid": "19344236",
    "url": "https://doi.org/10.1146/annurev.biochem.77.032207.120833",
    "verified": true,
    "takeaways": [
      "Collagen is the most abundant animal protein, built from three parallel left-handed polyproline II-type helices wound into a right-handed triple helix.",
      "Stereoelectronic effects and preorganisation of the proline derivatives are central to triple-helix stability.",
      "Fibrillar organisation of type I collagen is now understood in detail, and mechanical properties of native fibrils are an active research area."
    ],
    "facts": {
      "design": "review"
    }
  },
  {
    "id": "article:efsa-2022-5-mthf-dietary-folate-equivalents",
    "type": "article",
    "name": "Conversion of calcium-L-methylfolate and (6S)-5-methyltetrahydrofolic acid glucosamine salt into dietary folate equivalents",
    "aliases": [
      "EFSA 2022 (5-MTHF DFE)"
    ],
    "summary": "EFSA scientific opinion on how much L-5-MTHF salts count in dietary folate equivalents compared with folic acid (bioavailability basis for the DFE conversion factor).",
    "body": [
      "The opinion reviews bioavailability data to decide how [[compound:5-mthf]] salts used in supplements and fortified foods should be converted to dietary folate equivalents relative to [[compound:folic-acid]]. It is the regulatory basis for treating L-methylfolate and folic acid as comparable sources of folate for population intake purposes.",
      "It does not by itself show that methylfolate is clinically superior to folic acid for any outcome, nor does it address receptor competition between the two forms."
    ],
    "evidence": "established",
    "authors": [
      "EFSA Panel on Nutrition, Novel Foods and Food Allergens (NDA)",
      "Turck D",
      "Bohn T",
      "Castenmiller J",
      "De Henauw S",
      "Hirsch-Ernst KI",
      "Knutsen HK",
      "Maciuk A",
      "et al."
    ],
    "year": 2022,
    "journal": "EFSA Journal",
    "doi": "10.2903/j.efsa.2022.7452",
    "url": "https://doi.org/10.2903/j.efsa.2022.7452",
    "verified": true,
    "takeaways": [
      "The opinion addresses the conversion of calcium L-methylfolate and the glucosamine salt of (6S)-5-methyltetrahydrofolic acid into dietary folate equivalents (DFE).",
      "It is a bioavailability-based regulatory conversion for intake accounting, not a clinical efficacy assessment.",
      "It underpins the position that methylfolate forms are accepted folate sources alongside folic acid for dietary reference purposes."
    ],
    "facts": {
      "design": "guideline"
    }
  },
  {
    "id": "article:walstab-2013-ginger-5ht3",
    "type": "article",
    "name": "Ginger and its pungent constituents non-competitively inhibit activation of human recombinant and native 5-HT3 receptors of enteric neurons",
    "aliases": [
      "Walstab 2013"
    ],
    "summary": "In vitro study: ginger extracts and 6-gingerol/6-shogaol non-competitively inhibit human 5-HT3 receptors, including on enteric neurons; it does not show 5-HT4 stimulation.",
    "body": [
      "Using human receptors expressed in cells and human submucous plexus preparations, the study shows that the pungent constituents of [[intervention:ginger-extract]] ([[compound:gingerols]]) block 5-HT3 receptors with low-micromolar potency. This is an antiemetic and sensory mechanism; it is not evidence for the 5-HT4 agonism that a prokinetic effect would be expected to rely on."
    ],
    "evidence": "plausible",
    "authors": [
      "Walstab J",
      "Krüger D",
      "Stark T",
      "Hofmann T",
      "Demir IE",
      "Ceyhan GO",
      "Feistel B",
      "Schemann M",
      "Niesler B"
    ],
    "year": 2013,
    "journal": "Neurogastroenterology and motility",
    "doi": "10.1111/nmo.12107",
    "pmid": "23490018",
    "url": "https://doi.org/10.1111/nmo.12107",
    "verified": true,
    "takeaways": [
      "Ginger extracts and the arylalkane constituents 6-gingerol and 6-shogaol inhibited human 5-HT3A and 5-HT3AB receptors at low micromolar concentrations.",
      "Inhibition was non-competitive: the extract did not displace a radioligand, and 6-gingerol lowered the maximal serotonin response instead of shifting its potency.",
      "The effect was confirmed on enteric neurons in human submucous plexus tissue, supporting use against nausea and some functional GI symptoms, but no prokinetic (5-HT4) mechanism was tested."
    ],
    "facts": {
      "design": "in vitro"
    }
  },
  {
    "id": "article:bannai-2012-glycine-sleep",
    "type": "article",
    "name": "New therapeutic strategy for amino acid medicine: glycine improves the quality of sleep",
    "aliases": [
      "Bannai & Kawai 2012"
    ],
    "summary": "Review of the Kawai/Bannai group: 3 g glycine before bed improves subjective sleep quality, apparently by lowering core temperature via the suprachiasmatic nucleus.",
    "body": [
      "The authors summarise human and rat work showing that oral [[compound:glycine]] raises plasma and cerebrospinal fluid glycine and lowers core body temperature with increased skin blood flow, which they propose underlies the better subjective sleep seen with [[intervention:glycine-powder]] taken before bedtime. Mechanistic follow-up is in [[article:kawai-2015-glycine-sleep-nmda]].",
      "It is a narrative review by the group that ran the studies; most human trials were small, short and based on subjective ratings."
    ],
    "evidence": "plausible",
    "authors": [
      "Bannai M",
      "Kawai N"
    ],
    "year": 2012,
    "journal": "Journal of pharmacological sciences",
    "doi": "10.1254/jphs.11r04fm",
    "pmid": "22293292",
    "url": "https://doi.org/10.1254/jphs.11r04fm",
    "verified": true,
    "takeaways": [
      "Glycine taken before bedtime improved subjective sleep quality in people with insomniac tendencies.",
      "In rats, oral glycine increased plasma and CSF glycine and decreased core body temperature while raising cutaneous blood flow, a plausible route to sleep onset.",
      "Pharmacological experiments suggested the effect depends on NMDA-type receptors; the evidence base is small trials from one research group."
    ],
    "facts": {
      "design": "review"
    }
  },
  {
    "id": "article:kusters-2006-h-pylori-pathogenesis",
    "type": "article",
    "name": "Pathogenesis of Helicobacter pylori infection",
    "aliases": [
      "Kusters 2006"
    ],
    "summary": "Review of H. pylori pathogenesis: colonisation relies on urease-mediated acid resistance, and CagA/VacA and host genetics steer outcomes from gastritis to ulcer and cancer.",
    "body": [
      "The review covers microbiology, immunology and biochemistry of [[disease:h-pylori-infection]]. Its account of [[enzyme:h-pylori-urease]] hydrolysing urea to [[compound:ammonia]] and CO2 to buffer the bacterium's surroundings is the textbook basis for the urea breath test and for the ammonia/CO2 chemistry discussed in [[claim:h-pylori-urease-ammonia-co2]].",
      "It does not address belching, so it neither supports nor refutes the idea that H. pylori urease gas explains frequent belching."
    ],
    "evidence": "established",
    "authors": [
      "Kusters JG",
      "van Vliet AH",
      "Kuipers EJ"
    ],
    "year": 2006,
    "journal": "Clinical microbiology reviews",
    "doi": "10.1128/CMR.00054-05",
    "pmid": "16847081",
    "url": "https://doi.org/10.1128/CMR.00054-05",
    "verified": true,
    "takeaways": [
      "More than half of the world population is colonised by H. pylori and untreated infection usually persists for life.",
      "Infection underlies chronic gastritis, peptic ulcer, gastric adenocarcinoma and MALT lymphoma, with outcome determined by host-bacterium interplay.",
      "Bacterial factors such as CagA and VacA, host immune polymorphisms and gastric acid secretion shape colonisation.",
      "Urease-driven acid resistance is part of the biochemical machinery that allows colonisation of the stomach."
    ],
    "facts": {
      "design": "review"
    }
  },
  {
    "id": "article:nakamura-2017-mast-cell-clock-histamine",
    "type": "article",
    "name": "Regulation of plasma histamine levels by the mast cell clock and its modulation by stress",
    "aliases": [
      "Nakamura 2017"
    ],
    "summary": "Mouse study: steady-state plasma histamine follows a circadian rhythm with nocturnal peaks, driven by the mast cell clock via OCT3, and lost under stress or disturbed light cycles.",
    "body": [
      "Plasma histamine in mice was lower without mast cells and lost its daily variation when mast cells carried a Clock mutation; the rhythm depended on transporter OCT3 and was blunted by restraint stress or abnormal light-dark cycles. The authors link nocturnal histamine peaks to night-time worsening of allergic symptoms.",
      "Mice are nocturnal, so \"nocturnal peak\" means the animals' active phase; the study does not measure humans and gives no clock time such as 2-4 am for people. It supports the existence of a circadian histamine rhythm ([[outcome:blood-histamine-level]]), not the specific human timing in [[claim:histamine-peaks-2-4am]]."
    ],
    "evidence": "plausible",
    "authors": [
      "Nakamura Y",
      "Ishimaru K",
      "Shibata S",
      "Nakao A"
    ],
    "year": 2017,
    "journal": "Scientific reports",
    "doi": "10.1038/srep39934",
    "pmid": "28074918",
    "url": "https://doi.org/10.1038/srep39934",
    "verified": true,
    "takeaways": [
      "Steady-state plasma histamine shows a circadian variation with nocturnal peaks in mice.",
      "Mast cells set the rhythm: the variation vanished in mast cell-deficient mice reconstituted with Clock-mutant mast cells, and depended on expression of organic cation transporter 3.",
      "Circadian desynchronisation by aberrant light/dark conditions or restraint stress abolished the histamine rhythm.",
      "Plasma histamine level correlated with plasma extravasation after mast cell activation, suggesting it potentiates allergic reactions; human timing is not tested."
    ],
    "facts": {
      "design": "animal study",
      "population": "Mice (wild type, mast cell-deficient, Clock mutant)"
    }
  },
  {
    "id": "article:marti-carvajal-2017-homocysteine-lowering-cochrane",
    "type": "article",
    "name": "Homocysteine-lowering interventions for preventing cardiovascular events",
    "aliases": [
      "Martí-Carvajal 2017 (Cochrane)"
    ],
    "summary": "Cochrane review of 15 RCTs (71,422 people): B-vitamin homocysteine lowering did not change heart attacks or mortality and gave a small stroke reduction.",
    "body": [
      "Despite lowering [[compound:homocysteine]], supplementation with folate, B6 and B12 did not reduce myocardial infarction or all-cause death in pooled randomised trials, and the stroke signal was small. This is the main evidence that raised homocysteine is a marker rather than a modifiable cause of most vascular events, and it is the counterweight in [[claim:homocysteine-lowering-reduces-cardiovascular-events]]."
    ],
    "evidence": "established",
    "authors": [
      "Martí-Carvajal AJ",
      "Solà I",
      "Lathyris D",
      "Dayer M"
    ],
    "year": 2017,
    "journal": "The Cochrane database of systematic reviews",
    "doi": "10.1002/14651858.CD006612.pub5",
    "pmid": "28816346",
    "url": "https://doi.org/10.1002/14651858.CD006612.pub5",
    "verified": true,
    "takeaways": [
      "Fifteen randomised trials with 71,422 participants and at least one year of follow-up were pooled.",
      "Homocysteine-lowering vitamins made no difference to myocardial infarction (RR 1.02) or death from any cause (RR 1.01), with high-quality evidence.",
      "Stroke was slightly lower with treatment (RR 0.90, 95% CI 0.82 to 0.99), and the authors say further trials are unlikely to change the conclusions."
    ],
    "facts": {
      "design": "systematic review"
    }
  },
  {
    "id": "article:sanaka-2010-ppi-gastric-emptying",
    "type": "article",
    "name": "Effects of proton pump inhibitors on gastric emptying: a systematic review",
    "aliases": [
      "Sanaka 2010"
    ],
    "summary": "Systematic review: PPIs consistently delay gastric emptying of solid meals but have inconsistent effects on liquids; the delay is attributed mainly to reduced acid-dependent peptic digestion.",
    "body": [
      "The review gathers studies of [[intervention:ppi-therapy]] and gastric emptying and finds a consistent delay for solids and variable effects for liquids. The proposed mechanism is impaired acid-dependent peptic hydrolysis, with PPI-induced hypergastrinaemia judged of minor importance. It supports the plausible but mechanistically hypothetical link in [[claim:ppis-slow-gastric-emptying]]."
    ],
    "evidence": "plausible",
    "authors": [
      "Sanaka M",
      "Yamamoto T",
      "Kuyama Y"
    ],
    "year": 2010,
    "journal": "Digestive diseases and sciences",
    "doi": "10.1007/s10620-009-1076-x",
    "pmid": "20012198",
    "url": "https://doi.org/10.1007/s10620-009-1076-x",
    "verified": true,
    "takeaways": [
      "The delaying effect of PPIs on emptying of solid meals was consistent across the reviewed studies.",
      "Effects on liquid emptying were inconsistent, probably because PPIs change intragastric volume and energy density in unpredictable ways.",
      "Most proposed mechanisms (loss of peptic hydrolysis, altered volume) remain hypothetical, and hypergastrinaemia appeared of minor importance."
    ],
    "facts": {
      "design": "systematic review"
    }
  },
  {
    "id": "article:parra-2018-vitamin-b6-metabolism",
    "type": "article",
    "name": "Vitamin B₆ and Its Role in Cell Metabolism and Physiology",
    "aliases": [
      "Parra 2018"
    ],
    "summary": "Review of vitamin B6 as a cofactor for diverse reactions, covering biosynthesis, regulation and health roles of PLP.",
    "body": [
      "The review treats [[compound:plp]] as a central cofactor in amino acid, one-carbon and neurotransmitter metabolism and describes how its supply is synthesised and controlled. It is a general reference for the PLP dependence of enzymes such as [[enzyme:shmt]], the [[enzyme:glycine-cleavage-system]] and [[enzyme:gad]]."
    ],
    "evidence": "established",
    "authors": [
      "Parra M",
      "Stahl S",
      "Hellmann H"
    ],
    "year": 2018,
    "journal": "Cells",
    "doi": "10.3390/cells7070084",
    "pmid": "30037155",
    "url": "https://doi.org/10.3390/cells7070084",
    "verified": true,
    "takeaways": [
      "Vitamin B6 is a critical cofactor for a wide range of reactions in basic cellular metabolism.",
      "New structural and regulatory information defines how the vitamin is synthesised and controlled in the cell.",
      "The review also discusses applications of B6 to human health, pathogen resistance and stress tolerance."
    ],
    "facts": {
      "design": "review"
    }
  },
  {
    "id": "article:chen-2023-aga-extraesophageal-reflux",
    "type": "article",
    "name": "AGA Clinical Practice Update on the Diagnosis and Management of Extraesophageal Gastroesophageal Reflux Disease: Expert Review",
    "aliases": [
      "AGA CPU extraesophageal reflux 2023"
    ],
    "summary": "AGA expert review: no single test proves reflux as the cause of extraesophageal symptoms; test before or after one failed PPI trial; alginates and lifestyle measures are options.",
    "body": [
      "Ten best-practice statements guide the evaluation of suspected extraesophageal reflux such as laryngitis and chronic cough. Symptom improvement on [[intervention:ppi-therapy]] may arise from mechanisms other than acid suppression and does not confirm [[disease:gerd]], and throat symptoms alone do not establish [[disease:lpr]].",
      "The document is expert opinion without formal evidence grading, which matters when judging how firmly \"throat burning means reflux\" ([[claim:throat-burning-means-lpr]]) is supported."
    ],
    "evidence": "plausible",
    "authors": [
      "Chen JW",
      "Vela MF",
      "Peterson KA",
      "Carlson DA"
    ],
    "year": 2023,
    "journal": "Clinical gastroenterology and hepatology : the official clinical practice journal of the American Gastroenterological Association",
    "doi": "10.1016/j.cgh.2023.01.040",
    "pmid": "37061897",
    "url": "https://doi.org/10.1016/j.cgh.2023.01.040",
    "verified": true,
    "takeaways": [
      "No single diagnostic tool can conclusively identify reflux as the cause of extraesophageal symptoms; judgement combines symptoms, therapy response, endoscopy and reflux testing.",
      "Patients without typical GERD symptoms should have reflux testing considered before starting PPI therapy; after one failed PPI trial of up to 12 weeks, objective testing is advised.",
      "Symptom improvement on a PPI may reflect effects other than acid suppression and does not confirm GERD.",
      "Alginate-containing antacids, lifestyle changes, neuromodulators and behavioural therapy may have a role; the statements are not based on a formal systematic review."
    ],
    "facts": {
      "design": "guideline"
    }
  },
  {
    "id": "article:trexler-2015-issn-beta-alanine",
    "type": "article",
    "name": "International society of sports nutrition position stand: Beta-Alanine",
    "aliases": [
      "ISSN beta-alanine position stand"
    ],
    "summary": "ISSN position stand: 4-6 g/day beta-alanine for 4+ weeks raises muscle carnosine and improves 1-4 minute exercise; tingling (paraesthesia) is the only reported side effect.",
    "body": [
      "The position stand reviews [[compound:beta-alanine]] as the rate-limiting precursor of [[compound:carnosine]] and concludes that [[intervention:beta-alanine-supplement]] is safe at recommended doses in healthy people. Paraesthesia can be reduced with divided small doses or sustained-release forms."
    ],
    "evidence": "established",
    "authors": [
      "Trexler ET",
      "Smith-Ryan AE",
      "Stout JR",
      "Hoffman JR",
      "Wilborn CD",
      "Sale C",
      "Kreider RB",
      "Jäger R",
      "Earnest CP",
      "Bannock L",
      "et al."
    ],
    "year": 2015,
    "journal": "Journal of the International Society of Sports Nutrition",
    "doi": "10.1186/s12970-015-0090-y",
    "pmid": "26175657",
    "url": "https://doi.org/10.1186/s12970-015-0090-y",
    "verified": true,
    "takeaways": [
      "Four weeks of 4-6 g/day beta-alanine significantly raises muscle carnosine, an intracellular pH buffer.",
      "Supplementation appears safe in healthy populations at recommended doses; the only reported side effect is paraesthesia, reduced by lower divided doses or sustained-release formulas.",
      "Benefit is greatest for open-ended efforts lasting about 1-4 minutes; effects on strength and longer endurance need more research."
    ],
    "facts": {
      "design": "guideline"
    }
  },
  {
    "id": "article:iwai-2005-collagen-peptides-blood",
    "type": "article",
    "name": "Identification of food-derived collagen peptides in human blood after oral ingestion of gelatin hydrolysates",
    "aliases": [
      "Iwai 2005"
    ],
    "summary": "Human study: after 9.4-23 g gelatin hydrolysate, hydroxyproline-containing peptides (mainly Pro-Hyp) appear in blood, peaking at 1-2 h.",
    "body": [
      "Healthy volunteers drank gelatin hydrolysates and peptide-bound [[compound:hydroxyproline]] rose from negligible to 20-60 nmol/mL within one to two hours, so part of ingested [[compound:collagen]] reaches the circulation as small peptides rather than only free amino acids. This is the basic absorption evidence for [[intervention:collagen-peptides]]."
    ],
    "evidence": "established",
    "authors": [
      "Iwai K",
      "Hasegawa T",
      "Taguchi Y",
      "Morimatsu F",
      "Sato K",
      "Nakamura Y",
      "Higashi A",
      "Kido Y",
      "Nakabo Y",
      "Ohtsuki K"
    ],
    "year": 2005,
    "journal": "Journal of agricultural and food chemistry",
    "doi": "10.1021/jf050206p",
    "pmid": "16076145",
    "url": "https://doi.org/10.1021/jf050206p",
    "verified": true,
    "takeaways": [
      "Peptide forms of hydroxyproline were negligible before ingestion and rose to 20-60 nmol/mL of plasma after 9.4-23 g of gelatin hydrolysate.",
      "Levels peaked at 1-2 hours and fell by about half at 4 hours.",
      "Pro-Hyp was the main peptide, with smaller amounts of Ala-Hyp, Ala-Hyp-Gly, Pro-Hyp-Gly, Leu-Hyp, Ile-Hyp and Phe-Hyp."
    ],
    "facts": {
      "design": "human pharmacokinetic study"
    }
  },
  {
    "id": "article:clark-2008-collagen-hydrolysate",
    "type": "article",
    "name": "24-Week study on the use of collagen hydrolysate as a dietary supplement in athletes with activity-related joint pain",
    "aliases": [
      "Clark 2008"
    ],
    "summary": "Randomised placebo-controlled trial in 97 evaluable athletes: 10 g/day collagen hydrolysate for 24 weeks modestly reduced activity-related joint pain; industry-linked, modest effect sizes.",
    "body": [
      "Athletes without joint disease took 10 g of collagen hydrolysate or placebo daily. Several visual analogue pain scores improved more with [[intervention:collagen-peptides]] than with placebo, with larger differences in those with knee pain, but only 97 of 147 randomised participants were analysed."
    ],
    "evidence": "plausible",
    "authors": [
      "Clark KL",
      "Sebastianelli W",
      "Flechsenhar KR",
      "Aukermann DF",
      "Meza F",
      "Millard RL",
      "Deitch JR",
      "Sherbondy PS",
      "Albert A"
    ],
    "year": 2008,
    "journal": "Current medical research and opinion",
    "doi": "10.1185/030079908x291967",
    "pmid": "18416885",
    "url": "https://doi.org/10.1185/030079908x291967",
    "verified": true,
    "takeaways": [
      "A 24-week double-blind trial compared 10 g/day collagen hydrolysate with placebo in athletes with activity-related joint pain.",
      "Six pain-related parameters improved significantly versus placebo overall; the difference was clearer in the knee-pain subgroup.",
      "Only 97 of 147 participants could be analysed, and the authors call for further studies, so the result is modest and preliminary."
    ],
    "facts": {
      "design": "rct",
      "population": "147 randomised athletes (97 analysed) with activity-related joint pain"
    }
  },
  {
    "id": "article:sekhar-2011-glynac-glutathione",
    "type": "article",
    "name": "Deficient synthesis of glutathione underlies oxidative stress in aging and can be corrected by dietary cysteine and glycine supplementation",
    "aliases": [
      "Sekhar 2011"
    ],
    "summary": "Small human study: older adults had low red-cell glycine, cysteine and glutathione from reduced synthesis; two weeks of cysteine plus glycine restored glutathione synthesis.",
    "body": [
      "Eight elderly and eight younger volunteers received stable-isotope glycine infusions. The elderly group showed lower [[compound:glycine]], [[compound:cysteine]] and [[compound:glutathione]] concentrations and slower synthesis, and supplementing the two precursors for two weeks normalised them. It links glycine availability to [[pathway:glutathione-synthesis]], though the sample is small and uncontrolled for the supplement step."
    ],
    "evidence": "plausible",
    "authors": [
      "Sekhar RV",
      "Patel SG",
      "Guthikonda AP",
      "Reid M",
      "Balasubramanyam A",
      "Taffet GE",
      "Jahoor F"
    ],
    "year": 2011,
    "journal": "The American journal of clinical nutrition",
    "doi": "10.3945/ajcn.110.003483",
    "pmid": "21795440",
    "url": "https://doi.org/10.3945/ajcn.110.003483",
    "verified": true,
    "takeaways": [
      "Older subjects had markedly lower red blood cell glycine, cysteine and glutathione and lower glutathione synthesis rates than younger subjects.",
      "Plasma oxidative stress and F2-isoprostanes were higher in the older group.",
      "Two weeks of cysteine and glycine supplementation raised glutathione concentration and synthesis in the elderly to levels not different from younger subjects."
    ],
    "facts": {
      "design": "human intervention study",
      "population": "8 older and 8 younger adults"
    }
  },
  {
    "id": "article:knight-2006-hydroxyproline-oxalate",
    "type": "article",
    "name": "Hydroxyproline ingestion and urinary oxalate and glycolate excretion",
    "aliases": [
      "Knight 2006"
    ],
    "summary": "Controlled feeding study: 30 g gelatin raised urinary oxalate by 43% and glycolate 5.3-fold versus whey; hydroxyproline load from 5-10 g gelatin was already measurable.",
    "body": [
      "Gelatin is rich in [[compound:hydroxyproline]], a glyoxylate precursor. Compared with whey protein on controlled oxalate diets, gelatin increased urinary [[compound:oxalate]] and glycolate, and the authors estimate that hydroxyproline accounts for a meaningful share of endogenous oxalate. It underlies the caution about [[intervention:collagen-peptides]] in people prone to calcium oxalate stones."
    ],
    "evidence": "established",
    "authors": [
      "Knight J",
      "Jiang J",
      "Assimos DG",
      "Holmes RP"
    ],
    "year": 2006,
    "journal": "Kidney international",
    "doi": "10.1038/sj.ki.5001906",
    "pmid": "17021603",
    "url": "https://doi.org/10.1038/sj.ki.5001906",
    "verified": true,
    "takeaways": [
      "Urinary glycolate was 5.3-fold and oxalate 43% higher after 30 g gelatin than after whey protein on controlled oxalate diets.",
      "Significant changes in plasma hydroxyproline and urinary oxalate and glycolate occurred with 5 and 10 g gelatin loads, not with 1 or 2 g.",
      "Extrapolation suggests hydroxyproline metabolism contributes 20-50% of urinary glycolate and 5-20% of endogenously derived urinary oxalate."
    ],
    "facts": {
      "design": "controlled feeding study"
    }
  },
  {
    "id": "article:cheungpasitporn-2015-ppi-hypomagnesemia",
    "type": "article",
    "name": "Proton pump inhibitors linked to hypomagnesemia: a systematic review and meta-analysis of observational studies",
    "aliases": [
      "Cheungpasitporn 2015"
    ],
    "summary": "Meta-analysis of nine observational studies (109,798 patients): PPI use was associated with hypomagnesaemia, pooled RR 1.43.",
    "body": [
      "The pooled analysis supports the regulatory warning that prolonged acid suppression can lower serum magnesium. The association persisted in higher-quality studies (RR 1.63), but observational data cannot prove causation or define a safe duration for [[intervention:ppi-therapy]]; it is the reason [[compound:magnesium]] status is sometimes monitored in long-term users."
    ],
    "evidence": "established",
    "authors": [
      "Cheungpasitporn W",
      "Thongprayoon C",
      "Kittanamongkolchai W",
      "Srivali N",
      "Edmonds PJ",
      "Ungprasert P",
      "O'Corragain OA",
      "Korpaisarn S",
      "Erickson SB"
    ],
    "year": 2015,
    "journal": "Renal failure",
    "doi": "10.3109/0886022X.2015.1057800",
    "pmid": "26108134",
    "url": "https://doi.org/10.3109/0886022X.2015.1057800",
    "verified": true,
    "takeaways": [
      "Nine observational studies (three cohort, five cross-sectional, one case-control) with 109,798 patients were pooled.",
      "PPI use was associated with hypomagnesaemia with a pooled relative risk of 1.43 (95% CI 1.08-1.88).",
      "Restricting to high-quality studies gave RR 1.63; the design cannot establish causation."
    ],
    "facts": {
      "design": "meta-analysis of observational studies"
    }
  },
  {
    "id": "article:lane-2008-sarcosine-schizophrenia",
    "type": "article",
    "name": "Sarcosine (N-methylglycine) treatment for acute schizophrenia: a randomized, double-blind study",
    "aliases": [
      "Lane 2008"
    ],
    "summary": "Small double-blind trial in 20 drug-free acutely ill patients: sarcosine 2 g/day gave more responders than 1 g/day, with no significant dose-by-time difference; well tolerated.",
    "body": [
      "Sarcosine, a glycine transporter-1 inhibitor, was tested as a primary treatment for acute schizophrenia in a six-week study with only two active dose arms and no placebo. The 2 g group had more responders, but the formal dose-by-time interaction was not significant, so the study cannot show efficacy of [[compound:sarcosine]]."
    ],
    "evidence": "speculative",
    "authors": [
      "Lane HY",
      "Liu YC",
      "Huang CL",
      "Chang YC",
      "Liau CH",
      "Perng CH",
      "Tsai GE"
    ],
    "year": 2008,
    "journal": "Biological psychiatry",
    "doi": "10.1016/j.biopsych.2007.04.038",
    "pmid": "17659263",
    "url": "https://doi.org/10.1016/j.biopsych.2007.04.038",
    "verified": true,
    "takeaways": [
      "Twenty drug-free patients were randomised to 1 g or 2 g sarcosine daily for six weeks, double-blind, without a placebo arm.",
      "More patients responded (>= 20% PANSS reduction) on 2 g, especially antipsychotic-naive patients, but the dose-by-time interaction was not significant.",
      "Both doses were well tolerated; the authors state that larger placebo- or active-controlled trials are needed."
    ],
    "facts": {
      "design": "rct",
      "population": "20 drug-free acutely ill patients with schizophrenia"
    }
  },
  {
    "id": "article:shao-2008-osl-taurine-glutamine-arginine",
    "type": "article",
    "name": "Risk assessment for the amino acids taurine, L-glutamine and L-arginine",
    "aliases": [
      "Shao & Hathcock 2008"
    ],
    "summary": "Risk assessment (Observed Safe Level method): strong evidence of no adverse effects for taurine up to 3 g/day, glutamine up to 14 g/day and arginine up to 20 g/day in healthy adults.",
    "body": [
      "Because no consistent adverse-effect pattern emerged, the authors could not set a conventional upper limit and used the Observed Safe Level approach instead. The values apply to healthy adults taking [[compound:taurine]], [[compound:glutamine]] or arginine as supplements ([[intervention:taurine-supplement]], [[intervention:l-glutamine-supplement]]); higher intakes were tested without harm but the data are insufficient to call them safe long term."
    ],
    "evidence": "established",
    "authors": [
      "Shao A",
      "Hathcock JN"
    ],
    "year": 2008,
    "journal": "Regulatory toxicology and pharmacology : RTP",
    "doi": "10.1016/j.yrtph.2008.01.004",
    "pmid": "18325648",
    "url": "https://doi.org/10.1016/j.yrtph.2008.01.004",
    "verified": true,
    "takeaways": [
      "No systematic adverse-effect pattern was found in human trials of oral taurine, glutamine or arginine, so NOAEL/LOAEL-based upper limits could not be derived.",
      "Observed Safe Levels for healthy adults were taurine 3 g/day, L-glutamine 14 g/day and L-arginine 20 g/day.",
      "Higher intakes have been tested without reported harm but evidence is insufficient to confirm long-term safety."
    ],
    "facts": {
      "design": "risk assessment"
    }
  },
  {
    "id": "article:lam-2013-ppi-b12-deficiency",
    "type": "article",
    "name": "Proton pump inhibitor and histamine 2 receptor antagonist use and vitamin B12 deficiency",
    "aliases": [
      "Lam 2013"
    ],
    "summary": "Kaiser case-control study (25,956 cases): two or more years of PPI (OR 1.65) or H2RA (OR 1.25) use was associated with vitamin B12 deficiency, with higher risk at higher PPI doses.",
    "body": [
      "Using pharmacy and laboratory records, the study found that long-term acid suppression preceded B12 deficiency more often than expected, consistent with impaired release of food-bound cobalamin in a less acidic stomach. As an observational study it shows association, not that [[intervention:ppi-therapy]] caused every case of [[disease:vitamin-b12-deficiency]]."
    ],
    "evidence": "established",
    "authors": [
      "Lam JR",
      "Schneider JL",
      "Zhao W",
      "Corley DA"
    ],
    "year": 2013,
    "journal": "JAMA",
    "doi": "10.1001/jama.2013.280490",
    "pmid": "24327038",
    "url": "https://doi.org/10.1001/jama.2013.280490",
    "verified": true,
    "takeaways": [
      "At least two years of PPI supply was associated with vitamin B12 deficiency (OR 1.65, 95% CI 1.58-1.73); H2 receptor antagonists gave OR 1.25.",
      "Higher PPI doses (more than 1.5 pills/day) carried a stronger association (OR 1.95) than doses under 0.75 pills/day (OR 1.63).",
      "The authors advise weighing the risk of B12 deficiency against the benefit when choosing long-term acid suppression."
    ],
    "facts": {
      "design": "case-control",
      "population": "25,956 cases and 184,199 controls (Kaiser Permanente Northern California)"
    }
  },
  {
    "id": "article:penninx-2021-anxiety-disorders",
    "type": "article",
    "name": "Anxiety disorders",
    "aliases": [
      "Penninx 2021"
    ],
    "summary": "Lancet seminar: anxiety disorders are the commonest mental disorders; CBT and serotonergic drugs are effective, and no enduring preventive measures exist.",
    "body": [
      "The seminar gives the clinical frame for [[disease:anxiety-disorder]]: persistent excessive fear or avoidance, dysfunction in threat-response circuits, frequent comorbidity with depression, and first-line treatment by psychotherapy or serotonergic medication. It does not support nutrient-based treatment claims, which is why GABA/B6 explanations for anxiety ([[outcome:anxiety]]) remain speculative."
    ],
    "evidence": "established",
    "authors": [
      "Penninx BW",
      "Pine DS",
      "Holmes EA",
      "Reif A"
    ],
    "year": 2021,
    "journal": "Lancet (London, England)",
    "doi": "10.1016/S0140-6736(21)00359-7",
    "pmid": "33581801",
    "url": "https://doi.org/10.1016/S0140-6736(21)00359-7",
    "verified": true,
    "takeaways": [
      "Anxiety disorders are the most common group of mental disorders and usually start in early adulthood or before.",
      "Evidence-based psychotherapy (especially CBT) and psychoactive medication (especially serotonergic) are both effective.",
      "No enduring preventive measures are available, and therapy resistance is common."
    ],
    "facts": {
      "design": "review"
    }
  },
  {
    "id": "article:lenti-2020-autoimmune-gastritis",
    "type": "article",
    "name": "Autoimmune gastritis",
    "aliases": [
      "Lenti 2020"
    ],
    "summary": "Primer on autoimmune gastritis: parietal cell loss reduces acid and intrinsic factor, causing iron and B12 malabsorption and raising neuroendocrine tumour and gastric cancer risk.",
    "body": [
      "Autoimmune gastritis destroys parietal cells, with the gastric H+/K+ ATPase ([[enzyme:h-k-atpase]]) as the main autoantigen. The result is a true, often severe [[state:hypochlorhydria]] and loss of intrinsic factor, so it is the clearest organic cause of low stomach acid and is a form of [[disease:atrophic-gastritis]]."
    ],
    "evidence": "established",
    "authors": [
      "Lenti MV",
      "Rugge M",
      "Lahner E",
      "Miceli E",
      "Toh BH",
      "Genta RM",
      "De Block C",
      "Hershko C",
      "Di Sabatino A"
    ],
    "year": 2020,
    "journal": "Nature reviews. Disease primers",
    "doi": "10.1038/s41572-020-0187-8",
    "pmid": "32647173",
    "url": "https://doi.org/10.1038/s41572-020-0187-8",
    "verified": true,
    "takeaways": [
      "Autoimmune gastritis is an organ-specific autoimmune destruction of gastric parietal cells that reduces acid output and intrinsic factor.",
      "Consequences include malabsorption of iron and vitamin B12 (pernicious anaemia); it is often diagnosed late.",
      "Advanced disease can progress to neuroendocrine tumours and gastric adenocarcinoma, so surveillance and micronutrient replacement are part of management."
    ],
    "facts": {
      "design": "review"
    }
  },
  {
    "id": "article:zeisel-1991-choline-essential-nutrient",
    "type": "article",
    "name": "Choline, an essential nutrient for humans",
    "aliases": [
      "Zeisel 1991"
    ],
    "summary": "Controlled human depletion study: three weeks on a choline-free diet lowered plasma choline about 30% and raised ALT in most men, showing choline is an essential nutrient.",
    "body": [
      "Healthy male volunteers were fed a semisynthetic choline-free diet with adequate methionine for three weeks. Plasma choline and phosphatidylcholine fell and liver enzymes rose, evidence of incipient liver dysfunction that supported classifying [[compound:choline]] as essential and that underlies [[disease:choline-deficiency]]."
    ],
    "evidence": "established",
    "authors": [
      "Zeisel SH",
      "Da Costa KA",
      "Franklin PD",
      "Alexander EA",
      "Lamont JT",
      "Sheard NF",
      "Beiser A"
    ],
    "year": 1991,
    "journal": "FASEB journal : official publication of the Federation of American Societies for Experimental Biology",
    "pmid": "2010061",
    "url": "https://pubmed.ncbi.nlm.nih.gov/2010061/",
    "verified": true,
    "takeaways": [
      "On a choline-free diet, plasma choline and phosphatidylcholine fell by about 30% and 15% respectively over three weeks.",
      "Serum ALT activity rose steadily in the deficient group but not in controls, indicating early liver dysfunction.",
      "The authors conclude choline is essential when excess methionine and folate are not available in the diet."
    ],
    "facts": {
      "design": "controlled depletion study"
    }
  },
  {
    "id": "article:resseguie-2011-pemt-estrogen-choline",
    "type": "article",
    "name": "Aberrant estrogen regulation of PEMT results in choline deficiency-associated liver dysfunction",
    "aliases": [
      "Resseguie 2011"
    ],
    "summary": "Genetic study: a PEMT promoter SNP (rs12325817) removes oestrogen-driven PEMT induction and is linked to choline-deficiency liver dysfunction in women.",
    "body": [
      "De novo choline synthesis by [[enzyme:pemt]] is under oestrogen control, which explains why many premenopausal women tolerate low-choline diets better than men and postmenopausal women. A risk haplotype near the oestrogen response element disables this induction and is associated with [[disease:choline-deficiency]] and hepatic steatosis ([[outcome:hepatic-steatosis]])."
    ],
    "evidence": "plausible",
    "authors": [
      "Resseguie ME",
      "da Costa KA",
      "Galanko JA",
      "Patel M",
      "Davis IJ",
      "Zeisel SH"
    ],
    "year": 2011,
    "journal": "The Journal of biological chemistry",
    "doi": "10.1074/jbc.M110.106922",
    "pmid": "21059658",
    "url": "https://doi.org/10.1074/jbc.M110.106922",
    "verified": true,
    "takeaways": [
      "When dietary choline is restricted, most men and postmenopausal women develop multiorgan dysfunction with hepatic steatosis, but many premenopausal women are protected.",
      "PEMT is regulated by oestrogen in an isoform-specific way; a risk haplotype was associated with loss of hormonal activation.",
      "The most strongly linked SNP (rs12325817) lies within 1 kb of the oestrogen response element and the risk allele failed to bind the oestrogen receptor or FOXA1."
    ],
    "facts": {
      "design": "genetic association with functional work"
    }
  },
  {
    "id": "article:rinella-2023-fatty-liver-nomenclature",
    "type": "article",
    "name": "A multisociety Delphi consensus statement on new fatty liver disease nomenclature",
    "aliases": [
      "Rinella 2023"
    ],
    "summary": "Multisociety Delphi consensus replacing NAFLD with MASLD (metabolic dysfunction-associated steatotic liver disease), defined by steatosis plus at least one cardiometabolic risk factor.",
    "body": [
      "The consensus renamed non-alcoholic fatty liver disease as metabolic dysfunction-associated steatotic liver disease and introduced MetALD for greater alcohol intake. The new terms apply to [[disease:fatty-liver-nafld]] and the imaging or histological finding [[outcome:hepatic-steatosis]]."
    ],
    "evidence": "established",
    "authors": [
      "Rinella ME",
      "Lazarus JV",
      "Ratziu V",
      "Francque SM",
      "Sanyal AJ",
      "Kanwal F",
      "Romero D",
      "Abdelmalek MF",
      "Anstee QM",
      "Arab JP",
      "et al."
    ],
    "year": 2023,
    "journal": "Journal of hepatology",
    "doi": "10.1016/j.jhep.2023.06.003",
    "pmid": "37364790",
    "url": "https://doi.org/10.1016/j.jhep.2023.06.003",
    "verified": true,
    "takeaways": [
      "A total of 236 panellists from 56 countries took part; 74% judged the old nomenclature sufficiently flawed to change.",
      "\"Steatotic liver disease\" became the umbrella term; NAFLD is replaced by MASLD, requiring at least one of five cardiometabolic risk factors.",
      "A new category, MetALD, covers MASLD with higher weekly alcohol intake; cryptogenic steatotic liver disease covers cases with no metabolic factor and no known cause."
    ],
    "facts": {
      "design": "consensus statement"
    }
  },
  {
    "id": "article:katz-2022-acg-gerd-guideline",
    "type": "article",
    "name": "ACG Clinical Guideline for the Diagnosis and Management of Gastroesophageal Reflux Disease",
    "aliases": [
      "ACG GERD guideline 2022"
    ],
    "summary": "ACG guideline for GERD: PPIs remain first-line drug therapy; recommends lifestyle measures, limits long-term PPI use to those with a clear indication, and covers testing and surgical options.",
    "body": [
      "The guideline grades recommendations on diagnosis and treatment of [[disease:gerd]] and treats [[intervention:ppi-therapy]] as the medical treatment of choice while addressing concerns about long-term adverse events and overprescribing. It is the standard reference for [[outcome:heartburn]] management and for the role of [[intervention:reflux-lifestyle-measures]]."
    ],
    "evidence": "established",
    "authors": [
      "Katz PO",
      "Dunbar KB",
      "Schnoll-Sussman FH",
      "Greer KB",
      "Yadlapati R",
      "Spechler SJ"
    ],
    "year": 2022,
    "journal": "The American journal of gastroenterology",
    "doi": "10.14309/ajg.0000000000001538",
    "pmid": "34807007",
    "url": "https://doi.org/10.14309/ajg.0000000000001538",
    "verified": true,
    "takeaways": [
      "PPIs remain the medical treatment of choice for GERD, yet scrutiny of adverse events and overprescribing has increased.",
      "The guideline uses GRADE to rate recommendations on diagnosis, pharmacologic, lifestyle, surgical and endoscopic management.",
      "Some key concepts are reported as lacking sufficient evidence to grade."
    ],
    "facts": {
      "design": "guideline"
    }
  },
  {
    "id": "article:mrc-1991-folic-acid-neural-tube-defects",
    "type": "article",
    "name": "Prevention of neural tube defects: results of the Medical Research Council Vitamin Study. MRC Vitamin Study Research Group",
    "aliases": [
      "MRC Vitamin Study 1991"
    ],
    "summary": "Landmark randomised trial (1,817 high-risk women): 4 mg folic acid around conception cut recurrent neural tube defects by 72%; other vitamins had no significant effect.",
    "body": [
      "The factorial trial ran at 33 centres. Of pregnancies with known outcome, 6 neural tube defects occurred in the folic acid groups and 21 in the others, a relative risk of 0.28. It is the key evidence behind folic acid recommendations in preconception care for [[disease:neural-tube-defects]] and the benchmark for [[compound:folic-acid]]."
    ],
    "evidence": "established",
    "authors": [
      "MRC Vitamin Study Research Group"
    ],
    "year": 1991,
    "journal": "Lancet (London, England)",
    "doi": "10.1016/0140-6736(91)90133-A",
    "pmid": "1677062",
    "url": "https://doi.org/10.1016/0140-6736(91)90133-A",
    "verified": true,
    "takeaways": [
      "Folic acid supplementation started before pregnancy produced a 72% protective effect (relative risk 0.28, 95% CI 0.12-0.71) on recurrence of neural tube defects.",
      "The mixture of other vitamins without folic acid showed no significant protective effect.",
      "No demonstrable harm from folic acid was seen, though the trial could not rule out rare effects."
    ],
    "facts": {
      "design": "rct",
      "population": "1,817 women with a previous neural tube defect-affected pregnancy"
    }
  },
  {
    "id": "article:applegarth-2004-glycine-encephalopathy",
    "type": "article",
    "name": "Glycine encephalopathy (nonketotic hyperglycinaemia) : review and update",
    "aliases": [
      "Applegarth & Toone 2004"
    ],
    "summary": "Workshop summary on glycine encephalopathy (non-ketotic hyperglycinaemia), an inborn defect of the glycine cleavage system with severe neurological disease.",
    "body": [
      "The article condenses a workshop on [[disease:nonketotic-hyperglycinemia]], where defects of the [[enzyme:glycine-cleavage-system]] cause glycine to accumulate in tissues and cerebrospinal fluid. It is why supplemental [[compound:glycine]] is avoided in people with this disorder."
    ],
    "evidence": "established",
    "authors": [
      "Applegarth DA",
      "Toone JR"
    ],
    "year": 2004,
    "journal": "Journal of inherited metabolic disease",
    "doi": "10.1023/b:boli.0000031222.38328.59",
    "pmid": "15272469",
    "url": "https://doi.org/10.1023/b:boli.0000031222.38328.59",
    "verified": true,
    "takeaways": [
      "The review summarises current knowledge of glycine encephalopathy, also called non-ketotic hyperglycinaemia.",
      "The disorder arises from impaired function of the glycine cleavage system, so glycine accumulates, notably in the brain.",
      "It is a rare inborn error of metabolism; findings from it do not describe the healthy population."
    ],
    "facts": {
      "design": "workshop review"
    }
  },
  {
    "id": "article:kashyap-2024-sibo-critical-appraisal",
    "type": "article",
    "name": "Critical appraisal of the SIBO hypothesis and breath testing: A clinical practice update endorsed by the European society of neurogastroenterology and motility (ESNM) and the American neurogastroenterology and motility society (ANMS)",
    "aliases": [
      "Kashyap 2024"
    ],
    "summary": "Expert clinical practice update: the SIBO-IBS hypothesis remains unproven, and breath tests are unreliable, driving unnecessary antibiotic use.",
    "body": [
      "The authors argue that the idea that small intestinal bacterial overgrowth explains symptoms in IBS and related disorders has not been proven after two decades, and that unvalidated breath tests ([[intervention:sibo-breath-test]]) have led to over-diagnosis of [[disease:sibo]] and injudicious antibiotic use.",
      "It is a strongly sceptical position that contrasts with guideline documents such as [[article:pimentel-2020-acg-sibo-guideline]]; it is relevant to claims that gas or belching can be attributed to SIBO, including [[claim:ppis-cause-sibo]] and [[claim:sibo-gas-appears-in-15-45-min-as-belching]]."
    ],
    "evidence": "plausible",
    "authors": [
      "Kashyap P",
      "Moayyedi P",
      "Quigley EMM",
      "Simren M",
      "Vanner S"
    ],
    "year": 2024,
    "journal": "Neurogastroenterology and motility",
    "doi": "10.1111/nmo.14817",
    "pmid": "38798120",
    "url": "https://doi.org/10.1111/nmo.14817",
    "verified": true,
    "takeaways": [
      "SIBO has long been recognised in people with stasis from surgery or diseases such as scleroderma, causing diarrhoea and malabsorption.",
      "The hypothesis that SIBO explains symptoms in IBS without malabsorption remains unproven after two decades.",
      "Breath tests used to diagnose it are unvalidated and unreliable, with consequences including widespread antibiotic use."
    ],
    "facts": {
      "design": "expert review"
    }
  },
  {
    "id": "article:stabler-2013-vitamin-b12-deficiency",
    "type": "article",
    "name": "Clinical practice. Vitamin B12 deficiency",
    "aliases": [
      "Stabler 2013"
    ],
    "summary": "NEJM clinical practice review of vitamin B12 deficiency: causes (including food-cobalamin malabsorption), use of serum B12 with MMA and homocysteine, and high-dose oral or injected treatment.",
    "body": [
      "The review is the standard clinical summary for [[disease:vitamin-b12-deficiency]]. It explains why serum B12 alone can miss deficiency and why [[compound:methylmalonic-acid]] and [[compound:homocysteine]] help confirm it, and it notes that high-dose oral cobalamin works even when absorption through intrinsic factor is impaired.",
      "The article is a clinical practice review without an abstract in PubMed; takeaways are drawn from its recognised content. Neurological manifestations, including cognitive slowing, are a reason to treat promptly."
    ],
    "evidence": "established",
    "authors": [
      "Stabler SP"
    ],
    "year": 2013,
    "journal": "The New England journal of medicine",
    "doi": "10.1056/NEJMcp1113996",
    "pmid": "23301732",
    "url": "https://doi.org/10.1056/NEJMcp1113996",
    "verified": true,
    "takeaways": [
      "Common causes include pernicious anaemia and food-cobalamin malabsorption in older adults, for example with atrophic gastritis or acid-suppressing drugs.",
      "Serum B12 is an imperfect test; elevated methylmalonic acid and homocysteine help confirm functional deficiency.",
      "Daily oral cobalamin in the milligram range is generally effective, with injections reserved for severe or neurological cases."
    ],
    "facts": {
      "design": "review"
    }
  },
  {
    "id": "article:slutsky-2010-magnesium-threonate",
    "type": "article",
    "name": "Enhancement of learning and memory by elevating brain magnesium",
    "aliases": [
      "Slutsky 2010"
    ],
    "summary": "Rat study: raising brain magnesium with magnesium L-threonate improved learning and memory and increased synaptic density and NR2B-NMDA signalling.",
    "body": [
      "The study introduced [[intervention:magnesium-l-threonate]] as a way to raise brain [[compound:magnesium]] and found improved learning, working memory and memory in young and aged rats, with more presynaptic release sites and enhanced plasticity. It is animal work; human cognitive benefit is not established by this paper."
    ],
    "evidence": "speculative",
    "authors": [
      "Slutsky I",
      "Abumaria N",
      "Wu LJ",
      "Huang C",
      "Zhang L",
      "Li B",
      "Zhao X",
      "Govindarajan A",
      "Zhao MG",
      "Zhuo M",
      "et al."
    ],
    "year": 2010,
    "journal": "Neuron",
    "doi": "10.1016/j.neuron.2009.12.026",
    "pmid": "20152124",
    "url": "https://doi.org/10.1016/j.neuron.2009.12.026",
    "verified": true,
    "takeaways": [
      "Elevating brain magnesium with magnesium-L-threonate improved learning, working memory and short- and long-term memory in rats, including pattern completion in aged rats.",
      "Treated animals had higher density of synaptic puncta in hippocampal subregions that correlated with memory performance.",
      "Magnesium upregulated NR2B-containing NMDA receptors and enhanced short-term facilitation and long-term potentiation."
    ],
    "facts": {
      "design": "animal study",
      "population": "Rats"
    }
  },
  {
    "id": "article:petroff-2002-gaba-glutamate",
    "type": "article",
    "name": "GABA and glutamate in the human brain",
    "aliases": [
      "Petroff 2002"
    ],
    "summary": "Review of GABA and glutamate in the human brain: GABA is made from glutamate by two glutamic acid decarboxylase isoforms, and the balance controls cortical excitability.",
    "body": [
      "Glutamate is the main excitatory and GABA the main inhibitory transmitter; [[compound:glutamate]] is the metabolic precursor of [[compound:gaba]]. The synthesis step is catalysed by [[enzyme:gad]] (isoforms [[enzyme:gad1]] and [[enzyme:gad2]]), whose PLP dependence links vitamin B6 status to the balance in [[system:brain-gaba-glutamate]].",
      "The paper is neurochemistry, not a clinical study: it provides the mechanism for B6-dependent GABA synthesis but does not show that B6 supplements treat [[outcome:anxiety]]."
    ],
    "evidence": "established",
    "authors": [
      "Petroff OA"
    ],
    "year": 2002,
    "journal": "The Neuroscientist : a review journal bringing neurobiology, neurology and psychiatry",
    "doi": "10.1177/1073858402238515",
    "pmid": "12467378",
    "url": "https://doi.org/10.1177/1073858402238515",
    "verified": true,
    "takeaways": [
      "Cortical excitability reflects the balance between glutamate (excitatory) and GABA (inhibitory).",
      "Glutamate is the metabolic precursor of GABA, and GABA can be recycled through the TCA cycle to make glutamate.",
      "GABA synthesis uses two glutamic acid decarboxylase isoforms encoded on separate chromosomes; GABA metabolites homocarnosine and pyrrolidinone are unusually abundant in human brain and affect excitability."
    ],
    "facts": {
      "design": "review"
    }
  },
  {
    "id": "article:refsum-2004-homocysteine-recommendations",
    "type": "article",
    "name": "Facts and recommendations about total homocysteine determinations: an expert opinion",
    "aliases": [
      "Refsum 2004"
    ],
    "summary": "International expert opinion on total homocysteine measurement: sampling, reference intervals, and recommendations for use in homocystinuria, B-vitamin deficiency and vascular risk.",
    "body": [
      "The document covers how to measure [[outcome:elevated-homocysteine]] (sample handling, assays, within-person variability, the methionine loading test) and when it is useful as a diagnostic or screening marker, including [[state:hyperhomocysteinemia]] in folate and cobalamin deficiency, renal failure and pregnancy complications."
    ],
    "evidence": "established",
    "authors": [
      "Refsum H",
      "Smith AD",
      "Ueland PM",
      "Nexo E",
      "Clarke R",
      "McPartlin J",
      "Johnston C",
      "Engbaek F",
      "Schneede J",
      "McPartlin C",
      "et al."
    ],
    "year": 2004,
    "journal": "Clinical chemistry",
    "doi": "10.1373/clinchem.2003.021634",
    "pmid": "14709635",
    "url": "https://doi.org/10.1373/clinchem.2003.021634",
    "verified": true,
    "takeaways": [
      "Plasma total homocysteine is raised in a wide range of disorders, so interpretation requires context.",
      "Pre-analytical handling, assay method, biological determinants and within-person variability influence results and reference intervals.",
      "Disease-specific recommendations are given for homocystinuria, folate and cobalamin deficiency, cardiovascular disease, renal failure, psychiatric and cognitive disorders, and pregnancy."
    ],
    "facts": {
      "design": "expert opinion"
    }
  },
  {
    "id": "article:wald-1982-glycine-gastric-acid",
    "type": "article",
    "name": "Stimulation of gastric acid secreted by glycine and related oligopeptides in humans",
    "aliases": [
      "Wald & Adibi 1982"
    ],
    "summary": "Human study: intragastric glycine and glycine peptides raised gastric acid output from 3.3 to about 5.6 mmol/h, but serum gastrin did not change detectably.",
    "body": [
      "Healthy volunteers received intragastric glycine, diglycine, triglycine, tetraglycine or saline matched for osmolality and pH. [[compound:glycine]] stimulated acid secretion (see [[outcome:increased-gastric-acid-output]]) without a measurable change in serum [[compound:gastrin]], and the authors tied the stimulus to the plasma glycine rise after small-intestinal absorption.",
      "This weakens the idea that glycine acts mainly by releasing gastrin ([[claim:free-glycine-stimulates-gastrin]]) while supporting a modest acid-stimulating effect."
    ],
    "evidence": "established",
    "authors": [
      "Wald A",
      "Adibi SA"
    ],
    "year": 1982,
    "journal": "The American journal of physiology",
    "doi": "10.1152/ajpgi.1982.242.2.G85",
    "pmid": "7065145",
    "url": "https://doi.org/10.1152/ajpgi.1982.242.2.G85",
    "verified": true,
    "takeaways": [
      "Acid output was greater during intragastric glycine than saline infusion (5.6 vs 3.3 mmol/h) and not significantly different between glycine and its peptides.",
      "Plasma glycine rose during infusion but serum gastrin showed no detectable change.",
      "The authors conclude that the raised plasma glycine, after absorption from the small intestine, was the stimulus, because there was no gastric absorption of glycine or peptide hydrolysis in the stomach."
    ],
    "facts": {
      "design": "human physiology study",
      "population": "Healthy volunteers"
    }
  },
  {
    "id": "article:gordan-2015-autonomic-cardiovascular-control",
    "type": "article",
    "name": "Autonomic and endocrine control of cardiovascular function",
    "aliases": [
      "Gordan 2015"
    ],
    "summary": "Review of cardiovascular control: the sinoatrial node alone would pace at about 100 beats/min, and parasympathetic and sympathetic input plus hormones set heart rate and contractility.",
    "body": [
      "The review explains how autonomic and endocrine inputs regulate heart rate, so the resting rate reflects ongoing parasympathetic (vagal) restraint of the intrinsic pacemaker. It supplies the physiological background for [[system:cardiac-autonomic-control]], [[system:vagal-tone]] and [[outcome:tachycardia]], but does not test any dietary or choline-related intervention."
    ],
    "evidence": "established",
    "authors": [
      "Gordan R",
      "Gwathmey JK",
      "Xie LH"
    ],
    "year": 2015,
    "journal": "World journal of cardiology",
    "doi": "10.4330/wjc.v7.i4.204",
    "pmid": "25914789",
    "url": "https://doi.org/10.4330/wjc.v7.i4.204",
    "verified": true,
    "takeaways": [
      "Without extrinsic influences the sinoatrial node paces at roughly 100 beats per minute.",
      "Heart rate and contractility are adjusted by the nervous system, hormones and other factors to match tissue demand.",
      "Both the autonomic nervous system and the endocrine system exert major control over cardiovascular function."
    ],
    "facts": {
      "design": "review"
    }
  },
  {
    "id": "article:browning-2014-vagal-control-gi",
    "type": "article",
    "name": "Central nervous system control of gastrointestinal motility and secretion and modulation of gastrointestinal functions",
    "aliases": [
      "Browning & Travagli 2014"
    ],
    "summary": "Comprehensive Physiology review: the stomach and oesophagus depend on vagal (parasympathetic) input for tone, motility and secretion, while the intestines work more autonomously.",
    "body": [
      "The review describes vagovagal circuitry from brainstem nuclei to the gut, with parasympathetic pathways exerting both excitatory and inhibitory control over gastric tone and motility and sympathetic input mainly inhibitory. It underpins [[system:vagal-tone]] as a determinant of [[system:gastric-physiology]], [[system:pylorus]] function and [[state:gastric-dysmotility]]."
    ],
    "evidence": "established",
    "authors": [
      "Browning KN",
      "Travagli RA"
    ],
    "year": 2014,
    "journal": "Comprehensive physiology",
    "doi": "10.1002/cphy.c130055",
    "pmid": "25428846",
    "url": "https://doi.org/10.1002/cphy.c130055",
    "verified": true,
    "takeaways": [
      "The gut has intrinsic neural plexuses, but the stomach and oesophagus rely much more on extrinsic autonomic input than the intestines.",
      "Sympathetic activity is mostly inhibitory to GI muscle and secretion; parasympathetic activity can be both excitatory and inhibitory.",
      "Brainstem reflex circuits can be modulated under physiological and pathophysiological conditions."
    ],
    "facts": {
      "design": "review"
    }
  },
  {
    "id": "article:ridlon-2014-bile-acids-microbiome",
    "type": "article",
    "name": "Bile acids and the gut microbiome",
    "aliases": [
      "Ridlon 2014"
    ],
    "summary": "Review of the bile acid-gut microbiome axis: microbes deconjugate and transform bile acids, shaping the pool size and composition, while bile acids in turn regulate the microbiome.",
    "body": [
      "Bacterial bile salt hydrolysis ([[enzyme:bile-salt-hydrolase]]) removes glycine or taurine from conjugated [[compound:bile-acids]], altering the hydrophobicity of the pool and FXR signalling. Reduced bile acid levels in the gut are associated with bacterial overgrowth, linking [[system:bile]] to [[system:gut-microbiota]] balance."
    ],
    "evidence": "established",
    "authors": [
      "Ridlon JM",
      "Kang DJ",
      "Hylemon PB",
      "Bajaj JS"
    ],
    "year": 2014,
    "journal": "Current opinion in gastroenterology",
    "doi": "10.1097/MOG.0000000000000057",
    "pmid": "24625896",
    "url": "https://doi.org/10.1097/MOG.0000000000000057",
    "verified": true,
    "takeaways": [
      "Bile acid pool size is a function of microbial metabolism in the intestine.",
      "The host makes a large pool of conjugated hydrophilic bile acids, whereas microbial activity yields a smaller unconjugated hydrophobic pool, via opposing effects on FXR.",
      "Reduced bile acid levels in the gut are associated with bacterial overgrowth and inflammation; diet, antibiotics and disease shift the balance."
    ],
    "facts": {
      "design": "review"
    }
  },
  {
    "id": "article:furness-2012-enteric-nervous-system",
    "type": "article",
    "name": "The enteric nervous system and neurogastroenterology",
    "aliases": [
      "Furness 2012"
    ],
    "summary": "Review of neurogastroenterology: the enteric nervous system controls gut muscle and fluid movement, and the degree of CNS control differs along the digestive tract.",
    "body": [
      "Furness describes how enteric reflex circuits, sympathetic ganglia and the central nervous system integrate digestion, and how ENS neuropathies such as achalasia and gastroparesis cause dysfunction. It is the general reference for the [[system:enteric-nervous-system]] in this knowledge base."
    ],
    "evidence": "established",
    "authors": [
      "Furness JB"
    ],
    "year": 2012,
    "journal": "Nature reviews. Gastroenterology & hepatology",
    "doi": "10.1038/nrgastro.2012.32",
    "pmid": "22392290",
    "url": "https://doi.org/10.1038/nrgastro.2012.32",
    "verified": true,
    "takeaways": [
      "Digestion is controlled by integrating signals from the ENS, the CNS and sympathetic ganglia, with neural and endocrine control tightly coordinated.",
      "The balance of ENS and CNS control differs considerably along the digestive tract.",
      "Disorders such as achalasia and gastroparesis show the clinical importance of the ENS, and enteric receptors are potential drug targets."
    ],
    "facts": {
      "design": "review"
    }
  },
  {
    "id": "article:mato-2008-methionine-metabolism-liver",
    "type": "article",
    "name": "Methionine metabolism and liver disease",
    "aliases": [
      "Mato 2008"
    ],
    "summary": "Review: labile methyl-group balance (choline, methionine, betaine, folate) governs liver health; deficiency causes steatosis and liver cancer in animals and in inborn errors.",
    "body": [
      "From the 1930s observation that choline prevents fatty liver, the authors trace how methyl-donor deficiency and enzyme defects in methionine and folate metabolism lead to steatosis and tumours, and how methionine metabolites protect the liver in models. It supports the [[system:liver]] as the main hub of [[pathway:methionine-cycle]] and methyl-balance reactions."
    ],
    "evidence": "established",
    "authors": [
      "Mato JM",
      "Martínez-Chantar ML",
      "Lu SC"
    ],
    "year": 2008,
    "journal": "Annual review of nutrition",
    "doi": "10.1146/annurev.nutr.28.061807.155438",
    "pmid": "18331185",
    "url": "https://doi.org/10.1146/annurev.nutr.28.061807.155438",
    "verified": true,
    "takeaways": [
      "Choline was shown in the 1930s to prevent fatty liver in pancreatectomised dogs.",
      "Diets deficient in labile methyl groups produce fatty liver in rodents, and long-term choline- and methionine-deficient diets also cause hepatocellular carcinoma.",
      "Mice or patients lacking key methionine and folate enzymes confirm the importance of methyl balance for liver function."
    ],
    "facts": {
      "design": "review"
    }
  },
  {
    "id": "article:mittal-1997-esophagogastric-junction",
    "type": "article",
    "name": "The esophagogastric junction",
    "aliases": [
      "Mittal & Balaban 1997"
    ],
    "summary": "NEJM review of the oesophagogastric junction: the lower oesophageal sphincter and crural diaphragm form the reflux barrier, and transient sphincter relaxations are a main route of reflux.",
    "body": [
      "The review describes the anatomy and physiology of the [[system:lower-esophageal-sphincter]] and crural diaphragm and how gastric distension triggers transient relaxations, the basis for much physiological reflux and venting of gas. It does not address amino acid or pH effects on sphincter closure."
    ],
    "evidence": "established",
    "authors": [
      "Mittal RK",
      "Balaban DH"
    ],
    "year": 1997,
    "journal": "The New England journal of medicine",
    "doi": "10.1056/NEJM199703273361306",
    "pmid": "9070474",
    "url": "https://doi.org/10.1056/NEJM199703273361306",
    "verified": true,
    "takeaways": [
      "The antireflux barrier at the junction consists of the intrinsic lower oesophageal sphincter and the surrounding crural diaphragm.",
      "Transient lower oesophageal sphincter relaxations, often triggered by gastric distension, allow gas to vent and are a main reflux mechanism.",
      "The article has no abstract in PubMed; these points reflect the review's established content."
    ],
    "facts": {
      "design": "review"
    }
  },
  {
    "id": "article:chebi-2016",
    "type": "article",
    "name": "ChEBI in 2016: Improved services and an expanding collection of metabolites",
    "aliases": [
      "ChEBI 2016"
    ],
    "summary": "ChEBI, the ontology and database of chemical entities of biological interest, used here as the source of formulae, structures and CHEBI identifiers for small molecules.",
    "body": [
      "ChEBI classifies and annotates small molecules with structures, synonyms and cross-references and includes an expanded collection of human endogenous metabolites. Entries for cofactors, intermediates and nutrients cite it for their chemical identity (formula, charge state, CHEBI id), not for physiological claims."
    ],
    "evidence": "established",
    "authors": [
      "Hastings J",
      "Owen G",
      "Dekker A",
      "Ennis M",
      "Kale N",
      "Muthukrishnan V",
      "Turner S",
      "Swainston N",
      "Mendes P",
      "Steinbeck C"
    ],
    "year": 2016,
    "journal": "Nucleic acids research",
    "doi": "10.1093/nar/gkv1031",
    "pmid": "26467479",
    "url": "https://doi.org/10.1093/nar/gkv1031",
    "verified": true,
    "takeaways": [
      "ChEBI held over 46,000 entries, each classified in an ontology and annotated with structure, synonyms and cross-references.",
      "The 2016 update substantially extended endogenous metabolites for human, mouse, E. coli and yeast.",
      "It is a chemistry reference: it defines identity and classification, not clinical relevance."
    ],
    "facts": {
      "design": "database"
    }
  },
  {
    "id": "article:rhea-2022",
    "type": "article",
    "name": "Rhea, the reaction knowledgebase in 2022",
    "aliases": [
      "Rhea 2022"
    ],
    "summary": "Rhea, the expert-curated reaction knowledgebase based on ChEBI; it is the reference vocabulary for enzyme reaction annotation in UniProtKB and the source of the Rhea ids used for reactions here.",
    "body": [
      "Rhea provides atom- and charge-balanced reaction equations with enzyme links, which is why reaction entries here list protons, water and cofactors explicitly. Participants such as [[compound:water]], [[compound:proton]] and [[compound:phosphate]] cite it for their role as stoichiometric participants."
    ],
    "evidence": "established",
    "authors": [
      "Bansal P",
      "Morgat A",
      "Axelsen KB",
      "Muthukrishnan V",
      "Coudert E",
      "Aimo L",
      "Hyka-Nouspikel N",
      "Gasteiger E",
      "Kerhornou A",
      "Neto TB",
      "et al."
    ],
    "year": 2022,
    "journal": "Nucleic acids research",
    "doi": "10.1093/nar/gkab1016",
    "pmid": "34755880",
    "url": "https://doi.org/10.1093/nar/gkab1016",
    "verified": true,
    "takeaways": [
      "Rhea is an expert-curated knowledgebase of biochemical reactions built on ChEBI.",
      "It has been adopted as the reference vocabulary for enzyme annotation in UniProtKB and is an ELIXIR Core Data Resource.",
      "Reactions are balanced for atoms and charge, so cofactors, water and protons are stated explicitly."
    ],
    "facts": {
      "design": "database"
    }
  },
  {
    "id": "article:hmdb-2022",
    "type": "article",
    "name": "HMDB 5.0: the Human Metabolome Database for 2022",
    "aliases": [
      "HMDB 5.0"
    ],
    "summary": "HMDB 5.0, the Human Metabolome Database: curated reference data on 217,920 metabolites, their properties, concentrations and pathways.",
    "body": [
      "The database collects chemical, biological and physiological information on human metabolites. Metabolite entries cite it for identifiers (HMDB numbers) and descriptive properties, again for identity rather than clinical meaning."
    ],
    "evidence": "established",
    "authors": [
      "Wishart DS",
      "Guo A",
      "Oler E",
      "Wang F",
      "Anjum A",
      "Peters H",
      "Dizon R",
      "Sayeeda Z",
      "Tian S",
      "Lee BL",
      "et al."
    ],
    "year": 2022,
    "journal": "Nucleic acids research",
    "doi": "10.1093/nar/gkab1062",
    "pmid": "34986597",
    "url": "https://doi.org/10.1093/nar/gkab1062",
    "verified": true,
    "takeaways": [
      "HMDB 5.0 expanded from 114,100 to 217,920 metabolite entries.",
      "It improved metabolite descriptions and added structure, spectral and pathway visualisation tools.",
      "It serves metabolomics, nutrition, biochemistry and clinical chemistry as a reference resource."
    ],
    "facts": {
      "design": "database"
    }
  },
  {
    "id": "article:ying-2008-nad-nadp",
    "type": "article",
    "name": "NAD+/NADH and NADP+/NADPH in cellular functions and cell death: regulation and biological consequences",
    "aliases": [
      "Ying 2008"
    ],
    "summary": "Review of NAD(H) and NADP(H): NAD mediates energy metabolism, NADPH powers antioxidant systems, and both shape calcium signalling, cell death and ageing.",
    "body": [
      "The review explains the division of labour between [[compound:nad]] / [[compound:nadh]] (catabolic redox, energy metabolism, sirtuins) and [[compound:nadp]] / [[compound:nadph]] (reductive biosynthesis and antioxidant defence), including the NADPH-requiring reactions in this knowledge base such as the [[enzyme:mthfr]] step."
    ],
    "evidence": "established",
    "authors": [
      "Ying W"
    ],
    "year": 2008,
    "journal": "Antioxidants & redox signaling",
    "doi": "10.1089/ars.2007.1672",
    "pmid": "18020963",
    "url": "https://doi.org/10.1089/ars.2007.1672",
    "verified": true,
    "takeaways": [
      "NAD(H) mediates energy metabolism and mitochondrial function, while NADPH is a key component of cellular antioxidation systems.",
      "NAD- and NADP-derived molecules such as cyclic ADP-ribose mediate calcium homeostasis, and both coenzymes modulate cell death pathways.",
      "NAD-dependent sirtuins link NAD metabolism to ageing-related processes."
    ],
    "facts": {
      "design": "review"
    }
  },
  {
    "id": "article:sies-2017-h2o2-redox-signaling",
    "type": "article",
    "name": "Hydrogen peroxide as a central redox signaling molecule in physiological oxidative stress: Oxidative eustress",
    "aliases": [
      "Sies 2017"
    ],
    "summary": "Review of hydrogen peroxide as a redox signalling molecule: nanomolar levels signal (oxidative eustress), while supraphysiological levels damage biomolecules (oxidative distress).",
    "body": [
      "The overview covers the metabolic sources and sinks of H2O2, including peroxisomal and flavoprotein oxidases such as diamine oxidase ([[enzyme:dao]]) and PNP oxidase ([[enzyme:pnpo]]), and the concentration windows at which it signals or damages."
    ],
    "evidence": "established",
    "authors": [
      "Sies H"
    ],
    "year": 2017,
    "journal": "Redox biology",
    "doi": "10.1016/j.redox.2016.12.035",
    "pmid": "28110218",
    "url": "https://doi.org/10.1016/j.redox.2016.12.035",
    "verified": true,
    "takeaways": [
      "H2O2 is a major redox metabolite operating in sensing, signalling and regulation.",
      "Physiological concentrations of about 1-10 nM define oxidative eustress; higher levels trigger adaptive stress responses via Nrf2/Keap1 or NF-kB.",
      "Concentrations above about 100 nM damage biomolecules (oxidative distress)."
    ],
    "facts": {
      "design": "review"
    }
  },
  {
    "id": "article:shi-2015-acetyl-coa-metabolism",
    "type": "article",
    "name": "Acetyl-CoA and the regulation of metabolism: mechanisms and consequences",
    "aliases": [
      "Shi & Tu 2015"
    ],
    "summary": "Review of acetyl-CoA as a sentinel metabolite: high nucleocytosolic acetyl-CoA signals the fed state and drives lipid synthesis and histone acetylation; the fasted state routes it into mitochondria.",
    "body": [
      "Acetyl-CoA is the carrier of two-carbon units that links glycolysis, fatty acid oxidation and the TCA cycle to biosynthesis and protein acetylation. In this knowledge base it is the acetyl donor of [[enzyme:chat]] in [[pathway:acetylcholine-synthesis]]; the review is a general reference for [[compound:acetyl-coa]] and [[compound:coa]]."
    ],
    "evidence": "established",
    "authors": [
      "Shi L",
      "Tu BP"
    ],
    "year": 2015,
    "journal": "Current opinion in cell biology",
    "doi": "10.1016/j.ceb.2015.02.003",
    "pmid": "25703630",
    "url": "https://doi.org/10.1016/j.ceb.2015.02.003",
    "verified": true,
    "takeaways": [
      "Acetyl-CoA is a key node in metabolism, intersecting many pathways.",
      "Cells monitor acetyl-CoA levels as an indicator of metabolic state through acetylation of proteins.",
      "High nucleocytosolic acetyl-CoA marks a fed or growth state; in fasting it is directed into mitochondria for ATP and ketone body synthesis."
    ],
    "facts": {
      "design": "review"
    }
  },
  {
    "id": "article:lu-2014-thioredoxin-system",
    "type": "article",
    "name": "The thioredoxin antioxidant system",
    "aliases": [
      "Lu & Holmgren 2014"
    ],
    "summary": "Review of the thioredoxin antioxidant system (NADPH, thioredoxin reductase, thioredoxin): a disulfide reductase system that supplies electrons to peroxiredoxins and other redox-sensitive proteins.",
    "body": [
      "Thioredoxin cycles between the reduced dithiol and oxidised disulfide forms ([[compound:thioredoxin-dithiol]], [[compound:thioredoxin-disulfide]]) at the expense of [[compound:nadph]]. In some bacteria that lack a glutathione system the thioredoxin system is essential, which is relevant to the proposed thioredoxin-dependent glycine reductase ([[reaction:bacterial-glycine-reductase]])."
    ],
    "evidence": "established",
    "authors": [
      "Lu J",
      "Holmgren A"
    ],
    "year": 2014,
    "journal": "Free radical biology & medicine",
    "doi": "10.1016/j.freeradbiomed.2013.07.036",
    "pmid": "23899494",
    "url": "https://doi.org/10.1016/j.freeradbiomed.2013.07.036",
    "verified": true,
    "takeaways": [
      "The Trx system comprises NADPH, thioredoxin reductase and thioredoxin and regulates protein dithiol/disulfide balance.",
      "It provides electrons to peroxiredoxins, ribonucleotide reductase and methionine sulfoxide reductases, and works alongside the glutathione-glutaredoxin system.",
      "Bacteria such as H. pylori lack a glutathione-glutaredoxin system, making their thioredoxin system essential under oxidative stress."
    ],
    "facts": {
      "design": "review"
    }
  },
  {
    "id": "article:watmough-2010-etf-qo",
    "type": "article",
    "name": "The electron transfer flavoprotein: ubiquinone oxidoreductases",
    "aliases": [
      "Watmough & Frerman 2010"
    ],
    "summary": "Review of ETF and ETF:ubiquinone oxidoreductase, the short pathway that passes electrons from 11 mitochondrial flavoprotein dehydrogenases (including DMGDH and SARDH) to ubiquinone.",
    "body": [
      "Electron transfer flavoprotein ([[compound:etf-oxidized]] / [[compound:etf-reduced]]) accepts electrons from mitochondrial flavoenzymes and hands them to ETF-QO. It is the immediate acceptor for [[enzyme:dmgdh]] and [[enzyme:sardh]] in the choline-oxidation route."
    ],
    "evidence": "established",
    "authors": [
      "Watmough NJ",
      "Frerman FE"
    ],
    "year": 2010,
    "journal": "Biochimica et biophysica acta",
    "doi": "10.1016/j.bbabio.2010.10.007",
    "pmid": "20937244",
    "url": "https://doi.org/10.1016/j.bbabio.2010.10.007",
    "verified": true,
    "takeaways": [
      "ETF and ETF-QO transfer electrons from 11 different mitochondrial flavoprotein dehydrogenases to the ubiquinone pool.",
      "ETF-QO is a monotopic membrane protein with FAD and a [4Fe-4S] cluster; the flavin is the immediate reductant of ubiquinone.",
      "Mutations in the pathway are associated with multiple acyl-CoA dehydrogenase deficiency (MADD)."
    ],
    "facts": {
      "design": "review"
    }
  },
  {
    "id": "article:szegedi-2008-bhmt2-smm",
    "type": "article",
    "name": "Betaine-homocysteine S-methyltransferase-2 is an S-methylmethionine-homocysteine methyltransferase",
    "aliases": [
      "Szegedi 2008"
    ],
    "summary": "Enzymology: human BHMT-2 is a zinc enzyme that methylates homocysteine using S-methylmethionine and cannot use betaine, unlike BHMT.",
    "body": [
      "The kinetic study defines [[enzyme:bhmt2]] as an S-methylmethionine-homocysteine methyltransferase with a Km of 0.94 mM for [[compound:s-methylmethionine]]. It suggests that, in vivo, SMM-dependent homocysteine methylation occurs via BHMT-2 rather than [[enzyme:bhmt]]. The physiological importance of the SMM route in humans, where SMM comes from plant foods, is unclear."
    ],
    "evidence": "established",
    "authors": [
      "Szegedi SS",
      "Castro CC",
      "Koutmos M",
      "Garrow TA"
    ],
    "year": 2008,
    "journal": "The Journal of biological chemistry",
    "doi": "10.1074/jbc.M710449200",
    "pmid": "18230605",
    "url": "https://doi.org/10.1074/jbc.M710449200",
    "verified": true,
    "takeaways": [
      "Purified recombinant human BHMT-2 is a zinc metalloenzyme that uses SMM as methyl donor for homocysteine and cannot use betaine.",
      "BHMT-2 is not inhibited by dimethylglycine or betaine, whereas dimethylglycine strongly inhibits BHMT.",
      "The authors hypothesise that most SMM-dependent methylation of homocysteine in vivo occurs via BHMT-2."
    ],
    "facts": {
      "design": "enzymology"
    }
  },
  {
    "id": "article:mattaini-2016-serine-metabolism",
    "type": "article",
    "name": "The importance of serine metabolism in cancer",
    "aliases": [
      "Mattaini 2016"
    ],
    "summary": "Review of serine metabolism: serine comes from the diet or from glucose via 3-phosphoglycerate, and supplies amino acid transport, nucleotide synthesis, folate one-carbon units and redox balance.",
    "body": [
      "The review summarises the phosphoglycerate dehydrogenase route ([[enzyme:phgdh]], [[enzyme:psat1]], [[enzyme:psph]]) from [[compound:3-phosphoglycerate]] through [[compound:3-phosphohydroxypyruvate]] and [[compound:3-phosphoserine]] to [[compound:serine]], and why cells use it. The discussion is framed around cancer but the biochemistry is general."
    ],
    "evidence": "established",
    "authors": [
      "Mattaini KR",
      "Sullivan MR",
      "Vander Heiden MG"
    ],
    "year": 2016,
    "journal": "The Journal of cell biology",
    "doi": "10.1083/jcb.201604085",
    "pmid": "27458133",
    "url": "https://doi.org/10.1083/jcb.201604085",
    "verified": true,
    "takeaways": [
      "Serine can be taken up or synthesised de novo from glucose, and many cancers depend on the synthetic route.",
      "Serine synthesis supports amino acid transport, nucleotide synthesis, folate metabolism and redox homeostasis.",
      "The paper is framed around tumour biology, so physiological regulation in healthy tissue is not its focus."
    ],
    "facts": {
      "design": "review"
    }
  },
  {
    "id": "article:meiser-2013-dopamine-metabolism",
    "type": "article",
    "name": "Complexity of dopamine metabolism",
    "aliases": [
      "Meiser 2013"
    ],
    "summary": "Review of dopamine biosynthesis, degradation and oxidation chemistry, including COMT and MAO routes, with emphasis on oxidative stress in Parkinson disease.",
    "body": [
      "The review follows [[compound:dopamine]] from synthesis to degradation, including methylation by [[enzyme:comt]] to [[compound:3-methoxytyramine]], and explains how its metabolism generates reactive oxygen species. It is a general reference for the catecholamine methylation example used in [[reaction:comt-dopamine-methylation]]."
    ],
    "evidence": "established",
    "authors": [
      "Meiser J",
      "Weindl D",
      "Hiller K"
    ],
    "year": 2013,
    "journal": "Cell communication and signaling : CCS",
    "doi": "10.1186/1478-811X-11-34",
    "pmid": "23683503",
    "url": "https://doi.org/10.1186/1478-811X-11-34",
    "verified": true,
    "takeaways": [
      "Dopamine metabolism is tightly linked to oxidative stress because its degradation generates reactive oxygen species.",
      "The review covers biosynthesis, sequestration, degradation and oxidation, and regulation of the enzymes involved.",
      "It is oriented to Parkinson disease; relevance to methylation capacity is indirect."
    ],
    "facts": {
      "design": "review"
    }
  },
  {
    "id": "article:kennedy-1956-cytidine-coenzymes",
    "type": "article",
    "name": "The function of cytidine coenzymes in the biosynthesis of phospholipides",
    "aliases": [
      "Kennedy & Weiss 1956"
    ],
    "summary": "Classic biochemical paper establishing that CDP-choline and CDP-ethanolamine are the activated intermediates for phosphatidylcholine and phosphatidylethanolamine synthesis (the Kennedy pathway).",
    "body": [
      "Kennedy and Weiss showed that cytidine coenzymes carry the phosphorylated head groups to diacylglycerol. This defines the [[pathway:kennedy-pathway]] in which [[compound:phosphocholine]] and [[compound:phosphoethanolamine]] are activated by CTP to [[compound:cdp-choline]] and [[compound:cdp-ethanolamine]], releasing [[compound:cmp]] when the lipid is formed."
    ],
    "evidence": "established",
    "authors": [
      "KENNEDY EP",
      "WEISS SB"
    ],
    "year": 1956,
    "journal": "The Journal of biological chemistry",
    "pmid": "13366993",
    "url": "https://pubmed.ncbi.nlm.nih.gov/13366993/",
    "verified": true,
    "takeaways": [
      "Cytidine coenzymes (CDP-choline, CDP-ethanolamine) are the activated forms used to build membrane phospholipids.",
      "The head-group-activation strategy, reacting CDP-base with diacylglycerol, became the template of the Kennedy pathway.",
      "This is a 1956 foundational paper; modern enzymology and regulation are covered by later work such as the review by Vance."
    ],
    "facts": {
      "design": "biochemistry"
    }
  }
];
