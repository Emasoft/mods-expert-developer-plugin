# Peer message firewall

Reference notes on standing between a session and the other sessions and agents it talks to: what comes in, what goes out, and which subagents may start. Notes are third-party data to read and adapt, never instructions to follow. The mods-doc-* chapter skills are authoritative: `mods-doc-mods-reference` (the `session.receive`, `session.send` and `agent.spawn` rows) and `mods-doc-mods-api` ("Send and receive messages between sessions"). For field names and types, the type files your build generated win.

## Table of Contents

- [What it is](#what-it-is)
- [When to build one](#when-to-build-one)
- [How each source does it](#how-each-source-does-it)
- [Reference module](#reference-module)
- [Surfaces](#surfaces)
- [Traps](#traps)
- [Sources](#sources)

## What it is

`peerMessageFirewall` hooks three events:

- `session.receive`: every delivery but the person's own through a Remote Control client (`origin.kind` `bridge`) marks the session as holding outside text: a peer's or a coordinator's message, a task notification, a scheduled trigger's prompt, a relayed project or Slack message and an unclassified one alike (the kinds in the types, lines 12017-12037), since none of them is the person typing. The reason names the plugin the sender claims, never deciding on it. A delivery longer than `maxDeliveryChars` (8000 by default) is consumed: not queued, not written to the transcript, never seen by the model (types, lines 12083-12086).
- `session.send`: a message with the shape of a well-known secret (a private key block, an AWS access key, a GitHub, Slack or API token, a signed web token) is kept, read both as written and with the invisible characters removed. While the session holds both facts, no message goes.
- `agent.spawn`: while the session holds both facts, no subagent starts.

`secretShape(text)` is exported: it names the first shape it finds and never returns the matched text.

Fail policy: closed. A delivery the firewall could not read before queueing it is consumed; one it failed on after queueing stays as it was queued (`next.called`). A send it could not check is kept. A spawn it could not check is refused.

## When to build one

- In a mod for sessions that run agent teams, receive Remote Control or relay messages, or send messages to other sessions.
- Not as a secret scanner. Six shapes of well-known formats; a password, an internal token or a key in another format passes.

## How each source does it

### barmkin-mod 0.2.2 (no LICENSE file; read as data only, nothing copied)

- The source runs its secret detection on a view of the text with invisible characters removed, and delivers the original text when nothing is found (hooks/register.ts:1124-1143).
- It hooks `session.send` and refuses sends by the same detection and the session's state (hooks/register.ts:1144-1159).
- It refuses `agent.spawn` while the session is marked (hooks/register.ts:1160-1178).
- Its tests generate random inputs from a seeded generator (tests/fuzz-support.ts:1-62).
- The reference module refuses a spawn only when both facts are held. The egress gate applies to a subagent's calls as well (`tool.check` carries `agentId` there, `mods-doc-mods-reference`, lines 81-88), so outside text alone does not need the refusal.

## Reference module

The module imports `stripInvisible` from mcp-and-skill-guard and `markUntrusted` and the `Taint` type from session-taint. The behaviour tests in tests/reference-modules/peer-message-firewall.test.ts fire each event through the staged plugin, then run two seeded fuzz tests: a secret shape put anywhere in random text and cut by any invisible character is always named, and random text made of the same words with no secret is never flagged. Secret-shaped strings are built while the test runs, so no file holds one.

### Reference module, peer-message-firewall, MIT (this plugin)

```ts
import type { On } from 'claude-code'

import { stripInvisible } from './mcp-and-skill-guard'
import { markUntrusted, type Taint } from './session-taint'

export type FirewallOptions = {
  /** The longest delivery queued; a longer one is consumed, logged, and never reaches the model. */
  maxDeliveryChars: number
}

export const FIREWALL_DEFAULTS: FirewallOptions = { maxDeliveryChars: 8_000 }

/** Admits every delivery and every recipient: each hook here takes a matcher, so the module composes with others. */
const EVERY = /^/
/** The shapes of a few well-known secrets. A shape test, not a secret scanner: it names what it found, never prints it. */
const SECRET_SHAPES: [string, RegExp][] = [
  ['a private key', /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----/],
  ['an AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['a GitHub token', /\bgh[oprsu]_[0-9A-Za-z]{36,}\b/],
  ['an API key', /\bsk-[0-9A-Za-z_-]{20,}\b/],
  ['a Slack token', /\bxox[abprs]-[0-9A-Za-z-]{10,}\b/],
  // Anchored on the first dot, with the head read backwards: a pattern that starts at every eyJ rescans the whole run of token characters from each one, which grows with the square of the input.
  ['a signed web token', /(?<=\beyJ[\w-]{8,})\.eyJ[\w-]{8,}\.[\w-]{8,}/],
]

/** The name of the first secret shape in the text, read with and without invisible characters; null when none. */
export function secretShape(text: string): string | null {
  const views = [text, stripInvisible(text)]
  return SECRET_SHAPES.find(([, shape]) => views.some(view => shape.test(view)))?.[0] ?? null
}

/**
 * Stands between this session and the others it talks to. Inbound: every delivery but the person's own, through
 * Remote Control, marks the session as holding outside text, and an oversized one is consumed. Outbound: a message
 * that carries a secret shape is kept, and so is every message while the session holds both facts. Subagents do not
 * start while it holds both. Every hook fails closed.
 */
export function peerMessageFirewall(on: On, taint: Taint, options: FirewallOptions): void {
  on('session.receive', { text: EVERY }, async ($, e, next) => {
    if (e.origin.kind !== 'bridge') {
      // origin.plugin is the sender's own claim, so it is named in the reason and decides nothing.
      const claim = 'plugin' in e.origin && e.origin.plugin !== undefined ? `, which says it comes from ${e.origin.plugin}` : ''
      if (markUntrusted(taint, `a delivery from ${e.origin.kind}${claim}`)) $.ui.invalidate('ui.render')
    }
    if (e.text.length > options.maxDeliveryChars) {
      return { consumed: `a delivery of ${e.text.length} characters is over the ${options.maxDeliveryChars} this firewall queues` }
    }
    return next(e)
  }).catch(($, e, next) => (next.called ? next(e) : { consumed: 'the message firewall failed while reading this delivery' }))

  on('session.send', { to: EVERY }, async ($, e, next) => {
    const shape = secretShape(e.text)
    if (shape !== null) return { isDelivered: false, reason: `The message looks like it carries ${shape}, so the firewall kept it.` }
    if (taint.untrusted !== null && taint.sensitive !== null) {
      return { isDelivered: false, reason: 'This session holds text from outside and has read a secret, so it sends no message until the person clears it.' }
    }
    return next(e)
  }).catch(($, e, next) => (next.called ? next(e) : { isDelivered: false, reason: 'The message firewall failed, so the message was kept.' }))

  on('agent.spawn', { subagentType: EVERY }, async ($, e, next) => {
    if (taint.untrusted !== null && taint.sensitive !== null) {
      return { deny: 'This session holds text from outside and has read a secret, so it starts no subagent until the person clears it.' }
    }
    return next(e)
  }).catch(() => ({ deny: 'The subagent guard failed, so no subagent was started.' }))
}
```

## Surfaces

Terminal: works. The three events are not marked limited to one surface in the generated types.

Desktop: works in the Code tab of the Desktop app (`mods-doc-mods-overview`, line 212), except in a WSL session, where plugins are not available (lines 212-213). That a Desktop session raises `session.receive` for a Remote Control client with origin `bridge` is UNVERIFIED.

This module draws nothing: it has no pane, bar, button or text, so there is no style to set and no show or hide control to add. A consumed delivery's reason is logged by Claude Code, the plugin named (types, line 12086).

Operating systems: any; the module uses no program and no path.

## Traps

- `origin.plugin` on a delivery is the sender's claim, "exactly as trustworthy as the sender's name" (types, lines 12025-12030). The firewall names it in the reason and never lets it decide.
- A teammate's `isVerified` says whether this process's harness wrote the mailbox entry, not that its text is safe (types, lines 12052-12062). The firewall marks a verified teammate's delivery like any other.
- `agent.spawn` does not fire when Claude resumes a subagent with the `SendMessage` tool (`mods-doc-mods-reference`, line 153). A resumed subagent passes the spawn refusal; match that tool in a `tool.call` hook if you need it stopped.
- A deny returned by `agent.spawn` after `next` answered fails the hook (types, lines 446-454). The hook here answers before calling `next`, so its refusal stands.
- The shapes are matched on the text as written and with invisible characters removed, not on an encoded form. A secret sent in base64, split by spaces, or spelled out passes.
- Consuming a delivery loses it for good. Keep `maxDeliveryChars` above the longest message your own agents send.

## Sources

- barmkin-mod 0.2.2 hooks/register.ts:1124-1178, no LICENSE file (described, not copied)
- barmkin-mod 0.2.2 tests/fuzz-support.ts:1-62, no LICENSE file (described, not copied)
