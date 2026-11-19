// Behaviour of the classic-handler-inventory reference module: the sources below are text samples, never loaded.
import { describe, expect, test } from 'claude-code/testing'

import { classicHandlersIn } from '../classic-handler-inventory'

const MIXED = [
  "on('classic.Stop', stop)",
  'on("classic.SessionStart", { source: [\'clear\'] }, reload)',
  'on(`classic.PostToolUse`, note)',
  "on('classic.SessionStart', { source: ['resume'] }, restore)",
  "on('session.start', start)",
].join('\n')

describe('classicHandlersIn', () => {
  test('each classic event is listed once, sorted, whatever its quote mark', () => {
    expect(classicHandlersIn(MIXED)).toEqual(['classic.PostToolUse', 'classic.SessionStart', 'classic.Stop'])
  })
  test('events that are not settings-hook events are left out', () => {
    expect(classicHandlersIn("on('session.start', a)\non('tool.call', { tool: 'Bash' }, b)")).toEqual([])
  })
  test('the wildcard is listed as itself', () => {
    expect(classicHandlersIn("on('classic.*', everything)")).toEqual(['classic.*'])
  })
  test('spaces and a line break after the call are allowed', () => {
    expect(classicHandlersIn("on (\n  'classic.Notification',\n  note,\n)")).toEqual(['classic.Notification'])
  })
  test('a call inside a comment counts, and a name held in a variable is not seen', () => {
    expect(classicHandlersIn("// on('classic.Stop', old)\nconst name = 'classic.Setup'\non(name, h)")).toEqual(['classic.Stop'])
  })
  test('a method that only ends in "on" is not a registration', () => {
    expect(classicHandlersIn("addon('classic.Stop', h)\nicon('classic.Stop')")).toEqual([])
  })
  test('a loop over names and an alias of on are not seen: only literal registrations are', () => {
    expect(classicHandlersIn("for (const n of ['classic.Stop', 'classic.Setup']) on(n, h)")).toEqual([])
    expect(classicHandlersIn("const hook = on\nhook('classic.Stop', h)")).toEqual([])
    expect(classicHandlersIn("on('classic.Stop', h)\nconst hook = on\nhook('classic.Setup', h)")).toEqual(['classic.Stop'])
  })
  test('a pin catches a handler added later', () => {
    const before = "on('classic.SessionStart', reload)"
    const after = `${before}\non('classic.UserPromptSubmit', extra)`
    expect(classicHandlersIn(before)).toEqual(['classic.SessionStart'])
    expect(classicHandlersIn(after)).not.toEqual(['classic.SessionStart'])
  })
})
