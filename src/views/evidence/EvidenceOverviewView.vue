<script setup vapor>
import { computed } from 'vue'
import ClaimDumbbell from '../../components/evidence/ClaimDumbbell.vue'
import ClaimsExplorer from '../../components/evidence/ClaimsExplorer.vue'
import CoverageMap from '../../components/evidence/CoverageMap.vue'
import EvidenceNotes from '../../components/evidence/EvidenceNotes.vue'
import LiteratureTimeline from '../../components/evidence/LiteratureTimeline.vue'
import { useEvidence } from '../../components/evidence/useEvidence.js'
import { CLAIMS_PATH, LITERATURE_PATH, dumbbellRows, typeGradeMatrix } from '../../kb/evidence.js'
import { typePath } from '../../kb/paths.js'
import { navigate, setPageTitle } from '../../router.js'
import Panel from '../../ui/Panel.vue'
import RouterLink from '../../ui/RouterLink.vue'
import Heatmap from '../../viz/Heatmap.vue'

// /evidence. The evidence dashboards: the claims audit, what the conversation claimed against what the
// literature says, how well each kind of entry is graded, the literature on a timeline and where it
// is thin. Charts and tables; the only running text is in the Notes drawer.
setPageTitle('Evidence')
const { knowledge, model } = useEvidence()
const grades = computed(() => (knowledge.value ? typeGradeMatrix(knowledge.value.graph) : null))
const dumbbell = computed(() => (model.value ? dumbbellRows(model.value.claims) : []))

const openGrade = ({ row, col }) => navigate(`${typePath(row)}?grade=${col}`)
const openCoverage = ({ topic, design }) => navigate(`${LITERATURE_PATH}?topic=${topic}&design=${encodeURIComponent(design)}`)
</script>

<template lang="pug">
.stack.stack--loose
  header.stack
    h1 Evidence
    p.lede How well the claims from the conversation are backed by the recorded literature.
    nav.cluster(aria-label="Evidence pages")
      RouterLink.button.button--secondary(:to="CLAIMS_PATH") All claims
      RouterLink.button.button--secondary(:to="LITERATURE_PATH") All articles
  p.muted(v-if="!model" role="status") Loading the evidence data.
  template(v-else)
    Panel(title="Claims audit" title-id="ev-audit" lede="Each row is a claim; the bar shows the design-weighted evidence for and against.")
      ClaimsExplorer(:claims="model.claims" :articles="model.articles" id-prefix="ov")
    Panel(title="Claimed against recorded" title-id="ev-claimed")
      ClaimDumbbell(:rows="dumbbell")
    Panel(title="Grades by kind of entry" title-id="ev-grades" lede="Choose a cell to list those entries.")
      Heatmap(id="ev-grade-heat" title="Entries by kind and evidence grade" :rows="grades.rows" :cols="grades.cols" :values="grades.values" :domain="[0, 90]" row-title="Kind" col-title="Grade" unit="entries" totals @select="openGrade")
    Panel(title="The literature over time" title-id="ev-timeline")
      LiteratureTimeline(:articles="model.articles")
    Panel(title="Where the evidence is thin" title-id="ev-coverage-panel")
      CoverageMap(:articles="model.articles" @select="openCoverage")
    EvidenceNotes
      p The dashboards read the knowledge base only: {{ model.totals.articles }} articles and {{ model.totals.claims }} claims. A claim is as well supported as the articles recorded for and against it; a source that is missing here may exist elsewhere.
      p The support index is a descriptive summary, not a meta-analysis. It weighs study designs by a fixed table and ignores effect sizes, sample sizes and risk of bias. Open "How is this scored?" under the audit for the rule and the weights.
      p Topics are assigned by keywords from what each claim and article is about. They are a reading aid.
      p This is educational material, not medical advice.
</template>
