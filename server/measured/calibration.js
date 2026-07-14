import { canonicalJson } from '../../shared/canonical-json.js'
import { CalibrationArtifactSchema, MEASURED_CALIBRATION_ALGORITHM, MEASURED_CALIBRATION_PARTITION_DIGEST, MEASURED_GROUP_IDS } from '../../shared/measured-contracts.js'
import { measuredSha256 } from './verification.js'

function unique(values) {
  return [...new Set(values)].sort()
}

function linearFit(points) {
  const count = points.length
  const meanX = points.reduce((sum, point) => sum + point.x, 0) / count
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / count
  const denominator = points.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0)
  if (denominator === 0) return null
  const slope = points.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0) / denominator
  const intercept = meanY - slope * meanX
  const residual = points.reduce((sum, point) => sum + (point.y - (intercept + slope * point.x)) ** 2, 0)
  const total = points.reduce((sum, point) => sum + (point.y - meanY) ** 2, 0)
  return { intercept, slope, rSquared: total === 0 ? 1 : 1 - residual / total }
}

// This module receives only a local calibration repository. It has no measured client or evaluation capability.
export function runMeasuredCalibration(repository, selection) {
  const exposedMethods = Object.keys(repository).sort()
  const expectedMethods = ['accessReport', 'applicability', 'calibrationMeasurements', 'calibrationMissingness', 'exclusions', 'partition', 'release']
  if (canonicalJson(exposedMethods) !== canonicalJson(expectedMethods) || ['evaluate', 'measurements', 'developmentMeasurements', 'records', 'client'].some((name) => name in repository)) throw new TypeError('Calibration repository exposes methods outside the calibration-only interface.')
  const release = repository.release()
  const partition = repository.partition(selection.partitionId)
  const applicability = repository.applicability(selection.studyId, selection.observableId)
  const selected = repository.calibrationMeasurements(selection).map(({ measurement, lineage, lineageDigest }) => ({ measurement, lineage, lineageDigest }))
  const missingness = repository.calibrationMissingness(selection)
  const exclusions = repository.exclusions()
  const structuralFindings = []
  if (!partition || partition.role !== 'calibration' || partition.closure_digest !== MEASURED_CALIBRATION_PARTITION_DIGEST || canonicalJson(partition.family_ids) !== canonicalJson([selection.familyId]) || canonicalJson(partition.study_ids) !== canonicalJson([selection.studyId])) structuralFindings.push('Calibration partition family/study/role closure is invalid.')
  if (selected.length !== 34) structuralFindings.push('Calibration selection must contain exactly 34 signed lineage measurements.')
  if (canonicalJson(unique(selected.map((item) => item.measurement.group_id))) !== canonicalJson(MEASURED_GROUP_IDS)) structuralFindings.push('Calibration measurements do not cover the exact five declared groups.')
  for (const item of selected) {
    const { measurement, lineage } = item
    if (measurement.role !== 'calibration' || lineage.measurement.role !== 'calibration' || canonicalJson(measurement) !== canonicalJson(lineage.measurement)) structuralFindings.push(`Measurement/lineage role or value mismatch: ${measurement.id}.`)
    if (measurement.family_id !== selection.familyId || lineage.family.id !== selection.familyId || lineage.family.role !== 'calibration' || measurement.study_id !== selection.studyId || lineage.study.id !== selection.studyId || lineage.study.family_id !== selection.familyId) structuralFindings.push(`Measurement family/study mismatch: ${measurement.id}.`)
    if (measurement.context_id !== lineage.context.id || measurement.group_id !== lineage.group.id || lineage.group.study_id !== selection.studyId || lineage.context.group_id !== measurement.group_id || lineage.context.study_id !== selection.studyId || (lineage.experimental_unit && (lineage.experimental_unit.group_id !== measurement.group_id || lineage.experimental_unit.study_id !== selection.studyId))) structuralFindings.push(`Measurement group/context mismatch: ${measurement.id}.`)
    if (measurement.observable_id !== selection.observableId || lineage.observable.id !== selection.observableId || lineage.context.assay_id !== lineage.assay.id || lineage.context.protocol_id !== lineage.protocol.id || lineage.assay.protocol_id !== lineage.protocol.id || lineage.protocol.study_id !== selection.studyId || lineage.interventions.some((intervention) => intervention.study_id !== selection.studyId) || lineage.uncertainty.measurement_id !== measurement.id) structuralFindings.push(`Measurement observable/assay/protocol mismatch: ${measurement.id}.`)
    if (lineage.specimen?.collection_time_value !== selection.timeValue || lineage.specimen?.collection_time_unit !== selection.timeUnit || lineage.specimen?.group_id !== measurement.group_id || lineage.specimen?.study_id !== selection.studyId) structuralFindings.push(`Measurement specimen/time mismatch: ${measurement.id}.`)
  }
  const reasons = []
  const assayIds = unique(selected.map((item) => item.lineage.assay.id))
  const protocolIds = unique(selected.map((item) => item.lineage.protocol.id))
  const units = unique(selected.map((item) => item.measurement.normalized.unit))
  const doseUnits = unique(selected.flatMap((item) => item.lineage.interventions.map((intervention) => intervention.dose_unit).filter(Boolean)))
  const incompleteMatrix = selected.some((item) => item.lineage.specimen?.matrix === null)
  const incompleteAssay = selected.some((item) => item.lineage.assay.method_status === 'unreported')
  if (structuralFindings.length) throw new TypeError(structuralFindings[0])
  if (!applicability || applicability.status !== 'compatible-within-study-context') reasons.push(`Producer applicability is ${applicability?.status ?? 'missing'}; the exact assay/specimen context is not complete.`)
  if (incompleteAssay) reasons.push('The source export does not report the assay method, so scientific assay identity cannot be established.')
  if (incompleteMatrix) reasons.push('The source export does not report the specimen matrix, so a scientifically qualified dose-response fit is not asserted.')
  const reportedUnits = unique(selected.map((item) => item.measurement.reported_unit))
  if (assayIds.length !== 1 || protocolIds.length !== 1 || units.length !== 1 || reportedUnits.length !== 1 || doseUnits.length !== 1) throw new TypeError('Selected source values do not share one exact assay, protocol, reported/normalized unit, and dose unit.')

  const points = selected.map((item) => ({
    x: Number(item.lineage.interventions[0]?.dose_value),
    y: Number(item.measurement.normalized.value)
  }))
  const fit = reasons.length === 0 && points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y)) ? linearFit(points) : null
  if (reasons.length === 0 && !fit) reasons.push('The selected dose values do not support a bounded linear descriptive fit.')
  const access = repository.accessReport()
  const value = {
    accessProof: {
      calls: access.calls,
      rows: access.rows,
      exposedMethods: ['release', 'partition', 'applicability', 'calibrationMeasurements', 'calibrationMissingness', 'exclusions', 'accessReport'],
      rolesObserved: access.rolesObserved,
      forbiddenMethodsAvailable: false,
      developmentMeasurementsRead: 0,
      evaluationClientAvailable: false,
      externalHeldoutMeasurementsRead: 0,
      validationMeasurementsRead: 0
    },
    algorithm: { id: MEASURED_CALIBRATION_ALGORITHM, deterministic: true, fit: 'ordinary-least-squares-individual-observations' },
    artifactSchemaVersion: '1.0.0',
    conclusion: 'no-validation-conclusion',
    diagnostics: {
      assayIds,
      doseUnit: doseUnits[0] ?? null,
      groupCount: unique(selected.map((item) => item.measurement.group_id)).length,
      measurementCount: selected.length,
      protocolIds,
      time: { unit: selection.timeUnit, value: selection.timeValue },
      units
    },
    exclusions,
    fit,
    measurements: selected.map((item) => ({
      id: item.measurement.id,
      lineageDigest: item.lineageDigest,
      normalizedUnit: item.measurement.normalized.unit,
      normalizedValue: item.measurement.normalized.value,
      reportedUnit: item.measurement.reported_unit,
      reportedValue: item.measurement.reported_value
    })).sort((left, right) => left.id.localeCompare(right.id)),
    missingness,
    partition,
    reasons,
    release,
    selection: {
      ...selection,
      rationale: 'C55801C is the immutable calibration family; ALT at 24 h is selected within one source study, observable, collection time, and declared dose-group set. No development or heldout outcome is consulted.'
    },
    status: reasons.length === 0 ? 'completed' : 'not-evaluable'
  }
  const artifactDigest = measuredSha256(Buffer.from(canonicalJson(value)))
  return CalibrationArtifactSchema.parse({ ...value, artifactDigest })
}
