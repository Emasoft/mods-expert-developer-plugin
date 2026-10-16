---
name: mods-doc-marketplace-manifest-reference
description: "Use when working on marketplace manifest reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# MARKETPLACE MANIFEST REFERENCE

## Overview

Routes reads about marketplace manifest reference to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the MARKETPLACE MANIFEST REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs marketplace manifest reference; otherwise stop without opening the chapter.
2. Pick the MARKETPLACE MANIFEST REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that marketplace manifest reference section; do not preload this or any other chapter.
4. Stop when the MARKETPLACE MANIFEST REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The MARKETPLACE MANIFEST REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the MARKETPLACE MANIFEST REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Marketplace file". Output: open [Marketplace file](references/chapter.md#marketplace-file) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level MARKETPLACE MANIFEST REFERENCE table of contents:

- [Marketplace reference](references/chapter.md#marketplace-reference)
  - [Marketplace file](references/chapter.md#marketplace-file)
  - [Top-level fields](references/chapter.md#top-level-fields)
  - [Plugin entries](references/chapter.md#plugin-entries)
  - [Plugin sources](references/chapter.md#plugin-sources)
  - [Marketplace sources](references/chapter.md#marketplace-sources)
  - [Validation messages](references/chapter.md#validation-messages)
  - [See Also:](references/chapter.md#see-also)
