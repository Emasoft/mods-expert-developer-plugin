// The one resolver of external programs for every mod of this plugin (TRDD-GF5UDFWI, Both
// environments). The Desktop app does not inherit the shell's PATH, so a program is never looked up
// on PATH: it is the first file found in a fixed list of absolute candidates. Answers are cached per
// session. Known gap: the lists cover macOS and Linux only; no Windows locations yet.
import type { EngineInterface } from 'claude-code'

export const BINARIES = ['claude', 'tmux', 'python3', 'git'] as const
export type Binary = (typeof BINARIES)[number]

const SYSTEM_DIRS = ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin']

/** Where `name` may be, in the order it is looked for: the user's own folders first, then the system's. */
export function candidatesFor(name: Binary, home: string | undefined): string[] {
  const own = home === undefined || home === '' ? [] : [`${home}/.local/bin`]
  const extra = name === 'claude' && own.length > 0 ? [`${home}/.claude/local`, `${home}/.npm-global/bin`] : []
  return [...own, ...extra, ...SYSTEM_DIRS].map((dir) => `${dir}/${name}`)
}

/** The first candidate `isFile` accepts, or undefined. */
export async function firstFile(candidates: readonly string[], isFile: (path: string) => Promise<boolean>): Promise<string | undefined> {
  for (const path of candidates) {
    if (await isFile(path)) return path
  }
  return undefined
}

const cacheBySession = new Map<string, Map<Binary, string>>()

/**
 * The absolute path of `name`. Rejects with every place it looked when none holds the program, so
 * the person can see why a feature is missing and where to install it.
 */
export async function resolveBin($: EngineInterface, name: Binary): Promise<string> {
  const session = await $.session.id()
  const cached = cacheBySession.get(session)?.get(name)
  if (cached !== undefined) return cached
  const candidates = candidatesFor(name, await $.env.get('HOME'))
  // stat follows links, so a symlinked install (~/.local/bin/claude) counts by what it points at.
  const found = await firstFile(candidates, async (path) => (await $.fs.exists(path)) && (await $.fs.stat(path)).kind === 'file')
  if (found === undefined) throw new Error(`${name} was not found; looked in ${candidates.join(', ')}`)
  const forSession = cacheBySession.get(session) ?? new Map<Binary, string>()
  forSession.set(name, found)
  cacheBySession.set(session, forSession)
  return found
}
