import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

import { ENABLED_KEY, SLOW_TURN_MS, USAGE } from '../hooks/logic.js'

// The engine's command.run input also carries where the run came from and how the answer is shown (CommandRunInput: origin, presentation).
const RUN = { origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } } as const

// Stubs every call the mod makes and records what it showed. Register before the first call on $.
function stubs(on: On, initial: Record<string, unknown> = {}) {
  const saved = new Map<string, unknown>(Object.entries(initial))
  const toasts: string[] = []
  const statuses: (string | undefined)[] = [] // ui.status text is undefined when the mod clears the line
  let registered = 0
  on('store.get', ($, e) => ({ value: saved.get(e.key) }))
  on('store.set', ($, e) => {
    saved.set(e.key, e.value)
    return { value: undefined }
  })
  on('ui.toast', ($, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('ui.status', ($, e) => {
    statuses.push(e.text)
    return { value: undefined }
  })
  on('command.register', ($, e) => {
    registered += 1
    return { value: { command: e.name } }
  })
  on('session.start', () => ({ cwd: '/work' }))
  on('turn.complete', () => ({ text: '' }))
  return { saved, toasts, statuses, registered: () => registered }
}

const done = (turnId: string, durationMs: number) =>
  ({ turnId, answer: '', durationMs, isAborted: false, reason: 'answer' }) as const

test('session.start registers the command', async ($, on) => {
  const s = stubs(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  expect(s.registered()).toBe(1)
})

test('a new session does not compare its first turn with the previous session', async ($, on) => {
  const s = stubs(on)
  await $.turn.complete(done('t1', 1000))
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  // Without the reset in session.start this slow turn would toast against t1
  await $.turn.complete(done('t2', SLOW_TURN_MS))
  expect(s.toasts).toEqual([])
})

test('the status line follows every turn, the toast only a new slow one', async ($, on) => {
  const s = stubs(on)
  // First snapshot: slow, but recorded silently
  await $.turn.complete(done('t1', SLOW_TURN_MS * 2))
  expect(s.statuses).toEqual(['last turn 2m 00s'])
  expect(s.toasts).toEqual([])
  // A fast turn: status only
  await $.turn.complete(done('t2', 1500))
  expect(s.statuses[1]).toBe('last turn 1.5s')
  expect(s.toasts).toEqual([])
  // A new slow turn: one toast
  await $.turn.complete(done('t3', SLOW_TURN_MS))
  expect(s.toasts.length).toBe(1)
  // The same slow turn reported again: no second toast
  await $.turn.complete(done('t3', SLOW_TURN_MS))
  expect(s.toasts.length).toBe(1)
})

test('a subagent turn is ignored', async ($, on) => {
  const s = stubs(on)
  // UNVERIFIED: the chapter does not say whether the test kit accepts agentId on $.turn.complete.
  await $.turn.complete({ ...done('t1', 1000), agentId: 'sub-1' })
  expect(s.statuses).toEqual([])
})

test('the bare command toggles off and on, and the hooks obey', async ($, on) => {
  const s = stubs(on)
  const off = await $.command.run({ command: 'turn-timer', args: '', ...RUN })
  expect(off).toEqual({})
  expect(s.saved.get(ENABLED_KEY)).toBe(false)
  expect(s.toasts).toEqual(['turn-timer off'])
  const before = s.statuses.length
  await $.turn.complete(done('t1', 1000))
  expect(s.statuses.length).toBe(before)

  await $.command.run({ command: 'turn-timer', args: '', ...RUN })
  expect(s.saved.get(ENABLED_KEY)).toBe(true)
  expect(s.toasts[1]).toBe('turn-timer on')
  await $.turn.complete(done('t2', 1000))
  expect(s.statuses[s.statuses.length - 1]).toBe('last turn 1.0s')
})

test('on and off set the state; an unknown argument answers usage and changes nothing', async ($, on) => {
  const s = stubs(on)
  await $.command.run({ command: 'turn-timer', args: 'off', ...RUN })
  expect(s.saved.get(ENABLED_KEY)).toBe(false)
  await $.command.run({ command: 'turn-timer', args: 'on', ...RUN })
  expect(s.statuses).toEqual(['off', 'on'])
  expect(s.saved.get(ENABLED_KEY)).toBe(true)
  const toastsBefore = s.toasts.length
  const answer = await $.command.run({ command: 'turn-timer', args: 'banana', ...RUN })
  expect(answer.text).toBe(USAGE)
  expect(s.saved.get(ENABLED_KEY)).toBe(true)
  expect(s.toasts.length).toBe(toastsBefore)
})

test('an off state already in the store keeps the mod off', async ($, on) => {
  const s = stubs(on, { [ENABLED_KEY]: false })
  await $.turn.complete(done('t1', 1000))
  expect(s.statuses).toEqual([])
})
