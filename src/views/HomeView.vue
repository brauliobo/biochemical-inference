<script setup vapor>
import EvidenceBadge from '../components/kb/EvidenceBadge.vue'
import SearchBox from '../components/kb/SearchBox.vue'
import { EVIDENCE_KEYS } from '../knowledge/evidence.js'
import { KB_PATH, MAP_PATH } from '../kb/paths.js'
import { START_HERE } from '../kb/start-here.js'
import { isStaticMode } from '../runtime-mode.js'
import RouterLink from '../ui/RouterLink.vue'
import { lazyComponent } from '../ui/lazy.js'

// The home page imports no knowledge data: the entry text, start-here path and
// search box render at once, and HomeKnowledge (counts, claims audit) loads after.
const KnowledgeSummary = lazyComponent(() => import('../components/kb/HomeKnowledge.vue'))
const staticMode = isStaticMode()
</script>

<template lang="pug">
.stack.stack--loose
  header.stack
    p.eyebrow Educational resource
    h1 Methylation biochemistry, explained and cross-linked
    p.lede.
      Glycine, choline and betaine, under- and over-methylation, the enzymes and
      reactions behind them, the pathways they form, related conditions and the
      literature, each on its own page and linked to the rest.
    .cluster
      RouterLink.button(:to="KB_PATH") Browse the knowledge base
      RouterLink.button.button--secondary(:to="MAP_PATH") Explore the map

  p.notice.notice--warning(role="note")
    strong Educational, not medical advice.
    |  This site explains biochemistry and shows how well each statement is supported. It cannot diagnose anything or tell you what to take. Talk to a qualified clinician about your health.

  SearchBox

  section.stack(aria-labelledby="start-heading")
    h2#start-heading Start here
    p.muted {{ START_HERE.length }} steps, in order. Each one opens a page that links on to the next ideas.
    ol.stack
      li(v-for="step in START_HERE" :key="step.name")
        RouterLink(:to="step.to") {{ step.name }}
        span.muted  {{ ' — ' + step.why }}

  section.stack(aria-labelledby="what-heading")
    h2#what-heading What is methylation?
    .prose
      p Methylation means moving a small chemical group, a methyl group, from one molecule to another. Cells do it all day: to switch genes on and off, to make messengers and cell membranes, and to clear compounds such as histamine.
      p The main methyl donor is SAMe (S-adenosylmethionine). Each time SAMe gives a methyl group away, the cell has to rebuild it, using folate, vitamin B12, choline and betaine. Glycine has a different job: an enzyme called GNMT uses it to dispose of surplus methyl groups.
      p The words under-methylation and over-methylation are used in biochemistry and also in a contested nutrient-therapy tradition. This site keeps the two apart and shows the evidence behind each statement.

  component(:is="KnowledgeSummary")

  section.stack(aria-labelledby="grades-heading")
    h2#grades-heading How sure are we?
    p Every entry carries an evidence grade, shown as a badge, so you can tell textbook facts from guesses.
    ul.plain-list.stack
      li(v-for="grade in EVIDENCE_KEYS" :key="grade")
        EvidenceBadge(:grade="grade" explain)

  section.stack(aria-labelledby="bench-heading")
    h2#bench-heading Workbenches
    p(v-if="staticMode") The interactive models need a server, so they run only when you install the project yourself. The knowledge base on this site needs no server.
    p(v-else) Interactive models of one-carbon metabolism. They are illustrative, not clinical guidance.
    p
      RouterLink(to="/workbench") About the workbenches
</template>
