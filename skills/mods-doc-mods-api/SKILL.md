---
name: mods-doc-mods-api
description: "Use when working on mods api. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# MODS API

## Overview

Routes reads about mods api to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the MODS API chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs mods api; otherwise stop without opening the chapter.
2. Pick the MODS API section from the Table of Contents under Resources and follow its link.
3. Read only that mods api section; do not preload this or any other chapter.
4. Stop when the MODS API section is read: this wrapper routes reads only and authorizes no writes.

## Output

The MODS API section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the MODS API headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Add a command or a tool". Output: open [Add a command or a tool](references/chapter.md#add-a-command-or-a-tool) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level MODS API table of contents:

- [Use the mods API](references/chapter.md#use-the-mods-api)
  - [Add a command or a tool](references/chapter.md#add-a-command-or-a-tool)
  - [Call a model with prompts and caching](references/chapter.md#call-a-model-with-prompts-and-caching)
  - [Run and control background work](references/chapter.md#run-and-control-background-work)
  - [Send and receive messages between sessions](references/chapter.md#send-and-receive-messages-between-sessions)
  - [Reach files, processes, and the network](references/chapter.md#reach-files-processes-and-the-network)
  - [Related Topics](references/chapter.md#related-topics)
