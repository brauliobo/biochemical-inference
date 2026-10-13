<script setup vapor>
import { computed } from 'vue'
import Card from '../../ui/Card.vue'
import DataTable from '../../ui/DataTable.vue'
import Panel from '../../ui/Panel.vue'
import Pagination from '../../ui/Pagination.vue'
import SelectField from '../../ui/SelectField.vue'
import Badge from '../../ui/Badge.vue'

// Read the local verified records one page at a time (the mirror pages by
// signed cursor), and see how taxa, reactions and proteins link through the
// catalysis assertions.
const props = defineProps({
  detail: { type: Object, required: true },
  page: { type: Object, default: undefined },
  pageNumber: { type: Number, required: true },
  linked: { type: Object, required: true },
  loading: { type: Boolean, required: true },
  locked: { type: Boolean, required: true }
})
const recordType = defineModel('recordType', { type: String, required: true })
const emit = defineEmits(['previous', 'next'])

const TYPES = ['taxa', 'compounds', 'reactions', 'proteins', 'references', 'catalysis', 'limitations']
const collections = computed(() => TYPES.map((type) => ({ value: type, label: `${type} · ${props.detail.manifest.record_counts[type]}` })))
const links = computed(() => props.linked.catalysis.map((assertion) => ({
  assertion,
  taxon: props.linked.taxa.find((item) => item.id === assertion.taxon_id),
  reaction: props.linked.reactions.find((item) => item.id === assertion.reaction_id),
  protein: props.linked.proteins.find((item) => item.id === assertion.protein_id)
})))
const title = (item) => item.name ?? item.scientific_name ?? item.recommended_name ?? item.statement ?? item.citation ?? item.gene_symbol ?? item.evidence_class
</script>

<template lang="pug">
.stack
  Panel(title="Local records" title-id="data-plane-records-title" :level="3")
    .repel
      SelectField(id="data-plane-record-type" label="Local record collection" v-model="recordType" :options="collections" :disabled="locked")
      Pagination(label="Record pagination" :summary="loading ? 'Loading…' : `Page ${pageNumber}`" :can-previous="!locked && pageNumber > 1" :can-next="!locked && Boolean(page?.nextCursor)" @previous="emit('previous')" @next="emit('next')")
    DataTable(v-if="page" :caption="`${page.recordType} from the local verified mirror, sorted by ID`" :columns="['Identifier', 'Local record']" :busy="loading")
      tr(v-for="item in page.items" :key="item.id")
        th(scope="row")
          code {{ item.id }}
        td
          .cluster
            strong {{ title(item) }}
            span(v-if="item.formula") {{ item.formula }} · charge {{ item.charge }}
            span(v-if="item.taxon_id") taxon {{ item.taxon_id }}
            span(v-if="item.reaction_id") reaction {{ item.reaction_id }}
            span(v-if="item.protein_id") protein {{ item.protein_id }}

  Panel(title="Linked catalysis assertions" title-id="data-plane-links-title" eyebrow="Taxon / reaction / protein closure" :level="3")
    ul.plain-list.grid
      li(v-for="link in links" :key="link.assertion.id")
        Card
          div
            Badge(:label="`${link.assertion.evidence_class} curation`")
          p
            strong {{ link.protein?.gene_symbol }} · {{ link.protein?.recommended_name }}
          p
            code {{ link.protein?.id }}
          p {{ link.taxon?.scientific_name }} → {{ link.reaction?.id }}
          p.muted {{ link.assertion.evidence_code }} · {{ link.assertion.reference_ids.join(', ') }}
</template>
