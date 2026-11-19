---
trdd-id: JWM1GZNZ
title: File a CPV issue for false critical and RC-39 findings on the security-guards skill
column: backburner
status: tasked
created: 2026-10-31T17:23:08+0100
updated: 2026-10-31T17:38:42+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: docs
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-31T17:23:08+0100
eht: [TRDD-L4X1FKSZ, TRDD-L7N63IC0]
---

# File a CPV issue for false critical and RC-39 findings on the security-guards skill

Follow-up of TRDD-R2GILGKU (prose link only: this card has derived cards of its own, so it is not a derived card of R2GILGKU). The plugin validator flags two shell wrapper names as critical even in a spelling list, and RC-39 flags inert test strings (a redirection to a shell start-up file, the crontab listing command, a LaunchAgents path) in tests/reference-modules/egress-classes.test.ts. File one issue on the Emasoft claude-plugins-validation repo with the exact lines and why they are inert. Outward-facing: needs the owner's go-ahead before filing. Done when the issue URL is recorded here and its two EHTs are terminal: this card deliberately stays open until the validator release that fixes the issue lands and the pin moves, so the follow-through is not forgotten. Gated on the owner by staying in backburner until the go-ahead is recorded.

## Approval log

- 2026-10-31T17:23:08+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.

## Derived tasks

EHT TRDD-L4X1FKSZ (move the validator pin in ci.yml, release.yml and scripts/publish.py) and TRDD-L7N63IC0 (name the two skipped wrappers once accepted). Gated on the owner: min-approval-requirement is user, since filing an issue is outward-facing.
After filing: record the issue URL here, set unblock-when to [issue:<url> closed] and move this card to blocked, so it does not claim work while it waits on the upstream release.
