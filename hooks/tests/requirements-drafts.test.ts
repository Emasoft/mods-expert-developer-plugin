// Wiring tests of the requirements-drafts mod through the kit: rows, commands, picker, refusals.
// Every row test draws on both surfaces at a narrow and a wide width with the same assertions.
import { describe, expect, mock, test } from 'claude-code/testing'

import { draftId } from '../requirements-drafts/logic'

const PLUGIN = 'mods-expert-developer-plugin'
const HOME = '/home/tester'
const DIR = `${HOME}/.claude/requirements-drafts`
const SURFACES = ['terminal', 'desktop'] as const
const WIDTHS = [40, 160] as const

type Write = { path: string; text: string }
type World = {
  writes: Write[]
  toasts: string[]
  logs: string[]
  store: Map<string, unknown>
  files: string[]
  /** File name -> text, for $.fs.read: every seeded file and every file the mod wrote. */
  contents: Map<string, string>
  closed: string[]
  /** What $.session.id() answers; a test switches it to play a second session in the same module. */
  session: string
  /** When set, $.fs.write rejects with this reason (a full disk, a folder it may not write). */
  writeError: string | undefined
  /** When set, $.session.id() rejects with this reason. */
  sessionError: string | undefined
  /** What $.session.root() answers. */
  root: string
  /** The root $.session.repo() answers, or null outside a repository. */
  repoRoot: string | null
  /** For $.fs.stat with resolve: a path spelling and the real path it lands on. */
  realPaths: Map<string, string>
  /** Paths $.fs.stat rejects as missing. */
  missing: Set<string>
  /** Paths $.fs.stat answers without a realPath. */
  nowhere: Set<string>
  /** Every path $.fs.stat was asked about, in order. */
  stats: string[]
  /** When set, $.fs.stat rejects every path, as when a hook refuses the call. */
  statRefused: boolean
  /** Paths that exist but whose $.fs.stat a hook refuses. */
  refused: Set<string>
}

// Register every stub the mod's calls need; the kit wants them before the first call on $.
// A seeded name with no text of its own holds a draft of this test's project, /work, the root the
// session.root stub answers, so a hash match there is this project's draft.
function stubs(on: any, files: string[] = [], contents: Record<string, string> = {}): World {
  const world: World = { writes: [], toasts: [], logs: [], store: new Map(), files: [...files], contents: new Map(), closed: [], session: 'sess-1', writeError: undefined, sessionError: undefined, root: '/work', repoRoot: '/work', realPaths: new Map(), missing: new Set(), nowhere: new Set(), stats: [], statRefused: false, refused: new Set() }
  for (const name of files) world.contents.set(name, contents[name] ?? firstReleaseDraft(name.slice(0, -'.md'.length), '/work', 'a seeded draft'))
  mock.clock(on, { now: Date.UTC(2026, 9, 23, 16, 1, 9) })
  on('store.get', ($: any, e: any) => ({ value: world.store.get(e.key) }))
  on('store.set', ($: any, e: any) => {
    world.store.set(e.key, e.value)
    return { value: undefined }
  })
  on('env.get', ($: any, e: any) => ({ value: e.name === 'HOME' ? HOME : undefined }))
  // The drafts folder exists when it holds files; any other path exists unless it is in missing.
  on('fs.exists', ($: any, e: any) => ({ value: e.path === DIR ? world.files.length > 0 : !world.missing.has(e.path) }))
  on('fs.list', () => ({ value: world.files.map((name) => ({ name, kind: 'file', size: 1, mtimeMs: 1, isLink: false })) }))
  // A draft file the mod reads to learn its project; a name with no content is a file that cannot be read.
  // Where a path lands: a spelling in realPaths lands on its target, any other path on itself. A path
  // in missing does not exist (stat rejects); one in nowhere stats but resolves to no realPath.
  on('fs.stat', ($: any, e: any) => {
    world.stats.push(e.path)
    if (world.statRefused) return { deny: 'a hook refused fs.stat' }
    if (world.refused.has(e.path)) return { deny: `a hook refused fs.stat of ${e.path}` }
    if (world.missing.has(e.path)) return { deny: `ENOENT: no such file or directory, stat '${e.path}'` }
    const stat = { kind: 'dir', size: 0, mtimeMs: 0, isLink: world.realPaths.has(e.path) }
    if (!e.resolve || world.nowhere.has(e.path)) return { value: stat }
    return { value: { ...stat, realPath: world.realPaths.get(e.path) ?? e.path } }
  })
  on('fs.read', ($: any, e: any) => {
    const text = world.contents.get(e.path.slice(e.path.lastIndexOf('/') + 1))
    return text === undefined ? { deny: `cannot read ${e.path}` } : { value: text }
  })
  on('fs.write', ($: any, e: any) => {
    // A throwing test hook is skipped by the kit; { deny } is how a call on $ is made to reject.
    if (world.writeError !== undefined) return { deny: world.writeError }
    world.writes.push({ path: e.path, text: e.text })
    const name = e.path.slice(e.path.lastIndexOf('/') + 1)
    world.files.push(name)
    world.contents.set(name, e.text)
    return { value: undefined }
  })
  on('session.repo', () => ({ value: world.repoRoot === null ? null : { root: world.repoRoot, remote: null, internal: false, name: null } }))
  on('session.root', () => ({ value: world.root }))
  on('session.id', () => (world.sessionError !== undefined ? { deny: world.sessionError } : { value: world.session }))
  on('ui.toast', ($: any, e: any) => {
    world.toasts.push(e.text)
    return { value: undefined }
  })
  on('ui.log', ($: any, e: any) => {
    world.logs.push(e.text)
    return { value: undefined }
  })
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.close', ($: any, e: any) => {
    world.closed.push(e.id)
    return { value: undefined }
  })
  on('command.register', ($: any, e: any) => ({ value: { command: e.name } }))
  on('session.start', ($: any, e: any) => ({ cwd: e.cwd }))
  on('prompt.submit', ($: any, e: any) => ({ text: e.text }))
  on('classic.SessionStart', () => ({}))
  // What Claude Code itself draws for the message row, under which the mod adds its line.
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['engine row'] }))
  return world
}

async function hash12(text: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, 12)
}

/**
 * A draft as the mod's first release wrote it (renderDraft at 35383fb, its first commit). A literal,
 * not renderDraft: a change of the on-disk format must turn the old-draft test red.
 */
function firstReleaseDraft(id: string, projectRoot: string, text: string): string {
  return [
    '---',
    `id: "${id}"`,
    'created: "2026-10-01T09:00:00+0200"',
    `project-root: "${projectRoot}"`,
    `repo: "${projectRoot}"`,
    'session: "old-session"',
    'message-id: "old-message"',
    'via: "row"',
    'surface: "terminal"',
    '---',
    '',
    text,
    '',
    '<!-- requirements-drafts:end -->',
    '',
  ].join('\n')
}

async function start($: any) {
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
}

async function typed($: any, text: string) {
  await $.prompt.submit({ text, wait: false, origin: { kind: 'composer' } })
}

function command($: any, name: string, args = '') {
  return $.command.run({ command: name, args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } })
}

function row(surface: 'terminal' | 'desktop', columns: number, requestId: string, text: string, kind = 'composer') {
  return {
    plugin: PLUGIN,
    surface,
    component: 'UserMessage' as const,
    requestId,
    viewport: { columns, rows: 30 },
    props: { text, origin: { kind }, isExpanded: true },
  } as any
}

function pane(surface: 'terminal' | 'desktop', columns: number) {
  return {
    plugin: PLUGIN,
    surface,
    component: 'Pane' as const,
    requestId: 'requirements-drafts-pick',
    viewport: { columns, rows: 30 },
    props: { title: 'Save a requirement draft', isFocused: true, bodyColumns: columns - 4, placement: 'inline', scroll: { offset: 0, bodyRows: 20 }, view: {} },
  } as any
}

describe('row button under a sent message', () => {
  test('draws, saves the message with its frontmatter, then shows the saved mark', async ($, on) => {
    const world = stubs(on)
    await start($)
    let n = 0
    for (const surface of SURFACES) {
      for (const columns of WIDTHS) {
        n += 1
        const id = `msg-${surface}-${columns}`
        const text = `requirement ${n}: the drafts list sorts newest first`
        const ui = await $.ui.mount(row(surface, columns, id, text))
        expect(await ui.find({ type: 'Text', text: 'engine row' })).toBeDefined()
        const button = await ui.find({ key: `rd-save-${id}` })
        // Bracketed, as every button in this mod: no plain prop, so the terminal draws
        // `[ + save as requirement draft ]`, which fits the narrowest width tested.
        expect(button?.props.label).toBe('+ save as requirement draft')
        expect(button?.props.plain).toBeUndefined()
        expect(`[ ${button?.props.label} ]`.length).toBeLessThanOrEqual(columns)
        await ui.press({ key: `rd-save-${id}` })
        const written = world.writes[n - 1]
        expect(written).toBeDefined()
        expect(written!.path.startsWith(`${DIR}/`)).toBe(true)
        expect(written!.path).toMatch(/\/\d{8}_\d{6}[+-]\d{4}-[0-9a-f]{12}\.md$/)
        expect(written!.text).toContain(`message-id: "${id}"`)
        expect(written!.text).toContain('via: "row"')
        expect(written!.text).toContain(`surface: "${surface}"`)
        expect(written!.text).toContain('project-root: "/work"')
        expect(written!.text).toContain('session: "sess-1"')
        expect(written!.text).toContain(text)
        expect(written!.text.endsWith('<!-- requirements-drafts:end -->\n')).toBe(true)
        expect(await ui.find({ type: 'Text', text: /^✓ saved as requirement draft / })).toBeDefined()
        expect(await ui.find({ key: `rd-save-${id}` })).toBeUndefined()
        await ui.unmount()
      }
    }
    expect(world.writes.length).toBe(4)
    expect(world.toasts.filter((t) => t.startsWith('Saved requirement draft ')).length).toBe(4)
  })

  test('a message already on disk is found by its hash: no second file, "already saved" toast, saved mark', async ($, on) => {
    const text = 'the same requirement twice'
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))), (b) => b.toString(16).padStart(2, '0')).join('')
    const existing = `20261001_090000+0200-${digest.slice(0, 12)}`
    const world = stubs(on, [`${existing}.md`])
    await start($)
    for (const surface of SURFACES) {
      for (const columns of WIDTHS) {
        const id = `again-${surface}-${columns}`
        const ui = await $.ui.mount(row(surface, columns, id, text))
        await ui.press({ key: `rd-save-${id}` })
        expect(await ui.find({ type: 'Text', text: `✓ saved as requirement draft ${existing}` })).toBeDefined()
        await ui.unmount()
      }
    }
    expect(world.writes.length).toBe(0)
    expect(world.toasts).toEqual(Array(4).fill(`already saved as ${existing}`))
  })

  test('a draft the first release saved in this project is found: no second file on the row or the command', async ($, on) => {
    const text = 'a requirement saved by the first release'
    const existing = `20261001_090000+0200-${await hash12(text)}`
    const world = stubs(on, [`${existing}.md`], { [`${existing}.md`]: firstReleaseDraft(existing, '/work', text) })
    await start($)
    for (const surface of SURFACES) {
      for (const columns of WIDTHS) {
        const id = `old-${surface}-${columns}`
        const ui = await $.ui.mount(row(surface, columns, id, text))
        await ui.press({ key: `rd-save-${id}` })
        expect(await ui.find({ type: 'Text', text: `✓ saved as requirement draft ${existing}` })).toBeDefined()
        await ui.unmount()
      }
    }
    await typed($, text)
    await command($, 'requirements-drafts-save')
    expect(world.writes.length).toBe(0)
    expect(world.toasts).toEqual(Array(5).fill(`already saved as ${existing}`))
  })

  test('the same text saved from another project gets its own draft here, and a repeat here is already saved', async ($, on) => {
    const text = 'one requirement sent in two repositories'
    const elsewhere = `20261001_090000+0200-${await hash12(text)}`
    const world = stubs(on, [`${elsewhere}.md`], { [`${elsewhere}.md`]: firstReleaseDraft(elsewhere, '/elsewhere', text) })
    await start($)
    for (const surface of SURFACES) {
      for (const columns of WIDTHS) {
        const id = `two-${surface}-${columns}`
        const ui = await $.ui.mount(row(surface, columns, id, text))
        await ui.press({ key: `rd-save-${id}` })
        await ui.unmount()
      }
    }
    expect(world.writes.length).toBe(1)
    const written = world.writes[0]!
    expect(written.text).toContain('project-root: "/work"')
    expect(written.text).toContain(text)
    const ours = written.path.slice(written.path.lastIndexOf('/') + 1, -'.md'.length)
    expect(ours).not.toBe(elsewhere)
    expect(world.toasts).toEqual([`Saved requirement draft ${ours}`, ...Array(3).fill(`already saved as ${ours}`)])
  })

  test('a failed read of a draft with this hash is a toast and no file, never a silent duplicate', async ($, on) => {
    const text = 'a requirement whose old draft cannot be read'
    const unreadable = `20261001_090000+0200-${await hash12(text)}.md`
    const world = stubs(on, [unreadable])
    world.contents.delete(unreadable)
    await start($)
    const ui = await $.ui.mount(row('terminal', 80, 'unreadable', text))
    await ui.press({ key: 'rd-save-unreadable' })
    expect(world.writes.length).toBe(0)
    expect(world.toasts.length).toBe(1)
    expect(world.toasts[0]!.startsWith('Not saved: ')).toBe(true)
    expect(await ui.find({ key: 'rd-save-unreadable' })).toBeDefined()
    await ui.unmount()
  })
  test('the same text saved from another project in the same second is refused, and that draft is left as it was', async ($, on) => {
    const text = 'a requirement two projects save in one second'
    const now = Date.UTC(2026, 9, 23, 16, 1, 9)
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))), (b) => b.toString(16).padStart(2, '0')).join('')
    // The clock stubs() fixes, with the host's own offset, as saveDraft computes it.
    const colliding = draftId(now, -new Date(now).getTimezoneOffset(), digest)
    const theirs = firstReleaseDraft(colliding, '/elsewhere', text)
    const world = stubs(on, [`${colliding}.md`], { [`${colliding}.md`]: theirs })
    await start($)
    const ui = await $.ui.mount(row('terminal', 80, 'collide', text))
    await ui.press({ key: 'rd-save-collide' })
    expect(world.writes.length).toBe(0)
    expect(world.toasts.length).toBe(1)
    expect(world.toasts[0]!.startsWith('Not saved: ')).toBe(true)
    expect(world.toasts[0]!).toContain(`${colliding}.md`)
    expect(world.contents.get(`${colliding}.md`)).toBe(theirs)
    expect(await ui.find({ key: 'rd-save-collide' })).toBeDefined()
    await ui.unmount()
  })
  // Increment 2b: "already saved here" follows the list skill's own project rule (drafts.py
  // default_project and run): the git top and its subfolders by real path, unless the top is the
  // home folder; else the session root exactly. Each seed is a complete first-release draft of `text`.
  async function pressWith($: any, on: any, text: string, roots: string[], setup: (world: World) => void = () => {}) {
    const h = await hash12(text)
    const names = roots.map((_, i) => `20261001_09000${i}+0200-${h}.md`)
    const world = stubs(on, names, Object.fromEntries(names.map((name, i) => [name, firstReleaseDraft(name.slice(0, -'.md'.length), roots[i]!, text)])))
    setup(world)
    await start($)
    const ui = await $.ui.mount(row('terminal', 80, 'scope', text))
    await ui.press({ key: 'rd-save-scope' })
    await ui.unmount()
    return { world, names }
  }

  test('scope: a draft saved from a subfolder of this repository is already saved', async ($, on) => {
    const { world, names } = await pressWith($, on, 'saved from a subfolder', ['/work/sub'])
    expect(world.writes.length).toBe(0)
    expect(world.toasts).toEqual([`already saved as ${names[0]!.slice(0, -'.md'.length)}`])
  })

  test('scope: a sibling folder whose name starts like the repository is another project', async ($, on) => {
    const { world } = await pressWith($, on, 'saved from a sibling', ['/work2', '/work2/sub'])
    expect(world.writes.length).toBe(1)
    expect(world.toasts[0]!.startsWith('Saved requirement draft ')).toBe(true)
  })

  test('scope: symlinked spellings on both sides are compared by real path', async ($, on) => {
    const { world, names } = await pressWith($, on, 'saved under a link', ['/other/link'], (w) => {
      w.repoRoot = '/link/work'
      w.realPaths.set('/link/work', '/real/work')
      w.realPaths.set('/other/link', '/real/work/pkg')
    })
    expect(world.writes.length).toBe(0)
    expect(world.toasts).toEqual([`already saved as ${names[0]!.slice(0, -'.md'.length)}`])
  })

  test('scope: a repository at the home folder counts only the session root, exactly', async ($, on) => {
    // The subfolder draft sorts first, so an answer naming the second proves the subfolder did not match.
    const { world, names } = await pressWith($, on, 'a home repository', [`${HOME}/proj/sub`, `${HOME}/proj`], (w) => {
      w.repoRoot = HOME
      w.root = `${HOME}/proj`
    })
    expect(world.writes.length).toBe(0)
    expect(world.toasts).toEqual([`already saved as ${names[1]!.slice(0, -'.md'.length)}`])
  })

  test('scope: outside git, the exact session root is already saved and a subfolder is not', async ($, on) => {
    const { world, names } = await pressWith($, on, 'outside git', ['/work/sub', '/work'], (w) => {
      w.repoRoot = null
    })
    expect(world.writes.length).toBe(0)
    expect(world.toasts).toEqual([`already saved as ${names[1]!.slice(0, -'.md'.length)}`])
  })

  test('scope: a stored root that is gone or resolves nowhere does not match, and the save goes on', async ($, on) => {
    const { world } = await pressWith($, on, 'its project folder is gone', ['/gone', '/work/nowhere'], (w) => {
      w.missing.add('/gone')
      w.nowhere.add('/work/nowhere')
    })
    expect(world.writes.length).toBe(1)
    expect(world.toasts.length).toBe(1)
    expect(world.toasts[0]!.startsWith('Saved requirement draft ')).toBe(true)
  })

  test('scope: a draft whose subfolder of this repository was deleted is still already saved', async ($, on) => {
    // drafts.py resolves a missing path as Python's non-strict realpath does: the deepest existing
    // ancestor resolved, the rest kept as written. Here two levels are gone under a symlinked repo.
    const { world, names } = await pressWith($, on, 'saved from a deleted subfolder', ['/link/work/gone/deeper'], (w) => {
      w.repoRoot = '/link/work'
      w.realPaths.set('/link/work', '/real/work')
      w.missing.add('/link/work/gone/deeper')
      w.missing.add('/link/work/gone')
    })
    expect(world.writes.length).toBe(0)
    expect(world.toasts).toEqual([`already saved as ${names[0]!.slice(0, -'.md'.length)}`])
    expect(world.logs).toEqual([])
  })

  test('scope: a refused stat on a stored root does not match, leaves one log line, and the save goes on', async ($, on) => {
    const { world } = await pressWith($, on, 'its project folder is refused', ['/work/guarded'], (w) => {
      w.refused.add('/work/guarded')
    })
    expect(world.writes.length).toBe(1)
    expect(world.toasts.length).toBe(1)
    expect(world.toasts[0]!.startsWith('Saved requirement draft ')).toBe(true)
    expect(world.logs.length).toBe(1)
    expect(world.logs[0]!).toContain('/work/guarded')
    expect(world.logs[0]!).toContain('a hook refused fs.stat of /work/guarded')
  })
  test('scope: a stored root with no existing ancestor gives no match, silently, and the save goes on', async ($, on) => {
    // Every level up to the root is missing, so the walk ends without an ancestor. A relative root
    // is the real-world case (only a hand-edited file has one); a missing root folder reaches the
    // same branch without depending on how the kit spells a relative path.
    const { world } = await pressWith($, on, 'no ancestor exists', ['/gone/deeper'], (w) => {
      w.missing.add('/gone/deeper')
      w.missing.add('/gone')
      w.missing.add('/')
    })
    expect(world.writes.length).toBe(1)
    expect(world.toasts[0]!.startsWith('Saved requirement draft ')).toBe(true)
    expect(world.logs).toEqual([])
  })

  test('scope: with a candidate present, this session\'s own path that cannot be resolved fails the save loudly', async ($, on) => {
    const text = 'the own root cannot be resolved'
    // A file carrying this hash, so the save must resolve this session's scope to compare it.
    const seeded = `20261001_090000+0200-${await hash12(text)}.md`
    const world = stubs(on, [seeded], { [seeded]: firstReleaseDraft(seeded.slice(0, -'.md'.length), '/work', text) })
    await start($)
    const steps: Array<(w: World) => void> = [
      (w) => w.missing.add('/work'),
      (w) => { w.missing.clear(); w.nowhere.add('/work') },
      (w) => { w.nowhere.clear(); w.repoRoot = null; w.missing.add('/work') },
    ]
    for (const [i, step] of steps.entries()) {
      step(world)
      const ui = await $.ui.mount(row('terminal', 80, `own-${i}`, text))
      await ui.press({ key: `rd-save-own-${i}` })
      await ui.unmount()
    }
    expect(world.writes.length).toBe(0)
    expect(world.toasts.length).toBe(3)
    for (const toast of world.toasts) expect(toast.startsWith('Not saved: ')).toBe(true)
    expect(world.toasts[1]!).toContain('/work cannot be resolved to a real path')
    // Cases 1 and 3 are refused stats of this session's own /work, not some other failure in the save.
    expect(world.toasts[0]!).toContain("stat '/work'")
    expect(world.toasts[2]!).toContain("stat '/work'")
  })

  test('scope: with no file carrying the hash, a refused $.fs.stat does not stop the save', async ($, on) => {
    // Another draft is in the folder, so the list is read, but its hash differs: nothing to compare.
    const world = stubs(on, ['20261001_090000+0200-0123456789ab.md'])
    world.statRefused = true
    await start($)
    const ui = await $.ui.mount(row('terminal', 80, 'no-stat', 'no candidate, no stat'))
    await ui.press({ key: 'rd-save-no-stat' })
    await ui.unmount()
    expect(world.writes.length).toBe(1)
    expect(world.toasts.length).toBe(1)
    expect(world.toasts[0]!.startsWith('Saved requirement draft ')).toBe(true)
    expect(world.stats).toEqual([])
  })

  test('an incomplete draft of this project is not already saved: a fresh draft is written beside it', async ($, on) => {
    const text = 'a draft cut off before its end line'
    const cut = `20261001_090000+0200-${await hash12(text)}.md`
    const partial = firstReleaseDraft(cut.slice(0, -'.md'.length), '/work', text).replace('<!-- requirements-drafts:end -->\n', '')
    const world = stubs(on, [cut], { [cut]: partial })
    await start($)
    const ui = await $.ui.mount(row('terminal', 80, 'cut', text))
    await ui.press({ key: 'rd-save-cut' })
    await ui.unmount()
    expect(world.writes.length).toBe(1)
    expect(world.writes[0]!.path.endsWith(`/${cut}`)).toBe(false)
    expect(world.contents.get(cut)).toBe(partial)
    expect(world.toasts[0]!.startsWith('Saved requirement draft ')).toBe(true)
  })

  test('the same message with and without trailing whitespace is one draft', async ($, on) => {
    const world = stubs(on)
    await start($)
    for (const [i, text] of ['one requirement\n\n  ', 'one requirement'].entries()) {
      const ui = await $.ui.mount(row('terminal', 80, `ws-${i}`, text))
      await ui.press({ key: `rd-save-ws-${i}` })
      await ui.unmount()
    }
    expect(world.writes.length).toBe(1)
    const id = world.writes[0]!.path.slice(world.writes[0]!.path.lastIndexOf('/') + 1, -'.md'.length)
    expect(id.endsWith(`-${await hash12('one requirement')}`)).toBe(true)
    expect(world.toasts).toEqual([`Saved requirement draft ${id}`, `already saved as ${id}`])
  })
  test('switch off: no button on any surface or width, and the state is stored', async ($, on) => {
    const world = stubs(on)
    await start($)
    const answer = await command($, 'requirements-drafts', 'off')
    expect(answer.text).toBe('requirements-drafts is off.')
    expect(world.store.get('enabled')).toBe(false)
    for (const surface of SURFACES) {
      for (const columns of WIDTHS) {
        const ui = await $.ui.mount(row(surface, columns, `off-${surface}-${columns}`, 'a requirement'))
        expect(await ui.find({ type: 'Text', text: 'engine row' })).toBeDefined()
        expect(await ui.find({ key: `rd-save-off-${surface}-${columns}` })).toBeUndefined()
        await ui.unmount()
      }
    }
  })

  test('an off switch already in the store keeps the mod off after a start', async ($, on) => {
    const world = stubs(on)
    world.store.set('enabled', false)
    await start($)
    const ui = await $.ui.mount(row('terminal', 80, 'stored-off', 'a requirement'))
    expect(await ui.find({ key: 'rd-save-stored-off' })).toBeUndefined()
  })

  test('the default is ON: with nothing in the store, every row draws the button', async ($, on) => {
    // Pins the card's recorded default (the user has not answered yet): flipping it turns this red.
    const world = stubs(on)
    await start($)
    expect(world.store.has('enabled')).toBe(false)
    for (const surface of SURFACES) {
      for (const columns of WIDTHS) {
        const ui = await $.ui.mount(row(surface, columns, `default-${surface}-${columns}`, 'a requirement'))
        expect(await ui.find({ key: `rd-save-default-${surface}-${columns}` })).toBeDefined()
        await ui.unmount()
      }
    }
  })

  test('a row from any other origin gets no button', async ($, on) => {
    stubs(on)
    await start($)
    for (const surface of SURFACES) {
      for (const columns of WIDTHS) {
        for (const kind of ['task-notification', 'peer', 'plugin', 'unclassified']) {
          const id = `${kind}-${surface}-${columns}`
          const ui = await $.ui.mount(row(surface, columns, id, 'not typed here', kind))
          expect(await ui.find({ type: 'Text', text: 'engine row' })).toBeDefined()
          expect(await ui.find({ key: `rd-save-${id}` })).toBeUndefined()
          await ui.unmount()
        }
      }
    }
  })

  test('a Remote Control or SDK host row draws the button too, and saves, on every surface and width', async ($, on) => {
    // User ruling 2026-10-24: the option is on every message the person sends while the plugin is on.
    const world = stubs(on)
    await start($)
    let n = 0
    for (const kind of ['bridge', 'sdk']) {
      for (const surface of SURFACES) {
        for (const columns of WIDTHS) {
          n += 1
          const id = `${kind}-${surface}-${columns}`
          const ui = await $.ui.mount(row(surface, columns, id, `requirement ${n} sent through ${kind}`, kind))
          expect(await ui.find({ type: 'Text', text: 'engine row' })).toBeDefined()
          expect(await ui.find({ key: `rd-save-${id}` })).toBeDefined()
          await ui.press({ key: `rd-save-${id}` })
          expect(world.writes[n - 1]?.text).toContain(`message-id: "${id}"`)
          expect(await ui.find({ type: 'Text', text: /^✓ saved as requirement draft / })).toBeDefined()
          await ui.unmount()
        }
      }
    }
    expect(world.writes.length).toBe(8)
  })

  test('the placeholder id of a first draw gets no button', async ($, on) => {
    stubs(on)
    await start($)
    for (const surface of SURFACES) {
      for (const columns of WIDTHS) {
        const ui = await $.ui.mount(row(surface, columns, 'placeholder', 'first row'))
        expect(await ui.find({ key: 'rd-save-placeholder' })).toBeUndefined()
        await ui.unmount()
      }
    }
  })

  test('a secret-looking message is refused with a toast and nothing is written', async ($, on) => {
    const world = stubs(on)
    await start($)
    // cspell:disable-next-line
    const ui = await $.ui.mount(row('desktop', 160, 'secret-row', 'my key is AKIAABCDEFGHIJKLMNOP'))
    await ui.press({ key: 'rd-save-secret-row' })
    expect(world.writes.length).toBe(0)
    expect(world.toasts[0]).toMatch(/looks like it holds a secret/)
    expect(await ui.find({ key: 'rd-save-secret-row' })).toBeDefined()
  })
})

describe('/requirements-drafts', () => {
  test('toggles with no argument and answers usage for anything else', async ($, on) => {
    const world = stubs(on)
    await start($)
    expect((await command($, 'requirements-drafts')).text).toBe('requirements-drafts is off.')
    expect((await command($, 'requirements-drafts')).text).toBe('requirements-drafts is on.')
    expect(world.store.get('enabled')).toBe(true)
    expect((await command($, 'requirements-drafts', 'later')).text).toBe('Usage: /requirements-drafts [on|off]')
  })
})

describe('/requirements-drafts-save', () => {
  test('saves the last sent message, never a slash command, and prints nothing', async ($, on) => {
    const world = stubs(on)
    await start($)
    await typed($, 'first requirement')
    await typed($, 'second requirement')
    await typed($, '/compact')
    const answer = await command($, 'requirements-drafts-save')
    expect(answer).toEqual({})
    expect(world.writes.length).toBe(1)
    expect(world.writes[0]!.text).toContain('\nsecond requirement\n')
    expect(world.writes[0]!.text).toContain('via: "command"')
    expect(world.writes[0]!.text).toContain('message-id: ""')
  })

  test('a message sent through Remote Control or an SDK host is recorded and saved', async ($, on) => {
    const world = stubs(on)
    await start($)
    await $.prompt.submit({ text: 'requirement from the phone', wait: false, origin: { kind: 'bridge' } })
    await command($, 'requirements-drafts-save')
    await $.prompt.submit({ text: 'requirement from the desktop app', wait: false, origin: { kind: 'sdk' } })
    await command($, 'requirements-drafts-save')
    expect(world.writes.length).toBe(2)
    expect(world.writes[0]!.text).toContain('\nrequirement from the phone\n')
    expect(world.writes[1]!.text).toContain('\nrequirement from the desktop app\n')
  })

  test('a prompt from another origin is not recorded', async ($, on) => {
    const world = stubs(on)
    await start($)
    await $.prompt.submit({ text: 'a task notification', wait: false, origin: { kind: 'task-notification' } })
    await command($, 'requirements-drafts-save')
    expect(world.writes.length).toBe(0)
    expect(world.toasts).toEqual(['No sent message to save yet in this conversation.'])
  })

  test('nothing is recorded while the switch is off', async ($, on) => {
    const world = stubs(on)
    await start($)
    await command($, 'requirements-drafts', 'off')
    await typed($, 'typed while off')
    await command($, 'requirements-drafts', 'on')
    await command($, 'requirements-drafts-save')
    expect(world.writes.length).toBe(0)
  })

  test('refuses a secret with a toast', async ($, on) => {
    const world = stubs(on)
    await start($)
    // cspell:disable-next-line
    await typed($, 'password: correcthorsebattery')
    await command($, 'requirements-drafts-save')
    expect(world.writes.length).toBe(0)
    expect(world.toasts[0]).toMatch(/secret/)
  })

  test('/clear, /resume and /branch empty the list of sent messages; compaction keeps it', async ($, on) => {
    const world = stubs(on)
    await start($)
    for (const source of ['clear', 'resume', 'fork'] as const) {
      await typed($, `before ${source}`)
      await $.classic.SessionStart({ source })
      await command($, 'requirements-drafts-save')
    }
    expect(world.writes.length).toBe(0)
    expect(world.toasts).toEqual(Array(3).fill('No sent message to save yet in this conversation.'))
    await typed($, 'before compact')
    await $.classic.SessionStart({ source: 'compact' })
    await command($, 'requirements-drafts-save')
    expect(world.writes.length).toBe(1)
  })
})

describe('one module serving two sessions', () => {
  test('two sessions in one module keep their own lists, saved rows and /clear', async ($, on) => {
    const world = stubs(on)
    await start($)
    world.session = 'sess-A'
    await typed($, 'requirement typed in A')
    world.session = 'sess-B'
    // B has typed nothing: A's message must not be saved from B.
    await command($, 'requirements-drafts-save')
    expect(world.writes.length).toBe(0)
    expect(world.toasts).toEqual(['No sent message to save yet in this conversation.'])
    await typed($, 'requirement typed in B')
    await command($, 'requirements-drafts-save')
    expect(world.writes.length).toBe(1)
    expect(world.writes[0]!.text).toContain('\nrequirement typed in B\n')
    expect(world.writes[0]!.text).toContain('session: "sess-B"')
    // A row saved in B draws "saved" in B only; the same row id in A still has its button.
    const inB = await $.ui.mount(row('terminal', 80, 'shared-row', 'a row requirement'))
    await inB.press({ key: 'rd-save-shared-row' })
    expect(await inB.find({ type: 'Text', text: /^✓ saved as requirement draft / })).toBeDefined()
    await inB.unmount()
    world.session = 'sess-A'
    const inA = await $.ui.mount(row('terminal', 80, 'shared-row', 'a row requirement'))
    expect(await inA.find({ key: 'rd-save-shared-row' })).toBeDefined()
    // A press in A finds the same text on disk and marks the row saved in A too.
    await inA.press({ key: 'rd-save-shared-row' })
    expect(await inA.find({ type: 'Text', text: /^✓ saved as requirement draft / })).toBeDefined()
    await inA.unmount()
    // /clear in B empties B only: B's list and saved rows go, A keeps both.
    world.session = 'sess-B'
    await $.classic.SessionStart({ source: 'clear' })
    const clearedB = await $.ui.mount(row('terminal', 80, 'shared-row', 'a row requirement'))
    expect(await clearedB.find({ key: 'rd-save-shared-row' })).toBeDefined()
    await clearedB.unmount()
    world.session = 'sess-A'
    const keptA = await $.ui.mount(row('terminal', 80, 'shared-row', 'a row requirement'))
    expect(await keptA.find({ type: 'Text', text: /^✓ saved as requirement draft / })).toBeDefined()
    await keptA.unmount()
    await command($, 'requirements-drafts-save')
    expect(world.writes.length).toBe(3)
    expect(world.writes[2]!.text).toContain('\nrequirement typed in A\n')
    expect(world.writes[2]!.text).toContain('session: "sess-A"')
    world.session = 'sess-B'
    await command($, 'requirements-drafts-save')
    expect(world.writes.length).toBe(3)
    expect(world.toasts.at(-1)).toBe('No sent message to save yet in this conversation.')
  })
})

describe('a failed write', () => {
  test('row, command and picker toast "Not saved: <error>", log it, and raise no engine error', async ($, on) => {
    const world = stubs(on)
    await start($)
    world.writeError = 'disk full'
    for (const surface of SURFACES) {
      for (const columns of WIDTHS) {
        const id = `fail-${surface}-${columns}`
        const ui = await $.ui.mount(row(surface, columns, id, `requirement for ${id}`))
        await ui.press({ key: `rd-save-${id}` })
        // Not saved, so the button stays for another try.
        expect(await ui.find({ key: `rd-save-${id}` })).toBeDefined()
        await ui.unmount()
      }
    }
    await typed($, 'requirement for the command')
    expect(await command($, 'requirements-drafts-save')).toEqual({})
    await command($, 'requirements-drafts-pick')
    const picker = await $.ui.mount(pane('desktop', 160))
    await picker.press({ key: 'pick-0' })
    expect(world.writes.length).toBe(0)
    // The toast carries the engine's rejection whole; only its own words are pinned, not the
    // engine's prefix, so a change in the engine's wording does not turn this red.
    expect(world.toasts.length).toBe(6)
    for (const toast of world.toasts) {
      expect(toast.startsWith('Not saved: ')).toBe(true)
      expect(toast).toContain('disk full')
    }
    expect(world.logs.filter((line) => line.startsWith('requirements-drafts: save failed: ') && line.includes('disk full')).length).toBe(6)
  })
})

describe('a failed session lookup', () => {
  test('recording a sent message logs why it failed and still passes the prompt on', async ($, on) => {
    const world = stubs(on)
    await start($)
    world.sessionError = 'session gone'
    const passed = await $.prompt.submit({ text: 'a requirement while the lookup fails', wait: false, origin: { kind: 'composer' } })
    expect(passed.text).toBe('a requirement while the lookup fails')
    const line = world.logs.find((l) => l.startsWith('requirements-drafts: could not record a sent message: '))
    expect(line).toBeDefined()
    expect(line).toContain('session gone')
  })

  test('the reset after /clear logs why it failed and still passes the event on', async ($, on) => {
    const world = stubs(on)
    await start($)
    world.sessionError = 'session gone'
    await $.classic.SessionStart({ source: 'clear' })
    const line = world.logs.find((l) => l.startsWith('requirements-drafts: could not reset the sent messages: '))
    expect(line).toBeDefined()
    expect(line).toContain('session gone')
  })
})

describe('/requirements-drafts-pick', () => {
  test('lists recent messages under letter hotkeys and saves the pressed one', async ($, on) => {
    const world = stubs(on)
    await start($)
    await typed($, 'older requirement')
    await typed($, 'newer requirement')
    expect(await command($, 'requirements-drafts-pick')).toEqual({})
    let saves = 0
    for (const surface of SURFACES) {
      for (const columns of WIDTHS) {
        const ui = await $.ui.mount(pane(surface, columns))
        const first = await ui.find({ key: 'pick-0' })
        expect(first?.props.hotkey).toBe('a')
        expect(first?.props.label).toBe('a: newer requirement')
        // Bracketed, as every button in this mod: no plain prop, so the terminal draws `[ a: newer requirement ]`.
        expect(first?.props.plain).toBeUndefined()
        const second = await ui.find({ key: 'pick-1' })
        expect(second?.props.hotkey).toBe('b')
        expect(second?.props.label).toBe('b: older requirement')
        expect(second?.props.plain).toBeUndefined()
        expect(await ui.find({ type: 'Text', text: 'Esc closes' })).toBeDefined()
        await ui.press({ key: 'pick-1' })
        saves += 1
        await ui.unmount()
      }
    }
    // The first press writes; the next ones find the same hash on disk.
    expect(world.writes.length).toBe(1)
    expect(world.writes[0]!.text).toContain('via: "picker"')
    expect(world.writes[0]!.text).toContain('\nolder requirement\n')
    expect(world.closed.length).toBe(saves)
  })

  test('a long message is cut so its bracketed choice fits the pane body on both apps and widths', async ($, on) => {
    stubs(on)
    await start($)
    const long = 'the drafts list sorts newest first and keeps every older draft reachable from the picker'
    await typed($, long)
    await command($, 'requirements-drafts-pick')
    for (const surface of SURFACES) {
      for (const columns of WIDTHS) {
        const ui = await $.ui.mount(pane(surface, columns))
        const label = String((await ui.find({ key: 'pick-0' }))?.props.label)
        const body = columns - 4
        // The terminal draws `[ label ]` with no hotkey shown, so the whole bracketed label must fit the body.
        expect(`[ ${label} ]`.length).toBeLessThanOrEqual(body)
        if (columns === 160) expect(label).toBe(`a: ${long}`)
        else expect(label.startsWith('a: the drafts list') && label.endsWith('…')).toBe(true)
        await ui.unmount()
      }
    }
  })

  test('an empty list says so', async ($, on) => {
    stubs(on)
    await start($)
    await command($, 'requirements-drafts-pick')
    const ui = await $.ui.mount(pane('terminal', 80))
    expect(await ui.find({ type: 'Text', text: 'No sent message yet in this conversation.' })).toBeDefined()
    expect(await ui.find({ key: 'pick-0' })).toBeUndefined()
  })
})
