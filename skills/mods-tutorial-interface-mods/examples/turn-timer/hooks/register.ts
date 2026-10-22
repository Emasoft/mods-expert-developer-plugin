import type { EngineInterface, Register } from 'claude-code'

import { ENABLED_KEY, USAGE, parseSwitch, shouldToast, slowToastText, statusText } from './logic.js'
import type { Snapshot } from './logic.js'

// The previous turn, to tell a new slow turn from the one already shown. Kept in memory on
// purpose: after a restart the first turn is a fresh "first snapshot" and toasts nothing.
let last: Snapshot | null = null

// A missing key means on; only an explicit false turns the mod off.
async function isEnabled($: EngineInterface): Promise<boolean> {
  return (await $.store.get(ENABLED_KEY)) !== false
}

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    // A new session must never compare its first turn with the last turn of the previous one.
    last = null
    // Register commands last: a throw here skips the rest of the hook.
    await $.command.register({ name: 'turn-timer', description: 'Turn the turn timer on or off', argumentHint: '[on|off]' })
    return next(e)
  })

  // The command answers even when the mod is off, or it could never be turned back on.
  on('command.run', { command: 'turn-timer' }, async ($, e) => {
    const choice = parseSwitch(e.args, await isEnabled($))
    if (choice === null) return { text: USAGE }
    await $.store.set(ENABLED_KEY, choice)
    if (!choice) last = null
    // The status line shows the switch until the next turn replaces it.
    await $.ui.status(choice ? 'on' : 'off')
    await $.ui.toast('turn-timer ' + (choice ? 'on' : 'off'))
    return {}
  })

  on('turn.complete', async ($, e, next) => {
    // Main loop only: a subagent's turn fires turn.complete with agentId set.
    if (e.agentId !== undefined || !(await isEnabled($))) return next(e)
    const snap: Snapshot = { turnId: e.turnId, durationMs: e.durationMs, isAborted: e.isAborted }
    const toast = shouldToast(last, snap)
    last = snap
    await $.ui.status(statusText(snap))
    if (toast) await $.ui.toast(slowToastText(snap))
    return next(e)
  })
}
