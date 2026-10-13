<script setup vapor>
import { computed } from 'vue'
import Badge from '../../ui/Badge.vue'
import DataTable from '../../ui/DataTable.vue'
import InputField from '../../ui/InputField.vue'
import Pagination from '../../ui/Pagination.vue'
import Panel from '../../ui/Panel.vue'
import SelectField from '../../ui/SelectField.vue'
import { plural } from '../../ui/format.js'

// Queue and searchable history of every attempt, filtered on immutable
// revision metadata and paged by explicit offset.
const props = defineProps({
  history: { type: Object, required: true },
  filters: { type: Object, required: true },
  modelIds: { type: Array, required: true }
})
const emit = defineEmits(['refresh', 'inspect', 'previous', 'next'])

const STATUSES = [['', 'All'], ['queued', 'Queued'], ['running', 'Running'], ['successful', 'Successful'], ['failed', 'Failed'], ['resource-exhausted', 'Resource exhausted'], ['cancelled', 'Cancelled']].map(([value, label]) => ({ value, label }))
const TAXA = [{ value: '', label: 'All' }, { value: 'NCBITaxon:9606', label: 'Human' }, { value: 'NCBITaxon:10090', label: 'Mouse' }]
const models = computed(() => [{ value: '', label: 'All' }, ...props.modelIds.map((id) => ({ value: id, label: id }))])
const start = computed(() => (props.history.total === 0 ? 0 : props.history.offset + 1))
const end = computed(() => Math.min(props.history.offset + props.history.items.length, props.history.total))
const word = (item) => item.attempt.outcome ?? item.attempt.state
</script>

<template lang="pug">
Panel(title="Queue and searchable history" title-id="workspace-history-title" :level="3")
  template(#actions)
    button.button.button--secondary(type="button" @click="emit('refresh', true)") Refresh
  p.muted {{ plural(history.total, 'attempt') }}. Filters apply to immutable revision metadata.
  form.stack(aria-label="History filters" @submit.prevent="emit('refresh', true)")
    .grid
      SelectField(id="history-status" label="Status" v-model="filters.status" :options="STATUSES")
      SelectField(id="history-model" label="Model" v-model="filters.model" :options="models")
      SelectField(id="history-taxon" label="Taxon" v-model="filters.taxon" :options="TAXA")
      InputField(id="history-tissue" label="Tissue" v-model="filters.tissue" placeholder="UBERON:...")
      InputField(id="history-release" label="Release" v-model="filters.release" placeholder="release id")
    div
      button.button.button--secondary(type="submit") Apply filters
  DataTable(caption="Durable run attempts" :columns="['Experiment', 'Attempt', 'Kind', 'State / outcome', 'Context']" :count="history.items.length" empty-text="No attempts match these filters.")
    tr(v-for="item in history.items" :key="item.attempt.attemptId")
      th(scope="row")
        button.button.button--link(type="button" @click="emit('inspect', item.attempt.attemptId)") {{ item.experimentName }}
      td
        code {{ item.attempt.attemptId }}
      td {{ item.attempt.kind }}{{ item.attempt.restartMode ? ' · from specification' : '' }}
      td
        Badge(:status="word(item)")
      td {{ item.taxonId }}{{ item.tissueId ? ` · ${item.tissueId}` : '' }}
  Pagination(label="History pagination" :summary="`Showing ${start}–${end} of ${history.total}`" previous-label="Previous page" next-label="Next page" :can-previous="history.offset > 0" :can-next="history.offset + history.items.length < history.total" @previous="emit('previous')" @next="emit('next')")
</template>
