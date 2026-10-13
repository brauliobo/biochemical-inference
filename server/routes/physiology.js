import { z } from 'zod'
import {
  BPP_REQUEST_BODY_LIMIT,
  CouplingCreateRequestSchema,
  PackageValidationRequestSchema,
  PHYSIOLOGY_CONTRACT_VERSION,
  PHYSIOLOGY_CSRF_HEADER,
  PHYSIOLOGY_CSRF_VALUE,
  PHYSIOLOGY_RELEASE_DIGEST,
  PHYSIOLOGY_RELEASE_ID,
  PHYSIOLOGY_WARNING,
  PhysiologyDigestSchema,
  PhysiologyRunRequestSchema,
  TrustKeyAddRequestSchema
} from '../../shared/physiology-contracts.js'
import { createCsrfGuard } from '../http/guards.js'
import { problemReply } from '../http/replies.js'
import { createRouter, paramSchema } from '../http/routes.js'
import { PhysiologyRequestError } from '../physiology/service.js'

const PackageParamSchema = paramSchema('packageDigest', PhysiologyDigestSchema)
const CouplingParamSchema = paramSchema('couplingDigest', PhysiologyDigestSchema)
const RunParamSchema = paramSchema('runDigest', PhysiologyDigestSchema)
const TrustParamSchema = paramSchema('keyId', z.string().regex(/^ed25519:[a-f0-9]{16}$/))

const invalidPhysiology = problemReply(422, 'INVALID_PHYSIOLOGY_REQUEST', 'Physiology request does not match the strict v1 contract.')

export function registerPhysiologyRoutes(app, { physiology, allowedOrigins }) {
  const { get, post } = createRouter(app, invalidPhysiology)
  const requireMutation = createCsrfGuard(allowedOrigins, PHYSIOLOGY_CSRF_HEADER, PHYSIOLOGY_CSRF_VALUE,
    () => new PhysiologyRequestError('physiology_csrf_rejected', 'Physiology mutation requires a startup-allowlisted Origin and CSRF header.', 403))
  const mutation = { preHandler: requireMutation }
  const packageUpload = { bodyLimit: BPP_REQUEST_BODY_LIMIT, preHandler: requireMutation }

  get('/api/v8/physiology', {}, () => ({
    contractVersion: PHYSIOLOGY_CONTRACT_VERSION,
    releaseId: PHYSIOLOGY_RELEASE_ID,
    releaseDigest: PHYSIOLOGY_RELEASE_DIGEST,
    packageProfile: 'biochemical-physiology-package-v1',
    processPlugins: physiology.sandbox.available ? 'sandbox-gated' : 'disabled',
    scientificValidation: 'unsupported',
    warning: PHYSIOLOGY_WARNING,
    routes: { evidence: '/api/v8/physiology/evidence', validatePackage: '/api/v8/physiology/packages/validate', installPackage: '/api/v8/physiology/packages/install', catalog: '/api/v8/physiology/packages', couplings: '/api/v8/physiology/couplings', runs: '/api/v8/physiology/runs', coverage: '/api/v8/physiology/coverage', trust: '/api/v8/physiology/trust' }
  }))
  get('/api/v8/physiology/evidence', {}, () => physiology.evidence())
  post('/api/v8/physiology/packages/validate', { body: PackageValidationRequestSchema, options: packageUpload },
    ({ body }) => physiology.validatePackage(Buffer.from(body.packageBase64, 'base64')))
  post('/api/v8/physiology/packages/install', { body: PackageValidationRequestSchema, options: packageUpload, status: 201 },
    ({ body }) => physiology.installPackage(Buffer.from(body.packageBase64, 'base64')))
  get('/api/v8/physiology/packages', {}, () => physiology.listPackages())
  get('/api/v8/physiology/packages/:packageDigest', { params: PackageParamSchema }, ({ params }) => physiology.getPackage(params.packageDigest))
  post('/api/v8/physiology/packages/:packageDigest/conformance', { params: PackageParamSchema, options: mutation }, ({ params }) => physiology.conformance(params.packageDigest))
  get('/api/v8/physiology/trust', {}, () => physiology.listTrust())
  post('/api/v8/physiology/trust', { body: TrustKeyAddRequestSchema, options: mutation, status: 201 }, ({ body }) => physiology.addTrustKey(body))
  post('/api/v8/physiology/trust/:keyId/revoke', { params: TrustParamSchema, options: mutation }, ({ params }) => physiology.revokeTrustKey(params.keyId))
  get('/api/v8/physiology/couplings', {}, () => physiology.listCouplings())
  post('/api/v8/physiology/couplings', { body: CouplingCreateRequestSchema, options: mutation, status: 201 }, ({ body }) => physiology.createCoupling(body))
  get('/api/v8/physiology/couplings/:couplingDigest', { params: CouplingParamSchema }, ({ params }) => physiology.getCoupling(params.couplingDigest))
  get('/api/v8/physiology/runs', {}, () => physiology.listRuns())
  post('/api/v8/physiology/runs', { body: PhysiologyRunRequestSchema, options: mutation, status: 201 }, ({ body }) => physiology.run(body))
  get('/api/v8/physiology/runs/:runDigest', { params: RunParamSchema }, ({ params }) => physiology.getRun(params.runDigest))
  get('/api/v8/physiology/coverage', {}, () => physiology.coverage())
}
