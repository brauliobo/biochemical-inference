// Parameter-uncertainty ensemble of the methylation model, off the main thread.
//
//   const { bands, progress, running, error } = useEnsemble(
//     () => ({ scenario, variants, observables: ['samSahRatio', 'sam'], n: 100, seed: 7 }),   // the job; null = nothing to run
//     showUncertainty)                                                                        // a ref: only runs while true
//
// A Web Worker (sim/ensemble.worker.js) runs the members, so the page stays responsive (n = 100 is about 3 s).
// A job change terminates the worker and starts a new one after `debounceMs`, because a synchronous loop cannot be
// interrupted from outside. Without Worker support (tests, very old browsers) the same code runs on the main
// thread in small slices (`yieldEvery` members). `bands` is { time, n, ok, bands: { id: { p5, p50, p95 } } } with
// ratios to each member's own starting value (see sim/ensemble-bands.js), or null; `progress` is 0 to 1.
// Nothing is imported until the first run, so the simulator and the worker stay out of the initial bundle.
import { getCurrentScope, onScopeDispose, ref, shallowRef, toValue, watch } from 'vue'

function startWorker() {
  return new Worker(new URL('../sim/ensemble.worker.js', import.meta.url), { type: 'module' })
}

export function useEnsemble(getJob, enabled = true, { debounceMs = 350, createWorker = typeof Worker === 'undefined' ? null : startWorker, yieldEvery = 4 } = {}) {
  const bands = shallowRef(null)
  const progress = ref(0)
  const running = ref(false)
  const error = shallowRef(null)
  let epoch = 0
  let timer = null
  let worker = null
  let disposed = false

  function stopWorker() {
    worker?.terminate()
    worker = null
  }

  function finish(mine, result) {
    if (mine !== epoch || disposed) return
    running.value = false
    progress.value = 1
    if (!result.cancelled) bands.value = result
  }

  async function runHere(mine, job) {
    const { ensembleBands } = await import('../sim/ensemble-bands.js')
    const result = await ensembleBands({ ...job, yieldEvery, cancelled: () => mine !== epoch || disposed, onProgress: (done, n) => { if (mine === epoch) progress.value = done / n } })
    finish(mine, result)
  }

  function runInWorker(mine, job) {
    worker = createWorker()
    worker.onmessage = (event) => {
      if (mine !== epoch) return
      const { type } = event.data
      if (type === 'progress') progress.value = event.data.done / event.data.n
      else if (type === 'done') { finish(mine, event.data.result); stopWorker() }
      else if (type === 'error') { error.value = new Error(event.data.message); running.value = false; stopWorker() }
    }
    worker.onerror = (event) => {
      if (mine !== epoch) return
      error.value = new Error(event.message || 'The ensemble worker failed.')
      running.value = false
      stopWorker()
    }
    worker.postMessage({ type: 'run', job })
  }

  function start(mine) {
    const job = toValue(getJob)
    if (!job) { running.value = false; return }
    error.value = null
    progress.value = 0
    running.value = true
    try {
      if (createWorker) runInWorker(mine, JSON.parse(JSON.stringify(job)))
      else runHere(mine, job).catch((failure) => { if (mine === epoch) { error.value = failure; running.value = false } })
    } catch (failure) {
      error.value = failure
      running.value = false
    }
  }

  function cancel() {
    epoch += 1
    clearTimeout(timer)
    timer = null
    stopWorker()
    running.value = false
  }

  function schedule() {
    cancel()
    if (!toValue(enabled) || !toValue(getJob)) return
    const mine = epoch
    running.value = true
    timer = setTimeout(() => { timer = null; start(mine) }, debounceMs)
  }

  watch(() => (toValue(enabled) ? JSON.stringify(toValue(getJob) ?? null) : null), (key, previous) => {
    if (key === null) { cancel(); return }
    if (key !== previous) bands.value = null // a ribbon for another job would be misleading
    schedule()
  }, { immediate: true })
  if (getCurrentScope()) onScopeDispose(() => { disposed = true; cancel() })

  return { bands, progress, running, error, cancel }
}
