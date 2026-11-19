// The three wiring guarantees of the Tokensaver integration (TRDD-71KVH9PA, T2), each one a defect the wiring review found:
// its status-line segment clears when the switch goes off, a switch write redraws the screen, and an off switch gives the
// person's level back when it goes on again. Every test is mutation-checkable: undo the guard and it goes red.
//
// The switches are written through the switches tool, so the registry calls followSwitch inside the engine, on a provisioned
// $, exactly as the pane and the agent do; a direct call would run outside it.
import { describe, expect, test } from 'claude-code/testing'

import { MASTER, STATUS_LINE, TOKENSAVER_SWITCHES, TRIM, VOICE } from '../../tokensaver/switches'
import { agentSets, keyFor, signed, signedOn, start, typed, world } from '../switch-world'

/**
 * Lets a fire-and-forget chain run until the condition holds: the switch writer follows up through calls a test cannot
 * await, on microtasks the reads of the world raise. It stops when what the test asserts is true, or after 2000 moves of
 * the clock. The fixed eight settles it replaces saw 1 redraw where 2 were due in the publish run of 2026-11-12, at a
 * host load of 188; whether the follow-up was late or had failed was not read from that run. Bounded, so a chain that
 * never runs leaves the condition false for the assertion after it, instead of hanging the test.
 */
async function until(w: { clock: { advance: (ms: number) => Promise<unknown> } }, holds: () => boolean): Promise<void> {
  for (let look = 0; look < 2000 && !holds(); look += 1) await w.clock.advance(0)
}

/** The status line as the engine received it, one entry per $.ui.status call, and how many redraws were asked for. */
type Seen = { statuses: Array<string | undefined>; redraws: number }

/** Answers the two display calls Tokensaver makes, which the shared world leaves to the test: the line, and the redraw. */
function displaying(on: any): Seen {
  const seen: Seen = { statuses: [], redraws: 0 }

  on('ui.status', ($: any, e: any) => {
    seen.statuses.push(e.text)
    return { value: undefined }
  })
  on('ui.invalidate', () => {
    seen.redraws += 1
    return { value: undefined }
  })

  return seen
}

describe('the status-line segment', () => {
  test('a sync sends the line again even when the text it would write is the clearing value', async ($, on) => {
    const seen = displaying(on)

    // The status-line switch is stored off before the start, so the text Tokensaver would write is undefined: exactly the
    // value that takes its segment off a line another mod owns. The start's sync must still send it.
    world(on, { ...(await signedOn([MASTER])), [keyFor(STATUS_LINE)]: await signed(STATUS_LINE, false, 5_000) })

    await start($)

    // The switch value reaches the configs only after the start has read the store, so the line the start wrote still names
    // the voice. The next turn's sync is what sends the line again with the switch's value in force.
    const before = seen.statuses.length

    await typed($, 'a turn with the status line off')

    // With `shownStatus` merely reset to undefined, the compare (undefined !== undefined) reads as "already shown" and no
    // write happens: the registry keeps whatever segment was there. The explicit resend flag sends the clearing value.
    expect(seen.statuses.length).toBeGreaterThan(before)
    expect(seen.statuses.at(-1)).toBeUndefined()
  })
})

describe('a switch write', () => {
  test('redraws at once, so the change shows without waiting for the next attach, prompt or tick', async ($, on) => {
    const seen = displaying(on)
    const w = world(on, await signedOn([MASTER, TRIM]))

    await start($)
    // The registry invalidates once for the write itself (switches/register.ts setSwitch). A second one is Tokensaver's own
    // redraw, which is what makes a display switch show at once instead of at the next attach, prompt or tick.
    seen.redraws = 0

    await agentSets($, TRIM, false)
    await until(w, () => seen.redraws > 1)

    expect(seen.redraws).toBeGreaterThan(1)
  })
})

describe('an off switch turned back on', () => {
  test('gives back the level the store holds, not the neutral value the off wrote into the live config', async ($, on) => {
    const seen = displaying(on)
    // The person's own voice level, in the store the start reads.
    world(on, { ...(await signedOn([MASTER, VOICE])), 'tokensaver.assistant': { voice: 'ultra' } })

    await start($)
    expect(seen.statuses.at(-1)).toContain('caveman ultra')

    await agentSets($, VOICE, false)
    await typed($, 'a turn while the voice is off')
    expect(seen.statuses.at(-1)).not.toContain('caveman')

    await agentSets($, VOICE, true)
    await typed($, 'a turn once the voice is on again')
    // The live config held 'off' after the switch went off, so only a record of the stored level can give 'ultra' back.
    expect(seen.statuses.at(-1)).toContain('caveman ultra')
  })
})

describe('the master switch default', () => {
  // The registry answers a switch nobody stored with its defaultOn, so this is what a fresh install reads. It must stay
  // off until the double-running guard is ported: flip it back to true and this goes red (TRDD-71KVH9PA).
  test('the definition defaults to off, which is what a fresh install reads, so it does not run beside the standalone Tokensaver', () => {
    expect(TOKENSAVER_SWITCHES.find(({ id }) => id === MASTER)?.defaultOn).toBe(false)
  })
})
