---
name: mods-doc-dynamic-workflows-reference
description: "Use when working on dynamic workflows reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# DYNAMIC WORKFLOWS REFERENCE

## Overview

Routes reads about dynamic workflows reference to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the DYNAMIC WORKFLOWS REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs dynamic workflows reference; otherwise stop without opening the chapter.
2. Pick the DYNAMIC WORKFLOWS REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that dynamic workflows reference section; do not preload this or any other chapter.
4. Stop when the DYNAMIC WORKFLOWS REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The DYNAMIC WORKFLOWS REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the DYNAMIC WORKFLOWS REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "When to use a workflow". Output: open [When to use a workflow](references/chapter.md#when-to-use-a-workflow) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete DYNAMIC WORKFLOWS REFERENCE table of contents:

- [Orchestrate subagents at scale with dynamic workflows](references/chapter.md#orchestrate-subagents-at-scale-with-dynamic-workflows)
  - [When to use a workflow](references/chapter.md#when-to-use-a-workflow)
  - [Run a bundled workflow](references/chapter.md#run-a-bundled-workflow)
    - [Bundled workflows](references/chapter.md#bundled-workflows)
    - [Watch the run](references/chapter.md#watch-the-run)
  - [Have Claude write a workflow](references/chapter.md#have-claude-write-a-workflow)
    - [Ask for a workflow in your prompt](references/chapter.md#ask-for-a-workflow-in-your-prompt)
      - [Dismiss or turn off the keyword](references/chapter.md#dismiss-or-turn-off-the-keyword)
      - [Where the keyword works](references/chapter.md#where-the-keyword-works)
    - [Let Claude decide with ultracode](references/chapter.md#let-claude-decide-with-ultracode)
    - [Approve the plan before it runs](references/chapter.md#approve-the-plan-before-it-runs)
    - [Save the workflow for reuse](references/chapter.md#save-the-workflow-for-reuse)
    - [Distribute a workflow in a plugin](references/chapter.md#distribute-a-workflow-in-a-plugin)
    - [Pass input to a saved workflow](references/chapter.md#pass-input-to-a-saved-workflow)
  - [Example workflow prompts](references/chapter.md#example-workflow-prompts)
    - [Audit many files for the same issue](references/chapter.md#audit-many-files-for-the-same-issue)
    - [Keep fixing until a check passes](references/chapter.md#keep-fixing-until-a-check-passes)
    - [Migrate many files in parallel](references/chapter.md#migrate-many-files-in-parallel)
    - [Review every changed file and write one summary](references/chapter.md#review-every-changed-file-and-write-one-summary)
    - [Research a topic across many sources](references/chapter.md#research-a-topic-across-many-sources)
    - [Find issues until the list stops growing](references/chapter.md#find-issues-until-the-list-stops-growing)
    - [What the saved script looks like](references/chapter.md#what-the-saved-script-looks-like)
    - [Edit a saved script](references/chapter.md#edit-a-saved-script)
  - [How a workflow runs](references/chapter.md#how-a-workflow-runs)
    - [Prompt caching in a fan-out](references/chapter.md#prompt-caching-in-a-fan-out)
    - [Behavior and limits](references/chapter.md#behavior-and-limits)
  - [Manage runs](references/chapter.md#manage-runs)
    - [Resume after a pause](references/chapter.md#resume-after-a-pause)
      - [Which agents run again](references/chapter.md#which-agents-run-again)
      - [Resume after you leave the session](references/chapter.md#resume-after-you-leave-the-session)
    - [When a run hits your usage limit](references/chapter.md#when-a-run-hits-your-usage-limit)
    - [When an agent stalls and restarts](references/chapter.md#when-an-agent-stalls-and-restarts)
    - [Cost](references/chapter.md#cost)
    - [Set a size guideline](references/chapter.md#set-a-size-guideline)
    - [Turn workflows off](references/chapter.md#turn-workflows-off)
  - [Related resources](references/chapter.md#related-resources)
