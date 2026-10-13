<script setup vapor>
import { computed } from 'vue'
import { getEntity, pathBetween } from '../../knowledge/index.js'
import { navigate, useRoute } from '../../router.js'
import PathSteps from './PathSteps.vue'
import SearchBox from './SearchBox.vue'

// "How is this connected to...?" The target is the `to` query parameter of the
// current page, so a result can be bookmarked or shared; the section is open
// whenever a target is set. Paths prefer to avoid articles (a shared citation is a
// weak connection) and fall back to allowing them.
const props = defineProps({ from: { type: String, required: true } })
const route = useRoute()

const target = computed(() => (route.query.to ? getEntity(route.query.to) : undefined))
const unknownTarget = computed(() => Boolean(route.query.to) && !target.value)
const path = computed(() => {
  if (!target.value || target.value.id === props.from) return null
  return pathBetween(props.from, target.value.id, { avoidTypes: ['article'] }) ?? pathBetween(props.from, target.value.id)
})
const origin = computed(() => getEntity(props.from))
const announcement = computed(() => {
  if (!target.value) return ''
  if (!path.value) return 'No connection found.'
  const steps = path.value.steps.length
  return `Connection found in ${steps} ${steps === 1 ? 'step' : 'steps'}.`
})

function setTarget(to) {
  const query = new URLSearchParams(route.query)
  if (to) query.set('to', to)
  else query.delete('to')
  const text = query.toString()
  navigate(text ? `${route.path}?${text}` : route.path, { replace: true })
}
</script>

<template lang="pug">
details.card.stack(:open="Boolean(route.query.to)")
  summary
    h2 How is {{ origin?.name }} connected to…?
  p.muted Pick any other entry to see the shortest chain of links between the two, with the relationship named at each step.
  SearchBox(mode="pick" label="Connect to" :exclude="from" placeholder="For example belching" :limit="6" @select="setTarget($event.id)")
  p.visually-hidden(role="status") {{ announcement }}
  div.stack(v-if="target")
    h3 {{ origin?.name }} to {{ target.name }}
    PathSteps(v-if="path" :path="path")
    p(v-else-if="target.id === from") That is this page. Choose a different entry.
    p.notice.notice--warning(v-else) No chain of links connects these two entries yet.
    button.button.button--secondary(type="button" @click="setTarget('')") Clear
  p.notice.notice--warning(v-else-if="unknownTarget") The entry in the link could not be found.
</template>
