// Mutation guard: the Origin must be startup-allowlisted and carry the domain CSRF header; otherwise `rejection()` is thrown.
export function createCsrfGuard(allowedOrigins, header, value, rejection) {
  return async (request) => {
    if (!(allowedOrigins.has(request.headers.origin) && request.headers[header] === value)) throw rejection()
  }
}

export function fixedAllowedOrigins(env) {
  const values = [env.BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN, ...(env.CORS_ORIGINS ?? '').split(',')].filter((value) => value !== undefined && value !== '')
  return new Set(values.map((raw) => {
    const value = raw.trim()
    let parsed
    try {
      parsed = new URL(value)
    } catch {
      throw new Error(`Invalid configured browser origin: ${raw}.`)
    }
    if (value !== raw || !['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.origin !== value) throw new Error(`Configured browser origin must be an exact HTTP(S) origin: ${raw}.`)
    return value
  }))
}
