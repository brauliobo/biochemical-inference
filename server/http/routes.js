import { z } from 'zod'
import { parseOrReply } from './replies.js'

// Source of each validated input, in the key order of a route spec (validation runs in that order).
const INPUTS = {
  params: (request) => request.params,
  query: (request) => request.query,
  body: (request) => request.body,
  bodyOrEmpty: (request) => request.body ?? {}
}

export const paramSchema = (name, schema) => z.object({ [name]: schema }).strict()

/**
 * Declarative route registration for one domain.
 *
 * `spec` may contain `params` / `query` / `body` / `bodyOrEmpty` (zod schemas, validated in the order written),
 * `invalid` (overrides the domain default failure reply), `options` (Fastify route options) and `status`
 * (reply status for a handler that always returns plain data). The handler receives
 * `(input, request, reply)` where `input` holds the parsed `params` / `query` / `body`.
 */
export function createRouter(app, defaultInvalid) {
  const define = (method) => (url, spec, handler) => {
    const { invalid = defaultInvalid, options = {}, status } = spec
    const steps = Object.keys(spec).filter((key) => key in INPUTS)
    app[method](url, options, async (request, reply) => {
      const input = {}
      for (const key of steps) {
        const data = parseOrReply(reply, spec[key], INPUTS[key](request), invalid)
        if (data === undefined) return reply
        input[key === 'bodyOrEmpty' ? 'body' : key] = data
      }
      const result = await handler(input, request, reply)
      return status ? reply.status(status).send(result) : result
    })
  }
  return { get: define('get'), post: define('post'), del: define('delete') }
}
