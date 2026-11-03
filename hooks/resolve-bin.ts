// The one resolver of external programs for every mod of this plugin (TRDD-GF5UDFWI, Both
// environments). The Desktop app does not inherit the shell's PATH, so a program is never looked up
// on PATH: it is the first file found in a fixed list of absolute candidates. Answers are cached per
// session. Only claude has a Windows location (forward slashes, never run on Windows: the tests check
// the candidate string only); tmux, python3 and git have macOS and Linux locations only and no
// configured path. The versions-folder candidate is used only when the ~/.local/bin link is missing or
// broken, and it picks the newest version, ignoring a deliberate pin. The plugin's claudePath setting (its
// userConfig, passed in through configureBins) replaces the whole list for claude; tmux, python3 and git
// have no setting. The Windows candidate mixes separators when USERPROFILE holds backslashes (untested).
import type { EngineInterface } from 'claude-code'

export const BINARIES = ['claude', 'tmux', 'python3', 'git'] as const
export type Binary = (typeof BINARIES)[number]

const SYSTEM_DIRS = ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin']

/** Where `name` may be, in the order it is looked for: the user's own folders first, then the system's. */
export function candidatesFor(name: Binary, home: string | undefined, userProfile?: string, newest?: string): string[] {
  const hasHome = home !== undefined && home !== ''
  const isClaude = name === 'claude'
  const own = hasHome ? [`${home}/.local/bin/${name}`] : []
  // The native installer keeps each version as one file under versions/; the ~/.local/bin link points at the newest.
  const versioned = isClaude && hasHome && newest !== undefined ? [`${home}/.local/share/claude/versions/${newest}`] : []
  const extra = isClaude && hasHome ? [`${home}/.claude/local/claude`, `${home}/.npm-global/bin/claude`] : []
  const system = SYSTEM_DIRS.map((dir) => `${dir}/${name}`)
  // Windows native install; a full path, since it is a different file name from the other candidates.
  const windows = isClaude && userProfile !== undefined && userProfile !== '' ? [`${userProfile}/.local/bin/claude.exe`] : []
  return [...own, ...versioned, ...extra, ...system, ...windows]
}

/** The highest x.y.z among `names`, compared number by number; any other name (latest, 2.1, 2.2.0-beta) is ignored. */
export function newestVersion(names: readonly string[]): string | undefined {
  const parse = (name: string) => name.split('.').map(Number)
  const isNewer = (a: string, b: string) => {
    const [pa, pb] = [parse(a), parse(b)]
    const i = pa.findIndex((n, k) => n !== pb[k])
    return i !== -1 && pa[i]! > pb[i]!
  }
  let best: string | undefined
  for (const name of names) {
    if (/^\d+\.\d+\.\d+$/.test(name) && (best === undefined || isNewer(name, best))) best = name
  }
  return best
}

/** The first candidate `isFile` accepts, or undefined. */
export async function firstFile(candidates: readonly string[], isFile: (path: string) => Promise<boolean>): Promise<string | undefined> {
  for (const path of candidates) {
    if (await isFile(path)) return path
  }
  return undefined
}

const cacheBySession = new Map<string, Map<Binary, string>>()

let configuredClaude: string | undefined

/**
 * Sets the claude path from the plugin settings (empty or missing = not configured). It also empties
 * the cache, so an answer cached under an old setting cannot outlive a new one if register runs again on
 * the same module. No test covers this: the test kit loads a fresh module for each test, so the cache
 * cannot be observed.
 */
export function configureBins(paths: { claude?: string }): void {
  const claude = paths.claude?.trim()
  configuredClaude = claude === undefined || claude === '' ? undefined : claude
  cacheBySession.clear()
}

/**
 * The absolute path of `name`. Rejects with every place it looked when none holds the program, so
 * the person can see why a feature is missing and where to install it.
 */
export async function resolveBin($: EngineInterface, name: Binary): Promise<string> {
  const session = await $.session.id()
  const cached = cacheBySession.get(session)?.get(name)
  if (cached !== undefined) return cached
  // A configured claude path is the ONLY candidate: a wrong setting must stay visible, never be
  // silently replaced by another claude that happens to be installed elsewhere.
  const configured = name === 'claude' ? configuredClaude : undefined
  // ~ is not expanded and a relative path would resolve against the session's working folder, so it
  // would look like "not found" for a path that seems right: refuse it before any file-system call.
  if (configured !== undefined && !configured.startsWith('/') && !/^[A-Za-z]:[\\/]/.test(configured)) {
    throw new Error(`claudePath must be an absolute path, not ${configured} (the claudePath setting)`)
  }
  const home = await $.env.get('HOME')
  let newest: string | undefined
  if (configured === undefined && name === 'claude' && home !== undefined && home !== '') {
    const dir = `${home}/.local/share/claude/versions`
    // The docs do not say what $.fs.list does on a missing folder, so it runs only on one that exists.
    if (await $.fs.exists(dir)) {
      newest = newestVersion((await $.fs.list(dir)).filter((entry) => entry.kind === 'file').map((entry) => entry.name))
    }
  }
  const candidates = configured !== undefined ? [configured] : candidatesFor(name, home, name === 'claude' ? await $.env.get('USERPROFILE') : undefined, newest)
  // stat follows links, so a symlinked install (~/.local/bin/claude) counts by what it points at.
  const found = await firstFile(candidates, async (path) => (await $.fs.exists(path)) && (await $.fs.stat(path)).kind === 'file')
  if (found === undefined) throw new Error(`${name} was not found; looked in ${candidates.join(', ')}${configured !== undefined ? ' (the claudePath setting)' : ''}`)
  const forSession = cacheBySession.get(session) ?? new Map<Binary, string>()
  forSession.set(name, found)
  cacheBySession.set(session, forSession)
  return found
}
