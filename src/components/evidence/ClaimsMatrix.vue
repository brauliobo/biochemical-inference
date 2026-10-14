<script setup vapor>
import { claimStatusInfo } from '../../knowledge/evidence.js'
import { entityPath } from '../../kb/paths.js'
import Badge from '../../ui/Badge.vue'
import RouterLink from '../../ui/RouterLink.vue'
import DesignIcon from './DesignIcon.vue'
import GradeMark from './GradeMark.vue'
import MarkIcon from './MarkIcon.vue'
import VerdictBar from './VerdictBar.vue'

// The claims audit matrix: one row per claim with status, evidence grade, how many articles support
// and contradict it, the best study design behind it and a verdict bar. `groups` is
// [{ key, label, items }] (label null for one flat list); the column headers are sort buttons
// (`sort` event with the sort id; `sort` is the one in force).
defineProps({
  groups: { type: Array, required: true },
  maxTotal: { type: Number, required: true },
  sort: { type: String, default: 'topic' },
  flat: { type: Boolean, default: false }
})
const emit = defineEmits(['sort'])

const COLUMNS = 7
const ariaSort = (current, id) => (current === id ? 'descending' : undefined)
</script>

<template lang="pug">
.data-table(role="region" tabindex="0" aria-label="Claims audit: one row per claim")
  table.ev-table
    caption.visually-hidden Claims, each with status, evidence grade, supporting and contradicting articles, best design and a verdict bar
    thead
      tr
        th(scope="col" :aria-sort="ariaSort(sort, 'name')")
          button.ev-sort(type="button" @click="emit('sort', 'name')") Claim
        th(scope="col" :aria-sort="ariaSort(sort, 'status')")
          button.ev-sort(type="button" @click="emit('sort', 'status')") Status
        th(scope="col") Grade
        th.ev-num(scope="col" :aria-sort="ariaSort(sort, 'for')")
          button.ev-sort(type="button" @click="emit('sort', 'for')") For
        th.ev-num(scope="col" :aria-sort="ariaSort(sort, 'against')")
          button.ev-sort(type="button" @click="emit('sort', 'against')") Against
        th(scope="col" :aria-sort="ariaSort(sort, 'design')")
          button.ev-sort(type="button" @click="emit('sort', 'design')") Best design
        th(scope="col" :aria-sort="ariaSort(sort, 'index')")
          button.ev-sort(type="button" @click="emit('sort', 'index')") Verdict
    tbody(v-for="group in groups" :key="group.key")
      tr.ev-group(v-if="group.label")
        th(:colspan="COLUMNS" scope="rowgroup") {{ `${group.label} (${group.items.length})` }}
      tr(v-for="claim in group.items" :key="claim.id")
        th(scope="row")
          RouterLink.ev-oneline(:to="entityPath(claim.id)") {{ claim.name }}
        td
          Badge(:label="claimStatusInfo(claim.status).label" :tone="claimStatusInfo(claim.status).tone")
        td
          GradeMark(:grade="claim.grade")
        td.ev-num
          span.ev-stance
            MarkIcon(:look="0")
            span {{ claim.nFor }}
        td.ev-num
          span.ev-stance
            MarkIcon(:look="1")
            span {{ claim.nAgainst }}
        td
          DesignIcon(v-if="claim.bestDesign" :design="claim.bestDesign" short)
          span.muted(v-else) none
        td
          VerdictBar(:claim="claim" :max-total="maxTotal")
</template>
