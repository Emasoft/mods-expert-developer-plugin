// What follows a switch write beyond the store (TRDD-5IK59SQ2), called by the registry (./switches/register.ts) after
// each write. A hooks module may pass $ only to a function declared at the top level of its own files, called by name:
// the static-analysis rules in the mods-doc-mods-development chapter (Check what Claude Code reads from your mod), and the
// loader refused a $ passed to a Map callback when C6a tried one. So the registry holds no callbacks, and each switch that
// governs a timer is named here, with its mod's function called by name.
//
// This makes an import cycle: ./switches/register.ts imports this file, which reaches ./mod-manager/state.ts, which imports
// ./switches/register.ts. It is sound because every import along it is used inside a function, never while the modules
// load; keep it so (no top-level call into another file of the cycle).
import type { EngineInterface } from 'claude-code'

import { followAutoUpdate } from './mod-manager/auto-timer'
import { followBadgeSwitch } from './mod-manager/state'
import { AUTO_UPDATE, FN } from './mod-manager/switches'
import { followTokensaverSwitch } from './tokensaver/mod'

export function followSwitch($: EngineInterface, id: string, on: boolean): void {
  if (id === AUTO_UPDATE) followAutoUpdate($, on)
  // The status-line badge counts what the catalogs say, so either switch turned off clears it (TRDD-5IK59SQ2, C6b).
  else if (id === FN.badge || id === FN.latest) followBadgeSwitch($, on)
  // Tokensaver's switches reach the configs its savers read (TRDD-71KVH9PA): every value is read again, whatever was written.
  else if (id.startsWith('tokensaver.')) followTokensaverSwitch($, id, on)
}
