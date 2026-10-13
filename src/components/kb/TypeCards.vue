<script setup vapor>
import { typePath } from '../../kb/paths.js'
import RouterLink from '../../ui/RouterLink.vue'

// One card per entity type with its description and entry count. `types` comes
// from homeModel().types.
defineProps({ types: { type: Array, required: true } })
</script>

<template lang="pug">
ul.grid.plain-list
  li(v-for="type in types" :key="type.type")
    RouterLink.card.stack.stack--tight(:to="typePath(type.type)")
      h3 {{ type.plural }}
      p.muted {{ type.description }}
      p
        strong {{ type.count }}
        |  {{ type.count === 1 ? 'entry' : 'entries' }}
</template>
