// Behaviour of the oauth-token-refresh reference module on the host's test kit: $.http.fetch and $.clock.now are stubbed, so nothing is sent.
// UNVERIFIED, seen only by running the kit: the http.fetch event carries `url` and `init`, and a stub answers { value }.
import { describe, expect, test } from 'claude-code/testing'

import { bridgeStubs, runThroughHost } from '../host-harness'

const ENDPOINT = { url: 'https://auth.example.test/token', clientId: 'client-one' }
const OLD = 'old-refresh-token'
const NEW = 'new-refresh-token'
const NOW = 1_000_000
const MARKER = 'BODY-MARKER-grant-text'

type Reply = { status?: number; ok?: boolean; text?: string }
type Call = { url: string; init: { method?: string; headers?: Record<string, string>; body?: string } }

const answer = (fields: Record<string, unknown>): Reply => ({ text: JSON.stringify(fields) })

function world(on: any, first: Reply | Error) {
  const calls: Call[] = []
  let reply = first
  const bridge = bridgeStubs(on)
  // The clock moves while the request is out, so a reading taken after the answer would show.
  let clock = NOW
  on('clock.now', () => ({ value: clock }))
  on('http.fetch', ($: any, e: any) => {
    calls.push({ url: e.url, init: e.init ?? {} })
    clock += 5000
    if (reply instanceof Error) throw reply
    const status = reply.status ?? 200
    return { value: { status, ok: reply.ok ?? (status >= 200 && status < 300), headers: {}, text: reply.text ?? '' } }
  })
  const run = ($: any, endpoint = ENDPOINT, refreshToken = OLD) => runThroughHost($, bridge, { module: 'refresh', endpoint, refreshToken })
  // One stub set per test: a later call changes the reply instead of registering the stubs again.
  const answerWith = (next: Reply | Error) => {
    reply = next
  }
  return { calls, run, answerWith }
}

async function failure(call: Promise<unknown>): Promise<{ messages: string[]; facts: Record<string, unknown> }> {
  try {
    await call
  } catch (error) {
    return error as { messages: string[]; facts: Record<string, unknown> }
  }
  throw new Error('the call was expected to fail')
}

describe('refreshOAuthToken, the answer', () => {
  test('it posts the refresh grant to the endpoint it was given and returns the rotated tokens and the new expiry', async ($, on) => {
    const w = world(on, answer({ access_token: 'acc-1', refresh_token: NEW, expires_in: 3600 }))
    expect(await w.run($)).toEqual({ accessToken: 'acc-1', refreshToken: NEW, isRotated: true, expiresAt: NOW + 3_600_000 })
    const call = w.calls[0] as Call
    expect(call.url).toBe(ENDPOINT.url)
    expect(call.init.method).toBe('POST')
    expect(call.init.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(JSON.parse(call.init.body ?? '')).toEqual({ grant_type: 'refresh_token', refresh_token: OLD, client_id: ENDPOINT.clientId })
  })
  test('another endpoint and client id are used as given', async ($, on) => {
    const w = world(on, answer({ access_token: 'acc-2', expires_in: 60 }))
    await w.run($, { url: 'https://other.example.test/v2/token', clientId: 'client-two' })
    expect((w.calls[0] as Call).url).toBe('https://other.example.test/v2/token')
    expect(JSON.parse((w.calls[0] as Call).init.body ?? '').client_id).toBe('client-two')
  })
  test('an answer without refresh_token keeps the current one and is not rotated', async ($, on) => {
    const w = world(on, answer({ access_token: 'acc-3', expires_in: 10 }))
    expect(await w.run($)).toEqual({ accessToken: 'acc-3', refreshToken: OLD, isRotated: false, expiresAt: NOW + 10_000 })
  })
  test('the same refresh_token back is not a rotation', async ($, on) => {
    const w = world(on, answer({ access_token: 'acc-4', refresh_token: OLD, expires_in: 10 }))
    expect(((await w.run($)) as { isRotated: boolean }).isRotated).toBe(false)
  })
})

describe('refreshOAuthToken, the refusals', () => {
  test('a status outside 2xx is refused with the status and without the body', async ($, on) => {
    const w = world(on, { status: 400, text: MARKER })
    const failed = await failure(w.run($))
    expect(failed.facts.status).toBe(400)
    expect(failed.messages).toEqual(['the token endpoint answered 400'])
  })
  test('text that is not JSON is refused without quoting it', async ($, on) => {
    const w = world(on, { text: `<html>${MARKER}` })
    const failed = await failure(w.run($))
    expect(failed.messages).toEqual(['the token endpoint answered with text that is not JSON'])
  })
  test('JSON that is not an object is refused', async ($, on) => {
    const w = world(on, { text: '' })
    for (const text of ['null', '[1]', '"x"', '7']) {
      w.answerWith({ text })
      expect((await failure(w.run($))).messages).toEqual(['the token endpoint answered with JSON that is not an object'])
    }
  })
  test('a body over 64 KiB is refused unread', async ($, on) => {
    const w = world(on, { text: ' '.repeat(64 * 1024 + 1) })
    expect((await failure(w.run($))).messages).toEqual(['the token endpoint answered with an oversized body'])
  })
  test('an answer without a plain access_token is refused, and a rotated refresh token is handed back on the error', async ($, on) => {
    const w = world(on, { text: '' })
    for (const access of [undefined, '', 'has space', 5, null]) {
      w.answerWith(answer({ access_token: access, refresh_token: NEW, expires_in: 60 }))
      const failed = await failure(w.run($))
      expect(failed.messages).toEqual(['the answer holds no plain access_token'])
      expect(failed.facts.rotatedRefreshToken).toBe(NEW)
    }
    w.answerWith(answer({ refresh_token: OLD, expires_in: 60 }))
    expect((await failure(w.run($))).facts.rotatedRefreshToken).toBeUndefined()
  })
  test('an answer without a positive number in expires_in is refused', async ($, on) => {
    const w = world(on, { text: '' })
    for (const seconds of [undefined, 0, -5, '3600', null]) {
      w.answerWith(answer({ access_token: 'acc', refresh_token: NEW, expires_in: seconds }))
      const failed = await failure(w.run($))
      expect(failed.messages).toEqual(['the answer holds no positive expires_in'])
      expect(failed.facts.rotatedRefreshToken).toBe(NEW)
    }
  })
  test('an expires_in that parses to Infinity is refused', async ($, on) => {
    // Raw text: JSON.stringify would turn 1e999 into null and never reach the finite check.
    const w = world(on, { text: `{"access_token":"acc","refresh_token":"${NEW}","expires_in":1e999}` })
    const failed = await failure(w.run($))
    expect(failed.messages).toEqual(['the answer holds no positive expires_in'])
    expect(failed.facts.rotatedRefreshToken).toBe(NEW)
  })
  test('the expiry counts from the clock reading taken before the request', async ($, on) => {
    const w = world(on, answer({ access_token: 'acc', expires_in: 60 }))
    expect(((await w.run($)) as { expiresAt: number }).expiresAt).toBe(NOW + 60_000)
  })
  test('a refresh_token that is not a plain token is refused', async ($, on) => {
    const w = world(on, { text: '' })
    for (const bad of ['', 'has space', 5, null]) {
      w.answerWith(answer({ access_token: 'acc', refresh_token: bad, expires_in: 60 }))
      expect((await failure(w.run($))).messages).toEqual(['the refresh_token of the answer is not a plain token'])
    }
  })
  test('a request that fails is reported without the host error text', async ($, on) => {
    const w = world(on, new Error(`connect failed for ${MARKER}`))
    const failed = await failure(w.run($))
    expect(failed.messages).toEqual(['the token request could not be sent or was not answered'])
  })
})

describe('refreshOAuthToken, the arguments', () => {
  test('an endpoint that is not an https URL is refused before anything is sent', async ($, on) => {
    const w = world(on, answer({ access_token: 'acc', expires_in: 60 }))
    for (const url of ['http://auth.example.test/token', 'ftp://x.test/t', '', 'https://', 'https:// spaced.test/t', 'https://user:pw@auth.example.test/token', 'https://auth.example.test/ x', 'https://auth.example.test/t\tx']) {
      expect((await failure(w.run($, { ...ENDPOINT, url }))).messages).toEqual(['the token endpoint must be an https URL'])
    }
    expect(w.calls).toEqual([])
  })
  test('an empty or spaced client id or refresh token is refused before anything is sent', async ($, on) => {
    const w = world(on, answer({ access_token: 'acc', expires_in: 60 }))
    for (const clientId of ['', 'two words']) {
      expect((await failure(w.run($, { ...ENDPOINT, clientId }))).messages).toEqual(['the client id must be a non-empty token without spaces'])
    }
    for (const token of ['', 'two words', 'line\nbreak']) {
      expect((await failure(w.run($, ENDPOINT, token))).messages).toEqual(['the refresh token must be a non-empty token without spaces'])
    }
    expect(w.calls).toEqual([])
  })
})
