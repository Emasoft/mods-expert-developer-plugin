---
trdd-id: WVPGT6IX
title: Land whole copies of the installed mods under mods-example-mods once CPV issue 267 is fixed
column: blocked
status: tasked
created: 2026-10-27T15:12:12+0100
updated: 2026-10-27T15:14:55+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-27T15:12:12+0100
parent-trdd: 
unblock-when: [issue:Emasoft/claude-plugins-validation#267]
blocked-by: [gh:Emasoft/claude-plugins-validation#267]
pre-block-column: todo
blocker-probe: gh issue view 267 --repo Emasoft/claude-plugins-validation --json state -q .state
blocker-holds-if: match:^OPEN$
blocker-probe-canary: match:^(OPEN|CLOSED)$
---

# Land whole copies of the installed mods under mods-example-mods once CPV issue 267 is fixed

Split out of TRDD-04ZJ9E90 (Revised plan 2026-10-27). Copy each licensed mod WHOLE under skills/mods-example-mods/examples/<mod>/ with its LICENSE (and the Apache LICENSE plus NOTICE for token-weather-usage); point each component reference's 'Full source' line at it. A held copy of context-harness and the inc1 test work are in samples_dev/mods-example-copies/ and git stash@{1} (TRDD-04ZJ9E90 inc1). Blocked on Emasoft/claude-plugins-validation#267 (CPV false positives CMD_INJECTION and CREDENTIAL_DISCOVERY on the copied code). tests/test_no_absolute_paths.py needs per-file exemptions, never a global token.

## Approval log

- 2026-10-27T15:12:12+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.

## STATE

CURRENT STATE 2026-10-27: blocked on Emasoft/claude-plugins-validation#267. trddgrep lint reports BLOCKER-RELEASED here: that is a doctor false positive (with only an external blocker the local list is empty and every() over it is true, trdd-doctor.ts:1379). Do NOT unpark while the blocker-probe prints OPEN. After it prints CLOSED, re-run CPV strict on samples_dev/mods-example-copies/context-harness with the CPV version that ships the fix before moving to todo.
The BLOCKER-RELEASED doctor defect is filed as Emasoft/ai-maestro#188.
