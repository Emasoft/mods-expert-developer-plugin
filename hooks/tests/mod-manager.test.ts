// cspell:ignore Uninsta: the label cut at room 8 keeps its first seven letters, then an ellipsis.
// Tests of the mod-manager pane (TRDD-J4HRAQF0, increment 1): the installed plugins in order, the mod marks, the
// question a press raises, the refusal of a press while claude reads the list, the command, and the rules under
// them. Every pane test mounts the pane on surface terminal and desktop at a narrow and a wide width, with the
// same assertions. The claude CLI and the plugins' hooks files are answered by the test, because a real claude
// would change the developer's own plugins. The hooks module (index.ts) wires the pane and the session start,
// because the host refuses $.command.register from any module that does not call it. A test cannot answer the
// engine's question: its dialog is drawn by the engine, so the press's question is observed and left unanswered.
import { describe, expect, mock, test, type MockClock, type Mounted } from 'claude-code/testing'

import { KEEP, actionArgv, appliesHere, classifyHooks, confirmThenRun, fitLabel, isConfirmed, isWithin, orderRows, parseInstalled, toRow, type Installed } from '../mod-manager/logic'

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

// aaa-mod and mmm-mod are mods; zzz-tool has hooks but no modules; ccc-plain's file is malformed; ddd-local has no file.
const HOOKS: Record<string, string> = {
  '/cache/market-a/aaa-mod/1.0.0/hooks/hooks.json': '{"hooks": {}, "modules": ["./index.ts"]}',
  '/cache/market-b/mmm-mod/0.3.0/hooks/hooks.json': '{"modules": ["./index.ts"]}',
  '/cache/market-a/zzz-tool/2.0.0/hooks/hooks.json': '{"hooks": {}}',
  '/cache/market-b/ccc-plain/1.1.0/hooks/hooks.json': '{ not json',
}

// The order the pane must show: mods first (enabled, then disabled), then the other plugins (enabled, then
// disabled); each of the four groups by name.
const ORDER = [
  'mm-toggle-mmm-mod@market-b|user',
  'mm-toggle-aaa-mod@market-a|user',
  'mm-toggle-ddd-local@market-a|local',
  'mm-toggle-zzz-tool@market-a|user',
  'mm-toggle-ccc-plain@market-b|user',
]

const QUESTION_DISABLE_ZZZ = 'Turn it off: zzz-tool (user scope)? It stops loading in your next session.'
const REFUSED_WHILE_READING = 'Wait: reading the installed plugins… is still running. Nothing was changed.'

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
}

function world(on: any): World {
  const w: World = { clock: mock.clock(on, { now: 1_000 }), session: 'sess-1', root: ROOT, claudeFound: true, calls: [], hold: undefined, asked: [], commands: [], tools: [], opened: [], toasts: [] }
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
    if (e.argv[2] === 'list') return { value: { exitCode: 0, stdout: JSON.stringify(PLUGINS), stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
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
  on('ui.log', () => ({ value: undefined }))
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

describe('the installed plugins pane', () => {
  test('lists mods first (enabled, then disabled), then the other plugins, each group by name, and marks each mod', async ($, on) => {
    const w = world(on)
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `order-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ type: 'Text', text: '5 installed · 3 active · 2 mods' })).toBeDefined()
      expect(await toggleKeys(ui)).toEqual(ORDER)
      expect(await ui.findAll({ type: 'Text', text: /^mod$/ })).toHaveLength(2)
      await ui.unmount()
    }
  })

  test('an enabled mod is above a disabled mod, a mod is above every plugin, and a plugin is never above a mod', async ($, on) => {
    const w = world(on)
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `above-${surface}-${columns}`, surface, columns)
      const keys = await toggleKeys(ui)
      const at = (row: string) => keys.indexOf(`mm-toggle-${row}`)
      // mmm-mod is an enabled mod, aaa-mod a disabled mod, ddd-local an enabled plugin. Alphabetical order alone
      // would put aaa-mod first and ddd-local above mmm-mod, so both assertions below fail under that order.
      expect(at('mmm-mod@market-b|user')).toBeLessThan(at('aaa-mod@market-a|user'))
      expect(at('aaa-mod@market-a|user')).toBeLessThan(at('ddd-local@market-a|local'))
      expect(at('mmm-mod@market-b|user')).toBeLessThan(at('ddd-local@market-a|local'))
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

  test('the row buttons fit the pane: a label too long for the room is cut with an ellipsis', async ($, on) => {
    const w = world(on)
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `labels-${surface}-${columns}`, surface, columns)
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
    projectPath: undefined,
  })

  test('parseInstalled reads the list and refuses a shape it does not know', () => {
    expect(parseInstalled(JSON.stringify([PLUGINS[0]]))).toEqual([
      { id: 'aaa-mod@market-a', version: '1.0.0', scope: 'user', enabled: false, installPath: '/cache/market-a/aaa-mod/1.0.0', projectPath: undefined },
    ])
    expect(() => parseInstalled('{"installed": []}')).toThrow('did not answer a list')
    expect(() => parseInstalled(JSON.stringify([{ ...PLUGINS[0], scope: 'team' }]))).toThrow('unexpected shape')
    expect(() => parseInstalled(JSON.stringify([{ ...PLUGINS[0], enabled: 'yes' }]))).toThrow('unexpected shape')
  })

  test('classifyHooks: a non-empty modules list makes a mod; an empty, absent or malformed one does not', () => {
    expect(classifyHooks('{"modules": ["./index.ts"]}')).toEqual({ isMod: true, problem: undefined })
    expect(classifyHooks('{"modules": []}')).toEqual({ isMod: false, problem: undefined })
    expect(classifyHooks('{"hooks": {}}')).toEqual({ isMod: false, problem: undefined })
    expect(classifyHooks('{ not json').isMod).toBe(false)
    expect(classifyHooks('{ not json').problem).toMatch(/^not JSON/)
  })

  test('appliesHere: a user entry everywhere, a project or local one only in or under its folder', () => {
    const [user, local, elsewhere] = parseInstalled(JSON.stringify([PLUGINS[0], PLUGINS[4], PLUGINS[5]]))
    expect(isWithin('/work/app/sub', '/work/app')).toBe(true)
    expect(isWithin('/work/application', '/work/app')).toBe(false)
    expect(appliesHere(user!, ROOT)).toBe(true)
    expect(appliesHere(local!, ROOT)).toBe(true)
    expect(appliesHere(local!, '/work')).toBe(false)
    expect(appliesHere(elsewhere!, ROOT)).toBe(false)
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

  test('actionArgv names the scope for each action, and refuses an id that could be read as a flag or a path', () => {
    expect(actionArgv(CLAUDE, 'disable', { id: 'zzz@m', scope: 'local' })).toEqual([CLAUDE, 'plugin', 'disable', 'zzz@m', '--scope', 'local'])
    expect(actionArgv(CLAUDE, 'enable', { id: 'zzz@m', scope: 'user' })).toEqual([CLAUDE, 'plugin', 'enable', 'zzz@m', '--scope', 'user'])
    expect(actionArgv(CLAUDE, 'uninstall', { id: 'zzz@m', scope: 'user' })).toEqual([CLAUDE, 'plugin', 'uninstall', 'zzz@m', '--scope', 'user'])
    for (const id of ['--all', '../x@m', 'x@m; rm', 'x', 'X@m', 'a@b c']) {
      expect(() => actionArgv(CLAUDE, 'enable', { id, scope: 'user' })).toThrow('is not a plugin id')
    }
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
