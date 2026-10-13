<script setup vapor>
// Pick-one cards for the human and mouse contexts and for the bounded
// synthetic protocols. Both lock while a run is in flight.
defineProps({
  contexts: { type: Array, required: true },
  protocols: { type: Array, required: true },
  contextId: { type: String, default: '' },
  protocolId: { type: String, required: true },
  locked: { type: Boolean, required: true }
})
const emit = defineEmits(['context', 'protocol'])

const interventions = (protocol) => protocol.interventions.map((item) => `${item.role} ${item.dose.lower} ${item.dose.unit} at ${item.start_time.lower} h`).join(' · ')
</script>

<template lang="pug">
.stack
  section.stack.stack--tight
    h3 Human and mouse contexts
    .grid
      button.card(v-for="context in contexts" :key="context.id" type="button" :aria-pressed="contextId === context.id" :disabled="locked" @click="emit('context', context.id)")
        span {{ context.taxon_label }}
        strong {{ context.id }}
        small.muted {{ context.challenge_route }} · {{ context.strain ?? 'no cohort/strain asserted' }} · {{ context.sex }} · {{ context.fasting_status }}
  section.stack.stack--tight
    h3 Bounded synthetic protocols
    .grid
      button.card(v-for="protocol in protocols" :key="protocol.id" type="button" :aria-pressed="protocolId === protocol.id" :disabled="locked" @click="emit('protocol', protocol)")
        span.eyebrow {{ protocol.protocol_class }} · unsupported
        strong {{ protocol.name }}
        small.muted {{ protocol.observation_window.lower }}–{{ protocol.observation_window.upper }} h · {{ interventions(protocol) }}
        span {{ protocol.exclusion }}
</template>
