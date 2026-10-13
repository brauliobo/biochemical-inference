// Claims: atomic statements extracted from the source conversation (plus a few literature counterweights),
// each graded against the literature. Educational content only; nothing here is a diagnosis or medical advice.
// Mapping used for the evidence grade: supported -> established, partly-supported -> plausible,
// contested -> plausible/speculative, unsupported -> speculative. Contradicting sources are cited in the body
// as [[article:...]] mentions because the relation vocabulary only allows articles as the source of evidence edges.
export default [
  {
    id: "claim:gnmt-methyl-sink-valve",
    type: "claim",
    name: "GNMT is a methyl 'escape valve'",
    aliases: ["GNMT é uma válvula de escape de metil"],
    summary: "Supported: GNMT uses glycine to turn surplus SAM into SAH and sarcosine, buffering the SAM:SAH ratio. It is regulated, not an open drain.",
    statement: "GNMT acts as an escape valve: when SAM is in excess it uses glycine to convert SAM to SAH and sarcosine, discarding methyl groups to avoid hypermethylation.",
    source: "conversation",
    status: "supported",
    evidence: "established",
    body: [
      "Human and animal data agree. GNMT-deficient people have persistently raised methionine and SAM, and GNMT knockout mice show many-fold higher SAM and a SAM:SAH ratio near 300 rather than about 3 ([[enzyme:gnmt]], [[article:mudd-2001-gnmt-deficiency]]). When dietary methyl intake exceeds demand, surplus methyl appears as sarcosine, notably in people lacking sarcosine dehydrogenase.",
      "Important nuance for the conversation: the valve is regulated. GNMT is inhibited by 5-methyl-THF polyglutamates and its activity falls under methyl-deficient conditions, which conserves SAM. That is why the leap to 'glycine drains SAM in under-methylated people' does not follow ([[claim:glycine-gnmt-depletes-sam-in-undermethylated]])."
    ],
    relations: [
      { rel: "associated-with", to: "enzyme:gnmt" },
      { rel: "associated-with", to: "compound:glycine" },
      { rel: "associated-with", to: "compound:sam" },
      { rel: "associated-with", to: "outcome:sarcosine-elevation" }
    ],
    refs: ["article:luka-2009-gnmt-sam-regulation", "article:mudd-2001-gnmt-deficiency"]
  },
  {
    id: "claim:glycine-gnmt-depletes-sam-in-undermethylated",
    type: "claim",
    name: "Exogenous glycine depletes SAM in undermethylated people via GNMT",
    aliases: ["glicina drena SAMe em submetilados via GNMT", "glicina como esponja de metil", "esponja de metil"],
    summary: "Unsupported: no study shows oral glycine lowering SAM in humans; GNMT is feedback-regulated, though very high glycine intake in rodents does lower methionine.",
    statement: "In undermethylated people the SAM pool is already low, so exogenous glycine (even 2-3 g) acts as a methyl sponge, disproportionately activating GNMT and draining the scarce methyl groups.",
    source: "conversation",
    status: "unsupported",
    evidence: "speculative",
    body: [
      "No human trial measures SAM, SAH or the SAM:SAH ratio after glycine supplementation. Mechanistically, GNMT activity is restrained when methyl supply is low (inhibition by 5-methyl-THF, reduced activity in methyl deficiency), and GNMT is only one of several SAM sinks next to PEMT and creatine synthesis ([[claim:pemt-consumes-three-sam]], [[article:stead-2006-methyl-balance-reevaluation]]).",
      "A real interaction exists at extreme doses: rats on high-methionine diets given extra glycine kept lower hepatic methionine, and glycine at several percent of diet is proposed to mimic methionine restriction in rodents. Those doses are far above 2-3 g/day in a human, and the direction (less methionine toxicity) is not the 'drain in deficiency' story. Under-methylation itself is also a contested clinical category ([[state:undermethylation]], [[claim:walsh-under-over-methylation-categories-valid]])."
    ],
    relations: [
      { rel: "associated-with", to: "enzyme:gnmt" },
      { rel: "associated-with", to: "compound:glycine" },
      { rel: "associated-with", to: "state:undermethylation" },
      { rel: "associated-with", to: "compound:sam" }
    ]
  },
  {
    id: "claim:pemt-consumes-three-sam",
    type: "claim",
    name: "PEMT uses three SAM per phosphatidylcholine",
    aliases: ["PEMT usa três SAMe por fosfatidilcolina", "três grupos metil do SAMe"],
    summary: "Supported: each PEMT-made phosphatidylcholine costs three methyl groups from SAM, making PEMT, with creatine synthesis, a leading methyl sink.",
    statement: "The enzyme PEMT depends on three methyl groups from SAM to synthesise phosphatidylcholine de novo.",
    source: "conversation",
    status: "supported",
    evidence: "established",
    body: [
      "PEMT converts phosphatidylethanolamine to phosphatidylcholine by three successive SAM-dependent methylations. Stead et al. (2006) argued, from PEMT knockout mice and revised estimates of dietary creatine, that PEMT and creatine synthesis together consume most SAM-derived methyl groups in humans ([[enzyme:pemt]], [[state:methyl-donor-depletion]]).",
      "The consequence of that share for an individual with adequate choline intake is not established; the pathway supplies mainly liver phosphatidylcholine, and its need rises when choline intake is low ([[disease:choline-deficiency]])."
    ],
    relations: [
      { rel: "associated-with", to: "enzyme:pemt" },
      { rel: "associated-with", to: "compound:sam" },
      { rel: "associated-with", to: "compound:phosphatidylcholine" }
    ],
    refs: ["article:stead-2006-methyl-balance-reevaluation"]
  },
  {
    id: "claim:pemt-pc-is-endogenous-choline-for-acetylcholine",
    type: "claim",
    name: "PEMT-derived phosphatidylcholine is the endogenous choline source for acetylcholine",
    aliases: ["PEMT fornece colina para acetilcolina"],
    summary: "Partly supported: membrane phosphatidylcholine can supply choline, but circulating dietary choline is the main acetylcholine precursor and PEMT is not required when intake is adequate.",
    statement: "PEMT-derived phosphatidylcholine is the endogenous source of choline needed to synthesise acetylcholine, so a methyl drain lowers acetylcholine.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    body: [
      "Neurons make [[compound:acetylcholine]] from choline taken up through a high-affinity transporter; that choline comes from the circulation (diet, hepatic phosphatidylcholine export) and, under high demand, from breakdown of membrane phosphatidylcholine. PEMT contributes to hepatic phosphatidylcholine, but PEMT-null mice are healthy on a choline-sufficient diet, showing that PEMT is not required for choline supply when intake is adequate.",
      "So the chain 'low SAM, low PEMT, low choline, low acetylcholine, gastroparesis' has plausible links but nothing shows that moderate methyl-donor drain limits acetylcholine in humans ([[claim:undermethylation-causes-subclinical-vagal-dysfunction]])."
    ],
    relations: [
      { rel: "associated-with", to: "enzyme:pemt" },
      { rel: "associated-with", to: "compound:acetylcholine" },
      { rel: "associated-with", to: "compound:choline" },
      { rel: "associated-with", to: "system:vagal-tone" }
    ]
  },
  {
    id: "claim:undermethylation-causes-subclinical-vagal-dysfunction",
    type: "claim",
    name: "Under-methylation causes subclinical vagal dysfunction and slow emptying",
    aliases: ["submetilação causa disfunção vagal subclínica"],
    summary: "Unsupported: no study links methylation status to vagal tone, gastric emptying or LES relaxations; established causes of gastric dysmotility are different.",
    statement: "If glycine worsens under-methylation, subclinical vagal dysfunction follows, with slowed gastric emptying (mild functional gastroparesis) and transient LES relaxations, so swallowed air is retained and vented as belching.",
    source: "conversation",
    status: "unsupported",
    evidence: "speculative",
    body: [
      "Documented causes of gastric dysmotility are diabetes, drugs, surgery, post-infectious injury and idiopathic neuropathy ([[state:gastric-dysmotility]], [[disease:gastroparesis]]). No study ties methylation indices to vagal function or gastric emptying. Transient LES relaxations are a normal vagal reflex to distension and are not shown to rise with low SAM.",
      "Heart-rate variability and gastric emptying tests exist to examine vagal function and could test the idea; until then it is a hypothesis built on two unproven links (glycine lowers SAM; low SAM lowers acetylcholine)."
    ],
    relations: [
      { rel: "associated-with", to: "state:undermethylation" },
      { rel: "associated-with", to: "system:vagal-tone" },
      { rel: "associated-with", to: "state:gastric-dysmotility" },
      { rel: "associated-with", to: "outcome:belching" }
    ]
  },
  {
    id: "claim:undermethylated-hypochlorhydria",
    type: "claim",
    name: "Under-methylated people commonly have low stomach acid",
    aliases: ["submetilados têm hipocloridria"],
    summary: "Unsupported: no evidence links methylation status to low basal HCl; established causes of hypochlorhydria are PPIs, H. pylori atrophy and autoimmune gastritis.",
    statement: "It is common for under-methylated people to have low basal HCl production because of reduced cholinergic activity and carbonic anhydrase activity.",
    source: "conversation",
    status: "unsupported",
    evidence: "speculative",
    body: [
      "Gastric acid secretion does depend on cholinergic stimulation and on carbonic anhydrase, but there is no documentation that people classified as 'under-methylators' have lower acid output. Well-established causes are acid-suppressive drugs, corpus atrophy from H. pylori or autoimmunity and old age ([[state:hypochlorhydria]], [[disease:atrophic-gastritis]]).",
      "'Functional hypochlorhydria' is also hard to establish: symptoms do not identify low acid and no validated bedside test exists ([[article:guilliams-2020-betaine-hcl-evidence]])."
    ],
    relations: [
      { rel: "associated-with", to: "state:hypochlorhydria" },
      { rel: "associated-with", to: "state:undermethylation" },
      { rel: "associated-with", to: "pathway:gastric-acid-secretion" }
    ]
  },
  {
    id: "claim:walsh-under-over-methylation-categories-valid",
    type: "claim",
    name: "Under- and over-methylation are valid clinical categories",
    aliases: ["categorias de sub e sobremetilação de Walsh"],
    summary: "Contested: the Walsh/Pfeiffer biotypes rest on a proponent database and non-validated markers (whole-blood histamine); no independent replication or randomized trials are known.",
    statement: "People can be classed as under- or over-methylators (identified by markers such as blood histamine and SAM:SAH), and nutrient therapy should differ by class, with methyl donors avoided in the wrong state.",
    source: "conversation",
    status: "contested",
    evidence: "speculative",
    body: [
      "The model came from Pfeiffer's 'histadelia/histapenia' and was expanded by Walsh, who reports that most patients fall into a few biotypes and respond to biotype-specific nutrients. Evidence is largely the group's own database and clinical observation; whole-blood histamine depends on basophil count and is not a validated methylation marker, and the counter-intuitive use of folate in 'overmethylators' rests on a hypothesis about epigenetic effects on transporter genes ([[state:undermethylation]], [[state:overmethylation]]).",
      "Mainstream medicine does measure real quantities (SAM:SAH, homocysteine, genetic disorders) and does recognise adverse effects of some methyl donors (for example agitation with SAMe, methionine rise with betaine in CBS deficiency). It does not recognise the biotype diagnosis. Treat it as an unvalidated framework."
    ],
    relations: [
      { rel: "associated-with", to: "state:undermethylation" },
      { rel: "associated-with", to: "state:overmethylation" },
      { rel: "associated-with", to: "outcome:blood-histamine-level" }
    ]
  },
  {
    id: "claim:niacin-drains-methyl-groups",
    type: "claim",
    name: "Niacin (nicotinamide) drains methyl groups",
    aliases: ["niacina drena grupos metil"],
    summary: "Partly supported: NNMT methylates nicotinamide using SAM and very high doses consumed methyl groups in rats, but human trials of NAD precursors showed little change in SAM or homocysteine.",
    statement: "Amino acids and vitamins such as glycine and niacin drain methyl groups, so methyl donors should be supported before introducing them.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    body: [
      "Nicotinamide N-methyltransferase transfers a methyl group from SAM to nicotinamide, producing SAH (and then homocysteine) and 1-methylnicotinamide ([[compound:niacin]], [[enzyme:nnmt]]). In rats, high doses of nicotinamide or nicotinic acid raised methylnicotinamide and produced fatty liver that choline or betaine prevented. In a human trial of nicotinamide riboside in Parkinson's disease, methylated metabolites rose but SAM, SAH and homocysteine did not change.",
      "So the mechanism is real and dose-dependent, but a clinically relevant 'drain' at ordinary supplement doses is not established. Niacin also causes a prostaglandin flush unrelated to methylation ([[outcome:flushing]])."
    ],
    relations: [
      { rel: "associated-with", to: "compound:niacin" },
      { rel: "associated-with", to: "state:methyl-donor-depletion" },
      { rel: "associated-with", to: "compound:sam" }
    ]
  },
  {
    id: "claim:folic-acid-competes-with-methylfolate",
    type: "claim",
    name: "Synthetic folic acid competes with folate receptors and slows methylation",
    aliases: ["ácido fólico compete com metilfolato"],
    summary: "Partly supported: unmetabolised folic acid appears when DHFR saturates, but clinical harm or methylation slowing is unproven, and EFSA treats the forms as equivalent at low doses.",
    statement: "Use L-methylfolate or folinic acid and avoid synthetic folic acid, which can compete for folate receptors and slow the methylation pathway.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    refs: ["article:efsa-2022-5-mthf-dietary-folate-equivalents"],
    body: [
      "Folic acid must be reduced by dihydrofolate reductase, which is slow and saturable in human liver, so unmetabolised folic acid appears in plasma after fortified foods or higher supplement doses. 5-MTHF supplements clearly produce less of it. EFSA (2022) nevertheless proposes the same dietary-folate-equivalent factor as folic acid for 5-MTHF below 400 micrograms per day and a higher one above that dose.",
      "Reviews state that the clinical meaning of unmetabolised folic acid is not established, and no direct human study shows harm. The statement is therefore plausible but unproven; for neural tube defect prevention, folic acid remains the best-validated form ([[intervention:methylfolate-supplement|methylfolate]], [[disease:neural-tube-defects]], [[state:folate-trap]])."
    ],
    relations: [
      { rel: "associated-with", to: "intervention:methylfolate-supplement" },
      { rel: "associated-with", to: "compound:5-mthf" },
      { rel: "associated-with", to: "intervention:folic-acid-supplement" }
    ]
  },
  {
    id: "claim:free-glycine-stimulates-gastrin",
    type: "claim",
    name: "Free glycine stimulates gastrin release",
    aliases: ["glicina livre estimula gastrina"],
    summary: "Unsupported: in human tests glycine did not raise serum gastrin (Wald 1982); phenylalanine and tryptophan are the potent amino-acid stimulants of gastrin and acid (Taylor 1982).",
    statement: "Free glycine and short collagen peptides are potent stimulators of antral G cells, raising gastrin and therefore HCl secretion.",
    source: "conversation",
    status: "unsupported",
    evidence: "speculative",
    body: [
      "Taylor et al. (1982) instilled individual L-amino acids into the stomachs of volunteers: phenylalanine and tryptophan stimulated acid, pancreatic polypeptide and gastrin significantly more than any other amino acid, whereas glycine was not among the amino acids that gave a significant response (only threonine and serine produced smaller, significant responses, for pancreatic polypeptide and acid respectively) ([[article:taylor-1982-amino-acids-gastric-acid]]). In a separate study, Wald and Adibi (1982) infused 100 mM glycine and found that it raised acid output (5.6 vs 3.3 mmol/h) without any detectable change in serum gastrin, and attributed the effect to the rise in plasma glycine ([[article:wald-1982-glycine-gastric-acid]]).",
      "So glycine may modestly affect acid, but not via a 'potent' gastrin effect, and the two studies disagree on whether it affects acid at all. Collagen, which lacks tryptophan, is also an unlikely strong secretagogue ([[claim:collagen-peptides-excess-gastrin-delay-emptying]])."
    ],
    relations: [
      { rel: "associated-with", to: "compound:glycine" },
      { rel: "associated-with", to: "compound:gastrin" },
      { rel: "associated-with", to: "outcome:elevated-gastrin" },
      { rel: "associated-with", to: "outcome:increased-gastric-acid-output" }
    ]
  },
  {
    id: "claim:collagen-peptides-excess-gastrin-delay-emptying",
    type: "claim",
    name: "Collagen peptides provoke excess gastrin and slower emptying",
    aliases: ["colágeno aumenta gastrina e atrasa esvaziamento"],
    summary: "Unsupported: no human data on collagen peptides and gastrin; protein hydrolysates can slow emptying via CCK/GLP-1, but collagen lacks tryptophan and the 'excess gastrin' step is untested.",
    statement: "Collagen peptides, rich in proline and hydroxyproline, require extensive gastric peptic cleavage; if digestion is marginal they stimulate excess gastrin and slow emptying, reproducing the glycine cascade.",
    source: "conversation",
    status: "unsupported",
    evidence: "speculative",
    body: [
      "Protein hydrolysates in general can stimulate CCK and GLP-1 and slow gastric emptying; a collagen hydrolysate slowed emptying in mice through GLP-1, and in humans collagen hydrolysates are absorbed quickly as peptides and amino acids. No study measures gastrin or belching after collagen peptides, and collagen lacks tryptophan, one of the two strongest amino-acid gastrin triggers ([[article:taylor-1982-amino-acids-gastric-acid]]).",
      "Intolerance to collagen powders is therefore plausible as a general protein-hydrolysate or taste/osmolarity effect, but the proposed mechanism is not documented ([[intervention:collagen-peptides]], [[compound:collagen]])."
    ],
    relations: [
      { rel: "associated-with", to: "intervention:collagen-peptides" },
      { rel: "associated-with", to: "compound:gastrin" },
      { rel: "associated-with", to: "outcome:delayed-gastric-emptying" }
    ]
  },
  {
    id: "claim:glycine-buffers-gastric-acid",
    type: "claim",
    name: "Glycine buffers gastric acid and raises gastric pH",
    aliases: ["glicina tampona o ácido gástrico"],
    summary: "Partly supported: glycine does buffer around pH 2-3, but it has little buffering capacity near the pH of a hypochlorhydric stomach, so the 'low-acid stomach' version is chemically weak.",
    statement: "Because glycine is an amphoteric zwitterion, in a stomach that already has little acid it temporarily raises pH.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    body: [
      "Glycine has pKa values of about 2.3 (carboxyl) and 9.6 (amino), so it buffers best between roughly pH 1.5 and 3.5. At normal fasting pH 1-2 a few grams (3 g is about 40 mmol) could consume some of the acid secreted after a meal, which is on the order of 10-30 mmol/h. Near pH 4-5, however, glycine is nearly all zwitterion and buffers poorly, so it would not push an already hypochlorhydric stomach much higher.",
      "No study measures intragastric pH after oral glycine in humans, so the effect size is untested ([[outcome:elevated-gastric-ph]], [[state:hypochlorhydria]]). The follow-on claim about LES and pylorus is separate ([[claim:higher-ph-delays-les-closure-and-pylorus]])."
    ],
    relations: [
      { rel: "associated-with", to: "compound:glycine" },
      { rel: "associated-with", to: "outcome:elevated-gastric-ph" },
      { rel: "associated-with", to: "compound:hydrochloric-acid" }
    ]
  },
  {
    id: "claim:higher-ph-delays-les-closure-and-pylorus",
    type: "claim",
    name: "Higher gastric pH delays LES closure and pyloric opening",
    aliases: ["pH mais alto atrasa o EEI e o piloro"],
    summary: "Unsupported: no evidence that modest pH changes delay LES closure or pyloric opening; acid in the duodenum, not gastric pH, drives pyloric feedback.",
    statement: "A higher gastric pH delays closure of the lower oesophageal sphincter and delays opening of the pylorus, keeping the stomach dilated by trapped air.",
    source: "conversation",
    status: "unsupported",
    evidence: "speculative",
    body: [
      "LES tone and transient relaxations are controlled by vagal reflexes to gastric distension; the pylorus is regulated by duodenal acid, fat and osmolarity feedback ([[system:lower-esophageal-sphincter]], [[system:pylorus]]). Intragastric pH is not a known direct regulator of either, and PPIs, which raise pH markedly, are not recognised causes of belching or relaxed LES.",
      "The only related finding is that PPIs may slow solid-meal emptying through reduced peptic digestion ([[claim:ppis-slow-gastric-emptying]])."
    ],
    relations: [
      { rel: "associated-with", to: "system:lower-esophageal-sphincter" },
      { rel: "associated-with", to: "system:pylorus" },
      { rel: "associated-with", to: "outcome:elevated-gastric-ph" },
      { rel: "associated-with", to: "outcome:transient-les-relaxations" }
    ]
  },
  {
    id: "claim:acid-bicarbonate-reaction-gives-co2-belching",
    type: "claim",
    name: "Acid + bicarbonate neutralisation produces CO2 that distends the stomach",
    aliases: ["ácido com bicarbonato gera CO2 e arroto"],
    summary: "Partly supported: true for ingested bicarbonate or effervescent products; the claim that glycine-driven acid and pancreatic bicarbonate do this inside the stomach is hypothetical.",
    statement: "Extra acid reaching the duodenal bulb is neutralised by pancreatic and biliary bicarbonate (H+ + HCO3- giving CO2); with duodeno-gastric reflux the CO2 forms in the stomach, distending it and triggering continuous belching.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    body: [
      "The chemistry is correct, and swallowed sodium bicarbonate is a known cause of gastric CO2, belching and distension; alginate-bicarbonate products even use that CO2 to float the raft. Pancreatic and biliary bicarbonate neutralises acid distal to the pylorus, where CO2 is largely absorbed through the mucosa ([[outcome:co2-gastric-distension]], [[system:pancreas-bicarbonate]]).",
      "For endogenous bicarbonate to cause gastric belching, appreciable bicarbonate-rich fluid would have to reflux into the stomach and meet acid there; this has not been shown to produce clinical belching. Most belching is swallowed air ([[claim:belching-mostly-swallowed-air]])."
    ],
    relations: [
      { rel: "associated-with", to: "compound:bicarbonate" },
      { rel: "associated-with", to: "compound:carbon-dioxide" },
      { rel: "associated-with", to: "outcome:co2-gastric-distension" },
      { rel: "associated-with", to: "system:duodenum" }
    ]
  },
  {
    id: "claim:belching-mostly-swallowed-air",
    type: "claim",
    name: "Most belching is swallowed air; supragastric belching is a behaviour",
    aliases: ["arroto é principalmente ar engolido", "ar engolido", "aerofagia"],
    summary: "Supported (literature): excessive belching is usually swallowed air vented via gastric or supragastric mechanisms, diagnosed by impedance and treated with diaphragmatic breathing or CBT.",
    statement: "Excessive belching in most patients reflects swallowed air expelled by gastric belching or by supragastric belching; chemical or bacterial gas is a minor contributor.",
    source: "literature",
    status: "supported",
    evidence: "established",
    body: [
      "Rome IV defines excessive gastric and supragastric belching. Impedance shows supragastric belches as swallowed air rapidly returning from the oesophagus, a learned behaviour often triggered by reflux sensations. In a controlled trial, 9 of 15 PPI-refractory patients cut belching by at least half with diaphragmatic breathing, versus none of the wait-list ([[disease:aerophagia-belching-disorders]], [[intervention:diaphragmatic-breathing]]).",
      "This context matters for the glycine report: belching without flatulence points to the upper gut but is not a fingerprint of fermentation or chemical gas ([[outcome:belching]])."
    ],
    relations: [
      { rel: "associated-with", to: "outcome:belching" },
      { rel: "associated-with", to: "disease:aerophagia-belching-disorders" },
      { rel: "associated-with", to: "system:lower-esophageal-sphincter" }
    ],
    refs: ["article:stanghellini-2016-rome-iv-gastroduodenal", "article:ong-2018-diaphragmatic-breathing-belching"]
  },
  {
    id: "claim:sibo-bacteria-metabolize-glycine-co2-nh3",
    type: "claim",
    name: "SIBO bacteria decarboxylate free glycine to CO2 and NH3",
    aliases: ["bactérias do SIBO descarboxilam glicina"],
    summary: "Partly supported: some anaerobes degrade glycine (reductase, cleavage system) releasing ammonia, but 'decarboxylation' is the wrong reaction and human evidence for gas after glycine is absent.",
    statement: "Overgrown proximal bacteria have glycine decarboxylase or Stickland pathways, and ferment free glycine into ammonia and CO2 within 15-45 minutes, causing belching.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    body: [
      "Some anaerobes use glycine as a Stickland electron acceptor: glycine reductase converts it to acetyl phosphate and ammonia (no CO2), and organisms with the glycine cleavage system oxidise it to CO2, NH3 and methylene-THF. Glycine decarboxylation proper would give methylamine. Examples come from Clostridium species rather than measured human small-bowel communities ([[system:gut-microbiota]], [[enzyme:glycine-cleavage-system]]).",
      "Free glycine is absorbed rapidly in the proximal small bowel, so how much reaches a microbial niche is unknown. No study shows gas production from glycine in people with SIBO, and the timing is unsourced ([[claim:sibo-gas-appears-in-15-45-min-as-belching]]). Upper-gut bacterial counts are normally low ([[disease:sibo]])."
    ],
    relations: [
      { rel: "associated-with", to: "disease:sibo" },
      { rel: "associated-with", to: "compound:glycine" },
      { rel: "associated-with", to: "compound:ammonia" },
      { rel: "associated-with", to: "system:gut-microbiota" }
    ]
  },
  {
    id: "claim:sibo-gas-appears-in-15-45-min-as-belching",
    type: "claim",
    name: "SIBO gas appears in 15-45 minutes and shows as belching, not flatulence",
    aliases: ["gás do SIBO em 15 a 45 minutos como arroto"],
    summary: "Unsupported: SIBO gas is mainly hydrogen and methane from carbohydrate fermentation and causes bloating and flatulence; belching needs gas in the stomach or oesophagus, mostly swallowed air.",
    statement: "Bacterial gas generation in the proximal gut occurs in the first 15-45 minutes and appears as belching rather than flatulence, because flatulence would require colonic transit.",
    source: "conversation",
    status: "unsupported",
    evidence: "speculative",
    body: [
      "Breath hydrogen and methane in SIBO tests come from carbohydrate fermentation and typically rise over an hour or longer ([[outcome:breath-hydrogen-methane]]). Gas formed in the small bowel is absorbed or passes distally, and clinical SIBO is characterised by bloating, flatus and diarrhoea rather than belching. The 2024 expert update on SIBO also stresses limits of breath testing ([[article:kashyap-2024-sibo-critical-appraisal]]).",
      "Belching requires gas in the stomach or oesophagus, which is mostly swallowed air ([[claim:belching-mostly-swallowed-air]])."
    ],
    relations: [
      { rel: "associated-with", to: "disease:sibo" },
      { rel: "associated-with", to: "outcome:belching" },
      { rel: "associated-with", to: "outcome:breath-hydrogen-methane" }
    ]
  },
  {
    id: "claim:ppis-cause-sibo",
    type: "claim",
    name: "Months of PPI use cause proximal SIBO",
    aliases: ["IBPs causam SIBO"],
    summary: "Partly supported: meta-analyses show a moderate PPI-SIBO association (odds ratio about 1.7-2.3), but it is test-dependent and heterogeneous, and not proof of causation.",
    statement: "Months of acid suppression with PPIs break the stomach's sterilising barrier, allowing bacterial colonisation of the duodenum and stomach (proximal SIBO).",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    refs: ["article:lo-2013-ppi-sibo-meta-analysis", "article:su-2018-ppi-sibo-meta-analysis"],
    body: [
      "Lo and Chan (2013) pooled studies and found a duration-dependent association; Su et al. (2018) pooled 19 studies (n = 7055) with an odds ratio of 1.71 (95% CI 1.20-2.43) that held in subgroups using aspirate culture or glucose breath tests, and a 2025 meta-analysis found about 2.1 ([[state:acid-suppression]], [[disease:sibo]]).",
      "Limits: observational data, confounding by indication, varied diagnostic tests with modest accuracy, and expert reviews calling for a more critical view of the SIBO hypothesis ([[article:kashyap-2024-sibo-critical-appraisal]]). The conversation also assumes, without evidence, that the user took PPIs and antibiotics."
    ],
    relations: [
      { rel: "associated-with", to: "intervention:ppi-therapy" },
      { rel: "associated-with", to: "disease:sibo" },
      { rel: "associated-with", to: "state:hypochlorhydria" }
    ]
  },
  {
    id: "claim:ppis-slow-gastric-emptying",
    type: "claim",
    name: "PPIs slow gastric emptying and motility",
    aliases: ["IBPs lentificam o esvaziamento gástrico", "IBPs e motilidade gástrica", "estômago preguiçoso com IBP"],
    summary: "Partly supported: a systematic review found PPIs delay solid-meal emptying (liquids inconsistent), but effects are modest, drug-specific and not all studies agree.",
    statement: "Zeroing acid with PPIs made the stomach and intestine 'lazy' and slowed emptying.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    refs: ["article:sanaka-2010-ppi-gastric-emptying"],
    body: [
      "A systematic review reported that PPIs consistently delayed gastric emptying of solid meals, probably through reduced peptic digestion, while liquid emptying was inconsistent; omeprazole 20 mg twice daily delayed scintigraphic emptying in a placebo-controlled trial, and the effect was prevented by tegaserod. Some single-dose studies suggested acceleration or no effect ([[outcome:delayed-gastric-emptying]], [[intervention:ppi-therapy|PPIs]]).",
      "The effect is modest compared with gastroparesis and does not by itself indicate neuromuscular damage ([[state:gastric-dysmotility]])."
    ],
    relations: [
      { rel: "associated-with", to: "intervention:ppi-therapy" },
      { rel: "associated-with", to: "outcome:delayed-gastric-emptying" },
      { rel: "associated-with", to: "state:acid-suppression" }
    ]
  },
  {
    id: "claim:acid-drives-secretin-motilin-mmc",
    type: "claim",
    name: "Gastric acid triggers secretin and motilin and drives the migrating motor complex",
    aliases: ["ácido aciona secretina, motilina e CMM"],
    summary: "Partly supported: duodenal acid does release secretin; but motilin and gastric phase III are linked to duodenal alkalinisation, and acid blocks phase III, so the stated mechanism is oversimplified.",
    statement: "Acid is the physiological trigger telling the duodenum to secrete secretin and motilin, activating the migrating motor complex; eliminating acid with PPIs therefore makes the upper gut sluggish.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    body: [
      "Acid in the duodenum releases [[compound:secretin]] from S cells, which stimulates pancreatic bicarbonate ([[system:pancreas-bicarbonate]]). For motilin and the MMC, the data point the other way: in dogs duodenal alkalinisation raised motilin and started phase III, and in humans gastric phase III did not occur until duodenal pH exceeded about 7, with intraduodenal HCl preventing it. A 2021 review concluded that both acidification and alkalinisation stimulate motilin release in some systems.",
      "Therefore acid is not simply the MMC trigger, and the claim that PPIs abolish the 'cleaning wave' lacks direct support. PPIs' effect on MMC and SIBO is a separate question ([[claim:ppis-cause-sibo]], [[system:duodenum]])."
    ],
    relations: [
      { rel: "associated-with", to: "system:duodenum" },
      { rel: "associated-with", to: "compound:secretin" },
      { rel: "associated-with", to: "compound:motilin" },
      { rel: "associated-with", to: "state:acid-suppression" }
    ]
  },
  {
    id: "claim:h-pylori-urease-ammonia-co2",
    type: "claim",
    name: "H. pylori urease produces ammonia and CO2",
    aliases: ["urease do H. pylori produz amônia e CO2"],
    summary: "Supported: H. pylori urease hydrolyses urea into ammonia and CO2, buffering the bacterium's niche and underpinning the urea breath test.",
    statement: "Helicobacter pylori produces urease, generating ammonia and CO2.",
    source: "conversation",
    status: "supported",
    evidence: "established",
    refs: ["article:kusters-2006-h-pylori-pathogenesis"],
    body: [
      "Urease hydrolyses urea to two ammonia molecules and CO2, neutralising acid around the organism and permitting colonisation of the gastric mucus; the 13C-urea breath test detects the labelled CO2 ([[disease:h-pylori-infection]], [[compound:carbon-dioxide]]).",
      "That the same reaction causes frequent belching is a separate, unsupported claim ([[claim:h-pylori-causes-belching]])."
    ],
    relations: [
      { rel: "associated-with", to: "disease:h-pylori-infection" },
      { rel: "associated-with", to: "compound:carbon-dioxide" },
      { rel: "associated-with", to: "compound:ammonia" }
    ]
  },
  {
    id: "claim:h-pylori-causes-belching",
    type: "claim",
    name: "H. pylori urease is a major cause of frequent belching",
    aliases: ["H. pylori causa arrotos"],
    summary: "Unsupported: no good evidence that H. pylori urease gas causes belching; eradication helps dyspepsia only modestly (number needed to treat about 15).",
    statement: "H. pylori urease generating ammonia and CO2 is one of the biggest causes of frequent belching and poor protein digestion.",
    source: "conversation",
    status: "unsupported",
    evidence: "speculative",
    body: [
      "Meta-analyses of eradication therapy in functional dyspepsia show small benefit for overall symptoms (relative risk about 1.18, NNT about 15), and no analysis I found isolates belching as an outcome. CO2 from urease is small compared with swallowed air and is not documented to distend the stomach ([[disease:functional-dyspepsia]]).",
      "Testing for H. pylori after ulcers is still important for other reasons (recurrence, cancer risk), and the conversation is right to ask whether eradication was confirmed ([[claim:confirm-h-pylori-eradication]])."
    ],
    relations: [
      { rel: "associated-with", to: "disease:h-pylori-infection" },
      { rel: "associated-with", to: "outcome:belching" },
      { rel: "associated-with", to: "disease:functional-dyspepsia" }
    ]
  },
  {
    id: "claim:confirm-h-pylori-eradication",
    type: "claim",
    name: "Confirm H. pylori was truly eradicated after ulcer treatment",
    aliases: ["confirmar a erradicação do H. pylori"],
    summary: "Supported: guidelines recommend a test of cure at least 4 weeks after antibiotics and 2 weeks off PPIs, because eradication failure is common with older regimens.",
    statement: "After ulcers, make sure the H. pylori was truly eradicated.",
    source: "conversation",
    status: "supported",
    evidence: "established",
    refs: ["article:chey-2024-acg-h-pylori-treatment", "article:malfertheiner-2022-maastricht-vi"],
    body: [
      "ACG 2024 asks that everyone treated for H. pylori have a test of cure by urea breath test, stool antigen or biopsy-based test at least four weeks after antibiotics, off PPIs and PCABs for at least two weeks. PPI-clarithromycin triple therapy fails often where resistance is common ([[intervention:h-pylori-eradication-therapy|H. pylori eradication]], [[outcome:h-pylori-test-result]]).",
      "This is guideline advice for ulcer care and does not mean that persistent H. pylori explains belching ([[disease:peptic-ulcer]])."
    ],
    relations: [
      { rel: "associated-with", to: "intervention:h-pylori-eradication-therapy" },
      { rel: "associated-with", to: "disease:peptic-ulcer" },
      { rel: "associated-with", to: "outcome:h-pylori-test-result" }
    ]
  },
  {
    id: "claim:collagen-ii-33-percent-glycine",
    type: "claim",
    name: "Collagen type II is about 33% glycine (Gly-X-Y)",
    aliases: ["colágeno tipo 2 tem 33% de glicina", "colágeno 33% glicina"],
    summary: "Supported with nuance: every third collagen residue is glycine (one third by count, about a fifth to a quarter by mass), so 10 g collagen peptides give around 2-3 g glycine.",
    statement: "Type II collagen has a repetitive Gly-X-Y primary structure in which every third amino acid is glycine, about 33% of its amino-acid composition.",
    source: "conversation",
    status: "supported",
    evidence: "established",
    refs: ["article:shoulders-2009-collagen-structure"],
    body: [
      "The Gly-X-Y repeat is required for triple-helix packing; the fraction is one third by residue count (mole %). Because glycine is a small residue, its mass share is lower, roughly a fifth to a quarter, and a 10 g dose of hydrolysed collagen supplies on the order of 2-3 g of glycine, which a 2018 follow-up paper also notes ([[compound:collagen]], [[compound:glycine]]).",
      "Undenatured type II collagen supplements are taken at about 40 mg/day to engage the gut immune system, not as an amino-acid source ([[disease:osteoarthritis]])."
    ],
    relations: [
      { rel: "associated-with", to: "compound:collagen" },
      { rel: "associated-with", to: "compound:glycine" },
      { rel: "associated-with", to: "outcome:collagen-synthesis-adequacy" },
      { rel: "associated-with", to: "intervention:type-ii-collagen" },
      { rel: "associated-with", to: "compound:collagen-type-ii" }
    ]
  },
  {
    id: "claim:glycine-overload-shifts-bile-conjugation-and-reflux",
    type: "claim",
    name: "Acute glycine load shifts bile conjugation and promotes alkaline duodenogastric reflux",
    aliases: ["glicina altera a conjugação biliar e o refluxo", "razão glicina:taurina da bile", "bile glicoconjugada"],
    summary: "Unsupported: in humans taurine, not glycine, changes the conjugation ratio, and nothing links glycine-conjugated bile to altered surface tension, bile reflux or belching.",
    statement: "An acute glycine overload alters the glycine:taurine conjugation ratio of bile; excessively glyco-conjugated bile alters surface tension and favours irritating alkaline duodenogastric reflux, causing belching.",
    source: "conversation",
    status: "unsupported",
    evidence: "speculative",
    body: [
      "Humans conjugate bile acids with glycine and taurine at roughly 3:1. Sjovall found that taurine (0.5 g three times daily) markedly increased taurine conjugates, whereas glycine (7 g three times daily) did not change the pattern; later work showed that hepatic taurine availability governs the ratio ([[article:sjovall-1959-glycine-taurine-bile-conjugation]], [[pathway:bile-acid-conjugation]]).",
      "Bile reflux into the stomach depends on pyloric and antral function and is not known to depend on conjugate type; the surface-tension argument has no source ([[system:bile]], [[system:pylorus]])."
    ],
    relations: [
      { rel: "associated-with", to: "pathway:bile-acid-conjugation" },
      { rel: "associated-with", to: "compound:bile-acids" },
      { rel: "associated-with", to: "compound:glycine" },
      { rel: "associated-with", to: "system:bile" }
    ]
  },
  {
    id: "claim:shmt-gcs-need-plp",
    type: "claim",
    name: "Glycine metabolism by SHMT and the cleavage system needs PLP",
    aliases: ["SHMT e sistema de clivagem precisam de P5P"],
    summary: "Supported: SHMT and the glycine cleavage system are PLP-dependent and feed one-carbon units into the folate pool; whether B6 shortfall measurably accumulates glycine is less clear.",
    statement: "Glycine-to-serine conversion by SHMT depends on active B6 (PLP), and the glycine cleavage system transfers one carbon to THF, forming 5,10-methylene-THF.",
    source: "conversation",
    status: "supported",
    evidence: "established",
    refs: ["article:parra-2018-vitamin-b6-metabolism"],
    body: [
      "PLP is the coenzyme for [[enzyme:shmt]] and for the P-protein of the glycine cleavage system, and the cleavage system yields CO2, NH3 and 5,10-methylene-THF, feeding the [[pathway:folate-cycle]]. Severe B6 deficiency impairs these steps.",
      "Whether subclinical B6 shortfall in an otherwise healthy person blocks glycine catabolism enough to cause symptoms is not shown, and the further link to 'under-methylation' and pyroluria is unproven ([[claim:undermethylated-have-functional-b6-deficiency]])."
    ],
    relations: [
      { rel: "associated-with", to: "enzyme:shmt" },
      { rel: "associated-with", to: "compound:plp" },
      { rel: "associated-with", to: "pathway:folate-cycle" },
      { rel: "associated-with", to: "compound:glycine" }
    ]
  },
  {
    id: "claim:undermethylated-have-functional-b6-deficiency",
    type: "claim",
    name: "Under-methylation or pyroluria patterns come with functional B6 deficiency",
    aliases: ["submetilados têm deficiência funcional de B6"],
    summary: "Unsupported: no independent data show low PLP or functional B6 shortfall in people labelled under-methylated or with high urinary pyrroles.",
    statement: "People with under-methylation patterns, or with pyroluria/KPU, frequently have functional B6 deficiency, so glycine catabolism is bottlenecked.",
    source: "conversation",
    status: "unsupported",
    evidence: "speculative",
    body: [
      "Plasma PLP and functional markers exist and could test the idea, but no study shows that biotype-labelled groups differ in B6 status. Pyroluria itself is not validated ([[disease:pyroluria-kpu]], [[outcome:low-plp-status]]).",
      "Genuine functional B6 deficiency has recognised causes: inflammation, alcohol, renal disease and certain drugs ([[state:b6-functional-deficiency]])."
    ],
    relations: [
      { rel: "associated-with", to: "state:b6-functional-deficiency" },
      { rel: "associated-with", to: "state:undermethylation" },
      { rel: "associated-with", to: "disease:pyroluria-kpu" }
    ]
  },
  {
    id: "claim:p5p-bypasses-hepatic-activation",
    type: "claim",
    name: "P5P bypasses a hepatic activation bottleneck of conventional B6",
    aliases: ["P5P contorna a ativação hepática da B6"],
    summary: "Partly supported: PLP is dephosphorylated in the gut before absorption and rephosphorylated in tissues, so it offers no clear advantage except in rare defects (e.g. PNPO deficiency).",
    statement: "Conventional B6 (pyridoxine) must pass through the liver to be phosphorylated; using P5P directly bypasses an enzymatic bottleneck and rebalances the glutamate/GABA axis.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    body: [
      "Oral phosphorylated B6 is dephosphorylated by intestinal alkaline phosphatase, absorbed as pyridoxal, and rephosphorylated by pyridoxal kinase inside cells, so the supposed bypass is largely illusory. Pyridoxine itself requires conversion by pyridoxal kinase and PNPO, which can be limiting in rare genetic defects (PNPO deficiency responds to PLP), in severe liver disease or on interacting drugs.",
      "Whether P5P gives better outcomes than pyridoxine in healthy people has not been tested head to head ([[intervention:p5p-supplement|P5P]], [[compound:plp]], [[state:b6-functional-deficiency]])."
    ],
    relations: [
      { rel: "associated-with", to: "intervention:p5p-supplement" },
      { rel: "associated-with", to: "compound:plp" },
      { rel: "associated-with", to: "compound:pyridoxine" },
      { rel: "associated-with", to: "pathway:vitamin-b6-activation" },
      { rel: "associated-with", to: "enzyme:pdxk" }
    ]
  },
  {
    id: "claim:p5p-gad-gaba-relieves-anxiety",
    type: "claim",
    name: "P5P relieved anxiety and brain fog by boosting GAD and GABA",
    aliases: ["P5P alivia ansiedade via GAD e GABA"],
    summary: "Partly supported: GAD needs PLP and B6 may reduce anxiety in small trials, but the causal story for one person's improvement is untested and brain fog has many causes.",
    statement: "P5P is the obligatory coenzyme of GAD, converting excitatory glutamate to GABA, and this resolved the user's anxiety and mental fog.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    body: [
      "The enzymology is correct: [[enzyme:gad]] needs [[compound:plp]] and severe B6 deficiency lowers brain GABA and causes seizures in infants ([[system:brain-gaba-glutamate]]). A randomised trial in healthy young adults reported lower self-rated anxiety after a month of high-dose B6, with measures consistent with raised GABAergic inhibition, but dose, sample and replication limit inference.",
      "Anxiety and brain fog improve spontaneously, with placebo and with many interventions, so attributing one person's response to GAD activity is speculative ([[outcome:anxiety]], [[outcome:brain-fog]]). High-dose B6 also carries a risk of sensory neuropathy."
    ],
    relations: [
      { rel: "associated-with", to: "enzyme:gad" },
      { rel: "associated-with", to: "compound:gaba" },
      { rel: "associated-with", to: "outcome:anxiety" },
      { rel: "associated-with", to: "outcome:brain-fog" }
    ]
  },
  {
    id: "claim:hnmt-needs-sam",
    type: "claim",
    name: "HNMT depends on SAM, so low methylation slows histamine clearance",
    aliases: ["HNMT depende de SAMe"],
    summary: "Partly supported: HNMT is a SAM-dependent enzyme and the main histamine-clearing route in brain; whether normal variation in SAM limits it in vivo is unproven.",
    statement: "Histamine in the brain and vasculature is degraded by HNMT, which depends exclusively on SAM methylation, so low SAM leaves histamine elevated.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    refs: ["article:maintz-2007-histamine-intolerance"],
    body: [
      "HNMT methylates histamine on the imidazole ring using [[compound:sam]]; in the brain it is the only degradation route, while [[enzyme:dao]] handles extracellular histamine mainly in the gut ([[pathway:histamine-degradation]]). The weakness is quantitative: no evidence shows that mild variation in SAM measurably limits HNMT flux in vivo, and HNMT has other determinants (genetics, inhibition by SAH).",
      "Walsh's use of blood histamine as a methylation marker builds on this link but is not validated ([[outcome:blood-histamine-level]], [[claim:walsh-under-over-methylation-categories-valid]])."
    ],
    relations: [
      { rel: "associated-with", to: "enzyme:hnmt" },
      { rel: "associated-with", to: "compound:histamine" },
      { rel: "associated-with", to: "compound:sam" },
      { rel: "associated-with", to: "state:histamine-excess" }
    ]
  },
  {
    id: "claim:histamine-peaks-2-4am",
    type: "claim",
    name: "Physiological histamine release peaks at about 2-4 am",
    aliases: ["pico de histamina às 2-4h da madrugada"],
    summary: "Partly supported: plasma histamine shows a night/early-morning peak in some human data and mast-cell clock studies, but the evidence is mixed and brain histamine is lowest in sleep.",
    statement: "The physiological peak of histamine release occurs in the early hours of the morning, around 2-4 am.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    refs: ["article:nakamura-2017-mast-cell-clock-histamine"],
    body: [
      "Plasma histamine rises in the early morning in some studies of healthy volunteers and asthma, and mouse work shows mast-cell clocks drive circadian plasma histamine. The finding is described as controversial; plasma histamine is cleared in minutes. Central histaminergic neurons, which promote wakefulness, are least active during sleep ([[outcome:blood-histamine-level]], [[state:histamine-excess]]).",
      "Even if plasma histamine peaks at night, whether this causes waking in a particular person is unknown ([[outcome:night-waking]])."
    ],
    relations: [
      { rel: "associated-with", to: "compound:histamine" },
      { rel: "associated-with", to: "outcome:night-waking" },
      { rel: "associated-with", to: "outcome:blood-histamine-level" }
    ]
  },
  {
    id: "claim:choline-fixed-night-waking-via-bhmt-hnmt",
    type: "claim",
    name: "Choline resolved 2-3 am waking via betaine, BHMT, SAM and HNMT",
    aliases: ["colina resolveu o despertar noturno via BHMT e HNMT"],
    summary: "Unsupported: a single self-report with an untested multi-step mechanism; choline effects on SAM, histamine clearance or sleep have not been shown in controlled studies.",
    statement: "Choline converts in the liver to betaine, activating BHMT to remethylate homocysteine; this feeds night-time SAM, degrades histamine, and stopped tachycardia and waking at 2-3 am.",
    source: "conversation",
    status: "unsupported",
    evidence: "speculative",
    body: [
      "The first steps are real biochemistry: choline is oxidised to betaine, and BHMT uses betaine to remethylate homocysteine to methionine ([[pathway:choline-oxidation]], [[enzyme:bhmt]], [[claim:choline-betaine-glycine-route]]). The link from there to higher SAM at night, faster HNMT clearance and fewer awakenings is not demonstrated. Individual improvement may reflect placebo, other changes in routine or other effects of choline.",
      "Alternative causes of night waking with palpitations are many ([[outcome:night-waking]], [[outcome:tachycardia]])."
    ],
    relations: [
      { rel: "associated-with", to: "compound:choline" },
      { rel: "associated-with", to: "enzyme:bhmt" },
      { rel: "associated-with", to: "enzyme:hnmt" },
      { rel: "associated-with", to: "outcome:night-waking" }
    ]
  },
  {
    id: "claim:choline-supplies-nocturnal-vagal-brake",
    type: "claim",
    name: "Choline supplies the substrate for the nocturnal vagal brake on the heart",
    aliases: ["colina abastece o freio vagal noturno"],
    summary: "Unsupported: M2-mediated vagal slowing is established, but there is no evidence that choline intake limits cardiac acetylcholine release in people with adequate intake.",
    statement: "At night the heart needs the parasympathetic brake via M2 receptors on the sinoatrial node activated by acetylcholine; choline provides the immediate substrate for this brake, preventing compensatory adrenergic discharge.",
    source: "conversation",
    status: "unsupported",
    evidence: "speculative",
    body: [
      "Vagal acetylcholine acting on M2 receptors slows the sinoatrial node ([[system:cardiac-autonomic-control]], [[article:gordan-2015-autonomic-cardiovascular-control]]). Choline is the precursor of acetylcholine, but with an adequate diet choline is not rate-limiting for neurotransmitter synthesis, and no study shows that supplementation changes heart-rate variability or night-time heart rate in healthy adults.",
      "Palpitations at night require medical evaluation for arrhythmia and other causes ([[outcome:tachycardia]])."
    ],
    relations: [
      { rel: "associated-with", to: "compound:choline" },
      { rel: "associated-with", to: "compound:acetylcholine" },
      { rel: "associated-with", to: "system:cardiac-autonomic-control" },
      { rel: "associated-with", to: "outcome:tachycardia" }
    ]
  },
  {
    id: "claim:histamine-h1-h2-tachycardia-flushing",
    type: "claim",
    name: "Histamine acting on H1/H2 receptors causes tachycardia, flushing and waking symptoms",
    aliases: ["histamina H1/H2 causa taquicardia e rubor"],
    summary: "Supported: histamine causes vasodilation, flushing, tachycardia and hypotension through H1 and H2 receptors; whether this explains a given person's night symptoms needs evaluation.",
    statement: "Excess histamine triggering H1 and H2 receptors causes tachycardia, flushing and sudden waking.",
    source: "conversation",
    status: "supported",
    evidence: "established",
    refs: ["article:maintz-2007-histamine-intolerance"],
    body: [
      "Systemic histamine causes flushing, headache, hypotension and reflex tachycardia, and these are classic symptoms in histamine-intolerance and mast-cell reactions ([[compound:histamine]], [[outcome:flushing]], [[outcome:tachycardia]]). Antihistamines of both classes antagonise these effects.",
      "The step from receptor pharmacology to 'this is why the user woke at 2-3 am' is not established ([[claim:choline-fixed-night-waking-via-bhmt-hnmt]])."
    ],
    relations: [
      { rel: "associated-with", to: "compound:histamine" },
      { rel: "associated-with", to: "outcome:tachycardia" },
      { rel: "associated-with", to: "outcome:flushing" },
      { rel: "associated-with", to: "disease:histamine-intolerance" }
    ]
  },
  {
    id: "claim:choline-betaine-glycine-route",
    type: "claim",
    name: "Choline is oxidised to betaine, DMG, sarcosine and finally glycine",
    aliases: ["colina vira betaína, DMG, sarcosina e glicina"],
    summary: "Supported: choline is oxidised to betaine, which loses its three methyls via BHMT, DMGDH and SARDH, yielding glycine plus one-carbon units; quantities vary and betaine is also used for methylation.",
    statement: "Choline converts via choline dehydrogenase and BADH to betaine (TMG), then loses methyl groups sequentially (BHMT, DMGDH, SARDH) to dimethylglycine, sarcosine and finally glycine.",
    source: "conversation",
    status: "supported",
    evidence: "established",
    refs: ["article:ueland-2011-choline-betaine"],
    body: [
      "In liver and kidney mitochondria choline dehydrogenase and betaine aldehyde dehydrogenase make [[compound:betaine]]; BHMT removes one methyl to give [[compound:dimethylglycine]]; DMG dehydrogenase and sarcosine dehydrogenase remove the other two as one-carbon units onto folate, leaving [[compound:glycine]] ([[pathway:choline-oxidation]], [[enzyme:bhmt]]).",
      "The route exists, but how much dietary choline ends as glycine is unmeasured in the sources I could verify, and most choline goes to phosphatidylcholine via the Kennedy pathway ([[claim:choline-28-35g-for-10g-glycine]])."
    ],
    relations: [
      { rel: "associated-with", to: "compound:choline" },
      { rel: "associated-with", to: "compound:betaine" },
      { rel: "associated-with", to: "compound:glycine" },
      { rel: "associated-with", to: "pathway:choline-oxidation" }
    ]
  },
  {
    id: "claim:choline-derived-glycine-silent",
    type: "claim",
    name: "Choline-derived glycine causes no gas because it never touches the gut lumen",
    aliases: ["glicina da colina não causa gases", "glicina derivada da colina", "glicina endógena silenciosa"],
    summary: "Partly supported: glycine made inside hepatocytes cannot act on gastric receptors or luminal bacteria, which is logically sound but unmeasured, and the quantities are small.",
    statement: "Glycine derived from choline is born inside hepatocytes, so it never contacts the digestive lumen or fermenting bacteria, which is why choline does not cause gas.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    body: [
      "If glycine's effect on belching arises from luminal contact, intracellularly generated glycine would indeed bypass it ([[system:liver]]). But circulating glycine from absorbed supplements also joins the same body pool, and the luminal mechanisms proposed for glycine powder are themselves unproven ([[claim:free-glycine-stimulates-gastrin]], [[claim:sibo-bacteria-metabolize-glycine-co2-nh3]]).",
      "Also the amount of glycine obtainable from tolerable choline doses is small relative to 10 g ([[claim:choline-28-35g-for-10g-glycine]])."
    ],
    relations: [
      { rel: "associated-with", to: "compound:choline" },
      { rel: "associated-with", to: "compound:glycine" },
      { rel: "associated-with", to: "system:liver" },
      { rel: "associated-with", to: "outcome:glycine-intolerance" }
    ]
  },
  {
    id: "claim:glycine-deficit-10g",
    type: "claim",
    name: "Endogenous glycine synthesis leaves a deficit of about 10 g/day",
    aliases: ["déficit de glicina de 10 g por dia", "10 g de glicina por dia"],
    summary: "Contested: Melendez-Hevia et al. (2009) estimate a shortfall of about 10 g/day for a 70 kg adult, but the figure is model-based and glycine is classed non-essential in mainstream references.",
    statement: "Endogenous synthesis (about 3 g/day) plus an average diet does not meet total glycine demand (collagen, elastin, glutathione), leaving a deficit of about 10 g/day.",
    source: "conversation",
    status: "contested",
    evidence: "plausible",
    refs: ["article:melendez-hevia-2009-glycine-weak-link"],
    body: [
      "The J. Biosci paper argues that serine-derived synthesis (over 85% of glycine, about 3 g/day) is limited by the one-carbon stoichiometry of SHMT, that diet adds 1.5-3 g/day, and that the total falls about 10 g/day short of the modelled demand for a 70 kg person; the authors propose glycine as semi-essential and supplementation ([[state:glycine-insufficiency]], [[outcome:glycine-deficit-estimate]]).",
      "The estimate depends on collagen turnover assumptions, and no randomised study shows that closing the gap improves outcomes in healthy adults. The 2009 paper is widely cited in the supplement literature but has not led to a change in dietary recommendations."
    ],
    relations: [
      { rel: "associated-with", to: "state:glycine-insufficiency" },
      { rel: "associated-with", to: "compound:glycine" },
      { rel: "associated-with", to: "outcome:collagen-synthesis-adequacy" },
      { rel: "associated-with", to: "intervention:glycine-powder" },
      { rel: "associated-with", to: "pathway:glycine-serine-route" }
    ]
  },
  {
    id: "claim:choline-28-35g-for-10g-glycine",
    type: "claim",
    name: "About 28-35 g of choline per day would be needed to make 10 g of glycine",
    aliases: ["28 a 35 g de colina para 10 g de glicina", "colina para 10 g de glicina", "70 a 85 g de bitartarato"],
    summary: "Partly supported: the stoichiometry is right (about 13.9 g choline for 10 g glycine), but the 40-50% conversion factor is unsourced; the practical conclusion that choline cannot fill the gap holds.",
    statement: "Making 10 g glycine requires 13.9 g choline at 1:1; with 40-50% hepatic conversion to betaine/glycine, you would need 28-35 g/day choline (70-85 g of choline bitartrate).",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    body: [
      "10 g glycine is 0.133 mol (molar mass about 75.07 g/mol); choline is about 104.2 g/mol as the cation, so 1:1 conversion needs about 13.9 g. Dividing by 0.4-0.5 gives 28-35 g, and because choline bitartrate is about 41% choline by weight, 68-85 g of salt. The arithmetic is right.",
      "The 40-50% conversion is not referenced, and the fraction of choline oxidised to betaine versus used in phosphatidylcholine or acetylcholine is not given in the sources I could verify. Whatever the true fraction, the conclusion that choline cannot practically cover a 10 g glycine gap, and that intakes of this size far exceed the UL, is sound ([[state:choline-excess]], [[claim:choline-ul-3-5g-iom-efsa]])."
    ],
    relations: [
      { rel: "associated-with", to: "compound:choline" },
      { rel: "associated-with", to: "compound:glycine" },
      { rel: "associated-with", to: "intervention:choline-bitartrate" },
      { rel: "associated-with", to: "state:choline-excess" }
    ]
  },
  {
    id: "claim:choline-ul-3-5g-iom-efsa",
    type: "claim",
    name: "The choline UL is 3.5 g/day (IOM and EFSA)",
    aliases: ["limite superior de colina de 3,5 g", "UL da colina", "limite superior tolerável de colina"],
    summary: "Partly supported: the IOM UL is 3.5 g/day; EFSA (2016) set an adequate intake of 400 mg/day but did not derive a UL, so attributing 3.5 g to EFSA is incorrect.",
    statement: "The Tolerable Upper Intake Level established by the Institute of Medicine and EFSA for adults is 3,500 mg of elemental choline per day.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    refs: ["article:iom-1998-choline-dri", "article:efsa-2016-choline-dri"],
    body: [
      "The IOM took a LOAEL of about 7.5 g/day (hypotension in a small study, supported by fishy odour reports), applied an uncertainty factor of 2 and rounded to 3.5 g/day for adults ([[state:choline-excess]]).",
      "EFSA's 2016 opinion set Adequate Intakes (400 mg/day for adults) and did not establish an upper limit, so the statement is half correct. Secondary sources sometimes misattribute the figure."
    ],
    relations: [
      { rel: "associated-with", to: "state:choline-excess" },
      { rel: "associated-with", to: "compound:choline" },
      { rel: "associated-with", to: "intervention:choline-bitartrate" }
    ]
  },
  {
    id: "claim:above-ul-fishy-odor-and-cholinergic-effects",
    type: "claim",
    name: "Above 3.5 g choline: fishy odour and cholinergic symptoms",
    aliases: ["acima de 3,5 g de colina: odor de peixe"],
    summary: "Partly supported: the IOM lists fishy body odour, sweating, salivation, diarrhoea and hypotension at very high intakes (10-16 g/day), but 'cholinergic crisis' overstates it.",
    statement: "Above 3.5 g of choline per day, gut bacteria convert the excess to TMA causing fish odour, and a cholinergic crisis occurs with profuse sweating, severe cramps, diarrhoea, hypotension and nausea.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    refs: ["article:iom-1998-choline-dri"],
    body: [
      "IOM reports fishy odour, vomiting, salivation, sweating and diarrhoea at 10-16 g/day, hypotension at about 7.5 g/day choline-equivalent, and the UL was set on these ([[outcome:fishy-odor]], [[outcome:cholinergic-excess-symptoms]]). The symptoms are dose-related, and individual thresholds differ; FMO3 variants lower the threshold ([[disease:trimethylaminuria]]).",
      "The words 'cholinergic crisis' and the statement that bacteria 'saturate absorption' are not supported in the sources checked."
    ],
    relations: [
      { rel: "associated-with", to: "outcome:fishy-odor" },
      { rel: "associated-with", to: "outcome:cholinergic-excess-symptoms" },
      { rel: "associated-with", to: "compound:trimethylamine" },
      { rel: "associated-with", to: "state:choline-excess" }
    ]
  },
  {
    id: "claim:above-ul-tmao-endothelial-stress",
    type: "claim",
    name: "TMAO is a strong marker of endothelial stress and atherosclerotic risk",
    aliases: ["TMAO como marcador de estresse endotelial"],
    summary: "Contested: TMAO is associated with cardiovascular events, but kidney function confounds or mediates the association and fish raises TMAO without raising risk, so causality is unresolved.",
    statement: "Excess choline raises TMAO, which is a strong marker of endothelial stress and atherosclerotic cardiovascular risk.",
    source: "conversation",
    status: "contested",
    evidence: "plausible",
    refs: ["article:wang-2011-gut-flora-phosphatidylcholine-cvd"],
    body: [
      "Wang et al. (2011) linked plasma TMAO to cardiovascular events and to a choline/lecithin challenge, and later meta-analyses found higher TMAO associated with more events. Adjusting for renal function weakens the association, TMAO is renally cleared, fish and seafood raise TMAO strongly yet are not associated with ASCVD, and reviews conclude there is no conclusive evidence that TMAO is causal ([[outcome:elevated-tmao]], [[disease:cardiovascular-disease]], [[system:kidney]]).",
      "Choline from egg and meat does raise TMAO, but 'strong marker of endothelial stress' goes beyond the evidence."
    ],
    relations: [
      { rel: "associated-with", to: "compound:tmao" },
      { rel: "associated-with", to: "outcome:elevated-tmao" },
      { rel: "associated-with", to: "disease:cardiovascular-disease" }
    ]
  },
  {
    id: "claim:betaine-anhydrous-not-acidifying",
    type: "claim",
    name: "Anhydrous betaine (TMG) does not acidify the stomach",
    aliases: ["betaína anidra não acidifica"],
    summary: "Supported: betaine anhydrous lacks the hydrochloride of betaine HCl, so it does not deliver acid; it can still cause GI upset in some people.",
    statement: "Anhydrous betaine is the pure molecule without the hydrochloride group; it does not acidify the stomach and will not cause the burning that betaine HCl did.",
    source: "conversation",
    status: "supported",
    evidence: "established",
    refs: ["article:guilliams-2020-betaine-hcl-evidence"],
    body: [
      "[[intervention:betaine-hcl]] provides one HCl per betaine and lowers intragastric pH in PPI-treated volunteers; [[intervention:betaine-anhydrous]] is the neutral zwitterion used pharmaceutically (for homocystinuria) and as a BHMT substrate ([[compound:betaine]]).",
      "Absence of acid does not guarantee tolerance: anhydrous betaine can cause nausea or diarrhoea at higher doses, and nothing in the conversation shows that burning was acid-only."
    ],
    relations: [
      { rel: "associated-with", to: "intervention:betaine-anhydrous" },
      { rel: "associated-with", to: "intervention:betaine-hcl" },
      { rel: "associated-with", to: "compound:betaine" },
      { rel: "associated-with", to: "outcome:heartburn" },
      { rel: "associated-with", to: "enzyme:bhmt" }
    ]
  },
  {
    id: "claim:betaine-hcl-contraindicated-post-ulcer",
    type: "claim",
    name: "Betaine HCl is absolutely contraindicated after an ulcer",
    aliases: ["betaína HCl contraindicada após úlcera"],
    summary: "Partly supported: avoiding acid supplements in active ulcer, gastritis or NSAID use is standard caution, but it rests on mechanism and convention; 'absolute' goes beyond trial evidence.",
    statement: "A recent ulcer history combined with burning after betaine is an absolute contraindication to betaine HCl; the mucosa must be fully intact before any re-acidification.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    refs: ["article:guilliams-2020-betaine-hcl-evidence"],
    body: [
      "Supplement references list peptic ulcer disease, gastritis and NSAID use as contraindications; the rationale is that acid on injured mucosa causes pain and may delay healing. The main review (Guilliams and Drake 2020) notes few well-designed trials of betaine HCl for any condition and none in ulcer patients ([[intervention:betaine-hcl]], [[state:post-ulcer-mucosal-recovery]]).",
      "Burning after a dose in a person with an ulcer history is a reasonable reason to stop and consult a clinician; the term 'absolute' is a convention, not a trial result. There is also no validated test for the 'low acid' that betaine HCl is meant to correct ([[state:hypochlorhydria]])."
    ],
    relations: [
      { rel: "associated-with", to: "intervention:betaine-hcl" },
      { rel: "associated-with", to: "disease:peptic-ulcer" },
      { rel: "associated-with", to: "state:post-ulcer-mucosal-recovery" },
      { rel: "associated-with", to: "outcome:heartburn" }
    ]
  },
  {
    id: "claim:glycine-well-tolerated-in-trials",
    type: "claim",
    name: "Glycine is generally well tolerated in human trials",
    aliases: ["glicina é bem tolerada em estudos"],
    summary: "Supported (literature): 3 g before bed was tolerated in small sleep trials, and schizophrenia studies used 15-60 g/day with mostly mild upper-GI effects; individual intolerance is unquantified.",
    statement: "Oral glycine at 3 g before bedtime and at much higher doses in clinical trials was well tolerated, with mild gastrointestinal complaints in a minority.",
    source: "literature",
    status: "supported",
    evidence: "established",
    refs: ["article:yamadera-2007-glycine-sleep-psg", "article:bannai-2012-glycine-sleep"],
    body: [
      "The sleep studies of Yamadera et al. (2007) and Bannai et al. (2012) used 3 g without notable adverse effects ([[outcome:improved-sleep-quality]]). Schizophrenia trials used 15 g/day to about 0.4 g/kg/day, usually reporting good tolerance with occasional nausea or upper abdominal discomfort that stopped on discontinuation.",
      "This does not exclude personal intolerance such as belching; it just means that glycine powder is not generally associated with this symptom, and that the cause for an individual remains unexplained ([[outcome:glycine-intolerance]], [[intervention:glycine-powder]])."
    ],
    relations: [
      { rel: "associated-with", to: "compound:glycine" },
      { rel: "associated-with", to: "outcome:glycine-intolerance" },
      { rel: "associated-with", to: "outcome:improved-sleep-quality" }
    ]
  },
  {
    id: "claim:zinc-carnosine-ulcer-healing",
    type: "claim",
    name: "Zinc carnosine promotes ulcer healing (PepZin GI as 'gold standard')",
    aliases: ["zinco carnosina cicatriza úlceras"],
    summary: "Partly supported: polaprezinc added to PPIs has trial support in Japan for healing and H. pylori eradication, but evidence is regional, certainty low, and 'gold standard' is marketing language.",
    statement: "Zinc carnosine adheres specifically to ulcerated or inflamed areas of the stomach and duodenum, accelerating re-epithelialisation and stimulating protective mucus; it is the gold standard for post-ulcer regeneration.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    refs: ["article:mahmood-2007-zinc-carnosine-gut-integrity"],
    body: [
      "Polaprezinc (zinc-L-carnosine, 150 mg/day) is approved for gastric ulcer in Japan; randomised trials after endoscopic submucosal dissection show added benefit over PPI alone, and a 2022 meta-analysis of three trials found higher H. pylori eradication when added to triple therapy (OR about 2.7, certainty very low). In humans, zinc carnosine reduced NSAID-induced small-bowel permeability changes ([[intervention:zinc-carnosine]], [[outcome:ulcer-healing]]).",
      "There is no large Western RCT in ordinary peptic ulcer, the adherence-to-ulcer mechanism is mostly preclinical, and it is an adjunct to, not a replacement for, acid suppression and removal of the cause ([[system:mucosal-barrier]])."
    ],
    relations: [
      { rel: "associated-with", to: "intervention:zinc-carnosine" },
      { rel: "associated-with", to: "outcome:ulcer-healing" },
      { rel: "associated-with", to: "disease:peptic-ulcer" }
    ]
  },
  {
    id: "claim:dgl-ulcer-healing",
    type: "claim",
    name: "DGL strengthens the mucus barrier and heals ulcers",
    aliases: ["DGL cicatriza úlceras"],
    summary: "Contested: old controlled trials found no ulcer-healing benefit of DGL over placebo, while uncontrolled reports and animal data were positive; newer evidence concerns reflux symptoms.",
    statement: "Deglycyrrhizinated licorice (DGL) stimulates the gastric mucus barrier without raising blood pressure and helps ulcer regeneration.",
    source: "conversation",
    status: "contested",
    evidence: "speculative",
    body: [
      "A double-blind crossover trial in gastric ulcer found no demonstrable healing effect of DGL over placebo ([[article:engqvist-1973-dgl-gastric-ulcer]]); a systematic review of licorice (not DGL specifically) reported non-significant trends for healing and pain. Positive evidence comes from uncontrolled series, animal work and a controlled study of aspirin-induced blood loss ([[intervention:dgl-licorice]]).",
      "That DGL lacks glycyrrhizin and so does not affect aldosterone or blood pressure is correct, but benefit for ulcers is unproven."
    ],
    relations: [
      { rel: "associated-with", to: "intervention:dgl-licorice" },
      { rel: "associated-with", to: "outcome:ulcer-healing" },
      { rel: "associated-with", to: "system:mucosal-barrier" }
    ]
  },
  {
    id: "claim:throat-burning-means-lpr",
    type: "claim",
    name: "Throat burning without stomach burning is classic LPR",
    aliases: ["queimação na garganta é refluxo laringofaríngeo"],
    summary: "Contested: throat burning has many causes; the AGA says LPR lacks standardised criteria and recommends objective reflux testing instead of assuming reflux or trying empiric PPIs.",
    statement: "Burning in the throat but not the stomach is the classic signature of laryngopharyngeal reflux (silent reflux).",
    source: "conversation",
    status: "contested",
    evidence: "plausible",
    refs: ["article:chen-2023-aga-extraesophageal-reflux"],
    body: [
      "The AGA 2023 update states that LPR has no standardised diagnostic criteria or objective reflux evidence in many labelled patients, that no single test is conclusive, and that PPI response should not be taken as confirmation; empiric PPIs have limited value for isolated throat symptoms and early reflux testing is preferred ([[disease:lpr]], [[outcome:reflux-episodes]]).",
      "Throat burning also follows voice use, allergy, post-nasal drip and irritants, so reflux is one candidate rather than the default ([[outcome:throat-burning]])."
    ],
    relations: [
      { rel: "associated-with", to: "disease:lpr" },
      { rel: "associated-with", to: "outcome:throat-burning" },
      { rel: "associated-with", to: "outcome:reflux-episodes" },
      { rel: "associated-with", to: "outcome:salivary-pepsin" },
      { rel: "associated-with", to: "system:larynx-pharynx" }
    ]
  },
  {
    id: "claim:belch-aerosol-deposits-pepsin",
    type: "claim",
    name: "Belches aerosolise acid and pepsin that adhere to the larynx",
    aliases: ["arrotos depositam pepsina na laringe"],
    summary: "Partly supported: pepsin can be taken up by laryngeal cells, but the belch-as-aerosoliser mechanism and the claim that deposited pepsin explains daytime burning are untested.",
    statement: "Frequent belches act as an aerosoliser, carrying microdroplets of acid and pepsin that adhere to laryngeal and pharyngeal tissue and cause burning, throat clearing and globus.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    refs: ["article:johnston-2006-pepsin-laryngeal-epithelium"],
    body: [
      "Hypopharyngeal epithelial cells endocytose pepsin by receptor-mediated uptake and show damage even at weakly acidic to neutral pH in vitro. Pepsin is detected in the laryngeal tissue and saliva of some patients, but those tests have limited diagnostic accuracy ([[outcome:salivary-pepsin]], [[compound:pepsin]]).",
      "No study shows that belching propels droplets to the larynx, and gas reflux events in impedance studies are a separate topic ([[disease:lpr]], [[outcome:belching]])."
    ],
    relations: [
      { rel: "associated-with", to: "compound:pepsin" },
      { rel: "associated-with", to: "outcome:belching" },
      { rel: "associated-with", to: "system:larynx-pharynx" }
    ]
  },
  {
    id: "claim:larynx-50-100x-more-sensitive",
    type: "claim",
    name: "The throat is 50-100 times more sensitive to acid and enzymes than the stomach",
    aliases: ["garganta é 50 a 100 vezes mais sensível"],
    summary: "Partly supported: laryngeal mucosa is less protected than the oesophagus or stomach, but the '50-100 times' factor has no source.",
    statement: "The throat lining lacks the thick mucus and bicarbonate layers of the stomach and is 50 to 100 times more sensitive to acidity and enzymes.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    body: [
      "Laryngeal epithelium has fewer mucins and lower carbonic anhydrase III expression than oesophageal mucosa, and pepsin can injure hypopharyngeal cells ([[system:larynx-pharynx]], [[article:johnston-2006-pepsin-laryngeal-epithelium]]). The stomach's mucus-bicarbonate barrier is far more protective ([[system:mucosal-barrier]]).",
      "The multiplier appears widely in lay and ENT literature but I could not trace it to measured data."
    ],
    relations: [
      { rel: "associated-with", to: "system:larynx-pharynx" },
      { rel: "associated-with", to: "system:mucosal-barrier" },
      { rel: "associated-with", to: "disease:lpr" },
      { rel: "associated-with", to: "outcome:throat-burning" },
      { rel: "associated-with", to: "compound:pepsin" }
    ]
  },
  {
    id: "claim:alginate-rafts-reduce-lpr",
    type: "claim",
    name: "Alginate rafts reduce laryngopharyngeal reflux without blocking acid",
    aliases: ["alginato reduz o refluxo laringofaríngeo"],
    summary: "Partly supported: alginate beat placebo/antacids in GERD meta-analysis (OR 4.4) and was non-inferior to PPIs in an LPR RCT, but LPR trials are small and placebo effects are uncertain.",
    statement: "Sodium alginate forms a floating gel raft on top of the stomach, mechanically blocking acid, pepsin and gas reflux to the larynx without inhibiting HCl production.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    refs: ["article:pizzorni-2022-alginate-vs-ppi-lpr", "article:leiman-2017-alginate-meta-analysis"],
    body: [
      "A 2017 meta-analysis of GERD trials found higher odds of symptom resolution with alginate-based therapy than with placebo or antacids (OR 4.42). In LPR, a randomised non-inferiority trial found magnesium alginate comparable to PPIs on reflux findings, and systematic reviews (2025) judge alginates promising as monotherapy or add-on, noting small, heterogeneous studies and limited proof beyond placebo ([[intervention:sodium-alginate|alginate]], [[disease:lpr]], [[disease:gerd]]).",
      "Alginate does not suppress acid secretion, which is correct; it works as a physical barrier displacing the acid pocket. Whether it reduces belch-borne pepsin is unstudied."
    ],
    relations: [
      { rel: "associated-with", to: "intervention:sodium-alginate" },
      { rel: "associated-with", to: "disease:lpr" },
      { rel: "associated-with", to: "disease:gerd" },
      { rel: "associated-with", to: "outcome:throat-burning" },
      { rel: "associated-with", to: "compound:alginate" }
    ]
  },
  {
    id: "claim:alkaline-water-inactivates-pepsin",
    type: "claim",
    name: "Gargling with slightly alkaline (bicarbonate) water inactivates pepsin",
    aliases: ["água alcalina inativa a pepsina"],
    summary: "Partly supported: pH 8.8 water irreversibly denatured human pepsin in vitro, but there are no clinical trials, and intracellular pepsin is out of reach.",
    statement: "Rinsing the throat with slightly alkaline water, for example with a pinch of bicarbonate, deactivates pepsin deposited in the throat without altering stomach acid.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    refs: ["article:koufman-2012-alkaline-water-pepsin"],
    body: [
      "Koufman and Johnston (2012) showed in the laboratory that pH 8.8 alkaline water irreversibly inactivated human pepsin and had far greater acid-buffering capacity than ordinary water; pepsin is irreversibly inactivated around pH 8. The study was in vitro, not a patient trial ([[compound:pepsin]], [[disease:lpr]]).",
      "Pepsin taken up inside epithelial cells is not accessible to a rinse, and clinical benefit of alkaline gargles has not been shown."
    ],
    relations: [
      { rel: "associated-with", to: "compound:pepsin" },
      { rel: "associated-with", to: "compound:bicarbonate" },
      { rel: "associated-with", to: "disease:lpr" },
      { rel: "associated-with", to: "outcome:throat-burning" },
      { rel: "associated-with", to: "intervention:bicarbonate-rinse" }
    ]
  },
  {
    id: "claim:ginger-prokinetic-5ht4-mmc",
    type: "claim",
    name: "Standardised ginger acts as a prokinetic via 5-HT4 receptors and the MMC",
    aliases: ["gengibre é procinético via 5-HT4 e CMM"],
    summary: "Partly supported: ginger sped gastric emptying in some small trials, but evidence for the 5-HT4 route is lacking (5-HT3 antagonism is documented) and symptom benefit is uncertain.",
    statement: "Standardised ginger extract (gingerols and shogaols) stimulates gastric 5-HT4 receptors and the migrating motor complex, clearing duodenal residue and preventing bacterial fermentation.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    refs: ["article:wu-2008-ginger-gastric-emptying", "article:hu-2011-ginger-functional-dyspepsia-motility", "article:walstab-2013-ginger-5ht3"],
    body: [
      "Wu et al. (2008) found ginger accelerated gastric emptying and antral contractions in healthy volunteers; Hu et al. (2011) found faster emptying in 11 functional dyspepsia patients without symptom change. Receptor work shows ginger extract and its pungent constituents inhibit human 5-HT3 receptors, so the stated 5-HT4 mechanism is unsupported ([[intervention:ginger-extract]], [[disease:functional-dyspepsia]]).",
      "No study shows that ginger prevents proximal bacterial fermentation by cleaning the duodenum."
    ],
    relations: [
      { rel: "associated-with", to: "intervention:ginger-extract" },
      { rel: "associated-with", to: "outcome:delayed-gastric-emptying" },
      { rel: "associated-with", to: "system:enteric-nervous-system" }
    ]
  },
  {
    id: "claim:pyroluria-causes-b6-zinc-deficiency",
    type: "claim",
    name: "Pyroluria (KPU) causes functional B6 and zinc deficiency",
    aliases: ["pirolúria causa deficiência de B6 e zinco"],
    summary: "Contested: HPL assays are non-specific and subject to interference; a systematic review found no placebo-controlled treatment trials and no proof that HPL increases B6 or zinc loss.",
    statement: "Conditions such as pyroluria/KPU frequently have functional B6 deficiency, with urinary pyrroles binding B6 and zinc.",
    source: "conversation",
    status: "contested",
    evidence: "speculative",
    body: [
      "The 'mauve factor' was misidentified at first; the compound is now said to be hydroxyhemopyrrolin-2-one (HPL), and proponents argue it binds B6 and zinc. Independent reviews found only a few studies with higher HPL in psychiatric groups, no controlled treatment trials, assay interference by urobilinogen and no evidence that HPL raises B6 or zinc excretion ([[disease:pyroluria-kpu]], [[outcome:urinary-hpl]]).",
      "Mainstream laboratories do not recognise the test or diagnosis. B6 and zinc status can be assessed directly ([[outcome:low-plp-status]])."
    ],
    relations: [
      { rel: "associated-with", to: "disease:pyroluria-kpu" },
      { rel: "associated-with", to: "state:b6-functional-deficiency" },
      { rel: "associated-with", to: "outcome:urinary-hpl" }
    ]
  },
  {
    id: "claim:homocysteine-lowering-reduces-cardiovascular-events",
    type: "claim",
    name: "Lowering homocysteine with B vitamins prevents cardiovascular events",
    aliases: ["reduzir a homocisteína previne eventos cardiovasculares"],
    summary: "Partly supported (literature): the 2017 Cochrane review of 15 trials found no effect on myocardial infarction or death and only a small reduction in stroke.",
    statement: "Reducing homocysteine with folate, B6 and B12 reduces cardiovascular events.",
    source: "literature",
    status: "partly-supported",
    evidence: "plausible",
    refs: ["article:marti-carvajal-2017-homocysteine-lowering-cochrane"],
    body: [
      "The Cochrane review (15 randomised trials, 71,422 participants) found no difference versus placebo for myocardial infarction (RR 1.02) or all-cause death, and a small reduction in stroke (RR 0.90, 95% CI 0.82-0.99) ([[state:hyperhomocysteinemia]], [[disease:cardiovascular-disease]]).",
      "So homocysteine is a risk marker rather than a proven treatment target; this counterweights narratives that treat elevated homocysteine as the cause of disease."
    ],
    relations: [
      { rel: "associated-with", to: "state:hyperhomocysteinemia" },
      { rel: "associated-with", to: "disease:cardiovascular-disease" },
      { rel: "associated-with", to: "outcome:elevated-homocysteine" },
      { rel: "associated-with", to: "intervention:homocysteine-mma-testing" },
      { rel: "associated-with", to: "compound:homocysteine" }
    ]
  },
  {
    id: "claim:alpha-gpc-pc-absorbed-without-acid",
    type: "claim",
    name: "Alpha-GPC and phosphatidylcholine are absorbed without stomach acid and do not irritate the mucosa",
    aliases: ["alfa-GPC não depende do ácido gástrico"],
    summary: "Partly supported: phosphatidylcholine is digested by pancreatic and mucosal enzymes, not acid; alpha-GPC absorption and mucosal tolerance are not covered by the sources used.",
    statement: "Forms such as alpha-GPC or liquid phosphatidylcholine do not harm the mucosa and do not depend on stomach acid for absorption.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    body: [
      "Dietary phosphatidylcholine is hydrolysed in the small intestine by pancreatic phospholipase A2 and by mucosal enzymes, a process that does not need gastric acid ([[article:nilsson-2019-choline-phospholipid-digestion]]). That supports the acid-independence of phospholipid choline ([[intervention:phosphatidylcholine-supplement]]).",
      "The sources used here do not cover alpha-GPC specifically or mucosal tolerance, so those parts remain assumptions. Choline from phospholipid was absorbed better than choline bitartrate in one small crossover trial ([[article:smolders-2019-choline-bitartrate-absorption]], [[intervention:alpha-gpc-supplement]], [[intervention:choline-bitartrate]])."
    ],
    relations: [
      { rel: "associated-with", to: "intervention:alpha-gpc-supplement" },
      { rel: "associated-with", to: "intervention:phosphatidylcholine-supplement" },
      { rel: "associated-with", to: "compound:glycerophosphocholine" }
    ],
    refs: [
      "article:nilsson-2019-choline-phospholipid-digestion",
      "article:smolders-2019-choline-bitartrate-absorption"
    ]
  },
  {
    id: "claim:glutamine-fuels-enterocytes-and-repairs-epithelium",
    type: "claim",
    name: "L-glutamine fuels enterocytes and regenerates the duodenal epithelium",
    aliases: ["glutamina regenera o epitélio duodenal", "glutamina e enterócitos"],
    summary: "Partly supported: glutamine is a key nutrient for intestinal cells, but whether supplements regenerate the gastroduodenal lining is unproven and reviews call the benefit equivocal.",
    statement: "L-glutamine, at low to moderate doses, is the primary fuel for enterocytes and drives regeneration of the duodenal epithelium.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    body: [
      "Glutamine is a major nutrient of the intestinal mucosa and its importance has long been accepted, but a review concluded that the mechanisms are obscure, that oxidative fuel use does not explain its role convincingly, and that benefit from supplementation is equivocal ([[article:reeds-2001-glutamine-and-the-bowel]]).",
      "Human evidence in peptic ulcer healing is old and inadequate. Glutamine can also cause bloating or gas in some people ([[intervention:l-glutamine-supplement]], [[compound:glutamine]], [[disease:peptic-ulcer]])."
    ],
    relations: [
      { rel: "associated-with", to: "compound:glutamine" },
      { rel: "associated-with", to: "intervention:l-glutamine-supplement" },
      { rel: "associated-with", to: "system:duodenum" },
      { rel: "associated-with", to: "system:mucosal-barrier" },
      { rel: "associated-with", to: "outcome:ulcer-healing" }
    ],
    refs: ["article:reeds-2001-glutamine-and-the-bowel"]
  },
  {
    id: "claim:artichoke-stimulates-bile-flow-and-emptying",
    type: "claim",
    name: "Artichoke leaf extract gently stimulates bile flow and duodenal emptying and prevents digestive stasis",
    aliases: ["alcachofra estimula a bile"],
    summary: "Partly supported: artichoke extract is reported to be choleretic and eased dyspepsia in one RCT, but evidence for faster duodenal emptying or prevention of stasis is lacking.",
    statement: "Artichoke leaf extract (cynarin) stimulates gentle bile flow, duodenal emptying and lipid digestion, preventing the digestive stasis experienced with PPIs.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    body: [
      "A narrative review reports choleretic and bile-enhancing effects from experimental and clinical studies but calls the research not yet conclusive ([[article:ben-salem-2015-artichoke-pharmacology]]). One randomised trial found better functional-dyspepsia symptom scores than placebo over six weeks ([[article:holtmann-2003-artichoke-leaf-functional-dyspepsia]]); whether this works through bile flow was not tested.",
      "No study shows that artichoke speeds duodenal emptying or prevents the stasis that follows acid suppression. It is contraindicated in bile-duct obstruction and in gallstones with colic risk ([[intervention:artichoke-leaf-extract]], [[compound:cynarin]], [[system:bile]])."
    ],
    relations: [
      { rel: "associated-with", to: "intervention:artichoke-leaf-extract" },
      { rel: "associated-with", to: "compound:cynarin" },
      { rel: "associated-with", to: "system:duodenum" }
    ],
    refs: [
      "article:ben-salem-2015-artichoke-pharmacology",
      "article:holtmann-2003-artichoke-leaf-functional-dyspepsia"
    ]
  },
  {
    id: "claim:dgl-no-effect-on-aldosterone-bp",
    type: "claim",
    name: "DGL does not change aldosterone or blood pressure because it has no glycyrrhizin",
    aliases: ["DGL não altera a pressão arterial"],
    summary: "Partly supported: DGL has most glycyrrhizin removed (about 1-3 % or less remains), so blood-pressure effects are unlikely at usual doses but not excluded for every product.",
    statement: "Chewed before meals, DGL increases mucosal microcirculation and the mucus layer without containing glycyrrhizin, so it does not alter aldosterone or blood pressure.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    body: [
      "The safety rationale is sound in outline: the pressure-raising and potassium-lowering effects of licorice are caused by glycyrrhizin, and DGL is made by removing most of it ([[compound:glycyrrhizin]], [[article:isbrucker-2006-licorice-glycyrrhizin-safety]]). \"Contains no glycyrrhizin\" is not strictly true; labelled residues are typically 1-3 % or less and vary by product.",
      "People with hypertension, heart failure, kidney disease or low potassium, or taking digoxin or diuretics, should check the label and the residual content. The claim about improved microcirculation is separate and unsupported ([[intervention:dgl-licorice]], [[claim:dgl-ulcer-healing]])."
    ],
    relations: [
      { rel: "associated-with", to: "intervention:dgl-licorice" },
      { rel: "associated-with", to: "compound:glycyrrhizin" },
      { rel: "associated-with", to: "claim:dgl-ulcer-healing" },
      { rel: "associated-with", to: "system:mucosal-barrier" },
      { rel: "associated-with", to: "compound:gastric-mucus" }
    ],
    refs: ["article:isbrucker-2006-licorice-glycyrrhizin-safety"]
  },
  {
    id: "claim:glycine-powder-low-dose-belching-reports",
    type: "claim",
    name: "Glycine powder caused belching even at 2-3 g and after breaks, and others report the same",
    aliases: ["relatos de arrotos com glicina em pó"],
    summary: "Unsupported as a general finding: persistence at 2-3 g and similar reports by others are personal accounts; controlled trials of glycine mostly report good tolerability.",
    statement: "Several brands of glycine powder caused belching rather than flatulence, starting at 10 g and persisting at 2-3 g after breaks; other people reported similar cases.",
    source: "conversation",
    status: "unsupported",
    evidence: "conversation-only",
    body: [
      "This is the starting observation of the source conversation: gas as belching, not flatulence, with several brands, also with type II collagen powder, and not resolved by lowering the dose or pausing. Anecdotes are legitimate starting points but cannot establish how common the reaction is or what causes it.",
      "Trial reports describe glycine around 3 g at bedtime as well tolerated, with gastrointestinal complaints at larger doses ([[claim:glycine-well-tolerated-in-trials]]). The mechanisms offered for belching are separate claims, and none is demonstrated ([[outcome:glycine-intolerance]], [[intervention:glycine-powder]], [[intervention:type-ii-collagen]], [[outcome:belching]])."
    ],
    relations: [
      { rel: "associated-with", to: "outcome:glycine-intolerance" },
      { rel: "associated-with", to: "intervention:glycine-powder" },
      {
        rel: "associated-with",
        to: "claim:glycine-well-tolerated-in-trials",
        note: "Trial tolerability data pull the other way on how common it is."
      },
      { rel: "associated-with", to: "intervention:type-ii-collagen" },
      { rel: "associated-with", to: "pathway:gut-bacterial-glycine-fates" },
      { rel: "associated-with", to: "outcome:belching" }
    ]
  },
  {
    id: "claim:glycine-with-meals-reduces-gastric-irritation",
    type: "claim",
    name: "Taking glycine diluted in solid meals rather than fasting reduces irritation of the stomach",
    aliases: ["glicina com refeições sólidas"],
    summary: "Unsupported: no study compares glycine taken with food against glycine in water for belching or stomach irritation; slower delivery is plausible but untested.",
    statement: "Glycine should be tested again only after the mucosa has healed, preferably diluted in solid meals and never fasting with water, to reduce direct osmotic contact with the stomach wall.",
    source: "conversation",
    status: "unsupported",
    evidence: "speculative",
    body: [
      "The reasoning is mechanistic: a concentrated solution drunk on an empty stomach reaches the wall and the duodenum quickly, while food dilutes it and slows gastric emptying. No trial compared the two for belching, bloating or irritation, so the claim is recorded as unsupported.",
      "Related ideas on this site: [[intervention:amino-acids-with-meals]], [[intervention:glycine-powder]], [[intervention:phased-reintroduction-protocol]], [[outcome:glycine-intolerance]]. Educational only."
    ],
    relations: [
      { rel: "associated-with", to: "intervention:amino-acids-with-meals" },
      { rel: "associated-with", to: "intervention:glycine-powder" },
      { rel: "associated-with", to: "outcome:belching" },
      { rel: "associated-with", to: "outcome:glycine-intolerance" },
      { rel: "associated-with", to: "compound:glycine" }
    ]
  },
  {
    id: "claim:choline-400-1000-mg-supportive-range",
    type: "claim",
    name: "Choline should be kept at 400-1,000 mg per day for brain protection and methylation support",
    aliases: ["colina 400 a 1000 mg por dia"],
    summary: "Partly supported: 400-550 mg/day is the adequate intake and 3.5 g/day the US upper limit, so 400-1,000 mg is a safe-range figure; a specific neuroprotective or methylation benefit is not established.",
    statement: "Choline should be kept in a neuroprotective and methylation-supporting range of 400 to 1,000 mg of elemental choline per day.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    body: [
      "The adequate intake is 550 mg/day for men and 425 mg/day for women in the US (IOM 1998) and 400 mg/day in the EU (EFSA 2016); the IOM upper limit is 3.5 g/day. A figure between 400 and 1,000 mg therefore sits within recommended intakes and well below the limit ([[article:iom-1998-choline-dri]], [[article:efsa-2016-choline-dri]], [[state:choline-excess]]).",
      "What the evidence does not show is a specific neuroprotective or methylation benefit above adequate intake. Choline is needed for membranes, acetylcholine and the betaine route ([[article:blusztajn-2017-choline-brain]], [[compound:choline]]). The range is a statement about safety margins, not a treatment recommendation."
    ],
    relations: [
      { rel: "associated-with", to: "compound:choline" },
      { rel: "associated-with", to: "state:choline-excess" },
      { rel: "associated-with", to: "intervention:dietary-choline-sources" },
      { rel: "associated-with", to: "compound:betaine" }
    ],
    refs: ["article:iom-1998-choline-dri", "article:efsa-2016-choline-dri", "article:blusztajn-2017-choline-brain"]
  },
  {
    id: "claim:magnesium-threonate-brain-selective-gaba",
    type: "claim",
    name: "Magnesium threonate uniquely reaches the brain and boosts GABA-ergic calm",
    aliases: ["treonato de magnésio e barreira hematoencefálica"],
    summary: "Overstated: magnesium threonate raised brain magnesium in rats, but exclusive blood-brain-barrier access and added GABA-ergic benefit in humans are not shown.",
    statement: "Magnesium threonate has exclusive tropism for the blood-brain barrier and potentiates the GABA-ergic effect already unlocked by P5P.",
    source: "conversation",
    status: "partly-supported",
    evidence: "speculative",
    body: [
      "A rat study found that magnesium L-threonate raised brain magnesium and synaptic density more than other magnesium salts in that model ([[article:slutsky-2010-magnesium-threonate]]), which is the root of the brain-delivery claim. \"Exclusive\" is overstated, because other magnesium salts also raise cerebrospinal-fluid magnesium modestly, and the elemental magnesium in a typical dose is small ([[intervention:magnesium-l-threonate]]).",
      "No study tests whether threonate adds a GABA-ergic effect on top of P5P in humans. Magnesium is, however, a genuine cofactor of methionine adenosyltransferase, the enzyme that makes SAM ([[enzyme:mat]], [[compound:magnesium]], [[intervention:p5p-supplement]])."
    ],
    relations: [
      { rel: "associated-with", to: "intervention:magnesium-l-threonate" },
      { rel: "associated-with", to: "system:brain-gaba-glutamate" },
      { rel: "associated-with", to: "compound:gaba" }
    ],
    refs: ["article:slutsky-2010-magnesium-threonate"]
  },
  {
    id: "claim:oregano-phenols-burn-inflamed-mucosa",
    type: "claim",
    name: "Oregano oil burned because inflamed throat or oesophagus cannot tolerate carvacrol and thymol",
    aliases: ["óleo de orégano arde em mucosa inflamada"],
    summary: "Partly supported: carvacrol and thymol activate pungent TRP channels, so burning on inflamed mucosa is plausible, but it has not been tested in people with reflux.",
    statement: "Oregano oil burned because tissue affected by laryngopharyngeal reflux or oesophagitis does not tolerate strong volatile phenols such as carvacrol and thymol.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    body: [
      "Carvacrol and thymol activate warmth- and pungency-sensing TRP channels (TRPV3 and TRPA1), which explains the stinging taste and the burning of undiluted oil on skin and mucosa ([[article:xu-2006-carvacrol-thymol-trp-channels]]). Inflamed epithelium has more exposed sensory endings, so a stronger sensation is expected, but this inference has not been tested in reflux patients.",
      "Other causes of burning with a capsule (swallowing the oil directly, an enteric coating dissolving early, pre-existing oesophagitis) cannot be separated from the phenol effect. See [[compound:carvacrol]], [[compound:thymol]], [[intervention:oregano-oil]], [[disease:lpr]] and [[disease:esophagitis]]."
    ],
    relations: [
      { rel: "associated-with", to: "intervention:oregano-oil" },
      { rel: "associated-with", to: "outcome:throat-burning" },
      { rel: "associated-with", to: "compound:thymol" }
    ],
    refs: ["article:xu-2006-carvacrol-thymol-trp-channels"]
  },
  {
    id: "claim:beta-alanine-carnosine-tissue-protection",
    type: "claim",
    name: "Beta-alanine builds carnosine, an antioxidant that protects tissue during recovery",
    aliases: ["beta-alanina e carnosina antioxidante"],
    summary: "Partly supported: carnosine is a water-soluble antioxidant and beta-alanine limits its synthesis, but no study shows that beta-alanine speeds recovery of the gut lining or other injured tissue.",
    statement: "Beta-alanine combines with tissue histidine to form carnosine, a potent water-soluble antioxidant that protects against free radicals and reactive nitrogen species during tissue recovery.",
    source: "conversation",
    status: "partly-supported",
    evidence: "plausible",
    body: [
      "Both halves of the chemistry are established: beta-alanine and histidine are joined by [[enzyme:carns1]] ([[reaction:carns1-carnosine-synthesis]]), and carnosine buffers pH, chelates metals and scavenges reactive species in test systems ([[article:boldyrev-2013-carnosine-physiology]]). Supplemental beta-alanine raises muscle carnosine ([[article:trexler-2015-issn-beta-alanine]]).",
      "What is missing is any trial showing faster healing of the gut lining or other injured tissue from beta-alanine itself; the physiological review calls for far more work. The conversation used the idea to explain why beta-alanine \"helped\" during recovery; that benefit is an individual impression, not evidence ([[intervention:beta-alanine-supplement]], [[compound:carnosine]])."
    ],
    relations: [
      { rel: "associated-with", to: "compound:carnosine" },
      { rel: "associated-with", to: "intervention:beta-alanine-supplement" },
      { rel: "associated-with", to: "compound:histidine" }
    ],
    refs: [
      "article:boldyrev-2013-carnosine-physiology",
      "article:trexler-2015-issn-beta-alanine",
      "article:drozak-2010-carnosine-synthase-atpgd1"
    ]
  },
  {
    id: "claim:espinheira-santa-prostaglandin-mucus",
    type: "claim",
    name: "Espinheira-santa heals ulcers by prostaglandin-driven mucus without paralysing the gut",
    aliases: ["espinheira santa estimula muco e prostaglandinas"],
    summary: "Contested: extracts protect rodent stomachs, but the best-cited study found the effect came from lowering acid and nitric oxide, not from more mucus; human ulcer trials are lacking.",
    statement: "Espinheira-santa (Maytenus ilicifolia), rich in tannins and flavonoids, stimulates mucus and bicarbonate secretion through prostaglandins and closes ulcers without paralysing gastric peristalsis the way PPIs do.",
    source: "conversation",
    status: "contested",
    evidence: "speculative",
    body: [
      "In rodents, flavonoid-rich extracts of Maytenus ilicifolia protect the stomach against induced lesions. The cited mechanism study, however, found that protection came from lowering acid secretion (inhibition of H+/K+-ATPase) and nitric oxide formation, not from an increase in mucus ([[article:baggio-2007-maytenus-ilicifolia-gastroprotection]], [[pathway:gastric-acid-secretion]]). That cuts against the \"prostaglandin and mucus without affecting acid\" description.",
      "No head-to-head human data compare it with PPIs, so the contrast about peristalsis is undocumented. The statement is recorded as contested rather than refuted: animal gastroprotection is real, the proposed mechanism is not supported, and human evidence is thin ([[intervention:espinheira-santa]], [[compound:prostaglandin-e2]])."
    ],
    relations: [
      { rel: "associated-with", to: "intervention:espinheira-santa" },
      { rel: "associated-with", to: "compound:prostaglandin-e2" },
      { rel: "associated-with", to: "compound:gastric-mucus" },
      { rel: "associated-with", to: "outcome:ulcer-healing" }
    ]
  }
];
