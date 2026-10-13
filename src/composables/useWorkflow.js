// The state machine every API-backed workbench shares: a `state` word that is
// printed in a badge, an error `message`, a screen-reader `announcement`, and
// `busy` while an operation is in flight.
//
//   const flow = useWorkflow()                       // starts 'loading'
//   await flow.step('syncing', async ({ signal, guard }) => {
//     status.value = await guard(syncChallenge(signal))
//   }, { announce: 'Synchronized.', failure: 'Synchronization failed.' })
//
// `step` sets the state, clears the message, runs the work as the latest
// request (see useTask) and settles on `done` ('idle'), or on 'failed' with the
// error's message. Steps supersede one another, so a new step aborts a running one.
import { computed, ref } from 'vue'
import { errorMessage, useTask } from './useTask.js'

export function useWorkflow({ initial = 'loading', settled = ['idle', 'failed'] } = {}) {
  const state = ref(initial)
  const message = ref('')
  const announcement = ref('')
  const busy = computed(() => !settled.includes(state.value))
  const task = useTask()

  function fail(error, fallback) {
    state.value = 'failed'
    message.value = errorMessage(error, fallback)
  }

  function step(next, work, { done = 'idle', announce, failure = 'The operation failed.' } = {}) {
    state.value = next
    message.value = ''
    return task.run(work, {
      done: (result) => {
        state.value = typeof done === 'function' ? done(result) : done
        if (announce) announcement.value = typeof announce === 'function' ? announce(result) : announce
      },
      fail: (error) => fail(error, failure)
    })
  }

  return { state, message, announcement, busy, step, fail, task }
}
