<script setup vapor>
import Badge from '../../ui/Badge.vue'
import Card from '../../ui/Card.vue'
import Disclosure from '../../ui/Disclosure.vue'
import Facts from '../../ui/Facts.vue'
import Notice from '../../ui/Notice.vue'
import { fixed } from '../../ui/format.js'

// The ranked results of one search, with the transparent score of every
// channel (exact, annotation, BM25, vector, reciprocal-rank fusion).
defineProps({
  response: { type: Object, required: true },
  results: { type: Array, required: true }
})
const emit = defineEmits(['open'])

const channels = (result) => Object.entries(result.score_components).map(([name, component]) => ({ name, ...component }))
const explanations = (response) => Object.entries(response.explanations).map(([channel, text]) => ({ label: channel, value: text }))
const tone = (status) => (status === 'active' ? 'success' : 'warning')
</script>

<template lang="pug">
.stack
  .stack.stack--tight
    strong Transparent ranking · reciprocal-rank-fusion-v1
    Disclosure(card summary="Explain exact, annotation, BM25, vector, and RRF channels")
      Facts(rows :items="explanations(response)")
  Notice(v-if="!results.length" tone="warning" role="status") No evidence matched this bounded release. This does not establish absence from the literature.
  ul.plain-list.stack(v-else aria-label="Ranked evidence results")
    li(v-for="(result, index) in results" :key="result.document.id")
      Card
        .repel
          span.muted Rank {{ index + 1 }} · RRF {{ fixed(result.score, 6) }}
          Badge(:tone="tone(result.document.publication_status)" :label="result.document.publication_status")
        h3
          button.button.button--link(type="button" @click="emit('open', result.document.id)") {{ result.document.title }}
        p {{ result.document.canonical_id }} · {{ result.document.journal }} · {{ result.document.publication_date }}
        ul.plain-list.stack.stack--tight(aria-label="Ranking channels and scores")
          li.cluster(v-for="channel in channels(result)" :key="channel.name")
            strong {{ channel.name }} rank {{ channel.rank }}
            span(v-if="channel.raw !== undefined") BM25 raw {{ fixed(channel.raw, 6) }}
            span(v-if="channel.cosine !== undefined") cosine {{ fixed(channel.cosine, 6) }}
            span RRF +{{ fixed(channel.rrf, 6) }}
</template>
