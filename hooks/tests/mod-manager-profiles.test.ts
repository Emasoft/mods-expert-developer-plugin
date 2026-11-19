// Tests of the mod-manager profile store (TRDD-GSR975M8, increment P1b of design/specs/mod-manager-profiles.md, section 9)
// and of the read-only profile list in the pane (increment P2a). Tests 1 to 7 are the spec's P1b tests: the profiles
// file and its guarded write, the profile names, the apply plan, and the installed_plugins.json parser; test 6 is the
// write of a file that exists, test 7 its edge cases. Tests 8 to 18 are P2a's: the profile list the pane draws.
//
// Two kinds of test, for a reason. The pane's read of mods-profiles.json runs through the mod's own hooks, so tests 8
// to 14 and 17 are kit tests whose on('fs.*') stubs answer as the types document $.fs. The guarded write (saveProfiles,
// tests 1, 6 and 7) has no caller in the mod yet: P2a draws no button that saves a profile (NEW, DUPLICATE, RENAME,
// DELETE and EDIT wait for the owner's answers, spec section 8), and a kit test reaches mod code only through the mod's
// own hooks. Neither of the kit's other routes reaches it, measured on Claude Code 2.1.316 (2026-10-31): a test's own
// hook may not call the mods API ("test: $.fs.read refused: its hooks module does not call it"), and a plugin a test
// declares inline is loaded as a module of its own, so it cannot use the mod's files ("saveProfiles is not defined";
// "$ is passed to engineIo, which is not ... one imported from a file of the module's own"). So those tests
// still pass a file port, a disk in memory that answers as the types document $.fs: stat rejects ENOENT for a missing
// path, has no realPath for a link that leads nowhere (or, on a host that does so, rejects for it too), and list names
// a link as it stands (index.d.ts 3340-3376, FsStat, FsEntry). They move to kit stubs when a button saves a profile.
import type { FsEntry, FsStat } from 'claude-code'
import { describe, expect, mock, test, type MockClock, type Mounted } from 'claude-code/testing'

import { type FileIo, PROFILES_DIR, enabledMapOf, profilesPlace, readProfiles, saveProfiles } from '../mod-manager/files'
import { parseInstalledFile } from '../mod-manager/installed'
import {
  DESKTOP_WRITES,
  PROFILES_SOON_LINE,
  PROFILES_WHAT_LINE,
  STYLE,
  type ProfileView,
  type Style,
  changePath,
  fitLabel,
  profileLines,
  profilesReadOnly,
  profilesToggleLabel,
} from '../mod-manager/logic'
import {
  type ProfilesFile,
  KEEP_SELF_ON,
  NAME_RULE,
  PROFILE_ORIGIN,
  applyPlan,
  createProfile,
  nameProblem,
  parseProfiles,
  profileInstalls,
  renameProfile,
  serializeProfiles,
  snapshotUserScope,
} from '../mod-manager/profiles'

// Absolute, yet no machine's path: <user> is a placeholder segment, which tests/test_no_absolute_paths.py does not count.
const HOME = '/home/<user>'
const PLACE = profilesPlace(HOME)
// Spelled out, not built by profilesPlace, so a change to PROFILES_DIR or to the way the path is built shows here.
const PROFILES_FILE = '/home/<user>/.claude/.mod-manager/mods-profiles.json'
const SETTINGS = `${HOME}/.claude/settings.json`
const NOW = Date.UTC(2026, 9, 31, 12, 0, 0)
const SELF = 'mods-expert-developer-plugin'

const WRITING: ProfilesFile = {
  schema: 1,
  profiles: [
    {
      id: 'p-mhd2k3x1',
      name: 'Writing',
      createdAt: '2026-10-31T12:00:00.000Z',
      updatedAt: '2026-10-31T12:05:00.000Z',
      plugins: {
        'aaa-mod@market-a': { enabled: true, isMod: true },
        'old-tool@market-a': { enabled: false, isMod: false },
      },
    },
  ],
}
const WRITING_TEXT = serializeProfiles(WRITING)

/** Texts of mods-profiles.json the strict read refuses, each with what its reason names. Read here by tests 1 and 9. */
const REFUSED_TEXTS = (() => {
  const malformed = JSON.parse(WRITING_TEXT)
  malformed.profiles[0].plugins['aaa-mod@market-a'].enabled = 'yes'
  // A key this mod does not know, on a profile and on an entry: a save writes only what was read, so it would drop it.
  const extraOnProfile = JSON.parse(WRITING_TEXT)
  extraOnProfile.profiles[0].colour = 'blue'
  const extraOnEntry = JSON.parse(WRITING_TEXT)
  extraOnEntry.profiles[0].plugins['old-tool@market-a'].note = 'keep'
  return [
    { text: WRITING_TEXT.replace('"schema": 1', '"schema": 2'), reason: /schema 2/ },
    { text: JSON.stringify(malformed, null, 2), reason: /aaa-mod@market-a/ },
    { text: JSON.stringify(extraOnProfile, null, 2), reason: /does not know \(colour\)/ },
    { text: JSON.stringify(extraOnEntry, null, 2), reason: /old-tool@market-a, which has keys this mod does not know \(note\)/ },
    { text: '{ "schema": 1, "profiles": [', reason: /not JSON/ },
  ]
})()

/** A disk in memory: files, folders, and symbolic links (null: a link that leads nowhere). */
type Disk = {
  files: Map<string, string>
  dirs: Set<string>
  links: Map<string, string | null>
  writes: Array<{ path: string; text: string }>
  /** What the file holds after a write when another writer changed it meanwhile; by default the text written. */
  afterWrite: ((text: string) => string) | undefined
  /** True: stat rejects for a link that leads nowhere, as a host may; false: it answers with no realPath (FsStat). */
  statRejectsNowhere: boolean
}

function disk(files: Record<string, string> = {}, dirs: readonly string[] = [HOME, PLACE.parent, PLACE.folder]): Disk {
  return { files: new Map(Object.entries(files)), dirs: new Set(dirs), links: new Map(), writes: [], afterWrite: undefined, statRejectsNowhere: false }
}

/** Where a path lands: through a link that is the path or one of its folders; null when that link leads nowhere. */
function landing(d: Disk, path: string): string | null {
  for (const [link, target] of d.links) {
    if (path === link) return target
    if (path.startsWith(`${link}/`)) return target === null ? null : `${target}${path.slice(link.length)}`
  }
  return path
}

const enoent = (verb: string, path: string): Error => new Error(`ENOENT: no such file or directory, ${verb} '${path}'`)

function io(d: Disk): FileIo {
  return {
    exists: async (path) => {
      const real = landing(d, path)
      return real !== null && (d.files.has(real) || d.dirs.has(real))
    },
    stat: async (path): Promise<FsStat> => {
      const real = landing(d, path)
      const isLink = d.links.has(path)
      if (real !== null && d.files.has(real)) return { kind: 'file', size: d.files.get(real)?.length ?? 0, mtimeMs: 0, isLink, realPath: real }
      if (real !== null && d.dirs.has(real)) return { kind: 'dir', size: 0, mtimeMs: 0, isLink, realPath: real }
      // The path itself is a link that leads nowhere: stat answers without realPath (FsStat, index.d.ts 5156-5186), or rejects.
      if (isLink && !d.statRejectsNowhere) return { kind: 'other', size: 0, mtimeMs: 0, isLink: true }
      throw enoent('stat', path)
    },
    // Each entry as it stands: a link is `other` with isLink, whether or not it leads anywhere (FsEntry).
    list: async (path): Promise<FsEntry[]> => {
      const real = landing(d, path)
      if (real === null || !d.dirs.has(real)) throw enoent('list', path)
      const kindOf = (entry: string): FsEntry['kind'] => (d.links.has(entry) ? 'other' : d.dirs.has(entry) ? 'dir' : 'file')
      const inside = [...d.files.keys(), ...d.dirs, ...d.links.keys()].filter((entry) => entry.startsWith(`${real}/`) && !entry.slice(real.length + 1).includes('/'))
      return [...new Set(inside)].map((entry) => ({ name: entry.slice(real.length + 1), kind: kindOf(entry), size: 0, mtimeMs: 0, isLink: d.links.has(entry) }))
    },
    read: async (path) => {
      const real = landing(d, path)
      const text = real === null ? undefined : d.files.get(real)
      if (text === undefined) throw enoent('open', path)
      return text
    },
    write: async (path, text) => {
      d.writes.push({ path, text })
      d.files.set(landing(d, path) ?? path, d.afterWrite?.(text) ?? text)
    },
  }
}

const SNAPSHOT = { 'aaa-mod@market-a': { enabled: true, isMod: true }, 'zzz-tool@market-a': { enabled: false, isMod: false } }
const addWork = (file: ProfilesFile) => createProfile('Work', SNAPSHOT, NOW, file)

describe('the profile store (P1b)', () => {
  test('1. the profiles file: a valid file reads, a missing one is an empty list; schema 2, a malformed entry, an unknown key and non-JSON are refused whole, and no write follows', async () => {
    const valid = disk({ [PLACE.file]: WRITING_TEXT })
    const read = await readProfiles(io(valid), PLACE.file)
    expect(read.text).toBe(WRITING_TEXT)
    expect(read.parsed).toEqual({ ok: true, value: WRITING })

    const missing = await readProfiles(io(disk()), PLACE.file)
    expect(missing).toEqual({ text: undefined, parsed: { ok: true, value: { schema: 1, profiles: [] } } })

    for (const { text, reason } of REFUSED_TEXTS) {
      const d = disk({ [PLACE.file]: text })
      const parsed = (await readProfiles(io(d), PLACE.file)).parsed
      expect(parsed.ok).toBe(false)
      if (!parsed.ok) expect(parsed.reason).toMatch(reason)
      let edited = false
      const saved = await saveProfiles(io(d), HOME, text, (file) => {
        edited = true
        return addWork(file)
      })
      expect(saved.kind).toBe('refused')
      if (saved.kind !== 'saved') expect(saved.reason).toMatch(reason)
      expect(edited).toBe(false)
      expect(d.writes).toEqual([])
    }
  })

  test('2. names under NAME_RULE: empty, spaces only, too long, a control character, a case variant and an NFC variant of another name are refused; a profile may take a case variant of its own name', () => {
    expect(NAME_RULE).toEqual({ maxLength: 64, normalization: 'NFC', comparedWithoutCase: true })
    const empty: ProfilesFile = { schema: 1, profiles: [] }
    for (const name of ['', '   ', 'x'.repeat(NAME_RULE.maxLength + 1), 'bad\u0007name']) {
      expect(nameProblem(name, [], undefined)).toBeDefined()
      expect(createProfile(name, SNAPSHOT, NOW, empty).ok).toBe(false)
    }
    expect(nameProblem('x'.repeat(NAME_RULE.maxLength), [], undefined)).toBeUndefined()
    const created = createProfile('  Work  ', SNAPSHOT, NOW, empty)
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const work = created.value.profiles[0]
    expect(work?.name).toBe('Work')
    const clash = createProfile('work', SNAPSHOT, NOW + 1, created.value)
    expect(clash).toEqual({ ok: false, reason: 'A profile named Work already exists; names are compared without case.' })
    const renamed = renameProfile(created.value, work?.id ?? '', 'WORK', NOW + 2)
    expect(renamed.ok).toBe(true)
    if (renamed.ok) expect(renamed.value.profiles.map((profile) => profile.name)).toEqual(['WORK'])

    // One name, two spellings: é as one code point (NFC) and as e plus a combining acute (NFD). Both look alike in a list.
    // Built from code points, so no editor or formatter can merge the two spellings in this source file.
    const composed = `Caf${String.fromCodePoint(0xe9)}`
    const decomposed = `Cafe${String.fromCodePoint(0x301)}`
    expect(decomposed).not.toBe(composed)
    const cafe = createProfile(composed, SNAPSHOT, NOW, empty)
    expect(cafe.ok).toBe(true)
    if (!cafe.ok) return
    expect(nameProblem(decomposed, cafe.value.profiles, undefined)).toBe(`A profile named ${composed} already exists; names are compared without case.`)
    expect(createProfile(decomposed.toUpperCase(), SNAPSHOT, NOW + 1, cafe.value).ok).toBe(false)
  })

  test('3. with KEEP_SELF_ON, applyPlan never turns this plugin itself off: it lists it as kept on, and still turns it on', () => {
    expect(KEEP_SELF_ON).toBe(true)
    const selfId = `${SELF}@emasoft-plugins`
    const installs = [selfId, 'other@market-a'].map((id) => ({ id, scope: 'user', installPath: `/cache/${id}` }))
    const profile = { ...WRITING.profiles[0]!, plugins: { [selfId]: { enabled: false, isMod: true }, 'other@market-a': { enabled: false, isMod: false } } }
    const noLocks = { policy: {}, flag: {}, project: {}, local: {} }
    const off = applyPlan(profile, installs, { [selfId]: true, 'other@market-a': true }, noLocks, SELF)
    expect(off.map((item) => [item.id, item.kind])).toEqual([
      ['mods-expert-developer-plugin@emasoft-plugins', 'kept-on'],
      ['other@market-a', 'change'],
    ])
    const on = applyPlan({ ...profile, plugins: { [selfId]: { enabled: true, isMod: true } } }, installs, { [selfId]: false }, noLocks, SELF)
    expect(on.map((item) => item.kind)).toEqual(['change'])
  })

  test('4. an id set in policy or in flag enabledPlugins is skipped as locked; one set in project or local is changed and marked overridden', () => {
    const ids = ['aaa@m', 'bbb@m', 'ccc@m', 'ddd@m']
    const installs = ids.map((id) => ({ id, scope: 'user', installPath: `/cache/${id}` }))
    const profile = { ...WRITING.profiles[0]!, plugins: Object.fromEntries(ids.map((id) => [id, { enabled: false, isMod: false }])) }
    const locks = {
      policy: enabledMapOf({ enabledPlugins: { 'aaa@m': true } }, 'policy'),
      flag: enabledMapOf({ enabledPlugins: { 'bbb@m': true } }, 'flag'),
      project: enabledMapOf({ enabledPlugins: { 'ccc@m': true } }, 'project'),
      local: enabledMapOf({}, 'local'),
    }
    const user = Object.fromEntries(ids.map((id) => [id, true]))
    const plan = applyPlan(profile, installs, user, locks, SELF)
    expect(plan.map((item) => [item.id, item.kind, item.overridden])).toEqual([
      ['aaa@m', 'locked', false],
      ['bbb@m', 'locked', false],
      ['ccc@m', 'change', true],
      ['ddd@m', 'change', false],
    ])
    expect(() => enabledMapOf({ enabledPlugins: { 'aaa@m': 'yes' } }, 'policy')).toThrow(/policy/)
    expect(() => enabledMapOf({ enabledPlugins: ['aaa@m'] }, 'flag')).toThrow(/flag/)
  })

  test('5. installed_plugins.json: version 2 reads, version 3 and non-JSON are refused, a malformed entry is named; under PROFILE_ORIGIN a snapshot takes only user-scope marketplace installs, and one with no enabledPlugins key is on', () => {
    expect(PROFILE_ORIGIN).toBe('marketplace')
    const file = {
      version: 2,
      plugins: {
        'aaa-mod@market-a': [
          { scope: 'user', installPath: '/cache/market-a/aaa-mod/1.0.0', version: '1.0.0', installedAt: '2026-10-20T09:00:00.000Z', lastUpdated: '2026-10-28T08:00:00.000Z' },
          { scope: 'local', installPath: '/cache/market-a/aaa-mod/1.0.0', projectPath: '/work/app' },
        ],
        'bbb-unset@market-a': [{ scope: 'user', installPath: '/cache/market-a/bbb-unset/1.0.0' }],
        'loc-only@market-a': [{ scope: 'local', installPath: '/cache/market-a/loc-only/1.0.0', projectPath: '/work/app' }],
        'kkk-skill@skills-dir': [{ scope: 'user', installPath: `${HOME}/.claude/skills/kkk-skill` }],
        'core@builtin': [{ scope: 'user', installPath: '/builtin/core' }],
        'no-origin': [{ scope: 'user', installPath: '/cache/no-origin' }],
        'bad-scope@market-a': [{ scope: 7, installPath: '/cache/market-a/bad-scope/1.0.0' }],
        'not-a-list@market-a': { scope: 'user' },
      },
    }
    const read = parseInstalledFile(JSON.stringify(file))
    expect(read.installs.map((entry) => `${entry.id}|${entry.scope}`)).toEqual([
      'aaa-mod@market-a|user',
      'aaa-mod@market-a|local',
      'bbb-unset@market-a|user',
      'loc-only@market-a|local',
      'kkk-skill@skills-dir|user',
      'core@builtin|user',
      'no-origin|user',
    ])
    expect(read.rejected.map((entry) => entry.id)).toEqual(['bad-scope@market-a', 'not-a-list@market-a'])
    expect(read.rejected[0]?.reason).toMatch(/scope/)
    expect(() => parseInstalledFile(JSON.stringify({ ...file, version: 3 }))).toThrow(/version 3/)
    expect(() => parseInstalledFile('{ "version": 2,')).toThrow(/not JSON/)

    expect(profileInstalls(read.installs).map((entry) => entry.id)).toEqual(['aaa-mod@market-a', 'bbb-unset@market-a'])
    const enabled = { 'aaa-mod@market-a': false, 'kkk-skill@skills-dir': true, 'core@builtin': true, 'no-origin': true }
    const snapshot = snapshotUserScope(read.installs, enabled, (id) => id === 'aaa-mod@market-a')
    // bbb-unset has no enabledPlugins key, so it counts as on (ENABLED_WHEN_UNSET, the manifest's defaultEnabled default).
    expect(snapshot).toEqual({ 'aaa-mod@market-a': { enabled: false, isMod: true }, 'bbb-unset@market-a': { enabled: true, isMod: false } })
  })

  test('6. profiles write, the file exists: a file changed since it was read is not written; a read-back that differs is reported; a link landing outside PROFILES_DIR is refused; an edit of more than the one profile it meant is refused', async () => {
    const changed = disk({ [PLACE.file]: WRITING_TEXT })
    const stale = serializeProfiles({ schema: 1, profiles: [] })
    const refused = await saveProfiles(io(changed), HOME, stale, addWork)
    expect(refused).toEqual({ kind: 'refused', reason: 'mods-profiles.json changed since it was read. Nothing was written; check the profiles and press again.' })
    expect(changed.writes).toEqual([])
    const appeared = await saveProfiles(io(changed), HOME, undefined, addWork)
    expect(appeared.kind).toBe('refused')
    expect(changed.writes).toEqual([])

    const raced = disk({ [PLACE.file]: WRITING_TEXT })
    raced.afterWrite = (text) => text.replace('"Work"', '"Someone else"')
    const racedResult = await saveProfiles(io(raced), HOME, WRITING_TEXT, addWork)
    expect(racedResult).toEqual({ kind: 'unconfirmed', reason: `mods-profiles.json changed while it was being written. Check it: ${PROFILES_FILE}` })
    expect(raced.writes.map((write) => write.path)).toEqual([PROFILES_FILE])

    const torn = disk({ [PLACE.file]: WRITING_TEXT })
    torn.afterWrite = (text) => text.slice(0, 20)
    const tornResult = await saveProfiles(io(torn), HOME, WRITING_TEXT, addWork)
    expect(tornResult).toEqual({ kind: 'unconfirmed', reason: `mods-profiles.json may be damaged: ${PROFILES_FILE}. Check it; no profile is saved until it reads clean.` })

    expect(PROFILES_DIR).toBe('.claude/.mod-manager')
    const linked = disk({ [SETTINGS]: '{}\n' })
    linked.links.set(PLACE.file, SETTINGS)
    const outside = await saveProfiles(io(linked), HOME, '{}\n', addWork)
    expect(outside).toEqual({ kind: 'refused', reason: `${PROFILES_FILE} is a link to ${SETTINGS}, outside ${PLACE.folder}. Nothing was written.` })
    expect(linked.writes).toEqual([])

    // Step 6 of spec section 3: an operation changes one profile. An edit that changes two, or reorders them, is a bug.
    const two = addWork(WRITING)
    if (!two.ok) throw new Error(two.reason)
    const twoText = serializeProfiles(two.value)
    const bugs = [
      (file: ProfilesFile) => ({ ok: true as const, value: { ...file, profiles: file.profiles.map((profile) => ({ ...profile, name: `${profile.name} x` })) } }),
      (file: ProfilesFile) => ({ ok: true as const, value: { ...file, profiles: [...file.profiles].reverse() } }),
    ]
    for (const bug of bugs) {
      const d = disk({ [PLACE.file]: twoText })
      const result = await saveProfiles(io(d), HOME, twoText, bug)
      expect(result).toEqual({ kind: 'refused', reason: 'This mod built a change to more than one profile, or moved them (a bug). Nothing was written.' })
      expect(d.writes).toEqual([])
    }
  })

  test('7. profiles write, edge cases of step 1: a first save writes the file, and only it; a file or folder the folder above lists but stat cannot reach, or that stat answers with no realPath, is refused and nothing is written through it', async () => {
    // The first save: no file, then no profiles folder either. saveProfiles takes the home folder, never a path, and the
    // one file it writes is the profiles file spelled out above, never settings.json beside it.
    for (const dirs of [[HOME, PLACE.parent, PLACE.folder], [HOME, PLACE.parent]]) {
      const d = disk({ [SETTINGS]: '{}\n' }, dirs)
      const saved = await saveProfiles(io(d), HOME, undefined, addWork)
      expect(saved.kind).toBe('saved')
      expect(d.writes.map((write) => write.path)).toEqual([PROFILES_FILE])
      expect(d.files.get(SETTINGS)).toBe('{}\n')
      const back = parseProfiles(d.files.get(PROFILES_FILE))
      expect(back.ok && back.value.profiles.map((profile) => profile.name)).toEqual(['Work'])
    }

    // A link that leads nowhere, at the file and at the folder: once as stat answers it (no realPath), once as a host
    // that rejects it (stat rejects, and only the listing of the folder above shows the link is there).
    const cases = [
      { link: PLACE.file, dirs: [HOME, PLACE.parent, PLACE.folder], above: PLACE.folder },
      { link: PLACE.folder, dirs: [HOME, PLACE.parent], above: PLACE.parent },
    ]
    for (const { link, dirs, above } of cases) {
      const noRealPath = disk({}, dirs)
      noRealPath.links.set(link, null)
      const answered = await saveProfiles(io(noRealPath), HOME, undefined, addWork)
      expect(answered).toEqual({ kind: 'refused', reason: `${link} is a link that leads nowhere, or where it leads was withheld. Nothing was written.` })
      expect(noRealPath.writes).toEqual([])

      const rejected = disk({}, dirs)
      rejected.links.set(link, null)
      rejected.statRejectsNowhere = true
      const listed = await saveProfiles(io(rejected), HOME, undefined, addWork)
      expect(listed.kind).toBe('refused')
      if (listed.kind === 'refused') expect(listed.reason).toBe(`${link} is listed in ${above}, but where it leads cannot be checked (ENOENT: no such file or directory, stat '${link}'): a link that leads nowhere, or an entry this mod cannot read. Nothing was written.`)
      expect(rejected.writes).toEqual([])
    }
  })
})

// The profile list in the pane (TRDD-GSR975M8, increment P2a). These are kit tests: the pane reads mods-profiles.json
// through the mod's own hooks (state.ts readProfileList, then files.ts engineIo and readProfiles), and the stubs below
// answer $.fs as the types document it (index.d.ts 3300-3432): exists says whether a file or folder is there, stat
// rejects ENOENT for a missing path and gives realPath only when asked to resolve, read rejects for a missing file, and
// write records the path. Every pane test mounts the pane on surface terminal and desktop at a narrow and a wide width,
// with the same assertions.
const SURFACES = ['terminal', 'desktop'] as const
// 16 columns leaves room 8 for a button label, so the show or hide label is cut; 160 leaves it whole.
const WIDTHS = [16, 160] as const
const PLACES = SURFACES.flatMap((surface) => WIDTHS.map((columns) => ({ surface, columns })))
const CLAUDE = `${HOME}/.local/bin/claude`
const ROOT = '/work/app'
const LISTED = [{ id: 'aaa-mod@market-a', version: '1.0.0', scope: 'user', enabled: true, installPath: '/cache/market-a/aaa-mod/1.0.0' }]
// Three profiles saved in creation order; the list shows them by name, case aside: archive, Coding, Writing.
const named = (file: ProfilesFile, name: string, now: number): ProfilesFile => {
  const made = createProfile(name, SNAPSHOT, now, file)
  if (!made.ok) throw new Error(made.reason)
  return made.value
}
const THREE_TEXT = serializeProfiles(named(named(WRITING, 'archive', NOW + 1), 'Coding', NOW + 2))
const EXPLAIN = [PROFILES_WHAT_LINE, PROFILES_SOON_LINE]

/** What the stubs answer; a test changes it between mounts. */
type Kit = {
  clock: MockClock
  session: string
  files: Map<string, string>
  /** Files that exist but whose read is refused, with the error the read gives. */
  unreadable: Map<string, string>
  surfaces: string[]
  listFails: boolean
  writes: string[]
  logs: string[]
}

function kit(on: any): Kit {
  const k: Kit = { clock: mock.clock(on, { now: NOW }), session: 'p2a', files: new Map([[CLAUDE, '']]), unreadable: new Map(), surfaces: ['terminal'], listFails: false, writes: [], logs: [] }
  const dirs = new Set([HOME, PLACE.parent, PLACE.folder])
  const run = (exitCode: number, stdout: string, stderr: string) => ({ value: { exitCode, stdout, stderr, isStdoutTruncated: false, isStderrTruncated: false } })
  on('session.id', () => ({ value: k.session }))
  on('session.root', () => ({ value: ROOT }))
  on('session.surfaces', () => ({ value: k.surfaces }))
  on('env.get', ($: any, e: any) => ({ value: e.name === 'HOME' ? HOME : undefined }))
  on('fs.exists', ($: any, e: any) => ({ value: k.files.has(e.path) || k.unreadable.has(e.path) || dirs.has(e.path) }))
  // The only fs.stat on the pane's path is resolveBin's check of the claude binary (cli.ts); the profile read calls
  // fs.exists and fs.read only (files.ts readProfiles), and nothing on the path lists a folder, so P2a has no fs.list
  // stub. The guarded write, which stats and lists, has no caller before P2b (review of 2026-10-31, nit 2).
  on('fs.stat', ($: any, e: any) => {
    const kind = k.files.has(e.path) || k.unreadable.has(e.path) ? 'file' : dirs.has(e.path) ? 'dir' : undefined
    if (kind === undefined) return { deny: `ENOENT: no such file or directory, stat '${e.path}'` }
    return { value: { kind, size: (k.files.get(e.path) ?? '').length, mtimeMs: 0, isLink: false, ...(e.resolve === true ? { realPath: e.path } : {}) } }
  })
  on('fs.read', ($: any, e: any) => {
    const refusal = k.unreadable.get(e.path)
    if (refusal !== undefined) return { deny: refusal }
    const text = k.files.get(e.path)
    return text === undefined ? { deny: `ENOENT: no such file or directory, open '${e.path}'` } : { value: text }
  })
  on('fs.write', ($: any, e: any) => {
    k.writes.push(e.path)
    return { value: undefined }
  })
  // The pane reads its switches at its open and at a press (TRDD-5IK59SQ2, C6b): nothing is stored, so each reads its
  // default, on, as in a fresh install.
  on('store.get', () => ({ value: undefined }))
  on('process.run', () => (k.listFails ? run(1, '', 'the plugin list failed') : run(0, JSON.stringify(LISTED), '')))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.log', ($: any, e: any) => {
    k.logs.push(e.text)
    return { value: undefined }
  })
  return k
}

function pane(surface: (typeof SURFACES)[number], columns: number) {
  return {
    plugin: 'mods-expert-developer-plugin',
    surface,
    component: 'Pane' as const,
    requestId: 'mod-manager',
    viewport: { columns, rows: 40 },
    props: { title: 'Mods', isFocused: true, bodyColumns: columns - 4, placement: 'inline', scroll: { offset: 0, bodyRows: 36 }, view: {} },
  } as any
}

/** Opens the pane for a fresh session id, lets its read finish, and mounts it, with the profile list closed as it starts. */
async function mountPane($: any, k: Kit, session: string, surface: (typeof SURFACES)[number], columns: number): Promise<Mounted<'terminal' | 'desktop'>> {
  k.session = session
  await $.command.run({ command: 'mods-manager', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } })
  await k.clock.settle()
  return $.ui.mount(pane(surface, columns))
}

/** mountPane, then a press on the show button, so the profile list is open. */
async function openAndMount($: any, k: Kit, session: string, surface: (typeof SURFACES)[number], columns: number): Promise<Mounted<'terminal' | 'desktop'>> {
  const ui = await mountPane($, k, session, surface, columns)
  await ui.press({ key: 'mm-profiles' })
  await k.clock.settle()
  return ui
}

/** The profile list's lines as drawn, each with its props; undefined when the list is hidden. */
async function profileList(ui: Mounted<'terminal' | 'desktop'>): Promise<Array<{ text: string; props: Record<string, unknown> }> | undefined> {
  const box = await ui.find({ key: 'mm-profiles-list' })
  if (box === undefined) return undefined
  return (box.children as any[]).map((line) => ({ text: (line.children as unknown[]).join(''), props: line.props }))
}

const texts = async (ui: Mounted<'terminal' | 'desktop'>): Promise<string[] | undefined> => (await profileList(ui))?.map((line) => line.text)

describe('the profile list in the pane (P2a)', () => {
  test('8. the pane lists the profile names of mods-profiles.json by name under the two explanation lines; with no file it says there are none; nothing is written', async ($, on) => {
    const k = kit(on)
    k.files.set(PROFILES_FILE, THREE_TEXT)
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, k, `three-${surface}-${columns}`, surface, columns)
      expect(await texts(ui)).toEqual([...EXPLAIN, 'archive', 'Coding', 'Writing'])
      await ui.unmount()
    }
    k.files.delete(PROFILES_FILE)
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, k, `none-${surface}-${columns}`, surface, columns)
      expect(await texts(ui)).toEqual([...EXPLAIN, STYLE.text.none])
      await ui.unmount()
    }
    expect(k.writes).toEqual([])
  })

  test('9. a profiles file the strict read refuses (schema 2, a malformed entry, an unknown key, non-JSON) is shown by its reason and its path, with no name; nothing is written', { timeoutMs: 30_000 }, async ($, on) => {
    const k = kit(on)
    for (const [index, { text, reason }] of REFUSED_TEXTS.entries()) {
      k.files.set(PROFILES_FILE, text)
      for (const { surface, columns } of PLACES) {
        const ui = await openAndMount($, k, `refused-${index}-${surface}-${columns}`, surface, columns)
        const lines = (await texts(ui)) ?? []
        expect(lines.slice(0, 2)).toEqual(EXPLAIN)
        expect(lines).toHaveLength(3)
        expect(lines[2]).toMatch(reason)
        expect(lines[2]).toContain(`${STYLE.text.inFile} ${PROFILES_FILE}`)
        await ui.unmount()
      }
    }
    expect(k.writes).toEqual([])
  })

  test('10. a profiles file that is there but cannot be read is shown with the read\'s own error, and the error is logged', async ($, on) => {
    const k = kit(on)
    k.unreadable.set(PROFILES_FILE, `EACCES: permission denied, open '${PROFILES_FILE}'`)
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, k, `unreadable-${surface}-${columns}`, surface, columns)
      const lines = (await texts(ui)) ?? []
      expect(lines).toHaveLength(3)
      expect(lines[2]?.startsWith(`${STYLE.text.unreadable} `)).toBe(true)
      expect(lines[2]).toContain('EACCES: permission denied')
      await ui.unmount()
    }
    expect(k.logs.some((line) => line.startsWith('mods-manager: reading the profiles failed:') && line.includes('EACCES'))).toBe(true)
    expect(k.writes).toEqual([])
  })

  test('11. the show or hide button: the list starts hidden; a press shows it and the label offers to hide it; a second press hides it again; its hotkey is p', async ($, on) => {
    const k = kit(on)
    k.files.set(PROFILES_FILE, THREE_TEXT)
    for (const { surface, columns } of PLACES) {
      const room = columns - 8
      const ui = await mountPane($, k, `toggle-${surface}-${columns}`, surface, columns)
      const hidden = await ui.find({ key: 'mm-profiles' })
      expect(hidden?.props.label).toBe(fitLabel('p: Show profiles', room))
      expect(hidden?.props.hotkey).toBe('p')
      expect(await profileList(ui)).toBeUndefined()
      await ui.press({ key: 'mm-profiles' })
      await k.clock.settle()
      expect(await texts(ui)).toEqual([...EXPLAIN, 'archive', 'Coding', 'Writing'])
      expect((await ui.find({ key: 'mm-profiles' }))?.props.label).toBe(fitLabel('p: Hide profiles', room))
      await ui.press({ key: 'mm-profiles' })
      await k.clock.settle()
      expect(await profileList(ui)).toBeUndefined()
      await ui.unmount()
    }
  })

  test('12. in a session that draws on no terminal (the Desktop app) the list says applying profiles is not available there; in a terminal session, one with the Desktop app attached included, it does not', async ($, on) => {
    const k = kit(on)
    k.files.set(PROFILES_FILE, THREE_TEXT)
    const cases = [
      { surfaces: ['desktop'], readOnlyLine: true },
      { surfaces: ['terminal'], readOnlyLine: false },
      { surfaces: ['terminal', 'desktop'], readOnlyLine: false },
    ]
    for (const [index, { surfaces, readOnlyLine }] of cases.entries()) {
      k.surfaces = surfaces
      for (const { surface, columns } of PLACES) {
        const ui = await openAndMount($, k, `where-${index}-${surface}-${columns}`, surface, columns)
        const head = readOnlyLine ? [...EXPLAIN, STYLE.text.readOnly] : EXPLAIN
        expect(await texts(ui)).toEqual([...head, 'archive', 'Coding', 'Writing'])
        await ui.unmount()
      }
    }
  })

  test('13. a claude plugin list that fails, as it does where $.process is missing, leaves the profile list shown', async ($, on) => {
    const k = kit(on)
    k.files.set(PROFILES_FILE, THREE_TEXT)
    k.listFails = true
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, k, `list-fails-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ type: 'Text', text: 'The installed plugins could not be read.' })).toBeDefined()
      expect(await texts(ui)).toEqual([...EXPLAIN, 'archive', 'Coding', 'Writing'])
      await ui.unmount()
    }
  })

  test('14. each line is drawn with the look of its STYLE token, and a control or format character in a name is drawn as ?', async ($, on) => {
    const k = kit(on)
    // A right-to-left override (U+202E) in a name, which the name rule lets through: drawn, it would make the rest read backwards.
    const odd = named(WRITING, `ab${String.fromCodePoint(0x202e)}cd`, NOW + 1)
    const cases = [
      { text: serializeProfiles(odd), surfaces: ['desktop'], looks: [STYLE.explain, STYLE.explain, STYLE.note, STYLE.name, STYLE.name], last: 'Writing', odd: 'ab?cd' },
      { text: undefined, surfaces: ['terminal'], looks: [STYLE.explain, STYLE.explain, STYLE.note], last: STYLE.text.none, odd: undefined },
      { text: '{ not json', surfaces: ['terminal'], looks: [STYLE.explain, STYLE.explain, STYLE.problem], last: undefined, odd: undefined },
    ]
    for (const [index, item] of cases.entries()) {
      if (item.text === undefined) k.files.delete(PROFILES_FILE)
      else k.files.set(PROFILES_FILE, item.text)
      k.surfaces = item.surfaces
      for (const { surface, columns } of PLACES) {
        const ui = await openAndMount($, k, `look-${index}-${surface}-${columns}`, surface, columns)
        const lines = (await profileList(ui)) ?? []
        expect(lines).toHaveLength(item.looks.length)
        lines.forEach((line, at) => expect(line.props).toMatchObject(item.looks[at] ?? {}))
        if (item.last !== undefined) expect(lines.at(-1)?.text).toBe(item.last)
        if (item.odd !== undefined) expect(lines.map((line) => line.text)).toContain(item.odd)
        await ui.unmount()
      }
    }
  })

  test('15. profileLines and the button label take every look, word and hotkey from the style they are given: a style other than STYLE changes them all (module rule)', () => {
    const custom: Style = {
      explain: { color: 'success' },
      name: { italic: true },
      note: { underline: true },
      problem: { color: 'error', bold: true },
      toggleKey: 'q',
      text: { show: 'Open', hide: 'Close', explain: ['one', 'two'], none: 'empty', reading: 'wait', readOnly: 'app only', inFile: 'in', unreadable: 'broken:' },
    }
    expect(profilesToggleLabel(true, custom)).toBe('q: Close')
    expect(profilesToggleLabel(false, custom)).toBe('q: Open')
    const explain = [
      { text: 'one', look: custom.explain, wrap: 'wrap' },
      { text: 'two', look: custom.explain, wrap: 'wrap' },
    ]
    const readOnlyLine = { text: 'app only', look: custom.note, wrap: 'wrap' }
    expect(profileLines({ kind: 'read', names: ['b', 'A'] }, true, custom)).toEqual([...explain, readOnlyLine, { text: 'A', look: custom.name, wrap: 'truncate-end' }, { text: 'b', look: custom.name, wrap: 'truncate-end' }])
    expect(profileLines({ kind: 'read', names: [] }, false, custom)).toEqual([...explain, { text: 'empty', look: custom.note, wrap: 'wrap' }])
    expect(profileLines({ kind: 'reading' }, false, custom)).toEqual([...explain, { text: 'wait', look: custom.note, wrap: 'wrap' }])
    expect(profileLines({ kind: 'refused', reason: 'bad.', file: '/f' }, false, custom)).toEqual([...explain, { text: 'bad. in /f', look: custom.problem, wrap: 'wrap' }])
    expect(profileLines({ kind: 'failed', error: 'EIO' }, false, custom)).toEqual([...explain, { text: 'broken: EIO', look: custom.problem, wrap: 'wrap' }])
  })

  test('16. changePath: a terminal anywhere in the answer is cli, another surface alone is desktop, no surface is none; with DESKTOP_WRITES off only desktop is read-only', () => {
    expect(changePath(['terminal'])).toBe('cli')
    expect(changePath(['terminal', 'desktop'])).toBe('cli')
    expect(changePath(['desktop'])).toBe('desktop')
    expect(changePath(['vscode'])).toBe('desktop')
    expect(changePath([])).toBe('none')
    expect(DESKTOP_WRITES).toBe(false)
    expect([profilesReadOnly('desktop'), profilesReadOnly('cli'), profilesReadOnly('none'), profilesReadOnly(undefined)]).toEqual([true, false, false, false])
  })

  test('17. the profile list sits below the plugin rows: the pane opens with its plugin rows first and the show button last, and an open list is drawn after the last row', async ($, on) => {
    const k = kit(on)
    k.files.set(PROFILES_FILE, THREE_TEXT)
    // The keys of the pane's top-level elements, in drawing order (a child's key is in its props; one without a key counts as its tag).
    const order = async (ui: Mounted<'terminal' | 'desktop'>): Promise<string[]> =>
      (((await ui.find({ type: 'Box' }))?.children ?? []) as Array<{ type?: string; props?: { key?: string } }>).map((child) => child.props?.key ?? child.type ?? '')
    for (const { surface, columns } of PLACES) {
      const ui = await mountPane($, k, `below-${surface}-${columns}`, surface, columns)
      const closed = await order(ui)
      const lastRow = Math.max(...closed.map((key, at) => (key.startsWith('mm-row-') || key.startsWith('mm-sec-') ? at : -1)))
      expect(lastRow).toBeGreaterThan(0)
      expect(closed.indexOf('mm-profiles')).toBe(closed.length - 1)
      expect(closed).not.toContain('mm-profiles-list')
      await ui.press({ key: 'mm-profiles' })
      await k.clock.settle()
      const open = await order(ui)
      expect(open.slice(0, lastRow + 1)).toEqual(closed.slice(0, lastRow + 1))
      expect(open.slice(lastRow + 1)).toEqual(['mm-profiles', 'mm-profiles-list'])
      await ui.unmount()
    }
  })

  test('18. the default words name no button the pane does not draw, and the read-only line says only that applying profiles is not available on this surface yet', () => {
    // The buttons the spec names (sections 7 and 9); P2a draws none of them, so no default line may name one.
    const specButtons = ['NEW PROFILE', 'DUPLICATE PROFILE', 'RENAME PROFILE', 'DELETE PROFILE', 'EDIT PROFILE', 'APPLY PROFILE', 'SAVE CHANGES']
    const views: ProfileView[] = [{ kind: 'reading' }, { kind: 'read', names: [] }, { kind: 'read', names: ['Work'] }, { kind: 'refused', reason: 'bad.', file: '/f' }, { kind: 'failed', error: 'broken' }]
    const words = [...views.flatMap((view) => profileLines(view, true, STYLE).map((line) => line.text)), profilesToggleLabel(true, STYLE), profilesToggleLabel(false, STYLE)]
    for (const text of words) {
      // The spec writes a button's name in capitals.
      expect(text).not.toMatch(/\b[A-Z]{3,}\b/)
      for (const button of specButtons) expect(text.toLowerCase()).not.toContain(button.toLowerCase())
    }
    // Exact, because only this sentence is known to be true: no reason, no product name, no menu path (spec L1 is open).
    expect(STYLE.text.readOnly).toBe('Applying profiles is not available on this surface yet.')
  })
})
