---
name: mods-doc-skills-reference
description: "Use when working on skills reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# SKILLS REFERENCE

## Overview

Routes reads about skills reference to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the SKILLS REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs skills reference; otherwise stop without opening the chapter.
2. Pick the SKILLS REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that skills reference section; do not preload this or any other chapter.
4. Stop when the SKILLS REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The SKILLS REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the SKILLS REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Bundled skills". Output: open [Bundled skills](references/chapter.md#bundled-skills) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level SKILLS REFERENCE table of contents:

- [Extend Claude with skills](references/chapter.md#extend-claude-with-skills)
  - [Bundled skills](references/chapter.md#bundled-skills)
  - [Create and manage skills](references/chapter.md#create-and-manage-skills)
  - [Configure skills](references/chapter.md#configure-skills)
  - [Advanced skill behavior and visibility](references/chapter.md#advanced-skill-behavior-and-visibility)
  - [Evaluate and iterate on a skill](references/chapter.md#evaluate-and-iterate-on-a-skill)
  - [Share skills and generate visual output](references/chapter.md#share-skills-and-generate-visual-output)
  - [Troubleshooting](references/chapter.md#troubleshooting)
  - [Related resources](references/chapter.md#related-resources)
