import { canonicalJson } from '../../shared/canonical-json.js'
import { readBoundedBody, timeoutSignal, validateLoopbackOrigin } from '../commons/upstream.js'
import {
  DATA_PLANE_BASELINE_RELEASE_ID,
  DATA_PLANE_CANDIDATE_RELEASE_ID,
  DATA_PLANE_CATALOG_DIGEST,
  DATA_PLANE_DIFF_RESPONSE_DIGEST,
  DATA_PLANE_TRUST_DIGEST,
  FactoryRecordPageSchema
} from '../../shared/data-plane-contracts.js'
import {
  DataPlaneVerificationError,
  MAX_METADATA_BYTES,
  MAX_PARTITION_BYTES,
  PRODUCER_PAGE_LIMIT,
  RECORD_TYPES,
  parseCanonicalBytes,
  sha256,
  verifyCatalog,
  verifyDiscovery,
  verifyEnvelope,
  verifyManifest,
  verifyProducerPage,
  verifyProducerTraversal,
  verifyRecordClosure,
  verifySemanticDiff,
  verifyTrust,
  parsePartition
} from './verification.js'
import { defineProblemError } from '../commons/errors.js'

export const DEFAULT_FACTORY_URL = 'http://127.0.0.1:8000'

export const DataPlaneUpstreamError = defineProblemError('DataPlaneUpstreamError', { statusCode: 503, code: 'DATA_PLANE_UPSTREAM_FAILED', parent: DataPlaneVerificationError })

export function validateLoopbackFactoryUrl(value) {
  return validateLoopbackOrigin(value, { ErrorClass: DataPlaneUpstreamError, subject: 'Factory upstream', codePrefix: 'DATA_PLANE_UPSTREAM', noun: 'URL' })
}

const boundedBody = (response, maxBytes, label, assertOwnership) => readBoundedBody(response, { maximum: maxBytes, label, ErrorClass: DataPlaneUpstreamError, onRead: assertOwnership })

function exactHeaders(response, mediaType, digest, label, extra = {}) {
  if (response.headers.get('content-type') !== mediaType) throw new DataPlaneUpstreamError(`${label} returned incompatible media type ${response.headers.get('content-type') ?? '(missing)'}; expected ${mediaType}.`)
  if (response.headers.get('etag') !== `"sha256:${digest}"` || response.headers.get('x-content-sha256') !== digest) throw new DataPlaneUpstreamError(`${label} returned incompatible digest headers.`)
  for (const [header, expected] of Object.entries(extra)) if (response.headers.get(header) !== expected) throw new DataPlaneUpstreamError(`${label} returned an incompatible ${header} header.`)
}

export function createFactoryClient(env = process.env, options = {}) {
  const baseUrl = validateLoopbackFactoryUrl(env.BIOCHEMICAL_FACTORY_URL ?? env.BIOCHEMICAL_DB_URL ?? DEFAULT_FACTORY_URL)
  const timeoutMs = Number(env.BIOCHEMICAL_FACTORY_TIMEOUT_MS ?? 5000)
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 30_000) throw new DataPlaneUpstreamError('BIOCHEMICAL_FACTORY_TIMEOUT_MS must be an integer from 100 to 30000.', { statusCode: 500, code: 'DATA_PLANE_TIMEOUT_INVALID' })
  const fetchImpl = options.fetchImpl ?? fetch

  async function request(path, { mediaType = 'application/json', maxBytes = MAX_METADATA_BYTES, signal, expectedStatus = 200, assertOwnership = () => {} } = {}) {
    let response
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method: 'GET',
        headers: { accept: mediaType },
        redirect: 'manual',
        signal: timeoutSignal(timeoutMs, signal)
      })
      assertOwnership()
    } catch (error) {
      if (error instanceof DataPlaneVerificationError) throw error
      if (signal?.aborted) throw signal.reason ?? new DOMException('The data-plane sync was cancelled.', 'AbortError')
      const name = error && typeof error === 'object' && 'name' in error ? error.name : ''
      if (name === 'AbortError' || name === 'TimeoutError') throw new DataPlaneUpstreamError(`Factory upstream timed out after ${timeoutMs} ms for ${path}.`, { code: 'DATA_PLANE_UPSTREAM_TIMEOUT' })
      throw new DataPlaneUpstreamError(`Factory upstream is unavailable for ${path}.`, { code: 'DATA_PLANE_UPSTREAM_UNAVAILABLE' })
    }
    if (response.status !== expectedStatus) {
      if (response.status >= 300 && response.status < 400) throw new DataPlaneUpstreamError(`Factory upstream redirect was refused for ${path}.`, { code: 'DATA_PLANE_REDIRECT_REFUSED' })
      throw new DataPlaneUpstreamError(`Factory upstream returned ${response.status} for ${path}.`, { code: 'DATA_PLANE_UPSTREAM_STATUS' })
    }
    if (expectedStatus !== 200) return { response, bytes: Buffer.alloc(0) }
    const bytes = await boundedBody(response, maxBytes, `Factory ${path}`, assertOwnership)
    assertOwnership()
    return { response, bytes }
  }

  async function canonicalArtifact(path, { expectedDigest, maxBytes, label, mediaType = 'application/json', extraHeaders, schema, signal, verifyHeaders = true, immutable = true, assertOwnership }) {
    const result = await request(path, { mediaType, maxBytes, signal, assertOwnership })
    const digest = expectedDigest ?? sha256(result.bytes)
    if (verifyHeaders) exactHeaders(result.response, mediaType, digest, label, { 'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=60, must-revalidate', ...extraHeaders })
    const value = schema ? parseCanonicalBytes(result.bytes, schema, label, expectedDigest) : undefined
    return { ...result, digest, value }
  }

  async function assertProducerCursorBinding(releaseId, otherReleaseId, cursor, signal, assertOwnership) {
    const release = encodeURIComponent(releaseId)
    const token = encodeURIComponent(cursor)
    const changedLimit = `/api/factory/v1/releases/${release}/records/compounds?limit=${PRODUCER_PAGE_LIMIT + 1}&cursor=${token}`
    const changedType = `/api/factory/v1/releases/${release}/records/proteins?limit=${PRODUCER_PAGE_LIMIT}&cursor=${token}`
    const changedFilter = `/api/factory/v1/releases/${release}/records/compounds?limit=${PRODUCER_PAGE_LIMIT}&cursor=${token}&id=${encodeURIComponent('CHEBI:15377')}`
    const changedRelease = `/api/factory/v1/releases/${encodeURIComponent(otherReleaseId)}/records/compounds?limit=${PRODUCER_PAGE_LIMIT}&cursor=${token}`
    await Promise.all([
      request(changedLimit, { signal, expectedStatus: 422, assertOwnership }),
      request(changedType, { signal, expectedStatus: 422, assertOwnership }),
      request(changedFilter, { signal, expectedStatus: 422, assertOwnership }),
      request(changedRelease, { signal, expectedStatus: 422, assertOwnership })
    ])
    assertOwnership()
  }

  return {
    baseUrl,
    async synchronize(signal, assertOwnership = () => {}) {
      const owned = async (promise) => {
        const value = await promise
        assertOwnership()
        if (signal?.aborted) throw signal.reason ?? new DOMException('The data-plane sync was cancelled.', 'AbortError')
        return value
      }
      assertOwnership()
      const discoveryArtifact = await owned(canonicalArtifact('/api/factory/v1', { label: 'Factory discovery', signal, immutable: false, assertOwnership }))
      const discovery = verifyDiscovery(discoveryArtifact.bytes)

      const trustArtifact = await owned(canonicalArtifact('/api/factory/v1/trust', { expectedDigest: DATA_PLANE_TRUST_DIGEST, label: 'Factory trust store', signal, immutable: false, assertOwnership }))
      const trust = verifyTrust(trustArtifact.bytes)

      const catalogArtifact = await owned(canonicalArtifact('/api/factory/v1/releases', { expectedDigest: DATA_PLANE_CATALOG_DIGEST, label: 'Factory catalog', signal, immutable: false, assertOwnership }))
      const { catalog, entries } = verifyCatalog(catalogArtifact.bytes, trust)
      if (discovery.catalog_digest !== sha256(catalogArtifact.bytes) || discovery.release_count !== catalog.payload.releases.length) throw new DataPlaneVerificationError('Factory discovery and signed catalog disagree.')

      const releases = new Map()
      for (const entry of catalog.payload.releases) {
        const encodedRelease = encodeURIComponent(entry.release_id)
        const envelopeArtifact = await owned(canonicalArtifact(`/api/factory/v1/releases/${encodedRelease}/envelope`, { expectedDigest: entry.envelope_sha256, label: `Factory release envelope ${entry.release_id}`, signal, assertOwnership }))
        const { envelope, key } = verifyEnvelope(envelopeArtifact.bytes, entry, trust)
        const manifestArtifact = await owned(canonicalArtifact(`/api/factory/v1/releases/${encodedRelease}/manifest`, {
          expectedDigest: entry.manifest_sha256,
          label: `Factory release manifest ${entry.release_id}`,
          signal,
          assertOwnership,
          extraHeaders: { 'x-release-digest': entry.release_digest }
        }))
        const manifest = verifyManifest(manifestArtifact.bytes, entry, envelope)
        const partitionBytes = new Map()
        const parsedPartitions = new Map()
        for (const partition of manifest.partitions) {
          assertOwnership()
          const number = Number(partition.path.match(/part-([0-9]{5})\.ndjson$/)[1])
          const artifact = await owned(canonicalArtifact(`/api/factory/v1/releases/${encodedRelease}/partitions/${encodeURIComponent(partition.record_type)}/${number}`, {
            expectedDigest: partition.sha256,
            maxBytes: Math.min(MAX_PARTITION_BYTES, partition.bytes),
            label: `Factory partition ${entry.release_id}/${partition.path}`,
            mediaType: 'application/x-ndjson',
            signal,
            assertOwnership,
            extraHeaders: { 'x-release-digest': entry.release_digest, 'x-record-type': partition.record_type }
          }))
          partitionBytes.set(partition.path, artifact.bytes)
          parsedPartitions.set(partition.path, parsePartition(artifact.bytes, partition))
        }
        const records = verifyRecordClosure(manifest, parsedPartitions)
        const release = { id: manifest.release_id, schema_version: manifest.schema_version, digest: manifest.release_digest }
        const traversed = Object.fromEntries(RECORD_TYPES.map((type) => [type, []]))
        let cursorProbe
        for (const recordType of RECORD_TYPES) {
          let cursor
          let pageCount = 0
          const seenCursors = new Set()
          const maximumPages = Math.ceil(records[recordType].length / PRODUCER_PAGE_LIMIT) + 1
          do {
            pageCount += 1
            if (pageCount > maximumPages) throw new DataPlaneVerificationError(`Producer cursor traversal exceeded its manifest bound for ${entry.release_id}/${recordType}.`)
            const query = new URLSearchParams({ limit: String(PRODUCER_PAGE_LIMIT) })
            if (cursor) query.set('cursor', cursor)
            const path = `/api/factory/v1/releases/${encodedRelease}/records/${encodeURIComponent(recordType)}?${query}`
            const pageArtifact = await owned(canonicalArtifact(path, { label: `Factory ${entry.release_id}/${recordType} record page`, signal, schema: FactoryRecordPageSchema, assertOwnership }))
            cursor = verifyProducerPage(pageArtifact.value, release, recordType, PRODUCER_PAGE_LIMIT, traversed[recordType])
            if (cursor && seenCursors.has(cursor)) throw new DataPlaneVerificationError(`Producer cursor traversal repeated a cursor for ${entry.release_id}/${recordType}.`)
            if (cursor) seenCursors.add(cursor)
            if (traversed[recordType].length > records[recordType].length) throw new DataPlaneVerificationError(`Producer cursor traversal exceeded the manifest count for ${entry.release_id}/${recordType}.`)
            if (recordType === 'compounds' && cursor && !cursorProbe) cursorProbe = cursor
          } while (cursor)
        }
        verifyProducerTraversal(records, traversed)
        if (!cursorProbe) throw new DataPlaneVerificationError(`Producer did not supply the expected bounded compound cursor for ${entry.release_id}.`)
        const otherReleaseId = entry.release_id === DATA_PLANE_BASELINE_RELEASE_ID ? DATA_PLANE_CANDIDATE_RELEASE_ID : DATA_PLANE_BASELINE_RELEASE_ID
        await owned(assertProducerCursorBinding(entry.release_id, otherReleaseId, cursorProbe, signal, assertOwnership))
        releases.set(entry.release_id, {
          entry, envelope, key, manifest, records, release,
          bytes: { envelope: envelopeArtifact.bytes, manifest: manifestArtifact.bytes, partitions: partitionBytes },
          transport: { producerPageLimit: PRODUCER_PAGE_LIMIT, cursorBindingProved: true, partitionRecordEquality: canonicalJson(records) === canonicalJson(traversed) }
        })
      }

      const diffPath = `/api/factory/v1/diff?base_release_id=${encodeURIComponent(DATA_PLANE_BASELINE_RELEASE_ID)}&candidate_release_id=${encodeURIComponent(DATA_PLANE_CANDIDATE_RELEASE_ID)}`
      const diffArtifact = await owned(canonicalArtifact(diffPath, { expectedDigest: DATA_PLANE_DIFF_RESPONSE_DIGEST, label: 'Factory baseline-to-candidate semantic diff', signal, verifyHeaders: false, assertOwnership }))
      const diff = verifySemanticDiff(diffArtifact.bytes, releases.get(DATA_PLANE_BASELINE_RELEASE_ID), releases.get(DATA_PLANE_CANDIDATE_RELEASE_ID))
      exactHeaders(diffArtifact.response, 'application/json', diff.diff_digest, 'Factory baseline-to-candidate semantic diff', { 'cache-control': 'public, max-age=31536000, immutable' })

      return {
        discovery,
        trust,
        catalog,
        entries,
        releases,
        diff,
        bytes: {
          trust: trustArtifact.bytes,
          catalog: catalogArtifact.bytes,
          diff: diffArtifact.bytes
        }
      }
    }
  }
}
