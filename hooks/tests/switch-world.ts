// The engine as the switch and debug-log tests see it (TRDD-5IK59SQ2, TRDD-RWD5PW76): every call the plugin's mods
// make on $ while a session starts, runs a command or calls a tool, answered by a stub that records it. Shared by
// switches.test.ts and debug-log.test.ts, so neither copies the other's stubs.
import { mock, type MockClock } from 'claude-code/testing'

import { envelopeOf } from '../switches/logic'
import { engineAnswers } from './engine-answers'
import { seedMasters, type StoreRead } from './masters'

export const PLUGIN = 'mods-expert-developer-plugin'
export const TOOL = `mcp__${PLUGIN}__switches`
export const HOME = '/home/tester'
export const keyFor = (id: string): string => `switch.${id}`

export type World = {
  clock: MockClock
  store: Map<string, unknown>
  /** Every call the mods made on $ that a stub below answers, in order. */
  calls: string[]
  toasts: string[]
  logs: string[]
  /** The store reads and the log lines, in the order the mods made them: what an event did after its log line. */
  trace: string[]
  /** Where each $.ui.log line went, beside `logs`: `debug` for the debug log, else the sink the mod named. */
  logSinks: string[]
  opened: string[]
  writes: string[]
  /** What each written file holds; $.fs.exists and $.fs.read answer from it. */
  files: Map<string, string>
  /** A command or a write this returns a reason for is refused with that reason. */
  refuseCommand: (name: string) => string | undefined
  refuseWrite: (path: string) => string | undefined
  /** How long, on the clock, a read under the plugin's data folder waits before it answers; 0 answers at once. */
  readsWait: number
  session: string
  /** What $.env.get answers, by name: HOME alone unless a test sets more. */
  env: Record<string, string | undefined>
  /** When set, every $.env.get is refused with this reason. */
  envRefused: string | undefined
  /** When set, every $.store.get is refused with this reason (M4c item 2), the seeded masters' reads included. */
  storeRefused: string | undefined
}

export function world(on: any, store: Record<string, unknown> = {}): World {
  const w: World = {
    clock: mock.clock(on, { now: 10_000 }),
    store: new Map(Object.entries(store)),
    calls: [],
    toasts: [],
    logs: [],
    trace: [],
    logSinks: [],
    opened: [],
    writes: [],
    files: new Map(),
    refuseCommand: () => undefined,
    refuseWrite: () => undefined,
    readsWait: 0,
    session: 'sess-1',
    env: { HOME },
    envRefused: undefined,
    storeRefused: undefined,
  }
  const answer = (name: string, value: (e: any) => unknown) =>
    on(name, ($: any, e: any) => {
      w.calls.push(name)
      return { value: value(e) }
    })
  // A master switch this world does not own reads as off (./masters.ts), through the same answer as every other key.
  const storeRead: StoreRead = (key) =>
    w.storeRefused !== undefined ? { deny: w.storeRefused } : w.store.has(key) ? { value: w.store.get(key) } : undefined
  seedMasters(on, { read: storeRead })
  on('store.get', ($: any, e: any) => {
    w.calls.push('store.get')
    w.trace.push(`store.get:${e.key}`)
    return storeRead(e.key) ?? { value: undefined }
  })
  answer('store.set', (e) => void w.store.set(e.key, e.value))
  answer('store.delete', (e) => void w.store.delete(e.key))
  answer('tool.register', (e) => ({ tool: `mcp__${PLUGIN}__${e.name}` }))
  on('command.register', ($: any, e: any) => {
    w.calls.push('command.register')
    const refused = w.refuseCommand(e.name)
    return refused === undefined ? { value: { command: e.name } } : { deny: refused }
  })
  answer('session.id', () => w.session)
  answer('session.root', () => '/work')
  answer('session.repo', () => null)
  on('env.get', ($: any, e: any) => {
    w.calls.push('env.get')
    return w.envRefused === undefined ? { value: w.env[e.name] } : { deny: w.envRefused }
  })
  answer('fs.exists', (e) => w.files.has(e.path))
  // A read under the plugin's data folder takes the file as it is when the read starts and answers readsWait later on
  // the clock, so a test can raise a second event, and let it read, while the first is still reading its log file.
  on('fs.read', async ($: any, e: any) => {
    w.calls.push('fs.read')
    const text = w.files.get(e.path)
    if (w.readsWait > 0 && String(e.path).includes('/plugins/data/')) await w.clock.sleep(w.readsWait)
    return { value: text }
  })
  answer('fs.list', () => [])
  on('fs.write', ($: any, e: any) => {
    w.calls.push('fs.write')
    const refused = w.refuseWrite(e.path)
    if (refused !== undefined) return { deny: refused }
    w.writes.push(e.path)
    w.files.set(e.path, e.text)
    return { value: undefined }
  })
  answer('ui.toast', (e) => void w.toasts.push(e.text))
  answer('ui.log', (e) => {
    w.logs.push(e.text)
    w.trace.push(`ui.log:${e.text}`)
    w.logSinks.push(String(e.to))
  })
  answer('ui.open', (e) => {
    w.opened.push(e.id)
    return { isPlaced: true }
  })
  answer('ui.close', () => undefined)
  // The mod-manager's start, in the same hooks module, lists the open panes: none are open here.
  answer('ui.panes', () => [])
  engineAnswers(on)
  return w
}

export const start = ($: any, surface: string = 'terminal') => $.session.start({ surface, isInteractive: true, cwd: '/work' })
export const typed = ($: any, text: string) => $.prompt.submit({ text, wait: false, origin: { kind: 'composer' } })
export const run = ($: any, command: string, args = '') =>
  $.command.run({ command, args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } })
export const agentSets = ($: any, id: string, on: boolean) => $.tool.call({ tool: TOOL, switch: id, on } as any)
export const signed = (id: string, v: boolean, at: number) => envelopeOf(keyFor(id), v, at)
/** A store that holds each of these switches signed on, as the pane or a mod's own command writes it. */
export async function signedOn(ids: readonly string[], at = 5_000): Promise<Record<string, unknown>> {
  return Object.fromEntries(await Promise.all(ids.map(async (id) => [keyFor(id), await signed(id, true, at)] as const)))
}
