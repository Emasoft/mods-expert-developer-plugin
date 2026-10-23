# House conventions for mods you ship

These are this plugin's own conventions for mods that a person will keep and use. They are NOT Anthropic rules. The `mods-doc-*` chapter skills stay authoritative: where a convention here and a chapter disagree, follow the chapter. Each rule below says which chapter facts it leans on, and marks the rest as taste.

## Table of Contents

- [How to read this file](#how-to-read-this-file)
- [An on/off switch](#an-onoff-switch)
- [Keyboard first](#keyboard-first)
- [Pure logic in logic.ts, thin register](#pure-logic-in-logicts-thin-register)
- [Pollers](#pollers)
- [Toasts on transitions only](#toasts-on-transitions-only)
- [Look and feel](#look-and-feel)
- [Live check](#live-check)
- [Mutation-check every guard test](#mutation-check-every-guard-test)
- [Plan-time rules](#plan-time-rules)
- [Honest hand-over](#honest-hand-over)
- [README template](#readme-template)
- [The quickstart scripts](#the-quickstart-scripts)
- [Footprint against a plan](#footprint-against-a-plan)
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

## Look and feel

**House convention.** These rules cover anything a mod draws. They are taste, except where a chapter is named.

- When the mod has nothing worth showing, it shows nothing (the interface tutorial, step 3: return `next(e)`).
- Give each mark one meaning, and never let colour carry a state on its own: pair it with a mark or a word.
- Show state with plain one-cell marks, for example `✓` for done and `✗` for failed, not emoji. Emoji, wide CJK characters and combining marks do not take one cell each, so they break column widths; a `Raster` needs every character one cell wide (`mods-doc-mods-interfaces`, "Draw a grid of colored cells"; the `mods-forge-agent` does not use `Raster`).
- Show times as relative ("3 min ago"), not as clock times.
- Align columns by cell count, not by string length; when space is short, give up the column that matters least.
- Strip control characters, bidirectional marks and zero-width characters from outside data before you draw it.

## Live check

**House convention.** Quickstart step 8 runs the mod in a real Claude Code session. A person does this by hand. An agent drives it with the Anthropic `computer-use` skill (`anthropic-skills:computer-use`; Computer use must be turned on in the Claude desktop app's settings, and the person approves each app and full-screen control). The agent loads the skill before step 8 and requests access to the terminal app. A mod test (`claude plugin test`) shows that a drawing is valid; only a live check shows that a click, a hotkey or a pane really works.

What one run of each check showed on Claude Code 2.1.309, in Terminal.app on macOS, on 2026-10-23 (TRDD-O5LUMKPW). These are observations, not guarantees; re-check them on your build:

- A terminal app was granted click-only: computer use could click in it but not type. So start the session with the prompt as a command-line argument, for example `claude --plugin-dir <mod> 'Reply with ok.'`.
- Observed: with `CLAUDE_CODE_NO_FLICKER=1` (fullscreen rendering), one click on a Button drawn under a transcript row reached the mod. With `CLAUDE_CODE_NO_FLICKER=0` (the classic renderer), one click on the same Button reached nothing; whether the click landed on it was not confirmed.
- Use a full-screen click (in this harness, `left_click` in `computer_batch`), not a background click on the app window. A background click (`app_click`) only moved Terminal's text cursor and sent the mod nothing.
- A new terminal window can open on another desktop Space. Find it and bring it to the current Space (in this harness, `app_list_windows` and `app_bring_to_current_space`).
- Judge the result from what the mod records (a log file written by a test build, or the debug log), not from the screenshot: a press often changes nothing on screen.
- A session running inside the Desktop app cannot restart that app with the mod loaded (reasoned, not tested), so the Desktop check stays with the person, as the `mods-forge-agent` rules say.

## Mutation-check every guard test

**House convention.** A guard test is worth something only if it can go red. Work in a throwaway duplicate: sabotage the guard there (invert its condition, or remove the branch that denies), and run the test once more. If it still passes, the test checks nothing. Put the guard back afterwards.

- A guard that refuses must fail closed: add a `.catch` handler and check `next.called`. Chapter fact: `mods-doc-mods-and-events`, "Handle a hook that fails".
- Mutate a scratch duplicate, never the folder you keep.
- Write the result in the hand-over: which mutation you tried, and that the test failed because of it.
- Tests that guard nothing still get a cheaper check: see each one fail on its assertion once before you trust its pass, with the expected value deliberately wrong, then put it back.

## Plan-time rules

**House convention.** Settle these before and while you write the hooks, grouped by the stage of the mod life they apply to. They are this plugin's advice; a chapter fact is named where one backs a rule, and anything the chapters do not confirm is marked UNVERIFIED.

### Before the mod exists

- Write two plain lines first: Observe (each event, with its matcher) and Do (each `$` call). Next to every `$` call put the hook that issues it and the failure you would see without it; a call whose removal breaks nothing goes. Prefer a hook that only watches to one that changes what passes through, and call a model only when the value cannot be worked out without one; the review applies the same reach rule later ([review-checklist](review-checklist.md#risk-the-mod-has-more-reach-than-the-job-needs)).
- Choose the channel for each need from the table below, and write down what the person pays for it. The per-turn cost column is the inference of another author: UNVERIFIED. Before relying on a number, read `mods-doc-prompt-caching-reference`, "Actions that invalidate the cache" and "Actions that keep the cache".

| Need | Channel | Per-turn cost |
|---|---|---|
| Wording the model sees with a single prompt | a `prompt.submit` hook that adds `context` | UNVERIFIED |
| Context for the first message of a conversation | a `prompt.context` hook | UNVERIFIED |
| An instruction present on every request | a `prompt.section` hook | UNVERIFIED |
| A reply to a slash command | a `command.run` result | UNVERIFIED |
| A tool the model can call | `$.tool.register` and a `tool.call` hook | UNVERIFIED |
| A refusal | a `tool.call` hook that returns `{ deny }` | UNVERIFIED |
| A note the model reads with one tool result | a `tool.call` hook that adds `context` to the result after `next` (UNVERIFIED: not in the chapters) | UNVERIFIED |
| Values for this session, or across sessions | `$.state`, or `$.store` | UNVERIFIED |
| A mark for the person | `$.ui.status` or `$.ui.toast` | UNVERIFIED |

  Chapter facts for the channels: `mods-doc-mods-reference`, "Prompts and what Claude reads" and "Commands and configuration"; `mods-doc-mods-interfaces`, "Keep state across reloads and sessions".
- Give the mod a gate when it can reach spending, publishing or posting, secrets, a live production system, or case and legal records. Such a mod may annotate (`$.ui.status`, `$.ui.toast`), draft (`$.prompt.fill`), or ask the person; it never approves a tool call. Approval is a real power: `mods-doc-mods-overview`, "What a mod can reach" says a mod can approve calls that an `ask` rule would prompt for, and `mods-doc-manage-mods-for-organizations`, "Know what happens by default" adds that in auto mode such a call skips the classifier. The `asUser: true` option sends text as words typed by the person, so keep it away from gated text (`mods-doc-mods-api`, section "Start a turn from a background job"). Test the gate as shown in `mods-tutorial-call-intercept-mods`, "Gate as a test".
- List what would stop the mod working where it will run: worktree subagents, when it guards Bash `tool.call` ([engine-traps, Open issues](engine-traps.md#open-issues)); managed settings or a Team or Enterprise sign-in, where the built-in guard may hand some events past user mods (UNVERIFIED; [engine-traps, A hook misbehaves](engine-traps.md#a-hook-misbehaves)); the surface it must draw on (`mods-doc-mods-overview`, "Where mods run"); and Windows ([engine-traps, Platform and packaging](engine-traps.md#platform-and-packaging)).

### At register

- Decide the trigger that switches the mod on, and write it down. `session.start` fires once for each loaded mod, before the first prompt, and once more after that mod reloads (`mods-doc-mods-reference`, "Events a mod can hook", session events).
- Narrow every hook with a matcher where its event has one. A bare `tool.call` hook sees every tool call; `{ tool: 'Bash' }` sees one. The wildcard `*` matches every event except telemetry (`mods-doc-mods-and-events`, "Filter which events a hook handles"). Say in the plan which one applies.
- Register each event once per matcher, or the module fails to load (same section).

### Per event

- Keep what the mod adds to a request the same from one request to the next, unless its content really changed. The cache matches the start of each request exactly: a change anywhere in it re-processes everything after it, and the system prompt, which holds the tool definitions, comes first (`mods-doc-prompt-caching-reference`, "How the cache is organized"). `prompt.section` answers a named section of the system prompt and `tool.describe` answers the description of a tool sent to Claude (`mods-doc-mods-reference`, "Prompts and what Claude reads" and "Events a mod can hook"), so text that varies there costs the whole request (this plugin's reading of the two chapters). The reference says `prompt.context` fires once for each conversation; how often `prompt.section` and `tool.describe` fire again later in a session is UNVERIFIED.
- Use `$.model.fork` only when the reply depends on the conversation; use `$.model.complete` for an input small enough to put in its own prompt. A fork sends the whole conversation and the session system prompt, a complete sends one message (`mods-doc-mods-api`, "Call a model", the comparison table).
- For `$.model.complete`, pass a small model, a `maxTokens` cap and a `timeoutMs` (this plugin's advice; the options are in `mods-doc-mods-api`, "Send one prompt"), and read `r.isAnswered` before `r.text` (same section). Keep `system` and the fixed start of `prompt` identical on every call, pass `prompt` as an array of `{ text }` blocks, and set `cache: true` on the last fixed block (`mods-doc-mods-api`, "Use prompt caching"). Choose the model and the effort once and keep them: each model has its own cache, and on most models each effort level has one too (`mods-doc-prompt-caching-reference`, "How the cache is organized").
- A call that drives Claude gets a rate limit and a named trigger. Begin it only after `next(e)` has resolved, and never wait for it inside a hook that holds the turn (the rate limit, the trigger and the start after `next` resolves are this plugin's advice; the chapter backs only the timing: the submit call resolves once its turn starts, chapter skill `mods-doc-mods-api`, section "Start a turn from a background job").
- Gate every `$.model` call, so a busy session does not multiply them (this plugin's advice, built on the chapter facts named here). Call only while the mod is on ([An on/off switch](#an-onoff-switch)), only for the main loop (skip an event whose `e.agentId` is set, as [Pollers](#pollers) rule 4 does), only when something worth a call happened (on `turn.complete`, not when `e.isAborted` is `true`), with one call in flight at a time, and under a rate limit. `turn.step` fires for each request to the model, and `turn.complete` fires for subagents' turns too (`mods-doc-mods-and-events`, "Follow a turn"). `ui.render` reruns whenever the site's props or the terminal width change (`mods-doc-mods-interfaces`, "When Claude Code redraws without being asked"), so never call a model from a `ui.render` hook.
- Measure the cache over the same few turns with the mod off, then on, and ignore the first turn after each switch: a switch can itself change the start of the request (this plugin's advice; enabling or disabling a plugin is on the list in `mods-doc-prompt-caching-reference`, "Enabling or disabling a plugin"). A `turn.step` hook can log `cache_read_input_tokens` and `cache_creation_input_tokens` for each request; skip requests whose `e.agentId` is set to count the main conversation only (`mods-doc-mods-and-events`, "Follow a turn"). On v2.1.251 or later, the `Prompt cache (main)` line of `/usage` shows the hit ratio, and on v2.1.260 or later it names the likely cause of the last miss (`mods-doc-prompt-caching-reference`, "Check cache performance"). The `usage` of a `$.model.complete` result carries the same two counts (`mods-doc-mods-api`, "Check for cache hits"). Cache writes that stay high turn after turn mean something at the start of the request keeps changing.
- A timer that starts a turn or calls a model after a quiet spell can find the cache expired and pay the full input price. Outside the main conversation a cache entry lasts five minutes by default; in the main conversation it lasts one hour or five minutes, depending on billing and the user's settings (`mods-doc-prompt-caching-reference`, "Which TTL each request gets"). A request sent only to keep the cache warm is billed like any other (this plugin's advice).

### On turn and session events

- Ask whether the mod covers subagents. `turn.step` and `turn.complete` carry `e.agentId` for a subagent (`mods-doc-mods-and-events`, "Follow a turn"); `agent.spawn` fires when a subagent starts (`mods-doc-mods-reference`, "Subagents"). A rule for the main loop only checks that `e.agentId` is absent.
- Ask what compaction does to text the mod added. `session.compact` fires before compaction and can skip it (`mods-doc-mods-reference`, session events). Whether text a turn carried survives a summary is UNVERIFIED.

### At reload or clear

- Ask what a reload keeps. A reload reruns `register`, so module variables and timers go; `$.state` survives a reload and `$.store` lasts beyond the session (`mods-doc-mods-interfaces`, "Keep state across reloads and sessions"; `mods-doc-mods-api`, "Stop background work").
- Ask what `/clear`, `/resume` and `/branch` do. They reset `$.state` without a new `session.start`; the saved values come back through a `classic.SessionStart` hook filtered on `clear`, `resume` and `fork` (`mods-doc-mods-interfaces`, "Load a saved value again after `/clear`").
- If the mod must run where the built-in guard loads, a `classic.SessionStart` hook may never reach it (UPSTREAM, UNVERIFIED on a machine with managed settings; see [engine-traps, A hook misbehaves](engine-traps.md#a-hook-misbehaves), the order-dependent start-up row). Write the restore as a routine that is safe to run twice, and call it from that hook and also from the first `turn.start`.

## Honest hand-over

**House convention.** End every mod you build with the lists below, and keep the claims in them to what you ran.

- Ran: every stage you actually ran (validate, test, type-check, a live load), the command for each, and its raw result.
- Build stamp: the first line printed by `claude --version`, copied as is, and the date. The chapters tell you to check it against the minimum version mods need (`mods-doc-mods-development`, "Create a mod"); the stamp itself is a convention.
- Decisions: each choice that shaped the mod, the option you turned down, and every assumption you could not check, with the damage if it turns out false.
- Cost, for a mod that adds text to requests or calls a model: how many tokens it adds to each request, how many model calls it makes per turn, and the cache counts with the mod off and on from the measurement under [Per event](#per-event), writing `not measured` for each one you did not measure; and the off switch, the command from [An on/off switch](#an-onoff-switch).
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

## The quickstart scripts

They live in `skills/mods-tutorial-quickstart/scripts/`. They are tools to run, not example mods. Usage errors exit 64 in all four scripts.

| Script | What it does | Exit codes |
|---|---|---|
| `check-mod.sh <mod-dir>` | The gate. Type-checks with `npx -y -p typescript@5 tsc` (first run needs network), proves the hook files were really checked (a mod with no TypeScript hooks skips that proof), then runs `claude plugin validate` and `claude plugin test`. Fails early with a load-once hint when `.claude-plugin/types/` is missing (load the mod once in an interactive session: a headless load of build 2.1.295 writes no type files, so the type check has nothing to check against; engine-traps, "Open issues", issue 100837), and fails when `claude` is not on PATH. Last line is `== PASS` or `== FAIL: <step>`. | 0 pass, 1 fail, 64 usage |
| `new-mod.sh <example-name> <target-dir> <mod-name>` | Copies one tutorial example to `<target-dir>/<mod-name>`, rewrites the name in `plugin.json` and `README.md`, prints other lines that still hold the old name. Refuses an existing target. Commands and tools inside the copied hooks keep the example's names; rename them by hand. | 0 ok, 1 refused (target exists), 64 usage or invalid name |
| `keep-mod.sh <session-mod-dir> <dest-root>` | Copies a mod out of the session mods folder to `<dest-root>/<name>`, leaving out the generated types and root `tsconfig.json`. Never deletes or overwrites anything already there. Prints the `CLAUDE_CODE_PLUGIN_DIRS` line to add. | 0 ok, 1 refused or failed, 64 usage |
| `plan-diff.sh <mod-dir> <plan-file>` or `plan-diff.sh --from-file <validate-output> <plan-file>` | Runs `claude plugin validate` (text output only), or reads output saved earlier, and compares the footprint items it prints with a plan file. Prints what the mod does beyond the plan (`+`) and what the plan lists but the mod does not (`-`). Format and use: [Footprint against a plan](#footprint-against-a-plan). | 0 same, 1 different, 2 unreadable path or plan, unknown label, no footprint line or validate failure, 64 usage |

`check-mod.sh` has no BLOCKED branch yet. When the `claude` login is expired, the validate or test step simply fails and the script prints `== FAIL: <step>`. Read the step output before you blame the mod; a login problem is not a mod defect. A BLOCKED branch will be added once the real message has been captured.

## Footprint against a plan

**House convention.** Write down what a mod is meant to touch before you build it. When it is built, let `claude plugin validate` say what it touches, and treat every difference as a finding. The validator reads the mod's code without running it (`mods-doc-manage-mods-for-organizations`, "Review what a mod can do"), so the check needs no live session.

1. At the planning stage, write a plan file next to your two plain lines (see [Plan-time rules](#plan-time-rules)).
2. After the code exists, run `plan-diff.sh <mod-dir> <plan-file>` from this skill's `scripts/` folder (see [The quickstart scripts](#the-quickstart-scripts)).
3. Read each `+` line (the mod does it, the plan did not say so) and each `-` line (the plan says it, the mod does not). Either change the plan and write the reason in the hand-over, or change the code. Do not close the difference by editing the plan alone.

Plan file format, one entry per line, `<kind>: <item>[, <item>...]`:

```text
# comment lines and blank lines are ignored
hooks: session.start, tool.call{tool=Edit|Write}
calls: $.store.get, $.store.set
env reads: HOME
```

- The kinds are the labels `claude plugin validate` prints: `calls`, `env reads`, `env writes`, `hooks`, `state reads` and `state writes` (`mods-doc-mods-development`, "Change and test a mod"). Any other kind is an error, so a misspelling cannot pass.
- Copy each item as validate prints it, matcher braces included. Items are compared one by one, so order does not matter, and lines of several modules are merged.
- The other lines the validator prints (`gating hook with .catch:`, `gating hook without .catch:`, `answers its own command:`) are not compared. Read the `without .catch` ones by hand: a refusal that has no `.catch` handler is a finding of its own.
- Exit 2 also covers an unknown label on a footprint line and validate output with no footprint line at all, because an empty list must never count as a match.

### What a footprint line lets the mod do

The meanings come from the chapter table for the `calls:` line and the paragraph under it. Which of them a given mod may have is your judgement and the reader's, not the chapter's, so this table grades nothing. Every row cites the chapter text it rests on, or says UNVERIFIED.

| Footprint line | What it lets the mod do | Source |
|---|---|---|
| `calls: $.fs.read`, `$.fs.write` | Read or write files anywhere the user can | `mods-doc-manage-mods-for-organizations`, "Review what a mod can do", the `calls:` table |
| `calls: $.process.run`, `$.process.spawn` | Start programs as the user | same table |
| `calls: $.http.fetch` | Make network requests | same table |
| `calls: $.env.get`, `$.settings.read`; `env reads:` | Read environment variables and settings, which can hold API keys; the `env reads:` line names each variable | same table |
| `calls: $.env.set`; `env writes:` | Set a variable that Claude Code and every program or MCP server it starts later then see, which can change what those programs run; the `env writes:` line names each variable | same table |
| `calls: $.mcp.call` | Call a tool on a connected MCP server, under the session's permission rules | same table |
| `calls: $.model.complete` | Spend the user's plan or API key on model calls | same table |
| `calls: $.prompt.submit` | Submit a prompt, possibly as the user's own words | same table |
| `calls: $.session.send` | Send a message that another session's, subagent's or teammate's Claude reads | same table |
| `hooks: tool.call`, `prompt.submit` | See every tool call and every prompt, and change them | same section, the paragraph on the `hooks:` line |
| `hooks: session.append` | Rewrite each row of the conversation before it is stored | same paragraph |
| `hooks: tool.check` | Approve or deny a tool call before a permission prompt appears | same paragraph |
| `hooks: ui.render{component=AskUserQuestion}` | Redraw the dialog Claude uses to ask the user a question | same paragraph |
| `state reads:`, `state writes:` | List the use of `$.state` (`mods-doc-mods-development`, "Change and test a mod"). What that exposes is UNVERIFIED; the chapter gives no risk for it | none |

### Residual risk

The tests of `plan-diff.sh` run on committed captures of real validate output, because the CI runners have no `claude` binary. The captures name the `claude --version` they came from (`tests/fixtures/validate-fixtures.version`). Nothing in CI notices a newer build that prints these lines differently, so between owner runs a stale capture stays green. The owner run is: when `claude --version` differs from the capture's, validate the example again, replace the capture and its label, and on any difference update `plan-diff.sh` in the same commit. Until then, trust a live `plan-diff.sh <mod-dir> <plan-file>` on your own build over a green CI.

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
| `ui.find` with a plain string for `text` matches part of a longer text; the chapter's example passes `type: 'Text'` and a regular expression anchored with `^` and `$`, which avoids the question | UNVERIFIED for the plain string. `mods-doc-mods-testing`, "Test a drawing" says `text` can be a string or a regular expression, not how a string matches. | Draw `Count: 12` above `Count: 1`, call `ui.find` with the string `'Count: 1'`, and check whether the text that comes back is `Count: 12` or `Count: 1`. |
| Text written as JSX with a value inside it, such as `Count: {n}`, reaches `ui.find` as separate children; if so, write the caption as one template string | UNVERIFIED. The chapter's own example in `mods-doc-mods-testing`, "Test a drawing" matches one anchored regular expression and does not show the JSX form. | Draw `<Text>Count: {n}</Text>`, call `ui.find` with `/^Count: \d+$/`, then draw the template-string form and compare. |
| `claude -p "/<command>"`, with the mod loaded through `--plugin-dir`, runs a command's hook without calling the model, and the command's store writes persist; this checks a command's store writes, not anything it draws (for that, see [Live check](#live-check)) | UNVERIFIED. `mods-doc-mods-overview`, "Where mods run" says hooks run under `claude -p` and nothing drawn appears there; `--plugin-dir` is in `mods-doc-mods-development`. Neither says anything about the model or the store. | Run an ordinary prompt under `-p` with the debug log on and note the line its model request writes; then run a command that writes a store key and look for that same line. Read the key back in an interactive session in the same project. |
| A mod loaded through a symlinked folder is not reloaded when a file behind the link changes, and the old code keeps running; a log line naming the revision at load shows which code runs | UNVERIFIED. | Load a mod through a symlink with a log line that prints a revision at load, change the revision in a file behind the link, trigger the mod, and see which revision the log prints. Repeat the same steps on a real folder as a control; only a difference between the two runs settles the claim. |

## A premise this plugin rejects

One source claims that `$.http.fetch` has no timeout and must be raced against the clock. The chapter says otherwise: `mods-doc-mods-reference`, "Limits" gives one `$.http.fetch` call, redirects and body included, 30 seconds. Do not write a race on that premise. If a build behaves differently, treat it as a bug report and test it.
