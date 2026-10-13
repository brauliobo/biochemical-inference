<script setup vapor>
import { computed, nextTick, ref, watch, watchEffect } from 'vue'
import Breadcrumbs from '../../components/kb/Breadcrumbs.vue'
import EvidenceBadge from '../../components/kb/EvidenceBadge.vue'
import PathCards from '../../components/kb/PathCards.vue'
import TypeBadge from '../../components/kb/TypeBadge.vue'
import { getPath, pathList } from '../../knowledge/index.js'
import { stepView } from '../../kb/path-steps.js'
import { KB_PATH, PATHS_PATH, entityPath, guidedPathPath } from '../../kb/paths.js'
import { href, setPageTitle, useRoute } from '../../router.js'
import RouterLink from '../../ui/RouterLink.vue'

// /kb/paths/:id?step=N. One step of a guided path at a time: the entry (type and
// evidence badges), why the path goes there, Previous / Next links and progress. The
// step lives in the URL, so every step can be bookmarked or shared; a bad ?step= falls
// back to the nearest valid step. Moving between steps keeps the route path, so the
// shell does not move focus; this view moves it to the step heading instead.
const route = useRoute()
const path = computed(() => getPath(String(route.params.id ?? '')))
const view = computed(() => (path.value ? stepView(path.value, route.query.step) : null))
const entity = computed(() => view.value?.current.entity)
const crumbs = computed(() => [
  { kind: 'home', label: 'Home' },
  { label: 'Guided paths', to: PATHS_PATH },
  { label: path.value?.title ?? '' }
])
const heading = ref()

watchEffect(() => {
  if (!path.value) setPageTitle('Guided path not found')
  else setPageTitle(`${view.value.label}: ${entity.value.name} · ${path.value.title}`)
})

watch(() => [route.params.id, view.value?.step], async ([id, step], [previousId, previousStep]) => {
  if (id !== previousId || step === previousStep || !step) return
  await nextTick()
  heading.value?.focus()
})
</script>

<template lang="pug">
.stack.stack--loose(v-if="!path")
  header.stack
    h1 We could not find that guided path
    p.lede Nothing is called “{{ route.params.id }}”. It may have been renamed, or the link may be mistyped. These are the paths we have.
  PathCards(:paths="pathList()" :level="2")
  .cluster
    RouterLink.button(:to="PATHS_PATH") All guided paths
    RouterLink.button.button--secondary(:to="KB_PATH") Browse the knowledge base
.stack.stack--loose(v-else)
  Breadcrumbs(:crumbs="crumbs")
  header.stack
    p.eyebrow Guided path
    h1 {{ path.title }}
    p.lede {{ path.summary }}

  section.card.stack(aria-labelledby="step-heading")
    .stack.stack--tight
      p#step-progress-label {{ view.label }}
      progress.progress(:value="view.step" :max="view.length" aria-labelledby="step-progress-label" :aria-valuetext="view.label")
    .stack.stack--tight
      .cluster
        TypeBadge(:type="entity.type")
        EvidenceBadge(:grade="entity.evidence")
      h2#step-heading(ref="heading" tabindex="-1") {{ entity.name }}
      p.lede {{ entity.summary }}
    .stack.stack--tight
      h3 Why this step comes here
      p {{ view.current.why }}
    p
      RouterLink.button.button--secondary(:to="entityPath(entity.id)") Read the page for {{ entity.name }}
    nav.repel(aria-label="Move between steps")
      RouterLink.button.button--secondary(v-if="view.previous" :to="view.previous.to") Previous: {{ view.previous.entity.name }}
      span(v-else)
      RouterLink.button(v-if="view.next" :to="view.next.to") Next: {{ view.next.entity.name }}
      RouterLink.button(v-else :to="PATHS_PATH") End of the path: all guided paths

  section.stack(aria-labelledby="all-steps-heading")
    h2#all-steps-heading All {{ path.length }} steps
    ol.plain-list.stack.stack--tight
      li(v-for="item in path.steps" :key="item.id")
        strong(v-if="item.position === view.step" aria-current="step") {{ item.position }}. {{ item.entity.name }} (you are here)
        a(v-else :href="href(guidedPathPath(path.id, item.position))") {{ item.position }}. {{ item.entity.name }}
</template>
