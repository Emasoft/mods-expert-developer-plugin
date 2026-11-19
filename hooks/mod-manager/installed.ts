// installed_plugins.json, Claude Code's own record of plugin installs, read by the mod-manager profiles (TRDD-GSR975M8,
// increment P1b of design/specs/mod-manager-profiles.md, section 2.4). Pure: the read itself is in ./files.ts.
//
// The file's format is UNDOCUMENTED. The plugin loading chapter says only that it "records each install with its scope,
// installPath, and version" (mods-doc-tracing-the-origin-of-a-plugin, line 47). The shape read here was measured once, on
// Claude Code 2.1.316 (2026-10-31): { version: 2, plugins: { <id>: [ { scope, installPath, version, installedAt,
// lastUpdated, ... } ] } }. So the parser is strict on purpose. A file whose version is not 2 is refused as a whole, a
// deliberate fail-fast: a new format read as if it were the old one could turn the wrong plugins on or off. An entry of
// a shape it does not expect is named with the reason and never guessed at, and the other entries are still read, as
// parseInstalled in ./logic.ts does for `claude plugin list --json`.

/** The only format version this parser reads (measured, see above). */
export const INSTALLED_FORMAT_VERSION = 2

/** One install of one plugin id, as installed_plugins.json records it. The stamps are kept for the re-apply step (P4). */
export type FileInstall = {
  id: string
  scope: string
  installPath: string
  version?: string
  installedAt?: string
  lastUpdated?: string
  projectPath?: string
}

/** An install record that is not read: its plugin id, its place in that id's list (none when the list is not a list), and why. */
export type InstallRejected = { id: string; index: number | undefined; reason: string }

export type InstalledFile = { installs: FileInstall[]; rejected: InstallRejected[] }

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error))
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const textOf = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined)

/**
 * Reads installed_plugins.json. Throws, with the reason, for a text that is not JSON, not an object, of another version,
 * or with no plugins object: the whole file is refused. Each install record of an unexpected shape goes to `rejected`.
 */
export function parseInstalledFile(text: string): InstalledFile {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (error) {
    throw new Error(`installed_plugins.json is not JSON (${messageOf(error)})`)
  }
  if (!isRecord(data)) throw new Error('installed_plugins.json is not a JSON object')
  if (data.version !== INSTALLED_FORMAT_VERSION) {
    throw new Error(`installed_plugins.json has format version ${JSON.stringify(data.version)}; this mod reads version ${INSTALLED_FORMAT_VERSION} only, so it reads nothing rather than guess`)
  }
  if (!isRecord(data.plugins)) throw new Error('installed_plugins.json has no "plugins" object')
  const installs: FileInstall[] = []
  const rejected: InstallRejected[] = []
  for (const [id, list] of Object.entries(data.plugins)) {
    if (!Array.isArray(list)) {
      rejected.push({ id, index: undefined, reason: 'its installs are not a list' })
      continue
    }
    list.forEach((item: unknown, index: number) => {
      if (!isRecord(item)) {
        rejected.push({ id, index, reason: 'it is not an object' })
        return
      }
      const { scope, installPath } = item
      if (typeof scope !== 'string' || typeof installPath !== 'string') {
        const reasons = [...(typeof scope === 'string' ? [] : ['scope is not a string']), ...(typeof installPath === 'string' ? [] : ['installPath is not a string'])]
        rejected.push({ id, index, reason: reasons.join('; ') })
        return
      }
      const optional = { version: textOf(item.version), installedAt: textOf(item.installedAt), lastUpdated: textOf(item.lastUpdated), projectPath: textOf(item.projectPath) }
      const present = Object.fromEntries(Object.entries(optional).filter(([, value]) => value !== undefined))
      installs.push({ id, scope, installPath, ...present })
    })
  }
  return { installs, rejected }
}
