// Rate-law library: small pure functions. Concentrations are clamped at >= 0,
// non-positive or non-finite constants make a law return 0 (never NaN/Infinity),
// so a rate can never drive a species negative by itself. Units are the caller's
// (a model should use one concentration unit and one time unit throughout).
// Reversible laws (reversibleMM, reversibleMassAction) may return negative net flux.

const pos = (x) => (x > 0 && x < Infinity ? x : 0)
const fin = (x) => (Number.isFinite(x) ? x : 0)
// num/den with a non-positive or non-finite denominator treated as "no flux".
const ratio = (num, den) => (den > 0 && den < Infinity ? fin(num / den) : 0)
const power = (x, n) => (n === 1 ? x : Math.pow(x, n))
// Saturation fraction x^n / (K^n + x^n); 0 when both are 0.
const sat = (x, K, n) => {
  const a = power(pos(x), pos(n) || 1)
  return ratio(a, power(pos(K), pos(n) || 1) + a)
}
// 1 + I/Ki, the inhibition factor; an unusable Ki means "no inhibition".
const inhib = (I, Ki) => (Ki > 0 && Ki < Infinity ? 1 + pos(I) / Ki : 1)

/** v = k * product(substrates). First-order when one substrate is given. */
export function massAction(k, ...substrates) {
  let v = pos(k)
  for (const s of substrates) v *= pos(s)
  return fin(v)
}

/** v = k * X (first-order clearance / degradation). */
export const firstOrder = (k, X) => massAction(k, X)

/** Zero-order constant input (dietary intake, synthesis): v = rate. */
export const constantInput = (rate) => pos(rate)

/** Net mass-action flux kf*prod(S) - kr*prod(P); product arguments are already multiplied. */
export function reversibleMassAction(kf, kr, substrateProduct, productProduct) {
  return fin(pos(kf) * pos(substrateProduct) - pos(kr) * pos(productProduct))
}

/** v = Vmax*S / (Km + S). Vmax in conc/time, Km in conc. */
export function michaelisMenten(Vmax, Km, S) {
  const s = pos(S)
  return ratio(pos(Vmax) * s, pos(Km) + s)
}

/**
 * Reversible Michaelis-Menten with the Haldane relationship Keq = Vf*Kp/(Vr*Ks):
 * v = (Vf/Ks)(S - P/Keq) / (1 + S/Ks + P/Kp). Negative when P/S > Keq.
 */
export function reversibleMM(Vf, Ks, Kp, Keq, S, P) {
  if (!(Ks > 0 && Kp > 0 && Keq > 0)) return 0
  const s = pos(S)
  const p = pos(P)
  return fin((pos(Vf) / Ks) * (s - p / Keq) / (1 + s / Ks + p / Kp))
}

/** Ordered sequential bi-bi (A binds first): v = Vmax*A*B / (Kia*Kmb + Kmb*A + Kma*B + A*B). */
export function orderedBiBi(Vmax, Kia, Kma, Kmb, A, B) {
  const a = pos(A)
  const b = pos(B)
  return ratio(pos(Vmax) * a * b, pos(Kia) * pos(Kmb) + pos(Kmb) * a + pos(Kma) * b + a * b)
}

/** Rapid-equilibrium random bi-bi, independent binding (Kia = Kma): v = Vmax*A*B / ((Kma+A)(Kmb+B)). */
export function randomBiBi(Vmax, Kma, Kmb, A, B) {
  const a = pos(A)
  const b = pos(B)
  return ratio(pos(Vmax) * a * b, (pos(Kma) + a) * (pos(Kmb) + b))
}

/** Ping-pong bi-bi: v = Vmax*A*B / (Kmb*A + Kma*B + A*B). */
export function pingPong(Vmax, Kma, Kmb, A, B) {
  const a = pos(A)
  const b = pos(B)
  return ratio(pos(Vmax) * a * b, pos(Kmb) * a + pos(Kma) * b + a * b)
}

/** Competitive inhibition: v = Vmax*S / (Km(1+I/Ki) + S). */
export function competitiveInhibition(Vmax, Km, Ki, S, I) {
  const s = pos(S)
  return ratio(pos(Vmax) * s, pos(Km) * inhib(I, Ki) + s)
}

/** Uncompetitive inhibition: v = Vmax*S / (Km + S(1+I/Ki)). */
export function uncompetitiveInhibition(Vmax, Km, Ki, S, I) {
  const s = pos(S)
  return ratio(pos(Vmax) * s, pos(Km) + s * inhib(I, Ki))
}

/** Pure non-competitive inhibition: v = Vmax*S / ((Km + S)(1+I/Ki)). */
export function noncompetitiveInhibition(Vmax, Km, Ki, S, I) {
  const s = pos(S)
  return ratio(pos(Vmax) * s, (pos(Km) + s) * inhib(I, Ki))
}

/** Mixed inhibition: v = Vmax*S / (Km(1+I/Kic) + S(1+I/Kiu)). */
export function mixedInhibition(Vmax, Km, Kic, Kiu, S, I) {
  const s = pos(S)
  return ratio(pos(Vmax) * s, pos(Km) * inhib(I, Kic) + s * inhib(I, Kiu))
}

/** Substrate inhibition: v = Vmax*S / (Km + S + S^2/Ksi). */
export function substrateInhibition(Vmax, Km, Ksi, S) {
  const s = pos(S)
  return ratio(pos(Vmax) * s, pos(Km) + s + (Ksi > 0 ? (s * s) / Ksi : 0))
}

/** Hill: v = Vmax*S^n / (K^n + S^n). K is the half-saturation concentration. */
export function hill(Vmax, K, n, S) {
  return fin(pos(Vmax) * sat(S, K, n))
}

// --- multiplicative modifiers (dimensionless factors, multiply a base rate) ---

/** Allosteric activation factor: 1 + (fold-1) * A^n/(Ka^n + A^n); 1 at A=0, `fold` at saturation. */
export function allostericActivation(A, Ka, n = 1, fold = 2) {
  return 1 + (pos(fold) - 1) * sat(A, Ka, n)
}

/** Allosteric inhibition factor: residual + (1-residual) * Ki^n/(Ki^n + I^n); 1 at I=0. */
export function allostericInhibition(I, Ki, n = 1, residual = 0) {
  const r = Math.min(1, pos(residual))
  return r + (1 - r) * (1 - sat(I, Ki, n))
}

/** General ligand modifier: 1 + (fold-1) * L^n/(K^n + L^n). fold > 1 activates, 0 <= fold < 1 inhibits. */
export function ligandModifier(L, K, fold, n = 1) {
  return 1 + (pos(fold) - 1) * sat(L, K, n)
}

/**
 * Registry used by the model compiler. `params` are the parameter names a rate spec must
 * give (parameter id or numeric literal), `defaults` fill optional ones, `roles` are the
 * species slots (bound through rate.species, or the reaction's substrates/products in order:
 * S/A -> substrates[0], B -> substrates[1], P -> products[0]). `uses` marks laws that take
 * the reaction's whole substrate/product product (`sub`, `prod`) instead of named roles.
 */
export const RATE_LAWS = {
  massAction: { params: ['k'], roles: [], uses: ['sub'], eval: (p, s) => pos(p.k) * s.sub },
  reversibleMassAction: { params: ['kf', 'kr'], roles: [], uses: ['sub', 'prod'], eval: (p, s) => reversibleMassAction(p.kf, p.kr, s.sub, s.prod) },
  firstOrder: { params: ['k'], roles: ['S'], eval: (p, s) => firstOrder(p.k, s.S) },
  constantInput: { params: ['rate'], roles: [], eval: (p) => constantInput(p.rate) },
  michaelisMenten: { params: ['Vmax', 'Km'], roles: ['S'], eval: (p, s) => michaelisMenten(p.Vmax, p.Km, s.S) },
  reversibleMM: { params: ['Vf', 'Ks', 'Kp', 'Keq'], roles: ['S', 'P'], eval: (p, s) => reversibleMM(p.Vf, p.Ks, p.Kp, p.Keq, s.S, s.P) },
  orderedBiBi: { params: ['Vmax', 'Kia', 'Kma', 'Kmb'], roles: ['A', 'B'], eval: (p, s) => orderedBiBi(p.Vmax, p.Kia, p.Kma, p.Kmb, s.A, s.B) },
  randomBiBi: { params: ['Vmax', 'Kma', 'Kmb'], roles: ['A', 'B'], eval: (p, s) => randomBiBi(p.Vmax, p.Kma, p.Kmb, s.A, s.B) },
  pingPong: { params: ['Vmax', 'Kma', 'Kmb'], roles: ['A', 'B'], eval: (p, s) => pingPong(p.Vmax, p.Kma, p.Kmb, s.A, s.B) },
  competitiveInhibition: { params: ['Vmax', 'Km', 'Ki'], roles: ['S', 'I'], eval: (p, s) => competitiveInhibition(p.Vmax, p.Km, p.Ki, s.S, s.I) },
  uncompetitiveInhibition: { params: ['Vmax', 'Km', 'Ki'], roles: ['S', 'I'], eval: (p, s) => uncompetitiveInhibition(p.Vmax, p.Km, p.Ki, s.S, s.I) },
  noncompetitiveInhibition: { params: ['Vmax', 'Km', 'Ki'], roles: ['S', 'I'], eval: (p, s) => noncompetitiveInhibition(p.Vmax, p.Km, p.Ki, s.S, s.I) },
  mixedInhibition: { params: ['Vmax', 'Km', 'Kic', 'Kiu'], roles: ['S', 'I'], eval: (p, s) => mixedInhibition(p.Vmax, p.Km, p.Kic, p.Kiu, s.S, s.I) },
  substrateInhibition: { params: ['Vmax', 'Km', 'Ksi'], roles: ['S'], eval: (p, s) => substrateInhibition(p.Vmax, p.Km, p.Ksi, s.S) },
  hill: { params: ['Vmax', 'K', 'n'], roles: ['S'], eval: (p, s) => hill(p.Vmax, p.K, p.n, s.S) }
}

/** Modifier laws usable in rate.modifiers[]; each returns a factor that multiplies the base rate. */
export const MODIFIER_LAWS = {
  allostericActivation: { params: ['Ka', 'n', 'fold'], defaults: { n: 1, fold: 2 }, roles: ['A'], eval: (p, s) => allostericActivation(s.A, p.Ka, p.n, p.fold) },
  allostericInhibition: { params: ['Ki', 'n', 'residual'], defaults: { n: 1, residual: 0 }, roles: ['I'], eval: (p, s) => allostericInhibition(s.I, p.Ki, p.n, p.residual) },
  ligandModifier: { params: ['K', 'fold', 'n'], defaults: { n: 1 }, roles: ['L'], eval: (p, s) => ligandModifier(s.L, p.K, p.fold, p.n) }
}

/** Default role -> index into the reaction's substrates/products when rate.species omits it. */
export const DEFAULT_ROLES = { S: ['substrates', 0], A: ['substrates', 0], B: ['substrates', 1], P: ['products', 0] }
