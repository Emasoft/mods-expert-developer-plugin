import { expect, test } from 'claude-code/testing'

import { SLOW_TURN_MS, formatDuration, parseSwitch, shouldToast, statusText } from '../hooks/logic.js'
import type { Snapshot } from '../hooks/logic.js'

const turn = (turnId: string, durationMs: number, isAborted = false): Snapshot => ({ turnId, durationMs, isAborted })

test('formatDuration shows seconds under a minute and minutes above', () => {
  expect(formatDuration(800)).toBe('0.8s')
  expect(formatDuration(12_345)).toBe('12.3s')
  // Floored, so the status never reads 60.0s while no toast fires
  expect(formatDuration(59_950)).toBe('59.9s')
})

test('statusText marks an interrupted turn', () => {
  expect(statusText(turn('a', 2000))).toBe('last turn 2.0s')
  expect(statusText(turn('a', 2000, true))).toBe('last turn 2.0s (interrupted)')
})

test('the first snapshot never toasts, however slow', () => {
  expect(shouldToast(null, turn('a', SLOW_TURN_MS * 5))).toBe(false)
})

test('a new turn at the threshold toasts, one just under does not', () => {
  expect(shouldToast(turn('a', 1000), turn('b', SLOW_TURN_MS))).toBe(true)
  expect(shouldToast(turn('a', 1000), turn('b', SLOW_TURN_MS - 1))).toBe(false)
})

test('the same turn id never toasts twice', () => {
  expect(shouldToast(turn('b', SLOW_TURN_MS), turn('b', SLOW_TURN_MS))).toBe(false)
})

test('an interrupted slow turn does not toast', () => {
  expect(shouldToast(turn('a', 1000), turn('b', SLOW_TURN_MS, true))).toBe(false)
})

test('parseSwitch toggles on empty, sets on or off, and rejects the rest', () => {
  expect(parseSwitch('', true)).toBe(false)
  expect(parseSwitch('  ', false)).toBe(true)
  expect(parseSwitch('on', false)).toBe(true)
  expect(parseSwitch('off', true)).toBe(false)
  expect(parseSwitch(' OFF ', true)).toBe(false)
  expect(parseSwitch('On', false)).toBe(true)
  expect(parseSwitch('maybe', true)).toBeNull()
})
