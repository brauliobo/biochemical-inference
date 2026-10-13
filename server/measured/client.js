import { canonicalJson } from '../../shared/canonical-json.js'
import { canonicalSha256Hex, sha256Hex } from '../commons/digest.js'
import { readBoundedBody, timeoutSignal } from '../commons/upstream.js'
import {
  CommitmentResponseSchema,
  ConsumerCommitmentSchema,
  EvaluationRequestSchema,
  EvaluationResponseSchema,
  MEASURED_API_VIEW_SPECS,
  MEASURED_CATALOG_DIGEST,
  MEASURED_ENVELOPE_DIGEST,
  MEASURED_RELEASE_DIGEST,
  MEASURED_RELEASE_ID,
  MEASURED_HELDOUT_PARTITION_DIGEST,
  MEASURED_HELDOUT_PARTITION_ID,
  MEASURED_SELECTED_LINEAGE_IDS,
  MeasuredCatalogSchema
} from '../../shared/measured-contracts.js'
import {
  MAX_MEASURED_METADATA_BYTES,
  MAX_MEASURED_PAGE_BYTES,
  MEASURED_PAGE_LIMIT,
  MeasuredVerificationError,
  parseMeasuredCanonical,
  verifyMeasuredCatalog,
  verifyMeasuredDiscovery,
  verifyMeasuredEnvelope,
  verifyMeasuredLineage,
  verifyMeasuredPage,
  verifyMeasuredRelease,
  verifyMeasuredSignedViews,
  verifyMeasuredTrust
} from './verification.js'
import { defineProblemError } from '../commons/errors.js'

export const DEFAULT_MEASURED_URL = 'http://127.0.0.1:8000'

export const MeasuredUpstreamError = defineProblemError('MeasuredUpstreamError', { statusCode: 503, code: 'MEASURED_UPSTREAM_FAILED', parent: MeasuredVerificationError })

export function validateMeasuredLoopbackUrl(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    throw new MeasuredUpstreamError('Measured upstream URL must be an absolute loopback HTTP origin.', { statusCode: 500, code: 'MEASURED_UPSTREAM_URL_INVALID' })
  }
  if (url.protocol !== 'http:' || !['127.0.0.1', '[::1]'].includes(url.hostname) || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) throw new MeasuredUpstreamError('Measured upstream is restricted to an origin-only 127.0.0.1 or [::1] HTTP URL.', { statusCode: 500, code: 'MEASURED_UPSTREAM_URL_REJECTED' })
  return url.origin
}

export function validateMeasuredProtectedConfig(env) {
  const origin = env.BIOCHEMICAL_MEASURED_ALLOWED_ORIGIN
  const token = env.BIOCHEMICAL_MEASURED_CSRF_TOKEN
  let parsed
  try {
    parsed = new URL(origin)
  } catch {
    throw new MeasuredUpstreamError('BIOCHEMICAL_MEASURED_ALLOWED_ORIGIN must be an exact HTTP(S) origin.', { statusCode: 500, code: 'MEASURED_UPSTREAM_ORIGIN_INVALID' })
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.origin !== origin) throw new MeasuredUpstreamError('BIOCHEMICAL_MEASURED_ALLOWED_ORIGIN must be an exact HTTP(S) origin without credentials or path.', { statusCode: 500, code: 'MEASURED_UPSTREAM_ORIGIN_INVALID' })
  if (typeof token !== 'string' || token.length < 43 || token.length > 128 || !/^[A-Za-z0-9_-]+$/.test(token)) throw new MeasuredUpstreamError('BIOCHEMICAL_MEASURED_CSRF_TOKEN must be canonical unpadded base64url from 43 to 128 characters.', { statusCode: 500, code: 'MEASURED_UPSTREAM_CSRF_INVALID' })
  const decoded = Buffer.from(token, 'base64url')
  if (decoded.toString('base64url') !== token) throw new MeasuredUpstreamError('BIOCHEMICAL_MEASURED_CSRF_TOKEN is not canonical base64url.', { statusCode: 500, code: 'MEASURED_UPSTREAM_CSRF_INVALID' })
  return { origin, token }
}

const boundedBody = (response, maximum, label, onRead) => readBoundedBody(response, { maximum, label, ErrorClass: MeasuredUpstreamError, onRead })

function immutableHeaders(response, bytes, label, releaseBound) {
  const digest = sha256Hex(bytes)
  if (response.headers.get('content-type') !== 'application/json' || response.headers.get('etag') !== `"sha256:${digest}"`) throw new MeasuredUpstreamError(`${label} returned incompatible canonical JSON headers.`)
  const expectedCache = releaseBound ? 'public, max-age=31536000, immutable' : 'public, max-age=60'
  if (response.headers.get('cache-control') !== expectedCache) throw new MeasuredUpstreamError(`${label} returned an incompatible cache policy.`)
  if (releaseBound && response.headers.get('x-release-digest') !== MEASURED_RELEASE_DIGEST) throw new MeasuredUpstreamError(`${label} returned an incompatible release digest header.`)
}

const EXPECTED_DISCLOSURE = Object.freeze([
  ['c', '2.63', '2.63', 'ab', '0.04'],
  ['d200', '2.74', '2.74', 'a', '0.05'],
  ['d250', '2.700', '2.7', 'a', '0.06'],
  ['prc-d200', '2.57', '2.57', 'ab', '0.04'],
  ['prc-d250', '2.49', '2.49', 'b', '0.05'],
  ['prc', '2.47', '2.47', 'b', '0.05']
].map(([group, reported, normalized, annotation, uncertainty]) => ({
  family_id: 'family:zenodo:7648975',
  group_id: `group:zenodo7648975:${group}`,
  measurement_id: `measurement:zenodo7648975:${group}:gsh`,
  normalized: { scientific_origin: 'derived-measurement', transformation_id: 'transformation:mmol-g-identity', unit: 'mmol/g', value: normalized },
  observable_id: 'observable:renal-gsh',
  reported_annotations: [annotation],
  reported_unit: 'mmol/g',
  reported_value: reported,
  study_id: 'study:zenodo:7648975',
  uncertainty: { id: `uncertainty:zenodo7648975:${group}:gsh`, kind: 'sem', measurement_id: `measurement:zenodo7648975:${group}:gsh`, n: 6, unit: 'mmol/g', value: uncertainty }
})))

export function verifyEvaluationReceipt(response, evaluation) {
  const frozenDigest = canonicalSha256Hex(evaluation.frozen_request)
  if (frozenDigest !== evaluation.commitment_digest || response.commitment_digest !== evaluation.commitment_digest) throw new MeasuredVerificationError('Measured evaluation receipt does not bind the exact commitment.')
  if (response.release.id !== MEASURED_RELEASE_ID || response.release.digest !== MEASURED_RELEASE_DIGEST || response.partition.id !== MEASURED_HELDOUT_PARTITION_ID || response.partition.closure_digest !== MEASURED_HELDOUT_PARTITION_DIGEST || response.partition.role !== 'external-held-out') throw new MeasuredVerificationError('Measured evaluation receipt has an incompatible release or partition identity.')
  if (canonicalJson(response.partition.family_ids) !== canonicalJson(['family:zenodo:7648975']) || canonicalJson(response.partition.study_ids) !== canonicalJson(['study:zenodo:7648975'])) throw new MeasuredVerificationError('Measured evaluation receipt has incompatible family/study membership.')
  const frozen = evaluation.frozen_request
  if (frozen.release_id !== MEASURED_RELEASE_ID || frozen.release_digest !== MEASURED_RELEASE_DIGEST || frozen.target_partition_id !== response.partition.id || frozen.target_partition_digest !== response.partition.closure_digest || frozen.target_partition_role !== response.partition.role || canonicalJson(frozen.family_ids) !== canonicalJson(response.partition.family_ids) || canonicalJson(frozen.observable_ids) !== canonicalJson(['observable:renal-gsh'])) throw new MeasuredVerificationError('Measured evaluation selection does not match the disclosed partition.')
  const identifiers = response.items.map((item) => item.measurement_id)
  if (new Set(identifiers).size !== identifiers.length || response.items.some((item) => item.uncertainty.measurement_id !== item.measurement_id)) throw new MeasuredVerificationError('Measured evaluation contains duplicate outcomes or mismatched uncertainty identity.')
  if (canonicalJson(response.items) !== canonicalJson(EXPECTED_DISCLOSURE)) throw new MeasuredVerificationError('Measured evaluation does not contain the exact six pinned selected records.')
  return response
}

export function createMeasuredClient(env = process.env, options = {}) {
  const baseUrl = validateMeasuredLoopbackUrl(env.BIOCHEMICAL_MEASURED_URL ?? env.BIOCHEMICAL_DB_URL ?? DEFAULT_MEASURED_URL)
  const timeoutMs = Number(env.BIOCHEMICAL_MEASURED_TIMEOUT_MS ?? 10_000)
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 30_000) throw new MeasuredUpstreamError('BIOCHEMICAL_MEASURED_TIMEOUT_MS must be an integer from 100 to 30000.', { statusCode: 500, code: 'MEASURED_TIMEOUT_INVALID' })
  const protectedConfig = validateMeasuredProtectedConfig(env)
  const fetchImpl = options.fetchImpl ?? fetch

  async function request(path, { method = 'GET', body, headers = {}, maximum = MAX_MEASURED_METADATA_BYTES, expectedStatus = 200, signal, ownership = () => {}, releaseBound = path.includes(`/releases/${MEASURED_RELEASE_ID}`), privateResponse = false } = {}) {
    let response
    try {
      response = await fetchImpl(`${baseUrl}${path}`, { method, body, headers: { accept: 'application/json', ...headers }, redirect: 'manual', signal: timeoutSignal(timeoutMs, signal) })
      ownership()
    } catch (error) {
      if (error instanceof MeasuredVerificationError) throw error
      if (signal?.aborted) throw signal.reason ?? new DOMException('Measured request was cancelled.', 'AbortError')
      throw new MeasuredUpstreamError(`Measured upstream is unavailable for ${path}.`, { code: 'MEASURED_UPSTREAM_UNAVAILABLE' })
    }
    if (privateResponse) {
      if (response.headers.get('content-type') !== 'application/json' || response.headers.get('cache-control') !== 'private, no-store' || response.headers.has('etag') || response.headers.get('x-release-digest') !== MEASURED_RELEASE_DIGEST) throw new MeasuredUpstreamError('Measured protected response has incompatible no-store headers.')
    }
    if (response.status !== expectedStatus) {
      if (response.status >= 300 && response.status < 400) throw new MeasuredUpstreamError(`Measured upstream redirect was refused for ${path}.`, { code: 'MEASURED_REDIRECT_REFUSED' })
      throw new MeasuredUpstreamError(`Measured upstream returned ${response.status} for ${path}.`, { code: 'MEASURED_UPSTREAM_STATUS', statusCode: privateResponse && response.status >= 400 && response.status <= 599 ? response.status : response.status === 409 ? 409 : 503 })
    }
    if (expectedStatus !== 200) return { response, bytes: Buffer.alloc(0), path }
    const bytes = await boundedBody(response, maximum, `Measured ${path}`, ownership)
    if (!privateResponse) {
      immutableHeaders(response, bytes, `Measured ${path}`, releaseBound)
    }
    return { response, bytes, path }
  }

  async function traverse(endpoint, recordType, query, signal, ownership, objects) {
    const items = []
    const cursors = new Set()
    let cursor
    let firstCursor = null
    let pages = 0
    do {
      pages += 1
      if (pages > 1000) throw new MeasuredVerificationError(`Measured ${endpoint} traversal exceeded its page bound.`)
      const parameters = new URLSearchParams()
      for (const [key, value] of Object.entries(query)) if (value !== null) parameters.set(key, value)
      parameters.set('limit', String(MEASURED_PAGE_LIMIT))
      if (cursor) parameters.set('cursor', cursor)
      const path = `/api/measured/v1/releases/${encodeURIComponent(MEASURED_RELEASE_ID)}/${endpoint}?${parameters}`
      const artifact = await request(path, { maximum: MAX_MEASURED_PAGE_BYTES, signal, ownership })
      ownership()
      objects.push(artifact)
      const completeQuery = Object.fromEntries(Object.entries(query).sort(([left], [right]) => left.localeCompare(right)))
      const page = verifyMeasuredPage(artifact.bytes, { endpoint, recordType, limit: MEASURED_PAGE_LIMIT, query: completeQuery })
      items.push(...page.items)
      cursor = page.next_cursor
      if (!firstCursor && cursor) firstCursor = cursor
      if (cursor && cursors.has(cursor)) throw new MeasuredVerificationError(`Measured ${endpoint} traversal repeated a cursor.`)
      if (cursor) cursors.add(cursor)
    } while (cursor)
    const ids = items.map((item) => item.id)
    if (ids.some((id, index) => index > 0 && id <= ids[index - 1])) throw new MeasuredVerificationError(`Measured ${endpoint} traversal is not uniquely ordered.`)
    return { items, firstCursor }
  }

  async function probeCursor(cursor, signal, ownership) {
    const release = encodeURIComponent(MEASURED_RELEASE_ID)
    const token = encodeURIComponent(cursor)
    await Promise.all([
      request(`/api/measured/v1/releases/${release}/measurements?role=development&limit=99&cursor=${token}`, { expectedStatus: 422, signal, ownership }),
      request(`/api/measured/v1/releases/${release}/measurements?role=calibration&limit=100&cursor=${token}`, { expectedStatus: 422, signal, ownership }),
      request(`/api/measured/v1/releases/${release}/missingness?role=development&limit=100&cursor=${token}`, { expectedStatus: 422, signal, ownership }),
      request(`/api/measured/v1/releases/${release}/measurements?role=development&limit=100&cursor=${token}&unknown=x`, { expectedStatus: 422, signal, ownership })
    ])
    ownership()
  }

  return {
    baseUrl,
    async synchronize(signal, ownership = () => {}) {
      const objects = []
      const get = async (path, maximum) => {
        const artifact = await request(path, { maximum, signal, ownership })
        ownership()
        objects.push(artifact)
        return artifact.bytes
      }
      const discovery = verifyMeasuredDiscovery(await get('/api/measured/v1'))
      const trustResult = verifyMeasuredTrust(await get('/api/measured/v1/trust'))
      const catalogBytes = await get('/api/measured/v1/releases')
      const { catalog, entry, key } = verifyMeasuredCatalog(catalogBytes, trustResult.trust)
      if (discovery.catalog_digest !== sha256Hex(catalogBytes)) throw new MeasuredVerificationError('Measured discovery and catalog bytes disagree.')
      const releasePath = `/api/measured/v1/releases/${encodeURIComponent(MEASURED_RELEASE_ID)}`
      const releaseResult = verifyMeasuredRelease(await get(releasePath), entry)
      const envelopeBytes = await get(`${releasePath}/envelope`)
      const envelopeResult = verifyMeasuredEnvelope(envelopeBytes, entry, releaseResult.manifest, trustResult.trust)

      const traversals = new Map()
      const results = new Map()
      for (const spec of MEASURED_API_VIEW_SPECS) {
        const result = await traverse(spec.endpoint, spec.recordType, spec.query, signal, ownership, objects)
        ownership()
        traversals.set(spec.viewId, result.items)
        results.set(spec.viewId, result)
      }
      const datasets = results.get('families-all')
      const studies = results.get('studies-all')
      const partitions = results.get('partitions-all')
      const provenance = results.get('sources-all')
      const applicability = results.get('applicability-all')
      const exclusions = results.get('exclusions-all')
      const development = results.get('measurements-development')
      const calibration = results.get('measurements-calibration')
      const developmentMissing = results.get('missingness-development')
      const calibrationMissing = results.get('missingness-calibration')
      if (!development.firstCursor) throw new MeasuredVerificationError('Measured producer did not provide the required multi-page development cursor.')
      await probeCursor(development.firstCursor, signal, ownership)
      ownership()

      const counts = releaseResult.manifest.record_counts
      const measurements = [...development.items, ...calibration.items].sort((left, right) => left.id.localeCompare(right.id))
      const missingness = [...developmentMissing.items, ...calibrationMissing.items].sort((left, right) => left.id.localeCompare(right.id))
      if (datasets.items.length !== counts.families || studies.items.length !== counts.studies || partitions.items.length !== counts.partitions || provenance.items.length !== counts.sources || applicability.items.length !== counts.applicability || exclusions.items.length !== counts.exclusions) throw new MeasuredVerificationError('Measured metadata traversal does not match signed manifest counts.')
      if (development.items.length !== 687 || calibration.items.length !== 851 || measurements.length !== counts.measurements - 6 || missingness.length !== counts.missingness) throw new MeasuredVerificationError('Measured non-heldout value/missingness closure does not match the pinned role counts.')
      if (measurements.some((item) => !['development', 'calibration'].includes(item.role)) || missingness.some((item) => !['development', 'calibration'].includes(item.role))) throw new MeasuredVerificationError('Heldout outcomes appeared in a public measured traversal.')

      const byMeasurementId = new Map(measurements.map((item) => [item.id, item]))
      const lineages = new Map()
      for (const measurementId of MEASURED_SELECTED_LINEAGE_IDS) {
        const measurement = byMeasurementId.get(measurementId)
        if (!measurement) throw new MeasuredVerificationError(`Signed selected lineage measurement is absent from signed value views: ${measurementId}.`)
        ownership()
        const path = `${releasePath}/lineage/${encodeURIComponent(measurement.id)}`
        const bytes = await get(path, MAX_MEASURED_PAGE_BYTES)
        ownership()
        const response = verifyMeasuredLineage(bytes, measurement)
        lineages.set(measurement.id, { value: response.lineage, digest: canonicalSha256Hex(response.lineage) })
      }
      const signedRoots = verifyMeasuredSignedViews(releaseResult.manifest, traversals, lineages)

      return {
        discovery, trust: trustResult.trust, catalog, entry, key, manifest: releaseResult.manifest,
        envelope: envelopeResult.envelope, release: releaseResult.response.release,
        records: { families: datasets.items, studies: studies.items, partitions: partitions.items, applicability: applicability.items, sources: provenance.items, measurements, missingness, exclusions: exclusions.items },
        lineages, objects,
        transport: { cursorBindingProved: true, pageLimit: MEASURED_PAGE_LIMIT, signedRoots },
        digests: { catalog: MEASURED_CATALOG_DIGEST, trust: trustResult.response.trust_digest, manifest: sha256Hex(releaseResult.manifestBytes), envelope: sha256Hex(envelopeBytes) }
      }
    },
    async commit(input, signal) {
      const commitment = ConsumerCommitmentSchema.parse(input)
      const path = `/api/measured/v1/releases/${encodeURIComponent(MEASURED_RELEASE_ID)}/commitments`
      const artifact = await request(path, { method: 'POST', body: canonicalJson(commitment), headers: { 'content-type': 'application/json', origin: protectedConfig.origin, 'x-csrf-token': protectedConfig.token }, signal, privateResponse: true })
      const response = CommitmentResponseSchema.parse(parseMeasuredCanonical(artifact.bytes, CommitmentResponseSchema, 'Measured commitment response'))
      const digest = canonicalSha256Hex(commitment)
      if (response.commitment_digest !== digest || response.created_at !== commitment.created_at || response.target_partition_digest !== commitment.target_partition_digest) throw new MeasuredVerificationError('Measured commitment receipt does not bind the exact frozen request, timestamp, and partition.')
      return response
    },
    async evaluate(input, signal) {
      const evaluation = EvaluationRequestSchema.parse(input)
      const path = `/api/measured/v1/releases/${encodeURIComponent(MEASURED_RELEASE_ID)}/evaluation`
      const artifact = await request(path, { method: 'POST', body: canonicalJson(evaluation), headers: { 'content-type': 'application/json', origin: protectedConfig.origin, 'x-csrf-token': protectedConfig.token }, signal, privateResponse: true })
      const response = EvaluationResponseSchema.parse(parseMeasuredCanonical(artifact.bytes, EvaluationResponseSchema, 'Measured evaluation response'))
      verifyEvaluationReceipt(response, evaluation)
      return response
    }
  }
}

export function verifyCatalogFixture(bytes) {
  return parseMeasuredCanonical(bytes, MeasuredCatalogSchema, 'Measured fixture catalog', MEASURED_CATALOG_DIGEST)
}

export { MEASURED_ENVELOPE_DIGEST, MEASURED_RELEASE_DIGEST, MEASURED_RELEASE_ID }
