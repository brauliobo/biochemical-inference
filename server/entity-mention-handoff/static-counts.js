import { sha256Hex } from '../commons/digest.js'
import { TextDecoder } from 'node:util'
import { canonicalJson } from '../../shared/canonical-json.js'

const utf8 = new TextDecoder('utf-8', { fatal: true })
const SHARD_ALGORITHM = 'sha256-utf8-first-byte-v1'
const SHARDS = Object.freeze(Array.from({ length: 256 }, (_, index) => index.toString(16).padStart(2, '0')))
const SHARD_FAMILIES = Object.freeze(['article-details', 'entity-details', 'entity-edges-in', 'entity-edges-out', 'mentions-by-article', 'mentions-by-entity'])
const DIRECT_PROJECTIONS = Object.freeze({
  'entity-facets.json':                 'facets',
  'entity-input-closures.json':         'input_closures',
  'entity-linked-coverage.json':        'coverage',
  'entity-linked-evidence.json':        'evidence',
  'entity-linked-facets.json':          'facets',
  'entity-linked-gaps.json':            'slice_gaps',
  'entity-linked-limitations.json':     'limitations',
  'entity-linked-provenance.json':      'provenance',
  'entity-linked-rights.json':          'rights',
  'entity-linked-source-coverage.json': 'source_coverage',
  'entity-linked-sources.json':         'sources',
  'entity-predicates.json':             'predicate_policies',
  'entity-profiles.json':               'attribute_profiles',
  'entity-slice-summary.json':           'slice_summary',
  'entity-types.json':                   'entity_types'
})

function fail(message) {
  throw new TypeError(`Entity static count verification failed: ${message}.`)
}

function exactKeys(value, expected, path) {
  const keys = value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value).sort() : []
  if (canonicalJson(keys) !== canonicalJson([...expected].sort())) fail(`${path} has an invalid top-level shape`)
}

function exactIds(actual, expected, path) {
  const selected = actual.map(String).sort()
  const wanted = expected.map(String).sort()
  if (canonicalJson(selected) !== canonicalJson(wanted)) fail(`${path} does not project the independently selected identities`)
}

const shardFor = (id) => sha256Hex(id).slice(0, 2)

function canonicalRecords(parsed, family) {
  const document = parsed.get(`entity-records/${family}.json`)
  if (!document || !Array.isArray(document.records)) fail(`canonical family ${family} is unavailable`)
  return document.records
}

function expectedNquadCount(parsed) {
  const sum = (records, count) => records.reduce((total, record) => total + count(record), 0)
  return sum(canonicalRecords(parsed, 'entities'), (record) => 4 + Number(record.taxon_id !== null) + record.facet_ids.length + record.source_refs.length + record.rights_refs.length + record.provenance_refs.length)
    + sum(canonicalRecords(parsed, 'edges'), (record) => 6 + record.rights_refs.length + record.provenance_refs.length)
    + sum(canonicalRecords(parsed, 'articles'), (record) => 5 + record.rights_refs.length)
    + sum(canonicalRecords(parsed, 'mentions'), (record) => 4 + record.rights_refs.length)
    + sum(canonicalRecords(parsed, 'text_assertions'), (record) => 7 + record.rights_refs.length)
    + canonicalRecords(parsed, 'rights').length * 4
    + canonicalRecords(parsed, 'provenance').length * 4
}

export function verifyEntityMentionStaticCounts({ staticManifest, entityEnvelope, parsed, contents }) {
  const descriptors = new Map(staticManifest.files.map((descriptor) => [descriptor.filename, descriptor]))
  const expectedMedia = new Map()
  if (descriptors.size !== staticManifest.files.length) fail('static descriptor paths are duplicated')
  const expectedPaths = new Set(entityEnvelope.files.map((descriptor) => descriptor.path))
  expectedPaths.add('entity-release.json')
  expectedMedia.set('entity-release.json', 'application/json')

  for (const descriptor of entityEnvelope.files) {
    expectedMedia.set(descriptor.path, 'application/json')
    const document = parsed.get(descriptor.path)
    exactKeys(document, ['records', 'schema_version'], descriptor.path)
    if (document.schema_version !== '1.0.0' || descriptor.record_count !== document.records.length) fail(`${descriptor.path} canonical count is invalid`)
  }

  for (const [path, family] of Object.entries(DIRECT_PROJECTIONS)) {
    expectedMedia.set(path, 'application/json')
    expectedPaths.add(path)
    const document = parsed.get(path)
    exactKeys(document, ['records', 'schema_version'], path)
    const source = canonicalRecords(parsed, family)
    if (document.schema_version !== '1.0.0' || canonicalJson(document.records) !== canonicalJson(source)) fail(`${path} is not the exact canonical ${family} projection`)
  }

  expectedPaths.add('entity-context.json')
  expectedMedia.set('entity-context.json', 'application/json')
  const context = parsed.get('entity-context.json')
  exactKeys(context, ['prefixes', 'schema_version', 'selected_context'], 'entity-context.json')
  const contexts = canonicalRecords(parsed, 'contexts')
  const prefixes = canonicalRecords(parsed, 'prefixes')
  if (context.schema_version !== '1.0.0' || canonicalJson(context.selected_context) !== canonicalJson(contexts[0]) || canonicalJson(context.prefixes) !== canonicalJson(prefixes)) fail('entity-context.json is not the exact context projection')

  const entities = canonicalRecords(parsed, 'entities')
  const entityTypes = canonicalRecords(parsed, 'entity_types').map((record) => record.entity_type).sort()
  for (const type of entityTypes) {
    const path = `entity-index-${type}.json.gz`
    expectedPaths.add(path)
    expectedMedia.set(path, 'application/gzip')
    const document = parsed.get(path)
    exactKeys(document, ['entity_type', 'records', 'schema_version'], path)
    if (document.schema_version !== '1.0.0' || document.entity_type !== type) fail(`${path} type binding is invalid`)
    exactIds(document.records.map((record) => record.id), entities.filter((record) => record.entity_type === type).map((record) => record.id), path)
  }

  expectedPaths.add('article-index.json.gz')
  expectedMedia.set('article-index.json.gz', 'application/gzip')
  const articleIndex = parsed.get('article-index.json.gz')
  exactKeys(articleIndex, ['records', 'schema_version'], 'article-index.json.gz')
  const articles = canonicalRecords(parsed, 'articles')
  exactIds(articleIndex.records.map((record) => record.id), articles.map((record) => record.id), 'article-index.json.gz')

  const resolvedEntityIds = new Set(canonicalRecords(parsed, 'mention_resolutions').filter((record) => record.status === 'resolved' && record.selected_entity_id !== null).map((record) => record.selected_entity_id))
  const expectedShardIds = {
    'article-details':    (shard) => articles.filter((record) => shardFor(record.id) === shard).map((record) => record.id),
    'entity-details':     (shard) => entities.filter((record) => shardFor(record.id) === shard).map((record) => record.id),
    'entity-edges-in':    (shard) => entities.filter((record) => shardFor(record.id) === shard).map((record) => record.id),
    'entity-edges-out':   (shard) => entities.filter((record) => shardFor(record.id) === shard).map((record) => record.id),
    'mentions-by-article': (shard) => articles.filter((record) => shardFor(record.id) === shard).map((record) => record.id),
    'mentions-by-entity': (shard) => entities.filter((record) => resolvedEntityIds.has(record.id) && shardFor(record.id) === shard).map((record) => record.id)
  }
  const idField = { 'article-details': 'id', 'entity-details': 'id', 'entity-edges-in': 'entity_id', 'entity-edges-out': 'entity_id', 'mentions-by-article': 'article_id', 'mentions-by-entity': 'entity_id' }
  const shardTotals = Object.fromEntries(SHARD_FAMILIES.map((family) => [family, 0]))
  for (const family of SHARD_FAMILIES) for (const shard of SHARDS) {
    const path = `${family}-${shard}.json.gz`
    expectedPaths.add(path)
    expectedMedia.set(path, 'application/gzip')
    const document = parsed.get(path)
    exactKeys(document, ['records', 'schema_version', 'shard', 'shard_algorithm'], path)
    if (document.schema_version !== '1.0.0' || document.shard !== shard || document.shard_algorithm !== SHARD_ALGORITHM) fail(`${path} shard binding is invalid`)
    exactIds(document.records.map((record) => record[idField[family]]), expectedShardIds[family](shard), path)
    shardTotals[family] += document.records.length
  }

  expectedPaths.add('entity-atlas.jsonld')
  expectedMedia.set('entity-atlas.jsonld', 'application/ld+json')
  const jsonld = parsed.get('entity-atlas.jsonld')
  exactKeys(jsonld, ['@context', '@graph'], 'entity-atlas.jsonld')
  const graphCount = entities.length + canonicalRecords(parsed, 'edges').length + articles.length + canonicalRecords(parsed, 'mentions').length + canonicalRecords(parsed, 'text_assertions').length + canonicalRecords(parsed, 'rights').length + canonicalRecords(parsed, 'provenance').length
  if (jsonld['@graph'].length !== graphCount) fail('entity-atlas.jsonld graph count does not close over canonical families')

  expectedPaths.add('entity-atlas.nq')
  expectedMedia.set('entity-atlas.nq', 'application/n-quads')
  const nquadText = utf8.decode(contents.get('entity-atlas.nq'))
  if (!nquadText.endsWith('\n') || nquadText.split('\n').slice(0, -1).some((line) => !line.length)) fail('entity-atlas.nq framing is invalid')
  const nquadCount = nquadText.length ? nquadText.split('\n').length - 1 : 0
  if (nquadCount !== expectedNquadCount(parsed)) fail('entity-atlas.nq count does not close over canonical families')

  for (const path of expectedPaths) {
    const descriptor = descriptors.get(path)
    if (!descriptor) fail(`required projection ${path} has no static descriptor`)
    if (descriptor.media_type !== expectedMedia.get(path)) fail(`${path} media type is invalid for its projection family`)
    let count
    if (path === 'entity-release.json') count = entityEnvelope.files.length
    else if (path === 'entity-context.json') count = contexts.length + prefixes.length
    else if (path === 'entity-atlas.jsonld') count = graphCount
    else if (path === 'entity-atlas.nq') count = nquadCount
    else count = parsed.get(path)?.records?.length
    if (descriptor.record_count !== count) fail(`${path} descriptor record count ${descriptor.record_count} does not equal independently recomputed ${count}`)
  }
  if (expectedPaths.size !== descriptors.size || [...descriptors.keys()].some((path) => !expectedPaths.has(path))) fail('static projection path families are incomplete or excessive')

  const expectedTotals = {
    'article-details': articles.length,
    'entity-details': entities.length,
    'entity-edges-in': entities.length,
    'entity-edges-out': entities.length,
    'mentions-by-article': articles.length,
    'mentions-by-entity': entities.filter((record) => resolvedEntityIds.has(record.id)).length
  }
  for (const family of SHARD_FAMILIES) if (shardTotals[family] !== expectedTotals[family]) fail(`${family} aggregate shard count is invalid`)
  if (entityTypes.length !== new Set(entityTypes).size || entityTypes.length !== [...descriptors.keys()].filter((path) => /^entity-index-.+\.json\.gz$/.test(path)).length) fail('entity type index family count is invalid')
  if (staticManifest.counts.fixed_shards_per_family !== SHARDS.length || staticManifest.counts.fixed_shard_families !== SHARD_FAMILIES.length || staticManifest.counts.files !== expectedPaths.size) fail('static aggregate file or shard counts are invalid')
  return { graphCount, nquadCount, shardTotals }
}
