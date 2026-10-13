import { describe, expect, it } from 'vitest'
import { read, sourceFiles } from '../helpers/css-tokens.js'

// Every SFC is `<script setup vapor>` with `<template lang="pug">` and no
// <style>: layout and look come from src/styles (docs/DESIGN_SYSTEM.md).
const isVapor = (text) => /<script\s+setup\s+vapor[\s>]/.test(text)
const isPug = (text) => /<template\s+lang="pug"\s*>/.test(text)

const files = sourceFiles('src', ['.vue'])

describe('SFC conventions', () => {
  it('finds the single-file components', () => {
    expect(files.length).toBeGreaterThan(40)
  })

  it('writes every SFC as <script setup vapor> + <template lang="pug">', () => {
    expect(files.filter((path) => !isVapor(read(path)) || !isPug(read(path)))).toEqual([])
  })

  it('has no per-component <style> block', () => {
    expect(files.filter((path) => /<style[\s>]/.test(read(path)))).toEqual([])
  })

  // The production build compiles `<script setup>` templates inline, where
  // `$slots` and `$attrs` are not defined (a ReferenceError at render time, which
  // the test compile does not show). useSlots() and useAttrs() work in both.
  it('reads slots and attributes with useSlots() and useAttrs(), never $slots or $attrs in a template', () => {
    const offenders = files.flatMap((path) => {
      const template = read(path).split('<template lang="pug">')[1] ?? ''
      return [...template.matchAll(/\$(slots|attrs|props|emit|refs|parent|el)\b/g)].map((match) => `${path}: $${match[1]}`)
    })
    expect(offenders).toEqual([])
  })
})
