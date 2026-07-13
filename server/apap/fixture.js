import {
  APAP_CONTRACT_VERSION,
  APAP_RELEASE_DIGEST,
  APAP_RELEASE_ID,
  UpstreamApapCatalogSchema,
  UpstreamApapAssumptionsSchema,
  UpstreamApapContextsSchema,
  UpstreamApapDetailSchema,
  UpstreamApapObservationsSchema,
  UpstreamApapLimitationsSchema,
  UpstreamApapParametersSchema,
  UpstreamApapProtocolsSchema,
  UpstreamApapValidationSchema
} from '../../shared/apap-contracts.js'

export const FIXTURE_APAP_RELEASE = Object.freeze({ id: APAP_RELEASE_ID, schema_version: APAP_CONTRACT_VERSION, digest: APAP_RELEASE_DIGEST })

const contexts = [
  { id: 'CONTEXT:APAP-HUMAN-LIVER', name: 'Human liver and hepatocyte algorithm-demonstration context', taxon_id: 'NCBITaxon:9606', taxon_label: 'Homo sapiens', organ_id: 'UBERON:0002107', organ_label: 'liver', cell_type_id: 'CL:0000182', cell_type_label: 'hepatocyte', strain: null, sex: 'not-specified', challenge_route: 'oral', fasting_status: 'not-specified', fasting_detail: 'Fasting and sex are intentionally unspecified; this synthetic context does not represent a clinical cohort.', source_ids: ['NCBI_TAXONOMY', 'UBERON', 'CELL_ONTOLOGY'] },
  { id: 'CONTEXT:APAP-MOUSE-LIVER', name: 'Male fasted C57BL/6J mouse liver and hepatocyte algorithm-demonstration context', taxon_id: 'NCBITaxon:10090', taxon_label: 'Mus musculus', organ_id: 'UBERON:0002107', organ_label: 'liver', cell_type_id: 'CL:0000182', cell_type_label: 'hepatocyte', strain: 'C57BL/6J', sex: 'male', challenge_route: 'intraperitoneal', fasting_status: 'fasted', fasting_detail: 'Fasted before challenge; duration is intentionally unspecified because this is synthetic.', source_ids: ['NCBI_TAXONOMY', 'UBERON', 'CELL_ONTOLOGY'] }
]

const parameterRows = [
  ['HUMAN-DOSE', 'HUMAN-PK', 'CONTEXT:APAP-HUMAN-LIVER', 'dose', 1000, 'mg'],
  ['HUMAN-VOLUME', 'HUMAN-PK', 'CONTEXT:APAP-HUMAN-LIVER', 'volume', 50, 'L'],
  ['HUMAN-ELIMINATION', 'HUMAN-PK', 'CONTEXT:APAP-HUMAN-LIVER', 'elimination_rate', 0.2, 'h^-1'],
  ['MOUSE-DOSE', 'MOUSE-INJURY', 'CONTEXT:APAP-MOUSE-LIVER', 'dose', 300, 'mg/kg'],
  ['MOUSE-THRESHOLD', 'MOUSE-INJURY', 'CONTEXT:APAP-MOUSE-LIVER', 'threshold', 150, 'mg/kg'],
  ['MOUSE-DOSE-SCALE', 'MOUSE-INJURY', 'CONTEXT:APAP-MOUSE-LIVER', 'dose_scale', 150, 'mg/kg'],
  ['MOUSE-INJURY-RATE', 'MOUSE-INJURY', 'CONTEXT:APAP-MOUSE-LIVER', 'injury_rate', 0.1, 'h^-1'],
  ['NAC-INITIAL-INDEX', 'DELAYED-NAC', 'CONTEXT:APAP-HUMAN-LIVER', 'initial_index', 1, '1'],
  ['NAC-ATTENUATION', 'DELAYED-NAC', 'CONTEXT:APAP-HUMAN-LIVER', 'nac_attenuation_rate', 0.08, 'h^-1'],
  ['NAC-DELAY', 'DELAYED-NAC', 'CONTEXT:APAP-HUMAN-LIVER', 'nac_delay', 12, 'h']
]

const equations = {
  'HUMAN-PK': 'C(t) = dose / volume * exp(-elimination_rate * t)',
  'MOUSE-INJURY': 'I(t) = max(0, (dose - threshold) / dose_scale) * (1 - exp(-injury_rate * t))',
  'DELAYED-NAC': 'I_NAC(t) = initial_index * exp(-nac_attenuation_rate * max(0, t - nac_delay))'
}

const parameters = parameterRows.map(([suffix, equation, context_id, symbol, value, unit]) => ({
  id: `PARAMETER:APAP-${suffix}`,
  equation_id: `EQUATION:APAP-${equation}`,
  equation: equations[equation],
  context_id,
  symbol,
  name: `Illustrative ${suffix.toLowerCase().replaceAll('-', ' ')}`,
  quantity: { value, unit },
  value_origin: 'illustrative-assumption',
  evidence_class: 'illustrative-assumption',
  assumption_id: `ASSUMPTION:APAP-${suffix}`,
  validation_status: 'unsupported'
}))

const extraAssumptions = [
  ['NAC-CHALLENGE', 1000, 'mg'],
  ['NAC-DOSE', 150, 'mg/kg']
]
const assumptions = [
  ...parameters.map((item) => ({ id: item.assumption_id, label: item.name, statement: `${item.name} is a synthetic software input, not measured evidence or guidance.`, quantity: item.quantity, context_id: item.context_id, equation_id: item.equation_id, evidence_class: 'illustrative-assumption', source_id: 'CURATOR_ASSUMPTION', validation_status: 'unsupported', measured: false })),
  ...extraAssumptions.map(([suffix, value, unit]) => ({ id: `ASSUMPTION:APAP-${suffix}`, label: `Illustrative ${suffix.toLowerCase().replaceAll('-', ' ')}`, statement: 'Synthetic delayed-event input; not treatment guidance.', quantity: { value, unit }, context_id: 'CONTEXT:APAP-HUMAN-LIVER', equation_id: 'EQUATION:APAP-DELAYED-NAC', evidence_class: 'illustrative-assumption', source_id: 'CURATOR_ASSUMPTION', validation_status: 'unsupported', measured: false }))
]

const protocols = [
  { id: 'PROTOCOL:APAP-HUMAN-PK', name: 'Bounded synthetic human PK demonstration', protocol_class: 'human-pk', context_id: contexts[0].id, equation_id: 'EQUATION:APAP-HUMAN-PK', evidence_class: 'synthetic-benchmark', applicability: 'algorithm-demonstration-only', bounded: true, interventions: [{ compound_id: 'CHEBI:46195', role: 'challenge', route: 'oral', dose: { lower: 1000, upper: 1000, unit: 'mg' }, start_time: { lower: 0, upper: 0, unit: 'h' }, assumption_id: 'ASSUMPTION:APAP-HUMAN-DOSE' }], observation_window: { lower: 0, upper: 24, unit: 'h' }, sampling_times: [0, 1, 4, 8, 24].map((value) => ({ value, unit: 'h' })), expected_use: 'Exercise deterministic curve and unit handling.', exclusion: 'Not population PK, exposure evidence, or clinical guidance.' },
  { id: 'PROTOCOL:APAP-MOUSE-TOXIC-DOSE', name: 'Bounded synthetic mouse toxic-dose demonstration', protocol_class: 'mouse-toxic-dose', context_id: contexts[1].id, equation_id: 'EQUATION:APAP-MOUSE-INJURY', evidence_class: 'synthetic-benchmark', applicability: 'algorithm-demonstration-only', bounded: true, interventions: [{ compound_id: 'CHEBI:46195', role: 'challenge', route: 'intraperitoneal', dose: { lower: 300, upper: 300, unit: 'mg/kg' }, start_time: { lower: 0, upper: 0, unit: 'h' }, assumption_id: 'ASSUMPTION:APAP-MOUSE-DOSE' }], observation_window: { lower: 0, upper: 48, unit: 'h' }, sampling_times: [0, 6, 24, 48].map((value) => ({ value, unit: 'h' })), expected_use: 'Exercise mouse context binding and deterministic injury-index handling.', exclusion: 'Not toxicology evidence or human translation.' },
  { id: 'PROTOCOL:APAP-DELAYED-NAC', name: 'Bounded synthetic delayed NAC demonstration', protocol_class: 'delayed-nac', context_id: contexts[0].id, equation_id: 'EQUATION:APAP-DELAYED-NAC', evidence_class: 'synthetic-benchmark', applicability: 'algorithm-demonstration-only', bounded: true, interventions: [
    { compound_id: 'CHEBI:46195', role: 'challenge', route: 'oral', dose: { lower: 1000, upper: 1000, unit: 'mg' }, start_time: { lower: 0, upper: 0, unit: 'h' }, assumption_id: 'ASSUMPTION:APAP-NAC-CHALLENGE' },
    { compound_id: 'CHEBI:28939', role: 'antidote', route: 'intravenous', dose: { lower: 150, upper: 150, unit: 'mg/kg' }, start_time: { lower: 12, upper: 12, unit: 'h' }, assumption_id: 'ASSUMPTION:APAP-NAC-DOSE' }
  ], observation_window: { lower: 0, upper: 48, unit: 'h' }, sampling_times: [12, 16, 24, 48].map((value) => ({ value, unit: 'h' })), expected_use: 'Exercise delayed event ordering.', exclusion: 'Not NAC efficacy evidence, dosing, or timing guidance.' }
]

const observationRows = [
  ['HUMAN-PK-T0', 0, 20, 'mg/L', 'calibration', 0], ['HUMAN-PK-T1', 1, 16.374615061559638, 'mg/L', 'calibration', 0], ['HUMAN-PK-T4', 4, 8.986579282344431, 'mg/L', 'calibration', 0], ['HUMAN-PK-T8', 8, 4.037930359893108, 'mg/L', 'validation', 0], ['HUMAN-PK-T24', 24, 0.16459494098040045, 'mg/L', 'validation', 0],
  ['MOUSE-T0', 0, 0, '1', 'calibration', 1], ['MOUSE-T6', 6, 0.4511883639059736, '1', 'calibration', 1], ['MOUSE-T24', 24, 0.9092820467105875, '1', 'validation', 1], ['MOUSE-T48', 48, 0.99177025295098, '1', 'validation', 1],
  ['NAC-T12', 12, 1, '1', 'calibration', 2], ['NAC-T16', 16, 0.7261490370736909, '1', 'calibration', 2], ['NAC-T24', 24, 0.38289288597511206, '1', 'validation', 2], ['NAC-T48', 48, 0.056134762834133725, '1', 'validation', 2]
]
const observations = observationRows.map(([suffix, time, value, unit, partition, protocolIndex]) => ({ id: `OBSERVATION:APAP-${suffix}`, protocol_id: protocols[protocolIndex].id, context_id: protocols[protocolIndex].context_id, equation_id: protocols[protocolIndex].equation_id, time: { value: time, unit: 'h' }, observable: protocolIndex === 0 ? 'synthetic-apap-concentration' : 'synthetic-injury-index', value: { value, unit }, evidence_class: 'synthetic', data_origin: 'equation-generated', partition, validation_status: 'unsupported', supports_biological_conclusion: false }))

const validationRows = [
  ['HUMAN-PK', 0, 'human-pk'], ['HUMAN-INJURY', 2, 'human-injury'], ['MOUSE-INJURY', 1, 'mouse-injury'], ['DELAYED-NAC-EFFICACY', 2, 'delayed-nac-efficacy']
]
const validationMatrix = validationRows.map(([suffix, protocolIndex, claim_type]) => ({ id: `VALIDATION:APAP-${suffix}`, protocol_id: protocols[protocolIndex].id, context_id: protocols[protocolIndex].context_id, claim_type, claim: `The synthetic output predicts ${claim_type}.`, evidence_class: 'synthetic-benchmark', applicability: 'algorithm-demonstration-only', benchmark_status: 'synthetic-contract-only', validation_status: 'unsupported', supported: false, rationale: 'Inputs are illustrative assumptions and observations are equation-generated, not measured biological evidence.' }))

const limitations = [
  ['NO-MEASURED-VALUES', 'evidence', 'No numeric value in this release is presented as measured biological evidence.'],
  ['HUMAN-INJURY-UNSUPPORTED', 'clinical', 'Human liver injury prediction is unsupported.'],
  ['NAC-EFFICACY-UNSUPPORTED', 'clinical', 'The delayed NAC demonstration does not establish efficacy, dosing, timing, safety, or treatment guidance.'],
  ['MOUSE-TRANSLATION', 'translation', 'The mouse context must not be transferred to the human context.'],
  ['MECHANISM-SCOPE', 'scope', 'Verified identifiers are anchors only; this release does not quantify APAP injury mechanisms.'],
  ['BENCHMARK-ONLY', 'benchmark', 'Protocols test software contracts and unsupported-conclusion handling only.']
].map(([suffix, category, statement]) => ({ id: `LIMITATION:APAP-${suffix}`, category, statement }))

const detail = {
  release: FIXTURE_APAP_RELEASE,
  manifest: {
    release_id: APAP_RELEASE_ID,
    title: 'Immutable APAP liver algorithm benchmark evidence',
    schema_version: APAP_CONTRACT_VERSION,
    release_digest: APAP_RELEASE_DIGEST,
    digest_algorithm: 'sha256-canonical-manifest-v1',
    published_at: '2026-07-13',
    immutable: true,
    scientific_scope: 'Species-separated synthetic APAP algorithm benchmark with no measured biological evidence.',
    files: ['assumptions', 'compounds', 'contexts', 'limitations', 'observations', 'parameters', 'proteins', 'protocols', 'validation_matrix'].map((record_type) => ({ path: `${record_type}.json`, record_type, sha256: '0'.repeat(64), bytes: 1, record_count: { assumptions: 12, compounds: 4, contexts: 2, limitations: 6, observations: 13, parameters: 10, proteins: 2, protocols: 3, validation_matrix: 4 }[record_type] })),
    record_counts: { assumptions: 12, compounds: 4, contexts: 2, limitations: 6, observations: 13, parameters: 10, proteins: 2, protocols: 3, validation_matrix: 4 },
    sources: [{ id: 'SYNTHETIC_BENCHMARK', name: 'Repository-authored APAP synthetic benchmark', source_class: 'synthetic', version: APAP_RELEASE_ID, url: 'https://github.com/bc1-global/biochemical-db', accessed_at: '2026-07-13', license: 'CC0 1.0', license_url: 'https://creativecommons.org/publicdomain/zero/1.0/', usage: 'Fixture mirrors the immutable producer contract.' }],
    compatibility: { consumer: 'biochemical-inference', apap_benchmark_api_contract: APAP_CONTRACT_VERSION }
  },
  benchmark: {
    compounds: [
      ['46195', 'paracetamol', ['acetaminophen', 'APAP'], 'C8H9NO2', 0], ['29132', 'N-acetyl-1,4-benzoquinone imine', ['NAPQI'], 'C8H7NO2', 0], ['16856', 'glutathione', ['GSH'], 'C10H17N3O6S', 0], ['28939', 'N-acetyl-L-cysteine', ['NAC'], 'C5H9NO3S', 0]
    ].map(([id, name, aliases, formula, charge]) => ({ id: `CHEBI:${id}`, name, aliases, formula, charge, source_id: 'CHEBI', verified_current: true, verification_url: `https://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:${id}` })),
    proteins: [
      { id: 'UniProtKB:P05181', accession: 'P05181', recommended_name: 'Cytochrome P450 2E1', gene_symbol: 'CYP2E1', taxon_id: 'NCBITaxon:9606', reviewed: true, ec_numbers: ['1.14.14.1', '1.14.13.n7'], role: 'verified enzyme identifier anchor; no measured activity is included', source_id: 'UNIPROT', verification_url: 'https://rest.uniprot.org/uniprotkb/P05181' },
      { id: 'UniProtKB:Q05421', accession: 'Q05421', recommended_name: 'Cytochrome P450 2E1', gene_symbol: 'Cyp2e1', taxon_id: 'NCBITaxon:10090', reviewed: true, ec_numbers: ['1.14.14.1', '1.14.13.n7'], role: 'verified enzyme identifier anchor; no measured activity is included', source_id: 'UNIPROT', verification_url: 'https://rest.uniprot.org/uniprotkb/Q05421' }
    ],
    assumptions,
    limitations
  }
}

export function createApapFixtureClient() {
  return {
    async catalog() { return UpstreamApapCatalogSchema.parse({ catalog_schema_version: APAP_CONTRACT_VERSION, releases: [{ release_id: APAP_RELEASE_ID, title: detail.manifest.title, schema_version: APAP_CONTRACT_VERSION, release_digest: APAP_RELEASE_DIGEST, manifest_path: `${APAP_RELEASE_ID}/manifest.json` }] }) },
    async detail() { return UpstreamApapDetailSchema.parse(detail) },
    async contexts() { return UpstreamApapContextsSchema.parse({ release: FIXTURE_APAP_RELEASE, items: contexts }) },
    async parameters() { return UpstreamApapParametersSchema.parse({ release: FIXTURE_APAP_RELEASE, items: parameters, assumptions: assumptions.filter((item) => parameters.some((parameter) => parameter.assumption_id === item.id)) }) },
    async protocols() { return UpstreamApapProtocolsSchema.parse({ release: FIXTURE_APAP_RELEASE, items: protocols }) },
    async observations() { return UpstreamApapObservationsSchema.parse({ release: FIXTURE_APAP_RELEASE, items: observations }) },
    async validationMatrix() { return UpstreamApapValidationSchema.parse({ release: FIXTURE_APAP_RELEASE, items: validationMatrix }) },
    async assumptions() { return UpstreamApapAssumptionsSchema.parse({ release: FIXTURE_APAP_RELEASE, items: assumptions }) },
    async limitations() { return UpstreamApapLimitationsSchema.parse({ release: FIXTURE_APAP_RELEASE, items: limitations }) }
  }
}
