<script setup vapor>
import { computed } from 'vue'
import { getEntity } from '../../knowledge/index.js'
import { entityPath } from '../../kb/paths.js'
import RouterLink from '../../ui/RouterLink.vue'

// A link to an entity page. A target that does not exist (a dangling reference in
// the data) renders as plain text, so a page never contains a dead link.
const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, default: '' }
})
const entity = computed(() => getEntity(props.id))
const text = computed(() => props.label || entity.value?.name || props.id)
</script>

<template lang="pug">
RouterLink(v-if="entity" :to="entityPath(id)") {{ text }}
span(v-else) {{ text }}
</template>
