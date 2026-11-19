// The switch registry of the integrated mods (TRDD-5IK59SQ2, PRRD G13.1, G9.2): every mod defines its functions here
// with defineSwitches when it loads, and reads each one with isOn at the moment of use. The /mods-switches pane, the
// mods' own on/off commands and the switches tool all write through setSwitch, so the person and the agent share one
// state and one validation; the pane lists whatever the registry holds, so a mod integrated later appears without a
// change here (orchestrator addendum, 2026-11-04). Decisions are in ./logic.ts.
import type { EngineInterface, On } from 'claude-code'

import {
  type By,
  KEEP_HOTKEY,
  type Listed,
  type NoticeGetter,
  MOD_HOTKEYS,
  FUNCTION_HOTKEYS,
  NEXT_SESSION_NOTE,
  REVIEW_TOAST,
  type Stored,
  type SwitchDef,
  type SwitchState,
  addSwitchDefs,
  agentToast,
  decideSet,
  envelopeOf,
  functionLabel,
  isSigned,
  keepLabel,
  keyOf,
  modLabel,
  modSection,
  modsOf,
  nextAt,
  noticeErrorLine,
  noticeOf,
  parseStored,
  reviewText,
  setText,
  startFailedLine,
  stateOf,
  statusText,
  toolRequestOf,
  TOOL_DESCRIPTION,
  TOOL_SCHEMA,
} from './logic'
import { homeFolder } from '../mod-manager/files'
// Every write of a switch here (setSwitch, keepShown, migrateLegacy) tells followSwitch, in the session that wrote it, so
// a function that runs from a timer sets its timer only while on (TRDD-5IK59SQ2: a function that is off runs nothing, a
// timer included). A write made in another session is not heard here: such a timer reads its switch at each tick and stops
// on an off.
import { followSwitch } from '../switch-followers'

// Module state: the definitions are made again by every load, so a reload rebuilds the same registry.
const registry = new Map<string, SwitchDef>()
// Which mod's functions the pane shows, per session: one module may serve more than one session.
const shownModBySession = new Map<string, string>()

/** Adds a mod's functions to the registry, by the rules of addSwitchDefs; every mod calls it when it loads. */
export function defineSwitches(defs: readonly SwitchDef[]): void {
  addSwitchDefs(registry, defs)
}

export const switchDefs = (): SwitchDef[] => [...registry.values()]

// The notice getter of each mod, by mod name (TRDD-AXE8CUWR, logic.ts NoticeGetter).
const noticeGetters = new Map<string, NoticeGetter>()
// The home folder, read at the session start, so a getter's error is masked like every debug line (maskForLog).
let knownHome: string | undefined

/**
 * Registers a mod's notice; a mod calls it when it loads, after its defineSwitches. A mod with no switch has no heading in
 * the pane, so a notice for it could never be shown: that is refused at once, not drawn nowhere. A second registration
 * for the same mod replaces the first.
 */
export function defineNotice(mod: string, getter: NoticeGetter): void {
  if (!switchDefs().some((def) => def.mod === mod)) throw new Error(`defineNotice: no switch of the mod ${mod} is defined; call defineSwitches first`)
  noticeGetters.set(mod, getter)
}

/**
 * Draws the switches pane again, so a changed notice shows at once: a mod calls it when its notice changes. It reaches
 * the panes of the session it is called in; a pane open in another session shows the change at its next drawing.
 */
export function noticeChanged($: EngineInterface): void {
  $.ui.invalidate('ui.render')
}

/**
 * A mod's notice now, in this session. What a getter threw goes to the debug output, masked (logic.ts noticeErrorLine);
 * the pane and the listing show only the plain notice that says it failed.
 */
function noticeNow($: EngineInterface, mod: string, session: string): string | undefined {
  const notice = noticeOf(noticeGetters, mod, session)
  if ('error' in notice) $.ui.log(noticeErrorLine(mod, notice.error, knownHome), { to: 'debug' })
  return notice.text
}

function defOf(id: string): SwitchDef {
  const def = registry.get(id)
  if (def === undefined) throw new Error(`no mod defines the switch ${id}`)
  return def
}

async function readFull($: EngineInterface, def: SwitchDef): Promise<{ stored: Stored; state: SwitchState }> {
  const key = keyOf(def)
  const stored = parseStored(await $.store.get(key))
  const legacy = stored.kind === 'missing' && def.legacyKey !== undefined ? await $.store.get(def.legacyKey) : undefined
  return { stored, state: stateOf(def, stored, await isSigned(key, stored), legacy) }
}

/** What the switch reads as now. */
export async function readSwitch($: EngineInterface, def: SwitchDef): Promise<SwitchState> {
  return (await readFull($, def)).state
}

/**
 * Whether a function may run now. Read from the store at every use, never from a copy (B4): a switch turned off in
 * any session, by the pane, a command or the agent, holds from the next press, hook call or tick.
 */
export async function isOn($: EngineInterface, id: string): Promise<boolean> {
  return (await readSwitch($, defOf(id))).on
}

async function listedOf($: EngineInterface, defs: readonly SwitchDef[]): Promise<Listed[]> {
  return Promise.all(defs.map(async (def) => ({ def, state: await readSwitch($, def) })))
}

/**
 * Removes an older release's key once every function it stood for holds a value of its own, so each switch is one
 * stored value (B2). A key still standing for a value under review stays: the review needs it.
 */
async function dropLegacy($: EngineInterface, legacyKey: string | undefined): Promise<void> {
  if (legacyKey === undefined || (await $.store.get(legacyKey)) === undefined) return
  for (const def of registry.values()) {
    if (def.legacyKey === legacyKey && parseStored(await $.store.get(keyOf(def))).kind === 'missing') return
  }
  await $.store.delete(legacyKey)
}

export type SetOutcome = { changed: boolean } | { refuse: string }

/**
 * The one writer of a switch. The value is signed, so it never reads as an outside write; `seenAt` is the time the
 * value stood at when the pane was drawn (A2, decideSet). A change the agent makes is shown to the person in a toast.
 */
export async function setSwitch($: EngineInterface, id: string, on: boolean, by: By, seenAt?: number): Promise<SetOutcome> {
  const def = defOf(id)
  const key = keyOf(def)
  const { stored, state } = await readFull($, def)
  const decision = decideSet(stored, on, seenAt, await $.clock.now(), def.label)
  if ('refuse' in decision) return decision
  await $.store.set(key, await envelopeOf(key, on, decision.at))
  followSwitch($, id, on)
  await dropLegacy($, def.legacyKey)
  $.ui.invalidate('ui.render')
  const changed = state.on !== on
  if (by === 'agent' && changed) $.ui.toast(agentToast(def, on))
  return { changed }
}

/** Sets several functions, as a mod's own on/off command does for its own; the first refusal stops it and is returned. */
export async function setSwitches($: EngineInterface, ids: readonly string[], on: boolean, by: By): Promise<SetOutcome> {
  let changed = false
  for (const id of ids) {
    const outcome = await setSwitch($, id, on, by)
    if ('refuse' in outcome) return outcome
    changed ||= outcome.changed
  }
  return { changed }
}

/**
 * A value of a mod's own that only this plugin should write, signed as the switches are (A1), such as the per-plugin
 * auto-update opt-ins. `value` is what the store holds (the envelope's value, or the raw value when it is not an
 * envelope); `outside` is true when something is stored without this plugin's signature, so the mod reads it on its
 * safe side and says so. Nothing stored reads as undefined, not outside. Tamper evidence, not a boundary, as for the
 * switches (README, Mods switches).
 */
export async function readSigned($: EngineInterface, key: string): Promise<{ value: unknown; outside: boolean }> {
  const raw = await $.store.get(key)
  const stored = parseStored(raw)
  if (stored.kind === 'missing') return { value: undefined, outside: false }
  if (stored.kind === 'garbled') return { value: raw, outside: true }
  return { value: stored.v, outside: !(await isSigned(key, stored)) }
}

/** Writes such a value signed, with a time after the stored one (nextAt), as setSwitch does. */
export async function writeSigned($: EngineInterface, key: string, value: unknown): Promise<void> {
  const stored = parseStored(await $.store.get(key))
  await $.store.set(key, await envelopeOf(key, value, nextAt(stored, await $.clock.now())))
}

/** Whether every one of these functions is on: the current state a mod's on/off command toggles from. */
export async function allOn($: EngineInterface, ids: readonly string[]): Promise<boolean> {
  for (const id of ids) if (!(await isOn($, id))) return false
  return true
}

/**
 * Keeps the values under review that the pane showed, signed as the person's own. One that changed since the pane was
 * drawn is left for the next look, so a press never keeps a value the person did not see.
 */
async function keepShown($: EngineInterface, shown: ReadonlyArray<{ id: string; value: boolean }>): Promise<void> {
  for (const { id, value } of shown) {
    const def = registry.get(id)
    if (def === undefined) continue
    const { stored, state } = await readFull($, def)
    if (state.review?.value !== value) continue
    const key = keyOf(def)
    await $.store.set(key, await envelopeOf(key, value, nextAt(stored, await $.clock.now())))
    followSwitch($, id, value)
    await dropLegacy($, def.legacyKey)
  }
  $.ui.invalidate('ui.render')
}

/**
 * Signs once what an older release kept (a false, or a true of a function on by default), then drops the old key, so
 * every switch has one stored value from then on (B2). A true of a function off by default is not signed: it waits for
 * the person's review, like any value written outside the plugin.
 */
async function migrateLegacy($: EngineInterface): Promise<void> {
  const legacyKeys = new Set<string>()
  for (const def of registry.values()) {
    if (def.legacyKey === undefined) continue
    legacyKeys.add(def.legacyKey)
    const { stored, state } = await readFull($, def)
    if (stored.kind !== 'missing' || state.from !== 'legacy') continue
    const key = keyOf(def)
    await $.store.set(key, await envelopeOf(key, state.on, await $.clock.now()))
    followSwitch($, def.id, state.on)
  }
  for (const legacyKey of legacyKeys) await dropLegacy($, legacyKey)
}

/**
 * Called first by hooks/index.ts at session.start, so every mod after it reads migrated switches. The tool is deferred:
 * only its name is in the prompt until the model searches for it (PRRD G9.2 asks for typed agent tools; the cost of an
 * always-loaded schema is not). The tool and the command register first, so a failed migration or a refused toast
 * cannot leave the person and the agent without a way to switch; a switch reads an older release's key by itself
 * (stateOf) while the migration has not run.
 */
export async function startSwitches($: EngineInterface): Promise<void> {
  // Literal names here and in the matchers below, so claude plugin validate can pair each with its hook.
  await $.tool.register({ name: 'switches', description: TOOL_DESCRIPTION, inputSchema: TOOL_SCHEMA, isDeferred: true })
  await $.command.register({ name: 'mods-switches', description: 'Switch the functions of the integrated mods on or off' })
  // Read in a try of its own, as startModManager reads its switch (40417bb): a failure here must not skip the moving of
  // older settings, the read of the stored switches or the review toast below. The line goes to the transcript, so it is
  // masked and printable.
  try {
    knownHome = await homeFolder($)
  } catch (error) {
    knownHome = undefined
    $.ui.log(startFailedLine("the home folder could not be read, so a mod's notice error is masked without it", error, undefined))
  }
  try {
    await migrateLegacy($)
    const listed = await listedOf($, switchDefs())
    // A1: an outside write is told at once, not only when the person happens to open the pane. Once per start.
    if (listed.some((row) => row.state.review !== undefined)) $.ui.toast(REVIEW_TOAST)
  } catch (error) {
    $.ui.log(startFailedLine('the older settings could not be moved, or the settings read', error, knownHome))
  }
}

export function registerSwitches(on: On): void {
  on('command.run', { command: 'mods-switches' }, async ($, e) => {
    if (e.args.trim() !== '') return { text: 'Usage: /mods-switches' }
    await $.ui.open({ id: 'mods-switches', title: 'Mods switches', focus: true, closeOnEscape: true })
    return {}
  })

  // RegExp literal: the matcher's string form takes only built-in tool names. The name is mcp__<plugin>__<tool>.
  on('tool.call', { tool: /^mcp__mods-expert-developer-plugin__switches$/ }, async ($, e) => {
    const request = toolRequestOf(e as unknown as Record<string, unknown>, new Set(registry.keys()))
    if ('deny' in request) return { deny: request.deny }
    if ('set' in request) {
      const outcome = await setSwitch($, request.set, request.on, 'agent')
      if ('refuse' in outcome) return { deny: outcome.refuse }
      return { result: setText(defOf(request.set), request.on) }
    }
    const defs = request.list === undefined ? switchDefs() : [defOf(request.list)]
    const session = await $.session.id()
    const notices = new Map(modsOf(defs).map((mod) => [mod, noticeNow($, mod, session)] as const))
    return { result: statusText(await listedOf($, defs), notices) }
  }).catch(async ($, e, next) => ({ deny: `switches failed: ${next.error.message || next.error.kind}` }))

  on('ui.render', { component: 'Pane', requestId: 'mods-switches' }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    // The brackets a Button is drawn in take 4 columns.
    const room = e.props.bodyColumns - 4
    const session = await $.session.id()
    const listed = await listedOf($, switchDefs())
    const mods = modsOf(listed.map((row) => row.def))
    if (mods.length === 0) return Text({ dimColor: true, children: ['No mod has defined a switch.'] })
    const picked = shownModBySession.get(session)
    const shownMod = picked !== undefined && mods.includes(picked) ? picked : mods[0]!
    const reviews = listed.filter((row) => row.state.review !== undefined)
    const shown = reviews.map((row) => ({ id: row.def.id, value: row.state.review!.value }))
    const functions = listed.filter((row) => row.def.mod === shownMod)
    return Box({
      flexDirection: 'column',
      children: [
        ...(reviews.length === 0
          ? []
          : [
              Text({ color: 'warning', children: [reviewText(reviews)] }),
              Button({
                key: 'sw-keep',
                label: keepLabel(room),
                hotkey: KEEP_HOTKEY,
                // Awaited, so the press settles once the values are kept and the pane is drawn again.
                onPress: async () => {
                  await keepShown($, shown)
                },
              }),
            ]),
        ...mods.map((mod, i) =>
          Button({
            key: `sw-mod-${mod}`,
            label: modLabel(i, mod, mod === shownMod, room),
            ...(MOD_HOTKEYS[i] === undefined ? {} : { hotkey: MOD_HOTKEYS[i] }),
            onPress: () => {
              shownModBySession.set(session, mod)
              $.ui.invalidate('ui.render')
            },
          }),
        ),
        // The shown mod's heading, its notice when it has one (TRDD-AXE8CUWR), then its rows (logic.ts modSection).
        ...modSection(shownMod, noticeNow($, shownMod, session), functions, room).map((item) => {
          if (item.kind === 'heading') return Text({ bold: true, children: [item.text] })
          if (item.kind === 'notice') return Text({ color: 'warning', children: [item.text] })
          const { listed: row, index: i } = item
          return Button({
            key: `sw-${row.def.id}`,
            label: functionLabel(i, row, room),
            ...(FUNCTION_HOTKEYS[i] === undefined ? {} : { hotkey: FUNCTION_HOTKEYS[i] }),
            // The press turns the function to the opposite of what this drawing showed, and carries the time the value
            // stood at then (0 when nothing was stored), so an off from another session since then wins (A2).
            onPress: async () => {
              const outcome = await setSwitch($, row.def.id, !row.state.on, 'person', row.state.at ?? 0)
              if ('refuse' in outcome) {
                $.ui.toast(outcome.refuse)
                $.ui.invalidate('ui.render')
              }
            },
          })
        }),
        ...(functions.some((row) => row.def.nextSession === true) ? [Text({ dimColor: true, children: [NEXT_SESSION_NOTE] })] : []),
        Text({ dimColor: true, children: ['Esc closes'] }),
      ],
    })
  })
}
