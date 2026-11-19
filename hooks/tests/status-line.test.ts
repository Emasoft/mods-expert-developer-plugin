// Tests of the status-line registry (../status-line.ts, TRDD-71KVH9PA, T2): `$.ui.status` is ONE line per plugin (types,
// $.ui.status: "One per plugin"), so more than one mod reporting on it must compose instead of overwriting. The registry
// keeps one Map for the module's lifetime, while every test here builds its own `$`, so `fresh` clears every owner this
// file writes before handing back a recorder: otherwise a segment an earlier test left standing would lead the next
// test's line. Nothing here goes through the plugin's hooks: the registry is a plain module over `$`.
import { describe, expect, test } from 'claude-code/testing'

import type { EngineInterface } from 'claude-code'

import { setStatusLine } from '../status-line'

/** The $ the registry needs: $.ui.status, recording every line it is handed, undefined included. */
function engine(): { $: EngineInterface; lines: Array<string | undefined> } {
  const lines: Array<string | undefined> = []
  const $ = { ui: { status: (text: string | undefined) => void lines.push(text) } } as unknown as EngineInterface
  return { $, lines }
}

/** Every owner name this file writes, so one test can start where the registry holds no segment at all. */
const OWNERS = ['owner-a', 'owner-b', 'owner-c', 'owner-d', 'owner-e', 'owner-f']

/** A recorder on a cleared registry: the clears go to a throwaway engine, whose lines are dropped. */
function fresh(): { $: EngineInterface; lines: Array<string | undefined> } {
  const throwaway = engine()
  for (const owner of OWNERS) setStatusLine(throwaway.$, owner, undefined)
  return engine()
}

describe('the status line has one writer, which joins the mods', () => {
  test('one segment is the whole line, with no separator of its own', () => {
    const { $, lines } = fresh()

    setStatusLine($, 'owner-a', '12 tokens saved')

    expect(lines).toEqual(['12 tokens saved'])
  })

  test('two mods compose in the order they first appeared, and a replaced segment keeps its place', () => {
    const { $, lines } = fresh()

    setStatusLine($, 'owner-b', '2 plugin updates · /mods-manager')
    setStatusLine($, 'owner-c', 'tokensaver ate 4.2k')
    setStatusLine($, 'owner-b', '3 plugin updates · /mods-manager')

    expect(lines).toEqual([
      '2 plugin updates · /mods-manager',
      '2 plugin updates · /mods-manager · tokensaver ate 4.2k',
      '3 plugin updates · /mods-manager · tokensaver ate 4.2k',
    ])
  })

  test('a mod that clears its segment leaves the other mods standing, and never writes an empty string', () => {
    const { $, lines } = fresh()

    setStatusLine($, 'owner-d', 'tokensaver ate 4.2k')
    setStatusLine($, 'owner-e', '1 plugin update · /mods-manager')
    setStatusLine($, 'owner-d', undefined)

    expect(lines).toEqual([
      'tokensaver ate 4.2k',
      'tokensaver ate 4.2k · 1 plugin update · /mods-manager',
      '1 plugin update · /mods-manager',
    ])
    expect(lines).not.toContain('')
  })

  test('the last segment cleared takes the line down with undefined, which is what removes it', () => {
    const { $, lines } = fresh()

    setStatusLine($, 'owner-f', 'tokensaver ate 4.2k')
    setStatusLine($, 'owner-f', undefined)

    // `undefined` removes the line (types, $.ui.status): an empty string would pin an empty line in its place.
    expect(lines).toEqual(['tokensaver ate 4.2k', undefined])
  })
})
