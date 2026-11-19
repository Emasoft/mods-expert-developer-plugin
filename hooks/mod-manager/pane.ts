// The mod-manager pane: the installed plugins in the order sectionsOf gives (every enabled one on top, mods
// first within each group), one row each with its installed and latest version and the buttons its scope offers, Update
// among them when the row has an update arrow, and Details on every row; over the rows Refresh, Reload, Update all and the
// Auto-update switch, and on each row whose scope offers Update, Auto, with Review once auto-update paused it (2k).
// Details shows one row's details view in place of the list, with Back, Open folder and Open homepage. Under each
// marketplace section, the plugins its catalog lists that are not installed (2f), each with Install and Copy install line; a
// marketplace with no installed row has a section of its own, after those with rows. Over the rows also the add field
// with a: Add marketplace, and c: Copy request once a check found a remote source (2j). Text from outside
// the pane (names, versions, paths, links, claude's lines) is drawn through printable. Only Box, Text, Button and Input,
// and one render path for every surface. Pane buttons carry a hotkey letter in their label; row buttons carry none,
// because a hotkey must be unique within the pane. Thin wiring: decisions are in ./logic.ts.
// Below the rows, the profile list (TRDD-GSR975M8, increment P2a): the saved profiles' names, read-only, behind a button that shows or hides them.
import type { On, RenderElement } from 'claude-code'

import { canAutoUpdate, optInKey, optInsOutsideText, pausedNote, pausesOutsideText } from './auto-update'
import {
  type Action,
  type Available,
  CHECK_TEXT,
  type CatalogView,
  COMMAND,
  NOT_OPEN_TEXT,
  PANE,
  type Row,
  type Section,
  STYLE,
  actionsFor,
  availableDescription,
  availableKey,
  cappedAvailable,
  cappedLines,
  catalogNote,
  catalogsStatus,
  detailLines,
  filterRows,
  fitLabel,
  forcesOpen,
  lockedNote,
  moreAvailableText,
  openTargetOf,
  paneIsOpen,
  parseCommandArgs,
  printable,
  profileLines,
  profilesReadOnly,
  profilesToggleLabel,
  rejectedLines,
  rowHasUpdate,
  rowKey,
  sectionsOf,
  updatableHere,
  updateAllLabel,
  updateNote,
  updateTargets,
  versionLine,
} from './logic'
import {
  checkAddSource,
  confirmAndAct,
  confirmAndInstall,
  confirmAndUpdateAll,
  copyAddRequest,
  copyInstallLine,
  engineAsk,
  hideDetails,
  openFromDetails,
  refresh,
  functionsRead,
  refusedWhileOff,
  reloadPlugins,
  setAddSource,
  setFilter,
  showDetails,
  stateIn,
  reviewPause,
  toggleAutoSwitch,
  toggleOptIn,
  toggleProfiles,
  toggleSection,
  withoutCatalogs,
} from './state'
import { FN, offText, switchesUnreadableText } from './switches'

/** The key of the button that shows or hides the profile list. It starts with neither mm-toggle- nor mm-remove-, the row buttons' keys. */
const PROFILES_KEY = 'mm-profiles'
/** The key of the Box that holds the profile list's lines while it is open. */
const PROFILES_LIST_KEY = 'mm-profiles-list'

/** The key slot and the label of each action's row button: the on/off toggle shares one slot, since a row draws one of the two. */
const BUTTONS: Record<Action, { slot: string; label: string }> = {
  enable: { slot: 'toggle', label: 'Turn on' },
  disable: { slot: 'toggle', label: 'Turn off' },
  update: { slot: 'update', label: 'Update' },
  uninstall: { slot: 'remove', label: 'Uninstall' },
}

export function registerPane(on: On): void {
  on('command.run', { command: COMMAND }, async ($, e) => {
    // 2l: the arguments are nothing or open, close, check and add <source> (parseCommandArgs); anything else is refused
    // with a toast that lists them. None of them changes a plugin or adds a marketplace by itself, because the run tool
    // can queue this command: open and check only read, and every change needs a press and then a confirmation from the
    // person. add <source> opens the pane on the check of that source and asks the question only when the run came from
    // a gesture the engine stamps as the person's own (origin composer, types PromptOrigin: Enter at the prompt, typed or
    // queued, or a click on a transcript link). From any other origin a model or another
    // plugin may have queued it, and a question it opened could be answered by reflex, so the pane shows the source and
    // the check, and the person presses a: Add marketplace for the question. A clicked transcript link is stamped composer
    // too, and a reply of Claude may hold one (not checked), so the guard that holds in every case is the question itself:
    // nothing is added until the person picks Add it.
    const args = parseCommandArgs(e.args)
    if (args.kind === 'refused') {
      $.ui.toast(printable(args.reason))
      return {}
    }
    if (args.kind === 'close') {
      // The pane lookup can be refused, as the session start's can (register.ts): the refusal is shown, never thrown out of
      // the hook, and nothing is closed.
      let open: boolean
      try {
        open = paneIsOpen(await $.ui.panes())
      } catch (error) {
        $.ui.toast(printable(`The open panes could not be listed, so the pane was not closed: ${error instanceof Error ? error.message : String(error)}`))
        return {}
      }
      if (open) await $.ui.close({ id: PANE })
      else $.ui.toast(NOT_OPEN_TEXT)
      return {}
    }
    // The pane's switch (TRDD-5IK59SQ2, C6b): off, nothing of the pane opens or reads, and the toast says where to turn it
    // on; close above works whatever it reads, so an open pane can still be closed.
    if (await refusedWhileOff($, [FN.pane])) return {}
    // The pane always opens on the list, never on a details view left open before it was closed.
    await hideDetails($)
    if (args.kind === 'add') await setAddSource($, args.source)
    await $.ui.open({ id: PANE, title: 'Mods', focus: true, closeOnEscape: true })
    if (args.kind === 'add') {
      const confirm = e.origin.kind === 'composer'
      // The check runs after the read of the list, under its own claim, and not when that read was refused.
      void refresh($).then((read) => (read ? checkAddSource($, engineAsk($), confirm) : undefined))
    } else {
      // check says what the catalogs are: local copies, read with no network (the card's 2l spec).
      void refresh($, args.kind === 'check' ? CHECK_TEXT : '')
    }
    return {}
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const els = $.ui.resolve(e)
    const { Box, Button, Text } = els
    // Every surface this mod targets draws Input; the guard only keeps a surface without it (mobile) from failing.
    const Input = 'Input' in els ? els.Input : undefined
    const read = stateIn(await $.session.id())
    // The switches of the pane's functions, read at every drawing through the registry, never kept (TRDD-5IK59SQ2, C6b).
    // The pane's own switch off: one line that says so and where to turn it on, and nothing to press.
    const { off, unreadable } = await functionsRead($)
    if (off.has(FN.pane)) return Text({ children: [printable(unreadable === undefined ? offText(FN.pane) : switchesUnreadableText(unreadable))] })
    // The catalogs' switch off: nothing a catalog said is drawn, not the latest versions, the arrows, Update, Update all,
    // the plugins not installed or the marketplaces known only from a catalog (withoutCatalogs).
    const state = off.has(FN.latest) ? withoutCatalogs(read) : read
    // The bracketed label's room: the body width less the brackets and their spaces.
    const room = e.props.bodyColumns - 4
    // The details view (2i) takes the place of the list while its row is listed; once a read of the list drops the row,
    // the list is drawn again. The list's r, l and u buttons and its filter field are not drawn here, so the view's own
    // hotkeys b, o and h collide with none of them.
    const details = state.details
    const detailsRow = details === undefined ? undefined : state.rows.find((row) => rowKey(row) === details.key)
    if (details !== undefined && detailsRow !== undefined) {
      const entry = state.catalogAbout?.get(detailsRow.id)
      // The state of the catalogs for the view: latest is cleared while a read runs, so latestRead is what tells a read again from the first one.
      const catalogs = catalogsStatus(state.latest !== undefined, state.readingLatest, state.latestRead)
      // The view draws Open folder and Open homepage only for a target a press can open (openTargetOf), and the press
      // works the target out again from the state, so it opens only what a button was drawn for.
      const folder = openTargetOf(detailsRow, 'folder', entry, details.manifest)
      const link = openTargetOf(detailsRow, 'link', entry, details.manifest)
      return Box({
        flexDirection: 'column',
        rowGap: 1,
        children: [
          // The name comes from the list, so it goes through printable, as a row's name does.
          Text({ bold: true, wrap: 'truncate-end', children: [printable(`${detailsRow.name}${detailsRow.isMod ? ' · mod' : ''} · ${detailsRow.enabled ? 'on' : 'off'}`)] }),
          // The busy line and the message stay in view: when no program opens a target and the copy fails, the message
          // names the path or the link.
          ...(state.busy === undefined ? [] : [Text({ dimColor: true, children: [printable(state.busy)] })]),
          ...(state.message === '' ? [] : [Text({ children: [printable(state.message)] })]),
          Box({
            flexDirection: 'row',
            flexWrap: 'wrap',
            columnGap: 1,
            children: [
              Button({ key: 'mm-back', label: fitLabel('b: Back to the list', room), hotkey: 'b', onPress: () => void hideDetails($) }),
              ...(folder === undefined
                ? []
                : [Button({ key: 'mm-open-folder', label: fitLabel('o: Open folder', room), hotkey: 'o', onPress: (press) => void openFromDetails($, detailsRow, 'folder', press.surface) })]),
              ...(link?.kind !== 'link'
                ? []
                : [Button({ key: 'mm-open-link', label: fitLabel(`h: Open ${link.field}`, room), hotkey: 'h', onPress: (press) => void openFromDetails($, detailsRow, 'link', press.surface) })]),
            ],
          }),
          // Each line holds text from the list, a catalog or a plugin.json, and comes through printable (detailLines). It
          // wraps rather than being cut, so the whole folder and the whole link can be read.
          ...detailLines(detailsRow, state.latest?.get(detailsRow.id), catalogs, entry, details).map((text) => Text({ children: [text] })),
        ],
      })
    }
    const active = state.rows.filter((row) => row.enabled).length
    const mods = state.rows.filter((row) => row.isMod).length
    // A read that finished without a plugin and with a message is a failed read, not an empty list.
    const empty = state.loaded && state.rows.length === 0
    const header = !state.loaded
      ? 'Reading the installed plugins…'
      : empty && state.message !== ''
        ? 'The installed plugins could not be read.'
        : `${state.rows.length} installed · ${active} active · ${mods} ${mods === 1 ? 'mod' : 'mods'}`
    const filtering = state.filter.trim() !== ''
    // The filter has something to match when the pane lists a row or a marketplace with a local copy, whose plugins not
    // installed the filter finds too (2f): with no installed plugin the field is still drawn, so the line that says to type
    // part of a name in the filter can be followed (TRDD-R2QYIN8O, 2f-R1 (1)).
    const listsSomething = state.rows.length > 0 || state.localMarketplaces.length > 0
    // The same condition draws the field and the count line, so the count never shows without a field to explain it.
    const fieldShown = Input !== undefined && listsSomething
    // Sections are forced open only by a filter of 2 or more characters (see forcesOpen); toggleSection ignores presses then.
    const open = forcesOpen(state.filter)
    const shown = filterRows(state.rows, state.filter)
    const updating = updateTargets(state.rows, state.latest, state.filter)
    const top: RenderElement[] = [
      Text({ bold: true, children: [header] }),
      // The busy text can name a row, text from the list, so it goes through printable, as the message does (2h part 1).
      ...(state.busy === undefined ? [] : [Text({ dimColor: true, children: [printable(state.busy)] })]),
      // The message holds claude's own error line when a change or a read fails: text from outside, so it goes through
      // printable, as the Update all report does (2e review state/F1).
      ...(state.message === '' ? [] : [Text({ children: [printable(state.message)] })]),
      // A switch the drawing could not read hides its function, the safe side, and says why; the reason is outside text.
      ...(unreadable === undefined ? [] : [Text({ ...STYLE.problem, children: [printable(switchesUnreadableText(unreadable))] })]),
      // The first few entries of the list that could not be read, one line each, then a count of the rest (rejectedLines);
      // each line is cut at the pane's edge, and the debug log names every entry in full.
      ...rejectedLines(state.rejected).map((text) => Text({ wrap: 'truncate-end', children: [text] })),
      // The latest versions are read in the background (state.ts readLatest): a dim line while it runs, and one line for each
      // marketplace file it could not read (the first few, then a count), each cut at the pane's edge. The rows never wait.
      ...(state.readingLatest ? [Text({ dimColor: true, children: ['Reading the marketplace catalogs…'] })] : []),
      ...cappedLines(state.latestProblems).map((text) => Text({ wrap: 'truncate-end', children: [text] })),
      // The report of the last Update all: its count of each outcome, then one line per row, the failures first, cut at the
      // pane's edge; the first few, then a count of the rest, each of which the debug log names (state.ts confirmAndUpdateAll).
      ...(state.updateReport === undefined
        ? []
        : [
            Text({ wrap: 'truncate-end', children: [state.updateReport.summary] }),
            ...cappedLines(state.updateReport.lines).map((text) => Text({ wrap: 'truncate-end', children: [text] })),
          ]),
      // A change applies in the next session, or after /reload-plugins in this one (plugin commands chapter, line 269 for an
      // update, line 849 for every pending change), which Reload runs. The line stays after a reload this copy hears back
      // from, because such a reload did not replace the module, so it may not have applied (state.ts runReload).
      ...(state.needsRestart ? [Text({ dimColor: true, children: ['Changes apply in your next session, or after a reload.'] })] : []),
      Button({ key: 'mm-refresh', label: 'r: Refresh', hotkey: 'r', onPress: () => void refresh($) }),
      // Always drawn, as the standalone mod-manager's Reload key is: it also applies a change made outside the pane, such as
      // a claude plugin command run in a terminal (plugin commands chapter, line 851). l, because r and u are taken and a
      // hotkey is one digit or one lowercase letter (types, ButtonProps hotkey).
      Button({ key: 'mm-reload', label: fitLabel('l: Reload plugins', room), hotkey: 'l', onPress: () => void reloadPlugins($) }),
      // 2k: the switch of auto-update, off by default; turning it on asks first (state.ts toggleAutoSwitch). No hotkey: the
      // letters that read well are taken. Its own element, so the function can be switched off here (TRDD-5IK59SQ2).
      Button({ key: 'mm-auto-switch', label: fitLabel(state.auto.on ? 'Auto-update: on' : 'Auto-update: off', room), onPress: () => void toggleAutoSwitch($, engineAsk($)) }),
      // A1: opt-ins or pauses stored without this plugin's signature are said here; the opt-ins then count as none.
      ...(state.auto.optInsOutside ? [Text({ ...STYLE.problem, children: [optInsOutsideText] })] : []),
      ...(state.auto.pausesOutside ? [Text({ ...STYLE.problem, children: [pausesOutsideText] })] : []),
      // 2k: the records of the last automatic updates and pauses, made by any session (state.ts leaveRecord), newest last and
      // wrapped, so the time at the end of each stays readable; the store keeps AUTO_LOG_SIZE (coordinator review of M4b, 6).
      ...(state.auto.records.length === 0
        ? []
        : [Text({ dimColor: true, children: ['Recent automatic updates:'] }), ...state.auto.records.map((text) => Text({ dimColor: true, children: [printable(text)] }))]),
      // Drawn once the catalogs are read and a row draws Update; the count and the run read one list (updateTargets).
      ...(updating.length === 0
        ? []
        : [Button({ key: 'mm-update-all', label: fitLabel(updateAllLabel(updating.length), room), hotkey: 'u', onPress: () => void confirmAndUpdateAll($, engineAsk($)) })]),
      // The value comes from session state, so a redraw never clears the field. Typing only stores the text and redraws; it never calls claude.
      ...(!fieldShown
        ? []
        : [
            Input({
              key: 'mm-filter',
              placeholder: 'Filter: name, marketplace or "mod"',
              value: state.filter,
              onInput: (text: string) => void setFilter($, text),
              onSubmit: () => undefined,
            }),
          ]),
      ...(filtering && fieldShown ? [Text({ dimColor: true, children: [`${shown.length} of ${state.rows.length} shown`] })] : []),
      // 2j: the add field, drawn wherever Input is, even with nothing installed, since a marketplace can be added to an empty
      // list. Typing only stores the text and redraws; only a press of a: Add marketplace checks it, and nothing is added
      // before the person confirms. On a surface with no Input, a source the command's add form set is drawn as text,
      // whole and through printable, and the button is drawn for it, so the check and its question work there too.
      ...(Input === undefined
        ? state.addSource === ''
          ? []
          : [Text({ dimColor: true, children: [printable(`Marketplace to add: ${state.addSource}`)] })]
        : [
            Input({
              key: 'mm-add',
              placeholder: 'Add a marketplace: its folder (/…), owner/repo or URL',
              value: state.addSource,
              onInput: (text: string) => void setAddSource($, text),
              onSubmit: () => undefined,
            }),
          ]),
      // a, because r, l, u and p are the list's other hotkeys and b, o and h the details view's (a hotkey must be unique in the pane).
      ...(Input === undefined && state.addSource === ''
        ? []
        : [Button({ key: 'mm-add-marketplace', label: fitLabel('a: Add marketplace', room), hotkey: 'a', onPress: () => void checkAddSource($, engineAsk($)) })]),
      // Drawn only after a check found a remote source; the press copies the request for that source, from the state.
      ...(state.addRemote === undefined
        ? []
        : [Button({ key: 'mm-add-copy', label: fitLabel('c: Copy request', room), hotkey: 'c', onPress: (press) => void copyAddRequest($, press.surface) })]),
    ]
    // A row draws the buttons it offers (actionsFor) and, under them, the note lockedNote gives: why it offers none, or,
    // for a skills-folder plugin, which has no Uninstall, how to remove it. Either can be drawn without the other.
    const rowBox = (row: Row): RenderElement => {
      const latest = state.latest?.get(row.id)
      // Update is drawn only on a row with an update arrow whose update the pane can run (updatableHere), and only where
      // the row's scope offers it (actionsFor); a row whose update needs the person's terminal draws updateNote instead.
      const updatable = updatableHere(row, latest)
      const offered = actionsFor(row, updatable)
      const note = lockedNote(row, updatable)
      const terminalNote = updateNote(row, latest)
      // 2k: whether the row has opted in to auto-update, and its pause, under the key the store keeps them by (optInKey).
      const autoOn = state.auto.optIns.has(optInKey(row))
      const paused = state.auto.pauses.get(optInKey(row))
      return Box({
        key: `mm-row-${rowKey(row)}`,
        flexDirection: 'column',
        children: [
          Box({
            flexDirection: 'row',
            flexWrap: 'wrap',
            columnGap: 1,
            children: [
              // The name comes from the list, text from outside the pane, so it goes through printable (2h part 1).
              Text({ bold: true, wrap: 'truncate-end', children: [printable(row.name)] }),
              ...(row.isMod ? [Text({ children: ['mod'] })] : []),
              Text({ dimColor: true, children: [row.enabled ? 'on' : 'off'] }),
            ],
          }),
          // The version the row loads (loadedVersion), then, once the catalogs are read, the latest one (versionLine). A row
          // with an update arrow is drawn at full strength, so the arrow stands out among the dim lines of the other rows.
          Text({ dimColor: !rowHasUpdate(row, latest), wrap: 'truncate-end', children: [versionLine(row, latest)] }),
          // The row's buttons: those it offers (actionsFor), then Details, which every row draws, since the details view
          // changes nothing (TRDD-R2QYIN8O, 2i).
          Box({
            flexDirection: 'row',
            flexWrap: 'wrap',
            columnGap: 1,
            children: [
              ...offered.map((action) =>
                Button({
                  key: `mm-${BUTTONS[action].slot}-${rowKey(row)}`,
                  label: fitLabel(BUTTONS[action].label, room),
                  onPress: () => void confirmAndAct($, row, action, engineAsk($)),
                }),
              ),
              Button({ key: `mm-details-${rowKey(row)}`, label: fitLabel('Details', room), onPress: () => void showDetails($, row) }),
              // 2k: Auto opts the row in or out of auto-update, on a row whose scope offers Update (canAutoUpdate). It is its
              // own element, so the function can be switched off in this one place (TRDD-5IK59SQ2).
              ...(!canAutoUpdate(row)
                ? []
                : [Button({ key: `mm-auto-${rowKey(row)}`, label: fitLabel(autoOn ? 'Auto: on' : 'Auto: off', room), onPress: () => void toggleOptIn($, row, engineAsk($)) })]),
              // A paused row (2k) draws Review, which shows why and offers the line that accepts a command claude showed.
              ...(paused === undefined
                ? []
                : [Button({ key: `mm-auto-review-${rowKey(row)}`, label: fitLabel('Review', room), onPress: (press) => void reviewPause($, row, press.surface, engineAsk($)) })]),
            ],
          }),
          ...(note === undefined ? [] : [Text({ dimColor: true, children: [note] })]),
          // A row with an arrow whose update claude must ask the person about says to update it from their own terminal.
          ...(terminalNote === undefined ? [] : [Text({ dimColor: true, children: [terminalNote] })]),
          ...(paused === undefined ? [] : [Text({ dimColor: true, children: [pausedNote(paused)] })]),
        ],
      })
    }
    // 2f: a plugin its catalog lists that is installed in no scope. Install installs it after a question (state.ts
    // confirmAndInstall, owner question 4) and Copy install line copies its install line, for the person's own terminal; it
    // has none of a row's actions, no version line and no Details, and no part in the badge or Update all, which read the
    // rows only. Its key is its id, then its marketplace (availableKey), with its own prefix, so it never equals a row's key.
    const availableBox = (entry: Available): RenderElement => {
      const description = availableDescription(entry)
      return Box({
        key: `mm-avail-${availableKey(entry)}`,
        flexDirection: 'column',
        children: [
          Box({
            flexDirection: 'row',
            flexWrap: 'wrap',
            columnGap: 1,
            children: [
              // The name is the catalog author's text: it is shown only when it passes PLUGIN_ID, and through printable all the same.
              Text({ bold: true, wrap: 'truncate-end', children: [printable(entry.name)] }),
              Text({ dimColor: true, children: ['not installed'] }),
            ],
          }),
          // The description is the catalog author's text too, cut and through printable (availableDescription), on one line.
          ...(description === undefined ? [] : [Text({ dimColor: true, wrap: 'truncate-end', children: [description] })]),
          Box({
            flexDirection: 'row',
            flexWrap: 'wrap',
            columnGap: 1,
            children: [
              // Install is its own element, so the function can be switched off in this one place (TRDD-5IK59SQ2).
              Button({ key: `mm-install-${availableKey(entry)}`, label: fitLabel('Install', room), onPress: (press) => void confirmAndInstall($, entry, press.surface, engineAsk($)) }),
              Button({ key: `mm-copy-${availableKey(entry)}`, label: fitLabel('Copy install line', room), onPress: (press) => void copyInstallLine($, entry, press.surface) }),
            ],
          }),
        ],
      })
    }
    // What a marketplace section draws of its catalog under its rows: the line about a catalog read on demand (catalogNote),
    // then its plugins not installed, the first few by name, then a count of the rest (cappedAvailable).
    const catalogPart = (section: Section): RenderElement[] => {
      if (section.catalog === undefined) return []
      const note = catalogNote(section.catalog)
      const { shown: drawn, more } = cappedAvailable(section.catalog.entries)
      return [
        ...(note === undefined ? [] : [Text({ dimColor: true, children: [note] })]),
        ...drawn.map(availableBox),
        ...(more === 0 ? [] : [Text({ dimColor: true, children: [moreAvailableText(more)] })]),
      ]
    }
    // What the pane knows of the catalogs (2f). A marketplace counts as installed by every row, not only the rows the filter shows.
    const view: CatalogView = {
      marketplaces: state.localMarketplaces.map((marketplace) => marketplace.name),
      withRows: new Set(state.rows.map((row) => row.marketplace)),
      listings: state.listings,
      installed: state.installedIds,
      query: state.filter,
    }
    // A section is a header Button that toggles session state: there is no collapse element, and a collapsed section draws only its header.
    // While a filter of 2 or more characters is set every section is drawn open, or a match inside a collapsed section would be hidden; the person's own expanded set is untouched and applies again when the filter is cleared.
    const sections = sectionsOf(shown, view).flatMap((section): RenderElement[] => [
      Button({
        key: `mm-sec-${section.key}`,
        label: fitLabel(section.label, room),
        onPress: () => void toggleSection($, section.key),
      }),
      ...(open || state.expanded.has(section.key) ? [...section.rows.map(rowBox), ...catalogPart(section)] : []),
    ])
    // After a failed read, or with an entry it could not read, an empty list does not show that nothing is installed. The
    // sections of the marketplaces with no installed row are drawn under it all the same (2f). A filter that matches
    // nothing says so whenever the pane lists something to match, a marketplace with a local copy included (2f-R1 (1)).
    const body: RenderElement[] = [
      ...(empty && state.message === '' && state.rejected.length === 0 ? [Text({ dimColor: true, children: ['No plugins are installed.'] })] : []),
      ...(filtering && listsSomething && sections.length === 0 ? [Text({ dimColor: true, children: ['No plugin matches.'] })] : []),
      ...sections,
    ]
    // The profile list, below the plugin rows: a button that shows or hides it, then, while it is open, its lines
    // (profileLines), each drawn with the look its STYLE token gives. It starts closed and sits under the rows, so the
    // pane above it looks as it did (review of 2026-10-31, should-fix 3). Read-only: no button here makes, changes or
    // applies a profile (spec section 9, P2a).
    const profiles: RenderElement[] = [
      Button({ key: PROFILES_KEY, label: fitLabel(profilesToggleLabel(state.profilesShown, STYLE), room), hotkey: STYLE.toggleKey, onPress: () => void toggleProfiles($) }),
      ...(!state.profilesShown
        ? []
        : [
            Box({
              key: PROFILES_LIST_KEY,
              flexDirection: 'column',
              children: profileLines(state.profiles, profilesReadOnly(state.changePath), STYLE).map((line) => Text({ ...line.look, wrap: line.wrap, children: [line.text] })),
            }),
          ]),
    ]
    return Box({ flexDirection: 'column', rowGap: 1, children: [...top, ...body, ...profiles] })
  })
}
