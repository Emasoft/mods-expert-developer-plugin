---
name: mods-doc-dynamic-workflows-reference
description: "Use when working on dynamic workflows reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# DYNAMIC WORKFLOWS REFERENCE

## Overview

Routes reads about dynamic workflows reference to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the DYNAMIC WORKFLOWS REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs dynamic workflows reference; otherwise stop without opening the chapter.
2. Pick the DYNAMIC WORKFLOWS REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that dynamic workflows reference section; do not preload this or any other chapter.
4. Stop when the DYNAMIC WORKFLOWS REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The DYNAMIC WORKFLOWS REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the DYNAMIC WORKFLOWS REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "When to use a workflow". Output: open [When to use a workflow](references/chapter.md#when-to-use-a-workflow) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level DYNAMIC WORKFLOWS REFERENCE table of contents:

- [Orchestrate subagents at scale with dynamic workflows](references/chapter.md#orchestrate-subagents-at-scale-with-dynamic-workflows)
  - [When to use a workflow](references/chapter.md#when-to-use-a-workflow)
  - [Run a bundled workflow](references/chapter.md#run-a-bundled-workflow)
  - [Have Claude write a workflow](references/chapter.md#have-claude-write-a-workflow)
  - [Example workflow prompts](references/chapter.md#example-workflow-prompts)
  - [How a workflow runs](references/chapter.md#how-a-workflow-runs)
  - [Manage runs](references/chapter.md#manage-runs)
  - [Related resources](references/chapter.md#related-resources)
