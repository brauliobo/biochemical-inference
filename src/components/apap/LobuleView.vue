<script setup vapor>
import { computed } from 'vue'
import DataTable from '../../ui/DataTable.vue'
import InputField from '../../ui/InputField.vue'
import SelectField from '../../ui/SelectField.vue'
import { fixed } from '../../ui/format.js'
import SpatialTissueWorkbench from '../SpatialTissueWorkbench.vue'

// One lobule time point of the run: a linked 3D view, a keyboard-operable heat
// strip of the 12 portal-to-central bins, and the exact numbers as a table.
const props = defineProps({
  result: { type: Object, required: true },
  taxonId: { type: String, required: true }
})
const timeIndex = defineModel('timeIndex', { type: Number, required: true })
const selectedBin = defineModel('selectedBin', { type: Number, required: true })
const field = defineModel('field', { type: String, required: true })

const FIELDS = [['apap', 'APAP'], ['napqi', 'NAPQI'], ['gsh', 'GSH'], ['adduct', 'Adduct'], ['oxygen', 'Oxygen'], ['injured', 'Injured fraction']].map(([value, label]) => ({ value, label }))
const COLUMNS = ['apap', 'napqi', 'gsh', 'adduct', 'oxygen', 'healthy', 'stressed', 'injured', 'recovering']
const HEADERS = ['Bin', 'APAP', 'NAPQI', 'GSH', 'Adduct', 'O₂', 'Healthy', 'Stressed', 'Injured', 'Recovering']

const snapshot = computed(() => props.result.lobule.snapshots[timeIndex.value])
const values = computed(() => snapshot.value?.[field.value] ?? [])

// Share of the largest value in the snapshot, 0 to 1; drives the bar under each bin.
function heat(value) {
  const maximum = Math.max(...values.value)
  return maximum === 0 ? 0 : Math.min(1, value / maximum)
}
</script>

<template lang="pug">
.stack
  .grid
    InputField(id="apap-time" :label="`Lobule time: ${snapshot?.timeHours} h`" type="range" v-model="timeIndex" min="0" :max="result.lobule.snapshots.length - 1" step="1")
    SelectField(id="apap-field" label="Heatmap field" v-model="field" :options="FIELDS")
  template(v-if="snapshot")
    SpatialTissueWorkbench(:taxon-id="taxonId" :snapshot="snapshot" :time-index="timeIndex" :field="field" :selected-bin="selectedBin" @select-bin="selectedBin = $event")
    .heatmap(role="group" :aria-label="`${field} across 12 portal-to-central lobule bins at ${snapshot.timeHours} hours`")
      button(v-for="(value, index) in values" :key="index" type="button" :aria-label="`Bin ${index + 1}: ${value}`" :aria-pressed="selectedBin === index" @click="selectedBin = index")
        span {{ index + 1 }}
        strong {{ fixed(value, 4) }}
        span.heatmap__bar(:style="{ '--heat': heat(value) }")
    p.repel.muted(aria-hidden="true")
      span Portal
      span Central
    DataTable(:caption="`Accessible lobule state at ${snapshot.timeHours} h; no interpolation`" :columns="HEADERS")
      tr(v-for="(_, index) in snapshot.apap" :key="index" :aria-current="selectedBin === index ? 'true' : undefined")
        th(scope="row") {{ index + 1 }}
        td(v-for="column in COLUMNS" :key="column") {{ fixed(snapshot[column][index], 4) }}
</template>
