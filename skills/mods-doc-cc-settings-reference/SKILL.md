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

Input: a task about "Settings file scopes locations sharing and enforcement". Output: open [Settings file scopes locations sharing and enforcement](references/chapter.md#settings-file-scopes-locations-sharing-and-enforcement) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level CLAUDE CODE SETTINGS REFERENCE table of contents:

- [Settings files and precedence](references/chapter.md#settings-files-and-precedence)
  - [Settings file scopes locations sharing and enforcement](references/chapter.md#settings-file-scopes-locations-sharing-and-enforcement)
  - [Change apply verify and repair settings](references/chapter.md#change-apply-verify-and-repair-settings)
  - [Settings precedence merging examples and troubleshooting](references/chapter.md#settings-precedence-merging-examples-and-troubleshooting)
  - [Settings in cloud sessions](references/chapter.md#settings-in-cloud-sessions)
  - [What's next](references/chapter.md#whats-next)
