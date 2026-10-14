<script setup vapor>
import { signGlyph, signWords } from '../../viz/shapes.js'
import ClaimStatusBadge from './ClaimStatusBadge.vue'
import EntityLink from './EntityLink.vue'
import GradeDot from './GradeDot.vue'
import TypeBadge from './TypeBadge.vue'
import DataTable from '../../ui/DataTable.vue'

// The signed effects of an entity as a compact table: what it does or what is done to it, the sign
// (glyph, word and colour), the other entry, its evidence grade and, for a hypothesis edge, the status of
// the claim behind it. `rows` come from kb/causal-view.js effectRows().
defineProps({
  rows: { type: Array, required: true },
  caption: { type: String, default: 'Signed effects' }
})
const sign = (row) => ({ sign: row.vizSign, hypothesis: row.hypothesis })
</script>

<template lang="pug">
DataTable.effect-table(v-if="rows.length" :caption="caption" :columns="['Effect', 'Entry', 'Kind', 'Evidence', 'Status']")
  tr(v-for="row in rows" :key="`${row.dir}-${row.rel}-${row.id}`")
    th(scope="row")
      span.sign(:class="`sign--${row.vizSign}`")
        span.sign__glyph(aria-hidden="true") {{ signGlyph(sign(row)) || '·' }}
        span {{ row.phrase }}
    td
      EntityLink(:id="row.id" :label="row.name")
    td
      TypeBadge(:type="row.type")
    td
      GradeDot(:grade="row.evidence")
    td
      .cluster.cluster--tight(v-if="row.hypothesis || row.claimStatus")
        span.badge(v-if="row.hypothesis") Hypothesis
        ClaimStatusBadge(v-if="row.claimStatus" :status="row.claimStatus")
      span.muted(v-else) established link
</template>
