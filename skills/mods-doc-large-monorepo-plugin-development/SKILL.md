---
name: mods-doc-large-monorepo-plugin-development
description: "Use when working on how to use a large monorepo with claude (usually the case when developing plugins). Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# HOW TO USE A LARGE MONOREPO WITH CLAUDE (Usually the case when developing Plugins)

## Overview

Routes reads about how to use a large monorepo with claude (usually the case when developing plugins) to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

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

Input: a task about "What this guide covers". Output: open [What this guide covers](references/chapter.md#what-this-guide-covers) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete HOW TO USE A LARGE MONOREPO WITH CLAUDE (Usually the case when developing Plugins) table of contents:

- [Set up Claude Code in a monorepo or large codebase](references/chapter.md#set-up-claude-code-in-a-monorepo-or-large-codebase)
  - [What this guide covers](references/chapter.md#what-this-guide-covers)
    - [Settings on this page](references/chapter.md#settings-on-this-page)
    - [The example monorepo](references/chapter.md#the-example-monorepo)
  - [Choose where to start Claude](references/chapter.md#choose-where-to-start-claude)
  - [Layer CLAUDE.md files by directory](references/chapter.md#layer-claudemd-files-by-directory)
    - [Choose between per-directory CLAUDE.md and path-scoped rules](references/chapter.md#choose-between-per-directory-claudemd-and-path-scoped-rules)
    - [Exclude irrelevant CLAUDE.md files](references/chapter.md#exclude-irrelevant-claudemd-files)
  - [Reduce what Claude reads](references/chapter.md#reduce-what-claude-reads)
    - [Block reads of generated and vendored code](references/chapter.md#block-reads-of-generated-and-vendored-code)
    - [Reduce file reads with code intelligence](references/chapter.md#reduce-file-reads-with-code-intelligence)
  - [Scope worktrees and file access](references/chapter.md#scope-worktrees-and-file-access)
    - [Check out only the directories you need](references/chapter.md#check-out-only-the-directories-you-need)
    - [Grant access across packages or repositories](references/chapter.md#grant-access-across-packages-or-repositories)
  - [Add per-directory skills](references/chapter.md#add-per-directory-skills)
    - [Keep skills discoverable](references/chapter.md#keep-skills-discoverable)
  - [Centralize conventions when layering stops scaling](references/chapter.md#centralize-conventions-when-layering-stops-scaling)
    - [Recommend the right plugin at session start](references/chapter.md#recommend-the-right-plugin-at-session-start)
  - [Put it together](references/chapter.md#put-it-together)
  - [Scope and plan changes that span packages](references/chapter.md#scope-and-plan-changes-that-span-packages)
  - [Next steps](references/chapter.md#next-steps)
