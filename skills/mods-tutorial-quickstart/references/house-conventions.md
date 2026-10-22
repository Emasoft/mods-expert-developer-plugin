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
- [Honest hand-over](#honest-hand-over)
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

## Honest hand-over

**House convention.** End every mod you build with two lists.

- Verified: what you ran and saw (validate, test, type-check, a live load) and the command for each.
- Needs human eyes: layout, colours, placement, wording, the behaviour of a key on the person's own terminal. A test cannot see these.
- Name anything from the UNVERIFIED table below that the mod relies on.
- For a clean experiment, launch with `CLAUDE_CONFIG_DIR` set to a fresh folder and `--setting-sources user`, so your real config and project settings stay out of it (`mods-doc-cc-debug-mode`, chapter.md line 129).

## The three quickstart scripts

They live in `skills/mods-tutorial-quickstart/scripts/`. They are tools to run, not example mods. Usage errors exit 64.

| Script | What it does | Exit codes |
|---|---|---|
| `check-mod.sh <mod-dir>` | The gate. Type-checks with `npx -y -p typescript@5 tsc` (first run needs network), proves the hook files were really checked (a mod with no TypeScript hooks skips that proof), then runs `claude plugin validate` and `claude plugin test`. Fails early with a load-once hint when `.claude-plugin/types/` is missing, and fails when `claude` is not on PATH. Last line is `== PASS` or `== FAIL: <step>`. | 0 pass, 1 fail, 64 usage |
| `new-mod.sh <example-name> <target-dir> <mod-name>` | Copies one tutorial example to `<target-dir>/<mod-name>`, rewrites the name in `plugin.json` and `README.md`, prints other lines that still hold the old name. Refuses an existing target. Commands and tools inside the copied hooks keep the example's names; rename them by hand. | 0 ok, 1 refused (target exists), 64 usage or invalid name |
| `keep-mod.sh <session-mod-dir> <dest-root>` | Copies a mod out of the session mods folder to `<dest-root>/<name>`, leaving out the generated types and root `tsconfig.json`. Never deletes or overwrites anything already there. Prints the `CLAUDE_CODE_PLUGIN_DIRS` line to add. | 0 ok, 1 refused or failed, 64 usage |

`check-mod.sh` has no BLOCKED branch yet. When the `claude` login is expired, the validate or test step simply fails and the script prints `== FAIL: <step>`. Read the step output before you blame the mod; a login problem is not a mod defect. A BLOCKED branch will be added once the real message has been captured.

## UNVERIFIED — test on a real build before relying on it

These claims come from another author's notes. The chapters neither confirm nor contradict them. Do not build on one until you have tried it on your own build.

| Claim | Status |
|---|---|
| `$.ui.panes()` returns records with fields such as `isShown` | UNVERIFIED. `mods-doc-mods-reference`, "Mods API methods" lists the method only. |
| `$.command.run` hands the keyboard back to the prompt | UNVERIFIED. |
| A test must pass `origin` and `presentation` to `$.command.run` | UNVERIFIED. The chapters do not say which values a test must give. |
| In a test, a `$.store.get` stub must return `null` for a missing key | UNVERIFIED. |
| Test files may use static imports only | UNVERIFIED. The chapter refuses dynamic `import()` in a hooks module, not in tests. |
| The kit `expect` has no `toBeCloseTo` | UNVERIFIED. |
| A command name must be a literal string for the validator to classify it | UNVERIFIED. `claude plugin validate` printed `command=?` for a non-literal matcher (observed while writing git-poller); the run-time behaviour is still not checked. |
| A types contract file with a bare `export {}` is refused | UNVERIFIED. |
| A `$` call inside a `.catch` handler works as in any other hook | UNVERIFIED. The chapter documents only the 1 second budget of the handler (`mods-doc-mods-reference`, "Limits"). |
| A call that returns control to the engine is refused when the test stubs no UI drawing | UNVERIFIED. `mods-doc-mods-testing`, "Stub what Claude Code would answer" documents the need for a stub, not the exact refusal text. |

## A premise this plugin rejects

One source claims that `$.http.fetch` has no timeout and must be raced against the clock. The chapter says otherwise: `mods-doc-mods-reference`, "Limits" gives one `$.http.fetch` call, redirects and body included, 30 seconds. Do not write a race on that premise. If a build behaves differently, treat it as a bug report and test it.
