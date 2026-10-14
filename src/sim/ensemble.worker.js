// Web Worker that runs a parameter-uncertainty ensemble of the methylation model off the main thread
// (n = 100 takes about 3 s). Protocol:
//   in   { type: 'run', job: { scenario, variants, observables, n, seed, fixed, samplesPerHour } }
//   out  { type: 'progress', done, n } ... then { type: 'done', result } or { type: 'error', message }
// A new job is started by terminating this worker and creating another (see composables/useEnsemble.js),
// because a synchronous loop cannot be interrupted from outside.
import { ensembleBands } from './ensemble-bands.js'

self.onmessage = async (event) => {
  const { type, job } = event.data ?? {}
  if (type !== 'run') return
  try {
    let last = 0
    const result = await ensembleBands({
      ...job,
      onProgress: (done, n) => {
        const now = Date.now()
        if (now - last > 80 || done === n) { last = now; self.postMessage({ type: 'progress', done, n }) }
      }
    })
    self.postMessage({ type: 'done', result })
  } catch (error) {
    self.postMessage({ type: 'error', message: error?.message ?? String(error) })
  }
}
