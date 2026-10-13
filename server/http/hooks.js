import { noStore } from './replies.js'

// URL-prefix cache rules applied on send; `errorsOnly` limits a rule to status >= 400.
export const CACHE_RULES = [
  { prefix: '/api/v6/derived' },
  { prefix: '/api/v11/challenge', privateCache: true },
  { prefix: '/api/v12/measured-spatial', errorsOnly: true },
  { prefix: '/api/v14/spatial-registration', errorsOnly: true },
  { prefix: '/api/v13/revalidation' }
]

export function registerResponseHeaders(app, rules = CACHE_RULES) {
  app.addHook('onSend', async (request, reply, payload) => {
    if (reply.getHeader('content-type')?.toString().startsWith('text/html')) {
      if (!reply.hasHeader('content-security-policy')) reply.header('content-security-policy', "frame-ancestors 'none'")
      reply.header('x-frame-options', 'DENY')
    }
    for (const rule of rules) {
      if (request.url.startsWith(rule.prefix) && (!rule.errorsOnly || reply.statusCode >= 400)) noStore(reply, { privateCache: rule.privateCache })
    }
    return payload
  })
}
