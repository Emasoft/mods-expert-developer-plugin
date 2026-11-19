// Behaviour of the usage-windows-by-kind reference module: windows are read by kind and an absent window shows nothing.
import { describe, expect, test } from 'claude-code/testing'

import { shareUsed, usageLines, windowOf, type RateLimit } from '../usage-windows-by-kind'

const five: RateLimit = { kind: 'five_hour', percentUsed: 41.6 }
const week: RateLimit = { kind: 'seven_day', percentUsed: 12 }

describe('usageLines', () => {
  test('with a five-hour and a seven-day window, both are shown, five-hour first', () => {
    expect(usageLines([week, five])).toEqual(['five-hour 42%', 'weekly 12%'])
  })
  test('with the seven-day window only, only the weekly line is shown', () => {
    expect(usageLines([week])).toEqual(['weekly 12%'])
  })
  test('an unknown kind is shown under its raw label, never renamed', () => {
    expect(usageLines([week, { kind: 'mystery_window', percentUsed: 7 }])).toEqual(['weekly 12%', 'mystery_window 7%'])
  })
  test('an empty list shows nothing', () => {
    expect(usageLines([])).toEqual([])
  })
})

describe('windowOf and shareUsed', () => {
  test('lookup is by kind, not by position', () => {
    expect(windowOf([week, five], 'five_hour')).toBe(five)
  })
  test('an absent window gives undefined and a null share, never zero', () => {
    expect(windowOf([week], 'five_hour')).toBeUndefined()
    expect(shareUsed([week], 'five_hour')).toBeNull()
    expect(shareUsed([week], 'seven_day')).toBe(0.12)
  })
})
