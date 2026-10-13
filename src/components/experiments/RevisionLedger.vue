<script setup vapor>
import Card from '../../ui/Card.vue'
import Field from '../../ui/Field.vue'
import Panel from '../../ui/Panel.vue'
import { plural } from '../../ui/format.js'

// The immutable revisions of the selected experiment, and the actions on it:
// queue a run, clone, export a portable bundle, import one.
defineProps({
  detail: { type: Object, default: undefined },
  readOnly: { type: Boolean, required: true },
  exportHref: { type: String, default: '' },
  exportName: { type: String, default: '' }
})
const emit = defineEmits(['queue', 'clone', 'export', 'import'])
</script>

<template lang="pug">
Panel(title="Revision ledger" title-id="workspace-ledger-title" :level="3")
  template(v-if="detail")
    p {{ detail.experiment.name }} · {{ plural(detail.revisions.length, 'immutable revision') }}
    ol.plain-list.stack.stack--tight
      li(v-for="revision in detail.revisions" :key="revision.revisionId")
        Card
          strong Revision {{ revision.ordinal }} · {{ revision.source }}
          p
            code {{ revision.specificationDigest }}
          p Snapshot {{ revision.snapshotDigest }}
          p(v-for="entry in revision.specification.entries" :key="`${entry.model.id}-${entry.model.digest}`") Model {{ entry.model.id }} · {{ entry.model.digest }}
    .cluster
      button.button(type="button" :disabled="readOnly" @click="emit('queue')") Queue latest revision
      button.button.button--secondary(type="button" :disabled="readOnly" @click="emit('clone')") Clone experiment
      button.button.button--secondary(type="button" @click="emit('export')") Export portable ZIP
      a.button.button--secondary(v-if="exportHref" :href="exportHref" :download="exportName") Download {{ exportName }}
    Field(id="workspace-import" label="Import portable ZIP")
      input#workspace-import(type="file" accept=".zip,application/zip" @change="emit('import', $event)")
  template(v-else)
    .stack.stack--tight
      strong No persisted experiment selected
      p Configure the form to create the first immutable revision, or import a verified portable ZIP.
    Field(id="workspace-import-empty" label="Import portable ZIP")
      input#workspace-import-empty(type="file" accept=".zip,application/zip" @change="emit('import', $event)")
</template>
