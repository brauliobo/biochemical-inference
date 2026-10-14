<script setup vapor>
import { computed } from 'vue'
import CausalMini from '../../../components/kb/CausalMini.vue'
import ConditionChips from '../../../components/kb/ConditionChips.vue'
import EntityHeader from '../../../components/kb/EntityHeader.vue'
import EntityLink from '../../../components/kb/EntityLink.vue'
import EvidenceStrip from '../../../components/kb/EvidenceStrip.vue'
import KineticsPanel from '../../../components/kb/KineticsPanel.vue'
import NeighbourhoodMap from '../../../components/kb/NeighbourhoodMap.vue'
import NotesDrawer from '../../../components/kb/NotesDrawer.vue'
import ReactionCard from '../../../components/kb/ReactionCard.vue'
import Panel from '../../../ui/Panel.vue'
import { conditionsFor } from '../../../kb/causal-view.js'
import { enzymeChips, reactionsOfEnzyme } from '../../../kb/entity-model.js'

// An enzyme: the reactions it catalyses as equation cards, its position on the metabolic map, a live
// Michaelis-Menten curve with sliders when a literature parameter set covers it, tissue and cofactor tags,
// and what it increases, decreases or relates to. Prose is collapsed under "Notes & sources".
const props = defineProps({ model: { type: Object, required: true } })

const reactions = computed(() => reactionsOfEnzyme(props.model.id))
const reactionIds = computed(() => reactions.value.map((reaction) => reaction.id))
const chips = computed(() => enzymeChips(props.model.id))
const conditions = computed(() => conditionsFor(props.model.id))
const hasTags = computed(() => chips.value.tissues.length || chips.value.cofactors.length || chips.value.cofactorText.length || chips.value.compartment || chips.value.gene || chips.value.ec)
</script>

<template lang="pug">
.stack.stack--loose(data-testid="entity-visuals" data-template="enzyme")
  EntityHeader(:model="model")
  EvidenceStrip(:model="model")
  Panel(v-if="hasTags" title="At a glance" data-visual="chips")
    .stack.stack--tight
      .cluster(v-if="chips.gene || chips.ec || chips.uniprot")
        strong.chip-group__label Identity
        ul.chip-list(aria-label="Identity")
          li(v-if="chips.gene")
            span.badge {{ `Gene ${chips.gene}` }}
          li(v-if="chips.ec")
            span.badge {{ `EC ${chips.ec}` }}
          li(v-if="chips.uniprot")
            span.badge {{ `UniProt ${chips.uniprot}` }}
      .cluster(v-if="chips.compartment || chips.tissues.length")
        strong.chip-group__label Where
        ul.chip-list(aria-label="Where it works")
          li(v-if="chips.compartment")
            span.badge {{ chips.compartment }}
          li(v-for="tissue in chips.tissues" :key="tissue")
            span.badge {{ tissue }}
      .cluster(v-if="chips.cofactors.length || chips.cofactorText.length")
        strong.chip-group__label Cofactors
        ul.chip-list(aria-label="Cofactors")
          li(v-for="cofactor in chips.cofactors" :key="cofactor.id")
            EntityLink.chip(:id="cofactor.id" :label="cofactor.name")
          li(v-for="text in chips.cofactorText" :key="text")
            span.badge {{ text }}
  Panel(v-if="reactions.length" title="Reactions it catalyses" data-visual="reaction-cards")
    .grid.grid--wide
      ReactionCard(v-for="reaction in reactions" :key="reaction.id" :model="reaction")
  NeighbourhoodMap(:entity-id="model.id" kind="enzyme" title="Position in the pathway")
  KineticsPanel(:enzyme-ids="[model.id]" :reaction-ids="reactionIds" :name="model.name")
  CausalMini(:entity-id="model.id" title="What it changes and what changes it" :depth="1" :limit="14")
  ConditionChips(:groups="conditions")
  NotesDrawer(:model="model")
</template>
