import { expect, test } from 'claude-code/testing'

import { MIN_GAP_MS, POLL_INTERVAL_MS, USAGE } from '../hooks/logic.js'
import { DONE, START, startSession, stubs } from './helpers.js'

// The AbovePrompt props, the same set ui.test.tsx documents line by line.
const BAND = {
  plugin: 'git-poller',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 80, scroll: { offset: 0, bodyRows: 10 }, view: {} },
} as const

test('session.start runs git once with an argv list, then the timer polls', async ($, on) => {
  const s = stubs(on)
  await startSession($, s)
  expect(s.calls.length).toBe(1)
  // git runs in the session's directory: START carries cwd '/work'
  expect(s.calls[0]).toEqual(['git', '-C', '/work', 'status', '--porcelain=v1', '--branch'])
  expect(s.registered.length).toBe(1)
  await s.clock.advance(POLL_INTERVAL_MS - 1)
  expect(s.calls.length).toBe(1)
  await s.clock.advance(1)
  expect(s.calls.length).toBe(2)
})

test('a second session.start does not start a second timer', async ($, on) => {
  const s = stubs(on)
  await startSession($, s)
  await startSession($, s)
  const before = s.calls.length
  await s.clock.advance(POLL_INTERVAL_MS)
  expect(s.calls.length).toBe(before + 1)
})

test('session.start registers the command even when git is slow', async ($, on) => {
  const s = stubs(on)
  s.git.slow = true
  // Awaiting the first refresh would hang here: the stubbed git answers only after the clock advances
  await $.session.start(START)
  expect(s.registered.length).toBe(1)
  for (let i = 0; i < 3; i++) await s.clock.advance(1000)
  expect(s.calls.length).toBe(1)
})

test('a failing store read neither skips the command nor raises an unhandled rejection', async ($, on) => {
  const s = stubs(on)
  s.store.fails = true
  await startSession($, s)
  expect(s.registered.length).toBe(1)
  // The timer tick reads the store too: its rejection must stay inside the callback
  await s.clock.advance(POLL_INTERVAL_MS)
  expect(s.calls.length).toBe(0)
})

test('the band shows the branch and the counts', async ($, on) => {
  const s = stubs(on)
  await startSession($, s)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: 'main' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /1 changed/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /1 untracked/ })).toBeDefined()
  await ui.unmount()
  expect(s.calls.length).toBe(1)
})

test('a refresh that starts while one runs joins it', async ($, on) => {
  const s = stubs(on)
  await startSession($, s)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  s.git.slow = true
  const both = Promise.all([ui.press({ key: 'refresh' }), ui.press({ key: 'refresh' })])
  for (let i = 0; i < 3; i++) await s.clock.advance(1000)
  await both
  expect(s.calls.length).toBe(2)
  await ui.unmount()
})

test('turn.complete refreshes only after the minimum gap', async ($, on) => {
  const s = stubs(on)
  await startSession($, s)
  await $.turn.complete(DONE)
  await s.clock.settle()
  expect(s.calls.length).toBe(1)
  await s.clock.advance(MIN_GAP_MS)
  await $.turn.complete(DONE)
  await s.clock.settle()
  expect(s.calls.length).toBe(2)
})

test('turn.complete does not wait for a slow git', async ($, on) => {
  const s = stubs(on)
  await startSession($, s)
  await s.clock.advance(MIN_GAP_MS)
  s.git.slow = true
  // Awaiting the refresh would hang here: the stubbed git answers only after the clock advances
  const answer = await $.turn.complete(DONE)
  expect(answer).toBeDefined()
  for (let i = 0; i < 3; i++) await s.clock.advance(1000)
  expect(s.calls.length).toBe(2)
})

test('a failing store read in turn.complete neither throws nor starts git', async ($, on) => {
  const s = stubs(on)
  await startSession($, s)
  await s.clock.advance(MIN_GAP_MS)
  s.store.fails = true
  await $.turn.complete(DONE)
  await s.clock.settle()
  expect(s.calls.length).toBe(1)
})

test('without a session directory git does not run and the snapshot goes stale', async ($, on) => {
  const s = stubs(on)
  await startSession($, s)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  // A later session.start without a usable cwd: the old directory must not be reused
  await $.session.start({ ...START, cwd: '' })
  await s.clock.settle()
  await ui.press({ key: 'refresh' })
  expect(s.calls.length).toBe(1)
  expect(await ui.find({ type: 'Text', text: 'main' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /stale/ })).toBeDefined()
  await ui.unmount()
})

test('the band is drawn from the view atom: a failing store does not hide it', async ($, on) => {
  const s = stubs(on)
  await startSession($, s)
  s.store.fails = true
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: 'main' })).toBeDefined()
  await ui.unmount()
})

test('/git-poller off removes a mounted band and on brings it back', async ($, on) => {
  const s = stubs(on)
  await startSession($, s)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: 'main' })).toBeDefined()
  await $.command.run({ command: 'git-poller', args: 'off' })
  expect(await ui.find({ type: 'Text', text: 'main' })).toBeUndefined()
  await $.command.run({ command: 'git-poller', args: 'on' })
  await s.clock.settle()
  expect(await ui.find({ type: 'Text', text: 'main' })).toBeDefined()
  await ui.unmount()
})

test('a poll that read the store before /git-poller off does not switch the band back on', async ($, on) => {
  const s = stubs(on)
  await startSession($, s)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  // The timer tick reads the store (still on) and waits for the answer: the stub holds it back.
  s.store.slowNext = true
  await s.clock.advance(POLL_INTERVAL_MS)
  // The tick really read the store before the switch: the stub cleared its hold.
  expect(s.store.slowNext).toBe(false)
  // The user switches off while that read is in flight; the held-back read still answers true.
  await $.command.run({ command: 'git-poller', args: 'off' })
  expect(await ui.find({ type: 'Text', text: 'main' })).toBeUndefined()
  for (let i = 0; i < 3; i++) await s.clock.advance(1000)
  await s.clock.settle()
  expect(await ui.find({ type: 'Text', text: 'main' })).toBeUndefined()
  await ui.unmount()
})

test('a startup read that /git-poller off overtook does not switch the band back on', async ($, on) => {
  const s = stubs(on)
  // The session.start kick reads the store (still on) and waits for the answer: the stub holds it back.
  s.store.slowNext = true
  await $.session.start(START)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  // The user switches off while the kick's read is in flight; the held-back read still answers true.
  await $.command.run({ command: 'git-poller', args: 'off' })
  expect(s.store.slowNext).toBe(false)
  for (let i = 0; i < 3; i++) await s.clock.advance(1000)
  await s.clock.settle()
  expect(await ui.find({ type: 'Text', text: 'main' })).toBeUndefined()
  // The kick did not poll either: no git call after the switch.
  expect(s.calls.length).toBe(0)
  await ui.unmount()
})

test('a subagent turn does not refresh', async ($, on) => {
  const s = stubs(on)
  await startSession($, s)
  await s.clock.advance(MIN_GAP_MS)
  await $.turn.complete({ ...DONE, agentId: 'sub1' })
  await s.clock.settle()
  expect(s.calls.length).toBe(1)
})

test('a git error keeps the last good snapshot and marks it stale', async ($, on) => {
  const s = stubs(on)
  await startSession($, s)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  s.git.exitCode = 128
  s.git.stdout = 'fatal: not a git repository\n'
  await ui.press({ key: 'refresh' })
  expect(await ui.find({ type: 'Text', text: 'main' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /stale/ })).toBeDefined()
  await ui.unmount()
})

test('a git call that rejects keeps the last good snapshot', async ($, on) => {
  const s = stubs(on)
  await startSession($, s)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  s.git.reject = true
  await ui.press({ key: 'refresh' })
  expect(await ui.find({ type: 'Text', text: 'main' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /stale/ })).toBeDefined()
  await ui.unmount()
})

test('/git-poller off silences every hook and the timer, on brings it back', async ($, on) => {
  const s = stubs(on)
  await startSession($, s)
  await $.command.run({ command: 'git-poller', args: 'off' })
  expect(s.saved.get('git-poller.enabled')).toBe(false)
  expect(s.toasts).toEqual(['git-poller off'])
  const before = s.calls.length
  await s.clock.advance(POLL_INTERVAL_MS)
  await s.clock.advance(MIN_GAP_MS)
  await $.turn.complete(DONE)
  await s.clock.settle()
  expect(s.calls.length).toBe(before)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: 'main' })).toBeUndefined()
  await ui.unmount()
  await $.command.run({ command: 'git-poller', args: 'on' })
  await s.clock.settle()
  expect(s.toasts).toEqual(['git-poller off', 'git-poller on'])
  expect(s.calls.length).toBe(before + 1)
})

test('a bare /git-poller toggles and a bad argument answers usage', async ($, on) => {
  const s = stubs(on)
  await startSession($, s)
  await $.command.run({ command: 'git-poller', args: '' })
  expect(s.saved.get('git-poller.enabled')).toBe(false)
  await $.command.run({ command: 'git-poller', args: '' })
  expect(s.saved.get('git-poller.enabled')).toBe(true)
  const answer = await $.command.run({ command: 'git-poller', args: 'maybe' })
  expect(answer.text).toBe(USAGE)
  expect(s.saved.get('git-poller.enabled')).toBe(true)
})
