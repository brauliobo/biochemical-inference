<script setup vapor>
// Runs a composable inside a real Vapor component so its lifecycle hooks work.
// Root props are read as getters, so pass the function as `{ setup: () => fn }`.
const props = defineProps({ setup: { type: Function, required: true } })
props.setup()
</script>

<template lang="pug">
div
</template>
