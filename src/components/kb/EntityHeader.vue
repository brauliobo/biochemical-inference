<script setup vapor>
import { computed, ref } from 'vue'
import EvidenceBadge from './EvidenceBadge.vue'
import TypeBadge from './TypeBadge.vue'

// The top of every entity page: type and evidence badges, the one h1, the one-line summary and
// the other names (Portuguese names and abbreviations included) as small tags. Long alias lists
// fold behind a button so the header stays a header.
const SHOWN = 10
const props = defineProps({ model: { type: Object, required: true } })
const all = ref(false)
const aliases = computed(() => props.model.aliases ?? [])
const visible = computed(() => (all.value ? aliases.value : aliases.value.slice(0, SHOWN)))
const hidden = computed(() => Math.max(0, aliases.value.length - SHOWN))
</script>

<template lang="pug">
header.stack.stack--tight
  .cluster
    TypeBadge(:type="model.type")
    EvidenceBadge(:grade="model.evidence.grade")
  h1 {{ model.name }}
  p.lede {{ model.summary }}
  .cluster.cluster--tight(v-if="aliases.length")
    span.muted Also known as
    ul.chip-list(aria-label="Other names")
      li(v-for="alias in visible" :key="alias")
        span.badge {{ alias }}
    button.button.button--link(v-if="hidden > 0 && !all" type="button" @click="all = true") {{ `Show ${hidden} more` }}
</template>
