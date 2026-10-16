---
name: mods-doc-mods-interfaces
description: "Use when working on mods interfaces. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# MODS INTERFACES

## Overview

Routes reads about mods interfaces to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

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

Full chapter: [the chapter](references/chapter.md), with the complete MODS INTERFACES table of contents:

- [Draw in the interface with a mod](references/chapter.md#draw-in-the-interface-with-a-mod)
  - [Build a pane with tabs](references/chapter.md#build-a-pane-with-tabs)
  - [Pick where to draw](references/chapter.md#pick-where-to-draw)
    - [Change what Claude Code already draws](references/chapter.md#change-what-claude-code-already-draws)
    - [Open a pane at the right time](references/chapter.md#open-a-pane-at-the-right-time)
      - [Hold toasts behind a dialog](references/chapter.md#hold-toasts-behind-a-dialog)
      - [When a pane waits for a wider terminal](references/chapter.md#when-a-pane-waits-for-a-wider-terminal)
  - [Build a tree from elements](references/chapter.md#build-a-tree-from-elements)
    - [Draw a grid of colored cells](references/chapter.md#draw-a-grid-of-colored-cells)
  - [Respond to presses and typing](references/chapter.md#respond-to-presses-and-typing)
    - [How a pane gets keyboard focus](references/chapter.md#how-a-pane-gets-keyboard-focus)
      - [What each key does](references/chapter.md#what-each-key-does)
      - [Set a hotkey and the first focus](references/chapter.md#set-a-hotkey-and-the-first-focus)
    - [Take typed input and draw a row for each item](references/chapter.md#take-typed-input-and-draw-a-row-for-each-item)
    - [When Claude Code redraws without being asked](references/chapter.md#when-claude-code-redraws-without-being-asked)
    - [Redraw when your data changes](references/chapter.md#redraw-when-your-data-changes)
    - [Redraw on a timer](references/chapter.md#redraw-on-a-timer)
    - [How often a site can redraw](references/chapter.md#how-often-a-site-can-redraw)
  - [Keep state](references/chapter.md#keep-state)
    - [Keep a value in `$.state`](references/chapter.md#keep-a-value-in-state)
      - [Declare the values](references/chapter.md#declare-the-values)
      - [Point the manifest at the declaration](references/chapter.md#point-the-manifest-at-the-declaration)
      - [Define, read, and write a value](references/chapter.md#define-read-and-write-a-value)
      - [Change `hello-tabs` to use `$.state`](references/chapter.md#change-hello-tabs-to-use-state)
    - [Save from more than one session](references/chapter.md#save-from-more-than-one-session)
  - [Related Topics](references/chapter.md#related-topics)
