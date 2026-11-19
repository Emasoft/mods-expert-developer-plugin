---
trdd-id: L7N63IC0
title: Name the two skipped shell wrappers in the splitter once the validator accepts their names
column: backburner
status: tasked
created: 2026-10-31T17:28:54+0100
updated: 2026-10-31T17:28:54+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: bugfix
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-31T17:28:54+0100
---

# Name the two skipped shell wrappers in the splitter once the validator accepts their names

Effect handled for TRDD-JWM1GZNZ. Two wrappers, one that enters another process's namespaces and one that runs a program as another user through polkit, were left out of RUNS_NEXT in shell-command-splitter.md because the validator flags their names as critical, so the program they run is not found. Ordered after TRDD-L4X1FKSZ (the pin move). If TRDD-3762ORXI's word scan has landed and its scratch check shows both wrappers already caught, record that here and decide whether naming them still adds coverage (it would still split their -c lines). Once a validator release no longer flags them (after the pin move), add both to RUNS_NEXT with one test each and remove the sentence saying some wrappers are knowingly not listed. Done when both are in the list, each test fails without its entry, and strict validation stays clean.

## Approval log

- 2026-10-31T17:28:54+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
