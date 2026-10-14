// Routes of the simulator dashboards, spread into src/routes.js. Each view is code-split, so the simulator, the
// charts and the data stay out of the initial bundle. The catalogue (`DASHBOARDS`) also feeds the dashboards index and the
// home page cards: order, title, the question each answers and which kind of thumbnail it gets.

export const DASHBOARDS = Object.freeze([
  { id: 'methylation', path: '/dash/methylation', title: 'Methylation balance', question: 'Who spends the methyl groups, and what tips SAM:SAH?', status: 'model', thumb: 'methylation', load: () => import('./MethylationBalance.vue') },
  { id: 'glycine', path: '/dash/glycine', title: 'Glycine', question: 'Where does glycine come from and go, and what does a dose do?', status: 'model', thumb: 'glycine', load: () => import('./GlycineDashboard.vue') },
  { id: 'choline', path: '/dash/choline', title: 'Choline and betaine', question: 'Can choline replace 10 g of glycine?', status: 'calculator', thumb: 'choline', load: () => import('./CholineBetaineDashboard.vue') },
  { id: 'gut-acid', path: '/dash/gut-acid', title: 'Gut, acid and belching', question: 'Can acid plus bicarbonate explain belching after glycine powder?', status: 'model', thumb: 'gut-acid', load: () => import('./GutAcidDashboard.vue') },
  { id: 'histamine-night', path: '/dash/histamine-night', title: 'Histamine and night waking', question: 'Why 2-3 am waking and throat burn?', status: 'hypothesis', thumb: 'histamine-night', load: () => import('./HistamineNightDashboard.vue') },
  { id: 'b6-gaba', path: '/dash/b6-gaba', title: 'B6, GABA and glutamate', question: 'What does vitamin B6 do in the GABA shunt?', status: 'hypothesis', thumb: 'b6-gaba', load: () => import('./B6GabaDashboard.vue') },
  { id: 'bile-acids', path: '/dash/bile-acids', title: 'Bile acids: glycine or taurine', question: 'Which amino acid conjugates bile acids, and what is deconjugated in the gut?', status: 'model', thumb: 'bile-acids', load: () => import('./BileAcidsDashboard.vue') },
  { id: 'tma-tmao', path: '/dash/tma-tmao', title: 'TMA and TMAO', question: 'What happens to choline in the gut, and when does TMAO rise?', status: 'model', thumb: 'tma-tmao', load: () => import('./TmaTmaoDashboard.vue') }
])

export const dashRoutes = [
  { name: 'dashboards', path: '/dashboards', title: 'Dashboards', load: () => import('./DashboardsIndex.vue') },
  ...DASHBOARDS.map((dashboard) => ({ name: `dash-${dashboard.id}`, path: dashboard.path, title: dashboard.title, load: dashboard.load }))
]
