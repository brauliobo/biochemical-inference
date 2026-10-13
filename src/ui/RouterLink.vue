<script setup vapor>
import { computed } from 'vue'
import { href, linkState, useRoute } from '../router.js'

// <RouterLink to="/kb">Knowledge base</RouterLink>
// A real <a href="#/kb">, so it is keyboard, middle-click and copy-link friendly.
// aria-current="page" marks the exact route; add `section` on navigation links
// to also mark them while on a descendant route (/kb/... under "/kb").
const props = defineProps({
  to: { type: String, required: true },
  section: { type: Boolean, default: false }
})
const route = useRoute()
const current = computed(() => linkState(route.path, props.to, props.section))
</script>

<template lang="pug">
a(:href="href(to)" :aria-current="current")
  slot
</template>
