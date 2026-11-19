// The integrated Deck's start, registration and master follower (TRDD-RD1ISPMN): hooks/index.ts calls startDeckMod in
// its one session.start hook, deckStartFailed (./gate.ts) in that call's catch, and registerDeckMod with the other
// registrars. Deck's own code is the adapted upstream module ./register.js; this file and ./gate.ts keep what the port
// adds around it: the switches, the start, and the notice (TRDD-AXE8CUWR).
import type { EngineInterface, On, SessionStartInput } from 'claude-code'

import { maskedLog } from '../debug-log/register'
import { defineNotice, defineSwitches, isOn, noticeChanged } from '../switches/register'
import { clearNotice, messageOf, noticeOf } from './gate'
import { registerDeck, startDeckHere, startDeckIn, stopDeck } from './register.js'
import { DECK_SWITCHES, MASTER, MOD } from './switches'

/**
 * Deck at a session start. /mods-deck is registered at every start, master on or off (R3), so the person can turn Deck
 * on from it; registering sets no timer. With the master off nothing else runs, and a clock, fold or demo still going
 * stops (R1). With it on, Deck loads in this session, again at each later start here as upstream did, and the module's
 * one clock runs (R1). Deck starts in every session, claude -p and the SDK included, as upstream (R6 revised). A
 * failure here throws to hooks/index.ts's catch, which calls deckStartFailed: upstream swallowed a failed registration,
 * the port reports it (a named change).
 */
export async function startDeckMod($: EngineInterface, e: Pick<SessionStartInput, 'cwd'>): Promise<void> {
  // A literal name, so claude plugin validate pairs it with the command.run hook of ./register.js.
  await $.command.register({
    name: 'mods-deck',
    description: 'deck: toggle the HUD, pick a style, sections, sounds and weather',
    argumentHint: '[on|off|status|expand|collapse|style [name]|<section> on|off|city <name>|demo]',
    immediate: true,
  })
  if (!(await isOn($, MASTER))) {
    if (stopDeck()) noticeChanged($)
    return
  }
  const session = await $.session.id()
  await startDeckIn($, session, e, true)
  // The start-failed notice of an earlier start here clears once a start succeeds.
  if (clearNotice(session)) noticeChanged($)
}

/**
 * Follows a write of the master in this session (hooks/switch-followers.ts calls it; the line is M4c's): an off stops
 * the clock, the fold and the demo at once; an on starts Deck here when it has not started in this session (R7). A
 * failed start sets the notice; any other failure goes to the log, since nobody pressed anything here.
 */
export function followDeckMaster($: EngineInterface, on: boolean): void {
  if (!on) {
    if (stopDeck()) noticeChanged($)
    return
  }
  // raw into maskedLog, which masks and then makes printable (cleaned first, the mask could miss the home folder)
  void startDeckHere($).catch((error: unknown) => maskedLog($, `deck: the master switch could not be followed: ${messageOf(error)}`))
}

export function registerDeckMod(on: On): void {
  defineSwitches(DECK_SWITCHES)
  // After defineSwitches: defineNotice refuses a mod with no switch (d419729).
  defineNotice(MOD, noticeOf)
  registerDeck(on)
}
