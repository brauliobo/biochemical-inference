// Toy methionine/SAM/SAH cycle that exercises every part of the model-data format.
// ILLUSTRATIVE ONLY: parameters are round numbers chosen for a sensible shape, not measured physiology.
// Units: concentration in uM, time in minutes, flux in uM/min.
//
//   (diet) -> met --MAT--> sam --methyltransferases--> sah --recycle--> met      (closed core cycle)
//                           |  gnmt: sam + gly -> sah + sarcosine (sink)
//   met --drain-> (transsulfuration)         gly: constant input, first-order clearance
//
// The core (met + sam + sah) is conserved by mat, gnmt, mt_other and recycle; met_in and drain are
// the only open reactions, so conservedSums reports exactly those two as violations.

export const toyModel = {
  id: 'toy-methyl-cycle',
  name: 'Toy methyl-donor / SAM / SAH cycle',
  label: 'Illustrative educational model - not measurable physiology or medical advice',
  time: { unit: 'min', duration: 240 },
  species: [
    { id: 'met', name: 'Methionine (methyl donor pool)', initial: 30, unit: 'uM', compartment: 'cytosol', ontologyId: 'compound:methionine' },
    { id: 'sam', name: 'S-adenosylmethionine', initial: 60, unit: 'uM', compartment: 'cytosol', ontologyId: 'compound:sam' },
    { id: 'sah', name: 'S-adenosylhomocysteine', initial: 10, unit: 'uM', compartment: 'cytosol', ontologyId: 'compound:sah' },
    { id: 'gly', name: 'Glycine (GNMT acceptor)', initial: 100, unit: 'uM', compartment: 'cytosol', ontologyId: 'compound:glycine' },
    { id: 'sar', name: 'Sarcosine (sink, held constant)', initial: 0, unit: 'uM', fixed: true, ontologyId: 'compound:sarcosine' }
  ],
  parameters: [
    { id: 'met_in_rate', value: 6, low: 3, high: 12, unit: 'uM/min', source: 'assumed', confidence: 'assumed' },
    { id: 'vmax_mat', value: 40, low: 20, high: 80, unit: 'uM/min', source: 'assumed', confidence: 'assumed' },
    { id: 'km_mat', value: 40, low: 20, high: 100, unit: 'uM', source: 'assumed', confidence: 'assumed' },
    { id: 'ki_mat_sam', value: 500, low: 200, high: 1500, unit: 'uM', source: 'assumed', confidence: 'assumed' },
    { id: 'vmax_gnmt', value: 12, low: 4, high: 30, unit: 'uM/min', source: 'assumed', confidence: 'assumed' },
    { id: 'km_gnmt_sam', value: 40, low: 20, high: 100, unit: 'uM', source: 'assumed', confidence: 'assumed' },
    { id: 'km_gnmt_gly', value: 60, low: 20, high: 200, unit: 'uM', source: 'assumed', confidence: 'assumed' },
    { id: 'vmax_mt', value: 20, low: 10, high: 40, unit: 'uM/min', source: 'assumed', confidence: 'assumed' },
    { id: 'km_mt', value: 5, low: 2, high: 15, unit: 'uM', source: 'assumed', confidence: 'assumed' },
    { id: 'ki_mt_sah', value: 8, low: 3, high: 20, unit: 'uM', source: 'assumed', confidence: 'assumed' },
    { id: 'vmax_rec', value: 40, low: 20, high: 80, unit: 'uM/min', source: 'assumed', confidence: 'assumed' },
    { id: 'km_rec', value: 6, low: 3, high: 20, unit: 'uM', source: 'assumed', confidence: 'assumed' },
    { id: 'k_drain', value: 0.2, low: 0.1, high: 0.4, unit: '1/min', source: 'assumed', confidence: 'assumed' },
    { id: 'gly_in_rate', value: 20, low: 10, high: 40, unit: 'uM/min', source: 'assumed', confidence: 'assumed' },
    { id: 'k_gly_out', value: 0.2, low: 0.1, high: 0.4, unit: '1/min', source: 'assumed', confidence: 'assumed' }
  ],
  reactions: [
    { id: 'met_in', name: 'Dietary methionine input', substrates: [], products: [{ species: 'met', n: 1 }], rate: { law: 'constantInput', params: { rate: 'met_in_rate' }, refs: [] } },
    {
      id: 'mat', name: 'Methionine adenosyltransferase', ontologyId: 'reaction:mat-sam-synthesis', enzymeId: 'enzyme:mat',
      substrates: [{ species: 'met', n: 1 }], products: [{ species: 'sam', n: 1 }],
      rate: {
        law: 'michaelisMenten', params: { Vmax: 'vmax_mat', Km: 'km_mat' }, refs: [],
        modifiers: [{ law: 'allostericInhibition', species: { I: 'sam' }, params: { Ki: 'ki_mat_sam' } }]
      }
    },
    {
      id: 'gnmt', name: 'Glycine N-methyltransferase', ontologyId: 'reaction:gnmt-glycine-methylation', enzymeId: 'enzyme:gnmt',
      substrates: [{ species: 'sam', n: 1 }, { species: 'gly', n: 1 }], products: [{ species: 'sah', n: 1 }, { species: 'sar', n: 1 }],
      rate: { law: 'randomBiBi', params: { Vmax: 'vmax_gnmt', Kma: 'km_gnmt_sam', Kmb: 'km_gnmt_gly' }, refs: [] }
    },
    {
      id: 'mt_other', name: 'Other methyltransferases (lumped, SAH-inhibited)',
      substrates: [{ species: 'sam', n: 1 }], products: [{ species: 'sah', n: 1 }],
      rate: { law: 'competitiveInhibition', params: { Vmax: 'vmax_mt', Km: 'km_mt', Ki: 'ki_mt_sah' }, species: { S: 'sam', I: 'sah' }, refs: [] }
    },
    {
      id: 'recycle', name: 'SAH hydrolysis and remethylation (lumped)', ontologyId: 'reaction:ahcy-sah-hydrolysis',
      substrates: [{ species: 'sah', n: 1 }], products: [{ species: 'met', n: 1 }],
      rate: { law: 'michaelisMenten', params: { Vmax: 'vmax_rec', Km: 'km_rec' }, refs: [] }
    },
    { id: 'drain', name: 'Transsulfuration drain', substrates: [{ species: 'met', n: 1 }], products: [], rate: { law: 'firstOrder', params: { k: 'k_drain' }, refs: [] } },
    { id: 'gly_in', name: 'Glycine supply', substrates: [], products: [{ species: 'gly', n: 1 }], rate: { law: 'constantInput', params: { rate: 'gly_in_rate' }, refs: [] } },
    { id: 'gly_out', name: 'Glycine clearance', substrates: [{ species: 'gly', n: 1 }], products: [], rate: { law: 'firstOrder', params: { k: 'k_gly_out' }, refs: [] } }
  ],
  controls: [
    { id: 'gnmtActivity', label: 'GNMT activity (x)', min: 0, max: 3, default: 1, unit: 'x', effects: [{ target: 'reaction', id: 'gnmt', op: 'multiply' }] },
    { id: 'glycineIntake', label: 'Glycine intake (x)', min: 0, max: 5, default: 1, unit: 'x', effects: [{ target: 'param', id: 'gly_in_rate', op: 'multiply' }] },
    { id: 'metIntake', label: 'Methionine intake (x)', min: 0, max: 3, default: 1, unit: 'x', effects: [{ target: 'param', id: 'met_in_rate', op: 'multiply' }] }
  ],
  events: [{ time: 60, add: { gly: 500 }, label: 'Glycine bolus (+500 uM)' }],
  observables: [
    { id: 'samSahRatio', label: 'SAM:SAH', unit: 'ratio', expr: { ratio: ['sam', 'sah'] } },
    { id: 'methylFlux', label: 'Methyl-transfer flux', unit: 'uM/min', expr: { sum: ['gnmt', 'mt_other'] } },
    { id: 'corePool', label: 'met + sam + sah', unit: 'uM', expr: { sum: ['met', 'sam', 'sah'] } }
  ]
}

/** Species groups whose totals the closed core cycle should conserve. */
export const toyConservedGroups = [{ id: 'corePool', name: 'Methionine moiety (met + sam + sah)', species: ['met', 'sam', 'sah'] }]

export default toyModel
