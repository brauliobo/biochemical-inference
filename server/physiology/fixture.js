import {
  PHYSIOLOGY_CONTRACT_VERSION,
  PHYSIOLOGY_RELEASE_DIGEST,
  PHYSIOLOGY_RELEASE_ID,
  PhysiologyApplicabilityResponseSchema,
  PhysiologyBenchmarksResponseSchema,
  PhysiologyCatalogSchema,
  PhysiologyContextsResponseSchema,
  PhysiologyCoverageResponseSchema,
  PhysiologyDetailSchema,
  PhysiologyModelEvidenceResponseSchema,
  PhysiologyQuantitiesResponseSchema,
  PhysiologyValidationResponseSchema
} from '../../shared/physiology-contracts.js'

const PHYSIOLOGY_RELEASE = Object.freeze({ id: PHYSIOLOGY_RELEASE_ID, schema_version: PHYSIOLOGY_CONTRACT_VERSION, digest: PHYSIOLOGY_RELEASE_DIGEST })

const contexts = [
  ['CIRCULATION', 'Human blood vasculature synthetic reference context', 'circulation', 'UBERON:0004537', 'blood vasculature'],
  ['LIVER', 'Human liver synthetic reference context', 'liver', 'UBERON:0002107', 'liver'],
  ['KIDNEY', 'Human kidney synthetic reference context', 'kidney', 'UBERON:0002113', 'kidney']
].map(([suffix, name, domain, anatomy_id, anatomy_label]) => ({
  id: `CONTEXT:PHYS-HUMAN-${suffix}`,
  name,
  taxon_id: 'NCBITaxon:9606',
  taxon_label: 'Homo sapiens',
  domain,
  anatomy_id,
  anatomy_label,
  life_stage: 'adult-unspecified',
  sex: 'unspecified',
  health_state: 'unspecified',
  spatial_scope: 'lumped synthetic reference compartment',
  evidence_class: 'ontology-anchor-with-synthetic-context',
  source_ids: ['NCBI_TAXONOMY', 'UBERON', 'SYNTHETIC_PHYSIOLOGY']
}))

const applicability = [
  ['CIRCULATION', 'circulation', 'UBERON:0004537', 'No measured hemodynamics, donor physiology, disease state, or clinical interpretation.'],
  ['LIVER', 'liver', 'UBERON:0002107', 'No measured hepatic physiology, metabolism, injury, disease, or clinical interpretation.'],
  ['KIDNEY', 'kidney', 'UBERON:0002113', 'No measured renal physiology, filtration, clearance, disease, or clinical interpretation.']
].map(([suffix, domain, anatomy_id, exclusion]) => ({
  id: `APPLICABILITY:PHYS-HUMAN-${suffix}`,
  plugin_id: `PLUGIN:${suffix}-REFERENCE`,
  context_id: `CONTEXT:PHYS-HUMAN-${suffix}`,
  taxon_id: 'NCBITaxon:9606',
  domain,
  anatomy_id,
  applicability_status: 'applicable-for-synthetic-contract',
  included_use: 'bounded three-plugin coupling conformance benchmark',
  excluded_taxon_ids: ['NCBITaxon:10090'],
  exclusions: [exclusion],
  scientific_validation_status: 'unsupported'
}))

const quantityRows = [
  ['CIRCULATION-TO-LIVER', 'circulation to liver', 'CIRCULATION', 'CIRCULATION-LIVER-OUT', 'LIVER', 'LIVER-CIRCULATION-IN'],
  ['LIVER-TO-CIRCULATION', 'liver to circulation', 'LIVER', 'LIVER-CIRCULATION-OUT', 'CIRCULATION', 'CIRCULATION-LIVER-IN'],
  ['CIRCULATION-TO-KIDNEY', 'circulation to kidney', 'CIRCULATION', 'CIRCULATION-KIDNEY-OUT', 'KIDNEY', 'KIDNEY-CIRCULATION-IN'],
  ['KIDNEY-TO-CIRCULATION', 'kidney to circulation', 'KIDNEY', 'KIDNEY-CIRCULATION-OUT', 'CIRCULATION', 'CIRCULATION-KIDNEY-IN']
]
const quantities = quantityRows.map(([suffix, label, sourcePlugin, sourcePort, targetPlugin, targetPort]) => ({
  id: `QUANTITY:${suffix}-DRUG-MASS-FLOW`,
  name: `Synthetic drug mass flow from ${label}`,
  semantic: 'drug-mass-flow',
  dimension: 'mass_rate',
  canonical_unit: 'mg/min',
  quantity_kind: 'extensive-rate',
  conservation_rule: 'source loss equals target gain over each coupling interval',
  sign_convention: 'positive from source to target',
  source: { plugin_id: `PLUGIN:${sourcePlugin}-REFERENCE`, port_id: `PORT:${sourcePort}`, direction: 'output', semantic: 'drug-mass-flow', dimension: 'mass_rate', unit: 'mg/min' },
  target: { plugin_id: `PLUGIN:${targetPlugin}-REFERENCE`, port_id: `PORT:${targetPort}`, direction: 'input', semantic: 'drug-mass-flow', dimension: 'mass_rate', unit: 'mg/min' },
  numeric_value_in_release: false,
  evidence_class: 'synthetic-contract-definition',
  source_id: 'SYNTHETIC_PHYSIOLOGY'
}))

const evidenceRows = [
  ['CIRCULATION', 'circulation', '57fe301abf9331673540239501f3a436bda75ff4e4b0a35c092830de4b9d0acc', 'df10d67b2dc798822b18b9336c0501729fac02579bbb0caafd46bb330126d4f1', 1, 'Passing the declarative port protocol is software conformance only and is not scientific validation.'],
  ['LIVER', 'liver', 'b96c0623a541da111937e25f46eccf0617e15e6c9d4f2f2dad84671d810f98c3', '09a0e30dbc9fd572ec264a30578f0e9797b1a8e281281042b24680783f8e5b32', 2, 'No biological liver mechanism or measured parameter is represented.'],
  ['KIDNEY', 'kidney', '9d470c810c26784acf12ff20b84070769acd48345e925211a5aafc04a59ebea9', '40de771fb50634d1e028c77fa1a8e01c8b0f2fd50ef08e0f605c53661123d72a', 2, 'No biological kidney mechanism or measured parameter is represented.']
]
const modelEvidence = evidenceRows.map(([suffix, domain, model_digest, protocol_digest, step, limitation]) => ({
  id: `MODEL-EVIDENCE:${suffix}-REFERENCE`,
  plugin_id: `PLUGIN:${suffix}-REFERENCE`,
  name: `Synthetic ${domain} coupling reference descriptor`,
  context_id: `CONTEXT:PHYS-HUMAN-${suffix}`,
  domain,
  model_class: 'repository-authored declarative synthetic reference',
  model_digest,
  protocol_digest,
  ports: quantities.flatMap((quantity) => [quantity.source, quantity.target]).filter((endpoint) => endpoint.plugin_id === `PLUGIN:${suffix}-REFERENCE`).map((endpoint) => ({ id: endpoint.port_id, quantity_id: quantities.find((quantity) => quantity.source.port_id === endpoint.port_id || quantity.target.port_id === endpoint.port_id).id, direction: endpoint.direction, semantic: endpoint.semantic, dimension: endpoint.dimension, unit: endpoint.unit })),
  numeric_assumptions: [{ id: `ASSUMPTION:PHYS-${suffix}-STEP`, name: `Synthetic ${domain} schedule step`, value: step, unit: 'min', dimension: 'time', value_origin: 'assumption', evidence_class: 'curator-assumption', source_id: 'CURATOR_ASSUMPTION' }],
  evidence_class: 'synthetic-contract-evidence',
  source_id: 'SYNTHETIC_PHYSIOLOGY',
  protocol_conformance_status: 'passed',
  certification_status: 'not-certified',
  scientific_validation_status: 'unsupported',
  limitation
}))

const benchmark = {
  id: 'DATASET:PHYS-HUMAN-THREE-PLUGIN-MASS-BALANCE',
  title: 'Synthetic human circulation-liver-kidney mass-balance fixture',
  context_ids: contexts.map((item) => item.id),
  model_evidence_ids: modelEvidence.map((item) => item.id),
  quantity_ids: quantities.map((item) => item.id),
  data_origin: 'synthetic',
  evidence_class: 'synthetic-benchmark',
  source_id: 'SYNTHETIC_PHYSIOLOGY',
  generation_method: 'repository-authored compartment mass fixtures with an exact 100 mg conserved total',
  protocol_conformance_status: 'passed',
  scientific_validation_status: 'unsupported',
  partition: { fixed: true, assignment_method: 'explicit-identifiers-v1', calibration_observation_ids: ['OBSERVATION:PHYS-MASS-BALANCE-T0', 'OBSERVATION:PHYS-MASS-BALANCE-T1'], validation_observation_ids: ['OBSERVATION:PHYS-MASS-BALANCE-T2', 'OBSERVATION:PHYS-MASS-BALANCE-T4'] },
  bounded_scope: 'four time points for software conformance only'
}

const observations = [
  [0, 'calibration', 80, 10, 10],
  [1, 'calibration', 70, 18, 12],
  [2, 'validation', 60, 25, 15],
  [4, 'validation', 50, 30, 20]
].map(([time, partition, circulation, liver, kidney]) => ({
  id: `OBSERVATION:PHYS-MASS-BALANCE-T${time}`,
  dataset_id: benchmark.id,
  partition,
  values: [
    ['time', time, 'min', 'time'],
    ['circulation-drug-mass', circulation, 'mg', 'mass'],
    ['liver-drug-mass', liver, 'mg', 'mass'],
    ['kidney-drug-mass', kidney, 'mg', 'mass'],
    ['mass-balance-residual', 0, 'mg', 'mass']
  ].map(([metric, value, unit, dimension]) => ({ metric, value, unit, dimension, value_origin: 'synthetic', evidence_class: 'synthetic-benchmark' })),
  supports_scientific_validation: false
}))

const validation = [
  ['CIRCULATION-REALISM', 'circulation', 'PLUGIN:CIRCULATION-REFERENCE', 'The circulation reference predicts human hemodynamics or exposure.', 'No measured human circulation data, calibrated parameters, or independent scientific benchmark is included.'],
  ['LIVER-REALISM', 'liver', 'PLUGIN:LIVER-REFERENCE', 'The liver reference predicts human hepatic physiology or metabolism.', 'No measured liver data, biological mechanism, calibrated parameters, or independent scientific benchmark is included.'],
  ['KIDNEY-REALISM', 'kidney', 'PLUGIN:KIDNEY-REFERENCE', 'The kidney reference predicts human renal physiology or clearance.', 'No measured kidney data, filtration mechanism, calibrated parameters, or independent scientific benchmark is included.'],
  ['INTEGRATED-CONCLUSION', 'integrated', null, 'The coupled fixture supports an integrated physiological, pharmacological, toxicological, or clinical conclusion.', 'Exact protocol and mass-balance conformance on invented values cannot establish scientific validity.']
].map(([suffix, domain, plugin_id, claim, rationale]) => ({ id: `VALIDATION:PHYS-${suffix}`, domain, plugin_id, claim, validation_kind: 'scientific', evidence_class: 'synthetic-contract-only', validation_status: 'unsupported', supported: false, protocol_conformance_used_as_scientific_evidence: false, rationale }))

const domainRows = [
  ['CIRCULATION', 'circulation', 'UBERON:0004537', 'blood vasculature'],
  ['LIVER', 'liver', 'UBERON:0002107', 'liver'],
  ['KIDNEY', 'kidney', 'UBERON:0002113', 'kidney'],
  ['RESPIRATORY', 'respiratory', 'UBERON:0001004', 'respiratory system'],
  ['ENDOCRINE', 'endocrine', 'UBERON:0000949', 'endocrine system'],
  ['IMMUNE', 'immune', 'UBERON:0002405', 'immune system'],
  ['NEURAL', 'neural', 'UBERON:0001016', 'nervous system'],
  ['TUMOR', 'tumor', null, null]
]
const coverage = ['HUMAN', 'MOUSE'].flatMap((species) => domainRows.map(([suffix, domain, anatomy_id, anatomy_label]) => {
  const humanReference = species === 'HUMAN' && ['CIRCULATION', 'LIVER', 'KIDNEY'].includes(suffix)
  let rationale = `No ${species === 'MOUSE' ? 'mouse ' : ''}${domain} plugin evidence is published in this release.`
  if (humanReference) rationale = 'A bounded synthetic contract fixture is published; scientific applicability remains unsupported.'
  else if (species === 'MOUSE' && ['CIRCULATION', 'LIVER', 'KIDNEY'].includes(suffix)) rationale = 'The human synthetic reference must not be extrapolated to mouse.'
  else if (domain === 'tumor') rationale = `Tumor is a heterogeneous pathological domain without one authoritative anatomy anchor; no ${species === 'MOUSE' ? 'mouse ' : ''}tumor plugin evidence is published.`
  return {
    id: `COVERAGE:PHYS-${species}-${suffix}`,
    taxon_id: species === 'HUMAN' ? 'NCBITaxon:9606' : 'NCBITaxon:10090',
    taxon_label: species === 'HUMAN' ? 'Homo sapiens' : 'Mus musculus',
    domain,
    anatomy_id,
    anatomy_label,
    coverage_status: humanReference ? 'contract-covered' : 'unsupported',
    plugin_id: humanReference ? `PLUGIN:${suffix}-REFERENCE` : null,
    context_id: humanReference ? `CONTEXT:PHYS-HUMAN-${suffix}` : null,
    scientific_validation_status: 'unsupported',
    reason_code: humanReference ? 'synthetic-reference-published' : 'not-published-in-release',
    rationale
  }
}))

const limitations = [
  ['SYNTHETIC-ONLY', 'evidence', 'Every numeric model input is an assumption and every benchmark value is synthetic; no measured physiology is included.'],
  ['SCIENTIFIC-VALIDATION', 'validation', 'All scientific validation claims are unsupported; protocol and conservation conformance are not scientific validation.'],
  ['HUMAN-ONLY', 'applicability', 'The bounded contract slice is human-only and must not be applied or parameter-transferred to mouse.'],
  ['DOMAIN-COVERAGE', 'scope', 'Respiratory, endocrine, immune, neural, and tumor plugins are not published and are explicitly unsupported.'],
  ['NO-CERTIFIED-PLUGIN', 'scope', 'The model records are declarative reference descriptors, not signed, executable, or scientifically certified external plugins.'],
  ['NO-CLINICAL-USE', 'clinical', 'The release supports no diagnosis, treatment, dosing, safety, toxicology, or other clinical conclusion.']
].map(([suffix, category, statement]) => ({ id: `LIMITATION:PHYS-${suffix}`, category, statement }))

const manifest = {
  release_id: PHYSIOLOGY_RELEASE_ID,
  title: 'Synthetic human physiology plugin coupling evidence',
  schema_version: PHYSIOLOGY_CONTRACT_VERSION,
  release_digest: PHYSIOLOGY_RELEASE_DIGEST,
  digest_algorithm: 'sha256-canonical-manifest-v1',
  published_at: '2026-07-13',
  immutable: true,
  scientific_scope: 'A bounded repository-authored synthetic human circulation, liver, and kidney plugin-coupling contract fixture. All numeric model inputs are assumptions, all benchmark values are synthetic, every scientific validation claim is unsupported, mouse applicability is unsupported, and respiratory, endocrine, immune, neural, and tumor plugin coverage is unsupported.',
  files: [
    ['applicability.json', 'applicability', 'ffe8cb27a4e6fffe73efff3c629acad64a8603366354cd03da58a4f93a7886cb', 1908, 3],
    ['benchmarks.json', 'benchmarks', '4f47bafb20bbd260f1292afa500afa21413fdc52d0c46565b575449f5029ac8a', 1417, 1],
    ['contexts.json', 'contexts', 'dda195a25def5aec1d286a725ccba35d11fac21471f7d8e7b28e686eeccafe81', 1852, 3],
    ['coverage.json', 'coverage', 'd04de5002f341d266dff112cd23f33a389336feb2bd8f8cf221e3dd26e49df98', 7343, 16],
    ['limitations.json', 'limitations', 'ee1eb9408fd01582b5cefea62546152642dd0bf4ee24258911ae6459a380eed9', 1255, 6],
    ['model_evidence.json', 'model_evidence', '98dece3dd082e6eb710c6dd37cd99bc48e6cf40f8390588bd1f9cf5cb5d49d49', 5154, 3],
    ['observations.json', 'observations', '2569a7e0ae8537bd74b263d07febc387ebc7ce7db362887dbb91a269443d6827', 4173, 4],
    ['quantities.json', 'quantities', 'aff533fab0ab00869f510efe0ffd09f15c030fd4f26a04015655339245599648', 3925, 4],
    ['validation.json', 'validation', '56856ea6d58a6d500fd0f0a60307f9d618e1ddd2a81d5ebcfe4d74d9de0418e3', 2124, 4]
  ].map(([path, record_type, sha256, bytes, record_count]) => ({ path, record_type, sha256, bytes, record_count })),
  record_counts: { applicability: 3, benchmarks: 1, contexts: 3, coverage: 16, limitations: 6, model_evidence: 3, observations: 4, quantities: 4, validation: 4 },
  sources: [
    ['NCBI_TAXONOMY', 'NCBI Taxonomy', 'identifier-authority', 'authority-anchor-only', 'live records accessed 2026-07-13', 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=taxonomy&id=9606,10090&retmode=json', 'US government public-domain information; NCBI policy and third-party caveats apply', 'https://www.ncbi.nlm.nih.gov/home/about/policies/', 'Active species-rank human and mouse taxon identifiers and scientific names only.'],
    ['UBERON', 'Uberon multi-species anatomy ontology', 'identifier-authority', 'authority-anchor-only', 'live OLS records accessed 2026-07-13', 'https://www.ebi.ac.uk/ols4/ontologies/uberon', 'CC BY 3.0', 'https://creativecommons.org/licenses/by/3.0/', 'Current labels and non-obsolete identifiers for blood vasculature, liver, kidney, respiratory, endocrine, immune, and nervous systems; ontology anchors do not validate models.'],
    ['SYNTHETIC_PHYSIOLOGY', 'Repository-authored synthetic physiology plugin evidence', 'synthetic', 'synthetic-not-measured', PHYSIOLOGY_RELEASE_ID, 'https://github.com/bc1-global/biochemical-db', 'CC0 1.0', 'https://creativecommons.org/publicdomain/zero/1.0/', 'Declarative plugin records, exchange contracts, synthetic benchmark values, fixed partitions, coverage gaps, and unsupported validation claims.'],
    ['CURATOR_ASSUMPTION', 'Repository-authored physiology schedule assumptions', 'curator-assumption', 'assumption-not-measured', PHYSIOLOGY_RELEASE_ID, 'https://github.com/bc1-global/biochemical-db', 'CC0 1.0', 'https://creativecommons.org/publicdomain/zero/1.0/', 'Explicit non-measured plugin schedule values used only by the synthetic conformance fixture.']
  ].map(([id, name, source_class, trust_label, version, url, license, license_url, usage]) => ({ id, name, source_class, trust_label, version, url, accessed_at: '2026-07-13', license, license_url, usage })),
  compatibility: { consumer: 'biochemical-inference', physiology_api_contract: PHYSIOLOGY_CONTRACT_VERSION }
}

const envelope = (items) => ({ release: PHYSIOLOGY_RELEASE, items })

export function createPhysiologyFixtureClient() {
  return {
    async catalog() { return PhysiologyCatalogSchema.parse({ catalog_schema_version: PHYSIOLOGY_CONTRACT_VERSION, releases: [{ release_id: PHYSIOLOGY_RELEASE_ID, title: manifest.title, schema_version: PHYSIOLOGY_CONTRACT_VERSION, release_digest: PHYSIOLOGY_RELEASE_DIGEST, manifest_path: `${PHYSIOLOGY_RELEASE_ID}/manifest.json` }] }) },
    async detail() { return PhysiologyDetailSchema.parse({ release: PHYSIOLOGY_RELEASE, manifest, limitations }) },
    async contexts() { return PhysiologyContextsResponseSchema.parse(envelope(contexts)) },
    async applicability() { return PhysiologyApplicabilityResponseSchema.parse(envelope(applicability)) },
    async quantities() { return PhysiologyQuantitiesResponseSchema.parse(envelope(quantities)) },
    async modelEvidence() { return PhysiologyModelEvidenceResponseSchema.parse(envelope(modelEvidence)) },
    async benchmarks() { return PhysiologyBenchmarksResponseSchema.parse({ ...envelope([benchmark]), observations }) },
    async validation() { return PhysiologyValidationResponseSchema.parse(envelope(validation)) },
    async coverage() { return PhysiologyCoverageResponseSchema.parse(envelope(coverage)) }
  }
}

