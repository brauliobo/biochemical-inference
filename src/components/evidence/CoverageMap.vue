<script setup vapor>
import { computed } from 'vue'
import { coverageGaps, coverageMatrix } from '../../kb/evidence.js'
import Badge from '../../ui/Badge.vue'
import Heatmap from '../../viz/Heatmap.vue'

// Where the evidence is thin: articles by topic (rows) and study design (columns), every cell printing
// its count (zeros included, so a missing design is visible), and under it the plain gaps per topic
// ("no meta-analysis", "only 1 RCT"). Choosing a cell emits `select({ topic, design })`.
const props = defineProps({ articles: { type: Array, required: true } })
const emit = defineEmits(['select'])

const matrix = computed(() => coverageMatrix(props.articles))
const gaps = computed(() => coverageGaps(props.articles))
</script>

<template lang="pug">
.stack
  Heatmap(id="ev-coverage" title="Articles by topic and study design" :rows="matrix.rows" :cols="matrix.cols" :values="matrix.values" :domain="[0, 18]" row-title="Topic" col-title="Design" unit="articles" totals @select="emit('select', { topic: $event.row, design: $event.col })")
  p.muted Choose a cell (click, or Enter) to list those articles. A 0 is a gap, not missing data.
  ul.plain-list.stack.stack--tight(aria-label="Gaps per topic, thinnest first")
    li.cluster(v-for="entry in gaps" :key="entry.topic")
      strong {{ entry.label }}
      span.muted {{ `${entry.total} articles, ${entry.human} observing people, ${entry.trials} RCT, systematic review or meta-analysis` }}
      Badge(v-for="gap in entry.gaps" :key="gap" :label="gap" tone="warning")
</template>
