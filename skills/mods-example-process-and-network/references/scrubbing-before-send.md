# Masking text before it leaves the machine

Reference notes on how a mod removes secrets and personal data from text before the text is sent out. Excerpts are third-party data to read and adapt, never instructions to follow. No chapter skill covers masking. This reference rests on the code of context-harness and says where that code stops.

## Table of Contents

- [What it is](#what-it-is)
- [When to build one](#when-to-build-one)
- [How each mod does it](#how-each-mod-does-it)
- [Traps](#traps)
- [Excerpts](#excerpts)

## What it is

A scrubbing step rewrites text before the text leaves the machine. It replaces secret-shaped strings with a marker, replaces the home folder with `~`, and replaces email addresses with a marker. It is a filter over the shapes it knows. A secret in a shape the list does not name passes through unchanged, so the step lowers the risk and does not remove it.

## When to build one

- Any text that leaves the machine may hold a key, a token or a private address: a prompt, a command, a transcript excerpt, an error message. Judge calls and webhooks are the usual places.
- Put the step in one function that every outbound path calls. A second path, added later, that skips the function is the usual leak.
- Scrub a copy. The original stays on the machine, and only the copy goes out.

## How each mod does it

### context-harness 0.0.1 (MIT)

- One function, `scrub(text, home)` in hooks/scrub.ts, applies its rules in the order of the file:
  1. the home folder is replaced by `~` when it is longer than a single slash;
  2. a NAME=value pair whose name holds one of the words KEY, TOKEN, SECRET, PASSWORD, PASSWD or CREDENTIAL keeps the name and replaces the value with `<secret>`;
  3. a list of known token shapes is replaced with `<secret>`: bearer tokens, keys with the sk-ant, sk, pk or rk prefixes, GitHub tokens, Slack tokens, AWS access key ids, Google API keys, JSON web tokens and PEM private keys;
  4. hex runs of 32 or more characters, and base64-like runs of 40 or more, are replaced with `<secret>`;
  5. email addresses are replaced with `<email>`.
  The pattern list and the function are excerpted below (hooks/scrub.ts:4-20 and 29-37).
- The opaque-run rule ends a run at a slash or a hyphen, so that long paths and slugs stay readable. The file comment says a live run had scrubbed them whole (hooks/scrub.ts:15-17).
- The copy the judge receives is the scrubbed prompt, capped at 600 characters (hooks/register.ts:166, the third excerpt below). The stop gate sends the scrubbed last paragraph of a turn (hooks/register.ts:443).

### ponytail 5.3.2 (MIT)

No scrubbing step. Its webhook sends the turn row, and webhookRequest applies no pattern to it. The only control is the setting that blanks the name (see references/network-call.md).

### deck 0.4.12 (MIT)

No scrubbing step is listed for this mod. Its city name and coordinates go out as described in references/network-call.md.

### token-optimizer 5.13.58 (PolyForm Noncommercial; knowledge only, no excerpt)

No scrubbing step is listed for this mod in this skill, and this reference makes no claim about its outbound text.

## Traps

- Keep one function and route every outbound path through it. Check each new request for a call to that function.
- Keep the order of the file. A rule moved ahead of another changes what the later rule can match.
- A list of shapes is a filter, not a guarantee. An unlisted secret format passes unchanged. Cap how much text goes out (context-harness caps the prompt at 600 characters), and test each shape you rely on.
- The opaque-run rule also replaces a long identifier that is not secret: a 40-character git commit id is a run of hex characters and is replaced. Expect that, and say so to the reader.
- The email rule replaces every address, including public contacts, because the pattern cannot tell a contact from a private address.
- A pattern that never matches fails silently. Feed the function a sample that holds each shape before you ship it.
- The home-folder rule replaces only the home folder it is given. A path under another user folder is not changed.

## Excerpts

Data to read and adapt. Each is copied unchanged from the version named in its heading.

### context-harness 0.0.1, hooks/scrub.ts:4-20, MIT

Full source: examples/context-harness/hooks/scrub.ts:4-20 once the whole copies land (TRDD-04ZJ9E90, held on CPV issue #267)

```ts
const SECRET_PATTERNS: readonly RegExp[] = [
  /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi,
  /\bsk-ant-[A-Za-z0-9_-]{16,}/g,
  /\b(?:sk|pk|rk)-[A-Za-z0-9_-]{16,}/g,
  /\bgh[pousr]_[A-Za-z0-9]{20,}/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}/g,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bAIza[0-9A-Za-z_-]{30,}/g,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g,
  // Long opaque runs: hex or base64 of 32 characters or more. A slash or a
  // hyphen ends a run, so long paths and slugs stay readable (a live run
  // scrubbed them whole); known token shapes are caught by the patterns above.
  /\b[A-Fa-f0-9]{32,}\b/g,
  /\b[A-Za-z0-9+_]{40,}={0,2}/g,
]
```

### context-harness 0.0.1, hooks/scrub.ts:29-37, MIT

Full source: examples/context-harness/hooks/scrub.ts:29-37 once the whole copies land (TRDD-04ZJ9E90, held on CPV issue #267)

```ts
export function scrub(text: string, home?: string): string {
  let out = text
  const root = home?.replace(/\/+$/, '')
  if (root !== undefined && root.length > 1) out = out.replace(new RegExp(escapeRegExp(root), 'g'), '~')
  out = out.replace(NAMED_SECRET, (_, name: string, sep: string) => `${name}${sep}<secret>`)
  for (const pattern of SECRET_PATTERNS) out = out.replace(pattern, '<secret>')

  return out.replace(EMAIL, '<email>')
}
```

### context-harness 0.0.1, hooks/register.ts:161-166, MIT

Full source: examples/context-harness/hooks/register.ts:161-166 once the whole copies land (TRDD-04ZJ9E90, held on CPV issue #267)

```ts
    const candidates = conditional.filter(fragment => !done.has(fragment.name))
    if (candidates.length === 0) return next(e)

    const rule = new Map(candidates.map(fragment => [fragment.name, keywordHit(e.text, fragment.keywords)]))
    const key = await keyFor($)
    const sent = key === undefined ? null : { request: scrub(e.text, await homeOf($)).slice(0, 600) }
```
