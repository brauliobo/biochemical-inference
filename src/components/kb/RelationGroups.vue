<script setup vapor>
import ItemList from './ItemList.vue'

// Labelled groups of related entities ("Substrate of", "Mentions", ...). Each
// item links to its page with its type and the relation note, if any; long
// groups show the first few and tuck the rest behind "Show N more".
defineProps({ groups: { type: Array, required: true } })
</script>

<template lang="pug">
.stack.stack--loose
  section.stack.stack--tight(v-for="group in groups" :key="group.label")
    h3 {{ group.label }}
      span.muted  ({{ group.items.length }})
    ItemList(:items="group.items")
</template>
