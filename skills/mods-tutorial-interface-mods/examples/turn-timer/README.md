# turn-timer

## What it shows

- A status line under the prompt with the duration of the last turn, for example `last turn 12.3s`.
- A toast when a turn reaches the slow threshold, only on the transition: never on the first turn the mod sees, never twice for the same turn, and not for an interrupted turn.
- The main loop only: an event whose `agentId` is set (a subagent) is ignored.
- A switch that survives a restart.

## Settings

Constants exported from `hooks/logic.ts`:

| Constant | Value | Meaning |
|---|---|---|
| `SLOW_TURN_MS` | `60000` | A turn of 60 seconds or more is slow and earns a toast. |
| `ENABLED_KEY` | `'turn-timer.enabled'` | The `$.store` key holding the switch. |
| `USAGE` | `'usage: /turn-timer [on\|off]'` | The answer to an unknown argument. |

Durations under a minute are floored to tenths of a second (59.95 seconds reads `59.9s`), so the status never shows 60.0s while no toast fires. A new session forgets the previous turn, so its first turn never toasts.

## Commands

| Command | What it does |
|---|---|
| `/turn-timer` | Toggles the mod. |
| `/turn-timer on` | Turns it on and sets the status line to `on`. |
| `/turn-timer off` | Turns it off and sets the status line to `off`. |
| `/turn-timer <anything else>` | Answers `usage: /turn-timer [on\|off]` and changes nothing. |

Each change shows a toast, `turn-timer on` or `turn-timer off`. The state is the boolean `turn-timer.enabled` in `$.store`; a missing key means on.

## House conventions it follows

- On/off switch: the command is named after the mod, toggles when bare, and keeps its state in `$.store`. When off, the turn hook returns `next(e)` untouched.
- Pure logic in `hooks/logic.ts`, thin `hooks/register.ts`.
- Toasts on transitions only.
- Main loop only (the `agentId` check).
- Tests that mutation-check each guard.

## Tests

`claude plugin test` runs `tests/logic.test.ts` (the pure functions) and `tests/register.test.ts` (the hooks, with the store, the status line and the toast stubbed by the test kit). Nothing runs for real.

## Unverified

- `tests/register.test.ts`: the chapters do not say whether the test kit accepts an `agentId` field on `$.turn.complete`. The subagent test passes it anyway.

## Remove it

Delete this folder, or take it out of `CLAUDE_CODE_PLUGIN_DIRS`. To forget the switch, run `$.store.delete` for `turn-timer.enabled` from a mod, or leave it: it is one boolean.

## Licence

Written for this plugin; MIT, see LICENSE in this folder (a copy of the repository LICENSE). The ../LICENSE one level up covers the BeLazy167 examples, not this one.
