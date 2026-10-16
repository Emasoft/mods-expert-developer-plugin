---
name: mods-doc-channels-reference
description: "Use when working on channels reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# CHANNELS REFERENCE

## Overview

Routes reads about channels reference to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the CHANNELS REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs channels reference; otherwise stop without opening the chapter.
2. Pick the CHANNELS REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that channels reference section; do not preload this or any other chapter.
4. Stop when the CHANNELS REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The CHANNELS REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the CHANNELS REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Supported channels". Output: open [Supported channels](references/chapter.md#supported-channels) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level CHANNELS REFERENCE table of contents:

- [Push events into a running session with channels](references/chapter.md#push-events-into-a-running-session-with-channels)
  - [Supported channels](references/chapter.md#supported-channels)
  - [Quickstart](references/chapter.md#quickstart)
  - [Security](references/chapter.md#security)
  - [Enterprise controls for channels](references/chapter.md#enterprise-controls-for-channels)
  - [Research preview](references/chapter.md#research-preview)
  - [How channels compare](references/chapter.md#how-channels-compare)
  - [Next steps](references/chapter.md#next-steps)
