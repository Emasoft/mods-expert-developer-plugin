// mod-manager's calls out of the plugin: claude, resolved through hooks/resolve-bin.ts (never PATH, the
// Desktop app does not inherit it), and the hooks file of each installed plugin. Every decision about
// what the answers mean is in ./logic.ts.
import type { EngineInterface } from 'claude-code'

import { resolveBin } from '../resolve-bin'
import { type Action, type Installed, type Row, actionArgv, classifyHooks, parseInstalled } from './logic'

const LIST_TIMEOUT_MS = 60_000
const ACTION_TIMEOUT_MS = 120_000

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error))
const lastLine = (text: string): string => text.trim().split('\n').at(-1) ?? ''

/** Every installed entry of every scope, as `claude plugin list --json` lists them. Rejects with claude's own message. */
export async function listInstalled($: EngineInterface): Promise<Installed[]> {
  const claude = await resolveBin($, 'claude')
  const result = await $.process.run([claude, 'plugin', 'list', '--json'], { timeoutMs: LIST_TIMEOUT_MS })
  if (result.exitCode !== 0) throw new Error(lastLine(result.stderr) || `claude plugin list exited ${result.exitCode}`)
  return parseInstalled(result.stdout)
}

/**
 * Whether the plugin installed at `installPath` is a mod. A missing or unreadable hooks file is not a mod,
 * and a malformed one is not either; the reason goes to the debug log so the pane stays quiet.
 */
export async function isMod($: EngineInterface, installPath: string): Promise<boolean> {
  const hooksPath = `${installPath}/hooks/hooks.json`
  let text: string
  try {
    text = await $.fs.read(hooksPath)
  } catch (error) {
    $.ui.log(`mod-manager: ${hooksPath} is not readable, so the plugin is not counted as a mod: ${messageOf(error)}`, { to: 'debug' })
    return false
  }
  const verdict = classifyHooks(text)
  if (verdict.problem !== undefined) $.ui.log(`mod-manager: ${hooksPath} is not counted as a mod: ${verdict.problem}`, { to: 'debug' })
  return verdict.isMod
}

/**
 * Runs one action through claude and rejects with claude's own last line when it fails. A project or local
 * install is changed from the folder it was made in, because the CLI resolves those scopes from there.
 */
export async function runAction($: EngineInterface, row: Row, action: Action): Promise<void> {
  const claude = await resolveBin($, 'claude')
  const cwd = row.scope === 'user' ? undefined : row.projectPath
  const result = await $.process.run(actionArgv(claude, action, row), {
    timeoutMs: ACTION_TIMEOUT_MS,
    ...(cwd === undefined ? {} : { cwd }),
  })
  if (result.exitCode !== 0) throw new Error(lastLine(result.stderr) || lastLine(result.stdout) || `exit ${result.exitCode}`)
}
