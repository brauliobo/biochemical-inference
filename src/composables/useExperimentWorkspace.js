// State and operations of the durable experiment workspace: the experiment
// form (a draft), immutable revisions, queued attempts and their polling,
// history paging, comparison, reports and portable bundles. The components in
// src/components/experiments/ only render it.
//
// Every operation is one workflow step: it supersedes the previous one, and its
// results appear together with the new state.
import { computed, onMounted, reactive, ref } from 'vue'
import {
  cancelWorkspaceAttempt,
  cloneWorkspaceExperiment,
  compareWorkspaceAttempts,
  createWorkspaceExperiment,
  createWorkspaceReport,
  createWorkspaceRevision,
  exportWorkspaceExperiment,
  importWorkspaceExperiment,
  loadPortfolioModels,
  loadWorkspaceArtifacts,
  loadWorkspaceAttempt,
  loadWorkspaceCheckpoints,
  loadWorkspaceEvents,
  loadWorkspaceExperiment,
  loadWorkspaceExperiments,
  loadWorkspaceHistory,
  loadWorkspaceResourceProfiles,
  queueWorkspaceRun,
  restartWorkspaceCheckpoint
} from '../api.js'
import { buildSpecification, draftFromRevision, exactModelKey, interventionTargets, newDraft } from '../experiment-draft.js'
import { usePolling } from './usePolling.js'
import { useWorkflow } from './useWorkflow.js'

const HISTORY_LIMIT = 25
const POLL_MS = 750

export function useExperimentWorkspace() {
  const registryModels = ref([])
  const embeddedModels = ref([])
  const profiles = ref([])
  const experiments = ref([])
  const detail = ref()
  const history = ref({ items: [], total: 0, limit: 50, offset: 0 })
  const selectedAttempt = ref()
  const events = ref([])
  const artifacts = ref([])
  const report = ref()
  const comparison = ref()
  const exportHref = ref('')
  const exportName = ref('experiment.zip')
  const draft = reactive(newDraft())
  const filters = reactive({ status: '', release: '', model: '', taxon: '', tissue: '' })
  const historyOffset = ref(0)
  const { state, message, step } = useWorkflow({ settled: ['ready', 'failed'] })

  const models = computed(() => {
    const exact = new Set(registryModels.value.map(exactModelKey))
    return [...registryModels.value, ...embeddedModels.value.filter((item) => !exact.has(exactModelKey(item)))]
  })
  const model = computed(() => models.value.find((item) => exactModelKey(item) === draft.modelKey))
  const targets = computed(() => interventionTargets(model.value))
  const isRegistry = (item) => registryModels.value.some((candidate) => candidate.id === item.id && candidate.digest === item.digest)
  const latestRevision = computed(() => detail.value?.revisions.at(-1))
  const readOnly = computed(() => Boolean(latestRevision.value) && latestRevision.value.specification.entries.some((entry) => !isRegistry(entry.model)))
  const successful = computed(() => history.value.items.filter((item) => item.attempt.outcome === 'successful' && item.attempt.resultArtifactId))
  const modelIds = computed(() => [...new Set(models.value.map((item) => item.id))])

  // The first thing the chosen model lets the form assign (the bound model may not be updated yet).
  const chooseModel = (key = draft.modelKey) => {
    draft.interventionTarget = interventionTargets(models.value.find((item) => exactModelKey(item) === key))[0]?.id ?? ''
  }

  function applyRevision(revision) {
    for (const entry of revision.specification.entries) {
      if (!models.value.some((item) => item.id === entry.model.id && item.digest === entry.model.digest)) embeddedModels.value.push(entry.model)
    }
    Object.assign(draft, draftFromRevision(revision))
    if (!revision.specification.entries[0].experiment.interventions[0]) chooseModel()
  }

  function showDetail(loaded) {
    detail.value = loaded
    draft.name = loaded.experiment.name
    draft.description = loaded.experiment.description
    applyRevision(loaded.revisions.at(-1))
    exportHref.value = ''
  }

  function showNewExperiment() {
    detail.value = undefined
    Object.assign(draft, { ...newDraft(), modelKey: registryModels.value[0] ? exactModelKey(registryModels.value[0]) : '', resourceProfileId: draft.resourceProfileId })
    chooseModel()
    exportHref.value = ''
  }

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
    const attemptId = selectedAttempt.value?.attempt.attemptId
    const loaded = await attemptState(attemptId, task)
    if (selectedAttempt.value?.attempt.attemptId !== attemptId) return false
    selectedAttempt.value = loaded.attempt
    events.value = loaded.events
    artifacts.value = loaded.artifacts
    if (loaded.attempt.attempt.state !== 'terminal') return true
    history.value = task.fresh(await loadWorkspaceHistory(historyQuery(), task.signal))
    return false
  }, { interval: POLL_MS, onError: () => true })

  function showAttempt(loaded) {
    selectedAttempt.value = loaded.attempt
    events.value = loaded.events
    artifacts.value = loaded.artifacts
    report.value = undefined
    if (loaded.attempt.attempt.state === 'terminal') poll.stop()
    else poll.start()
  }

  const refreshHistory = (reset = false) => {
    if (reset) historyOffset.value = 0
    return step('loading', async ({ signal, fresh }) => fresh(await loadWorkspaceHistory(historyQuery(), signal)), {
      done: (loaded) => {
        history.value = loaded
        return 'ready'
      },
      failure: 'History could not be loaded.'
    })
  }

  const initialize = () => step('loading', async ({ signal, fresh }) => {
    const [loadedModels, loadedProfiles, loadedExperiments, loadedHistory] = fresh(await Promise.all([
      loadPortfolioModels(signal),
      loadWorkspaceResourceProfiles(signal),
      loadWorkspaceExperiments(signal),
      loadWorkspaceHistory({ limit: HISTORY_LIMIT, offset: 0 }, signal)
    ]))
    const first = loadedExperiments[0] ? fresh(await loadWorkspaceExperiment(loadedExperiments[0].experimentId, signal)) : undefined
    return { loadedModels, loadedProfiles, loadedExperiments, loadedHistory, first }
  }, {
    done: ({ loadedModels, loadedProfiles, loadedExperiments, loadedHistory, first }) => {
      registryModels.value = loadedModels
      profiles.value = loadedProfiles
      experiments.value = loadedExperiments
      history.value = loadedHistory
      draft.modelKey ||= loadedModels[0] ? exactModelKey(loadedModels[0]) : ''
      chooseModel()
      if (first) showDetail(first)
      return 'ready'
    },
    failure: 'Experiment workspace could not be loaded.'
  })

  const selectExperiment = (experimentId) => step('loading', async ({ signal, fresh }) => (experimentId ? fresh(await loadWorkspaceExperiment(experimentId, signal)) : undefined), {
    done: (loaded) => {
      if (loaded) showDetail(loaded)
      else showNewExperiment()
      return 'ready'
    },
    failure: 'Experiment could not be loaded.'
  })

  const createExperiment = () => step('saving', async ({ signal, fresh }) => {
    const created = fresh(await createWorkspaceExperiment({ name: draft.name, description: draft.description, specification: buildSpecification(draft, model.value), resourceProfileId: draft.resourceProfileId }))
    return { created, list: fresh(await loadWorkspaceExperiments(signal)) }
  }, {
    done: ({ created, list }) => {
      detail.value = created
      experiments.value = list
      message.value = 'Experiment and immutable revision created.'
      return 'ready'
    },
    failure: 'Experiment could not be created.'
  })

  function saveRevision() {
    if (readOnly.value) return undefined
    if (!detail.value) return createExperiment()
    const { experimentId } = detail.value.experiment
    return step('saving', async ({ signal, fresh }) => {
      fresh(await createWorkspaceRevision(experimentId, { specification: buildSpecification(draft, model.value), resourceProfileId: draft.resourceProfileId }))
      return { loaded: fresh(await loadWorkspaceExperiment(experimentId, signal)), list: fresh(await loadWorkspaceExperiments(signal)) }
    }, {
      done: ({ loaded, list }) => {
        showDetail(loaded)
        experiments.value = list
        message.value = 'A new immutable revision was created; prior revisions were retained.'
        return 'ready'
      },
      failure: 'Revision could not be created.'
    })
  }

  const cloneExperiment = () => detail.value && !readOnly.value && step('saving', async ({ signal, fresh }) => {
    const cloned = fresh(await cloneWorkspaceExperiment(detail.value.experiment.experimentId))
    return { cloned, list: fresh(await loadWorkspaceExperiments(signal)) }
  }, {
    done: ({ cloned, list }) => {
      detail.value = cloned
      experiments.value = list
      message.value = 'Experiment cloned with an independent immutable revision history.'
      return 'ready'
    },
    failure: 'Experiment could not be cloned.'
  })

  // Queue or restart: the new attempt, the refreshed history and its detail arrive together.
  const startAttempt = (begin, text, failure) => step('saving', async (task) => {
    const queued = task.fresh(await begin(task))
    const loadedHistory = task.fresh(await loadWorkspaceHistory(historyQuery(), task.signal))
    return { loadedHistory, loaded: await attemptState(queued.attemptId, task) }
  }, {
    done: ({ loadedHistory, loaded }) => {
      history.value = loadedHistory
      showAttempt(loaded)
      message.value = text
      return 'ready'
    },
    failure
  })

  const queueRun = () => latestRevision.value && !readOnly.value && startAttempt(
    () => queueWorkspaceRun(latestRevision.value.revisionId, draft.resourceProfileId),
    'Attempt queued. Its scientific identity is stable; this attempt identity is unique.',
    'Run could not be queued.'
  )

  const restartAttempt = () => selectedAttempt.value && startAttempt(
    async () => {
      const checkpoints = await loadWorkspaceCheckpoints(selectedAttempt.value.attempt.attemptId)
      return restartWorkspaceCheckpoint(checkpoints.at(-1).checkpointId, draft.resourceProfileId)
    },
    'Restart queued from the exact specification checkpoint. No engine state was continued.',
    'Specification restart could not be queued.'
  )

  const inspectAttempt = (attemptId) => {
    poll.stop()
    return step('loading', (task) => attemptState(attemptId, task), {
      done: (loaded) => {
        showAttempt(loaded)
        return 'ready'
      },
      failure: 'Attempt detail could not be loaded.'
    })
  }

  const cancelAttempt = () => selectedAttempt.value && step('saving', async (task) => {
    const attemptId = selectedAttempt.value.attempt.attemptId
    task.fresh(await cancelWorkspaceAttempt(attemptId))
    const loadedHistory = task.fresh(await loadWorkspaceHistory(historyQuery(), task.signal))
    return { loadedHistory, loaded: await attemptState(attemptId, task) }
  }, {
    done: ({ loadedHistory, loaded }) => {
      history.value = loadedHistory
      showAttempt(loaded)
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

  const generateReport = () => selectedAttempt.value && step('saving', async ({ signal, fresh }) => {
    const attemptId = selectedAttempt.value.attempt.attemptId
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

  const exportExperiment = () => detail.value && step('saving', async ({ fresh }) => fresh(await exportWorkspaceExperiment(detail.value.experiment.experimentId)), {
    done: (exported) => {
      exportName.value = exported.fileName
      exportHref.value = `data:application/zip;base64,${exported.bundleBase64}`
      message.value = 'Portable bundle verified and ready for download.'
      return 'ready'
    },
    failure: 'Experiment could not be exported.'
  })

  async function importExperiment(event) {
    const input = event.target
    const file = input.files?.[0]
    if (!file) return
    const bytes = new Uint8Array(await file.arrayBuffer())
    let binary = ''
    for (let offset = 0; offset < bytes.length; offset += 32768) binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768))
    await step('saving', async ({ signal, fresh }) => {
      const imported = fresh(await importWorkspaceExperiment(btoa(binary)))
      return { imported, list: fresh(await loadWorkspaceExperiments(signal)) }
    }, {
      done: ({ imported, list }) => {
        detail.value = imported
        experiments.value = list
        applyRevision(imported.revisions.at(-1))
        message.value = 'Portable bundle imported. Reruns will be checked against its declared numerical contract.'
        return 'ready'
      },
      failure: 'Portable bundle could not be imported.'
    })
    input.value = ''
  }

  function previousHistoryPage() {
    historyOffset.value = Math.max(0, historyOffset.value - HISTORY_LIMIT)
    return refreshHistory()
  }

  function nextHistoryPage() {
    if (historyOffset.value + history.value.items.length >= history.value.total) return undefined
    historyOffset.value += HISTORY_LIMIT
    return refreshHistory()
  }

  onMounted(initialize)

  return {
    state, message, draft, filters, models, model, targets, isRegistry, experiments, profiles, detail, readOnly, history, modelIds,
    selectedAttempt, events, artifacts, comparison, report, exportHref, exportName, successful,
    chooseModel, selectExperiment, saveRevision, queueRun, cloneExperiment, exportExperiment, importExperiment,
    refreshHistory, inspectAttempt, previousHistoryPage, nextHistoryPage, cancelAttempt, restartAttempt, generateReport, compareLatest
  }
}
