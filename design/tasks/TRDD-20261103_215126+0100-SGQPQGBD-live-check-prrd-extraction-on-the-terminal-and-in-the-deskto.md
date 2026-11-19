---
trdd-id: SGQPQGBD
title: Live check PRRD extraction on the terminal and in the Desktop app
column: todo
status: tasked
created: 2026-11-03T21:51:26+0100
updated: 2026-11-03T22:23:13+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: audit
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-03T21:51:26+0100
relevant-rules: [7, 14]
---

# Live check PRRD extraction on the terminal and in the Desktop app

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-03

- Column todo. EHT of TRDD-IG2K6DUY; that card cannot reach complete until this one is terminal. Also gates the TRDD-O5LUMKPW hold: no push and no release before it passes.
- Rule served: PRRD G7 (release only after validation) and G14 (a redacted debug log): the log is read during the check.
- NEXT ACTION: after increment I9, on a scratch project with a copy of a PRRD: mark a message with two requirements, one with none, one that updates a rule, and one holding a fake key; on the terminal (fullscreen and classic renderer) and in the Code tab of the Desktop app.
- Expect: the toasts, the PRRD blocks with stamps and sources, prrdgrep lint exit 0, no key in the PRRD, the model prompt, the Jev bodies or the log. A $.model.complete call from a mod on Desktop is measured first by the probe card 7K4KVGAM (an NPT of TRDD-IG2K6DUY); this check confirms it inside the full pipeline. The Desktop part is owner-run.

## Approval log

- 2026-11-03T21:51:26+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
