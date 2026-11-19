// The dev tools of this plugin (TRDD-GF5UDFWI) and their switches (TRDD-5IK59SQ2, PRRD G13.1): self-command's run
// and list_commands tools and its pane, and probe-runner's probe. Each switches on and off by itself in the shared
// registry (./switches). They stay off by default in this release, as before it: TRDD-UYD6T358 owns their default
// (orchestrator ruling 2026-11-04). They live here, beside the mods that use them, so /mods-dev-tools can set all four.
//
// The older release kept one switch for all of them under the store key `dev-tools`, written unsigned. Each function
// reads it while it has no value of its own. A false there holds; a true never turns an off-by-default function on by
// itself (the registry's rule for a value it did not sign): the function stays off and the person is asked to review
// it at the session start, where Keep in /mods-switches turns them on.
import type { EngineInterface, On } from 'claude-code'

import { debugLogSwitch } from './debug-log/logic'
import { type SwitchDef, byOf } from './switches/logic'
import { allOn, defineSwitches, setSwitches } from './switches/register'

export const DEV_TOOLS_COMMAND = 'mods-dev-tools'
export const RUN = 'self-command.run'
export const LIST_COMMANDS = 'self-command.list-commands'
export const PANE = 'self-command.pane'
export const PROBE = 'probe-runner.probe'
/** The functions /mods-dev-tools sets together. The debug logs are not among them: they switch only by themselves. */
export const DEV_FUNCTIONS = [RUN, LIST_COMMANDS, PANE, PROBE] as const
const LEGACY_KEY = 'dev-tools'
export const DEV_SWITCHES: readonly SwitchDef[] = [
  { id: RUN, mod: 'self-command', label: 'run tool: Claude queues a slash command', defaultOn: false, legacyKey: LEGACY_KEY, nextSession: true },
  { id: LIST_COMMANDS, mod: 'self-command', label: 'list_commands tool', defaultOn: false, legacyKey: LEGACY_KEY, nextSession: true },
  { id: PANE, mod: 'self-command', label: '/self-command pane', defaultOn: false, legacyKey: LEGACY_KEY, nextSession: true },
  debugLogSwitch('self-command'),
  { id: PROBE, mod: 'probe-runner', label: 'probe tool and /probe-runner', defaultOn: false, legacyKey: LEGACY_KEY, nextSession: true },
  debugLogSwitch('probe-runner'),
]
export const DEV_TOOLS_OFF =
  'This mods dev tool is off. Turn it on in /mods-switches, or all four dev tools with /mods-dev-tools on; a tool turned on joins the tool list when the next session starts.'

export type DevToolsAnswer = { on: boolean; text: string } | { usage: string }

/**
 * What /mods-dev-tools does with its argument: none toggles from "all on", `on` and `off` set, anything else is
 * answered with the usage line. Every tool and command of the four registers only at session.start while its switch is
 * on, so turning on takes effect from the next session; turning off refuses every call from now on.
 */
export function parseDevToolsSwitch(args: string, current: boolean): DevToolsAnswer {
  const word = args.trim().toLowerCase()
  let on: boolean
  if (word === '') on = !current
  else if (word === 'on') on = true
  else if (word === 'off') on = false
  else return { usage: `Usage: /${DEV_TOOLS_COMMAND} [on|off]` }
  return on
    ? { on, text: 'The mods dev tools are on. Their tools register when the next session starts.' }
    : { on, text: 'The mods dev tools are off. Every call to them is refused from now on; they leave the tool list when the next session starts.' }
}

/** Called by hooks/index.ts at session.start, after the other starts: commands register last. */
export async function startDevTools($: EngineInterface): Promise<void> {
  // Literal names here and in the matcher below, so claude plugin validate can pair the command with its hook.
  await $.command.register({ name: 'mods-dev-tools', description: 'Turn the mods dev tools (run, list_commands, the pane, probe) on or off', argumentHint: '[on|off]' })
}

export function registerDevTools(on: On): void {
  defineSwitches(DEV_SWITCHES)
  // One writer for the four functions, the registry's: the same signing, checks and agent toasts as the pane.
  on('command.run', { command: 'mods-dev-tools' }, async ($, e) => {
    const answer = parseDevToolsSwitch(e.args, await allOn($, DEV_FUNCTIONS))
    if ('usage' in answer) return { text: answer.usage }
    const outcome = await setSwitches($, DEV_FUNCTIONS, answer.on, byOf(e.origin.kind))
    return { text: 'refuse' in outcome ? outcome.refuse : answer.text }
  })
}
