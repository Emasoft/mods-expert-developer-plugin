// The functions of the integrated Deck (TRDD-RD1ISPMN, PRRD G13.1) in the switch registry every integrated mod shares
// (../switches), with the defaults the card records (D1b proposal, section 1): the master on (correction 2), each function
// at upstream Deck's default (DEFAULT_PREFS in ./register.js), the debug log off (G14.1). Pure: ./gate.ts and ./mod.ts read
// them through the registry.
import { debugLogSwitch } from '../debug-log/logic'
import type { SwitchDef } from '../switches/logic'

export const MOD = 'deck'

export const MASTER = 'deck.master'
export const BAND = 'deck.band'
export const FOOTER = 'deck.footer'
export const PANEL = 'deck.panel'
export const STYLE_PICKER = 'deck.style-picker'
export const AUTO = 'deck.auto-expand'
export const SOUND = 'deck.sound'
export const QUIET = 'deck.quiet-router'
export const SPEND = 'deck.spend'
export const DEMO = 'deck.demo'
// TRDD-INFES3JE section C, the owner's "option to disable pets animations". No pet survives the integration, so what this
// switch governs is the frame-driven motion that is left: the tick's repaint on frame parity, the agent strip's blink, the
// unwrap's fade, and the fold's own 33 ms timer. Off by default, so the band is a still HUD and costs nothing per frame.
export const ANIMATION = 'deck.animation'

/** Upstream's sections, the pet left out (owner directive 2), in upstream's order (SECTIONS in ./register.js). */
export const SECTIONS = ['plans', 'agents', 'context', 'limits', 'route', 'clock', 'weather', 'folder'] as const
export type Section = (typeof SECTIONS)[number]
export const sectionSwitch = (section: Section): string => `deck.${section}`
export const WEATHER = sectionSwitch('weather')

const SECTION_LABELS: Record<Section, string> = {
  plans: 'Section: plan and task bars',
  agents: 'Section: subagent strips',
  context: 'Section: context use',
  limits: 'Section: usage limits',
  route: 'Section: the model route',
  clock: 'Section: clock',
  // The only network use: the typed city name to geocoding-api.open-meteo.com, then its latitude and longitude to
  // api.open-meteo.com, at each session start and every 20 minutes while this is on and a city is set (D1b proposal, A1).
  weather: "Section: weather (sends the city's coordinates to open-meteo.com)",
  folder: 'Section: session folder',
}

// TODO(TRDD-RD1ISPMN, M4c person-only flag): deck.weather is person-only for on (the orchestrator's ruling for M4c: a
// switch whose on is outward is refused from the switches tool and from an agent-origin command; the agent may still turn
// it off). Deck's own command enforces it now (./register.js: weather on, all on and city only from a person origin);
// the switches tool needs M4c's flag: mark deck.weather with it once the flag lands on release main and is merged here.
// D1b is not published while this stands.
export const DECK_SWITCHES: readonly SwitchDef[] = [
  { id: MASTER, mod: MOD, label: 'Deck: off turns every Deck function off; an on made in another session starts Deck here at the next session start', defaultOn: true },
  { id: BAND, mod: MOD, label: 'Band above the prompt', defaultOn: true },
  { id: FOOTER, mod: MOD, label: 'Deck button in the footer', defaultOn: true },
  { id: PANEL, mod: MOD, label: '/mods-deck panel: Deck in a pane', defaultOn: true },
  { id: STYLE_PICKER, mod: MOD, label: '/mods-deck style: the style picker', defaultOn: true },
  ...SECTIONS.map((section) => ({ id: sectionSwitch(section), mod: MOD, label: SECTION_LABELS[section], defaultOn: section !== 'weather' })),
  { id: AUTO, mod: MOD, label: 'Expand when something needs you', defaultOn: true },
  { id: SOUND, mod: MOD, label: 'Sounds', defaultOn: true },
  { id: QUIET, mod: MOD, label: "Hide the model router's own status and log lines", defaultOn: true },
  { id: SPEND, mod: MOD, label: 'Spend today and this month (pay-per-use keys)', defaultOn: false },
  { id: DEMO, mod: MOD, label: '/mods-deck demo: a sample plan', defaultOn: true },
  { id: ANIMATION, mod: MOD, label: 'Animate the band (off is a still HUD: no repaint per frame, no fade, no moving unfold)', defaultOn: false },
  debugLogSwitch(MOD),
]

/** The fields of upstream's prefs that switches stand for: the registry is their one source, so deck.prefs keeps none. */
export type Governed = { show: Record<string, boolean>; auto: boolean; sound: boolean; quiet: boolean; cost: boolean; animate: boolean }

/** What deck.prefs keeps: the values that are not switches (style, size, collapsed look, open, city). */
export function keptPrefs<P extends Governed>(prefs: P): Omit<P, keyof Governed> {
  const { show: _show, auto: _auto, sound: _sound, quiet: _quiet, cost: _cost, animate: _animate, ...kept } = prefs
  return kept
}

/** One switch upstream's prefs field stands for, with the write that puts its value in that field. */
export type PrefSwitch = { readonly id: string; readonly apply: (prefs: Governed, on: boolean) => void }

/**
 * The switches upstream's prefs fields stand for, each with its own field, so no order couples an id to a field
 * (review of 8cacd31, m8).
 */
export const PREF_SWITCHES: readonly PrefSwitch[] = [
  ...SECTIONS.map((section) => ({
    id: sectionSwitch(section),
    apply: (prefs: Governed, on: boolean) => {
      prefs.show[section] = on
    },
  })),
  {
    id: AUTO,
    apply: (prefs, on) => {
      prefs.auto = on
    },
  },
  {
    id: SOUND,
    apply: (prefs, on) => {
      prefs.sound = on
    },
  },
  {
    id: QUIET,
    apply: (prefs, on) => {
      prefs.quiet = on
    },
  },
  {
    id: SPEND,
    apply: (prefs, on) => {
      prefs.cost = on
    },
  },
  {
    id: ANIMATION,
    apply: (prefs, on) => {
      prefs.animate = on
    },
  },
]

/**
 * Writes switch values, read through the registry by the caller at this call's entry, into upstream's fields, where its
 * code reads them. `on` holds one value per PREF_SWITCHES entry, read from that same list. Nothing reads these fields
 * before the next entry writes them again, so they are this call's read, never a kept copy (the no-copy ruling).
 */
export function applySwitches(prefs: Governed, on: readonly boolean[]): void {
  PREF_SWITCHES.forEach((each, index) => each.apply(prefs, on[index] === true))
}
