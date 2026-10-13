// The attempts of the experiment workspace: the searchable, paged history, one
// inspected attempt (polled until it is terminal), and the actions on attempts:
// queue, restart, cancel, compare, report. `step` and `message` come from the
// workspace's workflow, so every action is one superseding step.
import { computed, reactive, ref } from 'vue'
import {
  cancelWorkspaceAttempt,
  compareWorkspaceAttempts,
  createWorkspaceReport,
  loadWorkspaceArtifacts,
  loadWorkspaceAttempt,
  loadWorkspaceCheckpoints,
  loadWorkspaceEvents,
  loadWorkspaceHistory,
  queueWorkspaceRun,
  restartWorkspaceCheckpoint
} from '../api.js'
import { usePolling } from './usePolling.js'

export const HISTORY_LIMIT = 25
const POLL_MS = 750

export function useAttempts({ step, message, draft, latestRevision, readOnly }) {
  const history = ref({ items: [], total: 0, limit: 50, offset: 0 })
  const filters = reactive({ status: '', release: '', model: '', taxon: '', tissue: '' })
  const historyOffset = ref(0)
  const selected = ref()
  const events = ref([])
  const artifacts = ref([])
  const report = ref()
  const comparison = ref()
  const successful = computed(() => history.value.items.filter((item) => item.attempt.outcome === 'successful' && item.attempt.resultArtifactId))

  const historyQuery = (offset = historyOffset.value) => ({ ...filters, limit: HISTORY_LIMIT, offset })

  async function attemptState(attemptId, { signal, fresh }) {
    const [attempt, loadedEvents, loadedArtifacts] = fresh(await Promise.all([
      loadWorkspaceAttempt(attemptId, signal),
      loadWorkspaceEvents(attemptId, signal),
      loadWorkspaceArtifacts(attemptId, signal)
    ]))
    return { attempt, events: loadedEvents, artifacts: loadedArtifacts }
  }

  // A selected attempt that is not terminal is re-read, whatever the history filters say.
  const poll = usePolling(async (task) => {
    const attemptId = selected.value?.attempt.attemptId
    const loaded = await attemptState(attemptId, task)
    if (selected.value?.attempt.attemptId !== attemptId) return false
    selected.value = loaded.attempt
    events.value = loaded.events
    artifacts.value = loaded.artifacts
    if (loaded.attempt.attempt.state !== 'terminal') return true
    history.value = task.fresh(await loadWorkspaceHistory(historyQuery(), task.signal))
    return false
  }, { interval: POLL_MS, onError: () => true })

  function show(loaded) {
    selected.value = loaded.attempt
    events.value = loaded.events
    artifacts.value = loaded.artifacts
    report.value = undefined
    if (loaded.attempt.attempt.state === 'terminal') poll.stop()
    else poll.start()
  }

  const refresh = (reset = false) => {
    if (reset) historyOffset.value = 0
    return step('loading', async ({ signal, fresh }) => fresh(await loadWorkspaceHistory(historyQuery(), signal)), {
      done: (loaded) => {
        history.value = loaded
        return 'ready'
      },
      failure: 'History could not be loaded.'
    })
  }

  // Queue or restart: the new attempt, the refreshed history and its detail arrive together.
  const start = (begin, text, failure) => step('saving', async (task) => {
    const queued = task.fresh(await begin(task))
    const loadedHistory = task.fresh(await loadWorkspaceHistory(historyQuery(), task.signal))
    return { loadedHistory, loaded: await attemptState(queued.attemptId, task) }
  }, {
    done: ({ loadedHistory, loaded }) => {
      history.value = loadedHistory
      show(loaded)
      message.value = text
      return 'ready'
    },
    failure
  })

  const queue = () => latestRevision.value && !readOnly.value && start(
    () => queueWorkspaceRun(latestRevision.value.revisionId, draft.resourceProfileId),
    'Attempt queued. Its scientific identity is stable; this attempt identity is unique.',
    'Run could not be queued.'
  )

  const restart = () => selected.value && start(
    async () => {
      const checkpoints = await loadWorkspaceCheckpoints(selected.value.attempt.attemptId)
      return restartWorkspaceCheckpoint(checkpoints.at(-1).checkpointId, draft.resourceProfileId)
    },
    'Restart queued from the exact specification checkpoint. No engine state was continued.',
    'Specification restart could not be queued.'
  )

  const inspect = (attemptId) => {
    poll.stop()
    return step('loading', (task) => attemptState(attemptId, task), {
      done: (loaded) => {
        show(loaded)
        return 'ready'
      },
      failure: 'Attempt detail could not be loaded.'
    })
  }

  const cancel = () => selected.value && step('saving', async (task) => {
    const attemptId = selected.value.attempt.attemptId
    task.fresh(await cancelWorkspaceAttempt(attemptId))
    const loadedHistory = task.fresh(await loadWorkspaceHistory(historyQuery(), task.signal))
    return { loadedHistory, loaded: await attemptState(attemptId, task) }
  }, {
    done: ({ loadedHistory, loaded }) => {
      history.value = loadedHistory
      show(loaded)
      return 'ready'
    },
    failure: 'Attempt could not be cancelled.'
  })

  const compareLatest = () => successful.value.length >= 2 && step('loading', async ({ fresh }) => fresh(await compareWorkspaceAttempts({
    leftAttemptId: successful.value[1].attempt.attemptId,
    rightAttemptId: successful.value[0].attempt.attemptId,
    contract: { kind: 'tolerance', absolute: draft.absoluteTolerance, relative: draft.relativeTolerance }
  })), {
    done: (compared) => {
      comparison.value = compared
      return 'ready'
    },
    failure: 'Attempts could not be compared.'
  })

  const generateReport = () => selected.value && step('saving', async ({ signal, fresh }) => {
    const attemptId = selected.value.attempt.attemptId
    const created = fresh(await createWorkspaceReport(attemptId))
    return { created, files: fresh(await loadWorkspaceArtifacts(attemptId, signal)) }
  }, {
    done: ({ created, files }) => {
      report.value = created
      artifacts.value = files
      return 'ready'
    },
    failure: 'Report could not be generated.'
  })

  function previousPage() {
    historyOffset.value = Math.max(0, historyOffset.value - HISTORY_LIMIT)
    return refresh()
  }

  function nextPage() {
    if (historyOffset.value + history.value.items.length >= history.value.total) return undefined
    historyOffset.value += HISTORY_LIMIT
    return refresh()
  }

  return { history, filters, selected, events, artifacts, report, comparison, successful, refresh, inspect, queue, restart, cancel, compareLatest, generateReport, previousPage, nextPage }
}
