---
name: mods-doc-hooks-reference
description: "Use when working on hooks reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# HOOKS REFERENCE

## Overview

Routes reads about hooks reference to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the HOOKS REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs hooks reference; otherwise stop without opening the chapter.
2. Pick the HOOKS REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that hooks reference section; do not preload this or any other chapter.
4. Stop when the HOOKS REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The HOOKS REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the HOOKS REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Hook lifecycle". Output: open [Hook lifecycle](references/chapter.md#hook-lifecycle) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete HOOKS REFERENCE table of contents:

- [Hooks reference](references/chapter.md#hooks-reference-1)
  - [Hook lifecycle](references/chapter.md#hook-lifecycle)
    - [How a hook resolves](references/chapter.md#how-a-hook-resolves)
  - [Configuration](references/chapter.md#configuration)
    - [Hook locations](references/chapter.md#hook-locations)
    - [Matcher patterns](references/chapter.md#matcher-patterns)
      - [Match MCP tools](references/chapter.md#match-mcp-tools)
    - [Hook handler fields](references/chapter.md#hook-handler-fields)
      - [Common fields](references/chapter.md#common-fields)
      - [Command hook fields](references/chapter.md#command-hook-fields)
      - [Exec form and shell form](references/chapter.md#exec-form-and-shell-form)
      - [HTTP hook fields](references/chapter.md#http-hook-fields)
      - [MCP tool hook fields](references/chapter.md#mcp-tool-hook-fields)
      - [How the tool's result is read](references/chapter.md#how-the-tools-result-is-read)
      - [When the server is still connecting](references/chapter.md#when-the-server-is-still-connecting)
      - [Events that fire before MCP servers are available](references/chapter.md#events-that-fire-before-mcp-servers-are-available)
      - [Prompt and agent hook fields](references/chapter.md#prompt-and-agent-hook-fields)
    - [Reference scripts by path](references/chapter.md#reference-scripts-by-path)
    - [Hooks in skills and agents](references/chapter.md#hooks-in-skills-and-agents)
    - [The `/hooks` menu](references/chapter.md#the-hooks-menu)
    - [Disable or remove hooks](references/chapter.md#disable-or-remove-hooks)
  - [Hook input and output](references/chapter.md#hook-input-and-output)
    - [Common input fields](references/chapter.md#common-input-fields)
    - [Exit code output](references/chapter.md#exit-code-output)
      - [Exit code 0](references/chapter.md#exit-code-0)
      - [Exit code 2](references/chapter.md#exit-code-2)
      - [Other exit codes](references/chapter.md#other-exit-codes)
      - [Timeouts](references/chapter.md#timeouts)
      - [Block the action when a hook fails](references/chapter.md#block-the-action-when-a-hook-fails)
      - [Exit code 2 behavior per event](references/chapter.md#exit-code-2-behavior-per-event)
    - [HTTP response handling](references/chapter.md#http-response-handling)
    - [JSON output](references/chapter.md#json-output)
      - [Emit terminal notifications](references/chapter.md#emit-terminal-notifications)
      - [Add context for Claude](references/chapter.md#add-context-for-claude)
      - [Decision control](references/chapter.md#decision-control)
  - [Hook events](references/chapter.md#hook-events)
    - [SessionStart](references/chapter.md#sessionstart)
      - [SessionStart input](references/chapter.md#sessionstart-input)
      - [SessionStart decision control](references/chapter.md#sessionstart-decision-control)
      - [Reload skills that a hook installs](references/chapter.md#reload-skills-that-a-hook-installs)
      - [Persist environment variables](references/chapter.md#persist-environment-variables)
      - [Persisted variables in PowerShell commands](references/chapter.md#persisted-variables-in-powershell-commands)
    - [Setup](references/chapter.md#setup)
      - [Setup input](references/chapter.md#setup-input)
      - [Setup decision control](references/chapter.md#setup-decision-control)
    - [InstructionsLoaded](references/chapter.md#instructionsloaded)
      - [InstructionsLoaded input](references/chapter.md#instructionsloaded-input)
      - [InstructionsLoaded decision control](references/chapter.md#instructionsloaded-decision-control)
    - [UserPromptSubmit](references/chapter.md#userpromptsubmit)
      - [UserPromptSubmit input](references/chapter.md#userpromptsubmit-input)
      - [UserPromptSubmit decision control](references/chapter.md#userpromptsubmit-decision-control)
      - [What a blocked prompt leaves behind](references/chapter.md#what-a-blocked-prompt-leaves-behind)
    - [UserPromptExpansion](references/chapter.md#userpromptexpansion)
      - [UserPromptExpansion input](references/chapter.md#userpromptexpansion-input)
      - [UserPromptExpansion decision control](references/chapter.md#userpromptexpansion-decision-control)
    - [MessageDisplay](references/chapter.md#messagedisplay)
      - [MessageDisplay input](references/chapter.md#messagedisplay-input)
      - [MessageDisplay output](references/chapter.md#messagedisplay-output)
    - [PreToolUse](references/chapter.md#pretooluse)
      - [PreToolUse input](references/chapter.md#pretooluse-input)
      - [Bash](references/chapter.md#bash)
      - [PowerShell](references/chapter.md#powershell)
      - [Write](references/chapter.md#write)
      - [Edit](references/chapter.md#edit)
      - [Read](references/chapter.md#read)
      - [Glob](references/chapter.md#glob)
      - [Grep](references/chapter.md#grep)
      - [WebFetch](references/chapter.md#webfetch)
      - [WebSearch](references/chapter.md#websearch)
      - [Agent](references/chapter.md#agent)
      - [AskUserQuestion](references/chapter.md#askuserquestion)
      - [ExitPlanMode](references/chapter.md#exitplanmode)
      - [PreToolUse decision control](references/chapter.md#pretooluse-decision-control)
      - [Defer a tool call for later](references/chapter.md#defer-a-tool-call-for-later)
    - [PermissionRequest](references/chapter.md#permissionrequest)
      - [PermissionRequest input](references/chapter.md#permissionrequest-input)
      - [PermissionRequest decision control](references/chapter.md#permissionrequest-decision-control)
      - [Permission update entries](references/chapter.md#permission-update-entries)
    - [PostToolUse](references/chapter.md#posttooluse)
      - [PostToolUse input](references/chapter.md#posttooluse-input)
      - [PostToolUse decision control](references/chapter.md#posttooluse-decision-control)
      - [Annotate a result for the auto mode classifier](references/chapter.md#annotate-a-result-for-the-auto-mode-classifier)
    - [PostToolUseFailure](references/chapter.md#posttoolusefailure)
      - [PostToolUseFailure input](references/chapter.md#posttoolusefailure-input)
      - [PostToolUseFailure decision control](references/chapter.md#posttoolusefailure-decision-control)
    - [PostToolBatch](references/chapter.md#posttoolbatch)
      - [PostToolBatch input](references/chapter.md#posttoolbatch-input)
      - [PostToolBatch decision control](references/chapter.md#posttoolbatch-decision-control)
    - [PermissionDenied](references/chapter.md#permissiondenied)
      - [PermissionDenied input](references/chapter.md#permissiondenied-input)
      - [PermissionDenied decision control](references/chapter.md#permissiondenied-decision-control)
    - [Notification](references/chapter.md#notification)
      - [Notification input](references/chapter.md#notification-input)
    - [SubagentStart](references/chapter.md#subagentstart)
      - [SubagentStart input](references/chapter.md#subagentstart-input)
    - [SubagentStop](references/chapter.md#subagentstop)
      - [SubagentStop input](references/chapter.md#subagentstop-input)
    - [TaskCreated](references/chapter.md#taskcreated)
      - [TaskCreated input](references/chapter.md#taskcreated-input)
      - [TaskCreated decision control](references/chapter.md#taskcreated-decision-control)
    - [TaskCompleted](references/chapter.md#taskcompleted)
      - [TaskCompleted input](references/chapter.md#taskcompleted-input)
      - [TaskCompleted decision control](references/chapter.md#taskcompleted-decision-control)
    - [Stop](references/chapter.md#stop)
      - [Stop input](references/chapter.md#stop-input)
      - [Stop decision control](references/chapter.md#stop-decision-control)
    - [StopFailure](references/chapter.md#stopfailure)
      - [StopFailure input](references/chapter.md#stopfailure-input)
    - [TeammateIdle](references/chapter.md#teammateidle)
      - [TeammateIdle input](references/chapter.md#teammateidle-input)
      - [TeammateIdle decision control](references/chapter.md#teammateidle-decision-control)
    - [ConfigChange](references/chapter.md#configchange)
      - [ConfigChange input](references/chapter.md#configchange-input)
      - [ConfigChange decision control](references/chapter.md#configchange-decision-control)
    - [CwdChanged](references/chapter.md#cwdchanged)
      - [CwdChanged input](references/chapter.md#cwdchanged-input)
      - [CwdChanged output](references/chapter.md#cwdchanged-output)
    - [DirectoryAdded](references/chapter.md#directoryadded)
      - [DirectoryAdded input](references/chapter.md#directoryadded-input)
    - [FileChanged](references/chapter.md#filechanged)
      - [FileChanged input](references/chapter.md#filechanged-input)
      - [FileChanged output](references/chapter.md#filechanged-output)
    - [WorktreeCreate](references/chapter.md#worktreecreate)
      - [WorktreeCreate input](references/chapter.md#worktreecreate-input)
      - [WorktreeCreate output](references/chapter.md#worktreecreate-output)
    - [WorktreeRemove](references/chapter.md#worktreeremove)
      - [WorktreeRemove input](references/chapter.md#worktreeremove-input)
    - [PreCompact](references/chapter.md#precompact)
      - [PreCompact input](references/chapter.md#precompact-input)
    - [PostCompact](references/chapter.md#postcompact)
      - [PostCompact input](references/chapter.md#postcompact-input)
    - [PreModelSwitch](references/chapter.md#premodelswitch)
      - [PreModelSwitch input](references/chapter.md#premodelswitch-input)
      - [PreModelSwitch decision control](references/chapter.md#premodelswitch-decision-control)
    - [PostModelSwitch](references/chapter.md#postmodelswitch)
      - [PostModelSwitch input](references/chapter.md#postmodelswitch-input)
      - [PostModelSwitch decision control](references/chapter.md#postmodelswitch-decision-control)
    - [SessionEnd](references/chapter.md#sessionend)
      - [SessionEnd input](references/chapter.md#sessionend-input)
    - [Elicitation](references/chapter.md#elicitation)
      - [Elicitation input](references/chapter.md#elicitation-input)
      - [Elicitation output](references/chapter.md#elicitation-output)
      - [Other ways to decline an elicitation](references/chapter.md#other-ways-to-decline-an-elicitation)
      - [Answer a form request from a script](references/chapter.md#answer-a-form-request-from-a-script)
    - [ElicitationResult](references/chapter.md#elicitationresult)
      - [ElicitationResult input](references/chapter.md#elicitationresult-input)
      - [ElicitationResult output](references/chapter.md#elicitationresult-output)
  - [Prompt-based hooks](references/chapter.md#prompt-based-hooks)
    - [How prompt-based hooks work](references/chapter.md#how-prompt-based-hooks-work)
    - [Prompt hook configuration](references/chapter.md#prompt-hook-configuration)
    - [Response schema](references/chapter.md#response-schema)
    - [Check multiple conditions before stopping](references/chapter.md#check-multiple-conditions-before-stopping)
  - [Agent-based hooks](references/chapter.md#agent-based-hooks)
    - [How agent hooks work](references/chapter.md#how-agent-hooks-work)
    - [Agent hook configuration](references/chapter.md#agent-hook-configuration)
  - [Run hooks in the background](references/chapter.md#run-hooks-in-the-background)
    - [Configure an async hook](references/chapter.md#configure-an-async-hook)
    - [How async hooks execute](references/chapter.md#how-async-hooks-execute)
    - [Run tests after file changes](references/chapter.md#run-tests-after-file-changes)
    - [Limitations](references/chapter.md#limitations)
  - [Security considerations](references/chapter.md#security-considerations)
    - [Disclaimer](references/chapter.md#disclaimer)
    - [Workspace trust](references/chapter.md#workspace-trust)
    - [Security best practices](references/chapter.md#security-best-practices)
  - [Windows PowerShell tool](references/chapter.md#windows-powershell-tool)
  - [Debug hooks](references/chapter.md#debug-hooks)
