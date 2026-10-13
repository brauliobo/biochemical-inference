<script setup vapor>
// Fixture for tests/component/vapor-support.test.js: the Vapor features the
// app relies on, in one component.
import { computed, provide, ref } from 'vue'
import Child from './Child.vue'
import Legacy from './Legacy.js'

provide('theme', 'dark')
const picked = ref(null)
const text = ref('a')
const choice = ref('x')
const list = ref(['one', 'two'])
const shown = ref(true)
const upper = computed(() => text.value.toUpperCase())
const box = ref()
function focusBox() {
  box.value.focus()
}
</script>

<template lang="pug">
.parent
  Child(label="L" @picked="picked = $event")
    template(#default="{ label }") slot-{{ label }}
  Legacy(@picked="picked = $event")
  p.picked {{ picked?.id ?? 'none' }}
  input.text(v-model="text")
  p.upper {{ upper }}
  select.sel(v-model="choice")
    option(value="x") X
    option(value="y") Y
  p.choice {{ choice }}
  ul
    li(v-for="item in list" :key="item") {{ item }}
  p.shown(v-if="shown") shown
  input.box(ref="box")
  button.focus(type="button" @click="focusBox") focus
</template>
