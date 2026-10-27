// probe-runner (TRDD-03IIDGPP, increment 1): thin wiring of ./logic.ts to the engine. Every decision is a
// function in logic.ts. The tool and the command sit behind the dev-tools gate (../dev-tools.ts), and
// every external program is resolved to an absolute path by ../resolve-bin.ts.
import type { EngineInterface, On } from 'claude-code'

import { DEV_TOOLS_OFF, isDevToolsOn } from '../dev-tools'
import { resolveBin } from '../resolve-bin'
import { SEND_COMMAND } from '../self-command/logic'
import {
  COMMAND_ARGUMENT_HINT,
  COMMAND_DESCRIPTION,
  INPUT_SCHEMA,
  PROBE_MS,
  TOOL_DESCRIPTION,
  TOOL_NAME,
  failureText,
  manifestMissing,
  parseArgs,
  pluginDir,
  probeOf,
  scriptArgv,
  startedText,
  type Probe,
  type ProbeBins,
} from './logic'

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error))

/** The plugin directories, each checked for its manifest; a string names the first one missing. */
async function pluginDirs($: EngineInterface, probe: Probe): Promise<string[] | string> {
  const cwd = await $.session.cwd()
  const root = await $.session.root()
  const home = (await $.env.get('HOME')) ?? ''
  const rootIsPlugin = await $.fs.exists(`${root}/.claude-plugin/plugin.json`)
  const dirs = probe.plugins.map((p) => pluginDir(p, root, cwd, home, rootIsPlugin))
  for (const dir of dirs) {
    if (!(await $.fs.exists(`${dir}/.claude-plugin/plugin.json`))) return manifestMissing(dir)
  }
  return dirs
}

/**
 * Runs one probe and answers its report, or why it did not run. A program that is not installed
 * throws from resolveBin, naming every place it looked; a run past its timeout throws from process.run.
 */
async function runProbe($: EngineInterface, probe: Probe): Promise<string> {
  const dirs = await pluginDirs($, probe)
  if (typeof dirs === 'string') return dirs
  const bins: ProbeBins = { python: await resolveBin($, 'python3'), claude: await resolveBin($, 'claude'), tmux: await resolveBin($, 'tmux'), git: await resolveBin($, 'git') }
  const r = await $.process.run(scriptArgv(bins, `${$.plugin.root}/scripts/probe.py`, probe, dirs), { timeoutMs: PROBE_MS })
  return r.exitCode === 0 ? r.stdout : failureText(r.exitCode, r.stderr, r.stdout)
}

/**
 * The probe runs from a timer, not from the command's own hook: the engine rejects a command run from a
 * hook the turn waits on. Its report reaches the model only through the send command, the one path every
 * report takes; a failed send is logged and toasted, because the model would otherwise wait for it.
 */
function runInBackground($: EngineInterface, probe: Probe): void {
  $.clock.after(0, async () => {
    const report = await runProbe($, probe).catch((error: unknown) => `the probe did not finish: ${messageOf(error)}`)
    try {
      await $.command.run({ command: SEND_COMMAND, args: report })
    } catch (error) {
      $.ui.log(`probe-runner: the report could not be sent to the model: ${messageOf(error)}`)
      $.ui.toast(`The probe report did not reach the model: ${messageOf(error)}`)
    }
  })
}

/** A gating hook that failed (a missing program, a run past its timeout, the store refused) refuses the call, saying why. */
const failClosed = (error: { message?: string; kind: string }): { deny: string } => ({
  deny: `${TOOL_NAME} failed: ${error.message || error.kind}`,
})

/**
 * Called once per session.start by hooks/index.ts. The tool and the command register only while the gate
 * is on: a tool added mid-session would change the cached tool list. isDeferred false lists the tool at once.
 */
export async function startProbeRunner($: EngineInterface): Promise<void> {
  if (!(await isDevToolsOn($))) return
  await $.tool.register({ name: TOOL_NAME, description: TOOL_DESCRIPTION, inputSchema: INPUT_SCHEMA, isDeferred: false })
  // Literal name, as in dev-tools.ts, so claude plugin validate can pair it with its hook. Registered
  // last: a taken command name throws.
  await $.command.register({ name: 'probe-runner', description: COMMAND_DESCRIPTION, argumentHint: COMMAND_ARGUMENT_HINT })
}

export function registerProbeRunner(on: On): void {
  // A RegExp literal, not a string: the matcher's string form takes only built-in tool names, and a
  // literal is what claude plugin validate can read. The name is mcp__<plugin>__<tool>.
  on('tool.call', { tool: /^mcp__mods-expert-developer-plugin__probe$/ }, async ($, e) => {
    if (!(await isDevToolsOn($))) return { deny: DEV_TOOLS_OFF }
    const probe = probeOf(e as unknown as Record<string, unknown>)
    if (typeof probe === 'string') return { deny: probe }
    return { result: await runProbe($, probe) }
  }).catch(async ($, e, next) => failClosed(next.error))

  // Literal name, as in dev-tools.ts and startProbeRunner.
  on('command.run', { command: 'probe-runner' }, async ($, e) => {
    if (!(await isDevToolsOn($))) return { text: DEV_TOOLS_OFF }
    const probe = parseArgs(String(e.args ?? ''))
    if (typeof probe === 'string') return { text: probe }
    runInBackground($, probe)
    return { text: startedText(probe) }
  }).catch(async ($, e, next) => ({ text: `probe-runner failed: ${next.error.message || next.error.kind}` }))
}
