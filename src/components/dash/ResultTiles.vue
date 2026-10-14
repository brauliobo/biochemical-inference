<script setup vapor>
import { computed } from 'vue'

// Headline numbers as tiles: a label, the value with its unit, how far it moved from the reference
// (with an arrow, so direction is not colour alone) and a short note.
//
//   ResultTiles(label="Results" :tiles="[{ id: 'ratio', label: 'SAM:SAH', value: '5.9', unit: 'ratio', delta: '-5.0%', tone: 'warning', note: 'at hour 9' }]")
//
// tone: 'good' | 'warning' | 'bad' | 'info' | '' (none). `delta` is text; a leading minus sign or "+" sets the arrow.
const props = defineProps({
  tiles: { type: Array, required: true },
  label: { type: String, default: 'Headline results' }
})
const rows = computed(() => props.tiles.map((tile) => {
  const delta = tile.delta ?? ''
  const arrow = /^[-−]/.test(delta) ? '▼' : /^\+/.test(delta) ? '▲' : delta ? '●' : ''
  return { ...tile, arrow, key: tile.id ?? tile.label }
}))
</script>

<template lang="pug">
ul.dash-tiles(:aria-label="label")
  li.dash-tile(v-for="tile in rows" :key="tile.key" :class="tile.tone ? `dash-tile--${tile.tone}` : ''" :data-testid="`tile-${tile.key}`")
    span.dash-tile__label {{ tile.label }}
    span.dash-tile__value
      | {{ tile.value }}
      small(v-if="tile.unit")  {{ ` ${tile.unit}` }}
    span.dash-tile__delta(v-if="tile.delta")
      span(aria-hidden="true") {{ tile.arrow }}
      |  {{ ` ${tile.delta}` }}
    span.dash-tile__note(v-if="tile.note") {{ tile.note }}
</template>
