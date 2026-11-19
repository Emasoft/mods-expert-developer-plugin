---
trdd-id: QWOQBLCF
title: Lint every generated PRRD rule and report the stamp-line check upstream
column: todo
status: tasked
created: 2026-11-03T21:51:27+0100
updated: 2026-11-03T21:51:50+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: infra
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-03T21:51:27+0100
relevant-rules: [6]
---

# Lint every generated PRRD rule and report the stamp-line check upstream

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-03

- Column todo. EHT of TRDD-IG2K6DUY; that card cannot reach complete until this one is terminal.
- Rule served: directive 8 (creation and change stamps on every rule) and PRRD G6.
- The mod runs prrdgrep lint after every write (point 6 of TRDD-IG2K6DUY), but prrdgrep lint does not check the stamp sub-line: its format (%Y-%m-%dT%H:%M:%S%z), that created never moves, that changed moves exactly when the version moves.
- NEXT ACTION: add a test in this plugin that runs the stamp checks of logic.ts over every rule block the writer renders; then, with the owner approval, file an issue on the Emasoft ai-maestro repository asking prrdgrep lint to check the stamp line, and the USER rule prrd-design-rules to document it (that rule is the owner own and is changed by the owner only).

## Approval log

- 2026-11-03T21:51:27+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
