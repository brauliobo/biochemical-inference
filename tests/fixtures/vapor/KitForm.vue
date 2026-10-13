<script setup vapor>
// Host for the form components of src/ui: shared state, and a record of the
// native events that reached the controls.
import { reactive, ref } from 'vue'
import InputField from '../../../src/ui/InputField.vue'
import SelectField from '../../../src/ui/SelectField.vue'

const form = reactive({ seed: 7, name: 'a', flag: false, level: 2 })
const seen = ref([])
const options = [{ value: 1, label: 'One' }, { value: 2, label: 'Two' }, 'plain']
</script>

<template lang="pug">
form
  InputField(id="seed" label="Seed" type="number" v-model="form.seed" min="0" hint="uint32")
  InputField(id="name" label="Name" v-model="form.name" error="Required" required)
  InputField(id="flag" label="Enabled" type="checkbox" v-model="form.flag")
  InputField(id="onhost" label="Listener" v-model="form.name" @input="seen.push($event)")
  SelectField(id="level" label="Level" v-model="form.level" :options="options" @change="seen.push($event)")
  output.state {{ typeof form.seed }}:{{ form.seed }}|{{ form.name }}|{{ form.flag }}|{{ form.level }}
  output.seen {{ seen.join(',') }}
</template>
