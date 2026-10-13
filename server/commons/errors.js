// Factories for the coded error classes used across services and clients.
// Every class carries `code` and `statusCode`, which the HTTP error handler
// serialises, and a stable `name`.

function named(klass, name) {
  Object.defineProperty(klass, 'name', { value: name })
  return klass
}

// new XError(code, message, statusCode = defaultStatus)
export function defineRequestError(name, defaultStatus = 422) {
  return named(class extends Error {
    constructor(code, message, statusCode = defaultStatus) {
      super(message)
      this.name = name
      this.code = code
      this.statusCode = statusCode
    }
  }, name)
}

// new XError(message, { code, statusCode }); `parent` makes the class a subclass
// of another problem error (its constructor receives the merged options).
export function defineProblemError(name, { statusCode, code, parent = Error }) {
  return named(class extends parent {
    constructor(message, options = {}) {
      const merged = { statusCode: options.statusCode ?? statusCode, code: options.code ?? code }
      super(message, merged)
      this.name = name
      this.statusCode = merged.statusCode
      this.code = merged.code
    }
  }, name)
}
