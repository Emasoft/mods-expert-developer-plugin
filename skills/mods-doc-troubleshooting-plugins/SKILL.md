---
name: mods-doc-troubleshooting-plugins
description: "Use when working on troubleshooting plugins. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# TROUBLESHOOTING PLUGINS

## Overview

Routes reads about troubleshooting plugins to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the TROUBLESHOOTING PLUGINS chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs troubleshooting plugins; otherwise stop without opening the chapter.
2. Pick the TROUBLESHOOTING PLUGINS section from the Table of Contents under Resources and follow its link.
3. Read only that troubleshooting plugins section; do not preload this or any other chapter.
4. Stop when the TROUBLESHOOTING PLUGINS section is read: this wrapper routes reads only and authorizes no writes.

## Output

The TROUBLESHOOTING PLUGINS section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the TROUBLESHOOTING PLUGINS headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Find where `/plugin` runs". Output: open [Find where `/plugin` runs](references/chapter.md#find-where-plugin-runs) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete TROUBLESHOOTING PLUGINS table of contents:

- [Troubleshoot plugins](references/chapter.md#troubleshoot-plugins)
  - [Find where `/plugin` runs](references/chapter.md#find-where-plugin-runs)
  - [Add a marketplace](references/chapter.md#add-a-marketplace)
  - [Install a plugin](references/chapter.md#install-a-plugin)
  - [Plugin installed but not working](references/chapter.md#plugin-installed-but-not-working)
    - [Hooks fail to load](references/chapter.md#hooks-fail-to-load)
      - [`hook error` notices in the transcript](references/chapter.md#hook-error-notices-in-the-transcript)
      - [A plugin hook blocks a tool call or prompt](references/chapter.md#a-plugin-hook-blocks-a-tool-call-or-prompt)
      - [Hook loads but never fires](references/chapter.md#hook-loads-but-never-fires)
      - [`Invalid MCP server config for "<server>": <error>`](references/chapter.md#invalid-mcp-server-config-for--)
      - [`Bundled MCP server "<name>" was not started: it needs configuration`](references/chapter.md#bundled-mcp-server--was-not-started-it-needs-configuration)
      - [Server is configured but never connects](references/chapter.md#server-is-configured-but-never-connects)
      - [Server works with `--plugin-dir` but fails after install](references/chapter.md#server-works-with---plugin-dir-but-fails-after-install)
      - [Language server doesn't start](references/chapter.md#language-server-doesnt-start)
      - [Language server uses too much memory](references/chapter.md#language-server-uses-too-much-memory)
      - [False positive diagnostics in a monorepo](references/chapter.md#false-positive-diagnostics-in-a-monorepo)
  - [Build a plugin](references/chapter.md#build-a-plugin)
  - [Host a marketplace](references/chapter.md#host-a-marketplace)
  - [Blocked by your organization](references/chapter.md#blocked-by-your-organization)
  - [Related Docs](references/chapter.md#related-docs)
