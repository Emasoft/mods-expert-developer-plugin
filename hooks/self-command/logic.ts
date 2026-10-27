// self-command (TRDD-GF5UDFWI): every decision of the two dev tools `run` and `list_commands`, as
// plain functions over values. register.ts wires them to events and calls $. Adapted from the MIT
// self-command and command-hub mods (see NOTICE), rewritten for this plugin.
import type { CommandInfo } from 'claude-code'

export const PLUGIN = 'mods-expert-developer-plugin'
export const RUN_TOOL = 'run'
export const LIST_TOOL = 'list_commands'
/** commands/send.md: hands a report to the model as a prompt of its own. */
export const SEND_COMMAND = `${PLUGIN}:send`
/** One $.store key holds the run history of every session, keyed by session id. */
export const HISTORY_KEY = 'self-command-history'
export const MAX_ENTRIES = 50
export const MAX_SESSIONS = 20
/** A history row keeps this much of the output; the model got all of it through the send command. */
export const OUTPUT_PREVIEW = 400

/** The commands that clear, end or swap the session: the model may not run them. */
export const BLOCKED: ReadonlySet<string> = new Set(['clear', 'exit', 'quit', 'logout', 'login', 'resume', 'rewind'])

/**
 * This plugin's own commands the model may not run either, which makes nine refused names with
 * BLOCKED. Through send the model would write its own next prompt; through mods-dev-tools it would
 * flip the switch the person set (orchestrator ruling, 2026-10-27).
 */
export const OWN_COMMANDS: ReadonlySet<string> = new Set(['send', 'mods-dev-tools'])

/**
 * Whether `name` is one of OWN_COMMANDS in any spelling $.command.list may give: bare or with this
 * plugin's prefix, in any case. A bare `send` of another source is refused too, as the list alone
 * cannot tell them apart; it stays reachable by its own prefixed name.
 */
export function isOwnCommand(name: string): boolean {
  const lower = name.toLowerCase()
  const prefix = `${PLUGIN}:`
  return OWN_COMMANDS.has(lower.startsWith(prefix) ? lower.slice(prefix.length) : lower)
}

const blockedList = [...BLOCKED, ...OWN_COMMANDS].map((name) => `/${name}`).join(', ')

export const RUN_DESCRIPTION = [
  'Runs a slash command of this session as if the person had typed it, for example reload-plugins.',
  'A command cannot run during your turn, so it is queued and runs after the turn ends; its output',
  'reaches you as the next prompt. Call this tool last in a turn, then end the turn.',
  `Refused: ${blockedList}, because they clear, end or swap the session or are this plugin's own report and switch commands. list_commands names the rest.`,
].join(' ')

export const RUN_SCHEMA = {
  type: 'object',
  properties: {
    command: { type: 'string', description: 'The command name without the slash, for example reload-plugins' },
    args: { type: 'string', description: 'The text after the name, as the person would type it; omit it for none' },
  },
  required: ['command'],
  additionalProperties: false,
}

export const LIST_DESCRIPTION = [
  'Lists the slash commands of this session, grouped by where they come from, with the ones the run',
  'tool refuses marked (blocked). Without query it answers names only; with query it answers the',
  'commands whose name or description contains it, with their descriptions.',
].join(' ')

export const LIST_SCHEMA = {
  type: 'object',
  properties: {
    query: { type: 'string', description: 'Text to look for in command names and descriptions, any case' },
  },
  additionalProperties: false,
}

export type RunRequest = { command: string; args: string }

/**
 * The command a `run` call asks for, or the reason it is refused. A leading slash is dropped, and a
 * name written with its arguments (`compact keep the API`) is split at the first space when `args`
 * is left out.
 */
export function requestOf(input: Record<string, unknown>, known: readonly string[]): RunRequest | string {
  const written = typeof input.command === 'string' ? input.command.trim().replace(/^\//, '') : ''
  const [name = '', ...rest] = written.split(/\s+/)
  if (name === '') return 'command is required: the command name without its slash'
  if (BLOCKED.has(name)) return `/${name} clears, ends or swaps the session, so the run tool refuses it`
  if (isOwnCommand(name)) return `/${name} is this plugin's own report or switch command, so the run tool refuses it`
  if (!known.includes(name)) return `/${name} is not a command of this session (list_commands names them)`
  const args = typeof input.args === 'string' ? input.args.trim() : rest.join(' ')
  return { command: name, args }
}

export const shown = (r: RunRequest): string => (r.args === '' ? `/${r.command}` : `/${r.command} ${r.args}`)

export const queuedText = (r: RunRequest): string =>
  `queued: ${shown(r)} runs after this turn ends and its output reaches you as the next prompt. It has not run yet, so do not report an outcome before that prompt arrives.`

export type Outcome = { text?: string } | { error: string }

/**
 * What the model reads once the command finished. It never starts with a slash: a prompt that
 * does would be read as a command.
 */
export function reportText(r: RunRequest, outcome: Outcome): string {
  if ('error' in outcome) return `Your run tool call for ${shown(r)} did not run it: ${outcome.error}`
  const output = outcome.text?.trim() ?? ''
  return `Your run tool call for ${shown(r)} ran it. Its output:\n${output === '' ? '(no text)' : output}`
}

/** Where a command comes from, in words. The engine reports a user's and a project's own file alike as `user`. */
export function sourceLabel(c: Pick<CommandInfo, 'source' | 'plugin'>): string {
  if (c.source === 'builtin') return 'built-in'
  if (c.source === 'user') return 'user or project'
  if (c.source === 'mcp') return 'MCP server'
  return c.plugin === undefined ? 'plugin' : `plugin ${c.plugin}`
}

/** The commands by source label, groups and members in the order the engine listed them. */
export function groupBySource(commands: readonly CommandInfo[]): Array<[string, CommandInfo[]]> {
  const groups = new Map<string, CommandInfo[]>()
  for (const c of commands) {
    const label = sourceLabel(c)
    groups.set(label, [...(groups.get(label) ?? []), c])
  }
  return [...groups.entries()]
}

/** When a built-in command is the right one, for the query answer; each phrase follows "use it". Shown only for built-ins the session has. */
export const WHEN_TO_USE: Readonly<Record<string, string>> = {
  compact: 'when the context is filling up; text after the name says what the summary must keep',
  clear: 'when starting unrelated work; it empties the conversation (blocked for the run tool)',
  context: 'to see what takes up the context window',
  rewind: 'to go back to an earlier message, in code, conversation or both (blocked for the run tool)',
  resume: 'to reopen an earlier session (blocked for the run tool)',
  init: 'in a project without a CLAUDE.md; it writes one from the code',
  memory: 'to edit the CLAUDE.md files every session loads',
  model: 'to switch model for the next turns',
  permissions: 'to allow or deny a tool or command for good',
  'add-dir': 'to let the session work in one more folder',
  agents: 'to create or edit subagents',
  mcp: 'to connect or inspect MCP servers',
  hooks: 'to see or change the hooks that run on events',
  'reload-plugins': 'after a plugin changed on disk, to load the new version',
  doctor: 'when the install or the settings look broken',
  export: 'to save the conversation to a file or the clipboard',
  usage: 'to see plan limits and when they reset',
}

const marked = (name: string): string => (BLOCKED.has(name) || isOwnCommand(name) ? `${name} (blocked)` : name)

/** The list_commands answer: names by source without a query, matching commands with details with one. */
export function listText(commands: readonly CommandInfo[], query = ''): string {
  const q = query.trim().toLowerCase()
  if (q === '') {
    const lines = groupBySource(commands).map(([label, members]) => `${label}: ${members.map((c) => marked(c.name)).join(', ')}`)
    return [`${commands.length} commands. Pass query for descriptions; (blocked) means the run tool refuses it.`, ...lines].join('\n')
  }
  const hits = commands.filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
  if (hits.length === 0) return `No command matches "${query.trim()}".`
  const lines: string[] = [`${hits.length} of ${commands.length} commands match "${query.trim()}".`]
  for (const [label, members] of groupBySource(hits)) {
    lines.push(`${label}:`)
    for (const c of members) {
      lines.push(`- /${marked(c.name)}: ${c.description}`)
      const when = c.source === 'builtin' ? WHEN_TO_USE[c.name] : undefined
      if (when !== undefined) lines.push(`  use it ${when}`)
    }
  }
  return lines.join('\n')
}

export type HistoryEntry = { at: number; command: string; args: string; ok: boolean; output: string }
export type SessionHistory = { lastAt: number; entries: HistoryEntry[] }
export type History = Record<string, SessionHistory>

/** The output a history row keeps: trimmed, cut to OUTPUT_PREVIEW characters. */
export function preview(text: string): string {
  const t = text.trim()
  return t.length <= OUTPUT_PREVIEW ? t : `${t.slice(0, OUTPUT_PREVIEW - 1)}…`
}

export function entryOf(r: RunRequest, outcome: Outcome, at: number): HistoryEntry {
  return 'error' in outcome
    ? { at, command: r.command, args: r.args, ok: false, output: preview(outcome.error) }
    : { at, command: r.command, args: r.args, ok: true, output: preview(outcome.text ?? '') }
}

/** One log line per run. */
export const logLine = (e: HistoryEntry): string =>
  `self-command: ${shown(e)} ${e.ok ? 'ran' : 'did not run'}${e.output === '' ? '' : `: ${e.output.split('\n')[0]}`}`

/**
 * The stored history with one run added: the session's entries capped at MAX_ENTRIES (oldest
 * dropped), and only the MAX_SESSIONS sessions with the latest run kept. Sessions are ranked by
 * their lastAt stamp, not by key order: re-setting a key need not move it in the store.
 * Throws on a stored value of another shape, so a corrupt store is reported, never silently reset.
 */
export function recordRun(stored: unknown, session: string, entry: HistoryEntry): History {
  if (stored !== undefined && (typeof stored !== 'object' || stored === null || Array.isArray(stored))) {
    throw new Error(`${HISTORY_KEY} in the store is not an object`)
  }
  const history: History = { ...(stored as History | undefined) }
  const entries = [...(history[session]?.entries ?? []), entry].slice(-MAX_ENTRIES)
  history[session] = { lastAt: entry.at, entries }
  const kept = Object.entries(history)
    .sort(([, a], [, b]) => b.lastAt - a.lastAt)
    .slice(0, MAX_SESSIONS)
  return Object.fromEntries(kept)
}
