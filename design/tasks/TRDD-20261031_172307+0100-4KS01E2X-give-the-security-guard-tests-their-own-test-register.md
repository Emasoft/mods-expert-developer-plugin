---
trdd-id: 4KS01E2X
title: Give the security-guard tests their own test register
column: backburner
status: tasked
created: 2026-10-31T17:23:07+0100
updated: 2026-10-31T17:34:45+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: refactor
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-31T17:23:07+0100
eht: [TRDD-3EIBF8Z6]
---

# Give the security-guard tests their own test register

Follow-up of TRDD-R2GILGKU (prose link only: this card has derived cards of its own, so it is not a derived card of R2GILGKU). tests/reference-modules/host-register.ts now wires every security-guard module (trace, taint, egress gate, content guard, peer firewall, HUD with hotkeys s f x) into the register shared by every reference-module test. Find out whether the mod kit stages more than one register file; if it can, give the guard tests their own register; if it cannot, record why the register stays shared and which other tests it could disturb. Done when either outcome is recorded and the full suite passes.

## Approval log

- 2026-10-31T17:23:07+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.

## Derived tasks

EHT TRDD-3EIBF8Z6: on the security-guards branch, security-hud-and-status.md line 42 points readers to HUD_TEST_STYLE in host-register.ts (an earlier check on main missed it, since the skill is not on main yet). Otherwise verified on main and on the security-guards, egress and N1-N2-N5 branches: the register is staged only by tests/test_reference_modules.py (lines 250-252 on main), which changes with the split itself; no other skill text, README or memory page names host-register.ts or host-harness.ts, and the plugin has no tests/README.md. The worker mutation stages that copied the register were scratch scripts outside the repository.
