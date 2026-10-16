---
name: mods-doc-mods-troubleshooting
description: "Use when working on mods troubleshooting. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# MODS TROUBLESHOOTING

## Overview

Routes reads about mods troubleshooting to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the MODS TROUBLESHOOTING chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs mods troubleshooting; otherwise stop without opening the chapter.
2. Pick the MODS TROUBLESHOOTING section from the Table of Contents under Resources and follow its link.
3. Read only that mods troubleshooting section; do not preload this or any other chapter.
4. Stop when the MODS TROUBLESHOOTING section is read: this wrapper routes reads only and authorizes no writes.

## Output

The MODS TROUBLESHOOTING section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the MODS TROUBLESHOOTING headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Find out why a mod does nothing". Output: open [Find out why a mod does nothing](references/chapter.md#find-out-why-a-mod-does-nothing) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete MODS TROUBLESHOOTING table of contents:

- [Troubleshoot a mod](references/chapter.md#troubleshoot-a-mod)
  - [Find out why a mod does nothing](references/chapter.md#find-out-why-a-mod-does-nothing)
  - [Check whether mods can load](references/chapter.md#check-whether-mods-can-load)
  - [The mod doesn't load](references/chapter.md#the-mod-doesnt-load)
    - [Your version is too old](references/chapter.md#your-version-is-too-old)
    - [The `mods active` line doesn't name the mod](references/chapter.md#the-mods-active-line-doesnt-name-the-mod)
    - [A `claude -p` run prints `hooks module not loaded`](references/chapter.md#a-claude--p-run-prints-hooks-module-not-loaded)
    - [Refusal messages](references/chapter.md#refusal-messages)
    - [Messages from the built-in guard](references/chapter.md#messages-from-the-built-in-guard)
    - [`validate` passes and lists no `hooks` line](references/chapter.md#validate-passes-and-lists-no-hooks-line)
    - [`hooks module did not load`](references/chapter.md#hooks-module-did-not-load)
    - [`options do not fit plugin.json userConfig`](references/chapter.md#options-do-not-fit-pluginjson-userconfig)
    - [`code nested too deep to scan: more than 2000 scopes`](references/chapter.md#code-nested-too-deep-to-scan-more-than-2000-scopes)
    - [No mod loads in a directory you opened for the first time](references/chapter.md#no-mod-loads-in-a-directory-you-opened-for-the-first-time)
    - [No installed plugin loads at all](references/chapter.md#no-installed-plugin-loads-at-all)
    - [Claude Code stops asking to enable hot reloading](references/chapter.md#claude-code-stops-asking-to-enable-hot-reloading)
  - [A hook is skipped or a mod is unloaded](references/chapter.md#a-hook-is-skipped-or-a-mod-is-unloaded)
    - [`hook skipped`](references/chapter.md#hook-skipped)
    - [`no command.run hook answered it`](references/chapter.md#no-commandrun-hook-answered-it)
    - [`it crashed the hooks worker`](references/chapter.md#it-crashed-the-hooks-worker)
    - [`its session.start ran again in a fresh copy`](references/chapter.md#its-sessionstart-ran-again-in-a-fresh-copy)
    - [`$.agent.register refused: the hooks module that made the call is no longer loaded`](references/chapter.md#agentregister-refused-the-hooks-module-that-made-the-call-is-no-longer-loaded)
    - [`mods that run in the hooks worker are off for this session`](references/chapter.md#mods-that-run-in-the-hooks-worker-are-off-for-this-session)
  - [A tool call is denied](references/chapter.md#a-tool-call-is-denied)
    - [`a hook changed this call's input after the model wrote it`](references/chapter.md#a-hook-changed-this-calls-input-after-the-model-wrote-it)
    - [A message about the deny rules in your settings](references/chapter.md#a-message-about-the-deny-rules-in-your-settings)
  - [A drawing doesn't appear or respond](references/chapter.md#a-drawing-doesnt-appear-or-respond)
    - [A pane or band is empty or shows Claude Code's usual content](references/chapter.md#a-pane-or-band-is-empty-or-shows-claude-codes-usual-content)
    - [A `ui.render` line says `threw while drawn`](references/chapter.md#a-uirender-line-says-threw-while-drawn)
    - [`the module failed without a message`](references/chapter.md#the-module-failed-without-a-message)
    - [`$.ui.open` runs and no pane appears](references/chapter.md#uiopen-runs-and-no-pane-appears)
    - [A toast doesn't appear](references/chapter.md#a-toast-doesnt-appear)
    - [Hotkeys do nothing](references/chapter.md#hotkeys-do-nothing)
    - [A drawing works in the terminal and not in the Desktop app](references/chapter.md#a-drawing-works-in-the-terminal-and-not-in-the-desktop-app)
  - [An edit or a value is lost](references/chapter.md#an-edit-or-a-value-is-lost)
    - [Your edits don't take effect](references/chapter.md#your-edits-dont-take-effect)
    - [A value resets when the module reloads](references/chapter.md#a-value-resets-when-the-module-reloads)
    - [A value resets after `/clear`, `/resume`, or `/branch`](references/chapter.md#a-value-resets-after-clear-resume-or-branch)
  - [Read the debug log](references/chapter.md#read-the-debug-log)
  - [Related Topics](references/chapter.md#related-topics)
