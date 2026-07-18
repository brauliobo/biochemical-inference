const STATUS_CLASSES = ['2xx', '3xx', '4xx', '5xx']

const statusClass = (status) => {
  const selected = `${Math.floor(status / 100)}xx`
  return STATUS_CLASSES.includes(selected) ? selected : '5xx'
}

export function createOperationalMetrics({ timeoutMilliseconds = 5_000 } = {}) {
  if (!Number.isInteger(timeoutMilliseconds) || timeoutMilliseconds < 100 || timeoutMilliseconds > 30_000) throw new TypeError('Operational readiness timeout must be between 100 and 30000 milliseconds.')
  const started = Date.now()
  const responses = Object.fromEntries(STATUS_CLASSES.map((name) => [name, 0n]))
  let requests = 0n
  let inFlight = 0n
  let readinessSuccesses = 0n
  let readinessFailures = 0n
  let readinessTimeouts = 0n
  let readinessPending = null

  function requestStarted() {
    requests += 1n
    inFlight += 1n
  }

  function requestFinished(status) {
    if (inFlight > 0n) inFlight -= 1n
    responses[statusClass(status)] += 1n
  }

  async function readiness(check) {
    if (!readinessPending) {
      const controller = new AbortController()
      const timeout = new Error('operational readiness timed out')
      let timer
      const work = Promise.resolve().then(() => check(controller.signal))
      const promise = Promise.race([
        work,
        new Promise((_, reject) => {
          timer = setTimeout(() => {
            controller.abort(timeout)
            reject(timeout)
          }, timeoutMilliseconds)
        })
      ]).finally(() => clearTimeout(timer))
      const pending = { promise, timeout, work }
      readinessPending = pending
      void promise.finally(async () => {
        await work.catch(() => undefined)
        if (readinessPending === pending) readinessPending = null
      }).catch(() => undefined)
    }
    const pending = readinessPending
    try {
      const result = await pending.promise
      readinessSuccesses += 1n
      return { status: 'ready', ...(result?.domains ? { domains: result.domains } : {}) }
    } catch (error) {
      if (error === pending.timeout) readinessTimeouts += 1n
      else readinessFailures += 1n
      throw error
    }
  }

  function prometheus() {
    const lines = [
      '# HELP biochemical_inference_uptime_seconds Process uptime since app initialization.',
      '# TYPE biochemical_inference_uptime_seconds gauge',
      `biochemical_inference_uptime_seconds ${Math.floor((Date.now() - started) / 1000)}`,
      '# HELP biochemical_inference_http_requests_total HTTP requests without route or identifier labels.',
      '# TYPE biochemical_inference_http_requests_total counter',
      `biochemical_inference_http_requests_total ${requests}`,
      '# HELP biochemical_inference_http_in_flight Current HTTP requests.',
      '# TYPE biochemical_inference_http_in_flight gauge',
      `biochemical_inference_http_in_flight ${inFlight}`,
      '# HELP biochemical_inference_http_responses_total HTTP responses by bounded status class.',
      '# TYPE biochemical_inference_http_responses_total counter',
      ...STATUS_CLASSES.map((name) => `biochemical_inference_http_responses_total{class="${name}"} ${responses[name]}`),
      '# HELP biochemical_inference_readiness_total Operational readiness outcomes.',
      '# TYPE biochemical_inference_readiness_total counter',
      `biochemical_inference_readiness_total{outcome="success"} ${readinessSuccesses}`,
      `biochemical_inference_readiness_total{outcome="failure"} ${readinessFailures}`,
      `biochemical_inference_readiness_total{outcome="timeout"} ${readinessTimeouts}`
    ]
    return `${lines.join('\n')}\n`
  }

  return Object.freeze({ prometheus, readiness, requestFinished, requestStarted })
}
