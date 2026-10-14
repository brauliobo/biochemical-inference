<script setup vapor>
import Badge from '../../ui/Badge.vue'
import DataTable from '../../ui/DataTable.vue'
import RouterLink from '../../ui/RouterLink.vue'
import { articlePath } from './causal-view.js'

// The numbers a page uses that do not come from a simulation model: value, range, status and the study behind it.
//   SourceTable(caption="Numbers behind the TMA chart" :rows="[{ id, label, value, range, status, tone, article }]")
defineProps({
  caption: { type: String, required: true },
  rows: { type: Array, required: true }
})
</script>

<template lang="pug">
DataTable(:caption="caption" :columns="['Number', 'Value', 'Range', 'Status', 'Source']" :count="rows.length")
  tr(v-for="row in rows" :key="row.id")
    th(scope="row") {{ row.label }}
    td {{ row.value }}
    td {{ row.range }}
    td
      Badge(:label="row.status" :tone="row.tone ?? 'muted'")
    td
      RouterLink(v-if="row.article" :to="articlePath(row.article)" :aria-label="`Open the study: ${row.label}`") Open the study
      span.muted(v-else) Assumption
</template>
