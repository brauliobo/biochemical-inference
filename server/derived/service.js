import { canonicalDigest } from '../../shared/canonical-json.js'
import { ReproduceRequestSchema } from '../../shared/derived-contracts.js'
import { apapResultArtifactContent, buildApapDerivedBundle, canonicalResultArtifactsEqual } from './bundle.js'

export class DerivedRequestError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'DerivedRequestError'
    this.statusCode = options.statusCode ?? 409
    this.code = options.code ?? 'DERIVED_REQUEST_REJECTED'
  }
}

export function createDerivedRunService(derivedClient, apapRunService) {
  return {
    async submitApapRun(runId) {
      const record = apapRunService.get(runId)
      if (!record || record.lifecycle !== 'terminal' || record.outcome !== 'successful') {
        throw new DerivedRequestError('Only an existing successful terminal APAP run can be submitted.', { statusCode: 404, code: 'APAP_RUN_NOT_FOUND' })
      }
      const submission = buildApapDerivedBundle(record)
      return derivedClient.submitBundle(submission)
    },

    async reproduce(assertionDigest, input) {
      const request = ReproduceRequestSchema.parse(input)
      const original = apapRunService.get(request.run_id)
      if (!original || original.lifecycle !== 'terminal' || original.outcome !== 'successful') {
        throw new DerivedRequestError('The exact source APAP run is no longer available for reproduction.', { statusCode: 404, code: 'APAP_RUN_NOT_FOUND' })
      }
      const submission = buildApapDerivedBundle(original)
      const wrapped = submission.bundle.assertions.find((item) => item.digest === assertionDigest)
      if (!wrapped) throw new DerivedRequestError('The assertion does not derive from the selected APAP run.', { code: 'DERIVED_LINEAGE_MISMATCH' })
      const detail = await derivedClient.assertion(assertionDigest)
      if (detail.state.review_status !== 'accepted') throw new DerivedRequestError('Reproduction review is allowed only after assertion acceptance.', { code: 'DERIVED_INVALID_TRANSITION' })
      if (detail.assertion.reproduction.result_artifact_digest !== wrapped.assertion.reproduction.result_artifact_digest) {
        throw new DerivedRequestError('The stored assertion does not pin the locally reconstructed result artifact.', { code: 'DERIVED_LINEAGE_MISMATCH' })
      }

      const reproduced = await apapRunService.create(original.specification)
      const reproducedDigest = canonicalDigest(apapResultArtifactContent(reproduced))
      if (reproducedDigest !== detail.assertion.reproduction.result_artifact_digest || !canonicalResultArtifactsEqual(original, reproduced)) {
        throw new DerivedRequestError('The exact APAP rerun did not reproduce the canonical result artifact; no review event was appended.', { code: 'DERIVED_REPRODUCTION_MISMATCH' })
      }
      return derivedClient.appendEvent(assertionDigest, {
        action: 'reproduction-verified',
        reviewer: request.reviewer,
        reason: request.reason,
        related_assertion_digest: null,
        reproduction_artifact_digest: reproducedDigest
      })
    }
  }
}
