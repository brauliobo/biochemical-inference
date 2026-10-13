<script setup vapor>
import { computed, onMounted, ref } from 'vue'
import { createPhysiologyCoupling, loadPhysiologyWorkbench, runPhysiologyConformance, runPhysiologyCoupling } from '../api.js'
import { useWorkflow } from '../composables/useWorkflow.js'
import Badge from '../ui/Badge.vue'
import Card from '../ui/Card.vue'
import ErrorNotice from '../ui/ErrorNotice.vue'
import Facts from '../ui/Facts.vue'
import LiveMessage from '../ui/LiveMessage.vue'
import Notice from '../ui/Notice.vue'
import Panel from '../ui/Panel.vue'
import CouplingEditor from './physiology/CouplingEditor.vue'
import PackageCard from './physiology/PackageCard.vue'
import RunResult from './physiology/RunResult.vue'

const REQUIRED_PLUGINS = ['PLUGIN:CIRCULATION-REFERENCE', 'PLUGIN:LIVER-REFERENCE', 'PLUGIN:KIDNEY-REFERENCE']

const workspace = ref()
const taxonId = ref('NCBITaxon:9606')
const durationMinutes = ref(4)
const coupling = ref()
const run = ref()
const conformance = ref({})
const chosen = ref({})
const { state, message, step } = useWorkflow({ settled: ['ready', 'failed'] })

const busy = computed(() => ['coupling', 'running'].includes(state.value))
const packages = computed(() => workspace.value?.packages ?? [])
const selected = computed(() => REQUIRED_PLUGINS
  .map((pluginId) => packages.value.find((item) => item.manifest.pluginId === pluginId && item.packageDigest === chosen.value[pluginId] && item.trust.status === 'trusted'))
  .filter(Boolean))
const evidenceByPlugin = computed(() => new Map((workspace.value?.evidence.modelEvidence ?? []).map((item) => [item.plugin_id, item])))
const contextById = computed(() => new Map((workspace.value?.evidence.contexts ?? []).map((item) => [item.id, item])))
const statusLabel = computed(() => (state.value === 'loading' ? 'Loading' : busy.value ? 'Working' : state.value === 'failed' ? 'Blocked' : 'Pinned v1'))
const statusKind = computed(() => (state.value === 'failed' ? 'danger' : state.value === 'ready' ? 'success' : 'warning'))
const pins = computed(() => {
  const { discovery } = workspace.value
  return [
    { label: 'Evidence release', value: discovery.releaseId },
    { label: 'Release SHA-256', value: discovery.releaseDigest, mono: true },
    { label: 'Package profile', value: discovery.packageProfile },
    { label: 'Process plugins', value: discovery.processPlugins === 'disabled' ? 'Fail closed · sandbox unavailable' : 'Bubblewrap gated' }
  ]
})

const sameClosure = (left, right) => [...left].sort().join(',') === [...right].sort().join(',')
const clearResult = () => {
  coupling.value = undefined
  run.value = undefined
}

function choosePackage(item) {
  if (busy.value || item.trust.status !== 'trusted') return
  chosen.value = { ...chosen.value, [item.manifest.pluginId]: item.packageDigest }
  clearResult()
}

const initialize = () => step('loading', async ({ signal, fresh }) => fresh(await loadPhysiologyWorkbench(signal)), {
  done: (loaded) => {
    workspace.value = loaded
    chosen.value = Object.fromEntries(REQUIRED_PLUGINS.map((pluginId) => {
      const trusted = loaded.packages.filter((item) => item.manifest.pluginId === pluginId && item.trust.status === 'trusted')
      return [pluginId, (trusted.find((item) => item.builtIn) ?? trusted.at(-1))?.packageDigest ?? '']
    }))
    const digests = selected.value.map((item) => item.packageDigest)
    coupling.value = [...loaded.couplings].reverse().find((item) => item.taxonId === taxonId.value && item.durationMinutes === Number(durationMinutes.value) && sameClosure(item.packageDigests, digests))
    run.value = coupling.value ? [...loaded.runs].reverse().find((item) => item.couplingDigest === coupling.value.couplingDigest) : undefined
    return 'ready'
  },
  failure: 'Physiology workspace is unavailable.'
})

const checkConformance = (item) => step('coupling', async ({ signal, fresh }) => fresh(await runPhysiologyConformance(item.packageDigest, signal)), {
  done: (result) => {
    conformance.value = { ...conformance.value, [item.packageDigest]: result }
    item.certification = result.certification
    return 'ready'
  },
  failure: 'Conformance check failed.'
})

function buildCoupling() {
  if (selected.value.length !== REQUIRED_PLUGINS.length) return undefined
  clearResult()
  return step('coupling', async ({ signal, fresh }) => fresh(await createPhysiologyCoupling({
    packageDigests: selected.value.map((item) => item.packageDigest),
    taxonId: taxonId.value,
    durationMinutes: Number(durationMinutes.value),
    couplingCadenceMinutes: 1,
    interpolation: 'zero-order-hold',
    refinementFactors: [1, 2, 4],
    convergenceToleranceMg: 1e-9
  }, signal)), {
    done: (created) => {
      coupling.value = created
      return 'ready'
    },
    failure: 'Coupling was rejected.'
  })
}

function execute() {
  if (!coupling.value) return undefined
  const { couplingDigest } = coupling.value
  return step('running', async ({ signal, fresh }) => {
    const completed = fresh(await runPhysiologyCoupling(couplingDigest, signal))
    if (coupling.value?.couplingDigest !== couplingDigest || completed.couplingDigest !== couplingDigest) throw new Error('Physiology run does not match the displayed coupling digest.')
    return completed
  }, {
    done: (completed) => {
      run.value = completed
      return 'ready'
    },
    failure: 'Coupled run failed.'
  })
}

onMounted(initialize)
</script>

<template lang="pug">
Panel.physiology-panel(title="Physiology plugin workbench" title-id="physiology-title" eyebrow="10 · Extensible physiology" :status="statusLabel" :tone="statusKind")
  Notice(tone="warning" role="note" title="Synthetic / non-clinical")
    p Persistent boundary: software protocol conformance only. No measured physiology, diagnosis, dosing, safety, or scientific validation.
  LiveMessage(visible :text="state === 'loading' ? 'Verifying evidence, trust store, signatures, and local catalog…' : ''")
  ErrorNotice(v-if="state === 'failed' && !workspace" title="Physiology workbench unavailable" :message="message" retry-label="Retry verification" @retry="initialize")
  template(v-else-if="workspace")
    ErrorNotice(v-if="state === 'failed'" title="Operation blocked" :message="message")
    Facts(:items="pins")

    .grid
      Card(flat)
        p.eyebrow Protocol certification
        p
          strong Verification first, persisted conformance run second
        p.muted Packages start not-certified. Only a successful persisted benchmark run certifies the declared software exchange protocol.
      Card(tone="warning")
        p
          Badge(tone="warning" label="Scientifically unsupported")
        p
          strong Certification is not scientific validation
        p Every upstream scientific claim remains unsupported and no integrated conclusion is promoted.

    section.stack.stack--tight(aria-labelledby="physiology-catalog-title")
      h3#physiology-catalog-title Signed local catalog
      .grid
        PackageCard(v-for="item in packages" :key="item.packageDigest" :item="item" :ports="evidenceByPlugin.get(item.manifest.pluginId)?.ports" :context-name="contextById.get(item.manifest.applicability.contextIds[0])?.name" :chosen="chosen[item.manifest.pluginId] === item.packageDigest" :locked="busy" :conformance="conformance[item.packageDigest]" @choose="choosePackage(item)" @check="checkConformance(item)")

    .sidebar
      CouplingEditor(v-model:taxonId="taxonId" v-model:durationMinutes="durationMinutes" :busy="busy" :state="state" :can-create="selected.length === REQUIRED_PLUGINS.length" :can-run="Boolean(coupling)" @create="buildCoupling" @run="execute" @change="clearResult")
      section.stack.stack--tight(v-if="coupling" aria-labelledby="physiology-contract-title")
        h3#physiology-contract-title Immutable coupling contract
        code.digest {{ coupling.couplingDigest }}
        p Applicability intersection: {{ coupling.applicabilityIntersection.taxonIds.join(', ') }} · {{ coupling.applicabilityIntersection.useScopes.join(', ') }}
        .grid
          Card(v-for="exchange in coupling.exchanges" :key="exchange.quantityId" flat)
            strong {{ exchange.source.plugin_id }} → {{ exchange.target.plugin_id }}
            code.digest {{ exchange.quantityId }}
            span.muted {{ exchange.semantic }} · {{ exchange.shape.join('×') }} · {{ exchange.unit }} · {{ exchange.cadenceMinutes }} min · {{ exchange.interpolation }}

    RunResult(v-if="run" :run="run")

    section.stack.stack--tight(aria-labelledby="physiology-coverage-title")
      h3#physiology-coverage-title Goal 10 coverage matrix
      p.muted Contract coverage means a signed synthetic software fixture exists. It never means scientific support.
      .grid.grid--compact
        Card(v-for="cell in workspace.coverage.items" :key="cell.id" :flat="cell.coverage_status !== 'contract-covered'" :tone="cell.coverage_status === 'contract-covered' ? 'success' : ''")
          p.eyebrow {{ cell.taxon_label }}
          p
            strong {{ cell.domain }}
          p.muted {{ cell.coverage_status }} · science {{ cell.scientific_validation_status }}
          p.muted(v-if="cell.plugin_id") {{ cell.installed ? 'signed package installed' : 'package absent' }}
</template>
