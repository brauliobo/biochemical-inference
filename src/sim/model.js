// Declarative kinetic model -> closures over typed arrays. The model is a plain object (format in
// docs/SIMULATION_ENGINE.md); validateModel (validate.js) lists every problem, while compileModel only
// throws on the first structural one it trips over, so shipped (pre-validated) models stay cheap.

import { DEFAULT_ROLES, MODIFIER_LAWS, RATE_LAWS } from './ratelaws.js'

const pos = (x) => (x > 0 ? x : 0)
const power = (x, n) => (n === 1 ? x : Math.pow(x, n))
const must = (ok, message) => { if (!ok) throw new Error(`Invalid model: ${message}`) }

function compileRate(rx, spIdx, pIdx) {
  const where = `reaction ${rx.id}`
  const sp = (id, what) => { must(spIdx.has(id), `${where}: ${what} "${id}" is not a declared species`); return spIdx.get(id) }
  const build = (lawDef, spec) => {
    must(lawDef, `${where}: unknown law "${spec && spec.law}"`)
    const given = spec.params ?? {}
    const slots = lawDef.params.map((name) => {
      const v = given[name] !== undefined ? given[name] : lawDef.defaults && lawDef.defaults[name]
      must(typeof v === 'number' || pIdx.has(v), `${where}: law ${spec.law} needs param "${name}" (parameter id or number)`)
      return { name, idx: typeof v === 'string' ? pIdx.get(v) : -1, lit: typeof v === 'number' ? v : 0 }
    })
    const roles = lawDef.roles.map((role) => {
      const explicit = (spec.species ?? {})[role]
      if (explicit !== undefined) return { role, idx: sp(explicit, `role ${role}`) }
      const [side, k] = DEFAULT_ROLES[role] ?? []
      must(side && rx[side] && rx[side][k], `${where}: law ${spec.law} needs species role "${role}" (set rate.species.${role})`)
      return { role, idx: sp(rx[side][k].species, role) }
    })
    return { lawDef, slots, roles, pObj: {}, sObj: { sub: 0, prod: 0 } }
  }
  const main = build(RATE_LAWS[rx.rate.law], rx.rate)
  const mods = (rx.rate.modifiers ?? []).map((m) => build(MODIFIER_LAWS[m.law], m))
  const side = (items) => items.map((s) => [sp(s.species, 'species'), s.n])
  const subs = side(rx.substrates)
  const prods = side(rx.products)
  const uses = main.lawDef.uses ?? []
  const run = (b, P, y) => {
    for (const s of b.slots) b.pObj[s.name] = s.idx >= 0 ? P[s.idx] : s.lit
    for (const r of b.roles) b.sObj[r.role] = y[r.idx]
    return b.lawDef.eval(b.pObj, b.sObj)
  }
  return (P, y) => {
    if (uses.includes('sub')) { let a = 1; for (const [i, n] of subs) a *= power(pos(y[i]), n); main.sObj.sub = a }
    if (uses.includes('prod')) { let a = 1; for (const [i, n] of prods) a *= power(pos(y[i]), n); main.sObj.prod = a }
    let v = run(main, P, y)
    for (const m of mods) v *= run(m, P, y)
    return Number.isFinite(v) ? v : 0
  }
}

/**
 * Compile a model into typed-array closures.
 * Returns { model, names, reactionIds, paramIds, controlIds, observableIds, y0, stoichiometry, fixed,
 *   speciesIndex, reactionIndex, paramIndex, defaultControls(), values(y, flux) -> { id: value } for species +
 *   reactions + observables, bind(controls, paramOverrides) -> system, derivative(t, y, controls),
 *   fluxes(t, y, controls) }.
 * `stoichiometry[i][j]` is the net change of species i per unit flux of reaction j.
 * A bound `system` has { y0, P, derivative(t, y, out), fluxes(t, y, out), setParam(id, v), getParam(id) } and
 * owns a private copy of the parameters, so events and ensembles never mutate the shared model.
 */
export function compileModel(model) {
  must(model && Array.isArray(model.species) && model.species.length > 0, 'model needs a species array')
  const species = model.species
  const reactions = model.reactions ?? []
  const parameters = model.parameters ?? []
  const controlDefs = model.controls ?? []
  const names = species.map((s) => s.id)
  const reactionIds = reactions.map((r) => r.id)
  const paramIds = parameters.map((p) => p.id)
  const spIdx = new Map(names.map((id, i) => [id, i]))
  const pIdx = new Map(paramIds.map((id, i) => [id, i]))
  const rIdx = new Map(reactionIds.map((id, i) => [id, i]))
  const fixed = species.map((s) => Boolean(s.fixed))
  const baseP = Float64Array.from(parameters.map((p) => p.value))
  const baseY0 = Float64Array.from(species.map((s) => s.initial))
  const nS = names.length
  const nR = reactions.length

  const stoichiometry = names.map(() => new Array(nR).fill(0))
  const rates = reactions.map((rx) => compileRate(rx, spIdx, pIdx))
  const nz = reactions.map((rx, j) => {
    for (const [side, sign] of [['substrates', -1], ['products', 1]]) for (const s of rx[side]) stoichiometry[spIdx.get(s.species)][j] += sign * s.n
    return stoichiometry.map((row, i) => [i, row[j]]).filter(([i, c]) => c !== 0 && !fixed[i])
  })
  for (const c of controlDefs) {
    for (const e of c.effects) {
      const pool = { param: pIdx, reaction: rIdx, species: spIdx }[e.target]
      must(pool && pool.has(e.id), `control ${c.id}: ${e.target} "${e.id}" is not declared`)
    }
  }
  const observables = (model.observables ?? []).map((o) => {
    const kind = Object.keys(o.expr)[0]
    return { id: o.id, kind, terms: kind === 'ref' ? [o.expr.ref] : o.expr[kind] }
  })
  const defaultControls = () => Object.fromEntries(controlDefs.map((c) => [c.id, c.default]))

  const values = (y, flux) => {
    const out = {}
    names.forEach((id, i) => { out[id] = y[i] })
    reactionIds.forEach((id, j) => { out[id] = flux[j] })
    for (const o of observables) {
      const t = o.terms.map((id) => out[id])
      out[o.id] = o.kind === 'ref' ? t[0]
        : o.kind === 'sum' ? t.reduce((a, b) => a + b, 0)
          : o.kind === 'product' ? t.reduce((a, b) => a * b, 1)
            : o.kind === 'diff' ? t[0] - t[1]
              : (t[1] > 0 ? t[0] / t[1] : NaN)
    }
    return out
  }

  const bind = (controls = {}, overrides = {}) => {
    const P = Float64Array.from(baseP)
    const rm = new Float64Array(nR).fill(1)
    const y0 = Float64Array.from(baseY0)
    for (const [id, v] of Object.entries(overrides)) {
      if (!pIdx.has(id)) throw new Error(`Unknown parameter override "${id}"`)
      P[pIdx.get(id)] = v
    }
    for (const id of Object.keys(controls)) if (!controlDefs.some((c) => c.id === id)) throw new Error(`Unknown control "${id}"`)
    for (const c of controlDefs) {
      const raw = controls[c.id] !== undefined ? controls[c.id] : c.default
      if (!Number.isFinite(raw)) throw new Error(`Control "${c.id}" must be a finite number`)
      for (const e of c.effects) {
        const v = raw * (e.gain ?? 1)
        if (e.target === 'reaction') rm[rIdx.get(e.id)] *= v
        else {
          const arr = e.target === 'param' ? P : y0
          const k = e.target === 'param' ? pIdx.get(e.id) : spIdx.get(e.id)
          arr[k] = e.op === 'multiply' ? arr[k] * v : e.op === 'set' ? v : arr[k] + v
        }
      }
    }
    for (let i = 0; i < nS; i += 1) if (y0[i] < 0) y0[i] = 0
    const v = new Float64Array(nR)
    const system = {
      P, y0, names, speciesIndex: spIdx, paramIndex: pIdx,
      fluxes(t, y, out = new Float64Array(nR)) {
        for (let j = 0; j < nR; j += 1) out[j] = rm[j] * rates[j](P, y)
        return out
      },
      derivative(t, y, out = new Float64Array(nS)) {
        system.fluxes(t, y, v)
        out.fill(0)
        for (let j = 0; j < nR; j += 1) {
          const f = v[j]
          if (f !== 0) for (const [i, c] of nz[j]) out[i] += c * f
        }
        return out
      },
      setParam(id, value) { P[pIdx.get(id)] = value },
      getParam(id) { return P[pIdx.get(id)] }
    }
    return system
  }

  const cache = new WeakMap()
  let defaultSystem = null
  const systemFor = (controls) => {
    if (!controls) return (defaultSystem ??= bind())
    if (!cache.has(controls)) cache.set(controls, bind(controls))
    return cache.get(controls)
  }
  return {
    model, names, reactionIds, paramIds, controlIds: controlDefs.map((c) => c.id), observableIds: observables.map((o) => o.id),
    y0: baseY0, stoichiometry, fixed, speciesIndex: spIdx, reactionIndex: rIdx, paramIndex: pIdx,
    bind, values, defaultControls,
    derivative: (t, y, controls) => systemFor(controls).derivative(t, y),
    fluxes: (t, y, controls) => systemFor(controls).fluxes(t, y)
  }
}

/** Accept a raw model or an already compiled one. */
export const asCompiled = (model) => (model && typeof model.bind === 'function' && model.names ? model : compileModel(model))
