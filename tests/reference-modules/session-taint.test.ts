// sessionTaint runs inside the staged plugin, wired with TAINT_DEFAULTS by tests/reference-modules/host-register.ts.
// A test reads what it holds through its status command, as a person would.
import { describe, expect, test } from 'claude-code/testing'

import { isPersonOrigin, promptClears, TAINT_DEFAULTS } from '../session-taint'

const { status, clear } = TAINT_DEFAULTS.commands
const shown = async ($: any) => (await $.command.run({ command: status, args: '' })).text as string
const CLEAN = 'untrusted text: none\nsecret read: none'
const answerTools = (on: any) => on('tool.call', ($: any, e: any) => (e.tool === 'Bash' ? { deny: 'refused below' } : { result: 'text' }))
const fetchPage = ($: any) => $.tool.call({ tool: 'WebFetch', url: 'https://example.test/page', prompt: 'Summarize it.' })
const readFile = ($: any, file_path: string) => $.tool.call({ tool: 'Read', file_path })
const submit = ($: any, origin: unknown) => $.prompt.submit({ text: 'go on', origin })

describe('sessionTaint, marking', () => {
  test('a clean session shows nothing held', async ($) => {
    expect(await shown($)).toBe(CLEAN)
  })
  test('a fetched page marks untrusted text and its result still reaches the model', async ($, on) => {
    answerTools(on)
    expect(await fetchPage($)).toMatchObject({ result: 'text' })
    expect(await shown($)).toBe('untrusted text: WebFetch returned text from outside\nsecret read: none')
  })
  test('an MCP result marks it too; a local tool does not', async ($, on) => {
    answerTools(on)
    await $.tool.call({ tool: 'Grep', pattern: 'x' })
    expect(await shown($)).toBe(CLEAN)
    await $.tool.call({ tool: 'mcp__tickets__get', id: '7' })
    expect(await shown($)).toBe('untrusted text: mcp__tickets__get returned text from outside\nsecret read: none')
  })
  test('the first source is the one kept', async ($, on) => {
    answerTools(on)
    await fetchPage($)
    await $.tool.call({ tool: 'mcp__tickets__get', id: '7' })
    expect(await shown($)).toContain('WebFetch returned text from outside')
  })
  test('a call refused beneath marks nothing', async ($, on) => {
    on('tool.call', () => ({ deny: 'refused below' }))
    await fetchPage($)
    expect(await shown($)).toBe(CLEAN)
  })
  test('reading a secret file marks the secret fact; an ordinary file does not', async ($, on) => {
    answerTools(on)
    await readFile($, '/w/README.md')
    expect(await shown($)).toBe(CLEAN)
    await readFile($, '/w/.env.local')
    expect(await shown($)).toBe('untrusted text: none\nsecret read: read /w/.env.local')
  })
})

describe('sessionTaint, clearing', () => {
  const taintBoth = async ($: any) => {
    await fetchPage($)
    await readFile($, '/w/.ssh/id_ed25519')
  }
  test('a prompt the person typed clears both facts', async ($, on) => {
    answerTools(on)
    on('prompt.submit', ($: any, e: any) => ({ text: e.text }))
    await taintBoth($)
    await submit($, { kind: 'composer' })
    expect(await shown($)).toBe(CLEAN)
  })
  test('a prompt from a peer, an SDK host, a task or a plugin clears nothing', async ($, on) => {
    answerTools(on)
    on('prompt.submit', ($: any, e: any) => ({ text: e.text }))
    await taintBoth($)
    for (const origin of [{ kind: 'peer' }, { kind: 'sdk' }, { kind: 'task-notification' }, { kind: 'plugin', name: 'other' }]) {
      await submit($, origin)
      expect(await shown($), origin.kind).not.toBe(CLEAN)
    }
  })
  test('a prompt another hook dropped clears nothing', async ($, on) => {
    answerTools(on)
    on('prompt.submit', () => ({ drop: 'held' }))
    await taintBoth($)
    await submit($, { kind: 'composer' })
    expect(await shown($)).not.toBe(CLEAN)
  })
  test('a /clear clears, any other session end does not', async ($, on) => {
    answerTools(on)
    on('session.end', ($: any, e: any) => ({ sessionId: e.sessionId }))
    await taintBoth($)
    await $.session.end({ reason: 'resume', sessionId: 'taint-test', resume: { id: 'taint-test' } })
    expect(await shown($)).not.toBe(CLEAN)
    await $.session.end({ reason: 'clear', sessionId: 'taint-test', resume: { id: 'taint-test' } })
    expect(await shown($)).toBe(CLEAN)
  })
  test('the clear command works for the person and reports what it held', async ($, on) => {
    answerTools(on)
    await taintBoth($)
    const answer = await $.command.run({ command: clear, args: '', origin: { kind: 'composer' } } as any)
    expect(answer.text).toBe('Cleared.\nuntrusted text: WebFetch returned text from outside\nsecret read: read /w/.ssh/id_ed25519')
    expect(await shown($)).toBe(CLEAN)
  })
  test('the clear command refuses a plugin or an SDK host', async ($, on) => {
    answerTools(on)
    await taintBoth($)
    for (const origin of [{ kind: 'plugin', name: 'other' }, { kind: 'sdk' }]) {
      const answer = await $.command.run({ command: clear, args: '', origin } as any)
      expect(answer.text).toBe(`Nothing cleared: /${clear} must come from the person.`)
    }
    expect(await shown($)).not.toBe(CLEAN)
  })
})

describe('sessionTaint, the clearing rules as plain functions', () => {
  test('only composer and bridge are the person', () => {
    expect(isPersonOrigin({ kind: 'composer' })).toBe(true)
    expect(isPersonOrigin({ kind: 'bridge' })).toBe(true)
    expect(isPersonOrigin({ kind: 'sdk' })).toBe(false)
    expect(isPersonOrigin(undefined)).toBe(false)
  })
  test('under context-reset no prompt clears, not even the person\'s', () => {
    expect(promptClears('context-reset', { kind: 'composer' })).toBe(false)
    expect(promptClears('person-prompt', { kind: 'composer' })).toBe(true)
  })
})
