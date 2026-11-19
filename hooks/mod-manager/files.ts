// mod-manager's profile files (TRDD-GSR975M8, increment P1b of design/specs/mod-manager-profiles.md, sections 1.3, 2 and
// 3): where the files are, the $.env, $.fs and $.settings calls, and the guarded write of mods-profiles.json (section 3,
// steps 1 to 3 and 6 to 8). Since P2a the pane's profile list reads mods-profiles.json through engineIo and readProfiles
// (state.ts readProfileList); the guarded write has no caller until a button saves a profile.
//
// The reads and the guarded write take a file port, FileIo, not $. The engine's port is engineIo($). The tests of the
// guarded write pass a disk in memory instead, because a kit test reaches mod code only through the mod's own hooks: a
// test's own hook may not call the mods API (claude plugin test, 2.1.316: "test: $.fs.read refused: its hooks module
// does not call it"), and a plugin a test declares inline is loaded as a module of its own, without the mod's files.
import type { EngineInterface, FsEntry, FsStat, SettingsSource } from 'claude-code'

import { type InstalledFile, parseInstalledFile } from './installed'
import { type EnabledMap, type Locks, type ProfilesFile, type Result, parseProfiles, serializeProfiles } from './profiles'

/**
 * PROFILES_DIR, owner question Q5, design default: the profiles folder, under the home folder: the owner's literal
 * ~/.claude/.mod-manager/, even when CLAUDE_CONFIG_DIR moves the rest of the configuration (card ruling; spec sections 1.3
 * and 2.1). Following CLAUDE_CONFIG_DIR instead is a change to profilesPlace.
 */
export const PROFILES_DIR = '.claude/.mod-manager'
export const PROFILES_FILE_NAME = 'mods-profiles.json'

/** The $.fs calls the profile files need. `stat` always resolves where the path lands (`{ resolve: true }`). */
export type FileIo = {
  exists: (path: string) => Promise<boolean>
  stat: (path: string) => Promise<FsStat>
  list: (path: string) => Promise<readonly FsEntry[]>
  read: (path: string) => Promise<string>
  write: (path: string, text: string) => Promise<void>
}

/** The engine's file port: each call written in full, as engineAsk in ./state.ts does for $.ui.ask. */
export function engineIo($: EngineInterface): FileIo {
  return {
    exists: (path) => $.fs.exists(path),
    stat: (path) => $.fs.stat(path, { resolve: true }),
    list: (path) => $.fs.list(path),
    read: (path) => $.fs.read(path),
    write: (path, text) => $.fs.write(path, text),
  }
}

/** The home folder: HOME, or USERPROFILE where HOME is unset, as on Windows (settings chapter, line 453). */
export function homeFrom(home: string | undefined, userProfile: string | undefined): string {
  if (home !== undefined && home !== '') return home
  if (userProfile !== undefined && userProfile !== '') return userProfile
  throw new Error('Neither HOME nor USERPROFILE is set, so the profile files cannot be placed.')
}

/** The env names are string literals: the host refuses an $.env.get whose name the module does not spell. */
export async function homeFolder($: EngineInterface): Promise<string> {
  return homeFrom(await $.env.get('HOME'), await $.env.get('USERPROFILE'))
}

/** Claude Code's configuration folder: CLAUDE_CONFIG_DIR when set (settings chapter, line 453), else ~/.claude. */
export function configFrom(configDir: string | undefined, home: string): string {
  return configDir !== undefined && configDir !== '' ? configDir : `${home}/.claude`
}

export async function configFolder($: EngineInterface): Promise<string> {
  return configFrom(await $.env.get('CLAUDE_CONFIG_DIR'), await homeFolder($))
}

/** Where Claude Code records installs (plugin loading chapter, line 47). */
export function installedPathOf(config: string): string {
  return `${config}/plugins/installed_plugins.json`
}

/** The home folder, the folder that holds the profiles folder (~/.claude), the profiles folder, and the profiles file. */
export type ProfilesPlace = { home: string; parent: string; folder: string; file: string }

/**
 * Each path is the home folder plus parts of PROFILES_DIR, joined with `/`; the parent is cut from the constant, never
 * from the home folder. On Windows a home folder spelled with `\` thus gives a path with both separators, which the file
 * system accepts; the realPath compare in saveProfiles takes either separator.
 */
export function profilesPlace(home: string): ProfilesPlace {
  const base = home.replace(/[\\/]+$/, '')
  const parent = `${base}/${PROFILES_DIR.slice(0, PROFILES_DIR.lastIndexOf('/'))}`
  const folder = `${base}/${PROFILES_DIR}`
  return { home: base, parent, folder, file: `${folder}/${PROFILES_FILE_NAME}` }
}

/** The profiles file as read now: its text (undefined when there is none) and the strict parse of it. */
export async function readProfiles(io: FileIo, path: string): Promise<{ text: string | undefined; parsed: Result<ProfilesFile> }> {
  const text = (await io.exists(path)) ? await io.read(path) : undefined
  return { text, parsed: parseProfiles(text) }
}

/** installed_plugins.json as read now. No file means nothing is installed yet, and `isMissing` says so. Throws on a refused file. */
export async function readInstalled(io: FileIo, path: string): Promise<InstalledFile & { isMissing: boolean }> {
  if (!(await io.exists(path))) return { installs: [], rejected: [], isMissing: true }
  return { ...parseInstalledFile(await io.read(path)), isMissing: false }
}

/**
 * One source's enabledPlugins. Absent is an empty map. Anything but an object of true and false is refused, never
 * guessed at: a lock or a state read from a value of another type would be a guess (spec section 3, step 3).
 */
export function enabledMapOf(settings: Readonly<Record<string, unknown>>, source: SettingsSource): EnabledMap {
  const value = settings.enabledPlugins
  if (value === undefined) return {}
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`the ${source} settings have an enabledPlugins that is not an object`)
  const odd = Object.entries(value).filter(([, state]) => typeof state !== 'boolean')
  if (odd.length > 0) throw new Error(`the ${source} settings set ${odd.map(([id]) => id).join(', ')} in enabledPlugins to something other than true or false`)
  return value as EnabledMap
}

/** enabledPlugins of the user settings and of each source that can lock or outrank it (spec section 4). */
export async function readEnabledSources($: EngineInterface): Promise<{ user: EnabledMap } & Locks> {
  return {
    user: enabledMapOf(await $.settings.read({ source: 'user' }), 'user'),
    project: enabledMapOf(await $.settings.read({ source: 'project' }), 'project'),
    local: enabledMapOf(await $.settings.read({ source: 'local' }), 'local'),
    policy: enabledMapOf(await $.settings.read({ source: 'policy' }), 'policy'),
    flag: enabledMapOf(await $.settings.read({ source: 'flag' }), 'flag'),
  }
}

/**
 * How a save ended. `refused`: nothing was written. `unconfirmed`: the file was written, but what reads back is not what
 * was written (another writer, or a damaged file); the reason says to check it.
 */
export type SaveResult = { kind: 'saved'; file: ProfilesFile; text: string } | { kind: 'refused'; reason: string } | { kind: 'unconfirmed'; reason: string }

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error))
const refused = (reason: string): SaveResult => ({ kind: 'refused', reason })
const unconfirmed = (reason: string): SaveResult => ({ kind: 'unconfirmed', reason })
const NOTHING = 'Nothing was written.'
const leadsNowhere = (path: string): string => `${path} is a link that leads nowhere, or where it leads was withheld. ${NOTHING}`
const CHANGED = `${PROFILES_FILE_NAME} changed since it was read. Nothing was written; check the profiles and press again.`

/** True when `path` is inside `folder`, with either separator, as a realPath is spelled on its system. */
function isInside(path: string, folder: string): boolean {
  const base = folder.replace(/[\\/]+$/, '')
  return path.startsWith(`${base}/`) || path.startsWith(`${base}\\`)
}

/** Where the write would land: `isNew` when the file is not there yet, or the reason nothing may be written. */
type Placement = { isNew: boolean } | { problem: string }

/** A place's last part: profilesPlace joins every part with `/`, whatever separator the home folder uses. */
const nameIn = (path: string): string => path.slice(path.lastIndexOf('/') + 1)

/**
 * Step 1 of spec section 3, top down: ~/.claude, then the profiles folder, then the file. Each one that stats must
 * resolve to a real folder (or, for the file, a real file inside the profiles folder as it resolves). A stat with no
 * realPath is a link that leads nowhere, or one a hook withheld (FsStat.realPath, index.d.ts 5175-5186): writing through
 * it would create its target wherever it points, so it is refused.
 *
 * $.fs.stat rejects for a missing path (index.d.ts 3359-3360), and a host may also reject for a link that leads nowhere.
 * The listing of the level above tells the two apart, because it names a link as it stands (FsEntry): named, it is
 * refused; not named, it is missing, and the write creates it and everything below it (TYPES 3332-3338). The level above
 * has passed its own check by then, which is the "nearest folder that exists" check of step 1.
 */
async function placeCheck(io: FileIo, place: ProfilesPlace): Promise<Placement> {
  const levels = [
    { path: place.parent, above: place.home, kind: 'dir' },
    { path: place.folder, above: place.parent, kind: 'dir' },
    { path: place.file, above: place.folder, kind: 'file' },
  ] as const
  let folderReal = ''
  for (const level of levels) {
    let stat: FsStat
    try {
      stat = await io.stat(level.path)
    } catch (error) {
      const names = (await io.list(level.above)).map((entry) => entry.name)
      if (names.includes(nameIn(level.path))) {
        return { problem: `${level.path} is listed in ${level.above}, but where it leads cannot be checked (${messageOf(error)}): a link that leads nowhere, or an entry this mod cannot read. ${NOTHING}` }
      }
      return { isNew: true }
    }
    if (stat.realPath === undefined) return { problem: leadsNowhere(level.path) }
    if (stat.kind !== level.kind) return { problem: `${level.path} is not a ${level.kind === 'dir' ? 'folder' : 'file'}. ${NOTHING}` }
    if (level.kind === 'dir') {
      folderReal = stat.realPath
      continue
    }
    // Compared with the folder resolved the same way, as the FsStat.realPath remark advises: a home folder or a
    // ~/.claude that is itself a link (a dotfiles setup) is not refused, only a file that leads out of its own folder is.
    if (!isInside(stat.realPath, folderReal)) return { problem: `${place.file} is a link to ${stat.realPath}, outside ${place.folder}. ${NOTHING}` }
  }
  return { isNew: false }
}

/**
 * Step 6: an operation changes one profile (adds, changes or removes it) and leaves the others as they were, in their
 * order. More is a bug in the operation, and nothing is written (spec section 3: "only in what the operation changed").
 */
function changesOneProfile(before: ProfilesFile, after: ProfilesFile): boolean {
  const old = new Map(before.profiles.map((profile) => [profile.id, JSON.stringify(profile)]))
  const now = new Map(after.profiles.map((profile) => [profile.id, JSON.stringify(profile)]))
  const changed = [...now].filter(([id, text]) => old.get(id) !== text).length + [...old.keys()].filter((id) => !now.has(id)).length
  const keptBefore = before.profiles.map((profile) => profile.id).filter((id) => now.has(id))
  const keptAfter = after.profiles.map((profile) => profile.id).filter((id) => old.has(id))
  return changed <= 1 && keptBefore.join('\n') === keptAfter.join('\n')
}

/**
 * The guarded write of mods-profiles.json (spec section 3, steps 1 to 3 and 6 to 8). It takes the home folder, not a
 * path, so a caller cannot point it at another file: it writes profilesPlace(home).file and nothing else. `seenText` is
 * the text the caller last read (undefined: no file), and `edit` makes the new value from the file as it is now. The
 * file is written in place: the mods API has no rename and no chmod, so a temporary file and mode 0600 cannot be built
 * (spec section 3; owner question Q10).
 */
export async function saveProfiles(io: FileIo, home: string, seenText: string | undefined, edit: (file: ProfilesFile) => Result<ProfilesFile>): Promise<SaveResult> {
  const place = profilesPlace(home)
  let next: ProfilesFile
  let text: string
  try {
    const placement = await placeCheck(io, place)
    if ('problem' in placement) return refused(placement.problem)
    // Step 2: the whole text must still be what the caller read, so an edit by another session or by hand is never
    // overwritten with a value built from an older read.
    const current = placement.isNew ? undefined : await io.read(place.file)
    if (current !== seenText) return refused(CHANGED)
    // Step 3: a file this mod refuses to read is never rewritten, because the save would drop what it could not read.
    const parsed = parseProfiles(current)
    if (!parsed.ok) return refused(`${parsed.reason} ${NOTHING} Fix ${place.file} and press again.`)
    const edited = edit(parsed.value)
    if (!edited.ok) return refused(edited.reason)
    next = edited.value
    if (!changesOneProfile(parsed.value, next)) return refused(`This mod built a change to more than one profile, or moved them (a bug). ${NOTHING}`)
    text = serializeProfiles(next)
    // Step 6 also: what is about to be written must read back as exactly this value; when it does not, this mod has a bug.
    const check = parseProfiles(text)
    if (!check.ok || serializeProfiles(check.value) !== text) {
      return refused(`This mod built a profiles file it would not read back the same (${check.ok ? 'it reads back differently' : check.reason}). ${NOTHING}`)
    }
  } catch (error) {
    return refused(`${messageOf(error)}. ${NOTHING}`)
  }
  // Step 7: in place, so the file keeps its inode and a link keeps pointing where it did (REF 214; checked by live check L1).
  try {
    await io.write(place.file, text)
  } catch (error) {
    return refused(`${place.file} was not written: ${messageOf(error)}`)
  }
  // Step 8: read it back. A different text is another writer's (or a torn write); one that is not JSON is reported as
  // possible damage, and step 3 then refuses every further save until the file reads clean.
  let back: string
  try {
    back = await io.read(place.file)
  } catch (error) {
    return unconfirmed(`${PROFILES_FILE_NAME} could not be read back: ${messageOf(error)}. Check it: ${place.file}`)
  }
  if (back === text) return { kind: 'saved', file: next, text }
  try {
    JSON.parse(back)
  } catch {
    return unconfirmed(`${PROFILES_FILE_NAME} may be damaged: ${place.file}. Check it; no profile is saved until it reads clean.`)
  }
  return unconfirmed(`${PROFILES_FILE_NAME} changed while it was being written. Check it: ${place.file}`)
}
