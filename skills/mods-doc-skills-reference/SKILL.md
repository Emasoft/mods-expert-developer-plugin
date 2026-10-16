---
name: mods-doc-skills-reference
description: "Use when working on skills reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# SKILLS REFERENCE

## Overview

Routes reads about skills reference to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the SKILLS REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs skills reference; otherwise stop without opening the chapter.
2. Pick the SKILLS REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that skills reference section; do not preload this or any other chapter.
4. Stop when the SKILLS REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The SKILLS REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the SKILLS REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Bundled skills". Output: open [Bundled skills](references/chapter.md#bundled-skills) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete SKILLS REFERENCE table of contents:

- [Extend Claude with skills](references/chapter.md#extend-claude-with-skills)
  - [Bundled skills](references/chapter.md#bundled-skills)
    - [Check your setup with `/doctor`](references/chapter.md#check-your-setup-with-doctor)
    - [Run and verify your app](references/chapter.md#run-and-verify-your-app)
    - [Run your checks before each commit](references/chapter.md#run-your-checks-before-each-commit)
    - [Work on Claude API projects](references/chapter.md#work-on-claude-api-projects)
  - [Getting started](references/chapter.md#getting-started)
    - [Create your first skill](references/chapter.md#create-your-first-skill)
    - [Resolve skills that share a name](references/chapter.md#resolve-skills-that-share-a-name)
      - [Where synced skills load](references/chapter.md#where-synced-skills-load)
      - [When a synced skill name matches another command](references/chapter.md#when-a-synced-skill-name-matches-another-command)
      - [How Claude Code handles the frontmatter of a synced skill](references/chapter.md#how-claude-code-handles-the-frontmatter-of-a-synced-skill)
      - [How Claude Code handles the body of a synced skill](references/chapter.md#how-claude-code-handles-the-body-of-a-synced-skill)
    - [Remove a skill](references/chapter.md#remove-a-skill)
  - [Configure skills](references/chapter.md#configure-skills)
    - [Types of skill content](references/chapter.md#types-of-skill-content)
    - [Frontmatter reference](references/chapter.md#frontmatter-reference)
      - [Using skill frontmatter outside Claude Code](references/chapter.md#using-skill-frontmatter-outside-claude-code)
      - [How a skill gets its command name](references/chapter.md#how-a-skill-gets-its-command-name)
      - [Available string substitutions](references/chapter.md#available-string-substitutions)
    - [Add supporting files](references/chapter.md#add-supporting-files)
    - [Control who invokes a skill](references/chapter.md#control-who-invokes-a-skill)
      - [Where you write the skill's name](references/chapter.md#where-you-write-the-skills-name)
    - [Skill content lifecycle](references/chapter.md#skill-content-lifecycle)
    - [Pre-approve tools for a skill](references/chapter.md#pre-approve-tools-for-a-skill)
      - [When only managed permission rules apply](references/chapter.md#when-only-managed-permission-rules-apply)
    - [Pass arguments to skills](references/chapter.md#pass-arguments-to-skills)
  - [Advanced patterns](references/chapter.md#advanced-patterns)
    - [Inject dynamic context](references/chapter.md#inject-dynamic-context)
      - [How injected commands run](references/chapter.md#how-injected-commands-run)
      - [When an injected command fails](references/chapter.md#when-an-injected-command-fails)
      - [Permission checks on injected commands](references/chapter.md#permission-checks-on-injected-commands)
    - [Run skills in a subagent](references/chapter.md#run-skills-in-a-subagent)
      - [Example: Research skill using Explore agent](references/chapter.md#example-research-skill-using-explore-agent)
    - [Restrict Claude's skill access](references/chapter.md#restrict-claudes-skill-access)
    - [Override skill visibility from settings](references/chapter.md#override-skill-visibility-from-settings)
    - [Find unused skills](references/chapter.md#find-unused-skills)
  - [Evaluate and iterate on a skill](references/chapter.md#evaluate-and-iterate-on-a-skill)
    - [Run evals with skill-creator](references/chapter.md#run-evals-with-skill-creator)
  - [Share skills](references/chapter.md#share-skills)
    - [Generate visual output](references/chapter.md#generate-visual-output)
  - [Troubleshooting](references/chapter.md#troubleshooting)
    - [Skill not triggering](references/chapter.md#skill-not-triggering)
    - [Skill triggers too often](references/chapter.md#skill-triggers-too-often)
    - [Claude stops following a skill](references/chapter.md#claude-stops-following-a-skill)
    - [Skill descriptions are cut short](references/chapter.md#skill-descriptions-are-cut-short)
    - [Personal skills disappeared](references/chapter.md#personal-skills-disappeared)
  - [Related resources](references/chapter.md#related-resources)
