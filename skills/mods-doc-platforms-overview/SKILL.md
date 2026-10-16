---
name: mods-doc-platforms-overview
description: "Use when working on platforms overview. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# PLATFORMS OVERVIEW

## Overview

Routes reads about platforms overview to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the PLATFORMS OVERVIEW chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs platforms overview; otherwise stop without opening the chapter.
2. Pick the PLATFORMS OVERVIEW section from the Table of Contents under Resources and follow its link.
3. Read only that platforms overview section; do not preload this or any other chapter.
4. Stop when the PLATFORMS OVERVIEW section is read: this wrapper routes reads only and authorizes no writes.

## Output

The PLATFORMS OVERVIEW section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the PLATFORMS OVERVIEW headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Where to run Claude Code". Output: open [Where to run Claude Code](references/chapter.md#where-to-run-claude-code) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level PLATFORMS OVERVIEW table of contents:

- [Platforms and integrations](references/chapter.md#platforms-and-integrations)
  - [Where to run Claude Code](references/chapter.md#where-to-run-claude-code)
  - [Connect your tools](references/chapter.md#connect-your-tools)
  - [Work when you are away from your terminal](references/chapter.md#work-when-you-are-away-from-your-terminal)
  - [Related resources](references/chapter.md#related-resources)
