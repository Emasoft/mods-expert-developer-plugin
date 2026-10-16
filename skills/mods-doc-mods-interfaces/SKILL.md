---
name: mods-doc-mods-interfaces
description: "Use when working on mods interfaces. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# MODS INTERFACES

## Overview

Routes reads about mods interfaces to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the MODS INTERFACES chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs mods interfaces; otherwise stop without opening the chapter.
2. Pick the MODS INTERFACES section from the Table of Contents under Resources and follow its link.
3. Read only that mods interfaces section; do not preload this or any other chapter.
4. Stop when the MODS INTERFACES section is read: this wrapper routes reads only and authorizes no writes.

## Output

The MODS INTERFACES section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the MODS INTERFACES headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Build a pane with tabs". Output: open [Build a pane with tabs](references/chapter.md#build-a-pane-with-tabs) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level MODS INTERFACES table of contents:

- [Draw in the interface with a mod](references/chapter.md#draw-in-the-interface-with-a-mod)
  - [Build a pane with tabs](references/chapter.md#build-a-pane-with-tabs)
  - [Pick where to draw](references/chapter.md#pick-where-to-draw)
  - [Build a tree from elements](references/chapter.md#build-a-tree-from-elements)
  - [Respond to presses and typing](references/chapter.md#respond-to-presses-and-typing)
  - [Keep state](references/chapter.md#keep-state)
  - [Related Topics](references/chapter.md#related-topics)
