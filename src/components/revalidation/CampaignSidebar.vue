<script setup vapor>
import Badge from '../../ui/Badge.vue'
import EmptyState from '../../ui/EmptyState.vue'
import InputField from '../../ui/InputField.vue'
import Field from '../../ui/Field.vue'

// Start the pinned plan as an immutable request, and pick one of the campaigns
// already bound to the local store.
defineProps({
  campaigns: { type: Array, required: true },
  selectedId: { type: String, default: '' },
  creating: { type: Boolean, required: true },
  busy: { type: Boolean, required: true }
})
const name = defineModel('name', { type: String, required: true })
const reason = defineModel('reason', { type: String, required: true })
const emit = defineEmits(['create', 'select'])
</script>

<template lang="pug">
.sidebar
  form.stack(@submit.prevent="emit('create')")
    p.eyebrow Immutable request
    h3 Start the pinned plan
    InputField(id="revalidation-name" label="Campaign slug" v-model="name" required pattern="[a-z][a-z0-9-]*" maxlength="100" autocomplete="off" hint="Lowercase letters, digits and hyphens, starting with a letter." :disabled="busy")
    Field(id="revalidation-reason" label="Execution reason")
      textarea#revalidation-reason(v-model="reason" required maxlength="4000" rows="3" :disabled="busy")
    div
      button.button(type="submit" :disabled="busy") {{ creating ? 'Binding campaign…' : 'Create and execute campaign' }}

  section.stack.stack--tight(aria-labelledby="revalidation-index-title")
    .repel
      div
        p.eyebrow Durable ledger
        h3#revalidation-index-title Bound campaigns
      Badge(:aria-label="`${campaigns.length} bound campaigns`" :label="String(campaigns.length)")
    EmptyState(v-if="!campaigns.length") No producer campaign has been bound to this local store.
    ul.plain-list.stack.stack--tight
      li(v-for="campaign in campaigns" :key="campaign.local_campaign_id")
        button.tile(type="button" :aria-pressed="selectedId === campaign.local_campaign_id" @click="emit('select', campaign.local_campaign_id)")
          span.muted event {{ campaign.event_head.sequence }}
          code {{ campaign.local_campaign_id }}
</template>
