<script setup vapor>
import { computed } from 'vue'
import { entityPath } from '../../kb/paths.js'
import { knowledgeModule, loadKnowledge } from '../../kb/knowledge-lazy.js'
import Badge from '../../ui/Badge.vue'
import RouterLink from '../../ui/RouterLink.vue'
import GradeMark from '../evidence/GradeMark.vue'
import { articlePath, claimPath, shortName, statusInfo } from './causal-view.js'

// A row of evidence chips: for each entry an evidence-grade letter, a link, and for a claim its verdict (the status the
// evidence dashboards print). The link goes to /evidence/claim/<slug> or /evidence/article/<slug>, other entries to
// their knowledge-base page. Grades and verdicts appear when the knowledge data has loaded; the chips and links are
// there at once.
//
//   EvidenceChips(label="Evidence" :items="[{ id: 'claim:histamine-peaks-2-4am', note: 'weak' }, { id: 'article:szefler-1991-nocturnal-histamine', label: 'Szefler 1991: plasma 2x at 04:00' }]")
const props = defineProps({
  items: { type: Array, required: true },
  label: { type: String, default: 'Evidence' }
})
loadKnowledge()
const slug = (id) => id.replace(/^[a-z]+:/, '').replaceAll('-', ' ')
const rows = computed(() => props.items.map((item) => {
  const k = knowledgeModule.value
  const entity = k ? k.getEntity(item.id) : null
  const isClaim = item.id.startsWith('claim:')
  return {
    key: item.id,
    text: item.label ?? (entity ? shortName(entity.name) : slug(item.id)),
    href: isClaim ? claimPath(item.id) : item.id.startsWith('article:') ? articlePath(item.id) : entityPath(item.id),
    grade: entity?.evidence ?? '',
    status: isClaim && entity ? statusInfo(entity.status) : null,
    note: item.note ?? '',
    tone: item.tone ?? 'muted'
  }
}))
</script>

<template lang="pug">
ul.dg-chips(:aria-label="label")
  li.dg-chip(v-for="chip in rows" :key="chip.key")
    GradeMark(v-if="chip.grade" :grade="chip.grade")
    RouterLink.dg-chip__text(:to="chip.href") {{ chip.text }}
    Badge(v-if="chip.status" :label="chip.status.word" :tone="chip.status.tone")
    Badge(v-if="chip.note" :label="chip.note" :tone="chip.tone")
</template>
