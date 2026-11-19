// 2k: the timers of the automatic-update check (TRDD-R2QYIN8O), per session, set only while its switch is on
// (TRDD-5IK59SQ2: a function that is off runs nothing, a timer included). Module memory: a reload cancels the old copy's
// timers (types, $.clock) and the fresh copy's start sets them again when the switch is on (register.ts).
import type { EngineInterface, Timer } from 'claude-code'

import { maskedLog } from '../debug-log/register'
import { AUTO_PERIOD_MS, AUTO_START_MS } from './auto-update'
import { autoUpdateTick } from './state'

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error))

const autoTimers = new Map<string, Timer[]>()

/**
 * At a session start: sets this session's check timers, replacing any it set before, so a start that runs again in a
 * session never leaves two sets, and a set the engine has dropped is restored at the next start (C6a review: the lifetime
 * of a session's timers against this module's memory was not measured).
 */
export async function startAutoTimers($: EngineInterface): Promise<void> {
  const session = await $.session.id()
  stopAutoTimers(session)
  setAutoTimers($, session)
}

/**
 * The first check two minutes on, so a session that only starts and ends runs none, then one an hour. A check that reads
 * the switch off (turned off in another session, which this session's registry does not hear) resolves false and stops
 * them, so a switch turned off elsewhere leaves this session's timer running until its next check, up to an hour.
 *
 * Known race, not closed: when this session turns the switch on while a check that read it off is still running, the
 * on finds the timers live and keeps them, the check's stop then cancels them, and this session checks again from its
 * next start.
 */
function setAutoTimers($: EngineInterface, session: string): void {
  const timers: Timer[] = []
  autoTimers.set(session, timers)
  timers.push(
    $.clock.after(AUTO_START_MS, () => {
      // A stopped timer never fires again (types, Timer). Should a set that was stopped or replaced run anyway, it does
      // nothing: no check, and no hourly timer pushed into a set nothing holds any more, which nothing could cancel.
      if (autoTimers.get(session) !== timers) return
      void check($, session)
      timers.push($.clock.every(AUTO_PERIOD_MS, () => void check($, session)))
    }),
  )
}

async function check($: EngineInterface, session: string): Promise<void> {
  if (!(await autoUpdateTick($))) stopAutoTimers(session)
}

function stopAutoTimers(session: string): void {
  for (const timer of autoTimers.get(session) ?? []) timer.cancel()
  autoTimers.delete(session)
}

/**
 * Starts or stops this session's timers when the registry writes the switch here: the pane's Auto-update button,
 * /mods-switches or the agent's switches tool (../switch-followers.ts). An on while the timers are live keeps them: the
 * registry follows every write, changed or not, and replacing them would put the next check two minutes off again at each
 * on. A failure goes to the debug log, since nobody pressed anything here.
 */
export function followAutoUpdate($: EngineInterface, on: boolean): void {
  void $.session
    .id()
    .then((session) => {
      if (!on) stopAutoTimers(session)
      else if (!autoTimers.has(session)) setAutoTimers($, session)
    })
    .catch((error: unknown) => maskedLog($, `mods-manager: the auto-update timer could not be ${on ? 'set' : 'stopped'}: ${messageOf(error)}`, { to: 'debug' }))
}
