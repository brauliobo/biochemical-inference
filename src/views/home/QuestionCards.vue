<script setup vapor>
import DashThumb from '../../components/dash/DashThumb.vue'
import RouterLink from '../../ui/RouterLink.vue'
import { QUESTIONS } from './questions.js'

// "Questions this site answers": one card per question with a small picture of the answer and a link to the
// dashboard (the whole card is the link). Headings are level 3 under the section's h2.
</script>

<template lang="pug">
ul.grid.plain-list.dash-cards(aria-label="Questions")
  li(v-for="item in QUESTIONS" :key="item.id")
    article.dash-card
      DashThumb(:kind="item.thumb")
      h3
        RouterLink(:to="item.to") {{ item.question }}
      p.dash-card__also(v-if="item.also")
        RouterLink(:to="item.also.to") {{ item.also.label }}
</template>
