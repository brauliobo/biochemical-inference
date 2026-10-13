import {
  ConformanceResultSchema,
  CouplingCreateRequestSchema,
  PHYSIOLOGY_CSRF_HEADER,
  PHYSIOLOGY_CSRF_VALUE,
  PackageValidationRequestSchema,
  PackageValidationResponseSchema,
  PhysiologyCouplingSchema,
  PhysiologyCoverageMatrixSchema,
  PhysiologyDiscoverySchema,
  PhysiologyEvidenceSchema,
  PhysiologyPackageSchema,
  PhysiologyRunRequestSchema,
  PhysiologyRunSchema,
  TrustKeySchema
} from '../../shared/physiology-contracts.js'
import { csrfHeaders, getJson, postJson } from './core.js'

const BASE = '/api/v8/physiology'
const mutate = (signal) => ({ signal, headers: csrfHeaders(PHYSIOLOGY_CSRF_HEADER, PHYSIOLOGY_CSRF_VALUE) })

export async function loadPhysiologyWorkbench(signal) {
  const [discovery, evidence, packages, trust, coverage, couplings, runs] = await Promise.all([
    getJson(BASE, PhysiologyDiscoverySchema, signal),
    getJson(`${BASE}/evidence`, PhysiologyEvidenceSchema, signal),
    getJson(`${BASE}/packages`, PhysiologyPackageSchema.array(), signal),
    getJson(`${BASE}/trust`, TrustKeySchema.array(), signal),
    getJson(`${BASE}/coverage`, PhysiologyCoverageMatrixSchema, signal),
    getJson(`${BASE}/couplings`, PhysiologyCouplingSchema.array(), signal),
    getJson(`${BASE}/runs`, PhysiologyRunSchema.array(), signal)
  ])
  if (discovery.releaseId !== evidence.release.id || discovery.releaseDigest !== evidence.release.digest || coverage.release.digest !== evidence.release.digest) throw new Error('Physiology responses do not match the independently pinned evidence release and digest.')
  return { discovery, evidence, packages, trust, coverage, couplings, runs }
}

export async function validatePhysiologyPackage(packageBase64, signal) {
  const request = PackageValidationRequestSchema.parse({ packageBase64 })
  return postJson(`${BASE}/packages/validate`, request, PackageValidationResponseSchema, mutate(signal))
}

export async function installPhysiologyPackage(packageBase64, signal) {
  const request = PackageValidationRequestSchema.parse({ packageBase64 })
  return postJson(`${BASE}/packages/install`, request, PhysiologyPackageSchema, mutate(signal))
}

export async function runPhysiologyConformance(packageDigest, signal) {
  return postJson(`${BASE}/packages/${encodeURIComponent(packageDigest)}/conformance`, {}, ConformanceResultSchema, mutate(signal))
}

export async function createPhysiologyCoupling(input, signal) {
  return postJson(`${BASE}/couplings`, CouplingCreateRequestSchema.parse(input), PhysiologyCouplingSchema, mutate(signal))
}

export async function runPhysiologyCoupling(couplingDigest, signal) {
  return postJson(`${BASE}/runs`, PhysiologyRunRequestSchema.parse({ couplingDigest }), PhysiologyRunSchema, mutate(signal))
}
