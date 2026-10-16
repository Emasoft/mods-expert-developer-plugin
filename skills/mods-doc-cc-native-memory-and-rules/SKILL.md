---
name: mods-doc-cc-native-memory-and-rules
description: "Use when working on claude code native memory and rules. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# CLAUDE CODE NATIVE MEMORY AND RULES

## Overview

Routes reads about claude code native memory and rules to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the CLAUDE CODE NATIVE MEMORY AND RULES chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs claude code native memory and rules; otherwise stop without opening the chapter.
2. Pick the CLAUDE CODE NATIVE MEMORY AND RULES section from the Table of Contents under Resources and follow its link.
3. Read only that claude code native memory and rules section; do not preload this or any other chapter.
4. Stop when the CLAUDE CODE NATIVE MEMORY AND RULES section is read: this wrapper routes reads only and authorizes no writes.

## Output

The CLAUDE CODE NATIVE MEMORY AND RULES section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the CLAUDE CODE NATIVE MEMORY AND RULES headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "CLAUDE.md vs auto memory". Output: open [CLAUDE.md vs auto memory](references/chapter.md#claudemd-vs-auto-memory) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level CLAUDE CODE NATIVE MEMORY AND RULES table of contents:

- [How Claude remembers your project](references/chapter.md#how-claude-remembers-your-project)
  - [CLAUDE.md vs auto memory](references/chapter.md#claudemd-vs-auto-memory)
  - [CLAUDE.md files and rules](references/chapter.md#claudemd-files-and-rules)
  - [Use AGENTS.md alongside CLAUDE.md](references/chapter.md#use-agentsmd-alongside-claudemd)
  - [Auto memory behavior and storage](references/chapter.md#auto-memory-behavior-and-storage)
  - [View and edit with `/memory`](references/chapter.md#view-and-edit-with-memory)
  - [Troubleshoot memory issues](references/chapter.md#troubleshoot-memory-issues)
  - [Related resources](references/chapter.md#related-resources)
