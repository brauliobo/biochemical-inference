<script setup vapor>
import { uniqueId } from '../ui/uid.js'

// A segmented control for choosing one scenario: native radio buttons in a
// fieldset, so arrow keys move and select, and a screen reader hears "n of m".
// The chosen segment is bold, outlined and carries a check mark: not colour alone.
//
//   ScenarioPicker(label="Scenario" :options="[{ value: 'base', label: 'Baseline' }, { value: 'gly', label: 'Glycine 5 g' }]" v-model="scenario")
//
// `hide-label` keeps the legend for screen readers only. `change` is emitted with the value.
const model = defineModel({ type: [String, Number], default: '' })
defineProps({
  label: { type: String, required: true },
  options: { type: Array, required: true },
  hideLabel: { type: Boolean, default: false }
})
const emit = defineEmits(['change'])
const name = uniqueId('scenario')

function choose(value) {
  model.value = value
  emit('change', value)
}
</script>

<template lang="pug">
fieldset.viz-segmented
  legend(:class="{ 'visually-hidden': hideLabel }") {{ label }}
  .viz-segmented__options
    label.viz-segmented__option(v-for="option in options" :key="option.value")
      input(type="radio" :name="name" :value="option.value" :checked="model === option.value" @change="choose(option.value)")
      span {{ option.label }}
</template>
