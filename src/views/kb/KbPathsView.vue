<script setup vapor>
import { watchEffect } from 'vue'
import Breadcrumbs from '../../components/kb/Breadcrumbs.vue'
import PathCards from '../../components/kb/PathCards.vue'
import { pathList } from '../../knowledge/index.js'
import { KB_PATH } from '../../kb/paths.js'
import { setPageTitle } from '../../router.js'
import RouterLink from '../../ui/RouterLink.vue'

// /kb/paths: the guided paths, each a short reading route through the graph.
const paths = pathList()
const crumbs = [{ kind: 'home', label: 'Home' }, { label: 'Guided paths' }]

watchEffect(() => setPageTitle('Guided paths'))
</script>

<template lang="pug">
.stack.stack--loose
  Breadcrumbs(:crumbs="crumbs")
  header.stack
    h1 Guided paths
    p.lede {{ paths.length }} short reading routes through the knowledge base. Each step is one entry and says why it comes next. You can stop at any step and come back to it later with the same link.
  PathCards(:paths="paths" :level="2")
  p
    RouterLink(:to="KB_PATH") Browse the knowledge base by kind instead
</template>
