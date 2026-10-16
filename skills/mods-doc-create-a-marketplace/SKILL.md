---
name: mods-doc-create-a-marketplace
description: "Use when working on create a marketplace. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# Create a marketplace

## Overview

Routes reads about create a marketplace to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the Create a marketplace chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs create a marketplace; otherwise stop without opening the chapter.
2. Pick the Create a marketplace section from the Table of Contents under Resources and follow its link.
3. Read only that create a marketplace section; do not preload this or any other chapter.
4. Stop when the Create a marketplace section is read: this wrapper routes reads only and authorizes no writes.

## Output

The Create a marketplace section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the Create a marketplace headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Add plugin entries". Output: open [Add plugin entries](references/chapter.md#add-plugin-entries) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level Create a marketplace table of contents:

- [Create a marketplace](references/chapter.md#create-a-marketplace-1)
- [Add plugin entries](references/chapter.md#add-plugin-entries)
- [Rules for plugin entries](references/chapter.md#rules-for-plugin-entries)
  - [Write relative paths from the marketplace root](references/chapter.md#write-relative-paths-from-the-marketplace-root)
  - [Keep the entry name and the manifest name the same](references/chapter.md#keep-the-entry-name-and-the-manifest-name-the-same)
- [Choose a plugin source](references/chapter.md#choose-a-plugin-source)
- [Validate and test](references/chapter.md#validate-and-test)
  - [Problems that validation reports](references/chapter.md#problems-that-validation-reports)
  - [Problems that surface when you add or install](references/chapter.md#problems-that-surface-when-you-add-or-install)
  - [Test an edit to a plugin](references/chapter.md#test-an-edit-to-a-plugin)
  - [Remove the marketplace to start over](references/chapter.md#remove-the-marketplace-to-start-over)
- [Host your marketplace](references/chapter.md#host-your-marketplace)
- [Related Docs](references/chapter.md#related-docs)
