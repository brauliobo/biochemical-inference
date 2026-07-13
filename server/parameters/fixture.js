import {
  PARAMETER_CONTRACT_VERSION,
  PARAMETER_RELEASE_DIGEST,
  PARAMETER_RELEASE_ID,
  UpstreamParameterCandidatesResponseSchema,
  UpstreamParameterCatalogSchema,
  UpstreamParameterContextsResponseSchema,
  UpstreamParameterDatasetsResponseSchema
} from '../../shared/parameter-contracts.js'

export const FIXTURE_PARAMETER_RELEASE = Object.freeze({ id: PARAMETER_RELEASE_ID, schema_version: PARAMETER_CONTRACT_VERSION, digest: PARAMETER_RELEASE_DIGEST })

const parameters = [
  { id: 'PARAMETER:DECAY-K', name: 'Synthetic first-order decay constant', model_symbol: 'k_decay', dimension: 'first_order_rate', canonical_unit: 's^-1', reference_context_id: 'CONTEXT:SYNTHETIC-DECAY', description: 'Algorithm-validation parameter for x(t) = x0 exp(-k t); it is not a biological estimate.' },
  { id: 'PARAMETER:MTHFR-KM-CH2THF', name: 'Illustrative MTHFR substrate half-saturation constant', model_symbol: 'km_mthfr_ch2thf', dimension: 'concentration', canonical_unit: 'umol/L', reference_context_id: 'CONTEXT:HUMAN-LIVER-CYTOSOL', description: 'Illustrative one-carbon model assumption, not a measured kinetic constant.' },
  { id: 'PARAMETER:MTHFR-VMAX', name: 'Illustrative MTHFR maximum rate', model_symbol: 'vmax_mthfr', dimension: 'concentration_rate', canonical_unit: 'umol/L/s', reference_context_id: 'CONTEXT:HUMAN-LIVER-CYTOSOL', description: 'Illustrative one-carbon model assumption, not a measured tissue rate.' }
]

const contexts = [
  { id: 'CONTEXT:SYNTHETIC-DECAY', name: 'Dimensionless first-order decay benchmark', taxon_id: null, tissue_id: null, compartment_id: null, assay_id: 'ASSAY:SYNTHETIC-ODE', ph: null, temperature: null, biological_scope: 'synthetic' },
  { id: 'CONTEXT:HUMAN-LIVER-CYTOSOL', name: 'Illustrative human liver cytosol condition', taxon_id: 'NCBITaxon:9606', tissue_id: 'UBERON:0002107', compartment_id: 'GO:0005829', assay_id: 'ASSAY:ILLUSTRATIVE-STEADY-STATE', ph: 7.4, temperature: { value: 310.15, unit: 'K' }, biological_scope: 'biological' },
  { id: 'CONTEXT:HUMAN-LIVER-CYTOSOL-PH68', name: 'Competing illustrative human liver cytosol condition', taxon_id: 'NCBITaxon:9606', tissue_id: 'UBERON:0002107', compartment_id: 'GO:0005829', assay_id: 'ASSAY:ILLUSTRATIVE-PH-SENSITIVITY', ph: 6.8, temperature: { value: 310.15, unit: 'K' }, biological_scope: 'biological' },
  { id: 'CONTEXT:MOUSE-LIVER-CYTOSOL', name: 'Taxon-mismatched illustrative mouse liver cytosol condition', taxon_id: 'NCBITaxon:10090', tissue_id: 'UBERON:0002107', compartment_id: 'GO:0005829', assay_id: 'ASSAY:ILLUSTRATIVE-STEADY-STATE', ph: 7.4, temperature: { value: 310.15, unit: 'K' }, biological_scope: 'biological' }
]

const evidence = [
  { id: 'EVIDENCE:SYNTHETIC-DECAY-PROTOCOL', source_id: 'SYNTHETIC_BENCHMARK', evidence_class: 'synthetic', locator_type: 'synthetic-protocol', citation: 'Deterministic first-order decay benchmark generated for solver and calibration validation.', locator: 'datasets.json#DATASET:SYNTHETIC-FIRST-ORDER-DECAY', url: 'https://github.com/bc1-global/biochemical-db' },
  { id: 'EVIDENCE:ILLUSTRATIVE-ONE-CARBON-BASE', source_id: 'CURATOR_ASSUMPTION', evidence_class: 'assumption', locator_type: 'assumption-rationale', citation: 'Illustrative MTHFR values selected only to exercise parameter-selection and uncertainty software.', locator: 'candidates.json#illustrative-one-carbon-base', url: 'https://github.com/bc1-global/biochemical-db' },
  { id: 'EVIDENCE:ILLUSTRATIVE-ONE-CARBON-COMPETING', source_id: 'CURATOR_ASSUMPTION', evidence_class: 'assumption', locator_type: 'assumption-rationale', citation: 'Competing pH and taxon cases constructed to test applicability filtering.', locator: 'candidates.json#illustrative-competing-contexts', url: 'https://github.com/bc1-global/biochemical-db' }
]

function applicability(status, target_context_id, qualifiers, rationale) {
  return { status, target_context_id, qualifiers, rationale }
}

const candidates = [
  { id: 'CANDIDATE:DECAY-POINT', parameter_id: 'PARAMETER:DECAY-K', context_id: 'CONTEXT:SYNTHETIC-DECAY', unit: 's^-1', evidence_class: 'synthetic', evidence_locator_ids: [evidence[0].id], applicability: applicability('applicable', contexts[0].id, ['exact-context'], 'Exact generating value for the bounded synthetic benchmark.'), note: 'Synthetic algorithm-validation truth, not measured biology.', value_kind: 'point', value: 0.1 },
  { id: 'CANDIDATE:DECAY-INTERVAL', parameter_id: 'PARAMETER:DECAY-K', context_id: 'CONTEXT:SYNTHETIC-DECAY', unit: 's^-1', evidence_class: 'synthetic', evidence_locator_ids: [evidence[0].id], applicability: applicability('applicable', contexts[0].id, ['exact-context'], 'Bounded search interval around the synthetic generating value.'), note: 'Synthetic calibration search interval.', value_kind: 'interval', lower: 0.05, upper: 0.15, interval_type: 'range' },
  { id: 'CANDIDATE:DECAY-NORMAL', parameter_id: 'PARAMETER:DECAY-K', context_id: 'CONTEXT:SYNTHETIC-DECAY', unit: 's^-1', evidence_class: 'synthetic', evidence_locator_ids: [evidence[0].id], applicability: applicability('applicable', contexts[0].id, ['exact-context'], 'Synthetic prior for uncertainty algorithm checks.'), note: 'Synthetic distribution, not empirical variability.', value_kind: 'distribution', distribution: { family: 'normal', mean: 0.1, standard_deviation: 0.01 } },
  { id: 'CANDIDATE:DECAY-CONVERTIBLE', parameter_id: 'PARAMETER:DECAY-K', context_id: 'CONTEXT:SYNTHETIC-DECAY', unit: 'min^-1', evidence_class: 'synthetic', evidence_locator_ids: [evidence[0].id], applicability: applicability('applicable', contexts[0].id, ['exact-context', 'unit-conversion-required'], '6 min^-1 converts exactly to the canonical 0.1 s^-1.'), note: 'Positive unit-conversion fixture.', value_kind: 'point', value: 6 },
  { id: 'CANDIDATE:DECAY-INCOMPATIBLE-UNIT', parameter_id: 'PARAMETER:DECAY-K', context_id: 'CONTEXT:SYNTHETIC-DECAY', unit: 'umol/L', evidence_class: 'synthetic', evidence_locator_ids: [evidence[0].id], applicability: applicability('excluded', contexts[0].id, ['incompatible-unit'], 'Concentration is dimensionally incompatible with a first-order rate.'), note: 'Deliberate negative fixture retained visibly but never selectable.', value_kind: 'point', value: 0.1 },
  { id: 'CANDIDATE:MTHFR-KM-ASSUMED', parameter_id: 'PARAMETER:MTHFR-KM-CH2THF', context_id: 'CONTEXT:HUMAN-LIVER-CYTOSOL', unit: 'umol/L', evidence_class: 'assumption', evidence_locator_ids: [evidence[1].id], applicability: applicability('applicable', contexts[1].id, ['exact-context'], 'Matches the illustrative target context by construction.'), note: 'Illustrative software fixture; not a measured human MTHFR Km.', value_kind: 'distribution', distribution: { family: 'normal', mean: 25, standard_deviation: 5 } },
  { id: 'CANDIDATE:MTHFR-VMAX-ASSUMED', parameter_id: 'PARAMETER:MTHFR-VMAX', context_id: 'CONTEXT:HUMAN-LIVER-CYTOSOL', unit: 'umol/L/s', evidence_class: 'assumption', evidence_locator_ids: [evidence[1].id], applicability: applicability('applicable', contexts[1].id, ['exact-context'], 'Matches the illustrative target context by construction.'), note: 'Illustrative software fixture; not a measured human liver rate.', value_kind: 'distribution', distribution: { family: 'lognormal', log_mean: -2.302585092994046, log_standard_deviation: 0.2 } },
  { id: 'CANDIDATE:MTHFR-KM-COMPETING-PH', parameter_id: 'PARAMETER:MTHFR-KM-CH2THF', context_id: 'CONTEXT:HUMAN-LIVER-CYTOSOL-PH68', unit: 'mmol/L', evidence_class: 'assumption', evidence_locator_ids: [evidence[2].id], applicability: applicability('applicable', contexts[1].id, ['competing-context', 'unit-conversion-required'], 'Same taxon, tissue, and compartment but a competing pH/assay context requiring explicit selection and conversion.'), note: 'Illustrative competing assumption, not measured pH dependence.', value_kind: 'interval', lower: 0.03, upper: 0.05, interval_type: 'range' },
  { id: 'CANDIDATE:MTHFR-KM-MOUSE-MISMATCH', parameter_id: 'PARAMETER:MTHFR-KM-CH2THF', context_id: 'CONTEXT:MOUSE-LIVER-CYTOSOL', unit: 'umol/L', evidence_class: 'assumption', evidence_locator_ids: [evidence[2].id], applicability: applicability('excluded', contexts[1].id, ['taxon-mismatch'], 'Mouse context cannot be silently applied to the human target.'), note: 'Illustrative taxon-mismatch fixture, not measured mouse biology.', value_kind: 'point', value: 30 }
]

const correlations = [{ id: 'CORRELATION:MTHFR-ILLUSTRATIVE-PAIR', candidate_ids: ['CANDIDATE:MTHFR-KM-ASSUMED', 'CANDIDATE:MTHFR-VMAX-ASSUMED'], matrix: [[1, 0.6], [0.6, 1]], matrix_type: 'correlation', positive_semidefinite_tolerance: 1e-10, rationale: 'Illustrative positive correlation used only to test joint sampling and covariance propagation.' }]

const uncertainties = [
  { id: 'UNCERTAINTY:DECAY-BENCHMARK', subject_id: 'CANDIDATE:DECAY-NORMAL', components: [
    { category: 'biological', representation: 'qualitative', value: null, unit: null, description: 'Not applicable: the benchmark is not biological.' },
    { category: 'measurement', representation: 'qualitative', value: null, unit: null, description: 'No measurement process occurred; values are generated.' },
    { category: 'structural', representation: 'qualitative', value: null, unit: null, description: 'The benchmark assumes the first-order decay equation exactly.' },
    { category: 'contextual', representation: 'qualitative', value: null, unit: null, description: 'No taxon, tissue, compartment, pH, or temperature is asserted.' },
    { category: 'numerical', representation: 'relative-standard-deviation', value: 1e-12, unit: null, description: 'Tolerance for floating-point benchmark comparison.' }
  ] },
  { id: 'UNCERTAINTY:MTHFR-KM-ASSUMED', subject_id: 'CANDIDATE:MTHFR-KM-ASSUMED', components: [
    { category: 'biological', representation: 'absolute-standard-deviation', value: 5, unit: 'umol/L', description: 'Illustrative spread, not an empirical biological variance estimate.' },
    { category: 'contextual', representation: 'qualitative', value: null, unit: null, description: 'Applicability is limited to the declared illustrative context.' },
    { category: 'structural', representation: 'qualitative', value: null, unit: null, description: 'A Michaelis-Menten parameterization is assumed rather than established.' }
  ] },
  { id: 'UNCERTAINTY:MTHFR-VMAX-ASSUMED', subject_id: 'CANDIDATE:MTHFR-VMAX-ASSUMED', components: [
    { category: 'biological', representation: 'relative-standard-deviation', value: 0.2, unit: null, description: 'Illustrative spread, not an empirical tissue variance estimate.' },
    { category: 'contextual', representation: 'qualitative', value: null, unit: null, description: 'No expression, enzyme abundance, or tissue scaling evidence is supplied.' },
    { category: 'structural', representation: 'qualitative', value: null, unit: null, description: 'The maximum-rate abstraction is an explicit model assumption.' }
  ] }
]

const dataset = { id: 'DATASET:SYNTHETIC-FIRST-ORDER-DECAY', title: 'Bounded noiseless first-order decay algorithm benchmark', data_origin: 'synthetic', context_id: contexts[0].id, parameter_ids: [parameters[0].id], independent_variable: 'time', independent_unit: 's', observable: 'synthetic state x', observable_unit: 'umol/L', evidence_locator_ids: [evidence[0].id], source_id: 'SYNTHETIC_BENCHMARK', generation_method: 'x(t) = 10 umol/L * exp(-0.1 s^-1 * t), evaluated at eight fixed times with no noise and rounded to 12 decimal places.', bounded_scope: 'Algorithm validation only over t in [0, 10] s; no organism, tissue, assay measurement, or biological inference.' }
const points = [[0, 10], [1, 9.04837418036], [2, 8.18730753078], [3, 7.408182206817], [4, 6.703200460356], [6, 5.48811636094], [8, 4.493289641172], [10, 3.678794411714]]
const observations = points.map(([time, value]) => ({ id: `OBSERVATION:DECAY-T${time}`, dataset_id: dataset.id, replicate_id: 'synthetic-1', independent_value: time, value, data_origin: 'synthetic' }))
const partition = { id: 'PARTITION:DECAY-FIXED-CALIBRATION-VALIDATION', dataset_id: dataset.id, fixed: true, assignment_method: 'explicit-identifiers-v1', calibration_observation_ids: observations.slice(0, 5).map((item) => item.id), validation_observation_ids: observations.slice(5).map((item) => item.id), rationale: 'Early fixed time points calibrate k; three later, never-reused time points validate extrapolation within the declared 10 s bound.' }

function closureForCandidates(selected) {
  const parameterIds = new Set(selected.map((item) => item.parameter_id))
  const contextIds = new Set(selected.map((item) => item.context_id))
  const evidenceIds = new Set(selected.flatMap((item) => item.evidence_locator_ids))
  const candidateIds = new Set(selected.map((item) => item.id))
  return UpstreamParameterCandidatesResponseSchema.parse({
    release: FIXTURE_PARAMETER_RELEASE,
    items: selected,
    parameters: parameters.filter((item) => parameterIds.has(item.id)),
    contexts: contexts.filter((item) => contextIds.has(item.id)),
    evidence: evidence.filter((item) => evidenceIds.has(item.id)),
    uncertainties: uncertainties.filter((item) => candidateIds.has(item.subject_id)),
    correlations: correlations.filter((item) => item.candidate_ids.every((id) => candidateIds.has(id)))
  })
}

export function createParameterFixtureClient() {
  return {
    async catalog() {
      return UpstreamParameterCatalogSchema.parse({ catalog_schema_version: PARAMETER_CONTRACT_VERSION, releases: [{ release_id: PARAMETER_RELEASE_ID, title: 'Parameter evidence and calibration benchmark', schema_version: PARAMETER_CONTRACT_VERSION, release_digest: PARAMETER_RELEASE_DIGEST, manifest_path: `${PARAMETER_RELEASE_ID}/manifest.json` }] })
    },
    async candidates(filters = {}) {
      const selected = candidates.filter((item) => !filters.parameterId || item.parameter_id === filters.parameterId)
      return closureForCandidates(selected)
    },
    async datasets(filters = {}) {
      const selected = (!filters.datasetId || filters.datasetId === dataset.id) && (!filters.parameterId || dataset.parameter_ids.includes(filters.parameterId)) && (!filters.contextId || dataset.context_id === filters.contextId) ? [dataset] : []
      return UpstreamParameterDatasetsResponseSchema.parse({ release: FIXTURE_PARAMETER_RELEASE, items: selected, observations: selected.length ? observations : [], partitions: selected.length ? [partition] : [], uncertainties: [] })
    },
    async contexts() {
      return UpstreamParameterContextsResponseSchema.parse({ release: FIXTURE_PARAMETER_RELEASE, items: contexts, options: { taxon_ids: ['NCBITaxon:10090', 'NCBITaxon:9606'], tissue_ids: ['UBERON:0002107'], compartment_ids: ['GO:0005829'], assay_ids: ['ASSAY:ILLUSTRATIVE-PH-SENSITIVITY', 'ASSAY:ILLUSTRATIVE-STEADY-STATE', 'ASSAY:SYNTHETIC-ODE'], ph_values: [6.8, 7.4], temperatures: [{ value: 310.15, unit: 'K' }] } })
    }
  }
}
