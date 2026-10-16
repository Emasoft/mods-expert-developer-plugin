---
name: mods-doc-cross-session-messaging-reference
description: "Use when working on cross session messaging reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# CROSS SESSION MESSAGING REFERENCE

## Overview

Routes reads about cross session messaging reference to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the CROSS SESSION MESSAGING REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs cross session messaging reference; otherwise stop without opening the chapter.
2. Pick the CROSS SESSION MESSAGING REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that cross session messaging reference section; do not preload this or any other chapter.
4. Stop when the CROSS SESSION MESSAGING REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The CROSS SESSION MESSAGING REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the CROSS SESSION MESSAGING REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "When to use cross-session messaging". Output: open [When to use cross-session messaging](references/chapter.md#when-to-use-cross-session-messaging) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level CROSS SESSION MESSAGING REFERENCE table of contents:

- [Message your other Claude Code sessions](references/chapter.md#message-your-other-claude-code-sessions)
  - [When to use cross-session messaging](references/chapter.md#when-to-use-cross-session-messaging)
  - [Message another session](references/chapter.md#message-another-session)
  - [How a session treats an incoming message](references/chapter.md#how-a-session-treats-an-incoming-message)
  - [Restrict cross-session messaging](references/chapter.md#restrict-cross-session-messaging)
  - [Availability](references/chapter.md#availability)
  - [Limitations](references/chapter.md#limitations)
  - [Related resources](references/chapter.md#related-resources)
