---
name: mods-doc-status-line-customization
description: "Use when working on status line customization. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# STATUS LINE CUSTOMIZATION

## Overview

Routes reads about status line customization to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the STATUS LINE CUSTOMIZATION chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs status line customization; otherwise stop without opening the chapter.
2. Pick the STATUS LINE CUSTOMIZATION section from the Table of Contents under Resources and follow its link.
3. Read only that status line customization section; do not preload this or any other chapter.
4. Stop when the STATUS LINE CUSTOMIZATION section is read: this wrapper routes reads only and authorizes no writes.

## Output

The STATUS LINE CUSTOMIZATION section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the STATUS LINE CUSTOMIZATION headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Set up a status line". Output: open [Set up a status line](references/chapter.md#set-up-a-status-line) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete STATUS LINE CUSTOMIZATION table of contents:

- [Customize your status line](references/chapter.md#customize-your-status-line)
  - [Set up a status line](references/chapter.md#set-up-a-status-line)
    - [Use the /statusline command](references/chapter.md#use-the-statusline-command)
    - [Manually configure a status line](references/chapter.md#manually-configure-a-status-line)
    - [Disable the status line](references/chapter.md#disable-the-status-line)
  - [Build a status line step by step](references/chapter.md#build-a-status-line-step-by-step)
  - [How status lines work](references/chapter.md#how-status-lines-work)
    - [When the status line updates](references/chapter.md#when-the-status-line-updates)
    - [What your script can output](references/chapter.md#what-your-script-can-output)
    - [Size output to the terminal](references/chapter.md#size-output-to-the-terminal)
  - [Available data](references/chapter.md#available-data)
    - [Context window fields](references/chapter.md#context-window-fields)
    - [Spend limit fields](references/chapter.md#spend-limit-fields)
    - [Prompt cache fields](references/chapter.md#prompt-cache-fields)
  - [Examples](references/chapter.md#examples)
    - [Context window usage](references/chapter.md#context-window-usage)
    - [Git status with colors](references/chapter.md#git-status-with-colors)
    - [Cost and duration tracking](references/chapter.md#cost-and-duration-tracking)
    - [Display multiple lines](references/chapter.md#display-multiple-lines)
    - [Clickable links](references/chapter.md#clickable-links)
    - [Rate limit usage](references/chapter.md#rate-limit-usage)
    - [Cache expensive operations](references/chapter.md#cache-expensive-operations)
    - [Windows configuration](references/chapter.md#windows-configuration)
  - [Subagent status lines](references/chapter.md#subagent-status-lines)
    - [Task fields](references/chapter.md#task-fields)
  - [Tips](references/chapter.md#tips)
  - [Troubleshooting](references/chapter.md#troubleshooting)
    - [Status line not appearing](references/chapter.md#status-line-not-appearing)
    - [Status line shows `--` or empty values](references/chapter.md#status-line-shows----or-empty-values)
    - [Context percentage shows unexpected values](references/chapter.md#context-percentage-shows-unexpected-values)
    - [OSC 8 links not clickable](references/chapter.md#osc-8-links-not-clickable)
    - [Display glitches with escape sequences](references/chapter.md#display-glitches-with-escape-sequences)
    - [Workspace trust required](references/chapter.md#workspace-trust-required)
    - [Script errors or hangs](references/chapter.md#script-errors-or-hangs)
    - [Notifications share the status line row](references/chapter.md#notifications-share-the-status-line-row)
