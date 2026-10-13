<script setup vapor>
import { computed } from 'vue'
import Card from '../../ui/Card.vue'
import Disclosure from '../../ui/Disclosure.vue'
import EmptyState from '../../ui/EmptyState.vue'
import Field from '../../ui/Field.vue'
import InputField from '../../ui/InputField.vue'
import Toolbar from '../../ui/Toolbar.vue'

// Append-only scientific review: who reviews, why, and the actions that are
// valid for the assertion's current review state; then the signed event history.
const props = defineProps({
  status: { type: String, required: true },
  reproduced: { type: Boolean, required: true },
  canAct: { type: Boolean, required: true },
  canReproduce: { type: Boolean, required: true },
  replacements: { type: Array, required: true },
  events: { type: Array, required: true }
})
const reviewer = defineModel('reviewer', { type: Object, required: true })
const reason = defineModel('reason', { type: String, required: true })
const superseding = defineModel('superseding', { type: String, required: true })
const emit = defineEmits(['review', 'reproduce'])

const FIELDS = [
  { key: 'id', id: 'review-reviewer-id', label: 'Reviewer ID', autocomplete: 'off' },
  { key: 'name', id: 'review-reviewer-name', label: 'Reviewer name', autocomplete: 'name' },
  { key: 'organization', id: 'review-organization', label: 'Organization', autocomplete: 'organization' },
  { key: 'role', id: 'review-role', label: 'Role', autocomplete: 'organization-title' }
]
const replacementOptions = computed(() => [{ value: '', label: 'Select accepted replacement' }, ...props.replacements.map((item) => ({ value: item.digest, label: item.digest }))])
</script>

<template lang="pug">
.stack
  form.stack.card.card--flat(aria-labelledby="review-form-title" @submit.prevent)
    h3#review-form-title Append-only scientific review
    .grid
      InputField(v-for="field in FIELDS" :key="field.key" :id="field.id" :label="field.label" v-model="reviewer[field.key]" required :autocomplete="field.autocomplete")
    Field(id="review-reason" label="Review reason")
      textarea#review-reason(v-model="reason" rows="3" required)
    Toolbar(v-if="status === 'pending'" label="Review decision")
      button.button(type="button" :disabled="!canAct" @click="emit('review', 'accepted')") Accept
      button.button.button--secondary(type="button" :disabled="!canAct" @click="emit('review', 'rejected')") Reject
    Toolbar(v-else-if="status === 'accepted'" label="Review actions on an accepted assertion")
      button.button(v-if="!reproduced" type="button" :disabled="!canReproduce || !canAct" @click="emit('reproduce')") Reproduce exact APAP run
      button.button.button--secondary(type="button" :disabled="!canAct" @click="emit('review', 'recalculation-requested')") Request recalculation
      button.button.button--secondary(type="button" :disabled="!canAct" @click="emit('review', 'invalidated')") Invalidate
      select(v-model="superseding" aria-label="Accepted superseding assertion")
        option(v-for="option in replacementOptions" :key="option.value" :value="option.value") {{ option.label }}
      button.button.button--secondary(type="button" :disabled="!superseding || !canAct" @click="emit('review', 'superseded')") Supersede
    p(v-else) This terminal review state remains auditable and allows no further events.

  section.stack.stack--tight(aria-labelledby="review-events-title")
    h3#review-events-title Signed event history
    EmptyState(v-if="!events.length") No review events have been appended.
    ol.plain-list.stack.stack--tight
      li(v-for="event in events" :key="event.event_digest")
        Card(flat)
          strong Event {{ event.sequence }} · {{ event.action }} · {{ event.reviewer.name }}
          span.muted {{ event.occurred_at }} · {{ event.reason }}
          Disclosure(summary="Signature and event chain")
            code.digest event {{ event.event_digest }}
            code.digest key {{ event.key_id }}
            code.digest previous {{ event.previous_event_digest ?? 'genesis' }}
            code.digest signature {{ event.signature }}
</template>
