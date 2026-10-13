// Parsing helpers shared by the design-system tests.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss from 'postcss'

export const ROOT = process.cwd() // vitest runs from the repository root
export const PRIMITIVE_FILE = 'src/styles/tokens.primitive.css'
export const SEMANTIC_FILE = 'src/styles/tokens.semantic.css'
// Files that must use semantic tokens only (no primitives, no raw values).
export const SYSTEM_FILES = ['base.css', 'layout.css', 'components.css'].map((name) => `src/styles/${name}`)

export function read(path) {
  return readFileSync(join(ROOT, path), 'utf8')
}

export function sourceFiles(dir = 'src', extensions = ['.css', '.vue']) {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`
    if (entry.isDirectory()) return sourceFiles(path, extensions)
    return extensions.some((extension) => entry.name.endsWith(extension)) ? [path] : []
  })
}

// CSS text found in a file: the whole file for .css; <style> blocks and inline
// style="" attributes for .vue.
export function cssChunks(path) {
  const text = read(path)
  if (path.endsWith('.css')) return [text]
  const blocks = [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((match) => match[1])
  const inline = [...text.matchAll(/(?<![:\w-])style=(["'])([^"']*)\1/g)].map((match) => `x{${match[2]}}`)
  return [...blocks, ...inline]
}

export function declarations(css) {
  const found = []
  postcss.parse(css).walkDecls((decl) => found.push({ prop: decl.prop, value: decl.value, line: decl.source?.start?.line }))
  return found
}

// Custom properties declared in a CSS file: Map(name -> value).
export function customProperties(path) {
  return new Map(declarations(read(path)).filter((decl) => decl.prop.startsWith('--')).map((decl) => [decl.prop, decl.value]))
}

export function varReferences(value) {
  return [...value.matchAll(/var\((--[\w-]+)/g)].map((match) => match[1])
}

// ---- Raw-literal detection ----

const NAMED_COLORS = new Set(['black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'gray', 'grey', 'silver', 'navy', 'teal', 'aqua', 'lime', 'maroon', 'olive', 'fuchsia', 'pink', 'brown', 'gold', 'cyan', 'magenta'])
const COLOR_PROPS = /^(color|background(-color|-image)?|border(-[a-z]+)*|outline(-color)?|fill|stroke|box-shadow|text-shadow|text-decoration(-color)?|caret-color|accent-color|column-rule(-color)?)$/
const FONT_KEYWORD = /^(var\(|inherit$|initial$|unset$|revert)/

function withoutOpaque(value) {
  return value.replace(/url\([^)]*\)/g, '').replace(/(["'])(?:\\.|(?!\1).)*\1/g, '')
}

export function literalViolations(prop, rawValue) {
  const value = withoutOpaque(rawValue).trim()
  const reasons = []
  if (/#[0-9a-fA-F]{3,8}\b/.test(value)) reasons.push('hex colour')
  if (/\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/.test(value)) reasons.push('colour function')
  if (COLOR_PROPS.test(prop) && value.split(/[\s,()/]+/).some((word) => NAMED_COLORS.has(word.toLowerCase()))) reasons.push('named colour')
  if (/(?<![\w-])[+-]?(?:\d+\.?\d*|\.\d+)(?:px|rem)\b/.test(value)) reasons.push('px/rem length')
  if (prop === 'font-family' && !FONT_KEYWORD.test(value)) reasons.push('font family')
  if (prop === 'font' && !FONT_KEYWORD.test(value)) reasons.push('font shorthand')
  if (prop === 'font-weight' && !FONT_KEYWORD.test(value)) reasons.push('font weight')
  if (prop === 'line-height' && /^[\d.]+$/.test(value)) reasons.push('unitless line height')
  return reasons
}

export function fileViolations(path) {
  return cssChunks(path).flatMap((css) =>
    declarations(css).flatMap(({ prop, value, line }) =>
      literalViolations(prop, value).map((reason) => ({ path, line, prop, value, reason }))
    )
  )
}
