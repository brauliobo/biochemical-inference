<script setup vapor>
// The headline counters: how many claims are supported, partly supported, unsupported and
// contested. Each tile is a toggle button that filters the claims table beside it
// (v-model is the selected status, '' for all).
//
//   StatusTiles(:counts="statusCounts(claims)" :total="claims.length" v-model="status")
const selected = defineModel({ type: String, default: '' })
defineProps({
  counts: { type: Array, required: true },
  total: { type: Number, required: true }
})

const toggle = (status) => {
  selected.value = selected.value === status ? '' : status
}
const percent = (share) => `${Math.round(share * 100)}%`
</script>

<template lang="pug">
div(role="group" aria-label="Filter the claims by status")
  ul.ev-tiles
    li(v-for="entry in counts" :key="entry.status")
      button.ev-tile(type="button" :class="`ev-tile--${entry.status}`" :aria-pressed="selected === entry.status" @click="toggle(entry.status)")
        span.ev-tile__count {{ entry.count }}
        span.ev-tile__label {{ entry.label }}
        span.ev-tile__share {{ `${percent(entry.share)} of ${total} claims` }}
        span.ev-tile__bar(aria-hidden="true")
          span(:style="{ '--share': entry.share }")
</template>
