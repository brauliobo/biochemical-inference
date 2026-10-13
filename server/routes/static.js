import fastifyStatic from '@fastify/static'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { notFound } from '../http/replies.js'

// Must be registered after every API route so the SPA fallback never shadows them.
export async function registerStaticRoutes(app, { options }) {
  const clientRoot = options.clientRoot ?? resolve(process.cwd(), 'dist')
  if (options.serveClient === false || !existsSync(clientRoot)) return
  await app.register(fastifyStatic, { root: clientRoot })
  app.setNotFoundHandler((request, reply) => request.raw.url?.startsWith('/api/')
    ? notFound(reply, 'NOT_FOUND', 'API route not found')
    : reply.sendFile('index.html'))
}
