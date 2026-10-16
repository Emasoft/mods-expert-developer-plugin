---
name: mods-doc-loop-and-chron-reference
description: "Use when working on loop and chron reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# LOOP AND CHRON REFERENCE

## Overview

Routes reads about loop and chron reference to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the LOOP AND CHRON REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs loop and chron reference; otherwise stop without opening the chapter.
2. Pick the LOOP AND CHRON REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that loop and chron reference section; do not preload this or any other chapter.
4. Stop when the LOOP AND CHRON REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The LOOP AND CHRON REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the LOOP AND CHRON REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Compare scheduling options". Output: open [Compare scheduling options](references/chapter.md#compare-scheduling-options) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level LOOP AND CHRON REFERENCE table of contents:

- [Run prompts on a schedule](references/chapter.md#run-prompts-on-a-schedule)
  - [Compare scheduling options](references/chapter.md#compare-scheduling-options)
  - [Run a prompt repeatedly with /loop](references/chapter.md#run-a-prompt-repeatedly-with-loop)
  - [Set a one-time reminder](references/chapter.md#set-a-one-time-reminder)
  - [Manage scheduled tasks](references/chapter.md#manage-scheduled-tasks)
  - [How scheduled tasks run](references/chapter.md#how-scheduled-tasks-run)
  - [Cron expression reference](references/chapter.md#cron-expression-reference)
  - [Disable scheduled tasks](references/chapter.md#disable-scheduled-tasks)
  - [Limitations](references/chapter.md#limitations)
