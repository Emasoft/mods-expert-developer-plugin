---
name: mods-doc-prompt-caching-reference
description: "Use when working on prompt caching reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# PROMPT CACHING REFERENCE

## Overview

Routes reads about prompt caching reference to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the PROMPT CACHING REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs prompt caching reference; otherwise stop without opening the chapter.
2. Pick the PROMPT CACHING REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that prompt caching reference section; do not preload this or any other chapter.
4. Stop when the PROMPT CACHING REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The PROMPT CACHING REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the PROMPT CACHING REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "How the cache is organized". Output: open [How the cache is organized](references/chapter.md#how-the-cache-is-organized) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete PROMPT CACHING REFERENCE table of contents:

- [How Claude Code uses prompt caching](references/chapter.md#how-claude-code-uses-prompt-caching)
  - [How the cache is organized](references/chapter.md#how-the-cache-is-organized)
    - [Where the cache lives](references/chapter.md#where-the-cache-lives)
  - [Actions that invalidate the cache](references/chapter.md#actions-that-invalidate-the-cache)
    - [Switching models](references/chapter.md#switching-models)
    - [Changing effort level](references/chapter.md#changing-effort-level)
    - [Turning on fast mode](references/chapter.md#turning-on-fast-mode)
    - [Connecting or removing an MCP server](references/chapter.md#connecting-or-removing-an-mcp-server)
    - [Enabling or disabling a plugin](references/chapter.md#enabling-or-disabling-a-plugin)
      - [Plugin components that keep the cache](references/chapter.md#plugin-components-that-keep-the-cache)
      - [Plugins that provide MCP servers](references/chapter.md#plugins-that-provide-mcp-servers)
      - [Code intelligence plugins](references/chapter.md#code-intelligence-plugins)
      - [When plugin changes apply](references/chapter.md#when-plugin-changes-apply)
      - [Plugins you enable and then disable in one session](references/chapter.md#plugins-you-enable-and-then-disable-in-one-session)
    - [Denying an entire tool](references/chapter.md#denying-an-entire-tool)
    - [Compacting the conversation](references/chapter.md#compacting-the-conversation)
    - [Accumulating many images](references/chapter.md#accumulating-many-images)
    - [Upgrading Claude Code](references/chapter.md#upgrading-claude-code)
  - [Actions that keep the cache](references/chapter.md#actions-that-keep-the-cache)
    - [Editing files in your repository](references/chapter.md#editing-files-in-your-repository)
    - [Editing CLAUDE.md mid-session](references/chapter.md#editing-claudemd-mid-session)
    - [Changing permission mode](references/chapter.md#changing-permission-mode)
    - [Changing output style](references/chapter.md#changing-output-style)
    - [Invoking skills and commands](references/chapter.md#invoking-skills-and-commands)
    - [Running `/recap`](references/chapter.md#running-recap)
    - [Rewinding the conversation](references/chapter.md#rewinding-the-conversation)
  - [Resuming a session](references/chapter.md#resuming-a-session)
  - [Cache lifetime](references/chapter.md#cache-lifetime)
    - [Which TTL each request gets](references/chapter.md#which-ttl-each-request-gets)
    - [Choose the TTL yourself](references/chapter.md#choose-the-ttl-yourself)
  - [Cache scope](references/chapter.md#cache-scope)
  - [Check cache performance](references/chapter.md#check-cache-performance)
  - [Subagents and the cache](references/chapter.md#subagents-and-the-cache)
  - [Disable prompt caching](references/chapter.md#disable-prompt-caching)
  - [Related resources](references/chapter.md#related-resources)
