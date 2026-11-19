// mod-manager's session state and the flows that change it: reading the installed plugins, reading the profiles file for
// the profile list (TRDD-GSR975M8, P2a), reading in the background the
// latest version their marketplaces offer (and setting the status-line badge from it), an action the person confirmed,
// Update all, Reload, the details view with its Open folder and Open homepage, and (2f) the plugins a catalog lists that
// are not installed, read on demand for a marketplace with none installed, with Copy install line and Install, and (2j) a marketplace
// folder added from the pane after a check and a confirmation, with Copy request for a remote source. The state is module
// memory per session, as self-command keeps its pane; a reload empties it, and the fresh copy reads the list again when the
// pane is still open (register.ts), else at the next open.
import type { EngineInterface, RenderSurface } from 'claude-code'

import { INSTALL_TIMEOUT_MS, type OpenOutcome, addMarketplace, isMod, listInstalled, listMarketplaces, openOnHost, readAbout, readCatalog, readManifestVersion, readMarketplaceName, runAction, runJson } from './cli'
import {
  AUTO_LEASE_KEY,
  AUTO_LOG_KEY,
  AUTO_LOG_SIZE,
  AUTO_ON_LABEL,
  AUTO_OPT_INS_KEY,
  AUTO_PAUSES_KEY,
  AUTO_SETTLE_MS,
  OPT_IN_LABEL,
  type Pause,
  RESUME_LABEL,
  SWITCH_QUESTION,
  autoOffText,
  autoOnText,
  autoPausedText,
  autoTargets,
  autoUpdateArgv,
  autoUpdatedText,
  autoUpdatingText,
  blockReason,
  brokenReason,
  autoSaveFailedText,
  canAutoUpdate,
  leaseHeldByOther,
  notOptedInText,
  optInKey,
  optInQuestion,
  optInsOf,
  optedInText,
  optedOutText,
  pauseRecordOf,
  pauseRecordsToSign,
  pausesOf,
  recordsOf,
  resumedText,
  reviewQuestion,
  shownReason,
  unreadableReason,
} from './auto-update'
import { INSTALL_LABEL, installArgv, installFailedText, installQuestion, installedText, installingText, otherPluginText } from './install'
import { COPY_LINE_LABEL, type CliResult, acceptLine, copiedAcceptText, copyLineQuestion, notCopiedAcceptText, shownText, unreadableShownText } from './results'
import { engineIo, homeFolder, profilesPlace, readProfiles } from './files'
import { isOn, readSigned, setSwitch, writeSigned } from '../switches/register'
import { AUTO_UPDATE, FN, MOD_MANAGER_FUNCTIONS, offText } from './switches'
import { maskedLog, maskedText } from '../debug-log/register'
import { setStatusLine } from '../status-line'
import {
  type About,
  type Action,
  ADD_LABEL,
  type AddDecision,
  type CatalogEntry,
  type ChangePath,
  type Details,
  ENABLED_KEY,
  KEEP,
  type Latest,
  type Listing,
  type Marketplace,
  type ProfileView,
  READING,
  RELOAD_COMMAND,
  type Rejected,
  type Row,
  UNKNOWN,
  UPDATE_ALL_LABEL,
  type UpdateReport,
  aboutPath,
  actionCwd,
  addDecision,
  addDecisionText,
  addFailedText,
  addQuestion,
  appliesHere,
  askThenRun,
  badgeText,
  catalogProblem,
  catalogListing,
  catalogTargets,
  changedLine,
  changedSources,
  changePath,
  classifyAddSource,
  confirmLabel,
  confirmThenRun,
  copiedLineText,
  copiedRequestText,
  copiedText,
  currentText,
  doneText,
  findAvailable,
  forcesOpen,
  installLine,
  installRequest,
  installedIdsOf,
  isMarketplaceName,
  isOnDemand,
  keepsDetails,
  latestOf,
  manifestFolder,
  manifestProblem,
  marketplacesProblem,
  modFolder,
  notCopiedLineText,
  notCopiedRequestText,
  notCopiedText,
  oneLine,
  openTargetOf,
  openableFolder,
  openedText,
  orderRows,
  printable,
  sourceKey,
  questionFor,
  rejectedText,
  reloadAnswerText,
  reloadFailedText,
  remoteText,
  renamedSinceText,
  reportOf,
  rowKey,
  toRow,
  updateAllQuestion,
  updateCount,
  updateEach,
  updateLine,
  updateOutcomeOf,
  updateTargets,
} from './logic'

/**
 * The switch of auto-update, the opted-in keys with their sources, the paused ones (2k; optInKey) and the records, as the
 * store held them at the last read; and whether the opt-ins or the pauses were found written outside the plugin (A1).
 */
export type AutoView = {
  on: boolean
  optIns: ReadonlyMap<string, string>
  pauses: ReadonlyMap<string, Pause>
  records: readonly string[]
  optInsOutside: boolean
  pausesOutside: boolean
}

/**
 * `expanded` holds the keys of the open sections: the Enabled section starts open, every marketplace section starts
 * closed. `rejected` holds each entry of the list that could not be read; the pane names the first few.
 * `latest` holds the latest version of each row a catalog covers, by plugin id, and is undefined until the current read
 * of the catalogs ends; `latestProblems` holds one line for each marketplace file that read could not read; `latestRun`
 * numbers the reads, so a read that a newer one replaced drops its answer. `updateReport` holds what the last Update all
 * did; it is its own field, not `message`, because every refresh (a press of Refresh, or the pane opened again) clears
 * `message`, and it is cleared only when the next change starts. `details` is the open details view, when the pane shows
 * one in place of the list (2i), and `catalogAbout` holds, by plugin id, the display fields of each catalog entry that
 * sets one, from the same read of the catalogs as `latest`. `latestRead` is true once a read of the catalogs has ended, and
 * stays true while a later read runs (which clears `latest`), so the details view can say that a read is under way again.
 * For 2f, `localMarketplaces` holds the marketplaces with a local copy whose name a section may carry, from the last read
 * of the catalogs; `listings` holds, by marketplace, each catalog listing so far: those that read reads, for marketplaces
 * with installed rows, and those read when a section of a marketplace with none is opened; `listingRun` numbers the
 * Refreshes and opens of the pane, which drop every listing, so an on-demand read that one replaced drops its answer; and
 * `installedIds` holds every id the list holds, in any scope, so no plugin installed anywhere is offered as not installed.
 * `refusedLogged` holds each marketplace and catalog name already named in the debug log as not shown (2f-R1 (4)), so each
 * is logged once per session, not on every read of the catalogs; no Refresh clears it. `addSource` is the text of the add
 * field (2j), kept so a redraw shows it again, and set by the command's add form (2l), also on a surface that draws no
 * field; `addRemote` is the remote source the last check of it found, whose request Copy request copies, and is undefined
 * after any other check and once the field holds other text (setAddSource).
 * `profiles` is what the profile list shows, `profilesShown` whether it is open (it starts closed: see INITIAL),
 * and `changePath` how this session can change plugins, unknown until the first read. `auto` is what the pane draws of
 * auto-update (2k), read from the store (readAutoView): it is off, with no opt-in and no pause, until the first read.
 */
export type ModState = {
  loaded: boolean
  rows: Row[]
  rejected: readonly Rejected[]
  busy: string | undefined
  message: string
  needsRestart: boolean
  expanded: ReadonlySet<string>
  filter: string
  latest: ReadonlyMap<string, Latest> | undefined
  readingLatest: boolean
  latestRead: boolean
  latestProblems: readonly string[]
  latestRun: number
  updateReport: UpdateReport | undefined
  details: Details | undefined
  catalogAbout: ReadonlyMap<string, About> | undefined
  localMarketplaces: readonly { name: string; installLocation: string }[]
  listings: ReadonlyMap<string, Listing>
  listingRun: number
  installedIds: ReadonlySet<string>
  refusedLogged: ReadonlySet<string>
  addSource: string
  addRemote: string | undefined
  profiles: ProfileView
  profilesShown: boolean
  changePath: ChangePath | undefined
  auto: AutoView
}
const INITIAL: ModState = {
  loaded: false,
  rows: [],
  rejected: [],
  busy: undefined,
  message: '',
  needsRestart: false,
  expanded: new Set([ENABLED_KEY]),
  filter: '',
  latest: undefined,
  readingLatest: false,
  latestRead: false,
  latestProblems: [],
  latestRun: 0,
  updateReport: undefined,
  details: undefined,
  catalogAbout: undefined,
  localMarketplaces: [],
  listings: new Map(),
  listingRun: 0,
  installedIds: new Set(),
  refusedLogged: new Set(),
  addSource: '',
  addRemote: undefined,
  profiles: { kind: 'reading' },
  // Closed at first, below the plugin rows, so the pane looks as it did until the person opens the list (review of
  // 2026-10-31, should-fix 3: open, a long list would push the plugin rows off the screen).
  profilesShown: false,
  changePath: undefined,
  auto: { on: false, optIns: new Map(), pauses: new Map(), records: [], optInsOutside: false, pausesOutside: false },
}
const stateBySession = new Map<string, ModState>()

/** Asks the person a question with the given labels; resolves to the label picked, rejects when dismissed. */
export type Ask = (question: string, options: readonly string[]) => Promise<string>

/**
 * The engine's own question, which the pane's press handler passes to confirmAndAct. The parameter is a seam,
 * not a mock of the engine: a test passes its own answer function, and the confirm code that runs is the same.
 */
export function engineAsk($: EngineInterface): Ask {
  return (question, options) => $.ui.ask(question, options)
}

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error))

/** Read-only: a render never creates an entry. */
export function stateIn(session: string): ModState {
  return stateBySession.get(session) ?? INITIAL
}

async function update($: EngineInterface, patch: Partial<ModState>): Promise<void> {
  const session = await $.session.id()
  stateBySession.set(session, { ...stateIn(session), ...patch })
  $.ui.invalidate('ui.render')
}

/** Sets a patch at once, with no await between the read of the state and the write, so no other change can land between them. */
function setNow($: EngineInterface, session: string, patch: Partial<ModState>): void {
  stateBySession.set(session, { ...stateIn(session), ...patch })
  $.ui.invalidate('ui.render')
}

/** One catalog as a read of the catalogs met it: read, or the error that kept it from being read. */
type CatalogOutcome = { ok: true; catalog: Map<string, CatalogEntry> } | { ok: false; error: unknown }

/** What a read of the catalogs found (readCatalogs). */
type CatalogRead = {
  targets: Map<string, Map<string, string>>
  latest: Map<string, Latest>
  entryFields: Map<string, About>
  local: { name: string; installLocation: string }[]
  problems: string[]
  /** 2k: the ids whose own catalog entry declares a command (CatalogEntry declares), and each listed marketplace's source as sourceKey gives it. */
  declaring: Set<string>
  sources: Map<string, string>
}

/**
 * The read of the catalogs that readLatest and the auto-update check (2k) share: the marketplace list once, then the catalog
 * of each marketplace with a row catalogTargets keeps, and, for a relative-path entry, that plugin's plugin.json, whose
 * version wins over the entry's (latestOf). It writes no state and never throws: each failure becomes one line of
 * `problems` and a debug-log line. `onCatalog` hears of each catalog in the order the read meets it, read or failed,
 * before the plugin.json files of its rows are read (readLatest builds the 2f listings there). It also keeps the display
 * fields of each catalog entry that sets one (2i) and the marketplaces with a local copy whose name a section may carry
 * (2f). The catalog of a marketplace with no row here is not read. The marketplace list is asked even when no row has a
 * catalog.
 */
async function readCatalogs($: EngineInterface, rows: readonly Row[], onCatalog: (name: string, outcome: CatalogOutcome) => void = () => undefined): Promise<CatalogRead> {
  const targets = catalogTargets(rows)
  const latest = new Map<string, Latest>()
  const entryFields = new Map<string, About>()
  const local: { name: string; installLocation: string }[] = []
  // Every row a catalog covers is unknown until its catalog gives a version.
  for (const ids of targets.values()) for (const id of ids.keys()) latest.set(id, UNKNOWN)
  const problems: string[] = []
  const declaring = new Set<string>()
  const sources = new Map<string, string>()
  const failed = (line: string, what: string, error: unknown): void => {
    problems.push(line)
    maskedLog($, `mods-manager: ${what} could not be read: ${messageOf(error)}`, { to: 'debug' })
  }
  try {
    // Asked even with no installed row (2f): every marketplace with a local copy gets a section, its catalog read on demand.
    const marketplaces = await listMarketplaces($)
    for (const { name, installLocation, source } of marketplaces) {
      // 2k: kept for every marketplace the list names, a hosted one too, so a check can compare it with an opt-in's.
      sources.set(name, sourceKey(source))
      const ids = targets.get(name)
      if (installLocation === undefined) {
        // A marketplace hosted on claude.ai has no local copy (plugin commands chapter): its rows stay unknown, and its
        // plugins are not listed (2f), by design. The name is from the marketplace list, so the line goes through maskedLog.
        maskedLog($, `mods-manager: ${name} has no local copy, so its plugins are not listed and the latest versions of its installed plugins are unknown`, { to: 'debug' })
        continue
      }
      if (isMarketplaceName(name)) local.push({ name, installLocation })
      else maskedLog($, `mods-manager: the marketplace name "${name}" is not a lowercase name, so it gets no section of its own`, { to: 'debug' })
      // Only a marketplace with a row here has its catalog read: any other is read when its section is opened.
      if (ids === undefined) continue
      let catalog: Map<string, CatalogEntry>
      try {
        catalog = await readCatalog($, installLocation)
      } catch (error) {
        failed(catalogProblem(name, messageOf(error)), `the catalog of ${name}`, error)
        onCatalog(name, { ok: false, error })
        continue
      }
      onCatalog(name, { ok: true, catalog })
      for (const [id, pluginName] of ids) {
        const entry = catalog.get(pluginName)
        // The entry's display fields (2i), kept before its plugin.json is read, so a plugin.json that fails keeps them.
        if (entry?.about !== undefined) entryFields.set(id, entry.about)
        if (entry?.declares === true) declaring.add(id)
        const folder = manifestFolder(entry)
        let manifestVersion: string | undefined
        if (folder !== undefined) {
          try {
            manifestVersion = await readManifestVersion($, installLocation, folder)
          } catch (error) {
            failed(manifestProblem(id, messageOf(error)), `the plugin.json of ${id}`, error)
            continue
          }
        }
        latest.set(id, latestOf(entry, manifestVersion))
      }
    }
  } catch (error) {
    failed(marketplacesProblem(messageOf(error)), 'the marketplace list', error)
  }
  return { targets, latest, entryFields, local, problems, declaring, sources }
}

/**
 * Reads, in the background, the latest version each row's marketplace offers (TRDD-R2QYIN8O, 2d), through readCatalogs, and
 * shows what it found. It never claims `busy`, so a press still works while it runs, and it never throws: the rows stay as
 * they are. A read that a newer one replaced drops its answer, so an older read that ends last cannot overwrite it. It
 * keeps the display fields of each catalog entry that sets one (catalogAbout), which the details view shows (2i), and (2f)
 * the plugins each catalog it reads lists (listings) and the marketplaces with a local copy (localMarketplaces). The
 * catalog of a marketplace with no installed row is not read here, so the pane's open reads none of those: it is read
 * when the person opens its section (toggleSection).
 */
async function readLatest($: EngineInterface, rows: readonly Row[]): Promise<void> {
  const session = await $.session.id()
  // Numbered with no await before the write, so two reads started together never share a number.
  const run = stateIn(session).latestRun + 1
  setNow($, session, { latestRun: run, readingLatest: true, latest: undefined, latestProblems: [] })
  // 2f: the listing of each catalog this read reads, for the section of its marketplace. A failed one replaces the earlier
  // listing of that marketplace, not keeps it (2f-R1 (3)); a section with installed rows draws no note for it (catalogNote
  // speaks only for a section read on demand): the line above the rows (catalogProblem) already names the problem.
  const listings = new Map<string, Listing>()
  const { targets, latest, entryFields, local, problems } = await readCatalogs($, rows, (name, outcome) => {
    listings.set(name, outcome.ok ? listingOf($, session, name, outcome.catalog) : { kind: 'failed', reason: messageOf(outcome.error) })
  })
  // The badge's switches (TRDD-5IK59SQ2, C6b), read where the badge is set and before the check below, so no await falls
  // between them and the badge: off, the line is cleared. The catalogs' switch is read here again, not only where the read
  // of the list started: turned off while this read ran, its follower cleared the line, and this read must not set it
  // again with what the catalogs said (review of 1e29e89).
  const badgeOn = (await functionReadsOn($, FN.badge)) && (await functionReadsOn($, FN.latest))
  // A newer read started while this one ran: its answer is the one the pane shows.
  if (stateIn(session).latestRun !== run) return
  // latestRead is set when a read ends and never cleared when a read starts (latest is), so a later read can tell that an earlier one ended.
  // 2f-R1 (3): this read's listings replace every earlier one, except the listing of a marketplace still in this read's
  // list that this read did not read: one read on demand, or being read, meanwhile or before. A marketplace that left the
  // list, or whose catalog this read read, keeps no earlier listing, so no stale catalog is drawn after a failed read or
  // a removed marketplace.
  const kept = [...stateIn(session).listings].filter(([name]) => local.some((marketplace) => marketplace.name === name) && !targets.has(name))
  const listingsNow = new Map([...kept, ...listings])
  setNow($, session, { latest, readingLatest: false, latestRead: true, latestProblems: problems, catalogAbout: entryFields, localMarketplaces: local, listings: listingsNow })
  // The status-line badge (2h), set only here: after the read this pane shows, so a replaced read never sets it, and never
  // at the read's start, so the line does not blink off while a read runs. A read whose marketplace list failed knows no
  // latest version, so it clears the line: it claims nothing it cannot back. $.ui.status is one line per plugin (types,
  // $.ui.status: "One per plugin"), so every writer composes its segment through ./status-line: Tokensaver reports on the
  // same line from this release on (TRDD-71KVH9PA, T2).
  setStatusLine($, 'mods-manager', badgeOn ? badgeText(updateCount(rows, latest)) : undefined)
}

/**
 * Expands the section with this key, or collapses it again. Row data is untouched; only the redraw changes. Opening the
 * section of a marketplace with no installed row (isOnDemand) also reads its catalog, once, until the next Refresh (2f);
 * a read that failed is read again at the next press that opens the section (2f-R1 (2)).
 */
export async function toggleSection($: EngineInterface, key: string): Promise<void> {
  const session = await $.session.id()
  const state = stateIn(session)
  const forced = forcesOpen(state.filter)
  // A press that opens the section, or one while the filter forces it open, which draws it unread, starts the read; a
  // listing already there, read or being read, starts none. A failed one does: kept, it would leave the section saying
  // its catalog could not be read until a Refresh, though the file may be readable again (TRDD-R2QYIN8O, 2f-R1 (2)).
  // Only for a section read on demand (isOnDemand, below): a section with installed rows can hold a failed listing too,
  // from the read of the latest versions (readLatest), and its catalog is read again only by that read, never by a press.
  if ((forced || !state.expanded.has(key)) && (!state.listings.has(key) || state.listings.get(key)?.kind === 'failed')) {
    const marketplace = state.localMarketplaces.find((local) => local.name === key)
    const names = state.localMarketplaces.map((local) => local.name)
    // The catalogs' switch is read again here, where the read runs (TRDD-5IK59SQ2, C6b): off, the section opens unread.
    if (marketplace !== undefined && isOnDemand(key, names, state.rows) && (await functionReadsOn($, FN.latest))) void readOnDemand($, session, marketplace)
  }
  // While the filter forces the sections open they are drawn open whatever the stored set says, so a toggle would
  // change state the person cannot see (and would surprise them once the filter is cleared): the press does nothing more.
  if (forced) return
  const expanded = new Set(stateIn(session).expanded)
  if (!expanded.delete(key)) expanded.add(key)
  await update($, { expanded })
}

/** Keeps what the person typed in the filter field, so a redraw shows it again. It only redraws; it never calls claude. */
export async function setFilter($: EngineInterface, filter: string): Promise<void> {
  await update($, { filter })
}

/** Shows the profile list, or hides it again. Only the redraw changes; nothing is read or written. */
export async function toggleProfiles($: EngineInterface): Promise<void> {
  const state = stateIn(await $.session.id())
  await update($, { profilesShown: !state.profilesShown })
}

/**
 * Marks the session busy with `busy`, synchronously, so two presses cannot both pass the check. Returns the
 * text of what is still running when the claim is refused, or undefined when this call holds the claim.
 */
function claim(session: string, busy: string, patch: Partial<ModState> = {}): string | undefined {
  const state = stateIn(session)
  if (state.busy !== undefined) return state.busy
  stateBySession.set(session, { ...state, busy, message: '', ...patch })
  return undefined
}

/**
 * Shows a toast through printable, so no toast of this mod can carry a control character, whatever it names: a busy text,
 * a plugin name, a path or a link (TRDD-R2QYIN8O, 2i follow-up (a)). Every toast of the mod goes through here; the texts
 * that also show a name through printable themselves (doneText, currentText) keep doing so, since printable is idempotent.
 */
function toast($: EngineInterface, text: string): void {
  $.ui.toast(printable(text))
}

// The busy text can name a row, text from the list; the toast helper shows the whole text through printable.
const refusedToast = (running: string): string => `Wait: ${running} is still running. Nothing was changed.`

/**
 * True, after a toast naming what still runs, when the session is busy: a press is then refused before any question is
 * asked, and nothing is read or run. Read and acted on with no await between, as claim is.
 */
function refusedWhileBusy($: EngineInterface, session: string): boolean {
  const running = stateIn(session).busy
  if (running === undefined) return false
  toast($, refusedToast(running))
  return true
}

/** The longest reason a switch read's error gives in a toast or a line of the pane, in code points (oneLine). */
const SWITCH_REASON_MAX = 200

/**
 * Why a switch could not be read, as a toast or a line of the pane shows it: the error's text is outside text, so its home
 * path is masked first (maskedText, with the home the session start read), and then it is made one printable line, capped,
 * in the order cleanMasked keeps: a collapse or a cut before the mask could break a home path the mask must find (review
 * of 5f3fb42).
 */
const switchReadReason = (error: unknown): string => oneLine(maskedText(messageOf(error)), SWITCH_REASON_MAX)

/**
 * Whether a function of the pane reads on, where it runs with nobody pressing: the start's reread of a pane left open,
 * the read of the catalogs, the badge. A switch that cannot be read counts as off, the safe side: the function does not
 * run, and why goes to the debug log, masked (maskedLog), since nothing here shows a toast.
 */
export async function functionReadsOn($: EngineInterface, id: string): Promise<boolean> {
  try {
    return await isOn($, id)
  } catch (error) {
    maskedLog($, `mods-manager: the switch ${id} could not be read, so its function does not run: ${messageOf(error)}`, { to: 'debug' })
    return false
  }
}

/**
 * Clears the status-line badge when its switch, or the catalogs' switch it counts from, is turned off in this session
 * (../switch-followers.ts), so the line claims nothing a function that is off would back. A pane of another session
 * clears it at its next read of the list.
 */
export function followBadgeSwitch($: EngineInterface, on: boolean): void {
  if (!on) setStatusLine($, 'mods-manager', undefined)
}

/**
 * The state a drawing shows while the catalogs' switch reads off: no latest version, no catalog line, no listing and no
 * marketplace known from a catalog, whatever an earlier read left, so nothing a catalog said is drawn (TRDD-5IK59SQ2, C6b).
 */
export function withoutCatalogs(state: ModState): ModState {
  return { ...state, latest: undefined, readingLatest: false, latestRead: false, latestProblems: [], catalogAbout: undefined, localMarketplaces: [], listings: new Map() }
}

/** What a drawing of the pane reads of its switches: the functions that read off, and why one could not be read, if any. */
export type FunctionsRead = { off: ReadonlySet<string>; unreadable: string | undefined }

/**
 * Reads the switch of every function of the pane through the registry, at each drawing (TRDD-5IK59SQ2, C6b). No copy is
 * kept: the store is the one source, so an off written in any session shows at this pane's next drawing (orchestrator
 * ruling on C6b, 2026-11-04). Read together, so a drawing is one look at the store. A switch that cannot be read counts
 * as off, the safe side, and the drawing says why (unreadable, masked); a press of its function reads it again and says
 * so too.
 */
export async function functionsRead($: EngineInterface): Promise<FunctionsRead> {
  let unreadable: string | undefined
  const off = await Promise.all(
    MOD_MANAGER_FUNCTIONS.map(async (def) => {
      try {
        return (await isOn($, def.id)) ? [] : [def.id]
      } catch (error) {
        unreadable ??= switchReadReason(error)
        return [def.id]
      }
    }),
  )
  return { off: new Set(off.flat()), unreadable }
}

/**
 * True, after a toast that names the function and where to turn it on, when one of these switches reads off now. A press
 * calls it first, before any question, claim, read or claude call (TRDD-5IK59SQ2: a function that is off runs nothing).
 * The pane is drawn again, so a button drawn before an off written in another session goes away. A switch that cannot be
 * read refuses too: the toast says why, masked, and the pane is drawn again, as for an off, so a function the last drawing
 * showed as on is hidden (review of 5f3fb42).
 */
export async function refusedWhileOff($: EngineInterface, ids: readonly string[]): Promise<boolean> {
  for (const id of ids) {
    let on: boolean
    try {
      on = await isOn($, id)
    } catch (error) {
      toast($, `${offText(id)} Its switch could not be read: ${switchReadReason(error)}`)
      $.ui.invalidate('ui.render')
      return true
    }
    if (on) continue
    toast($, offText(id))
    $.ui.invalidate('ui.render')
    return true
  }
  return false
}
/** The busy line while the list is read, by Refresh, by the pane's open, or after a change. */
const READING_LIST = 'reading the installed plugins…'

/**
 * Reads the profiles file for the profile list, and where this session can change plugins (changePath). It only reads:
 * no profile is written here. The file is read through engineIo, the same port the guarded write will use from P2b. A
 * read that fails becomes the list's own line and a log line, and the rest of the refresh goes on.
 */
async function readProfileList($: EngineInterface): Promise<void> {
  let profiles: ProfileView
  let path: ChangePath | undefined
  try {
    // Never rejects, by its type (index.d.ts 2864-2875); read here so a refresh also sees a surface that attached.
    path = changePath(await $.session.surfaces())
    const file = profilesPlace(await homeFolder($)).file
    const read = await readProfiles(engineIo($), file)
    profiles = read.parsed.ok ? { kind: 'read', names: read.parsed.value.profiles.map((profile) => profile.name) } : { kind: 'refused', reason: read.parsed.reason, file }
  } catch (error) {
    maskedLog($, `mods-manager: reading the profiles failed: ${messageOf(error)}`)
    profiles = { kind: 'failed', error: messageOf(error) }
  }
  await update($, { profiles, changePath: path })
}

/**
 * Reads what is installed, keeps what applies in this session, and orders it, under the busy claim it takes first, as a
 * change does (2d review F8): while a change or another read holds the claim, it is refused with a toast and reads
 * nothing, so it can never release a claim a change still holds. The pane's open calls it too, so reopening the pane
 * while a change runs shows that toast. The read itself is rereadAll. `message` is the pane's message for this read (the
 * command's check form, 2l), set with the claim, which clears any other. Resolves to false when the claim was refused, so
 * the command's add form runs its check only after a read that ran (pane.ts).
 * the command's add form runs its check only after a read that ran (pane.ts). The pane's switch is read first: off, a
 * Refresh reads nothing (refusedWhileOff, TRDD-5IK59SQ2).
 */
export async function refresh($: EngineInterface, message = ''): Promise<boolean> {
  if (await refusedWhileOff($, [FN.pane])) return false
  const session = await $.session.id()
  // Refused before the read, because readList releases the claim at its end, which must be this call's own.
  const blocked = claim(session, READING_LIST, { message })
  if (blocked !== undefined) {
    toast($, refusedToast(blocked))
    return false
  }
  await rereadAll($, session)
  return true
}

/**
 * The read of Refresh, under a claim the caller already holds: refresh, or an add that hands its claim straight on, with no
 * await between, as a change hands its own to readList (2j). 2f: Refresh and the pane's open drop every catalog listing
 * (the read of the latest versions reads those of the marketplaces with installed rows again), and close every section
 * read on demand, so nothing is read for those until the person opens one again; listingRun numbers the drop, so an
 * on-demand read still running drops its answer. A read of the list after a change keeps them: only a Refresh ends the cache.
 */
async function rereadAll($: EngineInterface, session: string): Promise<void> {
  const state = stateIn(session)
  const names = state.localMarketplaces.map((marketplace) => marketplace.name)
  const expanded = new Set([...state.expanded].filter((key) => !isOnDemand(key, names, state.rows)))
  setNow($, session, { listings: new Map(), listingRun: state.listingRun + 1, expanded })
  await readList($, session)
}

/**
 * Reads the list under a claim the caller already holds, and releases the claim when the read ends or fails. refresh
 * takes the claim and then calls it. A change hands its own claim straight to it (claim handoff), with no await between
 * the change's end and the read: if the change released the claim and refresh took it again after an await, a press in
 * that gap could take it first, and the change's own read would be refused with "Nothing was changed." right after the
 * change worked (2e review state/F4).
 *
 * An entry the list holds but parseInstalled cannot read is kept, so the pane names it (rejectedLines) and the other rows
 * are still shown, and every such entry is logged in full to the debug log, so nothing is dropped unseen. Every failure
 * becomes the pane's message and a log line; nothing is thrown into the engine from here. The catalogs read after it
 * (readLatest) take no claim, so a press still works while they are read.
 */
async function readList($: EngineInterface, session: string): Promise<void> {
  try {
    // The profiles come first, and readProfileList keeps its own read failures: they are read from files only, so a
    // claude list that fails (as it does where $.process is missing; $.process is CLI only, index.d.ts 3582) never hides them.
    await readProfileList($)
    // 2k: what the pane draws of auto-update, from the store; it keeps its own read failures too.
    await readAutoView($)
    const root = await $.session.root()
    const listed = await listInstalled($)
    // The debug log, not the transcript: the pane already names the first few and counts the rest, and a list of
    // hundreds of entries of an unknown shape would otherwise add hundreds of rows to the transcript on every refresh.
    for (const entry of listed.rejected) maskedLog($, `mods-manager: ${rejectedText(entry)}`, { to: 'debug' })
    const applying = listed.entries.filter((entry) => appliesHere(entry, root))
    const rows: Row[] = []
    for (const entry of applying) rows.push(toRow(entry, await isMod($, modFolder(entry))))
    const ordered = orderRows(rows)
    // installedIds holds every id the list holds, in any scope, so no plugin installed anywhere is offered as not installed (2f).
    await update($, { loaded: true, rows: ordered, rejected: listed.rejected, installedIds: installedIdsOf(listed), busy: undefined })
    // The details view closes when its row is gone or now loads from another folder (keepsDetails, 2i). Read and written
    // with no await between, so a details press that lands meanwhile is judged by its own row, not by the one read here.
    const open = stateIn(session).details
    if (open !== undefined && !keepsDetails(open, ordered)) setNow($, session, { details: undefined })
    // Only once the list is drawn, and not awaited: the catalogs are read in the background, so the pane never waits on
    // them. readLatest catches its own failures; the catch here only keeps a failed session lookup from going unseen.
    // Its error text comes from outside, so it is masked, home folder included, then made printable (maskedLog; review of
    // 1e29e89: printable alone left the home folder in the line).
    // The catalogs are read only while their switch reads on (TRDD-5IK59SQ2, C6b); off, none is read and the badge, which
    // counts what they say, is cleared.
    if (await functionReadsOn($, FN.latest)) {
      void readLatest($, ordered).catch((error: unknown) => maskedLog($, `mods-manager: reading the latest versions failed: ${messageOf(error)}`))
    } else setStatusLine($, 'mods-manager', undefined)
  } catch (error) {
    // messageOf can carry an error from claude or the filesystem, so the transcript line goes through maskedLog, as the one above.
    maskedLog($, `mods-manager: reading the installed plugins failed: ${messageOf(error)}`)
    // The entries the last read could not read are cleared: kept, they would sit beside this message as if this read
    // had found them. The rows are kept as they were.
    await update($, { loaded: true, busy: undefined, rejected: [], message: `Couldn't read the installed plugins: ${messageOf(error)}` })
  }
}

/**
 * Runs an action only after the person picks its confirm label; the rule itself is confirmThenRun in logic.ts. A
 * press while claude is busy is refused with a toast before any question is asked, and the claim is taken after the
 * question, so a second press cannot start a second claude run. After a change that ran, the claim passes straight to
 * the read of the list (readList). Its callers are the pane's buttons, so a request from a model cannot reach it.
 */
export async function confirmAndAct($: EngineInterface, row: Row, action: Action, ask: Ask = engineAsk($)): Promise<void> {
  const session = await $.session.id()
  const running = stateIn(session).busy
  if (running !== undefined) {
    toast($, refusedToast(running))
    return
  }
  const outcome = await confirmThenRun(
    action,
    () => ask(questionFor(action, row), [confirmLabel(action), KEEP]),
    async () => {
      // A new change clears the report of the last Update all, so an old report never sits beside this change's result.
      const blocked = claim(session, `${action} ${row.name}…`, { updateReport: undefined })
      if (blocked !== undefined) {
        toast($, refusedToast(blocked))
        return
      }
      $.ui.invalidate('ui.render')
      let output: string
      try {
        output = await runAction($, row, action)
      } catch (error) {
        await update($, { busy: undefined, message: `${action} ${row.name} failed: ${messageOf(error)}` })
        return
      }
      // An update that found nothing newer exits 0 too (plugin commands chapter, line 288). It changed nothing, so it
      // neither says "updated" nor asks for a new session.
      const changed = action !== 'update' || updateOutcomeOf(output).kind === 'updated'
      // The claim passes to the read of the list with no await in between, so no press can take it first (readList).
      setNow($, session, { busy: READING_LIST, ...(changed ? { needsRestart: true } : {}) })
      toast($, changed ? doneText(action, row) : currentText(row))
      await readList($, session)
    },
  )
  if (outcome === 'dismissed') maskedLog($, `mods-manager: ${action} ${row.name} was not confirmed`, { to: 'debug' })
}

/**
 * Updates every row updateTargets gives, the rows the filter shows that draw Update, after one question that names them
 * (TRDD-R2QYIN8O, 2e). The rows are fixed when the button is pressed, so the ones run are the ones the question named.
 * Like confirmAndAct, a busy session refuses the press before the question, and the claim is taken after it and held for
 * the whole run, then passed straight to the read of the list (readList), so no other press starts claude meanwhile. The
 * rows are updated one after another, a failure does not stop the others (updateEach), and the report goes to its own
 * field, which the read after the run leaves in place. Each row's line also goes to the debug log, which the pane's count
 * of the lines it does not show points to.
 */
export async function confirmAndUpdateAll($: EngineInterface, ask: Ask = engineAsk($)): Promise<void> {
  const session = await $.session.id()
  const state = stateIn(session)
  if (state.busy !== undefined) {
    toast($, refusedToast(state.busy))
    return
  }
  const targets = updateTargets(state.rows, state.latest, state.filter)
  if (targets.length === 0) return
  const outcome = await askThenRun(
    (answer) => answer === UPDATE_ALL_LABEL,
    () => ask(updateAllQuestion(targets), [UPDATE_ALL_LABEL, KEEP]),
    async () => {
      const blocked = claim(session, `updating ${targets.length} plugins…`, { updateReport: undefined })
      if (blocked !== undefined) {
        toast($, refusedToast(blocked))
        return
      }
      $.ui.invalidate('ui.render')
      const results = await updateEach(
        targets,
        (row) => runAction($, row, 'update'),
        (row, index) => setNow($, session, { busy: `updating ${index + 1} of ${targets.length}: ${row.name}…` }),
      )
      for (const result of results) maskedLog($, `mods-manager: ${updateLine(result)}`, { to: 'debug' })
      const report = reportOf(results)
      const changed = results.some((result) => result.outcome.kind === 'updated')
      // The claim passes to the read of the list with no await in between, so no press can take it first (readList).
      setNow($, session, { busy: READING_LIST, updateReport: report, ...(changed ? { needsRestart: true } : {}) })
      toast($, report.summary)
      await readList($, session)
    },
  )
  if (outcome === 'dismissed') $.ui.log('mods-manager: update all was not confirmed', { to: 'debug' })
}

/** The busy line while a reload waits for the session to be idle and runs: $.command.run queues it until then. */
const RELOADING = 'reloading the plugins once the session is idle…'

/**
 * Reloads every plugin with /reload-plugins (TRDD-R2QYIN8O, 2h), so a change made here applies in this session without a
 * new one (plugin commands chapter, line 269: an update "loads in your next session, or after you run /reload-plugins";
 * line 849: pending changes are plugins "installed, updated, enabled, disabled"). It is the documented way for a mod to run
 * a command: $.command.run "Runs a slash command as if the person typed `/command args`: the event `command.run`, queued and
 * run once the session is idle" (types, $.command.run). A press while claude is busy is refused with a toast, as every other
 * press is, because a reload while a change runs would replace this module while the old copy still owns that change; the
 * claim is taken at the press. It asks no question: nothing is installed or removed, and Claude Code itself reloads when
 * the person closes /plugin with pending changes (line 851). It never passes --force: a reload that would change MCP tools
 * is held back and says to run it with --force (line 871), the person's own choice, since the next message then re-reads
 * the whole conversation.
 */
export async function reloadPlugins($: EngineInterface): Promise<void> {
  const session = await $.session.id()
  const blocked = claim(session, RELOADING)
  if (blocked !== undefined) {
    toast($, refusedToast(blocked))
    return
  }
  $.ui.invalidate('ui.render')
  // From a timer, not from the press: $.command.run rejects "inside a hook the turn waits on" (types, $.command.run), and
  // whether a press is such a hook is not stated, so the run starts outside any hook, as self-command's run tool starts its
  // command (self-command/register.ts).
  $.clock.after(0, () => {
    void runReload($, session)
  })
}

/**
 * Runs /reload-plugins under the claim reloadPlugins took, then releases it with what the reload answered. A reload that
 * applies replaces this module, and then this copy's state is read by no render and its calls are refused (troubleshooting
 * chapter: "the hooks module that made the call is no longer loaded"); the fresh copy reads the list again if the pane is
 * still open (register.ts startModManager). An answer that reaches a copy still loaded is from a reload that did not
 * replace it, and the pane shows it (reloadAnswerText). needsRestart is left as it is: only a fresh copy, after a reload
 * that applied, starts without it.
 */
async function runReload($: EngineInterface, session: string): Promise<void> {
  let message: string
  try {
    message = reloadAnswerText((await $.command.run({ command: RELOAD_COMMAND })).text)
  } catch (error) {
    message = reloadFailedText(messageOf(error))
  }
  setNow($, session, { busy: undefined, message })
  // The answer is text from another command, so the debug log gets it masked, on one line and printable (maskedLog).
  maskedLog($, `mods-manager: ${message}`, { to: 'debug' })
}

/**
 * Opens the details view of a row (TRDD-R2QYIN8O, 2i), in place of the list. It takes no claim, since it runs no claude,
 * so it works while a change runs. It reads the plugin.json of the folder the row loads from (modFolder) in the
 * background, and keeps the answer only while the same row's details, from that folder, are still open, so a read that a
 * later press replaced cannot overwrite what the view shows. A folder openableFolder refuses is not read.
 * later press replaced cannot overwrite what the view shows. A folder openableFolder refuses is not read. Part of the pane:
 * with its switch off, nothing is read (refusedWhileOff).
 */
export async function showDetails($: EngineInterface, row: Row): Promise<void> {
  if (await refusedWhileOff($, [FN.pane])) return
  const session = await $.session.id()
  const key = rowKey(row)
  const folder = modFolder(row)
  setNow($, session, { details: { key, folder, manifest: undefined, problem: undefined } })
  const readable = openableFolder(folder)
  let found: Pick<Details, 'manifest' | 'problem'>
  if (readable === undefined) {
    found = { manifest: undefined, problem: 'its folder is not an absolute path without ".."' }
  } else {
    try {
      found = { manifest: await readAbout($, readable), problem: undefined }
    } catch (error) {
      found = { manifest: undefined, problem: messageOf(error) }
      maskedLog($, `mods-manager: ${aboutPath(readable)} could not be read: ${messageOf(error)}`, { to: 'debug' })
    }
  }
  const open = stateIn(session).details
  if (open === undefined || open.key !== key || open.folder !== folder) return
  setNow($, session, { details: { ...open, ...found } })
}

/** Leaves the details view for the list. The pane's open does it too, so the pane always opens on the list. */
export async function hideDetails($: EngineInterface): Promise<void> {
  await update($, { details: undefined })
}

/**
 * Opens the row's folder or its homepage from the details view (2i), with the one program of OPENERS that this system has
 * (openOnHost). When it does not open it, as on Windows, which has no such program, the path or the link is copied to the clipboard of the
 * surface the press came from ($.ui.copy), and a toast says so; when the copy fails too, the pane's message names the
 * reason and the text, so the person can still read it. It takes no claim: it runs no claude and changes no plugin. The
 * target is worked out again here from the session state (openTargetOf), not taken from the drawing, so a press can
 * only open what the view would draw a button for.
 */
export async function openFromDetails($: EngineInterface, row: Row, kind: 'folder' | 'link', surface: RenderSurface): Promise<void> {
  const session = await $.session.id()
  const state = stateIn(session)
  const manifest = state.details?.key === rowKey(row) ? state.details.manifest : undefined
  const target = openTargetOf(row, kind, state.catalogAbout?.get(row.id), manifest)
  if (target === undefined) return
  let outcome: OpenOutcome
  try {
    outcome = await openOnHost($, target)
  } catch (error) {
    // A refused $.fs.exists (an organization policy can refuse any file call) leaves the copy as the way out.
    outcome = { opened: false, failures: [messageOf(error)] }
  }
  if (outcome.opened) {
    toast($, openedText(target, row.name))
    return
  }
  for (const failure of outcome.failures) maskedLog($, `mods-manager: opening ${target.text} failed: ${failure}`, { to: 'debug' })
  let reason: string
  try {
    const copied = await $.ui.copy({ text: target.text, surface })
    if (copied.isCopied) {
      toast($, copiedText(target))
      return
    }
    reason = copied.reason
  } catch (error) {
    reason = messageOf(error)
  }
  // The pane draws the message through printable, as it draws every message.
  await update($, { message: notCopiedText(target, reason) })
}

/**
 * Reads the catalog of a marketplace with no installed row when the person opens its section (TRDD-R2QYIN8O, 2f), in the
 * background, so the pane never waits on it. Its listing says it is being read from the start, with no await before that
 * write, so a second press starts no second read; the answer is kept until the next Refresh or open of the pane, which
 * drops every listing and numbers the drop (listingRun), so a read that one replaced drops its answer. A failed answer is
 * kept only until the section is opened again, which reads the catalog again (toggleSection, 2f-R1 (2)), and a read of the
 * latest versions drops the answer of a marketplace that has left the marketplace list (readLatest, 2f-R1 (3)).
 */
async function readOnDemand($: EngineInterface, session: string, marketplace: { name: string; installLocation: string }): Promise<void> {
  const run = stateIn(session).listingRun
  setNow($, session, { listings: new Map([...stateIn(session).listings, [marketplace.name, READING]]) })
  const listing = await readListing($, session, marketplace.name, marketplace.installLocation)
  if (stateIn(session).listingRun !== run) return
  // Written only while this marketplace's listing is still the READING this call set: a read of the latest versions that
  // ended meanwhile may have set a listing of its own, for instance once a plugin of this marketplace was installed, and
  // that listing is newer than this answer, so it wins (2f-R1 (3), review). Read and written with no await between.
  if (stateIn(session).listings.get(marketplace.name)?.kind !== 'reading') return
  setNow($, session, { listings: new Map([...stateIn(session).listings, [marketplace.name, listing]]) })
}

/** The listing of a marketplace's catalog, read from its local copy; a catalog that cannot be read is a failed listing and a debug-log line. */
async function readListing($: EngineInterface, session: string, name: string, installLocation: string): Promise<Listing> {
  try {
    return listingOf($, session, name, await readCatalog($, installLocation))
  } catch (error) {
    // The name is from the marketplace list and the reason can name a path: the line goes through maskedLog.
    maskedLog($, `mods-manager: the catalog of ${name} could not be read: ${messageOf(error)}`, { to: 'debug' })
    return { kind: 'failed', reason: messageOf(error) }
  }
}

/**
 * The listing of a catalog already read (catalogListing); each name it does not show gets a debug-log line, so none is
 * dropped unseen. Each marketplace and name is logged once per session (refusedLogged): every read of the latest versions
 * reads the same catalogs again, and a line on every read would only repeat what the log already holds (2f-R1 (4)). The
 * set is written with no await between its read and its write, so two reads that end together log a name once.
 */
function listingOf($: EngineInterface, session: string, name: string, catalog: ReadonlyMap<string, CatalogEntry>): Listing {
  const { entries, refused } = catalogListing(name, catalog)
  const logged = new Set(stateIn(session).refusedLogged)
  for (const plugin of refused) {
    // A JSON pair, so no marketplace name and plugin name can join into the key of another pair.
    const key = JSON.stringify([name, plugin])
    if (logged.has(key)) continue
    logged.add(key)
    maskedLog($, `mods-manager: the catalog of ${name} lists "${plugin}", which is not a lowercase name@marketplace, so it is not shown`, { to: 'debug' })
  }
  // Only the log reads this set, so it is kept with no redraw.
  stateBySession.set(session, { ...stateIn(session), refusedLogged: logged })
  return { kind: 'read', entries }
}

/**
 * Copies the install line of a plugin its catalog lists and no scope has installed (2f) to the clipboard of the surface the
 * press came from ($.ui.copy), and says so in a toast; when the copy fails, the pane's message names the reason and the
 * line, so the person can still read it. The line is for a person who installs from their own terminal (Install, below,
 * runs claude from the pane): this runs nothing, takes no claim and changes no plugin. The plugin is looked up
 * again in the session state (findAvailable), so a press copies only the line of a plugin its catalog still lists and that
 * is still not installed.
 */
export async function copyInstallLine($: EngineInterface, entry: { id: string; marketplace: string }, surface: RenderSurface): Promise<void> {
  const session = await $.session.id()
  const state = stateIn(session)
  const found = findAvailable(state.listings, state.installedIds, entry)
  if (found === undefined) return
  const line = installLine(found)
  let reason: string
  try {
    const copied = await $.ui.copy({ text: line, surface })
    if (copied.isCopied) {
      toast($, copiedLineText(found.name, line))
      return
    }
    reason = copied.reason
  } catch (error) {
    reason = messageOf(error)
  }
  // The pane draws the message through printable, as it draws every message.
  await update($, { message: notCopiedLineText(found.name, line, reason) })
}

/**
 * Installs a plugin its catalog lists and no scope has installed (2f Install; owner question 4, "Add Install button"), only
 * after the person picks INSTALL_LABEL in a question that shows the exact command (installQuestion). As confirmAndAct does,
 * a busy session refuses the press before the question, the claim is taken after it, and after an install that ran, worked
 * or not, the claim passes straight to the read of the list (readList), so an installed plugin moves from its catalog's
 * listing to the rows. The plugin is looked up again in the session state (findAvailable), so a press installs only a
 * plugin its catalog still lists and that is still not installed. A command its marketplace declares is never run from
 * here (results.ts says why): the pane names it with its sha256 and offers the line that accepts it, for the person's own
 * terminal (offerAcceptLine).
 */
export async function confirmAndInstall($: EngineInterface, entry: { id: string; marketplace: string }, surface: RenderSurface, ask: Ask = engineAsk($)): Promise<void> {
  const session = await $.session.id()
  if (refusedWhileBusy($, session)) return
  const state = stateIn(session)
  const found = findAvailable(state.listings, state.installedIds, entry)
  if (found === undefined) return
  let shown: { question: string; line: string } | undefined
  const outcome = await askThenRun(
    (answer) => answer === INSTALL_LABEL,
    () => ask(installQuestion(found), [INSTALL_LABEL, KEEP]),
    async () => {
      const blocked = claim(session, installingText(found.name), { updateReport: undefined })
      if (blocked !== undefined) {
        toast($, refusedToast(blocked))
        return
      }
      $.ui.invalidate('ui.render')
      let result: CliResult
      try {
        result = await runJson($, (claude) => installArgv(claude, found.id), INSTALL_TIMEOUT_MS)
      } catch (error) {
        await update($, { busy: undefined, message: installFailedText(found.name, messageOf(error)) })
        return
      }
      if (result.ok) {
        // The claim passes to the read of the list with no await in between, so no press can take it first (readList).
        setNow($, session, { busy: READING_LIST, needsRestart: true })
        toast($, installedText(found.name))
        await readList($, session)
        return
      }
      // claude reports the install failed, so the next session line is not set. The claim still passes to the read of the list,
      // as after an action (confirmAndAct), with no await in between: whether a refused or failed run left anything installed
      // was not measured, so the pane shows what the list then says, not what it read before the run (2f review).
      let message = installFailedText(found.name, result.message)
      if (result.shown !== undefined && result.shown.pluginId !== found.id) message = otherPluginText(found.name, found.id, result.message, result.shown)
      else if (result.shown !== undefined) {
        const line = acceptLine('install', found.id, 'user', result.shown.sha256)
        message = shownText(result.shown, line)
        shown = { question: copyLineQuestion(result.shown, line), line }
      } else if (result.shownUnreadable) message = unreadableShownText('install', found.id, result.message)
      setNow($, session, { busy: READING_LIST, message })
      await readList($, session)
    },
  )
  if (outcome === 'dismissed') maskedLog($, `mods-manager: install ${found.id} was not confirmed`, { to: 'debug' })
  // Asked after the install's own question has ended and the claim is released, so the copy question never holds the claim.
  if (shown !== undefined) await offerAcceptLine($, shown.question, shown.line, surface, ask)
}

/**
 * Asks whether to copy the line that accepts a shown command (results.ts acceptLine) and copies it to the clipboard of the
 * surface the press came from only on COPY_LINE_LABEL. It runs nothing and takes no claim: the line is for the person's
 * own terminal. The pane's message already shows the command, its sha256 and the line, so a copy that fails only names
 * the line again.
 */
async function offerAcceptLine($: EngineInterface, question: string, line: string, surface: RenderSurface, ask: Ask): Promise<void> {
  await askThenRun(
    (answer) => answer === COPY_LINE_LABEL,
    () => ask(question, [COPY_LINE_LABEL, KEEP]),
    () => copyLine($, line, surface),
  )
}

/**
 * Copies a line for the person's own terminal (results.ts acceptLine) to the clipboard of the surface the press came from: a
 * toast says so, or the pane's message names the line with the reason the copy failed. Install (offerAcceptLine) and the
 * review of a paused row (reviewPause, 2k) share it.
 */
async function copyLine($: EngineInterface, line: string, surface: RenderSurface): Promise<void> {
  let reason: string
  try {
    const copied = await $.ui.copy({ text: line, surface })
    if (copied.isCopied) {
      toast($, copiedAcceptText(line))
      return
    }
    reason = copied.reason
  } catch (error) {
    reason = messageOf(error)
  }
  await update($, { message: notCopiedAcceptText(line, reason) })
}

/**
 * Keeps what the person typed in the add field (2j), so a redraw shows it again. It only redraws; it never calls claude.
 * Text other than the field's, compared exactly (a space more counts), also drops the remote source the last check found
 * (addRemote), so c: Copy request is gone until the new text is checked and never copies the request of a source the field
 * no longer holds; the same text again keeps it (TRDD-R2QYIN8O, 2j second review). The message is left as it is: it is
 * shared with every other flow of the pane, and a check's message names the folder or source it speaks of, when there
 * is one.
 */
export async function setAddSource($: EngineInterface, addSource: string): Promise<void> {
  const session = await $.session.id()
  // Compared and written with no await between, so no check that lands meanwhile can write between the two.
  const changed = addSource !== stateIn(session).addSource
  setNow($, session, changed ? { addSource, addRemote: undefined } : { addSource })
}

/**
 * Checks the source in the add field (TRDD-R2QYIN8O, 2j), pressed with a: Add marketplace or run by the command's add form
 * (2l), and, for a local folder whose name the list does not hold, asks the person, then adds it. It adds a
 * marketplace and installs nothing. A press while claude is busy is refused with a toast before anything is read. Text the
 * pane refuses and a remote source (classifyAddSource) only set the message; a remote source also keeps the source for
 * Copy request. A local folder's check reads its marketplace.json and the marketplace list under the claim, so a second
 * press during those reads is refused; the claim is released before the question, as every change does (confirmAndAct),
 * so a press while the question is open starts a second check and question, and the add itself claims again and checks
 * the list again (addChecked). A second yes then finds the marketplace already added only when the first add put it in
 * the list: after a first add that failed without doing so, the second yes runs the add again, and while the first add
 * runs, the second yes's claim is refused with a toast. With `confirm` false (the add form from any origin but
 * composer, the person's own gesture, pane.ts) the check is shown and nothing is asked: the person presses
 * a: Add marketplace for the question.
 */
export async function checkAddSource($: EngineInterface, ask: Ask = engineAsk($), confirm = true): Promise<void> {
  const session = await $.session.id()
  const state = stateIn(session)
  if (state.busy !== undefined) {
    toast($, refusedToast(state.busy))
    return
  }
  const source = classifyAddSource(state.addSource)
  if (source.kind === 'refused') {
    await update($, { message: source.reason, addRemote: undefined })
    return
  }
  if (source.kind === 'remote') {
    // Written with no await after the field was read, so a keystroke that lands meanwhile (setAddSource) writes after it
    // and drops it. With an await between the two, a keystroke could land in between, and c: Copy request would then
    // copy the request of a source the field no longer holds (2j second review).
    setNow($, session, { message: remoteText(source.source), addRemote: source.source })
    return
  }
  const { folder } = source
  const blocked = claim(session, `checking the marketplace folder ${folder}…`, { addRemote: undefined })
  if (blocked !== undefined) {
    toast($, refusedToast(blocked))
    return
  }
  $.ui.invalidate('ui.render')
  let name: string
  try {
    name = await readMarketplaceName($, folder)
  } catch (error) {
    // The pane draws the message through printable: the folder and the reason are text from outside.
    await update($, { busy: undefined, message: `Not added: the marketplace.json of ${folder} could not be read: ${messageOf(error)}` })
    return
  }
  let decision: AddDecision
  try {
    decision = addDecision(name, folder, await listMarketplaces($))
  } catch (error) {
    await update($, { busy: undefined, message: `Not added: the marketplace list could not be read: ${messageOf(error)}` })
    return
  }
  await update($, { busy: undefined, message: addDecisionText(decision, name, folder) })
  if (decision.kind !== 'free' || !confirm) return
  const outcome = await askThenRun(
    (answer) => answer === ADD_LABEL,
    () => ask(addQuestion(name, folder), [ADD_LABEL, KEEP]),
    () => addChecked($, session, name, folder),
  )
  if (outcome === 'dismissed') maskedLog($, `mods-manager: adding the marketplace ${name} was not confirmed`, { to: 'debug' })
}

/**
 * The add, once the person picked ADD_LABEL (2j). The claim is taken after the question, so a Refresh pressed while the
 * question is open wins and the answer then runs nothing but a toast. Under the claim, after the answer, the list before
 * the add is read and the name is checked against it again (addDecision): a marketplace of that name added from a
 * terminal while the question was open is refused, not re-pointed. Then, right before the add, the folder's
 * marketplace.json is read again, and a name other than the one the question showed refuses the add (renamedSinceText).
 * The add runs with argv and no -y (addMarketplace).
 * After it, failed or not, the list is read again, and every marketplace of the list before whose source changed is named
 * in the default log and in the message, and is not changed back (no automatic restore, the card's 2j spec). The claim
 * then passes to the read of Refresh with no await between (rereadAll), so the new marketplace gets its section (2f).
 */
async function addChecked($: EngineInterface, session: string, name: string, folder: string): Promise<void> {
  const blocked = claim(session, `adding the marketplace ${name}…`)
  if (blocked !== undefined) {
    toast($, refusedToast(blocked))
    return
  }
  $.ui.invalidate('ui.render')
  let before: Marketplace[]
  try {
    before = await listMarketplaces($)
  } catch (error) {
    await update($, { busy: undefined, message: `Not added: the marketplace list could not be read before the add: ${messageOf(error)}` })
    return
  }
  const again = addDecision(name, folder, before)
  if (again.kind !== 'free') {
    await update($, { busy: undefined, message: addDecisionText(again, name, folder) })
    return
  }
  // The folder's marketplace.json is read again under the claim, after the list and right before the add, with no claude
  // run between the read and the add: the question may stay open for minutes, and a marketplace.json renamed meanwhile
  // to the name of a marketplace already added would make the add re-point that one without a word, which the comparison
  // after the add could only name (TRDD-R2QYIN8O, review of M3b). Were it read before the list, a rename during that
  // claude run would pass.
  let current: string
  try {
    current = await readMarketplaceName($, folder)
  } catch (error) {
    await update($, { busy: undefined, message: `Not added: the marketplace.json of ${folder} could not be read again before the add: ${messageOf(error)}` })
    return
  }
  if (current !== name) {
    await update($, { busy: undefined, message: renamedSinceText(name, current, folder) })
    return
  }
  const lines: string[] = []
  let added = false
  try {
    const { exitCode, output } = await addMarketplace($, folder)
    added = exitCode === 0
    if (!added) {
      // The pane names the first line, the debug log the whole output; both are claude's text, so through printable.
      maskedLog($, `mods-manager: claude plugin marketplace add ${folder} exited ${exitCode}: ${output}`, { to: 'debug' })
      lines.push(addFailedText(output))
    }
  } catch (error) {
    // $.process.run rejects when claude cannot start or runs past its timeout; the failure is named as a non-zero exit is,
    // the list is still compared below, and the claim still passes to the read of Refresh at the end.
    maskedLog($, `mods-manager: claude plugin marketplace add ${folder} did not finish: ${messageOf(error)}`, { to: 'debug' })
    lines.push(addFailedText(messageOf(error)))
  }
  try {
    const changes = changedSources(before, await listMarketplaces($))
    // Only an add followed by a list that was read says to open the new section: the read of Refresh below draws the
    // sections from the marketplace list as well, so after a failed read here no section may be drawn (2j second review).
    if (added) lines.push(`Added the marketplace ${name} from ${folder}: open its section to list its plugins.`)
    for (const change of changes) {
      // The default log, not the debug log: a marketplace pointed elsewhere changes where its plugins update from.
      // Masked as well (maskedLog; item 3 sweep, G2): a git source can carry a credential in its URL, a folder the home.
      maskedLog($, `mods-manager: ${changedLine(change)}`)
      lines.push(changedLine(change))
    }
  } catch (error) {
    if (added) lines.push(`Added the marketplace ${name} from ${folder}.`)
    lines.push(`The marketplace list could not be read after the add (${messageOf(error)}), so whether another marketplace changed is not known; press r: Refresh to read it again.`)
  }
  // The claim passes to the read of Refresh with no await in between, so no press can take it first (readList).
  setNow($, session, { busy: READING_LIST, message: lines.join(' ') })
  await rereadAll($, session)
}

/**
 * Copies the request for the remote source the last check found (2j) to the clipboard of the surface the press came from,
 * and says so in a toast; when the copy fails, the pane's message names the reason and the request. The source is taken
 * again from the session state, not from the drawing, and installRequest refuses one that is not remote. It runs nothing,
 * takes no claim and changes no plugin.
 */
export async function copyAddRequest($: EngineInterface, surface: RenderSurface): Promise<void> {
  const source = stateIn(await $.session.id()).addRemote
  if (source === undefined) return
  const request = installRequest(source)
  let reason: string
  try {
    const copied = await $.ui.copy({ text: request, surface })
    if (copied.isCopied) {
      toast($, copiedRequestText(request))
      return
    }
    reason = copied.reason
  } catch (error) {
    reason = messageOf(error)
  }
  // The pane draws the message through printable, as it draws every message.
  await update($, { message: notCopiedRequestText(request, reason) })
}

/**
 * The switch of auto-update, the opted-in keys, the paused ones and the records as the store holds them now (2k), the one source of each:
 * the pane's copy (readAutoView) and every check (autoUpdateTick, before each row too) read them through here. Opt-ins
 * written outside the plugin count as none, since an opt-in lets an update run with no question; pauses written outside
 * are kept as read, since a pause only stops updates (A1, TRDD-5IK59SQ2).
 */
async function readAutoSettings($: EngineInterface): Promise<AutoView> {
  const { optIns, outside } = await readOptIns($)
  const pauses = await readSigned($, AUTO_PAUSES_KEY)
  return {
    on: await isOn($, AUTO_UPDATE),
    optIns,
    pauses: pausesOf(pauses.value, pauses.outside),
    records: recordsOf(await $.store.get(AUTO_LOG_KEY)),
    optInsOutside: outside,
    pausesOutside: pauses.outside,
  }
}

/** The opted-in keys this plugin signed (A1): none when what is stored was written outside the plugin, which says so. */
async function readOptIns($: EngineInterface): Promise<{ optIns: Map<string, string>; outside: boolean }> {
  const read = await readSigned($, AUTO_OPT_INS_KEY)
  return { optIns: read.outside ? new Map() : optInsOf(read.value), outside: read.outside }
}

/**
 * Reads what the pane draws of auto-update (2k) from the store (readAutoSettings). This copy is read again on every read of
 * the list and after every change of the switch, an opt-in or a pause, so another session's change shows at the next
 * Refresh. A store that cannot be read leaves the copy as it was and goes to the debug log.
 */
async function readAutoView($: EngineInterface): Promise<void> {
  try {
    await update($, { auto: await readAutoSettings($) })
  } catch (error) {
    maskedLog($, `mods-manager: the auto-update settings could not be read: ${messageOf(error)}`, { to: 'debug' })
  }
}

/**
 * Writes one pause of the store (2k), or removes it with undefined, keeping every other record as it is, an unreadable one
 * included: a damaged record keeps its row paused (pausesOf). Written signed (A1); a map written outside the plugin is kept
 * as read and signed with this write, since a pause only stops updates.
 */
async function writePause($: EngineInterface, key: string, pause: Pause | undefined): Promise<void> {
  const read = await readSigned($, AUTO_PAUSES_KEY)
  // A map read from outside keeps each record's reason, not its shown command (pauseRecordsToSign; review of d783048).
  // Every record is written through pauseRecordOf, its reason on one line and capped (M4c item 2).
  const records = pauseRecordsToSign(read.value, read.outside)
  if (pause === undefined) delete records[key]
  else records[key] = pauseRecordOf(pause)
  await writeSigned($, AUTO_PAUSES_KEY, records)
}

/**
 * Turns auto-update off at once, or on only after the person picks AUTO_ON_LABEL in SWITCH_QUESTION, which says everything an
 * opt-in then allows with no question per update (2k; owner question 10). The switch is read at the press, so a switch
 * another session turned is never turned back by a stale pane, and written through the registry's one writer (setSwitch,
 * TRDD-5IK59SQ2), which signs it and starts or stops the check's timer (register.ts). setSwitch is given no seenAt, so it
 * never refuses. Its callers are the pane's buttons.
 */
export async function toggleAutoSwitch($: EngineInterface, ask: Ask = engineAsk($)): Promise<void> {
  try {
    if (await isOn($, AUTO_UPDATE)) {
      await setSwitch($, AUTO_UPDATE, false, 'person')
      toast($, autoOffText)
    } else {
      await askThenRun(
        (answer) => answer === AUTO_ON_LABEL,
        () => ask(SWITCH_QUESTION, [AUTO_ON_LABEL, KEEP]),
        async () => {
          await setSwitch($, AUTO_UPDATE, true, 'person')
          toast($, autoOnText)
        },
      )
    }
  } catch (error) {
    await update($, { message: autoSaveFailedText(messageOf(error)) })
  }
  await readAutoView($)
}

/**
 * Opts a row out at once, and clears its pause, or opts it in only after the person picks OPT_IN_LABEL in its question
 * (2k). The opt-in keeps the source its marketplace has now, read from claude's marketplace list after the answer, so a
 * marketplace added again under the same name from another source does not inherit it (blockReason; coordinator review of
 * M4b, finding 5); a marketplace the list does not name is not opted in, and the pane says why. The opted-in keys are read
 * again after the question, so an opt-in made meanwhile in another session is kept. A row that cannot opt in
 * (canAutoUpdate) is never written.
 */
export async function toggleOptIn($: EngineInterface, row: Row, ask: Ask = engineAsk($)): Promise<void> {
  if (!canAutoUpdate(row)) return
  const key = optInKey(row)
  try {
    const optIns = (await readOptIns($)).optIns
    if (optIns.has(key)) {
      optIns.delete(key)
      await writeSigned($, AUTO_OPT_INS_KEY, Object.fromEntries(optIns))
      await writePause($, key, undefined)
      toast($, optedOutText(row))
    } else {
      // The source is read with claude, which needs $.process, so a session with no terminal opts nothing in and says why
      // (review round 2: on the Desktop app alone the read would fail and read as a save failure).
      if (changePath(await $.session.surfaces()) !== 'cli') {
        await update($, { message: notOptedInText(row, 'this session has no terminal to run claude in; opt it in from a terminal session') })
        await readAutoView($)
        return
      }
      const on = await isOn($, AUTO_UPDATE)
      await askThenRun(
        (answer) => answer === OPT_IN_LABEL,
        () => ask(optInQuestion(row, on), [OPT_IN_LABEL, KEEP]),
        async () => {
          let marketplaces: Marketplace[]
          try {
            marketplaces = await listMarketplaces($)
          } catch (error) {
            await update($, { message: notOptedInText(row, `claude's marketplace list could not be read (${messageOf(error)})`) })
            return
          }
          const marketplace = marketplaces.find((entry) => entry.name === row.marketplace)
          if (marketplace === undefined) {
            await update($, { message: notOptedInText(row, `claude's marketplace list does not name its marketplace ${row.marketplace}`) })
            return
          }
          const now = (await readOptIns($)).optIns
          now.set(key, sourceKey(marketplace.source))
          await writeSigned($, AUTO_OPT_INS_KEY, Object.fromEntries(now))
          toast($, optedInText(row))
        },
      )
    }
  } catch (error) {
    await update($, { message: autoSaveFailedText(messageOf(error)) })
  }
  await readAutoView($)
}

/**
 * Review of a paused row (2k): one question with why it paused and, for a command claude showed for this plugin, the line
 * that accepts exactly that command in the person's own terminal. Copy the line copies it; Resume removes the pause, so the
 * next check updates the row again; any other answer, or none, changes nothing. The pane never accepts the command itself
 * (results.ts says why), so a command not accepted by the next check is refused again, and the row pauses again.
 */
export async function reviewPause($: EngineInterface, row: Row, surface: RenderSurface, ask: Ask = engineAsk($)): Promise<void> {
  const key = optInKey(row)
  try {
    const read = await readSigned($, AUTO_PAUSES_KEY)
    const pause = pausesOf(read.value, read.outside).get(key)
    if (pause !== undefined) {
      const line = pause.shown === undefined ? undefined : acceptLine('update', row.id, row.scope, pause.shown.sha256)
      const options = line === undefined ? [RESUME_LABEL, KEEP] : [COPY_LINE_LABEL, RESUME_LABEL, KEEP]
      const answer = await ask(reviewQuestion(row, pause, line), options).catch(() => KEEP)
      if (answer === COPY_LINE_LABEL && line !== undefined) await copyLine($, line, surface)
      if (answer === RESUME_LABEL) {
        await writePause($, key, undefined)
        toast($, resumedText(row))
      }
    }
  } catch (error) {
    await update($, { message: autoSaveFailedText(messageOf(error)) })
  }
  await readAutoView($)
}

/**
 * Takes the lease that lets this session run a check (2k): refused while another session holds one younger than
 * AUTO_LEASE_MS; otherwise written, then read back after AUTO_SETTLE_MS, so of two checks that start together only the last
 * to write runs. So there is one check an hour in all, however many sessions are open.
 */
async function takeLease($: EngineInterface, session: string): Promise<boolean> {
  const now = await $.clock.now()
  if (leaseHeldByOther(await $.store.get(AUTO_LEASE_KEY), session, now)) return false
  await $.store.set(AUTO_LEASE_KEY, { session, at: now })
  await $.clock.sleep(AUTO_SETTLE_MS)
  const held = await $.store.get(AUTO_LEASE_KEY)
  return typeof held === 'object' && held !== null && (held as Record<string, unknown>).session === session
}

/**
 * Leaves the record of an automatic update or pause (2k; coordinator review of M4b, finding 6): a toast, a transcript line,
 * and a line in the store's list of recent records (AUTO_LOG_KEY), which the pane of every session draws. The toast and the
 * line come first, so a store that refuses the write still leaves them; that failure goes to the debug log, since nobody
 * pressed anything, and never turns an update that worked into a pause.
 */
async function leaveRecord($: EngineInterface, text: string): Promise<void> {
  toast($, text)
  $.ui.log(text)
  try {
    await $.store.set(AUTO_LOG_KEY, [...recordsOf(await $.store.get(AUTO_LOG_KEY)), text].slice(-AUTO_LOG_SIZE))
  } catch (error) {
    maskedLog($, `mods-manager: the auto-update record could not be saved: ${messageOf(error)}`, { to: 'debug' })
  }
}

/**
 * Pauses a row for a check (2k): its record first (leaveRecord, 2k review), then the pause, so the next check skips the row
 * until Review. A store that refuses the pause rejects, which ends the check (autoUpdateTick), so no later row runs either.
 * The reason comes here masked where it was born (orchestrator ruling (d) on the item 3 sweep): each part from outside,
 * claude's message, an error, a declared command or a listed error, is masked as it enters the reason (the check),
 * so the toast, the transcript line, the record log and the stored pause all hold it masked. The whole reason is not
 * masked again here: the masker reads a sha256 as a long hex key and would redact the one
 * a shown command's reason names, which the person compares with the accept line. The shown command is kept as claude
 * showed it. Masking a masked text changes nothing (debug-log.test.ts).
 */
async function pauseAuto($: EngineInterface, row: Row, pause: Pause): Promise<void> {
  await leaveRecord($, autoPausedText(row, pause.reason))
  await writePause($, optInKey(row), pause)
}

/**
 * Updates one row for a check (2k), under the claim, with --json, and leaves its record. An update claude reports done: its
 * record (leaveRecord) with the old and new versions claude reported and the time. One that found nothing newer: the debug
 * log only. Anything else pauses the row (pauseAuto) with the reason: a command claude showed (new or changed, since claude
 * runs an accepted one with no question), one it showed in a shape the pane cannot read, a failure, or no result line. A
 * call that rejects, at INSTALL_TIMEOUT_MS for one, pauses the row too. Resolves to 'refused' when a press holds the claim,
 * so the check stops and asks nobody. The claim is released whatever happens, the pane's message is kept, since nobody
 * pressed anything.
 */
async function autoUpdateRow($: EngineInterface, session: string, row: Row): Promise<'updated' | 'done' | 'refused'> {
  if (claim(session, autoUpdatingText(row), { message: stateIn(session).message }) !== undefined) return 'refused'
  $.ui.invalidate('ui.render')
  let outcome: 'updated' | 'done' = 'done'
  try {
    let pause: Pause | undefined
    try {
      const result = await runJson($, (claude) => autoUpdateArgv(claude, row), INSTALL_TIMEOUT_MS, actionCwd(row))
      if (result.ok && result.updateOutcome === 'up_to_date') maskedLog($, `mods-manager: auto-update of ${row.id}: ${result.message}`, { to: 'debug' })
      else if (result.ok) {
        await leaveRecord($, autoUpdatedText(row, result.oldVersion, result.newVersion, await $.clock.now()))
        outcome = 'updated'
      } else if (result.shown !== undefined) {
        // The command is masked in the reason only; the pause keeps it as claude showed it, for its sha256 (pauseAuto).
        const reason = shownReason(row, { ...result.shown, command: maskedText(result.shown.command) })
        pause = { reason, shown: result.shown.pluginId === row.id ? result.shown : undefined }
      } else pause = { reason: result.shownUnreadable ? unreadableReason(row, maskedText(result.message)) : `the update failed: ${maskedText(result.message)}`, shown: undefined }
    } catch (error) {
      pause = { reason: `the update failed: ${maskedText(messageOf(error))}`, shown: undefined }
    }
    if (pause !== undefined) await pauseAuto($, row, pause)
  } finally {
    setNow($, session, { busy: undefined, ...(outcome === 'updated' ? { needsRestart: true } : {}) })
  }
  return outcome
}

/**
 * One check of the automatic updates (TRDD-R2QYIN8O, 2k; owner question 10), run by the timer register.ts sets. It runs
 * nothing while the switch is off (isOn; the timer is set only while it is on, and a check that reads it off resolves
 * false, so the timer stops itself, TRDD-5IK59SQ2) or no row has opted in; nor in a session that cannot run claude
 * (changePath: $.process is CLI only, index.d.ts 3582), nor while a press or a read holds the claim, nor while another
 * session holds the lease (takeLease). It then reads the installed list and the catalogs of the opted-in rows that are not
 * paused. Before each of those rows it reads the switch, the row's opt-in and its pause again, so turning auto-update off,
 * opting the row out or pausing it meanwhile, in this session or another, during the lease's wait or an earlier row's
 * update, stops what is left (2k review). Then the pane's own check, before claude is called (blockReason; coordinator
 * review of M4b, findings 1 and 5): a row whose catalog entry declares a command, or whose marketplace's source is not the
 * one kept with its opt-in, pauses, whatever claude would do. Otherwise a row autoTargets picks is updated
 * (autoUpdateRow); a press that takes the claim between two rows stops the check. After an update the pane, when it was
 * opened, reads the list again under the claim, as after a change; a row claude then lists an error for pauses with it
 * (brokenReason). Every failure goes to the debug log, since nobody pressed anything, and resolves true: only the switch
 * read off stops the timer.
 */
export async function autoUpdateTick($: EngineInterface): Promise<boolean> {
  try {
    const first = await readAutoSettings($)
    if (!first.on) return false
    if (first.optIns.size === 0) return true
    if (changePath(await $.session.surfaces()) !== 'cli') return true
    const session = await $.session.id()
    if (stateIn(session).busy !== undefined || !(await takeLease($, session))) return true
    const root = await $.session.root()
    const listed = await listInstalled($)
    // isMod is not read: a check does not draw the rows, and the hooks file of each would be read for nothing.
    const rows = listed.entries.filter((entry) => appliesHere(entry, root)).map((entry) => toRow(entry, false))
    const candidates = rows.filter((row) => first.optIns.has(optInKey(row)) && !first.pauses.has(optInKey(row)))
    if (candidates.length === 0) return true
    const { latest, declaring, sources } = await readCatalogs($, candidates)
    const targets = new Set(autoTargets(candidates, latest, first.optIns, first.pauses).map(optInKey))
    const updated: Row[] = []
    for (const row of candidates) {
      const key = optInKey(row)
      const now = await readAutoSettings($)
      if (!now.on) break
      if (!now.optIns.has(key) || now.pauses.has(key)) continue
      const reason = blockReason(row, now.optIns.get(key), sources.get(row.marketplace), declaring.has(row.id))
      if (reason !== undefined) await pauseAuto($, row, { reason, shown: undefined })
      else if (targets.has(key)) {
        const outcome = await autoUpdateRow($, session, row)
        if (outcome === 'refused') break
        if (outcome === 'updated') updated.push(row)
      }
    }
    // An update can work and still leave its plugin broken: claude installs no dependency built by a command, goes ahead,
    // and lists the plugin with an error (measured on 2.1.318, M4b case B). So the list is read again after an update, and
    // a row claude lists an error for pauses with it (review round 2), instead of standing as updated with no word of it.
    if (updated.length > 0) {
      const after = (await listInstalled($)).entries
      for (const row of updated) {
        const errors = after.find((entry) => optInKey(entry) === optInKey(row))?.errors
        if (errors !== undefined) await pauseAuto($, row, { reason: brokenReason(errors.map((error) => maskedText(error))), shown: undefined })
      }
    }
    const state = stateIn(session)
    if (updated.length > 0 && state.loaded && claim(session, READING_LIST, { message: state.message }) === undefined) await readList($, session)
    else await readAutoView($)
  } catch (error) {
    maskedLog($, `mods-manager: the auto-update check failed: ${messageOf(error)}`, { to: 'debug' })
  }
  return true
}
