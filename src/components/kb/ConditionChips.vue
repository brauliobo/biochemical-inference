<script setup vapor>
import { entityPath } from '../../kb/paths.js'
import RouterLink from '../../ui/RouterLink.vue'
import Panel from '../../ui/Panel.vue'

// States, diseases and outcomes an entity relates to, as chips grouped by the relation ("Mitigates",
// "Aggravates", "Associated with"). A hypothesis link carries a small mark. `groups` come from
// kb/causal-view.js conditionsFor(); with no groups nothing is drawn.
defineProps({
  groups: { type: Array, required: true },
  title: { type: String, default: 'States, diseases and outcomes' }
})
</script>

<template lang="pug">
Panel.condition-chips(v-if="groups.length" :title="title" data-visual="chips" data-testid="condition-chips")
  .stack.stack--tight
    .cluster(v-for="group in groups" :key="group.label")
      strong.chip-group__label {{ group.label }}
      ul.chip-list(:aria-label="group.label")
        li(v-for="item in group.items" :key="item.id")
          RouterLink.chip(:to="entityPath(item.id)")
            | {{ item.name }}
            span.chip__mark(v-if="item.hypothesis" title="Proposed link, not established") {{ ' ?' }}
</template>
