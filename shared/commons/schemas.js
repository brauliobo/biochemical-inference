// Reusable zod primitives shared by shared/*-contracts.js.
// Browser-bundled: keep this module free of node:* imports.
import { z } from 'zod'

// Digests and timestamps
export const Sha256HexSchema = z.string().regex(/^[a-f0-9]{64}$/)
export const Sha256DigestSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/)
export const UtcInstantSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
export const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
export const OffsetDatetimeSchema = z.string().datetime({ offset: true })
export const UtcDatetimeSchema = z.string().datetime()

// Versions and slugs
export const SemverSchema = z.string().regex(/^[0-9]+\.[0-9]+\.[0-9]+$/)
export const KebabIdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
export const ReleaseIdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*-v[0-9]+\.[0-9]+\.[0-9]+$/)
export const SourceIdSchema = z.string().regex(/^[A-Z][A-Z0-9_]*$/)
export const DecimalTextSchema = z.string().max(64).regex(/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/)
// Lowercase dotted/colon identifier of bounded length (challenge: 180, measured: 160).
export const boundedIdentifierSchema = (max) => z.string().min(1).max(max).regex(/^[a-z][a-z0-9]*(?:[:.-][A-Za-z0-9]+)*$/)
// Mixed-case identifier of at most 64 characters (portfolio, workspace).
export const ShortIdentifierSchema = z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/)

// CURIE-style identifiers
export const prefixedIdSchema = (prefix, body) => z.string().regex(new RegExp(`^${prefix}:${body}$`))
export const NcbiTaxonIdSchema = z.string().regex(/^NCBITaxon:[1-9][0-9]*$/)
export const ChebiIdSchema = z.string().regex(/^CHEBI:[1-9][0-9]*$/)
export const RheaIdSchema = z.string().regex(/^RHEA:[1-9][0-9]*$/)
export const UniProtIdSchema = z.string().regex(/^UniProtKB:[A-Z0-9]+$/)
export const PubMedOrUniProtIdSchema = z.string().regex(/^(?:PubMed:[1-9][0-9]*|UniProtKB:[A-Z0-9]+)$/)
export const HumanMouseTaxonSchema = z.enum(['NCBITaxon:9606', 'NCBITaxon:10090'])
export const FactoryRecordTypeSchema = z.enum(['taxa', 'compounds', 'reactions', 'proteins', 'references', 'catalysis', 'limitations'])

// Numbers and strings
export const FiniteNumberSchema = z.number().finite()
export const NonNegativeIntSchema = z.number().int().nonnegative()
export const PositiveIntSchema = z.number().int().positive()
export const NonEmptyStringSchema = z.string().min(1)
export const StrictEmptyObjectSchema = z.object({}).strict()

// Pagination
export const PageLimitSchema = z.number().int().min(1).max(100)
export const CursorSchema = z.string().regex(/^[A-Za-z0-9_-]+$/).max(8192)
export const CoercedNonNegativeIntSchema = z.coerce.number().int().nonnegative()
export const pageLimitQuerySchema = (defaultLimit, max = 100) => z.coerce.number().int().min(1).max(max).default(defaultLimit)

// JSON value with finite numbers only.
export const JsonValueSchema = z.lazy(() => z.union([
  z.null(),
  z.boolean(),
  z.string(),
  FiniteNumberSchema,
  z.array(JsonValueSchema),
  z.record(JsonValueSchema)
]))

// Canonical (no trailing bits) unpadded base64url of exactly `bytes` bytes.
const BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
export function isCanonicalBase64Url(value, bytes) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value) || value.length !== Math.ceil(bytes * 8 / 6)) return false
  const remainder = bytes % 3
  if (remainder === 0) return true
  const finalIndex = BASE64URL_ALPHABET.indexOf(value.at(-1))
  return finalIndex >= 0 && finalIndex % (remainder === 1 ? 16 : 4) === 0
}

// Release references: { id, schema_version, digest }
export const releaseRefSchema = (idSchema, schemaVersion, digestSchema) => z.object({
  id: idSchema,
  schema_version: z.literal(schemaVersion),
  digest: digestSchema
}).strict()
export const pinnedReleaseRefSchema = (releaseId, schemaVersion, releaseDigest) => releaseRefSchema(z.literal(releaseId), schemaVersion, z.literal(releaseDigest))

// Single-release catalog entry pinned to one release.
export const pinnedCatalogEntrySchema = ({ releaseId, schemaVersion, releaseDigest, title }) => z.object({
  release_id: z.literal(releaseId),
  title,
  schema_version: z.literal(schemaVersion),
  release_digest: z.literal(releaseDigest),
  manifest_path: z.literal(`${releaseId}/manifest.json`)
}).strict()

// { release, items } upstream response envelope.
export const releaseItemsEnvelopeSchema = (releaseSchema, itemSchema) => z.object({ release: releaseSchema, items: z.array(itemSchema) }).strict()
