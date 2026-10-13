// @vitest-environment node
import { generateKeyPairSync, sign } from 'node:crypto'
import { chmodSync, existsSync, mkdtempSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { canonicalDigest, canonicalJson } from '../../shared/canonical-json.js'
import { isoNow, isoSeconds } from '../../server/commons/clock.js'
import { decodeCursor, decodeSecret, encodeCursor } from '../../server/commons/cursor.js'
import { canonicalSha256Hex, compareUtf8, sha256Hex, sha256Prefixed } from '../../server/commons/digest.js'
import { defineProblemError, defineRequestError } from '../../server/commons/errors.js'
import { inside } from '../../server/commons/paths.js'
import { openDatabase, openSecureDatabase, parseJsonColumn, transaction } from '../../server/commons/sqlite.js'
import { selectStorageRoot, testRootParent } from '../../server/commons/storage.js'
import { readBoundedBody, timeoutSignal, validateLoopbackOrigin } from '../../server/commons/upstream.js'
import { parseCanonicalBytes, verifyEd25519Signature } from '../../server/commons/verification.js'

const cleanup = []
const temporary = () => {
  const path = mkdtempSync(join(tmpdir(), 'commons-'))
  cleanup.push(path)
  return path
}
afterEach(() => cleanup.splice(0).forEach((path) => rmSync(path, { recursive: true, force: true })))

describe('digest helpers', () => {
  it('hashes bytes and strings identically to the reference vectors', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    expect(sha256Hex(Buffer.from('abc'))).toBe(sha256Hex('abc'))
    expect(sha256Prefixed('abc')).toBe('sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })

  it('keeps the canonical digest byte-identical to the shared canonical-json digest', () => {
    const value = { b: [1, 2, { z: null, a: 'é' }], a: true }
    expect(`sha256:${canonicalSha256Hex(value)}`).toBe(canonicalDigest(value))
    expect(canonicalSha256Hex(value)).toBe(sha256Hex(Buffer.from(canonicalJson(value))))
  })

  it('orders strings by UTF-8 bytes', () => {
    expect(['b', 'a', 'ä', 'z'].sort(compareUtf8)).toEqual(['a', 'b', 'z', 'ä'])
  })
})

describe('error factories', () => {
  it('builds positional request errors with a default status', () => {
    const RequestError = defineRequestError('ThingRequestError', 409)
    const error = new RequestError('thing_bad', 'bad thing')
    expect(error).toBeInstanceOf(Error)
    expect(error).toMatchObject({ name: 'ThingRequestError', code: 'thing_bad', message: 'bad thing', statusCode: 409 })
    expect(new RequestError('x', 'y', 500).statusCode).toBe(500)
    expect(RequestError.name).toBe('ThingRequestError')
  })

  it('builds option-style problem errors that can subclass each other', () => {
    const Verification = defineProblemError('ThingVerificationError', { statusCode: 409, code: 'THING_FAILED' })
    const Upstream = defineProblemError('ThingUpstreamError', { statusCode: 503, code: 'THING_UPSTREAM', parent: Verification })
    expect(new Verification('m')).toMatchObject({ name: 'ThingVerificationError', code: 'THING_FAILED', statusCode: 409 })
    const upstream = new Upstream('down', { code: 'THING_URL', statusCode: 500 })
    expect(upstream).toBeInstanceOf(Verification)
    expect(upstream).toMatchObject({ name: 'ThingUpstreamError', code: 'THING_URL', statusCode: 500, message: 'down' })
    expect(new Upstream('down')).toMatchObject({ code: 'THING_UPSTREAM', statusCode: 503 })
  })
})

describe('signed cursors', () => {
  const secretText = Buffer.alloc(32, 7).toString('base64url')
  const fail = (reason) => { throw new Error(`secret:${reason}`) }
  const secret = decodeSecret(secretText, fail)
  const invalid = () => { throw new Error('cursor invalid') }

  it('round-trips canonical payloads and rejects tampering', () => {
    const cursor = encodeCursor({ afterId: 'b', limit: 2 }, secret)
    expect(decodeCursor(cursor, secret, invalid)).toEqual({ afterId: 'b', limit: 2 })
    const flipped = `${cursor.slice(0, -2)}${cursor.at(-2) === 'A' ? 'B' : 'A'}${cursor.at(-1)}`
    expect(() => decodeCursor(flipped, secret, invalid)).toThrow('cursor invalid')
    expect(() => decodeCursor(cursor, Buffer.alloc(32, 8), invalid)).toThrow('cursor invalid')
    expect(() => decodeCursor('bad cursor!', secret, invalid)).toThrow('cursor invalid')
    expect(() => decodeCursor(undefined, secret, invalid)).toThrow('cursor invalid')
  })

  it('can reject impossible base64 lengths before decoding', () => {
    expect(() => decodeCursor('A', secret, invalid, { strictLength: true })).toThrow('cursor invalid')
  })

  it('accepts only canonical 32-byte secrets', () => {
    expect(() => decodeSecret('short', fail)).toThrow('secret:shape')
    expect(() => decodeSecret(undefined, fail)).toThrow('secret:shape')
    expect(() => decodeSecret(`${'A'.repeat(42)}B`, fail)).toThrow('secret:encoding')
    expect(secret).toHaveLength(32)
  })
})

describe('storage roots', () => {
  const inSource = () => new Error('in source')

  it('detects lexical containment', () => {
    expect(inside('/a/b', '/a/b')).toBe(true)
    expect(inside('/a/b', '/a/b/c')).toBe(true)
    expect(inside('/a/b', '/a/bc')).toBe(false)
    expect(inside('/a/b', '/a')).toBe(false)
  })

  it('creates unique ephemeral roots in test mode and private roots otherwise', async () => {
    const parent = join(temporary(), 'tests')
    const first = await selectStorageRoot({ test: { parent, prefix: 'svc-' }, defaultName: 'svc', secure: true, inSourceError: inSource })
    const second = await selectStorageRoot({ test: { parent, prefix: 'svc-' }, defaultName: 'svc', secure: false, inSourceError: inSource })
    expect(first.ephemeral).toBe(true)
    expect(first.root).not.toBe(second.root)
    expect(statSync(first.root).mode & 0o777).toBe(0o700)

    const configured = join(temporary(), 'configured')
    const selected = await selectStorageRoot({ configured, test: { parent, prefix: 'svc-' }, defaultName: 'svc', secure: true, inSourceError: inSource })
    expect(selected).toEqual({ root: resolve(configured), ephemeral: false })
  })

  it('refuses roots inside the source tree and symlinked ancestors', async () => {
    await expect(selectStorageRoot({ configured: join(process.cwd(), 'tmp-root'), defaultName: 'svc', secure: false, inSourceError: inSource })).rejects.toThrow('in source')
    const base = temporary()
    symlinkSync(base, join(base, 'link'))
    await expect(selectStorageRoot({ configured: join(base, 'link', 'root'), defaultName: 'svc', secure: true, inSourceError: inSource })).rejects.toThrow()
  })

  it('places default test roots next to the repository', () => {
    expect(testRootParent(undefined)).toBe(resolve(process.cwd(), '..', '.biochemical-inference-test-workspaces'))
    expect(testRootParent('/x')).toBe('/x')
  })
})

describe('sqlite helpers', () => {
  it('commits on success and rolls back on failure', () => {
    const database = openDatabase(temporary(), 'a.sqlite3', 'CREATE TABLE IF NOT EXISTS t (v INTEGER);')
    expect(transaction(database, () => database.prepare('INSERT INTO t VALUES (1)').run().changes)).toBe(1)
    expect(() => transaction(database, () => { database.prepare('INSERT INTO t VALUES (2)').run(); throw new Error('boom') })).toThrow('boom')
    expect(database.prepare('SELECT COUNT(*) AS n FROM t').get().n).toBe(1)
    expect(database.prepare('PRAGMA journal_mode').get().journal_mode).toBe('wal')
    expect(database.prepare('PRAGMA foreign_keys').get().foreign_keys).toBe(1)
    database.close()
  })

  it('parses optional JSON columns', () => {
    expect(parseJsonColumn(null)).toBeNull()
    expect(parseJsonColumn('{"a":1}')).toEqual({ a: 1 })
  })

  it('opens owner-only databases and checks the schema version', () => {
    const root = temporary()
    const schema = 'CREATE TABLE IF NOT EXISTS t (v INTEGER); PRAGMA user_version = 2;'
    const database = openSecureDatabase(root, 'secure.sqlite3', { label: 'test', versions: [0, 2], schema })
    database.close()
    expect(statSync(join(root, 'secure.sqlite3')).mode & 0o777).toBe(0o600)
    openSecureDatabase(root, 'secure.sqlite3', { label: 'test', versions: [0, 2], schema }).close()
    expect(() => openSecureDatabase(root, 'secure.sqlite3', { label: 'test', versions: [0, 1], schema })).toThrow('Unsupported test database schema version: 2.')
  })

  it('refuses symlinked and non-regular database paths', () => {
    const root = temporary()
    const target = join(root, 'target')
    writeFileSync(target, '')
    chmodSync(target, 0o600)
    symlinkSync(target, join(root, 'linked.sqlite3'))
    expect(() => openSecureDatabase(root, 'linked.sqlite3', { label: 'test', versions: [0], schema: '' })).toThrow('Unsafe test SQLite path')
    expect(existsSync(join(root, 'linked.sqlite3'))).toBe(true)
  })
})

describe('verification helpers', () => {
  class Failure extends Error {}

  it('parses only canonical UTF-8 JSON that satisfies the schema', () => {
    const schema = z.object({ a: z.number(), b: z.string() }).strict()
    const options = { ErrorClass: Failure, maxBytes: 64, contract: 'demo' }
    const good = Buffer.from(canonicalJson({ b: 'x', a: 1 }))
    expect(parseCanonicalBytes(good, schema, 'Doc', options)).toEqual({ a: 1, b: 'x' })
    expect(() => parseCanonicalBytes(Buffer.from('{"b":"x","a":1}'), schema, 'Doc', options)).toThrow('Doc is not RFC 8785 canonical JSON.')
    expect(() => parseCanonicalBytes(Buffer.from('not json'), schema, 'Doc', options)).toThrow('Doc is not strict UTF-8 JSON.')
    expect(() => parseCanonicalBytes(Buffer.from('{"a":1}'), schema, 'Doc', options)).toThrow('Doc does not match the strict demo contract.')
    expect(() => parseCanonicalBytes(Buffer.from('{"a":1}'), schema, 'Doc', { ...options, issue: true })).toThrow(/strict demo contract: /)
    expect(() => parseCanonicalBytes(Buffer.alloc(0), schema, 'Doc', options)).toThrow('Doc exceeds its bounded canonical JSON contract.')
    expect(() => parseCanonicalBytes(good, schema, 'Doc', { ...options, maxBytes: 3, messages: { bounds: 'is too large.' } })).toThrow('Doc is too large.')
    expect(() => parseCanonicalBytes(good, schema, 'Doc', { ...options, expectedDigest: '0'.repeat(64) })).toThrow('Doc does not match its independent SHA-256 pin.')
    expect(parseCanonicalBytes(good, schema, 'Doc', { ...options, expectedDigest: sha256Hex(good) })).toEqual({ a: 1, b: 'x' })
  })

  it('verifies Ed25519 signatures bound to payload, algorithm, key and time', () => {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519')
    const raw = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32)
    const payload = { release: 'r1' }
    const header = { algorithm: 'Ed25519', key_id: 'k1', signed_at: '2026-07-13T00:00:00Z' }
    const message = Buffer.from(canonicalJson({ payload, ...header }))
    const signature = { ...header, value: sign(null, message, privateKey).toString('base64url') }
    const options = { signature, publicKey: raw.toString('base64url'), ErrorClass: Failure, labels: { publicKey: 'Public key', signature: 'Signature' }, invalidMessage: 'Invalid signature.' }
    expect(() => verifyEd25519Signature({ payload, ...options })).not.toThrow()
    expect(() => verifyEd25519Signature({ payload: { release: 'r2' }, ...options })).toThrow('Invalid signature.')
    expect(() => verifyEd25519Signature({ payload, ...options, signature: { ...signature, signed_at: '2026-07-14T00:00:00Z' } })).toThrow('Invalid signature.')
    expect(() => verifyEd25519Signature({ payload, ...options, signature: { ...signature, value: 'AAAA' } })).toThrow('Signature has an invalid canonical encoding.')
    expect(() => verifyEd25519Signature({ payload, ...options, signature: { ...signature, value: `${signature.value}=` } })).toThrow('Signature is not strict unpadded base64url.')
    expect(() => verifyEd25519Signature({ payload, ...options, publicKey: 'AAAA', lengthMessage: 'has an invalid encoded length.' })).toThrow('Public key has an invalid encoded length.')
  })
})

describe('upstream helpers', () => {
  class Upstream extends Error { constructor(message, options = {}) { super(message); Object.assign(this, options) } }
  const response = (body, headers = {}) => new Response(body, { headers })

  it('reads bodies exactly as long as their Content-Length', async () => {
    const options = { maximum: 10, label: 'Body', ErrorClass: Upstream }
    expect((await readBoundedBody(response('abc', { 'content-length': '3' }), options)).toString()).toBe('abc')
    await expect(readBoundedBody(response('abc'), options)).rejects.toThrow('Body has a missing, invalid, or excessive Content-Length.')
    await expect(readBoundedBody(response('abc', { 'content-length': '11' }), options)).rejects.toThrow('excessive Content-Length')
    await expect(readBoundedBody(response('abc', { 'content-length': '2' }), options)).rejects.toThrow('Body exceeded its declared byte boundary.')
    await expect(readBoundedBody(response('abc', { 'content-length': '5' }), options)).rejects.toThrow('Body body length does not match Content-Length.')
    await expect(readBoundedBody(response('', { 'content-length': '0' }), { ...options, allowEmpty: false })).rejects.toThrow('Content-Length')
    expect((await readBoundedBody(response('', { 'content-length': '0' }), options)).length).toBe(0)
  })

  it('reports each chunk to the ownership callback', async () => {
    let reads = 0
    await readBoundedBody(response('abc', { 'content-length': '3' }), { maximum: 10, label: 'Body', ErrorClass: Upstream, onRead: () => { reads += 1 } })
    expect(reads).toBeGreaterThan(0)
    await expect(readBoundedBody(response('abc', { 'content-length': '3' }), { maximum: 10, label: 'Body', ErrorClass: Upstream, onRead: () => { throw new Upstream('superseded') } })).rejects.toThrow('superseded')
  })

  it('combines a timeout with the caller signal', () => {
    const controller = new AbortController()
    const combined = timeoutSignal(60_000, controller.signal)
    expect(combined.aborted).toBe(false)
    controller.abort(new Error('stop'))
    expect(combined.aborted).toBe(true)
    expect(timeoutSignal(60_000).aborted).toBe(false)
  })

  it('accepts only origin-only loopback HTTP URLs', () => {
    const options = { ErrorClass: Upstream, subject: 'Demo upstream', codePrefix: 'DEMO_UPSTREAM' }
    expect(validateLoopbackOrigin('http://127.0.0.1:8000', options)).toBe('http://127.0.0.1:8000')
    expect(validateLoopbackOrigin('http://[::1]:8000/', options)).toBe('http://[::1]:8000')
    for (const value of ['https://127.0.0.1:8000', 'http://localhost:8000', 'http://user:pw@127.0.0.1:8000', 'http://127.0.0.1:8000/path', 'http://127.0.0.1:8000?x=1']) {
      expect(() => validateLoopbackOrigin(value, options)).toThrow('Demo upstream is restricted')
    }
    try {
      validateLoopbackOrigin('nope', options)
    } catch (error) {
      expect(error).toMatchObject({ message: 'Demo upstream URL must be an absolute loopback HTTP origin.', statusCode: 500, code: 'DEMO_UPSTREAM_URL_INVALID' })
    }
  })
})

describe('clock helpers', () => {
  it('formats UTC timestamps', () => {
    expect(isoNow()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(isoSeconds(() => new Date('2026-01-02T03:04:05.678Z'))).toBe('2026-01-02T03:04:05Z')
    expect(isoSeconds(() => Date.UTC(2026, 0, 2, 3, 4, 5))).toBe('2026-01-02T03:04:05Z')
  })
})
