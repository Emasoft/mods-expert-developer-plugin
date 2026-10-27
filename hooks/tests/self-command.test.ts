// Tests of the dev tools run and list_commands, the /mods-dev-tools gate and the resolve-bin helper.
// Every wiring test starts the session on both surfaces with the same assertions (no pane in A1).
import { describe, expect, mock, test, type MockClock } from 'claude-code/testing'

import { DEV_TOOLS_KEY, parseDevToolsSwitch } from '../dev-tools'
import { candidatesFor, firstFile } from '../resolve-bin'
import {
  HISTORY_KEY,
  MAX_ENTRIES,
  MAX_SESSIONS,
  OUTPUT_PREVIEW,
  type HistoryEntry,
  listText,
  recordRun,
  requestOf,
} from '../self-command/logic'

const PLUGIN = 'mods-expert-developer-plugin'
const RUN = `mcp__${PLUGIN}__run`
const LIST = `mcp__${PLUGIN}__list_commands`
const SEND = `${PLUGIN}:send`
const SURFACES = ['terminal', 'desktop'] as const

const COMMANDS = [
  { name: 'reload-plugins', description: 'Reload every plugin', source: 'builtin' as const },
  { name: 'clear', description: 'Empty the conversation', source: 'builtin' as const },
  { name: 'compact', description: 'Summarize the conversation', source: 'builtin' as const },
  { name: 'ship', description: 'Run the tests, then push', source: 'user' as const },
  { name: 'lint', description: 'Lint the tree', source: 'plugin' as const, plugin: 'other-tools' },
  { name: SEND, description: 'Hands the model an outcome', source: 'plugin' as const, plugin: PLUGIN },
]
const NAMES = COMMANDS.map((c) => c.name)

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
  /** When true, $.command.list rejects. */
  listFails: boolean
}

function world(on: any, store: Record<string, unknown> = {}): World {
  const w: World = { clock: mock.clock(on, { now: 1_000 }), store: new Map(Object.entries(store)), ran: [], attempted: [], registered: [], commands: [], logs: [], toasts: [], session: 'sess-1', failing: undefined, listFails: false }
  on('session.start', ($: any, e: any) => ({ cwd: e.cwd }))
  on('session.id', () => ({ value: w.session }))
  on('store.get', ($: any, e: any) => ({ value: w.store.get(e.key) }))
  on('store.set', ($: any, e: any) => {
    w.store.set(e.key, e.value)
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
    return { value: COMMANDS }
  })
  // Only the commands a plugin runs reach here; /mods-dev-tools is answered by the mod's own hook.
  // A throw, not { deny }: the kit skips a test hook that throws, so $.command.run rejects as the
  // engine's refusal would (no implementation for command.run).
  on('command.run', ($: any, e: any) => {
    w.attempted.push(e.command)
    if (e.command === w.failing) throw new Error(`${e.command} failed`)
    w.ran.push(`${e.command} ${e.args}`.trim())
    if (e.command === 'lint') return { text: 'x'.repeat(OUTPUT_PREVIEW * 2) }
    return e.command === 'reload-plugins' ? { text: 'Reloaded 12 plugins' } : {}
  })
  on('ui.log', ($: any, e: any) => {
    w.logs.push(e.text)
    return { value: undefined }
  })
  on('ui.toast', ($: any, e: any) => {
    w.toasts.push(e.text)
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
    expect(requestOf({ command: '/reload-plugins' }, NAMES)).toEqual({ command: 'reload-plugins', args: '' })
    expect(requestOf({ command: 'compact keep the API notes' }, NAMES)).toEqual({ command: 'compact', args: 'keep the API notes' })
    expect(requestOf({ command: 'compact', args: '  keep it ' }, NAMES)).toEqual({ command: 'compact', args: 'keep it' })
  })

  test('refuses every blocked command, an unknown name and a missing one', () => {
    for (const name of ['clear', 'exit', 'quit', 'logout', 'login', 'resume', 'rewind']) {
      expect(requestOf({ command: name }, [...NAMES, name])).toBe(`/${name} clears, ends or swaps the session, so the run tool refuses it`)
    }
    expect(requestOf({ command: 'deploy' }, NAMES)).toBe('/deploy is not a command of this session (list_commands names them)')
    expect(requestOf({}, NAMES)).toBe('command is required: the command name without its slash')
    expect(requestOf({ command: '  /  ' }, NAMES)).toBe('command is required: the command name without its slash')
  })
})

describe('listText', () => {
  test('without a query: names only, grouped by source in list order, blocked ones marked', () => {
    expect(listText(COMMANDS)).toBe([
      '6 commands. Pass query for descriptions; (blocked) means the run tool refuses it.',
      'built-in: reload-plugins, clear (blocked), compact',
      'user or project: ship',
      'plugin other-tools: lint',
      `plugin ${PLUGIN}: ${SEND}`,
    ].join('\n'))
  })

  test('a query matches name or description in any case, with details and a built-in\'s use line', () => {
    expect(listText(COMMANDS, 'CONVERSATION')).toBe([
      '2 of 6 commands match "CONVERSATION".',
      'built-in:',
      '- /clear (blocked): Empty the conversation',
      '  use it when starting unrelated work; it empties the conversation (blocked for the run tool)',
      '- /compact: Summarize the conversation',
      '  use it when the context is filling up; text after the name says what the summary must keep',
    ].join('\n'))
    expect(listText(COMMANDS, 'push')).toBe(['1 of 6 commands match "push".', 'user or project:', '- /ship: Run the tests, then push'].join('\n'))
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

describe('the dev-tools gate', () => {
  test('off by default: no tool registers and both tools refuse, on both surfaces', async ($, on) => {
    const w = world(on)
    for (const surface of SURFACES) {
      await start($, surface)
      expect(w.registered).toEqual([])
      expect(w.commands).toContain('mods-dev-tools')
      const run = await $.tool.call({ tool: RUN, command: 'reload-plugins' } as any)
      expect(run.deny).toBe('The mods dev tools are off. /mods-dev-tools on turns them on from the next session.')
      const list = await $.tool.call({ tool: LIST } as any)
      expect(list.deny).toBe('The mods dev tools are off. /mods-dev-tools on turns them on from the next session.')
      await w.clock.settle()
      expect(w.ran).toEqual([])
    }
  })

  test('/mods-dev-tools saves the flag; on registers the tools at the next start, off refuses at once', async ($, on) => {
    const w = world(on)
    for (const surface of SURFACES) {
      w.registered = []
      await start($, surface)
      expect((await devTools($, 'on')).text).toBe('The mods dev tools are on. Their tools register when the next session starts.')
      expect(w.store.get(DEV_TOOLS_KEY)).toBe(true)
      expect(w.registered).toEqual([])
      await start($, surface)
      expect(w.registered).toEqual([{ name: 'run', isDeferred: false }, { name: 'list_commands', isDeferred: false }])
      expect((await $.tool.call({ tool: RUN, command: 'compact' } as any)).result).toBeDefined()
      expect((await devTools($)).text).toMatch(/^The mods dev tools are off\. Every call to them is refused from now on/)
      expect(w.store.get(DEV_TOOLS_KEY)).toBe(false)
      expect((await $.tool.call({ tool: RUN, command: 'compact' } as any)).deny).toMatch(/^The mods dev tools are off\./)
      expect((await devTools($, 'maybe')).text).toBe('Usage: /mods-dev-tools [on|off]')
    }
  })
})

describe('the run tool', () => {
  test('queues the command, runs it after the turn, reports through the send command, logs and records it', async ($, on) => {
    const w = world(on, { [DEV_TOOLS_KEY]: true })
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
    const w = world(on, { [DEV_TOOLS_KEY]: true })
    for (const surface of SURFACES) {
      await start($, surface)
      expect((await $.tool.call({ tool: RUN, command: 'clear' } as any)).deny).toBe('/clear clears, ends or swaps the session, so the run tool refuses it')
      expect((await $.tool.call({ tool: RUN, command: 'deploy' } as any)).deny).toBe('/deploy is not a command of this session (list_commands names them)')
      await w.clock.settle()
      expect(w.ran).toEqual([])
      expect(w.store.get(HISTORY_KEY)).toBeUndefined()
    }
  })

  test('a command that fails is reported as not run and recorded as failed', async ($, on) => {
    const w = world(on, { [DEV_TOOLS_KEY]: true })
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
    const w = world(on, { [DEV_TOOLS_KEY]: true })
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

  test(`a long output is kept in the history cut to ${OUTPUT_PREVIEW} characters`, async ($, on) => {
    const w = world(on, { [DEV_TOOLS_KEY]: true })
    await start($, 'terminal')
    await $.tool.call({ tool: RUN, command: 'lint' } as any)
    await w.clock.settle()
    expect((w.store.get(HISTORY_KEY) as any)['sess-1'].entries[0].output.length).toBe(OUTPUT_PREVIEW)
  })
})

describe('a gating hook that fails', () => {
  test('refuses the call with the reason when the command list cannot be read, on both surfaces', async ($, on) => {
    const w = world(on, { [DEV_TOOLS_KEY]: true })
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
    const w = world(on, { [DEV_TOOLS_KEY]: true })
    for (const surface of SURFACES) {
      await start($, surface)
      expect((await $.tool.call({ tool: LIST } as any)).result).toBe(listText(COMMANDS))
      expect((await $.tool.call({ tool: LIST, query: 'push' } as any)).result).toBe(listText(COMMANDS, 'push'))
    }
    expect(w.ran).toEqual([])
  })
})

describe('resolve-bin', () => {
  test('looks in the user\'s folders first, then the system\'s, never on PATH', () => {
    expect(candidatesFor('git', '/home/u')).toEqual(['/home/u/.local/bin/git', '/opt/homebrew/bin/git', '/usr/local/bin/git', '/usr/bin/git', '/bin/git'])
    expect(candidatesFor('claude', '/home/u').slice(0, 3)).toEqual(['/home/u/.local/bin/claude', '/home/u/.claude/local/claude', '/home/u/.npm-global/bin/claude'])
    expect(candidatesFor('tmux', undefined)).toEqual(['/opt/homebrew/bin/tmux', '/usr/local/bin/tmux', '/usr/bin/tmux', '/bin/tmux'])
  })

  test('picks the first candidate that is a file, and none when no candidate is', async () => {
    const files = new Set(['/usr/bin/git', '/bin/git'])
    const asked: string[] = []
    const isFile = async (p: string) => {
      asked.push(p)
      return files.has(p)
    }
    expect(await firstFile(candidatesFor('git', '/home/u'), isFile)).toBe('/usr/bin/git')
    expect(asked).toEqual(['/home/u/.local/bin/git', '/opt/homebrew/bin/git', '/usr/local/bin/git', '/usr/bin/git'])
    expect(await firstFile(candidatesFor('python3', '/home/u'), isFile)).toBeUndefined()
  })
})
