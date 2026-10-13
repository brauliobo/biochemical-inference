// One cancellable, last-request-wins async operation. Every workbench loads or
// runs something through the API; this is the single place that handles
// AbortController, out-of-order responses and unmount.
//
//   const load = useTask()
//   await load.run(async ({ signal, guard }) => {
//     workspace.value = await guard(loadWorkspace(signal))   // dropped if superseded
//   }, { fail: (error) => { message.value = errorMessage(error, 'Could not load.') } })
//
// `run` aborts the previous run of the same task first. A superseded, aborted or
// unmounted run never calls `done` or `fail` and never lets `guard` resolve.
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

  async function run(work, { done, fail, settled } = {}) {
    cancel()
    const mine = epoch
    const current = () => mine === epoch
    const request = new AbortController()
    controller = request
    const guard = async (promise) => {
      const value = await promise
      if (!current()) throw STALE
      return value
    }
    try {
      const value = await work({ signal: request.signal, guard, current })
      if (current()) done?.(value)
      return value
    } catch (error) {
      if (error === STALE || isAbort(error) || !current()) return undefined
      if (!fail) throw error
      fail(error)
      return undefined
    } finally {
      if (current()) settled?.()
    }
  }

  onBeforeUnmount(cancel)
  return { run, cancel }
}
