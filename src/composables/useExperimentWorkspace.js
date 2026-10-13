// State and operations of the durable experiment workspace: the experiment
// form (a draft), the immutable revisions of the selected experiment, clone,
// portable bundles, and (through useAttempts) queued attempts and their history.
// The components in src/components/experiments/ only render it.
//
// Every operation is one workflow step: it supersedes the previous one, and its
// results appear together with the new state.
import { computed, onMounted, reactive, ref } from 'vue'
import {
  cloneWorkspaceExperiment,
  createWorkspaceExperiment,
  createWorkspaceRevision,
  exportWorkspaceExperiment,
  importWorkspaceExperiment,
  loadPortfolioModels,
  loadWorkspaceExperiment,
  loadWorkspaceExperiments,
  loadWorkspaceHistory,
  loadWorkspaceResourceProfiles
} from '../api.js'
import { buildSpecification, draftFromRevision, exactModelKey, interventionTargets, newDraft } from '../experiment-draft.js'
import { HISTORY_LIMIT, useAttempts } from './useAttempts.js'
import { useWorkflow } from './useWorkflow.js'

export function useExperimentWorkspace() {
  const registryModels = ref([])
  const embeddedModels = ref([])
  const profiles = ref([])
  const experiments = ref([])
  const detail = ref()
  const exportHref = ref('')
  const exportName = ref('experiment.zip')
  const draft = reactive(newDraft())
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
  const modelIds = computed(() => [...new Set(models.value.map((item) => item.id))])
  const attempts = useAttempts({ step, message, draft, latestRevision, readOnly })

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
      attempts.history.value = loadedHistory
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

  onMounted(initialize)

  return {
    state, message, draft, models, model, targets, isRegistry, experiments, profiles, detail, readOnly, modelIds,
    exportHref, exportName, chooseModel, selectExperiment, saveRevision, cloneExperiment, exportExperiment, importExperiment,
    attempts
  }
}
