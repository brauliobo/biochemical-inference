<script setup vapor>
import { computed, defineVaporAsyncComponent } from 'vue'
import LiveMessage from '../../ui/LiveMessage.vue'
import Panel from '../../ui/Panel.vue'

// Section 03: the modelled topology as a 3D view (optional) and, always, as a
// list of buttons that select one entity or reaction.
const props = defineProps({
  model: { type: Object, required: true },
  network: { type: Object, default: undefined },
  result: { type: Object, default: undefined },
  selectedId: { type: String, required: true }
})
const emit = defineEmits(['select'])

const NetworkView = defineVaporAsyncComponent(() => import('../NetworkView.vue'))

const nodes = computed(() => [
  ...props.model.topology.entities.map((entity) => ({ id: entity.id, name: entity.name, kind: `${entity.kind} ${entity.stateVariable ? 'state' : 'entity'}` })),
  ...props.model.topology.reactions.map((reaction) => ({ id: reaction.id, name: reaction.name, kind: `${reaction.kind} reaction` }))
])
</script>

<template lang="pug">
Panel(title="Modeled one-carbon topology" title-id="network-title" eyebrow="03 · Inspect")
  template(#actions)
    span.muted {{ model.topology.entities.length }} entities · {{ model.topology.reactions.length }} reactions
  NetworkView(v-if="network" :model="model" :network="network" :result="result" :selected-id="selectedId" @select="emit('select', $event)")
  LiveMessage(v-else visible text="Loading taxon-specific evidence; the previous network is hidden.")
  section.stack.stack--tight(aria-labelledby="topology-list-title")
    h3#topology-list-title Inspectable simulation topology
    p Every entity and directed reaction below participates in the equations. Curated mappings link to knowledge evidence; model-only and boundary terms are explicit assumptions.
    ul.grid.grid--compact.plain-list(aria-label="Modeled topology entities")
      li(v-for="node in nodes" :key="node.id")
        button.tile(type="button" :aria-pressed="selectedId === node.id" @click="emit('select', node.id)")
          span.eyebrow {{ node.kind }}
          strong {{ node.name }}
          code {{ node.id }}
</template>
