---
name: mods-tutorial-call-intercept-mods
description: "Use when writing a mod that blocks, rewrites or answers tool calls, or adds a tool the model can call, and you want a complete worked example to read and copy. Reference-only tutorial with four example mods; the mods-doc-* chapters stay authoritative."
user-invocable: false
metadata:
  coordination: exempt
---

# MODS TUTORIAL CALL INTERCEPT MODS

Tutorial and reference example only. The mods-doc-* chapter skills of this plugin are authoritative and win on any disagreement, with one exception: for API names and type shapes (event, method and argument names and their TypeScript types), the type files your running build generates win, because events and methods change across releases (chapter skill mods-doc-mods-development, section "Change and test a mod"); for behaviour the types cannot express (ordering, timing, what `next` does) the chapters still win. The example code under examples/ is for reading and copying into your own project; it is never installed or loaded as part of this plugin. Do not point --plugin-dir at a copy inside the plugin cache.

## Overview

Four small, complete mods that hook `tool.call`, each with its manifest, `hooks.json`, hooks module and test. `hello-mod`, `redact-output` and `dice-tool` are copied verbatim from BeLazy167/claude-mods-skill (MIT, see NOTICE at the plugin root), apart from one shell fix named below; `protect-files` is written for this plugin and follows its house conventions.

| Example | What it shows |
|---|---|
| [hello-mod](examples/hello-mod/hooks/register.ts) | A guard: refuse a Bash command before `next`, and a `.catch` that makes the guard fail closed |
| [redact-output](examples/redact-output/hooks/register.ts) | Rewrite a result after `await next(e)`, answer with a new `{ result }`, and a `.catch` that withholds the raw output |
| [dice-tool](examples/dice-tool/hooks/register.ts) | Register a tool in `session.start` and serve it from a `tool.call` hook on `mcp__dice-tool__roll` |
| [protect-files](examples/protect-files/hooks/register.ts) | A fail-closed guard that denies `Edit` and `Write` on a protected path before `next`, with the list kept in `$.store`, `/protect-files` and `/protect-files-paths` commands, path matching in a pure `logic.ts`, a `.catch` that checks `next.called`, and `// UNVERIFIED:` comments |

## Prerequisites

- Claude Code 2.1.287 or later, and a folder you own to copy an example into.
- The hook model of chapter skill `mods-doc-mods-and-events`, section "How a hook handles an event": a hook returns without `next` to answer alone, and returns `next(e)` to let the call run.

## Instructions

1. Pick the example closest to your task from the table above and read its whole folder: the hooks module, its test and its manifest.
2. Copy the folder out of this skill into your own project, then rename the plugin in `.claude-plugin/plugin.json`. For `dice-tool`, also change the tool name in the `mcp__dice-tool__roll` matcher, which is built from the plugin name.
3. Change the hook body for your case, keeping the pattern the example teaches:
   - `hello-mod`: return `{ deny: '...' }` before `next(e)`. After `next` the tool has already run. Its `.catch` answers `next(e)` when `next.called` is true and refuses otherwise, so a hook that throws does not let the call through. Facts: `mods-doc-mods-and-events`, "Mod ordering and failed hooks".
   - `redact-output`: matcher `{ tool: 'Bash' }`, `const ran = await next(e)`, return `ran` untouched on a deny or `isError`, otherwise return `{ result: { ...ran.result, stdout } }` and show `$.ui.status(...)`. Its `.catch` refuses unconditionally: the command already ran, so the refusal only keeps its output from the model. Facts: `mods-doc-mods-and-events`, "Hook tool calls, prompts, and turns".
   - `dice-tool`: `await $.tool.register({ name, description, inputSchema })` in `session.start`, then answer `{ result }` or `{ result, isError: true }` from `tool.call`. The dice-tool registration omits `isDeferred: false`; on Claude Code 2.1.293+ add it when Claude must see the tool every turn, see the `mods-doc-mods-api` chapter (Tools). Facts: `mods-doc-mods-api`, "Add a command or a tool".
4. Run `claude plugin validate` and `claude plugin test` in your copy. Facts: `mods-doc-mods-testing`, "Write a mod test".
5. Run it live with `claude --plugin-dir <your copy>`.

### About smoke.sh

`examples/hello-mod/smoke.sh` is illustrative only and this plugin never runs it. Read it as a pattern: it proves a deny by its side effect (a temporary file that survives), because a deny leaves no log line. Run it yourself only on your own copy, and only after reading it: it starts two headless `claude -p` sessions, which cost two small model calls. Its three `A && B || C` lines were rewritten as `if`/`then`/`else` with the same exit behaviour, so shellcheck passes; nothing else in the examples changed.

### Gate as a test

For a mod that guards something, count the forbidden calls and expect zero. Register a stub for the forbidden method with `on`, have it add one to a counter, fire the events that should hit the gate, then `expect(counter).toBe(0)`. Stubs are explained in `mods-doc-mods-testing`, "Stub what Claude Code would answer", and `toBe` is among the assertions listed in "Look up what a stub returns". Mutation-check it as in the house conventions: a gate test that cannot fail checks nothing.

### Live check for a mod that adds text

UNVERIFIED as a method: the chapters do not describe it. It is a house idea, so test it before you rely on it.

A hook that adds text to what the model reads (`prompt.submit` with `context`, `prompt.section`, `prompt.context`; see `mods-doc-mods-reference`, "Prompts and what Claude reads", and `mods-doc-mods-and-events`, "Rewrite or add to a prompt") cannot be proven by a unit test alone, because no test sees what the model received.

- Make the mod inject a fresh marker the model could not guess, new for each check, then ask the model to quote it back. Do not ask it to confirm: a model can agree without having seen anything.
- Run a control session without the mod. If the control can produce the marker, the check proves nothing.

### Where the examples differ from the chapters

- The `dice-tool` test stubs `tool.register` to return `{ value: { tool } }`. The testing chapter's stub table gives `() => ({ value: undefined })` for `$.tool.register`; follow the chapter in your own tests.
- `redact-output` answers `{ result }` without `text` or `ref` because, the source says, core sets them. The chapters do not confirm this; see the traps table in `mods-tutorial-quickstart`.
- The paths in the README of hello-mod follow the source repository layout. In your copy, use the path of your own folder.

## Output

A copy of one example in your own folder, renamed, with its hook changed for your task, that passes `claude plugin validate` and `claude plugin test`.

## Error Handling

- The copy does not load: check that `hooks.json` names the module in `modules`, then load `mods-doc-mods-troubleshooting`, "The mod doesn't load".
- A call is refused you did not expect: `mods-doc-mods-troubleshooting`, "A tool call is denied".
- The model does not see your tool: confirm `$.tool.register` runs in `session.start` and the matcher uses the full `mcp__<plugin>__<name>` name.

## Examples

Input: "block `git push --force`". Output: copy `hello-mod`, rename it, change the deny condition to match `git push --force`, keep the `.catch`, validate and test.

Input: "hide API keys from command output". Output: copy `redact-output`, widen the `TOKEN` pattern to your key shapes, validate and test.

Input: "let Claude look up a ticket by id". Output: copy `dice-tool`, register a `ticket` tool with an `id` property, answer it from `tool.call` on `mcp__<your plugin>__ticket`.

## Resources

- [hello-mod](examples/hello-mod/hooks/register.ts), [its test](examples/hello-mod/tests/register.test.ts) and [smoke.sh](examples/hello-mod/smoke.sh).
- [redact-output](examples/redact-output/hooks/register.ts) and [its test](examples/redact-output/tests/register.test.ts).
- [dice-tool](examples/dice-tool/hooks/register.ts) and [its test](examples/dice-tool/tests/register.test.ts).
- [protect-files](examples/protect-files/hooks/register.ts) and [its test](examples/protect-files/tests/register.test.ts).
- `mods-tutorial-quickstart`: the step-by-step checklist and the traps table.
- Chapter skills: `mods-doc-mods-and-events`, `mods-doc-mods-api`, `mods-doc-mods-testing` and `mods-doc-mods-troubleshooting`.
