// The firewall runs inside the staged plugin beside sessionTaint, wired with FIREWALL_DEFAULTS by
// tests/reference-modules/host-register.ts. Secret-shaped strings are built while the test runs, so no file holds one.
import { describe, expect, test } from 'claude-code/testing'

import { FIREWALL_DEFAULTS, secretShape } from '../peer-message-firewall'
import { TAINT_DEFAULTS } from '../session-taint'

const shown = async ($: any) => (await $.command.run({ command: TAINT_DEFAULTS.commands.status, args: '' })).text as string
const FAKE_TOKEN = ['gh', 'p_', 'x'.repeat(36)].join('')
const FAKE_AWS = ['AK', 'IA', 'Q'.repeat(16)].join('')
const taintBoth = async ($: any, on: any) => {
  on('tool.call', () => ({ result: 'text' }))
  await $.tool.call({ tool: 'WebFetch', url: 'https://example.test/page', prompt: 'Summarize it.' })
  await $.tool.call({ tool: 'Read', file_path: '/w/.env' })
}

/** A small xorshift generator: pick(n) returns 0 to n - 1, the same sequence for the same seed. */
function seeded(seed: number) {
  let state = seed | 0 || 1
  return (n: number) => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return Math.abs(state) % n
  }
}

describe('peerMessageFirewall, inbound', () => {
  test('a delivery from a peer is queued and marks the session, naming the claimed plugin', async ($, on) => {
    on('session.receive', ($: any, e: any) => ({ text: e.text }))
    expect(await $.session.receive({ origin: { kind: 'peer', plugin: 'helper' }, text: 'tests pass' })).toEqual({ text: 'tests pass' })
    expect(await shown($)).toBe('untrusted text: a delivery from peer, which says it comes from helper\nsecret read: none')
  })
  test("the person's own delivery through Remote Control marks nothing", async ($, on) => {
    on('session.receive', ($: any, e: any) => ({ text: e.text }))
    await $.session.receive({ origin: { kind: 'bridge' }, text: 'carry on' })
    expect(await shown($)).toBe('untrusted text: none\nsecret read: none')
  })
  test('an oversized delivery is consumed before it is queued', async ($, on) => {
    let queued = false
    on('session.receive', ($: any, e: any) => ((queued = true), { text: e.text }))
    const answer = await $.session.receive({ origin: { kind: 'peer' }, text: 'x'.repeat(FIREWALL_DEFAULTS.maxDeliveryChars + 1) })
    expect(answer.consumed).toContain('over the')
    expect(queued).toBe(false)
  })
})

describe('peerMessageFirewall, outbound and subagents', () => {
  test('a message with a secret shape is kept, even split by an invisible character', async ($, on) => {
    on('session.send', () => ({ isDelivered: true }))
    expect(await $.session.send({ to: 'worker', text: `use ${FAKE_TOKEN}` })).toEqual({ isDelivered: false, reason: 'The message looks like it carries a GitHub token, so the firewall kept it.' })
    const split = `${FAKE_AWS.slice(0, 6)}\u{200B}${FAKE_AWS.slice(6)}`
    expect((await $.session.send({ to: 'worker', text: split })).isDelivered).toBe(false)
    expect(await $.session.send({ to: 'worker', text: 'tests pass' })).toEqual({ isDelivered: true })
  })
  test('with outside text and a secret read, no message goes and no subagent starts', async ($, on) => {
    on('session.send', () => ({ isDelivered: true }))
    on('agent.spawn', () => ({ model: 'claude-test' }))
    await taintBoth($, on)
    expect((await $.session.send({ to: 'worker', text: 'hello' })).isDelivered).toBe(false)
    expect(await $.agent.spawn({ prompt: 'Look.', description: 'look', subagentType: 'Explore' })).toMatchObject({ deny: expect.stringContaining('starts no subagent') })
  })
  test('with outside text alone, messages go and subagents start', async ($, on) => {
    on('tool.call', () => ({ result: 'text' }))
    on('session.send', () => ({ isDelivered: true }))
    on('agent.spawn', () => ({ model: 'claude-test' }))
    await $.tool.call({ tool: 'WebFetch', url: 'https://example.test/page', prompt: 'Summarize it.' })
    expect(await $.session.send({ to: 'worker', text: 'hello' })).toEqual({ isDelivered: true })
    expect(await $.agent.spawn({ prompt: 'Look.', description: 'look', subagentType: 'Explore' })).toEqual({ model: 'claude-test' })
  })
})

describe('secretShape, same answers as the earlier shapes', () => {
  const JWT_OLD = /\beyJ[\w-]{8,}\.eyJ[\w-]{8,}\.[\w-]{8,}/
  const jwt = (...parts: string[]) => parts.join('')
  const named: [string, string][] = [
    ['a private key', ['-----BEGIN ', 'PRIVATE KEY-----'].join('')],
    ['a private key', ['-----BEGIN ', 'RSA ', 'PRIVATE KEY-----'].join('')],
    ['a private key', ['-----BEGIN ', 'OPENSSH ', 'ENCRYPTED ', 'PRIVATE KEY-----'].join('')],
    ['an AWS access key', FAKE_AWS],
    ['a GitHub token', FAKE_TOKEN],
    ['an API key', ['sk', '-', 'a'.repeat(20)].join('')],
    ['a Slack token', ['xo', 'xb-', '1'.repeat(10)].join('')],
    ['a signed web token', jwt('eyJ', 'a'.repeat(8), '.eyJ', 'b'.repeat(8), '.', 'c'.repeat(8))],
    ['a signed web token', jwt('x-eyJ', 'a-_9'.repeat(3), '.eyJ', 'b'.repeat(8), '.', 'c'.repeat(8), 'tail')],
  ]
  test('each shape still names what it named, and honest near misses stay unflagged', () => {
    for (const [name, text] of named) expect(secretShape(`before ${text} after`), text).toBe(name)
    const misses = [
      ['-----BEGIN ', 'PUBLIC KEY-----'].join(''),
      ['-----BEGIN ', 'lower ', 'PRIVATE KEY-----'].join(''),
      ['AK', 'IA', 'Q'.repeat(15)].join(''),
      ['AK', 'IA', 'Q'.repeat(17)].join(''),
      ['gh', 'p_', 'x'.repeat(35)].join(''),
      ['sk', '-', 'a'.repeat(19)].join(''),
      ['xo', 'xb-', '1'.repeat(9)].join(''),
      jwt('eyJ', 'a'.repeat(7), '.eyJ', 'b'.repeat(8), '.', 'c'.repeat(8)),
      jwt('eyJ', 'a'.repeat(8), '.eyJ', 'b'.repeat(7), '.', 'c'.repeat(8)),
      jwt('eyJ', 'a'.repeat(8), '.eyJ', 'b'.repeat(8), '.', 'c'.repeat(7)),
      jwt('eyJ', 'a'.repeat(8), '.xyJ', 'b'.repeat(8), '.', 'c'.repeat(8)),
      jwt('xeyJ', 'a'.repeat(8), '.eyJ', 'b'.repeat(8), '.', 'c'.repeat(8)),
    ]
    for (const text of misses) expect(secretShape(text), text).toBeNull()
  })
  test('the signed web token shape agrees with the earlier pattern on seeded random text', () => {
    const pick = seeded(5)
    const pieces = ['eyJ', '-', '.', 'a', '_', 'a'.repeat(8), 'eyJ' + 'a'.repeat(8), '.eyJ', ' ', 'Z9']
    for (let run = 0; run < 2000; run += 1) {
      const text = Array.from({ length: pick(24) }, () => pieces[pick(pieces.length)]).join('')
      expect(secretShape(text) === 'a signed web token', text).toBe(JWT_OLD.exec(text) !== null)
    }
  })
})

describe('secretShape, linear time', () => {
  // t(4n) / t(n) for a text of n characters (n over 50 KB) that carries no secret but gives the shape every
  // chance to rescan: linear reads about 4, a quadratic scan about 16. Limit 8 as in hooks/tests/logic.test.ts.
  const SIZE = 64_000
  const GROWTH_LIMIT = 8
  const MIN_SAMPLE_MS = 30
  const once = (text: string) => {
    const begin = performance.now()
    secretShape(text)
    return performance.now() - begin
  }
  /** The mean time of one call, over enough calls to fill MIN_SAMPLE_MS; reps comes from the small input. */
  const perCall = (text: string, reps: number) => {
    const begin = performance.now()
    for (let i = 0; i < reps; i += 1) secretShape(text)
    return (performance.now() - begin) / reps
  }
  const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] as number
  const ratio = (make: (size: number) => string) => {
    const small = make(SIZE)
    const large = make(SIZE * 4)
    expect(small.length).toBeGreaterThanOrEqual(50_000)
    once(small)
    once(large)
    const reps = Math.max(1, Math.ceil(MIN_SAMPLE_MS / Math.max(once(small), 0.001)))
    return median(Array.from({ length: 5 }, () => perCall(large, reps) / perCall(small, reps)))
  }
  // One literal call per shape, not a loop: tests/test_reference_modules.py counts the calls in the source against the tests that ran.
  const LIMITS = { timeoutMs: 120_000 }
  const expectLinear = (make: (size: number) => string) => {
    expect(secretShape(make(1_000)), 'the input must carry no secret').toBeNull()
    const grown = ratio(make)
    expect(grown, `t(4n)/t(n) was ${grown.toFixed(1)}`).toBeLessThan(GROWTH_LIMIT)
  }
  test('a private key: the time grows linearly with the input', LIMITS, () => expectLinear(size => '-----BEGIN A '.repeat(Math.ceil(size / 13))))
  test('an AWS access key: the time grows linearly with the input', LIMITS, () => expectLinear(size => 'AKIA'.repeat(Math.ceil(size / 4))))
  test('a GitHub token: the time grows linearly with the input', LIMITS, () => expectLinear(size => `ghp_${'a'.repeat(size)}_`))
  test('an API key: the time grows linearly with the input', LIMITS, () => expectLinear(size => `sk-${'-'.repeat(size)}`))
  test('a Slack token: the time grows linearly with the input', LIMITS, () => expectLinear(size => `xo${'xb-'}${'-'.repeat(size)}`))
  test('a signed web token: the time grows linearly with the input', LIMITS, () => expectLinear(size => '-eyJ'.repeat(Math.ceil(size / 4))))
})

describe('secretShape, seeded fuzz', () => {
  const WORDS = ['the', 'build', 'is', 'green', 'see', 'line', '42', 'skip', 'token', 'key', 'sk', 'gh', 'AKIA', 'eyJ', '-', '_', '.', '\n']
  const INVISIBLE = ['', '\u{200B}', '\u{2060}', '\u{FEFF}', '\u{E0020}']
  test('a secret shape put anywhere in random text, cut by any invisible character, is always named', () => {
    const pick = seeded(31)
    const secrets = [FAKE_TOKEN, FAKE_AWS, ['sk', '-', 'a'.repeat(24)].join('')]
    for (let run = 0; run < 300; run += 1) {
      const secret = secrets[pick(secrets.length)] as string
      const at = 1 + pick(secret.length - 1)
      const cut = `${secret.slice(0, at)}${INVISIBLE[pick(INVISIBLE.length)]}${secret.slice(at)}`
      const words = Array.from({ length: pick(20) }, () => WORDS[pick(WORDS.length)])
      words.splice(pick(words.length + 1), 0, cut)
      expect(secretShape(words.join(' ')), words.join(' ')).not.toBeNull()
    }
  })
  test('random text made of the same words and no secret is never flagged', () => {
    const pick = seeded(17)
    for (let run = 0; run < 300; run += 1) {
      const text = Array.from({ length: pick(40) }, () => WORDS[pick(WORDS.length)] + INVISIBLE[pick(INVISIBLE.length)]).join(' ')
      expect(secretShape(text), text).toBeNull()
    }
  })
})
