# Patterns: from what a skill says to a hook

## Table of Contents

- [Behaviour to hook](#behaviour-to-hook)
- [The three scaffolded patterns](#the-three-scaffolded-patterns)
- [Hand-written recipes](#hand-written-recipes)
- [Sample mods worth reading](#sample-mods-worth-reading)

Adapted from skills/skill-to-mod/references/patterns.md of arm-pz/skill-to-mod (MIT, see NOTICE). Event and method names follow chapter skill `mods-doc-mods-reference`; check each against the type files of the installed build before relying on it.

## Behaviour to hook

| The skill says... | Hook | Typical action | Calls it needs |
| --- | --- | --- | --- |
| "before pushing / deploying / publishing / deleting..." | `tool.call` on `{ tool: 'Bash' }` | `$.ui.ask`, or `{ deny }` with an instruction Claude can act on, or `context` after the result | `$.ui.ask`, `$.ui.toast`, `$.ui.status` |
| "after you edit..." / "whenever files change" | `tool.call` on Edit and Write, acting after `await next(e)` | mark state stale, show a status line | `$.ui.status` |
| "when the user says X" | `prompt.submit` | add one line to `context`; never rewrite their text silently | none |
| "run /thing" with no model turn | `command.run` | return `{ text }` | `$.command.register` |
| "at the end of each turn..." | `turn.complete` | a line under the answer | none |
| "when a session starts" | `session.start` | register commands, load saved settings | `$.command.register`, `$.store.get` |
| "when the context fills / before compaction" | `session.measure`, `session.compact` | toast, status line, or `{ skip: reason }` | `$.ui.toast`, optionally `$.session.usage` |
| "show a live panel / status / banner" | `ui.render`, `$.ui.open`, `$.ui.status` | draw an element tree | `$.ui.*` |
| "ask a model to judge X" | `$.model.complete` | check `isAnswered` first | `$.model.complete` (spends the user's usage: say so) |
| "keep notes between sessions" | `$.store` | small JSON | `$.store.get`, `$.store.set` |

Every call beyond `$.ui.*`, `$.command.register` and `$.store` widens the trust surface. Say so to the user and justify it. Whatever the hook, give its function a switch (PRRD G13) and send its errors and decisions through the debug log (PRRD G14).

## The three scaffolded patterns

**gate**: `tool.call` (Bash), `skill.prompt`, and optionally `tool.call` (Edit and Write).

- `skill.prompt` records which required skills have been expanded.
- An edit, while `staleOnEdit` is on, clears the record: the checks go stale.
- A Bash command that matches a `match` entry while required skills are outstanding is handled by `mode`: `ask` (a question with "Run checks first" and "Ship anyway"; a question nobody answers counts as "Run checks first"), `block` (deny with an instruction) or `nudge` (run, then add `context`). The `gate` setting switches the whole gate off.
- After `maxHolds` holds it lets the command through and shows a toast, so a missing skill can never trap a session.
- The status line names the checks still to run while the `statusLine` setting is on.
- `.catch` on every hook fails open and writes the error kind to the debug log.

**prime**: `prompt.submit`. When a prompt matches a phrase, one line of `context` tells Claude which skill applies. With a gate it fires only while checks are outstanding. The `prime` setting switches it.

**command**: `/<name>`, registered in `session.start` and answered by `command.run`. It shows the state and the switches, `<function> off|on` changes one function for the session, and `off` / `on` snooze and resume them all. The `command` setting leaves it out.

Every pattern shares the debug log, off by default (`debugLog` setting, or `/<name> debug on`).

## Hand-written recipes

Read the chapter named in each line first, then adapt. Keep the scaffold's switches and debug log.

- **Context watcher.** `on('session.measure', ...)` after each turn; call `$.ui.toast` once when the fill crosses a threshold and keep a module flag so it fires once. `$.session.usage()` returns `{ startedAt, context, rateLimits, cost }`, `context` holding `tokens`, `window` and `percent` (`mods-doc-mods-reference`, "Mods API methods").
- **Handoff before compaction.** `session.compact` can return `{ skip: reason }`; `$.session.compact` starts one; `$.model.fork` writes a brief from the current conversation and `$.fs.write` stores it (`mods-doc-mods-api`, "Call a model" and "Reach files, processes, and the network"). That is three powerful calls: state them plainly, and check what open-source handoff mods already do first.
- **Status line.** `$.ui.status(text)` from any hook, `undefined` to clear it: the cheapest face there is (`mods-doc-mods-api`).
- **Band above the prompt.** A `ui.render` hook on the `AbovePrompt` render site, resolving the elements with `$.ui.resolve(e)`, and `$.ui.invalidate('ui.render')` after state changes (`mods-doc-mods-interfaces`, "Pick where to draw and open panes"; the tutorial `mods-tutorial-interface-mods`, example branch-band).
- **Pane.** `$.ui.open(...)` from a command, drawn by a `ui.render` hook on the pane; check `isPlaced` on the result, and draw the same content in the band when a narrow terminal does not place it (`mods-doc-mods-interfaces`, "Build a pane with tabs"; the tutorial example notes-pane).
- **Hold a command with buttons.** Anthropic's `blast-radius` holds a risky Bash command, opens a pane with Proceed and Cancel, and denies on cancel. It uses `$.process.run` to measure the damage, a larger trust surface than the gate pattern.

## Sample mods worth reading

Chapter skill `mods-doc-mods-overview` links Anthropic's public samples in "Try a sample mod" and "Read the source of built-in mods": `token-weather` (a forecast of the context window above the prompt), `blast-radius`, `replay-theater`, and the built-in `diff`, `agents-md` (a `userConfig` option), `sec-default` (a policy guard) and `telemetry`. The tutorials of this plugin, `mods-tutorial-call-intercept-mods` and `mods-tutorial-interface-mods`, carry worked examples with tests.
