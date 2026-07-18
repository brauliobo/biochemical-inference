import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { CHALLENGE_HELDOUT_POLICY, CHALLENGE_RESULT_POLICY, CHALLENGE_SAMPLING_HOURS } from '../../shared/challenge-contracts.js'
import { canonicalJson } from '../../shared/canonical-json.js'
import { createChallengeService } from '../../server/challenge/service.js'
import { createChallengeClient } from '../../server/challenge/client.js'
import { buildChallengeArtifacts, buildChallengeCommitment } from '../../server/challenge/model.js'
import { independentlyScoreChallenge, quantizeDecimalText, scoreRelativeError } from '../../server/challenge/scoring.js'
import { challengeDigest, verifyChallengeBundle } from '../../server/challenge/verification.js'
import { challengeFixture, challengeFixtureFetch, fakeChallengeProducer } from '../fixtures/challenge.js'

const roots = []
const createdAt = '2026-07-14T00:00:00Z'
const fixedNow = () => '2026-07-15T03:18:24Z'
let artifactsPromise
const cachedBuildArtifacts = (bundle) => {
  artifactsPromise ??= buildChallengeArtifacts(bundle)
  return artifactsPromise
}
const createService = (options) => createChallengeService({ ...options, buildArtifacts: options.buildArtifacts ?? cachedBuildArtifacts, now: options.now ?? fixedNow })

async function temporaryRoot() {
  const root = await mkdtemp(resolve(tmpdir(), 'biochemical-goal13-test-'))
  roots.push(root)
  return root
}

async function synchronizedService(client, options = {}) {
  const service = await createService({ root: await temporaryRoot(), env: { NODE_ENV: 'test' }, client, ...options })
  await service.sync()
  return service
}

afterEach(async () => Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))))

describe('Goal 13 independent release and inference execution', () => {
  it('uses exact unrounded score boundaries and declared half-even prediction ties', () => {
    expect(scoreRelativeError('7', '10')).toEqual({ score: '0.3000000000', passed: true })
    expect(scoreRelativeError('6.9999999999', '10')).toEqual({ score: '0.3000000000', passed: false })
    expect(scoreRelativeError('13', '10')).toEqual({ score: '0.3000000000', passed: true })
    expect(scoreRelativeError('13.0000000001', '10')).toEqual({ score: '0.3000000000', passed: false })
    expect(quantizeDecimalText('1.23456789005', 10)).toBe('1.2345678900')
    expect(quantizeDecimalText('1.23456789015', 10)).toBe('1.2345678902')
  })

  it('traverses only signed public views and rejects a valid-ETag producer root mismatch', async () => {
    const fixture = await challengeFixture()
    const requests = []
    const env = {
      BIOCHEMICAL_CHALLENGE_URL: 'http://127.0.0.1:8000',
      BIOCHEMICAL_CHALLENGE_ALLOWED_ORIGIN: 'http://127.0.0.1:5173',
      BIOCHEMICAL_CHALLENGE_CSRF_TOKEN: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
    }
    const synchronized = await createChallengeClient(env, { fetchImpl: challengeFixtureFetch(fixture, requests) }).synchronize()
    expect(synchronized.discovery).toMatchObject({ heldout_policy: CHALLENGE_HELDOUT_POLICY, result_policy: CHALLENGE_RESULT_POLICY })
    expect(synchronized.records.protocols[0].apap_sampling_times).toEqual(expect.arrayContaining(['00:05', '12:00']))
    expect(requests.some((request) => /observations|commitments|disclosures|results/.test(request.path))).toBe(false)
    const changed = challengeFixtureFetch(fixture, [], (url, value) => {
      if (url.pathname.endsWith('/protocols')) value.items[0].apap_dose_mg = '999'
      return value
    })
    await expect(createChallengeClient(env, { fetchImpl: changed }).synchronize()).rejects.toThrow(/strict contract|root failed/)
  })

  it('pins every public root, rejects corruption, and runs the exact 325 mg / 50 L grid', async () => {
    const fixture = await challengeFixture()
    const changed = structuredClone(fixture.bundle)
    changed.records.protocols[0].apap_sampling_times[1] = '00:10'
    expect(() => verifyChallengeBundle(changed)).toThrow(/strict contract|root/)

    const frozen = await cachedBuildArtifacts(fixture.bundle)
    expect(frozen.execution.integrated.times).toEqual(CHALLENGE_SAMPLING_HOURS.map(Number))
    expect(frozen.execution.predictions).toEqual([
      { endpoint_id: 'endpoint:apap-cmax:reference', predicted_value: '2.9196477028', predicted_unit: 'mg/L', predicted_time_h: '1.5' },
      { endpoint_id: 'endpoint:apap-cmax:test', predicted_value: '2.9196477028', predicted_unit: 'mg/L', predicted_time_h: '1.5' }
    ])
    expect(frozen.artifacts.diagnostics.content.diagnostics).toMatchObject({ passed: true, sampling_grid: { passed: true }, endpoint_diagnostics: [{ status: 'evaluable' }, { status: 'evaluable' }] })
    expect(frozen.artifacts.concentrationMapping.content).toMatchObject({ no_fit: true, mapping_status: 'valid-with-declared-assumptions', input: { concentration_mg_l: '6.5', model_initial_state_unit: 'model-unit' }, output: { scale_mg_l_per_model_unit: '1', unit: 'mg/L' } })
    expect(frozen.artifacts.publicLineage.content).toMatchObject({ development_closure: { evidence_boundary: expect.stringContaining('no challenge outcome used') }, observations_descriptor: { record_count: 2, bytes: 1631, sha256: 'd7710c701525dc9e9727f5ec34d89c2ec3cfe692982cd31be9600d1b168d38fb' } })
    expect(frozen.artifacts.software.content).toMatchObject({ portable_executable: false, sources: expect.arrayContaining([{ path: 'server/challenge/scoring.js', bytes: expect.any(Number), sha256: expect.stringMatching(/^[a-f0-9]{64}$/) }, { path: 'shared/challenge-contracts.js', bytes: expect.any(Number), sha256: expect.stringMatching(/^[a-f0-9]{64}$/) }]) })
    expect(Object.values(frozen.artifacts).map((item) => item.digest)).toHaveLength(9)
    expect(new Set(Object.values(frozen.artifacts).map((item) => item.digest)).size).toBe(9)
  }, 30_000)

  it('preserves protected upstream error status without reading its body', async () => {
    const fixture = await challengeFixture()
    const frozen = await cachedBuildArtifacts(fixture.bundle)
    const commitment = buildChallengeCommitment(frozen, { nonce: 'goal13-upstream-error-0001', createdAt })
    for (const status of [400, 403, 409, 422, 503]) {
      let bodyRead = false
      const fetchImpl = async () => ({
        status,
        headers: new Headers({ 'content-type': 'application/json', 'cache-control': 'private, no-store', pragma: 'no-cache' }),
        body: { getReader() { bodyRead = true; throw new Error('protected error body must not be read') } }
      })
      const client = createChallengeClient({
        BIOCHEMICAL_CHALLENGE_URL: 'http://127.0.0.1:8000',
        BIOCHEMICAL_CHALLENGE_ALLOWED_ORIGIN: 'http://127.0.0.1:5173',
        BIOCHEMICAL_CHALLENGE_CSRF_TOKEN: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
      }, { fetchImpl })
      await expect(client.commit(commitment)).rejects.toMatchObject({ statusCode: status, code: 'CHALLENGE_UPSTREAM_STATUS' })
      expect(bodyRead).toBe(false)
    }
  })

  it('marks only the incompatible endpoint not-evaluable', async () => {
    const fixture = await challengeFixture()
    const frozen = await buildChallengeArtifacts(fixture.bundle)
    const disclosure = { commitment_digest: 'a'.repeat(64), disclosure_digest: 'b'.repeat(64), observations: fixture.observations }
    const scored = independentlyScoreChallenge({ predictions: frozen.execution.predictions }, disclosure, [
      { endpoint_id: 'endpoint:apap-cmax:reference', status: 'invalid-mapping' },
      { endpoint_id: 'endpoint:apap-cmax:test', status: 'evaluable' }
    ])
    expect(scored.conclusion).toBe('not-evaluable')
    expect(scored.endpoint_results).toMatchObject([{ absolute_relative_error: null, diagnostic_status: 'invalid-mapping' }, { absolute_relative_error: '0.3984103129', diagnostic_status: 'evaluable' }])
  })
})

describe('Goal 13 isolated commitment, disclosure, and replay state', () => {
  it('commits before the first outcome read and replays the failed result offline after restart', async () => {
    const fixture = await challengeFixture()
    const producer = fakeChallengeProducer(fixture)
    const root = await temporaryRoot()
    let service = await createService({ root, env: { NODE_ENV: 'test' }, client: producer, exposeTesting: true })
    expect((await service.sync()).state).toBe('ready')
    const prepared = await service.prepare({ nonce: 'goal13-isolation-test-0001', createdAt })
    expect(producer.calls).toEqual(['synchronize', 'commit'])
    expect(producer.outcomeReads).toBe(0)
    expect(prepared.frozenCommitment.predictions[0]).toMatchObject({ predicted_value: '2.9196477028', predicted_time_h: '1.5' })
    expect(Object.values(prepared.artifacts).map((item) => item.kind).sort()).toEqual(['concentration-mapping', 'diagnostics', 'equation-set', 'model', 'parameter-policy', 'prediction', 'public-lineage', 'software', 'solver'])

    const report = await service.disclose({ commitmentDigest: prepared.receipt.commitment_digest })
    expect(producer.calls).toEqual(['synchronize', 'commit', 'disclose', 'submitResult'])
    expect(producer.outcomeReads).toBe(1)
    expect(report.independent_scoring).toMatchObject({
      conclusion: 'failed',
      endpoint_results: [
        { absolute_relative_error: '0.4391866259', support_label: 'unsupported' },
        { absolute_relative_error: '0.3984103129', support_label: 'unsupported' }
      ]
    })
    expect(report.producer_result.conclusion).toBe('failed')
    expect(report.disclosure_verification).toMatchObject({ observation_count: 2, observations_ndjson_bytes: 1631, observations_ndjson_sha256: 'd7710c701525dc9e9727f5ec34d89c2ec3cfe692982cd31be9600d1b168d38fb', partition_closure_digest: prepared.frozenCommitment.partition_digest })
    expect(report.availability).toEqual({ parameter_sensitivity_analysis: 'not-available', structural_uncertainty: 'not-available', prediction_interval: 'not-available', measurement_uncertainty: 'not-reported-by-source' })
    expect(await service.integrity()).toMatchObject({ status: 'valid', commitments: 1, disclosureEpochs: 1, disclosures: 1, reports: 1 })
    const resultDigest = report.producer_result.result_digest
    await service.close()

    const offline = { synchronize() { throw new Error('offline replay must not synchronize') }, commit() { throw new Error('offline replay must not commit') }, disclose() { throw new Error('offline replay must not disclose') }, submitResult() { throw new Error('offline replay must not submit') } }
    service = await createService({ root, env: { NODE_ENV: 'test' }, client: offline })
    expect(service.status()).toMatchObject({ state: 'ready', integrity: 'valid' })
    expect((await service.report(resultDigest)).producer_result.result_digest).toBe(resultDigest)
    expect(await service.replay(resultDigest)).toMatchObject({ verification: 'pass', network_access: false, rerun: { conclusion: 'failed' }, report: { producer_result: { conclusion: 'failed' } } })
    await service.close()
  }, 30_000)

  it('rejects a producer commitment identity mismatch without reading outcomes', async () => {
    const fixture = await challengeFixture()
    const producer = fakeChallengeProducer(fixture, { commitmentMismatch: true })
    const service = await synchronizedService(producer, { exposeTesting: true })
    await expect(service.prepare({ nonce: 'goal13-producer-mismatch-0001', createdAt })).rejects.toThrow(/producer commitment receipt differs/)
    expect(producer.outcomeReads).toBe(0)
    expect(service.testing.database.prepare('SELECT COUNT(*) AS count FROM commitments').get().count).toBe(0)
    await service.close()
  }, 30_000)

  it('rejects independently recomputed producer scoring mismatch', async () => {
    const fixture = await challengeFixture()
    const producer = fakeChallengeProducer(fixture, { scoreMismatch: true })
    const service = await synchronizedService(producer)
    const prepared = await service.prepare({ nonce: 'goal13-score-mismatch-0001', createdAt })
    await expect(service.disclose({ commitmentDigest: prepared.receipt.commitment_digest })).rejects.toThrow(/producer scoring differs/)
    await service.close()
  }, 30_000)

  it('rejects producer workflow timestamp reversal', async () => {
    const fixture = await challengeFixture()
    const producer = fakeChallengeProducer(fixture, { submittedAt: '2026-07-15T03:18:24Z' })
    const service = await synchronizedService(producer)
    const prepared = await service.prepare({ nonce: 'goal13-timestamp-order-0001', createdAt })
    await expect(service.disclose({ commitmentDigest: prepared.receipt.commitment_digest })).rejects.toThrow(/timestamps do not preserve/)
    await service.close()
  }, 30_000)

  it('rejects an altered disclosure even when its self-digest is recomputed', async () => {
    const fixture = await challengeFixture()
    const producer = fakeChallengeProducer(fixture, { alteredDisclosure: true })
    const service = await synchronizedService(producer, { exposeTesting: true })
    const prepared = await service.prepare({ nonce: 'goal13-altered-disclosure-0001', createdAt })
    await expect(service.disclose({ commitmentDigest: prepared.receipt.commitment_digest })).rejects.toThrow(/signed canonical NDJSON descriptor/)
    expect(service.testing.database.prepare('SELECT COUNT(*) AS count FROM disclosure_epochs').get().count).toBe(1)
    expect(service.testing.database.prepare('SELECT COUNT(*) AS count FROM disclosures').get().count).toBe(0)
    await expect(service.prepare({ nonce: 'goal13-after-altered-disclosure-0002', createdAt })).rejects.toThrow(/disclosure epoch is open/)
    await service.close()
  }, 30_000)

  it('closes the release/partition epoch to new nonces while retaining exact retries', async () => {
    const fixture = await challengeFixture()
    const producer = fakeChallengeProducer(fixture)
    const service = await synchronizedService(producer)
    const intent = { nonce: 'goal13-epoch-first-0001', createdAt }
    const prepared = await service.prepare(intent)
    const report = await service.disclose({ commitmentDigest: prepared.receipt.commitment_digest })
    expect((await service.prepare(intent)).receipt).toEqual(prepared.receipt)
    await expect(service.prepare({ nonce: 'goal13-epoch-new-0002', createdAt })).rejects.toThrow(/new commitments.*forbidden/)
    expect((await service.disclose({ commitmentDigest: prepared.receipt.commitment_digest })).producer_result.result_digest).toBe(report.producer_result.result_digest)
    expect(producer.outcomeReads).toBe(1)
    await service.close()
  }, 30_000)

  it('rejects model or parameter-policy mutation under the same commitment identity', async () => {
    const fixture = await challengeFixture()
    const producer = fakeChallengeProducer(fixture)
    const service = await synchronizedService(producer, { exposeTesting: true })
    const intent = { nonce: 'goal13-mutation-test-0001', createdAt }
    const prepared = await service.prepare(intent)
    const database = service.testing.database
    const row = database.prepare('SELECT artifact_refs FROM commitments WHERE commitment_digest=?').get(prepared.receipt.commitment_digest)
    const refs = JSON.parse(Buffer.from(row.artifact_refs).toString('utf8'))
    refs.parameterPolicy = refs.model
    database.exec('DROP TRIGGER goal13_commitments_update')
    database.prepare('UPDATE commitments SET artifact_refs=? WHERE commitment_digest=?').run(Buffer.from(canonicalJson(refs)), prepared.receipt.commitment_digest)
    await expect(service.prepare(intent)).rejects.toThrow(/model or policy changed/)
    expect(producer.outcomeReads).toBe(0)
    await service.close()
  }, 30_000)

  it('fails integrity on a same-kind semantic artifact reference corruption', async () => {
    const fixture = await challengeFixture()
    const producer = fakeChallengeProducer(fixture)
    const service = await synchronizedService(producer, { exposeTesting: true })
    const prepared = await service.prepare({ nonce: 'goal13-semantic-ref-0001', createdAt })
    const database = service.testing.database
    const refs = JSON.parse(Buffer.from(database.prepare('SELECT artifact_refs FROM commitments WHERE commitment_digest=?').get(prepared.receipt.commitment_digest).artifact_refs).toString('utf8'))
    const original = JSON.parse((await service.testing.objects.get(refs.concentrationMapping.digest)).toString('utf8'))
    const changed = { ...original, output: { ...original.output, scale_mg_l_per_model_unit: '2' } }
    const stored = await service.testing.objects.put(Buffer.from(canonicalJson(changed)))
    database.prepare('INSERT INTO objects VALUES (?,?,?)').run(stored.digest, stored.bytes, createdAt)
    database.prepare('INSERT INTO artifacts VALUES (?,?,?,?)').run(stored.digest, 'concentration-mapping', stored.bytes, createdAt)
    refs.concentrationMapping = { kind: 'concentration-mapping', digest: stored.digest, bytes: stored.bytes }
    database.exec('DROP TRIGGER goal13_commitments_update')
    database.prepare('UPDATE commitments SET artifact_refs=?,artifact_refs_digest=? WHERE commitment_digest=?').run(Buffer.from(canonicalJson(refs)), challengeDigest(refs), prepared.receipt.commitment_digest)
    expect(await service.integrity()).toMatchObject({ status: 'failed', findings: [expect.stringMatching(/semantic artifact relationship|dimensional/)] })
    await service.close()
  }, 30_000)

  it('records failed synchronization state without exposing the external root', async () => {
    const client = { synchronize() { throw new Error('producer unavailable') } }
    const service = await createService({ root: await temporaryRoot(), env: { NODE_ENV: 'test' }, client })
    await expect(service.sync()).rejects.toThrow(/producer unavailable/)
    expect(service.status()).toEqual({ state: 'failed', integrity: 'failed', releaseId: null, disclosureEpoch: null, lastError: 'Goal 13 state verification failed.' })
    expect(service.status()).not.toHaveProperty('root')
    await service.close()
  })

  it('fails startup when the actual replay builder drifts from stored artifacts', async () => {
    const fixture = await challengeFixture()
    const producer = fakeChallengeProducer(fixture)
    const root = await temporaryRoot()
    let service = await createService({ root, env: { NODE_ENV: 'test' }, client: producer })
    await service.sync()
    const prepared = await service.prepare({ nonce: 'goal13-rerun-drift-0001', createdAt })
    await service.disclose({ commitmentDigest: prepared.receipt.commitment_digest })
    await service.close()
    const driftedBuilder = async (bundle) => {
      const result = await cachedBuildArtifacts(bundle)
      return { ...result, artifacts: { ...result.artifacts, software: { ...result.artifacts.software, digest: '0'.repeat(64) } } }
    }
    service = await createService({ root, env: { NODE_ENV: 'test' }, client: producer, buildArtifacts: driftedBuilder })
    expect(service.status()).toMatchObject({ state: 'failed', integrity: 'failed' })
    await service.close()
  }, 30_000)

  it('fails closed when a frozen artifact is corrupt across restart', async () => {
    const fixture = await challengeFixture()
    const producer = fakeChallengeProducer(fixture)
    const root = await temporaryRoot()
    let service = await createService({ root, env: { NODE_ENV: 'test' }, client: producer, exposeTesting: true })
    await service.sync()
    const prepared = await service.prepare({ nonce: 'goal13-corruption-test-0001', createdAt })
    const path = service.testing.objects.path(prepared.artifacts.parameterPolicy.digest)
    const original = await readFile(path)
    await writeFile(path, Buffer.concat([original, Buffer.from('corrupt')]))
    await service.close()

    service = await createService({ root, env: { NODE_ENV: 'test' }, client: producer })
    expect(service.status()).toMatchObject({ state: 'failed', integrity: 'failed' })
    expect(() => service.report('0'.repeat(64))).toThrow(/not synchronized and verified/)
    await service.close()
  }, 30_000)
})
