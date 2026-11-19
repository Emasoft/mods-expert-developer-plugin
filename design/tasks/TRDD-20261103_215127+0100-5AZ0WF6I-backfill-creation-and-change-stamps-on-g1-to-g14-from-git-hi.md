---
trdd-id: 5AZ0WF6I
title: Backfill creation and change stamps on G1 to G14 from git history
column: todo
status: tasked
created: 2026-11-03T21:51:27+0100
updated: 2026-11-03T21:52:52+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: docs
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-03T21:51:27+0100
relevant-rules: [6]
---

# Backfill creation and change stamps on G1 to G14 from git history

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-03

- Column todo. EHT of TRDD-IG2K6DUY; that card cannot reach complete until this one is terminal. The card itself needs no approval to be prepared; the golden PRRD edit it prepares needs the owner approval at the moment of writing, because G1 to G14 are golden (the card floor stays none so the board records no approval nobody gave).
- Rule served: directive 8 (every rule carries both stamps).
- Values from git log -S and git blame on design/requirements/PRRD.md of branch requirements/integrated-mod-controls (commit time is an upper bound on authoring time): G1 to G7 created and changed 2026-11-03T01:42:30+0100 (fdab237); G8 and G9 created 2026-11-03T01:42:30+0100, changed 2026-11-03T01:58:17+0100 (20cc824); G10 to G14 created and changed 2026-11-03T20:02:09+0100 (8e61f7f).
- The stamps go on a sub-line under each declaration (TRDD-IG2K6DUY point 5), so no version is bumped and no pinned citation changes.
- NEXT ACTION: wait for the owner ruling on Q4 of TRDD-IG2K6DUY (stamp placement) and an owner approval of this golden edit; then add the fourteen stamp lines through prrdgrep edit, run prrdgrep lint, and commit by name.

## Approval log

- 2026-11-03T21:51:27+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
