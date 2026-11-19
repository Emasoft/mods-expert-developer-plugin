// mod-manager (TRDD-J4HRAQF0, increment 1): the pure decisions of the installed-plugins pane. The calls
// into claude and the file system live in ./cli.ts; the session state and the confirmed actions in
// ./state.ts; the drawing in ./pane.ts. This file only parses, classifies, orders and builds argument
// vectors and the confirm rule, and, for the profile list (TRDD-GSR975M8, increment P2a), builds its lines,
// so every rule runs without an engine.
import type { TextProps } from 'claude-code'

// The command is mods-manager (TRDD-ZQ0S5X07). The former name was registered by three plugins:
// this one, the plugin mod-manager@claude-mod-manager and mod-hub@owen-mods. The first registration
// wins and the others fail quietly. The mods- prefix follows the rule of this plugin: every command and skill
// starts with mods-. No alias, by the no-backward-compatibility rule: after the rename the former name opens
// whichever other plugin owns it.
export const COMMAND = 'mods-manager'
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
export type Action = 'enable' | 'disable' | 'update' | 'uninstall'

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
  /**
   * With readFromFolder, the plugin's version as Claude Code loaded it from that folder, which can differ from `version`
   * (plugin commands chapter, line 341): the version such a row loads (loadedVersion).
   */
  folderVersion: string | undefined
  projectPath: string | undefined
  /**
   * 2k: the errors claude lists for the plugin, set only when there is one: after an update whose new version depends on a
   * plugin built by a command, `Dependency ... is not installed` (measured on 2.1.318). A check pauses such a row (brokenReason).
   */
  errors?: string[]
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
    const { id, scope, enabled, installPath, version, readFromFolder, folderVersion, projectPath, errors } = item as Record<string, unknown>
    if (typeof id === 'string' && isScope(scope) && typeof enabled === 'boolean' && typeof installPath === 'string') {
      entries.push({
        id,
        version: typeof version === 'string' ? version : undefined,
        scope,
        enabled,
        installPath,
        readFromFolder: typeof readFromFolder === 'string' ? readFromFolder : undefined,
        folderVersion: typeof folderVersion === 'string' ? folderVersion : undefined,
        projectPath: typeof projectPath === 'string' ? projectPath : undefined,
        // 2k: set only when claude lists an error, so an entry with none keeps the shape it had before.
        ...(Array.isArray(errors) && errors.some((error) => typeof error === 'string') ? { errors: errors.filter((error): error is string => typeof error === 'string') } : {}),
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

/**
 * Each control character (C0, DEL, C1), each format character, each lone surrogate and each line or paragraph separator as
 * "?", so text from outside the pane (the list, the catalogs, claude's own error lines, a mod's notice) never moves the
 * terminal's cursor or colours, never reorders the text drawn beside it, and never hides text from the person that the
 * model still reads. The format characters (\p{Cf}) hold the bidirectional controls (U+061C, U+200E, U+200F, U+202A to
 * U+202E, U+2066 to U+2069), the zero-width characters (U+200B to U+200D, U+2060, U+FEFF) and the tag characters (U+E0001
 * to U+E007F), which can carry instructions the person does not see (orchestrator ruling on the review of d623b53). A '?',
 * not removal, so tampering stays visible; an emoji joined with U+200D shows as its parts with a '?' between them, an
 * accepted cost. So, mid-word, does a soft hyphen (U+00AD) and a zero-width non-joiner (U+200C, inside ordinary Persian
 * and Indic words), and a subdivision flag's tag sequence shows as '?' after its base flag: accepted costs too (orchestrator
 * on 181daee). The regex names the classes, so no invisible character sits in the source.
 */
export const printable = (text: string): string => text.replace(/[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}]/gu, '?')

/**
 * Text from outside shown on one line: every run of white space one space, every other control or direction mark a '?'
 * (printable), at most `max` code points, the last an ellipsis when cut. The cut counts code points, so a character
 * outside the BMP is kept whole or left out, never split into a lone surrogate. A mod's notice and a pause's reason are
 * shown through it (review of d623b53: a pause reason read from outside was shown whole).
 */
export function oneLine(raw: string, max: number): string {
  const line = printable(raw.replace(/\s+/g, ' ').trim())
  const points = Array.from(line)
  return points.length > max ? `${points.slice(0, max - 1).join('')}…` : line
}

/** How the pane and the log name an entry that is not shown: its index in the list, its id when it has one, and why. */
export function rejectedText(entry: Rejected): string {
  return `Entry ${entry.index} of the plugin list${entry.id === undefined ? '' : ` (${printable(entry.id)})`} is not shown: ${printable(entry.reason)}.`
}

/** How many problem lines the pane names before it counts the rest, and the room for each reason (a quoted scope can be any length). */
const LINES_SHOWN = 5
const REASON_ROOM = 80

/**
 * The first LINES_SHOWN of `lines`, then one line that counts the rest. Every caller logs each line in full to the
 * debug log, so many problems of one kind cannot push the rows out of the pane.
 */
export function cappedLines(lines: readonly string[]): string[] {
  const shown = lines.slice(0, LINES_SHOWN)
  const more = lines.length - shown.length
  return more === 0 ? shown : [...shown, `and ${more} more, ${more === 1 ? 'named' : 'each named'} in the debug log.`]
}

/**
 * The pane's lines for the entries that could not be read: the first LINES_SHOWN, each reason cut to REASON_ROOM,
 * then one line that counts the rest (cappedLines). The debug log names every entry in full (rejectedText).
 */
export function rejectedLines(rejected: readonly Rejected[]): string[] {
  return cappedLines(rejected.map((entry) => rejectedText({ ...entry, reason: fitLabel(entry.reason, REASON_ROOM) })))
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

/**
 * One section of the pane: the key its header button and its expanded state use, the header label, its rows, and, for a
 * marketplace section, what it shows of its marketplace's catalog (2f); `catalog` is undefined for the Enabled section.
 */
export type Section = { key: string; label: string; rows: Row[]; catalog: SectionCatalog | undefined }

/**
 * The pane's sections, so that one global order holds: first "Enabled" with every enabled row of every marketplace in
 * orderRows order (mods first), then one section per marketplace, by marketplace name, with only that marketplace's
 * disabled rows; then (2f) the other marketplaces with a local copy, by name, so the installed rows stay on top: one whose
 * installed rows are all enabled only when its catalog lists a plugin that is not installed, and one with no installed row
 * always, its catalog read only when its section is opened (isOnDemand). Every marketplace section also holds the plugins
 * its catalog lists that are installed in no scope and that the filter keeps (`view`); while a filter is set, a section
 * read on demand is drawn only when one of its plugins matches, or, before its catalog is read, its marketplace's name. A
 * row is in exactly one section. The count comes first in each label, so fitLabel cuts the name. The marketplace name
 * comes from the id or the marketplace list, text from outside the pane, so the label shows it through printable
 * (TRDD-R2QYIN8O, 2h part 1, review of 262b0ed); the key keeps it as it is, because a key is an address the pane never draws.
 */
export function sectionsOf(rows: readonly Row[], view: CatalogView = NO_CATALOGS): Section[] {
  const ordered = orderRows(rows)
  const enabled = ordered.filter((row) => row.enabled)
  const off = new Map<string, Row[]>()
  for (const row of ordered.filter((member) => !member.enabled)) off.set(row.marketplace, [...(off.get(row.marketplace) ?? []), row])
  const terms = termsOf(view.query)
  // A plugin the catalog lists is not installed when no scope holds its id; none is known to be a mod, so "mod" drops it.
  const catalogOf = (marketplace: string, onDemand: boolean): SectionCatalog => {
    const listing = view.listings.get(marketplace)
    const entries =
      listing?.kind === 'read'
        ? listing.entries.filter((entry) => !view.installed.has(entry.id) && matchesTerms(terms, [entry.name, entry.id, entry.marketplace], false))
        : []
    return { onDemand, listing, entries }
  }
  const offSections = [...off.entries()]
    .sort(([a], [b]) => compareText(a, b))
    .map(([marketplace, members]): Section => {
      const catalog = catalogOf(marketplace, false)
      const counts = [`${members.length} off`, ...(catalog.entries.length === 0 ? [] : [`${catalog.entries.length} not installed`])]
      return { key: marketplace, label: [...counts, printable(marketplace)].join(' · '), rows: members, catalog }
    })
  const otherSections = [...view.marketplaces]
    .filter((marketplace) => !off.has(marketplace))
    .sort(compareText)
    .flatMap((marketplace): Section[] => {
      const onDemand = !view.withRows.has(marketplace)
      const catalog = catalogOf(marketplace, onDemand)
      const read = catalog.listing?.kind === 'read'
      // Read on demand, a section is drawn whatever its catalog holds, so it never vanishes once opened; while a filter is
      // set, only when something in it matches. With installed rows, all enabled, it holds only its plugins not installed.
      const drawn = onDemand ? (read ? terms.length === 0 || catalog.entries.length > 0 : matchesTerms(terms, [marketplace], false)) : catalog.entries.length > 0
      if (!drawn) return []
      const count = read ? `${catalog.entries.length} not installed` : 'not installed'
      return [{ key: marketplace, label: `${count} · ${printable(marketplace)}`, rows: [], catalog }]
    })
  return [
    ...(enabled.length === 0 ? [] : [{ key: ENABLED_KEY, label: `${enabled.length} enabled`, rows: enabled, catalog: undefined }]),
    ...offSections,
    ...otherSections,
  ]
}

/**
 * True when a filter forces every section drawn open: only when the trimmed filter has 2 or more characters. One
 * letter matches nearly every row, and forcing every section open would redraw almost all of ~500 rows on the first
 * keystroke; with one character the rows are filtered but the sections keep the person's own expanded set.
 */
export const forcesOpen = (filter: string): boolean => filter.trim().length >= 2

/** The terms of a filter query: trimmed, lowercased and split on whitespace (filterRows). */
const termsOf = (query: string): string[] => query.trim().toLowerCase().split(/\s+/).filter((term) => term !== '')

/**
 * True when every term is found, case-insensitively, in one of `texts`, except the term "mod", which holds only when
 * `isMod` (see filterRows). The rows, and the plugins a catalog lists that are not installed (2f), are matched by this rule.
 */
function matchesTerms(terms: readonly string[], texts: readonly string[], isMod: boolean): boolean {
  const haystack = texts.map((text) => text.toLowerCase())
  return terms.every((term) => (term === 'mod' ? isMod : haystack.some((text) => text.includes(term))))
}

/**
 * The rows a filter query keeps. The query is trimmed and split on whitespace; a row stays when EVERY term is found,
 * case-insensitively, in its name, its id or its marketplace. The one exception is a term that is exactly "mod": it
 * selects mods only (row.isMod) and is NOT also matched as a substring, so "mod" never lists a non-mod such as
 * "model-tools"; "model" is plain text. An empty query keeps every row, unchanged and in order.
 */
export function filterRows(rows: readonly Row[], query: string): Row[] {
  const terms = termsOf(query)
  if (terms.length === 0) return [...rows]
  return rows.filter((row) => matchesTerms(terms, [row.name, row.id, row.marketplace], row.isMod))
}

/**
 * The actions offered for an entry of each scope. user, project and local take all four, by id and scope, except that a
 * skills-folder row (user or project) has no update and no uninstall and is named by its id alone (see actionsFor and
 * actionArgv). synced takes enable and disable by `<name>@synced` (plugin commands chapter, lines 202 and 238) and is
 * removed on claude.ai, not uninstalled. session takes disable by `<name>@inline`, the only CLI form the docs give for it
 * (line 894). managed takes update only: the organization installed it, so the person cannot enable, disable or uninstall
 * it, but `update` takes `--scope managed` (lines 43, 277 and 296: "managed is the one scope you can update but not
 * install to"). The update section gives no form for a synced or session id, so neither offers it. Update is drawn only
 * on a row with an update arrow (actionsFor).
 */
const ACTIONS: Record<Scope, readonly Action[]> = {
  user: ['enable', 'disable', 'update', 'uninstall'],
  project: ['enable', 'disable', 'update', 'uninstall'],
  local: ['enable', 'disable', 'update', 'uninstall'],
  synced: ['enable', 'disable'],
  session: ['disable'],
  managed: ['update'],
}

/** The scopes `--scope` takes (plugin commands chapter, line 43). A row of another scope is named by its id alone. */
const FLAG_SCOPES: readonly Scope[] = ['user', 'project', 'local']
/** The scopes `update` names with `--scope`: those three and managed (plugin commands chapter, lines 43 and 277). */
const UPDATE_SCOPES: readonly Scope[] = [...FLAG_SCOPES, 'managed']

/** The end of the id a row named by its id alone must have, as `claude plugin list --json` reports it (line 335). */
const ORIGIN: Partial<Record<Scope, string>> = { synced: '@synced', session: '@inline' }

/**
 * The id ending of a plugin loaded from a skills folder (plugin commands chapter, line 335). Claude Code reserves the
 * name skills-dir (marketplace manifest chapter, line 462), so no marketplace install has an id that ends this way.
 */
const SKILLS_DIR = '@skills-dir'
const isSkillsDir = (id: string): boolean => id.endsWith(SKILLS_DIR)

/**
 * The actions a row's buttons run: the toggle its state calls for when its scope offers it, then Update when `updatable`
 * (the row has an update arrow, hasUpdate) and its scope offers it, then Uninstall when offered. A row whose id PLUGIN_ID
 * refuses gets none, because actionArgv would refuse each one. A skills-folder plugin gets no Update, since no catalog
 * lists it, and no Uninstall: Claude Code 2.1.316 refuses it ("it cannot be uninstalled. Delete the directory to remove
 * it").
 */
export function actionsFor(row: { id: string; scope: Scope; enabled: boolean }, updatable = false): Action[] {
  if (!PLUGIN_ID.test(row.id)) return []
  const toggle: Action = row.enabled ? 'disable' : 'enable'
  return ACTIONS[row.scope].filter(
    (action) => action === toggle || (action === 'update' && updatable && !isSkillsDir(row.id)) || (action === 'uninstall' && !isSkillsDir(row.id)),
  )
}

/**
 * The note under a row: why it draws no button; for a skills-folder plugin, which has no Uninstall, how to remove it;
 * for a managed row, why it draws no button or only Update. Undefined for any other row that draws a button.
 * `updatable` is the value actionsFor is given.
 */
export function lockedNote(row: { id: string; scope: Scope; enabled: boolean }, updatable = false): string | undefined {
  if (!PLUGIN_ID.test(row.id)) return 'No change is offered: its id is not a lowercase name@marketplace.'
  if (isSkillsDir(row.id)) return 'Loaded from a skills folder: delete its folder to remove it.'
  if (row.scope === 'managed') return updatable ? 'Managed by your organization: only an update is offered here.' : 'Managed by your organization: it cannot be changed here.'
  if (actionsFor(row, updatable).length > 0) return undefined
  if (row.scope === 'session') return 'Loaded for this session only: turning it on is not offered here.'
  return `No change is offered for a ${row.scope} plugin.`
}

/**
 * The argument vector of one action on one row. The id is checked against PLUGIN_ID first, so an id that could be
 * read as a flag or a path never reaches claude, and an action the row's scope does not offer is refused. A
 * skills-folder plugin is named by its id alone and is never updated or uninstalled. A user, project or local row names
 * its scope, and so does a managed row's update. A synced or session row is named by its id alone, which must be the
 * documented form, because `--scope` takes no other scope. An update never passes -y: an update of a command-source
 * plugin whose command changed then fails without a terminal, and its line says why (plugin commands chapter, line 278).
 */
export function actionArgv(claude: string, action: Action, row: { id: string; scope: Scope }): string[] {
  if (!PLUGIN_ID.test(row.id)) throw new Error(`refused: "${row.id}" is not a plugin id (name@marketplace)`)
  if (!ACTIONS[row.scope].includes(action)) throw new Error(`refused: ${action} is not offered for a ${row.scope} plugin`)
  if (isSkillsDir(row.id)) {
    // No catalog lists a skills-folder plugin, and the update section gives no form for its id.
    if (action === 'uninstall' || action === 'update') throw new Error(`refused: ${action} is not offered for a skills-directory plugin`)
    // The form the docs give (plugins-creation chapter, line 262): `claude plugin disable <name>@skills-dir`, with no
    // --scope. Claude Code 2.1.316 ran it, enable and disable, for a user-scope skills-folder plugin. For a project-scope
    // one this form is UNVERIFIED: a fresh config does not trust the project, and lists its skills folder as suppressed.
    return [claude, 'plugin', action, row.id]
  }
  if ((action === 'update' ? UPDATE_SCOPES : FLAG_SCOPES).includes(row.scope)) return [claude, 'plugin', action, row.id, '--scope', row.scope]
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
  return { enable: 'Turn it on', disable: 'Turn it off', update: 'Update it', uninstall: 'Uninstall it' }[action]
}

/** True only for the confirm label of this action: the one answer that lets it run. Any other answer runs nothing. */
export function isConfirmed(answer: string, action: Action): boolean {
  return answer === confirmLabel(action)
}

/** How a confirm question ended: the action ran, the answer was not its confirm label, or the question was dismissed. */
export type ConfirmOutcome = 'ran' | 'declined' | 'dismissed'

/**
 * Asks once and runs only when `confirms` accepts the answer; any other answer runs nothing, and a rejected ask (a
 * dismissed question) runs nothing. The ask and the run are plain functions, so a test drives this same rule with plain
 * answers. The callers in state.ts pass the engine's question as the ask: that is a seam, not a mock of the engine.
 */
export async function askThenRun(confirms: (answer: string) => boolean, ask: () => Promise<string>, run: () => Promise<void>): Promise<ConfirmOutcome> {
  let answer: string
  try {
    answer = await ask()
  } catch {
    return 'dismissed'
  }
  if (!confirms(answer)) return 'declined'
  await run()
  return 'ran'
}

/** askThenRun for one action: it runs only when the answer is that action's confirm label (isConfirmed). */
export async function confirmThenRun(action: Action, ask: () => Promise<string>, run: () => Promise<void>): Promise<ConfirmOutcome> {
  return askThenRun((answer) => isConfirmed(answer, action), ask, run)
}

const EFFECT: Record<Action, string> = {
  enable: 'It loads in your next session.',
  disable: 'It stops loading in your next session.',
  // Plugin commands chapter, "plugin update" (line 269): the new version loads in the next session.
  update: 'The latest version its marketplace offers loads in your next session.',
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
  // The name is text from the list, so it goes through printable, as updateAllQuestion does (2h part 1).
  return `${confirmLabel(action)}: ${printable(row.name)} (${row.scope} scope)? ${EFFECT[action]}${SCOPE_NOTE[row.scope] ?? ''}`
}

const DONE: Record<Action, string> = { enable: 'turned on', disable: 'turned off', update: 'updated', uninstall: 'uninstalled' }

export function doneText(action: Action, row: Row): string {
  // A toast draws the name, text from the list, so it goes through printable (2h part 1).
  return `${printable(row.name)} ${DONE[action]}. Applies in your next session.`
}

// Increment 2e of TRDD-R2QYIN8O: Update on a row with an update arrow, and Update all.

/**
 * What `claude plugin update` prints when nothing is newer, though it exits 0 (plugin commands chapter, "plugin update",
 * line 288: "formatter is already at the latest version (1.0.0)."). The chapter does not name the stream, so the caller
 * passes both.
 */
const NOTHING_NEWER = /is already at the latest version/

/**
 * How one update ended: a newer version installed, no newer version found, or a failure with the first line of its error
 * message (runAction's message is the last line claude printed).
 */
export type UpdateOutcome = { kind: 'updated' } | { kind: 'current' } | { kind: 'failed'; reason: string }

/** The outcome of an update that exited 0, read from what claude printed. */
export function updateOutcomeOf(output: string): UpdateOutcome {
  return NOTHING_NEWER.test(output) ? { kind: 'current' } : { kind: 'updated' }
}

/**
 * The toast of an update that found no newer version: doneText's "updated" would claim a change that did not happen. It
 * says only that, never that nothing was installed: an update at the latest version can still finish an unfinished
 * dependency install in the plugin's cached copy (plugin commands chapter, lines 288 and 304; 2e review spec/F3).
 */
export function currentText(row: Row): string {
  return `No newer version of ${printable(row.name)} was found.`
}

/**
 * The rows Update all updates: each row the filter shows (filterRows) that draws Update, that is, with an update arrow the
 * pane can act on and a scope that offers Update (updatableHere, actionsFor), in the order of `rows`. A row the filter
 * hides is left out, so the button counts and the question names only rows the person can see. The button's count, the
 * question and the loop all read this one list, so they cannot disagree.
 */
export function updateTargets(rows: readonly Row[], latest: ReadonlyMap<string, Latest> | undefined, filter: string): Row[] {
  return filterRows(rows, filter).filter((row) => actionsFor(row, updatableHere(row, latest?.get(row.id))).includes('update'))
}

/** The answer that lets Update all run. */
export const UPDATE_ALL_LABEL = 'Update them'

/** How many plugins Update all's question names before it counts the rest. */
const NAMES_SHOWN = 5

/**
 * Update all's one question: how many plugins it updates, the first NAMES_SHOWN of them by name and scope, then a count of
 * the rest, and what an update does. The names go through printable, since they are text from the list.
 */
export function updateAllQuestion(targets: readonly Row[]): string {
  const named = targets.slice(0, NAMES_SHOWN).map((row) => printable(`${row.name} (${row.scope} scope)`))
  const more = targets.length - named.length
  const names = more === 0 ? named.join(', ') : `${named.join(', ')} and ${more} more`
  return `Update all ${targets.length} ${targets.length === 1 ? 'plugin' : 'plugins'}: ${names}? Each gets the latest version its marketplace offers, one after another, and loads in your next session.`
}

/** The Update all button's label: its hotkey letter first, as Refresh's is, then how many rows it updates. */
export function updateAllLabel(count: number): string {
  return `u: Update all (${count})`
}

/** One row of an Update all run and how its update ended. */
export type UpdateResult = { row: Row; outcome: UpdateOutcome }

const firstLine = (text: string): string => text.split('\n')[0] ?? ''

/**
 * Updates the rows one after another with `run` (state.ts passes runAction, which resolves to claude's output and rejects
 * with claude's own last line). A failure never stops the loop: it is kept with the first line of its error message, and
 * the next row is still updated. `starting` hears each row before its run, so the pane can say which one runs.
 */
export async function updateEach(rows: readonly Row[], run: (row: Row) => Promise<string>, starting: (row: Row, index: number) => void): Promise<UpdateResult[]> {
  const results: UpdateResult[] = []
  for (const [index, row] of rows.entries()) {
    starting(row, index)
    try {
      results.push({ row, outcome: updateOutcomeOf(await run(row)) })
    } catch (error) {
      results.push({ row, outcome: { kind: 'failed', reason: firstLine(messageOf(error)) } })
    }
  }
  return results
}

/** One row's line in the Update all report. A row with nothing newer says only that, as currentText does. */
export function updateLine({ row, outcome }: UpdateResult): string {
  const how = outcome.kind === 'failed' ? `failed: ${outcome.reason}` : outcome.kind === 'updated' ? 'updated.' : 'no newer version was found.'
  return printable(`${row.name} (${row.scope} scope): ${how}`)
}

/** What Update all shows when it ends: a count of each outcome, then one line per row. */
export type UpdateReport = { summary: string; lines: string[] }

/** The report of an Update all run. The failures come first, because they are the lines the person has to act on. */
export function reportOf(results: readonly UpdateResult[]): UpdateReport {
  const count = (kind: UpdateOutcome['kind']): number => results.filter((result) => result.outcome.kind === kind).length
  const rank: Record<UpdateOutcome['kind'], number> = { failed: 0, current: 1, updated: 2 }
  // Array sort is stable, so rows of one outcome keep their order.
  const ordered = [...results].sort((a, b) => rank[a.outcome.kind] - rank[b.outcome.kind])
  return {
    summary: `Update all: ${count('updated')} updated, ${count('current')} already current, ${count('failed')} failed.`,
    lines: ordered.map(updateLine),
  }
}

/**
 * A label cut to `room` columns, the last one an ellipsis, so a narrow surface never draws past its column. The room is
 * counted in UTF-16 units, as before: a character outside the BMP is two units, which is also the two columns an emoji
 * takes. The cut falls between code points, so such a character is kept whole or left out, never split into a lone
 * surrogate (review of 3354881: counting code points let an emoji label run past its room).
 */
export function fitLabel(label: string, room: number): string {
  if (label.length <= room) return label
  if (room < 2) return ''
  let kept = ''
  for (const point of label) {
    if (kept.length + point.length > room - 1) break
    kept += point
  }
  return `${kept}…`
}

// Increment 2d of TRDD-R2QYIN8O: the latest version each row's marketplace offers, and the update arrow.

/**
 * One entry of `claude plugin marketplace list --json` (plugin commands chapter, "plugin marketplace list"): the
 * marketplace's name, where Claude Code cached it, and where it was added from. A marketplace hosted on claude.ai has no
 * local copy and carries no installLocation, so the latest versions of its plugins are unknown. `source` is undefined for an
 * entry with no source kind (2j).
 */
export type Marketplace = { name: string; installLocation: string | undefined; source: MarketSource | undefined }

/**
 * Where a marketplace was added from, as the list names it (2j): its kind (`directory`, `github`, `git`, `claudeai`, or
 * another) and the one field that kind is known by, a `directory` by its `path`, a `github` one by its `repo`, a `git` one
 * by its `url` (mods-install-mod skill, step 5). Each field is kept only when it is a string. The pane compares sources
 * before it adds a folder, and after, to name a marketplace the add re-pointed.
 */
export type MarketSource = { kind: string; path?: string; repo?: string; url?: string }

/**
 * Reads `claude plugin marketplace list --json`. An answer that is not a list is an error. An item with no string name is
 * skipped, since no row can match it. installLocation is kept as written and checked by catalogPath when it is read, so
 * a bad one is named in the pane rather than dropped here.
 */
export function parseMarketplaces(text: string): Marketplace[] {
  const data: unknown = JSON.parse(text)
  if (!Array.isArray(data)) throw new Error('claude plugin marketplace list --json did not answer a list')
  const marketplaces: Marketplace[] = []
  for (const item of data) {
    const { name, installLocation, source, path, repo, url } = (typeof item === 'object' && item !== null ? item : {}) as Record<string, unknown>
    if (typeof name !== 'string') continue
    const kept: MarketSource | undefined =
      typeof source !== 'string'
        ? undefined
        : { kind: source, ...(typeof path === 'string' ? { path } : {}), ...(typeof repo === 'string' ? { repo } : {}), ...(typeof url === 'string' ? { url } : {}) }
    marketplaces.push({ name, installLocation: typeof installLocation === 'string' ? installLocation : undefined, source: kept })
  }
  return marketplaces
}

/**
 * The folder a catalog is read from. It must be absolute, because $.fs would read a relative path as one inside the
 * session's working folder, and it must have no ".." segment. Throws, with the reason the pane shows, for any other folder.
 */
function marketplaceFolder(installLocation: string): string {
  const absolute = installLocation.startsWith('/') || /^[A-Za-z]:[\\/]/.test(installLocation)
  if (!absolute || installLocation.split(/[\\/]/).includes('..')) throw new Error(`its folder ${JSON.stringify(installLocation)} is not an absolute path without ".."`)
  return installLocation.replace(/[\\/]+$/, '')
}

/** The path of a marketplace's catalog in its local copy. Throws for a folder marketplaceFolder refuses. */
export function catalogPath(installLocation: string): string {
  return `${marketplaceFolder(installLocation)}/.claude-plugin/marketplace.json`
}

/** The path of the plugin.json of a plugin kept in `folder` of a marketplace ('' is the marketplace's root). */
export function manifestPath(installLocation: string, folder: string): string {
  return `${marketplaceFolder(installLocation)}/${folder === '' ? '' : `${folder}/`}.claude-plugin/plugin.json`
}

/**
 * What a catalog says about one plugin: the version its entry declares, and, for a relative-path source, the folder that
 * source names inside the marketplace ('' for the root). Each is undefined when the entry gives none that can be used.
 * `asksToAccept` is true for an archive entry that sets a headersHelper: claude asks the person to accept that command
 * each time they update the plugin by itself (host chapter, "How users accept a headersHelper command", lines 385-395).
 * `about` holds the entry's display fields (About), present only when it sets one; the details view shows them before
 * those of the plugin's own plugin.json (shownAbout). `declares` is set, only to true, when the entry declares a command claude
 * would run for it: a command source, which builds the plugin, or that headersHelper (marketplace manifest chapter). An
 * automatic update never runs for such an entry: it pauses before claude is called (2k, auto-update.ts blockReason).
 */
export type CatalogEntry = { version: string | undefined; folder: string | undefined; asksToAccept: boolean; about?: About; declares?: true }

/** `path` as plain segments: undefined when it is absolute, holds a backslash or a ".." segment, so it could leave the marketplace. */
function plainRelative(path: string): string | undefined {
  if (/^(\/|[A-Za-z]:)/.test(path) || path.includes('\\')) return undefined
  const parts = path.split('/').filter((part) => part !== '' && part !== '.')
  return parts.includes('..') ? undefined : parts.join('/')
}

/**
 * The folder a relative-path source names (marketplace reference chapter, "Relative path plugin source"): "." is the
 * root, "./x" is x, and a bare name (one segment, no "/") is under metadata.pluginRoot when the catalog sets one. Any
 * other string, and a path that would leave the marketplace, gives undefined: the catalog is the marketplace author's
 * text, and the folder it names is read with $.fs.read.
 */
function sourceFolder(source: string, pluginRoot: string | undefined): string | undefined {
  if (source === '.') return ''
  if (source.startsWith('./')) return plainRelative(source.slice(2))
  if (pluginRoot === undefined || source === '' || source.includes('/')) return undefined
  const root = plainRelative(pluginRoot)
  return root === undefined ? undefined : plainRelative(root === '' ? source : `${root}/${source}`)
}

/**
 * Reads a marketplace's `.claude-plugin/marketplace.json` into its entries by plugin name; the first entry of a name
 * wins. A catalog that is not JSON, or has no plugins list, is an error. An empty version is no version. An entry whose
 * source is a command keeps no version, because Claude Code ignores that field for command sources (plugin loading
 * chapter, "How Claude Code computes the version", line 317). An archive entry that sets a headersHelper asks to accept
 * it (CatalogEntry): headersHelper applies only to archive sources and "has no effect" on any other (marketplace manifest
 * chapter, line 480), so only that pair is marked. The entry's display fields, the ones the details view shows, are kept
 * as `about` (aboutFields).
 */
export function parseCatalog(text: string): Map<string, CatalogEntry> {
  const data: unknown = JSON.parse(text)
  const { plugins, metadata } = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>
  if (!Array.isArray(plugins)) throw new Error('it has no plugins list')
  const root = typeof metadata === 'object' && metadata !== null ? (metadata as Record<string, unknown>).pluginRoot : undefined
  const pluginRoot = typeof root === 'string' ? root : undefined
  const entries = new Map<string, CatalogEntry>()
  for (const item of plugins) {
    const { name, version, source, headersHelper } = (typeof item === 'object' && item !== null ? item : {}) as Record<string, unknown>
    if (typeof name !== 'string' || entries.has(name)) continue
    const kind = typeof source === 'object' && source !== null ? (source as Record<string, unknown>).source : undefined
    // The display fields (2i): set only when the entry has one, so an entry with none keeps the shape it had before.
    const about = aboutFields(item)
    const asksToAccept = kind === 'archive' && typeof headersHelper === 'string' && headersHelper !== ''
    entries.set(name, {
      version: typeof version === 'string' && version !== '' && kind !== 'command' ? version : undefined,
      folder: typeof source === 'string' ? sourceFolder(source, pluginRoot) : undefined,
      asksToAccept,
      ...(Object.keys(about).length === 0 ? {} : { about }),
      // 2k: set only when true, so an entry that declares nothing keeps the shape it had before.
      ...(kind === 'command' || asksToAccept ? { declares: true as const } : {}),
    })
  }
  return entries
}

/**
 * The version a plugin.json declares, or undefined when it declares none or an empty one. Throws when the text is not
 * JSON, and when its version is there but is not a string: the plugin.json then sets a version this pane cannot read,
 * so the latest version is unknown, never the entry's (TRDD-R2QYIN8O, 2d review F4).
 */
export function manifestVersionOf(text: string): string | undefined {
  const data: unknown = JSON.parse(text)
  const version = typeof data === 'object' && data !== null ? (data as Record<string, unknown>).version : undefined
  if (version === undefined || version === '') return undefined
  if (typeof version !== 'string') throw new Error(`its "version" is ${JSON.stringify(version)}, not a string`)
  return version
}

/**
 * The latest version a marketplace offers for one plugin, and where it was read: `folder` when it comes from a plugin
 * kept in the marketplace's own folder (its plugin.json, else its entry), which is the version an install takes;
 * `catalog` when it is only the version the catalog lists for a plugin fetched from elsewhere (see latestOf). Never
 * guessed: when no version is found, it is unknown. `asksToAccept` is set, only to true, when the entry makes claude ask
 * the person to accept its headers helper on an update (CatalogEntry), which the pane cannot do (updatableHere).
 */
export type Latest = { kind: 'known'; version: string; from: 'folder' | 'catalog'; asksToAccept?: true } | { kind: 'unknown' }
export const UNKNOWN: Latest = { kind: 'unknown' }

/**
 * The folder whose plugin.json is read for the latest version: that of every relative-path entry, whatever version the
 * entry itself declares, because the plugin.json version wins when Claude Code installs (marketplace manifest chapter,
 * line 104: "When plugin.json also sets version, plugin.json takes precedence"; line 485: "At install time, plugin.json
 * wins"; plugin loading chapter, "How Claude Code computes the version"). Taking the entry's version first would draw an
 * arrow that an update never clears. Undefined for any other source: its plugin.json is not in the marketplace's folder.
 */
export function manifestFolder(entry: CatalogEntry | undefined): string | undefined {
  return entry?.folder
}

/**
 * The latest version, by the entry's source (2d review F1; plugin loading chapter, "How Claude Code computes the
 * version", lines 301-304 and 317):
 * - A relative-path entry: the version its plugin.json in the marketplace's folder declares, else the entry's own, from
 *   `folder`: these are the two places an install reads, in its order.
 * - A command source: no version (parseCatalog keeps none, since an install ignores the entry's), so unknown and no arrow.
 * - Any other source (github, url, git-subdir, npm, archive): the entry's version, from `catalog`. For these sources too
 *   the plugin's own manifest comes first at install (line 303) and the entry's version second (line 304), but that
 *   manifest is in the remote source, which this pane does not fetch. The two normally match; when they do not, the
 *   pane says "catalog lists", not "latest", and an update that finds no newer version says so in its result line.
 * A manifestVersion passed for a non-relative entry is ignored. No version at all is unknown, so no arrow.
 */
export function latestOf(entry: CatalogEntry | undefined, manifestVersion: string | undefined): Latest {
  if (entry === undefined) return UNKNOWN
  if (manifestFolder(entry) !== undefined) {
    const version = manifestVersion ?? entry.version
    return version === undefined ? UNKNOWN : { kind: 'known', version, from: 'folder' }
  }
  return entry.version === undefined ? UNKNOWN : { kind: 'known', version: entry.version, from: 'catalog', ...(entry.asksToAccept ? { asksToAccept: true } : {}) }
}

/**
 * The dotted parts of a version that is plain dotted digits (1, 2.0, 10.0.0), or undefined for anything else. Each part is
 * checked on its own. A part is never read as a Number: a Number cannot hold every digit string exactly (2^53+1 reads as
 * 2^53, and a long enough string as Infinity or NaN), so compareDigits compares the parts as text.
 */
function numericParts(version: string): string[] | undefined {
  const parts = version.split('.')
  return parts.every((part) => /^\d+$/.test(part)) ? parts : undefined
}

/**
 * Compares two strings of digits by their value, as text. Leading zeros do not count, so the longer string is the larger
 * number, and two of the same length compare in order.
 */
function compareDigits(a: string, b: string): -1 | 0 | 1 {
  const [x, y] = [a.replace(/^0+/, '') || '0', b.replace(/^0+/, '') || '0']
  if (x.length !== y.length) return x.length > y.length ? 1 : -1
  if (x === y) return 0
  return x > y ? 1 : -1
}

/**
 * Compares two versions number by number, so 10.0.0 is newer than 2.0.0 and 1.2 equals 1.2.0 (a missing part counts as 0).
 * Undefined unless both are plain dotted numbers: 2.0.0-beta, v2.0.0, a commit hash and "unknown" are never compared, so
 * they never draw an arrow.
 */
export function compareVersions(a: string, b: string): -1 | 0 | 1 | undefined {
  const [pa, pb] = [numericParts(a), numericParts(b)]
  if (pa === undefined || pb === undefined) return undefined
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    // Each part is compared as a digit string, so a part of any length is exact; a missing part is '0'.
    const difference = compareDigits(pa[i] ?? '0', pb[i] ?? '0')
    if (difference !== 0) return difference
  }
  return 0
}

/** True only when the latest version is known and numerically newer than the installed one. */
export function hasUpdate(installed: string | undefined, latest: Latest | undefined): boolean {
  return installed !== undefined && latest?.kind === 'known' && compareVersions(latest.version, installed) === 1
}

/**
 * The version a row's sessions load, which the pane draws and compares with the latest one. For a plugin loaded in place
 * from a local-path marketplace (readFromFolder set) it is folderVersion: "the plugin's `version` as Claude Code loaded it
 * from that folder, which can differ from the `version` field above" (plugin commands chapter, line 341). Such a plugin
 * "loads its current source files at every session start, whatever its version string says" (tracing chapter, line 297),
 * so once its author raises plugin.json, the version recorded at install is stale while the new one already loads; read
 * against the recorded one, the row would draw an arrow and an Update for a version the session already runs (2e review
 * spec/F1). folderVersion is absent when the plugin did not load or declares no version: no loaded version is known then,
 * so the row draws "no version" and no arrow, never the recorded one. Every other row loads the version recorded at install.
 */
export function loadedVersion(row: { version: string | undefined; readFromFolder: string | undefined; folderVersion: string | undefined }): string | undefined {
  return row.readFromFolder === undefined ? row.version : row.folderVersion
}

/** True when the row draws an update arrow: its latest version is newer than the version it loads (loadedVersion). */
export function rowHasUpdate(row: Row, latest: Latest | undefined): boolean {
  return hasUpdate(loadedVersion(row), latest)
}

/**
 * True when the pane can run the row's update: the row has an arrow, and its catalog entry does not make claude ask the
 * person to accept a headers helper (Latest's asksToAccept). The pane runs claude with no terminal to ask in, and `-y` is
 * ignored when the command runs inside a Claude Code session (plugin commands chapter, line 97), so such an update always
 * ends in "Aborted — the command was not run." (line 119). The row keeps its arrow and draws updateNote instead (2e review
 * spec/F2).
 */
export function updatableHere(row: Row, latest: Latest | undefined): boolean {
  return rowHasUpdate(row, latest) && !(latest?.kind === 'known' && latest.asksToAccept === true)
}

/**
 * The note of a row that has an arrow and a scope that offers Update, but whose update the pane cannot run (updatableHere):
 * claude asks the person to accept its entry's headers helper "each time they install or update that one plugin by
 * itself" (host chapter, "How users accept a headersHelper command", lines 385-395), so it is updated from their own
 * terminal. Undefined for any other row.
 */
export function updateNote(row: Row, latest: Latest | undefined): string | undefined {
  if (!rowHasUpdate(row, latest) || updatableHere(row, latest) || !actionsFor(row, true).includes('update')) return undefined
  return 'Update it from your own terminal with claude plugin update: claude asks you there to accept its headers helper, and cannot ask here.'
}

/**
 * The row's version line. Before the catalogs are read, and for a row no catalog covers (catalogTargets), it is the
 * version the row loads (loadedVersion), the marketplace and the scope. Once read, the latest version follows the loaded
 * one, so a narrow pane cuts the marketplace before the arrow: "latest x" for a version from the marketplace's folder,
 * "catalog lists x" for one the catalog lists for a plugin fetched from elsewhere (latestOf), each after "↑ " when x is
 * newer, and "latest unknown" when no version was found. Both versions are shown through printable, since the list and
 * the catalogs are text from outside the pane (2d review F6).
 */
export function versionLine(row: Row, latest: Latest | undefined): string {
  // The marketplace name comes from the id, text from outside the pane, so it goes through printable too (2h part 1).
  const where = `${printable(row.marketplace)} · ${row.scope} scope`
  const loaded = loadedVersion(row)
  const installed = printable(loaded ?? 'no version')
  if (latest === undefined) return `${installed} · ${where}`
  const offered =
    latest.kind === 'unknown'
      ? 'latest unknown'
      : `${hasUpdate(loaded, latest) ? '↑ ' : ''}${latest.from === 'folder' ? 'latest' : 'catalog lists'} ${printable(latest.version)}`
  return `${installed} · ${offered} · ${where}`
}

/** The scopes whose rows come from a marketplace catalog. A synced or session row does not, nor does a skills-folder row. */
const FROM_CATALOG: readonly Scope[] = ['user', 'project', 'local', 'managed']

/**
 * The rows whose latest version a catalog can give, by marketplace, then by plugin id with the name the catalog lists it
 * under. Only these marketplaces' catalogs are read.
 */
export function catalogTargets(rows: readonly Row[]): Map<string, Map<string, string>> {
  const targets = new Map<string, Map<string, string>>()
  for (const row of rows) {
    if (!FROM_CATALOG.includes(row.scope) || isSkillsDir(row.id) || row.marketplace === NO_MARKETPLACE) continue
    const ids = targets.get(row.marketplace) ?? new Map<string, string>()
    ids.set(row.id, row.name)
    targets.set(row.marketplace, ids)
  }
  return targets
}

/** The pane's line when the marketplace list could not be read; the debug log gets the whole reason. */
export function marketplacesProblem(reason: string): string {
  return `No latest version is known: the marketplace list could not be read (${printable(fitLabel(reason, REASON_ROOM))}).`
}

/** The pane's line for a marketplace whose catalog could not be read. */
export function catalogProblem(marketplace: string, reason: string): string {
  return `The latest versions from ${printable(marketplace)} are unknown: its catalog could not be read (${printable(fitLabel(reason, REASON_ROOM))}).`
}

/** The pane's line for a plugin whose plugin.json in the marketplace's folder exists but could not be read. */
export function manifestProblem(id: string, reason: string): string {
  return `The latest version of ${printable(id)} is unknown: its plugin.json could not be read (${printable(fitLabel(reason, REASON_ROOM))}).`
}

// Increment 2h of TRDD-R2QYIN8O: the status-line badge and Reload.

/**
 * The badge's count: every row that draws an update arrow (rowHasUpdate), whatever the filter shows, because the badge
 * stands for the whole list. A row whose update needs the person's own terminal (updateNote) keeps its arrow, so it is
 * counted, though Update all leaves it out (updateTargets). Zero before the catalogs are read.
 */
export function updateCount(rows: readonly Row[], latest: ReadonlyMap<string, Latest> | undefined): number {
  if (latest === undefined) return 0
  return rows.filter((row) => rowHasUpdate(row, latest.get(row.id))).length
}

/**
 * The text of the plugin's status line under the prompt ($.ui.status, mods API chapter, line 221: "One line under the
 * prompt that stays until you change it. It starts with ⚠ and the mod's name"), or undefined, which removes the line
 * (types, $.ui.status: "`undefined` removes it"), when no row has an arrow. The engine adds the ⚠ and the plugin's name,
 * so the text adds no mark of its own. It names the command that opens the pane.
 */
export function badgeText(count: number): string | undefined {
  if (count === 0) return undefined
  return `${count} plugin ${count === 1 ? 'update' : 'updates'} · /${COMMAND}`
}

/** The built-in command Reload runs, with no arguments: never --force (state.ts reloadPlugins). */
export const RELOAD_COMMAND = 'reload-plugins'

/**
 * The pane's message once /reload-plugins answered in this copy of the module. A reload that applies reloads this mod too
 * (plugin commands chapter, line 863: "Claude Code reloads every active plugin"), so its answer only reaches a copy whose state no
 * render reads any more; an answer the pane shows is one from a reload that did not replace it, such as the line that
 * holds back a reload that would change MCP tools and says to run it with --force (line 871). The lines are joined into
 * one, and the pane draws the message through printable.
 */
export function reloadAnswerText(text: string | undefined): string {
  const lines = (text ?? '').split('\n').map((line) => line.trim()).filter((line) => line !== '')
  return lines.length === 0 ? '/reload-plugins printed nothing.' : `/reload-plugins answered: ${lines.join(' ')}`
}

/** The pane's message when $.command.run rejected the reload: the first line of why, and what the person can do instead. */
export function reloadFailedText(reason: string): string {
  return `/reload-plugins could not run (${firstLine(reason)}). Type /reload-plugins in the prompt.`
}

/** True when this plugin's own open panes ($.ui.panes) include the mod-manager pane. */
export function paneIsOpen(panes: readonly { id: string }[]): boolean {
  return panes.some((pane) => pane.id === PANE)
}

// Increment 2i of TRDD-R2QYIN8O: the details view, and opening a plugin's folder or its homepage.

/** The key of a row: its id and its scope, since one id can be installed in several scopes. The pane's keys and the details view use it. */
export const rowKey = (row: { id: string; scope: Scope }): string => `${row.id}|${row.scope}`

/**
 * The display fields of a plugin that the details view shows, each a non-empty string or absent. Both a catalog entry and
 * the plugin's own plugin.json can set them (marketplace manifest chapter, "Display fields", line 131; plugin manifest
 * chapter, lines 148, 150 and 151).
 */
export type About = { description?: string; homepage?: string; repository?: string }

const ABOUT_FIELDS = ['description', 'homepage', 'repository'] as const

/** The display fields of a parsed JSON value: each one that is a non-empty string. Any other value is no field. */
export function aboutFields(data: unknown): About {
  const source = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>
  const about: About = {}
  for (const field of ABOUT_FIELDS) {
    const value = source[field]
    if (typeof value === 'string' && value !== '') about[field] = value
  }
  return about
}

/** The display fields of a plugin.json. Throws when the text is not JSON, so the details view can say why it shows none. */
export function aboutOf(text: string): About {
  return aboutFields(JSON.parse(text))
}

/**
 * The display fields the details view shows: for each one, the catalog entry's value when it sets one, else the
 * plugin.json's. That is the rule Claude Code follows in its own listings (marketplace manifest chapter, "Display fields",
 * lines 133-134: "For a field you set on the entry, users see the entry's value, even when plugin.json sets a different
 * one. For a field the entry leaves unset, users see the plugin.json value").
 */
export function shownAbout(entry: About | undefined, manifest: About | undefined): About {
  const about: About = {}
  for (const field of ABOUT_FIELDS) {
    const value = entry?.[field] ?? manifest?.[field]
    if (value !== undefined) about[field] = value
  }
  return about
}

/**
 * `text` when it is a web link the details view may open: http or https, then no space and no control character. Any
 * other text is shown and never opened, because it is the catalog author's or the plugin author's text: a leading "-" is
 * read as a flag by the program that opens it ("-a Terminal" makes macOS open start an app), and a link of another
 * scheme starts whatever program handles that scheme.
 */
export function webLink(text: string): string | undefined {
  return /^https?:\/\/[^\s\p{Cc}]+$/iu.test(text) ? text : undefined
}

/** The link the details view shows: the homepage, else the repository, with `url` set only when it may be opened (webLink). */
export type ShownLink = { field: 'homepage' | 'repository'; text: string; url: string | undefined }

export function linkOf(about: About): ShownLink | undefined {
  const field = about.homepage !== undefined ? 'homepage' : about.repository !== undefined ? 'repository' : undefined
  if (field === undefined) return undefined
  const text = about[field] ?? ''
  return { field, text, url: webLink(text) }
}

/**
 * `path` when the details view may read a plugin.json in it and open it: absolute (POSIX, or a Windows drive) with no ".."
 * segment, so it is never resolved against the session's folder ($.fs resolves a relative path there) and never read as
 * a flag by the program that opens it. Undefined for any other path, which the view shows and never opens.
 */
export function openableFolder(path: string): string | undefined {
  const absolute = path.startsWith('/') || /^[A-Za-z]:[\\/]/.test(path)
  return absolute && !path.split(/[\\/]/).includes('..') ? path : undefined
}

/** The plugin.json of a plugin whose files are in `folder` (modFolder), the file whose display fields the details view reads. */
export function aboutPath(folder: string): string {
  return `${folder.replace(/[\\/]+$/, '')}/.claude-plugin/plugin.json`
}

const XDG_OPEN = '/usr/bin/xdg-open'
const MAC_OPEN = '/usr/bin/open'
// Present on macOS and absent on Linux: where it exists, macOS open is this system's program (see OPENERS).
const SW_VERS = '/usr/bin/sw_vers'

/**
 * The programs that open a folder or a link, each with the fixed path that marks the system it belongs to (requires).
 * A program runs only where its path exists, and only the first one that runs is used, whether it works or not, because
 * the marker paths already pick the one program of this system. A failure therefore ends the attempt: /usr/bin/open is
 * another program on some Linux systems (on Debian it starts a program on a new virtual console), so it must never run
 * where sw_vers is absent, and a failing xdg-open must not hand over to it. The paths are fixed, never looked up on PATH
 * (the Desktop app does not inherit it, resolve-bin.ts) and never in the person's own folders, since what they open is
 * text from a catalog or a plugin.json. macOS has no /usr/bin/xdg-open (/usr/bin is on its read-only system volume).
 * Windows has neither, so there the path or the link is copied instead.
 */
export const OPENERS: readonly { program: string; requires: string }[] = [
  { program: XDG_OPEN, requires: XDG_OPEN },
  { program: MAC_OPEN, requires: SW_VERS },
]

/** What the details view opens: the row's folder, or its homepage or repository link. `text` is the path or the link itself. */
export type OpenTarget = { kind: 'folder'; text: string } | { kind: 'link'; field: 'homepage' | 'repository'; text: string }

/**
 * The argument vector that opens `target` with `opener`. macOS open shows a folder selected in Finder (-R: "Reveals the
 * file(s) in the Finder instead of opening them", man open) rather than opening it, because open starts an application
 * when the folder is a bundle, such as a version folder named 1.0.app; xdg-open shows a folder in the file manager. A
 * link is passed as it is. The text was checked first (openableFolder, webLink), so it can never be read as a flag.
 */
export function openerArgv(opener: string, target: OpenTarget): string[] {
  return target.kind === 'folder' && opener === MAC_OPEN ? [opener, '-R', target.text] : [opener, target.text]
}

/**
 * What a press of Open folder or Open homepage opens, or undefined when the view draws no such button: a folder that
 * openableFolder refuses, no link, or a link that is not a web link (webLink).
 */
export function openTargetOf(row: Row, kind: 'folder' | 'link', entry: About | undefined, manifest: About | undefined): OpenTarget | undefined {
  if (kind === 'folder') {
    const text = openableFolder(modFolder(row))
    return text === undefined ? undefined : { kind: 'folder', text }
  }
  const link = linkOf(shownAbout(entry, manifest))
  return link?.url === undefined ? undefined : { kind: 'link', field: link.field, text: link.url }
}

/** The toast once a program opened the target. The name is text from the list: the toast helper shows it through printable. */
export function openedText(target: OpenTarget, name: string): string {
  return target.kind === 'folder' ? `Showed the folder of ${name}.` : `Opened the ${target.field} of ${name}.`
}

const targetNoun = (target: OpenTarget): string => (target.kind === 'folder' ? 'the folder' : `the ${target.field}`)
const targetCopy = (target: OpenTarget): string => (target.kind === 'folder' ? 'its path' : 'the link')

/** The toast when no program opened the target and its path or link went to the clipboard instead. */
export function copiedText(target: OpenTarget): string {
  return `No program could open ${targetNoun(target)}, so ${targetCopy(target)} was copied: ${target.text}`
}

/** The pane's message when no program opened the target and the copy failed too: it names the text, so it can still be read. */
export function notCopiedText(target: OpenTarget, reason: string): string {
  return `No program could open ${targetNoun(target)}, and ${targetCopy(target)} could not be copied (${firstLine(reason)}): ${target.text}`
}

/**
 * The open details view: the key of its row, the folder whose plugin.json was read, and what that read gave. Both
 * `manifest` and `problem` are undefined while the read runs; `manifest` is {} when the folder holds no plugin.json.
 */
export type Details = { key: string; folder: string; manifest: About | undefined; problem: string | undefined }

/**
 * True when the details view stays open after a read of the list: its row is still listed and still loads from the folder
 * whose plugin.json was read. An update can move a row to another folder, whose plugin.json may say something else, and
 * an uninstall removes it; the view then closes rather than show fields of a folder the row no longer loads.
 */
export function keepsDetails(details: { key: string; folder: string }, rows: readonly Row[]): boolean {
  return rows.some((row) => rowKey(row) === details.key && modFolder(row) === details.folder)
}

/** How much of a description the details view shows: a description is the author's text, of any length. */
const DESCRIPTION_ROOM = 500

/**
 * Where the marketplace catalogs stand for the details view: read, once the latest versions are known; being read again,
 * while a read that replaces an earlier one runs (state.ts clears latest when a read starts, and latestRead says an earlier
 * read ended); otherwise not read yet, which is also the state during the first read.
 */
export type CatalogsStatus = 'not-read-yet' | 'reading-again' | 'read'

/** Where the catalogs stand, from whether latest is known, whether a read runs, and whether an earlier read ended. */
export function catalogsStatus(latestKnown: boolean, readingLatest: boolean, latestRead: boolean): CatalogsStatus {
  if (latestKnown) return 'read'
  return readingLatest && latestRead ? 'reading-again' : 'not-read-yet'
}

/** The details view's line for the latest version: the read's state, then the version as versionLine names it. */
function latestDetail(loaded: string | undefined, latest: Latest | undefined, catalogs: CatalogsStatus): string {
  if (catalogs === 'not-read-yet') return 'Latest: the marketplace catalogs are not read yet.'
  // Latest is undefined while a later read runs, so the line must not say the catalogs are not read yet.
  if (catalogs === 'reading-again') return 'Latest: the marketplace catalogs are being read again…'
  if (latest === undefined) return 'Latest: unknown, because no marketplace catalog lists it.'
  if (latest.kind === 'unknown') return 'Latest: unknown.'
  const arrow = hasUpdate(loaded, latest) ? '↑ ' : ''
  return `Latest: ${arrow}${latest.version}${latest.from === 'catalog' ? ', the version its catalog lists' : ''}`
}

/** The details view's line for the folder, and, for a plugin loaded in place, the install path that differs from it. */
function folderDetail(row: Row): string {
  const folder = modFolder(row)
  const opened = openableFolder(folder) === undefined ? ' (not an absolute path, so it is not opened)' : ''
  const inPlace = row.readFromFolder === undefined || row.readFromFolder === row.installPath ? '' : `, loaded in place; its install path is ${row.installPath}`
  return `Folder: ${folder}${inPlace}${opened}`
}

/**
 * The lines of the details view (2i): the plugin.json read's state, the description, the version the row loads and the
 * latest one, the marketplace, the scope, the folder and the homepage. The display fields follow shownAbout. Every line
 * goes through printable, since each holds text from the list, a catalog or a plugin.json.
 */
export function detailLines(row: Row, latest: Latest | undefined, catalogs: CatalogsStatus, entry: About | undefined, details: Pick<Details, 'manifest' | 'problem'>): string[] {
  const reading = details.manifest === undefined && details.problem === undefined
  const about = shownAbout(entry, details.manifest)
  const link = linkOf(about)
  const loaded = loadedVersion(row)
  const linkLine =
    link === undefined
      ? 'No homepage is listed.'
      : `${link.field === 'homepage' ? 'Homepage' : 'Repository'}: ${link.text}${link.url === undefined ? ' (not an http or https link, so it is not opened)' : ''}`
  const lines = [
    ...(reading ? ['Reading its plugin.json…'] : []),
    ...(details.problem === undefined ? [] : [`Its plugin.json could not be read (${fitLabel(firstLine(details.problem), REASON_ROOM)}), so only its catalog entry's fields are shown.`]),
    ...(about.description !== undefined ? [fitLabel(about.description, DESCRIPTION_ROOM)] : reading ? [] : ['No description is listed.']),
    `Installed: ${loaded ?? 'no version'}`,
    latestDetail(loaded, latest, catalogs),
    `Marketplace: ${row.marketplace}`,
    `Scope: ${row.scope}`,
    folderDetail(row),
    linkLine,
  ]
  return lines.map(printable)
}

// Increment 2f of TRDD-R2QYIN8O: the plugins a marketplace's catalog lists that are not installed, with Install (install.ts).

/**
 * A plugin a marketplace's catalog lists (2f): its name, its id `name@marketplace`, which PLUGIN_ID accepts, its
 * marketplace, and the description its entry sets, if any. The pane shows it under its marketplace's section with two
 * buttons, Install (after a question, install.ts) and Copy install line.
 */
export type Available = { id: string; name: string; marketplace: string; description: string | undefined }

/** How a marketplace's catalog stands for 2f: being read, read with the plugins it lists, or not readable, with why. */
export type Listing = { kind: 'reading' } | { kind: 'read'; entries: readonly Available[] } | { kind: 'failed'; reason: string }

/** The listing of a catalog whose read has started and not ended. */
export const READING: Listing = { kind: 'reading' }

/**
 * The plugins a parsed catalog lists, by name, and the names it does not show. A name is shown only when
 * `name@marketplace` passes PLUGIN_ID, the pattern every id must pass before it reaches an argument vector of the pane,
 * because the name is the catalog author's text and goes into the install line; the others are returned for the debug log.
 */
export function catalogListing(marketplace: string, catalog: ReadonlyMap<string, CatalogEntry>): { entries: Available[]; refused: string[] } {
  const entries: Available[] = []
  const refused: string[] = []
  for (const [name, entry] of catalog) {
    const id = `${name}@${marketplace}`
    if (PLUGIN_ID.test(id)) entries.push({ id, name, marketplace, description: entry.about?.description })
    else refused.push(name)
  }
  return { entries: entries.sort((a, b) => compareText(a.name, b.name)), refused }
}

/**
 * True for a marketplace name the pane may draw as a section of its own: the marketplace part of PLUGIN_ID, so it is a name
 * an id of the pane could carry, and it can never equal ENABLED_KEY (which has a space) or NO_MARKETPLACE.
 */
export const isMarketplaceName = (name: string): boolean => PLUGIN_ID.test(`plugin@${name}`)

/** Every id the list holds, in any scope, the entries it could not read included, so none of them is offered as not installed. */
export function installedIdsOf(list: InstalledList): Set<string> {
  return new Set([...list.entries.map((entry) => entry.id), ...list.rejected.flatMap((entry) => (entry.id === undefined ? [] : [entry.id]))])
}

/** The key of a plugin that is not installed, as the card names it: its id, then its marketplace (`pluginId|marketplaceName`). */
export const availableKey = (entry: { id: string; marketplace: string }): string => `${entry.id}|${entry.marketplace}`

/**
 * The line Copy install line copies, for the person to run in their own terminal (claude plugin install --help on 2.1.318:
 * "-s, --scope <scope>  Installation scope: user, project, or local"). The id is written bare, with no quotes, and is
 * checked here again: PLUGIN_ID admits only a-z, 0-9, '.', '_', '-' and one '@', and the id starts with a letter or a digit,
 * so no '-' can make it an option and no '@' can lead it (PowerShell splatting); inside a word none of these characters is
 * special in sh, zsh, PowerShell or cmd.exe. Quotes would be wrong, not just useless: cmd.exe passes single quotes into the
 * argument, so the id claude got there would be 'name@marketplace' with its quotes (TRDD-R2QYIN8O, 2f-R1 (7)).
 */
export function installLine(entry: { id: string }): string {
  if (!PLUGIN_ID.test(entry.id)) throw new Error(`refused: "${entry.id}" is not a plugin id (name@marketplace)`)
  return `claude plugin install ${entry.id} --scope user`
}

/**
 * What the pane knows of the marketplaces' catalogs (2f), for sectionsOf: the marketplaces with a local copy whose name a
 * section may carry (isMarketplaceName); the marketplaces of the installed rows, all of them, whatever the filter shows;
 * each listing so far, by marketplace; every installed id, in any scope (installedIdsOf); and the filter query.
 */
export type CatalogView = {
  marketplaces: readonly string[]
  withRows: ReadonlySet<string>
  listings: ReadonlyMap<string, Listing>
  installed: ReadonlySet<string>
  query: string
}

const NO_CATALOGS: CatalogView = { marketplaces: [], withRows: new Set(), listings: new Map(), installed: new Set(), query: '' }

/**
 * What a marketplace section shows of its catalog (2f): whether its catalog is read only when its section is opened, the
 * listing so far, and the plugins it lists that are not installed and that the filter keeps, by name.
 */
export type SectionCatalog = { onDemand: boolean; listing: Listing | undefined; entries: Available[] }

/**
 * True when `key` is the section of a marketplace with a local copy and no installed row (2f): the read of the latest
 * versions never reads its catalog, which is read only when the person opens its section, so nothing is read when the pane
 * opens.
 */
export function isOnDemand(key: string, marketplaces: readonly string[], rows: readonly { marketplace: string }[]): boolean {
  return marketplaces.includes(key) && !rows.some((row) => row.marketplace === key)
}

/**
 * The line a marketplace section draws about its catalog, or undefined for none. Only a section read on demand draws one:
 * its catalog is not read yet (drawn only while a filter forces the section open, and its header press then reads it), is
 * being read, could not be read, or lists nothing that is not installed. A section with installed rows draws none, since
 * the read of the latest versions names its catalog's problem above the rows.
 */
export function catalogNote(catalog: SectionCatalog): string | undefined {
  if (!catalog.onDemand) return undefined
  const { listing } = catalog
  if (listing === undefined) return 'Its catalog is not read yet: press the header above to read it.'
  if (listing.kind === 'reading') return 'Reading its catalog…'
  // A failed listing is not final: the next press that opens the section reads the catalog again (toggleSection), so the
  // note says how to try once more instead of leaving the person to wait for a Refresh (TRDD-R2QYIN8O, 2f-R1 (2)).
  if (listing.kind === 'failed') return `Its catalog could not be read (${printable(fitLabel(firstLine(listing.reason), REASON_ROOM))}): open this section again to try once more.`
  return catalog.entries.length === 0 ? 'Its catalog lists no plugin that is not installed.' : undefined
}

/** How many not-installed plugins a section draws before it counts the rest: one catalog on a measured machine lists 2283. */
const AVAILABLE_SHOWN = 25

/** The not-installed plugins a section draws, the first AVAILABLE_SHOWN by name, and how many more it holds. */
export function cappedAvailable(entries: readonly Available[]): { shown: Available[]; more: number } {
  const shown = entries.slice(0, AVAILABLE_SHOWN)
  return { shown, more: entries.length - shown.length }
}

/** The line under the drawn ones when a section holds more not-installed plugins than it draws. */
export function moreAvailableText(more: number): string {
  return `and ${more} more not installed: type part of a name in the filter to find one.`
}

/** The description line of a plugin that is not installed: its entry's text, cut to DESCRIPTION_ROOM, through printable. */
export function availableDescription(entry: Available): string | undefined {
  return entry.description === undefined ? undefined : printable(fitLabel(entry.description, DESCRIPTION_ROOM))
}

/**
 * The plugin a press of Copy install line names, looked up again in the session state: listed by the catalog read for its
 * marketplace and still installed in no scope. Undefined otherwise, so a press copies only a line the pane would draw.
 */
export function findAvailable(listings: ReadonlyMap<string, Listing>, installed: ReadonlySet<string>, entry: { id: string; marketplace: string }): Available | undefined {
  const listing = listings.get(entry.marketplace)
  if (listing?.kind !== 'read') return undefined
  return listing.entries.find((listed) => availableKey(listed) === availableKey(entry) && !installed.has(listed.id))
}

/** The toast once the install line was copied. The toast helper shows it through printable. */
export function copiedLineText(name: string, line: string): string {
  return `Copied the install line of ${name}; run it in your terminal: ${line}`
}

/** The pane's message when the copy failed: it names the line, so the person can still read it. */
export function notCopiedLineText(name: string, line: string, reason: string): string {
  return `The install line of ${name} could not be copied (${firstLine(reason)}): ${line}`
}

// Increments 2j and 2l of TRDD-R2QYIN8O: a marketplace added from the pane, which installs none of its plugins, and the command's arguments.

/**
 * The remote marketplace sources the mods-install-mod skill accepts (skills/mods-install-mod/SKILL.md, step 3), in its
 * order after a local path: an https:// URL (a git repository or a hosted marketplace.json), a git@host:path URL, then a
 * GitHub owner/repo. The skill also refuses a value that starts with "-", which only the GitHub pattern would admit
 * (isRemoteSource). None admits a space, a quote or a control character.
 */
const REMOTE_SOURCES: readonly RegExp[] = [
  /^https:\/\/[A-Za-z0-9.-]+(:[0-9]+)?(\/[A-Za-z0-9._~%+/-]*)?(#[A-Za-z0-9._/-]+)?$/,
  /^git@[A-Za-z0-9.-]+:[A-Za-z0-9._/-]+(#[A-Za-z0-9._/-]+)?$/,
  /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+(#[A-Za-z0-9._/-]+)?$/,
]

/** True for a source the install skill takes as remote: one of REMOTE_SOURCES, and not one that starts with "-". */
export const isRemoteSource = (text: string): boolean => !text.startsWith('-') && REMOTE_SOURCES.some((pattern) => pattern.test(text))

/** The catalog file of a marketplace folder; a path that ends with it names the folder two levels up. */
const MARKETPLACE_FILE = '/.claude-plugin/marketplace.json'

/** What the person typed to add a marketplace: a local folder, a remote source, or text the pane refuses, with why. */
export type AddSource = { kind: 'local'; folder: string } | { kind: 'remote'; source: string } | { kind: 'refused'; reason: string }

/**
 * Classifies the text of the add field (2j). A local source starts with "/": the pane adds only a folder whose
 * marketplace.json it can read first, because claude plugin marketplace add re-points a marketplace of the same name
 * without a word (measured on 2.1.317, TRDD-R2QYIN8O), and only the name read first can be checked against the list. "~"
 * is not expanded, and a path that starts with "./", "../" or "~" is refused, not taken for a GitHub owner/repo, which
 * "./x" would match. A remote source is never added: its marketplace.json cannot be read before it is added.
 */
export function classifyAddSource(typed: string): AddSource {
  const text = typed.trim()
  if (text === '') return { kind: 'refused', reason: 'Type the folder of a marketplace, starting with /, or a GitHub owner/repo or a URL, then press a: Add marketplace.' }
  // No folder or source the pane takes holds a control character, and one would reach the question and the argv.
  if (printable(text) !== text) return { kind: 'refused', reason: `"${printable(text)}" holds a control character, so it is not added.` }
  if (text.startsWith('/')) {
    const folder = (text.endsWith(MARKETPLACE_FILE) ? text.slice(0, -MARKETPLACE_FILE.length) : text).replace(/\/+$/, '')
    return { kind: 'local', folder: folder === '' ? '/' : folder }
  }
  if (/^(\.\.?(\/|$)|~)/.test(text)) return { kind: 'refused', reason: `"${text}" is not an absolute path: give the folder's whole path, starting with /; ~ is not expanded.` }
  if (isRemoteSource(text)) return { kind: 'remote', source: text }
  return { kind: 'refused', reason: `"${text}" is not a folder starting with /, a GitHub owner/repo, an https:// URL or a git@host:path URL, so it is not added.` }
}

/**
 * The marketplace name a folder's marketplace.json declares: its top-level "name", which must be a name a section of the
 * pane may carry (isMarketplaceName). Throws, with the reason the pane shows, for text that is not JSON, a missing name,
 * a name that is not text, or one isMarketplaceName refuses (shown through printable).
 */
export function marketplaceNameOf(text: string): string {
  const data: unknown = JSON.parse(text)
  const name = typeof data === 'object' && data !== null && !Array.isArray(data) ? (data as Record<string, unknown>).name : undefined
  if (name === undefined) throw new Error('it has no top-level "name"')
  if (typeof name !== 'string') throw new Error('its top-level "name" is not text')
  if (!isMarketplaceName(name)) throw new Error(`its name "${printable(name)}" is not a lowercase marketplace name`)
  return name
}

/** A path with its trailing slashes removed, so /a/b/ and /a/b compare equal on both sides of a comparison. */
const withoutTrailingSlashes = (path: string): string => path.replace(/\/+$/, '')

/** A directory source's path, without its trailing slashes, or undefined for any other source. */
const directoryPath = (source: MarketSource | undefined): string | undefined =>
  source?.kind === 'directory' && source.path !== undefined ? withoutTrailingSlashes(source.path) : undefined

/** How the pane names a marketplace's source: its kind and the field that kind is known by, through printable. */
export function sourceText(source: MarketSource | undefined): string {
  if (source === undefined) return 'a source the marketplace list does not name'
  const where = source.kind === 'directory' ? source.path : source.kind === 'github' ? source.repo : source.kind === 'git' ? source.url : undefined
  return printable(where === undefined ? `a ${source.kind} source` : `${source.kind} ${where}`)
}

/**
 * What adding `folder`, whose marketplace.json names `name`, would do against the marketplace list (2j): the same name
 * from the same folder is already added; the same name from any other source would be re-pointed, so it is refused; the
 * same folder under another name (its marketplace.json renamed since) is refused, since what the add does then is not
 * measured; anything else is free. Paths compare with their trailing slashes removed on both sides; symbolic links are
 * not resolved.
 */
export type AddDecision = { kind: 'free' } | { kind: 'already' } | { kind: 'taken'; other: string } | { kind: 'renamed'; other: string }

export function addDecision(name: string, folder: string, marketplaces: readonly Marketplace[]): AddDecision {
  const path = withoutTrailingSlashes(folder)
  const sameName = marketplaces.find((marketplace) => marketplace.name === name)
  if (sameName !== undefined) return directoryPath(sameName.source) === path ? { kind: 'already' } : { kind: 'taken', other: sourceText(sameName.source) }
  const samePath = marketplaces.find((marketplace) => directoryPath(marketplace.source) === path)
  return samePath === undefined ? { kind: 'free' } : { kind: 'renamed', other: samePath.name }
}

/**
 * The pane's message for a decision. The one for a free name also says what the check cannot see: a folder spelled
 * through a symbolic link, and a marketplace.json changed during the add itself, which is not refused: a marketplace that
 * change re-points is named by the list comparison after the add (changedSources), and one renamed to a new name is added
 * under it while addChecked's message after the add keeps the name the question showed; only the list read after the add
 * shows the real one (its section, or the next Refresh when that read fails). One renamed before the add is refused when
 * addChecked reads it again (renamedSinceText).
 */
export function addDecisionText(decision: AddDecision, name: string, folder: string): string {
  const [shown, at] = [printable(name), printable(folder)]
  if (decision.kind === 'already') return `The marketplace ${shown} is already added from ${at}: nothing was run.`
  if (decision.kind === 'taken')
    return `Not added: the marketplace ${shown} is already added from ${decision.other}, and ${at} names the same marketplace, so adding it would point ${shown} at ${at}. Nothing was run.`
  if (decision.kind === 'renamed')
    return `Not added: ${at} is already added as the marketplace ${printable(decision.other)}, and its marketplace.json now names it ${shown}; what claude plugin marketplace add does then is not known, so nothing was run.`
  return `The marketplace ${shown} from ${at} is not added yet. The pane does not resolve symbolic links, so a folder spelled through one may name a marketplace already added from its real path. Its marketplace.json is read again just before the add, and a name changed since is refused; one changed during the add itself is not: a marketplace it re-points is named afterwards by comparing the marketplace list before and after the add, and one renamed to a new name is added under it.`
}

/**
 * The message when the folder's marketplace.json, read again under the claim just before the add, names another
 * marketplace than the question did (2j, review of M3b): the add is refused, since the new name may be one already added,
 * which the add would re-point. Every name and the folder through printable.
 */
export function renamedSinceText(asked: string, now: string, folder: string): string {
  return `Not added: the marketplace.json of ${printable(folder)} now names ${printable(now)}, not ${printable(asked)} as the question said, so nothing was run; press a: Add marketplace to check it again.`
}

/** The label the person must pick for the add to run; any other answer, or none, runs nothing. */
export const ADD_LABEL = 'Add it'

/**
 * The argument vector of the add (2j). It goes to $.process.run, never to a shell, and has no -y. A folder that starts
 * with "/" can never be read as an option, so any other folder is refused here again.
 */
export function addArgv(claude: string, folder: string): string[] {
  if (!folder.startsWith('/')) throw new Error(`refused: "${folder}" is not an absolute folder`)
  return [claude, 'plugin', 'marketplace', 'add', folder]
}

/** The question of an add: it shows the exact argv, with claude as the name the person knows. */
export function addQuestion(name: string, folder: string): string {
  return `Add the marketplace ${printable(name)} from ${printable(folder)}? This runs ${printable(JSON.stringify(addArgv('claude', folder)))}. Its plugins are then listed here; the add installs none of them.`
}

/** A source as a comparable key: its kind and its fields, a path without its trailing slashes. */
export const sourceKey = (source: MarketSource | undefined): string =>
  JSON.stringify(source === undefined ? null : [source.kind, source.path === undefined ? null : withoutTrailingSlashes(source.path), source.repo ?? null, source.url ?? null])

/** A marketplace whose source an add changed, with what it was and what it is, each as sourceText names it. */
export type ChangedSource = { name: string; was: string; now: string }

/**
 * Every marketplace of the list before the add whose source differs in the list after it (2j): a marketplace.json edited
 * between the check and the add, or a spelling the check could not match, can re-point one. The pane changes none back.
 */
export function changedSources(before: readonly Marketplace[], after: readonly Marketplace[]): ChangedSource[] {
  const changed: ChangedSource[] = []
  for (const earlier of before) {
    const later = after.find((marketplace) => marketplace.name === earlier.name)
    if (later !== undefined && sourceKey(later.source) !== sourceKey(earlier.source)) changed.push({ name: earlier.name, was: sourceText(earlier.source), now: sourceText(later.source) })
  }
  return changed
}

/** One changed marketplace, for the default log and the pane's message. */
export function changedLine(change: ChangedSource): string {
  return `The marketplace ${printable(change.name)} now comes from ${change.now}, not ${change.was}; the pane did not change it back.`
}

/** The first line claude printed when the add failed, cut and through printable; the debug log gets the whole output. */
export function addFailedText(output: string): string {
  return `claude plugin marketplace add failed: ${printable(fitLabel(firstLine(output.trim()), REASON_ROOM))}.`
}

/**
 * The plugin skill that installs from a remote source, by the name Claude Code lists it under: a plugin's skills are
 * namespaced as /plugin-name:skill-name (skills chapter, skills/mods-doc-skills-reference/references/chapter.md lines 228
 * and 469). The request names no plugin: the skill's step 2 asks the person for a value that is missing.
 */
const INSTALL_SKILL = '/mods-expert-developer-plugin:mods-install-mod'

/**
 * The text Copy request copies for a remote source (2j): a prompt for Claude, not a shell command, so no shell reads it.
 * The source is written bare: it matched a remote pattern, which admits no space and no quote. Any other source is refused.
 */
export function installRequest(source: string): string {
  if (!isRemoteSource(source)) throw new Error(`refused: "${source}" is not a remote marketplace source`)
  return `${INSTALL_SKILL} --marketplace ${source}`
}

/** The pane's message for a remote source. */
export function remoteText(source: string): string {
  return `${printable(source)} is a remote marketplace: it cannot be checked before it is added, so the pane does not add it. Press c: Copy request and send the text to Claude: ${INSTALL_SKILL} checks the source, asks for the plugin's name and installs it.`
}

/** The toast once the request was copied. The toast helper shows it through printable. */
export function copiedRequestText(request: string): string {
  return `Copied; send it to Claude: ${request}`
}

/** The pane's message when the copy of the request failed: it names the request, so the person can still read it. */
export function notCopiedRequestText(request: string, reason: string): string {
  return `The request could not be copied (${firstLine(reason)}): ${request}`
}

/** The hint drawn after the command's name: the four forms parseCommandArgs takes. */
export const COMMAND_HINT = '[open|close|check|add <source>]'

/** What the command's arguments ask for (2l), or why they are refused. */
export type CommandArgs = { kind: 'open' } | { kind: 'close' } | { kind: 'check' } | { kind: 'add'; source: string } | { kind: 'refused'; reason: string }

const refusedArgs = (why: string): CommandArgs => ({ kind: 'refused', reason: `/${COMMAND} takes nothing or one of: open, close, check, add <source>. ${why}` })

/**
 * Reads the text after the command's name (2l), trimmed: nothing or "open", "close", "check", or "add <source>". A source
 * holds no space unless it is wrapped in single or double quotes, and never a control character; anything else is refused.
 */
export function parseCommandArgs(args: string): CommandArgs {
  const text = args.trim()
  if (text === '' || text === 'open') return { kind: 'open' }
  if (text === 'close' || text === 'check') return { kind: text }
  const add = /^add +(.+)$/s.exec(text)
  if (add === null) return refusedArgs(`"${printable(text)}" is none of them.`)
  const raw = add[1] ?? ''
  if (printable(raw) !== raw) return refusedArgs('The source holds a control character.')
  const quoted = /^'([^']*)'$/.exec(raw) ?? /^"([^"]*)"$/.exec(raw)
  if (quoted !== null) return quoted[1] === '' ? refusedArgs('The source is empty.') : { kind: 'add', source: quoted[1] ?? '' }
  if (/\s/.test(raw)) return refusedArgs('A source with a space must be in single or double quotes.')
  return { kind: 'add', source: raw }
}

/** The pane's message after check: what the catalogs it read are. */
export const CHECK_TEXT = 'The catalogs are local copies, as of the last update of each marketplace; nothing was fetched.'

/** The toast of close when the pane is not open. */
export const NOT_OPEN_TEXT = 'The mods-manager pane is not open.'

// The profile list (TRDD-GSR975M8, increment P2a of design/specs/mod-manager-profiles.md, sections 2.4, 7.3 and 7.6):
// the names of the saved profiles under two lines that explain them, read-only. Every button that makes, changes or
// applies a profile waits for the owner's answers to the spec's questions Q1, Q2, Q3 and Q13 (section 8).

/**
 * How this session can change plugins, from `$.session.surfaces()` (spec section 2.4): `cli` when the terminal is
 * one of them, because `$.process` (CLI only, index.d.ts 3582) can then run `claude plugin`; `desktop` for any other
 * non-empty answer (the Desktop app, VS Code too), where it cannot; `none` for an empty answer, a -p run, where nothing
 * draws. That a Desktop session's answer lacks `terminal` is UNVERIFIED (spec live check L1).
 */
export type ChangePath = 'cli' | 'desktop' | 'none'

export function changePath(surfaces: readonly string[]): ChangePath {
  if (surfaces.includes('terminal')) return 'cli'
  return surfaces.length === 0 ? 'none' : 'desktop'
}

/**
 * DESKTOP_WRITES, owner question Q11, design default `false`: where `$.process` is missing, the only way to change a
 * plugin is to write settings.json in place, and a crash during that write could leave it truncated, losing every
 * setting in it (spec section 3). So the Desktop app stays read-only until the owner accepts that risk.
 */
export const DESKTOP_WRITES = false

/** True where the profiles can be read but not applied: a session that draws on no terminal, while DESKTOP_WRITES is off. */
export const profilesReadOnly = (path: ChangePath | undefined): boolean => path === 'desktop' && !DESKTOP_WRITES

/**
 * The two lines that explain profiles, drawn above the names. The owner asked for "a explanation of two lines of text
 * that will explain what it does and how to create profiles" and gave no text. The first sentence is the design spec's
 * (section 7.3); the rest is P2a's interim wording, not the owner's and not the spec's. It names no button, because P2a
 * draws none that makes, changes or applies a profile (review of 2026-10-31, should-fix 1): the spec's line names NEW
 * PROFILE, DUPLICATE PROFILE, EDIT PROFILE and APPLY PROFILE, which return with the buttons in P2b, after owner question Q1.
 */
export const PROFILES_WHAT_LINE = 'A profile saves which of your user-scope plugins are on or off. The list shows the profiles saved so far.'
export const PROFILES_SOON_LINE = 'Creating, editing and applying profiles from this panel is coming soon.'

/** The part of a Text's props a style token sets. */
export type Look = Pick<TextProps, 'color' | 'dimColor' | 'bold' | 'italic' | 'underline'>

/** The look, the words and the hotkey of the profile list. */
export type Style = {
  explain: Look
  name: Look
  note: Look
  problem: Look
  toggleKey: string
  text: {
    show: string
    hide: string
    explain: readonly string[]
    none: string
    reading: string
    readOnly: string
    inFile: string
    unreadable: string
  }
}

/**
 * STYLE: every look, word and hotkey the profile list draws, so its author restyles it here and nowhere else (module
 * rule of 2026-10-29: the author styles a module, with no colour, mark or label literal outside the defaults). A colour
 * is a theme key, so the list follows the person's theme, and no state is shown by colour alone: each has its words.
 * The tokens of the spec's later views (section 7.6: danger, rule, the toolbar's border, the marks) join this record
 * when P2 draws them.
 */
export const STYLE: Style = {
  explain: { dimColor: true },
  name: { bold: true },
  note: { dimColor: true },
  problem: { color: 'warning' },
  toggleKey: 'p',
  text: {
    show: 'Show profiles',
    hide: 'Hide profiles',
    explain: [PROFILES_WHAT_LINE, PROFILES_SOON_LINE],
    none: 'No profiles yet.',
    reading: 'Reading the profiles…',
    // Drawn while DESKTOP_WRITES is off (owner question Q11), in a session that draws on no terminal. It states only what
    // the mod does there, and no reason: that such a session has no $.process (CLI only, index.d.ts 3582) is UNVERIFIED
    // (spec L1), and the line is shown on any surface but the terminal, VS Code too (review of 2026-10-31, should-fix 2).
    readOnly: 'Applying profiles is not available on this surface yet.',
    inFile: 'File:',
    unreadable: "Couldn't read the profiles:",
  },
}

/**
 * What the pane knows about the profiles file: still being read; read, with its profile names; refused by the strict
 * parse (parseProfiles), with the reason and the file; or failed, with the error of the read itself.
 */
export type ProfileView =
  | { kind: 'reading' }
  | { kind: 'read'; names: readonly string[] }
  | { kind: 'refused'; reason: string; file: string }
  | { kind: 'failed'; error: string }

/** One drawn line of the profile list: its text, its look, and whether it wraps or is cut at the pane's edge. */
export type ProfileLine = { text: string; look: Look; wrap: 'wrap' | 'truncate-end' }

/**
 * Each control or format character (C0, DEL, C1, bidirectional marks, zero-width characters) as "?". A profile name
 * and a refusal come from a file a person can edit, and parseProfiles refuses only control characters in a name, so a
 * right-to-left mark could otherwise make a name read backwards (house convention, Look and feel).
 */
const shownText = (text: string): string => text.replace(/[\p{Cc}\p{Cf}]/gu, '?')

/** By name for the person, without case first; the exact spelling breaks a tie, so the order is always the same. */
const byName = (a: string, b: string): number => compareText(a.toLowerCase(), b.toLowerCase()) || compareText(a, b)

/** The show or hide button's label: the key it answers to, then what a press does. */
export function profilesToggleLabel(shown: boolean, style: Style): string {
  return `${style.toggleKey}: ${shown ? style.text.hide : style.text.show}`
}

/**
 * The lines of the profile list while it is shown: the two explanation lines, the read-only line where the profiles are
 * read-only, then the names sorted by name, or one line that says there are none, that they are being read, or why
 * they are not shown.
 */
export function profileLines(view: ProfileView, readOnly: boolean, style: Style): ProfileLine[] {
  const note = (text: string, look: Look): ProfileLine => ({ text, look, wrap: 'wrap' })
  const head = [...style.text.explain.map((text) => note(text, style.explain)), ...(readOnly ? [note(style.text.readOnly, style.note)] : [])]
  switch (view.kind) {
    case 'reading':
      return [...head, note(style.text.reading, style.note)]
    case 'refused':
      return [...head, note(`${shownText(view.reason)} ${style.text.inFile} ${shownText(view.file)}`, style.problem)]
    case 'failed':
      return [...head, note(`${style.text.unreadable} ${shownText(view.error)}`, style.problem)]
    case 'read':
      if (view.names.length === 0) return [...head, note(style.text.none, style.note)]
      return [...head, ...[...view.names].sort(byName).map((name): ProfileLine => ({ text: shownText(name), look: style.name, wrap: 'truncate-end' }))]
  }
}
