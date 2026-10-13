import { z } from 'zod'
import { ParameterOptionsQuerySchema, StudyRequestSchema } from '../../shared/parameter-contracts.js'
import { ArchiveValidationRequestSchema, ExperimentSchema, PORTFOLIO_ARCHIVE_REQUEST_BODY_LIMIT, Sha256Schema } from '../../shared/portfolio-contracts.js'
import { RunIdParamSchema } from '../http/params.js'
import { conflict, notFound, problemReply } from '../http/replies.js'
import { createRouter, paramSchema } from '../http/routes.js'
import { loadParameterOptions } from '../parameters/selection.js'
import { exportCombineArchive, validateCombineArchive } from '../portfolio/archive.js'
import { validateExperimentForModel } from '../portfolio/execution.js'
import { getModel, listModels } from '../portfolio/registry.js'

const PortfolioRunRequestSchema = z.object({ experiment: ExperimentSchema }).strict()
const StudyParamSchema = paramSchema('studyId', Sha256Schema)

const invalidArchive = problemReply(422, 'INVALID_ARCHIVE_REQUEST', 'Archive request must contain bounded base64 content.')
const invalidExperiment = problemReply(422, 'INVALID_EXPERIMENT', 'Experiment contract is invalid.')
const invalidRunId = problemReply(400, 'INVALID_RUN_ID', 'Run identifier is invalid.', { fieldErrors: false })
const invalidParameterOptions = problemReply(400, 'INVALID_PARAMETER_OPTIONS', 'Parameter option filters are invalid.')
const invalidStudy = problemReply(422, 'INVALID_STUDY', 'Study controls are invalid.')
const invalidStudyId = problemReply(400, 'INVALID_STUDY_ID', 'Study identifier is invalid.', { fieldErrors: false })

const modelNotFound = (reply) => notFound(reply, 'MODEL_NOT_FOUND', 'Portfolio model is not registered.')

export function registerPortfolioRoutes(app, { portfolioRuns, parameters, studies }) {
  const { get, post, del } = createRouter(app, invalidExperiment)

  get('/api/v2/models', {}, () => listModels())
  get('/api/v2/models/:modelId', {}, (_input, request, reply) => getModel(request.params.modelId) ?? modelNotFound(reply))
  post('/api/v2/model-archives/validate', { body: ArchiveValidationRequestSchema, invalid: invalidArchive, options: { bodyLimit: PORTFOLIO_ARCHIVE_REQUEST_BODY_LIMIT } },
    ({ body }) => validateCombineArchive(Buffer.from(body.archiveBase64, 'base64')))
  post('/api/v2/model-archives/export', { body: PortfolioRunRequestSchema }, async ({ body }, _request, reply) => {
    const model = getModel(body.experiment.modelId)
    if (!model) return modelNotFound(reply)
    const archive = await exportCombineArchive(model, validateExperimentForModel(model, body.experiment))
    return { profile: 'portfolio-combine-1.0', archiveBase64: archive.toString('base64') }
  })
  post('/api/v2/runs', { body: PortfolioRunRequestSchema }, async ({ body }, _request, reply) => {
    const model = getModel(body.experiment.modelId)
    if (!model) return modelNotFound(reply)
    return reply.status(201).send(await portfolioRuns.create(model, body.experiment))
  })
  get('/api/v2/runs/:runId', { params: RunIdParamSchema, invalid: invalidRunId }, ({ params }, _request, reply) =>
    portfolioRuns.get(params.runId) ?? notFound(reply, 'RUN_NOT_FOUND', 'Portfolio run is not available.'))
  del('/api/v2/runs/:runId', { params: RunIdParamSchema, invalid: invalidRunId }, ({ params }, _request, reply) => {
    if (!portfolioRuns.cancel(params.runId)) return conflict(reply, 'RUN_NOT_CANCELLABLE', 'Run is not active or is already terminal.')
    return reply.status(202).send({ runId: params.runId, lifecycle: 'running', cancellationRequested: true })
  })

  get('/api/v2/parameter-options', { query: ParameterOptionsQuerySchema, invalid: invalidParameterOptions }, ({ query }) =>
    loadParameterOptions(parameters, { parameterId: query.parameter_id, targetContextId: query.target_context_id }))
  post('/api/v2/studies', { body: StudyRequestSchema, invalid: invalidStudy }, async ({ body }, _request, reply) => reply.status(201).send(await studies.create(body)))
  get('/api/v2/studies/:studyId', { params: StudyParamSchema, invalid: invalidStudyId }, ({ params }, _request, reply) =>
    studies.get(params.studyId) ?? notFound(reply, 'STUDY_NOT_FOUND', 'Parameter study is not available.'))
}
