---
name: mods-doc-large-monorepo-plugin-development
description: "Use when working on how to use a large monorepo with claude (usually the case when developing plugins). Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# HOW TO USE A LARGE MONOREPO WITH CLAUDE (Usually the case when developing Plugins)

## Overview

Routes reads about how to use a large monorepo with claude (usually the case when developing plugins) to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the HOW TO USE A LARGE MONOREPO WITH CLAUDE (Usually the case when developing Plugins) chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs how to use a large monorepo with claude (usually the case when developing plugins); otherwise stop without opening the chapter.
2. Pick the HOW TO USE A LARGE MONOREPO WITH CLAUDE (Usually the case when developing Plugins) section from the Table of Contents under Resources and follow its link.
3. Read only that how to use a large monorepo with claude (usually the case when developing plugins) section; do not preload this or any other chapter.
4. Stop when the HOW TO USE A LARGE MONOREPO WITH CLAUDE (Usually the case when developing Plugins) section is read: this wrapper routes reads only and authorizes no writes.

## Output

The HOW TO USE A LARGE MONOREPO WITH CLAUDE (Usually the case when developing Plugins) section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the HOW TO USE A LARGE MONOREPO WITH CLAUDE (Usually the case when developing Plugins) headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "What this guide covers with its settings and example monorepo". Output: open [What this guide covers with its settings and example monorepo](references/chapter.md#what-this-guide-covers-with-its-settings-and-example-monorepo) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level HOW TO USE A LARGE MONOREPO WITH CLAUDE (Usually the case when developing Plugins) table of contents:

- [Set up Claude Code in a monorepo or large codebase](references/chapter.md#set-up-claude-code-in-a-monorepo-or-large-codebase)
  - [What this guide covers with its settings and example monorepo](references/chapter.md#what-this-guide-covers-with-its-settings-and-example-monorepo)
  - [Choose where to start Claude](references/chapter.md#choose-where-to-start-claude)
  - [Layer CLAUDE.md files by directory](references/chapter.md#layer-claudemd-files-by-directory)
  - [Reduce what Claude reads](references/chapter.md#reduce-what-claude-reads)
  - [Scope worktrees and file access](references/chapter.md#scope-worktrees-and-file-access)
  - [Add per-directory skills](references/chapter.md#add-per-directory-skills)
  - [Centralize conventions and recommend plugins at session start](references/chapter.md#centralize-conventions-and-recommend-plugins-at-session-start)
  - [Put it together](references/chapter.md#put-it-together)
  - [Scope and plan changes that span packages](references/chapter.md#scope-and-plan-changes-that-span-packages)
  - [Next steps](references/chapter.md#next-steps)
