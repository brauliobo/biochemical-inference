// Registry of the interactive workbenches served under /workbench/:name.
// All of them currently need the Fastify API (needsApi); a workbench that is
// migrated to run client-side can set needsApi: false and then also works in
// the static build.
//
//   props    passed to the component (some legacy components require them)
//   legacy   false once the workbench no longer needs legacy-workbench.css
export const workbenches = [
  { name: 'full', title: 'Full workbench (single page)', summary: 'The original single-page workbench: simulation, evidence, atlas and every module below on one page.', needsApi: true, load: () => import('./views/workbench/FullWorkbench.vue') },
  { name: 'challenge', title: 'Frozen APAP challenge', summary: 'Independent frozen-release inference and scoring.', needsApi: true, load: () => import('./components/ChallengeWorkbench.vue') },
  { name: 'measured-spatial', title: 'Measured spatial liver atlas', summary: 'DigiMouse liver label atlas.', needsApi: true, load: () => import('./components/MeasuredSpatialLiverAtlas.vue') },
  { name: 'spatial-registration', title: 'Spatial registration', summary: 'Learn2Reg MR-CT prealigned pair.', needsApi: true, load: () => import('./components/SpatialRegistrationWorkbench.vue') },
  { name: 'revalidation', title: 'Revalidation campaign', summary: 'Signed impact execution ledger.', needsApi: true, load: () => import('./components/RevalidationCampaignWorkbench.vue') },
  { name: 'atlas', title: 'MTHFR evidence atlas', summary: 'Contextual MTHFR evidence atlas, human taxon.', needsApi: true, props: { taxonId: 9606 }, load: () => import('./components/AtlasExplorer.vue') },
  { name: 'evidence', title: 'Literature evidence search', summary: 'License-aware search of exact literature evidence.', needsApi: true, load: () => import('./components/EvidencePanel.vue') },
  { name: 'portfolio', title: 'ODE, SSA and FBA workbench', summary: 'Standards-based simulation portfolio.', needsApi: true, load: () => import('./components/PortfolioWorkbench.vue') },
  { name: 'experiments', title: 'Experiment workspace', summary: 'Durable local research runs.', needsApi: true, load: () => import('./components/ExperimentWorkspace.vue') },
  { name: 'parameter-study', title: 'Parameter study', summary: 'Synthetic decay inference study.', needsApi: true, load: () => import('./components/ParameterStudyWorkbench.vue') },
  { name: 'apap', title: 'APAP benchmark', summary: 'Deterministic liver toxicity benchmark (bounded human and mouse).', needsApi: true, load: () => import('./components/APAPBenchmarkWorkbench.vue') },
  { name: 'review', title: 'Review workbench', summary: 'Reviewed derived knowledge.', needsApi: true, load: () => import('./components/ReviewWorkbench.vue') },
  { name: 'physiology', title: 'Physiology plugin workbench', summary: 'Extensible physiology with signed plugin coupling.', needsApi: true, load: () => import('./components/PhysiologyPluginWorkbench.vue') },
  { name: 'data-plane', title: 'Data plane workbench', summary: 'Authoritative local data, mirrored offline.', needsApi: true, load: () => import('./components/DataPlaneWorkbench.vue') },
  { name: 'measured-commons', title: 'Measured commons', summary: 'Qualified observations and isolated evaluation.', needsApi: true, load: () => import('./components/MeasuredCommonsWorkbench.vue') }
]

export const findWorkbench = (name) => workbenches.find((item) => item.name === name)
