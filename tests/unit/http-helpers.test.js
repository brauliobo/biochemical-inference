import Fastify from 'fastify'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { registerErrorHandler } from '../../server/http/errors.js'
import { createCsrfGuard } from '../../server/http/guards.js'
import { CACHE_RULES, registerResponseHeaders } from '../../server/http/hooks.js'
import { noStore, problemBody, problemReply } from '../../server/http/replies.js'
import { createRouter, paramSchema } from '../../server/http/routes.js'
import { SpatialRangeError } from '../../server/spatial/range.js'

const apps = []
function build() {
  const app = Fastify({ logger: false })
  apps.push(app)
  return app
}
afterEach(async () => { await Promise.all(apps.splice(0).map((app) => app.close())) })

describe('replies', () => {
  it('builds problem bodies with ordered keys and extras', () => {
    expect(Object.keys(problemBody(404, 'X', 'Not Found', 'm', { findings: [] }))).toEqual(['statusCode', 'code', 'error', 'message', 'findings'])
  })

  it('sets no-store headers, optionally private and optionally keeping the etag', async () => {
    const app = build()
    app.get('/a', async (_request, reply) => noStore(reply.header('etag', '"x"')).send({}))
    app.get('/b', async (_request, reply) => noStore(reply.header('etag', '"x"'), { privateCache: true, dropEtag: false }).send({}))
    const a = await app.inject('/a')
    const b = await app.inject('/b')
    expect(a.headers).toMatchObject({ 'cache-control': 'no-store', pragma: 'no-cache' })
    expect(a.headers.etag).toBeUndefined()
    expect(b.headers).toMatchObject({ 'cache-control': 'private, no-store', etag: '"x"' })
  })
})

describe('router', () => {
  it('validates inputs in declared order and replies with the domain failure', async () => {
    const app = build()
    const invalid = problemReply(422, 'BAD', 'Bad input.')
    const { get, post } = createRouter(app, invalid)
    get('/items/:id', { params: paramSchema('id', z.string().regex(/^\d+$/)), query: z.object({}).strict() }, ({ params }) => ({ id: params.id }))
    post('/items', { bodyOrEmpty: z.object({ n: z.number().optional() }).strict(), status: 201 }, ({ body }) => body)
    expect((await app.inject('/items/12')).json()).toEqual({ id: '12' })
    const bad = await app.inject('/items/x')
    expect(bad.statusCode).toBe(422)
    expect(bad.json()).toMatchObject({ statusCode: 422, code: 'BAD', error: 'Unprocessable Entity', message: 'Bad input.' })
    expect(bad.json().fieldErrors).toHaveProperty('id')
    expect((await app.inject('/items/1?extra=1')).statusCode).toBe(422)
    const created = await app.inject({ method: 'POST', url: '/items' })
    expect(created.statusCode).toBe(201)
    expect(created.json()).toEqual({})
  })
})

describe('guards and hooks', () => {
  it('rejects mutations without an allowlisted origin and CSRF header', async () => {
    const app = build()
    const guard = createCsrfGuard(new Set(['http://a.test']), 'x-csrf', 'v', () => Object.assign(new Error('no'), { statusCode: 403 }))
    app.post('/m', { preHandler: guard }, async () => ({ ok: true }))
    expect((await app.inject({ method: 'POST', url: '/m' })).statusCode).toBe(403)
    expect((await app.inject({ method: 'POST', url: '/m', headers: { origin: 'http://a.test', 'x-csrf': 'v' } })).statusCode).toBe(200)
  })

  it('applies prefix cache rules, limiting error-only rules to status >= 400', async () => {
    const app = build()
    registerResponseHeaders(app, CACHE_RULES)
    app.get('/api/v6/derived/x', async () => ({}))
    app.get('/api/v11/challenge/x', async () => ({}))
    app.get('/api/v12/measured-spatial/ok', async () => ({}))
    app.get('/api/v12/measured-spatial/err', async (_request, reply) => reply.status(404).send({}))
    expect((await app.inject('/api/v6/derived/x')).headers['cache-control']).toBe('no-store')
    expect((await app.inject('/api/v11/challenge/x')).headers['cache-control']).toBe('private, no-store')
    expect((await app.inject('/api/v12/measured-spatial/ok')).headers['cache-control']).toBeUndefined()
    expect((await app.inject('/api/v12/measured-spatial/err')).headers['cache-control']).toBe('no-store')
  })
})

describe('error handler', () => {
  it('maps range errors, validation errors, generic 4xx, and unknown failures', async () => {
    const app = build()
    registerErrorHandler(app)
    app.get('/range', async () => { throw new SpatialRangeError(10) })
    app.get('/client', async () => { throw Object.assign(new Error('teapot'), { statusCode: 418 }) })
    app.get('/boom', async () => { throw new Error('secret') })
    app.post('/json', async () => ({}))
    const range = await app.inject('/range')
    expect(range.statusCode).toBe(416)
    expect(range.headers['content-range']).toBe('bytes */10')
    expect((await app.inject('/client')).json()).toMatchObject({ statusCode: 418, code: 'BAD_REQUEST', message: 'teapot' })
    const boom = await app.inject('/boom')
    expect(boom.statusCode).toBe(500)
    expect(boom.json()).toMatchObject({ code: 'INTERNAL_ERROR' })
    expect(boom.body).not.toContain('secret')
    const malformed = await app.inject({ method: 'POST', url: '/json', headers: { 'content-type': 'application/json' }, payload: '{' })
    expect(malformed.statusCode).toBe(400)
  })
})
