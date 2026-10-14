<script setup vapor>
import { computed } from 'vue'
import { DESIGN_CLASSES, PRIOR_WEIGHT, SCORING, TOPICS, UNVERIFIED_FACTOR } from '../../kb/evidence.js'
import DataTable from '../../ui/DataTable.vue'
import Disclosure from '../../ui/Disclosure.vue'
import DesignIcon from './DesignIcon.vue'

// "How is this scored?": the whole scoring rule in one place, so the numbers on the dashboards can be
// checked. A native disclosure, closed by default. `articles` (optional) adds how many articles of
// each design the knowledge base holds.
const props = defineProps({ articles: { type: Array, default: () => [] } })
const counts = computed(() => {
  const found = new Map()
  for (const article of props.articles) found.set(article.design, (found.get(article.design) ?? 0) + 1)
  return found
})
const columns = computed(() => ['Design', 'Weight', ...(props.articles.length ? ['Articles'] : []), 'Counts as'])
</script>

<template lang="pug">
Disclosure(summary="How is this scored?")
  .stack
    p.notice(role="note") {{ SCORING.summary }}
    ol.stack.stack--tight
      li(v-for="(step, index) in SCORING.steps" :key="index") {{ step }}
    p
      code {{ SCORING.formula }}
    p.muted {{ `The prior is ${PRIOR_WEIGHT}; an unverified citation counts ${UNVERIFIED_FACTOR} of its design weight.` }}
    DataTable(caption="Design weights" :columns="columns")
      tr(v-for="design in DESIGN_CLASSES" :key="design.id")
        th(scope="row")
          DesignIcon(:design="design.id")
        td {{ design.weight }}
        td(v-if="articles.length") {{ counts.get(design.id) ?? 0 }}
        td {{ design.note }}
    p.muted {{ `Topics (${TOPICS.map((topic) => topic.short).join(', ')}) are assigned by keywords: a claim by the words of its own name and of the entries it is associated with, an article by the entries and claims it informs. They are a reading aid, not a classification of the science.` }}
</template>
