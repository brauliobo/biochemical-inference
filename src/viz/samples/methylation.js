// SAMPLE hand layout for the gallery and tests ONLY: the methionine cycle and a
// slice of the folate cycle, in the input shape MetabolicMap takes. Coordinates
// are in SVG units on the viewBox. The real layouts come from the data work, not
// from this file. The flux and concentration numbers are invented.

const compound = (id, label, x, y, extra = {}) => ({ id, kind: 'compound', label, x, y, ...extra })
const reaction = (id, label, x, y, extra = {}) => ({ id, kind: 'reaction', label, x, y, ...extra })
const enzyme = (id, label, x, y) => ({ id, kind: 'enzyme', label, x, y })

export function methylationMap() {
  const cycle = 'Methionine cycle'
  const folate = 'Folate cycle'
  return {
    viewBox: [0, 0, 900, 520],
    nodes: [
      // methionine cycle
      compound('met', 'Methionine', 330, 110, { group: cycle }),
      compound('sam', 'SAM', 630, 110, { group: cycle }),
      compound('sah', 'SAH', 630, 330, { group: cycle }),
      compound('hcy', 'Homocysteine', 330, 330, { group: cycle }),
      reaction('r-mat', 'MAT', 480, 110, { group: cycle }),
      reaction('r-ahcy', 'AHCY', 480, 330, { group: cycle, reversible: true }),
      reaction('r-mtr', 'MTR', 330, 220, { group: cycle }),
      reaction('r-gnmt', 'GNMT', 630, 220),
      compound('atp', 'ATP', 480, 40, { currency: true }),
      compound('ppi', 'PPi + Pi', 480, 175, { currency: true }),
      compound('ade', 'Adenosine', 480, 410),
      compound('gly', 'Glycine', 790, 280),
      compound('sar', 'Sarcosine', 790, 160),
      enzyme('e-mat', 'MAT1A / MAT2A', 540, 138),
      enzyme('e-ahcy', 'AHCY', 530, 305),
      enzyme('e-mtr', 'MTR (B12)', 398, 244),
      enzyme('e-gnmt', 'GNMT', 688, 244),
      { id: 'diet', kind: 'pool', label: 'Dietary methionine', x: 330, y: 36 },
      // folate cycle
      compound('mthf', '5-MTHF', 150, 150, { group: folate }),
      compound('thf', 'THF', 150, 280, { group: folate }),
      compound('ch2thf', '5,10-CH2-THF', 150, 440, { group: folate }),
      compound('ser', 'Serine', 40, 350, { group: folate }),
      reaction('r-shmt', 'SHMT', 150, 360, { group: folate, reversible: true }),
      reaction('r-mthfr', 'MTHFR', 40, 250, { group: folate }),
      compound('nadph', 'NADPH', 112, 205, { currency: true }),
      compound('nadp', 'NADP+', 112, 300, { currency: true }),
      enzyme('e-shmt', 'SHMT', 206, 384),
      enzyme('e-mthfr', 'MTHFR', 66, 228)
    ],
    edges: [
      { from: 'diet', to: 'met' },
      { from: 'met', to: 'r-mat' },
      { from: 'atp', to: 'r-mat' },
      { from: 'r-mat', to: 'sam' },
      { from: 'r-mat', to: 'ppi' },
      { from: 'e-mat', to: 'r-mat' },
      { from: 'sam', to: 'r-gnmt' },
      { from: 'gly', to: 'r-gnmt', via: [[790, 220]] },
      { from: 'r-gnmt', to: 'sah' },
      { from: 'r-gnmt', to: 'sar', stoich: 1 },
      { from: 'e-gnmt', to: 'r-gnmt' },
      { from: 'sah', to: 'r-ahcy' },
      { from: 'r-ahcy', to: 'hcy' },
      { from: 'r-ahcy', to: 'ade' },
      { from: 'e-ahcy', to: 'r-ahcy' },
      { from: 'hcy', to: 'r-mtr' },
      { from: 'mthf', to: 'r-mtr' },
      { from: 'r-mtr', to: 'met' },
      { from: 'r-mtr', to: 'thf' },
      { from: 'e-mtr', to: 'r-mtr' },
      { from: 'thf', to: 'r-shmt' },
      { from: 'ser', to: 'r-shmt' },
      { from: 'r-shmt', to: 'ch2thf' },
      { from: 'r-shmt', to: 'gly', via: [[150, 490], [790, 490]] },
      { from: 'e-shmt', to: 'r-shmt' },
      { from: 'ch2thf', to: 'r-mthfr', via: [[40, 440]] },
      { from: 'nadph', to: 'r-mthfr' },
      { from: 'r-mthfr', to: 'nadp' },
      { from: 'r-mthfr', to: 'mthf', via: [[40, 150]] },
      { from: 'e-mthfr', to: 'r-mthfr' }
    ]
  }
}

/** Invented per-reaction net rates (umol/h) and per-compound levels (uM) to show the encodings. */
export function methylationValues() {
  return {
    flux: { 'r-mat': 6.2, 'r-gnmt': 3.1, 'r-ahcy': 6.2, 'r-mtr': 2.4, 'r-shmt': 1.1, 'r-mthfr': 0.9 },
    concentration: { met: 30, sam: 60, sah: 4, hcy: 8, gly: 280, sar: 2, ade: 1, mthf: 25, thf: 6, ch2thf: 3, ser: 120 }
  }
}
