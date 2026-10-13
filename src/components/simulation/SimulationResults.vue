<script setup vapor>
import { computed } from 'vue'
import { TAXA } from '../../../shared/contracts.js'
import DataTable from '../../ui/DataTable.vue'
import EmptyState from '../../ui/EmptyState.vue'
import ErrorNotice from '../../ui/ErrorNotice.vue'
import Facts from '../../ui/Facts.vue'
import Notice from '../../ui/Notice.vue'
import Panel from '../../ui/Panel.vue'
import { fixed } from '../../ui/format.js'
import TimeSeriesChart from '../TimeSeriesChart.vue'

// Section 07: one controlled run, its comparison with the retained baseline,
// the final values and the integration diagnostics.
const props = defineProps({
  model: { type: Object, required: true },
  result: { type: Object, default: undefined },
  baseline: { type: Object, default: undefined },
  comparison: { type: Object, default: undefined },
  state: { type: String, required: true },
  message: { type: String, default: '' },
  isPrevious: { type: Boolean, default: false },
  selectedId: { type: String, required: true }
})
const emit = defineEmits(['select'])

const summary = computed(() => {
  const { summary: values, preset, effectiveInputs, taxonId } = props.result
  return [
    { label: 'Final homocysteine', value: fixed(values.finalHomocysteine, 3), note: `${props.model.concentrationUnit} · ${fixed(values.homocysteineChangePercent, 1)}% from initial`, large: true },
    { label: 'Final SAM:SAH', value: fixed(values.finalSamSahRatio, 3), note: `${fixed(values.samSahRatioChangePercent, 1)}% from initial`, large: true },
    { label: 'Taxon / preset', value: TAXA.find((item) => item.id === taxonId)?.name ?? '', note: `${preset} · activity ${effectiveInputs.mthfrActivity}`, large: true }
  ]
})
const diagnostics = computed(() => {
  const { diagnostics: values } = props.result
  return [
    { label: 'Method', value: values.method },
    { label: 'Steps', value: `${values.integrationSteps} × ${values.integrationStepHours} h` },
    { label: 'Maximum derivative', value: String(values.maxAbsoluteDerivative) },
    { label: 'Non-negative state', value: values.nonNegative ? 'yes' : 'no' },
    { label: 'Net represented-pool change', value: `${values.netRepresentedPoolChange} ${props.model.concentrationUnit}` }
  ]
})
const direction = computed(() => {
  const { summary: now } = props.result
  const { summary: before } = props.comparison
  return `Homocysteine is ${now.finalHomocysteine > before.finalHomocysteine ? 'higher' : 'lower'} and the SAM:SAH ratio is ${now.finalSamSahRatio < before.finalSamSahRatio ? 'lower' : 'higher'} than the compatible retained baseline prediction.`
})
</script>

<template lang="pug">
Panel(title="Controlled run" title-id="results-title" eyebrow="07 · Results" :status="isPrevious ? 'Previous specification' : ''" tone="warning")
  ErrorNotice(v-if="state === 'failed'" title="Simulation failed; no stale result is displayed" :message="message")
    p Your valid experiment controls are preserved. Run the deterministic model again to retry.
  EmptyState(v-else-if="!result" title="No simulation has been run") Configure a bounded preset, then run the deterministic model. Network knowledge remains inspectable before execution.
  template(v-else)
    Notice(v-if="isPrevious" tone="warning" role="status") These results belong to the previous configuration. Run again to update them.
    .repel
      div
        span.eyebrow Stable run identity
        code.digest(data-testid="run-id") {{ result.runId }}
      Notice(tone="warning") {{ result.predictionLabel }}
    Facts(:items="summary")
    Notice(v-if="result.preset === 'reduced-mthfr' && comparison" title="Reduced-MTHFR directional comparison")
      p {{ direction }}
    Notice(v-else-if="result.preset === 'reduced-mthfr' && baseline" tone="warning" role="status") The retained baseline has a different release, model, taxon, duration, step, or initial condition and is not compared.
    TimeSeriesChart(:result="result" :comparison="comparison" :selected-id="selectedId")
    DataTable(caption="Final concentration and flux values" :columns="['Series', 'Kind', 'Final value', 'Unit']")
      tr(v-for="series in result.concentrations" :key="series.id" :aria-current="series.id === selectedId ? 'true' : undefined")
        th(scope="row")
          button.button.button--link(type="button" @click="emit('select', series.id)") {{ series.name }}
        td Concentration
        td {{ fixed(series.values.at(-1), 4) }}
        td {{ series.unit }}
      tr(v-for="series in result.fluxes" :key="series.id")
        th(scope="row") {{ series.name }}
        td Flux
        td {{ fixed(series.values.at(-1), 4) }}
        td {{ series.unit }}
    .grid
      div
        h3 Integration diagnostics
        Facts(rows :items="diagnostics")
      div
        h3 Warnings
        ul
          li(v-for="warning in result.warnings" :key="warning") {{ warning }}
        p.muted Run pins {{ result.release.id }} · {{ result.release.digest }} · model {{ result.modelVersion }} · engine {{ result.engineVersion }}.
</template>
