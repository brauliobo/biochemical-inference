<script setup vapor>
import { computed } from 'vue'
import Facts from '../../ui/Facts.vue'
import Panel from '../../ui/Panel.vue'
import SelectField from '../../ui/SelectField.vue'

// Choose an array, level and Z slab (descriptors only), then request exactly
// one chunk. No chunk is preloaded and nothing falls back to another level.
const props = defineProps({
  inventory: { type: Array, required: true },
  selectedChunk: { type: Object, default: undefined },
  busy: { type: Boolean, required: true }
})
const arrayId = defineModel('arrayId', { type: String, required: true })
const level = defineModel('level', { type: Number, required: true })
const zGrid = defineModel('zGrid', { type: Number, required: true })
const emit = defineEmits(['request'])

const ARRAYS = [{ value: 'liver-mask', label: 'Liver binary mask' }, { value: 'anatomy-labels', label: 'Anatomical labels' }]
const LEVELS = [{ value: 0, label: '0 · 100 µm' }, { value: 1, label: '1 · 200 µm' }]
const planes = computed(() => [...new Set(props.inventory.map((item) => item.grid_zyx[0]))].map((value) => ({ value, label: `${value} · origin ${value * 32}` })))
const visible = computed(() => props.inventory.filter((item) => item.grid_zyx[0] === zGrid.value).sort((left, right) => left.grid_zyx[1] - right.grid_zyx[1] || left.grid_zyx[2] - right.grid_zyx[2]))
const columns = computed(() => Math.max(1, ...visible.value.map((item) => item.grid_zyx[2] + 1)))
const verified = computed(() => [
  { label: 'Cache source', value: props.selectedChunk.cacheSource },
  { label: 'Voxel origin ZYX', value: props.selectedChunk.descriptor.voxel_origin_zyx.join(', ') },
  { label: 'Valid voxel shape', value: props.selectedChunk.descriptor.voxel_shape_zyx.join(' × ') },
  { label: 'Encoded / decoded', value: `${props.selectedChunk.encodedBytes} / ${props.selectedChunk.decodedBytes} bytes` }
])
</script>

<template lang="pug">
Panel(title="Request one selected chunk" title-id="chunk-browser-title" eyebrow="Manifest-owned viewport" :level="3" flat)
  p.muted {{ inventory.length }} descriptors · 0 bytes fetched by selection controls
  p Changing array, level, or Z slab loads descriptors only. A chunk button requests exactly that coordinate; failures stay visible and no level-of-detail fallback is permitted.
  .grid
    SelectField(id="chunk-array" label="Array" v-model="arrayId" :options="ARRAYS" :disabled="busy")
    SelectField(id="chunk-level" label="Exact level" v-model="level" :options="LEVELS" :disabled="busy")
    SelectField(id="chunk-slab" label="Z chunk slab" v-model="zGrid" :options="planes" :disabled="busy")
  .sidebar.sidebar--end
    .grid.grid--fixed(role="group" :aria-label="`${arrayId} level ${level}, Z chunk ${zGrid}`" :style="{ '--grid-columns': columns }" data-testid="measured-spatial-chunk-map")
      button.tile(v-for="chunk in visible" :key="chunk.path" type="button" :disabled="busy" :aria-label="`Request Y ${chunk.grid_zyx[1]}, X ${chunk.grid_zyx[2]}`" :aria-pressed="selectedChunk?.descriptor.path === chunk.path" @click="emit('request', chunk)")
        span Y{{ chunk.grid_zyx[1] }} · X{{ chunk.grid_zyx[2] }}
        small.muted {{ chunk.encoded_bytes }} B
    .card.card--flat.stack.stack--tight(role="status")
      template(v-if="selectedChunk")
        p
          strong Encoded and decoded verification passed
        p
          code {{ selectedChunk.descriptor.path }}
        Facts(:items="verified")
        p.muted The verified bytes are not transformed into an invented image orientation.
      p(v-else) Select a manifest-owned cell. No chunk is preloaded and no synthetic preview is available.
</template>
