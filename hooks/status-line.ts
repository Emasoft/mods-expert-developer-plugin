// The status line is ONE line per plugin (`$.ui.status`: "One per plugin"), and more than one mod of this plugin has
// something to say on it: mod-manager counts the pending updates, Tokensaver reports what it saved. This module is the
// only writer: each mod keeps its own segment here, and the line is the segments joined in the order they first appeared
// (`TRDD-71KVH9PA`, T2). Without it the mod whose drawing ran last erased the other.
//
// ONE Map serves every session the module is loaded for, while `$.ui.status` pins a line per session. That is safe only
// because each writer states its segment at the start of every session, the text or its absence: Tokensaver at each
// attach through sync -> refresh (it resets `shownStatus` there for the same reason), and mod-manager at the list's first
// read, which clears the badge when its switches are off. A third writer must do the same, or a segment left by another
// session will lead this one's line. The map is not keyed by session because `$.session.id()` is asynchronous and
// Tokensaver's redraw is not.
import type { EngineInterface } from 'claude-code'

const segments = new Map<string, string>()

/**
 * Sets, replaces or clears `text` as the `owner` mod's segment of the status line, then writes the joined line.
 * `undefined` removes the segment, so one mod switching its display off leaves the other mods' segments standing.
 */
export function setStatusLine($: EngineInterface, owner: string, text: string | undefined): void {
  if (text === undefined) {
    segments.delete(owner)
  } else {
    segments.set(owner, text)
  }

  const joined = [...segments.values()].join(' · ')

  // `undefined` removes the line (types, $.ui.status); an empty string would pin an empty line in its place.
  $.ui.status(joined === '' ? undefined : joined)
}
