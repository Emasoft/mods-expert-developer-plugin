---
name: mods-tutorial-quickstart
description: "Use when building a first mod and you want a step-by-step checklist that names the chapter skill for each step, a list of traps not in the chapters, and an index of the example mods. Reference-only tutorial; the mods-doc-* chapters stay authoritative."
user-invocable: false
metadata:
  coordination: exempt
---

# MODS TUTORIAL QUICKSTART

Tutorial and reference example only. The mods-doc-* chapter skills of this plugin are authoritative and win on any disagreement. The example code under examples/ is for reading and copying into your own project; it is never installed or loaded as part of this plugin. Do not point --plugin-dir at a copy inside the plugin cache.

## Overview

A mod is a Claude Code plugin whose behaviour is a TypeScript or JavaScript hooks module: one file exports `register(on)`, and each hook has the shape `($, e, next)`. This tutorial is a checklist for making one. Each step names the chapter skill that owns the facts, so the step stays short and the chapter stays the single source.

It is adapted from the `creating-mods` skill of BeLazy167/claude-mods-skill (MIT, see NOTICE at the plugin root). The source's install steps, community links and claims the chapters contradict were dropped. Claims the chapters do not confirm are marked UNVERIFIED in the traps table below.

The example mods live in two sibling tutorials: `mods-tutorial-call-intercept-mods` (tool-call hooks and a tool the model calls) and `mods-tutorial-interface-mods` (a band above the prompt and a pane).

## Prerequisites

- Claude Code 2.1.287 or later in the terminal, where mods are on by default (chapter skill `mods-doc-mods-overview`, section "Turn mods on or off").
- The built-in `plugin-authoring` skill, which names the types file, the mods folder and the reload flow of the build you run (chapter skill `mods-doc-mods-development`, section "Ask Claude for a mod").
- A folder you own for the mod. A mod made in the session's mods folder is deleted after `cleanupPeriodDays`.

## Instructions

0. Clarify before you build. Read [house conventions](references/house-conventions.md) and answer five questions about the mod: which surface it uses (status line, band, pane, tool hook), how often it updates, whether it starts on or off, what scope it covers (one project or every session), and its name. If the user has not said, ask. `scripts/new-mod.sh` accepts only a kebab-case name: lowercase letters and digits in words joined by single hyphens, starting with a letter (2 to 64 characters).
1. Load the `plugin-authoring` skill and follow where it says to write the mod. Facts: `mods-doc-mods-development`, "Ask Claude for a mod".
2. Copy the closest example from the index below into your folder and rename it in `.claude-plugin/plugin.json`. A name that starts with `claude-`, `anthropic-`, `anthropics-` or `cc-plugin-` is refused. Facts: `mods-doc-plugin-manifest-reference`.
3. Read the types for the event you hook. Claude Code writes them under `.claude-plugin/types/` on each load, with a root `tsconfig.json`; never edit or commit `.claude-plugin/types/`. Facts: `mods-doc-mods-development`, "Change and test a mod".
4. Write the hook. One plain hook per event per module, a refusal before `next`, and a `.catch` on every hook that can refuse. Facts: `mods-doc-mods-and-events`, "How a hook handles an event" and "Mod ordering and failed hooks".
5. Run `claude plugin validate <mod>` and read what it lists. Facts: `mods-doc-mods-development`, "Change and test a mod".
6. Write `tests/*.test.ts` and run `claude plugin test` in the mod folder. Facts: `mods-doc-mods-testing`, "Write a mod test".
7. Type-check with `npx -p typescript@5 tsc -p <mod> --noEmit` once the types are written. This command comes from the source and is not in the chapters. The script `${CLAUDE_SKILL_DIR}/scripts/check-mod.sh <mod-dir>` (this skill's own folder; Claude Code fills in the path when the skill is loaded) runs this type-check, step 5 and step 6 in one go and prints `== PASS` or `== FAIL: <step>`.
8. Run it live with `claude --plugin-dir <mod>`; saving a file reloads it. Facts: `mods-doc-mods-troubleshooting`, "Find out why a mod does nothing" and "Read the debug log".
9. Ship it from a repository you keep, and bump `version` on every release. Facts: `mods-doc-mods-development`, "Share your mod", and `mods-doc-publish-a-plugin`.

### Traps the chapters do not settle

| Trap from the source | Status |
|---|---|
| Run a slash command with `$.command.run({ command: 'compact' })`, not `$.prompt.submit` | UNVERIFIED. The chapters list only the `run` method; for compaction they document `$.session.compact`. |
| A rewritten result returned as `{ ...r, text }` is ignored, because `text` and `ref` are set by core; answer `{ result: newResult }` | UNVERIFIED. `redact-output` follows this shape. |
| A path guard is bypassed by `..`, symlinks or other spellings; allow-list on `(await $.fs.stat(path, { resolve: true })).realPath` | UNVERIFIED API. Normalising a path before you allow-list it is sound either way. |
| `mobile` has no `Input` and `vscode` no `Client` | UNVERIFIED. The reference confirms only that `Raster` and `Image` draw in the terminal alone. |
| `h` is a global in a `.tsx` hooks module | UNVERIFIED. |
| A `Client` module path must be a string literal | UNVERIFIED. |
| `tsc` rejects a mount target unless `props` are the site's full props; copy the `PANE` constant of `notes-pane` | UNVERIFIED. |
| `claude plugin test` reports `the rollout switch served off` for users on an LLM gateway | UNVERIFIED. |

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

A mod folder of your own that passes `claude plugin validate` and `claude plugin test`, built step by step from the chapters, with the trap rows above checked against your build instead of assumed.

## Error Handling

- A chapter and this tutorial disagree: follow the chapter, and treat the tutorial line as stale.
- A step fails or a hook never fires: load `mods-doc-mods-troubleshooting` and start at "Find out why a mod does nothing".
- An UNVERIFIED trap matters to your mod: test it on your build before you rely on it, and prefer the documented call the Status column names.

## Examples

Input: "make a mod that blocks `git push --force`". Output: copy `hello-mod` from `mods-tutorial-call-intercept-mods`, rename it, change the deny condition, then run steps 5 to 8.

Input: "show the test status above the prompt". Output: copy `branch-band` from `mods-tutorial-interface-mods`, replace `readBranch` with your command, then run steps 5 to 8.

## Resources

- `mods-tutorial-call-intercept-mods`: `hello-mod`, `redact-output`, `dice-tool` and `protect-files`, with their code under its examples folder.
- `mods-tutorial-interface-mods`: `branch-band`, `notes-pane`, `turn-timer` and `git-poller`, with their code under its examples folder.
- [house-conventions](references/house-conventions.md): this plugin's own conventions for mods you keep (not Anthropic rules), the `check-mod.sh`, `new-mod.sh` and `keep-mod.sh` scripts, and a table of claims to test on a real build.
  - [How to read this file](references/house-conventions.md#how-to-read-this-file)
  - [An on/off switch](references/house-conventions.md#an-onoff-switch)
  - [Keyboard first](references/house-conventions.md#keyboard-first)
  - [Pure logic in logic.ts, thin register](references/house-conventions.md#pure-logic-in-logicts-thin-register)
  - [Pollers](references/house-conventions.md#pollers)
  - [Toasts on transitions only](references/house-conventions.md#toasts-on-transitions-only)
  - [Mutation-check every guard test](references/house-conventions.md#mutation-check-every-guard-test)
  - [Honest hand-over](references/house-conventions.md#honest-hand-over)
  - [The three quickstart scripts](references/house-conventions.md#the-three-quickstart-scripts)
  - [UNVERIFIED — test on a real build before relying on it](references/house-conventions.md#unverified--test-on-a-real-build-before-relying-on-it)
  - [A premise this plugin rejects](references/house-conventions.md#a-premise-this-plugin-rejects)
- Chapter skills used above: `mods-doc-mods-development`, `mods-doc-mods-and-events`, `mods-doc-mods-testing`, `mods-doc-mods-troubleshooting`, `mods-doc-mods-overview`, `mods-doc-plugin-manifest-reference` and `mods-doc-publish-a-plugin`.
