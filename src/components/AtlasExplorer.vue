<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { loadAtlasEntity, loadAtlasSubgraph, loadAtlasWorkspace } from '../api.js'

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
section.atlas-panel(aria-labelledby="atlas-title")
  .section-heading
    div
      p.kicker 05 · Context atlas
      h2#atlas-title MTHFR evidence atlas
    span.status-chip(:class="state") {{ state === 'loading' ? 'Verifying' : state === 'traversing' ? 'Traversing' : state === 'ready' ? 'Atlas pinned' : state === 'unknown' ? 'Unknown seed' : 'Unavailable' }}

  .atlas-loading(v-if="state === 'loading'" aria-live="polite") Verifying the independent atlas v2 release and loading {{ taxonName }} context…
  .alert.error(v-else-if="state === 'failed' && !workspace" role="alert")
    strong Context atlas unavailable
    p {{ message }}
    p The simulation release remains separate; no atlas facts are inferred from simulation data.
    button.secondary(type="button" @click="initialize") Retry atlas verification

  template(v-else-if="workspace")
    .atlas-provenance
      dl.provenance-grid
        div
          dt Atlas release
          dd {{ workspace.release.id }}
        div
          dt Independent SHA-256
          dd.digest {{ workspace.release.digest }}
        div
          dt Taxon context
          dd {{ taxonName }}
        div
          dt Verified inventory
          dd {{ workspace.detail.recordCounts.entities }} entities · {{ workspace.detail.recordCounts.claims }} claims
      p.source-note {{ workspace.detail.scientificScope }}

    form.atlas-controls(@submit.prevent="traverse")
      .atlas-seed
        label(for="atlas-seed") Seed CURIE or unique label
        input#atlas-seed(v-model="seed" list="atlas-seeds" autocomplete="off" aria-describedby="atlas-seed-help")
        datalist#atlas-seeds
          template(v-for="entity in seedOptions" :key="entity.id")
            option(:value="entity.id" :label="entity.name")
            option(:value="entity.name" :label="entity.id")
        small#atlas-seed-help Species-specific and taxon-neutral entities in the verified projection. Press Enter to traverse.
      div
        label(for="atlas-depth") Maximum depth
        input#atlas-depth(v-model.number="maxDepth" type="number" min="0" max="6" step="1")
      div
        label(for="atlas-nodes") Node limit
        input#atlas-nodes(v-model.number="maxNodes" type="number" min="1" max="100" step="1")
      button.run-button(type="submit" :disabled="state === 'traversing'") {{ state === 'traversing' ? 'Traversing…' : 'Traverse bounded graph' }}

    .atlas-state(v-if="state === 'traversing'" aria-live="polite") Loading a species-isolated bounded traversal; previous graph content is hidden.
    .alert.error(v-else-if="state === 'failed'" role="alert")
      strong Atlas traversal failed
      p {{ message }}
      button.secondary(type="button" @click="traverse") Retry traversal
    .atlas-unknown(v-else-if="state === 'unknown'" role="status")
      strong Unknown is not absent
      p {{ message }}

    .atlas-results(v-else-if="subgraph")
      .atlas-summary(role="status")
        strong {{ subgraph.entities.length }} typed entities · {{ subgraph.claims.length }} qualified claims
        span {{ subgraph.truncated ? `Traversal stopped at the ${subgraph.maxNodes}-node bound.` : `Complete within depth ${subgraph.maxDepth} and the ${subgraph.maxNodes}-node bound.` }}

      .atlas-columns
        section.atlas-card(aria-labelledby="atlas-entities-title")
          h3#atlas-entities-title Typed entities
          ul.atlas-entity-list
            li(v-for="entity in subgraph.entities" :key="entity.id")
              span.entity-kind {{ entity.entityType }} · {{ entity.taxonId ?? 'taxon-neutral' }}
              strong {{ entity.name }}
              code {{ entity.id }}

        section.atlas-card(aria-labelledby="atlas-claims-title")
          h3#atlas-claims-title Qualified claims
          p.atlas-empty(v-if="!subgraph.claims.length") No claims occur within this traversal bound. This is unknown beyond the bound, not evidence of absence.
          article.atlas-claim(v-for="claim in subgraph.claims" :key="claim.id")
            .claim-badges
              span(:class="`derivation-${claim.derivation}`") {{ claim.derivation }}
              span(:class="`polarity-${claim.polarity}`") {{ claim.polarity }}
            p
              strong {{ displayEntity(claim.subjectId) }}
              span.relation  {{ claim.relation.replaceAll('_', ' ') }}
              strong  {{ displayEntity(claim.objectId) }}
            small Taxon {{ claim.context.taxonId }} · tissue {{ claim.context.tissueId ?? 'unknown' }} · compartment {{ claim.context.compartmentId ?? 'unknown' }} · cell {{ claim.context.cellId ?? 'unknown' }}
            details.evidence-details
              summary Evidence lineage ({{ claim.evidenceIds.length }})
              ul
                li(v-for="evidenceId in claim.evidenceIds" :key="evidenceId")
                  a(v-if="evidenceById.get(evidenceId)" :href="evidenceById.get(evidenceId).url" target="_blank" rel="noreferrer") {{ evidenceById.get(evidenceId).citation }}
                  span(v-else) {{ evidenceId }} · unresolved in this bounded response
              p.evidence-classification This claim is {{ claim.derivation }} and {{ claim.polarity }}. Evidence records do not override that derivation.
            details.transformation-details(v-if="claim.transformationId && transformationById.get(claim.transformationId)")
              summary Inspect orthology transformation
              p
                code {{ transformationFor(claim.transformationId).id }}
              p {{ transformationFor(claim.transformationId).method }}
              ul
                li(v-for="pair in transformationFor(claim.transformationId).entityPairs" :key="`${pair.sourceId}-${pair.targetId}`") {{ pair.sourceId }} → {{ pair.targetId }}
              p.transformation-warning {{ transformationFor(claim.transformationId).limitations }}

      .atlas-columns.atlas-lower
        section.atlas-card(aria-labelledby="atlas-mappings-title")
          h3#atlas-mappings-title Identity mappings and ambiguity
          p.atlas-empty(v-if="!workspace.network.mappings.length") No identity mapping is asserted for this taxon projection; this is not evidence that identifiers are equivalent or absent.
          article.mapping-record(v-for="mapping in workspace.network.mappings" :key="mapping.id")
            .mapping-heading
              strong {{ mapping.status }} · {{ mapping.relation.replaceAll('_', ' ') }}
              code {{ mapping.id }}
            p {{ mapping.sourceId }} → {{ mapping.targetId ?? 'no selected target' }}
            p(v-if="mapping.candidateIds.length") Ambiguous candidates: {{ mapping.candidateIds.join(', ') }}
            small {{ mapping.rationale }}
          article.mapping-record(v-for="ambiguity in structuralAmbiguities" :key="ambiguity.sourceId")
            .mapping-heading
              strong unresolved · structural ambiguity
              code Typed entity structure
            p {{ ambiguity.sourceId }} → no selected isoform
            p Ambiguous candidates: {{ ambiguity.candidateIds.join(', ') }}
            small Multiple typed isoforms resolve in this verified release, while the taxon network projection supplies no selected identity target. This is not presented as an asserted mapping record.

        section.atlas-card(aria-labelledby="atlas-coverage-title")
          h3#atlas-coverage-title Coverage and measured gaps
          p.coverage-total {{ coverageCovered }} / {{ coverageTotal }} denominator targets covered across {{ coverage.length }} partitions.
          article.coverage-gap(v-for="gap in gaps" :key="gap.id")
            strong Unknown / measured gap · {{ gap.entityType }}
            span {{ gap.numerator }} / {{ gap.denominator }} covered
            p {{ gap.denominatorDefinition }}
            code {{ gap.gapIds.join(', ') }}
          p.atlas-empty(v-if="!gaps.length") No measured gaps are listed for this projection. Unmeasured scope remains unknown.

      section.atlas-card.atlas-limitations(aria-labelledby="atlas-limitations-title")
        h3#atlas-limitations-title Atlas limitations
        ul
          li(v-for="limitation in workspace.network.limitations" :key="limitation.id")
            strong {{ limitation.category }}
            span {{ limitation.statement }}
</template>
