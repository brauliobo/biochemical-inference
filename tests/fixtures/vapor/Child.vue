<script setup vapor>
import { inject } from 'vue'

const emit = defineEmits(['picked'])
defineProps({ label: { type: String, default: 'child' } })
const theme = inject('theme', 'none')
</script>

<template lang="pug">
button.child(type="button" @click="emit('picked', { id: 7 })")
  slot(:label="label") default {{ label }}
  span.theme {{ theme }}
</template>
