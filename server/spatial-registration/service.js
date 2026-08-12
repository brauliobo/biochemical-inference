import { homedir } from 'node:os'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { mkdtemp, realpath, rm } from 'node:fs/promises'
import { canonicalJson } from '../../shared/canonical-json.js'
import { SPATIAL_REGISTRATION_PINS, SPATIAL_REGISTRATION_RECORD_TYPES, SpatialRegistrationBundleSchema } from '../../shared/spatial-registration-contracts.js'
import { createDataPlaneObjectStore } from '../data-plane/object-store.js'
import { assertNoSymlinkAncestors, ensurePrivateDirectory } from '../data-plane/safe-path.js'
import { createSpatialRegistrationClient, encodeSpatialRegistrationBundle } from './client.js'
import { openSpatialRegistrationDatabase } from './database.js'
import { applyAffine, selectRegistrationChain } from './transform.js'
import { recomputeSpatialRegistrationResidualOverlap, spatialRegistrationDigest, SpatialRegistrationVerificationError, verifySpatialRegistrationBundle, verifySpatialRegistrationChunkBytes } from './verification.js'

export class SpatialRegistrationRequestError extends Error {
  constructor(code, message, statusCode = 422) { super(message); this.name = 'SpatialRegistrationRequestError'; this.code = code; this.statusCode = statusCode }
}

function inside(parent, child) {
  const path = relative(parent, child)
  return path === '' || (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path))
}

async function selectRoot(options, env) {
  const configured = options.root ?? env.BIOCHEMICAL_SPATIAL_REGISTRATION_ROOT
  if (!configured && env.NODE_ENV === 'test') {
    const parent = resolve(env.BIOCHEMICAL_TEST_SPATIAL_REGISTRATION_ROOT ?? resolve(process.cwd(), '..', '.biochemical-inference-test-workspaces'))
    await assertNoSymlinkAncestors(parent); await ensurePrivateDirectory(parent)
    const root = await mkdtemp(resolve(parent, 'goal14-registration-')); await ensurePrivateDirectory(root)
    return { root, ephemeral: true }
  }
  const root = resolve(configured ?? resolve(homedir(), '.local', 'share', 'biochemical-inference', 'goal14-spatial-registration-v1-1'))
  if (inside(resolve(process.cwd()), root)) throw new SpatialRegistrationRequestError('SPATIAL_REGISTRATION_ROOT_IN_SOURCE', 'Goal 14 registration storage root must be outside the source tree.', 500)
  await assertNoSymlinkAncestors(root); await ensurePrivateDirectory(root)
  const [sourceReal, rootReal] = await Promise.all([realpath(process.cwd()), realpath(root)])
  if (inside(sourceReal, rootReal)) throw new SpatialRegistrationRequestError('SPATIAL_REGISTRATION_ROOT_IN_SOURCE', 'Goal 14 registration storage root must be outside the source tree.', 500)
  return { root: rootReal, ephemeral: false }
}

function transaction(database, action) {
  database.exec('BEGIN IMMEDIATE')
  try { const result = action(); database.exec('COMMIT'); return result } catch (error) { database.exec('ROLLBACK'); throw error }
}

function exactTimestamp(now) { return new Date(now()).toISOString().replace(/\.\d{3}Z$/, 'Z') }

function records(metadata) {
  return Object.freeze({
    datasets: [{ id: metadata.dataset.id, ...metadata.dataset }], acquisitions: [{ id: `acquisition:${metadata.release_id}`, ...metadata.dataset.acquisition }], spaces: metadata.spaces, arrays: metadata.arrays, registrations: [metadata.registration], 'residual-overlap': metadata.registration.residual_overlap_metrics.map((item) => ({ id: `residual-overlap:${item.label}`, ...item })), limitations: metadata.limitations.map((statement, index) => ({ id: `limitation:${index}`, statement })), attribution: [{ id: 'attribution:learn2reg-abdomen-mrct-0001', ...metadata.attribution }]
  })
}

function parseStoredBundle(value, now) {
  const text = Buffer.from(value).toString('utf8')
  let parsed
  try { parsed = JSON.parse(text) } catch { throw new SpatialRegistrationVerificationError('Stored Goal 14 registration snapshot is not JSON.') }
  if (canonicalJson(parsed) !== text) throw new SpatialRegistrationVerificationError('Stored Goal 14 registration snapshot is not canonical JSON.')
  return verifySpatialRegistrationBundle(SpatialRegistrationBundleSchema.parse(parsed), now)
}

export async function createSpatialRegistrationService(options = {}) {
  const env = options.env ?? process.env
  const selectedRoot = await selectRoot(options, env)
  const database = openSpatialRegistrationDatabase(selectedRoot.root)
  const objects = await createDataPlaneObjectStore(selectedRoot.root, options.objectHooks)
  const now = options.now ?? (() => new Date().toISOString())
  const client = options.client ?? createSpatialRegistrationClient(env, { ...options.clientOptions, now })
  let bundle = null
  let semantic = null
  let chunks = null
  let state = 'empty'
  let integrityState = 'empty'
  let lastError = null
  let closed = false
  let storageTail = Promise.resolve()

  function withStorage(action) { const result = storageTail.then(action, action); storageTail = result.catch(() => {}); return result }
  function indexBundle(value) { bundle = verifySpatialRegistrationBundle(value, now); semantic = records(bundle.metadata); chunks = new Map(bundle.inventory.chunks.map((item) => [`${item.array_id}:${item.grid_zyx.join('.')}`, item])) }
  function requireReady() { if (closed) throw new SpatialRegistrationRequestError('SPATIAL_REGISTRATION_CLOSED', 'Goal 14 registration service is closed.', 503); if (!bundle || state !== 'ready' || integrityState !== 'valid') throw new SpatialRegistrationRequestError('SPATIAL_REGISTRATION_NOT_READY', 'The pinned Goal 14 registration release is not synchronized and verified.', 409) }
  function residualOverlapRow() {
    const row = database.prepare('SELECT * FROM residual_overlap_recomputation WHERE singleton=1').get()
    if (!row) return null
    const expected = spatialRegistrationDigest(bundle.metadata.registration.residual_overlap_metrics)
    if (row.release_id !== SPATIAL_REGISTRATION_PINS.releaseId || row.inventory_digest !== SPATIAL_REGISTRATION_PINS.inventoryDigest || row.metrics_digest !== expected || row.verified_evidence_chunks !== 288) throw new SpatialRegistrationVerificationError('Stored Goal 14 registration residual-overlap proof is invalid.')
    return row
  }
  function completionRow() {
    const row = database.prepare('SELECT * FROM offline_completion WHERE singleton=1').get()
    if (!row) return null
    if (row.release_id !== SPATIAL_REGISTRATION_PINS.releaseId || row.inventory_digest !== SPATIAL_REGISTRATION_PINS.inventoryDigest || row.verified_chunks !== 304 || row.encoded_bytes !== 508_201) throw new SpatialRegistrationVerificationError('Stored Goal 14 registration offline proof is invalid.')
    return row
  }
  async function cachedChunk(descriptor, decode = true) {
    const encoded = await objects.get(descriptor.encoded_sha256, descriptor.encoded_bytes)
    return decode ? verifySpatialRegistrationChunkBytes(encoded, descriptor) : { encoded }
  }
  async function obtainChunk(descriptor, signal) {
    try { return { ...await cachedChunk(descriptor), source: 'local' } } catch (error) { if (error?.code !== 'ENOENT') throw error }
    const upstream = await client.chunk(descriptor, signal)
    verifySpatialRegistrationChunkBytes(upstream, descriptor)
    const stored = await objects.put(upstream)
    if (stored.digest !== descriptor.encoded_sha256 || stored.bytes !== descriptor.encoded_bytes) throw new SpatialRegistrationVerificationError(`${descriptor.path}: cache publication changed chunk identity.`)
    return { ...await cachedChunk(descriptor), source: 'upstream' }
  }
  async function cacheSummary(decode = false, signal) {
    signal?.throwIfAborted()
    if (!bundle) return { cached: 0, encoded: 0, decoded: 0, findings: [] }
    let cached = 0; let encoded = 0; let decoded = 0
    const findings = []
    for (const descriptor of bundle.inventory.chunks) {
      signal?.throwIfAborted()
      try { await cachedChunk(descriptor, decode); signal?.throwIfAborted(); cached += 1; encoded += 1; if (decode) decoded += 1 } catch (error) { if (signal?.aborted) throw signal.reason; if (error?.code !== 'ENOENT') findings.push(`${descriptor.path}: cached bytes failed verification.`); if (findings.length >= 20) break }
    }
    return { cached, encoded, decoded, findings }
  }
  async function loadSnapshot() {
    const row = database.prepare('SELECT * FROM snapshot WHERE singleton=1').get()
    if (!row) return false
    if (row.release_id !== SPATIAL_REGISTRATION_PINS.releaseId || row.release_digest !== SPATIAL_REGISTRATION_PINS.releaseDigest || row.trust_digest !== SPATIAL_REGISTRATION_PINS.trustDigest || row.catalog_digest !== SPATIAL_REGISTRATION_PINS.catalogDigest || row.manifest_digest !== SPATIAL_REGISTRATION_PINS.manifestDigest || row.envelope_digest !== SPATIAL_REGISTRATION_PINS.envelopeDigest || row.metadata_digest !== SPATIAL_REGISTRATION_PINS.metadataDigest || row.inventory_digest !== SPATIAL_REGISTRATION_PINS.inventoryDigest) throw new SpatialRegistrationVerificationError('Stored Goal 14 registration snapshot pins are invalid.')
    indexBundle(parseStoredBundle(await objects.get(row.bundle_digest, row.bundle_bytes), now))
    residualOverlapRow(); completionRow()
    return true
  }
  async function recomputeResidualOverlapNow(signal) {
    requireReady()
    const metrics = await recomputeSpatialRegistrationResidualOverlap(bundle, async (descriptor) => (await obtainChunk(descriptor, signal)).decoded)
    const digest = spatialRegistrationDigest(metrics)
    let row = residualOverlapRow()
    if (!row) { transaction(database, () => database.prepare('INSERT INTO residual_overlap_recomputation VALUES (1,?,?,?,?,?)').run(SPATIAL_REGISTRATION_PINS.releaseId, SPATIAL_REGISTRATION_PINS.inventoryDigest, digest, 288, exactTimestamp(now))); row = residualOverlapRow() }
    return { releaseId: SPATIAL_REGISTRATION_PINS.releaseId, evidence: 'recomputed residual overlap from verified source label and repository-derived evaluation ROI chunks', recomputed: true, metrics, cachedEvidenceChunks: 288 }
  }
  try { if (await loadSnapshot()) { state = 'ready'; integrityState = 'valid' } } catch (error) { state = 'failed'; integrityState = 'failed'; lastError = error instanceof Error ? error.message : String(error) }

  return {
    async discovery() { return { contractVersion: '1.1.0', mode: 'independently-pinned-source-prealigned-registration', pins: SPATIAL_REGISTRATION_PINS, status: await this.status(), goal14Complete: false, diagnosticUse: false, routes: { status: '/api/v14/spatial-registration/status', sync: '/api/v14/spatial-registration/sync', records: '/api/v14/spatial-registration/records/{recordType}', chunks: '/api/v14/spatial-registration/chunks', chunk: '/api/v14/spatial-registration/chunks/{arrayId}/{z}/{y}/{x}', residualOverlap: '/api/v14/spatial-registration/residual-overlap', transform: '/api/v14/spatial-registration/transform', offlineCompletion: '/api/v14/spatial-registration/offline-completion', integrity: '/api/v14/spatial-registration/integrity' } } },
    async status() {
      if (!bundle) return { state, integrity: integrityState, releaseId: null, cachedChunks: 0, totalChunks: 304, offlineComplete: false, residualOverlapRecomputed: false, lastError: lastError ? 'Goal 14 registration local verification failed.' : null }
      const summary = await cacheSummary()
      if (summary.findings.length) { state = 'failed'; integrityState = 'failed'; lastError = summary.findings[0] }
      return { state, integrity: integrityState, releaseId: bundle.manifest.release_id, cachedChunks: summary.cached, totalChunks: 304, offlineComplete: Boolean(completionRow()) && summary.cached === 304 && summary.findings.length === 0, residualOverlapRecomputed: Boolean(residualOverlapRow()), lastError: lastError ? 'Goal 14 registration local verification failed.' : null }
    },
    sync(signal) {
      return withStorage(async () => {
        if (state === 'ready') return this.status()
        if (database.prepare('SELECT COUNT(*) AS count FROM snapshot').get().count !== 0) throw new SpatialRegistrationVerificationError('Existing Goal 14 registration snapshot failed and cannot be overwritten.')
        const synchronized = verifySpatialRegistrationBundle(await client.synchronize(signal), now)
        const encoded = encodeSpatialRegistrationBundle(synchronized, now)
        const stored = await objects.put(encoded)
        transaction(database, () => database.prepare('INSERT INTO snapshot VALUES (1,?,?,?,?,?,?,?,?,?,?,?)').run(SPATIAL_REGISTRATION_PINS.releaseId, SPATIAL_REGISTRATION_PINS.releaseDigest, SPATIAL_REGISTRATION_PINS.trustDigest, SPATIAL_REGISTRATION_PINS.catalogDigest, SPATIAL_REGISTRATION_PINS.manifestDigest, SPATIAL_REGISTRATION_PINS.envelopeDigest, SPATIAL_REGISTRATION_PINS.metadataDigest, SPATIAL_REGISTRATION_PINS.inventoryDigest, stored.digest, stored.bytes, exactTimestamp(now)))
        indexBundle(synchronized); state = 'ready'; integrityState = 'valid'; lastError = null
        return this.status()
      })
    },
    recordPage(recordType) { requireReady(); if (!SPATIAL_REGISTRATION_RECORD_TYPES.includes(recordType)) throw new SpatialRegistrationRequestError('SPATIAL_REGISTRATION_RECORD_TYPE_INVALID', 'Registration record type is unavailable.', 404); return { releaseId: SPATIAL_REGISTRATION_PINS.releaseId, releaseDigest: SPATIAL_REGISTRATION_PINS.releaseDigest, recordType, items: structuredClone(semantic[recordType]) } },
    chunkInventory({ arrayId = null, offset = 0, limit = 100 } = {}) { requireReady(); const selected = bundle.inventory.chunks.filter((item) => arrayId === null || item.array_id === arrayId); return { releaseId: SPATIAL_REGISTRATION_PINS.releaseId, releaseDigest: SPATIAL_REGISTRATION_PINS.releaseDigest, arrayId, offset, limit, total: selected.length, items: structuredClone(selected.slice(offset, offset + limit)) } },
    async chunk(arrayId, gridZyx, signal) { requireReady(); const descriptor = chunks.get(`${arrayId}:${gridZyx.join('.')}`); if (!descriptor) throw new SpatialRegistrationRequestError('SPATIAL_REGISTRATION_CHUNK_NOT_OWNED', 'Chunk coordinate is not owned by the registration release.', 404); const selected = await obtainChunk(descriptor, signal); return { descriptor: structuredClone(descriptor), bytes: selected.encoded, source: selected.source } },
    recomputeResidualOverlap(signal) {
      return withStorage(() => recomputeResidualOverlapNow(signal))
    },
    transform(request, signal) {
      return withStorage(async () => {
        requireReady()
        if (request.sourceSpaceId === request.targetSpaceId) throw new SpatialRegistrationRequestError('SPATIAL_REGISTRATION_SAME_SPACE_REQUEST', 'Source and target are the same published space; no registration transform is required.', 422)
        let selected
        try { selected = selectRegistrationChain(bundle.metadata, request.sourceSpaceId, request.targetSpaceId) } catch (error) { throw new SpatialRegistrationRequestError('SPATIAL_REGISTRATION_CHAIN_INVALID', error instanceof Error ? error.message : 'Registration chain is invalid.', 422) }
        const sourceSpace = bundle.metadata.spaces.find((item) => item.id === request.sourceSpaceId)
        const voxel = request.pointXyzMm.map((item, axis) => (item - sourceSpace.index_xyz_to_aligned_mm[axis][3]) / sourceSpace.spacing_xyz[axis])
        let evaluationRoiMembership = 'not-assessed-off-grid'
        let cacheSource = null
        if (voxel.every(Number.isInteger)) {
          const grid = [Math.floor(voxel[2] / 32), Math.floor(voxel[1] / 40), Math.floor(voxel[0] / 48)]
          const descriptor = chunks.get(`evaluation-roi:${grid.join('.')}`)
          const roi = await obtainChunk(descriptor, signal)
          const local = [voxel[2] % 32, voxel[1] % 40, voxel[0] % 48]
          const index = (local[0] * 40 + local[1]) * 48 + local[2]
          evaluationRoiMembership = roi.decoded[index] === 1 ? 'inside' : 'outside'
          cacheSource = roi.source
        }
        return { releaseId: SPATIAL_REGISTRATION_PINS.releaseId, registrationId: selected.registration.id, direction: selected.direction, sourceSpaceId: request.sourceSpaceId, targetSpaceId: request.targetSpaceId, inputPointXyzMm: request.pointXyzMm, outputPointXyzMm: applyAffine(selected.matrix, request.pointXyzMm), sourceVoxelXyz: voxel, evaluationRoiMembership, cacheSource, interpolation: selected.registration.interpolation, inverseStatus: selected.registration.inverse.status, applicability: selected.registration.applicability }
      })
    },
    completeOffline(signal) {
      return withStorage(async () => {
        requireReady()
        for (const descriptor of bundle.inventory.chunks) await obtainChunk(descriptor, signal)
        await recomputeResidualOverlapNow(signal)
        const summary = await cacheSummary(true)
        if (summary.cached !== 304 || summary.encoded !== 304 || summary.decoded !== 304 || summary.findings.length) throw new SpatialRegistrationVerificationError('Goal 14 registration offline completion did not verify all chunks.')
        let row = completionRow()
        if (!row) { transaction(database, () => database.prepare('INSERT INTO offline_completion VALUES (1,?,?,?,?,?)').run(SPATIAL_REGISTRATION_PINS.releaseId, SPATIAL_REGISTRATION_PINS.inventoryDigest, 304, 508_201, exactTimestamp(now))); row = completionRow() }
        return { releaseId: SPATIAL_REGISTRATION_PINS.releaseId, verifiedChunks: 304, encodedBytes: 508_201, residualOverlapRecomputed: true, networkAccessRequiredForReplay: false, completedAt: row.completed_at }
      })
    },
    async integrity(signal) {
      signal?.throwIfAborted()
      if (!bundle) return { status: state === 'failed' ? 'failed' : 'empty', releaseId: null, metadataVerified: false, cachedChunks: 0, verifiedEncodedChunks: 0, verifiedDecodedChunks: 0, residualOverlapRecomputed: false, offlineComplete: false, networkAccess: false, findings: lastError ? ['Stored registration metadata failed verification.'] : [] }
      const summary = await cacheSummary(true, signal)
      signal?.throwIfAborted()
      const failed = summary.findings.length > 0
      if (failed) { state = 'failed'; integrityState = 'failed'; lastError = summary.findings[0] }
      return { status: failed ? 'failed' : 'valid', releaseId: SPATIAL_REGISTRATION_PINS.releaseId, metadataVerified: true, cachedChunks: summary.cached, verifiedEncodedChunks: summary.encoded, verifiedDecodedChunks: summary.decoded, residualOverlapRecomputed: Boolean(residualOverlapRow()), offlineComplete: !failed && Boolean(completionRow()) && summary.cached === 304, networkAccess: false, findings: failed ? summary.findings : summary.cached === 304 ? [] : [`${304 - summary.cached} manifest-owned chunks are not cached.`] }
    },
    async close() { if (closed) return; closed = true; await storageTail.catch(() => {}); await objects.close(); database.close(); if (selectedRoot.ephemeral) await rm(selectedRoot.root, { recursive: true, force: true }) },
    root: selectedRoot.root
  }
}
