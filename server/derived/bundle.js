import { canonicalDigest, canonicalJson } from '../../shared/canonical-json.js'
import {
  APAP_CONTRACT_VERSION,
  APAP_ENGINE_VERSION,
  APAP_MODEL_ID,
  APAP_MODEL_VERSION,
  APAP_RELEASE_DIGEST,
  APAP_RELEASE_ID,
  ApapRunRecordSchema
} from '../../shared/apap-contracts.js'
import { BundleSubmissionSchema, DERIVED_CONTRACT_VERSION, DerivedAssertionSchema, SubmissionBundleSchema } from '../../shared/derived-contracts.js'
import { APAP_EQUATION_DEFINITION, APAP_EQUATION_SET_DIGEST } from '../apap/model.js'

const dimension = (changes = {}) => ({ amount: 0, mass: 0, length: 0, time: 0, temperature: 0, current: 0, luminosity: 0, ...changes })
const unit = (id, symbol, scaleToSi, changes = {}) => ({ id, symbol, scale_to_si: scaleToSi, dimension: dimension(changes) })
const FRACTION = unit('fraction', '1', 1)
const HOUR = unit('hour', 'h', 3600, { time: 1 })
const MECHANISM_SCALE = unit('mechanism-scale', '1', 1)

function doseUnit(symbol) {
  if (symbol === 'mg') return unit('milligram', 'mg', 1e-6, { mass: 1 })
  if (symbol === 'mg/kg') return unit('milligram-per-kilogram', 'mg/kg', 1e-6)
  throw new TypeError(`Unsupported APAP derived dose unit: ${symbol}`)
}

function contentObject(kind, objectId, version, content) {
  return { kind, object_id: objectId, version, digest: canonicalDigest(content), content }
}

function artifactId(role, runId) {
  return `apap-${role}-${runId.replace('sha256:', '').slice(0, 16)}`
}

export function apapModelContent() {
  return {
    contract_version: APAP_CONTRACT_VERSION,
    model_id: APAP_MODEL_ID,
    model_version: APAP_MODEL_VERSION,
    equation_set_digest: APAP_EQUATION_SET_DIGEST,
    engine_version: APAP_ENGINE_VERSION,
    lobule_bins: 12,
    taxon_branches: false,
    equation_definition: APAP_EQUATION_DEFINITION
  }
}

export function apapProtocolArtifactContent(record) {
  return {
    artifact_type: 'apap-exact-run-specification',
    contract_version: APAP_CONTRACT_VERSION,
    run_id: record.runId,
    specification: record.specification,
    protocol: record.result.protocol
  }
}

export function apapResultArtifactContent(record) {
  return {
    artifact_type: 'apap-canonical-result',
    contract_version: APAP_CONTRACT_VERSION,
    run_id: record.runId,
    outcome: record.outcome,
    result: record.result
  }
}

function assertionContext(record) {
  const { context, protocol } = record.result
  const challenge = protocol.interventions.find((item) => item.role === 'challenge')
  return {
    taxon_id: context.taxon_id,
    tissue_id: context.organ_id,
    cell_type_id: context.cell_type_id,
    compartment_id: null,
    biological_sex: context.sex === 'not-specified' ? 'unknown' : context.sex,
    life_stage_id: null,
    strain: context.strain,
    disease_ids: [],
    route: challenge?.route ?? context.challenge_route,
    dose: challenge ? { value: challenge.dose.lower, unit: doseUnit(challenge.dose.unit) } : null,
    time: { value: protocol.observation_window.upper, unit: HOUR },
    ph: null,
    temperature: null,
    assay_id: 'ASSAY:APAP-SYNTHETIC-RK4',
    spatial_region_id: 'REGION:APAP-SYNTHETIC-LOBULE',
    model_scope: 'Deterministic APAP systemic and 12-bin portal-to-central synthetic liver-lobule algorithm benchmark.',
    qualifiers: [
      { name: 'run-id', value: record.runId },
      { name: 'protocol-id', value: protocol.id },
      { name: 'fasting-status', value: context.fasting_status },
      { name: 'evidence-scope', value: 'synthetic-unsupported-algorithm-benchmark' }
    ]
  }
}

function applicability(record) {
  const challenge = record.result.protocol.interventions.find((item) => item.role === 'challenge')
  const boundaries = [
    { variable: 'time-hours', lower: 0, upper: record.result.protocol.observation_window.upper, unit: HOUR, inclusive: true },
    ...Object.keys(record.specification.mechanismScales).map((name) => ({ variable: name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`), lower: 0, upper: 2, unit: MECHANISM_SCALE, inclusive: true }))
  ]
  if (challenge) boundaries.unshift({ variable: 'challenge-dose', lower: challenge.dose.lower, upper: challenge.dose.upper, unit: doseUnit(challenge.dose.unit), inclusive: true })
  return {
    status: 'bounded',
    boundaries,
    exclusions: [
      'No extrapolation beyond the exact taxon, tissue, cell, route, protocol, dose, time window, or mechanism-scale bounds.',
      'No clinical, diagnostic, treatment, population-PK, measured toxicology, or cross-species interpretation.'
    ],
    rationale: 'Applicability is restricted to the exact pinned synthetic APAP benchmark specification and its declared control bounds.'
  }
}

function qualitativeUncertainty() {
  const descriptions = {
    biological: 'Biological variability is unknown because no measured biological cohort underlies this synthetic scalar.',
    measurement: 'Measurement uncertainty is unavailable because the compared benchmark observations are equation-generated.',
    structural: 'Model-form uncertainty is unquantified for the illustrative systemic, lobule, and injury equations.',
    contextual: 'Translation outside the exact human or mouse synthetic context is unsupported.',
    numerical: 'The deterministic RK4 result passes the declared 1x/2x/4x timestep-refinement diagnostic, but no numerical uncertainty distribution is established.'
  }
  return {
    interpretation: 'epistemic',
    components: Object.entries(descriptions).map(([category, description]) => ({ category, representation: 'qualitative', value: null, lower: null, upper: null, unit: null, description })),
    method: 'Qualitative unsupported categories are reported explicitly; no numeric uncertainty is inferred from synthetic deterministic output.'
  }
}

function buildAssertion(record, objects) {
  const [modelObject, protocolObject, resultObject] = objects
  return DerivedAssertionSchema.parse({
    contract_version: DERIVED_CONTRACT_VERSION,
    subject_id: 'OBSERVABLE:APAP-PEAK-INJURED-FRACTION',
    property: 'peak-injured-fraction',
    statement: `The synthetic ${record.result.context.taxon_label} APAP benchmark predicts a peak modeled injured-hepatocyte fraction of ${record.result.summary.peakInjuredFraction}.`,
    classification: 'predicted',
    value: { kind: 'scalar', value: record.result.summary.peakInjuredFraction },
    unit: FRACTION,
    context: assertionContext(record),
    applicability: applicability(record),
    uncertainty: qualitativeUncertainty(),
    dependencies: [
      { type: 'release', family: 'apap', release_id: APAP_RELEASE_ID, digest: `sha256:${APAP_RELEASE_DIGEST}` },
      { type: 'model', model_id: modelObject.object_id, version: modelObject.version, digest: modelObject.digest },
      { type: 'artifact', artifact_id: protocolObject.object_id, role: 'input', digest: protocolObject.digest },
      { type: 'artifact', artifact_id: resultObject.object_id, role: 'reproduction', digest: resultObject.digest }
    ],
    reproduction: {
      status: 'producer-verified',
      method: 'Rerun the exact APAP specification with the pinned equation set and compare the complete RFC 8785 canonical result artifact.',
      protocol_artifact_digest: protocolObject.digest,
      result_artifact_digest: resultObject.digest,
      tolerance: 0
    },
    limitations: [
      ...record.result.limitations.map((item) => `${item.id}: ${item.statement}`),
      'The scalar is explicitly synthetic and unsupported; it is not a measured injury endpoint or biological validation.',
      'Qualitative uncertainty labels identify unknowns but do not quantify predictive uncertainty.'
    ]
  })
}

export function verifyDerivedBundle(submission) {
  const parsed = BundleSubmissionSchema.parse(submission)
  for (const object of parsed.bundle.objects) {
    if (canonicalDigest(object.content) !== object.digest) throw new TypeError(`Derived object digest mismatch: ${object.object_id}`)
  }
  for (const wrapped of parsed.bundle.assertions) {
    if (canonicalDigest(wrapped.assertion) !== wrapped.digest) throw new TypeError(`Derived assertion digest mismatch: ${wrapped.digest}`)
  }
  if (canonicalDigest(parsed.bundle) !== parsed.digest) throw new TypeError(`Derived bundle digest mismatch: ${parsed.digest}`)

  const objectMap = new Map(parsed.bundle.objects.map((item) => [item.digest, item]))
  const used = new Set()
  for (const wrapped of parsed.bundle.assertions) {
    for (const dependency of wrapped.assertion.dependencies.filter((item) => ['model', 'transform', 'artifact'].includes(item.type))) {
      const object = objectMap.get(dependency.digest)
      if (!object) throw new TypeError(`Derived dependency is not closed: ${dependency.digest}`)
      const expectedId = dependency.type === 'model' ? dependency.model_id : dependency.type === 'transform' ? dependency.transform_id : dependency.artifact_id
      const identityMatches = object.kind === dependency.type && object.object_id === expectedId && (dependency.type === 'artifact' || object.version === dependency.version)
      if (!identityMatches) throw new TypeError(`Derived dependency identity does not match its ${dependency.type} object: ${dependency.digest}`)
      used.add(dependency.digest)
    }
  }
  if (used.size !== objectMap.size) throw new TypeError('Derived bundle contains an unreferenced object')
  return parsed
}

export function buildApapDerivedBundle(input) {
  const record = ApapRunRecordSchema.parse(input)
  const objects = [
    contentObject('model', 'apap-liver-equation-model', APAP_MODEL_VERSION, apapModelContent()),
    contentObject('artifact', artifactId('protocol', record.runId), null, apapProtocolArtifactContent(record)),
    contentObject('artifact', artifactId('result', record.runId), null, apapResultArtifactContent(record))
  ]
  const assertion = buildAssertion(record, objects)
  const bundle = SubmissionBundleSchema.parse({
    contract_version: DERIVED_CONTRACT_VERSION,
    producer: { name: 'biochemical-inference', version: '1.0.0' },
    objects,
    assertions: [{ digest: canonicalDigest(assertion), assertion }]
  })
  return verifyDerivedBundle({ digest: canonicalDigest(bundle), bundle })
}

export function canonicalResultArtifactsEqual(left, right) {
  return canonicalJson(apapResultArtifactContent(left)) === canonicalJson(apapResultArtifactContent(right))
}
