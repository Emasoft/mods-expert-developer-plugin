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
  // Unconditional: a JWT is a secret wherever it sits, dots and all (second fix round, 2026-10-23).
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/,
  /\bbearer\s+[A-Za-z0-9._~+/-]{20,}=*/i,
]

// The credential-name rule, written as plain string steps instead of one regex: a repeated group
// followed by more quantified parts is a catastrophic-backtracking risk on long text (CPV
// skillaudit REGEX_DOS, 2026-10-23). The scans below visit each character a bounded number of times.
const CREDENTIAL_WORDS = [
  'password', 'passwd', 'pass', 'pwd', 'secret', 'token', 'api_key', 'api-key', 'apikey', 'private_key', 'credential',
]
// Short words that are also inside ordinary words (bypass, compass, OLDPWD): they count only as a
// whole part of the name. The long words still count inside a name: PGPASSWORD is PostgreSQL's
// standard password variable and dbpassword an existing pinned sample, and a before-edge rule on
// every word would miss both (coordinator accepted, last fix round, 2026-10-23).
const WHOLE_PART_WORDS: ReadonlySet<string> = new Set(['pass', 'pwd'])

function isNameChar(ch: string): boolean {
  return /^[A-Za-z0-9_-]$/.test(ch)
}

function isPartEdge(ch: string): boolean {
  return ch === '' || ch === '_' || ch === '-'
}

/**
 * A credential word anywhere in the name (so aws_secret_access_key, GITHUB_ACCESS_TOKEN and
 * dbpassword count), followed only by _- joined parts (so Secretary and passwords do not).
 * Plain schema text such as "auth_token: optional string" passes on its value (review findings).
 */
function isCredentialName(name: string): boolean {
  const lower = name.toLowerCase()
  for (const word of CREDENTIAL_WORDS) {
    for (let at = lower.indexOf(word); at >= 0; at = lower.indexOf(word, at + 1)) {
      if (!isPartEdge(lower.charAt(at + word.length))) continue
      if (WHOLE_PART_WORDS.has(word) && !isPartEdge(lower.charAt(at - 1))) continue
      return true
    }
  }
  return false
}

type Span = { from: number; to: number }

// A value ends at whitespace or a quote. Inside a reference value, & and ; end it too: a URL query
// or a shell line holds several pairs, and each one is judged on its own, while a value read to the
// end would let a later :// make the whole tail a reference (review of the last fix round,
// 2026-10-23). Outside a reference they do not end it: a password can hold & or ;.
const VALUE_END = /[\s"']/
const INNER_VALUE_END = /[\s"'&;]/

/**
 * Where the value sits after each : or = in text[lo, hi) whose name (the word just before it,
 * spaces allowed between) is a credential name. A value is read only after its name passes, and
 * the scan resumes after that value, so each character is visited a bounded number of times: a
 * long line full of separators (a=1&b=2&...) costs one pass, not one pass per separator (review
 * finding, 2026-10-23). The bounds let the same scan run inside one value.
 */
function* credentialSpans(text: string, lo: number, hi: number, valueEnd: RegExp): Generator<Span> {
  for (let sep = lo; sep < hi; sep += 1) {
    const ch = text.charAt(sep)
    if (ch !== ':' && ch !== '=') continue
    let end = sep
    while (end > lo && /\s/.test(text.charAt(end - 1))) end -= 1
    let start = end
    while (start > lo && isNameChar(text.charAt(start - 1))) start -= 1
    if (!isCredentialName(text.slice(start, end))) continue
    let from = sep + 1
    while (from < hi && /\s/.test(text.charAt(from))) from += 1
    if (text.charAt(from) === '"' || text.charAt(from) === "'") from += 1
    let to = from
    while (to < hi && !valueEnd.test(text.charAt(to))) to += 1
    yield { from, to }
    // Separators inside this value belong to it; credentialValueIsSecret scans them when it is a reference.
    sep = Math.max(sep, to - 1)
  }
}

/** The sentence's own punctuation is not part of the value ("my password=Xk29fjs82kdQ."). */
function stripTrailingPunctuation(value: string): string {
  let end = value.length
  while (end > 0 && '.,;:!?)'.includes(value.charAt(end - 1))) end -= 1
  return value.slice(0, end)
}

/**
 * A value that names where a secret lives instead of holding it: a URL, an env reference
 * (${...}, $UPPER_CASE, or a start of process.env., os.environ or secrets.), a home path, an
 * absolute path in a path shape, a lowercase dotted identifier (req.headers.authorization), or a
 * path with a / that ends in a file extension. A dot, a $ or a / alone proves nothing
 * (Hunter2.Xk9fj, $ecretPa55word, base64 secrets such as AWS secret keys, which hold / and can
 * start with it). Each shape has a test (fix rounds of 2026-10-23).
 */
function isReference(value: string): boolean {
  // A URL that carries a user and password never gets here as a reference: looksSecret refuses
  // the whole text through hasUrlCredentials before any value is judged.
  if (value.includes('://')) return true
  if (/^\$(?:\{|[A-Z_][A-Z0-9_]*(?![A-Za-z0-9]))/.test(value)) return true
  // Anchored at the start (last fix round, 2026-10-23): Xk29fjs82kdQsecrets.x holds the word, not a
  // reference. ${{ secrets.X }} is already a reference through the ${ rule above.
  if (value.startsWith('process.env.') || value.startsWith('os.environ') || value.startsWith('secrets.')) return true
  // A / start is a path only in a path shape: base64 secrets can start with / too.
  if (value.startsWith('/') ? isPathShape(value) : value.startsWith('~')) return true
  if (isCodeReference(value)) return true
  const slash = value.lastIndexOf('/')
  if (slash < 0) return false
  const segment = value.slice(slash + 1)
  const dot = segment.lastIndexOf('.')
  return dot >= 0 && /^[A-Za-z][A-Za-z0-9]{0,7}$/.test(segment.slice(dot + 1))
}

/**
 * scheme://user:pass@ anywhere in the text, credential name or not (CPV round, 2026-10-23).
 * Plain string steps per "://", so the scan stays linear (no regex backtracking).
 */
function hasUrlCredentials(text: string): boolean {
  for (let at = text.indexOf('://'); at >= 0; at = text.indexOf('://', at + 3)) {
    let start = at
    while (start > 0 && /^[A-Za-z0-9+.-]$/.test(text.charAt(start - 1))) start -= 1
    if (start === at || !/^[A-Za-z]$/.test(text.charAt(start))) continue
    let end = at + 3
    // The authority ends at /, ? or # (RFC 3986), so an @ in a path or a query is not a user.
    while (end < text.length && !/[\s/?#"']/.test(text.charAt(end))) end += 1
    const authority = text.slice(at + 3, end)
    const userinfo = authority.slice(0, Math.max(authority.lastIndexOf('@'), 0))
    // An empty user counts (redis://:pass@host); an empty password does not (user:@host).
    const colon = userinfo.indexOf(':')
    if (colon >= 0 && colon < userinfo.length - 1) return true
  }
  return false
}

/** /a/b with two or more segments of [A-Za-z0-9._-], one of them all lowercase letters. */
function isPathShape(value: string): boolean {
  const segments = value.slice(1).split('/')
  return segments.length >= 2
    && segments.every((segment) => /^[A-Za-z0-9._-]+$/.test(segment))
    && segments.some((segment) => /^[a-z]+$/.test(segment))
}

/** A lowercase dotted identifier such as req.headers.authorization is code, not a secret. */
function isCodeReference(value: string): boolean {
  const parts = value.split('.')
  return parts.length >= 2 && parts.every((part) => /^[a-z_$]+$/.test(part))
}

/** Letters and digits, or 16 characters or more: what a password or key looks like. */
function looksRandom(value: string): boolean {
  if (value.length >= 16) return true
  return value.length >= 8 && /\d/.test(value) && /[A-Za-z]/.test(value)
}

type Verdict = 'secret' | 'reference' | 'plain'

function judge(text: string, span: Span): Verdict {
  const bare = stripTrailingPunctuation(text.slice(span.from, span.to))
  if (isReference(bare)) return 'reference'
  return looksRandom(bare) ? 'secret' : 'plain'
}

function credentialValueIsSecret(text: string): boolean {
  for (const outer of credentialSpans(text, 0, text.length, VALUE_END)) {
    const verdict = judge(text, outer)
    if (verdict === 'secret') return true
    // A reference can carry pairs of its own (a URL's ?access_token=..., $KEY;token=...): judge each
    // of them once (last fix round, 2026-10-23). One level only: scanning inside an inner reference
    // again would make a long chain of references quadratic. A plain value needs no inner scan: an
    // inner pair that looks random makes the whole value at least as long and random, so it is
    // already 'secret'.
    if (verdict === 'reference') {
      for (const inner of credentialSpans(text, outer.from, outer.to, INNER_VALUE_END)) {
        if (judge(text, inner) === 'secret') return true
      }
    }
  }
  return false
}

/**
 * HTTP basic auth: "basic" and a base64 token, counted only after authorization and : or =, or when
 * the token holds a digit, +, / or =. Ordinary requirement text says "basic internationalization",
 * a long word of letters only, which an unconditional pattern refused (coordinator, 2026-10-23).
 */
function hasBasicCredential(text: string): boolean {
  // Local, so the g flag's lastIndex never leaks between calls. \s+ and the token class share no
  // character and the class excludes =, so no quantifier overlaps another (CPV REGEX_DOS).
  const basic = /\bbasic\s+([A-Za-z0-9+/]{16,}={0,2})/gi
  for (let match = basic.exec(text); match !== null; match = basic.exec(text)) {
    if (/[0-9+/=]/.test(match[1] ?? '')) return true
    if (followsAuthorization(text, match.index)) return true
  }
  return false
}

/** authorization, optional spaces, : or =, optional spaces, then at (Proxy-Authorization counts). */
function followsAuthorization(text: string, at: number): boolean {
  let end = at
  while (end > 0 && /\s/.test(text.charAt(end - 1))) end -= 1
  // At the start charAt(-1) is '', which is neither : nor =.
  const sep = text.charAt(end - 1)
  if (sep !== ':' && sep !== '=') return false
  end -= 1
  while (end > 0 && /\s/.test(text.charAt(end - 1))) end -= 1
  const word = 'authorization'
  return text.slice(Math.max(0, end - word.length), end).toLowerCase() === word
}

export function looksSecret(text: string): boolean {
  return SECRET_PATTERNS.some((re) => re.test(text))
    || hasUrlCredentials(text)
    || hasBasicCredential(text)
    || credentialValueIsSecret(text)
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
