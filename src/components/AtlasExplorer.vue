<script setup vapor>
import { computed, ref, watch } from 'vue'
import { loadAtlasEntity, loadAtlasSubgraph, loadAtlasWorkspace } from '../api.js'
import { errorMessage, useTask } from '../composables/useTask.js'
import Badge from '../ui/Badge.vue'
import Card from '../ui/Card.vue'
import Disclosure from '../ui/Disclosure.vue'
import EmptyState from '../ui/EmptyState.vue'
import ErrorNotice from '../ui/ErrorNotice.vue'
import Facts from '../ui/Facts.vue'
import InputField from '../ui/InputField.vue'
import LiveMessage from '../ui/LiveMessage.vue'
import Notice from '../ui/Notice.vue'
import Panel from '../ui/Panel.vue'
import { humanize } from '../ui/format.js'
import { statusTone } from '../ui/tone.js'
import AtlasCoverage from './atlas/AtlasCoverage.vue'
import AtlasMappings from './atlas/AtlasMappings.vue'

const props = defineProps({ taxonId: { type: Number, required: true } })

const STATUS_LABELS = { loading: 'Verifying', traversing: 'Traversing', ready: 'Atlas pinned', unknown: 'Unknown seed', failed: 'Unavailable' }
const defaultSeeds = { 9606: 'HGNC:7436', 10090: 'MGI:106639' }
const workspace = ref()
const subgraph = ref()
const seed = ref(defaultSeeds[props.taxonId])
const maxDepth = ref(4)
const maxNodes = ref(50)
const state = ref('loading')
const message = ref('')
const task = useTask()

const taxonName = computed(() => (props.taxonId === 9606 ? 'Human · Homo sapiens' : 'Mouse · Mus musculus'))
const seedOptions = computed(() => (workspace.value?.includedEntities ?? workspace.value?.network.entities ?? []).filter((entity) => !['compound', 'compartment', 'tissue'].includes(entity.entityType)))
const byId = (key) => computed(() => new Map((subgraph.value?.[key] ?? []).map((item) => [item.id, item])))
const entityById = byId('entities')
const evidenceById = byId('evidence')
const transformationById = byId('transformations')
const provenance = computed(() => [
  { label: 'Atlas release', value: workspace.value.release.id },
  { label: 'Independent SHA-256', value: workspace.value.release.digest, mono: true },
  { label: 'Taxon context', value: taxonName.value },
  { label: 'Verified inventory', value: `${workspace.value.detail.recordCounts.entities} entities · ${workspace.value.detail.recordCounts.claims} claims` }
])

function displayEntity(id) {
  const entity = entityById.value.get(id)
  return entity ? `${entity.name} (${entity.id})` : id
}

// The claim badges print a derivation or a polarity; the tone only reinforces
// it. The `derivation-*` and `polarity-*` classes are stable test hooks.
const derivationTone = { direct: 'success', 'orthology-transferred': 'warning' }
const polarityTone = { contradicting: 'danger' }

function resolveSeed() {
  const query = seed.value.trim().toLowerCase()
  if (!query) return undefined
  const exact = seedOptions.value.find((entity) => entity.id.toLowerCase() === query || entity.name.toLowerCase() === query || entity.symbol?.toLowerCase() === query)
  if (exact) return exact
  const matches = seedOptions.value.filter((entity) => entity.name.toLowerCase().includes(query))
  return matches.length === 1 ? matches[0] : undefined
}

const fail = (fallback) => (error) => {
  state.value = 'failed'
  message.value = errorMessage(error, fallback)
}

async function traverse() {
  if (!workspace.value) return
  const selected = resolveSeed()
  if (!selected) {
    task.cancel()
    subgraph.value = undefined
    state.value = 'unknown'
    message.value = 'Unknown or ambiguous seed in this taxon context. No entity was substituted; choose an included CURIE or a unique label.'
    return
  }
  seed.value = selected.id
  subgraph.value = undefined
  state.value = 'traversing'
  message.value = ''
  await task.run(async ({ signal, fresh }) => {
    fresh(await loadAtlasEntity(workspace.value.release, selected.id, props.taxonId, signal))
    subgraph.value = fresh(await loadAtlasSubgraph(workspace.value.release, selected.id, props.taxonId, maxDepth.value, maxNodes.value, signal))
    state.value = 'ready'
  }, { fail: fail('The bounded atlas traversal failed.') })
}

async function initialize() {
  workspace.value = undefined
  subgraph.value = undefined
  seed.value = defaultSeeds[props.taxonId]
  state.value = 'loading'
  message.value = ''
  const loaded = await task.run(async ({ signal, fresh }) => {
    workspace.value = fresh(await loadAtlasWorkspace(props.taxonId, signal))
    return true
  }, { fail: fail('The contextual atlas could not be loaded.') })
  if (loaded) await traverse()
}

watch(() => props.taxonId, initialize, { immediate: true })
</script>

<template lang="pug">
Panel.atlas-panel(title="MTHFR evidence atlas" title-id="atlas-title" eyebrow="05 · Context atlas" :status="STATUS_LABELS[state]" :tone="statusTone(state)")
  LiveMessage(visible :text="state === 'loading' ? `Verifying the independent atlas v2 release and loading ${taxonName} context…` : ''")
  ErrorNotice(v-if="state === 'failed' && !workspace" title="Context atlas unavailable" :message="message" retry-label="Retry atlas verification" @retry="initialize")
    p The simulation release remains separate; no atlas facts are inferred from simulation data.

  template(v-else-if="workspace")
    .atlas-provenance.stack.stack--tight
      Facts(:items="provenance")
      p.muted {{ workspace.detail.scientificScope }}

    form.grid.grid--end(@submit.prevent="traverse")
      InputField(id="atlas-seed" label="Seed CURIE or unique label" v-model="seed" list="atlas-seeds" autocomplete="off" hint="Species-specific and taxon-neutral entities in the verified projection. Press Enter to traverse.")
      datalist#atlas-seeds
        template(v-for="entity in seedOptions" :key="entity.id")
          option(:value="entity.id" :label="entity.name")
          option(:value="entity.name" :label="entity.id")
      InputField(id="atlas-depth" label="Maximum depth" type="number" v-model="maxDepth" min="0" max="6" step="1")
      InputField(id="atlas-nodes" label="Node limit" type="number" v-model="maxNodes" min="1" max="100" step="1")
      button.button(type="submit" :disabled="state === 'traversing'") {{ state === 'traversing' ? 'Traversing…' : 'Traverse bounded graph' }}

    LiveMessage(v-if="state === 'traversing'" visible text="Loading a species-isolated bounded traversal; previous graph content is hidden.")
    ErrorNotice(v-else-if="state === 'failed'" title="Atlas traversal failed" :message="message" retry-label="Retry traversal" @retry="traverse")
    Notice(v-else-if="state === 'unknown'" tone="warning" role="status" title="Unknown is not absent")
      p {{ message }}

    .stack(v-else-if="subgraph")
      .notice.repel(role="status")
        strong {{ subgraph.entities.length }} typed entities · {{ subgraph.claims.length }} qualified claims
        span {{ subgraph.truncated ? `Traversal stopped at the ${subgraph.maxNodes}-node bound.` : `Complete within depth ${subgraph.maxDepth} and the ${subgraph.maxNodes}-node bound.` }}

      .sidebar
        Panel(title="Typed entities" title-id="atlas-entities-title" :level="3" flat)
          ul.atlas-entity-list.plain-list.stack
            li.stack.stack--tight(v-for="entity in subgraph.entities" :key="entity.id")
              p.eyebrow {{ entity.entityType }} · {{ entity.taxonId ?? 'taxon-neutral' }}
              p
                strong {{ entity.name }}
              p
                code {{ entity.id }}

        Panel(title="Qualified claims" title-id="atlas-claims-title" :level="3" flat)
          EmptyState(v-if="!subgraph.claims.length") No claims occur within this traversal bound. This is unknown beyond the bound, not evidence of absence.
          Card(v-for="claim in subgraph.claims" :key="claim.id")
            .cluster
              Badge(:class="`derivation-${claim.derivation}`" :label="claim.derivation" :tone="derivationTone[claim.derivation]")
              Badge(:class="`polarity-${claim.polarity}`" :label="claim.polarity" :tone="polarityTone[claim.polarity]")
            p
              strong {{ displayEntity(claim.subjectId) }}
              span {{ ` ${humanize(claim.relation)} ` }}
              strong {{ displayEntity(claim.objectId) }}
            small.muted Taxon {{ claim.context.taxonId }} · tissue {{ claim.context.tissueId ?? 'unknown' }} · compartment {{ claim.context.compartmentId ?? 'unknown' }} · cell {{ claim.context.cellId ?? 'unknown' }}
            Disclosure(:summary="`Evidence lineage (${claim.evidenceIds.length})`")
              ul
                li(v-for="evidenceId in claim.evidenceIds" :key="evidenceId")
                  a(v-if="evidenceById.get(evidenceId)" :href="evidenceById.get(evidenceId).url" target="_blank" rel="noreferrer") {{ evidenceById.get(evidenceId).citation }}
                  span(v-else) {{ evidenceId }} · unresolved in this bounded response
              p.muted This claim is {{ claim.derivation }} and {{ claim.polarity }}. Evidence records do not override that derivation.
            Disclosure.transformation-details(v-if="claim.transformationId && transformationById.get(claim.transformationId)" summary="Inspect orthology transformation")
              p
                code {{ transformationById.get(claim.transformationId).id }}
              p {{ transformationById.get(claim.transformationId).method }}
              ul
                li(v-for="pair in transformationById.get(claim.transformationId).entityPairs" :key="`${pair.sourceId}-${pair.targetId}`") {{ pair.sourceId }} → {{ pair.targetId }}
              Notice(tone="warning") {{ transformationById.get(claim.transformationId).limitations }}

      .grid
        AtlasMappings(:workspace="workspace")
        AtlasCoverage(:workspace="workspace")

      Panel(title="Atlas limitations" title-id="atlas-limitations-title" :level="3" flat)
        ul.stack.stack--tight
          li(v-for="limitation in workspace.network.limitations" :key="limitation.id")
            strong {{ limitation.category }}
            p {{ limitation.statement }}
</template>
