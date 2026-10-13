<script setup vapor>
import Disclosure from './Disclosure.vue'

// A figure around one chart: a caption (title and optional current value), the
// chart itself (default slot, an <svg role="img" aria-label>), a visible text
// summary, an optional legend, and an optional data table behind a disclosure.
// The summary and table are the chart's text alternative.
defineProps({
  id: { type: String, required: true },
  title: { type: String, required: true },
  value: { type: String, default: '' },
  summary: { type: String, default: '' },
  tableLabel: { type: String, default: 'Show data table' }
})
</script>

<template lang="pug">
figure.stack.stack--tight(:aria-labelledby="`${id}-caption`")
  figcaption.repel(:id="`${id}-caption`")
    strong {{ title }}
    span.muted(v-if="value") {{ value }}
  slot
  p.muted(v-if="summary") {{ summary }}
  .cluster(v-if="$slots.legend")
    slot(name="legend")
  Disclosure(v-if="$slots.table" :summary="tableLabel")
    .scroll-x(role="region" tabindex="0" :aria-label="`${title}: data table`")
      slot(name="table")
</template>
