<script setup vapor>
import { computed } from 'vue'
import Disclosure from '../../ui/Disclosure.vue'
import RobustRow from './RobustRow.vue'
import { barModel, flattenRows, verdictTone } from './robust-model.js'

// "What is robust?": for each question, how the effect spreads over 100 parameter sets drawn from the literature
// ranges (box = middle half, whisker = 5th to 95th percentile, tick = median, line = no change), a verdict word and the
// share of sets beyond a threshold. Rows of the chosen scenario (or of the given groups) come first; the rest are
// behind a disclosure.
//
//   RobustnessStrip(:rows="robustness.rows" scenario="glycine-10g" :groups="['glycine']")
const props = defineProps({
  rows: { type: Array, required: true },
  scenario: { type: String, default: '' },
  groups: { type: Array, default: () => [] }
})
const all = computed(() => flattenRows(props.rows).map((item) => ({ ...item, bar: barModel(item), tone: verdictTone(item.metric.verdict) })))
const mine = computed(() => all.value.filter((item) => item.row.scenario === props.scenario || props.groups.includes(item.row.group)))
const others = computed(() => all.value.filter((item) => !mine.value.includes(item)))
</script>

<template lang="pug">
.dash-robust.stack
  p.muted How much of each effect survives when every uncertain constant is varied over its literature range (100 parameter sets).
  ul.plain-list.dash-robust__list(v-if="mine.length" aria-label="Questions for this scenario")
    RobustRow(v-for="item in mine" :key="item.key" :item="item")
  Disclosure(v-if="others.length" :summary="`${mine.length ? 'All other' : 'All'} questions (${others.length})`")
    ul.plain-list.dash-robust__list
      RobustRow(v-for="item in others" :key="item.key" :item="item")
  p.muted.dash-robust__axis Bars run from −60% to +60% change (a triangle marks a spread that runs beyond) against each parameter set's own starting state. Box: middle half. Whisker: 5th to 95th percentile. Tick: median.
</template>
