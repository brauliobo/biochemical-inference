<script setup vapor>
import { computed } from 'vue'
import CausalMini from '../../../components/kb/CausalMini.vue'
import ConditionChips from '../../../components/kb/ConditionChips.vue'
import DoseBars from '../../../components/kb/DoseBars.vue'
import EntityHeader from '../../../components/kb/EntityHeader.vue'
import EvidenceStrip from '../../../components/kb/EvidenceStrip.vue'
import NeighbourhoodMap from '../../../components/kb/NeighbourhoodMap.vue'
import NotesDrawer from '../../../components/kb/NotesDrawer.vue'
import QuantChips from '../../../components/kb/QuantChips.vue'
import ReactionTable from '../../../components/kb/ReactionTable.vue'
import Panel from '../../../ui/Panel.vue'
import { conditionsFor } from '../../../kb/causal-view.js'
import { reactionsOfCompound } from '../../../kb/entity-model.js'
import { chipsFor, limitRows } from '../../../kb/quantities.js'

// A compound: where it sits in metabolism (its producing and consuming reactions lit up on the hand-laid
// map), its intake limits against the reference bodies, the key numbers (molar mass, content, ranges), what it
// increases, decreases, aggravates or mitigates, and the states and diseases it relates to. Prose is in the
// collapsed "Notes & sources" at the bottom.
const props = defineProps({ model: { type: Object, required: true } })

const KEY_KINDS = ['molar-mass', 'content-fraction', 'pKa', 'ph', 'reference-range', 'threshold', 'concentration', 'flux', 'flux-share', 'pool', 'typical-dose', 'trial-dose', 'approved-dose']
const limits = computed(() => limitRows(props.model.id))
const chips = computed(() => chipsFor(props.model.id, { kinds: KEY_KINDS, limit: 14 }))
const reactions = computed(() => reactionsOfCompound(props.model.id))
const conditions = computed(() => conditionsFor(props.model.id))
</script>

<template lang="pug">
.stack.stack--loose(data-testid="entity-visuals" data-template="compound")
  EntityHeader(:model="model")
  EvidenceStrip(:model="model")
  NeighbourhoodMap(:entity-id="model.id" kind="compound")
  DoseBars(:data="limits" title="Intake against reference values" chart-title="Intake limits by authority" lede="Adequate intakes (AI), recommended allowances and upper limits (UL) for adults. Where a body set no upper limit, the row says so.")
  Panel(v-if="chips.length" title="Key numbers" lede="Open a number to see its source, basis and population." data-visual="quantity-chips")
    QuantChips(:chips="chips" label="Key numbers")
  CausalMini(:entity-id="model.id" title="What it changes and what changes it" :depth="1" :limit="14")
  ConditionChips(:groups="conditions")
  Panel(v-if="reactions.length" title="Reactions" data-visual="reaction-table")
    ReactionTable(:rows="reactions" caption="Reactions that consume or produce this compound" show-role)
  NotesDrawer(:model="model")
</template>
