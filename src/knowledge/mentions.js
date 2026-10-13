// Inline mentions in body text: [[type:slug]] or [[type:slug|display text]].
import { isId } from './ids.js'

const MENTION = /\[\[([^[\]]*)\]\]/g

/**
 * Split text into parts:
 *   { text }                      plain text
 *   { mention: { id, label } }    well-formed mention (label is null without display text)
 *   { malformed: '[[raw]]' }      brackets whose content is not a valid id
 */
export function parseMentions(input) {
  const text = String(input)
  const parts = []
  let cursor = 0
  for (const match of text.matchAll(MENTION)) {
    if (match.index > cursor) parts.push({ text: text.slice(cursor, match.index) })
    const pipe = match[1].indexOf('|')
    const id = (pipe < 0 ? match[1] : match[1].slice(0, pipe)).trim()
    const label = pipe < 0 ? '' : match[1].slice(pipe + 1).trim()
    parts.push(isId(id) ? { mention: { id, label: label || null } } : { malformed: match[0] })
    cursor = match.index + match[0].length
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) })
  return parts
}

/** Distinct mentioned ids (in order of first appearance) and malformed fragments of one text. */
export function extractMentions(text) {
  const ids = []
  const malformed = []
  for (const part of parseMentions(text)) {
    if (part.mention && !ids.includes(part.mention.id)) ids.push(part.mention.id)
    else if (part.malformed) malformed.push(part.malformed)
  }
  return { ids, malformed }
}

/**
 * Resolve mentions against a lookup `(id) => entity | undefined`.
 * Returns segments: { text } | { link: { id, label, type } }.
 * Unresolvable or malformed mentions degrade to plain text so a page never breaks.
 */
export function resolveMentions(text, lookup) {
  const segments = []
  const push = (segment) => {
    const last = segments[segments.length - 1]
    if (segment.text !== undefined && last?.text !== undefined) last.text += segment.text
    else segments.push(segment)
  }
  for (const part of parseMentions(text)) {
    if (part.text !== undefined) push({ text: part.text })
    else if (part.malformed) push({ text: part.malformed })
    else {
      const target = lookup(part.mention.id)
      if (target) push({ link: { id: target.id, label: part.mention.label ?? target.name, type: target.type } })
      else push({ text: part.mention.label ?? part.mention.id })
    }
  }
  return segments
}
