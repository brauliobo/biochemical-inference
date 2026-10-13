import { rm } from 'node:fs/promises'
import { canonicalJson } from '../../shared/canonical-json.js'
import {
  MEASURED_SPATIAL_ARRAY_PINS,
  MEASURED_SPATIAL_PINS,
  MEASURED_SPATIAL_RECORD_TYPES,
  MeasuredSpatialBundleSchema,
  MeasuredSpatialChunkSchema
} from '../../shared/measured-spatial-contracts.js'
import { createDataPlaneObjectStore } from '../data-plane/object-store.js'
import { isoNow, isoSeconds as exactTimestamp } from '../commons/clock.js'
import { defineRequestError } from '../commons/errors.js'
import { transaction } from '../commons/sqlite.js'
import { selectStorageRoot, testRootParent } from '../commons/storage.js'
import { createMeasuredSpatialClient, encodeMeasuredSpatialBundle } from './client.js'
import { openMeasuredSpatialDatabase } from './database.js'
import { MeasuredSpatialVerificationError, verifyMeasuredSpatialBundle, verifyMeasuredSpatialChunkBytes } from './verification.js'

export const MeasuredSpatialRequestError = defineRequestError('MeasuredSpatialRequestError', 422)

function selectRoot(options, env) {
  return selectStorageRoot({
    configured: options.root ?? env.BIOCHEMICAL_MEASURED_SPATIAL_ROOT,
    test: env.NODE_ENV === 'test' ? { parent: testRootParent(env.BIOCHEMICAL_TEST_MEASURED_SPATIAL_ROOT), prefix: 'goal14-' } : null,
    defaultName: 'goal14-measured-spatial-v1',
    secure: true,
    inSourceError: () => new MeasuredSpatialRequestError('MEASURED_SPATIAL_ROOT_IN_SOURCE', 'Goal 14 storage root must be outside the source tree.', 500)
  })
}

function parseStoredBundle(value) {
  const text = Buffer.from(value).toString('utf8')
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new MeasuredSpatialVerificationError('Stored Goal 14 release snapshot is not JSON.')
  }
  if (canonicalJson(parsed) !== text) throw new MeasuredSpatialVerificationError('Stored Goal 14 release snapshot is not canonical JSON.')
  return verifyMeasuredSpatialBundle(MeasuredSpatialBundleSchema.parse(parsed))
}

function semanticRecords(metadata) {
  return Object.freeze({
    acquisitions: [metadata.acquisition],
    spaces: metadata.spaces,
    arrays: metadata.arrays,
    labels: metadata.labels.map((item) => ({ id: `label:${item.value}`, ...item })),
    registrations: metadata.registrations,
    limitations: metadata.limitations.map((statement, index) => ({ id: `limitation:${index}`, statement })),
    attribution: [{ id: 'attribution:digimouse', ...metadata.attribution }]
  })
}

export async function createMeasuredSpatialService(options = {}) {
  const env          = options.env ?? process.env
  const selectedRoot = await selectRoot(options, env)
  const database     = openMeasuredSpatialDatabase(selectedRoot.root)
  const objects      = await createDataPlaneObjectStore(selectedRoot.root, options.objectHooks)
  const client       = options.client ?? createMeasuredSpatialClient(env, options.clientOptions)
  const now          = options.now ?? isoNow
  let bundle         = null
  let records        = null
  let chunks         = null
  let state          = 'empty'
  let integrityState = 'empty'
  let lastError      = null
  let closed         = false
  let storageTail    = Promise.resolve()

  function withStorage(action) {
    const result = storageTail.then(action, action)
    storageTail = result.catch(() => {})
    return result
  }

  function indexBundle(value) {
    bundle  = verifyMeasuredSpatialBundle(value)
    records = semanticRecords(bundle.metadata)
    chunks  = new Map(bundle.inventory.chunks.map((item) => [`${item.array_id}:${item.level}:${item.grid_zyx.join('.')}`, item]))
  }

  function requireReady() {
    if (closed) throw new MeasuredSpatialRequestError('MEASURED_SPATIAL_CLOSED', 'Goal 14 measured-spatial service is closed.', 503)
    if (state !== 'ready' || integrityState !== 'valid' || !bundle) throw new MeasuredSpatialRequestError('MEASURED_SPATIAL_NOT_READY', 'The pinned Goal 14 measured atlas is not synchronized and verified.', 409)
  }

  function completionRow() {
    const row = database.prepare('SELECT * FROM offline_completion WHERE singleton=1').get()
    if (!row) return null
    if (row.release_id !== MEASURED_SPATIAL_PINS.releaseId || row.release_digest !== MEASURED_SPATIAL_PINS.releaseDigest || row.inventory_digest !== MEASURED_SPATIAL_PINS.inventoryDigest || row.verified_chunks !== MEASURED_SPATIAL_PINS.chunkCount || row.encoded_bytes !== MEASURED_SPATIAL_PINS.encodedChunkBytes) throw new MeasuredSpatialVerificationError('Stored Goal 14 offline-completion proof does not bind the pinned release inventory.')
    return row
  }

  async function loadSnapshot() {
    const row = database.prepare('SELECT * FROM snapshot WHERE singleton=1').get()
    if (!row) return false
    if (row.release_id !== MEASURED_SPATIAL_PINS.releaseId || row.release_digest !== MEASURED_SPATIAL_PINS.releaseDigest || row.trust_digest !== MEASURED_SPATIAL_PINS.trustDigest || row.catalog_digest !== MEASURED_SPATIAL_PINS.catalogDigest || row.manifest_digest !== MEASURED_SPATIAL_PINS.manifestDigest || row.envelope_digest !== MEASURED_SPATIAL_PINS.envelopeDigest || row.metadata_digest !== MEASURED_SPATIAL_PINS.metadataDigest || row.inventory_digest !== MEASURED_SPATIAL_PINS.inventoryDigest) throw new MeasuredSpatialVerificationError('Stored Goal 14 snapshot pins are invalid.')
    indexBundle(parseStoredBundle(await objects.get(row.bundle_digest, row.bundle_bytes)))
    completionRow()
    return true
  }

  async function cachedChunk(descriptor, { decode = true } = {}) {
    const encoded = await objects.get(descriptor.encoded_sha256, descriptor.encoded_bytes)
    if (decode) verifyMeasuredSpatialChunkBytes(encoded, descriptor)
    return encoded
  }

  async function cacheSummary({ decode = false, stopAfterFindings = false, signal } = {}) {
    signal?.throwIfAborted()
    if (!bundle) return { cached: 0, encoded: 0, decoded: 0, findings: [] }
    let cached = 0
    let encoded = 0
    let decoded = 0
    const findings = []
    for (const descriptor of bundle.inventory.chunks) {
      signal?.throwIfAborted()
      try {
        await cachedChunk(descriptor, { decode })
        signal?.throwIfAborted()
        cached += 1
        encoded += 1
        if (decode) decoded += 1
      } catch (error) {
        if (error?.code === 'ENOENT') continue
        findings.push(`${descriptor.path}: cached bytes failed verification.`)
        if (stopAfterFindings || findings.length >= 20) break
      }
    }
    return { cached, encoded, decoded, findings }
  }

  async function obtainChunk(descriptor, signal) {
    try {
      return { bytes: await cachedChunk(descriptor), source: 'local' }
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
    const upstream = await client.chunk(descriptor, signal)
    verifyMeasuredSpatialChunkBytes(upstream, descriptor)
    const stored = await objects.put(upstream)
    if (stored.digest !== descriptor.encoded_sha256 || stored.bytes !== descriptor.encoded_bytes) throw new MeasuredSpatialVerificationError(`${descriptor.path}: local cache publication changed the verified chunk identity.`)
    return { bytes: await cachedChunk(descriptor), source: 'upstream' }
  }

  try {
    if (await loadSnapshot()) {
      state = 'ready'
      integrityState = 'valid'
    }
  } catch (error) {
    state = 'failed'
    integrityState = 'failed'
    lastError = error instanceof Error ? error.message : String(error)
  }

  return {
    async discovery() {
      return {
        contractVersion: '1.0.0',
        mode: 'bounded-measured-atlas-consumer',
        pins: MEASURED_SPATIAL_PINS,
        arrays: MEASURED_SPATIAL_ARRAY_PINS,
        status: await this.status(),
        registration: 'unavailable',
        webglRequired: false,
        goal14Complete: false,
        routes: {
          status: '/api/v12/measured-spatial/status',
          sync: '/api/v12/measured-spatial/sync',
          records: '/api/v12/measured-spatial/records/{recordType}',
          inventory: '/api/v12/measured-spatial/chunks',
          chunk: '/api/v12/measured-spatial/chunks/{arrayId}/{level}/{z}/{y}/{x}',
          offlineCompletion: '/api/v12/measured-spatial/offline-completion',
          integrity: '/api/v12/measured-spatial/integrity'
        }
      }
    },
    async status() {
      if (!bundle) return { state, integrity: integrityState, releaseId: null, cachedChunks: 0, totalChunks: MEASURED_SPATIAL_PINS.chunkCount, offlineComplete: false, lastError: lastError ? 'Goal 14 local verification failed.' : null }
      const summary = await cacheSummary({ stopAfterFindings: true })
      if (summary.findings.length) {
        state = 'failed'
        integrityState = 'failed'
        lastError = summary.findings[0]
      }
      const completed = completionRow()
      return {
        state,
        integrity: integrityState,
        releaseId: bundle.manifest.release_id,
        cachedChunks: summary.cached,
        totalChunks: MEASURED_SPATIAL_PINS.chunkCount,
        offlineComplete: Boolean(completed) && summary.cached === MEASURED_SPATIAL_PINS.chunkCount && summary.findings.length === 0,
        lastError: lastError ? 'Goal 14 local verification failed.' : null
      }
    },
    sync(signal) {
      return withStorage(async () => {
        if (state === 'ready') return this.status()
        if (database.prepare('SELECT COUNT(*) AS count FROM snapshot').get().count !== 0) throw new MeasuredSpatialVerificationError('Existing Goal 14 snapshot failed integrity and cannot be overwritten by synchronization.')
        try {
          const synchronized = verifyMeasuredSpatialBundle(await client.synchronize(signal))
          const encoded      = encodeMeasuredSpatialBundle(synchronized)
          const stored       = await objects.put(encoded)
          transaction(database, () => database.prepare('INSERT INTO snapshot VALUES (1,?,?,?,?,?,?,?,?,?,?,?)').run(
            MEASURED_SPATIAL_PINS.releaseId,
            MEASURED_SPATIAL_PINS.releaseDigest,
            MEASURED_SPATIAL_PINS.trustDigest,
            MEASURED_SPATIAL_PINS.catalogDigest,
            MEASURED_SPATIAL_PINS.manifestDigest,
            MEASURED_SPATIAL_PINS.envelopeDigest,
            MEASURED_SPATIAL_PINS.metadataDigest,
            MEASURED_SPATIAL_PINS.inventoryDigest,
            stored.digest,
            stored.bytes,
            exactTimestamp(now)
          ))
          indexBundle(synchronized)
          state = 'ready'
          integrityState = 'valid'
          lastError = null
          return this.status()
        } catch (error) {
          state = 'failed'
          integrityState = 'failed'
          lastError = error instanceof Error ? error.message : String(error)
          throw error
        }
      })
    },
    recordPage(recordType) {
      requireReady()
      if (!MEASURED_SPATIAL_RECORD_TYPES.includes(recordType)) throw new MeasuredSpatialRequestError('MEASURED_SPATIAL_RECORD_TYPE_INVALID', 'Goal 14 semantic record type is unavailable.', 404)
      return { releaseId: MEASURED_SPATIAL_PINS.releaseId, releaseDigest: MEASURED_SPATIAL_PINS.releaseDigest, recordType, items: structuredClone(records[recordType]) }
    },
    chunkInventory({ arrayId = null, level = null, offset = 0, limit = 100 } = {}) {
      requireReady()
      const filtered = bundle.inventory.chunks.filter((item) => (arrayId === null || item.array_id === arrayId) && (level === null || item.level === level))
      return {
        releaseId: MEASURED_SPATIAL_PINS.releaseId,
        releaseDigest: MEASURED_SPATIAL_PINS.releaseDigest,
        arrayId,
        level,
        offset,
        limit,
        total: filtered.length,
        items: structuredClone(filtered.slice(offset, offset + limit))
      }
    },
    async chunk(arrayId, level, gridZyx, signal) {
      requireReady()
      const descriptor = chunks.get(`${arrayId}:${level}:${gridZyx.join('.')}`)
      if (!descriptor) throw new MeasuredSpatialRequestError('MEASURED_SPATIAL_CHUNK_NOT_OWNED', 'The requested chunk coordinate is not owned by the pinned release manifest.', 404)
      const selected = await obtainChunk(MeasuredSpatialChunkSchema.parse(descriptor), signal)
      return { descriptor: structuredClone(descriptor), bytes: selected.bytes, source: selected.source }
    },
    completeOffline(signal) {
      return withStorage(async () => {
        requireReady()
        const descriptors = bundle.inventory.chunks
        let cursor = 0
        const workers = Array.from({ length: 4 }, async () => {
          while (cursor < descriptors.length) {
            const descriptor = descriptors[cursor]
            cursor += 1
            await obtainChunk(descriptor, signal)
          }
        })
        await Promise.all(workers)
        const verification = await cacheSummary({ decode: true })
        if (verification.cached !== MEASURED_SPATIAL_PINS.chunkCount || verification.encoded !== MEASURED_SPATIAL_PINS.chunkCount || verification.decoded !== MEASURED_SPATIAL_PINS.chunkCount || verification.findings.length) throw new MeasuredSpatialVerificationError('Goal 14 offline completion did not verify all 400 encoded and decoded chunks.')
        let completed = completionRow()
        if (!completed) {
          transaction(database, () => database.prepare('INSERT INTO offline_completion VALUES (1,?,?,?,?,?,?)').run(
            MEASURED_SPATIAL_PINS.releaseId,
            MEASURED_SPATIAL_PINS.releaseDigest,
            MEASURED_SPATIAL_PINS.inventoryDigest,
            MEASURED_SPATIAL_PINS.chunkCount,
            MEASURED_SPATIAL_PINS.encodedChunkBytes,
            exactTimestamp(now)
          ))
          completed = completionRow()
        }
        return {
          releaseId: MEASURED_SPATIAL_PINS.releaseId,
          releaseDigest: MEASURED_SPATIAL_PINS.releaseDigest,
          verifiedChunks: MEASURED_SPATIAL_PINS.chunkCount,
          encodedBytes: MEASURED_SPATIAL_PINS.encodedChunkBytes,
          encodedAndDecodedVerified: true,
          networkAccessRequiredForReplay: false,
          completedAt: completed.completed_at
        }
      })
    },
    async integrity(signal) {
      signal?.throwIfAborted()
      if (!bundle) return { status: state === 'failed' ? 'failed' : 'empty', releaseId: null, metadataVerified: false, cachedChunks: 0, verifiedEncodedChunks: 0, verifiedDecodedChunks: 0, offlineComplete: false, networkAccess: false, findings: lastError ? ['Stored Goal 14 metadata failed verification.'] : [] }
      const verification = await cacheSummary({ decode: true, signal })
      signal?.throwIfAborted()
      const failed       = verification.findings.length > 0
      if (failed) {
        state = 'failed'
        integrityState = 'failed'
        lastError = verification.findings[0]
      }
      const completed = completionRow()
      return {
        status: failed ? 'failed' : 'valid',
        releaseId: MEASURED_SPATIAL_PINS.releaseId,
        metadataVerified: true,
        cachedChunks: verification.cached,
        verifiedEncodedChunks: verification.encoded,
        verifiedDecodedChunks: verification.decoded,
        offlineComplete: !failed && Boolean(completed) && verification.cached === MEASURED_SPATIAL_PINS.chunkCount,
        networkAccess: false,
        findings: failed ? verification.findings : verification.cached === MEASURED_SPATIAL_PINS.chunkCount ? [] : [`${MEASURED_SPATIAL_PINS.chunkCount - verification.cached} manifest-owned chunks are not cached.`]
      }
    },
    async close() {
      if (closed) return
      closed = true
      await storageTail.catch(() => {})
      await objects.close()
      database.close()
      if (selectedRoot.ephemeral) await rm(selectedRoot.root, { recursive: true, force: true })
    },
    root: selectedRoot.root
  }
}
