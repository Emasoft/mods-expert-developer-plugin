---
trdd-id: 3EIBF8Z6
title: Update the security HUD reference's pointer to its test style after the register split
column: backburner
status: tasked
created: 2026-10-31T17:34:45+0100
updated: 2026-10-31T17:34:45+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: docs
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-31T17:34:45+0100
---

# Update the security HUD reference's pointer to its test style after the register split

Effect handled for TRDD-4KS01E2X. skills/mods-example-security-guards/references/security-hud-and-status.md (line 42 on the security-guards branch) tells the reader the HUD tests use HUD_TEST_STYLE in tests/reference-modules/host-register.ts. If the guards move to their own register, that pointer names the wrong file. Done when the reference names the file that holds HUD_TEST_STYLE after the split (or the card records that the register stayed shared and the pointer is still right).

## Approval log

- 2026-10-31T17:34:45+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
