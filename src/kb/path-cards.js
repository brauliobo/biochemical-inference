// The guided-path cards (id, title, summary, step count) without the knowledge graph.
// The home page shows them at first paint, before the 180 kB entity data has loaded
// (see knowledge-lazy.js), so this reads only data/paths.js and the small card builder,
// not knowledge/index.js. tests/unit/kb-path-steps.test.js checks it equals pathList().
import { pathListModel } from '../knowledge/guided-paths.js'
import guidedPaths from '../knowledge/data/paths.js'

export const PATH_CARDS = Object.freeze(pathListModel(guidedPaths))
