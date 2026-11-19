// cspell:ignore Uninsta Upda: each label cut at room 8 keeps its first seven characters, then an ellipsis.
// Tests of the mod-manager pane (TRDD-J4HRAQF0, increment 1, and TRDD-R2QYIN8O, increments 2d to 2l): the
// installed plugins in order, the mod marks, the latest version each marketplace offers and its update arrow, Update on a
// row and Update all, the details view with Open folder and Open homepage, the plugins a catalog lists that are not
// installed, a marketplace added from the pane, the question a press raises, the refusal of a press while claude reads
// the list, the command and its arguments, auto-update (2k: the switch, the opt-ins, the hourly check, its records,
// pauses and Review), and the rules under them. Every pane test mounts the pane on surface terminal
// and desktop at a narrow and a wide width, with the same assertions, except two: the session start that finds the pane
// still open mounts surface terminal at the wide width alone, and the add form on surface mobile mounts surface mobile
// alone. The claude CLI, the plugins' hooks files, the
// marketplaces' catalogs, the programs that open a folder or a link, and the clipboard are answered by the test, because
// a real claude would change the developer's own plugins and a real opener would open windows on the developer's desktop.
// The hooks module (index.ts) wires the pane and the session start,
// because the host refuses $.command.register from any module that does not call it. The engine's question reaches the
// test as an AskUserQuestion tool call: a test that sets `answer` picks a label there (the testing chapter's stub for
// $.ui.ask), and every other test leaves it unanswered, so the press's question is observed and nothing runs.
import type { EngineInterface } from 'claude-code'
import { describe, expect, mock, test, type MockClock, type Mounted } from 'claude-code/testing'

import {
  ENABLED_KEY,
  KEEP,
  NO_MARKETPLACE,
  UNKNOWN,
  UPDATE_ALL_LABEL,
  READING,
  OPENERS,
  aboutOf,
  actionArgv,
  actionCwd,
  actionsFor,
  addArgv,
  addDecision,
  addFailedText,
  addQuestion,
  appliesHere,
  askThenRun,
  availableDescription,
  availableKey,
  badgeText,
  cappedAvailable,
  catalogListing,
  catalogNote,
  catalogPath,
  catalogTargets,
  changedLine,
  changedSources,
  classifyAddSource,
  classifyHooks,
  compareVersions,
  confirmThenRun,
  currentText,
  detailLines,
  doneText,
  filterRows,
  findAvailable,
  fitLabel,
  hasUpdate,
  hookFilesOf,
  installLine,
  installRequest,
  installedIdsOf,
  isConfirmed,
  isRemoteSource,
  isMarketplaceName,
  isOnDemand,
  isWithin,
  keepsDetails,
  latestOf,
  linkOf,
  loadedVersion,
  lockedNote,
  manifestFolder,
  manifestPath,
  manifestVersionOf,
  marketplaceNameOf,
  openableFolder,
  openTargetOf,
  openerArgv,
  orderRows,
  paneIsOpen,
  parseCatalog,
  parseCommandArgs,
  parseInstalled,
  parseMarketplaces,
  printable,
  questionFor,
  rejectedText,
  reloadAnswerText,
  reloadFailedText,
  renamedSinceText,
  reportOf,
  rowHasUpdate,
  rowKey,
  sectionsOf,
  shownAbout,
  sourceText,
  toRow,
  updatableHere,
  updateAllLabel,
  updateAllQuestion,
  updateCount,
  updateEach,
  updateLine,
  updateNote,
  updateOutcomeOf,
  updateTargets,
  versionLine,
  webLink,
  type Action,
  type Available,
  type CatalogView,
  type Installed,
  type Latest,
  type Listing,
  type Row,
  type Scope,
} from '../mod-manager/logic'
import { confirmAndAct, confirmAndUpdateAll, refresh, refusedWhileOff, stateIn } from '../mod-manager/state'
import { startDebugLog } from '../debug-log/register'
import {
  AUTO_LEASE_KEY,
  AUTO_LOG_KEY,
  AUTO_LOG_SIZE,
  AUTO_LEASE_MS,
  AUTO_ON_LABEL,
  AUTO_OPT_INS_KEY,
  AUTO_PAUSES_KEY,
  AUTO_PERIOD_MS,
  AUTO_SETTLE_MS,
  AUTO_START_MS,
  OPT_IN_LABEL,
  RESUME_LABEL,
  SWITCH_QUESTION,
  autoTargets,
  autoUpdateArgv,
  blockReason,
  canAutoUpdate,
  autoUpdatedText,
  leaseHeldByOther,
  optInKey,
  optInQuestion,
  optInsOf,
  optInsOutsideText,
  pausesOf,
  pauseRecordsToSign,
  pausesOutsideText,
  recordsOf,
  PAUSE_REASON_MAX,
  pausedNote,
  reviewQuestion,
} from '../mod-manager/auto-update'
import { INSTALL_LABEL, installArgv } from '../mod-manager/install'
import { COPY_LINE_LABEL, acceptLine, parseCliResult } from '../mod-manager/results'
import { startAutoTimers } from '../mod-manager/auto-timer'
import { AUTO_UPDATE, FN, MOD_MANAGER_FUNCTIONS, MOD_MANAGER_SWITCHES, offText, switchesUnreadableText } from '../mod-manager/switches'
import { defineSwitches } from '../switches/register'
import { envelopeOf } from '../switches/logic'
import { TOOL, keyFor, signed } from './switch-world'
import { seedMasters } from './masters'

const SURFACES = ['terminal', 'desktop'] as const
// 16 columns leaves room 8 in the pane, so the Uninstall label must be cut; 160 leaves it whole.
const WIDTHS = [16, 160] as const
const PLACES = SURFACES.flatMap((surface) => WIDTHS.map((columns) => ({ surface, columns })))
// Absolute, because $.fs resolves a relative path against the working folder, yet no machine's path:
// <user> is a placeholder segment, which tests/test_no_absolute_paths.py does not count.
const HOME = '/home/<user>'
const CLAUDE = `${HOME}/.local/bin/claude`
const ROOT = '/work/app/sub'

// Six entries of `claude plugin list --json`. ddd-local is a local install made in /work/app, so it applies in
// ROOT; eee-elsewhere was made in another folder, so it does not.
const PLUGINS = [
  { id: 'aaa-mod@market-a', version: '1.0.0', scope: 'user', enabled: false, installPath: '/cache/market-a/aaa-mod/1.0.0' },
  { id: 'zzz-tool@market-a', version: '2.0.0', scope: 'user', enabled: true, installPath: '/cache/market-a/zzz-tool/2.0.0' },
  { id: 'mmm-mod@market-b', version: '0.3.0', scope: 'user', enabled: true, installPath: '/cache/market-b/mmm-mod/0.3.0' },
  { id: 'ccc-plain@market-b', version: '1.1.0', scope: 'user', enabled: false, installPath: '/cache/market-b/ccc-plain/1.1.0' },
  { id: 'ddd-local@market-a', version: '1.0.0', scope: 'local', enabled: true, installPath: '/cache/market-a/ddd-local/1.0.0', projectPath: '/work/app' },
  { id: 'eee-elsewhere@market-a', version: '1.0.0', scope: 'local', enabled: true, installPath: '/cache/market-a/eee-elsewhere/1.0.0', projectPath: '/elsewhere' },
]

// aaa-mod and mmm-mod are mods; zzz-tool has hooks but no modules; ccc-plain's file is malformed; ddd-local has no file;
// iii-in-place (IN_PLACE) has its file under its readFromFolder only.
const HOOKS: Record<string, string> = {
  '/cache/market-a/aaa-mod/1.0.0/hooks/hooks.json': '{"hooks": {}, "modules": ["./index.ts"]}',
  '/cache/market-b/mmm-mod/0.3.0/hooks/hooks.json': '{"modules": ["./index.ts"]}',
  '/cache/market-a/zzz-tool/2.0.0/hooks/hooks.json': '{"hooks": {}}',
  '/cache/market-b/ccc-plain/1.1.0/hooks/hooks.json': '{ not json',
  '/cache/market-c/fff-manifest/1.0.0/.claude-plugin/plugin.json': '{"hooks": ["./hooks/missing.json", "./hooks/band.json"]}',
  '/cache/market-c/fff-manifest/1.0.0/hooks/band.json': '{"modules": ["./band/register.tsx"]}',
  '/work/plugins/iii-in-place/hooks/hooks.json': '{"modules": ["./index.ts"]}',
}

// The order the pane must show with every section expanded: first the Enabled section with every enabled row of
// every marketplace (the enabled mod, then the other enabled plugins by name), then the disabled rows of each
// marketplace, marketplaces by name. Marketplace sections start collapsed, so by default only ORDER_ENABLED is drawn.
const ORDER_ENABLED = ['mm-toggle-mmm-mod@market-b|user', 'mm-toggle-ddd-local@market-a|local', 'mm-toggle-zzz-tool@market-a|user']
const ORDER = [...ORDER_ENABLED, 'mm-toggle-aaa-mod@market-a|user', 'mm-toggle-ccc-plain@market-b|user']

const QUESTION_DISABLE_ZZZ = 'Turn it off: zzz-tool (user scope)? It stops loading in your next session.'
const REFUSED_WHILE_READING = 'Wait: reading the installed plugins… is still running. Nothing was changed.'
// The busy text a list read holds, as state.ts names it.
const READING_LIST = 'reading the installed plugins…'
const REFUSED_WHILE_DISABLING = 'Wait: disable zzz-tool… is still running. Nothing was changed.'
const QUESTION_DISABLE_SYNCED = 'Turn it off: engineering (synced scope)? It stops loading in your next session. It is synced from claude.ai: to remove it, turn it off there.'
const QUESTION_DISABLE_SESSION = 'Turn it off: sss-session (session scope)? It stops loading in your next session. An installed copy with the same name, if there is one, loads instead.'
const MANAGED_NOTE = 'Managed by your organization: it cannot be changed here.'
const SIX_SCOPES = 'user, project, local, managed, session, synced'

// One entry of each scope `claude plugin list --json` reports (plugin commands chapter, line 337), every one enabled and
// applying in ROOT, so all six sit in the Enabled section, ordered by name. The synced entry has the shape Claude Code
// 2.1.316 printed for entry 525 of a real list (no projectPath), which the pane refused, blanking every row; its
// folder is a placeholder. The session id is `<name>@inline` and the managed one names its marketplace.
const SCOPED = [
  { id: 'uuu-user@market-a', version: '1.0.0', scope: 'user', enabled: true, installPath: '/cache/market-a/uuu-user/1.0.0' },
  { id: 'ppp-project@market-a', version: '1.0.0', scope: 'project', enabled: true, installPath: '/cache/market-a/ppp-project/1.0.0', projectPath: '/work/app' },
  { id: 'lll-local@market-a', version: '1.0.0', scope: 'local', enabled: true, installPath: '/cache/market-a/lll-local/1.0.0', projectPath: '/work/app' },
  { id: 'ggg-managed@market-org', version: '1.0.0', scope: 'managed', enabled: true, installPath: '/cache/market-org/ggg-managed/1.0.0' },
  { id: 'sss-session@inline', version: 'unknown', scope: 'session', enabled: true, installPath: '/work/plugins/sss-session' },
  { id: 'engineering@synced', version: '1.2.0', scope: 'synced', enabled: true, installPath: `${HOME}/.claude/plugins/synced/<org>_<account>/engineering` },
]

// A plugin loaded in place (plugin commands chapter, line 340): Claude Code reads it from readFromFolder, and its
// installPath holds nothing, so only the hooks file in readFromFolder marks it as a mod (see HOOKS).
const IN_PLACE = { id: 'iii-in-place@market-d', version: '1.0.0', scope: 'user', enabled: true, installPath: '/cache/market-d/iii-in-place/1.0.0', readFromFolder: '/work/plugins/iii-in-place' }
// A plugin from a skills folder lists as user or project scope, with the reserved origin skills-dir as its marketplace.
const SKILLS_DIR_ENTRY = { id: 'kkk-skill@skills-dir', version: '0.0.1', scope: 'user', enabled: true, installPath: `${HOME}/.claude/skills/kkk-skill` }
const SKILLS_DIR_NOTE = 'Loaded from a skills folder: delete its folder to remove it.'
const REFUSED_ID_NOTE = 'No change is offered: its id is not a lowercase name@marketplace.'
// An entry of a scope the pane does not know, listed after the six of PLUGINS, so it is entry 6.
const ODD = { id: 'odd-tool@market-x', version: '1.0.0', scope: 'team', enabled: true, installPath: '/cache/market-x/odd-tool/1.0.0' }
const ODD_LINE = `Entry 6 of the plugin list (odd-tool@market-x) is not shown: scope "team" is not one of ${SIX_SCOPES}.`
const LIST_FAILED = 'the plugin settings could not be read'

// The marketplaces `claude plugin marketplace list --json` answers in withCatalogs (plugin commands chapter, "plugin
// marketplace list"). market-a and market-b hold installed rows; market-c holds none, so its catalog is not read on open,
// only when its own section is opened (2f); market-org is hosted on claude.ai and has no local copy.
const MARKETS = `${HOME}/.claude/plugins/marketplaces`
const MARKET_A = `${MARKETS}/market-a`
const MARKET_B = `${MARKETS}/market-b`
const MARKET_C = `${MARKETS}/market-c`
const MARKETPLACES = [
  { name: 'market-a', source: 'github', repo: 'org/market-a', installLocation: MARKET_A },
  { name: 'market-b', source: 'directory', path: '/src/market-b', installLocation: MARKET_B },
  { name: 'market-c', source: 'github', repo: 'org/market-c', installLocation: MARKET_C },
  { name: 'market-org', source: 'claudeai', marketplaceId: 'marketplace-1', status: 'active' },
]
const MARKETPLACES_FAILED = 'the marketplaces could not be listed'
const CATALOG_A = `${MARKET_A}/.claude-plugin/marketplace.json`
const CATALOG_B = `${MARKET_B}/.claude-plugin/marketplace.json`
const DDD_MANIFEST = `${MARKET_A}/plugins/ddd-local/.claude-plugin/plugin.json`
const AAA_MANIFEST = `${MARKET_A}/plugins/aaa-mod/.claude-plugin/plugin.json`
/**
 * market-a's catalog, with zzz-tool's version given: zzz-tool comes from GitHub, so its latest version is the one the
 * catalog lists (its own manifest is not fetched); aaa-mod sits in the marketplace and its entry says 9.9.9, but its
 * plugin.json says 1.0.0, which wins as it does at install time, so no arrow; ddd-local is a bare name under pluginRoot
 * with no version, so its plugin.json (1.1.0) gives it. `extra` adds entries after those three, for one test's own rows,
 * and `zzzFields` adds fields to zzz-tool's entry, such as the display fields of 2i.
 */
const catalogA = (zzz: string, extra: readonly unknown[] = [], zzzFields: Record<string, unknown> = {}): string =>
  JSON.stringify({
    name: 'market-a',
    metadata: { pluginRoot: './plugins' },
    plugins: [
      { name: 'zzz-tool', source: { source: 'github', repo: 'org/zzz-tool' }, version: zzz, ...zzzFields },
      { name: 'aaa-mod', source: './plugins/aaa-mod', version: '9.9.9' },
      { name: 'ddd-local', source: 'ddd-local' },
      ...extra,
    ],
  })
// market-b's catalog: mmm-mod sits at the marketplace's root with no plugin.json there, so its entry's version (not plain
// numbers) is the latest; ccc-plain comes from a command, whose version Claude Code ignores.
const CATALOG_FILES: Record<string, string> = {
  [CATALOG_A]: catalogA('10.0.0'),
  [CATALOG_B]: JSON.stringify({
    plugins: [
      { name: 'mmm-mod', source: './', version: '0.4.0-beta' },
      { name: 'ccc-plain', source: { source: 'command', command: 'make' }, version: '9.0.0' },
    ],
  }),
  [`${MARKET_C}/.claude-plugin/marketplace.json`]: JSON.stringify({ plugins: [{ name: 'zzz-tool', source: './zzz', version: '99.0.0' }] }),
  [DDD_MANIFEST]: '{"name": "ddd-local", "version": "1.1.0"}',
  [AAA_MANIFEST]: '{"name": "aaa-mod", "version": "1.0.0"}',
}
// With CATALOG_FILES, each version line of PLUGINS once every section is open, and whether it is drawn dim. 10.0.0 is
// newer than 2.0.0 only when compared as numbers; aaa-mod's line is plugin.json's 1.0.0, not its entry's 9.9.9.
// zzz-tool's line says "catalog lists": its source is GitHub, whose own manifest the pane does not read (2d review F1).
const LATEST_LINES: ReadonlyArray<readonly [string, boolean]> = [
  ['2.0.0 · ↑ catalog lists 10.0.0 · market-a · user scope', false],
  ['1.0.0 · ↑ latest 1.1.0 · market-a · local scope', false],
  ['1.0.0 · latest 1.0.0 · market-a · user scope', true],
  ['0.3.0 · latest 0.4.0-beta · market-b · user scope', true],
  ['1.1.0 · latest unknown · market-b · user scope', true],
]
const READING_CATALOGS = 'Reading the marketplace catalogs…'

// 2e: with CATALOG_FILES, the two rows with an update arrow in the order the pane draws them (both are in the Enabled
// section), the update each runs, and the questions their presses raise.
const UPDATE_KEYS = ['mm-update-ddd-local@market-a|local', 'mm-update-zzz-tool@market-a|user']
const UPDATE_ZZZ = [CLAUDE, 'plugin', 'update', 'zzz-tool@market-a', '--scope', 'user']
const UPDATE_DDD = [CLAUDE, 'plugin', 'update', 'ddd-local@market-a', '--scope', 'local']
const QUESTION_UPDATE_ZZZ = 'Update it: zzz-tool (user scope)? The latest version its marketplace offers loads in your next session.'
const QUESTION_UPDATE_DDD = 'Update it: ddd-local (local scope)? The latest version its marketplace offers loads in your next session.'
const UPDATE_ALL_EFFECT = 'Each gets the latest version its marketplace offers, one after another, and loads in your next session.'
const QUESTION_UPDATE_ALL_2 = `Update all 2 plugins: ddd-local (local scope), zzz-tool (user scope)? ${UPDATE_ALL_EFFECT}`
const QUESTION_UPDATE_ALL_ZZZ = `Update all 1 plugin: zzz-tool (user scope)? ${UPDATE_ALL_EFFECT}`
const SUMMARY_ONE_UPDATED_ONE_FAILED = 'Update all: 1 updated, 0 already current, 1 failed.'
const SUMMARY_TWO_CURRENT = 'Update all: 0 updated, 2 already current, 0 failed.'
// 2h: the line also points to Reload (plugin commands chapter, line 269: "or after you run /reload-plugins").
const NEXT_SESSION = 'Changes apply in your next session, or after a reload.'
// 2e review spec/F3: an update that finds nothing newer says only that, never that nothing was installed.
const CURRENT_ZZZ = 'No newer version of zzz-tool was found.'

// 2h: the status-line badge. With CATALOG_FILES two rows have an arrow (zzz-tool and ddd-local, LATEST_LINES).
const BADGE_TWO = '2 plugin updates · /mods-manager'
const BADGE_ONE = '1 plugin update · /mods-manager'
// 2h: Reload. What /reload-plugins answers in a test: its summary line (plugin commands chapter, line 863), then a second
// line with a control character, so the pane's message shows the lines joined into one and the character as ?.
const RELOADED = 'Reloaded: 6 plugins · 3 skills · 2 agents · 4 hooks · 0 plugin LSP servers\n  1 error\u001b[2J during load. Run /plugin for details.'
const RELOADED_MESSAGE = '/reload-plugins answered: Reloaded: 6 plugins · 3 skills · 2 agents · 4 hooks · 0 plugin LSP servers 1 error?[2J during load. Run /plugin for details.'
const RELOAD_LABEL = 'l: Reload plugins'
// The busy text a reload holds, as state.ts names it, and the toast of a press it refuses.
const RELOADING = 'reloading the plugins once the session is idle…'
const REFUSED_WHILE_RELOADING = `Wait: ${RELOADING} is still running. Nothing was changed.`

// 2e review spec/F2: an archive entry that sets a headersHelper (hhh-archive), and a GitHub entry that sets one too, which
// has no effect on a source that is not an archive (marketplace manifest chapter, line 480), so jjj-github still updates.
const HELPER_ARCHIVE_SOURCE = { source: 'archive', url: 'https://registry.example.invalid/hhh-archive-1.2.0.zip' }
const HELPER_ENTRIES = [
  { name: 'hhh-archive', source: HELPER_ARCHIVE_SOURCE, strict: false, headersHelper: '/opt/bin/mint-registry-token.sh', version: '1.2.0' },
  { name: 'jjj-github', source: { source: 'github', repo: 'org/jjj-github' }, headersHelper: '/opt/bin/mint-registry-token.sh', version: '1.2.0' },
]
const HELPER_ARCHIVE_ROW = { id: 'hhh-archive@market-a', version: '1.1.0', scope: 'user', enabled: true, installPath: '/cache/market-a/hhh-archive/1.1.0' }
const HELPER_GITHUB_ROW = { id: 'jjj-github@market-a', version: '1.1.0', scope: 'user', enabled: true, installPath: '/cache/market-a/jjj-github/1.1.0' }
const TERMINAL_NOTE = 'Update it from your own terminal with claude plugin update: claude asks you there to accept its headers helper, and cannot ask here.'
const QUESTION_UPDATE_ALL_JJJ = `Update all 1 plugin: jjj-github (user scope)? ${UPDATE_ALL_EFFECT}`

// 2e review tests/F5: seven enabled rows of market-a, each with a newer version in the catalog, so Update all names five
// and counts two. SEVEN_ORDER is the order orderRows gives them (by name).
const SEVEN_NAMES = ['one', 'two', 'three', 'four', 'five', 'six', 'seven']
const SEVEN_ORDER = ['five', 'four', 'one', 'seven', 'six', 'three', 'two']
const SEVEN = SEVEN_NAMES.map((name) => ({ id: `${name}-tool@market-a`, version: '1.0.0', scope: 'user', enabled: true, installPath: `/cache/market-a/${name}-tool/1.0.0` }))
const SEVEN_CATALOG = JSON.stringify({ plugins: SEVEN_NAMES.map((name) => ({ name: `${name}-tool`, source: { source: 'github', repo: `org/${name}-tool` }, version: '2.0.0' })) })
const QUESTION_UPDATE_ALL_7 = `Update all 7 plugins: five-tool (user scope), four-tool (user scope), one-tool (user scope), seven-tool (user scope), six-tool (user scope) and 2 more? ${UPDATE_ALL_EFFECT}`

// 2e review tests/F6: a managed plugin from a marketplace with a local copy, so it gets a latest version and an arrow.
const MARKET_M = `${MARKETS}/market-m`
const CATALOG_M = `${MARKET_M}/.claude-plugin/marketplace.json`
const MARKET_M_ENTRY = { name: 'market-m', source: 'github', repo: 'org/market-m', installLocation: MARKET_M }
const CATALOG_M_TEXT = JSON.stringify({ plugins: [{ name: 'ggg-managed', source: { source: 'github', repo: 'org/ggg-managed' }, version: '1.1.0' }] })
const MANAGED_ROW = { id: 'ggg-managed@market-m', version: '1.0.0', scope: 'managed', enabled: true, installPath: '/cache/market-m/ggg-managed/1.0.0' }
const ONLY_UPDATE_NOTE = 'Managed by your organization: only an update is offered here.'

// 2e review spec/F1: market-d was added from a local folder, so its installLocation is that folder, and IN_PLACE loads in
// place from its iii-in-place folder, whose plugin.json says 1.1.0.
const MARKET_D = '/work/plugins'
const MARKET_D_ENTRY = { name: 'market-d', source: 'directory', path: MARKET_D, installLocation: MARKET_D }
const IN_PLACE_FILES: Record<string, string> = {
  [`${MARKET_D}/.claude-plugin/marketplace.json`]: JSON.stringify({ plugins: [{ name: 'iii-in-place', source: './iii-in-place', version: '1.0.0' }] }),
  [`${MARKET_D}/iii-in-place/.claude-plugin/plugin.json`]: '{"name": "iii-in-place", "version": "1.1.0"}',
}

/** Gives a world the marketplaces and a fresh copy of their catalog files. */
function withCatalogs(w: World): World {
  w.marketplaces = MARKETPLACES
  w.files = { ...CATALOG_FILES }
  return w
}

/** The --json result of an update that worked, in the shape measured on 2.1.318. */
const updatedJson = (id: string, oldVersion: string, newVersion: string): string =>
  JSON.stringify({ command: 'update', outcome: 'ok', plugin: id, pluginId: id, scope: 'user', message: `updated from ${oldVersion} to ${newVersion}`, updateOutcome: 'updated', oldVersion, newVersion })

/** A promise the test resolves by hand: it holds the next claude call until the test lets it finish. */
function deferred(): { promise: Promise<void>; resolve: () => void } {
  let release: () => void = () => undefined
  const promise = new Promise<void>((done) => {
    release = done
  })
  return { promise, resolve: () => release() }
}

type World = {
  clock: MockClock
  session: string
  root: string
  /** False: claude is at none of its candidate places. */
  claudeFound: boolean
  /** True: the next `claude plugin list` exits 1 with LIST_FAILED. */
  listFails: boolean
  /** Every process.run, with the folder it ran in. */
  calls: Array<{ argv: string[]; cwd: string | undefined }>
  /** When set, the next claude call waits on it before it finishes. */
  hold: ReturnType<typeof deferred> | undefined
  /** What `claude plugin marketplace list --json` answers; empty unless a test hands it marketplaces (withCatalogs). */
  marketplaces: unknown[]
  /**
   * When set, every `claude plugin marketplace list` exits 1 with MARKETPLACES_FAILED on this stream and nothing on the
   * other, as claude may print its error on either (2d review F7).
   */
  marketFails: false | 'stderr' | 'stdout'
  /** When set, the next `claude plugin marketplace list` waits on it before it answers. */
  marketHold: ReturnType<typeof deferred> | undefined
  /** Files of the marketplaces' local copies, by path: $.fs.exists sees them and $.fs.read reads them. */
  files: Record<string, string>
  /** Paths that exist (for $.fs.exists) but whose $.fs.read the test refuses. */
  refused: string[]
  /** Every $.fs.read path, in order. */
  reads: string[]
  /** The question of every AskUserQuestion the engine raised for a press. */
  asked: string[]
  commands: string[]
  tools: string[]
  opened: unknown[]
  toasts: string[]
  /** Every $.ui.log line, with the sink it was sent to. */
  logs: Array<{ text: string; to: string | undefined }>
  /** When set, the label every AskUserQuestion is answered with; undefined leaves each question unanswered. */
  answer: string | undefined
  /** When set, the next AskUserQuestion waits on it before it answers, so the question stays open meanwhile. */
  answerHold: ReturnType<typeof deferred> | undefined
  /** When set, hears each toast's text as the toast is shown, so a test can press at that moment. */
  onToast: ((text: string) => void) | undefined
  /** Plugin ids whose `claude plugin update` exits 1, with the stderr it prints. */
  updateFails: Record<string, string>
  /** Plugin ids whose `claude plugin update` finds nothing newer: exit 0 with the chapter's "already at the latest version" line. */
  updateCurrent: string[]
  /** The stream that line is printed on (stdout by default; the chapter names none). */
  updateCurrentOn: 'stdout' | 'stderr'
  /** 2h: the text of every $.ui.status call, in order (undefined clears the line). */
  statuses: Array<string | undefined>
  /** 2h: what $.ui.panes answers: this plugin's open panes. Empty unless a test opens one. */
  panes: Array<{ id: string; title: string; isShown: boolean; isFocused: boolean; isPlaced: boolean }>
  /** 2h: the args of every /reload-plugins the mod ran through $.command.run. */
  reloads: string[]
  /** 2h: the text /reload-plugins answers. */
  reloadText: string | undefined
  /** 2h: true, /reload-plugins throws, so the mod's $.command.run rejects. */
  reloadFails: boolean
  /** 2h: when set, the next /reload-plugins waits on it before it answers. */
  reloadHold: ReturnType<typeof deferred> | undefined
  /** 2h: true, $.ui.panes is refused, so the start cannot tell whether the pane is open. */
  panesFails: boolean
  /** The read of a store key refused as a store that cannot be read refuses it: its occurrence-th read, counted from the test's setting it. */
  /** The store.get of this key, at this occurrence, is refused with this reason. */
  failGet: { key: string; occurrence: number; reason: string } | undefined
  /** 2i: the paths and programs that exist (OPENERS and the paths each one requires), for $.fs.exists and process.run; none unless a test names some. */
  openers: string[]
  /** 2i: the exit code each opener answers with; 0 for one not named here. */
  openerExit: Record<string, number>
  /** 2i: the text and the surface of every $.ui.copy, in order. */
  copies: Array<{ text: string; surface: string | undefined }>
  /** 2i: what $.ui.copy answers. */
  copyResult: { isCopied: true } | { isCopied: false; reason: string }
  /** 2i: when set, the next $.fs.read of this path waits on the gate before it answers. */
  readHold: { path: string; gate: ReturnType<typeof deferred> } | undefined
  /** 2l: the argumentHint each command registered with, by name. */
  hints: Record<string, unknown>
  /** 2l: the id of every pane the mod closed with $.ui.close, in order. */
  closes: string[]
  /** 2j: the exit code of `claude plugin marketplace add`. */
  addExit: number
  /** 2f Install: what `claude plugin install <id>` answers, by id; an install that worked for an id not named here. */
  installResults: Record<string, { exitCode: number; stdout: string; stderr?: string }>
  /** 2k: what `claude plugin update <id> --json` answers, by id; an update that worked for an id not named here. */
  updateJson: Record<string, { exitCode: number; stdout: string; stderr?: string }>
  /** 2k: the ids whose update with --json is refused by $.process.run itself, as a timeout is, with this message. */
  updateDenies: Record<string, string>
  /** 2k: the timeout each update with --json was run with, in order. */
  updateTimeouts: unknown[]
  /** 2k: the plugin's store, empty at the start of each world, as a fresh install's is; a test reads what the mod saved here. */
  store: Map<string, unknown>
  /** TRDD-5IK59SQ2: every store call of the mod, in order (`get <key>`, `set <key>`): what a check read, and when (idle). */
  storeOps: string[]
  /** otherProgress when the last store call was a read of a signed key, whose digest is still to come; undefined after any other. */
  signedReadAt: number | undefined
  /** What $.session.surfaces answers: a terminal session unless a test names others (2k: a Desktop-only session runs no check). */
  surfaces: string[]
  /** 2f Install: labels the next questions are answered with, in order, before `answer` applies again. */
  answerQueue: string[]
  /** 2j: when set, runs as an add lands, before it answers. */
  onAdd: (() => void) | undefined
}

// `listed` is what claude answers as JSON, so a test can hand it an entry of any shape, a malformed one included.
function world(on: any, listed: readonly unknown[] = PLUGINS): World {
  const w: World = {
    clock: mock.clock(on, { now: 1_000 }),
    session: 'sess-1',
    root: ROOT,
    claudeFound: true,
    listFails: false,
    calls: [],
    hold: undefined,
    marketplaces: [],
    marketFails: false,
    marketHold: undefined,
    files: {},
    refused: [],
    reads: [],
    asked: [],
    commands: [],
    tools: [],
    opened: [],
    toasts: [],
    logs: [],
    answer: undefined,
    answerHold: undefined,
    onToast: undefined,
    updateFails: {},
    updateCurrent: [],
    updateCurrentOn: 'stdout',
    statuses: [],
    panes: [],
    reloads: [],
    reloadText: RELOADED,
    reloadFails: false,
    reloadHold: undefined,
    panesFails: false,
    failGet: undefined,
    openers: [],
    openerExit: {},
    copies: [],
    copyResult: { isCopied: true },
    readHold: undefined,
    hints: {},
    closes: [],
    addExit: 0,
    onAdd: undefined,
    installResults: {},
    updateJson: {},
    updateDenies: {},
    updateTimeouts: [],
    store: new Map(),
    storeOps: [],
    signedReadAt: undefined,
    surfaces: ['terminal'],
    answerQueue: [],
  }
  // The session start beneath the plugin's own: index.ts runs every mod's start, startModManager among them, then the kit answers with this.
  on('session.start', ($: any, e: any) => ({ cwd: e.cwd }))
  // 2k: the plugin's store, answered from w.store through JSON, as the store's file keeps it, so a test can set what the
  // mod reads and read what it saved, and neither side can change the other's value in place (2k review).
  const json = (value: unknown): unknown => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)))
  seedMasters(on, { read: (key) => (w.store.has(key) ? { value: json(w.store.get(key)) } : undefined) })
  on('store.get', ($: any, e: any) => {
    w.storeOps.push(`get ${e.key}`)
    if (w.failGet !== undefined && w.failGet.key === e.key && --w.failGet.occurrence === 0) {
      const reason = w.failGet.reason
      w.failGet = undefined
      w.signedReadAt = undefined
      return { deny: reason }
    }
    // A read of a pane function's switch (C6b) neither sets nor clears the mark (PANE_FUNCTION_KEYS says why). Clearing it,
    // as 37c09d6 did, let a drawing's reads wipe the mark of a real signed read whose digest still ran in the mod's own
    // realm, which the kit cannot see, so idle returned before that read's flow ended (TRDD-5IK59SQ2).
    if (!PANE_FUNCTION_KEYS.has(e.key)) w.signedReadAt = isSignedKey(e.key) ? otherProgress(w) : undefined
    return { value: json(w.store.get(e.key)) }
  })
  on('store.set', ($: any, e: any) => {
    w.storeOps.push(`set ${e.key}`)
    w.signedReadAt = undefined
    w.store.set(e.key, json(e.value))
    return { value: undefined }
  })
  on('session.id', () => ({ value: w.session }))
  on('session.root', () => ({ value: w.root }))
  // The pane's refresh also reads the profile list, which asks where the session draws (P2a); a terminal session here.
  on('session.surfaces', () => ({ value: w.surfaces }))
  on('env.get', ($: any, e: any) => ({ value: e.name === 'HOME' ? HOME : undefined }))
  on('fs.exists', ($: any, e: any) => ({ value: (w.claudeFound && e.path === CLAUDE) || e.path in w.files || w.refused.includes(e.path) || w.openers.includes(e.path) }))
  on('fs.stat', () => ({ value: { kind: 'file' } }))
  on('fs.read', async ($: any, e: any) => {
    w.reads.push(e.path)
    if (w.readHold !== undefined && w.readHold.path === e.path) {
      const { gate } = w.readHold
      w.readHold = undefined
      await gate.promise
    }
    // A refused read rejects with its path in the reason, as a real EACCES names it, so a test can check how a line that
    // names it is masked (item 3 sweep, G2); a throw here would reach the mod as no answer at all.
    if (w.refused.includes(e.path)) return { deny: `EACCES: ${e.path}` }
    if (e.path in HOOKS) return { value: HOOKS[e.path] }
    if (e.path in w.files) return { value: w.files[e.path] }
    throw new Error(`ENOENT: ${e.path}`)
  })
  on('process.run', async ($: any, e: any) => {
    w.calls.push({ argv: e.argv, cwd: e.init?.cwd })
    if (w.hold !== undefined) {
      const hold = w.hold
      w.hold = undefined
      await hold.promise
    }
    // 2i: a program that opens a folder or a link (OPENERS) answers its exit code, 0 unless openerExit names another.
    if (w.openers.includes(String(e.argv[0]))) {
      const exitCode = w.openerExit[String(e.argv[0])] ?? 0
      return { value: { exitCode, stdout: '', stderr: exitCode === 0 ? '' : 'it could not open that', isStdoutTruncated: false, isStderrTruncated: false } }
    }
    if (e.argv[2] === 'list' && w.listFails) return { value: { exitCode: 1, stdout: '', stderr: LIST_FAILED, isStdoutTruncated: false, isStderrTruncated: false } }
    if (e.argv[2] === 'list') return { value: { exitCode: 0, stdout: JSON.stringify(listed), stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
    if (e.argv[2] === 'marketplace' && e.argv[3] === 'list') {
      if (w.marketHold !== undefined) {
        const hold = w.marketHold
        w.marketHold = undefined
        await hold.promise
      }
      if (w.marketFails === 'stderr') return { value: { exitCode: 1, stdout: '', stderr: MARKETPLACES_FAILED, isStdoutTruncated: false, isStderrTruncated: false } }
      if (w.marketFails === 'stdout') return { value: { exitCode: 1, stdout: `Listing…\n${MARKETPLACES_FAILED}\n`, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
      return { value: { exitCode: 0, stdout: JSON.stringify(w.marketplaces), stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
    }
    // 2j: claude plugin marketplace add exits addExit; a failed one prints a first line with a control character on
    // stdout and more on stderr. onAdd runs when the add lands, so a test can change the marketplace list it leaves.
    if (e.argv[2] === 'marketplace' && e.argv[3] === 'add') {
      w.onAdd?.()
      const failed = w.addExit !== 0
      return { value: { exitCode: w.addExit, stdout: failed ? 'Adding…\u0007\nfailed to add' : '', stderr: failed ? 'details' : '', isStdoutTruncated: false, isStderrTruncated: false } }
    }
    // 2f Install: the answer installResults names for the id, else the --json result of an install that worked (measured shape, 2.1.318).
    if (e.argv[2] === 'install') {
      const id = String(e.argv[3])
      const named = w.installResults[id]
      const stdout = named?.stdout ?? JSON.stringify({ command: 'install', outcome: 'ok', plugin: id, pluginId: id, scope: 'user', message: `Successfully installed plugin: ${id} (scope: user)` })
      return { value: { exitCode: named?.exitCode ?? 0, stdout, stderr: named?.stderr ?? '', isStdoutTruncated: false, isStderrTruncated: false } }
    }
    // 2k: an update run with --json answers the result line measured on 2.1.318: the one updateJson names for the id, else
    // an update that worked from 2.0.0 to 10.0.0.
    if (e.argv[2] === 'update' && e.argv.includes('--json')) {
      const id = String(e.argv[3])
      w.updateTimeouts.push(e.init?.timeoutMs)
      if (w.updateDenies[id] !== undefined) return { deny: w.updateDenies[id] }
      const named = w.updateJson[id] ?? { exitCode: 0, stdout: updatedJson(id, '2.0.0', '10.0.0') }
      return { value: { exitCode: named.exitCode, stdout: named.stdout, stderr: named.stderr ?? '', isStdoutTruncated: false, isStderrTruncated: false } }
    }
    if (e.argv[2] === 'update') {
      const id = String(e.argv[3])
      const checking = `Checking for updates for plugin "${id}"…`
      const failed = w.updateFails[id]
      if (failed !== undefined) return { value: { exitCode: 1, stdout: checking, stderr: failed, isStdoutTruncated: false, isStderrTruncated: false } }
      // The line the plugin commands chapter (line 288) gives for an update that finds nothing newer, which still exits 0.
      // The chapter names no stream for it, so the test prints it on the one updateCurrentOn names.
      if (w.updateCurrent.includes(id)) {
        const current = `${id.split('@')[0]} is already at the latest version (1.0.0).`
        const [stdout, stderr] = w.updateCurrentOn === 'stdout' ? [`${checking}\n${current}`, ''] : [checking, current]
        return { value: { exitCode: 0, stdout, stderr, isStdoutTruncated: false, isStderrTruncated: false } }
      }
    }
    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  // The engine raises its question as this tool call. The test records it and, when `answer` is set, picks that label, in
  // the stub shape the testing chapter gives for $.ui.ask; otherwise it leaves the question unanswered.
  on('tool.call', { tool: 'AskUserQuestion' }, async ($: any, e: any) => {
    const question = String(e.questions?.[0]?.question)
    w.asked.push(question)
    if (w.answerHold !== undefined) {
      const hold = w.answerHold
      w.answerHold = undefined
      await hold.promise
    }
    const label = w.answerQueue.shift() ?? w.answer
    if (label !== undefined) return { result: { answers: { [question]: label } } }
    return { deny: 'no one answered in a test' }
  })
  on('command.register', ($: any, e: any) => {
    w.commands.push(e.name)
    w.hints[e.name] = e.argumentHint
    return { value: { command: e.name } }
  })
  on('tool.register', ($: any, e: any) => {
    w.tools.push(e.name)
    return { value: { tool: e.name } }
  })
  on('ui.log', ($: any, e: any) => {
    w.logs.push({ text: e.text, to: e.to })
    return { value: undefined }
  })
  on('ui.toast', ($: any, e: any) => {
    w.toasts.push(e.text)
    w.onToast?.(e.text)
    return { value: undefined }
  })
  // 2h: the status line, the open panes, and /reload-plugins. Only /reload-plugins reaches the command.run stub: the
  // mods-manager command is answered by the mod's own hook (the probe-runner tests' shape). A throw makes the mod's
  // $.command.run reject, as the engine's refusal does.
  on('ui.status', ($: any, e: any) => {
    w.statuses.push(e.text)
    return { value: undefined }
  })
  on('ui.panes', () => (w.panesFails ? { deny: 'the pane list was refused in a test' } : { value: w.panes }))
  on('command.run', async ($: any, e: any) => {
    if (e.command !== 'reload-plugins') return {}
    w.reloads.push(e.args)
    if (w.reloadHold !== undefined) {
      const hold = w.reloadHold
      w.reloadHold = undefined
      await hold.promise
    }
    if (w.reloadFails) throw new Error('the reload was refused in a test')
    return { text: w.reloadText }
  })
  on('ui.open', ($: any, e: any) => {
    w.opened.push(e)
    return { value: { isPlaced: true } }
  })
  // 2i: the clipboard of the surface a press came from. The test records the text and the surface, and answers copyResult.
  on('ui.copy', ($: any, e: any) => {
    w.copies.push({ text: e.text, surface: e.surface })
    return { value: w.copyResult }
  })
  // 2l: the panes the mod closes with $.ui.close, by id.
  on('ui.close', ($: any, e: any) => {
    w.closes.push(e.id)
    return { value: undefined }
  })
  return w
}

/** True for the two reads, `claude plugin list` and `claude plugin marketplace list`: every other claude call changes something. */
const isRead = (argv: readonly string[]): boolean => argv[2] === 'list' || (argv[2] === 'marketplace' && argv[3] === 'list')
const actions = (w: World) => w.calls.filter((call) => !isRead(call.argv))

function start($: any, surface: (typeof SURFACES)[number]) {
  return $.session.start({ surface, isInteractive: true, cwd: ROOT })
}

function openPane($: any) {
  return $.command.run({ command: 'mods-manager', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } })
}

function pane(surface: (typeof SURFACES)[number], columns: number) {
  return {
    plugin: 'mods-expert-developer-plugin',
    surface,
    component: 'Pane' as const,
    requestId: 'mod-manager',
    viewport: { columns, rows: 40 },
    props: { title: 'Mods', isFocused: true, bodyColumns: columns - 4, placement: 'inline', scroll: { offset: 0, bodyRows: 36 }, view: {} },
  } as any
}

/** Starts a session for a fresh session id, opens the pane, lets the read finish, and mounts it. */
async function openAndMount($: any, w: World, session: string, surface: (typeof SURFACES)[number], columns: number): Promise<Mounted<'terminal' | 'desktop'>> {
  w.session = session
  await start($, surface)
  await openPane($)
  await idle(w)
  return $.ui.mount(pane(surface, columns))
}

const toggleKeys = async (ui: Mounted<'terminal' | 'desktop'>): Promise<string[]> =>
  (await ui.findAll({ type: 'Button' })).map((b) => b.key).filter((key): key is string => key !== undefined && key.startsWith('mm-toggle-'))

/** The keys of every row button, Turn on or off and Uninstall, in the order drawn. */
const rowButtonKeys = async (ui: Mounted<'terminal' | 'desktop'>): Promise<string[]> =>
  (await ui.findAll({ type: 'Button' })).map((b) => b.key).filter((key): key is string => key !== undefined && /^mm-(toggle|remove)-/.test(key))

const sectionLabel = (ui: Mounted<'terminal' | 'desktop'>, key: string): Promise<string | undefined> => ui.find({ key }).then((b) => (b === undefined ? undefined : String(b.props.label)))

/** The keys of every row's Update button, in the order drawn; the pane's Update all button is not one of them. */
const updateKeys = async (ui: Mounted<'terminal' | 'desktop'>): Promise<string[]> =>
  (await ui.findAll({ type: 'Button' })).map((b) => b.key).filter((key): key is string => key !== undefined && key.startsWith('mm-update-') && key !== 'mm-update-all')

/** Opens the two marketplace sections of disabled rows, which start collapsed. */
async function expandOff(ui: Mounted<'terminal' | 'desktop'>, w: World): Promise<void> {
  for (const key of ['mm-sec-market-a', 'mm-sec-market-b']) {
    await ui.press({ key })
    await idle(w)
  }
}

describe('the installed plugins pane', () => {
  test('lists every enabled row first (mods, then the other plugins), then the disabled rows by marketplace, and marks each mod', async ($, on) => {
    const w = world(on)
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `order-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ type: 'Text', text: '5 installed · 3 active · 2 mods' })).toBeDefined()
      // The marketplace sections start collapsed: only the Enabled section's rows are drawn.
      expect(await toggleKeys(ui)).toEqual(ORDER_ENABLED)
      await expandOff(ui, w)
      expect(await toggleKeys(ui)).toEqual(ORDER)
      expect(await ui.findAll({ type: 'Text', text: /^mod$/ })).toHaveLength(2)
      await ui.unmount()
    }
  })

  test('with every section expanded, every enabled row is above every disabled row, and enabled mods are above enabled plugins', async ($, on) => {
    const w = world(on)
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `above-${surface}-${columns}`, surface, columns)
      await expandOff(ui, w)
      const keys = await toggleKeys(ui)
      const at = (row: string) => keys.indexOf(`mm-toggle-${row}`)
      const enabled = ['mmm-mod@market-b|user', 'ddd-local@market-a|local', 'zzz-tool@market-a|user'].map(at)
      const disabled = ['aaa-mod@market-a|user', 'ccc-plain@market-b|user'].map(at)
      expect(Math.min(...enabled, ...disabled)).toBeGreaterThanOrEqual(0)
      // aaa-mod is a disabled mod of market-a: under the per-marketplace layout it sat above market-b's enabled mmm-mod.
      expect(Math.max(...enabled)).toBeLessThan(Math.min(...disabled))
      expect(at('mmm-mod@market-b|user')).toBeLessThan(at('ddd-local@market-a|local'))
      expect(at('mmm-mod@market-b|user')).toBeLessThan(at('zzz-tool@market-a|user'))
      await ui.unmount()
    }
  })

  test('the Enabled section lists the enabled rows of two marketplaces, and no row is drawn twice', async ($, on) => {
    const w = world(on)
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `enabled-${surface}-${columns}`, surface, columns)
      expect(await toggleKeys(ui)).toEqual(ORDER_ENABLED)
      await expandOff(ui, w)
      const keys = await toggleKeys(ui)
      expect(new Set(keys).size).toBe(keys.length)
      expect(keys.slice(0, 3).map((key) => key.split('@')[1])).toEqual(['market-b|user', 'market-a|local', 'market-a|user'])
      await ui.unmount()
    }
  })

  test('the headers are "<n> enabled" and "<n> off · <marketplace>" in that order, and a header cut to the narrow room keeps its count', async ($, on) => {
    const w = world(on)
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `sections-${surface}-${columns}`, surface, columns)
      const headers = (await ui.findAll({ type: 'Button' })).map((b) => b.key).filter((key): key is string => key !== undefined && key.startsWith('mm-sec-'))
      expect(headers).toEqual(['mm-sec-all enabled', 'mm-sec-market-a', 'mm-sec-market-b'])
      expect(await sectionLabel(ui, 'mm-sec-all enabled')).toBe(fitLabel('3 enabled', columns - 8))
      expect(await sectionLabel(ui, 'mm-sec-market-a')).toBe(fitLabel('1 off · market-a', columns - 8))
      expect(await sectionLabel(ui, 'mm-sec-market-b')).toBe(fitLabel('1 off · market-b', columns - 8))
      if (columns === 16) {
        // Room 8: the name is what gets cut, never the count.
        expect(await sectionLabel(ui, 'mm-sec-market-a')).toBe('1 off ·…')
        expect(await sectionLabel(ui, 'mm-sec-all enabled')).toBe('3 enabl…')
      }
      await ui.unmount()
    }
  })

  test('marketplace sections start collapsed; a press expands one and a second press collapses it, without touching the others', async ($, on) => {
    const w = world(on)
    const aaa = 'mm-toggle-aaa-mod@market-a|user'
    const ccc = 'mm-toggle-ccc-plain@market-b|user'
    for (const { surface, columns } of PLACES) {
      w.calls = []
      const ui = await openAndMount($, w, `collapse-${surface}-${columns}`, surface, columns)
      expect(await toggleKeys(ui)).toEqual(ORDER_ENABLED)
      await ui.press({ key: 'mm-sec-market-a' })
      await idle(w)
      expect(await toggleKeys(ui)).toEqual([...ORDER_ENABLED, aaa])
      await ui.press({ key: 'mm-sec-market-b' })
      await idle(w)
      expect(await toggleKeys(ui)).toEqual([...ORDER_ENABLED, aaa, ccc])
      await ui.press({ key: 'mm-sec-market-a' })
      await idle(w)
      expect(await toggleKeys(ui)).toEqual([...ORDER_ENABLED, ccc])
      expect(await sectionLabel(ui, 'mm-sec-market-a')).toBeDefined()
      // The Enabled section collapses too, and its rows come back with a second press.
      await ui.press({ key: 'mm-sec-all enabled' })
      await idle(w)
      expect(await toggleKeys(ui)).toEqual([ccc])
      await ui.press({ key: 'mm-sec-all enabled' })
      await idle(w)
      expect(await toggleKeys(ui)).toEqual([...ORDER_ENABLED, ccc])
      expect(actions(w)).toEqual([])
      await ui.unmount()
    }
  })

  test('the filter field types to matching rows only, opens matches inside collapsed sections, shows "n of m shown", and clearing it restores the earlier layout', async ($, on) => {
    const w = world(on)
    const ccc = 'mm-toggle-ccc-plain@market-b|user'
    const aaa = 'mm-toggle-aaa-mod@market-a|user'
    for (const { surface, columns } of PLACES) {
      w.calls = []
      const ui = await openAndMount($, w, `filter-${surface}-${columns}`, surface, columns)
      const input = await ui.find({ key: 'mm-filter' })
      expect(input).toBeDefined()
      expect(input?.props.value).toBe('')
      expect(await ui.find({ type: 'Text', text: /shown$/ })).toBeUndefined()
      // Leave market-a open and market-b closed, so clearing the filter has a layout to restore.
      await ui.press({ key: 'mm-sec-market-a' })
      await idle(w)
      expect(await toggleKeys(ui)).toEqual([...ORDER_ENABLED, aaa])
      // ccc-plain sits in the collapsed market-b section: the filter still shows it.
      await ui.input({ key: 'mm-filter', text: 'CCC', kind: 'change' })
      await idle(w)
      expect(await toggleKeys(ui)).toEqual([ccc])
      expect(await ui.find({ type: 'Text', text: '1 of 5 shown' })).toBeDefined()
      expect((await ui.find({ key: 'mm-filter' }))?.props.value).toBe('CCC')
      // Submitting (Enter) does nothing: the text and the rows stay as they were.
      await ui.input({ key: 'mm-filter', text: 'CCC' })
      await idle(w)
      expect(await toggleKeys(ui)).toEqual([ccc])
      expect((await ui.find({ key: 'mm-filter' }))?.props.value).toBe('CCC')
      // A marketplace term, two terms (AND), and the "mod" keyword.
      await ui.input({ key: 'mm-filter', text: 'market-b', kind: 'change' })
      await idle(w)
      expect(await toggleKeys(ui)).toEqual(['mm-toggle-mmm-mod@market-b|user', ccc])
      await ui.input({ key: 'mm-filter', text: 'market-b  mod', kind: 'change' })
      await idle(w)
      expect(await toggleKeys(ui)).toEqual(['mm-toggle-mmm-mod@market-b|user'])
      expect(await ui.find({ type: 'Text', text: '1 of 5 shown' })).toBeDefined()
      await ui.input({ key: 'mm-filter', text: 'mod', kind: 'change' })
      await idle(w)
      expect(await toggleKeys(ui)).toEqual(['mm-toggle-mmm-mod@market-b|user', aaa])
      expect(await ui.find({ type: 'Text', text: '2 of 5 shown' })).toBeDefined()
      // Cleared: the person's own layout (market-a open, market-b closed) applies again, and the count line is gone.
      await ui.input({ key: 'mm-filter', text: '', kind: 'change' })
      await idle(w)
      expect(await toggleKeys(ui)).toEqual([...ORDER_ENABLED, aaa])
      expect(await ui.find({ type: 'Text', text: /shown$/ })).toBeUndefined()
      // Spaces only is an empty query too.
      await ui.input({ key: 'mm-filter', text: '   ', kind: 'change' })
      await idle(w)
      expect(await toggleKeys(ui)).toEqual([...ORDER_ENABLED, aaa])
      expect(await ui.find({ type: 'Text', text: /shown$/ })).toBeUndefined()
      // Typing never calls claude.
      expect(actions(w)).toEqual([])
      expect(w.calls.filter((call) => call.argv[2] === 'list')).toHaveLength(1)
      await ui.unmount()
    }
  })

  test('a filter that matches nothing shows "No plugin matches." instead of sections', async ($, on) => {
    const w = world(on)
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `nomatch-${surface}-${columns}`, surface, columns)
      await ui.input({ key: 'mm-filter', text: 'nothing-like-this', kind: 'change' })
      await idle(w)
      expect(await ui.find({ type: 'Text', text: 'No plugin matches.' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: '0 of 5 shown' })).toBeDefined()
      expect(await toggleKeys(ui)).toEqual([])
      expect((await ui.findAll({ type: 'Button' })).filter((b) => b.key?.startsWith('mm-sec-'))).toEqual([])
      await ui.unmount()
    }
  })
  test('"mod" selects mods only and is not a substring term: a non-mod named model-tools is excluded by "mod" and kept by "model"', async ($, on) => {
    const model = { id: 'model-tools@market-a', version: '1.0.0', scope: 'user', enabled: false, installPath: '/cache/market-a/model-tools/1.0.0' }
    const w = world(on, [...PLUGINS, model])
    const modelKey = 'mm-toggle-model-tools@market-a|user'
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `modword-${surface}-${columns}`, surface, columns)
      await ui.input({ key: 'mm-filter', text: 'mod', kind: 'change' })
      await idle(w)
      expect(await toggleKeys(ui)).toEqual(['mm-toggle-mmm-mod@market-b|user', 'mm-toggle-aaa-mod@market-a|user'])
      expect(await ui.find({ type: 'Text', text: '2 of 6 shown' })).toBeDefined()
      await ui.input({ key: 'mm-filter', text: 'model', kind: 'change' })
      await idle(w)
      expect(await toggleKeys(ui)).toEqual([modelKey])
      await ui.unmount()
    }
  })

  test('a section header press while a filter forces the sections open does nothing, and the earlier layout is back once the filter is cleared', async ($, on) => {
    const w = world(on)
    const aaa = 'mm-toggle-aaa-mod@market-a|user'
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `pressfilter-${surface}-${columns}`, surface, columns)
      await ui.input({ key: 'mm-filter', text: 'mod', kind: 'change' })
      await idle(w)
      const before = await toggleKeys(ui)
      expect(before).toEqual(['mm-toggle-mmm-mod@market-b|user', aaa])
      // market-a is drawn open by the filter; pressing its header and the Enabled header must change nothing.
      await ui.press({ key: 'mm-sec-market-a' })
      await idle(w)
      await ui.press({ key: 'mm-sec-all enabled' })
      await idle(w)
      expect(await toggleKeys(ui)).toEqual(before)
      // Cleared: market-a is still collapsed (the press did not toggle it) and the Enabled section is still open.
      await ui.input({ key: 'mm-filter', text: '', kind: 'change' })
      await idle(w)
      expect(await toggleKeys(ui)).toEqual(ORDER_ENABLED)
      await ui.unmount()
    }
  })

  test('a one-character filter filters the rows but keeps the person\'s own collapsed sections; two characters open them', async ($, on) => {
    const w = world(on)
    const ddd = 'mm-toggle-ddd-local@market-a|local'
    const ccc = 'mm-toggle-ccc-plain@market-b|user'
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `onechar-${surface}-${columns}`, surface, columns)
      // "c" matches ddd-local (enabled) and ccc-plain (in the collapsed market-b section): only the first is drawn.
      await ui.input({ key: 'mm-filter', text: 'c', kind: 'change' })
      await idle(w)
      expect(await toggleKeys(ui)).toEqual([ddd])
      expect(await ui.find({ type: 'Text', text: '2 of 5 shown' })).toBeDefined()
      // A press still toggles with one character, because the sections are drawn as the person left them.
      await ui.press({ key: 'mm-sec-market-b' })
      await idle(w)
      expect(await toggleKeys(ui)).toEqual([ddd, ccc])
      await ui.press({ key: 'mm-sec-market-b' })
      await idle(w)
      expect(await toggleKeys(ui)).toEqual([ddd])
      // "cc" has two characters: market-b opens by force.
      await ui.input({ key: 'mm-filter', text: 'cc', kind: 'change' })
      await idle(w)
      expect(await toggleKeys(ui)).toEqual([ccc])
      // The trimmed length counts: "c " is still one character.
      await ui.input({ key: 'mm-filter', text: 'c ', kind: 'change' })
      await idle(w)
      expect(await toggleKeys(ui)).toEqual([ddd])
      await ui.unmount()
    }
  })

  test('with no plugin listed there is no filter field and no "n of m shown" line', async ($, on) => {
    const w = world(on, [])
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `nolist-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ key: 'mm-filter' })).toBeUndefined()
      expect(await ui.find({ type: 'Text', text: /shown$/ })).toBeUndefined()
      expect(await ui.find({ type: 'Text', text: 'No plugins are installed.' })).toBeDefined()
      await ui.unmount()
    }
  })

  test('when claude is not found, the pane names the places it looked', async ($, on) => {
    const w = world(on)
    w.claudeFound = false
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `missing-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ type: 'Text', text: 'The installed plugins could not be read.' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: `claude was not found; looked in ${CLAUDE}` })).toBeDefined()
      // Refresh, and Reload (2h), which is always drawn, Add marketplace (2j), drawn wherever the add field is, and the profile list's show or hide button (P2a), drawn under the rows; nothing that needs the list.
      expect((await ui.findAll({ type: 'Button' })).map((b) => b.key)).toEqual(['mm-refresh', 'mm-reload', 'mm-auto-switch', 'mm-add-marketplace', 'mm-profiles'])
      await ui.unmount()
    }
  })

  test('when the claudePath setting names an absent file, the pane shows the rejection naming the setting', { options: { claudePath: '/custom/claude' } }, async ($, on) => {
    const w = world(on)
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `custom-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ type: 'Text', text: 'claude was not found; looked in /custom/claude (the claudePath setting)' })).toBeDefined()
      await ui.unmount()
    }
  })

  test('the row buttons fit the pane: a label too long for the room is cut with an ellipsis', async ($, on) => {
    const w = world(on)
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `labels-${surface}-${columns}`, surface, columns)
      await expandOff(ui, w)
      const uninstall = await ui.find({ key: 'mm-remove-aaa-mod@market-a|user' })
      const label = String(uninstall?.props.label)
      expect(label.length).toBeLessThanOrEqual(columns - 8)
      expect(['Uninstall', 'Uninsta…']).toContain(label)
      await ui.unmount()
    }
  })

  test('a press asks first: the question is raised, and with no answer nothing runs', async ($, on) => {
    const w = world(on)
    for (const { surface, columns } of PLACES) {
      w.asked = []
      w.calls = []
      const ui = await openAndMount($, w, `ask-${surface}-${columns}`, surface, columns)
      await ui.press({ key: 'mm-toggle-zzz-tool@market-a|user' })
      await idle(w)
      expect(w.asked).toEqual([QUESTION_DISABLE_ZZZ])
      expect(actions(w)).toEqual([])
      await ui.unmount()
    }
  })

  test('a press while claude reads the list is refused with a toast, and no question is raised', async ($, on) => {
    const w = world(on)
    for (const { surface, columns } of PLACES) {
      w.asked = []
      w.calls = []
      w.toasts = []
      const ui = await openAndMount($, w, `busy-${surface}-${columns}`, surface, columns)
      // The next claude call is the list read that Refresh starts; it waits until the test lets it finish.
      const hold = deferred()
      w.hold = hold
      await ui.press({ key: 'mm-refresh' })
      await ui.press({ key: 'mm-toggle-zzz-tool@market-a|user' })
      await idle(w)
      expect(w.toasts).toEqual([REFUSED_WHILE_READING])
      expect(w.asked).toEqual([])
      expect(actions(w)).toEqual([])
      hold.resolve()
      await idle(w)
      await ui.unmount()
    }
  })

  test('Refresh, Update and Update all pressed while a change runs are refused with a toast, read nothing and ask nothing, and the change keeps its claim to the end', async ($, on) => {
    // 2d review F8: before, Refresh took over the busy line and cleared it when its read ended, while the change still ran.
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.asked = []
      w.toasts = []
      const ui = await openAndMount($, w, `busy-action-${surface}-${columns}`, surface, columns)
      w.calls = []
      // The next claude call is the disable that the press confirms; it waits until the test lets it finish.
      const hold = deferred()
      w.hold = hold
      w.answer = 'Turn it off'
      await ui.press({ key: 'mm-toggle-zzz-tool@market-a|user' })
      await idle(w)
      w.answer = undefined
      expect(actions(w)).toEqual([{ argv: [CLAUDE, 'plugin', 'disable', 'zzz-tool@market-a', '--scope', 'user'], cwd: undefined }])
      await ui.press({ key: 'mm-refresh' })
      await ui.press({ key: 'mm-update-all' })
      await ui.press({ key: 'mm-update-zzz-tool@market-a|user' })
      await idle(w)
      expect(w.toasts).toEqual([REFUSED_WHILE_DISABLING, REFUSED_WHILE_DISABLING, REFUSED_WHILE_DISABLING])
      expect(w.asked).toEqual([QUESTION_DISABLE_ZZZ])
      expect(w.calls.filter((call) => call.argv[2] === 'list')).toEqual([])
      expect(await ui.find({ type: 'Text', text: /disable zzz-tool…/ })).toBeDefined()
      hold.resolve()
      await idle(w)
      // The change's own read of the list, once it ended.
      expect(w.calls.map((call) => call.argv.slice(2, 4).join(' '))).toEqual(['disable zzz-tool@market-a', 'list --json', 'marketplace list'])
      expect(w.toasts.at(-1)).toBe('zzz-tool turned off. Applies in your next session.')
      await ui.unmount()
    }
  })
  // 2l changed this test's subject: the command once ignored its arguments and opened the pane; an argument it does not
  // take is now refused with a toast naming its forms, and the pane is not opened. Nothing is changed, as before.
  test('the command refuses an argument it does not take: it opens nothing, names its four forms, and nothing is changed', async ($, on) => {
    const w = world(on)
    w.session = 'command-only'
    await start($, 'terminal')
    await $.command.run({ command: 'mods-manager', args: 'disable zzz-tool@market-a user', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } })
    await idle(w)
    expect(w.opened).toHaveLength(0)
    expect(w.toasts).toEqual(['/mods-manager takes nothing or one of: open, close, check, add <source>. "disable zzz-tool@market-a user" is none of them.'])
    expect(actions(w)).toEqual([])
  })

  test('the session start registers the mods-manager command once, at start, and no mod-manager, with the hint naming its four forms', async ($, on) => {
    const w = world(on)
    w.session = 'registers'
    await start($, 'terminal')
    // A command has no deferred form in CommandSpec, so being listed after session start is the whole check. Only the mods-manager name is counted, because the other mods register in the same start.
    expect(w.commands.filter((name) => name === 'mods-manager')).toEqual(['mods-manager'])
    expect(w.commands).not.toContain('mod-manager')
    expect(w.hints['mods-manager']).toBe('[open|close|check|add <source>]')
  })

  // The manifest declares a file that does not exist first: it is logged, and the file after it still makes the plugin a mod.
  test('a plugin whose only modules sit in a manifest-declared file is listed as a mod', async ($, on) => {
    const plugin = { id: 'fff-manifest@market-c', version: '1.0.0', scope: 'user', enabled: true, installPath: '/cache/market-c/fff-manifest/1.0.0' }
    const w = world(on, [plugin])
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `manifest-${surface}-${columns}`, surface, columns)
      expect(await toggleKeys(ui)).toEqual(['mm-toggle-fff-manifest@market-c|user'])
      expect(await ui.findAll({ type: 'Text', text: /^mod$/ })).toHaveLength(1)
      await ui.unmount()
    }
  })

  // Item 3 sweep, G2 (cli.ts, isMod): the lines about a mod's manifest and hooks files reach the transcript masked and on
  // one line (maskedLog): the folder can sit in the home folder, and a manifest item is the author's text.
  test('the transcript lines about a manifest-declared hooks file are masked and on one line', async ($, on) => {
    const folder = `${HOME}/plugins/hhh-home`
    const plugin = { id: 'hhh-home@market-c', version: '1.0.0', scope: 'user', enabled: true, installPath: folder }
    const w = world(on, [plugin])
    w.files = { ...w.files, [`${folder}/.claude-plugin/plugin.json`]: JSON.stringify({ hooks: ['./hooks/gone.json', '../x\nmods-manager: forged'] }) }
    w.refused = [`${folder}/hooks/gone.json`]
    const ui = await openAndMount($, w, 'manifest-home', 'terminal', 160)
    expect(w.logs.filter((log) => log.to !== 'debug').map((log) => log.text)).toEqual([
      'mods-manager: ~/plugins/hhh-home/.claude-plugin/plugin.json declares "../x mods-manager: forged", which is absolute or has "..", so it is skipped',
      'mods-manager: ~/plugins/hhh-home/hooks/gone.json is not readable, so it is not counted as a mod: mods-expert-developer-plugin: $.fs.read: EACCES: ~/plugins/hhh-home/hooks/gone.json',
    ])
    await ui.unmount()
  })

  test('one row per scope: user, project and local rows turn off and uninstall, synced and session rows only turn off, a managed row names why it has no button', async ($, on) => {
    const w = world(on, SCOPED)
    for (const { surface, columns } of PLACES) {
      w.calls = []
      const ui = await openAndMount($, w, `scopes-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ type: 'Text', text: '6 installed · 6 active · 0 mods' })).toBeDefined()
      expect(await rowButtonKeys(ui)).toEqual([
        'mm-toggle-engineering@synced|synced',
        'mm-toggle-lll-local@market-a|local',
        'mm-remove-lll-local@market-a|local',
        'mm-toggle-ppp-project@market-a|project',
        'mm-remove-ppp-project@market-a|project',
        'mm-toggle-sss-session@inline|session',
        'mm-toggle-uuu-user@market-a|user',
        'mm-remove-uuu-user@market-a|user',
      ])
      for (const key of await toggleKeys(ui)) expect((await ui.find({ key }))?.props.label).toBe('Turn off')
      expect(await ui.find({ type: 'Text', text: MANAGED_NOTE })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: '1.2.0 · synced · synced scope' })).toBeDefined()
      expect(actions(w)).toEqual([])
      await ui.unmount()
    }
  })

  test('a synced row\'s press asks a question that says it is removed on claude.ai, a session row\'s that an installed copy loads instead; with no answer nothing runs', async ($, on) => {
    const w = world(on, SCOPED)
    for (const { surface, columns } of PLACES) {
      w.asked = []
      w.calls = []
      const ui = await openAndMount($, w, `scope-ask-${surface}-${columns}`, surface, columns)
      await ui.press({ key: 'mm-toggle-engineering@synced|synced' })
      await idle(w)
      await ui.press({ key: 'mm-toggle-sss-session@inline|session' })
      await idle(w)
      expect(w.asked).toEqual([QUESTION_DISABLE_SYNCED, QUESTION_DISABLE_SESSION])
      expect(actions(w)).toEqual([])
      await ui.unmount()
    }
  })

  test('an entry the pane cannot read is named on its own line (index, id, reason), and every other row is still shown', async ($, on) => {
    const w = world(on, [...PLUGINS, ODD])
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `rejected-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ type: 'Text', text: '5 installed · 3 active · 2 mods' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: ODD_LINE })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /^Couldn't read/ })).toBeUndefined()
      expect(await toggleKeys(ui)).toEqual(ORDER_ENABLED)
      await expandOff(ui, w)
      expect(await toggleKeys(ui)).toEqual(ORDER)
      await ui.unmount()
    }
  })

  test('when no entry can be read, each one is named and the pane does not say that no plugin is installed', async ($, on) => {
    const w = world(on, [{ id: 'odd-tool@market-x', scope: 'team', enabled: true, installPath: '/cache/market-x/odd-tool/1.0.0' }, 'not an entry'])
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `none-read-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ type: 'Text', text: '0 installed · 0 active · 0 mods' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: `Entry 0 of the plugin list (odd-tool@market-x) is not shown: scope "team" is not one of ${SIX_SCOPES}.` })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: 'Entry 1 of the plugin list is not shown: it is not an object.' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: 'No plugins are installed.' })).toBeUndefined()
      expect(await toggleKeys(ui)).toEqual([])
      await ui.unmount()
    }
  })

  test('a plugin loaded in place is a mod when its readFromFolder holds the modules, though nothing sits under its installPath', async ($, on) => {
    const w = world(on, [IN_PLACE])
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `in-place-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ type: 'Text', text: '1 installed · 1 active · 1 mod' })).toBeDefined()
      expect(await ui.findAll({ type: 'Text', text: /^mod$/ })).toHaveLength(1)
      await ui.unmount()
    }
  })

  test('a skills-folder row turns on or off but offers no Uninstall, and its note says to delete its folder', async ($, on) => {
    const w = world(on, [SKILLS_DIR_ENTRY])
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `skills-dir-${surface}-${columns}`, surface, columns)
      expect(await rowButtonKeys(ui)).toEqual(['mm-toggle-kkk-skill@skills-dir|user'])
      expect(await ui.find({ type: 'Text', text: SKILLS_DIR_NOTE })).toBeDefined()
      await ui.unmount()
    }
  })

  test('a row whose id is not a lowercase name@marketplace offers no button, and its note says why', { timeoutMs: 30_000 }, async ($, on) => {
    const w = world(on, [{ id: 'Upper-Case@market-a', version: '1.0.0', scope: 'user', enabled: true, installPath: '/cache/market-a/Upper-Case/1.0.0' }])
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `refused-id-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ type: 'Text', text: '1 installed · 1 active · 0 mods' })).toBeDefined()
      expect(await rowButtonKeys(ui)).toEqual([])
      expect(await ui.find({ type: 'Text', text: REFUSED_ID_NOTE })).toBeDefined()
      await ui.unmount()
    }
  })

  test('a refresh that fails clears the lines of the entries the last read could not read, and says why it failed', async ($, on) => {
    const w = world(on, [...PLUGINS, ODD])
    for (const { surface, columns } of PLACES) {
      w.listFails = false
      const ui = await openAndMount($, w, `refresh-fails-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ type: 'Text', text: ODD_LINE })).toBeDefined()
      w.listFails = true
      await ui.press({ key: 'mm-refresh' })
      await idle(w)
      expect(await ui.find({ type: 'Text', text: `Couldn't read the installed plugins: ${LIST_FAILED}` })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: ODD_LINE })).toBeUndefined()
      await ui.unmount()
    }
  })

  test('the pane names the first five entries it cannot read, cuts each reason to 80 characters, shows a control character as ?, counts the rest on one line, and logs every one to the debug log', async ($, on) => {
    const bad = [
      { id: 'odd-a@market-x', scope: 'team', enabled: true, installPath: '/x/a' },
      { id: 'odd-long@market-x', scope: 'x'.repeat(200), enabled: true, installPath: '/x/long' },
      { id: 'odd\u0007bell@market-x', scope: 'team', enabled: true, installPath: '/x/bell' },
      { id: 'odd-d@market-x', scope: 'team', enabled: true, installPath: '/x/d' },
      { id: 'odd-e@market-x', scope: 'team', enabled: true, installPath: '/x/e' },
      { id: 'odd-f@market-x', scope: 'team', enabled: true, installPath: '/x/f' },
      { id: 'odd-g@market-x', scope: 'team', enabled: true, installPath: '/x/g' },
    ]
    const team = `scope "team" is not one of ${SIX_SCOPES}`
    const line = (index: number, id: string, reason: string) => `Entry ${index} of the plugin list (${id}) is not shown: ${reason}.`
    // PLUGINS holds entries 0 to 5, so the bad ones are entries 6 to 12; the pane names 6 to 10 and counts 11 and 12.
    const shown = [
      line(6, 'odd-a@market-x', team),
      line(7, 'odd-long@market-x', `scope "${'x'.repeat(72)}…`),
      line(8, 'odd?bell@market-x', team),
      line(9, 'odd-d@market-x', team),
      line(10, 'odd-e@market-x', team),
    ]
    const logged = [
      line(6, 'odd-a@market-x', team),
      line(7, 'odd-long@market-x', `scope "${'x'.repeat(200)}" is not one of ${SIX_SCOPES}`),
      line(8, 'odd?bell@market-x', team),
      line(9, 'odd-d@market-x', team),
      line(10, 'odd-e@market-x', team),
      line(11, 'odd-f@market-x', team),
      line(12, 'odd-g@market-x', team),
    ].map((text) => ({ text: `mods-manager: ${text}`, to: 'debug' }))
    const w = world(on, [...PLUGINS, ...bad])
    for (const { surface, columns } of PLACES) {
      w.logs = []
      const ui = await openAndMount($, w, `rejected-cap-${surface}-${columns}`, surface, columns)
      for (const text of shown) expect((await ui.find({ type: 'Text', text }))?.props.wrap).toBe('truncate-end')
      expect(await ui.findAll({ type: 'Text', text: /^Entry \d+ of the plugin list/ })).toHaveLength(5)
      expect(await ui.find({ type: 'Text', text: 'and 2 more, each named in the debug log.' })).toBeDefined()
      expect(w.logs.filter((log) => log.text.startsWith('mods-manager: Entry '))).toEqual(logged)
      expect(await toggleKeys(ui)).toEqual(ORDER_ENABLED)
      await ui.unmount()
    }
  })
})

describe('the latest versions in the pane', () => {
  test('each row shows the latest version its marketplace offers, with an arrow, drawn at full strength, only when it is numerically newer', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `latest-${surface}-${columns}`, surface, columns)
      await expandOff(ui, w)
      for (const [text, isDim] of LATEST_LINES) expect((await ui.find({ type: 'Text', text }))?.props.dimColor).toBe(isDim)
      expect(await ui.findAll({ type: 'Text', text: /↑/ })).toHaveLength(2)
      expect(await ui.find({ type: 'Text', text: READING_CATALOGS })).toBeUndefined()
      expect(await ui.find({ type: 'Text', text: /^The latest version/ })).toBeUndefined()
      expect(await toggleKeys(ui)).toEqual(ORDER)
      await ui.unmount()
    }
  })

  test('only the catalogs of marketplaces with installed rows are read, after the list, through one fixed claude call', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.calls = []
      w.reads = []
      const ui = await openAndMount($, w, `reads-${surface}-${columns}`, surface, columns)
      // No marketplace name or path reaches claude: the call is the same whatever the list holds.
      expect(w.calls.map((call) => call.argv)).toEqual([
        [CLAUDE, 'plugin', 'list', '--json'],
        [CLAUDE, 'plugin', 'marketplace', 'list', '--json'],
      ])
      // market-c has no installed row, so its catalog is not read on open, only when its section is opened (2f); market-org
      // has no local copy. The plugin.json of each relative-path entry is read (aaa-mod, ddd-local), even when the entry has
      // its own version; mmm-mod's does not exist.
      expect(w.reads.filter((path) => path.startsWith(MARKETS))).toEqual([CATALOG_A, AAA_MANIFEST, DDD_MANIFEST, CATALOG_B])
      await ui.unmount()
    }
  })

  test('the catalogs are read in the background: the rows are drawn and a press works before the marketplace list answers', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.asked = []
      const hold = deferred()
      w.marketHold = hold
      const ui = await openAndMount($, w, `background-${surface}-${columns}`, surface, columns)
      expect(await toggleKeys(ui)).toEqual(ORDER_ENABLED)
      expect(await ui.find({ type: 'Text', text: READING_CATALOGS })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: '2.0.0 · market-a · user scope' })).toBeDefined()
      await ui.press({ key: 'mm-toggle-zzz-tool@market-a|user' })
      await idle(w)
      expect(w.asked).toEqual([QUESTION_DISABLE_ZZZ])
      hold.resolve()
      await idle(w)
      expect(await ui.find({ type: 'Text', text: LATEST_LINES[0]![0] })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: READING_CATALOGS })).toBeUndefined()
      await ui.unmount()
    }
  })

  test('a catalog, or a plugin.json that exists but is refused or not JSON, is named once on its own line, a missing plugin.json is unknown with no line, and every row stays', async ($, on) => {
    const w = withCatalogs(world(on))
    delete w.files[CATALOG_B]
    // A plugin.json that exists could hold the latest version, so a refused read or a parse that fails leaves ddd-local
    // unknown and is named, never taken as missing. One that does not exist is unknown with no line, since none is
    // promised. Each way is checked on every surface and width.
    for (const broken of ['not-json', 'refused', 'missing'] as const) {
      if (broken === 'not-json') w.files[DDD_MANIFEST] = '{ not json'
      else delete w.files[DDD_MANIFEST]
      w.refused = broken === 'refused' ? [DDD_MANIFEST] : []
      const named = broken !== 'missing'
      for (const { surface, columns } of PLACES) {
        w.logs = []
        const ui = await openAndMount($, w, `catalog-fails-${broken}-${surface}-${columns}`, surface, columns)
        await expandOff(ui, w)
        const lines = await ui.findAll({ type: 'Text', text: /^The latest version/ })
        expect(lines.map((line) => line.props.wrap)).toEqual(named ? ['truncate-end', 'truncate-end'] : ['truncate-end'])
        // The kit answers a read its hook refused with its own error, so each reason is matched by shape, not by its words.
        const manifestLine = await ui.find({ type: 'Text', text: /^The latest version of ddd-local@market-a is unknown: its plugin\.json could not be read \(.+\)\.$/ })
        expect(manifestLine === undefined).toBe(!named)
        expect(await ui.find({ type: 'Text', text: /^The latest versions from market-b are unknown: its catalog could not be read \(.+\)\.$/ })).toBeDefined()
        expect(w.logs.filter((log) => log.text.startsWith('mods-manager: the catalog of market-b could not be read: ') && log.to === 'debug')).toHaveLength(1)
        expect(w.logs.filter((log) => log.text.startsWith('mods-manager: the plugin.json of ddd-local@market-a could not be read: ') && log.to === 'debug')).toHaveLength(named ? 1 : 0)
        expect(await ui.find({ type: 'Text', text: LATEST_LINES[0]![0] })).toBeDefined()
        expect(await ui.find({ type: 'Text', text: '1.0.0 · latest unknown · market-a · local scope' })).toBeDefined()
        expect(await ui.find({ type: 'Text', text: '0.3.0 · latest unknown · market-b · user scope' })).toBeDefined()
        expect(await toggleKeys(ui)).toEqual(ORDER)
        await ui.unmount()
      }
    }
  })

  test('when the marketplace list cannot be read, one line says so with claude\'s last line, from stderr or else stdout, every row is still shown, and no latest version is known', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const stream of ['stderr', 'stdout'] as const) {
      w.marketFails = stream
      for (const { surface, columns } of PLACES) {
        w.reads = []
        const ui = await openAndMount($, w, `list-fails-${stream}-${surface}-${columns}`, surface, columns)
        expect(await ui.findAll({ type: 'Text', text: `No latest version is known: the marketplace list could not be read (${MARKETPLACES_FAILED}).` })).toHaveLength(1)
        expect(await ui.find({ type: 'Text', text: '2.0.0 · latest unknown · market-a · user scope' })).toBeDefined()
        expect(await ui.findAll({ type: 'Text', text: /↑/ })).toHaveLength(0)
        expect(w.reads.filter((path) => path.startsWith(MARKETS))).toEqual([])
        expect(await toggleKeys(ui)).toEqual(ORDER_ENABLED)
        await ui.unmount()
      }
    }
  })

  test('a plugin.json version that is not a string makes the latest version unknown, never the entry\'s, and an empty one counts as none, so the entry\'s is shown', async ($, on) => {
    // 2d review F4. aaa-mod's entry says 9.9.9; its plugin.json says 1.0.0 in CATALOG_FILES.
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.files[AAA_MANIFEST] = '{"name": "aaa-mod", "version": 2}'
      let ui = await openAndMount($, w, `manifest-number-${surface}-${columns}`, surface, columns)
      await expandOff(ui, w)
      expect(await ui.find({ type: 'Text', text: '1.0.0 · latest unknown · market-a · user scope' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /9\.9\.9/ })).toBeUndefined()
      expect(await ui.find({ type: 'Text', text: 'The latest version of aaa-mod@market-a is unknown: its plugin.json could not be read (its "version" is 2, not a string).' })).toBeDefined()
      await ui.unmount()
      w.files[AAA_MANIFEST] = '{"name": "aaa-mod", "version": ""}'
      ui = await openAndMount($, w, `manifest-empty-${surface}-${columns}`, surface, columns)
      await expandOff(ui, w)
      expect(await ui.find({ type: 'Text', text: '1.0.0 · ↑ latest 9.9.9 · market-a · user scope' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /^The latest version of aaa-mod/ })).toBeUndefined()
      await ui.unmount()
    }
  })

  test('a refresh during a read of the catalogs: the older read, ending last, does not replace the newer one\'s versions', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.files[CATALOG_A] = catalogA('10.0.0')
      w.statuses = []
      const first = deferred()
      w.marketHold = first
      const ui = await openAndMount($, w, `stale-${surface}-${columns}`, surface, columns)
      // The first read waits at the marketplace list; a refresh starts a second read, which ends first.
      await ui.press({ key: 'mm-refresh' })
      await idle(w)
      expect(await ui.find({ type: 'Text', text: LATEST_LINES[0]![0] })).toBeDefined()
      // The first read now ends, reading a catalog that says 2.0.0: its answer must be dropped.
      w.files[CATALOG_A] = catalogA('2.0.0')
      first.resolve()
      await idle(w)
      expect(await ui.find({ type: 'Text', text: LATEST_LINES[0]![0] })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: '2.0.0 · catalog lists 2.0.0 · market-a · user scope' })).toBeUndefined()
      // 2h: only the newer read set the status line; the older one, which would count one arrow, set nothing.
      expect(w.statuses).toEqual([BADGE_TWO])
      expect(await ui.find({ type: 'Text', text: READING_CATALOGS })).toBeUndefined()
      await ui.unmount()
    }
  })

  test('the details view says the catalogs are read again while a read that replaces an earlier one runs, and shows the latest version once it ends', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.files = { ...CATALOG_FILES, [CATALOG_A]: catalogA('10.0.0', [], { description: CATALOG_DESCRIPTION }), [ZZZ_ABOUT]: ZZZ_ABOUT_TEXT }
      const ui = await openAndMount($, w, `reread-${surface}-${columns}`, surface, columns)
      await ui.press({ key: ZZZ_DETAILS })
      await idle(w)
      expect(await ui.find({ type: 'Text', text: 'Latest: ↑ 10.0.0, the version its catalog lists' })).toBeDefined()
      await ui.press({ key: 'mm-back' })
      await idle(w)
      // The next read waits at the marketplace list. While it runs, the view says the catalogs are read again, not that they are not read yet.
      const again = deferred()
      w.marketHold = again
      await ui.press({ key: 'mm-refresh' })
      await idle(w)
      await ui.press({ key: ZZZ_DETAILS })
      await idle(w)
      expect(await ui.find({ type: 'Text', text: 'Latest: the marketplace catalogs are being read again…' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: 'Latest: the marketplace catalogs are not read yet.' })).toBeUndefined()
      again.resolve()
      await idle(w)
      expect(await ui.find({ type: 'Text', text: 'Latest: ↑ 10.0.0, the version its catalog lists' })).toBeDefined()
      await ui.unmount()
    }
  })
})

describe('Update and Update all in the pane', () => {
  test('a row draws Update only when it has an update arrow, and Update all counts those rows; while the catalogs are read there is neither', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.calls = []
      const hold = deferred()
      w.marketHold = hold
      const ui = await openAndMount($, w, `update-buttons-${surface}-${columns}`, surface, columns)
      await expandOff(ui, w)
      expect(await updateKeys(ui)).toEqual([])
      expect(await ui.find({ key: 'mm-update-all' })).toBeUndefined()
      hold.resolve()
      await idle(w)
      expect(await updateKeys(ui)).toEqual(UPDATE_KEYS)
      for (const key of UPDATE_KEYS) expect((await ui.find({ key }))?.props.label).toBe('Update')
      // A row's buttons: its toggle, then Update, then Uninstall, then Details (2i), which every row draws, then Auto (2k), drawn where the scope offers Update.
      const zzz = (await ui.findAll({ type: 'Button' })).map((b) => b.key).filter((key) => key?.endsWith('-zzz-tool@market-a|user'))
      expect(zzz).toEqual(['mm-toggle-zzz-tool@market-a|user', 'mm-update-zzz-tool@market-a|user', 'mm-remove-zzz-tool@market-a|user', 'mm-details-zzz-tool@market-a|user', 'mm-auto-zzz-tool@market-a|user'])
      const all = await ui.find({ key: 'mm-update-all' })
      // 16 columns leave room 8, so the label is cut there; 160 columns leave it whole.
      expect(all?.props.label).toBe(columns === 16 ? 'u: Upda…' : 'u: Update all (2)')
      expect(all?.props.hotkey).toBe('u')
      expect(actions(w)).toEqual([])
      await ui.unmount()
    }
  })

  test('Update on a row asks first, naming the plugin, its scope and the effect; confirmed, it runs claude plugin update with the row\'s scope in the row\'s folder, says so, and reads the list again', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.asked = []
      w.toasts = []
      const ui = await openAndMount($, w, `update-one-${surface}-${columns}`, surface, columns)
      w.calls = []
      w.answer = 'Update it'
      await ui.press({ key: 'mm-update-zzz-tool@market-a|user' })
      await idle(w)
      await ui.press({ key: 'mm-update-ddd-local@market-a|local' })
      await idle(w)
      w.answer = undefined
      expect(w.asked).toEqual([QUESTION_UPDATE_ZZZ, QUESTION_UPDATE_DDD])
      // A user row names its scope and runs in no folder; a local row runs in the folder it was installed for.
      expect(actions(w)).toEqual([
        { argv: UPDATE_ZZZ, cwd: undefined },
        { argv: UPDATE_DDD, cwd: '/work/app' },
      ])
      expect(w.toasts).toEqual(['zzz-tool updated. Applies in your next session.', 'ddd-local updated. Applies in your next session.'])
      expect(await ui.find({ type: 'Text', text: NEXT_SESSION })).toBeDefined()
      // Each update is followed by a fresh read of the list.
      expect(w.calls.filter((call) => call.argv[2] === 'list')).toHaveLength(2)
      await ui.unmount()
    }
  })

  test('an Update that finds nothing newer says only that, from either stream, and asks for no new session', async ($, on) => {
    // 2e review tests/F2: the chapter (line 288) names no stream for the line, so runAction passes both.
    const w = withCatalogs(world(on))
    w.updateCurrent = ['zzz-tool@market-a']
    for (const stream of ['stdout', 'stderr'] as const) {
      w.updateCurrentOn = stream
      for (const { surface, columns } of PLACES) {
        w.toasts = []
        const ui = await openAndMount($, w, `update-current-${stream}-${surface}-${columns}`, surface, columns)
        w.answer = 'Update it'
        await ui.press({ key: 'mm-update-zzz-tool@market-a|user' })
        await idle(w)
        w.answer = undefined
        expect(w.toasts).toEqual([CURRENT_ZZZ])
        expect(await ui.find({ type: 'Text', text: NEXT_SESSION })).toBeUndefined()
        await ui.unmount()
      }
    }
  })

  test('Update all asks one question naming how many; confirmed, it updates each row in turn, goes on past a failure, reports each row, shows the next-session line, reads the list again, and the next change clears the report', async ($, on) => {
    const w = withCatalogs(world(on))
    // ddd-local is updated first (the order of the rows): its failure must not stop zzz-tool's update.
    w.updateFails = { 'ddd-local@market-a': 'Failed to update plugin "ddd-local@market-a"\nthe network is down' }
    for (const { surface, columns } of PLACES) {
      w.asked = []
      w.toasts = []
      w.logs = []
      const ui = await openAndMount($, w, `update-all-${surface}-${columns}`, surface, columns)
      w.calls = []
      w.answer = UPDATE_ALL_LABEL
      await ui.press({ key: 'mm-update-all' })
      await idle(w)
      w.answer = undefined
      expect(w.asked).toEqual([QUESTION_UPDATE_ALL_2])
      expect(actions(w)).toEqual([
        { argv: UPDATE_DDD, cwd: '/work/app' },
        { argv: UPDATE_ZZZ, cwd: undefined },
      ])
      // The list is read again once, after the last update, and then the catalogs.
      expect(w.calls.map((call) => call.argv.slice(2, 4).join(' '))).toEqual(['update ddd-local@market-a', 'update zzz-tool@market-a', 'list --json', 'marketplace list'])
      expect(await ui.find({ type: 'Text', text: SUMMARY_ONE_UPDATED_ONE_FAILED })).toBeDefined()
      // runAction rejects with claude's last stderr line; the report keeps the first line of that message, failures first.
      const lines = await ui.findAll({ type: 'Text', text: /^(ddd-local|zzz-tool) \(/ })
      // A found element is { type, props, children } (testing chapter, the find row); a Text's one child is its text.
      expect(lines.map((line) => String(line.children))).toEqual(['ddd-local (local scope): failed: the network is down', 'zzz-tool (user scope): updated.'])
      expect(lines.map((line) => line.props.wrap)).toEqual(['truncate-end', 'truncate-end'])
      expect(await ui.find({ type: 'Text', text: NEXT_SESSION })).toBeDefined()
      expect(w.toasts).toEqual([SUMMARY_ONE_UPDATED_ONE_FAILED])
      expect(w.logs.filter((log) => log.to === 'debug' && / scope\): /.test(log.text)).map((log) => log.text)).toEqual([
        'mods-manager: ddd-local (local scope): failed: the network is down',
        'mods-manager: zzz-tool (user scope): updated.',
      ])
      w.answer = 'Turn it off'
      await ui.press({ key: 'mm-toggle-mmm-mod@market-b|user' })
      await idle(w)
      w.answer = undefined
      expect(await ui.find({ type: 'Text', text: SUMMARY_ONE_UPDATED_ONE_FAILED })).toBeUndefined()
      await ui.unmount()
    }
  })

  test('Update all runs nothing on any answer but its own label, or on none, and a press while claude reads the list is refused before any question', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.asked = []
      w.toasts = []
      const ui = await openAndMount($, w, `update-all-no-${surface}-${columns}`, surface, columns)
      w.calls = []
      for (const answer of [KEEP, 'Update it', undefined]) {
        w.answer = answer
        await ui.press({ key: 'mm-update-all' })
        await idle(w)
      }
      w.answer = undefined
      expect(w.asked).toEqual([QUESTION_UPDATE_ALL_2, QUESTION_UPDATE_ALL_2, QUESTION_UPDATE_ALL_2])
      expect(actions(w)).toEqual([])
      // The next claude call is the list read that Refresh starts; it waits until the test lets it finish.
      const hold = deferred()
      w.hold = hold
      await ui.press({ key: 'mm-refresh' })
      await ui.press({ key: 'mm-update-all' })
      await ui.press({ key: 'mm-update-zzz-tool@market-a|user' })
      await idle(w)
      expect(w.toasts).toEqual([REFUSED_WHILE_READING, REFUSED_WHILE_READING])
      expect(w.asked).toHaveLength(3)
      expect(actions(w)).toEqual([])
      hold.resolve()
      await idle(w)
      await ui.unmount()
    }
  })

  test('an Update all in which no row is updated asks for no new session, and each line says no newer version was found', async ($, on) => {
    // 2e review tests/F1: the next-session line is drawn only when at least one row was updated.
    const w = withCatalogs(world(on))
    w.updateCurrent = ['ddd-local@market-a', 'zzz-tool@market-a']
    for (const { surface, columns } of PLACES) {
      w.toasts = []
      const ui = await openAndMount($, w, `update-all-current-${surface}-${columns}`, surface, columns)
      w.answer = UPDATE_ALL_LABEL
      await ui.press({ key: 'mm-update-all' })
      await idle(w)
      w.answer = undefined
      expect(await ui.find({ type: 'Text', text: SUMMARY_TWO_CURRENT })).toBeDefined()
      const lines = await ui.findAll({ type: 'Text', text: /^(ddd-local|zzz-tool) \(/ })
      expect(lines.map((line) => String(line.children))).toEqual(['ddd-local (local scope): no newer version was found.', 'zzz-tool (user scope): no newer version was found.'])
      expect(await ui.find({ type: 'Text', text: NEXT_SESSION })).toBeUndefined()
      expect(w.toasts).toEqual([SUMMARY_TWO_CURRENT])
      await ui.unmount()
    }
  })

  test('while Update all runs, the busy line names the row it updates (i of N), and Refresh, Update, Update all and a toggle are each refused with that line', async ($, on) => {
    // 2e review tests/F4.
    const w = withCatalogs(world(on))
    const refused = 'Wait: updating 1 of 2: ddd-local… is still running. Nothing was changed.'
    for (const { surface, columns } of PLACES) {
      w.asked = []
      w.toasts = []
      const ui = await openAndMount($, w, `update-all-busy-${surface}-${columns}`, surface, columns)
      w.calls = []
      // The next claude call is the first update; it waits until the test lets it finish.
      const first = deferred()
      w.hold = first
      w.answer = UPDATE_ALL_LABEL
      await ui.press({ key: 'mm-update-all' })
      await idle(w)
      w.answer = undefined
      expect(actions(w)).toEqual([{ argv: UPDATE_DDD, cwd: '/work/app' }])
      expect(await ui.find({ type: 'Text', text: 'updating 1 of 2: ddd-local…' })).toBeDefined()
      for (const key of ['mm-refresh', 'mm-update-all', 'mm-update-zzz-tool@market-a|user', 'mm-toggle-mmm-mod@market-b|user']) await ui.press({ key })
      await idle(w)
      expect(w.toasts).toEqual([refused, refused, refused, refused])
      expect(w.asked).toEqual([QUESTION_UPDATE_ALL_2])
      expect(w.calls.filter((call) => call.argv[2] === 'list')).toEqual([])
      const second = deferred()
      w.hold = second
      first.resolve()
      await idle(w)
      expect(await ui.find({ type: 'Text', text: 'updating 2 of 2: zzz-tool…' })).toBeDefined()
      second.resolve()
      await idle(w)
      expect(actions(w)).toEqual([
        { argv: UPDATE_DDD, cwd: '/work/app' },
        { argv: UPDATE_ZZZ, cwd: undefined },
      ])
      expect(w.toasts.at(-1)).toBe('Update all: 2 updated, 0 already current, 0 failed.')
      await ui.unmount()
    }
  })

  test('a Refresh pressed while the Update all question is open keeps its claim: the answer then runs nothing, and a toast says why', async ($, on) => {
    // 2e review tests/F4: Update all takes its claim after the question, so a read started meanwhile is not overrun.
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.asked = []
      w.toasts = []
      const ui = await openAndMount($, w, `update-all-claim-${surface}-${columns}`, surface, columns)
      w.calls = []
      const question = deferred()
      w.answerHold = question
      w.answer = UPDATE_ALL_LABEL
      await ui.press({ key: 'mm-update-all' })
      await idle(w)
      expect(w.asked).toEqual([QUESTION_UPDATE_ALL_2])
      // The list read Refresh starts waits until the test lets it finish, so its claim is held when the answer comes.
      const read = deferred()
      w.hold = read
      await ui.press({ key: 'mm-refresh' })
      await idle(w)
      question.resolve()
      await idle(w)
      w.answer = undefined
      expect(w.toasts).toEqual([REFUSED_WHILE_READING])
      expect(actions(w)).toEqual([])
      read.resolve()
      await idle(w)
      expect(actions(w)).toEqual([])
      await ui.unmount()
    }
  })

  test('Update all over more rows than the pane names: the question names five and counts the rest, the report shows five lines and counts the rest, and the debug log names every row', async ($, on) => {
    // 2e review tests/F5.
    const w = world(on, SEVEN)
    w.marketplaces = MARKETPLACES
    w.files = { [CATALOG_A]: SEVEN_CATALOG }
    for (const { surface, columns } of PLACES) {
      w.asked = []
      w.logs = []
      const ui = await openAndMount($, w, `update-seven-${surface}-${columns}`, surface, columns)
      expect((await ui.find({ key: 'mm-update-all' }))?.props.label).toBe(columns === 16 ? 'u: Upda…' : 'u: Update all (7)')
      w.answer = UPDATE_ALL_LABEL
      await ui.press({ key: 'mm-update-all' })
      await idle(w)
      w.answer = undefined
      expect(w.asked).toEqual([QUESTION_UPDATE_ALL_7])
      expect(await ui.find({ type: 'Text', text: 'Update all: 7 updated, 0 already current, 0 failed.' })).toBeDefined()
      const lines = await ui.findAll({ type: 'Text', text: /^[a-z]+-tool \(user scope\): updated\.$/ })
      expect(lines.map((line) => String(line.children))).toEqual(SEVEN_ORDER.slice(0, 5).map((name) => `${name}-tool (user scope): updated.`))
      expect(await ui.find({ type: 'Text', text: 'and 2 more, each named in the debug log.' })).toBeDefined()
      expect(w.logs.filter((log) => log.to === 'debug' && / scope\): updated\.$/.test(log.text)).map((log) => log.text)).toEqual(
        SEVEN_ORDER.map((name) => `mods-manager: ${name}-tool (user scope): updated.`),
      )
      await ui.unmount()
    }
  })

  test('a managed row with an update arrow draws only Update and Auto, its note says only an update is offered, and confirmed it updates the managed scope', async ($, on) => {
    // 2e review tests/F6: market-m keeps a local copy, so its managed plugin gets a latest version.
    const w = world(on, [MANAGED_ROW])
    w.marketplaces = [MARKET_M_ENTRY]
    w.files = { [CATALOG_M]: CATALOG_M_TEXT }
    for (const { surface, columns } of PLACES) {
      w.asked = []
      const ui = await openAndMount($, w, `managed-update-${surface}-${columns}`, surface, columns)
      w.calls = []
      const keys = (await ui.findAll({ type: 'Button' })).map((b) => b.key).filter((key) => key?.endsWith('|managed'))
      // 2i: Details, which every row draws, comes after the buttons the row offers; 2k: Auto follows, as Update is offered.
      expect(keys).toEqual(['mm-update-ggg-managed@market-m|managed', 'mm-details-ggg-managed@market-m|managed', 'mm-auto-ggg-managed@market-m|managed'])
      expect(await ui.find({ type: 'Text', text: ONLY_UPDATE_NOTE })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: MANAGED_NOTE })).toBeUndefined()
      w.answer = 'Update it'
      await ui.press({ key: 'mm-update-ggg-managed@market-m|managed' })
      await idle(w)
      w.answer = undefined
      expect(w.asked).toEqual(['Update it: ggg-managed (managed scope)? The latest version its marketplace offers loads in your next session.'])
      expect(actions(w)).toEqual([{ argv: [CLAUDE, 'plugin', 'update', 'ggg-managed@market-m', '--scope', 'managed'], cwd: undefined }])
      await ui.unmount()
    }
  })

  test('a plugin loaded in place is shown at the version it loads: once its plugin.json is raised it draws no arrow, no Update and no Update all', async ($, on) => {
    // 2e review spec/F1: the list records 1.0.0 and reports folderVersion 1.1.0 (plugin commands chapter, line 341); the
    // folder's plugin.json says 1.1.0, which the session already loads (tracing chapter, line 297).
    const w = world(on, [{ ...IN_PLACE, folderVersion: '1.1.0' }])
    w.marketplaces = [MARKET_D_ENTRY]
    w.files = { ...IN_PLACE_FILES }
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `in-place-latest-${surface}-${columns}`, surface, columns)
      expect((await ui.find({ type: 'Text', text: '1.1.0 · latest 1.1.0 · market-d · user scope' }))?.props.dimColor).toBe(true)
      expect(await ui.findAll({ type: 'Text', text: /↑/ })).toHaveLength(0)
      expect(await updateKeys(ui)).toEqual([])
      expect(await ui.find({ key: 'mm-update-all' })).toBeUndefined()
      await ui.unmount()
    }
  })

  test('a row whose archive entry sets a headersHelper keeps its arrow, draws no Update, is not counted in Update all, and says to update it from the terminal', async ($, on) => {
    // 2e review spec/F2. jjj-github's entry sets a headersHelper too, which has no effect on a GitHub source, so it updates.
    const w = withCatalogs(world(on, [HELPER_ARCHIVE_ROW, HELPER_GITHUB_ROW]))
    w.files[CATALOG_A] = catalogA('10.0.0', HELPER_ENTRIES)
    for (const { surface, columns } of PLACES) {
      w.asked = []
      const ui = await openAndMount($, w, `headers-helper-${surface}-${columns}`, surface, columns)
      w.calls = []
      expect(await ui.findAll({ type: 'Text', text: '1.1.0 · ↑ catalog lists 1.2.0 · market-a · user scope' })).toHaveLength(2)
      expect(await updateKeys(ui)).toEqual(['mm-update-jjj-github@market-a|user'])
      expect(await ui.findAll({ type: 'Text', text: TERMINAL_NOTE })).toHaveLength(1)
      expect((await ui.find({ key: 'mm-update-all' }))?.props.label).toBe(columns === 16 ? 'u: Upda…' : 'u: Update all (1)')
      w.answer = UPDATE_ALL_LABEL
      await ui.press({ key: 'mm-update-all' })
      await idle(w)
      w.answer = undefined
      expect(w.asked).toEqual([QUESTION_UPDATE_ALL_JJJ])
      expect(actions(w)).toEqual([{ argv: [CLAUDE, 'plugin', 'update', 'jjj-github@market-a', '--scope', 'user'], cwd: undefined }])
      await ui.unmount()
    }
  })

  test('a failed Update shows claude\'s last error line with each control character as ?, and asks for no new session', async ($, on) => {
    // 2e review state/F1: the message line is text from outside, as the Update all report is.
    const w = withCatalogs(world(on))
    w.updateFails = { 'zzz-tool@market-a': 'Failed to update plugin "zzz-tool@market-a"\nthe registry said \u001b[31mno\u0007' }
    for (const { surface, columns } of PLACES) {
      w.toasts = []
      const ui = await openAndMount($, w, `update-fails-${surface}-${columns}`, surface, columns)
      w.answer = 'Update it'
      await ui.press({ key: 'mm-update-zzz-tool@market-a|user' })
      await idle(w)
      w.answer = undefined
      expect(await ui.find({ type: 'Text', text: 'update zzz-tool failed: the registry said ?[31mno?' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /\p{Cc}/u })).toBeUndefined()
      expect(await ui.find({ type: 'Text', text: NEXT_SESSION })).toBeUndefined()
      expect(w.toasts).toEqual([])
      await ui.unmount()
    }
  })

  test('a change hands its claim to its own read of the list: a press when its toast shows is refused, and that read is never refused', async ($, on) => {
    // 2e review state/F4: before, the change released the claim and its read took it again after an await, so a press in
    // that gap could win it, and the pane said "Nothing was changed." right after the change worked. In the kit, a press
    // sent from the toast reaches the pane only after the read has claimed again, old shape or new (measured with a
    // mutant), so the gap itself is tested on a plain engine ('the claim handoff, on a plain engine'); this test checks
    // the rest through the pane: the press is refused, and the change's own read runs once and is not refused.
    const w = withCatalogs(world(on))
    const runs = [
      { press: 'mm-update-zzz-tool@market-a|user', answer: 'Update it', toast: 'zzz-tool updated. Applies in your next session.' },
      { press: 'mm-update-all', answer: UPDATE_ALL_LABEL, toast: 'Update all: 2 updated, 0 already current, 0 failed.' },
    ]
    for (const [index, run] of runs.entries()) {
      for (const { surface, columns } of PLACES) {
        w.asked = []
        w.toasts = []
        const ui = await openAndMount($, w, `handoff-${index}-${surface}-${columns}`, surface, columns)
        w.calls = []
        // The person presses Turn off on mmm-mod when the change's toast is shown, that is, after the change ran and before
        // its read of the list. That read waits until the test lets it finish, so the press is checked while it runs.
        const read = deferred()
        w.onToast = (text) => {
          if (text !== run.toast) return
          w.onToast = undefined
          w.hold = read
          void ui.press({ key: 'mm-toggle-mmm-mod@market-b|user' })
        }
        w.answer = run.answer
        await ui.press({ key: run.press })
        await idle(w)
        w.answer = undefined
        w.onToast = undefined
        expect(w.toasts).toEqual([run.toast, REFUSED_WHILE_READING])
        // The press raised no question, so it could not start a change.
        expect(w.asked).toHaveLength(1)
        read.resolve()
        await idle(w)
        expect(w.calls.filter((call) => call.argv[2] === 'list')).toHaveLength(1)
        expect(actions(w).every((call) => call.argv[2] === 'update')).toBe(true)
        expect(w.toasts).toEqual([run.toast, REFUSED_WHILE_READING])
        await ui.unmount()
      }
    }
  })

  test('Update all acts only on the rows the filter shows: its count, the plugins its question names, and the ones it updates', async ($, on) => {
    // 2e, orchestrator decision: a row the filter hides is not updated.
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.asked = []
      const ui = await openAndMount($, w, `update-filter-${surface}-${columns}`, surface, columns)
      w.calls = []
      await ui.input({ key: 'mm-filter', text: 'zzz', kind: 'change' })
      await idle(w)
      expect((await ui.find({ key: 'mm-update-all' }))?.props.label).toBe(columns === 16 ? 'u: Upda…' : 'u: Update all (1)')
      w.answer = UPDATE_ALL_LABEL
      await ui.press({ key: 'mm-update-all' })
      await idle(w)
      w.answer = undefined
      expect(w.asked).toEqual([QUESTION_UPDATE_ALL_ZZZ])
      expect(actions(w)).toEqual([{ argv: UPDATE_ZZZ, cwd: undefined }])
      // A filter that shows no row with an arrow draws no Update all; cleared, the count is back to both rows.
      await ui.input({ key: 'mm-filter', text: 'mmm', kind: 'change' })
      await idle(w)
      expect(await ui.find({ key: 'mm-update-all' })).toBeUndefined()
      await ui.input({ key: 'mm-filter', text: '', kind: 'change' })
      await idle(w)
      expect((await ui.find({ key: 'mm-update-all' }))?.props.label).toBe(columns === 16 ? 'u: Upda…' : 'u: Update all (2)')
      await ui.unmount()
    }
  })
})
describe('2h: names through printable, the status-line badge and Reload', () => {
  test('a control character in a plugin name or a marketplace name is drawn as ?: in the row, its version line and its section header', async ($, on) => {
    // 2h part 1 (review of 262b0ed): both names come from the id in the list, text from outside the pane. PLUGIN_ID refuses
    // both ids, so neither row offers a button, and the busy text, which names only a row with a button, cannot hold one.
    const shown = { id: 'esc\u001b[2J-tool@mark\u0007et', version: '1.0.0', scope: 'user', enabled: true, installPath: '/cache/x/esc/1.0.0' }
    const off = { id: 'off-tool@bad\u009bmarket', version: '1.0.0', scope: 'user', enabled: false, installPath: '/cache/y/off-tool/1.0.0' }
    const w = world(on, [shown, off])
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `printable-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ type: 'Text', text: 'esc?[2J-tool' })).toBeDefined()
      // No marketplace list is given, so the row's latest version is unknown once that read ends.
      expect(await ui.find({ type: 'Text', text: '1.0.0 · latest unknown · mark?et · user scope' })).toBeDefined()
      // The key keeps the name as it is (an address, never drawn); the label shows it through printable.
      expect(await sectionLabel(ui, 'mm-sec-bad\u009bmarket')).toBe(fitLabel('1 off · bad?market', columns - 8))
      await ui.press({ key: 'mm-sec-bad\u009bmarket' })
      await idle(w)
      expect(await ui.find({ type: 'Text', text: '1.0.0 · latest unknown · bad?market · user scope' })).toBeDefined()
      // Nothing drawn in the pane holds a control character: no Text and no Button label.
      const texts = (await ui.findAll({ type: 'Text' })).map((text) => String(text.children))
      const labels = (await ui.findAll({ type: 'Button' })).map((button) => String(button.props.label))
      expect([...texts, ...labels].filter((text) => /\p{Cc}/u.test(text))).toEqual([])
      await ui.unmount()
    }
  })

  test('the status line counts the rows with an update arrow once the catalogs are read, names /mods-manager, and is cleared when none is left or no version is known', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.files = { ...CATALOG_FILES }
      w.marketFails = false
      w.statuses = []
      const hold = deferred()
      w.marketHold = hold
      const ui = await openAndMount($, w, `badge-${surface}-${columns}`, surface, columns)
      // Nothing is set while the catalogs are read, so the line does not blink off at the start of a read.
      expect(w.statuses).toEqual([])
      hold.resolve()
      await idle(w)
      expect(w.statuses).toEqual([BADGE_TWO])
      // A read whose marketplace list fails knows no latest version, so it claims no update.
      w.marketFails = 'stderr'
      await ui.press({ key: 'mm-refresh' })
      await idle(w)
      expect(w.statuses).toEqual([BADGE_TWO, undefined])
      // ddd-local's plugin.json now says 1.0.0, the version it has: one arrow is left, and the count says so.
      w.marketFails = false
      w.files[DDD_MANIFEST] = '{"name": "ddd-local", "version": "1.0.0"}'
      await ui.press({ key: 'mm-refresh' })
      await idle(w)
      expect(w.statuses).toEqual([BADGE_TWO, undefined, BADGE_ONE])
      w.files[CATALOG_A] = catalogA('2.0.0')
      await ui.press({ key: 'mm-refresh' })
      await idle(w)
      expect(w.statuses).toEqual([BADGE_TWO, undefined, BADGE_ONE, undefined])
      await ui.unmount()
    }
  })

  test('the status line counts a row whose update needs the terminal: it keeps its arrow, though Update all leaves it out', async ($, on) => {
    const w = withCatalogs(world(on, [HELPER_ARCHIVE_ROW, HELPER_GITHUB_ROW]))
    w.files[CATALOG_A] = catalogA('10.0.0', HELPER_ENTRIES)
    for (const { surface, columns } of PLACES) {
      w.statuses = []
      const ui = await openAndMount($, w, `badge-helper-${surface}-${columns}`, surface, columns)
      expect((await ui.find({ key: 'mm-update-all' }))?.props.label).toBe(columns === 16 ? 'u: Upda…' : 'u: Update all (1)')
      expect(w.statuses).toEqual([BADGE_TWO])
      await ui.unmount()
    }
  })

  test('Reload runs /reload-plugins with no argument and asks nothing; while it waits, its busy line refuses a press; then the pane shows what it answered, each control character as ?', async ($, on) => {
    const w = world(on)
    for (const { surface, columns } of PLACES) {
      w.reloads = []
      w.asked = []
      w.toasts = []
      w.logs = []
      const ui = await openAndMount($, w, `reload-${surface}-${columns}`, surface, columns)
      w.calls = []
      const reload = await ui.find({ key: 'mm-reload' })
      expect(reload?.props.label).toBe(fitLabel(RELOAD_LABEL, columns - 8))
      expect(reload?.props.hotkey).toBe('l')
      const hold = deferred()
      w.reloadHold = hold
      await ui.press({ key: 'mm-reload' })
      await idle(w)
      expect(await ui.find({ type: 'Text', text: RELOADING })).toBeDefined()
      await ui.press({ key: 'mm-refresh' })
      await ui.press({ key: 'mm-reload' })
      await idle(w)
      expect(w.toasts).toEqual([REFUSED_WHILE_RELOADING, REFUSED_WHILE_RELOADING])
      hold.resolve()
      await idle(w)
      // One reload, with no argument: never --force (plugin commands chapter, line 871).
      expect(w.reloads).toEqual([''])
      expect(w.asked).toEqual([])
      // No claude process: the reload is a command of the session, not a claude call.
      expect(w.calls).toEqual([])
      expect(await ui.find({ type: 'Text', text: RELOADED_MESSAGE })).toBeDefined()
      // The debug log gets the same line, through printable too.
      expect(w.logs.filter((log) => log.to === 'debug' && log.text.startsWith('mods-manager: /reload-plugins')).map((log) => log.text)).toEqual([`mods-manager: ${RELOADED_MESSAGE}`])
      expect(await ui.find({ type: 'Text', text: RELOADING })).toBeUndefined()
      await ui.unmount()
    }
  })

  test('Reload pressed while a change runs is refused with a toast and reloads nothing; after the change it reloads, and the next-session line stays', async ($, on) => {
    const w = world(on)
    for (const { surface, columns } of PLACES) {
      w.reloads = []
      w.toasts = []
      const ui = await openAndMount($, w, `reload-busy-${surface}-${columns}`, surface, columns)
      const hold = deferred()
      w.hold = hold
      w.answer = 'Turn it off'
      await ui.press({ key: 'mm-toggle-zzz-tool@market-a|user' })
      await idle(w)
      w.answer = undefined
      await ui.press({ key: 'mm-reload' })
      await idle(w)
      expect(w.toasts).toEqual([REFUSED_WHILE_DISABLING])
      expect(w.reloads).toEqual([])
      hold.resolve()
      await idle(w)
      expect(await ui.find({ type: 'Text', text: NEXT_SESSION })).toBeDefined()
      await ui.press({ key: 'mm-reload' })
      await idle(w)
      expect(w.reloads).toEqual([''])
      // This copy heard the reload answer, so the reload did not replace it and may not have applied: the line stays.
      expect(await ui.find({ type: 'Text', text: NEXT_SESSION })).toBeDefined()
      await ui.unmount()
    }
  })

  test('a reload that $.command.run rejects says so and says to type /reload-plugins, and the claim is released', async ($, on) => {
    const w = world(on)
    w.reloadFails = true
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `reload-fails-${surface}-${columns}`, surface, columns)
      await ui.press({ key: 'mm-reload' })
      await idle(w)
      const message = (await ui.findAll({ type: 'Text' })).map((text) => String(text.children)).filter((text) => text.startsWith('/reload-plugins'))
      expect(message).toHaveLength(1)
      expect(message[0]).toMatch(/^\/reload-plugins could not run \(.+\)\. Type \/reload-plugins in the prompt\.$/)
      w.calls = []
      await ui.press({ key: 'mm-refresh' })
      await idle(w)
      expect(w.calls.filter((call) => call.argv[2] === 'list')).toHaveLength(1)
      await ui.unmount()
    }
  })

  test('a session start that finds the pane still open, as a reload leaves it, reads the list again; with no pane open, or only another pane of this plugin, it reads nothing', async ($, on) => {
    const w = world(on)
    const paneOf = (id: string) => ({ id, title: id, isShown: true, isFocused: false, isPlaced: true })
    const cases = [
      { name: 'open', panes: [paneOf('mod-manager')], reads: 1 },
      { name: 'none', panes: [], reads: 0 },
      { name: 'other', panes: [paneOf('self-command')], reads: 0 },
    ]
    for (const { name, panes, reads } of cases) {
      w.calls = []
      w.panes = panes
      w.session = `start-reread-${name}`
      await start($, 'terminal')
      await idle(w)
      expect(w.calls.filter((call) => call.argv[2] === 'list')).toHaveLength(reads)
      if (reads === 1) {
        const ui = await $.ui.mount(pane('terminal', 160))
        expect(await ui.find({ type: 'Text', text: '5 installed · 3 active · 2 mods' })).toBeDefined()
        await ui.unmount()
      }
    }
    w.panes = []
  })

  test('a session start whose pane lookup is refused logs why to the debug log, reads nothing, and the command is still registered', async ($, on) => {
    const w = world(on)
    w.panesFails = true
    w.session = 'start-panes-refused'
    await start($, 'terminal')
    await idle(w)
    expect(w.commands.filter((name) => name === 'mods-manager')).toEqual(['mods-manager'])
    expect(w.calls.filter((call) => call.argv[2] === 'list')).toEqual([])
    const lines = w.logs.filter((log) => log.text.startsWith('mods-manager: the open panes could not be listed, so an open pane is not read again: '))
    expect(lines.map((log) => log.to)).toEqual(['debug'])
  })
})

describe('the 2h rules', () => {
  const oddRow = toRow(parseInstalled(JSON.stringify([{ id: 'a\u001bb@m\u0007k', version: '1.0.0', scope: 'user', enabled: false, installPath: '/cache/x' }])).entries[0]!, false)

  test('questionFor, doneText, currentText, versionLine and the section label show a control character in a name as ?', () => {
    expect(questionFor('disable', oddRow)).toBe('Turn it off: a?b (user scope)? It stops loading in your next session.')
    expect(doneText('update', oddRow)).toBe('a?b updated. Applies in your next session.')
    expect(currentText(oddRow)).toBe('No newer version of a?b was found.')
    expect(versionLine(oddRow, undefined)).toBe('1.0.0 · m?k · user scope')
    // The key keeps the marketplace as it is: an address the pane never draws.
    expect(sectionsOf([oddRow]).map((section) => [section.key, section.label])).toEqual([['m\u0007k', '1 off · m?k']])
  })

  test('updateCount counts every row with an update arrow, a terminal-only one too; badgeText names the count and /mods-manager, and is undefined at zero', () => {
    const [aaa, zzz, , , ddd] = parseInstalled(JSON.stringify(PLUGINS)).entries.map((entry) => toRow(entry, false))
    const latest = new Map<string, Latest>([
      ['zzz-tool@market-a', { kind: 'known', version: '10.0.0', from: 'catalog' }],
      ['aaa-mod@market-a', { kind: 'known', version: '1.2.0', from: 'catalog', asksToAccept: true }],
      ['ddd-local@market-a', { kind: 'known', version: '1.0.0', from: 'folder' }],
    ])
    const rows = [aaa!, zzz!, ddd!]
    expect(updatableHere(aaa!, latest.get(aaa!.id))).toBe(false)
    expect(updateCount(rows, latest)).toBe(2)
    expect(updateCount(rows, undefined)).toBe(0)
    expect(updateCount([], latest)).toBe(0)
    expect(badgeText(0)).toBeUndefined()
    expect(badgeText(1)).toBe('1 plugin update · /mods-manager')
    expect(badgeText(7)).toBe('7 plugin updates · /mods-manager')
  })

  test('reloadAnswerText joins the non-empty lines of the answer, or says nothing was printed; reloadFailedText keeps the first line of why', () => {
    expect(reloadAnswerText(undefined)).toBe('/reload-plugins printed nothing.')
    expect(reloadAnswerText(' \n \n')).toBe('/reload-plugins printed nothing.')
    expect(reloadAnswerText('Reloaded: 3 plugins\n  1 error  \n')).toBe('/reload-plugins answered: Reloaded: 3 plugins 1 error')
    expect(reloadFailedText('refused inside a hook the turn waits on\nsecond line')).toBe(
      '/reload-plugins could not run (refused inside a hook the turn waits on). Type /reload-plugins in the prompt.',
    )
  })

  test('paneIsOpen is true only when the mod-manager pane is among the open panes', () => {
    expect(paneIsOpen([{ id: 'mod-manager' }])).toBe(true)
    expect(paneIsOpen([{ id: 'self-command' }, { id: 'mod-manager' }])).toBe(true)
    expect(paneIsOpen([{ id: 'self-command' }, { id: 'other-plugin-pane' }])).toBe(false)
    expect(paneIsOpen([])).toBe(false)
  })
})
describe('the confirm guard, with plain answer functions', () => {
  // confirmThenRun is the rule confirmAndAct runs, given plain answers in place of the engine dialog.
  test('confirm runs the action exactly once and reports ran', async () => {
    let runs = 0
    const outcome = await confirmThenRun('disable', async () => 'Turn it off', async () => {
      runs += 1
    })
    expect(outcome).toBe('ran')
    expect(runs).toBe(1)
  })

  test('decline runs nothing and reports declined', async () => {
    let runs = 0
    const outcome = await confirmThenRun('disable', async () => KEEP, async () => {
      runs += 1
    })
    expect(outcome).toBe('declined')
    expect(runs).toBe(0)
  })

  test('a rejected ask, a dismissed question, runs nothing and reports dismissed', async () => {
    let runs = 0
    const outcome = await confirmThenRun(
      'disable',
      async () => {
        throw new Error('the question was dismissed')
      },
      async () => {
        runs += 1
      },
    )
    expect(outcome).toBe('dismissed')
    expect(runs).toBe(0)
  })

  test('any other label runs nothing and reports declined: another label, another case, a stray space, free text', async () => {
    for (const answer of ['Turn it on', 'Uninstall it', 'turn it off', 'Turn it off ', 'Turn it off, please']) {
      let runs = 0
      const outcome = await confirmThenRun('disable', async () => answer, async () => {
        runs += 1
      })
      expect(outcome).toBe('declined')
      expect(runs).toBe(0)
    }
  })
})

describe('the rules under the pane', () => {
  const entry = (name: string, enabled: boolean): Installed => ({
    id: `${name}@m`,
    version: undefined,
    scope: 'user',
    enabled,
    installPath: `/cache/m/${name}`,
    readFromFolder: undefined,
    folderVersion: undefined,
    projectPath: undefined,
  })

  test('parseInstalled reads the list, and names each entry of a shape it does not know while still reading the others', () => {
    expect(parseInstalled(JSON.stringify([PLUGINS[0]]))).toEqual({
      entries: [{ id: 'aaa-mod@market-a', version: '1.0.0', scope: 'user', enabled: false, installPath: '/cache/market-a/aaa-mod/1.0.0', readFromFolder: undefined, folderVersion: undefined, projectPath: undefined }],
      rejected: [],
    })
    expect(() => parseInstalled('{"installed": []}')).toThrow('did not answer a list')
    const listed = parseInstalled(JSON.stringify([{ ...PLUGINS[0], scope: 'team' }, PLUGINS[1], { ...PLUGINS[2], enabled: 'yes' }, 7, { scope: 'user' }, { ...PLUGINS[3], scope: undefined }]))
    expect(listed.entries.map((entry) => entry.id)).toEqual(['zzz-tool@market-a'])
    expect(listed.rejected).toEqual([
      { index: 0, id: 'aaa-mod@market-a', reason: `scope "team" is not one of ${SIX_SCOPES}` },
      { index: 2, id: 'mmm-mod@market-b', reason: 'enabled is not true or false' },
      { index: 3, id: undefined, reason: 'it is not an object' },
      { index: 4, id: undefined, reason: 'id is not a string; enabled is not true or false; installPath is not a string' },
      { index: 5, id: 'ccc-plain@market-b', reason: 'scope is missing' },
    ])
    expect(rejectedText(listed.rejected[0]!)).toBe(`Entry 0 of the plugin list (aaa-mod@market-a) is not shown: scope "team" is not one of ${SIX_SCOPES}.`)
    expect(rejectedText(listed.rejected[2]!)).toBe('Entry 3 of the plugin list is not shown: it is not an object.')
  })

  test('parseInstalled reads an entry of each of the six documented scopes, the synced one in the shape Claude Code 2.1.316 prints', () => {
    const listed = parseInstalled(JSON.stringify(SCOPED))
    expect(listed.rejected).toEqual([])
    expect(listed.entries.map((entry) => entry.scope)).toEqual(['user', 'project', 'local', 'managed', 'session', 'synced'])
    expect(listed.entries[5]).toEqual({ ...SCOPED[5], readFromFolder: undefined, folderVersion: undefined, projectPath: undefined })
  })

  test('parseInstalled keeps readFromFolder, the folder a plugin loaded in place is read from', () => {
    expect(parseInstalled(JSON.stringify([IN_PLACE])).entries).toEqual([{ ...IN_PLACE, folderVersion: undefined, projectPath: undefined }])
  })

  test('rejectedText shows a control character in an id or a reason as ?, so it never reaches the terminal', () => {
    expect(rejectedText({ index: 3, id: 'odd\u0007bell@m', reason: 'scope "a\u001bb" is not one of x' })).toBe('Entry 3 of the plugin list (odd?bell@m) is not shown: scope "a?b" is not one of x.')
  })

  test('classifyHooks: a non-empty modules list makes a mod; an empty, absent or malformed one does not', () => {
    expect(classifyHooks('{"modules": ["./index.ts"]}')).toEqual({ isMod: true, problem: undefined })
    expect(classifyHooks('{"modules": []}')).toEqual({ isMod: false, problem: undefined })
    expect(classifyHooks('{"hooks": {}}')).toEqual({ isMod: false, problem: undefined })
    expect(classifyHooks('{ not json').isMod).toBe(false)
    expect(classifyHooks('{ not json').problem).toMatch(/^not JSON/)
  })

  test('hookFilesOf: the array form reads each declared path after the default file, with a leading ./ removed and listed once', () => {
    expect(hookFilesOf('{"hooks": ["./hooks/a.json", "hooks/b.json", "./hooks/hooks.json"]}')).toEqual({
      paths: ['hooks/hooks.json', 'hooks/a.json', 'hooks/b.json'],
      inlineIsMod: false,
      rejected: [],
      problem: undefined,
    })
  })

  test('hookFilesOf: the string form is one more file', () => {
    expect(hookFilesOf('{"hooks": "./hooks/a.json"}')).toEqual({ paths: ['hooks/hooks.json', 'hooks/a.json'], inlineIsMod: false, rejected: [], problem: undefined })
  })

  test('hookFilesOf: an inline hooks object is a mod only when its modules list is not empty', () => {
    expect(hookFilesOf('{"hooks": {"modules": ["./index.ts"]}}')).toEqual({ paths: ['hooks/hooks.json'], inlineIsMod: true, rejected: [], problem: undefined })
    expect(hookFilesOf('{"hooks": {"modules": []}}').inlineIsMod).toBe(false)
    expect(hookFilesOf('{"hooks": {"hooks": {}}}').inlineIsMod).toBe(false)
  })

  test('hookFilesOf: a manifest with no hooks field checks only the default file', () => {
    expect(hookFilesOf('{"name": "x"}')).toEqual({ paths: ['hooks/hooks.json'], inlineIsMod: false, rejected: [], problem: undefined })
  })

  test('hookFilesOf: an unreadable manifest checks only the default file, and a manifest that is not JSON names the problem', () => {
    expect(hookFilesOf(undefined)).toEqual({ paths: ['hooks/hooks.json'], inlineIsMod: false, rejected: [], problem: undefined })
    const broken = hookFilesOf('{ not json')
    expect(broken.paths).toEqual(['hooks/hooks.json'])
    expect(broken.problem).toMatch(/^not JSON/)
  })

  test('hookFilesOf: a declared path that is absolute (POSIX, Windows drive or backslash-rooted) or contains .. is never read, and is returned in rejected', () => {
    expect(hookFilesOf('{"hooks": ["../escape.json", "/cache/escape.json", "C:\\\\plugins\\\\escape.json", "\\\\\\\\server\\\\share\\\\escape.json", "./hooks/ok.json"]}')).toEqual({
      paths: ['hooks/hooks.json', 'hooks/ok.json'],
      inlineIsMod: false,
      rejected: ['../escape.json', '/cache/escape.json', 'C:\\plugins\\escape.json', '\\\\server\\share\\escape.json'],
      problem: undefined,
    })
  })

  test('appliesHere: a user entry everywhere, a project or local one only in or under its folder', () => {
    const [user, local, elsewhere] = parseInstalled(JSON.stringify([PLUGINS[0], PLUGINS[4], PLUGINS[5]])).entries
    expect(isWithin('/work/app/sub', '/work/app')).toBe(true)
    expect(isWithin('/work/application', '/work/app')).toBe(false)
    expect(appliesHere(user!, ROOT)).toBe(true)
    expect(appliesHere(local!, ROOT)).toBe(true)
    expect(appliesHere(local!, '/work')).toBe(false)
    expect(appliesHere(elsewhere!, ROOT)).toBe(false)
  })

  test('appliesHere per scope: user, managed, synced and session entries everywhere; project and local only under their folder', () => {
    const { entries } = parseInstalled(JSON.stringify(SCOPED))
    const here = (root: string) => Object.fromEntries(entries.map((entry) => [entry.scope, appliesHere(entry, root)]))
    expect(here(ROOT)).toEqual({ user: true, project: true, local: true, managed: true, session: true, synced: true })
    expect(here('/elsewhere')).toEqual({ user: true, project: false, local: false, managed: true, session: true, synced: true })
  })

  test('sectionsOf: one Enabled section with every enabled row in orderRows order, then one section per marketplace with only its disabled rows; an id with no @ goes to its own group', () => {
    const at = (name: string, marketplace: string, enabled: boolean, isMod: boolean) => toRow({ ...entry(name, enabled), id: `${name}@${marketplace}` }, isMod)
    const rows = [
      at('p1', 'dead', false, false),
      at('p2', 'beta', true, false),
      at('p3', 'alpha', true, false),
      at('m1', 'zulu', true, true),
      at('m2', 'zulu', false, true),
      at('p4', 'zulu', true, false),
      toRow({ ...entry('bare', false), id: 'bare' }, false),
      at('m3', 'alpha', false, true),
    ]
    const sections = sectionsOf(rows)
    expect(toRow({ ...entry('bare', false), id: 'bare' }, false).marketplace).toBe(NO_MARKETPLACE)
    expect(sections.map((s) => s.key)).toEqual([ENABLED_KEY, NO_MARKETPLACE, 'alpha', 'dead', 'zulu'])
    // The count comes first in every label, so a cut label keeps it.
    expect(sections.map((s) => s.label)).toEqual(['4 enabled', '1 off · (no marketplace)', '1 off · alpha', '1 off · dead', '1 off · zulu'])
    // Enabled: the enabled mod first, then the enabled plugins by name, from three different marketplaces.
    expect(sections[0]!.rows.map((r) => r.name)).toEqual(['m1', 'p2', 'p3', 'p4'])
    expect(sections.slice(1).map((s) => s.rows.map((r) => r.name))).toEqual([['bare'], ['m3'], ['p1'], ['m2']])
    // No row is shown twice.
    expect(sections.flatMap((s) => s.rows)).toHaveLength(rows.length)
  })

  test('filterRows: every whitespace-separated term must match the name, id or marketplace (any case), "mod" selects mods only, an empty or spaces-only query keeps all', () => {
    const at = (name: string, marketplace: string, isMod: boolean) => toRow({ ...entry(name, true), id: `${name}@${marketplace}` }, isMod)
    const rows = [at('Alpha-tool', 'north', false), at('beta', 'north', true), at('gamma', 'south', false), at('model-tools', 'south', false)]
    const names = (query: string) => filterRows(rows, query).map((row) => row.name)
    expect(names('gam')).toEqual(['gamma'])
    expect(names('ALPHA')).toEqual(['Alpha-tool'])
    expect(names('north')).toEqual(['Alpha-tool', 'beta'])
    expect(names('beta@north')).toEqual(['beta'])
    expect(names('north beta')).toEqual(['beta'])
    expect(names('north south')).toEqual([])
    // "mod" as a whole term keeps the mods ONLY (not model-tools, whose name contains it); "mo" and "model" are plain text.
    expect(names('mod')).toEqual(['beta'])
    expect(names('mod north')).toEqual(['beta'])
expect(names('mo')).toEqual(['model-tools'])
    expect(names('model')).toEqual(['model-tools'])
    expect(names('')).toEqual(rows.map((row) => row.name))
    expect(names('   ')).toEqual(rows.map((row) => row.name))
    expect(filterRows(rows, '  ')).toEqual(rows)
  })
  test('orderRows: enabled mods, disabled mods, enabled plugins, disabled plugins; each group by name', () => {
    const rows = [
      toRow(entry('zzz', true), false),
      toRow(entry('aaa', false), true),
      toRow(entry('bbb', true), true),
      toRow(entry('mmm', false), false),
      toRow(entry('ccc', true), false),
    ]
    expect(orderRows(rows).map((row) => row.id)).toEqual(['bbb@m', 'aaa@m', 'ccc@m', 'zzz@m', 'mmm@m'])
  })

  test('actionArgv per scope and action: user, project and local name their scope; synced and session ids go alone, with no --scope', () => {
    for (const scope of ['user', 'project', 'local'] as const) {
      for (const action of ['enable', 'disable', 'uninstall'] as const) {
        expect(actionArgv(CLAUDE, action, { id: 'zzz@m', scope })).toEqual([CLAUDE, 'plugin', action, 'zzz@m', '--scope', scope])
      }
    }
    // A skills-folder plugin reports user or project scope and is named by its id alone, in the form the docs give
    // (plugins-creation chapter, line 262: `claude plugin disable <name>@skills-dir`, with no --scope).
    for (const scope of ['user', 'project'] as const) {
      for (const action of ['enable', 'disable'] as const) {
        expect(actionArgv(CLAUDE, action, { id: 'kkk-skill@skills-dir', scope })).toEqual([CLAUDE, 'plugin', action, 'kkk-skill@skills-dir'])
      }
    }
    // Chapter lines 202, 238 and 894: a synced or session plugin is named `<name>@synced` or `<name>@inline`, and --scope takes neither.
    expect(actionArgv(CLAUDE, 'enable', { id: 'engineering@synced', scope: 'synced' })).toEqual([CLAUDE, 'plugin', 'enable', 'engineering@synced'])
    expect(actionArgv(CLAUDE, 'disable', { id: 'engineering@synced', scope: 'synced' })).toEqual([CLAUDE, 'plugin', 'disable', 'engineering@synced'])
    expect(actionArgv(CLAUDE, 'disable', { id: 'sss-session@inline', scope: 'session' })).toEqual([CLAUDE, 'plugin', 'disable', 'sss-session@inline'])
  })

  test('actionArgv refuses an action a scope does not offer, an id not in its scope\'s documented form, and an id that could be read as a flag or a path', () => {
    const refused: Array<[Action, Scope, string]> = [
      ['uninstall', 'synced', 'engineering@synced'],
      ['enable', 'session', 'sss-session@inline'],
      ['uninstall', 'session', 'sss-session@inline'],
      ['enable', 'managed', 'ggg-managed@market-org'],
      ['disable', 'managed', 'ggg-managed@market-org'],
      ['uninstall', 'managed', 'ggg-managed@market-org'],
    ]
    for (const [action, scope, id] of refused) {
      expect(() => actionArgv(CLAUDE, action, { id, scope })).toThrow(`refused: ${action} is not offered for a ${scope} plugin`)
    }
    expect(() => actionArgv(CLAUDE, 'disable', { id: 'engineering@market-a', scope: 'synced' })).toThrow('is not the documented id of a synced plugin')
    expect(() => actionArgv(CLAUDE, 'disable', { id: 'sss-session@synced', scope: 'session' })).toThrow('is not the documented id of a session plugin')
    // A skills-folder plugin cannot be uninstalled: Claude Code 2.1.316 refuses it ("Delete the directory to remove it").
    for (const scope of ['user', 'project'] as const) {
      expect(() => actionArgv(CLAUDE, 'uninstall', { id: 'kkk-skill@skills-dir', scope })).toThrow('refused: uninstall is not offered for a skills-directory plugin')
    }
    for (const id of ['--all', '../x@m', 'x@m; rm', 'x', 'X@m', 'a@b c']) {
      expect(() => actionArgv(CLAUDE, 'enable', { id, scope: 'user' })).toThrow('is not a plugin id')
    }
  })

  test('actionCwd: a project or local row runs in its own folder; a row of any other scope runs in none, even when it carries a projectPath', () => {
    expect(actionCwd({ scope: 'project', projectPath: '/work/app' })).toBe('/work/app')
    expect(actionCwd({ scope: 'local', projectPath: '/work/app' })).toBe('/work/app')
    for (const scope of ['user', 'managed', 'session', 'synced'] as const) {
      expect(actionCwd({ scope, projectPath: '/work/app' })).toBeUndefined()
    }
  })

  test('actionsFor: the buttons of a row of each scope, on and off', () => {
    const offered = (id: string, scope: Scope) => [actionsFor({ id, scope, enabled: true }), actionsFor({ id, scope, enabled: false })]
    for (const scope of ['user', 'project', 'local'] as const) {
      expect(offered('zzz@m', scope)).toEqual([['disable', 'uninstall'], ['enable', 'uninstall']])
    }
    expect(offered('engineering@synced', 'synced')).toEqual([['disable'], ['enable']])
    expect(offered('sss-session@inline', 'session')).toEqual([['disable'], []])
    expect(offered('ggg-managed@market-org', 'managed')).toEqual([[], []])
  })

  test('actionsFor: a skills-folder row turns on or off but has no Uninstall, and a row whose id is refused has no action at all', () => {
    for (const scope of ['user', 'project'] as const) {
      expect(actionsFor({ id: 'kkk-skill@skills-dir', scope, enabled: true })).toEqual(['disable'])
      expect(actionsFor({ id: 'kkk-skill@skills-dir', scope, enabled: false })).toEqual(['enable'])
    }
    for (const id of ['Upper-Case@market-a', 'no-marketplace', '--all']) {
      expect(actionsFor({ id, scope: 'user', enabled: true })).toEqual([])
      expect(actionsFor({ id, scope: 'user', enabled: false })).toEqual([])
    }
  })

  test('lockedNote names why a row has no button, and is undefined for a row that has one', () => {
    expect(lockedNote({ id: 'ggg-managed@market-org', scope: 'managed', enabled: true })).toBe(MANAGED_NOTE)
    expect(lockedNote({ id: 'ggg-managed@market-org', scope: 'managed', enabled: false })).toBe(MANAGED_NOTE)
    expect(lockedNote({ id: 'sss-session@inline', scope: 'session', enabled: false })).toBe('Loaded for this session only: turning it on is not offered here.')
    expect(lockedNote({ id: 'sss-session@inline', scope: 'session', enabled: true })).toBeUndefined()
    expect(lockedNote({ id: 'engineering@synced', scope: 'synced', enabled: false })).toBeUndefined()
    expect(lockedNote({ id: 'zzz@m', scope: 'user', enabled: true })).toBeUndefined()
  })

  test('lockedNote: a skills-folder row says to delete its folder, and a row whose id is refused says why it offers nothing', () => {
    for (const enabled of [true, false]) {
      expect(lockedNote({ id: 'kkk-skill@skills-dir', scope: 'user', enabled })).toBe(SKILLS_DIR_NOTE)
      expect(lockedNote({ id: 'Upper-Case@market-a', scope: 'user', enabled })).toBe(REFUSED_ID_NOTE)
    }
  })

  test('questionFor: a synced row says it is removed on claude.ai, a session row that an installed copy loads instead; other scopes add nothing', () => {
    const row = (id: string, scope: Scope) => toRow({ id, version: undefined, scope, enabled: true, installPath: '/cache/x', readFromFolder: undefined, folderVersion: undefined, projectPath: undefined }, false)
    expect(questionFor('disable', row('engineering@synced', 'synced'))).toBe(QUESTION_DISABLE_SYNCED)
    expect(questionFor('enable', row('engineering@synced', 'synced'))).toBe(
      'Turn it on: engineering (synced scope)? It loads in your next session. It is synced from claude.ai: to remove it, turn it off there.',
    )
    expect(questionFor('disable', row('sss-session@inline', 'session'))).toBe(QUESTION_DISABLE_SESSION)
    expect(questionFor('disable', row('zzz-tool@market-a', 'user'))).toBe(QUESTION_DISABLE_ZZZ)
  })

  test('isConfirmed lets an action run only for its own confirm label', () => {
    expect(isConfirmed('Turn it off', 'disable')).toBe(true)
    expect(isConfirmed('Turn it on', 'enable')).toBe(true)
    expect(isConfirmed('Uninstall it', 'uninstall')).toBe(true)
    expect(isConfirmed('Turn it on', 'disable')).toBe(false)
    expect(isConfirmed('turn it off', 'disable')).toBe(false)
    expect(isConfirmed(KEEP, 'disable')).toBe(false)
    expect(isConfirmed('', 'uninstall')).toBe(false)
  })

  test('fitLabel cuts a label to the room with an ellipsis, and keeps a label that fits', () => {
    expect(fitLabel('Turn off', 8)).toBe('Turn off')
    expect(fitLabel('Uninstall', 8)).toBe('Uninsta…')
    expect(fitLabel('Uninstall', 1)).toBe('')
    // The room counts UTF-16 units, the two columns an emoji takes; the cut never splits a character outside the BMP.
    expect(fitLabel('a\u{1F600}', 3)).toBe('a\u{1F600}')
    expect(fitLabel('ab\u{1F600}', 3)).toBe('ab…')
    expect(fitLabel('a\u{1F600}\u{1F600}c', 4)).toBe('a\u{1F600}…')
    expect(fitLabel('a\u{1F600}\u{1F600}c', 3)).toBe('a…')
  })
})

describe('the latest-version rules', () => {
  test('compareVersions compares number by number, and never compares a version that is not plain dotted numbers', () => {
    expect(compareVersions('10.0.0', '2.0.0')).toBe(1)
    expect(compareVersions('1.9.3', '1.10.0')).toBe(-1)
    expect(compareVersions('1.2', '1.2.0')).toBe(0)
    expect(compareVersions('1.2.1', '1.2')).toBe(1)
    expect(compareVersions('1.2.3.4', '1.2.3')).toBe(1)
    // Equal versions of 50000 digits are equal, and 2^53+1 is newer than 2^53: a Number could tell neither apart.
    expect(compareVersions('1'.repeat(50000), '1'.repeat(50000))).toBe(0)
    expect(compareVersions('9007199254740993', '9007199254740992')).toBe(1)
    // Long inputs: each is refused, not compared.
    const long = ['1.'.repeat(20000) + 'x', '1'.repeat(50000) + '.', '1.'.repeat(20000) + '1 ']
    for (const odd of ['2.0.0-beta', 'v2.0.0', 'abc123def456', 'unknown', '', '1..2', '1.2.', ' 1.0.0', '.1', '1.0\n', ...long]) {
      expect(compareVersions(odd, '1.0.0')).toBeUndefined()
      expect(compareVersions('1.0.0', odd)).toBeUndefined()
    }
    // Where the version was read changes its label, never whether it draws an arrow.
    for (const from of ['folder', 'catalog'] as const) {
      expect(hasUpdate('2.0.0', { kind: 'known', version: '10.0.0', from })).toBe(true)
      expect(hasUpdate('2.0.0', { kind: 'known', version: '2.0.0', from })).toBe(false)
      expect(hasUpdate('2.0.0', { kind: 'known', version: '1.0.0', from })).toBe(false)
      expect(hasUpdate('2.0.0', { kind: 'known', version: '3.0.0-beta', from })).toBe(false)
      expect(hasUpdate(undefined, { kind: 'known', version: '1.0.0', from })).toBe(false)
    }
    expect(hasUpdate('1.0.0', UNKNOWN)).toBe(false)
    expect(hasUpdate('1.0.0', undefined)).toBe(false)
  })

  test('parseCatalog reads each entry\'s version and the folder a relative-path source names, and refuses a folder outside the marketplace', () => {
    const catalog = parseCatalog(
      JSON.stringify({
        metadata: { pluginRoot: './plugins' },
        plugins: [
          { name: 'root', source: '.' },
          { name: 'dotted', source: './tools/dotted', version: '1.0.0' },
          { name: 'bare', source: 'bare' },
          { name: 'up', source: './../outside' },
          { name: 'up-bare', source: '..' },
          { name: 'absolute', source: '/etc' },
          { name: 'backslash', source: '.\\tools' },
          { name: 'slash', source: 'tools/slash' },
          { name: 'remote', source: { source: 'github', repo: 'org/remote' }, version: '2.0.0' },
          { name: 'command', source: { source: 'command', command: 'make' }, version: '3.0.0' },
          { name: 'dotted', source: '.', version: '9.9.9' },
          { source: '.' },
          7,
        ],
      }),
    )
    expect([...catalog.entries()]).toEqual([
      ['root', { version: undefined, folder: '', asksToAccept: false }],
      ['dotted', { version: '1.0.0', folder: 'tools/dotted', asksToAccept: false }],
      ['bare', { version: undefined, folder: 'plugins/bare', asksToAccept: false }],
      ['up', { version: undefined, folder: undefined, asksToAccept: false }],
      ['up-bare', { version: undefined, folder: undefined, asksToAccept: false }],
      ['absolute', { version: undefined, folder: undefined, asksToAccept: false }],
      ['backslash', { version: undefined, folder: undefined, asksToAccept: false }],
      ['slash', { version: undefined, folder: undefined, asksToAccept: false }],
      ['remote', { version: '2.0.0', folder: undefined, asksToAccept: false }],
      ['command', { version: undefined, folder: undefined, asksToAccept: false, declares: true }],
    ])
    // Without pluginRoot a bare name is not a relative path, and a pluginRoot outside the marketplace is refused too.
    expect(parseCatalog('{"plugins": [{"name": "bare", "source": "bare"}]}').get('bare')).toEqual({ version: undefined, folder: undefined, asksToAccept: false })
    expect(parseCatalog('{"metadata": {"pluginRoot": "../x"}, "plugins": [{"name": "bare", "source": "bare"}]}').get('bare')?.folder).toBeUndefined()
    expect(() => parseCatalog('{"name": "market-a"}')).toThrow('no plugins list')
    expect(() => parseCatalog('[]')).toThrow('no plugins list')
    expect(() => parseCatalog('{ not json')).toThrow()
  })

  test('(a) a relative-path entry\'s latest version is its plugin.json\'s, else the entry\'s, labelled "latest"', () => {
    // Every relative-path entry's plugin.json is read, whatever version the entry declares; no other source's is.
    expect(manifestFolder({ version: '1.0.0', folder: 'x', asksToAccept: false })).toBe('x')
    expect(manifestFolder({ version: undefined, folder: 'x', asksToAccept: false })).toBe('x')
    expect(manifestFolder({ version: '1.0.0', folder: undefined, asksToAccept: false })).toBeUndefined()
    expect(manifestFolder(undefined)).toBeUndefined()
    expect(latestOf({ version: undefined, folder: 'x', asksToAccept: false }, '9.0.0')).toEqual({ kind: 'known', version: '9.0.0', from: 'folder' })
    expect(latestOf({ version: '1.0.0', folder: 'x', asksToAccept: false }, undefined)).toEqual({ kind: 'known', version: '1.0.0', from: 'folder' })
    expect(latestOf({ version: undefined, folder: 'x', asksToAccept: false }, undefined)).toEqual(UNKNOWN)
    expect(latestOf(undefined, '9.0.0')).toEqual(UNKNOWN)
    const zzz = toRow(parseInstalled(JSON.stringify([PLUGINS[1]])).entries[0]!, false)
    const entry = parseCatalog('{"plugins": [{"name": "rel", "source": "./plugins/rel", "version": "1.0.0"}]}').get('rel')
    expect(versionLine(zzz, latestOf(entry, '3.0.0'))).toBe('2.0.0 · ↑ latest 3.0.0 · market-a · user scope')
  })

  test('(b) a command source has no latest version: the entry\'s is ignored as an install ignores it, so no arrow', () => {
    // Plugin loading chapter, line 317: the marketplace entry's version is ignored for command sources.
    const entry = parseCatalog('{"plugins": [{"name": "cmd", "source": {"source": "command", "command": "make"}, "version": "9.0.0"}]}').get('cmd')
    // 2k: a command source declares a command, so an automatic update pauses before claude is called (blockReason).
    expect(entry).toEqual({ version: undefined, folder: undefined, asksToAccept: false, declares: true })
    expect(latestOf(entry, undefined)).toEqual(UNKNOWN)
    expect(latestOf(entry, '9.0.0')).toEqual(UNKNOWN)
    expect(hasUpdate('1.0.0', latestOf(entry, undefined))).toBe(false)
  })

  test('(c) any other source\'s latest version is the version the catalog lists, labelled "catalog lists", with its arrow', () => {
    // Plugin loading chapter, lines 303-304: the remote manifest comes first at install, which the pane does not fetch.
    for (const source of [{ source: 'github', repo: 'org/x' }, { source: 'url', url: 'https://example.invalid/x.git' }, { source: 'npm', package: 'x' }]) {
      const entry = parseCatalog(JSON.stringify({ plugins: [{ name: 'x', source, version: '2.0.0' }] })).get('x')
      expect(latestOf(entry, '9.0.0')).toEqual({ kind: 'known', version: '2.0.0', from: 'catalog' })
      expect(hasUpdate('1.0.0', latestOf(entry, undefined))).toBe(true)
    }
    expect(latestOf({ version: undefined, folder: undefined, asksToAccept: false }, '9.0.0')).toEqual(UNKNOWN)
  })

  test('an empty version is no version, and a plugin.json version that is not a string throws, so the latest is unknown, not the entry\'s', () => {
    // 2d review F4.
    expect(parseCatalog('{"plugins": [{"name": "e", "source": {"source": "github", "repo": "o/e"}, "version": ""}]}').get('e')).toEqual({ version: undefined, folder: undefined, asksToAccept: false })
    expect(parseCatalog('{"plugins": [{"name": "e", "source": "./e", "version": ""}]}').get('e')).toEqual({ version: undefined, folder: 'e', asksToAccept: false })
    expect(manifestVersionOf('{"version": "1.2.3"}')).toBe('1.2.3')
    expect(manifestVersionOf('{"version": ""}')).toBeUndefined()
    expect(manifestVersionOf('{"name": "x"}')).toBeUndefined()
    expect(latestOf({ version: '1.0.0', folder: 'x', asksToAccept: false }, manifestVersionOf('{"version": ""}'))).toEqual({ kind: 'known', version: '1.0.0', from: 'folder' })
    expect(() => manifestVersionOf('{"version": 2}')).toThrow('its "version" is 2, not a string')
    expect(() => manifestVersionOf('{"version": null}')).toThrow('its "version" is null, not a string')
    expect(() => manifestVersionOf('{ not json')).toThrow()
  })

  test('when a relative-path entry\'s version and its plugin.json\'s differ, plugin.json wins, as it does at install time', () => {
    // Marketplace manifest chapter, line 104 and the validation row at line 485: plugin.json takes precedence.
    expect(latestOf({ version: '9.9.9', folder: 'plugins/aaa-mod', asksToAccept: false }, '1.0.0')).toEqual({ kind: 'known', version: '1.0.0', from: 'folder' })
    expect(latestOf({ version: '1.0.0', folder: '', asksToAccept: false }, '2.0.0')).toEqual({ kind: 'known', version: '2.0.0', from: 'folder' })
    expect(hasUpdate('1.0.0', latestOf({ version: '9.9.9', folder: 'plugins/aaa-mod', asksToAccept: false }, '1.0.0'))).toBe(false)
  })

  test('parseMarketplaces keeps each named entry, and catalogPath refuses a folder that is not absolute or has ".."', () => {
    // 2j: each entry keeps its source, the kind and the field that kind is known by; an entry with no source kind has none.
    expect(parseMarketplaces(JSON.stringify([...MARKETPLACES, { source: 'github' }, 'odd', { name: 'bare' }]))).toEqual([
      { name: 'market-a', installLocation: MARKET_A, source: { kind: 'github', repo: 'org/market-a' } },
      { name: 'market-b', installLocation: MARKET_B, source: { kind: 'directory', path: '/src/market-b' } },
      { name: 'market-c', installLocation: MARKET_C, source: { kind: 'github', repo: 'org/market-c' } },
      { name: 'market-org', installLocation: undefined, source: { kind: 'claudeai' } },
      { name: 'bare', installLocation: undefined, source: undefined },
    ])
    expect(parseMarketplaces(JSON.stringify([{ name: 'g', source: 'git', url: 'https://example.invalid/g.git', path: 7 }]))).toEqual([
      { name: 'g', installLocation: undefined, source: { kind: 'git', url: 'https://example.invalid/g.git' } },
    ])
    expect(() => parseMarketplaces('{"marketplaces": []}')).toThrow('did not answer a list')
    expect(catalogPath(`${MARKET_A}/`)).toBe(CATALOG_A)
    expect(manifestPath(MARKET_A, '')).toBe(`${MARKET_A}/.claude-plugin/plugin.json`)
    expect(manifestPath(MARKET_A, 'plugins/ddd-local')).toBe(DDD_MANIFEST)
    for (const bad of ['relative/market-a', '-market-a', `${MARKET_A}/../market-b`, '']) expect(() => catalogPath(bad)).toThrow('is not an absolute path')
  })

  test('versionLine puts the latest version after the installed one, and catalogTargets leaves out every row no catalog covers', () => {
    const zzz = toRow(parseInstalled(JSON.stringify([PLUGINS[1]])).entries[0]!, false)
    expect(versionLine(zzz, undefined)).toBe('2.0.0 · market-a · user scope')
    expect(versionLine(zzz, { kind: 'known', version: '10.0.0', from: 'folder' })).toBe('2.0.0 · ↑ latest 10.0.0 · market-a · user scope')
    expect(versionLine(zzz, { kind: 'known', version: '2.0.0', from: 'folder' })).toBe('2.0.0 · latest 2.0.0 · market-a · user scope')
    // A version the catalog lists for a plugin fetched from elsewhere is labelled as the catalog's (2d review F1).
    expect(versionLine(zzz, { kind: 'known', version: '10.0.0', from: 'catalog' })).toBe('2.0.0 · ↑ catalog lists 10.0.0 · market-a · user scope')
    expect(versionLine(zzz, { kind: 'known', version: '2.0.0', from: 'catalog' })).toBe('2.0.0 · catalog lists 2.0.0 · market-a · user scope')
    expect(versionLine(zzz, UNKNOWN)).toBe('2.0.0 · latest unknown · market-a · user scope')
    expect(versionLine(zzz, { kind: 'known', version: '3.0.0\u001b[31m', from: 'folder' })).toBe('2.0.0 · latest 3.0.0?[31m · market-a · user scope')
    // The installed version is text from the list too, so a control character in it shows as ? (2d review F6).
    const odd = { ...zzz, version: '2.0.0\u001b[2J' }
    expect(versionLine(odd, undefined)).toBe('2.0.0?[2J · market-a · user scope')
    expect(versionLine(odd, UNKNOWN)).toBe('2.0.0?[2J · latest unknown · market-a · user scope')
    const loose = { id: 'loose', version: '1.0.0', scope: 'user', enabled: true, installPath: '/cache/loose' }
    const rows = parseInstalled(JSON.stringify([...SCOPED, SKILLS_DIR_ENTRY, loose, PLUGINS[1]])).entries.map((entry) => toRow(entry, false))
    expect([...catalogTargets(rows)].map(([marketplace, ids]) => [marketplace, [...ids]])).toEqual([
      [
        'market-a',
        [
          ['uuu-user@market-a', 'uuu-user'],
          ['ppp-project@market-a', 'ppp-project'],
          ['lll-local@market-a', 'lll-local'],
          ['zzz-tool@market-a', 'zzz-tool'],
        ],
      ],
      ['market-org', [['ggg-managed@market-org', 'ggg-managed']]],
    ])
  })
})

describe('the update rules', () => {
  const row = (id: string, scope: Scope, version: string | undefined = '1.0.0'): Row =>
    toRow({ id, version, scope, enabled: true, installPath: '/cache/x', readFromFolder: undefined, folderVersion: undefined, projectPath: scope === 'project' || scope === 'local' ? '/work/app' : undefined }, false)
  const known = (version: string): Latest => ({ kind: 'known', version, from: 'folder' })

  test('actionArgv for update: user, project, local and managed rows name their scope; synced, session and skills-folder rows have no update', () => {
    // Plugin commands chapter, lines 43, 277 and 296: update takes --scope user, project, local or managed.
    for (const scope of ['user', 'project', 'local', 'managed'] as const) {
      expect(actionArgv(CLAUDE, 'update', { id: 'zzz@m', scope })).toEqual([CLAUDE, 'plugin', 'update', 'zzz@m', '--scope', scope])
    }
    expect(() => actionArgv(CLAUDE, 'update', { id: 'engineering@synced', scope: 'synced' })).toThrow('refused: update is not offered for a synced plugin')
    expect(() => actionArgv(CLAUDE, 'update', { id: 'sss-session@inline', scope: 'session' })).toThrow('refused: update is not offered for a session plugin')
    for (const scope of ['user', 'project'] as const) {
      expect(() => actionArgv(CLAUDE, 'update', { id: 'kkk-skill@skills-dir', scope })).toThrow('refused: update is not offered for a skills-directory plugin')
    }
    expect(() => actionArgv(CLAUDE, 'update', { id: '--all', scope: 'user' })).toThrow('is not a plugin id')
  })

  test('actionsFor offers Update only on a row with an update arrow whose scope has it, and lockedNote says a managed row offers only Update', () => {
    for (const scope of ['user', 'project', 'local'] as const) {
      expect(actionsFor({ id: 'zzz@m', scope, enabled: true }, true)).toEqual(['disable', 'update', 'uninstall'])
      expect(actionsFor({ id: 'zzz@m', scope, enabled: false }, true)).toEqual(['enable', 'update', 'uninstall'])
      expect(actionsFor({ id: 'zzz@m', scope, enabled: true }, false)).toEqual(['disable', 'uninstall'])
      expect(lockedNote({ id: 'zzz@m', scope, enabled: true }, true)).toBeUndefined()
    }
    expect(actionsFor({ id: 'ggg-managed@market-org', scope: 'managed', enabled: true }, true)).toEqual(['update'])
    expect(lockedNote({ id: 'ggg-managed@market-org', scope: 'managed', enabled: true }, true)).toBe('Managed by your organization: only an update is offered here.')
    expect(lockedNote({ id: 'ggg-managed@market-org', scope: 'managed', enabled: true }, false)).toBe(MANAGED_NOTE)
    expect(actionsFor({ id: 'engineering@synced', scope: 'synced', enabled: true }, true)).toEqual(['disable'])
    expect(actionsFor({ id: 'sss-session@inline', scope: 'session', enabled: true }, true)).toEqual(['disable'])
    expect(actionsFor({ id: 'kkk-skill@skills-dir', scope: 'user', enabled: true }, true)).toEqual(['disable'])
    expect(actionsFor({ id: 'Upper@market-a', scope: 'user', enabled: true }, true)).toEqual([])
  })

  test('updateTargets keeps only the rows that draw Update, with an update arrow and a scope that offers it, in the order given', () => {
    const rows = [
      row('zzz-tool@market-a', 'user', '2.0.0'),
      row('ggg-managed@market-org', 'managed'),
      row('engineering@synced', 'synced'),
      row('kkk-skill@skills-dir', 'user', '0.0.1'),
      row('Upper@market-a', 'user'),
      row('uuu-user@market-a', 'user'),
      row('ppp-project@market-a', 'project'),
      row('lll-local@market-a', 'local'),
    ]
    // Every row but uuu-user (same version) and ppp-project (unknown) has a newer version here; only three may draw Update.
    const latest = new Map<string, Latest>([
      ['zzz-tool@market-a', known('10.0.0')],
      ['ggg-managed@market-org', known('2.0.0')],
      ['engineering@synced', known('2.0.0')],
      ['kkk-skill@skills-dir', known('1.0.0')],
      ['Upper@market-a', known('2.0.0')],
      ['uuu-user@market-a', known('1.0.0')],
      ['ppp-project@market-a', UNKNOWN],
      ['lll-local@market-a', known('1.1.0')],
    ])
    expect(updateTargets(rows, latest, '').map((target) => target.id)).toEqual(['zzz-tool@market-a', 'ggg-managed@market-org', 'lll-local@market-a'])
    expect(updateTargets(rows, undefined, '')).toEqual([])
    expect(updateAllLabel(3)).toBe('u: Update all (3)')
  })

  test('updateEach updates each row in turn, goes on past a failure with the first line of its error, and reads "already at the latest version" as no newer version found', async () => {
    const rows = [row('a-one@m', 'user'), row('b-two@m', 'user'), row('c-three@m', 'local'), row('d-four@m', 'user')]
    const ran: string[] = []
    const started: string[] = []
    const results = await updateEach(
      rows,
      async (target) => {
        ran.push(target.id)
        if (target.id === 'b-two@m') throw new Error('first line of the error\nsecond line')
        if (target.id === 'c-three@m') return 'Checking for updates for plugin "c-three@m"…\nc-three is already at the latest version (1.0.0).\n'
        return 'Checking for updates for plugin "x"…\n'
      },
      (target, index) => started.push(`${index}:${target.id}`),
    )
    expect(ran).toEqual(['a-one@m', 'b-two@m', 'c-three@m', 'd-four@m'])
    expect(started).toEqual(['0:a-one@m', '1:b-two@m', '2:c-three@m', '3:d-four@m'])
    expect(results.map((result) => result.outcome)).toEqual([{ kind: 'updated' }, { kind: 'failed', reason: 'first line of the error' }, { kind: 'current' }, { kind: 'updated' }])
    // The failures come first in the report, then the rows with nothing newer, then the updated ones, each group in run order.
    expect(reportOf(results)).toEqual({
      summary: 'Update all: 2 updated, 1 already current, 1 failed.',
      lines: [
        'b-two (user scope): failed: first line of the error',
        'c-three (local scope): no newer version was found.',
        'a-one (user scope): updated.',
        'd-four (user scope): updated.',
      ],
    })
  })

  test('updateOutcomeOf reads the chapter\'s "nothing newer" line anywhere in what runAction passes; a row with nothing newer says only that; updateLine shows a control character as ?', () => {
    // runAction passes stdout, a newline, then stderr. The pane tests send the line through runAction on each stream.
    expect(updateOutcomeOf('Checking for updates for plugin "zzz@m"…\nzzz is already at the latest version (1.0.0).\n')).toEqual({ kind: 'current' })
    expect(updateOutcomeOf('\nzzz is already at the latest version (1.0.0).')).toEqual({ kind: 'current' })
    expect(updateOutcomeOf('Checking for updates for plugin "zzz@m"…\n')).toEqual({ kind: 'updated' })
    // 2e review spec/F3: an update at the latest version can still finish a dependency install, so neither line says
    // that nothing was installed.
    expect(currentText(row('zzz-tool@market-a', 'user'))).toBe(CURRENT_ZZZ)
    expect(updateLine({ row: row('zzz@m', 'user'), outcome: { kind: 'current' } })).toBe('zzz (user scope): no newer version was found.')
    expect(updateLine({ row: row('zzz@m', 'user'), outcome: { kind: 'failed', reason: 'bad\u001b[31m' } })).toBe('zzz (user scope): failed: bad?[31m')
    expect(questionFor('update', row('zzz-tool@market-a', 'user'))).toBe(QUESTION_UPDATE_ZZZ)
    expect(isConfirmed('Update it', 'update')).toBe(true)
    expect(isConfirmed(UPDATE_ALL_LABEL, 'update')).toBe(false)
  })

  test('updateAllQuestion names each plugin with its scope, the first five, then counts the rest, and shows a control character as ?', () => {
    expect(updateAllQuestion([row('ddd-local@market-a', 'local'), row('zzz-tool@market-a', 'user')])).toBe(QUESTION_UPDATE_ALL_2)
    expect(updateAllQuestion([row('zzz-tool@market-a', 'user')])).toBe(QUESTION_UPDATE_ALL_ZZZ)
    const seven = SEVEN_ORDER.map((name) => row(`${name}-tool@market-a`, 'user'))
    expect(updateAllQuestion(seven)).toBe(QUESTION_UPDATE_ALL_7)
    expect(updateAllQuestion(seven.slice(0, 5))).toBe(
      'Update all 5 plugins: five-tool (user scope), four-tool (user scope), one-tool (user scope), seven-tool (user scope), six-tool (user scope)? Each gets the latest version its marketplace offers, one after another, and loads in your next session.',
    )
    expect(updateAllQuestion([row('odd\u0007bell@m', 'user')])).toContain(': odd?bell (user scope)?')
  })

  test('updateTargets keeps only the rows the filter shows, by the filter\'s own rule', () => {
    const rows = [row('zzz-tool@market-a', 'user', '2.0.0'), row('lll-local@market-a', 'local')]
    const latest = new Map<string, Latest>([
      ['zzz-tool@market-a', known('10.0.0')],
      ['lll-local@market-a', known('1.1.0')],
    ])
    const ids = (filter: string) => updateTargets(rows, latest, filter).map((target) => target.id)
    expect(ids('')).toEqual(['zzz-tool@market-a', 'lll-local@market-a'])
    expect(ids('   ')).toEqual(['zzz-tool@market-a', 'lll-local@market-a'])
    expect(ids('ZZZ')).toEqual(['zzz-tool@market-a'])
    expect(ids('market-a local')).toEqual(['lll-local@market-a'])
    expect(ids('nothing-like-this')).toEqual([])
  })

  test('a plugin loaded in place is read at the version it loads (folderVersion), not the one recorded at install, so a raised plugin.json draws no arrow', () => {
    // 2e review spec/F1: plugin commands chapter, line 341; tracing chapter, line 297.
    const listed = parseInstalled(JSON.stringify([{ ...IN_PLACE, folderVersion: '1.1.0' }])).entries
    expect(listed).toEqual([{ ...IN_PLACE, folderVersion: '1.1.0', projectPath: undefined }])
    const inPlace = toRow(listed[0]!, true)
    const latest = known('1.1.0')
    expect(loadedVersion(inPlace)).toBe('1.1.0')
    expect(rowHasUpdate(inPlace, latest)).toBe(false)
    expect(versionLine(inPlace, latest)).toBe('1.1.0 · latest 1.1.0 · market-d · user scope')
    expect(updateTargets([inPlace], new Map([[inPlace.id, latest]]), '')).toEqual([])
    // With no folderVersion (the plugin did not load, or declares no version), no loaded version is known: no arrow.
    const notLoaded = { ...inPlace, folderVersion: undefined }
    expect(loadedVersion(notLoaded)).toBeUndefined()
    expect(rowHasUpdate(notLoaded, latest)).toBe(false)
    expect(versionLine(notLoaded, latest)).toBe('no version · latest 1.1.0 · market-d · user scope')
    // A row not loaded in place is read at the version recorded at install, whatever folderVersion an entry carries.
    const copied = { ...inPlace, readFromFolder: undefined, folderVersion: '9.0.0' }
    expect(loadedVersion(copied)).toBe('1.0.0')
    expect(rowHasUpdate(copied, latest)).toBe(true)
  })

  test('an archive entry that sets a headersHelper keeps its arrow but draws no Update, is left out of Update all, and its note says to update it from the terminal', () => {
    // 2e review spec/F2: host chapter, lines 385-395; plugin commands chapter, lines 97 and 119; marketplace manifest
    // chapter, line 480 (headersHelper has no effect on a source that is not an archive).
    const catalog = parseCatalog(JSON.stringify({ plugins: [...HELPER_ENTRIES, { name: 'arch-plain', source: HELPER_ARCHIVE_SOURCE, version: '1.2.0' }, { name: 'arch-empty', source: HELPER_ARCHIVE_SOURCE, strict: false, headersHelper: '', version: '1.2.0' }] }))
    expect([...catalog].map(([name, entry]) => [name, entry.asksToAccept])).toEqual([
      ['hhh-archive', true],
      ['jjj-github', false],
      ['arch-plain', false],
      ['arch-empty', false],
    ])
    const asks = latestOf(catalog.get('hhh-archive'), undefined)
    expect(asks).toEqual({ kind: 'known', version: '1.2.0', from: 'catalog', asksToAccept: true })
    expect(latestOf(catalog.get('jjj-github'), undefined)).toEqual({ kind: 'known', version: '1.2.0', from: 'catalog' })
    const user = row('hhh-archive@market-a', 'user', '1.1.0')
    expect(rowHasUpdate(user, asks)).toBe(true)
    expect(updatableHere(user, asks)).toBe(false)
    expect(actionsFor(user, updatableHere(user, asks))).toEqual(['disable', 'uninstall'])
    expect(versionLine(user, asks)).toBe('1.1.0 · ↑ catalog lists 1.2.0 · market-a · user scope')
    expect(updateNote(user, asks)).toBe(TERMINAL_NOTE)
    expect(updateTargets([user], new Map([[user.id, asks]]), '')).toEqual([])
    // A managed row gets the same note. A row with no arrow, a row the pane can update, and a scope with no update get none.
    expect(updateNote(row('hhh-archive@market-a', 'managed', '1.1.0'), asks)).toBe(TERMINAL_NOTE)
    expect(updateNote(row('hhh-archive@market-a', 'user', '1.2.0'), asks)).toBeUndefined()
    expect(updateNote(user, latestOf(catalog.get('arch-plain'), undefined))).toBeUndefined()
    expect(updateNote(row('hhh-archive@synced', 'synced', '1.1.0'), asks)).toBeUndefined()
  })
})

describe('the claim handoff, on a plain engine', () => {
  // 2e review state/F4. In the kit, a press sent from a hook reaches the mod only after the calls the mod has already
  // queued, so it cannot land between two of the mod's own awaits: a mutant that restores the old release-then-refresh
  // shape passed the kit test above (measured). Here every engine call is a plain promise and the toast runs the press
  // at once, so the press looks up its session before any lookup the mod makes after its toast. The engine below answers
  // only the calls these two changes make: one user plugin, zzz-tool, with a newer version in market-a's catalog.
  const LISTED = [{ id: 'zzz-tool@market-a', version: '2.0.0', scope: 'user', enabled: true, installPath: '/cache/market-a/zzz-tool/2.0.0' }]
  function plainEngine(session: string) {
    // The registry of this test's own import of the mod holds what the mod defines at load (register.ts registerModManager),
    // so a press reads the pane's switches by their definitions (TRDD-5IK59SQ2, C6b); no session start runs here.
    defineSwitches(MOD_MANAGER_SWITCHES)
    const files: Record<string, string> = { [CATALOG_A]: catalogA('10.0.0') }
    const engine = {
      toasts: [] as string[],
      onToast: undefined as ((text: string) => void) | undefined,
      $: undefined as unknown as EngineInterface,
    }
    const plain = {
      session: { id: async () => session, root: async () => ROOT },
      // The pane's switches (TRDD-5IK59SQ2, C6b): nothing stored, so a press reads each at its default, on.
      store: { get: async () => undefined },
      env: { get: async (name: string) => (name === 'HOME' ? HOME : undefined) },
      fs: {
        exists: async (path: string) => path === CLAUDE || path in files,
        stat: async () => ({ kind: 'file' }),
        list: async () => [],
        read: async (path: string) => {
          const text = files[path]
          if (text === undefined) throw new Error(`ENOENT: ${path}`)
          return text
        },
      },
      process: {
        run: async (argv: readonly string[]) => {
          const stdout = argv[2] === 'list' ? JSON.stringify(LISTED) : argv[2] === 'marketplace' ? JSON.stringify(MARKETPLACES) : ''
          return { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false }
        },
      },
      ui: {
        toast: (text: string) => {
          engine.toasts.push(text)
          engine.onToast?.(text)
        },
        invalidate: () => undefined,
        log: () => undefined,
        status: () => undefined,
      },
    }
    engine.$ = plain as unknown as EngineInterface
    return engine
  }
  // Every call above resolves at once, so a bounded number of microtask turns lets a run finish.
  const settled = async (done: () => boolean): Promise<void> => {
    for (let turn = 0; turn < 2_000 && !done(); turn++) await Promise.resolve()
  }

  for (const run of ['Update', 'Update all'] as const) {
    test(`after ${run}, the claim is still held when its toast shows, and a press at that moment is refused before its question`, async () => {
      const session = `plain-handoff-${run === 'Update' ? 'one' : 'all'}`
      const engine = plainEngine(session)
      const { $ } = engine
      await refresh($)
      await settled(() => stateIn(session).latest !== undefined)
      const state = stateIn(session)
      expect(updateTargets(state.rows, state.latest, '').map((target) => target.id)).toEqual(['zzz-tool@market-a'])
      const row = state.rows[0]!
      const toast = run === 'Update' ? 'zzz-tool updated. Applies in your next session.' : 'Update all: 1 updated, 0 already current, 0 failed.'
      const asked: string[] = []
      let busyAtToast: string | undefined = 'not seen'
      engine.onToast = (text) => {
        if (text !== toast) return
        engine.onToast = undefined
        busyAtToast = stateIn(session).busy
        void confirmAndAct($, row, 'disable', async (question) => {
          asked.push(question)
          return KEEP
        })
      }
      engine.toasts = []
      if (run === 'Update') await confirmAndAct($, row, 'update', async () => 'Update it')
      else await confirmAndUpdateAll($, async () => UPDATE_ALL_LABEL)
      await settled(() => stateIn(session).busy === undefined)
      expect(busyAtToast).toBe(READING_LIST)
      expect(engine.toasts).toEqual([toast, REFUSED_WHILE_READING])
      expect(asked).toEqual([])
      expect(stateIn(session).busy).toBeUndefined()
    })
  }
})

// 2i: the details view. zzz-tool's own plugin.json, in its install folder, sets a description, a homepage and a repository;
// a test's catalog entry for zzz-tool may set display fields of its own, which come first.
const XDG_OPEN = '/usr/bin/xdg-open'
const MAC_OPEN = '/usr/bin/open'
const SW_VERS = '/usr/bin/sw_vers'
const ZZZ_FOLDER = '/cache/market-a/zzz-tool/2.0.0'
const ZZZ_ABOUT = `${ZZZ_FOLDER}/.claude-plugin/plugin.json`
const ZZZ_HOMEPAGE = 'https://zzz.example.invalid/docs'
const ZZZ_REPOSITORY = 'https://github.com/org/zzz-tool'
const ZZZ_ABOUT_TEXT = JSON.stringify({ name: 'zzz-tool', version: '2.0.0', description: 'From its plugin.json.', homepage: ZZZ_HOMEPAGE, repository: ZZZ_REPOSITORY })
const ZZZ_DETAILS = 'mm-details-zzz-tool@market-a|user'
const CATALOG_DESCRIPTION = 'Tools, as the catalog describes them.'
// What the view shows for zzz-tool with CATALOG_FILES, the catalog's description and ZZZ_ABOUT_TEXT: the entry's
// description wins over the plugin.json's, and the homepage, which the entry does not set, is the plugin.json's.
const ZZZ_LINES = [
  CATALOG_DESCRIPTION,
  'Installed: 2.0.0',
  'Latest: ↑ 10.0.0, the version its catalog lists',
  'Marketplace: market-a',
  'Scope: user',
  `Folder: ${ZZZ_FOLDER}`,
  `Homepage: ${ZZZ_HOMEPAGE}`,
]
const SHOWED_ZZZ = 'Showed the folder of zzz-tool.'
const COPIED_ZZZ = `No program could open the folder, so its path was copied: ${ZZZ_FOLDER}`

/** The argument vectors of every opener run, in order. */
const openerRuns = (w: World): string[][] => w.calls.filter((call) => call.argv[0] === XDG_OPEN || call.argv[0] === MAC_OPEN).map((call) => call.argv)
/** Every claude call that changes something: the details view must start none. */
const claudeChanges = (w: World) => w.calls.filter((call) => call.argv[0] === CLAUDE && !isRead(call.argv))

/** Opens the pane for a fresh session and the details view of zzz-tool. */
async function zzzDetails($: any, w: World, session: string, surface: (typeof SURFACES)[number], columns: number): Promise<Mounted<'terminal' | 'desktop'>> {
  const ui = await openAndMount($, w, session, surface, columns)
  await ui.press({ key: ZZZ_DETAILS })
  await idle(w)
  return ui
}

describe('2i: the details view, Open folder and Open homepage', () => {
  test('Details shows the row in place of the list: description, versions, marketplace, scope, folder and homepage, each display field from the catalog entry before the plugin.json; Back returns to the list, and nothing is changed', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.files = { ...CATALOG_FILES, [CATALOG_A]: catalogA('10.0.0', [], { description: CATALOG_DESCRIPTION }), [ZZZ_ABOUT]: ZZZ_ABOUT_TEXT }
      w.calls = []
      const ui = await openAndMount($, w, `details-${surface}-${columns}`, surface, columns)
      // Every row draws Details, a row with no other button too.
      expect((await ui.find({ key: ZZZ_DETAILS }))?.props.label).toBe('Details')
      expect(await ui.find({ key: 'mm-details-ddd-local@market-a|local' })).toBeDefined()
      await ui.press({ key: ZZZ_DETAILS })
      await idle(w)
      expect(await ui.find({ type: 'Text', text: 'zzz-tool · on' })).toBeDefined()
      for (const text of ZZZ_LINES) expect(await ui.find({ type: 'Text', text })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: 'From its plugin.json.' })).toBeUndefined()
      // The list's buttons, its filter field and its rows are not drawn, so b, o and h collide with no hotkey of the list.
      expect((await ui.findAll({ type: 'Button' })).map((b) => b.key)).toEqual(['mm-back', 'mm-open-folder', 'mm-open-link'])
      expect(await ui.find({ key: 'mm-filter' })).toBeUndefined()
      const room = columns - 8
      expect((await ui.find({ key: 'mm-back' }))?.props).toMatchObject({ label: fitLabel('b: Back to the list', room), hotkey: 'b' })
      expect((await ui.find({ key: 'mm-open-folder' }))?.props).toMatchObject({ label: fitLabel('o: Open folder', room), hotkey: 'o' })
      expect((await ui.find({ key: 'mm-open-link' }))?.props).toMatchObject({ label: fitLabel('h: Open homepage', room), hotkey: 'h' })
      await ui.press({ key: 'mm-back' })
      await idle(w)
      expect(await ui.find({ key: 'mm-refresh' })).toBeDefined()
      expect(await ui.find({ key: ZZZ_DETAILS })).toBeDefined()
      expect(await ui.find({ key: 'mm-back' })).toBeUndefined()
      expect(claudeChanges(w)).toEqual([])
      expect(openerRuns(w)).toEqual([])
      await ui.unmount()
    }
  })

  test('Open folder runs only the program of this system (xdg-open where /usr/bin/xdg-open exists, macOS open with -R where /usr/bin/sw_vers exists); a failure copies the path on the surface pressed, and so does having no program; a refused copy names the path in the pane', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.files = { ...CATALOG_FILES }
      w.copyResult = { isCopied: true }
      const ui = await zzzDetails($, w, `open-folder-${surface}-${columns}`, surface, columns)
      const pressOpen = async (): Promise<void> => {
        w.calls = []
        w.toasts = []
        w.copies = []
        await ui.press({ key: 'mm-open-folder' })
        await idle(w)
      }
      // macOS: /usr/bin/sw_vers is there, so open is this system's program, and it reveals the folder rather than opening it.
      w.openers = [SW_VERS, MAC_OPEN]
      w.openerExit = {}
      await pressOpen()
      expect(openerRuns(w)).toEqual([[MAC_OPEN, '-R', ZZZ_FOLDER]])
      expect(w.toasts).toEqual([SHOWED_ZZZ])
      // Linux: /usr/bin/xdg-open is there and sw_vers is not, so xdg-open is the program, with the folder as it is. open is there
      // too (on Debian it starts a program on a new virtual console), and it must not run here.
      w.openers = [XDG_OPEN, MAC_OPEN]
      await pressOpen()
      expect(openerRuns(w)).toEqual([[XDG_OPEN, ZZZ_FOLDER]])
      expect(w.toasts).toEqual([SHOWED_ZZZ])
      // A failing xdg-open is the only program tried: the failure goes to the debug log, and the path is copied.
      w.openerExit = { [XDG_OPEN]: 3 }
      w.logs = []
      await pressOpen()
      expect(openerRuns(w)).toEqual([[XDG_OPEN, ZZZ_FOLDER]])
      expect(w.copies).toEqual([{ text: ZZZ_FOLDER, surface }])
      expect(w.toasts).toEqual([COPIED_ZZZ])
      expect(w.logs.filter((log) => log.text.startsWith(`mods-manager: opening ${ZZZ_FOLDER} failed:`)).map((log) => [log.text, log.to])).toEqual([
        [`mods-manager: opening ${ZZZ_FOLDER} failed: ${XDG_OPEN} exited 3: it could not open that`, 'debug'],
      ])
      // Both markers present, which no real system has: the first program that runs is the last, so open does not run after
      // xdg-open fails.
      w.openers = [XDG_OPEN, SW_VERS, MAC_OPEN]
      await pressOpen()
      expect(openerRuns(w)).toEqual([[XDG_OPEN, ZZZ_FOLDER]])
      expect(w.copies).toEqual([{ text: ZZZ_FOLDER, surface }])
      // macOS open fails: the failure goes to the debug log, and the path is copied.
      w.openers = [SW_VERS, MAC_OPEN]
      w.openerExit = { [MAC_OPEN]: 1 }
      w.logs = []
      await pressOpen()
      expect(openerRuns(w)).toEqual([[MAC_OPEN, '-R', ZZZ_FOLDER]])
      expect(w.copies).toEqual([{ text: ZZZ_FOLDER, surface }])
      expect(w.toasts).toEqual([COPIED_ZZZ])
      expect(w.logs.filter((log) => log.text.startsWith(`mods-manager: opening ${ZZZ_FOLDER} failed:`)).map((log) => [log.text, log.to])).toEqual([
        [`mods-manager: opening ${ZZZ_FOLDER} failed: ${MAC_OPEN} exited 1: it could not open that`, 'debug'],
      ])
      // No opener at all, as on Windows: nothing runs, and the path is copied.
      w.openers = []
      w.openerExit = {}
      await pressOpen()
      expect(openerRuns(w)).toEqual([])
      expect(w.copies).toEqual([{ text: ZZZ_FOLDER, surface }])
      expect(w.toasts).toEqual([COPIED_ZZZ])
      // The copy refused: no toast claims a copy, and the pane's message names the reason and the path.
      w.copyResult = { isCopied: false, reason: 'no-clipboard' }
      await pressOpen()
      expect(w.toasts).toEqual([])
      expect(await ui.find({ type: 'Text', text: `No program could open the folder, and its path could not be copied (no-clipboard): ${ZZZ_FOLDER}` })).toBeDefined()
      expect(claudeChanges(w)).toEqual([])
      await ui.unmount()
    }
  })

  test('Open homepage opens only a web link, as it is, never with -R; a homepage that is not http or https is shown, draws no button and reaches no program; with no homepage the repository is opened', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      // The entry's homepage wins over the plugin.json's, and a leading "-" would be read by open as a flag.
      w.files = { ...CATALOG_FILES, [CATALOG_A]: catalogA('10.0.0', [], { homepage: '-a Calculator' }), [ZZZ_ABOUT]: ZZZ_ABOUT_TEXT }
      w.openers = [MAC_OPEN, SW_VERS]
      w.openerExit = {}
      w.calls = []
      const ui = await zzzDetails($, w, `open-link-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ type: 'Text', text: 'Homepage: -a Calculator (not an http or https link, so it is not opened)' })).toBeDefined()
      expect(await ui.find({ key: 'mm-open-link' })).toBeUndefined()
      expect(openerRuns(w)).toEqual([])
      // The catalog sets no homepage and the plugin.json only a repository: the repository is shown and opened.
      w.files[CATALOG_A] = catalogA('10.0.0')
      w.files[ZZZ_ABOUT] = JSON.stringify({ name: 'zzz-tool', repository: ZZZ_REPOSITORY })
      await ui.press({ key: 'mm-back' })
      await idle(w)
      await ui.press({ key: 'mm-refresh' })
      await idle(w)
      await ui.press({ key: ZZZ_DETAILS })
      await idle(w)
      expect(await ui.find({ type: 'Text', text: `Repository: ${ZZZ_REPOSITORY}` })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: 'No description is listed.' })).toBeDefined()
      expect((await ui.find({ key: 'mm-open-link' }))?.props.label).toBe(fitLabel('h: Open repository', columns - 8))
      w.toasts = []
      await ui.press({ key: 'mm-open-link' })
      await idle(w)
      expect(openerRuns(w)).toEqual([[MAC_OPEN, ZZZ_REPOSITORY]])
      expect(w.toasts).toEqual(['Opened the repository of zzz-tool.'])
      expect(claudeChanges(w)).toEqual([])
      await ui.unmount()
    }
  })

  test('a control character in a folder, a description or a link is drawn as ?, a link holding one is never opened, and the toast that names the copied path shows it as ?, while the path copied is the real one', async ($, on) => {
    // 2i follow-up (a): every toast goes through printable. The id is a plain name@marketplace, so the row has buttons;
    // only its folder, from the list, and its plugin.json's fields carry control characters.
    const folder = '/cache/market-a/odd\u001b[2J/1.0.0'
    const odd = { id: 'odd-tool@market-a', version: '1.0.0', scope: 'user', enabled: true, installPath: folder }
    const w = world(on, [odd])
    for (const { surface, columns } of PLACES) {
      w.files = { [`${folder}/.claude-plugin/plugin.json`]: JSON.stringify({ description: 'Odd\u0007 tool\u202E', homepage: 'https://odd.example.invalid/\u009b' }) }
      w.openers = []
      w.copies = []
      w.toasts = []
      const ui = await openAndMount($, w, `odd-details-${surface}-${columns}`, surface, columns)
      await ui.press({ key: 'mm-details-odd-tool@market-a|user' })
      await idle(w)
      expect(await ui.find({ type: 'Text', text: 'Odd? tool?' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: 'Folder: /cache/market-a/odd?[2J/1.0.0' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: 'Homepage: https://odd.example.invalid/? (not an http or https link, so it is not opened)' })).toBeDefined()
      expect(await ui.find({ key: 'mm-open-link' })).toBeUndefined()
      await ui.press({ key: 'mm-open-folder' })
      await idle(w)
      expect(w.copies).toEqual([{ text: folder, surface }])
      expect(w.toasts).toEqual(['No program could open the folder, so its path was copied: /cache/market-a/odd?[2J/1.0.0'])
      const texts = (await ui.findAll({ type: 'Text' })).map((text) => String(text.children))
      const labels = (await ui.findAll({ type: 'Button' })).map((button) => String(button.props.label))
      expect([...texts, ...labels, ...w.toasts].filter((text) => /[\p{Cc}\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/u.test(text))).toEqual([])
      await ui.unmount()
    }
  })

  test('a declared hooks path that is refused is named in the default log, each control character as ?, and no log line holds one', async ($, on) => {
    // Each line of the default log goes through printable, and a refused path is logged, never read.
    const folder = '/cache/market-a/hooky/1.0.0'
    const hooky = { id: 'hooky-tool@market-a', version: '1.0.0', scope: 'user', enabled: true, installPath: folder }
    const w = world(on, [hooky])
    for (const { surface, columns } of PLACES) {
      w.files = { [`${folder}/.claude-plugin/plugin.json`]: JSON.stringify({ hooks: ['/etc/\u001b/hooks.json'] }) }
      w.logs = []
      const ui = await openAndMount($, w, `hooks-log-${surface}-${columns}`, surface, columns)
      expect(w.logs.filter((log) => log.to !== 'debug').map((log) => log.text)).toContain(`mods-manager: ${folder}/.claude-plugin/plugin.json declares "/etc/?/hooks.json", which is absolute or has "..", so it is skipped`)
      expect(w.logs.filter((log) => /\p{Cc}/u.test(log.text))).toEqual([])
      await ui.unmount()
    }
  })

  test('a plugin.json read that a later Details press replaced does not reach the view: the newer row keeps its own fields', async ($, on) => {
    // 2i: showDetails keeps a read's answer only while the same row's details, from the same folder, are still open.
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.files = { ...CATALOG_FILES, [ZZZ_ABOUT]: ZZZ_ABOUT_TEXT }
      const ui = await openAndMount($, w, `details-stale-${surface}-${columns}`, surface, columns)
      const hold = deferred()
      w.readHold = { path: ZZZ_ABOUT, gate: hold }
      await ui.press({ key: ZZZ_DETAILS })
      await idle(w)
      expect(await ui.find({ type: 'Text', text: 'Reading its plugin.json…' })).toBeDefined()
      await ui.press({ key: 'mm-back' })
      await idle(w)
      // ddd-local's folder holds no plugin.json, so its view lists no description and no homepage.
      await ui.press({ key: 'mm-details-ddd-local@market-a|local' })
      await idle(w)
      hold.resolve()
      await idle(w)
      expect(await ui.find({ type: 'Text', text: 'Folder: /cache/market-a/ddd-local/1.0.0' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: 'No description is listed.' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: 'From its plugin.json.' })).toBeUndefined()
      expect(await ui.find({ type: 'Text', text: `Homepage: ${ZZZ_HOMEPAGE}` })).toBeUndefined()
      await ui.unmount()
    }
  })

  test('the details view stays open across a read of the list that keeps its row in its folder, goes back to the list once the row loads from another folder, and the pane always opens on the list', async ($, on) => {
    const listed: Array<Record<string, unknown>> = PLUGINS.map((entry) => ({ ...entry }))
    const w = withCatalogs(world(on, listed))
    for (const { surface, columns } of PLACES) {
      listed[1] = { ...PLUGINS[1] }
      w.files = { ...CATALOG_FILES }
      w.panes = []
      const ui = await zzzDetails($, w, `details-close-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ key: 'mm-back' })).toBeDefined()
      // A session start that finds the pane open reads the list again (2h); the row is in its folder, so the view stays.
      w.panes = [{ id: 'mod-manager', title: 'Mods', isShown: true, isFocused: true, isPlaced: true }]
      await start($, surface)
      await idle(w)
      expect(await ui.find({ key: 'mm-back' })).toBeDefined()
      // An update moved the row to its new version's folder: the next read goes back to the list.
      listed[1] = { ...PLUGINS[1], version: '10.0.0', installPath: '/cache/market-a/zzz-tool/10.0.0' }
      await start($, surface)
      await idle(w)
      expect(await ui.find({ key: 'mm-back' })).toBeUndefined()
      expect(await ui.find({ key: 'mm-refresh' })).toBeDefined()
      // A details view left open when the pane is opened again gives way to the list.
      await ui.press({ key: 'mm-details-ddd-local@market-a|local' })
      await idle(w)
      expect(await ui.find({ key: 'mm-back' })).toBeDefined()
      await openPane($)
      await idle(w)
      expect(await ui.find({ key: 'mm-back' })).toBeUndefined()
      expect(await ui.find({ key: 'mm-refresh' })).toBeDefined()
      w.panes = []
      await ui.unmount()
    }
  })
})

describe('the 2i rules', () => {
  const [, zzz, , , ddd] = parseInstalled(JSON.stringify(PLUGINS)).entries.map((entry) => toRow(entry, false))
  const inPlace = toRow(parseInstalled(JSON.stringify([IN_PLACE])).entries[0]!, true)

  test('shownAbout takes each display field from the catalog entry when it sets one, else from the plugin.json; aboutOf keeps only non-empty strings and throws on text that is not JSON', () => {
    expect(shownAbout({ description: 'entry' }, { description: 'manifest', homepage: 'https://m.example.invalid' })).toEqual({ description: 'entry', homepage: 'https://m.example.invalid' })
    expect(shownAbout(undefined, { repository: 'https://r.example.invalid' })).toEqual({ repository: 'https://r.example.invalid' })
    expect(shownAbout({ homepage: 'https://e.example.invalid' }, undefined)).toEqual({ homepage: 'https://e.example.invalid' })
    expect(aboutOf('{"description": "", "homepage": 7, "repository": "https://r.example.invalid", "name": "x"}')).toEqual({ repository: 'https://r.example.invalid' })
    expect(aboutOf('[]')).toEqual({})
    expect(() => aboutOf('{ not json')).toThrow()
  })

  test('parseCatalog keeps an entry\'s display fields as about, only when the entry sets one', () => {
    const catalog = parseCatalog(JSON.stringify({ plugins: [{ name: 'plain', source: '.' }, { name: 'told', source: '.', description: 'Told.', homepage: 'https://t.example.invalid', repository: '' }] }))
    expect(catalog.get('plain')).toEqual({ version: undefined, folder: '', asksToAccept: false })
    expect(Object.keys(catalog.get('plain') ?? {})).not.toContain('about')
    expect(catalog.get('told')).toEqual({ version: undefined, folder: '', asksToAccept: false, about: { description: 'Told.', homepage: 'https://t.example.invalid' } })
  })

  test('webLink lets only an http or https link with no space and no control character be opened, and linkOf takes the homepage before the repository', () => {
    for (const link of ['https://example.invalid/x?y=1#z', 'http://example.invalid', 'HTTPS://EXAMPLE.INVALID']) expect(webLink(link)).toBe(link)
    for (const text of ['-a Calculator', 'javascript:alert(1)', 'file:///etc/passwd', 'ssh://host/x', 'https://a b', ' https://example.invalid', 'https://example.invalid\u0007', 'https://', 'example.invalid']) {
      expect(webLink(text)).toBeUndefined()
    }
    expect(linkOf({ homepage: 'https://h.example.invalid', repository: 'https://r.example.invalid' })).toEqual({ field: 'homepage', text: 'https://h.example.invalid', url: 'https://h.example.invalid' })
    expect(linkOf({ repository: 'git@host:org/x.git' })).toEqual({ field: 'repository', text: 'git@host:org/x.git', url: undefined })
    expect(linkOf({ description: 'x' })).toBeUndefined()
  })

  test('the openers are xdg-open and open, each with the fixed path that marks its system; macOS open shows a folder with -R, and a link goes to either one as it is', () => {
    expect(OPENERS).toEqual([{ program: XDG_OPEN, requires: XDG_OPEN }, { program: MAC_OPEN, requires: SW_VERS }])
    expect(openerArgv(MAC_OPEN, { kind: 'folder', text: '/f' })).toEqual([MAC_OPEN, '-R', '/f'])
    expect(openerArgv(XDG_OPEN, { kind: 'folder', text: '/f' })).toEqual([XDG_OPEN, '/f'])
    expect(openerArgv(MAC_OPEN, { kind: 'link', field: 'homepage', text: ZZZ_HOMEPAGE })).toEqual([MAC_OPEN, ZZZ_HOMEPAGE])
    expect(openerArgv(XDG_OPEN, { kind: 'link', field: 'repository', text: ZZZ_REPOSITORY })).toEqual([XDG_OPEN, ZZZ_REPOSITORY])
  })

  test('openableFolder takes only an absolute path with no ".." segment; openTargetOf offers no folder it refuses and no link that is not a web link, the entry\'s link first even when it cannot be opened', () => {
    expect(openableFolder('/cache/x/1.0.0')).toBe('/cache/x/1.0.0')
    expect(openableFolder('C:\\plugins\\x')).toBe('C:\\plugins\\x')
    for (const path of ['-R', 'cache/x', '/cache/../etc', 'C:\\a\\..\\b', '']) expect(openableFolder(path)).toBeUndefined()
    const relative = toRow({ ...parseInstalled(JSON.stringify([PLUGINS[0]])).entries[0]!, installPath: 'cache/x' }, false)
    expect(openTargetOf(relative, 'folder', undefined, undefined)).toBeUndefined()
    expect(openTargetOf(zzz!, 'folder', undefined, undefined)).toEqual({ kind: 'folder', text: ZZZ_FOLDER })
    expect(openTargetOf(inPlace, 'folder', undefined, undefined)).toEqual({ kind: 'folder', text: '/work/plugins/iii-in-place' })
    expect(openTargetOf(zzz!, 'link', { homepage: '-a Calculator' }, { homepage: ZZZ_HOMEPAGE })).toBeUndefined()
    expect(openTargetOf(zzz!, 'link', undefined, { homepage: ZZZ_HOMEPAGE })).toEqual({ kind: 'link', field: 'homepage', text: ZZZ_HOMEPAGE })
  })

  test('detailLines says while the plugin.json is read, names one that cannot be read, cuts a long description, names the install path of a plugin loaded in place, and shows a control character as ?', () => {
    expect(detailLines(inPlace, undefined, 'not-read-yet', undefined, { manifest: undefined, problem: undefined })).toEqual([
      'Reading its plugin.json…',
      'Installed: no version',
      'Latest: the marketplace catalogs are not read yet.',
      'Marketplace: market-d',
      'Scope: user',
      'Folder: /work/plugins/iii-in-place, loaded in place; its install path is /cache/market-d/iii-in-place/1.0.0',
      'No homepage is listed.',
    ])
    expect(detailLines(ddd!, UNKNOWN, 'read', { description: 'D\u0007' }, { manifest: undefined, problem: 'EACCES: permission denied\nmore' })).toEqual([
      "Its plugin.json could not be read (EACCES: permission denied), so only its catalog entry's fields are shown.",
      'D?',
      'Installed: 1.0.0',
      'Latest: unknown.',
      'Marketplace: market-a',
      'Scope: local',
      'Folder: /cache/market-a/ddd-local/1.0.0',
      'No homepage is listed.',
    ])
    expect(detailLines(zzz!, undefined, 'reading-again', undefined, { manifest: {}, problem: undefined })).toContain('Latest: the marketplace catalogs are being read again…')
    const lines = detailLines(zzz!, undefined, 'read', undefined, { manifest: { description: 'x'.repeat(600) }, problem: undefined })
    expect(lines[0]).toBe(`${'x'.repeat(499)}…`)
    expect(lines).toContain('Latest: unknown, because no marketplace catalog lists it.')
    expect(detailLines(zzz!, { kind: 'known', version: '2.0.0', from: 'folder' }, 'read', undefined, { manifest: {}, problem: undefined })).toEqual([
      'No description is listed.',
      'Installed: 2.0.0',
      'Latest: 2.0.0',
      'Marketplace: market-a',
      'Scope: user',
      `Folder: ${ZZZ_FOLDER}`,
      'No homepage is listed.',
    ])
  })

  test('keepsDetails keeps the view only while its row is listed and loads from the folder whose plugin.json was read', () => {
    expect(rowKey(zzz!)).toBe('zzz-tool@market-a|user')
    expect(keepsDetails({ key: rowKey(zzz!), folder: ZZZ_FOLDER }, [ddd!, zzz!])).toBe(true)
    expect(keepsDetails({ key: rowKey(zzz!), folder: '/cache/market-a/zzz-tool/1.0.0' }, [ddd!, zzz!])).toBe(false)
    expect(keepsDetails({ key: rowKey(zzz!), folder: ZZZ_FOLDER }, [ddd!])).toBe(false)
    expect(keepsDetails({ key: 'zzz-tool@market-a|local', folder: ZZZ_FOLDER }, [zzz!])).toBe(false)
  })
})

// 2f: the plugins a catalog lists that are not installed. market-a's catalog gains two (yyy-new with no description, and
// bbb-new, whose description holds control characters), one installed in a scope that does not apply here (eee-elsewhere,
// a local install made in another folder, PLUGINS), and two names PLUGIN_ID refuses, which are never shown. They are listed
// out of order, so the pane's order by name is checked.
const CATALOG_C = `${MARKET_C}/.claude-plugin/marketplace.json`
const NEW_ENTRIES = [
  { name: 'yyy-new', source: { source: 'github', repo: 'org/yyy-new' } },
  { name: 'bbb-new', source: './plugins/bbb-new', description: 'New\u0007 bbb‮' },
  { name: 'eee-elsewhere', source: './plugins/eee-elsewhere' },
  { name: 'Bad Name', source: '.' },
  { name: "x'y", source: '.' },
]
const BBB = 'bbb-new@market-a|market-a'
const YYY = 'yyy-new@market-a|market-a'
// 2f-R1 (7): the id is bare, with no quotes: cmd.exe would pass single quotes into the argument.
const BBB_LINE = 'claude plugin install bbb-new@market-a --scope user'
const BBB_COPIED = `Copied the install line of bbb-new; run it in your terminal: ${BBB_LINE}`
// market-c has a local copy and no installed plugin. Its catalog lists ccc-extra, and zzz-tool, which only market-a's copy
// of is installed: an id is a name and a marketplace, so zzz-tool@market-c is not installed.
const CATALOG_C_TEXT = JSON.stringify({ plugins: [{ name: 'zzz-tool', source: './zzz', version: '99.0.0' }, { name: 'ccc-extra', source: './ccc-extra', description: 'From market-c.' }] })
const C_COPY = ['mm-copy-ccc-extra@market-c|market-c', 'mm-copy-zzz-tool@market-c|market-c']
const READING_ITS_CATALOG = 'Reading its catalog…'
const NOT_READ_YET = 'Its catalog is not read yet: press the header above to read it.'
const NO_LOCAL_COPY_ORG = 'mods-manager: market-org has no local copy, so its plugins are not listed and the latest versions of its installed plugins are unknown'
// 2f-R1: the note of a section read on demand whose catalog could not be read, which says how to read it again.
const RETRY_NOTE = /^Its catalog could not be read \(.+\): open this section again to try once more\.$/
// 2f-R1: a second text of market-c's catalog, for the tests where two reads must be told apart by what they found.
const CATALOG_C_SECOND = JSON.stringify({ plugins: [{ name: 'ddd-second', source: './ddd-second', description: 'From the second read.' }] })
const SECOND_COPY = 'mm-copy-ddd-second@market-c|market-c'
// 2f-R1: the debug-log lines for the two names of NEW_ENTRIES that PLUGIN_ID refuses, each logged once per session.
const REFUSED_LINES = [
  'mods-manager: the catalog of market-a lists "Bad Name", which is not a lowercase name@marketplace, so it is not shown',
  'mods-manager: the catalog of market-a lists "x\'y", which is not a lowercase name@marketplace, so it is not shown',
]

/** The keys of every Copy install line button, in the order drawn: one per plugin not installed that the pane draws. */
const copyKeys = async (ui: Mounted<'terminal' | 'desktop'>): Promise<string[]> =>
  (await ui.findAll({ type: 'Button' })).map((b) => b.key).filter((key): key is string => key !== undefined && key.startsWith('mm-copy-'))
/** The keys of the section headers, in the order drawn. */
const sectionKeys = async (ui: Mounted<'terminal' | 'desktop'>): Promise<string[]> =>
  (await ui.findAll({ type: 'Button' })).map((b) => b.key).filter((key): key is string => key !== undefined && key.startsWith('mm-sec-'))
/** How many times `path` was read with $.fs.read. */
const readsOf = (w: World, path: string): number => w.reads.filter((read) => read === path).length

describe('2f: the plugins a catalog lists that are not installed', () => {
  test('an expanded marketplace section with installed rows lists, after its rows, the plugins its catalog lists that no scope has installed, by name, each with its description through printable with Install and Copy install line; a name PLUGIN_ID refuses is never shown and is named in the debug log', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.files = { ...CATALOG_FILES, [CATALOG_A]: catalogA('10.0.0', NEW_ENTRIES) }
      w.calls = []
      w.logs = []
      w.reads = []
      const ui = await openAndMount($, w, `avail-${surface}-${columns}`, surface, columns)
      const room = columns - 8
      // The count of the plugins not installed follows the count of the disabled rows, and the name comes last.
      expect(await sectionLabel(ui, 'mm-sec-market-a')).toBe(fitLabel('1 off · 2 not installed · market-a', room))
      // Collapsed, the section draws none of them.
      expect(await copyKeys(ui)).toEqual([])
      await ui.press({ key: 'mm-sec-market-a' })
      await idle(w)
      expect(await copyKeys(ui)).toEqual([`mm-copy-${BBB}`, `mm-copy-${YYY}`])
      expect(await ui.find({ key: `mm-avail-${BBB}` })).toBeDefined()
      const keys = (await ui.findAll({ type: 'Button' })).map((b) => b.key ?? '')
      // The section's own row comes first.
      expect(keys.indexOf('mm-toggle-aaa-mod@market-a|user')).toBeLessThan(keys.indexOf(`mm-copy-${BBB}`))
      // Install and Copy install line only: no toggle, Update, Uninstall or Details for a plugin that is not installed.
      expect(keys.filter((key) => key.includes('bbb-new') || key.includes('yyy-new'))).toEqual([`mm-install-${BBB}`, `mm-copy-${BBB}`, `mm-install-${YYY}`, `mm-copy-${YYY}`])
      expect((await ui.find({ key: `mm-install-${BBB}` }))?.props.label).toBe(fitLabel('Install', room))
      expect((await ui.find({ key: `mm-copy-${BBB}` }))?.props.label).toBe(fitLabel('Copy install line', room))
      expect((await ui.find({ type: 'Text', text: 'New? bbb?' }))?.props).toMatchObject({ dimColor: true, wrap: 'truncate-end' })
      expect(await ui.findAll({ type: 'Text', text: 'not installed' })).toHaveLength(2)
      // Installed in some scope, here or in another folder: never offered.
      for (const name of ['zzz-tool', 'aaa-mod', 'ddd-local', 'eee-elsewhere']) expect(await ui.find({ key: `mm-copy-${name}@market-a|market-a` })).toBeUndefined()
      expect(await ui.find({ type: 'Text', text: /Bad Name|x'y/ })).toBeUndefined()
      expect(w.logs.filter((log) => log.text.startsWith('mods-manager: the catalog of market-a lists ')).map((log) => [log.text, log.to])).toEqual([
        ['mods-manager: the catalog of market-a lists "Bad Name", which is not a lowercase name@marketplace, so it is not shown', 'debug'],
        ['mods-manager: the catalog of market-a lists "x\'y", which is not a lowercase name@marketplace, so it is not shown', 'debug'],
      ])
      // The plugin.json of a plugin not installed is never read: the pane shows no version for it.
      expect(w.reads.filter((path) => path.includes('bbb-new') || path.includes('yyy-new'))).toEqual([])
      const texts = (await ui.findAll({ type: 'Text' })).map((text) => String(text.children))
      const labels = (await ui.findAll({ type: 'Button' })).map((button) => String(button.props.label))
      expect([...texts, ...labels].filter((text) => /[\p{Cc}؜‎‏‪-‮⁦-⁩]/u.test(text))).toEqual([])
      expect(actions(w)).toEqual([])
      await ui.unmount()
    }
  })

  test('Copy install line copies claude plugin install <name>@<marketplace> --scope user, with no quotes, to the clipboard of the surface pressed and says so in a toast; a refused copy names the line in the pane; it runs nothing and asks nothing', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.files = { ...CATALOG_FILES, [CATALOG_A]: catalogA('10.0.0', NEW_ENTRIES) }
      w.copyResult = { isCopied: true }
      w.copies = []
      w.toasts = []
      const ui = await openAndMount($, w, `avail-copy-${surface}-${columns}`, surface, columns)
      await ui.press({ key: 'mm-sec-market-a' })
      await idle(w)
      w.calls = []
      await ui.press({ key: `mm-copy-${BBB}` })
      await idle(w)
      expect(w.copies).toEqual([{ text: BBB_LINE, surface }])
      expect(w.toasts).toEqual([BBB_COPIED])
      w.copyResult = { isCopied: false, reason: 'no-clipboard' }
      w.toasts = []
      await ui.press({ key: `mm-copy-${BBB}` })
      await idle(w)
      expect(w.toasts).toEqual([])
      expect(await ui.find({ type: 'Text', text: `The install line of bbb-new could not be copied (no-clipboard): ${BBB_LINE}` })).toBeDefined()
      // Copy install line runs no claude, no other program, and asks no question.
      expect(w.calls).toEqual([])
      expect(w.asked).toEqual([])
      await ui.unmount()
    }
  })

  test('a marketplace with a local copy and no installed plugin has its own section, collapsed, after every section with installed rows; nothing of it is read on open; its catalog is read when the section is first opened and kept while it is closed and opened again; one hosted on claude.ai has none, and the debug log says why', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.files = { ...CATALOG_FILES, [CATALOG_C]: CATALOG_C_TEXT }
      w.reads = []
      w.logs = []
      w.calls = []
      const ui = await openAndMount($, w, `on-demand-${surface}-${columns}`, surface, columns)
      const room = columns - 8
      expect(await sectionKeys(ui)).toEqual(['mm-sec-all enabled', 'mm-sec-market-a', 'mm-sec-market-b', 'mm-sec-market-c'])
      expect(await sectionLabel(ui, 'mm-sec-market-c')).toBe(fitLabel('not installed · market-c', room))
      expect(readsOf(w, CATALOG_C)).toBe(0)
      expect(w.logs.filter((log) => log.text === NO_LOCAL_COPY_ORG && log.to === 'debug')).toHaveLength(1)
      await ui.press({ key: 'mm-sec-market-c' })
      await idle(w)
      expect(readsOf(w, CATALOG_C)).toBe(1)
      expect(await copyKeys(ui)).toEqual(C_COPY)
      expect(await sectionLabel(ui, 'mm-sec-market-c')).toBe(fitLabel('2 not installed · market-c', room))
      expect(await ui.find({ type: 'Text', text: 'From market-c.' })).toBeDefined()
      // Closed and opened again, it keeps its listing: the catalog is not read again.
      await ui.press({ key: 'mm-sec-market-c' })
      await idle(w)
      expect(await copyKeys(ui)).toEqual([])
      await ui.press({ key: 'mm-sec-market-c' })
      await idle(w)
      expect(await copyKeys(ui)).toEqual(C_COPY)
      expect(readsOf(w, CATALOG_C)).toBe(1)
      expect(actions(w)).toEqual([])
      await ui.unmount()
    }
  })

  test('the pane opened again, or Refresh, closes a section read on demand that the session state still marks open and drops its listing, so its catalog is not read on open; a section with installed rows stays open; opening it again reads its catalog again', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.files = { ...CATALOG_FILES, [CATALOG_C]: CATALOG_C_TEXT }
      w.reads = []
      const ui = await openAndMount($, w, `on-demand-reopen-${surface}-${columns}`, surface, columns)
      await ui.press({ key: 'mm-sec-market-a' })
      await idle(w)
      await ui.press({ key: 'mm-sec-market-c' })
      await idle(w)
      expect(await copyKeys(ui)).toEqual(C_COPY)
      // The session state marks market-c open: the pane's open must not read its catalog, and draws it closed.
      await openPane($)
      await idle(w)
      expect(readsOf(w, CATALOG_C)).toBe(1)
      expect(await copyKeys(ui)).toEqual([])
      expect(await sectionLabel(ui, 'mm-sec-market-c')).toBe(fitLabel('not installed · market-c', columns - 8))
      expect(await ui.find({ key: 'mm-toggle-aaa-mod@market-a|user' })).toBeDefined()
      await ui.press({ key: 'mm-sec-market-c' })
      await idle(w)
      expect(readsOf(w, CATALOG_C)).toBe(2)
      expect(await copyKeys(ui)).toEqual(C_COPY)
      // Refresh does the same.
      await ui.press({ key: 'mm-refresh' })
      await idle(w)
      expect(readsOf(w, CATALOG_C)).toBe(2)
      expect(await copyKeys(ui)).toEqual([])
      expect(await ui.find({ key: 'mm-toggle-aaa-mod@market-a|user' })).toBeDefined()
      await ui.unmount()
    }
  })

  test('while its catalog is read the section says so, and its header pressed again meanwhile starts no second read; a catalog that cannot be read is named in the section and in the debug log', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.files = { ...CATALOG_FILES, [CATALOG_C]: CATALOG_C_TEXT }
      w.reads = []
      const ui = await openAndMount($, w, `on-demand-hold-${surface}-${columns}`, surface, columns)
      const gate = deferred()
      w.readHold = { path: CATALOG_C, gate }
      await ui.press({ key: 'mm-sec-market-c' })
      await idle(w)
      expect(await ui.find({ type: 'Text', text: READING_ITS_CATALOG })).toBeDefined()
      await ui.press({ key: 'mm-sec-market-c' })
      await idle(w)
      await ui.press({ key: 'mm-sec-market-c' })
      await idle(w)
      gate.resolve()
      await idle(w)
      expect(readsOf(w, CATALOG_C)).toBe(1)
      expect(await copyKeys(ui)).toEqual(C_COPY)
      expect(await ui.find({ type: 'Text', text: READING_ITS_CATALOG })).toBeUndefined()
      await ui.unmount()
      // A catalog that cannot be read: the section says why, and so does the debug log, once, masked (maskedLog; item 3
      // sweep, G2): the catalog sits in the home folder, which the line names as ~.
      delete w.files[CATALOG_C]
      w.refused = [CATALOG_C]
      w.logs = []
      const failing = await openAndMount($, w, `on-demand-fails-${surface}-${columns}`, surface, columns)
      await failing.press({ key: 'mm-sec-market-c' })
      await idle(w)
      expect(await failing.find({ type: 'Text', text: RETRY_NOTE })).toBeDefined()
      expect(await copyKeys(failing)).toEqual([])
      expect(w.logs.filter((log) => log.to === 'debug' && log.text.startsWith('mods-manager: the catalog of market-c could not be read: '))).toEqual([
        { text: 'mods-manager: the catalog of market-c could not be read: mods-expert-developer-plugin: $.fs.read: EACCES: ~/.claude/plugins/marketplaces/market-c/.claude-plugin/marketplace.json', to: 'debug' },
      ])
      await failing.unmount()
      w.refused = []
    }
  })

  test("a Refresh while a catalog is read on demand drops that read's answer, so the section, opened again, reads its catalog again and draws only what the second read found, even when the first read answers while the second still runs", async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.files = { ...CATALOG_FILES, [CATALOG_C]: CATALOG_C_TEXT }
      w.reads = []
      const ui = await openAndMount($, w, `on-demand-race-${surface}-${columns}`, surface, columns)
      const gate = deferred()
      w.readHold = { path: CATALOG_C, gate }
      await ui.press({ key: 'mm-sec-market-c' })
      await idle(w)
      await ui.press({ key: 'mm-refresh' })
      await idle(w)
      expect(await copyKeys(ui)).toEqual([])
      // The section is opened again while the first read still runs: a second read starts, held too.
      const second = deferred()
      w.readHold = { path: CATALOG_C, gate: second }
      await ui.press({ key: 'mm-sec-market-c' })
      await idle(w)
      // The first read answers now, with the first text, while the second one waits; then the file changes, and the
      // second read answers with the second text (each held read reads the file when it is let go).
      gate.resolve()
      await idle(w)
      w.files[CATALOG_C] = CATALOG_C_SECOND
      second.resolve()
      await idle(w)
      // 2f-R1 (5): the second text's plugins are drawn and none of the first's, which a Refresh replaced.
      expect(await copyKeys(ui)).toEqual([SECOND_COPY])
      expect(await ui.find({ type: 'Text', text: 'From market-c.' })).toBeUndefined()
      expect(readsOf(w, CATALOG_C)).toBe(2)
      await ui.unmount()
    }
  })

  test('the plugins not installed count toward neither the status-line badge nor Update all, whatever the filter shows', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      // bbb-new declares a version newer than any installed one, which must draw no arrow and count nowhere.
      w.files = { ...CATALOG_FILES, [CATALOG_A]: catalogA('10.0.0', [{ name: 'bbb-new', source: { source: 'github', repo: 'org/bbb-new' }, version: '99.0.0' }]), [CATALOG_C]: CATALOG_C_TEXT }
      w.statuses = []
      w.asked = []
      const ui = await openAndMount($, w, `avail-badge-${surface}-${columns}`, surface, columns)
      await expandOff(ui, w)
      await ui.press({ key: 'mm-sec-market-c' })
      await idle(w)
      expect(await copyKeys(ui)).toEqual([`mm-copy-${BBB}`, ...C_COPY])
      expect(w.statuses).toEqual([BADGE_TWO])
      expect(await updateKeys(ui)).toEqual(UPDATE_KEYS)
      expect((await ui.find({ key: 'mm-update-all' }))?.props.label).toBe(fitLabel(updateAllLabel(2), columns - 8))
      expect(await ui.findAll({ type: 'Text', text: /↑/ })).toHaveLength(2)
      // A filter that keeps only a plugin not installed leaves Update all with no row, so it is not drawn.
      await ui.input({ key: 'mm-filter', text: 'bbb', kind: 'change' })
      await idle(w)
      expect(await copyKeys(ui)).toEqual([`mm-copy-${BBB}`])
      expect(await ui.find({ key: 'mm-update-all' })).toBeUndefined()
      await ui.input({ key: 'mm-filter', text: '', kind: 'change' })
      await idle(w)
      await ui.press({ key: 'mm-update-all' })
      await idle(w)
      expect(w.asked).toEqual([QUESTION_UPDATE_ALL_2])
      expect(w.statuses).toEqual([BADGE_TWO])
      await ui.unmount()
    }
  })

  test('the filter matches the plugins not installed by name, id or marketplace, and "mod" hides them; a section read on demand whose catalog is not read yet is drawn while filtering only when its marketplace name matches, and its header press then reads it', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.files = { ...CATALOG_FILES, [CATALOG_A]: catalogA('10.0.0', NEW_ENTRIES), [CATALOG_C]: CATALOG_C_TEXT }
      w.reads = []
      const ui = await openAndMount($, w, `avail-filter-${surface}-${columns}`, surface, columns)
      // No installed row matches "bbb": market-a's section holds only the plugin not installed, and the pane does not say
      // that nothing matches.
      await ui.input({ key: 'mm-filter', text: 'bbb', kind: 'change' })
      await idle(w)
      expect(await copyKeys(ui)).toEqual([`mm-copy-${BBB}`])
      expect(await sectionKeys(ui)).toEqual(['mm-sec-market-a'])
      expect(await sectionLabel(ui, 'mm-sec-market-a')).toBe(fitLabel('1 not installed · market-a', columns - 8))
      expect(await ui.find({ type: 'Text', text: 'No plugin matches.' })).toBeUndefined()
      // "mod" selects mods only, and no plugin that is not installed is known to be one.
      await ui.input({ key: 'mm-filter', text: 'mod', kind: 'change' })
      await idle(w)
      expect(await copyKeys(ui)).toEqual([])
      // market-c's catalog is not read: no plugin of it can match yet, so its section is drawn only for a filter its name matches.
      await ui.input({ key: 'mm-filter', text: 'extra', kind: 'change' })
      await idle(w)
      expect(await sectionKeys(ui)).toEqual([])
      expect(await ui.find({ type: 'Text', text: 'No plugin matches.' })).toBeDefined()
      await ui.input({ key: 'mm-filter', text: 'market-c', kind: 'change' })
      await idle(w)
      expect(await sectionKeys(ui)).toEqual(['mm-sec-market-c'])
      expect(await ui.find({ type: 'Text', text: NOT_READ_YET })).toBeDefined()
      expect(readsOf(w, CATALOG_C)).toBe(0)
      // While the filter forces it open, its header press reads it, and changes nothing else.
      await ui.press({ key: 'mm-sec-market-c' })
      await idle(w)
      expect(readsOf(w, CATALOG_C)).toBe(1)
      expect(await copyKeys(ui)).toEqual(C_COPY)
      // Once read, "extra" finds ccc-extra.
      await ui.input({ key: 'mm-filter', text: 'extra', kind: 'change' })
      await idle(w)
      expect(await copyKeys(ui)).toEqual(['mm-copy-ccc-extra@market-c|market-c'])
      await ui.unmount()
    }
  })

  test('a plugin installed after its catalog was read is no longer offered once the list is read again: it is a row of its own', async ($, on) => {
    const listed: Array<Record<string, unknown>> = PLUGINS.map((entry) => ({ ...entry }))
    const w = withCatalogs(world(on, listed))
    for (const { surface, columns } of PLACES) {
      listed.splice(PLUGINS.length)
      w.files = { ...CATALOG_FILES, [CATALOG_A]: catalogA('10.0.0', NEW_ENTRIES) }
      const ui = await openAndMount($, w, `avail-installed-${surface}-${columns}`, surface, columns)
      await ui.press({ key: 'mm-sec-market-a' })
      await idle(w)
      expect(await copyKeys(ui)).toEqual([`mm-copy-${BBB}`, `mm-copy-${YYY}`])
      // Installed from a terminal, turned off, then a Refresh.
      listed.push({ id: 'bbb-new@market-a', version: '1.0.0', scope: 'user', enabled: false, installPath: '/cache/market-a/bbb-new/1.0.0' })
      await ui.press({ key: 'mm-refresh' })
      await idle(w)
      expect(await copyKeys(ui)).toEqual([`mm-copy-${YYY}`])
      expect(await ui.find({ key: 'mm-toggle-bbb-new@market-a|user' })).toBeDefined()
      expect(await sectionLabel(ui, 'mm-sec-market-a')).toBe(fitLabel('2 off · 1 not installed · market-a', columns - 8))
      await ui.unmount()
    }
  })

  test('a section draws the first 25 plugins not installed by name, then one line that counts the rest', async ($, on) => {
    const w = withCatalogs(world(on))
    const many = Array.from({ length: 27 }, (_, index) => ({ name: `p${String(index).padStart(2, '0')}`, source: `./p${index}` }))
    for (const { surface, columns } of PLACES) {
      w.files = { ...CATALOG_FILES, [CATALOG_C]: JSON.stringify({ plugins: [...many].reverse() }) }
      const ui = await openAndMount($, w, `avail-cap-${surface}-${columns}`, surface, columns)
      await ui.press({ key: 'mm-sec-market-c' })
      await idle(w)
      expect(await copyKeys(ui)).toEqual(many.slice(0, 25).map((entry) => `mm-copy-${entry.name}@market-c|market-c`))
      expect(await ui.find({ type: 'Text', text: 'and 2 more not installed: type part of a name in the filter to find one.' })).toBeDefined()
      expect(await sectionLabel(ui, 'mm-sec-market-c')).toBe(fitLabel('27 not installed · market-c', columns - 8))
      await ui.unmount()
    }
  })

  // 2f-R1 (TRDD-R2QYIN8O): the follow-ups on 2f.
  test('with no installed plugin the filter field is drawn while a marketplace has a local copy: a name its catalog lists is found once its section is read, and a filter that matches nothing says so', async ($, on) => {
    const w = withCatalogs(world(on, []))
    for (const { surface, columns } of PLACES) {
      w.files = { ...CATALOG_FILES, [CATALOG_C]: CATALOG_C_TEXT }
      w.reads = []
      const ui = await openAndMount($, w, `no-rows-filter-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ type: 'Text', text: 'No plugins are installed.' })).toBeDefined()
      expect(await sectionKeys(ui)).toEqual(['mm-sec-market-a', 'mm-sec-market-b', 'mm-sec-market-c'])
      expect(await ui.find({ key: 'mm-filter' })).toBeDefined()
      await ui.press({ key: 'mm-sec-market-c' })
      await idle(w)
      expect(readsOf(w, CATALOG_C)).toBe(1)
      await ui.input({ key: 'mm-filter', text: 'ccc-extra', kind: 'change' })
      await idle(w)
      expect(await copyKeys(ui)).toEqual(['mm-copy-ccc-extra@market-c|market-c'])
      expect(await ui.find({ type: 'Text', text: 'No plugin matches.' })).toBeUndefined()
      await ui.input({ key: 'mm-filter', text: 'nothing-like-it', kind: 'change' })
      await idle(w)
      expect(await sectionKeys(ui)).toEqual([])
      expect(await ui.find({ type: 'Text', text: 'No plugin matches.' })).toBeDefined()
      expect(actions(w)).toEqual([])
      await ui.unmount()
    }
  })

  test('a catalog read on demand that failed is read again when its section is opened again, and its note says so; once the file is back its plugins are drawn', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.files = { ...CATALOG_FILES }
      delete w.files[CATALOG_C]
      w.reads = []
      const ui = await openAndMount($, w, `on-demand-retry-${surface}-${columns}`, surface, columns)
      await ui.press({ key: 'mm-sec-market-c' })
      await idle(w)
      expect(readsOf(w, CATALOG_C)).toBe(1)
      expect(await ui.find({ type: 'Text', text: RETRY_NOTE })).toBeDefined()
      expect(await copyKeys(ui)).toEqual([])
      // The file is back. Closing the section reads nothing; opening it again reads the catalog a second time.
      w.files[CATALOG_C] = CATALOG_C_TEXT
      await ui.press({ key: 'mm-sec-market-c' })
      await idle(w)
      expect(readsOf(w, CATALOG_C)).toBe(1)
      await ui.press({ key: 'mm-sec-market-c' })
      await idle(w)
      expect(readsOf(w, CATALOG_C)).toBe(2)
      expect(await copyKeys(ui)).toEqual(C_COPY)
      expect(await ui.find({ type: 'Text', text: RETRY_NOTE })).toBeUndefined()
      await ui.unmount()
    }
  })

  test('a section with installed rows whose catalog the read of the latest versions could not read starts no read when it is opened, and draws no note about it', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.files = { ...CATALOG_FILES }
      delete w.files[CATALOG_A]
      w.reads = []
      const ui = await openAndMount($, w, `rows-failed-${surface}-${columns}`, surface, columns)
      expect(readsOf(w, CATALOG_A)).toBe(1)
      await ui.press({ key: 'mm-sec-market-a' })
      await idle(w)
      expect(await ui.find({ key: 'mm-toggle-aaa-mod@market-a|user' })).toBeDefined()
      expect(readsOf(w, CATALOG_A)).toBe(1)
      expect(await ui.find({ type: 'Text', text: RETRY_NOTE })).toBeUndefined()
      expect(await ui.find({ type: 'Text', text: READING_ITS_CATALOG })).toBeUndefined()
      await ui.unmount()
    }
  })

  test('a read of the list after a change replaces the listing of every catalog it reads, a failed read included: once the catalog is gone its plugins are no longer drawn, and when the marketplace later has no installed row its section says the read failed', async ($, on) => {
    const listed: Array<Record<string, unknown>> = PLUGINS.map((entry) => ({ ...entry }))
    const w = withCatalogs(world(on, listed))
    for (const { surface, columns } of PLACES) {
      listed.splice(0, listed.length, ...PLUGINS.map((entry) => ({ ...entry })))
      w.files = { ...CATALOG_FILES, [CATALOG_A]: catalogA('10.0.0', NEW_ENTRIES) }
      const ui = await openAndMount($, w, `stale-gone-${surface}-${columns}`, surface, columns)
      await ui.press({ key: 'mm-sec-market-a' })
      await idle(w)
      expect(await copyKeys(ui)).toEqual([`mm-copy-${BBB}`, `mm-copy-${YYY}`])
      // The catalog is gone, then a change reads the list again (not Refresh, which drops every listing anyway).
      delete w.files[CATALOG_A]
      w.calls = []
      w.answer = 'Turn it off'
      await ui.press({ key: 'mm-toggle-zzz-tool@market-a|user' })
      await idle(w)
      w.answer = undefined
      expect(actions(w).map((call) => call.argv)).toEqual([[CLAUDE, 'plugin', 'disable', 'zzz-tool@market-a', '--scope', 'user']])
      expect(await copyKeys(ui)).toEqual([])
      // The section with rows draws no note for its failed listing: the problem line above the rows names it.
      expect(await ui.find({ type: 'Text', text: RETRY_NOTE })).toBeUndefined()
      // Every plugin of market-a is uninstalled from a terminal, and a change on market-b reads the list again. market-a's
      // section, still open, is now read on demand, and its listing is the failed one: it says so, not that it is unread.
      listed.splice(0, listed.length, ...PLUGINS.filter((entry) => !entry.id.endsWith('@market-a')).map((entry) => ({ ...entry })))
      w.answer = 'Turn it off'
      await ui.press({ key: 'mm-toggle-mmm-mod@market-b|user' })
      await idle(w)
      w.answer = undefined
      expect(await ui.find({ key: 'mm-toggle-aaa-mod@market-a|user' })).toBeUndefined()
      expect(await ui.find({ type: 'Text', text: RETRY_NOTE })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: NOT_READ_YET })).toBeUndefined()
      await ui.unmount()
    }
  })

  test('a marketplace that leaves the marketplace list loses its listing and its plugins not installed at the next read of the list; one with installed rows keeps only its rows; back in the list, its catalog is not drawn until it is read again', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.marketplaces = MARKETPLACES
      w.files = { ...CATALOG_FILES, [CATALOG_A]: catalogA('10.0.0', NEW_ENTRIES), [CATALOG_C]: CATALOG_C_TEXT }
      w.reads = []
      const ui = await openAndMount($, w, `stale-left-${surface}-${columns}`, surface, columns)
      await ui.press({ key: 'mm-sec-market-a' })
      await idle(w)
      await ui.press({ key: 'mm-sec-market-c' })
      await idle(w)
      expect(await copyKeys(ui)).toEqual([`mm-copy-${BBB}`, `mm-copy-${YYY}`, ...C_COPY])
      // market-a and market-c leave the list; a change reads it again.
      w.marketplaces = MARKETPLACES.filter((marketplace) => marketplace.name !== 'market-a' && marketplace.name !== 'market-c')
      w.answer = 'Turn it off'
      await ui.press({ key: 'mm-toggle-zzz-tool@market-a|user' })
      await idle(w)
      w.answer = undefined
      expect(await copyKeys(ui)).toEqual([])
      expect(await sectionKeys(ui)).toEqual(['mm-sec-all enabled', 'mm-sec-market-a', 'mm-sec-market-b'])
      expect(await ui.find({ key: 'mm-toggle-aaa-mod@market-a|user' })).toBeDefined()
      // Both come back, market-c's catalog with another text, and a change reads the list again. market-a's catalog is read
      // by that read; market-c's section, still open, has no listing left, so it is not read yet and draws none of its plugins.
      w.marketplaces = MARKETPLACES
      w.files[CATALOG_C] = CATALOG_C_SECOND
      w.answer = 'Turn it off'
      await ui.press({ key: 'mm-toggle-mmm-mod@market-b|user' })
      await idle(w)
      w.answer = undefined
      expect(await copyKeys(ui)).toEqual([`mm-copy-${BBB}`, `mm-copy-${YYY}`])
      expect(await ui.find({ type: 'Text', text: NOT_READ_YET })).toBeDefined()
      expect(readsOf(w, CATALOG_C)).toBe(1)
      await ui.unmount()
    }
  })

  test('a catalog read on demand whose marketplace gets an installed plugin meanwhile keeps the listing of the later read of the latest versions: the on-demand answer, ending last, is dropped', async ($, on) => {
    const listed: Array<Record<string, unknown>> = PLUGINS.map((entry) => ({ ...entry }))
    const w = withCatalogs(world(on, listed))
    for (const { surface, columns } of PLACES) {
      listed.splice(PLUGINS.length)
      w.files = { ...CATALOG_FILES, [CATALOG_C]: CATALOG_C_TEXT }
      const ui = await openAndMount($, w, `on-demand-vs-latest-${surface}-${columns}`, surface, columns)
      const gate = deferred()
      w.readHold = { path: CATALOG_C, gate }
      await ui.press({ key: 'mm-sec-market-c' })
      await idle(w)
      expect(await ui.find({ type: 'Text', text: READING_ITS_CATALOG })).toBeDefined()
      // A plugin of market-c is installed from a terminal, and a change reads the list again: the read of the latest
      // versions now reads market-c's catalog itself, whose text has changed meanwhile.
      listed.push({ id: 'ccc-extra@market-c', version: '1.0.0', scope: 'user', enabled: false, installPath: '/cache/market-c/ccc-extra/1.0.0' })
      w.files[CATALOG_C] = CATALOG_C_SECOND
      w.answer = 'Turn it off'
      await ui.press({ key: 'mm-toggle-zzz-tool@market-a|user' })
      await idle(w)
      w.answer = undefined
      expect(await copyKeys(ui)).toEqual([SECOND_COPY])
      // The held on-demand read answers last, with the first text.
      w.files[CATALOG_C] = CATALOG_C_TEXT
      gate.resolve()
      await idle(w)
      expect(await copyKeys(ui)).toEqual([SECOND_COPY])
      expect(await ui.find({ key: 'mm-toggle-ccc-extra@market-c|user' })).toBeDefined()
      await ui.unmount()
    }
  })

  test('a name a catalog lists that PLUGIN_ID refuses is named in the debug log once per session, however often the catalog is read again', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.files = { ...CATALOG_FILES, [CATALOG_A]: catalogA('10.0.0', NEW_ENTRIES) }
      w.logs = []
      w.reads = []
      const ui = await openAndMount($, w, `refused-once-${surface}-${columns}`, surface, columns)
      await ui.press({ key: 'mm-refresh' })
      await idle(w)
      expect(readsOf(w, CATALOG_A)).toBe(2)
      expect(w.logs.filter((log) => log.text.startsWith('mods-manager: the catalog of market-a lists ')).map((log) => [log.text, log.to])).toEqual(REFUSED_LINES.map((text) => [text, 'debug']))
      await ui.unmount()
    }
  })
})

describe('the 2f rules', () => {
  const listed = (name: string, marketplace: string, description?: string): Available => ({ id: `${name}@${marketplace}`, name, marketplace, description })

  test('catalogListing shows, by name, each plugin whose name@marketplace PLUGIN_ID accepts, with its entry description, and returns the names it refuses; a marketplace name PLUGIN_ID refuses refuses them all', () => {
    const catalog = parseCatalog(JSON.stringify({ plugins: [{ name: 'zeta', source: '.', description: 'Z.' }, { name: 'alpha', source: '.' }, { name: '-rf', source: '.' }, { name: 'a b', source: '.' }, { name: 'UP', source: '.' }] }))
    expect(catalogListing('market-x', catalog)).toEqual({ entries: [listed('alpha', 'market-x'), listed('zeta', 'market-x', 'Z.')], refused: ['-rf', 'a b', 'UP'] })
    expect(catalogListing('Bad Market', catalog)).toEqual({ entries: [], refused: ['zeta', 'alpha', '-rf', 'a b', 'UP'] })
  })

  test('installLine writes an id PLUGIN_ID accepts bare, with no quotes, and names user scope, and refuses any other id; availableKey is the id, then the marketplace', () => {
    expect(installLine({ id: 'bbb-new@market-a' })).toBe(BBB_LINE)
    // With no quotes, PLUGIN_ID is the whole guard: a second '@', a leading '@' or '-', and characters that shells treat as
    // special (cmd.exe's & | ^ % among them) are refused.
    for (const id of ["x'y@m", 'a b@m', '-rf@m', 'x@m;rm', 'x@m\u0007', 'X@m', 'x', 'x@y@m', '@m', 'x@m&echo', 'x@m|more', 'x@m^', 'x@%m%', 'x@m"']) expect(() => installLine({ id })).toThrow()
    expect(availableKey(listed('bbb-new', 'market-a'))).toBe(BBB)
  })

  test('isMarketplaceName takes the marketplace part of PLUGIN_ID only; installedIdsOf holds every listed id in any scope and the id of each entry it could not read; isOnDemand is a listed marketplace with no row', () => {
    expect(['market-a', 'm.1', 'm_2'].map(isMarketplaceName)).toEqual([true, true, true])
    expect([ENABLED_KEY, NO_MARKETPLACE, 'Market', '', 'a b', 'x\u0007'].map(isMarketplaceName)).toEqual([false, false, false, false, false, false])
    const list = parseInstalled(JSON.stringify([...PLUGINS, ODD, { scope: 'user' }]))
    expect([...installedIdsOf(list)].sort()).toEqual([...PLUGINS.map((entry) => entry.id), ODD.id].sort())
    expect(isOnDemand('market-c', ['market-a', 'market-c'], [{ marketplace: 'market-a' }])).toBe(true)
    expect(isOnDemand('market-a', ['market-a', 'market-c'], [{ marketplace: 'market-a' }])).toBe(false)
    expect(isOnDemand('market-z', ['market-a', 'market-c'], [])).toBe(false)
  })

  test('findAvailable finds only a plugin its read catalog lists and no scope has installed', () => {
    const listings = new Map<string, Listing>([
      ['m', { kind: 'read', entries: [listed('a', 'm'), listed('b', 'm')] }],
      ['r', READING],
    ])
    expect(findAvailable(listings, new Set(), { id: 'a@m', marketplace: 'm' })).toEqual(listed('a', 'm'))
    expect(findAvailable(listings, new Set(['a@m']), { id: 'a@m', marketplace: 'm' })).toBeUndefined()
    expect(findAvailable(listings, new Set(), { id: 'c@m', marketplace: 'm' })).toBeUndefined()
    expect(findAvailable(listings, new Set(), { id: 'a@r', marketplace: 'r' })).toBeUndefined()
    expect(findAvailable(listings, new Set(), { id: 'a@m', marketplace: 'n' })).toBeUndefined()
  })

  test('sectionsOf with a catalog view: the sections with disabled rows first, then the other marketplaces by name: one whose rows are all enabled only with a plugin not installed, one with no row always, read or not; while filtering, a section read on demand only when something in it matches', () => {
    const at = (name: string, marketplace: string, enabled: boolean) => toRow({ ...parseInstalled(JSON.stringify([PLUGINS[0]])).entries[0]!, id: `${name}@${marketplace}`, enabled }, false)
    const rows = [at('p1', 'alpha', false), at('p2', 'aardvark', true)]
    const view: CatalogView = {
      marketplaces: ['alpha', 'aardvark', 'gamma', 'delta', 'beta'],
      withRows: new Set(['alpha', 'aardvark']),
      listings: new Map<string, Listing>([
        ['alpha', { kind: 'read', entries: [listed('a1', 'alpha', 'A one.'), listed('p1', 'alpha')] }],
        ['aardvark', { kind: 'read', entries: [listed('b1', 'aardvark')] }],
        ['gamma', { kind: 'read', entries: [] }],
        ['beta', { kind: 'failed', reason: 'EACCES' }],
      ]),
      installed: new Set(['p1@alpha', 'p2@aardvark']),
      query: '',
    }
    const sections = sectionsOf(rows, view)
    expect(sections.map((section) => [section.key, section.label])).toEqual([
      [ENABLED_KEY, '1 enabled'],
      ['alpha', '1 off · 1 not installed · alpha'],
      ['aardvark', '1 not installed · aardvark'],
      ['beta', 'not installed · beta'],
      ['delta', 'not installed · delta'],
      ['gamma', '0 not installed · gamma'],
    ])
    expect(sections[0]!.catalog).toBeUndefined()
    expect(sections[1]!.catalog).toEqual({ onDemand: false, listing: view.listings.get('alpha'), entries: [listed('a1', 'alpha', 'A one.')] })
    expect(sections.slice(2).map((section) => section.catalog?.onDemand)).toEqual([false, true, true, true])
    // With no marketplace with a local copy listed, the sections are those of the rows alone, as before 2f.
    expect(sectionsOf(rows).map((section) => section.key)).toEqual([ENABLED_KEY, 'alpha'])
    // Filtering: rows are filtered by the caller (filterRows); a read section only with a match, an unread one by its name.
    const keysFor = (query: string) => sectionsOf(filterRows(rows, query), { ...view, query }).map((section) => section.key)
    expect(keysFor('b1')).toEqual(['aardvark'])
    expect(keysFor('a1')).toEqual(['alpha'])
    expect(keysFor('delta')).toEqual(['delta'])
    expect(keysFor('beta')).toEqual(['beta'])
    expect(keysFor('gamma')).toEqual([])
    expect(keysFor('mod')).toEqual([])
    // A marketplace whose rows are all enabled and whose catalog lists nothing not installed has no section.
    expect(sectionsOf(rows, { ...view, listings: new Map() }).map((section) => section.key)).toEqual([ENABLED_KEY, 'alpha', 'beta', 'delta', 'gamma'])
  })

  test('catalogNote speaks only for a section read on demand; cappedAvailable keeps the first 25; availableDescription cuts and shows a control character as ?', () => {
    const entries = [listed('a', 'm')]
    expect(catalogNote({ onDemand: false, listing: undefined, entries: [] })).toBeUndefined()
    expect(catalogNote({ onDemand: false, listing: { kind: 'failed', reason: 'x' }, entries: [] })).toBeUndefined()
    expect(catalogNote({ onDemand: true, listing: undefined, entries: [] })).toBe(NOT_READ_YET)
    expect(catalogNote({ onDemand: true, listing: READING, entries: [] })).toBe(READING_ITS_CATALOG)
    expect(catalogNote({ onDemand: true, listing: { kind: 'failed', reason: 'EACCES: denied\u0007\nmore' }, entries: [] })).toBe('Its catalog could not be read (EACCES: denied?): open this section again to try once more.')
    expect(catalogNote({ onDemand: true, listing: { kind: 'read', entries: [] }, entries: [] })).toBe('Its catalog lists no plugin that is not installed.')
    expect(catalogNote({ onDemand: true, listing: { kind: 'read', entries }, entries })).toBeUndefined()
    const many = Array.from({ length: 30 }, (_, index) => listed(`p${index}`, 'm'))
    expect(cappedAvailable(many)).toEqual({ shown: many.slice(0, 25), more: 5 })
    expect(cappedAvailable(entries)).toEqual({ shown: entries, more: 0 })
    expect(availableDescription(listed('a', 'm'))).toBeUndefined()
    expect(availableDescription(listed('a', 'm', 'x\u001b[2J'))).toBe('x?[2J')
    expect(availableDescription(listed('a', 'm', 'y'.repeat(600)))).toBe(`${'y'.repeat(499)}…`)
  })
})

// 2j: a marketplace folder the pane adds. Its marketplace.json names new-market; the add runs ADD_NEW, and the world's
// onAdd then lists NEW_ENTRY, as claude would. Every text is spelled out here, so a change of the pane's words shows.
const NEW_DIR = '/work/new-market'
const NEW_CATALOG = `${NEW_DIR}/.claude-plugin/marketplace.json`
const NEW_CATALOG_TEXT = JSON.stringify({ name: 'new-market', plugins: [{ name: 'nnn-tool', source: './nnn-tool', description: 'From new-market.' }] })
const NEW_ENTRY = { name: 'new-market', source: 'directory', path: NEW_DIR, installLocation: NEW_DIR }
const ADD_NEW = [CLAUDE, 'plugin', 'marketplace', 'add', NEW_DIR]
const QUESTION_ADD_NEW = `Add the marketplace new-market from ${NEW_DIR}? This runs ["claude","plugin","marketplace","add","${NEW_DIR}"]. Its plugins are then listed here; the add installs none of them.`
const CHECKED_NEW = `The marketplace new-market from ${NEW_DIR} is not added yet. The pane does not resolve symbolic links, so a folder spelled through one may name a marketplace already added from its real path. Its marketplace.json is read again just before the add, and a name changed since is refused; one changed during the add itself is not: a marketplace it re-points is named afterwards by comparing the marketplace list before and after the add, and one renamed to a new name is added under it.`
const RENAMED_NEW = `Not added: the marketplace.json of ${NEW_DIR} now names market-b, not new-market as the question said, so nothing was run; press a: Add marketplace to check it again.`
const ADDED_NEW = `Added the marketplace new-market from ${NEW_DIR}: open its section to list its plugins.`
const TAKEN_NEW = `Not added: the marketplace new-market is already added from github org/new-market, and ${NEW_DIR} names the same marketplace, so adding it would point new-market at ${NEW_DIR}. Nothing was run.`
const GITHUB_NEW = { name: 'new-market', source: 'github', repo: 'org/new-market', installLocation: `${MARKETS}/new-market` }
// market-b re-pointed by the add, with a control character in its new path, which the log and the message show as ?.
const REPOINTED_B = { name: 'market-b', source: 'directory', path: '/elsewhere/market\u0007-b', installLocation: MARKET_B }
const REPOINTED_LINE = 'The marketplace market-b now comes from directory /elsewhere/market?-b, not directory /src/market-b; the pane did not change it back.'
const REMOTE = 'org/remote-market#v1'
const REMOTE_REQUEST = `/mods-expert-developer-plugin:mods-install-mod --marketplace ${REMOTE}`
const REMOTE_MESSAGE = `${REMOTE} is a remote marketplace: it cannot be checked before it is added, so the pane does not add it. Press c: Copy request and send the text to Claude: /mods-expert-developer-plugin:mods-install-mod checks the source, asks for the plugin's name and installs it.`
const CHECKING_NEW = `Wait: checking the marketplace folder ${NEW_DIR}… is still running. Nothing was changed.`
const OTHER_REMOTE = 'org/other-market'
const OTHER_REQUEST = `/mods-expert-developer-plugin:mods-install-mod --marketplace ${OTHER_REMOTE}`
// 2l: the forms the command takes, as every refusal names them, and the text of check.
const FORMS = '/mods-manager takes nothing or one of: open, close, check, add <source>.'
const CHECK_LINE = 'The catalogs are local copies, as of the last update of each marketplace; nothing was fetched.'

/** Each claude call's subcommand words, as `marketplace list`, `marketplace add` or `list --json`. */
const subcommands = (w: World): string[] => w.calls.map((call) => call.argv.slice(2, 4).join(' '))

/** Runs the mods-manager command with these arguments, from the person's Enter unless another origin is given. */
const runCommand = ($: any, args: string, origin: unknown = { kind: 'composer' }) =>
  $.command.run({ command: 'mods-manager', args, origin, presentation: { isFullscreen: false, columns: 80 } })

/** Types `text` in the add field and presses a: Add marketplace. */
async function typeAndAdd(ui: Mounted<'terminal' | 'desktop'>, w: World, text: string): Promise<void> {
  await ui.input({ key: 'mm-add', text, kind: 'change' })
  await idle(w)
  await ui.press({ key: 'mm-add-marketplace' })
  await idle(w)
}

describe('2j: a marketplace added from the pane', () => {
  test('a free local folder: a: Add marketplace reads its marketplace.json and the marketplace list, says what the check cannot see, and asks with the exact argv; typing calls nothing, and with no answer nothing is added', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.files = { ...CATALOG_FILES, [NEW_CATALOG]: NEW_CATALOG_TEXT }
      w.asked = []
      const ui = await openAndMount($, w, `add-ask-${surface}-${columns}`, surface, columns)
      w.calls = []
      w.reads = []
      expect(await ui.find({ key: 'mm-add-copy' })).toBeUndefined()
      // The path of the catalog file itself names the folder two levels up; the spaces around it are dropped.
      await ui.input({ key: 'mm-add', text: `  ${NEW_CATALOG}  `, kind: 'change' })
      await idle(w)
      expect(w.calls).toEqual([])
      expect((await ui.find({ key: 'mm-add' }))?.props.value).toBe(`  ${NEW_CATALOG}  `)
      await ui.press({ key: 'mm-add-marketplace' })
      await idle(w)
      expect(readsOf(w, NEW_CATALOG)).toBe(1)
      expect(subcommands(w)).toEqual(['marketplace list'])
      expect(w.asked).toEqual([QUESTION_ADD_NEW])
      expect(await ui.find({ type: 'Text', text: CHECKED_NEW })).toBeDefined()
      expect(actions(w)).toEqual([])
      // Any answer but Add it runs nothing: here Keep it as it is.
      w.answer = KEEP
      await ui.press({ key: 'mm-add-marketplace' })
      await idle(w)
      expect(w.asked).toEqual([QUESTION_ADD_NEW, QUESTION_ADD_NEW])
      expect(actions(w)).toEqual([])
      w.answer = undefined
      await ui.unmount()
    }
  })

  test('confirmed, the add runs claude plugin marketplace add <folder> with argv and no -y, reads the marketplace list before and after it, then reads everything again as Refresh does, and the new marketplace gets its own section', async ($, on) => {
    const w = withCatalogs(world(on))
    w.answer = 'Add it'
    for (const { surface, columns } of PLACES) {
      w.marketplaces = MARKETPLACES
      w.files = { ...CATALOG_FILES, [NEW_CATALOG]: NEW_CATALOG_TEXT }
      w.onAdd = () => {
        w.marketplaces = [...MARKETPLACES, NEW_ENTRY]
      }
      const ui = await openAndMount($, w, `add-yes-${surface}-${columns}`, surface, columns)
      // A section read on demand, opened before the add.
      await ui.press({ key: 'mm-sec-market-c' })
      await idle(w)
      expect(await copyKeys(ui)).toEqual(['mm-copy-zzz-tool@market-c|market-c'])
      w.calls = []
      w.logs = []
      expect(await sectionKeys(ui)).not.toContain('mm-sec-new-market')
      await typeAndAdd(ui, w, `${NEW_DIR}/`)
      expect(subcommands(w)).toEqual(['marketplace list', 'marketplace list', 'marketplace add', 'marketplace list', 'list --json', 'marketplace list'])
      expect(actions(w)).toEqual([{ argv: ADD_NEW, cwd: undefined }])
      expect(await ui.find({ type: 'Text', text: ADDED_NEW })).toBeDefined()
      expect(await sectionKeys(ui)).toContain('mm-sec-new-market')
      // The read after the add is Refresh's: it closed the section of market-c, read on demand, which a read of the list alone keeps open.
      expect(await copyKeys(ui)).toEqual([])
      // The section reads its catalog when opened; the add installed none of its plugins.
      await ui.press({ key: 'mm-sec-new-market' })
      await idle(w)
      expect(await copyKeys(ui)).toEqual(['mm-copy-nnn-tool@new-market|new-market'])
      expect(w.logs.filter((log) => log.to !== 'debug')).toEqual([])
      await ui.unmount()
    }
  })

  test('a folder already added under its name says so; the same name from another source, and the same folder under another name, are refused naming both; none of them asks or adds', async ($, on) => {
    const w = withCatalogs(world(on))
    const cases = [
      { list: [...MARKETPLACES, { ...NEW_ENTRY, path: `${NEW_DIR}/` }], text: `The marketplace new-market is already added from ${NEW_DIR}: nothing was run.` },
      { list: [...MARKETPLACES, GITHUB_NEW], text: TAKEN_NEW },
      {
        list: [...MARKETPLACES, { ...NEW_ENTRY, name: 'old-name' }],
        text: `Not added: ${NEW_DIR} is already added as the marketplace old-name, and its marketplace.json now names it new-market; what claude plugin marketplace add does then is not known, so nothing was run.`,
      },
    ]
    for (const { surface, columns } of PLACES) {
      for (const [index, { list, text }] of cases.entries()) {
        w.marketplaces = list
        w.files = { ...CATALOG_FILES, [NEW_CATALOG]: NEW_CATALOG_TEXT }
        w.asked = []
        const ui = await openAndMount($, w, `add-decide-${index}-${surface}-${columns}`, surface, columns)
        w.calls = []
        await typeAndAdd(ui, w, NEW_DIR)
        expect(await ui.find({ type: 'Text', text })).toBeDefined()
        expect(w.asked).toEqual([])
        expect(subcommands(w)).toEqual(['marketplace list'])
        await ui.unmount()
      }
    }
  })

  test('a marketplace the add re-pointed is named in the default log and the message, through printable, and is not changed back; an add that exits non-zero names its first line, logs its whole output, and the list is still compared', async ($, on) => {
    const w = withCatalogs(world(on))
    w.answer = 'Add it'
    for (const { surface, columns } of PLACES) {
      for (const fails of [false, true]) {
        w.marketplaces = MARKETPLACES
        w.files = { ...CATALOG_FILES, [NEW_CATALOG]: NEW_CATALOG_TEXT }
        w.addExit = fails ? 1 : 0
        w.onAdd = () => {
          w.marketplaces = MARKETPLACES.map((entry) => (entry.name === 'market-b' ? REPOINTED_B : entry))
        }
        const ui = await openAndMount($, w, `add-changed-${String(fails)}-${surface}-${columns}`, surface, columns)
        w.calls = []
        w.logs = []
        await typeAndAdd(ui, w, NEW_DIR)
        expect(subcommands(w).slice(0, 4)).toEqual(['marketplace list', 'marketplace list', 'marketplace add', 'marketplace list'])
        // No restore: the one change is the add.
        expect(actions(w)).toEqual([{ argv: ADD_NEW, cwd: undefined }])
        expect(w.logs.filter((log) => log.to !== 'debug').map((log) => log.text)).toEqual([`mods-manager: ${REPOINTED_LINE}`])
        const first = fails ? 'claude plugin marketplace add failed: Adding…?.' : ADDED_NEW
        expect(await ui.find({ type: 'Text', text: `${first} ${REPOINTED_LINE}` })).toBeDefined()
        const whole = w.logs.filter((log) => log.to === 'debug' && log.text.startsWith('mods-manager: claude plugin marketplace add '))
        expect(whole).toEqual(fails ? [{ text: `mods-manager: claude plugin marketplace add ${NEW_DIR} exited 1: Adding…? failed to add details`, to: 'debug' }] : [])
        await ui.unmount()
      }
    }
  })

  // Item 3 sweep, G2 (state.ts, the re-pointed marketplace): the default-log line is masked (maskedLog), so the user and
  // password of a git source's URL (urlUserinfoMasked) and the home folder in a folder source do not reach the transcript.
  test('a marketplace the add re-pointed to a git URL with a password, or to a folder in the home, is named in the default log masked', async ($, on) => {
    const w = withCatalogs(world(on))
    w.answer = 'Add it'
    w.files = { ...CATALOG_FILES, [NEW_CATALOG]: NEW_CATALOG_TEXT }
    w.onAdd = () => {
      w.marketplaces = MARKETPLACES.map((entry) => {
        // The URL is built from parts so the secret scanner does not read the fixture as a live credential (TRDD-5F1FO5WP).
        if (entry.name === 'market-a') return { name: 'market-a', source: 'git', url: `https://${['ann', 'hunter2pass'].join(':')}@example.invalid/m.git`, installLocation: MARKET_A }
        return entry.name === 'market-b' ? { ...REPOINTED_B, path: `${HOME}/market-b` } : entry
      })
    }
    const ui = await openAndMount($, w, 'add-changed-masked', 'terminal', 160)
    w.logs = []
    await typeAndAdd(ui, w, NEW_DIR)
    expect(w.logs.filter((log) => log.to !== 'debug').map((log) => log.text)).toEqual([
      'mods-manager: The marketplace market-a now comes from git https://[REDACTED:url-userinfo]@example.invalid/m.git, not github org/market-a; the pane did not change it back.',
      'mods-manager: The marketplace market-b now comes from directory ~/market-b, not directory /src/market-b; the pane did not change it back.',
    ])
    await ui.unmount()
  })

  test('a marketplace.json renamed while the question is open is refused at the answer, and one that cannot be read again adds nothing: both are read right before the add, after the list, both say why, neither adds, and the claim is released', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      for (const renamed of [true, false]) {
        w.marketplaces = MARKETPLACES
        w.files = { ...CATALOG_FILES, [NEW_CATALOG]: NEW_CATALOG_TEXT }
        w.answer = 'Add it'
        w.answerHold = deferred()
        const hold = w.answerHold
        w.asked = []
        const ui = await openAndMount($, w, `add-renamed-${String(renamed)}-${surface}-${columns}`, surface, columns)
        w.calls = []
        await typeAndAdd(ui, w, NEW_DIR)
        // The question is open: meanwhile the folder's marketplace.json is renamed to market-b, a marketplace already
        // added, which the add would re-point; or it is removed.
        if (renamed) w.files[NEW_CATALOG] = JSON.stringify({ name: 'market-b' })
        else delete w.files[NEW_CATALOG]
        hold.resolve()
        await idle(w)
        expect(subcommands(w)).toEqual(['marketplace list', 'marketplace list'])
        expect(actions(w)).toEqual([])
        if (renamed) expect(await ui.find({ type: 'Text', text: RENAMED_NEW })).toBeDefined()
        else expect(await ui.findAll({ type: 'Text', text: new RegExp(`^Not added: the marketplace\\.json of ${NEW_DIR} could not be read again before the add: .+`) })).toHaveLength(1)
        // The claim was released: with the file back, the next press checks again and asks.
        w.files[NEW_CATALOG] = NEW_CATALOG_TEXT
        w.answer = undefined
        await ui.press({ key: 'mm-add-marketplace' })
        await idle(w)
        expect(w.asked).toEqual([QUESTION_ADD_NEW, QUESTION_ADD_NEW])
        await ui.unmount()
      }
    }
  })

  test('a name added from elsewhere while the question is open is refused at the answer: the list before the add is checked again, and nothing is added', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.marketplaces = MARKETPLACES
      w.files = { ...CATALOG_FILES, [NEW_CATALOG]: NEW_CATALOG_TEXT }
      w.answer = 'Add it'
      w.answerHold = deferred()
      const hold = w.answerHold
      const ui = await openAndMount($, w, `add-again-${surface}-${columns}`, surface, columns)
      w.calls = []
      await typeAndAdd(ui, w, NEW_DIR)
      // The question is open: meanwhile new-market is added from GitHub in a terminal.
      w.marketplaces = [...MARKETPLACES, GITHUB_NEW]
      hold.resolve()
      await idle(w)
      expect(subcommands(w)).toEqual(['marketplace list', 'marketplace list'])
      expect(actions(w)).toEqual([])
      expect(await ui.find({ type: 'Text', text: TAKEN_NEW })).toBeDefined()
      await ui.unmount()
    }
  })

  test('a remote source is never added: the pane says it cannot be checked, c: Copy request copies the request for the install skill to the surface pressed, and a refused copy names it; nothing runs and nothing is asked', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.copies = []
      w.toasts = []
      w.copyResult = { isCopied: true }
      const ui = await openAndMount($, w, `add-remote-${surface}-${columns}`, surface, columns)
      w.calls = []
      await typeAndAdd(ui, w, REMOTE)
      expect(await ui.find({ type: 'Text', text: REMOTE_MESSAGE })).toBeDefined()
      await ui.press({ key: 'mm-add-copy' })
      await idle(w)
      expect(w.copies).toEqual([{ text: REMOTE_REQUEST, surface }])
      expect(w.toasts).toEqual([`Copied; send it to Claude: ${REMOTE_REQUEST}`])
      w.copyResult = { isCopied: false, reason: 'no-clipboard' }
      await ui.press({ key: 'mm-add-copy' })
      await idle(w)
      expect(await ui.find({ type: 'Text', text: `The request could not be copied (no-clipboard): ${REMOTE_REQUEST}` })).toBeDefined()
      // Text the pane refuses only sets the message, and the copy button goes with the remote source.
      await typeAndAdd(ui, w, './new-market')
      expect(await ui.find({ type: 'Text', text: '"./new-market" is not an absolute path: give the folder\'s whole path, starting with /; ~ is not expanded.' })).toBeDefined()
      expect(await ui.find({ key: 'mm-add-copy' })).toBeUndefined()
      expect(w.calls).toEqual([])
      expect(w.asked).toEqual([])
      await ui.unmount()
    }
  })

  test('typing another source drops the remote source the last check found: c: Copy request is gone until the new text is checked, then copies that request alone; the same text again keeps it', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.copies = []
      w.copyResult = { isCopied: true }
      const ui = await openAndMount($, w, `add-retype-${surface}-${columns}`, surface, columns)
      w.calls = []
      await typeAndAdd(ui, w, REMOTE)
      // The same text again keeps what the check found: the press still copies its request.
      await ui.input({ key: 'mm-add', text: REMOTE, kind: 'change' })
      await idle(w)
      await ui.press({ key: 'mm-add-copy' })
      await idle(w)
      expect(w.copies).toEqual([{ text: REMOTE_REQUEST, surface }])
      // Other text: the button goes, so no press can copy the request of a source the field no longer holds.
      await ui.input({ key: 'mm-add', text: OTHER_REMOTE, kind: 'change' })
      await idle(w)
      expect(await ui.find({ key: 'mm-add-copy' })).toBeUndefined()
      // Checked, the new source is the one whose request is copied.
      await ui.press({ key: 'mm-add-marketplace' })
      await idle(w)
      await ui.press({ key: 'mm-add-copy' })
      await idle(w)
      expect(w.copies).toEqual([
        { text: REMOTE_REQUEST, surface },
        { text: OTHER_REQUEST, surface },
      ])
      expect(w.calls).toEqual([])
      await ui.unmount()
    }
  })

  test('a source typed while the check of a remote source runs never leaves c: Copy request copying a source the field no longer holds; the new text, once checked, is the one copied', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.copies = []
      w.copyResult = { isCopied: true }
      const ui = await openAndMount($, w, `add-race-${surface}-${columns}`, surface, columns)
      w.calls = []
      await ui.input({ key: 'mm-add', text: REMOTE, kind: 'change' })
      await idle(w)
      // The press and the keystroke land together. Measured with this kit, the press's check reads REMOTE first and the
      // keystroke lands while it runs, and a check that wrote its answer after an await then left c: Copy request copying
      // REMOTE's request with OTHER_REMOTE in the field. The assertion holds whichever lands first: when the button is
      // drawn, it copies the request of the text in the field.
      await Promise.all([ui.press({ key: 'mm-add-marketplace' }), ui.input({ key: 'mm-add', text: OTHER_REMOTE, kind: 'change' })])
      await idle(w)
      expect((await ui.find({ key: 'mm-add' }))?.props.value).toBe(OTHER_REMOTE)
      if ((await ui.find({ key: 'mm-add-copy' })) !== undefined) {
        await ui.press({ key: 'mm-add-copy' })
        await idle(w)
        expect(w.copies).toEqual([{ text: OTHER_REQUEST, surface }])
        w.copies = []
      }
      await ui.press({ key: 'mm-add-marketplace' })
      await idle(w)
      await ui.press({ key: 'mm-add-copy' })
      await idle(w)
      expect(w.copies).toEqual([{ text: OTHER_REQUEST, surface }])
      expect(w.calls).toEqual([])
      await ui.unmount()
    }
  })

  test('a marketplace.json with no usable name, a press while claude reads the list, and a second press while a folder is checked add nothing and ask no second question', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.files = { ...CATALOG_FILES, [NEW_CATALOG]: JSON.stringify({ name: 'New\u0007 Market' }) }
      w.asked = []
      w.toasts = []
      const ui = await openAndMount($, w, `add-refused-${surface}-${columns}`, surface, columns)
      w.calls = []
      await typeAndAdd(ui, w, NEW_DIR)
      expect(await ui.find({ type: 'Text', text: `Not added: the marketplace.json of ${NEW_DIR} could not be read: its name "New? Market" is not a lowercase marketplace name` })).toBeDefined()
      expect(w.calls).toEqual([])
      // A press while the list is read is refused before anything is read.
      w.hold = deferred()
      const listHold = w.hold
      await ui.press({ key: 'mm-refresh' })
      await ui.press({ key: 'mm-add-marketplace' })
      await idle(w)
      expect(w.toasts).toEqual([REFUSED_WHILE_READING])
      listHold.resolve()
      await idle(w)
      // A second press while the folder's marketplace.json is read is refused, and one question is asked.
      w.files[NEW_CATALOG] = NEW_CATALOG_TEXT
      w.toasts = []
      const gate = deferred()
      w.readHold = { path: NEW_CATALOG, gate }
      await ui.press({ key: 'mm-add-marketplace' })
      await ui.press({ key: 'mm-add-marketplace' })
      await idle(w)
      expect(w.toasts).toEqual([CHECKING_NEW])
      gate.resolve()
      await idle(w)
      expect(w.asked).toEqual([QUESTION_ADD_NEW])
      expect(actions(w)).toEqual([])
      await ui.unmount()
    }
  })

  test('a Refresh pressed while the add question is open keeps its claim: the yes then adds nothing, and a toast says why', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.marketplaces = MARKETPLACES
      w.files = { ...CATALOG_FILES, [NEW_CATALOG]: NEW_CATALOG_TEXT }
      w.answer = 'Add it'
      w.answerHold = deferred()
      const answerHold = w.answerHold
      const ui = await openAndMount($, w, `add-claimed-${surface}-${columns}`, surface, columns)
      w.calls = []
      w.toasts = []
      await typeAndAdd(ui, w, NEW_DIR)
      expect(w.asked.at(-1)).toBe(QUESTION_ADD_NEW)
      // The question is open: Refresh takes the claim, and its read of the list waits.
      const listHold = deferred()
      w.hold = listHold
      await ui.press({ key: 'mm-refresh' })
      answerHold.resolve()
      await idle(w)
      expect(w.toasts).toEqual([REFUSED_WHILE_READING])
      listHold.resolve()
      await idle(w)
      expect(actions(w)).toEqual([])
      await ui.unmount()
    }
  })

  test('a marketplace list that cannot be read stops the check, naming why; one that cannot be read after the add says the add finished, that whether another marketplace changed is not known and that Refresh reads it again, and sends the person to no section', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.marketplaces = MARKETPLACES
      w.files = { ...CATALOG_FILES, [NEW_CATALOG]: NEW_CATALOG_TEXT }
      w.marketFails = false
      w.onAdd = undefined
      w.answer = 'Add it'
      w.asked = []
      const ui = await openAndMount($, w, `add-list-fails-${surface}-${columns}`, surface, columns)
      w.calls = []
      w.marketFails = 'stderr'
      await typeAndAdd(ui, w, NEW_DIR)
      expect(await ui.find({ type: 'Text', text: `Not added: the marketplace list could not be read: ${MARKETPLACES_FAILED}` })).toBeDefined()
      expect(w.asked).toEqual([])
      expect(actions(w)).toEqual([])
      // The list before the add is read; the add makes the read after it fail.
      w.marketFails = false
      w.onAdd = () => {
        w.marketFails = 'stderr'
      }
      await ui.press({ key: 'mm-add-marketplace' })
      await idle(w)
      expect(actions(w)).toEqual([{ argv: ADD_NEW, cwd: undefined }])
      expect(await ui.find({ type: 'Text', text: `Added the marketplace new-market from ${NEW_DIR}. The marketplace list could not be read after the add (${MARKETPLACES_FAILED}), so whether another marketplace changed is not known; press r: Refresh to read it again.` })).toBeDefined()
      // The read of Refresh after the add fails too, so no section of new-market is drawn: this states the premise of the
      // message, and guards nothing, since the code before the fix drew none either. The message sends the person to none.
      expect(await sectionKeys(ui)).not.toContain('mm-sec-new-market')
      expect(await ui.findAll({ type: 'Text', text: /open its section/ })).toHaveLength(0)
      w.marketFails = false
      w.onAdd = undefined
      await ui.unmount()
    }
  })

  test('a marketplace list that cannot be read before the add, after the yes, adds nothing and says why; the claim is released, so a later check asks again and its yes adds', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.marketplaces = MARKETPLACES
      w.files = { ...CATALOG_FILES, [NEW_CATALOG]: NEW_CATALOG_TEXT }
      w.marketFails = false
      w.onAdd = undefined
      w.answer = 'Add it'
      w.answerHold = deferred()
      const hold = w.answerHold
      w.asked = []
      const ui = await openAndMount($, w, `add-before-fails-${surface}-${columns}`, surface, columns)
      w.calls = []
      await typeAndAdd(ui, w, NEW_DIR)
      expect(w.asked).toEqual([QUESTION_ADD_NEW])
      // The question is open: meanwhile the marketplace list can no longer be read.
      w.marketFails = 'stderr'
      hold.resolve()
      await idle(w)
      expect(subcommands(w)).toEqual(['marketplace list', 'marketplace list'])
      expect(actions(w)).toEqual([])
      expect(await ui.find({ type: 'Text', text: `Not added: the marketplace list could not be read before the add: ${MARKETPLACES_FAILED}` })).toBeDefined()
      // The claim was released: the next press checks again and asks, and its yes adds.
      w.marketFails = false
      w.onAdd = () => {
        w.marketplaces = [...MARKETPLACES, NEW_ENTRY]
      }
      await ui.press({ key: 'mm-add-marketplace' })
      await idle(w)
      expect(w.asked).toEqual([QUESTION_ADD_NEW, QUESTION_ADD_NEW])
      expect(actions(w)).toEqual([{ argv: ADD_NEW, cwd: undefined }])
      expect(await ui.find({ type: 'Text', text: ADDED_NEW })).toBeDefined()
      w.onAdd = undefined
      await ui.unmount()
    }
  })

  test('an add whose run rejects, as when claude cannot start or runs past its timeout, names the failure and logs it; the list is still compared, everything is read again, and the claim is released', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.marketplaces = MARKETPLACES
      w.files = { ...CATALOG_FILES, [NEW_CATALOG]: NEW_CATALOG_TEXT }
      w.answer = 'Add it'
      w.asked = []
      // A throw in the fake makes the mod's $.process.run reject, as the engine's does.
      w.onAdd = () => {
        throw new Error('claude did not start in a test')
      }
      const ui = await openAndMount($, w, `add-rejects-${surface}-${columns}`, surface, columns)
      w.calls = []
      w.logs = []
      await typeAndAdd(ui, w, NEW_DIR)
      expect(subcommands(w)).toEqual(['marketplace list', 'marketplace list', 'marketplace add', 'marketplace list', 'list --json', 'marketplace list'])
      expect(await ui.findAll({ type: 'Text', text: /^claude plugin marketplace add failed: .+\.$/ })).toHaveLength(1)
      expect(await ui.findAll({ type: 'Text', text: /open its section/ })).toHaveLength(0)
      const logged = w.logs.filter((log) => log.to === 'debug' && log.text.startsWith('mods-manager: claude plugin marketplace add '))
      expect(logged).toHaveLength(1)
      expect(logged[0]?.text).toMatch(new RegExp(`^mods-manager: claude plugin marketplace add ${NEW_DIR} did not finish: .+`))
      // The claim was released: the next press checks again and asks.
      w.onAdd = undefined
      w.answer = undefined
      await ui.press({ key: 'mm-add-marketplace' })
      await idle(w)
      expect(w.asked).toEqual([QUESTION_ADD_NEW, QUESTION_ADD_NEW])
      await ui.unmount()
    }
  })
})

describe('2l: the arguments of the command', () => {
  test('close whose pane lookup is refused says so in a toast, closes nothing, and throws nothing out of the command', async ($, on) => {
    const w = world(on)
    w.session = 'close-refused'
    await start($, 'terminal')
    w.panesFails = true
    await runCommand($, 'close')
    await idle(w)
    expect(w.closes).toEqual([])
    expect(w.toasts).toHaveLength(1)
    expect(w.toasts[0]).toMatch(/^The open panes could not be listed, so the pane was not closed: ./)
    expect(w.opened).toEqual([])
  })
  test('open, or nothing, opens the pane and changes nothing; close closes the open pane, or toasts that it is not open; check opens it and says the catalogs are local copies; any other argument opens nothing and lists the four forms', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.session = `command-forms-${surface}-${columns}`
      w.opened = []
      w.toasts = []
      w.closes = []
      w.panes = []
      await start($, surface)
      await runCommand($, '  open ')
      await idle(w)
      expect(w.opened).toHaveLength(1)
      expect((w.opened[0] as { id: string }).id).toBe('mod-manager')
      await runCommand($, 'close')
      await idle(w)
      expect(w.toasts).toEqual(['The mods-manager pane is not open.'])
      expect(w.closes).toEqual([])
      w.panes = [{ id: 'mod-manager', title: 'Mods', isShown: true, isFocused: true, isPlaced: true }]
      await runCommand($, 'close')
      await idle(w)
      expect(w.closes).toEqual(['mod-manager'])
      w.calls = []
      await runCommand($, 'check')
      await idle(w)
      expect(w.opened).toHaveLength(2)
      expect(subcommands(w)).toEqual(['list --json', 'marketplace list'])
      const ui = await $.ui.mount(pane(surface, columns))
      expect(await ui.find({ type: 'Text', text: CHECK_LINE })).toBeDefined()
      await ui.unmount()
      w.toasts = []
      for (const args of ['disable zzz-tool@market-a user', 'add /a b', 'add', 'OPEN', 'add /a\u0007b', "add ''"]) await runCommand($, args)
      await idle(w)
      expect(w.opened).toHaveLength(2)
      expect(w.toasts).toEqual([
        `${FORMS} "disable zzz-tool@market-a user" is none of them.`,
        `${FORMS} A source with a space must be in single or double quotes.`,
        `${FORMS} "add" is none of them.`,
        `${FORMS} "OPEN" is none of them.`,
        `${FORMS} The source holds a control character.`,
        `${FORMS} The source is empty.`,
      ])
      expect(actions(w)).toEqual([])
    }
  })

  test("add <source> from the person's Enter opens the pane with the source in the add field and asks, adding nothing without the yes; from any other origin it shows the check and asks nothing until a: Add marketplace is pressed", async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.files = { ...CATALOG_FILES, [NEW_CATALOG]: NEW_CATALOG_TEXT }
      w.asked = []
      w.session = `add-composer-${surface}-${columns}`
      await start($, surface)
      await runCommand($, `add '${NEW_DIR}'`)
      await idle(w)
      let ui = await $.ui.mount(pane(surface, columns))
      expect((await ui.find({ key: 'mm-add' }))?.props.value).toBe(NEW_DIR)
      expect(w.asked).toEqual([QUESTION_ADD_NEW])
      expect(actions(w)).toEqual([])
      await ui.unmount()
      w.asked = []
      w.session = `add-plugin-${surface}-${columns}`
      await start($, surface)
      await runCommand($, `add "${NEW_DIR}"`, { kind: 'plugin', name: 'some-plugin' })
      await idle(w)
      ui = await $.ui.mount(pane(surface, columns))
      expect((await ui.find({ key: 'mm-add' }))?.props.value).toBe(NEW_DIR)
      expect(await ui.find({ type: 'Text', text: CHECKED_NEW })).toBeDefined()
      expect(w.asked).toEqual([])
      await ui.press({ key: 'mm-add-marketplace' })
      await idle(w)
      expect(w.asked).toEqual([QUESTION_ADD_NEW])
      expect(actions(w)).toEqual([])
      await ui.unmount()
    }
  })

  // The mobile app draws no Input (types, Elements.mobile), so there the pane draws the source the add form set as text
  // beside a: Add marketplace (pane.ts). Measured with the kit of Claude Code 2.1.318 that ran these tests (claude --version;
  // the generated types were written by 2.1.317): its $.ui.resolve still hands this pane an
  // Input when it is mounted on surface mobile, so the drawing without the field is not reached here. What the kit can
  // check is that the question is asked, with the check shown, and that the button is drawn; the session state itself is
  // the copy of the module the kit loaded, which this test file does not share.
  test('on surface mobile, add <source> shows the check, draws a: Add marketplace, and asks', async ($, on) => {
    const w = withCatalogs(world(on))
    w.files = { ...CATALOG_FILES, [NEW_CATALOG]: NEW_CATALOG_TEXT }
    w.session = 'add-mobile'
    await $.session.start({ surface: 'mobile', isInteractive: true, cwd: ROOT })
    await runCommand($, `add ${NEW_DIR}`)
    await idle(w)
    const ui = await $.ui.mount({ ...pane('terminal', 80), surface: 'mobile' })
    expect(await ui.find({ type: 'Text', text: CHECKED_NEW })).toBeDefined()
    expect(await ui.find({ key: 'mm-add-marketplace' })).toBeDefined()
    expect(w.asked).toEqual([QUESTION_ADD_NEW])
    expect(actions(w)).toEqual([])
    await ui.unmount()
  })
})

describe('the 2j and 2l rules', () => {
  test('classifyAddSource: a path that starts with / is a local folder (a marketplace.json path names the folder two levels up, trailing slashes go); a source of the install skill is remote; a relative path, ~, empty text, a control character or anything else is refused', () => {
    expect(classifyAddSource(' /work/m/ ')).toEqual({ kind: 'local', folder: '/work/m' })
    expect(classifyAddSource('/work/m/.claude-plugin/marketplace.json')).toEqual({ kind: 'local', folder: '/work/m' })
    expect(classifyAddSource('/')).toEqual({ kind: 'local', folder: '/' })
    for (const remote of ['org/repo', 'org/repo#v1.2', 'https://example.invalid/org/repo.git', 'https://example.invalid:8443/a%20b/~x/marketplace.json#main', 'git@example.invalid:org/repo.git'])
      expect(classifyAddSource(remote)).toEqual({ kind: 'remote', source: remote })
    // Each relative path gets the absolute-path reason, so a relative path refused only as "anything else" shows.
    for (const relative of ['./m', '../m', '~/m', '~', '.', '..'])
      expect(classifyAddSource(relative)).toEqual({ kind: 'refused', reason: `"${relative}" is not an absolute path: give the folder's whole path, starting with /; ~ is not expanded.` })
    expect(classifyAddSource('  ')).toEqual({ kind: 'refused', reason: 'Type the folder of a marketplace, starting with /, or a GitHub owner/repo or a URL, then press a: Add marketplace.' })
    expect(classifyAddSource('/work/m\u001b[2J')).toEqual({ kind: 'refused', reason: '"/work/m?[2J" holds a control character, so it is not added.' })
    for (const other of ['market', '-org/repo', 'http://example.invalid/m', 'org/repo$x', 'org/re"po', "org/re'po", 'org/re`po', 'org/re!po', 'C:\\work\\m', 'org/re po'])
      expect(classifyAddSource(other)).toEqual({ kind: 'refused', reason: `"${other}" is not a folder starting with /, a GitHub owner/repo, an https:// URL or a git@host:path URL, so it is not added.` })
  })

  test('marketplaceNameOf takes the top-level name a section may carry, and throws for one that is missing, not text, refused (through printable), or text that is not JSON', () => {
    expect(marketplaceNameOf(NEW_CATALOG_TEXT)).toBe('new-market')
    expect(() => marketplaceNameOf('{"plugins": []}')).toThrow('it has no top-level "name"')
    expect(() => marketplaceNameOf('{"name": 7}')).toThrow('its top-level "name" is not text')
    expect(() => marketplaceNameOf(JSON.stringify({ name: 'Bad\u0007 Name' }))).toThrow('its name "Bad? Name" is not a lowercase marketplace name')
    expect(() => marketplaceNameOf('["new-market"]')).toThrow('it has no top-level "name"')
    expect(() => marketplaceNameOf('{ not json')).toThrow()
  })

  test('addDecision: the same name from the same folder is already added, with trailing slashes dropped on both sides; the same name from another source is taken; the same folder under another name is renamed; anything else is free; sourceText names each kind', () => {
    const dir = (name: string, path: string) => ({ name, installLocation: path, source: { kind: 'directory', path } })
    expect(addDecision('m', '/a/b/', [dir('m', '/a/b')])).toEqual({ kind: 'already' })
    expect(addDecision('m', '/a/b', [dir('m', '/a/b//')])).toEqual({ kind: 'already' })
    expect(addDecision('m', '/a/b', [dir('m', '/a/c')])).toEqual({ kind: 'taken', other: 'directory /a/c' })
    expect(addDecision('m', '/a/b', [{ name: 'm', installLocation: undefined, source: { kind: 'github', repo: 'org/m' } }])).toEqual({ kind: 'taken', other: 'github org/m' })
    expect(addDecision('m', '/a/b', [{ name: 'm', installLocation: undefined, source: undefined }])).toEqual({ kind: 'taken', other: 'a source the marketplace list does not name' })
    expect(addDecision('m', '/a/b', [dir('other', '/a/b/')])).toEqual({ kind: 'renamed', other: 'other' })
    expect(addDecision('m', '/a/b', [dir('other', '/a/c'), { name: 'x', installLocation: undefined, source: { kind: 'github', repo: '/a/b' } }])).toEqual({ kind: 'free' })
    expect(sourceText({ kind: 'git', url: 'https://example.invalid/m.git' })).toBe('git https://example.invalid/m.git')
    expect(sourceText({ kind: 'claudeai' })).toBe('a claudeai source')
    expect(sourceText({ kind: 'directory', path: '/a\u0007b' })).toBe('directory /a?b')
  })

  test('changedSources names each marketplace of the list before whose source differs after, through printable; one unchanged (trailing slashes aside), one new, and one gone are not named', () => {
    const before = parseMarketplaces(JSON.stringify([...MARKETPLACES, { name: 'gone', source: 'github', repo: 'org/gone' }]))
    const after = parseMarketplaces(JSON.stringify([...MARKETPLACES.map((entry) => (entry.name === 'market-b' ? { ...entry, path: '/src/market-b/' } : entry.name === 'market-a' ? { ...entry, repo: 'evil/market\u0007-a' } : entry)), NEW_ENTRY]))
    expect(changedSources(before, after)).toEqual([{ name: 'market-a', was: 'github org/market-a', now: 'github evil/market?-a' }])
    expect(changedLine({ name: 'market\u0007-a', was: 'github org/market-a', now: 'github evil/x' })).toBe('The marketplace market?-a now comes from github evil/x, not github org/market-a; the pane did not change it back.')
  })

  test('renamedSinceText names the folder, the name the question showed and the name read again, each through printable', () => {
    expect(renamedSinceText('new-market', 'market-b', NEW_DIR)).toBe(RENAMED_NEW)
    expect(renamedSinceText('new-market', 'mark\u0007et', '/work/n\u0007m')).toBe('Not added: the marketplace.json of /work/n?m now names mark?et, not new-market as the question said, so nothing was run; press a: Add marketplace to check it again.')
  })

  test('addArgv is claude plugin marketplace add <folder>, refusing a folder that does not start with /; addQuestion shows it; installRequest names the namespaced install skill and refuses a source that is not remote; addFailedText keeps the first line, cut, through printable', () => {
    expect(addArgv(CLAUDE, NEW_DIR)).toEqual(ADD_NEW)
    for (const bad of ['-y', 'work/m', '']) expect(() => addArgv(CLAUDE, bad)).toThrow('is not an absolute folder')
    expect(addQuestion('new-market', NEW_DIR)).toBe(QUESTION_ADD_NEW)
    expect(installRequest(REMOTE)).toBe(REMOTE_REQUEST)
    for (const bad of ['/work/m', '-org/repo', 'org/repo x', 'org/repo$x']) expect(() => installRequest(bad)).toThrow('is not a remote marketplace source')
    expect(isRemoteSource('-org/repo')).toBe(false)
    expect(addFailedText(`\n  first\u0007 line\nsecond`)).toBe('claude plugin marketplace add failed: first? line.')
    expect(addFailedText('x'.repeat(100))).toBe(`claude plugin marketplace add failed: ${'x'.repeat(79)}….`)
  })

  test('parseCommandArgs: nothing or open, close and check; add <source> bare, or in single or double quotes to hold spaces; a space outside quotes, a control character, an empty source, or anything else is refused naming the four forms', () => {
    for (const open of ['', '  ', 'open', ' open ']) expect(parseCommandArgs(open)).toEqual({ kind: 'open' })
    expect(parseCommandArgs('close')).toEqual({ kind: 'close' })
    expect(parseCommandArgs(' check ')).toEqual({ kind: 'check' })
    expect(parseCommandArgs('add /a/b')).toEqual({ kind: 'add', source: '/a/b' })
    expect(parseCommandArgs("add  '/a b/c'")).toEqual({ kind: 'add', source: '/a b/c' })
    expect(parseCommandArgs('add "/a b\'s"')).toEqual({ kind: 'add', source: "/a b's" })
    expect(parseCommandArgs('add org/repo#v1')).toEqual({ kind: 'add', source: 'org/repo#v1' })
    expect(parseCommandArgs('add /a b')).toEqual({ kind: 'refused', reason: `${FORMS} A source with a space must be in single or double quotes.` })
    expect(parseCommandArgs("add '/a b")).toEqual({ kind: 'refused', reason: `${FORMS} A source with a space must be in single or double quotes.` })
    expect(parseCommandArgs('add "/a\nb"')).toEqual({ kind: 'refused', reason: `${FORMS} The source holds a control character.` })
    expect(parseCommandArgs('add ""')).toEqual({ kind: 'refused', reason: `${FORMS} The source is empty.` })
    for (const other of ['add', 'Open', 'close now', 'checks', 'add\t/a', 'remove x']) expect(parseCommandArgs(other)).toMatchObject({ kind: 'refused' })
    expect(parseCommandArgs('close now')).toEqual({ kind: 'refused', reason: `${FORMS} "close now" is none of them.` })
  })
})

// 2f Install (TRDD-R2QYIN8O; owner question 4, "Add Install button"): the Install button of a plugin no scope has installed.
const INSTALL_BBB = [CLAUDE, 'plugin', 'install', 'bbb-new@market-a', '--scope', 'user', '--json']
const QUESTION_INSTALL_BBB =
  'Install bbb-new from market-a (user scope)? This runs ["claude","plugin","install","bbb-new@market-a","--scope","user","--json"], with no shell and no -y. ' +
  'It loads in your next session. If its marketplace declares a command that runs at the install, that command is not run: the pane shows it with its sha256. ' +
  'A plugin runs its hooks and servers with your permissions from your next session on: install only one you trust.'
const BBB_INSTALLED = 'bbb-new installed. It loads in your next session.'
const SHA = 'ff52cc80429e7890ab0145255c512c846b15084c9bdc96920dec11daad01611a'
// The declared command carries a control character, so a test shows that the pane draws it as ? (printable, 2f review).
const DECLARED = 'touch /tmp/x/markers/ran; echo /tmp/x/plugin\u0007'
const DECLARED_SHOWN = 'touch /tmp/x/markers/ran; echo /tmp/x/plugin?'
const REFUSED_MESSAGE = 'bbb-new@market-a is installed by running a command on this machine that has not been reviewed yet, so it was not run.'
/** A refused install in the shape measured on Claude Code 2.1.318, from a shell inside a session: the displayed command, then the result line. */
const shownResult = (pluginId: string, sha256: string): { exitCode: number; stdout: string } => ({
  exitCode: 1,
  stdout: `"bbb-new" is installed by running a command from marketplace "market-a" on this machine:\n  ${DECLARED}\n${JSON.stringify({
    command: 'install',
    outcome: 'failed',
    plugin: 'bbb-new@market-a',
    scope: 'user',
    message: REFUSED_MESSAGE,
    failureCode: 'command_source_refused',
    shownCommand: { kind: 'command_source', pluginId, command: DECLARED, mode: 'copy', catalogRevision: 'sha256:00', sha256 },
  })}`,
})
const ACCEPT_BBB = `claude plugin install bbb-new@market-a --scope user --accept-command ${SHA}`
const SHOWN_BBB =
  `The marketplace of bbb-new@market-a declares a command that runs for it, and it was not run: ${DECLARED_SHOWN} (sha256 ${SHA}). ` +
  `The pane does not accept it: Claude Code ignored -y and --accept-command when they were tried from a shell inside a session. To accept exactly this command, run in your own terminal, outside Claude Code: ${ACCEPT_BBB} ` +
  "Or accept it from the plugin's details pane in /plugin."
const COPY_QUESTION_BBB = `${SHOWN_BBB} Once accepted, a command source runs again at each update and once per session. Copy that line to your clipboard?`
const COPIED_ACCEPT_BBB = `Copied. Run it in your own terminal, outside Claude Code: ${ACCEPT_BBB}`
/** The install runs of the world, in order. */
const installs = (w: World) => w.calls.filter((call) => call.argv[2] === 'install')
/** Every -y or --accept-command any claude call of the world carried: the pane passes neither, ever. */
const acceptFlags = (w: World): string[] => w.calls.flatMap((call) => call.argv).filter((arg) => arg === '-y' || arg === '--yes' || arg === '--accept-command')

/** Opens the pane with NEW_ENTRIES in market-a's catalog and opens market-a's section, so bbb-new draws Install. */
async function openWithAvailable($: any, w: World, session: string, surface: (typeof SURFACES)[number], columns: number): Promise<Mounted<'terminal' | 'desktop'>> {
  w.files = { ...CATALOG_FILES, [CATALOG_A]: catalogA('10.0.0', NEW_ENTRIES) }
  const ui = await openAndMount($, w, session, surface, columns)
  await ui.press({ key: 'mm-sec-market-a' })
  await idle(w)
  return ui
}

/** Presses Install on bbb-new with these answers to the questions it raises, in order, and lets every timer run. */
async function pressInstall(ui: Mounted<'terminal' | 'desktop'>, w: World, answers: string[]): Promise<void> {
  w.answerQueue = [...answers]
  w.asked = []
  w.calls = []
  w.copies = []
  w.toasts = []
  await ui.press({ key: `mm-install-${BBB}` })
  await idle(w)
  // A label a refused press left unused never answers a later question of the same test (2f review).
  w.answerQueue = []
}

describe('2f Install: a plugin not installed, installed from the pane', () => {
  test('Install asks one question that shows the exact command; any answer but Install it, or none, runs nothing; Install it runs that command once, with no shell, no -y and no folder, says so, asks for a new session and reads the list again', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      const ui = await openWithAvailable($, w, `install-${surface}-${columns}`, surface, columns)
      // KEEP, then no answer at all (the question denied): neither runs anything.
      for (const answers of [[KEEP], []]) {
        await pressInstall(ui, w, answers)
        expect(w.asked).toEqual([QUESTION_INSTALL_BBB])
        expect(w.calls).toEqual([])
      }
      await pressInstall(ui, w, [INSTALL_LABEL])
      expect(w.asked).toEqual([QUESTION_INSTALL_BBB])
      expect(installs(w)).toEqual([{ argv: INSTALL_BBB, cwd: undefined }])
      expect(w.toasts).toEqual([BBB_INSTALLED])
      expect(await ui.find({ type: 'Text', text: NEXT_SESSION })).toBeDefined()
      // The claim passed straight to the read of the list, which ran after the install.
      expect(subcommands(w).slice(0, 2)).toEqual(['install bbb-new@market-a', 'list --json'])
      expect(acceptFlags(w)).toEqual([])
      await ui.unmount()
    }
  })

  test('a command its marketplace declares is not run: the pane shows it with its sha256 and the line that accepts it, asks before copying that line to the clipboard of the surface pressed, runs no second install and asks for no new session', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      const ui = await openWithAvailable($, w, `install-shown-${surface}-${columns}`, surface, columns)
      w.installResults = { 'bbb-new@market-a': shownResult('bbb-new@market-a', SHA) }
      // The copy declined: nothing is copied, and the message still shows the command, its sha256 and the line.
      await pressInstall(ui, w, [INSTALL_LABEL, KEEP])
      expect(w.asked).toEqual([QUESTION_INSTALL_BBB, COPY_QUESTION_BBB])
      expect(installs(w)).toEqual([{ argv: INSTALL_BBB, cwd: undefined }])
      expect(w.copies).toEqual([])
      expect(w.toasts).toEqual([])
      expect(await ui.find({ type: 'Text', text: SHOWN_BBB })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: NEXT_SESSION })).toBeUndefined()
      // The copy accepted: the line goes to the clipboard of the surface pressed, and a toast says so.
      await pressInstall(ui, w, [INSTALL_LABEL, COPY_LINE_LABEL])
      expect(w.copies).toEqual([{ text: ACCEPT_BBB, surface }])
      expect(w.toasts).toEqual([COPIED_ACCEPT_BBB])
      expect(installs(w)).toHaveLength(1)
      // A copy that fails names the line in the pane.
      w.copyResult = { isCopied: false, reason: 'no-clipboard' }
      await pressInstall(ui, w, [INSTALL_LABEL, COPY_LINE_LABEL])
      expect(await ui.find({ type: 'Text', text: `The line could not be copied (no-clipboard): ${ACCEPT_BBB}` })).toBeDefined()
      w.copyResult = { isCopied: true }
      expect(acceptFlags(w)).toEqual([])
      // The claim was released: Refresh reads the list again.
      w.calls = []
      await ui.press({ key: 'mm-refresh' })
      await idle(w)
      expect(subcommands(w)).toContain('list --json')
      w.installResults = {}
      await ui.unmount()
    }
  })

  test('a failed install names why in the pane and offers no line: a command shown for another plugin, a shown command it cannot read, a failure claude reports, and a run with no result line; a run with a result line reads the list again', async ($, on) => {
    const w = withCatalogs(world(on))
    const failed = JSON.stringify({ command: 'install', outcome: 'failed', plugin: 'bbb-new@market-a', scope: 'user', message: 'Plugin "bbb-new" not found in marketplace "market-a".', failureCode: 'not_found' })
    // Each case: claude's answer, the pane's message, and whether the list is read again (only a run with a result line).
    const cases: Array<[{ exitCode: number; stdout: string; stderr?: string }, string, boolean]> = [
      [
        shownResult('other-tool@market-a', SHA),
        `install bbb-new failed: ${REFUSED_MESSAGE} claude showed a command declared for other-tool@market-a, another plugin: ${DECLARED_SHOWN} (sha256 ${SHA}). ` +
          'It was not run, and the pane offers no line for it: run claude plugin install bbb-new@market-a in your own terminal to review it.',
        true,
      ],
      [
        shownResult('bbb-new@market-a', 'not-a-sha'),
        `${REFUSED_MESSAGE} The command its marketplace declares could not be read here, so it was not shown: run claude plugin install bbb-new@market-a in your own terminal to see it.`,
        true,
      ],
      [{ exitCode: 1, stdout: failed }, 'install bbb-new failed: Plugin "bbb-new" not found in marketplace "market-a".', true],
      [{ exitCode: 1, stdout: 'Installing…', stderr: 'first\nthe last words\u0007' }, 'install bbb-new failed: the last words?', false],
    ]
    for (const { surface, columns } of PLACES) {
      const ui = await openWithAvailable($, w, `install-failed-${surface}-${columns}`, surface, columns)
      for (const [result, message, readsList] of cases) {
        w.installResults = { 'bbb-new@market-a': result }
        await pressInstall(ui, w, [INSTALL_LABEL, COPY_LINE_LABEL])
        expect(w.asked).toEqual([QUESTION_INSTALL_BBB])
        expect(await ui.find({ type: 'Text', text: message })).toBeDefined()
        expect(w.copies).toEqual([])
        expect(await ui.find({ type: 'Text', text: NEXT_SESSION })).toBeUndefined()
        expect(installs(w)).toEqual([{ argv: INSTALL_BBB, cwd: undefined }])
        expect(subcommands(w).includes('list --json')).toBe(readsList)
      }
      w.installResults = {}
      await ui.unmount()
    }
  })

  test('Install pressed while a change runs, or again while its own install runs, is refused with a toast before any question, and runs nothing; a yes given after Refresh took the claim runs nothing either', async ($, on) => {
    // Not while Refresh reads the list: Refresh clears the catalog listings (refresh, state.ts), so no Install is drawn then.
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      const ui = await openWithAvailable($, w, `install-busy-${surface}-${columns}`, surface, columns)
      // A disable holds the claim: its claude call waits until the test lets it finish.
      const change = deferred()
      w.hold = change
      w.answer = 'Turn it off'
      await ui.press({ key: 'mm-toggle-zzz-tool@market-a|user' })
      await idle(w)
      w.answer = undefined
      await pressInstall(ui, w, [INSTALL_LABEL])
      expect(w.toasts).toEqual([REFUSED_WHILE_DISABLING])
      expect(w.asked).toEqual([])
      expect(w.calls).toEqual([])
      change.resolve()
      await idle(w)
      // The install holds the claim from its yes to its end: a second Install pressed meanwhile asks nothing and runs nothing.
      const install = deferred()
      w.hold = install
      await pressInstall(ui, w, [INSTALL_LABEL])
      expect(installs(w)).toEqual([{ argv: INSTALL_BBB, cwd: undefined }])
      w.asked = []
      await ui.press({ key: `mm-install-${BBB}` })
      await idle(w)
      expect(w.toasts).toEqual(['Wait: installing bbb-new… is still running. Nothing was changed.'])
      expect(w.asked).toEqual([])
      expect(installs(w)).toHaveLength(1)
      install.resolve()
      await idle(w)
      expect(w.toasts.at(-1)).toBe(BBB_INSTALLED)
      // A yes given after Refresh took the claim while the question was open runs nothing, and a toast says why (2f review).
      const answer = deferred()
      w.answerHold = answer
      w.answerQueue = [INSTALL_LABEL]
      w.calls = []
      w.toasts = []
      await ui.press({ key: `mm-install-${BBB}` })
      const list = deferred()
      w.hold = list
      await ui.press({ key: 'mm-refresh' })
      answer.resolve()
      await idle(w)
      expect(w.toasts).toEqual([REFUSED_WHILE_READING])
      expect(installs(w)).toEqual([])
      list.resolve()
      await idle(w)
      await ui.unmount()
    }
  })
})

describe('the 2f Install rules', () => {
  test('installArgv: the id is checked, the scope is user, the result is --json, and there is never a -y', () => {
    expect(installArgv('claude', 'bbb-new@market-a')).toEqual(['claude', 'plugin', 'install', 'bbb-new@market-a', '--scope', 'user', '--json'])
    for (const id of ['-y@market-a', 'Bad@market-a', 'bbb-new', 'a b@market-a', '../x@market-a']) expect(() => installArgv('claude', id)).toThrow('refused')
  })

  test('parseCliResult reads the last line of stdout; ok needs outcome ok and exit 0; a line that is not a result throws; a shownCommand of another shape is named, never kept', () => {
    const ok = JSON.stringify({ command: 'update', outcome: 'ok', message: 'updated', updateOutcome: 'updated', oldVersion: '1.0.0', newVersion: '1.0.1' })
    expect(parseCliResult(`human text\n${ok}\n`, 0)).toEqual({ ok: true, message: 'updated', failureCode: undefined, shown: undefined, shownUnreadable: false, updateOutcome: 'updated', oldVersion: '1.0.0', newVersion: '1.0.1' })
    expect(parseCliResult(ok, 1).ok).toBe(false)
    expect(parseCliResult(JSON.stringify({ outcome: 'failed', message: 'no' }), 0).ok).toBe(false)
    for (const text of ['', 'not json', '[1]', 'null', JSON.stringify({ outcome: 'maybe', message: 'x' }), JSON.stringify({ outcome: 'ok' })]) expect(() => parseCliResult(text, 0)).toThrow()
    const shown = (fields: Record<string, unknown>) => parseCliResult(JSON.stringify({ outcome: 'failed', message: 'm', shownCommand: fields }), 1)
    expect(shown({ pluginId: 'bbb-new@market-a', command: 'c', sha256: SHA })).toMatchObject({ shown: { pluginId: 'bbb-new@market-a', command: 'c', sha256: SHA }, shownUnreadable: false })
    for (const bad of [
      { pluginId: 'bbb-new@market-a', command: 'c', sha256: SHA.toUpperCase() },
      { pluginId: 'bbb-new@market-a', command: 'c', sha256: `${SHA}0` },
      { pluginId: 'Bbb@market-a', command: 'c', sha256: SHA },
      { pluginId: 'bbb-new@market-a', command: 7, sha256: SHA },
      { command: 'c', sha256: SHA },
    ])
      expect(shown(bad)).toMatchObject({ shown: undefined, shownUnreadable: true })
  })

  test('acceptLine names the verb, the id, the scope and the sha256, and refuses any part it cannot write bare', () => {
    expect(acceptLine('install', 'bbb-new@market-a', 'user', SHA)).toBe(ACCEPT_BBB)
    expect(acceptLine('update', 'ddd-local@market-a', 'local', SHA)).toBe(`claude plugin update ddd-local@market-a --scope local --accept-command ${SHA}`)
    expect(() => acceptLine('install', '-y@market-a', 'user', SHA)).toThrow('refused')
    expect(() => acceptLine('install', 'bbb-new@market-a', 'session', SHA)).toThrow('refused')
    expect(() => acceptLine('install', 'bbb-new@market-a', 'user', 'abc; rm -rf ~')).toThrow('refused')
  })
})

// Increment 2k of TRDD-R2QYIN8O, auto-update (owner question 10, "Auto-update allowed"): the switch, the opt-ins, the
// hourly check the session start sets, its records and pauses, Review, and the rules under them. The check runs from the
// timer register.ts sets two minutes after the session starts, so a test moves the mock clock to it, then past the wait of
// its lease (AUTO_SETTLE_MS), instead of waiting.
const ZZZ_KEY = 'zzz-tool@market-a|user'
// A local install's key adds its folder (optInKey), so an opt-in made for one project never covers another.
const DDD_KEY = 'ddd-local@market-a|local|/work/app'
// An opt-in keeps the source its marketplace had (logic.ts sourceKey), market-a's here, so a marketplace added again from
// another source does not inherit it.
const A_SOURCE = '["github",null,"org/market-a",null]'
// An automatic update runs the argv of a pressed Update, with --json, so its result is read from its fields (results.ts).
const AUTO_ZZZ = [...UPDATE_ZZZ, '--json']
const AUTO_DDD = [...UPDATE_DDD, '--json']
// The clock starts at 1 000; the first check takes its lease AUTO_START_MS later and updates after the lease's wait.
const FIRST_LEASE_AT = 1_000 + AUTO_START_MS
const FIRST_CHECK_AT = '1970-01-01T00:02:03.000Z'
const ACCEPT_ZZZ = `claude plugin update zzz-tool@market-a --scope user --accept-command ${SHA}`
const ZZZ_SHOWN = { pluginId: 'zzz-tool@market-a', command: DECLARED, sha256: SHA }
const ZZZ_SHOWN_REASON = `its marketplace declares a command that is new or changed: ${DECLARED} (sha256 ${SHA}). It was not run.`
// The same reason as the pane, the toasts and the transcript draw it, through printable.
const ZZZ_SHOWN_DRAWN = `its marketplace declares a command that is new or changed: ${DECLARED_SHOWN} (sha256 ${SHA}). It was not run.`
const REVIEW_ZZZ =
  `Auto-update of zzz-tool (user scope) is paused: ${ZZZ_SHOWN_DRAWN} To accept exactly this command, run in your own terminal, outside Claude Code: ${ACCEPT_ZZZ} ` +
  "Or accept it from the plugin's details pane in /plugin. Resume lets the next hourly check try it again; if the reason above still holds, it pauses again."
const OPT_IN_ZZZ =
  "Update zzz-tool (user scope) automatically? While auto-update is on, each newer version its marketplace's local copy lists is installed with no question " +
  "when its row offers Update, and a toast, a transcript line and the pane's list of recent automatic updates name it. Each update runs " +
  '["claude","plugin","update","zzz-tool@market-a","--scope","user","--json"], with no shell and no -y. A plugin whose latest version is ' +
  'unknown, or whose update needs your own terminal, is never updated automatically. If its catalog entry declares a command (a command source or a ' +
  'headers helper), or its marketplace is added again from another source, it pauses before claude runs. If claude still shows a command for an ' +
  'update, it is not run (measured from a shell on 2.1.318), and the update pauses until you review it here. A dependency built by a command is not ' +
  'installed: the plugin then reports it missing, and pauses. A failed update pauses it too. The opt-in stays if you uninstall the plugin, and covers it again if you ' +
  'reinstall it from the same marketplace source. Auto-update is off: nothing runs until you turn it on.'
const NO_SOURCE_ZZZ =
  "zzz-tool (user scope) was not opted in: claude's marketplace list does not name its marketplace market-a, so the source of its marketplace cannot be kept with the opt-in."
const NO_TERMINAL_ZZZ =
  'zzz-tool (user scope) was not opted in: this session has no terminal to run claude in; opt it in from a terminal session, so the source of its ' +
  'marketplace cannot be kept with the opt-in.'
// The pane's own check pauses these two before claude is called (auto-update.ts blockReason).
const DECLARES_REASON =
  'its catalog entry declares a command claude would run for it (a command source or a headers helper), and an automatic update never runs one. ' +
  'Update it in your own terminal, or opt it out to stop these pauses.'
const SOURCE_REASON =
  'its marketplace market-a now comes from another source than when you opted it in, so the opt-in does not cover it. Opt it out and in again to cover the new source.'

/** The update runs of the world, in order. */
const updates = (w: World) => w.calls.filter((call) => call.argv[2] === 'update')
/** The lines the mod sent to the transcript ($.ui.log with no sink, which the kit reports as the transcript), and those it sent to the debug log, in order. */
const transcript = (w: World): string[] => w.logs.filter((log) => log.to === 'transcript').map((log) => log.text)
const debugLines = (w: World): string[] => w.logs.filter((log) => log.to === 'debug').map((log) => log.text)

/**
 * Empties the store, then sets the switch, when given, and the opted-in keys, each with market-a's source, signed as the
 * plugin signs them (TRDD-5IK59SQ2, A1).
 */
async function autoStore(w: World, on: boolean | undefined, optIns: string[]): Promise<void> {
  w.store.clear()
  if (on !== undefined) w.store.set(keyFor(AUTO_UPDATE), await signed(AUTO_UPDATE, on, 500))
  w.store.set(AUTO_OPT_INS_KEY, await envelopeOf(AUTO_OPT_INS_KEY, Object.fromEntries(optIns.map((key) => [key, A_SOURCE])), 500))
}

/** What a signed key holds (A1), after checking it carries this plugin's signature; undefined when nothing is stored. */
async function storedValue(w: World, key: string): Promise<unknown> {
  const stored = w.store.get(key) as { v: unknown; at: number } | undefined
  if (stored === undefined) return undefined
  expect(stored).toEqual(await envelopeOf(key, stored.v, stored.at))
  return stored.v
}

/**
 * Whether a key holds a signed value (A1, TRDD-5IK59SQ2): a switch of the registry, the opt-ins or the pauses.
 */
const isSignedKey = (key: string): boolean => key.startsWith('switch.') || key === AUTO_OPT_INS_KEY || key === AUTO_PAUSES_KEY

/**
 * The switches of the pane's functions (C6b), whose reads leave idle's mark as it was (world()'s store.get). The pane reads
 * them at every drawing and every press, and they nearly always hold nothing, which is checked with no digest (isSigned
 * answers false for a missing value): set by them, the mark would wait on a digest that never comes, so every drawing would
 * end in idle's give-up; cleared by them, a drawing's reads landing while a real signed read's digest runs would wipe that
 * read's mark, and idle would return before its flow ended (full kit, 37c09d6). A test that stores one waits on the act its
 * gate leads to (the toast) where it presses, not through idle.
 */
const PANE_FUNCTION_KEYS: ReadonlySet<string> = new Set(MOD_MANAGER_FUNCTIONS.map((def) => keyFor(def.id)))

/** What the world records besides the store: claude and other process calls, file reads, log lines, toasts, questions, copies. */
const otherProgress = (w: World): number => w.calls.length + w.reads.length + w.logs.length + w.toasts.length + w.asked.length + w.copies.length

/**
 * Settles until the mod has nothing left to do without the clock moving. A read of a signed key is followed by its
 * signature check, a SHA-256 digest that a settle does not wait for: one settle was measured enough for a signed write at
 * a host load of 23 and too few at 85. So a look is idle only when it added nothing the world records and no signed read
 * is still waiting on its digest. Every such read is followed by another store call or a recorded act: a check and a press
 * end with the pane's read of the auto-update view, whose last read is the records key, which is not signed. A drawing's
 * reads of the pane's own switches (C6b) may come after it and leave the mark as it was. Running out of looks fails the
 * test, with a message that names the case when a signed read is the last thing the world saw.
 *
 * The wait after a signed read is not cut short by a count: measured at a host load near 5, the looks between such a read
 * and the next store call or act ranged from 1 to 140 within one run of this file (TRDD-5IK59SQ2), so no count bounds it
 * under load. A flow that reads a switch and returns with nothing recorded (a function that is off) is awaited where it
 * runs (the start, the press), not through idle.
 */
async function idle(w: World): Promise<void> {
  let seen = -1
  for (let look = 0; look < 2000; look++) {
    await w.clock.settle()
    const done = w.storeOps.length + otherProgress(w)
    if (done === seen && w.signedReadAt !== otherProgress(w)) return
    seen = done
  }
  throw new Error(idleTimeoutText(w.signedReadAt === otherProgress(w)))
}

/** Why idle gave up: a signed read with nothing after it is named, since a flow that reads a switch off and returns ends so. */
function idleTimeoutText(lastWasSignedRead: boolean): string {
  return lastWasSignedRead
    ? 'timed out waiting for the mod to finish what it started: the last thing the world saw is a signed read with nothing after it, as a flow that reads a switch off and returns leaves it; await that flow where it runs instead of idle'
    : 'timed out waiting for the mod to finish what it started'
}

/**
 * Moves the clock `ms` ahead, to a check, lets the check run to the wait of its lease, then moves past that wait and lets
 * the check run to its end. Each stretch waits on idle, not on a count of settles: a check now reads three signed keys
 * (A1, TRDD-5IK59SQ2) before its lease, each read followed by a digest a settle does not wait for, so one settle left the
 * lease's wait to start after the clock had moved past it, and the check never ended.
 */
async function runCheck(w: World, ms: number): Promise<void> {
  await w.clock.advance(ms)
  await idle(w)
  await w.clock.advance(AUTO_SETTLE_MS)
  await idle(w)
}

/** From the end of one check (runCheck) to the end of the next, an hour after the first began. */
const nextCheck = (w: World): Promise<void> => runCheck(w, AUTO_PERIOD_MS - AUTO_SETTLE_MS)

/** Presses `key` with these answers to the questions it raises, after clearing what the last press recorded. */
async function pressAnswering(ui: Mounted<'terminal' | 'desktop'>, w: World, key: string, answers: string[]): Promise<void> {
  w.answerQueue = [...answers]
  w.asked = []
  w.toasts = []
  w.copies = []
  await ui.press({ key })
  await idle(w)
  w.answerQueue = []
}

const labelOf = async (ui: Mounted<'terminal' | 'desktop'>, key: string): Promise<unknown> => (await ui.find({ key }))?.props.label

/** Mounts the /mods-switches pane on the terminal, as the person opens it. */
async function mountSwitchesPane($: any) {
  return $.ui.mount({
    plugin: 'mods-expert-developer-plugin',
    surface: 'terminal',
    component: 'Pane',
    requestId: 'mods-switches',
    viewport: { columns: 160, rows: 30 },
    props: { title: 'mods-switches', isFocused: true, bodyColumns: 156, placement: 'inline', scroll: { offset: 0, bodyRows: 20 }, view: {} },
  })
}

/**
 * Turns the auto-update switch on through the /mods-switches pane, by a press on its row or by 0 (keep) after an on written
 * outside the plugin, then finds the timer set: the first check reads the opt-ins two minutes on (TRDD-5IK59SQ2, the
 * registry's writers follow the switch: setSwitch and keepShown).
 */
async function switchesPaneSetsTheTimer($: any, w: World, way: 'press' | 'keep'): Promise<void> {
  await autoStore(w, undefined, [])
  // An on written outside the plugin (an envelope whose signature is not the plugin's) is not applied: it waits for the
  // person's review (A1).
  if (way === 'keep') w.store.set(keyFor(AUTO_UPDATE), { v: true, at: 500, sig: 'forged' })
  await start($, 'terminal')
  await idle(w)
  const ui = await mountSwitchesPane($)
  if (way === 'press') {
    await ui.press({ key: 'sw-mod-mods-manager' })
    await ui.press({ key: `sw-${AUTO_UPDATE}` })
  } else await ui.press({ key: 'sw-keep' })
  await idle(w)
  await ui.unmount()
  expect(await storedValue(w, keyFor(AUTO_UPDATE))).toBe(true)
  const mark = w.storeOps.length
  await runCheck(w, AUTO_START_MS)
  expect(w.storeOps.slice(mark).filter((op) => op === `get ${AUTO_OPT_INS_KEY}`)).toHaveLength(1)
}
describe('2k auto-update: the hourly check', () => {
  test('the switch is off by default: no timer is set, so no check reads a setting, updates an opted-in row or writes anything', async ($, on) => {
    const w = withCatalogs(world(on))
    await autoStore(w, undefined, [ZZZ_KEY])
    await start($, 'terminal')
    // TRDD-5IK59SQ2: a function that is off runs nothing, its timer included. A check would begin by reading the opt-ins.
    const mark = w.storeOps.length
    await runCheck(w, AUTO_START_MS)
    await nextCheck(w)
    expect(w.storeOps.slice(mark)).toEqual([])
    expect(updates(w)).toEqual([])
    expect([...w.store.keys()]).toEqual([AUTO_OPT_INS_KEY])
    expect(w.calls).toEqual([])
  })

  test('with the switch on and no row opted in, each hourly check reads its four settings and stops there: no claude call, no lease, no file read, nothing written, and the timer runs on', async ($, on) => {
    const w = withCatalogs(world(on))
    await autoStore(w, true, [])
    await start($, 'terminal')
    const mark = w.storeOps.length
    const reads = w.reads.length
    const stored = JSON.stringify([...w.store.entries()])
    await runCheck(w, AUTO_START_MS)
    await nextCheck(w)
    const settings = [`get ${AUTO_OPT_INS_KEY}`, `get ${AUTO_PAUSES_KEY}`, `get ${keyFor(AUTO_UPDATE)}`, `get ${AUTO_LOG_KEY}`]
    expect(w.storeOps.slice(mark)).toEqual([...settings, ...settings])
    expect(w.calls).toEqual([])
    expect(w.reads.length).toBe(reads)
    expect(w.store.has(AUTO_LEASE_KEY)).toBe(false)
    expect(JSON.stringify([...w.store.entries()])).toBe(stored)
  })

  test('turning the switch on in the pane sets the timer, so a check runs two minutes on; turning it off cancels the timer, so no check reads anything after', async ($, on) => {
    const w = withCatalogs(world(on))
    await autoStore(w, undefined, [ZZZ_KEY])
    const ui = await openAndMount($, w, 'switch-timer', 'terminal', 160)
    await pressAnswering(ui, w, 'mm-auto-switch', [AUTO_ON_LABEL])
    w.calls = []
    await runCheck(w, AUTO_START_MS)
    expect(updates(w)).toEqual([{ argv: AUTO_ZZZ, cwd: undefined }])
    await pressAnswering(ui, w, 'mm-auto-switch', [])
    expect(await storedValue(w, keyFor(AUTO_UPDATE))).toBe(false)
    const mark = w.storeOps.length
    w.calls = []
    await runCheck(w, AUTO_PERIOD_MS)
    await nextCheck(w)
    expect(w.storeOps.slice(mark)).toEqual([])
    expect(w.calls).toEqual([])
    await ui.unmount()
  })

  test('a check that reads the switch off, as another session turned it off, stops the timer of this session: turned on again there, no check runs here until the next start', async ($, on) => {
    const w = withCatalogs(world(on))
    await autoStore(w, true, [ZZZ_KEY])
    await start($, 'terminal')
    w.store.set(keyFor(AUTO_UPDATE), await signed(AUTO_UPDATE, false, 600))
    await runCheck(w, AUTO_START_MS)
    expect(w.calls).toEqual([])
    w.store.set(keyFor(AUTO_UPDATE), await signed(AUTO_UPDATE, true, 700))
    const mark = w.storeOps.length
    await nextCheck(w)
    await nextCheck(w)
    expect(w.storeOps.slice(mark)).toEqual([])
    expect(w.calls).toEqual([])
    await start($, 'terminal')
    await runCheck(w, AUTO_START_MS)
    expect(updates(w)).toEqual([{ argv: AUTO_ZZZ, cwd: undefined }])
  })

  test('the agent can turn the switch on through the switches tool, and an on written while the timer runs sets no second timer: each hour runs one check', async ($, on) => {
    const w = withCatalogs(world(on))
    await autoStore(w, undefined, [ZZZ_KEY])
    await start($, 'terminal')
    for (let call = 0; call < 2; call++) {
      await $.tool.call({ tool: TOOL, switch: AUTO_UPDATE, on: true } as any)
      await idle(w)
    }
    expect(await storedValue(w, keyFor(AUTO_UPDATE))).toBe(true)
    const mark = w.storeOps.length
    await runCheck(w, AUTO_START_MS)
    expect(updates(w)).toEqual([{ argv: AUTO_ZZZ, cwd: undefined }])
    expect(w.storeOps.slice(mark).filter((op) => op === `set ${AUTO_LEASE_KEY}`)).toHaveLength(1)
  })

  test('a switch that cannot be read at the start leaves the check off in this session and says so in the transcript, and an open pane is still read again', async ($, on) => {
    const w = withCatalogs(world(on))
    await autoStore(w, true, [])
    w.panes = [{ id: 'mod-manager', title: 'Mods', isShown: true, isFocused: true, isPlaced: true }]
    // A start reads this switch three times: the registry's start lists every switch, then startModManager, then the
    // open pane's reread. The second is the one under test.
    w.failGet = { key: keyFor(AUTO_UPDATE), occurrence: 2, reason: 'the store could not be read \u001b[2K here' }
    w.session = 'start-switch-unreadable'
    await start($, 'terminal')
    await idle(w)
    // The engine's reason is quoted, with its control character as a '?' (printable; review of d783048).
    expect(transcript(w).filter((line) => line.startsWith('mods-manager: the hourly auto-update check could not be started, so none runs in this session: '))).toEqual([
      'mods-manager: the hourly auto-update check could not be started, so none runs in this session: mods-expert-developer-plugin: $.store.get: the store could not be read ?[2K here',
    ])
    expect(w.calls.filter((call) => call.argv[2] === 'list')).toHaveLength(1)
    const mark = w.storeOps.length
    await runCheck(w, AUTO_START_MS)
    await nextCheck(w)
    expect(w.storeOps.slice(mark).filter((op) => op === `get ${AUTO_OPT_INS_KEY}`)).toEqual([])
    w.panes = []
  })
  test('an on written while the timers run keeps them, so the first check is not put off; an off then an on sets them again', async ($, on) => {
    const w = withCatalogs(world(on))
    await autoStore(w, true, [])
    await start($, 'terminal')
    await idle(w)
    await w.clock.advance(AUTO_START_MS - 30_000)
    await idle(w)
    await $.tool.call({ tool: TOOL, switch: AUTO_UPDATE, on: true } as any)
    await idle(w)
    const mark = w.storeOps.length
    await runCheck(w, 30_000)
    expect(w.storeOps.slice(mark).filter((op) => op === `get ${AUTO_OPT_INS_KEY}`)).toHaveLength(1)
    await $.tool.call({ tool: TOOL, switch: AUTO_UPDATE, on: false } as any)
    await idle(w)
    await $.tool.call({ tool: TOOL, switch: AUTO_UPDATE, on: true } as any)
    await idle(w)
    const again = w.storeOps.length
    await runCheck(w, AUTO_START_MS)
    expect(w.storeOps.slice(again).filter((op) => op === `get ${AUTO_OPT_INS_KEY}`)).toHaveLength(1)
  })

  // The person's path to an on over live timers (review of item S, finding 2, kept when the owner dropped item S on
  // 2026-11-05): the agent's two ons above go through the switches tool, these two through presses in /mods-switches.
  // Mutant T10 (an on adds a second hourly timer to the live set) survived when neither test wrote an on over live timers.
  test('two ons the person writes while the hourly timer runs add no timer: each hour runs one check', async ($, on) => {
    const w = withCatalogs(world(on))
    await autoStore(w, true, [])
    await start($, 'terminal')
    await idle(w)
    // The first check runs and sets the hourly timer.
    await runCheck(w, AUTO_START_MS)
    for (const at of [5_000_000, 6_000_000]) {
      // The pane is drawn while another session has the switch off, that session turns it on again, and the press, which
      // acts on what the pane showed, writes an on while this session's timers run.
      w.store.set(keyFor(AUTO_UPDATE), await signed(AUTO_UPDATE, false, at))
      const ui = await mountSwitchesPane($)
      await ui.press({ key: 'sw-mod-mods-manager' })
      w.store.set(keyFor(AUTO_UPDATE), await signed(AUTO_UPDATE, true, at + 1))
      await ui.press({ key: `sw-${AUTO_UPDATE}` })
      await idle(w)
      await ui.unmount()
      expect((w.store.get(keyFor(AUTO_UPDATE)) as { at: number }).at).toBeGreaterThan(at + 1)
    }
    const mark = w.storeOps.length
    await nextCheck(w)
    await nextCheck(w)
    expect(w.storeOps.slice(mark).filter((op) => op === `get ${AUTO_OPT_INS_KEY}`)).toHaveLength(2)
  })

  test('/mods-switches turns the switch on with a press, and that sets the timer, so a check runs two minutes on', async ($, on) => {
    await switchesPaneSetsTheTimer($, withCatalogs(world(on)), 'press')
  })

  test('/mods-switches keeps an on written outside the plugin with 0, and that sets the timer, so a check runs two minutes on', async ($, on) => {
    await switchesPaneSetsTheTimer($, withCatalogs(world(on)), 'keep')
  })
  test('a start replaces the set of timers before it, and a stopped set whose first check fires anyway runs nothing: no check, and no hourly timer nothing could cancel', async () => {
    // The engine never fires a stopped timer (types, Timer: "a stopped timer never fires again"), nor does the kit's
    // clock, so only a clock of this test's own can fire one. It is handed to the auto-timer module this file imports, a
    // copy of its own (not the one the kit loads), as $; the timers are the only part of $ the start uses.
    const afters: { fire: () => void; cancelled: boolean }[] = []
    let hourlyTimers = 0
    const fake = {
      session: { id: async () => 'fake-session' },
      clock: {
        after: (_ms: number, fire: () => void) => {
          const timer = { fire, cancelled: false }
          afters.push(timer)
          return { cancel: () => (timer.cancelled = true) }
        },
        every: () => {
          hourlyTimers++
          return { cancel: () => undefined }
        },
      },
    } as unknown as EngineInterface
    await startAutoTimers(fake)
    await startAutoTimers(fake)
    expect(afters.map((timer) => timer.cancelled)).toEqual([true, false])
    afters[0]?.fire()
    expect(hourlyTimers).toBe(0)
  })

  test('with the switch on, each opted-in row with an update is updated with --json in its own folder, with no question and no -y; each update leaves a toast and a transcript line with the plugin, its scope, the versions claude reported and the time; the open pane reads the list again', async ($, on) => {
    const w = withCatalogs(world(on))
    await autoStore(w, true, [ZZZ_KEY, DDD_KEY])
    w.updateJson['ddd-local@market-a'] = { exitCode: 0, stdout: updatedJson('ddd-local@market-a', '1.0.0', '1.1.0') }
    const ui = await openAndMount($, w, 'sess-1', 'terminal', 160)
    w.calls = []
    await runCheck(w, AUTO_START_MS)
    expect(updates(w)).toEqual([
      { argv: AUTO_ZZZ, cwd: undefined },
      { argv: AUTO_DDD, cwd: '/work/app' },
    ])
    const records = [
      `auto-update: zzz-tool@market-a (user scope) updated from 2.0.0 to 10.0.0 at ${FIRST_CHECK_AT}. It loads in your next session.`,
      `auto-update: ddd-local@market-a (local scope) updated from 1.0.0 to 1.1.0 at ${FIRST_CHECK_AT}. It loads in your next session.`,
    ]
    expect(w.toasts).toEqual(records)
    expect(transcript(w)).toEqual(records)
    // The store keeps the records for every session's pane, which draws them once it reads them again.
    expect(w.store.get(AUTO_LOG_KEY)).toEqual(records)
    expect(await ui.find({ type: 'Text', text: records[1]! })).toBeDefined()
    expect(w.asked).toEqual([])
    expect(acceptFlags(w)).toEqual([])
    expect(w.store.get(AUTO_LEASE_KEY)).toEqual({ session: 'sess-1', at: FIRST_LEASE_AT })
    expect(w.store.has(AUTO_PAUSES_KEY)).toBe(false)
    // The pane was open, so the list was read again after the updates, and the pane asks for a new session.
    // Each update may run five minutes (INSTALL_TIMEOUT_MS), not the 30 seconds $.process.run allows by default.
    expect(w.updateTimeouts).toEqual([300_000, 300_000])
    expect(subcommands(w)).toContain('update ddd-local@market-a')
    const after = subcommands(w).slice(subcommands(w).indexOf('update ddd-local@market-a') + 1)
    expect(after).toContain('list --json')
    expect(await ui.find({ type: 'Text', text: NEXT_SESSION })).toBeDefined()
    await ui.unmount()
  })

  test('an update claude finds nothing newer for leaves only a debug line; a failed one, with a result line or none, pauses its row with the reason, a toast and a transcript line; a later check skips a paused row', async ($, on) => {
    const w = withCatalogs(world(on))
    await autoStore(w, true, [ZZZ_KEY, DDD_KEY])
    const current = 'zzz-tool is already at the latest version (10.0.0).'
    w.updateJson['zzz-tool@market-a'] = { exitCode: 0, stdout: JSON.stringify({ command: 'update', outcome: 'ok', plugin: 'zzz-tool@market-a', message: current, updateOutcome: 'up_to_date' }) }
    // No result line: claude's own last line is the reason.
    w.updateJson['ddd-local@market-a'] = { exitCode: 1, stdout: 'Checking for updates…', stderr: 'the marketplace could not be reached' }
    await start($, 'terminal')
    await runCheck(w, AUTO_START_MS)
    const pausedDdd = 'auto-update of ddd-local@market-a (local scope) paused: the update failed: the marketplace could not be reached Review it in the mods-manager pane.'
    expect(w.toasts).toEqual([pausedDdd])
    expect(transcript(w)).toEqual([pausedDdd])
    expect(debugLines(w)).toContain(`mods-manager: auto-update of zzz-tool@market-a: ${current}`)
    const dddPause = { reason: 'the update failed: the marketplace could not be reached' }
    expect(await storedValue(w, AUTO_PAUSES_KEY)).toEqual({ [DDD_KEY]: dddPause })
    // A result line that says failed pauses too, with claude's message; the paused row is skipped.
    w.updateJson['zzz-tool@market-a'] = { exitCode: 1, stdout: JSON.stringify({ command: 'update', outcome: 'failed', plugin: 'zzz-tool@market-a', message: 'the plugin could not be fetched' }) }
    w.calls = []
    w.toasts = []
    await nextCheck(w)
    expect(updates(w)).toEqual([{ argv: AUTO_ZZZ, cwd: undefined }])
    expect(w.toasts).toEqual(['auto-update of zzz-tool@market-a (user scope) paused: the update failed: the plugin could not be fetched Review it in the mods-manager pane.'])
    expect(await storedValue(w, AUTO_PAUSES_KEY)).toEqual({ [DDD_KEY]: dddPause, [ZZZ_KEY]: { reason: 'the update failed: the plugin could not be fetched' } })
    w.calls = []
    await nextCheck(w)
    expect(updates(w)).toEqual([])
  })

  test('a command claude shows is never run: the row pauses, a toast and a transcript line show the command with its sha256, the pause keeps the command only when it is the row\'s own, and the next check skips the row', async ($, on) => {
    const w = withCatalogs(world(on))
    await autoStore(w, true, [ZZZ_KEY, DDD_KEY])
    // The refused result measured for an install (shownResult); an update's carries the same fields the pane reads (results.ts).
    w.updateJson['zzz-tool@market-a'] = shownResult('zzz-tool@market-a', SHA)
    // A command shown for another plugin, a dependency for example: the row pauses, and no line is kept for it.
    w.updateJson['ddd-local@market-a'] = shownResult('other-tool@market-a', SHA)
    await start($, 'terminal')
    await runCheck(w, AUTO_START_MS)
    expect(updates(w)).toEqual([
      { argv: AUTO_ZZZ, cwd: undefined },
      { argv: AUTO_DDD, cwd: '/work/app' },
    ])
    const otherReason = (command: string) => `claude showed a command declared for other-tool@market-a, another plugin: ${command} (sha256 ${SHA}). It was not run.`
    const records = [
      `auto-update of zzz-tool@market-a (user scope) paused: ${ZZZ_SHOWN_DRAWN} Review it in the mods-manager pane.`,
      `auto-update of ddd-local@market-a (local scope) paused: ${otherReason(DECLARED_SHOWN)} Review it in the mods-manager pane.`,
    ]
    expect(w.toasts).toEqual(records)
    expect(transcript(w)).toEqual(records)
    // The reason is stored as drawn, on one line and printable (pauseRecordOf, M4c item 2); the shown command is kept
    // byte for byte, since its sha256 is what an accept line names.
    expect(await storedValue(w, AUTO_PAUSES_KEY)).toEqual({ [ZZZ_KEY]: { reason: ZZZ_SHOWN_DRAWN, shown: ZZZ_SHOWN }, [DDD_KEY]: { reason: otherReason(DECLARED_SHOWN) } })
    expect(acceptFlags(w)).toEqual([])
    w.calls = []
    await nextCheck(w)
    expect(updates(w)).toEqual([])
  })

  test('a session that draws on Desktop only runs no check: every claude call needs $.process, which is CLI only', async ($, on) => {
    const w = withCatalogs(world(on))
    await autoStore(w, true, [ZZZ_KEY])
    w.surfaces = ['desktop']
    await start($, 'desktop')
    await runCheck(w, AUTO_START_MS)
    expect(w.calls).toEqual([])
    expect(w.store.has(AUTO_LEASE_KEY)).toBe(false)
  })

  test('a headless session, which draws nowhere (a -p run or the SDK), runs no check either (coordinator review of M4b, finding 9)', async ($, on) => {
    const w = withCatalogs(world(on))
    await autoStore(w, true, [ZZZ_KEY])
    w.surfaces = []
    await start($, 'terminal')
    await runCheck(w, AUTO_START_MS)
    expect(w.calls).toEqual([])
    expect(w.store.has(AUTO_LEASE_KEY)).toBe(false)
  })

  test('another session\'s lease younger than the period less a minute keeps a check from running; an older one does not; a lease another session writes during the wait wins', async ($, on) => {
    const w = withCatalogs(world(on))
    await autoStore(w, true, [ZZZ_KEY])
    const other = { session: 'sess-other', at: 100_000 }
    w.store.set(AUTO_LEASE_KEY, other)
    await start($, 'terminal')
    await runCheck(w, AUTO_START_MS)
    expect(updates(w)).toEqual([])
    expect(w.store.get(AUTO_LEASE_KEY)).toEqual(other)
    // An hour later that lease is older than AUTO_LEASE_MS, so this session takes it and runs the check.
    await nextCheck(w)
    expect(updates(w)).toEqual([{ argv: AUTO_ZZZ, cwd: undefined }])
    expect(w.store.get(AUTO_LEASE_KEY)).toEqual({ session: 'sess-1', at: FIRST_LEASE_AT + AUTO_PERIOD_MS })
    // The next hour another session writes its lease while this one waits to read its own back: this one stops.
    w.calls = []
    await w.clock.advance(AUTO_PERIOD_MS - AUTO_SETTLE_MS)
    await idle(w)
    w.store.set(AUTO_LEASE_KEY, { session: 'sess-other', at: w.clock.now() })
    await w.clock.advance(AUTO_SETTLE_MS)
    await idle(w)
    expect(updates(w)).toEqual([])
  })

  test('a check runs nothing while claude reads the list, and stops before a row when a press takes the claim during the wait of its lease', async ($, on) => {
    const w = withCatalogs(world(on))
    await autoStore(w, true, [ZZZ_KEY])
    // The pane's read of the list holds the claim when the first check comes.
    const list = deferred()
    w.hold = list
    const ui = await openAndMount($, w, 'sess-1', 'terminal', 160)
    await runCheck(w, AUTO_START_MS)
    expect(w.store.has(AUTO_LEASE_KEY)).toBe(false)
    list.resolve()
    await idle(w)
    // The next check takes the lease and waits; meanwhile Refresh takes the claim, so the check updates nothing.
    await w.clock.advance(AUTO_PERIOD_MS - AUTO_SETTLE_MS)
    await idle(w)
    const refresh = deferred()
    w.hold = refresh
    await ui.press({ key: 'mm-refresh' })
    await idle(w)
    await w.clock.advance(AUTO_SETTLE_MS)
    await idle(w)
    expect(w.store.get(AUTO_LEASE_KEY)).toEqual({ session: 'sess-1', at: FIRST_LEASE_AT + AUTO_PERIOD_MS })
    // The refused claim ends the check quietly: it is not a failure of the check.
    expect(debugLines(w).filter((line) => line.includes('the auto-update check failed'))).toEqual([])
    expect(updates(w)).toEqual([])
    refresh.resolve()
    await idle(w)
    await ui.unmount()
  })

  test('a result whose shown command the pane cannot read pauses its row with claude\'s message and says to run the update in a terminal; no line accepts anything', async ($, on) => {
    const w = withCatalogs(world(on))
    await autoStore(w, true, [ZZZ_KEY])
    w.updateJson['zzz-tool@market-a'] = {
      exitCode: 1,
      stdout: JSON.stringify({ command: 'update', outcome: 'failed', plugin: 'zzz-tool@market-a', message: 'a command must be accepted.', shownCommand: { kind: 'odd' } }),
    }
    await start($, 'terminal')
    await runCheck(w, AUTO_START_MS)
    const reason = 'a command must be accepted. The command its marketplace declares could not be read here: run claude plugin update zzz-tool@market-a in your own terminal to see it.'
    expect(await storedValue(w, AUTO_PAUSES_KEY)).toEqual({ [ZZZ_KEY]: { reason } })
    expect(acceptFlags(w)).toEqual([])
  })

  test('an update that works but leaves claude listing an error for its plugin (a dependency it did not install) pauses the row with that error after its record', async ($, on) => {
    const missing = 'Dependency "bbb-cmd@market-a" is not installed — run `claude plugin install bbb-cmd@market-a`, or check that its marketplace is added'
    const w = withCatalogs(world(on, PLUGINS.map((entry) => ((entry as { id: string }).id === 'zzz-tool@market-a' ? { ...(entry as object), errors: [missing] } : entry))))
    await autoStore(w, true, [ZZZ_KEY])
    await start($, 'terminal')
    await runCheck(w, AUTO_START_MS)
    expect(updates(w)).toEqual([{ argv: AUTO_ZZZ, cwd: undefined }])
    const reason = `it was updated, but claude now lists an error for it: ${missing}`
    expect(await storedValue(w, AUTO_PAUSES_KEY)).toEqual({ [ZZZ_KEY]: { reason } })
    expect(transcript(w)).toEqual([
      `auto-update: zzz-tool@market-a (user scope) updated from 2.0.0 to 10.0.0 at ${FIRST_CHECK_AT}. It loads in your next session.`,
      `auto-update of zzz-tool@market-a (user scope) paused: ${reason} Review it in the mods-manager pane.`,
    ])
  })

  test('the pane checks before claude is called: a row whose catalog entry declares a command, or whose marketplace source is not the one kept with its opt-in, pauses with its record and no claude call for it; the other rows update', async ($, on) => {
    const w = withCatalogs(world(on))
    // zzz-tool's entry now comes as an archive with a headers helper: it keeps its version, so it has an arrow.
    w.files[CATALOG_A] = catalogA('10.0.0', [], { source: { source: 'archive', url: 'https://example.com/zzz.tgz' }, headersHelper: 'node helper.js' })
    await autoStore(w, true, [ZZZ_KEY, DDD_KEY])
    await start($, 'terminal')
    await runCheck(w, AUTO_START_MS)
    expect(updates(w)).toEqual([{ argv: AUTO_DDD, cwd: '/work/app' }])
    const pausedZzz = `auto-update of zzz-tool@market-a (user scope) paused: ${DECLARES_REASON} Review it in the mods-manager pane.`
    const updatedDdd = `auto-update: ddd-local@market-a (local scope) updated from 2.0.0 to 10.0.0 at ${FIRST_CHECK_AT}. It loads in your next session.`
    expect(w.toasts).toEqual([pausedZzz, updatedDdd])
    expect(transcript(w)).toEqual([pausedZzz, updatedDdd])
    expect(w.store.get(AUTO_LOG_KEY)).toEqual([pausedZzz, updatedDdd])
    expect(await storedValue(w, AUTO_PAUSES_KEY)).toEqual({ [ZZZ_KEY]: { reason: DECLARES_REASON } })
    // ddd-local's opt-in was kept under another source of market-a, so it pauses, and claude is not called for it.
    w.store.set(AUTO_PAUSES_KEY, await envelopeOf(AUTO_PAUSES_KEY, {}, 500))
    w.store.set(AUTO_OPT_INS_KEY, await envelopeOf(AUTO_OPT_INS_KEY, { [DDD_KEY]: '["directory","/elsewhere",null,null]' }, 500))
    w.calls = []
    await nextCheck(w)
    expect(updates(w)).toEqual([])
    expect(await storedValue(w, AUTO_PAUSES_KEY)).toEqual({ [DDD_KEY]: { reason: SOURCE_REASON } })
  })

  test('a check reads the switch and each row\'s opt-in again before the row: an opt-out made during the lease\'s wait drops that row, and the switch turned off then stops the check', async ($, on) => {
    const w = withCatalogs(world(on))
    await autoStore(w, true, [ZZZ_KEY, DDD_KEY])
    await start($, 'terminal')
    await w.clock.advance(AUTO_START_MS)
    await idle(w)
    w.store.set(AUTO_OPT_INS_KEY, await envelopeOf(AUTO_OPT_INS_KEY, { [DDD_KEY]: A_SOURCE }, 500))
    await w.clock.advance(AUTO_SETTLE_MS)
    await idle(w)
    expect(updates(w)).toEqual([{ argv: AUTO_DDD, cwd: '/work/app' }])
    w.calls = []
    w.store.set(AUTO_OPT_INS_KEY, await envelopeOf(AUTO_OPT_INS_KEY, { [ZZZ_KEY]: A_SOURCE, [DDD_KEY]: A_SOURCE }, 500))
    await w.clock.advance(AUTO_PERIOD_MS - AUTO_SETTLE_MS)
    await idle(w)
    w.store.set(keyFor(AUTO_UPDATE), await signed(AUTO_UPDATE, false, 500))
    await w.clock.advance(AUTO_SETTLE_MS)
    await idle(w)
    expect(updates(w)).toEqual([])
  })

  test('an update $.process.run rejects, as it does at its timeout, pauses its row with the reason and releases the claim', async ($, on) => {
    const w = withCatalogs(world(on))
    await autoStore(w, true, [ZZZ_KEY])
    w.updateDenies['zzz-tool@market-a'] = 'the command ran past its timeout'
    const ui = await openAndMount($, w, 'sess-1', 'terminal', 160)
    await runCheck(w, AUTO_START_MS)
    const pauses = (await storedValue(w, AUTO_PAUSES_KEY)) as Record<string, { reason: string }>
    expect(pauses[ZZZ_KEY]?.reason).toMatch(/^the update failed: .*the command ran past its timeout/)
    expect(await ui.find({ type: 'Text', text: 'updating zzz-tool automatically…' })).toBeUndefined()
    w.calls = []
    await ui.press({ key: 'mm-refresh' })
    await idle(w)
    expect(subcommands(w)).toContain('list --json')
    await ui.unmount()
  })

  test('no /mods-manager argument form turns the switch on, opts a row in, resumes a pause or installs, whatever the questions are answered: only a press in the pane does', async ($, on) => {
    const w = withCatalogs(world(on))
    await autoStore(w, undefined, [])
    w.store.set(AUTO_PAUSES_KEY, await envelopeOf(AUTO_PAUSES_KEY, { [ZZZ_KEY]: { reason: 'the update failed: x' } }, 500))
    const before = JSON.stringify([...w.store.entries()])
    await start($, 'terminal')
    const forms = ['', 'open', 'close', 'check', 'add /work/plugins', 'add org/x', 'on', 'auto on', 'auto zzz-tool@market-a', 'resume zzz-tool@market-a', 'install bbb-new@market-a', 'update zzz-tool@market-a user']
    for (const args of forms) {
      w.answerQueue = [AUTO_ON_LABEL, OPT_IN_LABEL, RESUME_LABEL, INSTALL_LABEL, AUTO_ON_LABEL, OPT_IN_LABEL, RESUME_LABEL, INSTALL_LABEL]
      await $.command.run({ command: 'mods-manager', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } })
      await idle(w)
    }
    expect(JSON.stringify([...w.store.entries()])).toBe(before)
    expect(w.calls.filter((call) => call.argv[2] === 'install' || call.argv[2] === 'update')).toEqual([])
    // No question of the switch, an opt-in, a Review or an install was asked; and, as a control, the same answers given
    // to a press of the switch in the pane do turn it on, so the answers would have been taken had one been asked.
    expect(w.asked.filter((question) => question === SWITCH_QUESTION || question === OPT_IN_ZZZ || question.startsWith('Install ') || question.startsWith('Auto-update of '))).toEqual([])
    const ui = await openAndMount($, w, 'sess-1', 'terminal', 160)
    await pressAnswering(ui, w, 'mm-auto-switch', [AUTO_ON_LABEL])
    expect(await storedValue(w, keyFor(AUTO_UPDATE))).toBe(true)
    await ui.unmount()
  })
})

describe('2k auto-update: the switch, Auto and Review in the pane', () => {
  test('the records of the last automatic updates and pauses are drawn under the switch, newest last, from the store every session shares', async ($, on) => {
    const w = withCatalogs(world(on))
    await autoStore(w, true, [ZZZ_KEY])
    w.store.set(AUTO_LOG_KEY, ['first record', 'second record', 7])
    for (const { surface, columns } of PLACES) {
      const ui = await openAndMount($, w, `records-${surface}-${columns}`, surface, columns)
      expect(await ui.find({ type: 'Text', text: 'Recent automatic updates:' })).toBeDefined()
      for (const text of ['first record', 'second record']) expect(await ui.find({ type: 'Text', text })).toBeDefined()
      await ui.unmount()
    }
  })

  test('the switch is drawn off by default; turning it on asks the switch question and writes true only on its label; turning it off asks nothing', async ($, on) => {
    const w = withCatalogs(world(on))
    for (const { surface, columns } of PLACES) {
      w.store.clear()
      const ui = await openAndMount($, w, `switch-${surface}-${columns}`, surface, columns)
      const drawn = (label: string) => fitLabel(label, columns - 8)
      expect(await labelOf(ui, 'mm-auto-switch')).toBe(drawn('Auto-update: off'))
      for (const answers of [[KEEP], []]) {
        await pressAnswering(ui, w, 'mm-auto-switch', answers)
        expect(w.asked).toEqual([SWITCH_QUESTION])
        expect(w.store.has(keyFor(AUTO_UPDATE))).toBe(false)
      }
      await pressAnswering(ui, w, 'mm-auto-switch', [AUTO_ON_LABEL])
      expect(await storedValue(w, keyFor(AUTO_UPDATE))).toBe(true)
      expect(w.toasts).toEqual(['Auto-update is on: plugins you opted in are checked every hour.'])
      expect(await labelOf(ui, 'mm-auto-switch')).toBe(drawn('Auto-update: on'))
      await pressAnswering(ui, w, 'mm-auto-switch', [AUTO_ON_LABEL])
      expect(w.asked).toEqual([])
      expect(await storedValue(w, keyFor(AUTO_UPDATE))).toBe(false)
      expect(w.toasts).toEqual(['Auto-update is off: nothing is updated on its own.'])
      expect(await labelOf(ui, 'mm-auto-switch')).toBe(drawn('Auto-update: off'))
      expect(actions(w)).toEqual([])
      await ui.unmount()
    }
  })

  test('Auto on a row asks its question and opts the row in only on its label, under a key with its folder for a local install and with its marketplace\'s source, refused for a marketplace claude does not list; opting out asks nothing and clears that row\'s pause alone', async ($, on) => {
    const w = withCatalogs(world(on))
    const zzz = `mm-auto-${ZZZ_KEY}`
    const ddd = 'mm-auto-ddd-local@market-a|local'
    for (const { surface, columns } of PLACES) {
      w.store.clear()
      const ui = await openAndMount($, w, `opt-in-${surface}-${columns}`, surface, columns)
      const drawn = (label: string) => fitLabel(label, columns - 8)
      expect(await labelOf(ui, zzz)).toBe(drawn('Auto: off'))
      for (const answers of [[KEEP], []]) {
        await pressAnswering(ui, w, zzz, answers)
        expect(w.asked).toEqual([OPT_IN_ZZZ])
        expect(w.store.has(AUTO_OPT_INS_KEY)).toBe(false)
      }
      await pressAnswering(ui, w, zzz, [OPT_IN_LABEL])
      expect(await storedValue(w, AUTO_OPT_INS_KEY)).toEqual({ [ZZZ_KEY]: A_SOURCE })
      expect(w.toasts).toEqual(['zzz-tool (user scope) is updated automatically while auto-update is on, whenever its row offers Update.'])
      expect(await labelOf(ui, zzz)).toBe(drawn('Auto: on'))
      await pressAnswering(ui, w, ddd, [OPT_IN_LABEL])
      expect(await storedValue(w, AUTO_OPT_INS_KEY)).toEqual({ [ZZZ_KEY]: A_SOURCE, [DDD_KEY]: A_SOURCE })
      const dddPause = { reason: 'the update failed: y' }
      w.store.set(AUTO_PAUSES_KEY, await envelopeOf(AUTO_PAUSES_KEY, { [ZZZ_KEY]: { reason: 'the update failed: x' }, [DDD_KEY]: dddPause }, 500))
      await pressAnswering(ui, w, zzz, [])
      expect(w.asked).toEqual([])
      expect(await storedValue(w, AUTO_OPT_INS_KEY)).toEqual({ [DDD_KEY]: A_SOURCE })
      expect(await storedValue(w, AUTO_PAUSES_KEY)).toEqual({ [DDD_KEY]: dddPause })
      expect(w.toasts).toEqual(['zzz-tool (user scope) is no longer updated automatically.'])
      expect(await labelOf(ui, zzz)).toBe(drawn('Auto: off'))
      expect(actions(w)).toEqual([])
      // A marketplace claude's list does not name gives no source to keep, so the opt-in is not made, and the pane says why.
      w.marketplaces = MARKETPLACES.filter((entry) => entry.name !== 'market-a')
      await pressAnswering(ui, w, zzz, [OPT_IN_LABEL])
      expect(await storedValue(w, AUTO_OPT_INS_KEY)).toEqual({ [DDD_KEY]: A_SOURCE })
      expect(await ui.find({ type: 'Text', text: NO_SOURCE_ZZZ })).toBeDefined()
      w.marketplaces = MARKETPLACES
      // A session with no terminal cannot read the source with claude ($.process is CLI only), so it opts nothing in, asks
      // nothing, runs nothing and says why (review round 2).
      w.surfaces = ['desktop']
      w.calls = []
      await pressAnswering(ui, w, zzz, [OPT_IN_LABEL])
      expect(w.asked).toEqual([])
      expect(w.calls).toEqual([])
      expect(await storedValue(w, AUTO_OPT_INS_KEY)).toEqual({ [DDD_KEY]: A_SOURCE })
      expect(await ui.find({ type: 'Text', text: NO_TERMINAL_ZZZ })).toBeDefined()
      w.surfaces = ['terminal']
      await ui.unmount()
    }
  })

  test('a paused row draws Review and why it paused; Review asks with the command, its sha256 and the line; Copy the line copies it to the surface pressed; Resume clears the pause', async ($, on) => {
    const w = withCatalogs(world(on))
    const review = `mm-auto-review-${ZZZ_KEY}`
    const note = `Auto-update paused: ${ZZZ_SHOWN_DRAWN}`
    const paused = { [ZZZ_KEY]: { reason: ZZZ_SHOWN_REASON, shown: ZZZ_SHOWN } }
    for (const { surface, columns } of PLACES) {
      await autoStore(w, true, [ZZZ_KEY])
      w.store.set(AUTO_PAUSES_KEY, await envelopeOf(AUTO_PAUSES_KEY, paused, 500))
      const ui = await openAndMount($, w, `review-${surface}-${columns}`, surface, columns)
      expect(await labelOf(ui, review)).toBe(fitLabel('Review', columns - 8))
      expect(await ui.find({ type: 'Text', text: note })).toBeDefined()
      // Keep, or no answer, changes nothing.
      for (const answers of [[KEEP], []]) {
        await pressAnswering(ui, w, review, answers)
        expect(w.asked).toEqual([REVIEW_ZZZ])
        expect(w.copies).toEqual([])
        expect(await storedValue(w, AUTO_PAUSES_KEY)).toEqual(paused)
      }
      await pressAnswering(ui, w, review, [COPY_LINE_LABEL])
      expect(w.copies).toEqual([{ text: ACCEPT_ZZZ, surface }])
      expect(w.toasts).toEqual([`Copied. Run it in your own terminal, outside Claude Code: ${ACCEPT_ZZZ}`])
      expect(await storedValue(w, AUTO_PAUSES_KEY)).toEqual(paused)
      await pressAnswering(ui, w, review, [RESUME_LABEL])
      expect(await storedValue(w, AUTO_PAUSES_KEY)).toEqual({})
      expect(w.toasts).toEqual(['Auto-update of zzz-tool (user scope) resumed: the next hourly check updates it again.'])
      expect(await ui.find({ key: review })).toBeUndefined()
      expect(await ui.find({ type: 'Text', text: note })).toBeUndefined()
      expect(actions(w)).toEqual([])
      await ui.unmount()
    }
  })

  test('opt-ins written outside the plugin, unsigned or with a signature not its own, count as none: the pane says so, a check updates nothing and takes no lease, and an Auto press writes the opt-ins again, signed', async ($, on) => {
    const w = withCatalogs(world(on))
    const outside = [{ [ZZZ_KEY]: A_SOURCE }, { v: { [ZZZ_KEY]: A_SOURCE }, at: 500, sig: '0'.repeat(64) }]
    for (const [index, stored] of outside.entries()) {
      await autoStore(w, true, [])
      w.store.set(AUTO_OPT_INS_KEY, stored)
      const ui = await openAndMount($, w, `outside-opt-ins-${index}`, 'terminal', 160)
      expect(await ui.find({ type: 'Text', text: optInsOutsideText })).toBeDefined()
      expect(await labelOf(ui, `mm-auto-${ZZZ_KEY}`)).toBe('Auto: off')
      w.calls = []
      await runCheck(w, AUTO_START_MS)
      expect(w.calls).toEqual([])
      expect(w.store.has(AUTO_LEASE_KEY)).toBe(false)
      await pressAnswering(ui, w, `mm-auto-${ZZZ_KEY}`, [OPT_IN_LABEL])
      expect(await storedValue(w, AUTO_OPT_INS_KEY)).toEqual({ [ZZZ_KEY]: A_SOURCE })
      expect(await ui.find({ type: 'Text', text: optInsOutsideText })).toBeUndefined()
      await ui.unmount()
    }
  })

  test('pauses written outside the plugin are kept as read: the pane says so, the row stays paused with Review, a check skips it, and Resume writes the pauses again, signed', async ($, on) => {
    const w = withCatalogs(world(on))
    await autoStore(w, true, [ZZZ_KEY])
    w.store.set(AUTO_PAUSES_KEY, { [ZZZ_KEY]: { reason: 'the update failed: x' } })
    const review = `mm-auto-review-${ZZZ_KEY}`
    const ui = await openAndMount($, w, 'outside-pauses', 'terminal', 160)
    expect(await ui.find({ type: 'Text', text: pausesOutsideText })).toBeDefined()
    expect(await labelOf(ui, review)).toBe('Review')
    w.calls = []
    await runCheck(w, AUTO_START_MS)
    expect(updates(w)).toEqual([])
    await pressAnswering(ui, w, review, [RESUME_LABEL])
    expect(await storedValue(w, AUTO_PAUSES_KEY)).toEqual({})
    expect(await ui.find({ type: 'Text', text: pausesOutsideText })).toBeUndefined()
    await ui.unmount()
  })

  test('a pause written outside the plugin with a shown command offers no line that accepts it, and a Resume of another row signs the map without it (review of d783048)', async ($, on) => {
    const w = withCatalogs(world(on))
    await autoStore(w, true, [ZZZ_KEY, DDD_KEY])
    w.store.set(AUTO_PAUSES_KEY, { [ZZZ_KEY]: { reason: 'the update failed: x', shown: ZZZ_SHOWN }, [DDD_KEY]: { reason: 'the update failed: y' } })
    const ui = await openAndMount($, w, 'forged-shown', 'terminal', 160)
    await pressAnswering(ui, w, `mm-auto-review-${ZZZ_KEY}`, [COPY_LINE_LABEL])
    expect(w.asked).toHaveLength(1)
    expect(w.asked[0]).not.toContain(SHA)
    expect(w.copies).toEqual([])
    // A button's key carries the row's key, without the folder an opt-in key adds for a local install.
    await pressAnswering(ui, w, 'mm-auto-review-ddd-local@market-a|local', [RESUME_LABEL])
    expect(await storedValue(w, AUTO_PAUSES_KEY)).toEqual({ [ZZZ_KEY]: { reason: 'the update failed: x' } })
    await ui.unmount()
  })

  // M4c item 2: every pause reason is stored on one line and capped at PAUSE_REASON_MAX code points (pauseRecordOf), the
  // plugin's own and each one read from a map written outside. A reason built here: a head, a line break and a tab, then
  // more than the cap.
  const overCap = (head: string): string => `${head}\n\t${'x'.repeat(PAUSE_REASON_MAX)}`
  const expectStoredCapped = (reason: string | undefined, head: string): void => {
    expect(Array.from(reason ?? '')).toHaveLength(PAUSE_REASON_MAX)
    expect(reason?.startsWith(`${head} xxx`)).toBe(true)
    expect(reason?.endsWith('…')).toBe(true)
  }

  test('a pause the plugin writes stores its reason on one line and capped, from a failed update whose message is longer than the cap', async ($, on) => {
    const w = withCatalogs(world(on))
    await autoStore(w, true, [ZZZ_KEY])
    const message = overCap('a command must be accepted.')
    w.updateJson['zzz-tool@market-a'] = {
      exitCode: 1,
      stdout: JSON.stringify({ command: 'update', outcome: 'failed', plugin: 'zzz-tool@market-a', message, shownCommand: { kind: 'odd' } }),
    }
    await start($, 'terminal')
    await runCheck(w, AUTO_START_MS)
    const stored = (await storedValue(w, AUTO_PAUSES_KEY)) as Record<string, { reason: string }>
    expect(Object.keys(stored)).toEqual([ZZZ_KEY])
    expectStoredCapped(stored[ZZZ_KEY]?.reason, 'a command must be accepted.')
  })

  test('a pause read from a map written outside the plugin is stored on one line and capped when the next write signs the map', async ($, on) => {
    const w = withCatalogs(world(on))
    await autoStore(w, true, [ZZZ_KEY, DDD_KEY])
    w.store.set(AUTO_PAUSES_KEY, { [ZZZ_KEY]: { reason: overCap('the update failed:') }, [DDD_KEY]: { reason: 'the update failed: y' } })
    const ui = await openAndMount($, w, 'outside-over-cap', 'terminal', 160)
    // A button's key carries the row's key, without the folder an opt-in key adds for a local install.
    await pressAnswering(ui, w, 'mm-auto-review-ddd-local@market-a|local', [RESUME_LABEL])
    const stored = (await storedValue(w, AUTO_PAUSES_KEY)) as Record<string, { reason: string }>
    expect(Object.keys(stored)).toEqual([ZZZ_KEY])
    expectStoredCapped(stored[ZZZ_KEY]?.reason, 'the update failed:')
    await ui.unmount()
  })

  // Orchestrator ruling (d) on the item 3 sweep: each part from outside is masked where it enters a pause reason (the
  // check), so the toast, the transcript line, the record log and the stored pause hold the home folder as ~. A shown
  // command's reason keeps its sha256, and the pause keeps the command as claude showed it.
  const atHome = `could not write ${HOME}/cache.`
  const failedWith = (extra: Record<string, unknown>) => ({
    exitCode: 1,
    stdout: JSON.stringify({ command: 'update', outcome: 'failed', plugin: 'zzz-tool@market-a', message: atHome, ...extra }),
  })
  const worldWith = (on: any, set: (w: World) => void): World => {
    const w = withCatalogs(world(on))
    set(w)
    return w
  }
  const listedError = (entry: unknown) => ((entry as { id: string }).id === 'zzz-tool@market-a' ? { ...(entry as object), errors: [atHome] } : entry)
  const births: ReadonlyArray<readonly [string, (on: any) => World]> = [
    ['claude cannot read the command it shows', (on) => worldWith(on, (w) => void (w.updateJson['zzz-tool@market-a'] = failedWith({ shownCommand: { kind: 'odd' } })))],
    ['the update failed', (on) => worldWith(on, (w) => void (w.updateJson['zzz-tool@market-a'] = failedWith({})))],
    ['claude shows a command', (on) => worldWith(on, (w) => void (w.updateJson['zzz-tool@market-a'] = failedWith({ shownCommand: { pluginId: 'zzz-tool@market-a', command: `cat ${HOME}/cache.`, sha256: SHA } })))],
    ['the run is refused', (on) => worldWith(on, (w) => void (w.updateDenies['zzz-tool@market-a'] = atHome))],
    ['claude lists an error after the update', (on) => withCatalogs(world(on, PLUGINS.map(listedError)))],
  ]
  for (const [birth, worldFor] of births) {
    test(`a pause reason is masked where it is born (${birth}): the toast, the transcript, the record log and the stored pause show the home folder as ~`, async ($, on) => {
      const w = worldFor(on)
      await autoStore(w, true, [ZZZ_KEY])
      await start($, 'terminal')
      await runCheck(w, AUTO_START_MS)
      const stored = (await storedValue(w, AUTO_PAUSES_KEY)) as Record<string, { reason: string; shown?: { command: string } }>
      const texts = [stored[ZZZ_KEY]?.reason ?? '', ...w.toasts, ...transcript(w), ...(w.store.get(AUTO_LOG_KEY) as string[])]
      expect(texts.filter((text) => text.includes('~/cache.'))).toHaveLength(4)
      for (const text of texts) expect(text).not.toContain(HOME)
      if (birth === 'claude shows a command') {
        expect(stored[ZZZ_KEY]?.reason).toContain(`(sha256 ${SHA})`)
        expect(stored[ZZZ_KEY]?.shown?.command).toBe(`cat ${HOME}/cache.`)
      }
    })
  }
})

describe('the 2k rules', () => {
  const [aaa, zzz, mmm, , ddd] = parseInstalled(JSON.stringify(PLUGINS)).entries.map((entry) => toRow(entry, false))

  test('optInKey adds the folder of a project or local install; optInsOf keeps the string sources of an object, and reads anything else as no opt-in', () => {
    expect(optInKey(zzz!)).toBe(ZZZ_KEY)
    expect(optInKey(ddd!)).toBe(DDD_KEY)
    expect(optInKey({ ...ddd!, scope: 'project' })).toBe('ddd-local@market-a|project|/work/app')
    expect(optInKey({ ...aaa!, scope: 'managed' })).toBe('aaa-mod@market-a|managed')
    expect(Object.fromEntries(optInsOf({ a: 'x', b: 7, c: 'y', d: null }))).toEqual({ a: 'x', c: 'y' })
    for (const value of [undefined, null, 'a', ['a', 'b']]) expect(optInsOf(value).size).toBe(0)
  })

  test('pausesOf keeps a readable record and its command, keeps a record it cannot read paused, and reads anything but an object as no pause', () => {
    const odd = { pluginId: 'zzz-tool@market-a', command: 'c', sha256: 'abc' }
    expect(Object.fromEntries(pausesOf({ [ZZZ_KEY]: { reason: 'r', shown: ZZZ_SHOWN }, [DDD_KEY]: { reason: 's', shown: odd } }, false))).toEqual({
      [ZZZ_KEY]: { reason: 'r', shown: ZZZ_SHOWN },
      [DDD_KEY]: { reason: 's', shown: undefined },
    })
    for (const record of ['damaged', null, { reason: 7 }])
      expect(Object.fromEntries(pausesOf({ [ZZZ_KEY]: record }, false))).toEqual({ [ZZZ_KEY]: { reason: 'its pause record could not be read.', shown: undefined } })
    for (const value of [undefined, null, 'x', [ZZZ_KEY]]) expect(pausesOf(value, false).size).toBe(0)
  })

  test('a pause map written outside the plugin keeps each reason but never its shown command, read or signed (review of d783048)', () => {
    const forged = { [ZZZ_KEY]: { reason: 'r', shown: ZZZ_SHOWN }, [DDD_KEY]: { reason: 's', note: 'forged' }, odd: 'damaged' }
    expect(Object.fromEntries(pausesOf(forged, true))).toEqual({
      [ZZZ_KEY]: { reason: 'r', shown: undefined },
      [DDD_KEY]: { reason: 's', shown: undefined },
      odd: { reason: 'its pause record could not be read.', shown: undefined },
    })
    // Signed as the plugin writes a pause, its reason only: no forged field of any name is signed (review of 067ec02).
    expect(pauseRecordsToSign(forged, true)).toEqual({ [ZZZ_KEY]: { reason: 'r' }, [DDD_KEY]: { reason: 's' }, odd: { reason: 'its pause record could not be read.' } })
    expect(pauseRecordsToSign(forged, false)).toEqual(forged)
    for (const value of [undefined, null, 'x', [ZZZ_KEY]]) expect(pauseRecordsToSign(value, true)).toEqual({})
  })

  test('autoTargets keeps the rows opted in, not paused, whose scope offers Update and whose update the pane can run', () => {
    const sss = { ...zzz!, id: 'sss-tool@market-a', name: 'sss-tool', scope: 'session' as Scope }
    const latest = new Map<string, Latest>([
      ['zzz-tool@market-a', { kind: 'known', version: '10.0.0', from: 'catalog' }],
      ['ddd-local@market-a', { kind: 'known', version: '1.1.0', from: 'folder' }],
      ['mmm-mod@market-b', { kind: 'known', version: '0.3.0', from: 'catalog' }],
      ['aaa-mod@market-a', { kind: 'known', version: '2.0.0', from: 'catalog', asksToAccept: true }],
      ['sss-tool@market-a', { kind: 'known', version: '10.0.0', from: 'catalog' }],
    ])
    const rows = [aaa!, zzz!, mmm!, ddd!, sss]
    const all = new Map(rows.map((row) => [optInKey(row), A_SOURCE]))
    const ids = (targets: readonly Row[]) => targets.map((row) => row.id)
    expect(ids(autoTargets(rows, latest, all, new Map()))).toEqual(['zzz-tool@market-a', 'ddd-local@market-a'])
    expect(ids(autoTargets(rows, latest, all, new Map([[DDD_KEY, { reason: 'r', shown: undefined }]])))).toEqual(['zzz-tool@market-a'])
    expect(ids(autoTargets(rows, latest, new Map([[DDD_KEY, A_SOURCE]]), new Map()))).toEqual(['ddd-local@market-a'])
  })

  test('blockReason pauses a row whose entry declares a command, or whose marketplace source is not the one kept, and no other; a source the list does not give pauses nothing', () => {
    // parseCatalog marks an archive with a headersHelper as declaring one; a headersHelper on any other source has no effect.
    const helper = parseCatalog(JSON.stringify({ plugins: [
      { name: 'h', source: { source: 'archive', url: 'https://example.com/h.tgz' }, headersHelper: 'x', version: '1.0.0' },
      { name: 'g', source: { source: 'github', repo: 'org/g' }, headersHelper: 'x', version: '1.0.0' },
    ] }))
    expect([helper.get('h')?.declares, helper.get('g')?.declares]).toEqual([true, undefined])
    expect(blockReason(zzz!, A_SOURCE, A_SOURCE, true)).toBe(DECLARES_REASON)
    expect(blockReason(zzz!, A_SOURCE, '["directory","/x",null,null]', false)).toBe(SOURCE_REASON)
    for (const [recorded, current] of [[A_SOURCE, A_SOURCE], [A_SOURCE, undefined], [undefined, A_SOURCE]]) expect(blockReason(zzz!, recorded, current, false)).toBeUndefined()
  })

  test('recordsOf keeps the last AUTO_LOG_SIZE strings of a list, and reads anything else as none', () => {
    const many = Array.from({ length: AUTO_LOG_SIZE + 3 }, (_, index) => `record ${index}`)
    expect(recordsOf([...many, 7])).toEqual(many.slice(-AUTO_LOG_SIZE))
    for (const value of [undefined, 'record', { a: 'record' }]) expect(recordsOf(value)).toEqual([])
  })

  test('canAutoUpdate: a row can opt in only when its scope offers Update, so not a synced, session or skills-folder plugin, nor an invalid id', () => {
    expect(canAutoUpdate(zzz!)).toBe(true)
    expect(canAutoUpdate(ddd!)).toBe(true)
    expect(canAutoUpdate({ ...zzz!, scope: 'managed' })).toBe(true)
    for (const scope of ['synced', 'session'] as Scope[]) expect(canAutoUpdate({ ...zzz!, scope })).toBe(false)
    expect(canAutoUpdate({ ...zzz!, id: 'zzz-tool@skills-dir' })).toBe(false)
    expect(canAutoUpdate({ ...zzz!, id: '-y@market-a' })).toBe(false)
  })

  test('no claude command line the pane builds carries -y, --yes or --accept-command: an action of any scope, an install, an automatic update or an add', () => {
    const lines: string[][] = [installArgv('claude', 'bbb-new@market-a'), autoUpdateArgv('claude', { id: 'zzz-tool@market-a', scope: 'project' }), addArgv('claude', '/work/plugins')]
    expect(lines[1]).toEqual(['claude', 'plugin', 'update', 'zzz-tool@market-a', '--scope', 'project', '--json'])
    for (const scope of ['user', 'project', 'local', 'synced', 'session', 'managed'] as Scope[])
      for (const enabled of [true, false])
        for (const id of [scope === 'synced' ? 'engineering@synced' : scope === 'session' ? 'sss-session@inline' : 'zzz-tool@market-a'])
          for (const action of actionsFor({ id, scope, enabled }, true)) lines.push(actionArgv('claude', action, { id, scope }))
    expect(lines.length).toBeGreaterThan(12)
    for (const argv of lines) expect(argv.filter((arg) => arg === '-y' || arg === '--yes' || arg.startsWith('--accept-command'))).toEqual([])
  })

  test('leaseHeldByOther: only another session\'s lease younger than AUTO_LEASE_MS holds; this session\'s own, an older one, one dated after now or a malformed one does not', () => {
    expect(leaseHeldByOther({ session: 'other', at: 0 }, 'me', AUTO_LEASE_MS - 1)).toBe(true)
    expect(leaseHeldByOther({ session: 'other', at: 0 }, 'me', AUTO_LEASE_MS)).toBe(false)
    expect(leaseHeldByOther({ session: 'me', at: 0 }, 'me', 1)).toBe(false)
    // A lease dated after now (a clock moved back) is stale, so no lease can hold for ever.
    expect(leaseHeldByOther({ session: 'other', at: 2 }, 'me', 1)).toBe(false)
    for (const value of [undefined, null, 'other', { session: 'other' }, { session: 7, at: 0 }, { session: 'other', at: '0' }]) expect(leaseHeldByOther(value, 'me', 1)).toBe(false)
  })

  test('the texts: the switch question names every rule an opt-in then allows; the opt-in question drops its last sentence once the switch is on; a record with no versions says so; Review of a pause with no command offers no line', () => {
    for (const rule of [
      'every hour',
      'with no question per update',
      "the pane's list of recent automatic updates",
      'its old and new versions and the time',
      'does not refresh the local copy',
      'declares a command (a command source or a headers helper)',
      'added again from another source since you opted it in, pauses before claude runs',
      'If claude still shows a command for an update, it is not run',
      'A dependency built by a command is not installed',
      'A failed update pauses too',
      'Turning it off asks nothing',
    ])
      expect(SWITCH_QUESTION).toContain(rule)
    expect(optInQuestion(zzz!, false)).toBe(OPT_IN_ZZZ)
    expect(optInQuestion(zzz!, true)).toBe(OPT_IN_ZZZ.replace(' Auto-update is off: nothing runs until you turn it on.', ''))
    // A project or local row's update runs in its project's folder (actionCwd), so the question names that folder too.
    const ppp = toRow(parseInstalled(JSON.stringify(SCOPED.filter((entry) => entry.id === 'ppp-project@market-a'))).entries[0]!, false)
    expect(optInQuestion(ppp, true)).toContain(
      'Each update runs ["claude","plugin","update","ppp-project@market-a","--scope","project","--json"] in /work/app, with no shell and no -y. A plugin',
    )
    expect(autoUpdatedText(zzz!, undefined, undefined, 0)).toBe(
      'auto-update: zzz-tool@market-a (user scope) updated from an unknown version to an unknown version at 1970-01-01T00:00:00.000Z. It loads in your next session.',
    )
    expect(reviewQuestion(zzz!, { reason: 'the update failed: x', shown: undefined }, undefined)).toBe(
      'Auto-update of zzz-tool (user scope) is paused: the update failed: x Resume lets the next hourly check try it again; if the reason above still holds, it pauses again.',
    )
    // A reason, which can quote claude's error or come from a map written outside the plugin, is shown on one line,
    // printable and capped at PAUSE_REASON_MAX code points, in the note and in Review's question (review of d623b53).
    const forged = `the update failed:\nrun this\u001b[2K\u202e now ${'x'.repeat(PAUSE_REASON_MAX)}`
    const shown = `the update failed: run this?[2K? now ${'x'.repeat(PAUSE_REASON_MAX - 'the update failed: run this?[2K? now '.length - 1)}…`
    expect(Array.from(shown)).toHaveLength(PAUSE_REASON_MAX)
    expect(pausedNote({ reason: forged, shown: undefined })).toBe(`Auto-update paused: ${shown}`)
    expect(reviewQuestion(zzz!, { reason: forged, shown: undefined }, undefined)).toContain(`is paused: ${shown} Resume lets`)
  })
})

// The kit helpers of this file, tested where a flow of the mod cannot show them.
describe('the kit helpers', () => {
  // What idle came to: 'returned', or the text it gave up with.
  const idleOutcome = (w: World): Promise<string> =>
    idle(w).then(
      () => 'returned',
      (error: unknown) => (error instanceof Error ? error.message : String(error)),
    )

  test('idle names the case when it gives up with a signed read as the last thing the world saw, as a flow that reads a switch off and returns leaves it (TRDD-5IK59SQ2)', async (_$, on) => {
    const w = withCatalogs(world(on))
    // The state a store.get of a signed key leaves (the world's store.get handler): nothing the world records follows it.
    w.signedReadAt = otherProgress(w)
    const outcome = await idleOutcome(w)
    expect(outcome).toBe(idleTimeoutText(true))
    expect(outcome).toContain('a signed read with nothing after it')
    w.signedReadAt = undefined
    expect(await idle(w).then(() => 'returned')).toBe('returned')
  })

  test("the pane's switch reads neither set idle's mark nor clear it: alone they leave idle free to return; after a signed read, idle still waits for its digest and names the case when nothing follows (TRDD-5IK59SQ2)", async (_$, on) => {
    // The world's own store.get handler, taken as world() registers it, so the reads below run through it in this order.
    const handlers = new Map<string, (...args: any[]) => any>()
    const capture = (event: string, ...rest: any[]) => {
      handlers.set(event, rest[rest.length - 1])
      return (on as (...args: any[]) => unknown)(event, ...rest)
    }
    const w = withCatalogs(world(capture))
    const get = handlers.get('store.get')!
    const paneReads = (): void => {
      for (const def of MOD_MANAGER_FUNCTIONS) get({}, { key: keyFor(def.id) })
    }
    // Alone, the pane's reads set no mark: a drawing that ends a flow leaves idle free to return.
    paneReads()
    expect(w.signedReadAt).toBeUndefined()
    expect(await idle(w).then(() => 'returned')).toBe('returned')
    get({}, { key: keyFor(AUTO_UPDATE) })
    expect(w.signedReadAt).toBe(otherProgress(w))
    // After a signed read, they leave its mark: its digest may still be running.
    paneReads()
    expect(w.signedReadAt).toBe(otherProgress(w))
    const outcome = await idleOutcome(w)
    expect(outcome).toBe(idleTimeoutText(true))
    // A read of any other key is the read's flow going on: the mark is cleared, and idle returns.
    get({}, { key: AUTO_LOG_KEY })
    expect(await idle(w).then(() => 'returned')).toBe('returned')
  })
})

// The orchestrator's ruling on the review of d623b53: printable shows every format character, lone surrogate and line or
// paragraph separator as '?', as it does a control character, so nothing invisible reaches the person or the model.
describe('printable', () => {
  test('a tag run, a zero-width character, a byte-order mark, a lone surrogate and a line separator are each a ?, and visible text is kept', () => {
    expect(printable('a\u{E0041}\u{E0042}b')).toBe('a??b')
    expect(printable('x\u200by\u200dz\ufeffw')).toBe('x?y?z?w')
    expect(printable('lone \ud800 and \udc00 end')).toBe('lone ? and ? end')
    expect(printable('one\u2028two\u2029three')).toBe('one?two?three')
    expect(printable('bell\u0007 next\u0085 mark\u202e')).toBe('bell? next? mark?')
    expect(printable('café \u{1F600} \u4e2d')).toBe('café \u{1F600} \u4e2d')
  })
})

// C6b (TRDD-5IK59SQ2, PRRD G13.1): each function of the pane switches on and off by itself. The pane reads the switches
// at every drawing and every press, through the registry, and keeps no copy (orchestrator ruling on C6b). A test turns a
// function off by storing its signed off, as /mods-switches or another session writes it.
const offIn = async (w: World, id: string): Promise<void> => {
  w.store.set(keyFor(id), await signed(id, false, 600))
}

/** Settles until `done` holds, for an act a gate leads to (the pane's switch keys are not among idle's signed keys). */
async function until(w: World, done: () => boolean): Promise<void> {
  for (let look = 0; look < 2000 && !done(); look++) await w.clock.settle()
  expect(done()).toBe(true)
}

const paneTexts = async (ui: Mounted<'terminal' | 'desktop'>): Promise<string[]> => (await ui.findAll({ type: 'Text' })).map((text) => String(text.children))
const paneButtons = async (ui: Mounted<'terminal' | 'desktop'>): Promise<string[]> =>
  (await ui.findAll({ type: 'Button' })).map((button) => button.key).filter((key): key is string => key !== undefined)
const listReads = (w: World) => w.calls.filter((call) => call.argv[2] === 'list')
const openPaneOf = (id: string) => ({ id, title: id, isShown: true, isFocused: false, isPlaced: true })
// A store refusal that quotes the home folder over two lines: what the pane shows of it is masked and on one line (review of 5f3fb42).
const UNREADABLE_SWITCH = `the store at ${HOME}/data could not be read\n\tsecond line`
const UNREADABLE_SHOWN = 'mods-expert-developer-plugin: $.store.get: the store at ~/data could not be read second line'
const mountTerminal = ($: any): Promise<Mounted<'terminal' | 'desktop'>> => $.ui.mount(pane('terminal', 160))

describe('C6b: the pane switch', () => {
  for (const args of ['', 'check', 'add /srv/market']) {
    test(`with the pane switch off, /mods-manager ${args === '' ? 'with no argument' : args} opens nothing, reads nothing and says where to turn it on`, async ($, on) => {
      const w = withCatalogs(world(on))
      await offIn(w, FN.pane)
      await start($, 'terminal')
      w.calls = []
      await runCommand($, args)
      await w.clock.settle()
      expect(w.toasts).toEqual([offText(FN.pane)])
      expect(w.opened).toEqual([])
      expect(w.calls).toEqual([])
      expect(w.reads).toEqual([])
    })
  }

  test('with the pane switch off, /mods-manager close still closes the open pane', async ($, on) => {
    const w = withCatalogs(world(on))
    await offIn(w, FN.pane)
    await start($, 'terminal')
    w.panes = [openPaneOf('mod-manager')]
    await runCommand($, 'close')
    expect(w.closes).toEqual(['mod-manager'])
    expect(w.toasts).toEqual([])
  })

  test('an open pane whose switch is turned off draws only the line that says so, with nothing to press; turned on again, it draws its list', async ($, on) => {
    const w = withCatalogs(world(on))
    const ui = await openAndMount($, w, 'pane-off-draw', 'terminal', 160)
    expect(await paneTexts(ui)).toContain('5 installed · 3 active · 2 mods')
    await offIn(w, FN.pane)
    // The pane reads its switches at each drawing, so an off written elsewhere shows at the next one, and not before.
    await ui.redraw()
    expect(await paneTexts(ui)).toEqual([offText(FN.pane)])
    expect(await paneButtons(ui)).toEqual([])
    w.store.set(keyFor(FN.pane), await signed(FN.pane, true, 700))
    // The pane reads its switches at each drawing, so an off written elsewhere shows at the next one, and not before.
    await ui.redraw()
    expect(await paneTexts(ui)).toContain('5 installed · 3 active · 2 mods')
  })

  test('Refresh pressed after the pane switch was turned off in another session reads nothing, says where to turn it on, and the pane draws the line', async ($, on) => {
    const w = withCatalogs(world(on))
    const ui = await openAndMount($, w, 'pane-off-refresh', 'terminal', 160)
    w.calls = []
    w.reads = []
    await offIn(w, FN.pane)
    await ui.press({ key: 'mm-refresh' })
    await until(w, () => w.toasts.length > 0)
    await w.clock.settle()
    expect(w.toasts).toEqual([offText(FN.pane)])
    expect(w.calls).toEqual([])
    expect(await paneTexts(ui)).toEqual([offText(FN.pane)])
  })

  test('Details pressed after the pane switch was turned off reads no plugin.json and opens no details view', async ($, on) => {
    const w = withCatalogs(world(on))
    const ui = await openAndMount($, w, 'pane-off-details', 'terminal', 160)
    await ui.press({ key: 'mm-sec-market-a' })
    await idle(w)
    w.reads = []
    await offIn(w, FN.pane)
    await ui.press({ key: ZZZ_DETAILS })
    await until(w, () => w.toasts.length > 0)
    await w.clock.settle()
    expect(w.toasts).toEqual([offText(FN.pane)])
    expect(w.reads).toEqual([])
    // The session state is the copy of the module the kit loaded, which this file does not share, so the drawing is the
    // check: with the switch on again, the pane draws its list, not a details view.
    w.store.set(keyFor(FN.pane), await signed(FN.pane, true, 700))
    await ui.redraw()
    expect(await ui.find({ key: 'mm-back' })).toBeUndefined()
    expect(await paneTexts(ui)).toContain('5 installed · 3 active · 2 mods')
  })

  test('a session start that finds the pane open with its switch off reads no list, and the pane draws the line that says so', async ($, on) => {
    const w = withCatalogs(world(on))
    await offIn(w, FN.pane)
    w.panes = [openPaneOf('mod-manager')]
    w.session = 'pane-off-start'
    await start($, 'terminal')
    await w.clock.settle()
    expect(listReads(w)).toEqual([])
    // The mod-manager's start reads the pane switch once more than the registry's own start reads every switch (Reload's
    // stands for those reads): Refresh, whose own gate would read it again and say in a toast that the pane is off, is not called.
    const readsOf = (id: string) => w.storeOps.filter((op) => op === `get ${keyFor(id)}`).length
    expect(readsOf(FN.pane)).toBe(readsOf(FN.reload) + 1)
    expect(w.toasts).toEqual([])
    const ui = await mountTerminal($)
    expect(await paneTexts(ui)).toEqual([offText(FN.pane)])
  })

  test('a switch the drawing cannot read hides its function, the safe side, and the pane says why, masked and on one line', async ($, on) => {
    const w = withCatalogs(world(on))
    const ui = await openAndMount($, w, 'pane-unreadable', 'terminal', 160)
    w.failGet = { key: keyFor(FN.pane), occurrence: 1, reason: UNREADABLE_SWITCH }
    // The pane reads its switches at each drawing, so an off written elsewhere shows at the next one, and not before.
    await ui.redraw()
    expect(await paneTexts(ui)).toEqual([switchesUnreadableText(UNREADABLE_SHOWN)])
  })

  test('a press whose switch cannot be read is refused: the toast says why, masked and on one line, nothing is read, and the pane is drawn again', async ($, on) => {
    const w = withCatalogs(world(on))
    const ui = await openAndMount($, w, 'press-unreadable', 'terminal', 160)
    w.calls = []
    w.failGet = { key: keyFor(FN.pane), occurrence: 1, reason: UNREADABLE_SWITCH }
    const mark = w.storeOps.length
    await ui.press({ key: 'mm-refresh' })
    await until(w, () => w.toasts.length > 0)
    expect(w.toasts).toEqual([`${offText(FN.pane)} Its switch could not be read: ${UNREADABLE_SHOWN}`])
    expect(w.calls).toEqual([])
    // The refusal draws the pane again: a drawing reads every switch of the pane, Open's last.
    await until(w, () => w.storeOps.slice(mark).includes(`get ${keyFor(FN.open)}`))
  })

  test('a session start that cannot read the pane switch says why in the debug log, masked and on one line, and reads no list', async ($, on) => {
    const w = withCatalogs(world(on))
    w.panes = [openPaneOf('mod-manager')]
    w.session = 'start-unreadable'
    // The registry's own start reads the switch first; the mod-manager's start reads it second.
    w.failGet = { key: keyFor(FN.pane), occurrence: 2, reason: UNREADABLE_SWITCH }
    await start($, 'terminal')
    await w.clock.settle()
    // The debug log takes the line through maskedLog (cleanMasked): masked, then the line break and the tab one space, as
    // the toast shows them (UNREADABLE_SHOWN), so it stays one line (M4c item 1; before it, each was a '?').
    expect(w.logs.filter((log) => log.text.startsWith('mods-manager: the switch '))).toEqual([
      { text: `mods-manager: the switch ${FN.pane} could not be read, so its function does not run: mods-expert-developer-plugin: $.store.get: the store at ~/data could not be read second line`, to: 'debug' },
    ])
    expect(listReads(w)).toEqual([])
  })
})

describe('add <source> queued by another origin', () => {
  // A remote source is never fetched by the pane: the check only says it cannot be checked, and only the person's c: Copy
  // request copies the request (2j). Queued by the run tool, a model or another plugin, add <remote> therefore runs what an
  // open runs and nothing more (review of 5f3fb42, item 4: the channel R8 closed for the Deck city stays closed here).
  test('add <remote source> from an origin that is not the person reads only what an open reads: nothing is fetched, added or asked, and the pane says the source cannot be checked', async ($, on) => {
    const w = withCatalogs(world(on))
    const origin = { kind: 'plugin', name: 'some-plugin' }
    w.session = 'add-remote-open'
    await start($, 'terminal')
    await idle(w)
    w.calls = []
    await runCommand($, '', origin)
    await idle(w)
    const opened = subcommands(w)
    expect(opened).toContain('list --json')
    w.session = 'add-remote-queued'
    await start($, 'terminal')
    await idle(w)
    w.calls = []
    await runCommand($, `add ${REMOTE}`, origin)
    await idle(w)
    const ui = await mountTerminal($)
    expect(await ui.find({ type: 'Text', text: REMOTE_MESSAGE })).toBeDefined()
    expect(subcommands(w)).toEqual(opened)
    expect(w.asked).toEqual([])
    await ui.unmount()
  })
})

describe('C6b: a switch read error in a toast', () => {
  // The test's own import of the mod, with an engine that has no home folder: the debug log's start cannot read it, so
  // maskedText masks with its generic patterns only (review of 37c09d6). The folders below are none the start of any
  // test reads, so what was read before does not change what this shows.
  test('with the home folder unknown, as when the start could not read it, a home under /Users is masked by its pattern up to a space, and a home elsewhere is shown as it is', async () => {
    defineSwitches(MOD_MANAGER_SWITCHES)
    const toasts: string[] = []
    const engine = {
      env: { get: async () => undefined },
      store: {
        get: async () => {
          throw new Error('the store at /srv/people/ann/data and /Users/alice b/data could not be read')
        },
      },
      ui: { toast: (text: string) => toasts.push(text), invalidate: () => undefined },
    } as unknown as EngineInterface
    const started = await startDebugLog(engine).then(
      () => 'read',
      (error: unknown) => (error instanceof Error ? error.message : String(error)),
    )
    expect(started).toBe('Neither HOME nor USERPROFILE is set, so the profile files cannot be placed.')
    expect(await refusedWhileOff(engine, [FN.pane])).toBe(true)
    expect(toasts).toEqual([`${offText(FN.pane)} Its switch could not be read: the store at /srv/people/ann/data and /Users/<user> b/data could not be read`])
  })
  // The world serves one home folder, with no space in it. Here the test's own import of the mod reads a home with a run
  // of two spaces, so the order is seen: the mask runs before the line is collapsed, or the home is no longer found
  // (review of 5f3fb42, item 1).
  test('is masked before it is made one line, so a home folder with a run of spaces is masked too', async () => {
    defineSwitches(MOD_MANAGER_SWITCHES)
    const home = '/Users/alice  b'
    const toasts: string[] = []
    const engineWith = (shown: string) =>
      ({
        env: { get: async (name: string) => (name === 'HOME' ? shown : undefined) },
        store: {
          get: async () => {
            throw new Error(`the store at ${shown}/data could not be read\n\tsecond line`)
          },
        },
        ui: { toast: (text: string) => toasts.push(text), invalidate: () => undefined },
      }) as unknown as EngineInterface
    try {
      await startDebugLog(engineWith(home))
      expect(await refusedWhileOff(engineWith(home), [FN.pane])).toBe(true)
      expect(toasts).toEqual([`${offText(FN.pane)} Its switch could not be read: the store at ~/data could not be read second line`])
    } finally {
      // The home the world serves, for anything of this import that masks after this test.
      await startDebugLog(engineWith(HOME))
    }
  })
})

/** Turns a function off through the /mods-switches pane, as the person does, so the registry's writer runs in this session. */
async function switchOffInPane($: any, w: World, id: string): Promise<void> {
  const ui = await mountSwitchesPane($)
  await ui.press({ key: 'sw-mod-mods-manager' })
  await ui.press({ key: `sw-${id}` })
  await until(w, () => w.store.has(keyFor(id)))
  await ui.unmount()
}

const marketplaceListed = (w: World) => w.calls.filter((call) => call.argv[2] === 'marketplace' && call.argv[3] === 'list')

describe('C6b: the catalogs and badge switches', () => {
  test('with the catalogs switch off, a read of the list reads no catalog and clears the badge, and the pane draws no arrow, Update or Update all', async ($, on) => {
    const w = withCatalogs(world(on))
    await offIn(w, FN.latest)
    const ui = await openAndMount($, w, 'latest-off', 'terminal', 160)
    await until(w, () => w.statuses.length > 0)
    // The press draws the pane again, and a drawing reads every switch of the pane, Open's last: that read comes after the
    // read of the list and its status line, so what the read did not do is checked once it has run its course.
    const mark = w.storeOps.length
    await ui.press({ key: 'mm-sec-market-a' })
    await until(w, () => w.storeOps.slice(mark).includes(`get ${keyFor(FN.open)}`))
    expect(w.statuses).toEqual([undefined])
    expect(marketplaceListed(w)).toEqual([])
    expect(readsOf(w, CATALOG_A)).toBe(0)
    expect(await updateKeys(ui)).toEqual([])
    expect(await sectionKeys(ui)).toEqual(['mm-sec-all enabled', 'mm-sec-market-a', 'mm-sec-market-b'])
  })

  test('the catalogs switch turned off in another session: the next drawing shows nothing a catalog said, and a section read on demand is not read', async ($, on) => {
    const w = withCatalogs(world(on))
    w.files = { ...CATALOG_FILES, [CATALOG_A]: catalogA('10.0.0', NEW_ENTRIES), [CATALOG_C]: CATALOG_C_TEXT }
    const ui = await openAndMount($, w, 'latest-off-elsewhere', 'terminal', 160)
    await ui.press({ key: 'mm-sec-market-a' })
    await idle(w)
    expect(await updateKeys(ui)).not.toEqual([])
    expect(await copyKeys(ui)).toEqual([`mm-copy-${BBB}`, `mm-copy-${YYY}`])
    expect(await sectionKeys(ui)).toContain('mm-sec-market-c')
    await offIn(w, FN.latest)
    // A press on the section drawn before the off: its catalog is not read. The press draws the pane again, and a drawing
    // reads every switch of the pane, Open's last: that read is the sign the press has run its course.
    const mark = w.storeOps.length
    await ui.press({ key: 'mm-sec-market-c' })
    await until(w, () => w.storeOps.slice(mark).includes(`get ${keyFor(FN.open)}`))
    expect(readsOf(w, CATALOG_C)).toBe(0)
    // The pane reads its switches at each drawing, so the off shows at the next one, and not before.
    await ui.redraw()
    expect(await updateKeys(ui)).toEqual([])
    expect(await copyKeys(ui)).toEqual([])
    expect(await sectionKeys(ui)).toEqual(['mm-sec-all enabled', 'mm-sec-market-a', 'mm-sec-market-b'])
  })

  test('with the badge switch off, the read of the catalogs clears the status line, and the pane still draws the arrows', async ($, on) => {
    const w = withCatalogs(world(on))
    await offIn(w, FN.badge)
    const ui = await openAndMount($, w, 'badge-off', 'terminal', 160)
    await until(w, () => w.statuses.length > 0)
    expect(w.statuses).toEqual([undefined])
    expect(marketplaceListed(w)).toHaveLength(1)
    await ui.press({ key: 'mm-sec-market-a' })
    await idle(w)
    expect(await updateKeys(ui)).not.toEqual([])
  })

  for (const id of [FN.badge, FN.latest]) {
    test(`turning ${id} off in /mods-switches clears the badge at once`, async ($, on) => {
      const w = withCatalogs(world(on))
      await openAndMount($, w, `badge-follow-${id}`, 'terminal', 160)
      await until(w, () => w.statuses.length > 0)
      expect(w.statuses.at(-1)).toBeDefined()
      await switchOffInPane($, w, id)
      await until(w, () => w.statuses.at(-1) === undefined)
    })
  }

  test('the catalogs switch turned off while their read runs: the read that ends after it leaves the badge cleared', async ($, on) => {
    const w = withCatalogs(world(on))
    const gate = deferred()
    w.readHold = { path: CATALOG_A, gate }
    await openAndMount($, w, 'latest-off-during-read', 'terminal', 160)
    // The hold is taken when the read reaches market-a's catalog: the read of the catalogs is under way, the badge not set.
    await until(w, () => w.readHold === undefined)
    expect(w.statuses).toEqual([])
    // Turned off in this session, the follower clears the line at once.
    await switchOffInPane($, w, FN.latest)
    await until(w, () => w.statuses.length === 1)
    gate.resolve()
    // The read ends and sets the line once more: cleared, since the catalogs' switch now reads off where the badge is set.
    await until(w, () => w.statuses.length === 2)
    expect(w.statuses).toEqual([undefined, undefined])
  })

  test('a failed read of the latest versions is logged masked: the home folder in its error shows as ~', async () => {
    // The test's own import of the mod (refresh), with an engine that answers only what a read of an empty list makes: the
    // session lookup of the catalogs' read fails once the list read has read the catalogs' switch, which only that read
    // does here, so the error reaches the catch of readList.
    defineSwitches(MOD_MANAGER_SWITCHES)
    const lines: string[] = []
    let sessionFails = false
    const engine = {
      session: {
        id: async () => {
          if (sessionFails) throw new Error(`the session under ${HOME}/sessions could not be read`)
          return 'latest-catch'
        },
        root: async () => ROOT,
      },
      store: {
        get: async (key: string) => {
          if (key === keyFor(FN.latest)) sessionFails = true
          return undefined
        },
      },
      env: { get: async (name: string) => (name === 'HOME' ? HOME : undefined) },
      fs: {
        exists: async (path: string) => path === CLAUDE,
        stat: async () => ({ kind: 'file' }),
        list: async () => [],
        read: async (path: string) => {
          throw new Error(`ENOENT: ${path}`)
        },
      },
      process: { run: async () => ({ exitCode: 0, stdout: '[]', stderr: '', isStdoutTruncated: false, isStderrTruncated: false }) },
      ui: { toast: () => undefined, invalidate: () => undefined, status: () => undefined, log: (text: string) => lines.push(text) },
    } as unknown as EngineInterface
    await startDebugLog(engine)
    expect(await refresh(engine)).toBe(true)
    const failedLine = (line: string): boolean => line.startsWith('mods-manager: reading the latest versions failed')
    for (let turn = 0; turn < 2_000 && !lines.some(failedLine); turn++) await Promise.resolve()
    expect(lines.filter(failedLine)).toEqual(['mods-manager: reading the latest versions failed: the session under ~/sessions could not be read'])
  })
})
