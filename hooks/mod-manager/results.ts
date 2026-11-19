// The JSON result of a claude plugin command run with --json, and what the pane says about a command a marketplace
// declares (TRDD-R2QYIN8O: 2f Install, 2k auto-update). Pure: no engine call, so a test drives each rule with plain text.
//
// The pane never accepts a declared command. Measured on Claude Code 2.1.318, in a scratch home folder, from a shell
// inside a Claude Code session: -y and --accept-command <sha256> are both ignored there ("--accept-command is ignored inside
// a Claude Code session: run this in your own terminal to accept the command shown above"), the result is failed with
// acceptCommandMatched true, and the command does not run. A child of the pane's $.process.run carries a session variable
// too (CLAUDE_CODE_ENTRYPOINT, measured with a scratch mod), and which variable claude keys on was not measured; the pane does
// not try either way, because the plugin commands chapter ("Accept a displayed install command") says to accept it "from
// your own terminal", and passing the flag, or a changed environment, from the pane would work around that safeguard. So a
// shown command ends in a line for the person's own terminal, with the sha256 claude reported, and nothing else.
import { PLUGIN_ID, printable } from './logic'

/**
 * A command a marketplace declares for an install or an update (a command source, or the headersHelper of an archive), as
 * a failed --json result shows it in `shownCommand` (plugin commands chapter, "Accept a displayed install command"): the
 * plugin it belongs to, the command as displayed and its sha256. Measured shape on 2.1.318: kind, pluginId, command, mode,
 * catalogRevision, sha256, and acceptCommandMatched when a sha256 was passed.
 */
export type ShownCommand = { pluginId: string; command: string; sha256: string }

/**
 * What a --json run answered. `ok` is true only for outcome ok with exit 0 (the chapter: "same exit codes"), so a result
 * that says ok with another exit is a failure. `shown` is the declared command when the result shows one this pane can read;
 * `shownUnreadable` is true when the result has a shownCommand of another shape, which the pane names and never builds a
 * line from. An update adds updateOutcome (updated or up_to_date) and the old and new versions (measured on 2.1.318).
 */
export type CliResult = {
  ok: boolean
  message: string
  failureCode: string | undefined
  shown: ShownCommand | undefined
  shownUnreadable: boolean
  updateOutcome: string | undefined
  oldVersion: string | undefined
  newVersion: string | undefined
}

/** A sha256 as claude prints it: 64 lowercase hex digits (measured on 2.1.318). */
const SHA256 = /^[0-9a-f]{64}$/
const textOf = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined)

/** A shownCommand this pane can show and build a line from, or undefined for any other shape. */
export function shownOf(value: unknown): ShownCommand | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const { pluginId, command, sha256 } = value as Record<string, unknown>
  if (typeof pluginId !== 'string' || !PLUGIN_ID.test(pluginId)) return undefined
  if (typeof command !== 'string' || typeof sha256 !== 'string' || !SHA256.test(sha256)) return undefined
  return { pluginId, command, sha256 }
}

/**
 * Reads the result of a claude plugin command run with --json: the last line of stdout, "because Claude Code prints any
 * command the marketplace declares ahead of it" (plugin commands chapter, "JSON result format"). Throws when that line is
 * missing or is not an object with an outcome of ok or failed and a message: the caller then names claude's own last line.
 */
export function parseCliResult(stdout: string, exitCode: number): CliResult {
  const line = stdout.trim().split('\n').at(-1) ?? ''
  const data: unknown = JSON.parse(line)
  if (typeof data !== 'object' || data === null) throw new Error('its last line is not a JSON object')
  const fields = data as Record<string, unknown>
  const { outcome, message } = fields
  if ((outcome !== 'ok' && outcome !== 'failed') || typeof message !== 'string') throw new Error('its last line has no outcome and message')
  const shown = shownOf(fields.shownCommand)
  return {
    ok: outcome === 'ok' && exitCode === 0,
    message,
    failureCode: textOf(fields.failureCode),
    shown,
    shownUnreadable: fields.shownCommand !== undefined && shown === undefined,
    updateOutcome: textOf(fields.updateOutcome),
    oldVersion: textOf(fields.oldVersion),
    newVersion: textOf(fields.newVersion),
  }
}

/** The scopes a line for the person's terminal may name: those --scope takes for install and update (plugin commands chapter). */
const LINE_SCOPES: readonly string[] = ['user', 'project', 'local', 'managed']

/**
 * The line that accepts exactly the shown command, for the person to run in their own terminal, outside Claude Code:
 * claude plugin <install|update> <id> --scope <scope> --accept-command <sha256> (claude plugin install --help and update
 * --help on 2.1.318). Every part is checked again, so the line holds only a-z, 0-9, '.', '_', '-', '@' and spaces, which
 * no shell treats as special, and it is written bare, as installLine is (2f-R1 (7)).
 */
export function acceptLine(verb: 'install' | 'update', id: string, scope: string, sha256: string): string {
  if (!PLUGIN_ID.test(id)) throw new Error(`refused: "${id}" is not a plugin id (name@marketplace)`)
  if (!LINE_SCOPES.includes(scope)) throw new Error(`refused: "${scope}" is not a scope --scope takes`)
  if (!SHA256.test(sha256)) throw new Error('refused: the sha256 is not 64 hex digits')
  return `claude plugin ${verb} ${id} --scope ${scope} --accept-command ${sha256}`
}

/**
 * What the pane says about a shown command: that it was not run, the command and its sha256 as claude showed them, why the
 * pane does not accept it, and the two places the person can: the line for their own terminal, or the plugin's details pane
 * in /plugin (claude's own message names both). The command is the marketplace author's text, so all of it goes through
 * printable.
 */
export function shownText(shown: ShownCommand, line: string): string {
  return printable(
    `The marketplace of ${shown.pluginId} declares a command that runs for it, and it was not run: ${shown.command} (sha256 ${shown.sha256}). ` +
      `The pane does not accept it: Claude Code ignored -y and --accept-command when they were tried from a shell inside a session. To accept exactly this command, run in your own terminal, outside Claude Code: ${line} ` +
      'Or accept it from the plugin\'s details pane in /plugin.',
  )
}

/** The answer that copies the line; any other answer, or none, copies nothing. */
export const COPY_LINE_LABEL = 'Copy the line'

/**
 * The question that offers the line: the whole shownText, so the person reads the command and its sha256 in the question
 * itself, and what accepting means: a command source runs when the plugin is installed or updated, and again once per
 * session (marketplace manifest chapter, "command" source).
 */
export function copyLineQuestion(shown: ShownCommand, line: string): string {
  return `${shownText(shown, line)} Once accepted, a command source runs again at each update and once per session. Copy that line to your clipboard?`
}

/** The toast once the line was copied. */
export const copiedAcceptText = (line: string): string => printable(`Copied. Run it in your own terminal, outside Claude Code: ${line}`)

/** The pane's message when the copy failed: it names the line, so the person can still read it. */
export const notCopiedAcceptText = (line: string, reason: string): string =>
  printable(`The line could not be copied (${reason.split('\n')[0] ?? ''}): ${line}`)

/** The message when a result has a shownCommand this pane cannot read: claude's own message, and where to see the command. */
export function unreadableShownText(verb: 'install' | 'update', id: string, message: string): string {
  return printable(`${message} The command its marketplace declares could not be read here, so it was not shown: run claude plugin ${verb} ${id} in your own terminal to see it.`)
}
