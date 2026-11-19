// The integrated Deck's own rules (TRDD-RD1ISPMN, D1b-1 step 3): the master switch and the per-function switches, the
// session rules (R3, R7), the person-only city and weather (R8 final and the person-only ruling for deck.weather), the
// checks on saved settings (A3), the router-line hooks (R5), the prompt.submit dispatcher (ruling 8 as amended), the
// reads of the switches (the no-copy ruling) and the stops (R1, PRRD G13.1). What Deck draws is upstream's, tested by
// deck.test.ts, adapted from upstream.
import { expect, mock, test, type MockClock } from 'claude-code/testing'

import { ANIMATION, applySwitches, AUTO, PREF_SWITCHES, QUIET, SECTIONS, sectionSwitch, SOUND, SPEND, type Governed } from '../deck/switches'
import { byOf, envelopeOf } from '../switches/logic'

const PLUGIN = 'mods-expert-developer-plugin'
const MASTER_KEY = 'switch.deck.master'
const OFF_TEXT = 'Deck is off. Turn it on with /mods-deck on or in the switches pane.'
const OFF_STATUS = 'Deck is off in every session. Turn it on with /mods-deck on or in the switches pane (/mods-switches).'
const NOT_STARTED_TEXT = 'Deck was turned on in another session; it starts here at the next session start, or now with /mods-deck on.'
const START_FAILED_TEXT = 'Deck is on, but it could not start in this session; the plugin log says why.'
const CITY_PERSON_ONLY = 'Only the person sets the weather city: type /mods-deck city <name> yourself.'
const WEATHER_PERSON_ONLY = 'Only the person turns the weather section on: type /mods-deck weather on yourself.'
const ALL_BUT_WEATHER = 'Every section but the weather is on; only the person turns the weather on: /mods-deck weather on.'
const GEOCODER = 'https://geocoding-api.open-meteo.com/'
const FORECAST = 'https://api.open-meteo.com/'

type World = {
  clock: MockClock
  store: Map<string, unknown>
  /** Every store key read, in order. */
  reads: string[]
  /** The calls a later one must follow: `session.id`, `store.set:<key>`, `http.fetch:<url>`, `agent.list`, in order. */
  trace: string[]
  logs: string[]
  sounds: string[]
  registered: string[]
  /** What the hook beneath the plugins received for each prompt. */
  prompts: string[]
  /** The id session.id answers: a /clear or a resume moves the process to another (endAndMove, with the session.end
   * hook below the plugins that world() registers, so a test does not register its own). */
  session: string
  home: string
  refuseRegister: string | undefined
  /** Store keys whose read is refused, with the reason. */
  refusedReads: Map<string, string>
  /** A store key whose read waits this long on the clock before it answers: a start held open. */
  held: { key: string; ms: number } | undefined
  /** When true, the hook beneath the plugins throws on every prompt. */
  promptFails: boolean
  /** What the permission check beneath the plugins answers. */
  checkDecision: 'allow' | 'ask'
  geocoded: unknown
}

// Everything Claude Code answers for the calls the plugin's mods make, each recorded where a test reads it.
function world(on: any): World {
  const w: World = {
    clock: mock.clock(on, { now: 10_000 }),
    store: new Map(),
    reads: [],
    trace: [],
    logs: [],
    sounds: [],
    registered: [],
    prompts: [],
    session: 'session-1',
    home: '/home/tester',
    refuseRegister: undefined,
    refusedReads: new Map(),
    held: undefined,
    promptFails: false,
    checkDecision: 'allow',
    geocoded: { results: [{ name: 'Rome', country: 'Italy', latitude: 41.89193, longitude: 12.51133 }] },
  }
  const value = (name: string, answer: (e: any) => unknown) => on(name, ($: any, e: any) => ({ value: answer(e) }))
  on('store.get', async ($: any, e: any) => {
    w.reads.push(e.key)
    const held = w.held
    if (held !== undefined && held.key === e.key) await w.clock.sleep(held.ms)
    const refused = w.refusedReads.get(e.key)
    return refused === undefined ? { value: w.store.get(e.key) } : { deny: refused }
  })
  value('store.set', (e) => {
    w.trace.push(`store.set:${e.key}`)
    w.store.set(e.key, e.value)
  })
  value('store.delete', (e) => void w.store.delete(e.key))
  on('command.register', ($: any, e: any) => {
    w.registered.push(e.name)
    return w.refuseRegister === undefined ? { value: { command: e.name } } : { deny: w.refuseRegister }
  })
  value('audio.play', (e) => void w.sounds.push(String(e.asset)))
  value('http.fetch', (e) => {
    w.trace.push(`http.fetch:${e.url}`)
    const body = String(e.url).startsWith(GEOCODER) ? w.geocoded : { current: { temperature_2m: 18, weather_code: 1 } }
    return { status: 200, ok: true, headers: {}, text: JSON.stringify(body) }
  })
  value('session.id', () => (w.trace.push('session.id'), w.session))
  value('session.cwd', () => '/work')
  value('session.root', () => '/work')
  value('session.repo', () => null)
  value('session.model', () => 'claude-opus-5-5')
  value('session.usage', () => ({
    startedAt: 0,
    context: { tokens: 124_000, window: 1_000_000, percent: 12 },
    cost: { usd: 0.42 },
    rateLimits: [{ kind: 'five_hour', percentUsed: 31, resetsAt: new Date(Date.now() + 3_600_000).toISOString() }],
  }))
  value('env.get', (e) => (e.name === 'HOME' ? w.home : undefined))
  value('agent.list', () => (w.trace.push('agent.list'), []))
  value('tool.register', (e) => ({ tool: `mcp__${PLUGIN}__${e.name}` }))
  value('ui.open', () => ({ isPlaced: true }))
  value('ui.panes', () => [])
  value('ui.toast', () => undefined)
  value('ui.log', (e) => void w.logs.push(String(e.text)))
  value('fs.exists', () => false)
  value('fs.list', () => [])
  on('session.start', ($: any, e: any) => ({ cwd: e.cwd }))
  on('session.end', ($: any, e: any) => ({ sessionId: e.sessionId }))
  on('classic.SessionStart', () => ({}))
  on('classic.CwdChanged', () => ({}))
  on('prompt.submit', ($: any, e: any) => {
    w.prompts.push(e.text)
    if (w.promptFails) throw new Error('the hook beneath failed')
    return { text: e.text }
  })
  on('turn.start', ($: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  on('tool.call', () => ({ result: 'ok' }))
  on('tool.check', () => ({ decision: w.checkDecision }))
  on('session.measure', ($: any, e: any) => ({ changed: e.changed }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['engine'] }))
  return w
}

const start = ($: any) => $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
/** The session the world answers for ends with this reason, and the process goes on under the id to. */
async function endAndMove($: any, w: World, reason: string, to: string): Promise<void> {
  await $.session.end({ reason, sessionId: w.session, resume: { id: w.session } })
  w.session = to
}
/** /mods-deck with these arguments, from this origin kind; none sends no origin at all. */
const deck = ($: any, args: string, kind: string | undefined = 'composer') =>
  $.command.run({ command: 'mods-deck', args, ...(kind === undefined ? {} : { origin: { kind } }), presentation: { columns: 80, isFullscreen: false } } as any)
/** A switch value as another session, or the pane, writes it: signed, later than anything the test wrote. */
async function storeSwitch(w: World, id: string, on: boolean, at = 50_000): Promise<void> {
  w.store.set(`switch.${id}`, await envelopeOf(`switch.${id}`, on, at))
}
const switchValue = (w: World, id: string): unknown => (w.store.get(`switch.${id}`) as { v?: unknown } | undefined)?.v
const deckLines = (w: World): string[] => w.logs.filter((line) => line.startsWith('deck: '))
const deckReads = (w: World): string[] => w.reads.filter((key) => key.startsWith('switch.deck.') || key.startsWith('deck.'))
const fetched = (w: World): string[] => w.trace.filter((call) => call.startsWith('http.fetch:'))
const band = {
  component: 'AbovePrompt',
  requestId: 'above-prompt',
  plugin: PLUGIN,
  surface: 'terminal',
  props: { view: {}, scroll: { bodyRows: 20, offset: 0 }, maxRows: 20, bodyColumns: 110, isWorking: true, hasSurvey: false },
  viewport: { rows: 40, columns: 120 },
} as const
const footer = { component: 'SessionMode', requestId: 'session-mode', plugin: PLUGIN, surface: 'terminal', props: { modes: [] }, viewport: { rows: 40, columns: 120 } } as const
/** The pane of the style picker, as /mods-deck style opens it. */
const picker = {
  component: 'Pane',
  requestId: 'mods-deck-style',
  plugin: PLUGIN,
  surface: 'terminal',
  props: { title: 'Deck style', isFocused: true, bodyColumns: 100, placement: 'inline', scroll: { offset: 0, bodyRows: 12 }, view: {} },
  viewport: { columns: 120, rows: 40 },
} as const

// ---------- the master switch (R1, R3, G13.1) ----------

test('with the master off, a session start registers /mods-deck, loads none of Deck\'s state, and no clock runs', async ($, on) => {
  const w = world(on)
  await storeSwitch(w, 'deck.master', false)
  await start($)
  expect(w.registered).toContain('mods-deck')
  // the switches registry reads every switch at its own start; Deck reads its master, then none of its own state
  expect(w.reads.filter((key) => key.startsWith('deck.'))).toEqual([])
  w.reads.length = 0
  await w.clock.advance(1_000)
  expect(deckReads(w)).toEqual([])
})

test('with the master off, every Deck hook passes its event on after reading only the master, with no session id, store write or request', async ($, on) => {
  const w = world(on)
  await storeSwitch(w, 'deck.master', false)
  await start($)
  const raise = [
    () => $.tool.call({ tool: 'Read', file_path: '/work/a.ts' } as any),
    () => $.turn.start({ text: 'Fix it', turnId: 't1' } as any),
    () => $.turn.complete({ turnId: 't1', answer: 'ok', durationMs: 5, isAborted: false, reason: 'answer', usage: null } as any),
    () => $.session.measure({ context: { tokens: 1, window: 10, percent: 10 }, rateLimits: [], changed: ['context'] } as any),
    () => $.classic.CwdChanged({ old_cwd: '/work', new_cwd: '/elsewhere' } as any),
  ]
  for (const event of raise) {
    w.reads.length = 0
    w.trace.length = 0
    await event()
    expect(w.reads.length).toBeGreaterThan(0)
    expect(w.reads.every((key) => key === MASTER_KEY)).toBe(true)
    expect(w.trace).toEqual([])
  }
})

test('with the master off, /mods-deck status says Deck is off everywhere and any other argument says how to turn it on', async ($, on) => {
  const w = world(on)
  await storeSwitch(w, 'deck.master', false)
  await start($)
  expect((await deck($, 'status')).text).toBe(OFF_STATUS)
  expect((await deck($, 'expand')).text).toBe(OFF_TEXT)
  expect(deckReads(w)).not.toContain('deck.prefs')
})

test('with the master off, the band and the footer draw what lies beneath them', async ($, on) => {
  const w = world(on)
  await storeSwitch(w, 'deck.master', false)
  await start($)
  const ui = await $.ui.mount(band)
  expect(await ui.find({ type: 'Text', text: 'engine' })).toBeDefined()
  await ui.unmount()
  const below = await $.ui.mount(footer)
  expect(await below.find({ key: 'deck-footer' })).toBeUndefined()
})

test('/mods-deck on from the person turns the master on and starts Deck in this session', async ($, on) => {
  const w = world(on)
  await storeSwitch(w, 'deck.master', false)
  await start($)
  expect((await deck($, 'on')).text).toBe('Deck is on.')
  expect(switchValue(w, 'deck.master')).toBe(true)
  expect((await deck($, 'status')).text).toMatch(/Deck 0\.4\.12/)
})

test('/mods-deck off stops the clock: no tick reads anything after it', async ($, on) => {
  const w = world(on)
  await start($)
  await w.clock.advance(300)
  expect(deckReads(w)).toContain('switch.deck.plans')
  expect((await deck($, 'off')).text).toBe(OFF_TEXT)
  w.reads.length = 0
  await w.clock.advance(1_000)
  expect(deckReads(w)).toEqual([])
})

test('an off stored from another session stops Deck here at its next hook, which reads the master and nothing else', async ($, on) => {
  const w = world(on)
  await start($)
  await storeSwitch(w, 'deck.master', false)
  w.reads.length = 0
  w.trace.length = 0
  await $.tool.call({ tool: 'Read', file_path: '/work/a.ts' } as any)
  expect(w.reads.length).toBeGreaterThan(0)
  expect(w.reads.every((key) => key === MASTER_KEY)).toBe(true)
  expect(w.trace).toEqual([])
  w.reads.length = 0
  await w.clock.advance(1_000)
  expect(deckReads(w)).toEqual([])
})

test('a master off made while Deck loads wins: the start marks nothing and sets no clock', async ($, on) => {
  const w = world(on)
  w.held = { key: 'deck.prefs', ms: 1_000 }
  const starting = start($)
  await w.clock.settle()
  expect(w.reads).toContain('deck.prefs')
  expect((await deck($, 'off')).text).toBe(OFF_TEXT)
  await w.clock.advance(1_000)
  await starting
  w.reads.length = 0
  await w.clock.advance(450)
  expect(deckReads(w)).toEqual([])
  expect((await deck($, 'status')).text).toBe(OFF_STATUS)
})

test('an on after an off made during a start starts Deck again, instead of joining the start the off cancelled', async ($, on) => {
  const w = world(on)
  w.held = { key: 'deck.prefs', ms: 1_000 }
  const starting = start($)
  await w.clock.settle()
  await deck($, 'off')
  w.held = undefined
  expect((await deck($, 'on')).text).toBe('Deck is on.')
  expect((await deck($, 'status')).text).toMatch(/Deck 0\.4\.12/)
  await w.clock.advance(1_000)
  await starting
  expect((await deck($, 'status')).text).toMatch(/Deck 0\.4\.12/)
})

// ---------- a stop made while an entry waits (G13.1: an off function runs nothing, its timers included) ----------

const TODOS = [
  { content: 'Map routes', activeForm: 'Mapping routes', status: 'completed' },
  { content: 'Fix auth', activeForm: 'Fixing auth', status: 'in_progress' },
  { content: 'Report', activeForm: 'Reporting', status: 'pending' },
]

test('a master off made while Deck loads sends no forecast request and judges none of the saved settings', async ($, on) => {
  const w = world(on)
  await storeSwitch(w, 'deck.weather', true)
  w.store.set('deck.prefs', { size: 'huge', city: { name: 'Rome', lat: 41.89193, lon: 12.51133 } })
  w.held = { key: 'deck.prefs', ms: 1_000 }
  const starting = start($)
  await w.clock.settle()
  await deck($, 'off')
  await w.clock.advance(1_000)
  await starting
  await w.clock.settle()
  expect(fetched(w)).toEqual([])
  expect(deckLines(w).filter((line) => line.startsWith('deck: a saved setting was set aside: '))).toEqual([])
})

// The 14th tick is the first to list the agents (upstream's tick, frame % 14), with one agent running.
async function toTheAgentsTick($: any, w: World): Promise<void> {
  await start($)
  await $.agent.spawn({ tool_use_id: 't-a1', prompt: 'go', description: 'explore routes', subagentType: 'Explore', provider: { plugin: 'engine', tier: 'core' } } as any)
  await w.clock.advance(150 * 13)
  expect(w.trace).not.toContain('agent.list')
  // the 14th tick reads the master, then waits on its read of the switches
  w.held = { key: 'switch.deck.plans', ms: 100 }
  await w.clock.advance(150)
}

test('a tick held on its read of the switches lists the agents once the read answers', async ($, on) => {
  on('agent.spawn', () => ({ model: 'sonnet', agentId: 'a1' }))
  const w = world(on)
  await toTheAgentsTick($, w)
  w.held = undefined
  await w.clock.advance(100)
  expect(w.trace).toContain('agent.list')
})

test('a master off made while a tick reads the switches wins: that tick makes no later call', async ($, on) => {
  on('agent.spawn', () => ({ model: 'sonnet', agentId: 'a1' }))
  const w = world(on)
  await toTheAgentsTick($, w)
  w.held = undefined
  await deck($, 'off')
  await w.clock.advance(100)
  expect(w.trace).not.toContain('agent.list')
})

test('a stop made before a held permission prompt reaches its delay leaves the bar as it was', async ($, on) => {
  const w = world(on)
  w.checkDecision = 'ask'
  await start($)
  await $.tool.call({ tool: 'TodoWrite', todos: TODOS } as any)
  await $.tool.check({ tool: 'Bash', input: { command: 'rm -rf build' } } as any)
  await deck($, 'off')
  await deck($, 'on')
  await w.clock.advance(800)
  expect((await deck($, 'status')).text).toMatch(/^● Tasks — Fixing auth 2\/3/m)
})

test('an off removes the demo with its sample bar and route: an on after it shows neither', async ($, on) => {
  const w = world(on)
  await start($)
  await deck($, 'demo')
  const before = (await deck($, 'status')).text
  expect(before).toMatch(/Orders module/)
  expect(before).toMatch(/⇄ Model route/)
  await deck($, 'off')
  await deck($, 'on')
  const after = (await deck($, 'status')).text
  expect(after).not.toMatch(/Orders module/)
  expect(after).not.toMatch(/⇄ Model route/)
})

const failures = (w: World, which: string): string[] => deckLines(w).filter((line) => line.startsWith(`deck: the ${which} failed: `))

test('a fold frame that cannot read the switches ends the fold: one failure line, and no frame after it', async ($, on) => {
  const w = world(on)
  await start($)
  await w.clock.advance(150)
  await deck($, 'expand')
  w.refusedReads.set('switch.deck.plans', 'the store is locked')
  await w.clock.advance(33 * 10)
  expect(failures(w, 'fold frame')).toHaveLength(1)
})

test('a run of failed clock ticks is set aside once in the debug log, and again after a tick that succeeds', async ($, on) => {
  const w = world(on)
  await start($)
  w.refusedReads.set('switch.deck.plans', 'the store is locked')
  await w.clock.advance(150 * 5)
  expect(failures(w, 'clock tick')).toHaveLength(1)
  w.refusedReads.delete('switch.deck.plans')
  await w.clock.advance(150)
  w.refusedReads.set('switch.deck.plans', 'the store is locked')
  await w.clock.advance(150 * 3)
  expect(failures(w, 'clock tick')).toHaveLength(2)
})

// ---------- one session at a time (R7) ----------

test('an on made in another session leaves this one unstarted until /mods-deck on starts it here', async ($, on) => {
  const w = world(on)
  await storeSwitch(w, 'deck.master', false)
  await start($)
  await storeSwitch(w, 'deck.master', true, 60_000)
  expect((await deck($, 'status')).text).toBe(NOT_STARTED_TEXT)
  w.trace.length = 0
  await $.tool.call({ tool: 'Read', file_path: '/work/a.ts' } as any)
  expect(w.trace).not.toContain('session.id')
  expect((await deck($, 'on')).text).toBe('Deck is on.')
  expect((await deck($, 'status')).text).toMatch(/Deck 0\.4\.12/)
})

test('two ons at once load Deck once: the second joins the start still running', async ($, on) => {
  const w = world(on)
  await storeSwitch(w, 'deck.master', false)
  await start($)
  w.held = { key: 'deck.prefs', ms: 500 }
  const first = deck($, 'on')
  const second = deck($, 'on')
  await w.clock.settle()
  await w.clock.advance(500)
  expect([(await first).text, (await second).text]).toEqual(['Deck is on.', 'Deck is on.'])
  expect(w.reads.filter((key) => key === 'deck.prefs')).toHaveLength(1)
})

test('a session start in a session Deck runs in loads Deck again, as upstream did at every start', async ($, on) => {
  const w = world(on)
  await start($)
  expect(w.reads.filter((key) => key === 'deck.prefs')).toHaveLength(1)
  await start($)
  expect(w.reads.filter((key) => key === 'deck.prefs')).toHaveLength(2)
})

test('a refused /mods-deck registration fails the start, masked in the log; /mods-deck says so until a start succeeds', async ($, on) => {
  const w = world(on)
  w.refuseRegister = 'no room under /home/tester/commands'
  await start($)
  const failed = deckLines(w).filter((line) => line.startsWith('deck: start failed: '))
  expect(failed).toHaveLength(1)
  expect(failed[0]).toContain('~/commands')
  expect(failed[0]).not.toContain('/home/tester')
  expect((await deck($, 'status')).text).toBe(START_FAILED_TEXT)
  expect((await deck($, 'on')).text).toBe('Deck is on.')
  expect((await deck($, 'status')).text).toMatch(/Deck 0\.4\.12/)
})

test('a home folder with a control character in it is still masked in the start failure line', async ($, on) => {
  const w = world(on)
  w.home = '/srv/te\u0007ster'
  w.refuseRegister = `no room under ${w.home}/commands`
  await start($)
  const [failed] = deckLines(w).filter((line) => line.startsWith('deck: start failed: '))
  expect(failed).toContain('no room under ~/commands')
  expect(failed).not.toContain('/srv')
})

// ---------- a /clear or a resume (R3; ruling Q3, L: the new session id takes the half the ended one left) ----------

for (const reason of ['clear', 'resume']) {
  test(`after a ${reason}, Deck runs on in the new session id: its first hook takes the half, and a todo list draws the band`, async ($, on) => {
    const w = world(on)
    await start($)
    await endAndMove($, w, reason, 'session-2')
    await $.tool.call({ tool: 'TodoWrite', todos: TODOS } as any)
    const ui = await $.ui.mount(band)
    expect(await ui.find({ key: 'deck-toggle' })).toBeDefined()
    // the bar the hook made in the new id, after the clear emptied the old ones
    expect((await deck($, 'status')).text).toMatch(/^● Tasks — Fixing auth 2\/3/m)
    // the half is taken once: a later session with no Deck state does not take it again, and no band draws there
    await ui.unmount()
    w.session = 'session-3'
    const other = await $.ui.mount(band)
    expect(await other.find({ key: 'deck-toggle' })).toBeUndefined()
    await other.unmount()
    expect((await deck($, 'status')).text).toBe(NOT_STARTED_TEXT)
  })
}

test('a start that failed before a /clear still says so in the new session id, not that Deck runs elsewhere', async ($, on) => {
  const w = world(on)
  w.refuseRegister = 'no room'
  await start($)
  w.refuseRegister = undefined
  await endAndMove($, w, 'clear', 'session-2')
  expect((await deck($, 'status')).text).toBe(START_FAILED_TEXT)
})

test('an exit carries nothing: a session id after it is not started', async ($, on) => {
  const w = world(on)
  await start($)
  await endAndMove($, w, 'prompt_input_exit', 'session-2')
  expect((await deck($, 'status')).text).toBe(NOT_STARTED_TEXT)
})

test('a master off read between a /clear and the first hook of the new id drops the half: an on from outside leaves the new id unstarted', async ($, on) => {
  const w = world(on)
  await start($)
  await endAndMove($, w, 'clear', 'session-2')
  await storeSwitch(w, 'deck.master', false)
  await $.tool.call({ tool: 'Read', file_path: '/work/a.ts' } as any)
  await storeSwitch(w, 'deck.master', true, 60_000)
  expect((await deck($, 'status')).text).toBe(NOT_STARTED_TEXT)
})

test('a session start in another session leaves the half to the new id of the cleared one', async ($, on) => {
  const w = world(on)
  await start($)
  await endAndMove($, w, 'clear', 'session-2')
  // no session start comes from the cleared session (index.d.ts:4529-4530), so one here is another session's
  w.session = 'session-3'
  await start($)
  w.session = 'session-2'
  expect((await deck($, 'status')).text).toMatch(/Deck 0\.4\.12/)
})

test('the end of a session Deck never started leaves the half to the session that goes on', async ($, on) => {
  const w = world(on)
  await start($)
  await endAndMove($, w, 'clear', 'session-2')
  await endAndMove($, w, 'resume', 'session-3')
  expect((await deck($, 'status')).text).toMatch(/Deck 0\.4\.12/)
})

test('a hook in a session Deck already runs in leaves the half to a session with no Deck state', async ($, on) => {
  const w = world(on)
  w.session = 'session-2'
  await start($)
  w.session = 'session-1'
  await start($)
  await endAndMove($, w, 'clear', 'session-3')
  w.session = 'session-2'
  await $.tool.call({ tool: 'Read', file_path: '/work/a.ts' } as any)
  w.session = 'session-3'
  expect((await deck($, 'status')).text).toMatch(/Deck 0\.4\.12/)
})

test('a hook in a session whose own start failed keeps its notice and leaves the half to a session with no Deck state', async ($, on) => {
  const w = world(on)
  w.session = 'session-2'
  w.refuseRegister = 'no room'
  await start($)
  w.refuseRegister = undefined
  w.session = 'session-1'
  await start($)
  await endAndMove($, w, 'clear', 'session-3')
  w.session = 'session-2'
  expect((await deck($, 'status')).text).toBe(START_FAILED_TEXT)
  w.session = 'session-3'
  expect((await deck($, 'status')).text).toMatch(/Deck 0\.4\.12/)
})

test('a failed start carried by a /clear is taken by the first hook of the new id while Deck runs in no session', async ($, on) => {
  const w = world(on)
  w.refuseRegister = 'no room'
  await start($)
  w.refuseRegister = undefined
  // A draw while Deck runs in no session asks for the session id as often with a half waiting as with none: a draw is
  // passive. Both draws are in the new id, which the process answers before the session.end of the clear, so the half
  // is their only difference; calls of other mods count the same in both.
  const idsAtDraw = async (): Promise<number> => {
    w.trace.length = 0
    await (await $.ui.mount(band)).unmount()
    return w.trace.filter((call) => call === 'session.id').length
  }
  w.session = 'session-2'
  const before = await idsAtDraw()
  await $.session.end({ reason: 'clear', sessionId: 'session-1', resume: { id: 'session-1' } } as any)
  expect(await idsAtDraw()).toBe(before)
  await $.tool.call({ tool: 'Read', file_path: '/work/a.ts' } as any)
  // the hook took the half: a later new id finds none
  w.session = 'session-3'
  expect((await deck($, 'status')).text).toBe(NOT_STARTED_TEXT)
  w.session = 'session-2'
  expect((await deck($, 'status')).text).toBe(START_FAILED_TEXT)
})

test('a session Deck never started and the gate already judged does not take the half at its next Deck call', async ($, on) => {
  const w = world(on)
  await start($)
  w.session = 'session-2'
  await $.tool.call({ tool: 'Read', file_path: '/work/a.ts' } as any)
  w.session = 'session-1'
  await endAndMove($, w, 'clear', 'session-3')
  w.session = 'session-2'
  await $.tool.call({ tool: 'Read', file_path: '/work/a.ts' } as any)
  expect((await deck($, 'status')).text).toBe(NOT_STARTED_TEXT)
  w.session = 'session-3'
  expect((await deck($, 'status')).text).toMatch(/Deck 0\.4\.12/)
})

test('/mods-deck on in the new id takes the half with no second load, and leaves none for another session', async ($, on) => {
  const w = world(on)
  await start($)
  await endAndMove($, w, 'clear', 'session-2')
  expect((await deck($, 'on')).text).toBe('Deck is on.')
  expect(w.reads.filter((key) => key === 'deck.prefs')).toHaveLength(1)
  w.session = 'session-3'
  expect((await deck($, 'status')).text).toBe(NOT_STARTED_TEXT)
})

// A router whose status and log lines come with a usage measure, an event Deck reads passively: on a prompt they would
// come with a Deck call, which judges the session. Literal lines, as the kit carries no closure into a test plugin.
const routerOnMeasure = {
  name: 'jev-model-router',
  register(on: any) {
    on('session.measure', async ($: any, e: any, next: any) => {
      await $.ui.status('jev · fast 0.87 → low')
      await $.ui.log('[jev-model-router] jev: tier fast (0.87)')
      return next(e)
    })
  },
}

test('draws and events Claude Code raises on its own, for the new id before the session.end of the clear, leave it able to take the half', { plugins: [routerOnMeasure] }, async ($, on) => {
  const w = world(on)
  await start($)
  // the process already answers the new id while the session.end of the old one has not run yet
  w.session = 'session-2'
  for (const site of [band, footer, picker]) await (await $.ui.mount(site)).unmount()
  // a measure, and the router lines it brings, settled before the session.end
  await $.session.measure({ context: { tokens: 1, window: 10, percent: 10 }, rateLimits: [], changed: ['context'] } as any)
  await w.clock.settle()
  await $.session.end({ reason: 'clear', sessionId: 'session-1', resume: { id: 'session-1' } } as any)
  await $.tool.call({ tool: 'TodoWrite', todos: TODOS } as any)
  expect((await deck($, 'status')).text).toMatch(/^● Tasks — Fixing auth 2\/3/m)
  // the router lines reach Deck: once the half is taken, the next measure brings them into the route row
  await $.session.measure({ context: { tokens: 1, window: 10, percent: 10 }, rateLimits: [], changed: ['context'] } as any)
  await w.clock.settle()
  expect((await deck($, 'status')).text).toMatch(/jev fast 0\.87/)
})

test('events a subagent raises for the new id before the session.end of the clear leave it able to take the half', async ($, on) => {
  on('agent.spawn', () => ({ model: 'sonnet', agentId: 'bg-2' }))
  on('classic.Stop', () => ({}))
  on('classic.SubagentStop', () => ({}))
  on('classic.TaskCreated', () => ({}))
  on('classic.TaskCompleted', () => ({}))
  const w = world(on)
  await start($)
  // a background agent works on while the process already answers the new id
  w.session = 'session-2'
  const agent = { agentId: 'bg-1' }
  await $.turn.start({ text: 'go', turnId: 'tb', ...agent } as any)
  await $.tool.call({ tool: 'Read', file_path: '/work/a.ts', ...agent } as any)
  await $.agent.spawn({ tool_use_id: 't-bg-2', prompt: 'go', description: 'nested', subagentType: 'Explore', provider: { plugin: 'engine', tier: 'core' }, parentAgentId: 'bg-1' } as any)
  await $.turn.complete({ turnId: 'tb', answer: 'ok', durationMs: 5, isAborted: false, reason: 'answer', usage: null, ...agent } as any)
  await $.classic.TaskCreated({ task_id: 'k1', task_subject: 'x', agent_id: 'bg-1' } as any)
  await $.classic.TaskCompleted({ task_id: 'k1', agent_id: 'bg-1' } as any)
  await $.classic.CwdChanged({ old_cwd: '/work', new_cwd: '/work', agent_id: 'bg-1' } as any)
  await $.classic.Stop({ last_assistant_message: 'done', agent_id: 'bg-1' } as any)
  await $.classic.SubagentStop({ agent_id: 'bg-1' } as any)
  await $.session.end({ reason: 'clear', sessionId: 'session-1', resume: { id: 'session-1' } } as any)
  await $.tool.call({ tool: 'TodoWrite', todos: TODOS } as any)
  expect((await deck($, 'status')).text).toMatch(/^● Tasks — Fixing auth 2\/3/m)
})

test('a session id that ended and comes back through a resume takes the half at its first Deck call', async ($, on) => {
  const w = world(on)
  await start($)
  w.session = 'session-2'
  await $.tool.call({ tool: 'Read', file_path: '/work/a.ts' } as any)
  // session-2, judged unstarted above, ends: the gate forgets it, and session-1 then resumes into it
  await endAndMove($, w, 'other', 'session-1')
  await endAndMove($, w, 'resume', 'session-2')
  await $.tool.call({ tool: 'TodoWrite', todos: TODOS } as any)
  expect((await deck($, 'status')).text).toMatch(/^● Tasks — Fixing auth 2\/3/m)
})

test('a /clear of a session Deck never ran in leaves the bars of the session Deck runs in', async ($, on) => {
  const w = world(on)
  await start($)
  await $.tool.call({ tool: 'TodoWrite', todos: TODOS } as any)
  w.session = 'session-9'
  await endAndMove($, w, 'clear', 'session-10')
  w.session = 'session-1'
  expect((await deck($, 'status')).text).toMatch(/^● Tasks — Fixing auth 2\/3/m)
})

test('a session whose own start still loads does not take the half a /clear in another session left', async ($, on) => {
  const w = world(on)
  await start($)
  w.session = 'session-2'
  w.held = { key: 'deck.prefs', ms: 1_000 }
  const loading = deck($, 'on')
  await w.clock.settle()
  w.session = 'session-1'
  await endAndMove($, w, 'clear', 'session-3')
  w.session = 'session-2'
  await $.tool.call({ tool: 'Read', file_path: '/work/a.ts' } as any)
  w.held = undefined
  await w.clock.advance(1_000)
  expect((await loading).text).toBe('Deck is on.')
  w.session = 'session-3'
  expect((await deck($, 'status')).text).toMatch(/Deck 0\.4\.12/)
})

test('a session that ends while a start retried after a failure still loads carries nothing: the new id is not started', async ($, on) => {
  const w = world(on)
  w.refuseRegister = 'no room'
  await start($)
  w.refuseRegister = undefined
  w.held = { key: 'deck.prefs', ms: 1_000 }
  const retry = deck($, 'on')
  await w.clock.settle()
  await endAndMove($, w, 'clear', 'session-2')
  w.held = undefined
  expect((await deck($, 'status')).text).toBe(NOT_STARTED_TEXT)
  await w.clock.advance(1_000)
  expect((await retry).text).toBe('Deck is on.')
})

// ---------- the city and the weather: the person only (R8 final) ----------

for (const kind of ['composer', 'sdk', 'bridge']) {
  test(`/mods-deck city from a ${kind} origin writes the weather switch, then asks the geocoder, and sends 2 decimals`, async ($, on) => {
    const w = world(on)
    await start($)
    w.trace.length = 0
    expect((await deck($, 'city Rome', kind)).text).toBe('Weather city set to Rome, Italy.')
    const written = w.trace.indexOf('store.set:switch.deck.weather')
    const asked = w.trace.findIndex((call) => call.startsWith(`http.fetch:${GEOCODER}`))
    expect(written).toBeGreaterThanOrEqual(0)
    expect(asked).toBeGreaterThan(written)
    expect(fetched(w).find((call) => call.startsWith(`http.fetch:${FORECAST}`))).toContain('latitude=41.89&longitude=12.51&')
    expect(switchValue(w, 'deck.weather')).toBe(true)
  })
}

// No origin at all cannot be sent through the kit (it stamps one); the command maps a missing kind to '' (register.js,
// byOf(e.origin?.kind ?? '')), and '' is the agent's.
test('a missing origin kind is the agent\'s', () => {
  expect(byOf('')).toBe('agent')
})

for (const kind of ['plugin', 'peer', 'channel', 'task-notification']) {
  test(`/mods-deck city from a ${kind} origin sends nothing and stores nothing`, async ($, on) => {
    const w = world(on)
    await start($)
    w.trace.length = 0
    expect((await deck($, 'city Rome', kind)).text).toBe(CITY_PERSON_ONLY)
    expect(fetched(w)).toEqual([])
    expect(w.trace).not.toContain('store.set:switch.deck.weather')
    expect((w.store.get('deck.prefs') as { city?: unknown } | undefined)?.city ?? null).toBeNull()
  })
}

test('from an agent origin, weather on is refused, all on leaves the weather as it is, and weather off is written', async ($, on) => {
  const w = world(on)
  await start($)
  expect((await deck($, 'weather on', 'plugin')).text).toBe(WEATHER_PERSON_ONLY)
  expect(w.store.has('switch.deck.weather')).toBe(false)
  expect((await deck($, 'all on', 'plugin')).text).toBe(ALL_BUT_WEATHER)
  expect(w.store.has('switch.deck.weather')).toBe(false)
  for (const section of SECTIONS.filter((each) => each !== 'weather')) expect(switchValue(w, `deck.${section}`)).toBe(true)
  await deck($, 'weather on')
  expect(switchValue(w, 'deck.weather')).toBe(true)
  await deck($, 'weather off', 'plugin')
  expect(switchValue(w, 'deck.weather')).toBe(false)
})

test('a city name over 100 characters is refused before anything is written or sent', async ($, on) => {
  const w = world(on)
  await start($)
  w.trace.length = 0
  expect((await deck($, 'city ' + 'x'.repeat(101))).text).toBe('A city name has 1 to 100 characters.')
  expect(fetched(w)).toEqual([])
  expect(w.trace).not.toContain('store.set:switch.deck.weather')
})

test('a geocoder answer with coordinates out of range sets no city and sends no forecast request', async ($, on) => {
  const w = world(on)
  w.geocoded = { results: [{ name: 'Atlantis', latitude: 91, longitude: 12 }] }
  await start($)
  w.trace.length = 0
  expect((await deck($, 'city Atlantis')).text).toBe('The place found for "Atlantis" has no usable name or coordinates.')
  expect(fetched(w).filter((call) => call.startsWith(`http.fetch:${FORECAST}`))).toEqual([])
  expect((w.store.get('deck.prefs') as { city?: unknown }).city ?? null).toBeNull()
  expect(deckLines(w)).toContain('deck: the geocoder answered a place with no usable name or coordinates')
  // the lookup found no usable place: the weather switch is back as it was, off
  expect(switchValue(w, 'deck.weather')).toBe(false)
})

test('a city lookup that finds nothing leaves the weather switch as it was before the command, off or on', async ($, on) => {
  const w = world(on)
  w.geocoded = { results: [] }
  await start($)
  expect((await deck($, 'city Nowhere')).text).toBe('No city found for "Nowhere".')
  expect(switchValue(w, 'deck.weather')).toBe(false)
  await storeSwitch(w, 'deck.weather', true)
  expect((await deck($, 'city Nowhere')).text).toBe('No city found for "Nowhere".')
  expect(switchValue(w, 'deck.weather')).toBe(true)
})

// ---------- saved settings checked before use (A3) ----------

test('saved settings that fail their checks fall back to the defaults, each set aside in the debug log', async ($, on) => {
  const w = world(on)
  w.store.set('deck.prefs', { style: { terminal: 'constructor', desktop: 42 }, size: 'huge', collapsed: 'chips', open: 'yes' })
  await start($)
  expect((await deck($, 'status')).text).toMatch(/style solid \(CLI\) \/ pixel \(Desktop\)/)
  expect(deckLines(w)).toEqual([
    'deck: a saved setting was set aside: the CLI style is not one of segments, line, solid, dots, pixel, spark',
    'deck: a saved setting was set aside: the Desktop style is not one of pixel, segments, line, solid, dots, spark',
    'deck: a saved setting was set aside: the size is not one of compact, roomy',
    'deck: a saved setting was set aside: the open state is not true or false',
  ])
})

test('saved settings that are not an object are set aside whole', async ($, on) => {
  const w = world(on)
  w.store.set('deck.prefs', 'open')
  await start($)
  expect(deckLines(w)).toEqual(['deck: a saved setting was set aside: the saved settings are not an object'])
})

for (const city of [
  { name: 'Nowhere', lat: Number.NaN, lon: 1 },
  { name: 'Nowhere', lat: 1, lon: Number.POSITIVE_INFINITY },
  { name: '\n\t', lat: 1, lon: 1 },
]) {
  test(`a saved city with ${JSON.stringify(city)} is never sent, and the header asks for a city`, async ($, on) => {
    const w = world(on)
    await storeSwitch(w, 'deck.weather', true)
    w.store.set('deck.prefs', { open: true, city })
    await start($)
    await w.clock.advance(300)
    expect(fetched(w)).toEqual([])
    expect(deckLines(w)).toContain('deck: a saved setting was set aside: the city has no usable name or coordinates')
    const ui = await $.ui.mount(band)
    expect(await ui.find({ type: 'Text', text: /set a city: \/mods-deck city <name>/ })).toBeDefined()
  })
}

test('a city rejected at one load is judged again at the next: a later load with no city stops asking for one', async ($, on) => {
  const w = world(on)
  await storeSwitch(w, 'deck.weather', true)
  w.store.set('deck.prefs', { open: true, city: { name: 'Nowhere', lat: Number.NaN, lon: 1 } })
  await start($)
  const first = await $.ui.mount(band)
  expect(await first.find({ type: 'Text', text: /set a city: \/mods-deck city <name>/ })).toBeDefined()
  await first.unmount()
  w.store.set('deck.prefs', { open: true })
  await start($)
  const second = await $.ui.mount(band)
  expect(await second.find({ type: 'Text', text: /set a city/ })).toBeUndefined()
})

test('a saved city goes out at 2 decimals at load while the weather switch is on, and not at all while it is off', async ($, on) => {
  const w = world(on)
  w.store.set('deck.prefs', { city: { name: 'Rome', lat: 41.89193, lon: 12.51133 } })
  await start($)
  await w.clock.advance(300)
  expect(fetched(w)).toEqual([])
  await storeSwitch(w, 'deck.weather', true)
  await start($)
  await w.clock.settle()
  expect(fetched(w)).toEqual([`http.fetch:${FORECAST}v1/forecast?latitude=41.89&longitude=12.51&current=temperature_2m,weather_code`])
})

// ---------- the switches read at each use, never a copy (the no-copy ruling) ----------

test('an off stored from outside is seen by the next draw, with no tick or hook between', async ($, on) => {
  const w = world(on)
  await start($)
  const before = await $.ui.mount(band)
  expect(await before.find({ type: 'Text', text: /^5h 31% ↻/ })).toBeDefined()
  await before.unmount()
  await storeSwitch(w, 'deck.limits', false)
  const after = await $.ui.mount(band)
  expect(await after.find({ type: 'Text', text: /^5h 31% ↻/ })).toBeUndefined()
})

test('an off stored from outside is seen by the next tick, with no hook between', async ($, on) => {
  const w = world(on)
  await start($)
  await deck($, 'demo')
  await w.clock.advance(1_400 * 3)
  expect(w.sounds.length).toBeGreaterThan(0)
  await storeSwitch(w, 'deck.sound', false)
  w.sounds.length = 0
  await w.clock.advance(1_400 * 4)
  expect(w.sounds).toEqual([])
})

test('a fold frame reads the switches before it counts the rows, between two ticks', async ($, on) => {
  const w = world(on)
  await start($)
  await w.clock.advance(150)
  await deck($, 'expand')
  w.reads.length = 0
  // 33 ms: one fold frame and no clock tick (every 150 ms)
  await w.clock.advance(33)
  expect(w.reads).toContain('switch.deck.plans')
})

test('each prefs switch lands in its own field, whatever the order of the list', () => {
  const field = (id: string): string =>
    ({ [AUTO]: 'auto', [SOUND]: 'sound', [QUIET]: 'quiet', [SPEND]: 'cost', [ANIMATION]: 'animate' })[id] ?? `show.${id.slice('deck.'.length)}`
  // + 5: the prefs switches that are not a section: auto, sound, quiet, cost, and the animation switch (TRDD-INFES3JE C).
  // The count must follow the list, or a switch added without a field of its own would pass unnoticed.
  expect(new Set(PREF_SWITCHES.map(({ id }) => id)).size).toBe(SECTIONS.length + 5)
  expect(PREF_SWITCHES.map(({ id }) => id)).toEqual(expect.arrayContaining(SECTIONS.map(sectionSwitch)))
  PREF_SWITCHES.forEach(({ id }, index) => {
    const prefs: Governed = { show: {}, auto: false, sound: false, quiet: false, cost: false, animate: false }
    applySwitches(prefs, PREF_SWITCHES.map((_, each) => each === index))
    const on = [...Object.entries(prefs.show).filter(([, v]) => v).map(([k]) => `show.${k}`), ...(['auto', 'sound', 'quiet', 'cost', 'animate'] as const).filter((k) => prefs[k])]
    expect(on).toEqual([field(id)])
  })
})

// ---------- the router lines (R5) ----------

// A plugin that puts a status line up on every prompt, as jev-model-router does; Deck reads only router lines.
// The kit loads a test plugin's register on its own, so each line is written into its plugin (a closure is not carried).
const routerStatus = {
  name: 'jev-model-router',
  register(on: any) {
    on('prompt.submit', async ($: any, e: any, next: any) => {
      $.ui.status('jev · fast 0.87 → low')
      return next(e)
    })
  },
}
const otherStatus = {
  name: 'jev-model-router',
  register(on: any) {
    on('prompt.submit', async ($: any, e: any, next: any) => {
      $.ui.status('saving the file')
      return next(e)
    })
  },
}
const quietReads = (w: World): number => w.reads.filter((key) => key === 'switch.deck.quiet-router').length

test('a status line that is no router line costs Deck no read', { plugins: [otherStatus] }, async ($, on) => {
  const w = world(on)
  await start($)
  w.reads.length = 0
  await $.prompt.submit({ text: 'rename a variable', wait: false, origin: { kind: 'composer' } } as any)
  // the plugin raises its status line without waiting for it: settle lets that event run before the reads are counted
  await w.clock.settle()
  expect(w.prompts).toEqual(['rename a variable'])
  expect(quietReads(w)).toBe(0)
})

test('a router status line is read by Deck', { plugins: [routerStatus] }, async ($, on) => {
  const w = world(on)
  await start($)
  w.reads.length = 0
  await $.prompt.submit({ text: 'rename a variable', wait: false, origin: { kind: 'composer' } } as any)
  // the plugin raises its status line without waiting for it: settle lets that event run before the reads are counted
  await w.clock.settle()
  expect(quietReads(w)).toBeGreaterThan(0)
})

test('a router line whose hook throws passes on unchanged, set aside in the debug log', { plugins: [routerStatus] }, async ($, on) => {
  const w = world(on)
  await start($)
  w.refusedReads.set('switch.deck.quiet-router', 'the store is locked')
  await $.prompt.submit({ text: 'rename a variable', wait: false, origin: { kind: 'composer' } } as any)
  // the plugin raises its status line without waiting for it: settle lets that event run before the reads are counted
  await w.clock.settle()
  expect(w.prompts).toEqual(['rename a variable'])
  expect(deckLines(w).filter((each) => each.startsWith('deck: a router status line passed on unchanged after a failure: '))).toHaveLength(1)
})

// ---------- the prompt.submit dispatcher (ruling 8 as amended) ----------

test('the engine\'s answer beneath the dispatcher throws: the prompt went on exactly once, and the failure is not logged as the dispatcher\'s', async ($, on) => {
  const w = world(on)
  await start($)
  w.promptFails = true
  let rejected = false
  await $.prompt.submit({ text: 'Fix the login bug', wait: false, origin: { kind: 'composer' } } as any).catch(() => {
    rejected = true
  })
  expect(w.prompts).toEqual(['Fix the login bug'])
  expect(rejected).toBe(true)
  expect(w.logs.filter((line) => line.startsWith('prompt.submit observers:'))).toEqual([])
})

test('Tokensaver\'s router failing leaves Deck observing the prompt, which went on once', async ($, on) => {
  const w = world(on)
  await start($)
  // The router's first step reads Tokensaver's master; refused, the router throws out of the shared prompt.submit hook,
  // after Deck observed, and the hook's catch passes the prompt on.
  w.refusedReads.set('switch.tokensaver.master', 'the store is locked')
  await $.prompt.submit({ text: 'Fix the login bug', wait: false, origin: { kind: 'composer' } } as any)
  expect(w.prompts).toEqual(['Fix the login bug'])
  expect(w.logs.filter((line) => line.startsWith('prompt.submit observers: the hook failed: '))).toHaveLength(1)
  await $.turn.start({ text: 'Fix the login bug', turnId: 't1' } as any)
  await $.tool.call({ tool: 'Read', file_path: '/src/auth.ts' } as any)
  expect((await deck($, 'status')).text).toMatch(/Fix the login bug/)
})

test('Deck\'s observer failing leaves Tokensaver\'s router running on the prompt, which went on once', async ($, on) => {
  const w = world(on)
  await start($)
  w.refusedReads.set(MASTER_KEY, 'the store is locked')
  w.reads.length = 0
  await $.prompt.submit({ text: 'Fix the login bug', wait: false, origin: { kind: 'composer' } } as any)
  expect(w.prompts).toEqual(['Fix the login bug'])
  expect(deckLines(w).filter((line) => line.startsWith('deck: a sent message could not be read: '))).toHaveLength(1)
  // The router's first step is the read of Tokensaver's master: it ran after Deck failed, and the hook did not fail.
  expect(w.reads).toContain('switch.tokensaver.master')
  expect(w.logs.filter((line) => line.startsWith('prompt.submit observers:'))).toEqual([])
})

// ---------- a function's own switch ----------

test('with the footer switch off, no footer button draws, and a press on one drawn before does nothing', async ($, on) => {
  const w = world(on)
  await start($)
  const drawn = await $.ui.mount(footer)
  expect(await drawn.find({ key: 'deck-footer' })).toBeDefined()
  await storeSwitch(w, 'deck.footer', false)
  w.trace.length = 0
  await drawn.press({ key: 'deck-footer' })
  expect(w.trace).not.toContain('store.set:deck.prefs')
  await drawn.unmount()
  const again = await $.ui.mount(footer)
  expect(await again.find({ key: 'deck-footer' })).toBeUndefined()
})

test('with the band switch off, a press on the band\'s toggle drawn before does nothing', async ($, on) => {
  const w = world(on)
  await start($)
  const drawn = await $.ui.mount(band)
  // control: with the switch on, a press opens or closes the band and saves the open state
  await drawn.press({ key: 'deck-toggle' })
  expect(w.trace).toContain('store.set:deck.prefs')
  await storeSwitch(w, 'deck.band', false)
  w.trace.length = 0
  await drawn.press({ key: 'deck-toggle' })
  expect(w.trace).not.toContain('store.set:deck.prefs')
})

test('with the panel, style picker or demo switch off, its command names the switch to turn on and opens nothing', async ($, on) => {
  const w = world(on)
  await start($)
  for (const [args, id, what] of [
    ['panel', 'deck.panel', 'The Deck panel'],
    ['style', 'deck.style-picker', 'The Deck style picker'],
    ['demo', 'deck.demo', 'The Deck demo'],
  ] as const) {
    await storeSwitch(w, id, false)
    expect((await deck($, args)).text).toBe(`${what} is off: turn on ${id} in the switches pane (/mods-switches).`)
  }
  expect((await deck($, 'status')).text).not.toMatch(/Orders module/)
})
