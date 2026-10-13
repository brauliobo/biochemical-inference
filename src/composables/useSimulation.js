// State and operations of the single-page simulation workbench (verified
// release, taxon network, build provenance, one controlled run). The view
// components in src/components/simulation/ only render it.
import { computed, onMounted, ref, watch } from 'vue'
import { SimulationRequestSchema } from '../../shared/contracts.js'
import { METABOLITE_IDS } from '../../shared/identifiers.js'
import { loadNetwork, loadProvenance, loadWorkspace, runSimulation } from '../api.js'
import { compatibleRuns } from '../comparison.js'
import { errorMessage, useTask } from './useTask.js'

export function useSimulation() {
  const taxonId = ref(9606)
  const preset = ref('baseline')
  const activity = ref(1)
  const duration = ref(24)
  const release = ref()
  const model = ref()
  const network = ref()
  const provenance = ref()
  const provenanceState = ref('loading')
  const provenanceError = ref('')
  const result = ref()
  const baseline = ref()
  const selectedId = ref(METABOLITE_IDS.homocysteine)
  const state = ref('loading')
  const message = ref('')
  const resultIsPrevious = ref(false)
  const errors = ref({})
  const knowledge = useTask()
  const provenanceTask = useTask()

  const comparison = computed(() => result.value?.preset === 'reduced-mthfr' && baseline.value && compatibleRuns(result.value, baseline.value) ? baseline.value : undefined)
  const locked = computed(() => state.value === 'running' || state.value === 'loading' || !network.value)
  const evidenceQuery = computed(() => {
    const compound = network.value?.compounds.find((item) => item.id === selectedId.value)
    if (compound) return `${compound.name} ${compound.id}`
    return model.value?.topology.reactions.find((item) => item.id === selectedId.value)?.name ?? 'MTHFR'
  })

  const incompatible = (fallback) => (error) => {
    state.value = 'incompatible'
    message.value = errorMessage(error, fallback)
  }

  watch([preset, activity, duration], () => {
    if (result.value) resultIsPrevious.value = true
    message.value = ''
  })
  watch(preset, (value) => {
    const selected = model.value?.presets.find((item) => item.id === value)
    if (selected?.mthfrActivity != null) activity.value = selected.mthfrActivity
  })

  // A different taxon invalidates every result and the network shown for it.
  watch(taxonId, async (value) => {
    result.value = undefined
    baseline.value = undefined
    resultIsPrevious.value = false
    message.value = ''
    if (!release.value) return
    const releaseId = release.value.id
    network.value = undefined
    state.value = 'loading'
    await knowledge.run(async ({ signal, guard }) => {
      const loaded = await guard(loadNetwork(releaseId, value, signal))
      if (value !== taxonId.value) return
      network.value = loaded
      state.value = 'ready'
    }, { fail: incompatible('The knowledge network is incompatible.') })
  })

  async function requestProvenance(verifiedRelease = release.value) {
    if (!verifiedRelease) return
    provenance.value = undefined
    provenanceState.value = 'loading'
    provenanceError.value = ''
    await provenanceTask.run(async ({ signal, guard }) => {
      const loaded = await guard(loadProvenance(verifiedRelease, signal))
      if (verifiedRelease.id !== release.value?.id) return
      provenance.value = loaded
      provenanceState.value = 'available'
    }, {
      fail: (error) => {
        provenanceState.value = 'unavailable'
        provenanceError.value = errorMessage(error, 'The build provenance request failed.')
      }
    })
  }

  async function initialize() {
    const requestedTaxon = taxonId.value
    network.value = undefined
    provenance.value = undefined
    provenanceState.value = 'loading'
    provenanceError.value = ''
    provenanceTask.cancel()
    state.value = 'loading'
    await knowledge.run(async ({ signal, guard }) => {
      const workspace = await guard(loadWorkspace(requestedTaxon, signal))
      if (requestedTaxon !== taxonId.value) return
      release.value = workspace.release
      model.value = workspace.model
      network.value = workspace.network
      state.value = 'ready'
      requestProvenance(workspace.release)
    }, { fail: incompatible('The knowledge release is incompatible.') })
  }

  async function run() {
    if (!release.value || !model.value || !network.value || state.value !== 'ready') return
    errors.value = {}
    const parsed = SimulationRequestSchema.safeParse({
      releaseId: release.value.id,
      taxonId: taxonId.value,
      preset: preset.value,
      mthfrActivity: activity.value,
      durationHours: duration.value,
      stepHours: model.value.controls.stepHours
    })
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors
      errors.value = { activity: fields.mthfrActivity?.[0] ?? '', duration: fields.durationHours?.[0] ?? '' }
      return
    }
    state.value = 'running'
    message.value = ''
    try {
      const completed = await runSimulation(parsed.data)
      result.value = completed
      if (completed.preset === 'baseline') baseline.value = completed
      resultIsPrevious.value = false
      state.value = 'ready'
    } catch (error) {
      result.value = undefined
      resultIsPrevious.value = false
      state.value = 'failed'
      message.value = errorMessage(error, 'The simulation failed. Your controls were preserved.')
    }
  }

  onMounted(initialize)

  return {
    taxonId, preset, activity, duration, release, model, network, provenance, provenanceState, provenanceError,
    result, baseline, comparison, selectedId, state, message, resultIsPrevious, errors, locked, evidenceQuery,
    initialize, requestProvenance, run, select: (id) => { selectedId.value = id }, customActivity: () => { preset.value = 'custom' }
  }
}
