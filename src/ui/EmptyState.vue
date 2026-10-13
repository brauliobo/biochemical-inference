<script setup vapor>
// What to show when there is nothing to list yet: a plain muted line, or with a
// `title` a dashed box that says what to do next. Always explain, never leave
// a blank region.
//
//   EmptyState(v-if="!items.length") No attempts match these filters.
//   EmptyState(title="No simulation has been run") Configure a preset, then run.
defineProps({ title: { type: String, default: '' } })
</script>

<template lang="pug">
.empty-state.stack.stack--tight(v-if="title")
  strong {{ title }}
  p.muted
    slot
p.muted(v-else)
  slot
</template>
