// Hand-written model validator (no schema library). Kept apart from model.js so applications that ship
// pre-validated model data (tests call validateModel) can tree-shake it out of the browser bundle.

import { DEFAULT_ROLES, MODIFIER_LAWS, RATE_LAWS } from './ratelaws.js'

const ID = /^[A-Za-z_][A-Za-z0-9_.-]*$/
const ONTOLOGY = { species: 'compound', reaction: 'reaction', enzyme: 'enzyme' }
const OPS = ['multiply', 'set', 'add']
const TARGETS = ['param', 'reaction', 'species']
const isNum = (x) => typeof x === 'number' && Number.isFinite(x)

/** Validate a model object. Returns { valid, errors: string[], warnings: string[] }. */
export function validateModel(model) {
  const errors = []
  const warnings = []
  const err = (m) => errors.push(m)
  if (!model || typeof model !== 'object') return { valid: false, errors: ['model must be an object'], warnings }
  const list = (key) => (Array.isArray(model[key]) ? model[key] : (model[key] === undefined ? [] : (err(`${key} must be an array`), [])))
  const species = list('species'); const parameters = list('parameters'); const reactions = list('reactions')
  const controls = list('controls'); const events = list('events'); const observables = list('observables')
  if (species.length === 0) err('model needs at least one species')

  const names = new Map() // every species/parameter/reaction/control/observable id: one flat namespace
  const claim = (kind, id) => {
    if (typeof id !== 'string' || !ID.test(id)) return err(`${kind} id ${JSON.stringify(id)} is not a valid identifier`)
    if (names.has(id)) return err(`${kind} id "${id}" is already used by a ${names.get(id)}`)
    names.set(id, kind)
  }
  const speciesIds = new Set(); const paramIds = new Set(); const reactionIds = new Set()
  const ontology = (kind, id, value) => {
    if (value === undefined) return
    const prefix = ONTOLOGY[kind]
    if (typeof value !== 'string' || !value.startsWith(`${prefix}:`) || value.length === prefix.length + 1) err(`${id}: ${kind === 'enzyme' ? 'enzymeId' : 'ontologyId'} must look like "${prefix}:<slug>"`)
  }

  species.forEach((s, i) => {
    if (!s || typeof s !== 'object') return err(`species[${i}] must be an object`)
    claim('species', s.id); speciesIds.add(s.id)
    if (!isNum(s.initial) || s.initial < 0) err(`species ${s.id}: initial must be a finite number >= 0`)
    if (s.fixed !== undefined && typeof s.fixed !== 'boolean') err(`species ${s.id}: fixed must be boolean`)
    ontology('species', s.id, s.ontologyId)
  })
  parameters.forEach((p, i) => {
    if (!p || typeof p !== 'object') return err(`parameters[${i}] must be an object`)
    claim('parameter', p.id); paramIds.add(p.id)
    if (!isNum(p.value)) err(`parameter ${p.id}: value must be a finite number`)
    for (const k of ['low', 'high']) if (p[k] !== undefined && !isNum(p[k])) err(`parameter ${p.id}: ${k} must be a finite number`)
    if (isNum(p.low) && isNum(p.high) && p.low > p.high) err(`parameter ${p.id}: low > high`)
    if (isNum(p.value) && ((isNum(p.low) && p.value < p.low) || (isNum(p.high) && p.value > p.high))) warnings.push(`parameter ${p.id}: value outside [low, high]`)
    if (p.confidence !== undefined && !['high', 'medium', 'low', 'assumed'].includes(p.confidence)) warnings.push(`parameter ${p.id}: confidence "${p.confidence}" is not high|medium|low|assumed`)
  })

  const checkSide = (rx, side) => {
    const items = rx[side]
    if (!Array.isArray(items)) return err(`reaction ${rx.id}: ${side} must be an array`)
    items.forEach((it) => {
      if (!it || !speciesIds.has(it.species)) err(`reaction ${rx.id}: ${side} species "${it && it.species}" is not declared`)
      if (!isNum(it && it.n) || it.n <= 0) err(`reaction ${rx.id}: ${side} stoichiometry n must be > 0`)
    })
  }
  const checkLaw = (where, spec, registry, rx, isModifier) => {
    const law = registry[spec && spec.law]
    if (!law) return err(`${where}: unknown law "${spec && spec.law}"`)
    const given = spec.params ?? {}
    for (const name of law.params) {
      const v = given[name]
      if (v === undefined) { if (!(law.defaults && name in law.defaults)) err(`${where}: law ${spec.law} needs param "${name}"`) } else if (typeof v === 'string') { if (!paramIds.has(v)) err(`${where}: parameter "${v}" (for ${name}) is not declared`) } else if (!isNum(v)) err(`${where}: ${name} must be a parameter id or a number`)
    }
    for (const name of Object.keys(given)) if (!law.params.includes(name)) err(`${where}: law ${spec.law} has no param "${name}"`)
    const bound = spec.species ?? {}
    for (const role of law.roles) {
      if (bound[role] !== undefined) { if (!speciesIds.has(bound[role])) err(`${where}: species "${bound[role]}" (role ${role}) is not declared`) } else {
        const fallback = !isModifier && DEFAULT_ROLES[role]
        if (!fallback || !Array.isArray(rx[fallback[0]]) || !rx[fallback[0]][fallback[1]]) err(`${where}: law ${spec.law} needs species role "${role}" (set rate.species.${role})`)
      }
    }
    for (const role of Object.keys(bound)) if (!law.roles.includes(role)) err(`${where}: law ${spec.law} has no species role "${role}"`)
  }

  reactions.forEach((rx, i) => {
    if (!rx || typeof rx !== 'object') return err(`reactions[${i}] must be an object`)
    claim('reaction', rx.id); reactionIds.add(rx.id)
    ontology('reaction', rx.id, rx.ontologyId)
    ontology('enzyme', rx.id, rx.enzymeId)
    checkSide(rx, 'substrates'); checkSide(rx, 'products')
    if (!rx.rate || typeof rx.rate !== 'object') return err(`reaction ${rx.id}: rate is required`)
    checkLaw(`reaction ${rx.id}`, rx.rate, RATE_LAWS, rx, false)
    if (rx.rate.modifiers !== undefined && !Array.isArray(rx.rate.modifiers)) err(`reaction ${rx.id}: rate.modifiers must be an array`)
    ;(Array.isArray(rx.rate.modifiers) ? rx.rate.modifiers : []).forEach((m, j) => checkLaw(`reaction ${rx.id} modifier[${j}]`, m, MODIFIER_LAWS, rx, true))
    if (rx.rate.refs !== undefined && !Array.isArray(rx.rate.refs)) err(`reaction ${rx.id}: rate.refs must be an array`)
  })

  controls.forEach((c, i) => {
    if (!c || typeof c !== 'object') return err(`controls[${i}] must be an object`)
    claim('control', c.id)
    if (!isNum(c.min) || !isNum(c.max) || !isNum(c.default) || c.min > c.max || c.default < c.min || c.default > c.max) err(`control ${c.id}: needs finite min <= default <= max`)
    if (!Array.isArray(c.effects) || c.effects.length === 0) return err(`control ${c.id}: effects must be a non-empty array`)
    c.effects.forEach((e, j) => {
      const where = `control ${c.id} effect[${j}]`
      if (!TARGETS.includes(e && e.target)) return err(`${where}: target must be one of ${TARGETS.join('|')}`)
      if (!OPS.includes(e.op)) err(`${where}: op must be one of ${OPS.join('|')}`)
      if (!{ param: paramIds, reaction: reactionIds, species: speciesIds }[e.target].has(e.id)) err(`${where}: ${e.target} "${e.id}" is not declared`)
      if (e.target === 'reaction' && e.op !== 'multiply') err(`${where}: reactions can only be scaled (op "multiply")`)
      if (e.gain !== undefined && !isNum(e.gain)) err(`${where}: gain must be a number`)
    })
  })

  events.forEach((ev, i) => {
    if (!ev || !isNum(ev.time) || ev.time < 0) return err(`events[${i}]: time must be a number >= 0`)
    if (!ev.set && !ev.add) err(`events[${i}]: needs set and/or add`)
    for (const mode of ['set', 'add']) {
      for (const [id, v] of Object.entries(ev[mode] ?? {})) {
        if (!speciesIds.has(id) && !paramIds.has(id)) err(`events[${i}].${mode}: "${id}" is neither a species nor a parameter`)
        if (!isNum(v)) err(`events[${i}].${mode}.${id}: value must be a finite number`)
      }
    }
  })

  const known = new Set([...speciesIds, ...reactionIds])
  observables.forEach((o, i) => {
    if (!o || typeof o !== 'object') return err(`observables[${i}] must be an object`)
    claim('observable', o.id)
    const forms = ['ref', 'sum', 'ratio', 'product', 'diff'].filter((k) => o.expr && o.expr[k] !== undefined)
    if (forms.length !== 1) return err(`observable ${o.id}: expr needs exactly one of ref|sum|ratio|product|diff`)
    const terms = forms[0] === 'ref' ? [o.expr.ref] : o.expr[forms[0]]
    if (!Array.isArray(terms) || terms.length === 0 || ((forms[0] === 'ratio' || forms[0] === 'diff') && terms.length !== 2)) return err(`observable ${o.id}: bad expr terms`)
    terms.forEach((t) => { if (!known.has(t)) err(`observable ${o.id}: term "${t}" is not a species, reaction or earlier observable`) })
    known.add(o.id)
  })
  return { valid: errors.length === 0, errors, warnings }
}
