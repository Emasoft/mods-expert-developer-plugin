---
trdd-id: 0E8J4YEP
title: Credit jr-polish in NOTICE if any of its code or prompt text is adapted
column: todo
status: tasked
created: 2026-11-03T21:51:26+0100
updated: 2026-11-03T21:51:49+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: docs
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-03T21:51:26+0100
relevant-rules: [7]
---

# Credit jr-polish in NOTICE if any of its code or prompt text is adapted

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-03

- Column todo. EHT of TRDD-IG2K6DUY; that card cannot reach complete until this one is terminal.
- Rule served: directive 2 (take example from jr-polish) and the license of jr-polish (MIT, by jrlprost, https://github.com/jrlprost/claude-code-mods); PRRD G7 (release only after validation).
- The design reuses only the call shape of jr-polish ($.model.complete with model, system, prompt, maxTokens; a userConfig model option defaulting to haiku) and writes its own extraction prompt, so no credit may be owed.
- NEXT ACTION: when increments I4 and I6 of TRDD-IG2K6DUY are written, compare their prompt text and reply cleaning with hooks/polish.ts:1-14 of jr-polish 0.2.0; if any text or code is adapted, add a NOTICE paragraph with the MIT license text of jrlprost and a README credit line; if none is, record that finding here and close the card.

## Approval log

- 2026-11-03T21:51:26+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
