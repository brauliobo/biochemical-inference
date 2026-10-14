// Zod schema for the entity contract. Structural checks only; cross-entity checks live in validate.js.
import { z } from 'zod'
import { TYPE_IDS } from './types.js'
import { EVIDENCE_KEYS, CLAIM_STATUS_KEYS, CLAIM_SOURCES } from './evidence.js'
import { idType, isId } from './ids.js'
import { AUTHORABLE_RELATIONS, EDGE_SIGNS, EDGE_STRENGTHS, intrinsicSign, isRelation, relationInfo } from './relations.js'

const oneOf = (values) => values.join(' | ')
const text = (what) => z.string({ required_error: `${what} is required`, invalid_type_error: `${what} must be a string` })
  .refine((value) => value.trim().length > 0, `${what} must not be empty`)

/** An entity id, optionally restricted to one type prefix. */
function idField(what, onlyType) {
  return text(what).superRefine((value, ctx) => {
    if (!isId(value)) {
      ctx.addIssue({ code: 'custom', message: `${what} '${value}' is not a valid id; expected '<type>:<kebab-slug>' with type one of ${oneOf(TYPE_IDS)}` })
    } else if (onlyType && idType(value) !== onlyType) {
      ctx.addIssue({ code: 'custom', message: `${what} '${value}' must have type '${onlyType}' (an id like '${onlyType}:some-slug')` })
    }
  })
}

const relationName = text('rel').superRefine((value, ctx) => {
  if (AUTHORABLE_RELATIONS.includes(value)) return
  const hint = isRelation(value)
    ? `'${value}' is an inverse; write the forward form '${relationInfo(value).forward}' on the other entity`
    : `unknown relation '${value}'`
  ctx.addIssue({ code: 'custom', message: `${hint}. Allowed: ${oneOf(AUTHORABLE_RELATIONS)}` })
})

// sign / hypothesis / claim / strength turn a relation into a causal-model edge:
//   sign        '+' | '-' on relations that carry no sign of their own (associated-with, interacts-with, ...)
//   hypothesis  true when the edge is proposed, not established; it must name the claim that asserts it
//   claim       claim:<slug> that asserts this edge (its status says how far the edge is supported)
//   strength    how strong the effect is believed to be: weak | moderate | strong
const relation = z.object({
  rel: relationName,
  to: idField('relation target'),
  note: text('note').optional(),
  sign: z.enum(EDGE_SIGNS, { errorMap: () => ({ message: `sign must be one of ${oneOf(EDGE_SIGNS)}` }) }).optional(),
  hypothesis: z.boolean({ invalid_type_error: 'hypothesis must be a boolean' }).optional(),
  claim: idField('claim', 'claim').optional(),
  strength: z.enum(EDGE_STRENGTHS, { errorMap: () => ({ message: `strength must be one of ${oneOf(EDGE_STRENGTHS)}` }) }).optional()
}).strict().superRefine((item, ctx) => {
  if (item.sign !== undefined && intrinsicSign(item.rel) !== null) {
    ctx.addIssue({ code: 'custom', path: ['sign'], message: `'${item.rel}' already means '${intrinsicSign(item.rel)}'; drop the explicit sign` })
  }
  if (item.hypothesis === true && item.claim === undefined) {
    ctx.addIssue({ code: 'custom', path: ['claim'], message: 'a hypothesis edge must name the claim that asserts it (claim: \'claim:...\')' })
  }
})

const participant = z.object({
  id: idField('participant id', 'compound'),
  n: z.number({ required_error: 'stoichiometry n is required', invalid_type_error: 'stoichiometry n must be a number' }).positive('stoichiometry n must be > 0')
}).strict()

const reactionSpec = z.object({
  reactants: z.array(participant).min(1, 'a reaction needs at least one reactant'),
  products: z.array(participant).min(1, 'a reaction needs at least one product'),
  ec: text('ec').optional(),
  rhea: text('rhea').optional(),
  reactome: text('reactome').optional(),
  reversible: z.boolean({ invalid_type_error: 'reversible must be a boolean' }).optional(),
  compartment: text('compartment').optional(),
  enzymes: z.array(idField('enzyme id', 'enzyme')).optional()
}).strict()

// Fields that exist only on one entity type. `required` ones must be present on that type.
export const TYPE_SPECIFIC_FIELDS = Object.freeze({
  reaction: { required: ['reaction'], optional: [] },
  article: { required: ['authors', 'year', 'journal', 'verified', 'takeaways'], optional: ['doi', 'pmid', 'url'] },
  claim: { required: ['statement', 'source', 'status'], optional: [] }
})

const currentYearCeiling = 2100

const entityObject = z.object({
  id: idField('id'),
  type: z.enum(TYPE_IDS, { errorMap: () => ({ message: `type must be one of ${oneOf(TYPE_IDS)}` }) }),
  name: text('name'),
  aliases: z.array(text('alias')).optional(),
  summary: text('summary').refine((value) => value.length <= 200, (value) => ({ message: `summary must be at most 200 characters (is ${value.length})` })),
  body: z.array(text('body paragraph'), { invalid_type_error: 'body must be an array of paragraph strings' }).optional(),
  evidence: z.enum(EVIDENCE_KEYS, { errorMap: () => ({ message: `evidence must be one of ${oneOf(EVIDENCE_KEYS)}` }) }),
  facts: z.record(z.string({ invalid_type_error: 'fact values must be strings' }), { invalid_type_error: 'facts must be an object of string values' }).optional(),
  relations: z.array(relation, { invalid_type_error: 'relations must be an array' }).optional(),
  refs: z.array(idField('ref', 'article')).optional(),
  reaction: reactionSpec.optional(),
  authors: z.array(text('author')).min(1, 'authors must list at least one author').optional(),
  year: z.number({ invalid_type_error: 'year must be a number' }).int('year must be an integer').min(1500, 'year looks wrong').max(currentYearCeiling, 'year looks wrong').optional(),
  journal: text('journal').optional(),
  doi: z.string().regex(/^10\.\d{4,9}\/\S+$/, "doi must be a bare DOI like '10.1000/xyz', not a URL").optional(),
  pmid: z.string().regex(/^\d{1,9}$/, 'pmid must be digits only').optional(),
  url: z.string().url('url must be an absolute URL').optional(),
  verified: z.boolean({ invalid_type_error: 'verified must be a boolean' }).optional(),
  takeaways: z.array(text('takeaway')).min(1, 'takeaways must list at least one point').optional(),
  statement: text('statement').optional(),
  source: z.enum(CLAIM_SOURCES, { errorMap: () => ({ message: `source must be one of ${oneOf(CLAIM_SOURCES)}` }) }).optional(),
  status: z.enum(CLAIM_STATUS_KEYS, { errorMap: () => ({ message: `status must be one of ${oneOf(CLAIM_STATUS_KEYS)}` }) }).optional()
}).strict()

export const entitySchema = entityObject.superRefine((entity, ctx) => {
  const add = (path, message) => ctx.addIssue({ code: 'custom', path, message })
  if (idType(entity.id) !== entity.type) add(['id'], `id '${entity.id}' must start with its type: '${entity.type}:'`)
  for (const [owner, { required, optional }] of Object.entries(TYPE_SPECIFIC_FIELDS)) {
    for (const field of [...required, ...optional]) {
      if (entity.type !== owner && entity[field] !== undefined) add([field], `field '${field}' is only valid on ${owner} entities`)
    }
    if (entity.type === owner) {
      for (const field of required) if (entity[field] === undefined) add([field], `${owner} entities require '${field}'`)
    }
  }
})

export function formatPath(path) {
  return path.reduce((out, part) => (typeof part === 'number' ? `${out}[${part}]` : out ? `${out}.${part}` : String(part)), '')
}

function describeIssue(issue) {
  if (issue.code === 'unrecognized_keys') return `unknown field${issue.keys.length > 1 ? 's' : ''}: ${issue.keys.join(', ')}`
  return issue.message
}

/**
 * Check one raw entity. Returns [] when valid, else issues:
 * { id, path, message } where id names the offending entity (or '#<index>' if it has none).
 */
export function checkEntity(raw, index = 0) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return [{ id: `#${index}`, path: '', message: 'entity must be an object' }]
  }
  const result = entitySchema.safeParse(raw)
  if (result.success) return []
  const id = typeof raw.id === 'string' && raw.id ? raw.id : `#${index}`
  return result.error.issues.map((issue) => ({ id, path: formatPath(issue.path), message: describeIssue(issue) }))
}

export function formatIssue(issue) {
  return `${issue.id}${issue.path ? ` ${issue.path}` : ''}: ${issue.message}`
}
