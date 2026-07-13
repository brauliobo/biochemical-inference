<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { createPhysiologyCoupling, loadPhysiologyWorkbench, runPhysiologyConformance, runPhysiologyCoupling } from '../api.js'

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
section.physiology-panel(aria-labelledby="physiology-title")
  .physiology-warning(role="note")
    strong Synthetic / non-clinical
    span Persistent boundary: software protocol conformance only. No measured physiology, diagnosis, dosing, safety, or scientific validation.
  .section-heading
    div
      p.kicker 10 · Extensible physiology
      h2#physiology-title Physiology plugin workbench
    span.status-chip(:class="state === 'failed' ? 'failed' : state === 'ready' ? '' : 'previous'") {{ state === 'loading' ? 'Loading' : isBusy ? 'Working' : state === 'failed' ? 'Blocked' : 'Pinned v1' }}
  .physiology-loading(v-if="state === 'loading'" aria-live="polite") Verifying evidence, trust store, signatures, and local catalog…
  .alert.error(v-else-if="state === 'failed' && !workspace" role="alert")
    strong Physiology workbench unavailable
    p {{ message }}
    button.secondary(type="button" @click="initialize") Retry verification
  template(v-else-if="workspace")
    .alert.error(v-if="state === 'failed'" role="alert")
      strong Operation blocked
      p {{ message }}
    dl.physiology-provenance
      div
        dt Evidence release
        dd {{ workspace.discovery.releaseId }}
      div
        dt Release SHA-256
        dd.digest {{ workspace.discovery.releaseDigest }}
      div
        dt Package profile
        dd {{ workspace.discovery.packageProfile }}
      div
        dt Process plugins
        dd {{ workspace.discovery.processPlugins === 'disabled' ? 'Fail closed · sandbox unavailable' : 'Bubblewrap gated' }}

    .science-separation
      article
        span.certification-label Protocol certification
        strong Verification first, persisted conformance run second
        p Packages start not-certified. Only a successful persisted benchmark run certifies the declared software exchange protocol.
      article.unsupported-science
        span.unsupported-badge Scientifically unsupported
        strong Certification is not scientific validation
        p Every upstream scientific claim remains unsupported and no integrated conclusion is promoted.

    h3 Signed local catalog
    .plugin-catalog
      article.plugin-card(v-for="item in packages" :key="item.packageDigest")
        .plugin-card-heading
          div
            span.plugin-domain {{ item.manifest.applicability.domains[0] }}
            h4 {{ item.manifest.pluginId }}
          span.status-chip(:class="item.trust.status === 'trusted' ? '' : 'failed'") {{ item.trust.status }}
        dl.compact-list
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
            dd.unsupported-text {{ item.certification.scientificValidation }}
        h5 Ports · exact evidence binding
        ul.port-list
          li(v-for="port in evidenceByPlugin.get(item.manifest.pluginId)?.ports" :key="port.id")
            strong {{ port.direction }} · {{ port.id }}
            span {{ port.semantic }} · {{ port.dimension }} · {{ port.unit }}
        p.plugin-context {{ contextById.get(item.manifest.applicability.contextIds[0])?.name }} · {{ item.manifest.applicability.taxonIds[0] }}
        label
          input(type="radio" :name="`physiology-package-${item.manifest.pluginId}`" :checked="selectedPackageDigests[item.manifest.pluginId] === item.packageDigest" :disabled="isBusy || item.trust.status !== 'trusted'" @change="choosePackage(item)")
          span Use this exact package for {{ item.manifest.pluginId }}
        button.secondary(type="button" :disabled="isBusy || item.trust.status !== 'trusted'" @click="checkConformance(item)") Run and persist conformance
        p.conformance-result(v-if="conformance[item.packageDigest]") Protocol {{ conformance[item.packageDigest].benchmark.passed ? 'passed' : 'failed' }} · scientific validation {{ conformance[item.packageDigest].scientificValidation }}

    .coupling-editor
      .coupling-controls
        h3 Coupling editor
        p Four extensive `mg/min` exchanges use exact interval integration. Cadence and interpolation are explicit; incompatible units, shapes, ports, taxa, and extrapolations are blocked.
        label(for="physiology-taxon") Applicability taxon
        select#physiology-taxon(v-model="taxonId" :disabled="isBusy" @change="changeCouplingControls")
          option(value="NCBITaxon:9606") Homo sapiens · supported synthetic contract
          option(value="NCBITaxon:10090") Mus musculus · unsupported, must block
        label(for="physiology-duration") Bounded duration
        select#physiology-duration(v-model.number="durationMinutes" :disabled="isBusy" @change="changeCouplingControls")
          option(v-for="minute in [1, 2, 3, 4]" :key="minute" :value="minute") {{ minute }} min
        dl.compact-list
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
        .coupling-actions
          button.run-button(type="button" :disabled="isBusy || selectedPackages.length !== 3" @click="buildCoupling") {{ state === 'coupling' ? 'Validating…' : 'Create exact coupling' }}
          button.secondary(type="button" :disabled="isBusy || !coupling" @click="execute") {{ state === 'running' ? 'Running…' : 'Run coupled fixture' }}
      .coupling-contract(v-if="coupling")
        h3 Immutable coupling contract
        code {{ coupling.couplingDigest }}
        p Applicability intersection: {{ coupling.applicabilityIntersection.taxonIds.join(', ') }} · {{ coupling.applicabilityIntersection.useScopes.join(', ') }}
        .exchange-list
          article(v-for="exchange in coupling.exchanges" :key="exchange.quantityId")
            strong {{ exchange.source.plugin_id }} → {{ exchange.target.plugin_id }}
            code {{ exchange.quantityId }}
            span {{ exchange.semantic }} · {{ exchange.shape.join('×') }} · {{ exchange.unit }} · {{ exchange.cadenceMinutes }} min · {{ exchange.interpolation }}

    .physiology-result(v-if="run")
      .physiology-run-header
        div
          span.run-label Exact run digest
          code {{ run.runDigest }}
        span.unsupported-badge Scientific validation unsupported
      .physiology-metrics
        article
          span Total mass
          strong {{ run.diagnostics.initialMassMg }} → {{ run.diagnostics.finalMassMg }} mg
        article
          span Maximum residual
          strong {{ run.diagnostics.maximumAbsoluteResidualMg }} mg
        article
          span Timestep convergence
          strong {{ run.diagnostics.converged ? 'passed' : 'failed' }}
        article
          span Max refinement difference
          strong {{ run.diagnostics.convergenceMaximumDifferenceMg }} mg
      .run-tables
        .series-table-wrap
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
        .series-table-wrap
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
      details.exchange-audit
        summary Integrated exchange amounts and protocol schedule
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

    .coverage-panel
      h3 Goal 10 coverage matrix
      p Contract coverage means a signed synthetic software fixture exists. It never means scientific support.
      .coverage-grid
        article(v-for="cell in workspace.coverage.items" :key="cell.id" :class="cell.coverage_status")
          span {{ cell.taxon_label }}
          strong {{ cell.domain }}
          small {{ cell.coverage_status }} · science {{ cell.scientific_validation_status }}
          small(v-if="cell.plugin_id") {{ cell.installed ? 'signed package installed' : 'package absent' }}
</template>
