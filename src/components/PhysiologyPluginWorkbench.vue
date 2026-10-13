<script setup vapor>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { createPhysiologyCoupling, loadPhysiologyWorkbench, runPhysiologyConformance, runPhysiologyCoupling } from '../api.js'
import Metric from './ui/Metric.vue'
import Section from './ui/Section.vue'
import Toolbar from './ui/Toolbar.vue'
import { badgeClass } from './ui/tone.js'

const workspace = ref()
const state = ref('loading')
const message = ref('')
const taxonId = ref('NCBITaxon:9606')
const durationMinutes = ref(4)
const coupling = ref()
const run = ref()
const conformance = ref({})
const selectedPackageDigests = ref({})
let controller

const requiredPluginIds = ['PLUGIN:CIRCULATION-REFERENCE', 'PLUGIN:LIVER-REFERENCE', 'PLUGIN:KIDNEY-REFERENCE']
const packages = computed(() => workspace.value?.packages ?? [])
const selectedPackages = computed(() => requiredPluginIds.map((pluginId) => packages.value.find((item) => item.manifest.pluginId === pluginId && item.packageDigest === selectedPackageDigests.value[pluginId] && item.trust.status === 'trusted')).filter(Boolean))
const evidenceByPlugin = computed(() => new Map((workspace.value?.evidence.modelEvidence ?? []).map((item) => [item.plugin_id, item])))
const contextById = computed(() => new Map((workspace.value?.evidence.contexts ?? []).map((item) => [item.id, item])))
const isBusy = computed(() => ['coupling', 'running'].includes(state.value))
const statusLabel = computed(() => state.value === 'loading' ? 'Loading' : isBusy.value ? 'Working' : state.value === 'failed' ? 'Blocked' : 'Pinned v1')
const statusKind = computed(() => state.value === 'failed' ? 'danger' : state.value === 'ready' ? 'success' : 'warning')

function samePackageClosure(left, right) {
  return [...left].sort().join(',') === [...right].sort().join(',')
}

function clearSelectionResult() {
  coupling.value = undefined
  run.value = undefined
}

function choosePackage(item) {
  if (isBusy.value || item.trust.status !== 'trusted') return
  selectedPackageDigests.value = { ...selectedPackageDigests.value, [item.manifest.pluginId]: item.packageDigest }
  clearSelectionResult()
}

function changeCouplingControls() {
  clearSelectionResult()
}

async function initialize() {
  controller?.abort()
  controller = new AbortController()
  state.value = 'loading'
  message.value = ''
  try {
    const loaded = await loadPhysiologyWorkbench(controller.signal)
    workspace.value = loaded
    selectedPackageDigests.value = Object.fromEntries(requiredPluginIds.map((pluginId) => {
      const trusted = loaded.packages.filter((item) => item.manifest.pluginId === pluginId && item.trust.status === 'trusted')
      const selected = trusted.find((item) => item.builtIn) ?? trusted.at(-1)
      return [pluginId, selected?.packageDigest ?? '']
    }))
    const selectedDigests = selectedPackages.value.map((item) => item.packageDigest)
    coupling.value = [...loaded.couplings].reverse().find((item) => item.taxonId === taxonId.value && item.durationMinutes === Number(durationMinutes.value) && samePackageClosure(item.packageDigests, selectedDigests))
    run.value = coupling.value ? [...loaded.runs].reverse().find((item) => item.couplingDigest === coupling.value.couplingDigest) : undefined
    state.value = 'ready'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    state.value = 'failed'
    message.value = error instanceof Error ? error.message : 'Physiology workspace is unavailable.'
  }
}

async function checkConformance(item) {
  state.value = 'coupling'
  message.value = ''
  try {
    const result = await runPhysiologyConformance(item.packageDigest, controller?.signal)
    conformance.value = { ...conformance.value, [item.packageDigest]: result }
    item.certification = result.certification
    state.value = 'ready'
  } catch (error) {
    state.value = 'failed'
    message.value = error instanceof Error ? error.message : 'Conformance check failed.'
  }
}

async function buildCoupling() {
  if (selectedPackages.value.length !== requiredPluginIds.length) return
  state.value = 'coupling'
  message.value = ''
  clearSelectionResult()
  try {
    coupling.value = await createPhysiologyCoupling({
      packageDigests: selectedPackages.value.map((item) => item.packageDigest),
      taxonId: taxonId.value,
      durationMinutes: Number(durationMinutes.value),
      couplingCadenceMinutes: 1,
      interpolation: 'zero-order-hold',
      refinementFactors: [1, 2, 4],
      convergenceToleranceMg: 1e-9
    }, controller?.signal)
    state.value = 'ready'
  } catch (error) {
    state.value = 'failed'
    message.value = error instanceof Error ? error.message : 'Coupling was rejected.'
  }
}

async function execute() {
  if (!coupling.value) return
  const couplingDigest = coupling.value.couplingDigest
  state.value = 'running'
  message.value = ''
  try {
    const completed = await runPhysiologyCoupling(couplingDigest, controller?.signal)
    if (coupling.value?.couplingDigest !== couplingDigest || completed.couplingDigest !== couplingDigest) throw new Error('Physiology run does not match the displayed coupling digest.')
    run.value = completed
    state.value = 'ready'
  } catch (error) {
    state.value = 'failed'
    message.value = error instanceof Error ? error.message : 'Coupled run failed.'
  }
}

onMounted(initialize)
onBeforeUnmount(() => controller?.abort())
</script>
<template lang="pug">
Section.physiology-panel(title="Physiology plugin workbench" title-id="physiology-title" eyebrow="10 · Extensible physiology" :status="statusLabel" :tone="statusKind")
  .notice.notice--warning.stack.stack--tight(role="note")
    strong Synthetic / non-clinical
    p Persistent boundary: software protocol conformance only. No measured physiology, diagnosis, dosing, safety, or scientific validation.
  p.muted(v-if="state === 'loading'" role="status") Verifying evidence, trust store, signatures, and local catalog…
  .notice.notice--danger.stack.stack--tight(v-else-if="state === 'failed' && !workspace" role="alert")
    strong Physiology workbench unavailable
    p {{ message }}
    button.button.button--secondary(type="button" @click="initialize") Retry verification
  template(v-else-if="workspace")
    .notice.notice--danger.stack.stack--tight(v-if="state === 'failed'" role="alert")
      strong Operation blocked
      p {{ message }}
    dl.metrics
      Metric(label="Evidence release" :value="workspace.discovery.releaseId")
      Metric(label="Release SHA-256" :value="workspace.discovery.releaseDigest" mono)
      Metric(label="Package profile" :value="workspace.discovery.packageProfile")
      Metric(label="Process plugins" :value="workspace.discovery.processPlugins === 'disabled' ? 'Fail closed · sandbox unavailable' : 'Bubblewrap gated'")

    .grid
      article.card.card--flat.stack.stack--tight
        p.eyebrow Protocol certification
        p
          strong Verification first, persisted conformance run second
        p.muted Packages start not-certified. Only a successful persisted benchmark run certifies the declared software exchange protocol.
      article.notice.notice--warning.stack.stack--tight
        p
          span.badge.badge--warning Scientifically unsupported
        p
          strong Certification is not scientific validation
        p Every upstream scientific claim remains unsupported and no integrated conclusion is promoted.

    section.stack.stack--tight(aria-labelledby="physiology-catalog-title")
      h3#physiology-catalog-title Signed local catalog
      .grid
        article.card.card--flat.stack.stack--tight(v-for="item in packages" :key="item.packageDigest")
          .repel
            div
              p.eyebrow {{ item.manifest.applicability.domains[0] }}
              h4 {{ item.manifest.pluginId }}
            span(:class="badgeClass(item.trust.status === 'trusted' ? 'valid' : 'failed')") {{ item.trust.status }}
          dl.facts
            div
              dt Package digest
              dd.digest {{ item.packageDigest }}
            div
              dt Model descriptor
              dd.digest {{ item.modelDescriptorDigest }}
            div
              dt Coupling descriptor
              dd.digest {{ item.couplingDescriptorDigest }}
            div
              dt Publisher key
              dd.digest {{ item.signature.keyId }}
            div
              dt Signature
              dd.digest {{ item.signature.signature }}
            div
              dt License
              dd {{ item.manifest.license.spdx }} · redistributable
            div
              dt Certification
              dd {{ item.certification.status }}
            div
              dt Scientific validation
              dd
                span.badge.badge--warning {{ item.certification.scientificValidation }}
          h5 Ports · exact evidence binding
          ul.plain-list.stack.stack--tight
            li.card.card--flat.stack.stack--tight(v-for="port in evidenceByPlugin.get(item.manifest.pluginId)?.ports" :key="port.id")
              p
                strong {{ port.direction }} · {{ port.id }}
              p.muted {{ port.semantic }} · {{ port.dimension }} · {{ port.unit }}
          p.muted {{ contextById.get(item.manifest.applicability.contextIds[0])?.name }} · {{ item.manifest.applicability.taxonIds[0] }}
          label.choice
            input(type="radio" :name="`physiology-package-${item.manifest.pluginId}`" :checked="selectedPackageDigests[item.manifest.pluginId] === item.packageDigest" :disabled="isBusy || item.trust.status !== 'trusted'" @change="choosePackage(item)")
            span Use this exact package for {{ item.manifest.pluginId }}
          button.button.button--secondary(type="button" :disabled="isBusy || item.trust.status !== 'trusted'" @click="checkConformance(item)") Run and persist conformance
          p.notice(v-if="conformance[item.packageDigest]" role="status") Protocol {{ conformance[item.packageDigest].benchmark.passed ? 'passed' : 'failed' }} · scientific validation {{ conformance[item.packageDigest].scientificValidation }}

    .sidebar
      section.form(aria-labelledby="physiology-coupling-title")
        h3#physiology-coupling-title Coupling editor
        p.muted Four extensive #[code mg/min] exchanges use exact interval integration. Cadence and interpolation are explicit; incompatible units, shapes, ports, taxa, and extrapolations are blocked.
        label(for="physiology-taxon") Applicability taxon
        select#physiology-taxon(v-model="taxonId" :disabled="isBusy" @change="changeCouplingControls")
          option(value="NCBITaxon:9606") Homo sapiens · supported synthetic contract
          option(value="NCBITaxon:10090") Mus musculus · unsupported, must block
        label(for="physiology-duration") Bounded duration
        select#physiology-duration(v-model.number="durationMinutes" :disabled="isBusy" @change="changeCouplingControls")
          option(v-for="minute in [1, 2, 3, 4]" :key="minute" :value="minute") {{ minute }} min
        dl.facts
          div
            dt Coupling cadence
            dd 1 min
          div
            dt Interpolation
            dd zero-order hold
          div
            dt Integration
            dd exact piecewise constant
          div
            dt Refinement
            dd 1× / 2× / 4×
        Toolbar(label="Coupling actions")
          button.button(type="button" :disabled="isBusy || selectedPackages.length !== 3" @click="buildCoupling") {{ state === 'coupling' ? 'Validating…' : 'Create exact coupling' }}
          button.button.button--secondary(type="button" :disabled="isBusy || !coupling" @click="execute") {{ state === 'running' ? 'Running…' : 'Run coupled fixture' }}
      section.stack.stack--tight(v-if="coupling" aria-labelledby="physiology-contract-title")
        h3#physiology-contract-title Immutable coupling contract
        code.digest {{ coupling.couplingDigest }}
        p Applicability intersection: {{ coupling.applicabilityIntersection.taxonIds.join(', ') }} · {{ coupling.applicabilityIntersection.useScopes.join(', ') }}
        .grid
          article.card.card--flat.stack.stack--tight(v-for="exchange in coupling.exchanges" :key="exchange.quantityId")
            strong {{ exchange.source.plugin_id }} → {{ exchange.target.plugin_id }}
            code.digest {{ exchange.quantityId }}
            span.muted {{ exchange.semantic }} · {{ exchange.shape.join('×') }} · {{ exchange.unit }} · {{ exchange.cadenceMinutes }} min · {{ exchange.interpolation }}

    article.card.card--flat.stack(v-if="run" aria-labelledby="physiology-run-title")
      .repel
        div
          h3#physiology-run-title Exact run digest
          code.digest {{ run.runDigest }}
        span.badge.badge--warning Scientific validation unsupported
      dl.metrics
        Metric(label="Total mass" :value="`${run.diagnostics.initialMassMg} → ${run.diagnostics.finalMassMg} mg`")
        Metric(label="Maximum residual" :value="`${run.diagnostics.maximumAbsoluteResidualMg} mg`")
        Metric(label="Timestep convergence" :value="run.diagnostics.converged ? 'passed' : 'failed'")
        Metric(label="Max refinement difference" :value="`${run.diagnostics.convergenceMaximumDifferenceMg} mg`")
      .grid
        .scroll-x(role="region" tabindex="0" aria-label="Compartment mass schedule")
          table
            caption Compartment mass schedule
            thead
              tr
                th(scope="col") Minute
                th(scope="col") Circulation
                th(scope="col") Liver
                th(scope="col") Kidney
                th(scope="col") Residual
            tbody
              tr(v-for="snapshot in run.states" :key="snapshot.timeMinutes")
                th(scope="row") {{ snapshot.timeMinutes }}
                td {{ snapshot.massesMg['PLUGIN:CIRCULATION-REFERENCE'] }} mg
                td {{ snapshot.massesMg['PLUGIN:LIVER-REFERENCE'] }} mg
                td {{ snapshot.massesMg['PLUGIN:KIDNEY-REFERENCE'] }} mg
                td {{ snapshot.massConservationResidualMg }} mg
        .scroll-x(role="region" tabindex="0" aria-label="Timestep refinement")
          table
            caption Timestep refinement
            thead
              tr
                th(scope="col") Factor
                th(scope="col") Step
                th(scope="col") Residual
                th(scope="col") Final total
            tbody
              tr(v-for="item in run.diagnostics.refinement" :key="item.factor")
                th(scope="row") {{ item.factor }}×
                td {{ item.stepMinutes }} min
                td {{ item.maximumAbsoluteResidualMg }} mg
                td {{ Object.values(item.finalMassesMg).reduce((sum, value) => sum + value, 0) }} mg
      details.stack.stack--tight
        summary Integrated exchange amounts and protocol schedule
        .scroll-x(role="region" tabindex="0" aria-label="Integrated exchange amounts")
          table
            thead
              tr
                th(scope="col") Interval
                th(scope="col") Quantity
                th(scope="col") Rate
                th(scope="col") Integrated amount
                th(scope="col") Residual
            tbody
              tr(v-for="(exchange, index) in run.exchanges" :key="`${exchange.quantityId}-${index}`")
                td {{ exchange.intervalStartMinutes }}–{{ exchange.intervalEndMinutes }} min
                td {{ exchange.quantityId }}
                td {{ exchange.rateMgPerMinute }} mg/min
                td {{ exchange.integratedAmountMg }} mg
                td {{ exchange.residualMg }} mg

    section.stack.stack--tight(aria-labelledby="physiology-coverage-title")
      h3#physiology-coverage-title Goal 10 coverage matrix
      p.muted Contract coverage means a signed synthetic software fixture exists. It never means scientific support.
      .grid.grid--compact
        article.stack.stack--tight(v-for="cell in workspace.coverage.items" :key="cell.id" :class="cell.coverage_status === 'contract-covered' ? 'notice notice--success' : 'card card--flat'")
          p.eyebrow {{ cell.taxon_label }}
          p
            strong {{ cell.domain }}
          p.muted {{ cell.coverage_status }} · science {{ cell.scientific_validation_status }}
          p.muted(v-if="cell.plugin_id") {{ cell.installed ? 'signed package installed' : 'package absent' }}
</template>
