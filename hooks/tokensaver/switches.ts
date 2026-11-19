// The functions of the integrated Tokensaver (TRDD-71KVH9PA, PRRD G13.1) in the switch registry every integrated mod shares
// (../switches), with the defaults the card records (ruling Q3): every saver on, and the three functions that change what the
// session spends (routing, escalation, auto-compact) off, because each one either changes the model a sub-agent runs on or
// sends a model request. The debug log is off (G14.1). Pure: ./mod.ts reads them through the registry.
import { debugLogSwitch } from '../debug-log/logic'
import type { SwitchDef } from '../switches/logic'

export const MOD = 'tokensaver'

export const MASTER = 'tokensaver.master'
export const VOICE = 'tokensaver.voice'
export const TRIM = 'tokensaver.trim'
export const PASTES = 'tokensaver.pastes'
export const DELEGATION_HINT = 'tokensaver.delegation-hint'
export const STATUS_LINE = 'tokensaver.status-line'
export const DRY_RUN = 'tokensaver.dry-run'
export const COLD_CACHE = 'tokensaver.cold-cache'
export const REDUCED_MOTION = 'tokensaver.reduced-motion'
export const ROUTING = 'tokensaver.routing'
export const ESCALATION = 'tokensaver.escalation'
export const AUTO_COMPACT = 'tokensaver.auto-compact'

export const TOKENSAVER_SWITCHES: readonly SwitchDef[] = [
  // Off by default in release 1.0.0. The double-running guard is not ported yet (mod.ts, the note above the start: "until
  // then a failure is the only notice"), so with the standalone Tokensaver plugin installed an on-by-default master would
  // run both copies: two voices, two trims, two status-line segments. It goes back to on by default when the guard is
  // ported and its kit tests pass (TRDD-71KVH9PA).
  { id: MASTER, mod: MOD, label: 'Tokensaver (off by default until it can detect the standalone Tokensaver plugin; off turns every Tokensaver function off)', defaultOn: false },
  // One voice switch covers the three places the voice shows (ruling Q3): the prompt rule, the report note, the terse summary.
  { id: VOICE, mod: MOD, label: 'Caveman voice: the prompt rule, the sub-agent report note and the terse compaction summary', defaultOn: true },
  { id: TRIM, mod: MOD, label: 'Trim noisy shell output before it reaches the context', defaultOn: true },
  { id: PASTES, mod: MOD, label: 'Tidy pasted logs before they are stored', defaultOn: true },
  { id: DELEGATION_HINT, mod: MOD, label: 'The sub-agent delegation hint', defaultOn: true },
  { id: STATUS_LINE, mod: MOD, label: 'The status line', defaultOn: true },
  { id: DRY_RUN, mod: MOD, label: 'Dry run: report what would be saved, change nothing', defaultOn: false },
  { id: COLD_CACHE, mod: MOD, label: 'Warn when the prompt cache has gone cold', defaultOn: true },
  { id: REDUCED_MOTION, mod: MOD, label: 'Reduced motion: no animation', defaultOn: false },
  { id: ROUTING, mod: MOD, label: 'Sub-agent model routing (off because it changes the model a sub-agent runs on)', defaultOn: false },
  { id: ESCALATION, mod: MOD, label: 'Re-run a failed sub-agent one model tier up (off because it sends a model request)', defaultOn: false },
  { id: AUTO_COMPACT, mod: MOD, label: 'Compact between turns when the context passes a set fill (off because it triggers compaction)', defaultOn: false },
  debugLogSwitch(MOD),
]
