// Increment 2k of TRDD-R2QYIN8O, auto-update (owner question 10, verbatim choice "Auto-update allowed"; option text:
// "Off-by-default switch plus per-plugin opt-in, then no question per update."): the store keys, the rules that pick what an
// automatic update may run, and its texts. Pure. The rest of 2k is kept apart, so TRDD-5IK59SQ2 can switch it off: the
// timer (register.ts), the flows (state.ts, after copyAddRequest, and the readAutoView call in readList) and the switch,
// Auto and Review elements (pane.ts) each name 2k.
//
// The rules the M4b addendum sets for it: an update runs on its own only while the switch is on and that plugin has opted
// in; the switch is off by default; every automatic update leaves a visible record naming the plugin, the old and new
// versions and the time (a toast, a transcript line and the pane's list, AUTO_LOG_KEY); an update whose marketplace-declared
// command is new, or has changed, does not run: it pauses and the pane asks the person. The pane checks the row's own
// catalog entry itself before it calls claude (blockReason; coordinator review of M4b, finding 1): an entry that declares a
// command, a command source or an archive's headersHelper, pauses the row whatever the command is, and no sha256 needs
// keeping. Nor does an opt-in outlive its marketplace being added again from another source (finding 5): it keeps the
// source it was made under. claude's own refusal is the layer for what the pane does not read (a dependency's entry, a
// catalog claude refreshes itself), measured from a shell on 2.1.318 in a scratch HOME (M4b): with no terminal, an update
// whose own entry turned into a command source exits 1 with failureCode command_source_refused and a shownCommand with its
// sha256, and does not run it (-y is ignored inside a session, and the pane never passes it); an update whose new version
// depends on a command-source plugin installs neither that plugin nor its command, goes ahead, and leaves the plugin with
// a dependency-unsatisfied error, which the check reads back and pauses on (brokenReason). Every claude call runs through
// $.process.run, which no permission mode or rule is documented to gate (cli.ts; types, $.process), so the switch, the
// opt-in, the pane's check and the pause are the safeguards.
import { type Latest, type Row, type Scope, actionArgv, actionCwd, actionsFor, oneLine, printable, rowKey, updatableHere } from './logic'
import { type ShownCommand, shownOf } from './results'

/**
 * The store keys: the opted-in rows, the paused rows, and the lease that lets one session run a check. The switch is in
 * the registry of every mod's functions (./switches.ts, AUTO_UPDATE). The opt-ins and the pauses are stored signed
 * (A1, TRDD-5IK59SQ2; readSigned and writeSigned in ../switches/register.ts).
 */
export const AUTO_OPT_INS_KEY = 'mm-auto-update-plugins'
export const AUTO_PAUSES_KEY = 'mm-auto-update-paused'
export const AUTO_LEASE_KEY = 'mm-auto-update-lease'

/** The first check runs two minutes after the session starts, then one every hour. */
export const AUTO_START_MS = 120_000
export const AUTO_PERIOD_MS = 3_600_000
/** Another session's lease younger than this keeps a check from running: the period less a minute, so a late check runs. */
export const AUTO_LEASE_MS = AUTO_PERIOD_MS - 60_000
/** How long a check waits after it writes its lease before it reads it back, so two checks that start together run once. */
export const AUTO_SETTLE_MS = 2_000

/**
 * The key an opt-in and a pause are kept under. A project or local install belongs to its folder, so its key adds the
 * folder: an opt-in made in one project never covers the same plugin installed for another.
 */
export function optInKey(row: { id: string; scope: Scope; projectPath: string | undefined }): string {
  return row.scope === 'project' || row.scope === 'local' ? `${rowKey(row)}|${row.projectPath ?? ''}` : rowKey(row)
}

/**
 * The opted-in keys the store holds, each with the source its marketplace had at the opt-in (logic.ts sourceKey), so a
 * marketplace added again under the same name from another source does not inherit the opt-in (blockReason). Anything but
 * an object of strings is no opt-in at all, so nothing runs. The value read is the one this plugin signed: an opt-in written
 * outside the plugin is no opt-in either (state.ts, readAutoSettings), since an opt-in lets an update run with no question.
 */
export function optInsOf(value: unknown): Map<string, string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return new Map()
  return new Map(Object.entries(value).filter((pair): pair is [string, string] => typeof pair[1] === 'string'))
}

/** The store key of the records of automatic updates and pauses the pane draws, newest last, and how many it keeps. */
export const AUTO_LOG_KEY = 'mm-auto-update-log'
export const AUTO_LOG_SIZE = 10

/** The records the store holds: the last AUTO_LOG_SIZE strings of a list; anything else is none. */
export function recordsOf(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((line): line is string => typeof line === 'string').slice(-AUTO_LOG_SIZE) : []
}

/** Why a row's automatic updates stopped, and the command claude showed, when it showed one for this plugin. */
export type Pause = { reason: string; shown: ShownCommand | undefined }

/**
 * The paused keys the store holds. A key whose record cannot be read stays paused, with a reason that says so: a record
 * that was damaged never lets automatic updates run again. A pause written outside the plugin (A1: the map unsigned or
 * garbled, `outside`) is kept for its reason, since a pause only stops updates, but never for its shown command: Review
 * then offers no line that accepts a command the plugin did not see claude show (review of d783048). A row whose pause
 * was removed meets every check again (blockReason, the shown command).
 */
export function pausesOf(value: unknown, outside: boolean): Map<string, Pause> {
  const pauses = new Map<string, Pause>()
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return pauses
  for (const [key, record] of Object.entries(value)) {
    const reason = typeof record === 'object' && record !== null ? (record as Record<string, unknown>).reason : undefined
    pauses.set(
      key,
      typeof reason === 'string'
        ? { reason, shown: outside ? undefined : shownOf((record as Record<string, unknown>).shown) }
        : { reason: 'its pause record could not be read.', shown: undefined },
    )
  }
  return pauses
}

/**
 * The record of one pause as the plugin writes it: the reason on one line, printable and capped (oneLine,
 * PAUSE_REASON_MAX), and the command claude showed, when it showed one for this plugin. Every record the plugin writes is
 * made here, its own pause (writePause, state.ts) and each one read from a map written outside (pauseRecordsToSign), so a
 * stored reason is never longer than its note shows and holds no line break (M4c item 2). A record of a signed map written
 * before this cap is kept as it was until its own row is written again; the note and Review show it through oneLine.
 */
export function pauseRecordOf(pause: Pause): { reason: string; shown?: ShownCommand } {
  const reason = oneLine(pause.reason, PAUSE_REASON_MAX)
  return pause.shown === undefined ? { reason } : { reason, shown: pause.shown }
}

/**
 * The records a pause write signs: the stored ones as they are or, when the map was written outside the plugin, each
 * record as the plugin itself would write it (pauseRecordOf), its reason only, so signing a map read from outside never
 * turns a forged command, or any other field, into one the plugin vouches for; a record whose reason cannot be read is
 * kept paused with the reason pausesOf gives it (review of 067ec02). The reason is stored on one line and capped, so the
 * map read from outside is stored normalized from its first write (M4c item 2).
 */
export function pauseRecordsToSign(value: unknown, outside: boolean): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {}
  if (!outside) return { ...(value as Record<string, unknown>) }
  const records: Record<string, unknown> = {}
  for (const [key, pause] of pausesOf(value, true)) records[key] = pauseRecordOf(pause)
  return records
}

/** The rows that can opt in: those whose scope offers Update (actionsFor), which are the rows the pane can update. */
export function canAutoUpdate(row: { id: string; scope: Scope; enabled: boolean }): boolean {
  return actionsFor(row, true).includes('update')
}

/**
 * The rows a check updates: opted in, not paused, able to opt in, and with an update the pane can run (updatableHere: an
 * arrow from the marketplace's local copy, and no headers helper to accept).
 */
export function autoTargets(rows: readonly Row[], latest: ReadonlyMap<string, Latest>, optIns: ReadonlyMap<string, string>, pauses: ReadonlyMap<string, Pause>): Row[] {
  return rows.filter((row) => optIns.has(optInKey(row)) && !pauses.has(optInKey(row)) && canAutoUpdate(row) && updatableHere(row, latest.get(row.id)))
}

/**
 * Why a check pauses an opted-in row before claude is called, or undefined (2k, coordinator review of M4b, findings 1 and
 * 5). Its own catalog entry declares a command (CatalogEntry declares): such a row is never a target today (a command
 * source has no version, a headers helper makes updatableHere false), so this pause makes that visible and keeps it so if
 * those rules change; the pane reads the marketplace's local copy, and a dependency's entry is not read here, so claude's
 * own refusal (measured from a shell) stays the layer for those. Or its marketplace's source is not the one kept with the
 * opt-in. A marketplace the list does not name, or a list that could not be read, gives no reason: its rows then have no
 * known latest version, so nothing runs for them (autoTargets).
 */
export function blockReason(row: Row, recorded: string | undefined, current: string | undefined, declares: boolean): string | undefined {
  if (declares) return 'its catalog entry declares a command claude would run for it (a command source or a headers helper), and an automatic update never runs one. Update it in your own terminal, or opt it out to stop these pauses.'
  if (recorded !== undefined && current !== undefined && recorded !== current)
    return printable(`its marketplace ${row.marketplace} now comes from another source than when you opted it in, so the opt-in does not cover it. Opt it out and in again to cover the new source.`)
  return undefined
}

/**
 * A lease another session took less than AUTO_LEASE_MS ago; any other value, or none, lets this session take it. A lease
 * dated after now (a clock moved back) is stale too, so no lease can hold for ever (2k review).
 */
export function leaseHeldByOther(value: unknown, session: string, now: number): boolean {
  if (typeof value !== 'object' || value === null) return false
  const { session: holder, at } = value as Record<string, unknown>
  return typeof holder === 'string' && holder !== session && typeof at === 'number' && now - at >= 0 && now - at < AUTO_LEASE_MS
}

/** The answers that turn the switch on and opt a row in; any other answer, or none, changes nothing. */
export const AUTO_ON_LABEL = 'Turn auto-update on'
export const OPT_IN_LABEL = 'Update it automatically'
export const RESUME_LABEL = 'Resume auto-update'

/** What the switch question says: everything an opt-in then allows with no question per update. */
export const SWITCH_QUESTION =
  'Turn on automatic updates? While it is on, every hour, the first open terminal session to check updates each plugin you opted in (Auto on its row) ' +
  "when its marketplace's local copy lists a newer version and its row offers Update, with no question per update; a toast, a transcript line and " +
  "the pane's list of recent automatic updates name each update, its old and new versions and the time. The check does not refresh the local copy: " +
  'Claude Code refreshes it when it updates its marketplaces, or run claude plugin marketplace update. A plugin whose catalog entry declares a command ' +
  '(a command source or a headers helper), or whose marketplace was added again from another source since you opted it in, pauses before claude ' +
  'runs. If claude still shows a command for an update, it is not run: without a terminal claude refuses one it has not accepted (measured from a shell on ' +
  '2.1.318), and the update pauses until you review it in the pane. A dependency built by a command is not installed: the update goes ahead, and the ' +
  'plugin then reports the missing dependency, and pauses. A failed update pauses too. Turning it off asks nothing.'

/**
 * The argument vector of an automatic update: the one a pressed Update runs (actionArgv), with --json, so its result is
 * read from its fields (results.ts). One source for the run (state.ts autoUpdateRow) and the opt-in question that shows it.
 */
export function autoUpdateArgv(claude: string, row: { id: string; scope: Scope }): string[] {
  return [...actionArgv(claude, 'update', row), '--json']
}

/**
 * What an opt-in question says about one row, and whether the switch is still off. It shows the argv each automatic update
 * runs (autoUpdateArgv), with claude as the name the person knows, as installQuestion does (the run uses the claude that
 * resolveBin finds), and, for a project or local row, the folder it runs in (actionCwd). It is shown once, here: the store
 * keeps the opt-in and its marketplace source, not the argv, and Review and Resume do not show it again.
 */
export function optInQuestion(row: Row, switchOn: boolean): string {
  const folder = actionCwd(row)
  return printable(
    `Update ${row.name} (${row.scope} scope) automatically? While auto-update is on, each newer version its marketplace's local copy lists is ` +
      "installed with no question when its row offers Update, and a toast, a transcript line and the pane's list of recent automatic updates name " +
      `it. Each update runs ${JSON.stringify(autoUpdateArgv('claude', row))}${folder === undefined ? '' : ` in ${folder}`}, with no shell and no -y. ` +
      'A plugin whose latest version is unknown, or whose update needs your own terminal, is never updated automatically. If its catalog entry ' +
      'declares a command (a command source or a headers helper), or its marketplace is added again from another source, it pauses before claude ' +
      'runs. If claude still shows a command for an update, it is not run (measured from a shell on 2.1.318), and the update pauses until you review it here. A ' +
      'dependency built by a command is not installed: the plugin then reports it missing, and pauses. A failed update pauses it too. The opt-in stays if you ' +
      'uninstall the plugin, and covers it again if you reinstall it from the same marketplace source.' +
      (switchOn ? '' : ' Auto-update is off: nothing runs until you turn it on.'),
  )
}

/**
 * Why an opt-in was not made: the session has no terminal to run claude in, or claude's marketplace list could not be read
 * or does not name the row's marketplace, so no source can be kept with it (finding 5).
 */
export const notOptedInText = (row: Row, why: string): string =>
  printable(`${row.name} (${row.scope} scope) was not opted in: ${why}, so the source of its marketplace cannot be kept with the opt-in.`)

/** Why a row paused after an update that worked: claude lists an error for it, such as a dependency it did not install. */
export const brokenReason = (errors: readonly string[]): string => printable(`it was updated, but claude now lists an error for it: ${errors.join(' ')}`)

/** The record of an automatic update: the plugin, its scope, the old and new versions claude reported, and the time. */
export function autoUpdatedText(row: Row, oldVersion: string | undefined, newVersion: string | undefined, at: number): string {
  return printable(
    `auto-update: ${row.id} (${row.scope} scope) updated from ${oldVersion ?? 'an unknown version'} to ${newVersion ?? 'an unknown version'} at ${new Date(at).toISOString()}. ` +
      'It loads in your next session.',
  )
}

/** Why a row paused when claude showed a command: for this plugin, or for another one (a dependency, for example). */
export function shownReason(row: Row, shown: ShownCommand): string {
  return shown.pluginId === row.id
    ? `its marketplace declares a command that is new or changed: ${shown.command} (sha256 ${shown.sha256}). It was not run.`
    : `claude showed a command declared for ${shown.pluginId}, another plugin: ${shown.command} (sha256 ${shown.sha256}). It was not run.`
}

/** The toast and transcript line of a pause. */
export function autoPausedText(row: Row, reason: string): string {
  return printable(`auto-update of ${row.id} (${row.scope} scope) paused: ${reason} Review it in the mods-manager pane.`)
}

/**
 * The most a pause's reason shows of itself, in its note and in Review's question, and the most it is stored with
 * (pauseRecordOf, M4c item 2): a reason can quote claude's error or be read from a map written outside the plugin, so it
 * is shown and stored on one line, printable and capped (oneLine; review of d623b53), as a mod's notice is.
 */
export const PAUSE_REASON_MAX = 300

/** The note under a paused row. */
export function pausedNote(pause: Pause): string {
  return `Auto-update paused: ${oneLine(pause.reason, PAUSE_REASON_MAX)}`
}

/**
 * The question of Review: why the row paused, the line that accepts a command shown for this plugin, when there is one, and
 * what Resume does. Resume runs nothing itself: the next check tries the row again, and pauses it again while the reason holds
 * (a command claude refuses, a declared command, a changed source, a failure).
 */
export function reviewQuestion(row: Row, pause: Pause, line: string | undefined): string {
  return printable(
    `Auto-update of ${row.name} (${row.scope} scope) is paused: ${oneLine(pause.reason, PAUSE_REASON_MAX)}` +
      (line === undefined ? '' : ` To accept exactly this command, run in your own terminal, outside Claude Code: ${line} Or accept it from the plugin's details pane in /plugin.`) +
      ' Resume lets the next hourly check try it again; if the reason above still holds, it pauses again.',
  )
}

/** The toasts of the switch and of an opt-in, and the message when the store refused a write. */
export const autoOnText = 'Auto-update is on: plugins you opted in are checked every hour.'
export const autoOffText = 'Auto-update is off: nothing is updated on its own.'
/** What the pane says of opt-ins or pauses stored without this plugin's signature (A1, TRDD-5IK59SQ2; state.ts readAutoSettings). */
export const optInsOutsideText = 'The auto-update opt-ins were changed outside the plugin, so none of them applies: opt each plugin in again with Auto.'
// Kept until the next change of the pauses, not until each is reviewed: writePause (state.ts) saves the whole map, the
// pauses read outside included, at the next Resume, opt-out or pause a check adds (review of 34f5c20). Each such row
// still shows Review. A pause read from outside keeps its reason but not the command it names (pausesOf,
// pauseRecordsToSign; review of d783048).
export const pausesOutsideText =
  'The auto-update pauses were changed outside the plugin. Each pause read is kept for its reason, without any command it names, and its row offers Review; the next Resume, opt-out or pause a check adds saves them all as the plugin\'s own, and this notice goes.'
export const optedInText = (row: Row): string => printable(`${row.name} (${row.scope} scope) is updated automatically while auto-update is on, whenever its row offers Update.`)
export const optedOutText = (row: Row): string => printable(`${row.name} (${row.scope} scope) is no longer updated automatically.`)
export const resumedText = (row: Row): string => printable(`Auto-update of ${row.name} (${row.scope} scope) resumed: the next hourly check updates it again.`)
export const autoSaveFailedText = (reason: string): string => printable(`The auto-update setting could not be saved: ${reason}`)

/** The busy line while a check updates one row. */
export const autoUpdatingText = (row: Row): string => printable(`updating ${row.name} automatically…`)

/** Why a row paused when claude showed a command of a shape the pane cannot read: claude's own message, and where to see it. */
export const unreadableReason = (row: Row, message: string): string =>
  `${message} The command its marketplace declares could not be read here: run claude plugin update ${row.id} in your own terminal to see it.`
