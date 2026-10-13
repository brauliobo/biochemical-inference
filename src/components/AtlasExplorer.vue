<script setup vapor>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { loadAtlasEntity, loadAtlasSubgraph, loadAtlasWorkspace } from '../api.js'
import Metric from './ui/Metric.vue'
import Section from './ui/Section.vue'
import { statusTone } from './ui/tone.js'

const props = defineProps({ taxonId: { type: Number, required: true } })

const defaultSeeds = { 9606: 'HGNC:7436', 10090: 'MGI:106639' }
const workspace = ref()
const subgraph = ref()
const seed = ref(defaultSeeds[props.taxonId])
const maxDepth = ref(4)
const maxNodes = ref(50)
const state = ref('loading')
const message = ref('')
let generation = 0
let controller

const statusLabel = computed(() => state.value === 'loading' ? 'Verifying' : state.value === 'traversing' ? 'Traversing' : state.value === 'ready' ? 'Atlas pinned' : state.value === 'unknown' ? 'Unknown seed' : 'Unavailable')
const taxonName = computed(() => props.taxonId === 9606 ? 'Human · Homo sapiens' : 'Mouse · Mus musculus')
const seedOptions = computed(() => (workspace.value?.includedEntities ?? workspace.value?.network.entities ?? []).filter((entity) => !['compound', 'compartment', 'tissue'].includes(entity.entityType)))
const entityById = computed(() => new Map((subgraph.value?.entities ?? []).map((entity) => [entity.id, entity])))
const evidenceById = computed(() => new Map((subgraph.value?.evidence ?? []).map((item) => [item.id, item])))
const transformationById = computed(() => new Map((subgraph.value?.transformations ?? []).map((item) => [item.id, item])))
const coverage = computed(() => workspace.value?.coverage.items ?? [])
const coverageTotal = computed(() => coverage.value.reduce((total, item) => total + item.denominator, 0))
const coverageCovered = computed(() => coverage.value.reduce((total, item) => total + item.numerator, 0))
const gaps = computed(() => coverage.value.filter((item) => item.evidenceClass === 'uncovered' || item.gapIds.length))
const structuralAmbiguities = computed(() => {
  if (!workspace.value || workspace.value.network.mappings.some((mapping) => mapping.status === 'ambiguous')) return []
  const entities = workspace.value.includedEntities ?? workspace.value.network.entities
  const byProtein = new Map()
  for (const entity of entities.filter((item) => item.entityType === 'isoform')) {
    byProtein.set(entity.proteinId, [...(byProtein.get(entity.proteinId) ?? []), entity.id])
  }
  return [...byProtein.entries()]
    .filter(([, candidateIds]) => candidateIds.length > 1)
    .map(([sourceId, candidateIds]) => ({ sourceId, candidateIds: candidateIds.sort() }))
})

function isAbort(error) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function displayEntity(id) {
  const entity = entityById.value.get(id)
  return entity ? `${entity.name} (${entity.id})` : id
}

function transformationFor(id) {
  return transformationById.value.get(id)
}

// The claim badges print a derivation or a polarity; the tone only reinforces
// it. The `derivation-*` and `polarity-*` classes are stable test hooks.
function claimBadge(kind, value) {
  const tone = kind === 'derivation'
    ? { direct: 'success', 'orthology-transferred': 'warning' }[value]
    : { contradicting: 'danger' }[value]
  return ['badge', `${kind}-${value}`, tone ? `badge--${tone}` : '']
}

function resolveSeed() {
  const query = seed.value.trim().toLowerCase()
  if (!query) return undefined
  const exact = seedOptions.value.find((entity) => entity.id.toLowerCase() === query || entity.name.toLowerCase() === query || entity.symbol?.toLowerCase() === query)
  if (exact) return exact
  const matches = seedOptions.value.filter((entity) => entity.name.toLowerCase().includes(query))
  return matches.length === 1 ? matches[0] : undefined
}

async function traverse() {
  if (!workspace.value) return
  const selected = resolveSeed()
  if (!selected) {
    subgraph.value = undefined
    state.value = 'unknown'
    message.value = 'Unknown or ambiguous seed in this taxon context. No entity was substituted; choose an included CURIE or a unique label.'
    return
  }
  seed.value = selected.id
  const requestGeneration = ++generation
  controller?.abort()
  controller = new AbortController()
  subgraph.value = undefined
  state.value = 'traversing'
  message.value = ''
  try {
    await loadAtlasEntity(workspace.value.release, selected.id, props.taxonId, controller.signal)
    const loaded = await loadAtlasSubgraph(workspace.value.release, selected.id, props.taxonId, maxDepth.value, maxNodes.value, controller.signal)
    if (requestGeneration !== generation) return
    subgraph.value = loaded
    state.value = 'ready'
  } catch (error) {
    if (requestGeneration !== generation || isAbort(error)) return
    state.value = 'failed'
    message.value = error instanceof Error ? error.message : 'The bounded atlas traversal failed.'
  }
}

async function initialize() {
  const requestGeneration = ++generation
  controller?.abort()
  controller = new AbortController()
  workspace.value = undefined
  subgraph.value = undefined
  seed.value = defaultSeeds[props.taxonId]
  state.value = 'loading'
  message.value = ''
  try {
    const loaded = await loadAtlasWorkspace(props.taxonId, controller.signal)
    if (requestGeneration !== generation) return
    workspace.value = loaded
    await traverse()
  } catch (error) {
    if (requestGeneration !== generation || isAbort(error)) return
    state.value = 'failed'
    message.value = error instanceof Error ? error.message : 'The contextual atlas could not be loaded.'
  }
}

watch(() => props.taxonId, initialize, { immediate: true })
onBeforeUnmount(() => controller?.abort())
</script>

<template lang="pug">
Section.atlas-panel(title="MTHFR evidence atlas" title-id="atlas-title" eyebrow="05 · Context atlas" :status="statusLabel" :tone="statusTone(state)")
  p.muted(v-if="state === 'loading'" role="status") Verifying the independent atlas v2 release and loading {{ taxonName }} context…
  .notice.notice--danger.stack.stack--tight(v-else-if="state === 'failed' && !workspace" role="alert")
    strong Context atlas unavailable
    p {{ message }}
    p The simulation release remains separate; no atlas facts are inferred from simulation data.
    button.button.button--secondary(type="button" @click="initialize") Retry atlas verification

  template(v-else-if="workspace")
    .atlas-provenance.stack.stack--tight
      dl.metrics
        Metric(label="Atlas release" :value="workspace.release.id")
        Metric(label="Independent SHA-256" :value="workspace.release.digest" mono)
        Metric(label="Taxon context" :value="taxonName")
        Metric(label="Verified inventory" :value="`${workspace.detail.recordCounts.entities} entities · ${workspace.detail.recordCounts.claims} claims`")
      p.muted {{ workspace.detail.scientificScope }}

    form.grid.grid--end(@submit.prevent="traverse")
      .form
        label(for="atlas-seed") Seed CURIE or unique label
        input#atlas-seed(v-model="seed" list="atlas-seeds" autocomplete="off" aria-describedby="atlas-seed-help")
        datalist#atlas-seeds
          template(v-for="entity in seedOptions" :key="entity.id")
            option(:value="entity.id" :label="entity.name")
            option(:value="entity.name" :label="entity.id")
        small#atlas-seed-help Species-specific and taxon-neutral entities in the verified projection. Press Enter to traverse.
      .form
        label(for="atlas-depth") Maximum depth
        input#atlas-depth(v-model.number="maxDepth" type="number" min="0" max="6" step="1")
      .form
        label(for="atlas-nodes") Node limit
        input#atlas-nodes(v-model.number="maxNodes" type="number" min="1" max="100" step="1")
      button.button(type="submit" :disabled="state === 'traversing'") {{ state === 'traversing' ? 'Traversing…' : 'Traverse bounded graph' }}

    p.muted(v-if="state === 'traversing'" role="status") Loading a species-isolated bounded traversal; previous graph content is hidden.
    .notice.notice--danger.stack.stack--tight(v-else-if="state === 'failed'" role="alert")
      strong Atlas traversal failed
      p {{ message }}
      button.button.button--secondary(type="button" @click="traverse") Retry traversal
    .notice.notice--warning.stack.stack--tight(v-else-if="state === 'unknown'" role="status")
      strong Unknown is not absent
      p {{ message }}

    .stack(v-else-if="subgraph")
      .notice.repel(role="status")
        strong {{ subgraph.entities.length }} typed entities · {{ subgraph.claims.length }} qualified claims
        span {{ subgraph.truncated ? `Traversal stopped at the ${subgraph.maxNodes}-node bound.` : `Complete within depth ${subgraph.maxDepth} and the ${subgraph.maxNodes}-node bound.` }}

      .sidebar
        Section(title="Typed entities" title-id="atlas-entities-title" :level="3" flat)
          ul.atlas-entity-list.plain-list.stack
            li.stack.stack--tight(v-for="entity in subgraph.entities" :key="entity.id")
              p.eyebrow {{ entity.entityType }} · {{ entity.taxonId ?? 'taxon-neutral' }}
              p
                strong {{ entity.name }}
              p
                code {{ entity.id }}

        Section(title="Qualified claims" title-id="atlas-claims-title" :level="3" flat)
          p.muted(v-if="!subgraph.claims.length") No claims occur within this traversal bound. This is unknown beyond the bound, not evidence of absence.
          article.card.stack.stack--tight(v-for="claim in subgraph.claims" :key="claim.id")
            .cluster
              span(:class="claimBadge('derivation', claim.derivation)") {{ claim.derivation }}
              span(:class="claimBadge('polarity', claim.polarity)") {{ claim.polarity }}
            p
              strong {{ displayEntity(claim.subjectId) }}
              span {{ ` ${claim.relation.replaceAll('_', ' ')} ` }}
              strong {{ displayEntity(claim.objectId) }}
            small.muted Taxon {{ claim.context.taxonId }} · tissue {{ claim.context.tissueId ?? 'unknown' }} · compartment {{ claim.context.compartmentId ?? 'unknown' }} · cell {{ claim.context.cellId ?? 'unknown' }}
            details.stack.stack--tight
              summary Evidence lineage ({{ claim.evidenceIds.length }})
              ul
                li(v-for="evidenceId in claim.evidenceIds" :key="evidenceId")
                  a(v-if="evidenceById.get(evidenceId)" :href="evidenceById.get(evidenceId).url" target="_blank" rel="noreferrer") {{ evidenceById.get(evidenceId).citation }}
                  span(v-else) {{ evidenceId }} · unresolved in this bounded response
              p.muted This claim is {{ claim.derivation }} and {{ claim.polarity }}. Evidence records do not override that derivation.
            details.transformation-details.stack.stack--tight(v-if="claim.transformationId && transformationById.get(claim.transformationId)")
              summary Inspect orthology transformation
              p
                code {{ transformationFor(claim.transformationId).id }}
              p {{ transformationFor(claim.transformationId).method }}
              ul
                li(v-for="pair in transformationFor(claim.transformationId).entityPairs" :key="`${pair.sourceId}-${pair.targetId}`") {{ pair.sourceId }} → {{ pair.targetId }}
              p.notice.notice--warning {{ transformationFor(claim.transformationId).limitations }}

      .grid
        Section(title="Identity mappings and ambiguity" title-id="atlas-mappings-title" :level="3" flat)
          p.muted(v-if="!workspace.network.mappings.length") No identity mapping is asserted for this taxon projection; this is not evidence that identifiers are equivalent or absent.
          article.card.stack.stack--tight(v-for="mapping in workspace.network.mappings" :key="mapping.id")
            .repel
              strong {{ mapping.status }} · {{ mapping.relation.replaceAll('_', ' ') }}
              code {{ mapping.id }}
            p {{ mapping.sourceId }} → {{ mapping.targetId ?? 'no selected target' }}
            p(v-if="mapping.candidateIds.length") Ambiguous candidates: {{ mapping.candidateIds.join(', ') }}
            small.muted {{ mapping.rationale }}
          article.card.stack.stack--tight(v-for="ambiguity in structuralAmbiguities" :key="ambiguity.sourceId")
            .repel
              strong unresolved · structural ambiguity
              code Typed entity structure
            p {{ ambiguity.sourceId }} → no selected isoform
            p Ambiguous candidates: {{ ambiguity.candidateIds.join(', ') }}
            small.muted Multiple typed isoforms resolve in this verified release, while the taxon network projection supplies no selected identity target. This is not presented as an asserted mapping record.

        Section(title="Coverage and measured gaps" title-id="atlas-coverage-title" :level="3" flat)
          p
            strong {{ coverageCovered }} / {{ coverageTotal }} denominator targets covered across {{ coverage.length }} partitions.
          article.notice.notice--warning.stack.stack--tight(v-for="gap in gaps" :key="gap.id")
            p
              strong Unknown / measured gap · {{ gap.entityType }}
            p {{ gap.numerator }} / {{ gap.denominator }} covered
            p {{ gap.denominatorDefinition }}
            p
              code {{ gap.gapIds.join(', ') }}
          p.muted(v-if="!gaps.length") No measured gaps are listed for this projection. Unmeasured scope remains unknown.

      Section(title="Atlas limitations" title-id="atlas-limitations-title" :level="3" flat)
        ul.stack.stack--tight
          li(v-for="limitation in workspace.network.limitations" :key="limitation.id")
            strong {{ limitation.category }}
            p {{ limitation.statement }}
</template>
