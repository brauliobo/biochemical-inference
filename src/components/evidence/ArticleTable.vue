<script setup vapor>
import { entityPath } from '../../kb/paths.js'
import RouterLink from '../../ui/RouterLink.vue'
import DesignIcon from './DesignIcon.vue'
import GradeMark from './GradeMark.vue'
import MarkIcon from './MarkIcon.vue'
import { designInfo } from '../../kb/evidence.js'

// The literature as a dot plot table: one row per article with its study design (marker and name),
// its year as a marker placed along a thin axis, its evidence grade, how many entries it informs and
// one compact citation line. Column headers are sort buttons (`sort` event with the sort id).
const props = defineProps({
  rows: { type: Array, required: true },
  years: { type: Array, required: true },
  sort: { type: String, default: 'newest' }
})
const emit = defineEmits(['sort'])

const place = (year) => {
  const [first, last] = props.years
  return last > first ? (year - first) / (last - first) : 0.5
}
const ariaSort = (id) => (props.sort === id ? 'descending' : undefined)
const yearSort = () => (props.sort === 'newest' ? 'oldest' : 'newest')
const yearAriaSort = () => (props.sort === 'newest' ? 'descending' : props.sort === 'oldest' ? 'ascending' : undefined)
const citation = (article) => `${article.byline} · ${article.journal}`
</script>

<template lang="pug">
.data-table(role="region" tabindex="0" aria-label="Literature: one row per article")
  table.ev-table
    caption.visually-hidden Articles with study design, year, evidence grade, number of entries informed and citation
    thead
      tr
        th(scope="col" :aria-sort="ariaSort('design')")
          button.ev-sort(type="button" @click="emit('sort', 'design')") Design
        th(scope="col" :aria-sort="yearAriaSort()")
          button.ev-sort(type="button" @click="emit('sort', yearSort())") {{ `Year (${years[0]} to ${years[1]})` }}
        th(scope="col" :aria-sort="ariaSort('grade')")
          button.ev-sort(type="button" @click="emit('sort', 'grade')") Grade
        th.ev-num(scope="col" :aria-sort="ariaSort('informs')")
          button.ev-sort(type="button" @click="emit('sort', 'informs')") Informs
        th(scope="col") Article
    tbody
      tr(v-for="article in rows" :key="article.id")
        td
          DesignIcon(:design="article.design" short)
        td
          .ev-yearaxis
            span.ev-yearaxis__track(aria-hidden="true")
              MarkIcon.ev-yearaxis__dot(:look="designInfo(article.design).look" :style="{ '--at': place(article.year) }")
            span.ev-num {{ article.year }}
        td
          GradeMark(:grade="article.grade")
        td.ev-num {{ article.nInforms }}
        th(scope="row")
          RouterLink.ev-oneline(:to="entityPath(article.id)") {{ article.name }}
          span.ev-oneline.muted {{ citation(article) }}
</template>
