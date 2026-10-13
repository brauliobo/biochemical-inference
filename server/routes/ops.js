import { MODEL } from '../model.js'
import { noStore, sendProblem } from '../http/replies.js'

const COUNTER_FIELDS = ['artifacts', 'bundles', 'cachedChunks', 'commitments', 'disclosures', 'objects', 'records', 'releases']

export async function settleReadinessChecks(checks) {
  const settled = await Promise.allSettled(checks)
  const failure = settled.find((result) => result.status === 'rejected')
  if (failure) throw failure.reason
  return settled.map((result) => result.value)
}

export function registerOpsRoutes(app, context) {
  const { env, operations, knowledge, evidence, parameters, apap, spatial, derived, physiologyEvidence, workspace, physiology, dataPlane, measured, challenge, measuredSpatial, spatialRegistration, revalidation } = context
  const optionalUninitialized = new Set((env.BIOCHEMICAL_OPTIONAL_UNINITIALIZED_DOMAINS ?? '').split(',').filter(Boolean))

  const requireReadyResult = (label, value) => {
    if (value?.status === 'failed' || value?.integrity === 'failed') throw new Error(`${label} is not ready`)
    const counters = value && !Array.isArray(value) && typeof value === 'object'
      ? Object.entries(value).filter(([name, selected]) => COUNTER_FIELDS.includes(name) && Number.isInteger(selected))
      : []
    const uninitialized = ['empty', 'not-configured', 'uninitialized'].includes(value?.status) || (Array.isArray(value) && value.length === 0) || (value?.status === 'valid' && counters.length > 0 && counters.every(([, selected]) => selected === 0))
    if (uninitialized && !optionalUninitialized.has(label)) throw new Error(`${label} has no configured domain state`)
    return uninitialized ? 'uninitialized' : 'configured'
  }

  // [label, check]; the first entry's result is reported as the release list.
  const domainChecks = (signal) => [
    ['core', () => knowledge.releases(signal)],
    ['atlas', () => knowledge.atlasReleases(signal)],
    ['evidence', () => evidence.health(signal)],
    ['parameters', () => parameters.contexts(signal)],
    ['apap', () => apap.contexts(signal)],
    ['spatial', () => spatial.mappings(signal)],
    ['derived', () => derived.health(signal)],
    ['physiology-evidence', () => physiologyEvidence.contexts(signal)],
    ['workspace', () => Promise.resolve(workspace.listResourceProfiles(signal))],
    ['physiology', () => Promise.resolve(physiology.coverage(signal))],
    ['data-plane', () => dataPlane.integrity(signal)],
    ['measured', () => measured.integrity(signal)],
    ['challenge', () => challenge.integrity(signal)],
    ['measured-spatial', () => measuredSpatial.integrity(signal)],
    ['spatial-registration', () => spatialRegistration.integrity(signal)],
    ['revalidation', () => revalidation?.integrity(signal) ?? Promise.resolve({ status: 'not-configured' })]
  ]

  const readiness = async (signal) => {
    signal?.throwIfAborted()
    const checks = domainChecks(signal)
    const results = await settleReadinessChecks(checks.map(([, check]) => check()))
    signal?.throwIfAborted()
    const domains = Object.fromEntries(results.map((value, index) => [checks[index][0], requireReadyResult(checks[index][0], value)]))
    return { domains, releases: results[0] }
  }

  app.get('/api/v1/health', async () => ({ status: 'ok', modelVersion: MODEL.version }))
  app.get('/ops/readyz', async (_request, reply) => {
    try {
      return await operations.readiness(readiness)
    } catch {
      noStore(reply, { dropEtag: false })
      return sendProblem(reply, 503, 'NOT_READY', 'Service Unavailable', 'Runtime is not ready.')
    }
  })
  app.get('/metrics', async (_request, reply) => reply.header('cache-control', 'no-store').type('text/plain; version=0.0.4').send(operations.prometheus()))
  app.get('/api/v1/ready', async (_request, reply) => {
    try {
      const result = await readiness()
      return { status: 'ready', release: result.releases[0], domains: result.domains }
    } catch {
      noStore(reply, { dropEtag: false })
      return sendProblem(reply, 503, 'KNOWLEDGE_NOT_READY', 'Service Unavailable', 'Runtime is not ready.')
    }
  })
}
