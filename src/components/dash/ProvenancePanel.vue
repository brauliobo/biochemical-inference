<script setup vapor>
import { ref } from 'vue'
import { entityPath } from '../../kb/paths.js'
import Badge from '../../ui/Badge.vue'
import { uniqueId } from '../../ui/uid.js'
import RouterLink from '../../ui/RouterLink.vue'
import { formatNumber } from '../../viz/scale.js'
import { loadProvenance } from './provenance-sources.js'

// "Where do these numbers come from?": for each parameter id the value, its range, the source article
// (a link into the knowledge base), the locator inside the paper and the confidence, with an assumed /
// hypothesis flag. A native <details>, so it is keyboard operable; the literature tables load only when it opens.
//
//   ProvenancePanel(model="methylation" :ids="['km_gnmt_gly', 'km_bhmt_bet']")
const props = defineProps({
  model: { type: String, required: true },
  ids: { type: Array, required: true },
  title: { type: String, default: 'Where do these numbers come from?' }
})
const rows = ref([])
const state = ref('idle')
const heading = uniqueId('prov')
let started = false

async function open(event) {
  if (!event.target.open || started) return
  started = true
  state.value = 'loading'
  try {
    const sources = await loadProvenance(props.model)
    rows.value = (await Promise.all(props.ids.map((id) => sources.get(id)))).filter(Boolean)
    state.value = 'ready'
  } catch {
    state.value = 'failed'
  }
}
const range = (row) => (row.low === row.high ? 'fixed' : `${formatNumber(row.low)} to ${formatNumber(row.high)}`)
const articleName = (id) => id.replace(/^article:/, '')
</script>

<template lang="pug">
details.dash-prov(@toggle="open")
  summary {{ title }}
  div(:id="heading" aria-live="polite")
    p.muted(v-if="state === 'loading'") Loading the parameter sources.
    p.muted(v-else-if="state === 'failed'") The parameter sources could not be loaded.
    .data-table(v-else-if="state === 'ready'" role="region" tabindex="0" :aria-label="`${title} table`")
      table.dash-prov__table
        caption.visually-hidden Parameters, ranges and sources
        thead
          tr
            th(scope="col") Parameter
            th(scope="col") Value
            th(scope="col") Range
            th(scope="col") Source
            th(scope="col") Confidence
        tbody
          tr(v-for="row in rows" :key="row.id")
            th(scope="row")
              code {{ row.id }}
            td {{ formatNumber(row.value) }}{{ row.unit ? ` ${row.unit}` : '' }}
            td {{ range(row) }}
            td
              RouterLink(v-if="row.article" :to="entityPath(row.article)") {{ articleName(row.article) }}
              span.muted(v-else) no article
              small.dash-prov__locator(v-if="row.locator") {{ row.locator }}
              small.dash-prov__locator(v-else-if="row.note") {{ row.note }}
            td
              Badge(:label="row.confidence")
              Badge(v-if="row.assumed" label="Hypothesis / assumed" tone="warning")
</template>
