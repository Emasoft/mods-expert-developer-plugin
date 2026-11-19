// The gate runs inside the staged plugin beside sessionTaint (tests/reference-modules/host-register.ts), so these
// tests mark the session the way a session gets marked: a fetched page, then a secret file read.
import { describe, expect, test } from 'claude-code/testing'

import { MAX_COMMAND_CHARS } from '../shell-command-splitter'

const answerTools = (on: any) => on('tool.call', () => ({ result: 'text' }))
const fetchPage = ($: any) => $.tool.call({ tool: 'WebFetch', url: 'https://example.test/page', prompt: 'Summarize it.' })
const check = ($: any, tool: string, input: unknown) => $.tool.check({ tool, input })
/** A shell query with someone to answer its asks, as a hook-made ask needs. */
const checkWithApprover = ($: any, command: string) => $.tool.check({ tool: 'Bash', input: { command }, approver: 'person' })

describe('egressVerdictGate', () => {
  test('a clean session leaves every verdict as it came from beneath', async ($, on) => {
    on('tool.check', () => ({ decision: 'allow' }))
    expect(await check($, 'Bash', { command: 'git push' })).toEqual({ decision: 'allow' })
  })
  test('after a fetched page a push is refused, and a web request is asked where someone can answer', async ($, on) => {
    answerTools(on)
    on('tool.check', () => ({ decision: 'allow' }))
    await fetchPage($)
    expect(await check($, 'Bash', { command: 'ls && git push' })).toMatchObject({ decision: 'deny' })
    const fetch = { tool: 'WebFetch', input: { url: 'https://x.test', prompt: 'p' } }
    expect(await $.tool.check({ ...fetch, approver: 'person' })).toMatchObject({ decision: 'ask' })
    // Nobody to ask (no approver): the ask class is refused instead.
    expect(await $.tool.check(fetch)).toMatchObject({ decision: 'deny' })
    expect(await check($, 'Bash', { command: 'ls -la' })).toEqual({ decision: 'allow' })
  })
  test('after a fetched page and a secret read even a web request is refused', async ($, on) => {
    answerTools(on)
    on('tool.check', () => ({ decision: 'allow' }))
    await fetchPage($)
    await $.tool.call({ tool: 'Read', file_path: '/w/.env' })
    const verdict = await check($, 'WebFetch', { url: 'https://x.test', prompt: 'p' })
    expect(verdict).toMatchObject({ decision: 'deny' })
    expect(verdict.reason).toContain('read /w/.env')
  })
  test('a deny from beneath is handed up unchanged, even where the gate would only ask', async ($, on) => {
    answerTools(on)
    on('tool.check', ($: any, e: any) =>
      e.tool === 'Grep'
        ? { decision: 'ask', reason: 'the mode asks' }
        : e.tool === 'Bash' || e.input?.url === 'https://x.test'
          ? { decision: 'deny', reason: 'a settings rule' }
          : { decision: 'allow' },
    )
    expect(await check($, 'Bash', { command: 'ls' })).toEqual({ decision: 'deny', reason: 'a settings rule' })
    expect(await check($, 'Grep', { pattern: 'x' })).toEqual({ decision: 'ask', reason: 'the mode asks' })
    // Marked, a web request is an ask class; a deny beneath it stands and is never turned into an ask.
    await fetchPage($)
    const fetch = { tool: 'WebFetch', input: { url: 'https://x.test', prompt: 'p' }, approver: 'person' }
    expect(await $.tool.check(fetch)).toEqual({ decision: 'deny', reason: 'a settings rule' })
  })
  test('a shell command that brought text from another machine marks the session; a local one, a push and a refused one do not', async ($, on) => {
    on('tool.call', ($: any, e: any) => (e.command?.includes('blocked') ? { deny: 'a settings rule' } : { result: 'text' }))
    on('tool.check', () => ({ decision: 'allow' }))
    await $.tool.call({ tool: 'Bash', command: 'ls -la && cat notes.txt' })
    await $.tool.call({ tool: 'Bash', command: 'git push' })
    await $.tool.call({ tool: 'Bash', command: 'curl http://x.test/blocked' })
    expect(await check($, 'Bash', { command: 'git push' })).toEqual({ decision: 'allow' })
    await $.tool.call({ tool: 'Bash', command: 'nice -n 10 curl http://x.test/page' })
    expect(await check($, 'Bash', { command: 'git push' })).toMatchObject({ decision: 'deny' })
  })
  test('after a fetched page, the clients and wrappers the lists name are refused through the hook', async ($, on) => {
    answerTools(on)
    on('tool.check', () => ({ decision: 'allow' }))
    await fetchPage($)
    const lines = ['lynx https://x.test', 'w3m https://x.test', 'open https://x.test', 'dig x.test', 'ping x.test', 'npx some-tool', 'docker run --rm example/image x', 'ssh-agent curl x', 'unshare -n curl x', 'parallel curl ::: https://x.test', 'script -c "curl x" /dev/null']
    for (const command of lines) expect(await check($, 'Bash', { command }), command).toMatchObject({ decision: 'deny' })
    expect(await check($, 'Bash', { command: 'ls -la' })).toEqual({ decision: 'allow' })
  })
  test('a runner locks itself out: in a clean session the first one is allowed and its run marks the session, so the next is refused', async ($, on) => {
    answerTools(on)
    on('tool.check', () => ({ decision: 'allow' }))
    expect(await check($, 'Bash', { command: 'npx some-tool' })).toEqual({ decision: 'allow' })
    await $.tool.call({ tool: 'Bash', command: 'npx some-tool' })
    // A runner is a deny class, not an ask: an approver being present changes nothing, so only clearing the session unlocks it.
    expect(await checkWithApprover($, 'npx some-tool')).toMatchObject({ decision: 'deny' })
    expect(await check($, 'Bash', { command: 'git push' })).toMatchObject({ decision: 'deny' })
  })
  test('after a fetched page an opener handed a local file is asked, and one handed a remote address is refused', async ($, on) => {
    answerTools(on)
    on('tool.check', () => ({ decision: 'allow' }))
    await fetchPage($)
    expect(await checkWithApprover($, 'open README.md')).toMatchObject({ decision: 'ask' })
    expect(await checkWithApprover($, 'open https://x.test')).toMatchObject({ decision: 'deny' })
    // Nobody to ask (no approver): the opener is refused instead.
    expect(await check($, 'Bash', { command: 'open README.md' })).toMatchObject({ decision: 'deny' })
  })
  test('a command line the splitter refuses is refused, by the fail-closed catch', async ($, on) => {
    on('tool.check', () => ({ decision: 'allow' }))
    const verdict = await check($, 'Bash', { command: `echo ${'a'.repeat(MAX_COMMAND_CHARS)}` })
    expect(verdict).toEqual({ decision: 'deny', reason: 'The session guard failed while reading this call, so it was refused.' })
  })
})
