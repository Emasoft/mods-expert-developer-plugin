// Pure decisions for protect-files. No `$` here: register.ts does every API call.

/** Store key: boolean. A missing key means enabled (default ON). */
export const ENABLED_KEY = 'protect-files.enabled'
/** Store key: string[] of normalised protected paths. A missing key means an empty list. */
export const PATHS_KEY = 'protect-files.paths'

export const SWITCH_USAGE = 'usage: /protect-files [on|off]'
export const PATHS_USAGE = 'usage: /protect-files-paths add <path> | remove <path> | list'
export const DAMAGED_LIST_TEXT =
  'protect-files: the stored list is damaged, so it was left unchanged. Delete the protect-files.paths key from the plugin store to reset it.'

/**
 * Normalises a path for comparison. It DOES: turn backslashes into slashes,
 * collapse repeated slashes, drop `.` segments (so `./a` is `a`), resolve `..`
 * segments, and drop trailing slashes. It does NOT: follow symlinks, fold case,
 * expand `~` or globs, handle Windows drive letters, or make a relative path
 * absolute (this file never sees the working directory).
 */
export function normalizePath(raw: string): string {
  const slashed = raw.replace(/\\/g, '/')
  const isAbsolute = slashed.startsWith('/')
  const out: string[] = []
  for (const part of slashed.split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') {
      // A `..` above the root stays at the root; above a relative start it is kept.
      if (out.length > 0 && out[out.length - 1] !== '..') out.pop()
      else if (!isAbsolute) out.push('..')
      continue
    }
    out.push(part)
  }
  return (isAbsolute ? '/' : '') + out.join('/')
}

function hasPrefixAt(parts: readonly string[], prefix: readonly string[], from: number): boolean {
  if (from + prefix.length > parts.length) return false
  return prefix.every((p, k) => parts[from + k] === p)
}

/**
 * An absolute entry protects itself and everything below it. A relative entry
 * protects the same segments wherever they appear in the target path, because
 * the target is normally absolute and the working directory is unknown here.
 * Matching is by whole segments: entry `src` does not protect `src2/a.ts`.
 */
export function isProtected(target: string, entries: readonly string[]): boolean {
  const t = normalizePath(target)
  const targetParts = t.split('/').filter((s) => s !== '')
  for (const entry of entries) {
    const n = normalizePath(entry)
    if (n === '' || n === '/') return true // an empty or root entry protects everything
    const entryParts = n.split('/').filter((s) => s !== '')
    if (n.startsWith('/')) {
      if (t.startsWith('/') && hasPrefixAt(targetParts, entryParts, 0)) return true
      continue
    }
    for (let i = 0; i + entryParts.length <= targetParts.length; i++) {
      if (hasPrefixAt(targetParts, entryParts, i)) return true
    }
  }
  return false
}

/**
 * The stored list as strings: a missing key is an empty list. Anything that is not a string array
 * is undefined (damaged), and so is a list holding a relative entry whose normalised form starts
 * with `..`: it can never match (a target path is absolute and normalised), so it would claim a
 * protection that is not there. `/..` is not such an entry: it normalises to `/`.
 */
export function readList(stored: unknown): string[] | undefined {
  if (stored === undefined) return []
  if (!Array.isArray(stored) || !stored.every((x) => typeof x === 'string')) return undefined
  const neverMatches = (x: string): boolean => {
    const n = normalizePath(x)
    return !n.startsWith('/') && n.split('/')[0] === '..'
  }
  if (stored.some(neverMatches)) return undefined
  return stored
}

/**
 * Returns the refusal text, or undefined when the call may go on. Fails closed:
 * a missing or non-string target, a stored list that is not a list of strings, or a
 * relative target while an absolute entry exists (it cannot be compared) is refused
 * rather than waved through.
 */
export function checkTarget(target: unknown, stored: unknown): string | undefined {
  if (typeof target !== 'string' || target === '') {
    return 'protect-files: this call has no file path, so it was not allowed'
  }
  const entries = readList(stored)
  if (entries === undefined) {
    return 'protect-files: the protected list is damaged, so this call was not allowed'
  }
  // A relative target cannot be checked against an absolute entry: the working directory is unknown here.
  if (!normalizePath(target).startsWith('/') && entries.some((x) => normalizePath(x).startsWith('/'))) {
    return `protect-files: ${target} is a relative path, which cannot be checked against absolute entries, so this call was not allowed`
  }
  if (isProtected(target, entries)) {
    return `protect-files: ${target} is protected. Ask the user to run /protect-files off or /protect-files-paths remove first.`
  }
  return undefined
}

export type SwitchResult = { enabled: boolean } | { usage: string }

/** `/protect-files` toggles, `on` and `off` set, anything else answers usage. */
export function parseSwitch(args: string, current: boolean): SwitchResult {
  const word = args.trim().toLowerCase()
  if (word === '') return { enabled: !current }
  if (word === 'on') return { enabled: true }
  if (word === 'off') return { enabled: false }
  return { usage: SWITCH_USAGE }
}

/** A result with no `paths` is an answer only: the caller must not touch the store. */
export type ManageResult = { paths: string[]; text: string } | { text: string } | { usage: string }

/** `/protect-files-paths add|remove <path>` and `list`. */
export function parseManage(args: string, current: readonly string[]): ManageResult {
  const trimmed = args.trim()
  const space = trimmed.search(/\s/)
  const verb = (space === -1 ? trimmed : trimmed.slice(0, space)).toLowerCase()
  const rest = space === -1 ? '' : trimmed.slice(space).trim()
  if (verb === 'list' && rest === '') {
    // Text only, no paths: the caller must not write the list back on a read-only command.
    return { text: current.length === 0 ? 'No protected paths' : current.join('\n') }
  }
  if ((verb !== 'add' && verb !== 'remove') || rest === '') return { usage: PATHS_USAGE }
  const entry = normalizePath(rest)
  if (entry === '') return { usage: PATHS_USAGE }
  // Refused, not stored: an entry that starts with .. never matches, because a target path is
  // absolute and normalised, so storing it would tell the user a file is protected when it is not.
  if (verb === 'add' && entry.split('/')[0] === '..') {
    return { text: `${entry} cannot be protected: a relative path that starts with .. never matches a file path` }
  }
  if (verb === 'add') {
    if (current.includes(entry)) return { paths: [...current], text: `${entry} is already protected` }
    return { paths: [...current, entry], text: `Protected ${entry}` }
  }
  if (!current.includes(entry)) return { paths: [...current], text: `${entry} was not in the list` }
  return { paths: current.filter((p) => p !== entry), text: `Unprotected ${entry}` }
}
