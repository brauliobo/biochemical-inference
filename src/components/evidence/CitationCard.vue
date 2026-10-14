<script setup vapor>
import { computed } from 'vue'
import { evidenceInfo } from '../../knowledge/evidence.js'
import { describeFacts } from '../../knowledge/facts.js'
import { LITERATURE_PATH, designInfo, topicInfo } from '../../kb/evidence.js'
import Badge from '../../ui/Badge.vue'
import Facts from '../../ui/Facts.vue'
import RouterLink from '../../ui/RouterLink.vue'
import VerifiedBadge from '../kb/VerifiedBadge.vue'
import DesignIcon from './DesignIcon.vue'
import GradeMark from './GradeMark.vue'

// A compact citation card for one article: authors, journal, year, links to the source, whether the
// citation has been checked, and chips for the study design, evidence grade and population.
// `article` is an entry of the evidence model.
const props = defineProps({ article: { type: Object, required: true } })

const AUTHORS_SHOWN = 6
const authors = computed(() => {
  const list = props.article.authors
  if (list.length <= AUTHORS_SHOWN) return list.join(', ')
  return `${list.slice(0, AUTHORS_SHOWN).join(', ')} and ${list.length - AUTHORS_SHOWN} more`
})
const identifiers = computed(() => describeFacts({ ...(props.article.doi ? { doi: props.article.doi } : {}), ...(props.article.pmid ? { pmid: props.article.pmid } : {}) }))
const items = computed(() => [
  { label: 'Authors', value: authors.value || 'not recorded' },
  { label: 'Journal', value: props.article.journal || 'not recorded' },
  { label: 'Year', value: props.article.year }
])
const design = computed(() => designInfo(props.article.design))
const topic = computed(() => topicInfo(props.article.topic))
const grade = computed(() => evidenceInfo(props.article.grade).label)
const population = computed(() => {
  const text = props.article.population
  return text.length > 80 ? `${text.slice(0, 77)}...` : text
})
</script>

<template lang="pug">
.stack
  Facts(:items="items" rows)
  .cluster
    template(v-for="fact in identifiers" :key="fact.key")
      a(v-if="fact.url" :href="fact.url" rel="noopener noreferrer") {{ `${fact.label}: ${fact.value}` }}
      span(v-else) {{ `${fact.label}: ${fact.value}` }}
    a(v-if="article.url" :href="article.url" rel="noopener noreferrer") Open the article
    VerifiedBadge(:verified="article.verified")
  .cluster
    DesignIcon(:design="article.design")
    span.ev-stance
      GradeMark(:grade="article.grade")
      span(aria-hidden="true") {{ grade }}
    Badge(v-if="population" :label="population")
    RouterLink(:to="`${LITERATURE_PATH}?topic=${article.topic}`") {{ topic.label }}
  p.muted {{ design.note }}
</template>
