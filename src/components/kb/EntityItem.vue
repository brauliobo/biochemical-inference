<script setup vapor>
import { computed } from 'vue'
import { getEntity } from '../../knowledge/index.js'
import ClaimStatusBadge from './ClaimStatusBadge.vue'
import EntityLink from './EntityLink.vue'
import EvidenceBadge from './EvidenceBadge.vue'
import TypeBadge from './TypeBadge.vue'
import VerifiedBadge from './VerifiedBadge.vue'

// One row in any list of entities: link, type badge, then whatever the item
// carries (note, claim status, equation, citation, summary). Used by relation
// groups, listings, search results and "see also", so they all look alike.
// Claims always show their status and articles whether they are verified.
const props = defineProps({
  item: { type: Object, required: true },
  showType: { type: Boolean, default: true },
  showEvidence: { type: Boolean, default: false },
  showSummary: { type: Boolean, default: false }
})
const entity = computed(() => getEntity(props.item.id))
const status = computed(() => props.item.status ?? (props.item.type === 'claim' ? entity.value?.status : undefined))
const verified = computed(() => props.item.verified ?? (props.item.type === 'article' ? entity.value?.verified : undefined))
</script>

<template lang="pug">
.stack.stack--tight
  .cluster
    EntityLink(:id="item.id" :label="item.name")
    TypeBadge(v-if="showType" :type="item.type")
    EvidenceBadge(v-if="showEvidence && item.evidence" :grade="item.evidence")
    ClaimStatusBadge(v-if="status" :status="status")
    VerifiedBadge(v-if="verified !== undefined" :verified="verified")
  p.muted(v-if="item.note") {{ item.note }}
  p.muted(v-if="item.equation") {{ item.equation }}
  p.muted(v-if="item.citation") {{ item.citation }}
  p.muted(v-if="showSummary && (item.detail || item.summary)") {{ item.detail || item.summary }}
</template>
