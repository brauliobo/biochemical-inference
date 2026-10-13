import { ExperimentSchema, PortfolioModelSchema, RunRecordSchema } from '../../shared/portfolio-contracts.js'
import { ParameterOptionsResponseSchema, StudyRecordSchema, StudyRequestSchema } from '../../shared/parameter-contracts.js'
import { getJson, postJson } from './core.js'

export async function loadPortfolioModels(signal) {
  return getJson('/api/v2/models', PortfolioModelSchema.array(), signal)
}

export async function runPortfolioExperiment(input, signal) {
  const experiment = ExperimentSchema.parse(input)
  return postJson('/api/v2/runs', { experiment }, RunRecordSchema, { signal })
}

export async function loadParameterOptions(signal) {
  return getJson('/api/v2/parameter-options', ParameterOptionsResponseSchema, signal)
}

export async function runParameterStudy(input, signal) {
  return postJson('/api/v2/studies', StudyRequestSchema.parse(input), StudyRecordSchema, { signal })
}
