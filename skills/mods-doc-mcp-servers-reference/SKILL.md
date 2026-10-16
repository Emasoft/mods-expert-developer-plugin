---
name: mods-doc-mcp-servers-reference
description: "Use when working on mcp servers reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# MCP SERVERS REFERENCE

## Overview

Routes reads about mcp servers reference to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

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

Full chapter: [the chapter](references/chapter.md), with the complete MCP SERVERS REFERENCE table of contents:

- [Connect Claude Code to tools via MCP](references/chapter.md#connect-claude-code-to-tools-via-mcp)
  - [What you can do with MCP](references/chapter.md#what-you-can-do-with-mcp)
  - [Find and build MCP servers](references/chapter.md#find-and-build-mcp-servers)
  - [Installing MCP servers](references/chapter.md#installing-mcp-servers)
    - [Option 1: Add a remote HTTP server](references/chapter.md#option-1-add-a-remote-http-server)
    - [Option 2: Add a remote SSE server](references/chapter.md#option-2-add-a-remote-sse-server)
    - [Option 3: Add a local stdio server](references/chapter.md#option-3-add-a-local-stdio-server)
    - [Option 4: Add a remote WebSocket server](references/chapter.md#option-4-add-a-remote-websocket-server)
    - [Add a server from setup instructions written for another client](references/chapter.md#add-a-server-from-setup-instructions-written-for-another-client)
      - [Add a server from a URL](references/chapter.md#add-a-server-from-a-url)
      - [Add a server from an `npx`, `uvx`, or binary command](references/chapter.md#add-a-server-from-an-npx-uvx-or-binary-command)
      - [Add a server from an `mcpServers` JSON block](references/chapter.md#add-a-server-from-an-mcpservers-json-block)
    - [Managing your servers](references/chapter.md#managing-your-servers)
      - [Server status](references/chapter.md#server-status)
      - [Project server approvals and workspace trust](references/chapter.md#project-server-approvals-and-workspace-trust)
      - [Server status detail](references/chapter.md#server-status-detail)
      - [Configuration warnings](references/chapter.md#configuration-warnings)
      - [Tool availability](references/chapter.md#tool-availability)
    - [Disable a server without removing it](references/chapter.md#disable-a-server-without-removing-it)
    - [MCP client runtimes](references/chapter.md#mcp-client-runtimes)
    - [Dynamic tool updates](references/chapter.md#dynamic-tool-updates)
      - [Notification streams on the v2 runtime](references/chapter.md#notification-streams-on-the-v2-runtime)
    - [Automatic reconnection](references/chapter.md#automatic-reconnection)
      - [Mid-session drops of a remote server](references/chapter.md#mid-session-drops-of-a-remote-server)
      - [Failed first connections](references/chapter.md#failed-first-connections)
      - [Failed discovery requests](references/chapter.md#failed-discovery-requests)
      - [Retry failed servers yourself](references/chapter.md#retry-failed-servers-yourself)
      - [How Claude learns that a server failed](references/chapter.md#how-claude-learns-that-a-server-failed)
    - [Push messages with channels](references/chapter.md#push-messages-with-channels)
    - [Automatic backgrounding of long tool calls](references/chapter.md#automatic-backgrounding-of-long-tool-calls)
    - [Plugin-provided MCP servers](references/chapter.md#plugin-provided-mcp-servers)
  - [MCP installation scopes](references/chapter.md#mcp-installation-scopes)
    - [Local scope](references/chapter.md#local-scope)
    - [Project scope](references/chapter.md#project-scope)
    - [User scope](references/chapter.md#user-scope)
    - [Scope hierarchy and precedence](references/chapter.md#scope-hierarchy-and-precedence)
    - [Environment variable expansion in `.mcp.json`](references/chapter.md#environment-variable-expansion-in-mcpjson)
      - [Supported syntax](references/chapter.md#supported-syntax)
      - [Expansion locations](references/chapter.md#expansion-locations)
      - [Example with variable expansion](references/chapter.md#example-with-variable-expansion)
      - [Unset variables without a default](references/chapter.md#unset-variables-without-a-default)
      - [Credential variables that read as empty](references/chapter.md#credential-variables-that-read-as-empty)
      - [How references appear in `/mcp` and CLI output](references/chapter.md#how-references-appear-in-mcp-and-cli-output)
  - [Practical examples](references/chapter.md#practical-examples)
    - [Example: Connect to GitHub for code reviews](references/chapter.md#example-connect-to-github-for-code-reviews)
    - [Example: Query your PostgreSQL database](references/chapter.md#example-query-your-postgresql-database)
  - [Authenticate with remote MCP servers](references/chapter.md#authenticate-with-remote-mcp-servers)
    - [Authenticate from the command line](references/chapter.md#authenticate-from-the-command-line)
    - [Use a fixed OAuth callback port](references/chapter.md#use-a-fixed-oauth-callback-port)
    - [Use pre-configured OAuth credentials](references/chapter.md#use-pre-configured-oauth-credentials)
    - [Override OAuth metadata discovery](references/chapter.md#override-oauth-metadata-discovery)
    - [Restrict OAuth scopes](references/chapter.md#restrict-oauth-scopes)
    - [Use dynamic headers for custom authentication](references/chapter.md#use-dynamic-headers-for-custom-authentication)
      - [Where the helper runs](references/chapter.md#where-the-helper-runs)
      - [Which variables a helper can read](references/chapter.md#which-variables-a-helper-can-read)
      - [Trust a folder before its headersHelper runs](references/chapter.md#trust-a-folder-before-its-headershelper-runs)
  - [Add MCP servers from JSON configuration](references/chapter.md#add-mcp-servers-from-json-configuration)
  - [Import MCP servers from Claude Desktop](references/chapter.md#import-mcp-servers-from-claude-desktop)
  - [Use MCP servers from claude.ai](references/chapter.md#use-mcp-servers-from-claudeai)
    - [How connectors reach Claude Code](references/chapter.md#how-connectors-reach-claude-code)
    - [Organization controls on connector tools](references/chapter.md#organization-controls-on-connector-tools)
    - [Disable claude.ai connectors](references/chapter.md#disable-claudeai-connectors)
  - [Use Claude Code as an MCP server](references/chapter.md#use-claude-code-as-an-mcp-server)
  - [MCP output limits and warnings](references/chapter.md#mcp-output-limits-and-warnings)
    - [Raise the limit for a specific tool](references/chapter.md#raise-the-limit-for-a-specific-tool)
    - [Images in tool results](references/chapter.md#images-in-tool-results)
  - [Tool input schemas with a root-level combinator](references/chapter.md#tool-input-schemas-with-a-root-level-combinator)
  - [Tools with invalid input schemas](references/chapter.md#tools-with-invalid-input-schemas)
  - [Require approval for a specific tool](references/chapter.md#require-approval-for-a-specific-tool)
  - [Respond to MCP elicitation requests](references/chapter.md#respond-to-mcp-elicitation-requests)
  - [Use MCP resources](references/chapter.md#use-mcp-resources)
    - [Reference MCP resources](references/chapter.md#reference-mcp-resources)
  - [Scale with MCP tool search](references/chapter.md#scale-with-mcp-tool-search)
    - [Tool search for MCP server authors](references/chapter.md#tool-search-for-mcp-server-authors)
    - [Configure tool search](references/chapter.md#configure-tool-search)
    - [Exempt a server from deferral](references/chapter.md#exempt-a-server-from-deferral)
  - [Use MCP prompts as commands](references/chapter.md#use-mcp-prompts-as-commands)
    - [Execute MCP prompts](references/chapter.md#execute-mcp-prompts)
  - [Managed MCP configuration](references/chapter.md#managed-mcp-configuration)
