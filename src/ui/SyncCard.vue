<script setup vapor>
// The status line of a workbench that works from a verified local mirror: what
// state the mirror is in, plus the one action that fits it (synchronize when it
// is empty, reload when its status failed). The default slot is the detail line.
//
//   SyncCard(:status="status" :ready="ready" :busy="busy" ready-title="Verified local snapshot ready"
//            unavailable-title="Consumer unavailable" sync-label="Synchronize" syncing-label="Synchronizing…"
//            :syncing="state === 'syncing'" @sync="synchronize" @reload="initialize")
//     p.muted release {{ status.releaseId }}
defineProps({
  status: { type: Object, default: undefined },
  ready: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  syncing: { type: Boolean, default: false },
  readyTitle: { type: String, required: true },
  emptyTitle: { type: String, default: 'Explicit synchronization required' },
  unavailableTitle: { type: String, required: true },
  syncLabel: { type: String, required: true },
  syncingLabel: { type: String, required: true },
  syncTestid: { type: String, default: undefined },
  alwaysSync: { type: Boolean, default: false }
})
const emit = defineEmits(['sync', 'reload'])
</script>

<template lang="pug">
.card.repel
  .stack.stack--tight
    strong {{ ready ? readyTitle : status?.state === 'empty' ? emptyTitle : unavailableTitle }}
    slot
  button.button(v-if="alwaysSync || status?.state === 'empty'" type="button" :disabled="busy" :data-testid="syncTestid" @click="emit('sync')") {{ syncing ? syncingLabel : syncLabel }}
  button.button.button--secondary(v-else-if="status?.state === 'failed'" type="button" :disabled="busy" @click="emit('reload')") Reload failed status
</template>
