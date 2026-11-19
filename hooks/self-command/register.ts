// self-command (TRDD-GF5UDFWI): the dev tools `run` and `list_commands`. Thin wiring only: every
// decision is a function in ./logic.ts. Each tool has its own switch (../dev-tools.ts, TRDD-5IK59SQ2).
import type { EngineInterface, On } from 'claude-code'

import { logEvent, maskedLine, maskedLog } from '../debug-log/register'
import { DEV_TOOLS_OFF, LIST_COMMANDS, PANE, RUN } from '../dev-tools'
import { isOn } from '../switches/register'
import {
  HISTORY_KEY,
  LIST_DESCRIPTION,
  LIST_SCHEMA,
  LIST_TOOL,
  RUN_DESCRIPTION,
  RUN_SCHEMA,
  RUN_TOOL,
  SEND_COMMAND,
  type Outcome,
  type RunRequest,
  entryOf,
  listText,
  logLine,
  queuedText,
  recordRun,
  reportText,
  requestOf,
  shown,
} from './logic'
import { registerPane, registerPaneCommand } from './pane'
import { addQueued, removeQueued } from './queue'

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error))

/**
 * Called once per session.start by hooks/index.ts. Each tool, and the pane's command, registers only here and only
 * while its own switch is on (TRDD-5IK59SQ2): a tool added mid-session would change the cached tool list, and while
 * they are off none of them shows. isDeferred false puts both tools in the prompt's tool list, so the model can call
 * them without a ToolSearch first.
 */
export async function startSelfCommand($: EngineInterface): Promise<void> {
  if (await isOn($, RUN)) await $.tool.register({ name: RUN_TOOL, description: RUN_DESCRIPTION, inputSchema: RUN_SCHEMA, isDeferred: false })
  if (await isOn($, LIST_COMMANDS)) await $.tool.register({ name: LIST_TOOL, description: LIST_DESCRIPTION, inputSchema: LIST_SCHEMA, isDeferred: false })
  // The pane's command last: a command registers after the tools, and a taken name throws.
  if (await isOn($, PANE)) await registerPaneCommand($)
}

/**
 * Runs the queued command once the turn has ended, hands its outcome to the model, then records it.
 * The report goes only through the send command (no second path): if that fails, the person is told
 * by a toast and the log, because the model would otherwise wait for an output that never comes.
 * The run switch is not read again here: the timer fires as soon as the call is accepted, so a second read would see
 * what the call's own check saw, and the engine then holds the command until the turn ends. A run accepted while the
 * switch was on is carried out; turning it off refuses the calls after (README, Self-command dev tools).
 */
async function runQueued($: EngineInterface, session: string, request: RunRequest): Promise<void> {
  // Off the queue before it runs: the pane then shows it in neither list until it is recorded.
  removeQueued(session, request)
  $.ui.invalidate('ui.render')
  const outcome: Outcome = await $.command.run(request).then(
    (r) => ({ text: r.text }),
    (error: unknown) => ({ error: messageOf(error) }),
  )
  const entry = entryOf(request, outcome, await $.clock.now())
  // Masked in Claude Code's log, and never added to the debug log: this line carries the tool's input (the command and
  // its arguments) and the command's output, which the debug log must not hold (TRDD-RWD5PW76; review of 01cc4d8). Only
  // the failures below go to the debug log.
  maskedLog($, logLine(entry))
  try {
    await $.command.run({ command: SEND_COMMAND, args: reportText(request, outcome) })
  } catch (error) {
    logEvent($, 'self-command', `self-command: the outcome of ${shown(request)} could not be sent to the model: ${messageOf(error)}`)
    $.ui.toast(maskedLine(`The outcome of ${shown(request)} did not reach the model: ${messageOf(error)}`))
  }
  try {
    await $.store.set(HISTORY_KEY, recordRun(await $.store.get(HISTORY_KEY), session, entry))
    $.ui.invalidate('ui.render')
  } catch (error) {
    logEvent($, 'self-command', `self-command: the run of ${shown(request)} was not added to the history: ${messageOf(error)}`)
  }
}

/** A gating hook that failed (the command list unreadable, the store refused) refuses the call, saying why. */
const failClosed = (tool: string, error: { message?: string; kind: string }): { deny: string } => ({
  deny: `${tool} failed before it could run: ${error.message || error.kind}`,
})

export function registerSelfCommand(on: On): void {
  registerPane(on)
  // Each call reads its switch again: turning it off cannot unregister a tool mid-session.
  // RegExp literals, not strings: the matcher's string form takes only built-in tool names, and a
  // literal is what claude plugin validate can read. The names are mcp__<plugin>__<tool>.
  on('tool.call', { tool: /^mcp__mods-expert-developer-plugin__run$/ }, async ($, e) => {
    if (!(await isOn($, RUN))) return { deny: DEV_TOOLS_OFF }
    const request = requestOf(e as unknown as Record<string, unknown>, await $.command.list())
    if (typeof request === 'string') return { deny: request }
    const session = await $.session.id()
    // From a timer, not from this hook: the engine runs a plugin's command once the session is idle
    // and rejects one from a hook the turn waits on.
    $.clock.after(0, () => {
      void runQueued($, session, request).catch((error: unknown) => logEvent($, 'self-command', `self-command: ${shown(request)} failed: ${messageOf(error)}`))
    })
    // Queued only once the timer is set: a throw above leaves no entry the pane would show forever.
    addQueued(session, request)
    $.ui.invalidate('ui.render')
    return { result: queuedText(request) }
  }).catch(async ($, e, next) => failClosed(RUN_TOOL, next.error))

  on('tool.call', { tool: /^mcp__mods-expert-developer-plugin__list_commands$/ }, async ($, e) => {
    if (!(await isOn($, LIST_COMMANDS))) return { deny: DEV_TOOLS_OFF }
    const query = (e as unknown as Record<string, unknown>).query
    return { result: listText(await $.command.list(), typeof query === 'string' ? query : '') }
  }).catch(async ($, e, next) => failClosed(LIST_TOOL, next.error))
}
