// The master switch of each integrated mod, seeded in the kit test worlds (TRDD-RD1ISPMN, ruling 9 as amended; final
// D1b proposal, section I). Every test file loads the whole hooks module (hooks/index.ts), so a mod whose master is on by
// default (correction 2) starts in every other mod's tests too, where its clock and hooks change what those tests
// measure (evidence F2 on the Deck card). A world answers each master it does not own through its own store answer, or
// with a signed off when it stores none. The seed is a matched store.get answer registered before the world's plain one:
// the first registered answer wins, and the plain one then does not run (measured in a scratch plugin), so a seeded read
// adds nothing to the world's calls or trace and leaves its store untouched. The other side of that: a seeded key also
// bypasses a world's own counters and failure injection (mod-manager's storeOps and failGet), so a test that needs a
// master read to fail or be counted owns that master (own) and answers it itself.
import { DECK_SWITCHES, MASTER as DECK_MASTER, MOD as DECK } from '../deck/switches'
import { MASTER as TOKENSAVER_MASTER, MOD as TOKENSAVER, TOKENSAVER_SWITCHES } from '../tokensaver/switches'
import { envelopeOf, keyOf, type SwitchDef } from '../switches/logic'

/** The store key of each integrated mod's master switch, by mod. */
export const DECK_MASTER_KEY = keyOf(masterOf(DECK_SWITCHES, DECK_MASTER))
export const TOKENSAVER_MASTER_KEY = keyOf(masterOf(TOKENSAVER_SWITCHES, TOKENSAVER_MASTER))
export const MASTERS: Readonly<Record<string, string>> = {
  [DECK]: DECK_MASTER_KEY,
  // Tokensaver joined the plugin at T2 (TRDD-71KVH9PA). Its master is off by default in 1.0.0, and a world that is not
  // about it still answers a signed off, so a later return to on by default cannot bring its start, its status line and
  // its clock into another mod's measurements.
  [TOKENSAVER]: TOKENSAVER_MASTER_KEY,
}

function masterOf(defs: readonly SwitchDef[], id: string): SwitchDef {
  const def = defs.find((each) => each.id === id)
  if (def === undefined) throw new Error(`masters: no switch ${id} is defined`)
  return def
}

/** A world's own answer for a key: what its store.get answers, or undefined when it stores nothing there. */
export type StoreRead = (key: string) => { value: unknown } | { deny: string } | undefined

export type Seed = {
  /** The mod this test file tests: the world answers its master itself. */
  own?: string
  /** A master the world stores nothing for answers on, not off (the integration tests, where every mod runs). */
  allOn?: boolean
  read: StoreRead
}

/** Registers the seeded answers; call it before the world's plain store.get answer, or that answer wins. */
export function seedMasters(on: any, seed: Seed): void {
  for (const [mod, key] of Object.entries(MASTERS)) {
    if (mod === seed.own) continue
    on('store.get', { key }, async () => seed.read(key) ?? { value: await envelopeOf(key, seed.allOn === true, 1) })
  }
}
