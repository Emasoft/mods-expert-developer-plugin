// Tests of the probe-runner mod (TRDD-03IIDGPP, increment 1): the probe tool and its command, the dev-tools gate on
// both, the plugin directories, the binaries from resolve-bin and the report path through the send command. hooks/index.ts
// hooks/index.ts wires the mod, and the tests drive it through $.session.start, because the kit refuses an engine call from a hook that the hooks module does not reach.
import { describe, expect, mock, test, type MockClock } from 'claude-code/testing'

import { DEV_TOOLS_KEY, DEV_TOOLS_OFF } from '../dev-tools'
import { TOOL_NAME, USAGE, parseArgs, pluginDir, probeOf, scriptArgv, type ProbeBins } from '../probe-runner/logic'
import { SEND_COMMAND } from '../self-command/logic'

const PLUGIN = 'mods-expert-developer-plugin'
const TOOL = `mcp__${PLUGIN}__${TOOL_NAME}`
const ON = { [DEV_TOOLS_KEY]: true }
// Placeholder home and absolute program paths, not a machine's: tests/test_no_absolute_paths.py counts none of them.
const HOME = '/home/<user>'
const ROOT = '/work'
const CWD = '/work/sub'
const PY = '/usr/bin/python3'
const CLAUDE = `${HOME}/.local/bin/claude`
const TMUX = '/opt/homebrew/bin/tmux'
const GIT = '/usr/bin/git'
const PROGRAMS = [PY, CLAUDE, TMUX, GIT]
const DEMO_DIR = `${ROOT}/plugins/demo`

const run = (args: string) => ({ command: 'probe-runner', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } }) as any
const start = ($: any) => $.session.start({ surface: 'terminal', isInteractive: true, cwd: CWD })

type World = {
  clock: MockClock
  session: string
  root: string
  cwd: string
  home: string | undefined
  store: Map<string, unknown>
  /** The paths $.fs.exists answers true for. */
  files: Set<string>
  tools: Array<{ name: string; isDeferred: unknown }>
  commands: string[]
  /** Every process the mod ran, as its argument vector. */
  argv: string[][]
  processResult: { exitCode: number; stdout: string; stderr: string }
  /** When true, the send command refuses the report. */
  sendFails: boolean
  sent: string[]
  prompts: string[]
  logs: string[]
  toasts: string[]
}

let sessions = 0

/** The mod's hooks on the test engine, and the fakes behind them. A new session id per world keeps resolve-bin's per-session cache apart. */
function world(on: any, store: Record<string, unknown> = {}, programs: string[] = PROGRAMS): World {
  const w: World = {
    clock: mock.clock(on, { now: 1_000 }),
    session: `probe-${(sessions += 1)}`,
    root: ROOT,
    cwd: CWD,
    home: HOME,
    store: new Map(Object.entries(store)),
    files: new Set([`${DEMO_DIR}/.claude-plugin/plugin.json`, ...programs]),
    tools: [],
    commands: [],
    argv: [],
    processResult: { exitCode: 0, stdout: '# probe report', stderr: '' },
    sendFails: false,
    sent: [],
    prompts: [],
    logs: [],
    toasts: [],
  }
  on('session.start', ($: any, e: any) => ({ cwd: e.cwd }))
  on('session.id', () => ({ value: w.session }))
  on('session.cwd', () => ({ value: w.cwd }))
  on('session.root', () => ({ value: w.root }))
  on('env.get', ($: any, e: any) => ({ value: e.name === 'HOME' ? w.home : undefined }))
  on('fs.exists', ($: any, e: any) => ({ value: w.files.has(e.path) }))
  on('fs.stat', () => ({ value: { kind: 'file' } }))
  on('store.get', ($: any, e: any) => ({ value: w.store.get(e.key) }))
  on('store.set', ($: any, e: any) => {
    w.store.set(e.key, e.value)
    return { value: undefined }
  })
  on('tool.register', ($: any, e: any) => {
    w.tools.push({ name: e.name, isDeferred: e.isDeferred })
    return { value: { tool: `mcp__${PLUGIN}__${e.name}` } }
  })
  on('command.register', ($: any, e: any) => {
    w.commands.push(e.name)
    return { value: { command: e.name } }
  })
  on('process.run', ($: any, e: any) => {
    w.argv.push([...e.argv])
    return { value: w.processResult }
  })
  // Only the send command reaches here: the probe-runner command is answered by the mod's own hook.
  // A throw, not a value: the engine refuses the send, and $.command.run rejects.
  on('command.run', ($: any, e: any) => {
    if (e.command !== SEND_COMMAND) return {}
    if (w.sendFails) throw new Error('the send command refused the report')
    w.sent.push(e.args)
    return {}
  })
  on('prompt.submit', ($: any, e: any) => {
    w.prompts.push(e.text)
    return { value: undefined }
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

describe('probe-runner arguments and paths', () => {
  test('the command reads the model, the plugin list and the steps joined by ;;', () => {
    expect(parseArgs('demo-a,demo-b /demo on ;; /demo x ;; what now?')).toEqual({ plugins: ['demo-a', 'demo-b'], steps: ['/demo on', '/demo x', 'what now?'], model: 'sonnet' })
    expect(parseArgs('--model opus demo hello')).toEqual({ plugins: ['demo'], steps: ['hello'], model: 'opus' })
    expect(parseArgs('demo')).toBe(USAGE)
    expect(parseArgs('--model')).toBe(USAGE)
  })

  test('a plugin is a name under plugins/, a path, or the repository itself when the repository is a plugin', () => {
    expect(pluginDir('demo', ROOT, CWD, HOME, false)).toBe(DEMO_DIR)
    expect(pluginDir('./x', ROOT, CWD, HOME, false)).toBe(`${CWD}/./x`)
    expect(pluginDir('~/m', ROOT, CWD, HOME, false)).toBe(`${HOME}/m`)
    expect(pluginDir('/abs/m', ROOT, CWD, HOME, false)).toBe('/abs/m')
    expect(pluginDir('demo', ROOT, CWD, HOME, true)).toBe(ROOT)
    expect(pluginDir('.', ROOT, CWD, HOME, true)).toBe(ROOT)
  })

  test('the tool input needs plugins and steps', () => {
    expect(probeOf({ plugins: ['a'] })).toBe('steps is required: at least one prompt or slash command')
    expect(probeOf({ steps: ['a'] })).toBe('plugins is required: at least one plugin name or path')
    expect(probeOf({ plugins: ['a'], steps: ['b'], model: 'opus' })).toEqual({ plugins: ['a'], steps: ['b'], model: 'opus' })
  })

  test('the script gets its three programs, each plugin directory and each step as one argument, a step with a dash included', () => {
    const bins: ProbeBins = { python: PY, claude: CLAUDE, tmux: TMUX, git: GIT }
    expect(scriptArgv(bins, '/plugin/scripts/probe.py', { plugins: ['demo'], steps: ['s 1', '-x'], model: 'sonnet' }, [DEMO_DIR])).toEqual([
      PY,
      '/plugin/scripts/probe.py',
      `--claude=${CLAUDE}`,
      `--tmux=${TMUX}`,
      `--git=${GIT}`,
      '--model=sonnet',
      `--plugin-dir=${DEMO_DIR}`,
      '--step=s 1',
      '--step=-x',
    ])
  })
})

describe('the probe-runner gate', () => {
  test('off by default: nothing registers, and the tool and the command refuse at once', async ($, on) => {
    const w = world(on)
    await start($)
    expect(w.tools.filter((t) => t.name === TOOL_NAME)).toEqual([])
    expect(w.commands).not.toContain('probe-runner')
    expect((await $.tool.call({ tool: TOOL, plugins: ['demo'], steps: ['x'] } as any)).deny).toBe(DEV_TOOLS_OFF)
    expect((await $.command.run(run('demo x'))).text).toBe(DEV_TOOLS_OFF)
    await w.clock.settle()
    expect(w.argv).toEqual([])
    expect(w.sent).toEqual([])
  })

  test('on: the tool registers not deferred, and the command registers', async ($, on) => {
    const w = world(on, ON)
    await start($)
    expect(w.tools.filter((t) => t.name === TOOL_NAME)).toEqual([{ name: TOOL_NAME, isDeferred: false }])
    expect(w.commands).toContain('probe-runner')
  })

  test('turning the gate off refuses a call made after the tools registered', async ($, on) => {
    const w = world(on, ON)
    await start($)
    w.store.set(DEV_TOOLS_KEY, false)
    expect((await $.tool.call({ tool: TOOL, plugins: ['demo'], steps: ['x'] } as any)).deny).toBe(DEV_TOOLS_OFF)
    expect((await $.command.run(run('demo x'))).text).toBe(DEV_TOOLS_OFF)
    await w.clock.settle()
    expect(w.argv).toEqual([])
  })
})

describe('the probe tool', () => {
  test('answers at once, then runs the probe after the turn with python3, claude, tmux and git and sends its report', async ($, on) => {
    const w = world(on, ON)
    await start($)
    const r = await $.tool.call({ tool: TOOL, plugins: ['demo'], steps: ['/demo on'] } as any)
    expect(r.result).toBe('started: 1 step(s) with demo on sonnet; the report arrives as the next message when the probe ends')
    expect(w.argv).toEqual([])
    await w.clock.settle()
    expect(w.argv.length).toBe(1)
    expect(w.argv[0]![0]).toBe(PY)
    expect(w.argv[0]!.slice(2)).toEqual([`--claude=${CLAUDE}`, `--tmux=${TMUX}`, `--git=${GIT}`, '--model=sonnet', `--plugin-dir=${DEMO_DIR}`, '--step=/demo on'])
    expect(w.sent).toEqual(['# probe report'])
  })

  test('a plugin with no manifest is answered before anything runs', async ($, on) => {
    const w = world(on, ON)
    await start($)
    expect((await $.tool.call({ tool: TOOL, plugins: ['nope'], steps: ['x'] } as any)).deny).toBe(`no plugin at ${ROOT}/plugins/nope: it has no .claude-plugin/plugin.json`)
    await w.clock.settle()
    expect(w.argv).toEqual([])
  })

  test('the repository itself answers a bare name or "." when it is a plugin', async ($, on) => {
    const w = world(on, ON)
    w.files.add(`${ROOT}/.claude-plugin/plugin.json`)
    await start($)
    await $.tool.call({ tool: TOOL, plugins: ['.'], steps: ['/x'] } as any)
    await w.clock.settle()
    expect(w.argv[0]!).toContain(`--plugin-dir=${ROOT}`)
  })

  test('a missing tmux answers the call as started, then the report names every place it looked, and nothing runs', async ($, on) => {
    const w = world(on, ON, PROGRAMS.filter((p) => p !== TMUX))
    await start($)
    const r = await $.tool.call({ tool: TOOL, plugins: ['demo'], steps: ['x'] } as any)
    expect(r.result).toMatch(/^started: /)
    await w.clock.settle()
    expect(w.sent.length).toBe(1)
    expect(w.sent[0]).toMatch(/^the probe did not finish: (Error: )?tmux was not found; looked in /)
    expect(w.sent[0]).toContain('/opt/homebrew/bin/tmux')
    expect(w.argv).toEqual([])
  })

  test('a probe whose script exits non-zero sends the exit code and its error text as the report', async ($, on) => {
    const w = world(on, ON)
    w.processResult = { exitCode: 2, stdout: '', stderr: 'boom' }
    await start($)
    expect((await $.tool.call({ tool: TOOL, plugins: ['demo'], steps: ['x'] } as any)).result).toMatch(/^started: /)
    await w.clock.settle()
    expect(w.sent).toEqual(['the probe failed (exit 2): boom'])
  })

  test('a HOME, session root or working folder that is blank or relative refuses the call and runs nothing', async ($, on) => {
    const w = world(on, ON)
    await start($)
    const cases: Array<[home: string | undefined, root: string, cwd: string, deny: string]> = [
      [undefined, ROOT, CWD, 'Not run: the home folder (HOME) is not known.'],
      ['', ROOT, CWD, 'Not run: the home folder (HOME) is not known.'],
      ['relative/home', ROOT, CWD, 'Not run: the home folder (HOME) is not an absolute path: relative/home'],
      [HOME, '', CWD, 'Not run: the session root is not known.'],
      [HOME, 'work', CWD, 'Not run: the session root is not an absolute path: work'],
      [HOME, ROOT, ' ', 'Not run: the working folder is not known.'],
      [HOME, ROOT, 'sub', 'Not run: the working folder is not an absolute path: sub'],
    ]
    for (const [home, root, cwd, deny] of cases) {
      w.home = home
      w.root = root
      w.cwd = cwd
      expect((await $.tool.call({ tool: TOOL, plugins: ['demo'], steps: ['x'] } as any)).deny).toBe(deny)
    }
    await w.clock.settle()
    expect(w.argv).toEqual([])
  })

  test('input that is not a probe is denied with what is missing', async ($, on) => {
    world(on, ON)
    await start($)
    expect((await $.tool.call({ tool: TOOL, steps: ['x'] } as any)).deny).toBe('plugins is required: at least one plugin name or path')
  })
})

describe('the probe-runner command', () => {
  test('answers at once, then runs the probe after the turn and sends its report through the send command', async ($, on) => {
    const w = world(on, ON)
    await start($)
    const r = await $.command.run(run('demo /demo on'))
    expect(r.text).toBe('started: 1 step(s) with demo on sonnet; the report arrives as the next message when the probe ends')
    expect(w.argv).toEqual([])
    await w.clock.settle()
    expect(w.argv.length).toBe(1)
    expect(w.sent).toEqual(['# probe report'])
  })

  test('a report the send command refuses is logged and toasted, and nothing is submitted as a prompt', async ($, on) => {
    const w = world(on, ON)
    w.sendFails = true
    await start($)
    await $.command.run(run('demo /demo on'))
    await w.clock.settle()
const logged = w.logs.filter((l) => l.startsWith('probe-runner:'))
    expect(logged.length).toBe(1)
    expect(logged[0]).toMatch(/^probe-runner: the report could not be sent to the model: /)
    expect(w.toasts.filter((t) => t.startsWith('The probe report')).length).toBe(1)
    expect(w.toasts.find((t) => t.startsWith('The probe report'))).toMatch(/^The probe report did not reach the model: /)
    expect(w.prompts).toEqual([])
  })

  test('a usage error answers the usage line and runs nothing', async ($, on) => {
    const w = world(on, ON)
    await start($)
    expect((await $.command.run(run('demo'))).text).toBe(USAGE)
    await w.clock.settle()
    expect(w.argv).toEqual([])
  })

  test('a plugin with no manifest answers the refusal at once and runs nothing', async ($, on) => {
    const w = world(on, ON)
    await start($)
    expect((await $.command.run(run('nope /x'))).text).toBe(`no plugin at ${ROOT}/plugins/nope: it has no .claude-plugin/plugin.json`)
    await w.clock.settle()
    expect(w.argv).toEqual([])
  })
})
