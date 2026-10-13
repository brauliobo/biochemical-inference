// The lifecycle shared by every workbench that reads a signed release from a
// verified local mirror (frozen challenge, measured spatial atlas, spatial
// registration): load discovery and status, synchronize explicitly, re-verify
// integrity without the network, and complete the mirror for offline use.
//
//   const mirror = useMirror({
//     api: { discovery: loadX, status: loadXStatus, sync: syncX, integrity: verifyX, complete: completeX },
//     loadLocal: async ({ signal, fresh }) => { records.value = fresh(await loadRecords(signal)) },
//     text: { load: 'Could not load.', sync: 'Sync failed.', synced: 'Synced.', integrity: 'Integrity check failed.', integrityDone: (r) => `Integrity ${r.status}.` }
//   })
//   onMounted(mirror.initialize)
//
// `mirror.flow` is the underlying workflow (state, message, announcement, busy,
// step) for the workbench's own operations.
import { computed, ref } from 'vue'
import { useWorkflow } from './useWorkflow.js'

const mirrorReady = (status) => status?.state === 'ready' && status?.integrity === 'valid'

export function useMirror({ api, loadLocal, text, reloadDiscoveryAfterSync = false, isReady = mirrorReady }) {
  const flow = useWorkflow()
  const discovery = ref()
  const status = ref()
  const integrity = ref()
  const completion = ref()
  const ready = computed(() => isReady(status.value))

  const initialize = () => flow.step('loading', async (task) => {
    const [loadedDiscovery, loadedStatus] = task.fresh(await Promise.all([api.discovery(task.signal), api.status(task.signal)]))
    discovery.value = loadedDiscovery
    status.value = loadedStatus
    if (isReady(loadedStatus)) await loadLocal?.(task)
  }, { failure: text.load })

  const synchronize = () => flow.step('syncing', async (task) => {
    status.value = task.fresh(await api.sync(task.signal))
    await loadLocal?.(task)
    if (reloadDiscoveryAfterSync) discovery.value = task.fresh(await api.discovery(task.signal))
  }, { announce: text.synced, failure: text.sync })

  // The result, the refreshed status and the settled state appear together.
  const checkIntegrity = () => flow.step('checking', async ({ signal, fresh }) => {
    const checked = fresh(await api.integrity(signal))
    return { checked, latest: fresh(await api.status(signal)) }
  }, {
    done: ({ checked, latest }) => {
      integrity.value = checked
      status.value = latest
      if (checked.status !== 'failed') return 'idle'
      flow.message.value = checked.findings?.join(' ') ?? text.integrity
      return 'failed'
    },
    announce: () => text.integrityDone(integrity.value),
    failure: text.integrity
  })

  const completeOffline = () => flow.step('completing', async ({ signal, fresh }) => {
    const completed = fresh(await api.complete(signal))
    return { completed, latest: fresh(await api.status(signal)) }
  }, {
    done: ({ completed, latest }) => {
      completion.value = completed
      status.value = latest
      return 'idle'
    },
    announce: text.completed,
    failure: text.complete
  })

  return { flow, discovery, status, integrity, completion, ready, initialize, synchronize, checkIntegrity, completeOffline }
}
