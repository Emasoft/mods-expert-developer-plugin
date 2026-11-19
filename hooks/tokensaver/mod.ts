// The integrated Tokensaver's start, registration and switch follower (TRDD-71KVH9PA): hooks/index.ts calls startTokensaverMod
// in its one session.start hook and registerTokensaverMod with the other registrars, its dispatchers call the two fail-open
// routers, and hooks/switch-followers.ts calls followTokensaverSwitch. Tokensaver's own code is the adapted upstream module
// ./register; this file keeps what the wiring adds around it: the switches read through the registry, the start, the notice,
// and the routers no failure may turn into a refusal (ruling Q2).
//
// A hooks module may pass `$` only to a function declared at the top level of its own files: every `$`-taking helper here is
// a top-level function declaration, never a const or an arrow inside register(), which the loader refuses.
import type { AgentSpawnInput, EngineInterface, On, PluginOptions, PromptSubmitInput, SessionStartInput } from 'claude-code'

import { maskedLine, maskedLog } from '../debug-log/register'
import { defineNotice, defineSwitches, isOn, noticeChanged } from '../switches/register'
import { applyTokensaverSwitches, redrawTokensaver, registerTokensaver, routeTokensaverPrompt, startTokensaver, tokensaverBeforeSpawn } from './register'
import {
  AUTO_COMPACT,
  COLD_CACHE,
  DELEGATION_HINT,
  DRY_RUN,
  ESCALATION,
  MASTER,
  MOD,
  PASTES,
  REDUCED_MOTION,
  ROUTING,
  STATUS_LINE,
  TOKENSAVER_SWITCHES,
  TRIM,
  VOICE,
} from './switches'

// Router failures Tokensaver caught and set aside (ruling Q2): counted here, each one also in the log and in the notice.
let errors = 0
// What Tokensaver's notice says, per session: one module may serve more than one session.
const notices = new Map<string, string>()

export const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error))
export const errorCount = (): number => errors

/**
 * Tokensaver's notice now, in this session (ruling Q2): the last router failure. The second use the card records, the
 * double-running guard's pause, joins here when its guard is ported (D1c); until then a failure is the only notice.
 */
export const noticeOf = (session: string): string | undefined => notices.get(session)

/**
 * An observer that threw: the line goes to the log, masked and then made printable by maskedLog, and the count rises. It
 * never throws: a throw in hooks/index.ts's catch would skip the observers after it.
 */
export function tokensaverObserverFailed($: EngineInterface, event: string, error: unknown): void {
  errors++
  maskedLog($, `tokensaver: the ${event} observer failed: ${messageOf(error)}`)
}

/**
 * A router that threw (ruling Q2: Tokensaver's routers fail open, an exception to Amendment C, because only a saving is lost
 * while failing closed would deny the person's prompt). The line goes to the log masked, the count rises, and the switches
 * pane says so under Tokensaver's heading.
 */
export async function tokensaverRouterFailed($: EngineInterface, event: string, error: unknown): Promise<void> {
  const message = messageOf(error)
  errors++
  maskedLog($, `tokensaver: the ${event} router failed: ${message}; the event passed on unchanged`)
  try {
    // maskedLine: the message comes from outside, so the pane shows no home folder, no second line and no secret.
    notices.set(await $.session.id(), maskedLine(`Tokensaver: the ${event} router failed, so its saving was lost and the event went on unchanged: ${message}`))
    noticeChanged($)
  } catch (failure) {
    maskedLog($, `tokensaver: the router failure could not be shown in the switches pane: ${messageOf(failure)}`)
  }
}

/** True while Tokensaver is on in this session: read here, at the moment of use, as the registry requires. */
async function isTokensaverOn($: EngineInterface): Promise<boolean> {
  return isOn($, MASTER)
}

/** Tokensaver's prompt.submit stage, failing open: a throw leaves the prompt exactly as it came (ruling Q2). */
export async function routeTokensaverPromptFailOpen($: EngineInterface, e: PromptSubmitInput): Promise<PromptSubmitInput> {
  // Off means every Tokensaver function is off: the one switch is read and the prompt goes on untouched.
  if (!(await isTokensaverOn($))) return e

  try {
    return await routeTokensaverPrompt($, e)
  } catch (error) {
    await tokensaverRouterFailed($, 'prompt.submit', error)
    return e
  }
}

/** Tokensaver's agent.spawn stage before the spawn, failing open: a throw spawns the agent as the caller asked (ruling Q2). */
export async function tokensaverBeforeSpawnFailOpen($: EngineInterface, e: AgentSpawnInput): Promise<{ event: AgentSpawnInput; toolUseId: string }> {
  const toolUseId = e.tool_use_id !== '' ? e.tool_use_id : 'spawn-unknown'

  // Off: the agent starts exactly as the caller asked, with no model picked and no report note added.
  if (!(await isTokensaverOn($))) return { event: e, toolUseId }

  try {
    return await tokensaverBeforeSpawn($, e)
  } catch (error) {
    await tokensaverRouterFailed($, 'agent.spawn', error)
    return { event: e, toolUseId }
  }
}

/**
 * Tokensaver at a session start: it reads back the store and registers its command, then every switch is read and written
 * into the configs the savers read. In that order because startTokensaver rebuilds both configs from the store (hydrate and
 * applyAssistantOverrides in ./register), so switches applied before it would be replaced by the stored values.
 *
 * With the master off nothing of that runs: off turns every Tokensaver function off, so the start reads no store, counts no
 * file and registers no command. The switches are still applied, so the off state reaches the code that draws.
 */
export async function startTokensaverMod($: EngineInterface, _e: Pick<SessionStartInput, 'cwd'>): Promise<void> {
  if (await isTokensaverOn($)) await startTokensaver($)

  await applySwitches($)
}

/**
 * Follows a write of a Tokensaver switch in this session (hooks/switch-followers.ts calls it): every value is read again and
 * written into the configs, then the screen is redrawn, so turning a display off or on shows at once instead of at the next
 * attach, prompt or tick. Fire-and-forget, and never a throw to the writer, which is the pane or the switches tool.
 */
export function followTokensaverSwitch($: EngineInterface, id: string, on: boolean): void {
  void applySwitches($)
    .then(() => redrawTokensaver($))
    // raw into maskedLog, which masks and then makes printable
    .catch((error: unknown) => maskedLog($, `tokensaver: the switch ${id} (${on ? 'on' : 'off'}) could not be followed: ${messageOf(error)}`))
}

export function registerTokensaverMod(on: On, options: PluginOptions): void {
  defineSwitches(TOKENSAVER_SWITCHES)
  // After defineSwitches: defineNotice refuses a mod with no switch (d419729).
  defineNotice(MOD, noticeOf)
  registerTokensaver(on, options)
}

/**
 * Reads every switch now, through the registry, and writes the values into the two configs with ./register's
 * applyTokensaverSwitches. Each switch is read at the moment of use, as the registry requires; nothing is kept here.
 */
export async function applySwitches($: EngineInterface): Promise<void> {
  applyTokensaverSwitches({
    isEnabled: await isOn($, MASTER),
    isDryRun: await isOn($, DRY_RUN),
    hasReducedMotion: await isOn($, REDUCED_MOTION),
    hasContextHint: await isOn($, DELEGATION_HINT),
    hasStatusLine: await isOn($, STATUS_LINE),
    hasRouting: await isOn($, ROUTING),
    hasEscalation: await isOn($, ESCALATION),
    isTrimming: await isOn($, TRIM),
    isTrimmingPastes: await isOn($, PASTES),
    voice: await isOn($, VOICE),
    autoCompact: await isOn($, AUTO_COMPACT),
    coldCache: await isOn($, COLD_CACHE),
  })
}