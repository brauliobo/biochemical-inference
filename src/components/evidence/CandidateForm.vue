<script setup vapor>
import Card from '../../ui/Card.vue'
import ErrorNotice from '../../ui/ErrorNotice.vue'
import Field from '../../ui/Field.vue'
import LiveMessage from '../../ui/LiveMessage.vue'
import Notice from '../../ui/Notice.vue'
import { list, plural } from '../../ui/format.js'

// Review-only extraction of one candidate assertion from the selected spans.
// The output is never trusted knowledge and cannot enter the atlas or a release.
defineProps({
  selectedCount: { type: Number, required: true },
  state: { type: String, required: true },
  message: { type: String, default: '' },
  candidate: { type: Object, default: undefined },
  canExtract: { type: Boolean, required: true }
})
const instruction = defineModel('instruction', { type: String, required: true })
const emit = defineEmits(['extract'])

const pending = (state) => (state === 'extracting' ? 'Generating an unreviewed candidate from the selected spans…' : state === 'loading' ? 'Loading the unreviewed candidate…' : '')
</script>

<template lang="pug">
.stack
  form.stack(aria-label="Candidate extraction" @submit.prevent="emit('extract')")
    Notice(tone="warning" role="note" title="Unreviewed, not trusted knowledge")
      p Ollama output is a review-only candidate. It cannot enter the atlas or trusted release through this workbench.
    Field(id="candidate-instruction" label="Extraction instruction")
      textarea#candidate-instruction(v-model="instruction" maxlength="2000" rows="3")
    p {{ plural(selectedCount, 'exact span') }} selected.
    div
      button.button(type="submit" :disabled="!canExtract") {{ state === 'extracting' ? 'Generating candidate…' : 'Extract unreviewed candidate' }}
  LiveMessage(visible :text="pending(state)")
  ErrorNotice(v-if="state === 'generation-unavailable'" title="Ollama generation unavailable; no candidate was created" :message="message" retry-label="Retry candidate generation" @retry="emit('extract')")
  ErrorNotice(v-else-if="state === 'failed'" :message="message")
  Card(v-else-if="candidate")
    strong Unreviewed, not trusted knowledge
    h4 {{ candidate.subject }} · {{ candidate.relation }} · {{ candidate.object }}
    p Model {{ candidate.model }} · {{ candidate.id }}
    p Candidate release {{ candidate.release_id }} · sha256:{{ candidate.release_digest }}
    p Supporting spans: {{ candidate.span_ids.join(', ') }}
    p Unresolved: {{ list(candidate.unresolved_entities, 'none declared') }}
    p Missing context: {{ list(candidate.missing_context, 'none declared') }}
</template>
