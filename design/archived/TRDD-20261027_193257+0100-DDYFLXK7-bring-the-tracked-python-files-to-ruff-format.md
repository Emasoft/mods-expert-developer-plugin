---
trdd-id: DDYFLXK7
title: Bring the tracked Python files to ruff format
column: cancelled
status: archived
created: 2026-10-27T19:32:57+0100
updated: 2026-10-31T12:43:36+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: refactor
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-27T19:32:57+0100
---

# Bring the tracked Python files to ruff format

11 of 16 git-tracked .py files fail `ruff format --check` (measured 2026-10-27, TRDD-N9M0FOKO evidence box 7). publish.py runs only `ruff check scripts/`. Decide whether to format them and add `ruff format --check` to the gate.

## Acceptance checklist

- [ ] Decide and, if yes, run ruff format on the 11 failing tracked .py files
- [ ] Decide and, if yes, add `ruff format --check` to the publish.py gate

## Approval log

- 2026-10-27T19:32:57+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-31 — CANCELLED by main-agent@emasoft-mods-expert-developer. Reason: owner ruling of 2026-10-29: Python is linted with ruff check --fix only, never ruff format.
- 2026-10-31T12:43:36+0100 — CANCELLED by main-agent@emasoft-mods-expert-developer. owner ruling of 2026-10-29: Python is linted with ruff check --fix only, never ruff format.
