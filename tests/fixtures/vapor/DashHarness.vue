<script setup vapor>
import { ref } from 'vue'
import DashboardShell from '../../../src/components/dash/DashboardShell.vue'
import ScenarioPresets from '../../../src/components/dash/ScenarioPresets.vue'

// Host for the shared dashboard components whose slots and v-model need a parent (tests/component/dash-shared.test.js).
defineProps({ which: { type: String, required: true } })
const chosen = ref('a')
const presets = [
  { id: 'a', label: 'Baseline', evidence: { status: 'supported' } },
  { id: 'b', label: 'Partly', evidence: { status: 'partly' } },
  { id: 'c', label: 'Mouse', evidence: 'animal' },
  { id: 'd', label: 'Glycine', evidence: { status: 'hypothesis' } }
]
</script>

<template lang="pug">
DashboardShell(v-if="which === 'shell'" title="Gut and acid" question="Does acid make gas?" status="hypothesis")
  template(#controls)
    p controls here
  p the visuals
  template(#notes)
    p notes here
  template(#related)
    a(href="#/kb") related link
DashboardShell(v-else-if="which === 'bare'" title="Bare")
  p content
div(v-else)
  ScenarioPresets(:scenarios="presets" v-model="chosen")
  p(role="status") {{ `chosen: ${chosen}` }}
</template>
