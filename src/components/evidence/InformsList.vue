<script setup vapor>
import { computed } from 'vue'
import { STANCE_LOOK, informsByType } from '../../kb/evidence.js'
import { entityPath } from '../../kb/paths.js'
import Disclosure from '../../ui/Disclosure.vue'
import EmptyState from '../../ui/EmptyState.vue'
import RouterLink from '../../ui/RouterLink.vue'
import MarkIcon from './MarkIcon.vue'

// What an article informs: the entries it supports or contradicts, grouped by kind, each with a stance
// marker (a blue circle supports, a vermillion square contradicts) and the word for assistive
// technology. A long group shows the first entries and folds the rest. `article` is an entry of
// the evidence model.
const props = defineProps({ article: { type: Object, required: true } })

const SHOWN = 12
const groups = computed(() => informsByType(props.article).map((group) => ({ ...group, first: group.items.slice(0, SHOWN), rest: group.items.slice(SHOWN) })))
const contradicts = computed(() => props.article.informs.some((item) => item.stance === 'contradicts'))
const word = (stance) => (stance === 'supports' ? 'supports' : 'contradicts')
</script>

<template lang="pug">
EmptyState(v-if="!groups.length") This article is not linked to any entry yet.
.stack(v-else)
  .cluster(role="note" aria-label="Key to the stance markers")
    span.ev-stance
      MarkIcon(:look="STANCE_LOOK.supports")
      span Supports
    span.ev-stance(v-if="contradicts")
      MarkIcon(:look="STANCE_LOOK.contradicts")
      span Contradicts
  section.stack.stack--tight(v-for="group in groups" :key="group.type")
    h3 {{ `${group.label} (${group.items.length})` }}
    ul.ev-chips
      li.ev-stance(v-for="item in group.first" :key="item.id")
        MarkIcon(:look="STANCE_LOOK[item.stance]")
        RouterLink(:to="entityPath(item.id)") {{ item.name }}
        span.visually-hidden {{ word(item.stance) }}
    Disclosure(v-if="group.rest.length" :summary="`Show ${group.rest.length} more`")
      ul.ev-chips
        li.ev-stance(v-for="item in group.rest" :key="item.id")
          MarkIcon(:look="STANCE_LOOK[item.stance]")
          RouterLink(:to="entityPath(item.id)") {{ item.name }}
          span.visually-hidden {{ word(item.stance) }}
</template>
