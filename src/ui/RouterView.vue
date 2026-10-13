<script setup vapor>
import { computed } from 'vue'
import { useRoute } from '../router.js'
import { lazyComponent } from './lazy.js'

// Renders the view of the current route (see routes.js).
const route = useRoute()
const view = computed(() => lazyComponent(route.route.load))
</script>

<template lang="pug">
component(:is="view")
</template>
