<script setup vapor>
import Badge from './Badge.vue'
import EntityLink from './EntityLink.vue'

// A chain of links between two entities, one labelled step per line:
// "Glycine - Increased by - Glycine powder". `path` is shortestPath's result.
defineProps({ path: { type: Object, required: true } })
</script>

<template lang="pug">
ol.plain-list.stack.stack--tight
  li.cluster(v-for="(step, index) in path.steps" :key="index")
    EntityLink(:id="step.from")
    Badge(:label="step.label" tone="info")
    EntityLink(:id="step.to")
</template>
