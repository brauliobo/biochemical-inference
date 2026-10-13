// Shared HTTP core of the browser API client: error normalisation, JSON
// requests, CSRF headers, strict (cache-policy checked) clients and paging.

export class ApiError extends Error {
  constructor(message, { status, code, payload } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.payload = payload
  }
}

export const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable'
export const JSON_HEADERS = { 'content-type': 'application/json' }

export const csrfHeaders = (name, value) => ({ ...JSON_HEADERS, [name]: value })
export const withSignal = (signal) => (signal ? { signal } : {})

export function queryString(values) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  }
  return query.toString()
}

export function withQuery(path, values) {
  const query = queryString(values)
  return query ? `${path}?${query}` : path
}

// fetch() that keeps aborts untouched (callers own cancellation) and types
// every other transport failure as ApiError(NETWORK_ERROR).
export async function fetchResponse(path, init) {
  try {
    return await fetch(path, init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(error instanceof Error ? error.message : 'Network request failed.', { status: 0, code: 'NETWORK_ERROR', payload: null })
  }
}

export function httpError(response, payload) {
  const isObject = payload && typeof payload === 'object'
  const message = isObject && 'message' in payload ? String(payload.message) : `Request failed with status ${response.status}`
  const code = isObject && 'code' in payload && typeof payload.code === 'string' ? payload.code : 'HTTP_ERROR'
  return new ApiError(message, { status: response.status, code, payload })
}

export const policyError = (response, message, code, payload = null) => new ApiError(message, { status: response.status, code, payload })

export async function requestJson(path, init) {
  const response = await fetchResponse(path, init)
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw httpError(response, payload)
  return payload
}

export async function getJson(path, schema, signal) {
  return schema.parse(await requestJson(path, withSignal(signal)))
}

export async function postJson(path, body, schema, { signal, headers = JSON_HEADERS } = {}) {
  return schema.parse(await requestJson(path, { method: 'POST', headers, body: JSON.stringify(body), ...withSignal(signal) }))
}

export const identityMismatch = (condition, message, code, payload = null) => {
  if (!condition) throw new ApiError(message, { status: 200, code, payload })
}

export const violatesNoStore = (response, cacheControl) =>
  response.headers.get('cache-control') !== cacheControl || response.headers.get('pragma') !== 'no-cache' || response.headers.has('etag')

// A client whose responses must also satisfy a cache/identity policy.
// `verify(response, options)` throws an ApiError when the policy is violated;
// it runs before the status check when `verifyFirst` is set.
export function createStrictClient({ verify, verifyFirst = false }) {
  return async function strictRequest(path, { init, schema, ...options }) {
    const response = await fetchResponse(path, init)
    const payload = await response.json().catch(() => null)
    if (verifyFirst) verify(response, options)
    if (!response.ok) throw httpError(response, payload)
    if (!verifyFirst) verify(response, options)
    const value = schema.parse(payload)
    return options.withCacheControl ? { value, cacheControl: response.headers.get('cache-control') } : value
  }
}

// Collect an offset/total paged inventory, failing closed on identity drift
// or a page sequence that ends before its declared total.
export async function collectOffsetPages(fetchPage, { matches, mismatch, incomplete }) {
  const items = []
  let offset = 0
  let total = 1
  while (offset < total) {
    const page = await fetchPage(offset)
    if (!matches(page, offset)) throw new ApiError(mismatch.message, { status: 409, code: mismatch.code, payload: page })
    items.push(...page.items)
    total = page.total
    offset += page.items.length
    if (page.items.length === 0 && offset < total) throw new ApiError(incomplete.message, { status: 409, code: incomplete.code, payload: page })
  }
  return items
}

// Follow `next_cursor` until it is null; `check` may reject any page.
export async function collectCursorPages(fetchPage, check = () => {}) {
  const items = []
  let cursor = null
  do {
    const page = await fetchPage(cursor)
    check(page)
    items.push(...page.items)
    cursor = page.next_cursor
  } while (cursor !== null)
  return items
}
