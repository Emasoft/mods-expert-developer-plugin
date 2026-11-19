// The function switches of the integrated mods (TRDD-5IK59SQ2, PRRD G13.1: "Every mod function can be switched on and
// off, so the user or the agent activates only the functions it needs."). Pure decisions only: ./register.ts keeps the
// registry the mods define their functions in, reads and writes the store, and draws the /mods-switches pane and
// answers the switches tool, which share every decision below (one state, one validation, PRRD G9.2).
//
// Each switch is one store key (a set changes only its own key, so sessions that switch different functions never
// overwrite each other) holding a signed envelope { v, at, sig }: v the value, at when it was written (ms), and sig the
// SHA-256 of a constant of this plugin, the key, v and at. Every writer of this plugin (the pane, the mods' own
// commands, the switches tool) signs. A value whose sig does not match was written by something else, such as a hand
// edit of the store file: it never turns on a function that is off by default, and the pane and a toast ask the person
// to review it (addendum A1). This is tamper evidence, not a security boundary: the constant is in this source.
import { cleanMasked } from '../debug-log/logic'
import { fitLabel, oneLine } from '../mod-manager/logic'

export const SWITCHES_COMMAND = 'mods-switches'
export const SWITCHES_PANE = 'mods-switches'
export const SWITCHES_TOOL = 'switches'
const SIGN_CONTEXT = 'mods-expert-developer-plugin/switches/v1'

// Hotkeys must be unique within the pane: digits pick a mod, letters a function of the picked mod, 0 keeps the
// settings under review. A tab per mod keeps the pane short and leaves room for mods integrated later.
export const MOD_HOTKEYS = '123456789'
export const FUNCTION_HOTKEYS = 'abcdefghijklmnopqrstuvwxyz'
export const KEEP_HOTKEY = '0'

/** One function a mod lets the person and the agent switch on and off. */
export type SwitchDef = {
  /** `<mod>.<function>`: the name the pane, the tool and the default store key use. */
  id: string
  /** The mod the function belongs to; the pane groups by it. */
  mod: string
  /** What the function is, short enough for a pane line. */
  label: string
  /** What the function does before anyone switches it (B3). */
  defaultOn: boolean
  /** The store key; `switch.<id>` when not given. */
  key?: string
  /** A key an older release kept this switch under, read only while the switch has no value of its own. */
  legacyKey?: string
  /** Turning it on takes effect when the next session starts: a tool joins the list only then (prompt cache). */
  nextSession?: boolean
}

export const keyOf = (def: SwitchDef): string => def.key ?? `switch.${def.id}`

/**
 * Adds a mod's functions to a registry. Defining an id again replaces it (a reload loads every mod again); an id or a
 * store key that another mod already uses throws, because two functions sharing one stored value would switch together.
 */
export function addSwitchDefs(registry: Map<string, SwitchDef>, defs: readonly SwitchDef[]): void {
  for (const def of defs) {
    const held = registry.get(def.id)
    if (held !== undefined && held.mod !== def.mod) throw new Error(`the switch ${def.id} is already defined by ${held.mod}`)
    const sharing = [...registry.values()].find((other) => other.id !== def.id && keyOf(other) === keyOf(def))
    if (sharing !== undefined) throw new Error(`the switch ${def.id} uses the store key of ${sharing.id}`)
    // An older release's key is deleted once its functions hold their own values (dropLegacy), so it must never be a
    // live key of another function, nor a function's key another function reads as its older one.
    const reading = [...registry.values()].find((other) => other.id !== def.id && (keyOf(other) === def.legacyKey || other.legacyKey === keyOf(def)))
    if (reading !== undefined) throw new Error(`the switch ${def.id} and ${reading.id} share a key one of them reads as an older release's`)
    registry.set(def.id, def)
  }
}

export type Envelope = { v: unknown; at: number; sig: string }

/** What a store key holds: nothing, something that is not an envelope, or an envelope still to be checked. */
export type Stored = { kind: 'missing' } | { kind: 'garbled' } | ({ kind: 'envelope' } & Envelope)

export function parseStored(raw: unknown): Stored {
  if (raw === undefined) return { kind: 'missing' }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { kind: 'garbled' }
  const { v, at, sig } = raw as Record<string, unknown>
  // A time must be a whole number of milliseconds a clock can give: a huge one would stop the order of later writes
  // (past 2^53, at + 1 === at), so anything else is not a value this plugin wrote.
  if (v === undefined || typeof at !== 'number' || !Number.isSafeInteger(at) || at < 0 || typeof sig !== 'string') return { kind: 'garbled' } // ubs:ignore -- 'sig' here is a field NAME being type-checked, not a secret being compared.
  return { kind: 'envelope', v, at, sig }
}

/**
 * JSON with object keys sorted, so a value signs the same however its keys were ordered. A field holding undefined is
 * left out, as JSON.stringify and the store leave it out: what is signed is what the store reads back.
 */
export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const fields = Object.keys(record)
      .filter((name) => record[name] !== undefined)
      .sort()
      .map((name) => `${JSON.stringify(name)}:${stableJson(record[name])}`)
    return `{${fields.join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

/** The bytes as lowercase hexadecimal, two digits a byte: the form a signature is stored in. */
function hex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function signatureOf(key: string, v: unknown, at: number): Promise<string> {
  const text = [SIGN_CONTEXT, key, stableJson(v), String(at)].join('\n')
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))
}

export async function envelopeOf(key: string, v: unknown, at: number): Promise<Envelope> {
  return { v, at, sig: await signatureOf(key, v, at) }
}

export async function isSigned(key: string, stored: Stored): Promise<boolean> {
  // ubs:ignore -- a SHA-256 of this plugin's own local switch envelope, compared with a value in the same local store: no secret, no network, no timing channel.
  return stored.kind === 'envelope' && (await signatureOf(key, stored.v, stored.at)) === stored.sig
}

/** A value written outside this plugin, or kept by an older release, that waits for the person before it applies. */
export type Review = { value: boolean; why: 'unsigned' | 'garbled' | 'legacy' }

/**
 * What a switch reads as. `from` says where the value came from: `stored` a signed value of this plugin, `legacy` an
 * older release's key (safe to sign over, which the start does once), `outside` a value under review, `default` none.
 */
export type SwitchState = { on: boolean; at: number | undefined; from: 'stored' | 'legacy' | 'outside' | 'default'; review?: Review }

/**
 * The rules, in order:
 * - a signed boolean is the value;
 * - an unsigned boolean was written outside the plugin: off holds (off is the safe side, A2), on falls back to the
 *   default, so an outside write never turns on a function that is off by default (A1), and both wait for review;
 * - anything else under the key is garbled: the default (B3), and the review offers to write it signed;
 * - with nothing under the key, the older release's key: false holds; true holds for a function on by default and
 *   waits for review for one off by default (an outside write of the old key must not turn it on either); any other
 *   value means the default;
 * - otherwise the default.
 */
export function stateOf(def: SwitchDef, stored: Stored, signed: boolean, legacy: unknown): SwitchState {
  if (stored.kind === 'envelope' && typeof stored.v === 'boolean') {
    if (signed) return { on: stored.v, at: stored.at, from: 'stored' }
    return { on: stored.v && def.defaultOn, at: stored.at, from: 'outside', review: { value: stored.v, why: 'unsigned' } }
  }
  if (stored.kind !== 'missing') return { on: def.defaultOn, at: undefined, from: 'outside', review: { value: def.defaultOn, why: 'garbled' } }
  if (legacy === true && !def.defaultOn) return { on: false, at: undefined, from: 'outside', review: { value: true, why: 'legacy' } }
  if (legacy !== undefined) return { on: legacy === false ? false : def.defaultOn, at: undefined, from: 'legacy' }
  return { on: def.defaultOn, at: undefined, from: 'default' }
}

export type SetDecision = { at: number } | { refuse: string }

/**
 * Whether a write of `on` goes ahead, and the time it carries (A2). Off always goes ahead: off wins. On, from a pane
 * drawn when the key stood at `seenAt` (0 when nothing was stored), is refused when an off was stored after that: the
 * person pressed on a view another session has since changed. The agent's tool reads and writes in one call and passes
 * no `seenAt`. The time never goes back, so a later write always carries the later time.
 */
export function decideSet(stored: Stored, on: boolean, seenAt: number | undefined, now: number, label: string): SetDecision {
  if (on && seenAt !== undefined && stored.kind === 'envelope' && stored.v === false && stored.at > seenAt) {
    // Not "another session": the agent of this session may have switched it off too.
    return { refuse: `${label} was turned off after this pane was drawn, so it stays off. Press again to turn it on.` }
  }
  return { at: nextAt(stored, now) }
}

/** The time a new write carries: now, or just after the stored one when the clock has not passed it. */
export function nextAt(stored: Stored, now: number): number {
  return stored.kind === 'envelope' && stored.at >= now ? stored.at + 1 : now
}

/** The mods in the order they defined their first function. */
export function modsOf(defs: readonly SwitchDef[]): string[] {
  return [...new Set(defs.map((def) => def.mod))]
}

export type Listed = { def: SwitchDef; state: SwitchState }

/**
 * A mod's notice (TRDD-AXE8CUWR): one line the switches pane draws under the mod's heading, above its rows, and the
 * switches tool lists beside the mod, such as why the mod is paused or how many errors it swallowed, so it never lives
 * only in the debug log, which is off by default. The getter takes the session id, not $: the engine refuses a $ passed
 * to a function held in a value (../switch-followers.ts), so a mod keeps what its notice says in its own memory. It
 * answers the text, or undefined or '' for none, and is asked again at every drawing and listing, never cached.
 */
export type NoticeGetter = (session: string) => string | undefined

/** The longest notice the switches tool lists; the pane fits it to its width. */
export const NOTICE_MAX = 200

/**
 * The notice as it is shown: one line, since the listing goes to the model and a line break would forge a row of it
 * (review of 72d3969); every run of white space one space, every other control (C0, DEL and C1, U+0085 among them) or
 * direction mark a '?' (printable), at most NOTICE_MAX code points. Nothing left is no notice.
 */
export function noticeText(raw: string | undefined): string | undefined {
  // Cut by code points (oneLine): a character outside the BMP at the cut is kept whole or left out, never split into a
  // lone surrogate before the '…' (review of d783048).
  const line = oneLine(raw ?? '', NOTICE_MAX)
  return line === '' ? undefined : line
}

/**
 * The notice of a mod whose getter threw: the failure shows, and the mod's rows are still drawn (fail visible, not
 * silent). It gives no error text: that can quote outside data, and the tool's listing goes to the model.
 */
export const noticeFailedText = (mod: string): string => `The notice of ${mod} could not be read.`

/**
 * The debug-output line for a getter that threw, masked like every debug line, and on one printable line (cleanMasked):
 * its error can quote outside data, a break included (item 3 sweep, G1).
 */
export function noticeErrorLine(mod: string, error: unknown, home: string | undefined): string {
  return cleanMasked(`mods-switches: the notice of ${mod} could not be read: ${error instanceof Error ? error.message : String(error)}`, home)
}

/**
 * A line the start of this module sends to the transcript when a step fails: masked (tokens, keys, the home folder when
 * it is known), then printable, since it quotes the engine's error, which can carry outside text (review of 42d988d and
 * e2c256f: the line after the home folder's was neither).
 */
export function startFailedLine(what: string, error: unknown, home: string | undefined): string {
  return cleanMasked(`mods-switches: ${what}: ${error instanceof Error ? error.message : String(error)}`, home)
}

/** What a mod's notice says now, in this session; `error` is what its getter threw, for the debug output. */
export function noticeOf(getters: ReadonlyMap<string, NoticeGetter>, mod: string, session: string): { text: string | undefined } | { text: string; error: unknown } {
  const getter = getters.get(mod)
  if (getter === undefined) return { text: undefined }
  try {
    return { text: noticeText(getter(session)) }
  } catch (error) {
    return { text: noticeFailedText(mod), error }
  }
}

/** One item of the shown mod's section of the pane, in the order drawn. */
export type SectionItem = { kind: 'heading'; text: string } | { kind: 'notice'; text: string } | { kind: 'row'; listed: Listed; index: number }

/**
 * The shown mod's section: its heading, then its notice when it has one, fitted to the pane's width like the rows, then a
 * row for each of its functions.
 */
export function modSection(mod: string, notice: string | undefined, functions: readonly Listed[], room: number): SectionItem[] {
  return [
    { kind: 'heading', text: mod },
    ...(notice === undefined ? [] : [{ kind: 'notice' as const, text: fitLabel(notice, room) }]),
    ...functions.map((listed, index) => ({ kind: 'row' as const, listed, index })),
  ]
}

export const NEXT_SESSION_NOTE = 'A tool turned on joins the tool list when the next session starts; turned off, it refuses every call at once.'
export const REVIEW_TOAST = 'Some mods settings come from an older release or were changed outside the plugin, and are not applied. Review them with /mods-switches.'

export function reviewText(reviews: readonly Listed[]): string {
  const names = reviews.map(({ def, state }) => `${def.mod}: ${def.label} (${state.review?.value === true ? 'on' : 'off'})`)
  return `Set by an older release or outside the plugin, so not applied: ${names.join('; ')}. Keep them, or switch each one below.`
}

export function modLabel(index: number, mod: string, selected: boolean, room: number): string {
  const hotkey = MOD_HOTKEYS[index]
  return fitLabel(`${selected ? '• ' : ''}${hotkey === undefined ? '' : `${hotkey}: `}${mod}`, room)
}

export function functionLabel(index: number, listed: Listed, room: number): string {
  const hotkey = FUNCTION_HOTKEYS[index]
  return fitLabel(`${hotkey === undefined ? '' : `${hotkey}: `}${listed.state.on ? '✓ on ' : '✗ off'} ${listed.def.label}`, room)
}

export const TOOL_DESCRIPTION =
  'Lists the functions of the integrated mods of mods-expert-developer-plugin and switches one on or off (PRRD G13.1). ' +
  'With no input: every function, its id and whether it is on. With switch (an id from the list) alone: that function. ' +
  'With switch and on: turns it on (true) or off (false); the person sees a toast. ' +
  'A tool turned on joins the tool list when the next session starts; a function turned off refuses from the next call.'

export const TOOL_SCHEMA = {
  type: 'object',
  properties: {
    switch: { type: 'string', description: 'A function id from the list, <mod>.<function>' },
    on: { type: 'boolean', description: 'true turns the function on, false turns it off' },
  },
  additionalProperties: false,
} as const

export type ToolRequest = { list: string | undefined } | { set: string; on: boolean } | { deny: string }

/** What a call of the switches tool asks for; the model's input is checked here, never trusted. */
export function toolRequestOf(input: Record<string, unknown>, ids: ReadonlySet<string>): ToolRequest {
  const id = input.switch
  const on = input.on
  if (id !== undefined && typeof id !== 'string') return { deny: 'switch must be a function id (a string). Call switches with no input to list them.' }
  if (on !== undefined && typeof on !== 'boolean') return { deny: 'on must be true or false.' }
  if (id === undefined) return on === undefined ? { list: undefined } : { deny: 'on needs a switch: name the function id to turn on or off.' }
  if (!ids.has(id)) return { deny: `There is no function ${JSON.stringify(id)}. Call switches with no input to list them.` }
  return on === undefined ? { list: id } : { set: id, on }
}

/**
 * The tool's listing: every function grouped by mod, each mod with its notice beside it when it has one (TRDD-AXE8CUWR),
 * then what waits for the person's review.
 */
export function statusText(rows: readonly Listed[], notices: ReadonlyMap<string, string | undefined>): string {
  const lines = ['Functions of the integrated mods (id, state, what it is):']
  for (const mod of modsOf(rows.map((row) => row.def))) {
    const notice = notices.get(mod)
    lines.push(notice === undefined ? `${mod}:` : `${mod} (notice: ${notice}):`)
    for (const { def, state } of rows.filter((row) => row.def.mod === mod)) {
      lines.push(`  ${def.id}  ${state.on ? 'on' : 'off'}  ${def.label}${def.nextSession === true ? ' (a tool: on takes effect at the next session start)' : ''}`)
    }
  }
  const reviews = rows.filter((row) => row.state.review !== undefined)
  if (reviews.length > 0) {
    lines.push(`Waiting for the person's review in /mods-switches, not applied: ${reviews.map((row) => row.def.id).join(', ')}.`)
  }
  lines.push('Switch one with {"switch": "<id>", "on": true} or false.')
  return lines.join('\n')
}

export function setText(def: SwitchDef, on: boolean): string {
  const next = on && def.nextSession === true ? ' Its tool joins the tool list when the next session starts.' : ''
  return `${def.id} is now ${on ? 'on' : 'off'}.${next}`
}

export function agentToast(def: SwitchDef, on: boolean): string {
  return `The agent turned ${on ? 'on' : 'off'} ${def.mod}: ${def.label}.`
}

/** Who switched: the person, or the agent (any other origin, such as a command a plugin ran for the model). */
export type By = 'person' | 'agent'

// The origins the person sends from: the terminal's prompt, Remote Control and an SDK host such as the Desktop app.
// The set is named here, as the one place the switches decide who switched.
const PERSON_KINDS: ReadonlySet<string> = new Set(['composer', 'bridge', 'sdk'])

export function byOf(originKind: string): By {
  return PERSON_KINDS.has(originKind) ? 'person' : 'agent'
}

export function keepLabel(room: number): string {
  return fitLabel(`${KEEP_HOTKEY}: Keep these settings`, room)
}
