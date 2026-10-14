<script setup vapor>
import { computed } from 'vue'
import { entityPath } from '../../kb/paths.js'
import RouterLink from '../../ui/RouterLink.vue'
import { formatNumber } from '../../viz/scale.js'

// A short list of the largest changes against the reference state as diverging bars: left of the line a fall, right a
// rise, the percentage printed beside each bar. Rows link to the knowledge-base page of the compound or reaction.
//
//   ChangeBars(label="Largest changes" :items="[{ id: 'compound:sam', label: 'SAM', kind: 'compound', relative: -0.12 }]")
const props = defineProps({
  items: { type: Array, required: true },
  label: { type: String, default: 'Largest changes against the reference state' },
  scale: { type: Number, default: 0 }
})
const span = computed(() => props.scale || Math.max(0.1, ...props.items.map((item) => Math.min(Math.abs(item.relative), 2))))
const rows = computed(() => props.items.map((item) => ({
  ...item,
  share: Math.min(1, Math.abs(item.relative) / span.value),
  text: `${item.relative < 0 ? '−' : '+'}${formatNumber(Math.abs(item.relative) * 100, 3)}%`,
  arrow: item.relative < 0 ? '▼' : '▲'
})))
</script>

<template lang="pug">
ul.dash-changes(:aria-label="label")
  li.dash-change(v-for="row in rows" :key="row.id")
    span.dash-change__name
      RouterLink(:to="entityPath(row.id)") {{ row.label }}
      small.muted {{ row.kind }}
    span.dash-change__track(aria-hidden="true")
      span.dash-change__bar(:class="row.relative < 0 ? 'dash-change__bar--down' : 'dash-change__bar--up'" :style="{ '--share': row.share }")
    span.dash-change__value
      span(aria-hidden="true") {{ row.arrow }}
      | {{ ` ${row.text}` }}
  li.muted(v-if="!rows.length") Nothing moves by more than 0.5% in this scenario.
</template>
