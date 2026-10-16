---
name: mods-doc-native-toolset-reference
description: "Use when working on native tools reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# NATIVE TOOLS REFERENCE

## Overview

Routes reads about native tools reference to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the NATIVE TOOLS REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs native tools reference; otherwise stop without opening the chapter.
2. Pick the NATIVE TOOLS REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that native tools reference section; do not preload this or any other chapter.
4. Stop when the NATIVE TOOLS REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The NATIVE TOOLS REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the NATIVE TOOLS REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Configure tools with permission rules and hooks". Output: open [Configure tools with permission rules and hooks](references/chapter.md#configure-tools-with-permission-rules-and-hooks) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level NATIVE TOOLS REFERENCE table of contents:

- [Tools reference](references/chapter.md#tools-reference)
  - [Configure tools with permission rules and hooks](references/chapter.md#configure-tools-with-permission-rules-and-hooks)
  - [Agent tool behavior](references/chapter.md#agent-tool-behavior)
  - [AskUserQuestion tool behavior and auto-continue timeout](references/chapter.md#askuserquestion-tool-behavior-and-auto-continue-timeout)
  - [Bash tool behavior, limits, and background commands](references/chapter.md#bash-tool-behavior-limits-and-background-commands)
  - [Edit tool behavior and non-UTF-8 files](references/chapter.md#edit-tool-behavior-and-non-utf-8-files)
  - [EndConversation tool behavior](references/chapter.md#endconversation-tool-behavior)
  - [Glob tool behavior](references/chapter.md#glob-tool-behavior)
  - [Grep tool behavior](references/chapter.md#grep-tool-behavior)
  - [LSP tool behavior](references/chapter.md#lsp-tool-behavior)
  - [Monitor tool and WebSocket sources](references/chapter.md#monitor-tool-and-websocket-sources)
  - [NotebookEdit tool behavior](references/chapter.md#notebookedit-tool-behavior)
  - [PowerShell tool setup, shell selection, and limits](references/chapter.md#powershell-tool-setup-shell-selection-and-limits)
  - [Read tool behavior and large files](references/chapter.md#read-tool-behavior-and-large-files)
  - [SendFeedback tool behavior and Claude-drafted feedback](references/chapter.md#sendfeedback-tool-behavior-and-claude-drafted-feedback)
  - [Task tool availability](references/chapter.md#task-tool-availability)
  - [WebFetch tool behavior and availability](references/chapter.md#webfetch-tool-behavior-and-availability)
  - [WebSearch tool behavior and search limit](references/chapter.md#websearch-tool-behavior-and-search-limit)
  - [Write tool behavior](references/chapter.md#write-tool-behavior)
  - [Check which tools are available](references/chapter.md#check-which-tools-are-available)
  - [See also](references/chapter.md#see-also)
