<script setup vapor>
// A static picture of the methionine cycle shown until the real map has loaded (after the page is idle): the same
// 16:10 box, so nothing jumps when the map arrives. Decorative; the real map has the text alternative.
const NODES = [[30, 40], [135, 40], [240, 40], [240, 136], [135, 136], [30, 136], [135, 88]]
</script>

<template lang="pug">
svg.home-hero__placeholder(viewBox="0 0 320 200" aria-hidden="true")
  path.home-hero__arrow(d="M80 52H135M185 52H240M265 64V124M240 148H185M135 148H80M55 124V64M160 64V124")
  rect.home-hero__node(v-for="node in NODES" :key="`${node[0]}-${node[1]}`" :x="node[0]" :y="node[1]" width="50" height="24" rx="12")
</template>
