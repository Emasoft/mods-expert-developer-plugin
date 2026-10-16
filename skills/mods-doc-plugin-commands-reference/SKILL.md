---
name: mods-doc-plugin-commands-reference
description: "Use when working on plugin commands reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# PLUGIN COMMANDS REFERENCE

## Overview

Routes reads about plugin commands reference to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the PLUGIN COMMANDS REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs plugin commands reference; otherwise stop without opening the chapter.
2. Pick the PLUGIN COMMANDS REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that plugin commands reference section; do not preload this or any other chapter.
4. Stop when the PLUGIN COMMANDS REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The PLUGIN COMMANDS REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the PLUGIN COMMANDS REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "claude plugin commands". Output: open [claude plugin commands](references/chapter.md#claude-plugin-commands) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete PLUGIN COMMANDS REFERENCE table of contents:

- [Plugin commands reference](references/chapter.md#plugin-commands-reference-1)
  - [claude plugin commands](references/chapter.md#claude-plugin-commands)
    - [plugin init](references/chapter.md#plugin-init)
    - [plugin install](references/chapter.md#plugin-install)
      - [JSON result for marketplace commands](references/chapter.md#json-result-for-marketplace-commands)
      - [Accept a displayed install command](references/chapter.md#accept-a-displayed-install-command)
    - [plugin uninstall](references/chapter.md#plugin-uninstall)
      - [What an uninstall deletes and keeps](references/chapter.md#what-an-uninstall-deletes-and-keeps)
    - [plugin enable](references/chapter.md#plugin-enable)
    - [plugin disable](references/chapter.md#plugin-disable)
    - [plugin update](references/chapter.md#plugin-update)
      - [Which scope the command updates](references/chapter.md#which-scope-the-command-updates)
      - [Update by bare name](references/chapter.md#update-by-bare-name)
      - [Retry an unfinished dependency install](references/chapter.md#retry-an-unfinished-dependency-install)
    - [plugin list](references/chapter.md#plugin-list)
      - [JSON output](references/chapter.md#json-output)
    - [plugin details](references/chapter.md#plugin-details)
    - [plugin configure](references/chapter.md#plugin-configure)
    - [plugin prune](references/chapter.md#plugin-prune)
    - [plugin eval](references/chapter.md#plugin-eval)
    - [plugin eval init](references/chapter.md#plugin-eval-init)
    - [plugin tag](references/chapter.md#plugin-tag)
    - [plugin test](references/chapter.md#plugin-test)
    - [plugin validate](references/chapter.md#plugin-validate)
      - [Validate a directory](references/chapter.md#validate-a-directory)
      - [Output and exit codes](references/chapter.md#output-and-exit-codes)
  - [claude plugin marketplace commands](references/chapter.md#claude-plugin-marketplace-commands)
    - [plugin marketplace add](references/chapter.md#plugin-marketplace-add)
    - [plugin marketplace list](references/chapter.md#plugin-marketplace-list)
    - [plugin marketplace remove](references/chapter.md#plugin-marketplace-remove)
    - [plugin marketplace update](references/chapter.md#plugin-marketplace-update)
    - [Reload summary](references/chapter.md#reload-summary)
    - [Reloads that change MCP tools](references/chapter.md#reloads-that-change-mcp-tools)
    - [Sessions without an interactive terminal](references/chapter.md#sessions-without-an-interactive-terminal)
  - [Flags that load a plugin for one session](references/chapter.md#flags-that-load-a-plugin-for-one-session)
  - [See Also:](references/chapter.md#see-also)
