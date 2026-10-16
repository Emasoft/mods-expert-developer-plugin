---
name: mods-doc-mcp-servers-reference
description: "Use when working on mcp servers reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# MCP SERVERS REFERENCE

## Overview

Routes reads about mcp servers reference to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the MCP SERVERS REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs mcp servers reference; otherwise stop without opening the chapter.
2. Pick the MCP SERVERS REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that mcp servers reference section; do not preload this or any other chapter.
4. Stop when the MCP SERVERS REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The MCP SERVERS REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the MCP SERVERS REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "What you can do with MCP". Output: open [What you can do with MCP](references/chapter.md#what-you-can-do-with-mcp) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level MCP SERVERS REFERENCE table of contents:

- [Connect Claude Code to tools via MCP](references/chapter.md#connect-claude-code-to-tools-via-mcp)
  - [What you can do with MCP](references/chapter.md#what-you-can-do-with-mcp)
  - [Find and build MCP servers](references/chapter.md#find-and-build-mcp-servers)
  - [Installing MCP servers](references/chapter.md#installing-mcp-servers)
  - [MCP installation scopes](references/chapter.md#mcp-installation-scopes)
  - [Practical examples](references/chapter.md#practical-examples)
  - [Authenticate with remote MCP servers](references/chapter.md#authenticate-with-remote-mcp-servers)
  - [Add MCP servers from JSON configuration](references/chapter.md#add-mcp-servers-from-json-configuration)
  - [Import MCP servers from Claude Desktop](references/chapter.md#import-mcp-servers-from-claude-desktop)
  - [Use MCP servers from claude.ai](references/chapter.md#use-mcp-servers-from-claudeai)
  - [Use Claude Code as an MCP server](references/chapter.md#use-claude-code-as-an-mcp-server)
  - [MCP output limits and warnings](references/chapter.md#mcp-output-limits-and-warnings)
  - [Tool input schemas with a root-level combinator](references/chapter.md#tool-input-schemas-with-a-root-level-combinator)
  - [Tools with invalid input schemas](references/chapter.md#tools-with-invalid-input-schemas)
  - [Require approval for a specific tool](references/chapter.md#require-approval-for-a-specific-tool)
  - [Respond to MCP elicitation requests](references/chapter.md#respond-to-mcp-elicitation-requests)
  - [Use MCP resources](references/chapter.md#use-mcp-resources)
  - [Scale with MCP tool search](references/chapter.md#scale-with-mcp-tool-search)
  - [Use MCP prompts as commands](references/chapter.md#use-mcp-prompts-as-commands)
  - [Managed MCP configuration](references/chapter.md#managed-mcp-configuration)
