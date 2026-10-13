<script setup vapor>
import { computed } from 'vue'

// A labelled text, number, range, search or checkbox input bound with v-model.
// Other attributes (min, max, step, disabled, required, maxlength, list,
// autocomplete, aria-*) go to the <input>. The hint and the error are linked
// to it with aria-describedby; the error is announced when it appears.
//
//   InputField(id="seed" label="Seed" type="number" v-model="seed" min="0" :disabled="busy" hint="uint32")
//
// A number or range input gives a number (like v-model.number). A checkbox puts
// its label after the box and v-model is a boolean. `input` is emitted with the
// new value: handlers use that argument, not the bound state, which may not have
// been updated yet.
defineOptions({ inheritAttrs: false })
const model = defineModel({ type: [String, Number, Boolean], default: '' })
const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' }
})
const emit = defineEmits(['input'])

const kind = computed(() => (props.type === 'checkbox' ? 'checkbox' : props.type === 'number' || props.type === 'range' ? 'number' : 'text'))
const describedby = computed(() => [props.error && `${props.id}-error`, props.hint && `${props.id}-hint`].filter(Boolean).join(' ') || undefined)

function valueOf({ target }) {
  if (kind.value === 'checkbox') return target.checked
  if (kind.value === 'text') return target.value
  const number = Number.parseFloat(target.value)
  return Number.isNaN(number) ? target.value : number
}
</script>

<template lang="pug">
.field(:class="{ 'field--inline': kind === 'checkbox' }")
  label(v-if="kind !== 'checkbox'" :for="id") {{ label }}
  input(v-if="kind === 'checkbox'" v-bind="$attrs" :id="id" type="checkbox" v-model="model" :aria-describedby="describedby" @change="emit('input', valueOf($event))")
  input(v-else-if="kind === 'number'" v-bind="$attrs" :id="id" :type="type" v-model.number="model" :aria-invalid="error ? 'true' : undefined" :aria-describedby="describedby" @input="emit('input', valueOf($event))")
  input(v-else v-bind="$attrs" :id="id" :type="type" v-model="model" :aria-invalid="error ? 'true' : undefined" :aria-describedby="describedby" @input="emit('input', valueOf($event))")
  label(v-if="kind === 'checkbox'" :for="id") {{ label }}
  small.muted(v-if="hint" :id="`${id}-hint`") {{ hint }}
  small.field__error(v-if="error" :id="`${id}-error`" role="alert") {{ error }}
</template>
