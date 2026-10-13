// Systems: organs, tissues, compartments and neural/microbial control systems.
// Educational content only; nothing here is a diagnosis or medical advice.
export default [
  {
    id: "system:vagal-tone",
    type: "system",
    name: "Vagal tone (parasympathetic control)",
    aliases: ["Tônus vagal", "Nervo vago", "Vagus nerve activity", "Parasympathetic tone"],
    summary: "Activity of the vagus nerve, which releases acetylcholine to slow the heart, drive gastric acid secretion and antral contractions, coordinate the LES and relax the pylorus; measured indirectly (HRV).",
    body: [
      "Vagal efferents release [[compound:acetylcholine]] onto M2 receptors in the sinoatrial node ([[system:cardiac-autonomic-control]]) and onto stomach nerves and parietal cells ([[pathway:gastric-acid-secretion]], [[system:gastric-physiology]]). The vagus also coordinates swallowing-related relaxation and vago-vagal reflexes of the [[system:lower-esophageal-sphincter]]. Vagal tone is commonly estimated from heart-rate variability.",
      "The source conversation links low vagal signal to gastroparesis, LES relaxation and belching and proposes that methyl-donor drain lowers choline and acetylcholine. Choline availability rarely limits acetylcholine synthesis in people with adequate intake, so this chain is speculative ([[claim:undermethylation-causes-subclinical-vagal-dysfunction]], [[claim:pemt-pc-is-endogenous-choline-for-acetylcholine]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "increases", to: "compound:acetylcholine", note: "Vagal efferents are cholinergic." },
      { rel: "increases", to: "pathway:gastric-acid-secretion" },
      { rel: "interacts-with", to: "system:enteric-nervous-system" },
      { rel: "associated-with", to: "state:gastric-dysmotility" },
      { rel: "associated-with", to: "system:cardiac-autonomic-control" }
    ],
    refs: ["article:browning-2014-vagal-control-gi", "article:gordan-2015-autonomic-cardiovascular-control"]
  },
  {
    id: "system:gastric-physiology",
    type: "system",
    name: "Gastric physiology (stomach)",
    aliases: ["Fisiologia gástrica", "Stomach", "Estômago", "Gastric secretion and motility"],
    summary: "The stomach's functions: acid and pepsin secretion, mucus-bicarbonate protection, storage and mixing, and regulated emptying into the duodenum under vagal, hormonal and enteric control.",
    body: [
      "Parietal cells secrete [[compound:hydrochloric-acid]] (stimulated by gastrin, histamine, acetylcholine; inhibited by somatostatin and duodenal feedback), chief cells release pepsinogen, which acid converts to [[compound:pepsin]], and G cells release [[compound:gastrin]] ([[pathway:gastric-acid-secretion]]). The fundus accommodates, the antrum grinds, and the [[system:pylorus]] meters emptying. The fasting stomach hosts migrating motor complexes that sweep residue into the small intestine.",
      "Most hypotheses in the source conversation are about this organ: gastrin, acid, pH, CO2 and delayed emptying. Of those, the amino-acid effect on gastrin is well studied (glycine showed none in humans), and CO2 formation matters mainly when bicarbonate is ingested ([[claim:free-glycine-stimulates-gastrin]], [[claim:acid-bicarbonate-reaction-gives-co2-belching]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "increases", to: "compound:hydrochloric-acid" },
      { rel: "increases", to: "compound:pepsin" },
      { rel: "interacts-with", to: "compound:gastrin" },
      { rel: "associated-with", to: "system:mucosal-barrier" },
      { rel: "associated-with", to: "system:pylorus" },
      { rel: "associated-with", to: "outcome:delayed-gastric-emptying" }
    ],
    refs: ["article:schubert-2008-gastric-acid-secretion-control", "article:browning-2014-vagal-control-gi"]
  },
  {
    id: "system:gut-microbiota",
    type: "system",
    name: "Gut microbiota",
    aliases: ["Microbiota intestinal", "Microbiota alta", "Upper gut microbes", "Gut flora"],
    summary: "The microbial communities of the gut, dense in the colon and sparse in the stomach and proximal small bowel; they ferment substrates, make TMA, deconjugate bile acids and respond to acid suppression.",
    body: [
      "The healthy stomach and proximal small bowel hold relatively few bacteria because of acid, bile, motility and immune defences; counts rise distally. Microbes make hydrogen, methane, short-chain fatty acids and [[compound:trimethylamine]] from [[compound:choline]], and deconjugate and transform [[compound:bile-acids]] ([[system:bile]]). Excess proximal colonisation is [[disease:sibo]], whose diagnosis is imprecise.",
      "Some anaerobes can metabolise glycine (glycine reductase in Stickland fermentation; glycine cleavage system), releasing ammonia (and CO2 via the cleavage system), but no human data show that this causes belching after glycine powder ([[claim:sibo-bacteria-metabolize-glycine-co2-nh3]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "increases", to: "compound:trimethylamine" },
      { rel: "increases", to: "outcome:breath-hydrogen-methane" },
      { rel: "interacts-with", to: "system:bile" },
      { rel: "associated-with", to: "disease:sibo" },
      { rel: "associated-with", to: "state:acid-suppression" }
    ],
    refs: ["article:ridlon-2014-bile-acids-microbiome", "article:pimentel-2020-acg-sibo-guideline"]
  },
  {
    id: "system:bile",
    type: "system",
    name: "Bile (biliary system)",
    aliases: ["Bile", "Bílis", "Sistema biliar", "Biliary secretion"],
    summary: "Bile made by the liver and stored in the gallbladder; contains bile acids conjugated to glycine or taurine, phospholipid and bicarbonate, and emulsifies fats, neutralises acid and clears cholesterol.",
    body: [
      "Hepatocytes conjugate [[compound:bile-acids]] with [[compound:glycine]] or [[compound:taurine]] ([[pathway:bile-acid-conjugation]]); in humans about three quarters are glycine-conjugated. Early human studies found that large glycine doses (about 20 g/day) did not shift the pattern, while taurine supplements did ([[claim:glycine-overload-shifts-bile-conjugation-and-reflux]]). Bile can reflux into the stomach through an incompetent pylorus ([[system:pylorus]]), but there is no evidence that glycine conjugation changes that risk.",
      "The conversation's idea that glyco-conjugated bile alters surface tension and promotes alkaline reflux is unsupported. Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "interacts-with", to: "compound:bile-acids" },
      { rel: "interacts-with", to: "pathway:bile-acid-conjugation" },
      { rel: "interacts-with", to: "system:gut-microbiota" },
      { rel: "associated-with", to: "system:liver" },
      { rel: "associated-with", to: "system:duodenum" }
    ],
    refs: ["article:sjovall-1959-glycine-taurine-bile-conjugation", "article:ridlon-2014-bile-acids-microbiome"]
  },
  {
    id: "system:lower-esophageal-sphincter",
    type: "system",
    name: "Lower oesophageal sphincter (LES)",
    aliases: ["Esfíncter esofágico inferior", "EEI", "LES", "Esophagogastric junction"],
    summary: "The tonic muscular barrier between oesophagus and stomach, reinforced by the crural diaphragm; transient relaxations vent gas as belches and account for most reflux events.",
    body: [
      "Basal pressure comes from intrinsic muscle tone and the crural diaphragm; vagal reflexes trigger transient LES relaxations after gastric distension, enabling gastric belching and sometimes reflux ([[outcome:belching]], [[outcome:reflux-episodes]]). Hiatal hernia, obesity and delayed emptying increase reflux ([[disease:gerd]]).",
      "The claim that mildly higher gastric pH delays LES closure has no direct support ([[claim:higher-ph-delays-les-closure-and-pylorus]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "disease:gerd" },
      { rel: "associated-with", to: "outcome:belching" },
      { rel: "interacts-with", to: "system:vagal-tone" },
      { rel: "associated-with", to: "outcome:reflux-episodes" }
    ],
    refs: ["article:mittal-1997-esophagogastric-junction"]
  },
  {
    id: "system:enteric-nervous-system",
    type: "system",
    name: "Enteric nervous system",
    aliases: ["Sistema nervoso entérico", "ENS", "Gut brain", "Myenteric plexus"],
    summary: "The gut's intrinsic nervous system (myenteric and submucosal plexuses) that controls peristalsis, secretion and blood flow; cholinergic neurons drive contraction, and the vagus modulates it.",
    body: [
      "Enteric neurons use [[compound:acetylcholine]] for excitatory motor and secretory signals, and nitric oxide and VIP for inhibition; serotonin from enterochromaffin cells starts peristaltic reflexes. The ENS can run reflexes locally, which is why motility persists after vagotomy ([[system:vagal-tone]]). Ginger constituents inhibit 5-HT3 receptors on enteric neurons in vitro ([[claim:ginger-prokinetic-5ht4-mmc]]).",
      "Damage to enteric neurons, interstitial cells of Cajal or the vagus is a recognised basis of [[disease:gastroparesis]]. Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "interacts-with", to: "system:vagal-tone" },
      { rel: "interacts-with", to: "compound:acetylcholine" },
      { rel: "associated-with", to: "state:gastric-dysmotility" },
      { rel: "associated-with", to: "disease:gastroparesis" }
    ],
    refs: ["article:furness-2012-enteric-nervous-system"]
  },
  {
    id: "system:liver",
    type: "system",
    name: "Liver (methyl metabolism hub)",
    aliases: ["Fígado", "Hepatic metabolism", "Hepatocytes"],
    summary: "The main site of methionine cycling: most GNMT, BHMT, PEMT and MAT1A activity, creatine precursor and phosphatidylcholine synthesis, bile formation and choline oxidation to betaine.",
    body: [
      "Hepatocytes host [[enzyme:gnmt]] (about 1% of cytosolic protein in rodent liver), [[enzyme:bhmt]], [[enzyme:pemt]] and the transsulfuration pathway ([[pathway:methionine-cycle]]). Choline is oxidised to [[compound:betaine]] in liver and kidney mitochondria ([[pathway:choline-oxidation]]). The liver produces [[compound:phosphatidylcholine]] for VLDL and bile ([[system:bile]]). Disorders of these pathways cause fatty liver ([[disease:fatty-liver-nafld]]).",
      "Glycine made from choline inside hepatocytes never sees the gut lumen; this is the plausible basis for the conversation's point that choline-derived glycine causes no gas, although that point is logical rather than measured ([[claim:choline-derived-glycine-silent]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "interacts-with", to: "enzyme:gnmt" },
      { rel: "interacts-with", to: "enzyme:bhmt" },
      { rel: "interacts-with", to: "enzyme:pemt" },
      { rel: "associated-with", to: "pathway:methionine-cycle" },
      { rel: "associated-with", to: "disease:fatty-liver-nafld" }
    ],
    refs: ["article:mato-2008-methionine-metabolism-liver", "article:ueland-2011-choline-betaine"]
  },
  {
    id: "system:duodenum",
    type: "system",
    name: "Duodenum and proximal small bowel",
    aliases: ["Duodeno", "Bulbo duodenal", "Duodenal bulb", "Intestino delgado proximal"],
    summary: "The first part of the small bowel, where acid chyme meets pancreatic and biliary bicarbonate, sets feedback on emptying and motilin/secretin release, and where duodenal ulcers occur.",
    body: [
      "Acid entering the duodenal bulb is neutralised by duodenal mucosal bicarbonate and pancreatic and biliary secretions ([[system:pancreas-bicarbonate]]); duodenal acid and nutrients trigger [[compound:secretin]], CCK and feedback that slows gastric emptying. Duodenal pH also governs interdigestive motility: in humans gastric phase III activity did not occur until duodenal pH exceeded about 7, and acid blocked it ([[claim:acid-drives-secretin-motilin-mmc]]). Hyperacidity, H. pylori and NSAIDs cause duodenal ulcers ([[disease:peptic-ulcer]]).",
      "CO2 formed from bicarbonate neutralisation in the duodenum is largely absorbed locally and does not obviously reach the stomach ([[outcome:co2-gastric-distension]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "interacts-with", to: "system:pancreas-bicarbonate" },
      { rel: "associated-with", to: "disease:peptic-ulcer" },
      { rel: "associated-with", to: "compound:bicarbonate" },
      { rel: "associated-with", to: "system:bile" },
      { rel: "associated-with", to: "disease:functional-dyspepsia" }
    ],
    refs: ["article:allen-2005-mucus-bicarbonate-barrier"]
  },
  {
    id: "system:pancreas-bicarbonate",
    type: "system",
    name: "Pancreatic bicarbonate secretion",
    aliases: ["Bicarbonato pancreático", "Pancreatic ductal secretion", "Secretin-driven bicarbonate"],
    summary: "Pancreatic duct cells secrete a bicarbonate-rich fluid in response to secretin when acid reaches the duodenum, neutralising chyme and optimising pH for digestive enzymes.",
    body: [
      "Secretin released by duodenal S cells at low luminal pH stimulates ductal secretion of [[compound:bicarbonate]], which reacts with HCl in the duodenal lumen to form CO2 and water. This system is downstream of the pylorus, so it normally does not generate gas in the stomach ([[outcome:co2-gastric-distension]]). Together with biliary bicarbonate and mucosal secretion, it protects the duodenum ([[system:duodenum]]).",
      "Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "increases", to: "compound:bicarbonate" },
      { rel: "decreases", to: "compound:hydrochloric-acid", note: "Neutralises acid in the duodenal lumen." },
      { rel: "associated-with", to: "system:duodenum" },
      { rel: "associated-with", to: "outcome:co2-gastric-distension" }
    ],
    refs: ["article:allen-2005-mucus-bicarbonate-barrier"]
  },
  {
    id: "system:larynx-pharynx",
    type: "system",
    name: "Larynx and pharynx",
    aliases: ["Laringe e faringe", "Hypopharynx", "Upper aerodigestive tract"],
    summary: "The voice box and throat, lined by epithelium with less mucus and buffering than the oesophagus; pepsin and acid can irritate it, and many unrelated factors cause throat burning.",
    body: [
      "Laryngeal epithelium has fewer protective mucins and lower carbonic anhydrase III than oesophageal epithelium. Pepsin can be taken up by hypopharyngeal cells and has damaged them even in weakly acidic conditions in vitro ([[disease:lpr]], [[compound:pepsin]]). The claim that the larynx is '50-100 times more sensitive' than the stomach lacks a source ([[claim:larynx-50-100x-more-sensitive]]).",
      "Educational only."
    ],
    evidence: "plausible",
    relations: [
      { rel: "associated-with", to: "disease:lpr" },
      { rel: "associated-with", to: "outcome:throat-burning" },
      { rel: "interacts-with", to: "compound:pepsin" },
      { rel: "associated-with", to: "outcome:salivary-pepsin" }
    ],
    refs: ["article:johnston-2006-pepsin-laryngeal-epithelium"]
  },
  {
    id: "system:brain-gaba-glutamate",
    type: "system",
    name: "Brain GABA/glutamate system",
    aliases: ["Sistema GABA/glutamato cerebral", "Excitatory-inhibitory balance", "Neurotransmission balance"],
    summary: "The brain's main excitatory (glutamate) and inhibitory (GABA) transmitter systems; GAD, which needs PLP, converts glutamate to GABA, and imbalance is linked to anxiety, seizures and hyperarousal.",
    body: [
      "[[compound:glutamate]] is the main excitatory transmitter and [[compound:gaba]] the main inhibitory one. [[enzyme:gad]] (GAD65/67) makes GABA and requires [[compound:plp]]; severe B6 deficiency in infants causes seizures. Ordinary variation in B6 status has weaker effects, and the idea that P5P specifically 'cured' anxiety and brain fog in one person is plausible but untested ([[claim:p5p-gad-gaba-relieves-anxiety]]).",
      "Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "interacts-with", to: "compound:gaba" },
      { rel: "interacts-with", to: "compound:glutamate" },
      { rel: "interacts-with", to: "enzyme:gad" },
      { rel: "associated-with", to: "outcome:anxiety" },
      { rel: "associated-with", to: "outcome:glutamate-gaba-imbalance" }
    ],
    refs: ["article:petroff-2002-gaba-glutamate"]
  },
  {
    id: "system:cardiac-autonomic-control",
    type: "system",
    name: "Cardiac autonomic control",
    aliases: ["Controle autonômico cardíaco", "Vagal brake of the heart", "Sinoatrial node control"],
    summary: "Heart rate is set by sympathetic acceleration (beta-1 receptors) and vagal braking (M2 muscarinic receptors on the sinoatrial node); nocturnal vagal dominance lowers heart rate during sleep.",
    body: [
      "Acetylcholine from vagal terminals acts on M2 receptors in the sinoatrial node to slow depolarisation ([[compound:acetylcholine]]). Histamine acting on H1/H2 receptors and adrenergic discharge raise heart rate. Heart-rate variability is a surrogate for parasympathetic tone ([[system:vagal-tone]]). Whether dietary choline limits the nocturnal brake in people with adequate intake has not been shown ([[claim:choline-supplies-nocturnal-vagal-brake]]).",
      "Educational only; palpitations should be medically assessed."
    ],
    evidence: "established",
    relations: [
      { rel: "interacts-with", to: "compound:acetylcholine" },
      { rel: "associated-with", to: "outcome:tachycardia" },
      { rel: "associated-with", to: "system:vagal-tone" },
      { rel: "interacts-with", to: "compound:histamine" }
    ],
    refs: ["article:gordan-2015-autonomic-cardiovascular-control"]
  },
  {
    id: "system:mucosal-barrier",
    type: "system",
    name: "Gastroduodenal mucosal barrier",
    aliases: ["Barreira mucosa", "Mucus-bicarbonate barrier", "Epithelial barrier"],
    summary: "The stomach and duodenum's defences against acid and pepsin: surface mucus gel holding a bicarbonate layer, epithelial tight junctions, prostaglandins and mucosal blood flow.",
    body: [
      "A mucus gel layer with trapped [[compound:bicarbonate]] maintains near-neutral pH at the epithelial surface even when luminal pH is about 2 ([[compound:hydrochloric-acid]], [[compound:pepsin]]). Prostaglandins sustain mucus and bicarbonate secretion, which is why NSAIDs injure the barrier. Barrier failure plus acid causes [[disease:peptic-ulcer]]; recovery follows removal of the cause ([[state:post-ulcer-mucosal-recovery]]).",
      "Claims that [[intervention:zinc-carnosine]], [[intervention:dgl-licorice]] or [[intervention:espinheira-santa]] reinforce the barrier have mixed support ([[claim:zinc-carnosine-ulcer-healing]], [[claim:dgl-ulcer-healing]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "decreases", to: "disease:peptic-ulcer", note: "An intact barrier reduces ulcer risk." },
      { rel: "associated-with", to: "compound:bicarbonate" },
      { rel: "associated-with", to: "outcome:ulcer-healing" },
      { rel: "interacts-with", to: "intervention:zinc-carnosine" }
    ],
    refs: ["article:allen-2005-mucus-bicarbonate-barrier"]
  },
  {
    id: "system:pylorus",
    type: "system",
    name: "Pylorus",
    aliases: ["Piloro", "Pyloric sphincter", "Gastroduodenal junction"],
    summary: "The muscular sphincter between stomach and duodenum that meters emptying and limits duodenogastric reflux of bile and pancreatic juice; its tone is modulated by vagal and hormonal signals.",
    body: [
      "Pyloric resistance rises with duodenal nutrient and acid feedback (CCK, secretin), slowing emptying ([[system:gastric-physiology]], [[outcome:delayed-gastric-emptying]]). An incompetent pylorus allows bile reflux into the stomach ([[system:bile]]). The conversation suggests a post-ulcer 'altered pyloric valve tone' as part of a gas mechanism; this is not documented in the literature. Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "outcome:delayed-gastric-emptying" },
      { rel: "interacts-with", to: "system:vagal-tone" },
      { rel: "associated-with", to: "system:duodenum" },
      { rel: "associated-with", to: "system:bile" }
    ],
    refs: ["article:browning-2014-vagal-control-gi"]
  },
  {
    id: "system:connective-tissue",
    type: "system",
    name: "Connective tissue (collagen matrix)",
    aliases: ["Tecido conjuntivo", "Cartilage, tendon and skin matrix", "Extracellular matrix"],
    summary: "Skin, tendon, bone and cartilage rich in collagen, the body's largest protein pool and main glycine sink; turnover depends on amino acids, vitamin C, copper and mechanical loading.",
    body: [
      "Collagen's Gly-X-Y repeat makes about one third of its residues glycine ([[compound:collagen]], [[compound:glycine]]). Hydrolysed collagen supplements supply glycine, proline and hydroxyproline, while undenatured type II collagen acts differently, through the gut immune system ([[disease:osteoarthritis]]). Glycine adequacy for matrix synthesis is hypothesised to limit repair ([[outcome:collagen-synthesis-adequacy]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "associated-with", to: "compound:collagen" },
      { rel: "associated-with", to: "compound:glycine" },
      { rel: "associated-with", to: "outcome:collagen-synthesis-adequacy" },
      { rel: "associated-with", to: "disease:osteoarthritis" }
    ],
    refs: ["article:shoulders-2009-collagen-structure"]
  },
  {
    id: "system:kidney",
    type: "system",
    name: "Kidney (betaine, choline and homocysteine handling)",
    aliases: ["Rim", "Renal handling", "Renal clearance"],
    summary: "The kidney oxidises choline to betaine, hosts BHMT, filters and reabsorbs homocysteine and TMAO, and impaired function raises both markers independently of diet or methylation.",
    body: [
      "Renal tissue expresses [[enzyme:bhmt]] and choline dehydrogenase; [[compound:betaine]] is also an osmolyte. [[compound:homocysteine]] and [[compound:tmao]] depend on kidney clearance, so reduced glomerular filtration raises both ([[outcome:elevated-homocysteine]], [[outcome:elevated-tmao]]), which complicates interpretation of these markers as diet or methylation readouts ([[disease:cardiovascular-disease]]). Educational only."
    ],
    evidence: "established",
    relations: [
      { rel: "interacts-with", to: "enzyme:bhmt" },
      { rel: "interacts-with", to: "compound:betaine" },
      { rel: "associated-with", to: "outcome:elevated-tmao" },
      { rel: "associated-with", to: "outcome:elevated-homocysteine" }
    ],
    refs: ["article:ueland-2011-choline-betaine"]
  }
];
