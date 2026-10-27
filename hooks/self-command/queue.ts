// The commands the run tool has queued and not yet run, per session, for the pane to show.
// Module memory, not $.store: a queued run lives only until its timer fires, so a reload that drops
// this map also cancelled the timers it described (the types say a hot reload cancels pending waits).
import type { RunRequest } from './logic'

const queuedBySession = new Map<string, RunRequest[]>()

/** What `session` has queued, oldest first. Read-only: never creates an entry. */
export const queuedFor = (session: string): readonly RunRequest[] => queuedBySession.get(session) ?? []

export function addQueued(session: string, request: RunRequest): void {
  queuedBySession.set(session, [...queuedFor(session), request])
}

/** Drops the first queued entry equal to `request`; the map keeps no empty list. */
export function removeQueued(session: string, request: RunRequest): void {
  const list = [...queuedFor(session)]
  const at = list.findIndex((r) => r.command === request.command && r.args === request.args)
  if (at >= 0) list.splice(at, 1)
  if (list.length === 0) queuedBySession.delete(session)
  else queuedBySession.set(session, list)
}
