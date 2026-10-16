---
name: mods-doc-cc-settings-reference
description: "Use when working on claude code settings reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# CLAUDE CODE SETTINGS REFERENCE

## Overview

Routes reads about claude code settings reference to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the CLAUDE CODE SETTINGS REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs claude code settings reference; otherwise stop without opening the chapter.
2. Pick the CLAUDE CODE SETTINGS REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that claude code settings reference section; do not preload this or any other chapter.
4. Stop when the CLAUDE CODE SETTINGS REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The CLAUDE CODE SETTINGS REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the CLAUDE CODE SETTINGS REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Settings files and who they affect". Output: open [Settings files and who they affect](references/chapter.md#settings-files-and-who-they-affect) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level CLAUDE CODE SETTINGS REFERENCE table of contents:

- [Settings files and precedence](references/chapter.md#settings-files-and-precedence)
  - [Settings files and who they affect](references/chapter.md#settings-files-and-who-they-affect)
  - [Change and verify a setting](references/chapter.md#change-and-verify-a-setting)
  - [Settings precedence and merging](references/chapter.md#settings-precedence-and-merging)
  - [Settings in cloud sessions](references/chapter.md#settings-in-cloud-sessions)
  - [What's next](references/chapter.md#whats-next)
