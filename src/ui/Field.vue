<script setup vapor>
// A form field: a visible <label> bound to the control in the default slot,
// plus optional hint text. The control in the slot must carry the same `id`.
// `inline` puts the label after the control (checkboxes). The slot receives
// `describedby`, the id of the hint, for the control's aria-describedby.
//
//   Field(id="name" label="Name")
//     input#name(v-model="name")
//   Field(id="q" label="Query" hint="Exact IDs or text" v-slot="{ describedby }")
//     input#q(v-model="q" :aria-describedby="describedby")
defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  inline: { type: Boolean, default: false }
})
</script>

<template lang="pug">
.field(:class="{ 'field--inline': inline }")
  label(v-if="!inline" :for="id") {{ label }}
  slot(:describedby="hint ? id + '-hint' : undefined")
  label(v-if="inline" :for="id") {{ label }}
  small.muted(v-if="hint" :id="id + '-hint'") {{ hint }}
</template>
