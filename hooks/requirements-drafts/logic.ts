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
  /** e.origin.kind: where the prompt came from; PERSON_ORIGINS lists the kinds the person sends. */
  originKind: string
  hasCommand: boolean
  isMeta: boolean
  text: string
}

// The origins of a message the person sent: Enter at the terminal (composer), Remote Control
// (bridge) and an SDK host's turn (sdk). User ruling 2026-10-24: the option "should appear on all
// messages as long the plugin is installed and enabled", read as every message of the person's
// own, not assistant, task, peer or unclassified rows. The Desktop app is an SDK host: as
// measured by the coordinator across recent transcripts on 2026-10-24, it stores the person's
// messages with origin human and promptSource sdk, scheduled and cron prompts with origin null and
// promptSource system, and task notifications as task-notification. How those stored values render
// as UserMessage origin.kind is not verified. Widening is safe because nothing is saved on its own:
// a save needs a click or a command.
const PERSON_ORIGINS: ReadonlySet<string> = new Set(['composer', 'bridge', 'sdk'])

/** Only text the person sent counts: no slash command, no meta, task, peer or plugin prompt. */
export function shouldRecord(facts: SubmitFacts): boolean {
  if (facts.raisedBy !== 'engine') return false
  if (!PERSON_ORIGINS.has(facts.originKind)) return false
  if (facts.hasCommand || facts.isMeta) return false
  const text = facts.text.trim()
  return text !== '' && !text.startsWith('/')
}

/** Newest first, one entry per text, at most MAX_RECENT. */
export function pushRecent(list: readonly string[], text: string): string[] {
  return [text, ...list.filter((t) => t !== text)].slice(0, MAX_RECENT)
}

/** The row button is drawn only under a message the person sent that already has its real id. */
export function rowIsSaveable(originKind: string, requestId: string): boolean {
  return PERSON_ORIGINS.has(originKind) && requestId !== '' && requestId !== PLACEHOLDER_ID
}

export type SwitchAnswer = { enabled: boolean; text: string } | { usage: string }

/** /requirements-drafts with no argument toggles; on and off set; anything else gets usage. */
export function parseSwitch(args: string, current: boolean): SwitchAnswer {
  const arg = args.trim().toLowerCase()
  const next = arg === '' ? !current : arg === 'on' ? true : arg === 'off' ? false : undefined
  if (next === undefined) return { usage: 'Usage: /requirements-drafts [on|off]' }
  return { enabled: next, text: `requirements-drafts is ${next ? 'on' : 'off'}.` }
}

// Shapes of credentials that must never land in a plain file other agents read. Each pattern has at
// most one quantified class between literals that class cannot match (a prefix, a dot, a slash),
// so no two quantifiers compete for the same characters (CPV skillaudit REGEX_DOS).
// cspell:ignore bglpat bxapp
const SECRET_PATTERNS: readonly RegExp[] = [
  // PEM keys and the OpenPGP armor header (-----BEGIN PGP PRIVATE KEY BLOCK-----), 2026-10-24.
  /-----BEGIN [A-Z ]*PRIVATE KEY(?: BLOCK)?-----/,
  // AWS access key ids: AKIA long-term, ASIA temporary (STS), 2026-10-24.
  /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/,
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  /\bsk-ant-[A-Za-z0-9_-]{20,}/,
  /\bsk-[A-Za-z0-9_-]{32,}/,
  /\bxox[abposr]-[A-Za-z0-9-]{10,}/,
  /\bAIza[0-9A-Za-z_-]{35}\b/,
  // Unconditional: a JWT is a secret wherever it sits, dots and all (second fix round, 2026-10-23).
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/,
  /\bbearer\s+[A-Za-z0-9._~+/-]{20,}=*/i,
  // Vendor prefixes that need no credential name before them (review finding M1, 2026-10-24).
  // Stripe secret and restricted keys; pk_ publishable keys are public, so they are not here.
  /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{20,}/,
  // GitLab personal access token, npm token, Hugging Face token.
  /\bglpat-[A-Za-z0-9_-]{20,}/,
  /\bnpm_[A-Za-z0-9]{36,}/,
  /\bhf_[A-Za-z0-9]{30,}/,
  // SendGrid API key: SG.<id>.<secret>.
  /\bSG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{30,}/,
  // Slack app-level token.
  /\bxapp-\d-[A-Za-z0-9-]{10,}/,
  // Webhook and bot URLs that carry their token in the path: Slack, Discord, Telegram.
  /hooks\.slack\.com\/services\/T[A-Za-z0-9]+\/B[A-Za-z0-9]+\/[A-Za-z0-9]{20,}/,
  /discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]{30,}/,
  /api\.telegram\.org\/bot\d+:[A-Za-z0-9_-]{30,}/,
]

// The credential-name rule, written as plain string steps instead of one regex: a repeated group
// followed by more quantified parts is a catastrophic-backtracking risk on long text (CPV
// skillaudit REGEX_DOS, 2026-10-23). The scans below visit each character a bounded number of times.
const CREDENTIAL_WORDS = [
  'password', 'passwd', 'pass', 'pwd', 'passphrase', 'secret', 'token', 'api_key', 'api-key', 'apikey', 'private_key',
  'credential', 'credentials',
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
  const lower = snakeCaseOfCamel(name)
  for (const word of CREDENTIAL_WORDS) {
    for (let at = lower.indexOf(word); at >= 0; at = lower.indexOf(word, at + 1)) {
      if (!isPartEdge(lower.charAt(at + word.length))) continue
      if (WHOLE_PART_WORDS.has(word) && !isPartEdge(lower.charAt(at - 1))) continue
      return true
    }
  }
  return false
}

/**
 * The name lowercased, with _ put where a lowercase letter meets an uppercase one, so a camelCase
 * name has the same parts as its snake_case form: secretKey is secret_key, privateKey is
 * private_key, secretAccessKey is secret_access_key (review finding M3, 2026-10-24). An all-caps
 * or all-lowercase name is unchanged (PGPASSWORD and OLDPWD keep their old verdict), and
 * the continuation after a word must still start a new part (tokenizerConfig stays tokenizer_config).
 * One pass over the name.
 */
function snakeCaseOfCamel(name: string): string {
  let out = ''
  for (let at = 0; at < name.length; at += 1) {
    const ch = name.charAt(at)
    if (at > 0 && /^[A-Z]$/.test(ch) && /^[a-z]$/.test(name.charAt(at - 1))) out += '_'
    out += ch
  }
  return out.toLowerCase()
}

type Span = { from: number; to: number }

// A value ends at whitespace or a quote. Inside a reference value, & and ; end it too: a URL query
// or a shell line holds several pairs, and each one is judged on its own, while a value read to the
// end would let a later :// make the whole tail a reference (review of the last fix round,
// 2026-10-23). Outside a reference they do not end it: a password can hold & or ;.
const VALUE_END = /[\s"']/
const INNER_VALUE_END = /[\s"'&;]/
// A separator like : and =. Written as a code point, not as the character, because the fullwidth
// colon looks like ':' in an editor.
const FULLWIDTH_COLON = String.fromCharCode(0xff1a)

/**
 * Where the value sits after each separator in text[lo, hi) whose name (the word just before it,
 * spaces allowed between) is a credential name. A value is read only after its name passes, and
 * the scan resumes after that value, so each character is visited a bounded number of times: a
 * long line full of separators (a=1&b=2&...) costs one pass, not one pass per separator (review
 * finding, 2026-10-23). The bounds let the same scan run inside one value.
 * Separators: : and =, and the fullwidth colon U+FF1A (typed with an East Asian input method,
 * 2026-10-24). A name may end in one quote ({"password": ...}, 'token': ...): the walk back steps
 * over that one closing quote, never more, so the walk stays bounded (review finding H1, 2026-10-24).
 * := (Go) and => (Ruby, PHP) count as one separator only when a quoted value follows: unquoted, the
 * right side is code (secret := loadFromVault(ctx), password => hashPassword(password)), which a
 * long call would make look random (2026-10-24).
 */
function* credentialSpans(text: string, lo: number, hi: number, valueEnd: RegExp): Generator<Span> {
  for (let sep = lo; sep < hi; sep += 1) {
    const ch = text.charAt(sep)
    if (ch !== ':' && ch !== '=' && ch !== FULLWIDTH_COLON) continue
    let end = sep
    while (end > lo && /\s/.test(text.charAt(end - 1))) end -= 1
    if (end > lo && isQuote(text.charAt(end - 1))) end -= 1
    let start = end
    while (start > lo && isNameChar(text.charAt(start - 1))) start -= 1
    if (!isCredentialName(text.slice(start, end))) continue
    let from = sep + 1
    const pair = (ch === ':' && text.charAt(from) === '=') || (ch === '=' && text.charAt(from) === '>')
    if (pair) from += 1
    while (from < hi && /\s/.test(text.charAt(from))) from += 1
    const quoted = from < hi && isQuote(text.charAt(from))
    if (pair && !quoted) continue
    if (quoted) from += 1
    let to = from
    while (to < hi && !valueEnd.test(text.charAt(to))) to += 1
    yield { from, to }
    // Separators inside this value belong to it; credentialValueIsSecret scans them when it is a reference.
    sep = Math.max(sep, to - 1)
  }
}

function isQuote(ch: string): boolean {
  return ch === '"' || ch === "'"
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
 * (Hunter2.Xk9fj, a $-prefixed word, base64 secrets such as AWS secret keys, which hold / and can
 * start with it). Each shape has a test (fix rounds of 2026-10-23).
 */
function isReference(value: string): boolean {
  // A URL that carries a user and password never gets here as a reference: looksSecret refuses
  // the whole text through hasUrlCredentials before any value is judged.
  if (value.includes('://')) return true
  if (/^\$(?:\{|[A-Z_][A-Z0-9_]*(?![A-Za-z0-9]))/.test(value)) return true
  // Anchored at the start (last fix round, 2026-10-23): random text followed by secrets.x holds the word, not a
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

/** One value outside a name=value pair (a command-line flag's value), judged the way judge judges a pair's value. */
function valueIsSecret(value: string): boolean {
  const bare = stripTrailingPunctuation(value)
  return !isReference(bare) && looksRandom(bare)
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

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/**
 * The leading run of non-control bytes in the base64 decoding of token, or undefined for a character
 * outside the base64 alphabet. Missing padding is tolerated, and so is a 4n+1 length: its last
 * character completes no byte, so the first 4n decode as usual. Rejecting 4n+1 would have saved two
 * pinned leak samples (the +SesameAB and /SesameAB tokens, 2026-10-24). Plain string steps, no regex.
 */
function decodedLeadingRun(token: string): number[] | undefined {
  let end = token.length
  while (end > 0 && token.charAt(end - 1) === '=') end -= 1
  const out: number[] = []
  let bits = 0
  let count = 0
  for (let i = 0; i < end; i += 1) {
    const value = BASE64_ALPHABET.indexOf(token.charAt(i))
    if (value < 0) return undefined
    // A byte is read from the last 12 bits at most, so the 14-bit mask keeps the number small.
    bits = ((bits << 6) | value) & 0x3fff
    count += 6
    if (count >= 8) {
      count -= 8
      const byte = (bits >> count) & 0xff
      // Only control bytes end the run (below 0x20, and DEL): a byte above 0x7E may belong to a
      // UTF-8 user name such as José; decodesToUserPassword checks that it is valid UTF-8.
      if (byte < 0x20 || byte === 0x7f) return out
      out.push(byte)
    }
  }
  return out
}

// The empty-user shape, base64(":" + token), is how a personal access token is sent as Basic. A
// leading colon counts only when the next this-many bytes are printable non-space ASCII (0x21 to
// 0x7E): real PATs and API keys are, while random bytes pass about (94/256)^8, roughly 3e-4. Any
// non-control byte was not enough: it refused about 1 in 3 "basic O..." words, such as
// OpenTelemetryExporter (coordinator, 2026-10-24).
const EMPTY_USER_MIN_SECRET = 8

/** Whether the count bytes from index from are all printable non-space ASCII (0x21 to 0x7E). */
function allPrintableAscii(bytes: readonly number[], from: number, count: number): boolean {
  if (bytes.length < from + count) return false
  for (let at = from; at < from + count; at += 1) {
    const byte = bytes[at] ?? -1
    if (byte < 0x21 || byte > 0x7e) return false
  }
  return true
}
const COLON = 0x3a

/**
 * For a UTF-8 lead byte: how many continuation bytes follow and the range the first of them must
 * fall in (Unicode table 3-7, as RFC 3629 restricts UTF-8: no overlong forms, no surrogates,
 * nothing above U+10FFFF), or undefined for a byte that cannot lead a sequence.
 */
function utf8Lead(lead: number): { follow: number; lo: number; hi: number } | undefined {
  if (lead >= 0xc2 && lead <= 0xdf) return { follow: 1, lo: 0x80, hi: 0xbf }
  if (lead === 0xe0) return { follow: 2, lo: 0xa0, hi: 0xbf }
  if (lead === 0xed) return { follow: 2, lo: 0x80, hi: 0x9f }
  if (lead >= 0xe1 && lead <= 0xef) return { follow: 2, lo: 0x80, hi: 0xbf }
  if (lead === 0xf0) return { follow: 3, lo: 0x90, hi: 0xbf }
  if (lead >= 0xf1 && lead <= 0xf3) return { follow: 3, lo: 0x80, hi: 0xbf }
  if (lead === 0xf4) return { follow: 3, lo: 0x80, hi: 0x8f }
  return undefined
}

/**
 * Whether bytes are valid UTF-8: random high bytes from an ordinary word almost never are, while a
 * real user name is. Plain steps, not TextDecoder: the hooks environment's TextDecoder is declared
 * with a label only (claude-code types, 2.1.309), so a { fatal: true } option is not part of its
 * contract, and a decoder that ignored it would accept every byte run without a word.
 */
function isUtf8(bytes: readonly number[]): boolean {
  let at = 0
  while (at < bytes.length) {
    const lead = bytes[at] ?? -1
    if (lead < 0x80) {
      at += 1
      continue
    }
    const shape = utf8Lead(lead)
    if (shape === undefined || at + shape.follow >= bytes.length) return false
    const first = bytes[at + 1] ?? -1
    if (first < shape.lo || first > shape.hi) return false
    for (let k = 2; k <= shape.follow; k += 1) {
      const next = bytes[at + k] ?? -1
      if (next < 0x80 || next > 0xbf) return false
    }
    at += shape.follow + 1
  }
  return true
}

/**
 * The user:password shape in the leading run: a : at index 1 or later whose bytes before it are
 * valid UTF-8 (so base64("José:pw...") counts), or a leading : whose next EMPTY_USER_MIN_SECRET
 * bytes are printable non-space ASCII. The UTF-8 test keeps ordinary letter tokens saved: by the
 * coordinator's estimate, a run that only stopped at control bytes would refuse about 2-3% of
 * "basic <word>" instead of about 0.1% (review of 2026-10-24, not measured here).
 */
function decodesToUserPassword(token: string): boolean {
  const run = decodedLeadingRun(token)
  if (run === undefined) return false
  if (run[0] === COLON && allPrintableAscii(run, 1, EMPTY_USER_MIN_SECRET)) return true
  const colon = run.indexOf(COLON, 1)
  return colon >= 1 && isUtf8(run.slice(0, colon))
}

/**
 * HTTP basic auth: "basic" and a base64 token, counted after authorization and : or =, or anywhere
 * when the token decodes to user:password. Ordinary text such as "basic internationalization" or
 * "basic read/write/execute" decodes to no such shape, so it is saved. A quoted header
 * ("Authorization": "Basic ...") hides authorization from followsAuthorization, so the decode is
 * what catches it, even with a token of letters only (2026-10-24, replacing the earlier "holds a
 * digit, +, / or =" test, which refused the slash list and missed the quoted header).
 */
function hasBasicCredential(text: string): boolean {
  // Local, so the g flag's lastIndex never leaks between calls. \s+ and the token class share no
  // character and the class excludes =, so no quantifier overlaps another (CPV REGEX_DOS).
  const basic = /\bbasic\s+([A-Za-z0-9+/]{16,}={0,2})/gi
  for (let match = basic.exec(text); match !== null; match = basic.exec(text)) {
    if (decodesToUserPassword(match[1] ?? '')) return true
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

/**
 * Authorization: Token <value> (Django REST framework, GitHub and similar), quoted or not. Gated on
 * authorization before it: an unconditional "token <20+ characters>" would refuse ordinary text such
 * as "token based-authentication-for-the-api". The value must hold a digit and a letter, so a long
 * word ("Token AuthenticationRequiredForAll") is saved (2026-10-24). Each quantifier sits between
 * characters it cannot match, and the token class excludes whitespace, so there is no backtracking
 * blow-up (CPV REGEX_DOS).
 */
function hasTokenAuthorization(text: string): boolean {
  const scheme = /\bauthorization["']?\s*[:=]\s*["']?token\s+([A-Za-z0-9._~+/-]{20,})/gi
  for (let match = scheme.exec(text); match !== null; match = scheme.exec(text)) {
    const value = match[1] ?? ''
    if (/\d/.test(value) && /[A-Za-z]/.test(value)) return true
  }
  return false
}

/**
 * A Docker config "auth" entry ({"auths":{"ghcr.io":{"auth":"<base64>"}}}) whose value decodes to
 * user:password. auth is not a credential word: as a name part it is too common (auth_mode,
 * oauth_scope, auth_required), so the decode is what proves the secret (2026-10-24). The value
 * class excludes " and =, so its quantifiers do not overlap.
 */
function hasDockerAuth(text: string): boolean {
  const entry = /"auth"\s*:\s*"([A-Za-z0-9+/]{8,}={0,2})"/g
  for (let match = entry.exec(text); match !== null; match = entry.exec(text)) {
    if (decodesToUserPassword(match[1] ?? '')) return true
  }
  return false
}

/**
 * A PuTTY private key file: both its first line and its Private-Lines line, each at a line start,
 * so a sentence that names the two ("its Private-Lines: field holds the key") is saved. One
 * quantifier per regex (2026-10-24).
 */
function hasPuttyPrivateKey(text: string): boolean {
  return /^PuTTY-User-Key-File-\d/m.test(text) && /^Private-Lines: *\d/m.test(text)
}

/** A value without one pair of surrounding quotes ("x" or 'x'). */
function unquote(value: string): string {
  const start = value.startsWith('"') || value.startsWith("'") ? 1 : 0
  const end = value.length > start && (value.endsWith('"') || value.endsWith("'")) ? value.length - 1 : value.length
  return value.slice(start, end)
}

/** The password part of a curl -u user:password value is a secret: a value with no colon or an empty password is not. */
function curlUserIsSecret(value: string): boolean {
  const colon = value.indexOf(':')
  return colon >= 0 && valueIsSecret(value.slice(colon + 1))
}

/**
 * Credentials passed as command-line flags, judged per line and per whitespace-separated word, as
 * plain string steps (no regex beyond one whitespace split, so the scan stays linear: CPV REGEX_DOS):
 * - --password <value> or --passwd <value> on any command (docker login, mysql); --password=<value>
 *   is already a name=value pair. A next word starting with - is another flag, not a value.
 * - curl's -u/--user user:password, only on a line holding curl: elsewhere -u means other things
 *   (docker run -u 1000:1000, git push -u origin).
 * - a glued -p<value>, only on a line holding mysql or mariadb: elsewhere -p is a port, a pattern or
 *   parents (psql -p5432, mkdir -pv).
 * Each value is judged like a name=value pair (valueIsSecret). Added 2026-10-24 (review finding M2).
 */
function hasCommandLineCredential(text: string): boolean {
  for (const line of text.split('\n')) {
    const lower = line.toLowerCase()
    const curl = lower.includes('curl')
    const mysql = lower.includes('mysql') || lower.includes('mariadb')
    const words = line.split(/\s+/)
    for (let at = 0; at < words.length; at += 1) {
      const word = words[at] ?? ''
      const next = words[at + 1] ?? ''
      if (word === '--password' || word === '--passwd') {
        if (!next.startsWith('-') && valueIsSecret(unquote(next))) return true
        continue
      }
      if (curl) {
        if ((word === '-u' || word === '--user') && curlUserIsSecret(unquote(next))) return true
        if (word.startsWith('--user=') && curlUserIsSecret(unquote(word.slice('--user='.length)))) return true
        if (word.startsWith('-u') && word.length > 2 && curlUserIsSecret(unquote(word.slice(2)))) return true
      }
      if (mysql && word.startsWith('-p') && word.length > 2 && valueIsSecret(unquote(word.slice(2)))) return true
    }
  }
  return false
}

export function looksSecret(text: string): boolean {
  return SECRET_PATTERNS.some((re) => re.test(text))
    || hasPuttyPrivateKey(text)
    || hasUrlCredentials(text)
    || hasBasicCredential(text)
    || hasTokenAuthorization(text)
    || hasDockerAuth(text)
    || hasCommandLineCredential(text)
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

/** The folder entry names that carry this hash, oldest first within one time zone. */
export function draftsWithHash(names: readonly string[], sha256Hex: string): string[] {
  const tail = `-${sha256Hex.slice(0, 12)}.md`
  return names.filter((n) => n.endsWith(tail)).sort()
}

/** The id of a draft already saved for this hash, from the folder's entry names. */
export function existingDraft(names: readonly string[], sha256Hex: string): string | undefined {
  const found = draftsWithHash(names, sha256Hex)[0]
  return found === undefined ? undefined : found.slice(0, -'.md'.length)
}

const PROJECT_ROOT_KEY = 'project-root'

/**
 * A frontmatter value decoded the way drafts.py decode_value does: a quoted value is JSON-decoded,
 * and a value that is not quoted, or does not decode to a string, is kept as written. The rule is
 * the list skill's own, not a fallback: the duplicate check must file a draft under the same
 * project the list shows it under.
 */
function frontmatterValue(raw: string): string {
  if (!raw.startsWith('"')) return raw
  let decoded: unknown
  try {
    decoded = JSON.parse(raw)
  } catch {
    return raw
  }
  return typeof decoded === 'string' ? decoded : raw
}

/**
 * The project-root a draft names, read as drafts.py split_frontmatter reads it: a first line of
 * ---, top-level key: value lines, a closing ---. undefined when the text has no frontmatter, no
 * closing fence or no project-root line. Every draft the mod has written carries the field: the
 * frontmatter has been the same since the mod's first commit (ac621e6).
 */
function draftProjectRoot(draft: string): string | undefined {
  const lines = draft.split('\n')
  if (lines[0]?.trim() !== '---') return undefined
  let root: string | undefined
  for (const line of lines.slice(1)) {
    if (line.trim() === '---') return root
    const colon = line.indexOf(':')
    if (colon < 0 || line.startsWith(' ')) continue
    if (line.slice(0, colon).trim() === PROJECT_ROOT_KEY) root = frontmatterValue(line.slice(colon + 1).trim())
  }
  return undefined
}

/**
 * True when a saved draft belongs to this project: its project-root is this one, exactly
 * (review finding M6, 2026-10-24). The list skill shows a draft only under its project-root, so a
 * draft saved from another project is not "already saved" here: answering so would leave this
 * project's list without it. An empty root names no project, and the list never matches one.
 */
export function draftIsFromProject(draft: string, projectRoot: string): boolean {
  return projectRoot !== '' && draftProjectRoot(draft) === projectRoot
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
