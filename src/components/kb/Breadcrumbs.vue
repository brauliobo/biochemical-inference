<script setup vapor>
import { computed } from 'vue'
import { KB_PATH, typePath } from '../../kb/paths.js'
import RouterLink from '../../ui/RouterLink.vue'

// Breadcrumb trail from a page model's `breadcrumbs`: Home > Knowledge base >
// Compounds > Glycine. The last item is the current page and is not a link.
const props = defineProps({ crumbs: { type: Array, required: true } })

const items = computed(() => {
  const trail = props.crumbs.map((crumb) => ({
    label: crumb.label,
    to: crumb.kind === 'home' ? '/' : crumb.kind === 'hub' ? typePath(crumb.type) : null
  }))
  trail.splice(1, 0, { label: 'Knowledge base', to: KB_PATH })
  trail[trail.length - 1].to = null
  return trail
})
</script>

<template lang="pug">
nav(aria-label="Breadcrumb")
  ol.breadcrumbs
    li(v-for="(item, index) in items" :key="index")
      RouterLink(v-if="item.to" :to="item.to") {{ item.label }}
      span(v-else aria-current="page") {{ item.label }}
</template>
