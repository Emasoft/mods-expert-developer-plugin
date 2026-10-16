---
name: mods-doc-cc-permissions-modes
description: "Use when working on claude permissions modes. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# CLAUDE PERMISSIONS MODES

## Overview

Routes reads about claude permissions modes to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the CLAUDE PERMISSIONS MODES chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs claude permissions modes; otherwise stop without opening the chapter.
2. Pick the CLAUDE PERMISSIONS MODES section from the Table of Contents under Resources and follow its link.
3. Read only that claude permissions modes section; do not preload this or any other chapter.
4. Stop when the CLAUDE PERMISSIONS MODES section is read: this wrapper routes reads only and authorizes no writes.

## Output

The CLAUDE PERMISSIONS MODES section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the CLAUDE PERMISSIONS MODES headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Available modes". Output: open [Available modes](references/chapter.md#available-modes) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete CLAUDE PERMISSIONS MODES table of contents:

- [Choose a permission mode](references/chapter.md#choose-a-permission-mode)
  - [Available modes](references/chapter.md#available-modes)
  - [Common setups](references/chapter.md#common-setups)
  - [Switch permission modes](references/chapter.md#switch-permission-modes)
  - [Auto-approve file edits with acceptEdits mode](references/chapter.md#auto-approve-file-edits-with-acceptedits-mode)
  - [Analyze before you edit with plan mode](references/chapter.md#analyze-before-you-edit-with-plan-mode)
    - [Review and approve a plan](references/chapter.md#review-and-approve-a-plan)
    - [Set plan mode as the default](references/chapter.md#set-plan-mode-as-the-default)
    - [Server-side classifier review](references/chapter.md#server-side-classifier-review)
    - [What the classifier blocks by default](references/chapter.md#what-the-classifier-blocks-by-default)
    - [Boundaries you state in conversation](references/chapter.md#boundaries-you-state-in-conversation)
    - [Approvals you state in conversation](references/chapter.md#approvals-you-state-in-conversation)
    - [When auto mode falls back](references/chapter.md#when-auto-mode-falls-back)
      - [Repeated-block thresholds](references/chapter.md#repeated-block-thresholds)
    - [How auto mode evaluates actions](references/chapter.md#how-auto-mode-evaluates-actions)
  - [Allow only pre-approved tools with dontAsk mode](references/chapter.md#allow-only-pre-approved-tools-with-dontask-mode)
  - [Skip all checks with bypassPermissions mode](references/chapter.md#skip-all-checks-with-bypasspermissions-mode)
  - [Protected paths](references/chapter.md#protected-paths)
  - [Critical paths](references/chapter.md#critical-paths)
    - [Which paths are critical](references/chapter.md#which-paths-are-critical)
    - [Other targets that count as critical paths](references/chapter.md#other-targets-that-count-as-critical-paths)
    - [Removals inside nested commands and inline scripts](references/chapter.md#removals-inside-nested-commands-and-inline-scripts)
    - [Rewrite a flagged command](references/chapter.md#rewrite-a-flagged-command)
    - [Critical-path removals in each permission mode](references/chapter.md#critical-path-removals-in-each-permission-mode)
    - [Time limits and denials in auto and bypassPermissions modes](references/chapter.md#time-limits-and-denials-in-auto-and-bypasspermissions-modes)
    - [Remove-Item in PowerShell](references/chapter.md#remove-item-in-powershell)
  - [See also](references/chapter.md#see-also)
