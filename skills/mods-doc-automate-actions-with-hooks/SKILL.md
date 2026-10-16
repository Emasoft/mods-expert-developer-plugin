---
name: mods-doc-automate-actions-with-hooks
description: "Use when working on automate actions with hooks. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# AUTOMATE ACTIONS WITH HOOKS

## Overview

Routes reads about automate actions with hooks to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the AUTOMATE ACTIONS WITH HOOKS chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs automate actions with hooks; otherwise stop without opening the chapter.
2. Pick the AUTOMATE ACTIONS WITH HOOKS section from the Table of Contents under Resources and follow its link.
3. Read only that automate actions with hooks section; do not preload this or any other chapter.
4. Stop when the AUTOMATE ACTIONS WITH HOOKS section is read: this wrapper routes reads only and authorizes no writes.

## Output

The AUTOMATE ACTIONS WITH HOOKS section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the AUTOMATE ACTIONS WITH HOOKS headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Set up your first hook". Output: open [Set up your first hook](references/chapter.md#set-up-your-first-hook) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete AUTOMATE ACTIONS WITH HOOKS table of contents:

- [Automate actions with hooks](references/chapter.md#automate-actions-with-hooks-1)
  - [Set up your first hook](references/chapter.md#set-up-your-first-hook)
  - [What you can automate](references/chapter.md#what-you-can-automate)
    - [Get notified when Claude needs input](references/chapter.md#get-notified-when-claude-needs-input)
    - [Auto-format code after edits](references/chapter.md#auto-format-code-after-edits)
    - [Block edits to protected files](references/chapter.md#block-edits-to-protected-files)
    - [Re-inject context after compaction](references/chapter.md#re-inject-context-after-compaction)
    - [Audit configuration changes](references/chapter.md#audit-configuration-changes)
    - [Reload environment when directory or files change](references/chapter.md#reload-environment-when-directory-or-files-change)
    - [Auto-approve specific permission prompts](references/chapter.md#auto-approve-specific-permission-prompts)
  - [How hooks work](references/chapter.md#how-hooks-work)
    - [Combine results from multiple hooks](references/chapter.md#combine-results-from-multiple-hooks)
    - [Read input and return output](references/chapter.md#read-input-and-return-output)
      - [Hook input](references/chapter.md#hook-input)
      - [Hook output](references/chapter.md#hook-output)
      - [Structured JSON output](references/chapter.md#structured-json-output)
    - [Filter hooks with matchers](references/chapter.md#filter-hooks-with-matchers)
      - [Filter by tool name and arguments with the `if` field](references/chapter.md#filter-by-tool-name-and-arguments-with-the-if-field)
    - [Configure hook location](references/chapter.md#configure-hook-location)
  - [Prompt-based hooks](references/chapter.md#prompt-based-hooks)
  - [Agent-based hooks](references/chapter.md#agent-based-hooks)
  - [HTTP hooks](references/chapter.md#http-hooks)
  - [Limitations and troubleshooting](references/chapter.md#limitations-and-troubleshooting)
    - [Limitations](references/chapter.md#limitations)
    - [Hooks and permission modes](references/chapter.md#hooks-and-permission-modes)
    - [Hook not firing](references/chapter.md#hook-not-firing)
    - [Hook error in output](references/chapter.md#hook-error-in-output)
    - [`/hooks` shows no hooks configured](references/chapter.md#hooks-shows-no-hooks-configured)
    - [Stop hook hits the block cap](references/chapter.md#stop-hook-hits-the-block-cap)
    - [Hook JSON has no effect](references/chapter.md#hook-json-has-no-effect)
      - [Shell profile output before the JSON](references/chapter.md#shell-profile-output-before-the-json)
      - [Fields at the wrong level](references/chapter.md#fields-at-the-wrong-level)
    - [Check what a hook did](references/chapter.md#check-what-a-hook-did)
  - [Learn more](references/chapter.md#learn-more)
