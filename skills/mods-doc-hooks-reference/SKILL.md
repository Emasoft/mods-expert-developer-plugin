---
name: mods-doc-hooks-reference
description: "Use when working on hooks reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# HOOKS REFERENCE

## Overview

Routes reads about hooks reference to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the HOOKS REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs hooks reference; otherwise stop without opening the chapter.
2. Pick the HOOKS REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that hooks reference section; do not preload this or any other chapter.
4. Stop when the HOOKS REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The HOOKS REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the HOOKS REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Hook lifecycle". Output: open [Hook lifecycle](references/chapter.md#hook-lifecycle) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level HOOKS REFERENCE table of contents:

- [Hooks reference](references/chapter.md#hooks-reference-1)
  - [Hook lifecycle](references/chapter.md#hook-lifecycle)
  - [Hook configuration and management](references/chapter.md#hook-configuration-and-management)
  - [Hook input and output](references/chapter.md#hook-input-and-output)
  - [Hook events and decision control](references/chapter.md#hook-events-and-decision-control)
  - [Prompt-based hooks](references/chapter.md#prompt-based-hooks)
  - [Agent-based hooks](references/chapter.md#agent-based-hooks)
  - [Run hooks in the background](references/chapter.md#run-hooks-in-the-background)
  - [Security considerations](references/chapter.md#security-considerations)
  - [Windows PowerShell tool](references/chapter.md#windows-powershell-tool)
  - [Debug hooks](references/chapter.md#debug-hooks)
