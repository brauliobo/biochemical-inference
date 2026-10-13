<script setup vapor>
import { computed } from 'vue'
import Badge from '../../ui/Badge.vue'
import Card from '../../ui/Card.vue'
import ChartFrame from '../../ui/ChartFrame.vue'
import DataTable from '../../ui/DataTable.vue'
import LineChart from '../../ui/LineChart.vue'
import Notice from '../../ui/Notice.vue'
import { fixed } from '../../ui/format.js'

// The terminal result of one portfolio run: the engine-specific output, the
// run's diagnostics and its identity.
const props = defineProps({ result: { type: Object, required: true } })

const SAMPLE_COUNT = 8
const data = computed(() => props.result.data)
const first = computed(() => (data.value?.engine === 'ode' ? data.value.trajectories[0] : undefined))
const indexes = computed(() => first.value?.values.map((_, index) => index) ?? [])
const peak = computed(() => Math.max(...(first.value?.values ?? [1]), 1) / 0.9)
// Text alternative for the trajectory: a sentence and a short sampled table.
const summary = computed(() => {
  const { time } = data.value
  const values = first.value.values
  const digits = (value) => value.toPrecision(4)
  return `${first.value.name} starts at ${digits(values[0])}, peaks at ${digits(Math.max(...values))} and ends at ${digits(values.at(-1))} ${first.value.unit.symbol} over ${time.at(-1)} s.`
})
const samples = computed(() => {
  const { time } = data.value
  const values = first.value.values
  const last = values.length - 1
  const step = Math.max(1, Math.ceil(last / SAMPLE_COUNT))
  const picked = []
  for (let index = 0; index < last; index += step) picked.push(index)
  return [...picked, last].map((index) => ({ time: time[index], value: values[index].toPrecision(5) }))
})
</script>

<template lang="pug">
Card(flat aria-labelledby="portfolio-result-title")
  .repel
    div
      h3#portfolio-result-title Terminal run identity
      code.digest {{ result.runId }}
    Badge(:label="`${result.lifecycle} · ${result.outcome}`" :status="result.outcome")
  template(v-if="data?.engine === 'ode'")
    ChartFrame(id="portfolio-chart" :title="`Reactant trajectory (${first.unit.symbol})`" :summary="summary" table-label="Show trajectory samples")
      LineChart(stretch :width="100" :height="100" :times="indexes" :lines="[{ values: first.values }]" :max="peak" :label="`ODE reactant trajectory with ${data.time.length} points`")
      template(#table)
        table
          caption Sampled {{ first.name }}
          thead
            tr
              th(scope="col") Time (s)
              th(scope="col") Value ({{ first.unit.symbol }})
          tbody
            tr(v-for="sample in samples" :key="sample.time")
              th(scope="row") {{ sample.time }}
              td {{ sample.value }}
    DataTable(caption="ODE final state" :columns="['State', 'Final value', 'Unit']")
      tr(v-for="series in data.trajectories" :key="series.id")
        th(scope="row") {{ series.name }}
        td {{ series.values.at(-1).toPrecision(7) }}
        td {{ series.unit.symbol }}
  DataTable(v-else-if="data?.engine === 'ssa'" :caption="`SSA final replicate summaries (n=${data.replicates})`" :columns="['State', 'Mean', 'Variance', 'Median', 'Range', 'Unit']")
    tr(v-for="row in data.summaries" :key="row.id")
      th(scope="row") {{ row.name }}
      td {{ fixed(row.mean, 3) }}
      td {{ fixed(row.variance, 3) }}
      td {{ row.median }}
      td {{ row.minimum }}–{{ row.maximum }}
      td {{ row.unit.symbol }}
  DataTable(v-else-if="data?.engine === 'fba'" :caption="`FBA optimum ${fixed(data.objective, 6)} ${data.objectiveUnit.symbol}`" :columns="['Flux', 'Value', 'Unit']")
    tr(v-for="flux in data.fluxes" :key="flux.id")
      th(scope="row") {{ flux.name }}
      td {{ fixed(flux.value, 6) }}
      td {{ flux.unit.symbol }}
  Notice(v-else-if="result.failure" tone="danger" role="alert" :title="result.failure.code")
    p {{ result.failure.message }}
  Notice
    p
      strong {{ result.diagnostics.algorithm }} {{ result.diagnostics.algorithmVersion }}
    p {{ result.diagnostics.iterations }} iterations/events · seed {{ result.provenance.seed }}
    p
      code {{ result.provenance.modelDigest }}
</template>
