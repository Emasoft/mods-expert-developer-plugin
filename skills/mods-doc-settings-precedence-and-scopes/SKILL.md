---
name: mods-doc-settings-precedence-and-scopes
description: "Use when working on settings precedence and scopes. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# SETTINGS PRECEDENCE AND SCOPES

## Overview

Routes reads about settings precedence and scopes to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the SETTINGS PRECEDENCE AND SCOPES chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs settings precedence and scopes; otherwise stop without opening the chapter.
2. Pick the SETTINGS PRECEDENCE AND SCOPES section from the Table of Contents under Resources and follow its link.
3. Read only that settings precedence and scopes section; do not preload this or any other chapter.
4. Stop when the SETTINGS PRECEDENCE AND SCOPES section is read: this wrapper routes reads only and authorizes no writes.

## Output

The SETTINGS PRECEDENCE AND SCOPES section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the SETTINGS PRECEDENCE AND SCOPES headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Settings files and who they affect". Output: open [Settings files and who they affect](references/chapter.md#settings-files-and-who-they-affect) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level SETTINGS PRECEDENCE AND SCOPES table of contents:

- [Settings files and precedence](references/chapter.md#settings-files-and-precedence)
  - [Settings files and who they affect](references/chapter.md#settings-files-and-who-they-affect)
  - [Change a setting](references/chapter.md#change-a-setting)
  - [Settings precedence](references/chapter.md#settings-precedence)
  - [Settings in cloud sessions](references/chapter.md#settings-in-cloud-sessions)
  - [What's next](references/chapter.md#whats-next)
