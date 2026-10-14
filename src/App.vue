<script setup vapor>
import { nextTick, ref, watch } from 'vue'
import { useRoute } from './router.js'
import RouterLink from './ui/RouterLink.vue'
import RouterView from './ui/RouterView.vue'

const SITE = 'Biochemical Inference'
const route = useRoute()
const main = ref()
const announcement = ref('')

function focusMain() {
  main.value?.focus()
}

// Navigation a11y: keep document.title current and announce changes to screen
// readers. The first render announces and focuses nothing.
let initialTitle = true
watch(() => route.title, (title) => {
  document.title = title && title !== SITE ? `${title} · ${SITE}` : SITE
  if (!initialTitle) announcement.value = document.title
  initialTitle = false
}, { immediate: true })

// After a route change move focus to <main> so keyboard users continue from
// the new content instead of the link they activated.
watch(() => route.path, async () => {
  await nextTick()
  window.scrollTo(0, 0)
  focusMain()
})
</script>

<template lang="pug">
.page
  a.skip-link(href="#main" @click.prevent="focusMain") Skip to main content
  header.site-header
    .container
      a.site-title(href="#/") {{ SITE }}
      nav.site-nav(aria-label="Primary")
        ul
          li
            RouterLink(to="/") Home
          li
            RouterLink(to="/dashboards" section) Dashboards
          li
            RouterLink(to="/atlas" section) Atlas
          li
            RouterLink(to="/evidence" section) Evidence
          li
            RouterLink(to="/kb" section) Knowledge base
          li
            RouterLink(to="/atlas" section) Atlas
          li
            RouterLink(to="/workbench" section) Workbenches
  main#main.site-main(ref="main" tabindex="-1")
    .container
      RouterView
  footer.site-footer
    .container
      p
        strong Educational resource, not medical advice.
        |  Content and models here are illustrative, simplified and may be incomplete or out of date. They are not clinical, diagnostic or treatment guidance. Talk to a qualified clinician about your health.
  p.visually-hidden(role="status" aria-live="polite") {{ announcement }}
</template>
