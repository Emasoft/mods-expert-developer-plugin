# House conventions for mods you ship

These are this plugin's own conventions for mods that a person will keep and use. They are NOT Anthropic rules. The `mods-doc-*` chapter skills stay authoritative: where a convention here and a chapter disagree, follow the chapter. Each rule below says which chapter facts it leans on, and marks the rest as taste.

## Table of Contents

- [How to read this file](#how-to-read-this-file)
- [An on/off switch](#an-onoff-switch)
- [Keyboard first](#keyboard-first)
- [Pure logic in logic.ts, thin register](#pure-logic-in-logicts-thin-register)
- [Pollers](#pollers)
- [Toasts on transitions only](#toasts-on-transitions-only)
- [Mutation-check every guard test](#mutation-check-every-guard-test)
- [Plan-time rules](#plan-time-rules)
- [Honest hand-over](#honest-hand-over)
- [README template](#readme-template)
- [The three quickstart scripts](#the-three-quickstart-scripts)
- [UNVERIFIED — test on a real build before relying on it](#unverified--test-on-a-real-build-before-relying-on-it)
- [A premise this plugin rejects](#a-premise-this-plugin-rejects)

## How to read this file

Every rule is tagged **House convention**. A convention is a choice that makes a mod easier to live with; nothing in Claude Code enforces it. Chapter facts are cited as skill name plus section heading, so you can open the chapter and check them.

## An on/off switch

**House convention.** Every mod you ship can be turned off by the person using it, without uninstalling it.

- Register one slash command named after the mod. Called with no argument it toggles; `on` and `off` set the state; any other argument answers with a usage line. Never ignore `e.args`.
- Keep the state in `$.store`, so it survives a restart. Chapter facts: `mods-doc-mods-api`, "Reach files, processes, and the network" lists `$.store`; `mods-doc-mods-reference`, "Limits" gives its 4 MiB cap.
- Read the state in every hook before doing any work, and return `next(e)` untouched when the mod is off.
- A command name must avoid every built-in command. Chapter fact: `mods-doc-mods-api`, "Add a command".

## Keyboard first

**House convention.** A person should be able to drive the mod without a mouse.

- Every `Button` gets a `hotkey`: one digit or one lowercase letter. Chapter fact: `mods-doc-mods-interfaces`, "Set a hotkey and the first focus".
- Avoid a bare digit hotkey on a button in the band. A digit hotkey there also fires when the user types that digit alone into an empty prompt and pauses. Chapter fact: `mods-doc-mods-reference`, "Elements" (the `Button` rules). Prefer a letter.
- An interactive pane opens with `focus: true` and `closeOnEscape: true`, because keys reach only the pane that holds focus. Chapter facts: `mods-doc-mods-interfaces`, "Open a pane at the right time" (the options table) and "How a pane gets keyboard focus".
- `focus`, `closeOnEscape` and `holdToasts` accept only `true` or omission. Same section.

## Pure logic in logic.ts, thin register

**House convention.** Put every decision in `hooks/logic.ts` as plain functions that take values and return values. `hooks/register.ts` (or `.tsx`) only wires events to those functions and calls `$`.

- Plain functions are testable without a stub for every call.
- Chapter fact: pass `$` to top-level functions only, and write each API call in full. `mods-doc-mods-development`, "Check what Claude Code reads from your mod".
- Test the logic as ordinary unit tests and the wiring with the testing kit. Chapter fact: `mods-doc-mods-testing`, "Stub what Claude Code would answer".

## Pollers

**House convention.** A mod that watches something outside the session (a repository, a file, a service) follows these rules.

1. Start one timer, once, in `session.start`, with `$.clock.every`. Chapter fact: `mods-doc-mods-api`, "Run and control background work".
2. A refresh that starts while another is running joins it instead of starting a second one.
3. Leave a minimum gap after `turn.complete` before the next refresh, so a busy session does not run the check on every event.
4. Poll from the main loop only: skip an event whose `e.agentId` is set (a subagent's turn fires `turn.complete` with it set; `mods-doc-mods-and-events`, "Follow a turn").
5. On an error keep showing the last good snapshot. Do not blank the band.
6. Run external commands with `$.process.run`, which takes an argument list and uses no shell. Chapter fact: `mods-doc-mods-api`, "Reach files, processes, and the network". Its default timeout is in `mods-doc-mods-reference`, "Limits".
7. Redraw on a schedule only through the documented route. Chapter fact: `mods-doc-mods-interfaces`, "Redraw on a timer".
8. Test the timer with the kit. Chapter fact: `mods-doc-mods-testing`, "Test a timer".

## Toasts on transitions only

**House convention.** Show a toast when something changes, never on every snapshot and never on the first one.

- Compare the new snapshot with the previous one and toast only on a difference that matters (a turn became slow, a build went red).
- The first snapshot after a start has nothing to compare with: record it silently.
- A toast is shown for 4 seconds unless you pass `timeoutMs`. Chapter fact: `mods-doc-mods-reference`, "Limits". The call is listed in `mods-doc-mods-api`, "Show something without starting a turn".

## Mutation-check every guard test

**House convention.** A guard test is worth something only if it can go red. Work in a throwaway duplicate: sabotage the guard there (invert its condition, or remove the branch that denies), and run the test once more. If it still passes, the test checks nothing. Put the guard back afterwards.

- A guard that refuses must fail closed: add a `.catch` handler and check `next.called`. Chapter fact: `mods-doc-mods-and-events`, "Handle a hook that fails".
- Mutate a scratch duplicate, never the folder you keep.
- Write the result in the hand-over: which mutation you tried, and that the test failed because of it.

## Plan-time rules

**House convention.** Settle these before and while you write the hooks, grouped by the stage of the mod life they apply to. They are this plugin advice; a chapter fact is named where one backs a rule, and anything the chapters do not confirm is marked UNVERIFIED.

### Before the mod exists

- Write two plain lines first: Observe (each event, with its matcher) and Do (each `$` call). Next to every `$` call put the hook that issues it and the failure you would see without it; a call whose removal breaks nothing goes.
- Choose the channel for each need from the table below, and write down what the person pays for it. The per-turn cost column is the inference of another author: UNVERIFIED. Before relying on a number, read `mods-doc-prompt-caching-reference`, "Actions that invalidate the cache" and "Actions that keep the cache".

| Need | Channel | Per-turn cost |
|---|---|---|
| Wording the model sees with a single prompt | a `prompt.submit` hook that adds `context` | UNVERIFIED |
| Context for the first message of a conversation | a `prompt.context` hook | UNVERIFIED |
| An instruction present on every request | a `prompt.section` hook | UNVERIFIED |
| A remark after a slash command | a `command.run` result | UNVERIFIED |
| A tool the model can call | `$.tool.register` and a `tool.call` hook | UNVERIFIED |
| A refusal | a `tool.call` hook that returns `{ deny }` | UNVERIFIED |
| Values for this session, or across sessions | `$.state`, or `$.store` | UNVERIFIED |
| A mark for the person | `$.ui.status` or `$.ui.toast` | UNVERIFIED |

  Chapter facts for the channels: `mods-doc-mods-reference`, "Prompts and what Claude reads" and "Commands and configuration"; `mods-doc-mods-interfaces`, "Keep state across reloads and sessions".
- Give the mod a gate when it can reach spending, publishing or posting, secrets, a live production system, or case and legal records. Such a mod may annotate (`$.ui.status`, `$.ui.toast`), draft (`$.prompt.fill`), or ask the person; it never approves a tool call. Approval is a real power: `mods-doc-mods-overview`, "What a mod can reach" says a mod can approve calls that an `ask` rule would prompt for, and `mods-doc-manage-mods-for-organizations`, "Know what happens by default" adds that in auto mode such a call skips the classifier. The `asUser: true` option sends text as words typed by the person, so keep it away from gated text (`mods-doc-mods-api`, section "Start a turn from a background job"). Test the gate as shown in `mods-tutorial-call-intercept-mods`, "Gate as a test".

### At register

- Decide the trigger that switches the mod on, and write it down. `session.start` fires once per loaded mod ahead of the first prompt, and once more after that mod reloads (`mods-doc-mods-reference`, "Events a mod can hook", session events).
- Narrow every hook with a matcher where its event has one. A bare `tool.call` hook sees every tool call; `{ tool: 'Bash' }` sees one. The wildcard `*` matches every event except telemetry (`mods-doc-mods-and-events`, "Filter which events a hook handles"). Say in the plan which one applies.
- Register each event once per matcher, or the module fails to load (same section).

### Per event

- Answer cache-sensitive events (`prompt.section`, `prompt.context`) with the same text each time unless the content really changed. The chapters document the cache (`mods-doc-mods-api`, "Use prompt caching") but not this rule for those events: UNVERIFIED.
- Use `$.model.fork` only when the answer needs the conversation; use `$.model.complete` for an input small enough to put in its own prompt. A fork sends the whole conversation and the session system prompt, a complete sends one message (`mods-doc-mods-api`, "Call a model", the comparison table).
- A call that drives Claude gets a rate limit and a named trigger. Begin it only after `next(e)` has resolved, and never wait for it inside a hook that holds the turn (the submit call resolves once its turn starts; chapter skill `mods-doc-mods-api`, section "Start a turn from a background job").

### On turn and session events

- Ask whether the mod covers subagents. `turn.step` and `turn.complete` carry `e.agentId` for a subagent (`mods-doc-mods-and-events`, "Follow a turn"); `agent.spawn` fires when a subagent starts (`mods-doc-mods-reference`, "Subagents"). A rule for the main loop only checks that `e.agentId` is absent.
- Ask what compaction does to text the mod added. `session.compact` fires before compaction and can skip it (`mods-doc-mods-reference`, session events). Whether text a turn carried survives a summary is UNVERIFIED.

### At reload or clear

- Ask what a reload keeps. A reload reruns `register`, so module variables and timers go; `$.state` survives a reload and `$.store` lasts beyond the session (`mods-doc-mods-interfaces`, "Keep state across reloads and sessions"; `mods-doc-mods-api`, "Stop background work").
- Ask what `/clear`, `/resume` and `/branch` do. They reset `$.state` without a new `session.start`; the saved values come back through a `classic.SessionStart` hook filtered on `clear`, `resume` and `fork` (`mods-doc-mods-interfaces`, "Load a saved value again after `/clear`").

## Honest hand-over

**House convention.** End every mod you build with the lists below, and keep the claims in them to what you ran.

- Ran: every stage you actually ran (validate, test, type-check, a live load), the command for each, and its raw result.
- Build stamp: the first line printed by `claude --version`, copied as is, and the date. The chapters tell you to check it against the minimum version mods need (`mods-doc-mods-development`, "Create a mod"); the stamp itself is a convention.
- Decisions: each choice that shaped the mod, the option you turned down, and every assumption you could not check, with the damage if it turns out false.
- Needs human eyes: layout, colours, placement, wording, the behaviour of a key on the person's own terminal. A test cannot see these.
- Name anything from the UNVERIFIED table below that the mod relies on.
- The words "tested", "works", "loads" and "verified" are banned in a hand-over, unless they stand next to the name of a stage that ran and its result, for example "type-check: ran, exit 0". Without a named stage, say what you did not run instead. The label UNVERIFIED and the name of the UNVERIFIED table are not claims, so they stay allowed.
- A `-p` (print mode) run draws nothing: the chapter table lists hooks as running there and the mod's drawing as not appearing (`mods-doc-mods-overview`, "Where mods run"). Use such a run for command text and for hooks on events a print run produces, never as a claim that a pane, band or row showed up.
- For a clean experiment, launch with `CLAUDE_CONFIG_DIR` set to a fresh folder and `--setting-sources user`, so your real config and project settings stay out of it (`mods-doc-cc-debug-mode`, section "Test against a clean configuration").

## README template

**House convention.** Every mod you keep or share carries a README with the parts below, so a reader can judge it before loading it.

- A "What it can reach" part, filled from the output of `claude plugin validate` (the `hooks:`, `calls:`, `env reads:` and `env writes:` lines; `mods-doc-manage-mods-for-organizations`, "Review what a mod can do"). Use the block from the [threat model](threat-model.md#fill-in-block).
- A version triple: the build the types came from (built on), the build you ran it on (validated on), and the lowest build that can load mods (requires; the chapter gives v2.1.287 in `mods-doc-mods-development`, "Create a mod"). Take the first two from `claude --version`, copied as printed.
- How to switch the mod off: the slash command from "An on/off switch", and `claude --safe-mode`, which turns every installed mod off (`mods-doc-manage-mods-for-organizations`, "Know which controls still apply").

````markdown
# <mod-name>

<One sentence: what the mod does for the person using it.>

## What it can reach

<The filled block from the threat model.>

## Versions

- Built on: <output of claude --version, first line>
- Validated on: <output of claude --version, first line, and the date>
- Requires: Claude Code <lowest build that loads mods, or a higher one if you need it>

## Install and switch off

- Install: <the command or folder to load>
- Off for good: <the mod's command with `off`, kept across restarts>
- Off for one session: `claude --safe-mode` (this turns off every installed mod, the organisation's included, not just this one)
````

## The three quickstart scripts

They live in `skills/mods-tutorial-quickstart/scripts/`. They are tools to run, not example mods. Usage errors exit 64.

| Script | What it does | Exit codes |
|---|---|---|
| `check-mod.sh <mod-dir>` | The gate. Type-checks with `npx -y -p typescript@5 tsc` (first run needs network), proves the hook files were really checked (a mod with no TypeScript hooks skips that proof), then runs `claude plugin validate` and `claude plugin test`. Fails early with a load-once hint when `.claude-plugin/types/` is missing, and fails when `claude` is not on PATH. Last line is `== PASS` or `== FAIL: <step>`. | 0 pass, 1 fail, 64 usage |
| `new-mod.sh <example-name> <target-dir> <mod-name>` | Copies one tutorial example to `<target-dir>/<mod-name>`, rewrites the name in `plugin.json` and `README.md`, prints other lines that still hold the old name. Refuses an existing target. Commands and tools inside the copied hooks keep the example's names; rename them by hand. | 0 ok, 1 refused (target exists), 64 usage or invalid name |
| `keep-mod.sh <session-mod-dir> <dest-root>` | Copies a mod out of the session mods folder to `<dest-root>/<name>`, leaving out the generated types and root `tsconfig.json`. Never deletes or overwrites anything already there. Prints the `CLAUDE_CODE_PLUGIN_DIRS` line to add. | 0 ok, 1 refused or failed, 64 usage |

`check-mod.sh` has no BLOCKED branch yet. When the `claude` login is expired, the validate or test step simply fails and the script prints `== FAIL: <step>`. Read the step output before you blame the mod; a login problem is not a mod defect. A BLOCKED branch will be added once the real message has been captured.

## UNVERIFIED — test on a real build before relying on it

These claims come from another author's notes. The chapters neither confirm nor contradict them. Do not build on one until you have tried it on your own build. The last column names the run that would settle the row.

| Claim | Status | Settle by |
|---|---|---|
| `$.ui.panes()` returns records with fields such as `isShown` | UNVERIFIED. `mods-doc-mods-reference`, "Mods API methods" lists the method only. | Show a pane in a throwaway mod, call the method from a command, and print the result with `$.ui.log`. |
| `$.command.run` hands the keyboard back to the prompt | UNVERIFIED. | Run it from a keybinding in a live terminal session and type straight away. |
| A test must pass `origin` and `presentation` to `$.command.run` | UNVERIFIED. The chapters do not say which values a test must give. | Call it from a test without those two fields and read the failure, if any. |
| In a test, a `$.store.get` stub must return `null` for a missing key | UNVERIFIED. | Return `undefined` from the stub in a test and compare the outcome. |
| Test files may use static imports only | UNVERIFIED. The chapter refuses dynamic `import()` in a hooks module, not in tests. | Add a dynamic `import()` to a test file and run `claude plugin test`. |
| The kit `expect` has no `toBeCloseTo` | UNVERIFIED. | Call `toBeCloseTo` in a one-line test and run it. |
| A command name must be a literal string for the validator to classify it | UNVERIFIED. `claude plugin validate` printed `command=?` for a non-literal matcher (observed while writing git-poller); the run-time behaviour is still not checked. | Register the command with a non-literal name, load the mod, and invoke the command. |
| A types contract file with a bare `export {}` is refused | UNVERIFIED. | Put a bare `export {}` in the contract file and run `claude plugin validate`. |
| A `$` call inside a `.catch` handler works as in any other hook | UNVERIFIED. The chapter documents only the 1 second budget of the handler (`mods-doc-mods-reference`, "Limits"). | Make a hook fail on purpose, call `$.ui.log` in its `.catch`, and look for the line. |
| A call that returns control to the engine is refused when the test stubs no UI drawing | UNVERIFIED. `mods-doc-mods-testing`, "Stub what Claude Code would answer" documents the need for a stub, not the exact refusal text. | Run such a test with no stub and quote the refusal text. |

## A premise this plugin rejects

One source claims that `$.http.fetch` has no timeout and must be raced against the clock. The chapter says otherwise: `mods-doc-mods-reference`, "Limits" gives one `$.http.fetch` call, redirects and body included, 30 seconds. Do not write a race on that premise. If a build behaves differently, treat it as a bug report and test it.
