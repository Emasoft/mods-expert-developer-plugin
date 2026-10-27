// mod-manager (TRDD-J4HRAQF0): the start and the registrar hooks/index.ts wires. Thin: every decision is
// in ./logic.ts and every change in ./state.ts. Always on: no dev-tools gate and no tool, only the pane.
import type { EngineInterface, On } from 'claude-code'

import { COMMAND } from './logic'
import { registerPane } from './pane'

/** Called by hooks/index.ts at session.start. The command registers here: a taken name throws, so it is wrapped there. */
export async function startModManager($: EngineInterface): Promise<void> {
  await $.command.register({ name: COMMAND, description: 'Show the installed plugins and mods; turn one on or off, or uninstall it' })
}

/** Called by hooks/index.ts at load, beside the other registrars. */
export function registerModManager(on: On): void {
  registerPane(on)
}
