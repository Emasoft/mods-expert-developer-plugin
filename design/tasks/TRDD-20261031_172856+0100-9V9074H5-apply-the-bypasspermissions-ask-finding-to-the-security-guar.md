---
trdd-id: 9V9074H5
title: Apply the bypassPermissions ask finding to the security-guards classes
column: backburner
status: tasked
created: 2026-10-31T17:28:56+0100
updated: 2026-10-31T17:28:56+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: bugfix
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-31T17:28:56+0100
---

# Apply the bypassPermissions ask finding to the security-guards classes

Effect handled for TRDD-ZFGRYOU1. Once the live check records whether a mod's tool.check ask reaches a person in bypassPermissions mode, update the security-guards skill: the opener, web-request and connector-write classes (ask), the package-runner class (kept deny because the answer was unknown), the gate's rule that refuses an ask nobody can answer, and the Traps that call it unverified. Done when the classes and their tests match the finding, the UNVERIFIED notes are replaced by the observed result with the date and surface, the kit and pytest pass, and the finding is written as a USER-scope memory note with the Claude Code version it was observed on, since it is an engine behaviour every mod that answers ask depends on.

## Approval log

- 2026-10-31T17:28:56+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
