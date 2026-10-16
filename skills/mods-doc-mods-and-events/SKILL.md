---
name: mods-doc-mods-and-events
description: "Use when working on mods and events. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# MODS AND EVENTS

## Overview

Routes reads about mods and events to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the MODS AND EVENTS chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs mods and events; otherwise stop without opening the chapter.
2. Pick the MODS AND EVENTS section from the Table of Contents under Resources and follow its link.
3. Read only that mods and events section; do not preload this or any other chapter.
4. Stop when the MODS AND EVENTS section is read: this wrapper routes reads only and authorizes no writes.

## Output

The MODS AND EVENTS section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the MODS AND EVENTS headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "How a hook handles and filters an event". Output: open [How a hook handles and filters an event](references/chapter.md#how-a-hook-handles-and-filters-an-event) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level MODS AND EVENTS table of contents:

- [React to events with a mod](references/chapter.md#react-to-events-with-a-mod)
  - [How a hook handles and filters an event](references/chapter.md#how-a-hook-handles-and-filters-an-event)
  - [Hook tool calls prompts and turns](references/chapter.md#hook-tool-calls-prompts-and-turns)
  - [Mod ordering and failure handling alongside other mods](references/chapter.md#mod-ordering-and-failure-handling-alongside-other-mods)
  - [Related Topics](references/chapter.md#related-topics)
