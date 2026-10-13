<script setup vapor>
// A titled card: optional eyebrow, a heading at `level`, an optional status
// badge and header actions, then the default slot as a vertical stack. The
// section is a named region (aria-labelledby the heading), so `titleId` must
// be unique on the page. The status badge is a polite live region: change
// `status` to announce progress ("loading", "ready", "failed").
//
//   Panel(title-id="x-title" title="Experiments" eyebrow="Workspace" status="ready" tone="success")
//     template(#actions)
//       button.button.button--secondary(type="button") Refresh
//     p Content
//
// tone: 'success' | 'warning' | 'danger' | '' (neutral)
defineProps({
  titleId: { type: String, required: true },
  title: { type: String, required: true },
  eyebrow: { type: String, default: '' },
  level: { type: Number, default: 2 },
  status: { type: String, default: '' },
  tone: { type: String, default: '' }
})
</script>

<template lang="pug">
section.card.panel.stack(:aria-labelledby="titleId")
  header.repel
    .stack.stack--tight
      p.eyebrow(v-if="eyebrow") {{ eyebrow }}
      h2(v-if="level === 2" :id="titleId") {{ title }}
      h3(v-else-if="level === 3" :id="titleId") {{ title }}
      h4(v-else :id="titleId") {{ title }}
    .cluster
      slot(name="actions")
      span.badge(v-if="status" :class="tone ? 'badge--' + tone : ''" aria-live="polite") {{ status }}
  slot
</template>
