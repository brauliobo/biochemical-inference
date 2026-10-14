<script setup vapor>
import { computed } from 'vue'
import RouterLink from '../../ui/RouterLink.vue'

// Links from one of these dashboards to its neighbours, the evidence dashboards and the guided path.
const props = defineProps({ current: { type: String, required: true } })
const PAGES = [
  { id: 'gut-acid', to: '/dash/gut-acid', label: 'Gut, acid and belching' },
  { id: 'histamine-night', to: '/dash/histamine-night', label: 'Histamine and night waking' },
  { id: 'b6-gaba', to: '/dash/b6-gaba', label: 'Vitamin B6 and GABA' },
  { id: 'bile-acids', to: '/dash/bile-acids', label: 'Bile acids: glycine or taurine' },
  { id: 'tma-tmao', to: '/dash/tma-tmao', label: 'Choline, TMA and TMAO' }
]
const others = computed(() => PAGES.filter((page) => page.id !== props.current))
</script>

<template lang="pug">
nav.stack.stack--tight(aria-label="Related dashboards")
  strong Related
  ul.cluster.plain-list
    li(v-for="page in others" :key="page.id")
      RouterLink.button.button--secondary(:to="page.to") {{ page.label }}
    li
      RouterLink.button.button--secondary(to="/evidence") Evidence dashboards
    li
      RouterLink.button.button--secondary(to="/kb/paths/glycine-belching-question") Guided path: glycine and belching
</template>
