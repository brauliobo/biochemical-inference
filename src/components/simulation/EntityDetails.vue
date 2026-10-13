<script setup vapor>
import { computed } from 'vue'
import Facts from '../../ui/Facts.vue'
import Panel from '../../ui/Panel.vue'

// Section 04: what the curated network says about the selected entity or
// reaction, with its taxon-specific proteins and evidence.
const props = defineProps({
  model: { type: Object, required: true },
  network: { type: Object, required: true },
  result: { type: Object, default: undefined },
  selectedId: { type: String, required: true }
})

const compound = computed(() => props.network.compounds.find((item) => item.id === props.selectedId))
const modelReaction = computed(() => props.model.topology.reactions.find((item) => item.id === props.selectedId))
const reaction = computed(() => props.network.reactions.find((item) => item.id === modelReaction.value?.knowledgeReactionId))
const connectedModelReactions = computed(() => props.model.topology.reactions.filter((item) => [...item.reactantIds, ...item.productIds].includes(props.selectedId)))
const connectedReactions = computed(() => props.network.reactions.filter((item) => connectedModelReactions.value.some((modeled) => modeled.knowledgeReactionId === item.id)))
const proteins = computed(() => props.network.proteins.filter((item) => connectedReactions.value.some((linked) => linked.proteinIds.includes(item.id)) || reaction.value?.proteinIds.includes(item.id)))
const evidence = computed(() => {
  const ids = new Set([
    ...(compound.value?.evidenceIds ?? []),
    ...(reaction.value?.evidenceIds ?? []),
    ...connectedReactions.value.flatMap((linked) => linked.evidenceIds),
    ...proteins.value.flatMap((protein) => protein.evidenceIds)
  ])
  return props.network.evidence.filter((item) => ids.has(item.id))
})
const finalValue = computed(() => props.result?.concentrations.find((item) => item.id === props.selectedId)?.values.at(-1))
const facts = computed(() => [
  { label: 'Formula', value: compound.value.formula },
  { label: 'Charge', value: compound.value.charge },
  ...(finalValue.value === undefined ? [] : [{ label: 'Final model value', value: `${finalValue.value.toFixed(3)} ${props.model.concentrationUnit}` }])
])
</script>

<template lang="pug">
Panel(:title="compound?.name ?? modelReaction?.name ?? 'Modeled entity'" title-id="details-title" eyebrow="04 · Evidence")
  template(v-if="compound")
    Facts(:items="facts")
    h3 Connected reactions
    ul
      li(v-for="linked in connectedReactions" :key="linked.id") {{ linked.name }}
  template(v-if="modelReaction")
    p.eyebrow {{ modelReaction.kind }} modeled reaction
    p(v-if="reaction") Curated mapping: {{ reaction.equation }}
    p(v-else) This equation term is an explicit {{ modelReaction.kind }} assumption and has no curated reaction mapping.
  h3 Taxon-specific proteins
  ul
    li(v-for="protein in proteins" :key="protein.id")
      strong {{ protein.gene }}
      |  {{ ` ${protein.name} · ${protein.id} · taxon ${protein.taxonId}` }}
    li(v-if="!proteins.length") No protein association is asserted for this boundary or generic reaction.
  h3 Evidence
  ul
    li(v-for="item in evidence" :key="item.id")
      a(:href="item.url" target="_blank" rel="noreferrer") {{ item.citation }}
      |  {{ ` ${item.kind} · ${item.evidenceClass} evidence` }}
</template>
