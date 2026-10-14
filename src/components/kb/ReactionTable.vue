<script setup vapor>
import { entityPath } from '../../kb/paths.js'
import DataTable from '../../ui/DataTable.vue'
import RouterLink from '../../ui/RouterLink.vue'
import ReactionGraphic from './ReactionGraphic.vue'

// Reactions as a compact table: name, equation graphic, and (for a compound) whether it is consumed or
// produced there. `rows` are reactionModel() results, optionally with `role`.
defineProps({
  rows: { type: Array, required: true },
  caption: { type: String, default: 'Reactions' },
  showRole: { type: Boolean, default: false }
})
const ROLE = { consumed: 'Consumed', produced: 'Produced', both: 'Consumed and produced' }
</script>

<template lang="pug">
DataTable.reaction-table(v-if="rows.length" :caption="caption" :columns="showRole ? ['Reaction', 'Role', 'Equation'] : ['Reaction', 'Equation']")
  tr(v-for="row in rows" :key="row.id")
    th(scope="row")
      RouterLink(:to="entityPath(row.id)") {{ row.name }}
    td(v-if="showRole")
      span.badge {{ ROLE[row.role] ?? row.role }}
    td
      ReactionGraphic(:model="row" compact)
</template>
