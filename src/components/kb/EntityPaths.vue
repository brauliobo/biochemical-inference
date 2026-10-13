<script setup vapor>
import { computed } from 'vue'
import { pathsFor } from '../../knowledge/index.js'
import { PATHS_PATH, guidedPathPath } from '../../kb/paths.js'
import RouterLink from '../../ui/RouterLink.vue'

// "Part of guided paths" on an entity page: every path that visits the entity, each
// linking back to the step where it appears, with the reason the path gives for it.
const props = defineProps({ id: { type: String, required: true } })
const found = computed(() => pathsFor(props.id))
</script>

<template lang="pug">
section.stack(v-if="found.length" aria-labelledby="guided-paths-heading")
  h2#guided-paths-heading Part of guided paths
  p.muted Guided paths are short reading routes through the knowledge base. This entry appears in {{ found.length === 1 ? 'one' : found.length }}.
  ul.plain-list.stack.stack--tight
    li.stack.stack--tight(v-for="item in found" :key="item.id")
      p
        RouterLink(:to="guidedPathPath(item.id, item.position)") {{ item.title }}, step {{ item.position }} of {{ item.length }}
      p.muted {{ item.why }}
  p
    RouterLink(:to="PATHS_PATH") All guided paths
</template>
