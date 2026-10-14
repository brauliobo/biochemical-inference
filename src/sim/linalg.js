// Tiny dense linear algebra for the stiff solver and the steady-state Newton polish
// (systems here have tens of species at most). Matrices are row-major Float64Array.

/** In-place LU with partial pivoting. Returns false when the matrix is singular. */
export function luFactor(A, n, piv) {
  for (let i = 0; i < n; i += 1) piv[i] = i
  for (let c = 0; c < n; c += 1) {
    let p = c
    let best = Math.abs(A[c * n + c])
    for (let r = c + 1; r < n; r += 1) {
      const v = Math.abs(A[r * n + c])
      if (v > best) { best = v; p = r }
    }
    if (!(best > 1e-300)) return false
    if (p !== c) {
      for (let k = 0; k < n; k += 1) { const t = A[c * n + k]; A[c * n + k] = A[p * n + k]; A[p * n + k] = t }
      const t = piv[c]; piv[c] = piv[p]; piv[p] = t
    }
    const d = A[c * n + c]
    for (let r = c + 1; r < n; r += 1) {
      const m = (A[r * n + c] /= d)
      if (m !== 0) for (let k = c + 1; k < n; k += 1) A[r * n + k] -= m * A[c * n + k]
    }
  }
  return true
}

/** Solve LU x = b (b is not modified); writes into x. */
export function luSolve(LU, n, piv, b, x) {
  for (let i = 0; i < n; i += 1) {
    let s = b[piv[i]]
    for (let k = 0; k < i; k += 1) s -= LU[i * n + k] * x[k]
    x[i] = s
  }
  for (let i = n - 1; i >= 0; i -= 1) {
    let s = x[i]
    for (let k = i + 1; k < n; k += 1) s -= LU[i * n + k] * x[k]
    x[i] = s / LU[i * n + i]
  }
  return x
}

/** Forward-difference Jacobian df/dy at (t, y) given f0 = f(t, y); returns the number of f evaluations. */
export function numericJacobian(f, t, y, f0, J, work) {
  const n = y.length
  const yp = work.yp
  const fp = work.fp
  yp.set(y)
  for (let j = 0; j < n; j += 1) {
    const h = 1.5e-8 * Math.max(Math.abs(y[j]), 1e-6)
    yp[j] = y[j] + h
    const r = f(t, yp, fp)
    if (r !== fp) fp.set(r)
    for (let i = 0; i < n; i += 1) J[i * n + j] = (fp[i] - f0[i]) / h
    yp[j] = y[j]
  }
  return n
}
