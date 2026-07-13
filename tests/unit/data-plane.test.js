import { afterEach, describe, expect, it } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { canonicalJson } from '../../shared/canonical-json.js'
import {
  DATA_PLANE_ACTIVE_KEY_ID,
  DATA_PLANE_BASELINE_RELEASE_ID,
  DATA_PLANE_CANDIDATE_RELEASE_ID,
  DATA_PLANE_CATALOG_DIGEST,
  DATA_PLANE_DIFF_DIGEST,
  DATA_PLANE_DIFF_RESPONSE_DIGEST,
  DATA_PLANE_RELEASE_ID,
  DATA_PLANE_TRUST_DIGEST,
  FactoryCatalogEnvelopeSchema,
  FactoryReleaseEnvelopeSchema,
  FactoryTrustStoreSchema
} from '../../shared/data-plane-contracts.js'
import { createFactoryClient, validateLoopbackFactoryUrl } from '../../server/data-plane/client.js'
import { createDataPlaneService } from '../../server/data-plane/service.js'
import {
  parseCanonicalBytes,
  parsePartition,
  sha256,
  verifyCatalog,
  verifyManifest,
  verifyRecordClosure,
  verifySignedObject,
  verifyTrust
} from '../../server/data-plane/verification.js'
import { buildFactoryFixtureServer } from '../fixtures/data-plane-server.js'
import { isolatedTestRoot } from '../fixtures/test-root.js'

const FIXTURE_ROOT = resolve(process.cwd(), 'tests', 'fixtures', 'data-plane', 'public')
const releaseRoot = (releaseId) => resolve(FIXTURE_ROOT, 'releases', releaseId)
const TEST_ENV = { NODE_ENV: 'test' }
const servers = []
const services = []
const roots = []

afterEach(async () => {
  await Promise.allSettled(services.splice(0).map((service) => service.close()))
  await Promise.allSettled(servers.splice(0).map((server) => server.close()))
  await Promise.allSettled(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

async function fixtureClient(options = {}) {
  const server = await buildFactoryFixtureServer(options)
  servers.push(server)
  await server.listen({ host: '127.0.0.1', port: 0 })
  const port = server.server.address().port
  return { client: createFactoryClient({ ...TEST_ENV, BIOCHEMICAL_FACTORY_URL: `http://127.0.0.1:${port}` }), server }
}

async function verifiedBundle() {
  const { client } = await fixtureClient()
  return client.synchronize()
}

async function persistentRoot(prefix) {
  const root = await isolatedTestRoot(prefix)
  roots.push(root)
  return root
}

async function closeService(service) {
  await service.close()
  const index = services.indexOf(service)
  if (index >= 0) services.splice(index, 1)
}

describe('Goal 11 producer verification', () => {
  it('verifies the exact two-release public artifact pins and contains no private key material', async () => {
    const files = (await readdir(FIXTURE_ROOT, { recursive: true, withFileTypes: true })).filter((entry) => entry.isFile())
    const paths = files.map((entry) => resolve(entry.parentPath, entry.name))
    const catalog = await readFile(resolve(FIXTURE_ROOT, 'catalog.envelope.json'))
    const trust = await readFile(resolve(FIXTURE_ROOT, 'trust.json'))
    const diff = await readFile(resolve(FIXTURE_ROOT, 'diffs', `${DATA_PLANE_BASELINE_RELEASE_ID}--v2.0.1.json`))
    const baselineManifest = await readFile(resolve(releaseRoot(DATA_PLANE_BASELINE_RELEASE_ID), 'manifest.json'))
    const candidateManifest = await readFile(resolve(releaseRoot(DATA_PLANE_CANDIDATE_RELEASE_ID), 'manifest.json'))

    expect(sha256(catalog)).toBe(DATA_PLANE_CATALOG_DIGEST)
    expect(sha256(trust)).toBe(DATA_PLANE_TRUST_DIGEST)
    expect(sha256(diff)).toBe(DATA_PLANE_DIFF_RESPONSE_DIGEST)
    expect(JSON.parse(diff).diff_digest).toBe(DATA_PLANE_DIFF_DIGEST)
    expect(sha256(baselineManifest)).toBe('33f1830a8138bd47993d3732b6a7bda84c78ee1cc3abc4811cdcbf6902ebe5db')
    expect(sha256(candidateManifest)).toBe('bb54c85f1a87ff4fe8414ead85001d566329b4adb2a8aa7edf76495296cace0d')
    expect(paths.some((path) => /\.(?:pem|key)$/.test(path))).toBe(false)
    expect((await Promise.all(paths.map((path) => readFile(path)))).some((bytes) => bytes.includes('BEGIN PRIVATE KEY'))).toBe(false)
  })

  it('binds Ed25519 verification to payload, algorithm, key ID, signed time, and canonical raw-key aliases', async () => {
    const trust = verifyTrust(await readFile(resolve(FIXTURE_ROOT, 'trust.json')))
    const catalog = parseCanonicalBytes(await readFile(resolve(FIXTURE_ROOT, 'catalog.envelope.json')), FactoryCatalogEnvelopeSchema, 'catalog', DATA_PLANE_CATALOG_DIGEST)
    expect(() => verifySignedObject(catalog.payload, catalog.signature, trust)).not.toThrow()
    expect(() => verifySignedObject({ ...catalog.payload, published_at: '2026-07-14' }, catalog.signature, trust)).toThrow(/Invalid Ed25519 signature/)
    expect(() => verifySignedObject(catalog.payload, { ...catalog.signature, algorithm: 'Other' }, trust)).toThrow(/Invalid Ed25519 signature/)
    expect(() => verifySignedObject(catalog.payload, { ...catalog.signature, key_id: 'unknown-key' }, trust)).toThrow(/Unknown signing key/)
    expect(() => verifySignedObject(catalog.payload, { ...catalog.signature, signed_at: '2026-07-13T00:00:01Z' }, trust)).toThrow(/Invalid Ed25519 signature/)

    const alias = structuredClone(trust)
    alias.keys.push({ ...alias.keys[0], key_id: 'aliased-key' })
    expect(FactoryTrustStoreSchema.safeParse(alias).success).toBe(false)
    alias.keys.at(-1).public_key += '='
    expect(FactoryTrustStoreSchema.safeParse(alias).success).toBe(false)
  })

  it('rejects tampered trust, catalog signatures, and either pinned manifest', async () => {
    const trustBytes = await readFile(resolve(FIXTURE_ROOT, 'trust.json'))
    const trustValue = JSON.parse(trustBytes)
    const tamperedTrust = Buffer.from(canonicalJson({ ...trustValue, keys: trustValue.keys.map((key) => key.key_id === DATA_PLANE_ACTIVE_KEY_ID ? { ...key, status: 'revoked' } : key) }))
    expect(() => verifyTrust(tamperedTrust)).toThrow(/independent pin/)

    const trust = verifyTrust(trustBytes)
    const catalogBytes = await readFile(resolve(FIXTURE_ROOT, 'catalog.envelope.json'))
    const catalog = JSON.parse(catalogBytes)
    const signature = Buffer.from(catalog.signature.value, 'base64url')
    signature[0] ^= 1
    catalog.signature.value = signature.toString('base64url')
    expect(() => verifySignedObject(catalog.payload, catalog.signature, trust)).toThrow(/Invalid Ed25519 signature/)

    const verifiedCatalog = verifyCatalog(catalogBytes, trust)
    for (const releaseId of [DATA_PLANE_BASELINE_RELEASE_ID, DATA_PLANE_CANDIDATE_RELEASE_ID]) {
      const envelope = parseCanonicalBytes(await readFile(resolve(releaseRoot(releaseId), 'envelope.json')), FactoryReleaseEnvelopeSchema, 'envelope')
      const manifest = JSON.parse(await readFile(resolve(releaseRoot(releaseId), 'manifest.json')))
      manifest.title = 'tampered title'
      expect(() => verifyManifest(Buffer.from(canonicalJson(manifest)), verifiedCatalog.entries.get(releaseId), envelope)).toThrow(/SHA-256/)
    }
  })

  it('rejects partition bytes, noncanonical framing, and cross-record failures', async () => {
    const bundle = await verifiedBundle()
    const snapshot = bundle.releases.get(DATA_PLANE_CANDIDATE_RELEASE_ID)
    const entry = snapshot.manifest.partitions.find((item) => item.record_type === 'taxa')
    const bytes = snapshot.bytes.partitions.get(entry.path)
    expect(() => parsePartition(Buffer.concat([bytes, Buffer.from(' ')]), entry)).toThrow(/digest or byte count/)
    const unframed = bytes.subarray(0, -1)
    expect(() => parsePartition(unframed, { ...entry, bytes: unframed.length, sha256: sha256(unframed) })).toThrow(/framing/)
    const noncanonical = Buffer.from('{"scientific_name": "Mus musculus", "id":"NCBITaxon:10090"}\n')
    expect(() => parsePartition(noncanonical, { ...entry, bytes: noncanonical.length, sha256: sha256(noncanonical), record_count: 1, first_id: 'NCBITaxon:10090', last_id: 'NCBITaxon:10090' })).toThrow(/canonical|contract/)

    const parsed = new Map(snapshot.manifest.partitions.map((partition) => [partition.path, parsePartition(snapshot.bytes.partitions.get(partition.path), partition)]))
    const catalysisEntry = snapshot.manifest.partitions.find((item) => item.record_type === 'catalysis')
    const changed = new Map([...parsed].map(([path, records]) => [path, structuredClone(records)]))
    changed.get(catalysisEntry.path)[0].reference_ids = ['PubMed:1']
    expect(() => verifyRecordClosure(snapshot.manifest, changed)).toThrow(/unresolved reference/)
  })

  it('rejects producer pages that do not equal partition records and probes a changed compatible filter', async () => {
    let changedFilterProbe = false
    const { client } = await fixtureClient({
      onRecordRequest(recordType, query) {
        if (recordType === 'compounds' && query.cursor && query.id === 'CHEBI:15377') changedFilterProbe = true
      },
      transformPage(recordType, page, query, releaseId) {
        return releaseId === DATA_PLANE_CANDIDATE_RELEASE_ID && recordType === 'compounds' && !query.cursor ? { ...page, items: page.items.slice(0, 1) } : page
      }
    })
    await expect(client.synchronize()).rejects.toThrow(/does not equal partition records/)
    expect(changedFilterProbe).toBe(true)
  })

  it('restricts factory upstreams to literal loopback origins', () => {
    expect(validateLoopbackFactoryUrl('http://127.0.0.1:8000')).toBe('http://127.0.0.1:8000')
    expect(validateLoopbackFactoryUrl('http://[::1]:8000')).toBe('http://[::1]:8000')
    for (const value of ['https://127.0.0.1:8000', 'http://localhost:8000', 'http://127.0.0.2:8000', 'http://user:pass@127.0.0.1:8000', 'http://127.0.0.1:8000/path']) expect(() => validateLoopbackFactoryUrl(value)).toThrow(/restricted|loopback/)
  })
})

describe('Goal 11 persistent local mirror', () => {
  it('publishes two releases and one separate diff atomically, rolling back staged failures', async () => {
    const { client } = await fixtureClient()
    const root = await persistentRoot('data-plane-rollback')
    const service = await createDataPlaneService({ root, env: TEST_ENV, client, exposeTesting: true, hooks: { beforeCommit() { throw new Error('publication probe') } } })
    services.push(service)

    await expect(service.sync()).rejects.toThrow('publication probe')
    expect(service.listReleases()).toEqual([])
    expect(service.testing.database.prepare('SELECT COUNT(*) AS count FROM generations').get().count).toBe(0)
    expect(service.testing.database.prepare('SELECT COUNT(*) AS count FROM release_diffs').get().count).toBe(0)
    expect(await service.testing.objects.inventory()).toEqual([])
    expect(service.status()).toMatchObject({ state: 'failed', release: null })
  })

  it('restarts from exact SQLite/CAS closure and fails closed on denormalized index corruption', async () => {
    const { client } = await fixtureClient()
    const root = await persistentRoot('data-plane-index-corruption')
    let service = await createDataPlaneService({ root, env: TEST_ENV, client, exposeTesting: true })
    await service.sync()
    await closeService(service)

    const database = new DatabaseSync(resolve(root, 'data-plane.sqlite3'))
    database.exec('DROP TRIGGER data_plane_records_immutable_update')
    database.prepare("UPDATE records SET taxon_id = 'NCBITaxon:10090' WHERE record_type = 'proteins' AND id = 'UniProtKB:P34896'").run()
    database.close()

    service = await createDataPlaneService({ root, env: TEST_ENV, client, exposeTesting: true })
    services.push(service)
    expect(service.status()).toMatchObject({ state: 'failed', integrity: 'failed' })
    expect((await service.integrity()).findings[0]).toMatch(/record index disagrees/)
    expect(() => service.page(DATA_PLANE_RELEASE_ID, 'compounds', { limit: 2 })).toThrow(/integrity verification failed/)
  })

  it('fails all reads when post-publication integrity verification detects corruption', async () => {
    const { client } = await fixtureClient()
    const root = await persistentRoot('data-plane-post-publication-corruption')
    const service = await createDataPlaneService({
      root,
      env: TEST_ENV,
      client,
      hooks: {
        afterPublish({ database }) {
          database.exec('DROP TRIGGER data_plane_records_immutable_update')
          database.prepare("UPDATE records SET taxon_id = 'NCBITaxon:10090' WHERE record_type = 'proteins' AND id = 'UniProtKB:P34896'").run()
        }
      }
    })
    services.push(service)

    await expect(service.sync()).rejects.toThrow(/record index disagrees/)
    expect(service.status()).toMatchObject({ state: 'failed', integrity: 'failed' })
    expect(() => service.page(DATA_PLANE_RELEASE_ID, 'proteins', { limit: 2, taxon_id: 'NCBITaxon:10090' })).toThrow(/integrity verification failed/)
  })

  it('rejects unknown or extra database rows and unindexed object files on restart', async () => {
    const { client } = await fixtureClient()
    const root = await persistentRoot('data-plane-extra-closure')
    let service = await createDataPlaneService({ root, env: TEST_ENV, client })
    await service.sync()
    await closeService(service)

    const database = new DatabaseSync(resolve(root, 'data-plane.sqlite3'))
    database.exec('PRAGMA ignore_check_constraints = ON')
    const generationId = database.prepare('SELECT generation_id FROM generations LIMIT 1').get().generation_id
    database.prepare("INSERT INTO records (generation_id, record_type, id, encoded) VALUES (?, 'unknown', 'UNKNOWN:1', ?)").run(generationId, Buffer.from('{}'))
    database.close()
    service = await createDataPlaneService({ root, env: TEST_ENV, client })
    expect(service.status()).toMatchObject({ state: 'failed', integrity: 'failed' })
    await closeService(service)

    const cleanRoot = await persistentRoot('data-plane-extra-file')
    service = await createDataPlaneService({ root: cleanRoot, env: TEST_ENV, client, exposeTesting: true })
    await service.sync()
    const extraBytes = Buffer.from('unindexed object')
    const extraDigest = sha256(extraBytes)
    const extraPath = service.testing.objects.path(extraDigest)
    await closeService(service)
    await mkdir(dirname(extraPath), { recursive: true, mode: 0o700 })
    await writeFile(extraPath, extraBytes, { mode: 0o600 })
    service = await createDataPlaneService({ root: cleanRoot, env: TEST_ENV, client })
    services.push(service)
    expect(service.status()).toMatchObject({ state: 'failed', integrity: 'failed' })
    expect((await service.integrity()).findings[0]).toMatch(/missing, extra, or unindexed object files/)
  })

  it('rejects symlinked root ancestors, SQLite files, CAS roots, and object destinations', async () => {
    const parent = await persistentRoot('data-plane-symlinks')
    const realRoot = resolve(parent, 'real-root')
    const linkedRoot = resolve(parent, 'linked-root')
    await mkdir(realRoot, { mode: 0o700 })
    await symlink(realRoot, linkedRoot, 'dir')
    await expect(createDataPlaneService({ root: linkedRoot, env: TEST_ENV })).rejects.toThrow(/symbolic links are forbidden/)

    const dbRoot = resolve(parent, 'db-root')
    await mkdir(dbRoot, { mode: 0o700 })
    const outsideDb = resolve(parent, 'outside.sqlite3')
    await writeFile(outsideDb, '')
    await symlink(outsideDb, resolve(dbRoot, 'data-plane.sqlite3'))
    await expect(createDataPlaneService({ root: dbRoot, env: TEST_ENV })).rejects.toThrow(/SQLite path|symbolic links/)

    const casRoot = resolve(parent, 'cas-root')
    const outsideObjects = resolve(parent, 'outside-objects')
    await mkdir(casRoot, { mode: 0o700 })
    await mkdir(outsideObjects, { mode: 0o700 })
    await symlink(outsideObjects, resolve(casRoot, 'objects'), 'dir')
    await expect(createDataPlaneService({ root: casRoot, env: TEST_ENV })).rejects.toThrow(/symbolic links are forbidden/)

    const destinationRoot = resolve(parent, 'destination-root')
    const service = await createDataPlaneService({ root: destinationRoot, env: TEST_ENV, exposeTesting: true })
    services.push(service)
    const bytes = Buffer.from('destination attack')
    const destination = service.testing.objects.path(sha256(bytes))
    await mkdir(dirname(destination), { recursive: true, mode: 0o700 })
    const target = resolve(parent, 'target-object')
    await writeFile(target, bytes)
    await symlink(target, destination)
    await expect(service.testing.objects.put(bytes)).rejects.toThrow(/symbolic links are forbidden|ELOOP/)
  })

  it('cleans only recognized regular staged temp files and rejects dirty staging entries', async () => {
    const root = await persistentRoot('data-plane-staging')
    let service = await createDataPlaneService({ root, env: TEST_ENV })
    await closeService(service)
    await writeFile(resolve(root, 'staging', '00000000-0000-4000-8000-000000000000.tmp'), 'staged', { mode: 0o600 })
    service = await createDataPlaneService({ root, env: TEST_ENV })
    expect(await readdir(resolve(root, 'staging'))).toEqual([])
    await closeService(service)
    await writeFile(resolve(root, 'staging', 'unknown.file'), 'dirty', { mode: 0o600 })
    await expect(createDataPlaneService({ root, env: TEST_ENV })).rejects.toThrow(/unsafe or unknown entry/)
  })

  it('uses release/query/filter-bound local HMAC cursors and rejects tampering', async () => {
    const { client } = await fixtureClient()
    const service = await createDataPlaneService({ env: TEST_ENV, client, exposeTesting: true })
    services.push(service)
    await service.sync()
    const first = service.page(DATA_PLANE_RELEASE_ID, 'compounds', { limit: 1 })
    expect(first.nextCursor).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(service.page(DATA_PLANE_RELEASE_ID, 'compounds', { limit: 1, cursor: first.nextCursor }).items[0].id).toBe('CHEBI:15636')
    expect(() => service.page(DATA_PLANE_RELEASE_ID, 'compounds', { limit: 2, cursor: first.nextCursor })).toThrow(/different release, schema, query, sort, or limit/)
    expect(() => service.page(DATA_PLANE_BASELINE_RELEASE_ID, 'compounds', { limit: 1, cursor: first.nextCursor })).toThrow(/different release, schema, query, sort, or limit/)
    expect(() => service.page(DATA_PLANE_RELEASE_ID, 'compounds', { limit: 1, id: 'CHEBI:15377', cursor: first.nextCursor })).toThrow(/different release, schema, query, sort, or limit/)
    const changed = `${first.nextCursor.slice(0, -1)}${first.nextCursor.endsWith('A') ? 'B' : 'A'}`
    expect(() => service.page(DATA_PLANE_RELEASE_ID, 'compounds', { limit: 1, cursor: changed })).toThrow(/invalid or tampered/)
  })

  it('prevents an older sync from publishing or overwriting lifecycle after every awaited stage', async () => {
    const bundle = await verifiedBundle()
    let releaseFirstStage
    let stageStarted
    const firstStage = new Promise((resolvePromise) => { releaseFirstStage = resolvePromise })
    const reachedStage = new Promise((resolvePromise) => { stageStarted = resolvePromise })
    let stageCalls = 0
    const client = { synchronize: async () => bundle }
    const service = await createDataPlaneService({
      env: TEST_ENV,
      client,
      exposeTesting: true,
      hooks: {
        async afterStage() {
          stageCalls += 1
          if (stageCalls === 1) {
            stageStarted()
            await firstStage
          }
        }
      }
    })
    services.push(service)
    const stale = service.sync()
    await reachedStage
    const current = service.sync()
    releaseFirstStage()
    await expect(stale).rejects.toMatchObject({ name: 'AbortError' })
    await expect(current).resolves.toMatchObject({ state: 'ready', release: { id: DATA_PLANE_CANDIDATE_RELEASE_ID } })
    expect(service.testing.database.prepare('SELECT COUNT(*) AS count FROM generations').get().count).toBe(2)
    expect(service.testing.database.prepare('SELECT COUNT(*) AS count FROM release_diffs').get().count).toBe(1)
    expect(service.status()).toMatchObject({ state: 'ready', integrity: 'valid' })
  })

  it('serves both releases, the pairwise diff, and deterministic audits fully offline', async () => {
    const { client, server } = await fixtureClient()
    const root = await persistentRoot('data-plane-offline-audit')
    let service = await createDataPlaneService({ root, env: TEST_ENV, client })
    await service.sync()
    await server.close()
    servers.splice(servers.indexOf(server), 1)

    const baseline = await service.releaseDetail(DATA_PLANE_BASELINE_RELEASE_ID)
    const candidate = await service.releaseDetail(DATA_PLANE_CANDIDATE_RELEASE_ID)
    expect(baseline).toMatchObject({ release: { digest: '310bd8a04320c9b1bd9d4e18795bd998627265ac11b1c0e2b07a0473ba48f8e0' }, signer: { status: 'retired' } })
    expect(candidate).toMatchObject({ release: { digest: '9dad9f1ac92ff2c53810867414c7729a1ee97425213b9749482ebe2fd37874b5' }, signer: { status: 'active' } })
    expect((await service.diff(DATA_PLANE_BASELINE_RELEASE_ID, DATA_PLANE_CANDIDATE_RELEASE_ID)).counts).toEqual({ added: 0, removed: 0, changed: 1, unchanged: 16 })

    const first = await service.audit(DATA_PLANE_CANDIDATE_RELEASE_ID, DATA_PLANE_BASELINE_RELEASE_ID)
    const second = await service.audit(DATA_PLANE_CANDIDATE_RELEASE_ID, DATA_PLANE_BASELINE_RELEASE_ID)
    expect(second).toEqual(first)
    expect(first).toMatchObject({
      algorithmVersion: 'authority-closure-audit-v1.0.0',
      release: { id: DATA_PLANE_CANDIDATE_RELEASE_ID },
      baseline: { id: DATA_PLANE_BASELINE_RELEASE_ID },
      pins: { catalogDigest: DATA_PLANE_CATALOG_DIGEST, trustDigest: DATA_PLANE_TRUST_DIGEST },
      difference: { digest: DATA_PLANE_DIFF_DIGEST, responseDigest: DATA_PLANE_DIFF_RESPONSE_DIGEST, classes: { scientific: 1 } },
      results: { totalRecords: 17, reactionBalance: { checked: 1, passed: true }, taxonCatalysisClosure: { passed: true }, referenceClosure: { unresolvedReferences: 0, passed: true }, allChecksPassed: true },
      scientificValidation: 'unsupported'
    })
    expect(first.partitions.every((item) => item.sha256 && item.record_count && item.first_id && item.last_id)).toBe(true)
    expect(first.sources.every((item) => item.sourceObject.sha256 && item.sourceObject.bytes && item.adapter.implementation_sha256 && item.adapter.package_sha256 && item.license.attribution)).toBe(true)
    expect(service.listAudits()).toHaveLength(1)
    expect(service.auditDetail(first.reportDigest)).toEqual(first)
    await closeService(service)

    service = await createDataPlaneService({ root, env: TEST_ENV, client })
    services.push(service)
    expect(service.status()).toMatchObject({ state: 'ready', release: { id: DATA_PLANE_CANDIDATE_RELEASE_ID } })
    expect(service.auditDetail(first.reportDigest)).toEqual(first)
    await closeService(service)

    const changed = structuredClone(first)
    changed.pins.manifestDigest = '0'.repeat(64)
    delete changed.reportDigest
    changed.reportDigest = sha256(Buffer.from(canonicalJson(changed)))
    const database = new DatabaseSync(resolve(root, 'data-plane.sqlite3'))
    database.exec('DROP TRIGGER data_plane_audits_immutable_update')
    database.prepare('UPDATE authority_closure_audits SET report_digest = ?, encoded = ?').run(changed.reportDigest, Buffer.from(canonicalJson(changed)))
    database.close()
    service = await createDataPlaneService({ root, env: TEST_ENV, client })
    services.push(service)
    expect(service.status()).toMatchObject({ state: 'failed', integrity: 'failed' })
    expect((await service.integrity()).findings[0]).toMatch(/invalid immutable identity or release pins/)
  })
})
