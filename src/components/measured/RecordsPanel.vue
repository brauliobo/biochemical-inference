<script setup vapor>
import { computed } from 'vue'
import DataTable from '../../ui/DataTable.vue'
import Facts from '../../ui/Facts.vue'
import Panel from '../../ui/Panel.vue'

// Calibration records (raw measured next to derived normalization), paging, and
// the full lineage of one selected measurement.
const props = defineProps({
  measurements: { type: Object, default: undefined },
  missingness: { type: Array, required: true },
  lineage: { type: Object, default: undefined },
  busy: { type: Boolean, required: true }
})
const emit = defineEmits(['next', 'lineage'])

const facts = computed(() => {
  const { measurement, uncertainty, context, normalized_transformation: transformation, source, license } = props.lineage.lineage
  const qualifier = context.qualifiers[0]
  return [
    { label: 'Identity', value: measurement.id },
    { label: 'Scientific label', value: `${measurement.scientific_origin} · ${measurement.validation_state}` },
    { label: 'Uncertainty', value: uncertainty.kind },
    { label: 'Control qualifier', value: `${qualifier?.status} “${qualifier?.raw_value}”` },
    { label: 'Source locator', value: `${measurement.locator.source_native_cell} in ${measurement.locator.table}` },
    { label: 'Transformation', value: transformation.expression },
    { label: 'Source / license', value: `${source.accession} · ${license.rights_basis}` },
    { label: 'Lineage digest', value: props.lineage.lineageDigest, mono: true }
  ]
})
</script>

<template lang="pug">
.sidebar.sidebar--end
  Panel(title="Calibration records" title-id="measured-records-title" :level="3" flat)
    p #[strong measured] raw reports alongside #[strong derived-measurement] deterministic normalization.
    DataTable(data-testid="measured-table" caption="Calibration records, raw and normalized" :columns="['ID', 'Raw measured', 'Normalized derived', 'Locator']")
      tr(v-for="item in measurements?.items" :key="item.id")
        th(scope="row")
          code {{ item.id }}
        td {{ item.reported_value }} {{ item.reported_unit }}
        td {{ item.normalized.value }} {{ item.normalized.unit }}
        td {{ item.locator.table }} · {{ item.locator.source_native_cell }}
    button.button.button--secondary(type="button" :disabled="!measurements?.nextCursor || busy" data-testid="measured-next-page" @click="emit('next')") Next verified page
    p.muted {{ missingness.length }} calibration missingness rows on the current complete role traversal; QNS/blank never become zero.
  Panel(title="Selected lineage" title-id="lineage-title" :level="3" flat)
    button.button.button--secondary(type="button" :disabled="busy" data-testid="inspect-lineage" @click="emit('lineage')") Inspect ALT 24 h lineage
    Facts(v-if="lineage" data-testid="measured-lineage" :items="facts")
</template>
