import { ApapCompatibilityError } from '../apap/client.js'
import { ApapNumericalError } from '../apap/model.js'
import { ApapRequestError } from '../apap/service.js'
import { ChallengeUpstreamError } from '../challenge/client.js'
import { ChallengeRequestError } from '../challenge/service.js'
import { ChallengeVerificationError } from '../challenge/verification.js'
import { DataPlaneUpstreamError } from '../data-plane/client.js'
import { DataPlaneRequestError } from '../data-plane/service.js'
import { DataPlaneVerificationError } from '../data-plane/verification.js'
import { DerivedCompatibilityError } from '../derived/client.js'
import { DerivedRequestError } from '../derived/service.js'
import { EvidenceCompatibilityError } from '../evidence/client.js'
import { KnowledgeCompatibilityError } from '../knowledge/client.js'
import { MeasuredUpstreamError } from '../measured/client.js'
import { MeasuredRequestError } from '../measured/service.js'
import { MeasuredVerificationError } from '../measured/verification.js'
import { MeasuredSpatialUpstreamError } from '../measured-spatial/client.js'
import { MeasuredSpatialRequestError } from '../measured-spatial/service.js'
import { MeasuredSpatialVerificationError } from '../measured-spatial/verification.js'
import { ParameterCompatibilityError } from '../parameters/client.js'
import { ParameterSelectionError } from '../parameters/selection.js'
import { PhysiologyCompatibilityError } from '../physiology/client.js'
import { PhysiologyRequestError } from '../physiology/service.js'
import { PortfolioRequestError } from '../portfolio/execution.js'
import { RevalidationIntegrationError, revalidationIntegrationError } from '../revalidation/integration.js'
import { SimulationNumericalError } from '../simulation.js'
import { SpatialCompatibilityError } from '../spatial/client.js'
import { SpatialRangeError } from '../spatial/range.js'
import { SpatialRegistrationUpstreamError } from '../spatial-registration/client.js'
import { SpatialRegistrationRequestError } from '../spatial-registration/service.js'
import { SpatialRegistrationVerificationError } from '../spatial-registration/verification.js'
import { WorkspaceRequestError } from '../workspace/service.js'
import { noStore, problemBody } from './replies.js'

const standard = (error) => problemBody(error.statusCode, error.code, error.name, error.message)
const isAny = (...classes) => (error) => classes.some((candidate) => error instanceof candidate)

// Evaluated in order; the first matching rule produces the response.
// `describe` returns the body (its statusCode is the HTTP status); `noStore` adds no-store cache headers;
// `decorate` may add further headers.
const ERROR_RULES = [
  { test: isAny(KnowledgeCompatibilityError), describe: (error) => problemBody(409, 'KNOWLEDGE_INCOMPATIBLE', 'Conflict', error.message) },
  { test: isAny(EvidenceCompatibilityError), noStore: true, describe: standard },
  { test: isAny(ParameterCompatibilityError, ParameterSelectionError), describe: standard },
  { test: isAny(ApapCompatibilityError, ApapRequestError, ApapNumericalError), describe: standard },
  {
    test: isAny(SpatialRangeError),
    decorate: (reply, error) => reply.header('content-range', `bytes */${error.size}`),
    describe: (error) => problemBody(416, error.code, error.name, error.message)
  },
  { test: isAny(SpatialCompatibilityError), describe: standard },
  { test: isAny(DerivedCompatibilityError, DerivedRequestError), noStore: true, describe: standard },
  { test: isAny(WorkspaceRequestError), describe: standard },
  { test: isAny(PhysiologyCompatibilityError, PhysiologyRequestError), describe: standard },
  { test: isAny(DataPlaneRequestError, DataPlaneUpstreamError, DataPlaneVerificationError), describe: standard },
  { test: isAny(MeasuredRequestError, MeasuredUpstreamError, MeasuredVerificationError), describe: standard },
  { test: isAny(ChallengeRequestError, ChallengeUpstreamError, ChallengeVerificationError), describe: standard },
  { test: isAny(MeasuredSpatialRequestError, MeasuredSpatialUpstreamError, MeasuredSpatialVerificationError), noStore: true, describe: standard },
  { test: isAny(SpatialRegistrationRequestError, SpatialRegistrationUpstreamError, SpatialRegistrationVerificationError), noStore: true, describe: standard },
  {
    test: (error) => error instanceof RevalidationIntegrationError || error.name === 'RevalidationProducerError' || error.name === 'RevalidationEngineError',
    noStore: true,
    describe: (error) => standard(revalidationIntegrationError(error))
  },
  {
    test: (error) => error instanceof DOMException && error.name === 'AbortError',
    describe: (error) => problemBody(409, 'DATA_PLANE_SYNC_SUPERSEDED', 'Conflict', error.message)
  },
  { test: isAny(SimulationNumericalError), describe: (error) => problemBody(422, 'INVALID_NUMERICAL_STATE', 'Unprocessable Entity', error.message) },
  { test: isAny(PortfolioRequestError), describe: (error) => problemBody(error.statusCode, error.code, error.name, error.message, { findings: error.findings }) },
  { test: (error) => error instanceof Error && 'validation' in error && error.validation, describe: (error) => problemBody(400, 'INVALID_REQUEST', 'Bad Request', error.message) },
  {
    test: (error) => error instanceof Error && 'statusCode' in error && typeof error.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 500,
    describe: (error) => problemBody(error.statusCode, 'code' in error && typeof error.code === 'string' ? error.code : 'BAD_REQUEST', error.name, error.message)
  }
]

export function registerErrorHandler(app) {
  app.setErrorHandler((error, _request, reply) => {
    const rule = ERROR_RULES.find((candidate) => candidate.test(error))
    if (rule) {
      if (rule.noStore) noStore(reply, { dropEtag: false })
      rule.decorate?.(reply, error)
      const body = rule.describe(error)
      return reply.status(body.statusCode).send(body)
    }
    app.log.error(error)
    return reply.status(500).send(problemBody(500, 'INTERNAL_ERROR', 'Internal Server Error', 'The simulation service could not complete the request.'))
  })
}
