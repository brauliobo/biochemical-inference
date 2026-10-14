<script setup vapor>
import { entityPath } from '../../kb/paths.js'
import RouterLink from '../../ui/RouterLink.vue'

// The numbers behind the entries a claim is about (intake limits, doses, reference ranges), each with
// who set it. `chips` comes from claimQuantities() in kb/evidence-graph.js.
defineProps({ chips: { type: Array, required: true } })
</script>

<template lang="pug">
ul.ev-chips
  li.badge(v-for="chip in chips" :key="chip.id")
    RouterLink(:to="entityPath(chip.subject)") {{ chip.subjectName }}
    span {{ ` ${chip.kind} ${chip.text}` }}
    span.muted {{ chip.authority ? ` (${chip.authority}${chip.population ? `, ${chip.population}` : ''})` : '' }}
</template>
