---
name: mods-doc-output-style-reference
description: "Use when working on output style reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# OUTPUT STYLE REFERENCE

## Overview

Routes reads about output style reference to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the OUTPUT STYLE REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs output style reference; otherwise stop without opening the chapter.
2. Pick the OUTPUT STYLE REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that output style reference section; do not preload this or any other chapter.
4. Stop when the OUTPUT STYLE REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The OUTPUT STYLE REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the OUTPUT STYLE REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Built-in output styles". Output: open [Built-in output styles](references/chapter.md#built-in-output-styles) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level OUTPUT STYLE REFERENCE table of contents:

- [Output styles](references/chapter.md#output-styles)
  - [Built-in output styles](references/chapter.md#built-in-output-styles)
  - [Change your output style](references/chapter.md#change-your-output-style)
  - [Create a custom output style](references/chapter.md#create-a-custom-output-style)
  - [Choose between an output style and other features](references/chapter.md#choose-between-an-output-style-and-other-features)
  - [How output styles work](references/chapter.md#how-output-styles-work)
  - [Related resources](references/chapter.md#related-resources)
