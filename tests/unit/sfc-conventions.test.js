import { describe, expect, it } from 'vitest'
import { read, sourceFiles } from '../helpers/css-tokens.js'

// Every SFC is `<script setup vapor>` with `<template lang="pug">`. Legacy
// components not yet migrated are listed in the allowlist; it may only shrink,
// and an entry that already conforms must be removed.
const allowlist = JSON.parse(read('tests/unit/sfc-conventions.allowlist.json')).files

const isVapor = (text) => /<script\s+setup\s+vapor[\s>]/.test(text)
const isPug = (text) => /<template\s+lang="pug"\s*>/.test(text)
const conforms = (path) => {
  const text = read(path)
  return isVapor(text) && isPug(text)
}

const files = sourceFiles('src', ['.vue'])

describe('SFC conventions', () => {
  it('writes every non-allowlisted SFC as <script setup vapor> + <template lang="pug">', () => {
    expect(files.filter((path) => !allowlist.includes(path) && !conforms(path))).toEqual([])
  })

  it('lists only existing SFCs that still need migration', () => {
    for (const path of allowlist) {
      expect(files, `${path} does not exist`).toContain(path)
      expect(conforms(path), `${path} conforms: remove it from the allowlist`).toBe(false)
    }
  })
})
