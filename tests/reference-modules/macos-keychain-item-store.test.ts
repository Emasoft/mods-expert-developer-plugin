// Behaviour of the macos-keychain-item-store reference module on the host's test kit: $.process.run is stubbed, so no keychain is touched.
// UNVERIFIED, seen only by running the kit: the process.run event carries `argv` and `init`, and a stub answers { value }.
import { describe, expect, test } from 'claude-code/testing'

import { bridgeStubs, runThroughHost, type Action } from '../host-harness'

const TOOL = { security: '/sec/bin/security', cwd: '/sec/cwd', platform: 'darwin' }
const SERVICE = 'svc-one'
const ACCOUNT = 'acct-one'
const SECRET = '{"token":"secret-VALUE"}'
const SECRET_HEX = Array.from(new TextEncoder().encode(SECRET), byte => byte.toString(16).padStart(2, '0')).join('')

type Answer = { exitCode: number; stdout?: string; stderr?: string; isStdoutTruncated?: boolean }
type Call = { argv: string[]; init: { cwd?: string; stdin?: string; timeoutMs?: number } }

/** Stubs process.run with one answer (or a rejection) and records every call. */
function world(on: any, answer: Answer | Error) {
  const calls: Call[] = []
  const bridge = bridgeStubs(on)
  on('process.run', ($: any, e: any) => {
    calls.push({ argv: [...e.argv], init: e.init ?? {} })
    if (answer instanceof Error) throw answer
    return { value: { stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false, ...answer } }
  })
  const run = ($: any, op: 'read' | 'write' | 'delete', names: Partial<Extract<Action, { module: 'keychain' }>> = {}) =>
    runThroughHost($, bridge, { module: 'keychain', op, tool: TOOL, service: SERVICE, account: ACCOUNT, secret: SECRET, ...names })
  return { calls, run }
}

/** Runs the call, which must fail, and returns the thrown error with its facts. */
async function failure(call: Promise<unknown>): Promise<{ messages: string[]; facts: Record<string, unknown> }> {
  try {
    await call
  } catch (error) {
    return error as { messages: string[]; facts: Record<string, unknown> }
  }
  throw new Error('the call was expected to fail')
}

describe('writeKeychainItem', () => {
  test('the secret and its hex go on stdin only, never in the arguments', async ($, on) => {
    const w = world(on, { exitCode: 0 })
    await w.run($, 'write')
    expect(w.calls).toHaveLength(1)
    const call = w.calls[0] as Call
    expect(call.argv).toEqual([TOOL.security, '-i'])
    expect(call.init.stdin).toBe(`add-generic-password -U -a "${ACCOUNT}" -s "${SERVICE}" -X "${SECRET_HEX}"\n`)
    expect(call.argv.join(' ')).not.toContain(SECRET)
    expect(call.argv.join(' ')).not.toContain(SECRET_HEX)
    expect(call.init.cwd).toBe(TOOL.cwd)
    expect(call.init.timeoutMs).toBe(15_000)
  })
  test('a non-zero exit is an error that carries the exit code and not the secret', async ($, on) => {
    const w = world(on, { exitCode: 36, stderr: `line ${SECRET_HEX}` })
    const failed = await failure(w.run($, 'write'))
    expect(failed.facts.exitCode).toBe(36)
    expect(failed.messages.join()).toContain('exit 36')
    expect(failed.messages.join()).not.toContain(SECRET_HEX)
  })
  test('error words on standard error fail a write that exited 0, without quoting them', async ($, on) => {
    const w = world(on, { exitCode: 0, stderr: `SecKeychainItemCreate: ${SECRET_HEX}` })
    const failed = await failure(w.run($, 'write'))
    expect(failed.messages).toEqual(['cannot write the keychain item: security reported an error'])
  })
  test('a rejected run is reported as an error that names the action', async ($, on) => {
    const w = world(on, new Error(`spawn failed with ${SECRET_HEX}`))
    const failed = await failure(w.run($, 'write'))
    expect(failed.messages).toEqual(['could not write the keychain item'])
    expect(failed.messages.join()).not.toContain(SECRET_HEX)
  })
  test('a name with a quote, a backslash or a line break, or an empty name, is refused before any program runs', async ($, on) => {
    const w = world(on, { exitCode: 0 })
    for (const bad of ['a"b', 'a\\b', 'a\nb', 'a\rb', '']) {
      await failure(w.run($, 'write', { service: bad }))
      await failure(w.run($, 'write', { account: bad }))
    }
    expect(w.calls).toEqual([])
  })
  test('an empty secret is refused', async ($, on) => {
    const w = world(on, { exitCode: 0 })
    const failed = await failure(w.run($, 'write', { secret: '' }))
    expect(failed.messages).toEqual(['refused an empty secret'])
    expect(w.calls).toEqual([])
  })
  test('a line over 4000 characters is refused and one of exactly 4000 is sent', async ($, on) => {
    const w = world(on, { exitCode: 0 })
    // An account of nine characters makes the fixed part of the line 58, so a secret of 1971 bytes gives exactly 4000.
    const account = 'acct-1234'
    const fixed = `add-generic-password -U -a "${account}" -s "${SERVICE}" -X ""\n`.length
    await w.run($, 'write', { account, secret: 'a'.repeat((4000 - fixed) / 2) })
    expect(w.calls).toHaveLength(1)
    expect(((w.calls[0] as Call).init.stdin ?? '').length).toBe(4000)
    const failed = await failure(w.run($, 'write', { account, secret: 'a'.repeat((4000 - fixed) / 2 + 1) }))
    expect(failed.messages[0]).toContain('refused a 4002-character write')
    expect(w.calls).toHaveLength(1)
  })
})

describe('readKeychainItem', () => {
  test('it asks for the secret with -w, by argument vector, and strips the final newline', async ($, on) => {
    const w = world(on, { exitCode: 0, stdout: `${SECRET}\n` })
    expect(await w.run($, 'read')).toBe(SECRET)
    const call = w.calls[0] as Call
    expect(call.argv).toEqual([TOOL.security, 'find-generic-password', '-s', SERVICE, '-a', ACCOUNT, '-w'])
    expect(call.init.stdin).toBeUndefined()
  })
  test('exit 44 means there is no such item', async ($, on) => {
    const w = world(on, { exitCode: 44 })
    expect(await w.run($, 'read')).toBeNull()
  })
  test('any other non-zero exit is an error that carries the exit code', async ($, on) => {
    const w = world(on, { exitCode: 51 })
    expect((await failure(w.run($, 'read'))).facts.exitCode).toBe(51)
  })
  test('a cut output is an error and not a short secret', async ($, on) => {
    const w = world(on, { exitCode: 0, stdout: 'abc', isStdoutTruncated: true })
    expect((await failure(w.run($, 'read'))).messages).toEqual(['cannot read the keychain item: the output was cut'])
  })
  test('a bad name is refused before any program runs', async ($, on) => {
    const w = world(on, { exitCode: 0 })
    await failure(w.run($, 'read', { account: 'a"b' }))
    expect(w.calls).toEqual([])
  })
})

describe('every operation, on another operating system', () => {
  test('read, write and delete are refused on any platform but darwin before a program is started', async ($, on) => {
    const w = world(on, { exitCode: 0 })
    for (const platform of ['linux', 'win32', '', 'Darwin']) {
      for (const op of ['read', 'write', 'delete'] as const) {
        const failed = await failure(w.run($, op, { tool: { ...TOOL, platform } }))
        expect(failed.messages).toEqual([`the macOS keychain store works on macOS only; this platform is ${platform}`])
      }
    }
    expect(w.calls).toEqual([])
  })
})

describe('deleteKeychainItem', () => {
  test('exit 0 means deleted and exit 44 means it was not there', async ($, on) => {
    const gone = world(on, { exitCode: 0 })
    expect(await gone.run($, 'delete')).toBe(true)
    expect((gone.calls[0] as Call).argv).toEqual([TOOL.security, 'delete-generic-password', '-s', SERVICE, '-a', ACCOUNT])
  })
  test('exit 44 returns false', async ($, on) => {
    const w = world(on, { exitCode: 44 })
    expect(await w.run($, 'delete')).toBe(false)
  })
  test('any other non-zero exit is an error that carries the exit code', async ($, on) => {
    const w = world(on, { exitCode: 1 })
    expect((await failure(w.run($, 'delete'))).facts.exitCode).toBe(1)
  })
  test('a bad name is refused before any program runs', async ($, on) => {
    const w = world(on, { exitCode: 0 })
    await failure(w.run($, 'delete', { service: 'a"b' }))
    await failure(w.run($, 'delete', { account: '' }))
    expect(w.calls).toEqual([])
  })
})
