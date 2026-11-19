// mod-manager profiles (TRDD-GSR975M8, increment P1b of design/specs/mod-manager-profiles.md, sections 2.2 and 4): the
// profiles file (mods-profiles.json, schema 1), the names, the operations on profiles, and the apply plan. Pure: no $, so
// every rule runs in a plain test. The file reads and the guarded write are in ./files.ts; the installed_plugins.json
// parser is in ./installed.ts.
import type { FileInstall } from './installed'

/** One plugin in a profile: on or off, and whether it was a mod when the entry was last saved. */
export type ProfileEntry = { enabled: boolean; isMod: boolean }

export type Profile = {
  /** `p-` and the creation time in base 36; stable across renames, so a record that names it survives one. */
  id: string
  name: string
  createdAt: string
  updatedAt: string
  /** One entry per plugin id. An entry whose plugin is not installed stays, and is applied once it is installed again. */
  plugins: Record<string, ProfileEntry>
}

export type ProfilesFile = { schema: 1; profiles: Profile[] }

/** What a parse or an operation gives: the new value, or the reason it was refused. */
export type Result<T> = { ok: true; value: T } | { ok: false; reason: string }

/** One source's enabledPlugins: plugin id to true or false (files.ts enabledMapOf checks the values). */
export type EnabledMap = Readonly<Record<string, boolean>>

/** The settings sources that can stop or outrank a user-scope value (spec section 4). */
export type Locks = { policy: EnabledMap; flag: EnabledMap; project: EnabledMap; local: EnabledMap }

// Defaults for open owner questions (spec section 8) and for rules the agent added. Each is one constant, so a
// different answer is a change here and nowhere else.

/**
 * NAME_RULE, this design's addition (card interpretation 5), not the owner's: a name is trimmed, 1 to `maxLength`
 * characters (code points), holds no control characters, and is unique when compared after `normalization` and, with
 * `comparedWithoutCase`, lowercasing: "work" clashes with "Work", and a composed "é" with a decomposed one. The person's
 * own spelling is stored either way.
 */
export const NAME_RULE = { maxLength: 64, normalization: 'NFC', comparedWithoutCase: true } as const

/**
 * KEEP_SELF_ON, owner question Q6, design default: APPLY never turns this plugin itself off, so the manager stays
 * reachable; such an entry is listed as kept on (TRDD-J4HRAQF0: "a preset never disables this plugin itself"). INFERRED.
 */
export const KEEP_SELF_ON = true

/**
 * PROFILE_ORIGIN, owner question Q15, design default: profiles record and apply only user-scope plugins installed from a
 * marketplace (profileInstalls), never skills-folder, session-only, built-in or synced ones. The only value built: a yes to
 * Q15 needs a source that lists skills-folder plugins, which installed_plugins.json is not documented to do (INFERRED),
 * so it is more than a change to this line.
 */
export const PROFILE_ORIGIN = 'marketplace' as const

/**
 * The origins Claude Code gives plugins that do not come from a marketplace; no marketplace may take these names
 * (marketplace manifest chapter, line 63). A new one the docs add must be added here, or its plugins enter profiles.
 */
export const NON_MARKETPLACE_ORIGINS = ['inline', 'builtin', 'skills-dir', 'synced', 'claude-plugin-test'] as const

/**
 * The state of an installed plugin that has no enabledPlugins key: on, the documented default of a manifest's
 * `defaultEnabled` (plugin manifest chapter, lines 222-224). A manifest that sets its own `defaultEnabled` is not read here.
 */
export const ENABLED_WHEN_UNSET = true

export const PROFILES_SCHEMA = 1
const FILE = 'mods-profiles.json'
const PROFILE_ID = /^p-[0-9a-z]+$/
const PROFILE_KEYS = ['id', 'name', 'createdAt', 'updatedAt', 'plugins'] as const
const ENTRY_KEYS = ['enabled', 'isMod'] as const

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error))
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const refuse = <T>(reason: string): Result<T> => ({ ok: false, reason })
const accept = <T>(value: T): Result<T> => ({ ok: true, value })
const compareText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)
const isTime = (value: unknown): value is string => typeof value === 'string' && !Number.isNaN(Date.parse(value))

/** Why an object's keys are not exactly `keys`, or undefined when they are. */
function keysProblem(value: Record<string, unknown>, keys: readonly string[]): string | undefined {
  const missing = keys.filter((key) => !Object.hasOwn(value, key))
  const extra = Object.keys(value).filter((key) => !keys.includes(key))
  if (missing.length > 0) return `has no ${missing.join(', ')}`
  // An unknown key is refused, not skipped: the next save writes only what was read, so it would silently drop it.
  if (extra.length > 0) return `has keys this mod does not know (${extra.join(', ')}), which a save would drop`
  return undefined
}

/** The text two names are compared by. */
function nameKey(name: string): string {
  const composed = name.normalize(NAME_RULE.normalization)
  return NAME_RULE.comparedWithoutCase ? composed.toLowerCase() : composed
}

/**
 * Why `text` cannot name a profile, or undefined when it can. The text is trimmed first, as it is when stored.
 * `selfId` is the profile being renamed, which may keep its own name in another case.
 */
export function nameProblem(text: string, profiles: readonly Profile[], selfId: string | undefined): string | undefined {
  const name = text.trim()
  if (name === '') return 'A profile needs a name.'
  if ([...name].length > NAME_RULE.maxLength) return `A profile name has at most ${NAME_RULE.maxLength} characters.`
  // A control character could move the terminal's cursor or colours wherever the name is drawn.
  if (/\p{Cc}/u.test(name)) return 'A profile name cannot hold control characters.'
  const key = nameKey(name)
  const other = profiles.find((profile) => profile.id !== selfId && nameKey(profile.name) === key)
  if (other !== undefined) return `A profile named ${other.name} already exists${NAME_RULE.comparedWithoutCase ? '; names are compared without case' : ''}.`
  return undefined
}

/** One profile of the file, checked against the ones before it; a clean copy, or the reason it is refused. */
function readProfile(item: unknown, earlier: readonly Profile[]): Result<Profile> {
  if (!isRecord(item)) return refuse('is not an object')
  const keys = keysProblem(item, PROFILE_KEYS)
  if (keys !== undefined) return refuse(keys)
  const { id, name, createdAt, updatedAt, plugins } = item
  if (typeof id !== 'string' || !PROFILE_ID.test(id)) return refuse(`has an id that is not p- and base 36 (${JSON.stringify(id)})`)
  if (earlier.some((profile) => profile.id === id)) return refuse(`has the id ${id} of an earlier profile`)
  if (typeof name !== 'string' || name !== name.trim()) return refuse('has a name that is not text without spaces at its ends')
  const problem = nameProblem(name, earlier, undefined)
  if (problem !== undefined) return refuse(`has a name this mod refuses: ${problem}`)
  if (!isTime(createdAt) || !isTime(updatedAt)) return refuse('has a createdAt or updatedAt that is not a time')
  if (!isRecord(plugins)) return refuse('has plugins that are not an object')
  const entries: Record<string, ProfileEntry> = {}
  for (const [pluginId, entry] of Object.entries(plugins)) {
    if (pluginId === '') return refuse('has a plugin with an empty id')
    if (!isRecord(entry)) return refuse(`has plugin ${pluginId}, which is not an object`)
    const entryKeys = keysProblem(entry, ENTRY_KEYS)
    if (entryKeys !== undefined) return refuse(`has plugin ${pluginId}, which ${entryKeys}`)
    if (typeof entry.enabled !== 'boolean' || typeof entry.isMod !== 'boolean') return refuse(`has plugin ${pluginId}, whose enabled or isMod is not true or false`)
    entries[pluginId] = { enabled: entry.enabled, isMod: entry.isMod }
  }
  return accept({ id, name, createdAt, updatedAt, plugins: entries })
}

/**
 * Reads mods-profiles.json strictly. Undefined (no file) is an empty list. A text that is not JSON, has a schema other
 * than 1, or holds one profile or entry of another shape is refused as a whole, because accepting the rest would drop
 * the unread part at the next save (spec section 2.2).
 */
export function parseProfiles(text: string | undefined): Result<ProfilesFile> {
  if (text === undefined) return accept({ schema: PROFILES_SCHEMA, profiles: [] })
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (error) {
    return refuse(`${FILE} is not JSON (${messageOf(error)}).`)
  }
  if (!isRecord(data)) return refuse(`${FILE} is not a JSON object.`)
  if (data.schema !== PROFILES_SCHEMA) return refuse(`${FILE} has schema ${JSON.stringify(data.schema)}; this mod reads schema ${PROFILES_SCHEMA} only.`)
  const keys = keysProblem(data, ['schema', 'profiles'])
  if (keys !== undefined) return refuse(`${FILE} ${keys}.`)
  if (!Array.isArray(data.profiles)) return refuse(`${FILE} has profiles that are not a list.`)
  const profiles: Profile[] = []
  for (const [index, item] of data.profiles.entries()) {
    const profile = readProfile(item, profiles)
    if (!profile.ok) return refuse(`${FILE}: profile ${index + 1} ${profile.reason}.`)
    profiles.push(profile.value)
  }
  return accept({ schema: PROFILES_SCHEMA, profiles })
}

/** The file's text: two-space JSON and a final newline. */
export function serializeProfiles(file: ProfilesFile): string {
  return `${JSON.stringify(file, null, 2)}\n`
}

/** `p-` and `now` in base 36, raised by one until no profile has it. */
function newId(now: number, profiles: readonly Profile[]): string {
  const taken = new Set(profiles.map((profile) => profile.id))
  let stamp = Math.trunc(now)
  while (taken.has(`p-${stamp.toString(36)}`)) stamp += 1
  return `p-${stamp.toString(36)}`
}

const copyEntries = (plugins: Readonly<Record<string, ProfileEntry>>): Record<string, ProfileEntry> =>
  Object.fromEntries(Object.entries(plugins).map(([id, entry]) => [id, { enabled: entry.enabled, isMod: entry.isMod }]))

function withProfile(file: ProfilesFile, id: string): Result<Profile> {
  const profile = file.profiles.find((member) => member.id === id)
  return profile === undefined ? refuse(`No profile has the id ${id}.`) : accept(profile)
}

/** A new profile from `snapshot` (snapshotUserScope), added last, so the file keeps creation order. */
export function createProfile(name: string, snapshot: Readonly<Record<string, ProfileEntry>>, now: number, file: ProfilesFile): Result<ProfilesFile> {
  const problem = nameProblem(name, file.profiles, undefined)
  if (problem !== undefined) return refuse(problem)
  const at = new Date(now).toISOString()
  const profile: Profile = { id: newId(now, file.profiles), name: name.trim(), createdAt: at, updatedAt: at, plugins: copyEntries(snapshot) }
  return accept({ schema: PROFILES_SCHEMA, profiles: [...file.profiles, profile] })
}

/** A copy of one profile, every entry included, named `<name> copy`, then `<name> copy 2` and on, cut to fit the length limit. */
export function duplicateProfile(file: ProfilesFile, sourceId: string, now: number): Result<ProfilesFile> {
  const source = withProfile(file, sourceId)
  if (!source.ok) return source
  for (let n = 1; ; n += 1) {
    const suffix = n === 1 ? ' copy' : ` copy ${n}`
    const base = [...source.value.name].slice(0, NAME_RULE.maxLength - suffix.length).join('').trimEnd()
    if (nameProblem(`${base}${suffix}`, file.profiles, undefined) === undefined) return createProfile(`${base}${suffix}`, source.value.plugins, now, file)
  }
}

export function renameProfile(file: ProfilesFile, id: string, name: string, now: number): Result<ProfilesFile> {
  const target = withProfile(file, id)
  if (!target.ok) return target
  const problem = nameProblem(name, file.profiles, id)
  if (problem !== undefined) return refuse(problem)
  const updatedAt = new Date(now).toISOString()
  return accept({ schema: PROFILES_SCHEMA, profiles: file.profiles.map((profile) => (profile.id === id ? { ...profile, name: name.trim(), updatedAt } : profile)) })
}

export function deleteProfile(file: ProfilesFile, id: string): Result<ProfilesFile> {
  const target = withProfile(file, id)
  if (!target.ok) return target
  return accept({ schema: PROFILES_SCHEMA, profiles: file.profiles.filter((profile) => profile.id !== id) })
}

/**
 * Saves edited entries. The draft must hold exactly the profile's plugin ids, so an entry whose plugin is not installed
 * survives the edit (card REVIEW 2, point 4), and no plugin is added (spec owner question Q8: not designed).
 */
export function saveEdits(file: ProfilesFile, id: string, draft: Readonly<Record<string, ProfileEntry>>, now: number): Result<ProfilesFile> {
  const target = withProfile(file, id)
  if (!target.ok) return target
  const before = Object.keys(target.value.plugins)
  const after = Object.keys(draft)
  if (before.length !== after.length || !before.every((pluginId) => Object.hasOwn(draft, pluginId))) {
    return refuse('The edits do not list the same plugins as the profile. Nothing was saved.')
  }
  const updatedAt = new Date(now).toISOString()
  return accept({ schema: PROFILES_SCHEMA, profiles: file.profiles.map((profile) => (profile.id === id ? { ...profile, plugins: copyEntries(draft), updatedAt } : profile)) })
}

/** The user-scope value of an installed plugin: its enabledPlugins value, or ENABLED_WHEN_UNSET when it has none. */
function stateOf(enabledPlugins: EnabledMap, id: string): boolean {
  return Object.hasOwn(enabledPlugins, id) ? enabledPlugins[id] === true : ENABLED_WHEN_UNSET
}

/** One entry per installed user-scope marketplace plugin (profileInstalls) with its state now: what NEW PROFILE saves. */
export function snapshotUserScope(installs: readonly FileInstall[], enabledPlugins: EnabledMap, isMod: (id: string) => boolean): Record<string, ProfileEntry> {
  return Object.fromEntries(profileInstalls(installs).map((install) => [install.id, { enabled: stateOf(enabledPlugins, install.id), isMod: isMod(install.id) }]))
}

/**
 * Where an id says its plugin came from: `marketplace` for `<name>@<marketplace>`, `other` for one of
 * NON_MARKETPLACE_ORIGINS or an id with no origin. The origins are a deny-list: no marketplace may take their names, so
 * any other origin is a marketplace's (marketplace manifest chapter, lines 54-66).
 */
function originOf(id: string): 'marketplace' | 'other' {
  const at = id.indexOf('@')
  const origin = at < 0 ? '' : id.slice(at + 1)
  return origin !== '' && !(NON_MARKETPLACE_ORIGINS as readonly string[]).includes(origin) ? 'marketplace' : 'other'
}

/** The installs a profile records and applies: user scope, and from the origin PROFILE_ORIGIN names. */
export function profileInstalls(installs: readonly FileInstall[]): FileInstall[] {
  return installs.filter((install) => install.scope === 'user' && originOf(install.id) === PROFILE_ORIGIN)
}

/**
 * What APPLY does with each entry (spec section 4): `change` writes it; `same` needs nothing; `not-installed` stays in
 * the profile and is applied once the plugin is installed; `kept-on` is an entry that would turn this plugin itself off
 * (KEEP_SELF_ON); `locked` is set by managed (`policy`) or `--settings` (`flag`) settings, which a user value
 * cannot change. `overridden` marks an entry that a project or local setting outranks in this folder: it is still written.
 */
export type PlanKind = 'change' | 'same' | 'not-installed' | 'kept-on' | 'locked'
export type PlanItem = { id: string; want: boolean; now: boolean | undefined; kind: PlanKind; overridden: boolean }

/** The name part of `name@marketplace`, which is what $.plugin.name answers for this plugin. */
const nameOf = (id: string): string => (id.includes('@') ? id.slice(0, id.indexOf('@')) : id)

/** The plan for applying `profile`, one item per entry, by id. Every skip is an item, so the caller can list it. */
export function applyPlan(profile: Profile, installs: readonly FileInstall[], enabledPlugins: EnabledMap, locks: Locks, selfName: string): PlanItem[] {
  const installed = new Set(profileInstalls(installs).map((install) => install.id))
  return Object.entries(profile.plugins)
    .sort(([a], [b]) => compareText(a, b))
    .map(([id, entry]): PlanItem => {
      const want = entry.enabled
      if (!installed.has(id)) return { id, want, now: undefined, kind: 'not-installed', overridden: false }
      const now = stateOf(enabledPlugins, id)
      const overridden = Object.hasOwn(locks.project, id) || Object.hasOwn(locks.local, id)
      if (now === want) return { id, want, now, kind: 'same', overridden }
      if (Object.hasOwn(locks.policy, id) || Object.hasOwn(locks.flag, id)) return { id, want, now, kind: 'locked', overridden }
      if (KEEP_SELF_ON && !want && nameOf(id) === selfName) return { id, want, now, kind: 'kept-on', overridden }
      return { id, want, now, kind: 'change', overridden }
    })
}
