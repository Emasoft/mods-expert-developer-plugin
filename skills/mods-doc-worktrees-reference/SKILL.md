---
name: mods-doc-worktrees-reference
description: "Use when working on worktrees reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# WORKTREES REFERENCE

## Overview

Routes reads about worktrees reference to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the WORKTREES REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs worktrees reference; otherwise stop without opening the chapter.
2. Pick the WORKTREES REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that worktrees reference section; do not preload this or any other chapter.
4. Stop when the WORKTREES REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The WORKTREES REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the WORKTREES REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Start Claude in a worktree and set up its environment". Output: open [Start Claude in a worktree and set up its environment](references/chapter.md#start-claude-in-a-worktree-and-set-up-its-environment) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level WORKTREES REFERENCE table of contents:

- [Run parallel sessions with worktrees](references/chapter.md#run-parallel-sessions-with-worktrees)
  - [Start Claude in a worktree and set up its environment](references/chapter.md#start-claude-in-a-worktree-and-set-up-its-environment)
  - [Clean up worktrees](references/chapter.md#clean-up-worktrees)
  - [Resume a worktree session](references/chapter.md#resume-a-worktree-session)
  - [How Claude Code enforces isolation](references/chapter.md#how-claude-code-enforces-isolation)
  - [Isolate subagents with worktrees and clean up their leftovers](references/chapter.md#isolate-subagents-with-worktrees-and-clean-up-their-leftovers)
  - [Customize worktree base branch PR source copied files and hooks](references/chapter.md#customize-worktree-base-branch-pr-source-copied-files-and-hooks)
  - [What worktrees share with the main checkout](references/chapter.md#what-worktrees-share-with-the-main-checkout)
  - [Manage worktrees manually](references/chapter.md#manage-worktrees-manually)
  - [Non-git version control](references/chapter.md#non-git-version-control)
  - [Troubleshoot worktree startup symlink refusal and resume problems](references/chapter.md#troubleshoot-worktree-startup-symlink-refusal-and-resume-problems)
  - [See also](references/chapter.md#see-also)
