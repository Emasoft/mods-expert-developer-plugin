---
name: mods-tutorial-quickstart
description: "Use when building a first mod and you want a step-by-step checklist that names the chapter skill for each step, a list of traps not in the chapters, and an index of the example mods. Reference-only tutorial; the mods-doc-* chapters stay authoritative."
user-invocable: false
metadata:
  coordination: exempt
---

# MODS TUTORIAL QUICKSTART

Tutorial and reference example only. The mods-doc-* chapter skills of this plugin are authoritative and win on any disagreement, with one exception: for API names and type shapes (event, method and argument names and their TypeScript types), the type files your running build generates win, because events and methods change across releases (chapter skill mods-doc-mods-development, section "Change and test a mod"); for behaviour the types cannot express (ordering, timing, what `next` does) the chapters still win. The example code under examples/ is for reading and copying into your own project; it is never installed or loaded as part of this plugin. Do not point --plugin-dir at a copy inside the plugin cache.

## Overview

A mod is a Claude Code plugin whose behaviour is a TypeScript or JavaScript hooks module: one file exports `register(on)`, and each hook has the shape `($, e, next)`. This tutorial is a checklist for making one. Each step names the chapter skill that owns the facts, so the chapter stays the single source.

It is adapted from the `creating-mods` skill of BeLazy167/claude-mods-skill (MIT, see NOTICE at the plugin root). The source's install steps, community links and claims the chapters contradict were dropped. Claims the chapters do not confirm are marked UNVERIFIED in the [traps table](references/traps-table.md).

The example mods live in two sibling tutorials: `mods-tutorial-call-intercept-mods` (tool-call hooks, a tool the model calls) and `mods-tutorial-interface-mods` (a band above the prompt, a pane).

## Prerequisites

- Claude Code 2.1.287 or later in the terminal, where mods are on by default (chapter skill `mods-doc-mods-overview`, section "Turn mods on or off").
- The built-in `plugin-authoring` skill, which names the types file, the mods folder and the reload flow of your build (chapter skill `mods-doc-mods-development`, section "Ask Claude for a mod").
- A folder you own for the mod; one made in the session's mods folder is deleted after `cleanupPeriodDays`.

## Instructions

0. Clarify before you build. Answer five questions: which surface the mod uses (status line, band, pane, tool hook), how often it updates, whether it starts on or off, what scope it covers (one project or every session), and its name. If the user has not said, ask; for the surface, offer the least intrusive form first (status line, then band, then pane). `scripts/new-mod.sh` accepts only a kebab-case name: lowercase letters and digits in words joined by single hyphens, starting with a letter (2 to 64 characters). Then work through the [Before the mod exists](references/house-conventions.md#before-the-mod-exists) rules.
   - Check that a mod suits the job. In `mods-doc-mods-overview`, the section that sets mods beside settings hooks, skills and MCP servers has a "Pick it when" row for each; when another covers the job, build that instead. Replacing a working settings hook? Keep the hook until the mod has run on your build (this plugin's advice, not a chapter rule).
1. Load the `plugin-authoring` skill and follow where it says to write the mod. Facts: `mods-doc-mods-development`, "Ask Claude for a mod".
2. Copy the closest example from the index below into your folder and rename it in `.claude-plugin/plugin.json`. A name that starts with `claude-`, `anthropic-`, `anthropics-` or `cc-plugin-` is refused. Facts: `mods-doc-plugin-manifest-reference`.
3. Read the types for the event you hook. Claude Code writes them under `.claude-plugin/types/` on each load, with a root `tsconfig.json`; never edit or commit that folder. Facts: `mods-doc-mods-development`, "Change and test a mod".
4. Write the hook. One plain hook per event per module, a refusal before `next`, and a `.catch` on every hook that can refuse. Use a matcher where the event has one, and keep each `$` call only if you can say what breaks without it (the [plan-time rules](references/house-conventions.md#plan-time-rules)). Facts: `mods-doc-mods-and-events`, "How a hook handles an event" and "Mod ordering and failed hooks".
5. Run `claude plugin validate <mod>` and read what it lists. Facts: `mods-doc-mods-development`, "Change and test a mod".
6. Write `tests/*.test.ts` and run `claude plugin test` in the mod folder. Facts: `mods-doc-mods-testing`, "Write a mod test".
7. Type-check with `npx -p typescript@5 tsc -p <mod> --noEmit` once the types are written. The chapter shows only `tsc -p ./first-mod` (`mods-doc-mods-development`, "Change and test a mod"); the `npx -p typescript@5` form and `--noEmit` come from the source. The script `${CLAUDE_SKILL_DIR}/scripts/check-mod.sh <mod-dir>` (this skill's own folder; Claude Code fills in the path when the skill is loaded) runs it plus steps 5 and 6 in one go and prints `== PASS` or `== FAIL: <step>`.
8. Run it live with `claude --plugin-dir <mod>`; saving a file reloads it. An agent drives this live check with the Anthropic `computer-use` skill: see the house conventions, [Live check](references/house-conventions.md#live-check). Facts: `mods-doc-mods-troubleshooting`, "Find out why a mod does nothing" and "Read the debug log".
9. Ship it from a repository you keep, and bump `version` on every release. Facts: `mods-doc-mods-development`, "Share your mod", and `mods-doc-publish-a-plugin`.

### Traps the chapters do not settle

Claims from the source that the chapters do not confirm, one row each; open the [traps table](references/traps-table.md) before you use one of these calls: `$.command.run` for `compact` against `$.session.compact`, a rewritten result as `{ ...r, text }` versus `{ result }`, path guards with `$.fs.stat` and `resolve`, `Input` on mobile and `Client` on vscode, `h` in a `.tsx` hooks module, a literal `Client` module path, a `tsc` mount target and `props`, the gateway message from `claude plugin test`, `*` hooks at `engine.create`, testing a mod that needs a second mod, and the `plugin-authoring` skill starting the watch. The VERIFIED row covers test inputs that run under `claude plugin test` but fail `tsc`: the short fires of `$.command.run` and `turn.complete`, and a stubbed `$.command.register` handler.

### Example index

| Task | Example | Tutorial skill |
|---|---|---|
| Block a tool call | `hello-mod` | `mods-tutorial-call-intercept-mods` |
| Change a tool's output before the model reads it | `redact-output` | `mods-tutorial-call-intercept-mods` |
| A tool the model can call | `dice-tool` | `mods-tutorial-call-intercept-mods` |
| A line or band above the prompt | `branch-band` | `mods-tutorial-interface-mods` |
| A slash command and a pane | `notes-pane` | `mods-tutorial-interface-mods` |
| A status line and a toast on a transition | `turn-timer` | `mods-tutorial-interface-mods` |
| Poll a command on a timer | `git-poller` | `mods-tutorial-interface-mods` |
| Guard files with a stored list | `protect-files` | `mods-tutorial-call-intercept-mods` |

### Anthropic mods to read next

The chapter skill `mods-doc-mods-overview` links each of these in "Try a sample mod" and "Read the source of built-in mods":

- In the Claude Code repository: `diff` (a pane with buttons bound to keyboard actions), `agents-md` (a `userConfig` option), `sec-default` (a policy guard) and `telemetry` (methods other mods call, with their types).
- In `claude-code-playground`: `token-weather` (a chart above the prompt), `blast-radius` (holds a risky shell command behind proceed and cancel buttons) and `replay-theater` (`/replay` steps through the last turn's edits).

## Output

A mod folder of your own that passes `claude plugin validate` and `claude plugin test`, built from the chapters, with the trap rows checked against your build.

## Error Handling

- A chapter and this tutorial disagree: follow the chapter and treat the tutorial line as stale, except for API names and type shapes, where the notice at the top of this skill applies.
- `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` is still set: it is ignored, so `0` does not turn mods off; remove it (`mods-doc-mods-overview`, "Turn mods on or off").
- A step fails or a hook never fires: load `mods-doc-mods-troubleshooting` and start at "Find out why a mod does nothing", then look the symptom up in [engine-traps](references/engine-traps.md).
- An UNVERIFIED trap matters to your mod: test it on your build first, and prefer the documented call the Status column names.

## Examples

Input: "make a mod that blocks `git push --force`". Output: copy `hello-mod` from `mods-tutorial-call-intercept-mods`, rename it, change the deny condition, then run steps 5 to 8.

Input: "show the test status above the prompt". Output: copy `branch-band` from `mods-tutorial-interface-mods`, replace `readBranch` with your command, then run steps 5 to 8.

## Resources

- `mods-tutorial-call-intercept-mods`: `hello-mod`, `redact-output`, `dice-tool` and `protect-files`, with their code under its examples folder.
- `mods-tutorial-interface-mods`: `branch-band`, `notes-pane`, `turn-timer` and `git-poller`, with their code under its examples folder.
- [house-conventions](references/house-conventions.md): this plugin's own conventions for mods you keep (not Anthropic rules), the `check-mod.sh`, `new-mod.sh`, `keep-mod.sh` and `plan-diff.sh` scripts, a footprint risk table, and a table of claims to test on a real build.
  - [How to read this file](references/house-conventions.md#how-to-read-this-file)
  - [An on/off switch](references/house-conventions.md#an-onoff-switch)
  - [Keyboard first](references/house-conventions.md#keyboard-first)
  - [Pure logic in logic.ts, thin register](references/house-conventions.md#pure-logic-in-logicts-thin-register)
  - [Pollers](references/house-conventions.md#pollers)
  - [Toasts on transitions only](references/house-conventions.md#toasts-on-transitions-only)
  - [Look and feel](references/house-conventions.md#look-and-feel)
  - [Live check](references/house-conventions.md#live-check)
  - [Mutation-check every guard test](references/house-conventions.md#mutation-check-every-guard-test)
  - [Plan-time rules](references/house-conventions.md#plan-time-rules)
  - [Honest hand-over](references/house-conventions.md#honest-hand-over)
  - [README template](references/house-conventions.md#readme-template)
  - [The quickstart scripts](references/house-conventions.md#the-quickstart-scripts)
  - [Footprint against a plan](references/house-conventions.md#footprint-against-a-plan)
  - [UNVERIFIED — test on a real build before relying on it](references/house-conventions.md#unverified--test-on-a-real-build-before-relying-on-it)
  - [A premise this plugin rejects](references/house-conventions.md#a-premise-this-plugin-rejects)
- [traps-table](references/traps-table.md): the traps the chapters do not settle, one row each, UNVERIFIED unless a type file settled it, including the VERIFIED row on test inputs that pass at runtime but fail `tsc`.
  - [How to read this table](references/traps-table.md#how-to-read-this-table)
  - [The traps](references/traps-table.md#the-traps)
- [engine-traps](references/engine-traps.md): engine behaviour indexed by symptom, each row tagged CHAPTER, UPSTREAM or UNVERIFIED with the run that settles it, plus open issues and stale claims.
  - [How to read this file](references/engine-traps.md#how-to-read-this-file)
  - [The mod does not load](references/engine-traps.md#the-mod-does-not-load)
  - [A hook misbehaves](references/engine-traps.md#a-hook-misbehaves)
  - [State and timers](references/engine-traps.md#state-and-timers)
  - [Drawing](references/engine-traps.md#drawing)
  - [Platform and packaging](references/engine-traps.md#platform-and-packaging)
  - [Open issues](references/engine-traps.md#open-issues)
  - [Stale or conflicting claims](references/engine-traps.md#stale-or-conflicting-claims)
- [threat-model](references/threat-model.md): a template for the reach and abuse cases of a mod, with the chapters' policy facts and a table of unconfirmed claims.
  - [How to use this template](references/threat-model.md#how-to-use-this-template)
  - [Fill-in block](references/threat-model.md#fill-in-block)
  - [Loading and the built-in guard](references/threat-model.md#loading-and-the-built-in-guard)
  - [What the guard protects and what it leaves open](references/threat-model.md#what-the-guard-protects-and-what-it-leaves-open)
  - [Permission checks a mod can and cannot override](references/threat-model.md#permission-checks-a-mod-can-and-cannot-override)
  - [Network and file reach](references/threat-model.md#network-and-file-reach)
  - [Organisation options](references/threat-model.md#organisation-options)
  - [Switching mods off](references/threat-model.md#switching-mods-off)
  - [Hostile input by event](references/threat-model.md#hostile-input-by-event)
  - [Claims the chapters do not confirm](references/threat-model.md#claims-the-chapters-do-not-confirm)
  - [Keeping the model in step](references/threat-model.md#keeping-the-model-in-step)
- [review-checklist](references/review-checklist.md): a review procedure for a mod, grouped by the risk each check guards against, with a severity on every check.
  - [How to run a review](references/review-checklist.md#how-to-run-a-review)
  - [Risk: the mod does more than it says](references/review-checklist.md#risk-the-mod-does-more-than-it-says)
  - [Risk: the mod sees more than the job needs](references/review-checklist.md#risk-the-mod-sees-more-than-the-job-needs)
  - [Risk: the mod has more reach than the job needs](references/review-checklist.md#risk-the-mod-has-more-reach-than-the-job-needs)
  - [Risk: a refusal that does not hold](references/review-checklist.md#risk-a-refusal-that-does-not-hold)
  - [Risk: a failure nobody sees](references/review-checklist.md#risk-a-failure-nobody-sees)
  - [Risk: untrusted input reaches a sink](references/review-checklist.md#risk-untrusted-input-reaches-a-sink)
  - [Risk: names and shapes from the wrong release](references/review-checklist.md#risk-names-and-shapes-from-the-wrong-release)
  - [Risk: the mod cannot be loaded or switched off](references/review-checklist.md#risk-the-mod-cannot-be-loaded-or-switched-off)
  - [Closing the review](references/review-checklist.md#closing-the-review)
- Chapter skills used above: `mods-doc-mods-development`, `mods-doc-mods-and-events`, `mods-doc-mods-testing`, `mods-doc-mods-troubleshooting`, `mods-doc-mods-overview`, `mods-doc-plugin-manifest-reference` and `mods-doc-publish-a-plugin`.
