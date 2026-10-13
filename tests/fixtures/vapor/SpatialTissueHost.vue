<script setup vapor>
// Test host for SpatialTissueWorkbench. Vapor root props cannot carry callbacks
// (functions are read as getters) or change after mount, so the test drives
// the component through this host: `hostState.props` are the live props and
// `hostState.selected` records every selectBin event. See docs/VAPOR.md.
import SpatialTissueWorkbench from '../../../src/components/SpatialTissueWorkbench.vue'
import { hostState } from './host-state.js'
</script>

<template lang="pug">
SpatialTissueWorkbench(v-bind="hostState.props" @select-bin="hostState.selected.push($event)")
</template>
