// mod-manager (TRDD-J4HRAQF0, increment 1): the pure decisions of the installed-plugins pane. The calls
// into claude and the file system live in ./cli.ts; the session state and the confirmed actions in
// ./state.ts; the drawing in ./pane.ts. This file only parses, classifies, orders and builds argument
// vectors and the confirm rule, so every rule runs without an engine.

export const COMMAND = 'mod-manager'
export const PANE = 'mod-manager'
/** A plugin id as `name@marketplace`, lowercase. Checked before any id reaches an argument vector. */
export const PLUGIN_ID = /^[a-z0-9][a-z0-9._-]*@[a-z0-9._-]+$/
const SCOPES = ['user', 'project', 'local'] as const
export type Scope = (typeof SCOPES)[number]
export type Action = 'enable' | 'disable' | 'uninstall'

/** One entry of `claude plugin list --json`: one per plugin id and scope. */
export type Installed = {
  id: string
  version: string | undefined
  scope: Scope
  enabled: boolean
  installPath: string
  projectPath: string | undefined
}

/** An installed entry that applies in this session, with what the pane shows of it. */
export type Row = Installed & { name: string; marketplace: string; isMod: boolean }

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error))

const isScope = (value: unknown): value is Scope => typeof value === 'string' && (SCOPES as readonly string[]).includes(value)

/** Reads `claude plugin list --json`. A shape it does not expect is an error, never a guess. */
export function parseInstalled(text: string): Installed[] {
  const data: unknown = JSON.parse(text)
  if (!Array.isArray(data)) throw new Error('claude plugin list --json did not answer a list')
  return data.map((item: unknown, index: number) => {
    const entry = (typeof item === 'object' && item !== null ? item : {}) as Record<string, unknown>
    if (typeof entry.id !== 'string' || typeof entry.installPath !== 'string' || typeof entry.enabled !== 'boolean' || !isScope(entry.scope)) {
      throw new Error(`entry ${index} of the plugin list has an unexpected shape`)
    }
    return {
      id: entry.id,
      version: typeof entry.version === 'string' ? entry.version : undefined,
      scope: entry.scope,
      enabled: entry.enabled,
      installPath: entry.installPath,
      projectPath: typeof entry.projectPath === 'string' ? entry.projectPath : undefined,
    }
  })
}

/** True when `dir` is `root` or inside it. */
export function isWithin(dir: string, root: string): boolean {
  const base = root.replace(/\/+$/, '')
  return dir === base || dir.startsWith(`${base}/`)
}

/** A user entry applies everywhere; a project or local one only in the folder it was installed for. */
export function appliesHere(entry: Installed, sessionRoot: string): boolean {
  if (entry.scope === 'user') return true
  return entry.projectPath !== undefined && isWithin(sessionRoot, entry.projectPath)
}

/** True when a `modules` value is a non-empty list: the one test a hooks file and an inline hooks object share. */
const listsModules = (modules: unknown): boolean => Array.isArray(modules) && modules.length > 0

/**
 * A hooks file is a mod file when it lists one or more modules. A file that is not JSON is not a mod file either,
 * and the problem is returned so the caller can log it.
 */
export function classifyHooks(text: string): { isMod: boolean; problem: string | undefined } {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (error) {
    return { isMod: false, problem: `not JSON (${messageOf(error)})` }
  }
  const modules = typeof data === 'object' && data !== null ? (data as { modules?: unknown }).modules : undefined
  return { isMod: listsModules(modules), problem: undefined }
}

/** The hooks file every plugin is checked for, relative to its install folder, whether or not its manifest names it. */
export const DEFAULT_HOOKS_FILE = 'hooks/hooks.json'

/** What a plugin's manifest says about where its hooks are, as hookFilesOf reads it. */
export type HookFiles = {
  /** Paths relative to the plugin folder to check: the default file first, then each string path the manifest declares. */
  paths: string[]
  /** The manifest declares its hooks inline, and that object lists one or more modules. */
  inlineIsMod: boolean
  /** Declared paths refused because they are absolute or contain "..": never read, returned so the caller can log them. */
  rejected: string[]
  /** Why the manifest text is not a JSON value. Then only the default file is checked. */
  problem: string | undefined
}

/**
 * Which hooks files of a plugin to check, given the text of its `.claude-plugin/plugin.json`. Undefined means the manifest
 * could not be read, and then only the default file is checked. A declared path loses a leading "./" and is listed once.
 * A declared path that is absolute or contains ".." would reach outside the plugin, so it is refused, not read.
 */
export function hookFilesOf(manifestText: string | undefined): HookFiles {
  const paths = [DEFAULT_HOOKS_FILE]
  const rejected: string[] = []
  if (manifestText === undefined) return { paths, inlineIsMod: false, rejected, problem: undefined }
  let data: unknown
  try {
    data = JSON.parse(manifestText)
  } catch (error) {
    return { paths, inlineIsMod: false, rejected, problem: `not JSON (${messageOf(error)})` }
  }
  const hooks = typeof data === 'object' && data !== null ? (data as { hooks?: unknown }).hooks : undefined
  const declared = typeof hooks === 'string' ? [hooks] : Array.isArray(hooks) ? hooks : []
  for (const item of declared) {
    if (typeof item !== 'string') continue
    const relative = item.replace(/^\.\//, '')
    if (/^(\/|\\|[A-Za-z]:)/.test(relative) || relative.includes('..')) rejected.push(item)
    else if (!paths.includes(relative)) paths.push(relative)
  }
  const isInlineObject = typeof hooks === 'object' && hooks !== null && !Array.isArray(hooks)
  return { paths, inlineIsMod: isInlineObject && listsModules((hooks as { modules?: unknown }).modules), rejected, problem: undefined }
}

export function toRow(entry: Installed, isMod: boolean): Row {
  const at = entry.id.indexOf('@')
  const name = at < 0 ? entry.id : entry.id.slice(0, at)
  const marketplace = at < 0 ? '' : entry.id.slice(at + 1)
  return { ...entry, name, marketplace, isMod }
}

const compareText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)

/**
 * Mods first: the enabled mods, then the disabled mods. Then the other plugins: enabled, then disabled. Each of
 * the four groups is sorted by name, then id, then scope.
 */
export function orderRows(rows: readonly Row[]): Row[] {
  return [...rows].sort(
    (a, b) =>
      Number(b.isMod) - Number(a.isMod) ||
      Number(b.enabled) - Number(a.enabled) ||
      compareText(a.name, b.name) ||
      compareText(a.id, b.id) ||
      compareText(a.scope, b.scope),
  )
}

/**
 * The argument vector of one action on one row. The id is checked against PLUGIN_ID first, so an id that
 * could be read as a flag or a path never reaches claude, and the scope is always named.
 */
export function actionArgv(claude: string, action: Action, row: { id: string; scope: Scope }): string[] {
  if (!PLUGIN_ID.test(row.id)) throw new Error(`refused: "${row.id}" is not a plugin id (name@marketplace)`)
  return [claude, 'plugin', action, row.id, '--scope', row.scope]
}

export const KEEP = 'Keep it as it is'

/** The label the person must pick for an action to run. Any other answer, or none, runs nothing. */
export function confirmLabel(action: Action): string {
  return { enable: 'Turn it on', disable: 'Turn it off', uninstall: 'Uninstall it' }[action]
}

/** True only for the confirm label of this action: the one answer that lets it run. Any other answer runs nothing. */
export function isConfirmed(answer: string, action: Action): boolean {
  return answer === confirmLabel(action)
}

/** How a confirm question ended: the action ran, the answer was not its confirm label, or the question was dismissed. */
export type ConfirmOutcome = 'ran' | 'declined' | 'dismissed'

/**
 * Asks once and runs the action only when the answer is its confirm label; any other answer runs nothing, and a
 * rejected ask (a dismissed question) runs nothing. The ask and the run are plain functions, so a test drives this
 * same rule with plain answers. confirmAndAct passes the engine's question as the ask: that is a seam, not a mock
 * of the engine.
 */
export async function confirmThenRun(action: Action, ask: () => Promise<string>, run: () => Promise<void>): Promise<ConfirmOutcome> {
  let answer: string
  try {
    answer = await ask()
  } catch {
    return 'dismissed'
  }
  if (!isConfirmed(answer, action)) return 'declined'
  await run()
  return 'ran'
}

const EFFECT: Record<Action, string> = {
  enable: 'It loads in your next session.',
  disable: 'It stops loading in your next session.',
  uninstall: 'Its files and its saved data are removed.',
}

export function questionFor(action: Action, row: Row): string {
  return `${confirmLabel(action)}: ${row.name} (${row.scope} scope)? ${EFFECT[action]}`
}

const DONE: Record<Action, string> = { enable: 'turned on', disable: 'turned off', uninstall: 'uninstalled' }

export function doneText(action: Action, row: Row): string {
  return `${row.name} ${DONE[action]}. Applies in your next session.`
}

/** A label cut to `room` characters, the last one an ellipsis, so a narrow surface never draws past its column. */
export function fitLabel(label: string, room: number): string {
  if (label.length <= room) return label
  return room < 2 ? '' : `${label.slice(0, room - 1)}…`
}
