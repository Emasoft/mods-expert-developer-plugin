// The debug log of the integrated mods (TRDD-RWD5PW76, PRRD G14.1). Each mod sends the lines it raises (its errors and
// warnings) through logEvent instead of $.ui.log: the line is masked, goes where the mod sent it before, and, while
// the mod's debug-log switch is on, is added to the mod's own file in this plugin's data folder (B5), never in the
// project or the working folder. Decisions are in ./logic.ts.
import type { EngineInterface } from 'claude-code'

import { configFolder, homeFolder } from '../mod-manager/files'
import { oneLine } from '../mod-manager/logic'
import { isOn } from '../switches/register'
import { DEBUG_LOG_CAP, appendedFiles, cleanMasked, dataFolderId, isAbsolutePath, logLine, logPathOf, maskForLog } from './logic'

// The home folder, read once at the session start: a line is masked at once, in the order the mod raised it, so the
// masking must not wait on a read. Before the start has read it, or when neither HOME nor USERPROFILE is set, the other
// home patterns still mask a standard home.
let knownHome: string | undefined

/** Called by hooks/index.ts at session.start, before the mods start, so their start failures are masked too. */
export async function startDebugLog($: EngineInterface): Promise<void> {
  knownHome = await homeFolder($)
}

type LogOptions = Parameters<EngineInterface['ui']['log']>[1]

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error))

/**
 * A masked $.ui.log line that no file receives: the plugin's own lines that belong to no mod (a failed start of the
 * switches), and a mod's line built from what the debug log must not hold, such as a tool input or a command's output.
 * It goes to the transcript, so it is masked and then put on one line and made printable (cleanMasked), here for every
 * caller: a line break in an error or a name from outside would otherwise start a second line that reads as the
 * transcript's own, a forged log line (M4c item 1).
 */
export function maskedLog($: EngineInterface, text: string, options?: LogOptions): void {
  sendLog($, cleanMasked(text, knownHome), options)
}

/**
 * Text from outside masked with the home folder the session start read, for a toast or a line of a pane, where it is
 * neither logged nor made printable here: the caller does that, after the mask (TRDD-5IK59SQ2, review of 5f3fb42).
 * A home the start could not read (neither HOME nor USERPROFILE set) is unknown here, as for maskedLog and logEvent: the
 * generic patterns still mask a home under /Users, /home or a Windows Users folder, its name up to the first white space or
 * quote, and a home anywhere else, or the rest of a name after a space, is shown as it is. The same accepted degradation
 * as the switches' notice line (42d988d).
 */
export function maskedText(text: string): string {
  return maskForLog(text, knownHome)
}

/** The most code points a toast or a pane line of outside text keeps (maskedLine). */
export const SHOWN_MAX = 300

/**
 * Text from outside for a toast or a line of a pane (item 3 sweep, G3): masked (maskedText), then on one line, printable
 * and cut to SHOWN_MAX code points (oneLine), so it shows neither the home folder nor a secret, and draws no second line,
 * no control and no direction mark. Masking first, so a cut never leaves part of a secret the mask no longer recognises.
 */
export function maskedLine(text: string): string {
  return oneLine(maskedText(text), SHOWN_MAX)
}

function sendLog($: EngineInterface, masked: string, options: LogOptions | undefined): void {
  if (options === undefined) $.ui.log(masked)
  else $.ui.log(masked, options)
}

// The last write queued for each mod's file. A line is added by reading the file and writing it again ($.fs has no
// append), so two events raised close together would both read the file before either wrote, and the second write
// would drop the first line, or bring back a file the first had just rotated (review of 9d4ca09). Each write waits
// for the one before it, whatever that one's outcome. Two sessions can still write the same file at once.
const queued = new Map<string, Promise<void>>()

/**
 * One event a mod raised: masked, sent where the mod sent it on one printable line, and added to the mod's file when its
 * switch is on. The file is written after this returns, so the caller is never held; a write that fails says so in the
 * debug log and is not retried. `mod` must define its `<mod>.debug-log` switch (debugLogSwitch).
 */
export function logEvent($: EngineInterface, mod: string, text: string, options?: LogOptions): void {
  const masked = maskForLog(text, knownHome)
  // The copy for $.ui.log is put on one line and made printable too (cleanMasked), as maskedLog's is: a break or a
  // control in an error from outside would otherwise forge a line in the transcript (item 3 sweep, G1). The file keeps
  // the line's own breaks, indented (logLine).
  sendLog($, cleanMasked(text, knownHome), options)
  const write = (): Promise<void> => appendToLog($, mod, masked)
  // write runs after a rejected predecessor too: that one rejects only when $.ui.log threw while it reported its own
  // failure, and then nothing is left to report with; stopping the queue would end the log for the session instead.
  const next = (queued.get(mod) ?? Promise.resolve()).then(write, write).catch((error: unknown) => {
    $.ui.log(cleanMasked(`${mod}: the debug log could not be written: ${messageOf(error)}`, knownHome), { to: 'debug' })
  })
  queued.set(mod, next)
}

/**
 * Adds one line to <config>/plugins/data/<id>/debug/<mod>.log, moving the file to <mod>.log.1 when it would pass the
 * cap. A configuration folder that is not absolute is refused: it would put the file under the working folder.
 */
async function appendToLog($: EngineInterface, mod: string, masked: string): Promise<void> {
  if (!(await isOn($, `${mod}.debug-log`))) return
  const config = await configFolder($)
  // The value is not named in the message: it comes from the environment, whose values a log never holds.
  if (!isAbsolutePath(config)) throw new Error('the configuration folder is not an absolute path, so nothing is written')
  const path = logPathOf(config, dataFolderId($.plugin.name, $.plugin.root), mod)
  const current = (await $.fs.exists(path)) ? await $.fs.read(path) : undefined
  const next = appendedFiles(current, logLine(new Date(await $.clock.now()).toISOString(), mod, masked), DEBUG_LOG_CAP)
  if (next.rotate !== undefined) await $.fs.write(`${path}.1`, next.rotate)
  await $.fs.write(path, next.write)
}
