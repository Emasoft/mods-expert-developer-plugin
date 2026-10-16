---
name: mods-doc-status-line-customization
description: "Use when working on status line customization. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# STATUS LINE CUSTOMIZATION

## Overview

Routes reads about status line customization to its Claude Code chapter. Consult the preserved reference for this topic.

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

Full chapter: [the chapter](references/chapter.md), with the section-level STATUS LINE CUSTOMIZATION table of contents:

- [Customize your status line](references/chapter.md#customize-your-status-line)
  - [Set up a status line](references/chapter.md#set-up-a-status-line)
  - [Build a status line step by step](references/chapter.md#build-a-status-line-step-by-step)
  - [How status lines work](references/chapter.md#how-status-lines-work)
  - [Available data](references/chapter.md#available-data)
  - [Ready-made status line examples](references/chapter.md#ready-made-status-line-examples)
  - [Subagent status lines](references/chapter.md#subagent-status-lines)
  - [Tips](references/chapter.md#tips)
  - [Troubleshooting](references/chapter.md#troubleshooting)
