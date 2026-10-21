---
trdd-id: 1Y56FYZW
title: The release gate lets a later less severe CPV summary override an earlier CRITICAL one
column: backburner
status: tasked
created: 2026-10-21T20:14:32+0200
updated: 2026-10-21T20:14:32+0200
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: bugfix
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-21T20:14:32+0200
---

# The release gate lets a later less severe CPV summary override an earlier CRITICAL one

## Problem
In scripts/publish.py, the docstring and comments of _cpv_verdict describe earlier SUMMARY lines as a blocking floor. Per a reading of the code (the floor is applied only inside 'if severity is None'), the floor holds only when the FINAL summary is clean. So an earlier CRITICAL summary, followed by a final MAJOR summary with exit 2, is reported as MAJOR. This was found by reading the code; no test covers it. The fix is either to apply the floor in every case with a test for that case, or to make the docstring match the code. Moved here from TRDD-UNWAW14S so it is visible on the board.

## Approval log

- 2026-10-21T20:14:32+0200 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
