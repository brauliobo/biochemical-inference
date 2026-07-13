import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, requestJson } from '../../src/api.js'

afterEach(() => vi.unstubAllGlobals())

describe('frontend API errors', () => {
  it('retains HTTP status, API code, message, and payload', async () => {
    const payload = { statusCode: 503, code: 'EVIDENCE_MODEL_UNAVAILABLE', message: 'The requested generation model is not installed.' }
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(payload), { status: 503, headers: { 'content-type': 'application/json' } })))

    const error = await requestJson('/api/test').catch((caught) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 503, code: 'EVIDENCE_MODEL_UNAVAILABLE', message: payload.message, payload })
  })

  it('does not infer model unavailability from status alone', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ message: 'Service unavailable.' }), { status: 503, headers: { 'content-type': 'application/json' } })))

    await expect(requestJson('/api/test')).rejects.toMatchObject({ status: 503, code: 'HTTP_ERROR' })
  })

  it('types network failures while preserving aborts for request ownership', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('connection refused') }))
    await expect(requestJson('/api/test')).rejects.toMatchObject({ name: 'ApiError', status: 0, code: 'NETWORK_ERROR' })

    const abort = new DOMException('aborted', 'AbortError')
    vi.stubGlobal('fetch', vi.fn(async () => { throw abort }))
    await expect(requestJson('/api/test')).rejects.toBe(abort)
  })
})
