import type { EngineInterface, Register } from 'claude-code'

import { ENABLED_KEY, USAGE, parseSwitch, shouldToast, slowToastText, statusText } from './logic.js'
import type { Snapshot } from './logic.js'

// The previous turn, to tell a new slow turn from the one already shown. Kept in memory on
// purpose: after a restart the first turn is a fresh "first snapshot" and toasts nothing.
let last: Snapshot | null = null

// A missing key means on; only an explicit false turns the mod off.
// $.store.get(key) resolves to the value or undefined (mods-doc-mods-interfaces chapter.md:744).
async function isEnabled($: EngineInterface): Promise<boolean> {
  return (await $.store.get(ENABLED_KEY)) !== false
}

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    // A new session must never compare its first turn with the last turn of the previous one.
    last = null
    // Register commands last: a throw here skips the rest of the hook.
    // $.command.register and its fields name, description, argumentHint: mods-doc-mods-api chapter.md:34.
    await $.command.register({ name: 'turn-timer', description: 'Turn the turn timer on or off', argumentHint: '[on|off]' })
    // next(e) passes the event on unchanged (mods-doc-mods-reference chapter.md:69; session.start row at :136).
    return next(e)
  })

  // The command answers even when the mod is off, or it could never be turned back on.
  // e.args is the text typed after the command name, or an empty string (mods-doc-mods-api chapter.md:40).
  on('command.run', { command: 'turn-timer' }, async ($, e) => {
    const choice = parseSwitch(e.args, await isEnabled($))
    // { text } is an allowed command.run answer (mods-doc-mods-reference chapter.md:113).
    if (choice === null) return { text: USAGE }
    // $.store.set(key, value) takes any JSON value (mods-doc-mods-interfaces chapter.md:744).
    await $.store.set(ENABLED_KEY, choice)
    if (!choice) last = null
    // The status line shows the switch until the next turn replaces it. $.ui.status(text) is one line
    // under the prompt that stays until changed (mods-doc-mods-api chapter.md:221); $.ui.toast(text) shows a
    // notification (mods-doc-mods-api chapter.md:222).
    await $.ui.status(choice ? 'on' : 'off')
    await $.ui.toast('turn-timer ' + (choice ? 'on' : 'off'))
    // {} is an allowed command.run answer (mods-doc-mods-reference chapter.md:113).
    return {}
  })

  on('turn.complete', async ($, e, next) => {
    // Main loop only: a subagent's turn fires turn.complete with agentId set (mods-doc-mods-and-events
    // chapter.md:253, mods-doc-mods-reference chapter.md:85).
    if (e.agentId !== undefined || !(await isEnabled($))) return next(e)
    // e.durationMs and e.isAborted: mods-doc-mods-and-events chapter.md:253; e.turnId identifies the turn
    // (mods-doc-mods-and-events chapter.md:251; the turn.complete payload also lists turnId at mods-doc-mods-testing chapter.md:193).
    const snap: Snapshot = { turnId: e.turnId, durationMs: e.durationMs, isAborted: e.isAborted }
    const toast = shouldToast(last, snap)
    last = snap
    await $.ui.status(statusText(snap))
    if (toast) await $.ui.toast(slowToastText(snap))
    // next(e) passes the event on unchanged (mods-doc-mods-reference chapter.md:69; turn.complete row at :126).
    return next(e)
  })
}
