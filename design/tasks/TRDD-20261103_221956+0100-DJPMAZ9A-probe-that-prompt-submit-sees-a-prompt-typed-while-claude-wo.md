---
trdd-id: DJPMAZ9A
title: Probe that prompt.submit sees a prompt typed while Claude works
column: todo
status: tasked
created: 2026-11-03T22:19:56+0100
updated: 2026-11-03T22:20:21+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: spike
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-03T22:19:56+0100
relevant-rules: [6]
---

# Probe that prompt.submit sees a prompt typed while Claude works

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-03

- Column todo. NPT of TRDD-IG2K6DUY (extract requirements from saved messages and add them to the PRRD); it must be done before increment I2 of that card (the sent time). Nothing run yet.
- Rule served: directive 5 of TRDD-IG2K6DUY (context in conversation order, which needs the time each message was sent) and point 1 of that card: the sent time is recorded by the prompt.submit observer (hooks/requirements-drafts/register.ts:276-293), and that the observer sees a prompt typed while Claude works rests only on a types comment (PromptSubmitInput.turnId, "typed over that turn, or delivered into it"). Two of the five example messages (directives 1 and 3) were typed that way. PRRD G6 (measured assumptions).
- NEXT ACTION: write a throwaway probe mod in a temporary directory outside the project (never in the plugin) whose prompt.submit observer logs, for every prompt, the text length, a hash of the text, turnId, isMeta, origin.kind and the clock time, and passes the prompt on; load it with claude --plugin-dir on the terminal.

## What to measure (raw results under reports_dev/requirements-drafts/)

1. A prompt sent while the session is idle: one log line, turnId absent.
2. A prompt typed while Claude works (a long tool call running): one log line, its time (typed or delivered), and its turnId; record both times if the engine reports them apart.
3. A prompt queued with chat:queueSubmit (ctrl+x enter): the same fields.
4. The same text sent twice: two log lines, so the observer can keep both sent times.
5. Whether any field the observer sees matches the requestId that the UserMessage row of the same message carries (the row save, register.ts:388). If one does, the row save can look the sent time up by id instead of by text, which removes the known limit stated in point 1 of TRDD-IG2K6DUY.
6. The Desktop app (owner-run, Code tab): step 2 again.

## Done when

Each step has its raw result, the probe directory is removed, and point 1 and increment I2 of TRDD-IG2K6DUY are confirmed or corrected from the results.

## Approval log

- 2026-11-03T22:19:56+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
