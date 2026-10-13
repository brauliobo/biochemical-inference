<script setup vapor>
import { computed } from 'vue'

// A labelled <select> bound with v-model (string or number values). `options`
// is a list of { value, label } or plain strings. Other attributes (disabled,
// ...) go to the <select>. `change` is emitted with the new value: handlers use
// that argument, not the bound state, which may not have been updated yet.
//
//   SelectField(id="taxon" label="Taxon" v-model="taxonId" :options="[{ value: 9606, label: 'Human' }]")
defineOptions({ inheritAttrs: false })
const model = defineModel({ type: [String, Number], default: '' })
const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  options: { type: Array, required: true },
  hint: { type: String, default: '' }
})
const emit = defineEmits(['change'])

const entries = computed(() => props.options.map((option) => (typeof option === 'object' ? option : { value: option, label: String(option) })))

// Options carry typed values (numbers); the DOM carries their strings.
function valueOf({ target }) {
  return entries.value.find((entry) => String(entry.value) === target.value)?.value ?? target.value
}
</script>

<template lang="pug">
.field
  label(:for="id") {{ label }}
  select(v-bind="$attrs" :id="id" v-model="model" :aria-describedby="hint ? `${id}-hint` : undefined" @change="emit('change', valueOf($event))")
    option(v-for="entry in entries" :key="entry.value" :value="entry.value") {{ entry.label }}
  small.muted(v-if="hint" :id="`${id}-hint`") {{ hint }}
</template>
