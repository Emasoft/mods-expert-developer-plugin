---
name: mods-doc-mods-basic-examples
description: "Use when working on mods basic examples. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# MODS BASIC EXAMPLES

## Overview

Routes reads about mods basic examples to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the MODS BASIC EXAMPLES chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs mods basic examples; otherwise stop without opening the chapter.
2. Pick the MODS BASIC EXAMPLES section from the Table of Contents under Resources and follow its link.
3. Read only that mods basic examples section; do not preload this or any other chapter.
4. Stop when the MODS BASIC EXAMPLES section is read: this wrapper routes reads only and authorizes no writes.

## Output

The MODS BASIC EXAMPLES section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the MODS BASIC EXAMPLES headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Try a sample". Output: open [Try a sample](references/chapter.md#try-a-sample) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level MODS BASIC EXAMPLES table of contents:

- [Interface examples for mods](references/chapter.md#interface-examples-for-mods)
  - [Try a sample](references/chapter.md#try-a-sample)
  - [Pick an element](references/chapter.md#pick-an-element)
  - [Show text](references/chapter.md#show-text)
  - [Show code and changes](references/chapter.md#show-code-and-changes)
  - [Arrange elements](references/chapter.md#arrange-elements)
  - [Take input](references/chapter.md#take-input)
  - [Draw pictures](references/chapter.md#draw-pictures)
  - [See where a mod can draw](references/chapter.md#see-where-a-mod-can-draw)
  - [Related Topics](references/chapter.md#related-topics)
