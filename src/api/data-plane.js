import {
  DATA_PLANE_CSRF_HEADER,
  DATA_PLANE_CSRF_VALUE,
  AuthorityClosureAuditListSchema,
  AuthorityClosureAuditReportSchema,
  AuthorityClosureAuditRequestSchema,
  DataPlaneDiscoverySchema,
  DataPlaneIntegritySchema,
  DataPlaneLocalPageSchema,
  DataPlaneLocalRecordSchema,
  DataPlaneReleaseDetailSchema,
  DataPlaneReleaseListSchema,
  DataPlaneStatusSchema,
  FactorySemanticDiffSchema
} from '../../shared/data-plane-contracts.js'
import { csrfHeaders, getJson, postJson, queryString, withQuery } from './core.js'

const BASE = '/api/v9/data-plane'
const mutate = (signal) => ({ signal, headers: csrfHeaders(DATA_PLANE_CSRF_HEADER, DATA_PLANE_CSRF_VALUE) })
const releasePath = (releaseId) => `${BASE}/releases/${encodeURIComponent(releaseId)}`

export async function loadDataPlaneDiscovery(signal) {
  return getJson(BASE, DataPlaneDiscoverySchema, signal)
}

export async function loadDataPlaneStatus(signal) {
  return getJson(`${BASE}/status`, DataPlaneStatusSchema, signal)
}

export async function syncDataPlane(signal) {
  return postJson(`${BASE}/sync`, {}, DataPlaneStatusSchema, mutate(signal))
}

export async function loadDataPlaneReleases(signal) {
  return getJson(`${BASE}/releases`, DataPlaneReleaseListSchema, signal)
}

export async function loadDataPlaneRelease(releaseId, signal) {
  return getJson(releasePath(releaseId), DataPlaneReleaseDetailSchema, signal)
}

export async function loadDataPlanePage(releaseId, recordType, query = {}, signal) {
  return getJson(withQuery(`${releasePath(releaseId)}/pages/${encodeURIComponent(recordType)}`, query), DataPlaneLocalPageSchema, signal)
}

export async function loadDataPlaneRecord(releaseId, recordType, recordId, signal) {
  return getJson(`${releasePath(releaseId)}/records/${encodeURIComponent(recordType)}/${encodeURIComponent(recordId)}`, DataPlaneLocalRecordSchema, signal)
}

export async function loadDataPlaneDiff(baseReleaseId, candidateReleaseId, signal) {
  const query = queryString({ base_release_id: baseReleaseId, candidate_release_id: candidateReleaseId })
  return getJson(`${BASE}/diff?${query}`, FactorySemanticDiffSchema, signal)
}

export async function loadDataPlaneIntegrity(signal) {
  return getJson(`${BASE}/integrity`, DataPlaneIntegritySchema, signal)
}

export async function runAuthorityClosureAudit(input, signal) {
  return postJson(`${BASE}/audits`, AuthorityClosureAuditRequestSchema.parse(input), AuthorityClosureAuditReportSchema, mutate(signal))
}

export async function loadAuthorityClosureAudits(signal) {
  return getJson(`${BASE}/audits`, AuthorityClosureAuditListSchema, signal)
}

export async function loadAuthorityClosureAudit(reportDigest, signal) {
  return getJson(`${BASE}/audits/${encodeURIComponent(reportDigest)}`, AuthorityClosureAuditReportSchema, signal)
}
