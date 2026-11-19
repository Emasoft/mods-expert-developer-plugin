// The /self-command pane (TRDD-GF5UDFWI A2): the run tool's queue and history, the session's slash
// commands grouped by source with a search box (a press puts the command in the prompt box), and a
// form that creates a markdown command. Behind its own switch, like each tool. Thin wiring: decisions are in
// ./logic.ts. Only elements both the terminal and the Desktop app draw (Box, Text, Button, Input,
// Select), one render path for every surface, bracketed buttons whose label names their letter.
import type { CommandInfo, EngineInterface, On, RenderElement } from 'claude-code'

import { logEvent, maskedLine } from '../debug-log/register'
import { DEV_TOOLS_OFF, PANE as PANE_SWITCH } from '../dev-tools'
import { printable } from '../mod-manager/logic'
import { isOn } from '../switches/register'
import {
  type CommandDraft,
  EMPTY_DRAFT,
  HISTORY_KEY,
  commandDescription,
  commandFile,
  listFailure,
  draftTarget,
  fitLabel,
  groupBySource,
  historyLine,
  historyOf,
  isRefused,
  matching,
  shown,
} from './logic'
import { queuedFor } from './queue'

const PANE = 'self-command'
type View = 'commands' | 'history' | 'new'
type PaneState = { view: View; query: string; draft: CommandDraft }
const INITIAL: PaneState = { view: 'commands', query: '', draft: EMPTY_DRAFT }

// Module memory per session: $.state would need a types
// contract in the manifest. A reload empties it, which only resets the view, the search and the form.
const stateBySession = new Map<string, PaneState>()

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error))

/** Read-only: a render never creates an entry. */
async function stateOf($: EngineInterface): Promise<PaneState> {
  return stateBySession.get(await $.session.id()) ?? INITIAL
}

// The command list as read when the pane opened, per session. A pane drawn without the command (a
// reload with the pane open) reads it once here and keeps it until the next open.
const commandsBySession = new Map<string, readonly CommandInfo[]>()

async function commandsOf($: EngineInterface, session: string): Promise<readonly CommandInfo[]> {
  const cached = commandsBySession.get(session)
  if (cached !== undefined) return cached
  const read = await $.command.list()
  commandsBySession.set(session, read)
  return read
}

async function update($: EngineInterface, change: (s: PaneState) => PaneState): Promise<void> {
  const session = await $.session.id()
  stateBySession.set(session, change(stateBySession.get(session) ?? INITIAL))
  $.ui.invalidate('ui.render')
}

/**
 * Whether the pane's switch is off; if so, a toast says it and the pane is drawn again. A pane drawn before its switch
 * went off in another session is not drawn again here ($.ui.invalidate reaches only its own session), so its buttons
 * still press: each press that acts outside the pane reads the switch first (review of 01cc4d8).
 */
async function refusedWhileOff($: EngineInterface): Promise<boolean> {
  if (await isOn($, PANE_SWITCH)) return false
  $.ui.toast(DEV_TOOLS_OFF)
  $.ui.invalidate('ui.render')
  return true
}

/** Puts `/<name> ` in the prompt box; a box that did not take it says so in a toast. */
async function fill($: EngineInterface, name: string): Promise<void> {
  if (await refusedWhileOff($)) return
  const filled = await $.prompt.fill({ text: `/${name} ` })
  if (!filled.isFilled) $.ui.toast(maskedLine(`The prompt box did not take /${name}${filled.refusal === undefined ? '' : ` (${filled.refusal})`}.`))
}

/**
 * Saves the form as .claude/commands/<name>.md in the project (the session root) or the user's
 * home. Every failure reaches the person as a toast and the log, never as an engine error on a
 * press. The clash check reads the command list afresh, not the pane's cached copy: a save is one
 * press, and a command added since the pane opened must still count.
 */
async function saveCommand($: EngineInterface): Promise<void> {
  try {
    if (await refusedWhileOff($)) return
    const draft = (await stateOf($)).draft
    const base = draft.scope === 'user' ? await $.env.get('HOME') : await $.session.root()
    const target = draftTarget(draft, await $.command.list(), base)
    if ('problem' in target) {
      $.ui.toast(maskedLine(target.problem))
      return
    }
    // $.fs offers no exclusive create, so this check is the last step before the write and nothing
    // else is awaited between them. A file another process creates in that gap is still overwritten:
    // the race is narrowed, not closed.
    if (await $.fs.exists(target.path)) {
      $.ui.toast(maskedLine(`Not saved: ${target.path} already exists.`))
      return
    }
    await $.fs.write(target.path, commandFile(draft))
    // Into this open's cached list at once: the pane shows the new command without a reopen, while
    // Claude Code itself lists it only once it reads the folder again.
    const session = await $.session.id()
    const listed = await commandsOf($, session)
    commandsBySession.set(session, [...listed, { name: target.name, description: commandDescription(draft), source: 'user' }])
    await update($, (s) => ({ ...s, draft: { ...EMPTY_DRAFT, scope: draft.scope } }))
    $.ui.toast(maskedLine(`Saved /${target.name} as ${target.path}. It shows in the / menu once Claude Code reads the folder again.`))
  } catch (error) {
    logEvent($, 'self-command', `self-command: saving a command failed: ${messageOf(error)}`)
    $.ui.toast(maskedLine(`Not saved: ${messageOf(error)}`))
  }
}

/** Called by startSelfCommand while the pane's switch is on, after the tools: the pane's command registers last. */
export async function registerPaneCommand($: EngineInterface): Promise<void> {
  // A literal name here and in the matcher below, so claude plugin validate can pair them.
  await $.command.register({ name: 'self-command', description: 'Open the slash command pane: queue, history, search, create' })
}

export function registerPane(on: On): void {
  on('command.run', { command: 'self-command' }, async ($) => {
    if (!(await isOn($, PANE_SWITCH))) return { text: DEV_TOOLS_OFF }
    // One read of the command list per open; redraws and search keystrokes reuse it.
    // Re-thrown with its cause named, never swallowed: a pane without its list would mislead. The
    // engine then skips this hook and reports the message, so /self-command opens nothing.
    const session = await $.session.id()
    let commands: readonly CommandInfo[]
    try {
      commands = await $.command.list()
    } catch (error) {
      throw new Error(listFailure(error))
    }
    commandsBySession.set(session, commands)
    await $.ui.open({ id: PANE, title: 'Slash commands', focus: true, closeOnEscape: true })
    return {}
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const els = $.ui.resolve(e)
    const { Box, Button, Text } = els
    // Every surface this mod targets draws Input and Select; the guard only keeps a surface without
    // them (mobile) from failing, and says why there.
    const Input = 'Input' in els ? els.Input : undefined
    const Select = 'Select' in els ? els.Select : undefined
    if (!(await isOn($, PANE_SWITCH))) return Text({ dimColor: true, children: [DEV_TOOLS_OFF] })
    const session = await $.session.id()
    const state = await stateOf($)
    const commands = await commandsOf($, session)
    // The bracketed label's room: the body width less the brackets and their spaces.
    const room = e.props.bodyColumns - 4
    const queued = queuedFor(session)
    const tab = (view: View, letter: string, label: string) =>
      Button({
        key: `sc-view-${view}`,
        label: `${letter}: ${label}`,
        hotkey: letter,
        dimColor: state.view !== view,
        onPress: () => void update($, (s) => ({ ...s, view })),
      })
    const top = [
      Text({ bold: true, children: [`${commands.length} commands · ${queued.length} queued`] }),
      Box({ flexDirection: 'row', flexWrap: 'wrap', columnGap: 1, children: [tab('commands', 'c', 'list'), tab('history', 'h', 'history'), tab('new', 'n', 'new')] }),
    ]
    let body: RenderElement[]
    if (state.view === 'history') {
      const runs = historyOf(await $.store.get(HISTORY_KEY), session)
      body = [
        Text({ dimColor: true, children: ['Queued by the run tool, not run yet'] }),
        ...(queued.length === 0 ? [Text({ dimColor: true, children: ['Nothing queued.'] })] : queued.map((r) => Text({ children: [maskedLine(shown(r))] }))),
        Text({ dimColor: true, children: ['Run in this session, newest first'] }),
        ...(runs.length === 0 ? [Text({ dimColor: true, children: ['No run yet.'] })] : runs.map((r) => Text({ wrap: 'truncate-end', children: [maskedLine(historyLine(r))] }))),
      ]
    } else if (state.view === 'new') {
      const d = state.draft
      const set = (patch: Partial<CommandDraft>) => void update($, (s) => ({ ...s, draft: { ...s.draft, ...patch } }))
      body = Input === undefined || Select === undefined
        ? [Text({ children: ['This app draws no text field: create the command in the terminal or the Desktop app.'] })]
        : [
            Text({ dimColor: true, children: ['A command is a saved prompt; $ARGUMENTS stands for the text typed after it.'] }),
            Input({ key: 'sc-name', label: 'Name /', placeholder: 'ship-it', value: d.name, onInput: (v) => set({ name: v }), onSubmit: (v) => set({ name: v }) }),
            Input({ key: 'sc-description', label: 'Description', placeholder: 'Run the tests, then push', value: d.description, onInput: (v) => set({ description: v }), onSubmit: (v) => set({ description: v }) }),
            Input({ key: 'sc-body', label: 'Prompt', rows: 3, placeholder: 'What Claude should do', value: d.body, onInput: (v) => set({ body: v }), onSubmit: (v) => set({ body: v }) }),
            Select({
              key: 'sc-scope',
              label: 'Save for',
              value: d.scope,
              options: [{ value: 'project', label: 'this project' }, { value: 'user', label: 'me, in every project' }],
              onSelect: (v) => set({ scope: v === 'user' ? 'user' : 'project' }),
            }),
            Button({ key: 'sc-save', label: 's: save', hotkey: 's', onPress: () => saveCommand($) }),
          ]
    } else {
      const hits = matching(commands, state.query)
      const search = Input === undefined
        ? []
        : [Input({ key: 'sc-search', label: 'Search', placeholder: 'name or description', value: state.query, onInput: (v) => void update($, (s) => ({ ...s, query: v })), onSubmit: (v) => void update($, (s) => ({ ...s, query: v })) })]
      body = [
        ...search,
        Text({ dimColor: true, children: [`${hits.length} of ${commands.length}; press one to put it in the prompt box. Dim: the run tool refuses it.`] }),
        ...groupBySource(hits).map(([label, members]) =>
          Box({
            key: `sc-group-${label}`,
            flexDirection: 'column',
            children: [
              Text({ dimColor: true, children: [printable(label)] }),
              ...members.map((c) =>
                Box({
                  key: `sc-row-${c.name}`,
                  flexDirection: 'row',
                  columnGap: 1,
                  children: [
                    // A refused command still fills the prompt (the person may type any command); it is only dim.
                    Button({ key: `sc-cmd-${c.name}`, label: printable(fitLabel(`/${c.name}`, room)), dimColor: isRefused(c), onPress: () => fill($, c.name) }),
                    Text({ dimColor: true, wrap: 'truncate-end', children: [printable(c.description)] }),
                  ],
                }),
              ),
            ],
          }),
        ),
      ]
    }
    return Box({ flexDirection: 'column', rowGap: 1, children: [...top, ...body] })
  })
}
