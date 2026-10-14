// ILLUSTRATIVE sample for the gallery and tests only: a small causal map in the
// shape LayeredGraph takes. The links and grades are invented for the demo; the
// real map comes from the knowledge data.

export const causalTierNames = Object.freeze(['Intervention', 'Molecule', 'Pool', 'State', 'Outcome'])

export function causalSample() {
  const n = (id, label, type, tier, grade) => ({ id, label, type, tier, grade })
  const e = (from, to, sign, extra = {}) => ({ from, to, sign, ...extra })
  return {
    tierNames: causalTierNames,
    nodes: [
      n('glycine-powder', 'Glycine powder 10 g', 'intervention', 0, 'established'),
      n('choline-supp', 'Choline supplement', 'intervention', 0, 'established'),
      n('ppi', 'Acid suppression (PPI)', 'intervention', 0, 'established'),
      n('glycine', 'Glycine', 'compound', 1, 'established'),
      n('gnmt', 'GNMT', 'enzyme', 1, 'established'),
      n('choline', 'Choline', 'compound', 1, 'established'),
      n('betaine', 'Betaine', 'compound', 1, 'established'),
      n('sam', 'SAM', 'compound', 2, 'established'),
      n('pemt', 'PEMT', 'enzyme', 2, 'established'),
      n('pc', 'Phosphatidylcholine', 'compound', 2, 'established'),
      n('undermethylation', 'Under-methylation', 'state', 3, 'plausible'),
      n('low-ach', 'Low acetylcholine', 'state', 3, 'speculative'),
      n('vagal', 'Reduced vagal tone', 'state', 3, 'speculative'),
      n('acid', 'Stomach acid output', 'state', 3, 'established'),
      n('dysmotility', 'Gut dysmotility', 'outcome', 4, 'speculative'),
      n('belching', 'Belching', 'outcome', 4, 'conversation-only'),
      n('throat-burn', 'Throat burn', 'outcome', 4, 'conversation-only')
    ],
    edges: [
      e('glycine-powder', 'glycine', 'increase'),
      e('glycine', 'gnmt', 'increase'),
      e('gnmt', 'sam', 'decrease'),
      e('sam', 'pemt', 'increase'),
      e('pemt', 'pc', 'increase'),
      e('choline-supp', 'choline', 'increase'),
      e('choline', 'pc', 'increase'),
      e('choline', 'betaine', 'increase'),
      e('betaine', 'sam', 'increase'),
      e('sam', 'undermethylation', 'decrease'),
      e('pc', 'low-ach', 'decrease', { hypothesis: true }),
      e('low-ach', 'vagal', 'decrease', { hypothesis: true }),
      e('vagal', 'dysmotility', 'increase', { hypothesis: true }),
      e('undermethylation', 'dysmotility', 'increase', { hypothesis: true }),
      e('ppi', 'acid', 'decrease'),
      e('acid', 'belching', 'increase', { hypothesis: true }),
      e('dysmotility', 'belching', 'increase', { hypothesis: true }),
      e('belching', 'throat-burn', 'aggravate', { hypothesis: true }),
      e('throat-burn', 'belching', 'aggravate', { hypothesis: true }),
      e('choline-supp', 'dysmotility', 'mitigate', { hypothesis: true }),
      e('glycine', 'sam', 'neutral', { hypothesis: true })
    ]
  }
}
