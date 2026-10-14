<script setup vapor>
import { computed } from 'vue'
import { formatNumber } from './scale.js'

// A labelled slider with the value and unit printed next to it. It is a native
// <input type="range">: arrow keys, Home/End and Page keys work, the thumb is a
// 44 px target, and the screen reader hears "5 g" through aria-valuetext.
//
//   SliderField(id="glycine" label="Glycine dose" unit="g" :min="0" :max="10" :step="0.5" v-model="dose" hint="Per day")
//
// `input` is emitted with the new number. `format` turns a number into text.
const model = defineModel({ type: Number, default: 0 })
const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  unit: { type: String, default: '' },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
  hint: { type: String, default: '' },
  format: { type: Function, default: (value) => formatNumber(value) },
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['input'])

const valueText = computed(() => (props.unit ? `${props.format(model.value)} ${props.unit}` : props.format(model.value)))
const minText = computed(() => (props.unit ? `${props.format(props.min)} ${props.unit}` : props.format(props.min)))
const maxText = computed(() => (props.unit ? `${props.format(props.max)} ${props.unit}` : props.format(props.max)))
const fill = computed(() => `${Math.min(100, Math.max(0, ((model.value - props.min) / (props.max - props.min || 1)) * 100))}%`)
const describedby = computed(() => (props.hint ? `${props.id}-hint` : undefined))
</script>

<template lang="pug">
.field.viz-slider
  .repel
    label(:for="id") {{ label }}
    output.viz-slider__value(:id="`${id}-value`") {{ valueText }}
  input(type="range" :id="id" :min="min" :max="max" :step="step" :disabled="disabled" v-model.number="model" :aria-valuetext="valueText" :aria-describedby="describedby" :style="{ '--viz-fill': fill }" @input="emit('input', Number($event.target.value))")
  .repel.viz-slider__limits
    span {{ minText }}
    span {{ maxText }}
  small.muted(v-if="hint" :id="`${id}-hint`") {{ hint }}
</template>
