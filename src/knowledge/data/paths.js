// Guided paths: short, ordered reading lists through the graph. A path is a curated story, not new data:
// every step points at an existing entity and says in one or two sentences why it comes next.
// The engine checks that each step id exists (npm run kb:validate) and exposes the list as `paths`.
// Educational content only; nothing here is a diagnosis or medical advice.
export default [
  {
    id: 'glycine-belching-question',
    title: 'The glycine-belching question',
    summary: 'Why might glycine powder cause belching? Start from the symptom, meet each proposed explanation, and see how well each one is supported.',
    steps: [
      { id: 'outcome:belching', why: 'Start with the symptom itself: most belching is swallowed air vented through the lower oesophageal sphincter, and gas that leaves by the mouth must come from the upper gut.' },
      { id: 'claim:glycine-powder-low-dose-belching-reports', why: 'The observation behind the question: belching with several brands, persisting at 2-3 g and after breaks. It is an anecdote, which is why it is graded conversation-only.' },
      { id: 'intervention:glycine-powder', why: 'What the product is, how glycine is absorbed, and how trials describe tolerability.' },
      { id: 'compound:glycine', why: 'What glycine does in the body, so that the proposed side effects can be compared with its normal roles.' },
      { id: 'enzyme:gnmt', why: 'First proposed mechanism: glycine spends methyl groups through GNMT. Plausible on paper, but the enzyme is regulated and its product is recycled.' },
      { id: 'claim:free-glycine-stimulates-gastrin', why: 'Second proposal: glycine drives gastrin and acid. Human tests found aromatic amino acids, not glycine, to be the potent stimulants.' },
      { id: 'pathway:acid-bicarbonate-neutralisation', why: 'Third proposal: acid meeting bicarbonate releases CO2. The chemistry is real; whether it produces belchable gas after glycine is untested.' },
      { id: 'claim:sibo-bacteria-metabolize-glycine-co2-nh3', why: 'Fourth proposal: bacteria high in the gut ferment free glycine. Some anaerobes can, but typical SIBO gas comes from carbohydrate.' },
      { id: 'outcome:transient-les-relaxations', why: 'How gas actually leaves: a vagal reflex opens the sphincter when the stomach is distended, whatever filled it.' },
      { id: 'claim:belching-mostly-swallowed-air', why: 'The simplest competing explanation: swallowed air, often with a behavioural component, which would not need any glycine chemistry at all.' },
      { id: 'claim:glycine-well-tolerated-in-trials', why: 'Finally, the trial record: glycine at bedtime doses is generally well tolerated, so any individual reaction needs individual assessment.' }
    ]
  },
  {
    id: 'methyl-budget',
    title: 'Methyl budget: who spends the methyl groups',
    summary: 'Follow methyl groups from income (diet, recycling) to spending (membranes, creatine, the GNMT valve) and see where under- and over-methylation fit.',
    steps: [
      { id: 'pathway:methyl-budget', why: 'The overview: income, expenditure and why the SAMe to SAH ratio is the number that matters.' },
      { id: 'compound:sam', why: 'The carrier molecule that every methyl transfer starts from.' },
      { id: 'enzyme:mat', why: 'How SAMe is made from methionine and ATP, and why magnesium is needed.' },
      { id: 'pathway:methionine-cycle', why: 'The loop that regenerates methionine from homocysteine, using either folate and B12 or betaine.' },
      { id: 'enzyme:pemt', why: 'The largest consumer: three SAMe for every phosphatidylcholine made de novo.' },
      { id: 'pathway:creatine-synthesis', why: 'The other large consumer, which is why dietary creatine can spare methyl groups.' },
      { id: 'enzyme:gnmt', why: 'The regulated overflow valve that burns surplus SAMe onto glycine.' },
      { id: 'enzyme:nnmt', why: 'A smaller sink that clears niacin metabolites, and the reason niacin is called a methyl drain.' },
      { id: 'compound:sah', why: 'The leftover after every transfer, which inhibits methyltransferases and so sets the pace.' },
      { id: 'state:undermethylation', why: 'The shortage state: what is measurable and what is a contested clinical label.' },
      { id: 'state:overmethylation', why: 'The opposite pole, with GNMT deficiency as the clear genetic example.' },
      { id: 'claim:walsh-under-over-methylation-categories-valid', why: 'How well the popular two-type classification is supported (not well).' }
    ]
  },
  {
    id: 'choline-to-glycine',
    title: 'Choline to glycine',
    summary: 'Trace choline through its four fates, down the betaine route to glycine, and check the arithmetic of making 10 g of glycine from it.',
    steps: [
      { id: 'compound:choline', why: 'The starting nutrient: sources, adequate intake and the upper limit.' },
      { id: 'pathway:kennedy-pathway', why: 'The dominant fate: membranes, bile phospholipid and lipoproteins.' },
      { id: 'pathway:acetylcholine-synthesis', why: 'The neurotransmitter fate, which links choline to the vagus nerve.' },
      { id: 'pathway:choline-oxidation', why: 'The route to betaine and glycine, with its three methyl hand-offs.' },
      { id: 'enzyme:chdh', why: 'The first step: choline to betaine aldehyde in mitochondria.' },
      { id: 'compound:betaine', why: 'Betaine, also called TMG: the methyl donor and the molecule people confuse with betaine HCl.' },
      { id: 'enzyme:bhmt', why: 'Where the first methyl goes: remethylation of homocysteine without folate or B12.' },
      { id: 'enzyme:dmgdh', why: 'The second methyl leaves as a folate-bound one-carbon unit.' },
      { id: 'enzyme:sardh', why: 'The third methyl leaves and glycine is the end product.' },
      { id: 'claim:choline-derived-glycine-silent', why: 'The argument that this glycine causes no gas because it never meets the gut lumen.' },
      { id: 'claim:choline-28-35g-for-10g-glycine', why: 'The arithmetic of replacing 10 g of glycine with choline, and why the answer is not a realistic target.' },
      { id: 'state:choline-excess', why: 'What happens above the upper limit: fishy odour, cholinergic symptoms and more TMAO.' },
      { id: 'pathway:tma-tmao-axis', why: 'The gut-bacteria branch of choline that explains those effects.' }
    ]
  },
  {
    id: 'gut-acid-ulcers',
    title: 'Gut, acid and ulcers',
    summary: 'How the stomach makes and defends against acid, how ulcers and acid suppression change the upper gut, and why acid supplements are treated with caution.',
    steps: [
      { id: 'system:gastric-physiology', why: 'The stomach as an organ: secretion, motility and the barrier.' },
      { id: 'system:gastric-g-cells', why: 'The cells that release gastrin in response to a meal.' },
      { id: 'system:gastric-parietal-cells', why: 'The cells that make the acid, and the three signals that switch them on.' },
      { id: 'pathway:gastric-acid-secretion', why: 'The whole control loop from meal to hydrochloric acid, and the drugs that interrupt it.' },
      { id: 'system:mucosal-barrier', why: 'What protects the lining from its own acid.' },
      { id: 'disease:peptic-ulcer', why: 'What happens when the barrier fails, and its two main causes.' },
      { id: 'disease:h-pylori-infection', why: 'The infection behind most ulcers, and why eradication is confirmed afterwards.' },
      { id: 'disease:gastritis', why: 'Inflammation short of an ulcer, including the erosive forms.' },
      { id: 'intervention:ppi-therapy', why: 'The main acid-suppressing drugs and what they are good for.' },
      { id: 'state:acid-suppression', why: 'The consequences claimed for long-term suppression: low acid, slower emptying, bacterial overgrowth.' },
      { id: 'pathway:migrating-motor-complex', why: 'The fasting cleaning wave, and the debated link to overgrowth.' },
      { id: 'disease:sibo', why: 'Where overgrowth fits and how weak the tests are.' },
      { id: 'intervention:betaine-hcl', why: 'The acid supplement and why it is avoided on injured lining.' },
      { id: 'claim:betaine-hcl-contraindicated-post-ulcer', why: 'How strong the "absolute contraindication" wording really is.' },
      { id: 'intervention:zinc-carnosine', why: 'A mucosal-support product used after ulcers, with its evidence and its zinc dose.' },
      { id: 'state:post-ulcer-mucosal-recovery', why: 'The recovery period in which burning on acid contact is reported.' }
    ]
  },
  {
    id: 'throat-burn-and-reflux',
    title: 'The throat burn',
    summary: 'From burning in the throat to the debated idea of laryngopharyngeal reflux, pepsin, and the products used for it.',
    steps: [
      { id: 'outcome:throat-burning', why: 'The symptom, and the many causes besides reflux.' },
      { id: 'disease:lpr', why: 'The "silent reflux" label and the reasons it is debated.' },
      { id: 'claim:throat-burning-means-lpr', why: 'Whether burning in the throat without stomach burning is a signature of LPR.' },
      { id: 'compound:pepsin', why: 'The enzyme proposed as the damaging agent, even at weakly acidic pH.' },
      { id: 'claim:belch-aerosol-deposits-pepsin', why: 'The idea that belches carry pepsin up to the larynx.' },
      { id: 'claim:larynx-50-100x-more-sensitive', why: 'A widely repeated multiplier that could not be traced to a source.' },
      { id: 'intervention:sodium-alginate', why: 'Raft-forming products: how they work and what trials show.' },
      { id: 'claim:alkaline-water-inactivates-pepsin', why: 'The basis for alkaline gargles, and what the laboratory work does and does not show.' },
      { id: 'intervention:oregano-oil', why: 'A product that stung, and why pungent phenols are avoided on inflamed lining.' },
      { id: 'claim:oregano-phenols-burn-inflamed-mucosa', why: 'The receptor explanation for that burning.' },
      { id: 'disease:esophagitis', why: 'The oesophageal counterpart, where visible damage can be graded and treated.' }
    ]
  },
  {
    id: 'night-waking-histamine-heart',
    title: 'The 2-3 am question',
    summary: 'Histamine, methylation, choline and the vagal brake: the chain proposed to explain waking with a racing heart, and how much of it is established.',
    steps: [
      { id: 'outcome:night-waking', why: 'The symptom, with the many ordinary causes of early waking.' },
      { id: 'claim:histamine-peaks-2-4am', why: 'The first link: whether histamine really peaks at that hour.' },
      { id: 'pathway:histamine-degradation', why: 'How histamine is cleared: DAO outside cells and HNMT inside them.' },
      { id: 'enzyme:hnmt', why: 'The SAMe-dependent step, which is why methylation is drawn into the story.' },
      { id: 'claim:hnmt-needs-sam', why: 'How far low methylation really slows histamine clearance.' },
      { id: 'pathway:histamine-receptor-signalling', why: 'What histamine does at H1 and H2 receptors, with the caveat that it is not a routine heart regulator.' },
      { id: 'outcome:tachycardia', why: 'The symptom as it appears in histamine, allergy and anxiety settings.' },
      { id: 'enzyme:bhmt', why: 'The proposed route from choline to more SAMe in liver.' },
      { id: 'claim:choline-fixed-night-waking-via-bhmt-hnmt', why: 'The whole chain stated as one claim, graded speculative.' },
      { id: 'pathway:muscarinic-m2-vagal-brake', why: 'The second chain: acetylcholine slowing the heart through M2 receptors.' },
      { id: 'claim:choline-supplies-nocturnal-vagal-brake', why: 'Whether extra choline strengthens that brake (not shown).' }
    ]
  },
  {
    id: 'b6-gaba-anxiety',
    title: 'B6, GABA and the anxious mind',
    summary: 'Why vitamin B6 in its active form is linked to calming, how GAD turns glutamate into GABA, and what the evidence says about P5P and pyroluria.',
    steps: [
      { id: 'compound:plp', why: 'The active coenzyme form of B6 and the enzymes that depend on it.' },
      { id: 'pathway:vitamin-b6-activation', why: 'How ordinary B6 becomes P5P, and where a bottleneck could occur.' },
      { id: 'claim:p5p-bypasses-hepatic-activation', why: 'Whether taking P5P directly really bypasses that step.' },
      { id: 'enzyme:gad', why: 'The P5P-dependent enzyme that makes GABA from glutamate.' },
      { id: 'pathway:gaba-shunt', why: 'The glutamate-GABA axis in context.' },
      { id: 'outcome:glutamate-gaba-imbalance', why: 'The imbalance idea behind anxiety and mental fog.' },
      { id: 'claim:p5p-gad-gaba-relieves-anxiety', why: 'How well P5P for anxiety is supported by trials.' },
      { id: 'state:b6-functional-deficiency', why: 'Functional B6 deficiency and how it is detected.' },
      { id: 'disease:pyroluria-kpu', why: 'The pyrrole disorder proposed to cause B6 and zinc deficiency, and why it is contested.' },
      { id: 'intervention:p5p-supplement', why: 'Dose, upper limits and the risk of neuropathy at high chronic doses.' }
    ]
  },
  {
    id: 'forms-that-get-confused',
    title: 'Forms that are easy to confuse',
    summary: 'Pairs of products with similar names but different chemistry: betaine HCl and TMG, folic acid and methylfolate, P5P and pyridoxine, choline salts and phospholipids.',
    steps: [
      { id: 'intervention:betaine-hcl', why: 'Releases hydrochloric acid in the stomach; avoided on injured lining.' },
      { id: 'intervention:betaine-anhydrous', why: 'Neutral TMG that acts through BHMT and does not acidify.' },
      { id: 'claim:betaine-anhydrous-not-acidifying', why: 'The chemistry that separates the two.' },
      { id: 'compound:folic-acid', why: 'The synthetic vitamin that needs a slow liver enzyme to be activated.' },
      { id: 'compound:5-mthf', why: 'The active folate that enters the methionine cycle directly.' },
      { id: 'claim:folic-acid-competes-with-methylfolate', why: 'How strong the idea is that folic acid slows methylation.' },
      { id: 'compound:pyridoxine', why: 'Conventional B6, which the liver must phosphorylate.' },
      { id: 'compound:plp', why: 'P5P, the active B6 coenzyme, needs no liver phosphorylation step.' },
      { id: 'intervention:choline-bitartrate', why: 'A choline salt, about 41 % choline by mass.' },
      { id: 'intervention:phosphatidylcholine-supplement', why: 'Phospholipid choline, absorbed through pancreatic and mucosal enzymes.' },
      { id: 'claim:alpha-gpc-pc-absorbed-without-acid', why: 'What is and is not known about acid-independent absorption of these forms.' }
    ]
  },
  {
    id: 'reading-the-evidence',
    title: 'Reading the evidence',
    summary: 'How to read the grades and claim statuses by seeing one example of each: established, partly supported, contested, unsupported and conversation-only.',
    steps: [
      { id: 'claim:gnmt-methyl-sink-valve', why: 'Supported and established: textbook biochemistry with references.' },
      { id: 'claim:choline-ul-3-5g-iom-efsa', why: 'Partly supported: the number is right but one attribution (EFSA) is wrong, a reminder to check sources.' },
      { id: 'claim:larynx-50-100x-more-sensitive', why: 'Partly supported: the direction is right but the multiplier has no source.' },
      { id: 'claim:glycine-deficit-10g', why: 'Contested: a modelling estimate that others dispute.' },
      { id: 'claim:free-glycine-stimulates-gastrin', why: 'Unsupported, with counter-evidence attached to the claim.' },
      { id: 'claim:undermethylated-hypochlorhydria', why: 'Unsupported and flagged: no evidence found for or against.' },
      { id: 'claim:glycine-powder-low-dose-belching-reports', why: 'An anecdote: useful as a starting point, graded conversation-only.' },
      { id: 'intervention:phased-reintroduction-protocol', why: 'A whole protocol graded conversation-only: a plan with plausible parts but no tested whole.' },
      { id: 'article:taylor-1982-amino-acids-gastric-acid', why: 'What a checked source looks like: bibliographic data verified, takeaways in plain words, and links to the claims it supports or contradicts.' }
    ]
  }
]
