import { BOUNDARY_ENTITY_IDS, METABOLITE_IDS, REACTION_IDS } from '../shared/identifiers.js'

export const MODEL = {
  id: 'one-carbon',
  version: '1.1.1',
  engineVersion: 'rk4-1.1.0',
  concentrationUnit: 'illustrative µM',
  fluxUnit: 'illustrative µM/h',
  supportedTaxa: [9606, 10090],
  presets: [
    { id: 'baseline', name: 'Baseline activity', mthfrActivity: 1 },
    { id: 'reduced-mthfr', name: 'Reduced MTHFR activity', mthfrActivity: 0.35 },
    { id: 'custom', name: 'Custom MTHFR activity', mthfrActivity: null }
  ],
  controls: {
    mthfrActivity: { min: 0.1, max: 1.5 },
    durationHours: { min: 1, max: 72 },
    stepHours: 0.05
  },
  topology: {
    entities: [
      { id: METABOLITE_IDS.methyleneThf, name: '5,10-Methylene-THF', kind: 'curated', stateVariable: true, knowledgeCompoundId: METABOLITE_IDS.methyleneThf },
      { id: METABOLITE_IDS.methylThf, name: '5-Methyl-THF', kind: 'curated', stateVariable: true, knowledgeCompoundId: METABOLITE_IDS.methylThf },
      { id: METABOLITE_IDS.methionine, name: 'Methionine', kind: 'curated', stateVariable: true, knowledgeCompoundId: METABOLITE_IDS.methionine },
      { id: METABOLITE_IDS.sam, name: 'SAM', kind: 'curated', stateVariable: true, knowledgeCompoundId: METABOLITE_IDS.sam },
      { id: METABOLITE_IDS.sah, name: 'SAH', kind: 'curated', stateVariable: true, knowledgeCompoundId: METABOLITE_IDS.sah },
      { id: METABOLITE_IDS.homocysteine, name: 'Homocysteine', kind: 'curated', stateVariable: true, knowledgeCompoundId: METABOLITE_IDS.homocysteine },
      { id: BOUNDARY_ENTITY_IDS.methionineSource, name: 'Methionine boundary source', kind: 'boundary', stateVariable: false },
      { id: BOUNDARY_ENTITY_IDS.homocysteineSource, name: 'Homocysteine boundary source', kind: 'boundary', stateVariable: false },
      { id: BOUNDARY_ENTITY_IDS.homocysteineSink, name: 'Homocysteine boundary sink', kind: 'boundary', stateVariable: false }
    ],
    reactions: [
      { id: REACTION_IDS.mthfr, name: 'MTHFR reduction', kind: 'curated', reactantIds: [METABOLITE_IDS.methyleneThf], productIds: [METABOLITE_IDS.methylThf], fluxSeriesId: REACTION_IDS.mthfr, knowledgeReactionId: REACTION_IDS.mthfr },
      { id: REACTION_IDS.remethylation, name: 'Lumped methionine synthase and folate regeneration', kind: 'model-only', reactantIds: [METABOLITE_IDS.methylThf, METABOLITE_IDS.homocysteine], productIds: [METABOLITE_IDS.methionine, METABOLITE_IDS.methyleneThf], fluxSeriesId: REACTION_IDS.remethylation, knowledgeReactionId: REACTION_IDS.remethylation },
      { id: REACTION_IDS.mat, name: 'SAM synthesis', kind: 'model-only', reactantIds: [METABOLITE_IDS.methionine], productIds: [METABOLITE_IDS.sam], fluxSeriesId: REACTION_IDS.mat },
      { id: REACTION_IDS.methylation, name: 'Methylation demand', kind: 'model-only', reactantIds: [METABOLITE_IDS.sam], productIds: [METABOLITE_IDS.sah], fluxSeriesId: REACTION_IDS.methylation },
      { id: REACTION_IDS.sahHydrolase, name: 'SAH hydrolysis', kind: 'model-only', reactantIds: [METABOLITE_IDS.sah], productIds: [METABOLITE_IDS.homocysteine], fluxSeriesId: REACTION_IDS.sahHydrolase },
      { id: REACTION_IDS.homocysteineClearance, name: 'Homocysteine clearance', kind: 'boundary', reactantIds: [METABOLITE_IDS.homocysteine], productIds: [BOUNDARY_ENTITY_IDS.homocysteineSink], fluxSeriesId: REACTION_IDS.homocysteineClearance },
      { id: REACTION_IDS.methionineInput, name: 'Methionine input', kind: 'boundary', reactantIds: [BOUNDARY_ENTITY_IDS.methionineSource], productIds: [METABOLITE_IDS.methionine], fluxSeriesId: REACTION_IDS.methionineInput },
      { id: REACTION_IDS.homocysteineInput, name: 'Homocysteine input', kind: 'boundary', reactantIds: [BOUNDARY_ENTITY_IDS.homocysteineSource], productIds: [METABOLITE_IDS.homocysteine], fluxSeriesId: REACTION_IDS.homocysteineInput }
    ]
  },
  limitations: [
    'This bounded pathway is not a whole-cell, organ, or whole-body model.',
    'Initial concentrations and kinetic constants are illustrative model assumptions, not measured physiology.',
    'Protein associations are curated knowledge; trajectories are model predictions and are not clinical guidance.',
    'The remethylation equation lumps methionine synthase with folate regeneration; the linked Rhea reaction produces THF rather than 5,10-methylene-THF.',
    'The fixed-step deterministic solver does not represent biological variability or uncertainty.'
  ]
}
