# Review checklist for a mod

A procedure for reviewing someone else's mod, or your own before hand-over. Checks are grouped by the risk they guard against, not by the order you run them; run all groups, and report findings per group. Each check has a severity: High (the mod may do something the reader was not told, or can be abused), Medium (the mod may misbehave or hide a failure), Low (hygiene). The `mods-doc-*` chapters stay authoritative; a check marked UNVERIFIED rests on advice the chapters do not confirm.

## Table of Contents

- [How to run a review](#how-to-run-a-review)
- [Risk: the mod does more than it says](#risk-the-mod-does-more-than-it-says)
- [Risk: the mod sees more than the job needs](#risk-the-mod-sees-more-than-the-job-needs)
- [Risk: the mod has more reach than the job needs](#risk-the-mod-has-more-reach-than-the-job-needs)
- [Risk: a refusal that does not hold](#risk-a-refusal-that-does-not-hold)
- [Risk: a failure nobody sees](#risk-a-failure-nobody-sees)
- [Risk: untrusted input reaches a sink](#risk-untrusted-input-reaches-a-sink)
- [Risk: names and shapes from the wrong release](#risk-names-and-shapes-from-the-wrong-release)
- [Risk: the mod cannot be loaded or switched off](#risk-the-mod-cannot-be-loaded-or-switched-off)
- [Closing the review](#closing-the-review)

## How to run a review

1. Run `claude plugin validate <mod>` and keep the `hooks:`, `calls:`, `env reads:` and `env writes:` lines (`mods-doc-manage-mods-for-organizations`, "Review what a mod can do"). Every group below starts from them.
2. Open the README part titled "What it can reach" (see [house conventions](house-conventions.md#readme-template)) and the filled [threat model](threat-model.md).
3. Report each finding as: severity, group, which file, and which event or `$` call.
4. Read the mod's code rather than run it, unless you have a throwaway environment. The validator output shows what a mod can do without running it (same section).

## Risk: the mod does more than it says

| Check | Severity |
|---|---|
| Every call on the `calls:` line, every name on the `env reads:` and `env writes:` lines, and every stored key is explained by the README. An unexplained entry is a finding. | High |
| The README's reach part and the threat model agree with the validator output. A claim missing from them is a finding on its own, however harmless the code looks. | Medium |
| The validator could read the mod: Claude Code refuses to load a mod that uses the mods API in a way the validator cannot read (`mods-doc-manage-mods-for-organizations`, "Review what a mod can do"). A computed call is therefore a reason to ask for a rewrite. | Medium |

## Risk: the mod sees more than the job needs

| Check | Severity |
|---|---|
| Without a matcher, a hook on `tool.call` or `prompt.submit` receives every tool call or prompt and can change them (`mods-doc-manage-mods-for-organizations`, "Review what a mod can do"). Ask whether a matcher would do (`mods-doc-mods-and-events`, "Filter which events a hook handles"). | High |
| A hook on `session.append` can rewrite each conversation row before storage (`mods-doc-manage-mods-for-organizations`, "Review what a mod can do"). Ask why that is needed. | High |
| A hook on `'*'` matches every event except the telemetry events (`mods-doc-mods-and-events`, "Filter which events a hook handles"). Ask whether a named event works. | Medium |
| Each event is registered once per matcher; a second plain registration of one event makes the module fail to load (same section). | Low |

## Risk: the mod has more reach than the job needs

| Check | Severity |
|---|---|
| Compare each call with the meaning table in `mods-doc-manage-mods-for-organizations`, "Review what a mod can do": file access anywhere the user can, started programs, network requests, environment reads and writes, MCP calls, model calls on the user's plan, submitted prompts, messages to other sessions. A call with more reach than the job needs is a finding. | High |
| A `$.http.fetch` call names its host in the README. The limits for one call are in `mods-doc-mods-reference`, "Limits". | Medium |
| `$.env.set` is justified, since it changes the environment of whatever commands and MCP servers start afterwards (`mods-doc-manage-mods-for-organizations`, "Review what a mod can do"). | High |
| Reads of settings or environment are limited to names the README lists, since these can hold API keys (same section). | Medium |

## Risk: a refusal that does not hold

| Check | Severity |
|---|---|
| A hook that must refuse returns the refusal before calling `next`. Returning without calling `next` answers the event and the tool never runs (`mods-doc-mods-and-events`, "Guard or change a tool call"). | High |
| A hook that skips `next` on an event the core must act on answers in the core's place on every call. Confirm that is intended. | Medium |
| A `tool.check` hook that approves is justified. A mod's approval can override an `ask` rule, and also an unmanaged `PreToolUse` hook's block (`mods-doc-manage-mods-for-organizations`, "Know what happens by default"). | High |
| A deliberate second `next(e)` in `tool.call` is a retry rather than a defect (`mods-doc-mods-and-events`, "Guard or change a tool call"). | Low |
| Returning while a `next` call is still pending cancels what runs below it. UNVERIFIED: the chapters do not describe this case. | Medium |
| A mod relies on a deny rule or managed hook to restrict its own `$.fs` or `$.process` calls. Those protections do not reach such calls (`mods-doc-manage-mods-for-organizations`, "Know what happens by default"). | High |

## Risk: a failure nobody sees

| Check | Severity |
|---|---|
| Where a failure must be visible to the user, the hook has a `.catch` handler that answers in its place. With no handler, a hook that fails before `next` is skipped and the following handler takes over (`mods-doc-mods-and-events`, "Handle a hook that fails"). | High |
| The handler tests `next.called` and returns `next(e)` when the hook already ran `next` (same section). | Medium |
| The handler fits its time limit of 1 second, and a hook's own limit is 10 seconds, or 50 milliseconds for `prompt.edit` (`mods-doc-mods-reference`, "Limits"). If the handler itself fails, the hook is skipped as if it had none (`mods-doc-mods-and-events`, "Handle a hook that fails"). | Medium |
| At `tool.check` and `plugin.register`, a refusal returned after `next` resolved still holds, so the handler should not gate it on `next.called` (same section). | Low |

## Risk: untrusted input reaches a sink

This group is this plugin's advice, built on the event facts in the [threat model](threat-model.md#hostile-input-by-event).

| Check | Severity |
|---|---|
| No value from an event, a file, a tool result, a message or a reply from the network is interpolated into a process argument, a file path, a URL or a prompt. Prefer literal values and fixed allowlists. | High |
| Text sent with `asUser: true` is never built from untrusted input (see "Start a turn from a background job" in `mods-doc-mods-api`). | High |
| A hook on `session.receive` does not trust a message because of who it claims to come from (`mods-doc-mods-api`, "Send and receive messages between sessions"). | Medium |
| A path guard compares a resolved real path, not the spelling it was given. UNVERIFIED API; see the traps table in the quickstart skill. | Medium |

## Risk: names and shapes from the wrong release

| Check | Severity |
|---|---|
| Event, method and argument names match the type files the running build generates, which win over the tutorials (`mods-doc-mods-development`, "Change and test a mod"). | Medium |
| No leftover use of the early-access flag `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS`; from v2.1.287 on it is ignored at any value (`mods-doc-manage-mods-for-organizations`, "Stop user-installed mods from loading"). | Low |

## Risk: the mod cannot be loaded or switched off

| Check | Severity |
|---|---|
| The plugin name is not on the manifest chapter's list of refused names and prefixes (`mods-doc-plugin-manifest-reference`, "`name`"). | Medium |
| The README says how a person turns the mod off, and the mod has the on/off command described in [house conventions](house-conventions.md#an-onoff-switch). | Medium |
| The README states the versions the mod was built on, validated on, and requires. | Low |
| `version` in the manifest was raised since the last release. This is this plugin's advice. | Low |

## Closing the review

End with the smallest set of changes that clears the High findings. Leave the mod's design and reach alone unless the author asks for the implementation. State which proof stages you ran and which you did not.
