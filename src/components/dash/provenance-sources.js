// Provenance records for the ProvenancePanel, one resolver per model. Every record has the same shape:
//   { id, value, low, high, unit, confidence, article, locator, note, assumed }
// `article` is an 'article:<id>' entity id (linked to /kb/article/...) or null; `assumed` is true when the number is an
// assumption, a fit made here or has no source (shown as a hypothesis flag). The literature tables are large, so each
// resolver loads them on first use only.

const ASSUMED = new Set(['assumed', 'low'])

/** Record for a parameter of a plain engine model ({ id, value, low, high, unit, source, confidence }). */
export function describeParameter(parameter, b2 = new Map()) {
  const source = String(parameter.source ?? '')
  const table = source.startsWith('b2:') ? b2.get(source.slice(3)) : null
  const fitted = source.startsWith('fit')
  const assumption = !source || source === 'assumed' || source.startsWith('assum')
  return {
    id: parameter.id,
    value: parameter.value,
    low: parameter.low ?? parameter.value,
    high: parameter.high ?? parameter.value,
    unit: parameter.unit ?? '',
    confidence: parameter.confidence ?? (table ? table.confidence : 'assumed'),
    article: table?.source?.startsWith('article:') ? table.source : source.startsWith('article:') ? source : null,
    locator: table?.locator ?? '',
    note: table?.note ?? (fitted ? source.replace(/^fit:?\s*/, 'Fitted here: ') : assumption ? 'Assumed; no source.' : ''),
    assumed: assumption || fitted || ASSUMED.has(parameter.confidence) || parameter.confidence === 'assumed'
  }
}

async function b2Table() {
  const module = await import('../../sim/data/parameters-b2.js')
  return new Map(module.default.parameters.map((p) => [p.id, p]))
}

const MODEL_LOADERS = {
  gastric: async () => (await import('../../sim/models/gastric.js')).gastricModel,
  histamine: async () => (await import('../../sim/models/histamine.js')).histamineModel,
  pk: async () => {
    const { pkModels } = await import('../../sim/models/pk.js')
    // the three sketches reuse ids (ka, ke): address them as 'betaine:ka', 'choline:ka', 'glycine:ke'
    return { parameters: Object.entries(pkModels).flatMap(([name, model]) => model.parameters.map((p) => ({ ...p, id: `${name}:${p.id}` }))) }
  }
}

/** Resolver { get(id) -> record | null } for 'methylation' | 'gastric' | 'histamine' | 'pk'. */
export async function loadProvenance(model) {
  if (model === 'methylation') {
    const { parameterSources } = await import('../../sim/models/index.js')
    return {
      get: async (id) => {
        const rec = await parameterSources(id)
        if (!rec) return null
        return {
          id: rec.id, value: rec.value, low: rec.low, high: rec.high, unit: rec.unit, confidence: rec.confidence,
          article: rec.sourceArticle?.startsWith?.('article:') ? rec.sourceArticle : null, locator: rec.locator ?? '', note: rec.note ?? '',
          assumed: rec.evidence === 'assumed' || rec.evidence === 'fitted-shape' || rec.confidence === 'assumed'
        }
      }
    }
  }
  const load = MODEL_LOADERS[model]
  if (!load) throw new Error(`No parameter sources for model "${model}"`)
  const [engineModel, b2] = await Promise.all([load(), b2Table()])
  const byId = new Map(engineModel.parameters.map((p) => [p.id, p]))
  return { get: async (id) => (byId.has(id) ? describeParameter(byId.get(id), b2) : null) }
}
