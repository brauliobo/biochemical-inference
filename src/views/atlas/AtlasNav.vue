<script setup vapor>
import { atlasPath } from '../../kb/paths.js'
import RouterLink from '../../ui/RouterLink.vue'

// The four views of the atlas: the kind-by-kind relation matrix, the causal map, the metabolic network and search.
const SECTIONS = [
  { to: atlasPath(), label: 'Overview' },
  { to: atlasPath('causal'), label: 'Causal map' },
  { to: atlasPath('network'), label: 'Metabolic network' },
  { to: atlasPath('search'), label: 'Search' }
]
</script>

<template lang="pug">
nav.atlas-nav(aria-label="Atlas views")
  ul
    li(v-for="item in SECTIONS" :key="item.to")
      RouterLink(:to="item.to") {{ item.label }}
</template>
