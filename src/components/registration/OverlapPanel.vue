<script setup vapor>
import DataTable from '../../ui/DataTable.vue'
import Panel from '../../ui/Panel.vue'
import { fixed } from '../../ui/format.js'

// Residual label overlap per anatomy inside the repository-derived evaluation ROI.
defineProps({
  metrics: { type: Array, required: true },
  recomputed: { type: Boolean, required: true },
  checking: { type: Boolean, required: true },
  busy: { type: Boolean, required: true }
})
const emit = defineEmits(['recompute'])

const metric = (value, digits) => fixed(value, digits, 'not evaluable')
</script>

<template lang="pug">
Panel(title="Evaluation-ROI source-label comparison" title-id="overlap-title" eyebrow="Recomputed residual overlap" :level="3")
  template(#actions)
    button.button(type="button" :disabled="busy" data-testid="spatial-registration-residual-overlap" @click="emit('recompute')") {{ checking ? 'Checking 288 chunks…' : recomputed ? 'Recompute again' : 'Recompute residual overlap' }}
  p Dice and centroid distance are recomputed inside the repository-derived evaluation ROI. They describe residual label overlap and are not independent registration-quality validation or ground truth.
  DataTable(caption="Residual label overlap per anatomy" :columns="['Anatomy', 'Status', 'Dice', 'Centroid mm', 'MR / CT voxels']")
    tr(v-for="item in metrics" :key="item.label")
      th(scope="row") {{ item.anatomy }}
      td {{ item.status }}
      td {{ metric(item.dice, 6) }}
      td {{ metric(item.centroid_distance_mm, 3) }}
      td {{ item.fixed_mr_voxels.toLocaleString() }} / {{ item.moving_ct_voxels.toLocaleString() }}
</template>
