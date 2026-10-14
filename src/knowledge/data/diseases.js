// Diseases: clinical conditions linked to methylation biochemistry, the upper GI tract and the source conversation.
// Educational content only; nothing here is a diagnosis or medical advice.
export default [
  {
    id: "disease:peptic-ulcer",
    type: "disease",
    name: "Peptic ulcer disease",
    aliases: ["Úlcera péptica", "Úlcera gástrica", "Úlcera duodenal", "Gastric ulcer", "Duodenal ulcer"],
    summary: "Breaks in the gastric or duodenal mucosa reaching the muscularis, caused mainly by H. pylori infection or NSAIDs and healed with acid suppression and removal of the cause.",
    body: [
      "In plain words: a peptic ulcer is a sore in the lining of the stomach or the first part of the small intestine. Most come from infection with H. pylori or from anti-inflammatory painkillers; stomach acid and pepsin keep the sore open. Treatment removes the cause and lowers acid. In the source conversation, ulcers earlier in the year explain why an acid supplement (betaine HCl) burned and why gut-protective products are discussed. This page is educational only; ulcer symptoms need a doctor.",
      "Ulcers arise when aggressive factors (acid, [[compound:pepsin]], bile, [[disease:h-pylori-infection]], NSAIDs) overwhelm the [[system:mucosal-barrier]]. Standard care is to find and remove the cause (test and treat H. pylori, stop NSAIDs), use [[intervention:ppi-therapy|PPIs]] for healing, and confirm eradication afterwards ([[claim:confirm-h-pylori-eradication]]). Complications are bleeding, perforation and gastric-outlet obstruction.",
      "In the source conversation the user's early-year gastric and duodenal ulcers are the pivot for caution about acidifying supplements ([[claim:betaine-hcl-contraindicated-post-ulcer]]) and for suggestions such as [[intervention:zinc-carnosine]], [[intervention:dgl-licorice]] and [[intervention:espinheira-santa]]. Whether those add benefit beyond standard therapy is uncertain ([[claim:zinc-carnosine-ulcer-healing]]). Educational only; ulcer symptoms need clinical evaluation."
    ],
    evidence: "established",
    facts: { icd10: "K25 (gastric), K26 (duodenal), K27 (unspecified)", mesh: "D010437" },
    relations: [
      { rel: "manifests-as", to: "outcome:heartburn", note: "Epigastric burning pain is typical; heartburn proper suggests reflux." },
      { rel: "measured-by", to: "outcome:ulcer-healing", note: "Endoscopic healing." },
      { rel: "measured-by", to: "outcome:h-pylori-test-result" },
      { rel: "associated-with", to: "disease:h-pylori-infection" },
      { rel: "causes", to: "state:post-ulcer-mucosal-recovery" },
      { rel: "associated-with", to: "system:duodenum" }
    ],
    refs: ["article:lanas-2017-peptic-ulcer-disease", "article:malfertheiner-2022-maastricht-vi"]
  },
  {
    id: "disease:h-pylori-infection",
    type: "disease",
    name: "Helicobacter pylori infection",
    aliases: ["Infecção por H. pylori", "Helicobacter pylori", "H. pylori gastritis", "H. pylori", "Helicobacter"],
    summary: "Chronic gastric infection by a urease-producing bacterium, causing gastritis, ulcers, atrophy and gastric cancer risk; treated with PPI-based antibiotic regimens and confirmed by test of cure.",
    body: [
      "The bacterium survives acid by producing urease, which hydrolyses urea into ammonia and [[compound:carbon-dioxide]] and buffers its microenvironment. The same reaction is the basis of the urea breath test. Roughly 40-45% of people worldwide are infected in systematic reviews, often without symptoms. Chronic infection can cause antral gastritis and duodenal ulcers (high acid) or corpus atrophy with [[state:hypochlorhydria]] ([[disease:atrophic-gastritis]]), and is the principal risk factor for gastric cancer.",
      "The source conversation proposes that urease-generated ammonia and CO2 are 'one of the biggest causes' of frequent belching; there is no good evidence for that, and eradication gives only a modest benefit in functional dyspepsia ([[claim:h-pylori-urease-ammonia-co2]], [[claim:h-pylori-causes-belching]]). The more important message in guidelines is to test, treat with a regimen chosen by local resistance, and confirm eradication at least four weeks after therapy and two weeks off PPIs ([[intervention:h-pylori-eradication-therapy|H. pylori eradication]], [[claim:confirm-h-pylori-eradication]]). Educational only."
    ],
    evidence: "established",
    facts: { icd10: "A04.8; B96.81 (ICD-10-CM, as cause of diseases elsewhere)", mesh: "D016481", prevalence: "Roughly 40-45% worldwide; varies by region and age" },
    relations: [
      { rel: "causes", to: "disease:peptic-ulcer" },
      { rel: "causes", to: "disease:atrophic-gastritis" },
      { rel: "causes", to: "state:hypochlorhydria", note: "Via corpus atrophy; early infection may transiently reduce acid." },
      { rel: "increases", to: "compound:ammonia", note: "Urease product; neutralises acid around the bacterium." },
      { rel: "associated-with", to: "disease:functional-dyspepsia", note: "Eradication helps a minority (NNT about 15)." },
      { rel: "measured-by", to: "outcome:h-pylori-test-result" },
      { rel: "associated-with", to: "disease:sibo", note: "Meta-analysis of observational studies: infection was associated with SIBO (OR 1.82); direction and mechanism are unclear." },
      { rel: "causes", to: "disease:gastritis", note: "The commonest cause of chronic gastritis." }
    ],
    refs: ["article:malfertheiner-2022-maastricht-vi", "article:chey-2024-acg-h-pylori-treatment", "article:kusters-2006-h-pylori-pathogenesis"]
  },
  {
    id: "disease:sibo",
    type: "disease",
    name: "Small intestinal bacterial overgrowth (SIBO)",
    aliases: ["SIBO", "Supercrescimento bacteriano do intestino delgado", "Proximal SIBO", "Small bowel bacterial overgrowth", "SIBO proximal", "sobrecrescimento bacteriano", "supercrescimento bacteriano"],
    summary: "Excess bacteria in the small bowel producing bloating, diarrhoea or malabsorption; breath testing is common but imprecise, and its role in belching or amino-acid fermentation is unproven.",
    body: [
      "In plain words: SIBO means too many bacteria in the small intestine, where numbers are normally low. Typical complaints are bloating, gas and diarrhoea, and it is looked for with breath tests that are imperfect. The conversation suggests that bacteria high in the gut could ferment glycine powder and cause belching. That is chemically possible but unproven, and most SIBO gas is hydrogen and methane from carbohydrate.",
      "Defence against overgrowth comes from gastric acid, the migrating motor complex, bile, pancreatic enzymes, the ileocaecal valve and mucosal immunity. Risk rises with reduced motility, anatomy changes and probably prolonged acid suppression ([[state:acid-suppression]], [[claim:ppis-cause-sibo]]). Typical features are bloating, flatulence, diarrhoea and, in severe cases, steatorrhoea and B12 deficiency. The ACG 2020 guideline and the North American consensus use glucose or lactulose hydrogen/methane breath tests, but sensitivity and specificity versus aspirate culture are modest ([[intervention:sibo-breath-test]], [[outcome:breath-hydrogen-methane]]), and a 2024 expert update called for a more critical view of the SIBO hypothesis.",
      "The source conversation proposes that proximal SIBO rapidly ferments free glycine into CO2 and ammonia and so causes belching. Some gut anaerobes do metabolise glycine (glycine reductase, glycine cleavage), but clinical SIBO gas is mostly hydrogen and methane from carbohydrate fermentation, and belching mainly reflects swallowed air ([[claim:sibo-bacteria-metabolize-glycine-co2-nh3]], [[claim:sibo-gas-appears-in-15-45-min-as-belching]]). Educational only; antimicrobial therapy should be guided by a clinician."
    ],
    evidence: "established",
    facts: { icd10: "K63.8 (other specified diseases of intestine)", "diagnostic-thresholds": "Glucose/lactulose breath test: H2 rise of 20 ppm or more by 90 min; methane 10 ppm or more (North American consensus)" },
    relations: [
      { rel: "measured-by", to: "intervention:sibo-breath-test" },
      { rel: "manifests-as", to: "outcome:breath-hydrogen-methane" },
      { rel: "associated-with", to: "state:hypochlorhydria" },
      { rel: "associated-with", to: "state:gastric-dysmotility", note: "Impaired migrating motor complex is a recognised predisposition." },
      { rel: "interacts-with", to: "system:gut-microbiota" },
      { rel: "manifests-as", to: "outcome:flatulence", note: "Typical but non-specific; carbohydrate fermentation gas." },
      {
        rel: "increases",
        to: "pathway:gut-bacterial-glycine-fates",
        note: "Overgrown proximal bacteria are the proposed site of the fermentation.",
        hypothesis: true,
        claim: "claim:sibo-bacteria-metabolize-glycine-co2-nh3",
        strength: "weak"
      },
      {
        rel: "causes",
        to: "outcome:belching",
        note: "Conversation claim that proximal bacterial gas appears 15-45 minutes after a dose as belching; breath-test gas is mostly hydrogen and methane and belching is mostly swallowed air.",
        hypothesis: true,
        claim: "claim:sibo-gas-appears-in-15-45-min-as-belching",
        strength: "weak"
      }
    ],
    refs: ["article:pimentel-2020-acg-sibo-guideline", "article:rezaie-2017-breath-test-consensus", "article:kashyap-2024-sibo-critical-appraisal"]
  },
  {
    id: "disease:gerd",
    type: "disease",
    name: "Gastro-oesophageal reflux disease (GERD)",
    aliases: ["DRGE", "Doença do refluxo gastroesofágico", "Acid reflux", "Refluxo ácido"],
    summary: "Troublesome symptoms or complications from gastric contents entering the oesophagus; diagnosed by symptoms, endoscopy and reflux monitoring; treated with lifestyle change, PPIs or alginates.",
    body: [
      "GERD results from a weak [[system:lower-esophageal-sphincter]] barrier (transient relaxations, hiatal hernia, low pressure), delayed emptying, and mucosal susceptibility ([[outcome:reflux-episodes]]). Typical symptoms are heartburn and regurgitation ([[outcome:heartburn]]); belching often coexists, and gastric belching is a normal venting reflex that can accompany reflux. The 2022 ACG guideline advises an empiric PPI trial for typical symptoms and objective testing when diagnosis is unclear or symptoms are atypical.",
      "Alginate rafts such as the one proposed in the conversation float on gastric contents and displace the acid pocket without suppressing secretion; meta-analyses show benefit over placebo or antacids in GERD ([[intervention:sodium-alginate|alginate]], [[claim:alginate-rafts-reduce-lpr]]). Educational only."
    ],
    evidence: "established",
    facts: { icd10: "K21.0 (with oesophagitis), K21.9 (without)", mesh: "D005764" },
    relations: [
      { rel: "manifests-as", to: "outcome:heartburn" },
      { rel: "manifests-as", to: "outcome:reflux-episodes" },
      { rel: "causes", to: "disease:lpr", note: "Extra-oesophageal reflux is one proposed cause; often unproven." },
      { rel: "associated-with", to: "system:lower-esophageal-sphincter" },
      { rel: "associated-with", to: "state:gastric-dysmotility" },
      { rel: "measured-by", to: "outcome:reflux-episodes" },
      { rel: "manifests-as", to: "outcome:belching", note: "Belching, often supragastric, accompanies reflux in many patients." },
      { rel: "manifests-as", to: "disease:esophagitis", note: "Erosive form; many patients have non-erosive reflux disease." }
    ],
    refs: ["article:katz-2022-acg-gerd-guideline", "article:leiman-2017-alginate-meta-analysis"]
  },
  {
    id: "disease:lpr",
    type: "disease",
    name: "Laryngopharyngeal reflux (LPR)",
    aliases: ["RLF", "Refluxo laringofaríngeo", "Silent reflux", "Refluxo silencioso", "Extraesophageal reflux (throat)"],
    summary: "A label for throat symptoms (burning, throat clearing, globus, hoarseness) attributed to reflux; it lacks standard criteria and objective proof, and PPI response is often no better than placebo.",
    body: [
      "In plain words: LPR (\"silent reflux\") is the idea that stomach contents reach the throat and cause burning, throat clearing or a lump sensation, sometimes without heartburn. It is a common but debated label: the tests are imperfect, and acid-blocking drugs often do no better than placebo. The conversation links belches that carry pepsin to the throat; that link has not been tested. Throat symptoms deserve medical assessment.",
      "Proposed mechanisms are direct injury of the [[system:larynx-pharynx]] by acid, [[compound:pepsin]] and bile, and indirect vagal reflexes. Johnston and colleagues showed that pepsin can be taken up by hypopharyngeal epithelial cells and may damage them even at weakly acidic or neutral pH, and that laryngeal tissue has lower protective carbonic anhydrase and mucins than the oesophagus. The AGA 2023 update, however, states that LPR has no standardised diagnostic criteria or objective evidence of reflux in many labelled patients, discourages empiric PPIs for isolated throat symptoms, and prefers reflux testing first ([[claim:throat-burning-means-lpr]]).",
      "Alginates have promising but still limited evidence for LPR, including a non-inferiority RCT against PPIs ([[claim:alginate-rafts-reduce-lpr]]); in-vitro work shows that alkaline water can denature pepsin ([[claim:alkaline-water-inactivates-pepsin]]). The conversation's suggestion that belches aerosolise pepsin onto the larynx is untested ([[claim:belch-aerosol-deposits-pepsin]]). Throat burning has many other causes (voice use, allergy, post-nasal drip, oesophageal motility, anxiety). Educational only."
    ],
    evidence: "plausible",
    facts: { icd10: "No dedicated code; coded under J38.7 (other diseases of larynx) or K21 when GERD is present" },
    relations: [
      { rel: "manifests-as", to: "outcome:throat-burning", claim: "claim:throat-burning-means-lpr", strength: "moderate" },
      { rel: "manifests-as", to: "outcome:salivary-pepsin" },
      { rel: "measured-by", to: "outcome:salivary-pepsin", note: "Controversial and not diagnostic on its own." },
      { rel: "associated-with", to: "system:larynx-pharynx" },
      { rel: "associated-with", to: "disease:gerd" },
      { rel: "associated-with", to: "outcome:belching" },
      { rel: "measured-by", to: "outcome:reflux-episodes", note: "Pharyngeal and oesophageal impedance-pH monitoring is the objective test." }
    ],
    refs: ["article:chen-2023-aga-extraesophageal-reflux", "article:johnston-2006-pepsin-laryngeal-epithelium", "article:pizzorni-2022-alginate-vs-ppi-lpr"]
  },
  {
    id: "disease:histamine-intolerance",
    type: "disease",
    name: "Histamine intolerance",
    aliases: ["Intolerância à histamina", "Histaminose enteral", "DAO deficiency (proposed)"],
    summary: "A proposed disorder in which dietary or endogenous histamine exceeds degradation capacity (DAO or HNMT), producing flushing, headaches, palpitations and GI symptoms; diagnosis relies on diet response.",
    body: [
      "Maintz and Novak's 2007 review framed histamine intolerance as an imbalance between histamine load and the capacity of [[enzyme:dao]] (extracellular, gut) and [[enzyme:hnmt]] (intracellular, SAM-dependent). Symptoms can mimic allergy, anxiety or arrhythmia. Serum DAO activity is of inconsistent value, and no single validated test exists; a low-histamine diet with a supervised re-challenge is the usual approach. Some cohorts show lower serum DAO in affected patients, but there is no standard cut-off.",
      "The methylation angle (HNMT needs [[compound:sam]]) is plausible but unproven in ordinary people ([[claim:hnmt-needs-sam]]). The conversation's story that choline stopped 2-3 am waking by feeding BHMT, SAM and HNMT is one person's observation with an untested mechanism ([[claim:choline-fixed-night-waking-via-bhmt-hnmt]]). Educational only."
    ],
    evidence: "plausible",
    facts: { icd10: "No dedicated ICD-10 code" },
    relations: [
      { rel: "manifests-as", to: "outcome:flushing" },
      { rel: "manifests-as", to: "outcome:tachycardia" },
      { rel: "manifests-as", to: "outcome:night-waking" },
      { rel: "measured-by", to: "outcome:blood-histamine-level" },
      { rel: "associated-with", to: "state:histamine-excess" },
      { rel: "interacts-with", to: "enzyme:dao" }
    ],
    refs: ["article:maintz-2007-histamine-intolerance"]
  },
  {
    id: "disease:trimethylaminuria",
    type: "disease",
    name: "Trimethylaminuria (fish-odour syndrome)",
    aliases: ["Trimetilaminúria", "TMAU", "Síndrome do odor de peixe", "Fish odor syndrome"],
    summary: "A usually recessive FMO3 defect that leaves trimethylamine unoxidised, causing a fishy body odour; milder transient forms follow high choline or carnitine loads or liver disease.",
    body: [
      "Gut bacteria turn dietary choline, carnitine and betaine into [[compound:trimethylamine]] (TMA); hepatic [[enzyme:fmo3]] converts it into odourless [[compound:tmao]]. In primary trimethylaminuria (OMIM 602079, FMO3 mutations) the urinary TMA:TMAO ratio is raised and body odour is intermittent or constant; the severe inherited form is rare (carrier frequency about 1% or less in many populations) and a few hundred cases have been reported. Dietary choline restriction, short courses of antibiotics or charcoal/copper chlorophyllin and avoidance of triggers are discussed clinically.",
      "Fishy odour can also appear in people with normal FMO3 at very high choline intakes (the IOM UL basis), which is relevant to using choline to supply glycine ([[state:choline-excess]], [[claim:choline-28-35g-for-10g-glycine]]). A fishy odour is not diagnostic; genetic and urinary tests are available. Educational only."
    ],
    evidence: "established",
    facts: { omim: "602079", icd10: "E72.52 (ICD-10-CM)", prevalence: "Incidence unknown; severe inherited form roughly 1 in 40,000 (estimate)" },
    relations: [
      { rel: "manifests-as", to: "outcome:fishy-odor" },
      { rel: "measured-by", to: "outcome:urinary-tma-tmao-ratio" },
      { rel: "increases", to: "compound:trimethylamine" },
      { rel: "associated-with", to: "state:choline-excess" },
      { rel: "associated-with", to: "system:gut-microbiota" },
      { rel: "manifests-as", to: "outcome:urinary-tma-tmao-ratio", note: "Urinary TMA is raised relative to TMAO when FMO3 is deficient." }
    ],
    refs: ["article:mackay-2011-trimethylaminuria"]
  },
  {
    id: "disease:anxiety-disorder",
    type: "disease",
    name: "Anxiety disorders",
    aliases: ["Transtornos de ansiedade", "Generalised anxiety disorder", "Panic disorder", "Ansiedade"],
    summary: "Common psychiatric conditions of excessive fear or worry with autonomic arousal; managed by psychotherapy and medication. Vitamin B6 and glutamate/GABA balance are discussed hypotheses, not diagnoses.",
    body: [
      "Anxiety disorders are among the most common psychiatric conditions and cause palpitations, tremor, sleep disturbance and cognitive symptoms. Evidence-based treatment includes CBT and SSRIs/SNRIs. The excitatory/inhibitory balance of [[compound:glutamate]] and [[compound:gaba]] is implicated, and [[enzyme:gad]] needs [[compound:plp]]. Small trials suggest high-dose B6 may reduce anxiety in healthy young adults, but this does not make B6 a treatment for clinical disorders.",
      "In the conversation, resolved anxiety and 'brain fog' after P5P is explained by improved GAD activity ([[claim:p5p-gad-gaba-relieves-anxiety]]). That is plausible but unverified in an individual, and panic-like symptoms also arise from arrhythmia, thyroid disease, stimulants and histamine reactions ([[outcome:tachycardia]], [[disease:histamine-intolerance]]). Educational only; persistent anxiety warrants professional assessment."
    ],
    evidence: "established",
    facts: { icd10: "F41.x (F41.9 unspecified)", mesh: "D001008" },
    relations: [
      { rel: "manifests-as", to: "outcome:anxiety" },
      { rel: "manifests-as", to: "outcome:tachycardia" },
      { rel: "manifests-as", to: "outcome:night-waking" },
      { rel: "associated-with", to: "outcome:glutamate-gaba-imbalance" },
      { rel: "associated-with", to: "system:brain-gaba-glutamate" }
    ],
    refs: ["article:penninx-2021-anxiety-disorders"]
  },
  {
    id: "disease:gastroparesis",
    type: "disease",
    name: "Gastroparesis",
    aliases: ["Gastroparesia", "Delayed gastric emptying syndrome"],
    summary: "Objectively delayed gastric emptying without mechanical obstruction, with nausea, vomiting, early satiety and bloating; causes include diabetes, surgery, drugs, viral injury and idiopathic neuropathy.",
    body: [
      "Diagnosis requires symptoms plus delayed emptying on scintigraphy or a validated breath test after excluding obstruction; symptoms and emptying times correlate poorly. Management covers dietary modification (small, low-fat, low-fibre meals), removal of opioids and other drugs, glycaemic control and prokinetics such as metoclopramide. The ACG 2013 guideline remains the main guide.",
      "Belching is not a diagnostic feature. The conversation proposes 'mild gastroparesis' from low acetylcholine; that is not an established cause ([[claim:undermethylation-causes-subclinical-vagal-dysfunction]]). The vagus is central to the stomach's motor control ([[system:vagal-tone]]). Educational only."
    ],
    evidence: "established",
    facts: { icd10: "K31.84 (ICD-10-CM)", mesh: "D018589" },
    relations: [
      { rel: "causes", to: "outcome:delayed-gastric-emptying" },
      { rel: "measured-by", to: "outcome:delayed-gastric-emptying" },
      { rel: "associated-with", to: "state:gastric-dysmotility" },
      { rel: "associated-with", to: "system:vagal-tone" }
    ],
    refs: ["article:camilleri-2022-acg-gastroparesis"]
  },
  {
    id: "disease:functional-dyspepsia",
    type: "disease",
    name: "Functional dyspepsia",
    aliases: ["Dispepsia funcional", "Non-ulcer dyspepsia", "Postprandial distress syndrome", "Epigastric pain syndrome"],
    summary: "Chronic epigastric pain, burning, fullness or early satiety with no structural cause (Rome IV); mechanisms include impaired accommodation, hypersensitivity, delayed emptying, duodenal inflammation.",
    body: [
      "Rome IV splits functional dyspepsia into postprandial distress and epigastric pain syndromes. Evidence-supported options include H. pylori test-and-treat (small benefit, number needed to treat about 15), PPIs, prokinetics, tricyclic antidepressants and some herbal products. Belching disorders are classified separately but frequently coexist ([[disease:aerophagia-belching-disorders]]).",
      "The conversation's ginger and artichoke suggestions have partial support only ([[claim:ginger-prokinetic-5ht4-mmc]]). Because alarm features such as weight loss, anaemia or dysphagia change management, new persistent dyspepsia needs medical review. Educational only."
    ],
    evidence: "established",
    facts: { icd10: "K30", mesh: "D004415 (Dyspepsia)" },
    relations: [
      { rel: "manifests-as", to: "outcome:belching" },
      { rel: "manifests-as", to: "outcome:delayed-gastric-emptying", note: "A subset only." },
      { rel: "associated-with", to: "disease:h-pylori-infection" },
      { rel: "associated-with", to: "state:gastric-dysmotility" },
      { rel: "associated-with", to: "system:duodenum" }
    ],
    refs: ["article:stanghellini-2016-rome-iv-gastroduodenal", "article:malfertheiner-2022-maastricht-vi"]
  },
  {
    id: "disease:aerophagia-belching-disorders",
    type: "disease",
    name: "Aerophagia and belching disorders",
    aliases: ["Transtornos de eructação", "Supragastric belching", "Excessive gastric belching", "Aerofagia", "Arrotos excessivos"],
    summary: "Rome IV disorders of bothersome belching: supragastric (a learned air-swallow and expel behaviour) and gastric; impedance distinguishes them; treatment is behavioural.",
    body: [
      "Belching is usually air swallowed with food, drink, saliva and anxiety, then vented. Gastric belching is a vagally mediated reflex via transient LES relaxation after gastric distension; supragastric belching is an unconscious behaviour in which air is sucked into the oesophagus and immediately expelled, often triggered by reflux sensations or anxiety. Rome IV requires impedance-based classification and recommends diaphragmatic breathing and CBT, with a controlled trial showing about 60% of PPI-refractory patients cut belching by at least half ([[intervention:diaphragmatic-breathing]], [[claim:belching-mostly-swallowed-air]]).",
      "Chemical gas can add to the load: sodium bicarbonate or effervescent products meeting stomach acid release CO2 ([[claim:acid-bicarbonate-reaction-gives-co2-belching]], [[outcome:co2-gastric-distension]]). The conversation's chain (glycine, gastrin, acid, duodenal bicarbonate, CO2 and SIBO) is not supported, though a swallowed-air component, carbonated drinks and eating speed should be considered. Educational only."
    ],
    evidence: "established",
    facts: { icd10: "R14.2 (eructation, ICD-10-CM)", criteria: "Rome IV: bothersome belching more than 3 days a week for the last 3 months, onset at least 6 months ago" },
    relations: [
      { rel: "manifests-as", to: "outcome:belching" },
      { rel: "associated-with", to: "outcome:co2-gastric-distension" },
      { rel: "associated-with", to: "system:lower-esophageal-sphincter" },
      { rel: "measured-by", to: "outcome:reflux-episodes", note: "Impedance-pH separates gastric from supragastric belching." },
      { rel: "associated-with", to: "disease:gerd" }
    ],
    refs: ["article:stanghellini-2016-rome-iv-gastroduodenal", "article:ong-2018-diaphragmatic-breathing-belching"]
  },
  {
    id: "disease:mthfr-deficiency",
    type: "disease",
    name: "Severe MTHFR deficiency",
    aliases: ["Deficiência de MTHFR", "MTHFR deficiency (homocystinuria type)", "Severe MTHFR deficiency"],
    summary: "A rare recessive inborn error with very low MTHFR activity causing homocystinuria, low methionine and neurological disease; unlike the common C677T variant, which mildly raises homocysteine at most.",
    body: [
      "[[enzyme:mthfr]] reduces methylene-THF to [[compound:5-mthf|5-methyl-THF]], the methyl donor for remethylating [[compound:homocysteine]]. Severe deficiency (OMIM 236250) presents from infancy to adulthood with developmental delay, seizures, psychiatric features and thromboembolism, and is treated with betaine, folate forms and B12. Betaine ([[intervention:betaine-anhydrous]]) bypasses the block through [[enzyme:bhmt]].",
      "The widespread 'MTHFR mutation' marketing refers to the common C677T (rs1801133) polymorphism, which reduces enzyme activity by a modest fraction in TT homozygotes and has no proven clinical effect when folate status is adequate; routine testing is not recommended. Do not equate the two. Educational only."
    ],
    evidence: "established",
    facts: { omim: "236250", icd10: "E72.12" },
    relations: [
      { rel: "decreases", to: "compound:5-mthf" },
      { rel: "causes", to: "state:hyperhomocysteinemia" },
      { rel: "manifests-as", to: "outcome:elevated-homocysteine" },
      { rel: "interacts-with", to: "enzyme:mthfr" }
    ],
    refs: ["article:froese-2016-mthfr-deficiency"]
  },
  {
    id: "disease:pyroluria-kpu",
    type: "disease",
    name: "Pyroluria / kryptopyrroluria (KPU)",
    aliases: ["Piroluria", "Pyrrole disorder", "Mauve factor", "Kryptopyrrole", "HPL elevated urine", "KPU"],
    summary: "Alleged condition in which urinary pyrroles (HPL) bind B6 and zinc and cause psychiatric symptoms. Contested and not recognised: assay validity is disputed and no controlled trials exist.",
    body: [
      "The 'mauve factor' was first reported in the 1950s and attributed to kryptopyrrole; later analytical work found kryptopyrrole absent in urine and the compound was reassigned to hydroxyhemopyrrolin-2-one (HPL), a haem-derived product. Proponents say elevated HPL increases excretion of B6 and zinc and causes anxiety, mood swings, poor stress tolerance, pale skin, stretch marks and white nail spots, and recommend zinc and P5P. A systematic review (Pyroluria: Fact or Fiction?) found few studies showing higher HPL in psychiatric groups, no placebo-controlled treatment trials, and no demonstration that HPL increases B6 or zinc loss; urobilinogen interferes with the assay and the test is not endorsed by mainstream laboratories.",
      "The source conversation mentions pyroluria in passing as a cause of functional B6 deficiency ([[claim:pyroluria-causes-b6-zinc-deficiency]], [[state:b6-functional-deficiency]]). Treat it as unvalidated; any B6 or zinc supplementation should be decided with a clinician because high-dose B6 can cause neuropathy. Educational only."
    ],
    evidence: "speculative",
    facts: { status: "Not a recognised diagnosis; no ICD-10 code", marker: "Urinary HPL (hydroxyhemopyrrolin-2-one)" },
    relations: [
      { rel: "manifests-as", to: "outcome:urinary-hpl" },
      { rel: "measured-by", to: "outcome:urinary-hpl", note: "Assay validity disputed." },
      { rel: "associated-with", to: "state:b6-functional-deficiency", note: "Proposed, unproven." },
      { rel: "associated-with", to: "disease:anxiety-disorder" }
    ]
  },
  {
    id: "disease:fatty-liver-nafld",
    type: "disease",
    name: "Fatty liver disease (NAFLD / MASLD)",
    aliases: ["Esteatose hepática", "NAFLD", "MASLD", "Doença hepática gordurosa", "Metabolic dysfunction-associated steatotic liver disease"],
    summary: "Hepatic fat accumulation, now called MASLD, usually from metabolic syndrome; choline deficiency and PEMT variants can independently cause steatosis through impaired VLDL export.",
    body: [
      "Liver fat accumulates when lipid import and synthesis exceed export and oxidation. [[compound:choline]]-derived phosphatidylcholine is needed to assemble VLDL, so choline deficiency causes steatosis; the PEMT promoter variant rs12325817 makes postmenopausal women especially susceptible to low-choline diets ([[enzyme:pemt]], [[disease:choline-deficiency]]). The [[system:liver]] also hosts most [[enzyme:gnmt]] and [[enzyme:bhmt]] activity; GNMT knockout mice develop steatosis and tumours.",
      "The 2023 multisociety nomenclature renamed NAFLD to MASLD. The role of choline or betaine supplementation in ordinary MASLD is unproven, and the conversation's mechanistic story is not about liver disease; the link is mainly through the methyl budget ([[state:methyl-donor-depletion]]). Educational only."
    ],
    evidence: "established",
    facts: { icd10: "K76.0", mesh: "D065626" },
    relations: [
      { rel: "manifests-as", to: "outcome:hepatic-steatosis" },
      { rel: "associated-with", to: "state:methyl-donor-depletion" },
      { rel: "associated-with", to: "disease:choline-deficiency" },
      { rel: "associated-with", to: "system:liver" },
      { rel: "interacts-with", to: "enzyme:pemt" }
    ],
    refs: ["article:rinella-2023-fatty-liver-nomenclature", "article:resseguie-2011-pemt-estrogen-choline"]
  },
  {
    id: "disease:cardiovascular-disease",
    type: "disease",
    name: "Cardiovascular disease",
    aliases: ["Doença cardiovascular", "Atherosclerotic cardiovascular disease", "ASCVD"],
    summary: "Atherosclerotic and thrombotic disease of heart and vessels; homocysteine and TMAO are risk markers, but lowering homocysteine with B vitamins has not reduced heart attacks.",
    body: [
      "Established risk factors are LDL cholesterol, blood pressure, smoking, diabetes and age. [[compound:homocysteine]] is linked to vascular events in cohorts; yet the 2017 Cochrane review of 15 randomized trials found no effect of homocysteine-lowering B vitamins on myocardial infarction or death and only a small reduction in stroke ([[claim:homocysteine-lowering-reduces-cardiovascular-events]]). Gut-derived [[compound:tmao]] was linked to events by Hazen's group (2011), but renal function, diet source and fish intake complicate causal interpretation ([[claim:above-ul-tmao-endothelial-stress]]).",
      "Autonomic balance matters too: vagal (parasympathetic) tone slows heart rate and reduced heart-rate variability predicts risk ([[system:cardiac-autonomic-control]]). Nothing here is cardiovascular advice. Educational only."
    ],
    evidence: "established",
    facts: { icd10: "I00-I99 (circulatory system diseases)", mesh: "D002318" },
    relations: [
      { rel: "associated-with", to: "state:hyperhomocysteinemia" },
      { rel: "associated-with", to: "outcome:elevated-tmao" },
      { rel: "associated-with", to: "system:cardiac-autonomic-control" },
      { rel: "manifests-as", to: "outcome:tachycardia", note: "Non-specific; arrhythmias have many causes." }
    ],
    refs: ["article:marti-carvajal-2017-homocysteine-lowering-cochrane", "article:wang-2011-gut-flora-phosphatidylcholine-cvd"]
  },
  {
    id: "disease:neural-tube-defects",
    type: "disease",
    name: "Neural tube defects",
    aliases: ["Defeitos do tubo neural", "Spina bifida", "Anencephaly"],
    summary: "Failure of neural tube closure in early pregnancy (spina bifida, anencephaly); folic acid before and during early pregnancy prevents a large fraction, the best-proven methylation-related intervention.",
    body: [
      "The MRC Vitamin Study (1991) showed that 4 mg folic acid reduced recurrence by about 72%, and public-health policy recommends 400 micrograms daily for women who could become pregnant, plus fortification in many countries. Risk is also associated with low maternal B12, high homocysteine, low choline and certain folate-pathway variants; mechanisms involve one-carbon supply for nucleotide synthesis and methylation ([[state:hyperhomocysteinemia]], [[pathway:folate-cycle]]).",
      "Whether [[intervention:methylfolate-supplement|methylfolate]] is as effective as folic acid for NTD prevention is a topic of review; EFSA regards the forms as equivalent for dietary folate at lower doses ([[claim:folic-acid-competes-with-methylfolate]]). Pregnancy planning advice belongs with a clinician. Educational only."
    ],
    evidence: "established",
    facts: { icd10: "Q00 (anencephaly), Q05 (spina bifida)", mesh: "D009436", omim: "182940 (susceptibility)" },
    relations: [
      { rel: "associated-with", to: "state:hyperhomocysteinemia" },
      { rel: "associated-with", to: "compound:choline", note: "Observational association with low maternal choline." },
      { rel: "associated-with", to: "intervention:methylfolate-supplement" },
      { rel: "associated-with", to: "pathway:folate-cycle" }
    ],
    refs: ["article:mrc-1991-folic-acid-neural-tube-defects", "article:efsa-2022-5-mthf-dietary-folate-equivalents"]
  },
  {
    id: "disease:atrophic-gastritis",
    type: "disease",
    name: "Atrophic gastritis",
    aliases: ["Gastrite atrófica", "Autoimmune gastritis", "Gastrite autoimune", "Pernicious anaemia gastritis"],
    summary: "Loss of gastric glands, caused by long-standing H. pylori or autoimmunity, producing hypochlorhydria, hypergastrinaemia, B12 and iron deficiency and raised gastric tumour risk.",
    body: [
      "In autoimmune gastritis, antibodies against parietal cells and intrinsic factor destroy the oxyntic mucosa, causing achlorhydria, B12 malabsorption (pernicious anaemia), iron deficiency and enterochromaffin-like cell hyperplasia. H. pylori-related atrophy is the other major cause. Diagnosis rests on serology, serum pepsinogen/gastrin patterns and biopsy.",
      "It is a clear example of true hypochlorhydria with measurable biochemical consequences ([[state:hypochlorhydria]], [[disease:vitamin-b12-deficiency]]), unlike the 'functional' hypochlorhydria often assumed in wellness settings. Hypergastrinaemia in this setting is a result of low acid, not a cause ([[compound:gastrin]]). Educational only."
    ],
    evidence: "established",
    facts: { icd10: "K29.4 (chronic atrophic gastritis)", "associated-markers": "Low pepsinogen I/ratio, high gastrin, anti-parietal cell antibodies" },
    relations: [
      { rel: "causes", to: "state:hypochlorhydria" },
      { rel: "causes", to: "disease:vitamin-b12-deficiency" },
      { rel: "increases", to: "compound:gastrin" },
      { rel: "associated-with", to: "disease:h-pylori-infection" },
      { rel: "part-of", to: "disease:gastritis" }
    ],
    refs: ["article:lenti-2020-autoimmune-gastritis"]
  },
  {
    id: "disease:vitamin-b12-deficiency",
    type: "disease",
    name: "Vitamin B12 deficiency",
    aliases: ["Deficiência de B12", "Cobalamin deficiency", "Pernicious anaemia"],
    summary: "Low cobalamin from malabsorption (atrophic gastritis, PPIs, metformin, ileal disease) or diet; it causes megaloblastic anaemia, neuropathy and raised homocysteine and methylmalonic acid.",
    body: [
      "Cobalamin is a cofactor for methionine synthase and methylmalonyl-CoA mutase, so deficiency traps folate as [[compound:5-mthf|5-methyl-THF]] ([[state:folate-trap]]), raises [[compound:homocysteine]] and methylmalonic acid, and may cause irreversible neurological damage if untreated. Risk groups include older adults, vegans, people with [[disease:atrophic-gastritis]], long-term [[intervention:ppi-therapy|PPIs]] or metformin users and those with bowel resection.",
      "Large doses of folic acid can mask the haematological signs while neuropathy progresses. Diagnosis and treatment (oral or intramuscular B12) require clinical evaluation. Educational only."
    ],
    evidence: "established",
    facts: { icd10: "E53.8; D51.0 (pernicious anaemia)", mesh: "D014806" },
    relations: [
      { rel: "causes", to: "state:folate-trap" },
      { rel: "causes", to: "state:hyperhomocysteinemia" },
      { rel: "manifests-as", to: "outcome:elevated-homocysteine" },
      { rel: "manifests-as", to: "outcome:brain-fog", note: "Cognitive slowing and neuropathy can occur." }
    ],
    refs: ["article:stabler-2013-vitamin-b12-deficiency"]
  },
  {
    id: "disease:cbs-deficiency",
    type: "disease",
    name: "Classical homocystinuria (CBS deficiency)",
    aliases: ["Homocistinúria clássica", "CBS deficiency", "Cystathionine beta-synthase deficiency"],
    summary: "Recessive CBS defect causing very high homocysteine and methionine, lens dislocation, thrombosis and learning difficulty; some patients respond to pharmacological B6, others need diet and betaine.",
    body: [
      "CBS needs [[compound:plp]] to condense homocysteine with serine. B6-responsive patients may need only pyridoxine; others use a methionine-restricted diet and betaine ([[intervention:betaine-anhydrous]]), which drives remethylation via [[enzyme:bhmt]] but can raise methionine to dangerous levels in some patients. This is a powerful example of why 'more methyl donor' is not universally benign.",
      "The condition is diagnosed through newborn screening or plasma amino acids. It illustrates how severe inborn errors differ from common nutritional variation. Educational only."
    ],
    evidence: "established",
    facts: { omim: "236200", icd10: "E72.11", mesh: "D006712 (Homocystinuria)" },
    relations: [
      { rel: "causes", to: "state:hyperhomocysteinemia" },
      { rel: "manifests-as", to: "outcome:elevated-homocysteine" },
      { rel: "associated-with", to: "compound:plp", note: "B6-responsive forms exist." },
      { rel: "associated-with", to: "pathway:transsulfuration" }
    ],
    refs: ["article:morris-2017-cbs-deficiency-guidelines"]
  },
  {
    id: "disease:vitamin-b6-deficiency",
    type: "disease",
    name: "Vitamin B6 deficiency",
    aliases: ["Deficiência de vitamina B6", "Pyridoxine deficiency"],
    summary: "True B6 deficiency causes dermatitis, glossitis, neuropathy and infant seizures (via reduced GABA); uncommon, but occurs with alcoholism, renal disease and certain drugs.",
    body: [
      "Frank deficiency lowers [[compound:plp]] and impairs [[enzyme:gad]] (less [[compound:gaba]]), transaminases, haem synthesis and one-carbon metabolism; infants may seize and respond to pyridoxine. Severe adult deficiency is rare because B6 is widespread in foods; risk groups include alcohol use disorder, uraemia, malabsorption and isoniazid therapy. Excess intake is also harmful (sensory neuropathy at chronic high doses).",
      "The conversation's 'functional B6 deficiency' differs from frank deficiency and is untested ([[state:b6-functional-deficiency]], [[claim:undermethylated-have-functional-b6-deficiency]]). Educational only."
    ],
    evidence: "established",
    facts: { icd10: "E53.1" },
    relations: [
      { rel: "causes", to: "state:b6-functional-deficiency" },
      { rel: "manifests-as", to: "outcome:low-plp-status" },
      { rel: "manifests-as", to: "outcome:glutamate-gaba-imbalance" },
      { rel: "decreases", to: "compound:gaba" }
    ],
    refs: ["article:parra-2018-vitamin-b6-metabolism"]
  },
  {
    id: "disease:nonketotic-hyperglycinemia",
    type: "disease",
    name: "Non-ketotic hyperglycinaemia (glycine encephalopathy)",
    aliases: ["Hiperglicinemia não cetótica", "NKH", "Glycine encephalopathy"],
    summary: "A rare inborn error of the glycine cleavage system with very high glycine, severe neonatal encephalopathy and seizures; glycine supplements are contraindicated.",
    body: [
      "Defects in the glycine cleavage system (genes GLDC, AMT, GCSH) raise glycine in blood and especially CSF, over-activating NMDA receptors. Treatment includes sodium benzoate to scavenge glycine and NMDA antagonists. It highlights that glycine metabolism is tightly gated by [[enzyme:glycine-cleavage-system]] and that supplementing glycine is not harmless in people with this defect.",
      "It is unrelated to ordinary glycine tolerance; belching or reflux on glycine powder has nothing to do with NKH ([[outcome:glycine-intolerance]]). Educational only."
    ],
    evidence: "established",
    facts: { omim: "605899", icd10: "E72.51 (ICD-10-CM)" },
    relations: [
      { rel: "increases", to: "compound:glycine" },
      { rel: "associated-with", to: "enzyme:glycine-cleavage-system" },
      { rel: "associated-with", to: "pathway:folate-cycle", note: "The GCS donates one-carbon units to the folate pool." }
    ],
    refs: ["article:applegarth-2004-glycine-encephalopathy"]
  },
  {
    id: "disease:osteoarthritis",
    type: "disease",
    name: "Osteoarthritis",
    aliases: ["Osteoartrite", "Joint cartilage degeneration", "artrose"],
    summary: "Degeneration of joint cartilage and bone; type II collagen is its main cartilage protein. Undenatured type II collagen and glycine have been tried in small, mixed trials; no established benefit.",
    body: [
      "Articular cartilage is rich in type II [[compound:collagen]]. Undenatured type II collagen (UC-II) at about 40 mg/day, acting through oral tolerance rather than as an amino-acid source, improved knee symptoms in a trial (Lugo 2016), and collagen hydrolysates have shown mixed results. A hypothesis paper proposes that high glycine (about 10 g/day) boosts chondrocyte collagen synthesis in vitro and that glycine insufficiency may contribute to osteoarthritis ([[state:glycine-insufficiency]]).",
      "A gram of dietary collagen peptide is not equivalent to a gram of glycine, and a typical 10 g collagen hydrolysate provides around 2-3 g glycine ([[claim:collagen-ii-33-percent-glycine]]). Educational only."
    ],
    evidence: "plausible",
    facts: { icd10: "M15-M19", mesh: "D010003" },
    relations: [
      { rel: "associated-with", to: "state:glycine-insufficiency" },
      { rel: "associated-with", to: "compound:collagen" },
      { rel: "associated-with", to: "outcome:collagen-synthesis-adequacy" },
      { rel: "associated-with", to: "system:connective-tissue" }
    ],
    refs: ["article:lugo-2016-uc-ii-knee-osteoarthritis", "article:bello-2006-collagen-hydrolysate-osteoarthritis"]
  },
  {
    id: "disease:choline-deficiency",
    type: "disease",
    name: "Choline deficiency",
    aliases: ["Deficiência de colina", "Choline-deficiency syndrome"],
    summary: "Insufficient choline intake or synthesis causing fatty liver, liver and muscle damage; risk is increased in postmenopausal women with PEMT variants, pregnancy and parenteral nutrition without choline.",
    body: [
      "Choline is an essential nutrient: endogenous PEMT synthesis does not fully meet needs, so dietary intake (egg, liver, meat, fish, soy) matters. In controlled depletion studies, most men and postmenopausal women (and fewer premenopausal women) developed fatty liver or muscle damage; the PEMT promoter variant rs12325817 sharply increases susceptibility in women who have low oestrogen. EFSA estimates adequate intake at 400 mg/day for adults, and many populations fall below the IOM AI.",
      "Choline is the substrate of the phosphatidylcholine, [[compound:acetylcholine]] and betaine routes ([[state:methyl-donor-depletion]]). Deficiency is a legitimate concern in specific groups, but it is not the same as 'undermethylation' as defined by the Walsh protocol. Educational only."
    ],
    evidence: "established",
    facts: { "EFSA-AI-adults": "400 mg/day", "IOM-AI-men": "550 mg/day; women 425 mg/day" },
    relations: [
      { rel: "causes", to: "disease:fatty-liver-nafld" },
      { rel: "manifests-as", to: "outcome:hepatic-steatosis" },
      { rel: "associated-with", to: "state:methyl-donor-depletion" },
      { rel: "interacts-with", to: "enzyme:pemt" }
    ],
    refs: ["article:zeisel-1991-choline-essential-nutrient", "article:resseguie-2011-pemt-estrogen-choline", "article:efsa-2016-choline-dri"]
  },
  {
    id: "disease:esophagitis",
    type: "disease",
    name: "Reflux oesophagitis (erosive oesophagitis)",
    aliases: ["esofagite", "esofagite erosiva", "esofagite de refluxo", "reflux esophagitis", "erosive esophagitis"],
    summary: "Visible inflammation or erosions of the oesophageal lining from acid reflux, the erosive form of GERD; it heals with acid suppression, and irritant supplements or oils are usually avoided.",
    body: [
      "Not everyone with reflux symptoms has visible damage: some have erosive disease (oesophagitis seen at endoscopy) and others have non-erosive reflux disease. Oesophagitis is graded by the extent of mucosal breaks, and acid suppression with a PPI heals most cases ([[disease:gerd]], [[article:katz-2022-acg-gerd-guideline]], [[intervention:ppi-therapy]]).",
      "Practical relevance on this site: acid-releasing or pungent products are avoided on inflamed lining, which is why betaine HCl and concentrated oregano oil carry cautions ([[intervention:betaine-hcl]], [[intervention:oregano-oil]], [[claim:oregano-phenols-burn-inflamed-mucosa]]). Throat symptoms without oesophageal damage are classed separately ([[disease:lpr]]). Persistent burning, trouble swallowing or weight loss need medical assessment. Educational only."
    ],
    evidence: "established",
    facts: { icd10: "K21.0 (GERD with oesophagitis); K20 (oesophagitis)" },
    relations: [
      { rel: "manifests-as", to: "outcome:heartburn" },
      { rel: "measured-by", to: "outcome:reflux-episodes" },
      {
        rel: "associated-with",
        to: "disease:lpr",
        note: "Both are reflux-related; oesophagitis is oesophageal injury, LPR a throat label."
      },
      { rel: "associated-with", to: "system:lower-esophageal-sphincter" }
    ],
    refs: ["article:katz-2022-acg-gerd-guideline"]
  },
  {
    id: "disease:gastritis",
    type: "disease",
    name: "Gastritis and duodenitis",
    aliases: [
      "gastrite",
      "gastrite erosiva",
      "duodenite",
      "gastroduodenite",
      "gastrite crônica",
      "erosive gastritis",
      "duodenitis"
    ],
    summary: "Inflammation of the stomach or duodenal lining, most often from H. pylori, also NSAIDs, alcohol, bile reflux or autoimmunity; erosive forms expose the mucosa and make acid painful.",
    body: [
      "Gastritis is inflammation of the stomach lining and duodenitis the same in the first part of the small intestine. Many cases cause no symptoms. The commonest cause is infection with Helicobacter pylori ([[disease:h-pylori-infection]]); others are anti-inflammatory painkillers (NSAIDs), heavy alcohol, bile reflux ([[state:duodenogastric-reflux]]) and autoimmune attack ([[disease:atrophic-gastritis]]). Erosive forms have surface defects short of a full ulcer ([[disease:peptic-ulcer]]). The Kyoto consensus classifies chronic gastritis and duodenitis by cause and pattern ([[article:sugano-2015-kyoto-gastritis-consensus]]).",
      "The source conversation reasons that after ulcers the lining may still have \"microscopic erosive gastritis, residual duodenitis or a thinned mucus barrier\", which would make acid from betaine HCl burn ([[intervention:betaine-hcl]], [[claim:betaine-hcl-contraindicated-post-ulcer]]). Whether residual inflammation is present can only be shown by endoscopy and biopsy; burning on acid contact fits the picture but is non-specific ([[state:post-ulcer-mucosal-recovery]], [[system:mucosal-barrier]]). Educational only."
    ],
    evidence: "established",
    facts: { icd10: "K29 (gastritis and duodenitis)" },
    relations: [
      {
        rel: "associated-with",
        to: "disease:peptic-ulcer",
        note: "Same aggressive factors; ulcers are deeper breaks."
      },
      { rel: "associated-with", to: "state:duodenogastric-reflux" },
      { rel: "measured-by", to: "outcome:h-pylori-test-result", note: "Testing for the commonest cause." },
      { rel: "associated-with", to: "system:mucosal-barrier" }
    ],
    refs: [
      "article:sugano-2015-kyoto-gastritis-consensus",
      "article:malfertheiner-2022-maastricht-vi",
      "article:lenti-2020-autoimmune-gastritis"
    ]
  }
];
