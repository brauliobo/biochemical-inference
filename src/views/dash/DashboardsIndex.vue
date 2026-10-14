<script setup vapor>
import { setPageTitle } from '../../router.js'
import DashThumb from '../../components/dash/DashThumb.vue'
import ModelDisclaimer from '../../components/dash/ModelDisclaimer.vue'
import Badge from '../../ui/Badge.vue'
import RouterLink from '../../ui/RouterLink.vue'
import { DASHBOARDS } from './routes.js'

// The dashboards, as cards with a small picture of what each one simulates. The pictures are precomputed
// (sim/data/dash-thumbs.json); the models run only inside each dashboard.
setPageTitle('Dashboards')
const STATUS = { model: ['Simulation model', 'info'], calculator: ['Calculator', 'info'], hypothesis: ['Hypothesis', 'warning'], measured: ['Measured data', 'success'] }
const OTHER = [
  { path: '/evidence', title: 'Evidence', question: 'What does the literature really say about each claim?' },
  { path: '/atlas', title: 'Atlas', question: 'Browse the ontology: reactions, enzymes, compounds and how they connect.' }
]
</script>

<template lang="pug">
.stack.stack--loose
  header.stack.stack--tight
    h1 Dashboards
    p.dash-question Simulators and calculators. Pick a question, move a slider, watch the chart.
    ModelDisclaimer
  ul.grid.plain-list.dash-cards(aria-label="Simulator dashboards")
    li(v-for="dashboard in DASHBOARDS" :key="dashboard.id")
      article.dash-card
        DashThumb(:kind="dashboard.thumb")
        h2
          RouterLink(:to="dashboard.path") {{ dashboard.title }}
        p {{ dashboard.question }}
        Badge(:label="STATUS[dashboard.status][0]" :tone="STATUS[dashboard.status][1]")
  section.stack(aria-labelledby="more-heading")
    h2#more-heading More than simulators
    ul.grid.plain-list.dash-cards
      li(v-for="item in OTHER" :key="item.path")
        article.dash-card
          h3
            RouterLink(:to="item.path") {{ item.title }}
          p {{ item.question }}
</template>
