<script setup vapor>
import { workbenches } from '../workbenches.js'
import { isStaticMode } from '../runtime-mode.js'
import ApiRequired from '../ui/ApiRequired.vue'
import RouterLink from '../ui/RouterLink.vue'

const staticMode = isStaticMode()
</script>

<template lang="pug">
.stack.stack--loose
  header.stack
    h1 Workbenches
    p.lede Interactive, inspectable models. Each run pins its release, assumptions and numerical controls. Illustrative kinetics, not clinical guidance.
  ApiRequired(v-if="staticMode" title="The workbenches")
  ul.grid.plain-list
    li(v-for="item in workbenches" :key="item.name")
      RouterLink.card.stack.stack--tight(:to="'/workbench/' + item.name")
        h2 {{ item.title }}
        p.muted {{ item.summary }}
</template>
