import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { canonicalJson } from '../../shared/canonical-json.js'
import {
  CHALLENGE_ENDPOINT_IDS,
  CHALLENGE_MAPPING_ID,
  CHALLENGE_METRIC_ID,
  CHALLENGE_RELEASE_DIGEST,
  CHALLENGE_RELEASE_ID,
  CHALLENGE_SAMPLING_GRID_DIGEST,
  CHALLENGE_SAMPLING_HOURS,
  CHALLENGE_SAMPLING_LABELS,
  CHALLENGE_THRESHOLD_ID,
  ChallengeCommitmentRequestSchema
} from '../../shared/challenge-contracts.js'
import {
  APAP_ENGINE_VERSION,
  APAP_EQUATION_SET_ID,
  APAP_MODEL_ID,
  APAP_MODEL_VERSION,
  APAP_RELEASE_DIGEST,
  APAP_RELEASE_ID,
  APAP_REFINEMENT_TOLERANCE
} from '../../shared/apap-contracts.js'
import {
  APAP_EQUATION_CONSTANTS,
  APAP_EQUATION_DEFINITION,
  integrateApapAtTimes,
  resolveContextBinding,
  runLimitingCaseDiagnostics,
  runTimestepRefinement
} from '../apap/model.js'
import { quantizePrediction } from './scoring.js'
import { ChallengeVerificationError, challengeDigest, challengeObservationDescriptor, challengeSha256 } from './verification.js'

export const CHALLENGE_CONSUMER_ID = 'consumer:biochemical-inference:apap-model-v1'
export const CHALLENGE_SOLVER_VERSION = 'goal13-exact-grid-rk4-v1.0.0'
const CONTEXT_ID = 'CONTEXT:APAP-HUMAN-LIVER'
const STEP_HOURS = 0.01
const DOSE_MG = 325
const VOLUME_L = 50
const STATE_TO_CONCENTRATION = 1
const SOFTWARE_SOURCE_PATHS = Object.freeze([
  'server/apap/model.js', 'server/challenge/client.js', 'server/challenge/database.js', 'server/challenge/model.js',
  'server/challenge/scoring.js', 'server/challenge/service.js', 'server/challenge/verification.js',
  'server/data-plane/object-store.js', 'server/data-plane/safe-path.js', 'server/portfolio/identity.js',
  'shared/apap-contracts.js', 'shared/canonical-json.js', 'shared/challenge-contracts.js'
])

function one(records, kind) {
  if (!Array.isArray(records[kind]) || records[kind].length !== 1) throw new Error(`Goal 13 ${kind} closure must contain exactly one record.`)
  return records[kind][0]
}

function artifact(kind, content) {
  const value = Object.freeze({ artifact_schema_version: '1.0.0', artifact_kind: kind, ...content })
  return Object.freeze({ kind, digest: challengeDigest(value), bytes: Buffer.byteLength(canonicalJson(value)), content: value })
}

function referencesArtifacts(value, artifacts, references) {
  return references.every(([field, name]) => value[field] === artifacts[name].digest)
}

async function softwareArtifact() {
  const serverRoot = process.argv[1]?.includes('server-dist/') ? 'server-dist/server' : 'server'
  const sharedRoot = process.argv[1]?.includes('server-dist/') ? 'server-dist/shared' : 'shared'
  const files = SOFTWARE_SOURCE_PATHS.map((path) => [path, path.startsWith('server/')
    ? resolve(process.cwd(), serverRoot, path.slice('server/'.length))
    : resolve(process.cwd(), sharedRoot, path.slice('shared/'.length))])
  const sources = []
  for (const [path, sourcePath] of files) {
    const bytes = await readFile(sourcePath)
    sources.push({ path, bytes: bytes.length, sha256: challengeSha256(bytes) })
  }
  return artifact('software', {
    software_id: 'biochemical-inference-goal13-consumer',
    module_format: 'strict-plain-js-es-modules',
    runtime: { name: 'node', version: process.versions.node },
    closure_scope: 'complete transitive model-execution, prediction-quantization, scoring, canonicalization, and contract source closure',
    portable_executable: false,
    replay_requirement: 'exact source-byte closure and Node runtime version must match',
    sources
  })
}

function mappedParameters(concentrationMapping, publicLineage) {
  const binding = resolveContextBinding(CONTEXT_ID)
  const initialApap = DOSE_MG / VOLUME_L
  const values = { ...binding.values, initialApap }
  const effectiveParameters = binding.effectiveParameters.map((item) => item.symbol === 'initialApap' ? {
    ...item,
    value: initialApap,
    sourceId: CHALLENGE_MAPPING_ID,
    statement: 'The pinned 325 mg / 50 L concentration is loaded as 6.5 model-unit under the separately frozen one-to-one model-unit to mg/L output transformation.'
  } : item)
  return { values, effectiveParameters, concentrationMappingDigest: concentrationMapping.digest, publicLineageDigest: publicLineage.digest }
}

function numericDiagnostics(integrated, refinement, limitingCases, concentrationMapping, endpoints, metric, quantization) {
  const round = (value) => Number(value.toFixed(12))
  const samplingPoints = integrated.times.map((value, index) => ({
    label: CHALLENGE_SAMPLING_LABELS[index],
    declared_hours: CHALLENGE_SAMPLING_HOURS[index],
    executed_hours: value.toString(),
    matched: value === Number(CHALLENGE_SAMPLING_HOURS[index])
  }))
  const numericalPassed = refinement.passed && limitingCases.every((item) => item.passed) && Math.abs(integrated.massResidual) <= integrated.massTolerance && integrated.minimumValue >= 0 && integrated.minimumFraction >= 0 && integrated.maximumSumError <= APAP_EQUATION_CONSTANTS.cellStateSumTolerance
  const mapping = concentrationMapping.content
  const endpointDiagnostics = endpoints.map((endpoint) => {
    const mappingValid = mapping.mapping_status === 'valid-with-declared-assumptions' && endpoint.expected_unit === mapping.output.unit && metric.input_unit === mapping.output.unit
    return {
      endpoint_id: endpoint.id,
      status: !mappingValid ? 'invalid-mapping' : numericalPassed ? 'evaluable' : 'invalid-diagnostics',
      expected_unit: endpoint.expected_unit,
      predicted_unit: mapping.output.unit,
      reasons: !mappingValid ? ['endpoint, metric, and model-output units are not exactly compatible'] : numericalPassed ? [] : ['numerical diagnostics failed']
    }
  })
  return {
    diagnostic_contract: 'goal13-apap-numerical-diagnostics-v1',
    sampling_grid: { points: samplingPoints, passed: samplingPoints.length === CHALLENGE_SAMPLING_HOURS.length && samplingPoints.every((item) => item.matched) },
    integration_steps: integrated.steps,
    mass: {
      initial_apap: integrated.initialApap,
      residual: round(integrated.massResidual),
      tolerance: integrated.massTolerance,
      passed: Math.abs(integrated.massResidual) <= integrated.massTolerance
    },
    state: {
      finite: true,
      non_negative: integrated.minimumValue >= 0,
      minimum_value: round(integrated.minimumValue),
      minimum_fraction: round(integrated.minimumFraction),
      maximum_cell_sum_error: round(integrated.maximumSumError),
      passed: integrated.minimumValue >= 0 && integrated.minimumFraction >= 0 && integrated.maximumSumError <= APAP_EQUATION_CONSTANTS.cellStateSumTolerance
    },
    limiting_cases: limitingCases,
    timestep_refinement: refinement,
    concentration_mapping: {
      artifact_digest: concentrationMapping.digest,
      dose_volume_input_passed: mapping.input.dose_mg === '325' && mapping.input.volume_l === '50' && mapping.input.concentration_mg_l === '6.5',
      state_to_output_passed: mapping.output.scale_mg_l_per_model_unit === '1' && mapping.output.unit === 'mg/L',
      tramadol_interaction_modeled: false,
      formulation_effects_modeled: false,
      assumptions_declared: true
    },
    prediction_quantization: quantization,
    endpoint_diagnostics: endpointDiagnostics,
    availability: {
      parameter_sensitivity_analysis: 'not-available',
      structural_uncertainty: 'not-available',
      prediction_interval: 'not-available',
      measurement_uncertainty: 'not-reported-by-source'
    },
    passed: numericalPassed && samplingPoints.every((item) => item.matched) && endpointDiagnostics.every((item) => item.status === 'evaluable')
  }
}

function publicLineageArtifact(bundle, protocol, endpoints, mapping) {
  const manifest = bundle.releaseResponse.manifest
  return artifact('public-lineage', {
    lineage_contract: 'goal13-verified-public-lineage-v1',
    challenge_release: bundle.releaseResponse.release,
    source_lock_sha256: manifest.source_lock_sha256,
    recipe_sha256: manifest.recipe_sha256,
    signed_public_views: manifest.api_views,
    observations_descriptor: challengeObservationDescriptor(bundle),
    challenge_sources: bundle.records.sources,
    rights: bundle.records.rights,
    source_facts: bundle.records.source_facts,
    study: bundle.records.studies[0],
    protocol,
    endpoints,
    producer_mapping: mapping,
    partition: bundle.records.partitions[0],
    development_closure: {
      release_id: APAP_RELEASE_ID,
      release_digest: APAP_RELEASE_DIGEST,
      model_id: APAP_MODEL_ID,
      model_version: APAP_MODEL_VERSION,
      equation_set_id: APAP_EQUATION_SET_ID,
      context_id: CONTEXT_ID,
      evidence_boundary: 'synthetic benchmark and internal illustrative parameter assumptions; no challenge outcome used'
    },
    availability: {
      subject_level_data: 'not-available',
      measurement_uncertainty: 'not-reported',
      sensitivity_analysis: 'not-available'
    }
  })
}

function concentrationMappingArtifact(mapping, endpoints, publicLineage) {
  const endpointUnitsValid = endpoints.length === CHALLENGE_ENDPOINT_IDS.length && endpoints.every((item) => item.expected_unit === 'mg/L')
  return artifact('concentration-mapping', {
    mapping_contract: 'goal13-dose-volume-state-concentration-v1',
    producer_mapping_id: mapping.id,
    producer_mapping_digest: challengeDigest(mapping),
    public_lineage_digest: publicLineage.digest,
    input: {
      route: 'oral depot',
      dose_mg: '325',
      volume_l: '50',
      concentration_mg_l: '6.5',
      equation: 'input_concentration_mg_l = dose_mg / volume_l',
      model_initial_state_value: '6.5',
      model_initial_state_unit: 'model-unit'
    },
    output: {
      model_state: 'centralApap',
      model_state_unit: 'model-unit',
      scale_mg_l_per_model_unit: '1',
      unit: 'mg/L',
      equation: 'central_concentration_mg_l = centralApap_model_unit * 1 mg/L/model-unit'
    },
    no_fit: true,
    endpoint_units_valid: endpointUnitsValid,
    mapping_status: endpointUnitsValid ? 'valid-with-declared-assumptions' : 'invalid-mapping',
    assumptions: [
      'One APAP model-unit is declared to equal one mg/L for this frozen consumer challenge only.',
      'Tramadol is not represented and is assumed not to alter the APAP model trajectory.',
      'Reference and test formulations share one APAP trajectory; formulation-specific release effects are not represented.'
    ],
    limitations: ['The state-to-concentration scale is a predeclared consumer assumption, not a fitted or biologically validated conversion.']
  })
}

export async function buildChallengeArtifacts(bundle) {
  const records = bundle.records
  const protocol = one(records, 'protocols')
  const mapping = one(records, 'mappings')
  const metric = one(records, 'metrics')
  const threshold = one(records, 'thresholds')
  const endpoints = records.endpoints
  if (protocol.id !== 'protocol:apap-human-pk-challenge-v1' || mapping.id !== CHALLENGE_MAPPING_ID || metric.id !== CHALLENGE_METRIC_ID || threshold.id !== CHALLENGE_THRESHOLD_ID) throw new Error('Goal 13 public metadata does not contain the exact execution contract.')

  const software = await softwareArtifact()
  const publicLineage = publicLineageArtifact(bundle, protocol, endpoints, mapping)
  const concentrationMapping = concentrationMappingArtifact(mapping, endpoints, publicLineage)
  const equationSet = artifact('equation-set', {
    equation_set_id: APAP_EQUATION_SET_ID,
    model_version: APAP_MODEL_VERSION,
    definition: APAP_EQUATION_DEFINITION
  })
  const parameters = mappedParameters(concentrationMapping, publicLineage)
  const parameterPolicy = artifact('parameter-policy', {
    policy_id: 'goal13-no-heldout-fitting-v1',
    context_id: CONTEXT_ID,
    selection: 'frozen APAP v1 human parameter binding with only the predeclared 325 mg / 50 L input mapping',
    forbidden: ['held-out parameter selection', 'model-specific fitting', 'formulation-specific fitting', 'post-disclosure tuning'],
    concentration_mapping_digest: parameters.concentrationMappingDigest,
    public_lineage_digest: parameters.publicLineageDigest,
    formulation_specific_parameters: false,
    effective_parameters: parameters.effectiveParameters
  })
  const solver = artifact('solver', {
    solver_id: CHALLENGE_SOLVER_VERSION,
    upstream_engine_version: APAP_ENGINE_VERSION,
    method: 'fixed-step RK4 with a shortened terminal step at each declared sample boundary',
    maximum_step_hours: STEP_HOURS,
    sampling_labels: [...CHALLENGE_SAMPLING_LABELS],
    sampling_hours: [...CHALLENGE_SAMPLING_HOURS],
    sampling_grid_digest: CHALLENGE_SAMPLING_GRID_DIGEST,
    software_digest: software.digest,
    deterministic: true
  })
  const controls = { outputTimes: CHALLENGE_SAMPLING_HOURS.map(Number), stepHours: STEP_HOURS, nacStartHours: null }
  const integrated = integrateApapAtTimes(parameters.values, controls)
  const refinement = runTimestepRefinement(parameters.values, controls, integrated)
  const limitingCases = runLimitingCaseDiagnostics(parameters.values, controls)
  const central = integrated.outputs.map((item) => item.centralApap * STATE_TO_CONCENTRATION)
  const maximum = Math.max(...central)
  const maximumIndex = central.indexOf(maximum)
  const predictionValue = quantizePrediction(maximum, 10)
  const predictionTime = CHALLENGE_SAMPLING_HOURS[maximumIndex]
  const quantization = {
    policy: 'decimal ROUND_HALF_EVEN to 10 places from the ECMAScript shortest round-trip binary64 decimal',
    tie_policy: 'ties-to-even',
    decimal_places: 10,
    raw_binary64_decimal: maximum.toString(),
    quantized_value: predictionValue
  }
  const diagnostics = artifact('diagnostics', {
    equation_set_digest: equationSet.digest,
    parameter_policy_digest: parameterPolicy.digest,
    concentration_mapping_digest: concentrationMapping.digest,
    public_lineage_digest: publicLineage.digest,
    solver_digest: solver.digest,
    refinement_tolerance: APAP_REFINEMENT_TOLERANCE,
    diagnostics: numericDiagnostics(integrated, refinement, limitingCases, concentrationMapping, endpoints, metric, quantization)
  })
  const model = artifact('model', {
    model_id: APAP_MODEL_ID,
    model_version: APAP_MODEL_VERSION,
    context_id: CONTEXT_ID,
    scientific_status: 'unsupported-before-external-challenge',
    equation_set_digest: equationSet.digest,
    parameter_policy_digest: parameterPolicy.digest,
    concentration_mapping_digest: concentrationMapping.digest,
    public_lineage_digest: publicLineage.digest,
    solver_digest: solver.digest,
    software_digest: software.digest,
    diagnostics_digest: diagnostics.digest
  })
  const predictions = CHALLENGE_ENDPOINT_IDS.map((endpoint_id) => ({ endpoint_id, predicted_value: predictionValue, predicted_unit: 'mg/L', predicted_time_h: predictionTime }))
  const prediction = Object.freeze({ kind: 'prediction', digest: challengeDigest(predictions), bytes: Buffer.byteLength(canonicalJson(predictions)), content: Object.freeze(predictions) })
  const artifacts = Object.freeze({ model, equationSet, parameterPolicy, concentrationMapping, solver, software, diagnostics, prediction, publicLineage })
  return {
    artifacts,
    execution: { integrated, predictions },
    producerMetadata: {
      release_digest: CHALLENGE_RELEASE_DIGEST,
      sampling_grid_digest: protocol.sampling_grid_digest,
      endpoint_mapping_id: mapping.id,
      endpoint_mapping_digest: challengeDigest(mapping),
      metric_id: metric.id,
      metric_digest: challengeDigest(metric),
      threshold_id: threshold.id,
      threshold_digest: challengeDigest(threshold),
      exclusion_digest: challengeDigest(records.exclusions),
      not_evaluable_digest: challengeDigest(records.not_evaluable),
      partition_id: one(records, 'partitions').id,
      partition_digest: one(records, 'partitions').closure_digest
    }
  }
}

export function verifyChallengeArtifactSemantics(artifacts, commitment) {
  const expectedNames = ['model', 'equationSet', 'parameterPolicy', 'concentrationMapping', 'solver', 'software', 'diagnostics', 'prediction', 'publicLineage']
  if (canonicalJson(Object.keys(artifacts).sort()) !== canonicalJson([...expectedNames].sort())) throw new ChallengeVerificationError('Goal 13 artifact reference closure is incomplete or excessive.')
  const content = Object.fromEntries(expectedNames.map((name) => [name, artifacts[name].content]))
  if (expectedNames.filter((name) => name !== 'prediction').some((name) => content[name].artifact_kind !== artifacts[name].kind) || !Array.isArray(content.prediction)) throw new ChallengeVerificationError('Goal 13 artifact content kind is invalid.')
  if (
    !referencesArtifacts(commitment, artifacts, [
      ['consumer_model_digest', 'model'], ['equation_set_digest', 'equationSet'], ['parameter_policy_digest', 'parameterPolicy'],
      ['solver_digest', 'solver'], ['prediction_artifact_digest', 'prediction']
    ]) || canonicalJson(commitment.predictions) !== canonicalJson(content.prediction)
  ) throw new ChallengeVerificationError('Goal 13 commitment fields do not bind the semantic artifact references.')
  if (
    !referencesArtifacts(content.model, artifacts, [
      ['equation_set_digest', 'equationSet'], ['parameter_policy_digest', 'parameterPolicy'], ['concentration_mapping_digest', 'concentrationMapping'],
      ['public_lineage_digest', 'publicLineage'], ['solver_digest', 'solver'], ['software_digest', 'software'], ['diagnostics_digest', 'diagnostics']
    ]) || !referencesArtifacts(content.parameterPolicy, artifacts, [['concentration_mapping_digest', 'concentrationMapping'], ['public_lineage_digest', 'publicLineage']]) ||
    !referencesArtifacts(content.solver, artifacts, [['software_digest', 'software']]) ||
    !referencesArtifacts(content.diagnostics, artifacts, [['concentration_mapping_digest', 'concentrationMapping'], ['public_lineage_digest', 'publicLineage']]) ||
    !referencesArtifacts(content.concentrationMapping, artifacts, [['public_lineage_digest', 'publicLineage']])
  ) throw new ChallengeVerificationError('Goal 13 semantic artifact relationship is invalid.')
  if (
    content.concentrationMapping.producer_mapping_id !== commitment.endpoint_mapping_id || content.concentrationMapping.producer_mapping_digest !== commitment.endpoint_mapping_digest ||
    content.concentrationMapping.input.dose_mg !== '325' || content.concentrationMapping.input.volume_l !== commitment.consumer_volume_l ||
    content.concentrationMapping.output.unit !== 'mg/L' || content.concentrationMapping.output.scale_mg_l_per_model_unit !== '1' || !content.concentrationMapping.no_fit ||
    content.publicLineage.challenge_release.id !== commitment.release_id || content.publicLineage.challenge_release.digest !== commitment.release_digest ||
    content.publicLineage.partition.id !== commitment.partition_id || content.publicLineage.partition.closure_digest !== commitment.partition_digest ||
    content.software.portable_executable !== false || canonicalJson(content.software.sources.map((item) => item.path)) !== canonicalJson(SOFTWARE_SOURCE_PATHS) || content.diagnostics.diagnostics.endpoint_diagnostics.length !== CHALLENGE_ENDPOINT_IDS.length ||
    content.diagnostics.diagnostics.endpoint_diagnostics.some((item, index) => item.endpoint_id !== CHALLENGE_ENDPOINT_IDS[index]) ||
    content.prediction.some((item) => item.predicted_unit !== 'mg/L')
  ) throw new ChallengeVerificationError('Goal 13 dimensional, lineage, diagnostics, or prediction artifact semantics are invalid.')
  return artifacts
}

export function buildChallengeCommitment(frozen, intent) {
  const { artifacts, execution, producerMetadata } = frozen
  return ChallengeCommitmentRequestSchema.parse({
    commitment_schema_version: '1.0.0',
    release_id: CHALLENGE_RELEASE_ID,
    release_digest: CHALLENGE_RELEASE_DIGEST,
    consumer_id: CHALLENGE_CONSUMER_ID,
    consumer_model_digest: artifacts.model.digest,
    equation_set_digest: artifacts.equationSet.digest,
    parameter_policy_digest: artifacts.parameterPolicy.digest,
    consumer_volume_l: '50',
    normalization_assumption: 'frozen consumer volume normalization',
    sampling_grid_digest: producerMetadata.sampling_grid_digest,
    solver_digest: artifacts.solver.digest,
    endpoint_mapping_id: producerMetadata.endpoint_mapping_id,
    endpoint_mapping_digest: producerMetadata.endpoint_mapping_digest,
    metric_id: producerMetadata.metric_id,
    metric_digest: producerMetadata.metric_digest,
    threshold_id: producerMetadata.threshold_id,
    threshold_digest: producerMetadata.threshold_digest,
    exclusion_digest: producerMetadata.exclusion_digest,
    not_evaluable_digest: producerMetadata.not_evaluable_digest,
    partition_id: producerMetadata.partition_id,
    partition_digest: producerMetadata.partition_digest,
    prediction_artifact_digest: artifacts.prediction.digest,
    predictions: execution.predictions,
    nonce: intent.nonce,
    created_at: intent.createdAt
  })
}
