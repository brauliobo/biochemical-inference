import { Sha256Schema } from '../../shared/portfolio-contracts.js'
import { paramSchema } from './routes.js'

// Path-parameter schemas shared by several domains.
export const RunIdParamSchema = paramSchema('runId', Sha256Schema)
