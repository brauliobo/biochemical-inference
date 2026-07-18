#!/usr/bin/env node
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { inspectNoSymlinkPath } from '../../server/operations/path-safety.js'

const serviceRoot = (await inspectNoSymlinkPath(process.argv[2], 'pinned prior database service')).path
const stateRoot = (await inspectNoSymlinkPath(process.env.BIOCHEMICAL_JS_DATA_DIR, 'pinned prior database state', { allowMissing: true })).path
const moduleUrl = (path) => pathToFileURL(resolve(serviceRoot, path)).href
const [{ serve }, { createApp }, { openNodeFilesystemStores }, { closeStores }] = await Promise.all([
  import(moduleUrl('node_modules/@hono/node-server/dist/index.mjs')),
  import(moduleUrl('src/http/app.js')),
  import(moduleUrl('src/storage/profiles-node.js')),
  import(moduleUrl('src/storage/profiles.js'))
])
const port = Number(process.env.PORT)
const hostname = process.env.BIOCHEMICAL_JS_HOST ?? '127.0.0.1'
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('pinned prior database fixture requires a valid PORT')
const stores = await openNodeFilesystemStores(stateRoot)
const app = createApp({ repository: stores['knowledge-index'] })
const server = serve({ fetch: app.fetch, hostname, port })
let closing
const close = () => {
  closing ??= (async () => {
    let failure
    try { await new Promise((resolveClose, rejectClose) => server.close((error) => error ? rejectClose(error) : resolveClose())) } catch (error) { failure = error }
    try { await closeStores(stores) } catch (error) { failure ??= error }
    process.removeListener('SIGINT', shutdown)
    process.removeListener('SIGTERM', shutdown)
    if (failure) throw failure
  })()
  return closing
}
const shutdown = () => {
  const keepAlive = setInterval(() => {}, 1_000)
  void close().catch(() => { process.exitCode = 1 }).finally(() => clearInterval(keepAlive))
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
