---
name: mods-doc-headless-mode-reference
description: "Use when working on headless mode reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# HEADLESS MODE REFERENCE

## Overview

Routes reads about headless mode reference to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the HEADLESS MODE REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs headless mode reference; otherwise stop without opening the chapter.
2. Pick the HEADLESS MODE REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that headless mode reference section; do not preload this or any other chapter.
4. Stop when the HEADLESS MODE REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The HEADLESS MODE REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the HEADLESS MODE REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Basic usage". Output: open [Basic usage](references/chapter.md#basic-usage) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete HEADLESS MODE REFERENCE table of contents:

- [Run Claude Code programmatically](references/chapter.md#run-claude-code-programmatically)
  - [Basic usage](references/chapter.md#basic-usage)
    - [Start faster with bare mode](references/chapter.md#start-faster-with-bare-mode)
    - [Background tasks at exit](references/chapter.md#background-tasks-at-exit)
    - [Stop a run with SIGTERM](references/chapter.md#stop-a-run-with-sigterm)
    - [If the working directory is deleted](references/chapter.md#if-the-working-directory-is-deleted)
  - [Examples](references/chapter.md#examples)
    - [Pipe data through Claude](references/chapter.md#pipe-data-through-claude)
    - [Add Claude to a build script](references/chapter.md#add-claude-to-a-build-script)
    - [Get structured output](references/chapter.md#get-structured-output)
    - [Stream responses](references/chapter.md#stream-responses)
      - [Follow subagent messages](references/chapter.md#follow-subagent-messages)
      - [Handle API retries](references/chapter.md#handle-api-retries)
      - [Read session metadata](references/chapter.md#read-session-metadata)
      - [Fail CI when a plugin or MCP server doesn't load](references/chapter.md#fail-ci-when-a-plugin-or-mcp-server-doesnt-load)
      - [Track plugin installs](references/chapter.md#track-plugin-installs)
    - [Auto-approve tools](references/chapter.md#auto-approve-tools)
    - [Turn off permission prompts in unattended runs](references/chapter.md#turn-off-permission-prompts-in-unattended-runs)
    - [Create a commit](references/chapter.md#create-a-commit)
    - [Customize the system prompt](references/chapter.md#customize-the-system-prompt)
    - [Continue conversations](references/chapter.md#continue-conversations)
  - [Next steps](references/chapter.md#next-steps)
