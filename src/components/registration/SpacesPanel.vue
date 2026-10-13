<script setup vapor>
import DataTable from '../../ui/DataTable.vue'
import Panel from '../../ui/Panel.vue'

// The exact coordinate contract after prealignment: both spaces and all five
// release arrays with their shapes, spacings and index transforms.
defineProps({
  spaces: { type: Array, required: true },
  arrays: { type: Array, required: true }
})

const shape = (values) => values?.join(' × ') ?? 'unavailable'
</script>

<template lang="pug">
Panel(title="Exact post-prealignment coordinate contract" title-id="spaces-title" eyebrow="Directed spaces" :level="3")
  template(#actions)
    span.muted XYZ millimeters · 2 mm isotropic
  DataTable(caption="Source and target spaces and all five release arrays" :columns="['Identity', 'Role / modality', 'Shape', 'Spacing', 'Bound space / index transform']")
    tr(v-for="space in spaces" :key="space.id")
      th(scope="row")
        code {{ space.id }}
      td coordinate space · {{ space.modality }}
      td {{ shape(space.shape_xyz) }} XYZ
      td {{ shape(space.spacing_xyz) }} mm
      td XYZ index matrix declared
    tr(v-for="array in arrays" :key="array.id")
      th(scope="row")
        code {{ array.id }}
      td {{ array.kind }} · {{ array.modality }}
      td {{ shape(array.shape_zyx) }} ZYX
      td {{ shape(array.spacing_mm_zyx) }} mm
      td
        code {{ array.space_id }}
        p {{ array.index_axis_order.join('') }} → XYZ · translation {{ array.index_zyx_to_space_xyz_mm.slice(0, 3).map(row => row[3]).join(', ') }} mm
</template>
