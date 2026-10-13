<script setup vapor>
import { computed } from 'vue'
import EntityLink from './EntityLink.vue'

// Body paragraphs from the page model: segments are plain text or entity links.
// Everything is rendered as text nodes and router links (never as HTML), and the
// number of paragraphs is capped as a guard against runaway data.
const MAX_PARAGRAPHS = 60
const props = defineProps({ paragraphs: { type: Array, required: true } })
const shown = computed(() => props.paragraphs.slice(0, MAX_PARAGRAPHS))
</script>

<template lang="pug">
.prose
  p(v-for="(paragraph, index) in shown" :key="index")
    template(v-for="(segment, position) in paragraph" :key="position")
      EntityLink(v-if="segment.link" :id="segment.link.id" :label="segment.link.label")
      template(v-else) {{ segment.text }}
</template>
