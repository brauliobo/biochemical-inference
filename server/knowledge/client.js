import {
  adaptCatalogEntry,
  adaptNetwork,
  adaptProvenance,
  BiochemicalDbCatalogSchema,
  BiochemicalDbNetworkSchema,
  BiochemicalDbProvenanceSchema,
  canonicalTaxonId
} from './biochemical-db.js'
import {
  adaptAtlasCatalogEntry,
  adaptAtlasClaimsResponse,
  adaptAtlasCoverageResponse,
  adaptAtlasEntityResponse,
  adaptAtlasNetwork,
  adaptAtlasReleaseDetail,
  adaptAtlasSubgraph,
  BiochemicalDbAtlasCatalogSchema,
  BiochemicalDbAtlasClaimsResponseSchema,
  BiochemicalDbAtlasCoverageResponseSchema,
  BiochemicalDbAtlasEntityResponseSchema,
  BiochemicalDbAtlasNetworkSchema,
  BiochemicalDbAtlasReleaseDetailSchema,
  BiochemicalDbAtlasSubgraphSchema,
  canonicalAtlasTaxonId
} from './biochemical-db-atlas.js'
import {
  BUNDLED_ATLAS_DETAIL,
  BUNDLED_ATLAS_RELEASE,
  bundledAtlasClaims,
  bundledAtlasCoverage,
  bundledAtlasEntity,
  bundledAtlasNetwork,
  bundledAtlasSubgraph
} from './atlas-fixture.js'
import { BUNDLED_PROVENANCE, BUNDLED_RELEASE, bundledNetwork } from './fixture.js'
import { bundledKnowledgeSnapshot, verifyKnowledgeSnapshot } from './snapshot.js'
import { canonicalJson } from '../../shared/canonical-json.js'

const DEFAULT_BIOCHEMICAL_DB_URL = 'http://127.0.0.1:8000'
export const DEFAULT_RELEASE_ID = 'one-carbon-human-mouse-v1.0.0'
export const DEFAULT_RELEASE_DIGEST = 'b72d00c072551a6babd348cf88302788e9a7b547cca17f9fb834e7e0cddbeef1'
export const DEFAULT_ATLAS_RELEASE_ID = 'contextual-mthfr-human-mouse-v2.0.0'
export const DEFAULT_ATLAS_RELEASE_DIGEST = '79c9cb88780e71898b1efa7470ef314d5de5ff8ca89815f461b381cfa6b2d65f'

export class KnowledgeCompatibilityError extends Error {
  constructor(message) {
    super(message)
    this.name = 'KnowledgeCompatibilityError'
  }
}

export function createKnowledgeClient(env = process.env) {
  if (env.BIOCHEMICAL_INFERENCE_USE_FIXTURE === 'true') {
    return {
      async releases() { return [BUNDLED_RELEASE] },
      async network(releaseId, taxonId) {
        if (releaseId !== BUNDLED_RELEASE.id) throw new KnowledgeCompatibilityError(`Unknown release ${releaseId}`)
        return bundledNetwork(taxonId)
      },
      async provenance(releaseId) {
        if (releaseId !== BUNDLED_RELEASE.id) throw new KnowledgeCompatibilityError(`Unknown release ${releaseId}`)
        return BUNDLED_PROVENANCE
      },
      async snapshot(taxonId) {
        return bundledKnowledgeSnapshot(taxonId)
      },
      async atlasReleases() { return [BUNDLED_ATLAS_RELEASE] },
      async atlasRelease(releaseId) {
        if (releaseId !== BUNDLED_ATLAS_RELEASE.id) throw new KnowledgeCompatibilityError(`Unknown atlas release ${releaseId}`)
        return BUNDLED_ATLAS_DETAIL
      },
      async atlasEntity(releaseId, entityId, taxonId) {
        if (releaseId !== BUNDLED_ATLAS_RELEASE.id) throw new KnowledgeCompatibilityError(`Unknown atlas release ${releaseId}`)
        const response = bundledAtlasEntity(entityId, taxonId)
        if (!response) throw new KnowledgeCompatibilityError(`Unknown atlas entity in taxon context: ${entityId}`)
        return response
      },
      async atlasSubgraph(releaseId, rootId, taxonId, maxDepth, maxNodes) {
        if (releaseId !== BUNDLED_ATLAS_RELEASE.id) throw new KnowledgeCompatibilityError(`Unknown atlas release ${releaseId}`)
        const response = bundledAtlasSubgraph(rootId, taxonId, maxDepth, maxNodes)
        if (!response) throw new KnowledgeCompatibilityError(`Unknown atlas root in taxon context: ${rootId}`)
        return response
      },
      async atlasClaims(releaseId, filters = {}) {
        if (releaseId !== BUNDLED_ATLAS_RELEASE.id) throw new KnowledgeCompatibilityError(`Unknown atlas release ${releaseId}`)
        return bundledAtlasClaims(filters)
      },
      async atlasCoverage(releaseId, filters = {}) {
        if (releaseId !== BUNDLED_ATLAS_RELEASE.id) throw new KnowledgeCompatibilityError(`Unknown atlas release ${releaseId}`)
        return bundledAtlasCoverage(filters)
      },
      async atlasNetwork(releaseId, taxonId) {
        if (releaseId !== BUNDLED_ATLAS_RELEASE.id) throw new KnowledgeCompatibilityError(`Unknown atlas release ${releaseId}`)
        return bundledAtlasNetwork(taxonId)
      }
    }
  }

  const baseUrl = (env.BIOCHEMICAL_DB_URL ?? DEFAULT_BIOCHEMICAL_DB_URL).replace(/\/$/, '')
  const releaseId = env.BIOCHEMICAL_DB_RELEASE_ID ?? DEFAULT_RELEASE_ID
  const expectedDigest = env.BIOCHEMICAL_DB_EXPECTED_DIGEST ?? DEFAULT_RELEASE_DIGEST
  const atlasReleaseId = env.BIOCHEMICAL_DB_ATLAS_RELEASE_ID ?? DEFAULT_ATLAS_RELEASE_ID
  const atlasExpectedDigest = env.BIOCHEMICAL_DB_ATLAS_EXPECTED_DIGEST ?? DEFAULT_ATLAS_RELEASE_DIGEST
  const timeoutMs = Number(env.BIOCHEMICAL_DB_TIMEOUT_MS ?? 5000)
  if (!/^[a-f0-9]{64}$/.test(expectedDigest)) throw new KnowledgeCompatibilityError('BIOCHEMICAL_DB_EXPECTED_DIGEST must be a lowercase SHA-256 digest without a prefix')
  if (!/^[a-f0-9]{64}$/.test(atlasExpectedDigest)) throw new KnowledgeCompatibilityError('BIOCHEMICAL_DB_ATLAS_EXPECTED_DIGEST must be a lowercase SHA-256 digest without a prefix')
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new KnowledgeCompatibilityError('BIOCHEMICAL_DB_TIMEOUT_MS must be a positive number')

  const requestSignal = (signal) => signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs)

  async function fetchJson(path, signal) {
    try {
      const response = await fetch(`${baseUrl}${path}`, { headers: { accept: 'application/json' }, signal: requestSignal(signal) })
      if (!response.ok) throw new Error(`biochemical-db returned ${response.status} for ${path}`)
      return response.json()
    } catch (error) {
      const name = error && typeof error === 'object' && 'name' in error ? error.name : undefined
      if (name === 'TimeoutError' || name === 'AbortError') {
        throw new KnowledgeCompatibilityError(`biochemical-db timed out after ${timeoutMs} ms for ${path}`)
      }
      throw error
    }
  }

  async function fetchCanonicalJson(path, signal) {
    try {
      const response = await fetch(`${baseUrl}${path}`, { headers: { accept: 'application/json' }, signal: requestSignal(signal) })
      if (!response.ok) throw new Error(`biochemical-db returned ${response.status} for ${path}`)
      const text = await response.text()
      const payload = JSON.parse(text)
      if (text !== canonicalJson(payload)) throw new KnowledgeCompatibilityError('biochemical-db snapshot response is not RFC 8785 canonical JSON')
      return { payload, headers: response.headers }
    } catch (error) {
      const name = error && typeof error === 'object' && 'name' in error ? error.name : undefined
      if (name === 'TimeoutError' || name === 'AbortError') throw new KnowledgeCompatibilityError(`biochemical-db timed out after ${timeoutMs} ms for ${path}`)
      throw error
    }
  }

  async function verifiedRelease(signal) {
    const payload = await fetchJson('/api/v1/releases', signal)
    const parsed = BiochemicalDbCatalogSchema.safeParse(payload)
    if (!parsed.success) throw new KnowledgeCompatibilityError('biochemical-db release schema is incompatible with 1.0.0')
    const entry = parsed.data.releases.find((candidate) => candidate.release_id === releaseId)
    if (!entry) throw new KnowledgeCompatibilityError(`Configured release ${releaseId} was not returned by biochemical-db`)
    if (entry.release_digest !== expectedDigest) throw new KnowledgeCompatibilityError(`Digest mismatch for ${releaseId}`)
    return adaptCatalogEntry(entry)
  }

  async function verifiedAtlasRelease(signal) {
    const payload = await fetchJson('/api/v2/releases', signal)
    const parsed = BiochemicalDbAtlasCatalogSchema.safeParse(payload)
    if (!parsed.success) throw new KnowledgeCompatibilityError('biochemical-db atlas catalog schema is incompatible with 2.0.0')
    const entry = parsed.data.releases.find((candidate) => candidate.release_id === atlasReleaseId)
    if (!entry) throw new KnowledgeCompatibilityError(`Configured atlas release ${atlasReleaseId} was not returned by biochemical-db`)
    if (entry.release_digest !== atlasExpectedDigest) throw new KnowledgeCompatibilityError(`Digest mismatch for atlas release ${atlasReleaseId}`)
    return adaptAtlasCatalogEntry(entry)
  }

  function verifyAtlasEnvelope(envelope, requestedReleaseId, description) {
    if (envelope.id !== requestedReleaseId || envelope.digest !== atlasExpectedDigest) {
      throw new KnowledgeCompatibilityError(`biochemical-db atlas ${description} does not match the pinned release and digest`)
    }
  }

  function atlasQuery(filters) {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
    }
    const encoded = query.toString()
    return encoded ? `?${encoded}` : ''
  }

  async function fetchAtlas(requestedReleaseId, suffix, schema, description) {
    if (requestedReleaseId !== atlasReleaseId) throw new KnowledgeCompatibilityError(`Only pinned atlas release ${atlasReleaseId} is available`)
    await verifiedAtlasRelease()
    const payload = await fetchJson(`/api/v2/releases/${encodeURIComponent(requestedReleaseId)}${suffix}`)
    const parsed = schema.safeParse(payload)
    if (!parsed.success) throw new KnowledgeCompatibilityError(`biochemical-db atlas ${description} schema is incompatible with 2.0.0`)
    verifyAtlasEnvelope(parsed.data.release, requestedReleaseId, description)
    return parsed.data
  }

  return {
    async releases(signal) { return [await verifiedRelease(signal)] },
    async snapshot(taxonId) {
      const release = await verifiedRelease()
      const upstreamTaxonId = canonicalTaxonId(taxonId)
      const path = `/api/v1/releases/${encodeURIComponent(releaseId)}/snapshots/network?taxon_id=${encodeURIComponent(upstreamTaxonId)}`
      const { payload, headers } = await fetchCanonicalJson(path)
      let snapshot
      try {
        snapshot = verifyKnowledgeSnapshot(payload, { expectedReleaseId: releaseId, expectedReleaseDigest: release.digest.slice('sha256:'.length), expectedTaxonId: upstreamTaxonId })
      } catch (error) {
        throw new KnowledgeCompatibilityError(error instanceof Error ? error.message : 'biochemical-db knowledge snapshot is invalid')
      }
      if (headers.get('x-snapshot-digest') !== snapshot.snapshot_digest || headers.get('x-release-digest') !== snapshot.release.digest) throw new KnowledgeCompatibilityError('biochemical-db snapshot headers do not match the verified body')
      return snapshot
    },
    async provenance(requestedReleaseId) {
      if (requestedReleaseId !== releaseId) throw new KnowledgeCompatibilityError(`Only pinned release ${releaseId} is available`)
      await verifiedRelease()
      const payload = await fetchJson(`/api/v1/releases/${encodeURIComponent(requestedReleaseId)}/provenance`)
      const parsed = BiochemicalDbProvenanceSchema.safeParse(payload)
      if (!parsed.success) throw new KnowledgeCompatibilityError('biochemical-db provenance schema is incompatible with 1.0.0')
      const { release, provenance } = parsed.data
      if (
        release.id !== requestedReleaseId ||
        provenance.release_id !== requestedReleaseId ||
        release.digest !== expectedDigest ||
        provenance.release_digest !== expectedDigest
      ) {
        throw new KnowledgeCompatibilityError('biochemical-db provenance does not match the pinned release and digest')
      }
      return adaptProvenance(parsed.data)
    },
    async network(requestedReleaseId, taxonId) {
      if (requestedReleaseId !== releaseId) throw new KnowledgeCompatibilityError(`Only pinned release ${releaseId} is available`)
      await verifiedRelease()
      const upstreamTaxonId = canonicalTaxonId(taxonId)
      const payload = await fetchJson(`/api/v1/releases/${encodeURIComponent(requestedReleaseId)}/network?taxon_id=${encodeURIComponent(upstreamTaxonId)}`)
      const parsed = BiochemicalDbNetworkSchema.safeParse(payload)
      if (!parsed.success) throw new KnowledgeCompatibilityError('biochemical-db network schema is incompatible with 1.0.0')
      if (parsed.data.release.id !== requestedReleaseId || parsed.data.release.digest !== expectedDigest || parsed.data.taxon.id !== upstreamTaxonId) {
        throw new KnowledgeCompatibilityError('biochemical-db network does not match the pinned release and taxon')
      }
      return adaptNetwork(parsed.data)
    },
    async atlasReleases(signal) { return [await verifiedAtlasRelease(signal)] },
    async atlasRelease(requestedReleaseId) {
      const release = await verifiedAtlasRelease()
      if (requestedReleaseId !== atlasReleaseId) throw new KnowledgeCompatibilityError(`Only pinned atlas release ${atlasReleaseId} is available`)
      const payload = await fetchJson(`/api/v2/releases/${encodeURIComponent(requestedReleaseId)}`)
      const parsed = BiochemicalDbAtlasReleaseDetailSchema.safeParse(payload)
      if (!parsed.success) throw new KnowledgeCompatibilityError('biochemical-db atlas release detail schema is incompatible with 2.0.0')
      verifyAtlasEnvelope(parsed.data.release, requestedReleaseId, 'release detail')
      if (parsed.data.manifest.release_id !== requestedReleaseId || parsed.data.manifest.release_digest !== atlasExpectedDigest) {
        throw new KnowledgeCompatibilityError('biochemical-db atlas manifest does not match the pinned release and digest')
      }
      return adaptAtlasReleaseDetail(parsed.data, release)
    },
    async atlasEntity(requestedReleaseId, entityId, taxonId) {
      const query = atlasQuery({ taxon_id: taxonId === undefined ? undefined : canonicalAtlasTaxonId(taxonId) })
      const payload = await fetchAtlas(requestedReleaseId, `/entities/${encodeURIComponent(entityId)}${query}`, BiochemicalDbAtlasEntityResponseSchema, 'entity')
      return adaptAtlasEntityResponse(payload)
    },
    async atlasSubgraph(requestedReleaseId, rootId, taxonId, maxDepth, maxNodes) {
      const query = atlasQuery({ root_id: rootId, taxon_id: canonicalAtlasTaxonId(taxonId), max_depth: maxDepth, max_nodes: maxNodes })
      const payload = await fetchAtlas(requestedReleaseId, `/subgraph${query}`, BiochemicalDbAtlasSubgraphSchema, 'subgraph')
      if (payload.root_id !== rootId || payload.taxon_id !== canonicalAtlasTaxonId(taxonId)) {
        throw new KnowledgeCompatibilityError('biochemical-db atlas subgraph does not match the requested root and taxon')
      }
      return adaptAtlasSubgraph(payload)
    },
    async atlasClaims(requestedReleaseId, filters = {}) {
      const query = atlasQuery({
        subject_id: filters.subjectId,
        object_id: filters.objectId,
        relation: filters.relation,
        taxon_id: filters.taxonId === undefined ? undefined : canonicalAtlasTaxonId(filters.taxonId),
        tissue_id: filters.tissueId,
        derivation: filters.derivation,
        polarity: filters.polarity
      })
      const payload = await fetchAtlas(requestedReleaseId, `/claims${query}`, BiochemicalDbAtlasClaimsResponseSchema, 'claims')
      return adaptAtlasClaimsResponse(payload)
    },
    async atlasCoverage(requestedReleaseId, filters = {}) {
      const query = atlasQuery({
        taxon_id: filters.taxonId === undefined ? undefined : canonicalAtlasTaxonId(filters.taxonId),
        tissue_id: filters.tissueId,
        entity_type: filters.entityType,
        evidence_class: filters.evidenceClass
      })
      const payload = await fetchAtlas(requestedReleaseId, `/coverage${query}`, BiochemicalDbAtlasCoverageResponseSchema, 'coverage')
      return adaptAtlasCoverageResponse(payload)
    },
    async atlasNetwork(requestedReleaseId, taxonId, tissueId) {
      const query = atlasQuery({ taxon_id: canonicalAtlasTaxonId(taxonId), tissue_id: tissueId })
      const payload = await fetchAtlas(requestedReleaseId, `/network${query}`, BiochemicalDbAtlasNetworkSchema, 'network')
      if (payload.taxon_id !== canonicalAtlasTaxonId(taxonId)) throw new KnowledgeCompatibilityError('biochemical-db atlas network does not match the requested taxon')
      return adaptAtlasNetwork(payload)
    }
  }
}
