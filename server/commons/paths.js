import { isAbsolute, relative, sep } from 'node:path'

// True when `child` is `parent` or lies beneath it (lexically).
export function inside(parent, child) {
  const path = relative(parent, child)
  return path === '' || (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path))
}
