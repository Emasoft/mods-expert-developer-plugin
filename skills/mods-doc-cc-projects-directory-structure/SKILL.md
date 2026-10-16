---
name: mods-doc-cc-projects-directory-structure
description: "Use when working on claude projects directory structure. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# CLAUDE PROJECTS DIRECTORY STRUCTURE

## Overview

Routes reads about claude projects directory structure to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

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

Input: a task about "Commands". Output: open [Commands](references/chapter.md#commands) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete CLAUDE PROJECTS DIRECTORY STRUCTURE table of contents:

    - [Explore the .claude directory](references/chapter.md#explore-the-claude-directory)
  - [Commands](references/chapter.md#commands)
  - [Stack](references/chapter.md#stack)
  - [Rules](references/chapter.md#rules)
- [API credentials](references/chapter.md#api-credentials)
- [Testing Rules](references/chapter.md#testing-rules)
- [API Design Rules](references/chapter.md#api-design-rules)
  - [Diff to review](references/chapter.md#diff-to-review)
  - [Input Validation](references/chapter.md#input-validation)
  - [Authentication](references/chapter.md#authentication)
  - [Patterns seen](references/chapter.md#patterns-seen)
  - [Recurring issues](references/chapter.md#recurring-issues)
  - [Project](references/chapter.md#project)
  - [Reference](references/chapter.md#reference)
  - [Auth Token Issues](references/chapter.md#auth-token-issues)
  - [Database Connection Drops](references/chapter.md#database-connection-drops)
      - [Explore the directory](references/chapter.md#explore-the-directory)
      - [What's not shown](references/chapter.md#whats-not-shown)
      - [Choose the right file](references/chapter.md#choose-the-right-file)
      - [File reference](references/chapter.md#file-reference)
      - [Frontmatter fields by file](references/chapter.md#frontmatter-fields-by-file)
      - [Troubleshoot configuration](references/chapter.md#troubleshoot-configuration)
      - [Application data](references/chapter.md#application-data)
        - [Cleaned up automatically](references/chapter.md#cleaned-up-automatically)
        - [Session scratchpad directory](references/chapter.md#session-scratchpad-directory)
        - [Kept until you delete them](references/chapter.md#kept-until-you-delete-them)
        - [Plaintext storage](references/chapter.md#plaintext-storage)
        - [Clear local data](references/chapter.md#clear-local-data)
      - [Related resources](references/chapter.md#related-resources)
