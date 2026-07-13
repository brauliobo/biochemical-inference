import { createHash, createPublicKey } from 'node:crypto'
import { homedir } from 'node:os'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import { mkdir, mkdtemp, realpath, rm } from 'node:fs/promises'
import { z } from 'zod'
import { canonicalDigest, canonicalJson } from '../../shared/canonical-json.js'
import {
  ConformanceResultSchema,
  CouplingCreateRequestSchema,
  PHYSIOLOGY_WARNING,
  PhysiologyCouplingSchema,
  PhysiologyPackageSchema,
  PhysiologyRunRequestSchema,
  PhysiologyRunSchema,
  TrustKeyAddRequestSchema,
  TrustKeySchema
} from '../../shared/physiology-contracts.js'
import { createObjectStore } from '../workspace/object-store.js'
import { openPhysiologyDatabase } from './database.js'
import { createReferencePackages, REFERENCE_KEY_ID, REFERENCE_PUBLIC_KEY_SPKI_BASE64, REFERENCE_PUBLISHER } from './reference.js'
import { checkBubblewrapSandbox, runBubblewrapPlugin } from './sandbox.js'
import { digestBuffer, validateBppPackage } from './package.js'

const BUILT_IN_AT = '2026-07-13T00:00:00.000Z'
const ENGINE_VERSION = 'physiology-coupler-v1.1.0'
const REQUIRED_PLUGINS = ['PLUGIN:CIRCULATION-REFERENCE', 'PLUGIN:LIVER-REFERENCE', 'PLUGIN:KIDNEY-REFERENCE']
const now = () => new Date().toISOString()
const ProcessOutputSchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  outputs: z.array(z.object({ portId: z.string().regex(/^PORT:[A-Z0-9][A-Z0-9-]{2,95}$/), value: z.number().finite().nonnegative(), unit: z.literal('mg/min') }).strict()).max(4)
}).strict()

export class PhysiologyRequestError extends Error {
  constructor(code, message, statusCode = 422) {
    super(message)
    this.name = 'PhysiologyRequestError'
    this.code = code
    this.statusCode = statusCode
  }
}

function inside(parent, child) {
  const path = relative(parent, child)
  return path === '' || (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path))
}

async function selectRoot(options) {
  const configured = options.root ?? options.env.BIOCHEMICAL_PHYSIOLOGY_ROOT ?? (options.env.BIOCHEMICAL_WORKSPACE_ROOT ? join(options.env.BIOCHEMICAL_WORKSPACE_ROOT, 'physiology-v1') : undefined)
  if (!configured && options.env.NODE_ENV === 'test') {
    const testRoot = resolve(options.env.BIOCHEMICAL_TEST_PHYSIOLOGY_ROOT ?? resolve(process.cwd(), '..', '.biochemical-inference-test-workspaces'))
    await mkdir(testRoot, { recursive: true, mode: 0o700 })
    return { root: await mkdtemp(resolve(testRoot, 'physiology-')), ephemeral: true }
  }
  const root = resolve(configured ?? resolve(homedir(), '.local', 'share', 'biochemical-inference', 'physiology-v1'))
  if (inside(resolve(process.cwd()), root)) throw new PhysiologyRequestError('physiology_root_in_source', 'Physiology storage root must be outside the source tree.', 500)
  await mkdir(root, { recursive: true, mode: 0o700 })
  const [sourceRealPath, rootRealPath] = await Promise.all([realpath(process.cwd()), realpath(root)])
  if (inside(sourceRealPath, rootRealPath)) throw new PhysiologyRequestError('physiology_root_in_source', 'Physiology storage root must be outside the source tree.', 500)
  return { root: rootRealPath, ephemeral: false }
}

function transaction(database, action) {
  database.exec('BEGIN IMMEDIATE')
  try {
    const result = action()
    database.exec('COMMIT')
    return result
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  }
}

function revokedCertification(certification) {
  return {
    ...certification,
    status: 'not-certified',
    checks: { ...certification.checks, signature: false },
    protocolConformance: 'failed'
  }
}

const due = (time, cadence) => Math.abs(time / cadence - Math.round(time / cadence)) < 1e-12

function outputRate(model, portId, time) {
  const schedule = model.outputSchedules.find((item) => item.portId === portId)
  if (!schedule) return 0
  return schedule.intervals.find((interval) => time >= interval.startMinute && time < interval.endMinute)?.value ?? 0
}

function validateOutputRates(plugin, rates) {
  if (!(rates instanceof Map)) throw new PhysiologyRequestError('plugin_output_mismatch', `${plugin.record.manifest.pluginId} did not publish output rates as a port map.`)
  const declared = new Set(plugin.coupling.ports.filter((port) => port.direction === 'output').map((port) => port.id))
  for (const [portId, value] of rates) {
    if (!declared.has(portId) || typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new PhysiologyRequestError('plugin_output_mismatch', `${plugin.record.manifest.pluginId} returned an undeclared or invalid output rate.`)
  }
  return rates
}

function processOutputRates(plugin, runtime, event) {
  let output
  try {
    output = ProcessOutputSchema.parse(runtime.processRunner(runtime.sandbox, plugin.processPath, {
      schemaVersion: '1.0.0',
      event: 'advance',
      timeMinutes: event.timeMinutes,
      intervalMinutes: event.intervalMinutes,
      state: { id: 'STATE:DRUG-MASS', value: event.massMg, unit: 'mg', shape: [1] },
      outputPorts: plugin.coupling.ports.filter((port) => port.direction === 'output')
    }, plugin.record.manifest.resources))
  } catch {
    throw new PhysiologyRequestError('process_protocol_failure', `${plugin.record.manifest.pluginId} failed the strict sandboxed process protocol.`)
  }
  const declared = new Set(plugin.coupling.ports.filter((port) => port.direction === 'output').map((port) => port.id))
  if (new Set(output.outputs.map((item) => item.portId)).size !== output.outputs.length || output.outputs.some((item) => !declared.has(item.portId))) throw new PhysiologyRequestError('process_output_mismatch', `${plugin.record.manifest.pluginId} returned undeclared or duplicate output ports.`)
  return new Map(output.outputs.map((item) => [item.portId, item.value]))
}

function publishOutputRates(plugin, runtime, event) {
  if (runtime.outputPublisher) return validateOutputRates(plugin, runtime.outputPublisher(plugin, event))
  if (plugin.record.manifest.pluginKind === 'process') return processOutputRates(plugin, runtime, event)
  return validateOutputRates(plugin, new Map(plugin.coupling.ports.filter((port) => port.direction === 'output').map((port) => [port.id, outputRate(plugin.model, port.id, event.timeMinutes)])))
}

function simulate(coupling, plugins, factor, includeTrace, runtime) {
  const step = coupling.couplingCadenceMinutes / factor
  const requestedIntervals = coupling.durationMinutes / step
  const intervalCount = Math.round(requestedIntervals)
  if (Math.abs(requestedIntervals - intervalCount) > 1e-12) throw new PhysiologyRequestError('cadence_misalignment', `Refinement factor ${factor} does not align with the coupling duration.`)
  const masses = Object.fromEntries(plugins.map((plugin) => [plugin.record.manifest.pluginId, plugin.model.state.initial]))
  const initialMass = Object.values(masses).reduce((sum, value) => sum + value, 0)
  const states = includeTrace ? [{ timeMinutes: 0, massesMg: { ...masses }, totalMassMg: initialMass, massConservationResidualMg: 0 }] : []
  const exchanges = []
  const heldOutputs = new Map(plugins.map((plugin) => [plugin.record.manifest.pluginId, new Map()]))
  const protocolEvents = []
  let sequence = 1
  if (includeTrace) for (const plugin of plugins) protocolEvents.push({ sequence: sequence++, timeMinutes: 0, pluginId: plugin.record.manifest.pluginId, event: 'initialize', cadenceDue: true })
  let maximumAbsoluteResidual = 0
  for (let index = 0; index < intervalCount; index += 1) {
    const start = index * step
    const end = (index + 1) * step
    const interval = end - start
    for (const plugin of plugins.filter((item) => due(start, item.model.cadenceMinutes))) {
      const pluginId = plugin.record.manifest.pluginId
      if (includeTrace) protocolEvents.push({ sequence: sequence++, timeMinutes: start, pluginId, event: 'read-inputs', cadenceDue: true })
      if (includeTrace) protocolEvents.push({ sequence: sequence++, timeMinutes: start, pluginId, event: 'advance', cadenceDue: true })
      heldOutputs.set(pluginId, publishOutputRates(plugin, runtime, { timeMinutes: start, intervalMinutes: Math.min(plugin.model.cadenceMinutes, coupling.durationMinutes - start), massMg: masses[pluginId], refinementFactor: factor }))
      if (includeTrace) protocolEvents.push({ sequence: sequence++, timeMinutes: start, pluginId, event: 'publish-outputs', cadenceDue: true })
    }
    const intervalExchanges = []
    const outgoingByPlugin = Object.fromEntries(plugins.map((plugin) => [plugin.record.manifest.pluginId, 0]))
    for (const exchange of coupling.exchanges) {
      const rate = heldOutputs.get(exchange.source.plugin_id).get(exchange.source.port_id) ?? 0
      const amount = rate * interval
      outgoingByPlugin[exchange.source.plugin_id] += amount
      intervalExchanges.push({ exchange, rate, amount })
    }
    for (const [pluginId, amount] of Object.entries(outgoingByPlugin)) {
      if (amount > masses[pluginId]) throw new PhysiologyRequestError('negative_plugin_state', `${pluginId} cannot supply the aggregate ${amount} mg requested at minute ${start}.`)
    }
    const deltas = Object.fromEntries(plugins.map((plugin) => [plugin.record.manifest.pluginId, 0]))
    for (const { exchange, amount } of intervalExchanges) {
      deltas[exchange.source.plugin_id] -= amount
      deltas[exchange.target.plugin_id] += amount
    }
    for (const pluginId of Object.keys(masses)) masses[pluginId] += deltas[pluginId]
    for (const { exchange, rate, amount } of intervalExchanges) {
      const residual = 0
      maximumAbsoluteResidual = Math.max(maximumAbsoluteResidual, Math.abs(residual))
      if (includeTrace) exchanges.push({ intervalStartMinutes: start, intervalEndMinutes: end, quantityId: exchange.quantityId, rateMgPerMinute: rate, integratedAmountMg: amount, sourceLossMg: amount, targetGainMg: amount, residualMg: residual })
    }
    if (includeTrace && due(end, coupling.couplingCadenceMinutes)) {
      const total = Object.values(masses).reduce((sum, value) => sum + value, 0)
      states.push({ timeMinutes: end, massesMg: { ...masses }, totalMassMg: total, massConservationResidualMg: total - initialMass })
    }
  }
  const finalMass = Object.values(masses).reduce((sum, value) => sum + value, 0)
  maximumAbsoluteResidual = Math.max(maximumAbsoluteResidual, Math.abs(finalMass - initialMass))
  return { finalMassesMg: { ...masses }, initialMassMg: initialMass, finalMassMg: finalMass, maximumAbsoluteResidualMg: maximumAbsoluteResidual, states, exchanges, protocolEvents, stepMinutes: step }
}

function benchmarkDifference(run, observations) {
  let maximum = 0
  for (const observation of observations) {
    const time = observation.values.find((item) => item.metric === 'time').value
    const state = run.states.find((item) => item.timeMinutes === time)
    if (!state) continue
    const expected = {
      'PLUGIN:CIRCULATION-REFERENCE': observation.values.find((item) => item.metric === 'circulation-drug-mass').value,
      'PLUGIN:LIVER-REFERENCE': observation.values.find((item) => item.metric === 'liver-drug-mass').value,
      'PLUGIN:KIDNEY-REFERENCE': observation.values.find((item) => item.metric === 'kidney-drug-mass').value
    }
    for (const pluginId of REQUIRED_PLUGINS) maximum = Math.max(maximum, Math.abs(state.massesMg[pluginId] - expected[pluginId]))
  }
  return maximum
}

export async function createPhysiologyService(options = {}) {
  const env = options.env ?? process.env
  const evidenceClient = options.evidenceClient
  if (!evidenceClient) throw new PhysiologyRequestError('physiology_evidence_required', 'Pinned physiology evidence client is required.', 500)
  const evidence = await evidenceClient.evidence()
  const selectedRoot = await selectRoot({ ...options, env })
  const database = openPhysiologyDatabase(selectedRoot.root)
  const objects = await createObjectStore(selectedRoot.root)
  const sandbox = await checkBubblewrapSandbox(env)
  const runtime = { sandbox, processRunner: runBubblewrapPlugin, outputPublisher: options.outputPublisher }
  const createdAt = now()
  database.prepare('INSERT OR IGNORE INTO trust_keys (key_id, algorithm, publisher, public_key_spki_base64, status, created_at, revoked_at) VALUES (?, ?, ?, ?, ?, ?, NULL)').run(REFERENCE_KEY_ID, 'Ed25519', REFERENCE_PUBLISHER, REFERENCE_PUBLIC_KEY_SPKI_BASE64, 'trusted', createdAt)

  const trustKey = (keyId) => {
    const row = database.prepare('SELECT * FROM trust_keys WHERE key_id = ?').get(keyId)
    return row ? TrustKeySchema.parse({ keyId: row.key_id, algorithm: row.algorithm, publisher: row.publisher, publicKeySpkiBase64: row.public_key_spki_base64, status: row.status, createdAt: row.created_at, revokedAt: row.revoked_at }) : undefined
  }
  const packageRow = (digest) => {
    const row = database.prepare('SELECT * FROM packages WHERE package_digest = ?').get(digest)
    if (!row) throw new PhysiologyRequestError('package_not_found', `Physiology package ${digest} is not installed.`, 404)
    return row
  }
  const packageRecord = (row) => {
    const stored = PhysiologyPackageSchema.parse(JSON.parse(row.payload_json))
    const persistedConformance = database.prepare('SELECT payload_json FROM conformance_results WHERE package_digest = ?').get(stored.packageDigest)
    const baseCertification = { ...stored.certification, status: 'not-certified', checks: { ...stored.certification.checks, conformanceBenchmark: false }, protocolConformance: 'not-run' }
    let certification = baseCertification
    if (persistedConformance) {
      const result = ConformanceResultSchema.parse(JSON.parse(persistedConformance.payload_json))
      if (result.benchmark.passed && result.certification.status === 'certified-conformant' && Object.values(result.certification.checks).every(Boolean)) certification = result.certification
      else certification = { ...result.certification, status: 'not-certified' }
    }
    const current = PhysiologyPackageSchema.parse({ ...stored, certification })
    const trust = trustKey(stored.signature.keyId)
    if (!trust) return PhysiologyPackageSchema.parse({ ...current, trust: { ...current.trust, status: 'unknown' }, certification: revokedCertification(current.certification) })
    if (trust.status === 'revoked') return PhysiologyPackageSchema.parse({ ...current, trust: { keyId: trust.keyId, status: trust.status, publisher: trust.publisher }, certification: revokedCertification(current.certification) })
    return PhysiologyPackageSchema.parse({ ...current, trust: { keyId: trust.keyId, status: trust.status, publisher: trust.publisher } })
  }
  const packageRuntime = (digest) => {
    const row = packageRow(digest)
    const record = packageRecord(row)
    return { row, record, model: JSON.parse(row.model_json), coupling: JSON.parse(row.coupling_json), processContent: row.process_content ? Buffer.from(row.process_content) : null }
  }

  async function persistPackage(buffer, inspected, builtIn) {
    const existing = database.prepare('SELECT package_digest FROM packages WHERE package_digest = ?').get(inspected.record.packageDigest)
    if (existing) return packageRecord(packageRow(existing.package_digest))
    const published = await objects.put(buffer)
    if (published.digest !== inspected.record.packageDigest) throw new PhysiologyRequestError('package_object_digest_mismatch', 'Immutable package object digest changed before persistence.', 500)
    const installedAt = builtIn ? BUILT_IN_AT : now()
    const record = PhysiologyPackageSchema.parse({ ...inspected.record, installedAt, builtIn })
    const processPath = record.manifest.entrypoints.process
    transaction(database, () => {
      database.prepare('INSERT OR IGNORE INTO objects (digest, bytes, created_at) VALUES (?, ?, ?)').run(published.digest, published.bytes, installedAt)
      database.prepare('INSERT INTO packages (package_digest, plugin_id, model_descriptor_digest, coupling_descriptor_digest, payload_json, model_json, coupling_json, process_content, installed_at, built_in) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(record.packageDigest, record.manifest.pluginId, record.modelDescriptorDigest, record.couplingDescriptorDigest, canonicalJson(record), canonicalJson(inspected.model), canonicalJson(inspected.coupling), processPath ? inspected.files.get(processPath) : null, installedAt, builtIn ? 1 : 0)
    })
    return record
  }

  for (const reference of await createReferencePackages(evidence)) {
    const digest = digestBuffer(reference.bytes)
    const alreadyInstalled = database.prepare('SELECT package_digest FROM packages WHERE package_digest = ?').get(digest)
    if (alreadyInstalled) continue
    const validated = await validateBppPackage(reference.bytes, { evidence, trustKey, processSandboxAvailable: sandbox.available, installedAt: BUILT_IN_AT, builtIn: true })
    if (!validated.response.valid || !validated.response.installable) throw new PhysiologyRequestError('reference_package_invalid', `Built-in ${reference.manifest.pluginId} package failed validation: ${validated.response.findings[0]?.message}`, 500)
    await persistPackage(reference.bytes, validated, true)
  }

  function listPackages() {
    return database.prepare('SELECT * FROM packages ORDER BY plugin_id, package_digest').all().map(packageRecord)
  }

  async function validatePackage(buffer) {
    return (await validateBppPackage(buffer, { evidence, trustKey, processSandboxAvailable: sandbox.available })).response
  }

  async function installPackage(buffer) {
    const validated = await validateBppPackage(buffer, { evidence, trustKey, processSandboxAvailable: sandbox.available })
    if (!validated.response.valid) throw new PhysiologyRequestError('package_invalid', validated.response.findings[0]?.message ?? 'Package validation failed.')
    if (!validated.response.installable) throw new PhysiologyRequestError('process_sandbox_unavailable', validated.response.findings[0]?.message ?? 'Process package refused.', 403)
    return persistPackage(buffer, validated, false)
  }

  function listTrust() {
    return database.prepare('SELECT * FROM trust_keys ORDER BY key_id').all().map((row) => TrustKeySchema.parse({ keyId: row.key_id, algorithm: row.algorithm, publisher: row.publisher, publicKeySpkiBase64: row.public_key_spki_base64, status: row.status, createdAt: row.created_at, revokedAt: row.revoked_at }))
  }

  function addTrustKey(input) {
    const request = TrustKeyAddRequestSchema.parse(input)
    let key
    try {
      key = createPublicKey({ key: Buffer.from(request.publicKeySpkiBase64, 'base64'), format: 'der', type: 'spki' })
    } catch {
      throw new PhysiologyRequestError('invalid_trust_key', 'Publisher public key is not valid SPKI DER.')
    }
    if (key.asymmetricKeyType !== 'ed25519') throw new PhysiologyRequestError('invalid_trust_key', 'Publisher public key must be Ed25519.')
    const canonicalSpki = key.export({ format: 'der', type: 'spki' })
    const expectedKeyId = `ed25519:${createHash('sha256').update(canonicalSpki).digest('hex').slice(0, 16)}`
    if (request.keyId !== expectedKeyId || canonicalSpki.toString('base64') !== request.publicKeySpkiBase64) throw new PhysiologyRequestError('trust_key_id_mismatch', 'Publisher key identifier or encoding does not match canonical SPKI bytes.')
    const existing = trustKey(request.keyId)
    if (existing) {
      if (existing.publisher !== request.publisher || existing.publicKeySpkiBase64 !== request.publicKeySpkiBase64) throw new PhysiologyRequestError('trust_key_conflict', 'Publisher key identifier already belongs to different trust metadata.', 409)
      return existing
    }
    const createdAt = now()
    database.prepare('INSERT INTO trust_keys (key_id, algorithm, publisher, public_key_spki_base64, status, created_at, revoked_at) VALUES (?, ?, ?, ?, ?, ?, NULL)').run(request.keyId, request.algorithm, request.publisher, request.publicKeySpkiBase64, 'trusted', createdAt)
    return trustKey(request.keyId)
  }

  function revokeTrustKey(keyId) {
    const revokedAt = now()
    const result = database.prepare("UPDATE trust_keys SET status = 'revoked', revoked_at = ? WHERE key_id = ? AND status = 'trusted'").run(revokedAt, keyId)
    if (!result.changes) throw new PhysiologyRequestError('trust_key_not_found', `Trusted publisher key ${keyId} is unavailable.`, 404)
    return trustKey(keyId)
  }

  function createCoupling(input) {
    const request = CouplingCreateRequestSchema.parse(input)
    if (request.taxonId !== 'NCBITaxon:9606') throw new PhysiologyRequestError('unsupported_extrapolation', 'The pinned reference packages are human-only; mouse extrapolation is blocked.')
    if (request.couplingCadenceMinutes !== 1) throw new PhysiologyRequestError('unsupported_cadence', 'The bounded conformance fixture supports an explicit 1 minute coupling cadence only.')
    if (!due(request.durationMinutes, request.couplingCadenceMinutes)) throw new PhysiologyRequestError('cadence_misalignment', 'Coupling cadence must divide the requested duration exactly.')
    const uniqueDigests = [...new Set(request.packageDigests)]
    if (uniqueDigests.length !== 3) throw new PhysiologyRequestError('package_closure', 'Coupling requires three distinct package digests.')
    const plugins = uniqueDigests.map(packageRuntime).sort((left, right) => left.record.manifest.pluginId.localeCompare(right.record.manifest.pluginId))
    if (plugins.map((item) => item.record.manifest.pluginId).sort().join(',') !== [...REQUIRED_PLUGINS].sort().join(',')) throw new PhysiologyRequestError('plugin_closure', 'Coupling requires exactly the circulation, liver, and kidney reference plugins.')
    if (plugins.some((item) => item.record.trust.status !== 'trusted')) throw new PhysiologyRequestError('untrusted_package', 'Coupling refuses an unknown or revoked publisher package.', 403)
    if (plugins.some((item) => item.record.manifest.pluginKind === 'process') && !sandbox.available) throw new PhysiologyRequestError('process_sandbox_unavailable', 'Process plugin execution is refused because Bubblewrap capability checks did not pass.', 403)
    for (const plugin of plugins) {
      if (plugin.model.cadenceMinutes < request.couplingCadenceMinutes || !due(plugin.model.cadenceMinutes, request.couplingCadenceMinutes)) throw new PhysiologyRequestError('cadence_misalignment', `${plugin.record.manifest.pluginId} cadence must be an integer multiple of the coupling cadence.`)
      for (const factor of request.refinementFactors) if (!due(plugin.model.cadenceMinutes, request.couplingCadenceMinutes / factor)) throw new PhysiologyRequestError('cadence_misalignment', `${plugin.record.manifest.pluginId} cadence does not align with refinement factor ${factor}.`)
    }
    const ports = new Map(plugins.flatMap((plugin) => plugin.coupling.ports.map((port) => [`${plugin.record.manifest.pluginId}:${port.id}`, port])))
    const exchanges = evidence.quantities.map((quantity) => {
      const source = ports.get(`${quantity.source.plugin_id}:${quantity.source.port_id}`)
      const target = ports.get(`${quantity.target.plugin_id}:${quantity.target.port_id}`)
      const sourcePlugin = plugins.find((plugin) => plugin.record.manifest.pluginId === quantity.source.plugin_id)
      const targetPlugin = plugins.find((plugin) => plugin.record.manifest.pluginId === quantity.target.plugin_id)
      if (!source || !target || source.direction !== 'output' || target.direction !== 'input' || source.semantic !== target.semantic || source.dimension !== target.dimension || source.unit !== target.unit || source.quantity_id !== quantity.id || target.quantity_id !== quantity.id || canonicalJson(sourcePlugin.model.state.shape) !== canonicalJson(targetPlugin.model.state.shape)) throw new PhysiologyRequestError('port_incompatible', `Quantity ${quantity.id} failed semantic unit shape or direction compatibility checks.`)
      return { quantityId: quantity.id, source: quantity.source, target: quantity.target, semantic: quantity.semantic, dimension: quantity.dimension, unit: quantity.canonical_unit, shape: sourcePlugin.model.state.shape, cadenceMinutes: request.couplingCadenceMinutes, interpolation: request.interpolation, integration: 'exact-piecewise-constant', conservation: 'source-loss-equals-target-gain' }
    })
    const packageDigests = plugins.map((item) => item.record.packageDigest)
    const pluginDigests = Object.fromEntries(plugins.map((item) => [item.record.manifest.pluginId, canonicalDigest({ packageDigest: item.record.packageDigest, modelDescriptorDigest: item.record.modelDescriptorDigest, couplingDescriptorDigest: item.record.couplingDescriptorDigest })]))
    const intersection = {
      taxonIds: ['NCBITaxon:9606'],
      useScopes: ['bounded-three-plugin-coupling-conformance'],
      contextBindings: plugins.map((item) => item.record.manifest.applicability.contextIds[0]).sort(),
      exclusions: [...new Set(plugins.flatMap((item) => item.record.manifest.applicability.exclusions))].sort()
    }
    const identity = { schemaVersion: '1.0.0', packageDigests, pluginDigests, taxonId: request.taxonId, durationMinutes: request.durationMinutes, couplingCadenceMinutes: request.couplingCadenceMinutes, interpolation: request.interpolation, refinementFactors: request.refinementFactors, convergenceToleranceMg: request.convergenceToleranceMg, exchanges, applicabilityIntersection: intersection, scientificValidation: 'unsupported', warning: PHYSIOLOGY_WARNING }
    const couplingDigest = canonicalDigest(identity)
    const existing = database.prepare('SELECT payload_json FROM couplings WHERE coupling_digest = ?').get(couplingDigest)
    if (existing) return PhysiologyCouplingSchema.parse(JSON.parse(existing.payload_json))
    const createdAt = now()
    const record = PhysiologyCouplingSchema.parse({ couplingDigest, ...identity, createdAt })
    database.prepare('INSERT INTO couplings (coupling_digest, payload_json, created_at) VALUES (?, ?, ?)').run(couplingDigest, canonicalJson(record), createdAt)
    return record
  }

  function listCouplings() {
    return database.prepare('SELECT payload_json FROM couplings ORDER BY created_at, coupling_digest').all().map((row) => PhysiologyCouplingSchema.parse(JSON.parse(row.payload_json)))
  }

  function getCoupling(couplingDigest) {
    const row = database.prepare('SELECT payload_json FROM couplings WHERE coupling_digest = ?').get(couplingDigest)
    if (!row) throw new PhysiologyRequestError('coupling_not_found', `Physiology coupling ${couplingDigest} does not exist.`, 404)
    return PhysiologyCouplingSchema.parse(JSON.parse(row.payload_json))
  }

  async function run(input) {
    const request = PhysiologyRunRequestSchema.parse(input)
    const coupling = getCoupling(request.couplingDigest)
    const runDigest = canonicalDigest({ couplingDigest: coupling.couplingDigest, engineVersion: ENGINE_VERSION })
    const plugins = coupling.packageDigests.map(packageRuntime)
    if (plugins.some((item) => item.record.trust.status !== 'trusted')) throw new PhysiologyRequestError('trust_revoked', 'Run refused because a coupled publisher key is revoked.', 403)
    const existing = database.prepare('SELECT payload_json FROM physiology_runs WHERE run_digest = ?').get(runDigest)
    if (existing) return PhysiologyRunSchema.parse(JSON.parse(existing.payload_json))
    if (plugins.some((item) => item.record.manifest.pluginKind === 'process')) {
      if (!sandbox.available) throw new PhysiologyRequestError('process_sandbox_unavailable', 'Process plugin execution is refused because Bubblewrap capability checks did not pass.', 403)
      for (const plugin of plugins.filter((item) => item.record.manifest.pluginKind === 'process')) {
        if (!plugin.processContent) throw new PhysiologyRequestError('process_content_missing', `${plugin.record.manifest.pluginId} has no verified process content.`)
        plugin.processPath = (await objects.put(plugin.processContent)).path
      }
    }
    const primary = simulate(coupling, plugins, 1, true, runtime)
    if (plugins.some((item) => item.record.manifest.pluginKind === 'process')) {
      const repeatedPrimary = simulate(coupling, plugins, 1, true, runtime)
      if (canonicalJson(primary) !== canonicalJson(repeatedPrimary)) throw new PhysiologyRequestError('process_nondeterministic', 'Sandboxed process outputs changed under identical inputs; deterministic coupling is refused.')
    }
    const refinement = coupling.refinementFactors.map((factor) => ({ factor, ...(factor === 1 ? primary : simulate(coupling, plugins, factor, false, runtime)) })).map((item) => ({ factor: item.factor, stepMinutes: item.stepMinutes, finalMassesMg: item.finalMassesMg, maximumAbsoluteResidualMg: item.maximumAbsoluteResidualMg }))
    let convergenceMaximumDifferenceMg = 0
    for (let index = 1; index < refinement.length; index += 1) for (const pluginId of REQUIRED_PLUGINS) convergenceMaximumDifferenceMg = Math.max(convergenceMaximumDifferenceMg, Math.abs(refinement[index].finalMassesMg[pluginId] - refinement[index - 1].finalMassesMg[pluginId]))
    const schedule = []
    for (let time = 0; time <= coupling.durationMinutes; time += coupling.couplingCadenceMinutes) schedule.push({ timeMinutes: time, duePluginIds: time < coupling.durationMinutes ? plugins.filter((plugin) => due(time, plugin.model.cadenceMinutes)).map((plugin) => plugin.record.manifest.pluginId).sort() : [] })
    const completedAt = now()
    const record = PhysiologyRunSchema.parse({
      runDigest,
      couplingDigest: coupling.couplingDigest,
      packageDigests: coupling.packageDigests,
      pluginDigests: coupling.pluginDigests,
      status: 'completed',
      protocolEvents: primary.protocolEvents,
      schedule,
      states: primary.states,
      exchanges: primary.exchanges,
      diagnostics: { initialMassMg: primary.initialMassMg, finalMassMg: primary.finalMassMg, maximumAbsoluteResidualMg: primary.maximumAbsoluteResidualMg, massConserved: primary.maximumAbsoluteResidualMg <= 1e-12, deterministic: true, cadenceMinutes: coupling.couplingCadenceMinutes, interpolation: coupling.interpolation, refinement, convergenceMaximumDifferenceMg, converged: convergenceMaximumDifferenceMg <= coupling.convergenceToleranceMg },
      applicability: { supported: true, intersection: coupling.applicabilityIntersection },
      protocolConformance: 'passed',
      scientificValidation: 'unsupported',
      warning: PHYSIOLOGY_WARNING,
      completedAt
    })
    database.prepare('INSERT INTO physiology_runs (run_digest, coupling_digest, payload_json, completed_at) VALUES (?, ?, ?, ?)').run(runDigest, coupling.couplingDigest, canonicalJson(record), completedAt)
    return record
  }

  function listRuns() {
    return database.prepare('SELECT payload_json FROM physiology_runs ORDER BY completed_at, run_digest').all().map((row) => PhysiologyRunSchema.parse(JSON.parse(row.payload_json)))
  }

  function getRun(runDigest) {
    const row = database.prepare('SELECT payload_json FROM physiology_runs WHERE run_digest = ?').get(runDigest)
    if (!row) throw new PhysiologyRequestError('run_not_found', `Physiology run ${runDigest} does not exist.`, 404)
    return PhysiologyRunSchema.parse(JSON.parse(row.payload_json))
  }

  async function conformance(packageDigest) {
    const plugin = packageRuntime(packageDigest)
    if (plugin.record.trust.status !== 'trusted') throw new PhysiologyRequestError('trust_revoked', 'Conformance refused because the package publisher is not trusted.', 403)
    const existing = database.prepare('SELECT payload_json FROM conformance_results WHERE package_digest = ?').get(packageDigest)
    if (existing) return ConformanceResultSchema.parse(JSON.parse(existing.payload_json))
    const selected = new Map(listPackages().filter((item) => item.trust.status === 'trusted' && item.builtIn).map((item) => [item.manifest.pluginId, item.packageDigest]))
    selected.set(plugin.record.manifest.pluginId, packageDigest)
    if (selected.size !== 3) throw new PhysiologyRequestError('conformance_closure', 'Conformance benchmark requires a trusted circulation/liver/kidney package closure.')
    const coupling = createCoupling({ packageDigests: [...selected.values()], taxonId: 'NCBITaxon:9606', durationMinutes: 4, couplingCadenceMinutes: 1, interpolation: 'zero-order-hold', refinementFactors: [1, 2, 4], convergenceToleranceMg: 1e-9 })
    const benchmarkRun = await run({ couplingDigest: coupling.couplingDigest })
    const maximumAbsoluteDifferenceMg = benchmarkDifference(benchmarkRun, evidence.observations)
    const passed = maximumAbsoluteDifferenceMg <= 1e-9 && benchmarkRun.diagnostics.massConserved && benchmarkRun.diagnostics.converged
    const checks = { ...plugin.record.certification.checks, conformanceBenchmark: passed }
    const certification = { ...plugin.record.certification, status: Object.values(checks).every(Boolean) ? 'certified-conformant' : 'not-certified', checks, protocolConformance: passed ? 'passed' : 'failed' }
    const result = ConformanceResultSchema.parse({ packageDigest, certification, benchmark: { id: 'DATASET:PHYS-HUMAN-THREE-PLUGIN-MASS-BALANCE', passed, maximumAbsoluteDifferenceMg, partition: 'fixed-calibration-validation' }, protocolSequence: ['initialize', 'read-inputs', 'advance', 'publish-outputs'], scientificValidation: 'unsupported', warning: PHYSIOLOGY_WARNING })
    database.prepare('INSERT INTO conformance_results (package_digest, payload_json, created_at) VALUES (?, ?, ?)').run(packageDigest, canonicalJson(result), now())
    return result
  }

  function coverage() {
    const installed = new Set(listPackages().filter((item) => item.trust.status === 'trusted').map((item) => item.manifest.pluginId))
    return { release: evidence.release, items: evidence.coverage.map((item) => ({ ...item, installed: item.plugin_id ? installed.has(item.plugin_id) : false })), warning: PHYSIOLOGY_WARNING }
  }

  return {
    root: selectedRoot.root,
    sandbox,
    evidence: () => evidence,
    validatePackage,
    installPackage,
    listPackages,
    getPackage: (digest) => packageRecord(packageRow(digest)),
    packageBytes: (digest) => objects.get(packageRow(digest).package_digest),
    listTrust,
    addTrustKey,
    revokeTrustKey,
    createCoupling,
    listCouplings,
    getCoupling,
    run,
    listRuns,
    getRun,
    conformance,
    coverage,
    benchmarkDifference,
    async close() {
      database.close()
      if (selectedRoot.ephemeral) await rm(selectedRoot.root, { recursive: true, force: true })
    }
  }
}
