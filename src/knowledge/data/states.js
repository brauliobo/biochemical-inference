// States: physiological and metabolic states in the methylation / upper-GI ontology.
// Educational content only; nothing here is a diagnosis or medical advice.
export default [
  {
    id: "state:undermethylation",
    type: "state",
    name: "Under-methylation",
    aliases: ["Submetilação", "Hipometilação", "Low methylation capacity", "Undermethylation (Walsh biotype)", "Histadelia (Pfeiffer term)", "submetilado", "submetilados", "pessoa submetilada"],
    summary: "Reduced methylation capacity (low SAM or SAM:SAH). Biochemically measurable; as a clinical diagnosis ('undermethylator' biotype) it is contested and not mainstream.",
    body: [
      "In plain words: methylation means attaching a small chemical tag, a methyl group (CH3), to other molecules. Cells use it to build membranes, make creatine, switch genes on and off and clear histamine and neurotransmitters. The tags are carried by one molecule, SAMe, which has to be kept topped up from food (methionine, choline, betaine, folate, B12). \"Under-methylation\" is a name for a shortage in that supply. As a biochemical idea it can be measured; as a diagnosis of a \"type\" of person it is contested. It matters for the source conversation because glycine is said to spend methyl groups through the enzyme GNMT, so a person short of methyl might react badly to glycine powder. That link is a hypothesis, not a finding. This page explains the term, the methyl budget, what can be measured, and how it connects to the other topics.",
      "The word 'under-methylation' is used in two quite different ways. In biochemistry it means a lowered capacity to transfer methyl groups: a low [[compound:sam]] supply, a low [[compound:sam]]:[[compound:sah]] ratio (the so-called methylation index), impaired remethylation of [[compound:homocysteine]], or reduced DNA/protein methylation. These are measurable quantities. In the Pfeiffer/Walsh nutrient-therapy tradition it is also a 'biotype' of patients (said to be identified mainly by high whole-blood histamine and a low SAM:SAH ratio) who are linked to anxiety, OCD-type traits, depression and seasonal allergy, and treated with SAMe, methionine and other agents. That second usage is contested: the evidence is largely the proponents' own patient database and clinical observation, there are no validated diagnostic criteria, no randomized trials of the biotype-directed approach, and whole-blood histamine is non-specific (it depends on basophil count). Mainstream guidelines do not recognise it. Everything below is educational, not a diagnosis.",
      "Mechanism: the body runs a 'methyl budget'. Methyl groups enter as dietary methionine (activated to SAM by MAT, which needs magnesium) or are recycled by remethylating homocysteine through methionine synthase ([[compound:5-mthf|5-methyl-THF]] plus vitamin B12, see [[pathway:folate-cycle]]) or through [[enzyme:bhmt]] using [[compound:betaine]] made from [[compound:choline]] (see [[pathway:methionine-cycle]]). They are spent by dozens of SAM-dependent methyltransferases. Quantitatively the big sinks are [[enzyme:pemt]] (three SAM per phosphatidylcholine) and creatine synthesis (GAMT), which together account for most SAM-derived methyl use in humans (see [[state:methyl-donor-depletion]]); [[enzyme:gnmt]] acts as a regulated 'valve' using [[compound:glycine]] to dump surplus methyl as sarcosine; NNMT methylates nicotinamide/[[compound:niacin]] metabolites. Every transfer yields [[compound:sah]], which inhibits methyltransferases, so the ratio, not SAM alone, matters. B6, B12, folate, riboflavin (for [[enzyme:mthfr]]), choline and betaine are all supply-side dependencies; a B12 shortfall can trap folate as 5-methyl-THF ([[state:folate-trap]]).",
      "Reported manifestations in the Walsh literature include anxiety, obsessive or perfectionist traits, low histamine-clearance symptoms (flushing, allergy-like complaints, night waking), and a tendency to respond to SAMe, methionine, calcium/magnesium and B6, and to react badly to folic acid or niacin. These are associations from clinic series, not proven causal links. Better-documented correlates of a poor methylation supply are raised homocysteine ([[state:hyperhomocysteinemia]]), a lowered SAM:SAH ratio ([[outcome:low-sam-sah-ratio]]), and, in severe genetic disorders, neurological and vascular disease. The proposed chain in the source conversation, where glycine drains scarce methyl groups through GNMT, lowers PEMT-derived choline and acetylcholine, and so slows gastric emptying, is mechanistically imaginable but unproven; see [[claim:glycine-gnmt-depletes-sam-in-undermethylated]] and [[claim:undermethylation-causes-subclinical-vagal-dysfunction]].",
      "How it is (not) measured: plasma or blood SAM and SAH can be quantified by LC-MS/MS, but they are unstable and sensitive to sampling, and their relation to tissue methylation is imperfect. Total homocysteine ([[outcome:elevated-homocysteine]]) is the best-validated functional marker but is also raised by renal impairment, B12/folate/B6 deficiency, hypothyroidism, drugs and age. Global or locus-specific DNA methylation ([[outcome:global-dna-methylation]]) is tissue- and assay-specific and not a clinical test. Whole-blood histamine ([[outcome:blood-histamine-level]]) and genotyping such as the common MTHFR C677T variant do not establish 'undermethylation'. Differential diagnosis of the complaints attributed to it includes B12 or folate deficiency (pernicious anaemia, atrophic gastritis, metformin or PPI use), hypothyroidism, kidney disease, primary anxiety or mood disorders, histamine intolerance ([[disease:histamine-intolerance]]) and, for gut symptoms, functional dyspepsia or reflux disease.",
      "Interventions in context: correcting a demonstrated deficiency of folate, B12, B6, riboflavin, choline or betaine restores the supply side. SAMe, methyl-donor combinations and methyl-consuming compounds such as niacin should be personalised by a clinician, because the net effect depends on the underlying state; the idea that methyl donors help in one 'biotype' and harm in another is the contested part of the Walsh model ([[claim:walsh-under-over-methylation-categories-valid]]). See also [[state:overmethylation]] for the opposite pole."
    ],
    evidence: "plausible",
    facts: {
      mesh: "No dedicated MeSH heading for the clinical 'biotype'",
      "clinical-status": "Biochemical sense measurable; Walsh 'biotype' sense not validated or guideline-endorsed"
    },
    relations: [
      { rel: "decreases", to: "compound:sam", note: "Defining feature in the biochemical sense: reduced SAM availability or SAM:SAH." },
      { rel: "increases", to: "compound:homocysteine", note: "Impaired remethylation lets homocysteine accumulate." },
      { rel: "manifests-as", to: "outcome:low-sam-sah-ratio" },
      { rel: "manifests-as", to: "outcome:elevated-homocysteine" },
      { rel: "manifests-as", to: "outcome:anxiety", note: "Reported in the Walsh literature; association, not proven cause." },
      { rel: "measured-by", to: "outcome:low-sam-sah-ratio" },
      { rel: "measured-by", to: "outcome:global-dna-methylation", note: "Research tool; not a clinical diagnostic." },
      { rel: "measured-by", to: "outcome:blood-histamine-level", note: "Walsh marker; non-specific and not validated." },
      { rel: "decreases", to: "pathway:histamine-degradation", note: "Plausible via SAM-dependent HNMT; not shown to be limiting in vivo." },
      { rel: "associated-with", to: "state:methyl-donor-depletion" },
      { rel: "associated-with", to: "state:overmethylation", note: "Opposite pole of the Walsh classification." }
    ],
    refs: ["article:stead-2006-methyl-balance-reevaluation", "article:luka-2009-gnmt-sam-regulation", "article:ueland-2011-choline-betaine"]
  },
  {
    id: "state:overmethylation",
    type: "state",
    name: "Over-methylation",
    aliases: ["Sobremetilação", "Hipermetilação", "Hypermethylation", "Overmethylation (Walsh biotype)", "Histapenia (Pfeiffer term)", "sobremetilado", "sobremetilados"],
    summary: "Excess methylation flux or a high SAM:SAH ratio. Real in rare disorders such as GNMT deficiency; as a clinical 'biotype' of the Walsh protocol it is contested and unvalidated.",
    body: [
      "In plain words: this is the opposite idea to under-methylation, a supply of methyl groups (the chemical tags carried by SAMe) that is higher than the body needs. A few rare genetic disorders, such as GNMT deficiency, really do raise SAMe. A broader \"over-methylator\" type of person, popular in nutrient-therapy circles, is not validated. It is on the site so that the two poles can be compared and so that methyl-donor supplements are not presented as harmless for everybody. This page separates what is measured from what is only claimed.",
      "As with [[state:undermethylation]], the term has a measurable biochemical meaning and a contested clinical one. Biochemically, a persistently high [[compound:sam]] or high [[compound:sam]]:[[compound:sah]] ratio is documented in a few genetic disorders. The clearest is glycine N-methyltransferase deficiency (OMIM 606664), in which loss of the [[enzyme:gnmt]] 'valve' leaves methionine and SAM persistently raised, usually with mild liver-enzyme abnormalities, and GNMT knockout mice show SAM many-fold above normal. Large methionine loads, very high betaine doses in cystathionine beta-synthase deficiency (which can push methionine to hazardous levels) and aberrant DNA hypermethylation of tumour-suppressor promoters in cancer are separate phenomena that should not be conflated with a general 'overmethylation' diagnosis.",
      "In the Walsh/Pfeiffer protocol, 'overmethylators' are described as people with low whole-blood histamine and a high SAM:SAH ratio, said to present with anxiety, panic, sensory over-sensitivity and paradoxical worsening on SAMe, methionine or methyl-donor blends, and to be managed with folate, B12 and niacin ([[compound:niacin]] consumes methyl groups through NNMT). The counter-intuitive use of folate in an 'overmethylated' person rests on the proponents' hypothesis about epigenetic effects on transporter genes. No randomized trials, replication outside the proponents' database or validated diagnostic thresholds exist; treat it as a hypothesis ([[claim:walsh-under-over-methylation-categories-valid]]). Established, mainstream facts that overlap with it are narrower: SAMe supplements can cause agitation, insomnia, anxiety or hypomania in susceptible people, and excess methyl donors are not harmless in every genetic context.",
      "Measurement: SAM, SAH and methionine by LC-MS/MS; sarcosine and DMG in urine or plasma ([[outcome:sarcosine-elevation]]); DNA methylation assays ([[outcome:global-dna-methylation]]); and, for the Walsh view, [[outcome:blood-histamine-level]]. Differential diagnosis of the anxiety-type symptoms includes primary anxiety disorder ([[disease:anxiety-disorder]]), hyperthyroidism, stimulant or caffeine effects, B6 or magnesium problems and a glutamate/GABA imbalance ([[outcome:glutamate-gaba-imbalance]]). This text is educational and not a diagnosis."
    ],
    evidence: "plausible",
    facts: {
      omim: "606664 (GNMT deficiency, the clearest genetic model)",
      "clinical-status": "Rare genetic forms established; Walsh 'biotype' not validated"
    },
    relations: [
      { rel: "increases", to: "compound:sam", note: "Defining feature: methylation supply exceeds disposal." },
      { rel: "manifests-as", to: "outcome:sarcosine-elevation", note: "When GNMT flux is high or sarcosine clearance is impaired." },
      { rel: "manifests-as", to: "outcome:anxiety", note: "Walsh-literature association; unproven." },
      { rel: "measured-by", to: "outcome:global-dna-methylation" },
      { rel: "measured-by", to: "outcome:blood-histamine-level", note: "Walsh marker (low in 'overmethylators'); not validated." },
      { rel: "increases", to: "pathway:histamine-degradation", note: "Speculative: more SAM could speed HNMT-mediated clearance." },
      { rel: "associated-with", to: "state:undermethylation", note: "Opposite pole of the Walsh classification." }
    ],
    refs: ["article:mudd-2001-gnmt-deficiency", "article:luka-2009-gnmt-sam-regulation"]
  },
  {
    id: "state:hypochlorhydria",
    type: "state",
    name: "Hypochlorhydria",
    aliases: ["Hipocloridria", "Low stomach acid", "Achlorhydria (absent acid)", "Baixa acidez gástrica", "baixo ácido gástrico", "pouco ácido no estômago", "hipocloridria funcional"],
    summary: "Reduced gastric acid output (raised pH), usually from PPIs, H. pylori, autoimmune gastritis or ageing; it weakens the bacterial barrier and impairs B12 and iron absorption.",
    body: [
      "Gastric acid, produced by parietal cells through [[pathway:gastric-acid-secretion]], keeps the stomach near pH 1-3, activates [[compound:pepsin]] and kills most swallowed bacteria. Established causes of low output are acid-suppressive drugs ([[state:acid-suppression]], [[intervention:ppi-therapy|PPIs]]), chronic [[disease:h-pylori-infection]] with corpus atrophy, autoimmune gastritis ([[disease:atrophic-gastritis]]), advanced age, and previous gastric surgery. Consequences include impaired absorption of vitamin B12, iron and some minerals, reduced protein digestion, and a higher risk of upper-gut bacterial colonisation ([[disease:sibo]]), though the size of that last effect is debated.",
      "Popular wellness sources describe 'functional hypochlorhydria' as common and as a driver of bloating and belching, and recommend [[intervention:betaine-hcl]]. There is no validated bedside test; symptoms do not reliably discriminate low from normal acid; and trials of acid replacement are few and small. In the source conversation hypochlorhydria is also linked to under-methylation through low cholinergic tone; that link is not documented ([[claim:undermethylated-hypochlorhydria]]). Educational context only; not diagnostic."
    ],
    evidence: "established",
    facts: {
      measurement: "Intragastric pH monitoring, gastric analysis, serum pepsinogen/gastrin patterns, histology"
    },
    relations: [
      { rel: "decreases", to: "compound:hydrochloric-acid" },
      { rel: "increases", to: "outcome:elevated-gastric-ph" },
      { rel: "causes", to: "disease:sibo", note: "Loss of the acid barrier is associated with, not proven to cause, overgrowth." },
      { rel: "measured-by", to: "outcome:elevated-gastric-ph" },
      { rel: "aggravates", to: "disease:atrophic-gastritis", note: "Atrophy is both cause and consequence of low acid; included to show the loop." },
      { rel: "interacts-with", to: "compound:gastrin", note: "Low acid removes feedback inhibition, so gastrin rises." }
    ],
    refs: ["article:lenti-2020-autoimmune-gastritis", "article:schubert-2008-gastric-acid-secretion-control", "article:guilliams-2020-betaine-hcl-evidence"]
  },
  {
    id: "state:b6-functional-deficiency",
    type: "state",
    name: "Functional vitamin B6 deficiency",
    aliases: ["Deficiência funcional de B6", "Low PLP", "Marginal B6 status"],
    summary: "Low active PLP at tissue level despite adequate intake, from inflammation, drugs, renal disease or genetics; also invoked, without proof, in 'undermethylation' and 'pyroluria'.",
    body: [
      "[[compound:plp]] is the coenzyme for roughly 150 enzymes, including [[enzyme:gad]] (glutamate to GABA), [[enzyme:shmt]] and the glycine cleavage system, cystathionine beta-synthase and many transaminases. Plasma PLP falls in inflammation, alcohol use, chronic kidney disease, some drugs (isoniazid, penicillamine, theophylline) and rare genetic defects of the B6-activating enzymes, so low PLP may exist even when dietary B6 appears adequate. Direct measurement of plasma PLP ([[outcome:low-plp-status]]) is the standard test; high-dose supplementation carries its own risk of sensory neuropathy.",
      "The source conversation links functional B6 deficiency to under-methylation and to 'pyroluria' ([[disease:pyroluria-kpu]]); neither association is established ([[claim:undermethylated-have-functional-b6-deficiency]]). Oral PLP is dephosphorylated in the gut before absorption, so it is not clearly superior to pyridoxine for most people ([[claim:p5p-bypasses-hepatic-activation]]). Educational information; not diagnostic or dosing advice."
    ],
    evidence: "plausible",
    facts: { biomarker: "Plasma PLP; functional markers include xanthurenic acid after tryptophan load" },
    relations: [
      { rel: "decreases", to: "compound:gaba", note: "GAD needs PLP; severe deficiency lowers GABA and can cause seizures." },
      { rel: "increases", to: "compound:glutamate", note: "Less conversion to GABA shifts the glutamate/GABA balance." },
      { rel: "manifests-as", to: "outcome:glutamate-gaba-imbalance" },
      { rel: "manifests-as", to: "outcome:low-plp-status" },
      { rel: "measured-by", to: "outcome:low-plp-status" },
      { rel: "aggravates", to: "state:glycine-insufficiency", note: "SHMT and the glycine cleavage system need PLP; the effect on glycine pools in humans is modest and indirect." }
    ],
    refs: ["article:parra-2018-vitamin-b6-metabolism", "article:petroff-2002-gaba-glutamate"]
  },
  {
    id: "state:gastric-dysmotility",
    type: "state",
    name: "Gastric dysmotility",
    aliases: ["Dismotilidade gástrica", "Slow gastric emptying", "Esvaziamento gástrico lento", "Impaired gastric motor function", "gastroparesia leve", "gastroparesia funcional", "esvaziamento lentificado"],
    summary: "Disordered stomach motor function: delayed emptying, impaired accommodation or abnormal contractions, from diabetes, drugs, post-viral injury or vagal damage; many cases are idiopathic.",
    body: [
      "Normal gastric emptying relies on proximal accommodation, antral contractions, pyloric coordination and duodenal feedback, orchestrated by the vagus ([[system:vagal-tone]]), the [[system:enteric-nervous-system]] and gut hormones. Dysmotility ranges from mild functional postprandial fullness ([[disease:functional-dyspepsia]]) to confirmed [[disease:gastroparesis]]. Established contributors are diabetes, opioids and other drugs, surgery, post-infectious injury and idiopathic neuropathy. Proton pump inhibitors modestly slow solid-meal emptying in some studies ([[claim:ppis-slow-gastric-emptying]]).",
      "The source conversation suggests that methyl-donor drain and low choline can produce 'subclinical vagal dysfunction' and mild gastroparesis; there is no direct evidence for that mechanism ([[claim:undermethylation-causes-subclinical-vagal-dysfunction]]). Symptoms such as belching, early satiety or nausea are non-specific and need clinical assessment; this entry is educational only."
    ],
    evidence: "established",
    facts: { measurement: "Gastric emptying scintigraphy, 13C breath test, wireless motility capsule" },
    relations: [
      { rel: "manifests-as", to: "outcome:delayed-gastric-emptying" },
      { rel: "manifests-as", to: "outcome:belching", note: "Retained air/gas may be vented; belching itself is mostly swallowed air." },
      { rel: "causes", to: "disease:gastroparesis", note: "Severe, confirmed delay with no mechanical obstruction." },
      { rel: "measured-by", to: "outcome:delayed-gastric-emptying" },
      { rel: "associated-with", to: "disease:functional-dyspepsia" }
    ],
    refs: ["article:camilleri-2022-acg-gastroparesis", "article:stanghellini-2016-rome-iv-gastroduodenal", "article:browning-2014-vagal-control-gi"]
  },
  {
    id: "state:methyl-donor-depletion",
    type: "state",
    name: "Methyl-donor depletion",
    aliases: ["Depleção de doadores de metil", "Methyl group deficit", "Methyl-deficient state"],
    summary: "A shortfall of dietary or recycled methyl groups (methionine, choline, betaine, folate, B12) relative to methyltransferase demand, as in choline deficiency or after heavy methyl-consuming loads.",
    body: [
      "Methyl groups come from three overlapping sources: methionine, folate-derived one-carbon units, and [[compound:choline]]/[[compound:betaine]]. When intake or recycling falls short of the demand from [[enzyme:pemt]], creatine synthesis, [[enzyme:gnmt]] and other methyltransferases, the supply system compensates by drawing on one source more than another. The best-documented clinical consequence is choline-deficient fatty liver and muscle damage in people fed choline-poor diets, with risk modified by PEMT and folate genetics ([[disease:choline-deficiency]]).",
      "Rodent studies show that methyl-deficient diets lower hepatic SAM and induce steatosis; high-dose nicotinamide in rats consumed methyl groups and was reversed by choline or betaine. In humans such effects are generally modest unless intake is very poor. The idea that moderate oral glycine drains methyl groups to a clinically meaningful degree is unproven ([[claim:glycine-gnmt-depletes-sam-in-undermethylated]]). Educational only."
    ],
    evidence: "plausible",
    facts: { markers: "Plasma free choline and betaine, SAM:SAH, total homocysteine, liver fat" },
    relations: [
      { rel: "causes", to: "state:undermethylation", note: "In the biochemical sense: lower SAM supply." },
      { rel: "causes", to: "disease:fatty-liver-nafld", note: "Via impaired phosphatidylcholine and VLDL secretion." },
      { rel: "increases", to: "compound:homocysteine" },
      { rel: "measured-by", to: "outcome:elevated-homocysteine" },
      { rel: "measured-by", to: "outcome:low-sam-sah-ratio" }
    ],
    refs: ["article:zeisel-1991-choline-essential-nutrient", "article:stead-2006-methyl-balance-reevaluation", "article:ueland-2011-choline-betaine"]
  },
  {
    id: "state:folate-trap",
    type: "state",
    name: "Methyl-folate trap",
    aliases: ["Armadilha do folato", "Folate trap", "Methylfolate trap", "Functional folate deficiency"],
    summary: "Folate accumulates as 5-methyl-THF because methionine synthase, which needs B12, cannot use it. Folate-dependent synthesis suffers despite normal total folate; B12 deficiency is the classic cause.",
    body: [
      "The [[enzyme:mthfr]] step that produces [[compound:5-mthf|5-methyl-THF]] is effectively irreversible in cells, and the only way back to the THF pool is via methionine synthase, which needs vitamin B12. If B12 is lacking, 5-methyl-THF piles up, other folate forms are depleted, and DNA synthesis is impaired (megaloblastic anaemia) while [[compound:homocysteine]] rises ([[state:hyperhomocysteinemia]]). This 'methyl-trap hypothesis' is a textbook explanation for why B12 deficiency mimics folate deficiency, and why large doses of folic acid can correct the anaemia but not the neurological damage.",
      "In the wider methylation discourse the trap is sometimes invoked loosely for people with common MTHFR variants. Evidence for a clinically relevant trap outside B12 deficiency or severe enzyme defects is limited. The same pathway links to the question of folic acid versus methylfolate ([[claim:folic-acid-competes-with-methylfolate]]). Educational information; not diagnostic."
    ],
    evidence: "established",
    relations: [
      { rel: "decreases", to: "pathway:folate-cycle", note: "Non-methyl folates are depleted; thymidylate and purine synthesis suffer." },
      { rel: "increases", to: "compound:5-mthf", note: "Accumulates in the trapped pool." },
      { rel: "causes", to: "state:hyperhomocysteinemia" },
      { rel: "measured-by", to: "outcome:elevated-homocysteine" },
      { rel: "associated-with", to: "disease:vitamin-b12-deficiency" },
      { rel: "decreases", to: "pathway:nucleotide-synthesis", note: "Classical mechanism of megaloblastic anaemia; shown indirectly." }
    ],
    refs: ["article:stabler-2013-vitamin-b12-deficiency", "article:ducker-2017-one-carbon-metabolism"]
  },
  {
    id: "state:hyperhomocysteinemia",
    type: "state",
    name: "Hyperhomocysteinemia",
    aliases: ["Hiper-homocisteinemia", "Elevated homocysteine", "Homocisteína elevada"],
    summary: "Raised total plasma homocysteine (commonly above 15 umol/L) from B12, folate or B6 deficiency, renal disease or genetic defects; a risk marker, not a proven causal target for B vitamins.",
    body: [
      "[[compound:homocysteine]] sits at the branch between remethylation ([[pathway:methionine-cycle]], via folate/B12 or [[enzyme:bhmt]]) and transsulfuration (B6-dependent). Moderate elevations (about 15-30 umol/L) are common and reflect B-vitamin status, kidney function, age, sex, smoking, hypothyroidism and drugs; severe elevations indicate inborn errors such as CBS or MTHFR deficiency ([[disease:mthfr-deficiency]]). Homocysteine rises with impaired remethylation, so it is the best-validated functional readout of [[state:methyl-donor-depletion]] ([[outcome:elevated-homocysteine]]).",
      "Observational studies link elevated homocysteine to vascular disease, stroke, dementia and neural tube defects. However, randomized trials of folate/B12/B6 lowered homocysteine without reducing myocardial infarction or death, with only a small effect on stroke, so lowering the number is not proven to prevent disease ([[disease:cardiovascular-disease]], [[claim:homocysteine-lowering-reduces-cardiovascular-events]]). Educational only."
    ],
    evidence: "established",
    facts: { "typical-threshold": "About 15 umol/L fasting total homocysteine (laboratory-dependent)" },
    relations: [
      { rel: "manifests-as", to: "outcome:elevated-homocysteine" },
      { rel: "measured-by", to: "outcome:elevated-homocysteine" },
      { rel: "increases", to: "disease:cardiovascular-disease", note: "Observational association; causality not confirmed by B-vitamin trials." },
      { rel: "increases", to: "disease:neural-tube-defects", note: "Maternal elevated homocysteine/low folate associated with risk." },
      { rel: "associated-with", to: "state:folate-trap" }
    ],
    refs: ["article:refsum-2004-homocysteine-recommendations", "article:marti-carvajal-2017-homocysteine-lowering-cochrane"]
  },
  {
    id: "state:glycine-insufficiency",
    type: "state",
    name: "Glycine insufficiency",
    aliases: ["Insuficiência de glicina", "Semi-essential glycine shortfall", "Glycine deficit"],
    summary: "Proposed state where endogenous synthesis (about 3 g/day) plus diet (1.5-3 g) falls short of needs, estimated by Melendez-Hevia at about 10 g/day; influential but unconfirmed.",
    body: [
      "Glycine is made mainly from serine by [[enzyme:shmt]], is used for collagen, glutathione, creatine, haem, purines and bile-salt conjugation, and is also consumed by [[enzyme:gnmt]]. Melendez-Hevia and colleagues (2009) argued from stoichiometry that synthesis (about 3 g/day), limited by the supply of one-carbon units, plus a typical diet cannot cover metabolic needs, leaving a deficit near 10 g/day for a 70 kg adult, and proposed glycine as semi-essential ([[claim:glycine-deficit-10g]]).",
      "That estimate relies on modelling of collagen turnover and has not been confirmed by controlled outcome studies; other authorities regard glycine as non-essential for healthy adults. Under special conditions (rapid growth, severe injury, low-protein or vegan diets, high PEMT/GNMT flux, B6 deficiency) genuine shortages are plausible. Supplementation studies exist for sleep ([[outcome:improved-sleep-quality]]) and other uses at 3 g to 15 g or more per day. Educational context only."
    ],
    evidence: "plausible",
    relations: [
      { rel: "decreases", to: "outcome:collagen-synthesis-adequacy", note: "The Melendez-Hevia argument: collagen is the largest glycine sink." },
      { rel: "measured-by", to: "outcome:glycine-deficit-estimate" },
      { rel: "associated-with", to: "state:b6-functional-deficiency" },
      { rel: "interacts-with", to: "compound:glycine" }
    ],
    refs: ["article:melendez-hevia-2009-glycine-weak-link"]
  },
  {
    id: "state:acid-suppression",
    type: "state",
    name: "Pharmacological acid suppression",
    aliases: ["Supressão ácida", "PPI therapy state", "Uso de IBP", "Acid-suppressed stomach"],
    summary: "Gastric acid reduced by PPIs, potassium-competitive blockers or H2 blockers; it heals ulcers and GERD but is associated with SIBO, B12 deficiency and slower solid-meal emptying.",
    body: [
      "[[intervention:ppi-therapy|PPIs]] therapy lifts gastric pH for most of the day and is first-line for ulcers and erosive reflux. Long-term acid suppression is a recognised cause of [[state:hypochlorhydria]]. Meta-analyses report a moderate association between PPI use and small-intestinal bacterial overgrowth (odds ratio about 1.7-2.3), with heterogeneity and test-dependence, and reviews show that PPIs delay emptying of solid meals ([[claim:ppis-cause-sibo]], [[claim:ppis-slow-gastric-emptying]]). Rebound acid hypersecretion after withdrawal is also described.",
      "Anyone who has used PPIs should discuss tapering and any alternative therapy with the prescriber; abrupt self-discontinuation can worsen symptoms. Eradication of [[disease:h-pylori-infection]] normally uses a PPI plus antibiotics, and the ACG 2024 guideline asks for PPIs to be held for at least two weeks before test-of-cure ([[claim:confirm-h-pylori-eradication]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "causes", to: "state:hypochlorhydria" },
      { rel: "increases", to: "outcome:elevated-gastric-ph" },
      { rel: "increases", to: "disease:sibo", note: "Moderate association in meta-analyses; causal size debated." },
      { rel: "aggravates", to: "state:gastric-dysmotility", note: "PPIs delay solid-meal emptying in some studies." },
      { rel: "measured-by", to: "outcome:elevated-gastric-ph" }
    ],
    refs: ["article:sanaka-2010-ppi-gastric-emptying", "article:lo-2013-ppi-sibo-meta-analysis", "article:su-2018-ppi-sibo-meta-analysis", "article:katz-2022-acg-gerd-guideline"]
  },
  {
    id: "state:post-ulcer-mucosal-recovery",
    type: "state",
    name: "Post-ulcer mucosal recovery",
    aliases: ["Recuperação mucosa pós-úlcera", "Healed ulcer mucosa", "Mucosa gastroduodenal em cicatrização"],
    summary: "The weeks to months after an ulcer is treated, when epithelium and mucus-bicarbonate barrier regenerate; acid exposure, NSAIDs, H. pylori persistence and irritants matter and symptoms may linger.",
    body: [
      "Ulcer healing is driven by cause removal (eradicating [[disease:h-pylori-infection]], stopping NSAIDs) and acid suppression, which allows epithelial restitution and rebuilds the [[system:mucosal-barrier]]. Symptom resolution and endoscopic healing do not always coincide, and residual gastritis or duodenitis may cause burning with irritating foods or supplements. Guidelines recommend confirming H. pylori eradication after therapy ([[claim:confirm-h-pylori-eradication]]).",
      "In the source conversation this period is used to argue that [[intervention:betaine-hcl]] is contraindicated, that glycine and collagen powders should be suspended, and that mucosal protectants such as [[intervention:zinc-carnosine]] and [[intervention:dgl-licorice]] should be used first. The caution about irritant acid is mainstream, but evidence for the supplements is mixed ([[claim:betaine-hcl-contraindicated-post-ulcer]], [[claim:zinc-carnosine-ulcer-healing]], [[claim:dgl-ulcer-healing]]). Educational information, not advice."
    ],
    evidence: "plausible",
    relations: [
      { rel: "manifests-as", to: "outcome:ulcer-healing" },
      { rel: "measured-by", to: "outcome:ulcer-healing", note: "Endoscopic confirmation is the reference standard." },
      { rel: "aggravates", to: "outcome:heartburn", note: "Acid or irritants on regenerating mucosa can cause burning." },
      { rel: "associated-with", to: "disease:peptic-ulcer" },
      { rel: "interacts-with", to: "intervention:zinc-carnosine" }
    ],
    refs: ["article:lanas-2017-peptic-ulcer-disease", "article:malfertheiner-2022-maastricht-vi"]
  },
  {
    id: "state:choline-excess",
    type: "state",
    name: "Choline intake above the upper limit",
    aliases: ["Excesso de colina", "High-dose choline", "Choline overload"],
    summary: "Intake above the IOM UL of 3.5 g/day causes fishy odour, sweating, diarrhoea, vomiting and hypotension; the UL is derived from hypotension and fishy odour at about 7.5-16 g/day.",
    body: [
      "The U.S. Institute of Medicine set an adult Tolerable Upper Intake Level of 3.5 g/day of choline. A lowest-observed-adverse-effect level of about 7.5 g/day (hypotension) was reduced by an uncertainty factor of 2, with fishy body odour, sweating, salivation, vomiting and diarrhoea at 10-16 g/day as supportive evidence. EFSA (2016) set Adequate Intakes of 400 mg/day for adults but did not derive an upper limit, contrary to the source conversation's statement that both bodies use 3.5 g ([[claim:choline-ul-3-5g-iom-efsa]]).",
      "Gut bacteria convert surplus choline to [[compound:trimethylamine]], which the liver oxidises to [[compound:tmao]] using FMO3 ([[enzyme:fmo3]]); high loads produce a fishy odour, even in people with normal FMO3 ([[claim:above-ul-fishy-odor-and-cholinergic-effects]]). Whether higher TMAO is harmful or a bystander marker is contested ([[claim:above-ul-tmao-endothelial-stress]]). Educational context only."
    ],
    evidence: "established",
    facts: { "IOM-UL-adults": "3.5 g/day choline", "EFSA-AI-adults": "400 mg/day (no UL set)" },
    relations: [
      { rel: "causes", to: "outcome:fishy-odor" },
      { rel: "causes", to: "outcome:cholinergic-excess-symptoms" },
      { rel: "increases", to: "compound:trimethylamine" },
      { rel: "increases", to: "outcome:elevated-tmao" },
      { rel: "associated-with", to: "disease:trimethylaminuria" }
    ],
    refs: ["article:iom-1998-choline-dri", "article:efsa-2016-choline-dri"]
  },
  {
    id: "state:histamine-excess",
    type: "state",
    name: "Histamine excess",
    aliases: ["Excesso de histamina", "Histamine overload", "Elevated histamine load"],
    summary: "Histamine load exceeds degradation capacity (DAO in gut, HNMT in cells) from food histamine, mast-cell release, DAO inhibitors or enzyme variants; may cause flushing, tachycardia, headache.",
    body: [
      "[[compound:histamine]] is cleared by two routes ([[pathway:histamine-degradation]]): extracellular oxidative deamination by [[enzyme:dao]], mainly a barrier in the intestinal mucosa, and intracellular ring methylation by [[enzyme:hnmt]], which uses [[compound:sam]] and is the main route in the brain and airways. A shortfall of either, or an excess input (aged foods, alcohol, mast-cell activation), can raise tissue histamine, acting on H1 and H2 receptors to cause flushing, tachycardia, headache, hypotension, nasal congestion and gastrointestinal symptoms ([[claim:histamine-h1-h2-tachycardia-flushing]]).",
      "Whether mild methylation shortfalls limit HNMT in practice is unproven ([[claim:hnmt-needs-sam]]). The same applies to attributing night waking to histamine ([[claim:choline-fixed-night-waking-via-bhmt-hnmt]]). Diagnosis of [[disease:histamine-intolerance]] is difficult and DAO activity tests are inconsistent. Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "manifests-as", to: "outcome:flushing" },
      { rel: "manifests-as", to: "outcome:tachycardia" },
      { rel: "manifests-as", to: "outcome:night-waking", note: "Hypothesised; plasma histamine rises at night in some studies." },
      { rel: "causes", to: "disease:histamine-intolerance" },
      { rel: "measured-by", to: "outcome:blood-histamine-level", note: "Plasma histamine is short-lived; poor routine marker." }
    ],
    refs: ["article:maintz-2007-histamine-intolerance", "article:nakamura-2017-mast-cell-clock-histamine"]
  },
  {
    id: "state:duodenogastric-reflux",
    type: "state",
    name: "Duodenogastric (bile) reflux",
    aliases: [
      "refluxo duodenogástrico",
      "refluxo biliar",
      "refluxo duodeno-gástrico alcalino",
      "refluxo alcalino",
      "bile reflux",
      "alkaline reflux"
    ],
    summary: "Backflow of bile and duodenal juice into the stomach. A little occurs in healthy people; more is linked to gastritis and GERD, but its link to everyday belching or gas is not shown.",
    body: [
      "Normally the pylorus lets food leave the stomach and keeps most duodenal fluid from returning. Small amounts of bile still reach the stomach in healthy people. After gastric surgery, or with pyloric or motility problems, more can reflux and irritate the lining ([[system:pylorus]], [[system:bile]]).",
      "In one cohort of 341 people with GORD, 38 % had raised gastric bilirubin, and those with raised gastric and oesophageal bilirubin mostly had oesophagitis or Barrett's oesophagus ([[article:fein-2006-duodenogastric-reflux-gord]]). Ursodeoxycholic acid has been tried in alkaline reflux gastritis ([[article:stefaniwsky-1985-udca-alkaline-reflux-gastritis]]).",
      "The source conversation says glycine overload changes the glycine:taurine ratio of bile and so provokes \"irritating alkaline duodenogastric reflux\" that triggers belching. That chain is unsupported: human bile is already mostly glycine-conjugated and large glycine doses did not shift the pattern ([[claim:glycine-overload-shifts-bile-conjugation-and-reflux]]). Persistent symptoms need medical evaluation; this is educational only."
    ],
    evidence: "plausible",
    relations: [
      { rel: "associated-with", to: "system:pylorus" },
      { rel: "associated-with", to: "system:bile" },
      {
        rel: "associated-with",
        to: "disease:gerd",
        note: "Increased gastric bilirubin in 38 % of GORD patients in one cohort."
      },
      { rel: "associated-with", to: "disease:gastritis" },
      {
        rel: "associated-with",
        to: "outcome:reflux-episodes",
        note: "Bile-containing reflux is detected by bilirubin and impedance monitoring."
      }
    ],
    refs: ["article:fein-2006-duodenogastric-reflux-gord", "article:stefaniwsky-1985-udca-alkaline-reflux-gastritis"]
  }
];
