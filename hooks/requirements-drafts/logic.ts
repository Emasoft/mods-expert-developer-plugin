// Pure decisions of the requirements-drafts mod (TRDD-O5LUMKPW). No `$` here: register.ts wires
// events to these functions, so each rule can be tested as a plain function.

export const DRAFTS_SUBDIR = '.claude/requirements-drafts'
export const END_LINE = '<!-- requirements-drafts:end -->'
// $.fs.write rejects over 4 MiB; the frontmatter needs room, so the message itself gets less.
export const MAX_TEXT_BYTES = 4 * 1024 * 1024 - 8 * 1024
// The picker draws one letter hotkey per message, so it can never hold more than 26.
export const MAX_RECENT = 20
// Claude Code 2.1.309 drew the first row at startup once with this id before the real
// message id (spike run 1); a draft saved under it would point at no message.
export const PLACEHOLDER_ID = 'placeholder'

export type Via = 'row' | 'command' | 'picker'

export type SubmitFacts = {
  /** next.origin.plugin: who raised prompt.submit; Claude Code itself is 'engine'. */
  raisedBy: string
  /** e.origin.kind: where the prompt came from; the person's Enter is 'composer'. */
  originKind: string
  hasCommand: boolean
  isMeta: boolean
  text: string
}

/** Only text the person typed and sent counts: no slash command, no meta or plugin prompt. */
export function shouldRecord(facts: SubmitFacts): boolean {
  if (facts.raisedBy !== 'engine') return false
  if (facts.originKind !== 'composer') return false
  if (facts.hasCommand || facts.isMeta) return false
  const text = facts.text.trim()
  return text !== '' && !text.startsWith('/')
}

/** Newest first, one entry per text, at most MAX_RECENT. */
export function pushRecent(list: readonly string[], text: string): string[] {
  return [text, ...list.filter((t) => t !== text)].slice(0, MAX_RECENT)
}

/** The row button is drawn only under a typed message that already has its real id. */
export function rowIsSaveable(originKind: string, requestId: string): boolean {
  return originKind === 'composer' && requestId !== '' && requestId !== PLACEHOLDER_ID
}

export type SwitchAnswer = { enabled: boolean; text: string } | { usage: string }

/** /requirements-drafts with no argument toggles; on and off set; anything else gets usage. */
export function parseSwitch(args: string, current: boolean): SwitchAnswer {
  const arg = args.trim().toLowerCase()
  const next = arg === '' ? !current : arg === 'on' ? true : arg === 'off' ? false : undefined
  if (next === undefined) return { usage: 'Usage: /requirements-drafts [on|off]' }
  return { enabled: next, text: `requirements-drafts is ${next ? 'on' : 'off'}.` }
}

// Shapes of credentials that must never land in a plain file other agents read.
const SECRET_PATTERNS: readonly RegExp[] = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  /\bsk-ant-[A-Za-z0-9_-]{20,}/,
  /\bsk-[A-Za-z0-9_-]{32,}/,
  /\bxox[abposr]-[A-Za-z0-9-]{10,}/,
  /\bAIza[0-9A-Za-z_-]{35}\b/,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  // A credential name anywhere (so aws_secret_access_key, GITHUB_ACCESS_TOKEN and dbpassword count),
  // followed only by _- joined name parts (so Secretary and passwords= do not), and a value that
  // looks random: letters and digits, or 16 characters or more. Plain schema text such as
  // "auth_token: optional string" passes (both review findings, 2026-10-23).
  /(?:password|passwd|secret|token|api[_-]?key|access[_-]?token|auth[_-]?token)(?:[_-][A-Za-z0-9]+)*\s*[:=]\s*["']?(?:(?=[^\s"']*\d)(?=[^\s"']*[A-Za-z])[^\s"']{8,}|[^\s"']{16,})/i,
  /\bbearer\s+[A-Za-z0-9._~+/-]{20,}=*/i,
]

export function looksSecret(text: string): boolean {
  return SECRET_PATTERNS.some((re) => re.test(text))
}

export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length
}

/** Why a text may not be saved, or undefined when it may. Runs before any write, on every path. */
export function refusal(text: string): string | undefined {
  if (text.trim() === '') return 'Nothing to save: the message is empty.'
  if (looksSecret(text)) return 'Not saved: the message looks like it holds a secret (a key, token or password).'
  if (byteLength(text) > MAX_TEXT_BYTES) return 'Not saved: the message is larger than 4 MiB.'
  return undefined
}

export function hex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('')
}

const pad = (n: number, width = 2): string => String(n).padStart(width, '0')

/** Local wall-clock parts for epoch ms and an offset in minutes east of UTC. */
function localParts(ms: number, offsetMinutes: number) {
  const d = new Date(ms + offsetMinutes * 60_000)
  const sign = offsetMinutes < 0 ? '-' : '+'
  const abs = Math.abs(offsetMinutes)
  return {
    date: `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`,
    isoDate: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`,
    isoTime: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`,
    zone: `${sign}${pad(Math.floor(abs / 60))}${pad(abs % 60)}`,
  }
}

/** `<YYYYMMDD_HHMMSS±zzzz>-<hash12>`: the draft id and its file name without `.md`. */
export function draftId(ms: number, offsetMinutes: number, sha256Hex: string): string {
  const p = localParts(ms, offsetMinutes)
  return `${p.date}_${p.time}${p.zone}-${sha256Hex.slice(0, 12)}`
}

export function isoLocal(ms: number, offsetMinutes: number): string {
  const p = localParts(ms, offsetMinutes)
  return `${p.isoDate}T${p.isoTime}${p.zone}`
}

/** The id of a draft already saved for this hash, from the folder's entry names. */
export function existingDraft(names: readonly string[], sha256Hex: string): string | undefined {
  const tail = `-${sha256Hex.slice(0, 12)}.md`
  const found = names.filter((n) => n.endsWith(tail)).sort()[0]
  return found === undefined ? undefined : found.slice(0, -'.md'.length)
}

export type DraftFacts = {
  id: string
  created: string
  projectRoot: string
  repo: string
  session: string
  messageId: string
  via: Via
  surface: string
  text: string
}

/** Every value is written JSON-quoted, so a path or id cannot break the YAML. */
export function renderDraft(f: DraftFacts): string {
  const field = (key: string, value: string) => `${key}: ${JSON.stringify(value)}`
  return [
    '---',
    field('id', f.id),
    field('created', f.created),
    field('project-root', f.projectRoot),
    field('repo', f.repo),
    field('session', f.session),
    field('message-id', f.messageId),
    field('via', f.via),
    field('surface', f.surface),
    '---',
    '',
    f.text.replace(/\s+$/, ''),
    '',
    END_LINE,
    '',
  ].join('\n')
}

/** One line of at most `columns` characters for the picker. */
export function preview(text: string, columns: number): string {
  const line = text.replace(/\s+/g, ' ').trim()
  const room = Math.max(8, columns)
  return line.length <= room ? line : line.slice(0, room - 1) + '…'
}

export const HOTKEYS = 'abcdefghijklmnopqrstuvwxyz'
