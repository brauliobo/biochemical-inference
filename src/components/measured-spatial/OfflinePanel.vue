<script setup vapor>
import { computed } from 'vue'
import Facts from '../../ui/Facts.vue'
import Panel from '../../ui/Panel.vue'
import Toolbar from '../../ui/Toolbar.vue'
import { list } from '../../ui/format.js'

// Verify all 400 chunks for offline use, and re-check the local cache without
// the network.
const props = defineProps({
  status: { type: Object, required: true },
  completion: { type: Object, default: undefined },
  integrity: { type: Object, default: undefined },
  state: { type: String, required: true },
  busy: { type: Boolean, required: true }
})
const emit = defineEmits(['complete', 'check'])

const facts = computed(() => [
  { label: 'Offline complete', value: props.status.offlineComplete ? 'yes' : 'no' },
  { label: 'Encoded + decoded', value: props.completion?.encodedAndDecodedVerified ? '400 verified' : `${props.integrity?.verifiedDecodedChunks ?? 0} locally verified` },
  { label: 'Network during integrity', value: props.integrity?.networkAccess === false ? 'disabled' : 'not checked' },
  { label: 'Findings', value: list(props.integrity?.findings, 'none', ' ') }
])
</script>

<template lang="pug">
Panel(title="Verify every encoded and decoded chunk" title-id="offline-panel-title" eyebrow="Explicit artifact-offline closure" :level="3" flat)
  p Completion requests all missing coordinates and verifies all 400 descriptors. Integrity checks use local storage only and expose eviction or corruption.
  Toolbar(label="Offline verification")
    button.button(type="button" :disabled="busy" data-testid="measured-spatial-complete" @click="emit('complete')") {{ state === 'completing' ? 'Verifying 400 chunks…' : status.offlineComplete ? 'Reverify offline completion' : 'Complete atlas for offline use' }}
    button.button.button--secondary(type="button" :disabled="busy" data-testid="measured-spatial-integrity" @click="emit('check')") {{ state === 'checking' ? 'Checking local cache…' : 'Check local integrity without network' }}
  Facts(v-if="completion || integrity" data-testid="measured-spatial-offline-result" :items="facts")
</template>
