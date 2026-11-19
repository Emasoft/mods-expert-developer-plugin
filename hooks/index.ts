// The plugin's one hooks module. hooks.json lists only this file; it owns the only
// session.start hook and starts each mod in its own try/catch, so one failing mod
// cannot keep the others from starting. The debug-log start runs first, so every line
// after it is masked with this session's home folder (TRDD-RWD5PW76); the switches
// start runs next, so every mod after it reads migrated switches (TRDD-5IK59SQ2); Deck
// starts after it (TRDD-RD1ISPMN); Tokensaver after Deck (TRDD-71KVH9PA); the dev-tools start runs last.
import type { Register } from 'claude-code'

import { maskedLog, startDebugLog } from './debug-log/register'
import { registerDevTools, startDevTools } from './dev-tools'
import { deckStartFailed } from './deck/gate'
import { registerDeckMod, startDeckMod } from './deck/mod'
import { deckObserverFailed, deckPromptFailed, observeDeckMeasure, observeDeckPrompt, observeDeckSpawned, observeDeckTurnComplete, observeDeckTurnStep } from './deck/register.js'
import { registerSelfCommand, startSelfCommand } from './self-command/register'
import { registerProbeRunner, startProbeRunner } from './probe-runner/register'
import { registerModManager, startModManager } from './mod-manager/register'
import { configureBins } from './resolve-bin'
import { registerSwitches, startSwitches } from './switches/register'
import { registerTokensaverMod, routeTokensaverPromptFailOpen, startTokensaverMod, tokensaverBeforeSpawnFailOpen, tokensaverObserverFailed } from './tokensaver/mod'
import { observeTokensaverMeasure, observeTokensaverSpawned, observeTokensaverTurnComplete, observeTokensaverTurnStep } from './tokensaver/register'

export const register: Register = (on, options) => {
  configureBins({ claude: typeof options?.claudePath === 'string' ? options.claudePath : undefined })
  on('session.start', async ($, e, next) => {
    // Every start failure is masked (PRRD G14.1): an error message can carry a path or a token. A mod wired to the
    // debug log (TRDD-RWD5PW76) also adds the line to its own file while its debug-log switch is on.
    try {
      await startDebugLog($)
    } catch (error) {
      maskedLog($, `mods-debug-log: start failed: ${String(error)}`)
    }
    // Next: it signs what an older release kept, so every mod after it reads migrated switches (TRDD-5IK59SQ2).
    try {
      await startSwitches($)
    } catch (error) {
      maskedLog($, `mods-switches: start failed: ${String(error)}`)
    }
    // Deck: /mods-deck is registered at every start; with its master on, Deck loads and its clock runs (TRDD-RD1ISPMN).
    try {
      await startDeckMod($, e)
    } catch (error) {
      await deckStartFailed($, error)
    }
    // Tokensaver: its switches are read here, its command registered and its store read back (TRDD-71KVH9PA). It starts
    // after Deck, so a failure in one never keeps the other from starting.
    try {
      await startTokensaverMod($, e)
    } catch (error) {
      maskedLog($, `mods-tokensaver: start failed: ${String(error)}`)
    }
    try {
      await startSelfCommand($)
    } catch (error) {
      maskedLog($, `self-command: start failed: ${String(error)}`)
    }
    try {
      await startModManager($)
    } catch (error) {
      maskedLog($, `mods-manager: start failed: ${String(error)}`)
    }
    try {
      await startProbeRunner($)
    } catch (error) {
      maskedLog($, `probe-runner: start failed: ${String(error)}`)
    }
    try {
      await startDevTools($)
    } catch (error) {
      maskedLog($, `mods-dev-tools: start failed: ${String(error)}`)
    }
    return next(e)
  })
  registerSwitches(on)
  registerDeckMod(on)
  registerTokensaverMod(on, options)
  registerSelfCommand(on)
  registerModManager(on)
  registerProbeRunner(on)
  registerDevTools(on)

  // One dispatcher per shared event; observer failures never suppress next or another observer (TRDD-RD1ISPMN).
  on("turn.step", async function* ($, e, next) {
    try { await observeDeckTurnStep($, e) } catch (error) { deckObserverFailed($, "turn.step", error) }
    const result = yield* next(e)
    try { await observeTokensaverTurnStep($, e, result) } catch (error) { tokensaverObserverFailed($, "turn.step", error) }
    return result
  }).catch(async function* ($, e, next) {
    if (next.called) return yield* next(e)
    maskedLog($, `turn.step observers: the hook failed: ${next.error.message || next.error.kind}; the event passed on`)
    return yield* next(e)
  })
  on("session.measure", async ($, e, next) => {
    try { await observeDeckMeasure($, e) } catch (error) { deckObserverFailed($, "session.measure", error) }
    try { await observeTokensaverMeasure($, e) } catch (error) { tokensaverObserverFailed($, "session.measure", error) }
    return next(e)
  }).catch(async ($, e, next) => {
    if (next.called) return next(e)
    maskedLog($, `session.measure observers: the hook failed: ${next.error.message || next.error.kind}; the event passed on`)
    return next(e)
  })
  on("agent.spawn", async ($, e, next) => {
    const pre = await tokensaverBeforeSpawnFailOpen($, e)
    const started = await next(pre.event)
    try { await observeDeckSpawned($, e, started) } catch (error) { deckObserverFailed($, "agent.spawn", error) }
    try { await observeTokensaverSpawned($, pre.toolUseId, started) } catch (error) { tokensaverObserverFailed($, "agent.spawn", error) }
    return started
  }).catch(async ($, e, next) => {
    if (next.called) return next(e)
    maskedLog($, `agent.spawn observers: the hook failed: ${next.error.message || next.error.kind}; the event passed on`)
    return next(e)
  })
  on("turn.complete", async ($, e, next) => {
    try { await observeDeckTurnComplete($, e) } catch (error) { deckObserverFailed($, "turn.complete", error) }
    try { await observeTokensaverTurnComplete($, e) } catch (error) { tokensaverObserverFailed($, "turn.complete", error) }
    return next(e)
  }).catch(async ($, e, next) => {
    if (next.called) return next(e)
    maskedLog($, `turn.complete observers: the hook failed: ${next.error.message || next.error.kind}; the event passed on`)
    return next(e)
  })

  // The observers of a sent message, in this module's one prompt.submit hook: the engine refuses a module with two plain
  // hooks on one event, and Deck and Tokensaver both act on it (TRDD-RD1ISPMN, ruling 8 as amended). Deck observes in its
  // own try, then Tokensaver's router runs last, so the prompt it passes on is the one Deck saw; it passes on exactly
  // once, whatever Deck did. The hook's 10 s budget counts only its own time, not its $ calls or next (types,
  // HookBudget), so an observer's hung $ call holds the prompt: Deck makes only short $ calls.
  on('prompt.submit', async ($, e, next) => {
    try {
      await observeDeckPrompt($, e)
    } catch (error) {
      deckPromptFailed($, error)
    }
    // Tokensaver's router, last (ruling Q1), and fail open: a throw passes the prompt on as the others left it (ruling Q2).
    const routed = await routeTokensaverPromptFailOpen($, e)
    return next(routed)
  }).catch(async ($, e, next) => {
    // A failure beneath this hook, after it passed the prompt on, is not this hook's: next is replay-safe here (types,
    // Caught), so next(e) settles as that call did and runs nothing beneath again, and the prompt went on exactly once
    // (ruling 8 as amended). Measured in the kit with the engine's own answer beneath throwing: it ran once. A plugin's
    // hook beneath that throws is skipped by the engine, so next resolves and this .catch does not run. Logging the
    // failure as this hook's would also claim the prompt passed on when it did not.
    if (next.called) return next(e)
    // This hook failed before passing the prompt on (its budget ran out, or an observer's failure line threw): it cannot
    // tell which observer was running without a record the engine does not document, so it names none (D1b delta, H).
    maskedLog($, `prompt.submit observers: the hook failed: ${next.error.message || next.error.kind}; the prompt passed on`)
    return next(e)
  })
}
