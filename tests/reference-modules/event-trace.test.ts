// The trace runs inside the staged plugin (tests/reference-modules/host-register.ts wires it with TRACE_DEFAULTS),
// so a test reads it the way a person does, through its command. Every stub answers in Claude Code's place.
import { describe, expect, test } from 'claude-code/testing'

import { TRACE_DEFAULTS } from '../event-trace'

const printed = async ($: any) => (await $.command.run({ command: TRACE_DEFAULTS.command, args: '' })).text

describe('eventTrace, each event is recorded and handed on unchanged', () => {
  test('tool.describe keeps the description and placement the chain gave', async ($, on) => {
    on('tool.describe', () => ({ description: 'Reads one note.', isDeferred: true }))
    const answer = await $.tool.describe({ tool: 'mcp__notes__read', description: 'Reads a note.', provider: { plugin: 'mcp:notes', tier: 'user' }, isDeferred: true })
    expect(answer).toMatchObject({ isDeferred: true })
    expect(await printed($)).toContain('tool.describe  mcp__notes__read from mcp:notes, deferred')
  })
  test('tool.check keeps the verdict and tells a query from a call', async ($, on) => {
    on('tool.check', () => ({ decision: 'ask', reason: 'the mode asks' }))
    expect(await $.tool.check({ tool: 'Grep', input: { pattern: 'x' } })).toEqual({ decision: 'ask', reason: 'the mode asks' })
    expect(await printed($)).toBe('tool.check  Grep query: ask')
  })
  test('skill.prompt names the source and a left-out frontmatter', async ($, on) => {
    on('skill.prompt', ($, e) => ({ text: e.text }))
    await $.skill.prompt({ skill: 'commit', text: 'Write a commit.', source: 'plugin', frontmatterProblem: 'not YAML' })
    expect(await printed($)).toContain('skill.prompt  commit from plugin, frontmatter left out')
  })
  test('prompt.attachment keeps the text and names the type and the author', async ($, on) => {
    on('prompt.attachment', ($, e) => ({ text: e.text }))
    const answer = await $.prompt.attachment({ type: 'todo_reminder', text: 'Two todos open.', origin: { kind: 'engine' } })
    expect(answer).toEqual({ text: 'Two todos open.' })
    expect(await printed($)).toBe('prompt.attachment  todo_reminder written by engine')
  })
  test('session.receive keeps the delivery and names its origin', async ($, on) => {
    on('session.receive', ($, e) => ({ text: e.text }))
    expect(await $.session.receive({ origin: { kind: 'bridge' }, text: 'build is green' })).toEqual({ text: 'build is green' })
    expect(await printed($)).toBe('session.receive  from bridge, 14 characters')
  })
  test('session.send keeps the delivery answer and names the recipient', async ($, on) => {
    on('session.send', () => ({ isDelivered: true }))
    expect(await $.session.send({ to: 'worker', text: 'hello' })).toEqual({ isDelivered: true })
    expect(await printed($)).toBe('session.send  to worker, 5 characters')
  })
  test('agent.spawn keeps the model answer and names the agent type', async ($, on) => {
    on('agent.spawn', () => ({ model: 'claude-test' }))
    expect(await $.agent.spawn({ prompt: 'Find the tests.', description: 'look around', subagentType: 'Explore' })).toEqual({ model: 'claude-test' })
    expect(await printed($)).toBe('agent.spawn  Explore: look around')
  })
})

describe('eventTrace, the kept lines and the command', () => {
  test('before any event the command says so', async ($) => {
    expect(await printed($)).toBe('No event seen yet.')
  })
  test('only the newest lines are kept, oldest first', async ($, on) => {
    on('session.receive', ($, e) => ({ text: e.text }))
    for (let n = 0; n <= TRACE_DEFAULTS.keep; n += 1) await $.session.receive({ origin: { kind: 'bridge' }, text: 'x'.repeat(n + 1) })
    const lines = (await printed($)).split('\n')
    expect(lines.length).toBe(TRACE_DEFAULTS.keep)
    expect(lines[0]).toBe('session.receive  from bridge, 2 characters')
    expect(lines[lines.length - 1]).toBe(`session.receive  from bridge, ${TRACE_DEFAULTS.keep + 1} characters`)
  })
})
