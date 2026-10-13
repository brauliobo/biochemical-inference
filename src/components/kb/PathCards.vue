<script setup vapor>
import { guidedPathPath } from '../../kb/paths.js'
import { plural } from '../../ui/format.js'
import Card from '../../ui/Card.vue'
import RouterLink from '../../ui/RouterLink.vue'

// The guided paths as a grid of cards: title (a link to the first step), summary and
// step count. `paths` is pathList() or PATH_CARDS. `level` is the heading level of each
// title (2 on a page of its own, 3 under a section heading).
defineProps({
  paths: { type: Array, required: true },
  level: { type: Number, default: 3 }
})
</script>

<template lang="pug">
ul.grid.plain-list
  li(v-for="item in paths" :key="item.id")
    Card
      h2(v-if="level === 2")
        RouterLink(:to="guidedPathPath(item.id)") {{ item.title }}
      h3(v-else)
        RouterLink(:to="guidedPathPath(item.id)") {{ item.title }}
      p {{ item.summary }}
      p.muted {{ plural(item.length, 'step') }}
</template>
