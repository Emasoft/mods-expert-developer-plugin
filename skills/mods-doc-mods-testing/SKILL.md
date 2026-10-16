---
name: mods-doc-mods-testing
description: "Use when working on mods testing. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# MODS TESTING

## Overview

Routes reads about mods testing to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the MODS TESTING chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs mods testing; otherwise stop without opening the chapter.
2. Pick the MODS TESTING section from the Table of Contents under Resources and follow its link.
3. Read only that mods testing section; do not preload this or any other chapter.
4. Stop when the MODS TESTING section is read: this wrapper routes reads only and authorizes no writes.

## Output

The MODS TESTING section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the MODS TESTING headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Write a test with stubs and test kit rules". Output: open [Write a test with stubs and test kit rules](references/chapter.md#write-a-test-with-stubs-and-test-kit-rules) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level MODS TESTING table of contents:

- [Test a mod](references/chapter.md#test-a-mod)
  - [Write a test with stubs and test kit rules](references/chapter.md#write-a-test-with-stubs-and-test-kit-rules)
  - [Test a timer](references/chapter.md#test-a-timer)
  - [Test a drawing](references/chapter.md#test-a-drawing)
  - [Related Topics](references/chapter.md#related-topics)
