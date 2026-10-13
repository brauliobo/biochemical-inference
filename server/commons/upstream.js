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
