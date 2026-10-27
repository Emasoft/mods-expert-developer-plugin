// The /self-command pane (TRDD-GF5UDFWI A2): the run tool's queue and history, the session's slash
// commands grouped by source with a search box (a press puts the command in the prompt box), and a
// form that creates a markdown command. Gated like the tools. Thin wiring: decisions are in
// ./logic.ts. Only elements both the terminal and the Desktop app draw (Box, Text, Button, Input,
// Select), one render path for every surface, bracketed buttons whose label names their letter.
import type { EngineInterface, On, RenderElement } from 'claude-code'

import { DEV_TOOLS_OFF, isDevToolsOn } from '../dev-tools'
import {
  type CommandDraft,
  EMPTY_DRAFT,
  HISTORY_KEY,
  commandFile,
  commandPath,
  draftName,
  draftProblem,
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

// Module memory per session, as requirements-drafts keeps its lists: $.state would need a types
// contract in the manifest. A reload empties it, which only resets the view, the search and the form.
const stateBySession = new Map<string, PaneState>()

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error))

/** Read-only: a render never creates an entry. */
async function stateOf($: EngineInterface): Promise<PaneState> {
  return stateBySession.get(await $.session.id()) ?? INITIAL
}

async function update($: EngineInterface, change: (s: PaneState) => PaneState): Promise<void> {
  const session = await $.session.id()
  stateBySession.set(session, change(stateBySession.get(session) ?? INITIAL))
  $.ui.invalidate('ui.render')
}

/** Puts `/<name> ` in the prompt box; a box that did not take it says so in a toast. */
async function fill($: EngineInterface, name: string): Promise<void> {
  const filled = await $.prompt.fill({ text: `/${name} ` })
  if (!filled.isFilled) $.ui.toast(`The prompt box did not take /${name}${filled.refusal === undefined ? '' : ` (${filled.refusal})`}.`)
}

/**
 * Saves the form as .claude/commands/<name>.md in the project (the session root) or the user's
 * home. Every failure reaches the person as a toast and the log, never as an engine error on a
 * press, and an existing file is never overwritten.
 */
async function saveCommand($: EngineInterface): Promise<void> {
  try {
    const draft = (await stateOf($)).draft
    const problem = draftProblem(draft, await $.command.list())
    if (problem !== undefined) {
      $.ui.toast(problem)
      return
    }
    const base = draft.scope === 'user' ? await $.env.get('HOME') : await $.session.root()
    if (base === undefined || base === '') {
      $.ui.toast(`Not saved: the ${draft.scope === 'user' ? 'home folder (HOME)' : 'project folder'} is not known.`)
      return
    }
    const name = draftName(draft)
    const path = commandPath(base, name)
    if (await $.fs.exists(path)) {
      $.ui.toast(`Not saved: ${path} already exists.`)
      return
    }
    await $.fs.write(path, commandFile(draft))
    await update($, (s) => ({ ...s, draft: { ...EMPTY_DRAFT, scope: draft.scope } }))
    $.ui.toast(`Saved /${name} as ${path}. It shows in the / menu once Claude Code reads the folder again.`)
  } catch (error) {
    $.ui.log(`self-command: saving a command failed: ${messageOf(error)}`)
    $.ui.toast(`Not saved: ${messageOf(error)}`)
  }
}

/** Called by startSelfCommand while the gate is on: the pane's command registers with the tools. */
export async function registerPaneCommand($: EngineInterface): Promise<void> {
  // A literal name here and in the matcher below, so claude plugin validate can pair them.
  await $.command.register({ name: 'self-command', description: 'Open the slash command pane: queue, history, search, create' })
}

export function registerPane(on: On): void {
  on('command.run', { command: 'self-command' }, async ($) => {
    if (!(await isDevToolsOn($))) return { text: DEV_TOOLS_OFF }
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
    if (!(await isDevToolsOn($))) return Text({ dimColor: true, children: [DEV_TOOLS_OFF] })
    const session = await $.session.id()
    const state = await stateOf($)
    const commands = await $.command.list()
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
        ...(queued.length === 0 ? [Text({ dimColor: true, children: ['Nothing queued.'] })] : queued.map((r) => Text({ children: [shown(r)] }))),
        Text({ dimColor: true, children: ['Run in this session, newest first'] }),
        ...(runs.length === 0 ? [Text({ dimColor: true, children: ['No run yet.'] })] : runs.map((r) => Text({ wrap: 'truncate-end', children: [historyLine(r)] }))),
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
              Text({ dimColor: true, children: [label] }),
              ...members.map((c) =>
                Box({
                  key: `sc-row-${c.name}`,
                  flexDirection: 'row',
                  columnGap: 1,
                  children: [
                    Button({ key: `sc-cmd-${c.name}`, label: `/${c.name}`, dimColor: isRefused(c), onPress: () => fill($, c.name) }),
                    Text({ dimColor: true, wrap: 'truncate-end', children: [c.description] }),
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
