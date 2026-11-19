// Behaviour of the compact-with-command-fallback reference module on the host's test kit: $.session.compact and
// $.command.run are answered by stubs, so nothing is compacted.
// Seen only by running the kit, UNVERIFIED: a stub that throws is skipped, and with nothing beneath it the module's call
// rejects with the kit's own message (so a test checks that both causes are carried, not their words); a session.compact stub
// answers the compaction or { skip } as it is, and the command.run event carries `command` and `args`.
import { describe, expect, test } from 'claude-code/testing'

import { bridgeStubs, runThroughHost } from '../host-harness'

const INSTRUCTIONS = 'keep the open task and its plan'
// A compaction keeps at least one message: the kit refuses an answer with none.
const COMPACTED = { messages: [{ role: 'user', text: 'the summary', toolUses: [] }], tokensBefore: 900, tokensAfter: 300 }

type SessionAnswer = 'compacts' | 'skips' | 'refuses'
type CommandAnswer = 'runs' | 'refuses'

function world(on: any, session: SessionAnswer, command: CommandAnswer) {
  const asked: (string | undefined)[] = []
  const ran: { command: string; args: string }[] = []
  const bridge = bridgeStubs(on)
  on('session.compact', ($: any, e: any) => {
    asked.push(e.instructions)
    if (session === 'refuses') throw new Error('a turn is running')
    if (session === 'skips') return { skip: 'a hook vetoed it' }
    return COMPACTED
  })
  on('command.run', ($: any, e: any) => {
    ran.push({ command: e.command, args: e.args })
    if (command === 'refuses') throw new Error('the host refused the command')
    return { text: 'Compacted.' }
  })
  const run = ($: any, instructions?: string, fallbackToCommand = false) =>
    runThroughHost($, bridge, { module: 'compact', fallbackToCommand, ...(instructions === undefined ? {} : { instructions }) })
  return { asked, ran, run }
}

async function failure(call: Promise<unknown>): Promise<unknown> {
  try {
    await call
  } catch (error) {
    return error
  }
  throw new Error('the call was expected to fail')
}

describe('compactWithCommandFallback, the session method', () => {
  test('a compaction the host accepts is returned and no command runs', async ($, on) => {
    const w = world(on, 'compacts', 'runs')
    expect(await w.run($, INSTRUCTIONS)).toEqual({ way: 'session', deferred: false, result: COMPACTED })
    expect(w.asked).toEqual([INSTRUCTIONS])
    expect(w.ran).toEqual([])
  })
  test('a veto stands: the skip is returned and /compact is not run', async ($, on) => {
    const w = world(on, 'skips', 'runs')
    expect(await w.run($, INSTRUCTIONS, true)).toEqual({ way: 'session', deferred: false, result: { skip: 'a hook vetoed it' } })
    expect(w.ran).toEqual([])
  })
})

describe('compactWithCommandFallback, a refusal by default', () => {
  test('a rejected session method is thrown as it is and /compact is not run', async ($, on) => {
    const w = world(on, 'refuses', 'runs')
    const error = await failure(w.run($, INSTRUCTIONS))
    expect(error).toBeDefined()
    expect(w.ran).toEqual([])
  })
})

describe('compactWithCommandFallback, the command fallback (fallbackToCommand: true)', () => {
  test('a refused compaction runs /compact with the same instructions and says it is deferred', async ($, on) => {
    const w = world(on, 'refuses', 'runs')
    expect(await w.run($, INSTRUCTIONS, true)).toEqual({ way: 'command', deferred: true, text: 'Compacted.' })
    expect(w.ran).toEqual([{ command: 'compact', args: INSTRUCTIONS }])
  })
  test('without instructions the command runs with nothing after its name', async ($, on) => {
    const w = world(on, 'refuses', 'runs')
    expect(await w.run($, undefined, true)).toEqual({ way: 'command', deferred: true, text: 'Compacted.' })
    expect(w.asked).toEqual([undefined])
    expect(w.ran).toEqual([{ command: 'compact', args: '' }])
  })
  test('when both are refused the error carries both causes', async ($, on) => {
    const w = world(on, 'refuses', 'refuses')
    const { messages } = (await failure(w.run($, INSTRUCTIONS, true))) as { messages: string[] }
    expect(messages.length).toBe(2)
    expect(w.ran.length).toBe(1)
  })
})
