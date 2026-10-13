<script setup vapor>
import EntityLink from './EntityLink.vue'
import FactsTable from './FactsTable.vue'

// A reaction: reactants -> products with stoichiometry, every participant a link,
// then the enzymes that catalyse it, direction, compartment and database ids.
// `reaction` is the `reaction` section of a page model.
defineProps({ reaction: { type: Object, required: true } })
</script>

<template lang="pug">
.stack
  p.equation.cluster
    template(v-for="(part, index) in reaction.reactants" :key="part.id")
      span(v-if="index > 0") +
      span
        template(v-if="part.n !== 1") {{ part.n + ' ' }}
        EntityLink(:id="part.id" :label="part.name")
    span(aria-hidden="true") {{ reaction.reversible ? '⇌' : '→' }}
    span.visually-hidden {{ reaction.reversible ? 'is in equilibrium with' : 'is converted to' }}
    template(v-for="(part, index) in reaction.products" :key="part.id")
      span(v-if="index > 0") +
      span
        template(v-if="part.n !== 1") {{ part.n + ' ' }}
        EntityLink(:id="part.id" :label="part.name")
  dl.stack.stack--tight
    div(v-if="reaction.enzymes.length")
      dt Catalysed by
      dd
        template(v-for="(enzyme, index) in reaction.enzymes" :key="enzyme.id")
          template(v-if="index > 0") {{ ', ' }}
          EntityLink(:id="enzyme.id" :label="enzyme.name")
    div
      dt Direction
      dd {{ reaction.reversible ? 'Reversible: can run in either direction.' : 'Treated as one-way in this knowledge base.' }}
    div(v-if="reaction.compartment")
      dt Compartment
      dd {{ reaction.compartment }}
  FactsTable(:facts="reaction.identifiers" caption="Reaction identifiers")
</template>
