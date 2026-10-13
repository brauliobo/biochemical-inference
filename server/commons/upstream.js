// Helpers for bounded HTTP reads from loopback producer services.

// Abort after `timeoutMs`, or earlier when the caller's `signal` aborts.
export function timeoutSignal(timeoutMs, signal) {
  const timeout = AbortSignal.timeout(timeoutMs)
  return signal ? AbortSignal.any([timeout, signal]) : timeout
}

// Reads a response body whose Content-Length is present, within `maximum`
// bytes, and exactly honoured. `ErrorClass` is constructed with a message;
// `allowEmpty: false` also rejects a zero length; `onRead` runs after every
// chunk read (for request-ownership checks).
export async function readBoundedBody(response, { maximum, label, ErrorClass, allowEmpty = true, onRead = () => {} }) {
  const rawLength = response.headers.get('content-length')
  if (rawLength === null || !/^(?:0|[1-9][0-9]*)$/.test(rawLength) || (!allowEmpty && Number(rawLength) === 0) || Number(rawLength) > maximum) {
    throw new ErrorClass(`${label} has a missing, invalid, or excessive Content-Length.`)
  }
  if (!response.body) throw new ErrorClass(`${label} has no body.`)
  const chunks = []
  let total = 0
  const reader = response.body.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      onRead()
      if (done) break
      total += value.byteLength
      if (total > maximum || total > Number(rawLength)) throw new ErrorClass(`${label} exceeded its declared byte boundary.`)
      chunks.push(Buffer.from(value))
    }
  } finally {
    reader.releaseLock()
  }
  if (total !== Number(rawLength)) throw new ErrorClass(`${label} body length does not match Content-Length.`)
  return Buffer.concat(chunks, total)
}

// Accepts only an origin-only http://127.0.0.1 or http://[::1] URL and returns its origin.
// Failures are `new ErrorClass(message, { statusCode: 500, code })` with codes
// `${codePrefix}_URL_INVALID` / `${codePrefix}_URL_REJECTED`.
export function validateLoopbackOrigin(value, { ErrorClass, subject, codePrefix, noun = 'origin' }) {
  let url
  try {
    url = new URL(value)
  } catch {
    throw new ErrorClass(`${subject} URL must be an absolute loopback HTTP ${noun}.`, { statusCode: 500, code: `${codePrefix}_URL_INVALID` })
  }
  if (url.protocol !== 'http:' || !['127.0.0.1', '[::1]'].includes(url.hostname) || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) {
    throw new ErrorClass(`${subject} is restricted to an origin-only 127.0.0.1 or [::1] HTTP URL.`, { statusCode: 500, code: `${codePrefix}_URL_REJECTED` })
  }
  return url.origin
}
