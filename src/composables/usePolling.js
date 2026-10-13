// Repeats `tick` every `interval` ms for as long as it resolves true. Each tick
// is a cancellable task (see useTask), so `stop()` and unmount also abort the
// request in flight. A tick that throws stops polling unless `onError` returns true.
//
//   const poll = usePolling(async ({ signal, fresh }) => {
//     attempt.value = fresh(await loadAttempt(id, signal))
//     return attempt.value.state !== 'terminal'
//   }, { interval: 750, onError: () => true })
//   poll.start()
import { onBeforeUnmount } from 'vue'
import { useTask } from './useTask.js'

export function usePolling(tick, { interval = 1000, onError } = {}) {
  const task = useTask()
  let timer

  const arm = () => { timer = setTimeout(poll, interval) }

  function poll() {
    timer = undefined
    task.run(tick, {
      done: (again) => { if (again) arm() },
      fail: (error) => { if (onError?.(error)) arm() }
    })
  }

  function stop() {
    clearTimeout(timer)
    timer = undefined
    task.cancel()
  }

  function start() {
    stop()
    arm()
  }

  onBeforeUnmount(stop)
  return { start, stop }
}
