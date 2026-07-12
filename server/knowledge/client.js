import {
  adaptCatalogEntry,
  adaptNetwork,
  BiochemicalDbCatalogSchema,
  BiochemicalDbNetworkSchema,
  canonicalTaxonId
} from './biochemical-db.js'
import { BUNDLED_RELEASE, bundledNetwork } from './fixture.js'

export const DEFAULT_BIOCHEMICAL_DB_URL = 'http://127.0.0.1:8000'
export const DEFAULT_RELEASE_ID = 'one-carbon-human-mouse-v1.0.0'
export const DEFAULT_RELEASE_DIGEST = 'b72d00c072551a6babd348cf88302788e9a7b547cca17f9fb834e7e0cddbeef1'

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
      }
    }
  }

  const baseUrl = (env.BIOCHEMICAL_DB_URL ?? DEFAULT_BIOCHEMICAL_DB_URL).replace(/\/$/, '')
  const releaseId = env.BIOCHEMICAL_DB_RELEASE_ID ?? DEFAULT_RELEASE_ID
  const expectedDigest = env.BIOCHEMICAL_DB_EXPECTED_DIGEST ?? DEFAULT_RELEASE_DIGEST
  const timeoutMs = Number(env.BIOCHEMICAL_DB_TIMEOUT_MS ?? 5000)
  if (!/^[a-f0-9]{64}$/.test(expectedDigest)) throw new KnowledgeCompatibilityError('BIOCHEMICAL_DB_EXPECTED_DIGEST must be a lowercase SHA-256 digest without a prefix')
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new KnowledgeCompatibilityError('BIOCHEMICAL_DB_TIMEOUT_MS must be a positive number')

  async function fetchJson(path) {
    try {
      const response = await fetch(`${baseUrl}${path}`, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(timeoutMs) })
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

  async function verifiedRelease() {
    const payload = await fetchJson('/api/v1/releases')
    const parsed = BiochemicalDbCatalogSchema.safeParse(payload)
    if (!parsed.success) throw new KnowledgeCompatibilityError('biochemical-db release schema is incompatible with 1.0.0')
    const entry = parsed.data.releases.find((candidate) => candidate.release_id === releaseId)
    if (!entry) throw new KnowledgeCompatibilityError(`Configured release ${releaseId} was not returned by biochemical-db`)
    if (entry.release_digest !== expectedDigest) throw new KnowledgeCompatibilityError(`Digest mismatch for ${releaseId}`)
    return adaptCatalogEntry(entry)
  }

  return {
    async releases() { return [await verifiedRelease()] },
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
    }
  }
}
