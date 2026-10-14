<script setup vapor>
import { computed } from 'vue'
import BalanceIndicator from '../../../components/kb/BalanceIndicator.vue'
import EntityHeader from '../../../components/kb/EntityHeader.vue'
import EvidenceStrip from '../../../components/kb/EvidenceStrip.vue'
import KineticsPanel from '../../../components/kb/KineticsPanel.vue'
import NeighbourhoodMap from '../../../components/kb/NeighbourhoodMap.vue'
import NotesDrawer from '../../../components/kb/NotesDrawer.vue'
import ReactionGraphic from '../../../components/kb/ReactionGraphic.vue'
import Panel from '../../../ui/Panel.vue'
import RouterLink from '../../../ui/RouterLink.vue'
import { reactionModel } from '../../../kb/entity-model.js'
import { entityPath } from '../../../kb/paths.js'

// A reaction: the equation as a large graphic (boxes with stoichiometric coefficients, the enzyme above the
// arrow, the compartment below), whether it balances, the pathway context on the metabolic map and the rate
// curve when kinetic constants are available. Prose and identifiers sit in "Notes & sources".
const props = defineProps({ model: { type: Object, required: true } })

const reaction = computed(() => reactionModel(props.model.id))
const enzymeIds = computed(() => reaction.value?.enzymes.map((enzyme) => enzyme.id) ?? [])
const identifiers = computed(() => props.model.reaction?.identifiers ?? [])
const identifierKeys = computed(() => identifiers.value.map((fact) => fact.key))
</script>

<template lang="pug">
.stack.stack--loose(data-testid="entity-visuals" data-template="reaction")
  EntityHeader(:model="model")
  EvidenceStrip(:model="model")
  Panel(v-if="reaction" title="The reaction" data-visual="equation" data-testid="reaction-equation")
    ReactionGraphic(:model="reaction")
    .cluster(v-if="reaction.pathways.length")
      span.muted Pathways
      ul.chip-list(aria-label="Pathways")
        li(v-for="pathway in reaction.pathways" :key="pathway.id")
          RouterLink.chip(:to="entityPath(pathway.id)") {{ pathway.name }}
    .cluster(v-if="identifiers.length")
      span.muted Identifiers
      ul.chip-list(aria-label="Database identifiers")
        li(v-for="fact in identifiers" :key="fact.key")
          a.chip(v-if="fact.url" :href="fact.url" rel="noopener noreferrer") {{ `${fact.label}: ${fact.value}` }}
          span.badge(v-else) {{ `${fact.label}: ${fact.value}` }}
    BalanceIndicator(:balance="reaction.balance")
  NeighbourhoodMap(:entity-id="model.id" kind="reaction" title="Pathway context")
  KineticsPanel(:enzyme-ids="enzymeIds" :reaction-ids="[model.id]" :name="model.name")
  NotesDrawer(:model="model" :hide-facts="identifierKeys")
</template>
