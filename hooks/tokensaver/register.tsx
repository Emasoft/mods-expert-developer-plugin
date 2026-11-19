// Adapted from https://github.com/AGregDev/claude-tokensaver at 0a4ba5c4c0745521de09a12cbc2a6b7751854a18, hooks/register.tsx, MIT.
// Changed for mods-expert-developer-plugin: the session.start body and the prompt.submit, agent.spawn, turn.step, turn.complete and session.measure hooks are exported functions that hooks/index.ts runs in its one hook per event (ruling 8 as amended, orchestrator ruling Q1); the revision atom is $.ui.invalidate; the command is /mods-tokensaver, the pane mods-tokensaver-panel and the store keys tokensaver.*; the tokensaver:* command files are not ported; Tokensaver replaces Clawd where a person reads it and the figure, its glyph art and faces are gone (owner directive 2, ruling 3, orchestrator ruling Q4); imports carry no .ts extension (TRDD-71KVH9PA). The switch values the registry holds are written into the two configs by applyTokensaverSwitches, which hooks/tokensaver/mod.ts calls (TRDD-71KVH9PA, T2).
/**
 * Tokensaver: the thin layer between Claude Code's events and the pure
 * controllers beside it. Two of them run side by side:
 *
 * - the assistant: trims noisy shell output and pasted logs before they are
 *   stored, watches the context window and the prompt cache, and compacts when
 *   asked (or, opted in, by itself between turns);
 * - the router: picks the cheapest capable model for sub-agents Claude starts,
 *   and retries one tier up when a result fails its checks.
 *
 * None of it approves a tool call (there is no `tool.check` hook), and it
 * never starts a sub-agent itself. Events another mod of this plugin also
 * hooks without a matcher are not registered here: hooks/index.ts holds the
 * one hook for each and runs the exported functions below in it.
 */
import type {
  AgentSpawnInput,
  AgentSpawnResult,
  EngineInterface,
  On,
  PluginOptions,
  PromptSubmitInput,
  SessionMeasureInput,
  Timer,
  ToolCallResult,
  TurnCompleteInput,
  TurnStepInput,
  TurnStepResult,
  TurnUsage,
} from 'claude-code'

import {
  addReply,
  averageReply,
  parseVoice,
  parseVoiceStats,
  VOICE_SECTION_ID,
  voiceComparison,
  voiceNote,
  voiceRules,
  withReportNote,
  withTerseSummary,
} from './core/caveman'
import type { Voice, VoiceStats } from './core/caveman'
import { isRecord } from './core/log'
import {
  createAssistant,
  fillOf,
  hasFlare,
  moodOf,
  noteEvent,
  onCompacted,
  onContext,
  onIdleCheck,
  onMainRequest,
  onPromptText,
  onToolOutput,
  onTurnEnd,
  parseAssistantOptions,
  parseAssistantOverrides,
  requestCompact,
  setVoice,
  speechOf,
  withAssistantConfig,
} from './runtime/assistant'
import type { Assistant, AssistantOverrides, AssistantStep, FeedKind } from './runtime/assistant'
import {
  hydrate,
  isAnimating,
  isQuiet,
  onAgentResult,
  onCommand,
  onDiagnostic,
  onFacts,
  onHost,
  onMeasure,
  onPrompt,
  onSpawn,
  onSpawned,
  onStepUsage,
  onTick,
  onTurnComplete,
} from './runtime/session'
import type { AgentResultInput, Effect, Session, Step, Usage } from './runtime/session'
import { BAND_HEIGHT, bandSvg, isBandVisible, routedBadge, spinnerSuffix } from './ui/band'
import {
  bandLineOf,
  bandSvgOf,
  bubbleRows,
  heroSvg,
  stripOf,
  tilesSvg,
} from './ui/draw'
import type { AssistantView } from './ui/draw'
import { bar, formatTokens, spinner } from './ui/format'
import type { Span, Tone } from './ui/theme'
import { toView } from './ui/view'
import { setStatusLine } from '../status-line'

/** The pane's id: one literal for `$.ui.open`, its render hook and `ui.close`. */
const PANE = 'mods-tokensaver-panel'
const COMMAND = 'mods-tokensaver'
const TICK_MS = 250
const STORE_LOG = 'tokensaver.log'
const STORE_THRESHOLDS = 'tokensaver.thresholds'
const STORE_SETTINGS = 'tokensaver.settings'
const STORE_DELEGATION = 'tokensaver.delegation'
const STORE_ASSISTANT = 'tokensaver.assistant'
const STORE_LIFETIME = 'tokensaver.lifetime'

/** Tools that read the repository; counted to see how much the main loop reads for itself. */
const READING_TOOLS = ['Read', 'Grep', 'Glob']

/** Folders that hold no source of the project's own. */
const SKIPPED_FOLDERS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  'coverage',
  'target',
  'vendor',
  '.next',
  '.venv',
  '__pycache__',
]
const MAX_LISTINGS = 40
const MAX_COUNTED = 2000
const MAX_MARKED_ROWS = 200

/** About how wide one text cell is in the desktop app, to size a picture to its slot. */
const CELL_PX = 7.4

/** The mark each kind of activity gets in the pane's feed. */
const FEED_GLYPHS: Readonly<Record<FeedKind, string>> = {
  trim: '✂',
  paste: '✂',
  compact: '⇣',
  cold: '❄',
  warn: '▲',
  route: '•',
  escalate: '•',
  info: '•',
}

type TextStyle = { color?: Tone; weight?: 'semibold'; dimColor?: true }

/** A colour prop only where colour is on. */
const tint = (hasColor: boolean, tone: Tone): { color?: Tone } => (hasColor ? { color: tone } : {})

const styleOf = (part: Span): TextStyle => ({
  ...(part.tone === undefined ? {} : { color: part.tone }),
  ...(part.isBold === true ? { weight: 'semibold' as const } : {}),
  ...(part.isDim === true ? { dimColor: true } : {}),
})

const usageOf = (usage: TurnUsage): Usage => ({
  model: usage.model,
  input: usage.input_tokens,
  output: usage.output_tokens,
  cacheWrite: usage.cache_creation_input_tokens,
})

/** The Agent tool's own token total. A denial, an error and a background launch carry none. */
const totalTokensOf = (result: unknown): number | undefined => {
  const total = isRecord(result) ? result['totalTokens'] : undefined

  return typeof total === 'number' ? total : undefined
}

const resultOf = (toolUseId: string, result: ToolCallResult<'Agent'>): AgentResultInput => ({
  toolUseId,
  isDenied: result.deny !== undefined,
  isError: result.isError === true,
  text: result.text ?? '',
  totalTokens: totalTokensOf(result.result),
  now: Date.now(),
})

/** A call that falls back instead of failing its hook when it is not available. */
const attempt = async <Value,>(call: () => Promise<Value>, fallback: Value): Promise<Value> => {
  try {
    return await call()
  } catch {
    return fallback
  }
}

const reasonOf = (error: unknown): string => (error instanceof Error ? error.message : String(error))

/** A tool_result block's text, whether it came as a string or as text blocks; undefined for anything else. */
const resultText = (block: Record<string, unknown>): string | undefined => {
  const content = block['content']

  if (typeof content === 'string') {
    return content
  }

  if (!Array.isArray(content) || content.length === 0) {
    return undefined
  }

  const texts = content.map(part => (isRecord(part) && part['type'] === 'text' ? part['text'] : undefined))

  return texts.every(text => typeof text === 'string') ? texts.join('\n') : undefined
}

type Lifetime = { eaten: number; freed: number; voice: VoiceStats }

const parseLifetime = (value: unknown): Lifetime => ({
  eaten: isRecord(value) && typeof value['eaten'] === 'number' ? value['eaten'] : 0,
  freed: isRecord(value) && typeof value['freed'] === 'number' ? value['freed'] : 0,
  voice: parseVoiceStats(isRecord(value) ? value['voice'] : undefined),
})

// Module state: a session's worth of bookkeeping. A reload starts it over, and
// `session.start` then rebuilds it from the store.
let session: Session = hydrate({
  options: {},
  storedLog: undefined,
  storedThresholds: undefined,
  storedSettings: undefined,
  noColor: undefined,
}).session
let assistant: Assistant = createAssistant(parseAssistantOptions({}))
let assistantOverrides: AssistantOverrides = {}
let lifetime: Lifetime = parseLifetime(undefined)
let timer: Timer | undefined
let idleTimer: Timer | undefined
let shownStatus: string | undefined
// The status line must be sent again even when its text has not changed: a surface that was not attached when it was last
// written never saw it. It cannot be a sentinel on shownStatus (undefined), because undefined is the value that clears the
// line: the registry would then keep the previous segment standing.
let mustResendStatus = false
let isPaneOpen = false
let wasPaneClosedByPerson = false
/** Shell rows Tokensaver trimmed, by tool_use_id, for their badge in the transcript. */
let markedRows = new Map<string, number>()
/** The command each shell call ran, by tool_use_id, so the trimmer knows a search from a build. */
let commands = new Map<string, string>()
/** System prompts sent with the caveman voice in them since the module loaded, for `/mods-tokensaver doctor`. */
let voicedPrompts = 0
/** Agent calls that came with no tool_use_id, numbered so a spawn and its start still pair up. */
let unnamed = 0
/** The options the plugin was registered with. */
let pluginOptions: PluginOptions = {}

const assistantView = (now = Date.now()): AssistantView => {
  const view = toView(session)
  const state = { now, isEnabled: session.config.isEnabled, activeAgents: view.activeCount }

  return {
    mood: moodOf(assistant, state),
    speech: speechOf(assistant, state),
    mode: view.mode,
    hasMotion: !session.config.hasReducedMotion,
    hasColor: !session.hasNoColor,
    isQuiet: isQuiet(session),
    context: { ...assistant.context, percent: fillOf(assistant) },
    ghost: assistant.live,
    stats: {
      eaten: assistant.trimmed + assistant.pasteTrimmed,
      reReads: assistant.reReads,
      compactFreed: assistant.compactFreed,
      routed: Math.max(0, session.saved),
      keptOut: session.keptOut,
      trims: assistant.trims + assistant.pastes,
      compactions: assistant.compactions,
    },
    feed: assistant.feed,
    activeAgents: view.activeCount,
  }
}

/** The voice Claude is told to answer in now: the switch, unless tokensaver is off. */
const voiceNow = (): Voice => (session.config.isEnabled ? assistant.config.voice : 'off')

const VOICE_NAMES: Readonly<Record<Voice, string>> = { off: 'off', caveman: 'on', ultra: 'ultra' }

/** What the pane's voice button switches to: on, then ultra, then off. */
const NEXT_VOICE: Readonly<Record<Voice, Voice>> = { caveman: 'ultra', ultra: 'off', off: 'caveman' }

/** What the voice has measurably done, all-time: average output per reply, with it and without. */
const voiceReport = (): string => {
  const comparison = voiceComparison(lifetime.voice)
  const voice = `caveman voice ${VOICE_NAMES[assistant.config.voice]}`

  if (comparison !== undefined) {
    const change = comparison.cut >= 0 ? `${String(comparison.cut)}% fewer` : `${String(-comparison.cut)}% more`

    return `${voice}: replies average ${formatTokens(comparison.terse)} output tokens with it, ${formatTokens(comparison.plain)} without (${change}, over ${String(lifetime.voice.terse.turns + lifetime.voice.plain.turns)} replies)`
  }

  const tally = assistant.config.voice === 'off' ? lifetime.voice.plain : lifetime.voice.terse

  return tally.turns === 0
    ? voice
    : `${voice}: replies average ${formatTokens(averageReply(tally))} output tokens over ${String(tally.turns)}; the comparison shows once each voice has 5`
}

/** The status line: one glance at what Tokensaver is doing for the session. Plain text, no colour codes. */
const statusText = (): string | undefined => {
  if (!session.config.isEnabled || !session.config.hasStatusLine) {
    return undefined
  }

  const view = assistantView()
  const routing = toView(session)
  const glyph = view.activeAgents > 0 ? spinner(session.frame, view.hasMotion) : '●'
  const parts = [
    `${glyph} ${session.config.isDryRun ? 'tokensaver [dry-run]' : 'tokensaver'} ${formatTokens(routing.total)} tok`,
    `Tokensaver ate ${formatTokens(view.stats.eaten)}`,
    `~${formatTokens(view.stats.reReads)} re-sends avoided`,
  ]

  if (view.context.window > 0) {
    parts.push(`ctx ${bar(view.context.percent / 100, 6)} ${String(view.context.percent)}%`)
  }

  if (voiceNow() !== 'off') {
    parts.push(voiceNow() === 'ultra' ? 'caveman ultra' : 'caveman')
  }

  if (view.mood === 'sleepy') {
    parts.push('cache cold: /mods-tokensaver compact')
  }

  if (view.activeAgents > 0) {
    parts.push(`${String(view.activeAgents)} helper${view.activeAgents === 1 ? '' : 's'}`)
  }

  return parts.join(' · ')
}

/** Opens the pane and keeps what Claude Code answered, for `/mods-tokensaver doctor`. */
async function openPane($: EngineInterface, why: string): Promise<void> {
  try {
    const opened = await $.ui.open({ id: PANE, title: 'Tokensaver' })

    isPaneOpen = opened.isPlaced
    session = onDiagnostic(
      session,
      opened.isPlaced ? `pane opened (${why})` : `pane waiting (${why}): ${opened.reason}`,
    ).session
  } catch (error) {
    isPaneOpen = false
    session = onDiagnostic(session, `pane did not open (${why}): ${reasonOf(error)}`).session
  }
}

/** Tells the person something they did not ask for: a toast, or quietly the log. */
function notify($: EngineInterface, text: string): void {
  if (isQuiet(session)) {
    $.ui.log(text)
  } else {
    $.ui.toast(text)
  }
}

async function saveLifetime($: EngineInterface): Promise<void> {
  await attempt(() => $.store.set(STORE_LIFETIME, lifetime), undefined)
}

async function run($: EngineInterface, effect: Effect): Promise<void> {
  switch (effect.kind) {
    case 'toast':
      notify($, effect.text)
      break
    case 'log':
      $.ui.log(effect.text)
      break
    case 'save-log':
      await $.store.set(STORE_LOG, session.outcomes)
      await $.store.set(STORE_THRESHOLDS, session.thresholds)
      await $.store.set(STORE_DELEGATION, { minSaving: session.minSaving })
      break
    case 'save-settings':
      await $.store.set(STORE_SETTINGS, session.overrides)
      break
    case 'clear-log':
      await $.store.delete(STORE_LOG)
      await $.store.delete(STORE_THRESHOLDS)
      await $.store.delete(STORE_DELEGATION)
      break
    case 'open-dashboard':
      wasPaneClosedByPerson = false
      await openPane($, 'asked')
      break
    case 'export':
      await $.fs.write(effect.path, effect.json)
      break
  }
}

/** True while something on screen moves or must be taken down on time. */
const needsClock = (): boolean =>
  isAnimating(session) || (session.config.isEnabled && !isQuiet(session) && hasFlare(assistant, Date.now()))

function refresh($: EngineInterface): void {
  const status = statusText()

  // The resend is an explicit intent, not a sentinel: undefined is the value that clears the line, so a sentinel on
  // shownStatus would read as "cleared, already shown" and skip the clearing write this refresh owes the registry.
  if (mustResendStatus || status !== shownStatus) {
    shownStatus = status
    mustResendStatus = false
    // One line per plugin: the registry joins this segment with the other mods' (TRDD-71KVH9PA, T2).
    setStatusLine($, 'tokensaver', status)
  }

  $.ui.invalidate('ui.render')

  if (timer === undefined && needsClock()) {
    timer = $.clock.every(TICK_MS, () => {
      session = onTick(session, Date.now()).session

      if (!needsClock()) {
        timer?.cancel()
        timer = undefined
        // One last frame without the passing mood.
        $.ui.invalidate('ui.render')
        return
      }

      refresh($)
    })
  }
}

/**
 * Puts the display back in step with the session. What is sent while no
 * surface is attached is dropped, so this runs again whenever one may have
 * appeared: when an app attaches, and at the start of every turn.
 */
async function sync($: EngineInterface, why: string): Promise<void> {
  const [surfaces, termProgram, entrypoint] = await Promise.all([
    attempt(() => $.session.surfaces(), []),
    attempt(() => $.env.get('TERM_PROGRAM'), undefined),
    attempt(() => $.env.get('CLAUDE_CODE_ENTRYPOINT'), undefined),
  ])

  session = onHost(session, { termProgram, entrypoint }).session

  // Send the status line again even when its text has not changed: a flag, not shownStatus = undefined, which is the
  // value that clears the line and would read as "already shown".
  mustResendStatus = true

  // A surface with room beside the transcript gets the pane; the terminal gets the status line and strip.
  // Quiet, the pane waits for `/mods-tokensaver dashboard`.
  if (
    session.config.isEnabled &&
    !isQuiet(session) &&
    !isPaneOpen &&
    !wasPaneClosedByPerson &&
    surfaces.some(surface => surface !== 'terminal')
  ) {
    await openPane($, why)
  }

  refresh($)
}

/** Applies a router transition: keeps its session, carries out its effects, redraws. */
async function commit<Reply>($: EngineInterface, step: Step<Reply>): Promise<Reply> {
  const before = session.notes
  session = { ...step.session, now: Math.max(step.session.now, Date.now()) }

  // What the router did shows in Tokensaver's feed too.
  for (const note of session.notes.filter(note => !before.includes(note))) {
    assistant = noteEvent(assistant, {
      kind: note.includes('escalated') || note.includes('failed') ? 'escalate' : note.includes('→') ? 'route' : 'info',
      text: note,
      now: Date.now(),
    })
  }

  for (const effect of step.effects) {
    // A display or storage effect that fails must never fail the hook that caused it.
    await attempt(() => run($, effect), undefined)
  }

  refresh($)

  return step.reply
}

/** Queues the built-in /compact with Tokensaver's instructions; false when the engine refuses that too. */
async function compactByCommand($: EngineInterface, instructions: string): Promise<boolean> {
  try {
    await $.command.run({ command: 'compact', args: instructions })

    return true
  } catch {
    return false
  }
}

/** Runs a compaction for Tokensaver and books what it freed. */
async function compactNow($: EngineInterface, instructions: string): Promise<string> {
  try {
    const result = await $.session.compact({ instructions })

    assistant = onCompacted(assistant, {
      before: result.skip === undefined ? result.tokensBefore : undefined,
      after: result.skip === undefined ? result.tokensAfter : undefined,
      isSkipped: result.skip !== undefined,
      now: Date.now(),
    })

    return result.skip === undefined ? 'Compacted.' : `Compaction skipped: ${result.skip}`
  } catch (error) {
    assistant = { ...assistant, isCompacting: false }

    // Headless hosts (VS Code, Cursor, the SDK) only compact inside a turn: hand it to /compact,
    // which waits for the session to be idle and whose own `session.compact` the hook below books.
    if (await compactByCommand($, instructions)) {
      return 'Compacting through /compact.'
    }

    const text = `Tokensaver could not compact now: ${reasonOf(error)}`

    $.ui.toast(text)

    return text
  } finally {
    refresh($)
  }
}

/** Applies an assistant transition: keeps it, carries out its effects, redraws. */
async function commitAssistant<Reply>($: EngineInterface, step: AssistantStep<Reply>): Promise<Reply> {
  assistant = step.assistant

  for (const effect of step.effects) {
    if (effect.kind === 'toast') {
      notify($, effect.text)
    } else if (effect.kind === 'compact') {
      // Never awaited by the hook that noticed the need: it compacts once the turn has let go.
      void compactNow($, effect.instructions)
    } else {
      await attempt(() => $.store.set(STORE_ASSISTANT, assistantOverrides), undefined)
    }
  }

  refresh($)

  return step.reply
}

/**
 * The level each of the three switches suppresses, as last read from the store: the voice, the auto-compaction fill and the
 * cache TTL. Off writes the neutral value into the live config, so off then on in the same session could not give back what
 * the person set; this record is where the way back reads from. `undefined` until the store is read means nothing to restore.
 */
let storedLevels: { voice: Voice; autoCompactAt: number; cacheTtlMinutes: number } | undefined

/** Keeps the level a store read just gave, for the switch that suppresses it. */
const rememberLevels = (config: { voice: Voice; autoCompactAt: number; cacheTtlMinutes: number }): void => {
  storedLevels = { voice: config.voice, autoCompactAt: config.autoCompactAt, cacheTtlMinutes: config.cacheTtlMinutes }
}

const applyAssistantOverrides = (options: Readonly<Record<string, unknown>>): void => {
  assistant = withAssistantConfig(assistant, { ...parseAssistantOptions(options), ...assistantOverrides })
  rememberLevels(assistant.config)
}

/**
 * Writes the registry's switches into the two configs the savers read (TRDD-71KVH9PA, G13.1): hooks/tokensaver/mod.ts reads
 * every switch and calls this. An on switch keeps the level the store holds; an off forces the neutral value, so no level is
 * ever invented here. A display left stale by the change is redrawn by the next sync.
 */
export function applyTokensaverSwitches(v: {
  isEnabled: boolean
  isDryRun: boolean
  hasReducedMotion: boolean
  hasContextHint: boolean
  hasStatusLine: boolean
  hasRouting: boolean
  hasEscalation: boolean
  isTrimming: boolean
  isTrimmingPastes: boolean
  voice: boolean
  autoCompact: boolean
  coldCache: boolean
}): void {
  session = {
    ...session,
    config: {
      ...session.config,
      isEnabled: v.isEnabled,
      isDryRun: v.isDryRun,
      hasReducedMotion: v.hasReducedMotion,
      hasContextHint: v.hasContextHint,
      hasStatusLine: v.hasStatusLine,
      hasRouting: v.hasRouting,
      hasEscalation: v.hasEscalation,
    },
  }
  assistant = withAssistantConfig(assistant, {
    ...assistant.config,
    isTrimming: v.isTrimming,
    isTrimmingPastes: v.isTrimmingPastes,
    // Off writes the neutral value (that is the switch's whole effect); on gives back the level the store holds, from the
    // record the store read left, never from the live config an earlier off has zeroed.
    voice: v.voice ? (storedLevels?.voice ?? assistant.config.voice) : 'off',
    autoCompactAt: v.autoCompact ? (storedLevels?.autoCompactAt ?? assistant.config.autoCompactAt) : 0,
    cacheTtlMinutes: v.coldCache ? (storedLevels?.cacheTtlMinutes ?? assistant.config.cacheTtlMinutes) : 0,
  })
}

/** Redraws everything Tokensaver puts on screen after a switch changed, so the change shows at once (hooks/tokensaver/mod.ts). */
export function redrawTokensaver($: EngineInterface): void {
  refresh($)
}

/** Watches the idle session so Tokensaver can say when the prompt cache has expired. */
function armIdleCheck($: EngineInterface): void {
  idleTimer?.cancel()
  idleTimer = undefined

  const ttl = assistant.config.cacheTtlMinutes * 60_000

  if (ttl <= 0) {
    return
  }

  const firesAt = Date.now() + ttl + 1000

  idleTimer = $.clock.after(ttl + 1000, () => {
    idleTimer = undefined

    const wasCold = assistant.isCold
    // The timer firing is the proof that the idle time passed, whatever clock drives it.
    assistant = onIdleCheck(assistant, { now: Math.max(Date.now(), firesAt), isEnabled: session.config.isEnabled })

    if (assistant.isCold && !wasCold) {
      notify($, `Tokensaver: ${speechOf(assistant, { now: Date.now(), isEnabled: true, activeAgents: 0 })}`)
      refresh($)
    }
  })
}

/**
 * Counts the project's files, a few folders deep, to judge how much reading a
 * broad task means. A sample with a ceiling: it reads names only, never contents.
 */
async function countFiles($: EngineInterface): Promise<number | undefined> {
  const queue: { path: string; depth: number }[] = [{ path: '.', depth: 0 }]
  let listings = 0
  let files = 0

  while (queue.length > 0 && listings < MAX_LISTINGS && files < MAX_COUNTED) {
    const folder = queue.shift()

    if (folder === undefined) {
      break
    }

    const entries = await attempt(() => $.fs.list(folder.path), undefined)

    if (entries === undefined) {
      // The first listing failing means the count is unknown, not zero.
      if (listings === 0) {
        return undefined
      }

      continue
    }

    listings += 1

    for (const entry of entries) {
      if (entry.kind === 'file') {
        files += 1
      } else if (entry.kind === 'dir' && folder.depth < 3 && !SKIPPED_FOLDERS.includes(entry.name)) {
        queue.push({
          path: folder.path === '.' ? entry.name : `${folder.path}/${entry.name}`,
          depth: folder.depth + 1,
        })
      }
    }
  }

  return files
}

const ASSISTANT_HELP = [
  '/mods-tokensaver compact      compact now, with focus instructions from your recent asks',
  '/mods-tokensaver trim [on|off]       trim noisy shell output before it is stored',
  '/mods-tokensaver pastes [on|off]     tidy pasted logs in your prompts (lossless)',
  '/mods-tokensaver autocompact <0-95>  compact by itself past this fill % (0 = never)',
  '/mods-tokensaver caveman [on|ultra|off]  Claude answers in fewer words, every fact kept',
].join('\n')

const switchOf = (word: string | undefined, isOn: boolean): boolean =>
  word === 'on' ? true : word === 'off' ? false : !isOn

/** The assistant's own commands; undefined for a word the router answers. */
async function assistantCommand($: EngineInterface, args: string): Promise<string | undefined> {
  const [first = '', second] = args.trim().toLowerCase().split(/\s+/)

  switch (first) {
    case 'compact': {
      const step = requestCompact(assistant)

      assistant = step.assistant

      if (step.reply.instructions === undefined) {
        return `Tokensaver: ${step.reply.why ?? 'not now'}`
      }

      const instructions = step.reply.instructions

      // A command holds its own turn, under which the engine refuses to compact: start once it has let go.
      $.clock.after(50, () => {
        void compactNow($, instructions)
      })

      return 'Tokensaver is compacting the conversation, keeping your current task in focus.'
    }
    case 'trim': {
      const isTrimming = switchOf(second, assistant.config.isTrimming)

      assistantOverrides = { ...assistantOverrides, isTrimming }
      await commitAssistant($, {
        assistant: withAssistantConfig(assistant, { ...assistant.config, isTrimming }),
        effects: [{ kind: 'save-assistant' }],
        reply: undefined,
      })

      return `Tokensaver: output trimming is ${isTrimming ? 'on' : 'off'}`
    }
    case 'pastes': {
      const isTrimmingPastes = switchOf(second, assistant.config.isTrimmingPastes)

      assistantOverrides = { ...assistantOverrides, isTrimmingPastes }
      await commitAssistant($, {
        assistant: withAssistantConfig(assistant, { ...assistant.config, isTrimmingPastes }),
        effects: [{ kind: 'save-assistant' }],
        reply: undefined,
      })

      return `Tokensaver: paste tidying is ${isTrimmingPastes ? 'on' : 'off'}`
    }
    case 'caveman':
    case 'voice': {
      const asked = parseVoice(second)

      if (second !== undefined && asked === undefined) {
        return 'Tokensaver: say on, ultra or off, e.g. /mods-tokensaver caveman ultra'
      }

      const voice = asked ?? (assistant.config.voice === 'off' ? 'caveman' : 'off')

      assistantOverrides = { ...assistantOverrides, voice }

      const { text } = await commitAssistant($, setVoice(assistant, voice, Date.now()))

      return session.config.isEnabled ? `Tokensaver: ${text}` : `Tokensaver: ${text} (tokensaver is off: /mods-tokensaver on)`
    }
    case 'autocompact': {
      const value = Number(second)

      if (!Number.isFinite(value) || value < 0 || value > 95) {
        return 'Tokensaver: give a fill percentage from 0 (never) to 95, e.g. /mods-tokensaver autocompact 80'
      }

      const autoCompactAt = Math.round(value)

      assistantOverrides = { ...assistantOverrides, autoCompactAt }
      await commitAssistant($, {
        assistant: withAssistantConfig(assistant, { ...assistant.config, autoCompactAt }),
        effects: [{ kind: 'save-assistant' }],
        reply: undefined,
      })

      return autoCompactAt === 0
        ? 'Tokensaver: auto-compact is off; I will only suggest it'
        : `Tokensaver: I will compact between turns once the context passes ${String(autoCompactAt)}%`
    }
    default:
      return undefined
  }
}

const assistantReport = (): string => {
  const view = assistantView()

  return [
    `Tokensaver ate ${formatTokens(view.stats.eaten)} tokens of noise this session (${String(view.stats.trims)} trims; ${formatTokens(lifetime.eaten)} all-time)`,
    `~${formatTokens(view.stats.reReads)} tokens not re-sent on later requests; ${formatTokens(view.stats.compactFreed)} freed by ${String(view.stats.compactions)} compaction(s)`,
    `context ${view.context.window > 0 ? `${String(view.context.percent)}% (${formatTokens(view.context.tokens)} of ${formatTokens(view.context.window)})` : 'not measured yet'}`,
    `trim ${assistant.config.isTrimming ? `on (${assistant.config.trimLevel}, cap ${String(assistant.config.maxOutputLines)} lines)` : 'off'} · pastes ${assistant.config.isTrimmingPastes ? 'on' : 'off'} · auto-compact ${assistant.config.autoCompactAt === 0 ? 'off' : `at ${String(assistant.config.autoCompactAt)}%`} · cache coach ${assistant.config.cacheTtlMinutes === 0 ? 'off' : `${String(assistant.config.cacheTtlMinutes)} min`}`,
    voiceReport(),
  ].join('\n')
}

/** Runs `/mods-tokensaver <args>`: the assistant's words first, then the router's. */
async function runCommand($: EngineInterface, args: string): Promise<string> {
  const own = await assistantCommand($, args)

  if (own !== undefined) {
    return own
  }

  const reply = await commit($, onCommand(session, args, Date.now()))
  const word = args.trim().split(/\s+/)[0]?.toLowerCase() ?? ''

  if (word === '' || word === 'status') {
    return `${assistantReport()}\n${reply.text}`
  }

  if (word === 'doctor') {
    const voice = voiceNow()
    const where = voice === 'off'
      ? session.config.isEnabled ? 'off' : 'off (tokensaver is off)'
      : `${VOICE_NAMES[voice]}, in ${String(voicedPrompts)} system prompt(s) sent since load (section ${VOICE_SECTION_ID})`

    return `${reply.text}\ncaveman voice: ${where}`
  }

  return word === 'help' ? `${ASSISTANT_HELP}\n${reply.text}` : reply.text
}

/** Presses on Tokensaver's buttons, from the pane or the strip. */
function press($: EngineInterface, args: string): () => Promise<void> {
  // The press it returns takes no $ of its own: it closes over this call's.
  return async (): Promise<void> => {
    const text = await runCommand($, args)

    $.ui.toast(text.split('\n')[0] ?? text)
  }
}

/**
 * Starts Tokensaver for a session: reads back what the store kept, registers
 * the command and draws. hooks/index.ts runs it in its one session.start hook.
 */
export async function startTokensaver($: EngineInterface): Promise<void> {
  const [
    storedLog,
    storedThresholds,
    storedSettings,
    storedDelegation,
    storedAssistant,
    storedLifetime,
    noColor,
    termProgram,
    entrypoint,
  ] = await Promise.all([
      attempt(() => $.store.get(STORE_LOG), undefined),
      attempt(() => $.store.get(STORE_THRESHOLDS), undefined),
      attempt(() => $.store.get(STORE_SETTINGS), undefined),
      attempt(() => $.store.get(STORE_DELEGATION), undefined),
      attempt(() => $.store.get(STORE_ASSISTANT), undefined),
      attempt(() => $.store.get(STORE_LIFETIME), undefined),
      attempt(() => $.env.get('NO_COLOR'), undefined),
      attempt(() => $.env.get('TERM_PROGRAM'), undefined),
      attempt(() => $.env.get('CLAUDE_CODE_ENTRYPOINT'), undefined),
    ])

  assistantOverrides = parseAssistantOverrides(storedAssistant)
  lifetime = parseLifetime(storedLifetime)
  applyAssistantOverrides(pluginOptions)

  await commit(
    $,
    hydrate({ options: pluginOptions, storedLog, storedThresholds, storedSettings, storedDelegation, noColor, termProgram, entrypoint }),
  )
  await attempt(
    () =>
      $.command.register({
        name: COMMAND,
        description: 'Tokensaver, your token saver: status, compact, caveman, trim, on/off, dashboard, doctor',
        argumentHint: '[compact|caveman|trim|pastes|autocompact|on|off|dry-run|dashboard|doctor|motion|quiet|export|reset|help]',
        immediate: true,
      }),
    undefined,
  )

  const [model, repoFiles] = await Promise.all([
    attempt(() => $.session.model(), undefined),
    countFiles($),
  ])

  await commit($, onFacts(session, { model, repoFiles }))
  await sync($, 'session start')
}

/**
 * Tokensaver's prompt.submit stage: tidies a pasted log, books the prompt for
 * the router and adds what it asks. Returns the event to pass on; the caller
 * passes it on once.
 */
export async function routeTokensaverPrompt($: EngineInterface, e: PromptSubmitInput): Promise<PromptSubmitInput> {
  const kind = e.origin.kind
  const isFromUser = kind === 'composer' || kind === 'bridge' || kind === 'sdk'
  const model = await attempt(() => $.session.model(), undefined)

  if (model !== undefined) {
    session = onFacts(session, { model }).session
  }

  idleTimer?.cancel()
  idleTimer = undefined
  await sync($, 'turn start')

  const tidied = await commitAssistant(
    $,
    onPromptText(assistant, {
      text: e.text,
      // A slash command's line and a hidden prompt take no rewrite of their text.
      isFromUser: isFromUser && e.command === undefined && e.isMeta !== true,
      isEnabled: session.config.isEnabled,
      isDryRun: session.config.isDryRun,
      now: Date.now(),
    }),
  )
  if (tidied.voice !== undefined) {
    assistantOverrides = { ...assistantOverrides, voice: tidied.voice }
    // The transition saved the overrides before they held the new voice.
    void attempt(() => $.store.set(STORE_ASSISTANT, assistantOverrides), undefined)
  }

  const text = tidied.text ?? e.text
  const reply = await commit($, onPrompt(session, { text, isFromUser, now: Date.now() }))
  const passed = tidied.text === undefined ? e : { ...e, text }

  if (tidied.text !== undefined) {
    lifetime = { ...lifetime, eaten: lifetime.eaten + (e.text.length - text.length) / 4 }
    void saveLifetime($)
  }

  const added = [
    ...(tidied.voice === undefined ? [] : [voiceNote(tidied.voice)]),
    ...(reply.context === undefined ? [] : [reply.context]),
  ]

  return added.length === 0 ? passed : { ...passed, context: [...(passed.context ?? []), ...added] }
}

/**
 * Tokensaver's agent.spawn stage before the spawn: picks the model and, under
 * the caveman voice, asks for a terse report. Returns the event to pass on and
 * the id its start is booked under (observeTokensaverSpawned).
 */
export async function tokensaverBeforeSpawn(
  $: EngineInterface,
  e: AgentSpawnInput,
): Promise<{ event: AgentSpawnInput; toolUseId: string }> {
  unnamed += 1

  const toolUseId = e.tool_use_id === '' ? `spawn-${String(unnamed)}` : e.tool_use_id
  const reply = await commit(
    $,
    onSpawn(session, {
      toolUseId,
      prompt: e.prompt,
      description: e.description,
      subagentType: e.subagentType,
      explicitModel: e.model,
      parentModel: e.parentModel,
      parentAgentId: e.parentAgentId,
      isBackground: e.background,
      isPinned: e.fork || e.isTeammate === true || e.workflow !== undefined,
      now: Date.now(),
    }),
  )
  // A sub-agent's report lands in the main context: under the voice it is asked to be terse.
  // A fork reads the parent's own prompt, and a teammate's or a workflow's task is not ours to add to.
  const isTerse = voiceNow() !== 'off' && !e.fork && e.isTeammate !== true && e.workflow === undefined
  const prompt = isTerse ? withReportNote(e.prompt) : e.prompt
  const asked = reply.model === undefined ? e : { ...e, model: reply.model }

  return { event: prompt === e.prompt ? asked : { ...asked, prompt }, toolUseId }
}

/** Tokensaver's agent.spawn stage after the spawn: books what started. */
export async function observeTokensaverSpawned($: EngineInterface, toolUseId: string, started: AgentSpawnResult): Promise<void> {
  await commit(
    $,
    onSpawned(session, {
      toolUseId,
      agentId: started.agentId,
      isDenied: started.deny !== undefined,
      resolvedModel: started.model,
    }),
  )
}

/** Tokensaver's turn.step observer, after the step: counts the request and its usage. */
export async function observeTokensaverTurnStep($: EngineInterface, e: TurnStepInput, result: TurnStepResult): Promise<void> {
  if (e.agentId === undefined) {
    assistant = onMainRequest(assistant)
  }

  if (result.usage !== null) {
    await commit(
      $,
      onStepUsage(session, {
        turnId: e.turnId,
        agentId: e.agentId,
        usage: usageOf(result.usage),
        reads: result.toolUses.filter(use => READING_TOOLS.includes(use.name)).length,
      }),
    )
  }
}

/** Tokensaver's turn.complete observer, before the turn completes: the voice tally, the idle check, the router's books. */
export async function observeTokensaverTurnComplete($: EngineInterface, e: TurnCompleteInput): Promise<void> {
  if (e.agentId === undefined) {
    const output = e.usage?.output_tokens
    const isFinished = e.reason === 'answer' && !e.isAborted
    const isTerse = voiceNow() !== 'off'

    assistant = onTurnEnd(assistant, { now: Date.now(), output, isFinished, isTerse })

    if (isFinished && output !== undefined && output > 0) {
      lifetime = { ...lifetime, voice: addReply(lifetime.voice, { isTerse, output }) }
      void saveLifetime($)
    }

    armIdleCheck($)
  }

  await commit(
    $,
    onTurnComplete(session, {
      turnId: e.turnId,
      agentId: e.agentId,
      usage: e.usage === undefined ? undefined : usageOf(e.usage),
      isFailed: e.reason === 'error' || e.reason === 'refusal',
      isAborted: e.isAborted,
      answer: e.answer,
      now: Date.now(),
    }),
  )
}

/** Tokensaver's session.measure observer: the context fill for the router and the assistant. */
export async function observeTokensaverMeasure($: EngineInterface, e: SessionMeasureInput): Promise<void> {
  await commit($, onMeasure(session, { tokens: e.context.tokens, window: e.context.window }))
  await commitAssistant(
    $,
    onContext(assistant, {
      tokens: e.context.tokens,
      window: e.context.window,
      isEnabled: session.config.isEnabled,
      now: Date.now(),
    }),
  )
}

/** Registers the hooks only Tokensaver has: the pane, the command, the trimmer, the voice and the drawing. */
export function registerTokensaver(on: On, options: PluginOptions): void {
  pluginOptions = options
  session = hydrate({
    options: pluginOptions,
    storedLog: undefined,
    storedThresholds: undefined,
    storedSettings: undefined,
    noColor: undefined,
  }).session
  assistant = createAssistant(parseAssistantOptions(pluginOptions))
  assistantOverrides = {}
  // A fresh load knows no stored level yet: a switch turned on before the store is read keeps the live value.
  storedLevels = undefined
  markedRows = new Map()
  commands = new Map()
  voicedPrompts = 0
  isPaneOpen = false
  wasPaneClosedByPerson = false
  unnamed = 0

  on('session.attach', async ($, e, next) => {
    const attached = await next(e)

    session = onDiagnostic(session, `${e.surface} attached`).session
    await sync($, `${e.surface} attached`)

    return attached
  })

  on('ui.close', { id: PANE }, async (_$, e, next) => {
    const closed = await next(e)

    isPaneOpen = false

    // A pane the person closed stays closed until they ask for it again.
    if (e.origin.kind === 'person') {
      wasPaneClosedByPerson = true
    }

    return closed
  }).catch((_$, e, next) => next(e))

  on('command.run', { command: COMMAND }, async ($, e) => ({ text: await runCommand($, e.args) }))

  // The output trimmer: a shell's result is shrunk before it is stored, so the
  // model reads (and every later request re-sends) the tidy form only.
  // Claude's own tool calls arrive as response rows just before their results: note each shell command.
  on('session.append', { door: 'response' }, (_$, e, next) => {
    for (const block of e.message.content) {
      const input = block['input']
      const command = isRecord(input) ? input['command'] : undefined

      if (block.type === 'tool_use' && typeof block['id'] === 'string' && typeof command === 'string') {
        commands.set(block['id'], command)
      }
    }

    if (commands.size > MAX_MARKED_ROWS) {
      commands = new Map([...commands].slice(-MAX_MARKED_ROWS))
    }

    return next(e)
  }).catch((_$, e, next) => next(e))

  on('session.append', { door: 'tool-result' }, async ($, e, next) => {
    const tool = e.origin.kind === 'tool' ? e.origin.tool : ''
    let cutTotal = 0
    const content = e.message.content.map(block => {
      if (block.type !== 'tool_result' || block['is_error'] === true) {
        return block
      }

      const text = resultText(block)

      if (text === undefined) {
        return block
      }

      const callId = block['tool_use_id']
      const step = onToolOutput(assistant, {
        tool,
        command: typeof callId === 'string' ? commands.get(callId) : undefined,
        text,
        isEnabled: session.config.isEnabled,
        isDryRun: session.config.isDryRun,
        now: Date.now(),
      })

      assistant = step.assistant

      if (step.reply.text === undefined) {
        return block
      }

      const cut = Math.round((text.length - step.reply.text.length) / 4)
      const id = block['tool_use_id']

      if (typeof id === 'string') {
        markedRows.set(id, cut)

        if (markedRows.size > MAX_MARKED_ROWS) {
          markedRows = new Map([...markedRows].slice(-MAX_MARKED_ROWS))
        }
      }

      cutTotal += cut

      return { ...block, content: step.reply.text }
    })

    if (content.every((block, index) => block === e.message.content[index])) {
      return next(e)
    }

    lifetime = { ...lifetime, eaten: lifetime.eaten + cutTotal }
    void saveLifetime($)
    refresh($)

    return next({ ...e, message: { ...e.message, content } })
  }).catch((_$, e, next) => next(e))

  on('session.compact', async ($, e, next) => {
    // While the voice is on, the main conversation's summary is written in it too: it is re-sent with every request after.
    const isTerse = e.agentId === undefined && voiceNow() !== 'off'
    const result = await next(isTerse ? { ...e, instructions: withTerseSummary(e.instructions) } : e)

    // The main conversation's own compactions, whoever asked; Tokensaver's own calls book theirs.
    if (e.agentId === undefined && e.trigger !== 'precompute' && e.trigger !== 'plugin') {
      assistant = onCompacted(assistant, {
        before: result.skip === undefined ? result.tokensBefore : undefined,
        after: result.skip === undefined ? result.tokensAfter : undefined,
        isSkipped: result.skip !== undefined,
        now: Date.now(),
      })

      if (result.skip === undefined) {
        lifetime = { ...lifetime, freed: lifetime.freed + Math.max(0, (result.tokensBefore ?? 0) - (result.tokensAfter ?? 0)) }
        void saveLifetime($)
      }

      refresh($)
    }

    return result
  }).catch((_$, e, next) => next(e))

  on('tool.call', { tool: 'Agent' }, async ($, e, next) => {
    const first = await next(e)
    const reply = await commit($, onAgentResult(session, resultOf(e.tool_use_id, first)))

    // A denied call, a passing result and a dry run all come back with nothing to retry.
    if (reply.retryWith === undefined) {
      return first
    }

    const second = await next({ ...e, model: reply.retryWith })

    await commit($, onAgentResult(session, resultOf(e.tool_use_id, second)))

    return second
  }).catch((_$, e, next) => next(e))

  // The caveman voice rides in the system prompt, after the cache boundary, so the shared
  // prefix stays cached. Switching it re-writes the rest of the cache once, on the next request.
  on('prompt.compose', async (_$, e, next) => {
    const composed = await next(e)
    const rules = voiceRules(voiceNow())

    if (rules === undefined || e.traits.includes('bare') || composed.sections.some(section => section.id === VOICE_SECTION_ID)) {
      return composed
    }

    // A render that only measures the prompt (`/context`) carries the section but is not sent.
    if (!e.traits.includes('analysis')) {
      voicedPrompts += 1
    }

    return { sections: [...composed.sections, { id: VOICE_SECTION_ID, text: rules, scope: 'session' as const }] }
  }).catch((_$, e, next) => next(e))

  // --- Drawing ---------------------------------------------------------------

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const view = assistantView()
    const routing = toView(session)
    const hasAgents = isBandVisible(routing) && routing.band.agents.length > 0
    const { isVisible, shouldOffer } = stripOf(view, {
      isFlaring: hasFlare(assistant, Date.now()),
      hasAgents,
      hasFlash: isBandVisible(routing) && routing.band.flash !== undefined,
    })

    if (!isVisible || e.props.hasSurvey) {
      return next(e)
    }

    const { Box, Text, Button } = $.ui.resolve(e)
    // Whatever another mod draws in the strip stays, beneath tokensaver's.
    const beneath = await next(e)
    const buttons = shouldOffer ? (
      <Box gap={1}>
        <Button key="band-compact" variant="primary" label="Compact now" onPress={press($, 'compact')} />
      </Box>
    ) : null

    if (e.surface === 'desktop') {
      const { Svg } = $.ui.resolve({ ...e, surface: 'desktop' as const })
      const width = Math.round(Math.max(40, e.props.bodyColumns) * CELL_PX)

      return (
        <Box flexDirection="column">
          <Box gap={1} alignItems="center">
            <Svg source={bandSvgOf(view, shouldOffer ? width - 130 : width)} alt={view.speech} width={shouldOffer ? width - 130 : width} height={46} />
            {buttons}
          </Box>
          {hasAgents ? (
            <Svg source={bandSvg(routing, width)} alt={`${String(routing.activeCount)} helpers running`} width={width} height={BAND_HEIGHT} />
          ) : null}
          {beneath}
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        <Box gap={1}>
          <Box>
            {bandLineOf(view, e.props.bodyColumns - (shouldOffer ? 16 : 0)).map(part => (
              <Text {...styleOf(part)}>{part.text}</Text>
            ))}
          </Box>
          {buttons}
        </Box>
        {beneath}
      </Box>
    )
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const suffix = spinnerSuffix(toView(session))

    return suffix === undefined
      ? next(e)
      : next({ ...e, props: { ...e.props, suffix: `${e.props.suffix}${suffix}` } })
  })

  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    // A shell row Tokensaver trimmed says so, and by how much.
    if (e.props.tool !== 'Agent') {
      const cut = markedRows.get(e.props.tool_use_id)

      if (cut === undefined) {
        return next(e)
      }

      const { Box, Text } = $.ui.resolve(e)
      const row = await next(e)

      return (
        <Box flexDirection="column">
          {row}
          <Text {...tint(!session.hasNoColor, 'success')} dimColor>
            {isQuiet(session)
              ? `  tokensaver trimmed ${formatTokens(cut)} tokens of noise`
              : `  Tokensaver ate ${formatTokens(cut)} tokens of noise from this output`}
          </Text>
        </Box>
      )
    }

    const badge = routedBadge(toView(session), e.props.tool_use_id)
    const row = await next(e)

    if (badge === undefined) {
      return row
    }

    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        <Box>
          {badge.map(part => (
            <Text {...styleOf(part)}>{part.text}</Text>
          ))}
        </Box>
        {row}
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    isPaneOpen = true

    const { Box, Text, Button } = $.ui.resolve(e)
    const view = assistantView()
    const columns = e.props.bodyColumns
    const isOff = view.mode === 'off'
    const feed = [...view.feed].reverse().slice(0, 6)
    const ago = (at: number): string => {
      const seconds = Math.max(0, Math.round((Date.now() - at) / 1000))

      return seconds < 60 ? `${String(seconds)}s` : `${String(Math.round(seconds / 60))}m`
    }
    const controls = (
      <Box gap={1} flexWrap="wrap">
        <Button key="compact" variant="primary" label="Compact now" onPress={press($, 'compact')} />
        <Button
          key="caveman"
          label={`Caveman: ${VOICE_NAMES[assistant.config.voice]}`}
          onPress={press($, `caveman ${NEXT_VOICE[assistant.config.voice]}`)}
        />
        <Button
          key="trim"
          label={assistant.config.isTrimming ? 'Trimming: on' : 'Trimming: off'}
          onPress={press($, 'trim')}
        />
        <Button
          key="pastes"
          label={assistant.config.isTrimmingPastes ? 'Paste tidy: on' : 'Paste tidy: off'}
          onPress={press($, 'pastes')}
        />
        <Button key="power" label={isOff ? 'Wake Tokensaver' : 'Turn off'} onPress={press($, isOff ? 'on' : 'off')} />
      </Box>
    )

    if (e.surface === 'desktop') {
      const { Svg } = $.ui.resolve({ ...e, surface: 'desktop' as const })
      const width = Math.round(Math.max(44, columns) * CELL_PX)

      return (
        <Box flexDirection="column" gap={1}>
          <Svg source={heroSvg(view, width)} alt={`Tokensaver: ${view.speech}`} width={width} />
          <Svg
            source={tilesSvg(view, width)}
            alt={`${formatTokens(view.stats.eaten)} tokens eaten, ${formatTokens(view.stats.reReads)} re-sends avoided, ${formatTokens(view.stats.compactFreed)} freed by compacting`}
            width={width}
          />
          {controls}
          <Text weight="semibold">Activity</Text>
          {feed.length === 0 ? (
            <Text dimColor>Nothing yet. Run something noisy (a build, a test suite, an install) and watch me eat.</Text>
          ) : (
            feed.map(item => (
              <Box gap={1}>
                <Text {...tint(view.hasColor, (item.kind === 'warn' ? 'warning' : item.kind === 'escalate' ? 'error' : 'success'))}>
                  {FEED_GLYPHS[item.kind]}
                </Text>
                <Text>{item.text}</Text>
                <Text dimColor>{ago(item.at)}</Text>
              </Box>
            ))
          )}
          <Text dimColor>
            {`All-time: ${formatTokens(lifetime.eaten)} eaten · ${formatTokens(lifetime.freed)} freed by compacting`}
          </Text>
          <Text dimColor>{voiceReport()}</Text>
        </Box>
      )
    }

    const bubble = bubbleRows(view, columns)
    const meter = view.context.window > 0
      ? `${bar(view.context.percent / 100, Math.max(10, columns - 30))} ${String(view.context.percent)}%  ${formatTokens(view.context.tokens)}/${formatTokens(view.context.window)}`
      : 'context: waiting for the first reply'

    return (
      <Box flexDirection="column">
        {view.isQuiet ? (
          <Text>{view.speech}</Text>
        ) : (
          bubble.map(row => <Text>{row}</Text>)
        )}
        <Text> </Text>
        <Text weight="semibold">Context</Text>
        <Text {...tint(view.hasColor, (view.context.percent >= 85 ? 'error' : view.context.percent >= 70 ? 'warning' : 'claude'))}>{meter}</Text>
        {view.ghost > 0 ? <Text dimColor>{`without Tokensaver it would hold ${formatTokens(view.ghost)} more`}</Text> : null}
        <Text> </Text>
        <Text>
          <Text {...tint(view.hasColor, 'success')} weight="semibold">{formatTokens(view.stats.eaten)}</Text>
          <Text dimColor> eaten  </Text>
          <Text {...tint(view.hasColor, 'suggestion')} weight="semibold">{formatTokens(view.stats.reReads)}</Text>
          <Text dimColor> re-sends avoided  </Text>
          <Text {...tint(view.hasColor, 'claude')} weight="semibold">{formatTokens(view.stats.compactFreed)}</Text>
          <Text dimColor> freed  </Text>
          <Text {...tint(view.hasColor, 'warning')} weight="semibold">{formatTokens(view.stats.routed + view.stats.keptOut)}</Text>
          <Text dimColor> routing</Text>
        </Text>
        <Text dimColor>{voiceReport()}</Text>
        <Text> </Text>
        {controls}
        <Text> </Text>
        <Text weight="semibold">Activity</Text>
        {feed.length === 0 ? (
          <Text dimColor>Nothing yet.</Text>
        ) : (
          feed.map(item => <Text>{`${FEED_GLYPHS[item.kind]} ${item.text}  ${ago(item.at)}`}</Text>)
        )}
      </Box>
    )
  })
}
