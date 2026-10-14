<script setup vapor>
import ArticlesExplorer from '../../components/evidence/ArticlesExplorer.vue'
import { useEvidence } from '../../components/evidence/useEvidence.js'
import { setPageTitle } from '../../router.js'
import RouterLink from '../../ui/RouterLink.vue'

// /evidence/literature. The articles as a dot plot table: design, year, grade, entries informed.
setPageTitle('Literature')
const { model } = useEvidence()
</script>

<template lang="pug">
.stack.stack--loose
  header.stack
    nav(aria-label="Breadcrumb")
      RouterLink(to="/evidence") Evidence
    h1 Literature
    p.lede Every article by study design and year, filtered by what it informs.
  p.muted(v-if="!model" role="status") Loading the evidence data.
  ArticlesExplorer(v-else :articles="model.articles")
</template>
