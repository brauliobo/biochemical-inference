// The evidence model for a view, loaded lazily. The knowledge data is large (see
// kb/knowledge-lazy.js), so views render their heading first and show the dashboards once the
// engine has loaded. `model` is null until then.
//
//   const { knowledge, model } = useEvidence()
//   p(v-if="!model" role="status") Loading ...
import { computed } from 'vue'
import { knowledgeModule, loadKnowledge } from '../../kb/knowledge-lazy.js'
import { buildEvidenceModel } from '../../kb/evidence.js'

export function useEvidence() {
  loadKnowledge()
  const knowledge = computed(() => knowledgeModule.value)
  const model = computed(() => (knowledgeModule.value ? buildEvidenceModel(knowledgeModule.value.graph) : null))
  return { knowledge, model }
}
