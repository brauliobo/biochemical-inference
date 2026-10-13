import cors from '@fastify/cors'
import Fastify from 'fastify'
import { registerErrorHandler } from './http/errors.js'
import { fixedAllowedOrigins } from './http/guards.js'
import { registerResponseHeaders } from './http/hooks.js'
import { createOperationalMetrics } from './operations/metrics.js'
import { registerRoutes } from './routes/index.js'
import { createServices } from './routes/services.js'

export { settleReadinessChecks } from './routes/ops.js'

export async function buildApp(options = {}) {
  const env = options.env ?? process.env
  const allowedOrigins = fixedAllowedOrigins(env)
  const app = Fastify({ bodyLimit: 1_048_576, logger: env.NODE_ENV !== 'test', routerOptions: { maxParamLength: 200 } })
  const operations = createOperationalMetrics()
  const services = await createServices(options, env)
  const { workspace, physiology, dataPlane, measured, challenge, measuredSpatial, spatialRegistration, revalidation } = services

  app.addHook('onClose', async () => {
    await Promise.allSettled([workspace.close?.(), physiology.close?.(), dataPlane.close?.(), measured.close?.(), challenge.close?.(), measuredSpatial.close?.(), spatialRegistration.close?.(), revalidation?.close?.()])
  })
  await app.register(cors, {
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin))
  })
  app.addHook('onRequest', async () => { operations.requestStarted() })
  app.addHook('onResponse', async (_request, reply) => { operations.requestFinished(reply.statusCode) })
  registerResponseHeaders(app)
  registerErrorHandler(app)
  await registerRoutes(app, { ...services, env, options, allowedOrigins, operations })
  return app
}
