---
trdd-id: L4X1FKSZ
title: Move the pinned plugin validator version once its false positives are fixed
column: backburner
status: tasked
created: 2026-10-31T17:28:53+0100
updated: 2026-10-31T17:28:53+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: infra
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-31T17:28:53+0100
---

# Move the pinned plugin validator version once its false positives are fixed

Effect handled for TRDD-JWM1GZNZ. The strict validator is pinned to claude-plugins-validation v5.22.3 in .github/workflows/ci.yml, .github/workflows/release.yml and scripts/publish.py (five places). When a release fixes the false findings reported in the issue (the two wrapper names, the RC-39 matches on inert test strings, and the earlier issues 267 to 269), move every pin to that release in one commit and re-run strict validation on an export of main. Done when every pin names the same fixed release and strict validation passes or shows only findings the owner accepted.

## Approval log

- 2026-10-31T17:28:53+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
