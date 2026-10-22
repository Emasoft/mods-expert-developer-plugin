// Pure decisions for turn-timer. No `$` here: every function takes values and returns values.

/** A turn at or above this many milliseconds is slow and earns a toast. */
export const SLOW_TURN_MS = 60_000

/** The `$.store` key holding the on/off switch. A missing key means on. */
export const ENABLED_KEY = 'turn-timer.enabled'

export const USAGE = 'usage: /turn-timer [on|off]'

export type Snapshot = { turnId: string; durationMs: number; isAborted: boolean }

/** 800 -> "0.8s", 12345 -> "12.3s", 59950 -> "59.9s", 65000 -> "1m 05s". */
export function formatDuration(ms: number): string {
  // Floor to tenths, never round: 59_950 must read 59.9s, because rounding would show 60.0s
  // while shouldToast (which compares raw milliseconds) stays silent below the threshold.
  if (ms < 60_000) return (Math.floor(ms / 100) / 10).toFixed(1) + 's'
  const total = Math.round(ms / 1000)
  const seconds = String(total % 60).padStart(2, '0')
  return Math.floor(total / 60) + 'm ' + seconds + 's'
}

export function statusText(snap: Snapshot): string {
  const base = 'last turn ' + formatDuration(snap.durationMs)
  return snap.isAborted ? base + ' (interrupted)' : base
}

/**
 * Toast on the transition only: a new, slow, uninterrupted turn, with an earlier snapshot to
 * compare against. The first snapshot (prev null) is recorded silently, and the same turnId
 * never toasts twice.
 */
export function shouldToast(prev: Snapshot | null, next: Snapshot): boolean {
  if (prev === null) return false
  if (prev.turnId === next.turnId) return false
  if (next.isAborted) return false
  return next.durationMs >= SLOW_TURN_MS
}

export function slowToastText(snap: Snapshot): string {
  return 'Slow turn: ' + formatDuration(snap.durationMs) + ' (limit ' + formatDuration(SLOW_TURN_MS) + ')'
}

/** The new switch value for `args`, or null when the argument is unknown (answer with USAGE). */
export function parseSwitch(args: string, current: boolean): boolean | null {
  const word = args.trim().toLowerCase()
  if (word === '') return !current
  if (word === 'on') return true
  if (word === 'off') return false
  return null
}
