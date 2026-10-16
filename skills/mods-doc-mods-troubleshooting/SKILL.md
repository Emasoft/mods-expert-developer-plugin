---
name: mods-doc-mods-troubleshooting
description: "Use when working on mods troubleshooting. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# MODS TROUBLESHOOTING

## Overview

Routes reads about mods troubleshooting to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the MODS TROUBLESHOOTING chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs mods troubleshooting; otherwise stop without opening the chapter.
2. Pick the MODS TROUBLESHOOTING section from the Table of Contents under Resources and follow its link.
3. Read only that mods troubleshooting section; do not preload this or any other chapter.
4. Stop when the MODS TROUBLESHOOTING section is read: this wrapper routes reads only and authorizes no writes.

## Output

The MODS TROUBLESHOOTING section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the MODS TROUBLESHOOTING headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Find out why a mod does nothing". Output: open [Find out why a mod does nothing](references/chapter.md#find-out-why-a-mod-does-nothing) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level MODS TROUBLESHOOTING table of contents:

- [Troubleshoot a mod](references/chapter.md#troubleshoot-a-mod)
  - [Find out why a mod does nothing](references/chapter.md#find-out-why-a-mod-does-nothing)
  - [Check whether mods can load](references/chapter.md#check-whether-mods-can-load)
  - [The mod doesn't load](references/chapter.md#the-mod-doesnt-load)
  - [A hook is skipped or a mod is unloaded](references/chapter.md#a-hook-is-skipped-or-a-mod-is-unloaded)
  - [A tool call is denied](references/chapter.md#a-tool-call-is-denied)
  - [A drawing doesn't appear or respond](references/chapter.md#a-drawing-doesnt-appear-or-respond)
  - [An edit or a value is lost](references/chapter.md#an-edit-or-a-value-is-lost)
  - [Read the debug log](references/chapter.md#read-the-debug-log)
  - [Related Topics](references/chapter.md#related-topics)
