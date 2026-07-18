import { buildApp } from './app.js'
import { acquireInferenceRuntimeLock } from './operations/runtime-lock.js'

export function readServerConfiguration(env = process.env) {
  const port = Number(env.PORT ?? 3000)
  const host = env.HOST ?? '127.0.0.1'
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535')
  if (!['127.0.0.1', '::1'].includes(host)) throw new Error('HOST must be the literal loopback address 127.0.0.1 or ::1')
  if (env.BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN) {
    const origin = new URL(env.BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN)
    if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password || origin.origin !== env.BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN) throw new Error('BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN must be an exact HTTP(S) origin')
  }
  return Object.freeze({ host, port })
}

const { port, host } = readServerConfiguration()
let app
let runtimeLock
let shuttingDown = false
let starting = true
let requestedSignal
let shutdownPromise

async function closeResources(signal) {
  if (shuttingDown) return
  shuttingDown = true
  app?.log.info({ signal }, 'graceful shutdown requested')
  try {
    await app?.close()
  } catch (error) {
    app?.log.error(error)
    process.exitCode = 1
  } finally {
    try { await runtimeLock?.release() } catch (error) { app?.log.error(error); process.exitCode = 1 }
    process.removeListener('SIGINT', handleSigint)
    process.removeListener('SIGTERM', handleSigterm)
  }
}

function requestShutdown(signal) {
  requestedSignal ??= signal
  if (!starting && !shutdownPromise) {
    const keepAlive = setInterval(() => {}, 1_000)
    shutdownPromise = closeResources(requestedSignal).finally(() => clearInterval(keepAlive))
  }
}

const handleSigint = () => requestShutdown('SIGINT')
const handleSigterm = () => requestShutdown('SIGTERM')
process.on('SIGINT', handleSigint)
process.on('SIGTERM', handleSigterm)

try {
  runtimeLock = process.env.BIOCHEMICAL_INFERENCE_STATE_ROOT
    ? await acquireInferenceRuntimeLock(process.env.BIOCHEMICAL_INFERENCE_STATE_ROOT)
    : null
  if (!requestedSignal) app = await buildApp()
  if (!requestedSignal) await app.listen({ port, host })
  starting = false
  if (requestedSignal) await closeResources(requestedSignal)
} catch (error) {
  starting = false
  app?.log.error(error)
  await closeResources('startup-failure')
  process.exitCode = 1
}
