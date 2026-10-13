<script setup vapor>
import EntityItem from './EntityItem.vue'

// A listing split into headed groups (see kb/listing.js groupItems). A group with a
// null label is a plain list without a heading.
defineProps({
  groups: { type: Array, required: true },
  showEvidence: { type: Boolean, default: true },
  showType: { type: Boolean, default: false }
})
</script>

<template lang="pug">
.stack.stack--loose
  section.stack(v-for="group in groups" :key="group.key")
    h2(v-if="group.label") {{ group.label }}
      span.muted  ({{ group.items.length }})
    ul.plain-list.stack
      li(v-for="item in group.items" :key="item.id")
        EntityItem(:item="item" :show-type="showType" :show-evidence="showEvidence" show-summary)
</template>
