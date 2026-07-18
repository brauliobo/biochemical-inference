import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildApp } from '../../server/app.js'
import { RevalidationIntegrationError } from '../../server/revalidation/integration.js'

const apps = []
const digest = `sha256:${'a'.repeat(64)}`
const env = { NODE_ENV: 'test', BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true', BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN: 'http://127.0.0.1:5173' }
const mutationHeaders = { origin: 'http://127.0.0.1:5173', 'x-biochemical-csrf': 'revalidation-campaign-v1' }

afterEach(async () => Promise.all(apps.splice(0).map((app) => app.close())))

function fakeRevalidation() {
  const detail = { campaign_id: digest, state: 'active', review: { required: false, automatically_accepted: false, labeled_outcomes: 0 } }
  return {
    close: vi.fn(),
    status: vi.fn(async () => ({ mode: 'producer-bound-local-revalidation', campaigns: 1, review_automatic_acceptance: false })),
    campaigns: vi.fn(() => [{ local_campaign_id: digest }]),
    sync: vi.fn(async () => detail),
    detail: vi.fn(async () => detail),
    reconcile: vi.fn(async () => detail),
    cancel: vi.fn(async () => detail),
    report: vi.fn(async () => ({ campaign_id: digest })),
    integrity: vi.fn(async () => ({ status: 'valid', producer: 'valid' })),
    events: vi.fn(() => [])
  }
}

async function appWith(service) {
  const app = await buildApp({ serveClient: false, revalidationService: service, env })
  apps.push(app)
  return app
}

describe('Goal 15 revalidation API boundary', () => {
  it('exposes only no-store status, campaign, integrity, and event reads', async () => {
    const service = fakeRevalidation()
    const app = await appWith(service)
    const responses = await Promise.all([
      app.inject({ method: 'GET', url: '/api/v13/revalidation/status' }),
      app.inject({ method: 'GET', url: '/api/v13/revalidation/campaigns' }),
      app.inject({ method: 'GET', url: `/api/v13/revalidation/campaigns/${digest}` }),
      app.inject({ method: 'GET', url: `/api/v13/revalidation/campaigns/${digest}/report` }),
      app.inject({ method: 'GET', url: '/api/v13/revalidation/integrity' }),
      app.inject({ method: 'GET', url: '/api/v13/revalidation/events' })
    ])
    for (const response of responses) {
      expect(response.statusCode).toBe(200)
      expect(response.headers['cache-control']).toBe('no-store')
      expect(response.headers.pragma).toBe('no-cache')
      expect(response.headers.etag).toBeUndefined()
    }
    expect(service.detail).toHaveBeenCalledWith(digest, { limit: 50, cursor: null })
    expect(service.report).toHaveBeenCalledWith(digest)
    expect((await app.inject({ method: 'GET', url: '/api/v13/revalidation/status?extra=true' })).statusCode).toBe(422)
    expect((await app.inject({ method: 'GET', url: '/api/v13/revalidation/campaigns/not-a-digest' })).statusCode).toBe(422)
    expect((await app.inject({ method: 'GET', url: `/api/v13/revalidation/campaigns/${digest}?limit=101` })).statusCode).toBe(422)
  })

  it('requires exact same-origin CSRF and strict bodies for every campaign mutation', async () => {
    const service = fakeRevalidation()
    const app = await appWith(service)
    expect((await app.inject({ method: 'POST', url: '/api/v13/revalidation/campaigns', payload: {} })).statusCode).toBe(403)
    expect(service.sync).not.toHaveBeenCalled()

    const created = await app.inject({ method: 'POST', url: '/api/v13/revalidation/campaigns', headers: mutationHeaders, payload: {} })
    expect(created.statusCode).toBe(201)
    expect(service.sync).toHaveBeenCalledWith({ name: 'goal15-local-revalidation', reason: 'Execute the pinned Goal 11 revalidation impact plan locally.' })
    expect((await app.inject({ method: 'POST', url: '/api/v13/revalidation/campaigns', headers: mutationHeaders, payload: { unknown: true } })).statusCode).toBe(422)

    for (const action of ['reconcile', 'cancel']) {
      const response = await app.inject({ method: 'POST', url: `/api/v13/revalidation/campaigns/${digest}/${action}`, headers: mutationHeaders, payload: {} })
      expect(response.statusCode).toBe(200)
      expect(response.headers['cache-control']).toBe('no-store')
    }
    expect(service.reconcile).toHaveBeenCalledWith(digest)
    expect(service.cancel).toHaveBeenCalledWith(digest)
  })

  it('keeps integration failures no-store and reports an unconfigured producer explicitly', async () => {
    const service = fakeRevalidation()
    service.status.mockRejectedValue(new RevalidationIntegrationError('producer-unavailable', 'Producer is unavailable.', 503))
    let app = await appWith(service)
    const failed = await app.inject({ method: 'GET', url: '/api/v13/revalidation/status' })
    expect(failed.statusCode).toBe(503)
    expect(failed.json()).toMatchObject({ code: 'producer-unavailable', message: 'Producer is unavailable.' })
    expect(failed.headers['cache-control']).toBe('no-store')

    await app.close()
    apps.splice(apps.indexOf(app), 1)
    app = await appWith(null)
    const unavailable = await app.inject({ method: 'GET', url: '/api/v13/revalidation/status' })
    expect(unavailable.statusCode).toBe(503)
    expect(unavailable.json()).toMatchObject({ code: 'revalidation-not-configured' })
  })
})
