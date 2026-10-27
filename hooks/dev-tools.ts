// The dev-tools gate (TRDD-GF5UDFWI, Shared decisions): one switch for every development tool of
// this plugin (self-command now, probe-runner later), so it lives beside them rather than inside one.
// The flag is in $.store, which survives /clear and restarts ($.state would not). It is read from
// the store on every call, never cached, so `/mods-dev-tools off` refuses the next call at once.
import type { EngineInterface, On } from 'claude-code'

export const DEV_TOOLS_KEY = 'dev-tools'
export const DEV_TOOLS_COMMAND = 'mods-dev-tools'
export const DEV_TOOLS_OFF = 'The mods dev tools are off. /mods-dev-tools on turns them on from the next session.'

export type DevToolsAnswer = { on: boolean; text: string } | { usage: string }

/**
 * What /mods-dev-tools does with its argument: none toggles, `on` and `off` set, anything else is
 * answered with the usage line. A tool registers only at session.start, so turning on takes
 * effect from the next session; turning off refuses every gated call from now on.
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

/** Off unless the store holds true: the tools run slash commands for the model, so they are opt-in. */
export async function isDevToolsOn($: EngineInterface): Promise<boolean> {
  return (await $.store.get(DEV_TOOLS_KEY)) === true
}

/** Called by hooks/index.ts at session.start, after the other starts: commands register last. */
export async function startDevTools($: EngineInterface): Promise<void> {
  // Literal names here and in the matcher below, so claude plugin validate can pair the command with its hook.
  await $.command.register({ name: 'mods-dev-tools', description: 'Turn the mods dev tools (run, list_commands) on or off', argumentHint: '[on|off]' })
}

export function registerDevTools(on: On): void {
  on('command.run', { command: 'mods-dev-tools' }, async ($, e) => {
    const answer = parseDevToolsSwitch(e.args, await isDevToolsOn($))
    if ('usage' in answer) return { text: answer.usage }
    await $.store.set(DEV_TOOLS_KEY, answer.on)
    return { text: answer.text }
  })
}
