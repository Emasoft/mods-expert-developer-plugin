---
name: mods-doc-cc-projects-directory-structure
description: "Use when working on claude projects directory structure. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# CLAUDE PROJECTS DIRECTORY STRUCTURE

## Overview

Routes reads about claude projects directory structure to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the CLAUDE PROJECTS DIRECTORY STRUCTURE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs claude projects directory structure; otherwise stop without opening the chapter.
2. Pick the CLAUDE PROJECTS DIRECTORY STRUCTURE section from the Table of Contents under Resources and follow its link.
3. Read only that claude projects directory structure section; do not preload this or any other chapter.
4. Stop when the CLAUDE PROJECTS DIRECTORY STRUCTURE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The CLAUDE PROJECTS DIRECTORY STRUCTURE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the CLAUDE PROJECTS DIRECTORY STRUCTURE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Choose the right file". Output: open [Choose the right file](references/chapter.md#choose-the-right-file) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level CLAUDE PROJECTS DIRECTORY STRUCTURE table of contents:

- [Explore the .claude directory](references/chapter.md#explore-the-claude-directory)
  - [Explore the directory](references/chapter.md#explore-the-directory)
  - [What's not shown](references/chapter.md#whats-not-shown)
  - [Choose the right file](references/chapter.md#choose-the-right-file)
  - [File reference](references/chapter.md#file-reference)
  - [Frontmatter fields by file](references/chapter.md#frontmatter-fields-by-file)
  - [Troubleshoot configuration](references/chapter.md#troubleshoot-configuration)
  - [Application data storage and cleanup](references/chapter.md#application-data-storage-and-cleanup)
  - [Related resources](references/chapter.md#related-resources)
