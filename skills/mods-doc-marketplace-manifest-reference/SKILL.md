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

Input: a task about "Marketplace file layout and reserved names". Output: open [Marketplace file layout and reserved names](references/chapter.md#marketplace-file-layout-and-reserved-names) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level MARKETPLACE MANIFEST REFERENCE table of contents:

- [Marketplace reference](references/chapter.md#marketplace-reference)
  - [Marketplace file layout and reserved names](references/chapter.md#marketplace-file-layout-and-reserved-names)
  - [Top-level fields](references/chapter.md#top-level-fields)
  - [Plugin entries with display fields and strict mode](references/chapter.md#plugin-entries-with-display-fields-and-strict-mode)
  - [Plugin source types and install behavior](references/chapter.md#plugin-source-types-and-install-behavior)
  - [Marketplace source types and settings usage](references/chapter.md#marketplace-source-types-and-settings-usage)
  - [Validation messages and unvalidated failures](references/chapter.md#validation-messages-and-unvalidated-failures)
  - [See Also:](references/chapter.md#see-also)
