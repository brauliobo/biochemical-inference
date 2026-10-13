<script setup vapor>
import { computed } from 'vue'
import ErrorNotice from '../../ui/ErrorNotice.vue'
import Facts from '../../ui/Facts.vue'
import LiveMessage from '../../ui/LiveMessage.vue'
import Panel from '../../ui/Panel.vue'
import BuildProvenance from '../BuildProvenance.vue'

// Section 01: which verified release and model the simulation is pinned to.
const props = defineProps({
  state: { type: String, required: true },
  message: { type: String, default: '' },
  release: { type: Object, default: undefined },
  model: { type: Object, default: undefined },
  network: { type: Object, default: undefined },
  provenance: { type: Object, default: undefined },
  provenanceState: { type: String, required: true },
  provenanceError: { type: String, default: '' }
})
const emit = defineEmits(['retry', 'retry-provenance'])

const statusLabel = computed(() => (props.state === 'loading' ? 'Loading' : props.state === 'incompatible' ? 'Incompatible' : 'Digest pinned'))
const statusTone = computed(() => (props.state === 'incompatible' ? 'warning' : props.state === 'loading' ? '' : 'success'))
const pins = computed(() => [
  { label: 'Release', value: props.release.id },
  { label: 'SHA-256 digest', value: props.release.digest, mono: true },
  { label: 'Knowledge source', value: props.release.source === 'bundled-demonstration' ? 'Bundled pinned demonstration' : 'biochemical-db API' },
  { label: 'Model / engine', value: `${props.model.version} / ${props.model.engineVersion}` }
])
</script>

<template lang="pug">
Panel(title="Verified knowledge workspace" title-id="knowledge-title" eyebrow="01 · Provenance" :status="statusLabel" :tone="statusTone")
  LiveMessage(visible :text="state === 'loading' && !network ? 'Loading release, model, and taxon network…' : ''")
  ErrorNotice(v-if="state === 'incompatible'" title="Simulation disabled" :message="message" retry-label="Retry compatibility check" @retry="emit('retry')")
  template(v-else-if="release && model")
    Facts(data-testid="release-pins" :items="pins")
    p.muted Curated network evidence is kept separate from model-only concentrations and kinetics.
    BuildProvenance(:provenance="provenance" :status="provenanceState" :error="provenanceError" @retry="emit('retry-provenance')")
</template>
