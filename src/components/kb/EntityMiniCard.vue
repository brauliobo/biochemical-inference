<script setup vapor>
import { computed } from 'vue'
import { getEntity } from '../../knowledge/index.js'
import { entityPath } from '../../kb/paths.js'
import { reactionModel } from '../../kb/entity-model.js'
import { topQuantities } from '../../kb/quantities.js'
import RouterLink from '../../ui/RouterLink.vue'
import EvidenceBadge from './EvidenceBadge.vue'
import QuantChips from './QuantChips.vue'
import ReactionGraphic from './ReactionGraphic.vue'
import TypeBadge from './TypeBadge.vue'

// The compact card beside a map or graph when a node is chosen: type and evidence, the name, a one-line
// summary, the top quantities (each opens to its provenance) and a link to the full page. A reaction
// also shows its equation and enzyme.
const props = defineProps({
  id: { type: String, required: true },
  heading: { type: String, default: '' }
})
const entity = computed(() => getEntity(props.id))
const reaction = computed(() => (entity.value?.type === 'reaction' ? reactionModel(props.id) : null))
const quantities = computed(() => topQuantities(props.id, 3))
</script>

<template lang="pug">
aside.card.card--flat.stack.stack--tight.mini-card(v-if="entity" :aria-label="`${entity.name}: summary`" data-testid="mini-card")
  .cluster
    TypeBadge(:type="entity.type")
    EvidenceBadge(:grade="entity.evidence")
  p
    strong {{ entity.name }}
  p.mini-card__summary.muted {{ entity.summary }}
  ReactionGraphic(v-if="reaction" :model="reaction" compact)
  QuantChips(:chips="quantities" label="Top quantities")
  p
    RouterLink.button.button--secondary(:to="entityPath(id)") {{ `Open page: ${entity.name}` }}
</template>
