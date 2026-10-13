// One cancellable, last-request-wins async operation. Every workbench loads or
// runs something through the API; this is the single place that handles
// AbortController, out-of-order responses and unmount.
//
//   const load = useTask()
//   await load.run(async ({ signal, fresh }) => {
//     return fresh(await loadWorkspace(signal))        // ends the run if superseded
//   }, { done: (workspace) => { ... }, fail: (error) => { ... } })
//
// `run` aborts the previous run of the same task first. A superseded, aborted or
// unmounted run never calls `done` or `fail`; `fresh(value)` after an await
// returns the value while the run is still the latest and ends it otherwise.
// Prefer returning the result and committing it in `done`: everything the run
// changes (data and state) then appears in one step.
import { onBeforeUnmount } from 'vue'

const STALE = Symbol('stale')

export function isAbort(error) {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function errorMessage(error, fallback) {
  return error instanceof Error ? error.message : fallback
}

export function useTask() {
  let epoch = 0
  let controller

  function cancel() {
    epoch += 1
    controller?.abort()
    controller = undefined
  }

  function run(work, { done, fail } = {}) {
    cancel()
    const mine = epoch
    const current = () => mine === epoch
    const request = new AbortController()
    controller = request
    const fresh = (value) => {
      if (!current()) throw STALE
      return value
    }
    let pending
    try {
      pending = Promise.resolve(work({ signal: request.signal, fresh, current }))
    } catch (error) {
      pending = Promise.reject(error)
    }
    return pending.then(
      (value) => {
        if (current()) done?.(value)
        return value
      },
      (error) => {
        if (error === STALE || isAbort(error) || !current()) return undefined
        if (!fail) throw error
        fail(error)
        return undefined
      }
    )
  }

  onBeforeUnmount(cancel)
  return { run, cancel }
}
