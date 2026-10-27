// The mod-manager pane: the installed plugins in the order orderRows gives (the active ones on top, mods
// first within each group), one row each with its own buttons. Only Box, Text and Button, and one render
// path for every surface. Pane buttons carry a hotkey letter in their label; row buttons carry none,
// because a hotkey must be unique within the pane. Thin wiring: decisions are in ./logic.ts.
import type { On, RenderElement } from 'claude-code'

import { COMMAND, PANE, type Row, fitLabel } from './logic'
import { confirmAndAct, engineAsk, refresh, stateIn } from './state'

const rowKey = (row: Row): string => `${row.id}|${row.scope}`

export function registerPane(on: On): void {
  on('command.run', { command: COMMAND }, async ($) => {
    // The command takes no arguments on purpose: the run tool can queue it, and the only thing it does is
    // open the pane, where every change needs a press and then a confirmation from the person.
    await $.ui.open({ id: PANE, title: 'Mods', focus: true, closeOnEscape: true })
    void refresh($)
    return {}
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
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
    const top: RenderElement[] = [
      Text({ bold: true, children: [header] }),
      ...(state.busy === undefined ? [] : [Text({ dimColor: true, children: [state.busy] })]),
      ...(state.message === '' ? [] : [Text({ children: [state.message] })]),
      ...(state.needsRestart ? [Text({ dimColor: true, children: ['Changes apply in your next session.'] })] : []),
      Button({ key: 'mm-refresh', label: 'r: Refresh', hotkey: 'r', onPress: () => void refresh($) }),
    ]
    const rows = state.rows.map((row) =>
      Box({
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
          Box({
            flexDirection: 'row',
            flexWrap: 'wrap',
            columnGap: 1,
            children: [
              Button({
                key: `mm-toggle-${rowKey(row)}`,
                label: fitLabel(row.enabled ? 'Turn off' : 'Turn on', room),
                onPress: () => void confirmAndAct($, row, row.enabled ? 'disable' : 'enable', engineAsk($)),
              }),
              Button({ key: `mm-remove-${rowKey(row)}`, label: fitLabel('Uninstall', room), onPress: () => void confirmAndAct($, row, 'uninstall', engineAsk($)) }),
            ],
          }),
        ],
      }),
    )
    const body: RenderElement[] = empty
      ? state.message === ''
        ? [Text({ dimColor: true, children: ['No plugins are installed.'] })]
        : []
      : rows
    return Box({ flexDirection: 'column', rowGap: 1, children: [...top, ...body] })
  })
}
