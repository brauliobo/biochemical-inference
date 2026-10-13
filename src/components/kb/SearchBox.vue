<script setup vapor>
import { computed, ref, watch } from 'vue'
import { knowledgeModule, loadKnowledge } from '../../kb/knowledge-lazy.js'
import { entityPath } from '../../kb/paths.js'
import { uniqueId } from '../../kb/uid.js'
import { navigate } from '../../router.js'
import RouterLink from '../../ui/RouterLink.vue'
import Badge from './Badge.vue'
import EvidenceBadge from './EvidenceBadge.vue'

// Client-side search over the whole knowledge base. Results are a plain list of
// links (no custom widget): type, press Enter to open the best match, or press
// the Down arrow to move onto the results and use Up/Down, Enter, Escape.
//
//   mode "navigate"  results are links to entity pages; Enter opens the first
//   mode "pick"      results are buttons that emit `select` with the result
//                    (used where the user chooses a second entity)
//
// The search engine is loaded on first focus or keystroke (see kb/knowledge-lazy.js),
// so pages that show a search box do not pay for the data up front.
const props = defineProps({
  label: { type: String, default: 'Search the knowledge base' },
  mode: { type: String, default: 'navigate' },
  initialQuery: { type: String, default: '' },
  placeholder: { type: String, default: 'A name, an abbreviation or a topic' },
  limit: { type: Number, default: 8 },
  exclude: { type: String, default: '' }
})
const emit = defineEmits(['select'])

const inputId = uniqueId('search')
const query = ref(props.initialQuery)
const list = ref()
const input = ref()

const typed = computed(() => query.value.trim().length > 0)
const loading = computed(() => typed.value && !knowledgeModule.value)
const results = computed(() => {
  if (!typed.value || !knowledgeModule.value) return []
  return knowledgeModule.value.find(query.value, { limit: props.limit + 1 })
    .filter((result) => result.id !== props.exclude)
    .slice(0, props.limit)
    .map((result) => ({ ...result, note: result.matched === 'alias' ? `Also known as ${result.alias}` : undefined }))
})
const status = computed(() => {
  if (!typed.value) return ''
  if (loading.value) return 'Loading search'
  const count = results.value.length
  return count ? `${count} ${count === 1 ? 'result' : 'results'}` : 'No results'
})

watch(typed, (value) => value && loadKnowledge(), { immediate: true })

const targets = () => [...(list.value?.querySelectorAll('a, button') ?? [])]

function choose(result) {
  if (props.mode === 'pick') emit('select', result)
  else navigate(entityPath(result.id))
}

async function submit() {
  await loadKnowledge()
  if (results.value.length) choose(results.value[0])
}

function fromInput(event) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    targets()[0]?.focus()
  }
}

function fromResults(event) {
  const items = targets()
  const at = items.indexOf(document.activeElement)
  if (event.key === 'ArrowDown') items[Math.min(at + 1, items.length - 1)]?.focus()
  else if (event.key === 'ArrowUp') (at <= 0 ? input.value : items[at - 1])?.focus()
  else if (event.key === 'Escape') input.value?.focus()
  else return
  event.preventDefault()
}
</script>

<template lang="pug">
form.stack.stack--tight(:role="mode === 'navigate' ? 'search' : null" :aria-label="mode === 'navigate' ? label : null" @submit.prevent="submit")
  label(:for="inputId") {{ label }}
  .cluster
    input.grow(:id="inputId" ref="input" type="search" v-model="query" autocomplete="off" :placeholder="placeholder" @focus="loadKnowledge" @keydown="fromInput")
    button.button(type="submit") {{ mode === 'pick' ? 'Choose best match' : 'Open best match' }}
  p.visually-hidden(role="status") {{ status }}
  ul.plain-list.stack.stack--tight(v-if="results.length" ref="list" @keydown="fromResults")
    li.stack.stack--tight(v-for="result in results" :key="result.id")
      template(v-if="mode === 'pick'")
        button.button.button--secondary(type="button" @click="choose(result)") {{ result.name }} ({{ result.typeLabel }})
      .cluster(v-else)
        RouterLink(:to="entityPath(result.id)") {{ result.name }}
        Badge(:label="result.typeLabel")
        EvidenceBadge(:grade="result.evidence")
      p.muted(v-if="result.note") {{ result.note }}
      p.muted(v-if="mode !== 'pick'") {{ result.summary }}
  p.muted(v-else-if="loading") Loading search…
  p.muted(v-else-if="typed") No entries match “{{ query }}”. Try a shorter word or an abbreviation such as GNMT.
</template>
