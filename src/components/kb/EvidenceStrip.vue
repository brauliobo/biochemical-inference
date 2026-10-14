<script setup vapor>
import { computed } from 'vue'
import { EVIDENCE_GRADES } from '../../knowledge/evidence.js'
import { getEntity, graph } from '../../knowledge/index.js'
import ClaimStatusBadge from './ClaimStatusBadge.vue'
import EntityLink from './EntityLink.vue'

// How well this entity is supported, as a picture rather than a paragraph: the four grades as a
// scale with the current one marked (letter, word and position, never colour alone), the number
// of sources for and against, and the claims made about it with their statuses.
const ORDER = ['conversation-only', 'speculative', 'plausible', 'established']
const LETTER = { established: 'E', plausible: 'P', speculative: 'S', 'conversation-only': 'C' }
const props = defineProps({ model: { type: Object, required: true } })

const steps = computed(() => ORDER.map((grade) => ({ grade, letter: LETTER[grade], label: EVIDENCE_GRADES[grade].label, current: grade === props.model.evidence.grade })))
const supports = computed(() => (props.model.references ?? []).filter((reference) => reference.stance === 'supports').length)
const against = computed(() => (props.model.references ?? []).filter((reference) => reference.stance === 'contradicts').length)
const claims = computed(() => graph.links(props.model.id)
  .filter((link) => getEntity(link.other)?.type === 'claim')
  .map((link) => getEntity(link.other))
  .filter((claim, index, list) => list.findIndex((other) => other.id === claim.id) === index)
  .slice(0, 5)
  .map((claim) => ({ id: claim.id, name: claim.name, status: claim.status })))
const sentence = computed(() => `${props.model.evidence.label}: ${props.model.evidence.description}`)
</script>

<template lang="pug">
section.evidence-strip.cluster(aria-label="Evidence")
  ol.evidence-scale(:title="sentence" :aria-label="`Evidence grade scale: ${model.evidence.label}`")
    li(v-for="step in steps" :key="step.grade" :class="[`evidence-step--${step.grade}`, { 'is-current': step.current }]" :aria-current="step.current ? 'true' : undefined")
      span.evidence-step__dot(aria-hidden="true") {{ step.letter }}
      span.evidence-step__label {{ step.label }}
  p.evidence-counts
    strong {{ supports }}
    span {{ ` ${supports === 1 ? 'source supports' : 'sources support'} this`}}
    template(v-if="against")
      span {{ `, ${against} ${against === 1 ? 'contradicts' : 'contradict'} it` }}
  ul.chip-list(v-if="claims.length" aria-label="Claims about this")
    li(v-for="claim in claims" :key="claim.id")
      span.cluster.cluster--tight
        ClaimStatusBadge(:status="claim.status")
        EntityLink(:id="claim.id")
</template>
