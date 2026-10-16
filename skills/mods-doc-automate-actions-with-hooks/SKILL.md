---
name: mods-doc-automate-actions-with-hooks
description: "Use when working on automate actions with hooks. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# AUTOMATE ACTIONS WITH HOOKS

## Overview

Routes reads about automate actions with hooks to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the AUTOMATE ACTIONS WITH HOOKS chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs automate actions with hooks; otherwise stop without opening the chapter.
2. Pick the AUTOMATE ACTIONS WITH HOOKS section from the Table of Contents under Resources and follow its link.
3. Read only that automate actions with hooks section; do not preload this or any other chapter.
4. Stop when the AUTOMATE ACTIONS WITH HOOKS section is read: this wrapper routes reads only and authorizes no writes.

## Output

The AUTOMATE ACTIONS WITH HOOKS section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the AUTOMATE ACTIONS WITH HOOKS headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Set up your first hook". Output: open [Set up your first hook](references/chapter.md#set-up-your-first-hook) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level AUTOMATE ACTIONS WITH HOOKS table of contents:

- [Automate actions with hooks](references/chapter.md#automate-actions-with-hooks-1)
  - [Set up your first hook](references/chapter.md#set-up-your-first-hook)
  - [What you can automate](references/chapter.md#what-you-can-automate)
  - [How hooks work](references/chapter.md#how-hooks-work)
  - [Prompt-based hooks](references/chapter.md#prompt-based-hooks)
  - [Agent-based hooks](references/chapter.md#agent-based-hooks)
  - [HTTP hooks](references/chapter.md#http-hooks)
  - [Limitations and troubleshooting](references/chapter.md#limitations-and-troubleshooting)
  - [Learn more](references/chapter.md#learn-more)
