---
name: mods-doc-prompt-caching-reference
description: "Use when working on prompt caching reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# PROMPT CACHING REFERENCE

## Overview

Routes reads about prompt caching reference to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the PROMPT CACHING REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs prompt caching reference; otherwise stop without opening the chapter.
2. Pick the PROMPT CACHING REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that prompt caching reference section; do not preload this or any other chapter.
4. Stop when the PROMPT CACHING REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The PROMPT CACHING REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the PROMPT CACHING REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "How the cache is organized". Output: open [How the cache is organized](references/chapter.md#how-the-cache-is-organized) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level PROMPT CACHING REFERENCE table of contents:

- [How Claude Code uses prompt caching](references/chapter.md#how-claude-code-uses-prompt-caching)
  - [How the cache is organized](references/chapter.md#how-the-cache-is-organized)
  - [Actions that invalidate the cache](references/chapter.md#actions-that-invalidate-the-cache)
  - [Actions that keep the cache](references/chapter.md#actions-that-keep-the-cache)
  - [Resuming a session](references/chapter.md#resuming-a-session)
  - [Cache lifetime](references/chapter.md#cache-lifetime)
  - [Cache scope](references/chapter.md#cache-scope)
  - [Check cache performance](references/chapter.md#check-cache-performance)
  - [Subagents and the cache](references/chapter.md#subagents-and-the-cache)
  - [Disable prompt caching](references/chapter.md#disable-prompt-caching)
  - [Related resources](references/chapter.md#related-resources)
