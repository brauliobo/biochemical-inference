<script setup vapor>
// A named row of related controls (buttons, filters). The group name tells
// assistive technology what the controls are for; the row wraps when narrow.
defineProps({
  label: { type: String, required: true },
  end: { type: Boolean, default: false }
})
</script>

<template lang="pug">
.cluster(role="group" :aria-label="label" :class="{ 'cluster--end': end }")
  slot
</template>
