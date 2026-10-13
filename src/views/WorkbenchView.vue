<script setup vapor>
import { computed, watchEffect } from 'vue'
import '../styles/legacy-workbench.css'
import { isStaticMode } from '../runtime-mode.js'
import { setPageTitle, useRoute } from '../router.js'
import { findWorkbench } from '../workbenches.js'
import ApiRequired from '../ui/ApiRequired.vue'
import { lazyComponent } from '../ui/lazy.js'
import RouterLink from '../ui/RouterLink.vue'
import NotFoundView from './NotFoundView.vue'

// /workbench/:name. Static builds cannot reach the API, so workbenches that
// need it are replaced by a notice; the lazy import is then never requested.
const route = useRoute()
const item = computed(() => findWorkbench(route.params.name))
const blocked = computed(() => item.value?.needsApi && isStaticMode())
watchEffect(() => setPageTitle(item.value ? item.value.title : 'Page not found'))
const workbench = computed(() => (item.value && !blocked.value ? lazyComponent(item.value.load) : undefined))
</script>

<template lang="pug">
NotFoundView(v-if="!item")
.stack.stack--loose(v-else)
  header.stack.stack--tight
    RouterLink(to="/workbench") All workbenches
    h1 {{ item.title }}
    p.notice.notice--warning(role="note")
      strong Demonstration, not diagnosis.
      |  Illustrative kinetics and a bounded pathway. Not for clinical use.
  ApiRequired(v-if="blocked" :title="item.title")
  .legacy-workbench(v-else)
    component(:is="workbench" v-bind="item.props")
</template>
