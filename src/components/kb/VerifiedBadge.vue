<script setup vapor>
import Badge from '../../ui/Badge.vue'

// Whether an article's citation details have been checked.
defineProps({ verified: { type: Boolean, required: true } })
</script>

<template lang="pug">
Badge(v-if="verified" label="Citation verified" tone="success")
Badge(v-else label="Citation not verified" tone="warning")
</template>
