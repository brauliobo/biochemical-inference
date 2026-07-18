import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildApp } from '../../server/app.js'
import { ChallengeRequestError } from '../../server/challenge/service.js'

const apps = []
afterEach(async () => Promise.all(apps.splice(0).map((app) => app.close())))

function fakeChallenge() {
  return {
    close: vi.fn(),
    discovery: vi.fn(() => ({ contractVersion: '1.0.0', mode: 'inference-owned-goal13-consumer' })),
    status: vi.fn(() => ({ state: 'ready', integrity: 'valid', releaseId: 'apap-human-pk-challenge-v1.0.0', disclosureEpoch: null, lastError: null })),
    sync: vi.fn(async () => ({ state: 'ready', integrity: 'valid' })),
    prepare: vi.fn(async (intent) => ({ intent, receipt: { commitment_digest: 'a'.repeat(64) } })),
    disclose: vi.fn(async () => ({ producer_result: { result_digest: 'b'.repeat(64), conclusion: 'failed' } })),
    listRuns: vi.fn((limit) => ({ items: [], limit })),
    report: vi.fn(async (resultDigest) => ({ producer_result: { result_digest: resultDigest, conclusion: 'failed' } })),
    replay: vi.fn(async (resultDigest) => ({ verification: 'pass', network_access: false, resultDigest })),
    artifact: vi.fn(async (artifactDigest) => ({ artifactDigest, kind: 'model', content: {} })),
    integrity: vi.fn(async () => ({ status: 'valid' }))
  }
}

const env = { NODE_ENV: 'test', BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true', BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN: 'http://127.0.0.1:5173' }
const headers = { origin: 'http://127.0.0.1:5173', 'x-challenge-csrf': 'goal13-challenge-v1' }

describe('Goal 13 API boundary', () => {
  it('requires same-origin CSRF, binds path/body identity, and applies no-store to every response', async () => {
    const challenge = fakeChallenge()
    const app = await buildApp({ serveClient: false, challengeService: challenge, env })
    apps.push(app)
    const denied = await app.inject({ method: 'POST', url: '/api/v11/challenge/commitments', payload: { nonce: 'goal13-api-test-0001', createdAt: '2026-07-14T00:00:00Z' } })
    expect(denied.statusCode).toBe(403)
    expect(challenge.prepare).not.toHaveBeenCalled()
    const prepared = await app.inject({ method: 'POST', url: '/api/v11/challenge/commitments', headers, payload: { nonce: 'goal13-api-test-0001', createdAt: '2026-07-14T00:00:00Z' } })
    expect(prepared.statusCode).toBe(201)
    const mismatch = await app.inject({ method: 'POST', url: `/api/v11/challenge/commitments/${'a'.repeat(64)}/disclose`, headers, payload: { commitmentDigest: 'b'.repeat(64) } })
    expect(mismatch.statusCode).toBe(409)
    expect(challenge.disclose).not.toHaveBeenCalled()
    for (const response of [denied, prepared, mismatch, await app.inject({ method: 'GET', url: '/api/v11/challenge' })]) {
      expect(response.headers['cache-control']).toBe('private, no-store')
      expect(response.headers.pragma).toBe('no-cache')
      expect(response.headers.etag).toBeUndefined()
    }
  }, 20_000)

  it('exposes bounded run, artifact, report, and offline replay contracts', async () => {
    const challenge = fakeChallenge()
    const app = await buildApp({ serveClient: false, challengeService: challenge, env })
    apps.push(app)
    expect((await app.inject({ method: 'GET', url: '/api/v11/challenge/runs?limit=51', headers })).statusCode).toBe(422)
    expect((await app.inject({ method: 'GET', url: '/api/v11/challenge/runs?limit=5' })).statusCode).toBe(403)
    const runs = await app.inject({ method: 'GET', url: '/api/v11/challenge/runs?limit=5', headers })
    expect(runs.statusCode).toBe(200)
    expect(challenge.listRuns).toHaveBeenCalledWith(5)
    const browserRead = await app.inject({
      method: 'GET',
      url: '/api/v11/challenge/runs?limit=5',
      headers: { referer: 'http://127.0.0.1:5173/', 'x-challenge-csrf': 'goal13-challenge-v1' }
    })
    expect(browserRead.statusCode).toBe(200)
    const wrongReferer = await app.inject({
      method: 'GET',
      url: '/api/v11/challenge/runs?limit=5',
      headers: { referer: 'https://wrong.invalid/', 'x-challenge-csrf': 'goal13-challenge-v1' }
    })
    expect(wrongReferer.statusCode).toBe(403)
    const resultDigest = 'b'.repeat(64)
    expect((await app.inject({ method: 'GET', url: `/api/v11/challenge/reports/${resultDigest}`, headers })).statusCode).toBe(200)
    expect((await app.inject({ method: 'GET', url: `/api/v11/challenge/reports/${resultDigest}?unexpected=1`, headers })).statusCode).toBe(422)
    expect((await app.inject({ method: 'POST', url: `/api/v11/challenge/reports/${resultDigest}/replay`, headers, payload: {} })).json()).toMatchObject({ verification: 'pass', network_access: false })
    expect((await app.inject({ method: 'POST', url: `/api/v11/challenge/reports/${resultDigest}/replay`, headers, payload: { unexpected: true } })).statusCode).toBe(422)
    expect((await app.inject({ method: 'GET', url: `/api/v11/challenge/artifacts/${'c'.repeat(64)}`, headers })).statusCode).toBe(200)
    expect((await app.inject({ method: 'POST', url: '/api/v11/challenge/sync', headers, payload: { unexpected: true } })).statusCode).toBe(422)
    const status = await app.inject({ method: 'GET', url: '/api/v11/challenge/status' })
    expect(status.json()).not.toHaveProperty('root')
  }, 20_000)

  it('preserves Goal 13 service error taxonomy', async () => {
    const challenge = fakeChallenge()
    challenge.sync.mockRejectedValue(new ChallengeRequestError('CHALLENGE_SYNC_CONFLICT', 'Pinned producer mismatch.', 409))
    const app = await buildApp({ serveClient: false, challengeService: challenge, env })
    apps.push(app)
    const response = await app.inject({ method: 'POST', url: '/api/v11/challenge/sync', headers })
    expect(response.statusCode).toBe(409)
    expect(response.json().code).toBe('CHALLENGE_SYNC_CONFLICT')
  })
})
