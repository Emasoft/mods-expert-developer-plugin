// Tests of the dev tools run and list_commands, the /self-command pane, their switches and /mods-dev-tools, and
// the resolve-bin helper. Every wiring test starts the session on both surfaces, and every pane test
// mounts the pane on surface terminal and desktop at a narrow and a wide width, with the same assertions.
import type { CommandInfo } from 'claude-code'
import { describe, expect, mock, test, type MockClock, type Mounted } from 'claude-code/testing'

import { DEV_FUNCTIONS, DEV_TOOLS_OFF, PANE as PANE_SWITCH, RUN as RUN_SWITCH, parseDevToolsSwitch } from '../dev-tools'
import { candidatesFor, firstFile, newestVersion } from '../resolve-bin'
import {
  HISTORY_KEY,
  MAX_ENTRIES,
  MAX_SESSIONS,
  OUTPUT_PREVIEW,
  type HistoryEntry,
  draftTarget,
  listFailure,
  listText,
  recordRun,
  requestOf,
} from '../self-command/logic'
import { REVIEW_TOAST } from '../switches/logic'
import { keyFor, signed, signedOn } from './switch-world'
import { seedMasters } from './masters'

const PLUGIN = 'mods-expert-developer-plugin'
const RUN = `mcp__${PLUGIN}__run`
const LIST = `mcp__${PLUGIN}__list_commands`
const SEND = `${PLUGIN}:send`
const SURFACES = ['terminal', 'desktop'] as const
// Absolute, because $.fs resolves a relative path against the working folder, yet no machine's path:
// /work is the session cwd of these tests and <user> is a placeholder segment, which
// tests/test_no_absolute_paths.py does not count.
const ROOT = '/work'
const HOME = '/home/<user>'

const COMMANDS = [
  { name: 'reload-plugins', description: 'Reload every plugin', source: 'builtin' as const },
  { name: 'clear', description: 'Empty the conversation', source: 'builtin' as const },
  { name: 'compact', description: 'Summarize the conversation', source: 'builtin' as const },
  { name: 'ship', description: 'Run the tests, then push', source: 'user' as const },
  { name: 'lint', description: 'Lint the tree', source: 'plugin' as const, plugin: 'other-tools' },
  { name: SEND, description: 'Hands the model an outcome', source: 'plugin' as const, plugin: PLUGIN },
  { name: 'mods-dev-tools', description: 'Turn the dev tools on or off', source: 'plugin' as const, plugin: PLUGIN },
]

/** One command as $.command.list gives it. */
const cmd = (name: string, source: CommandInfo['source'] = 'builtin', plugin?: string): CommandInfo =>
  plugin === undefined ? { name, description: name, source } : { name, description: name, source, plugin }

type World = {
  clock: MockClock
  store: Map<string, unknown>
  /** Every command the engine ran, as `name args`. */
  ran: string[]
  /** Every command name the engine was asked to run, a failing one included. */
  attempted: string[]
  registered: Array<{ name: string; isDeferred: unknown }>
  commands: string[]
  logs: string[]
  toasts: string[]
  session: string
  /** A command name whose run the engine refuses. */
  failing: string | undefined
  /** What /reload-plugins answers. */
  output: string
  /** When true, $.command.list rejects. */
  listFails: boolean
  /** The text of every $.prompt.fill. */
  fills: string[]
  /** When set, the prompt box refuses a fill with this cause. */
  fillRefusal: 'no_composer' | 'dialog' | undefined
  /** The args of every $.ui.open. */
  opened: unknown[]
  writes: Array<{ path: string; text: string }>
  /** The paths $.fs.exists answers true for; every write adds its path. */
  files: Set<string>
  /** What $.fs.stat answers per path; a path not listed is a file. */
  kinds: Map<string, 'file' | 'dir'>
  /** What $.fs.list answers per folder, and every folder it was asked for. */
  dirs: Map<string, Array<{ name: string; kind: 'file' | 'dir' }>>
  listed: string[]
  /** Every path $.fs.exists was asked about. */
  existsAsked: string[]
  /** Every process the engine was asked to run, as its argument vector. */
  argv: string[][]
  /** How many times $.command.list was read, and what it answers. */
  listCalls: number
  list: readonly CommandInfo[]
  /** What session.root and HOME answer. */
  root: string
  home: string | undefined
}

function world(on: any, store: Record<string, unknown> = {}): World {
  const w: World = { clock: mock.clock(on, { now: 1_000 }), store: new Map(Object.entries(store)), ran: [], attempted: [], registered: [], commands: [], logs: [], toasts: [], session: 'sess-1', failing: undefined, output: 'Reloaded 12 plugins', listFails: false, fills: [], fillRefusal: undefined, opened: [], writes: [], files: new Set(), kinds: new Map(), dirs: new Map(), listed: [], existsAsked: [], argv: [], listCalls: 0, list: COMMANDS, root: ROOT, home: HOME }
  on('session.start', ($: any, e: any) => ({ cwd: e.cwd }))
  on('session.id', () => ({ value: w.session }))
  seedMasters(on, { read: (key) => (w.store.has(key) ? { value: w.store.get(key) } : undefined) })
  on('store.get', ($: any, e: any) => ({ value: w.store.get(e.key) }))
  on('store.set', ($: any, e: any) => {
    w.store.set(e.key, e.value)
    return { value: undefined }
  })
  on('store.delete', ($: any, e: any) => {
    w.store.delete(e.key)
    return { value: undefined }
  })
  on('tool.register', ($: any, e: any) => {
    w.registered.push({ name: e.name, isDeferred: e.isDeferred })
    return { value: { tool: `mcp__${PLUGIN}__${e.name}` } }
  })
  on('command.register', ($: any, e: any) => {
    w.commands.push(e.name)
    return { value: { command: e.name } }
  })
  // A throw makes $.command.list reject, as an engine failure would.
  on('command.list', () => {
    if (w.listFails) throw new Error('the command list is unavailable')
    w.listCalls += 1
    return { value: w.list }
  })
  // Only the commands a plugin runs reach here; /mods-dev-tools is answered by the mod's own hook.
  // A throw, not { deny }: the kit skips a test hook that throws, so $.command.run rejects as the
  // engine's refusal would (no implementation for command.run).
  on('command.run', ($: any, e: any) => {
    w.attempted.push(e.command)
    if (e.command === w.failing) throw new Error(`${e.command} failed`)
    w.ran.push(`${e.command} ${e.args}`.trim())
    if (e.command === 'lint') return { text: 'x'.repeat(OUTPUT_PREVIEW * 2) }
    return e.command === 'reload-plugins' ? { text: w.output } : {}
  })
  on('ui.log', ($: any, e: any) => {
    w.logs.push(e.text)
    return { value: undefined }
  })
  on('ui.toast', ($: any, e: any) => {
    w.toasts.push(e.text)
    return { value: undefined }
  })
  on('prompt.fill', ($: any, e: any) => {
    w.fills.push(e.text)
    return w.fillRefusal === undefined ? { isFilled: true } : { isFilled: false, refusal: w.fillRefusal }
  })
  on('ui.open', ($: any, e: any) => {
    w.opened.push(e)
    return { value: { isPlaced: true } }
  })
  on('session.root', () => ({ value: w.root }))
  on('session.cwd', () => ({ value: w.root }))
  on('process.run', ($: any, e: any) => {
    w.argv.push([...e.argv])
    return { value: { exitCode: 0, stdout: '# probe report', stderr: '' } }
  })
  on('env.get', ($: any, e: any) => ({ value: e.name === 'HOME' ? w.home : undefined }))
  on('fs.exists', ($: any, e: any) => {
    w.existsAsked.push(e.path)
    return { value: w.files.has(e.path) }
  })
  on('fs.stat', ($: any, e: any) => ({ value: { kind: w.kinds.get(e.path) ?? 'file' } }))
  on('fs.list', ($: any, e: any) => {
    w.listed.push(e.path)
    return { value: (w.dirs.get(e.path) ?? []).map((entry) => ({ ...entry, size: 1, mtimeMs: 1, isLink: false })) }
  })
  // What a file holds is its last write: the debug log reads its file before it adds a line.
  on('fs.read', ($: any, e: any) => ({ value: w.writes.filter((x) => x.path === e.path).at(-1)?.text }))
  on('fs.write', ($: any, e: any) => {
    w.writes.push({ path: e.path, text: e.text })
    w.files.add(e.path)
    return { value: undefined }
  })
  return w
}

function start($: any, surface: (typeof SURFACES)[number]) {
  return $.session.start({ surface, isInteractive: true, cwd: '/work' })
}

function devTools($: any, args = '') {
  return $.command.run({ command: 'mods-dev-tools', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } })
}

const entry = (at: number, command = 'compact'): HistoryEntry => ({ at, command, args: '', ok: true, output: '' })

describe('requestOf', () => {
  test('drops a leading slash and splits a name written with its arguments', () => {
    expect(requestOf({ command: '/reload-plugins' }, COMMANDS)).toEqual({ command: 'reload-plugins', args: '' })
    expect(requestOf({ command: 'compact keep the API notes' }, COMMANDS)).toEqual({ command: 'compact', args: 'keep the API notes' })
    expect(requestOf({ command: 'compact', args: '  keep it ' }, COMMANDS)).toEqual({ command: 'compact', args: 'keep it' })
  })

  test('compares one normalized name, and runs the command as the list spells it', () => {
    expect(requestOf({ command: '//Reload-Plugins' }, COMMANDS)).toEqual({ command: 'reload-plugins', args: '' })
    expect(requestOf({ command: 'CLEAR' }, COMMANDS)).toBe('/clear clears, ends or swaps the session, so the run tool refuses it')
    expect(requestOf({ command: 'Ship it now' }, [cmd('Ship', 'user')])).toEqual({ command: 'Ship', args: 'it now' })
  })

  test('refuses every blocked command, an unknown name and a missing one', () => {
    for (const name of ['clear', 'exit', 'quit', 'logout', 'login', 'resume', 'rewind']) {
      expect(requestOf({ command: name }, [...COMMANDS, cmd(name)])).toBe(`/${name} clears, ends or swaps the session, so the run tool refuses it`)
    }
    expect(requestOf({ command: 'deploy' }, COMMANDS)).toBe('/deploy is not a command of this session (list_commands names them)')
    expect(requestOf({}, COMMANDS)).toBe('command is required: the command name without its slash')
    expect(requestOf({ command: '  /  ' }, COMMANDS)).toBe('command is required: the command name without its slash')
  })

  test('refuses this plugin\'s own send and mods-dev-tools in every shape the list can give', () => {
    for (const base of ['send', 'mods-dev-tools']) {
      const own = [
        cmd(base, 'plugin', PLUGIN),
        cmd(`${PLUGIN}:${base}`, 'plugin', PLUGIN),
        cmd(base, 'plugin', `${PLUGIN}@some-marketplace`),
        cmd(base, 'plugin', undefined),
        cmd(`${PLUGIN.toUpperCase()}:${base.toUpperCase()}`, 'plugin', PLUGIN),
      ]
      for (const c of own) {
        for (const written of [c.name, `/${c.name} some text`, c.name.toLowerCase()]) {
          expect(requestOf({ command: written }, [c])).toBe(`/${c.name.toLowerCase()} is this plugin's own report or switch command, so the run tool refuses it`)
        }
      }
      // A user's own command of the same name next to this plugin's: which one runs is the engine's
      // choice, so the name is refused.
      expect(requestOf({ command: base }, [cmd(base, 'user'), cmd(base, 'plugin', PLUGIN)])).toBe(`/${base} is this plugin's own report or switch command, so the run tool refuses it`)
    }
  })

  test('another plugin\'s or the user\'s own send stays runnable', () => {
    for (const c of [cmd('send', 'user'), cmd('send', 'plugin', 'other-tools'), cmd('other-tools:send', 'plugin', 'other-tools'), cmd('send', 'mcp'), cmd('mods-dev-tools', 'user')]) {
      expect(requestOf({ command: c.name }, [c])).toEqual({ command: c.name, args: '' })
    }
    expect(requestOf({ command: 'sender' }, [cmd('sender', 'plugin', PLUGIN)])).toEqual({ command: 'sender', args: '' })
  })
})

describe('listText', () => {
  test('without a query: names only, grouped by source in list order, blocked ones marked', () => {
    expect(listText(COMMANDS)).toBe([
      '7 commands. Pass query for descriptions; (blocked) means the run tool refuses it.',
      'built-in: reload-plugins, clear (blocked), compact',
      'user or project: ship',
      'plugin other-tools: lint',
      `plugin ${PLUGIN}: ${SEND} (blocked), mods-dev-tools (blocked)`,
    ].join('\n'))
  })

  test('a query matches name or description in any case, with details and a built-in\'s use line', () => {
    expect(listText(COMMANDS, 'CONVERSATION')).toBe([
      '2 of 7 commands match "CONVERSATION".',
      'built-in:',
      '- /clear (blocked): Empty the conversation',
      '  use it when starting unrelated work; it empties the conversation (blocked for the run tool)',
      '- /compact: Summarize the conversation',
      '  use it when the context is filling up; text after the name says what the summary must keep',
    ].join('\n'))
    expect(listText(COMMANDS, 'push')).toBe(['1 of 7 commands match "push".', 'user or project:', '- /ship: Run the tests, then push'].join('\n'))
    expect(listText(COMMANDS, 'nothing-like-it')).toBe('No command matches "nothing-like-it".')
  })
})

describe('recordRun', () => {
  test(`keeps the last ${MAX_ENTRIES} runs of a session, oldest dropped`, () => {
    let history: unknown
    for (let at = 1; at <= MAX_ENTRIES + 1; at += 1) history = recordRun(history, 's', entry(at))
    const kept = (history as any).s.entries as HistoryEntry[]
    expect(kept.length).toBe(MAX_ENTRIES)
    expect(kept[0]!.at).toBe(2)
    expect(kept[kept.length - 1]!.at).toBe(MAX_ENTRIES + 1)
  })

  test(`keeps the ${MAX_SESSIONS} sessions with the latest run, whatever their key order`, () => {
    let history: unknown
    for (let i = 1; i <= MAX_SESSIONS; i += 1) history = recordRun(history, `s${i}`, entry(i * 10))
    // s1 is the oldest key; a new run makes it the newest session, so s2 is the one dropped.
    history = recordRun(history, 's1', entry(1_000))
    history = recordRun(history, 'new', entry(2_000))
    const keys = Object.keys(history as object)
    expect(keys.length).toBe(MAX_SESSIONS)
    expect(keys).toContain('s1')
    expect(keys).toContain('new')
    expect(keys).not.toContain('s2')
  })

  test('a stored value of another shape is reported, never reset', () => {
    expect(() => recordRun([], 's', entry(1))).toThrow(`${HISTORY_KEY} in the store is not an object`)
    expect(() => recordRun('x', 's', entry(1))).toThrow(`${HISTORY_KEY} in the store is not an object`)
  })
})

describe('parseDevToolsSwitch', () => {
  test('toggles with no argument, sets with on and off, answers usage otherwise', () => {
    expect(parseDevToolsSwitch('', false)).toMatchObject({ on: true })
    expect(parseDevToolsSwitch(' ', true)).toMatchObject({ on: false })
    expect(parseDevToolsSwitch('ON', false)).toMatchObject({ on: true })
    expect(parseDevToolsSwitch('off', true)).toMatchObject({ on: false })
    expect(parseDevToolsSwitch('later', true)).toEqual({ usage: 'Usage: /mods-dev-tools [on|off]' })
  })
})

describe('the dev-tools switches', () => {
  test('off by default: no dev tool or pane command registers and every one refuses, on both surfaces', async ($, on) => {
    const w = world(on)
    for (const surface of SURFACES) {
      await start($, surface)
      // The switches tool registers at every start (TRDD-5IK59SQ2); no dev tool does while its switch is off.
      expect(w.registered.filter((t) => t.name !== 'switches')).toEqual([])
      expect(w.commands).toContain('mods-dev-tools')
      expect(w.commands).not.toContain('self-command')
      expect(w.commands).not.toContain('probe-runner')
      const run = await $.tool.call({ tool: RUN, command: 'reload-plugins' } as any)
      expect(run.deny).toBe(DEV_TOOLS_OFF)
      const list = await $.tool.call({ tool: LIST } as any)
      expect(list.deny).toBe(DEV_TOOLS_OFF)
      await w.clock.settle()
      expect(w.ran).toEqual([])
      expect(w.listCalls).toBe(0)
    }
  })

  test('the four dev tools and the two debug logs are listed off by default, each by itself', async ($, on) => {
    world(on)
    await start($, 'terminal')
    const listed = String((await $.tool.call({ tool: `mcp__${PLUGIN}__switches` } as any)).result)
    for (const id of [...DEV_FUNCTIONS, 'self-command.debug-log', 'probe-runner.debug-log']) {
      expect(listed.split('\n').some((line) => line.startsWith(`  ${id}  off  `))).toBe(true)
    }
  })

  test('/mods-dev-tools sets all four, signed; on registers them at the next start, off refuses at once', async ($, on) => {
    const w = world(on)
    for (const surface of SURFACES) {
      w.registered = []
      w.commands = []
      await start($, surface)
      expect((await devTools($, 'on')).text).toBe('The mods dev tools are on. Their tools register when the next session starts.')
      for (const id of DEV_FUNCTIONS) expect(await signedValue(w, id)).toBe(true)
      expect(w.registered).toEqual([{ name: 'switches', isDeferred: true }])
      await start($, surface)
      expect(w.registered).toEqual([{ name: 'switches', isDeferred: true }, { name: 'switches', isDeferred: true }, { name: 'run', isDeferred: false }, { name: 'list_commands', isDeferred: false }, { name: 'probe', isDeferred: false }])
      expect(w.commands).toContain('self-command')
      expect(w.commands).toContain('probe-runner')
      expect((await $.tool.call({ tool: RUN, command: 'compact' } as any)).result).toBeDefined()
      expect((await devTools($)).text).toMatch(/^The mods dev tools are off\. Every call to them is refused from now on/)
      for (const id of DEV_FUNCTIONS) expect(await signedValue(w, id)).toBe(false)
      expect((await $.tool.call({ tool: RUN, command: 'compact' } as any)).deny).toBe(DEV_TOOLS_OFF)
      expect((await devTools($, 'maybe')).text).toBe('Usage: /mods-dev-tools [on|off]')
    }
  })

  test('each function has its own switch: run turned off refuses only run, and leaves the tool list next start', async ($, on) => {
    const w = world(on)
    for (const surface of SURFACES) {
      for (const [key, value] of Object.entries(await signedOn(DEV_FUNCTIONS))) w.store.set(key, value)
      await start($, surface)
      w.store.set(keyFor('self-command.run'), await signed('self-command.run', false, 6_000))
      expect((await $.tool.call({ tool: RUN, command: 'compact' } as any)).deny).toBe(DEV_TOOLS_OFF)
      expect((await $.tool.call({ tool: LIST } as any)).result).toBeDefined()
      const opened = w.opened.length
      expect(await selfCommand($)).toEqual({})
      expect(w.opened.length).toBe(opened + 1)
      w.registered = []
      await start($, surface)
      expect(w.registered.map((t) => t.name)).toEqual(['switches', 'list_commands', 'probe'])
      await w.clock.settle()
      expect(w.ran).toEqual([])
    }
  })

  test('an older release kept the tools on: they stay off until the person keeps it in /mods-switches', async ($, on) => {
    const w = world(on)
    for (const surface of SURFACES) {
      w.store.clear()
      w.store.set('dev-tools', true)
      w.registered = []
      w.toasts = []
      await start($, surface)
      expect(w.registered.filter((t) => t.name !== 'switches')).toEqual([])
      expect(w.toasts).toContain(REVIEW_TOAST)
      expect((await $.tool.call({ tool: RUN, command: 'compact' } as any)).deny).toBe(DEV_TOOLS_OFF)
      // The older key stays until the person decides: nothing signed it on.
      expect(w.store.get('dev-tools')).toBe(true)
      for (const id of DEV_FUNCTIONS) expect(w.store.has(keyFor(id))).toBe(false)
    }
  })

  test('an older release kept the tools off: off is signed for each, and the older key is dropped', async ($, on) => {
    const w = world(on)
    for (const surface of SURFACES) {
      w.store.clear()
      w.store.set('dev-tools', false)
      w.toasts = []
      await start($, surface)
      for (const id of DEV_FUNCTIONS) expect(await signedValue(w, id)).toBe(false)
      expect(w.store.has('dev-tools')).toBe(false)
      expect(w.toasts).not.toContain(REVIEW_TOAST)
    }
  })
})

/** The value stored for a switch, after checking it carries this plugin's signature; undefined when none is stored. */
async function signedValue(w: World, id: string): Promise<boolean | undefined> {
  const stored = w.store.get(keyFor(id)) as { v: boolean; at: number } | undefined
  if (stored === undefined) return undefined
  expect(stored).toEqual(await signed(id, stored.v, stored.at))
  return stored.v
}

describe('the run tool', () => {
  test('queues the command, runs it after the turn, reports through the send command, logs and records it', async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    for (const surface of SURFACES) {
      w.ran = []
      w.session = `sess-${surface}`
      await start($, surface)
      const r = await $.tool.call({ tool: RUN, command: '/reload-plugins' } as any)
      expect(r.result).toBe('queued: /reload-plugins runs after this turn ends and its output reaches you as the next prompt. It has not run yet, so do not report an outcome before that prompt arrives.')
      expect(w.ran).toEqual([])
      await w.clock.settle()
      expect(w.ran).toEqual(['reload-plugins', `${SEND} Your run tool call for /reload-plugins ran it. Its output:\nReloaded 12 plugins`])
      expect(w.logs).toContain('self-command: /reload-plugins ran: Reloaded 12 plugins')
      const history = w.store.get(HISTORY_KEY) as any
      expect(history[`sess-${surface}`].entries).toEqual([{ at: 1_000, command: 'reload-plugins', args: '', ok: true, output: 'Reloaded 12 plugins' }])
    }
    expect(Object.keys(w.store.get(HISTORY_KEY) as object).sort()).toEqual(['sess-desktop', 'sess-terminal'])
  })

  test('a blocked or unknown command is refused and nothing runs', async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    for (const surface of SURFACES) {
      await start($, surface)
      expect((await $.tool.call({ tool: RUN, command: 'clear' } as any)).deny).toBe('/clear clears, ends or swaps the session, so the run tool refuses it')
      expect((await $.tool.call({ tool: RUN, command: 'deploy' } as any)).deny).toBe('/deploy is not a command of this session (list_commands names them)')
      // The plugin's own report and switch commands, as the list gives them.
      for (const name of [SEND, 'mods-dev-tools']) {
        expect((await $.tool.call({ tool: RUN, command: name } as any)).deny).toBe(`/${name} is this plugin's own report or switch command, so the run tool refuses it`)
      }
      await w.clock.settle()
      expect(w.ran).toEqual([])
      expect(w.store.get(HISTORY_KEY)).toBeUndefined()
    }
  })

  test('a command that fails is reported as not run and recorded as failed', async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    w.failing = 'ship'
    await start($, 'desktop')
    await $.tool.call({ tool: RUN, command: 'ship', args: 'now' } as any)
    await w.clock.settle()
    expect(w.attempted).toEqual(['ship', SEND])
    expect(w.ran.length).toBe(1)
    expect(w.ran[0]).toMatch(new RegExp(`^${SEND} Your run tool call for /ship now did not run it: `))
    expect((w.store.get(HISTORY_KEY) as any)['sess-1'].entries[0].ok).toBe(false)
  })

  test('a send the engine refuses reaches the person as a toast and the log, with no other path', async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    w.failing = SEND
    await start($, 'terminal')
    await $.tool.call({ tool: RUN, command: 'compact' } as any)
    await w.clock.settle()
    expect(w.ran).toEqual(['compact'])
    expect(w.toasts.some((t) => t.startsWith('The outcome of /compact did not reach the model: '))).toBe(true)
    expect(w.logs.some((l) => l.startsWith('self-command: the outcome of /compact could not be sent to the model: '))).toBe(true)
    // The run is still recorded.
    expect((w.store.get(HISTORY_KEY) as any)['sess-1'].entries.length).toBe(1)
  })

  test('with its debug log on, a refused send is written to the self-command log; the line of the run, built from the command and its output, is masked in the Claude Code log and never written', async ($, on) => {
    const w = world(on, await signedOn([...DEV_FUNCTIONS, 'self-command.debug-log']))
    w.failing = SEND
    // Joined at run time, as in debug-log.test.ts, so no scanner reads a token in this file.
    const token = ['ghp', '_', 'a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8'].join('')
    w.output = `Reloaded with ${token} from /Users/alice/x`
    await start($, 'terminal')
    await $.tool.call({ tool: RUN, command: 'reload-plugins' } as any)
    const log = `${HOME}/.claude/plugins/data/${PLUGIN}-inline/debug/self-command.log`
    const written = (): string => w.writes.filter((x) => x.path === log).at(-1)?.text ?? ''
    for (let look = 0; look < 2000 && !written().includes('could not be sent'); look++) await w.clock.settle()
    expect(written()).toContain(' self-command self-command: the outcome of /reload-plugins could not be sent to the model: ')
    expect(written()).not.toContain('Reloaded with')
    expect(w.logs).toContain('self-command: /reload-plugins ran: Reloaded with [REDACTED:github-token] from /Users/<user>/x')
    expect(w.logs.join('\n')).not.toContain(token)
  })

  test('the run line is masked before it is made printable: a home folder holding a control character is still found and shown as ~ (review of d623b53)', async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    w.home = '/srv/a\u0007b'
    w.output = `Reloaded from ${w.home}/x \u001b[2K`
    await start($, 'terminal')
    await $.tool.call({ tool: RUN, command: 'reload-plugins' } as any)
    for (let look = 0; look < 2000 && !w.logs.some((line) => line.startsWith('self-command: /reload-plugins ran: ')); look++) await w.clock.settle()
    expect(w.logs).toContain('self-command: /reload-plugins ran: Reloaded from ~/x ?[2K')
  })

  test('a pane drawn before its switch went off acts on nothing: a press fills no prompt and the form saves no file', async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    const turn = async (value: boolean, at: number): Promise<void> => {
      w.store.set(keyFor(PANE_SWITCH), await signed(PANE_SWITCH, value, at))
    }
    await start($, 'terminal')
    expect(await selfCommand($)).toEqual({})
    const list = await mountPane($, 'terminal', 80)
    await turn(false, 6_000)
    await list.press({ key: 'sc-cmd-reload-plugins' })
    expect(w.fills).toEqual([])
    await list.unmount()
    await turn(true, 7_000)
    expect(await selfCommand($)).toEqual({})
    const form = await mountPane($, 'terminal', 80)
    await form.press({ key: 'sc-view-new' })
    await form.input({ key: 'sc-name', text: 'deploy-app' })
    await form.input({ key: 'sc-body', text: 'do it' })
    await turn(false, 8_000)
    await form.press({ key: 'sc-save' })
    expect(w.writes).toEqual([])
    expect(w.toasts.filter((t) => t === DEV_TOOLS_OFF).length).toBe(2)
  })

  test('Claude can turn a dev tool on through the switches tool: the person sees a toast, and the tool joins at the next start', async ($, on) => {
    const w = world(on)
    await start($, 'terminal')
    const answer = await $.tool.call({ tool: `mcp__${PLUGIN}__switches`, switch: RUN_SWITCH, on: true } as any)
    expect(String(answer.result)).toBe(`${RUN_SWITCH} is now on. Its tool joins the tool list when the next session starts.`)
    expect(w.toasts).toContain('The agent turned on self-command: run tool: Claude queues a slash command.')
    expect(w.registered.map((t) => t.name)).toEqual(['switches'])
    await start($, 'terminal')
    expect(w.registered.map((t) => t.name)).toEqual(['switches', 'switches', 'run'])
    // /mods-dev-tools run for the model, by a plugin: the change is the agent's, and toasted as such.
    await $.command.run({ command: 'mods-dev-tools', args: 'off', origin: { kind: 'plugin', name: PLUGIN }, presentation: { isFullscreen: false, columns: 80 } })
    expect(w.toasts).toContain('The agent turned off self-command: run tool: Claude queues a slash command.')
  })

  test(`a long output is kept in the history cut to ${OUTPUT_PREVIEW} characters`, async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    await start($, 'terminal')
    await $.tool.call({ tool: RUN, command: 'lint' } as any)
    await w.clock.settle()
    expect((w.store.get(HISTORY_KEY) as any)['sess-1'].entries[0].output.length).toBe(OUTPUT_PREVIEW)
  })
})

describe('a gating hook that fails', () => {
  test('refuses the call with the reason when the command list cannot be read, on both surfaces', async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    w.listFails = true
    for (const surface of SURFACES) {
      await start($, surface)
      expect((await $.tool.call({ tool: RUN, command: 'compact' } as any)).deny).toMatch(/^run failed before it could run: /)
      expect((await $.tool.call({ tool: LIST } as any)).deny).toMatch(/^list_commands failed before it could run: /)
      await w.clock.settle()
      expect(w.ran).toEqual([])
    }
  })
})

describe('the list_commands tool', () => {
  test('answers names by default and details for a query, on both surfaces', async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    for (const surface of SURFACES) {
      await start($, surface)
      expect((await $.tool.call({ tool: LIST } as any)).result).toBe(listText(COMMANDS))
      expect((await $.tool.call({ tool: LIST, query: 'push' } as any)).result).toBe(listText(COMMANDS, 'push'))
    }
    expect(w.ran).toEqual([])
  })
})

const WIDTHS = [40, 160] as const
/** Every surface at a narrow and a wide width: each pane test runs the same assertions on all four. */
const PLACES = SURFACES.flatMap((surface) => WIDTHS.map((columns) => ({ surface, columns })))

function pane(surface: (typeof SURFACES)[number], columns: number) {
  return {
    plugin: PLUGIN,
    surface,
    component: 'Pane' as const,
    requestId: 'self-command',
    viewport: { columns, rows: 40 },
    props: { title: 'Slash commands', isFocused: true, bodyColumns: columns - 4, placement: 'inline', scroll: { offset: 0, bodyRows: 36 }, view: {} },
  } as any
}

/** Both surfaces draw Input and Select, so the mounted pane offers input and select on each. */
function mountPane($: any, surface: (typeof SURFACES)[number], columns: number): Promise<Mounted<'terminal' | 'desktop'>> {
  return $.ui.mount(pane(surface, columns))
}

function selfCommand($: any) {
  return $.command.run({ command: 'self-command', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } })
}

describe('draftTarget', () => {
  const draft = (name: string, scope: 'project' | 'user' = 'project') => ({ name, description: '', body: 'do it', scope })

  test('the path is joined from the very name it checked: trimmed, one slash dropped, under the base', () => {
    for (const [written, name] of [['notes', 'notes'], ['  /notes ', 'notes'], ['a', 'a'], ['x1-y2', 'x1-y2'], [`a${'b'.repeat(40)}`, `a${'b'.repeat(40)}`]]) {
      expect(draftTarget(draft(written!), COMMANDS, '/work')).toEqual({ name, path: `/work/.claude/commands/${name}.md` })
    }
    expect(draftTarget(draft('notes'), COMMANDS, '/work//')).toEqual({ name: 'notes', path: '/work/.claude/commands/notes.md' })
  })

  test('a name that could leave the folder or change the file name is refused, with no path', () => {
    for (const written of ['../x', 'a/b', '//x', 'x.md', 'A', 'a b', '-x', '', `a${'b'.repeat(41)}`, '~x']) {
      const target = draftTarget(draft(written), COMMANDS, '/work')
      expect('path' in target).toBe(false)
    }
  })

  test('the folder must be known and absolute, for either scope', () => {
    expect(draftTarget(draft('notes', 'user'), COMMANDS, undefined)).toEqual({ problem: 'Not saved: the home folder (HOME) is not known.' })
    expect(draftTarget(draft('notes', 'user'), COMMANDS, '  ')).toEqual({ problem: 'Not saved: the home folder (HOME) is not known.' })
    expect(draftTarget(draft('notes'), COMMANDS, '~/work')).toEqual({ problem: 'Not saved: the project folder (the session root) is not an absolute path: ~/work' })
  })
})

describe('the /self-command pane', () => {
  test('gated: off, the command says so, opens nothing and the pane draws only that line', async ($, on) => {
    const w = world(on)
    for (const { surface, columns } of PLACES) {
      w.session = `off-${surface}-${columns}`
      await start($, surface)
      expect(w.commands).not.toContain('self-command')
      expect((await selfCommand($)).text).toBe(DEV_TOOLS_OFF)
      const ui = await mountPane($, surface, columns)
      expect(await ui.find({ type: 'Text', text: DEV_TOOLS_OFF })).toBeDefined()
      expect(await ui.find({ type: 'Button' })).toBeUndefined()
      await ui.unmount()
    }
    expect(w.opened).toEqual([])
  })

  test('on: the command opens the focused pane; the list groups by source, dims refused ones, and a press fills the prompt', async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    for (const { surface, columns } of PLACES) {
      w.session = `list-${surface}-${columns}`
      w.fills = []
      await start($, surface)
      expect(w.commands).toContain('self-command')
      w.listCalls = 0
      w.toasts = []
      expect(await selfCommand($)).toEqual({})
      const ui = await mountPane($, surface, columns)
      expect(await ui.find({ type: 'Text', text: '7 commands · 0 queued' })).toBeDefined()
      for (const [key, label] of [['sc-view-commands', 'c: list'], ['sc-view-history', 'h: history'], ['sc-view-new', 'n: new']]) {
        const tab = await ui.find({ key })
        expect(tab?.props.label).toBe(label)
        expect(tab?.props.plain).toBeUndefined()
        expect(`[ ${label} ]`.length).toBeLessThanOrEqual(columns - 4)
      }
      expect(await ui.find({ key: 'sc-search' })).toBeDefined()
      for (const label of ['built-in', 'user or project', 'plugin other-tools', `plugin ${PLUGIN}`]) {
        expect(await ui.find({ type: 'Text', text: label })).toBeDefined()
      }
      expect((await ui.find({ key: 'sc-cmd-clear' }))?.props.dimColor).toBe(true)
      expect((await ui.find({ key: `sc-cmd-${SEND}` }))?.props.dimColor).toBe(true)
      expect((await ui.find({ key: 'sc-cmd-mods-dev-tools' }))?.props.dimColor).toBe(true)
      expect((await ui.find({ key: 'sc-cmd-ship' }))?.props.dimColor).toBe(false)
      expect((await ui.find({ key: 'sc-cmd-lint' }))?.props.dimColor).toBe(false)
      await ui.press({ key: 'sc-cmd-reload-plugins' })
      expect(w.fills).toEqual(['/reload-plugins '])
      // A refused command still fills the prompt, with no toast; it is only dim.
      await ui.press({ key: 'sc-cmd-clear' })
      expect(w.fills).toEqual(['/reload-plugins ', '/clear '])
      expect(w.toasts).toEqual([])
      await ui.input({ key: 'sc-search', text: 'PUSH' })
      expect(await ui.find({ key: 'sc-cmd-ship' })).toBeDefined()
      expect(await ui.find({ key: 'sc-cmd-reload-plugins' })).toBeUndefined()
      expect(await ui.find({ type: 'Text', text: /^1 of 7; press one/ })).toBeDefined()
      // One read of the list per open: the press, the search keystroke and their redraws reuse it.
      expect(w.listCalls).toBe(1)
      await ui.unmount()
    }
    expect(w.opened).toEqual(PLACES.map(() => ({ id: 'self-command', title: 'Slash commands', focus: true, closeOnEscape: true })))
  })

  test('a prompt box that does not take the command says so in a toast', async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    // The engine keeps a hook's refusal cause out of the result (it fills that field only for the
    // refusals it answers itself), so the toast here names no cause.
    w.fillRefusal = 'dialog'
    for (const { surface, columns } of PLACES) {
      w.session = `refused-${surface}-${columns}`
      w.toasts = []
      await start($, surface)
      const ui = await mountPane($, surface, columns)
      await ui.press({ key: 'sc-cmd-ship' })
      expect(w.toasts).toEqual(['The prompt box did not take /ship.'])
      await ui.unmount()
    }
  })

  test('history: a queued run shows under Queued, then under the runs once it ran', async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    for (const { surface, columns } of PLACES) {
      w.session = `hist-${surface}-${columns}`
      await start($, surface)
      const ui = await mountPane($, surface, columns)
      await ui.press({ key: 'sc-view-history' })
      expect(await ui.find({ type: 'Text', text: 'Nothing queued.' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: 'No run yet.' })).toBeDefined()
      await $.tool.call({ tool: RUN, command: 'reload-plugins' } as any)
      await ui.redraw()
      expect(await ui.find({ type: 'Text', text: '/reload-plugins' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: '7 commands · 1 queued' })).toBeDefined()
      await w.clock.settle()
      await ui.redraw()
      expect(await ui.find({ type: 'Text', text: 'Nothing queued.' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: '✓ /reload-plugins · Reloaded 12 plugins' })).toBeDefined()
      await ui.unmount()
    }
  })

  // Item 3 sweep, G3: the pane lines and the toasts of self-command show outside text masked and on one line (maskedLine).
  test('the history shows a run with its args and output masked and on one line, and the save toast names a file in the home as ~', async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    w.output = `Reloaded from ${HOME}/x \u001b[2K`
    await start($, 'terminal')
    const ui = await mountPane($, 'terminal', 200)
    await ui.press({ key: 'sc-view-history' })
    await $.tool.call({ tool: RUN, command: 'reload-plugins', args: `at ${HOME}/y\nnext` } as any)
    await ui.redraw()
    expect(await ui.find({ type: 'Text', text: '/reload-plugins at ~/y next' })).toBeDefined()
    await w.clock.settle()
    await ui.redraw()
    expect(await ui.find({ type: 'Text', text: '✓ /reload-plugins at ~/y next · Reloaded from ~/x ?[2K' })).toBeDefined()
    await ui.press({ key: 'sc-view-new' })
    await ui.select({ key: 'sc-scope', value: 'user' })
    await ui.input({ key: 'sc-name', text: 'notes' })
    await ui.input({ key: 'sc-body', text: 'Summarize my notes.' })
    await ui.press({ key: 'sc-save' })
    expect(w.toasts).toEqual(['Saved /notes as ~/.claude/commands/notes.md. It shows in the / menu once Claude Code reads the folder again.'])
    await ui.unmount()
  })

  // Item 3 sweep, G3: a command's plugin, name and description come from the command list, so each is drawn printable.
  test('a command list entry with a control character in its plugin, name or description is drawn with a ? for it', async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    w.list = [{ name: 'odd\u0007cmd', description: 'Odd \u001b[2K text', source: 'plugin' as const, plugin: 'odd\u202etools' }]
    await start($, 'terminal')
    const ui = await mountPane($, 'terminal', 200)
    expect(await ui.find({ type: 'Text', text: 'plugin odd?tools' })).toBeDefined()
    expect((await ui.find({ key: 'sc-cmd-odd\u0007cmd' }))?.props.label).toBe('/odd?cmd')
    expect(await ui.find({ type: 'Text', text: 'Odd ?[2K text' })).toBeDefined()
    await ui.unmount()
  })

  test('new command: name rule, clash, empty prompt and existing file refuse; a valid form writes by scope', async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    for (const { surface, columns } of PLACES) {
      w.session = `new-${surface}-${columns}`
      w.writes = []
      w.toasts = []
      w.files.clear()
      await start($, surface)
      const ui = await mountPane($, surface, columns)
      await ui.press({ key: 'sc-view-new' })
      for (const key of ['sc-name', 'sc-description', 'sc-body', 'sc-scope', 'sc-save']) expect(await ui.find({ key })).toBeDefined()
      const save = async (name: string, body: string) => {
        await ui.input({ key: 'sc-name', text: name })
        await ui.input({ key: 'sc-body', text: body })
        await ui.press({ key: 'sc-save' })
      }
      await save('Bad Name', 'do it')
      await save('ship', 'do it')
      await save('deploy-app', '   ')
      w.files.add(`${ROOT}/.claude/commands/taken.md`)
      await save('taken', 'do it')
      expect(w.writes).toEqual([])
      expect(w.toasts).toEqual([
        'Not saved: the name takes lowercase letters, digits and dashes, up to 41, starting with a letter or digit.',
        'Not saved: /ship is already a command of this session; pick another name.',
        'Not saved: write what the command should ask Claude to do.',
        `Not saved: ${ROOT}/.claude/commands/taken.md already exists.`,
      ])
      await ui.input({ key: 'sc-description', text: 'Deploy: build, then push' })
      await save('/deploy-app', 'Deploy $ARGUMENTS now.')
      expect(w.writes).toEqual([{ path: `${ROOT}/.claude/commands/deploy-app.md`, text: '---\ndescription: "Deploy: build, then push"\nargument-hint: <text>\n---\n\nDeploy $ARGUMENTS now.\n' }])
      expect((await ui.find({ key: 'sc-name' }))?.props.value).toBe('')
      await ui.select({ key: 'sc-scope', value: 'user' })
      await save('notes', 'Summarize my notes.')
      expect(w.writes[1]).toEqual({ path: `${HOME}/.claude/commands/notes.md`, text: '---\ndescription: "notes"\n---\n\nSummarize my notes.\n' })
      await ui.unmount()
    }
  })
  test('the list is read when the pane opens and kept until the next open', async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    for (const { surface, columns } of PLACES) {
      w.session = `cache-${surface}-${columns}`
      w.list = COMMANDS
      await start($, surface)
      await selfCommand($)
      const ui = await mountPane($, surface, columns)
      expect(await ui.find({ type: 'Text', text: '7 commands · 0 queued' })).toBeDefined()
      w.list = [...COMMANDS, cmd('later', 'user')]
      await ui.redraw()
      expect(await ui.find({ type: 'Text', text: '7 commands · 0 queued' })).toBeDefined()
      await selfCommand($)
      await ui.redraw()
      expect(await ui.find({ type: 'Text', text: '8 commands · 0 queued' })).toBeDefined()
      await ui.unmount()
    }
  })

  test('a command saved from the form shows in the list at once, without a reopen', async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    for (const { surface, columns } of PLACES) {
      w.session = `saved-${surface}-${columns}`
      w.writes = []
      w.files.clear()
      await start($, surface)
      await selfCommand($)
      const ui = await mountPane($, surface, columns)
      await ui.press({ key: 'sc-view-new' })
      await ui.input({ key: 'sc-name', text: 'notes' })
      await ui.input({ key: 'sc-body', text: 'Summarize my notes.' })
      await ui.press({ key: 'sc-save' })
      expect(w.writes.map((x) => x.path)).toEqual([`${ROOT}/.claude/commands/notes.md`])
      await ui.press({ key: 'sc-view-commands' })
      expect(await ui.find({ type: 'Text', text: '8 commands · 0 queued' })).toBeDefined()
      expect(await ui.find({ key: 'sc-cmd-notes' })).toBeDefined()
      await ui.unmount()
    }
  })

  test('a command list that fails on open stops the command, naming the cause, and opens nothing', async ($, on) => {
    // The message, as the engine reports the skipped hook: the kit offers no way to read that report.
    expect(listFailure(new Error('the command list is unavailable'))).toBe('could not read the command list: the command list is unavailable')
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    for (const { surface } of PLACES) {
      w.session = `list-fails-${surface}`
      w.attempted = []
      w.listFails = true
      await start($, surface)
      await selfCommand($)
      // The hook threw, so the engine skipped it and the run fell through to the test's own hook: a
      // swallowed failure would have answered the command itself.
      expect(w.attempted).toEqual(['self-command'])
      w.listFails = false
    }
    expect(w.opened).toEqual([])
  })

  test('a long command name is cut to fit its bracketed button at a narrow width and whole at a wide one', async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    const long = `release-${'notes-'.repeat(9)}draft`
    w.list = [...COMMANDS, cmd(long, 'user')]
    for (const { surface, columns } of PLACES) {
      w.session = `long-${surface}-${columns}`
      w.fills = []
      await start($, surface)
      await selfCommand($)
      const ui = await mountPane($, surface, columns)
      const label = String((await ui.find({ key: `sc-cmd-${long}` }))?.props.label)
      // The body is columns - 4 wide; the brackets and their spaces take 4 more.
      expect(`[ ${label} ]`.length).toBeLessThanOrEqual(columns - 4)
      expect(label === `/${long}` || (label.endsWith('…') && `/${long}`.startsWith(label.slice(0, -1)))).toBe(true)
      expect(label === `/${long}`).toBe(`[ /${long} ]`.length <= columns - 4)
      await ui.press({ key: `sc-cmd-${long}` })
      expect(w.fills).toEqual([`/${long} `])
      await ui.unmount()
    }
  })

  test('a HOME or session root that is empty or not absolute refuses the save and writes nothing', async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    const cases: Array<[scope: 'project' | 'user', root: string, home: string | undefined, toast: string]> = [
      ['user', ROOT, undefined, 'Not saved: the home folder (HOME) is not known.'],
      ['user', ROOT, '', 'Not saved: the home folder (HOME) is not known.'],
      ['user', ROOT, 'relative/home', 'Not saved: the home folder (HOME) is not an absolute path: relative/home'],
      ['project', '', HOME, 'Not saved: the project folder (the session root) is not known.'],
      ['project', 'work', HOME, 'Not saved: the project folder (the session root) is not an absolute path: work'],
    ]
    for (const { surface, columns } of PLACES) {
      w.session = `base-${surface}-${columns}`
      w.writes = []
      w.toasts = []
      await start($, surface)
      const ui = await mountPane($, surface, columns)
      await ui.press({ key: 'sc-view-new' })
      await ui.input({ key: 'sc-name', text: 'notes' })
      await ui.input({ key: 'sc-body', text: 'Summarize my notes.' })
      for (const [scope, root, home] of cases) {
        w.root = root
        w.home = home
        await ui.select({ key: 'sc-scope', value: scope })
        await ui.press({ key: 'sc-save' })
      }
      expect(w.writes).toEqual([])
      expect(w.toasts).toEqual(cases.map(([, , , toast]) => toast))
      w.root = ROOT
      w.home = HOME
      await ui.unmount()
    }
  })
})

describe('resolve-bin', () => {
  // A placeholder home, not a real one: candidatesFor only joins strings, and a literal machine
  // path in a tracked file fails tests/test_no_absolute_paths.py.
  const HOME = '<home>'
  const SYSTEM = (name: string) => ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin'].map((dir) => `${dir}/${name}`)

  test('looks in the user\'s folders first, then the system\'s, never on PATH', () => {
    expect(candidatesFor('git', HOME)).toEqual([`${HOME}/.local/bin/git`, ...SYSTEM('git')])
    expect(candidatesFor('claude', HOME)).toEqual([`${HOME}/.local/bin/claude`, `${HOME}/.claude/local/claude`, `${HOME}/.npm-global/bin/claude`, ...SYSTEM('claude')])
    expect(candidatesFor('tmux', undefined)).toEqual(SYSTEM('tmux'))
    expect(candidatesFor('python3', '')).toEqual(SYSTEM('python3'))
  })

  test('picks the first candidate that is a file, and none when no candidate is', async () => {
    const files = new Set(['/usr/bin/git', '/bin/git'])
    const asked: string[] = []
    const isFile = async (p: string) => {
      asked.push(p)
      return files.has(p)
    }
    expect(await firstFile(candidatesFor('git', HOME), isFile)).toBe('/usr/bin/git')
    expect(asked).toEqual([`${HOME}/.local/bin/git`, '/opt/homebrew/bin/git', '/usr/local/bin/git', '/usr/bin/git'])
    expect(await firstFile(candidatesFor('python3', HOME), isFile)).toBeUndefined()
  })

  test('newestVersion compares numbers, not strings, and ignores every name that is not x.y.z', () => {
    expect(newestVersion(['2.1.9', '2.1.10'])).toBe('2.1.10')
    expect(newestVersion(['2.1.311', '2.1.310'])).toBe('2.1.311')
    expect(newestVersion(['2.1.9', 'latest', '.DS_Store', '2.1', '2.2.0-beta', '2.1.10'])).toBe('2.1.10')
    expect(newestVersion(['latest', '.DS_Store', '2.1', '2.2.0-beta'])).toBeUndefined()
    expect(newestVersion([])).toBeUndefined()
  })

  test('the versions candidate comes right after ~/.local/bin/claude, and is left out with no newest', () => {
    const versions = `${HOME}/.local/share/claude/versions/2.1.10`
    expect(candidatesFor('claude', HOME, undefined, '2.1.10')).toEqual([`${HOME}/.local/bin/claude`, versions, `${HOME}/.claude/local/claude`, `${HOME}/.npm-global/bin/claude`, ...SYSTEM('claude')])
    expect(candidatesFor('claude', HOME, undefined, undefined)).toEqual(candidatesFor('claude', HOME))
    expect(candidatesFor('claude', HOME)).not.toContain(versions)
    expect(candidatesFor('git', HOME, undefined, '2.1.10')).toEqual(candidatesFor('git', HOME))
  })

  test('the Windows claude location is last, only with a non-empty userProfile and only for claude: candidate string only, not run on Windows', () => {
    const exe = '<profile>/.local/bin/claude.exe'
    expect(candidatesFor('claude', HOME, '<profile>').at(-1)).toBe(exe)
    expect(candidatesFor('claude', undefined, '<profile>')).toEqual([...SYSTEM('claude'), exe])
    expect(candidatesFor('claude', HOME, '')).toEqual(candidatesFor('claude', HOME))
    expect(candidatesFor('claude', HOME, undefined)).not.toContain(exe)
    expect(candidatesFor('tmux', HOME, '<profile>')).toEqual(candidatesFor('tmux', HOME))
  })

  test('the probe tool, with ~/.local/bin/claude missing, resolves claude to the newest file in the versions folder, and lists only a folder that exists', async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    // The world's HOME, not this block's placeholder: resolve-bin reads it through $.env.get.
    const home = w.home!
    const dir = `${home}/.local/share/claude/versions`
    const probe = () => $.tool.call({ tool: `mcp__${PLUGIN}__probe`, plugins: ['demo'], steps: ['/demo on'] } as any)
    for (const file of [`${ROOT}/plugins/demo/.claude-plugin/plugin.json`, '/usr/bin/python3', '/opt/homebrew/bin/tmux', '/usr/bin/git']) w.files.add(file)
    await start($, 'terminal')

    w.session = 'resolve-with-versions'
    w.files.add(dir)
    w.files.add(`${dir}/2.1.9`)
    w.files.add(`${dir}/2.1.10`)
    w.dirs.set(dir, [{ name: '2.1.9', kind: 'file' }, { name: '2.1.10', kind: 'file' }, { name: '2.1.11', kind: 'dir' }])
    expect((await probe()).result).toMatch(/^started: /)
    await w.clock.settle()
    expect(w.argv.map((argv) => argv.find((a) => a.startsWith('--claude=')))).toEqual([`--claude=${dir}/2.1.10`])
    expect(w.listed).toEqual([dir])

    // The folder is absent: it is not listed, and the old candidates still decide.
    w.session = 'resolve-without-versions'
    w.listed = []
    w.files.delete(dir)
    w.files.add(`${home}/.local/bin/claude`)
    expect((await probe()).result).toMatch(/^started: /)
    await w.clock.settle()
    expect(w.argv.map((argv) => argv.find((a) => a.startsWith('--claude=')))).toEqual([`--claude=${dir}/2.1.10`, `--claude=${home}/.local/bin/claude`])
    expect(w.listed).toEqual([])
  })

  // The probe resolves python3, claude, tmux and git in turn; these files let every other program resolve.
  const OTHERS = ['/usr/bin/python3', '/opt/homebrew/bin/tmux', '/usr/bin/git']
  const claudeArgs = (w: { argv: string[][] }) => w.argv.map((argv) => argv.find((a) => a.startsWith('--claude=')))

  // The kit hands register(on, options) the test's options, as a load does; so the setting is driven through them.
  const CUSTOM = { options: { claudePath: '/custom/claude' } }

  test('a configured claude path is the only candidate: it is used, and no folder is listed', CUSTOM, async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    const dir = `${w.home}/.local/share/claude/versions`
    const probe = () => $.tool.call({ tool: `mcp__${PLUGIN}__probe`, plugins: ['demo'], steps: ['/demo on'] } as any)
    for (const file of [`${ROOT}/plugins/demo/.claude-plugin/plugin.json`, ...OTHERS, '/custom/claude', dir, `${dir}/2.1.10`]) w.files.add(file)
    w.dirs.set(dir, [{ name: '2.1.10', kind: 'file' }])
    await start($, 'terminal')
    w.session = 'configured-present'
    expect((await probe()).result).toMatch(/^started: /)
    await w.clock.settle()
    expect(claudeArgs(w)).toEqual(['--claude=/custom/claude'])
    expect(w.listed).toEqual([])
  })

  test('a configured claude path that is absent is rejected naming the setting, and no other candidate is used', CUSTOM, async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    const probe = () => $.tool.call({ tool: `mcp__${PLUGIN}__probe`, plugins: ['demo'], steps: ['/demo on'] } as any)
    // ~/.local/bin/claude exists, yet must not be used.
    for (const file of [`${ROOT}/plugins/demo/.claude-plugin/plugin.json`, ...OTHERS, `${w.home}/.local/bin/claude`]) w.files.add(file)
    await start($, 'terminal')
    w.session = 'configured-absent'
    expect((await probe()).result).toMatch(/^started: /)
    await w.clock.settle()
    expect(w.argv).toEqual([])
    const sent = w.ran.find((line) => line.startsWith(`${SEND} `))
    expect(sent).toContain('claude was not found; looked in /custom/claude (the claudePath setting)')
    expect(sent).not.toContain('.local/bin')
  })

  test('a configured claude path that is not absolute is rejected at once, naming the setting, without looking up that path', { options: { claudePath: '~/bin/claude' } }, async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    const probe = () => $.tool.call({ tool: `mcp__${PLUGIN}__probe`, plugins: ['demo'], steps: ['/demo on'] } as any)
    for (const file of [`${ROOT}/plugins/demo/.claude-plugin/plugin.json`, ...OTHERS]) w.files.add(file)
    await start($, 'terminal')
    w.session = 'configured-relative'
    w.existsAsked = []
    expect((await probe()).result).toMatch(/^started: /)
    await w.clock.settle()
    expect(w.argv).toEqual([])
    const sent = w.ran.find((line) => line.startsWith(`${SEND} `))
    expect(sent).toContain('claudePath must be an absolute path, not ~/bin/claude')
    expect(w.existsAsked).not.toContain('~/bin/claude')
  })

  test('a configured claude path of only spaces counts as not configured', { options: { claudePath: '   ' } }, async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    const probe = () => $.tool.call({ tool: `mcp__${PLUGIN}__probe`, plugins: ['demo'], steps: ['/demo on'] } as any)
    for (const file of [`${ROOT}/plugins/demo/.claude-plugin/plugin.json`, ...OTHERS, `${w.home}/.local/bin/claude`]) w.files.add(file)
    await start($, 'terminal')
    w.session = 'configured-blank'
    expect((await probe()).result).toMatch(/^started: /)
    await w.clock.settle()
    expect(claudeArgs(w)).toEqual([`--claude=${w.home}/.local/bin/claude`])
  })
  test('a candidate that exists but is a folder is skipped', async ($, on) => {
    const w = world(on, await signedOn(DEV_FUNCTIONS))
    const probe = () => $.tool.call({ tool: `mcp__${PLUGIN}__probe`, plugins: ['demo'], steps: ['/demo on'] } as any)
    const folder = `${w.home}/.local/bin/claude`
    for (const file of [`${ROOT}/plugins/demo/.claude-plugin/plugin.json`, ...OTHERS, folder, '/usr/local/bin/claude']) w.files.add(file)
    w.kinds.set(folder, 'dir')
    await start($, 'terminal')
    w.session = 'stat-folder'
    expect((await probe()).result).toMatch(/^started: /)
    await w.clock.settle()
    expect(claudeArgs(w)).toEqual(['--claude=/usr/local/bin/claude'])
  })
})
