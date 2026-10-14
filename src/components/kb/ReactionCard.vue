<script setup vapor>
import { entityPath } from '../../kb/paths.js'
import RouterLink from '../../ui/RouterLink.vue'
import Card from '../../ui/Card.vue'
import GradeDot from './GradeDot.vue'
import ReactionGraphic from './ReactionGraphic.vue'

// A reaction as a card: its name (a link to the reaction page), the equation graphic with enzymes and
// arrow, the pathways it belongs to and its evidence grade. `model` comes from reactionModel().
defineProps({ model: { type: Object, required: true } })
</script>

<template lang="pug">
Card.reaction-card.stack.stack--tight
  .repel
    RouterLink(:to="entityPath(model.id)")
      strong {{ model.name }}
    GradeDot(:grade="model.evidence" bare)
  ReactionGraphic(:model="model")
  .cluster.cluster--tight(v-if="model.pathways.length")
    span.muted In
    template(v-for="pathway in model.pathways" :key="pathway.id")
      RouterLink.chip(:to="entityPath(pathway.id)") {{ pathway.name }}
</template>
