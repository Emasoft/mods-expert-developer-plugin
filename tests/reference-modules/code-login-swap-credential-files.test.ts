// Behaviour of the code-login-swap-credential-files reference module on the host's test kit: an in-memory file system behind $.fs.
// UNVERIFIED, seen only by running the kit: the fs.write event carries the text in `text`, and a stub answers { value }.
import { describe, expect, test } from 'claude-code/testing'

import type { SavedAccount } from '../account-registry-file'
import { bridgeStubs, swapThroughHost, type Inputs } from '../host-harness'

const CRED = '/w/credentials.json'
const CONF = '/w/config.json'
const SUFFIX = '.bak'
const CRED_BAK = `${CRED}${SUFFIX}`
const CONF_BAK = `${CONF}${SUFFIX}`
const TARGET: SavedAccount = { alias: 'home', email: 'Home@x.test', name: 'home', accountUuid: 'u2', orgUuid: null, installs: [], savedAt: null }
const account = (more: Record<string, unknown> = {}) => JSON.stringify({ emailAddress: 'home@x.test', accountUuid: 'u2', ...more })
const SAVED = { credentials: JSON.stringify({ login: 'home-token' }), account: account() }
const savedWith = (text: string) => ({ ...SAVED, credentials: text })
const ONE_BACKUP = '/w/one.bak'
const LIVE_CRED = JSON.stringify({ login: 'work-token', connectors: { a: 1 } })
const LIVE_CONF = JSON.stringify({ oauthAccount: { emailAddress: 'work@x.test' }, theme: 'dark' })
const live = { [CRED]: LIVE_CRED, [CONF]: LIVE_CONF }

/** An in-memory file system. `failOn` lists "<path>#<n>" for the n-th write to that path (1-based) that must reject. */
function world(on: any, initial: Record<string, string>, failOn: string[] = []) {
  const files = new Map(Object.entries(initial))
  const writes: string[] = []
  const counts = new Map<string, number>()
  const bridge = bridgeStubs(on)
  on('fs.exists', ($: any, e: any) => ({ value: files.has(e.path) }))
  on('fs.read', ($: any, e: any) => ({ value: files.get(e.path) }))
  on('fs.write', ($: any, e: any) => {
    const n = (counts.get(e.path) ?? 0) + 1
    counts.set(e.path, n)
    if (failOn.includes(`${e.path}#${n}`)) throw new Error(`write refused: ${e.path}`)
    writes.push(e.path)
    files.set(e.path, e.text)
    return { value: undefined }
  })
  const swap = (
    $: any,
    saved = SAVED,
    carryOver: string[] = ['connectors'],
    target = TARGET,
    extra: Partial<Inputs['files']> = {},
  ) => swapThroughHost($, bridge, { files: { credentials: CRED, config: CONF, suffix: SUFFIX, ...extra }, target, saved, carryOver })
  return { files, writes, counts, swap }
}

/** Runs the swap, which must fail, and returns the messages of its causes. */
async function swapMessages($: any, w: { swap: (engine: any) => Promise<string[]> }): Promise<string[]> {
  try {
    await w.swap($)
  } catch (error) {
    return (error as { messages: string[] }).messages
  }
  throw new Error('the swap was expected to fail')
}
describe('swapLogin, the swap', () => {
  test('it backs up both files, writes the config first and the credentials last, and returns the backups', async ($, on) => {
    const w = world(on, live)
    const backups = await w.swap($)
    expect(w.writes).toEqual([CRED_BAK, CONF_BAK, CONF, CRED])
    expect(backups).toEqual([CRED_BAK, CONF_BAK])
    expect(w.files.get(CRED_BAK)).toBe(LIVE_CRED)
    expect(w.files.get(CONF_BAK)).toBe(LIVE_CONF)
  })
  test('the config keeps its other keys and takes the saved account entry; the credentials carry over the named key', async ($, on) => {
    const w = world(on, live)
    await w.swap($)
    expect(w.files.get(CONF)).toBe(JSON.stringify({ oauthAccount: { emailAddress: 'home@x.test', accountUuid: 'u2' }, theme: 'dark' }, null, 2))
    expect(w.files.get(CRED)).toBe(JSON.stringify({ login: 'home-token', connectors: { a: 1 } }, null, 2))
  })
})

describe('swapLogin, refusals before any write', () => {
  test('a live credentials key that the saved copy lacks and carryOver does not name stops the swap', async ($, on) => {
    const w = world(on, live)
    await expect(w.swap($, SAVED, [])).rejects.toThrow(/would drop connectors/)
    expect(w.writes).toEqual([])
  })
  test('a key that only an inherited property of a plain object would have is still seen as lost', async ($, on) => {
    const w = world(on, { [CRED]: JSON.stringify({ login: 'x', toString: 1 }), [CONF]: LIVE_CONF })
    await expect(w.swap($, SAVED, [])).rejects.toThrow(/would drop toString/)
    expect(w.writes).toEqual([])
  })
  test('a live credentials key named __proto__ is refused', async ($, on) => {
    const w = world(on, { [CRED]: '{"login":"x","__proto__":{"a":1}}', [CONF]: LIVE_CONF })
    await expect(w.swap($, SAVED, ['login'])).rejects.toThrow(/the key __proto__ is refused/)
    expect(w.writes).toEqual([])
  })
  test('the keys constructor and prototype are refused in the saved copy and in carryOver', async ($, on) => {
    const w = world(on, live)
    await expect(w.swap($, savedWith('{"constructor":1}'))).rejects.toThrow(/the key constructor is refused/)
    await expect(w.swap($, SAVED, ['connectors', 'prototype'])).rejects.toThrow(/the key prototype is refused/)
    expect(w.writes).toEqual([])
  })
  test('a saved account block for another email is refused', async ($, on) => {
    const w = world(on, live)
    await expect(w.swap($, { ...SAVED, account: JSON.stringify({ emailAddress: 'other@x.test', accountUuid: 'u2' }) })).rejects.toThrow(/not for Home@x.test/)
    expect(w.writes).toEqual([])
  })
  test('a saved account block with another account id, or another organisation id, is refused', async ($, on) => {
    const w = world(on, live)
    await expect(w.swap($, { ...SAVED, account: account({ accountUuid: 'u9' }) })).rejects.toThrow(/another account id/)
    await expect(w.swap($, { ...SAVED, account: account({ organizationUuid: 'o9' }) })).rejects.toThrow(/another organisation id/)
    await expect(w.swap($, SAVED, ['connectors'], { ...TARGET, orgUuid: 'o1' })).rejects.toThrow(/another organisation id/)
    expect(w.writes).toEqual([])
  })
  test('a saved account block that is not a JSON object, and a saved credentials text that is not, are refused', async ($, on) => {
    const w = world(on, live)
    await expect(w.swap($, { ...SAVED, account: '[1]' })).rejects.toThrow(/saved account block is not a JSON object/)
    await expect(w.swap($, { ...SAVED, account: 'nope' })).rejects.toThrow(/saved account block is not valid JSON/)
    await expect(w.swap($, { ...SAVED, credentials: '[1]' })).rejects.toThrow(/saved credentials is not a JSON object/)
    expect(w.writes).toEqual([])
  })
  test('a missing credentials file is refused', async ($, on) => {
    const w = world(on, { [CONF]: LIVE_CONF })
    await expect(w.swap($)).rejects.toThrow(/both live login files must exist/)
    expect(w.writes).toEqual([])
  })
  test('a missing config file is refused', async ($, on) => {
    const w = world(on, { [CRED]: LIVE_CRED })
    await expect(w.swap($)).rejects.toThrow(/both live login files must exist/)
    expect(w.writes).toEqual([])
  })
  test('a live config that is not JSON is refused', async ($, on) => {
    const w = world(on, { [CRED]: LIVE_CRED, [CONF]: 'not json' })
    await expect(w.swap($)).rejects.toThrow(/config\.json is not valid JSON/)
    expect(w.writes).toEqual([])
  })
  test('live credentials that are not a JSON object are refused', async ($, on) => {
    const w = world(on, { [CRED]: '[1]', [CONF]: LIVE_CONF })
    await expect(w.swap($)).rejects.toThrow(/credentials\.json is not a JSON object/)
    expect(w.writes).toEqual([])
  })
  test('a backup path equal to a live file, or to the other backup, is refused', async ($, on) => {
    const w = world(on, live)
    await expect(w.swap($, SAVED, ['connectors'], TARGET, { credentialsBackup: CONF })).rejects.toThrow(/backup paths must differ/)
    await expect(w.swap($, SAVED, ['connectors'], TARGET, { credentialsBackup: ONE_BACKUP })).rejects.toThrow(/backup paths must differ/)
    expect(w.writes).toEqual([])
  })
  test('a config backup that already exists is never overwritten', async ($, on) => {
    const w = world(on, { ...live, [CONF_BAK]: 'older good copy' })
    await expect(w.swap($)).rejects.toThrow(/already exists/)
    expect(w.files.get(CONF_BAK)).toBe('older good copy')
    expect(w.writes).toEqual([])
  })
  test('a credentials backup that already exists is never overwritten', async ($, on) => {
    const w = world(on, { ...live, [CRED_BAK]: 'older good copy' })
    await expect(w.swap($)).rejects.toThrow(/already exists/)
    expect(w.files.get(CRED_BAK)).toBe('older good copy')
    expect(w.writes).toEqual([])
  })
})

describe('swapLogin, rollback', () => {
  test('when the credentials write fails both files are put back and the original error is thrown', async ($, on) => {
    const w = world(on, live, [`${CRED}#1`])
    await expect(w.swap($)).rejects.toThrow(/fs\.write/)
    // The config was written for the swap, then written back: two writes. The credentials were attempted, then written back.
    expect(w.counts.get(CONF)).toBe(2)
    expect(w.counts.get(CRED)).toBe(2)
    expect(w.files.get(CONF)).toBe(LIVE_CONF)
    expect(w.files.get(CRED)).toBe(LIVE_CRED)
  })
  test('when the config write fails both files still hold their original text', async ($, on) => {
    const w = world(on, live, [`${CONF}#1`])
    await expect(w.swap($)).rejects.toThrow(/fs\.write/)
    // The credentials were never attempted for the swap: their one write is the restore.
    expect(w.counts.get(CRED)).toBe(1)
    expect(w.counts.get(CONF)).toBe(2)
    expect(w.files.get(CONF)).toBe(LIVE_CONF)
    expect(w.files.get(CRED)).toBe(LIVE_CRED)
  })
  test('when the config rollback fails too, the error carries the credentials failure first and the config restore failure second', async ($, on) => {
    const w = world(on, live, [`${CRED}#1`, `${CONF}#2`])
    const messages = await swapMessages($, w)
    expect(messages).toHaveLength(2)
    expect(messages[0]).toMatch(/^writing \/w\/credentials\.json failed/)
    expect(messages[1]).toMatch(/^restoring \/w\/config\.json failed/)
    expect(w.counts.get(CRED)).toBe(2)
    expect(w.counts.get(CONF)).toBe(2)
    // The credentials were restored; the config was not, because its rollback write was the one refused.
    expect(w.files.get(CRED)).toBe(LIVE_CRED)
    expect(w.files.get(CONF)).not.toBe(LIVE_CONF)
  })
  test('when both restore writes fail the error carries all three causes, in order', async ($, on) => {
    const w = world(on, live, [`${CRED}#1`, `${CRED}#2`, `${CONF}#2`])
    const messages = await swapMessages($, w)
    expect(messages).toHaveLength(3)
    expect(messages[0]).toMatch(/^writing \/w\/credentials\.json failed/)
    expect(messages[1]).toMatch(/^restoring \/w\/credentials\.json failed/)
    expect(messages[2]).toMatch(/^restoring \/w\/config\.json failed/)
  })
})
