// Which entities each dashboard's causal map shows, and short labels where the entity name is long.
// Pure data. The map is the signed causal edges among these entities (see causal-view.js); entries
// without an edge to another entry are left out automatically, so listing a candidate is harmless.

export const GUT_ACID_MAP = Object.freeze({
  include: [
    'intervention:glycine-powder', 'intervention:collagen-peptides', 'intervention:ppi-therapy', 'intervention:betaine-hcl',
    'compound:glycine', 'compound:gastrin', 'compound:hydrochloric-acid', 'compound:bicarbonate', 'compound:carbon-dioxide',
    'pathway:gut-bacterial-glycine-fates', 'compound:pepsin',
    'state:undermethylation', 'state:hypochlorhydria', 'state:gastric-dysmotility', 'state:duodenogastric-reflux',
    'system:vagal-tone',
    'disease:sibo', 'disease:h-pylori-infection', 'disease:gerd', 'disease:lpr',
    'outcome:elevated-gastric-ph', 'outcome:co2-gastric-distension', 'outcome:transient-les-relaxations', 'outcome:belching',
    'outcome:reflux-episodes', 'outcome:salivary-pepsin', 'outcome:throat-burning'
  ],
  labels: {
    'intervention:ppi-therapy': 'PPI (acid suppression drug)',
    'intervention:betaine-hcl': 'Betaine HCl capsule',
    'intervention:collagen-peptides': 'Collagen powder',
    'intervention:glycine-powder': 'Glycine powder',
    'compound:hydrochloric-acid': 'Stomach acid (HCl)',
    'compound:carbon-dioxide': 'CO2',
    'pathway:gut-bacterial-glycine-fates': 'Gut bacteria use glycine',
    'disease:sibo': 'SIBO',
    'disease:gerd': 'GERD (reflux disease)',
    'disease:lpr': 'LPR (throat reflux)',
    'disease:h-pylori-infection': 'H. pylori infection',
    'outcome:transient-les-relaxations': 'TLESR (sphincter relaxations)',
    'outcome:co2-gastric-distension': 'Gas distension',
    'outcome:salivary-pepsin': 'Pepsin in throat tissue',
    'state:duodenogastric-reflux': 'Bile reflux into the stomach',
    'state:gastric-dysmotility': 'Slow, uncoordinated stomach',
    'state:hypochlorhydria': 'Low stomach acid',
    'state:undermethylation': 'Under-methylation (hypothesis)',
    'outcome:elevated-gastric-ph': 'Higher stomach pH'
  }
})

export const HISTAMINE_MAP = Object.freeze({
  include: [
    'intervention:choline-bitartrate', 'intervention:betaine-anhydrous', 'intervention:p5p-supplement', 'intervention:glycine-powder',
    'intervention:niacin-nicotinamide-supplement', 'intervention:h2-receptor-antagonists',
    'compound:choline', 'compound:betaine', 'compound:acetylcholine', 'compound:sam', 'compound:histamine', 'compound:gaba',
    'enzyme:hnmt', 'enzyme:bhmt', 'enzyme:dao',
    'pathway:histamine-degradation', 'pathway:histamine-receptor-signalling', 'pathway:muscarinic-m2-vagal-brake',
    'system:vagal-tone', 'system:cardiac-autonomic-control',
    'state:undermethylation', 'state:histamine-excess',
    'disease:histamine-intolerance', 'disease:anxiety-disorder',
    'outcome:night-waking', 'outcome:tachycardia', 'outcome:flushing'
  ],
  labels: {
    'intervention:choline-bitartrate': 'Choline supplement',
    'intervention:betaine-anhydrous': 'Betaine (TMG)',
    'intervention:p5p-supplement': 'P5P (active B6)',
    'intervention:niacin-nicotinamide-supplement': 'Niacin',
    'intervention:h2-receptor-antagonists': 'H2 blocker',
    'compound:sam': 'SAM',
    'compound:gaba': 'GABA',
    'enzyme:hnmt': 'HNMT',
    'enzyme:bhmt': 'BHMT',
    'enzyme:dao': 'DAO',
    'pathway:histamine-receptor-signalling': 'H1/H2 receptor signalling',
    'pathway:histamine-degradation': 'Histamine breakdown',
    'pathway:muscarinic-m2-vagal-brake': 'Vagal brake on the heart',
    'system:cardiac-autonomic-control': 'Heart rate control',
    'outcome:night-waking': 'Waking at 2-3 am',
    'intervention:betaine-anhydrous': 'Betaine supplement (TMG)',
    'intervention:glycine-powder': 'Glycine powder',
    'state:undermethylation': 'Under-methylation'
  }
})

export const B6_MAP = Object.freeze({
  include: [
    'intervention:p5p-supplement', 'compound:pyridoxine', 'compound:plp', 'compound:gaba', 'compound:glycine', 'compound:homocysteine', 'compound:kryptopyrrole',
    'enzyme:gad', 'enzyme:gad1', 'enzyme:gad2', 'enzyme:shmt', 'enzyme:cbs', 'enzyme:glycine-cleavage-system', 'enzyme:abat', 'enzyme:pdxk', 'enzyme:pnpo',
    'pathway:vitamin-b6-activation', 'pathway:gaba-shunt',
    'system:brain-gaba-glutamate',
    'state:b6-functional-deficiency', 'state:undermethylation',
    'disease:vitamin-b6-deficiency', 'disease:pyroluria-kpu', 'disease:anxiety-disorder',
    'outcome:low-plp-status', 'outcome:glutamate-gaba-imbalance', 'outcome:elevated-homocysteine', 'outcome:anxiety'
  ],
  labels: {
    'intervention:p5p-supplement': 'P5P supplement',
    'compound:plp': 'PLP (active B6)',
    'compound:gaba': 'GABA',
    'enzyme:glycine-cleavage-system': 'Glycine cleavage',
    'state:b6-functional-deficiency': 'Functional B6 deficiency',
    'disease:pyroluria-kpu': 'Pyroluria (KPU)',
    'outcome:glutamate-gaba-imbalance': 'Glutamate/GABA imbalance'
  }
})

export const BILE_MAP = Object.freeze({
  include: [
    'intervention:glycine-powder', 'intervention:taurine-supplement', 'intervention:artichoke-leaf-extract', 'compound:glycine', 'compound:taurine', 'compound:bile-acids', 'compound:glycocholic-acid',
    'enzyme:baat', 'enzyme:bile-salt-hydrolase', 'system:bile', 'system:duodenum', 'system:liver',
    'state:duodenogastric-reflux', 'state:hypochlorhydria', 'state:gastric-dysmotility',
    'disease:gerd', 'disease:gastritis', 'disease:esophagitis', 'disease:lpr', 'disease:sibo',
    'outcome:belching', 'outcome:reflux-episodes', 'outcome:throat-burning', 'outcome:elevated-gastric-ph', 'outcome:heartburn'
  ],
  labels: {
    'intervention:glycine-powder': 'Glycine powder',
    'intervention:taurine-supplement': 'Taurine supplement',
    'intervention:artichoke-leaf-extract': 'Artichoke extract',
    'compound:glycocholic-acid': 'Glycocholate',
    'enzyme:bile-salt-hydrolase': 'Bacterial BSH',
    'state:duodenogastric-reflux': 'Bile reflux into the stomach',
    'disease:lpr': 'LPR (throat reflux)',
    'disease:gerd': 'GERD (reflux disease)',
    'disease:sibo': 'SIBO',
    'disease:gastritis': 'Gastritis',
    'state:hypochlorhydria': 'Low stomach acid',
    'state:gastric-dysmotility': 'Slow, uncoordinated stomach',
    'outcome:elevated-gastric-ph': 'Higher stomach pH'
  }
})

export const TMA_MAP = Object.freeze({
  include: [
    'intervention:choline-bitartrate', 'intervention:dietary-choline-sources', 'intervention:phosphatidylcholine-supplement', 'intervention:alpha-gpc-supplement',
    'compound:choline', 'compound:phosphatidylcholine', 'compound:l-carnitine', 'compound:trimethylamine', 'compound:tmao', 'compound:betaine',
    'state:choline-excess',
    'disease:trimethylaminuria', 'disease:cardiovascular-disease',
    'outcome:fishy-odor', 'outcome:elevated-tmao', 'outcome:urinary-tma-tmao-ratio', 'outcome:cholinergic-excess-symptoms'
  ],
  labels: {
    'intervention:choline-bitartrate': 'Choline supplement',
    'intervention:dietary-choline-sources': 'Dietary choline',
    'intervention:phosphatidylcholine-supplement': 'Lecithin / PC supplement',
    'intervention:alpha-gpc-supplement': 'Alpha-GPC',
    'state:choline-excess': 'Choline above the UL',
    'compound:trimethylamine': 'TMA',
    'compound:tmao': 'TMAO',
    'compound:l-carnitine': 'Carnitine',
    'outcome:fishy-odor': 'Fishy body odour',
    'outcome:urinary-tma-tmao-ratio': 'Urine TMA:TMAO ratio',
    'disease:cardiovascular-disease': 'Cardiovascular disease'
  }
})
