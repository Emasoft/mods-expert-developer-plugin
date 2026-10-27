// mod-manager's session state and the two flows that change it: reading the installed plugins, and an
// action the person confirmed. The state is module memory per session, as self-command keeps its pane;
// a reload empties it, which only clears the list until the next open reads it again.
import type { EngineInterface } from 'claude-code'

import { isMod, listInstalled, runAction } from './cli'
import { type Action, KEEP, type Row, appliesHere, confirmLabel, confirmThenRun, doneText, orderRows, questionFor, toRow } from './logic'

export type ModState = { loaded: boolean; rows: Row[]; busy: string | undefined; message: string; needsRestart: boolean }
const INITIAL: ModState = { loaded: false, rows: [], busy: undefined, message: '', needsRestart: false }
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

/**
 * Marks the session busy with `busy`, synchronously, so two presses cannot both pass the check. Returns the
 * text of what is still running when the claim is refused, or undefined when this call holds the claim.
 */
function claim(session: string, busy: string): string | undefined {
  const state = stateIn(session)
  if (state.busy !== undefined) return state.busy
  stateBySession.set(session, { ...state, busy, message: '' })
  return undefined
}

const refusedToast = (running: string): string => `Wait: ${running} is still running. Nothing was changed.`

/**
 * Reads what is installed, keeps what applies in this session, and orders it. Every failure becomes the
 * pane's message and a log line; nothing is thrown into the engine from here.
 */
export async function refresh($: EngineInterface): Promise<void> {
  try {
    await update($, { busy: 'reading the installed plugins…', message: '' })
    const root = await $.session.root()
    const applying = (await listInstalled($)).filter((entry) => appliesHere(entry, root))
    const rows: Row[] = []
    for (const entry of applying) rows.push(toRow(entry, await isMod($, entry.installPath)))
    await update($, { loaded: true, rows: orderRows(rows), busy: undefined })
  } catch (error) {
    $.ui.log(`mod-manager: reading the installed plugins failed: ${messageOf(error)}`)
    await update($, { loaded: true, busy: undefined, message: `Couldn't read the installed plugins: ${messageOf(error)}` })
  }
}

/**
 * Runs an action only after the person picks its confirm label; the rule itself is confirmThenRun in logic.ts. A
 * press while claude is busy is refused with a toast before any question is asked, and the claim is taken after the
 * question, so a second press cannot start a second claude run. Its callers are the pane's buttons, so a request from
 * a model cannot reach it.
 */
export async function confirmAndAct($: EngineInterface, row: Row, action: Action, ask: Ask = engineAsk($)): Promise<void> {
  const session = await $.session.id()
  const running = stateIn(session).busy
  if (running !== undefined) {
    $.ui.toast(refusedToast(running))
    return
  }
  const outcome = await confirmThenRun(
    action,
    () => ask(questionFor(action, row), [confirmLabel(action), KEEP]),
    async () => {
      const blocked = claim(session, `${action} ${row.name}…`)
      if (blocked !== undefined) {
        $.ui.toast(refusedToast(blocked))
        return
      }
      $.ui.invalidate('ui.render')
      try {
        await runAction($, row, action)
        await update($, { busy: undefined, needsRestart: true })
        $.ui.toast(doneText(action, row))
      } catch (error) {
        await update($, { busy: undefined, message: `${action} ${row.name} failed: ${messageOf(error)}` })
        return
      }
      await refresh($)
    },
  )
  if (outcome === 'dismissed') $.ui.log(`mod-manager: ${action} ${row.name} was not confirmed`, { to: 'debug' })
}
