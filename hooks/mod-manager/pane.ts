// The mod-manager pane: the installed plugins in the order sectionsOf gives (every enabled one on top, mods
// first within each group), one row each with the buttons its scope offers. Only Box, Text and Button, and one render
// path for every surface. Pane buttons carry a hotkey letter in their label; row buttons carry none,
// because a hotkey must be unique within the pane. Thin wiring: decisions are in ./logic.ts.
import type { On, RenderElement } from 'claude-code'

import { type Action, COMMAND, PANE, type Row, actionsFor, filterRows, fitLabel, forcesOpen, lockedNote, rejectedLines, sectionsOf } from './logic'
import { confirmAndAct, engineAsk, refresh, setFilter, stateIn, toggleSection } from './state'

const rowKey = (row: Row): string => `${row.id}|${row.scope}`

/** The key slot and the label of each action's row button: the on/off toggle shares one slot, since a row draws one of the two. */
const BUTTONS: Record<Action, { slot: string; label: string }> = {
  enable: { slot: 'toggle', label: 'Turn on' },
  disable: { slot: 'toggle', label: 'Turn off' },
  uninstall: { slot: 'remove', label: 'Uninstall' },
}

export function registerPane(on: On): void {
  on('command.run', { command: COMMAND }, async ($) => {
    // The command takes no arguments on purpose: the run tool can queue it, and the only thing it does is
    // open the pane, where every change needs a press and then a confirmation from the person.
    await $.ui.open({ id: PANE, title: 'Mods', focus: true, closeOnEscape: true })
    void refresh($)
    return {}
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const els = $.ui.resolve(e)
    const { Box, Button, Text } = els
    // Every surface this mod targets draws Input; the guard only keeps a surface without it (mobile) from failing.
    const Input = 'Input' in els ? els.Input : undefined
    const state = stateIn(await $.session.id())
    // The bracketed label's room: the body width less the brackets and their spaces.
    const room = e.props.bodyColumns - 4
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
    // The same condition draws the field and the count line, so the count never shows without a field to explain it.
    const fieldShown = Input !== undefined && state.rows.length > 0
    // Sections are forced open only by a filter of 2 or more characters (see forcesOpen); toggleSection ignores presses then.
    const open = forcesOpen(state.filter)
    const shown = filterRows(state.rows, state.filter)
    const top: RenderElement[] = [
      Text({ bold: true, children: [header] }),
      ...(state.busy === undefined ? [] : [Text({ dimColor: true, children: [state.busy] })]),
      ...(state.message === '' ? [] : [Text({ children: [state.message] })]),
      // The first few entries of the list that could not be read, one line each, then a count of the rest (rejectedLines);
      // each line is cut at the pane's edge, and the debug log names every entry in full.
      ...rejectedLines(state.rejected).map((text) => Text({ wrap: 'truncate-end', children: [text] })),
      ...(state.needsRestart ? [Text({ dimColor: true, children: ['Changes apply in your next session.'] })] : []),
      Button({ key: 'mm-refresh', label: 'r: Refresh', hotkey: 'r', onPress: () => void refresh($) }),
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
    ]
    // A row draws the buttons it offers (actionsFor) and, under them, the note lockedNote gives: why it offers none, or,
    // for a skills-folder plugin, which has no Uninstall, how to remove it. Either can be drawn without the other.
    const rowBox = (row: Row): RenderElement => {
      const offered = actionsFor(row)
      const note = lockedNote(row)
      return Box({
        key: `mm-row-${rowKey(row)}`,
        flexDirection: 'column',
        children: [
          Box({
            flexDirection: 'row',
            flexWrap: 'wrap',
            columnGap: 1,
            children: [
              Text({ bold: true, wrap: 'truncate-end', children: [row.name] }),
              ...(row.isMod ? [Text({ children: ['mod'] })] : []),
              Text({ dimColor: true, children: [row.enabled ? 'on' : 'off'] }),
            ],
          }),
          Text({ dimColor: true, wrap: 'truncate-end', children: [`${row.version ?? 'no version'} · ${row.marketplace} · ${row.scope} scope`] }),
          ...(offered.length === 0
            ? []
            : [
                Box({
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  columnGap: 1,
                  children: offered.map((action) =>
                    Button({
                      key: `mm-${BUTTONS[action].slot}-${rowKey(row)}`,
                      label: fitLabel(BUTTONS[action].label, room),
                      onPress: () => void confirmAndAct($, row, action, engineAsk($)),
                    }),
                  ),
                }),
              ]),
          ...(note === undefined ? [] : [Text({ dimColor: true, children: [note] })]),
        ],
      })
    }
    // A section is a header Button that toggles session state: there is no collapse element, and a collapsed section draws only its header.
    // While a filter of 2 or more characters is set every section is drawn open, or a match inside a collapsed section would be hidden; the person's own expanded set is untouched and applies again when the filter is cleared.
    const sections = sectionsOf(shown).flatMap((section): RenderElement[] => [
      Button({
        key: `mm-sec-${section.key}`,
        label: fitLabel(section.label, room),
        onPress: () => void toggleSection($, section.key),
      }),
      ...(open || state.expanded.has(section.key) ? section.rows.map(rowBox) : []),
    ])
    // After a failed read, or with an entry it could not read, an empty list does not show that nothing is installed.
    const body: RenderElement[] = empty
      ? state.message === '' && state.rejected.length === 0
        ? [Text({ dimColor: true, children: ['No plugins are installed.'] })]
        : []
      : filtering && shown.length === 0
        ? [Text({ dimColor: true, children: ['No plugin matches.'] })]
        : sections
    return Box({ flexDirection: 'column', rowGap: 1, children: [...top, ...body] })
  })
}
