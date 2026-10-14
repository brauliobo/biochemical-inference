<script setup vapor>
import { onMounted, ref } from 'vue'
import PathCards from '../../components/kb/PathCards.vue'
import SearchBox from '../../components/kb/SearchBox.vue'
import { PATH_CARDS } from '../../kb/path-cards.js'
import { PATHS_PATH } from '../../kb/paths.js'
import { START_HERE } from '../../kb/start-here.js'
import RouterLink from '../../ui/RouterLink.vue'
import { lazyComponent } from '../../ui/lazy.js'
import HeroPlaceholder from './HeroPlaceholder.vue'
import HomeStats from './HomeStats.vue'
import QuestionCards from './QuestionCards.vue'

// Home: the core methylation map as the hero, the questions the site answers (each a dashboard), counters, then the
// ways into the knowledge base. Charts, the simulator and the knowledge data load after first paint: the map once
// the browser is idle (a static picture holds its place), the data through the lazy loader.
const HeroMap = lazyComponent(() => import('./HeroMap.vue'))
const KnowledgeSummary = lazyComponent(() => import('../../components/kb/HomeKnowledge.vue'))
const heroReady = ref(false)
onMounted(() => {
  const idle = typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback : (callback) => setTimeout(callback, 150)
  idle(() => { heroReady.value = true })
})
</script>

<template lang="pug">
.stack.stack--loose
  header.stack.stack--tight
    p.eyebrow Educational resource
    h1 Methylation, visualised
    p.lede Move a slider and watch SAM:SAH, homocysteine and glycine respond.
    p.notice.notice--warning(role="note")
      strong Educational, not medical advice.
      |  The models are illustrative and cannot tell you what to take.

  SearchBox

  section.stack(aria-labelledby="hero-heading")
    h2#hero-heading The core methylation network
    component(v-if="heroReady" :is="HeroMap")
    .stack(v-else)
      HeroPlaceholder
      p
        RouterLink.button(to="/dash/methylation") Simulate it: methylation balance

  section.stack(aria-labelledby="questions-heading")
    h2#questions-heading Questions this site answers
    QuestionCards

  HomeStats

  section.stack(aria-labelledby="paths-heading")
    h2#paths-heading Guided paths
    PathCards(:paths="PATH_CARDS")
    p
      RouterLink(:to="PATHS_PATH") All guided paths

  section.stack(aria-labelledby="start-heading")
    h2#start-heading Start here
    ul.cluster.plain-list
      li(v-for="step in START_HERE" :key="step.name")
        RouterLink(:to="step.to") {{ step.name }}

  component(:is="KnowledgeSummary")
</template>
