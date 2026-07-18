import { createHash } from 'node:crypto'
import { canonicalJson } from '../../shared/canonical-json.js'
import {
  PHYSIOLOGY_RELEASE_DIGEST,
  PHYSIOLOGY_RELEASE_ID,
  PHYSIOLOGY_WARNING,
  PhysiologyApplicabilityResponseSchema,
  PhysiologyBenchmarksResponseSchema,
  PhysiologyCatalogSchema,
  PhysiologyContextsResponseSchema,
  PhysiologyCoverageResponseSchema,
  PhysiologyDetailSchema,
  PhysiologyEvidenceSchema,
  PhysiologyModelEvidenceResponseSchema,
  PhysiologyQuantitiesResponseSchema,
  PhysiologyValidationResponseSchema
} from '../../shared/physiology-contracts.js'
import { createPhysiologyFixtureClient } from './fixture.js'

export const DEFAULT_PHYSIOLOGY_URL = 'http://127.0.0.1:8000'

export class PhysiologyCompatibilityError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'PhysiologyCompatibilityError'
    this.statusCode = options.statusCode ?? 409
    this.code = options.code ?? 'PHYSIOLOGY_INCOMPATIBLE'
  }
}

function manifestDigest(manifest) {
  const payload = { ...manifest }
  delete payload.release_digest
  return createHash('sha256').update(canonicalJson(payload)).digest('hex')
}

function verifyEvidenceClosure(evidence) {
  const contexts = new Map(evidence.contexts.map((item) => [item.id, item]))
  const applicability = new Map(evidence.applicability.map((item) => [item.plugin_id, item]))
  const models = new Map(evidence.modelEvidence.map((item) => [item.plugin_id, item]))
  const ports = new Map(evidence.modelEvidence.flatMap((model) => model.ports.map((port) => [port.id, { ...port, plugin_id: model.plugin_id }])))
  for (const model of evidence.modelEvidence) {
    const context = contexts.get(model.context_id)
    const domain = applicability.get(model.plugin_id)
    if (!context || !domain || context.domain !== model.domain || domain.context_id !== model.context_id || domain.domain !== model.domain) throw new PhysiologyCompatibilityError(`Physiology plugin ${model.plugin_id} has inconsistent context or applicability evidence`)
    if (model.scientific_validation_status !== 'unsupported' || model.certification_status !== 'not-certified') throw new PhysiologyCompatibilityError(`Physiology evidence cannot certify ${model.plugin_id}`)
  }
  for (const quantity of evidence.quantities) {
    const source = ports.get(quantity.source.port_id)
    const target = ports.get(quantity.target.port_id)
    for (const [endpoint, declared, direction] of [[quantity.source, source, 'output'], [quantity.target, target, 'input']]) {
      if (!declared || endpoint.plugin_id !== declared.plugin_id || endpoint.direction !== direction || declared.direction !== direction || endpoint.semantic !== declared.semantic || endpoint.dimension !== declared.dimension || endpoint.unit !== declared.unit || declared.quantity_id !== quantity.id) throw new PhysiologyCompatibilityError(`Physiology quantity ${quantity.id} does not match its declared ${direction} port`)
    }
  }
  if (models.size !== 3 || ports.size !== 8) throw new PhysiologyCompatibilityError('Physiology model and port closure is incomplete')
  const benchmark = evidence.benchmarks[0]
  if (new Set(benchmark.context_ids).size !== 3 || new Set(benchmark.model_evidence_ids).size !== 3 || new Set(benchmark.quantity_ids).size !== 4) throw new PhysiologyCompatibilityError('Physiology benchmark does not bind the complete reference closure')
  if (evidence.observations.some((item) => item.supports_scientific_validation || item.values.some((value) => value.value_origin !== 'synthetic'))) throw new PhysiologyCompatibilityError('Physiology benchmark values must remain synthetic and scientifically unsupported')
  if (evidence.validation.some((item) => item.supported || item.validation_status !== 'unsupported' || item.protocol_conformance_used_as_scientific_evidence)) throw new PhysiologyCompatibilityError('Physiology protocol conformance was incorrectly promoted to scientific validation')
  if (evidence.coverage.filter((item) => item.taxon_id === 'NCBITaxon:10090').some((item) => item.coverage_status !== 'unsupported')) throw new PhysiologyCompatibilityError('Physiology human reference evidence cannot be extrapolated to mouse')
  return evidence
}

export function createPhysiologyClient(env = process.env) {
  if (env.BIOCHEMICAL_PHYSIOLOGY_USE_FIXTURE === 'true' || env.BIOCHEMICAL_INFERENCE_USE_FIXTURE === 'true') {
    const fixture = createPhysiologyFixtureClient()
    return {
      ...fixture,
      async evidence() {
        const [detail, contextEnvelope, applicabilityEnvelope, quantityEnvelope, modelEnvelope, benchmarkEnvelope, validationEnvelope, coverageEnvelope] = await Promise.all([fixture.detail(), fixture.contexts(), fixture.applicability(), fixture.quantities(), fixture.modelEvidence(), fixture.benchmarks(), fixture.validation(), fixture.coverage()])
        return verifyEvidenceClosure(PhysiologyEvidenceSchema.parse({ release: detail.release, manifest: detail.manifest, contexts: contextEnvelope.items, applicability: applicabilityEnvelope.items, quantities: quantityEnvelope.items, modelEvidence: modelEnvelope.items, benchmarks: benchmarkEnvelope.items, observations: benchmarkEnvelope.observations, validation: validationEnvelope.items, coverage: coverageEnvelope.items, limitations: detail.limitations, warning: PHYSIOLOGY_WARNING }))
      }
    }
  }

  const baseUrl = (env.BIOCHEMICAL_PHYSIOLOGY_URL ?? env.BIOCHEMICAL_DB_URL ?? DEFAULT_PHYSIOLOGY_URL).replace(/\/$/, '')
  const releaseId = env.BIOCHEMICAL_PHYSIOLOGY_RELEASE_ID ?? PHYSIOLOGY_RELEASE_ID
  const expectedDigest = env.BIOCHEMICAL_PHYSIOLOGY_EXPECTED_DIGEST ?? PHYSIOLOGY_RELEASE_DIGEST
  const timeoutMs = Number(env.BIOCHEMICAL_PHYSIOLOGY_TIMEOUT_MS ?? 5000)
  if (releaseId !== PHYSIOLOGY_RELEASE_ID) throw new PhysiologyCompatibilityError(`Only ${PHYSIOLOGY_RELEASE_ID} is supported`)
  if (expectedDigest !== PHYSIOLOGY_RELEASE_DIGEST) throw new PhysiologyCompatibilityError(`Configured physiology digest must equal the trusted ${PHYSIOLOGY_RELEASE_ID} digest`)
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new PhysiologyCompatibilityError('BIOCHEMICAL_PHYSIOLOGY_TIMEOUT_MS must be positive')
  const releaseBase = `/api/physiology/v1/releases/${encodeURIComponent(releaseId)}`

  async function request(path, immutable = true, signal) {
    try {
      const selectedSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs)
      const response = await fetch(`${baseUrl}${path}`, { headers: { accept: 'application/json' }, redirect: 'error', signal: selectedSignal })
      if (!response.ok) {
        const statusCode = response.status >= 400 && response.status < 500 ? response.status : 503
        throw new PhysiologyCompatibilityError(`Physiology service returned ${response.status} for ${path}`, { statusCode, code: response.status === 404 ? 'PHYSIOLOGY_NOT_FOUND' : 'PHYSIOLOGY_UPSTREAM_ERROR' })
      }
      if (immutable && (response.headers.get('x-release-digest') !== expectedDigest || response.headers.get('etag') !== `"sha256:${expectedDigest}"`)) throw new PhysiologyCompatibilityError(`Physiology response headers do not pin ${releaseId}`)
      return await response.json().catch(() => { throw new PhysiologyCompatibilityError(`Physiology service returned non-JSON metadata for ${path}`) })
    } catch (error) {
      if (error instanceof PhysiologyCompatibilityError) throw error
      const name = error && typeof error === 'object' && 'name' in error ? error.name : undefined
      if (name === 'TimeoutError' || name === 'AbortError') throw new PhysiologyCompatibilityError(`Physiology service timed out after ${timeoutMs} ms for ${path}`, { statusCode: 503, code: 'PHYSIOLOGY_TIMEOUT' })
      throw new PhysiologyCompatibilityError(`Physiology service is unavailable for ${path}`, { statusCode: 503, code: 'PHYSIOLOGY_UNAVAILABLE' })
    }
  }

  async function catalog(signal) {
    const parsed = PhysiologyCatalogSchema.safeParse(await request('/api/physiology/v1/releases', false, signal))
    if (!parsed.success || parsed.data.releases[0]?.release_digest !== expectedDigest) throw new PhysiologyCompatibilityError('Physiology catalog does not contain the trusted release and digest')
    return parsed.data
  }

  function verifyEnvelope(parsed, description) {
    if (!parsed.success) throw new PhysiologyCompatibilityError(`Physiology ${description} schema is incompatible with 1.0.0`)
    if (parsed.data.release.id !== releaseId || parsed.data.release.digest !== expectedDigest) throw new PhysiologyCompatibilityError(`Physiology ${description} does not match the pinned release and digest`)
    return parsed.data
  }

  async function detail() {
    await catalog()
    const payload = verifyEnvelope(PhysiologyDetailSchema.safeParse(await request(releaseBase)), 'release detail')
    if (manifestDigest(payload.manifest) !== expectedDigest) throw new PhysiologyCompatibilityError('Physiology canonical manifest digest does not match the trusted release digest')
    return payload
  }

  async function envelope(path, schema, description, signal) {
    await catalog(signal)
    return verifyEnvelope(schema.safeParse(await request(`${releaseBase}${path}`, true, signal)), description)
  }

  const client = {
    catalog,
    detail,
    async contexts(signal) { return envelope('/contexts', PhysiologyContextsResponseSchema, 'contexts', signal) },
    async applicability() { return envelope('/applicability', PhysiologyApplicabilityResponseSchema, 'applicability') },
    async quantities() { return envelope('/quantities', PhysiologyQuantitiesResponseSchema, 'quantities') },
    async modelEvidence() { return envelope('/model-evidence', PhysiologyModelEvidenceResponseSchema, 'model evidence') },
    async benchmarks() { return envelope('/benchmarks', PhysiologyBenchmarksResponseSchema, 'benchmarks') },
    async validation() { return envelope('/validation', PhysiologyValidationResponseSchema, 'validation') },
    async coverage() { return envelope('/coverage', PhysiologyCoverageResponseSchema, 'coverage') }
  }
  client.evidence = async () => {
    const [detailPayload, contextEnvelope, applicabilityEnvelope, quantityEnvelope, modelEnvelope, benchmarkEnvelope, validationEnvelope, coverageEnvelope] = await Promise.all([client.detail(), client.contexts(), client.applicability(), client.quantities(), client.modelEvidence(), client.benchmarks(), client.validation(), client.coverage()])
    return verifyEvidenceClosure(PhysiologyEvidenceSchema.parse({ release: detailPayload.release, manifest: detailPayload.manifest, contexts: contextEnvelope.items, applicability: applicabilityEnvelope.items, quantities: quantityEnvelope.items, modelEvidence: modelEnvelope.items, benchmarks: benchmarkEnvelope.items, observations: benchmarkEnvelope.observations, validation: validationEnvelope.items, coverage: coverageEnvelope.items, limitations: detailPayload.limitations, warning: PHYSIOLOGY_WARNING }))
  }
  return client
}

export { manifestDigest, verifyEvidenceClosure }
