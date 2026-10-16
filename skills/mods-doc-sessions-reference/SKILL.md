---
name: mods-doc-sessions-reference
description: "Use when working on sessions reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# SESSIONS REFERENCE

## Overview

Routes reads about sessions reference to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the SESSIONS REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs sessions reference; otherwise stop without opening the chapter.
2. Pick the SESSIONS REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that sessions reference section; do not preload this or any other chapter.
4. Stop when the SESSIONS REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The SESSIONS REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the SESSIONS REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Resume a session". Output: open [Resume a session](references/chapter.md#resume-a-session) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level SESSIONS REFERENCE table of contents:

- [Manage sessions](references/chapter.md#manage-sessions)
  - [Resume a session](references/chapter.md#resume-a-session)
  - [Name your sessions](references/chapter.md#name-your-sessions)
  - [Use the session picker](references/chapter.md#use-the-session-picker)
  - [Branch a session](references/chapter.md#branch-a-session)
  - [Manage context within a session](references/chapter.md#manage-context-within-a-session)
  - [Export and locate session data](references/chapter.md#export-and-locate-session-data)
  - [See also](references/chapter.md#see-also)
