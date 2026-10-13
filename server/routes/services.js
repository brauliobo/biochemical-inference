import { createApapClient } from '../apap/client.js'
import { createApapRunService } from '../apap/service.js'
import { createChallengeService } from '../challenge/service.js'
import { createDataPlaneService } from '../data-plane/service.js'
import { createDerivedClient } from '../derived/client.js'
import { createDerivedRunService } from '../derived/service.js'
import { createEvidenceClient } from '../evidence/client.js'
import { createKnowledgeClient } from '../knowledge/client.js'
import { createMeasuredService } from '../measured/service.js'
import { createMeasuredSpatialService } from '../measured-spatial/service.js'
import { createParameterClient } from '../parameters/client.js'
import { createPhysiologyClient } from '../physiology/client.js'
import { createPhysiologyService } from '../physiology/service.js'
import { createRunService } from '../portfolio/execution.js'
import { createRevalidationIntegrationService } from '../revalidation/integration.js'
import { createSpatialClient } from '../spatial/client.js'
import { createSpatialRegistrationService } from '../spatial-registration/service.js'
import { createStudyService } from '../studies/service.js'
import { createWorkspaceService } from '../workspace/service.js'

const TEST_CSRF_TOKEN = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
const TEST_ORIGIN = 'http://127.0.0.1:5173'

// Builds every client and service, preferring injected `options.<name>` instances.
export async function createServices(options, env) {
  // Under vitest, services run with NODE_ENV=test (isolated storage) and, where required, fixed test credentials.
  const serviceEnv = (extra = {}) => process.env.VITEST ? { ...env, NODE_ENV: 'test', ...extra } : env
  const testCredentials = (domain) => ({
    [`BIOCHEMICAL_${domain}_ALLOWED_ORIGIN`]: env[`BIOCHEMICAL_${domain}_ALLOWED_ORIGIN`] ?? TEST_ORIGIN,
    [`BIOCHEMICAL_${domain}_CSRF_TOKEN`]: env[`BIOCHEMICAL_${domain}_CSRF_TOKEN`] ?? TEST_CSRF_TOKEN
  })

  const knowledge = options.knowledgeClient ?? createKnowledgeClient(env)
  const evidence = options.evidenceClient ?? createEvidenceClient(env)
  const parameters = options.parameterClient ?? createParameterClient(env)
  const apap = options.apapClient ?? createApapClient(env)
  const spatial = options.spatialClient ?? createSpatialClient(env)
  const derived = options.derivedClient ?? createDerivedClient(env)
  const physiologyEvidence = options.physiologyClient ?? createPhysiologyClient(process.env.VITEST ? { ...env, BIOCHEMICAL_PHYSIOLOGY_USE_FIXTURE: 'true' } : env)
  const portfolioRuns = options.portfolioRunService ?? createRunService()
  const studies = options.studyService ?? createStudyService(parameters)
  const apapRuns = options.apapRunService ?? createApapRunService(apap)
  const derivedRuns = options.derivedRunService ?? createDerivedRunService(derived, apapRuns)
  const workspace = options.workspaceService ?? await createWorkspaceService({ env: serviceEnv(), knowledgeClient: knowledge })
  const physiology = options.physiologyService ?? await createPhysiologyService({ env: serviceEnv(), evidenceClient: physiologyEvidence })
  const dataPlane = options.dataPlaneService ?? await createDataPlaneService({ env: serviceEnv() })
  const measured = options.measuredService ?? await createMeasuredService({ env: serviceEnv(testCredentials('MEASURED')) })
  const challenge = options.challengeService ?? await createChallengeService({ env: serviceEnv(testCredentials('CHALLENGE')) })
  const measuredSpatial = options.measuredSpatialService ?? await createMeasuredSpatialService({ env: serviceEnv() })
  const spatialRegistration = options.spatialRegistrationService ?? await createSpatialRegistrationService({ env: serviceEnv() })
  const revalidation = Object.hasOwn(options, 'revalidationService')
    ? options.revalidationService
    : env.BIOCHEMICAL_REVALIDATION_URL ? await createRevalidationIntegrationService({ env }) : null

  return {
    knowledge, evidence, parameters, apap, spatial, derived, physiologyEvidence,
    portfolioRuns, studies, apapRuns, derivedRuns,
    workspace, physiology, dataPlane, measured, challenge, measuredSpatial, spatialRegistration, revalidation
  }
}
