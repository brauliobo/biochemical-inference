// Glycine sources and sinks (flux) map: serine synthesis and SHMT, the choline-derived route and GNMT sarcosine
// loop on the left, the sinks on the right (glycine cleavage, creatine, glutathione, collagen, bile conjugation,
// gut bacteria). One-carbon, SAM/SAH and currency metabolites are pooled on the reactions (see `pool`).
// `quantRefs` names the structured quantities a renderer can use for flux width. Coordinates are hand-laid; edges and
// reaction details are generated from the ontology reactions by scripts/build-layout.js.
const layout = {
  id: 'glycine-flux',
  title: 'Glycine: where it comes from and where it goes',
  summary: 'Serine synthesis and the choline route fill the glycine pool; cleavage, SHMT, creatine, glutathione, collagen and bile conjugation drain it.',
  viewBox: { width: 1280, height: 800 },
  pathways: ['pathway:glycine-serine-route', 'pathway:glycine-cleavage', 'pathway:gut-bacterial-glycine-fates'],
  extraReactions: [
    'reaction:gnmt-glycine-methylation',
    'reaction:agat-guanidinoacetate-synthesis',
    'reaction:gss-glutathione-synthesis',
    'reaction:baat-glycine-conjugation',
    'reaction:collagen-chain-assembly'
  ],
  pool: ['compound:thf', 'compound:5-10-methylene-thf', 'compound:sam', 'compound:sah', 'compound:ornithine', 'compound:cholate'],
  quantRefs: {
    'compound:glycine': ['quant:glycine-flux-whole-body-flux'],
    'reaction:glycine-cleavage-system': ['quant:glycine-cleavage-system-flux-share-decarboxylation'],
    'reaction:shmt-serine-glycine-interconversion': ['quant:shmt-flux-share-serine-conversion']
  },
  groups: [
    { id: 'serine', label: 'Serine synthesis (PHGDH, PSAT1, PSPH)', x: 40, y: 50, width: 700, height: 100 },
    { id: 'choline-route', label: 'Choline-derived route and the GNMT sarcosine loop', x: 40, y: 350, width: 580, height: 230 },
    { id: 'sinks', label: 'Sinks', x: 790, y: 300, width: 450, height: 460 },
    { id: 'gut', label: 'Gut bacteria (speculative)', x: 790, y: 50, width: 450, height: 220 },
    { id: 'diet', label: 'Intake', x: 40, y: 620, width: 200, height: 150 }
  ],
  nodes: [
    { id: 'compound:3-phosphoglycerate', kind: 'compound', x: 90, y: 100, label: '3-PG', group: 'serine' },
    { id: 'reaction:phgdh-3pg-oxidation', kind: 'reaction', x: 190, y: 100, label: 'PHGDH', group: 'serine' },
    { id: 'compound:3-phosphohydroxypyruvate', kind: 'compound', x: 290, y: 100, label: '3-PHP', group: 'serine' },
    { id: 'reaction:psat1-phosphoserine-transamination', kind: 'reaction', x: 390, y: 100, label: 'PSAT1', group: 'serine' },
    { id: 'compound:3-phosphoserine', kind: 'compound', x: 490, y: 100, label: '3-PSer', group: 'serine' },
    { id: 'reaction:psph-phosphoserine-hydrolysis', kind: 'reaction', x: 590, y: 100, label: 'PSPH', group: 'serine' },
    { id: 'compound:serine', kind: 'compound', x: 700, y: 100, label: 'Serine', group: 'serine' },
    { id: 'reaction:shmt-serine-glycine-interconversion', kind: 'reaction', x: 700, y: 250, label: 'SHMT', group: 'serine' },
    { id: 'compound:glycine', kind: 'compound', x: 700, y: 420, label: 'Glycine', group: 'choline-route' },
    { id: 'compound:choline', kind: 'compound', x: 130, y: 400, label: 'Choline' },
    { id: 'compound:dimethylglycine', kind: 'compound', x: 130, y: 520, label: 'DMG', group: 'choline-route' },
    { id: 'reaction:dmgdh-dimethylglycine-demethylation', kind: 'reaction', x: 250, y: 520, label: 'DMGDH', group: 'choline-route' },
    { id: 'compound:sarcosine', kind: 'compound', x: 380, y: 520, label: 'Sarcosine', group: 'choline-route' },
    { id: 'reaction:sardh-sarcosine-demethylation', kind: 'reaction', x: 520, y: 480, label: 'SARDH', group: 'choline-route' },
    { id: 'reaction:gnmt-glycine-methylation', kind: 'reaction', x: 520, y: 380, label: 'GNMT', group: 'choline-route' },
    { id: 'reaction:glycine-cleavage-system', kind: 'reaction', x: 900, y: 350, label: 'Glycine cleavage (GCS)', group: 'sinks' },
    { id: 'reaction:agat-guanidinoacetate-synthesis', kind: 'reaction', x: 900, y: 440, label: 'AGAT', group: 'sinks' },
    { id: 'compound:arginine', kind: 'compound', x: 1040, y: 400, label: 'Arginine', group: 'sinks' },
    { id: 'compound:guanidinoacetate', kind: 'compound', x: 1150, y: 480, label: 'GAA', group: 'sinks' },
    { id: 'reaction:gss-glutathione-synthesis', kind: 'reaction', x: 900, y: 540, label: 'GSS', group: 'sinks' },
    { id: 'compound:gamma-glutamylcysteine', kind: 'compound', x: 1040, y: 540, label: 'gamma-GC', group: 'sinks' },
    { id: 'compound:glutathione', kind: 'compound', x: 1150, y: 580, label: 'Glutathione', group: 'sinks' },
    { id: 'reaction:collagen-chain-assembly', kind: 'reaction', x: 900, y: 650, label: 'Collagen assembly', group: 'sinks' },
    { id: 'compound:proline', kind: 'compound', x: 1040, y: 640, label: 'Proline', group: 'sinks' },
    { id: 'compound:collagen', kind: 'compound', x: 1150, y: 700, label: 'Collagen', group: 'sinks' },
    { id: 'reaction:baat-glycine-conjugation', kind: 'reaction', x: 640, y: 650, label: 'BAAT (bile)', group: 'sinks' },
    { id: 'compound:choloyl-coa', kind: 'compound', x: 520, y: 700, label: 'Choloyl-CoA', group: 'sinks' },
    { id: 'compound:glycocholic-acid', kind: 'compound', x: 700, y: 740, label: 'Glycocholate', group: 'sinks' },
    { id: 'reaction:bsh-glycocholate-deconjugation', kind: 'reaction', x: 790, y: 560, label: 'BSH (gut)', group: 'sinks' },
    { id: 'reaction:bacterial-glycine-reductase', kind: 'reaction', x: 880, y: 160, label: 'Glycine reductase', group: 'gut' },
    { id: 'compound:acetyl-phosphate', kind: 'compound', x: 1040, y: 160, label: 'Acetyl-P', group: 'gut' },
    { id: 'reaction:bacterial-glycine-cleavage', kind: 'reaction', x: 880, y: 230, label: 'Bacterial cleavage', group: 'gut' },
    { id: 'intervention:glycine-powder', kind: 'intervention', x: 140, y: 660, label: 'Glycine powder', group: 'diet' },
    { id: 'intervention:collagen-peptides', kind: 'intervention', x: 140, y: 710, label: 'Collagen peptides', group: 'diet' }
  ],
  // Relations that are not reactions: drawn dashed, '-' in red. sign follows the knowledge-base edge.
  links: [
    { from: 'compound:choline', to: 'compound:dimethylglycine', sign: '+', label: 'CHDH, BADH, BHMT' },
    { from: 'intervention:glycine-powder', to: 'compound:glycine', sign: '+' },
    { from: 'intervention:collagen-peptides', to: 'compound:glycine', sign: '+' }
  ]
}

// BEGIN GENERATED by scripts/build-layout.js (edges and reaction details derived from the ontology reactions; do not edit by hand)
const generated = {
  edges: [
    { from: 'compound:3-phosphoglycerate', to: 'reaction:phgdh-3pg-oxidation', role: 'substrate', n: 1 },
    { from: 'reaction:phgdh-3pg-oxidation', to: 'compound:3-phosphohydroxypyruvate', role: 'product', n: 1 },
    { from: 'compound:3-phosphohydroxypyruvate', to: 'reaction:psat1-phosphoserine-transamination', role: 'substrate', n: 1 },
    { from: 'reaction:psat1-phosphoserine-transamination', to: 'compound:3-phosphoserine', role: 'product', n: 1 },
    { from: 'compound:3-phosphoserine', to: 'reaction:psph-phosphoserine-hydrolysis', role: 'substrate', n: 1 },
    { from: 'reaction:psph-phosphoserine-hydrolysis', to: 'compound:serine', role: 'product', n: 1 },
    { from: 'compound:serine', to: 'reaction:shmt-serine-glycine-interconversion', role: 'substrate', n: 1 },
    { from: 'reaction:shmt-serine-glycine-interconversion', to: 'compound:glycine', role: 'product', n: 1 },
    { from: 'compound:dimethylglycine', to: 'reaction:dmgdh-dimethylglycine-demethylation', role: 'substrate', n: 1 },
    { from: 'reaction:dmgdh-dimethylglycine-demethylation', to: 'compound:sarcosine', role: 'product', n: 1 },
    { from: 'compound:sarcosine', to: 'reaction:sardh-sarcosine-demethylation', role: 'substrate', n: 1 },
    { from: 'reaction:sardh-sarcosine-demethylation', to: 'compound:glycine', role: 'product', n: 1 },
    { from: 'compound:glycine', to: 'reaction:gnmt-glycine-methylation', role: 'substrate', n: 1 },
    { from: 'reaction:gnmt-glycine-methylation', to: 'compound:sarcosine', role: 'product', n: 1 },
    { from: 'compound:glycine', to: 'reaction:glycine-cleavage-system', role: 'substrate', n: 1 },
    { from: 'compound:arginine', to: 'reaction:agat-guanidinoacetate-synthesis', role: 'substrate', n: 1 },
    { from: 'compound:glycine', to: 'reaction:agat-guanidinoacetate-synthesis', role: 'substrate', n: 1 },
    { from: 'reaction:agat-guanidinoacetate-synthesis', to: 'compound:guanidinoacetate', role: 'product', n: 1 },
    { from: 'compound:gamma-glutamylcysteine', to: 'reaction:gss-glutathione-synthesis', role: 'substrate', n: 1 },
    { from: 'compound:glycine', to: 'reaction:gss-glutathione-synthesis', role: 'substrate', n: 1 },
    { from: 'reaction:gss-glutathione-synthesis', to: 'compound:glutathione', role: 'product', n: 1 },
    { from: 'compound:glycine', to: 'reaction:collagen-chain-assembly', role: 'substrate', n: 1 },
    { from: 'compound:proline', to: 'reaction:collagen-chain-assembly', role: 'substrate', n: 2 },
    { from: 'reaction:collagen-chain-assembly', to: 'compound:collagen', role: 'product', n: 1 },
    { from: 'compound:choloyl-coa', to: 'reaction:baat-glycine-conjugation', role: 'substrate', n: 1 },
    { from: 'compound:glycine', to: 'reaction:baat-glycine-conjugation', role: 'substrate', n: 1 },
    { from: 'reaction:baat-glycine-conjugation', to: 'compound:glycocholic-acid', role: 'product', n: 1 },
    { from: 'compound:glycocholic-acid', to: 'reaction:bsh-glycocholate-deconjugation', role: 'substrate', n: 1 },
    { from: 'reaction:bsh-glycocholate-deconjugation', to: 'compound:glycine', role: 'product', n: 1 },
    { from: 'compound:glycine', to: 'reaction:bacterial-glycine-reductase', role: 'substrate', n: 1 },
    { from: 'reaction:bacterial-glycine-reductase', to: 'compound:acetyl-phosphate', role: 'product', n: 1 },
    { from: 'compound:glycine', to: 'reaction:bacterial-glycine-cleavage', role: 'substrate', n: 1 }
  ],
  reactions: {
    'reaction:phgdh-3pg-oxidation': {
      enzymes: ['enzyme:phgdh'],
      reversible: true,
      substrates: [{ id: 'compound:3-phosphoglycerate', n: 1 }],
      products: [{ id: 'compound:3-phosphohydroxypyruvate', n: 1 }],
      pooled: { substrates: [{ id: 'compound:nad', n: 1 }], products: [{ id: 'compound:nadh', n: 1 }, { id: 'compound:proton', n: 1 }] }
    },
    'reaction:psat1-phosphoserine-transamination': {
      enzymes: ['enzyme:psat1'],
      reversible: true,
      substrates: [{ id: 'compound:3-phosphohydroxypyruvate', n: 1 }],
      products: [{ id: 'compound:3-phosphoserine', n: 1 }],
      pooled: { substrates: [{ id: 'compound:glutamate', n: 1 }], products: [{ id: 'compound:2-oxoglutarate', n: 1 }] }
    },
    'reaction:psph-phosphoserine-hydrolysis': {
      enzymes: ['enzyme:psph'],
      reversible: false,
      substrates: [{ id: 'compound:3-phosphoserine', n: 1 }],
      products: [{ id: 'compound:serine', n: 1 }],
      pooled: { substrates: [{ id: 'compound:water', n: 1 }], products: [{ id: 'compound:phosphate', n: 1 }] }
    },
    'reaction:shmt-serine-glycine-interconversion': {
      enzymes: ['enzyme:shmt1', 'enzyme:shmt2'],
      reversible: true,
      substrates: [{ id: 'compound:serine', n: 1 }],
      products: [{ id: 'compound:glycine', n: 1 }],
      pooled: { substrates: [{ id: 'compound:thf', n: 1 }], products: [{ id: 'compound:5-10-methylene-thf', n: 1 }, { id: 'compound:water', n: 1 }] }
    },
    'reaction:dmgdh-dimethylglycine-demethylation': {
      enzymes: ['enzyme:dmgdh'],
      reversible: false,
      substrates: [{ id: 'compound:dimethylglycine', n: 1 }],
      products: [{ id: 'compound:sarcosine', n: 1 }],
      pooled: { substrates: [{ id: 'compound:thf', n: 1 }, { id: 'compound:etf-oxidized', n: 1 }], products: [{ id: 'compound:5-10-methylene-thf', n: 1 }, { id: 'compound:etf-reduced', n: 1 }] }
    },
    'reaction:sardh-sarcosine-demethylation': {
      enzymes: ['enzyme:sardh'],
      reversible: false,
      substrates: [{ id: 'compound:sarcosine', n: 1 }],
      products: [{ id: 'compound:glycine', n: 1 }],
      pooled: { substrates: [{ id: 'compound:thf', n: 1 }, { id: 'compound:etf-oxidized', n: 1 }], products: [{ id: 'compound:5-10-methylene-thf', n: 1 }, { id: 'compound:etf-reduced', n: 1 }] }
    },
    'reaction:gnmt-glycine-methylation': {
      enzymes: ['enzyme:gnmt'],
      reversible: false,
      substrates: [{ id: 'compound:glycine', n: 1 }],
      products: [{ id: 'compound:sarcosine', n: 1 }],
      pooled: { substrates: [{ id: 'compound:sam', n: 1 }], products: [{ id: 'compound:sah', n: 1 }, { id: 'compound:proton', n: 1 }] }
    },
    'reaction:glycine-cleavage-system': {
      enzymes: ['enzyme:gldc', 'enzyme:amt', 'enzyme:gcsh', 'enzyme:dld'],
      reversible: false,
      substrates: [{ id: 'compound:glycine', n: 1 }],
      products: [],
      pooled: { substrates: [{ id: 'compound:thf', n: 1 }, { id: 'compound:nad', n: 1 }], products: [{ id: 'compound:5-10-methylene-thf', n: 1 }, { id: 'compound:carbon-dioxide', n: 1 }, { id: 'compound:ammonia', n: 1 }, { id: 'compound:nadh', n: 1 }, { id: 'compound:proton', n: 1 }] }
    },
    'reaction:agat-guanidinoacetate-synthesis': {
      enzymes: ['enzyme:gatm'],
      reversible: true,
      substrates: [{ id: 'compound:arginine', n: 1 }, { id: 'compound:glycine', n: 1 }],
      products: [{ id: 'compound:guanidinoacetate', n: 1 }],
      pooled: { substrates: [], products: [{ id: 'compound:ornithine', n: 1 }] }
    },
    'reaction:gss-glutathione-synthesis': {
      enzymes: ['enzyme:gss'],
      reversible: false,
      substrates: [{ id: 'compound:gamma-glutamylcysteine', n: 1 }, { id: 'compound:glycine', n: 1 }],
      products: [{ id: 'compound:glutathione', n: 1 }],
      pooled: { substrates: [{ id: 'compound:atp', n: 1 }], products: [{ id: 'compound:adp', n: 1 }, { id: 'compound:phosphate', n: 1 }, { id: 'compound:proton', n: 1 }] }
    },
    'reaction:collagen-chain-assembly': {
      enzymes: [],
      reversible: false,
      substrates: [{ id: 'compound:glycine', n: 1 }, { id: 'compound:proline', n: 2 }],
      products: [{ id: 'compound:collagen', n: 1 }],
      pooled: { substrates: [], products: [{ id: 'compound:water', n: 3 }] }
    },
    'reaction:baat-glycine-conjugation': {
      enzymes: ['enzyme:baat'],
      reversible: false,
      substrates: [{ id: 'compound:choloyl-coa', n: 1 }, { id: 'compound:glycine', n: 1 }],
      products: [{ id: 'compound:glycocholic-acid', n: 1 }],
      pooled: { substrates: [], products: [{ id: 'compound:coa', n: 1 }, { id: 'compound:proton', n: 1 }] }
    },
    'reaction:bsh-glycocholate-deconjugation': {
      enzymes: ['enzyme:bile-salt-hydrolase'],
      reversible: false,
      substrates: [{ id: 'compound:glycocholic-acid', n: 1 }],
      products: [{ id: 'compound:glycine', n: 1 }],
      pooled: { substrates: [{ id: 'compound:water', n: 1 }], products: [{ id: 'compound:cholate', n: 1 }] }
    },
    'reaction:bacterial-glycine-reductase': {
      enzymes: ['enzyme:bacterial-glycine-reductase'],
      reversible: false,
      substrates: [{ id: 'compound:glycine', n: 1 }],
      products: [{ id: 'compound:acetyl-phosphate', n: 1 }],
      pooled: { substrates: [{ id: 'compound:phosphate', n: 1 }, { id: 'compound:thioredoxin-dithiol', n: 1 }], products: [{ id: 'compound:ammonia', n: 1 }, { id: 'compound:water', n: 1 }, { id: 'compound:thioredoxin-disulfide', n: 1 }] }
    },
    'reaction:bacterial-glycine-cleavage': {
      enzymes: ['enzyme:bacterial-glycine-cleavage-system'],
      reversible: false,
      substrates: [{ id: 'compound:glycine', n: 1 }],
      products: [],
      pooled: { substrates: [{ id: 'compound:thf', n: 1 }, { id: 'compound:nad', n: 1 }], products: [{ id: 'compound:5-10-methylene-thf', n: 1 }, { id: 'compound:carbon-dioxide', n: 1 }, { id: 'compound:ammonia', n: 1 }, { id: 'compound:nadh', n: 1 }, { id: 'compound:proton', n: 1 }] }
    }
  }
}
// END GENERATED

export default { ...layout, ...generated }
