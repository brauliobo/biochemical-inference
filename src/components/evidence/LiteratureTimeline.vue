<script setup vapor>
import { computed, ref } from 'vue'
import { TOPICS, timelineGroups, timelineItems, yearExtent } from '../../kb/evidence.js'
import { entityPath } from '../../kb/paths.js'
import { href, navigate } from '../../router.js'
import EmptyState from '../../ui/EmptyState.vue'
import SelectField from '../../ui/SelectField.vue'
import SliderField from '../../viz/SliderField.vue'
import Timeline from '../../viz/Timeline.vue'

// The literature on a timeline: one lane per study design, one marker per article. A topic menu and
// two year sliders brush the view (the lanes shrink to the designs that remain). Choosing a marker
// opens the article.
const props = defineProps({ articles: { type: Array, required: true } })

const extent = computed(() => yearExtent(props.articles))
const topic = ref('')
const from = ref(yearExtent(props.articles)[0])
const to = ref(yearExtent(props.articles)[1])
const low = computed(() => Math.min(from.value, to.value))
const high = computed(() => Math.max(from.value, to.value))
const items = computed(() => timelineItems(props.articles, { topic: topic.value, yearFrom: low.value, yearTo: high.value }, (id) => href(entityPath(id))))
const groups = computed(() => timelineGroups(items.value))
const topicOptions = computed(() => [{ value: '', label: 'All topics' }, ...TOPICS.map((entry) => ({ value: entry.id, label: entry.label }))])
const summary = computed(() => `${items.value.length} of ${props.articles.length} articles, ${low.value} to ${high.value}${topic.value ? `, topic ${TOPICS.find((entry) => entry.id === topic.value)?.short}` : ''}.`)
const year = (value) => String(value)
</script>

<template lang="pug">
.stack
  .grid
    SelectField(id="ev-tl-topic" label="Topic" v-model="topic" :options="topicOptions")
    SliderField(id="ev-tl-from" label="From year" :min="extent[0]" :max="extent[1]" :step="1" :format="year" v-model="from")
    SliderField(id="ev-tl-to" label="To year" :min="extent[0]" :max="extent[1]" :step="1" :format="year" v-model="to")
  p(role="status") {{ summary }}
  Timeline(v-if="items.length" id="ev-timeline" title="Articles by year and study design" :items="items" :groups="groups" @select="navigate(entityPath($event.id))")
  EmptyState(v-else) No article matches this topic and year range.
</template>
