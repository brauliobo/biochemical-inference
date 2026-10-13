<script setup vapor>
import { computed } from 'vue'
import { typeLabel } from '../../knowledge/types.js'
import Badge from '../../ui/Badge.vue'

const props = defineProps({ type: { type: String, required: true } })
const label = computed(() => typeLabel(props.type))
</script>

<template lang="pug">
Badge(:label="label")
</template>
