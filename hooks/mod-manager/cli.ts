// mod-manager's calls out of the plugin: claude, resolved through hooks/resolve-bin.ts (never PATH, the
// Desktop app does not inherit it), the hooks file of each installed plugin, the catalog (and, for a relative-path
// entry, the plugin.json) of each marketplace with an installed row, the plugin.json the details view reads, the
// marketplace.json of a folder the person adds and the add itself (2j), and the program that opens a folder or a link
// (OPENERS), and the --json runs of claude plugin install <id> and claude plugin update <id> (runJson, with the argv of
// installArgv and autoUpdateArgv: 2f Install, 2k auto-update).
// Every decision about what the answers mean is in ./logic.ts and ./results.ts.
import type { EngineInterface } from 'claude-code'

import { maskedLog } from '../debug-log/register'
import { resolveBin } from '../resolve-bin'
import { type CliResult, parseCliResult } from './results'
import {
  type About,
  type Action,
  type CatalogEntry,
  type InstalledList,
  type Marketplace,
  type OpenTarget,
  type Row,
  DEFAULT_HOOKS_FILE,
  OPENERS,
  aboutOf,
  aboutPath,
  actionArgv,
  actionCwd,
  addArgv,
  catalogPath,
  classifyHooks,
  hookFilesOf,
  manifestPath,
  manifestVersionOf,
  marketplaceNameOf,
  openerArgv,
  parseCatalog,
  parseInstalled,
  parseMarketplaces,
} from './logic'

const LIST_TIMEOUT_MS = 60_000
const ACTION_TIMEOUT_MS = 120_000
// open and xdg-open hand the target to another program and exit; one still running after this is taken as failed.
const OPEN_TIMEOUT_MS = 10_000

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error))
const lastLine = (text: string): string => text.trim().split('\n').at(-1) ?? ''

/**
 * Every entry of every scope, as `claude plugin list --json` lists them, and each entry it could not read (see
 * parseInstalled). Rejects with claude's own message.
 */
export async function listInstalled($: EngineInterface): Promise<InstalledList> {
  const claude = await resolveBin($, 'claude')
  const result = await $.process.run([claude, 'plugin', 'list', '--json'], { timeoutMs: LIST_TIMEOUT_MS })
  if (result.exitCode !== 0) throw new Error(lastLine(result.stderr) || `claude plugin list exited ${result.exitCode}`)
  return parseInstalled(result.stdout)
}

/**
 * The marketplaces claude knows, from `claude plugin marketplace list --json` (see parseMarketplaces). The argument vector
 * is fixed, so no marketplace name or path ever reaches claude. Rejects with claude's own message.
 */
export async function listMarketplaces($: EngineInterface): Promise<Marketplace[]> {
  const claude = await resolveBin($, 'claude')
  const result = await $.process.run([claude, 'plugin', 'marketplace', 'list', '--json'], { timeoutMs: LIST_TIMEOUT_MS })
  // stdout when stderr is empty, as runAction does, so an error claude prints on stdout is still named (2d review F7).
  if (result.exitCode !== 0) throw new Error(lastLine(result.stderr) || lastLine(result.stdout) || `claude plugin marketplace list exited ${result.exitCode}`)
  return parseMarketplaces(result.stdout)
}

/**
 * The catalog of a marketplace, read from its local copy (see catalogPath and parseCatalog). Rejects when it cannot be read or parsed.
 *
 * Size: $.fs.read rejects a file over 4 MiB (generated types, .claude-plugin/types/claude-code/index.d.ts lines 3353 to
 * 3361). claude-community's catalog, the one with the most entries on the machine measured (2283), was 1,566,074 bytes on
 * 2026-11-04, about 37 percent of that cap, so a catalog is read whole in one call. One over the cap rejects here like any
 * unreadable one, and its caller turns that into a failed listing (state.ts readLatest and readListing), never into a
 * partial catalog (TRDD-R2QYIN8O, 2f-R1 (6)).
 */
export async function readCatalog($: EngineInterface, installLocation: string): Promise<Map<string, CatalogEntry>> {
  return parseCatalog(await $.fs.read(catalogPath(installLocation)))
}

/**
 * The name a marketplace folder's marketplace.json declares (2j, marketplaceNameOf), read before any add. catalogPath
 * refuses a folder that is not absolute or has a ".." segment, so such a folder is never read. Rejects when the file
 * cannot be read or declares no name the pane accepts.
 */
export async function readMarketplaceName($: EngineInterface, folder: string): Promise<string> {
  return marketplaceNameOf(await $.fs.read(catalogPath(folder)))
}

/**
 * Adds a marketplace folder (2j) by running the argv addArgv builds, never through a shell and never with -y.
 * Resolves to its exit code and what it printed, stdout then stderr, failed or not: the caller compares the marketplace list
 * before and after it either way, since a failed add may still have changed it (TRDD-R2QYIN8O, M2 review point 4).
 */
export async function addMarketplace($: EngineInterface, folder: string): Promise<{ exitCode: number; output: string }> {
  const claude = await resolveBin($, 'claude')
  const result = await $.process.run(addArgv(claude, folder), { timeoutMs: ACTION_TIMEOUT_MS })
  return { exitCode: result.exitCode, output: `${result.stdout}\n${result.stderr}` }
}

/**
 * The version declared by the plugin.json in `folder` of a marketplace's local copy, or undefined when there is no such
 * file or it declares none (an empty one is none). A plugin.json that exists but cannot be read, is not JSON, or has a
 * version that is not a string rejects: its version could be the latest, so it is never taken as missing.
 */
export async function readManifestVersion($: EngineInterface, installLocation: string, folder: string): Promise<string | undefined> {
  const path = manifestPath(installLocation, folder)
  if (!(await $.fs.exists(path))) return undefined
  return manifestVersionOf(await $.fs.read(path))
}

/**
 * Whether the plugin whose files are in `folder` (modFolder: its readFromFolder when it loads in place, else its
 * installPath) is a mod: its manifest declares inline hooks that list modules, or a hooks file it checks does. The
 * files checked are hooks/hooks.json and each file the manifest declares under `hooks`. A missing default hooks file is
 * normal and goes to the debug log. A declared file that is missing, unreadable or not JSON goes to the default log,
 * because the manifest promised it, and the other files are still checked.
 */
export async function isMod($: EngineInterface, folder: string): Promise<boolean> {
  const manifestPath = `${folder}/.claude-plugin/plugin.json`
  let manifest: string | undefined
  try {
    manifest = await $.fs.read(manifestPath)
  } catch (error) {
    maskedLog($, `mods-manager: ${manifestPath} is not readable, so only ${DEFAULT_HOOKS_FILE} is checked: ${messageOf(error)}`, { to: 'debug' })
  }
  const declared = hookFilesOf(manifest)
  // The path and the problem are text from outside the mod, so the line goes through maskedLog (masked, one line, printable).
  if (declared.problem !== undefined) maskedLog($, `mods-manager: ${manifestPath} is ${declared.problem}, so only ${DEFAULT_HOOKS_FILE} is checked`)
  // The item is text from the manifest, so the line goes through maskedLog.
  for (const item of declared.rejected) maskedLog($, `mods-manager: ${manifestPath} declares "${item}", which is absolute or has "..", so it is skipped`)
  let mod = declared.inlineIsMod
  for (const relative of declared.paths) {
    const hooksPath = `${folder}/${relative}`
    const level = relative === DEFAULT_HOOKS_FILE ? { to: 'debug' as const } : undefined
    let text: string
    try {
      text = await $.fs.read(hooksPath)
    } catch (error) {
      // The path and the error text come from outside the mod, so the line goes through maskedLog.
      maskedLog($, `mods-manager: ${hooksPath} is not readable, so it is not counted as a mod: ${messageOf(error)}`, level)
      continue
    }
    const verdict = classifyHooks(text)
    // The hooks path and the problem text come from outside the mod, so the line goes through maskedLog.
    if (verdict.problem !== undefined) maskedLog($, `mods-manager: ${hooksPath} is not counted as a mod: ${verdict.problem}`, level)
    if (verdict.isMod) mod = true
  }
  return mod
}

/**
 * Runs one action through claude, in the folder actionCwd names. Resolves to what claude printed, stdout then stderr,
 * because an update that found nothing newer still exits 0 and only its words say so (updateOutcomeOf); rejects with
 * claude's own last line when it fails.
 */
export async function runAction($: EngineInterface, row: Row, action: Action): Promise<string> {
  const claude = await resolveBin($, 'claude')
  const cwd = actionCwd(row)
  const result = await $.process.run(actionArgv(claude, action, row), {
    timeoutMs: ACTION_TIMEOUT_MS,
    ...(cwd === undefined ? {} : { cwd }),
  })
  if (result.exitCode !== 0) throw new Error(lastLine(result.stderr) || lastLine(result.stdout) || `exit ${result.exitCode}`)
  return `${result.stdout}\n${result.stderr}`
}

/**
 * How long an install from the pane, or an automatic update (2k), may run: either may clone a git source, so longer than an
 * action; $.process.run allows ten minutes at most.
 */
export const INSTALL_TIMEOUT_MS = 300_000

/**
 * Runs a claude plugin command with --json (2f Install, 2k auto-update) and resolves to its result on any exit code, since
 * a refused command still prints a result line, with exit 1 (results.ts). Rejects only when there is no result line it can
 * read, with claude's own last line, as runAction does. The argument vector is built from the resolved claude path by
 * `argvOf` (installArgv, or autoUpdateArgv for an update), which checks what it puts in it; never a shell and never -y. `cwd`
 * is the folder an update of a project or local install runs in (actionCwd), as runAction gives it.
 */
export async function runJson($: EngineInterface, argvOf: (claude: string) => string[], timeoutMs: number, cwd?: string): Promise<CliResult> {
  const claude = await resolveBin($, 'claude')
  const result = await $.process.run(argvOf(claude), { timeoutMs, ...(cwd === undefined ? {} : { cwd }) })
  try {
    return parseCliResult(result.stdout, result.exitCode)
  } catch {
    throw new Error(lastLine(result.stderr) || lastLine(result.stdout) || `exit ${result.exitCode}`)
  }
}

/**
 * The display fields of the plugin.json in `folder` (aboutPath), read when the details view opens (TRDD-R2QYIN8O, 2i).
 * A folder with no plugin.json has none, so the answer is {}. One that exists but cannot be read or is not JSON rejects,
 * so the view says why it shows only the catalog entry's fields.
 */
export async function readAbout($: EngineInterface, folder: string): Promise<About> {
  const path = aboutPath(folder)
  if (!(await $.fs.exists(path))) return {}
  return aboutOf(await $.fs.read(path))
}

/** How an attempt to open a folder or a link ended: the program opened it, or it did not, with why. No program means no failures. */
export type OpenOutcome = { opened: true } | { opened: false; failures: string[] }

/**
 * Opens `target` with the one program of OPENERS that this system has (2i): the first whose `requires` path exists, and no
 * other. Its answer is the attempt's answer: a non-zero exit, a program that cannot start, or one still running after
 * OPEN_TIMEOUT_MS (where $.process.run rejects) is a failure. With no such path, as on Windows, nothing runs and there are no
 * failures.
 */
export async function openOnHost($: EngineInterface, target: OpenTarget): Promise<OpenOutcome> {
  for (const opener of OPENERS) {
    if (!(await $.fs.exists(opener.requires))) continue
    // Returns after this one program, success or failure: a second program on this system would be the wrong one (see OPENERS).
    try {
      const result = await $.process.run(openerArgv(opener.program, target), { timeoutMs: OPEN_TIMEOUT_MS })
      if (result.exitCode === 0) return { opened: true }
      const said = lastLine(result.stderr) || lastLine(result.stdout)
      return { opened: false, failures: [`${opener.program} exited ${result.exitCode}${said === '' ? '' : `: ${said}`}`] }
    } catch (error) {
      return { opened: false, failures: [`${opener.program} did not finish: ${messageOf(error)}`] }
    }
  }
  return { opened: false, failures: [] }
}
