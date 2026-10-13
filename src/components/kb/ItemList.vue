<script setup vapor>
import { computed } from 'vue'
import EntityItem from './EntityItem.vue'

// A list of entity rows that stays short: the first `limit` items show, the rest
// sit behind a native "Show N more" disclosure (still in the page, still links).
const props = defineProps({
  items: { type: Array, required: true },
  limit: { type: Number, default: 8 }
})
const head = computed(() => props.items.slice(0, props.limit))
const rest = computed(() => props.items.slice(props.limit))
</script>

<template lang="pug">
.stack.stack--tight
  ul.plain-list.stack.stack--tight
    li(v-for="item in head" :key="item.id")
      EntityItem(:item="item")
  details.stack.stack--tight(v-if="rest.length")
    summary Show {{ rest.length }} more
    ul.plain-list.stack.stack--tight
      li(v-for="item in rest" :key="item.id")
        EntityItem(:item="item")
</template>
