import { expect, test } from 'claude-code/testing'

import { MIN_GAP_MS, POLL_INTERVAL_MS, USAGE, gitArgv, isDue, parseStatus, parseSwitch } from '../hooks/logic.js'

// Pure functions: tests per mods-doc-mods-testing chapter.md:23 (a test file can import the mod's own files).

test('parseStatus reads branch, changed and untracked counts', () => {
  const out = '## main...origin/main [ahead 1]\n M a.ts\nA  b.ts\n?? c.ts\n?? d.ts\n'
  expect(parseStatus(out)).toEqual({ branch: 'main', changed: 2, untracked: 2 })
})

test('parseStatus reads a branch with no upstream and a clean tree', () => {
  expect(parseStatus('## feature/x\n')).toEqual({ branch: 'feature/x', changed: 0, untracked: 0 })
})

test('parseStatus names a detached head and a repo with no commits', () => {
  expect(parseStatus('## HEAD (no branch)\n')?.branch).toBe('(detached)')
  expect(parseStatus('## No commits yet on main\n?? a\n')).toEqual({ branch: 'main', changed: 0, untracked: 1 })
  // Older git spells it "Initial commit on"
  expect(parseStatus('## Initial commit on master\n?? a\n')).toEqual({ branch: 'master', changed: 0, untracked: 1 })
})

test('parseStatus returns null when the output has no branch header', () => {
  expect(parseStatus('')).toBe(null)
  expect(parseStatus('fatal: not a git repository\n')).toBe(null)
})

test('parseSwitch toggles on empty, sets on and off, and answers usage otherwise', () => {
  expect(parseSwitch('', true)).toEqual({ kind: 'set', enabled: false })
  expect(parseSwitch('  ', false)).toEqual({ kind: 'set', enabled: true })
  expect(parseSwitch('on', false)).toEqual({ kind: 'set', enabled: true })
  expect(parseSwitch('off', true)).toEqual({ kind: 'set', enabled: false })
  expect(parseSwitch(' OFF ', true)).toEqual({ kind: 'set', enabled: false })
  expect(parseSwitch('On', false)).toEqual({ kind: 'set', enabled: true })
  expect(parseSwitch('maybe', true)).toEqual({ kind: 'usage' })
  expect(USAGE).toBe('usage: /git-poller [on|off]')
})

test('isDue is true before the first refresh and only after the gap', () => {
  expect(isDue(0, null, MIN_GAP_MS)).toBe(true)
  expect(isDue(MIN_GAP_MS - 1, 0, MIN_GAP_MS)).toBe(false)
  expect(isDue(MIN_GAP_MS, 0, MIN_GAP_MS)).toBe(true)
})

test('the exported constants have the values the README lists', () => {
  expect(POLL_INTERVAL_MS).toBe(15000)
  expect(MIN_GAP_MS).toBe(5000)
})

test('gitArgv runs git in the given directory with the status arguments', () => {
  expect(gitArgv('/w')).toEqual(['git', '-C', '/w', 'status', '--porcelain=v1', '--branch'])
})
