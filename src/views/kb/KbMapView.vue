<script setup vapor>
import { computed, watchEffect } from 'vue'
import Breadcrumbs from '../../components/kb/Breadcrumbs.vue'
import PathFinder from '../../components/kb/PathFinder.vue'
import RadialGraph from '../../components/kb/RadialGraph.vue'
import RelationGroups from '../../components/kb/RelationGroups.vue'
import SearchBox from '../../components/kb/SearchBox.vue'
import { graph } from '../../knowledge/index.js'
import { neighbourhood, pickNodes } from '../../kb/neighbourhood.js'
import { entityPath, mapPath } from '../../kb/paths.js'
import { START_HERE } from '../../kb/start-here.js'
import { navigate, setPageTitle, useRoute } from '../../router.js'
import RouterLink from '../../ui/RouterLink.vue'

// /kb/map?id=<entity id>. A text-first map: the neighbourhood of one entry grouped by
// relationship label, with an optional picture of the closest neighbours.
const CRUMBS = [{ kind: 'home', label: 'Home' }, { kind: 'entity', label: 'Map' }]
const route = useRoute()
const id = computed(() => route.query.id ?? '')
const hood = computed(() => (id.value ? neighbourhood(graph, id.value) : null))
const nodes = computed(() => (hood.value ? pickNodes(hood.value.groups) : []))
const starters = START_HERE.filter((step) => step.id)

watchEffect(() => setPageTitle(hood.value ? `Map of ${hood.value.name}` : 'Knowledge map'))
</script>

<template lang="pug">
.stack.stack--loose
  Breadcrumbs(:crumbs="CRUMBS")
  header.stack
    h1 Knowledge map
    p.lede Choose an entry to see everything directly connected to it, grouped by how it is connected.
  SearchBox(mode="pick" label="Entry to map" placeholder="For example glycine" @select="navigate(mapPath($event.id))")

  template(v-if="hood")
    section.stack(aria-labelledby="around-heading")
      h2#around-heading Around {{ hood.name }}
      p {{ hood.count }} directly connected {{ hood.count === 1 ? 'entry' : 'entries' }}.
      p
        RouterLink(:to="entityPath(hood.id)") Open the {{ hood.name }} page
      RadialGraph(v-if="nodes.length" :center="hood" :nodes="nodes")
    section.stack(aria-labelledby="neighbours-heading")
      h2#neighbours-heading Neighbours by relationship
      RelationGroups(:groups="hood.groups")
    PathFinder(:from="hood.id")

  p.notice.notice--warning(v-else-if="id") No entry matches “{{ id }}”. Search above, or start from one of the suggestions below.

  section.stack(v-if="!hood" aria-labelledby="try-heading")
    h2#try-heading Try one of these
    ul.cluster.plain-list
      li(v-for="step in starters" :key="step.id")
        RouterLink.button.button--secondary(:to="mapPath(step.id)") {{ step.name }}
</template>
