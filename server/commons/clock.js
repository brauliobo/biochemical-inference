// UTC ISO-8601 timestamps; `now` is an injectable () => Date | number | string clock.
export const isoNow = () => new Date().toISOString()

// Second-resolution form (2026-01-02T03:04:05Z) used by the signed producer contracts.
export const isoSeconds = (now) => new Date(now()).toISOString().replace(/\.\d{3}Z$/, 'Z')
