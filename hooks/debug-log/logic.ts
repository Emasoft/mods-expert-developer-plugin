// The debug log of the integrated mods (TRDD-RWD5PW76, PRRD G14.1: "Every mod can switch on a debug log that tracks
// errors, warnings and similar events, with secrets redacted."). Pure decisions only; ./register.ts writes the file.
//
// The log holds only the lines the mods raise themselves (their errors and warnings, the lines they already send to
// $.ui.log), each passed through maskForLog. The mods never put a hook payload, a prompt, a tool input, an environment
// value or the raw store in such a line, but a line can quote an error from Claude Code or another plugin, so what it
// carries is masked, not known (orchestrator ruling, recorded on the card). The same masking applies to $.ui.log.
import type { SwitchDef } from '../switches/logic'
import { redact } from './redact'
import { printable } from '../mod-manager/logic'

/** The largest a log file grows before it is moved to <name>.1, replacing the older one: two files at most per mod. */
export const DEBUG_LOG_CAP = 256 * 1024

/** The switch of a mod's debug log: off by default (B5), like every log a person did not ask for. */
export function debugLogSwitch(mod: string): SwitchDef {
  return { id: `${mod}.debug-log`, mod, label: 'Debug log of errors and warnings', defaultOn: false }
}

/**
 * The name Claude Code gives this plugin's data folder, ${CLAUDE_PLUGIN_DATA} (plugin manifest chapter: the plugin
 * identifier, <name>@<marketplace>, with every character other than a letter, digit, _ or - replaced by -). An install
 * sits at <config>/plugins/cache/<marketplace>/<name>/<version>; any other root, a --plugin-dir folder, is <name>@inline.
 */
export function dataFolderId(name: string, root: string): string {
  const parts = root.split(/[\\/]+/).filter((part) => part !== '')
  const at = parts.length - 4
  const installed = at >= 1 && parts[at - 1] === 'plugins' && parts[at] === 'cache' && parts[at + 2] === name
  return `${name}@${installed ? parts[at + 1] : 'inline'}`.replace(/[^A-Za-z0-9_-]/g, '-')
}

export function logPathOf(config: string, id: string, mod: string): string {
  return `${config}/plugins/data/${id}/debug/${mod}.log`
}

// An address: a local part that starts the token (the lookbehind, so a long run is not tried at every position), then
// dot-separated labels and a top-level domain, every part bounded, so the scan stays linear.
const EMAIL = /(?<![A-Za-z0-9._%+-])[A-Za-z0-9._%+-]{1,64}@(?:[A-Za-z0-9-]{1,63}\.){1,8}[A-Za-z]{2,24}(?![A-Za-z0-9-])/g
// A home folder of any user, on macOS, Linux and Windows: the user's name is replaced, the rest of the path stays. Any
// case, since the macOS and Windows file systems ignore it, and either slash on Windows (review of 9d4ca09).
const HOME_PATHS: ReadonlyArray<[RegExp, string]> = [
  [/(\/Users\/|\/home\/)[^/\\\s'"`]+/gi, '$1<user>'],
  [/([A-Za-z]:[\\/]Users[\\/])[^\\/\s'"`]+/gi, '$1<user>'],
]
// What may follow the session's home where it is replaced: the end of a path segment, never more of a name.
const AFTER_HOME = `(?=[\\\\/\\s'"\`:;,)\\]}>]|$)`

const escapedForRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Each scheme URL with all of its userinfo, everything its authority holds before the last @, as [REDACTED:url-userinfo].
 * A token alone (https://TOKEN@host) is a credential as much as user:password is, and the shared redactor takes only the
 * password (orchestrator, item 3 sweep step 1, 2026-11-05): the re-pointed source line of the default log carries git
 * URLs (G2). A user name that is no secret goes too (ssh://git@github.com/x). maskForLog runs it before the e-mail rule,
 * which takes TOKEN@host for an address only where the host has a top-level domain and so would hide the token behind the
 * wrong label, or not at all. The scheme starts at the first letter of the run before "://", so 1.https, -https and
 * .https are read as https (review of the staged change, lead 3). The authority ends at /, ? or # (RFC 3986) and at a
 * character no URI holds (white space, " ' < > ` { } | \ ^; lead 5), so an @ in a path or a query is not a user. Not at
 * ] ) , or ;, since the redactor's own label [REDACTED:url-password] stands inside the userinfo when this runs. Residual
 * (lead 4): an unencoded / ? # or white space inside the userinfo ends it early, so https://ann:pa/ss@host keeps ann:pa
 * in clear. An scp-style git@host:path has no "://" and is left to the other rules. Plain string steps per "://", as
 * urlPasswordSpans in ./redact.ts takes them, so the scan stays linear: each authority is read once, and the next
 * "://" lies past the / that ends it.
 */
export function urlUserinfoMasked(text: string): string {
  let out = ''
  let copied = 0
  for (let at = text.indexOf('://'); at >= 0; at = text.indexOf('://', at + 3)) {
    let start = at
    while (start > 0 && /^[A-Za-z0-9+.-]$/.test(text.charAt(start - 1))) start -= 1
    while (start < at && !/^[A-Za-z]$/.test(text.charAt(start))) start += 1
    if (start === at) continue
    let end = at + 3
    while (end < text.length && !/[\s/?#"'<>`{}|\\^]/.test(text.charAt(end))) end += 1
    const cut = text.slice(at + 3, end).lastIndexOf('@')
    // No @, or an empty userinfo (https://@host): nothing to hide.
    if (cut <= 0) continue
    out += `${text.slice(copied, at + 3)}[REDACTED:url-userinfo]`
    copied = at + 3 + cut
  }
  return out + text.slice(copied)
}

/**
 * What a line says once masked: every secret shape redact (./redact.ts) replaces, all of a
 * scheme URL's userinfo (urlUserinfoMasked), every e-mail address, this session's home folder as ~, and any other user's
 * home folder with the name replaced. The home is replaced only where a path segment ends, so a home whose user name
 * begins another user's name (al before alice) never cuts that name in two and leaves its end in clear (review of 9d4ca09).
 */
export function maskForLog(text: string, home: string | undefined): string {
  let out = urlUserinfoMasked(redact(text).text).replace(EMAIL, '[REDACTED:email]')
  const trimmed = home?.replace(/[\\/]+$/, '')
  if (trimmed !== undefined && trimmed.length > 1) out = out.replace(new RegExp(escapedForRegExp(trimmed) + AFTER_HOME, 'g'), '~')
  for (const [pattern, replacement] of HOME_PATHS) out = out.replace(pattern, replacement)
  return out
}

/**
 * A line for the transcript: masked first, then every run of white space one space, then printable (every other control
 * or direction mark a '?'). The order matters. Cleaned first, a control character inside the home path would become a '?'
 * and the mask would no longer find the path (review of d623b53); collapsed first, a home with a run of white space in its
 * name would no longer match, and the generic pattern, which stops at white space, would leave the rest of the name in
 * clear. Collapsing before printable makes a line break, a tab, U+2028, U+2029 and U+FEFF a space here, as oneLine does
 * for a toast, where printable alone made each a '?' (M4c item 1). The debug-log file keeps a line's own breaks (logLine),
 * so logEvent masks without this.
 */
export function cleanMasked(text: string, home: string | undefined): string {
  return printable(maskForLog(text, home).replace(/\s+/g, ' '))
}

/**
 * One line of the file: the time, the mod, and the masked text, its own line breaks indented under it. A lone carriage
 * return counts as a break too: left in, a terminal would draw what follows it over the start of the line.
 */
export function logLine(iso: string, mod: string, masked: string): string {
  return `${iso} ${mod} ${masked.replace(/\r\n|\r|\n/g, '\n    ')}\n`
}

/**
 * Whether a folder Claude Code's configuration names is absolute: a relative one would put the log under the working
 * folder, which the log never writes to (B5).
 */
export function isAbsolutePath(path: string): boolean {
  return /^(?:\/|[A-Za-z]:[\\/]|\\\\)/.test(path)
}

const bytes = (text: string): number => new TextEncoder().encode(text).length

/**
 * What to write after one more line: the line added to the file, or, when that would pass the cap, the file moved to
 * <name>.1 and the line alone in a new file. A line larger than the cap by itself is cut, so a file never passes it.
 */
export function appendedFiles(current: string | undefined, line: string, cap: number): { write: string; rotate?: string } {
  const fitted = bytes(line) <= cap ? line : `${cutToBytes(line, cap - 16)}… (cut)\n`
  const now = current ?? ''
  if (now !== '' && bytes(now) + bytes(fitted) > cap) return { write: fitted, rotate: now }
  return { write: now + fitted }
}

/** The text cut to at most `max` bytes of UTF-8; a character the cut splits is dropped, not half kept. */
function cutToBytes(text: string, max: number): string {
  return new TextDecoder().decode(new TextEncoder().encode(text).slice(0, max)).replace(/\uFFFD+$/, '')
}
