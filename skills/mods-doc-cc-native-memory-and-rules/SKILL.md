---
name: mods-doc-cc-native-memory-and-rules
description: "Use when working on claude code native memory and rules. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# CLAUDE CODE NATIVE MEMORY AND RULES

## Overview

Routes reads about claude code native memory and rules to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the CLAUDE CODE NATIVE MEMORY AND RULES chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs claude code native memory and rules; otherwise stop without opening the chapter.
2. Pick the CLAUDE CODE NATIVE MEMORY AND RULES section from the Table of Contents under Resources and follow its link.
3. Read only that claude code native memory and rules section; do not preload this or any other chapter.
4. Stop when the CLAUDE CODE NATIVE MEMORY AND RULES section is read: this wrapper routes reads only and authorizes no writes.

## Output

The CLAUDE CODE NATIVE MEMORY AND RULES section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the CLAUDE CODE NATIVE MEMORY AND RULES headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "CLAUDE.md vs auto memory". Output: open [CLAUDE.md vs auto memory](references/chapter.md#claudemd-vs-auto-memory) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete CLAUDE CODE NATIVE MEMORY AND RULES table of contents:

- [How Claude remembers your project](references/chapter.md#how-claude-remembers-your-project)
  - [CLAUDE.md vs auto memory](references/chapter.md#claudemd-vs-auto-memory)
  - [CLAUDE.md files](references/chapter.md#claudemd-files)
    - [When to add to CLAUDE.md](references/chapter.md#when-to-add-to-claudemd)
    - [Choose where to put CLAUDE.md files](references/chapter.md#choose-where-to-put-claudemd-files)
    - [Set up a project CLAUDE.md](references/chapter.md#set-up-a-project-claudemd)
    - [Write effective instructions](references/chapter.md#write-effective-instructions)
      - [Audit your instruction files](references/chapter.md#audit-your-instruction-files)
    - [Import additional files](references/chapter.md#import-additional-files)
    - [How CLAUDE.md files load](references/chapter.md#how-claudemd-files-load)
      - [Load from additional directories](references/chapter.md#load-from-additional-directories)
    - [Organize rules with `.claude/rules/`](references/chapter.md#organize-rules-with-clauderules)
      - [Set up rules](references/chapter.md#set-up-rules)
      - [Path-specific rules](references/chapter.md#path-specific-rules)
      - [Share rules across projects with symlinks](references/chapter.md#share-rules-across-projects-with-symlinks)
      - [User-level rules](references/chapter.md#user-level-rules)
    - [Manage CLAUDE.md for large teams](references/chapter.md#manage-claudemd-for-large-teams)
      - [Deploy organization-wide CLAUDE.md](references/chapter.md#deploy-organization-wide-claudemd)
      - [Exclude specific CLAUDE.md files](references/chapter.md#exclude-specific-claudemd-files)
  - [AGENTS.md](references/chapter.md#agentsmd)
    - [When Claude Code reads AGENTS.md](references/chapter.md#when-claude-code-reads-agentsmd)
    - [Choose which instruction files load](references/chapter.md#choose-which-instruction-files-load)
    - [When AGENTS.md support is unavailable](references/chapter.md#when-agentsmd-support-is-unavailable)
    - [Where AGENTS.md differs from CLAUDE.md](references/chapter.md#where-agentsmd-differs-from-claudemd)
    - [Remove an earlier AGENTS.md workaround](references/chapter.md#remove-an-earlier-agentsmd-workaround)
    - [Share one file with other coding tools](references/chapter.md#share-one-file-with-other-coding-tools)
    - [Migrate instructions from other tools](references/chapter.md#migrate-instructions-from-other-tools)
  - [Auto memory](references/chapter.md#auto-memory)
    - [Enable or disable auto memory](references/chapter.md#enable-or-disable-auto-memory)
    - [Storage location](references/chapter.md#storage-location)
    - [How it works](references/chapter.md#how-it-works)
    - [Audit and edit your memory](references/chapter.md#audit-and-edit-your-memory)
  - [View and edit with `/memory`](references/chapter.md#view-and-edit-with-memory)
  - [Troubleshoot memory issues](references/chapter.md#troubleshoot-memory-issues)
    - [Claude isn't following my CLAUDE.md](references/chapter.md#claude-isnt-following-my-claudemd)
    - [My AGENTS.md isn't loading](references/chapter.md#my-agentsmd-isnt-loading)
    - [I don't know what auto memory saved](references/chapter.md#i-dont-know-what-auto-memory-saved)
    - [My CLAUDE.md is too large](references/chapter.md#my-claudemd-is-too-large)
    - [Instructions seem lost after `/compact`](references/chapter.md#instructions-seem-lost-after-compact)
  - [Related resources](references/chapter.md#related-resources)
