// Tests of the master seeding of the kit test worlds (./masters.ts; TRDD-RD1ISPMN, final D1b proposal, section I). A
// test's $ has no store of its own, so the seed's answers are taken from a recording on and called directly: a master a
// world neither owns nor stores answers a signed off (on for the integration tests), a stored value and a refusal come
// from the world's own answer, and the owned master gets no seed. That the seed wins over the world's plain answer is
// the kit's rule (the first registered answer wins; measured in a scratch plugin); the Deck tests show it on a real read.
// The shared world's store refusal (M4c item 2) is shown reaching the catch of the switches start's settings read.
//
// Two integrated mods have a master since Tokensaver joined (TRDD-71KVH9PA, T2), so a seed registers two answers unless
// the test file owns one of them.
import { describe, expect, test } from 'claude-code/testing'

import { envelopeOf, isSigned, parseStored } from '../switches/logic'
import { DECK_MASTER_KEY, MASTERS, TOKENSAVER_MASTER_KEY, seedMasters, type Seed } from './masters'
import { start, world } from './switch-world'

const KEY = DECK_MASTER_KEY
const OTHER = TOKENSAVER_MASTER_KEY

type Seeded = { event: string; matcher: unknown; answer: () => Promise<unknown> }

/** The answers seedMasters registers, in order, with the matcher each was registered under. */
function seeded(seed: Seed): Seeded[] {
  const hooks: Seeded[] = []
  seedMasters((event: string, matcher: unknown, answer: () => Promise<unknown>) => void hooks.push({ event, matcher, answer }), seed)
  return hooks
}

/** The answers registered: one per integrated mod the seed does not own, which is every key of MASTERS. */
function registered(hooks: Seeded[], seed: Seed): Seeded[] {
  const expected = Object.keys(MASTERS).filter((mod) => mod !== seed.own).length
  if (hooks.length !== expected) throw new Error(`expected ${String(expected)} seeded answers, got ${String(hooks.length)}`)
  return hooks
}

/** The answer matched on one master's key. */
function forKey(hooks: Seeded[], key: string): Seeded {
  const hook = hooks.find((each) => (each.matcher as { key?: string }).key === key)
  if (hook === undefined) throw new Error(`no seeded answer for ${key}`)
  return hook
}

describe('master seeding', () => {
  test('a master the world neither owns nor stores answers a signed off, matched on its key alone', async () => {
    const seed: Seed = { read: () => undefined }
    const hooks = registered(seeded(seed), seed)
    expect(hooks.map(({ event, matcher }) => ({ event, matcher }))).toEqual([
      { event: 'store.get', matcher: { key: KEY } },
      { event: 'store.get', matcher: { key: OTHER } },
    ])
    const answer = (await forKey(hooks, KEY).answer()) as { value: unknown }
    expect(answer).toEqual({ value: await envelopeOf(KEY, false, 1) })
    expect(await isSigned(KEY, parseStored(answer.value))).toBe(true)
  })

  test('with every master on, a master the world does not store answers a signed on', async () => {
    const seed: Seed = { allOn: true, read: () => undefined }
    const hook = forKey(registered(seeded(seed), seed), KEY)
    expect(await hook.answer()).toEqual({ value: await envelopeOf(KEY, true, 1) })
  })

  test("a stored master and a refusal come from the world's own answer, asked for the master's key", async () => {
    const stored = await envelopeOf(KEY, true, 7)
    const asked: string[] = []
    let answer: { value: unknown } | { deny: string } = { value: stored }
    const seed: Seed = {
      read: (key) => {
        asked.push(key)
        return answer
      },
    }
    const hook = forKey(registered(seeded(seed), seed), KEY)
    expect(await hook.answer()).toEqual({ value: stored })
    answer = { deny: 'the store could not be read' }
    expect(await hook.answer()).toEqual({ deny: 'the store could not be read' })
    expect(asked).toEqual([KEY, KEY])
  })

  test('the master of the mod a test file owns gets no seed, and every other mod still does', () => {
    const deckOwned = registered(seeded({ own: 'deck', read: () => undefined }), { own: 'deck', read: () => undefined })
    expect(deckOwned.map(({ matcher }) => (matcher as { key: string }).key)).toEqual([OTHER])
    const tokensaverOwned = registered(seeded({ own: 'tokensaver', read: () => undefined }), { own: 'tokensaver', read: () => undefined })
    expect(tokensaverOwned.map(({ matcher }) => (matcher as { key: string }).key)).toEqual([KEY])
  })

  test("a store refusal in the shared world reaches the catch of the switches start's settings read", async ($, on) => {
    const w = world(on)
    w.storeRefused = 'the store is locked'
    await start($)
    const failed = w.logs.filter((line) => line.startsWith('mods-switches: the older settings could not be moved, or the settings read: '))
    expect(failed).toHaveLength(1)
    expect(failed[0]).toContain('the store is locked')
  })
})
