import type { Snapshot } from '../types/index.js'

export const MOD_NAME = 'git-poller'
// Store key for the off switch. A missing key means on.
export const ENABLED_KEY = 'git-poller.enabled'
export const USAGE = 'usage: /git-poller [on|off]'
// How often the timer refreshes the snapshot.
export const POLL_INTERVAL_MS = 15_000
// Minimum time between two refreshes started by turn.complete.
export const MIN_GAP_MS = 5_000
// What git is asked, after `git -C <cwd>`.
export const GIT_STATUS_ARGS = ['status', '--porcelain=v1', '--branch'] as const

/** The argument list for $.process.run: git runs in the session's directory, not wherever the engine runs. */
export function gitArgv(cwd: string): string[] {
  return ['git', '-C', cwd, ...GIT_STATUS_ARGS]
}

/**
 * Parses the output of `git status --porcelain=v1 --branch`.
 * Returns null when the first line is not a branch header (not a repo, or not git output).
 */
export function parseStatus(stdout: string): Snapshot | null {
  const lines = stdout.split('\n').filter(Boolean)
  const header = lines[0]
  if (header === undefined || !header.startsWith('## ')) return null
  const text = header.slice(3)
  let branch: string
  // Older git prints "Initial commit on <branch>" where newer git prints "No commits yet on <branch>".
  // UNVERIFIED: both spellings come from git itself, not from a chapter; the tests feed them as text.
  if (text.startsWith('No commits yet on ')) branch = text.slice('No commits yet on '.length)
  else if (text.startsWith('Initial commit on ')) branch = text.slice('Initial commit on '.length)
  else if (text.startsWith('HEAD (no branch)')) branch = '(detached)'
  else branch = text.split('...')[0]!.split(' [')[0]!
  let changed = 0
  let untracked = 0
  for (const line of lines.slice(1)) {
    if (line.startsWith('?? ')) untracked += 1
    else changed += 1
  }
  return { branch, changed, untracked }
}

export type SwitchAction = { kind: 'set'; enabled: boolean } | { kind: 'usage' }

/** Reads the argument of /git-poller: empty toggles, on and off set, anything else is usage. */
export function parseSwitch(args: string, current: boolean): SwitchAction {
  const word = args.trim().toLowerCase()
  if (word === '') return { kind: 'set', enabled: !current }
  if (word === 'on') return { kind: 'set', enabled: true }
  if (word === 'off') return { kind: 'set', enabled: false }
  return { kind: 'usage' }
}

/** True when no refresh has started yet, or the last one started at least gapMs ago. */
export function isDue(now: number, lastStartedAt: number | null, gapMs: number): boolean {
  return lastStartedAt === null || now - lastStartedAt >= gapMs
}
