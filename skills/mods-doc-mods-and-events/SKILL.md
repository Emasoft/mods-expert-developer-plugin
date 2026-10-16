---
name: mods-doc-mods-and-events
description: "Use when working on mods and events. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# MODS AND EVENTS

## Overview

Routes reads about mods and events to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

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

Input: a task about "How a hook handles an event". Output: open [How a hook handles an event](references/chapter.md#how-a-hook-handles-an-event) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete MODS AND EVENTS table of contents:

- [React to events with a mod](references/chapter.md#react-to-events-with-a-mod)
  - [How a hook handles an event](references/chapter.md#how-a-hook-handles-an-event)
    - [Observe an event](references/chapter.md#observe-an-event)
    - [Rewrite an event](references/chapter.md#rewrite-an-event)
    - [Answer an event](references/chapter.md#answer-an-event)
    - [Filter which events a hook handles](references/chapter.md#filter-which-events-a-hook-handles)
  - [Hook what Claude is doing](references/chapter.md#hook-what-claude-is-doing)
    - [Guard or change a tool call](references/chapter.md#guard-or-change-a-tool-call)
      - [Hold a tool call until the user decides](references/chapter.md#hold-a-tool-call-until-the-user-decides)
      - [Approve or refuse a tool call before the user is asked](references/chapter.md#approve-or-refuse-a-tool-call-before-the-user-is-asked)
    - [Rewrite or add to a prompt](references/chapter.md#rewrite-or-add-to-a-prompt)
    - [Follow a turn](references/chapter.md#follow-a-turn)
  - [Run alongside other mods](references/chapter.md#run-alongside-other-mods)
    - [The order mods run in](references/chapter.md#the-order-mods-run-in)
      - [Where settings hooks run in the order](references/chapter.md#where-settings-hooks-run-in-the-order)
    - [Handle a hook that fails](references/chapter.md#handle-a-hook-that-fails)
  - [Related Topics](references/chapter.md#related-topics)
