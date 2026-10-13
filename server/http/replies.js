const STATUS_TEXT = {
  400: 'Bad Request',
  404: 'Not Found',
  409: 'Conflict',
  416: 'Range Not Satisfiable',
  422: 'Unprocessable Entity',
  503: 'Service Unavailable'
}

export function problemBody(statusCode, code, error, message, extra) {
  return { statusCode, code, error, message, ...extra }
}

export function sendProblem(reply, statusCode, code, error, message, extra) {
  return reply.status(statusCode).send(problemBody(statusCode, code, error, message, extra))
}

const statusProblem = (statusCode) => (reply, code, message, extra) => sendProblem(reply, statusCode, code, STATUS_TEXT[statusCode], message, extra)
export const badRequest = statusProblem(400)
export const notFound = statusProblem(404)
export const conflict = statusProblem(409)

// Sets no-store headers. `privateCache` selects "private, no-store"; `dropEtag` also removes any etag already set.
export function noStore(reply, { privateCache = false, dropEtag = true } = {}) {
  reply.headers({ 'cache-control': privateCache ? 'private, no-store' : 'no-store', pragma: 'no-cache' })
  if (dropEtag) reply.removeHeader('etag')
  return reply
}

// Builds the (reply, parsed) callback used by parseOrReply for one failure shape.
export function problemReply(statusCode, code, message, { fieldErrors = true, noStore: withNoStore = false } = {}) {
  return (reply, parsed) => {
    if (withNoStore) noStore(reply, { dropEtag: false })
    return sendProblem(reply, statusCode, code, STATUS_TEXT[statusCode], message, fieldErrors ? { fieldErrors: parsed.error.flatten().fieldErrors } : undefined)
  }
}

// Returns parsed data, or undefined after sending the failure reply (callers then `return reply`).
export function parseOrReply(reply, schema, value, invalid) {
  const parsed = schema.safeParse(value)
  if (parsed.success) return parsed.data
  invalid(reply, parsed)
  return undefined
}
