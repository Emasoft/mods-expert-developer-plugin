---
name: mods-doc-subagents-reference
description: "Use when working on subagents reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# SUBAGENTS REFERENCE

## Overview

Routes reads about subagents reference to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the SUBAGENTS REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs subagents reference; otherwise stop without opening the chapter.
2. Pick the SUBAGENTS REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that subagents reference section; do not preload this or any other chapter.
4. Stop when the SUBAGENTS REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The SUBAGENTS REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the SUBAGENTS REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Built-in subagents". Output: open [Built-in subagents](references/chapter.md#built-in-subagents) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level SUBAGENTS REFERENCE table of contents:

- [Create custom subagents](references/chapter.md#create-custom-subagents)
  - [Built-in subagents](references/chapter.md#built-in-subagents)
  - [Quickstart: create your first subagent](references/chapter.md#quickstart-create-your-first-subagent)
  - [Configure subagents](references/chapter.md#configure-subagents)
  - [Work with subagents](references/chapter.md#work-with-subagents)
  - [Fork the current conversation](references/chapter.md#fork-the-current-conversation)
  - [Example subagents](references/chapter.md#example-subagents)
  - [Related Docs:](references/chapter.md#related-docs)
