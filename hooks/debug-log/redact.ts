// The secret masker of the debug logs (PRRD G14.1). redact() replaces each secret value in a text
// by a label naming its kind, [REDACTED:<kind>], and keeps the rest as written. Pure functions, no
// `$`, so each rule is tested as a plain function (hooks/tests/redact.test.ts). The patterns adapt
// mods/safety/secret-shield of Singh-AP/awesome-claude-mods (see NOTICE).

// Each kind of secret a label can name, in the rules' order. A redacted value is replaced by a label
// naming its kind, [REDACTED:<kind>] (owner ruling of 2026-11-03, "use the secret shield style",
// which replaced the same-length mask of 2026-10-31). The kinds that the secret-shield mod also has
// keep its names (see NOTICE); the others name shapes only this file looks for.
// cspell:ignore huggingface sendgrid
const KINDS = [
  'private-key',
  'putty-key',
  'aws-access-key',
  'github-token',
  'anthropic-key',
  'openai-key',
  'slack-token',
  'slack-app-token',
  'slack-webhook',
  'discord-webhook',
  'telegram-bot-token',
  'stripe-key',
  'google-api-key',
  'gitlab-token',
  'npm-token',
  'pypi-token',
  'huggingface-token',
  'sendgrid-key',
  'jwt',
  'bearer-token',
  'basic-credentials',
  'docker-auth',
  'hex-key',
  'url-password',
  'cli-password',
  'query-key',
  'assignment',
] as const

export type Kind = (typeof KINDS)[number]

// Shapes of credentials that must never land in a plain file other agents read. A text holding
// one keeps its other text, with the value redacted, never refused (owner ruling 2026-10-31). The value is the
// pattern's capture group 1 when it has one, else the whole match: a vendor token is a secret, its
// prefix included (ghp_..., sk-..., AKIA...), while a scheme word or a URL's host and path stay
// readable (Bearer, hooks.slack.com/services/...). Each pattern has at most one quantified class
// between literals that class cannot match (a prefix, a dot, a slash), so no two quantifiers compete
// for the same characters (CPV skillaudit REGEX_DOS). That alone does not keep a scan linear: the
// number of places a scan can start counts too (see the JWT pattern). The g flag finds every match,
// and d gives group 1 its offsets. Each pattern names the kind its label shows; when two spans start
// together the one found first keeps its kind (redact), so a specific shape comes before a general
// one (sk-ant- before sk-).
// cspell:ignore bglpat bxapp encryptionkey signingkey JSESSIONID whsec bpypi
const SECRET_PATTERNS: readonly { kind: Kind; pattern: RegExp }[] = [
  // AWS access key ids: AKIA long-term, ASIA temporary (STS), 2026-10-24.
  { kind: 'aws-access-key', pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { kind: 'github-token', pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b/g },
  { kind: 'github-token', pattern: /\bgithub_pat_[A-Za-z0-9_]{40,}\b/g },
  { kind: 'anthropic-key', pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}/g },
  { kind: 'openai-key', pattern: /\bsk-[A-Za-z0-9_-]{32,}/g },
  { kind: 'slack-token', pattern: /\bxox[abposr]-[A-Za-z0-9-]{10,}/g },
  { kind: 'google-api-key', pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  // Unconditional: a JWT is a secret wherever it sits, dots and all (second fix round, 2026-10-23).
  // It starts after a lookbehind, not at \b (2026-11-03). The cause of the old slowness was how many
  // positions a scan could start from, not quantifiers competing for characters: the class holds -,
  // and \b holds after every -, so on -eyJ-eyJ-eyJ... every eyJ was a start, each start read the rest
  // of the run before failing at the missing dot, and the time grew with the square of the length (75
  // ms at 12.5 KB, 3514 ms at 100 KB, measured on 2026-11-01). With no class character allowed before
  // it, a scan starts once per run of class characters. The cost: a JWT glued to a - or a word
  // character before it (abc-eyJ...) is not found by this pattern.
  { kind: 'jwt', pattern: /(?<![A-Za-z0-9_-])eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g },
  // The value after a bare Bearer, whatever its length or shape (verify round of 2026-10-31: the
  // 20-character floor saved Bearer abc.def.ghi in clear). The space run and the value class share no
  // character; the value ends at whitespace, a quote or a backslash (an escaped JSON quote).
  { kind: 'bearer-token', pattern: /\bbearer[ \t]+([^\s"'\\]+)/dgi },
  // A bare run of 64 or more hex digits, 0x allowed: a 256-bit key or a digest (SHA-256, an Ethereum
  // private key), verify round of 2026-10-31. A run of 63 or fewer stays readable: a git SHA-1 is 40,
  // an MD5 32, an Ethereum address 0x and 40. A UUID stays readable too: its dashes cut it into runs of
  // 12 or fewer. \b on both sides, so a run inside a longer word (key_<hex>) does not count here. One
  // quantified class between word boundaries: a long run is read once. The value is the hex digits:
  // a 0x before them stays readable.
  { kind: 'hex-key', pattern: /\b(?:0x)?([0-9A-Fa-f]{64,})\b/dg },
  // Vendor prefixes that need no credential name before them (review finding M1, 2026-10-24).
  // Stripe secret and restricted keys; pk_ publishable keys are public, so they are not here.
  { kind: 'stripe-key', pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{20,}/g },
  // A Stripe webhook signing secret (adapted from the secret-shield mod, see NOTICE). The class has no
  // _ and \b does not hold after one, so whsec_whsec_... has a single place to start.
  { kind: 'stripe-key', pattern: /\bwhsec_[A-Za-z0-9]{24,}/g },
  // GitLab personal access token, npm token, Hugging Face token.
  { kind: 'gitlab-token', pattern: /\bglpat-[A-Za-z0-9_-]{20,}/g },
  { kind: 'npm-token', pattern: /\bnpm_[A-Za-z0-9]{36,}/g },
  { kind: 'huggingface-token', pattern: /\bhf_[A-Za-z0-9]{30,}/g },
  // A PyPI API token: pypi-AgE starts the base64 of its macaroon (adapted from the secret-shield mod,
  // see NOTICE). Nothing follows the class, so a scan either succeeds and takes the rest of the run or
  // fails within 50 characters: on -pypi-AgE-pypi-AgE... the first start takes the whole run.
  { kind: 'pypi-token', pattern: /\bpypi-AgE[A-Za-z0-9_-]{50,}/g },
  // SendGrid API key: SG.<id>.<secret>.
  { kind: 'sendgrid-key', pattern: /\bSG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{30,}/g },
  // Slack app-level token.
  { kind: 'slack-app-token', pattern: /\bxapp-\d-[A-Za-z0-9-]{10,}/g },
  // Webhook and bot URLs that carry their token in the path: Slack, Discord, Telegram. The token is
  // the value; the host, the path and the ids before it stay readable.
  { kind: 'slack-webhook', pattern: /hooks\.slack\.com\/services\/T[A-Za-z0-9]+\/B[A-Za-z0-9]+\/([A-Za-z0-9]{20,})/dg },
  { kind: 'discord-webhook', pattern: /discord(?:app)?\.com\/api\/webhooks\/\d+\/([A-Za-z0-9_-]{30,})/dg },
  { kind: 'telegram-bot-token', pattern: /api\.telegram\.org\/bot\d+:([A-Za-z0-9_-]{30,})/dg },
]

/** Where group 1 of a match sits; the pattern must carry the d flag. */
function groupSpan(match: RegExpExecArray): Span {
  const at = match.indices?.[1]
  // A pattern without d, or without a group 1, is a bug in this file: fail the save loudly rather
  // than redact the wrong characters.
  if (at === undefined) throw new Error('redact: a secret pattern has no d flag or no group 1')
  return { from: at[0], to: at[1] }
}

/** The value of every SECRET_PATTERNS match, with its kind: group 1 when the pattern has one, else the whole match. */
function* patternSpans(text: string): Generator<Found> {
  for (const { kind, pattern } of SECRET_PATTERNS) {
    // A copy per call, so the shared pattern's lastIndex never leaks between calls.
    const re = new RegExp(pattern)
    for (let match = re.exec(text); match !== null; match = re.exec(text)) {
      const span = match.length > 1 ? groupSpan(match) : { from: match.index, to: match.index + match[0].length }
      yield { ...span, kind }
    }
  }
}

// The BEGIN and END lines of a PEM private key or an OpenPGP private key block (-----BEGIN PGP
// PRIVATE KEY BLOCK-----, 2026-10-24). [A-Z ]* is the pre-existing header shape: quadratic only on
// a long all-caps line (accepted gap of 2026-10-24).
const KEY_BEGIN = /-----BEGIN [A-Z ]*PRIVATE KEY(?: BLOCK)?-----/g
const KEY_END = /-----END [A-Z ]*PRIVATE KEY(?: BLOCK)?-----/g

/**
 * Yields what lies between each private key's BEGIN and END lines, with leading and trailing
 * whitespace dropped; one label then replaces the whole body, its line breaks included. A block
 * whose END line is missing (a paste cut short) is covered up to the last character of the input,
 * while a header followed by nothing yields no span. Each new BEGIN search starts past the previous
 * body, which keeps the whole pass linear in the input length.
 */
function* keyBlockSpans(text: string): Generator<Span> {
  const begin = new RegExp(KEY_BEGIN)
  const end = new RegExp(KEY_END)
  for (let head = begin.exec(text); head !== null; head = begin.exec(text)) {
    end.lastIndex = begin.lastIndex
    const tail = end.exec(text)
    yield* trimmed(text, begin.lastIndex, tail === null ? text.length : tail.index)
    begin.lastIndex = tail === null ? text.length : end.lastIndex
  }
}

/** The span from..to without the whitespace at either end, when anything is left. */
function* trimmed(text: string, from: number, to: number): Generator<Span> {
  let start = from
  let end = to
  while (start < end && /\s/.test(text.charAt(start))) start += 1
  while (end > start && /\s/.test(text.charAt(end - 1))) end -= 1
  if (end > start) yield { from: start, to: end }
}

// The credential-name rule, written as plain string steps instead of one regex: a repeated group
// followed by more quantified parts is a catastrophic-backtracking risk on long text (CPV
// skillaudit REGEX_DOS, 2026-10-23). The scans below visit each character a bounded number of times.
const CREDENTIAL_WORDS = [
  'password', 'passwd', 'pass', 'pwd', 'passphrase', 'secret', 'token', 'api_key', 'api-key', 'apikey', 'private_key',
  'credential', 'credentials',
  // Left out on 2026-10-24 for the user to rule on, in since 2026-10-31, when a false match came to
  // redact a value instead of refusing the message: a session cookie value (sessionid=..., JSESSIONID),
  // an encryption or signing key (ENCRYPTION_KEY, JWT_SIGNING_KEY) and an auth value (AUTH=,
  // BASIC_AUTH=).
  'sessionid', 'encryption_key', 'encryption-key', 'encryptionkey', 'signing_key', 'signing-key', 'signingkey', 'auth',
  // An Authorization header, plain or as a key (verify round of 2026-10-31): its value is redacted
  // whatever its shape, a scheme word before it kept readable (valueSpans).
  'authorization',
]
// Short words that are also inside ordinary words (bypass, compass, OLDPWD, oauth): they count only
// as a whole part of the name. The long words still count inside a name: PGPASSWORD is PostgreSQL's
// standard password variable and dbpassword an existing pinned sample, and a before-edge rule on
// every word would miss both (coordinator accepted, last fix round, 2026-10-23).
const WHOLE_PART_WORDS: ReadonlySet<string> = new Set(['pass', 'pwd', 'auth'])

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

// HTTP authentication scheme words: the common ones of the IANA registry, plus Token, Bot, SSWS and
// ApiKey, which vendors use. After a credential name or an Authorization header, a scheme word with a
// value after it stays readable and that value is the secret (verify round of 2026-10-31).
// cspell:ignore dpop hoba ntlm ssws vapid
const AUTH_SCHEMES: ReadonlySet<string> = new Set([
  'basic', 'bearer', 'token', 'digest', 'negotiate', 'ntlm', 'dpop',
  'hoba', 'mutual', 'oauth', 'vapid', 'bot', 'ssws', 'apikey',
])

function isScheme(word: string): boolean {
  return AUTH_SCHEMES.has(word.toLowerCase())
}

/** An Authorization header name: Authorization, Proxy-Authorization, HTTP_AUTHORIZATION, X-Authorization. */
function isAuthorizationName(name: string): boolean {
  return snakeCaseOfCamel(name).endsWith('authorization')
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
// A secret value found by one rule, with the kind its label names.
type Found = Span & { kind: Kind }
// A credential value, sure when it follows a scheme word or an Authorization header: redacted then
// whatever its shape, a reference shape included (verify round of 2026-10-31).
type CredentialSpan = Span & { sure: boolean }
// The value after one credential name: about when the name describes a secret instead of holding one
// (isAboutName), quoted when the value sits inside quotes.
type NamedSpan = CredentialSpan & { about: boolean; quoted: boolean }

// An unquoted value ends at whitespace or a quote, but not at a quote escaped by a backslash
// (password=abc\"def is one value, review of 2026-10-31). Inside a reference value, & and ; end it
// too: a URL query or a shell line holds several pairs, and each one is judged on its own, while a
// value read to the end would let a later :// make the whole tail a reference (review of the last
// fix round, 2026-10-23). Outside a reference they do not end it: a password can hold & or ;.
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
 * 2026-10-24). A name may end in one quote ({"password": ...}, 'token': ...), plain or escaped by
 * backslashes as in an escaped JSON line ({\"password\": ...}, review of 2026-10-31): the walk back
 * steps over that one closing quote and the backslashes right before it, never more, so the walk
 * stays bounded (review finding H1, 2026-10-24). A quoted value runs to its closing quote, spaces
 * included (password: "correct horse battery staple"), and an escaped quote does not close it
 * (quotedValueEnd, review of 2026-10-31).
 * := (Go) and => (Ruby, PHP) count as one separator only when a quoted value follows: unquoted, the
 * right side is code (secret := loadFromVault(ctx), password => hashPassword(password)), an
 * expression and not a value (2026-10-24). After a :, a TypeScript type annotation (apiKey: string =
 * "...") is stepped over, so the value is the one after its = (afterTypeAnnotation).
 */
function* credentialSpans(text: string, lo: number, hi: number, valueEnd: RegExp): Generator<NamedSpan> {
  for (let sep = lo; sep < hi; sep += 1) {
    const ch = text.charAt(sep)
    if (ch !== ':' && ch !== '=' && ch !== FULLWIDTH_COLON) continue
    // == is a comparison, not a separator (if password == other): the next = then has no name before it.
    if (ch === '=' && text.charAt(sep + 1) === '=') continue
    let end = sep
    while (end > lo && /\s/.test(text.charAt(end - 1))) end -= 1
    if (end > lo && isQuote(text.charAt(end - 1))) {
      end -= 1
      while (end > lo && text.charAt(end - 1) === '\\') end -= 1
    }
    let start = end
    while (start > lo && isNameChar(text.charAt(start - 1))) start -= 1
    const name = text.slice(start, end)
    if (!isCredentialName(name)) continue
    let from = sep + 1
    const pair = (ch === ':' && text.charAt(from) === '=') || (ch === '=' && text.charAt(from) === '>')
    if (pair) from += 1
    while (from < hi && /\s/.test(text.charAt(from))) from += 1
    if (ch === ':' && !pair) from = afterTypeAnnotation(text, from, hi)
    const opener = quoteOpener(text, from, hi)
    if (pair && opener === undefined) continue
    let last = from
    const about = isAboutName(name)
    for (const span of valueSpans(text, from, hi, valueEnd, opener, isAuthorizationName(name))) {
      yield { ...span, about, quoted: opener !== undefined }
      last = Math.max(last, span.to)
    }
    // Separators inside this value belong to it; credentialValueSpans scans them when it is no secret.
    sep = Math.max(sep, last - 1)
  }
}

/**
 * Where the value starts after a TypeScript type annotation, const apiKey: string = "..." (adapted
 * from the secret-shield mod, see NOTICE): at from, unless a type word, spaces or tabs and a lone =
 * follow it, and then after that = and its spaces. The type word starts with a letter and holds
 * letters, digits and _ < > [ ] | (string, Array<string>, string|null). A space before the = is
 * required, so an unquoted value holding an = (password: abc=def) stays one value. The type word
 * cannot hold a separator, so no character is read by two annotations.
 */
function afterTypeAnnotation(text: string, from: number, hi: number): number {
  if (!/[A-Za-z]/.test(text.charAt(from))) return from
  let at = from
  while (at < hi && /[A-Za-z0-9_<>[\]|]/.test(text.charAt(at))) at += 1
  let next = at
  while (next < hi && (text.charAt(next) === ' ' || text.charAt(next) === '\t')) next += 1
  const after = text.charAt(next + 1)
  if (next === at || next >= hi || text.charAt(next) !== '=' || after === '=' || after === '>') return from
  next += 1
  while (next < hi && (text.charAt(next) === ' ' || text.charAt(next) === '\t')) next += 1
  return next
}

/**
 * The value at from, after a credential name's separator: quoted, it runs to its closing quote;
 * unquoted, to valueEnd. A scheme word (Bearer, Basic, Token...) followed on the same line, or inside
 * the quotes, by a value stays readable, and the value after it is the secret whatever its shape
 * (token: Bearer abc.def.ghi). After an Authorization header the value is redacted whatever its
 * shape, and when its first word is no known scheme both words are: Authorization: Custom abc123
 * holds its key in either (verify round of 2026-10-31). Every other value is judged by
 * credentialValueSpans. A second word is read at most once more, so the scan stays linear.
 */
function* valueSpans(
  text: string,
  from: number,
  hi: number,
  valueEnd: RegExp,
  opener: { quote: string; length: number } | undefined,
  header: boolean,
): Generator<CredentialSpan> {
  if (opener !== undefined) {
    const start = from + opener.length
    const to = quotedValueEnd(text, start, hi, opener.quote, opener.length > 1)
    const value = afterScheme(text, start, to)
    yield { from: value, to, sure: header || value > start }
    return
  }
  const to = unquotedValueEnd(text, from, hi, valueEnd)
  let next = to
  while (next < hi && (text.charAt(next) === ' ' || text.charAt(next) === '\t')) next += 1
  const second = next > to && next < hi && !valueEnd.test(text.charAt(next))
    ? { from: next, to: unquotedValueEnd(text, next, hi, valueEnd), sure: true }
    : undefined
  const scheme = isScheme(text.slice(from, to))
  if (scheme && second !== undefined) {
    yield second
    return
  }
  // A lone scheme word after an Authorization header (a header that names only its scheme, such as
  // Bearer) holds no secret.
  if (scheme && header) return
  yield { from, to, sure: header }
  if (header && second !== undefined) yield second
}

/**
 * Where a quoted value starts: after a leading scheme word and its spaces when something follows them
 * inside the quotes ("Bearer abc.def"), else at from, so the whole quoted text is the value.
 */
function afterScheme(text: string, from: number, to: number): number {
  let end = from
  while (end < to && /[A-Za-z]/.test(text.charAt(end))) end += 1
  if (!isScheme(text.slice(from, end))) return from
  let next = end
  while (next < to && (text.charAt(next) === ' ' || text.charAt(next) === '\t')) next += 1
  return next > end && next < to ? next : from
}

function isQuote(ch: string): boolean {
  return ch === '"' || ch === "'"
}

/** The quote that opens a value at from: " or ', or one escaped by a backslash (\" in an escaped JSON line). */
function quoteOpener(text: string, from: number, hi: number): { quote: string; length: number } | undefined {
  const ch = text.charAt(from)
  if (from < hi && isQuote(ch)) return { quote: ch, length: 1 }
  const next = text.charAt(from + 1)
  if (ch === '\\' && from + 1 < hi && isQuote(next)) return { quote: next, length: 2 }
  return undefined
}

/**
 * Where a quoted value ends: at its closing quote, or at a line break or hi when the quote is never
 * closed. A backslash escapes the next character, so a quote after an odd run of backslashes is
 * part of the value (a\"b). In an escaped JSON line (a value opened by \"), the closing quote is \"
 * itself: a quote after a run of 1, 5, 9... backslashes closes the value, and one after any other run
 * is part of it (\\\" decodes to \", an escaped quote inside the value). When in doubt the value runs
 * on: reading too far redacts more, reading too little leaks (review of 2026-10-31). One pass.
 */
function quotedValueEnd(text: string, from: number, hi: number, quote: string, escaped: boolean): number {
  let run = 0
  for (let at = from; at < hi; at += 1) {
    const ch = text.charAt(at)
    if (ch === '\n' || ch === '\r') return at
    if (ch === quote && !escaped && run % 2 === 0) return at
    if (ch === quote && escaped && run % 4 === 1) return at - 1
    run = ch === '\\' ? run + 1 : 0
  }
  return hi
}

/** Where an unquoted value ends: at the first character valueEnd matches, but never at a quote after an odd run of backslashes. */
function unquotedValueEnd(text: string, from: number, hi: number, valueEnd: RegExp): number {
  let run = 0
  for (let at = from; at < hi; at += 1) {
    const ch = text.charAt(at)
    if (valueEnd.test(ch) && !(isQuote(ch) && run % 2 === 1)) return at
    run = ch === '\\' ? run + 1 : 0
  }
  return hi
}

/** The sentence's own punctuation is not part of the value ("my password=Xk29fjs82kdQ."). */
function stripTrailingPunctuation(value: string): string {
  let end = value.length
  while (end > 0 && '.,;:!?)'.includes(value.charAt(end - 1))) end -= 1
  return value.slice(0, end)
}

/**
 * A value that names where a secret lives instead of holding it: a URL, an env reference
 * (${...}, $UPPER_CASE, or a start of process.env., os.environ or secrets.), a home path (~/...), an
 * absolute path in a path shape, a lowercase dotted identifier (req.headers.authorization), or a
 * path with a / that ends in a file extension. A dot, a $ or a / alone proves nothing
 * (Hunter2.Xk9fj, a $-prefixed word, base64 secrets such as AWS secret keys, which hold / and can
 * start with it). Each shape has a test (fix rounds of 2026-10-23).
 */
function isReference(value: string): boolean {
  // A URL that carries a user and password is a reference here too: urlPasswordSpans redacts its
  // password on its own, wherever the URL sits.
  if (value.includes('://')) return true
  if (/^\$(?:\{|[A-Z_][A-Z0-9_]*(?![A-Za-z0-9]))/.test(value)) return true
  // Anchored at the start (last fix round, 2026-10-23): random text followed by secrets.x holds the word, not a
  // reference. ${{ secrets.X }} is already a reference through the ${ rule above.
  if (value.startsWith('process.env.') || value.startsWith('os.environ') || value.startsWith('secrets.')) return true
  // A / start is a path only in a path shape: base64 secrets can start with / too.
  // A home path starts with ~/: a ~ alone proves nothing, a password can start with it (review of 2026-10-31).
  if (value.startsWith('/') ? isPathShape(value) : value.startsWith('~/')) return true
  if (isCodeReference(value)) return true
  const slash = value.lastIndexOf('/')
  if (slash < 0) return false
  const segment = value.slice(slash + 1)
  const dot = segment.lastIndexOf('.')
  return dot >= 0 && /^[A-Za-z][A-Za-z0-9]{0,7}$/.test(segment.slice(dot + 1))
}

/**
 * The password of each scheme://user:password@ in the text, credential name or not (CPV round,
 * 2026-10-23); the scheme, the user and the host stay readable. Plain string steps per "://", so the
 * scan stays linear (no regex backtracking).
 */
function* urlPasswordSpans(text: string): Generator<Span> {
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
    if (colon >= 0 && colon < userinfo.length - 1) yield { from: at + 3 + colon + 1, to: at + 3 + userinfo.length }
  }
}

// The characters that end a user:password@host run written without a scheme: whitespace, a quote, a
// backslash, the characters that end an authority (/ ? #, RFC 3986) and those that wrap a word in
// prose. Everything else, : and @ included, belongs to the run.
const NOT_AUTHORITY = /[\s"'`\\/?#<>()[\]{},]/

/**
 * The password of each user:password@host written without a scheme (user:hunter2@db.example.com,
 * verify round of 2026-10-31); urlPasswordSpans covers scheme://user:password@host. The run around
 * each @ is read once: the user is the part before its first :, the password runs from there to its
 * last @, and what follows that @ must be a host name (localhost, or two or more dot-separated
 * labels), a port allowed. The user and the host stay readable. mailto:name@host is an address, not a
 * password, and a password that is a reference ($DB_PASS) stays readable, as after a curl -u flag.
 * The next @ is searched after the run, so the scan is linear.
 */
function* userinfoPasswordSpans(text: string): Generator<Span> {
  for (let at = text.indexOf('@'); at >= 0; ) {
    let start = at
    while (start > 0 && !NOT_AUTHORITY.test(text.charAt(start - 1))) start -= 1
    let end = at + 1
    while (end < text.length && !NOT_AUTHORITY.test(text.charAt(end))) end += 1
    const run = text.slice(start, end)
    const last = run.lastIndexOf('@')
    const colon = run.indexOf(':')
    const named = colon >= 0 && colon < last - 1 && isUserName(run.slice(0, colon))
    if (named && isHostName(run.slice(last + 1)) && isNamedSecret(run.slice(colon + 1, last))) {
      yield { from: start + colon + 1, to: start + last }
    }
    at = text.indexOf('@', end)
  }
}

/** The user before user:password@: letters, digits and . _ % + -, or nothing (:password@host). */
function isUserName(user: string): boolean {
  return /^[A-Za-z0-9._%+-]*$/.test(user) && user.toLowerCase() !== 'mailto'
}

/**
 * The host after user:password@: localhost, or two or more dot-separated labels of letters, digits
 * and -, with an optional :port; the sentence's own punctuation after it is left out.
 */
function isHostName(text: string): boolean {
  const bare = stripTrailingPunctuation(text)
  const colon = bare.indexOf(':')
  const host = colon < 0 ? bare : bare.slice(0, colon)
  if (host.toLowerCase() === 'localhost') return true
  const labels = host.split('.')
  return labels.length >= 2 && labels.every((label) => /^[A-Za-z0-9-]+$/.test(label))
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

/**
 * Letters and numbers, or 16 characters or more: what a key looks like when no name says it is one.
 * Letters and numbers of any script count, and the length is in characters (review of 2026-10-31).
 */
function looksRandom(value: string): boolean {
  const length = [...value].length
  if (length >= 16) return true
  return length >= 8 && /\p{N}/u.test(value) && /\p{L}/u.test(value)
}

/**
 * A value after an explicit name (a credential name, a password flag) is a secret unless it is a
 * reference or a placeholder (isPlaceholder), whatever its shape: a short, digits-only, words-only
 * or non-Latin password is still a password, and a false match costs only a hidden word now that
 * nothing is refused (review of 2026-10-31). The sentence's own punctuation is left out of the
 * judgement, not out of the span.
 */
function isNamedSecret(value: string): boolean {
  const bare = stripTrailingPunctuation(value)
  return !isReference(bare) && !isPlaceholder(value) && !isPlaceholder(bare)
}

/**
 * A ?key= or &sig= query value, whose name is too common to prove a secret on its own: a secret when
 * it is no reference and no placeholder, and looks random.
 */
function valueIsSecret(value: string): boolean {
  const bare = stripTrailingPunctuation(value)
  return !isReference(bare) && !isPlaceholder(bare) && looksRandom(bare)
}

// Words that stand in for a secret instead of being one: sample values, and the empty or boolean
// values a config line holds before its secret is filled in (adapted from the secret-shield mod,
// see NOTICE). The lookup is lowercased, so CHANGEME and True count too.
// cspell:ignore changeme
const PLACEHOLDER_WORDS: ReadonlySet<string> = new Set([
  'changeme', 'change_me', 'password', 'passwd', 'secret', 'token', 'example', 'dummy', 'test',
  'none', 'null', 'nil', 'undefined', 'true', 'false', 'empty', 'redacted',
])

/**
 * A value that holds a secret's place, not a secret (adapted from the secret-shield mod, see NOTICE):
 * a word of PLACEHOLDER_WORDS, a run of one masking character (***, xxxx, XXXX) or an ellipsis, a
 * your_api_key_here phrase, a template slot (<your-api-key>, {{ api_key }}), a command or env() call
 * ($(vault read x), env(API_KEY)), or a label this redaction wrote ([REDACTED:assignment]). Each test
 * reads the value once, from its first character.
 */
function isPlaceholder(value: string): boolean {
  if (PLACEHOLDER_WORDS.has(value.toLowerCase())) return true
  if (/^(?:\*+|x+|\.{3}|…)$/i.test(value) || /^your[-_ a-z]*$/i.test(value)) return true
  if (value.startsWith('<') && value.indexOf('>') === value.length - 1) return true
  if (value.startsWith('{{') && value.length >= 4 && value.endsWith('}}')) return true
  const call = value.startsWith('$(') || value.toLowerCase().startsWith('env(')
  return (call && value.endsWith(')')) || isLabel(value)
}

// The last part of a credential name that describes a secret instead of holding one: token_count,
// api_key_url, password_hint, SECRET_LENGTH (adapted from the secret-shield mod, see NOTICE). id is
// left out: a Vault AppRole secret_id is a credential.
const ABOUT_SUFFIXES: readonly string[] = [
  'url', 'uri', 'endpoint', 'path', 'file', 'dir', 'name', 'type', 'expiry', 'expires', 'expires_at',
  'ttl', 'length', 'header', 'count', 'limit', 'size', 'prefix', 'env', 'var', 'mode', 'enabled',
  'required', 'policy', 'hint', 'prompt', 'label', 'placeholder', 'field', 'format',
]

/** Whether a credential name ends in a part of ABOUT_SUFFIXES, in snake_case or camelCase (passwordField). */
function isAboutName(name: string): boolean {
  const lower = snakeCaseOfCamel(name)
  return ABOUT_SUFFIXES.some((suffix) => {
    const at = lower.length - suffix.length
    return at > 0 && lower.endsWith(suffix) && isPartEdge(lower.charAt(at - 1))
  })
}

/**
 * An unquoted value that calls a function, password = get_password() or token = vault.read(path), is
 * code and not a secret (adapted from the secret-shield mod, see NOTICE): an identifier, dotted or
 * not, then (. A quoted value is a string, so this test is for unquoted values only. The text before
 * the first ( is split at each . and every part must be an identifier, so the read is linear in the
 * length of the value. It is split by hand, not matched by one pattern with a repeated dotted group:
 * CPV's REGEX_DOS check reads that group as a nested quantifier and failed the strict gate on it, a
 * validator false positive, reworded. Same accepted values. Exported for its table test.
 */
export function isCodeCall(value: string): boolean {
  const open = value.indexOf('(')
  return open > 0 && value.slice(0, open).split('.').every((part) => /^[A-Za-z_$][\w$]*$/.test(part))
}

/**
 * The span of each value after a credential name that is a secret (isNamedValue), and of each such
 * value inside a value that is not one: a reference, or the value of a name about a secret
 * (token_url: https://app/cb?access_token=...). A value after an Authorization header or a scheme
 * word is redacted whatever its shape, a reference shape included (sure, verify round of
 * 2026-10-31): Bearer abc.def.ghi is a token even though it reads like req.headers.authorization.
 * The span is the whole value as read, a trailing . or ! included: the value is judged without the
 * sentence's punctuation, but a password can end in one, and a period inside the label costs nothing
 * (owner example of 2026-10-31: p@ss.w0rd! is redacted whole).
 */
function* credentialValueSpans(text: string): Generator<Span> {
  for (const outer of credentialSpans(text, 0, text.length, VALUE_END)) {
    if (isNamedValue(text, outer)) {
      yield outer
      continue
    }
    // A value that is no secret can carry pairs of its own (a URL's ?access_token=..., $KEY;token=...):
    // each of them is judged once (last fix round, 2026-10-23). One level only: scanning inside an
    // inner value again would make a long chain of references quadratic.
    for (const inner of credentialSpans(text, outer.from, outer.to, INNER_VALUE_END)) {
      if (isNamedValue(text, inner)) yield inner
    }
  }
}

/**
 * Whether the value after a credential name is the secret: always after a scheme word or an
 * Authorization header (sure); never after a name about a secret (isAboutName: token_count,
 * password_hint), for an unquoted function call (password = get_password(), isCodeCall) or for a lone
 * { [ or ( that opens a nested value ({"Credentials": {"SecretAccessKey": ...}}: the brace is structure,
 * and the label would hide it); else unless it is a reference or a placeholder (isNamedSecret).
 */
function isNamedValue(text: string, span: NamedSpan): boolean {
  if (span.sure) return true
  if (span.about) return false
  const value = text.slice(span.from, span.to)
  if (!span.quoted && (isCodeCall(value) || value === '{' || value === '[' || value === '(')) return false
  return isNamedSecret(value)
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
 * "basic read/write/execute" decodes to no such shape, so it is saved as written. A quoted header
 * ("Authorization": "Basic ...") hides authorization from followsAuthorization, so the decode is
 * what catches it, even with a token of letters only (2026-10-24, replacing the earlier "holds a
 * digit, +, / or =" test, which refused the slash list and missed the quoted header). The value is
 * the token: "Basic" stays readable.
 */
function* basicCredentialSpans(text: string): Generator<Span> {
  // Local, so the g flag's lastIndex never leaks between calls. \s+ and the token class share no
  // character and the class excludes =, so no quantifier overlaps another (CPV REGEX_DOS).
  const basic = /\bbasic\s+([A-Za-z0-9+/]{16,}={0,2})/dgi
  for (let match = basic.exec(text); match !== null; match = basic.exec(text)) {
    if (decodesToUserPassword(match[1] ?? '') || followsAuthorization(text, match.index)) yield groupSpan(match)
  }
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
 * Authorization: Token <value> (Django REST framework, GitHub and similar), quoted or not, with a
 * value of 20 characters or more that holds a digit and a letter (2026-10-24). Since the verify round
 * of 2026-10-31 authorization is a credential name and every value after it is redacted whatever its
 * shape (valueSpans), so the name rule covers each of these values; this rule is kept as a second
 * guard that does not depend on the word list. Each quantifier sits between characters it cannot
 * match, and the token class excludes whitespace, so there is no backtracking blow-up (CPV
 * REGEX_DOS). The value is the token: "Token" stays readable.
 */
function* tokenAuthorizationSpans(text: string): Generator<Span> {
  const scheme = /\bauthorization["']?\s*[:=]\s*["']?token\s+([A-Za-z0-9._~+/-]{20,})/dgi
  for (let match = scheme.exec(text); match !== null; match = scheme.exec(text)) {
    const value = match[1] ?? ''
    if (/\d/.test(value) && /[A-Za-z]/.test(value)) yield groupSpan(match)
  }
}

/**
 * A Docker config "auth" entry ({"auths":{"ghcr.io":{"auth":"<base64>"}}}) whose value decodes to
 * user:password. auth has been a credential word since 2026-10-31, and since the review of the same
 * day every value after a credential name is redacted, so the name rule now covers each of these
 * values too; this rule is kept as a second guard for the Docker shape, which does not depend on the
 * word list. The value class excludes " and =, so its quantifiers do not overlap.
 */
function* dockerAuthSpans(text: string): Generator<Span> {
  const entry = /"auth"\s*:\s*"([A-Za-z0-9+/]{8,}={0,2})"/dg
  for (let match = entry.exec(text); match !== null; match = entry.exec(text)) {
    if (decodesToUserPassword(match[1] ?? '')) yield groupSpan(match)
  }
}

// The two lines of a PuTTY private key file, each at a line start, so a sentence that names them
// ("its Private-Lines: field holds the key") stays as written. One quantifier per regex, and the
// spaces and the digits share no character (2026-10-24).
const PUTTY_HEADER = /^PuTTY-User-Key-File-\d/m
const PUTTY_PRIVATE_LINES = /^Private-Lines: *(\d+)/gm

/**
 * In a PuTTY private key file, the N lines after each Private-Lines: N line: the private key. The
 * header, the public lines, the comment and the MAC stay readable. A count larger than the lines
 * left takes the rest of the text. The next Private-Lines line is searched after the lines taken,
 * so the walk visits each character once.
 */
function* puttyPrivateKeySpans(text: string): Generator<Span> {
  if (!PUTTY_HEADER.test(text)) return
  const header = new RegExp(PUTTY_PRIVATE_LINES)
  for (let match = header.exec(text); match !== null; match = header.exec(text)) {
    const lineEnd = text.indexOf('\n', header.lastIndex)
    if (lineEnd < 0) return
    // A body this redaction already replaced is one label line, whatever N says: counting N lines from
    // it would take the MAC line too, and a second redact would change the text (owner ruling of
    // 2026-11-03, item 2). Each line is read here at most once, by the header line before it.
    const firstEnd = text.indexOf('\n', lineEnd + 1)
    if (isLabel(text.slice(lineEnd + 1, firstEnd < 0 ? text.length : firstEnd).trim())) {
      header.lastIndex = lineEnd + 1
      continue
    }
    let to = lineEnd + 1
    for (let left = Number(match[1]); left > 0 && to < text.length; left -= 1) {
      const next = text.indexOf('\n', to)
      to = next < 0 ? text.length : next + 1
    }
    header.lastIndex = to
    yield* trimmed(text, lineEnd + 1, to)
  }
}

/** A value's span without one surrounding quote at each end ("x" or 'x'). */
function unquoted(text: string, span: Span): Span {
  const from = span.from + (isQuote(text.charAt(span.from)) ? 1 : 0)
  const to = span.to > from && isQuote(text.charAt(span.to - 1)) ? span.to - 1 : span.to
  return { from, to }
}

/** The span itself when its text is a secret the way a pair's value is (isNamedSecret): the flag names it. */
function* secretValue(text: string, span: Span): Generator<Span> {
  if (isNamedSecret(text.slice(span.from, span.to))) yield span
}

/** The password part of a curl -u user:password value: a value with no colon or an empty password has none. */
function* curlPassword(text: string, value: Span): Generator<Span> {
  const colon = text.slice(value.from, value.to).indexOf(':')
  if (colon >= 0) yield* secretValue(text, { from: value.from + colon + 1, to: value.to })
}

/**
 * Credentials passed as command-line flags, judged per line and per whitespace-separated word, as
 * plain string steps (no regex beyond one run of non-whitespace per word, so the scan stays linear:
 * CPV REGEX_DOS):
 * - --password <value> or --passwd <value> on any command (docker login, mysql); --password=<value>
 *   is already a name=value pair. A next word starting with - is another flag, not a value.
 * - curl's -u/--user user:password, only on a line holding curl: elsewhere -u means other things
 *   (docker run -u 1000:1000, git push -u origin). Only the password is the value.
 * - a glued -p<value>, only on a line holding mysql or mariadb: elsewhere -p is a port, a pattern or
 *   parents (psql -p5432, mkdir -pv).
 * One surrounding quote at each end stays outside the value. Each value is judged like a name=value
 * pair's value (isNamedSecret): every value but a reference is a secret. Added 2026-10-24 (review
 * finding M2); offsets instead of a split since 2026-10-31, so the value can be redacted in place.
 */
function* commandLineSpans(text: string): Generator<Span> {
  for (let lineStart = 0; lineStart <= text.length; ) {
    const newline = text.indexOf('\n', lineStart)
    const lineEnd = newline < 0 ? text.length : newline
    const line = text.slice(lineStart, lineEnd)
    const lower = line.toLowerCase()
    const curl = lower.includes('curl')
    const mysql = lower.includes('mysql') || lower.includes('mariadb')
    const words: Span[] = []
    const run = /\S+/g
    for (let match = run.exec(line); match !== null; match = run.exec(line)) {
      words.push({ from: lineStart + match.index, to: lineStart + match.index + match[0].length })
    }
    for (const [at, word] of words.entries()) {
      const flag = text.slice(word.from, word.to)
      const next = words[at + 1]
      if (flag === '--password' || flag === '--passwd') {
        if (next !== undefined && text.charAt(next.from) !== '-') yield* secretValue(text, unquoted(text, next))
        continue
      }
      if (curl) {
        if ((flag === '-u' || flag === '--user') && next !== undefined) yield* curlPassword(text, unquoted(text, next))
        if (flag.startsWith('--user=')) yield* curlPassword(text, unquoted(text, { from: word.from + '--user='.length, to: word.to }))
        if (flag.startsWith('-u') && flag.length > 2) yield* curlPassword(text, unquoted(text, { from: word.from + 2, to: word.to }))
      }
      if (mysql && flag.startsWith('-p') && flag.length > 2) yield* secretValue(text, unquoted(text, { from: word.from + 2, to: word.to }))
    }
    lineStart = lineEnd + 1
  }
}

/**
 * The value of a ?key= or &key= query parameter (an API key in a URL) and of an Azure SAS &sig=
 * signature, when it looks random (valueIsSecret). Left out on 2026-10-24 for the user to rule
 * on, in since 2026-10-31: a false match only redacts a value. key and sig count only right after ?
 * or &, not as credential words: as names they are common outside a query (primary_key, sort_key).
 * The value class excludes every character that ends it, so its one quantifier has no competitor
 * (CPV REGEX_DOS).
 */
function* queryValueSpans(text: string): Generator<Span> {
  const param = /[?&](?:key|sig)=([^\s"'&#]+)/dgi
  for (let match = param.exec(text); match !== null; match = param.exec(text)) {
    if (valueIsSecret(match[1] ?? '')) yield groupSpan(match)
  }
}

/** A secret value's replacement: its kind in brackets, so the masked text says what stood there without holding it. */
function labelOf(kind: Kind): string {
  return `[REDACTED:${kind}]`
}

// A label as it stands in a masked text. A span that is exactly a label holds no secret, so a second redact
// of a redacted text changes nothing and counts nothing (owner ruling of 2026-11-03, item 2). Only a
// span no longer than the longest label is tested, so the check reads no more than a label per span.
const LABEL = /^\[REDACTED:[a-z0-9-]+\]$/
const LONGEST_LABEL = Math.max(...KINDS.map((kind) => labelOf(kind).length))

function isLabel(value: string): boolean {
  return value.length <= LONGEST_LABEL && LABEL.test(value)
}

/** A rule's spans, each tagged with the kind of secret that rule finds. */
function* tagged(kind: Kind, spans: Iterable<Span>): Generator<Found> {
  for (const span of spans) yield { from: span.from, to: span.to, kind }
}

/** Every rule's secret values, as spans of the text, in no order. No rule is left out: each one only redacts. */
function* secretSpans(text: string): Generator<Found> {
  yield* patternSpans(text)
  yield* tagged('private-key', keyBlockSpans(text))
  yield* tagged('putty-key', puttyPrivateKeySpans(text))
  yield* tagged('url-password', urlPasswordSpans(text))
  yield* tagged('url-password', userinfoPasswordSpans(text))
  yield* tagged('basic-credentials', basicCredentialSpans(text))
  yield* tagged('bearer-token', tokenAuthorizationSpans(text))
  yield* tagged('docker-auth', dockerAuthSpans(text))
  yield* tagged('cli-password', commandLineSpans(text))
  yield* tagged('query-key', queryValueSpans(text))
  yield* tagged('assignment', credentialValueSpans(text))
}

export type Redaction = { text: string; count: number; kinds: Partial<Record<Kind, number>> }

/**
 * The text with every secret value replaced by its label, how many values were replaced, and how many
 * of each kind. A text that holds a secret keeps everything else as written: the value is redacted, never
 * refused (owner ruling 2026-10-31). Spans that overlap are one value: OPENAI_API_KEY=sk-proj-...
 * matches the sk- shape and the credential name, and counts once. The value keeps the kind of the
 * span that starts first, except that a named value (assignment) takes the kind of a vendor shape
 * inside it; for spans that start together the sort keeps the rules' order, and the vendor patterns
 * come first. Everything outside a value is kept as written.
 */
export function redact(text: string): Redaction {
  const spans = [...secretSpans(text)]
    .filter((span) => span.to > span.from && !(span.to - span.from <= LONGEST_LABEL && isLabel(text.slice(span.from, span.to))))
    .sort((a, b) => a.from - b.from)
  const merged: Found[] = []
  for (const span of spans) {
    const last = merged[merged.length - 1]
    if (last === undefined || span.from >= last.to) {
      merged.push({ from: span.from, to: span.to, kind: span.kind })
      continue
    }
    last.to = Math.max(last.to, span.to)
    if (last.kind === 'assignment') last.kind = span.kind
  }
  const kinds: Partial<Record<Kind, number>> = {}
  let out = ''
  let kept = 0
  for (const span of merged) {
    out += text.slice(kept, span.from) + labelOf(span.kind)
    kept = span.to
    kinds[span.kind] = (kinds[span.kind] ?? 0) + 1
  }
  return { text: out + text.slice(kept), count: merged.length, kinds }
}
