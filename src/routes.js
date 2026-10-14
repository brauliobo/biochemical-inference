// The route table: the one place views register. Order matters (first match
// wins). `load` returns the view component (a Vapor SFC) and is code-split.
//
// To add a page: create src/views/MyView.vue (`<script setup vapor>`), add one
// line here. Views read route params with useRoute() from './router.js'.
//
//   { name, path, title, load }   path segments starting with ":" are params
export const routes = [
  { name: 'home', path: '/', title: 'Home', load: () => import('./views/HomeView.vue') },
  { name: 'kb-hub', path: '/kb', title: 'Knowledge base', load: () => import('./views/kb/KbHubView.vue') },
  { name: 'kbMap', path: '/kb/map', title: 'Knowledge map', load: () => import('./views/kb/KbMapView.vue') },
  // Guided paths must stay above /kb/:type, which would read "paths" as an entity type.
  { name: 'kb-paths', path: '/kb/paths', title: 'Guided paths', load: () => import('./views/kb/KbPathsView.vue') },
  { name: 'kb-path', path: '/kb/paths/:id', title: 'Guided path', load: () => import('./views/kb/KbPathView.vue') },
  { name: 'kb-type', path: '/kb/:type', title: 'Knowledge base', load: () => import('./views/kb/KbTypeView.vue') },
  { name: 'kb-entity', path: '/kb/:type/:slug', title: 'Knowledge base', load: () => import('./views/kb/KbEntityView.vue') },
  { name: 'workbench-index', path: '/workbench', title: 'Workbenches', load: () => import('./views/WorkbenchIndexView.vue') },
  { name: 'workbench', path: '/workbench/:name', title: 'Workbench', load: () => import('./views/WorkbenchView.vue') },
  { name: 'dev-viz', path: '/dev/viz', title: 'Chart components', load: () => import('./views/dev/VizGallery.vue') }
]

export const notFoundRoute = {
  name: 'not-found',
  path: '*',
  title: 'Page not found',
  load: () => import('./views/NotFoundView.vue')
}
