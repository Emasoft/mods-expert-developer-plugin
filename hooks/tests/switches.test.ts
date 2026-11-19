// Tests of the switch registry (TRDD-5IK59SQ2, PRRD G13.1): the pure rules, the switches tool, the /mods-switches pane,
// and that a function switched off runs nothing, shown by the calls it makes, with the same act switched on as the
// control. The fixtures are the functions the mods-manager and the dev tools (self-command, probe-runner) define when the plugin loads.
import { describe, expect, test } from 'claude-code/testing'

import {
  NEXT_SESSION_NOTE,
  NOTICE_MAX,
  REVIEW_TOAST,
  type Listed,
  type NoticeGetter,
  type SectionItem,
  type Stored,
  type SwitchDef,
  addSwitchDefs,
  decideSet,
  envelopeOf,
  isSigned,
  modSection,
  noticeErrorLine,
  startFailedLine,
  noticeOf,
  parseStored,
  signatureOf,
  stableJson,
  stateOf,
  statusText,
  toolRequestOf,
  byOf,
} from '../switches/logic'
import { defineNotice, defineSwitches } from '../switches/register'
import { LIST_COMMANDS, PANE, PROBE, RUN } from '../dev-tools'
import { AUTO_UPDATE, FN } from '../mod-manager/switches'
import { HOME, PLUGIN, TOOL, type World, agentSets, keyFor, run, signed, signedOn, start, world } from './switch-world'

const SURFACES = ['terminal', 'desktop'] as const
const WIDTHS = [40, 160] as const
// The mods-manager pane's own switch, on by default: the /mods-manager command and every press of the pane read it.
const MM_PANE = FN.pane
// Reload's switch, on by default: here only a row of the registry and of the /mods-switches pane. Nothing reads it yet
// (TRDD-5KGJO1H2: Reload runs while it is off), so no test here takes it as a switch that stops Reload.
const MM_RELOAD = FN.reload
const MM_OFF = '/mods-manager pane and command is off in mods-manager. Turn it on in /mods-switches.'
const LIST_TOOL = `mcp__${PLUGIN}__list_commands`

/**
 * What the mods-manager's read of the installed plugins asks that the shared world does not answer: the session's
 * surfaces, and a claude to list with, refused here. Neither is recorded in the world's calls.
 */
function quietManager(on: any): void {
  on('session.surfaces', () => ({ value: ['terminal'] }))
  on('process.run', () => ({ deny: 'no claude in this world' }))
}

/** Lets the work a press or a command left running go on, on the world's clock, until done() holds. */
async function settled(w: World, done: () => boolean): Promise<void> {
  for (let turn = 0; turn < 2_000 && !done(); turn++) await w.clock.settle()
}

/**
 * True once the read of the installed plugins that /mods-manager starts has ended. Here it always ends in its failure line,
 * by this test's own choice: quietManager denies process.run, so there is no claude to list with. The world answers
 * session.id (switch-world.ts), so the failure does not come from there. A world with a claude would need another end signal.
 */
const managerReadEnded = (w: World): boolean => w.logs.some((line) => line.startsWith('mods-manager: reading the installed plugins failed:'))

function pane(surface: string, columns: number, requestId = 'mods-switches') {
  return {
    plugin: PLUGIN,
    surface,
    component: 'Pane' as const,
    requestId,
    viewport: { columns, rows: 30 },
    props: { title: requestId, isFocused: true, bodyColumns: columns - 4, placement: 'inline', scroll: { offset: 0, bodyRows: 20 }, view: {} },
  } as any
}

const label = async (ui: any, key: string): Promise<string> => String((await ui.find({ key }))?.props.label)

// Pure rules, with definitions of their own: no registry, so a function off by default can be shown here.
const OFF_DEF: SwitchDef = { id: 'test-mod.off', mod: 'test-mod', label: 'off by default', defaultOn: false, legacyKey: 'old' }
const ON_DEF: SwitchDef = { id: 'test-mod.on', mod: 'test-mod', label: 'on by default', defaultOn: true, legacyKey: 'old' }

describe('switch rules', () => {
  test('a value signs the same whatever its key order, and a signature binds its key', async () => {
    expect(stableJson({ b: 1, a: [true, { d: null, c: 'x' }], u: undefined })).toBe('{"a":[true,{"c":"x","d":null}],"b":1}')
    expect(await signatureOf('k', { a: 1, b: 2 }, 5)).toBe(await signatureOf('k', { b: 2, a: 1 }, 5))
    expect(await signatureOf('k', true, 5)).not.toBe(await signatureOf('other', true, 5))
    expect(await signatureOf('k', true, 5)).not.toBe(await signatureOf('k', true, 6))
    const envelope = await envelopeOf('k', true, 5)
    expect(await isSigned('k', parseStored(envelope))).toBe(true)
    expect(await isSigned('k', parseStored({ ...envelope, v: false }))).toBe(false)
    expect(await isSigned('other', parseStored(envelope))).toBe(false)
    // A time this plugin could not have written is no envelope: past 2^53 later writes could not be ordered after it.
    for (const at of [1e300, -1, 1.5, Number.MAX_SAFE_INTEGER + 2]) expect(parseStored({ ...envelope, at })).toEqual({ kind: 'garbled' })
    expect(byOf('composer')).toBe('person')
    expect(byOf('bridge')).toBe('person')
    expect(byOf('sdk')).toBe('person')
    expect(byOf('plugin')).toBe('agent')
    expect(byOf('task-notification')).toBe('agent')
  })

  test('what a switch reads as, by the source of its value', async () => {
    const good = async (v: boolean): Promise<Stored> => parseStored(await envelopeOf('k', v, 7))
    const forged = (v: boolean): Stored => parseStored({ v, at: 7, sig: 'forged' })
    const table: Array<[string, SwitchDef, Stored, boolean, unknown, { on: boolean; from: string; review?: unknown }]> = [
      ['signed on of an off-by-default function', OFF_DEF, await good(true), true, undefined, { on: true, from: 'stored' }],
      ['signed off of an on-by-default function', ON_DEF, await good(false), true, undefined, { on: false, from: 'stored' }],
      ['unsigned on never turns on an off-by-default function', OFF_DEF, forged(true), false, undefined, { on: false, from: 'outside', review: { value: true, why: 'unsigned' } }],
      ['unsigned off holds, and waits for review', ON_DEF, forged(false), false, undefined, { on: false, from: 'outside', review: { value: false, why: 'unsigned' } }],
      ['unsigned on of an on-by-default function is the default, under review', ON_DEF, forged(true), false, undefined, { on: true, from: 'outside', review: { value: true, why: 'unsigned' } }],
      ['garbled is the default, under review', OFF_DEF, parseStored('yes'), false, undefined, { on: false, from: 'outside', review: { value: false, why: 'garbled' } }],
      ['an envelope without a boolean is garbled', ON_DEF, parseStored({ v: 'on', at: 7, sig: 'x' }), false, undefined, { on: true, from: 'outside', review: { value: true, why: 'garbled' } }],
      ['the old key false holds', ON_DEF, parseStored(undefined), false, false, { on: false, from: 'legacy' }],
      ['the old key true holds for an on-by-default function', ON_DEF, parseStored(undefined), false, true, { on: true, from: 'legacy' }],
      ['the old key true never turns on an off-by-default function', OFF_DEF, parseStored(undefined), false, true, { on: false, from: 'outside', review: { value: true, why: 'legacy' } }],
      ['any other old value is the default', OFF_DEF, parseStored(undefined), false, 'yes', { on: false, from: 'legacy' }],
      ['nothing stored is the default', OFF_DEF, parseStored(undefined), false, undefined, { on: false, from: 'default' }],
    ]
    for (const [name, def, stored, isGood, legacy, want] of table) {
      const state = stateOf(def, stored, isGood, legacy)
      expect({ name, on: state.on, from: state.from, review: state.review }).toEqual({ name, on: want.on, from: want.from, review: want.review })
    }
  })

  test('off always writes; on from a stale view loses to a later off; time never goes back', () => {
    const off = (at: number): Stored => ({ kind: 'envelope', v: false, at, sig: 's' })
    expect(decideSet(off(50), false, 10, 100, 'x')).toEqual({ at: 100 })
    expect(decideSet(off(50), true, 10, 100, 'x')).toEqual({ refuse: 'x was turned off after this pane was drawn, so it stays off. Press again to turn it on.' })
    expect(decideSet(off(50), true, 50, 100, 'x')).toEqual({ at: 100 })
    // A later on stored meanwhile is no reason to refuse an on.
    expect(decideSet({ kind: 'envelope', v: true, at: 50, sig: 's' }, true, 10, 100, 'x')).toEqual({ at: 100 })
    // The agent's tool reads and writes in one call: no view to be stale.
    expect(decideSet(off(50), true, undefined, 100, 'x')).toEqual({ at: 100 })
    expect(decideSet({ kind: 'missing' }, true, 0, 100, 'x')).toEqual({ at: 100 })
    expect(decideSet(off(500), false, undefined, 100, 'x')).toEqual({ at: 501 })
  })

  test('the tool input is checked, never trusted', () => {
    const ids = new Set([MM_PANE])
    expect(toolRequestOf({}, ids)).toEqual({ list: undefined })
    expect(toolRequestOf({ switch: MM_PANE }, ids)).toEqual({ list: MM_PANE })
    expect(toolRequestOf({ switch: MM_PANE, on: false }, ids)).toEqual({ set: MM_PANE, on: false })
    expect(toolRequestOf({ switch: 'nope', on: true }, ids)).toEqual({ deny: 'There is no function "nope". Call switches with no input to list them.' })
    expect(toolRequestOf({ on: true }, ids)).toEqual({ deny: 'on needs a switch: name the function id to turn on or off.' })
    expect(toolRequestOf({ switch: 3 }, ids)).toEqual({ deny: 'switch must be a function id (a string). Call switches with no input to list them.' })
    expect(toolRequestOf({ switch: MM_PANE, on: 'yes' }, ids)).toEqual({ deny: 'on must be true or false.' })
  })

  test('a mod cannot take another mod\'s id or store key', () => {
    const registry = new Map<string, SwitchDef>()
    addSwitchDefs(registry, [ON_DEF, OFF_DEF])
    // A reload defines the same functions again: no error.
    addSwitchDefs(registry, [ON_DEF])
    expect(() => addSwitchDefs(registry, [{ ...ON_DEF, mod: 'another-mod' }])).toThrow('the switch test-mod.on is already defined by test-mod')
    expect(() => addSwitchDefs(registry, [{ id: 'another-mod.x', mod: 'another-mod', label: 'x', defaultOn: true, key: 'switch.test-mod.off' }])).toThrow('the switch another-mod.x uses the store key of test-mod.off')
    expect(() => addSwitchDefs(registry, [{ id: 'another-mod.y', mod: 'another-mod', label: 'y', defaultOn: true, legacyKey: 'switch.test-mod.on' }])).toThrow('the switch another-mod.y and test-mod.on share a key one of them reads as an older release\'s')
    expect(() => addSwitchDefs(registry, [{ id: 'another-mod.z', mod: 'another-mod', label: 'z', defaultOn: true, key: 'old' }])).toThrow('the switch another-mod.z and test-mod.on share a key one of them reads as an older release\'s')
    expect([...registry.keys()]).toEqual(['test-mod.on', 'test-mod.off'])
  })
})

// TRDD-AXE8CUWR: a mod's notice line. The hooks module a test loads is not the instance a test file imports: a mod
// defined, and a pane and tool registered, from a test file are not the ones that answer (measured in the review of
// 72d3969: the loaded module answered the pane and the tool, and an inline test plugin may not call this plugin's
// functions). So a fake mod's notice is shown through the pure rules the pane and the tool use, with a getter map of the
// test's own, as addSwitchDefs is shown with a registry of its own.
describe('mod notices', () => {
  const unset = (def: SwitchDef): Listed => ({ def, state: stateOf(def, parseStored(undefined), false, undefined) })
  const rows = [unset(ON_DEF), unset(OFF_DEF)]
  const other = unset({ id: 'other-mod.x', mod: 'other-mod', label: 'x', defaultOn: true })
  const drawn = (items: SectionItem[]): string[] => items.map((item) => (item.kind === 'row' ? `row ${item.index} ${item.listed.def.id}` : `${item.kind} ${item.text}`))
  const only = (answer: string | undefined) => new Map<string, NoticeGetter>([['test-mod', () => answer]])
  const PAUSED = 'Paused: its standalone plugin is enabled.'

  test('a fake mod\'s notice is drawn under its heading and above its rows, and listed beside the mod; no getter, undefined or an empty answer draws and lists nothing', () => {
    const getters = only(PAUSED)
    const notice = noticeOf(getters, 'test-mod', 's1')
    expect(notice).toStrictEqual({ text: PAUSED })
    expect(drawn(modSection('test-mod', notice.text, rows, 200))).toEqual(['heading test-mod', `notice ${PAUSED}`, 'row 0 test-mod.on', 'row 1 test-mod.off'])
    const notices = new Map([['test-mod', notice.text], ['other-mod', noticeOf(getters, 'other-mod', 's1').text]])
    expect(statusText([...rows, other], notices)).toBe(
      [
        'Functions of the integrated mods (id, state, what it is):',
        `test-mod (notice: ${PAUSED}):`,
        '  test-mod.on  on  on by default',
        '  test-mod.off  off  off by default',
        'other-mod:',
        '  other-mod.x  on  x',
        'Switch one with {"switch": "<id>", "on": true} or false.',
      ].join('\n'),
    )
    for (const answer of [undefined, '']) {
      const none = noticeOf(only(answer), 'test-mod', 's1')
      expect(none).toStrictEqual({ text: undefined })
      expect(drawn(modSection('test-mod', none.text, rows, 200))).toEqual(['heading test-mod', 'row 0 test-mod.on', 'row 1 test-mod.off'])
      expect(statusText(rows, new Map([['test-mod', none.text]]))).toContain('\ntest-mod:\n  test-mod.on')
    }
  })

  test('noticeOf asks the getter at each call, with the session, so a changed answer is what the next drawing or listing reads', () => {
    let swallowed = 0
    const getters = new Map<string, NoticeGetter>([['test-mod', (session) => `${session}: ${swallowed} errors swallowed`]])
    expect(noticeOf(getters, 'test-mod', 's1').text).toBe('s1: 0 errors swallowed')
    swallowed = 3
    expect(noticeOf(getters, 'test-mod', 's1').text).toBe('s1: 3 errors swallowed')
    expect(noticeOf(getters, 'test-mod', 's2').text).toBe('s2: 3 errors swallowed')
  })

  test('a notice is one printable line of at most NOTICE_MAX characters: a line break cannot forge a row of the listing, and white space alone is no notice', () => {
    const forged = noticeOf(only('paused\n  test-mod.on  off  forged row\r\n'), 'test-mod', 's1').text
    expect(forged).toBe('paused test-mod.on off forged row')
    expect(statusText(rows, new Map([['test-mod', forged]])).split('\n')).toHaveLength(statusText(rows, new Map()).split('\n').length)
    expect(noticeOf(only('a\u0007b\u202ec\tend'), 'test-mod', 's1').text).toBe('a?b?c end')
    // C1 controls, U+0085 (next line) among them, and every direction mark (U+061C, U+200E, U+200F, U+202A to U+202E,
    // U+2066 to U+2069) are a '?' each: none can break the line or turn the text around (review of d783048).
    expect(noticeOf(only('a\u0085b\u0080c\u009fd'), 'test-mod', 's1').text).toBe('a?b?c?d')
    const marks = ['\u061c', '\u200e', '\u200f', '\u202a', '\u202b', '\u202c', '\u202d', '\u202e', '\u2066', '\u2067', '\u2068', '\u2069']
    expect(noticeOf(only(marks.map((mark, i) => `${i}${mark}`).join('')), 'test-mod', 's1').text).toBe(marks.map((_, i) => `${i}?`).join(''))
    expect(noticeOf(only(' \n\t '), 'test-mod', 's1')).toStrictEqual({ text: undefined })
    const long = noticeOf(only('x'.repeat(NOTICE_MAX + 50)), 'test-mod', 's1').text
    expect(long).toBe(`${'x'.repeat(NOTICE_MAX - 1)}…`)
    expect(noticeOf(only('y'.repeat(NOTICE_MAX)), 'test-mod', 's1').text).toBe('y'.repeat(NOTICE_MAX))
    // The cut counts code points: a character outside the BMP at the cut is kept whole, never split into a lone surrogate.
    const astral = noticeOf(only(`${'x'.repeat(NOTICE_MAX - 2)}\u{1F600}\u{1F600}\u{1F600}`), 'test-mod', 's1').text ?? ''
    expect(astral).toBe(`${'x'.repeat(NOTICE_MAX - 2)}\u{1F600}…`)
    expect(Array.from(astral)).toHaveLength(NOTICE_MAX)
    expect(noticeOf(only('\u{1F600}'.repeat(NOTICE_MAX)), 'test-mod', 's1').text).toBe('\u{1F600}'.repeat(NOTICE_MAX))
    // The pane fits the notice to its width, as it fits a row.
    expect(drawn(modSection('test-mod', 'z'.repeat(60), rows, 20))[1]).toBe(`notice ${'z'.repeat(19)}…`)
  })

  test('a getter that throws gives a plain notice that it failed, without the error text, and the mod\'s rows are still drawn and listed', () => {
    const error = new Error('the detection read failed: boom')
    const getters = new Map<string, NoticeGetter>([
      [
        'test-mod',
        () => {
          throw error
        },
      ],
    ])
    const notice = noticeOf(getters, 'test-mod', 's1')
    expect(notice).toStrictEqual({ text: 'The notice of test-mod could not be read.', error })
    expect(drawn(modSection('test-mod', notice.text, rows, 200))).toEqual(['heading test-mod', 'notice The notice of test-mod could not be read.', 'row 0 test-mod.on', 'row 1 test-mod.off'])
    const listing = statusText(rows, new Map([['test-mod', notice.text]]))
    expect(listing).toContain('test-mod (notice: The notice of test-mod could not be read.):\n  test-mod.on  on  on by default\n  test-mod.off  off')
    expect(listing).not.toContain('boom')
  })

  test('the debug line of a getter that threw is masked: no token, key or home path is left in it', () => {
    const github = ['ghp', '_', 'a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8'].join('')
    const anthropic = ['sk-', 'ant-', 'api03-', 'AbCdEfGhIjKlMnOpQrStUvWx'].join('')
    const line = noticeErrorLine('test-mod', new Error(`read ${HOME}/.config/deck.json with ${github} and ${anthropic}`), HOME)
    expect(line.startsWith('mods-switches: the notice of test-mod could not be read: read ~/.config/deck.json with ')).toBe(true)
    for (const secret of [github, anthropic, HOME]) expect(line).not.toContain(secret)
    expect(noticeErrorLine('test-mod', 'not an Error', HOME)).toBe('mods-switches: the notice of test-mod could not be read: not an Error')
    // On one printable line (item 3 sweep, G1): a break and a tab are one space, a control a '?'.
    expect(noticeErrorLine('test-mod', new Error('first\n\tsecond \u001b[2K'), HOME)).toBe('mods-switches: the notice of test-mod could not be read: first second ?[2K')
  })

  test('a failure line of the start is masked and printable: no token, key or home path, and a control character is a ?', () => {
    const github = ['ghp', '_', 'a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8'].join('')
    const line = startFailedLine('the settings could not be read', new Error(`at ${HOME}/x with ${github} \u001b[2K`), HOME)
    expect(line).toBe('mods-switches: the settings could not be read: at ~/x with [REDACTED:github-token] ?[2K')
    expect(startFailedLine('the home folder could not be read', 'refused', undefined)).toBe('mods-switches: the home folder could not be read: refused')
  })

  test('defineNotice refuses a mod that defines no switch, since its notice could be shown nowhere', () => {
    expect(() => defineNotice('no-such-mod', () => 'x')).toThrow('defineNotice: no switch of the mod no-such-mod is defined; call defineSwitches first')
    defineSwitches([{ id: 'notice-test-mod.x', mod: 'notice-test-mod', label: 'x', defaultOn: true }])
    expect(() => defineNotice('notice-test-mod', () => 'x')).not.toThrow()
  })

  test('a home folder that cannot be read at the start is said in the transcript, masked and printable, and the start still reads the switches and asks for their review', async ($, on) => {
    const w = world(on, { [keyFor(MM_PANE)]: { v: false, at: 7, sig: 'forged' } })
    w.envRefused = 'the environment is not readable \u001b[2K at /Users/alice/x'
    await start($)
    const lines = w.logs.filter((text) => text.startsWith("mods-switches: the home folder could not be read, so a mod's notice error is masked without it: "))
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('the environment is not readable ?[2K at /Users/<user>/x')
    expect(w.toasts).toContain(REVIEW_TOAST)
  })
})
describe('the switches tool', () => {
  test('is registered deferred at every start, and lists every function with its state', async ($, on) => {
    world(on)
    for (const surface of SURFACES) {
      await start($, surface)
      const listed = String((await $.tool.call({ tool: TOOL } as any)).result)
      expect(listed).toContain('mods-manager:\n  mods-manager.pane  on  /mods-manager pane and command\n')
      expect(listed).toContain(`  ${MM_RELOAD}  on  Reload plugins\n`)
      expect(listed).toContain(`  ${AUTO_UPDATE}  off  auto-update: the hourly check updates the plugins opted in with Auto\n`)
      expect(listed).toContain(`  ${PROBE}  off  probe tool and /probe-runner (a tool: on takes effect at the next session start)\n`)
      expect(listed).not.toContain('Waiting for the person')
      const one = String((await $.tool.call({ tool: TOOL, switch: MM_RELOAD } as any)).result)
      expect(one).toContain(`  ${MM_RELOAD}  on  Reload plugins`)
      expect(one).not.toContain(MM_PANE)
    }
  })

  test('the agent switches a function off and on: a signed value, one toast per change, and it holds at once', async ($, on) => {
    const w = world(on)
    quietManager(on)
    await start($)
    expect((await agentSets($, MM_PANE, false)).result).toBe(`${MM_PANE} is now off.`)
    const stored = parseStored(w.store.get(keyFor(MM_PANE)))
    expect(stored).toMatchObject({ kind: 'envelope', v: false })
    expect(await isSigned(keyFor(MM_PANE), stored)).toBe(true)
    expect(w.toasts).toEqual(['The agent turned off mods-manager: /mods-manager pane and command.'])
    // Already off: no change, so no toast.
    await agentSets($, MM_PANE, false)
    expect(w.toasts.length).toBe(1)
    await run($, 'mods-manager')
    expect(w.opened).toEqual([])
    expect(w.toasts[1]).toBe(MM_OFF)
    await agentSets($, MM_PANE, true)
    expect(w.toasts[2]).toBe('The agent turned on mods-manager: /mods-manager pane and command.')
    await run($, 'mods-manager')
    expect(w.opened).toEqual(['mod-manager'])
    // The read the command started ends before the test does, or it would call a session already gone.
    await settled(w, () => managerReadEnded(w))
    expect(managerReadEnded(w)).toBe(true)
  })

  // Owner ruling 1 of 2026-11-05 (item S dropped): Claude may turn any switch on, and a toast is the only notice the person
  // gets. Every function the switches tool lists is turned on by the agent here, the five item S had marked among them, so
  // a refusal or a missing toast for any one of them, or for a function a later mod adds, turns this red. An on over an on
  // changes nothing and is not toasted again.
  test('the agent may turn on every function the registry holds, each on is toasted once, and an on over an on is a no-op', async ($, on) => {
    const w = world(on)
    await start($)
    const rows: Array<{ id: string; on: boolean; toast: string }> = []
    let mod = ''
    for (const line of String((await $.tool.call({ tool: TOOL } as any)).result).split('\n')) {
      const heading = /^(\S+?)(?: \(notice: .*\))?:$/.exec(line)
      if (heading !== null && heading[1] !== undefined) mod = heading[1]
      const row = /^ {2}(\S+) {2}(on|off) {2}(.*?)(?: \(a tool: on takes effect at the next session start\))?$/.exec(line)
      if (row !== null && row[1] !== undefined) rows.push({ id: row[1], on: row[2] === 'on', toast: `The agent turned on ${mod}: ${row[3] ?? ''}.` })
    }
    for (const id of [RUN, LIST_COMMANDS, PANE, PROBE, AUTO_UPDATE]) expect(rows.map((row) => row.id)).toContain(id)
    for (const row of rows) {
      if (row.on) await agentSets($, row.id, false)
      w.toasts.length = 0
      const answer = await agentSets($, row.id, true)
      expect(answer.deny).toBeUndefined()
      expect(String(answer.result).startsWith(`${row.id} is now on.`)).toBe(true)
      await agentSets($, row.id, true)
      expect(w.toasts.filter((toast) => toast === row.toast)).toHaveLength(1)
    }
  })

  test('a bad input is refused and changes nothing', async ($, on) => {
    const w = world(on)
    await start($)
    expect((await $.tool.call({ tool: TOOL, switch: 'nope', on: false } as any)).deny).toBe('There is no function "nope". Call switches with no input to list them.')
    expect([...w.store.keys()]).toEqual([])
  })
})

describe('the mod\'s own command', () => {
  test('a person on Remote Control or an SDK host is the person: no agent toast; a command run for the model is the agent', async ($, on) => {
    const w = world(on)
    await start($)
    for (const kind of ['bridge', 'sdk', 'composer'] as const) {
      await $.command.run({ command: 'mods-dev-tools', args: 'off', origin: { kind }, presentation: { isFullscreen: false, columns: 80 } })
      await $.command.run({ command: 'mods-dev-tools', args: 'on', origin: { kind }, presentation: { isFullscreen: false, columns: 80 } })
    }
    expect(w.toasts).toEqual([])
    await $.command.run({ command: 'mods-dev-tools', args: 'off', origin: { kind: 'plugin', name: PLUGIN }, presentation: { isFullscreen: false, columns: 80 } })
    expect(w.toasts).toEqual([
      'The agent turned off self-command: run tool: Claude queues a slash command.',
      'The agent turned off self-command: list_commands tool.',
      'The agent turned off self-command: /self-command pane.',
      'The agent turned off probe-runner: probe tool and /probe-runner.',
    ])
  })

  test('with no argument it turns every function on unless all are on', async ($, on) => {
    const w = world(on)
    await start($)
    // One of the four on and the others off by default: not all are on, so no argument turns every one on.
    await agentSets($, RUN, true)
    expect((await run($, 'mods-dev-tools')).text).toBe('The mods dev tools are on. Their tools register when the next session starts.')
    for (const id of [RUN, LIST_COMMANDS, PANE, PROBE]) expect(parseStored(w.store.get(keyFor(id)))).toMatchObject({ v: true })
    expect((await run($, 'mods-dev-tools')).text).toBe('The mods dev tools are off. Every call to them is refused from now on; they leave the tool list when the next session starts.')
    for (const id of [RUN, LIST_COMMANDS, PANE, PROBE]) expect(parseStored(w.store.get(keyFor(id)))).toMatchObject({ v: false })
  })

  test('an older release\'s key written again by an older session holds until every function has its own value', async ($, on) => {
    const w = world(on)
    await start($)
    await agentSets($, RUN, true)
    await agentSets($, LIST_COMMANDS, true)
    await agentSets($, PANE, true)
    // A session of the older release still running writes its one dev-tools switch: the function with no value of its own
    // follows it, the others keep theirs. The four are off by default, so the old key's true is not applied but waits for
    // the person's review; an old false would read as the default, and so show nothing.
    w.store.set('dev-tools', true)
    const listed = String((await $.tool.call({ tool: TOOL } as any)).result)
    expect(listed).toContain(`  ${RUN}  on  `)
    expect(listed).toContain(`  ${PROBE}  off  `)
    expect(listed).toContain(`Waiting for the person's review in /mods-switches, not applied: ${PROBE}.`)
    expect(w.store.has('dev-tools')).toBe(true)
    await agentSets($, PROBE, true)
    expect(w.store.has('dev-tools')).toBe(false)
  })
})
describe('a function switched off runs nothing', () => {
  // Each act, then what it may call while its function is off: reading the switch, and a toast saying it is off. The
  // dev tools register only at a start while on, so their worlds start with the switch signed on.
  const cases = [
    {
      id: MM_PANE,
      store: async (): Promise<Record<string, unknown>> => ({}),
      answers: (on: any, _w: World) => quietManager(on),
      act: async ($: any) => {
        await run($, 'mods-manager')
      },
      onCalls: ['ui.open'],
      // The command reads the installed plugins without waiting for it.
      ended: managerReadEnded,
    },
    {
      id: LIST_COMMANDS,
      store: () => signedOn([LIST_COMMANDS]),
      // The command list, recorded with the world's calls: what the tool reads when it runs.
      answers: (on: any, w: World) =>
        on('command.list', () => {
          w.calls.push('command.list')
          return { value: [] }
        }),
      act: async ($: any) => {
        await $.tool.call({ tool: LIST_TOOL, query: '' } as any)
      },
      onCalls: ['command.list'],
      ended: (_w: World) => true,
    },
    {
      id: PROBE,
      store: () => signedOn([PROBE]),
      answers: (on: any, _w: World) => on('session.cwd', () => ({ value: '/work' })),
      act: async ($: any) => {
        await run($, 'probe-runner', 'my-plugin say hello')
      },
      // The plugin folder is looked for, and is missing in this world, so no probe starts.
      onCalls: ['env.get', 'session.root', 'fs.exists'],
      ended: (_w: World) => true,
    },
  ]
  for (const { id, store, answers, act, onCalls, ended } of cases) {
    test(`${id}: off, only the switch is read; on, the same act does its work`, async ($, on) => {
      const w = world(on, await store())
      answers(on, w)
      await start($)
      await agentSets($, id, false)
      w.calls = []
      await act($)
      expect(w.calls.filter((name) => name !== 'store.get' && name !== 'ui.toast')).toEqual([])
      expect(w.calls).toContain('store.get')
      // The control: switched on, the recorder sees the work, so the empty list above is not a blind recorder.
      await agentSets($, id, true)
      w.calls = []
      await act($)
      for (const name of onCalls) expect(w.calls).toContain(name)
      // Work the act left running ends before the test does, or it would call a session already gone.
      await settled(w, () => ended(w))
      expect(ended(w)).toBe(true)
    })
  }

  test('a button drawn before its switch went off reads nothing when pressed, and says the function is off', async ($, on) => {
    const w = world(on)
    quietManager(on)
    await start($)
    const ui = await $.ui.mount(pane('terminal', 80, 'mod-manager'))
    expect(await ui.find({ key: 'mm-refresh' })).toBeDefined()
    // Another session switches the pane off: the store changes, this drawing is not told.
    w.store.set(keyFor(MM_PANE), await signed(MM_PANE, false, 20_000))
    w.calls = []
    await ui.press({ key: 'mm-refresh' })
    // The press starts its work without waiting for it: let it run until its toast.
    await settled(w, () => w.toasts.length > 0)
    expect(w.toasts).toEqual([MM_OFF])
    // The redraw the refusal asks for reads the session id to find its state; nothing else is read: no profile, no home
    // folder, no claude list.
    expect(w.calls.filter((name) => name !== 'store.get' && name !== 'ui.toast' && name !== 'session.id')).toEqual([])
    // One redraw, so one read of the session id: a second would be work the press started.
    expect(w.calls.filter((name) => name === 'session.id')).toHaveLength(1)
    expect(w.writes).toEqual([])
    // The refusal drew the pane again: it now says the pane is off, with nothing to press.
    expect(await ui.find({ key: 'mm-refresh' })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: MM_OFF })).toBeDefined()
    await ui.unmount()
  })
})
describe('/mods-switches', () => {
  test('opens the pane; any argument answers the usage line', async ($, on) => {
    const w = world(on)
    await start($)
    expect((await run($, 'mods-switches', 'later')).text).toBe('Usage: /mods-switches')
    expect(w.opened).toEqual([])
    await run($, 'mods-switches')
    expect(w.opened).toEqual(['mods-switches'])
  })

  test('lists the mods and the picked mod\'s functions; a press switches one, signed, with no toast', async ($, on) => {
    const w = world(on)
    for (const surface of SURFACES) {
      for (const columns of WIDTHS) {
        w.store.clear()
        await start($, surface)
        const ui = await $.ui.mount(pane(surface, columns))
        // The mods are listed in the order they define their switches when the plugin loads: deck, tokensaver, mods-manager.
        await ui.press({ key: 'sw-mod-mods-manager' })
        expect(await label(ui, 'sw-mod-mods-manager')).toBe('• 3: mods-manager')
        expect(await label(ui, `sw-${MM_PANE}`)).toMatch(/^a: ✓ on  \/mods-manager pane/)
        expect(await label(ui, `sw-${MM_RELOAD}`)).toMatch(/^b: ✓ on  Reload plugins/)
        expect((await label(ui, `sw-${MM_PANE}`)).length).toBeLessThanOrEqual(columns - 8)
        await ui.press({ key: `sw-${MM_RELOAD}` })
        expect(await label(ui, `sw-${MM_RELOAD}`)).toMatch(/^b: ✗ off Reload plugins/)
        expect(await isSigned(keyFor(MM_RELOAD), parseStored(w.store.get(keyFor(MM_RELOAD))))).toBe(true)
        expect(w.toasts).toEqual([])
        await ui.unmount()
      }
    }
  })
  test('no integrated mod defines a notice yet: each mod\'s heading is followed at once by its rows, then the notes, and the listing names each mod alone', async ($, on) => {
    world(on)
    await start($)
    const ui = await $.ui.mount(pane('terminal', 160))
    const mods = (await ui.findAll({ type: 'Button' })).map((button) => button.key).filter((key): key is string => key !== undefined && key.startsWith('sw-mod-'))
    expect(mods.length).toBeGreaterThan(3)
    for (const key of mods) {
      await ui.press({ key })
      const mod = key.slice('sw-mod-'.length)
      // Every Text and Button in the order drawn (findAll lists the tree in document order).
      const items = (await ui.findAll({}))
        .filter((element) => element.type === 'Text' || element.type === 'Button')
        .map((element) => (element.type === 'Button' ? `button ${element.key}` : `text ${element.text}`))
      const heading = items.indexOf(`text ${mod}`)
      expect(heading).toBeGreaterThanOrEqual(0)
      const after = items.slice(heading + 1)
      const rows = after.findIndex((item) => !item.startsWith(`button sw-${mod}.`))
      expect(rows).toBeGreaterThan(0)
      expect(after.slice(rows).filter((item) => item !== `text ${NEXT_SESSION_NOTE}`)).toEqual(['text Esc closes'])
    }
    await ui.unmount()
    expect(String((await $.tool.call({ tool: TOOL } as any)).result)).not.toContain('(notice:')
  })
  test('a press on a view another session has since switched off does not turn it back on', async ($, on) => {
    const w = world(on)
    await start($)
    const ui = await $.ui.mount(pane('terminal', 160))
    await ui.press({ key: 'sw-mod-mods-manager' })
    await ui.press({ key: `sw-${MM_RELOAD}` })
    expect(await label(ui, `sw-${MM_RELOAD}`)).toMatch(/✗ off/)
    // Another session turns it on and off again after this drawing: the store changes, this drawing is not told.
    await w.clock.advance(1_000)
    w.store.set(keyFor(MM_RELOAD), await signed(MM_RELOAD, false, w.clock.now()))
    await ui.press({ key: `sw-${MM_RELOAD}` })
    expect(parseStored(w.store.get(keyFor(MM_RELOAD)))).toMatchObject({ v: false, at: 11_000 })
    expect(w.toasts).toEqual(['Reload plugins was turned off after this pane was drawn, so it stays off. Press again to turn it on.'])
    // The refusal drew the pane again, so a second press acts on what the store holds now.
    await ui.press({ key: `sw-${MM_RELOAD}` })
    expect(parseStored(w.store.get(keyFor(MM_RELOAD)))).toMatchObject({ v: true })
  })
})
describe('a value written outside the plugin', () => {
  test('an unsigned off holds; the start says so once, the pane asks, and Keep signs what was shown', async ($, on) => {
    const w = world(on, { [keyFor(MM_PANE)]: { v: false, at: 50_000, sig: 'forged' } })
    await start($)
    expect(w.toasts).toEqual([REVIEW_TOAST])
    // The unsigned off holds: the mods-manager pane draws only the line that says it is off, with nothing to press.
    const managerUi = await $.ui.mount(pane('terminal', 80, 'mod-manager'))
    expect(await managerUi.find({ key: 'mm-refresh' })).toBeUndefined()
    expect(await managerUi.find({ type: 'Text', text: MM_OFF })).toBeDefined()
    await managerUi.unmount()
    const listed = String((await $.tool.call({ tool: TOOL } as any)).result)
    expect(listed).toContain(`Waiting for the person's review in /mods-switches, not applied: ${MM_PANE}.`)
    const ui = await $.ui.mount(pane('desktop', 160))
    expect(await ui.find({ type: 'Text', text: 'Set by an older release or outside the plugin, so not applied: mods-manager: /mods-manager pane and command (off). Keep them, or switch each one below.' })).toBeDefined()
    await ui.press({ key: 'sw-keep' })
    const kept = parseStored(w.store.get(keyFor(MM_PANE)))
    // Keep writes after the time it was shown, even one ahead of this clock: the order of writes never goes back.
    expect(kept).toMatchObject({ v: false, at: 50_001 })
    expect(await isSigned(keyFor(MM_PANE), kept)).toBe(true)
    expect(await ui.find({ key: 'sw-keep' })).toBeUndefined()
    expect(w.toasts).toEqual([REVIEW_TOAST])
  })

  test('Keep leaves a value that changed after the pane was drawn for the next look', async ($, on) => {
    const w = world(on, { [keyFor(MM_PANE)]: 'garbled' })
    await start($)
    const ui = await $.ui.mount(pane('terminal', 160))
    expect(await ui.find({ key: 'sw-keep' })).toBeDefined()
    // Changed outside again, to an unsigned off, after the drawing that offered to keep the default.
    w.store.set(keyFor(MM_PANE), { v: false, at: 9, sig: 'forged' })
    await ui.press({ key: 'sw-keep' })
    expect(w.store.get(keyFor(MM_PANE))).toEqual({ v: false, at: 9, sig: 'forged' })
    expect(await ui.find({ type: 'Text', text: 'Set by an older release or outside the plugin, so not applied: mods-manager: /mods-manager pane and command (off). Keep them, or switch each one below.' })).toBeDefined()
  })

  test('a garbled value is the default until kept, and Keep writes the default signed', async ($, on) => {
    const w = world(on, { [keyFor(MM_PANE)]: 'garbled' })
    quietManager(on)
    await start($)
    // On by default, so the garbled value leaves the pane on: the command opens it.
    await run($, 'mods-manager')
    expect(w.opened).toEqual(['mod-manager'])
    // The read the command started ends before the test does, or it would call a session already gone.
    await settled(w, () => managerReadEnded(w))
    expect(managerReadEnded(w)).toBe(true)
    const ui = await $.ui.mount(pane('terminal', 160))
    await ui.press({ key: 'sw-keep' })
    const kept = parseStored(w.store.get(keyFor(MM_PANE)))
    expect(kept).toMatchObject({ v: true })
    expect(await isSigned(keyFor(MM_PANE), kept)).toBe(true)
  })
})
