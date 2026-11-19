// The integrated Deck's module state that the port adds (TRDD-RD1ISPMN, D1b rulings R1 and R7): the one clock, the
// sessions Deck started in, the starts in flight, the start-failed notices and the error count. Deck's own state (bars,
// agents, prefs) is per module in ./register.js, so the clock is too: one per module, held in the pattern of
// hooks/mod-manager/auto-timer.ts at edcdb75. ./register.js and ./mod.ts both read this file; it imports neither.
import type { EngineInterface, Timer } from 'claude-code'

import { maskedLog } from '../debug-log/register'
import { noticeChanged } from '../switches/register'

export const START_FAILED_NOTICE = 'Deck could not start in this session; the plugin log says why. A new session tries again.'

let clock: Timer | undefined
const started = new Set<string>()
const starting = new Map<string, Promise<void>>()
// What Deck's notice says, per session: one module may serve more than one session.
const notices = new Map<string, string>()
// Errors Deck caught and set aside: a failed tick, a rejected saved setting, a router-line hook that threw. D1d shows
// the count; until then each one also goes to the debug log.
let errors = 0
// Each master off adds one (stopAll); a start still loading when it changes marks nothing (R1, G13.1).
let stops = 0

export const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error))

export const hasClock = (): boolean => clock !== undefined
export const isClock = (timer: Timer): boolean => clock === timer

/** Holds the module's clock, cancelling one held before, so a module never runs two. */
export function holdClock(timer: Timer): void {
  clock?.cancel()
  clock = timer
}

export const isStarted = (session: string): boolean => started.has(session)
/** False while Deck runs in no session: a hook then needs no session id to know it does nothing. */
export const anyStarted = (): boolean => started.size > 0
export function markStarted(session: string): void {
  started.add(session)
}

/** The start running in this session, if one is: a second start joins it instead of loading Deck twice. */
export const startOf = (session: string): Promise<void> | undefined => starting.get(session)
export function holdStart(session: string, start: Promise<void>): void {
  starting.set(session, start)
}
export function dropStart(session: string, start: Promise<void>): void {
  if (starting.get(session) === start) starting.delete(session)
}

// The half a /clear or a resume leaves behind (R3; ruling Q3, L: lazy adoption). Such an end goes on under a new
// session id with no session.start (index.d.ts, SessionEndInput.reason), so R7 alone would leave Deck acting nowhere in
// it. session.end records what the ending session had, and the first Deck call in a new session id with no Deck state
// takes it (adoptCarried). A notice of undefined means the ended session was started.
let carried: { notice: string | undefined } | undefined

// The sessions the gate found unstarted at a Deck call (judgeSession). One of them is no new id, so it never takes a
// half: the id a /clear goes on under is new by construction, while a session Deck never started would otherwise take
// the half at its next Deck call (first review of D1b-2 commit 1). A draw or an event Claude Code raises on its own
// judges nothing: it can come for the new id before the clear's session.end (second review). session.end forgets its
// own id. One entry per session id seen unstarted and never ended: small, accepted.
const judged = new Set<string>()

/** True while a half waits: deckLive then asks for the session id even while Deck runs in no session. */
export const hasCarried = (): boolean => carried !== undefined

/**
 * session.end of a session that goes on under a new id: records its start, or its start-failed notice. A session with
 * neither carries nothing, and so does one whose start is still loading after a failed one, since that start may yet
 * succeed or fail: /mods-deck on recovers it. A later end with a start or a notice replaces an earlier half; one with
 * neither leaves it. A session that is started and also holds a notice (a failed reload) carries its start only.
 */
export function carryEnded(session: string): void {
  if (started.has(session)) carried = { notice: undefined }
  else if (!starting.has(session) && notices.has(session)) carried = { notice: notices.get(session) }
}

/**
 * The first Deck call in a new session, one the gate has not judged and with no Deck state (no start, no start loading,
 * no notice), takes the half: the session is marked started with no reload, since Deck's state is per module and stays
 * loaded, or gets the carried notice. When one module serves more than one session, another new session id can make its
 * first Deck call first and take the half meant for the cleared one (disclosed on TRDD-RD1ISPMN, Q3). No session start
 * ends the wait (index.d.ts:4529-4530: none comes from the cleared session), so a half nobody takes stays until a master
 * off; a session started while the master was off, whose first Deck call comes then, takes it (disclosed, R7).
 */
export function adoptCarried(session: string): void {
  if (carried === undefined || judged.has(session) || started.has(session) || starting.has(session) || notices.has(session)) {
    return
  }
  if (carried.notice === undefined) started.add(session)
  else notices.set(session, carried.notice)
  carried = undefined
}

/**
 * The gate's verdict on a Deck call (deckLive, /mods-deck's status check, never a draw): true when Deck runs in the
 * session. A session the gate has not judged before first takes a waiting half (adoptCarried); one found unstarted is
 * remembered as judged.
 */
export function judgeSession(session: string): boolean {
  adoptCarried(session)
  if (started.has(session)) return true
  judged.add(session)
  return false
}

/** session.end: the ended id is no longer remembered as judged. */
export function forgetJudged(session: string): void {
  judged.delete(session)
}

/**
 * Master off (G13.1, R1): cancels the clock and forgets every session's start, the starts still running, every
 * start-failed notice and a /clear's half, so Deck runs again only after a start (R7). Counts the stop, so a start that
 * was loading when it came marks nothing and sets no clock (stopCount), and a timer set before it does nothing when it
 * fires. Makes no $ call, so a hook that reads the master off passes its event on with no other call. True when a notice
 * was dropped: a caller in a session can then redraw the switches pane.
 */
export function stopAll(): boolean {
  stops++
  clock?.cancel()
  clock = undefined
  started.clear()
  starting.clear()
  carried = undefined
  const hadNotice = notices.size > 0
  notices.clear()
  return hadNotice
}

/** How many times Deck was stopped: a start or a timer compares it with the count it read when it began. */
export const stopCount = (): number => stops

export const noticeOf = (session: string): string | undefined => notices.get(session)

/** Drops this session's start-failed notice at a successful start; true when there was one. */
export function clearNotice(session: string): boolean {
  return notices.delete(session)
}

export function countError(): void {
  errors++
}
export const errorCount = (): number => errors

/**
 * A start that failed (hooks/index.ts's catch, the follower, /mods-deck on): the reason goes to the log, masked and then
 * made printable by maskedLog, and Deck's notice says the start failed, under its heading in the switches pane
 * (orchestrator condition 2). The message reaches maskedLog raw: cleaned first, a control character in the home folder
 * would become a '?' and the mask would no longer find the folder. It never throws: a throw in index.ts's catch would
 * skip the starts after it.
 */
export async function deckStartFailed($: EngineInterface, error: unknown): Promise<void> {
  maskedLog($, `deck: start failed: ${messageOf(error)}`)
  try {
    notices.set(await $.session.id(), START_FAILED_NOTICE)
    noticeChanged($)
  } catch (failure) {
    maskedLog($, `deck: the start failure could not be shown in the switches pane: ${messageOf(failure)}`)
  }
}
