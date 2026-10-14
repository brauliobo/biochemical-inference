<script setup vapor>
import Badge from '../../ui/Badge.vue'

// One question of the robustness strip: the question, the spread bar and the verdict (see RobustnessStrip.vue).
defineProps({ item: { type: Object, required: true } })
</script>

<template lang="pug">
li.dash-robust__row
  .dash-robust__what
    strong {{ item.row.label }}
    span {{ item.metric.label }}
  svg.dash-robust__bar(viewBox="0 0 100 14" preserveAspectRatio="none" role="img" :aria-label="item.bar.text")
    line.dash-robust__zero(:x1="item.bar.zero" :x2="item.bar.zero" y1="0" y2="14")
    line.dash-robust__whisker(:x1="item.bar.p5" :x2="item.bar.p95" y1="7" y2="7")
    rect.dash-robust__box(:x="item.bar.p25" :width="Math.max(item.bar.p75 - item.bar.p25, 0.8)" y="3" height="8")
    rect.dash-robust__median(:x="item.bar.p50 - 0.5" width="1" y="1" height="12")
    path.dash-robust__clip(v-if="item.bar.clipLow" d="M0 7L3 3L3 11Z")
    path.dash-robust__clip(v-if="item.bar.clipHigh" d="M100 7L97 3L97 11Z")
  .dash-robust__verdict
    Badge(:label="item.metric.verdict.text" :tone="item.tone")
    small {{ item.bar.fraction }}
</template>
