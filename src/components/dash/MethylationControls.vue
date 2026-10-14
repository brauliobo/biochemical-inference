<script setup vapor>
import { ref } from 'vue'
import Disclosure from '../../ui/Disclosure.vue'
import InputField from '../../ui/InputField.vue'
import SliderField from '../../viz/SliderField.vue'
import ScenarioPresets from './ScenarioPresets.vue'
import { CONTROL_GROUPS, controlSpecs, matchesPreset, presetScenarios } from './methylation-state.js'

// The left column of the methylation page: the preset list, the "parameter uncertainty" switch and the 12 sliders in
// three groups. It edits the reactive `state` ({ presetId, controls, variants }) it is given; the page runs the model.
//
//   MethylationControls(:state="state" v-model:uncertainty="showBands" :running="running" @reset="reset")
const props = defineProps({
  state: { type: Object, required: true },
  running: { type: Boolean, default: false },
  progress: { type: Number, default: 0 }
})
const uncertainty = defineModel('uncertainty', { type: Boolean, default: false })
const emit = defineEmits(['preset', 'reset'])
const presets = presetScenarios()
const specs = controlSpecs()
const wide = typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia('(min-width: 64rem)').matches : true
const open = ref(wide)

const groupSpecs = (id) => specs.filter((spec) => spec.group === id)
const set = (id, value) => { props.state.controls[id] = value }
const changed = () => !matchesPreset(props.state.presetId, props.state.controls)
</script>

<template lang="pug">
.dash-controls__inner.stack
  Disclosure(summary="Scenario and controls" :open="open")
    .stack
      ScenarioPresets(label="Scenario" :scenarios="presets" :model-value="state.presetId" @change="(id) => emit('preset', id)")
      InputField(id="dash-uncertainty" type="checkbox" label="Show parameter uncertainty" v-model="uncertainty" hint="Runs 100 parameter sets in the background (about 3 s).")
      p.muted(v-if="uncertainty && running" role="status") {{ `Uncertainty ribbons: ${Math.round(progress * 100)}%` }}
      Disclosure(summary="Adjust the 12 controls" flat)
        .stack
          fieldset.dash-sliders(v-for="group in CONTROL_GROUPS" :key="group.id")
            legend {{ group.label }}
            SliderField(v-for="spec in groupSpecs(group.id)" :key="spec.id" :id="`dash-c-${spec.id}`" :label="spec.short" :unit="spec.unit" :min="spec.min" :max="spec.max" :step="spec.step" :model-value="state.controls[spec.id]" @input="(value) => set(spec.id, value)")
          button.button.button--secondary(type="button" :disabled="!changed()" @click="emit('reset')") Reset sliders to the preset
</template>
