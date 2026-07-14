import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { canonicalJson } from '../../shared/canonical-json.js'
import {
  CalibrationRequestSchema,
  ConsumerCommitmentSchema,
  MEASURED_GROUP_IDS,
  MEASURED_HELDOUT_PARTITION_DIGEST,
  MEASURED_HELDOUT_PARTITION_ID,
  MEASURED_RELEASE_DIGEST,
  MEASURED_RELEASE_ID
} from '../../shared/measured-contracts.js'
import { createMeasuredClient, validateMeasuredProtectedConfig, verifyEvaluationReceipt } from '../../server/measured/client.js'
import { createMeasuredService } from '../../server/measured/service.js'
import { verifyMeasuredTrust } from '../../server/measured/verification.js'

const fixtureRoot = resolve('tests/fixtures/measured/public')
const roots = []
const clientEnv = {
  BIOCHEMICAL_MEASURED_URL: 'http://127.0.0.1:8011',
  BIOCHEMICAL_MEASURED_ALLOWED_ORIGIN: 'http://127.0.0.1:5173',
  BIOCHEMICAL_MEASURED_CSRF_TOKEN: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
}
const serviceEnv = { ...clientEnv, NODE_ENV: 'test', BIOCHEMICAL_MEASURED_CURSOR_SECRET: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' }
const selection = {
  familyId: 'family:cebs:study-c55801c', groupIds: MEASURED_GROUP_IDS, observableId: 'observable:cebs:alt',
  partitionId: 'partition:calibration:cebs-c55801c', studyId: 'study:cebs:002-01586-0004-0000-6', timeUnit: 'h', timeValue: '24'
}
const frozenRequest = () => ConsumerCommitmentSchema.parse({ commitment_schema_version: '1.0.0', release_id: MEASURED_RELEASE_ID, release_digest: MEASURED_RELEASE_DIGEST, consumer_id: 'consumer:test', model_digest: '1'.repeat(64), parameter_policy_digest: '2'.repeat(64), endpoint_mapping_digest: '3'.repeat(64), metric_threshold_policy_digest: '4'.repeat(64), prediction_digest: '5'.repeat(64), target_partition_id: MEASURED_HELDOUT_PARTITION_ID, target_partition_digest: MEASURED_HELDOUT_PARTITION_DIGEST, target_partition_role: 'external-held-out', family_ids: ['family:zenodo:7648975'], observable_ids: ['observable:renal-gsh'], nonce: 'protected-error-test-0001', created_at: '2026-07-14T00:00:00Z' })
const disclosedItem = (group, reported, normalized, annotation, sem) => ({ family_id: 'family:zenodo:7648975', group_id: `group:zenodo7648975:${group}`, measurement_id: `measurement:zenodo7648975:${group}:gsh`, normalized: { scientific_origin: 'derived-measurement', transformation_id: 'transformation:mmol-g-identity', unit: 'mmol/g', value: normalized }, observable_id: 'observable:renal-gsh', reported_annotations: [annotation], reported_unit: 'mmol/g', reported_value: reported, study_id: 'study:zenodo:7648975', uncertainty: { id: `uncertainty:zenodo7648975:${group}:gsh`, kind: 'sem', measurement_id: `measurement:zenodo7648975:${group}:gsh`, n: 6, unit: 'mmol/g', value: sem } })

function disclosureResponse(evaluation) {
  return { commitment_digest: evaluation.commitment_digest, disclosed_at: '2026-07-14T00:00:01Z', evaluation_contract: 'consumer-measured-disclosure-v1', items: [disclosedItem('c', '2.63', '2.63', 'ab', '0.04'), disclosedItem('d200', '2.74', '2.74', 'a', '0.05'), disclosedItem('d250', '2.700', '2.7', 'a', '0.06'), disclosedItem('prc-d200', '2.57', '2.57', 'ab', '0.04'), disclosedItem('prc-d250', '2.49', '2.49', 'b', '0.05'), disclosedItem('prc', '2.47', '2.47', 'b', '0.05')], partition: { closure_digest: MEASURED_HELDOUT_PARTITION_DIGEST, family_ids: ['family:zenodo:7648975'], id: MEASURED_HELDOUT_PARTITION_ID, role: 'external-held-out', study_ids: ['study:zenodo:7648975'] }, release: { digest: MEASURED_RELEASE_DIGEST, id: MEASURED_RELEASE_ID, schema_version: '1.0.0' } }
}

afterEach(async () => Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))))

const sha256 = (value) => createHash('sha256').update(value).digest('hex')

async function fixtureFetch(log = [], mutate = {}) {
  const index = JSON.parse(await readFile(resolve(fixtureRoot, 'index.json'), 'utf8'))
  return async (raw, init = {}) => {
    const url = new URL(raw)
    const key = `${url.pathname}${url.search}`
    log.push({ method: init.method ?? 'GET', key })
    if (url.searchParams.has('cursor') && !index[key]) return new Response(null, { status: 422 })
    const filename = index[key]
    if (!filename) return new Response(null, { status: 404 })
    let bytes = await readFile(resolve(fixtureRoot, filename))
    if (mutate[key]) bytes = Buffer.from(canonicalJson(mutate[key](JSON.parse(bytes))))
    const releaseBound = url.pathname.includes(`/releases/${MEASURED_RELEASE_ID}`)
    return new Response(bytes, { status: 200, headers: {
      'content-type': 'application/json', 'content-length': String(bytes.length),
      'cache-control': releaseBound ? 'public, max-age=31536000, immutable' : 'public, max-age=60',
      etag: `"sha256:${sha256(bytes)}"`, ...(releaseBound ? { 'x-release-digest': MEASURED_RELEASE_DIGEST } : {})
    } })
  }
}

async function exactBundle() {
  return createMeasuredClient(clientEnv, { fetchImpl: await fixtureFetch() }).synchronize()
}

function fakeUpstream(bundle, overrides = {}) {
  return {
    synchronize: vi.fn(async () => bundle),
    commit: vi.fn(async (frozen) => ({ commitment_contract: 'consumer-measured-commitment-v1', commitment_digest: sha256(canonicalJson(frozen)), committed_at: frozen.created_at, created_at: frozen.created_at, target_partition_digest: frozen.target_partition_digest })),
    evaluate: vi.fn(() => { throw new Error('evaluation must not be reachable') }),
    ...overrides
  }
}

async function temporaryRoot() {
  const root = await mkdtemp(resolve(tmpdir(), 'biochemical-measured-v2-test-'))
  roots.push(root)
  return root
}

describe('signed measured v1.0.1 client', () => {
  it('verifies all ten signed roots and exact selected lineage root without candidates or heldout requests', async () => {
    const requests = []
    const bundle = await createMeasuredClient(clientEnv, { fetchImpl: await fixtureFetch(requests) }).synchronize()
    expect(bundle.release).toMatchObject({ id: MEASURED_RELEASE_ID, digest: MEASURED_RELEASE_DIGEST })
    expect(bundle.transport.signedRoots).toEqual({ apiViews: 10, selectedLineages: 35, selectedLineageRoot: '08094df6e24b2325c5760769beba74fdb5c1dc9a19e6ee6d1eed1fb3387fdcd3' })
    expect(bundle.records.measurements).toHaveLength(1538)
    expect(bundle.records.missingness).toHaveLength(88)
    expect(bundle.lineages.size).toBe(35)
    expect(requests.some((request) => request.key.includes('/candidates'))).toBe(false)
    expect(requests.some((request) => request.key.includes('role=external-held-out') || request.key.endsWith('/evaluation'))).toBe(false)
    expect(requests.some((request) => request.key.includes('limit=99'))).toBe(true)
  })

  it.each([
    ['value', (page) => { page.items[0].reported_value = '999' }],
    ['role relabel', (page) => { page.items[0].role = 'development' }],
    ['omission', (page) => { page.items.splice(0, 1) }],
    ['duplication', (page) => { page.items[1] = page.items[0] }],
    ['order', (page) => { [page.items[0], page.items[1]] = [page.items[1], page.items[0]] }]
  ])('rejects signed calibration root %s tampering despite a recomputed valid page ETag', async (_label, alter) => {
    const path = `/api/measured/v1/releases/${MEASURED_RELEASE_ID}/measurements?role=calibration&limit=100`
    const fetchImpl = await fixtureFetch([], { [path]: (page) => { alter(page); return page } })
    await expect(createMeasuredClient(clientEnv, { fetchImpl }).synchronize()).rejects.toThrow(/signed API root|duplicate, or order|role counts|uniquely ordered/)
  })

  it('rejects selected lineage tampering under a valid response ETag', async () => {
    const path = `/api/measured/v1/releases/${MEASURED_RELEASE_ID}/lineage/${encodeURIComponent('measurement:cebs0004:0113:h24:alt')}`
    const fetchImpl = await fixtureFetch([], { [path]: (response) => { response.lineage.uncertainty.kind = 'sem'; response.lineage.uncertainty.value = '1'; response.lineage.uncertainty.unit = 'IU/L'; response.lineage.uncertainty.n = 1; return response } })
    await expect(createMeasuredClient(clientEnv, { fetchImpl }).synchronize()).rejects.toThrow(/selected-lineage signed root/)
  })

  it('rejects unknown trust fields and invalid protected startup configuration', async () => {
    const value = JSON.parse(await readFile(resolve(fixtureRoot, '001.json')))
    value.trust.keys[0].unexpected = true
    expect(() => verifyMeasuredTrust(Buffer.from(canonicalJson(value)))).toThrow(/strict measured contract/)
    for (const env of [
      { BIOCHEMICAL_MEASURED_ALLOWED_ORIGIN: 'not-an-origin', BIOCHEMICAL_MEASURED_CSRF_TOKEN: clientEnv.BIOCHEMICAL_MEASURED_CSRF_TOKEN },
      { BIOCHEMICAL_MEASURED_ALLOWED_ORIGIN: 'http://127.0.0.1:5173/path', BIOCHEMICAL_MEASURED_CSRF_TOKEN: clientEnv.BIOCHEMICAL_MEASURED_CSRF_TOKEN },
      { BIOCHEMICAL_MEASURED_ALLOWED_ORIGIN: 'http://127.0.0.1:5173', BIOCHEMICAL_MEASURED_CSRF_TOKEN: 'not_canonical' }
    ]) expect(() => validateMeasuredProtectedConfig(env)).toThrow()
  })

  it.each([400, 403, 409, 422, 503])('validates private headers and does not read a protected %s body', async (status) => {
    let read = false
    const fetchImpl = async () => ({ status, headers: new Headers({ 'content-type': 'application/json', 'cache-control': 'private, no-store', 'x-release-digest': MEASURED_RELEASE_DIGEST }), body: { getReader() { read = true; throw new Error('private error body was read') } } })
    const client = createMeasuredClient(clientEnv, { fetchImpl })
    await expect(client.commit(frozenRequest())).rejects.toMatchObject({ statusCode: status })
    expect(read).toBe(false)
  })

  it.each(['digest', 'created_at', 'partition'])('rejects a commitment receipt %s mismatch', async (field) => {
    const frozen = frozenRequest()
    const valid = { commitment_contract: 'consumer-measured-commitment-v1', commitment_digest: sha256(canonicalJson(frozen)), committed_at: frozen.created_at, created_at: frozen.created_at, target_partition_digest: frozen.target_partition_digest }
    if (field === 'digest') valid.commitment_digest = '0'.repeat(64)
    if (field === 'created_at') valid.created_at = '2026-07-14T00:00:01Z'
    if (field === 'partition') valid.target_partition_digest = '0'.repeat(64)
    const bytes = Buffer.from(canonicalJson(valid))
    const fetchImpl = async () => new Response(bytes, { status: 200, headers: { 'content-type': 'application/json', 'content-length': String(bytes.length), 'cache-control': 'private, no-store', 'x-release-digest': MEASURED_RELEASE_DIGEST } })
    await expect(createMeasuredClient(clientEnv, { fetchImpl }).commit(frozen)).rejects.toThrow(/does not bind/)
  })

  it('rejects evaluation partition, duplicate ID, and uncertainty identity mismatches', () => {
    const frozen = frozenRequest()
    const evaluation = { evaluation_schema_version: '1.0.0', commitment_digest: sha256(canonicalJson(frozen)), frozen_request: frozen }
    const response = disclosureResponse(evaluation)
    expect(verifyEvaluationReceipt(structuredClone(response), evaluation)).toEqual(response)
    const wrongPartition = structuredClone(response); wrongPartition.partition.closure_digest = '0'.repeat(64)
    expect(() => verifyEvaluationReceipt(wrongPartition, evaluation)).toThrow(/release or partition/)
    const duplicate = structuredClone(response); duplicate.items[1] = duplicate.items[0]
    expect(() => verifyEvaluationReceipt(duplicate, evaluation)).toThrow(/duplicate|exact six/)
    const wrongUncertainty = structuredClone(response); wrongUncertainty.items[0].uncertainty.measurement_id = wrongUncertainty.items[1].measurement_id
    expect(() => verifyEvaluationReceipt(wrongUncertainty, evaluation)).toThrow(/uncertainty identity/)
  })
})

describe('measured local publication, calibration, and freeze', () => {
  it('requires the exact five-group tuple', () => {
    expect(() => CalibrationRequestSchema.parse({ ...selection, groupIds: MEASURED_GROUP_IDS.slice(0, 4) })).toThrow()
    expect(() => CalibrationRequestSchema.parse({ ...selection, groupIds: [...MEASURED_GROUP_IDS].reverse() })).toThrow()
    expect(CalibrationRequestSchema.parse(selection).groupIds).toEqual(MEASURED_GROUP_IDS)
  })

  it('persists signed non-heldout closure, instrumented calibration access, and artifact-bound freeze', async () => {
    const bundle = await exactBundle()
    const upstream = fakeUpstream(bundle)
    const root = await temporaryRoot()
    const service = await createMeasuredService({ root, env: serviceEnv, client: upstream, exposeTesting: true })
    expect((await service.sync()).state).toBe('ready')
    const artifact = await service.calibrate(selection)
    expect(artifact).toMatchObject({ status: 'not-evaluable', fit: null, conclusion: 'no-validation-conclusion' })
    expect(artifact.accessProof).toMatchObject({ calls: { calibrationMeasurements: 1 }, rows: { calibrationMeasurements: 34 }, rolesObserved: ['calibration'], forbiddenMethodsAvailable: false, developmentMeasurementsRead: 0, externalHeldoutMeasurementsRead: 0 })
    expect(upstream.evaluate).not.toHaveBeenCalled()
    const intent = { calibrationArtifactDigest: artifact.artifactDigest, targetPartitionId: MEASURED_HELDOUT_PARTITION_ID, nonce: 'artifact-bound-freeze-0001', createdAt: '2026-07-14T00:00:00Z' }
    const frozen = await service.freeze(intent)
    expect(frozen.frozenRequest.model_digest).toBe(artifact.artifactDigest)
    expect(frozen.artifacts.prediction).toMatchObject({ kind: 'prediction' })
    expect(frozen.frozenRequest.prediction_digest).toBe(frozen.artifacts.prediction.digest)
    expect(frozen.receipt.commitment_digest).toBe(sha256(canonicalJson(frozen.frozenRequest)))
    const repeated = await service.freeze(intent)
    expect(repeated).toEqual(frozen)
    await expect(service.freeze({ ...intent, calibrationArtifactDigest: '0'.repeat(64) })).rejects.toThrow(/nonce|artifact/)
    const predictionBytes = await service.testing.objects.get(frozen.artifacts.prediction.digest)
    expect(JSON.parse(predictionBytes)).toMatchObject({ status: 'not-evaluable', predictionCount: 0, predictions: [] })
    expect(await service.integrity()).toMatchObject({ status: 'valid', records: 1669 })
    const blobs = service.testing.database.prepare("SELECT encoded AS value FROM records UNION ALL SELECT encoded FROM lineages UNION ALL SELECT frozen_request FROM freezes UNION ALL SELECT receipt FROM freezes").all().map((row) => Buffer.from(row.value).toString('utf8')).join('\n')
    expect(blobs).not.toContain('measurement:zenodo7648975')
    for (const value of ['2.63', '2.74', '2.700', '2.57', '2.49', '2.47']) expect(blobs).not.toContain(`"reported_value":"${value}"`)
    for (const digest of await service.testing.objects.inventory()) {
      const content = (await service.testing.objects.get(digest)).toString('utf8')
      expect(content).not.toContain('measurement:zenodo7648975')
      for (const value of ['2.63', '2.74', '2.700', '2.57', '2.49', '2.47']) expect(content).not.toContain(`"reported_value":"${value}"`)
    }
    await service.close()
    const restarted = await createMeasuredService({ root, env: serviceEnv, client: upstream })
    expect(restarted.status()).toMatchObject({ state: 'ready', integrity: 'valid' })
    expect(await restarted.calibration(artifact.artifactDigest)).toEqual(artifact)
    await restarted.close()
  }, 30_000)

  it.each(['before-transaction', 'after-transaction'])('recovers a durable publication journal crash %s', async (point) => {
    const bundle = await exactBundle()
    const root = await temporaryRoot()
    const hooks = point === 'before-transaction'
      ? { afterCas: async () => { throw new Error('simulated crash before transaction') } }
      : { afterDatabaseCommit: async () => { throw new Error('simulated crash after transaction') } }
    const failed = await createMeasuredService({ root, env: serviceEnv, client: fakeUpstream(bundle), hooks })
    await expect(failed.sync()).rejects.toThrow(/simulated crash/)
    await failed.close()
    const recovered = await createMeasuredService({ root, env: serviceEnv, client: fakeUpstream(bundle) })
    if (point === 'before-transaction') expect(recovered.status().state).toBe('empty')
    else expect(recovered.status()).toMatchObject({ state: 'ready', integrity: 'valid' })
    expect((await recovered.sync()).state).toBe('ready')
    await recovered.close()
  }, 30_000)

  it.each(['after-cas', 'after-database'])('recovers calibration artifact publication crash %s and retries cleanly', async (point) => {
    const bundle = await exactBundle()
    const root = await temporaryRoot()
    let crashed = false
    const crash = async ({ kind }) => {
      if (!crashed && kind === 'calibration') {
        crashed = true
        throw new Error(`simulated calibration artifact crash ${point}`)
      }
    }
    const hooks = point === 'after-cas' ? { afterArtifactCas: crash } : { afterArtifactDatabaseCommit: crash }
    const failed = await createMeasuredService({ root, env: serviceEnv, client: fakeUpstream(bundle), hooks, exposeTesting: true })
    await failed.sync()
    await expect(failed.calibrate(selection)).rejects.toThrow(/simulated calibration artifact crash/)
    await failed.close()

    const recovered = await createMeasuredService({ root, env: serviceEnv, client: fakeUpstream(bundle), exposeTesting: true })
    expect(recovered.status()).toMatchObject({ state: 'ready', integrity: 'valid' })
    expect(recovered.testing.database.prepare("SELECT COUNT(*) AS count FROM immutable_artifacts WHERE kind='calibration'").get().count).toBe(point === 'after-cas' ? 0 : 1)
    const artifact = await recovered.calibrate(selection)
    expect(await recovered.calibration(artifact.artifactDigest)).toEqual(artifact)
    expect(await recovered.integrity()).toMatchObject({ status: 'valid' })
    await recovered.close()
  }, 30_000)

  it.each(['after-cas', 'after-database'])('recovers freeze artifact publication crash %s and retries cleanly', async (point) => {
    const bundle = await exactBundle()
    const root = await temporaryRoot()
    let crashed = false
    const crash = async ({ kind }) => {
      if (!crashed && kind === 'prediction') {
        crashed = true
        throw new Error(`simulated freeze artifact crash ${point}`)
      }
    }
    const hooks = point === 'after-cas' ? { afterArtifactCas: crash } : { afterArtifactDatabaseCommit: crash }
    const upstream = fakeUpstream(bundle)
    const failed = await createMeasuredService({ root, env: serviceEnv, client: upstream, hooks, exposeTesting: true })
    await failed.sync()
    const artifact = await failed.calibrate(selection)
    const intent = { calibrationArtifactDigest: artifact.artifactDigest, targetPartitionId: MEASURED_HELDOUT_PARTITION_ID, nonce: `freeze-artifact-crash-${point}`, createdAt: '2026-07-14T00:00:00Z' }
    await expect(failed.freeze(intent)).rejects.toThrow(/simulated freeze artifact crash/)
    expect(upstream.commit).not.toHaveBeenCalled()
    await failed.close()

    const recoveredUpstream = fakeUpstream(bundle)
    const recovered = await createMeasuredService({ root, env: serviceEnv, client: recoveredUpstream, exposeTesting: true })
    expect(recovered.status()).toMatchObject({ state: 'ready', integrity: 'valid' })
    expect(recovered.testing.database.prepare("SELECT COUNT(*) AS count FROM immutable_artifacts").get().count).toBe(point === 'after-cas' ? 4 : 5)
    const frozen = await recovered.freeze(intent)
    expect(frozen.artifacts.prediction.kind).toBe('prediction')
    expect(recovered.testing.database.prepare('SELECT COUNT(*) AS count FROM freezes').get().count).toBe(1)
    expect(await recovered.integrity()).toMatchObject({ status: 'valid' })
    await recovered.close()
  }, 30_000)

  it('makes concurrent exact freeze and disclosure retries canonical and idempotent', async () => {
    const bundle = await exactBundle()
    const root = await temporaryRoot()
    const upstream = fakeUpstream(bundle, { evaluate: vi.fn(async (evaluation) => disclosureResponse(evaluation)) })
    const service = await createMeasuredService({ root, env: serviceEnv, client: upstream, exposeTesting: true })
    await service.sync()
    const artifact = await service.calibrate(selection)
    const intent = { calibrationArtifactDigest: artifact.artifactDigest, targetPartitionId: MEASURED_HELDOUT_PARTITION_ID, nonce: 'concurrent-exact-freeze-0001', createdAt: '2026-07-14T00:00:00Z' }
    const [firstFreeze, secondFreeze] = await Promise.all([service.freeze(intent), service.freeze(intent)])
    expect(secondFreeze).toEqual(firstFreeze)
    expect(service.testing.database.prepare('SELECT COUNT(*) AS count FROM freezes').get().count).toBe(1)
    await expect(service.freeze({ ...intent, createdAt: '2026-07-14T00:00:01Z' })).rejects.toMatchObject({ statusCode: 409 })
    const disclosureIntent = { commitmentDigest: firstFreeze.receipt.commitment_digest }
    const [firstDisclosure, secondDisclosure] = await Promise.all([service.disclose(disclosureIntent), service.disclose(disclosureIntent)])
    expect(secondDisclosure).toEqual(firstDisclosure)
    expect(service.testing.database.prepare('SELECT COUNT(*) AS count FROM disclosures').get().count).toBe(1)
    expect(await service.integrity()).toMatchObject({ status: 'valid' })
    await service.close()
  }, 30_000)

  it.each(['request-ref-binding', 'artifact-relationship'])('fails integrity on frozen artifact %s corruption', async (corruption) => {
    const bundle = await exactBundle()
    const root = await temporaryRoot()
    const service = await createMeasuredService({ root, env: serviceEnv, client: fakeUpstream(bundle), exposeTesting: true })
    await service.sync()
    const artifact = await service.calibrate(selection)
    const intent = { calibrationArtifactDigest: artifact.artifactDigest, targetPartitionId: MEASURED_HELDOUT_PARTITION_ID, nonce: `freeze-corruption-${corruption}`, createdAt: '2026-07-14T00:00:00Z' }
    const response = await service.freeze(intent)
    const database = service.testing.database
    const row = database.prepare('SELECT * FROM freezes WHERE commitment_digest=?').get(response.receipt.commitment_digest)
    const frozen = JSON.parse(Buffer.from(row.frozen_request).toString('utf8'))
    const refs = JSON.parse(Buffer.from(row.artifact_refs).toString('utf8'))
    const receipt = JSON.parse(Buffer.from(row.receipt).toString('utf8'))

    if (corruption === 'request-ref-binding') {
      frozen.prediction_digest = refs.endpointMapping.digest
    } else {
      const original = JSON.parse((await service.testing.objects.get(refs.parameterPolicy.digest)).toString('utf8'))
      const changed = { ...original, calibrationArtifactDigest: '0'.repeat(64) }
      const bytes = Buffer.from(canonicalJson(changed))
      const digest = sha256(bytes)
      await service.testing.objects.put(bytes)
      database.prepare('INSERT INTO objects VALUES (?,?,?,?)').run(digest, bytes.length, 'application/json', '2026-07-14T00:00:00Z')
      database.prepare('INSERT INTO immutable_artifacts VALUES (?,?,?,?,?)').run(digest, 'parameter-policy', digest, bytes.length, '2026-07-14T00:00:00Z')
      refs.parameterPolicy = { ...refs.parameterPolicy, digest, bytes: bytes.length }
      frozen.parameter_policy_digest = digest
    }
    const commitmentDigest = sha256(canonicalJson(frozen))
    receipt.commitment_digest = commitmentDigest
    database.exec('DROP TRIGGER measured_freezes_update')
    database.prepare('UPDATE freezes SET commitment_digest=?,frozen_request=?,artifact_refs=?,receipt=? WHERE commitment_digest=?').run(commitmentDigest, Buffer.from(canonicalJson(frozen)), Buffer.from(canonicalJson(refs)), Buffer.from(canonicalJson(receipt)), response.receipt.commitment_digest)
    const integrity = await service.integrity()
    expect(integrity.status).toBe('failed')
    expect(integrity.findings[0]).toMatch(corruption === 'request-ref-binding' ? /digest fields/ : /artifact relationship/)
    await service.close()
  }, 30_000)

  it('applies post-publication integrity failure before throwing and blocks every read', async () => {
    const bundle = await exactBundle()
    const root = await temporaryRoot()
    const service = await createMeasuredService({ root, env: serviceEnv, client: fakeUpstream(bundle), hooks: { afterPublish: ({ database }) => database.prepare("INSERT INTO records VALUES ('families','family:extra',NULL,?)").run(Buffer.from('{"id":"family:extra"}')) } })
    await expect(service.sync()).rejects.toThrow(/count is incomplete|strict measured contract/)
    expect(service.status()).toMatchObject({ state: 'failed', integrity: 'failed' })
    expect(() => service.page('families', { limit: 10 })).toThrow(/integrity failed/)
    expect(() => service.lineage('measurement:cebs0004:0113:h24:alt')).toThrow(/integrity failed/)
    await expect(service.calibrate(selection)).rejects.toThrow(/integrity failed/)
    await service.close()
  }, 30_000)

  it.each(['upstream', 'journal', 'first-object', 'last-object', 'cas', 'committed', 'post-publish'])('prevents a superseded sync from publishing or overwriting lifecycle at %s', async (boundary) => {
    const bundle = await exactBundle()
    const root = await temporaryRoot()
    let releaseGate
    const gate = new Promise((resolve) => { releaseGate = resolve })
    let gated = false
    const waitOnce = async () => { if (!gated) { gated = true; await gate } }
    const upstream = fakeUpstream(bundle, { synchronize: vi.fn(async () => { if (boundary === 'upstream') await waitOnce(); return bundle }) })
    const hooks = {
      afterJournal: boundary === 'journal' ? waitOnce : undefined,
      afterObject: ['first-object', 'last-object'].includes(boundary) ? async ({ index }) => { if ((boundary === 'first-object' && index === 0) || (boundary === 'last-object' && index === bundle.objects.length - 1)) await waitOnce() } : undefined,
      afterCas: boundary === 'cas' ? waitOnce : undefined,
      afterDatabaseCommit: boundary === 'committed' ? waitOnce : undefined,
      afterPublish: boundary === 'post-publish' ? waitOnce : undefined
    }
    const service = await createMeasuredService({ root, env: serviceEnv, client: upstream, hooks })
    const first = service.sync()
    while (!gated) await new Promise((resolve) => setTimeout(resolve, 1))
    const second = service.sync()
    releaseGate()
    await expect(first).rejects.toThrow(/superseded/)
    expect((await second).state).toBe('ready')
    expect(service.status()).toMatchObject({ state: 'ready', integrity: 'valid', lastError: null })
    await service.close()
  }, 30_000)
})
