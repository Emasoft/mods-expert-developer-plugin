// mod-manager (TRDD-J4HRAQF0, increment 1): the pure decisions of the installed-plugins pane. The calls
// into claude and the file system live in ./cli.ts; the session state and the confirmed actions in
// ./state.ts; the drawing in ./pane.ts. This file only parses, classifies, orders and builds argument
// vectors and the confirm rule, so every rule runs without an engine.

export const COMMAND = 'mod-manager'
export const PANE = 'mod-manager'
/** A plugin id as `name@marketplace`, lowercase. Checked before any id reaches an argument vector. */
export const PLUGIN_ID = /^[a-z0-9][a-z0-9._-]*@[a-z0-9._-]+$/
/**
 * Every scope `claude plugin list --json` reports (plugin commands chapter, line 337): user, project, local or managed
 * for installs; user or project for skills-directory plugins (id `<name>@skills-dir`); session for session-only plugins
 * (`<name>@inline`); synced for plugins synced from claude.ai (`<name>@synced`). Claude Code 2.1.316 lists synced
 * entries, and when only the first three were known, one synced entry made the whole list unreadable.
 */
const SCOPES = ['user', 'project', 'local', 'managed', 'session', 'synced'] as const
export type Scope = (typeof SCOPES)[number]
export type Action = 'enable' | 'disable' | 'uninstall'

/** One entry of `claude plugin list --json`: one per plugin id and scope. */
export type Installed = {
  id: string
  version: string | undefined
  scope: Scope
  enabled: boolean
  installPath: string
  /**
   * The plugin's source folder when sessions load it in place from its marketplace's folder; its installPath is then not
   * the folder it loads from (plugin commands chapter, lines 339 and 340).
   */
  readFromFolder: string | undefined
  projectPath: string | undefined
}

/** An installed entry that applies in this session, with what the pane shows of it. */
export type Row = Installed & { name: string; marketplace: string; isMod: boolean }

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error))

const isScope = (value: unknown): value is Scope => typeof value === 'string' && (SCOPES as readonly string[]).includes(value)

/** An entry of the list that is not shown: its place in the list (from 0), its id when it has one, and why. */
export type Rejected = { index: number; id: string | undefined; reason: string }

/** What parseInstalled read: the entries it understood, and each entry it did not, by index and reason. */
export type InstalledList = { entries: Installed[]; rejected: Rejected[] }

/**
 * Reads `claude plugin list --json`. An answer that is not a list is an error. An entry of a shape it does not expect
 * is never guessed at: it goes to `rejected` with its index and the reason, and the other entries are still read, so
 * one entry that a newer claude adds cannot blank the pane.
 */
export function parseInstalled(text: string): InstalledList {
  const data: unknown = JSON.parse(text)
  if (!Array.isArray(data)) throw new Error('claude plugin list --json did not answer a list')
  const entries: Installed[] = []
  const rejected: Rejected[] = []
  data.forEach((item: unknown, index: number) => {
    if (typeof item !== 'object' || item === null) {
      rejected.push({ index, id: undefined, reason: 'it is not an object' })
      return
    }
    const { id, scope, enabled, installPath, version, readFromFolder, projectPath } = item as Record<string, unknown>
    if (typeof id === 'string' && isScope(scope) && typeof enabled === 'boolean' && typeof installPath === 'string') {
      entries.push({
        id,
        version: typeof version === 'string' ? version : undefined,
        scope,
        enabled,
        installPath,
        readFromFolder: typeof readFromFolder === 'string' ? readFromFolder : undefined,
        projectPath: typeof projectPath === 'string' ? projectPath : undefined,
      })
      return
    }
    const reasons = [
      ...(typeof id === 'string' ? [] : ['id is not a string']),
      ...(isScope(scope) ? [] : [scope === undefined ? 'scope is missing' : `scope ${JSON.stringify(scope)} is not one of ${SCOPES.join(', ')}`]),
      ...(typeof enabled === 'boolean' ? [] : ['enabled is not true or false']),
      ...(typeof installPath === 'string' ? [] : ['installPath is not a string']),
    ]
    rejected.push({ index, id: typeof id === 'string' ? id : undefined, reason: reasons.join('; ') })
  })
  return { entries, rejected }
}

/** Each control character (C0, DEL, C1) as "?", so text read from the list never moves the terminal's cursor or colours. */
const printable = (text: string): string => text.replace(/\p{Cc}/gu, '?')

/** How the pane and the log name an entry that is not shown: its index in the list, its id when it has one, and why. */
export function rejectedText(entry: Rejected): string {
  return `Entry ${entry.index} of the plugin list${entry.id === undefined ? '' : ` (${printable(entry.id)})`} is not shown: ${printable(entry.reason)}.`
}

/** How many entries that could not be read the pane names, and the room for each reason (a quoted scope can be any length). */
const REJECTED_SHOWN = 5
const REASON_ROOM = 80

/**
 * The pane's lines for the entries that could not be read: the first REJECTED_SHOWN, each reason cut to REASON_ROOM,
 * then one line that counts the rest. The debug log names every entry in full (rejectedText), so a list of many
 * entries of an unknown shape cannot push the rows out of the pane.
 */
export function rejectedLines(rejected: readonly Rejected[]): string[] {
  const shown = rejected.slice(0, REJECTED_SHOWN).map((entry) => rejectedText({ ...entry, reason: fitLabel(entry.reason, REASON_ROOM) }))
  const more = rejected.length - shown.length
  return more === 0 ? shown : [...shown, `and ${more} more, ${more === 1 ? 'named' : 'each named'} in the debug log.`]
}

/** True when `dir` is `root` or inside it. */
export function isWithin(dir: string, root: string): boolean {
  const base = root.replace(/\/+$/, '')
  return dir === base || dir.startsWith(`${base}/`)
}

/**
 * Which scopes apply everywhere. user, managed and synced entries apply in every folder, and a session entry to this
 * session. A project or local entry applies only in or under the folder it was installed for. A skills-directory plugin
 * reports user or project, and is read as that scope.
 */
const APPLIES_EVERYWHERE: Record<Scope, boolean> = { user: true, managed: true, synced: true, session: true, project: false, local: false }

export function appliesHere(entry: Installed, sessionRoot: string): boolean {
  if (APPLIES_EVERYWHERE[entry.scope]) return true
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

/**
 * The folder whose manifest and hooks files say whether a plugin is a mod: its readFromFolder when sessions load it in
 * place, because its installPath is then not the folder it loads from (plugin commands chapter, lines 339 and 340);
 * otherwise its installPath.
 */
export function modFolder(entry: { installPath: string; readFromFolder: string | undefined }): string {
  return entry.readFromFolder ?? entry.installPath
}

export function toRow(entry: Installed, isMod: boolean): Row {
  const at = entry.id.indexOf('@')
  const name = at < 0 ? entry.id : entry.id.slice(0, at)
  // An id with no @ gets the group name here, so the pane shows and groups by the same real value.
  const marketplace = at < 0 ? NO_MARKETPLACE : entry.id.slice(at + 1)
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

/** The marketplace of a row whose id has no @. */
export const NO_MARKETPLACE = '(no marketplace)'

/**
 * The key of the section holding every enabled row. It contains a space, which a marketplace name (kebab-case) and
 * NO_MARKETPLACE (which starts with a parenthesis) cannot equal, so it never collides with a marketplace key.
 */
export const ENABLED_KEY = 'all enabled'

/** One section of the pane: the key its header button and its expanded state use, the header label, and its rows. */
export type Section = { key: string; label: string; rows: Row[] }

/**
 * The pane's sections, so that one global order holds: first "Enabled" with every enabled row of every marketplace in
 * orderRows order (mods first), then one section per marketplace, by marketplace name, with only that marketplace's
 * disabled rows. A row is in exactly one section. The count comes first in each label, so fitLabel cuts the name.
 */
export function sectionsOf(rows: readonly Row[]): Section[] {
  const ordered = orderRows(rows)
  const enabled = ordered.filter((row) => row.enabled)
  const off = new Map<string, Row[]>()
  for (const row of ordered.filter((member) => !member.enabled)) off.set(row.marketplace, [...(off.get(row.marketplace) ?? []), row])
  return [
    ...(enabled.length === 0 ? [] : [{ key: ENABLED_KEY, label: `${enabled.length} enabled`, rows: enabled }]),
    ...[...off.entries()]
      .sort(([a], [b]) => compareText(a, b))
      .map(([marketplace, members]) => ({ key: marketplace, label: `${members.length} off · ${marketplace}`, rows: members })),
  ]
}

/**
 * True when a filter forces every section drawn open: only when the trimmed filter has 2 or more characters. One
 * letter matches nearly every row, and forcing every section open would redraw almost all of ~500 rows on the first
 * keystroke; with one character the rows are filtered but the sections keep the person's own expanded set.
 */
export const forcesOpen = (filter: string): boolean => filter.trim().length >= 2

/**
 * The rows a filter query keeps. The query is trimmed and split on whitespace; a row stays when EVERY term is found,
 * case-insensitively, in its name, its id or its marketplace. The one exception is a term that is exactly "mod": it
 * selects mods only (row.isMod) and is NOT also matched as a substring, so "mod" never lists a non-mod such as
 * "model-tools"; "model" is plain text. An empty query keeps every row, unchanged and in order.
 */
export function filterRows(rows: readonly Row[], query: string): Row[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter((term) => term !== '')
  if (terms.length === 0) return [...rows]
  return rows.filter((row) => {
    const haystack = [row.name, row.id, row.marketplace].map((text) => text.toLowerCase())
    return terms.every((term) => (term === 'mod' ? row.isMod : haystack.some((text) => text.includes(term))))
  })
}

/**
 * The actions offered for an entry of each scope. user, project and local take all three, by id and scope, except that a
 * skills-folder row (user or project) has no uninstall and is named by its id alone (see actionsFor and actionArgv).
 * synced takes enable and disable by `<name>@synced` (plugin commands chapter, lines 202 and 238) and is removed on
 * claude.ai, not uninstalled. session takes disable by `<name>@inline`, the only CLI form the docs give for it (line
 * 894). managed takes none: the organization installed it, and it cannot be enabled, disabled or uninstalled by the
 * person.
 */
const ACTIONS: Record<Scope, readonly Action[]> = {
  user: ['enable', 'disable', 'uninstall'],
  project: ['enable', 'disable', 'uninstall'],
  local: ['enable', 'disable', 'uninstall'],
  synced: ['enable', 'disable'],
  session: ['disable'],
  managed: [],
}

/** The scopes `--scope` takes (plugin commands chapter, line 43). A row of another scope is named by its id alone. */
const FLAG_SCOPES: readonly Scope[] = ['user', 'project', 'local']

/** The end of the id a row named by its id alone must have, as `claude plugin list --json` reports it (line 335). */
const ORIGIN: Partial<Record<Scope, string>> = { synced: '@synced', session: '@inline' }

/**
 * The id ending of a plugin loaded from a skills folder (plugin commands chapter, line 335). Claude Code reserves the
 * name skills-dir (marketplace manifest chapter, line 462), so no marketplace install has an id that ends this way.
 */
const SKILLS_DIR = '@skills-dir'
const isSkillsDir = (id: string): boolean => id.endsWith(SKILLS_DIR)

/**
 * The actions a row's buttons run: the toggle its state calls for when its scope offers it, then Uninstall when offered.
 * A row whose id PLUGIN_ID refuses gets none, because actionArgv would refuse each one. A skills-folder plugin gets no
 * Uninstall: Claude Code 2.1.316 refuses it ("it cannot be uninstalled. Delete the directory to remove it").
 */
export function actionsFor(row: { id: string; scope: Scope; enabled: boolean }): Action[] {
  if (!PLUGIN_ID.test(row.id)) return []
  const toggle: Action = row.enabled ? 'disable' : 'enable'
  return ACTIONS[row.scope].filter((action) => action === toggle || (action === 'uninstall' && !isSkillsDir(row.id)))
}

/**
 * The note under a row: why it draws no button, or, for a skills-folder plugin, which has no Uninstall, how to remove
 * it. Undefined for any other row that draws a button.
 */
export function lockedNote(row: { id: string; scope: Scope; enabled: boolean }): string | undefined {
  if (!PLUGIN_ID.test(row.id)) return 'No change is offered: its id is not a lowercase name@marketplace.'
  if (isSkillsDir(row.id)) return 'Loaded from a skills folder: delete its folder to remove it.'
  if (actionsFor(row).length > 0) return undefined
  if (row.scope === 'managed') return 'Managed by your organization: it cannot be changed here.'
  if (row.scope === 'session') return 'Loaded for this session only: turning it on is not offered here.'
  return `No change is offered for a ${row.scope} plugin.`
}

/**
 * The argument vector of one action on one row. The id is checked against PLUGIN_ID first, so an id that could be
 * read as a flag or a path never reaches claude, and an action the row's scope does not offer is refused. A
 * skills-folder plugin is named by its id alone and is never uninstalled. A user, project or local row names its scope.
 * A synced or session row is named by its id alone, which must be the documented form, because `--scope` takes no
 * other scope.
 */
export function actionArgv(claude: string, action: Action, row: { id: string; scope: Scope }): string[] {
  if (!PLUGIN_ID.test(row.id)) throw new Error(`refused: "${row.id}" is not a plugin id (name@marketplace)`)
  if (!ACTIONS[row.scope].includes(action)) throw new Error(`refused: ${action} is not offered for a ${row.scope} plugin`)
  if (isSkillsDir(row.id)) {
    if (action === 'uninstall') throw new Error('refused: uninstall is not offered for a skills-directory plugin')
    // The form the docs give (plugins-creation chapter, line 262): `claude plugin disable <name>@skills-dir`, with no
    // --scope. Claude Code 2.1.316 ran it, enable and disable, for a user-scope skills-folder plugin. For a project-scope
    // one this form is UNVERIFIED: a fresh config does not trust the project, and lists its skills folder as suppressed.
    return [claude, 'plugin', action, row.id]
  }
  if (FLAG_SCOPES.includes(row.scope)) return [claude, 'plugin', action, row.id, '--scope', row.scope]
  const origin = ORIGIN[row.scope]
  if (origin === undefined || !row.id.endsWith(origin)) throw new Error(`refused: "${row.id}" is not the documented id of a ${row.scope} plugin`)
  return [claude, 'plugin', action, row.id]
}

/**
 * The folder an action runs in. A project or local install is changed from the folder it was made in, because the CLI
 * resolves those scopes from there. A row of any other scope belongs to no folder (projectPath is documented for project
 * and local only, plugin commands chapter, line 344), so none is given even when an entry carries one: the scopes are
 * named, not "every scope but user", so a synced, session or managed row never runs in a folder it does not belong to.
 */
export function actionCwd(row: { scope: Scope; projectPath: string | undefined }): string | undefined {
  return row.scope === 'project' || row.scope === 'local' ? row.projectPath : undefined
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

/**
 * What a question adds for a scope whose change is not the whole story. A synced plugin is removed on claude.ai, not
 * here (install chapter, synced plugins). A disabled session-only copy lets the installed copy of the same name load
 * (plugin commands chapter, line 894).
 */
const SCOPE_NOTE: Partial<Record<Scope, string>> = {
  synced: ' It is synced from claude.ai: to remove it, turn it off there.',
  session: ' An installed copy with the same name, if there is one, loads instead.',
}

export function questionFor(action: Action, row: Row): string {
  return `${confirmLabel(action)}: ${row.name} (${row.scope} scope)? ${EFFECT[action]}${SCOPE_NOTE[row.scope] ?? ''}`
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
