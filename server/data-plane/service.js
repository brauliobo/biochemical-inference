import { rm } from 'node:fs/promises'
import { canonicalJson } from '../../shared/canonical-json.js'
import {
  AuthorityClosureAuditReportSchema,
  DATA_PLANE_AUDIT_ALGORITHM_VERSION,
  DATA_PLANE_BASELINE_RELEASE_ID,
  DATA_PLANE_CANDIDATE_RELEASE_ID,
  DATA_PLANE_CATALOG_DIGEST,
  DATA_PLANE_DIFF_DIGEST,
  DATA_PLANE_DIFF_RESPONSE_DIGEST,
  DATA_PLANE_RELEASE_DIGEST,
  DATA_PLANE_RELEASE_ID,
  DATA_PLANE_RELEASE_PINS,
  DATA_PLANE_TRUST_DIGEST,
  FACTORY_RECORD_SCHEMAS,
  FactoryManifestSchema,
  FactoryReleaseEnvelopeSchema,
  FactorySemanticDiffSchema,
  FactoryTrustStoreSchema
} from '../../shared/data-plane-contracts.js'
import { decodeCursor, decodeSecret, encodeCursor } from '../commons/cursor.js'
import { canonicalSha256Hex } from '../commons/digest.js'
import { isoNow as now } from '../commons/clock.js'
import { defineRequestError } from '../commons/errors.js'
import { transaction } from '../commons/sqlite.js'
import { selectStorageRoot, testRootParent } from '../commons/storage.js'
import { createFactoryClient } from './client.js'
import { openDataPlaneDatabase } from './database.js'
import { createDataPlaneObjectStore } from './object-store.js'
import {
  DataPlaneVerificationError,
  RECORD_TYPES,
  parseCanonicalBytes,
  sha256,
  verifyStoredBundle,
  verifyStoredRelease
} from './verification.js'

const FILTER_COLUMNS = Object.freeze({
  taxa: new Set(['id']),
  compounds: new Set(['id']),
  reactions: new Set(['id']),
  proteins: new Set(['id', 'taxon_id']),
  references: new Set(['id']),
  catalysis: new Set(['id', 'taxon_id', 'reaction_id', 'protein_id']),
  limitations: new Set(['id'])
})
const TEST_CURSOR_SECRET = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

export const DataPlaneRequestError = defineRequestError('DataPlaneRequestError', 422)

function selectRoot(options, env) {
  return selectStorageRoot({
    configured: options.root ?? env.BIOCHEMICAL_DATA_PLANE_ROOT,
    test: env.NODE_ENV === 'test' ? { parent: testRootParent(env.BIOCHEMICAL_TEST_DATA_PLANE_ROOT), prefix: 'data-plane-' } : null,
    defaultName: 'data-plane-v2',
    secure: true,
    inSourceError: () => new DataPlaneRequestError('data_plane_root_in_source', 'Data-plane storage root must be outside the source tree.', 500)
  })
}

export function decodeCursorSecret(value) {
  return decodeSecret(value, (reason) => {
    throw new DataPlaneRequestError('data_plane_cursor_secret_invalid', reason === 'shape' ? 'BIOCHEMICAL_DATA_PLANE_CURSOR_SECRET must be unpadded base64url for exactly 32 bytes.' : 'BIOCHEMICAL_DATA_PLANE_CURSOR_SECRET is not canonical base64url.', 500)
  })
}

function cursorSecret(env) {
  const value = env.BIOCHEMICAL_DATA_PLANE_CURSOR_SECRET ?? (env.NODE_ENV === 'test' ? TEST_CURSOR_SECRET : undefined)
  if (!value) throw new DataPlaneRequestError('data_plane_cursor_secret_required', 'BIOCHEMICAL_DATA_PLANE_CURSOR_SECRET is required.', 500)
  return decodeCursorSecret(value)
}

function generationRelease(row) {
  return { id: row.release_id, schema_version: row.schema_version, digest: row.release_digest }
}

const strictCursorDecode = (value, secret) => decodeCursor(value, secret, () => {
  throw new DataPlaneRequestError('data_plane_cursor_invalid', 'Local data-plane cursor is invalid or tampered.')
}, { strictLength: true })

const cursorEncode = encodeCursor

function rowObject(database, objects, row, field, expectedBytes) {
  const digest = row[field]
  const object = database.prepare('SELECT bytes FROM objects WHERE digest = ?').get(digest)
  if (!object) throw new DataPlaneVerificationError(`Published metadata references missing object ${digest}.`)
  return objects.get(digest, expectedBytes ?? object.bytes)
}

function safeCount(database, table) {
  try {
    return database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count
  } catch {
    return 0
  }
}

function sameValue(left, right) {
  return canonicalJson(left) === canonicalJson(right)
}

function authorityAuditValue(candidateRow, baselineRow, candidate, baseline, diffRow, semanticDiff) {
  return {
    reportSchemaVersion: '1.0.0',
    algorithmVersion: DATA_PLANE_AUDIT_ALGORITHM_VERSION,
    release: candidate.release,
    baseline: baseline.release,
    pins: {
      catalogDigest: candidateRow.catalog_digest,
      trustDigest: candidateRow.trust_digest,
      envelopeDigest: candidateRow.envelope_digest,
      manifestDigest: candidateRow.manifest_digest
    },
    signer: {
      keyId: candidate.envelope.signature.key_id,
      algorithm: candidate.envelope.signature.algorithm,
      signedAt: candidate.envelope.signature.signed_at,
      status: candidate.key.status
    },
    partitions: candidate.manifest.partitions,
    sources: candidate.manifest.inputs.map((input) => ({
      name: input.name,
      recordType: input.record_type,
      source: input.source,
      sourceObject: { sha256: input.source_object_sha256, bytes: input.source_object_bytes },
      adapter: input.adapter,
      license: input.license
    })),
    difference: {
      digest: semanticDiff.diff_digest,
      responseDigest: diffRow.response_digest,
      semanticDiff,
      classes: {
        scientific: semanticDiff.record_changes.length + semanticDiff.scientific_metadata_changes.length,
        provenance: semanticDiff.provenance_changes.length,
        rights: semanticDiff.rights_changes.length,
        packaging: semanticDiff.packaging_changes.length
      }
    },
    results: candidate.results,
    scientificValidation: 'unsupported'
  }
}

export async function createDataPlaneService(options = {}) {
  const env = options.env ?? process.env
  const selectedRoot = await selectRoot(options, env)
  const secret = cursorSecret(env)
  const database = openDataPlaneDatabase(selectedRoot.root)
  const objects = await createDataPlaneObjectStore(selectedRoot.root, options.objectHooks)
  const client = options.client ?? createFactoryClient(env, options.clientOptions)
  const hooks = options.hooks ?? {}
  let lifecycle = 'empty'
  let integrityState = 'empty'
  let integrityResult = { status: 'valid', checkedAt: now(), releases: 0, objects: 0, records: 0, findings: [] }
  let lastError = null
  let lastSyncAt = null
  let syncGeneration = 0
  let syncController
  let storageTail = Promise.resolve()
  let closed = false
  const activeSyncs = new Set()

  function withStorageLock(action) {
    const result = storageTail.then(action, action)
    storageTail = result.catch(() => {})
    return result
  }

  function generationById(releaseId = DATA_PLANE_RELEASE_ID) {
    return database.prepare('SELECT * FROM generations WHERE release_id = ?').get(releaseId)
  }

  function activeGeneration() {
    return database.prepare('SELECT generations.* FROM active_generation JOIN generations USING (generation_id) WHERE singleton = 1').get()
  }

  function requireGeneration(releaseId = DATA_PLANE_RELEASE_ID) {
    if (integrityState === 'failed') throw new DataPlaneRequestError('data_plane_integrity_failed', 'Local data-plane integrity verification failed; no release can be consumed.', 503)
    const row = generationById(releaseId)
    if (!row) throw new DataPlaneRequestError('data_plane_release_not_found', `Verified local release ${releaseId} is not available.`, 404)
    return row
  }

  async function storedRelease(row) {
    const partitionRows = database.prepare('SELECT * FROM partitions WHERE generation_id = ? ORDER BY record_type, part_number').all(row.generation_id)
    const snapshot = {
      trustBytes: await rowObject(database, objects, row, 'trust_object_digest'),
      catalogBytes: await rowObject(database, objects, row, 'catalog_object_digest'),
      envelopeBytes: await rowObject(database, objects, row, 'envelope_object_digest'),
      manifestBytes: await rowObject(database, objects, row, 'manifest_object_digest'),
      partitionBytes: new Map()
    }
    for (const partition of partitionRows) snapshot.partitionBytes.set(partition.path, await objects.get(partition.object_digest, partition.bytes))
    return { partitionRows, snapshot, verified: verifyStoredRelease(snapshot) }
  }

  async function scanIntegrityIsolated(signal) {
    const assertActive = () => signal?.throwIfAborted()
    assertActive()
    const checkedAt = now()
    const findings = []
    let releaseCount = safeCount(database, 'generations')
    let objectCount = safeCount(database, 'objects')
    let recordCount = safeCount(database, 'records')
    try {
      const sqliteFindings = database.prepare('PRAGMA integrity_check').all()
      if (sqliteFindings.length !== 1 || sqliteFindings[0].integrity_check !== 'ok') throw new DataPlaneVerificationError(`SQLite integrity_check failed: ${sqliteFindings.map((item) => item.integrity_check).join('; ')}.`)
      const foreignKeys = database.prepare('PRAGMA foreign_key_check').all()
      if (foreignKeys.length !== 0) throw new DataPlaneVerificationError('SQLite foreign_key_check found invalid references.')

      const generations = database.prepare('SELECT * FROM generations ORDER BY release_id').all()
      const activeRows = database.prepare('SELECT * FROM active_generation ORDER BY singleton').all()
      const diffRows = database.prepare('SELECT * FROM release_diffs').all()
      const partitionCount = safeCount(database, 'partitions')
      const auditRows = database.prepare('SELECT * FROM authority_closure_audits ORDER BY report_digest').all()
      releaseCount = generations.length

      if (generations.length === 0) {
        if (activeRows.length || diffRows.length || partitionCount || recordCount || objectCount || auditRows.length) throw new DataPlaneVerificationError('Empty data-plane metadata contains extra rows.')
        const files = await objects.inventory()
        assertActive()
        if (files.length) throw new DataPlaneVerificationError('Empty data-plane CAS contains unindexed object files.')
        return { status: 'valid', checkedAt, releases: 0, objects: 0, records: 0, findings: [] }
      }
      if (generations.length !== DATA_PLANE_RELEASE_PINS.length || generations.some((row, index) => row.release_id !== DATA_PLANE_RELEASE_PINS[index].releaseId || row.release_digest !== DATA_PLANE_RELEASE_PINS[index].releaseDigest)) throw new DataPlaneVerificationError('Published generation rows do not equal the pinned baseline/candidate release closure.')
      if (activeRows.length !== 1 || activeRows[0].singleton !== 1) throw new DataPlaneVerificationError('Published generations require exactly one active generation pointer.')
      const active = generations.find((row) => row.generation_id === activeRows[0].generation_id)
      if (!active || active.release_id !== DATA_PLANE_CANDIDATE_RELEASE_ID) throw new DataPlaneVerificationError('The pinned candidate release is not the active generation.')

      const allowedTypes = new Set(RECORD_TYPES)
      const unknownPartition = database.prepare('SELECT record_type FROM partitions').all().find((row) => !allowedTypes.has(row.record_type))
      const unknownRecord = database.prepare('SELECT record_type FROM records').all().find((row) => !allowedTypes.has(row.record_type))
      if (unknownPartition || unknownRecord) throw new DataPlaneVerificationError(`Local data plane contains an unknown record type: ${unknownPartition?.record_type ?? unknownRecord.record_type}.`)

      const expectedObjects = new Map()
      const verifiedReleases = new Map()
      const expectObject = (digest, bytes, mediaType) => {
        if (sha256(bytes) !== digest) throw new DataPlaneVerificationError(`Object closure digest mismatch for ${digest}.`)
        const expected = { bytes: bytes.length, media_type: mediaType }
        const previous = expectedObjects.get(digest)
        if (previous && !sameValue(previous, expected)) throw new DataPlaneVerificationError(`Object ${digest} has conflicting immutable metadata.`)
        expectedObjects.set(digest, expected)
      }

      let expectedPartitions = 0
      let expectedRecords = 0
      for (const generation of generations) {
        assertActive()
        const { partitionRows, snapshot, verified } = await storedRelease(generation)
        assertActive()
        verifiedReleases.set(verified.release.id, verified)
        const expectedPin = DATA_PLANE_RELEASE_PINS.find((pin) => pin.releaseId === generation.release_id)
        const exactGeneration = verified.release.id === generation.release_id &&
          verified.release.digest === generation.release_digest &&
          generation.schema_version === verified.release.schema_version &&
          generation.catalog_digest === DATA_PLANE_CATALOG_DIGEST &&
          generation.trust_digest === DATA_PLANE_TRUST_DIGEST &&
          generation.envelope_digest === expectedPin.envelopeDigest &&
          generation.manifest_digest === expectedPin.manifestDigest &&
          generation.signer_key_id === expectedPin.signerKeyId &&
          generation.signed_at === verified.envelope.signature.signed_at &&
          generation.catalog_object_digest === DATA_PLANE_CATALOG_DIGEST &&
          generation.trust_object_digest === DATA_PLANE_TRUST_DIGEST &&
          generation.envelope_object_digest === expectedPin.envelopeDigest &&
          generation.manifest_object_digest === expectedPin.manifestDigest
        if (!exactGeneration) throw new DataPlaneVerificationError(`Generation ${generation.generation_id} metadata does not match its signed immutable release.`)

        expectObject(DATA_PLANE_TRUST_DIGEST, snapshot.trustBytes, 'application/json')
        expectObject(DATA_PLANE_CATALOG_DIGEST, snapshot.catalogBytes, 'application/json')
        expectObject(expectedPin.envelopeDigest, snapshot.envelopeBytes, 'application/json')
        expectObject(expectedPin.manifestDigest, snapshot.manifestBytes, 'application/json')
        expectedPartitions += verified.manifest.partitions.length
        if (partitionRows.length !== verified.manifest.partitions.length) throw new DataPlaneVerificationError(`Generation ${generation.generation_id} partition rows are incomplete or excessive.`)
        for (const entry of verified.manifest.partitions) {
          const stored = partitionRows.find((item) => item.path === entry.path)
          const number = Number(entry.path.match(/part-([0-9]{5})\.ndjson$/)[1])
          if (!stored || stored.object_digest !== entry.sha256 || stored.record_type !== entry.record_type || stored.part_number !== number || stored.first_id !== entry.first_id || stored.last_id !== entry.last_id || stored.record_count !== entry.record_count || stored.bytes !== entry.bytes) throw new DataPlaneVerificationError(`Generation ${generation.generation_id} partition row disagrees with the manifest: ${entry.path}.`)
          expectObject(entry.sha256, snapshot.partitionBytes.get(entry.path), 'application/x-ndjson')
        }

        const rows = database.prepare('SELECT record_type, id, taxon_id, reaction_id, protein_id, encoded FROM records WHERE generation_id = ? ORDER BY record_type, id').all(generation.generation_id)
        const expectedRows = RECORD_TYPES.flatMap((type) => verified.records[type].map((record) => ({ type, record }))).sort((left, right) => left.type.localeCompare(right.type) || left.record.id.localeCompare(right.record.id))
        if (rows.length !== expectedRows.length) throw new DataPlaneVerificationError(`Generation ${generation.generation_id} record rows are incomplete or excessive.`)
        expectedRecords += expectedRows.length
        for (let index = 0; index < expectedRows.length; index += 1) {
          const row = rows[index]
          const expected = expectedRows[index]
          const encoded = Buffer.from(canonicalJson(expected.record))
          if (row.record_type !== expected.type || row.id !== expected.record.id || row.taxon_id !== (expected.record.taxon_id ?? null) || row.reaction_id !== (expected.record.reaction_id ?? null) || row.protein_id !== (expected.record.protein_id ?? null) || !Buffer.from(row.encoded).equals(encoded)) throw new DataPlaneVerificationError(`Generation ${generation.generation_id} record index disagrees with canonical partition bytes for ${expected.type}/${expected.record.id}.`)
        }
      }
      if (partitionCount !== expectedPartitions || recordCount !== expectedRecords) throw new DataPlaneVerificationError('Global partition or record row closure contains extra rows.')

      if (diffRows.length !== 1) throw new DataPlaneVerificationError('Published release closure requires exactly one baseline-to-candidate diff row.')
      const diffRow = diffRows[0]
      const baseline = generations.find((row) => row.release_id === DATA_PLANE_BASELINE_RELEASE_ID)
      const candidate = generations.find((row) => row.release_id === DATA_PLANE_CANDIDATE_RELEASE_ID)
      if (diffRow.baseline_generation_id !== baseline.generation_id || diffRow.candidate_generation_id !== candidate.generation_id || diffRow.diff_digest !== DATA_PLANE_DIFF_DIGEST || diffRow.response_digest !== DATA_PLANE_DIFF_RESPONSE_DIGEST || diffRow.object_digest !== DATA_PLANE_DIFF_RESPONSE_DIGEST) throw new DataPlaneVerificationError('Stored semantic diff row does not bind the pinned release pair.')
      const diffBytes = await rowObject(database, objects, diffRow, 'object_digest')
      const diff = verifyStoredBundle(verifiedReleases, diffBytes)
      if (diff.diff_digest !== diffRow.diff_digest || sha256(diffBytes) !== diffRow.response_digest) throw new DataPlaneVerificationError('Stored semantic diff bytes do not match their immutable row.')
      expectObject(DATA_PLANE_DIFF_RESPONSE_DIGEST, diffBytes, 'application/json')
      const expectedAuditValue = authorityAuditValue(candidate, baseline, verifiedReleases.get(candidate.release_id), verifiedReleases.get(baseline.release_id), diffRow, diff)

      for (const auditRow of auditRows) {
        assertActive()
        const encoded = Buffer.from(auditRow.encoded)
        const report = parseCanonicalBytes(encoded, AuthorityClosureAuditReportSchema, `Authority closure audit ${auditRow.report_digest}`)
        const digestValue = { ...report }
        delete digestValue.reportDigest
        const computed = canonicalSha256Hex(digestValue)
        if (computed !== report.reportDigest || report.reportDigest !== auditRow.report_digest || !sameValue(digestValue, expectedAuditValue) || report.algorithmVersion !== auditRow.algorithm_version || auditRow.candidate_generation_id !== candidate.generation_id || auditRow.baseline_generation_id !== baseline.generation_id) throw new DataPlaneVerificationError(`Authority closure audit ${auditRow.report_digest} has invalid immutable identity or release pins.`)
      }

      const objectRows = database.prepare('SELECT * FROM objects ORDER BY digest').all()
      objectCount = objectRows.length
      if (objectRows.length !== expectedObjects.size) throw new DataPlaneVerificationError('Data-plane object index contains missing or extra rows.')
      for (const row of objectRows) {
        const expected = expectedObjects.get(row.digest)
        if (!expected || row.bytes !== expected.bytes || row.media_type !== expected.media_type) throw new DataPlaneVerificationError(`Data-plane object row is unreferenced or inconsistent: ${row.digest}.`)
      }
      const files = await objects.inventory()
      assertActive()
      if (!sameValue(files, [...expectedObjects.keys()].sort())) throw new DataPlaneVerificationError('Data-plane CAS contains missing, extra, or unindexed object files.')
      return { status: 'valid', checkedAt, releases: generations.length, objects: objectRows.length, records: expectedRecords, findings: [] }
    } catch (error) {
      if (signal?.aborted) throw signal.reason
      findings.push(error instanceof Error ? error.message : 'Unknown integrity failure.')
      return { status: 'failed', checkedAt, releases: releaseCount, objects: objectCount, records: recordCount, findings }
    }
  }

  function applyIntegrity(result) {
    integrityResult = result
    integrityState = result.status === 'failed' ? 'failed' : result.releases ? 'valid' : 'empty'
    if (result.status === 'failed') lastError = result.findings[0] ?? 'Local data-plane integrity verification failed.'
  }

  await objects.clearStaging()
  const startupIntegrity = await withStorageLock(scanIntegrityIsolated)
  applyIntegrity(startupIntegrity)
  if (startupIntegrity.status === 'valid' && startupIntegrity.releases) {
    const active = activeGeneration()
    lifecycle = 'ready'
    lastSyncAt = active.synced_at
    lastError = null
  } else if (startupIntegrity.status === 'failed') {
    lifecycle = 'failed'
  }

  async function stageObject(bytes, mediaType, createdAt, stagedObjects) {
    const digest = sha256(bytes)
    const indexed = database.prepare('SELECT * FROM objects WHERE digest = ?').get(digest)
    const object = await objects.put(bytes)
    if (indexed && (indexed.bytes !== object.bytes || indexed.media_type !== mediaType)) throw new DataPlaneVerificationError(`Immutable object metadata conflicts for ${object.digest}.`)
    const value = { ...object, mediaType, createdAt, indexed: Boolean(indexed) }
    const previous = stagedObjects.get(digest)
    if (previous && (previous.bytes !== value.bytes || previous.mediaType !== value.mediaType)) throw new DataPlaneVerificationError(`Staged object ${digest} has conflicting metadata.`)
    const merged = previous ? { ...value, created: previous.created || value.created, indexed: previous.indexed || value.indexed } : value
    stagedObjects.set(digest, merged)
    return merged
  }

  async function publishBundle(bundle, expectedSyncGeneration, assertOwner) {
    const syncedAt = now()
    const stagedObjects = new Map()
    const stagedReleases = new Map()
    let committed = false
    const owned = async (promise) => {
      const value = await promise
      assertOwner()
      return value
    }
    try {
      const trust = await owned(stageObject(bundle.bytes.trust, 'application/json', syncedAt, stagedObjects))
      const catalog = await owned(stageObject(bundle.bytes.catalog, 'application/json', syncedAt, stagedObjects))
      const diff = await owned(stageObject(bundle.bytes.diff, 'application/json', syncedAt, stagedObjects))
      for (const pin of DATA_PLANE_RELEASE_PINS) {
        const release = bundle.releases.get(pin.releaseId)
        if (!release) throw new DataPlaneVerificationError(`Verified sync bundle is missing ${pin.releaseId}.`)
        const envelope = await owned(stageObject(release.bytes.envelope, 'application/json', syncedAt, stagedObjects))
        const manifest = await owned(stageObject(release.bytes.manifest, 'application/json', syncedAt, stagedObjects))
        const partitions = new Map()
        for (const entry of release.manifest.partitions) partitions.set(entry.path, await owned(stageObject(release.bytes.partitions.get(entry.path), 'application/x-ndjson', syncedAt, stagedObjects)))
        stagedReleases.set(pin.releaseId, { release, envelope, manifest, partitions })
      }
      await owned(hooks.afterStage?.({ bundle, stagedObjects, stagedReleases }) ?? Promise.resolve())

      const published = transaction(database, () => {
        assertOwner()
        const insertObject = database.prepare('INSERT OR IGNORE INTO objects (digest, bytes, media_type, created_at) VALUES (?, ?, ?, ?)')
        for (const object of stagedObjects.values()) insertObject.run(object.digest, object.bytes, object.mediaType, object.createdAt)
        const generationIds = new Map()
        for (const pin of DATA_PLANE_RELEASE_PINS) {
          const staged = stagedReleases.get(pin.releaseId)
          const snapshot = staged.release
          const existing = generationById(pin.releaseId)
          if (existing) {
            const same = existing.release_digest === snapshot.manifest.release_digest &&
              existing.catalog_digest === DATA_PLANE_CATALOG_DIGEST &&
              existing.trust_digest === DATA_PLANE_TRUST_DIGEST &&
              existing.envelope_digest === staged.envelope.digest &&
              existing.manifest_digest === staged.manifest.digest &&
              existing.signer_key_id === snapshot.envelope.signature.key_id &&
              existing.signed_at === snapshot.envelope.signature.signed_at
            if (!same) throw new DataPlaneVerificationError(`Immutable local release conflicts with ${pin.releaseId}.`)
            generationIds.set(pin.releaseId, existing.generation_id)
            continue
          }
          const inserted = database.prepare(`
            INSERT INTO generations (
              release_id, release_digest, schema_version, catalog_digest, trust_digest,
              envelope_digest, manifest_digest, signer_key_id, signed_at,
              catalog_object_digest, trust_object_digest, envelope_object_digest,
              manifest_object_digest, synced_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            snapshot.manifest.release_id,
            snapshot.manifest.release_digest,
            snapshot.manifest.schema_version,
            DATA_PLANE_CATALOG_DIGEST,
            DATA_PLANE_TRUST_DIGEST,
            staged.envelope.digest,
            staged.manifest.digest,
            snapshot.envelope.signature.key_id,
            snapshot.envelope.signature.signed_at,
            catalog.digest,
            trust.digest,
            staged.envelope.digest,
            staged.manifest.digest,
            syncedAt
          )
          const generationId = Number(inserted.lastInsertRowid)
          generationIds.set(pin.releaseId, generationId)
          const insertPartition = database.prepare('INSERT INTO partitions (generation_id, path, record_type, part_number, first_id, last_id, record_count, bytes, object_digest) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
          for (const entry of snapshot.manifest.partitions) {
            const number = Number(entry.path.match(/part-([0-9]{5})\.ndjson$/)[1])
            insertPartition.run(generationId, entry.path, entry.record_type, number, entry.first_id, entry.last_id, entry.record_count, entry.bytes, staged.partitions.get(entry.path).digest)
          }
          const insertRecord = database.prepare('INSERT INTO records (generation_id, record_type, id, taxon_id, reaction_id, protein_id, encoded) VALUES (?, ?, ?, ?, ?, ?, ?)')
          for (const type of RECORD_TYPES) for (const record of snapshot.records[type]) insertRecord.run(generationId, type, record.id, record.taxon_id ?? null, record.reaction_id ?? null, record.protein_id ?? null, Buffer.from(canonicalJson(record)))
        }

        const baselineId = generationIds.get(DATA_PLANE_BASELINE_RELEASE_ID)
        const candidateId = generationIds.get(DATA_PLANE_CANDIDATE_RELEASE_ID)
        const existingDiff = database.prepare('SELECT * FROM release_diffs WHERE baseline_generation_id = ? AND candidate_generation_id = ?').get(baselineId, candidateId)
        if (existingDiff) {
          if (existingDiff.diff_digest !== DATA_PLANE_DIFF_DIGEST || existingDiff.response_digest !== DATA_PLANE_DIFF_RESPONSE_DIGEST || existingDiff.object_digest !== diff.digest) throw new DataPlaneVerificationError('Immutable local semantic diff conflicts with the pinned release pair.')
        } else {
          database.prepare('INSERT INTO release_diffs (baseline_generation_id, candidate_generation_id, diff_digest, response_digest, object_digest, synced_at) VALUES (?, ?, ?, ?, ?, ?)').run(baselineId, candidateId, bundle.diff.diff_digest, sha256(bundle.bytes.diff), diff.digest, syncedAt)
        }
        database.prepare('INSERT INTO active_generation (singleton, generation_id) VALUES (1, ?) ON CONFLICT(singleton) DO UPDATE SET generation_id = excluded.generation_id').run(candidateId)
        hooks.beforeCommit?.({ generationIds, reused: generationIds.size === 2 && [...generationIds.values()].every((id) => database.prepare('SELECT synced_at FROM generations WHERE generation_id = ?').get(id).synced_at !== syncedAt) })
        return { generationIds, syncedAt: generationById(DATA_PLANE_CANDIDATE_RELEASE_ID).synced_at }
      })
      committed = true
      assertOwner()
      return published
    } catch (error) {
      if (!committed) {
        for (const object of stagedObjects.values()) {
          if (!object.created || object.indexed || database.prepare('SELECT digest FROM objects WHERE digest = ?').get(object.digest)) continue
          await objects.remove(object.digest)
        }
      }
      throw error
    }
  }

  function status() {
    const active = activeGeneration()
    return {
      contractVersion: '1.0.0',
      state: integrityState === 'failed' ? 'failed' : lifecycle,
      localOnly: true,
      release: active ? generationRelease(active) : null,
      signerKeyId: active?.signer_key_id ?? null,
      lastSyncAt,
      lastError,
      integrity: integrityState
    }
  }

  async function executeSync() {
    if (closed) throw new DataPlaneRequestError('data_plane_closed', 'Data-plane service is closed.', 503)
    if (integrityState === 'failed') throw new DataPlaneRequestError('data_plane_integrity_failed', 'Local data-plane integrity verification failed; explicit repair is required before synchronization.', 503)
    const generation = ++syncGeneration
    syncController?.abort(new DOMException('A newer data-plane sync superseded this request.', 'AbortError'))
    const controller = new AbortController()
    syncController = controller
    lifecycle = 'syncing'
    lastError = null
    const assertOwner = () => {
      if (generation !== syncGeneration || controller.signal.aborted || closed) throw controller.signal.reason ?? new DOMException('A newer data-plane sync superseded this request.', 'AbortError')
    }
    const owned = async (promise) => {
      const value = await promise
      assertOwner()
      return value
    }
    try {
      const bundle = await owned(client.synchronize(controller.signal, assertOwner))
       const { published, scan } = await owned(withStorageLock(async () => {
         assertOwner()
         const publishedValue = await publishBundle(bundle, generation, assertOwner)
         assertOwner()
         await hooks.afterPublish?.({ database, bundle })
         assertOwner()
         const scanValue = await scanIntegrityIsolated()
         assertOwner()
         return { published: publishedValue, scan: scanValue }
       }))
       assertOwner()
       applyIntegrity(scan)
       if (scan.status !== 'valid') throw new DataPlaneVerificationError(scan.findings[0] ?? 'Published release bundle failed integrity verification.')
       lifecycle = 'ready'
      lastSyncAt = published.syncedAt
      lastError = null
      return status()
    } catch (error) {
      if (generation === syncGeneration && !closed) {
        lifecycle = 'failed'
        lastError = error instanceof Error ? error.message : 'Data-plane sync failed.'
      }
      throw error
    }
  }

  async function auditReport(candidateReleaseId, baselineReleaseId) {
    if (candidateReleaseId !== DATA_PLANE_CANDIDATE_RELEASE_ID || baselineReleaseId !== DATA_PLANE_BASELINE_RELEASE_ID) throw new DataPlaneRequestError('data_plane_audit_pair_invalid', 'Authority closure audit requires the independently pinned baseline and candidate releases.')
    return withStorageLock(async () => {
      const scan = await scanIntegrityIsolated()
      applyIntegrity(scan)
      if (scan.status !== 'valid' || scan.releases !== 2) throw new DataPlaneRequestError('data_plane_integrity_failed', scan.findings[0] ?? 'Both verified releases are required for an authority closure audit.', 503)
      const baselineRow = requireGeneration(baselineReleaseId)
      const candidateRow = requireGeneration(candidateReleaseId)
      const baseline = (await storedRelease(baselineRow)).verified
      const candidate = (await storedRelease(candidateRow)).verified
      const diffRow = database.prepare('SELECT * FROM release_diffs WHERE baseline_generation_id = ? AND candidate_generation_id = ?').get(baselineRow.generation_id, candidateRow.generation_id)
      const diffBytes = await rowObject(database, objects, diffRow, 'object_digest')
      const semanticDiff = verifyStoredBundle(new Map([[baseline.release.id, baseline], [candidate.release.id, candidate]]), diffBytes)
      const digestValue = authorityAuditValue(candidateRow, baselineRow, candidate, baseline, diffRow, semanticDiff)
      const reportDigest = canonicalSha256Hex(digestValue)
      const report = AuthorityClosureAuditReportSchema.parse({ ...digestValue, reportDigest })
      const encoded = Buffer.from(canonicalJson(report))
      transaction(database, () => {
        const existing = database.prepare('SELECT encoded FROM authority_closure_audits WHERE report_digest = ?').get(reportDigest)
        if (existing && !Buffer.from(existing.encoded).equals(encoded)) throw new DataPlaneVerificationError(`Immutable authority closure audit conflicts for ${reportDigest}.`)
        if (!existing) database.prepare('INSERT INTO authority_closure_audits (report_digest, candidate_generation_id, baseline_generation_id, algorithm_version, created_at, encoded) VALUES (?, ?, ?, ?, ?, ?)').run(reportDigest, candidateRow.generation_id, baselineRow.generation_id, DATA_PLANE_AUDIT_ALGORITHM_VERSION, now(), encoded)
      })
      return report
    })
  }

  const service = {
    status,
    sync() {
      const promise = executeSync()
      activeSyncs.add(promise)
      promise.finally(() => activeSyncs.delete(promise)).catch(() => {})
      return promise
    },
    listReleases() {
      if (integrityState === 'failed') throw new DataPlaneRequestError('data_plane_integrity_failed', 'Local data-plane integrity verification failed.', 503)
      const active = activeGeneration()
      return database.prepare('SELECT * FROM generations ORDER BY release_id').all().map((row) => ({
        release: generationRelease(row),
        signerKeyId: row.signer_key_id,
        signedAt: row.signed_at,
        syncedAt: row.synced_at,
        active: active?.generation_id === row.generation_id
      }))
    },
    async releaseDetail(releaseId) {
      const row = requireGeneration(releaseId)
      const [manifestBytes, envelopeBytes, trustBytes] = await Promise.all([
        rowObject(database, objects, row, 'manifest_object_digest'),
        rowObject(database, objects, row, 'envelope_object_digest'),
        rowObject(database, objects, row, 'trust_object_digest')
      ])
      const manifest = parseCanonicalBytes(manifestBytes, FactoryManifestSchema, 'Local manifest', row.manifest_digest)
      const envelope = parseCanonicalBytes(envelopeBytes, FactoryReleaseEnvelopeSchema, 'Local envelope', row.envelope_digest)
      const trust = parseCanonicalBytes(trustBytes, FactoryTrustStoreSchema, 'Local trust', row.trust_digest)
      const key = trust.keys.find((candidate) => candidate.key_id === row.signer_key_id)
      return {
        release: generationRelease(row),
        catalogDigest: row.catalog_digest,
        trustDigest: row.trust_digest,
        manifestDigest: row.manifest_digest,
        envelopeDigest: row.envelope_digest,
        signer: { keyId: row.signer_key_id, algorithm: 'Ed25519', signedAt: row.signed_at, status: key.status },
        manifest,
        envelope,
        syncedAt: row.synced_at,
        storage: 'local-verified-mirror'
      }
    },
    record(releaseId, recordType, recordId) {
      const generation = requireGeneration(releaseId)
      if (!FACTORY_RECORD_SCHEMAS[recordType]) throw new DataPlaneRequestError('data_plane_record_type_invalid', `Unknown data-plane record type: ${recordType}.`)
      const row = database.prepare('SELECT encoded FROM records WHERE generation_id = ? AND record_type = ? AND id = ?').get(generation.generation_id, recordType, recordId)
      if (!row) throw new DataPlaneRequestError('data_plane_record_not_found', `Local record ${recordType}/${recordId} is not available.`, 404)
      return { release: generationRelease(generation), recordType, item: FACTORY_RECORD_SCHEMAS[recordType].parse(JSON.parse(Buffer.from(row.encoded).toString('utf8'))), source: 'local-mirror' }
    },
    page(releaseId, recordType, query) {
      const generation = requireGeneration(releaseId)
      if (!FILTER_COLUMNS[recordType]) throw new DataPlaneRequestError('data_plane_record_type_invalid', `Unknown data-plane record type: ${recordType}.`)
      const filters = Object.fromEntries(Object.entries({ id: query.id, taxon_id: query.taxon_id, reaction_id: query.reaction_id, protein_id: query.protein_id }).filter(([, value]) => value !== undefined).sort(([left], [right]) => left.localeCompare(right)))
      const unsupported = Object.keys(filters).find((key) => !FILTER_COLUMNS[recordType].has(key))
      if (unsupported) throw new DataPlaneRequestError('data_plane_filter_invalid', `Unsupported filter for ${recordType}: ${unsupported}.`)
      const identity = {
        page_contract: 'data-plane-records-v1',
        release_id: generation.release_id,
        release_digest: generation.release_digest,
        schema_version: generation.schema_version,
        record_type: recordType,
        filters,
        sort: 'id:asc',
        limit: query.limit
      }
      let afterId = ''
      if (query.cursor) {
        const decoded = strictCursorDecode(query.cursor, secret)
        const expected = { ...identity, after_id: decoded.after_id }
        if (typeof decoded.after_id !== 'string' || canonicalJson(decoded) !== canonicalJson(expected)) throw new DataPlaneRequestError('data_plane_cursor_binding_invalid', 'Local cursor is bound to a different release, schema, query, sort, or limit.')
        afterId = decoded.after_id
      }
      const clauses = ['generation_id = ?', 'record_type = ?', 'id > ?']
      const values = [generation.generation_id, recordType, afterId]
      for (const [field, value] of Object.entries(filters)) {
        clauses.push(`${field} = ?`)
        values.push(value)
      }
      values.push(query.limit + 1)
      const rows = database.prepare(`SELECT id, encoded FROM records WHERE ${clauses.join(' AND ')} ORDER BY id LIMIT ?`).all(...values)
      const hasMore = rows.length > query.limit
      const selected = rows.slice(0, query.limit)
      const items = selected.map((row) => FACTORY_RECORD_SCHEMAS[recordType].parse(JSON.parse(Buffer.from(row.encoded).toString('utf8'))))
      const nextCursor = hasMore ? cursorEncode({ ...identity, after_id: selected.at(-1).id }, secret) : null
      return { pageContract: 'data-plane-records-v1', release: generationRelease(generation), recordType, filters, sort: 'id:asc', limit: query.limit, items, nextCursor, source: 'local-mirror' }
    },
    async diff(baseReleaseId, candidateReleaseId) {
      const baseline = requireGeneration(baseReleaseId)
      const candidate = requireGeneration(candidateReleaseId)
      const row = database.prepare('SELECT * FROM release_diffs WHERE baseline_generation_id = ? AND candidate_generation_id = ?').get(baseline.generation_id, candidate.generation_id)
      if (!row) throw new DataPlaneRequestError('data_plane_diff_not_found', 'No verified local semantic diff exists for that release pair.', 404)
      const bytes = await rowObject(database, objects, row, 'object_digest')
      return parseCanonicalBytes(bytes, FactorySemanticDiffSchema, 'Local semantic diff', row.response_digest)
    },
    async integrity(signal) {
      const result = await withStorageLock(() => scanIntegrityIsolated(signal))
      applyIntegrity(result)
      return result
    },
    audit: auditReport,
    listAudits() {
      if (integrityState === 'failed') throw new DataPlaneRequestError('data_plane_integrity_failed', 'Local data-plane integrity verification failed.', 503)
      return database.prepare(`
        SELECT audits.report_digest, audits.algorithm_version, audits.created_at,
               candidate.release_id AS candidate_release_id, candidate.schema_version AS candidate_schema_version, candidate.release_digest AS candidate_release_digest,
               baseline.release_id AS baseline_release_id, baseline.schema_version AS baseline_schema_version, baseline.release_digest AS baseline_release_digest
        FROM authority_closure_audits audits
        JOIN generations candidate ON candidate.generation_id = audits.candidate_generation_id
        JOIN generations baseline ON baseline.generation_id = audits.baseline_generation_id
        ORDER BY audits.created_at, audits.report_digest
      `).all().map((row) => ({
        reportDigest: row.report_digest,
        release: { id: row.candidate_release_id, schema_version: row.candidate_schema_version, digest: row.candidate_release_digest },
        baseline: { id: row.baseline_release_id, schema_version: row.baseline_schema_version, digest: row.baseline_release_digest },
        algorithmVersion: row.algorithm_version,
        createdAt: row.created_at
      }))
    },
    auditDetail(reportDigest) {
      if (integrityState === 'failed') throw new DataPlaneRequestError('data_plane_integrity_failed', 'Local data-plane integrity verification failed.', 503)
      const row = database.prepare('SELECT encoded FROM authority_closure_audits WHERE report_digest = ?').get(reportDigest)
      if (!row) throw new DataPlaneRequestError('data_plane_audit_not_found', `Authority closure audit ${reportDigest} is not available.`, 404)
      return parseCanonicalBytes(Buffer.from(row.encoded), AuthorityClosureAuditReportSchema, `Authority closure audit ${reportDigest}`)
    },
    async close() {
      if (closed) return
      closed = true
      syncGeneration += 1
      syncController?.abort(new DOMException('Data-plane service is closing.', 'AbortError'))
      await Promise.allSettled([...activeSyncs])
      await storageTail.catch(() => {})
      database.close()
      await objects.close()
      if (selectedRoot.ephemeral) await rm(selectedRoot.root, { recursive: true, force: true })
    },
    testing: options.exposeTesting ? { root: selectedRoot.root, database, objects, client, decodeCursor: (value) => strictCursorDecode(value, secret), scanIntegrity: scanIntegrityIsolated } : undefined
  }
  return service
}

export { DATA_PLANE_CATALOG_DIGEST, DATA_PLANE_RELEASE_DIGEST, DATA_PLANE_RELEASE_ID, DATA_PLANE_TRUST_DIGEST }
