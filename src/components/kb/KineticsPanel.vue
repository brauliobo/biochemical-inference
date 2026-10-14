<script setup vapor>
import { ref, shallowRef, watch } from 'vue'
import { curvesFor, loadParameters } from '../../kb/params.js'
import MichaelisMentenExplorer from './MichaelisMentenExplorer.vue'

// The Michaelis-Menten explorer for an enzyme or a reaction, once its parameters have loaded. The two
// parameter datasets are large and load lazily, so only enzyme and reaction pages pay for them. When no
// parameter set covers the entity the panel is not drawn at all (no empty chart frame).
//
//   KineticsPanel(:enzyme-ids="['enzyme:gnmt']" :reaction-ids="['reaction:gnmt-glycine-methylation']" name="GNMT")
const props = defineProps({
  enzymeIds: { type: Array, default: () => [] },
  reactionIds: { type: Array, default: () => [] },
  name: { type: String, default: 'this enzyme' }
})

const curves = shallowRef([])
const ready = ref(false)
let run = 0

async function load() {
  const mine = ++run
  ready.value = false
  curves.value = []
  const sets = await loadParameters()
  if (mine !== run) return
  curves.value = curvesFor(sets, { enzymeIds: props.enzymeIds, reactionIds: props.reactionIds })
  ready.value = true
}
watch(() => [props.enzymeIds.join(), props.reactionIds.join()], load, { immediate: true })
</script>

<template lang="pug">
MichaelisMentenExplorer(v-if="curves.length" :curves="curves" :name="name")
p.muted(v-else-if="!ready" role="status" data-loading="kinetics") Loading kinetic constants…
</template>
