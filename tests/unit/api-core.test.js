import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { loadVerifiedChunk } from '../../src/api/chunks.js'
import {
  ApiError,
  collectCursorPages,
  collectOffsetPages,
  createStrictClient,
  csrfHeaders,
  getJson,
  httpError,
  postJson,
  queryString,
  violatesNoStore,
  withQuery
} from '../../src/api/core.js'

const json = (body, init = {}) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' }, ...init })

afterEach(() => vi.unstubAllGlobals())

describe('api core helpers', () => {
  it('builds queries that skip empty values', () => {
    expect(queryString({ a: 1, b: '', c: null, d: undefined, e: 'x y' })).toBe('a=1&e=x+y')
    expect(withQuery('/p', { a: undefined })).toBe('/p')
    expect(withQuery('/p', { a: 1 })).toBe('/p?a=1')
    expect(csrfHeaders('x-csrf', 'v')).toEqual({ 'content-type': 'application/json', 'x-csrf': 'v' })
  })

  it('normalises error payloads', () => {
    const response = { status: 409 }
    expect(httpError(response, { message: 'm', code: 'C' })).toMatchObject({ message: 'm', code: 'C', status: 409 })
    expect(httpError(response, { code: 7 })).toMatchObject({ message: 'Request failed with status 409', code: 'HTTP_ERROR' })
    expect(httpError(response, null)).toBeInstanceOf(ApiError)
  })

  it('sends parsed JSON bodies and optional signals', async () => {
    const fetchMock = vi.fn(async () => json({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)
    const signal = new AbortController().signal
    const schema = z.object({ ok: z.boolean() })
    await expect(getJson('/a', schema)).resolves.toEqual({ ok: true })
    await expect(postJson('/b', { n: 1 }, schema, { signal, headers: csrfHeaders('h', 'v') })).resolves.toEqual({ ok: true })
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/a', {})
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/b', { method: 'POST', headers: { 'content-type': 'application/json', h: 'v' }, body: '{"n":1}', signal })
  })

  it('checks a response policy before or after the status check', async () => {
    const verify = (response) => {
      if (response.headers.get('x-ok') !== '1') throw new ApiError('policy', { status: response.status, code: 'POLICY', payload: null })
    }
    const schema = z.object({ v: z.number() })
    vi.stubGlobal('fetch', vi.fn(async () => json({ message: 'down' }, { status: 503 })))
    await expect(createStrictClient({ verify, verifyFirst: true })('/x', { init: {}, schema })).rejects.toMatchObject({ code: 'POLICY' })
    await expect(createStrictClient({ verify })('/x', { init: {}, schema })).rejects.toMatchObject({ code: 'HTTP_ERROR', status: 503 })
    vi.stubGlobal('fetch', vi.fn(async () => json({ v: 1 }, { headers: { 'x-ok': '1', 'cache-control': 'private, no-store' } })))
    await expect(createStrictClient({ verify })('/x', { init: {}, schema })).resolves.toEqual({ v: 1 })
    await expect(createStrictClient({ verify })('/x', { init: {}, schema, withCacheControl: true })).resolves.toEqual({ value: { v: 1 }, cacheControl: 'private, no-store' })
  })

  it('detects no-store violations', () => {
    const headers = (entries) => ({ headers: new Headers(entries) })
    expect(violatesNoStore(headers({ 'cache-control': 'no-store', pragma: 'no-cache' }), 'no-store')).toBe(false)
    expect(violatesNoStore(headers({ 'cache-control': 'no-store', pragma: 'no-cache', etag: '"x"' }), 'no-store')).toBe(true)
    expect(violatesNoStore(headers({ 'cache-control': 'no-store' }), 'no-store')).toBe(true)
  })
})

describe('api paging helpers', () => {
  const options = {
    matches: (page, offset) => page.offset === offset,
    mismatch: { message: 'mismatch', code: 'MISMATCH' },
    incomplete: { message: 'incomplete', code: 'INCOMPLETE' }
  }

  it('collects offset pages until the declared total', async () => {
    const pages = [{ offset: 0, total: 3, items: [1, 2] }, { offset: 2, total: 3, items: [3] }]
    await expect(collectOffsetPages(async (offset) => pages.find((page) => page.offset === offset), options)).resolves.toEqual([1, 2, 3])
  })

  it('fails closed on identity drift and truncated inventories', async () => {
    await expect(collectOffsetPages(async () => ({ offset: 5, total: 3, items: [1] }), options)).rejects.toMatchObject({ code: 'MISMATCH', status: 409 })
    await expect(collectOffsetPages(async (offset) => ({ offset, total: 3, items: [] }), options)).rejects.toMatchObject({ code: 'INCOMPLETE', status: 409 })
  })

  it('follows cursors and lets the caller reject a page', async () => {
    const pages = { null: { items: [1], next_cursor: 'a' }, a: { items: [2], next_cursor: null } }
    await expect(collectCursorPages(async (cursor) => pages[cursor])).resolves.toEqual([1, 2])
    await expect(collectCursorPages(async (cursor) => pages[cursor], () => { throw new Error('drift') })).rejects.toThrow('drift')
  })
})

describe('verified chunk loading', () => {
  const body = new Uint8Array([1, 2, 3])
  const sha256 = async (bytes) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((value) => value.toString(16).padStart(2, '0')).join('')
  const messages = { request: 'req failed', identity: 'identity', encoded: 'encoded', decoded: 'decoded', codec: 'codec' }

  async function descriptor() {
    return { array_id: 'arr', grid_zyx: [0, 1, 2], media_type: 'application/gzip', encoded_bytes: body.length, encoded_sha256: await sha256(body), decoded_sha256: 'd'.repeat(64), decoded_bytes: 3 }
  }
  const headersFor = (d, overrides = {}) => ({
    'cache-control': 'public, max-age=31536000, immutable',
    'accept-ranges': 'none',
    'content-type': d.media_type,
    'content-length': String(d.encoded_bytes),
    etag: `"sha256:${d.encoded_sha256}"`,
    'x-content-sha256': d.encoded_sha256,
    'x-decoded-sha256': d.decoded_sha256,
    'x-array-id': d.array_id,
    'x-chunk-grid': '0.1.2',
    'x-rel': 'r1',
    ...overrides
  })
  const load = (d) => loadVerifiedChunk(d, { path: '/chunk', extraHeaders: { 'x-rel': 'r1' }, codePrefix: 'TEST', messages })

  it('rejects responses that do not bind the exact identity headers', async () => {
    const d = await descriptor()
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { headers: headersFor(d, { 'x-rel': 'other' }) })))
    await expect(load(d)).rejects.toMatchObject({ code: 'TEST_IDENTITY_MISMATCH', message: 'identity' })
  })

  it('rejects an encoded hash mismatch before decoding', async () => {
    const d = { ...(await descriptor()), encoded_sha256: 'e'.repeat(64) }
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { headers: headersFor(d) })))
    await expect(load(d)).rejects.toMatchObject({ code: 'TEST_ENCODED_HASH_FAILED' })
  })

  it('maps upstream failures to ApiError', async () => {
    const d = await descriptor()
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 404 })))
    await expect(load(d)).rejects.toMatchObject({ message: 'req failed with status 404.', status: 404, code: 'HTTP_ERROR' })
  })
})
