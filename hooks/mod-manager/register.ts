// mod-manager (TRDD-J4HRAQF0): the start and the registrar hooks/index.ts wires. Thin: every decision is in ./logic.ts and
// every change in ./state.ts. No tool, only the pane; its functions switch on and off in the shared registry
// (./switches.ts, TRDD-5IK59SQ2).
import type { EngineInterface, On } from 'claude-code'

import { maskedLog } from '../debug-log/register'
import { defineSwitches, isOn } from '../switches/register'
import { startAutoTimers } from './auto-timer'
import { COMMAND, COMMAND_HINT, paneIsOpen } from './logic'
import { registerPane } from './pane'
import { functionReadsOn, refresh } from './state'
import { AUTO_UPDATE, FN, MOD_MANAGER_SWITCHES } from './switches'

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error))

/**
 * Called by hooks/index.ts at session.start. The command registers here: a taken name throws, so it is wrapped there.
 *
 * session.start runs again in the fresh copy after a reload of this mod (mods reference chapter, line 136: "again after a
 * reload of that mod"), and a pane can stay up across it: $.ui.panes is "The engine's record, not the module's: a module
 * reloaded while its pane stayed up finds it here" (types, $.ui.panes). The fresh copy's state is empty, so a pane left open
 * by Reload (TRDD-R2QYIN8O, 2h) would say "Reading the installed plugins…" with no read running; when the pane is open, the
 * list is read again, without waiting, so the start is not held. A failed lookup only skips that read, so it goes to the
 * debug log and the start goes on.
 */
export async function startModManager($: EngineInterface): Promise<void> {
  // The hint names the four forms of the command's arguments (2l, parseCommandArgs in logic.ts).
  await $.command.register({ name: COMMAND, description: 'Show the installed plugins and mods; turn one on or off, update it, or uninstall it', argumentHint: COMMAND_HINT })
  // 2k: the check runs from a timer, so this start is not held, and the timer is set only while the switch is on. A
  // switch that cannot be read, or a timer that cannot be set, leaves the check off in this session (the safe side), says
  // so in the transcript, masked, and does not stop the reread of an open pane below: another function, which fails or
  // not on its own (review of 34f5c20; G13.1 switches each function on its own).
  try {
    if (await isOn($, AUTO_UPDATE)) await startAutoTimers($)
  } catch (error) {
    // maskedLog masks the line and then makes it printable: it goes to the transcript and quotes the engine's error, which
    // can carry outside text (review of d783048 and d623b53).
    maskedLog($, `mods-manager: the hourly auto-update check could not be started, so none runs in this session: ${messageOf(error)}`)
  }
  let open: boolean
  try {
    open = paneIsOpen(await $.ui.panes())
  } catch (error) {
    maskedLog($, `mods-manager: the open panes could not be listed, so an open pane is not read again: ${messageOf(error)}`, { to: 'debug' })
    return
  }
  // The list is read again only when the pane's own switch reads on; off, the pane draws the line that says so, from its
  // drawing's own read of the switches (TRDD-5IK59SQ2, C6b).
  if (open && (await functionReadsOn($, FN.pane))) void refresh($)
}

/** Called by hooks/index.ts at load, beside the other registrars. */
export function registerModManager(on: On): void {
  defineSwitches(MOD_MANAGER_SWITCHES)
  registerPane(on)
}
