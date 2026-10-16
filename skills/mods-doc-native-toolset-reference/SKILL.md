---
name: mods-doc-native-toolset-reference
description: "Use when working on native tools reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# NATIVE TOOLS REFERENCE

## Overview

Routes reads about native tools reference to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

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

Full chapter: [the chapter](references/chapter.md), with the complete NATIVE TOOLS REFERENCE table of contents:

- [Tools reference](references/chapter.md#tools-reference)
  - [Configure tools with permission rules and hooks](references/chapter.md#configure-tools-with-permission-rules-and-hooks)
  - [Agent tool behavior](references/chapter.md#agent-tool-behavior)
  - [AskUserQuestion tool behavior](references/chapter.md#askuserquestion-tool-behavior)
    - [Question auto-continue timeout](references/chapter.md#question-auto-continue-timeout)
  - [Bash tool behavior](references/chapter.md#bash-tool-behavior)
    - [What persists between commands](references/chapter.md#what-persists-between-commands)
    - [Timeout and output limits](references/chapter.md#timeout-and-output-limits)
      - [Output limits](references/chapter.md#output-limits)
    - [Background commands](references/chapter.md#background-commands)
      - [When a background command stops](references/chapter.md#when-a-background-command-stops)
      - [Time limit for background commands](references/chapter.md#time-limit-for-background-commands)
      - [Raise the time limit for background commands](references/chapter.md#raise-the-time-limit-for-background-commands)
      - [Foreground commands that move to the background](references/chapter.md#foreground-commands-that-move-to-the-background)
    - [Memory limit on Linux and WSL](references/chapter.md#memory-limit-on-linux-and-wsl)
  - [Edit tool behavior](references/chapter.md#edit-tool-behavior)
    - [Non-UTF-8 files](references/chapter.md#non-utf-8-files)
  - [EndConversation tool behavior](references/chapter.md#endconversation-tool-behavior)
  - [Glob tool behavior](references/chapter.md#glob-tool-behavior)
  - [Grep tool behavior](references/chapter.md#grep-tool-behavior)
  - [LSP tool behavior](references/chapter.md#lsp-tool-behavior)
  - [Monitor tool](references/chapter.md#monitor-tool)
    - [WebSocket source](references/chapter.md#websocket-source)
  - [NotebookEdit tool behavior](references/chapter.md#notebookedit-tool-behavior)
  - [PowerShell tool](references/chapter.md#powershell-tool)
    - [Enable the PowerShell tool](references/chapter.md#enable-the-powershell-tool)
    - [Bash deny rules also turn off the PowerShell tool](references/chapter.md#bash-deny-rules-also-turn-off-the-powershell-tool)
    - [Shell selection in settings, hooks, and skills](references/chapter.md#shell-selection-in-settings-hooks-and-skills)
    - [Windows encoding and exit codes](references/chapter.md#windows-encoding-and-exit-codes)
    - [Preview limitations](references/chapter.md#preview-limitations)
  - [Read tool behavior](references/chapter.md#read-tool-behavior)
    - [Large files](references/chapter.md#large-files)
  - [SendFeedback tool behavior](references/chapter.md#sendfeedback-tool-behavior)
    - [What you see when Claude drafts](references/chapter.md#what-you-see-when-claude-drafts)
    - [Review and edit a draft](references/chapter.md#review-and-edit-a-draft)
    - [Send a draft](references/chapter.md#send-a-draft)
    - [Discard or keep a draft](references/chapter.md#discard-or-keep-a-draft)
    - [Turn Claude-drafted feedback off](references/chapter.md#turn-claude-drafted-feedback-off)
    - [Sessions without Claude-drafted feedback](references/chapter.md#sessions-without-claude-drafted-feedback)
  - [Task tool availability](references/chapter.md#task-tool-availability)
  - [WebFetch tool behavior](references/chapter.md#webfetch-tool-behavior)
    - [WebFetch availability](references/chapter.md#webfetch-availability)
  - [WebSearch tool behavior](references/chapter.md#websearch-tool-behavior)
    - [Session search limit](references/chapter.md#session-search-limit)
  - [Write tool behavior](references/chapter.md#write-tool-behavior)
  - [Check which tools are available](references/chapter.md#check-which-tools-are-available)
  - [See also](references/chapter.md#see-also)
