---
trdd-id: 7K4KVGAM
title: Probe a model call from a mod in the Desktop app
column: todo
status: tasked
created: 2026-11-03T22:19:27+0100
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
approval-datetime: 2026-11-03T22:19:27+0100
relevant-rules: [6]
---

# Probe a model call from a mod in the Desktop app

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-03

- Column todo. NPT of TRDD-IG2K6DUY (extract requirements from saved messages and add them to the PRRD); it must be done before increment I4 of that card. Nothing run yet.
- Rule served: directive 10 of TRDD-IG2K6DUY (Haiku extracts and refines the candidates) and its point 3: the extraction call and the merge call both rest on $.model.complete, and a call from a mod in the Desktop app is UNVERIFIED (hooks run in the Code tab, overview chapter:212, and the docs do not say a model call works there). PRRD G6 (measured assumptions).
- NEXT ACTION: write a throwaway probe mod in a temporary directory outside the project (never in the plugin), with one command that calls $.model.complete with the call shape of point 2 of TRDD-IG2K6DUY (model haiku, a one-line system prompt, the prompt "ping", maxTokens 16) and shows the reply in a toast; run it on the terminal first, then the owner runs it in the Code tab of the Desktop app.

## What to measure (each result with its raw output under reports_dev/requirements-drafts/)

1. Terminal: the command returns isAnswered true and a text reply; record the reply object shape and the latency.
2. Desktop (owner-run, Code tab): the same command with the same model alias; record the same fields, or the exact error text and its kind.
3. The failure shapes on both surfaces: a model alias that does not exist, and a call that runs past its timeout.

## Done when

Both surfaces have a raw result, the probe directory is removed, and TRDD-IG2K6DUY point 3 records the result: on success its UNVERIFIED marker becomes a measured fact; on failure the owner is told before increment I4 starts, because extraction and merge cannot run on Desktop without it.

## Approval log

- 2026-11-03T22:19:27+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
