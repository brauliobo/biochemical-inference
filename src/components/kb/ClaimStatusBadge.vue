<script setup vapor>
import { computed } from 'vue'
import { claimStatusInfo } from '../../knowledge/evidence.js'
import Badge from './Badge.vue'

// Claim status ("Supported", "Contested", ...). Pass the status id.
const props = defineProps({ status: { type: String, required: true } })
const info = computed(() => claimStatusInfo(props.status))
const label = computed(() => `Claim: ${info.value.label}`)
</script>

<template lang="pug">
Badge(:label="label" :tone="info.tone")
</template>
