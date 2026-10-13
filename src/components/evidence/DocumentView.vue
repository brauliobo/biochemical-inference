<script setup vapor>
import { computed } from 'vue'
import Card from '../../ui/Card.vue'
import Disclosure from '../../ui/Disclosure.vue'
import Facts from '../../ui/Facts.vue'
import Notice from '../../ui/Notice.vue'
import Panel from '../../ui/Panel.vue'
import { humanize } from '../../ui/format.js'

// One license-filtered document: its policy, lifecycle, sections with exact
// source offsets, selectable supporting spans, and machine annotations and
// relations from PubTator. The default slot continues inside the panel.
const props = defineProps({ document: { type: Object, required: true } })
const selectedSpanIds = defineModel('selectedSpanIds', { type: Array, required: true })

const record = computed(() => props.document.document)
const byId = (key) => computed(() => new Map(props.document[key].map((item) => [item.id, item])))
const spanById = byId('spans')
const annotationById = byId('annotations')
const warning = computed(() => record.value.publication_status !== 'active')
const facts = computed(() => [
  { label: 'Content policy', value: record.value.content_scope },
  { label: 'Authors', value: record.value.authors.join(', ') }
])
const spansOf = (section) => props.document.spans.filter((span) => span.section_id === section.id)

function annotationLabel(identifier) {
  const annotation = annotationById.value.get(identifier)
  if (!annotation) return identifier
  const span = spanById.value.get(annotation.span_id)
  return `${span?.text ?? annotation.span_id} (${annotation.normalized_id ?? 'unresolved'})`
}
</script>

<template lang="pug">
Panel(:title="record.title" title-id="evidence-document-title" eyebrow="Selected document" :level="3" :status="record.publication_status" :tone="warning ? 'warning' : 'success'")
  Notice(v-if="warning" tone="warning" role="alert" title="Publication lifecycle warning")
    p This record is {{ record.publication_status }}. Inspect its lifecycle before using any span.
  Facts(:items="facts")
  Card(aria-labelledby="license-title")
    h4#license-title License and redistribution policy
    article.stack.stack--tight(v-for="license in document.licenses" :key="license.id")
      strong {{ license.name }} · {{ license.redistribution }}
      p {{ license.attribution }}
      a(:href="license.url" target="_blank" rel="noreferrer") Read license terms
  Disclosure(:summary="`Publication lifecycle (${document.lifecycle.length})`")
    ol
      li(v-for="event in document.lifecycle" :key="event.id") {{ event.occurred_at }} · {{ event.event_type }} · {{ event.note }}
  section.stack.stack--tight(v-for="section in document.sections" :key="section.id")
    h4 {{ section.section_type }}
    p.muted {{ section.source_locator }} · source [{{ section.source_offset }}, {{ section.source_end }})
    p(v-if="section.text") {{ section.text }}
    Notice(v-else tone="warning" role="note") Text withheld by the metadata-only content policy.
    fieldset.card.stack.stack--tight(v-if="spansOf(section).length")
      legend Select exact supporting spans for review-only extraction
      label.field.field--inline(v-for="span in spansOf(section)" :key="span.id" :for="span.id")
        input(:id="span.id" v-model="selectedSpanIds" type="checkbox" :value="span.id")
        span.field
          strong “{{ span.text }}”
          small.muted {{ span.id }} · local [{{ span.start }}, {{ span.end }}) · source [{{ span.source_offset }}, {{ span.source_end }})
  .grid
    section.stack.stack--tight
      h4 PubTator annotations
      p.muted(v-if="!document.annotations.length") No annotations in this document response.
      ul
        li(v-for="annotation in document.annotations" :key="annotation.id") {{ annotation.annotation_type }} · {{ spanById.get(annotation.span_id)?.text }} · {{ annotation.normalized_id ?? 'unresolved' }}
    section.stack.stack--tight
      h4 PubTator relations
      p.muted(v-if="!document.relations.length") No machine relation in this document response.
      ul
        li(v-for="relation in document.relations" :key="relation.id") {{ annotationLabel(relation.subject_annotation_id) }} {{ humanize(relation.relation_type) }} {{ annotationLabel(relation.object_annotation_id) }} · confidence {{ relation.confidence }}
  slot
</template>
