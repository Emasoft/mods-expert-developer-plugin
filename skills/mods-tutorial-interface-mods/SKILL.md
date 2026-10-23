---
name: mods-tutorial-interface-mods
description: "Use when writing a mod that draws in the interface, a band above the prompt, a pane opened by a slash command, a status line or a toast, and you want a complete worked example to read and copy. Reference-only tutorial with four example mods; the mods-doc-* chapters stay authoritative."
user-invocable: false
metadata:
  coordination: exempt
---

# MODS TUTORIAL INTERFACE MODS

Tutorial and reference example only. The mods-doc-* chapter skills of this plugin are authoritative and win on any disagreement, with one exception: for API names and type shapes (event, method and argument names and their TypeScript types), the type files your running build generates win, because events and methods change across releases (chapter skill mods-doc-mods-development, section "Change and test a mod"); for behaviour the types cannot express (ordering, timing, what `next` does) the chapters still win. The example code under examples/ is for reading and copying into your own project; it is never installed or loaded as part of this plugin. Do not point --plugin-dir at a copy inside the plugin cache.

## Overview

Four small, complete mods that draw with `ui.render`, each with its manifest, `hooks.json`, hooks module and test, and a types contract where it keeps `$.state`. `branch-band` and `notes-pane` are copied verbatim from BeLazy167/claude-mods-skill (MIT, see NOTICE at the plugin root); `turn-timer` and `git-poller` are written for this plugin and follow its house conventions.

| Example | What it shows |
|---|---|
| [branch-band](examples/branch-band/hooks/register.tsx) | A band on `AbovePrompt` that shows the git branch and the count of changed files, refreshed by `$.process.run` on a `$.clock.every` timer started in `session.start`, with the drawn value kept in `$.state` |
| [notes-pane](examples/notes-pane/hooks/register.tsx) | `/note <text>` and `/notes` registered with `$.command.register`, a `Pane` with a Clear `Button`, and the notes kept across sessions in `$.store` |
| [turn-timer](examples/turn-timer/hooks/register.ts) | A status line with the duration of the last turn and a toast on the transition to a slow turn, with the logic in a pure `logic.ts`, a `/turn-timer` on/off command and the switch kept in `$.store`; house conventions: on/off command named after the mod, logic split from hooks, main loop only, `// UNVERIFIED:` comments |
| [git-poller](examples/git-poller/hooks/register.ts) | A band with the branch, changed and untracked counts and a Refresh `Button`, kept current by one poller on a `$.clock.every` timer through `$.process.run`, which runs git with `-C` in the session's directory, with a last good snapshot on error and a `/git-poller` on/off command; `turn.complete` does not wait for git; house conventions: one timer started once, a non-blocking `session.start`, `// UNVERIFIED:` comments |

## Prerequisites

- Claude Code 2.1.287 or later, and a folder you own to copy an example into.
- Chapter skill `mods-doc-mods-interfaces`: "Pick where to draw and open panes", "Handle input and redraws" and "Keep state across reloads and sessions". The element catalogue is in `mods-doc-mods-basic-examples`.

## Instructions

1. Pick the example closest to your task and read its whole folder, including its types contract.
2. Copy the folder out of this skill into your own project and rename the plugin in its manifest. The `plugin` key of each `atom(...)` and the outer key of its types contract are the plugin name, so rename them too.
3. Keep the patterns the example teaches:
   - Values a drawing reads are atoms: `atom({ plugin, key }, initial)`, read with `read($, atom)` and written with `update($, atom, fn)`, all imported from `'claude-code'` and declared in `types/index.d.ts`. Never write state while drawing. Facts: `mods-doc-mods-interfaces`, "Keep state across reloads and sessions".
   - Elements come from `$.ui.resolve(e)` inside the render hook, for example `const { Box, Text } = $.ui.resolve(e)`.
   - Work that outlives one event starts in `session.start`; `branch-band` starts its 15-second timer there and runs `git` with an argument list, not a shell. Facts: `mods-doc-mods-api`, "Reach files, processes, and the network".
   - Return `next(e)` from a render hook when you have nothing to draw, so Claude Code draws its own band.
   - A command hook answers alone with `{ text }`, and that text is the transcript row the model also reads.
   - Share the band. Size an `AbovePrompt` drawing to `e.props.bodyColumns`, not `e.viewport`, and read `e.props.maxRows` for its height and `e.props.isWorking` for whether Claude is working (the table lists both props without describing them, so their meaning is read from the names; chapter skill `mods-doc-mods-reference`, section "Render sites"). Step aside with `return next(e)` while `e.props.hasSurvey` is true; the chapter lists that prop without saying what it means, so this is this plugin's advice. At the sites Claude Code draws itself, `await next(e)` returns its drawing reference for you to place in your own `Box`, unless a later mod returned its own tree (`mods-doc-mods-interfaces`, "Change what Claude Code already draws"); whether `next(e)` at `AbovePrompt` returns another mod's band the same way is UNVERIFIED.
   - Fit the width by dropping whole parts, least important first. Never cut a number or a word in the middle: a cut figure reads as a different figure (this plugin's advice). The look rules are in `skills/mods-tutorial-quickstart/references/house-conventions.md`, section "Look and feel".
   - Restyle a part Claude Code already draws before you add a row of your own. The `Spinner` site has a `suffix` prop, `SessionMode` has `modes` and `PromptHint` has `hint` (`mods-doc-mods-reference`, "Render sites"); change one by passing `next` a copy of the event with changed props (`mods-doc-mods-interfaces`, "Change what Claude Code already draws"). What each value must look like is in the types for your build.
   - Keep redraws cheap. Claude Code redraws a site when its props or the terminal width change, and a `$.state` write redraws the sites that read it (`mods-doc-mods-interfaces`, "When Claude Code redraws without being asked" and "Redraw when your data changes"), so skip writing a value that has not changed. Start an animation timer once in `session.start`, as the chapter's "Redraw on a timer" and the house conventions' Pollers rule 1 do, and have its callback return at once while nothing moves, for example outside the span from `turn.start` to `turn.complete` (this plugin's advice). You need not throttle `$.ui.invalidate` yourself: Claude Code does (`mods-doc-mods-interfaces`, "How often a site can redraw"). Raster animation is out for mods the `mods-forge-agent` builds, whose rules forbid Raster; its rules win.
   - Decide the fallback first. Hooks run but nothing drawn appears in the VS Code chat panel, under `claude -p` and the Agent SDK, and in a cloud session the plugin reaches (`mods-doc-mods-overview`, "Where mods run"); the chapter's answer is a transcript line or a command's text reply. For detecting a session with no screen, see `skills/mods-tutorial-quickstart/references/engine-traps.md`, section "Drawing". This is about where drawing is absent, not about drawing differently per surface: the `mods-forge-agent` keeps one render path for both surfaces, and its rule wins.
   - Write what the person reads in the language of the conversation, a command's `{ text }` reply included, and keep command names, plugin names and text written only for the model, such as a `prompt.section` answer, in English (this plugin's advice).
4. Run `claude plugin validate` and `claude plugin test` in your copy. The `notes-pane` test mounts the pane with `$.ui.mount`, finds text, and presses the `clear` button. Facts: `mods-doc-mods-testing`, "Test a drawing".
5. Run it live with `claude --plugin-dir <your copy>`, as quickstart step 8 does: an agent drives the live check with the Anthropic `computer-use` skill (`mods-tutorial-quickstart`, house conventions, "Live check").

### Where the examples differ from the chapters

- `notes-pane` loads `$.store` into `$.state` only in `session.start`. After `/clear`, `/resume` or `/branch`, `$.state` goes back to its default and `session.start` does not fire again, so the pane shows no notes and the next `/note` overwrites the saved list. The interfaces chapter fixes this by reloading the saved value in a `classic.SessionStart` hook as well; do that in your copy.
- `notes-pane` keeps the whole list under one `$.store` key, so two sessions writing at once can lose a note. See `mods-doc-mods-interfaces` on `$.store` across sessions before you rely on it. Ways to avoid the lost write are in `skills/mods-tutorial-quickstart/references/engine-traps.md`, section "State and timers".
- `branch-band` recovers after `/clear` only when its timer next fires, up to 15 seconds later.
- The `notes-pane` test stubs `command.register` to return `{ value: { command } }`. The testing chapter's stub table gives `() => ({ value: undefined })` for `$.command.register`; follow the chapter in your own tests.

### Where the copied examples differ from the house conventions

The house conventions are this plugin's own, not Anthropic rules. `branch-band` and `notes-pane` are copied MIT code and are kept unchanged, so they differ from the conventions in these ways:

- `notes-pane` opens its pane with `$.ui.open({ id: PANE, title: 'Notes' })` and passes no `focus` field. The interfaces chapter says `focus` requests keyboard focus. It passes no `closeOnEscape` either.
- The Clear `Button` in `notes-pane` has no `hotkey`.
- Neither example has an on/off command; `branch-band`'s band cannot be hidden without disabling the plugin.
- Both examples keep their logic in their `register.tsx` hooks module; neither has a separate `logic.ts` module.
- When `git branch` fails, `branch-band` blanks the band, and it takes the changed count from `git status` without checking its exit code; it keeps no last good value for either. Its timer starts a refresh every 15 seconds without waiting for the previous one, so a refresh that runs longer than that can overlap the next, and nothing in the code stops the older result from overwriting the newer one.

`turn-timer` and `git-poller` were written to follow the conventions, which are in `skills/mods-tutorial-quickstart/references/house-conventions.md`.

## Output

A copy of one example in your own folder, renamed everywhere the plugin name appears, drawing what your task needs, that passes `claude plugin validate` and `claude plugin test`.

## Error Handling

- Nothing is drawn: load `mods-doc-mods-troubleshooting`, "A drawing doesn't appear or respond".
- A value resets or an edit is lost: `mods-doc-mods-troubleshooting`, "An edit or a value is lost".
- A pane does not open: open it from a command or a button, as `notes-pane` does, and read "Pick where to draw and open panes" in `mods-doc-mods-interfaces`.

## Examples

Input: "show the open pull request count above the prompt". Output: copy `branch-band`, replace `readBranch` with a call that counts the pull requests, rename the atom and types, validate and test.

Input: "a /todo command with a pane listing the items". Output: copy `notes-pane`, rename the commands and the pane, add the `classic.SessionStart` reload, validate and test.

When the person asks to change a mod that already draws, this table maps the request to the change:

| The person asks | Change | Source |
|---|---|---|
| "Make it shorter" | Drop the least important parts, and keep within `e.props.maxRows` | `maxRows`: `mods-doc-mods-reference`, "Render sites"; the rest is this plugin's advice |
| "Put it under the prompt" | A `$.ui.status` line, or the hint line through the `PromptHint` site | `mods-doc-mods-api`, "Run and control background work"; `mods-doc-mods-interfaces`, "Change what Claude Code already draws" |
| "Put it beside the conversation" | A `Pane` opened from a command, as `notes-pane` does; `e.props.placement` says whether it docks beside the transcript or sits above the prompt | `mods-doc-mods-interfaces`, "Pick where to draw and open panes"; `mods-doc-mods-reference`, "Render sites" |
| "Only while it is working" | Draw when `e.props.isWorking` is true, otherwise `return next(e)` | `mods-doc-mods-reference`, "Render sites" |
| "Ask me before it runs X" | A guard on the tool call | `mods-tutorial-call-intercept-mods` |
| "Let me turn it off" | The on/off command | `skills/mods-tutorial-quickstart/references/house-conventions.md`, section "An on/off switch" |

## Resources

- [branch-band](examples/branch-band/hooks/register.tsx), [its types](examples/branch-band/types/index.d.ts) and [its test](examples/branch-band/tests/register.test.ts).
- [notes-pane](examples/notes-pane/hooks/register.tsx), [its types](examples/notes-pane/types/index.d.ts) and [its test](examples/notes-pane/tests/register.test.ts).
- [turn-timer](examples/turn-timer/hooks/register.ts), [its logic](examples/turn-timer/hooks/logic.ts) and [its test](examples/turn-timer/tests/register.test.ts).
- [git-poller](examples/git-poller/hooks/register.ts), [its logic](examples/git-poller/hooks/logic.ts), [its types](examples/git-poller/types/index.d.ts) and [its test](examples/git-poller/tests/register.test.ts).
- `mods-tutorial-quickstart`: the step-by-step checklist and the traps table.
- Chapter skills: `mods-doc-mods-interfaces`, `mods-doc-mods-basic-examples`, `mods-doc-mods-api`, `mods-doc-mods-testing` and `mods-doc-mods-troubleshooting`.
