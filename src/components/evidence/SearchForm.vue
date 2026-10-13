<script setup vapor>
import InputField from '../../ui/InputField.vue'

// The evidence query: identifiers or text, optionally with the local vector
// channel. Ranking is exact and BM25 unless the vector channel is requested.
defineProps({ searching: { type: Boolean, required: true } })
const query = defineModel('query', { type: String, required: true })
const useVector = defineModel('useVector', { type: Boolean, required: true })
const emit = defineEmits(['search', 'selection'])
</script>

<template lang="pug">
form.stack(aria-label="Evidence search" @submit.prevent="emit('search')")
  InputField(id="evidence-query" label="PMID, PMCID, DOI, ontology ID, or text" type="search" v-model="query" maxlength="500" autocomplete="off" hint="Search works with exact and BM25 ranking when vectors are off.")
  InputField(id="evidence-vector" label="Add local Ollama vector rank" type="checkbox" v-model="useVector")
  .cluster
    button.button.button--secondary(type="button" @click="emit('selection')") Use workbench selection
    button.button(type="submit" :disabled="searching") {{ searching ? 'Searching…' : 'Search evidence' }}
</template>
