---
name: mods-doc-headless-mode-reference
description: "Use when working on headless mode reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# HEADLESS MODE REFERENCE

## Overview

Routes reads about headless mode reference to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the HEADLESS MODE REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs headless mode reference; otherwise stop without opening the chapter.
2. Pick the HEADLESS MODE REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that headless mode reference section; do not preload this or any other chapter.
4. Stop when the HEADLESS MODE REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The HEADLESS MODE REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the HEADLESS MODE REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Basic usage and startup options". Output: open [Basic usage and startup options](references/chapter.md#basic-usage-and-startup-options) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level HEADLESS MODE REFERENCE table of contents:

- [Run Claude Code programmatically](references/chapter.md#run-claude-code-programmatically)
  - [Basic usage and startup options](references/chapter.md#basic-usage-and-startup-options)
  - [Headless usage examples](references/chapter.md#headless-usage-examples)
  - [Next steps](references/chapter.md#next-steps)
