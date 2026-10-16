---
name: mods-doc-plugin-recomendations
description: "Use when working on plugin recomendations. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# PLUGIN RECOMENDATIONS

## Overview

Routes reads about plugin recomendations to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the PLUGIN RECOMENDATIONS chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs plugin recomendations; otherwise stop without opening the chapter.
2. Pick the PLUGIN RECOMENDATIONS section from the Table of Contents under Resources and follow its link.
3. Read only that plugin recomendations section; do not preload this or any other chapter.
4. Stop when the PLUGIN RECOMENDATIONS section is read: this wrapper routes reads only and authorizes no writes.

## Output

The PLUGIN RECOMENDATIONS section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the PLUGIN RECOMENDATIONS headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Understand how plugin relevance works". Output: open [Understand how plugin relevance works](references/chapter.md#understand-how-plugin-relevance-works) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level PLUGIN RECOMENDATIONS table of contents:

- [Recommend plugins for your org](references/chapter.md#recommend-plugins-for-your-org)
  - [Understand how plugin relevance works](references/chapter.md#understand-how-plugin-relevance-works)
  - [Add relevance to a plugin entry](references/chapter.md#add-relevance-to-a-plugin-entry)
  - [Field reference](references/chapter.md#field-reference)
  - [Validate your marketplace](references/chapter.md#validate-your-marketplace)
  - [Enable suggestions in managed settings](references/chapter.md#enable-suggestions-in-managed-settings)
  - [Preview what the user sees](references/chapter.md#preview-what-the-user-sees)
  - [See also](references/chapter.md#see-also)
