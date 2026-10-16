---
name: mods-doc-models-configuration
description: "Use when working on models configuration. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# MODELS CONFIGURATION

## Overview

Routes reads about models configuration to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the MODELS CONFIGURATION chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs models configuration; otherwise stop without opening the chapter.
2. Pick the MODELS CONFIGURATION section from the Table of Contents under Resources and follow its link.
3. Read only that models configuration section; do not preload this or any other chapter.
4. Stop when the MODELS CONFIGURATION section is read: this wrapper routes reads only and authorizes no writes.

## Output

The MODELS CONFIGURATION section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the MODELS CONFIGURATION headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Available models". Output: open [Available models](references/chapter.md#available-models) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete MODELS CONFIGURATION table of contents:

- [Model configuration](references/chapter.md#model-configuration)
  - [Available models](references/chapter.md#available-models)
    - [Model aliases](references/chapter.md#model-aliases)
    - [Work with Fable](references/chapter.md#work-with-fable)
      - [Fable and usage credits](references/chapter.md#fable-and-usage-credits)
    - [Setting your model](references/chapter.md#setting-your-model)
      - [Set a default model for new sessions](references/chapter.md#set-a-default-model-for-new-sessions)
      - [A new session starts on a different model than you picked](references/chapter.md#a-new-session-starts-on-a-different-model-than-you-picked)
  - [Restrict model selection](references/chapter.md#restrict-model-selection)
    - [Surface coverage](references/chapter.md#surface-coverage)
    - [Default model behavior](references/chapter.md#default-model-behavior)
    - [Enforce the allowlist for the Default model](references/chapter.md#enforce-the-allowlist-for-the-default-model)
    - [Control the model users run on](references/chapter.md#control-the-model-users-run-on)
    - [Merge behavior](references/chapter.md#merge-behavior)
    - [Mantle model IDs](references/chapter.md#mantle-model-ids)
    - [Block specific models or versions](references/chapter.md#block-specific-models-or-versions)
    - [Organization model restrictions](references/chapter.md#organization-model-restrictions)
  - [Organization default model](references/chapter.md#organization-default-model)
  - [Organization effort limits](references/chapter.md#organization-effort-limits)
  - [Special model behavior](references/chapter.md#special-model-behavior)
    - [`default` model setting](references/chapter.md#default-model-setting)
    - [`opusplan` model setting](references/chapter.md#opusplan-model-setting)
    - [Fallback model chains](references/chapter.md#fallback-model-chains)
    - [Automatic model fallback](references/chapter.md#automatic-model-fallback)
      - [Effort level after a fallback](references/chapter.md#effort-level-after-a-fallback)
      - [Check what triggered fallback](references/chapter.md#check-what-triggered-fallback)
      - [Ask before switching](references/chapter.md#ask-before-switching)
      - [Enable fallback on Bedrock, Agent Platform, and Foundry](references/chapter.md#enable-fallback-on-bedrock-agent-platform-and-foundry)
      - [Security research and biology workloads](references/chapter.md#security-research-and-biology-workloads)
    - [Adjust effort level](references/chapter.md#adjust-effort-level)
      - [Choose an effort level](references/chapter.md#choose-an-effort-level)
      - [Use ultrathink for one-off deep reasoning](references/chapter.md#use-ultrathink-for-one-off-deep-reasoning)
      - [Set the effort level](references/chapter.md#set-the-effort-level)
      - [Adaptive reasoning and fixed thinking budgets](references/chapter.md#adaptive-reasoning-and-fixed-thinking-budgets)
    - [Extended thinking](references/chapter.md#extended-thinking)
    - [Extended context](references/chapter.md#extended-context)
      - [Select 1M context for Opus 4.6 or Sonnet 4.6](references/chapter.md#select-1m-context-for-opus-46-or-sonnet-46)
      - [Context window behind an LLM gateway](references/chapter.md#context-window-behind-an-llm-gateway)
      - [Turn off 1M context](references/chapter.md#turn-off-1m-context)
      - [Haiku 5.5 context window and pricing](references/chapter.md#haiku-55-context-window-and-pricing)
  - [Context window and auto-compaction](references/chapter.md#context-window-and-auto-compaction)
    - [Set the auto-compact window](references/chapter.md#set-the-auto-compact-window)
    - [Default auto-compact thresholds](references/chapter.md#default-auto-compact-thresholds)
    - [Correct the window for a gateway or custom model ID](references/chapter.md#correct-the-window-for-a-gateway-or-custom-model-id)
  - [Checking your current model](references/chapter.md#checking-your-current-model)
  - [Add a custom model option](references/chapter.md#add-a-custom-model-option)
  - [Environment variables](references/chapter.md#environment-variables)
    - [Pin models for third-party deployments](references/chapter.md#pin-models-for-third-party-deployments)
    - [Customize pinned model display and capabilities](references/chapter.md#customize-pinned-model-display-and-capabilities)
    - [Override model IDs per version](references/chapter.md#override-model-ids-per-version)
    - [Prompt caching configuration](references/chapter.md#prompt-caching-configuration)
  - [Version history](references/chapter.md#version-history)
