---
name: mods-doc-test-plugins-with-evals
description: "Use when working on test plugins with evals. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# TEST PLUGINS WITH EVALS

## Overview

Routes reads about test plugins with evals to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the TEST PLUGINS WITH EVALS chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs test plugins with evals; otherwise stop without opening the chapter.
2. Pick the TEST PLUGINS WITH EVALS section from the Table of Contents under Resources and follow its link.
3. Read only that test plugins with evals section; do not preload this or any other chapter.
4. Stop when the TEST PLUGINS WITH EVALS section is read: this wrapper routes reads only and authorizes no writes.

## Output

The TEST PLUGINS WITH EVALS section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the TEST PLUGINS WITH EVALS headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Requirements". Output: open [Requirements](references/chapter.md#requirements) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete TEST PLUGINS WITH EVALS table of contents:

- [Test plugins with evals](references/chapter.md#test-plugins-with-evals-1)
  - [Requirements](references/chapter.md#requirements)
  - [How an eval run works](references/chapter.md#how-an-eval-run-works)
    - [What happens in a run](references/chapter.md#what-happens-in-a-run)
    - [How a case is scored](references/chapter.md#how-a-case-is-scored)
    - [The no-plugin baseline](references/chapter.md#the-no-plugin-baseline)
  - [Create your first eval suite](references/chapter.md#create-your-first-eval-suite)
    - [Write a case manually](references/chapter.md#write-a-case-manually)
      - [Choose graders that give a stable signal](references/chapter.md#choose-graders-that-give-a-stable-signal)
    - [Use a different eval directory](references/chapter.md#use-a-different-eval-directory)
  - [Set up fixtures and mocks](references/chapter.md#set-up-fixtures-and-mocks)
    - [Replay agent mock answers](references/chapter.md#replay-agent-mock-answers)
  - [Run evals](references/chapter.md#run-evals)
    - [Choose what to evaluate](references/chapter.md#choose-what-to-evaluate)
    - [Grant tools](references/chapter.md#grant-tools)
    - [Command options](references/chapter.md#command-options)
  - [Read the results](references/chapter.md#read-the-results)
    - [HTML report](references/chapter.md#html-report)
    - [JSON result](references/chapter.md#json-result)
    - [Trust the plugin directory](references/chapter.md#trust-the-plugin-directory)
  - [Eval suite reference](references/chapter.md#eval-suite-reference)
    - [Grader frontmatter](references/chapter.md#grader-frontmatter)
      - [What a grader can look at](references/chapter.md#what-a-grader-can-look-at)
      - [Grader types](references/chapter.md#grader-types)
  - [Troubleshooting](references/chapter.md#troubleshooting)
    - ["plugin eval is currently in early access"](references/chapter.md#plugin-eval-is-currently-in-early-access)
    - ["plugin eval is currently unavailable"](references/chapter.md#plugin-eval-is-currently-unavailable)
    - ["is not a trusted plugin directory, and this run cannot stop to ask you about it"](references/chapter.md#is-not-a-trusted-plugin-directory-and-this-run-cannot-stop-to-ask-you-about-it)
    - ["No eval cases found"](references/chapter.md#no-eval-cases-found)
    - [The baseline arm shows no plugin, or delta is zero](references/chapter.md#the-baseline-arm-shows-no-plugin-or-delta-is-zero)
    - ["Agent type '...' not found" for one of your plugin's agents](references/chapter.md#agent-type--not-found-for-one-of-your-plugins-agents)
    - [Everything scores zero although the right files were produced](references/chapter.md#everything-scores-zero-although-the-right-files-were-produced)
    - [A regex over the trace doesn't match text I can see](references/chapter.md#a-regex-over-the-trace-doesnt-match-text-i-can-see)
    - [Tools are denied, MCP tools are missing, or Bash won't run](references/chapter.md#tools-are-denied-mcp-tools-are-missing-or-bash-wont-run)
    - [The run exits 1 but the results look fine](references/chapter.md#the-run-exits-1-but-the-results-look-fine)
    - [A grader shows passed: false under a run that scored 1.0](references/chapter.md#a-grader-shows-passed-false-under-a-run-that-scored-10)
    - [Runs fail with a usage-limit or rate-limit error partway through](references/chapter.md#runs-fail-with-a-usage-limit-or-rate-limit-error-partway-through)
    - [Runs time out or hit the turn cap](references/chapter.md#runs-time-out-or-hit-the-turn-cap)
  - [See also](references/chapter.md#see-also)
