import { createHash, createPrivateKey, createPublicKey } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { canonicalJson } from '../../shared/canonical-json.js'

const seed = Buffer.alloc(32, 15)
const privateKey = createPrivateKey({ key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]), format: 'der', type: 'pkcs8' })
const publicKeyObject = createPublicKey(privateKey)
const publicKey = publicKeyObject.export({ format: 'der', type: 'spki' }).subarray(-32).toString('base64')
const digest = (value) => `sha256:${createHash('sha256').update(canonicalJson(value)).digest('hex')}`
const keyPayload = { key_schema_version: '1.0.0', algorithm: 'Ed25519', public_key: publicKey }
const assignments = [
  { id: 'inference:campaign-author', role: 'campaign-author', organization: 'Biochemical Inference' },
  { id: 'inference:executor', role: 'inference-executor', organization: 'Biochemical Inference' },
  { id: 'producer:key-admin', role: 'key-administrator', organization: 'Biochemical DB' },
  { id: 'review:scientist', role: 'scientific-reviewer', organization: 'Independent Review' }
].sort((left, right) => left.role.localeCompare(right.role) || left.id.localeCompare(right.id))
const rolePayload = { role_policy_schema_version: '1.0.0', assignments }
const rolePolicy = { ...rolePayload, role_policy_id: digest(rolePayload) }
const rolePolicyBytes = Buffer.from(canonicalJson(rolePolicy))

export const E2E_REVALIDATION = Object.freeze({
  authorBearerToken: 'e2e-revalidation-author-token-0001',
  executorBearerToken: 'e2e-revalidation-executor-token-0001',
  bootstrapKeyId: digest(keyPayload),
  bootstrapPublicKey: publicKey,
  cursorSecret: 'e2e-revalidation-cursor-secret-0001',
  rolePolicyId: rolePolicy.role_policy_id,
  rolePolicySha256: createHash('sha256').update(rolePolicyBytes).digest('hex')
})

async function start() {
  const root = resolve(process.env.E2E_REVALIDATION_RUNTIME)
  const secretRoot = resolve(root, 'secrets')
  await mkdir(secretRoot, { recursive: true, mode: 0o700 })
  const privatePath = resolve(secretRoot, 'active-private.pem')
  const publicPath = resolve(secretRoot, 'bootstrap-public.pem')
  const keyringPath = resolve(secretRoot, 'keyring.json')
  const rolePolicyPath = resolve(secretRoot, 'role-policy.json')
  await writeFile(privatePath, privateKey.export({ format: 'pem', type: 'pkcs8' }), { mode: 0o600 })
  await writeFile(publicPath, publicKeyObject.export({ format: 'pem', type: 'spki' }), { mode: 0o600 })
  await writeFile(keyringPath, canonicalJson({ keyring_schema_version: '1.0.0', keys: [{ key_id: E2E_REVALIDATION.bootstrapKeyId, private_key_path: privatePath }] }), { mode: 0o600 })
  await writeFile(rolePolicyPath, rolePolicyBytes, { mode: 0o600 })
  Object.assign(process.env, {
    BIOCHEMICAL_JS_REVALIDATION_STATE_PATH: resolve(process.env.BIOCHEMICAL_JS_STATE_ROOT, 'revalidation-state-v1'),
    BIOCHEMICAL_JS_REVALIDATION_BOOTSTRAP_PUBLIC_KEY: publicPath,
    BIOCHEMICAL_JS_REVALIDATION_BOOTSTRAP_KEY_ID: E2E_REVALIDATION.bootstrapKeyId,
    BIOCHEMICAL_JS_REVALIDATION_SIGNER_KEYRING: keyringPath,
    BIOCHEMICAL_JS_REVALIDATION_ROLE_POLICY: rolePolicyPath,
    BIOCHEMICAL_JS_REVALIDATION_ROLE_POLICY_SHA256: E2E_REVALIDATION.rolePolicySha256,
    BIOCHEMICAL_JS_REVALIDATION_PLAN_PROFILE: 'goal15-scale-v1',
    BIOCHEMICAL_JS_REVALIDATION_CURSOR_SECRET: E2E_REVALIDATION.cursorSecret,
    BIOCHEMICAL_JS_REVALIDATION_ALLOWED_ORIGIN: 'http://127.0.0.1:5173',
    BIOCHEMICAL_JS_REVALIDATION_AUTHOR_BEARER_TOKEN: E2E_REVALIDATION.authorBearerToken,
    BIOCHEMICAL_JS_REVALIDATION_AUTHOR_ACTOR_ID: 'inference:campaign-author',
    BIOCHEMICAL_JS_REVALIDATION_EXECUTOR_BEARER_TOKEN: E2E_REVALIDATION.executorBearerToken,
    BIOCHEMICAL_JS_REVALIDATION_EXECUTOR_ACTOR_ID: 'inference:executor'
  })
  const serviceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../biochemical-db/service-js')
  await import(pathToFileURL(resolve(serviceRoot, 'src/http/server.js')))
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) await start()
