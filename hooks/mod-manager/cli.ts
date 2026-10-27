// mod-manager's calls out of the plugin: claude, resolved through hooks/resolve-bin.ts (never PATH, the
// Desktop app does not inherit it), and the hooks file of each installed plugin. Every decision about
// what the answers mean is in ./logic.ts.
import type { EngineInterface } from 'claude-code'

import { resolveBin } from '../resolve-bin'
import { type Action, type Installed, type Row, DEFAULT_HOOKS_FILE, actionArgv, classifyHooks, hookFilesOf, parseInstalled } from './logic'

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
 * Whether the plugin installed at `installPath` is a mod: its manifest declares inline hooks that list modules, or a
 * hooks file it checks does. The files checked are hooks/hooks.json and each file the manifest declares under `hooks`.
 * A missing default hooks file is normal and goes to the debug log. A declared file that is missing, unreadable or not
 * JSON goes to the default log, because the manifest promised it, and the other files are still checked.
 */
export async function isMod($: EngineInterface, installPath: string): Promise<boolean> {
  const manifestPath = `${installPath}/.claude-plugin/plugin.json`
  let manifest: string | undefined
  try {
    manifest = await $.fs.read(manifestPath)
  } catch (error) {
    $.ui.log(`mod-manager: ${manifestPath} is not readable, so only ${DEFAULT_HOOKS_FILE} is checked: ${messageOf(error)}`, { to: 'debug' })
  }
  const declared = hookFilesOf(manifest)
  if (declared.problem !== undefined) $.ui.log(`mod-manager: ${manifestPath} is ${declared.problem}, so only ${DEFAULT_HOOKS_FILE} is checked`)
  for (const item of declared.rejected) $.ui.log(`mod-manager: ${manifestPath} declares "${item}", which is absolute or has "..", so it is skipped`)
  let mod = declared.inlineIsMod
  for (const relative of declared.paths) {
    const hooksPath = `${installPath}/${relative}`
    const level = relative === DEFAULT_HOOKS_FILE ? { to: 'debug' as const } : undefined
    let text: string
    try {
      text = await $.fs.read(hooksPath)
    } catch (error) {
      $.ui.log(`mod-manager: ${hooksPath} is not readable, so it is not counted as a mod: ${messageOf(error)}`, level)
      continue
    }
    const verdict = classifyHooks(text)
    if (verdict.problem !== undefined) $.ui.log(`mod-manager: ${hooksPath} is not counted as a mod: ${verdict.problem}`, level)
    if (verdict.isMod) mod = true
  }
  return mod
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
