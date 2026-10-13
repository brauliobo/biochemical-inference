import { registerApapRoutes } from './apap.js'
import { registerChallengeRoutes } from './challenge.js'
import { registerCoreRoutes } from './core.js'
import { registerDataPlaneRoutes } from './data-plane.js'
import { registerDerivedRoutes } from './derived.js'
import { registerEvidenceRoutes } from './evidence.js'
import { registerMeasuredRoutes } from './measured.js'
import { registerMeasuredSpatialRoutes } from './measured-spatial.js'
import { registerOpsRoutes } from './ops.js'
import { registerPhysiologyRoutes } from './physiology.js'
import { registerPortfolioRoutes } from './portfolio.js'
import { registerRevalidationRoutes } from './revalidation.js'
import { registerSpatialRoutes } from './spatial.js'
import { registerSpatialRegistrationRoutes } from './spatial-registration.js'
import { registerStaticRoutes } from './static.js'
import { registerWorkspaceRoutes } from './workspace.js'

// API routes first; static serving and its not-found handler must come last.
const API_ROUTE_MODULES = [
  registerOpsRoutes,
  registerCoreRoutes,
  registerPortfolioRoutes,
  registerEvidenceRoutes,
  registerApapRoutes,
  registerSpatialRoutes,
  registerDerivedRoutes,
  registerWorkspaceRoutes,
  registerPhysiologyRoutes,
  registerDataPlaneRoutes,
  registerMeasuredRoutes,
  registerChallengeRoutes,
  registerMeasuredSpatialRoutes,
  registerSpatialRegistrationRoutes,
  registerRevalidationRoutes
]

export async function registerRoutes(app, context) {
  for (const register of API_ROUTE_MODULES) register(app, context)
  await registerStaticRoutes(app, context)
}
