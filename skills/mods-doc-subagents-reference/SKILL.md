---
name: mods-doc-subagents-reference
description: "Use when working on subagents reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# SUBAGENTS REFERENCE

## Overview

Routes reads about subagents reference to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the SUBAGENTS REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs subagents reference; otherwise stop without opening the chapter.
2. Pick the SUBAGENTS REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that subagents reference section; do not preload this or any other chapter.
4. Stop when the SUBAGENTS REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The SUBAGENTS REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the SUBAGENTS REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Built-in subagents". Output: open [Built-in subagents](references/chapter.md#built-in-subagents) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete SUBAGENTS REFERENCE table of contents:

- [Create custom subagents](references/chapter.md#create-custom-subagents)
  - [Built-in subagents](references/chapter.md#built-in-subagents)
  - [Quickstart: create your first subagent](references/chapter.md#quickstart-create-your-first-subagent)
  - [Configure subagents](references/chapter.md#configure-subagents)
    - [Choose the subagent scope](references/chapter.md#choose-the-subagent-scope)
    - [Write subagent files](references/chapter.md#write-subagent-files)
      - [Subagent files Claude Code skips](references/chapter.md#subagent-files-claude-code-skips)
      - [Check an `agents` directory before a session](references/chapter.md#check-an-agents-directory-before-a-session)
    - [Choose a model](references/chapter.md#choose-a-model)
      - [Run every subagent on one model](references/chapter.md#run-every-subagent-on-one-model)
    - [Choose an effort level](references/chapter.md#choose-an-effort-level)
    - [Control subagent capabilities](references/chapter.md#control-subagent-capabilities)
      - [Available tools](references/chapter.md#available-tools)
      - [Restrict which subagents can be spawned](references/chapter.md#restrict-which-subagents-can-be-spawned)
      - [Scope MCP servers to a subagent](references/chapter.md#scope-mcp-servers-to-a-subagent)
      - [Permission modes](references/chapter.md#permission-modes)
      - [Preload skills into subagents](references/chapter.md#preload-skills-into-subagents)
      - [Enable persistent memory](references/chapter.md#enable-persistent-memory)
      - [Persistent memory tips](references/chapter.md#persistent-memory-tips)
      - [Conditional rules with hooks](references/chapter.md#conditional-rules-with-hooks)
      - [Disable specific subagents](references/chapter.md#disable-specific-subagents)
    - [Define hooks for subagents](references/chapter.md#define-hooks-for-subagents)
      - [Hooks in subagent frontmatter](references/chapter.md#hooks-in-subagent-frontmatter)
      - [Project-level hooks for subagent events](references/chapter.md#project-level-hooks-for-subagent-events)
  - [Work with subagents](references/chapter.md#work-with-subagents)
    - [Understand automatic delegation](references/chapter.md#understand-automatic-delegation)
    - [Invoke subagents explicitly](references/chapter.md#invoke-subagents-explicitly)
    - [Run subagents in foreground or background](references/chapter.md#run-subagents-in-foreground-or-background)
    - [Subagent names](references/chapter.md#subagent-names)
    - [API errors in subagents](references/chapter.md#api-errors-in-subagents)
    - [Subagent output scanning](references/chapter.md#subagent-output-scanning)
    - [Common patterns](references/chapter.md#common-patterns)
      - [Isolate high-volume operations](references/chapter.md#isolate-high-volume-operations)
      - [Run parallel research](references/chapter.md#run-parallel-research)
      - [Chain subagents](references/chapter.md#chain-subagents)
    - [Choose between subagents and main conversation](references/chapter.md#choose-between-subagents-and-main-conversation)
    - [Let subagents spawn their own subagents](references/chapter.md#let-subagents-spawn-their-own-subagents)
    - [Concurrent subagent limit](references/chapter.md#concurrent-subagent-limit)
    - [Manage subagent context](references/chapter.md#manage-subagent-context)
      - [What loads at startup](references/chapter.md#what-loads-at-startup)
      - [Resume subagents](references/chapter.md#resume-subagents)
      - [Auto-compaction](references/chapter.md#auto-compaction)
  - [Fork the current conversation](references/chapter.md#fork-the-current-conversation)
    - [Observe and steer running forks](references/chapter.md#observe-and-steer-running-forks)
    - [How forks differ from other subagents](references/chapter.md#how-forks-differ-from-other-subagents)
    - [Turn fork mode on or off](references/chapter.md#turn-fork-mode-on-or-off)
  - [Example subagents](references/chapter.md#example-subagents)
    - [Code reviewer](references/chapter.md#code-reviewer)
    - [Debugger](references/chapter.md#debugger)
    - [Data scientist](references/chapter.md#data-scientist)
    - [Database query validator](references/chapter.md#database-query-validator)
  - [Related Docs:](references/chapter.md#related-docs)
