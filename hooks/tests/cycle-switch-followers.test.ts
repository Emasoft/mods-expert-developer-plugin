// The import cycle named in ../switch-followers.ts loads with switch-followers.ts evaluated first. Each test file loads its own
// modules, so the four cycle-*.test.ts files put each member of the cycle first. A member that read another's binding
// while the modules load fails the import; the test then reads two values the members compute at load, which a hoisted
// function declaration does not show: mod-manager/state.ts's initial state (stateIn) and switches/register.ts's
// registry (switchDefs). switch-followers.ts holds no top-level value, and auto-timer.ts keeps its map private
// (TRDD-5IK59SQ2; review of d783048).
import { expect, test } from 'claude-code/testing'

import '../switch-followers'
import { stateIn } from '../mod-manager/state'
import { switchDefs } from '../switches/register'

test('hooks/switch-followers.ts, imported first, loads the import cycle of switch-followers.ts, with the values its members compute at load', () => {
  // Only what holds whatever INITIAL grows into: a session never read is not loaded (review of af28048, which pinned
  // more of INITIAL and would turn red on a change unrelated to the cycle).
  expect(stateIn('no-session').loaded).toBe(false)
  expect(switchDefs()).toEqual([])
})
