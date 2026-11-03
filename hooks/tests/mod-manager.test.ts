// cspell:ignore Uninsta: the label cut at room 8 keeps its first seven letters, then an ellipsis.
// Tests of the mod-manager pane (TRDD-J4HRAQF0, increment 1): the installed plugins in order, the mod marks, the
// question a press raises, the refusal of a press while claude reads the list, the command, and the rules under
// them. Every pane test mounts the pane on surface terminal and desktop at a narrow and a wide width, with the
// same assertions. The claude CLI and the plugins' hooks files are answered by the test, because a real claude
// would change the developer's own plugins. The hooks module (index.ts) wires the pane and the session start,
// because the host refuses $.command.register from any module that does not call it. A test cannot answer the
// engine's question: its dialog is drawn by the engine, so the press's question is observed and left unanswered.
import { describe, expect, mock, test, type MockClock, type Mounted } from 'claude-code/testing'

import {
  ENABLED_KEY,
  KEEP,
  NO_MARKETPLACE,
  actionArgv,
  actionCwd,
  actionsFor,
  appliesHere,
  classifyHooks,
  confirmThenRun,
  filterRows,
  fitLabel,
  hookFilesOf,
  isConfirmed,
  isWithin,
  lockedNote,
  orderRows,
  parseInstalled,
  questionFor,
  rejectedText,
  sectionsOf,
  toRow,
  type Action,
  type Installed,
  type Scope,
} from '../mod-manager/logic'

const SURFACES = ['terminal', 'desktop'] as const
// 16 columns leaves room 8 in the pane, so the Uninstall label must be cut; 160 leaves it whole.
const WIDTHS = [16, 160] as const
const PLACES = SURFACES.flatMap((surface) => WIDTHS.map((columns) => ({ surface, columns })))
// Absolute, because $.fs resolves a relative path against the working folder, yet no machine's path:
// <user> is a placeholder segment, which tests/test_no_absolute_paths.py does not count.
const HOME = '/home/<user>'
const CLAUDE = `${HOME}/.local/bin/claude`
const ROOT = '/work/app/sub'

// Six entries of `claude plugin list --json`. ddd-local is a local install made in /work/app, so it applies in
// ROOT; eee-elsewhere was made in another folder, so it does not.
const PLUGINS = [
  { id: 'aaa-mod@market-a', version: '1.0.0', scope: 'user', enabled: false, installPath: '/cache/market-a/aaa-mod/1.0.0' },
  { id: 'zzz-tool@market-a', version: '2.0.0', scope: 'user', enabled: true, installPath: '/cache/market-a/zzz-tool/2.0.0' },
  { id: 'mmm-mod@market-b', version: '0.3.0', scope: 'user', enabled: true, installPath: '/cache/market-b/mmm-mod/0.3.0' },
  { id: 'ccc-plain@market-b', version: '1.1.0', scope: 'user', enabled: false, installPath: '/cache/market-b/ccc-plain/1.1.0' },
  { id: 'ddd-local@market-a', version: '1.0.0', scope: 'local', enabled: true, installPath: '/cache/market-a/ddd-local/1.0.0', projectPath: '/work/app' },
  { id: 'eee-elsewhere@market-a', version: '1.0.0', scope: 'local', enabled: true, installPath: '/cache/market-a/eee-elsewhere/1.0.0', projectPath: '/elsewhere' },
]

// aaa-mod and mmm-mod are mods; zzz-tool has hooks but no modules; ccc-plain's file is malformed; ddd-local has no file;
// iii-in-place (IN_PLACE) has its file under its readFromFolder only.
const HOOKS: Record<string, string> = {
  '/cache/market-a/aaa-mod/1.0.0/hooks/hooks.json': '{"hooks": {}, "modules": ["./index.ts"]}',
  '/cache/market-b/mmm-mod/0.3.0/hooks/hooks.json': '{"modules": ["./index.ts"]}',
  '/cache/market-a/zzz-tool/2.0.0/hooks/hooks.json': '{"hooks": {}}',
  '/cache/market-b/ccc-plain/1.1.0/hooks/hooks.json': '{ not json',
  '/cache/market-c/fff-manifest/1.0.0/.claude-plugin/plugin.json': '{"hooks": ["./hooks/missing.json", "./hooks/band.json"]}',
  '/cache/market-c/fff-manifest/1.0.0/hooks/band.json': '{"modules": ["./band/register.tsx"]}',
  '/work/plugins/iii-in-place/hooks/hooks.json': '{"modules": ["./index.ts"]}',
}

// The order the pane must show with every section expanded: first the Enabled section with every enabled row of
// every marketplace (the enabled mod, then the other enabled plugins by name), then the disabled rows of each
// marketplace, marketplaces by name. Marketplace sections start collapsed, so by default only ORDER_ENABLED is drawn.
const ORDER_ENABLED = ['mm-toggle-mmm-mod@market-b|user', 'mm-toggle-ddd-local@market-a|local', 'mm-toggle-zzz-tool@market-a|user']
const ORDER = [...ORDER_ENABLED, 'mm-toggle-aaa-mod@market-a|user', 'mm-toggle-ccc-plain@market-b|user']

const QUESTION_DISABLE_ZZZ = 'Turn it off: zzz-tool (user scope)? It stops loading in your next session.'
const REFUSED_WHILE_READING = 'Wait: reading the installed plugins… is still running. Nothing was changed.'
const QUESTION_DISABLE_SYNCED = 'Turn it off: engineering (synced scope)? It stops loading in your next session. It is synced from claude.ai: to remove it, turn it off there.'
const QUESTION_DISABLE_SESSION = 'Turn it off: sss-session (session scope)? It stops loading in your next session. An installed copy with the same name, if there is one, loads instead.'
const MANAGED_NOTE = 'Managed by your organization: it cannot be changed here.'
const SIX_SCOPES = 'user, project, local, managed, session, synced'

// One entry of each scope `claude plugin list --json` reports (plugin commands chapter, line 337), every one enabled and
// applying in ROOT, so all six sit in the Enabled section, ordered by name. The synced entry has the shape Claude Code
// 2.1.316 printed for entry 525 of a real list (no projectPath), which the pane refused, blanking every row; its
// folder is a placeholder. The session id is `<name>@inline` and the managed one names its marketplace.
const SCOPED = [
  { id: 'uuu-user@market-a', version: '1.0.0', scope: 'user', enabled: true, installPath: '/cache/market-a/uuu-user/1.0.0' },
  { id: 'ppp-project@market-a', version: '1.0.0', scope: 'project', enabled: true, installPath: '/cache/market-a/ppp-project/1.0.0', projectPath: '/work/app' },
  { id: 'lll-local@market-a', version: '1.0.0', scope: 'local', enabled: true, installPath: '/cache/market-a/lll-local/1.0.0', projectPath: '/work/app' },
  { id: 'ggg-managed@market-org', version: '1.0.0', scope: 'managed', enabled: true, installPath: '/cache/market-org/ggg-managed/1.0.0' },
  { id: 'sss-session@inline', version: 'unknown', scope: 'session', enabled: true, installPath: '/work/plugins/sss-session' },
  { id: 'engineering@synced', version: '1.2.0', scope: 'synced', enabled: true, installPath: `${HOME}/.claude/plugins/synced/<org>_<account>/engineering` },
]

// A plugin loaded in place (plugin commands chapter, line 340): Claude Code reads it from readFromFolder, and its
// installPath holds nothing, so only the hooks file in readFromFolder marks it as a mod (see HOOKS).
const IN_PLACE = { id: 'iii-in-place@market-d', version: '1.0.0', scope: 'user', enabled: true, installPath: '/cache/market-d/iii-in-place/1.0.0', readFromFolder: '/work/plugins/iii-in-place' }
// A plugin from a skills folder lists as user or project scope, with the reserved origin skills-dir as its marketplace.
const SKILLS_DIR_ENTRY = { id: 'kkk-skill@skills-dir', version: '0.0.1', scope: 'user', enabled: true, installPath: `${HOME}/.claude/skills/kkk-skill` }
const SKILLS_DIR_NOTE = 'Loaded from a skills folder: delete its folder to remove it.'
const REFUSED_ID_NOTE = 'No change is offered: its id is not a lowercase name@marketplace.'
// An entry of a scope the pane does not know, listed after the six of PLUGINS, so it is entry 6.
const ODD = { id: 'odd-tool@market-x', version: '1.0.0', scope: 'team', enabled: true, installPath: '/cache/market-x/odd-tool/1.0.0' }
const ODD_LINE = `Entry 6 of the plugin list (odd-tool@market-x) is not shown: scope "team" is not one of ${SIX_SCOPES}.`
const LIST_FAILED = 'the plugin settings could not be read'

/** A promise the test resolves by hand: it holds the next claude call until the test lets it finish. */
function deferred(): { promise: Promise<void>; resolve: () => void } {
  let release: () => void = () => undefined
  const promise = new Promise<void>((done) => {
    release = done
  })
  return { promise, resolve: () => release() }
}

type World = {
  clock: MockClock
  session: string
  root: string
  /** False: claude is at none of its candidate places. */
  claudeFound: boolean
  /** True: the next `claude plugin list` exits 1 with LIST_FAILED. */
  listFails: boolean
  /** Every process.run, with the folder it ran in. */
  calls: Array<{ argv: string[]; cwd: string | undefined }>
  /** When set, the next claude call waits on it before it finishes. */
  hold: ReturnType<typeof deferred> | undefined
  /** The question of every AskUserQuestion the engine raised for a press. */
  asked: string[]
  commands: string[]
  tools: string[]
  opened: unknown[]
  toasts: string[]
  /** Every $.ui.log line, with the sink it was sent to. */
  logs: Array<{ text: string; to: string | undefined }>
}

// `listed` is what claude answers as JSON, so a test can hand it an entry of any shape, a malformed one included.
function world(on: any, listed: readonly unknown[] = PLUGINS): World {
  const w: World = { clock: mock.clock(on, { now: 1_000 }), session: 'sess-1', root: ROOT, claudeFound: true, listFails: false, calls: [], hold: undefined, asked: [], commands: [], tools: [], opened: [], toasts: [], logs: [] }
  // The session start beneath the plugin's own: index.ts runs every mod's start, startModManager among them, then the kit answers with this.
  on('session.start', ($: any, e: any) => ({ cwd: e.cwd }))
  on('session.id', () => ({ value: w.session }))
  on('session.root', () => ({ value: w.root }))
  on('env.get', ($: any, e: any) => ({ value: e.name === 'HOME' ? HOME : undefined }))
  on('fs.exists', ($: any, e: any) => ({ value: w.claudeFound && e.path === CLAUDE }))
  on('fs.stat', () => ({ value: { kind: 'file' } }))
  on('fs.read', ($: any, e: any) => {
    if (e.path in HOOKS) return { value: HOOKS[e.path] }
    throw new Error(`ENOENT: ${e.path}`)
  })
  on('process.run', async ($: any, e: any) => {
    w.calls.push({ argv: e.argv, cwd: e.init?.cwd })
    if (w.hold !== undefined) {
      const hold = w.hold
      w.hold = undefined
      await hold.promise
    }
    if (e.argv[2] === 'list' && w.listFails) return { value: { exitCode: 1, stdout: '', stderr: LIST_FAILED, isStdoutTruncated: false, isStderrTruncated: false } }
    if (e.argv[2] === 'list') return { value: { exitCode: 0, stdout: JSON.stringify(listed), stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  // The engine raises its question as this tool call; the test records it and leaves it unanswered.
  on('tool.call', { tool: 'AskUserQuestion' }, ($: any, e: any) => {
    w.asked.push(String(e.questions?.[0]?.question))
    return { deny: 'no one answered in a test' }
  })
  on('command.register', ($: any, e: any) => {
    w.commands.push(e.name)
    return { value: { command: e.name } }
  })
  on('tool.register', ($: any, e: any) => {
    w.tools.push(e.name)
    return { value: { tool: e.name } }
  })
  on('ui.log', ($: any, e: any) => {
    w.logs.push({ text: e.text, to: e.to })
    return { value: undefined }
  })
  on('ui.toast', ($: any, e: any) => {
    w.toasts.push(e.text)
    return { value: undefined }
  })
  on('ui.open', ($: any, e: any) => {
    w.opened.push(e)
    return { value: { isPlaced: true } }
  })
  return w
}

const actions = (w: World) => w.calls.filter((call) => call.argv[2] !== 'list')

function start($: any, surface: (typeof SURFACES)[number]) {
  return $.session.start({ surface, isInteractive: true, cwd: ROOT })
}

function openPane($: any) {
  return $.command.run({ command: 'mod-manager', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } })
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

/** Starts a session for a fresh session id, opens the pane, lets the read finish, and mounts it. */
async function openAndMount($: any, w: World, session: string, surface: (typeof SURFACES)[number], columns: number): Promise<Mounted<'terminal' | 'desktop'>> {
  w.session = session
  await start($, surface)
  await openPane($)
  await w.clock.settle()
  return $.ui.mount(pane(surface, columns))
}

const toggleKeys = async (ui: Mounted<'terminal' | 'desktop'>): Promise<string[]> =>
  (await ui.findAll({ type: 'Button' })).map((b) => b.key).filter((key): key is string => key !== undefined && key.startsWith('mm-toggle-'))

/** The keys of every row button, Turn on or off and Uninstall, in the order drawn. */
const rowButtonKeys = async (ui: Mounted<'terminal' | 'desktop'>): Promise<string[]> =>
  (await ui.findAll({ type: 'Button' })).map((b) => b.key).filter((key): key is string => key !== undefined && /^mm-(toggle|remove)-/.test(key))

const sectionLabel = (ui: Mounted<'terminal' | 'desktop'>, key: string): Promise<string | undefined> => ui.find({ key }).then((b) => (b === undefined ? undefined : String(b.props.label)))

/** Opens the two marketplace sections of disabled rows, which start collapsed. */
async function expandOff(ui: Mounted<'terminal' | 'desktop'>, w: World): Promise<void> {
  for (const key of ['mm-sec-market-a', 'mm-sec-market-b']) {
    await ui.press({ key })
    await w.clock.settle()
  }
}

describe('the installed plugins pane', () => {
  test('lists every enabled row first (mods, then the other plugins), then the disabled rows by marketplace, and marks each mod', async ($, on) => {
    const w = world(on)
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `order-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ type: 'Text', text: '5 installed · 3 active · 2 mods' })).toBeDefined()
      // The marketplace sections start collapsed: only the Enabled section's rows are drawn.
      expect(await toggleKeys(ui)).toEqual(ORDER_ENABLED)
      await expandOff(ui, w)
      expect(await toggleKeys(ui)).toEqual(ORDER)
      expect(await ui.findAll({ type: 'Text', text: /^mod$/ })).toHaveLength(2)
      await ui.unmount()
    }
  })

  test('with every section expanded, every enabled row is above every disabled row, and enabled mods are above enabled plugins', async ($, on) => {
    const w = world(on)
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `above-${surface}-${columns}`, surface, columns)
      await expandOff(ui, w)
      const keys = await toggleKeys(ui)
      const at = (row: string) => keys.indexOf(`mm-toggle-${row}`)
      const enabled = ['mmm-mod@market-b|user', 'ddd-local@market-a|local', 'zzz-tool@market-a|user'].map(at)
      const disabled = ['aaa-mod@market-a|user', 'ccc-plain@market-b|user'].map(at)
      expect(Math.min(...enabled, ...disabled)).toBeGreaterThanOrEqual(0)
      // aaa-mod is a disabled mod of market-a: under the per-marketplace layout it sat above market-b's enabled mmm-mod.
      expect(Math.max(...enabled)).toBeLessThan(Math.min(...disabled))
      expect(at('mmm-mod@market-b|user')).toBeLessThan(at('ddd-local@market-a|local'))
      expect(at('mmm-mod@market-b|user')).toBeLessThan(at('zzz-tool@market-a|user'))
      await ui.unmount()
    }
  })

  test('the Enabled section lists the enabled rows of two marketplaces, and no row is drawn twice', async ($, on) => {
    const w = world(on)
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `enabled-${surface}-${columns}`, surface, columns)
      expect(await toggleKeys(ui)).toEqual(ORDER_ENABLED)
      await expandOff(ui, w)
      const keys = await toggleKeys(ui)
      expect(new Set(keys).size).toBe(keys.length)
      expect(keys.slice(0, 3).map((key) => key.split('@')[1])).toEqual(['market-b|user', 'market-a|local', 'market-a|user'])
      await ui.unmount()
    }
  })

  test('the headers are "<n> enabled" and "<n> off · <marketplace>" in that order, and a header cut to the narrow room keeps its count', async ($, on) => {
    const w = world(on)
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `sections-${surface}-${columns}`, surface, columns)
      const headers = (await ui.findAll({ type: 'Button' })).map((b) => b.key).filter((key): key is string => key !== undefined && key.startsWith('mm-sec-'))
      expect(headers).toEqual(['mm-sec-all enabled', 'mm-sec-market-a', 'mm-sec-market-b'])
      expect(await sectionLabel(ui, 'mm-sec-all enabled')).toBe(fitLabel('3 enabled', columns - 8))
      expect(await sectionLabel(ui, 'mm-sec-market-a')).toBe(fitLabel('1 off · market-a', columns - 8))
      expect(await sectionLabel(ui, 'mm-sec-market-b')).toBe(fitLabel('1 off · market-b', columns - 8))
      if (columns === 16) {
        // Room 8: the name is what gets cut, never the count.
        expect(await sectionLabel(ui, 'mm-sec-market-a')).toBe('1 off ·…')
        expect(await sectionLabel(ui, 'mm-sec-all enabled')).toBe('3 enabl…')
      }
      await ui.unmount()
    }
  })

  test('marketplace sections start collapsed; a press expands one and a second press collapses it, without touching the others', async ($, on) => {
    const w = world(on)
    const aaa = 'mm-toggle-aaa-mod@market-a|user'
    const ccc = 'mm-toggle-ccc-plain@market-b|user'
    for (const { surface, columns } of PLACES) {
      w.calls = []
      const ui = await openAndMount($, w, `collapse-${surface}-${columns}`, surface, columns)
      expect(await toggleKeys(ui)).toEqual(ORDER_ENABLED)
      await ui.press({ key: 'mm-sec-market-a' })
      await w.clock.settle()
      expect(await toggleKeys(ui)).toEqual([...ORDER_ENABLED, aaa])
      await ui.press({ key: 'mm-sec-market-b' })
      await w.clock.settle()
      expect(await toggleKeys(ui)).toEqual([...ORDER_ENABLED, aaa, ccc])
      await ui.press({ key: 'mm-sec-market-a' })
      await w.clock.settle()
      expect(await toggleKeys(ui)).toEqual([...ORDER_ENABLED, ccc])
      expect(await sectionLabel(ui, 'mm-sec-market-a')).toBeDefined()
      // The Enabled section collapses too, and its rows come back with a second press.
      await ui.press({ key: 'mm-sec-all enabled' })
      await w.clock.settle()
      expect(await toggleKeys(ui)).toEqual([ccc])
      await ui.press({ key: 'mm-sec-all enabled' })
      await w.clock.settle()
      expect(await toggleKeys(ui)).toEqual([...ORDER_ENABLED, ccc])
      expect(actions(w)).toEqual([])
      await ui.unmount()
    }
  })

  test('the filter field types to matching rows only, opens matches inside collapsed sections, shows "n of m shown", and clearing it restores the earlier layout', async ($, on) => {
    const w = world(on)
    const ccc = 'mm-toggle-ccc-plain@market-b|user'
    const aaa = 'mm-toggle-aaa-mod@market-a|user'
    for (const { surface, columns } of PLACES) {
      w.calls = []
      const ui = await openAndMount($, w, `filter-${surface}-${columns}`, surface, columns)
      const input = await ui.find({ key: 'mm-filter' })
      expect(input).toBeDefined()
      expect(input?.props.value).toBe('')
      expect(await ui.find({ type: 'Text', text: /shown$/ })).toBeUndefined()
      // Leave market-a open and market-b closed, so clearing the filter has a layout to restore.
      await ui.press({ key: 'mm-sec-market-a' })
      await w.clock.settle()
      expect(await toggleKeys(ui)).toEqual([...ORDER_ENABLED, aaa])
      // ccc-plain sits in the collapsed market-b section: the filter still shows it.
      await ui.input({ key: 'mm-filter', text: 'CCC', kind: 'change' })
      await w.clock.settle()
      expect(await toggleKeys(ui)).toEqual([ccc])
      expect(await ui.find({ type: 'Text', text: '1 of 5 shown' })).toBeDefined()
      expect((await ui.find({ key: 'mm-filter' }))?.props.value).toBe('CCC')
      // Submitting (Enter) does nothing: the text and the rows stay as they were.
      await ui.input({ key: 'mm-filter', text: 'CCC' })
      await w.clock.settle()
      expect(await toggleKeys(ui)).toEqual([ccc])
      expect((await ui.find({ key: 'mm-filter' }))?.props.value).toBe('CCC')
      // A marketplace term, two terms (AND), and the "mod" keyword.
      await ui.input({ key: 'mm-filter', text: 'market-b', kind: 'change' })
      await w.clock.settle()
      expect(await toggleKeys(ui)).toEqual(['mm-toggle-mmm-mod@market-b|user', ccc])
      await ui.input({ key: 'mm-filter', text: 'market-b  mod', kind: 'change' })
      await w.clock.settle()
      expect(await toggleKeys(ui)).toEqual(['mm-toggle-mmm-mod@market-b|user'])
      expect(await ui.find({ type: 'Text', text: '1 of 5 shown' })).toBeDefined()
      await ui.input({ key: 'mm-filter', text: 'mod', kind: 'change' })
      await w.clock.settle()
      expect(await toggleKeys(ui)).toEqual(['mm-toggle-mmm-mod@market-b|user', aaa])
      expect(await ui.find({ type: 'Text', text: '2 of 5 shown' })).toBeDefined()
      // Cleared: the person's own layout (market-a open, market-b closed) applies again, and the count line is gone.
      await ui.input({ key: 'mm-filter', text: '', kind: 'change' })
      await w.clock.settle()
      expect(await toggleKeys(ui)).toEqual([...ORDER_ENABLED, aaa])
      expect(await ui.find({ type: 'Text', text: /shown$/ })).toBeUndefined()
      // Spaces only is an empty query too.
      await ui.input({ key: 'mm-filter', text: '   ', kind: 'change' })
      await w.clock.settle()
      expect(await toggleKeys(ui)).toEqual([...ORDER_ENABLED, aaa])
      expect(await ui.find({ type: 'Text', text: /shown$/ })).toBeUndefined()
      // Typing never calls claude.
      expect(actions(w)).toEqual([])
      expect(w.calls.filter((call) => call.argv[2] === 'list')).toHaveLength(1)
      await ui.unmount()
    }
  })

  test('a filter that matches nothing shows "No plugin matches." instead of sections', async ($, on) => {
    const w = world(on)
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `nomatch-${surface}-${columns}`, surface, columns)
      await ui.input({ key: 'mm-filter', text: 'nothing-like-this', kind: 'change' })
      await w.clock.settle()
      expect(await ui.find({ type: 'Text', text: 'No plugin matches.' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: '0 of 5 shown' })).toBeDefined()
      expect(await toggleKeys(ui)).toEqual([])
      expect((await ui.findAll({ type: 'Button' })).filter((b) => b.key?.startsWith('mm-sec-'))).toEqual([])
      await ui.unmount()
    }
  })
  test('"mod" selects mods only and is not a substring term: a non-mod named model-tools is excluded by "mod" and kept by "model"', async ($, on) => {
    const model = { id: 'model-tools@market-a', version: '1.0.0', scope: 'user', enabled: false, installPath: '/cache/market-a/model-tools/1.0.0' }
    const w = world(on, [...PLUGINS, model])
    const modelKey = 'mm-toggle-model-tools@market-a|user'
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `modword-${surface}-${columns}`, surface, columns)
      await ui.input({ key: 'mm-filter', text: 'mod', kind: 'change' })
      await w.clock.settle()
      expect(await toggleKeys(ui)).toEqual(['mm-toggle-mmm-mod@market-b|user', 'mm-toggle-aaa-mod@market-a|user'])
      expect(await ui.find({ type: 'Text', text: '2 of 6 shown' })).toBeDefined()
      await ui.input({ key: 'mm-filter', text: 'model', kind: 'change' })
      await w.clock.settle()
      expect(await toggleKeys(ui)).toEqual([modelKey])
      await ui.unmount()
    }
  })

  test('a section header press while a filter forces the sections open does nothing, and the earlier layout is back once the filter is cleared', async ($, on) => {
    const w = world(on)
    const aaa = 'mm-toggle-aaa-mod@market-a|user'
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `pressfilter-${surface}-${columns}`, surface, columns)
      await ui.input({ key: 'mm-filter', text: 'mod', kind: 'change' })
      await w.clock.settle()
      const before = await toggleKeys(ui)
      expect(before).toEqual(['mm-toggle-mmm-mod@market-b|user', aaa])
      // market-a is drawn open by the filter; pressing its header and the Enabled header must change nothing.
      await ui.press({ key: 'mm-sec-market-a' })
      await w.clock.settle()
      await ui.press({ key: 'mm-sec-all enabled' })
      await w.clock.settle()
      expect(await toggleKeys(ui)).toEqual(before)
      // Cleared: market-a is still collapsed (the press did not toggle it) and the Enabled section is still open.
      await ui.input({ key: 'mm-filter', text: '', kind: 'change' })
      await w.clock.settle()
      expect(await toggleKeys(ui)).toEqual(ORDER_ENABLED)
      await ui.unmount()
    }
  })

  test('a one-character filter filters the rows but keeps the person\'s own collapsed sections; two characters open them', async ($, on) => {
    const w = world(on)
    const ddd = 'mm-toggle-ddd-local@market-a|local'
    const ccc = 'mm-toggle-ccc-plain@market-b|user'
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `onechar-${surface}-${columns}`, surface, columns)
      // "c" matches ddd-local (enabled) and ccc-plain (in the collapsed market-b section): only the first is drawn.
      await ui.input({ key: 'mm-filter', text: 'c', kind: 'change' })
      await w.clock.settle()
      expect(await toggleKeys(ui)).toEqual([ddd])
      expect(await ui.find({ type: 'Text', text: '2 of 5 shown' })).toBeDefined()
      // A press still toggles with one character, because the sections are drawn as the person left them.
      await ui.press({ key: 'mm-sec-market-b' })
      await w.clock.settle()
      expect(await toggleKeys(ui)).toEqual([ddd, ccc])
      await ui.press({ key: 'mm-sec-market-b' })
      await w.clock.settle()
      expect(await toggleKeys(ui)).toEqual([ddd])
      // "cc" has two characters: market-b opens by force.
      await ui.input({ key: 'mm-filter', text: 'cc', kind: 'change' })
      await w.clock.settle()
      expect(await toggleKeys(ui)).toEqual([ccc])
      // The trimmed length counts: "c " is still one character.
      await ui.input({ key: 'mm-filter', text: 'c ', kind: 'change' })
      await w.clock.settle()
      expect(await toggleKeys(ui)).toEqual([ddd])
      await ui.unmount()
    }
  })

  test('with no plugin listed there is no filter field and no "n of m shown" line', async ($, on) => {
    const w = world(on, [])
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `nolist-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ key: 'mm-filter' })).toBeUndefined()
      expect(await ui.find({ type: 'Text', text: /shown$/ })).toBeUndefined()
      expect(await ui.find({ type: 'Text', text: 'No plugins are installed.' })).toBeDefined()
      await ui.unmount()
    }
  })

  test('when claude is not found, the pane names the places it looked', async ($, on) => {
    const w = world(on)
    w.claudeFound = false
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `missing-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ type: 'Text', text: 'The installed plugins could not be read.' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: `claude was not found; looked in ${CLAUDE}` })).toBeDefined()
      expect(await ui.findAll({ type: 'Button' })).toHaveLength(1)
      await ui.unmount()
    }
  })

  test('when the claudePath setting names an absent file, the pane shows the rejection naming the setting', { options: { claudePath: '/custom/claude' } }, async ($, on) => {
    const w = world(on)
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `custom-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ type: 'Text', text: 'claude was not found; looked in /custom/claude (the claudePath setting)' })).toBeDefined()
      await ui.unmount()
    }
  })

  test('the row buttons fit the pane: a label too long for the room is cut with an ellipsis', async ($, on) => {
    const w = world(on)
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `labels-${surface}-${columns}`, surface, columns)
      await expandOff(ui, w)
      const uninstall = await ui.find({ key: 'mm-remove-aaa-mod@market-a|user' })
      const label = String(uninstall?.props.label)
      expect(label.length).toBeLessThanOrEqual(columns - 8)
      expect(['Uninstall', 'Uninsta…']).toContain(label)
      await ui.unmount()
    }
  })

  test('a press asks first: the question is raised, and with no answer nothing runs', async ($, on) => {
    const w = world(on)
    for (const { surface, columns } of PLACES) {
      w.asked = []
      w.calls = []
      const ui = await openAndMount($, w, `ask-${surface}-${columns}`, surface, columns)
      await ui.press({ key: 'mm-toggle-zzz-tool@market-a|user' })
      await w.clock.settle()
      expect(w.asked).toEqual([QUESTION_DISABLE_ZZZ])
      expect(actions(w)).toEqual([])
      await ui.unmount()
    }
  })

  test('a press while claude reads the list is refused with a toast, and no question is raised', async ($, on) => {
    const w = world(on)
    for (const { surface, columns } of PLACES) {
      w.asked = []
      w.calls = []
      w.toasts = []
      const ui = await openAndMount($, w, `busy-${surface}-${columns}`, surface, columns)
      // The next claude call is the list read that Refresh starts; it waits until the test lets it finish.
      const hold = deferred()
      w.hold = hold
      await ui.press({ key: 'mm-refresh' })
      await ui.press({ key: 'mm-toggle-zzz-tool@market-a|user' })
      await w.clock.settle()
      expect(w.toasts).toEqual([REFUSED_WHILE_READING])
      expect(w.asked).toEqual([])
      expect(actions(w)).toEqual([])
      hold.resolve()
      await w.clock.settle()
      await ui.unmount()
    }
  })

  test('the command only opens the pane: its arguments are ignored, and nothing is changed', async ($, on) => {
    const w = world(on)
    w.session = 'command-only'
    await start($, 'terminal')
    await $.command.run({ command: 'mod-manager', args: 'disable zzz-tool@market-a user', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } })
    await w.clock.settle()
    expect(w.opened).toHaveLength(1)
    expect((w.opened[0] as { id: string }).id).toBe('mod-manager')
    expect(actions(w)).toEqual([])
  })

  test('the session start registers the mod-manager command once, at start', async ($, on) => {
    const w = world(on)
    w.session = 'registers'
    await start($, 'terminal')
    // A command has no deferred form in CommandSpec, so being listed after session start is the whole check. Only the mod-manager name is counted, because the other mods register in the same start.
    expect(w.commands.filter((name) => name === 'mod-manager')).toEqual(['mod-manager'])
  })

  // The manifest declares a file that does not exist first: it is logged, and the file after it still makes the plugin a mod.
  test('a plugin whose only modules sit in a manifest-declared file is listed as a mod', async ($, on) => {
    const plugin = { id: 'fff-manifest@market-c', version: '1.0.0', scope: 'user', enabled: true, installPath: '/cache/market-c/fff-manifest/1.0.0' }
    const w = world(on, [plugin])
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `manifest-${surface}-${columns}`, surface, columns)
      expect(await toggleKeys(ui)).toEqual(['mm-toggle-fff-manifest@market-c|user'])
      expect(await ui.findAll({ type: 'Text', text: /^mod$/ })).toHaveLength(1)
      await ui.unmount()
    }
  })

  test('one row per scope: user, project and local rows turn off and uninstall, synced and session rows only turn off, a managed row names why it has no button', async ($, on) => {
    const w = world(on, SCOPED)
    for (const { surface, columns } of PLACES) {
      w.calls = []
      const ui = await openAndMount($, w, `scopes-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ type: 'Text', text: '6 installed · 6 active · 0 mods' })).toBeDefined()
      expect(await rowButtonKeys(ui)).toEqual([
        'mm-toggle-engineering@synced|synced',
        'mm-toggle-lll-local@market-a|local',
        'mm-remove-lll-local@market-a|local',
        'mm-toggle-ppp-project@market-a|project',
        'mm-remove-ppp-project@market-a|project',
        'mm-toggle-sss-session@inline|session',
        'mm-toggle-uuu-user@market-a|user',
        'mm-remove-uuu-user@market-a|user',
      ])
      for (const key of await toggleKeys(ui)) expect((await ui.find({ key }))?.props.label).toBe('Turn off')
      expect(await ui.find({ type: 'Text', text: MANAGED_NOTE })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: '1.2.0 · synced · synced scope' })).toBeDefined()
      expect(actions(w)).toEqual([])
      await ui.unmount()
    }
  })

  test('a synced row\'s press asks a question that says it is removed on claude.ai, a session row\'s that an installed copy loads instead; with no answer nothing runs', async ($, on) => {
    const w = world(on, SCOPED)
    for (const { surface, columns } of PLACES) {
      w.asked = []
      w.calls = []
      const ui = await openAndMount($, w, `scope-ask-${surface}-${columns}`, surface, columns)
      await ui.press({ key: 'mm-toggle-engineering@synced|synced' })
      await w.clock.settle()
      await ui.press({ key: 'mm-toggle-sss-session@inline|session' })
      await w.clock.settle()
      expect(w.asked).toEqual([QUESTION_DISABLE_SYNCED, QUESTION_DISABLE_SESSION])
      expect(actions(w)).toEqual([])
      await ui.unmount()
    }
  })

  test('an entry the pane cannot read is named on its own line (index, id, reason), and every other row is still shown', async ($, on) => {
    const w = world(on, [...PLUGINS, ODD])
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `rejected-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ type: 'Text', text: '5 installed · 3 active · 2 mods' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: ODD_LINE })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /^Couldn't read/ })).toBeUndefined()
      expect(await toggleKeys(ui)).toEqual(ORDER_ENABLED)
      await expandOff(ui, w)
      expect(await toggleKeys(ui)).toEqual(ORDER)
      await ui.unmount()
    }
  })

  test('when no entry can be read, each one is named and the pane does not say that no plugin is installed', async ($, on) => {
    const w = world(on, [{ id: 'odd-tool@market-x', scope: 'team', enabled: true, installPath: '/cache/market-x/odd-tool/1.0.0' }, 'not an entry'])
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `none-read-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ type: 'Text', text: '0 installed · 0 active · 0 mods' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: `Entry 0 of the plugin list (odd-tool@market-x) is not shown: scope "team" is not one of ${SIX_SCOPES}.` })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: 'Entry 1 of the plugin list is not shown: it is not an object.' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: 'No plugins are installed.' })).toBeUndefined()
      expect(await toggleKeys(ui)).toEqual([])
      await ui.unmount()
    }
  })

  test('a plugin loaded in place is a mod when its readFromFolder holds the modules, though nothing sits under its installPath', async ($, on) => {
    const w = world(on, [IN_PLACE])
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `in-place-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ type: 'Text', text: '1 installed · 1 active · 1 mod' })).toBeDefined()
      expect(await ui.findAll({ type: 'Text', text: /^mod$/ })).toHaveLength(1)
      await ui.unmount()
    }
  })

  test('a skills-folder row turns on or off but offers no Uninstall, and its note says to delete its folder', async ($, on) => {
    const w = world(on, [SKILLS_DIR_ENTRY])
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `skills-dir-${surface}-${columns}`, surface, columns)
      expect(await rowButtonKeys(ui)).toEqual(['mm-toggle-kkk-skill@skills-dir|user'])
      expect(await ui.find({ type: 'Text', text: SKILLS_DIR_NOTE })).toBeDefined()
      await ui.unmount()
    }
  })

  test('a row whose id is not a lowercase name@marketplace offers no button, and its note says why', async ($, on) => {
    const w = world(on, [{ id: 'Upper-Case@market-a', version: '1.0.0', scope: 'user', enabled: true, installPath: '/cache/market-a/Upper-Case/1.0.0' }])
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `refused-id-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ type: 'Text', text: '1 installed · 1 active · 0 mods' })).toBeDefined()
      expect(await rowButtonKeys(ui)).toEqual([])
      expect(await ui.find({ type: 'Text', text: REFUSED_ID_NOTE })).toBeDefined()
      await ui.unmount()
    }
  })

  test('a refresh that fails clears the lines of the entries the last read could not read, and says why it failed', async ($, on) => {
    const w = world(on, [...PLUGINS, ODD])
    for (const { surface, columns } of PLACES) {
      w.listFails = false
      const ui = await openAndMount($, w, `refresh-fails-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ type: 'Text', text: ODD_LINE })).toBeDefined()
      w.listFails = true
      await ui.press({ key: 'mm-refresh' })
      await w.clock.settle()
      expect(await ui.find({ type: 'Text', text: `Couldn't read the installed plugins: ${LIST_FAILED}` })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: ODD_LINE })).toBeUndefined()
      await ui.unmount()
    }
  })

  test('the pane names the first five entries it cannot read, cuts each reason to 80 characters, shows a control character as ?, counts the rest on one line, and logs every one to the debug log', async ($, on) => {
    const bad = [
      { id: 'odd-a@market-x', scope: 'team', enabled: true, installPath: '/x/a' },
      { id: 'odd-long@market-x', scope: 'x'.repeat(200), enabled: true, installPath: '/x/long' },
      { id: 'odd\u0007bell@market-x', scope: 'team', enabled: true, installPath: '/x/bell' },
      { id: 'odd-d@market-x', scope: 'team', enabled: true, installPath: '/x/d' },
      { id: 'odd-e@market-x', scope: 'team', enabled: true, installPath: '/x/e' },
      { id: 'odd-f@market-x', scope: 'team', enabled: true, installPath: '/x/f' },
      { id: 'odd-g@market-x', scope: 'team', enabled: true, installPath: '/x/g' },
    ]
    const team = `scope "team" is not one of ${SIX_SCOPES}`
    const line = (index: number, id: string, reason: string) => `Entry ${index} of the plugin list (${id}) is not shown: ${reason}.`
    // PLUGINS holds entries 0 to 5, so the bad ones are entries 6 to 12; the pane names 6 to 10 and counts 11 and 12.
    const shown = [
      line(6, 'odd-a@market-x', team),
      line(7, 'odd-long@market-x', `scope "${'x'.repeat(72)}…`),
      line(8, 'odd?bell@market-x', team),
      line(9, 'odd-d@market-x', team),
      line(10, 'odd-e@market-x', team),
    ]
    const logged = [
      line(6, 'odd-a@market-x', team),
      line(7, 'odd-long@market-x', `scope "${'x'.repeat(200)}" is not one of ${SIX_SCOPES}`),
      line(8, 'odd?bell@market-x', team),
      line(9, 'odd-d@market-x', team),
      line(10, 'odd-e@market-x', team),
      line(11, 'odd-f@market-x', team),
      line(12, 'odd-g@market-x', team),
    ].map((text) => ({ text: `mod-manager: ${text}`, to: 'debug' }))
    const w = world(on, [...PLUGINS, ...bad])
    for (const { surface, columns } of PLACES) {
      w.logs = []
      const ui = await openAndMount($, w, `rejected-cap-${surface}-${columns}`, surface, columns)
      for (const text of shown) expect((await ui.find({ type: 'Text', text }))?.props.wrap).toBe('truncate-end')
      expect(await ui.findAll({ type: 'Text', text: /^Entry \d+ of the plugin list/ })).toHaveLength(5)
      expect(await ui.find({ type: 'Text', text: 'and 2 more, each named in the debug log.' })).toBeDefined()
      expect(w.logs.filter((log) => log.text.startsWith('mod-manager: Entry '))).toEqual(logged)
      expect(await toggleKeys(ui)).toEqual(ORDER_ENABLED)
      await ui.unmount()
    }
  })
})

describe('the confirm guard, with plain answer functions', () => {
  // confirmThenRun is the rule confirmAndAct runs, given plain answers in place of the engine dialog.
  test('confirm runs the action exactly once and reports ran', async () => {
    let runs = 0
    const outcome = await confirmThenRun('disable', async () => 'Turn it off', async () => {
      runs += 1
    })
    expect(outcome).toBe('ran')
    expect(runs).toBe(1)
  })

  test('decline runs nothing and reports declined', async () => {
    let runs = 0
    const outcome = await confirmThenRun('disable', async () => KEEP, async () => {
      runs += 1
    })
    expect(outcome).toBe('declined')
    expect(runs).toBe(0)
  })

  test('a rejected ask, a dismissed question, runs nothing and reports dismissed', async () => {
    let runs = 0
    const outcome = await confirmThenRun(
      'disable',
      async () => {
        throw new Error('the question was dismissed')
      },
      async () => {
        runs += 1
      },
    )
    expect(outcome).toBe('dismissed')
    expect(runs).toBe(0)
  })

  test('any other label runs nothing and reports declined: another label, another case, a stray space, free text', async () => {
    for (const answer of ['Turn it on', 'Uninstall it', 'turn it off', 'Turn it off ', 'Turn it off, please']) {
      let runs = 0
      const outcome = await confirmThenRun('disable', async () => answer, async () => {
        runs += 1
      })
      expect(outcome).toBe('declined')
      expect(runs).toBe(0)
    }
  })
})

describe('the rules under the pane', () => {
  const entry = (name: string, enabled: boolean): Installed => ({
    id: `${name}@m`,
    version: undefined,
    scope: 'user',
    enabled,
    installPath: `/cache/m/${name}`,
    readFromFolder: undefined,
    projectPath: undefined,
  })

  test('parseInstalled reads the list, and names each entry of a shape it does not know while still reading the others', () => {
    expect(parseInstalled(JSON.stringify([PLUGINS[0]]))).toEqual({
      entries: [{ id: 'aaa-mod@market-a', version: '1.0.0', scope: 'user', enabled: false, installPath: '/cache/market-a/aaa-mod/1.0.0', readFromFolder: undefined, projectPath: undefined }],
      rejected: [],
    })
    expect(() => parseInstalled('{"installed": []}')).toThrow('did not answer a list')
    const listed = parseInstalled(JSON.stringify([{ ...PLUGINS[0], scope: 'team' }, PLUGINS[1], { ...PLUGINS[2], enabled: 'yes' }, 7, { scope: 'user' }, { ...PLUGINS[3], scope: undefined }]))
    expect(listed.entries.map((entry) => entry.id)).toEqual(['zzz-tool@market-a'])
    expect(listed.rejected).toEqual([
      { index: 0, id: 'aaa-mod@market-a', reason: `scope "team" is not one of ${SIX_SCOPES}` },
      { index: 2, id: 'mmm-mod@market-b', reason: 'enabled is not true or false' },
      { index: 3, id: undefined, reason: 'it is not an object' },
      { index: 4, id: undefined, reason: 'id is not a string; enabled is not true or false; installPath is not a string' },
      { index: 5, id: 'ccc-plain@market-b', reason: 'scope is missing' },
    ])
    expect(rejectedText(listed.rejected[0]!)).toBe(`Entry 0 of the plugin list (aaa-mod@market-a) is not shown: scope "team" is not one of ${SIX_SCOPES}.`)
    expect(rejectedText(listed.rejected[2]!)).toBe('Entry 3 of the plugin list is not shown: it is not an object.')
  })

  test('parseInstalled reads an entry of each of the six documented scopes, the synced one in the shape Claude Code 2.1.316 prints', () => {
    const listed = parseInstalled(JSON.stringify(SCOPED))
    expect(listed.rejected).toEqual([])
    expect(listed.entries.map((entry) => entry.scope)).toEqual(['user', 'project', 'local', 'managed', 'session', 'synced'])
    expect(listed.entries[5]).toEqual({ ...SCOPED[5], readFromFolder: undefined, projectPath: undefined })
  })

  test('parseInstalled keeps readFromFolder, the folder a plugin loaded in place is read from', () => {
    expect(parseInstalled(JSON.stringify([IN_PLACE])).entries).toEqual([{ ...IN_PLACE, projectPath: undefined }])
  })

  test('rejectedText shows a control character in an id or a reason as ?, so it never reaches the terminal', () => {
    expect(rejectedText({ index: 3, id: 'odd\u0007bell@m', reason: 'scope "a\u001bb" is not one of x' })).toBe('Entry 3 of the plugin list (odd?bell@m) is not shown: scope "a?b" is not one of x.')
  })

  test('classifyHooks: a non-empty modules list makes a mod; an empty, absent or malformed one does not', () => {
    expect(classifyHooks('{"modules": ["./index.ts"]}')).toEqual({ isMod: true, problem: undefined })
    expect(classifyHooks('{"modules": []}')).toEqual({ isMod: false, problem: undefined })
    expect(classifyHooks('{"hooks": {}}')).toEqual({ isMod: false, problem: undefined })
    expect(classifyHooks('{ not json').isMod).toBe(false)
    expect(classifyHooks('{ not json').problem).toMatch(/^not JSON/)
  })

  test('hookFilesOf: the array form reads each declared path after the default file, with a leading ./ removed and listed once', () => {
    expect(hookFilesOf('{"hooks": ["./hooks/a.json", "hooks/b.json", "./hooks/hooks.json"]}')).toEqual({
      paths: ['hooks/hooks.json', 'hooks/a.json', 'hooks/b.json'],
      inlineIsMod: false,
      rejected: [],
      problem: undefined,
    })
  })

  test('hookFilesOf: the string form is one more file', () => {
    expect(hookFilesOf('{"hooks": "./hooks/a.json"}')).toEqual({ paths: ['hooks/hooks.json', 'hooks/a.json'], inlineIsMod: false, rejected: [], problem: undefined })
  })

  test('hookFilesOf: an inline hooks object is a mod only when its modules list is not empty', () => {
    expect(hookFilesOf('{"hooks": {"modules": ["./index.ts"]}}')).toEqual({ paths: ['hooks/hooks.json'], inlineIsMod: true, rejected: [], problem: undefined })
    expect(hookFilesOf('{"hooks": {"modules": []}}').inlineIsMod).toBe(false)
    expect(hookFilesOf('{"hooks": {"hooks": {}}}').inlineIsMod).toBe(false)
  })

  test('hookFilesOf: a manifest with no hooks field checks only the default file', () => {
    expect(hookFilesOf('{"name": "x"}')).toEqual({ paths: ['hooks/hooks.json'], inlineIsMod: false, rejected: [], problem: undefined })
  })

  test('hookFilesOf: an unreadable manifest checks only the default file, and a manifest that is not JSON names the problem', () => {
    expect(hookFilesOf(undefined)).toEqual({ paths: ['hooks/hooks.json'], inlineIsMod: false, rejected: [], problem: undefined })
    const broken = hookFilesOf('{ not json')
    expect(broken.paths).toEqual(['hooks/hooks.json'])
    expect(broken.problem).toMatch(/^not JSON/)
  })

  test('hookFilesOf: a declared path that is absolute (POSIX, Windows drive or backslash-rooted) or contains .. is never read, and is returned in rejected', () => {
    expect(hookFilesOf('{"hooks": ["../escape.json", "/cache/escape.json", "C:\\\\plugins\\\\escape.json", "\\\\\\\\server\\\\share\\\\escape.json", "./hooks/ok.json"]}')).toEqual({
      paths: ['hooks/hooks.json', 'hooks/ok.json'],
      inlineIsMod: false,
      rejected: ['../escape.json', '/cache/escape.json', 'C:\\plugins\\escape.json', '\\\\server\\share\\escape.json'],
      problem: undefined,
    })
  })

  test('appliesHere: a user entry everywhere, a project or local one only in or under its folder', () => {
    const [user, local, elsewhere] = parseInstalled(JSON.stringify([PLUGINS[0], PLUGINS[4], PLUGINS[5]])).entries
    expect(isWithin('/work/app/sub', '/work/app')).toBe(true)
    expect(isWithin('/work/application', '/work/app')).toBe(false)
    expect(appliesHere(user!, ROOT)).toBe(true)
    expect(appliesHere(local!, ROOT)).toBe(true)
    expect(appliesHere(local!, '/work')).toBe(false)
    expect(appliesHere(elsewhere!, ROOT)).toBe(false)
  })

  test('appliesHere per scope: user, managed, synced and session entries everywhere; project and local only under their folder', () => {
    const { entries } = parseInstalled(JSON.stringify(SCOPED))
    const here = (root: string) => Object.fromEntries(entries.map((entry) => [entry.scope, appliesHere(entry, root)]))
    expect(here(ROOT)).toEqual({ user: true, project: true, local: true, managed: true, session: true, synced: true })
    expect(here('/elsewhere')).toEqual({ user: true, project: false, local: false, managed: true, session: true, synced: true })
  })

  test('sectionsOf: one Enabled section with every enabled row in orderRows order, then one section per marketplace with only its disabled rows; an id with no @ goes to its own group', () => {
    const at = (name: string, marketplace: string, enabled: boolean, isMod: boolean) => toRow({ ...entry(name, enabled), id: `${name}@${marketplace}` }, isMod)
    const rows = [
      at('p1', 'dead', false, false),
      at('p2', 'beta', true, false),
      at('p3', 'alpha', true, false),
      at('m1', 'zulu', true, true),
      at('m2', 'zulu', false, true),
      at('p4', 'zulu', true, false),
      toRow({ ...entry('bare', false), id: 'bare' }, false),
      at('m3', 'alpha', false, true),
    ]
    const sections = sectionsOf(rows)
    expect(toRow({ ...entry('bare', false), id: 'bare' }, false).marketplace).toBe(NO_MARKETPLACE)
    expect(sections.map((s) => s.key)).toEqual([ENABLED_KEY, NO_MARKETPLACE, 'alpha', 'dead', 'zulu'])
    // The count comes first in every label, so a cut label keeps it.
    expect(sections.map((s) => s.label)).toEqual(['4 enabled', '1 off · (no marketplace)', '1 off · alpha', '1 off · dead', '1 off · zulu'])
    // Enabled: the enabled mod first, then the enabled plugins by name, from three different marketplaces.
    expect(sections[0]!.rows.map((r) => r.name)).toEqual(['m1', 'p2', 'p3', 'p4'])
    expect(sections.slice(1).map((s) => s.rows.map((r) => r.name))).toEqual([['bare'], ['m3'], ['p1'], ['m2']])
    // No row is shown twice.
    expect(sections.flatMap((s) => s.rows)).toHaveLength(rows.length)
  })

  test('filterRows: every whitespace-separated term must match the name, id or marketplace (any case), "mod" selects mods only, an empty or spaces-only query keeps all', () => {
    const at = (name: string, marketplace: string, isMod: boolean) => toRow({ ...entry(name, true), id: `${name}@${marketplace}` }, isMod)
    const rows = [at('Alpha-tool', 'north', false), at('beta', 'north', true), at('gamma', 'south', false), at('model-tools', 'south', false)]
    const names = (query: string) => filterRows(rows, query).map((row) => row.name)
    expect(names('gam')).toEqual(['gamma'])
    expect(names('ALPHA')).toEqual(['Alpha-tool'])
    expect(names('north')).toEqual(['Alpha-tool', 'beta'])
    expect(names('beta@north')).toEqual(['beta'])
    expect(names('north beta')).toEqual(['beta'])
    expect(names('north south')).toEqual([])
    // "mod" as a whole term keeps the mods ONLY (not model-tools, whose name contains it); "mo" and "model" are plain text.
    expect(names('mod')).toEqual(['beta'])
    expect(names('mod north')).toEqual(['beta'])
expect(names('mo')).toEqual(['model-tools'])
    expect(names('model')).toEqual(['model-tools'])
    expect(names('')).toEqual(rows.map((row) => row.name))
    expect(names('   ')).toEqual(rows.map((row) => row.name))
    expect(filterRows(rows, '  ')).toEqual(rows)
  })
  test('orderRows: enabled mods, disabled mods, enabled plugins, disabled plugins; each group by name', () => {
    const rows = [
      toRow(entry('zzz', true), false),
      toRow(entry('aaa', false), true),
      toRow(entry('bbb', true), true),
      toRow(entry('mmm', false), false),
      toRow(entry('ccc', true), false),
    ]
    expect(orderRows(rows).map((row) => row.id)).toEqual(['bbb@m', 'aaa@m', 'ccc@m', 'zzz@m', 'mmm@m'])
  })

  test('actionArgv per scope and action: user, project and local name their scope; synced and session ids go alone, with no --scope', () => {
    for (const scope of ['user', 'project', 'local'] as const) {
      for (const action of ['enable', 'disable', 'uninstall'] as const) {
        expect(actionArgv(CLAUDE, action, { id: 'zzz@m', scope })).toEqual([CLAUDE, 'plugin', action, 'zzz@m', '--scope', scope])
      }
    }
    // A skills-folder plugin reports user or project scope and is named by its id alone, in the form the docs give
    // (plugins-creation chapter, line 262: `claude plugin disable <name>@skills-dir`, with no --scope).
    for (const scope of ['user', 'project'] as const) {
      for (const action of ['enable', 'disable'] as const) {
        expect(actionArgv(CLAUDE, action, { id: 'kkk-skill@skills-dir', scope })).toEqual([CLAUDE, 'plugin', action, 'kkk-skill@skills-dir'])
      }
    }
    // Chapter lines 202, 238 and 894: a synced or session plugin is named `<name>@synced` or `<name>@inline`, and --scope takes neither.
    expect(actionArgv(CLAUDE, 'enable', { id: 'engineering@synced', scope: 'synced' })).toEqual([CLAUDE, 'plugin', 'enable', 'engineering@synced'])
    expect(actionArgv(CLAUDE, 'disable', { id: 'engineering@synced', scope: 'synced' })).toEqual([CLAUDE, 'plugin', 'disable', 'engineering@synced'])
    expect(actionArgv(CLAUDE, 'disable', { id: 'sss-session@inline', scope: 'session' })).toEqual([CLAUDE, 'plugin', 'disable', 'sss-session@inline'])
  })

  test('actionArgv refuses an action a scope does not offer, an id not in its scope\'s documented form, and an id that could be read as a flag or a path', () => {
    const refused: Array<[Action, Scope, string]> = [
      ['uninstall', 'synced', 'engineering@synced'],
      ['enable', 'session', 'sss-session@inline'],
      ['uninstall', 'session', 'sss-session@inline'],
      ['enable', 'managed', 'ggg-managed@market-org'],
      ['disable', 'managed', 'ggg-managed@market-org'],
      ['uninstall', 'managed', 'ggg-managed@market-org'],
    ]
    for (const [action, scope, id] of refused) {
      expect(() => actionArgv(CLAUDE, action, { id, scope })).toThrow(`refused: ${action} is not offered for a ${scope} plugin`)
    }
    expect(() => actionArgv(CLAUDE, 'disable', { id: 'engineering@market-a', scope: 'synced' })).toThrow('is not the documented id of a synced plugin')
    expect(() => actionArgv(CLAUDE, 'disable', { id: 'sss-session@synced', scope: 'session' })).toThrow('is not the documented id of a session plugin')
    // A skills-folder plugin cannot be uninstalled: Claude Code 2.1.316 refuses it ("Delete the directory to remove it").
    for (const scope of ['user', 'project'] as const) {
      expect(() => actionArgv(CLAUDE, 'uninstall', { id: 'kkk-skill@skills-dir', scope })).toThrow('refused: uninstall is not offered for a skills-directory plugin')
    }
    for (const id of ['--all', '../x@m', 'x@m; rm', 'x', 'X@m', 'a@b c']) {
      expect(() => actionArgv(CLAUDE, 'enable', { id, scope: 'user' })).toThrow('is not a plugin id')
    }
  })

  test('actionCwd: a project or local row runs in its own folder; a row of any other scope runs in none, even when it carries a projectPath', () => {
    expect(actionCwd({ scope: 'project', projectPath: '/work/app' })).toBe('/work/app')
    expect(actionCwd({ scope: 'local', projectPath: '/work/app' })).toBe('/work/app')
    for (const scope of ['user', 'managed', 'session', 'synced'] as const) {
      expect(actionCwd({ scope, projectPath: '/work/app' })).toBeUndefined()
    }
  })

  test('actionsFor: the buttons of a row of each scope, on and off', () => {
    const offered = (id: string, scope: Scope) => [actionsFor({ id, scope, enabled: true }), actionsFor({ id, scope, enabled: false })]
    for (const scope of ['user', 'project', 'local'] as const) {
      expect(offered('zzz@m', scope)).toEqual([['disable', 'uninstall'], ['enable', 'uninstall']])
    }
    expect(offered('engineering@synced', 'synced')).toEqual([['disable'], ['enable']])
    expect(offered('sss-session@inline', 'session')).toEqual([['disable'], []])
    expect(offered('ggg-managed@market-org', 'managed')).toEqual([[], []])
  })

  test('actionsFor: a skills-folder row turns on or off but has no Uninstall, and a row whose id is refused has no action at all', () => {
    for (const scope of ['user', 'project'] as const) {
      expect(actionsFor({ id: 'kkk-skill@skills-dir', scope, enabled: true })).toEqual(['disable'])
      expect(actionsFor({ id: 'kkk-skill@skills-dir', scope, enabled: false })).toEqual(['enable'])
    }
    for (const id of ['Upper-Case@market-a', 'no-marketplace', '--all']) {
      expect(actionsFor({ id, scope: 'user', enabled: true })).toEqual([])
      expect(actionsFor({ id, scope: 'user', enabled: false })).toEqual([])
    }
  })

  test('lockedNote names why a row has no button, and is undefined for a row that has one', () => {
    expect(lockedNote({ id: 'ggg-managed@market-org', scope: 'managed', enabled: true })).toBe(MANAGED_NOTE)
    expect(lockedNote({ id: 'ggg-managed@market-org', scope: 'managed', enabled: false })).toBe(MANAGED_NOTE)
    expect(lockedNote({ id: 'sss-session@inline', scope: 'session', enabled: false })).toBe('Loaded for this session only: turning it on is not offered here.')
    expect(lockedNote({ id: 'sss-session@inline', scope: 'session', enabled: true })).toBeUndefined()
    expect(lockedNote({ id: 'engineering@synced', scope: 'synced', enabled: false })).toBeUndefined()
    expect(lockedNote({ id: 'zzz@m', scope: 'user', enabled: true })).toBeUndefined()
  })

  test('lockedNote: a skills-folder row says to delete its folder, and a row whose id is refused says why it offers nothing', () => {
    for (const enabled of [true, false]) {
      expect(lockedNote({ id: 'kkk-skill@skills-dir', scope: 'user', enabled })).toBe(SKILLS_DIR_NOTE)
      expect(lockedNote({ id: 'Upper-Case@market-a', scope: 'user', enabled })).toBe(REFUSED_ID_NOTE)
    }
  })

  test('questionFor: a synced row says it is removed on claude.ai, a session row that an installed copy loads instead; other scopes add nothing', () => {
    const row = (id: string, scope: Scope) => toRow({ id, version: undefined, scope, enabled: true, installPath: '/cache/x', readFromFolder: undefined, projectPath: undefined }, false)
    expect(questionFor('disable', row('engineering@synced', 'synced'))).toBe(QUESTION_DISABLE_SYNCED)
    expect(questionFor('enable', row('engineering@synced', 'synced'))).toBe(
      'Turn it on: engineering (synced scope)? It loads in your next session. It is synced from claude.ai: to remove it, turn it off there.',
    )
    expect(questionFor('disable', row('sss-session@inline', 'session'))).toBe(QUESTION_DISABLE_SESSION)
    expect(questionFor('disable', row('zzz-tool@market-a', 'user'))).toBe(QUESTION_DISABLE_ZZZ)
  })

  test('isConfirmed lets an action run only for its own confirm label', () => {
    expect(isConfirmed('Turn it off', 'disable')).toBe(true)
    expect(isConfirmed('Turn it on', 'enable')).toBe(true)
    expect(isConfirmed('Uninstall it', 'uninstall')).toBe(true)
    expect(isConfirmed('Turn it on', 'disable')).toBe(false)
    expect(isConfirmed('turn it off', 'disable')).toBe(false)
    expect(isConfirmed(KEEP, 'disable')).toBe(false)
    expect(isConfirmed('', 'uninstall')).toBe(false)
  })

  test('fitLabel cuts a label to the room with an ellipsis, and keeps a label that fits', () => {
    expect(fitLabel('Turn off', 8)).toBe('Turn off')
    expect(fitLabel('Uninstall', 8)).toBe('Uninsta…')
    expect(fitLabel('Uninstall', 1)).toBe('')
  })
})
