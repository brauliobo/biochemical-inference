import { buildApp } from './app.js'

const port = Number(process.env.PORT ?? 3000)
const host = process.env.HOST ?? '127.0.0.1'
const app = await buildApp()

let shuttingDown = false
async function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  app.log.info({ signal }, 'graceful shutdown requested')
  try {
    await app.close()
  } catch (error) {
    app.log.error(error)
    process.exitCode = 1
  }
}

process.once('SIGINT', () => { void shutdown('SIGINT') })
process.once('SIGTERM', () => { void shutdown('SIGTERM') })

try {
  await app.listen({ port, host })
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
