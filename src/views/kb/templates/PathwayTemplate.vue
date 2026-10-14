<script setup vapor>
import { computed } from 'vue'
import CausalMini from '../../../components/kb/CausalMini.vue'
import ConditionChips from '../../../components/kb/ConditionChips.vue'
import EntityHeader from '../../../components/kb/EntityHeader.vue'
import EvidenceStrip from '../../../components/kb/EvidenceStrip.vue'
import NeighbourhoodMap from '../../../components/kb/NeighbourhoodMap.vue'
import EntityLink from '../../../components/kb/EntityLink.vue'
import NotesDrawer from '../../../components/kb/NotesDrawer.vue'
import ReactionTable from '../../../components/kb/ReactionTable.vue'
import Panel from '../../../ui/Panel.vue'
import { conditionsFor } from '../../../kb/causal-view.js'
import { pathwayModel } from '../../../kb/entity-model.js'

// A pathway: its member reactions on the hand-laid metabolic map (or as a small layered network when no
// map places them), the same reactions as a compact table with enzymes, and the states and diseases linked
// to it. Prose is collapsed under "Notes & sources".
const props = defineProps({ model: { type: Object, required: true } })

const members = computed(() => pathwayModel(props.model.id))
const conditions = computed(() => conditionsFor(props.model.id))
</script>

<template lang="pug">
.stack.stack--loose(data-testid="entity-visuals" data-template="pathway")
  EntityHeader(:model="model")
  EvidenceStrip(:model="model")
  NeighbourhoodMap(:entity-id="model.id" kind="pathway" title="The pathway on the metabolic map")
  Panel(v-if="members.reactions.length" title="Member reactions" data-visual="reaction-table")
    ReactionTable(:rows="members.reactions" caption="Reactions in this pathway")
  Panel(v-if="members.enzymes.length || members.compounds.length" title="Enzymes and compounds" data-visual="chips")
    .stack.stack--tight
      .cluster(v-if="members.enzymes.length")
        strong.chip-group__label Enzymes
        ul.chip-list(aria-label="Enzymes in this pathway")
          li(v-for="enzyme in members.enzymes" :key="enzyme.id")
            EntityLink.chip(:id="enzyme.id" :label="enzyme.name")
      .cluster(v-if="members.compounds.length")
        strong.chip-group__label Compounds
        ul.chip-list(aria-label="Compounds in this pathway")
          li(v-for="compound in members.compounds" :key="compound.id")
            EntityLink.chip(:id="compound.id" :label="compound.name")
  CausalMini(:entity-id="model.id" title="Linked states and effects")
  ConditionChips(:groups="conditions")
  NotesDrawer(:model="model")
</template>
