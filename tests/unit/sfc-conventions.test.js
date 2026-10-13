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
})
