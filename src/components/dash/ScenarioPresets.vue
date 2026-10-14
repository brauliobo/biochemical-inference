<script setup vapor>
import Badge from '../../ui/Badge.vue'
import { uniqueId } from '../../ui/uid.js'
import { chipOf } from './chips.js'

// A radio list of scenario presets. Each row shows the preset's label and an evidence chip that is a
// word as well as a colour: supported, partly supported, animal data or hypothesis (no human data).
//
//   ScenarioPresets(label="Scenario" :scenarios="presets" v-model="chosen")
//
// `scenarios` are the objects of src/sim/scenarios.js (id, label, evidence.status) or anything with
// `id`, `label` and `evidence` (a status word or { status }); `short` replaces the label in the row.
// Arrow keys move and choose, as for any radio group.
const model = defineModel({ type: String, default: '' })
defineProps({
  scenarios: { type: Array, required: true },
  label: { type: String, default: 'Scenario' }
})
const emit = defineEmits(['change'])
const name = uniqueId('presets')

function choose(id) {
  model.value = id
  emit('change', id)
}
</script>

<template lang="pug">
fieldset.dash-presets
  legend {{ label }}
  ul.plain-list
    li(v-for="scenario in scenarios" :key="scenario.id")
      label.dash-preset(:class="{ 'dash-preset--on': model === scenario.id }")
        input(type="radio" :name="name" :value="scenario.id" :checked="model === scenario.id" @change="choose(scenario.id)")
        span.dash-preset__label {{ scenario.short ?? scenario.label }}
        Badge(:label="chipOf(scenario).label" :tone="chipOf(scenario).tone")
</template>
