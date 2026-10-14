<script setup vapor>
import { entityPath } from '../../kb/paths.js'
import RouterLink from '../../ui/RouterLink.vue'
import EntityLink from './EntityLink.vue'

// A reaction drawn as an equation: each participant a box (a link to its page) with its stoichiometric
// coefficient, an arrow (double-headed when reversible) with the catalysing enzymes above it and the
// compartment below. `model` comes from kb/entity-model.js reactionModel(). The text equation is the
// accessible name of the group.
defineProps({
  model: { type: Object, required: true },
  compact: { type: Boolean, default: false }
})
</script>

<template lang="pug">
.equation-graphic(role="group" :aria-label="`Reaction: ${model.text}`" :class="{ 'equation-graphic--compact': compact }")
  template(v-for="(part, index) in model.reactants" :key="part.id")
    span.equation-graphic__plus(v-if="index > 0" aria-hidden="true") +
    RouterLink.species(:to="entityPath(part.id)" :title="part.name")
      span.species__n(v-if="part.n !== 1") {{ part.n }}
      span.species__name {{ part.label }}
  .equation-graphic__arrow
    span.equation-graphic__enzymes
      template(v-for="enzyme in model.enzymes" :key="enzyme.id")
        EntityLink(:id="enzyme.id" :label="enzyme.label")
      span.muted(v-if="!model.enzymes.length") no enzyme named
    svg.equation-graphic__svg(viewBox="0 0 80 14" aria-hidden="true" focusable="false")
      path(d="M2 7H78" fill="none" stroke="currentColor" stroke-width="2")
      path(d="M70 2L78 7L70 12" fill="none" stroke="currentColor" stroke-width="2")
      path(v-if="model.reversible" d="M10 2L2 7L10 12" fill="none" stroke="currentColor" stroke-width="2")
    span.visually-hidden {{ model.reversible ? 'in equilibrium with' : 'is converted to' }}
    span.muted.equation-graphic__note(v-if="!compact && model.compartment") {{ model.compartment }}
  template(v-for="(part, index) in model.products" :key="part.id")
    span.equation-graphic__plus(v-if="index > 0" aria-hidden="true") +
    RouterLink.species(:to="entityPath(part.id)" :title="part.name")
      span.species__n(v-if="part.n !== 1") {{ part.n }}
      span.species__name {{ part.label }}
</template>
