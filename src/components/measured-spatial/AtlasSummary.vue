<script setup vapor>
import { computed } from 'vue'
import Card from '../../ui/Card.vue'
import DataTable from '../../ui/DataTable.vue'
import Panel from '../../ui/Panel.vue'
import { dims } from '../../ui/format.js'

// What the verified release says about the specimen, the liver segmentation and
// the coordinate limits, with the semantic inventory of every array.
const props = defineProps({ records: { type: Object, required: true } })

const arrays = computed(() => props.records.arrays)
const acquisition = computed(() => props.records.acquisitions[0])
const space = computed(() => props.records.spaces[0])
const liverVoxels = computed(() => arrays.value.find((item) => item.id === 'liver-mask:0')?.liver_voxels.toLocaleString())
const bounds = (box) => (box ? `${box[0].join(', ')} through ${box[1].join(', ')}` : 'not present')
</script>

<template lang="pug">
.stack
  .grid(data-testid="measured-spatial-summary")
    Card(flat)
      p.eyebrow specimen
      p
        strong {{ acquisition.subject.species }}
      p.muted One {{ acquisition.subject.mass_g }} g {{ acquisition.subject.sex }} {{ acquisition.subject.strain }} mouse · {{ acquisition.subject.state }} · {{ acquisition.modalities_used_to_create_atlas.join(' + ') }} derived
    Card(flat)
      p.eyebrow liver segmentation
      p
        strong label 18 · UBERON:0002107
      p.muted {{ liverVoxels }} level-0 voxels; exact equality mask with no smoothing or morphology.
    Card(flat)
      p.eyebrow coordinate limits
      p
        strong ZYX byte order only
      p.muted Axis polarity {{ space.axis_polarity }} · physical origin {{ space.physical_origin }} · registration uncertainty unreported.

  Panel(title="Shapes, levels, spacing, and liver bounds" title-id="atlas-arrays-title" eyebrow="Semantic array inventory" :level="3" flat)
    p.muted uint8 · C-order ZYX · fixed gzip 9
    DataTable(caption="All four independently pinned array identities" :columns="['Array / level', 'Shape ZYX', 'Spacing', 'Liver voxels', 'Inclusive bounds XYZ']")
      tr(v-for="array in arrays" :key="array.id")
        th(scope="row")
          strong {{ array.kind }}
          code.digest {{ array.id }}
        td {{ dims(array.shape_zyx) }}
        td {{ dims(array.spacing_um) }} µm
        td {{ array.liver_voxels.toLocaleString() }}
        td {{ bounds(array.liver_bounds_xyz) }}
</template>
