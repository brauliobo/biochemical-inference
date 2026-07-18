import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { canonicalJson } from '../../shared/canonical-json.js'
import { independentlyScoreChallenge } from '../../server/challenge/scoring.js'
import { challengeDigest, challengeSha256, verifyChallengeBundle } from '../../server/challenge/verification.js'

const oraclePath    = resolve(process.cwd(), '../biochemical-db/service-js/tests/domains/challenge-oracle.json')
const recordTypes   = ['sources', 'rights', 'source_facts', 'studies', 'protocols', 'endpoints', 'mappings', 'metrics', 'thresholds', 'exclusions', 'not_evaluable', 'partitions']
const basePath      = '/api/challenges/v1'
const releaseId     = 'apap-human-pk-challenge-v1.0.0'
const releaseDigest = '3c1c7e50b8b9e10b9912802e471a07d9df50ee5088b441784fb39e441663ffb7'
const releasePath   = `${basePath}/releases/${releaseId}`
let fixturePromise

export async function challengeFixture() {
  fixturePromise ??= readFile(oraclePath, 'utf8').then((bytes) => {
    const oracle = JSON.parse(bytes)
    const routes = new Map(oracle.public_routes.map((item) => [item.path, item.body]))
    const body = (path) => routes.get(path)
    const bundle = verifyChallengeBundle({
      discovery: body(basePath),
      trustResponse: body(`${basePath}/trust`),
      catalog: body(`${basePath}/releases`),
      releaseResponse: body(releasePath),
      envelope: body(`${releasePath}/envelope`),
      records: Object.fromEntries(recordTypes.map((recordType) => [recordType, body(`${releasePath}/${recordType}`).items]))
    })
    return { bundle, observations: oracle.disclosure.observations }
  })
  return fixturePromise
}

export function fakeChallengeProducer(fixture, options = {}) {
  const calls = []
  let persistedCommitment = null
  let outcomeReads = 0
  const disclosureFor = (commitmentDigest, observations = fixture.observations) => {
    const base = {
      disclosure_contract: 'apap-human-pk-challenge-disclosure-v1',
      commitment_digest: commitmentDigest,
      disclosed_at: options.disclosedAt ?? '2026-07-15T03:18:25Z',
      observations: structuredClone(observations)
    }
    return { ...base, disclosure_digest: challengeDigest(base) }
  }
  return {
    calls,
    get outcomeReads() { return outcomeReads },
    async synchronize() {
      calls.push('synchronize')
      return structuredClone(fixture.bundle)
    },
    async commit(frozen) {
      calls.push('commit')
      persistedCommitment = structuredClone(frozen)
      return {
        commitment_contract: 'apap-human-pk-challenge-commitment-v1',
        commitment_digest: options.commitmentMismatch ? '0'.repeat(64) : challengeDigest(frozen),
        committed_at: options.committedAt ?? '2026-07-15T03:18:24Z',
        created_at: frozen.created_at,
        partition_digest: frozen.partition_digest
      }
    },
    async disclose(request) {
      calls.push('disclose')
      if (!persistedCommitment || canonicalJson(request.frozen_commitment) !== canonicalJson(persistedCommitment)) throw new Error('outcomes cannot be read before the exact commitment is persisted')
      outcomeReads += 1
      const observations = structuredClone(fixture.observations)
      if (options.alteredDisclosure) {
        observations[0].reported_value = '5206.096'
        observations[0].normalized_value = '5.206096'
      }
      return disclosureFor(request.commitment_digest, observations)
    },
    async submitResult(submission) {
      calls.push('submitResult')
      const disclosure = disclosureFor(submission.commitment_digest)
      const endpointDiagnostics = submission.endpoint_results.map((item) => ({ endpoint_id: item.endpoint_id, status: item.diagnostic_status }))
      const scored = independentlyScoreChallenge(submission.frozen_commitment, disclosure, endpointDiagnostics)
      if (options.scoreMismatch) scored.endpoint_results[0].absolute_relative_error = '0.0000000000'
      const base = {
        ...scored,
        software_digest: submission.software_digest,
        diagnostics_digest: submission.diagnostics_digest,
        submitted_at: options.submittedAt ?? '2026-07-15T03:18:26Z'
      }
      return { ...base, result_digest: challengeDigest(base) }
    }
  }
}

export function challengeFixtureFetch(fixture, requests = [], mutate = null) {
  const fixed = new Map([
    [basePath, fixture.bundle.discovery],
    [`${basePath}/trust`, fixture.bundle.trustResponse],
    [`${basePath}/releases`, fixture.bundle.catalog],
    [releasePath, fixture.bundle.releaseResponse],
    [`${releasePath}/envelope`, fixture.bundle.envelope]
  ])
  return async (raw, init = {}) => {
    const url = new URL(raw)
    requests.push({ method: init.method ?? 'GET', path: url.pathname, search: url.search })
    let value = fixed.get(url.pathname)
    if (!value && url.pathname.startsWith(`${releasePath}/`)) {
      const recordType = url.pathname.slice(releasePath.length + 1)
      const items = fixture.bundle.records[recordType]
      if (items) value = {
        page_contract: 'challenge-public-records-v1',
        release_id: releaseId,
        release_digest: releaseDigest,
        record_type: recordType,
        sort: 'id:asc',
        limit: 100,
        release: { id: releaseId, schema_version: '1.0.0', digest: releaseDigest },
        items,
        next_cursor: null
      }
    }
    if (!value) return new Response(null, { status: 404 })
    value = structuredClone(value)
    if (mutate) value = mutate(url, value) ?? value
    const bytes = Buffer.from(canonicalJson(value))
    const releaseBound = url.pathname.includes(`/releases/${releaseId}`)
    return new Response(bytes, { headers: {
      'content-type': 'application/json',
      'content-length': String(bytes.length),
      'cache-control': releaseBound ? 'public, max-age=31536000, immutable' : 'public, max-age=60',
      etag: `"sha256:${challengeSha256(bytes)}"`,
      ...(releaseBound ? { 'x-release-digest': releaseDigest } : {})
    } })
  }
}
