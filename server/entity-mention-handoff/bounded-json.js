import { Buffer } from 'node:buffer'
import { TextDecoder } from 'node:util'

const utf8 = new TextDecoder('utf-8', { fatal: true })

const ENTITY_MENTION_JSON_LIMITS = Object.freeze({
  maximumArrayLength:  2_000_000,
  maximumDepth:        32,
  maximumKeyBytes:     512,
  maximumNodes:        4_000_000,
  maximumObjectFields: 100_000,
  maximumStringBytes:  1_048_576
})

function fail(label, reason) {
  throw new TypeError(`${label} ${reason}`)
}

function skipWhitespace(text, offset) {
  while (offset < text.length && /\s/.test(text[offset])) offset += 1
  return offset
}

function scanString(text, offset, label) {
  const start = offset
  offset += 1
  while (offset < text.length) {
    const character = text[offset]
    if (character === '"') {
      const raw = text.slice(start, offset + 1)
      let value
      try { value = JSON.parse(raw) } catch { fail(label, 'contains an invalid string') }
      return { offset: offset + 1, value }
    }
    if (character === '\\') {
      offset += 1
      if (text[offset] === 'u') offset += 4
    }
    offset += 1
  }
  fail(label, 'contains an unterminated string')
}

function addValue(stack, state, label, limits) {
  state.nodes += 1
  if (state.nodes > limits.maximumNodes) fail(label, 'exceeds its structural node bound')
  const parent = stack.at(-1)
  if (parent?.type === 'array') {
    parent.count += 1
    if (parent.count > limits.maximumArrayLength) fail(label, 'array exceeds its element bound')
  }
}

function assertBoundedJsonBytes(bytes, limits = ENTITY_MENTION_JSON_LIMITS, label = 'JSON') {
  const text = Buffer.isBuffer(bytes) || bytes instanceof Uint8Array ? utf8.decode(bytes) : String(bytes)
  const stack = []
  const state = { nodes: 0 }
  let offset = 0

  while (offset < text.length) {
    offset = skipWhitespace(text, offset)
    if (offset >= text.length) break
    const character = text[offset]

    if (character === '"') {
      const string = scanString(text, offset, label)
      const following = skipWhitespace(text, string.offset)
      const parent = stack.at(-1)
      if (text[following] === ':' && parent?.type === 'object') {
        if (Buffer.byteLength(string.value) > limits.maximumKeyBytes) fail(label, 'key exceeds its byte bound')
        if (parent.keys.has(string.value)) fail(label, `contains duplicate key ${string.value}`)
        parent.keys.add(string.value)
        parent.count += 1
        if (parent.count > limits.maximumObjectFields) fail(label, 'object exceeds its field bound')
      } else {
        if (Buffer.byteLength(string.value) > limits.maximumStringBytes) fail(label, 'string exceeds its byte bound')
        addValue(stack, state, label, limits)
      }
      offset = string.offset
      continue
    }

    if (character === '{' || character === '[') {
      addValue(stack, state, label, limits)
      stack.push(character === '{' ? { count: 0, keys: new Set(), type: 'object' } : { count: 0, type: 'array' })
      if (stack.length > limits.maximumDepth) fail(label, 'exceeds its nesting-depth bound')
      offset += 1
      continue
    }

    if (character === '}' || character === ']') {
      stack.pop()
      offset += 1
      continue
    }

    if (!'[:,]'.includes(character)) {
      addValue(stack, state, label, limits)
      while (offset < text.length && !/[,\]}\s]/.test(text[offset])) offset += 1
      continue
    }

    offset += 1
  }

  return text
}

export function parseBoundedJson(bytes, limits = ENTITY_MENTION_JSON_LIMITS, label = 'JSON') {
  return JSON.parse(assertBoundedJsonBytes(bytes, limits, label))
}
