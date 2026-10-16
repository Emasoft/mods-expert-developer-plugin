---
name: mods-doc-mods-reference
description: "Use when working on mods reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# MODS REFERENCE

## Overview

Routes reads about mods reference to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the MODS REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs mods reference; otherwise stop without opening the chapter.
2. Pick the MODS REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that mods reference section; do not preload this or any other chapter.
4. Stop when the MODS REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The MODS REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the MODS REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "The hook function". Output: open [The hook function](references/chapter.md#the-hook-function) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level MODS REFERENCE table of contents:

- [Files](references/chapter.md#files)
- [The hook function](references/chapter.md#the-hook-function)
- [Events a mod can hook](references/chapter.md#events-a-mod-can-hook)
  - [Tool events and tool.check fields](references/chapter.md#tool-events-and-toolcheck-fields)
  - [Prompts and what Claude reads](references/chapter.md#prompts-and-what-claude-reads)
  - [Commands and configuration](references/chapter.md#commands-and-configuration)
  - [Turns](references/chapter.md#turns)
  - [Subagents](references/chapter.md#subagents)
  - [Interface](references/chapter.md#interface)
  - [Other mods](references/chapter.md#other-mods)
  - [Telemetry](references/chapter.md#telemetry)
  - [Settings hook events](references/chapter.md#settings-hook-events)
  - [Mods API calls](references/chapter.md#mods-api-calls)
- [Mods API methods](references/chapter.md#mods-api-methods)
- [Render sites](references/chapter.md#render-sites)
- [Elements](references/chapter.md#elements)
- [Limits](references/chapter.md#limits)
- [Settings and environment variables](references/chapter.md#settings-and-environment-variables)
- [Commands](references/chapter.md#commands)
