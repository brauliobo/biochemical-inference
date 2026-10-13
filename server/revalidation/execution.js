import { fork } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CampaignWorkerFailureSchema, CampaignWorkerResultSchema } from '../../shared/revalidation-contracts.js'
import { REVALIDATION_EXECUTOR_ALLOWLIST } from './executors.js'

export { REVALIDATION_EXECUTOR_ALLOWLIST } from './executors.js'

const MAX_PROTOCOL_BYTES = 16 * 1024 * 1024
const MAX_DIAGNOSTIC_BYTES = 64 * 1024
const WORKER_PROTOCOL_VERSION = '1.0.0'

export function assertRssMeasurementAvailable() {
  try {
    if (!/^VmRSS:\s+\d+\s+kB$/m.test(readFileSync('/proc/self/status', 'utf8'))) throw new Error('VmRSS is unavailable')
  } catch (error) {
    throw new Error(`Revalidation process RSS enforcement requires Linux procfs: ${error.message}`)
  }
}

const failure = (code, message) => ({
  type: 'failure',
  failure: CampaignWorkerFailureSchema.parse({ code, message, checkpoint: null })
})

function appendDiagnostic(current, chunk) {
  const next = `${current}${chunk}`
  return Buffer.byteLength(next) <= MAX_DIAGNOSTIC_BYTES ? next : next.slice(-MAX_DIAGNOSTIC_BYTES)
}

function diagnostic(worker) {
  const stderr = worker.stderr.trim()
  return `pid=${worker.child.pid ?? 'unavailable'}${stderr ? ` stderr=${JSON.stringify(stderr)}` : ''}`
}

export function createRevalidationWorkerPool(options = {}) {
  const maximumWorkers = options.maximumWorkers ?? 1
  const readyTimeoutMs = options.readyTimeoutMs ?? 10_000
  const shutdownTimeoutMs = options.shutdownTimeoutMs ?? 2_000
  if (!Number.isInteger(maximumWorkers) || maximumWorkers < 1 || maximumWorkers > 16) throw new TypeError('Revalidation worker pool size must be an integer from 1 to 16.')
  const workers = new Set()
  const queue = []
  let closed = false
  let sequence = 0

  function finish(job, value) {
    if (job.settled) return
    job.settled = true
    clearTimeout(job.timer)
    clearInterval(job.rssTimer)
    job.resolve({ ...value, metrics: { peak_rss_bytes: job.peakRssBytes, runtime_ms: job.startedAt === null ? 0 : Date.now() - job.startedAt } })
  }

  function removeQueued(job) {
    const index = queue.indexOf(job)
    if (index !== -1) queue.splice(index, 1)
  }

  function stopWorker(worker, signal = 'SIGKILL') {
    if (worker.stopping) return
    worker.stopping = true
    worker.child.kill(signal)
  }

  function failWorkerJob(worker, code, message) {
    if (!worker.job) return
    const job = worker.job
    worker.job = null
    finish(job, failure(code, `${message} (${diagnostic(worker)})`))
  }

  function compactRequest(worker, request) {
    const campaignId = request.campaign.campaign_id
    if (!worker.campaigns.has(campaignId)) {
      worker.campaigns.add(campaignId)
      return request
    }
    const { campaign: _campaign, inputs: _inputs, ...attempt } = request
    return { ...attempt, campaign_id: campaignId }
  }

  function measureRss(worker, job, rssLimitBytes) {
    const match = readFileSync(`/proc/${worker.child.pid}/status`, 'utf8').match(/^VmRSS:\s+(\d+)\s+kB$/m)
    if (!match) throw new Error('VmRSS is unavailable')
    job.peakRssBytes = Math.max(job.peakRssBytes ?? 0, Number(match[1]) * 1024)
    if (job.peakRssBytes > rssLimitBytes) {
      stopWorker(worker)
      failWorkerJob(worker, 'resource-exhausted', `Worker RSS exceeded ${rssLimitBytes} bytes.`)
      return false
    }
    return true
  }

  function startJob(worker, job) {
    worker.job = job
    job.worker = worker
    job.startedAt = Date.now()
    const encoded = JSON.stringify({ type: 'execute', request_id: job.id, request: compactRequest(worker, job.request) })
    if (Buffer.byteLength(encoded) > MAX_PROTOCOL_BYTES) {
      worker.job = null
      finish(job, failure('invalid-worker-input', 'Revalidation worker request exceeds 16 MiB.'))
      dispatch()
      return
    }
    const rssLimitBytes = job.options.memoryMib * 1024 * 1024
    try {
      if (!measureRss(worker, job, rssLimitBytes)) return
    } catch {
      stopWorker(worker)
      failWorkerJob(worker, 'worker-lost', 'Worker RSS could not be measured safely.')
      return
    }
    job.timer = setTimeout(() => {
      stopWorker(worker)
      failWorkerJob(worker, 'resource-exhausted', `Worker exceeded the ${job.options.timeoutMs} ms runtime limit.`)
    }, job.options.timeoutMs)
    job.rssTimer = setInterval(() => {
      if (job.settled || !worker.child.pid) return
      try {
        measureRss(worker, job, rssLimitBytes)
      } catch {
        stopWorker(worker)
        failWorkerJob(worker, 'worker-lost', 'Worker RSS could not be measured safely.')
      }
    }, job.options.rssPollMs ?? 50)
    job.rssTimer.unref?.()
    worker.child.send(encoded, (error) => {
      if (!error) return
      stopWorker(worker)
      failWorkerJob(worker, 'worker-lost', `Worker request delivery failed: ${error.message}`)
    })
  }

  function nextJob(memoryMib) {
    const index = queue.findIndex((job) => job.options.memoryMib === memoryMib)
    if (index === -1) return null
    return queue.splice(index, 1)[0]
  }

  function spawnWorker(memoryMib) {
    const workerPath = process.env.VITEST ? resolve(process.cwd(), 'server/revalidation/worker.js') : fileURLToPath(new URL('./worker.js', import.meta.url))
    const child = fork(workerPath, [], {
      execArgv: [`--max-old-space-size=${memoryMib}`],
      stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
      serialization: 'json',
      env: { NODE_ENV: 'production' }
    })
    const worker = { child, memoryMib, ready: false, stopping: false, job: null, stderr: '', campaigns: new Set(), readyTimer: null, exitPromise: null }
    worker.exitPromise = new Promise((resolvePromise) => child.once('exit', (code, signal) => resolvePromise({ code, signal })))
    workers.add(worker)
    worker.readyTimer = setTimeout(() => {
      stopWorker(worker)
      const job = nextJob(worker.memoryMib)
      if (job) finish(job, failure('worker-lost', `Worker did not complete its ready handshake within ${readyTimeoutMs} ms (${diagnostic(worker)}).`))
    }, readyTimeoutMs)
    child.stderr.on('data', (chunk) => { worker.stderr = appendDiagnostic(worker.stderr, chunk.toString()) })
    child.on('message', (raw) => {
      try {
        if (typeof raw !== 'string') throw new Error('Worker output is not a string.')
        if (worker.job && Buffer.byteLength(raw) > worker.job.options.maximumOutputBytes) {
          stopWorker(worker)
          failWorkerJob(worker, 'resource-exhausted', `Worker output exceeded ${worker.job.options.maximumOutputBytes} bytes.`)
          return
        }
        if (Buffer.byteLength(raw) > MAX_PROTOCOL_BYTES) throw new Error('Worker output exceeded its bounded protocol.')
        const message = JSON.parse(raw)
        if (message.type === 'ready') {
          if (worker.ready || message.pid !== child.pid || message.protocol_version !== WORKER_PROTOCOL_VERSION || JSON.stringify(message.executors) !== JSON.stringify(REVALIDATION_EXECUTOR_ALLOWLIST)) throw new Error('Worker ready diagnostics do not match the spawned allowlisted process.')
          worker.ready = true
          clearTimeout(worker.readyTimer)
          dispatch()
          return
        }
        const job = worker.job
        if (!worker.ready || !job || message.request_id !== job.id) throw new Error('Worker terminal output does not match its active request.')
        worker.job = null
        if (message.type === 'result') finish(job, { type: 'result', result: CampaignWorkerResultSchema.parse(message.result) })
        else if (message.type === 'failure') finish(job, { type: 'failure', failure: CampaignWorkerFailureSchema.parse(message.failure) })
        else throw new Error('Unknown worker message type.')
        dispatch()
      } catch (error) {
        stopWorker(worker)
        failWorkerJob(worker, 'invalid-worker-output', error instanceof Error ? error.message : 'Worker output failed validation.')
      }
    })
    child.on('error', (error) => {
      stopWorker(worker)
      failWorkerJob(worker, 'worker-lost', `Worker process error: ${error.message}`)
    })
    worker.exitPromise.then(({ code, signal }) => {
      clearTimeout(worker.readyTimer)
      workers.delete(worker)
      failWorkerJob(worker, 'worker-lost', `Worker exited before terminal completion (${signal ?? code}).`)
      if (!closed) dispatch()
    })
    return worker
  }

  function dispatch() {
    if (closed) return
    for (const worker of workers) {
      if (!worker.ready || worker.stopping || worker.job) continue
      const job = nextJob(worker.memoryMib)
      if (job) startJob(worker, job)
    }
    while (queue.length > 0 && workers.size < maximumWorkers) spawnWorker(queue[0].options.memoryMib)
    if (queue.length > 0 && [...workers].every((worker) => worker.job === null && worker.memoryMib !== queue[0].options.memoryMib)) {
      const replace = [...workers].find((worker) => worker.job === null && !worker.stopping)
      if (replace) stopWorker(replace, 'SIGTERM')
    }
  }

  function execute(request, executionOptions) {
    if (closed) throw new Error('Revalidation worker pool is closed.')
    const job = {
      id: `request-${++sequence}`,
      request,
      options: executionOptions,
      worker: null,
      settled: false,
      startedAt: null,
      peakRssBytes: null,
      timer: null,
      rssTimer: null,
      resolve: null
    }
    const promise = new Promise((resolvePromise) => { job.resolve = resolvePromise })
    queue.push(job)
    dispatch()
    const interrupt = (code, message) => {
      if (job.settled) return false
      if (!job.worker) {
        removeQueued(job)
        finish(job, failure(code, message))
      } else {
        stopWorker(job.worker, 'SIGTERM')
        failWorkerJob(job.worker, code, message)
      }
      return true
    }
    return {
      get pid() { return job.worker?.child.pid ?? null },
      promise,
      cancel: () => interrupt('cancelled', 'Worker was cancelled before terminal completion.'),
      interrupt: () => interrupt('worker-lost', 'Worker was interrupted before terminal completion.')
    }
  }

  async function close() {
    if (closed) return
    closed = true
    for (const job of queue.splice(0)) finish(job, failure('worker-lost', 'Worker pool closed before execution.'))
    for (const worker of workers) {
      failWorkerJob(worker, 'worker-lost', 'Worker pool closed during execution.')
      stopWorker(worker, 'SIGTERM')
    }
    const exits = Promise.allSettled([...workers].map((worker) => worker.exitPromise))
    const stopped = await Promise.race([exits.then(() => true), new Promise((resolvePromise) => setTimeout(() => resolvePromise(false), shutdownTimeoutMs))])
    if (!stopped) {
      for (const worker of workers) worker.child.kill('SIGKILL')
      await exits
    }
  }

  return { execute, close }
}

