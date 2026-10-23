# Threat model template for a mod

A template you fill in for a mod you ship or review. It is organised by the policy sections of the chapters, so each fact sits next to the chapter that owns it. The chapters stay authoritative: where this file and a chapter disagree, follow the chapter. A claim the chapters do not confirm carries the mark UNVERIFIED and should be tested on your own build before you rely on it.

## Table of Contents

- [How to use this template](#how-to-use-this-template)
- [Fill-in block](#fill-in-block)
- [Loading and the built-in guard](#loading-and-the-built-in-guard)
- [What the guard protects and what it leaves open](#what-the-guard-protects-and-what-it-leaves-open)
- [Permission checks a mod can and cannot override](#permission-checks-a-mod-can-and-cannot-override)
- [Network and file reach](#network-and-file-reach)
- [Organisation options](#organisation-options)
- [Switching mods off](#switching-mods-off)
- [Hostile input by event](#hostile-input-by-event)
- [Claims the chapters do not confirm](#claims-the-chapters-do-not-confirm)
- [Keeping the model in step](#keeping-the-model-in-step)

## How to use this template

1. Run `claude plugin validate <mod>` and read the `hooks:`, `calls:`, `env reads:` and `env writes:` lines (`mods-doc-manage-mods-for-organizations`, "Review what a mod can do"). Fill the block below from those lines, not from what you meant the mod to do.
2. Walk the policy sections and note which facts shape your answers.
3. Copy the filled block into the README part titled "What it can reach" (see [house conventions](house-conventions.md#readme-template)).

Answering "nothing" is fine and often right. Leave the answer written down, so the reader sees the gap was intended.

## Fill-in block

```text
Threat model: <mod-name>
Reach in:   <files, environment variable names, settings, transcript, stored keys; or "only the event payload">
Starts:     <programs with their arguments; or "nothing">
Talks to:   <hosts and the data sent; or "nothing leaves the machine">
Keeps:      <data written to $.store, $.state or disk, with its lifetime; or "nothing">
Abuse case: <what a crafted prompt, tool result, file, message or reply from the network can make this mod do>
```

## Loading and the built-in guard

- In `/plugin` and the debug log the built-in guard is named `cc-plugin-sec-default`. It sits in front of every mod a user installs, and users cannot switch it off (`mods-doc-manage-mods-for-organizations`, "Know what happens by default").
- The guard is present when managed settings exist on the machine, or when the user logs in under a Team or Enterprise plan. Someone using an API key, Amazon Bedrock, Google Cloud's Agent Platform or Microsoft Foundry gets it only where managed settings exist (same section).
- If managed `prependPlugins` is set, the guard loads only when that list names it (`mods-doc-mods-reference`, "Settings and environment variables").
- Practical effect for your model: write down whether your mod will run where the guard is present. Several answers below differ with and without it.

## What the guard protects and what it leaves open

- It protects what the organisation manages: what managed hooks receive or decide, the system prompt, managed `CLAUDE.md` and other managed instructions, what any mod reads as settings, and the tools and descriptions of managed MCP servers (`mods-doc-manage-mods-for-organizations`, "Know what happens by default").
- It adds no other restriction. A user's mod can read and write files, start processes, make network requests, rewrite tool calls and prompts, deny a call, approve a call that would otherwise prompt, and draw in the interface, all with that user's permissions (same section).
- No organisation control sandboxes a mod: it runs as the user, with the user's access to files, processes and the network (same chapter, "Know which controls still apply").

## Permission checks a mod can and cannot override

| Situation | Outcome | Cited in |
|---|---|---|
| A `deny` rule refuses the call, guard present | A user's mod cannot approve it, whichever settings file holds the rule | `mods-doc-manage-mods-for-organizations`, "Know what happens by default" |
| A `PreToolUse` hook in managed settings blocks the call | The block is final, and no mod sees the call | same section; `mods-doc-mods-and-events`, "Where settings hooks run in the order" |
| An `ask` rule would prompt | A mod that approves tool calls can approve it | `mods-doc-manage-mods-for-organizations`, "Know what happens by default" |
| An unmanaged `PreToolUse` hook (from another settings file or a plugin) blocked the call | A `tool.check` approval from a mod can override it, because `tool.check` fires after those hooks and the permission rules | `mods-doc-mods-and-events`, "Where settings hooks run in the order" |
| Auto mode | The classifier check is skipped for a call the mod approved | `mods-doc-manage-mods-for-organizations`, "Know what happens by default" |
| `allowModsToOverrideDenyRules` set in managed settings | A user's mod may approve what a `deny` rule would block | `mods-doc-manage-mods-for-organizations`, "Set options on the built-in guard" |

Two consequences for the fill-in block:

- Those two protections apply to the tool calls Claude makes. They do not reach what the mod does itself through `$.fs` and `$.process`: even with `Read(.env)` on the deny list, the mod may open that file via `$.fs.read`, or launch a program that opens it (`mods-doc-manage-mods-for-organizations`, "Know what happens by default"). Count those calls as reach in their own right.
- A mod cannot change how the permission prompt looks, yet it can settle a call before that prompt is shown (same chapter, "Know which controls still apply").

## Network and file reach

- If the organisation's policy does not allow WebFetch, Claude Code also refuses every mod's `$.http.fetch` request (`mods-doc-manage-mods-for-organizations`, "Know which controls still apply").
- Setting `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` does not stop a mod you or your users install from making these requests. From v2.1.288 on it stops only built-in mods and any `$.http.fetch` request carrying the session's Anthropic credentials (same section).
- A program launched through `$.process.run` falls under neither control and uses the network with the user's own access (same section).
- `$.env.get` and `$.settings.read` may expose API keys held in the environment or settings, and `$.env.set` alters the environment of Claude Code plus every command and MCP server it launches afterwards (`mods-doc-manage-mods-for-organizations`, "Review what a mod can do").
- Claude Code will not load a mod whose use of the mods API the validator cannot read (same section). Treat a refusal of that kind as a sign the reach is hard to audit.

## Organisation options

| Name | Effect | Cited in |
|---|---|---|
| `allowManagedModsOnly` | Only the organisation's mods and the built-in mods run their hooks. Read from managed settings only, under `cc-plugin-sec-default@builtin`. | `mods-doc-manage-mods-for-organizations`, "Stop user-installed mods from loading" and "Set options on the built-in guard" |
| `allowModsToOverrideDenyRules` | Lets a user's mod approve what a `deny` rule would block. Managed settings only. | same, "Set options on the built-in guard" |
| `disableSideloadFlags` | Makes startup reject `--plugin-dir` and `--plugin-url`. | `mods-doc-mods-reference`, "Settings and environment variables" |

What decides whether an option takes effect (`mods-doc-manage-mods-for-organizations`, "Set options on the built-in guard"): only managed settings count; the guard must be present; and the guard fails closed, so when it cannot read managed settings it refuses every user mod at load.

With `allowManagedModsOnly`, a mod that Claude Code copies from a remote marketplace, GitHub or another git source counts as a user's mod, not the organisation's (same chapter, "Stop user-installed mods from loading" and "Apply your plugin controls to mods"). Plan for that if your mod is distributed that way.

## Switching mods off

- `claude --safe-mode` turns installed mods off, the organisation's included (`mods-doc-manage-mods-for-organizations`, "Know which controls still apply").
- From v2.1.287 on, `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` is ignored at any value, so setting it to `0` leaves mods on (same chapter, "Stop user-installed mods from loading").
- In an interactive session inside a directory the user has not yet trusted, no mod loads until the trust prompt is answered (same chapter, "Know which controls still apply").
- Your README should say how a person turns your mod off; see the [README template](house-conventions.md#readme-template).

## Hostile input by event

Treat anything the mod receives or reads as possibly crafted by someone else. The event facts below come from the chapters; the advice on what to do is this plugin's own.

- `session.receive` hands the hook a message from another session or agent, with `e.text` and `e.origin.kind`. The origin tells you the kind of sender; the text is still only text (`mods-doc-mods-api`, "Send and receive messages between sessions").
- `$.prompt.submit` with `asUser: true` omits the sentence that names the mod as sender, so the text reaches the model as if the person had written it (see "Start a turn from a background job" in `mods-doc-mods-api`). Text built from untrusted input and sent that way carries the person's voice.
- `session.append` lets a mod rewrite each conversation row before storage, and hooks on `tool.call` and `prompt.submit` mean the mod sees every tool call and prompt (`mods-doc-manage-mods-for-organizations`, "Review what a mod can do").
- For each place untrusted text could flow (a process argument, a file path or content, a URL or body, a prompt, a message to another session), name the guard against it, such as a fixed allowlist or a literal value, or write down that you accept the risk. This procedure is this plugin's advice, not a chapter rule.
- A hook that skips `next` on an event the core must act on answers in the core's place every time (`mods-doc-mods-and-events`, "Guard or change a tool call"). Say so in the model if that is intended.

## Claims the chapters do not confirm

| Claim | Status |
|---|---|
| A guard built on command-text patterns is only advisory, since a determined command slips past, so real enforcement needs a permission rule | UNVERIFIED as a general statement. The chapters cover deny rules and managed hooks (see above) but say nothing about pattern-matching guards. |
| Sandboxing covers the Bash commands Claude runs, but not programs a mod launches | UNVERIFIED. The chapters say only that no organisation control sandboxes a mod. |
| `$.session.authorize` returns a handle, not the secret, usable only against first-party hosts | UNVERIFIED. |
| In `plugin.register`, a plugin supplies its own name, root, version and provenance, so a rename could slip past a rule that matches on them | UNVERIFIED. The chapters describe the refusal shape (`mods-doc-mods-and-events`, "Handle a hook that fails") but not what those fields prove. |
| Checking a path with `$.fs.stat` and `resolve` shows its real location before a write | UNVERIFIED API; see the traps table in the quickstart skill. |

## Keeping the model in step

When the `hooks:`, `calls:`, `env reads:` or `env writes:` lines of `claude plugin validate` change, change the filled block and the README in the same commit. A README claim the validator output cannot back up is a finding by itself, however harmless the code.
