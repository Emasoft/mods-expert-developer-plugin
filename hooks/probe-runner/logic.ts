// probe-runner (TRDD-03IIDGPP, increment 1): the dev tool `probe` and its command. Every decision is a
// function here: the arguments, the plugin directories, the script's argument vector and the texts the
// tool and the command answer. ./register.ts only wires them to the engine (house pattern: logic pure,
// register thin). Both sit behind the dev-tools gate (../dev-tools.ts).

export const TOOL_NAME = 'probe'
export const DEFAULT_MODEL = 'sonnet'
/** A probe ends at ten minutes, the most `$.process.run` waits. */
export const PROBE_MS = 600_000

export type Probe = { plugins: string[]; steps: string[]; model: string }

/** The absolute paths of the external programs, from ../resolve-bin.ts: a bare name would depend on PATH, which the Desktop app does not inherit. */
export type ProbeBins = { python: string; claude: string; tmux: string; git: string }

export const USAGE = 'expects [--model <model>] <plugin>[,<plugin>...] <step> [;; <step> ...], a plugin by its name under plugins/ or by its path'

/** Splits the command's words: `--model m` first when given, the plugin list, then the steps joined by `;;`. */
export function parseArgs(args: string): Probe | string {
  const words = args.trim().split(/\s+/)
  let model = DEFAULT_MODEL
  if (words[0] === '--model') {
    model = words[1] ?? ''
    words.splice(0, 2)
  }
  const [list = '', ...rest] = words
  const steps = rest.join(' ').split(';;').map((s) => s.trim()).filter((s) => s !== '')
  const plugins = list.split(',').filter((p) => p !== '')
  if (model === '' || plugins.length === 0 || steps.length === 0) return USAGE
  return { plugins, steps, model }
}

/** The tool's input, checked; a string names what is wrong. */
export function probeOf(input: Record<string, unknown>): Probe | string {
  const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string' && s.trim() !== '') : [])
  const plugins = strings(input.plugins)
  const steps = strings(input.steps)
  if (plugins.length === 0) return 'plugins is required: at least one plugin name or path'
  if (steps.length === 0) return 'steps is required: at least one prompt or slash command'
  return { plugins, steps, model: typeof input.model === 'string' && input.model !== '' ? input.model : DEFAULT_MODEL }
}

/**
 * Where a plugin named by `name` lives: a path as given (relative to `cwd`), or `<root>/plugins/<name>`.
 * A repository that is itself a plugin (`rootIsPlugin`) answers a bare name or "." with its own root.
 */
export function pluginDir(name: string, root: string, cwd: string, home: string, rootIsPlugin: boolean): string {
  if (name.startsWith('~/')) return `${home}/${name.slice(2)}`
  if (name.startsWith('/')) return name
  if (name.includes('/')) return `${cwd}/${name}`
  return rootIsPlugin ? root : `${root}/plugins/${name}`
}

/** A session location a plugin path is built from: its checked path, or the message that refuses the run. */
export type SessionLocation = { path: string } | { problem: string }

/**
 * A session location, checked as the self-command create form checks its folder: it must be known and
 * absolute. A blank or relative one would build a wrong plugin path, so the run is refused before anything runs.
 */
export function sessionLocation(label: string, value: string | undefined): SessionLocation {
  if (value === undefined || value.trim() === '') return { problem: `Not run: the ${label} is not known.` }
  if (!value.startsWith('/')) return { problem: `Not run: the ${label} is not an absolute path: ${value}` }
  return { path: value }
}

/** The text answered for a plugin directory that has no manifest. */
export const manifestMissing = (dir: string): string => `no plugin at ${dir}: it has no .claude-plugin/plugin.json`

/**
 * The script's argument vector. Every value is one `--name=value` argument, so a step that starts
 * with a dash is never read as an option of the script.
 */
export function scriptArgv(bins: ProbeBins, script: string, probe: Probe, dirs: readonly string[]): string[] {
  return [
    bins.python,
    script,
    `--claude=${bins.claude}`,
    `--tmux=${bins.tmux}`,
    `--git=${bins.git}`,
    `--model=${probe.model}`,
    ...dirs.map((d) => `--plugin-dir=${d}`),
    ...probe.steps.map((s) => `--step=${s}`),
  ]
}

/** The text answered when the script exits non-zero: its error stream, else its output. */
export const failureText = (exitCode: number, stderr: string, stdout: string): string =>
  `the probe failed (exit ${exitCode}): ${stderr.trim() || stdout.trim()}`

/** The text the tool and the command answer once the run has started; the report arrives later as the next message. */
export const startedText = (probe: Probe): string =>
  `started: ${probe.steps.length} step(s) with ${probe.plugins.join(', ')} on ${probe.model}; the report arrives as the next message when the probe ends`

export const TOOL_DESCRIPTION = [
  'Run a live check of Claude Code plugins in a fresh session: a new git repository in the system temp directory, tmux, only the given plugin directories loaded, and the steps typed into the prompt one after another, each once the one before has finished.',
  'The call answers at once with the start line; the report arrives later as the next message: the final text of the pane, the transcript of the session (prompts, replies, tool calls, command output, the context hooks added) and the list of what was deleted afterwards: the temp directory, its transcripts and the inline store files the probe wrote.',
  'A probe takes about 15 seconds to start and then as long as its steps; it stops at 10 minutes. Do not wait for it: it arrives on its own.',
].join(' ')

export const INPUT_SCHEMA = {
  type: 'object',
  properties: {
    plugins: { type: 'array', items: { type: 'string' }, description: 'Plugins to load: a name under the repository\'s plugins/ directory, or a path.' },
    steps: { type: 'array', items: { type: 'string' }, description: 'The prompts and slash commands to type, in order. Each is one line.' },
    model: { type: 'string', description: `The probe session's model, ${DEFAULT_MODEL} by default.` },
  },
  required: ['plugins', 'steps'],
}

export const COMMAND_DESCRIPTION = 'Live check of plugins in a fresh tmux session: --model, plugins, steps joined by ;; (probe-runner)'
export const COMMAND_ARGUMENT_HINT = '[--model <m>] <plugin,...> <step> ;; <step>'
