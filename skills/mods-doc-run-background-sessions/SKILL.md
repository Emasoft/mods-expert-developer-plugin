---
name: mods-doc-run-background-sessions
description: "Use when running a second Claude session in the background. Read-only routing to a community how-to, not Anthropic documentation: asking the user to mint a long-lived token, the launch command, the caller-report prompt, and the attach, logs and stop commands. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# RUN BACKGROUND SESSIONS

## Overview

Routes reads about running background sessions to a community how-to chapter (original text, not Anthropic documentation). Consult it for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the RUN BACKGROUND SESSIONS chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs running background sessions; otherwise stop without opening the chapter.
2. Pick the RUN BACKGROUND SESSIONS section from the Table of Contents under Resources and follow its link.
3. Read only that background sessions section; do not preload this or any other chapter.
4. The token steps are for the user: ask the user to mint the token and to run the launch command in their own terminal; never run the token command, never read `.env.local` or `.env`, never handle the token.
5. Stop when the RUN BACKGROUND SESSIONS section is read: this wrapper routes reads only and authorizes no writes.

## Output

The RUN BACKGROUND SESSIONS section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the RUN BACKGROUND SESSIONS headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Start the background session". Output: open [Start the background session](references/chapter.md#start-the-background-session) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level RUN BACKGROUND SESSIONS table of contents:

- [Who runs what](references/chapter.md#who-runs-what)
- [Security first](references/chapter.md#security-first)
- [Ask the user to mint a long-lived token](references/chapter.md#ask-the-user-to-mint-a-long-lived-token)
- [Start the background session](references/chapter.md#start-the-background-session)
  - [From a Python script](references/chapter.md#from-a-python-script)
- [Write the prompt for an interactive session](references/chapter.md#write-the-prompt-for-an-interactive-session)
- [Talk to the session](references/chapter.md#talk-to-the-session)
- [The three commands](references/chapter.md#the-three-commands)
- [Troubleshooting](references/chapter.md#troubleshooting)
- [See also](references/chapter.md#see-also)
