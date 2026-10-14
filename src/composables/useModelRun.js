// Run a simulation whenever its controls change: debounced, last-run-wins, cancelled on unmount.
// The models are fast (25 to 120 ms for a 72 h scenario), so they run on the main thread; ensembles of
// about 100 members take seconds and belong in a worker (useEnsemble.js).
//
//   const controls = reactive({ scenarioId: 'glycine-10g', sliders: { ... } })
//   const { result, running, error, warnings } = useModelRun(
//     () => import('./runner.js').then((m) => m.run),     // lazy: the simulator stays out of the initial bundle
//     controls, { debounceMs: 120 })
//
// `controls` is a reactive object, a ref or a getter. `getRunner()` returns (or resolves to)
// `run(snapshot, { isStale })`, which may be sync or async and returns the result; a `warnings` array on the
// result is surfaced. `snapshot` is a plain copy of the controls taken when the run starts. A new change
// cancels the pending timer and makes any run still in flight stale: its result is dropped. A failed run keeps
// the previous result and sets `error`.
import { getCurrentScope, onScopeDispose, ref, shallowRef, toRaw, toValue, watch } from 'vue'

const plain = (value) => JSON.parse(JSON.stringify(toRaw(value) ?? null))
const macrotask = () => new Promise((resolve) => setTimeout(resolve, 0))

export function useModelRun(getRunner, controls, { debounceMs = 120, immediate = true, deep = true } = {}) {
  const result = shallowRef(null)
  const running = ref(false)
  const error = shallowRef(null)
  const warnings = shallowRef([])
  let epoch = 0
  let timer = null
  let runner = null
  let disposed = false

  async function execute(mine) {
    running.value = true
    try {
      runner ??= await getRunner()
      if (mine !== epoch || disposed) return
      await macrotask() // let the "running" state paint before a synchronous model blocks the thread
      if (mine !== epoch || disposed) return
      const out = await runner(plain(toValue(controls)), { isStale: () => mine !== epoch || disposed })
      if (mine !== epoch || disposed) return
      result.value = out
      warnings.value = Array.isArray(out?.warnings) ? out.warnings : []
      error.value = null
    } catch (failure) {
      if (mine === epoch && !disposed) error.value = failure instanceof Error ? failure : new Error(String(failure))
    } finally {
      if (mine === epoch) running.value = false
    }
  }

  function schedule(delay) {
    epoch += 1
    clearTimeout(timer)
    const mine = epoch
    if (delay <= 0) {
      timer = null
      return execute(mine)
    }
    running.value = true
    timer = setTimeout(() => { timer = null; execute(mine) }, delay)
    return undefined
  }

  function cancel() {
    epoch += 1
    clearTimeout(timer)
    timer = null
    running.value = false
  }

  watch(controls, () => schedule(debounceMs), { deep })
  if (immediate) schedule(0)
  if (getCurrentScope()) onScopeDispose(() => { disposed = true; cancel() })

  return { result, running, error, warnings, run: () => schedule(0), cancel }
}
