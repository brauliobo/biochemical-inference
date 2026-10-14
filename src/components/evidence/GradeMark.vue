<script setup vapor>
import { computed } from 'vue'
import { gradeStyle } from '../../viz/shapes.js'

// The evidence grade as one letter in a ring (E, P, S, C), with the word for assistive technology.
// Same letters and colours as the badges in the causal graph.
const props = defineProps({ grade: { type: String, required: true } })
const style = computed(() => gradeStyle(props.grade))
</script>

<template lang="pug">
span.ev-grade(:class="style.cls")
  span(aria-hidden="true") {{ style.letter }}
  span.visually-hidden {{ style.label }}
</template>
