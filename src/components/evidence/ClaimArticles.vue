<script setup vapor>
import { computed } from 'vue'
import { STANCE_LOOK } from '../../kb/evidence.js'
import { entityPath } from '../../kb/paths.js'
import { href } from '../../router.js'
import Badge from '../../ui/Badge.vue'
import EmptyState from '../../ui/EmptyState.vue'
import RouterLink from '../../ui/RouterLink.vue'
import Timeline from '../../viz/Timeline.vue'
import DesignIcon from './DesignIcon.vue'
import MarkIcon from './MarkIcon.vue'

// The articles for and against one claim: a two-lane timeline (supports is a blue circle,
// contradicts a vermillion square) and a compact list under it, one line per article.
// `claim` is an entry of the evidence model.
const props = defineProps({
  claim: { type: Object, required: true },
  id: { type: String, default: 'ev-claim-articles' }
})

const rows = computed(() => [
  ...props.claim.supporting.map((article) => ({ article, stance: 'supports' })),
  ...props.claim.contradicting.map((article) => ({ article, stance: 'contradicts' }))
].sort((a, b) => (a.stance === b.stance ? b.article.year - a.article.year : a.stance === 'supports' ? -1 : 1)))
const items = computed(() => rows.value.map(({ article, stance }) => ({ id: article.id, title: article.name, year: article.year, group: stance, detail: `${article.designLabel}, ${article.byline}`, href: href(entityPath(article.id)) })))
const groups = computed(() => [
  ...(props.claim.nFor ? [{ id: 'supports', label: 'Supports', look: STANCE_LOOK.supports }] : []),
  ...(props.claim.nAgainst ? [{ id: 'contradicts', label: 'Contradicts', look: STANCE_LOOK.contradicts }] : [])
])
</script>

<template lang="pug">
EmptyState(v-if="!rows.length" title="No article recorded") Nothing in the knowledge base supports or contradicts this claim yet. Treat it as unchecked.
.stack(v-else)
  Timeline(:id="id" title="Articles for and against, by year" :items="items" :groups="groups")
  ul.plain-list.stack.stack--tight
    li.cluster(v-for="row in rows" :key="row.article.id")
      span.ev-stance
        MarkIcon(:look="STANCE_LOOK[row.stance]")
        Badge(:label="row.stance === 'supports' ? 'Supports' : 'Contradicts'" :tone="row.stance === 'supports' ? 'success' : 'danger'")
      DesignIcon(:design="row.article.design" short)
      span.ev-num {{ row.article.year }}
      RouterLink(:to="entityPath(row.article.id)") {{ row.article.name }}
</template>
